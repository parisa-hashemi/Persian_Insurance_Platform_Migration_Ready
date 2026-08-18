import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Send,
  User,
  Shield,
  CreditCard,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ClaimCase, CrmFollowUpTask, UserSession, CustomerNotification } from '../../types';
import { saveCustomerNotifications, loadCustomerNotifications } from '../../lib/storage';

interface CrmOverdueActionsCardProps {
  session: UserSession;
  cases: ClaimCase[];
  followUps: CrmFollowUpTask[];
  onUpdateCase: (updated: ClaimCase) => void;
  onUpdateFollowUps: (tasks: CrmFollowUpTask[]) => void;
  onSelectCase: (caseId: string) => void;
  onOpenCallModal: (customerPhone: string, customerName: string, caseId: string, role?: string) => void;
}

export const CrmOverdueActionsCard: React.FC<CrmOverdueActionsCardProps> = ({
  session,
  cases,
  followUps,
  onUpdateCase,
  onUpdateFollowUps,
  onSelectCase,
  onOpenCallModal
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'EXPERT_REQUEST' | 'MISSING_IBAN' | 'MISSING_DOCS' | 'UNCONFIRMED'>('ALL');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Quick SMS Modal State
  const [smsTargetCase, setSmsTargetCase] = useState<ClaimCase | null>(null);
  const [smsTargetPhone, setSmsTargetPhone] = useState<string>('');
  const [smsTargetName, setSmsTargetName] = useState<string>('');
  const [smsTemplateType, setSmsTemplateType] = useState<string>('IBAN');
  const [smsCustomMessage, setSmsCustomMessage] = useState<string>('');

  // 1. Identify Overdue / Delayed Cases that require Customer Support Contact
  const overdueItems = useMemo(() => {
    const list: Array<{
      id: string;
      caseId: string;
      caseObj: ClaimCase;
      customerName: string;
      customerPhone: string;
      customerRole: string;
      reasonType: 'EXPERT_REQUEST' | 'MISSING_IBAN' | 'MISSING_DOCS' | 'UNCONFIRMED';
      reasonTitle: string;
      reasonDetail: string;
      requestedBy?: string;
      requestedRole?: string;
      priority: 'عادی' | 'مهم' | 'فوری و بحرانی';
      createdAt: string;
      matchedTask?: CrmFollowUpTask;
    }> = [];

    // A. Cases with direct Expert Requests or Overdue Follow-up tasks
    followUps.forEach(task => {
      if (task.status === 'در انتظار انجام' || task.status === 'در حال پیگیری') {
        const cObj = cases.find(c => c.id === task.caseId);
        if (cObj) {
          list.push({
            id: `task-${task.id}`,
            caseId: task.caseId || cObj.id,
            caseObj: cObj,
            customerName: task.customerName || cObj.victimName,
            customerPhone: task.customerPhone || cObj.victimPhone,
            customerRole: task.customerRole || 'زیان‌دیده',
            reasonType: task.requestedByName ? 'EXPERT_REQUEST' : 'MISSING_DOCS',
            reasonTitle: task.reason,
            reasonDetail: task.notes || 'درخواست رسیدگی و هماهنگی با مشتری',
            requestedBy: task.requestedByName || 'کارشناس ارزیاب سامانه',
            requestedRole: task.requestedByRole || 'ارزیاب خسارت',
            priority: task.priority || 'مهم',
            createdAt: task.createdAt,
            matchedTask: task
          });
        }
      }
    });

    // B. System-detected Overdue Cases (Missing IBAN for payout)
    cases.forEach(c => {
      const alreadyInList = list.some(item => item.caseId === c.id);
      if (alreadyInList) return;

      // 1. Approved but Missing IBAN
      if (c.status === 'در انتظار پرداخت' && (!c.payoutInfo?.iban || c.payoutInfo?.verification === 'FAILED')) {
        list.push({
          id: `auto-iban-${c.id}`,
          caseId: c.id,
          caseObj: c,
          customerName: c.victimName,
          customerPhone: c.victimPhone,
          customerRole: 'زیان‌دیده',
          reasonType: 'MISSING_IBAN',
          reasonTitle: 'عدم ثبت شماره شبا جهت واریز حواله خسارت',
          reasonDetail: 'مبلغ ارزیابی تایید شده است ولی زیان‌دیده هنوز شبای معتبر ۲۴ رقمی را ثبت نکرده است.',
          priority: 'فوری و بحرانی',
          createdAt: c.createdAt || new Date().toLocaleDateString('fa-IR')
        });
      }
      // 2. Pending customer approval or dispute
      else if (c.status === 'در انتظار تایید زیان‌دیده' || c.status === 'در انتظار تایید کاربر') {
        list.push({
          id: `auto-approval-${c.id}`,
          caseId: c.id,
          caseObj: c,
          customerName: c.victimName,
          customerPhone: c.victimPhone,
          customerRole: 'زیان‌دیده',
          reasonType: 'UNCONFIRMED',
          reasonTitle: 'عدم تایید ارزیابی توسط زیان‌دیده (تعویق بررسی)',
          reasonDetail: 'گزارش ارزیابی آماده شده است ولی زیان‌دیده اقدام به تایید یا ثبت اعتراض ننموده است.',
          priority: 'مهم',
          createdAt: c.createdAt || new Date().toLocaleDateString('fa-IR')
        });
      }
      // 3. Pending document requests
      else if (c.docRequests?.some(d => d.status === 'ارسال شد - در انتظار کاربر')) {
        const pendingDoc = c.docRequests.find(d => d.status === 'ارسال شد - در انتظار کاربر');
        list.push({
          id: `auto-docs-${c.id}`,
          caseId: c.id,
          caseObj: c,
          customerName: c.victimName,
          customerPhone: c.victimPhone,
          customerRole: 'زیان‌دیده',
          reasonType: 'MISSING_DOCS',
          reasonTitle: `نقص مدرک: ${pendingDoc?.documentType || 'تصاویر تکمیلی'}`,
          reasonDetail: `کارشناس درخواست مدرک «${pendingDoc?.documentType}» را ارسال کرده ولی پاسخی از سمت مشتری نیامده است.`,
          priority: 'مهم',
          createdAt: c.createdAt || new Date().toLocaleDateString('fa-IR')
        });
      }
    });

    return list;
  }, [cases, followUps]);

  // Filtered List
  const filteredOverdue = useMemo(() => {
    if (filterType === 'ALL') return overdueItems;
    return overdueItems.filter(item => item.reasonType === filterType);
  }, [overdueItems, filterType]);

  // Handle Quick SMS Dispatch
  const handleOpenSmsModal = (item: typeof overdueItems[0]) => {
    setSmsTargetCase(item.caseObj);
    setSmsTargetPhone(item.customerPhone);
    setSmsTargetName(item.customerName);

    if (item.reasonType === 'MISSING_IBAN') {
      setSmsTemplateType('IBAN');
      setSmsCustomMessage(`مشتری گرامی ${item.customerName}، ارزیابی خسارت پرونده ${item.caseId} نهایی گردید. جهت واریز مستقیم وجه به حسابتان، لطفاً وارد سامانه شده و شماره شبای ۲۴ رقمی خود را ثبت فرمایید.`);
    } else if (item.reasonType === 'MISSING_DOCS') {
      setSmsTemplateType('DOCS');
      setSmsCustomMessage(`مشتری گرامی ${item.customerName}، جهت تکمیل فرآیند ارزیابی پرونده ${item.caseId}، لطفاً تصویر مدارک درخواستی کارشناس را در پورتال بارگذاری فرمایید.`);
    } else {
      setSmsTemplateType('GENERAL');
      setSmsCustomMessage(`مشتری گرامی ${item.customerName}، پیرو پرونده خسارت ${item.caseId}، لطفاً با مرکز امور مشتریان تماس حاصل فرمایید یا وضعیت پرونده خود را در سامانه بررسی فرمایید.`);
    }
  };

  const handleSendQuickSms = () => {
    if (!smsTargetCase || !smsTargetPhone || !smsCustomMessage.trim()) return;

    const notif: CustomerNotification = {
      id: `sms-crm-overdue-${Date.now()}`,
      type: 'SMS',
      caseId: smsTargetCase.id,
      recipientPhone: smsTargetPhone,
      title: 'پیامک یادآوری پیگیری پرونده خسارت',
      message: smsCustomMessage.trim(),
      sentAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    const currentCustomerNotifs = loadCustomerNotifications();
    saveCustomerNotifications([notif, ...currentCustomerNotifs]);

    // Update case history
    const updatedHistory = [
      ...(smsTargetCase.history || []),
      {
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        action: `ارسال پیامک یادآوری CRM به ${smsTargetName} (${smsTargetPhone}): «${smsCustomMessage.slice(0, 40)}...»`,
        actor: session.name,
        role: 'امور مشتریان'
      }
    ];

    onUpdateCase({
      ...smsTargetCase,
      history: updatedHistory
    });

    setSuccessNotice(`پیامک یادآوری با موفقیت به ${smsTargetName} (${smsTargetPhone}) ارسال شد.`);
    setSmsTargetCase(null);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  // Mark Overdue Resolved
  const handleResolveItem = (item: typeof overdueItems[0]) => {
    if (item.matchedTask) {
      const updated = followUps.map(t => {
        if (t.id !== item.matchedTask?.id) return t;
        return {
          ...t,
          status: 'تکمیل و رفع مانع' as const,
          completedAt: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
          resolution: `تماس توسط امور مشتریان (${session.name}) انجام شد و موانع مرتفع گردید.`
        };
      });
      onUpdateFollowUps(updated);
    }

    const updatedHistory = [
      ...(item.caseObj.history || []),
      {
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        action: `رفع وضعیت تعویق پرونده توسط امور مشتریان (${session.name})`,
        actor: session.name,
        role: 'امور مشتریان'
      }
    ];

    onUpdateCase({
      ...item.caseObj,
      history: updatedHistory
    });

    setSuccessNotice(`پرونده ${item.caseId} از لیست اقدامات معوق خارج و رفع مانع گردید.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                اقدامات معوق و نیازمند تماس فوری با مشتریان
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-black text-xs shadow-xs animate-pulse">
                {overdueItems.length} اقدام
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              پرونده‌های دچار تعویق، درخواست‌های تماس از کارشناسان، نقص مدارک و عدم ثبت شماره شبا
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه ({overdueItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('EXPERT_REQUEST')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'EXPERT_REQUEST'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            درخواست کارشناسان ({overdueItems.filter(i => i.reasonType === 'EXPERT_REQUEST').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('MISSING_IBAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'MISSING_IBAN'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            عدم ثبت شبا ({overdueItems.filter(i => i.reasonType === 'MISSING_IBAN').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('MISSING_DOCS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'MISSING_DOCS'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            نقص مدرک ({overdueItems.filter(i => i.reasonType === 'MISSING_DOCS').length})
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-100 border border-emerald-400 rounded-2xl text-emerald-950 text-xs font-black flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* List of Overdue Items */}
      {filteredOverdue.length === 0 ? (
        <div className="p-8 text-center bg-amber-50/50 rounded-2xl border border-amber-200 text-amber-950 space-y-2">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
          <p className="text-sm font-black">اقدام معوقی در این دسته‌بندی وجود ندارد!</p>
          <p className="text-xs text-slate-600">تمام پرونده‌ها در وضعیت روان قرار دارند و نیازی به تماس فوری نیست.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOverdue.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-amber-50/40 border border-amber-300/80 hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      item.reasonType === 'EXPERT_REQUEST'
                        ? 'bg-purple-700 text-white'
                        : item.reasonType === 'MISSING_IBAN'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {item.reasonType === 'EXPERT_REQUEST'
                        ? 'درخواست کارشناس'
                        : item.reasonType === 'MISSING_IBAN'
                        ? 'فاقد شبا'
                        : item.reasonType === 'MISSING_DOCS'
                        ? 'نقص مدرک'
                        : 'عدم تایید زیان‌دیده'}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectCase(item.caseId)}
                      className="text-xs font-black text-blue-900 hover:underline flex items-center gap-1"
                    >
                      <span>پرونده {item.caseId}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.createdAt}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
                    {item.reasonTitle}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                    {item.reasonDetail}
                  </p>
                </div>

                {/* Customer and Requester Info */}
                <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-800 font-bold">
                    <span>مخاطب تماس: {item.customerName} ({item.customerRole})</span>
                    <span className="font-mono text-blue-900 font-extrabold">{item.customerPhone}</span>
                  </div>
                  {item.requestedBy && (
                    <div className="flex items-center justify-between text-purple-900 text-[10px] pt-1 border-t border-slate-100 font-bold">
                      <span>👤 تقاضای پیگیری از: {item.requestedBy}</span>
                      <span>({item.requestedRole || 'کارشناس ارزیاب'})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-500 text-[10px] pt-0.5">
                    <span>خودرو: {item.caseObj.carType}</span>
                    <span>شرکت بیمه: {item.caseObj.insurerName || 'بیمه ایران'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenCallModal(item.customerPhone, item.customerName, item.caseId, item.customerRole)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>تماس فوری</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSmsModal(item)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال پیامک</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleResolveItem(item)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  title="ثبت نتیجه و خروج از معوقات"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                  <span>رفع تعویق</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK SMS MODAL */}
      {smsTargetCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-amber-400">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Send className="w-4 h-4 text-amber-600" />
                <span>ارسال پیامک یادآوری به {smsTargetName}</span>
              </div>
              <button
                type="button"
                onClick={() => setSmsTargetCase(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>شماره پرونده: {smsTargetCase.id}</span>
                <span className="font-mono text-blue-900">{smsTargetPhone}</span>
              </div>
              <div className="text-slate-600">
                خودرو: {smsTargetCase.carType} ({smsTargetCase.plateNumber || smsTargetCase.victimPlate})
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                متن پیامک ارسالی:
              </label>
              <textarea
                rows={4}
                value={smsCustomMessage}
                onChange={(e) => setSmsCustomMessage(e.target.value)}
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSendQuickSms}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>ارسال فوری پیامک یادآوری</span>
              </button>

              <button
                type="button"
                onClick={() => setSmsTargetCase(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
