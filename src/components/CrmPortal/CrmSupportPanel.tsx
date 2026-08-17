import React, { useState, useMemo, useEffect } from 'react';
import {
  Headphones,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  AlertOctagon,
  PhoneCall,
  TrendingUp,
  BookOpen,
  Star,
  Search,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Copy,
  Check,
  AlertTriangle,
  Building,
  Layers,
  ChevronLeft
} from 'lucide-react';
import {
  UserSession,
  ClaimCase,
  CustomerCallLog,
  CustomerTicket,
  CrmSatisfactionSurvey,
  CrmFollowUpTask
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
  saveCasesToStorage
} from '../../lib/storage';
import { aggregateCustomers, UnifiedCustomerProfile, maskPhoneNumber, maskNationalId, formatCurrency } from './crmHelpers';
import { CrmDashboard } from './CrmDashboard';
import { CrmCustomer360 } from './CrmCustomer360';
import { CrmCase360 } from './CrmCase360';
import { CrmTimeline } from './CrmTimeline';
import { CrmComplaintManager } from './CrmComplaintManager';
import { CrmCallCenter } from './CrmCallCenter';
import { CrmFollowUpManager } from './CrmFollowUpManager';

interface CrmSupportPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updated: ClaimCase) => void;
  onOpenCaseForm?: (caseId: string) => void;
}

export type CrmTab = 'dashboard' | 'customer360' | 'case360' | 'complaints' | 'calls' | 'followups' | 'faq' | 'surveys';

