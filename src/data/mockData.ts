import { ClaimCase, InsurerInfo, StaffMember, DepreciationConfig, ThresholdProfile } from '../types';

export const INSURER_COMPANIES: InsurerInfo[] = [
  { code: 'dana', name: 'بیمه دانا', defaultPassword: '1234' },
  { code: 'alborz', name: 'بیمه البرز', defaultPassword: '1234' },
  { code: 'asia', name: 'بیمه آسیا', defaultPassword: '1234' },
  { code: 'iran', name: 'بیمه ایران', defaultPassword: '1234' },
  { code: 'mellat', name: 'بیمه ملت', defaultPassword: '1234' },
];

export const INITIAL_STAFF: Record<string, StaffMember[]> = {
  dana: [{ id: 'insd1', name: 'حسین یوسفی', role: 'اپراتور ارشد دانا' }, { id: 'insd2', name: 'زهرا صادقی', role: 'کارشناس پذیرش' }],
  alborz: [{ id: 'insa1', name: 'کاوه امینی', role: 'مدیر خسارت البرز' }, { id: 'insa2', name: 'لیلا فرهادی', role: 'اپراتور پورتال' }],
  asia: [{ id: 'insas1', name: 'بهنام رستمی', role: 'ارزیاب ارشد آسیا' }],
  iran: [{ id: 'insir1', name: 'شیوا محمدی', role: 'مسئول خسارت خودرو' }, { id: 'insir2', name: 'امیر صالحی', role: 'اپراتور ارشد' }],
  mellat: [{ id: 'insm1', name: 'نگار رحیمی', role: 'مدیر پورتال ملت' }],
};

export const INITIAL_EXPERTS: Record<string, StaffMember[]> = {
  dana: [
    { id: 'd1', name: 'محمد رضایی', role: 'کارشناس خسارت بدنه', phone: '09121001001', nationalId: '0011111111' },
    { id: 'd2', name: 'فاطمه احمدی', role: 'ارزیاب ارشد خسارت', phone: '09121001002', nationalId: '0022222222' },
  ],
  alborz: [
    { id: 'a1', name: 'سینا موسوی', role: 'کارشناس خسارت خودرو', phone: '09122002001', nationalId: '0033333333' },
    { id: 'a2', name: 'نرگس کریمی', role: 'ارزیاب خسارت مال', phone: '09122002002', nationalId: '0044444444' },
  ],
  asia: [
    { id: 'as1', name: 'علی حسینی', role: 'کارشناس ارشد خسارت', phone: '09123003001', nationalId: '0055555555' },
  ],
  iran: [
    { id: 'ir1', name: 'مریم نجفی', role: 'کارشناس خسارت', phone: '09124004001', nationalId: '0066666666' },
    { id: 'ir2', name: 'رضا تهرانی', role: 'ارزیاب ارشد بدنه', phone: '09124004002', nationalId: '0077777777' },
  ],
  mellat: [
    { id: 'm1', name: 'سارا قاسمی', role: 'کارشناس خسارت', phone: '09125005001', nationalId: '0088888888' },
  ],
};

export const INITIAL_FIELD_EXPERTS: Record<string, StaffMember[]> = {
  dana: [
    { id: 'fed1', name: 'کیوان عزیزی', role: 'کارشناس میدانی', phone: '09129001001', nationalId: '0099111111' },
    { id: 'fed2', name: 'شیرین باقری', role: 'کارشناس میدانی ارشد', phone: '09129001002', nationalId: '0099222222' },
  ],
  alborz: [
    { id: 'fea1', name: 'آرمان شفیعی', role: 'کارشناس میدانی', phone: '09129002001', nationalId: '0099333333' },
    { id: 'fea2', name: 'مینا اکبری', role: 'کارشناس میدانی ارشد', phone: '09129002002', nationalId: '0099444444' },
  ],
  asia: [
    { id: 'feas1', name: 'پویا رستگار', role: 'کارشناس میدانی', phone: '09129003001', nationalId: '0099555555' },
  ],
  iran: [
    { id: 'feir1', name: 'بابک کریمیان', role: 'کارشناس میدانی', phone: '09129004001', nationalId: '0099666666' },
    { id: 'feir2', name: 'ندا مرادی', role: 'کارشناس میدانی ارشد', phone: '09129004002', nationalId: '0099777777' },
  ],
  mellat: [
    { id: 'fem1', name: 'رامین شریفی', role: 'کارشناس میدانی', phone: '09129005001', nationalId: '0099888888' },
  ],
};

export const INITIAL_FINANCE_STAFF: Record<string, StaffMember[]> = {
  dana: [
    { id: 'fin-d1', name: 'مهرداد پاکزاد', role: 'مدیر مالی و خزانه‌داری', phone: '09123000001', nationalId: '0019999991' },
    { id: 'fin-d2', name: 'فرزانه شفیعی', role: 'کارشناس صدور اسناد و پایا', phone: '09123000006', nationalId: '0019999996' },
  ],
  alborz: [
    { id: 'fin-a1', name: 'ناهید صابر', role: 'رئیس حسابداری و پرداخت خسارت', phone: '09123000002', nationalId: '0019999992' },
  ],
  asia: [
    { id: 'fin-as1', name: 'فرهاد کمالی', role: 'مدیر خزانه‌داری و اعتبارات', phone: '09123000003', nationalId: '0019999993' },
  ],
  iran: [
    { id: 'fin-ir1', name: 'سعید انصاری', role: 'مدیر کل مالی بیمه ایران', phone: '09123000004', nationalId: '0019999994' },
  ],
  mellat: [
    { id: 'fin-m1', name: 'مریم بهرامی', role: 'مدیر امور مالی و بودجه', phone: '09123000005', nationalId: '0019999995' },
  ],
};

