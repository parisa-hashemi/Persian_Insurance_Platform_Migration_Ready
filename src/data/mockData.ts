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
    insurerInstruction: 'لطفاً وضعیت شکستگی دیاق سپر جلو بررسی شود و در صورت امکان ترمیم، از ثبت تعویض خودداری گردد. همچنین تصاویر زوایای جانبی خودرو جهت راستی‌آزمایی با پورتال مقایسه شود.',
    insurerAssignmentNote: 'لطفاً وضعیت شکستگی دیاق سپر جلو بررسی شود و در صورت امکان ترمیم، از ثبت تعویض خودداری گردد. همچنین تصاویر زوایای جانبی خودرو جهت راستی‌آزمایی با پورتال مقایسه شود.',
    insurerNoteAuthor: 'شیوا محمدی (مسئول خسارت خودرو بیمه ایران)',
    insurerNoteDate: '۱۴۰۵/۰۵/۱۴ ۱۲:۰۰',
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
    status: 'محول شده',
    priority: 'high',
    approved: true,
    hasKroki: true,
    sceneReportCode: 'KR-887501',
    assignedExpert: {
      id: 'ir2',
      name: 'رضا تهرانی',
      role: 'ارزیاب ارشد بدنه',
      phone: '09124004002',
      nationalId: '0077777777'
    },
    insurerInstruction: 'تطابق زاویه برخورد جلو دنا با عقب پژو ۲۰۶ و صحت خسارت چراغ و جلوپنجره با دقت ارزیابی شود. قطعات مشمول تعویض مستندسازی گردند.',
    insurerAssignmentNote: 'تطابق زاویه برخورد جلو دنا با عقب پژو ۲۰۶ و صحت خسارت چراغ و جلوپنجره با دقت ارزیابی شود. قطعات مشمول تعویض مستندسازی گردند.',
    insurerNoteAuthor: 'شیوا محمدی (مسئول خسارت خودرو بیمه ایران)',
    insurerNoteDate: '۱۴۰۵/۰۵/۰۶ ۱۰:۱۵',
    history: [
      { status: 'ثبت اولیه پرونده', time: '۱۴۰۵/۰۵/۰۶ ۱۰:۰۲', user: 'پریسا حسینی', note: 'ثبت حادثه و مدارک تصادف' },
      { status: 'محول شده', time: '۱۴۰۵/۰۵/۰۶ ۱۰:۱۵', user: 'شیوا محمدی', note: 'تخصیص پرونده به ارزیاب رضا تهرانی همراه با دستورالعمل' }
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
    carModel: 'پژو ۲۰۶',
    plateNumber: '۱۲-ب-۳۴۵۶۷-ایران-۸۹',
    accidentLocation: 'دانشگاه جنگ، حر، منطقه ۱۱ شهرداری تهران',
    plate: '۱۲-ب-۳۴۵۶۷-ایران-۸۹',
    culpritPolicyNo: 'DN-1403-1174',
    culpritPolicyExpiry: '۱۴۰۶/۰۸/۱۰',
    culpritCoverageFinancial: 60000000,
    culpritCoverageBodily: 400000000,
    culpritCoverageDriver: 120000000,
    culpritPolicyVerified: true,
    victimPolicyVerified: true,
    culpritFaultPercent: 100,
    status: 'در انتظار بازدید کارشناس میدانی',
    priority: 'normal',
    approved: true,
    hasKroki: false,
    needsCulpritFieldVisit: true,
    assignedFieldExpert: {
      id: 'fed1',
      name: 'کیوان عزیزی',
      role: 'کارشناس میدانی',
      phone: '09129001001',
      nationalId: '0099111111'
    },
    insurerFieldExpertNote: 'حادثه فاقد کروکی رسمی است. لطفاً تطابق ارتفاع خطوط برخورد دو خودرو و اصالت پلاک‌ها در محل معاینه و تصویربرداری شود.',
    insurerInstruction: 'حادثه فاقد کروکی رسمی است. لطفاً تطابق ارتفاع خطوط برخورد دو خودرو و اصالت پلاک‌ها در محل معاینه و تصویربرداری شود.',
    insurerAssignmentNote: 'حادثه فاقد کروکی رسمی است. لطفاً تطابق ارتفاع خطوط برخورد دو خودرو و اصالت پلاک‌ها در محل معاینه و تصویربرداری شود.',
    insurerNoteAuthor: 'حسین یوسفی (اپراتور ارشد دانا)',
    insurerNoteDate: '۱۴۰۵/۰۵/۱۳ ۰۹:۴۰',
    history: [
      { status: 'ثبت اولیه پرونده', time: '۱۴۰۵/۰۵/۱۳ ۰۹:۲۳', user: 'پریسا حسینی', note: 'ثبت حادثه بدون کروکی' },
      { status: 'در انتظار بازدید کارشناس میدانی', time: '۱۴۰۵/۰۵/۱۳ ۰۹:۴۰', user: 'حسین یوسفی', note: 'ارجاع ماموریت میدانی به کیوان عزیزی' }
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
  },
  {
    id: 'BD-1403-8821-DANA',
    isBodily: true,
    isBodyClaim: true,
    date: '۱۴۰۳/۰۵/۲۲ ۱۴:۳۰',
    address: 'تهران، بزرگراه شهید همت، تقاطع ستاری، نرسیده به خروجی جنت‌آباد',
    victimName: 'مهدی کشاورز',
    victimPhone: '09123456789',
    victimPlate: '۱۲-ب-۳۴۵-ایران-۸۹',
    plate: '۱۲-ب-۳۴۵-ایران-۸۹',
    carType: 'پژو ۲۰۶ تیپ ۵ مدل ۱۴۰۱',
    carModel: 'پژو ۲۰۶ تیپ ۵ مدل ۱۴۰۱',
    victimVin: 'IR206DAN8821034',
    victimNationalId: '0012345678',
    victimInsurer: 'dana',
    culpritName: 'مهدی کشاورز',
    culpritPhone: '09123456789',
    culpritPlate: '۱۲-ب-۳۴۵-ایران-۸۹',
    culpritInsurer: 'dana',
    culpritPolicyNo: 'BD-1403-88219-DANA',
    bodyInsuranceInfo: {
      policyNo: 'BD-1403-88219-DANA',
      insurerCode: 'dana',
      insurerName: 'بیمه دانا',
      nationalId: '0012345678',
      carModel: 'پژو ۲۰۶ تیپ ۵ مدل ۱۴۰۱',
      plate: '۱۲-ب-۳۴۵-ایران-۸۹',
      coverageCeiling: 650000000,
      discountPercent: 45,
      franchisePercent: 10,
      expireDate: '۱۴۰۴/۰۶/۱۵',
      autoSanhabMatched: true,
      damageType: 'تصادف تک‌وسیله (برخورد با مانع / جدول / گاردریل)'
    },
    assignedBranch: {
      branchId: 'dana-br-1',
      name: 'مرکز تخصصی ارزیابی و پرداخت خسارت بدنه دانا (مرکزی - مطهری)',
      address: 'تهران، خیابان استاد مطهری، بعد از خیابان مفتح، پلاک ۱۵۴',
      phone: '۰۲۱-۸۸۸۸۱۰۰۱',
      distance: 'نزدیک‌ترین شعبه تخصصی پرداخت خسارت بدنه',
      city: 'تهران',
      managerName: 'مهندس حسینی'
    },
    status: 'در انتظار تایید کاربر',
    priority: 'normal',
    approved: true,
    writtenReport: 'در حال رانندگی در لاین سرعت بودم که به دلیل لغزندگی معبر، کنترل خودرو از دست خارج شده و قسمت جلو و گلگیر سمت راست به گاردریل برخورد کرد. رادیاتور و سپر جلو آسیب شدید دیده است.',
    assignedFieldExpert: {
      id: 'fed1',
      name: 'کیوان عزیزی',
      role: 'کارشناس رسمی بازدید میدانی بیمه دانا',
      phone: '09129001001',
      nationalId: '0099111111',
      company: 'بیمه دانا'
    },
    fieldExpertVerdict: 'CONFIRMED',
    fieldExpertFinal: true,
    fieldExpertReportNote: 'بازدید حضوری و اصالت‌سنجی فیزیکی انجام شد. تطبیق شماره شاسی و زاویه برخورد با گاردریل معبر کاملاً تایید می‌گردد. قطعات پوسته سپر جلو و چراغ تعویض و گلگیر راست صافکاری و نقاشی تعیین گردید.',
    carDamageSpots: {
      front_bumper: {
        type: 'شکستگی و دفرمگی دیاق',
        severity: 'major',
        operation: 'تعویض کامل پوسته و متعلقات',
        color: 'red',
        note: 'شکستگی کامل شبکه و دیاق سپر جلو در اثر برخورد مستقیم با گاردریل.',
        updatedAt: '۱۴۰۳/۰۵/۲۲'
      },
      fender_fr: {
        type: 'له‌شدگی و فرورفتگی شدید',
        severity: 'moderate',
        operation: 'صافکاری و نقاشی کوره',
        color: 'orange',
        note: 'گلگیر جلو سمت راست دارای دفرمگی و نیاز به صافکاری و رنگ‌آمیزی کامل دارد.',
        updatedAt: '۱۴۰۳/۰۵/۲۲'
      },
      headlight_r: {
        type: 'شکستگی پایه و طلق بلوری',
        severity: 'major',
        operation: 'تعویض چراغ اصلی',
        color: 'red',
        note: 'پایه‌های داخلی چراغ جلو راست شکسته و طلق خارجی خرد شده است.',
        updatedAt: '۱۴۰۳/۰۵/۲۲'
      }
    },
    assessment: {
      version: 'BD-1.0',
      gross: 48500000,
      deductions: 4850000,
      salvage: 1500000,
      payable: 42150000,
      status: 'PUBLISHED',
      reviewerNote: 'گزارش کارشناسی میدانی بدنه تایید شد. فرانشیز ۱۰٪ بیمه‌نامه کسر و مبلغ خالص مصوب آماده واریز به شبا می‌باشد.',
      submittedBy: 'کیوان عزیزی (کارشناس میدانی دانا)',
      submittedAt: '۱۴۰۳/۰۵/۲۲ ۱۶:۰۰',
      parts: [
        { name: 'پوسته سپر جلو اورجینال ایساکو', type: 'replace', partPrice: 18500000, repairPrice: 4000000, salvageNeeded: true, salvageValue: 1500000 },
        { name: 'مجموعه چراغ جلو راست مدرن/کرویی', type: 'replace', partPrice: 9500000, repairPrice: 1500000, salvageNeeded: false, salvageValue: 0 },
        { name: 'گلگیر جلو راست (اجرت صافکاری و نقاشی)', type: 'repair', partPrice: 0, repairPrice: 15000000, salvageNeeded: false, salvageValue: 0 }
      ]
    },
    files: [
      {
        name: 'عکس زاویه جلو و سپر آسیب‌دیده',
        type: 'image',
        dataUrl: 'https://images.unsplash.com/photo-1590362891988-306565785084?w=600&auto=format&fit=crop&q=80',
        fileName: 'front_damage_photo.jpg'
      },
      {
        name: 'عکس گلگیر راست و چراغ جلو',
        type: 'image',
        dataUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
        fileName: 'fender_damage.jpg'
      }
    ],
    additionalDocs: [
      {
        id: 'doc-bd-1',
        title: 'عکس بازرسی فیزیکی زاویه برخورد با گاردریل',
        docType: 'تصویر صحنه تصادف',
        dataUrl: 'https://images.unsplash.com/photo-1590362891988-306565785084?w=600&auto=format&fit=crop&q=80',
        uploadedBy: 'کیوان عزیزی',
        uploaderRole: 'کارشناس میدانی',
        uploadedAt: '۱۴۰۳/۰۵/۲۲ ۱۵:۲۰',
        note: 'تطبیق خطوط برخورد و عدم وجود خسارت کهنه'
      },
      {
        id: 'doc-bd-2',
        title: 'استعلام تصویری شماره شاسی خودرو (VIN)',
        docType: 'مستند شماره شاسی',
        dataUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
        uploadedBy: 'کیوان عزیزی',
        uploaderRole: 'کارشناس میدانی',
        uploadedAt: '۱۴۰۳/۰۵/۲۲ ۱۵:۲۵',
        note: 'تطبیق کامل شاسی با بیمه‌نامه و کارت خودرو'
      }
    ],
    history: [
      { status: 'ثبت خسارت بیمه بدنه', time: '۱۴۰۳/۰۵/۲۲ ۱۴:۳۰', user: 'مهدی کشاورز', note: 'ثبت پرونده خسارت بدنه به شماره BD-1403-8821-DANA' },
      { status: 'ارجاع به کارشناس میدانی', time: '۱۴۰۳/۰۵/۲۲ ۱۵:۰۰', user: 'پورتال بیمه دانا', note: 'ارجاع پرونده به کارشناس میدانی کیوان عزیزی' },
      { status: 'در انتظار تایید کاربر', time: '۱۴۰۳/۰۵/۲۲ ۱۶:۰۰', user: 'کیوان عزیزی', note: 'ثبت گزارش کارشناسی میدانی و تایید ارزیابی خسارت بدنه' }
    ],
    createdAt: '2026-08-05T14:30:00.000Z'
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

