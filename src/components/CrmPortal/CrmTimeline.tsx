import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  PhoneCall,
  MessageSquare,
  Shield,
  CreditCard,
  User,
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';
import { ClaimCase, CustomerTicket, CustomerCallLog, CrmFollowUpTask } from '../../types';

interface CrmTimelineProps {
  claimCase: ClaimCase;
  tickets?: CustomerTicket[];
  callLogs?: CustomerCallLog[];
  followUps?: CrmFollowUpTask[];
}

interface TimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
  actorRole: string;
  type: 'INTAKE' | 'EVIDENCE' | 'ASSESSMENT' | 'REVIEW' | 'PAYOUT' | 'COMPLAINT' | 'CALL' | 'FOLLOWUP' | 'STATUS';
  isCustomerSafe: boolean;
}

export const CrmTimeline: React.FC<CrmTimelineProps> = ({
  claimCase,
  tickets = [],
  callLogs = [],
  followUps = []
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [onlyCustomerSafe, setOnlyCustomerSafe] = useState(false);

  // Aggregated unified timeline
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // 1. Case History
    if (claimCase.history && Array.isArray(claimCase.history)) {
      claimCase.history.forEach((h, idx) => {
        items.push({
          id: `hist-${idx}`,
          timestamp: h.time,
          title: `تغییر وضعیت به «${h.status}»`,
          description: h.note || 'وضعیت پرونده به‌روزرسانی شد.',
          actor: h.user || 'سیستم',
          actorRole: h.userRole || 'گردش کار',
          type: 'STATUS',
          isCustomerSafe: true
        });
      });
    }

    // 2. Doc Requests
    if (claimCase.docRequests && Array.isArray(claimCase.docRequests)) {
      claimCase.docRequests.forEach((d, idx) => {
        items.push({
          id: `doc-${idx}`,
          timestamp: d.requestedAt || claimCase.date,
          title: `درخواست مدرک: ${d.docType}`,
          description: `${d.description || 'درخواست بارگذاری مدرک یا عکس جدید'} (وضعیت: ${d.status})`,
          actor: d.requestedBy || 'ارزیاب خسارت',
          actorRole: 'ارزیابی',
          type: 'EVIDENCE',
          isCustomerSafe: true
        });
      });
    }

    // 3. Assessment
    if (claimCase.assessment?.submittedAt) {
      items.push({
        id: 'assess-submit',
        timestamp: claimCase.assessment.submittedAt,
        title: 'ثبت برآورد و گزارش ارزیابی خسارت',
        description: `گزارش رسمی ارزیابی با مبلغ برآورد ثبت و جهت ممیزی به ناظر ارجاع گردید.`,
        actor: claimCase.assignedExpert?.name || 'ارزیاب خسارت',
        actorRole: 'کارشناس رسمی',
        type: 'ASSESSMENT',
        isCustomerSafe: true
      });
    }

    // 4. Reviewer Approval / Return
    if (claimCase.reviewerApproval?.approvedAt) {
      items.push({
        id: 'rev-appr',
        timestamp: claimCase.reviewerApproval.approvedAt,
        title: 'تایید و تصویب برآورد توسط ناظر ارشد',
        description: claimCase.reviewerApproval.note || 'ممیزی فنی و قانونی پرونده تایید شد و ابلاغیه صادر گردید.',
        actor: claimCase.reviewerApproval.approvedBy || 'ناظر بازبینی',
        actorRole: 'بازبینی و نظارت',
        type: 'REVIEW',
        isCustomerSafe: true
      });
    }

    if (claimCase.reviewerReturn?.returnedAt) {
      items.push({
        id: 'rev-ret',
        timestamp: claimCase.reviewerReturn.returnedAt,
        title: 'بازگشت پرونده جهت اصلاح محاسبات ارزیاب',
        description: `علت بازگشت: ${claimCase.reviewerReturn.reason}`,
        actor: claimCase.reviewerReturn.returnedBy || 'ناظر بازبینی',
        actorRole: 'بازبینی و نظارت',
        type: 'REVIEW',
        isCustomerSafe: false // Internal only
      });
    }

    // 5. Payout / Finance
    if (claimCase.payoutInfo?.paidDate) {
      items.push({
        id: 'payout-paid',
        timestamp: claimCase.payoutInfo.paidDate,
        title: 'تسویه مالی و واریز وجه خسارت به شماره شبا',
        description: `حواله پرداخت پایا با شماره پیگیری ${claimCase.payoutInfo.trackingRef || 'بانک مرکزی'} واریز شد.`,
        actor: 'خزانه‌داری و امور مالی',
        actorRole: 'مالی',
        type: 'PAYOUT',
        isCustomerSafe: true
      });
    }

    // 6. Tickets & Complaints
    const caseTickets = tickets.filter(t => t.caseId === claimCase.id);
    caseTickets.forEach(t => {
      items.push({
        id: `tck-${t.id}`,
        timestamp: t.createdAt,
        title: `ثبت شکایت / تیکت: ${t.subject}`,
        description: `دسته‌بندی: ${t.category} • اولویت: ${t.priority} • وضعیت: ${t.status}`,
        actor: t.customerName,
        actorRole: t.customerRole,
        type: 'COMPLAINT',
        isCustomerSafe: true
      });
    });

    // 7. Call Logs
    const caseCalls = callLogs.filter(cl => cl.caseId === claimCase.id);
    caseCalls.forEach(cl => {
      items.push({
        id: `call-${cl.id}`,
        timestamp: `${cl.callDate} ${cl.callTime}`,
        title: `مکالمه ${cl.callDirection}: ${cl.topic}`,
        description: cl.notes,
        actor: cl.agentName,
        actorRole: 'کارشناس CRM',
        type: 'CALL',
        isCustomerSafe: true
      });
    });

    // 8. Follow-ups
    const caseFollowUps = followUps.filter(f => f.caseId === claimCase.id);
    caseFollowUps.forEach(f => {
      items.push({
        id: `flw-${f.id}`,
        timestamp: f.createdAt,
        title: `وظیفه پیگیری: ${f.reason}`,
        description: `ارجاع به واحد ${f.targetDepartment} • مهلت: ${f.dueDate} • وضعیت: ${f.status}`,
        actor: f.assignedAgent,
        actorRole: 'امور مشتریان',
        type: 'FOLLOWUP',
        isCustomerSafe: false
      });
    });

    // Sort descending by timestamp
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [claimCase, tickets, callLogs, followUps]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return timelineItems.filter(item => {
      if (onlyCustomerSafe && !item.isCustomerSafe) return false;
      if (filterType !== 'ALL' && item.type !== filterType) return false;
      return true;
    });
  }, [timelineItems, onlyCustomerSafe, filterType]);

  const getTypeBadge = (type: TimelineItem['type']) => {
    switch (type) {
      case 'STATUS':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'وضعیت گردش‌کار' };
      case 'EVIDENCE':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: 'مدارک و کروکی' };
      case 'ASSESSMENT':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'ارزیابی خسارت' };
      case 'REVIEW':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'بازبینی و نظارت' };
      case 'PAYOUT':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'مالی و تسویه' };
      case 'COMPLAINT':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'شکایت و تیکت' };
      case 'CALL':
        return { bg: 'bg-teal-50 text-teal-700 border-teal-200', label: 'تماس تلفنی' };
      case 'FOLLOWUP':
        return { bg: 'bg-orange-50 text-orange-800 border-orange-200', label: 'پیگیری داخلی' };
      default:
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: 'رویداد' };
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              تایم‌لاین یکپارچه و امن پرونده خسارت
            </h3>
            <p className="text-xs text-slate-500">
              تجمیع وقایع پذیرش، کارشناسی، بازبینی، مالی، شکایات و مکالمات ثبت‌شده
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnlyCustomerSafe(!onlyCustomerSafe)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              onlyCustomerSafe
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {onlyCustomerSafe ? '✓ فقط رویدادهای قابل اعلام به مشتری' : 'نمایش همه رویدادها (شامل یادداشت‌های داخلی)'}
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-r-2 border-slate-200 mr-3 pr-5 space-y-5">
        {filteredItems.map((item, idx) => {
          const badge = getTypeBadge(item.type);
          return (
            <div key={item.id || idx} className="relative group">
              {/* Dot */}
              <div className="absolute -right-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform shadow-2xs"></div>

              <div className="bg-slate-50/80 border border-slate-200/80 hover:border-indigo-200 rounded-2xl p-4 space-y-2 transition-all shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">{item.timestamp}</span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{item.description}</p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>
                    ثبت‌کننده: <strong className="text-slate-800">{item.actor}</strong> ({item.actorRole})
                  </span>
                  {!item.isCustomerSafe && (
                    <span className="text-amber-800 font-bold text-[10px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      🔒 یادداشت محرمانه داخلی CRM
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">
            رویدادی با فیلتر انتخابی یافت نشد.
          </div>
        )}
      </div>
    </div>
  );
};
