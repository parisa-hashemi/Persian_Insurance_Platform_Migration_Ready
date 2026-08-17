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
  Share2,
  Layers,
  ChevronDown,
  Building,
  DollarSign,
  PhoneCall,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  X,
  Phone,
  Check,
  AlertTriangle,
  Sparkles,
  Car,
  FileSpreadsheet
} from 'lucide-react';
import { CustomerTicket, UserSession, ClaimCase, AdditionalDocItem } from '../../types';
import { maskPhoneNumber, maskNationalId, formatCurrency } from './crmHelpers';

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
  const [escalateDepartment, setEscalateDepartment] = useState<'ارزیاب ارشد' | 'ناظر بازبینی' | 'مدیر مالی و خزانه‌داری' | 'شعبه خسارت'>('ارزیاب ارشد');

  // 360-Degree Document & Evidence Viewer Modal State
  const [showDocViewer, setShowDocViewer] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState<'ALL' | 'DAMAGE' | 'CROQUI' | 'ASSESSMENT' | 'IDENTITY'>('ALL');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Call / Message Expert Modal State
  const [showExpertContactModal, setShowExpertContactModal] = useState(false);
  const [expertInquiryText, setExpertInquiryText] = useState('');
  const [expertContactSuccess, setExpertContactSuccess] = useState<string | null>(null);

  // Quick SMS to Customer Modal State
  const [showCustomerSmsModal, setShowCustomerSmsModal] = useState(false);
  const [customerSmsText, setCustomerSmsText] = useState('');
  const [customerSmsSuccess, setCustomerSmsSuccess] = useState(false);

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

  // Send Reply to Ticket
  const handleSendReply = () => {
    if (!activeTicket || !replyText.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: 'AGENT' as const,
      senderName: `${session.name} (امور مشتریان دانا)`,
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

  // Status Change (Resolve/Close/Escalate)
  const handleStatusChange = (newStatus: CustomerTicket['status']) => {
    if (!activeTicket) return;

    const updated = tickets.map(t => {
      if (t.id !== activeTicket.id) return t;
      return {
        ...t,
        status: newStatus,
        lastUpdate: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        assignedAgent: session.name
      };
    });

    onUpdateTickets(updated);
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));
  };

  // Escalate to Department
  const handleEscalate = () => {
    if (!activeTicket) return;

    const escalateMsg = {
      id: `msg-esc-${Date.now()}`,
      sender: 'SYSTEM' as const,
      senderName: 'سیستم گردش کار CRM',
      senderRole: 'سیستم',
      text: `پرونده شکایت توسط کارشناس ${session.name} جهت بررسی تخصصی به «${escalateDepartment}» ارجاع گردید.`,
      time: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
    };

    const updated = tickets.map(t => {
      if (t.id !== activeTicket.id) return t;
      return {
        ...t,
        status: 'ارجاع به ارزیاب ارشد' as const,
        lastUpdate: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        assignedAgent: session.name,
        messages: [...t.messages, escalateMsg]
      };
    });

    onUpdateTickets(updated);
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));
  };

  // Handle Contacting Expert
  const handleSendExpertInquiry = () => {
    if (!expertInquiryText.trim()) return;

    setExpertContactSuccess('پیام و استعلام فوری با موفقیت به کارشناس ارزیاب ارسال شد و در سوابق پرونده ثبت گردید.');
    setTimeout(() => {
      setExpertContactSuccess(null);
      setShowExpertContactModal(false);
      setExpertInquiryText('');
    }, 2000);
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
              سامانه رسیدگی به شکایات و تیکت‌های مشتریان (Complaint Lifecycle)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              پایش اعتراضات به ارزیابی، تاخیر در تسویه، بررسی ۳۶۰ درجه مدارک، تماس با ارزیاب و پاسخگویی آنلاین
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewTicketModal}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت شکایت / تیکت جدید</span>
        </button>
      </div>

      {/* Two Column Layout: List (5 cols) & Detail/Chat/360 Actions (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Master List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filters */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو در موضوع، شاکی، پرونده..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                  statusFilter === 'ALL' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه ({tickets.length})
              </button>
              <button
                onClick={() => setStatusFilter('در انتظار پاسخ')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                  statusFilter === 'در انتظار پاسخ' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                منتظر پاسخ
              </button>
              <button
                onClick={() => setStatusFilter('ارجاع به ارزیاب ارشد')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                  statusFilter === 'ارجاع به ارزیاب ارشد' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                ارجاعی
              </button>
              <button
                onClick={() => setStatusFilter('بسته شده و حل گردید')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer transition-all ${
                  statusFilter === 'بسته شده و حل گردید' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                حل شده
              </button>
            </div>
          </div>

          {/* List Items */}
          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {filteredTickets.map(t => {
              const isSelected = activeTicket?.id === t.id;
              const isUrgent = t.priority === 'فوری' || t.priority.includes('بحرانی');

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTicketId(t.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 shadow-xs ${
                    isSelected
                      ? 'bg-rose-50/70 border-rose-400 shadow-sm ring-2 ring-rose-200'
                      : isUrgent
                      ? 'bg-white border-rose-300 hover:border-rose-400'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {t.subject}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                      t.status === 'بسته شده و حل گردید'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isUrgent
                        ? 'bg-rose-50 text-rose-700 border-rose-200 font-black'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>مشتری: <strong className="text-slate-800">{t.customerName}</strong></span>
                    {t.caseId && (
                      <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {t.caseId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="text-rose-600 font-bold">{t.category}</span>
                    <span className="font-mono text-slate-500">{t.lastUpdate}</span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="bg-white border border-slate-200/80 p-8 rounded-2xl text-center text-slate-500 text-xs shadow-xs">
                شکایتی با این فیلتر یافت نشد.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & 360 Actions (7 cols) */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
              {/* Ticket Top Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {activeTicket.ticketNumber}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                      {activeTicket.subject}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    شاکی: <strong className="text-slate-800">{activeTicket.customerName}</strong> ({activeTicket.customerRole}) • شماره تماس: <span className="font-mono text-slate-700 font-bold">{maskPhoneNumber(activeTicket.customerPhone)}</span>
                  </p>
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

              {/* 360-Degree Document & Expert Contact Hub */}
              {linkedCase && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        امکانات تخصصی بررسی شکایت:
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Button 1: 360 Document Viewer */}
                      <button
                        onClick={() => setShowDocViewer(true)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>نگاه ۳۶۰ به مدارک و کروکی</span>
                      </button>

                      {/* Button 2: Call/Message Expert */}
                      <button
                        onClick={() => setShowExpertContactModal(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>تماس با کارشناس مربوطه</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary of assigned expert & assessment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>کارشناس ارزیاب پرونده:</span>
                      <strong className="text-slate-800">
                        {linkedCase.assignedExpert?.name || linkedCase.assignedFieldExpert?.name || 'واحد ارزیابی خسارت'}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>مبلغ ارزیابی مصوب:</span>
                      <strong className="font-mono text-emerald-700 font-bold">
                        {linkedCase.assessment?.payable ? formatCurrency(linkedCase.assessment.payable) : 'در حال ارزیابی'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Escalation & Status Controls */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">ارجاع به واحد:</span>
                  <select
                    value={escalateDepartment}
                    onChange={e => setEscalateDepartment(e.target.value as any)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="ارزیاب ارشد">ارزیاب ارشد (تجدید قیمت)</option>
                    <option value="ناظر بازبینی">ناظر بازبینی و خسارت</option>
                    <option value="مدیر مالی و خزانه‌داری">مدیر مالی و خزانه‌داری (واریز)</option>
                    <option value="شعبه خسارت">شعبه تخصصی خسارت</option>
                  </select>
                  <button
                    onClick={handleEscalate}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ارجاع
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeTicket.status !== 'بسته شده و حل گردید' ? (
                    <button
                      onClick={() => handleStatusChange('بسته شده و حل گردید')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حل شد و بستن تیکت</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange('در حال پیگیری')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      بازگشایی مجدد تیکت
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
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
                        className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 shadow-2xs ${
                          isAgent
                            ? 'bg-indigo-50 border border-indigo-200 text-slate-900'
                            : 'bg-white border border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] border-b border-slate-200/60 pb-1">
                          <span className="font-bold text-slate-800">{m.senderName}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{m.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  ارسال پاسخ رسمی به مشتری (منعکس در پرونده و پنل کاربری شاکی):
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="متن پاسخ رسمی، نتیجه هماهنگی با کارشناس ارزیاب یا دستور تجدید بررسی..."
                    rows={3}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-rose-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال پاسخ</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 p-12 rounded-3xl text-center space-y-2 shadow-xs">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-800">شکایتی انتخاب نشده است.</p>
              <p className="text-xs text-slate-500">لطفاً یک شکایت از فهرست سمت راست را جهت بررسی ۳۶۰ درجه و پاسخگویی انتخاب فرمایید.</p>
            </div>
          )}
        </div>
      </div>

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

      {/* Call / Message Expert Modal */}
      {showExpertContactModal && linkedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    ارتباط فوری با کارشناس ارزیاب پرونده
                  </h3>
                  <p className="text-xs text-slate-500">
                    هماهنگی جهت بازبینی قیمت قطعات، تجدید نظر یا توضیح فنی به مشتری
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExpertContactModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Expert Info Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">کارشناس مسئول:</span>
                <span className="font-extrabold text-slate-900">
                  {linkedCase.assignedExpert?.name || linkedCase.assignedFieldExpert?.name || 'کارشناس رسمی خسارت دانا'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">شماره تماس مستقیم:</span>
                <span className="font-mono font-bold text-indigo-700" dir="ltr">
                  {linkedCase.assignedExpert?.phone || linkedCase.assignedFieldExpert?.phone || '09121112233'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">موضوع شکایت مشتری:</span>
                <span className="text-rose-600 font-bold">{activeTicket.subject}</span>
              </div>
            </div>

            {/* Direct Call Trigger */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>تماس مستقیم تلفنی با کارشناس:</span>
              </div>
              <a
                href={`tel:${linkedCase.assignedExpert?.phone || '09121112233'}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-2xs"
              >
                برقراری تماس
              </a>
            </div>

            {/* Internal Inquiry Note */}
            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                ارسال پیامک و نوتیفیکیشن سیستمی به کارشناس:
              </label>
              <textarea
                value={expertInquiryText}
                onChange={e => setExpertInquiryText(e.target.value)}
                placeholder="متن استعلام: همکار گرامی، پیرو شکایت مشتری در پرونده فوق، لطفاً برآورد قیمت قطعه مورد نظر را مجدداً تطبیق دهید..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            {expertContactSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{expertContactSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowExpertContactModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSendExpertInquiry}
                disabled={!expertInquiryText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال استعلام به کارشناس</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
