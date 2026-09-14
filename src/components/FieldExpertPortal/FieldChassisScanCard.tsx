/**
 * ============================================================================
 * احراز میدانی شماره شاسی (اسکن بارکد) — کارت ضدتقلب کارشناس میدانی
 * ============================================================================
 *
 * الزام کارفرما (بند ۶):
 *   شاسی نباید مجدداً «درخواست» شود؛ تنها استثنا اسکن میدانی بارکد/شاسی توسط
 *   ارزیاب «جهت احراز عدم تقلب» است.
 *
 * بنابراین این کارت یک فیلد ورود داده نیست، بلکه ابزار «تطبیق» است:
 *   • شاسی مرجع (از استعلام مرحله نخست) فقط‌خواندنی نمایش داده می‌شود.
 *   • کارشناس بارکد روی بدنه را اسکم می‌کند.
 *   • سامانه نتیجه‌ی تطبیق را اعلام و در پرونده ثبت می‌کند.
 * ============================================================================
 */

import React, { useState } from 'react';
import {
  ScanLine,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Loader2,
  Camera,
  Fingerprint,
  Info
} from 'lucide-react';
import { ClaimCase, FieldChassisVerification } from '../../types';
import { resolveChassis, recordFieldChassisScan } from '../../lib/chassisRegistry';

interface FieldChassisScanCardProps {
  claimCase: ClaimCase;
  expertId?: string;
  expertName?: string;
  onVerified: (verification: FieldChassisVerification) => void;
}

export const FieldChassisScanCard: React.FC<FieldChassisScanCardProps> = ({
  claimCase,
  expertId,
  expertName,
  onVerified
}) => {
  const resolved = resolveChassis(claimCase);
  const existing = claimCase.fieldChassisVerification;

  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<FieldChassisVerification | undefined>(existing);

  /**
   * شبیه‌سازی اسکن دوربینی بارکد VIN.
   * در نسخه‌ی عملیاتی اینجا خروجی کتابخانه‌ی بارکدخوان قرار می‌گیرد؛
   * مقدار پیش‌فرض عمداً برابر شاسی مرجع است تا مسیر «منطبق» قابل نمایش باشد.
   */
  const handleScan = (simulateMismatch = false) => {
    setIsScanning(true);
    setTimeout(() => {
      const scanned = simulateMismatch
        ? `${resolved.vin || 'IRN000000000000'}X`
        : resolved.vin || 'IRN998822110033';

      const verification = recordFieldChassisScan({
        claimCase,
        scannedVin: scanned,
        expertId,
        expertName
      });

      setResult(verification);
      setIsScanning(false);
      onVerified(verification);
    }, 1400);
  };

  const isMismatch = result?.antiFraudStatus === 'MISMATCH_ALERT';

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs">
      {/* سربرگ */}
      <div className="px-5 py-4 bg-gradient-to-l from-violet-50 via-indigo-50/50 to-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm shadow-violet-600/20">
            <Fingerprint className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm">
              احراز اصالت شاسی در محل (اسکن ضدتقلب)
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              تطبیق بارکد بدنه با شاسی استعلام‌شده — بدون نیاز به ورود مجدد داده
            </p>
          </div>
        </div>

        {result && (
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black border ${
              isMismatch
                ? 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {isMismatch ? 'مغایرت — هشدار تقلب' : 'اصالت تایید شد'}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4 text-xs">
        {/* شاسی مرجع — فقط‌خواندنی */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              شماره شاسی مرجع پرونده (قفل‌شده)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-600 font-bold">
              {resolved.sourceLabelFa}
            </span>
          </div>

          <div
            className="font-mono font-black text-base text-slate-900 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 tracking-wider"
            dir="ltr"
          >
            {resolved.vin || '—'}
          </div>

          <p className="text-[11px] text-slate-500 font-medium flex items-start gap-1.5 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              این مقدار در مرحله نخست پرونده استعلام شده و قابل ویرایش نیست. اسکن زیر صرفاً
              جهت احراز عدم تقلب انجام می‌شود و داده‌ی جدیدی ثبت نمی‌کند.
            </span>
          </p>
        </div>

        {/* نتیجه‌ی اسکن */}
        {result && (
          <div
            className={`rounded-2xl border p-4 space-y-2 ${
              isMismatch
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2 font-black">
              {isMismatch ? (
                <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
              ) : (
                <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
              )}
              <span>{isMismatch ? 'مغایرت شاسی شناسایی شد' : 'شاسی منطبق است'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
              <div className="bg-white/70 rounded-xl px-3 py-2 border border-current/20">
                <span className="block text-[10px] opacity-70 mb-0.5">اسکن‌شده در محل</span>
                <span className="font-mono" dir="ltr">
                  {result.scannedVin}
                </span>
              </div>
              <div className="bg-white/70 rounded-xl px-3 py-2 border border-current/20">
                <span className="block text-[10px] opacity-70 mb-0.5">مرجع استعلام</span>
                <span className="font-mono" dir="ltr">
                  {result.registeredVin || '—'}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-medium leading-relaxed">{result.note}</p>

            <p className="text-[10px] opacity-70 font-bold pt-1">
              ثبت توسط {result.verifiedByExpertName || 'کارشناس میدانی'} • {result.verifiedAt}
            </p>
          </div>
        )}

        {/* اقدام */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={() => handleScan(false)}
            disabled={isScanning}
            className="flex-1 py-3 rounded-2xl bg-violet-700 hover:bg-violet-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-xs shadow-md shadow-violet-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال اسکن بارکد شاسی…</span>
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4" />
                <span>{result ? 'اسکن مجدد بارکد شاسی' : 'اسکن بارکد شاسی با دوربین'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleScan(true)}
            disabled={isScanning}
            className="px-4 py-3 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-extrabold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            title="شبیه‌سازی حالت مغایرت جهت آزمودن مسیر هشدار ضدتقلب"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>تست حالت مغایرت</span>
          </button>
        </div>
      </div>
    </div>
  );
};
