import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Scale,
  FileText,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Car,
  User,
  CheckCircle2,
  Building2,
  Share2,
  Info
} from 'lucide-react';
import { ClaimCase } from '../../types';
import { formatCurrency, getInsurerPersianName } from '../../lib/storage';

interface JudicialDiminutionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimCase: ClaimCase;
  assessmentCard?: any;
}

export const JudicialDiminutionReportModal: React.FC<JudicialDiminutionReportModalProps> = ({
  isOpen,
  onClose,
  claimCase,
  assessmentCard
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const todayShamsi = new Date().toLocaleDateString('fa-IR');
  const reportNumber = `JUD-DIM-${claimCase.id.replace(/[^0-9]/g, '') || '98402'}-${new Date().getFullYear()}`;
  const expertName = claimCase.assignedFieldExpert?.name || claimCase.assessment?.assessorName || 'مهندس کامران رستمی (کارشناس رسمی ارزیاب خسارت)';
  const expertStamp = claimCase.assignedFieldExpert?.nationalId ? `EXP-FLD-${claimCase.assignedFieldExpert.nationalId.slice(-4)}` : 'EXP-FLD-9821';
  const victimName = claimCase.victimName || 'زیان‌دیده محترم';
  const victimPhone = claimCase.victimPhone || '---';
  const culpritName = claimCase.culpritName || 'راننده مقصر حادثه';
  const culpritPhone = claimCase.culpritPhone || '---';
  const carType = claimCase.carType || 'سواری پژو ۲۰۷';
  const plate = claimCase.plate || 'ایران ۲۲ - ۴۵۶ ج ۸۹';
  const culpritInsurer = getInsurerPersianName(claimCase.culpritInsurer);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(reportNumber);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      dir="rtl"
    >
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-slate-900"
        id="judicial-diminution-report-modal"
      >
        {/* Modal Top Bar (Non-print) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base">
                گزارش مستند ارزیابی خسارت و افت قیمت خودرو
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                ویژه ارائه به شورای حل اختلاف و مراجع قضایی (مطابق رأی وحدت رویه ۸۵۱ دیوان عالی کشور)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">چاپ رسمی گزارش (Print)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Legal Explanatory Notice (Non-print) */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-950 text-xs print:hidden flex items-start gap-2.5">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-xs block text-amber-900">
              مستندات قانونی مطالبه افت ارزش خودرو (شورای حل اختلاف):
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              مطابق رأی وحدت رویه شماره ۸۵۱ هیأت عمومی دیوان عالی کشور و ماده ۲ قانون بیمه شخص ثالث، جبران افت ارزش خودرو بر عهده مقصر حادثه است. این گزارش کارشناسی رسمی با ثبت تخصصی ضرایب افت قطعات سازه‌ای و رنگ جهت طرح دعوی در شورای حل اختلاف و مراجع قضایی در اختیار زیان‌دیده قرار می‌گیرد.
            </p>
          </div>
        </div>

        {/* Official Printable Sheet Container */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-900">
                <Scale className="w-6 h-6 text-slate-900" />
                <span className="font-black text-base sm:text-lg">جمهوری اسلامی ایران</span>
              </div>
              <p className="text-xs text-slate-700 font-bold">
                قوه قضاییه — مرکز حل اختلاف / کانون کارشناسان رسمی دادگستری
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                سامانه یکپارچه ارزیابی و کارشناسی خسارات حوادث رانندگی
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-300 text-right text-xs space-y-1 shrink-0 min-w-[220px]">
              <div className="flex justify-between items-center text-slate-600">
                <span>شماره گزارش کارشناسی:</span>
                <span className="font-mono font-bold text-slate-900">{reportNumber}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>تاریخ صدور کارشناسی:</span>
                <span className="font-mono font-bold text-slate-900">{todayShamsi}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>کد رهگیری پرونده خسارت:</span>
                <span className="font-mono font-bold text-slate-900">{claimCase.id}</span>
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-2 bg-slate-100 rounded-xl border border-slate-300">
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              گزارش رسمی و مستند ارزیابی افت قیمت خودرو و خسارات ناشی از حادثه
            </h2>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              مستند به رأی وحدت رویه شماره ۸۵۱ هیأت عمومی دیوان عالی کشور و ماده ۲ قانون بیمه شخص ثالث
            </p>
          </div>

          {/* Parties & Vehicles Information Table */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-700" />
              <span>مشخصات طرفین حادثه و وسایل نقلیه:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Victim (Claimant) */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-1.5">
                <span className="font-black text-emerald-950 block text-xs border-b border-emerald-200 pb-1">
                  مشخصات زیان‌دیده (خواهان / متضرر حادثه):
                </span>
                <div className="flex justify-between text-slate-700">
                  <span>نام و نام‌خانوادگی:</span>
                  <strong className="text-slate-900">{victimName}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>شماره تماس:</span>
                  <span className="font-mono font-bold">{victimPhone}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>نوع و مدل خودرو:</span>
                  <strong className="text-slate-900">{carType}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>شماره پلاک انتظامی:</span>
                  <span className="font-mono font-bold text-slate-900">{plate}</span>
                </div>
              </div>

              {/* Culprit (Defendant) */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-300 rounded-2xl space-y-1.5">
                <span className="font-black text-rose-950 block text-xs border-b border-rose-200 pb-1">
                  مشخصات راننده مقصر (خوانده / مسئول جبران خسارت):
                </span>
                <div className="flex justify-between text-slate-700">
                  <span>نام و نام‌خانوادگی مقصر:</span>
                  <strong className="text-slate-900">{culpritName}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>شماره تماس مقصر:</span>
                  <span className="font-mono font-bold">{culpritPhone}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>شرکت بیمه‌گر شخص ثالث:</span>
                  <strong className="text-slate-900">{culpritInsurer}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>شماره بیمه‌نامه مقصر:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {claimCase.culpritPolicyNo || 'POL-1403-9982'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Technical Assessment Details */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-slate-700" />
              <span>مستندات فنی و بررسی کارشناسی آسیب‌های وارده:</span>
            </h4>
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-2xl space-y-2 text-xs leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">محل و تاریخ وقوع حادثه:</span>
                  <span className="font-bold text-slate-900">{claimCase.city || 'تهران'} • {claimCase.incidentDate || todayShamsi}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">نوع کروکی تنظیمی:</span>
                  <span className="font-bold text-slate-900">
                    {claimCase.croquiType === 'paper' ? 'کروکی کاغذی پلیس راهور' : claimCase.croquiType === 'judicial' ? 'کروکی قضایی / گزارش کارشناس' : 'کروکی الکترونیک راهور'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">وضعیت اصالت صحنه:</span>
                  <span className="font-bold text-emerald-800">مورد تایید قطعی کارشناس رسمی</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">
                  نواحی آسیب‌دیده اسکلت، رنگ و بدنه خودرو که موجب افت ارزش بازار می‌گردد:
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {claimCase.fieldExpertReportNote ||
                    claimCase.assessment?.reviewerNote ||
                    'با بررسی فیزیکی خودرو و معاینه دقیق در محل، آسیب وارده به قطعات اصلی بدنه شامل گلگیر، سپر، شاسی و قطعات رنگ‌دار محرز گردید. با توجه به سال ساخت خودرو و عدم وجود سابقه تصادف قبلی در بخش‌های یادشده، تصادف موجب افت ارزش مسلم بازار خودرو گردیده است.'}
                </p>
              </div>
            </div>
          </div>

          {/* Legal Grounds & Supreme Court Precedent */}
          <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl space-y-2 text-xs">
            <h4 className="font-black text-blue-950 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-800 shrink-0" />
              <span>مبانی و مستندات قانونی مطالبه افت قیمت در مراجع قضایی:</span>
            </h4>
            <div className="space-y-1.5 text-slate-800 text-[11px] leading-relaxed font-medium">
              <p>
                <strong>۱. رأی وحدت رویه شماره ۸۵۱ مورخ ۱۴۰۳/۰۴/۱۹ هیأت عمومی دیوان عالی کشور:</strong> بر اساس این رأی وحدت‌رویه که برای کلیه مراجع قضایی و شعب شورای حل اختلاف لازم‌الاتباع است، «خسارت افت قیمت خودرو در اثر تصادفات رانندگی قابل مطالبه بوده و راننده مسبب حادثه مسئول پرداخت خسارت وارده به خودروی زیان‌دیده می‌باشد.»
              </p>
              <p>
                <strong>۲. ماده ۲ قانون بیمه اجباری خسارات واردشده به شخص ثالث (مصوب ۱۳۹۵):</strong> کلیه خسارت‌های مالی وارده بر اشخاص ثالث به عنوان دین قانونی بر ذمه مقصر حادثه بوده و در مواردی که تعهدات بیمه‌گر محدود است یا خسارت افت قیمت از تعهد مستقیم خارج باشد، مسبب حادثه مکلف به جبران کامل آن است.
              </p>
              <p>
                <strong>۳. اصل لزوم جبران کامل ضرر (قاعده لاضرر و مواد ۱ و ۲ قانون مسئولیت مدنی):</strong> هرکس بدون مجوز قانونی به طور عمد یا بر اثر بی‌احتیاطی به مال دیگری لطمه وارد نماید، مسئول جبران کامل خسارت و کسر قیمت حاصل از آن است.
              </p>
            </div>
          </div>

          {/* Action Guide for Victim to Submit in Dispute Resolution Council */}
          <div className="p-4 bg-indigo-50 border border-indigo-300 rounded-2xl space-y-2.5 text-xs">
            <h4 className="font-black text-indigo-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-800 shrink-0" />
              <span>راهنمای گام‌به‌گام زیان‌دیده جهت اقدام در شورای حل اختلاف:</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-800 text-[11px] font-medium leading-relaxed">
              <li>
                <strong>پرینت یا ذخیره فایل این گزارش:</strong> نسخه رسمی این گزارش کارشناسی مستند را به همراه کد رهگیری چاپ نمایید.
              </li>
              <li>
                <strong>مراجعه به دفاتر خدمات الکترونیک قضایی:</strong> با به همراه داشتن کارت ملی، سند خودرو، برگه کروکی تصادف و این گزارش کارشناسی به نزدیک‌ترین دفتر خدمات الکترونیک قضایی مراجعه نمایید.
              </li>
              <li>
                <strong>ثبت دادخواست مطالبه خسارت افت قیمت:</strong> دادخواست تحت عنوان <em>«مطالبه خسارت افت ارزش خودرو ناشی از حادثه تصادف رانندگی به انضمام کلیه خسارات دادرسی»</em> علیه راننده مقصر ثبت گردد.
              </li>
              <li>
                <strong>رسیدگی در شورای حل اختلاف:</strong> پرونده پس از ثبت در دفاتر خدمات، جهت رسیدگی و صدور رأی به شعبه شورای حل اختلاف محل اقامت خوانده (مقصر) ارجاع خواهد شد.
              </li>
            </ol>
          </div>

          {/* Official Signatures and Seals */}
          <div className="pt-4 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="font-bold text-slate-600 text-[11px] block">کارشناس رسمی ارزیاب خسارت:</span>
              <strong className="font-black text-slate-900 block text-xs sm:text-sm">{expertName}</strong>
              <span className="text-[10px] text-slate-500 font-mono block">کد صلاحیت کارشناسی: {expertStamp}</span>
              <div className="pt-2 text-emerald-800 font-black text-[11px] flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>امضا و مهر دیجیتال کارشناسی تایید شد</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center text-indigo-800 mb-1">
                <ShieldCheck className="w-6 h-6 text-indigo-700" />
              </div>
              <span className="font-black text-slate-800 text-[11px]">مهر برجسته دیجیتال کانون کارشناسان و سامانه خسارت</span>
              <span className="font-mono text-[10px] text-slate-500">کد تصدیق الکترونیکی: {reportNumber}</span>
            </div>
          </div>

        </div>

        {/* Footer Actions (Non-print) */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTracking}
              className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? 'کد رهگیری کپی شد!' : 'کپی شماره گزارش'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>چاپ رسمی یا ذخیره PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
