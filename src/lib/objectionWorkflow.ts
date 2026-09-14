/**
 * ============================================================================
 * موتور جریان اعتراض و شورای عالی کارشناسی
 * ============================================================================
 *
 * مسیر مصوب کارفرما:
 *
 *   مرحله ۱ ── اعتراض اول ──► بازبینی توسط «همان کارشناس اولیه»
 *                              (نه ارزیاب جدید؛ بیشتر اعتراض‌ها با توضیح خود
 *                               کارشناس اولیه حل می‌شود و ارجاع به فرد جدید
 *                               هزینه و زمان اضافه تحمیل می‌کند)
 *
 *   مرحله ۲ ── اعتراض دوم ──► دو انتخاب برای مشتری:
 *                              الف) ارزیاب مستقل (نیازمند واریز هزینه کارشناسی)
 *                              ب) ثبت اطلاعات و فاکتور تعمیرگاه برای همان کارشناس اول
 *
 *   مرحله ۳ ── پافشاری ─────► ارجاع به «شورای عالی کارشناسی»
 *                              رأی شورا فصل‌الخطاب و غیرقابل تغییر است.
 *
 * قفل پرونده: به محض ارجاع به شورا، پرونده برای کارشناس اولیه و کارشناس تخصصی
 * «فقط‌خواندنی» می‌شود تا امکان دستکاری مدرک یا مبلغ وجود نداشته باشد.
 * ============================================================================
 */

import { ClaimCase, HighCommitteeReview, ReInspectionRequest } from '../types';

/** مراحل اعتراض طبق مسیر مصوب. */
export const OBJECTION_STAGE = {
  NONE: 0,
  /** بازبینی توسط همان کارشناس اولیه */
  FIRST_REVIEW_BY_ORIGINAL: 1,
  /** انتخاب مسیر: ارزیاب مستقل (پولی) یا تعمیرگاه */
  SECOND_CHOICE: 2,
  /** ارجاع به شورای عالی کارشناسی */
  HIGH_COUNCIL: 3
} as const;

export const OBJECTION_STAGE_LABELS: Record<number, string> = {
  0: 'بدون اعتراض',
  1: 'اعتراض اول — بازبینی کارشناس اولیه',
  2: 'اعتراض دوم — ارزیاب مستقل یا تعمیرگاه',
  3: 'اعتراض سوم — شورای عالی کارشناسی'
};

/** هزینه کارشناسی ارزیاب مستقل (ریال) و حساب مقصد واریز. */
export const INDEPENDENT_ASSESSOR_FEE = 8_500_000;
export const INDEPENDENT_ASSESSOR_IBAN = 'IR120570028780010597443001';
export const INDEPENDENT_ASSESSOR_ACCOUNT_NAME = 'حساب متمرکز کارشناسی مستقل — کاراینشو';

const now = () =>
  new Date().toLocaleDateString('fa-IR') +
  ' ' +
  new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

/* ==========================================================================
 * قفل پرونده
 * ========================================================================== */

/**
 * آیا پرونده به دلیل بررسی در شورای عالی قفل است؟
 * وقتی true باشد، کارشناس اولیه و کارشناس تخصصی فقط حق مشاهده دارند.
 */
export function isCaseLockedByCouncil(claim: ClaimCase): boolean {
  const review = claim.highCommitteeReview;
  if (!review) return false;
  // پس از صدور رأی قطعی هم پرونده قفل می‌ماند؛ رأی شورا غیرقابل تغییر است.
  return true;
}

/**
 * آیا پرونده در انتظار پاسخ کارشناس به اعتراض است؟
 * در این حالت هیچ اقدامی از سمت مشتری (تایید یا اعتراض مجدد) مجاز نیست،
 * چون هنوز ارزیابی مجددی صورت نگرفته است.
 */
export function isAwaitingExpertResponse(claim: ClaimCase): boolean {
  return typeof claim.awaitingAssessmentForStage === 'number' && claim.awaitingAssessmentForStage > 0;
}