export const INITIAL_CRM_STAFF: Record<string, StaffMember[]> = {
  dana: [
    { id: 'crm-d1', name: 'سپیده معتمدی', role: 'سرپرست امور مشتریان و شکایات', phone: '09124000001', nationalId: '0028888881' },
    { id: 'crm-d2', name: 'حامد شایان', role: 'کارشناس پشتیبانی و ثبت تماس‌ها', phone: '09124000006', nationalId: '0028888886' },
  ],
  alborz: [
    { id: 'crm-a1', name: 'نوید جهانبخش', role: 'کارشناس ارشد پشتیبانی و CRM', phone: '09124000002', nationalId: '0028888882' },
  ],
  asia: [
    { id: 'crm-as1', name: 'الناز فروزان', role: 'مسئول رسیدگی به شکایات بیمه‌گذاران', phone: '09124000003', nationalId: '0028888883' },
  ],
  iran: [
    { id: 'crm-ir1', name: 'پیمان طاهری', role: 'رئیس مرکز تماس و ارتباط با مشتریان', phone: '09124000004', nationalId: '0028888884' },
  ],
  mellat: [
    { id: 'crm-m1', name: 'غزاله شمس', role: 'کارشناس ارشد CRM و رضایت‌سنجی', phone: '09124000005', nationalId: '0028888885' },
  ],
};

export const INITIAL_REVIEWERS: Record<string, StaffMember[]> = {
  dana: [
    { id: 'rvd1', name: 'حسین موحدی', role: 'بازبین ارشد دانا', phone: '09128001001', nationalId: '0088111111' },
    { id: 'rvd2', name: 'سمیرا نادری', role: 'بازبین کنترل کیفیت', phone: '09128001002', nationalId: '0088222222' },
  ],
  alborz: [
    { id: 'rva1', name: 'فرزاد تهرانی', role: 'بازبین ارشد البرز', phone: '09128002001', nationalId: '0088333333' },
    { id: 'rva2', name: 'لیلا صادقی', role: 'بازبین کنترل کیفیت', phone: '09128002002', nationalId: '0088444444' },
  ],
  asia: [
    { id: 'rvas1', name: 'کامران یوسفی', role: 'بازبین ارشد آسیا', phone: '09128003001', nationalId: '0088555555' },
  ],
  iran: [
    { id: 'rvir1', name: 'سعید رحیمی', role: 'بازبین ارشد ایران', phone: '09128004001', nationalId: '0088666666' },
    { id: 'rvir2', name: 'نرگس عابدی', role: 'بازبین کنترل کیفیت', phone: '09128004002', nationalId: '0088777777' },
  ],
  mellat: [
    { id: 'rvm1', name: 'امید فلاح', role: 'بازبین ارشد ملت', phone: '09128005001', nationalId: '0088888888' },
  ],
};

export const DEFAULT_DEPRECIATION_TABLES: Record<string, DepreciationConfig> = {
  dana: { y1: 5, y2: 10, y3: 15, y5: 25 },
  alborz: { y1: 5, y2: 10, y3: 15, y5: 25 },
  asia: { y1: 5, y2: 10, y3: 15, y5: 25 },
  iran: { y1: 5, y2: 10, y3: 15, y5: 25 },
  mellat: { y1: 5, y2: 10, y3: 15, y5: 25 },
};

export const DEFAULT_THRESHOLDS: Record<string, ThresholdProfile> = {
  dana: { minConfidence: 85, fraudSensitivity: 'متوسط', fastTrackCeiling: 50000000 },
  alborz: { minConfidence: 85, fraudSensitivity: 'متوسط', fastTrackCeiling: 50000000 },
  asia: { minConfidence: 85, fraudSensitivity: 'متوسط', fastTrackCeiling: 50000000 },
  iran: { minConfidence: 85, fraudSensitivity: 'متوسط', fastTrackCeiling: 50000000 },
  mellat: { minConfidence: 85, fraudSensitivity: 'متوسط', fastTrackCeiling: 50000000 },
};

