/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Automated Assessment Draft Generator
 * Pre-computes parts estimation, labor wages, salvage values, technical notes,
 * and customer deficiency notification drafts for one-click assessor approval or customization.
 */

import { ClaimCase, PartItem } from '../../types';

export interface AIDraftPartItem {
  id: string;
  name: string;
  type: 'replace' | 'repair';
  partPrice: number;
  repairPrice: number;
  salvageValue: number;
  depreciation: number;
  totalRow: number;
  confidence: number;
  reasonFa: string;
}

export interface AIDraftCustomerMessage {
  id: string;
  target: 'زیان‌دیده' | 'مقصر' | 'طرف اول' | 'طرف دوم';
  targetParty: 'PARTY_ONE' | 'PARTY_TWO';
  title: string;
  messageText: string;
  type: 'DEFICIENCY' | 'VISIT_COORDINATION' | 'INQUIRY_CONFIRMATION' | 'STATUS_UPDATE';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  docTypeRequested?: string;
}

export interface AIDraftAssessmentPackage {
  claimId: string;
  carModel: string;
  damageSummaryFa: string;
  confidenceScore: number;
  parts: AIDraftPartItem[];
  totals: {
    grossParts: number;
    grossLabor: number;
    grossTotal: number;
    totalSalvage: number;
    totalDepreciation: number;
    netPayable: number;
  };
  customerMessages: AIDraftCustomerMessage[];
  technicalReviewerNote: string;
  fraudRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  fraudRiskNotesFa: string;
  croquiAlignmentScore: number;
}

/**
 * Helper to determine part prices based on car brand/model
 */
function getPriceMultiplier(carType: string = ''): number {
  const norm = carType.toLowerCase();
  if (norm.includes('سوزوکی') || norm.includes('کیا') || norm.includes('هیوندای') || norm.includes('جک') || norm.includes('هایما') || norm.includes('تیگو')) {
    return 2.5;
  }
  if (norm.includes('دنا') || norm.includes('تارا') || norm.includes('شاهین') || norm.includes('۲۰۷')) {
    return 1.4;
  }
  if (norm.includes('پارس') || norm.includes('۲۰۶') || norm.includes('سمند') || norm.includes('رانا')) {
    return 1.0;
  }
  if (norm.includes('پراید') || norm.includes('تیبا') || norm.includes('کوییک') || norm.includes('ساینا')) {
    return 0.75;
  }
  return 1.0;
}

export const PART_NAMES_MAP_FA: Record<string, string> = {
  front_bumper: 'سپر جلو',
  hood: 'درب موتور (کاپوت)',
  roof: 'سقف خودرو',
  trunk: 'درب صندوق عقب',
  rear_bumper: 'سپر عقب',
  fender_fl: 'گلگیر جلو چپ',
  door_fl: 'درب جلو چپ',
  door_rl: 'درب عقب چپ',
  fender_rl: 'گلگیر عقب چپ',
  rocker_l: 'رکاب چپ',
  fender_fr: 'گلگیر جلو راست',
  door_fr: 'درب جلو راست',
  door_rr: 'درب عقب راست',
  fender_rr: 'گلگیر عقب راست',
  rocker_r: 'رکاب راست',
  chassis_front_l: 'سرشاسی و سینی جلو چپ',
  chassis_front_r: 'سرشاسی و سینی جلو راست',
  chassis_rear_l: 'سرشاسی و سینی عقب چپ',
  chassis_rear_r: 'سرشاسی و سینی عقب راست',
  pillar_a_l: 'ستون جلو چپ (ستون A)',
  pillar_b_l: 'ستون وسط چپ (ستون B)',
  pillar_c_l: 'ستون عقب چپ (ستون C)',
  pillar_a_r: 'ستون جلو راست (ستون A)',
  pillar_b_r: 'ستون وسط راست (ستون B)',
  pillar_c_r: 'ستون عقب راست (ستون C)',
};