/** متن قفل بین‌مرحله‌ای جهت نمایش به مشتری. */
export function awaitingResponseNotice(claim: ClaimCase): string {
  const stage = claim.awaitingAssessmentForStage || 1;
  const who =
    stage === 1
      ? 'کارشناس ارزیاب اولیه'
      : claim.objectionSecondPath === 'INDEPENDENT_ASSESSOR'
      ? 'ارزیاب مستقل'
      : 'کارشناس ارزیاب اولیه (بررسی فاکتور تعمیرگاه)';
  return `اعتراض شما ثبت شد و پرونده در حال بازبینی توسط ${who} است. تا زمان ثبت ارزیابی مجدد، امکان تایید یا ثبت اعتراض جدید وجود ندارد.`;
}

/** پاک کردن قفل پس از ثبت ارزیابی مجدد توسط کارشناس. */
export function clearAwaitingResponse<T extends ClaimCase>(claim: T): T {
  return { ...claim, awaitingAssessmentForStage: undefined, objectionPendingSince: undefined };
}

/**
 * آیا رأی قطعی شورا صادر شده است؟
 * پس از صدور رأی، هیچ اعتراض جدیدی پذیرفته نمی‌شود و پرونده مستقیماً وارد
 * مرحله «ثبت شماره شبا و پرداخت» می‌شود.
 */
export function hasFinalCouncilVerdict(claim: ClaimCase): boolean {
  return Boolean(claim.highCommitteeReview?.finalVerdict);
}

/** مبلغ نهایی مصوب شورا (ریال) در صورت وجود. */
export function councilFinalAmount(claim: ClaimCase): number | null {
  const amt = claim.highCommitteeReview?.finalAmount;
  return typeof amt === 'number' && amt > 0 ? amt : null;
}

export const COUNCIL_VERDICT_NOTICE =
  'رأی شورای عالی کارشناسی صادر شده و طبق ضوابط، فصل‌الخطاب و غیرقابل اعتراض است. جهت دریافت خسارت، لطفاً شماره شبا خود را ثبت فرمایید.';

export const COUNCIL_LOCK_NOTICE =
  'این پرونده در «شورای عالی کارشناسی» در حال بررسی است و برای کارشناس ارزیاب و کارشناس تخصصی به صورت فقط‌خواندنی قفل شده است. رأی شورا فصل‌الخطاب و غیرقابل تغییر می‌باشد.';

/* ==========================================================================
 * مرحله ۱ — بازبینی توسط همان کارشناس اولیه
 * ========================================================================== */

export function fileFirstObjection(
  claim: ClaimCase,
  reason: string,
  objector: { name: string; nationalId?: string; role: string }
): ClaimCase {
  const originalExpert = claim.assignedExpert;

  // آرشیو ارزیابی جاری به عنوان «مورد اعتراض»
  const archived = [...(claim.assessments || [])];
  if (claim.assessment && !archived.some(a => a.payable === claim.assessment?.payable && a.gross === claim.assessment?.gross)) {
    archived.push({
      round: 'ارزیابی اولیه',
      roundIdx: 1,
      expertName: originalExpert?.name || claim.assessment.submittedBy || 'کارشناس اول',
      submittedAt: claim.assessment.submittedAt || now(),
      gross: claim.assessment.gross,
      deductions: claim.assessment.deductions,
      salvage: claim.assessment.salvage,
      payable: claim.assessment.payable,
      reviewerNote: claim.assessment.reviewerNote,
      parts: claim.assessment.parts || [],
      aiDecisions: claim.aiDecisions || [],
      status: 'مورد اعتراض — در حال بازبینی توسط کارشناس اولیه'
    } as any);
  }

  return {
    ...claim,
    objectionStage: OBJECTION_STAGE.FIRST_REVIEW_BY_ORIGINAL,
    status: 'در انتظار بازبینی اعتراض توسط کارشناس اولیه',
    // قفل تا رسیدن ارزیابی مجدد
    awaitingAssessmentForStage: OBJECTION_STAGE.FIRST_REVIEW_BY_ORIGINAL,
    objectionPendingSince: now(),
    reassessReason: reason,
    reassessType: 'اعتراض اول — بازبینی کارشناس اولیه',
    assessments: archived,
    // کارشناس اولیه عمداً حفظ می‌شود
    assignedExpert: originalExpert,
    history: [
      ...(claim.history || []),
      {
        status: 'در انتظار بازبینی اعتراض توسط کارشناس اولیه',
        time: now(),
        user: objector.name,
        note: `ثبت اعتراض اول توسط ${objector.name} (${objector.role})${objector.nationalId ? ` با کد ملی ${objector.nationalId}` : ''}: «${reason}». پرونده جهت بازبینی به همان کارشناس اولیه (${originalExpert?.name || 'کارشناس اول'}) ارجاع شد.`
      }
    ]
  };
}