export const INITIAL_CASES: ClaimCase[] = [
  {
    id: 'CF-3301-AS',
    date: '۱۴۰۵/۰۵/۱۴ ۱۱:۴۵',
    address: 'تهران، میدان ونک، خیابان ملاصدرا',
    lat: 35.7550,
    lng: 51.3980,
    victimName: 'رضا نوری',
    victimPhone: '09123334455',
    victimPlate: '۵۵-ج-۱۲۳۴۵-ایران-۱۱',
    victimVin: 'IRPEU301X882910',
    victimInsurer: 'iran',
    culpritName: 'محسن کریمی',
    culpritPhone: '09124445566',
    culpritPlate: '۲۲-د-۶۷۸۹۰-ایران-۲۲',
    culpritVin: 'IRSAMAND993021',
    culpritInsurer: 'alborz',
    carType: 'پژو ۳۰۱',
    culpritCarType: 'سمند LX',
    plate: '۵۵-ج-۱۲۳۴۵-ایران-۱۱',
    culpritPolicyNo: 'AL-1404-3301',
    culpritPolicyExpiry: '۱۴۰۶/۱۰/۰۱',
    culpritCoverageFinancial: 80000000,
    culpritCoverageBodily: 400000000,
    culpritCoverageDriver: 150000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'محول شده',
    priority: 'normal',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-330101',
    carDamageSpots: {
      front_bumper: {
        type: 'شکستگی و خراشیدگی عمیق',
        severity: 'minor',
        operation: 'صافکاری و نقاشی',
        color: 'yellow',
        note: 'سپر جلو از سمت راست دارای خط و خش عمیق و شکستگی موضعی دیاق است.',
        updatedAt: '۱۴۰۵/۰۵/۱۴'
      },
      hood: {
        type: 'دفرمگی و فرورفتگی',
        severity: 'moderate',
        operation: 'صافکاری بی‌رنگ (PDR)',
        color: 'orange',
        note: 'لبه جلوی کاپوت به طول ۲۰ سانتی‌متر دچار موج و فرورفتگی شده و با روش PDR قابل رفع است.',
        updatedAt: '۱۴۰۵/۰۵/۱۴'
      },
      door_fl: {
        type: 'له‌شدگی و پارگی ورق',
        severity: 'major',
        operation: 'تعویض کامل قطعه',
        color: 'red',
        note: 'پوسته درب راننده دچار دفرمگی شدید و تاب‌برداشتن کلاف داخلی گردیده و غیرقابل صافکاری است.',
        updatedAt: '۱۴۰۵/۰۵/۱۴'
      }
    },
    assignedExpert: {
      id: 'ir1',
      name: 'مریم نجفی',
      role: 'کارشناس خسارت خودرو',
      phone: '09124004001',
      nationalId: '0066666666'
    },
    history: [
      { status: 'محول شده', time: '۱۴۰۵/۰۵/۱۴ ۱۲:۰۰', user: 'اپراتور بیمه ایران', note: 'ارجاع به کارشناس مریم نجفی' }
    ],
    createdAt: '2026-08-04T11:45:00.000Z'
  },
  {
    id: 'CF-5502-EV',
    date: '۱۴۰۵/۰۵/۱۰ ۱۵:۱۰',
    address: 'تهران، بزرگراه همت، خروجی چمران',
    lat: 35.7480,
    lng: 51.3810,
    victimName: 'فرشته احمدی',
    victimPhone: '09125556677',
    victimPlate: '۷۷-ب-۸۸۹۹۰-ایران-۴۴',
    victimVin: 'IR207W8829103',
    victimInsurer: 'iran',
    culpritName: 'سعید رضایی',
    culpritPhone: '09126667788',
    culpritPlate: '۱۱-ج-۳۳۴۴۵-ایران-۵۵',
    culpritVin: 'IRQUICK994821',
    culpritInsurer: 'dana',
    carType: 'پژو ۲۰۷',
    culpritCarType: 'کوییک s',
    plate: '۷۷-ب-۸۸۹۹۰-ایران-۴۴',
    culpritPolicyNo: 'DN-1403-5502',
    culpritPolicyExpiry: '۱۴۰۶/۰۷/۱۵',
    culpritCoverageFinancial: 50000000,
    culpritCoverageBodily: 300000000,
    culpritCoverageDriver: 100000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'ارزیابی شده',
    priority: 'high',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-550202',
    carDamageSpots: {
      rear_bumper: {
        type: 'شکستگی و ریزش رنگ',
        severity: 'major',
        operation: 'تعویض کامل قطعه',
        color: 'red',
        note: 'پوسته سپر عقب به همراه دیاق و سنسور دنده عقب کاملاً شکسته است.',
        updatedAt: '۱۴۰۵/۰۵/۱۰'
      },
      trunk: {
        type: 'فرورفتگی لبه پایین',
        severity: 'minor',
        operation: 'صافکاری بی‌رنگ (PDR)',
        color: 'yellow',
        note: 'لبه زیرین درب صندوق دچار دفرمگی خفیف شده است.',
        updatedAt: '۱۴۰5/۰۵/۱۰'
      }
    },
    assessment: {
      version: 'A-1.0',
      gross: 12000000,
      deductions: 1000000,
      salvage: 0,
      payable: 11000000,
      status: 'PUBLISHED',
      reviewerNote: 'ارزیابی نهایی تایید شد.',
      submittedBy: 'سیستم AI',
      submittedAt: '۱۴۰۵/۰۵/۱۰ ۱۵:۳۰',
      parts: [
        { name: 'سپر عقب', type: 'repair', partPrice: 0, repairPrice: 11000000, salvageNeeded: false, salvageValue: 0 }
      ]
    },
    history: [
      { status: 'ارزیابی شده', time: '۱۴۰۵/۰۵/۱۰ ۱۵:۳۰', user: 'ارزیاب', note: 'تکمیل برآورد و تایید خسارت' }
    ],
    createdAt: '2026-08-03T15:10:00.000Z'
  },
  {
    id: 'CF-7703-PD',
    date: '۱۴۰۵/۰۵/۰۱ ۰۸:۲۰',
    address: 'تهران، خیابان شریعتی، بالاتر از پل رومی',
    lat: 35.7920,
    lng: 51.4390,
    victimName: 'امیر مرادی',
    victimPhone: '09127778899',
    victimPlate: '۸۸-ط-۱۱۲۲۳-ایران-۶۶',
    victimVin: 'IRTARA9930291',
    victimInsurer: 'iran',
    culpritName: 'داوود قاسمی',
    culpritPhone: '09128889900',
    culpritPlate: '۳۳-ب-۴۴۵۵۶-ایران-۷۷',
    culpritVin: 'IR206W112233',
    culpritInsurer: 'asia',
    carType: 'تارا',
    culpritCarType: 'پژو ۲۰۶',
    plate: '۸۸-ط-۱۱۲۲۳-ایران-۶۶',
    culpritPolicyNo: 'AS-1403-7703',
    culpritPolicyExpiry: '۱۴۰۶/۰۶/۲۰',
    culpritCoverageFinancial: 70000000,
    culpritCoverageBodily: 400000000,
    culpritCoverageDriver: 120000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'پرداخت شده',
    priority: 'normal',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-770303',
    payoutState: 'PAID',
    payoutInfo: {
      beneficiary: 'امیر مرادی',
      nationalId: '0055443322',
      iban: 'IR660170000000099887766554',
      verification: 'VERIFIED'
    },
    history: [
      { status: 'پرداخت شده', time: '۱۴۰۵/۰۵/۰2 ۱۰:۰۰', user: 'سیستم پایا بانکی', note: 'واریز موفق خسارت به حساب شبا' }
    ],
    createdAt: '2026-08-01T08:20:00.000Z'
  },
  {
    id: 'CF-2204-FX',
    date: '۱۴۰۵/۰۵/۱۱ ۱۴:۰۵',
    address: 'تهران، خیابان آزادی، استاد معین',
    lat: 35.7010,
    lng: 51.3480,
    victimName: 'حسین اکبری',
    victimPhone: '09129990011',
    victimPlate: '۹۹-ج-۵۵۶۶۷-ایران-۸۸',
    victimVin: 'IRRUNNA882910',
    victimInsurer: 'iran',
    culpritName: 'یونس رحیمی',
    culpritPhone: '09120001122',
    culpritPlate: '۴۴-ب-۷۷۸۸۹-ایران-۹۹',
    culpritVin: 'IRPRIDE994821',
    culpritInsurer: 'parsian',
    carType: 'رانا پلاس',
    culpritCarType: 'پراید ۱۳۱',
    plate: '۹۹-ج-۵۵۶۶۷-ایران-۸۸',
    culpritPolicyNo: 'PR-1403-2204',
    culpritPolicyExpiry: '۱۴۰۶/۰۴/۱۰',
    culpritCoverageFinancial: 50000000,
    culpritCoverageBodily: 300000000,
    culpritCoverageDriver: 100000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'نیازمند اصلاح مشتری',
    priority: 'normal',
    approved: false,
    hasKroki: false,
    history: [
      { status: 'نیازمند اصلاح مشتری', time: '۱۴۰۵/۰۵/۱۱ ۱۴:۳۰', user: 'ارزیاب', note: 'عکس‌های زوایای جانبی تار می‌باشند، لطفاً مجدداً بارگذاری کنید.' }
    ],
    createdAt: '2026-08-02T14:05:00.000Z'
  },
  {
    id: 'CF-1105-RJ',
    date: '۱۴۰۵/۰۵/۰۹ ۰۹:۱۵',
    address: 'تهران، تهرانپارس، فلکه دوم',
    lat: 35.7320,
    lng: 51.5290,
    victimName: 'نرگس موسوی',
    victimPhone: '09121114455',
    victimPlate: '۱۱-الف-۲۲۳۳۴-ایران-۱۲',
    victimVin: 'IRDENA11223344',
    victimInsurer: 'iran',
    culpritName: 'کامران بهرامی',
    culpritPhone: '09122225566',
    culpritPlate: '۶۶-ج-۷۷۸۸۹-ایران-۳۴',
    culpritVin: 'IRPEU206883920',
    culpritInsurer: 'pasargad',
    carType: 'دنا توربو',
    culpritCarType: 'پژو ۲۰۶',
    plate: '۱۱-الف-۲۲۳۳۴-ایران-۱۲',
    culpritPolicyNo: 'PS-1403-1105',
    culpritPolicyExpiry: '۱۴۰۶/۰۳/۰۱',
    culpritCoverageFinancial: 50000000,
    culpritCoverageBodily: 300000000,
    culpritCoverageDriver: 100000000,
    culpritPolicyVerified: false,
    victimPolicyVerified: true,
    culpritFaultPercent: 0,
    status: 'رد شده',
    priority: 'high',
    approved: false,
    hasKroki: true,
    history: [
      { status: 'رد شده', time: '۱۴۰۵/۰۵/۰۹ ۱۰:۰۰', user: 'بازبین بیمه ایران', note: 'عدم تطابق خسارت ادعایی با زمان و زوایای حادثه (مشمول بند عدم پوشش).' }
    ],
    createdAt: '2026-08-01T09:15:00.000Z'
  },
  {
    id: 'CF-6606-VP',
    date: '۱۴۰۵/۰۵/۱۵ ۱۶:۴۰',
    address: 'تهران، سعادت آباد، خیابان سرو غربی',
    lat: 35.7820,
    lng: 51.3710,
    victimName: 'سهراب سپهری',
    victimPhone: '09123336677',
    victimPlate: '۳۳-ج-۴۴۵۵۶-ایران-۵۵',
    victimVin: 'IR207W990011',
    victimInsurer: 'iran',
    culpritName: 'نیما یوشیج',
    culpritPhone: '09124447788',
    culpritPlate: '۷۷-د-۸۸۹۹۰-ایران-۶۶',
    culpritVin: 'IRSAMAND556677',
    culpritInsurer: 'mellat',
    carType: 'پژو ۲۰۷',
    culpritCarType: 'سمند سورن',
    plate: '۳۳-ج-۴۴۵۵۶-ایران-۵۵',
    culpritPolicyNo: 'ML-1403-6606',
    culpritPolicyExpiry: '۱۴۰۶/۱۱/۰۵',
    culpritCoverageFinancial: 60000000,
    culpritCoverageBodily: 400000000,
    culpritCoverageDriver: 120000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'انتظار تایید زیان‌دیده',
    priority: 'normal',
    approved: true,
    hasKroki: true,
    history: [
      { status: 'انتظار تایید زیان‌دیده', time: '۱۴۰۵/۰۵/۱۵ ۱۷:۰۰', user: 'سیستم AI', note: 'ارسال اعلان تایید برآورد اولیه برای زیان‌دیده' }
    ],
    createdAt: '2026-08-05T16:40:00.000Z'
  },
  {
    id: 'CF-8875-X0',
    date: '۱۴۰۵/۰۵/۰۶ ۱۰:۰۲',
    address: 'شهید گمنام، تختی، ناحیه ۴، منطقه ۶ تهران',
    lat: 35.7312,
    lng: 51.4110,
    victimName: 'پریسا حسینی',
    victimPhone: '09123456789',
    victimPlate: '۳۴-ب-۱۲۳۴۵-ایران-۷۷',
    victimVin: 'IRDENA88392019482',
    victimInsurer: 'iran',
    culpritName: 'علیرضا صادقی',
    culpritPhone: '09129876543',
    culpritPlate: '۷۸-ج-۹۸۷۶۵-ایران-۲۲',
    culpritVin: 'IR206W99482103829',
    culpritInsurer: 'alborz',
    carType: 'دنا پلاس',
    culpritCarType: 'پژو ۲۰۶',
    plate: '۳۴-ب-۱۲۳۴۵-ایران-۷۷',
    culpritPolicyNo: 'AL-1403-883',
    culpritPolicyExpiry: '۱۴۰۶/۰۵/۲۰',
    culpritCoverageFinancial: 50000000,
    culpritCoverageBodily: 300000000,
    culpritCoverageDriver: 100000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'در انتظار ارجاع',
    priority: 'high',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-887501',
    history: [
      { status: 'ثبت اولیه پرونده', time: '۱۴۰۵/۰۵/۰۶ ۱۰:۰۲', user: 'پریسا حسینی', note: 'ثبت حادثه و مدارک تصادف' },
      { status: 'در انتظار ارجاع', time: '۱۴۰۵/۰۵/۰۶ ۱۰:۱۵', user: 'سیستم AI', note: 'آماده تخصیص به ارزیاب بیمه ایران' }
    ],
    createdAt: '2026-08-06T10:02:00.000Z'
  },
  {
    id: 'CF-1174-BX',
    date: '۱۴۰۵/۰۵/۱۳ ۰۹:۲۳',
    address: 'دانشگاه جنگ، حر، منطقه ۱۱ شهرداری تهران',
    lat: 35.6880,
    lng: 51.3910,
    victimName: 'پریسا حسینی',
    victimPhone: '09123456789',
    victimPlate: '۱۲-ب-۳۴۵۶۷-ایران-۸۹',
    victimVin: 'IR206W88392019482',
    victimInsurer: 'iran',
    culpritName: 'کامران امیری',
    culpritPhone: '09121113355',
    culpritPlate: '۴۵-ج-۷۸۹۱۲-ایران-۳۳',
    culpritVin: 'IRPARS99482103829',
    culpritInsurer: 'dana',
    carType: 'پژو ۲۰۶',
    culpritCarType: 'پژو پارس',
    plate: '۱۲-ب-۳۴۵۶۷-ایران-۸۹',
    culpritPolicyNo: 'DN-1403-1174',
    culpritPolicyExpiry: '۱۴۰۶/۰۸/۱۰',
    culpritCoverageFinancial: 60000000,
    culpritCoverageBodily: 400000000,
    culpritCoverageDriver: 120000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'انتظار تایید مقصر',
    priority: 'normal',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-117402',
    history: [
      { status: 'ثبت اولیه پرونده', time: '۱۴۰۵/۰۵/۱۳ ۰۹:۲۳', user: 'پریسا حسینی', note: 'ثبت حادثه در انتظار تایید مقصر' }
    ],
    createdAt: '2026-08-05T09:23:00.000Z'
  },
  {
    id: 'CF-8382-YZ',
    date: '۱۴۰۳/۰۵/۲۱ ۱۴:۳۰',
    address: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲۴',
    lat: 35.7592,
    lng: 51.4089,
    victimName: 'مهدی کشاورز',
    victimPhone: '09123456789',
    victimPlate: '۱۲-ب-۳۴۵۶۷-ایران-۸۹',
    victimVin: 'IR206W88392019482',
    victimInsurer: 'dana',
    culpritName: 'رضا احمدی',
    culpritPhone: '09129876543',
    culpritPlate: '۴۵-ج-۷۸۹۱۲-ایران-۳۳',
    culpritVin: 'IRPARS99482103829',
    culpritInsurer: 'alborz',
    carType: 'پژو ۲۰۶',
    culpritCarType: 'پژو پارس',
    plate: '۱۲-ب-۳۴۵۶۷-ایران-۸۹',
    culpritPolicyNo: 'AL-1401-883',
    culpritPolicyExpiry: '۱۴۰۶/۰۵/۲۰',
    culpritCoverageFinancial: 50000000,
    culpritCoverageBodily: 300000000,
    culpritCoverageDriver: 100000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'در حال ارزیابی',
    priority: 'high',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-994821',
    assignedExpert: {
      id: 'a1',
      name: 'سینا موسوی',
      role: 'کارشناس خسارت خودرو',
      phone: '09122002001',
      nationalId: '0033333333'
    },
    assignedReviewer: {
      id: 'rva1',
      name: 'فرزاد تهرانی',
      role: 'بازبین ارشد البرز',
      company: 'alborz'
    },
    expertAcceptance: 'now',
    assessment: {
      version: 'A-1.0',
      gross: 18500000,
      deductions: 1500000,
      salvage: 0,
      payable: 17000000,
      status: 'REVIEWED',
      reviewerNote: 'خسارت شامل رنگ‌آمیزی سپر جلو و صافکاری جزئی درب چپ جلو می‌باشد.',
      submittedBy: 'سینا موسوی',
      submittedAt: '۱۴۰۳/۰۵/۲۱ ۱۶:۰۰',
      parts: [
        { name: 'سپر جلو', type: 'repair', partPrice: 0, repairPrice: 8500000, salvageNeeded: false, salvageValue: 0 },
        { name: 'درب جلو چپ', type: 'repair', partPrice: 0, repairPrice: 10000000, salvageNeeded: false, salvageValue: 0 }
      ]
    },
    aiDecisions: [
      {
        findingId: 'front_bumper',
        label: 'سپر جلو',
        part: 'سپر جلو',
        type: 'خراش و سایش رنگ',
        severity: '۲ از ۵',
        operation: 'رنگ‌آمیزی',
        confidence: 'بالا',
        explanation: 'ناحیه آسیب در تصاویر کادربندی‌شده با رنگ‌آمیزی قابل ترمیم است.',
        decision: 'APPROVED',
        price: 8500000
      },
      {
        findingId: 'left_front_door',
        label: 'درب جلو چپ',
        part: 'درب جلو چپ',
        type: 'فرورفتگی سطح بـدنه',
        severity: '۳ از ۵',
        operation: 'صافکاری و نقاشی',
        confidence: 'بالا',
        explanation: 'فرورفتگی با الگوی برخورد جانبی تطابق دارد.',
        decision: 'EDITED',
        price: 10000000
      }
    ],
    payoutState: 'VALIDATION_PENDING',
    payoutInfo: {
      beneficiary: 'مهدی کشاورز',
      nationalId: '0012345678',
      iban: 'IR820540102680020817909002',
      verification: 'VERIFIED'
    },
    policeReport: {
      code: 'KR-994821',
      officerName: 'سروان رضایی',
      officerCode: 'P-4471',
      unit: 'کلانتری ۱۲ تهران',
      submittedAt: '۱۴۰۳/۰۵/۲۱ ۱۵:۰۰',
      noFaultDetermined: false,
      description: 'برخورد خودروی پژو پارس از عقب با خودروی پژو ۲۰۶ متوقف در پشت چراغ قرمز. عدم رعایت فاصله طولی از سوی راننده پژو پارس.',
      photos: []
    },
    history: [
      { status: 'ایجاد شده', time: '۱۴۰۳/۰۵/۲۱ ۱۴:۳۰', user: 'مهدی کشاورز', note: 'ثبت اولیه حادثه در سامانه' },
      { status: 'در انتظار ارجاع به ارزیاب', time: '۱۴۰۳/۰۵/۲۱ ۱۵:۰۵', user: 'سروان رضایی', note: 'ثبت کروکی رسمی توسط راهور' },
      { status: 'محول شده به کارشناس', time: '۱۴۰۳/۰۵/۲۱ ۱۵:۲۰', user: 'اپراتور البرز', note: 'ارجاع به کارشناس سینا موسوی' },
      { status: 'در حال ارزیابی', time: '۱۴۰۳/۰۵/۲۱ ۱۵:۳۰', user: 'سینا موسوی', note: 'شروع بررسی شواهد و نظر AI' }
    ],
    createdAt: '2026-08-08T10:30:00.000Z'
  },
  {
    id: 'CF-4920-AB',
    date: '۱۴۰۳/۰۵/۲۰ ۱۰:۱۵',
    address: 'اصفهان، خیابان چهارباغ عباسی، روبروی هتل عباسی',
    lat: 32.6546,
    lng: 51.6680,
    victimName: 'سارا تهرانی',
    victimPhone: '09121112233',
    victimPlate: '۶۷-س-۱۲۳۴۵-ایران-۱۳',
    victimVin: 'IRSAMAND88391204',
    victimInsurer: 'iran',
    culpritName: 'امیرحسین عباسی',
    culpritPhone: '09132223344',
    culpritPlate: '۸۸-ج-۹۸۷۶۵-ایران-۵۳',
    culpritVin: 'IRDENA993821039',
    culpritInsurer: 'iran',
    carType: 'سمند LX',
    culpritCarType: 'دنا پلاس',
    plate: '۶۷-س-۱۲۳۴۵-ایران-۱۳',
    culpritPolicyNo: 'IR-1402-4411',
    culpritPolicyExpiry: '۱۴۰۶/۰۹/۱۰',
    culpritCoverageFinancial: 100000000,
    culpritCoverageBodily: 400000000,
    culpritCoverageDriver: 150000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'در انتظار پرداخت',
    priority: 'normal',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-102938',
    assignedExpert: {
      id: 'ir1',
      name: 'مریم نجفی',
      role: 'کارشناس خسارت',
      phone: '09124004001',
      nationalId: '0066666666'
    },
    assessment: {
      version: 'A-1.0',
      gross: 24000000,
      deductions: 2000000,
      salvage: 0,
      payable: 22000000,
      status: 'PUBLISHED',
      reviewerNote: 'خسارت تعویض چراغ عقب و صافکاری گلگیر عقب سمند.',
      submittedBy: 'مریم نجفی',
      submittedAt: '۱۴۰۳/۰۵/۲۰ ۱۲:۰۰',
      parts: [
        { name: 'چراغ عقب', type: 'replace', partPrice: 12000000, repairPrice: 0, salvageNeeded: true, salvageValue: 1000000 },
        { name: 'گلگیر عقب چپ', type: 'repair', partPrice: 0, repairPrice: 11000000, salvageNeeded: false, salvageValue: 0 }
      ]
    },
    decisionState: 'ACCEPTED',
    payoutState: 'READY',
    payoutInfo: {
      beneficiary: 'سارا تهرانی',
      nationalId: '0011223344',
      iban: 'IR980120000000012345678901',
      verification: 'VERIFIED'
    },
    history: [
      { status: 'در انتظار پرداخت', time: '۱۴۰۳/۰۵/۲۰ ۱۴:۰۰', user: 'سارا تهرانی', note: 'تایید ارزیابی و ثبت شبا جهت دریافت خسارت' }
    ],
    createdAt: '2026-08-07T06:15:00.000Z'
  },
  {
    id: 'CF-9912-KC',
    date: '۱۴۰۳/۰۵/۱۹ ۱۸:۴۵',
    address: 'کرج، عظیمیه، میدان طالقانی',
    lat: 35.8327,
    lng: 50.9915,
    victimName: 'علی پورمند',
    victimPhone: '09351234567',
    victimPlate: '۳۳-د-۶۵۴۳۲-ایران-۶۸',
    victimVin: 'IRTARA88291039',
    victimInsurer: 'asia',
    culpritName: 'حسین نوری',
    culpritPhone: '09127778899',
    culpritPlate: '۱۲-ط-۴۴۳۲۱-ایران-۲۱',
    culpritVin: 'IR207W9948123',
    culpritInsurer: 'asia',
    carType: 'تارا اتوماتیک',
    culpritCarType: 'پژو ۲۰۷',
    plate: '۳۳-د-۶۵۴۳۲-ایران-۶۸',
    culpritPolicyNo: 'AS-1402-9901',
    culpritPolicyExpiry: '۱۴۰۶/۰۳/۱۵',
    culpritCoverageFinancial: 50000000,
    culpritCoverageBodily: 300000000,
    culpritCoverageDriver: 100000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 50,
    status: 'تصادف ۵۰-۵۰ — پیگیری از بیمه بدنه طرفین',
    priority: 'normal',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-778811',
    policeReport: {
      code: 'KR-778811',
      officerName: 'سرهنگ ادواردی',
      officerCode: 'P-5561',
      unit: 'پلیس راهور کرج',
      submittedAt: '۱۴۰۳/۰۵/۱۹ ۱۹:۳۰',
      noFaultDetermined: false,
      description: 'تصادف ۵۰-۵۰ در میدان. هر دو راننده در رعایت حق تقدم ورود به میدان مرتکب تقصیر همزمان شده‌اند.',
      photos: []
    },
    history: [
      { status: 'تصادف ۵۰-۵۰ — پیگیری از بیمه بدنه طرفین', time: '۱۴۰۳/۰۵/۱۹ ۱۹:۳۰', user: 'سرهنگ ادواردی', note: 'ثبت کروکی ۵۰-۵۰. ارجاع مستقیم طرفین به بیمه بدنه خود.' }
    ],
    createdAt: '2026-08-06T14:45:00.000Z'
  },
  {
    id: 'CF-4491-RB',
    date: '۱۴۰۵/۰۵/۱۶ ۰۹:۱۵',
    address: 'تهران، خیابان پاسداران، روبروی بوستان علوی',
    lat: 35.7720,
    lng: 51.4610,
    victimName: 'علیرضا اسماعیلی',
    victimPhone: '09121118899',
    victimPlate: '۳۳-ج-۹۹۸۸۷-ایران-۱۱',
    victimVin: 'IR207W8849201',
    victimInsurer: 'dana',
    culpritName: 'مهرداد کرمی',
    culpritPhone: '09123334411',
    culpritPlate: '۷۷-ب-۱۱۲۲۳-ایران-۲۲',
    culpritVin: 'IRDENA9948120',
    culpritInsurer: 'dana',
    carType: 'پژو ۲۰۷i',
    culpritCarType: 'دنا پلاس',
    plate: '۳۳-ج-۹۹۸۸۷-ایران-۱۱',
    culpritPolicyNo: 'DN-1403-4491',
    culpritPolicyExpiry: '۱۴۰۶/۰۹/۰۱',
    culpritCoverageFinancial: 80000000,
    culpritCoverageBodily: 400000000,
    culpritCoverageDriver: 120000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'در انتظار تایید کاربر',
    priority: 'high',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-449101',
    assignedExpert: {
      id: 'd2',
      name: 'فاطمه احمدی',
      role: 'کارشناس رسمی خسارت خودرو',
      phone: '09123003002',
      nationalId: '0055555555'
    },
    previousAssessorIds: ['d1'],
    previousAssignedExpert: {
      id: 'd1',
      name: 'حسین رضایی',
      role: 'کارشناس خسارت خودرو'
    },
    assessments: [
      {
        round: 'ارزیابی کارشناس اول',
        roundIdx: 1,
        expertName: 'حسین رضایی',
        submittedAt: '۱۴۰۵/۰۵/۱۶ ۱۱:۳۰',
        gross: 18000000,
        deductions: 1500000,
        salvage: 500000,
        payable: 16000000,
        reviewerNote: 'خسارت شامل رنگ‌آمیزی سپر عقب و تعویض چراغ خطر. با تعویض درب صندوق مخالفت شد (مشمول صافکاری).',
        parts: [
          { name: 'سپر عقب', type: 'repair', partPrice: 0, repairPrice: 6500000, salvageNeeded: false, salvageValue: 0 },
          { name: 'چراغ خطر عقب راست', type: 'replace', partPrice: 6500000, repairPrice: 1000000, salvageNeeded: true, salvageValue: 500000 },
          { name: 'درب صندوق عقب', type: 'repair', partPrice: 0, repairPrice: 5000000, salvageNeeded: false, salvageValue: 0 }
        ],
        status: 'REJECTED'
      },
      {
        round: 'ارزیابی کارشناس دوم (اعتراض)',
        roundIdx: 2,
        expertName: 'فاطمه احمدی',
        submittedAt: '۱۴۰۵/۰۵/۱۶ ۱۴:۴۵',
        gross: 29500000,
        deductions: 2000000,
        salvage: 1500000,
        payable: 26000000,
        reviewerNote: 'پس از بررسی مجدد و ملاحظه عکس‌های باکیفیت‌تر، شکستگی پایه‌های سپر عقب و دفرمگی جدی درب صندوق تایید شد؛ لذا تعویض پوسته سپر و رنگ‌آمیزی درب صندوق اعمال گردید.',
        parts: [
          { name: 'پوسته سپر عقب', type: 'replace', partPrice: 13500000, repairPrice: 3500000, salvageNeeded: true, salvageValue: 1500000 },
          { name: 'چراغ خطر عقب راست', type: 'replace', partPrice: 6500000, repairPrice: 1000000, salvageNeeded: false, salvageValue: 0 },
          { name: 'درب صندوق عقب', type: 'repair', partPrice: 0, repairPrice: 9500000, salvageNeeded: false, salvageValue: 0 }
        ],
        status: 'SUBMITTED'
      }
    ],
    assessment: {
      version: 'A-2.0',
      gross: 29500000,
      deductions: 2000000,
      salvage: 1500000,
      payable: 26000000,
      status: 'PUBLISHED',
      reviewerNote: 'ارزیابی مرحله دوم توسط سرکار خانم احمدی تایید و جهت ابلاغ نهایی به زیان‌دیده آماده شد.',
      submittedBy: 'فاطمه احمدی',
      submittedAt: '۱۴۰۵/۰۵/۱۶ ۱۴:۴۵',
      parts: [
        { name: 'پوسته سپر عقب', type: 'replace', partPrice: 13500000, repairPrice: 3500000, salvageNeeded: true, salvageValue: 1500000 },
        { name: 'چراغ خطر عقب راست', type: 'replace', partPrice: 6500000, repairPrice: 1000000, salvageNeeded: false, salvageValue: 0 },
        { name: 'درب صندوق عقب', type: 'repair', partPrice: 0, repairPrice: 9500000, salvageNeeded: false, salvageValue: 0 }
      ]
    },
    history: [
      { status: 'ثبت اولیه پرونده', time: '۱۴۰۵/۰۵/۱۶ ۰۹:۱۵', user: 'علیرضا اسماعیلی', note: 'ثبت پرونده با کروکی آنلاین' },
      { status: 'ارزیابی شده', time: '۱۴۰۵/۰۵/۱۶ ۱۱:۳۰', user: 'حسین رضایی', note: 'ثبت ارزیابی مرحله اول' },
      { status: 'اعتراض به ارزیابی اول', time: '۱۴۰۵/۰۵/۱۶ ۱۲:۱۵', user: 'علیرضا اسماعیلی', note: 'اعتراض به عدم پذیرش تعویض سپر' },
      { status: 'ارجاع به ارزیاب دوم', time: '۱۴۰۵/۰۵/۱۶ ۱۳:۰۰', user: 'پورتال بیمه گر', note: 'ارجاع پرونده معترض‌عنه به کارشناس دوم (فاطمه احمدی)' },
      { status: 'در انتظار تایید کاربر', time: '۱۴۰۵/۰۵/۱۶ ۱۴:۴۵', user: 'فاطمه احمدی', note: 'ثبت و تایید برآورد نهایی مرحله دوم' }
    ],
    createdAt: '2026-08-06T09:15:00.000Z'
  }
];