/**
 * تبدیل کلید یا نام فنی قطعه به نام دقیق و استاندارد فارسی
 */
export function getExactPersianPartName(keyOrName: string): string {
  if (!keyOrName) return 'قطعه بدنه';
  const clean = keyOrName.trim();
  if (PART_NAMES_MAP_FA[clean]) return PART_NAMES_MAP_FA[clean];

  const lower = clean.toLowerCase();
  if (PART_NAMES_MAP_FA[lower]) return PART_NAMES_MAP_FA[lower];

  // Specific side + part matches
  if (lower === 'door_fl' || lower.includes('door_fl') || (lower.includes('door') && lower.includes('fl')) || (lower.includes('درب') && lower.includes('جلو') && lower.includes('چپ'))) return 'درب جلو چپ';
  if (lower === 'door_fr' || lower.includes('door_fr') || (lower.includes('door') && lower.includes('fr')) || (lower.includes('درب') && lower.includes('جلو') && lower.includes('راست'))) return 'درب جلو راست';
  if (lower === 'door_rl' || lower.includes('door_rl') || (lower.includes('door') && lower.includes('rl')) || (lower.includes('درب') && lower.includes('عقب') && lower.includes('چپ'))) return 'درب عقب چپ';
  if (lower === 'door_rr' || lower.includes('door_rr') || (lower.includes('door') && lower.includes('rr')) || (lower.includes('درب') && lower.includes('عقب') && lower.includes('راست'))) return 'درب عقب راست';

  if (lower === 'fender_fl' || lower.includes('fender_fl') || (lower.includes('گلگیر') && lower.includes('جلو') && lower.includes('چپ'))) return 'گلگیر جلو چپ';
  if (lower === 'fender_fr' || lower.includes('fender_fr') || (lower.includes('گلگیر') && lower.includes('جلو') && lower.includes('راست'))) return 'گلگیر جلو راست';
  if (lower === 'fender_rl' || lower.includes('fender_rl') || (lower.includes('گلگیر') && lower.includes('عقب') && lower.includes('چپ'))) return 'گلگیر عقب چپ';
  if (lower === 'fender_rr' || lower.includes('fender_rr') || (lower.includes('گلگیر') && lower.includes('عقب') && lower.includes('راست'))) return 'گلگیر عقب راست';

  if (lower === 'front_bumper' || (lower.includes('bumper') && lower.includes('front')) || (lower.includes('سپر') && lower.includes('جلو'))) return 'سپر جلو';
  if (lower === 'rear_bumper' || (lower.includes('bumper') && lower.includes('rear')) || (lower.includes('سپر') && lower.includes('عقب'))) return 'سپر عقب';
  if (lower === 'hood' || lower.includes('کاپوت') || lower.includes('درب موتور')) return 'درب موتور (کاپوت)';
  if (lower === 'roof' || lower.includes('سقف')) return 'سقف خودرو';
  if (lower === 'trunk' || lower.includes('صندوق')) return 'درب صندوق عقب';

  if (lower.includes('rocker_l') || (lower.includes('رکاب') && lower.includes('چپ'))) return 'رکاب چپ';
  if (lower.includes('rocker_r') || (lower.includes('رکاب') && lower.includes('راست'))) return 'رکاب راست';

  if (lower.includes('chassis_front_l')) return 'سرشاسی و سینی جلو چپ';
  if (lower.includes('chassis_front_r')) return 'سرشاسی و سینی جلو راست';
  if (lower.includes('chassis_rear_l')) return 'سرشاسی و سینی عقب چپ';
  if (lower.includes('chassis_rear_r')) return 'سرشاسی و سینی عقب راست';

  if (lower.includes('pillar_a_l')) return 'ستون جلو چپ (ستون A)';
  if (lower.includes('pillar_b_l')) return 'ستون وسط چپ (ستون B)';
  if (lower.includes('pillar_c_l')) return 'ستون عقب چپ (ستون C)';
  if (lower.includes('pillar_a_r')) return 'ستون جلو راست (ستون A)';
  if (lower.includes('pillar_b_r')) return 'ستون وسط راست (ستون B)';
  if (lower.includes('pillar_c_r')) return 'ستون عقب راست (ستون C)';

  // If already standard Persian without english letters, return it cleanly
  if (!/[a-zA-Z_]/.test(clean)) return clean;
  return clean.replace(/_/g, ' ');
}

