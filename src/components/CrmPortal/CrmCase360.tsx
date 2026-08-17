import React, { useState } from 'react';
import {
  FileSpreadsheet,
  User,
  Shield,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  FileText,
  PhoneCall,
  Plus,
  Send,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  DollarSign,
  AlertOctagon,
  MessageSquare,
  Building,
  Layers
} from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';
import { maskNationalId, maskPhoneNumber, maskIban, formatCurrency, generateClaimantSafeSummary } from './crmHelpers';

interface CrmCase360Props {
  session: UserSession;
  claimCase: ClaimCase;
  onBack: () => void;
  onSelectCustomer: (customerPhone: string) => void;
  onOpenNewCallForCase: (claimCase: ClaimCase) => void;
  onOpenNewFollowUpForCase: (claimCase: ClaimCase) => void;
  onOpenNewTicketForCase: (claimCase: ClaimCase) => void;
  onSendSmsReminder?: (phone: string, text: string, recipientName: string) => void;
}

export const CrmCase360: React.FC<CrmCase360Props> = ({
  session,
  claimCase,
  onBack,
  onSelectCustomer,
  onOpenNewCallForCase,
  onOpenNewFollowUpForCase,
  onOpenNewTicketForCase,
  onSendSmsReminder
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [smsText, setSmsText] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsRecipient, setSmsRecipient] = useState<'VICTIM' | 'CULPRIT'>('VICTIM');
  const [smsSuccess, setSmsSuccess] = useState(false);

  // Financial Calculations (Authoritative)
  const directDamage = claimCase.assessment?.payable || claimCase.assessment?.totalAmount || 0;
  const diminution = claimCase.diminutionValue || 0;
  const salvage = claimCase.assessment?.salvage || 0;
  const policyCeiling = claimCase.culpritCoverageFinancial || 50000000;
  const totalClaim = Math.max(0, directDamage + diminution - salvage);
  const insurerPayable = Math.min(totalClaim, policyCeiling);
  const culpritDebt = Math.max(0, totalClaim - policyCeiling);

  // Grounded safe summary for support agents
  const safeSummary = generateClaimantSafeSummary(claimCase);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(safeSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleSendQuickSms = () => {
    const targetPhone = smsRecipient === 'VICTIM' ? claimCase.victimPhone : claimCase.culpritPhone;
    const targetName = smsRecipient === 'VICTIM' ? claimCase.victimName : claimCase.culpritName;
    if (!targetPhone || !smsText.trim()) return;

    if (onSendSmsReminder) {
      onSendSmsReminder(targetPhone, smsText.trim(), targetName);
    }
    setSmsSuccess(true);
    setTimeout(() => {
      setSmsSuccess(false);
      setShowSmsModal(false);
      setSmsText('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 p-5 rounded-3xl border border-slate-700/80 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-2xl transition-all cursor-pointer"
            title="بازگشت"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs text-indigo-300 bg-indigo-500/20 px-2.5 py-1 rounded-xl border border-indigo-500/40">
                {claimCase.id}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                نمای ۳۶۰ درجه پرونده خسارت (Case 360)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تاریخ حادثه: {claimCase.date} • شرکت بیمه‌گر مقصر: {claimCase.culpritInsurer || 'بیمه دانا'} • نوع خسارت: ثالث مالی
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenNewCallForCase(claimCase)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>ثبت تماس برای این پرونده</span>
          </button>
          <button
            onClick={() => onOpenNewFollowUpForCase(claimCase)}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد کار پیگیری</span>
          </button>
          <button
            onClick={() => onOpenNewTicketForCase(claimCase)}
            className="px-3.5 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>ثبت شکایت</span>
          </button>
          <button
            onClick={() => {
              setSmsText(`زیان‌دیده گرامی؛ پرونده خسارت ${claimCase.id} نیازمند اقدام در پنل کاربری است.`);
              setShowSmsModal(true);
            }}
            className="px-3.5 py-2 bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-700/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>ارسال پیامک</span>
          </button>
        </div>
      </div>

      {/* Grounded Claimant-Safe Context Box (For Phone Calls) */}
      <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 font-black text-sm text-indigo-300">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>خلاصه رسمی و امن پرونده جهت پاسخگویی به مشتری (پشتیبانی تلفنی و پیامکی)</span>
          </div>
          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'کپی شد' : 'کپی متن راهنما'}</span>
          </button>
        </div>

        <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-line">
          {safeSummary}
        </div>
      </div>

      {/* Case 360 4-Pillar Grid: Parties, Policy, Milestone/Blockers, Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Parties */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-400" />
              طرفین حادثه
            </span>
            <span className="text-[10px] text-slate-400 font-bold">زیان‌دیده و مقصر</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-indigo-300 font-bold">زیان‌دیده:</span>
                <button
                  onClick={() => onSelectCustomer(claimCase.victimPhone)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  پروفایل ۳۶۰ ←
                </button>
              </div>
              <p className="font-bold text-white text-sm">{claimCase.victimName || 'زیان‌دیده'}</p>
              <p className="text-slate-400 font-mono">موبایل: {maskPhoneNumber(claimCase.victimPhone)}</p>
              <p className="text-slate-400 font-mono">کد ملی: {maskNationalId(claimCase.victimNationalId || claimCase.partyOneNationalId)}</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold">راننده مقصر:</span>
                <button
                  onClick={() => onSelectCustomer(claimCase.culpritPhone)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold"
                >
                  پروفایل ۳۶۰ ←
                </button>
              </div>
              <p className="font-bold text-white text-sm">{claimCase.culpritName || 'مقصر حادثه'}</p>
              <p className="text-slate-400 font-mono">موبایل: {maskPhoneNumber(claimCase.culpritPhone)}</p>
              <p className="text-slate-400 font-mono">کد ملی: {maskNationalId(claimCase.culpritNationalId || claimCase.partyTwoNationalId)}</p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Vehicle & Policy */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Car className="w-4 h-4 text-sky-400" />
              خودروها و بیمه‌نامه
            </span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              سنهاب تایید شد
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-2xl space-y-1">
              <span className="text-slate-400 block text-[10px]">خودروی زیان‌دیده و پلاک</span>
              <p className="font-bold text-white">{claimCase.carType || 'سواری'}</p>
              <p className="font-mono text-slate-300 font-bold">{claimCase.plate || '—'}</p>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-2xl space-y-1">
              <span className="text-slate-400 block text-[10px]">بیمه‌نامه مقصر و سقف تعهد</span>
              <p className="font-bold text-white">{claimCase.culpritInsurer || 'بیمه دانا'}</p>
              <p className="text-emerald-300 font-bold font-mono">
                سقف مالی: {formatCurrency(policyCeiling)}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                شماره بیمه‌نامه: {claimCase.culpritPolicyNo || 'استعلام برخط سنهاب'}
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 3: Workflow Milestone & Blockers */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              وضعیت گردش‌کار و موانع
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 font-bold">
              مرحله زنده
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-900/60 p-3 rounded-2xl space-y-1.5">
              <span className="text-slate-400 block text-[10px]">وضعیت جاری پرونده</span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 block text-center">
                {claimCase.status}
              </span>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-2xl space-y-1">
              <span className="text-slate-400 block text-[10px]">مسئول / واحد پیگیری</span>
              <p className="font-bold text-white">
                {claimCase.assignedExpert?.name ? `ارزیاب: ${claimCase.assignedExpert.name}` : 'واحد ارزیابی و خسارت'}
              </p>
              {claimCase.assignedReviewer?.name && (
                <p className="text-slate-400 text-[11px]">ناظر بازبینی: {claimCase.assignedReviewer.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pillar 4: Financials & Payout */}
        <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-3xl space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              تسویه مالی و سهم بیمه
            </span>
            <span className="text-[10px] font-bold text-emerald-300">
              {culpritDebt > 0 ? 'دارای مازاد' : 'پوشش کامل'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-900/60 p-2.5 rounded-2xl flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">مجموع کل خسارت:</span>
              <span className="font-mono font-bold text-white">{formatCurrency(totalClaim)}</span>
            </div>

            <div className="bg-emerald-500/15 border border-emerald-500/30 p-2.5 rounded-2xl flex items-center justify-between">
              <span className="text-emerald-300 font-bold text-[11px]">سهم پرداختی بیمه:</span>
              <span className="font-mono font-black text-emerald-300">{formatCurrency(insurerPayable)}</span>
            </div>

            <div className={`p-2.5 rounded-2xl flex items-center justify-between border ${
              culpritDebt > 0 ? 'bg-rose-500/20 border-rose-500/30 text-rose-200' : 'bg-slate-900/60 border-slate-700/60 text-slate-400'
            }`}>
              <span className="text-[11px] font-bold">بدهی مازاد مقصر:</span>
              <span className="font-mono font-black">{culpritDebt > 0 ? formatCurrency(culpritDebt) : '۰ ریال'}</span>
            </div>

            <div className="bg-slate-900/60 p-2.5 rounded-2xl space-y-1">
              <span className="text-slate-400 text-[10px] block">شماره شبا جهت تسویه:</span>
              <span className="font-mono text-emerald-300 font-bold text-[11px] block">
                {claimCase.payoutInfo?.iban ? maskIban(claimCase.payoutInfo.iban) : 'در انتظار ثبت توسط زیان‌دیده'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence & Document Requests Section */}
      <div className="bg-slate-800/80 border border-slate-700/80 p-5 sm:p-6 rounded-3xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-white">
              وضعیت مدارک، کروکی و درخواست‌های مدرک ارزیاب
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Kroki & Initial Docs */}
          <div className="bg-slate-900/60 p-4 rounded-2xl space-y-2 border border-slate-700/60">
            <span className="font-bold text-white text-xs block">وضعیت کروکی و گزارش حادثه</span>
            <p className="text-slate-300">
              {claimCase.hasKroki
                ? `کروکی سازشی پلیس راهور (${claimCase.croquiType === 'electronic' ? 'الکترونیک' : 'دستی'}) ثبت شده است.`
                : 'تصادف بدون کروکی پلیس (پذیرش آنلاین با تایید عکس‌های ۴ طرف و مدارک طرفین).'}
            </p>
            {claimCase.croquiData && (
              <p className="text-[11px] text-slate-400 font-mono">
                کد رهگیری کروکی: {claimCase.croquiData.reportNumber || '—'} | افسر کارشناس: {claimCase.croquiData.officerName || 'پلیس راهور'}
              </p>
            )}
          </div>

          {/* Doc Requests from Assessor */}
          <div className="bg-slate-900/60 p-4 rounded-2xl space-y-2 border border-slate-700/60">
            <span className="font-bold text-white text-xs block">درخواست‌های مدرک ثبت‌شده توسط کارشناس</span>
            {claimCase.docRequests && claimCase.docRequests.length > 0 ? (
              <div className="space-y-1.5">
                {claimCase.docRequests.map((d, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                    <div>
                      <span className="font-bold text-slate-200">{d.docType}</span>
                      <span className="text-[10px] text-slate-400 block">{d.description || 'درخواست بارگذاری مجدد'}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      d.status === 'تأیید شد' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs">درخواست مدرک ناقص یا مازادی برای این پرونده ثبت نشده است.</p>
            )}
          </div>
        </div>
      </div>

      {/* SMS Reminder Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-black text-white text-sm">
                <Send className="w-4 h-4 text-sky-400" />
                <span>ارسال پیامک اطلاع‌رسانی به طرفین پرونده</span>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                بستن
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">گیرنده پیامک:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSmsRecipient('VICTIM')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      smsRecipient === 'VICTIM'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    زیان‌دیده ({claimCase.victimName})
                  </button>
                  <button
                    onClick={() => setSmsRecipient('CULPRIT')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      smsRecipient === 'CULPRIT'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    مقصر حادثه ({claimCase.culpritName})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">متن پیامک ارسالی:</label>
                <textarea
                  value={smsText}
                  onChange={e => setSmsText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {smsSuccess && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>پیامک با موفقیت از طریق درگاه پیامکی سیستم ارسال گردید.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowSmsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                انصراف
              </button>
              <button
                onClick={handleSendQuickSms}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>تایید و ارسال پیامک</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
