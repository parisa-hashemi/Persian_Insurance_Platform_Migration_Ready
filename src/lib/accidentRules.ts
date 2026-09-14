// ----------------------------------------------------------------
// قوانین کروکی، سقف تعهدات و انواع حادثه
// این ماژول تنها مرجع قوانین راهور و بیمه مرکزی در سامانه است و نباید
// منطق آن در کامپوننت‌ها تکرار شود.
// ----------------------------------------------------------------

/** سقف خسارت قابل پذیرش بدون کروکی (به تومان) */
export const NO_CROQUI_CEILING_TOMAN = 70_000_000;

/** همان سقف به ریال — واحد ذخیره‌سازی مبالغ در سامانه ریال است */
export const NO_CROQUI_CEILING_RIAL = NO_CROQUI_CEILING_TOMAN * 10;

export const NO_CROQUI_CEILING_LABEL = '۷۰ میلیون تومان (۷۰۰ میلیون ریال)';

// ----------------------------------------------------------------
// انواع حادثه و مدرک رسمی مورد نیاز هر کدام
// ----------------------------------------------------------------

export type IncidentReportKind = 'CROQUI' | 'POLICE_110' | 'FIRE_125' | 'OFFICIAL_AUTHORITY' | 'NONE';

export interface AccidentTypeRule {
  key: string;
  label: string;
  /** توضیح کوتاه جهت نمایش زیر گزینه */
  hint: string;
  /** مدرک رسمی الزامی برای این نوع حادثه */
  reportKind: IncidentReportKind;
  /** عنوان مدرکی که کاربر باید بارگذاری کند */
  reportLabel: string;
  /** آیا صرف‌نظر از مبلغ خسارت، کروکی الزامی است؟ */
  croquiAlwaysMandatory: boolean;
  /** آیا این نوع حادثه اصولاً کروکی راهور دارد؟ */
  supportsCroqui: boolean;
}

export const ACCIDENT_TYPES: AccidentTypeRule[] = [
  {
    key: 'TWO_VEHICLE',
    label: 'تصادف دو یا چند خودرو',
    hint: 'برخورد وسایل نقلیه با یکدیگر (خسارتی)',
    reportKind: 'CROQUI',
    reportLabel: 'کروکی پلیس راهور (کاغذی یا الکترونیک)',
    croquiAlwaysMandatory: false,
    supportsCroqui: true
  },
  {
    key: 'CHAIN',
    label: 'تصادف زنجیره‌ای (بیش از دو خودرو)',
    hint: 'برخورد پیاپی سه خودرو یا بیشتر',
    reportKind: 'CROQUI',
    reportLabel: 'کروکی پلیس راهور (الزامی)',
    croquiAlwaysMandatory: true,
    supportsCroqui: true
  },
  {
    key: 'HEAVY_VEHICLE',
    label: 'تصادف با وسیله نقلیه سنگین',
    hint: 'کامیون، تریلی، اتوبوس، ماشین‌آلات راه‌سازی',
    reportKind: 'CROQUI',
    reportLabel: 'کروکی پلیس راهور (الزامی)',
    croquiAlwaysMandatory: true,
    supportsCroqui: true
  },
  {
    key: 'FIXED_OBJECT',
    label: 'برخورد با جسم ثابت',
    hint: 'گاردریل، تیر برق، درخت، جدول، دیوار',
    reportKind: 'CROQUI',
    reportLabel: 'کروکی پلیس راهور (الزامی)',
    croquiAlwaysMandatory: true,
    supportsCroqui: true
  },
  {
    key: 'PEDESTRIAN',
    label: 'برخورد با عابر پیاده، موتورسیکلت یا دوچرخه',
    hint: 'حادثه دارای احتمال صدمه جانی',
    reportKind: 'CROQUI',
    reportLabel: 'کروکی پلیس راهور (الزامی)',
    croquiAlwaysMandatory: true,
    supportsCroqui: true
  },
  {
    key: 'ROLLOVER',
    label: 'واژگونی یا حادثه تک‌خودرو',
    hint: 'انحراف از مسیر، واژگونی، سقوط',
    reportKind: 'CROQUI',
    reportLabel: 'کروکی پلیس راهور',
    croquiAlwaysMandatory: false,
    supportsCroqui: true
  },
  {
    key: 'THEFT',
    label: 'سرقت خودرو یا قطعات',
    hint: 'سرقت کلی خودرو یا سرقت جزئی قطعات',
    reportKind: 'POLICE_110',
    reportLabel: 'گزارش ۱۱۰ نیروی انتظامی و شماره پرونده کلانتری',
    croquiAlwaysMandatory: false,
    supportsCroqui: false
  },
  {
    key: 'VANDALISM',
    label: 'خرابکاری و تخریب عمدی',
    hint: 'اسیدپاشی، شکستن شیشه، تخریب عمدی بدنه',
    reportKind: 'POLICE_110',
    reportLabel: 'گزارش ۱۱۰ نیروی انتظامی و شماره پرونده کلانتری',
    croquiAlwaysMandatory: false,
    supportsCroqui: false
  },
  {
    key: 'FIRE',
    label: 'آتش‌سوزی یا انفجار',
    hint: 'آتش‌سوزی خودرو یا سرایت حریق',
    reportKind: 'FIRE_125',
    reportLabel: 'گزارش رسمی سازمان آتش‌نشانی (۱۲۵)',
    croquiAlwaysMandatory: false,
    supportsCroqui: false
  },
  {
    key: 'NATURAL_DISASTER',
    label: 'حوادث طبیعی',
    hint: 'سیل، زلزله، تگرگ، طوفان، ریزش',
    reportKind: 'OFFICIAL_AUTHORITY',
    reportLabel: 'گزارش مرجع رسمی (هواشناسی، شهرداری یا مدیریت بحران)',
    croquiAlwaysMandatory: false,
    supportsCroqui: false
  }
];