/* ==========================================================================
 * مرحله ۲ — انتخاب مسیر
 * ========================================================================== */

export type SecondObjectionPath = 'INDEPENDENT_ASSESSOR' | 'WORKSHOP_INVOICE';

export function fileSecondObjection(
  claim: ClaimCase,
  path: SecondObjectionPath,
  reason: string,
  objector: { name: string; nationalId?: string; role: string },
  payload?: {
    /** مسیر الف: اطلاعات پرداخت هزینه کارشناسی */
    payment?: { referenceCode: string; paidAt: string; amount: number };
    /** مسیر ب: اطلاعات تعمیرگاه */
    workshop?: { shopName: string; shopPhone: string; province: string; city: string; shopAddress?: string };
  }
): ClaimCase {
  const base: ClaimCase = {
    ...claim,
    objectionStage: OBJECTION_STAGE.SECOND_CHOICE,
    reassessReason: reason,
    objectionSecondPath: path,
    // قفل تا رسیدن نتیجه‌ی مسیر انتخابی
    awaitingAssessmentForStage: OBJECTION_STAGE.SECOND_CHOICE,
    objectionPendingSince: now()
  } as ClaimCase;

  if (path === 'INDEPENDENT_ASSESSOR') {
    return {
      ...base,
      status: 'در انتظار ارجاع به ارزیاب مستقل',
      reassessType: 'اعتراض دوم — ارزیاب مستقل (با پرداخت هزینه)',
      secondaryObjection: {
        type: 'ارزیاب مستقل',
        fee: payload?.payment?.amount ?? INDEPENDENT_ASSESSOR_FEE,
        paidAt: payload?.payment?.paidAt
      },
      independentAssessorPayment: payload?.payment
        ? { ...payload.payment, iban: INDEPENDENT_ASSESSOR_IBAN, status: 'PAID' as const }
        : { referenceCode: '', paidAt: '', amount: INDEPENDENT_ASSESSOR_FEE, iban: INDEPENDENT_ASSESSOR_IBAN, status: 'PENDING' as const },
      history: [
        ...(claim.history || []),
        {
          status: 'در انتظار ارجاع به ارزیاب مستقل',
          time: now(),
          user: objector.name,
          note: `ثبت اعتراض دوم توسط ${objector.name} (${objector.role})${objector.nationalId ? ` — کد ملی ${objector.nationalId}` : ''}. مسیر انتخابی: «ارزیاب مستقل». هزینه کارشناسی ${(payload?.payment?.amount ?? INDEPENDENT_ASSESSOR_FEE).toLocaleString('fa-IR')} ریال${payload?.payment?.referenceCode ? ` با کد پیگیری ${payload.payment.referenceCode} پرداخت شد` : ' در انتظار پرداخت است'}.`
        }
      ]
    };
  }

  // مسیر ب: تعمیرگاه — پرونده نزد همان کارشناس اول می‌ماند
  return {
    ...base,
    status: 'در حال بررسی اطلاعات تعمیرگاه توسط کارشناس اولیه',
    reassessType: 'اعتراض دوم — بررسی فاکتور تعمیرگاه',
    workshopInfo: payload?.workshop
      ? { ...payload.workshop, submittedAt: now() }
      : claim.workshopInfo,
    secondaryObjection: { type: 'تعمیرگاه', ...payload?.workshop },
    history: [
      ...(claim.history || []),
      {
        status: 'در حال بررسی اطلاعات تعمیرگاه توسط کارشناس اولیه',
        time: now(),
        user: objector.name,
        note: `ثبت اعتراض دوم توسط ${objector.name} (${objector.role})${objector.nationalId ? ` — کد ملی ${objector.nationalId}` : ''}. مسیر انتخابی: «ثبت اطلاعات تعمیرگاه». تعمیرگاه ${payload?.workshop?.shopName || '—'} جهت بررسی به کارشناس اولیه ارجاع شد.`
      }
    ]
  };
}

