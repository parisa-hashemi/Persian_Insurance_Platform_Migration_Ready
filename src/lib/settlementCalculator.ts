// ----------------------------------------------------------------
// تفکیک «برآورد خسارت فیزیکی» از «محاسبه مبلغ پرداختی»
//
// مرز مسئولیت‌ها:
//   • ارزیاب میدانی  → فقط برآورد فیزیکی: قطعات + اجرت (AssessorPhysicalEstimate)
//   • بیمه‌گر / Core → کسورات و رقم نهایی: فرانشیز، استهلاک، ماده ۱۰،
//     سقف تعهدات و تخفیف‌ها (InsurerSettlement)
//
// هیچ محاسبه کسورات یا رقم پرداختی نباید در لایه ارزیاب انجام شود.
// ----------------------------------------------------------------

/** برآورد ارزیاب — فقط خسارت فیزیکی، بدون هیچ کسوراتی */
export interface AssessorPhysicalEstimate {
  /** جمع قیمت قطعات (ریال) */
  partsTotal: number;
  /** جمع اجرت تعمیر، صافکاری و نقاشی (ریال) */
  laborTotal: number;
  /** ارزش داغی/اسقاط قطعات تعویضی (ریال) — کسر فیزیکی و در حیطه ارزیاب */
  salvageValue?: number;
  submittedBy?: string;
  submittedAt?: string;
  note?: string;
}

/** پارامترهای فنی و مالی که فقط بیمه‌گر/Core تعیین می‌کند */
export interface InsurerSettlementInput {
  /** درصد فرانشیز قراردادی */
  franchisePercent?: number;
  /** مبلغ ثابت فرانشیز (در صورت تعیین صریح) */
  franchiseAmount?: number;
  /** درصد استهلاک قطعات بر اساس سال ساخت */
  depreciationPercent?: number;
  /**
   * ماده ۱۰ — قاعده نسبی حق بیمه.
   * نسبت حق بیمه پرداخت‌شده به حق بیمه واقعی (۰ تا ۱). مقدار ۱ یعنی
   * بیمه‌نامه کامل و بدون کسر نسبی است.
   */
  article10Ratio?: number;
  article10Reason?: string;
  /** سقف تعهد مالی بیمه‌نامه مقصر (ریال) */
  policyCeiling: number;
  /** افت ارزش خودرو مصوب (ریال) */
  diminutionAmount?: number;
  /** تخفیفات یا مبالغ بخشوده‌شده (ریال) */
  discountAmount?: number;
  calculatedBy?: string;
}

export interface SettlementBreakdown {
  // --- ورودی لایه ارزیاب ---
  partsTotal: number;
  laborTotal: number;
  salvageValue: number;
  /** خسارت فیزیکی خالص = قطعات + اجرت − داغی */
  physicalDamageNet: number;

  // --- کسورات لایه بیمه‌گر ---
  depreciationPercent: number;
  depreciationAmount: number;
  franchisePercent: number;
  franchiseAmount: number;
  article10Ratio: number;
  article10Deduction: number;
  article10Reason: string | null;
  discountAmount: number;
  diminutionAmount: number;

  /** مطالبه کل پیش از اعمال سقف تعهد */
  totalClaimBeforeCeiling: number;
  policyCeiling: number;
  exceedsCeiling: boolean;
  /** سهم قابل پرداخت بیمه‌گر */
  insurerPayable: number;
  /** مازاد بر سقف — بدهی شخصی مقصر */
  culpritExcessDebt: number;

  /** ترتیب اعمال محاسبات جهت نمایش شفاف در پنل بیمه‌گر */
  steps: Array<{ label: string; amount: number; kind: 'BASE' | 'DEDUCTION' | 'ADDITION' | 'RESULT' }>;
  calculatedBy: string;
  calculatedAt: string;
}

const round = (n: number) => Math.max(0, Math.round(n));

/** جمع برآورد فیزیکی ارزیاب — تنها عددی که ارزیاب مجاز به ثبت آن است */
export function computePhysicalEstimate(estimate: AssessorPhysicalEstimate): number {
  const parts = Number(estimate.partsTotal) || 0;
  const labor = Number(estimate.laborTotal) || 0;
  const salvage = Number(estimate.salvageValue) || 0;
  return round(parts + labor - salvage);
}

/**
 * محاسبه رقم نهایی پرداختی — مسئولیت شرکت بیمه‌گر و سامانه واسط (Core).
 * ورودی این تابع، برآورد فیزیکی ارزیاب است و ارزیاب در خروجی آن نقشی ندارد.
 */
