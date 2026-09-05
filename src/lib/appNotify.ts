/**
 * کاراینشو — سیستم اعلان سراسری داخل برنامه
 * جایگزین کامل alert() و confirm() مرورگر: همه پیام‌ها به صورت توست‌های
 * زیبا و هماهنگ با طراحی سامانه، داخل خود برنامه نمایش داده می‌شوند.
 */

export type AppNotifyType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotifyDetail {
  id: string;
  message: string;
  type: AppNotifyType;
}

export const APP_NOTIFY_EVENT = 'karinsho:notify';
export const APP_CONFIRM_EVENT = 'karinsho:confirm';

/** تشخیص خودکار نوع پیام از روی متن فارسی (وقتی نوع صریح داده نشود) */
const inferType = (message: string): AppNotifyType => {
  if (/موفقیت|ثبت شد|ارسال شد|انجام شد|ذخیره شد|منتقل شد|تایید گردید|درج شد/.test(message)) return 'success';
  if (/مسدود|امکان.*(وجود ندارد|نیست)|یافت نشد|الزامی|رد شده|خطا|ناموفق|مجاز نمی/.test(message)) return 'error';
  if (/لطفاً|توجه|هشدار/.test(message)) return 'warning';
  return 'info';
};

/** نمایش اعلان داخل برنامه (جایگزین alert مرورگر) */
export const notifyApp = (message: string, type?: AppNotifyType) => {
  if (typeof window === 'undefined') return;
  const detail: AppNotifyDetail = {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    type: type || inferType(message)
  };
  window.dispatchEvent(new CustomEvent(APP_NOTIFY_EVENT, { detail }));
};

export interface AppConfirmDetail {
  id: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  resolve: (ok: boolean) => void;
}

/** تاییدیه داخل برنامه (جایگزین confirm مرورگر) — Promise<boolean> */
export const confirmApp = (
  message: string,
  opts?: { confirmLabel?: string; cancelLabel?: string }
): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const detail: AppConfirmDetail = {
      id: `cfm-${Date.now()}`,
      message,
      confirmLabel: opts?.confirmLabel,
      cancelLabel: opts?.cancelLabel,
      resolve
    };
    window.dispatchEvent(new CustomEvent(APP_CONFIRM_EVENT, { detail }));
  });
};
