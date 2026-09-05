/**
 * کاراینشو — میزبان سراسری اعلان‌ها و تاییدیه‌های داخل برنامه
 * یک بار در ریشه App مونت می‌شود؛ توست‌ها بالا-وسط و تاییدیه‌ها به‌صورت مودال
 * با طراحی روشن و هماهنگ با سامانه نمایش داده می‌شوند.
 */

import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, HelpCircle } from 'lucide-react';
import {
  APP_NOTIFY_EVENT,
  APP_CONFIRM_EVENT,
  AppNotifyDetail,
  AppConfirmDetail
} from '../lib/appNotify';

const TOAST_LIFETIME_MS = 6000;

const typeStyles: Record<
  AppNotifyDetail['type'],
  { wrap: string; icon: React.ReactNode; bar: string }
> = {
  success: {
    wrap: 'bg-white border-emerald-300 text-emerald-900 shadow-emerald-200/60',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    bar: 'bg-emerald-500'
  },
  error: {
    wrap: 'bg-white border-rose-300 text-rose-900 shadow-rose-200/60',
    icon: <XCircle className="w-5 h-5 text-rose-600" />,
    bar: 'bg-rose-500'
  },
  warning: {
    wrap: 'bg-white border-amber-300 text-amber-950 shadow-amber-200/60',
    icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    bar: 'bg-amber-400'
  },
  info: {
    wrap: 'bg-white border-blue-300 text-blue-950 shadow-blue-200/60',
    icon: <Info className="w-5 h-5 text-blue-600" />,
    bar: 'bg-blue-500'
  }
};

export const AppToastHost: React.FC = () => {
  const [toasts, setToasts] = useState<AppNotifyDetail[]>([]);
  const [confirmReq, setConfirmReq] = useState<AppConfirmDetail | null>(null);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const onNotify = (e: Event) => {
      const detail = (e as CustomEvent<AppNotifyDetail>).detail;
      if (!detail?.message) return;
      setToasts((prev) => [...prev.slice(-3), detail]); // حداکثر ۴ توست همزمان
      timersRef.current[detail.id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
        delete timersRef.current[detail.id];
      }, TOAST_LIFETIME_MS);
    };

    const onConfirm = (e: Event) => {
      const detail = (e as CustomEvent<AppConfirmDetail>).detail;
      if (!detail?.message) return;
      setConfirmReq((prev) => {
        // اگر تاییدیه قبلی باز است، آن را لغو کن
        if (prev) prev.resolve(false);
        return detail;
      });
    };

    window.addEventListener(APP_NOTIFY_EVENT, onNotify);
    window.addEventListener(APP_CONFIRM_EVENT, onConfirm);
    return () => {
      window.removeEventListener(APP_NOTIFY_EVENT, onNotify);
      window.removeEventListener(APP_CONFIRM_EVENT, onConfirm);
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  };

  const answerConfirm = (ok: boolean) => {
    if (!confirmReq) return;
    confirmReq.resolve(ok);
    setConfirmReq(null);
  };

  return (
    <>
      {/* ===== توست‌های اعلان (بالا-وسط) ===== */}
      {toasts.length > 0 && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[120] w-[min(94vw,520px)] space-y-2 pointer-events-none"
          dir="rtl"
          aria-live="polite"
        >
          {toasts.map((t) => {
            const st = typeStyles[t.type];
            return (
              <div
                key={t.id}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-lg p-3.5 pr-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-3 ${st.wrap}`}
                role="status"
              >
                <span className={`absolute right-0 top-0 bottom-0 w-1.5 ${st.bar}`} />
                <span className="shrink-0 mt-0.5">{st.icon}</span>
                <p className="flex-1 text-xs font-bold leading-relaxed">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  title="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== مودال تاییدیه داخل برنامه ===== */}
      {confirmReq && (
        <div
          className="fixed inset-0 z-[130] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in"
          dir="rtl"
          onClick={() => answerConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl border border-blue-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95"
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 pt-0.5">
                <h4 className="font-black text-sm text-slate-900">نیاز به تایید شما</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{confirmReq.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => answerConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                {confirmReq.cancelLabel || 'انصراف'}
              </button>
              <button
                type="button"
                onClick={() => answerConfirm(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md shadow-blue-300/50 transition-all active:scale-95"
              >
                {confirmReq.confirmLabel || 'تایید و ادامه'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
