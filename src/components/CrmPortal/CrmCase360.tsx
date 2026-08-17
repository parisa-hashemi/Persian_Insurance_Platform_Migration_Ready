import React, { useState, useMemo } from 'react';
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
  Layers,
  Eye,
  X,
  Phone,
  Image as ImageIcon
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

  // 360-Degree Doc & Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'ALL' | 'DAMAGE' | 'CROQUI' | 'ADDITIONAL'>('ALL');

  // Contact Expert Modal
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [expertNote, setExpertNote] = useState('');
  const [expertSuccess, setExpertSuccess] = useState(false);

  // Financial Calculations
  const directDamage = claimCase.assessment?.payable || claimCase.assessment?.totalAmount || 0;
  const diminution = claimCase.diminutionValue || 0;
  const salvage = claimCase.assessment?.salvage || 0;
  const policyCeiling = claimCase.culpritCoverageFinancial || 50000000;
  const totalClaim = Math.max(0, directDamage + diminution - salvage);
  const insurerPayable = Math.min(totalClaim, policyCeiling);
  const culpritDebt = Math.max(0, totalClaim - policyCeiling);

  // Safe ground summary
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

  // Compile media items for 360 doc view
  const allMedia = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      category: 'DAMAGE' | 'CROQUI' | 'ADDITIONAL';
      url: string;
      uploader: string;
      date: string;
    }> = [];

    if (claimCase.files && Array.isArray(claimCase.files)) {
      claimCase.files.forEach((f, idx) => {
        list.push({
          id: `f-${idx}`,
          title: f.title || f.name || `تصویر خسارت بدنه ${idx + 1}`,
          category: 'DAMAGE',
          url: f.previewUrl || f.url || 'https://images.unsplash.com/photo-1590362891988-3f41e57c6ef9?w=600&auto=format&fit=crop&q=80',
          uploader: 'زیان‌دیده (پذیرش آنلاین)',
          date: claimCase.date
        });
      });
    }

    if (claimCase.additionalDocs && Array.isArray(claimCase.additionalDocs)) {
      claimCase.additionalDocs.forEach(d => {
        list.push({
          id: d.id,
          title: d.title || d.docType,
          category: d.docType.includes('کروکی') ? 'CROQUI' : 'ADDITIONAL',
          url: d.dataUrl || d.url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop&q=80',
          uploader: `${d.uploadedBy} (${d.uploaderRole || 'کاربر'})`,
          date: d.uploadedAt
        });
      });
    }

    if (claimCase.customerKrokiPhoto) {
      list.push({
        id: 'kroki-p',
        title: 'برگه کروکی دستی پلیس راهور',
        category: 'CROQUI',
        url: claimCase.customerKrokiPhoto,
        uploader: 'پلیس راهور',
        date: claimCase.date
      });
    }

    return list;
  }, [claimCase]);

  const filteredMedia = useMemo(() => {
    if (selectedDocType === 'ALL') return allMedia;
    return allMedia.filter(m => m.category === selectedDocType);
  }, [allMedia, selectedDocType]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all cursor-pointer"
            title="بازگشت"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
                {claimCase.id}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                نمای ۳۶۰ درجه پرونده خسارت (Case 360)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              تاریخ حادثه: {claimCase.date} • شرکت بیمه‌گر مقصر: {claimCase.culpritInsurer || 'بیمه دانا'} • نوع خسارت: ثالث مالی
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenNewCallForCase(claimCase)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>ثبت تماس برای این پرونده</span>
          </button>
          <button
            onClick={() => setShowExpertModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>تماس با کارشناس ارزیاب</span>
          </button>
          <button
            onClick={() => setShowDocModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>مدارک ۳۶۰ درجه</span>
          </button>
          <button
            onClick={() => onOpenNewFollowUpForCase(claimCase)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد پیگیری</span>
          </button>
          <button
            onClick={() => onOpenNewTicketForCase(claimCase)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>ثبت شکایت</span>
          </button>
          <button
            onClick={() => {
              setSmsText(`زیان‌دیده گرامی؛ پرونده خسارت ${claimCase.id} نیازمند اقدام در پنل کاربری است.`);
              setShowSmsModal(true);
            }}
            className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>ارسال پیامک</span>
          </button>
        </div>
      </div>

      {/* Grounded Claimant-Safe Context Box (For Phone Calls) */}
      <div className="bg-indigo-50/50 border-2 border-indigo-200 rounded-3xl p-5 sm:p-6 text-slate-900 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
          <div className="flex items-center gap-2 font-black text-sm text-indigo-900">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>خلاصه رسمی و امن پرونده جهت پاسخگویی به مشتری (پشتیبانی تلفنی و پیامکی)</span>
          </div>
          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'کپی شد' : 'کپی متن راهنما'}</span>
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-100 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-line shadow-2xs">
          {safeSummary}
        </div>
      </div>

      {/* Case 360 4-Pillar Grid: Parties, Policy, Milestone/Blockers, Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Parties */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              طرفین حادثه
            </span>
            <span className="text-[10px] text-slate-500 font-bold">زیان‌دیده و مقصر</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl space-y-1 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-indigo-700 font-bold">زیان‌دیده:</span>
                <button
                  onClick={() => onSelectCustomer(claimCase.victimPhone)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  پروفایل ۳۶۰ ←
                </button>
              </div>
              <p className="font-bold text-slate-900 text-sm">{claimCase.victimName || 'زیان‌دیده'}</p>
              <p className="text-slate-500 font-mono">موبایل: {maskPhoneNumber(claimCase.victimPhone)}</p>
              <p className="text-slate-500 font-mono">کد ملی: {maskNationalId(claimCase.victimNationalId || claimCase.partyOneNationalId)}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl space-y-1 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-amber-800 font-bold">راننده مقصر:</span>
                <button
                  onClick={() => onSelectCustomer(claimCase.culpritPhone)}
                  className="text-[11px] text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                >
                  پروفایل ۳۶۰ ←
                </button>
              </div>
              <p className="font-bold text-slate-900 text-sm">{claimCase.culpritName || 'مقصر حادثه'}</p>
              <p className="text-slate-500 font-mono">موبایل: {maskPhoneNumber(claimCase.culpritPhone)}</p>
              <p className="text-slate-500 font-mono">کد ملی: {maskNationalId(claimCase.culpritNationalId || claimCase.partyTwoNationalId)}</p>
            </div>
          </div>
        </div>

        {/* Pillar 2: Vehicle & Policy */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-sky-600" />
              خودروها و بیمه‌نامه
            </span>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              سنهاب تایید شد
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl space-y-1 border border-slate-100">
              <span className="text-slate-500 block text-[10px]">خودروی زیان‌دیده و پلاک</span>
              <p className="font-bold text-slate-900">{claimCase.carType || 'سواری'}</p>
              <p className="font-mono text-slate-700 font-bold">{claimCase.plate || '—'}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl space-y-1 border border-slate-100">
              <span className="text-slate-500 block text-[10px]">بیمه‌نامه مقصر و سقف تعهد</span>
              <p className="font-bold text-slate-900">{claimCase.culpritInsurer || 'بیمه دانا'}</p>
              <p className="text-emerald-700 font-bold font-mono">
                سقف مالی: {formatCurrency(policyCeiling)}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                شماره بیمه‌نامه: {claimCase.culpritPolicyNo || 'استعلام برخط سنهاب'}
              </p>
            </div>
          </div>
        </div>

        {/* Pillar 3: Workflow Milestone & Blockers */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              وضعیت گردش‌کار و موانع
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              مرحله زنده
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 border border-slate-100">
              <span className="text-slate-500 block text-[10px]">وضعیت جاری پرونده</span>
              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 block text-center">
                {claimCase.status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl space-y-1 border border-slate-100">
              <span className="text-slate-500 block text-[10px]">مسئول / واحد پیگیری</span>
              <p className="font-bold text-slate-900">
                {claimCase.assignedExpert?.name ? `ارزیاب: ${claimCase.assignedExpert.name}` : 'واحد ارزیابی و خسارت'}
              </p>
              {claimCase.assignedReviewer?.name && (
                <p className="text-slate-500 text-[11px]">ناظر بازبینی: {claimCase.assignedReviewer.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pillar 4: Financials & Payout */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              تسویه مالی و سهم بیمه
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {culpritDebt > 0 ? 'دارای مازاد' : 'پوشش کامل'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-2xl flex items-center justify-between border border-slate-100">
              <span className="text-slate-500 text-[11px]">مجموع کل خسارت:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(totalClaim)}</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl flex items-center justify-between">
              <span className="text-emerald-800 font-bold text-[11px]">سهم پرداختی بیمه:</span>
              <span className="font-mono font-black text-emerald-700">{formatCurrency(insurerPayable)}</span>
            </div>

            <div className={`p-2.5 rounded-2xl flex items-center justify-between border ${
              culpritDebt > 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-100 text-slate-500'
            }`}>
              <span className="text-[11px] font-bold">بدهی مازاد مقصر:</span>
              <span className="font-mono font-black">{culpritDebt > 0 ? formatCurrency(culpritDebt) : '۰ ریال'}</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl space-y-1 border border-slate-100">
              <span className="text-slate-500 text-[10px] block">شماره شبا جهت تسویه:</span>
              <span className="font-mono text-emerald-700 font-bold text-[11px] block">
                {claimCase.payoutInfo?.iban ? maskIban(claimCase.payoutInfo.iban) : 'در انتظار ثبت توسط زیان‌دیده'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence & Document Requests Section */}
      <div className="bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
              وضعیت مدارک، کروکی و درخواست‌های مدرک ارزیاب
            </h3>
          </div>
          <button
            onClick={() => setShowDocModal(true)}
            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>مشاهده همه مدارک</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Kroki & Initial Docs */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200/80">
            <span className="font-bold text-slate-900 text-xs block">وضعیت کروکی و گزارش حادثه</span>
            <p className="text-slate-700">
              {claimCase.hasKroki
                ? `کروکی سازشی پلیس راهور (${claimCase.croquiType === 'electronic' ? 'الکترونیک' : 'دستی'}) ثبت شده است.`
                : 'تصادف بدون کروکی پلیس (پذیرش آنلاین با تایید عکس‌های ۴ طرف و مدارک طرفین).'}
            </p>
            {claimCase.croquiData && (
              <p className="text-[11px] text-slate-500 font-mono">
                کد رهگیری کروکی: {claimCase.croquiData.reportNumber || '—'} | افسر کارشناس: {claimCase.croquiData.officerName || 'پلیس راهور'}
              </p>
            )}
          </div>

          {/* Doc Requests from Assessor */}
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200/80">
            <span className="font-bold text-slate-900 text-xs block">درخواست‌های مدرک ثبت‌شده توسط کارشناس</span>
            {claimCase.docRequests && claimCase.docRequests.length > 0 ? (
              <div className="space-y-1.5">
                {claimCase.docRequests.map((d, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800">{d.docType}</span>
                      <span className="text-[10px] text-slate-500 block">{d.description || 'درخواست بارگذاری مجدد'}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                      d.status === 'تأیید شد' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs">درخواست مدرک ناقص یا مازادی برای این پرونده ثبت نشده است.</p>
            )}
          </div>
        </div>
      </div>

      {/* 360 Document Gallery Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    نگاه ۳۶۰ درجه به مدارک، تصاویر و کروکی پرونده ({claimCase.id})
                  </h3>
                  <p className="text-xs text-slate-500">
                    بررسی جامع مدارک بارگذاری شده، تصاویر خسارت و مستندات کروکی پلیس
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDocModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setSelectedDocType('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocType === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه مدارک ({allMedia.length})
              </button>
              <button
                onClick={() => setSelectedDocType('DAMAGE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocType === 'DAMAGE' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                عکس‌های بدنه و آسیب
              </button>
              <button
                onClick={() => setSelectedDocType('CROQUI')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocType === 'CROQUI' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                کروکی و اسناد راهور
              </button>
              <button
                onClick={() => setSelectedDocType('ADDITIONAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDocType === 'ADDITIONAL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                فاکتورها و مدارک ارسالی
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden hover:border-indigo-300 transition-all space-y-2 p-3 group"
                >
                  <div
                    onClick={() => setLightboxImage(item.url)}
                    className="h-36 bg-slate-200 rounded-xl overflow-hidden relative cursor-pointer"
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Eye className="w-4 h-4" />
                      <span>مشاهده تمام‌صفحه</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                    <p className="text-[10px] text-slate-500">بارگذار: {item.uploader}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{item.date}</p>
                  </div>
                </div>
              ))}

              {filteredMedia.length === 0 && (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  مدرکی در این بخش یافت نشد.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDocModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                بستن
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

      {/* Expert Contact Modal */}
      {showExpertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  تماس و هماهنگی با کارشناس ارزیاب پرونده
                </h3>
              </div>
              <button onClick={() => setShowExpertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">نام ارزیاب:</span>
                <span className="font-extrabold text-slate-900">
                  {claimCase.assignedExpert?.name || claimCase.assignedFieldExpert?.name || 'کارشناس رسمی ارزیابی'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">شماره تماس:</span>
                <span className="font-mono font-bold text-indigo-700" dir="ltr">
                  {claimCase.assignedExpert?.phone || claimCase.assignedFieldExpert?.phone || '09121112233'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900">برقراری تماس تلفنی مستقیم:</span>
              <a
                href={`tel:${claimCase.assignedExpert?.phone || '09121112233'}`}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-2xs"
              >
                تماس با کارشناس
              </a>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">ارسال یادداشت / استعلام پیامکی به کارشناس:</label>
              <textarea
                value={expertNote}
                onChange={e => setExpertNote(e.target.value)}
                placeholder="توضیح یا سوال در خصوص برآورد یا مدارک..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            {expertSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>استعلام با موفقیت به کارشناس ارسال شد.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowExpertModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                بستن
              </button>
              <button
                onClick={() => {
                  setExpertSuccess(true);
                  setTimeout(() => {
                    setExpertSuccess(false);
                    setShowExpertModal(false);
                    setExpertNote('');
                  }, 2000);
                }}
                disabled={!expertNote.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
              >
                ارسال به کارشناس
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Reminder Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Send className="w-4 h-4 text-sky-600" />
                <span>ارسال پیامک اطلاع‌رسانی به طرفین پرونده</span>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                بستن
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">گیرنده پیامک:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSmsRecipient('VICTIM')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      smsRecipient === 'VICTIM'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    زیان‌دیده ({claimCase.victimName})
                  </button>
                  <button
                    onClick={() => setSmsRecipient('CULPRIT')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                      smsRecipient === 'CULPRIT'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    مقصر حادثه ({claimCase.culpritName})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">متن پیامک ارسالی:</label>
                <textarea
                  value={smsText}
                  onChange={e => setSmsText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              {smsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>پیامک با موفقیت از طریق درگاه پیامکی سیستم ارسال گردید.</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSmsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                انصراف
              </button>
              <button
                onClick={handleSendQuickSms}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
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