export function getAccidentTypeRule(key: string | undefined | null): AccidentTypeRule | undefined {
  if (!key) return undefined;
  return ACCIDENT_TYPES.find((t) => t.key === key);
}

// ----------------------------------------------------------------
// شروط ده‌گانه الزام به کروکی (وضعیت‌های قانونی راهور)
// ----------------------------------------------------------------

export interface MandatoryCroquiCondition {
  id: string;
  label: string;
  note: string;
}

export const MANDATORY_CROQUI_CONDITIONS: MandatoryCroquiCondition[] = [
  {
    id: 'C1',
    label: 'تصادف با وسیله نقلیه سنگین (کامیون، تریلی، اتوبوس)',
    note: 'به دلیل بالا بودن میزان خسارت و تعیین مقصر، حضور کارشناس راهور الزامی است.'
  },
  {
    id: 'C2',
    label: 'برخورد با جسم ثابت (گاردریل، تیر چراغ برق، درخت، جدول)',
    note: 'خسارت به اموال عمومی نیازمند ثبت رسمی توسط پلیس است.'
  },
  {
    id: 'C3',
    label: 'برخورد با عابر پیاده، موتورسیکلت یا دوچرخه',
    note: 'احتمال صدمه جانی وجود دارد و پرونده جرحی محسوب می‌شود.'
  },
  {
    id: 'C4',
    label: 'تصادف زنجیره‌ای با بیش از دو خودرو',
    note: 'تعیین سهم مقصر بین چند خودرو تنها با کروکی امکان‌پذیر است.'
  },
  {
    id: 'C5',
    label: 'وجود مصدوم، مجروح یا فوتی در حادثه',
    note: 'پرونده جرحی است و ثبت آنلاین بدون کروکی امکان‌پذیر نیست.'
  },
  {
    id: 'C6',
    label: 'تصادف با خودروی دولتی، نظامی، امدادی یا اموال عمومی',
    note: 'رسیدگی نیازمند گزارش رسمی مرجع انتظامی است.'
  },
  {
    id: 'C7',
    label: 'فقدان بیمه‌نامه معتبر یا پلاک مخدوش و غیرمجاز در یکی از طرفین',
    note: 'استعلام و احراز هویت خودرو نیازمند حضور پلیس است.'
  },
  {
    id: 'C8',
    label: 'راننده فاقد گواهینامه متناسب یا مشکوک به مصرف مواد و الکل',
    note: 'موضوع دارای جنبه کیفری بوده و کروکی الزامی است.'
  },
  {
    id: 'C9',
    label: 'فرار راننده مقصر از صحنه حادثه',
    note: 'شناسایی مقصر تنها از طریق پرونده انتظامی ممکن است.'
  },
  {
    id: 'C10',
    label: 'اختلاف طرفین در تعیین مقصر یا عدم توافق بر سر خسارت',
    note: 'در صورت نبود توافق، تعیین مقصر بر عهده کارشناس راهور است.'
  }
];

