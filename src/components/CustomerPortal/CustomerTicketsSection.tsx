import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Plus,
  ChevronDown,
  ChevronUp,
  User,
  Headphones,
  Paperclip,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ClaimCase, CustomerTicket, CustomerCallLog, UserSession } from '../../types';
import { loadCrmTicketsFromStorage, saveCrmTicketsToStorage, loadCrmCallLogsFromStorage } from '../../lib/storage';

interface CustomerTicketsSectionProps {
  claimCase: ClaimCase;
  session: UserSession;
  onOpenCreateTicket: () => void;
}

export const CustomerTicketsSection: React.FC<CustomerTicketsSectionProps> = ({
  claimCase,
  session,
  onOpenCreateTicket
}) => {
  const [activeSectionTab, setActiveSectionTab] = useState<'tickets' | 'calls'>('tickets');
  const [tickets, setTickets] = useState<CustomerTicket[]>(() => {
    return loadCrmTicketsFromStorage().filter((t) => t.caseId === claimCase.id);
  });
  const [callLogs, setCallLogs] = useState<CustomerCallLog[]>(() => {
    const allCalls = loadCrmCallLogsFromStorage();
    const custPhone = claimCase.victimPhone || claimCase.culpritPhone || session.phone;
    return allCalls.filter((c) => c.caseId === claimCase.id || (custPhone && c.contactPhone === custPhone));
  });

  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const isPartyOne = session.phone ? (claimCase.partyOnePhone === session.phone || claimCase.victimPhone === session.phone) : true;
  const isVictim = claimCase.victimPhone === session.phone || (!session.phone && isPartyOne);
  const myName = session.name || (isVictim ? claimCase.victimName : claimCase.culpritName) || 'مشتری';
  const myRoleLabel = isVictim ? 'زیان‌دیده' : 'مقصر';

  const refreshData = () => {
    const updatedTickets = loadCrmTicketsFromStorage().filter((t) => t.caseId === claimCase.id);
    setTickets(updatedTickets);

    const allCalls = loadCrmCallLogsFromStorage();
    const custPhone = claimCase.victimPhone || claimCase.culpritPhone || session.phone;
    const updatedCalls = allCalls.filter((c) => c.caseId === claimCase.id || (custPhone && c.contactPhone === custPhone));
    setCallLogs(updatedCalls);
  };

  useEffect(() => {
    refreshData();

    const handleTicketsUpdated = () => refreshData();
    const handleCallsUpdated = () => refreshData();
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes('crm')) refreshData();
    };

    window.addEventListener('claimflow_crm_tickets_updated', handleTicketsUpdated);
    window.addEventListener('claimflow_crm_calls_updated', handleCallsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('claimflow_crm_tickets_updated', handleTicketsUpdated);
      window.removeEventListener('claimflow_crm_calls_updated', handleCallsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [claimCase.id, session.phone]);

  const handleSendReply = (ticketId: string) => {
    if (!replyText.trim()) return;

    const nowStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const all = loadCrmTicketsFromStorage();
    const updated = all.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'در انتظار پاسخ' as const,
          lastUpdate: nowStr,
          messages: [
            ...t.messages,
            {
              id: `msg-${Date.now()}`,
              sender: 'CUSTOMER' as const,
              senderName: myName,
              senderRole: myRoleLabel,
              text: replyText.trim(),
              time: nowStr
            }
          ]
        };
      }
      return t;
    });

    saveCrmTicketsToStorage(updated);
    setTickets(updated.filter((t) => t.caseId === claimCase.id));
    setReplyText('');
    window.dispatchEvent(new CustomEvent('claimflow_crm_tickets_updated'));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'پاسخ داده شده':
      case 'بسته شده و حل گردید':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'در حال پیگیری':
      case 'ارجاع به ارزیاب ارشد':
        return 'bg-indigo-100 text-indigo-950 border-indigo-300';
      default:
        return 'bg-amber-100 text-amber-950 border-amber-300';
    }
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>ارتباطات و پشتیبانی CRM پرونده</span>
              {(tickets.length > 0 || callLogs.length > 0) && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {tickets.length} تیکت • {callLogs.length} تماس
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">
              پیگیری مکاتبات با کارشناس ارزیاب و واحد رسیدگی به شکایات و مرکز تماس CRM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateTicket}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تیکت / شکایت جدید</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSectionTab('tickets')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSectionTab === 'tickets'
              ? 'bg-white text-slate-900 font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <span>تیکت‌ها و مکاتبات CRM ({tickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSectionTab('calls')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSectionTab === 'calls'
              ? 'bg-white text-slate-900 font-black shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-4 h-4 text-sky-600" />
          <span>تماس‌های ثبت‌شده مرکز تماس ({callLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: TICKETS LIST */}
      {activeSectionTab === 'tickets' && (
        <>
          {tickets.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <p className="text-xs text-slate-600 font-medium">
                تاکنون تیکت یا شکایتی برای این پرونده ثبت نکرده‌اید.
              </p>
              <button
                type="button"
                onClick={onOpenCreateTicket}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
              >
                برای ثبت اعتراض به برآورد یا درخواست پیگیری کلیک کنید
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const isExpanded = expandedTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/70 transition-all"
                  >
                    {/* Ticket Summary Row */}
                    <div
                      onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                            {t.ticketNumber}
                          </span>
                          <span className="font-black text-slate-900 text-xs sm:text-sm">
                            {t.subject}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span>دسته: <strong className="text-slate-700">{t.category}</strong></span>
                          <span>اولویت: <strong className="text-slate-700">{t.priority}</strong></span>
                          <span className="font-mono text-slate-400">{t.lastUpdate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[11px] font-bold text-indigo-600">
                          {t.messages.length} پیام
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Messages & Reply */}
                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-slate-200 space-y-4 animate-in fade-in">
                        
                        {/* Chat Bubble Thread */}
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {t.messages.map((msg, mIdx) => {
                            const isAgent = msg.sender === 'AGENT' || msg.sender === 'SYSTEM';
                            return (
                              <div
                                key={msg.id || mIdx}
                                className={`p-3.5 rounded-2xl text-xs space-y-1.5 border ${
                                  isAgent
                                    ? 'bg-indigo-50/90 border-indigo-200 mr-6 text-indigo-950'
                                    : 'bg-slate-100 border-slate-200 ml-6 text-slate-900'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold text-[10px]">
                                  <span className={isAgent ? 'text-indigo-700 flex items-center gap-1' : 'text-slate-700'}>
                                    {isAgent && <Headphones className="w-3.5 h-3.5" />}
                                    {msg.senderName} ({isAgent ? msg.senderRole || 'کارشناس CRM' : 'شما'})
                                  </span>
                                  <span className="text-slate-400 font-mono">{msg.time}</span>
                                </div>

                                <p className="font-medium leading-relaxed">{msg.text}</p>

                                {msg.attachmentUrl && (
                                  <div className="pt-1.5 border-t border-slate-200/60 mt-1">
                                    <img
                                      src={msg.attachmentUrl}
                                      alt="Attachment"
                                      className="max-h-32 rounded-lg border border-slate-200 object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Reply Input Form */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="پاسخ یا توضیحات تکمیلی خود را برای کارشناس بنویسید..."
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSendReply(t.id);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReply(t.id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <span>ارسال</span>
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: CALL LOGS */}
      {activeSectionTab === 'calls' && (
        <div className="space-y-3">
          {callLogs.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <p className="text-xs text-slate-600 font-medium">
                تاکنون تماس تلفنی از طرف کارشناسان CRM یا مرکز تماس با شما ثبت نشده است.
              </p>
              <p className="text-[11px] text-slate-500">
                کلیه تماس‌های پشتیبانی، توضیحات کارشناس و اقدامات انجام‌شده در این بخش قابل رویت خواهد بود.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {callLogs.map((c) => {
                const isIncoming = c.callDirection?.includes('ورودی');
                return (
                  <div
                    key={c.id}
                    className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-2">
                      <div className="flex items-center gap-2">
                        {isIncoming ? (
                          <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                            <PhoneIncoming className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                            <PhoneOutgoing className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-black text-slate-900 text-xs sm:text-sm block">
                            موضوع: {c.topic}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            کارشناس پشتیبانی: <strong>{c.agentName || 'پشتیبانی CRM'}</strong> • مدت: {c.durationMinutes} دقیقه
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white text-sky-800 border border-sky-200 font-mono" dir="ltr">
                          {c.callDate} {c.callTime}
                        </span>
                        {c.resolvedInCall && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            پاسخ داده شده
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-sky-100 font-medium leading-relaxed">
                      <strong className="text-sky-900 font-bold block mb-1">شرح و خلاصه مکالمه:</strong>
                      {c.notes}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
