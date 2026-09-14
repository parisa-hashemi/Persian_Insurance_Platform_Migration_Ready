/**
 * ============================================================================
 * مرجع واحد شماره شاسی (VIN) — جلوگیری از درخواست تکراری
 * ============================================================================
 *
 * الزام کارفرما (بند ۶):
 *   «شماره شاسی که در مرحله نخست پرونده خوانده یا اسکن شده، نباید مجدداً در
 *    مراحل بعدی درخواست شود، مگر این‌که صرفاً اسکن میدانی بارکد/شاسی توسط
 *    ارزیاب جهت احراز عدم تقلب انجام گیرد.»
 *
 * قاعده‌ی پیاده‌سازی‌شده:
 *   ۱. شاسی یک‌بار در مرحله‌ی نخست از «استعلام چهارگانه» استخراج می‌شود.
 *   ۲. هر مرحله‌ی بعدی فقط `resolveChassis()` را صدا می‌زند و مقدار را
 *      «فقط‌خواندنی» نمایش می‌دهد — هرگز ورودی جدید نمی‌گیرد.
 *   ۳. تنها استثنا: `recordFieldChassisScan()` که اسکن دوربینی بارکد توسط
 *      کارشناس میدانی است و هدفش تطبیق ضدتقلب است، نه ثبت مجدد داده.
 * ============================================================================
 */

import { ClaimCase, FieldChassisVerification, QuadrupleInquiries } from '../types';
import { getOrGenerateCaseQuadrupleInquiries } from './quadrupleInquiries';
import { normalizeDigits } from './contactPrivacy';

/** از کجا شاسی به دست آمده است. */
export type ChassisSource =
  | 'QUADRUPLE_INQUIRY'
  | 'CASE_RECORD'
  | 'FIELD_SCAN'
  | 'UNAVAILABLE';

export interface ResolvedChassis {
  /** شماره شاسی نهایی جهت نمایش (فقط‌خواندنی). */
  vin: string;
  source: ChassisSource;
  sourceLabelFa: string;
  /** اگر true باشد، هیچ فرمی نباید شاسی را دوباره از کاربر بپرسد. */
  isLocked: boolean;
  /** وضعیت احراز میدانی، در صورت انجام. */
  fieldVerification?: FieldChassisVerification;
}

const SOURCE_LABELS: Record<ChassisSource, string> = {
  QUADRUPLE_INQUIRY: 'استخراج‌شده از استعلامات چهارگانه (مرحله نخست)',
  CASE_RECORD: 'ثبت‌شده در پرونده (مرحله نخست)',
  FIELD_SCAN: 'اسکن بارکد میدانی توسط کارشناس',
  UNAVAILABLE: 'در دسترس نیست'
};

/** مقایسه‌ی مقاوم دو شاسی (بی‌توجه به حروف بزرگ/کوچک، فاصله و نوع ارقام). */
export function chassisEquals(a?: string | null, b?: string | null): boolean {
  const norm = (v?: string | null) =>
    normalizeDigits(String(v || ''))
      .toUpperCase()
      .replace(/[\s\-_]/g, '');
  const na = norm(a);
  const nb = norm(b);
  return Boolean(na) && na === nb;
}

/**
 * شماره شاسی طرف موردنظر را برمی‌گرداند.
 * این تنها تابعی است که کامپوننت‌ها باید برای گرفتن VIN صدا بزنند.
 */
export function resolveChassis(
  claimCase: ClaimCase,
  party: 'victim' | 'culprit' = 'victim'
): ResolvedChassis {
  const fieldVerification = claimCase.fieldChassisVerification;

  // ۱. مقدار ثبت‌شده در خود پرونده (مرحله نخست)
  const onRecord = party === 'victim' ? claimCase.victimVin : claimCase.culpritVin;
  if (onRecord) {
    return {
      vin: onRecord,
      source: 'CASE_RECORD',
      sourceLabelFa: SOURCE_LABELS.CASE_RECORD,
      isLocked: true,
      fieldVerification
    };
  }

  // ۲. استخراج از استعلامات چهارگانه
  const inquiries: QuadrupleInquiries = getOrGenerateCaseQuadrupleInquiries(claimCase);
  if (inquiries.chassisVin) {
    return {
      vin: inquiries.chassisVin,
      source: 'QUADRUPLE_INQUIRY',
      sourceLabelFa: SOURCE_LABELS.QUADRUPLE_INQUIRY,
      isLocked: true,
      fieldVerification
    };
  }

  // ۳. در نبود هر دو، اسکن میدانی (اگر انجام شده باشد)
  if (fieldVerification?.scannedVin) {
    return {
      vin: fieldVerification.scannedVin,
      source: 'FIELD_SCAN',
      sourceLabelFa: SOURCE_LABELS.FIELD_SCAN,
      isLocked: true,
      fieldVerification
    };
  }

  return {
    vin: '',
    source: 'UNAVAILABLE',
    sourceLabelFa: SOURCE_LABELS.UNAVAILABLE,
    isLocked: false,
    fieldVerification
  };
}

/**
 * آیا اجازه داریم شاسی را از کاربر بپرسیم؟
 * فقط وقتی هیچ منبعی وجود نداشته باشد — یعنی عملاً هرگز در مراحل بعدی.
 */
export function shouldRequestChassisInput(claimCase: ClaimCase): boolean {
  return !resolveChassis(claimCase).isLocked;
}

/**
 * ثبت اسکن میدانی بارکد شاسی توسط کارشناس (استثنای مجاز کارفرما).
 * این تابع مقدار ثبت‌شده را بازنویسی نمی‌کند؛ فقط نتیجه‌ی «تطبیق» را ثبت می‌کند
 * تا در صورت مغایرت، هشدار ضدتقلب صادر شود.
 */
export function recordFieldChassisScan(params: {
  claimCase: ClaimCase;
  scannedVin: string;
  expertId?: string;
  expertName?: string;
  method?: FieldChassisVerification['method'];
}): FieldChassisVerification {
  const { claimCase, scannedVin, expertId, expertName } = params;
  const registered = resolveChassis(claimCase).vin;
  const matches = chassisEquals(scannedVin, registered);

  return {
    verified: true,
    verifiedAt:
      new Date().toLocaleDateString('fa-IR') +
      ' ' +
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    scannedVin,
    registeredVin: registered,
    matchesRegisteredVin: matches,
    verifiedByExpertId: expertId,
    verifiedByExpertName: expertName,
    method: params.method || 'CAMERA_BARCODE_SCAN',
    antiFraudStatus: matches ? 'AUTHENTIC' : 'MISMATCH_ALERT',
    note: matches
      ? 'شاسی اسکن‌شده در محل با شاسی استعلام‌شده در مرحله نخست کاملاً منطبق است.'
      : 'هشدار ضدتقلب: شاسی اسکن‌شده در محل با شاسی ثبت‌شده در استعلام مغایرت دارد؛ پرونده نیازمند بررسی دستی است.'
  };
}
