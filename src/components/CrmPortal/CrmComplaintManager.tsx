import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  MessageSquare,
  Search,
  Filter,
  Send,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  Plus,
  ChevronDown,
  Building,
  DollarSign,
  PhoneCall,
  FileText,
  Image as ImageIcon,
  Eye,
  X,
  Phone,
  Check,
  AlertTriangle,
  Sparkles,
  Car,
  FileSpreadsheet,
  MapPin,
  Calendar,
  Smartphone,
  Info
} from 'lucide-react';
import { CustomerTicket, UserSession, ClaimCase, AdditionalDocItem, CustomerCallLog } from '../../types';
import { maskPhoneNumber, maskNationalId, formatCurrency } from './crmHelpers';
import { loadCrmCallLogsFromStorage, saveCrmCallLogsToStorage } from '../../lib/storage';

interface CrmComplaintManagerProps {
  session: UserSession;
  tickets: CustomerTicket[];
  cases: ClaimCase[];
  selectedTicketId: string | null;
  onSelectTicketId: (id: string | null) => void;
  onUpdateTickets: (tickets: CustomerTicket[]) => void;
  onSelectCase: (caseId: string) => void;
  onOpenNewTicketModal: () => void;
}

const DEFAULT_BRANCHES = [
  {
    name: 'شعبه مرکزی خسارت (مرکز تخصصی ارزیابی)',
    address: 'تهران، خیابان استاد نجات‌اللهی، کوچه بیمه، پلاک ۱۲',
    phone: '۰۲۱-۸۸۹۹۰۰۱۱',
    hours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰'
  },
  {
    name: 'شعبه خسارت غرب (آزادی)',
    address: 'تهران، بزرگراه شهید لشگری (مخصوص کرج)، بعد از پل جناح، نبش کوچه بیمه سوم',
    phone: '۰۲۱-۴۴۵۵۶۶۷۷',
    hours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰'
  },
  {
    name: 'شعبه خسارت شرق (تهرانپارس)',
    address: 'تهران، بزرگراه رسالت، نرسیده به چهارراه تیرانداز، پلاک ۱۸۰',
    phone: '۰۲۱-۷۷۸۸۹۹۰۰',
    hours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰'
  },
  {
    name: 'شعبه خسارت جنوب (فداییان اسلام)',
    address: 'تهران، خیابان فداییان اسلام، نرسیده به بلوار دستواره، مجتمع بیمه',
    phone: '۰۲۱-۵۵۶۶۷۷۸۸',
    hours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰'
  },
  {
    name: 'شعبه تخصصی استان البرز (کرج)',
    address: 'کرج، میدان سپاه، بلوار جمهوری شمالی، پلاک ۴۵',
    phone: '۰۲۶-۳۲۱۱۴۴۵۵',
    hours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۰۰'
  }
];

