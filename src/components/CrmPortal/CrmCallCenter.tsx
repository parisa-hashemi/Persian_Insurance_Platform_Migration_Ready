import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneForwarded,
  Search,
  Plus,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { CustomerCallLog, UserSession, ClaimCase } from '../../types';
import { maskPhoneNumber } from './crmHelpers';

interface CrmCallCenterProps {
  session: UserSession;
  callLogs: CustomerCallLog[];
  cases: ClaimCase[];
  onOpenNewCallModal: () => void;
  onSelectCase: (caseId: string) => void;
  onSelectCustomer: (phone: string) => void;
}

export const CrmCallCenter: React.FC<CrmCallCenterProps> = ({
  session,
  callLogs,
  cases,
  onOpenNewCallModal,
  onSelectCase,
  onSelectCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'calls' | 'sms'>('calls');

  // Filtered Call Logs
  const filteredCalls = useMemo(() => {
    return callLogs.filter(cl => {
      const matchesSearch =
        !searchTerm.trim() ||
        cl.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cl.contactPhone.includes(searchTerm.trim()) ||
        (cl.caseId && cl.caseId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        cl.notes.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (directionFilter !== 'ALL' && !cl.callDirection.includes(directionFilter)) return false;
      if (topicFilter !== 'ALL' && cl.topic !== topicFilter) return false;

      return true;
    });
  }, [callLogs, searchTerm, directionFilter, topicFilter]);

  // Aggregate all SMS Logs across all cases
  const allSmsLogs = useMemo(() => {
    const logs: Array<{
      id: string;
      caseId: string;
      recipientName: string;
      phone: string;
      recipientType: string;
      text: string;
      sentAt: string;
      status: string;
    }> = [];

    cases.forEach(c => {
      if (c.smsDispatchLogs && Array.isArray(c.smsDispatchLogs)) {
        c.smsDispatchLogs.forEach(s => {
          logs.push({
            ...s,
            caseId: c.id
          });
        });
      }
    });

    return logs.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }, [cases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center font-bold">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              مرکز تماس و ارتباطات یکپارچه (Call Center & Omnichannel)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ثبت مکالمات تلفنی ورودی/خروجی، تاریخچه پیامک‌های اطلاع‌رسانی و وضعیت احساس مشتری
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewCallModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت مکالمه جدید</span>
          </button>
        </div>
      </div>

      {/* Switch between Calls and SMS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'calls'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>لاگ مکالمات تلفنی ({callLogs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'sms'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>پیامک‌های ارسالی ({allSmsLogs.length})</span>
        </button>
      </div>

      {activeTab === 'calls' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو در مخاطب، شماره، شماره پرونده یا شرح مکالمه..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setDirectionFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  directionFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه جهات
              </button>
              <button
                onClick={() => setDirectionFilter('ورودی')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  directionFilter === 'ورودی' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-800 border border-sky-200'
                }`}
              >
                تماس‌های ورودی
              </button>
              <button
                onClick={() => setDirectionFilter('خروجی')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  directionFilter === 'خروجی' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                تماس‌های خروجی
              </button>
            </div>
          </div>

          {/* Calls List */}
          <div className="space-y-3">
            {filteredCalls.map(cl => {
              const isIncoming = cl.callDirection.includes('ورودی');

              return (
                <div
                  key={cl.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3 hover:border-indigo-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                        isIncoming ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isIncoming ? <PhoneIncoming className="w-5 h-5" /> : <PhoneForwarded className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{cl.contactName}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                            {cl.contactRole}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                            isIncoming ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {cl.callDirection}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          شماره: <strong className="text-slate-800">{maskPhoneNumber(cl.contactPhone)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {cl.caseId && (
                        <button
                          onClick={() => onSelectCase(cl.caseId!)}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
                        >
                          پرونده {cl.caseId}
                        </button>
                      )}
                      <button
                        onClick={() => onSelectCustomer(cl.contactPhone)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        پروفایل مشتری ۳۶۰
                      </button>
                    </div>
                  </div>

                  {/* Body & Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700">موضوع مکالمه: {cl.topic}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        مدت تماس: {cl.durationMinutes} دقیقه | تاریخ: {cl.callDate} {cl.callTime}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs leading-relaxed text-slate-800">
                      {cl.notes}
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span>کارشناس: <strong className="text-slate-800">{cl.agentName}</strong></span>
                      <span>•</span>
                      <span className="text-slate-600">احساس مخاطب: <strong>{cl.sentiment}</strong></span>
                    </div>

                    <div>
                      {cl.followUpRequired ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs font-bold">
                          نیازمند پیگیری بعدی ({cl.followUpDate || 'فردا'})
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-medium">
                          پاسخ داده شد و در تماس حل گردید
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCalls.length === 0 && (
              <div className="bg-white border border-slate-200/80 p-12 rounded-3xl text-center text-slate-500 text-xs shadow-xs">
                مکالمه‌ای با این فیلتر ثبت نشده است.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SMS Logs List */
        <div className="space-y-3">
          {allSmsLogs.map(sms => (
            <div
              key={sms.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2 hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-slate-900">ارسال پیامک به {sms.recipientName}</span>
                  <span className="font-mono text-slate-500">({maskPhoneNumber(sms.phone)})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {sms.caseId}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">{sms.sentAt}</span>
                </div>
              </div>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 font-mono">
                {sms.text}
              </p>
            </div>
          ))}

          {allSmsLogs.length === 0 && (
            <div className="bg-white border border-slate-200/80 p-12 rounded-3xl text-center text-slate-500 text-xs shadow-xs">
              پیامک ارسالی در سیستم ثبت نشده است.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
