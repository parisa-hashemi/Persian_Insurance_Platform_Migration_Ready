import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Headphones,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Send,
  User,
  Star,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Smile,
  Frown,
  Meh,
  PhoneForwarded,
  PhoneIncoming,
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
  Copy,
  Check,
  Building
} from 'lucide-react';
import { UserSession, ClaimCase, CustomerCallLog, CustomerTicket, CrmSatisfactionSurvey } from '../../types';
import {
  loadCrmCallLogsFromStorage,
  saveCrmCallLogsToStorage,
  loadCrmTicketsFromStorage,
  saveCrmTicketsToStorage,
  loadCrmSurveysFromStorage,
  saveCrmSurveysToStorage,
  saveCasesToStorage
} from '../../lib/storage';

interface CrmSupportPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updated: ClaimCase) => void;
  onOpenCaseForm?: (caseId: string) => void;
}

export const CrmSupportPanel: React.FC<CrmSupportPanelProps> = ({
  session,
  cases,
  onUpdateCase,
  onOpenCaseForm
}) => {
  const [activeTab, setActiveTab] = useState<'calls' | 'tickets' | 'complaints' | 'faq' | 'surveys'>('calls');

  const [callLogs, setCallLogs] = useState<CustomerCallLog[]>(() => loadCrmCallLogsFromStorage());
  const [tickets, setTickets] = useState<CustomerTicket[]>(() => loadCrmTicketsFromStorage());
  const [surveys, setSurveys] = useState<CrmSatisfactionSurvey[]>(() => loadCrmSurveysFromStorage());

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [callSentimentFilter, setCallSentimentFilter] = useState<string>('ALL');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('ALL');

  // Modals & Active items
  const [showNewCallModal, setShowNewCallModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CustomerTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  // New Call Form State
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

  // KPIs
  const stats = useMemo(() => {
    const totalCalls = callLogs.length;
    const openTickets = tickets.filter(t => t.status !== 'بسته شده و حل گردید').length;
    const complaintsCount = tickets.filter(t => t.category === 'شکایت از مبلغ ارزیابی' || t.priority.includes('بحرانی')).length;
    const urgentDisputes = callLogs.filter(c => c.sentiment === 'ناراضی و شاکی' || c.sentiment === 'فوری و بحرانی').length;
    
    const totalSurveys = surveys.length;
    const avgOverall = totalSurveys > 0
      ? (surveys.reduce((sum, s) => sum + s.overallRating, 0) / totalSurveys).toFixed(1)
      : '۴.۸';

    return {
      totalCalls,
      openTickets,
      complaintsCount,
      urgentDisputes,
      avgOverall
    };
  }, [callLogs, tickets, surveys]);

  // Handle Log New Call
  const handleSaveCallLog = () => {
    if (!newCallForm.contactName.trim() || !newCallForm.contactPhone.trim() || !newCallForm.notes.trim()) {
      alert('لطفاً نام مخاطب، شماره تماس و خلاصه مکالمه را وارد کنید.');
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

    const updated = [newLog, ...callLogs];
    setCallLogs(updated);
    saveCrmCallLogsToStorage(updated);

    // If linked to a case, append a history log in the case
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
              note: `ثبت مکالمه ${newCallForm.callDirection} با ${newCallForm.contactName} (${newCallForm.contactRole}): ${newCallForm.notes.slice(0, 100)}...`
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

  // Handle Reply to Ticket
  const handleSendTicketReply = () => {
    if (!selectedTicket || !ticketReplyText.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'AGENT' as const,
      senderName: `${session.name} (کارشناس CRM)`,
      senderRole: 'کارشناس امور مشتریان',
      text: ticketReplyText.trim(),
      time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTickets = tickets.map(t => {
      if (t.id !== selectedTicket.id) return t;
      return {
        ...t,
        status: 'پاسخ داده شده' as const,
        lastUpdate: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        assignedAgent: session.name,
        messages: [...t.messages, newMessage]
      };
    });

    setTickets(updatedTickets);
    saveCrmTicketsToStorage(updatedTickets);

    const updatedCurrent = updatedTickets.find(t => t.id === selectedTicket.id) || null;
    setSelectedTicket(updatedCurrent);
    setTicketReplyText('');
  };

  // Handle Escalate or Close Ticket
  const handleUpdateTicketStatus = (ticketId: string, newStatus: CustomerTicket['status']) => {
    const updatedTickets = tickets.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        status: newStatus,
        lastUpdate: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        assignedAgent: session.name
      };
    });
    setTickets(updatedTickets);
    saveCrmTicketsToStorage(updatedTickets);
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updatedTickets.find(t => t.id === ticketId) || null);
    }
  };

  // FAQ Canned Data
  const FAQ_SCRIPTS = [
    {
      id: 'faq-1',
      title: 'مدارک و نحوه تسویه خسارت بدون کروکی پلیس',
      category: 'پذیرش و ارزیابی',
      script: 'با سلام، در تصادفات تا سقف تعهد مالی سال ۱۴۰۳ (تا مبلغ ۴۰ میلیون تومان)، نیازی به کروکی پلیس نبوده و صرفاً با بارگذاری عکس‌های ۴ طرف خودرو، تصویر گواهینامه و کارت ملی طرفین و بیمه‌نامه شخص ثالث معتبر مقصر در سامانه آنلاین، ارزیابی هوشمند و واریز مستقیم شبا انجام می‌پذیرد.'
    },
    {
      id: 'faq-2',
      title: 'زمان واریز وجه خسارت به شماره شبا',
      category: 'مالی و خزانه‌داری',
      script: 'سلام، پس از تایید برآورد خسارت توسط زیان‌دیده یا کارشناس میدانی، حواله پرداخت مالی در همان روز صادر و از طریق سامانه پایا بانک مرکزی در اولین سیکل واریز بانکی (حداکثر ظرف ۲۴ ساعت کاری) به حساب شبای اعلامی شما واریز خواهد شد.'
    },
    {
      id: 'faq-3',
      title: 'نحوه اعتراض به مبلغ برآورد و قیمت قطعات داغی',
      category: 'شکایات و بازبینی',
      script: 'در صورتی که مبلغ قطعه یا دستمزد مصوب با فاکتورهای واقعی نمایندگی مغایرت دارد، می‌توانید از طریق دکمه «درخواست بازبینی ارزیابی» در پنل کاربری، فاکتور معتبر و پیش‌فاکتور اتحادیه صنف را بارگذاری کنید تا پرونده به ارزیاب ارشد جهت اصلاح قیمت ارجاع شود.'
    },
    {
      id: 'faq-4',
      title: 'تردید در اصالت تصادف و اعزام کارشناس میدانی',
      category: 'کارشناسی میدانی',
      script: 'در مواردی که طرفین در خصوص اصالت تصادف یا سهم تقصیر دچار اختلاف هستند، کارشناس رسمی میدانی بیمه به محل حادثه اعزام شده و گزارش بازرسی فیزیکی ایشان ملاک پرداخت قطعی خسارت خواهد بود.'
    }
  ];

  const handleCopyFaq = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFaqId(id);
    setTimeout(() => setCopiedFaqId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans antialiased">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Headphones className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  مرکز امور مشتریان، CRM و رسیدگی به شکایات
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  کال‌سنتر و ارتباطات
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                کارشناس پشتیبانی: <span className="text-slate-200 font-medium">{session.name}</span> | واحد: <span className="text-indigo-300 font-medium">پایش رضایت و رسیدگی به اعتراضات</span>
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowNewCallModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              ثبت مکالمه / تماس جدید
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-4 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/60">
          <button
            id="crm-tab-calls"
            onClick={() => setActiveTab('calls')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'calls'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            دفتر ثبت تماس‌ها و مکالمات ({callLogs.length})
          </button>

          <button
            id="crm-tab-tickets"
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'tickets'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            تیکت‌ها و درخواست‌های پشتیبانی
            {stats.openTickets > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stats.openTickets}
              </span>
            )}
          </button>

          <button
            id="crm-tab-complaints"
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'complaints'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            میز شکایات و اختلافات بیمه مرکزی
            {stats.complaintsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stats.complaintsCount}
              </span>
            )}
          </button>

          <button
            id="crm-tab-faq"
            onClick={() => setActiveTab('faq')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'faq'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            پایگاه دانش و اسکریپت‌های پاسخگویی
          </button>

          <button
            id="crm-tab-surveys"
            onClick={() => setActiveTab('surveys')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'surveys'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Star className="w-4 h-4" />
            شاخص رضایت‌سنجی (CSAT: {stats.avgOverall})
          </button>
        </div>

        {/* CRM KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>کل تماس‌های ثبت‌شده</span>
              <PhoneCall className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.totalCalls} تماس</div>
            <div className="text-xs text-indigo-300">پوشش کامل سوابق مکالمات</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>تیکت‌های باز و فعال</span>
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300 mb-1">{stats.openTickets} تیکت</div>
            <div className="text-xs text-amber-400">میانگین زمان پاسخ: ۱۵ دقیقه</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>شکایات ارجاع‌شده</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-300 mb-1">{stats.complaintsCount} پرونده</div>
            <div className="text-xs text-rose-400">تحت نظارت بازرسی و کارشناس ارشد</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>امتیاز رضایت مشتری (CSAT)</span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-yellow-300 mb-1">{stats.avgOverall} از ۵</div>
            <div className="text-xs text-emerald-400">۹۴٪ رضایت از سهولت فرآیند آنلاین</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {/* TAB 1: CALL LOGS */}
        {activeTab === 'calls' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام مخاطب، شماره تماس یا شماره پرونده..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> حالت مخاطب:
                </span>
                {(['ALL', 'آرام و راضی', 'نگران و عجول', 'ناراضی و شاکی'] as const).map(sent => (
                  <button
                    key={sent}
                    onClick={() => setCallSentimentFilter(sent)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      callSentimentFilter === sent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {sent === 'ALL' ? 'همه' : sent}
                  </button>
                ))}
              </div>
            </div>

            {/* Calls List */}
            <div className="space-y-3">
              {callLogs
                .filter(call => {
                  if (callSentimentFilter !== 'ALL' && call.sentiment !== callSentimentFilter) return false;
                  if (searchTerm.trim()) {
                    const q = searchTerm.toLowerCase().trim();
                    const matchesName = call.contactName.toLowerCase().includes(q);
                    const matchesPhone = call.contactPhone.toLowerCase().includes(q);
                    const matchesCase = call.caseId?.toLowerCase().includes(q) || false;
                    const matchesNotes = call.notes.toLowerCase().includes(q);
                    return matchesName || matchesPhone || matchesCase || matchesNotes;
                  }
                  return true;
                })
                .map(call => (
                  <div
                    key={call.id}
                    className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-md hover:border-slate-600 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            call.callDirection.includes('ورودی')
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {call.callDirection.includes('ورودی') ? (
                            <PhoneIncoming className="w-5 h-5" />
                          ) : (
                            <PhoneForwarded className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{call.contactName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                              {call.contactRole}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{call.contactPhone}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                            <span>موضوع: <strong className="text-slate-200">{call.topic}</strong></span>
                            <span>مدت تماس: {call.durationMinutes} دقیقه</span>
                            <span>ثبت توسط: {call.agentName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Sentiment badge */}
                        {call.sentiment === 'آرام و راضی' && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                            <Smile className="w-3.5 h-3.5" /> آرام و راضی
                          </span>
                        )}
                        {call.sentiment === 'نگران و عجول' && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                            <Meh className="w-3.5 h-3.5" /> نگران / پیگیر
                          </span>
                        )}
                        {call.sentiment === 'ناراضی و شاکی' && (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-full flex items-center gap-1">
                            <Frown className="w-3.5 h-3.5" /> ناراضی و شاکی
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-mono">
                          {call.callDate} {call.callTime}
                        </span>
                      </div>
                    </div>

                    {/* Notes Content */}
                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-indigo-400 block mb-1">خلاصه مکالمه و توافقات:</strong>
                      {call.notes}
                    </div>

                    {/* Footer / Linked Case */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        {call.caseId ? (
                          <button
                            onClick={() => onOpenCaseForm?.(call.caseId!)}
                            className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            مشاهده پرونده متصل: {call.caseId}
                          </button>
                        ) : (
                          <span className="text-slate-500">بدون شماره پرونده مشخص</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {call.followUpRequired && (
                          <span className="text-amber-400 flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5" /> نیازمند پیگیری بعدی ({call.followUpDate || 'فردا'})
                          </span>
                        )}
                        {call.resolvedInCall && (
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> حل مشکل در مکالمه
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-white text-sm">کارتابل تیکت‌ها و مکاتبات مشتریان</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">وضعیت:</span>
                  {(['ALL', 'در انتظار پاسخ', 'در حال پیگیری', 'پاسخ داده شده', 'بسته شده و حل گردید'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setTicketStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        ticketStatusFilter === st
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {st === 'ALL' ? 'همه' : st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-700/50">
                {tickets
                  .filter(t => ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter)
                  .map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-4 hover:bg-slate-700/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800">
                            {ticket.ticketNumber}
                          </span>
                          <span className="font-bold text-white text-sm">{ticket.subject}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {ticket.category}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>ثبت‌کننده: <strong className="text-slate-200">{ticket.customerName}</strong> ({ticket.customerRole})</span>
                          <span>موبایل: {ticket.customerPhone}</span>
                          {ticket.caseId && <span>پرونده: <strong className="text-cyan-300 font-mono">{ticket.caseId}</strong></span>}
                          <span>پیام‌ها: {ticket.messages.length}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {ticket.priority.includes('بحرانی') ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                            {ticket.priority}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-700 text-slate-300 rounded-full">
                            اولویت: {ticket.priority}
                          </span>
                        )}

                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                            ticket.status === 'در انتظار پاسخ'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : ticket.status === 'پاسخ داده شده'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : ticket.status === 'بسته شده و حل گردید'
                              ? 'bg-slate-700/60 text-slate-400 border-slate-600'
                              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {ticket.status}
                        </span>

                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLAINTS & DISPUTES */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            <div className="bg-rose-950/30 border border-rose-800/50 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  میز تخصصی شکایات رسمی و اعتراضات به هیئت حل اختلاف بیمه مرکزی
                </h3>
                <p className="text-xs text-rose-200/80 mt-1">
                  پرونده‌هایی که مشتری در سامانه سنهاب بیمه مرکزی یا پورتال شرکت بیمه شکایت ثبت کرده است. اقدام سریع و پاسخ مستند الزامی است.
                </p>
              </div>

              <div className="text-left font-mono">
                <span className="text-xs text-rose-300">پرونده‌های بحرانی:</span>
                <div className="text-xl font-bold text-rose-400">{stats.complaintsCount} مورد</div>
              </div>
            </div>

            <div className="space-y-3">
              {tickets
                .filter(t => t.category === 'شکایت از مبلغ ارزیابی' || t.priority.includes('بحرانی'))
                .map(complaint => (
                  <div
                    key={complaint.id}
                    className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{complaint.subject}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            شکایت رسمی
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span>شاکی: <strong className="text-slate-200">{complaint.customerName}</strong> ({complaint.customerRole})</span>
                          <span>تلفن تماس: {complaint.customerPhone}</span>
                          <span>پرونده خسارت: <strong className="text-cyan-400 font-mono">{complaint.caseId || 'CLM-1403-9120'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (complaint.caseId) onOpenCaseForm?.(complaint.caseId);
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> بررسی پرونده
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400">متن شکایت و ادعای زیان‌دیده:</div>
                      <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700 text-xs text-slate-200">
                        {complaint.messages[0]?.text}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">
                        اقدامات سریع حل اختلاف و رفع شکایت:
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            alert(`پرونده ${complaint.caseId} جهت بازبینی قیمت قطعات به ارزیاب ارشد ارجاع داده شد.`);
                            handleUpdateTicketStatus(complaint.id, 'ارجاع به ارزیاب ارشد');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          ارجاع به ارزیاب ارشد (تجدیدنظر قیمت)
                        </button>

                        <button
                          onClick={() => {
                            alert(`دستور اعزام کارشناس میدانی برای پرونده ${complaint.caseId} صادر شد.`);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          درخواست اعزام کارشناس میدانی
                        </button>

                        <button
                          onClick={() => setSelectedTicket(complaint)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          پاسخ رسمی و مکاتبه
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: FAQ & SCRIPTS */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                پایگاه دانش اسکریپت‌های پاسخگویی سریع کال‌سنتر (Canned Responses)
              </h3>
              <p className="text-xs text-slate-400">
                کارشناسان امور مشتریان می‌توانند این متون استاندارد را جهت ارائه پاسخ یکپارچه، قانونی و دقیق در مکالمات تلفنی یا تیکت‌ها کپی و استفاده نمایند.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQ_SCRIPTS.map(faq => (
                <div
                  key={faq.id}
                  className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-3 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{faq.title}</span>
                      <span className="text-[11px] px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded border border-indigo-800">
                        {faq.category}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 text-xs text-slate-300 leading-relaxed font-sans">
                      {faq.script}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleCopyFaq(faq.id, faq.script)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        copiedFaqId === faq.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      {copiedFaqId === faq.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> متن کپی شد!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> کپی متن استاندارد
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CSAT SURVEYS */}
        {activeTab === 'surveys' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                تحلیل شاخص‌های رضایت‌سنجی زیان‌دیدگان و بیمه‌گذاران
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 text-center">
                  <div className="text-xs text-slate-400">سرعت رسیدگی و واریز وجه</div>
                  <div className="text-3xl font-black text-emerald-400 my-2">۴.۷ / ۵</div>
                  <div className="flex justify-center gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400" />
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 text-center">
                  <div className="text-xs text-slate-400">انصاف در برآورد بهای قطعات</div>
                  <div className="text-3xl font-black text-cyan-400 my-2">۴.۵ / ۵</div>
                  <div className="flex justify-center gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'fill-yellow-400' : 'text-slate-600'}`} />
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 text-center">
                  <div className="text-xs text-slate-400">کیفیت پاسخگویی پشتیبانی</div>
                  <div className="text-3xl font-black text-indigo-400 my-2">۴.۹ / ۵</div>
                  <div className="flex justify-center gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Survey Feedback List */}
            <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl">
              <h4 className="text-sm font-bold text-white mb-4">نظرات و دیدگاه‌های ثبت‌شده پس از تسویه خسارت:</h4>
              <div className="space-y-3">
                {surveys.map(s => (
                  <div key={s.id} className="bg-slate-900/60 border border-slate-700/70 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-white text-sm">{s.customerName}</span>
                        <span className="text-xs text-slate-500 font-mono">({s.caseId})</span>
                      </div>

                      <div className="flex items-center gap-1 text-yellow-400">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i <= s.overallRating ? 'fill-yellow-400' : 'text-slate-600'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-2.5 rounded-lg">
                      «{s.comment}»
                    </p>
                    <div className="text-[10px] text-slate-500 mt-2 text-left">{s.submittedAt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Log New Call */}
      {showNewCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="bg-slate-900/80 p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <PhoneCall className="w-4 h-4 text-indigo-400" />
                ثبت سابقه مکالمه و تماس جدید با مشتری
              </div>
              <button
                onClick={() => setShowNewCallModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">نام و نام خانوادگی مخاطب:</label>
                  <input
                    type="text"
                    placeholder="مثال: مهدی کشاورز"
                    value={newCallForm.contactName}
                    onChange={e => setNewCallForm({ ...newCallForm, contactName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">شماره تماس:</label>
                  <input
                    type="text"
                    placeholder="0912..."
                    value={newCallForm.contactPhone}
                    onChange={e => setNewCallForm({ ...newCallForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">نقش مخاطب:</label>
                  <select
                    value={newCallForm.contactRole}
                    onChange={e => setNewCallForm({ ...newCallForm, contactRole: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="زیان‌دیده">زیان‌دیده</option>
                    <option value="مقصر حادثه">مقصر حادثه</option>
                    <option value="بیمه‌گذار">بیمه‌گذار</option>
                    <option value="کارشناس میدانی">کارشناس میدانی</option>
                    <option value="شخص ثالث">شخص ثالث</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">جهت تماس:</label>
                  <select
                    value={newCallForm.callDirection}
                    onChange={e => setNewCallForm({ ...newCallForm, callDirection: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ورودی (تماس مشتری)">ورودی (تماس مشتری)</option>
                    <option value="خروجی (تماس کارشناس)">خروجی (تماس کارشناس)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">موضوع مکالمه:</label>
                  <select
                    value={newCallForm.topic}
                    onChange={e => setNewCallForm({ ...newCallForm, topic: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
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
                  <label className="block text-slate-300 mb-1 font-medium">وضعیت رضایت / رفتار مخاطب:</label>
                  <select
                    value={newCallForm.sentiment}
                    onChange={e => setNewCallForm({ ...newCallForm, sentiment: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="آرام و راضی">آرام و راضی</option>
                    <option value="نیازمند راهنمایی">نیازمند راهنمایی</option>
                    <option value="نگران و عجول">نگران و عجول</option>
                    <option value="ناراضی و شاکی">ناراضی و شاکی</option>
                    <option value="فوری و بحرانی">فوری و بحرانی</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">شماره پرونده متصل (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="CLM-1403-..."
                    value={newCallForm.caseId}
                    onChange={e => setNewCallForm({ ...newCallForm, caseId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">مدت مکالمه (دقیقه):</label>
                  <input
                    type="number"
                    min="1"
                    value={newCallForm.durationMinutes}
                    onChange={e => setNewCallForm({ ...newCallForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">شرح کامل مکالمه، درخواست و توافقات:</label>
                <textarea
                  rows={3}
                  placeholder="موضوعات مطرح‌شده توسط مخاطب و پاسخ کارشناس..."
                  value={newCallForm.notes}
                  onChange={e => setNewCallForm({ ...newCallForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/60 pt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCallForm.followUpRequired}
                    onChange={e => setNewCallForm({ ...newCallForm, followUpRequired: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-600 text-indigo-500 focus:ring-0"
                  />
                  <span className="text-slate-300">نیاز به پیگیری و تماس مجدد دارد</span>
                </label>

                {newCallForm.followUpRequired && (
                  <input
                    type="text"
                    placeholder="تاریخ پیگیری (۱۴۰۳/۰۵/۲۲)"
                    value={newCallForm.followUpDate}
                    onChange={e => setNewCallForm({ ...newCallForm, followUpDate: e.target.value })}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                  />
                )}
              </div>
            </div>

            <div className="bg-slate-900/80 p-4 border-t border-slate-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewCallModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCallLog}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-900/30"
              >
                <CheckCircle className="w-4 h-4" /> ذخیره مکالمه در پرونده
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Ticket Details & Reply Thread */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-900/80 p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    {selectedTicket.ticketNumber}
                  </span>
                  <span className="font-bold text-white text-sm">{selectedTicket.subject}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  مشتری: <strong className="text-slate-200">{selectedTicket.customerName}</strong> ({selectedTicket.customerPhone})
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Messages Thread */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
              {selectedTicket.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl max-w-[85%] ${
                    msg.sender === 'AGENT'
                      ? 'bg-indigo-950/70 border border-indigo-800/60 text-indigo-100 mr-auto'
                      : 'bg-slate-900 border border-slate-700 text-slate-200 ml-auto'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[11px]">
                    <span className="font-bold text-indigo-300">{msg.senderName}</span>
                    <span className="text-slate-500 font-mono">{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Box */}
            <div className="p-4 bg-slate-900/80 border-t border-slate-700 space-y-3">
              <textarea
                rows={2}
                placeholder="پاسخ به تیکت مشتری..."
                value={ticketReplyText}
                onChange={e => setTicketReplyText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-indigo-500 resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'بسته شده و حل گردید')}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    بستن تیکت (حل گردید)
                  </button>

                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'ارجاع به ارزیاب ارشد')}
                    className="px-3 py-1.5 bg-amber-900/50 hover:bg-amber-800/80 text-amber-200 rounded-lg text-xs font-medium border border-amber-700/50"
                  >
                    ارجاع به ارزیاب ارشد
                  </button>
                </div>

                <button
                  onClick={handleSendTicketReply}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-900/30"
                >
                  <Send className="w-3.5 h-3.5" /> ارسال پاسخ به مشتری
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