/* ==========================================================================
 * مرحله ۳ — ارجاع به شورای عالی کارشناسی
 * ========================================================================== */

/** اعضای پیش‌فرض شورا (مدیران ارشد فنی). */
export const DEFAULT_COUNCIL_MEMBERS = [
  { name: 'دکتر علیرضا ابراهیمی', title: 'رئیس شورا — معاون فنی بیمه' },
  { name: 'مهندس سپیده معتمدی', title: 'عضو شورا — مدیر ارزیابی خسارت' },
  { name: 'مهندس کیوان عزیزی', title: 'عضو شورا — مدیر بازرسی و ریسک' }
];

export type CouncilUrgency = 'عادی' | 'فوری — شاکی حاضر در شعبه' | 'بحرانی — پرونده قضایی';

export function escalateToHighCouncil(
  claim: ClaimCase,
  params: {
    reason: string;
    applicantRole: HighCommitteeReview['applicantRole'];
    urgency?: CouncilUrgency;
    objector?: { name: string; nationalId?: string; role: string };
  }
): ClaimCase {
  const review: HighCommitteeReview = {
    id: `HCR-${Date.now().toString().slice(-8)}`,
    caseId: claim.id,
    referredAt: now(),
    reason: params.reason,
    applicantRole: params.applicantRole,
    status: 'در حال بررسی در شورای عالی',
    members: DEFAULT_COUNCIL_MEMBERS.map(m => ({ ...m })),
    isBindingAndFinal: true
  };

  return {
    ...claim,
    objectionStage: OBJECTION_STAGE.HIGH_COUNCIL,
    status: 'در انتظار رأی شورای عالی کارشناسی',
    highCommitteeReview: review,
    councilUrgency: params.urgency || 'عادی',
    // قفل پرونده برای کارشناس اولیه و تخصصی
    isLockedForExperts: true,
    history: [
      ...(claim.history || []),
      {
        status: 'در انتظار رأی شورای عالی کارشناسی',
        time: now(),
        user: params.objector?.name || 'سامانه',
        note: `ارجاع پرونده به شورای عالی کارشناسی به دلیل پافشاری بر اعتراض: «${params.reason}». پرونده برای کارشناس ارزیاب و کارشناس تخصصی قفل (فقط‌خواندنی) شد.`
      }
    ]
  };
}

/* ==========================================================================
 * رأی‌گیری شورا
 * ========================================================================== */

export type CouncilVote = 'تایید ارزیابی اولیه' | 'افزایش خسارت' | 'تعدیل مبالغ' | 'بازدید میدانی مجدد';

export function recordCouncilVote(
  claim: ClaimCase,
  memberName: string,
  vote: CouncilVote,
  notes?: string,
  proposedAmount?: number
): ClaimCase {
  const review = claim.highCommitteeReview;
  if (!review) return claim;

  const members = review.members.map(m =>
    m.name === memberName ? { ...m, vote, notes, proposedAmount } : m
  );

  const votedCount = members.filter(m => m.vote).length;
  const allVoted = votedCount === members.length;

  return {
    ...claim,
    highCommitteeReview: {
      ...review,
      members,
      status: allVoted ? 'جلسه شورا تشکیل شد' : review.status
    },
    history: [
      ...(claim.history || []),
      {
        status: claim.status,
        time: now(),
        user: memberName,
        note: `ثبت رأی عضو شورا (${memberName}): «${vote}»${proposedAmount ? ` — مبلغ پیشنهادی ${proposedAmount.toLocaleString('fa-IR')} ریال` : ''}${notes ? `. توضیح: ${notes}` : ''}`
      }
    ]
  };
}

