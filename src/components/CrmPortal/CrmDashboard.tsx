import React, { useMemo } from 'react';
import {
  Headphones,
  Users,
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Search,
  Plus,
  Send
} from 'lucide-react';
import { ClaimCase, CustomerTicket, CustomerCallLog, CrmFollowUpTask, UserSession } from '../../types';
import { UnifiedCustomerProfile, formatCurrency } from './crmHelpers';

interface CrmDashboardProps {
  session: UserSession;
  cases: ClaimCase[];
  customers: UnifiedCustomerProfile[];
  tickets: CustomerTicket[];
  callLogs: CustomerCallLog[];
  followUps: CrmFollowUpTask[];
  onSelectCustomer: (customerPhone: string) => void;
  onSelectCase: (caseId: string) => void;
  onSelectTicket: (ticketId: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'customer360' | 'case360' | 'complaints' | 'calls' | 'followups' | 'faq') => void;
  onOpenNewCall: () => void;
  onOpenNewFollowUp: () => void;
}

export const CrmDashboard: React.FC<CrmDashboardProps> = ({
  session,
  cases,
  customers,
  tickets,
  callLogs,
  followUps,
  onSelectCustomer,
  onSelectCase,
  onSelectTicket,
  onNavigateTab,
  onOpenNewCall,
  onOpenNewFollowUp
}) => {
  // Computed KPIs directly from real authoritative data
  const metrics = useMemo(() => {
    // 1. Pending Customer Actions (Missing docs, unconfirmed assessment, missing IBAN)
    const pendingCustomerCases = cases.filter(
      c =>
        c.status === 'در انتظار تایید زیان‌دیده' ||
        c.status === 'در انتظار تایید کاربر' ||
        c.status === 'در انتظار تایید مقصر' ||
        c.status === 'ثبت موقت - در انتظار افزودن کروکی' ||
        (c.status === 'در انتظار پرداخت' && (!c.payoutInfo?.iban || c.payoutInfo.verification === 'FAILED')) ||
        c.docRequests?.some(d => d.status !== 'تأیید شد' && d.status !== 'مدرک ارسال شد')
    );

    // 2. Open & Urgent Complaints
    const openTickets = tickets.filter(t => t.status !== 'بسته شده و حل گردید');
    const urgentComplaints = openTickets.filter(
      t => t.priority === 'فوری' || t.priority.includes('بحرانی') || t.category === 'شکایت از مبلغ ارزیابی'
    );

    // 3. Pending CRM Follow-ups
    const pendingTasks = followUps.filter(f => f.status === 'در انتظار انجام' || f.status === 'در حال پیگیری');
    const urgentTasks = pendingTasks.filter(f => f.priority === 'فوری و بحرانی' || f.priority === 'مهم');

    // 4. Payment Related Support Cases
    const paymentCases = cases.filter(c => c.status === 'در انتظار پرداخت' || c.status === 'پرداخت شده');

    // 5. Total Calls
    const totalCallsCount = callLogs.length;
    const callsRequiringFollowUp = callLogs.filter(cl => cl.followUpRequired && !cl.resolvedInCall);

    return {
      totalCases: cases.length,
      totalCustomers: customers.length,
      pendingCustomerCasesCount: pendingCustomerCases.length,
      pendingCustomerCases,
      openTicketsCount: openTickets.length,
      urgentComplaintsCount: urgentComplaints.length,
      urgentComplaints,
      pendingTasksCount: pendingTasks.length,
      urgentTasksCount: urgentTasks.length,
      urgentTasks,
      paymentCasesCount: paymentCases.length,
      totalCallsCount,
      callsRequiringFollowUpCount: callsRequiringFollowUp.length
    };
  }, [cases, customers, tickets, callLogs, followUps]);

  return (
    <div className="space-y-6">
      {/* Welcome & Shift Status Banner */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/80 border border-indigo-100 p-5 sm:p-6 rounded-3xl text-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100/80 border border-indigo-200/90 text-indigo-600 flex items-center justify-center font-black shadow-xs shrink-0">
            <Headphones className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                میز کار یکپارچه امور مشتریان و پاسخگویی تلفنی (CRM)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                خط برخط فعال
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              کارشناس پاسخگو: <strong className="text-slate-800">{session.name}</strong> • شیفت پشتیبانی: ۲۴/۷ • دسترسی داده: نمای ایمن مشتری و استعلام سنهاب
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={onOpenNewCall}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>ثبت تماس جدید</span>
          </button>
          <button
            onClick={onOpenNewFollowUp}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد وظیفه پیگیری</span>
          </button>
        </div>
      </div>

      {/* Primary Clickable KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending Customer Actions */}
        <div
          onClick={() => onNavigateTab('customer360')}
          className="bg-white hover:bg-amber-50/30 border border-amber-200/80 hover:border-amber-300 rounded-3xl p-5 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              اقدامات معوق مشتری
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full font-bold">
              نیازمند تماس
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {metrics.pendingCustomerCasesCount}
            </span>
            <span className="text-xs text-slate-500">پرونده</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 group-hover:text-slate-700">
            نقص مدارک، تایید ارزیابی، ثبت شماره شبا
          </p>
        </div>

        {/* KPI 2: Open Complaints & Urgents */}
        <div
          onClick={() => onNavigateTab('complaints')}
          className="bg-white hover:bg-rose-50/30 border border-rose-200/80 hover:border-rose-300 rounded-3xl p-5 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              شکایات و تیکت‌های باز
            </span>
            {metrics.urgentComplaintsCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-black animate-pulse">
                {metrics.urgentComplaintsCount} فوری
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {metrics.openTicketsCount}
            </span>
            <span className="text-xs text-slate-500">شکایت</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 group-hover:text-slate-700">
            اعتراض به ارزیابی، تاخیر در پرداخت، سنهاب
          </p>
        </div>

        {/* KPI 3: CRM Follow-up Tasks */}
        <div
          onClick={() => onNavigateTab('followups')}
          className="bg-white hover:bg-indigo-50/30 border border-indigo-200/80 hover:border-indigo-300 rounded-3xl p-5 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              وظایف پیگیری واحدها
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold">
              {metrics.urgentTasksCount} با اولویت بالا
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {metrics.pendingTasksCount}
            </span>
            <span className="text-xs text-slate-500">کار در جریان</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 group-hover:text-slate-700">
            ارجاع به ارزیاب، بازبین، مالی و شعب
          </p>
        </div>

        {/* KPI 4: Total Call Logs & Interactions */}
        <div
          onClick={() => onNavigateTab('calls')}
          className="bg-white hover:bg-sky-50/30 border border-sky-200/80 hover:border-sky-300 rounded-3xl p-5 shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-sky-600" />
              تماس‌ها و تعاملات
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-bold">
              {metrics.callsRequiringFollowUpCount} نیازمند پیگیری
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {metrics.totalCallsCount}
            </span>
            <span className="text-xs text-slate-500">مکالمه ثبت‌شده</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 line-clamp-1 group-hover:text-slate-700">
            ورودی، خروجی و لاگ پیامک‌های ارسالی
          </p>
        </div>
      </div>

      {/* Two Column Operational Surface: Urgent Blockers & Recent Communications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Main Column: Cases with Operational Blockers requiring customer contact (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                پرونده‌های دارای مانع عملیاتی (نیازمند تماس با مشتری)
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('customer360')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              مشاهده همه
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          <div className="space-y-3">
            {metrics.pendingCustomerCases.slice(0, 4).map(c => {
              let blockerText = '';
              let badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';

              if (c.status === 'در انتظار تایید زیان‌دیده' || c.status === 'در انتظار تایید کاربر') {
                blockerText = 'منتظر تایید برآورد ارزیابی و ثبت شبا توسط زیان‌دیده';
              } else if (c.status === 'در انتظار تایید مقصر') {
                blockerText = 'منتظر ورود و تایید حادثه توسط راننده مقصر';
              } else if (c.docRequests?.some(d => d.status !== 'تأیید شد' && d.status !== 'مدرک ارسال شد')) {
                blockerText = 'ارزیاب خسارت درخواست عکس/مدارک تکمیلی ثبت نموده است';
                badgeColor = 'bg-sky-50 text-sky-800 border-sky-200';
              } else if (c.status === 'در انتظار پرداخت' && (!c.payoutInfo?.iban || c.payoutInfo.verification === 'FAILED')) {
                blockerText = 'نقص شماره شبا جهت صدور حواله پرداخت پایا';
                badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
              } else {
                blockerText = `وضعیت: ${c.status}`;
              }

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className="bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-indigo-300 p-4 rounded-2xl transition-all cursor-pointer shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                        {c.id}
                      </span>
                      <span className="font-bold text-xs text-slate-900">
                        {c.victimName || 'زیان‌دیده'} ({c.carType || 'خودرو'})
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {c.victimPhone}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      {blockerText}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCustomer(c.victimPhone);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>۳۶۰ مشتری</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(c.id);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>پرونده</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {metrics.pendingCustomerCases.length === 0 && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl text-center text-slate-500 text-xs shadow-xs">
                در حال حاضر مانع معوقی که نیازمند اقدام مشتری باشد در سامانه وجود ندارد.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Urgent Complaints & Follow-ups (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-xs">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                شکایات اولویت‌دار و فوری
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('complaints')}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              مدیریت تیکت‌ها
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          <div className="space-y-3">
            {tickets.slice(0, 3).map(t => {
              const isUrgent = t.priority === 'فوری' || t.priority.includes('بحرانی');
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-2 ${
                    isUrgent
                      ? 'bg-rose-50/40 border-rose-200/90 hover:border-rose-300'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {t.subject}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      isUrgent ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>مشتری: <strong className="text-slate-800">{t.customerName}</strong></span>
                    <span className="font-mono text-slate-400">{t.lastUpdate}</span>
                  </div>
                </div>
              );
            })}

            {tickets.length === 0 && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl text-center text-slate-500 text-xs shadow-xs">
                شکایت یا تیکت ثبت‌شده‌ای وجود ندارد.
              </div>
            )}
          </div>

          {/* Quick FAQ / Canned Response Helper Widget */}
          <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border border-indigo-100 p-4 rounded-2xl space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                اسکریپت و راهنمای پاسخگویی استاندارد
              </span>
              <button
                onClick={() => onNavigateTab('faq')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                مشاهده همه
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              تسویه خسارت بدون کروکی تا سقف تعهد مالی سال ۱۴۰۳ نیاز به مراجعه حضوری نداشته و صرفاً با تایید الکترونیک تصاویر و شماره شبا انجام می‌پذیرد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