// ----------------------------------------------------------------
// ارزیابی الزام کروکی
// ----------------------------------------------------------------

export interface CroquiRequirementInput {
  accidentTypeKey?: string | null;
  selectedConditionIds?: string[];
  estimatedDamageToman?: number;
}

export interface CroquiRequirementResult {
  /** آیا ارائه کروکی الزامی است؟ */
  mandatory: boolean;
  /** دلایل الزام، جهت نمایش به کاربر */
  reasons: string[];
  /** آیا علت الزام، عبور خسارت از سقف است؟ */
  exceedsCeiling: boolean;
  /** نوع مدرک رسمی لازم برای این حادثه */
  reportKind: IncidentReportKind;
  reportLabel: string;
}

export function evaluateCroquiRequirement(input: CroquiRequirementInput): CroquiRequirementResult {
  const { accidentTypeKey, selectedConditionIds = [], estimatedDamageToman = 0 } = input;
  const rule = getAccidentTypeRule(accidentTypeKey);
  const reasons: string[] = [];

  const exceedsCeiling = estimatedDamageToman > NO_CROQUI_CEILING_TOMAN;
  if (exceedsCeiling) {
    reasons.push(
      `مبلغ خسارت اعلامی از سقف مجاز بدون کروکی (${NO_CROQUI_CEILING_LABEL}) بیشتر است.`
    );
  }

  if (rule?.croquiAlwaysMandatory) {
    reasons.push(`نوع حادثه انتخابی («${rule.label}») طبق ضوابط راهور نیازمند کروکی است.`);
  }

  MANDATORY_CROQUI_CONDITIONS.forEach((cond) => {
    if (selectedConditionIds.includes(cond.id)) {
      reasons.push(cond.label);
    }
  });

  // در حوادثی مانند سرقت یا آتش‌سوزی اصولاً کروکی راهور صادر نمی‌شود؛
  // در این موارد مدرک رسمی جایگزین (گزارش ۱۱۰ یا ۱۲۵) الزامی است.
  const mandatory = rule?.supportsCroqui === false ? false : reasons.length > 0;

  return {
    mandatory,
    reasons,
    exceedsCeiling,
    reportKind: rule?.reportKind ?? 'CROQUI',
    reportLabel: rule?.reportLabel ?? 'کروکی پلیس راهور'
  };
}

/** متن تذکر سقف خسارت بدون کروکی — برای نمایش متنی و پخش صوتی */
export function buildCeilingWarningText(estimatedDamageToman?: number): string {
  const base =
    `طبق قوانین بیمه مرکزی، سقف خسارت قابل پرداخت بدون کروکی ${NO_CROQUI_CEILING_LABEL} است. ` +
    'برای خسارت‌های بالاتر از این مبلغ، بارگذاری کروکی پلیس راهور الزامی است.';
  if (estimatedDamageToman && estimatedDamageToman > NO_CROQUI_CEILING_TOMAN) {
    return (
      `توجه: مبلغ خسارت اعلامی شما بیش از ${NO_CROQUI_CEILING_LABEL} است. ` +
      'بدون بارگذاری کروکی پلیس راهور، امکان ثبت و رسیدگی به این پرونده وجود ندارد.'
    );
  }
  return base;
}

/**
 * پخش صوتی تذکر با موتور گفتار مرورگر (فارسی).
 * در صورت عدم پشتیبانی مرورگر، بی‌صدا ناموفق می‌شود و پیام متنی جایگزین است.
 */