export function calculateInsurerSettlement(
  estimate: AssessorPhysicalEstimate,
  input: InsurerSettlementInput
): SettlementBreakdown {
  const partsTotal = Number(estimate.partsTotal) || 0;
  const laborTotal = Number(estimate.laborTotal) || 0;
  const salvageValue = Number(estimate.salvageValue) || 0;
  const physicalDamageNet = round(partsTotal + laborTotal - salvageValue);

  // ۱. استهلاک قطعات — بر مبنای سال ساخت خودرو، تعیین‌شده توسط بیمه‌گر
  const depreciationPercent = Number(input.depreciationPercent) || 0;
  const depreciationAmount = round((physicalDamageNet * depreciationPercent) / 100);

  const afterDepreciation = round(physicalDamageNet - depreciationAmount);

  // ۲. فرانشیز قراردادی
  const franchisePercent = Number(input.franchisePercent) || 0;
  const franchiseAmount =
    input.franchiseAmount !== undefined
      ? round(input.franchiseAmount)
      : round((afterDepreciation * franchisePercent) / 100);

  const afterFranchise = round(afterDepreciation - franchiseAmount);

  // ۳. افت ارزش خودرو (افزوده می‌شود)
  const diminutionAmount = round(input.diminutionAmount || 0);
  const withDiminution = round(afterFranchise + diminutionAmount);

  // ۴. ماده ۱۰ — قاعده نسبی حق بیمه
  const rawRatio = input.article10Ratio === undefined ? 1 : Number(input.article10Ratio);
  const article10Ratio = Math.min(1, Math.max(0, isNaN(rawRatio) ? 1 : rawRatio));
  const afterArticle10 = round(withDiminution * article10Ratio);
  const article10Deduction = round(withDiminution - afterArticle10);

  // ۵. تخفیفات / بخشودگی
  const discountAmount = round(input.discountAmount || 0);
  const totalClaimBeforeCeiling = round(afterArticle10 - discountAmount);

  // ۶. سقف تعهد بیمه‌نامه
  const policyCeiling = round(input.policyCeiling);
  const exceedsCeiling = totalClaimBeforeCeiling > policyCeiling;
  const insurerPayable = Math.min(totalClaimBeforeCeiling, policyCeiling);
  const culpritExcessDebt = round(totalClaimBeforeCeiling - policyCeiling);

  const now = new Date();

  const steps: SettlementBreakdown['steps'] = [
    { label: 'قطعات (برآورد ارزیاب)', amount: partsTotal, kind: 'BASE' },
    { label: 'اجرت تعمیر (برآورد ارزیاب)', amount: laborTotal, kind: 'BASE' },
    { label: 'کسر ارزش داغی', amount: salvageValue, kind: 'DEDUCTION' },
    { label: `استهلاک قطعات (${depreciationPercent.toLocaleString('fa-IR')}٪)`, amount: depreciationAmount, kind: 'DEDUCTION' },
    { label: 'فرانشیز قراردادی', amount: franchiseAmount, kind: 'DEDUCTION' },
    { label: 'افت ارزش خودرو', amount: diminutionAmount, kind: 'ADDITION' },
    {
      label: `ماده ۱۰ — قاعده نسبی حق بیمه (ضریب ${article10Ratio.toLocaleString('fa-IR')})`,
      amount: article10Deduction,
      kind: 'DEDUCTION'
    },
    { label: 'تخفیف / بخشودگی', amount: discountAmount, kind: 'DEDUCTION' },
    { label: 'مبلغ قابل پرداخت بیمه‌گر', amount: insurerPayable, kind: 'RESULT' }
  ];

  return {
    partsTotal,
    laborTotal,
    salvageValue,
    physicalDamageNet,
    depreciationPercent,
    depreciationAmount,
    franchisePercent,
    franchiseAmount,
    article10Ratio,
    article10Deduction,
    article10Reason: article10Ratio < 1 ? input.article10Reason || 'کسر نسبی به دلیل عدم تناسب حق بیمه پرداختی' : null,
    discountAmount,
    diminutionAmount,
    totalClaimBeforeCeiling,
    policyCeiling,
    exceedsCeiling,
    insurerPayable,
    culpritExcessDebt,
    steps,
    calculatedBy: input.calculatedBy || 'سامانه واسط بیمه‌گر (Core)',
    calculatedAt: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
  };
}

export const ASSESSOR_SCOPE_NOTICE =
  'ثبت برآورد خسارت فیزیکی (قطعات و اجرت) بر عهده ارزیاب است. محاسبه فرانشیز، استهلاک، ' +
  'ماده ۱۰ (قاعده نسبی حق بیمه)، سقف تعهدات و تخفیفات بر عهده شرکت بیمه‌گر و سامانه واسط ' +
  'است و در این پنل انجام نمی‌شود.';

export const INSURER_SCOPE_NOTICE =
  'کلیه کسورات فنی و مالی و تعیین رقم نهایی پرداختی در این لایه (بیمه‌گر / Core) محاسبه می‌شود؛ ' +
  'ورودی این محاسبات صرفاً برآورد فیزیکی ثبت‌شده توسط ارزیاب است.';
