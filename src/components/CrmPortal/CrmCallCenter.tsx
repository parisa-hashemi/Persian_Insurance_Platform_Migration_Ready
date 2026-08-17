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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-5 rounded-3xl border border-slate-700/80 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center font-bold">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              مرکز تماس و ارتباطات یکپارچه (Call Center & Omnichannel)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ثبت مکالمات تلفنی ورودی/خروجی، تاریخچه پیامک‌های اطلاع‌رسانی و وضعیت احساس مشتری
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewCallModal}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت مکالمه جدید</span>
        </button>
      </div>

      {/* Tabs for Calls & SMS */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('calls')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'calls'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>لاگ مکالمات تلفنی ({callLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sms')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sms'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>پیامک‌های اطلاع‌رسانی سامانه ({allSmsLogs.length})</span>
        </button>
      </div>

      {activeTab === 'calls' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو در نام، شماره تماس، پرونده یا متن مکالمه..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={directionFilter}
                onChange={e => setDirectionFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">همه جهت‌ها</option>
                <option value="ورودی">تماس ورودی (مشتری)</option>
                <option value="خروجی">تماس خروجی (کارشناس)</option>
              </select>

              <select
                value={topicFilter}
                onChange={e => setTopicFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">همه موضوعات</option>
                <option value="پیگیری واریز خسارت">پیگیری واریز خسارت</option>
                <option value="نقص مدارک و عکس‌ها">نقص مدارک و عکس‌ها</option>
                <option value="اعتراض به ارزیابی خسارت">اعتراض به ارزیابی خسارت</option>
                <option value="هماهنگی کارشناس میدانی">هماهنگی کارشناس میدانی</option>
                <option value="استعلام اصالت کروکی">استعلام اصالت کروکی</option>
                <option value="سوال عمومی و مشاوره">سوال عمومی و مشاوره</option>
              </select>
            </div>
          </div>

          {/* Call Logs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCalls.map(cl => {
              const isInbound = cl.callDirection.includes('ورودی');

              return (
                <div
                  key={cl.id}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-md space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                          isInbound ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          {isInbound ? <PhoneIncoming className="w-4 h-4" /> : <PhoneForwarded className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{cl.contactName}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {maskPhoneNumber(cl.contactPhone)} ({cl.contactRole})
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-700 text-slate-300 border border-slate-600 block mb-1">
                          {cl.topic}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{cl.callDate} {cl.callTime}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-2xl border border-slate-700/60 whitespace-pre-line">
                      {cl.notes}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-500 text-[10px] block">احساس مشتری:</span>
                        <span className="text-slate-200 font-bold">{cl.sentiment}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">مدت مکالمه:</span>
                        <span className="font-mono text-slate-200 font-bold">{cl.durationMinutes} دقیقه</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {cl.caseId && (
                        <button
                          onClick={() => onSelectCase(cl.caseId!)}
                          className="font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 text-[11px] font-bold hover:bg-indigo-500/30 transition-all cursor-pointer"
                        >
                          پرونده: {cl.caseId}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectCustomer(cl.contactPhone)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      پروفایل ۳۶۰ مشتری ←
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCalls.length === 0 && (
              <div className="col-span-full bg-slate-800/40 border border-slate-700/60 p-12 rounded-3xl text-center space-y-2">
                <PhoneCall className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-slate-300">مکالمه‌ای یافت نشد.</p>
                <p className="text-xs text-slate-500">برای ثبت مکالمه جدید از دکمه بالا استفاده فرمایید.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SMS Logs Stream */
        <div className="space-y-3">
          {allSmsLogs.map(sms => (
            <div
              key={sms.id}
              className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{sms.recipientName}</span>
                  <span className="font-mono text-slate-400">{maskPhoneNumber(sms.phone)}</span>
                  <span className="font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded text-[10px]">
                    {sms.caseId}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60">
                  {sms.text}
                </p>
              </div>

              <div className="text-left shrink-0 self-end sm:self-auto">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold block mb-1">
                  تحویل داده شد
                </span>
                <span className="font-mono text-[10px] text-slate-500">{sms.sentAt}</span>
              </div>
            </div>
          ))}

          {allSmsLogs.length === 0 && (
            <div className="bg-slate-800/40 border border-slate-700/60 p-8 rounded-2xl text-center text-slate-400 text-xs">
              پیامک ارسالی در سامانه ثبت نشده است.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