/** محاسبه اجماع/اکثریت آراء و میانگین مبالغ پیشنهادی. */
export function computeCouncilConsensus(review?: HighCommitteeReview): {
  totalMembers: number;
  votedCount: number;
  isComplete: boolean;
  majorityVote: CouncilVote | null;
  majorityCount: number;
  averageProposedAmount: number | null;
  tally: Array<{ vote: string; count: number }>;
} {
  const members = review?.members || [];
  const voted = members.filter(m => m.vote);

  const counts = new Map<string, number>();
  for (const m of voted) counts.set(m.vote!, (counts.get(m.vote!) || 0) + 1);

  const tally = Array.from(counts.entries())
    .map(([vote, count]) => ({ vote, count }))
    .sort((a, b) => b.count - a.count);

  const amounts = voted
    .map(m => Number((m as any).proposedAmount || 0))
    .filter(a => a > 0);

  return {
    totalMembers: members.length,
    votedCount: voted.length,
    isComplete: members.length > 0 && voted.length === members.length,
    majorityVote: (tally[0]?.vote as CouncilVote) || null,
    majorityCount: tally[0]?.count || 0,
    averageProposedAmount: amounts.length
      ? Math.round(amounts.reduce((s, a) => s + a, 0) / amounts.length)
      : null,
    tally
  };
}

/** صدور رأی نهایی توسط رئیس شورا — فصل‌الخطاب. */
export function issueFinalVerdict(
  claim: ClaimCase,
  params: { verdict: string; finalAmount: number; issuedBy: string }
): ClaimCase {
  const review = claim.highCommitteeReview;
  if (!review) return claim;

  const verdictCode = `VRD-${claim.id}-${Date.now().toString().slice(-5)}`;

  return {
    ...claim,
    status: 'در انتظار تایید کاربر',
    highCommitteeReview: {
      ...review,
      status: 'صدور رأی قطعی',
      finalVerdict: params.verdict,
      finalAmount: params.finalAmount,
      verdictDate: now(),
      verdictCode,
      isBindingAndFinal: true
    },
    assessment: claim.assessment
      ? { ...claim.assessment, payable: params.finalAmount, reviewerNote: `رأی قطعی شورای عالی: ${params.verdict}` }
      : claim.assessment,
    history: [
      ...(claim.history || []),
      {
        status: 'در انتظار تایید کاربر',
        time: now(),
        user: params.issuedBy,
        note: `صدور رأی قطعی شورای عالی کارشناسی (کد ${verdictCode}) به مبلغ ${params.finalAmount.toLocaleString('fa-IR')} ریال. «${params.verdict}». این رأی فصل‌الخطاب و غیرقابل تغییر است.`
      }
    ]
  };
}

/* ==========================================================================
 * دعوت به جلسه حضوری
 * ========================================================================== */

export function inviteToInPersonHearing(
  claim: ClaimCase,
  params: { date: string; time: string; location: string; reason: string; invitedBy: string }
): ClaimCase {
  const smsText = `بیمه‌گذار محترم، پرونده خسارت ${claim.id} شما در شورای عالی کارشناسی در حال بررسی است. خواهشمند است جهت ادای توضیحات تکمیلی در تاریخ ${params.date} ساعت ${params.time} به آدرس ${params.location} مراجعه فرمایید. (علت: ${params.reason})`;

  return {
    ...claim,
    status: 'در انتظار مراجعه حضوری مشتری',
    councilHearing: {
      date: params.date,
      time: params.time,
      location: params.location,
      reason: params.reason,
      invitedBy: params.invitedBy,
      invitedAt: now(),
      smsText,
      status: 'INVITED'
    },
    history: [
      ...(claim.history || []),
      {
        status: 'در انتظار مراجعه حضوری مشتری',
        time: now(),
        user: params.invitedBy,
        note: `دعوت رسمی بیمه‌گذار به جلسه حضوری شورا در تاریخ ${params.date} ساعت ${params.time}، محل: ${params.location}. علت: ${params.reason}. پیامک رسمی ارسال شد.`
      }
    ]
  };
}