export const CrmComplaintManager: React.FC<CrmComplaintManagerProps> = ({
  session,
  tickets,
  cases,
  selectedTicketId,
  onSelectTicketId,
  onUpdateTickets,
  onSelectCase,
  onOpenNewTicketModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [replyText, setReplyText] = useState('');

  // 360-Degree Document & Evidence Viewer Modal State
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState<'ALL' | 'DAMAGE' | 'CROQUI' | 'ASSESSMENT' | 'IDENTITY'>('ALL');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Quick SMS to Customer Modal State
  const [showCustomerSmsModal, setShowCustomerSmsModal] = useState(false);
  const [customerSmsText, setCustomerSmsText] = useState('');
  const [customerSmsSuccess, setCustomerSmsSuccess] = useState<string | null>(null);

  // Call Customer & Log Modal State
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [callSentiment, setCallSentiment] = useState<CustomerCallLog['sentiment']>('آرام و راضی');
  const [callResolved, setCallResolved] = useState(true);
  const [callSuccessFeedback, setCallSuccessFeedback] = useState<string | null>(null);

  // Direct to Branch (مراجعه حضوری) Modal State
  const [showBranchReferralModal, setShowBranchReferralModal] = useState(false);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0);
  const [customBranchName, setCustomBranchName] = useState('');
  const [customBranchAddress, setCustomBranchAddress] = useState('');
  const [customBranchPhone, setCustomBranchPhone] = useState('');
  const [referralDate, setReferralDate] = useState('فردا از ساعت ۸:۳۰ الی ۱۴:۰۰');
  const [referralRequiredDocs, setReferralRequiredDocs] = useState<string[]>([
    'اصل کارت ملی و گواهینامه راننده',
    'اصل کارت خودرو یا برگ سبز',
    'رؤیت خودرو و قطعات آسیب‌دیده جهت بازدید مجدد'
  ]);
  const [referralNote, setReferralNote] = useState('');
  const [branchReferralSuccess, setBranchReferralSuccess] = useState<string | null>(null);

  // Selected Ticket Object
  const activeTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find(t => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  // Linked Case for Active Ticket
  const linkedCase = useMemo(() => {
    if (!activeTicket || !activeTicket.caseId) return null;
    return cases.find(c => c.id === activeTicket.caseId) || null;
  }, [cases, activeTicket]);

  // Filtered Tickets List
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch =
        !searchTerm.trim() ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerPhone.includes(searchTerm.trim()) ||
        (t.caseId && t.caseId.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

      return true;
    });
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  // Send Reply to Ticket (Message to Customer)
  const handleSendReply = () => {
    if (!activeTicket || !replyText.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'AGENT' as const,
      senderName: `${session.name} (امور مشتریان)`,
      senderRole: 'کارشناس امور مشتریان و رسیدگی به شکایات',
      text: replyText.trim(),
      time: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
    };

    const updated = tickets.map(t => {
      if (t.id !== activeTicket.id) return t;
      return {
        ...t,
        status: 'پاسخ داده شده' as const,
        lastUpdate: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        assignedAgent: session.name,
        messages: [...t.messages, newMessage]
      };
    });

    onUpdateTickets(updated);
    setReplyText('');
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));
  };

  // Status Change (Resolve/Close)
  const handleStatusChange = (newStatus: CustomerTicket['status']) => {
    if (!activeTicket) return;

    const statusNoteMsg = {
      id: `msg-st-${Date.now()}`,
      sender: 'SYSTEM' as const,
      senderName: 'امور مشتریان',
      senderRole: 'سیستم امور مشتریان',
      text: `وضعیت تیکت توسط کارشناس ${session.name} به «${newStatus}» تغییر یافت.`,
      time: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
    };

    const updated = tickets.map(t => {
      if (t.id !== activeTicket.id) return t;
      return {
        ...t,
        status: newStatus,
        lastUpdate: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        assignedAgent: session.name,
        messages: [...t.messages, statusNoteMsg]
      };
    });

    onUpdateTickets(updated);
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));
  };

  // 1. Action: Direct Call & Save Log to Ticket + CRM Call Center
  const handleSaveCallLog = () => {
    if (!activeTicket || !callNotes.trim()) return;

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;

    // Create call log entry
    const newLog: CustomerCallLog = {
      id: `CALL-${Date.now()}`,
      caseId: activeTicket.caseId,
      contactName: activeTicket.customerName,
      contactPhone: activeTicket.customerPhone,
      contactRole: activeTicket.customerRole || 'زیان‌دیده',
      callDirection: 'خروجی (تماس کارشناس)',
      topic: activeTicket.category || 'رسیدگی به تیکت و شکایت',
      sentiment: callSentiment,
      durationMinutes: 4,
      notes: `[تماس تیکت ${activeTicket.ticketNumber}] ${callNotes.trim()}`,
      agentName: session.name,
      agentId: session.id,
      callDate: new Date().toLocaleDateString('fa-IR'),
      callTime: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      followUpRequired: !callResolved,
      resolvedInCall: callResolved
    };

    const existingCalls = loadCrmCallLogsFromStorage();
    saveCrmCallLogsToStorage([newLog, ...existingCalls]);

    // Add note to ticket message thread
    const callMsg = {
      id: `msg-call-${Date.now()}`,
      sender: 'AGENT' as const,
      senderName: `${session.name} (تماس تلفنی امور مشتریان)`,
      senderRole: 'کارشناس امور مشتریان',
      text: `📞 تماس تلفنی با مشتری (${activeTicket.customerPhone}) برقرار شد.\nخلاصه مکالمه: ${callNotes.trim()}${callResolved ? '\n(وضعیت: در مکالمه رفع ابهام شد)' : ''}`,
      time: nowStr
    };

    const updated = tickets.map(t => {
      if (t.id !== activeTicket.id) return t;
      return {
        ...t,
        status: callResolved ? ('پاسخ داده شده' as const) : t.status,
        lastUpdate: nowStr,
        assignedAgent: session.name,
        messages: [...t.messages, callMsg]
      };
    });

    onUpdateTickets(updated);
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));
    window.dispatchEvent(new CustomEvent('claimflow_crm_calls_updated'));

    setCallSuccessFeedback('تماس تلفنی با موفقیت در سوابق تیکت و کارتابل تماس‌ها ثبت شد.');
    setTimeout(() => {
      setCallSuccessFeedback(null);
      setShowCallLogModal(false);
      setCallNotes('');
    }, 1500);
  };

  // 2. Action: Send Direct SMS to Customer
  const handleSendCustomerSms = () => {
    if (!activeTicket || !customerSmsText.trim()) return;

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;

    const smsMsg = {
      id: `msg-sms-${Date.now()}`,
      sender: 'AGENT' as const,
      senderName: `${session.name} (پیامک به مشتری)`,
      senderRole: 'سامانه پیامک امور مشتریان',
      text: `📱 پیامک ارسال‌شده به شماره ${activeTicket.customerPhone}:\n«${customerSmsText.trim()}»`,
      time: nowStr
    };

    const updated = tickets.map(t => {
      if (t.id !== activeTicket.id) return t;
      return {
        ...t,
        status: 'پاسخ داده شده' as const,
        lastUpdate: nowStr,
        assignedAgent: session.name,
        messages: [...t.messages, smsMsg]
      };
    });

    onUpdateTickets(updated);
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));

    setCustomerSmsSuccess(`پیامک با موفقیت به شماره ${activeTicket.customerPhone} ارسال شد.`);
    setTimeout(() => {
      setCustomerSmsSuccess(null);
      setShowCustomerSmsModal(false);
      setCustomerSmsText('');
    }, 1800);
  };

  // 3. Action: Direct / Refer Customer to Visit Branch in Person (مراجعه حضوری به شعبه)
  const handleSendBranchReferral = () => {
    if (!activeTicket) return;

    const branch = selectedBranchIndex === -1
      ? {
          name: customBranchName || 'شعبه خسارت بیمه',
          address: customBranchAddress || 'آدرس شعبه اعلامی',
          phone: customBranchPhone || 'تلفن شعبه',
          hours: '۸:۰۰ الی ۱۵:۰۰'
        }
      : DEFAULT_BRANCHES[selectedBranchIndex];

    const nowStr = `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;

    const branchReferralText = `🏢 دستور و راهنمای مراجعه حضوری به شعبه:
مشتری گرامی (${activeTicket.customerName})،
جهت رسیدگی نهایی به پرونده (${activeTicket.caseId || 'خسارت'})، لطفاً با همراه داشتن مدارک زیر به شعبه خسارت مراجعه فرمایید:

📍 نام شعبه: ${branch.name}
📍 آدرس: ${branch.address}
☎️ تلفن شعبه: ${branch.phone}
⏰ زمان مراجعه: ${referralDate}

📋 مدارک الزامی همراه داشتن:
${referralRequiredDocs.map(d => `• ${d}`).join('\n')}
${referralNote.trim() ? `\n📝 نکات مهم: ${referralNote.trim()}` : ''}

کارشناس امور مشتریان: ${session.name}`;

    const referralMsg = {
      id: `msg-branch-${Date.now()}`,
      sender: 'AGENT' as const,
      senderName: `${session.name} (امور مشتریان - ارجاع به شعبه)`,
      senderRole: 'کارشناس امور مشتریان',
      text: branchReferralText,
      time: nowStr
    };

    const updated = tickets.map(t => {
      if (t.id !== activeTicket.id) return t;
      return {
        ...t,
        status: 'در حال پیگیری' as const,
        lastUpdate: nowStr,
        assignedAgent: session.name,
        messages: [...t.messages, referralMsg]
      };
    });

    onUpdateTickets(updated);
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));

    setBranchReferralSuccess('راهنمای مراجعه حضوری به شعبه با موفقیت ثبت و به اطلاع مشتری رسید.');
    setTimeout(() => {
      setBranchReferralSuccess(null);
      setShowBranchReferralModal(false);
      setReferralNote('');
    }, 1800);
  };

  // Toggle required docs for branch referral
  const toggleRequiredDoc = (doc: string) => {
    if (referralRequiredDocs.includes(doc)) {
      setReferralRequiredDocs(referralRequiredDocs.filter(d => d !== doc));
    } else {
      setReferralRequiredDocs([...referralRequiredDocs, doc]);
    }
  };

  // Extract all media & docs for 360 viewer
  const caseMediaItems = useMemo(() => {
    if (!linkedCase) return [];
    const list: Array<{
      id: string;
      title: string;
      category: 'DAMAGE' | 'CROQUI' | 'ASSESSMENT' | 'IDENTITY';
      type: 'image' | 'pdf' | 'doc' | 'other';
      url: string;
      uploader: string;
      date: string;
      desc?: string;
    }> = [];

    // 1. Files from claim intake
    if (linkedCase.files && Array.isArray(linkedCase.files)) {
      linkedCase.files.forEach((f, idx) => {
        list.push({
          id: `f-${idx}`,
          title: f.title || f.name || `تصویر آسیب خودرو ${idx + 1}`,
          category: 'DAMAGE',
          type: f.type?.includes('image') || f.previewUrl || f.url ? 'image' : 'other',
          url: f.previewUrl || f.url || 'https://images.unsplash.com/photo-1590362891988-3f41e57c6ef9?w=600&auto=format&fit=crop&q=80',
          uploader: 'بارگذاری اولیه زیان‌دیده',
          date: linkedCase.date
        });
      });
    }

    // 2. Additional docs
    if (linkedCase.additionalDocs && Array.isArray(linkedCase.additionalDocs)) {
      linkedCase.additionalDocs.forEach(d => {
        list.push({
          id: d.id,
          title: d.title || d.docType,
          category: d.docType.includes('کروکی') ? 'CROQUI' : d.docType.includes('شبا') || d.docType.includes('هویتی') ? 'IDENTITY' : 'DAMAGE',
          type: d.fileType === 'pdf' ? 'pdf' : 'image',
          url: d.dataUrl || d.url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop&q=80',
          uploader: `${d.uploadedBy} (${d.uploaderRole || 'کاربر'})`,
          date: d.uploadedAt,
          desc: d.note
        });
      });
    }

    // 3. Kroki photos if present
    if (linkedCase.customerKrokiPhoto) {
      list.push({
        id: 'kroki-photo',
        title: 'تصویر برگه فیزیکی کروکی پلیس راهور',
        category: 'CROQUI',
        type: 'image',
        url: linkedCase.customerKrokiPhoto,
        uploader: 'پلیس راهور / کاربر',
        date: linkedCase.date
      });
    }

    if (linkedCase.customerPoliceReportFile) {
      list.push({
        id: 'police-rep-file',
        title: 'گزارش رسمی تصادف پلیس راهور',
        category: 'CROQUI',
        type: 'pdf',
        url: linkedCase.customerPoliceReportFile,
        uploader: 'سامانه سنهاب پلیس',
        date: linkedCase.date
      });
    }

    return list;
  }, [linkedCase]);

  // Filtered Media for 360 viewer
  const filteredMediaItems = useMemo(() => {
    if (selectedDocCategory === 'ALL') return caseMediaItems;
    return caseMediaItems.filter(m => m.category === selectedDocCategory);
  }, [caseMediaItems, selectedDocCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center font-bold">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              سامانه رسیدگی به تیکت‌ها و شکایات مشتریان (Customer Support & Tickets)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              پاسخگویی مستقیم به مشتری، تماس تلفنی، ارسال پیامک و هدایت به شعب خسارت جهت مراجعه حضوری
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewTicketModal}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت تیکت جدید</span>
        </button>
      </div>

      {/* Two Column Layout: List (5 cols) & Detail/Chat/Customer Actions (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter & Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو با نام مشتری، شماره تماس یا کد پرونده..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="در انتظار پاسخ">در انتظار پاسخ</option>
                <option value="پاسخ داده شده">پاسخ داده شده</option>
                <option value="در حال پیگیری">در حال پیگیری</option>
                <option value="بسته شده و حل گردید">حل شده و بسته</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 text-xs font-medium focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">همه دسته‌بندی‌ها</option>
                <option value="شکایت از مبلغ ارزیابی">شکایت از مبلغ ارزیابی</option>
                <option value="تأخیر در پرداخت خسارت">تأخیر در پرداخت خسارت</option>
                <option value="اعتراض به کروکی و مقصر">اعتراض به کروکی و مقصر</option>
                <option value="تغییر شماره شبا">تغییر شماره شبا</option>
                <option value="نیاز به راهنمایی و مدارک">نیاز به راهنمایی</option>
              </select>
            </div>
          </div>

          {/* Tickets Cards List */}
          <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredTickets.map(t => {
              const isSelected = selectedTicketId === t.id;
              const isClosed = t.status === 'بسته شده و حل گردید';

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTicketId(t.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-rose-50/70 border-rose-400 shadow-sm ring-1 ring-rose-400/40'
                      : isClosed
                      ? 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-80'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority.includes('بحرانی') || t.priority === 'فوری'
                            ? 'bg-rose-100 text-rose-700'
                            : t.priority === 'مهم'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'بسته شده و حل گردید'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'پاسخ داده شده'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 line-clamp-1">{t.subject}</h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="font-medium text-slate-700">{t.customerName}</span>
                    </div>
                    {t.caseId && (
                      <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">
                        {t.caseId}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="bg-white border border-slate-200/80 p-8 rounded-2xl text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">تیکتی در این دسته‌بندی یافت نشد.</p>
                <p className="text-[11px] text-slate-400">تیکت‌های جدید به محض ثبت توسط کاربران در این لیست قرار می‌گیرند.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Actions & Thread (7 cols) */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-5 shadow-xs">
              {/* Ticket Top Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      {activeTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{activeTicket.category}</span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{activeTicket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="font-bold text-slate-700">{activeTicket.customerName}</span>
                    <span>•</span>
                    <span className="font-mono text-indigo-700 font-bold" dir="ltr">
                      {activeTicket.customerPhone}
                    </span>
                    <span>•</span>
                    <span>ثبت: {activeTicket.createdAt}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeTicket.caseId && (
                    <button
                      onClick={() => onSelectCase(activeTicket.caseId!)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <span>پرونده {activeTicket.caseId}</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </button>
                  )}
                </div>
              </div>

              {/* CRM Direct Actions with Customer (3 Core Permitted Actions) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-600" />
                    اقدامات امور مشتریان (صرفاً ارتباط با مشتری و ارجاع به شعبه):
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Action 1: Direct Call to Customer */}
                  <button
                    onClick={() => setShowCallLogModal(true)}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>تماس تلفنی با مشتری</span>
                    <span className="text-[10px] font-mono text-emerald-100 font-normal">
                      {activeTicket.customerPhone}
                    </span>
                  </button>

                  {/* Action 2: Send Direct SMS to Customer */}
                  <button
                    onClick={() => setShowCustomerSmsModal(true)}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>ارسال پیامک فوری</span>
                    <span className="text-[10px] text-blue-100 font-normal">
                      اطلاع‌رسانی پیامکی
                    </span>
                  </button>

                  {/* Action 3: Direct to Branch for In-Person Visit */}
                  <button
                    onClick={() => setShowBranchReferralModal(true)}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Building className="w-4 h-4" />
                    <span>مراجعه حضوری به شعبه</span>
                    <span className="text-[10px] text-indigo-100 font-normal">
                      نوبت‌دهی و راهنمای شعبه
                    </span>
                  </button>
                </div>

                {/* Additional View Options: 360 Document Viewer */}
                {linkedCase && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <button
                      onClick={() => setShowDocViewer(true)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>مشاهده مدارک و کروکی پرونده ({caseMediaItems.length} سند)</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {activeTicket.status !== 'بسته شده و حل گردید' ? (
                        <button
                          onClick={() => handleStatusChange('بسته شده و حل گردید')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>حل شد و بستن تیکت</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange('در حال پیگیری')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          بازگشایی مجدد تیکت
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Thread (Chat with Customer) */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
                {activeTicket.messages.map(m => {
                  const isAgent = m.sender === 'AGENT';
                  const isSystem = m.sender === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={m.id} className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-center text-xs text-indigo-800 font-medium">
                        {m.text} <span className="font-mono text-[10px] text-slate-500 mr-2">{m.time}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[88%] rounded-2xl p-3.5 space-y-1.5 shadow-2xs ${
                          isAgent
                            ? 'bg-rose-50/90 border border-rose-200 text-slate-900'
                            : 'bg-white border border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] border-b border-slate-200/60 pb-1">
                          <span className="font-bold text-slate-800">{m.senderName}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{m.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-800">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Direct Reply Box to Customer */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  ارسال پیام و پاسخ رسمی به مشتری (منعکس در پنل کاربری و سوابق پرونده):
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="متن پیام خود را برای مشتری بنویسید (راهنمایی، پیگیری وضعیت، پاسخ به سوالات یا ابهامات)..."
                    rows={3}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال پیام</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 p-12 rounded-3xl text-center space-y-2 shadow-xs">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">تیکتی انتخاب نشده است.</p>
              <p className="text-xs text-slate-500">لطفاً یک تیکت از فهرست سمت راست را جهت برقراری ارتباط، تماس یا ارسال پیام انتخاب فرمایید.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Call Customer & Log Outcome */}
      {showCallLogModal && activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    تماس تلفنی با مشتری ({activeTicket.customerName})
                  </h3>
                  <p className="text-xs text-slate-500">
                    شماره تماس: <span className="font-mono font-bold text-emerald-700">{activeTicket.customerPhone}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCallLogModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Call Button */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>شماره‌گیری مستقیم:</span>
              </div>
              <a
                href={`tel:${activeTicket.customerPhone}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs"
              >
                برقراری تماس تلفنی
              </a>
            </div>

            {/* Call Log Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  خلاصه مکالمه و توضیحات ارائه‌شده به مشتری:
                </label>
                <textarea
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="توضیحات مکالمه: به مشتری توضیح داده شد که... / توافق شد که..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">حس و لحن مشتری در تماس:</label>
                  <select
                    value={callSentiment}
                    onChange={e => setCallSentiment(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white"
                  >
                    <option value="آرام و راضی">آرام و راضی</option>
                    <option value="نگران و عجول">نگران و عجول</option>
                    <option value="ناراضی و شاکی">ناراضی و شاکی</option>
                    <option value="عصبانی و معترض">عصبانی و معترض</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={callResolved}
                      onChange={e => setCallResolved(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span>موضوع در تماس تلفنی رفع ابهام شد</span>
                  </label>
                </div>
              </div>
            </div>

            {callSuccessFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{callSuccessFeedback}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCallLogModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveCallLog}
                disabled={!callNotes.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>ثبت تماس در سوابق تیکت</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Quick SMS to Customer */}
      {showCustomerSmsModal && activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    ارسال پیامک مستقیم به مشتری ({activeTicket.customerName})
                  </h3>
                  <p className="text-xs text-slate-500">
                    گیرنده: <span className="font-mono font-bold text-blue-700">{activeTicket.customerPhone}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCustomerSmsModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Predefined Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">قالب‌های آماده پیامک:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCustomerSmsText(`مشتری گرامی ${activeTicket.customerName}، تیکت شما به شماره ${activeTicket.ticketNumber} بررسی شد و پاسخ در پنل کاربری ثبت گردید.`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-all"
                >
                  ثبت پاسخ در پنل
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerSmsText(`مشتری گرامی، جهت تکمیل فرآیند خسارت پرونده ${activeTicket.caseId || ''}، لطفاً تصویر واضح از مدارک تکمیلی را در پنل بارگذاری نمایید.`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-all"
                >
                  درخواست مدرک
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerSmsText(`مشتری گرامی، حواله خسارت پرونده شما صادر و به امور مالی ارسال گردید و به زودی واریز خواهد شد.`)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-all"
                >
                  اطلاع‌رسانی واریز
                </button>
              </div>
            </div>

            {/* Custom SMS text */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">متن پیامک ارسالی:</label>
              <textarea
                value={customerSmsText}
                onChange={e => setCustomerSmsText(e.target.value)}
                placeholder="متن پیامک خود را تایپ فرمایید..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 leading-relaxed"
              />
            </div>

            {customerSmsSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{customerSmsSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowCustomerSmsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSendCustomerSms}
                disabled={!customerSmsText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال پیامک به مشتری</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Direct to Branch for In-Person Visit (مراجعه حضوری به شعبه) */}
      {showBranchReferralModal && activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    دستور و نوبت‌دهی مراجعه حضوری به شعبه خسارت
                  </h3>
                  <p className="text-xs text-slate-500">
                    مشتری: <span className="font-bold text-slate-700">{activeTicket.customerName}</span> ({activeTicket.customerPhone})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowBranchReferralModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Branch Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">انتخاب شعبه خسارت:</label>
                <select
                  value={selectedBranchIndex}
                  onChange={e => setSelectedBranchIndex(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-indigo-500"
                >
                  {DEFAULT_BRANCHES.map((b, idx) => (
                    <option key={idx} value={idx}>
                      {b.name} - ({b.address.split('،')[0]})
                    </option>
                  ))}
                  <option value={-1}>سایر شعب (وارد کردن دستی آدرس و نام شعبه)</option>
                </select>
              </div>

              {/* Custom branch input if selected */}
              {selectedBranchIndex === -1 && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <input
                    type="text"
                    value={customBranchName}
                    onChange={e => setCustomBranchName(e.target.value)}
                    placeholder="نام شعبه (مثلاً: شعبه خسارت شهرستان قم)"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={customBranchAddress}
                    onChange={e => setCustomBranchAddress(e.target.value)}
                    placeholder="آدرس دقیق شعبه..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={customBranchPhone}
                    onChange={e => setCustomBranchPhone(e.target.value)}
                    placeholder="تلفن تماس شعبه..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              )}

              {/* Branch Details Display */}
              {selectedBranchIndex !== -1 && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-1.5 text-xs text-indigo-950">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span><strong>آدرس:</strong> {DEFAULT_BRANCHES[selectedBranchIndex].address}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 pt-1">
                    <span><strong>تلفن:</strong> <span className="font-mono">{DEFAULT_BRANCHES[selectedBranchIndex].phone}</span></span>
                    <span><strong>ساعات کاری:</strong> {DEFAULT_BRANCHES[selectedBranchIndex].hours}</span>
                  </div>
                </div>
              )}

              {/* Date / Timing */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">زمان یا بازه مراجعه حضوری پیشنهادی:</label>
                <input
                  type="text"
                  value={referralDate}
                  onChange={e => setReferralDate(e.target.value)}
                  placeholder="مثلاً: فردا سه‌شنبه ساعت ۹:۰۰ الی ۱۳:۰۰"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Required Documents Checkboxes */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">مدارک الزامی که مشتری باید به همراه داشته باشد:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'اصل کارت ملی و گواهینامه راننده',
                    'اصل کارت خودرو یا برگ سبز',
                    'اصل بیمه‌نامه شخص ثالث معتبر',
                    'رؤیت خودرو و قطعات آسیب‌دیده جهت بازدید مجدد',
                    'اصل کروکی سازشی / غیرسازشی پلیس راهور',
                    'فاکتور رسمی و داغی قطعات تعویض‌شده'
                  ].map((doc, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer text-[11px] font-medium text-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={referralRequiredDocs.includes(doc)}
                        onChange={() => toggleRequiredDoc(doc)}
                        className="w-3.5 h-3.5 accent-indigo-600 rounded"
                      />
                      <span>{doc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional notes for customer */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">نکات تکمیلی و راهنمایی برای مشتری:</label>
                <textarea
                  value={referralNote}
                  onChange={e => setReferralNote(e.target.value)}
                  placeholder="توضیحات تکمیلی: لطفاً قبل از مراجعه خودرو شستشو شده باشد و هماهنگی با مسئول پذیرش انجام گیرد..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            {branchReferralSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{branchReferralSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowBranchReferralModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSendBranchReferral}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Building className="w-3.5 h-3.5" />
                <span>ابلاغ دستور مراجعه حضوری به مشتری</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360-Degree Document Viewer Modal */}
      {showDocViewer && linkedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    نگاه ۳۶۰ درجه به مدارک، تصاویر و کروکی پرونده ({linkedCase.id})
                  </h3>
                  <p className="text-xs text-slate-500">
                    بررسی اسناد حادثه، کروکی، عکس‌های آسیب خودرو و فاکتورهای ارسالی مشتری
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDocViewer(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Categories Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
              <button
                onClick={() => setSelectedDocCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocCategory === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه اسناد ({caseMediaItems.length})
              </button>
              <button
                onClick={() => setSelectedDocCategory('DAMAGE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocCategory === 'DAMAGE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                عکس‌های خسارت و بدنه
              </button>
              <button
                onClick={() => setSelectedDocCategory('CROQUI')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocCategory === 'CROQUI' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                کروکی و گزارش پلیس
              </button>
              <button
                onClick={() => setSelectedDocCategory('IDENTITY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocCategory === 'IDENTITY' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                اسناد هویتی و شبا
              </button>
            </div>

            {/* Document Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMediaItems.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden hover:border-indigo-300 transition-all space-y-2 p-3 group"
                >
                  <div
                    onClick={() => setLightboxImage(item.url)}
                    className="h-36 bg-slate-200 rounded-xl overflow-hidden relative cursor-pointer"
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1 bg-slate-100">
                        <FileText className="w-8 h-8 text-indigo-500" />
                        <span className="text-[11px] font-bold">فایل سند / PDF</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" />
                      <span>مشاهده بزرگ‌نمایی</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                    <p className="text-[10px] text-slate-500">بارگذار: {item.uploader}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.date}</p>
                    {item.desc && <p className="text-[11px] text-slate-600 line-clamp-2">{item.desc}</p>}
                  </div>
                </div>
              ))}

              {filteredMediaItems.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  مدرکی در این دسته‌بندی موجود نیست.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDocViewer(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                بستن نمای مدارک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden p-2">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-h-[80vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