export function speakWarning(text: string): boolean {
  try {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return false;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'fa-IR';
    utter.rate = 0.95;
    const faVoice = synth.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('fa'));
    if (faVoice) utter.voice = faVoice;
    synth.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function stopWarningSpeech(): void {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch {
    /* no-op */
  }
}

// ----------------------------------------------------------------
// قوانین اختصاصی بیمه بدنه خودرو و الزامات کروکی
// ----------------------------------------------------------------

/**
 * آیا حادثه مربوط به بیمه بدنه خودرو است؟
 * شامل تصادفات تک‌وسیله، موانع ثابت، واژگونی، سرقت، آتش‌سوزی، بلایای طبیعی
 */
export function isBodyInsuranceIncident(accidentTypeKey?: string | null, wizardRole?: string | null): boolean {
  if (!accidentTypeKey) return false;

  const bodyTypes = [
    'FIXED_OBJECT',    // برخورد با جسم ثابت، گاردریل، تیر برق، درخت، جدول، دیوار
    'ROLLOVER',        // واژگونی یا حادثه تک‌خودرو، سقوط به دره
    'THEFT',           // سرقت خودرو یا قطعات
    'VANDALISM',       // خرابکاری و تخریب عمدی
    'FIRE',            // آتش‌سوزی و انفجار
    'NATURAL_DISASTER' // سیل، زلزله، طوفان، تگرگ
  ];
  return bodyTypes.includes(accidentTypeKey);
}

/** شروط ده‌گانه الزام به کروکی در بیمه بدنه خودرو */
export interface BodyInsuranceCroquiCondition {
  id: string;
  label: string;
  shortDesc: string;
  severity: 'high' | 'medium';
}

export const BODY_CROQUI_CONDITIONS: BodyInsuranceCroquiCondition[] = [
  {
    id: 'body_second_accident',
    label: 'استفاده مجدد از بیمه بدنه در سال جاری (حادثه دوم به بعد)',
    shortDesc: 'دریافت خسارت بدون کروکی فقط یک بار در طول سال اعتبار بیمه‌نامه مجاز است.',
    severity: 'high'
  },
  {
    id: 'body_under_30_days',
    label: 'گذشت کمتر از ۳۰ روز از تاریخ صدور یا تمدید بیمه‌نامه بدنه',
    shortDesc: 'تصادفات چندروزه بعد از صدور جهت رفع شبهه خسارت قبلی یا تقلب نیازمند کروکی است.',
    severity: 'medium'
  },
  {
    id: 'body_rollover_fall',
    label: 'واژگونی (چپ کردن) یا سقوط خودرو به دره',
    shortDesc: 'به علت خسارت‌های شدید و سازه‌ای شاسی و اتاق، حضور پلیس و کروکی الزامی است.',
    severity: 'high'
  },
  {
    id: 'body_fixed_object_heavy',
    label: 'برخورد با اجسام ثابت (گاردریل، درخت، تیر برق، دیوار، ستون پارکینگ)',
    shortDesc: 'خسارت شدید به موانع یا سازه جهت تایید عدم صحنه‌سازی نیازمند کروکی است.',
    severity: 'medium'
  },
  {
    id: 'body_military_heavy_chain',
    label: 'تصادف با خودروهای نظامی، وسایل سنگین یا تصادفات زنجیره‌ای',
    shortDesc: 'الزام قانونی تنظیم گزارش و رسم کروکی توسط افسر کاردان راهور.',
    severity: 'high'
  },
  {
    id: 'body_bodily_injury',
    label: 'حوادث دارای خسارت جانی، جراحت، مصدومیت یا فوت',
    shortDesc: 'جنبه جزایی و لزوم تشکیل پرونده انتظامی و ارجاع به پزشکی قانونی.',
    severity: 'high'
  },
  {
    id: 'body_hit_and_run',
    label: 'فرار راننده مقصر یا تصادف نامعلوم در زمان پارک خودرو',
    shortDesc: 'عدم حضور مقصر در صحنه تصادف نیازمند صورتجلسه پلیس و کروکی نامعلوم است.',
    severity: 'high'
  },
  {
    id: 'body_suspicious_complex',
    label: 'نامعلوم، پیچیده یا مشکوک بودن علت حادثه / آسیب نامتعارف',
    shortDesc: 'جهت اثبات صحت و اصالت حادثه و جلوگیری از ابهام در شرکت بیمه.',
    severity: 'medium'
  }
];

export interface BodyCroquiEvaluationInput {
  estimatedDamageToman: number;
  claimCountThisYear?: number; // 1 = first time, 2+ = 2nd or more
  isPolicyUnder30Days?: boolean;
  selectedConditionIds?: string[];
  accidentTypeKey?: string;
  hasBodilyInjury?: boolean;
}

export interface BodyCroquiEvaluationResult {
  croquiMandatory: boolean;
  reasons: string[];
  noCroquiEligible: boolean;
  ceilingToman: number;
  exceedsCeiling: boolean;
  isSecondAccident: boolean;
  isUnder30Days: boolean;
  guidanceText: string;
}

/**
 * ارزیابی ضوابط الزامی بودن یا معافیت از کروکی در بیمه بدنه
 */
export function evaluateBodyInsuranceCroquiRequirement(
  input: BodyCroquiEvaluationInput
): BodyCroquiEvaluationResult {
  const {
    estimatedDamageToman = 0,
    claimCountThisYear = 1,
    isPolicyUnder30Days = false,
    selectedConditionIds = [],
    accidentTypeKey,
    hasBodilyInjury = false
  } = input;

  const reasons: string[] = [];
  const exceedsCeiling = estimatedDamageToman > NO_CROQUI_CEILING_TOMAN;
  const isSecondAccident = claimCountThisYear > 1;

  // ۱. سقف مبلغ خسارت (بیش از ۷۰ میلیون تومان)
  if (exceedsCeiling) {
    reasons.push(
      `مبلغ خسارت اعلامی (${estimatedDamageToman.toLocaleString('fa-IR')} تومان) از سقف پرداخت بدون کروکی (${NO_CROQUI_CEILING_LABEL}) بیشتر است.`
    );
  }

  // ۲. تصادف دوم به بعد در طول مدت یک سال بیمه‌نامه
  if (isSecondAccident) {
    reasons.push(
      'استفاده مجدد از بیمه بدنه در طول سال بیمه‌ای (بار دوم به بعد)؛ پرداخت بدون کروکی تنها یک‌بار در سال مجاز است.'
    );
  }

  // ۳. کمتر از ۳۰ روز از تاریخ شروع/تمدید بیمه‌نامه
  if (isPolicyUnder30Days) {
    reasons.push(
      'گذشت کمتر از ۳۰ روز از صدور یا تمدید بیمه‌نامه بدنه (جهت احراز عدم وجود خسارت قبلی و اصالت حادثه).'
    );
  }

  // ۴. صدمه جانی
  if (hasBodilyInjury) {
    reasons.push('وجود مصدوم یا خسارت جانی در حادثه (الزام قانونی کروکی قضایی/انتظامی).');
  }

  // ۵. انواع خاص حادثه مثل واژگونی، موانع ثابت، سرقت
  if (accidentTypeKey === 'ROLLOVER') {
    reasons.push('واژگونی یا سقوط خودرو (آسیب‌های اساسی اتاق و شاسی).');
  } else if (accidentTypeKey === 'FIXED_OBJECT' && (exceedsCeiling || selectedConditionIds.includes('body_fixed_object_heavy'))) {
    reasons.push('برخورد با اجسام ثابت (گاردریل، تیر برق، جدول یا دیوار) با شدت آسیب بالا.');
  }

  // ۶. سایر شروط انتخابی کاربر
  BODY_CROQUI_CONDITIONS.forEach((cond) => {
    if (selectedConditionIds.includes(cond.id)) {
      if (!reasons.some((r) => r.includes(cond.label))) {
        reasons.push(cond.label);
      }
    }
  });

  const croquiMandatory = reasons.length > 0;
  const noCroquiEligible = !croquiMandatory;

  let guidanceText = '';
  if (noCroquiEligible) {
    guidanceText =
      'واجد شرایط دریافت خسارت بدون کروکی: این پرونده مربوط به خسارت بار اول، با مبلغ کمتر از ۷۰ میلیون تومان و فاقد ابهام است و بدون نیاز به کروکی پلیس قابل پرداخت است.';
  } else {
    guidanceText =
      `ارائه کروکی پلیس راهور الزامی است: با توجه به دلایل قانونی فوق، بدون آپلود برگه کروکی رسم‌شده توسط پلیس یا کد رهگیری کروکی الکترونیک، امکان پرداخت خسارت بدنه وجود ندارد.`;
  }

  return {
    croquiMandatory,
    reasons,
    noCroquiEligible,
    ceilingToman: NO_CROQUI_CEILING_TOMAN,
    exceedsCeiling,
    isSecondAccident,
    isUnder30Days: isPolicyUnder30Days,
    guidanceText
  };
}