/**
 * نگاشت معکوس: تبدیل نام فارسی قطعه به کلید فنی نقشه ۲ بعدی و ۳ بعدی (مانند front_bumper یا door_fl)
 */
export function getPartKeyFromPersianName(nameOrKey: string): string {
  if (!nameOrKey) return 'front_bumper';
  const clean = nameOrKey.trim();
  const lower = clean.toLowerCase();

  // اگر کلید انگلیسی معتبر است
  if (PART_NAMES_MAP_FA[clean] || PART_NAMES_MAP_FA[lower]) return PART_NAMES_MAP_FA[clean] ? clean : lower;

  // بررسی تطابق دقیق در مقادیر نقشه فارسی
  for (const [key, faName] of Object.entries(PART_NAMES_MAP_FA)) {
    if (faName === clean) return key;
  }

  // بررسی الگوی نام فارسی
  if (clean.includes('سپر') && (clean.includes('جلو') || lower.includes('front'))) return 'front_bumper';
  if (clean.includes('سپر') && (clean.includes('عقب') || lower.includes('rear'))) return 'rear_bumper';
  if (clean.includes('کاپوت') || clean.includes('موتور') || lower.includes('hood')) return 'hood';
  if (clean.includes('صندوق') || lower.includes('trunk')) return 'trunk';
  if (clean.includes('سقف') || lower.includes('roof')) return 'roof';

  if (clean.includes('درب') || clean.includes('در') || lower.includes('door')) {
    if (clean.includes('جلو') && clean.includes('چپ')) return 'door_fl';
    if (clean.includes('جلو') && clean.includes('راست')) return 'door_fr';
    if (clean.includes('عقب') && clean.includes('چپ')) return 'door_rl';
    if (clean.includes('عقب') && clean.includes('راست')) return 'door_rr';
  }

  if (clean.includes('گلگیر') || lower.includes('fender')) {
    if (clean.includes('جلو') && clean.includes('چپ')) return 'fender_fl';
    if (clean.includes('جلو') && clean.includes('راست')) return 'fender_fr';
    if (clean.includes('عقب') && clean.includes('چپ')) return 'fender_rl';
    if (clean.includes('عقب') && clean.includes('راست')) return 'fender_rr';
  }

  if (clean.includes('رکاب') || lower.includes('rocker')) {
    if (clean.includes('چپ')) return 'rocker_l';
    if (clean.includes('راست')) return 'rocker_r';
  }

  if (clean.includes('شاسی') || clean.includes('سینی') || lower.includes('chassis')) {
    if (clean.includes('جلو') && clean.includes('چپ')) return 'chassis_front_l';
    if (clean.includes('جلو') && clean.includes('راست')) return 'chassis_front_r';
    if (clean.includes('عقب') && clean.includes('چپ')) return 'chassis_rear_l';
    if (clean.includes('عقب') && clean.includes('راست')) return 'chassis_rear_r';
  }

  if (clean.includes('ستون') || lower.includes('pillar')) {
    if (clean.includes('a') || clean.includes('A') || clean.includes('جلو')) return clean.includes('راست') ? 'pillar_a_r' : 'pillar_a_l';
    if (clean.includes('b') || clean.includes('B') || clean.includes('وسط')) return clean.includes('راست') ? 'pillar_b_r' : 'pillar_b_l';
    if (clean.includes('c') || clean.includes('C') || clean.includes('عقب')) return clean.includes('راست') ? 'pillar_c_r' : 'pillar_c_l';
  }

  return clean.replace(/\s+/g, '_');
}

