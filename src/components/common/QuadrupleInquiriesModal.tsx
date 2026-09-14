import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserCheck,
  Building2,
  Car,
  X,
  Copy,
  Check,
  RefreshCw,
  Lock,
  ExternalLink,
  Info,
  Shield,
  Layers
} from 'lucide-react';
import { QuadrupleInquiries, InquiryResultItem } from '../../types';

interface QuadrupleInquiriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiries: QuadrupleInquiries;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  title?: string;
  onApplyData?: (inquiries: QuadrupleInquiries) => void;
}

export const QuadrupleInquiriesModal: React.FC<QuadrupleInquiriesModalProps> = ({
  isOpen,
  onClose,
  inquiries,
  onRefresh,
  isRefreshing = false,
  title = 'استعلامات چهارگانه هوشمند و اصالت اطلاعات پرونده',
  onApplyData,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'SANHAB' | 'FANAVARAN' | 'CROQUI' | 'REGISTRY'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const servicesList: {
    key: 'SANHAB' | 'FANAVARAN' | 'CROQUI' | 'REGISTRY';
    title: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
    data: InquiryResultItem;
  }[] = [
    {
      key: 'SANHAB',
      title: '۱. استعلام سنهاب (بیمه مرکزی)',
      sub: 'سامانه نظارت و هدایت الکترونیک بیمه مرکزی ایران',
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
      color: 'blue',
      data: inquiries.sanhab,
    },
    {
      key: 'FANAVARAN',
      title: '۲. استعلام فناوران (Core شرکت بیمه)',
      sub: 'سیستم جامع هسته بیمه‌گری و سوابق بیمه‌گذار',
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
      color: 'indigo',
      data: inquiries.fanavaran,
    },
    {
      key: 'CROQUI',
      title: '۳. استعلام کروکی راهور (فراجا)',
      sub: 'سامانه جامع تصادفات و کروکی برخط پلیس راهور',
      icon: <Car className="w-5 h-5 text-emerald-600" />,
      color: 'emerald',
      data: inquiries.croqui,
    },
    {
      key: 'REGISTRY',
      title: '۴. استعلام ثبت احوال و سجلی',
      sub: 'پایگاه اطلاعات جمعیتی سازمان ثبت احوال و سامانه شاهکار',
      icon: <UserCheck className="w-5 h-5 text-purple-600" />,
      color: 'purple',
      data: inquiries.civilRegistry,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto dir-rtl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                یکپارچگی استعلامات سنهاب، فناوران (Core بیمه)، کروکی فراجا و ثبت احوال
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-all border border-slate-200"
                title="استعلام مجدد برخط"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chassis / VIN Integrity Banner */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-950">
                  تثبیت شماره شاسی (VIN) و یکپارچگی داده‌ها
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-400">
                  احراز شده ✓
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                شماره شاسی از مرحله نخست پرونده خوانده شده و در تمامی مراحل تثبیت گردیده است. عدم نیاز به ورود مجدد توسط مشتری.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-slate-900 font-mono text-xs font-black tracking-wider shadow-2xs" dir="ltr">
              {inquiries.chassisVin || 'IR206SD99482103829'}
            </div>
            <button
              type="button"
              onClick={() => handleCopy(inquiries.chassisVin || 'IR206SD99482103829', 'vin')}
              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all"
              title="کپی شماره شاسی"
            >
              {copiedKey === 'vin' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه استعلامات (۴ گانه)
          </button>
          {servicesList.map((srv) => (
            <button
              key={srv.key}
              type="button"
              onClick={() => setActiveTab(srv.key)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === srv.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{srv.title.split('.')[1]?.trim()}</span>
            </button>
          ))}
        </div>

        {/* Inquiries Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {servicesList
            .filter((srv) => activeTab === 'ALL' || activeTab === srv.key)
            .map((srv) => (
              <div
                key={srv.key}
                className="bg-slate-50/90 border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 space-y-3 transition-all hover:shadow-sm"
              >
                {/* Service Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {srv.icon}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">
                        {srv.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {srv.sub}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    تایید قطعی
                  </span>
                </div>

                {/* Tracking & Date */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-bold text-[10px]">کد رهگیری رسمی:</span>
                    <span className="font-mono font-black text-blue-900 text-xs" dir="ltr">
                      {srv.data.trackingCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(srv.data.trackingCode, srv.key)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                    title="کپی کد رهگیری"
                  >
                    {copiedKey === srv.key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Summary text */}
                <p className="text-[11px] text-slate-700 font-medium leading-relaxed bg-blue-50/40 p-2 rounded-xl border border-blue-100">
                  {srv.data.summaryText}
                </p>

                {/* Key Details Pills */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-100">
                  {Object.entries(srv.data.details).slice(0, 4).map(([key, val]) => (
                    <div key={key} className="bg-white p-1.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block font-bold truncate">
                        {key === 'financialCeiling'
                          ? 'سقف تعهد مالی'
                          : key === 'bodilyCeiling'
                          ? 'سقف تعهد جانی'
                          : key === 'policyNumber'
                          ? 'شماره بیمه‌نامه'
                          : key === 'discountPercent' || key === 'noClaimDiscountPercent'
                          ? 'تخفیف عدم خسارت'
                          : key === 'accountStatus'
                          ? 'وضعیت حساب Core'
                          : key === 'croquiReportNumber'
                          ? 'شماره پرونده کروکی'
                          : key === 'officerBadgeId'
                          ? 'کد افسر کارشناس'
                          : key === 'vitalStatus'
                          ? 'وضعیت حیات'
                          : key === 'shahkarVerification'
                          ? 'تطبیق شاهکار'
                          : key}
                      </span>
                      <span className="font-bold text-slate-900 truncate block mt-0.5">
                        {typeof val === 'number'
                          ? val.toLocaleString('fa-IR') + ' تومان'
                          : typeof val === 'boolean'
                          ? (val ? 'تایید شد ✓' : 'خیر')
                          : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {/* Footer Note and Action */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              استعلامات در تاریخ <strong>{inquiries.verifiedAt}</strong> از وب‌سرویس‌های حاکمیتی دریافت و ثبت گردیدند.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onApplyData && (
              <button
                type="button"
                onClick={() => {
                  onApplyData(inquiries);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                تایید و اعمال اطلاعات در فرم
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
