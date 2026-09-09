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
