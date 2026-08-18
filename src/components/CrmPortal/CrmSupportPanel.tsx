import React, { useState, useMemo, useEffect } from 'react';
import {
  Headphones,
  LayoutDashboard,
  AlertTriangle,
  Bell,
  MessageSquare,
  Users,
  FileSpreadsheet,
  PhoneCall,
  Search,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Copy,
  Check,
  Building,
  Layers,
  ChevronLeft,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import {
  UserSession,
  ClaimCase,
  CustomerCallLog,
  CustomerTicket,
  CrmSatisfactionSurvey,
  CrmFollowUpTask,
  CustomerNotification
} from '../../types';
import {
  loadCrmCallLogsFromStorage,
  saveCrmCallLogsToStorage,
  loadCrmTicketsFromStorage,
  saveCrmTicketsToStorage,
  loadCrmSurveysFromStorage,
  saveCrmSurveysToStorage,
  loadCrmFollowUpsFromStorage,
  saveCrmFollowUpsToStorage,
  loadCustomersFromStorage,
  saveCustomerNotifications,
  loadCustomerNotifications
} from '../../lib/storage';
import { aggregateCustomers, UnifiedCustomerProfile, maskPhoneNumber, maskNationalId } from './crmHelpers';
import { CrmOverdueActionsCard } from './CrmOverdueActionsCard';
import { CrmExpertMessenger } from './CrmExpertMessenger';
import { CrmComplaintManager } from './CrmComplaintManager';
import { CrmCustomer360 } from './CrmCustomer360';
import { CrmCase360 } from './CrmCase360';
import { CrmTimeline } from './CrmTimeline';

interface CrmSupportPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updated: ClaimCase) => void;
  onOpenCaseForm?: (caseId: string) => void;
}

export type CrmMainTab = 'action_center' | 'expert_messenger' | 'complaints' | 'hub360';

// Standard FAQ / Call Scripts
const FAQ_SCRIPTS = [
  {
    id: 'faq-1',
    category: 'واریز خسارت',
    title: 'نحوه واریز مستقیم خسارت به شماره شبا',
    script: 'زیان‌دیده گرامی، پس از تایید مبلغ ارزیابی در پنل کاربری، دستور پرداخت آنلاین صادر می‌گردد. وجه خسارت مستقیماً از طریق سامانه پایا/ساتنا به شماره شبای ۲۴ رقمی ثبت شده به نام زیان‌دیده واریز خواهد شد.'
  },
  {
    id: 'faq-2',
    category: 'افت قیمت خودرو',
    title: 'شرایط تعلق خسارت کسر و افت قیمت',
    script: 'بر اساس آیین‌نامه بیمه مرکزی، در صورتی که خودرو مشمول افت قیمت باشد (مدل ساخت تا ۵ سال اخیر و آسیب به قطعات رنگ‌دار و شاسی)، ارزیاب خسارت افت قیمت را محاسبه و در صورت داشتن بیمه‌نامه معتبر مقصر، تا سقف تعهد مالی پرداخت می‌گردد.'
  },
  {
    id: 'faq-3',
    category: 'نقص مدارک و عکس',
    title: 'راهنمایی بارگذاری عکس واضح از قطعات',
    script: 'جهت تسریع در ارزیابی، لطفاً با گوشی موبایل از فاصله ۱ الی ۲ متری از قطعه آسیب‌دیده با نور کافی و زاویه ۴۵ درجه عکس‌برداری نموده و در بخش بارگذاری مدارک پرونده ثبت نمایید.'
  },
  {
    id: 'faq-4',
    category: 'بازدید میدانی',
    title: 'هماهنگی حضور کارشناس میدانی در محل',
    script: 'کارشناس رسمی بازدید در محل به زودی با شماره تماس اعلامی شما تماس خواهد گرفت تا جهت رویت فیزیکی خودرو و تطبیق اصالت با شما در نشانی محل حادثه هماهنگ گردد.'
  }
];