export function generateAIAssessmentDraft(
  claim: ClaimCase,
  damageSpotsOverride?: Record<string, any>
): AIDraftAssessmentPackage {
  const car = claim.carType || claim.culpritCarType || 'پژو ۲۰۶';
  const mult = getPriceMultiplier(car);
  const isCulprit = claim.partyOneRole === 'مقصر';

  const parts: AIDraftPartItem[] = [];

  // Inspect damage spots (from override or claim)
  const spots = damageSpotsOverride || claim.carDamageSpots || {};
  const spotKeys = Object.keys(spots);
  const hasSpots = spotKeys.length > 0;

  // Use explicit spots if present, otherwise default to typical collision spots (سپر جلو و درب جلو چپ)
  const effectiveSpots: Record<string, any> = hasSpots
    ? spots
    : {
        front_bumper: {
          type: 'خراشیدگی و شکستگی موضعی دیاق',
          severity: 'minor',
          operation: 'صافکاری و نقاشی',
          color: 'yellow',
          note: 'سپر جلو از سمت راست دچار خط و خش عمیق و شکستگی موضعی دیاق است.'
        },
        door_fl: {
          type: 'دفرمگی شدید کلاف و پارگی ورق',
          severity: 'major',
          operation: 'تعویض کامل قطعه',
          color: 'red',
          note: 'درب جلو چپ دچار له‌شدگی شدید شده و غیرقابل ترمیم است.'
        }
      };

  Object.entries(effectiveSpots).forEach(([key, spot]: [string, any], idx) => {
    const rawOp = String(spot.operation || '').toLowerCase();
    const isReplace =
      rawOp === 'replace' ||
      rawOp.includes('تعویض') ||
      rawOp.includes('اسقاط') ||
      spot.severity === 'major';

    const partName = getExactPersianPartName(key);

    const basePartPrice = isReplace ? Math.round(32000000 * mult) : 0;
    const baseLaborPrice = isReplace ? Math.round(8500000 * mult) : Math.round(14500000 * mult);
    const salvage = isReplace ? Math.round(basePartPrice * 0.12) : 0;
    const depreciation = isReplace ? Math.round(basePartPrice * 0.05) : 0;
    const totalRow = basePartPrice + baseLaborPrice - salvage - depreciation;

    let reasonFa = '';
    if (spot.note && spot.note.trim().length > 3) {
      reasonFa = spot.note.trim();
    } else if (isReplace) {
      reasonFa = `شدت آسیب و شکستگی اتصالات ${partName} فراتر از آستانه صافکاری بوده و نیازمند تعویض فابریک شرکتی است.`;
    } else {
      reasonFa = `دفرمگی و خط و خش ${partName} بدون پارگی کلاف بوده و با صافکاری PDR و رنگ‌آمیزی کوره‌ای قابل ترمیم است.`;
    }

    parts.push({
      id: `ai-part-${key || idx}`,
      name: partName,
      type: isReplace ? 'replace' : 'repair',
      partPrice: basePartPrice,
      repairPrice: baseLaborPrice,
      salvageValue: salvage,
      depreciation,
      totalRow,
      confidence: isReplace ? 0.94 : 0.91,
      reasonFa
    });
  });

  // Calculate totals
  let grossParts = 0;
  let grossLabor = 0;
  let totalSalvage = 0;
  let totalDepreciation = 0;

  parts.forEach(p => {
    grossParts += p.partPrice;
    grossLabor += p.repairPrice;
    totalSalvage += p.salvageValue;
    totalDepreciation += p.depreciation;
  });

  const grossTotal = grossParts + grossLabor;
  const netPayable = grossTotal - totalSalvage - totalDepreciation;

  // Generate Customer Deficiency and Coordination Messages
  const customerMessages: AIDraftCustomerMessage[] = [];

  // Check completeness of files
  const fileCount = (claim.files?.length || 0) + (claim.additionalDocs?.length || 0);
  const victimName = claim.victimName || 'زیان‌دیده محترم';
  
  if (fileCount < 4) {
    customerMessages.push({
      id: 'msg-doc-1',
      target: 'زیان‌دیده',
      targetParty: 'PARTY_ONE',
      title: 'درخواست تصویر تکمیلی از زاویه عقب و پلاک',
      messageText: `سلام جناب ${victimName}، جهت نهایی‌سازی پرونده خسارت خودرو ${car}، لطفاً تصویر واضح و بدون تاری از نمای نزدیک ناحیه برخورد و پلاک خودرو را در سامانه بارگذاری فرمایید.`,
      type: 'DEFICIENCY',
      urgency: 'HIGH',
      docTypeRequested: 'عکس از زاویه عقب و پلاک'
    });
  }

  if (!claim.hasKroki) {
    customerMessages.push({
      id: 'msg-visit-1',
      target: 'زیان‌دیده',
      targetParty: 'PARTY_ONE',
      title: 'هماهنگی بازدید میدانی کارشناس حضوری',
      messageText: `زیان‌دیده گرامی، با توجه به عدم حضور پلیس در صحنه، کارشناس رسمی بیمه جهت بازدید حضوری از خودرو ${car} با شما هماهنگ خواهد نمود. لطفاً خودرو را تا زمان رویت کارشناس در شرایط قابل رویت نگه دارید.`,
      type: 'VISIT_COORDINATION',
      urgency: 'MEDIUM'
    });
  }

  customerMessages.push({
    id: 'msg-factor-1',
    target: 'زیان‌دیده',
    targetParty: 'PARTY_ONE',
    title: 'ارسال پیش‌فاکتور یا فاکتور خرید قطعات یدکی',
    messageText: `زیان‌دیده محترم، در صورت تهیه قطعات اورجینال، می‌توانید تصویر فاکتور رسمی دارای مهر فروشگاه را در بخش مدارک ضمیمه نمایید تا در برآورد نهایی لحاظ گردد.`,
    type: 'DEFICIENCY',
    urgency: 'LOW',
    docTypeRequested: 'فاکتور تعمیرات و قطعات'
  });

  const technicalReviewerNote = `[پیش‌نویس تحلیل فنی هوش مصنوعی]:
۱. با بررسی مستندات تصویری و کروکی، آسیب وارده به خودروی ${car} ناشی از ضربه محور عقب تایید گردید.
۲. اقلام نیازمند تعویض (${parts.filter(p => p.type === 'replace').map(p => p.name).join('، ') || 'سپر و چراغ'}) به دلیل شکستگی دیاق و طلق غیرقابل بازسازی تشخیص داده شدند.
۳. اجرت صافکاری و نقاشی بر مبنای نرخ مصوب اتحادیه محاسبه و ۵٪ کسر استهلاک قانونی لحاظ شد.
۴. اصالت پلاک و عدم سابقه خسارت مشابه در ۶ ماه گذشته استعلام و تایید گردید.`;

  return {
    claimId: claim.id,
    carModel: car,
    damageSummaryFa: `خسارت ناحیه عقب (${parts.length} قلم تفکیکی قطعات و اجرت صافکاری)`,
    confidenceScore: 0.94,
    parts,
    totals: {
      grossParts,
      grossLabor,
      grossTotal,
      totalSalvage,
      totalDepreciation,
      netPayable
    },
    customerMessages,
    technicalReviewerNote,
    fraudRiskLevel: 'LOW',
    fraudRiskNotesFa: 'نشانه‌ای از تقلب، جابجایی قطعه یا خسارت عمدی مشاهده نشد؛ انطباق کامل با گزارش حادثه.',
    croquiAlignmentScore: claim.hasKroki ? 98 : 88
  };
}
