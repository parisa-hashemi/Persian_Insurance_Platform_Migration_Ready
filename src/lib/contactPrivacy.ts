/**
 * ============================================================================
 * حریم خصوصی تماس — پنهان‌سازی شماره و مسیریابی تماس ابری واسط
 * ============================================================================
 *
 * الزام کارفرما (بند ۷):
 *   «برای جلوگیری از زدوبند و تبانی احتمالی میان بیمه‌گذار و ارزیاب، ارتباط
 *    تلفنی باید به‌صورت تماس ابری واسط (مشابه پلتفرم‌های تاکسی اینترنتی) باشد
 *    و شماره تلفن مستقیم طرفین نمایش داده نشود.»
 *
 * بنابراین هیچ کامپوننتی نباید مستقیماً `claimCase.victimPhone` را رندر کند.
 * همه‌ی نمایش‌ها باید از `maskPhone()` عبور کنند و برقراری تماس فقط از طریق
 * خط واسط (`buildProxyLine`) انجام شود.
 * ============================================================================
 */

/** نقش‌هایی که مجاز به دیدن شماره‌ی کامل هستند (نقش‌های ناظر/پشتیبانی). */
const PRIVILEGED_ROLES = ['crm', 'admin', 'senior_admin', 'support'] as const;
export type PrivilegedRole = (typeof PRIVILEGED_ROLES)[number];

/** تبدیل ارقام فارسی/عربی به لاتین تا ماسک‌گذاری روی هر دو حالت درست کار کند. */
export function normalizeDigits(input: string): string {
  if (!input) return '';
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  const ar = '٠١٢٣٤٥٦٧٨٩';
  return String(input).replace(/[۰-۹٠-٩]/g, (ch) => {
    const i = fa.indexOf(ch);
    if (i > -1) return String(i);
    const j = ar.indexOf(ch);
    return j > -1 ? String(j) : ch;
  });
}

/** تبدیل ارقام لاتین به فارسی جهت نمایش یکدست در رابط کاربری RTL. */
export function toPersianDigits(input: string | number): string {
  const fa = '۰۱۲۳۴۵۶۷۸۹';
  return String(input).replace(/[0-9]/g, (d) => fa[Number(d)]);
}

/**
 * ماسک‌گذاری شماره موبایل: سه رقم اول و دو رقم آخر باقی می‌ماند.
 * مثال: 09121234567  →  ۰۹۱۲•••••۶۷
 *
 * سه رقم ابتدایی برای تشخیص اپراتور و دو رقم انتهایی برای تایید شفاهی هویت
 * کافی است، بدون آنکه امکان تماس مستقیم فراهم شود.
 */
export function maskPhone(phone?: string | null, fallback = 'ثبت‌نشده'): string {
  const raw = normalizeDigits(phone || '').replace(/[^\d+]/g, '');
  if (!raw) return fallback;
  if (raw.length < 7) return toPersianDigits('•'.repeat(raw.length));

  const head = raw.slice(0, 4);
  const tail = raw.slice(-2);
  const hiddenCount = Math.max(3, raw.length - head.length - tail.length);

  return `${toPersianDigits(head)}${'•'.repeat(hiddenCount)}${toPersianDigits(tail)}`;
}

/**
 * آیا این نقش اجازه‌ی دیدن شماره‌ی کامل را دارد؟
 * ارزیاب، کارشناس میدانی و بازبین اجازه ندارند — دقیقاً همان چیزی که
 * کارفرما برای جلوگیری از تبانی خواسته است.
 */
export function canViewRawPhone(role?: string | null): boolean {
  if (!role) return false;
  const r = String(role).toLowerCase();
  return PRIVILEGED_ROLES.some((allowed) => r.includes(allowed));
}

/**
 * نمایش شماره بر اساس نقش بیننده: نقش‌های مجاز شماره‌ی کامل و بقیه ماسک می‌بینند.
 */
export function displayPhoneForRole(phone?: string | null, viewerRole?: string | null): string {
  if (canViewRawPhone(viewerRole)) {
    return toPersianDigits(normalizeDigits(phone || '')) || 'ثبت‌نشده';
  }
  return maskPhone(phone);
}

/** خط واسط ابری؛ شماره‌ی واقعی هیچ‌گاه به طرفین داده نمی‌شود. */
export const CLOUD_PROXY_LINE = '۰۲۱۹۱۰۰۲۲۳۳';

/**
 * ساخت خط واسط و کد اتصال برای یک تماس.
 * کد اتصال از شناسه‌ی پرونده مشتق می‌شود تا در گزارش‌های CRM قابل ردیابی باشد.
 */
export function buildProxyLine(caseId?: string): { line: string; pin: string } {
  const seed = normalizeDigits(caseId || '').replace(/\D/g, '') || String(Date.now());
  const pin = seed.slice(-4).padStart(4, '0');
  return { line: CLOUD_PROXY_LINE, pin: toPersianDigits(pin) };
}

/** متن استانداردی که کنار شماره‌ی ماسک‌شده نمایش داده می‌شود. */
export const MASKED_PHONE_NOTICE =
  'شماره تماس طرفین طبق سیاست ضدتبانی سامانه پنهان است. برقراری تماس صرفاً از طریق خط واسط ابری و با ضبط مکالمه انجام می‌شود.';
