import React, { useState } from 'react';
import {
  X,
  Phone,
  Copy,
  Check,
  CreditCard,
  Building2,
  ShieldCheck,
  AlertCircle,
  FileText,
  User,
  Scale,
  Send,
  MessageSquare,
  Car,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';
import { formatCurrency, getInsurerPersianName } from '../../lib/storage';
import { calculateClaimDamageWithPolicyLimits } from '../../lib/policyLimitCalculator';

interface CustomerDebtModalProps {
  claimCase: ClaimCase;
  session: UserSession;
  onClose: () => void;
  onUpdateCase?: (updatedCase: ClaimCase) => void;
}

export const CustomerDebtModal: React.FC<CustomerDebtModalProps> = ({
  claimCase,
  session,
  onClose,
  onUpdateCase
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [settlementSuccessMsg, setSettlementSuccessMsg] = useState<string | null>(null);
  const [settlementNote, setSettlementNote] = useState('');
  const [settlementAmount, setSettlementAmount] = useState('');
  const [showSettlementForm, setShowSettlementForm] = useState(false);

  // Accurate Role Detection
  const userPhone = session.phone || '';
  const userName = session.name || '';

  let isPartyOne = false;
  let isPartyTwo = false;

  if (claimCase.partyTwoPhone && userPhone && claimCase.partyTwoPhone === userPhone) {
    isPartyTwo = true;
  } else if (claimCase.partyOnePhone && userPhone && claimCase.partyOnePhone === userPhone) {
    isPartyOne = true;
  } else if (claimCase.partyOneRole === 'مقصر') {
    if (claimCase.culpritPhone && userPhone && claimCase.culpritPhone === userPhone) isPartyOne = true;
    else if (claimCase.victimPhone && userPhone && claimCase.victimPhone === userPhone) isPartyTwo = true;
    else if (userName && claimCase.culpritName?.includes(userName)) isPartyOne = true;
    else if (userName && claimCase.victimName?.includes(userName)) isPartyTwo = true;
    else isPartyOne = true;
  } else {
    if (claimCase.victimPhone && userPhone && claimCase.victimPhone === userPhone) isPartyOne = true;
    else if (claimCase.culpritPhone && userPhone && claimCase.culpritPhone === userPhone) isPartyTwo = true;
    else if (userName && claimCase.victimName?.includes(userName)) isPartyOne = true;
    else if (userName && claimCase.culpritName?.includes(userName)) isPartyTwo = true;
    else isPartyOne = true;
  }

  const partyOneRole = claimCase.partyOneRole || 'زیان‌دیده';
  const partyTwoRole = claimCase.partyTwoRole || (partyOneRole === 'مقصر' ? 'زیان‌دیده' : 'مقصر');
  const userRole: 'زیان‌دیده' | 'مقصر' = isPartyOne ? (partyOneRole as any) : (partyTwoRole as any);
  const isVictim = userRole === 'زیان‌دیده';
  const isCulprit = userRole === 'مقصر';

  const breakdown = calculateClaimDamageWithPolicyLimits(claimCase);

  const directDamage = breakdown.directDamageGross || (claimCase.assessment?.totalDamage || 0);
  const salvage = breakdown.salvageDeduction || (claimCase.assessment?.salvage || 0);
  const diminution = breakdown.diminutionAmount || (claimCase.diminutionValue || 0);
  const totalClaim = breakdown.totalClaimAmount || Math.max(0, directDamage - salvage + diminution);
  const policyLimit = breakdown.policyMaxFinancialLimit || (claimCase.culpritCoverageFinancial || 50000000);
  const insurerPortion = breakdown.insurerPayablePortion || Math.min(totalClaim, policyLimit);
  const culpritDebt = breakdown.culpritExcessDebt || Math.max(0, totalClaim - policyLimit);

  const culpritName = claimCase.culpritName || 'راننده مقصر';
  const culpritPhone = claimCase.culpritPhone || '---';
  const victimName = claimCase.victimName || 'زیان‌دیده';
  const victimPhone = claimCase.victimPhone || '---';
  const insurerName = getInsurerPersianName(claimCase.culpritInsurer);

  const copyToClipboard = (text: string, type: 'phone' | 'iban' | 'sms') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else if (type === 'iban') {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } else if (type === 'sms') {
      setCopiedSms(true);
      setTimeout(() => setCopiedSms(false), 2000);
    }
  };

  const handleRecordSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCase) return;

    const recordedAmount = settlementAmount ? Number(settlementAmount) : culpritDebt;
    const updatedHistory = [
      ...(claimCase.history || []),
      {
        status: claimCase.status,
        time: new Date().toLocaleString('fa-IR'),
        user: session.name || (isVictim ? victimName : culpritName),
        note: `ثبت توافق و تسویه بدهی مازاد به مبلغ ${formatCurrency(recordedAmount)}. توضیحات: ${settlementNote || 'تسویه توافقی بین طرفین حادثه'}`
      }
    ];

    const updatedCase: ClaimCase = {
      ...claimCase,
      culpritDebtAmount: 0,
      history: updatedHistory
    };

    onUpdateCase(updatedCase);
    setShowSettlementForm(false);
    setSettlementSuccessMsg(`تسویه بدهی به مبلغ ${formatCurrency(recordedAmount)} با موفقیت در تاریخچه پرونده ثبت گردید.`);
    setTimeout(() => setSettlementSuccessMsg(null), 4000);
  };

  const legalSmsText = isVictim
    ? `جناب آقای/سرکار خانم ${culpritName} (راننده مقصر حادثه تصادف)؛
احتراماً به اطلاع می‌رساند بر اساس ارزیابی رسمی پرونده خسارت ${claimCase.id}، مجموع خسارت وارده به خودروی اینجانب (${victimName}) مبلغ ${formatCurrency(totalClaim)} تعیین گردیده که سقف تعهد بیمه‌نامه شما (${insurerName}) مبلغ ${formatCurrency(insurerPortion)} را پوشش می‌دهد.
مبلغ مازاد به میزان ${formatCurrency(culpritDebt)} به عنوان بدهی مستقیم شما طبق قانون بیمه اجباری شخص ثالث تعیین گردیده است.
خواهشمند است جهت هماهنگی و واریز وجه با شماره ${victimPhone} تماس حاصل فرمایید.`
    : `جناب آقای/سرکار خانم ${victimName} (زیان‌دیده گرامی حادثه تصادف)؛
احتراماً پیرو پرونده خسارت ${claimCase.id}، اینجانب ${culpritName} (راننده مقصر) آمادگی خود را جهت تسویه و پرداخت مازاد بدهی به مبلغ ${formatCurrency(culpritDebt)} اعلام می‌دارم.
لطفاً شماره شبای معتبر بانکی خود را جهت واریز به شماره ${culpritPhone} ارسال نمایید.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1 text-right">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                <Scale className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-blue-900">
                وضعیت بدهی و طلب مالی پرونده {claimCase.id}
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              محاسبه شفاف سهم بیمه‌گر، افت قیمت، سقف تعهدات و بدهی مقصر حادثه
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {settlementSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 text-xs flex items-center gap-2 animate-in fade-in font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{settlementSuccessMsg}</span>
          </div>
        )}

        {/* User Balance Overview Hero Box */}
        <div
          className={`p-5 rounded-2xl border-2 shadow-sm relative overflow-hidden ${
            isVictim
              ? culpritDebt > 0
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 border-emerald-300 text-emerald-950'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : culpritDebt > 0
              ? 'bg-gradient-to-br from-rose-50 via-amber-50/60 to-rose-100/50 border-rose-300 text-rose-950'
              : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black border bg-white shadow-2xs">
                  {isVictim ? 'نقش شما: زیان‌دیده حادثه' : 'نقش شما: راننده مقصر حادثه'}
                </span>
                <span className="text-xs font-bold">
                  {culpritDebt > 0
                    ? isVictim
                      ? 'دارای طلب مازاد از مقصر'
                      : 'دارای بدهی مازاد به زیان‌دیده'
                    : 'تسویه کامل در سقف بیمه'}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-xs text-slate-700 block font-medium">
                  {isVictim ? 'مبلغ طلب شما از مقصر حادثه:' : 'مبلغ بدهی شما به زیان‌دیده:'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                      culpritDebt > 0 ? (isVictim ? 'text-emerald-800' : 'text-rose-700') : 'text-slate-700'
                    }`}
                  >
                    {culpritDebt > 0 ? formatCurrency(culpritDebt) : '۰ تومان'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Quick Action */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <a
                href={`tel:${isVictim ? culpritPhone : victimPhone}`}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                <span>تماس با {isVictim ? 'مقصر حادثه' : 'زیان‌دیده'}</span>
              </a>
              <button
                type="button"
                onClick={() => setShowSmsPreview(!showSmsPreview)}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-blue-900" />
                <span>پیامک قانونی تسویه</span>
              </button>
            </div>
          </div>
        </div>

        {/* SMS PREVIEW ACCORDION */}
        {showSmsPreview && (
          <div className="p-4 bg-slate-50 border-2 border-blue-200 rounded-2xl text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 font-black text-blue-900">
                <Send className="w-4 h-4 text-blue-900" />
                <span>پیش‌نویس پیامک رسمی و حقوقی تسویه بدهی</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(legalSmsText, 'sms')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-900" />}
                <span>{copiedSms ? 'کپی شد' : 'کپی متن'}</span>
              </button>
            </div>
            <p className="text-slate-700 leading-relaxed font-sans whitespace-pre-line bg-white p-3 rounded-xl border border-slate-200">
              {legalSmsText}
            </p>
            <div className="flex items-center justify-end gap-2">
              <a
                href={`sms:${isVictim ? culpritPhone : victimPhone}?body=${encodeURIComponent(legalSmsText)}`}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال مستقیم از طریق پیامک موبایل</span>
              </a>
            </div>
          </div>
        )}

        {/* AT-FAULT DRIVER & VICTIM CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* CULPRIT / AT-FAULT PARTY CARD (مقصـر حـادثه) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-rose-950">مشخصات مقصر حادثه</h3>
                  <span className="text-[10px] text-slate-500 font-medium">راننده و بیمه‌گذار مقصر</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                بدهکار مازاد
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">نام و نام خانوادگی:</span>
                <span className="font-black text-slate-900">{culpritName}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">شماره تماس مقصر:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${culpritPhone}`}
                    className="font-mono font-black text-blue-900 hover:underline"
                    dir="ltr"
                  >
                    {culpritPhone}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(culpritPhone, 'phone')}
                    className="p-1 rounded bg-white hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors"
                    title="کپی شماره تماس"
                  >
                    {copiedPhone ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">خودرو و پلاک:</span>
                <span className="font-bold text-slate-800">
                  {claimCase.culpritCarType || 'سواری'} | {claimCase.culpritPlate || '---'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">شرکت بیمه‌گر مقصر:</span>
                <span className="font-extrabold text-blue-900">{insurerName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">سقف مالی بیمه‌نامه:</span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(policyLimit)}</span>
              </div>
            </div>
          </div>

          {/* VICTIM PARTY CARD (زیـان‌دیـده حـادثه) */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs text-emerald-950">مشخصات زیان‌دیده حادثه</h3>
                  <span className="text-[10px] text-slate-500 font-medium">مالک خودروی آسیب‌دیده</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                طلبکار خسارت
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">نام و نام خانوادگی:</span>
                <span className="font-black text-slate-900">{victimName}</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">شماره تماس زیان‌دیده:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${victimPhone}`}
                    className="font-mono font-black text-emerald-900 hover:underline"
                    dir="ltr"
                  >
                    {victimPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">خودرو و پلاک زیان‌دیده:</span>
                <span className="font-bold text-slate-800">
                  {claimCase.carType || 'سواری'} | {claimCase.plate || '---'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">شماره شبا جهت واریز:</span>
                <span className="font-mono text-[11px] font-bold text-slate-700 truncate max-w-[140px]" dir="ltr">
                  {claimCase.iban || claimCase.payoutInfo?.iban || 'ثبت نشده'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">مجموع مطالبه مصوب:</span>
                <span className="font-mono font-black text-emerald-800">{formatCurrency(totalClaim)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* DETAILED FINANCIAL CALCULATION BREAKDOWN TABLE */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-black text-xs text-blue-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-900" />
              <span>ریز محاسبات مالی و استخراج سهم بیمه و بدهی مقصر</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-bold">
              مستند به آئین‌نامه بیمه مرکزی
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-medium">۱. خسارت فیزیکی کل کارشناسی (قطعات + اجرت):</span>
              <span className="font-mono font-bold">{formatCurrency(directDamage)}</span>
            </div>

            {salvage > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">۲. کسر ارزش داغی / قطعات تعویضی:</span>
                <span className="font-mono font-bold text-rose-700">- {formatCurrency(salvage)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-700">
              <span className="font-medium">۳. افت قیمت خودرو (مشمول ماده ۲ قانون ثالث):</span>
              <span className="font-mono font-bold text-amber-900">+ {formatCurrency(diminution)}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-black text-slate-900">
              <span>مجموع کل مطالبات قانونی زیان‌دیده:</span>
              <span className="font-mono text-sm text-blue-900">{formatCurrency(totalClaim)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
              
              {/* Insurance Covered Portion */}
              <div className="bg-emerald-100/70 border border-emerald-300 p-3 rounded-xl space-y-1">
                <span className="text-[11px] text-emerald-950 font-bold block">
                  سهم پرداختی شرکت بیمه ({insurerName}):
                </span>
                <span className="font-black text-sm text-emerald-900 font-mono block">
                  {formatCurrency(insurerPortion)}
                </span>
                <span className="text-[10px] text-emerald-800 block">
                  واریز مستقیم به شماره شبای زیان‌دیده
                </span>
              </div>

              {/* Culprit Excess Debt Portion */}
              <div className={`p-3 rounded-xl border space-y-1 ${
                culpritDebt > 0 
                  ? 'bg-rose-100/70 border-rose-300 text-rose-950' 
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}>
                <span className="text-[11px] font-bold block">
                  مازاد بدهی قطعی مقصر ({culpritName}):
                </span>
                <span className="font-black text-sm font-mono block text-rose-900">
                  {culpritDebt > 0 ? formatCurrency(culpritDebt) : 'فاقد بدهی مازاد (تسویه کامل)'}
                </span>
                <span className="text-[10px] block text-rose-800">
                  {culpritDebt > 0 ? 'پرداخت مستقیم به زیان‌دیده' : 'پوشش کامل در سقف بیمه'}
                </span>
              </div>

            </div>

          </div>
        </div>

        {/* SETTLEMENT REGISTRATION ACTION FORM */}
        {onUpdateCase && culpritDebt > 0 && (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            {!showSettlementForm ? (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-blue-900">ثبت تسویه حساب و پرداخت مازاد بدهی</h4>
                  <p className="text-[11px] text-slate-500">
                    در صورت پرداخت یا توافق طرفین، تسویه را در سامانه ثبت نمایید.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettlementForm(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-black transition-all cursor-pointer"
                >
                  ثبت تسویه بدهی
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecordSettlement} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-black text-xs text-blue-900">فرم ثبت تسویه توافقی مازاد بدهی</span>
                  <button
                    type="button"
                    onClick={() => setShowSettlementForm(false)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-bold"
                  >
                    انصراف
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      مبلغ پرداخت‌شده (تومان):
                    </label>
                    <input
                      type="number"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      placeholder={String(culpritDebt)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      توضیحات و شماره پیگیری واریز:
                    </label>
                    <input
                      type="text"
                      value={settlementNote}
                      onChange={(e) => setSettlementNote(e.target.value)}
                      placeholder="مثال: واریز کارت به کارت / رسید شماره ۹۸۴۱۲"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    ثبت نهایی تسویه در پرونده
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* LEGAL NOTE & BOTTOM ACTIONS */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>مستندات قانونی مطالبه مازاد خسارت و افت ارزش خودرو:</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            مطابق رأی وحدت رویه شماره ۸۵۱ هیأت عمومی دیوان عالی کشور و ماده ۲ قانون بیمه اجباری شخص ثالث، خسارت مازاد بر سقف بیمه‌نامه و افت قیمت خودرو رسماً بر عهده راننده مقصر حادثه بوده و در صورت عدم پرداخت توافقی، از طریق شورای حل اختلاف و با استناد به این گزارش کارشناسی قابل وصول می‌باشد.
          </p>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};