export const INITIAL_EXPERT_COMPLAINTS: import('../types').ExpertComplaint[] = [
  {
    id: 'CMP-101',
    expertId: 'd2',
    expertName: 'فاطمه احمدی',
    caseId: 'CF-3301-AS',
    complainantName: 'رضا کریمی (زیان‌دیده)',
    complainantRole: 'زیان‌دیده',
    reasonCategory: 'مبلغ برآورد ناچیز',
    description: 'کارشناس ارزیاب هزینه تعویض سپر و اجرت رنگ‌آمیزی را کمتر از فاکتور رسمی نمایندگی مجاز برآورد کرده است.',
    filedAt: '۱۴۰۳/۰۵/۱۵ ۱۰:۳۰',
    status: 'تایید شده (ثبت در پرونده)',
    impactPoints: 18
  },
  {
    id: 'CMP-102',
    expertId: 'd2',
    expertName: 'فاطمه احمدی',
    caseId: 'CF-4102-IR',
    complainantName: 'مریم تهرانی (زیان‌دیده)',
    complainantRole: 'زیان‌دیده',
    reasonCategory: 'تأخیر در پاسخگویی',
    description: 'ارزیابی پرونده پس از ارجاع بیش از ۳ روز بلاتکلیف مانده و پاسخگویی به تماس انجام نگرفته است.',
    filedAt: '۱۴۰۳/۰۵/۱۸ ۱۴:۲۰',
    status: 'تایید شده (ثبت در پرونده)',
    impactPoints: 15
  },
  {
    id: 'CMP-103',
    expertId: 'ir2',
    expertName: 'رضا تهرانی',
    caseId: 'CF-9921-IR',
    complainantName: 'حسین نوری (زیان‌دیده)',
    complainantRole: 'زیان‌دیده',
    reasonCategory: 'عدم بررسی دقیق قطعات',
    description: 'صدمه شدید به شاسی و سینی عقب در نظریه کارشناسی اولیه لحاظ نشده بود.',
    filedAt: '۱۴۰۳/۰۵/۱۰ ۰۹:۱۵',
    status: 'تایید شده (ثبت در پرونده)',
    impactPoints: 20
  },
  {
    id: 'CMP-104',
    expertId: 'ir2',
    expertName: 'رضا تهرانی',
    caseId: 'CF-8802-IR',
    complainantName: 'تعمیرگاه مجاز کد ۴',
    complainantRole: 'تعمیرگاه',
    reasonCategory: 'مبلغ برآورد ناچیز',
    description: 'کاهش شدید قیمت قطعه اصلی شرکتی در تاییدیه ارزیاب نسبت به تعرفه بازار.',
    filedAt: '۱۴۰۳/۰۵/۱۲ ۱۶:۴۵',
    status: 'تایید شده (ثبت در پرونده)',
    impactPoints: 18
  },
  {
    id: 'CMP-105',
    expertId: 'a2',
    expertName: 'نرگس کریمی',
    caseId: 'CF-7711-AL',
    complainantName: 'احمد رسولی (زیان‌دیده)',
    complainantRole: 'زیان‌دیده',
    reasonCategory: 'برخورد نامناسب',
    description: 'عدم ارائه توضیحات شفاف در خصوص کسر استهلاک قطعات به زیان‌دیده.',
    filedAt: '۱۴۰۳/۰۵/۰۸ ۱۱:۰۰',
    status: 'تایید شده (ثبت در پرونده)',
    impactPoints: 12
  }
];

