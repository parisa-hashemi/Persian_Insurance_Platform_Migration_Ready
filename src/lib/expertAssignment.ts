// ----------------------------------------------------------------
// تخصیص کارشناس بر اساس موقعیت مکانی، سطح‌بندی اختیارات و ارجاع مجدد
//
// اصل حاکم: انتخاب کارشناس هرگز در اختیار بیمه‌گذار نیست. سامانه بر مبنای
// نزدیک‌ترین کارشناس فعالِ دارای اختیار کافی، ارجاع را انجام می‌دهد.
// ----------------------------------------------------------------

import { StaffMember } from '../types';
import { INSURANCE_BRANCHES } from '../data/bodyInsuranceData';
import { INITIAL_SPECIALIST_EXPERTS } from '../data/mockData';

/** سقف اختیار پیش‌فرض کارشناس اولیه (تومان) */
export const PRIMARY_EXPERT_CEILING_TOMAN = 100_000_000;

/** همان سقف به ریال — واحد ذخیره‌سازی مبالغ در سامانه */
export const PRIMARY_EXPERT_CEILING_RIAL = PRIMARY_EXPERT_CEILING_TOMAN * 10;

export const SPECIALIST_UNIT_LABEL = 'واحد کارشناسی تخصصی';

/** حداکثر پرونده فعال هم‌زمان برای هر کارشناس میدانی */
export const MAX_ACTIVE_CASES_PER_EXPERT = 5;

export type AssignmentMethod =
  | 'GPS_AUTO'
  | 'MANUAL_REASSIGN'
  | 'SPECIALIST_ESCALATION'
  | 'FALLBACK_NO_GEO';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** فاصله دایره بزرگ بین دو نقطه جغرافیایی (کیلومتر) */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * موقعیت کارشناس: مختصات ثبت‌شده خودِ کارشناس، در غیر این صورت مختصات
 * شعبه/مرکز خسارت محل خدمت او. هیچ مختصات ساختگی تولید نمی‌شود.
 */
export function resolveExpertLocation(expert: StaffMember): GeoPoint | null {
  if (expert.coordinates && typeof expert.coordinates.lat === 'number') {
    return { lat: expert.coordinates.lat, lng: expert.coordinates.lng };
  }
  if (expert.branchId) {
    const branch = INSURANCE_BRANCHES.find((b) => b.id === expert.branchId);
    if (branch?.coordinates) {
      return { lat: branch.coordinates.lat, lng: branch.coordinates.lng };
    }
  }
  return null;
}

/** سقف اختیار کارشناس به تومان (پیش‌فرض: سقف کارشناس اولیه) */
export function getExpertCeilingToman(expert: StaffMember): number {
  if (typeof expert.maxApprovalCeiling === 'number' && expert.maxApprovalCeiling > 0) {
    // مقادیر ذخیره‌شده در سامانه به ریال است
    return Math.round(expert.maxApprovalCeiling / 10);
  }
  return PRIMARY_EXPERT_CEILING_TOMAN;
}

/** آیا کارشناس در دسترس و قابل ارجاع است؟ */
export function isExpertAvailable(expert: StaffMember): boolean {
  if (expert.active === false) return false;
  if (expert.status === 'INACTIVE' || expert.status === 'BUSY') return false;
  if ((expert.activeCases ?? 0) >= MAX_ACTIVE_CASES_PER_EXPERT) return false;
  return true;
}

export interface SpecialistCheck {
  required: boolean;
  ceilingToman: number;
  reason: string | null;
}

/**
 * سطح‌بندی کارشناسی: اگر برآورد خسارت از سقف اختیار کارشناس اولیه فراتر رود،
 * پرونده باید به واحد کارشناسی تخصصی ارجاع شود.
 */
export function checkSpecialistRequirement(
  estimatedDamageToman: number,
  expert?: StaffMember | null
): SpecialistCheck {
  const ceiling = expert ? getExpertCeilingToman(expert) : PRIMARY_EXPERT_CEILING_TOMAN;
  if (estimatedDamageToman > ceiling) {
    return {
      required: true,
      ceilingToman: ceiling,
      reason:
        `برآورد خسارت (${estimatedDamageToman.toLocaleString('fa-IR')} تومان) از سقف اختیار کارشناس ` +
        `(${ceiling.toLocaleString('fa-IR')} تومان) فراتر است و پرونده باید به ${SPECIALIST_UNIT_LABEL} ارجاع شود.`
    };
  }
  return { required: false, ceilingToman: ceiling, reason: null };
}

