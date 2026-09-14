/**
 * ============================================================================
 * احراز هویت معترض
 * ============================================================================
 *
 * اعتراض به ارزیابی یک اقدام حقوقی است و باید به «شخص حقیقی قابل ردیابی» نسبت
 * داده شود، نه صرفاً به یک نام نمایشی. این ماژول هویت معترض (نام، کد ملی، موبایل
 * و نقش) را از منابع موجود در پرونده و نشست کاربر استخراج و تثبیت می‌کند.
 *
 * ترتیب اولویت برای کد ملی:
 *   ۱. کد ملی نشست کاربر واردشده (معتبرترین، چون با OTP احراز شده)
 *   ۲. کد ملی ثبت‌شده‌ی همان طرف در پرونده (partyOne/partyTwo)
 *   ۳. کد ملی زیان‌دیده یا مقصر بر اساس نقش
 * ============================================================================
 */

import { ClaimCase, UserSession } from '../types';
import { normalizeDigits } from './contactPrivacy';

export interface ObjectorIdentity {
  name: string;
  nationalId?: string;
  phone?: string;
  role: string;
  party?: 'PARTY_ONE' | 'PARTY_TWO';
  /** آیا کد ملی با موفقیت احراز شد؟ در غیر این صورت باید از کاربر خواسته شود. */
  isIdentified: boolean;
}

/** اعتبارسنجی کد ملی ایرانی (الگوریتم وزنی رسمی سازمان ثبت احوال). */
export function isValidIranianNationalId(input?: string | null): boolean {
  const id = normalizeDigits(String(input || '')).replace(/\D/g, '');
  if (id.length !== 10) return false;
  // کدهای تکراری مثل ۰۰۰۰۰۰۰۰۰۰ معتبر نیستند
  if (/^(\d)\1{9}$/.test(id)) return false;

  const sum = id
    .slice(0, 9)
    .split('')
    .reduce((acc, digit, i) => acc + Number(digit) * (10 - i), 0);

  const remainder = sum % 11;
  const check = Number(id[9]);

  return remainder < 2 ? check === remainder : check === 11 - remainder;
}

/**
 * هویت طرفی که در حال ثبت اعتراض است را برمی‌گرداند.
 */
export function resolveObjectorIdentity(
  claimCase: ClaimCase,
  session: UserSession
): ObjectorIdentity {
  const anyCase = claimCase as any;

  // تشخیص اینکه کاربر جاری طرف اول است یا طرف دوم (بر اساس تطبیق موبایل)
  const sessionPhone = normalizeDigits(session.phone || '').replace(/\D/g, '');
  const partyOnePhone = normalizeDigits(anyCase.partyOnePhone || claimCase.victimPhone || '').replace(/\D/g, '');
  const isPartyTwo =
    Boolean(sessionPhone) &&
    Boolean(partyOnePhone) &&
    sessionPhone !== partyOnePhone;

  const party: 'PARTY_ONE' | 'PARTY_TWO' = isPartyTwo ? 'PARTY_TWO' : 'PARTY_ONE';

  const role =
    (party === 'PARTY_ONE' ? anyCase.partyOneRole : anyCase.partyTwoRole) ||
    (isPartyTwo ? 'مقصر' : 'زیان‌دیده');

  const name =
    session.name ||
    (party === 'PARTY_ONE'
      ? anyCase.partyOneName || claimCase.victimName
      : anyCase.partyTwoName || claimCase.culpritName) ||
    'معترض';

  const phone =
    session.phone ||
    (party === 'PARTY_ONE'
      ? anyCase.partyOnePhone || claimCase.victimPhone
      : anyCase.partyTwoPhone || claimCase.culpritPhone);

  // کد ملی: نشست ← فیلد طرف ← فیلد نقش
  const candidates = [
    session.nationalId,
    party === 'PARTY_ONE' ? anyCase.partyOneNationalId : anyCase.partyTwoNationalId,
    role === 'مقصر' ? claimCase.culpritNationalId : claimCase.victimNationalId
  ];

  const nationalId = candidates
    .map((c) => (c ? normalizeDigits(String(c)).replace(/\D/g, '') : ''))
    .find((c) => c.length === 10);

  return {
    name,
    nationalId: nationalId || undefined,
    phone: phone || undefined,
    role,
    party,
    isIdentified: Boolean(nationalId)
  };
}

/** ساخت رکورد تثبیت‌شده‌ی اعتراض جهت درج در پرونده. */
export function buildObjectionRecord(
  identity: ObjectorIdentity,
  stage: number,
  reason?: string
) {
  return {
    name: identity.name,
    nationalId: identity.nationalId,
    phone: identity.phone,
    role: identity.role,
    party: identity.party,
    stage,
    filedAt:
      new Date().toLocaleDateString('fa-IR') +
      ' ' +
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    reason
  };
}

/** برچسب نمایشی کوتاه برای کارتابل‌ها: «نام (کد ملی)». */
export function formatObjectorLabel(objector?: {
  name?: string;
  nationalId?: string;
  role?: string;
}): string {
  if (!objector?.name) return 'ثبت‌نشده';
  const parts = [objector.name];
  if (objector.role) parts.push(`(${objector.role})`);
  if (objector.nationalId) parts.push(`— کد ملی ${objector.nationalId}`);
  return parts.join(' ');
}