export const CrmSupportPanel: React.FC<CrmSupportPanelProps> = ({
  session,
  cases,
  onUpdateCase,
  onOpenCaseForm
}) => {
  // Main 4-Tab Navigation
  const [activeTab, setActiveTab] = useState<CrmMainTab>('action_center');

  // Persistence State
  const [callLogs, setCallLogs] = useState<CustomerCallLog[]>(() => loadCrmCallLogsFromStorage());
  const [tickets, setTickets] = useState<CustomerTicket[]>(() => loadCrmTicketsFromStorage());
  const [surveys, setSurveys] = useState<CrmSatisfactionSurvey[]>(() => loadCrmSurveysFromStorage());
  const [followUps, setFollowUps] = useState<CrmFollowUpTask[]>(() => loadCrmFollowUpsFromStorage());
  const [registeredCustomers] = useState(() => loadCustomersFromStorage());

  // Active Selection State
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Global Quick Search Bar State
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);
  const [showFaqDrawer, setShowFaqDrawer] = useState(false);

  // Modals
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Form: New Call Log
  const [newCallForm, setNewCallForm] = useState({
    contactName: '',
    contactPhone: '',
    contactRole: 'زیان‌دیده' as CustomerCallLog['contactRole'],
    callDirection: 'خروجی (تماس با مشتری)' as CustomerCallLog['callDirection'],
    topic: 'پیگیری مدارک و شبا' as CustomerCallLog['topic'],
    sentiment: 'آرام و راضی' as CustomerCallLog['sentiment'],
    durationMinutes: 3,
    caseId: '',
    notes: '',
    followUpRequired: false,
    followUpDate: '',
    resolvedInCall: true
  });

  // Form: New Ticket / Complaint
  const [newTicketForm, setNewTicketForm] = useState({
    customerName: '',
    customerPhone: '',
    customerRole: 'زیان‌دیده' as CustomerTicket['customerRole'],
    caseId: '',
    category: 'شکایت از مبلغ ارزیابی' as CustomerTicket['category'],
    priority: 'مهم' as CustomerTicket['priority'],
    subject: '',
    initialMessage: ''
  });

  // Listen to background sync events
  useEffect(() => {
    const handleCrmSync = () => {
      setFollowUps(loadCrmFollowUpsFromStorage());
      setTickets(loadCrmTicketsFromStorage());
      setCallLogs(loadCrmCallLogsFromStorage());
    };

    window.addEventListener('claimflow_crm_followups_updated', handleCrmSync);
    window.addEventListener('claimflow_crm_tickets_updated', handleCrmSync);
    window.addEventListener('claimflow_crm_calls_updated', handleCrmSync);

    return () => {
      window.removeEventListener('claimflow_crm_followups_updated', handleCrmSync);
      window.removeEventListener('claimflow_crm_tickets_updated', handleCrmSync);
      window.removeEventListener('claimflow_crm_calls_updated', handleCrmSync);
    };
  }, []);

  // Aggregated Customers for 360
  const aggregatedCustomers = useMemo(() => {
    return aggregateCustomers(registeredCustomers, cases, tickets, callLogs, followUps);
  }, [registeredCustomers, cases, tickets, callLogs, followUps]);

  // Selected Case Object
  const currentSelectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return cases.find(c => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Selected Customer Object
  const currentSelectedCustomer = useMemo(() => {
    if (!selectedCustomerPhone) return null;
    return aggregatedCustomers.find(c => c.phone === selectedCustomerPhone) || null;
  }, [aggregatedCustomers, selectedCustomerPhone]);

  // Computed Quick KPIs
  const kpis = useMemo(() => {
    const overdueTasks = followUps.filter(t => t.status === 'در انتظار انجام');
    const expertRequests = overdueTasks.filter(t => t.requestedByName || t.targetDepartment === 'امور مشتریان');
    const openTickets = tickets.filter(t => t.status !== 'بسته شده و حل گردید');
    const urgentTickets = openTickets.filter(t => t.priority === 'فوری' || t.priority.includes('بحرانی'));

    return {
      overdueTasksCount: overdueTasks.length,
      expertRequestsCount: expertRequests.length,
      openTicketsCount: openTickets.length,
      urgentTicketsCount: urgentTickets.length,
      todayCallsCount: callLogs.length
    };
  }, [followUps, tickets, callLogs]);

  // Search Results for Global Search Bar
  const searchResults = useMemo(() => {
    if (!globalSearchTerm.trim()) return null;
    const term = globalSearchTerm.trim().toLowerCase();

    const matchedCases = cases.filter(
      c =>
        c.id.toLowerCase().includes(term) ||
        c.victimName.toLowerCase().includes(term) ||
        c.victimPhone.includes(term) ||
        (c.victimPlate && c.victimPlate.toLowerCase().includes(term)) ||
        (c.victimNationalId && c.victimNationalId.includes(term)) ||
        c.culpritName.toLowerCase().includes(term) ||
        c.culpritPhone.includes(term)
    );

    const matchedCustomers = aggregatedCustomers.filter(
      cust =>
        cust.name.toLowerCase().includes(term) ||
        cust.phone.includes(term) ||
        (cust.nationalId && cust.nationalId.includes(term))
    );

    return {
      cases: matchedCases,
      customers: matchedCustomers
    };
  }, [globalSearchTerm, cases, aggregatedCustomers]);

  // Handle Save Call Log
  const handleSaveCallLog = () => {
    if (!newCallForm.contactName.trim() || !newCallForm.contactPhone.trim() || !newCallForm.notes.trim()) {
      alert('لطفاً نام مخاطب، شماره تماس و خلاصه مکالمه را تکمیل فرمایید.');
      return;
    }

    const newLog: CustomerCallLog = {
      id: `CALL-${Date.now().toString().slice(-6)}`,
      caseId: newCallForm.caseId.trim() || undefined,
      contactName: newCallForm.contactName.trim(),
      contactPhone: newCallForm.contactPhone.trim(),
      contactRole: newCallForm.contactRole,
      callDirection: newCallForm.callDirection,
      topic: newCallForm.topic,
      sentiment: newCallForm.sentiment,
      durationMinutes: Number(newCallForm.durationMinutes) || 3,
      notes: newCallForm.notes.trim(),
      agentName: session.name,
      agentId: session.id,
      callDate: new Date().toLocaleDateString('fa-IR'),
      callTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      followUpRequired: newCallForm.followUpRequired,
      followUpDate: newCallForm.followUpDate || undefined,
      resolvedInCall: newCallForm.resolvedInCall
    };

    const updatedCalls = [newLog, ...callLogs];
    setCallLogs(updatedCalls);
    saveCrmCallLogsToStorage(updatedCalls);

    // If linked to a case, append audit history entry to authoritative case
    if (newCallForm.caseId.trim()) {
      const linkedCase = cases.find(c => c.id === newCallForm.caseId.trim());
      if (linkedCase) {
        const updatedCase: ClaimCase = {
          ...linkedCase,
          history: [
            ...(linkedCase.history || []),
            {
              status: linkedCase.status,
              time: `${newLog.callDate} ${newLog.callTime}`,
              user: `${session.name} (امور مشتریان و CRM)`,
              userRole: 'CRM_SUPPORT',
              note: `ثبت مکالمه ${newCallForm.callDirection} با ${newCallForm.contactName} (${newCallForm.contactRole}): ${newCallForm.notes.slice(0, 120)}...`
            }
          ]
        };
        onUpdateCase(updatedCase);
      }
    }

    // Reset Form
    setNewCallForm({
      contactName: '',
      contactPhone: '',
      contactRole: 'زیان‌دیده',
      callDirection: 'خروجی (تماس با مشتری)',
      topic: 'پیگیری مدارک و شبا',
      sentiment: 'آرام و راضی',
      durationMinutes: 3,
      caseId: '',
      notes: '',
      followUpRequired: false,
      followUpDate: '',
      resolvedInCall: true
    });
    setShowNewCallModal(false);
  };

  // Open Call Modal Pre-filled
  const handleOpenCallModalPrefilled = (phone: string, name: string, caseId: string, role?: string) => {
    setNewCallForm({
      contactName: name || '',
      contactPhone: phone || '',
      contactRole: (role as CustomerCallLog['contactRole']) || 'زیان‌دیده',
      callDirection: 'خروجی (تماس با مشتری)',
      topic: 'پیگیری مدارک و شبا',
      sentiment: 'آرام و راضی',
      durationMinutes: 3,
      caseId: caseId || '',
      notes: '',
      followUpRequired: false,
      followUpDate: '',
      resolvedInCall: true
    });
    setShowNewCallModal(true);
  };

  // Handle Copy FAQ Script
  const handleCopyFaq = (faqId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFaqId(faqId);
    setTimeout(() => setCopiedFaqId(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in" dir="rtl">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-black">
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>مرکز یکپارچه امور مشتریان و پیگیری پرونده‌های خسارت (CRM Hub)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>میز کار امور مشتریان</span>
              <span className="text-xs font-bold px-3 py-1 bg-amber-400 text-blue-950 rounded-xl shadow-xs">
                {session.name} ({session.roleTitle || 'پشتیبانی ارشد'})
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              رسیدگی به اقدامات معوق مشتریان، ارسال پیام به زنگوله اعلان کارشناسان، پیگیری شکایات و تیکت‌ها، و ثبت مکالمات با طرفین پرونده.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <button
              onClick={() => {
                setNewCallForm({
                  contactName: '',
                  contactPhone: '',
                  contactRole: 'زیان‌دیده',
                  callDirection: 'ورودی (تماس مشتری)',
                  topic: 'پیگیری واریز خسارت',
                  sentiment: 'آرام و راضی',
                  durationMinutes: 3,
                  caseId: '',
                  notes: '',
                  followUpRequired: false,
                  followUpDate: '',
                  resolvedInCall: true
                });
                setShowNewCallModal(true);
              }}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>ثبت مکالمه جدید</span>
            </button>

            <button
              onClick={() => setShowFaqDrawer(!showFaqDrawer)}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs transition-all flex items-center gap-2 shadow-lg active:scale-95 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>راهنمای مکالمه و FAQ</span>
            </button>
          </div>
        </div>

        {/* Global Quick Search Bar */}
        <div className="relative mt-6 z-10">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalSearchTerm}
              onChange={e => setGlobalSearchTerm(e.target.value)}
              placeholder="جستجوی هوشمند در پرونده‌ها و مشتریان (شماره پرونده، نام زیان‌دیده، شماره موبایل، پلاک، کدملی)..."
              className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-400 text-xs font-bold focus:outline-none focus:bg-white focus:text-slate-900 focus:border-amber-400 transition-all shadow-inner"
            />
            {globalSearchTerm && (
              <button
                onClick={() => setGlobalSearchTerm('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Dropdown Results */}
          {searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-900 rounded-2xl shadow-2xl border-2 border-amber-400 p-4 z-50 animate-in fade-in space-y-3 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black text-slate-800">
                  نتایج جستجو برای «{globalSearchTerm}»
                </span>
                <span className="text-[11px] text-slate-500">
                  {searchResults.cases.length} پرونده | {searchResults.customers.length} مشتری
                </span>
              </div>

              {searchResults.cases.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">پرونده‌های منطبق:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.cases.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          setActiveTab('hub360');
                          setGlobalSearchTerm('');
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all cursor-pointer text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-black text-blue-900">
                          <span>پرونده {c.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">{c.status}</span>
                        </div>
                        <div className="text-slate-700 text-[11px]">
                          {c.carType} • {c.victimName} ({c.victimPhone})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.cases.length === 0 && searchResults.customers.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  موردی با مشخصات جستجو شده یافت نشد.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUICK FAQ / CALL SCRIPT ACCORDION DRAWER */}
      {showFaqDrawer && (
        <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 shadow-md space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">
                راهنمای پاسخگویی استاندارد و اسکریپت‌های مکالمه تلفنی (Call Scripts)
              </h3>
            </div>
            <button
              onClick={() => setShowFaqDrawer(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              بستن ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FAQ_SCRIPTS.map(faq => (
              <div key={faq.id} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-extrabold text-xs text-slate-900">{faq.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-indigo-700 font-bold border border-indigo-200">
                      {faq.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-indigo-100">
                    «{faq.script}»
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleCopyFaq(faq.id, faq.script)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    {copiedFaqId === faq.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFaqId === faq.id ? 'کپی شد' : 'کپی متن پاسخ'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 CLEAR CATEGORIZED TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* TAB 1: Overdue & Action Center */}
          <button
            onClick={() => setActiveTab('action_center')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'action_center'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>میز کار و اقدامات معوق مشتریان</span>
            {kpis.overdueTasksCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'action_center' ? 'bg-slate-950 text-white' : 'bg-rose-600 text-white animate-pulse'}`}>
                {kpis.overdueTasksCount}
              </span>
            )}
          </button>

          {/* TAB 2: Expert & Staff Messenger */}
          <button
            onClick={() => setActiveTab('expert_messenger')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'expert_messenger'
                ? 'bg-purple-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>ارتباط با کارشناسان و ارزیابان (ارسال پیام به زنگوله)</span>
            {kpis.expertRequestsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'expert_messenger' ? 'bg-amber-400 text-purple-950' : 'bg-purple-100 text-purple-900'}`}>
                {kpis.expertRequestsCount} درخواست
              </span>
            )}
          </button>

          {/* TAB 3: Customer Complaints & Open Tickets */}
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-rose-700 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>شکایات و تیکت‌های پشتیبانی</span>
            {kpis.openTicketsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'complaints' ? 'bg-white text-rose-900' : 'bg-rose-100 text-rose-800'}`}>
                {kpis.openTicketsCount} باز
              </span>
            )}
          </button>

          {/* TAB 4: Case & Customer 360 Hub */}
          <button
            onClick={() => setActiveTab('hub360')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'hub360'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>کارتابل پرونده‌ها و مشتری ۳۶۰</span>
            {selectedCaseId && (
              <span className="px-2 py-0.5 rounded-full bg-blue-700 text-white text-[10px]">
                {selectedCaseId}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ACTION CENTER & OVERDUE ACTIONS */}
      {/* ========================================================= */}
      {activeTab === 'action_center' && (
        <div className="space-y-6">
          {/* Quick KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">{kpis.overdueTasksCount}</div>
                <div className="text-[11px] text-slate-500 font-bold">اقدام معوق نیازمند تماس</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">{kpis.expertRequestsCount}</div>
                <div className="text-[11px] text-slate-500 font-bold">درخواست تماس از کارشناسان</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">{kpis.openTicketsCount}</div>
                <div className="text-[11px] text-slate-500 font-bold">شکایت و تیکت باز</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900">{kpis.todayCallsCount}</div>
                <div className="text-[11px] text-slate-500 font-bold">مکالمه ثبت شده</div>
              </div>
            </div>
          </div>

          {/* OVERDUE ACTIONS CARD */}
          <CrmOverdueActionsCard
            session={session}
            cases={cases}
            followUps={followUps}
            onUpdateCase={onUpdateCase}
            onUpdateFollowUps={updated => {
              setFollowUps(updated);
              saveCrmFollowUpsToStorage(updated);
            }}
            onSelectCase={caseId => {
              setSelectedCaseId(caseId);
              setActiveTab('hub360');
            }}
            onOpenCallModal={(phone, name, caseId, role) => handleOpenCallModalPrefilled(phone, name, caseId, role)}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: EXPERT MESSENGER & DIRECT NOTIFICATIONS */}
      {/* ========================================================= */}
      {activeTab === 'expert_messenger' && (
        <CrmExpertMessenger
          session={session}
          cases={cases}
          followUps={followUps}
          onUpdateFollowUps={updated => {
            setFollowUps(updated);
            saveCrmFollowUpsToStorage(updated);
          }}
          onUpdateCase={onUpdateCase}
          onSelectCase={caseId => {
            setSelectedCaseId(caseId);
            setActiveTab('hub360');
          }}
          onLogCallWithCustomer={(phone, caseId) => {
            const matchedCase = cases.find(c => c.id === caseId);
            handleOpenCallModalPrefilled(phone, matchedCase?.victimName || 'زیان‌دیده', caseId || '', 'زیان‌دیده');
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 3: CUSTOMER COMPLAINTS & TICKETS */}
      {/* ========================================================= */}
      {activeTab === 'complaints' && (
        <CrmComplaintManager
          session={session}
          tickets={tickets}
          cases={cases}
          selectedTicketId={selectedTicketId}
          onSelectTicketId={id => setSelectedTicketId(id)}
          onUpdateTickets={updated => {
            setTickets(updated);
            saveCrmTicketsToStorage(updated);
            window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));
          }}
          onSelectCase={caseId => {
            setSelectedCaseId(caseId);
            setActiveTab('hub360');
          }}
          onOpenNewTicketModal={() => setShowNewTicketModal(true)}
        />
      )}

      {/* ========================================================= */}
      {/* TAB 4: CASE & CUSTOMER 360 HUB */}
      {/* ========================================================= */}
      {activeTab === 'hub360' && (
        <div className="space-y-6">
          {/* Quick Selector Bar if no case or customer is selected */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  انتخاب و بررسی پرونده خسارت و سوابق مشتری
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  مشاهده ۳۶۰ درجه وضعیت مدارک، شماره شبا، تاریخچه تماس‌ها و تیکت‌ها
                </p>
              </div>

              {selectedCaseId && (
                <button
                  onClick={() => setSelectedCaseId(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 self-start"
                >
                  <span>نمایش همه پرونده‌ها</span>
                </button>
              )}
            </div>

            {/* Quick Cases Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cases.slice(0, 9).map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    selectedCaseId === c.id
                      ? 'bg-blue-50 border-2 border-blue-600 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-blue-950">پرونده {c.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">{c.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-medium flex items-center justify-between">
                    <span>{c.carType}</span>
                    <span>{c.victimName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Render Active Case 360 Detail */}
          {currentSelectedCase ? (
            <div className="space-y-6">
              <CrmCase360
                claimCase={currentSelectedCase}
                tickets={tickets}
                callLogs={callLogs}
                followUps={followUps}
                onSelectTicket={id => {
                  setSelectedTicketId(id);
                  setActiveTab('complaints');
                }}
                onOpenNewCallForCase={c => handleOpenCallModalPrefilled(c.victimPhone, c.victimName, c.id, 'زیان‌دیده')}
                onOpenNewFollowUpForCase={c => {}}
                onOpenNewTicketForCase={c => {
                  setNewTicketForm(prev => ({
                    ...prev,
                    customerName: c.victimName,
                    customerPhone: c.victimPhone,
                    caseId: c.id
                  }));
                  setShowNewTicketModal(true);
                }}
                onSendSmsReminder={() => {}}
              />

              <CrmTimeline
                claimCase={currentSelectedCase}
                tickets={tickets}
                callLogs={callLogs}
                followUps={followUps}
              />
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700">پرونده‌ای انتخاب نشده است.</p>
              <p className="text-xs text-slate-500">لطفاً از جعبه بالا یک پرونده را انتخاب فرمایید تا جزئیات کامل نمایش داده شود.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LOG NEW CALL */}
      {/* ========================================================= */}
      {showNewCallModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border-2 border-amber-400 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm text-slate-900">
                  ثبت مکالمه و لاگ تماس با مشتری یا طرفین پرونده
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  نام مخاطب <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newCallForm.contactName}
                  onChange={e => setNewCallForm(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="نام و نام خانوادگی..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  شماره تماس <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newCallForm.contactPhone}
                  onChange={e => setNewCallForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="0912..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">نقش مخاطب:</label>
                <select
                  value={newCallForm.contactRole}
                  onChange={e => setNewCallForm(prev => ({ ...prev, contactRole: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="زیان‌دیده">زیان‌دیده</option>
                  <option value="مقصر حادثه">مقصر حادثه</option>
                  <option value="بیمه‌گذار">بیمه‌گذار</option>
                  <option value="کارشناس رسمی">کارشناس رسمی</option>
                  <option value="شخص ثالث">شخص ثالث</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">جهت تماس:</label>
                <select
                  value={newCallForm.callDirection}
                  onChange={e => setNewCallForm(prev => ({ ...prev, callDirection: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="ورودی (تماس مشتری)">ورودی (تماس مشتری)</option>
                  <option value="خروجی (تماس با مشتری)">خروجی (تماس با مشتری)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">مدت مکالمه (دقیقه):</label>
                <input
                  type="number"
                  value={newCallForm.durationMinutes}
                  onChange={e => setNewCallForm(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                شماره پرونده مرتبط (اختیاری):
              </label>
              <select
                value={newCallForm.caseId}
                onChange={e => setNewCallForm(prev => ({ ...prev, caseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="">-- بدون پرونده مشخص --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    پرونده {c.id} ({c.carType} - {c.victimName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                خلاصه مکالمه و توافقات انجام شده <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={4}
                value={newCallForm.notes}
                onChange={e => setNewCallForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="توضیحات گفتگو، نتیجه هماهنگی، توضیحات شبا یا مدارک..."
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveCallLog}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت نهایی لاگ تماس</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewCallModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NEW TICKET / COMPLAINT */}
      {/* ========================================================= */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-2 border-rose-400 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                <span>ثبت شکایت یا تیکت جدید از طرف مشتری</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">نام مشتری:</label>
                <input
                  type="text"
                  value={newTicketForm.customerName}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">شماره تماس:</label>
                <input
                  type="text"
                  value={newTicketForm.customerPhone}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">موضوع تیکت / شکایت:</label>
              <input
                type="text"
                value={newTicketForm.subject}
                onChange={e => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="عنوان شکایت..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">متن کامل شکایت:</label>
              <textarea
                rows={4}
                value={newTicketForm.initialMessage}
                onChange={e => setNewTicketForm(prev => ({ ...prev, initialMessage: e.target.value }))}
                placeholder="شرح کامل اعتراض یا درخواست مشتری..."
                className="w-full p-3 rounded-2xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (!newTicketForm.customerName.trim() || !newTicketForm.customerPhone.trim() || !newTicketForm.subject.trim() || !newTicketForm.initialMessage.trim()) {
                    alert('لطفاً کلیه فیلدها را تکمیل فرمایید.');
                    return;
                  }
                  const nowStr = `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
                  const newT: CustomerTicket = {
                    id: `TCK-${Date.now().toString().slice(-5)}`,
                    ticketNumber: `TCK-${Date.now().toString().slice(-6)}`,
                    customerName: newTicketForm.customerName.trim(),
                    customerPhone: newTicketForm.customerPhone.trim(),
                    customerRole: newTicketForm.customerRole,
                    caseId: newTicketForm.caseId || undefined,
                    category: newTicketForm.category,
                    priority: newTicketForm.priority,
                    status: 'در انتظار پاسخ',
                    subject: newTicketForm.subject.trim(),
                    createdAt: nowStr,
                    lastUpdate: nowStr,
                    assignedAgent: session.name,
                    messages: [
                      {
                        id: `msg-${Date.now()}`,
                        sender: 'CUSTOMER',
                        senderName: newTicketForm.customerName.trim(),
                        senderRole: 'مشتری (زیان‌دیده)',
                        text: newTicketForm.initialMessage.trim(),
                        time: nowStr
                      }
                    ]
                  };
                  const updated = [newT, ...tickets];
                  setTickets(updated);
                  saveCrmTicketsToStorage(updated);
                  setShowNewTicketModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                ثبت شکایت در کارتابل
              </button>

              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
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