/**
 * تعیین کارشناس تخصصی بر اساس شرکت بیمه مربوطه
 */
export function resolveSpecialistExpertForCase(companyKey?: string): StaffMember {
  const key = (companyKey || 'dana').toLowerCase();
  const list = INITIAL_SPECIALIST_EXPERTS[key] || INITIAL_SPECIALIST_EXPERTS['dana'] || [];
  return list[0] || {
    id: 'd2',
    name: 'مهندس فاطمه احمدی',
    role: 'کارشناس تخصصی و ارشد خسارت‌های سنگین',
    phone: '09121001002',
    nationalId: '0022222222',
    company: key,
    maxApprovalCeiling: 10_000_000_000,
    expertise: 'ارزیابی تخصصی خسارات بالای ۱۰۰ میلیون تومان'
  };
}

export interface RankedExpert {
  expert: StaffMember;
  /** فاصله تا محل حادثه (کیلومتر)؛ در نبود مختصات، null */
  distanceKm: number | null;
  activeCases: number;
  ceilingToman: number;
  /** آیا اختیار کافی برای این مبلغ خسارت دارد؟ */
  withinAuthority: boolean;
  eligible: boolean;
  ineligibleReason: string | null;
}

export interface RankExpertsInput {
  experts: StaffMember[];
  /** محل وقوع حادثه */
  accidentLocation?: GeoPoint | null;
  estimatedDamageToman?: number;
  /** کارشناسانی که قبلاً مأموریت را رد کرده‌اند یا نباید مجدداً انتخاب شوند */
  excludeIds?: string[];
}

/**
 * رتبه‌بندی کارشناسان: ابتدا نزدیک‌ترین، سپس کم‌بارترین، سپس بالاترین امتیاز.
 * خروجی شامل کارشناسان غیرواجد شرایط هم هست تا پنل بتواند دلیل را نمایش دهد.
 */
export function rankExpertsByProximity(input: RankExpertsInput): RankedExpert[] {
  const { experts, accidentLocation, estimatedDamageToman = 0, excludeIds = [] } = input;

  const ranked: RankedExpert[] = experts.map((expert) => {
    const loc = resolveExpertLocation(expert);
    const distanceKm =
      accidentLocation && loc ? Number(haversineDistanceKm(accidentLocation, loc).toFixed(2)) : null;
    const ceilingToman = getExpertCeilingToman(expert);
    const withinAuthority = estimatedDamageToman <= ceilingToman;

    let ineligibleReason: string | null = null;
    if (excludeIds.includes(expert.id)) {
      ineligibleReason = 'این کارشناس قبلاً مأموریت را رد کرده یا از فهرست ارجاع کنار گذاشته شده است.';
    } else if (!isExpertAvailable(expert)) {
      ineligibleReason =
        (expert.activeCases ?? 0) >= MAX_ACTIVE_CASES_PER_EXPERT
          ? 'ظرفیت پرونده‌های فعال کارشناس تکمیل است.'
          : 'کارشناس در حال حاضر در دسترس نیست.';
    } else if (!withinAuthority) {
      ineligibleReason = `مبلغ خسارت از سقف اختیار این کارشناس (${ceilingToman.toLocaleString('fa-IR')} تومان) بیشتر است.`;
    }

    return {
      expert,
      distanceKm,
      activeCases: expert.activeCases ?? 0,
      ceilingToman,
      withinAuthority,
      eligible: ineligibleReason === null,
      ineligibleReason
    };
  });

  return ranked.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    // نزدیک‌ترین کارشناس در اولویت است
    if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    if (a.distanceKm === null && b.distanceKm !== null) return 1;
    if (b.distanceKm === null && a.distanceKm !== null) return -1;
    // در فاصله برابر، کارشناس با بار کاری کمتر
    if (a.activeCases !== b.activeCases) return a.activeCases - b.activeCases;
    // سپس امتیاز عملکرد بالاتر
    return (b.expert.rating ?? 0) - (a.expert.rating ?? 0);
  });
}