export const sampleCroquis = [
  {
    title: 'کروکی کاغذی معتبر - تصادف شهری (بزرگراه همت)',
    fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000',
    isValid: true,
    confidence: 0.96,
    reportNumber: 'CRQ-1403-88492',
    incidentDate: '1403/05/12',
    location: 'تهران - بزرگراه همت غرب به شرق، قبل از خروجی چمران',
    faultDriver: {
      fullName: 'علی محمدی',
      nationalId: '0012345678',
      plateNumber: '۶۸ ج ۴۵۱ - ایران ۲۲',
      insurancePolicyNumber: 'POL-99482716'
    },
    victimDriver: {
      fullName: 'رضا احمدی',
      nationalId: '1234567890',
      plateNumber: '۱۲ ب ۳۴۵ - ایران ۱۱',
      insurancePolicyNumber: 'POL-10029384'
    },
    policeBadgeId: 'POLICE-9821',
    hasOfficialStamp: true
  },
  {
    title: 'کروکی الکترونیکی - تصادف جاده‌ای (محور کرج - چالوس)',
    fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=1000',
    isValid: true,
    confidence: 0.99,
    reportNumber: 'CRQ-1403-91204',
    incidentDate: '1403/05/15',
    location: 'جاده کرج - چالوس، کیلومتر ۱۵، محدوده سد کرج',
    faultDriver: {
      fullName: 'حسین حسینی',
      nationalId: '0087654321',
      plateNumber: '۳۳ ص ۸۹۱ - ایران ۶۸',
      insurancePolicyNumber: 'POL-33219847'
    },
    victimDriver: {
      fullName: 'رضا احمدی',
      nationalId: '1234567890',
      plateNumber: '۱۲ ب ۳۴۵ - ایران ۱۱',
      insurancePolicyNumber: 'POL-10029384'
    },
    policeBadgeId: 'POLICE-4412',
    hasOfficialStamp: true
  },
  {
    title: 'کروکی مشکوک - مهر نامشخص / فاقد تاییدیه انتظامی',
    fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1000',
    isValid: false,
    confidence: 0.42,
    reportNumber: 'CRQ-1403-00129',
    incidentDate: '1403/05/10',
    location: 'تهران - خیابان ولیعصر، بالاتر از پارک ساعی',
    faultDriver: {
      fullName: 'نامشخص (دست‌نویس ناخوانا)',
      nationalId: '0000000000',
      plateNumber: 'نامشخص',
      insurancePolicyNumber: 'نامشخص'
    },
    victimDriver: {
      fullName: 'رضا احمدی',
      nationalId: '1234567890',
      plateNumber: '۱۲ ب ۳۴۵ - ایران ۱۱',
      insurancePolicyNumber: 'POL-10029384'
    },
    policeBadgeId: 'POLICE-???',
    hasOfficialStamp: false
  }
];