export function recordHearingMinutes(
  claim: ClaimCase,
  params: { minutes: string; recordedBy: string; attended: boolean }
): ClaimCase {
  const hearing = claim.councilHearing;
  return {
    ...claim,
    status: 'در انتظار رأی شورای عالی کارشناسی',
    councilHearing: hearing
      ? { ...hearing, status: params.attended ? 'ATTENDED' : 'NO_SHOW', minutes: params.minutes, minutesAt: now() }
      : hearing,
    history: [
      ...(claim.history || []),
      {
        status: 'در انتظار رأی شورای عالی کارشناسی',
        time: now(),
        user: params.recordedBy,
        note: params.attended
          ? `ثبت صورت‌جلسه حضوری: ${params.minutes}`
          : `بیمه‌گذار در جلسه حضوری حاضر نشد. توضیح: ${params.minutes}`
      }
    ]
  };
}

/* ==========================================================================
 * بازدید مجدد (دمونتاژ و کشف خسارت پنهان)
 * ========================================================================== */

export function createReInspectionRequest(params: {
  claim: ClaimCase;
  requestedBy: string;
  requesterRole: ReInspectionRequest['requesterRole'];
  reason: ReInspectionRequest['reason'];
  description: string;
  workshop?: { name?: string; address?: string; phone?: string };
  disassembledParts?: string[];
}): ReInspectionRequest {
  return {
    id: `REINSP-${Date.now().toString().slice(-8)}`,
    caseId: params.claim.id,
    requestedAt: now(),
    requestedBy: params.requestedBy,
    requesterRole: params.requesterRole,
    status: 'در انتظار اعزام کارشناس',
    reason: params.reason,
    description: params.description,
    workshopName: params.workshop?.name || params.claim.workshopInfo?.shopName,
    workshopAddress: params.workshop?.address || params.claim.workshopInfo?.shopAddress,
    workshopPhone: params.workshop?.phone || params.claim.workshopInfo?.shopPhone,
    disassembledParts: params.disassembledParts || []
  };
}

export function attachReInspection(claim: ClaimCase, request: ReInspectionRequest): ClaimCase {
  return {
    ...claim,
    status: 'در انتظار بازدید مجدد (دمونتاژ)',
    reInspectionRequest: request,
    reInspectionHistory: [...(claim.reInspectionHistory || []), request],
    history: [
      ...(claim.history || []),
      {
        status: 'در انتظار بازدید مجدد (دمونتاژ)',
        time: now(),
        user: request.requestedBy,
        note: `ثبت درخواست بازدید مجدد (${request.reason}) در تعمیرگاه ${request.workshopName || '—'}. قطعات دمونتاژشده: ${(request.disassembledParts || []).join('، ') || 'ثبت‌نشده'}.`
      }
    ]
  };
}

export function completeReInspection(
  claim: ClaimCase,
  report: NonNullable<ReInspectionRequest['report']> & { expertName: string }
): ClaimCase {
  const req = claim.reInspectionRequest;
  if (!req) return claim;

  const updated: ReInspectionRequest = {
    ...req,
    status: 'تکمیل و ثبت گزارش',
    report: {
      completedAt: report.completedAt || now(),
      expertNotes: report.expertNotes,
      additionalApprovedAmount: report.additionalApprovedAmount,
      additionalParts: report.additionalParts,
      photos: report.photos
    }
  };

  return {
    ...claim,
    status: 'در انتظار بررسی بازبین',
    reInspectionRequest: updated,
    reInspectionHistory: (claim.reInspectionHistory || []).map(r => (r.id === req.id ? updated : r)),
    history: [
      ...(claim.history || []),
      {
        status: 'در انتظار بررسی بازبین',
        time: now(),
        user: report.expertName,
        note: `ثبت گزارش بازدید مجدد توسط ${report.expertName}. مبلغ تاییدی اضافه: ${(report.additionalApprovedAmount || 0).toLocaleString('fa-IR')} ریال. ${report.expertNotes}`
      }
    ]
  };
}