export interface AssignmentDecision {
  assigned: RankedExpert | null;
  method: AssignmentMethod;
  /** فهرست رتبه‌بندی‌شده جهت نمایش در پنل و ارجاع مجدد */
  candidates: RankedExpert[];
  specialist: SpecialistCheck;
  note: string;
}

/**
 * تصمیم ارجاع خودکار: نزدیک‌ترین کارشناسِ واجد شرایط.
 * این تابع تنها مسیر مجاز تخصیص اولیه است و ورودی انتخاب کاربر را نمی‌پذیرد.
 */
export function assignNearestExpert(input: RankExpertsInput): AssignmentDecision {
  const { accidentLocation, estimatedDamageToman = 0 } = input;
  const candidates = rankExpertsByProximity(input);
  const eligible = candidates.filter((c) => c.eligible);
  const specialist = checkSpecialistRequirement(estimatedDamageToman, eligible[0]?.expert);

  if (eligible.length === 0) {
    return {
      assigned: null,
      method: specialist.required ? 'SPECIALIST_ESCALATION' : 'GPS_AUTO',
      candidates,
      specialist,
      note: specialist.required
        ? `کارشناس واجد شرایط در دسترس نیست و مبلغ خسارت نیازمند ${SPECIALIST_UNIT_LABEL} است.`
        : 'کارشناس در دسترس برای ارجاع خودکار یافت نشد؛ ارجاع دستی توسط پنل بیمه‌گر لازم است.'
    };
  }

  const winner = eligible[0];
  const hasGeo = winner.distanceKm !== null;
  const method: AssignmentMethod = hasGeo ? 'GPS_AUTO' : 'FALLBACK_NO_GEO';

  const note = hasGeo
    ? `ارجاع خودکار بر اساس موقعیت مکانی: نزدیک‌ترین کارشناس فعال (${winner.expert.name}) در فاصله ${winner.distanceKm} کیلومتری محل حادثه انتخاب شد.`
    : `ارجاع خودکار بر اساس بار کاری: مختصات محل حادثه در دسترس نبود، کارشناس ${winner.expert.name} با کمترین پرونده فعال انتخاب شد.`;

  return { assigned: winner, method, candidates, specialist, note };
}

export interface ReassignmentInput extends RankExpertsInput {
  /** کارشناس فعلی که پرونده از او گرفته می‌شود */
  currentExpertId?: string | null;
  reason: string;
}

/**
 * ارجاع مجدد پرونده به کارشناس دیگر (رد مأموریت، عدم دسترسی، درخواست تغییر).
 * کارشناس فعلی به‌طور خودکار از فهرست نامزدها کنار گذاشته می‌شود.
 */
export function reassignToNextExpert(input: ReassignmentInput): AssignmentDecision {
  const excludeIds = [...(input.excludeIds || [])];
  if (input.currentExpertId) excludeIds.push(input.currentExpertId);

  const decision = assignNearestExpert({ ...input, excludeIds });
  return {
    ...decision,
    method: decision.assigned ? 'MANUAL_REASSIGN' : decision.method,
    note: decision.assigned
      ? `ارجاع مجدد (${input.reason}): پرونده به ${decision.assigned.expert.name} منتقل شد.`
      : `ارجاع مجدد ناموفق (${input.reason}): کارشناس جایگزین واجد شرایط یافت نشد.`
  };
}

/** رکورد ارجاع جهت درج در تاریخچه پرونده */
export interface AssignmentRecord {
  expertId: string | null;
  expertName: string | null;
  method: AssignmentMethod;
  distanceKm: number | null;
  reason: string;
  at: string;
}

export function buildAssignmentRecord(
  decision: AssignmentDecision,
  reason: string
): AssignmentRecord {
  const now = new Date();
  return {
    expertId: decision.assigned?.expert.id ?? null,
    expertName: decision.assigned?.expert.name ?? null,
    method: decision.method,
    distanceKm: decision.assigned?.distanceKm ?? null,
    reason,
    at: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
  };
}