export const CrmSupportPanel: React.FC<CrmSupportPanelProps> = ({
  session,
  cases,
  onUpdateCase,
  onOpenCaseForm
}) => {
  const [activeTab, setActiveTab] = useState<CrmTab>('dashboard');

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

  // Modals
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [showNewFollowUpModal, setShowNewFollowUpModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Form: New Call Log
  const [newCallForm, setNewCallForm] = useState({
    contactName: '',
    contactPhone: '',
    contactRole: 'زیان‌دیده' as CustomerCallLog['contactRole'],
    callDirection: 'ورودی (تماس مشتری)' as CustomerCallLog['callDirection'],
    topic: 'پیگیری واریز خسارت' as CustomerCallLog['topic'],
    sentiment: 'آرام و راضی' as CustomerCallLog['sentiment'],
    durationMinutes: 3,
    caseId: '',
    notes: '',
    followUpRequired: false,
    followUpDate: '',
    resolvedInCall: true
  });

  // Form: New Follow-up Task
  const [newFollowUpForm, setNewFollowUpForm] = useState({
    customerName: '',
    customerPhone: '',
    caseId: '',
    reason: '',
    targetDepartment: 'ارزیابی خسارت' as CrmFollowUpTask['targetDepartment'],
    priority: 'مهم' as CrmFollowUpTask['priority'],
    dueDate: new Date().toLocaleDateString('fa-IR'),
    notes: ''
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

  // Aggregated Customers for Customer 360
  const aggregatedCustomers = useMemo(() => {
    return aggregateCustomers(registeredCustomers, cases, tickets, callLogs, followUps);
  }, [registeredCustomers, cases, tickets, callLogs, followUps]);

  // Selected Case Object
  const currentSelectedCase = useMemo(() => {
    if (!selectedCaseId) return null;
    return cases.find(c => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Handle Log New Call
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

    // If follow-up required, auto-create follow-up task
    if (newCallForm.followUpRequired) {
      const newTask: CrmFollowUpTask = {
        id: `TSK-${Date.now().toString().slice(-5)}`,
        caseId: newCallForm.caseId.trim() || undefined,
        customerName: newCallForm.contactName.trim(),
        customerPhone: newCallForm.contactPhone.trim(),
        callLogId: newLog.id,
        reason: `پیگیری تماس تلفنی: ${newCallForm.topic}`,
        targetDepartment: 'شعبه و خسارت',
        assignedAgent: session.name,
        priority: 'مهم',
        dueDate: newCallForm.followUpDate || new Date().toLocaleDateString('fa-IR'),
        status: 'در انتظار انجام',
        notes: newCallForm.notes.trim(),
        createdAt: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
      };
      const updatedTasks = [newTask, ...followUps];
      setFollowUps(updatedTasks);
      saveCrmFollowUpsToStorage(updatedTasks);
    }

    // Reset Form
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
    setShowNewCallModal(false);
  };

  // Handle Save Follow-up Task
  const handleSaveFollowUp = () => {
    if (!newFollowUpForm.customerName.trim() || !newFollowUpForm.customerPhone.trim() || !newFollowUpForm.reason.trim()) {
      alert('لطفاً نام مشتری، شماره تماس و شرح موضوع پیگیری را وارد فرمایید.');
      return;
    }

    const newTask: CrmFollowUpTask = {
      id: `TSK-${Date.now().toString().slice(-5)}`,
      caseId: newFollowUpForm.caseId.trim() || undefined,
      customerName: newFollowUpForm.customerName.trim(),
      customerPhone: newFollowUpForm.customerPhone.trim(),
      reason: newFollowUpForm.reason.trim(),
      targetDepartment: newFollowUpForm.targetDepartment,
      assignedAgent: session.name,
      priority: newFollowUpForm.priority,
      dueDate: newFollowUpForm.dueDate || new Date().toLocaleDateString('fa-IR'),
      status: 'در انتظار انجام',
      notes: newFollowUpForm.notes.trim(),
      createdAt: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
    };

    const updated = [newTask, ...followUps];
    setFollowUps(updated);
    saveCrmFollowUpsToStorage(updated);

    // Append to case history if linked
    if (newFollowUpForm.caseId.trim()) {
      const linkedCase = cases.find(c => c.id === newFollowUpForm.caseId.trim());
      if (linkedCase) {
        const updatedCase: ClaimCase = {
          ...linkedCase,
          history: [
            ...(linkedCase.history || []),
            {
              status: linkedCase.status,
              time: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
              user: `${session.name} (امور مشتریان و CRM)`,
              userRole: 'CRM_SUPPORT',
              note: `تعریف وظیفه پیگیری رفع مانع با واحد ${newFollowUpForm.targetDepartment}: ${newFollowUpForm.reason.slice(0, 100)}`
            }
          ]
        };
        onUpdateCase(updatedCase);
      }
    }

    setNewFollowUpForm({
      customerName: '',
      customerPhone: '',
      caseId: '',
      reason: '',
      targetDepartment: 'ارزیابی خسارت',
      priority: 'مهم',
      dueDate: new Date().toLocaleDateString('fa-IR'),
      notes: ''
    });
    setShowNewFollowUpModal(false);
  };

  // Handle Save New Ticket / Complaint
  const handleSaveTicket = () => {
    if (!newTicketForm.customerName.trim() || !newTicketForm.customerPhone.trim() || !newTicketForm.subject.trim() || !newTicketForm.initialMessage.trim()) {
      alert('لطفاً نام مشتری، شماره تماس، موضوع و شرح شکایت را وارد فرمایید.');
      return;
    }

    const newTicket: CustomerTicket = {
      id: `TCK-${Date.now().toString().slice(-6)}`,
      caseId: newTicketForm.caseId.trim() || undefined,
      ticketNumber: `TK-${Date.now().toString().slice(-4)}`,
      customerName: newTicketForm.customerName.trim(),
      customerPhone: newTicketForm.customerPhone.trim(),
      customerRole: newTicketForm.customerRole,
      category: newTicketForm.category,
      priority: newTicketForm.priority,
      status: 'در انتظار پاسخ',
      subject: newTicketForm.subject.trim(),
      createdAt: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
      lastUpdate: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
      assignedAgent: session.name,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER',
          senderName: newTicketForm.customerName.trim(),
          senderRole: newTicketForm.customerRole,
          text: newTicketForm.initialMessage.trim(),
          time: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
        }
      ]
    };

    const updatedTickets = [newTicket, ...tickets];
    setTickets(updatedTickets);
    saveCrmTicketsToStorage(updatedTickets);

    // If linked to case, append audit history
    if (newTicketForm.caseId.trim()) {
      const linkedCase = cases.find(c => c.id === newTicketForm.caseId.trim());
      if (linkedCase) {
        const updatedCase: ClaimCase = {
          ...linkedCase,
          history: [
            ...(linkedCase.history || []),
            {
              status: linkedCase.status,
              time: newTicket.createdAt,
              user: `${newTicketForm.customerName} (${newTicketForm.customerRole})`,
              note: `ثبت شکایت رسمی در سامانه CRM (${newTicketForm.category}): ${newTicketForm.subject}`
            }
          ]
        };
        onUpdateCase(updatedCase);
      }
    }

    setNewTicketForm({
      customerName: '',
      customerPhone: '',
      customerRole: 'زیان‌دیده',
      caseId: '',
      category: 'شکایت از مبلغ ارزیابی',
      priority: 'مهم',
      subject: '',
      initialMessage: ''
    });
    setShowNewTicketModal(false);
    setSelectedTicketId(newTicket.id);
    setActiveTab('complaints');
  };

  // Handle Send SMS Reminder helper
  const handleSendSmsReminder = (phone: string, text: string, recipientName: string) => {
    const newLog = {
      id: `SMS-${Date.now().toString().slice(-6)}`,
      recipientType: 'CUSTOMER' as const,
      recipientName,
      phone,
      text,
      sentAt: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
      status: 'DELIVERED' as const
    };

    if (currentSelectedCase) {
      const updatedCase: ClaimCase = {
        ...currentSelectedCase,
        smsDispatchLogs: [...(currentSelectedCase.smsDispatchLogs || []), newLog],
        history: [
          ...(currentSelectedCase.history || []),
          {
            status: currentSelectedCase.status,
            time: newLog.sentAt,
            user: `${session.name} (امور مشتریان و CRM)`,
            note: `ارسال پیامک اطلاع‌رسانی به ${recipientName} (${maskPhoneNumber(phone)}): ${text.slice(0, 80)}...`
          }
        ]
      };
      onUpdateCase(updatedCase);
    }
  };

  // Quick Global Search Handler
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = globalSearchTerm.trim();
    if (!term) return;

    // Check Case ID
    const foundCase = cases.find(c => c.id.toLowerCase() === term.toLowerCase());
    if (foundCase) {
      setSelectedCaseId(foundCase.id);
      setActiveTab('case360');
      return;
    }

    // Check Customer
    const foundCust = aggregatedCustomers.find(
      c =>
        c.phone.includes(term) ||
        c.name.toLowerCase().includes(term.toLowerCase()) ||
        (c.nationalId && c.nationalId.includes(term))
    );
    if (foundCust) {
      setSelectedCustomerPhone(foundCust.phone);
      setActiveTab('customer360');
      return;
    }

    // Fallback: Go to Customer 360 search
    setActiveTab('customer360');
  };

  // FAQ Canned Data
  const FAQ_SCRIPTS = [
    {
      id: 'faq-1',
      title: 'مدارک و نحوه تسویه خسارت بدون کروکی پلیس',
      category: 'پذیرش و ارزیابی',
      script:
        'با سلام، در تصادفات تا سقف تعهد مالی سال ۱۴۰۳ (تا مبلغ ۴۰ میلیون تومان)، نیازی به کروکی پلیس نبوده و صرفاً با بارگذاری عکس‌های ۴ طرف خودرو، تصویر گواهینامه و کارت ملی طرفین و بیمه‌نامه شخص ثالث معتبر مقصر در سامانه آنلاین، ارزیابی هوشمند و واریز مستقیم شبا انجام می‌پذیرد.'
    },
    {
      id: 'faq-2',
      title: 'زمان واریز وجه خسارت به شماره شبا',
      category: 'مالی و خزانه‌داری',
      script:
        'سلام، پس از تایید برآورد خسارت توسط زیان‌دیده یا کارشناس میدانی، حواله پرداخت مالی در همان روز صادر و از طریق سامانه پایا بانک مرکزی در اولین سیکل واریز بانکی (حداکثر ظرف ۲۴ ساعت کاری) به حساب شبای اعلامی شما واریز خواهد شد.'
    },
    {
      id: 'faq-3',
      title: 'نحوه اعتراض به مبلغ برآورد و قیمت قطعات داغی',
      category: 'شکایات و بازبینی',
      script:
        'در صورتی که مبلغ قطعه یا دستمزد مصوب با فاکتورهای واقعی نمایندگی مغایرت دارد، می‌توانید از طریق دکمه «درخواست بازبینی ارزیابی» در پنل کاربری، فاکتور معتبر و پیش‌فاکتور اتحادیه صنف را بارگذاری کنید تا پرونده به ارزیاب ارشد جهت اصلاح قیمت ارجاع شود.'
    },
    {
      id: 'faq-4',
      title: 'تردید در اصالت تصادف و اعزام کارشناس میدانی',
      category: 'کارشناسی میدانی',
      script:
        'در مواردی که طرفین در خصوص اصالت تصادف یا سهم تقصیر دچار اختلاف هستند، کارشناس رسمی میدانی بیمه به محل حادثه اعزام شده و گزارش بازرسی فیزیکی ایشان ملاک پرداخت قطعی خسارت خواهد بود.'
    }
  ];

  const handleCopyFaq = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFaqId(id);
    setTimeout(() => setCopiedFaqId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-sky-50/20 text-slate-800 p-4 md:p-6 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Navbar & Master Header */}
        <div className="bg-white/95 border border-indigo-100/90 p-5 rounded-3xl backdrop-blur-md shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
              <Headphones className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  مرکز امور مشتریان، CRM و رسیدگی به شکایات
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full">
                  کال‌سنتر و ارتباطات
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                کارشناس پشتیبانی: <span className="text-slate-800 font-bold">{session.name}</span> • واحد: <span className="text-indigo-600 font-medium">پایش رضایت و رسیدگی به اعتراضات</span>
              </p>
            </div>
          </div>

          {/* Quick Global Search Bar */}
          <form onSubmit={handleGlobalSearch} className="flex items-center gap-2 w-full md:w-80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearchTerm}
                onChange={e => setGlobalSearchTerm(e.target.value)}
                placeholder="جستجوی پرونده یا موبایل مشتری..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
            >
              بیاب
            </button>
          </form>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-bold">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>داشبورد عملیاتی</span>
          </button>

          <button
            onClick={() => setActiveTab('customer360')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'customer360'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>نمای ۳۶۰ مشتری ({aggregatedCustomers.length})</span>
          </button>

          <button
            onClick={() => {
              if (!selectedCaseId && cases.length > 0) {
                setSelectedCaseId(cases[0].id);
              }
              setActiveTab('case360');
            }}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'case360'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>نمای ۳۶۰ پرونده خسارت</span>
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <span>رسیدگی به شکایات ({tickets.filter(t => t.status !== 'بسته شده و حل گردید').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'calls'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-sky-500" />
            <span>مرکز تماس و پیامک ({callLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'followups'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <span>وظایف پیگیری ({followUps.filter(f => f.status !== 'تکمیل و رفع مانع').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'faq'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>بانک اسکریپت و FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('surveys')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'surveys'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>نظرسنجی و رضایت‌سنجی</span>
          </button>
        </div>

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' && (
          <CrmDashboard
            session={session}
            cases={cases}
            customers={aggregatedCustomers}
            tickets={tickets}
            callLogs={callLogs}
            followUps={followUps}
            onSelectCustomer={phone => {
              setSelectedCustomerPhone(phone);
              setActiveTab('customer360');
            }}
            onSelectCase={caseId => {
              setSelectedCaseId(caseId);
              setActiveTab('case360');
            }}
            onSelectTicket={ticketId => {
              setSelectedTicketId(ticketId);
              setActiveTab('complaints');
            }}
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenNewCall={() => setShowNewCallModal(true)}
            onOpenNewFollowUp={() => setShowNewFollowUpModal(true)}
          />
        )}

        {activeTab === 'customer360' && (
          <CrmCustomer360
            session={session}
            customers={aggregatedCustomers}
            selectedCustomerPhone={selectedCustomerPhone}
            onSelectCustomerPhone={phone => setSelectedCustomerPhone(phone)}
            onSelectCase={caseId => {
              setSelectedCaseId(caseId);
              setActiveTab('case360');
            }}
            onSelectTicket={ticketId => {
              setSelectedTicketId(ticketId);
              setActiveTab('complaints');
            }}
            onOpenNewCallForCustomer={cust => {
              setNewCallForm(prev => ({
                ...prev,
                contactName: cust.name,
                contactPhone: cust.phone,
                contactRole: cust.roles[0] || 'زیان‌دیده',
                caseId: cust.relatedCases[0]?.id || ''
              }));
              setShowNewCallModal(true);
            }}
            onOpenNewFollowUpForCustomer={cust => {
              setNewFollowUpForm(prev => ({
                ...prev,
                customerName: cust.name,
                customerPhone: cust.phone,
                caseId: cust.relatedCases[0]?.id || ''
              }));
              setShowNewFollowUpModal(true);
            }}
          />
        )}

        {activeTab === 'case360' && (
          <div className="space-y-6">
            {currentSelectedCase ? (
              <>
                <CrmCase360
                  session={session}
                  claimCase={currentSelectedCase}
                  onBack={() => setActiveTab('dashboard')}
                  onSelectCustomer={phone => {
                    setSelectedCustomerPhone(phone);
                    setActiveTab('customer360');
                  }}
                  onOpenNewCallForCase={c => {
                    setNewCallForm(prev => ({
                      ...prev,
                      contactName: c.victimName,
                      contactPhone: c.victimPhone,
                      contactRole: 'زیان‌دیده',
                      caseId: c.id
                    }));
                    setShowNewCallModal(true);
                  }}
                  onOpenNewFollowUpForCase={c => {
                    setNewFollowUpForm(prev => ({
                      ...prev,
                      customerName: c.victimName,
                      customerPhone: c.victimPhone,
                      caseId: c.id
                    }));
                    setShowNewFollowUpModal(true);
                  }}
                  onOpenNewTicketForCase={c => {
                    setNewTicketForm(prev => ({
                      ...prev,
                      customerName: c.victimName,
                      customerPhone: c.victimPhone,
                      caseId: c.id
                    }));
                    setShowNewTicketModal(true);
                  }}
                  onSendSmsReminder={handleSendSmsReminder}
                />

                {/* Integrated Timeline */}
                <CrmTimeline
                  claimCase={currentSelectedCase}
                  tickets={tickets}
                  callLogs={callLogs}
                  followUps={followUps}
                />
              </>
            ) : (
              <div className="bg-white border border-slate-200/80 p-12 rounded-3xl text-center space-y-3 shadow-xs">
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">پرونده‌ای جهت نمایش ۳۶۰ درجه انتخاب نشده است.</p>
                <p className="text-xs text-slate-500">لطفاً از بخش داشبورد یا جستجوی بالای صفحه یک پرونده را انتخاب فرمایید.</p>
              </div>
            )}
          </div>
        )}

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
            }}
            onSelectCase={caseId => {
              setSelectedCaseId(caseId);
              setActiveTab('case360');
            }}
            onOpenNewTicketModal={() => setShowNewTicketModal(true)}
          />
        )}

        {activeTab === 'calls' && (
          <CrmCallCenter
            session={session}
            callLogs={callLogs}
            cases={cases}
            onOpenNewCallModal={() => setShowNewCallModal(true)}
            onSelectCase={caseId => {
              setSelectedCaseId(caseId);
              setActiveTab('case360');
            }}
            onSelectCustomer={phone => {
              setSelectedCustomerPhone(phone);
              setActiveTab('customer360');
            }}
          />
        )}

        {activeTab === 'followups' && (
          <CrmFollowUpManager
            session={session}
            followUps={followUps}
            cases={cases}
            onUpdateFollowUps={updated => {
              setFollowUps(updated);
              saveCrmFollowUpsToStorage(updated);
            }}
            onOpenNewTaskModal={() => setShowNewFollowUpModal(true)}
            onSelectCase={caseId => {
              setSelectedCaseId(caseId);
              setActiveTab('case360');
            }}
            onSelectCustomer={phone => {
              setSelectedCustomerPhone(phone);
              setActiveTab('customer360');
            }}
          />
        )}

        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div className="bg-white border border-indigo-100/90 p-5 rounded-3xl space-y-1 shadow-xs">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>بانک اسکریپت‌ها و پاسخ‌های استاندارد پاسخگویی (Knowledge Base)</span>
              </h3>
              <p className="text-xs text-slate-500">
                پاسخ‌های دقیق و مستند به قوانین سنهاب بیمه مرکزی جهت استفاده کارشناسان در تماس‌های تلفنی و پیامکی
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQ_SCRIPTS.map(f => (
                <div
                  key={f.id}
                  className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{f.title}</h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 font-bold shrink-0">
                        {f.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                      {f.script}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleCopyFaq(f.id, f.script)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedFaqId === f.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFaqId === f.id ? 'متن کپی شد' : 'کپی اسکریپت'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'surveys' && (
          <div className="space-y-4">
            <div className="bg-white border border-amber-100/90 p-5 rounded-3xl space-y-1 shadow-xs">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>نتایج نظرسنجی و رضایت‌سنجی برخط زیان‌دیدگان (CSAT)</span>
              </h3>
              <p className="text-xs text-slate-500">
                پایش میانگین رضایت از سرعت رسیدگی، عدالت در برآورد خسارت و کیفیت پاسخگویی امور مشتریان
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {surveys.map(s => (
                <div
                  key={s.id}
                  className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{s.customerName}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">{maskPhoneNumber(s.customerPhone)}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-xl font-black text-xs font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{s.overallRating} از ۵</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-2xl text-center border border-slate-100">
                    <div>
                      <span className="text-slate-500 text-[10px] block">سرعت رسیدگی</span>
                      <span className="font-mono font-bold text-slate-800">{s.ratingSpeed} / ۵</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">عدالت برآورد</span>
                      <span className="font-mono font-bold text-slate-800">{s.ratingFairness} / ۵</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">پشتیبانی</span>
                      <span className="font-mono font-bold text-slate-800">{s.ratingSupport} / ۵</span>
                    </div>
                  </div>

                  {s.comment && (
                    <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/40 p-3 rounded-xl border border-amber-100/60">
                      «{s.comment}»
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>پرونده: <strong className="font-mono text-indigo-600">{s.caseId}</strong></span>
                    <span className="font-mono">{s.submittedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Register New Call */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <span>ثبت گزارش مکالمه تلفنی جدید</span>
              </div>
              <button
                onClick={() => setShowNewCallModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">نام و نام خانوادگی مخاطب:</label>
                  <input
                    type="text"
                    value={newCallForm.contactName}
                    onChange={e => setNewCallForm({ ...newCallForm, contactName: e.target.value })}
                    placeholder="مثال: فرشاد کریمی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">شماره موبایل:</label>
                  <input
                    type="text"
                    value={newCallForm.contactPhone}
                    onChange={e => setNewCallForm({ ...newCallForm, contactPhone: e.target.value })}
                    placeholder="مثال: 09121111111"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">نقش مخاطب:</label>
                  <select
                    value={newCallForm.contactRole}
                    onChange={e => setNewCallForm({ ...newCallForm, contactRole: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 outline-none"
                  >
                    <option value="زیان‌دیده">زیان‌دیده</option>
                    <option value="مقصر حادثه">مقصر حادثه</option>
                    <option value="بیمه‌گذار">بیمه‌گذار</option>
                    <option value="کارشناس میدانی">کارشناس میدانی</option>
                    <option value="شخص ثالث">شخص ثالث</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">جهت تماس:</label>
                  <select
                    value={newCallForm.callDirection}
                    onChange={e => setNewCallForm({ ...newCallForm, callDirection: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 outline-none"
                  >
                    <option value="ورودی (تماس مشتری)">ورودی (تماس مشتری)</option>
                    <option value="خروجی (تماس کارشناس)">خروجی (تماس کارشناس)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">موضوع مکالمه:</label>
                  <select
                    value={newCallForm.topic}
                    onChange={e => setNewCallForm({ ...newCallForm, topic: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 outline-none"
                  >
                    <option value="پیگیری واریز خسارت">پیگیری واریز خسارت</option>
                    <option value="نقص مدارک و عکس‌ها">نقص مدارک و عکس‌ها</option>
                    <option value="اعتراض به ارزیابی خسارت">اعتراض به ارزیابی خسارت</option>
                    <option value="هماهنگی کارشناس میدانی">هماهنگی کارشناس میدانی</option>
                    <option value="استعلام اصالت کروکی">استعلام اصالت کروکی</option>
                    <option value="سوال عمومی و مشاوره">سوال عمومی و مشاوره</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-bold">شماره پرونده متصل (اختیاری):</label>
                  <input
                    type="text"
                    value={newCallForm.caseId}
                    onChange={e => setNewCallForm({ ...newCallForm, caseId: e.target.value })}
                    placeholder="مثال: CF-1001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">خلاصه مکالمه و راهنمایی انجام‌شده:</label>
                <textarea
                  value={newCallForm.notes}
                  onChange={e => setNewCallForm({ ...newCallForm, notes: e.target.value })}
                  placeholder="نکات مطرح شده توسط مشتری و پاسخ‌های ارائه شده..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCallForm.followUpRequired}
                    onChange={e => setNewCallForm({ ...newCallForm, followUpRequired: e.target.checked })}
                    className="rounded bg-slate-50 border-slate-300 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-700 font-bold">نیاز به پیگیری مجدد دارد</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewCallModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCallLog}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ثبت و ذخیره در سوابق</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: New Follow-up Task */}
      {showNewFollowUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span>تعریف وظیفه پیگیری رفع مانع</span>
              </div>
              <button
                onClick={() => setShowNewFollowUpModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">نام مشتری:</label>
                  <input
                    type="text"
                    value={newFollowUpForm.customerName}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">شماره تماس:</label>
                  <input
                    type="text"
                    value={newFollowUpForm.customerPhone}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:bg-white focus:border-indigo-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">واحد مسئول رسیدگی:</label>
                  <select
                    value={newFollowUpForm.targetDepartment}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, targetDepartment: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 outline-none"
                  >
                    <option value="ارزیابی خسارت">ارزیابی خسارت</option>
                    <option value="بازبینی و نظارت">بازبینی و نظارت</option>
                    <option value="مالی و خزانه‌داری">مالی و خزانه‌داری</option>
                    <option value="کارشناسی میدانی">کارشناسی میدانی</option>
                    <option value="شعبه و خسارت">شعبه و خسارت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">کد پرونده (اختیاری):</label>
                  <input
                    type="text"
                    value={newFollowUpForm.caseId}
                    onChange={e => setNewFollowUpForm({ ...newFollowUpForm, caseId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:bg-white focus:border-indigo-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">شرح مانع و موضوع پیگیری:</label>
                <textarea
                  value={newFollowUpForm.reason}
                  onChange={e => setNewFollowUpForm({ ...newFollowUpForm, reason: e.target.value })}
                  placeholder="مثال: پیگیری اصلاح شماره شبا و تسریع صدور حواله پایا توسط واحد مالی..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-indigo-400 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewFollowUpModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveFollowUp}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ثبت وظیفه پیگیری</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: New Complaint / Ticket */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <span>ثبت شکایت / تیکت رسمی مشتری</span>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">نام شاکی:</label>
                  <input
                    type="text"
                    value={newTicketForm.customerName}
                    onChange={e => setNewTicketForm({ ...newTicketForm, customerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-rose-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">شماره موبایل:</label>
                  <input
                    type="text"
                    value={newTicketForm.customerPhone}
                    onChange={e => setNewTicketForm({ ...newTicketForm, customerPhone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:bg-white focus:border-rose-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">دسته‌بندی شکایت:</label>
                  <select
                    value={newTicketForm.category}
                    onChange={e => setNewTicketForm({ ...newTicketForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-rose-400 outline-none"
                  >
                    <option value="شکایت از مبلغ ارزیابی">شکایت از مبلغ ارزیابی</option>
                    <option value="تاخیر در پرداخت خسارت">تاخیر در پرداخت خسارت</option>
                    <option value="اعتراض به کروکی و مقصر">اعتراض به کروکی و مقصر</option>
                    <option value="مشکل بارگذاری مدارک">مشکل بارگذاری مدارک</option>
                    <option value="تغییر شماره شبا">تغییر شماره شبا</option>
                    <option value="سوالات عمومی">سوالات عمومی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">شماره پرونده (اختیاری):</label>
                  <input
                    type="text"
                    value={newTicketForm.caseId}
                    onChange={e => setNewTicketForm({ ...newTicketForm, caseId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-mono focus:bg-white focus:border-rose-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">عنوان شکایت:</label>
                <input
                  type="text"
                  value={newTicketForm.subject}
                  onChange={e => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                  placeholder="مثال: عدم تایید قیمت چراغ جلو توسط ارزیاب"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-rose-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">شرح کامل پیام شکایت:</label>
                <textarea
                  value={newTicketForm.initialMessage}
                  onChange={e => setNewTicketForm({ ...newTicketForm, initialMessage: e.target.value })}
                  placeholder="جزئیات ادعای مشتری و مستندات ارائه شده..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white focus:border-rose-400 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveTicket}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>ثبت شکایت و ارجاع به صف رسیدگی</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
