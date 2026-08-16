import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Car,
  AlertTriangle,
  CheckCircle2,
  User,
  Building2,
  ExternalLink,
  Maximize2,
  FileCheck,
  Compass,
  SunMedium
} from 'lucide-react';
import { ClaimCase } from '../../types';
import { getStandardPoliceReport, StandardPoliceReportData } from '../../lib/policeCroquiHelper';

interface PoliceCroquiReportViewProps {
  claimCase: ClaimCase;
  customData?: Partial<StandardPoliceReportData>;
  onClose?: () => void;
  showBackBtn?: boolean;
}

export const PoliceCroquiReportView: React.FC<PoliceCroquiReportViewProps> = ({
  claimCase,
  customData,
  onClose,
  showBackBtn = false
}) => {
  const data = { ...getStandardPoliceReport(claimCase), ...customData };
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 space-y-6 p-5 sm:p-7">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900">استعلام رسمی گزارش تصادف و کروکی پلیس راهور</h2>
              <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300">
                {data.reportCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              پایگاه جامع داده‌های تصادفات راهور فراجا — اتصال برخط و اعتبارسنجی شده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge: Paper vs Electronic */}
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-2xs ${
              data.croquiType === 'electronic'
                ? 'bg-blue-50 text-blue-900 border-blue-300'
                : 'bg-amber-50 text-amber-950 border-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>{data.croquiTypePersian}</span>
          </span>

          {showBackBtn && onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              بازگشت
            </button>
          )}
        </div>
      </div>

      {/* Inquiry Status Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 rounded-2xl border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-extrabold text-emerald-950">{data.inquiryStatus}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          استعلام: {data.inquiryDate}
        </span>
      </div>

      {/* Primary 4-Box Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Box 1: تاریخ و ساعت دقیق */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>تاریخ و ساعت دقیق تصادف:</span>
          </div>
          <p className="font-black text-slate-900 text-xs leading-relaxed font-mono">
            {data.incidentDateTime}
          </p>
        </div>

        {/* Box 2: نوع تصادف */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
            <Compass className="w-4 h-4 text-purple-600" />
            <span>نوع تصادف:</span>
          </div>
          <p className="font-extrabold text-slate-900 text-xs leading-relaxed">
            {data.accidentType}
          </p>
        </div>

        {/* Box 3: وضعیت جاده و جوی */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
            <SunMedium className="w-4 h-4 text-amber-600" />
            <span>وضعیت جاده و شرایط جوی:</span>
          </div>
          <p className="font-bold text-slate-800 text-[11px] leading-relaxed">
            {data.roadCondition}
          </p>
        </div>

        {/* Box 4: تعیین مقصر */}
        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>تعیین مقصر قانونی:</span>
          </div>
          <p className="font-black text-rose-950 text-xs leading-relaxed">
            {data.faultPercent}٪ مقصر (راننده طرف دوم)
          </p>
        </div>
      </div>

      {/* Exact Location */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-bold">
          <MapPin className="w-4 h-4 text-rose-600" />
          <span>محل دقیق وقوع حادثه:</span>
        </div>
        <p className="font-extrabold text-slate-900 text-xs leading-relaxed pr-5">
          {data.exactLocation}
        </p>
      </div>

      {/* Narrative: شرح مختصر افسر کاردان فنی */}
      <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-blue-900 font-black">
          <FileText className="w-4 h-4 text-blue-700" />
          <span>شرح مختصر افسر کارشناس تصادفات پلیس راهور:</span>
        </div>
        <p className="font-bold text-slate-900 text-xs leading-relaxed bg-white/80 p-3 rounded-xl border border-blue-100">
          «{data.briefDescription}»
        </p>
      </div>

      {/* Fault Determination Details */}
      <div className="p-4 bg-gradient-to-l from-rose-50 via-amber-50 to-orange-50 rounded-2xl border border-rose-200 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-black text-rose-950 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            علت تامه تصادف و تطبیق با مقررات راهور:
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-mono text-[10px] font-black">
            تقصیر: {data.faultPercent}٪
          </span>
        </div>
        <p className="font-extrabold text-rose-950 leading-relaxed bg-white/90 p-3 rounded-xl border border-rose-100">
          {data.faultDetermination}
        </p>
      </div>

      {/* Drivers Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* At Fault Driver */}
        <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200">
            <span className="font-black text-rose-950 flex items-center gap-1.5">
              <User className="w-4 h-4 text-rose-600" />
              راننده مقصر حادثه (طرف دوم)
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-bold">
              {data.faultPercent}٪ مسئول
            </span>
          </div>

          <div className="space-y-1.5 text-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">نام و نام خانوادگی:</span>
              <strong className="text-slate-900">{data.faultDriver.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">کد ملی / شناسه:</span>
              <span className="font-mono font-bold text-slate-800">{data.faultDriver.nationalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">خودرو و پلاک:</span>
              <span className="font-bold text-slate-900">{data.faultDriver.carType} — <span className="font-mono text-xs">{data.faultDriver.plate}</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">شرکت بیمه‌گر و بیمه‌نامه:</span>
              <span className="font-extrabold text-rose-900">{data.faultDriver.insurer} ({data.faultDriver.policyNo})</span>
            </div>
          </div>
        </div>

        {/* Victim Driver */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
            <span className="font-black text-emerald-950 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              راننده زیان‌دیده (طرف اول)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">
              ۰٪ بدون تقصیر
            </span>
          </div>

          <div className="space-y-1.5 text-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">نام و نام خانوادگی:</span>
              <strong className="text-slate-900">{data.victimDriver.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">کد ملی / شناسه:</span>
              <span className="font-mono font-bold text-slate-800">{data.victimDriver.nationalId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">خودرو و پلاک:</span>
              <span className="font-bold text-slate-900">{data.victimDriver.carType} — <span className="font-mono text-xs">{data.victimDriver.plate}</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">شرکت بیمه‌گر و بیمه‌نامه:</span>
              <span className="font-extrabold text-emerald-900">{data.victimDriver.insurer}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Officer and Unit Details */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <span className="font-bold text-slate-700">
            افسر کاردان فنی رسیدگی‌کننده: <strong>{data.officerName}</strong>
          </span>
          <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
            کد: {data.officerCode}
          </span>
        </div>
        <span className="font-medium text-slate-600">
          یگان: {data.policeUnit}
        </span>
      </div>

      {/* Croqui Image / Drawing if available */}
      {data.croquiPhotoUrl && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              تصویر برگ کروکی و کروکی ترسیمی:
            </span>
            <button
              onClick={() => setZoomImage(data.croquiPhotoUrl || null)}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>مشاهده در اندازه بزرگ</span>
            </button>
          </div>

          <div
            onClick={() => setZoomImage(data.croquiPhotoUrl || null)}
            className="rounded-2xl overflow-hidden border border-slate-300 max-h-64 bg-slate-200 cursor-pointer group relative"
          >
            <img
              src={data.croquiPhotoUrl}
              alt="کروکی پلیس"
              className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5">
              <Maximize2 className="w-4 h-4" />
              <span>کلیک جهت بزرگنمایی</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom */}
      {zoomImage && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-sm text-slate-900">تصویر کروکی پلیس راهور ({data.reportCode})</span>
              <button
                onClick={() => setZoomImage(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center">
              <img src={zoomImage} alt="کروکی" className="max-w-full h-auto rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
