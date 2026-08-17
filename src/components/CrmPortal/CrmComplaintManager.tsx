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
  DollarSign
} from 'lucide-react';
import { CustomerTicket, UserSession, ClaimCase } from '../../types';
import { maskPhoneNumber } from './crmHelpers';

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

  // Selected Ticket Object
  const activeTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find(t => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

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
      senderName: `${session.name} (کارشناس CRM دانا)`,
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-5 rounded-3xl border border-slate-700/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center font-bold">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              سامانه رسیدگی به شکایات و تیکت‌های مشتریان (Complaint Lifecycle)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              پایش اعتراضات به ارزیابی، تاخیر در تسویه، سامانه سنهاب بیمه مرکزی و ارجاع تخصصی
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewTicketModal}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت شکایت / تیکت جدید</span>
        </button>
      </div>

      {/* Two Column Layout: List (4 cols) & Detail/Chat (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Master List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filters */}
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو در موضوع، شاکی، پرونده..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                همه ({tickets.length})
              </button>
              <button
                onClick={() => setStatusFilter('در انتظار پاسخ')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                  statusFilter === 'در انتظار پاسخ' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-300'
                }`}
              >
                منتظر پاسخ
              </button>
              <button
                onClick={() => setStatusFilter('ارجاع به ارزیاب ارشد')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                  statusFilter === 'ارجاع به ارزیاب ارشد' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300'
                }`}
              >
                ارجاعی
              </button>
              <button
                onClick={() => setStatusFilter('بسته شده و حل گردید')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                  statusFilter === 'بسته شده و حل گردید' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-300'
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
                      ? 'bg-rose-950/40 border-rose-500 shadow-md ring-1 ring-rose-500'
                      : isUrgent
                      ? 'bg-slate-800/90 border-rose-500/40 hover:border-rose-400'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-white line-clamp-1">
                      {t.subject}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                      t.status === 'بسته شده و حل گردید'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : isUrgent
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>مشتری: <strong className="text-slate-200">{t.customerName}</strong></span>
                    {t.caseId && (
                      <span className="font-mono text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded text-[10px]">
                        {t.caseId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/50">
                    <span className="text-rose-300 font-bold">{t.category}</span>
                    <span className="font-mono">{t.lastUpdate}</span>
                  </div>
                </div>
              );
            })}

            {filteredTickets.length === 0 && (
              <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-2xl text-center text-slate-400 text-xs">
                شکایتی با این فیلتر یافت نشد.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & Actions (7 cols) */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
              {/* Ticket Top Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                      {activeTicket.ticketNumber}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      {activeTicket.subject}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    شاکی: <strong className="text-slate-200">{activeTicket.customerName}</strong> ({activeTicket.customerRole}) • شماره تماس: <span className="font-mono text-slate-300">{maskPhoneNumber(activeTicket.customerPhone)}</span>
                  </p>
                </div>

                {activeTicket.caseId && (
                  <button
                    onClick={() => onSelectCase(activeTicket.caseId!)}
                    className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                  >
                    <span>مشاهده پرونده {activeTicket.caseId}</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                )}
              </div>

              {/* Escalation & Status Controls */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">ارجاع به واحد:</span>
                  <select
                    value={escalateDepartment}
                    onChange={e => setEscalateDepartment(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none"
                  >
                    <option value="ارزیاب ارشد">ارزیاب ارشد (تجدید قیمت)</option>
                    <option value="ناظر بازبینی">ناظر بازبینی و خسارت</option>
                    <option value="مدیر مالی و خزانه‌داری">مدیر مالی و خزانه‌داری (واریز)</option>
                    <option value="شعبه خسارت">شعبه تخصصی خسارت</option>
                  </select>
                  <button
                    onClick={handleEscalate}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ارجاع
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeTicket.status !== 'بسته شده و حل گردید' ? (
                    <button
                      onClick={() => handleStatusChange('بسته شده و حل گردید')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حل شد و بستن تیکت</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange('در حال پیگیری')}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      بازگشایی مجدد تیکت
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto p-2 bg-slate-950/40 rounded-2xl border border-slate-800">
                {activeTicket.messages.map(m => {
                  const isAgent = m.sender === 'AGENT';
                  const isSystem = m.sender === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={m.id} className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center text-xs text-indigo-300 font-medium">
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
                        className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 ${
                          isAgent
                            ? 'bg-indigo-950/80 border border-indigo-500/40 text-slate-200'
                            : 'bg-slate-800 border border-slate-700 text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] border-b border-white/10 pb-1">
                          <span className="font-bold text-slate-300">{m.senderName}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{m.time}</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-line">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  ارسال پاسخ رسمی به شاکی (پیامک و ابلاغیه پنل کاربری):
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="متن پاسخ رسمی، نتایج بازبینی، یا هماهنگی با ارزیاب..."
                    rows={3}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="px-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>ارسال</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/60 p-12 rounded-3xl text-center space-y-2">
              <MessageSquare className="w-12 h-12 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">شکایتی انتخاب نشده است.</p>
              <p className="text-xs text-slate-500">لطفاً یک شکایت از فهرست سمت راست را انتخاب نمایید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
