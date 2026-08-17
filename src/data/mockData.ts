import { ClaimCase, InsurerInfo, StaffMember, DepreciationConfig, ThresholdProfile } from '../types';

export const INSURER_COMPANIES: InsurerInfo[] = [
  {
    code: 'dana',
    name: 'بیمه دانا',
    defaultPassword: '1234',
    brandColor: 'blue',
    licenseNumber: 'LIC-DAN-1353',
    sanhabCode: 'SNH-DANA-9080',
    phone: '۰۲۱-۸۸۷۷۶۶۵۵',
    email: 'info@dana-insurance.ir',
    address: 'تهران، میدان ونک، خیابان گاندی جنوبی، پلاک ۱۲',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 400000000,
    onlineWithCroquiCeiling: 1200000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 48,
    establishedYear: '۱۳۵۳',
    description: 'یکی از بزرگترین شرکت‌های بیمه کشور با بالاترین سطح توانگری مالی و خدمات الکترونیک خسارت'
  },
  {
    code: 'iran',
    name: 'بیمه ایران',
    defaultPassword: '1234',
    brandColor: 'amber',
    licenseNumber: 'LIC-IRN-1314',
    sanhabCode: 'SNH-IRAN-1001',
    phone: '۰۲۱-۸۶۷۲۱۰۰۰',
    email: 'support@iraninsurance.ir',
    address: 'تهران، میدان فاطمی، خیابان جویبار، کوچه غفاری، پلاک ۲',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 500000000,
    onlineWithCroquiCeiling: 2000000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 120,
    establishedYear: '۱۳۱۴',
    description: 'نخستین و تنها شرکت بیمه تماماً دولتی با بیشترین شبکه شعب و ارزیابان خسارت سراسر ایران'
  },
  {
    code: 'alborz',
    name: 'بیمه البرز',
    defaultPassword: '1234',
    brandColor: 'emerald',
    licenseNumber: 'LIC-ALB-1338',
    sanhabCode: 'SNH-ALB-2020',
    phone: '۰۲۱-۸۸۷۳۲۱۱۰',
    email: 'info@alborzinsurance.ir',
    address: 'تهران، خیابان شهید بهشتی، نرسیده به میدان تختی، پلاک ۲۳۴',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 350000000,
    onlineWithCroquiCeiling: 1000000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 54,
    establishedYear: '۱۳۳۸',
    description: 'پیشگام در ارزیابی دیجیتال و سیستم‌های نظارت کیفی و خسارت خودرو'
  },
  {
    code: 'asia',
    name: 'بیمه آسیا',
    defaultPassword: '1234',
    brandColor: 'indigo',
    licenseNumber: 'LIC-ASI-1338',
    sanhabCode: 'SNH-ASIA-3030',
    phone: '۰۲۱-۸۸۸۰۰۲۰۰',
    email: 'crm@asiainsurance.ir',
    address: 'تهران، خیابان سپهبد قرنی، تقاطع خیابان طالقانی، پلاک ۹۴',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 350000000,
    onlineWithCroquiCeiling: 1000000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 62,
    establishedYear: '۱۳۳۸',
    description: 'دارای رتبه برتر شفافیت مالی و سرعت در پرداخت حواله‌های پایا و ساتنا'
  },
  {
    code: 'mellat',
    name: 'بیمه ملت',
    defaultPassword: '1234',
    brandColor: 'rose',
    licenseNumber: 'LIC-MLT-1382',
    sanhabCode: 'SNH-MLT-4040',
    phone: '۰۲۱-۸۵۳۳۳',
    email: 'info@melatinsurance.com',
    address: 'تهران، میدان ونک، خیابان برزیل شرقی، پلاک ۱',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 300000000,
    onlineWithCroquiCeiling: 900000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 36,
    establishedYear: '۱۳۸۲',
    description: 'بیمه‌گر تخصصی با فرآیندهای تمام الکترونیک و سرویس‌های خسارت خودرو بر بستر موبایل'
  },
  {
    code: 'parsian',
    name: 'بیمه پارسیان',
    defaultPassword: '1234',
    brandColor: 'purple',
    licenseNumber: 'LIC-PAR-1382',
    sanhabCode: 'SNH-PAR-5050',
    phone: '۰۲۱-۸۲۵۹',
    email: 'info@parsianinsurance.ir',
    address: 'تهران، خیابان ولیعصر، بالاتر از بلوار میرداماد، خیابان قبادیان شرقی، پلاک ۱',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 350000000,
    onlineWithCroquiCeiling: 1100000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 42,
    establishedYear: '۱۳۸۲',
    description: 'بیمه‌گر بخش خصوصی وابسته به گروه مالی پارسیان با شعب کارشناسی تخصصی'
  },
  {
    code: 'pasargad',
    name: 'بیمه پاسارگاد',
    defaultPassword: '1234',
    brandColor: 'teal',
    licenseNumber: 'LIC-PAS-1385',
    sanhabCode: 'SNH-PAS-6060',
    phone: '۰۲۱-۸۲۴۰۶',
    email: 'info@pasargadinsurance.ir',
    address: 'تهران، خیابان فاطمه، نبش خیابان هشت بهشت، پلاک ۲',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 300000000,
    onlineWithCroquiCeiling: 950000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 50,
    establishedYear: '۱۳۸۵',
    description: 'دارنده بالاترین گواهی توانگری مالی و خدمات متمرکز ارزیابی و تسویه الکترونیکی'
  }
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
    // Branch 1: مرکز ونک / گاندی
    {
      id: 'fed1',
      name: 'کیوان عزیزی',
      role: 'کارشناس رسمی بازدید میدانی (بدنه و ثالث)',
      phone: '09129001001',
      nationalId: '0099111111',
      company: 'بیمه دانا',
      branchId: 'dana-br-1',
      branchName: 'مجتمع تخصصی خسارت اتومبیل بیمه دانا (مرکزی - میدان ونک)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'تطبیق فیزیکی صحنه تصادف، اصالت‌سنجی شاسی و خسارات بدنه سنگین',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed1-2',
      name: 'مریم هدایتی',
      role: 'کارشناس ارزیابی خسارت بدنه و خودروهای وارداتی',
      phone: '09129001011',
      nationalId: '0099111122',
      company: 'بیمه دانا',
      branchId: 'dana-br-1',
      branchName: 'مجتمع تخصصی خسارت اتومبیل بیمه دانا (مرکزی - میدان ونک)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.95,
      expertise: 'کارشناسی تخصصی خودروهای هیبریدی و قطعات بدنه اورجینال',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed1-3',
      name: 'احسان کاظمی',
      role: 'ارزیاب رسمی خسارت و بازسازی صحنه تصادف',
      phone: '09129001012',
      nationalId: '0099111133',
      company: 'بیمه دانا',
      branchId: 'dana-br-1',
      branchName: 'مجتمع تخصصی خسارت اتومبیل بیمه دانا (مرکزی - میدان ونک)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'بررسی تصادفات زنجیره‌ای و تطبیق اظهارات با آثار برخورد',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },

    // Branch 2: مرکز غرب / آزادی / ستارخان
    {
      id: 'fed2',
      name: 'شیرین باقری',
      role: 'کارشناس ارشد ارزیابی میدانی و تصادفات',
      phone: '09129001002',
      nationalId: '0099222222',
      company: 'بیمه دانا',
      branchId: 'dana-br-2',
      branchName: 'مرکز خسارت خودرو غرب تهران دانا (آزادی - کیلومتر ۴ مخصوص)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.8,
      expertise: 'کارشناسی پرونده‌های بدون کروکی، بررسی رنگ و افت قیمت خودرو',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed2-2',
      name: 'بهزاد فروتن',
      role: 'کارشناس رسمی تصادفات بدون کروکی و رنگ',
      phone: '09129001021',
      nationalId: '0099222233',
      company: 'بیمه دانا',
      branchId: 'dana-br-2',
      branchName: 'مرکز خسارت خودرو غرب تهران دانا (آزادی - کیلومتر ۴ مخصوص)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'تشخیص رنگ‌شدگی، تعویض قطعه فابریک و خسارات ساختاری',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed2-3',
      name: 'مهرداد یوسفی',
      role: 'کارشناس بازدید میدانی قطعات و خسارات شاسی',
      phone: '09129001022',
      nationalId: '0099222244',
      company: 'بیمه دانا',
      branchId: 'dana-br-2',
      branchName: 'مرکز خسارت خودرو غرب تهران دانا (آزادی - کیلومتر ۴ مخصوص)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.75,
      expertise: 'کارشناسی خسارت خودروهای چینی و داخلی در محدوده غرب',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80'
    },

    // Branch 3: مرکز شرق / تهرانپارس
    {
      id: 'fed3',
      name: 'مهندس کامران رستمی',
      role: 'کارشناس رسمی دادگستری و میدانی بیمه',
      phone: '09129001003',
      nationalId: '0099333331',
      company: 'بیمه دانا',
      branchId: 'dana-br-3',
      branchName: 'مرکز پرداخت خسارت بدنه شرق تهران دانا (تهرانپارس - دماوند)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 5.0,
      expertise: 'بازسازی صحنه تصادفات زنجیره‌ای و تطبیق زاویه برخورد',
      activeCases: 2,
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed3-2',
      name: 'الهام نادری',
      role: 'ارزیاب خسارت بدنه و تصادفات شهری شرق',
      phone: '09129001031',
      nationalId: '0099333342',
      company: 'بیمه دانا',
      branchId: 'dana-br-3',
      branchName: 'مرکز پرداخت خسارت بدنه شرق تهران دانا (تهرانپارس - دماوند)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'بررسی آسیب‌های بدنه، سپر، چراغ‌ها و جلوبندی خودرو',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed3-3',
      name: 'حامد سلیمانی',
      role: 'کارشناس فنی بازدید خودرو و اصالت‌سنجی قطعات',
      phone: '09129001032',
      nationalId: '0099333353',
      company: 'بیمه دانا',
      branchId: 'dana-br-3',
      branchName: 'مرکز پرداخت خسارت بدنه شرق تهران دانا (تهرانپارس - دماوند)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'تشخیص خسارات واقعی از خسارات قدیمی و بررسی فابریک بودن قطعات',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
    },

    // Branch 4: مرکز شمال / شریعتی / پل رومی
    {
      id: 'fed4',
      name: 'نیما علیزاده',
      role: 'کارشناس میدانی و اصالت خودروهای لوکس',
      phone: '09129001004',
      nationalId: '0099444441',
      company: 'بیمه دانا',
      branchId: 'dana-br-4',
      branchName: 'مرکز ارزیابی خسارت شمال تهران دانا (شریعتی - پل رومی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.7,
      expertise: 'بررسی خودروهای لوکس و وارداتی، ارزیابی میدانی فوری',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed4-2',
      name: 'پروانه صالحی',
      role: 'کارشناس ارشد ارزیابی افت قیمت و خسارت بدنه',
      phone: '09129001041',
      nationalId: '0099444452',
      company: 'بیمه دانا',
      branchId: 'dana-br-4',
      branchName: 'مرکز ارزیابی خسارت شمال تهران دانا (شریعتی - پل رومی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.95,
      expertise: 'محاسبه افت قیمت مدل‌های لوکس و ارزیابی خسارت شاسی و سقف',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed4-3',
      name: 'آرش خسروی',
      role: 'کارشناس رسمی بازدید میدانی خودروهای خارجی',
      phone: '09129001042',
      nationalId: '0099444463',
      company: 'بیمه دانا',
      branchId: 'dana-br-4',
      branchName: 'مرکز ارزیابی خسارت شمال تهران دانا (شریعتی - پل رومی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.8,
      expertise: 'کارشناسی سیستم‌های راداری، سنسورها و قطعات الکترونیکی تصادفات',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=120&auto=format&fit=crop&q=80'
    },

    // Branch 5: مرکز جنوب / فدائیان اسلام / بعثت
    {
      id: 'fed5',
      name: 'داوود مرادی',
      role: 'کارشناس میدانی منطقه جنوب',
      phone: '09129001005',
      nationalId: '0099555551',
      company: 'بیمه دانا',
      branchId: 'dana-br-5',
      branchName: 'مرکز ارزیابی خسارت جنوب تهران دانا (فدائیان اسلام)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.8,
      expertise: 'ارزیابی خودروهای سنگین و تصادفات بدون کروکی معابر جنوب',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed5-2',
      name: 'علی جهانگیری',
      role: 'کارشناس ارشد بازدید خودروهای سنگین و تجاری',
      phone: '09129001051',
      nationalId: '0099555562',
      company: 'بیمه دانا',
      branchId: 'dana-br-5',
      branchName: 'مرکز ارزیابی خسارت جنوب تهران دانا (فدائیان اسلام)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'کارشناسی خسارت کامیونت، وانت و خودروهای باربری و عمومی',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fed5-3',
      name: 'سمیرا محمدی',
      role: 'ارزیاب خسارت بدون کروکی و تصادفات شهری',
      phone: '09129001052',
      nationalId: '0099555573',
      company: 'بیمه دانا',
      branchId: 'dana-br-5',
      branchName: 'مرکز ارزیابی خسارت جنوب تهران دانا (فدائیان اسلام)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.75,
      expertise: 'بررسی تصادفات ترافیکی، زاویه ضربه و تطابق خسارات بدنه',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120&auto=format&fit=crop&q=80'
    }
  ],
  alborz: [
    // Branch 1: شهید بهشتی / بخارست
    {
      id: 'fea1',
      name: 'آرمان شفیعی',
      role: 'کارشناس ارشد بازدید میدانی',
      phone: '09129002001',
      nationalId: '0099333333',
      company: 'بیمه البرز',
      branchId: 'alborz-br-1',
      branchName: 'مجتمع ارزیابی خسارت بدنه بیمه البرز (خیابان بهشتی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'کارشناسی اصالت قطعات و بازرسی میدانی',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fea1-2',
      name: 'نگار معتمدی',
      role: 'ارزیاب خسارت خودروهای لوکس و وارداتی',
      phone: '09129002011',
      nationalId: '0099333344',
      company: 'بیمه البرز',
      branchId: 'alborz-br-1',
      branchName: 'مجتمع ارزیابی خسارت بدنه بیمه البرز (خیابان بهشتی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'بررسی اصالت قطعات یدکی و خسارات بدنه خودروهای اروپایی',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fea1-3',
      name: 'حمیدرضا طاهری',
      role: 'کارشناس رسمی تصادفات و خسارت بدنه',
      phone: '09129002012',
      nationalId: '0099333355',
      company: 'بیمه البرز',
      branchId: 'alborz-br-1',
      branchName: 'مجتمع ارزیابی خسارت بدنه بیمه البرز (خیابان بهشتی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'بازسازی صحنه برخورد و تطبیق کروکی پلیس',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },

    // Branch 2: آزادی
    {
      id: 'fea2',
      name: 'مینا اکبری',
      role: 'کارشناس میدانی و بازبین فنی غرب',
      phone: '09129002002',
      nationalId: '0099444444',
      company: 'بیمه البرز',
      branchId: 'alborz-br-2',
      branchName: 'مرکز پرداخت خسارت غرب بیمه البرز (آزادی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.8,
      expertise: 'ارزیابی خسارت خودرو در غرب تهران و تصادفات بدون کروکی',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fea2-2',
      name: 'فرزاد انصاری',
      role: 'ارزیاب تصادفات شهری و رنگ خودرو',
      phone: '09129002021',
      nationalId: '0099444455',
      company: 'بیمه البرز',
      branchId: 'alborz-br-2',
      branchName: 'مرکز پرداخت خسارت غرب بیمه البرز (آزادی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'بررسی ضخامت رنگ، تعویض پوسته سقف و ستون‌ها',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
    }
  ],
  asia: [
    // Branch 1: سپهبد قرنی
    {
      id: 'feas1',
      name: 'پویا رستگار',
      role: 'کارشناس رسمی بازدید میدانی',
      phone: '09129003001',
      nationalId: '0099555555',
      company: 'بیمه آسیا',
      branchId: 'asia-br-1',
      branchName: 'مجتمع پرداخت خسارت خودرو بیمه آسیا (مرکزی - سپهبد قرنی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'تطبیق کروکی و بازدید فیزیکی خودرو',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'feas1-2',
      name: 'شیما صادقی',
      role: 'کارشناس ارشد ارزیابی خسارت بدنه',
      phone: '09129003011',
      nationalId: '0099555566',
      company: 'بیمه آسیا',
      branchId: 'asia-br-1',
      branchName: 'مجتمع پرداخت خسارت خودرو بیمه آسیا (مرکزی - سپهبد قرنی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'ارزیابی خسارت بدنه، رنگ و قطعات مصرفی',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'feas1-3',
      name: 'میلاد قاسمی',
      role: 'ارزیاب فنی تصادفات و اصالت‌سنجی',
      phone: '09129003012',
      nationalId: '0099555577',
      company: 'بیمه آسیا',
      branchId: 'asia-br-1',
      branchName: 'مجتمع پرداخت خسارت خودرو بیمه آسیا (مرکزی - سپهبد قرنی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'بررسی شاسی، اتاق و قطعات موتور در تصادفات',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },

    // Branch 2: لشکری / غرب
    {
      id: 'feas2',
      name: 'افشین کیانی',
      role: 'کارشناس میدانی بزرگراه لشگری و غرب',
      phone: '09129003021',
      nationalId: '0099555588',
      company: 'بیمه آسیا',
      branchId: 'asia-br-2',
      branchName: 'مرکز خسارت غرب بیمه آسیا (بزرگراه شهید لشکری)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.8,
      expertise: 'ارزیابی سریع تصادفات جاده مخصوص و اتوبان‌های غرب',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'feas2-2',
      name: 'زهرا حسینی',
      role: 'کارشناس ارزیابی خسارات بدون کروکی',
      phone: '09129003022',
      nationalId: '0099555599',
      company: 'بیمه آسیا',
      branchId: 'asia-br-2',
      branchName: 'مرکز خسارت غرب بیمه آسیا (بزرگراه شهید لشکری)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'تشخیص نحوه برخورد و خسارات فابریک خودروهای ایرانی',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    }
  ],
  iran: [
    // Branch 1: فاطمی
    {
      id: 'feir1',
      name: 'بابک کریمیان',
      role: 'کارشناس میدانی مجتمع فاطمی',
      phone: '09129004001',
      nationalId: '0099666666',
      company: 'بیمه ایران',
      branchId: 'iran-br-1',
      branchName: 'مجتمع خسارت و کارشناسی خودرو بیمه ایران (مرکزی - میدان فاطمی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'بازدید حضوری و تشخیص اصالت آسیب‌های وارده',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'feir1-2',
      name: 'فرناز راد',
      role: 'کارشناس اصالت قطعات و خسارت بدنه',
      phone: '09129004011',
      nationalId: '0099666677',
      company: 'بیمه ایران',
      branchId: 'iran-br-1',
      branchName: 'مجتمع خسارت و کارشناسی خودرو بیمه ایران (مرکزی - میدان فاطمی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'ارزیابی بدنه خودروهای وارداتی و افت قیمت',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'feir1-3',
      name: 'مجید صبوری',
      role: 'کارشناس رسمی تصادفات خودرو',
      phone: '09129004012',
      nationalId: '0099666688',
      company: 'بیمه ایران',
      branchId: 'iran-br-1',
      branchName: 'مجتمع خسارت و کارشناسی خودرو بیمه ایران (مرکزی - میدان فاطمی)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'بازسازی صحنه حادثه و ارزیابی خسارات کلی',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    },

    // Branch 2: فتح / غرب
    {
      id: 'feir2',
      name: 'ندا مرادی',
      role: 'کارشناس میدانی ارشد غرب تهران',
      phone: '09129004002',
      nationalId: '0099777777',
      company: 'بیمه ایران',
      branchId: 'iran-br-2',
      branchName: 'مرکز پرداخت خسارت اتومبیل غرب بیمه ایران (بزرگراه فتح)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.8,
      expertise: 'کارشناسی تصادفات جاده‌ای و بدون کروکی غرب تهران',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'feir2-2',
      name: 'کوروش عباسی',
      role: 'کارشناس تصادفات بدون کروکی و افت قیمت',
      phone: '09129004021',
      nationalId: '0099777788',
      company: 'بیمه ایران',
      branchId: 'iran-br-2',
      branchName: 'مرکز پرداخت خسارت اتومبیل غرب بیمه ایران (بزرگراه فتح)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'بررسی خسارات سنگین بدنه، شاسی و تعویض اتاق',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'feir2-3',
      name: 'سامان شریفی',
      role: 'ارزیاب میدانی خودروهای ایرانی و چینی',
      phone: '09129004022',
      nationalId: '0099777799',
      company: 'بیمه ایران',
      branchId: 'iran-br-2',
      branchName: 'مرکز پرداخت خسارت اتومبیل غرب بیمه ایران (بزرگراه فتح)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.75,
      expertise: 'تطبیق فیزیکی آثار ضربه و برآورد دستمزد صافکاری و نقاشی',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80'
    }
  ],
  mellat: [
    // Branch 1: مطهری
    {
      id: 'fem1',
      name: 'سارا قاسمی',
      role: 'کارشناس ارشد خسارت و ارزیابی میدانی',
      phone: '09125005001',
      nationalId: '0099888888',
      company: 'بیمه ملت',
      branchId: 'mellat-br-1',
      branchName: 'مجتمع خسارت خودرو بیمه ملت (خیابان شهید مطهری)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'بازدید صحنه تصادف و تطابق قطعات آسیب‌دیده',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fem1-2',
      name: 'نوید بهرامی',
      role: 'ارزیاب رسمی خسارت بدنه و ثالث',
      phone: '09125005011',
      nationalId: '0099888899',
      company: 'بیمه ملت',
      branchId: 'mellat-br-1',
      branchName: 'مجتمع خسارت خودرو بیمه ملت (خیابان شهید مطهری)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.85,
      expertise: 'کارشناسی اصالت رنگ، بتونه و قطعات یدکی',
      activeCases: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
    },
    {
      id: 'fem1-3',
      name: 'امیرحسین فتاحی',
      role: 'کارشناس تصادفات و بازرسی فنی',
      phone: '09125005012',
      nationalId: '0099888810',
      company: 'بیمه ملت',
      branchId: 'mellat-br-1',
      branchName: 'مجتمع خسارت خودرو بیمه ملت (خیابان شهید مطهری)',
      city: 'تهران',
      status: 'AVAILABLE',
      rating: 4.9,
      expertise: 'بررسی تصادفات شهری، برخورد از عقب و دنده عقب',
      activeCases: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
    }
  ]
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

export const INITIAL_CASES: ClaimCase[] = [];

export const INITIAL_EXPERT_COMPLAINTS: import('../types').ExpertComplaint[] = [];

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

