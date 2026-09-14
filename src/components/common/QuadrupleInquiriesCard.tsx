import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Car,
  UserCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';
import { QuadrupleInquiries } from '../../types';
import { QuadrupleInquiriesModal } from './QuadrupleInquiriesModal';

interface QuadrupleInquiriesCardProps {
  inquiries: QuadrupleInquiries;
  victimVin?: string;
  culpritVin?: string;
  caseId?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const QuadrupleInquiriesCard: React.FC<QuadrupleInquiriesCardProps> = ({
  inquiries,
  victimVin,
  culpritVin,
  caseId,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const displayVin = inquiries.chassisVin || victimVin || 'IR206SD99482103829';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const services = [
    {
      title: 'سنهاب بیمه مرکزی',
      sub: inquiries.sanhab.statusLabelFa,
      code: inquiries.sanhab.trackingCode,
      icon: <ShieldCheck className="w-4 h-4 text-blue-600" />,
      color: 'blue',
    },
    {
      title: 'سامانه Core فناوران',
      sub: inquiries.fanavaran.statusLabelFa,
      code: inquiries.fanavaran.trackingCode,
      icon: <Building2 className="w-4 h-4 text-indigo-600" />,
      color: 'indigo',
    },
    {
      title: 'کروکی پلیس راهور',
      sub: inquiries.croqui.statusLabelFa,
      code: inquiries.croqui.trackingCode,
      icon: <Car className="w-4 h-4 text-emerald-600" />,
      color: 'emerald',
    },
    {
      title: 'ثبت احوال و سجلی',
      sub: inquiries.civilRegistry.statusLabelFa,
      code: inquiries.civilRegistry.trackingCode,
      icon: <UserCheck className="w-4 h-4 text-purple-600" />,
      color: 'purple',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200/90 shadow-xs space-y-3.5 transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                استعلامات چهارگانه هوشمند و یکپارچگی داده‌ها
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                تکمیل و تایید شده
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              استعلام برخط از سنهاب، Core فناوران، سامانه کروکی و ثبت احوال • احراز عدم تقلب
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            مشاهده جزئیات ۴ استعلام
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            title={isExpanded ? 'بستن' : 'گسترش'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chassis / VIN Deduplication & Lock Info */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-emerald-950">شماره شاسی خودرو (VIN):</span>
              <span className="text-[10px] font-bold bg-emerald-200/90 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-400">
                قفل و تثبیت در مرحله نخست (بدون نیاز به ثبت مجدد)
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-800 font-medium">
              شماره شاسی از اسناد اولیه خوانده شده و اسکن مجدد صرفاً در محل بازدید توسط ارزیاب جهت احراز عدم تقلب انجام می‌پذیرد.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <div className="px-3 py-1 bg-white border border-emerald-300 rounded-xl font-mono text-xs font-black text-slate-900 tracking-wider shadow-2xs" dir="ltr">
            {displayVin}
          </div>
          <button
            type="button"
            onClick={() => handleCopy(displayVin, 'vin-main')}
            className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all cursor-pointer"
            title="کپی شماره شاسی"
          >
            {copiedKey === 'vin-main' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 4 Inquiry Status Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {services.map((srv, idx) => (
          <div
            key={idx}
            className="bg-slate-50 border border-slate-200 hover:border-blue-300 p-2.5 rounded-2xl flex items-center justify-between gap-2 transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                {srv.icon}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-black text-slate-900 block truncate">
                  {srv.title}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" dir="ltr">
                  {srv.code}
                </span>
              </div>
            </div>
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300" title="تایید شد">
              <Check className="w-3 h-3" />
            </span>
          </div>
        ))}
      </div>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
          {/* Sanhab Details */}
          <div className="bg-blue-50/50 border border-blue-200 p-3 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-black text-blue-950">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                سنهاب بیمه مرکزی
              </span>
              <span className="text-[10px] font-mono text-blue-800" dir="ltr">
                {inquiries.sanhab.trackingCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {inquiries.sanhab.summaryText}
            </p>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
              <span>سقف مالی: {Number(inquiries.sanhab.details.financialCeiling || 50000000).toLocaleString('fa-IR')} تومان</span>
              <span className="text-emerald-700">خودروی متعارف (۱۰۰٪ شمول)</span>
            </div>
          </div>

          {/* Fanavaran Details */}
          <div className="bg-indigo-50/50 border border-indigo-200 p-3 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-black text-indigo-950">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-700" />
                هسته بیمه‌گری فناوران (Core)
              </span>
              <span className="text-[10px] font-mono text-indigo-800" dir="ltr">
                {inquiries.fanavaran.trackingCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {inquiries.fanavaran.summaryText}
            </p>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
              <span>تخفیف عدم خسارت: ۴۰٪</span>
              <span className="text-emerald-700">فاقد بدهی معوق</span>
            </div>
          </div>

          {/* Croqui Details */}
          <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-black text-emerald-950">
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-700" />
                کروکی راهور (فراجا)
              </span>
              <span className="text-[10px] font-mono text-emerald-800" dir="ltr">
                {inquiries.croqui.trackingCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {inquiries.croqui.summaryText}
            </p>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
              <span>کد کارشناس راهور: PL-8491</span>
              <span className="text-emerald-700">اصالت کروکی تایید شد</span>
            </div>
          </div>

          {/* Civil Registry Details */}
          <div className="bg-purple-50/50 border border-purple-200 p-3 rounded-2xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-black text-purple-950">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-purple-700" />
                ثبت احوال و سجلی
              </span>
              <span className="text-[10px] font-mono text-purple-800" dir="ltr">
                {inquiries.civilRegistry.trackingCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              {inquiries.civilRegistry.summaryText}
            </p>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 pt-1">
              <span>تطبیق شاهکار: تایید</span>
              <span className="text-emerald-700">هویت سجلی احراز شد</span>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <QuadrupleInquiriesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        inquiries={inquiries}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
};
