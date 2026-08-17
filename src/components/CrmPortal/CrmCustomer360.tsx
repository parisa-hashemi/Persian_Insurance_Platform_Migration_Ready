import React, { useState, useMemo } from 'react';
import {
  User,
  Phone,
  Shield,
  FileSpreadsheet,
  AlertOctagon,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  CreditCard,
  Building,
  Car,
  MessageSquare
} from 'lucide-react';
import { ClaimCase, CustomerTicket, CustomerCallLog, CrmFollowUpTask, UserSession } from '../../types';
import { UnifiedCustomerProfile, maskNationalId, maskPhoneNumber, maskIban, formatCurrency } from './crmHelpers';

interface CrmCustomer360Props {
  session: UserSession;
  customers: UnifiedCustomerProfile[];
  selectedCustomerPhone: string | null;
  onSelectCustomerPhone: (phone: string | null) => void;
  onSelectCase: (caseId: string) => void;
  onSelectTicket: (ticketId: string) => void;
  onOpenNewCallForCustomer: (customer: UnifiedCustomerProfile) => void;
  onOpenNewFollowUpForCustomer: (customer: UnifiedCustomerProfile) => void;
}

export const CrmCustomer360: React.FC<CrmCustomer360Props> = ({
  session,
  customers,
  selectedCustomerPhone,
  onSelectCustomerPhone,
  onSelectCase,
  onSelectTicket,
  onOpenNewCallForCustomer,
  onOpenNewFollowUpForCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'زیان‌دیده' | 'مقصر' | 'HAS_COMPLAINT' | 'HAS_PENDING'>('ALL');

  // Active customer profile
  const activeCustomer = useMemo(() => {
    if (!selectedCustomerPhone) return null;
    return customers.find(c => c.phone === selectedCustomerPhone) || null;
  }, [customers, selectedCustomerPhone]);

  // Filtered customer list for sidebar/selection
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch =
        !searchTerm.trim() ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm.trim()) ||
        (c.nationalId && c.nationalId.includes(searchTerm.trim())) ||
        c.relatedCases.some(rc => rc.id.toLowerCase().includes(searchTerm.toLowerCase()) || rc.plate.includes(searchTerm));

      if (!matchesSearch) return false;

      if (roleFilter === 'زیان‌دیده') return c.roles.includes('زیان‌دیده');
      if (roleFilter === 'مقصر') return c.roles.includes('مقصر');
      if (roleFilter === 'HAS_COMPLAINT') return c.openComplaintsCount > 0;
      if (roleFilter === 'HAS_PENDING') return c.pendingActions.length > 0;

      return true;
    });
  }, [customers, searchTerm, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>نمای ۳۶۰ درجه مشتری و بیمه‌گذاران (Customer 360)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              پروفایل یکپارچه هویتی، پرونده‌های خسارت، سوابق شکایات، تماس‌ها و تعاملات متصل
            </p>
          </div>
        </div>

        {activeCustomer && (
          <button
            onClick={() => onSelectCustomerPhone(null)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>بازگشت به فهرست مشتریان</span>
          </button>
        )}
      </div>

      {!activeCustomer ? (
        /* Customer Directory / Search Screen */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس نام مشتری، شماره موبایل، کد ملی، شماره پلاک یا کد رهگیری پرونده..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  roleFilter === 'ALL'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                همه ({customers.length})
              </button>
              <button
                onClick={() => setRoleFilter('HAS_PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  roleFilter === 'HAS_PENDING'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/60'
                }`}
              >
                دارای اقدام معوق
              </button>
              <button
                onClick={() => setRoleFilter('HAS_COMPLAINT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  roleFilter === 'HAS_COMPLAINT'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/60'
                }`}
              >
                دارای شکایت باز
              </button>
              <button
                onClick={() => setRoleFilter('زیان‌دیده')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  roleFilter === 'زیان‌دیده'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                زیان‌دیدگان
              </button>
              <button
                onClick={() => setRoleFilter('مقصر')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  roleFilter === 'مقصر'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                رانندگان مقصر
              </button>
            </div>
          </div>

          {/* Customer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(cust => {
              const hasBlockers = cust.pendingActions.length > 0;
              const hasComplaints = cust.openComplaintsCount > 0;

              return (
                <div
                  key={cust.phone}
                  onClick={() => onSelectCustomerPhone(cust.phone)}
                  className="bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-3xl p-5 shadow-xs transition-all cursor-pointer space-y-4 group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center font-black shadow-xs">
                          {cust.name.slice(0, 1)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {cust.name}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {maskPhoneNumber(cust.phone)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 justify-end">
                        {cust.roles.map(r => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              r === 'زیان‌دیده'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : r === 'مقصر'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Masked National ID & Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      <div>
                        <span className="text-slate-500 text-[10px] block">کد ملی (ماسک‌شده)</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {maskNationalId(cust.nationalId)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">تعداد پرونده‌ها</span>
                        <span className="font-mono text-slate-900 font-black">
                          {cust.totalClaimsCount} پرونده
                        </span>
                      </div>
                    </div>

                    {/* Alerts / Pending Indicators */}
                    {hasBlockers && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="line-clamp-1 font-medium">{cust.pendingActions[0].title}</span>
                      </div>
                    )}

                    {hasComplaints && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-bold">{cust.openComplaintsCount} شکایت باز و در حال پیگیری</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">
                      {cust.lastContactDate ? `آخرین تماس: ${cust.lastContactDate}` : 'فاقد سابقه تماس'}
                    </span>
                    <span className="text-indigo-600 group-hover:text-indigo-700 font-bold flex items-center gap-1">
                      مشاهده پرونده کامل ۳۶۰
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="col-span-full bg-white border border-slate-200/80 p-12 rounded-3xl text-center space-y-2 shadow-xs">
                <User className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-800">مشتری با این مشخصات یافت نشد.</p>
                <p className="text-xs text-slate-500">لطفاً عبارت جستجو یا فیلتر را تغییر دهید.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Detailed Customer 360 Profile View */
        <div className="space-y-6">
          {/* Customer Hero Card */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border border-indigo-200/80 rounded-3xl p-5 sm:p-6 text-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center text-2xl font-black shadow-xs shrink-0">
                  {activeCustomer.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{activeCustomer.name}</h2>
                    <div className="flex items-center gap-1">
                      {activeCustomer.roles.map(r => (
                        <span
                          key={r}
                          className="px-2.5 py-0.5 text-xs font-black bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    شماره تماس: <strong className="text-slate-900">{activeCustomer.phone}</strong> | کد ملی (ماسک قانونی): <strong className="text-slate-900">{maskNationalId(activeCustomer.nationalId)}</strong>
                  </p>
                </div>
              </div>

              {/* Quick CRM Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onOpenNewCallForCustomer(activeCustomer)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>ثبت تماس با این مشتری</span>
                </button>
                <button
                  onClick={() => onOpenNewFollowUpForCustomer(activeCustomer)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>ایجاد کار پیگیری</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/80 border border-indigo-100 p-3.5 rounded-2xl shadow-xs">
                <span className="text-slate-500 text-[10px] block mb-1">تعداد پرونده‌های خسارت</span>
                <span className="font-mono font-bold text-slate-900 text-base">
                  {activeCustomer.totalClaimsCount} پرونده
                </span>
              </div>

              <div className="bg-white/80 border border-indigo-100 p-3.5 rounded-2xl shadow-xs">
                <span className="text-slate-500 text-[10px] block mb-1">شکایات و تیکت‌ها</span>
                <span className="font-mono font-bold text-rose-700 text-base">
                  {activeCustomer.relatedTickets.length} مورد ({activeCustomer.openComplaintsCount} باز)
                </span>
              </div>

              <div className="bg-white/80 border border-indigo-100 p-3.5 rounded-2xl shadow-xs">
                <span className="text-slate-500 text-[10px] block mb-1">سوابق تماس تلفنی</span>
                <span className="font-mono font-bold text-sky-700 text-base">
                  {activeCustomer.relatedCallLogs.length} مکالمه
                </span>
              </div>

              <div className="bg-white/80 border border-indigo-100 p-3.5 rounded-2xl shadow-xs">
                <span className="text-slate-500 text-[10px] block mb-1">اقدامات معوق و مسدودکننده</span>
                <span className={`font-mono font-black text-base ${activeCustomer.pendingActions.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {activeCustomer.pendingActions.length > 0 ? `${activeCustomer.pendingActions.length} اقدام معوق` : 'فاقد مانع'}
                </span>
              </div>
            </div>
          </div>

          {/* Pending Actions & Blockers for this customer */}
          {activeCustomer.pendingActions.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>اقدامات معوق و نیازمند پیگیری با مشتری:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCustomer.pendingActions.map((pa, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectCase(pa.caseId)}
                    className="bg-white border border-amber-200 p-4 rounded-2xl space-y-1.5 cursor-pointer hover:border-amber-400 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{pa.title}</span>
                      <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {pa.caseId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{pa.description}</p>
                    <span className="text-[11px] text-amber-700 font-bold block pt-1">
                      مشاهده پرونده و راهنمایی مشتری ←
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Claims Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <span>پرونده‌های خسارت مرتبط با این مشتری ({activeCustomer.relatedCases.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activeCustomer.relatedCases.map(c => {
                const isVictim = c.victimPhone === activeCustomer.phone;
                const policyLimit = c.culpritCoverageFinancial || 50000000;
                const directDamage = c.assessment?.payable || c.assessment?.totalAmount || 0;

                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className="bg-white hover:bg-slate-50/60 border border-slate-200/80 hover:border-indigo-300 p-5 rounded-3xl transition-all cursor-pointer shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                          {c.id}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {isVictim ? 'زیان‌دیده حادثه' : 'راننده مقصر حادثه'} • {c.carType || 'سواری'} ({c.plate || '—'})
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            شرکت بیمه‌گر مقصر: {c.culpritInsurer || 'بیمه دانا'} • تاریخ حادثه: {c.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      <div>
                        <span className="text-slate-500 text-[10px] block">سقف تعهد مالی بیمه‌نامه</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {formatCurrency(policyLimit)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">برآورد ارزیابی</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {directDamage > 0 ? formatCurrency(directDamage) : 'در حال ارزیابی'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">وضعیت شبا / پرداخت</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {c.payoutInfo?.iban ? maskIban(c.payoutInfo.iban) : 'ثبت نشده'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">اقدام پرونده</span>
                        <span className="text-indigo-600 font-bold">
                          مشاهده پرونده کامل ۳۶۰ ←
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Complaints & Tickets Section */}
          <div className="space-y-3">
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              <span>شکایات، تیکت‌ها و اعتراضات ثبت‌شده ({activeCustomer.relatedTickets.length})</span>
            </h3>

            <div className="space-y-2">
              {activeCustomer.relatedTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="bg-white hover:bg-slate-50/60 border border-slate-200/80 p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{t.subject}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-bold">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {t.messages[t.messages.length - 1]?.text || 'پیامی ثبت نشده است'}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold block mb-1">
                      {t.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.lastUpdate}</span>
                  </div>
                </div>
              ))}

              {activeCustomer.relatedTickets.length === 0 && (
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl text-center text-slate-500 text-xs shadow-xs">
                  هیچ شکایت یا تیکتی برای این مشتری ثبت نشده است.
                </div>
              )}
            </div>
          </div>

          {/* Communications & Call History */}
          <div className="space-y-3">
            <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-sky-600" />
              <span>تاریخچه مکالمات تلفنی و تعاملات ({activeCustomer.relatedCallLogs.length})</span>
            </h3>

            <div className="space-y-2">
              {activeCustomer.relatedCallLogs.map(cl => (
                <div
                  key={cl.id}
                  className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{cl.topic}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded font-bold">
                        {cl.callDirection}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200/60">
                        احساس مشتری: {cl.sentiment}
                      </span>
                    </div>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {cl.callDate} {cl.callTime} ({cl.durationMinutes} دقیقه)
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    {cl.notes}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>کارشناس پاسخگو: <strong className="text-slate-800">{cl.agentName}</strong></span>
                    {cl.followUpRequired ? (
                      <span className="text-amber-700 font-bold">نیازمند پیگیری مجدد</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">موضوع در تماس حل گردید</span>
                    )}
                  </div>
                </div>
              ))}

              {activeCustomer.relatedCallLogs.length === 0 && (
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl text-center text-slate-500 text-xs shadow-xs">
                  سابقه مکالمه‌ای برای این مشتری ثبت نشده است.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
