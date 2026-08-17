export interface BodyPolicyRecord {
  nationalId: string;
  ownerName: string;
  phone: string;
  plate: string;
  carModel: string;
  policyNo: string;
  insurerCode: string;
  insurerName: string;
  coverageCeiling: number;
  discountPercent: number;
  franchisePercent: number;
  expireDate: string;
  issueDate: string;
  carVin: string;
}

export interface InsuranceBranch {
  id: string;
  insurerCode: string;
  name: string;
  type: 'CENTRAL_CLAIM' | 'REGIONAL_BRANCH' | 'DRIVE_IN_ASSESSMENT';
  city: string;
  province: string;
  address: string;
  phone: string;
  operatingHours: string;
  managerName: string;
  coordinates: { lat: number; lng: number };
  keywords: string[];
}

export const KNOWN_BODY_POLICIES: Record<string, BodyPolicyRecord> = {
  '0012345678': {
    nationalId: '0012345678',
    ownerName: 'مهدی کشاورز',
    phone: '09123456789',
    plate: '۱۲-ب-۳۴۵-ایران-۸۹',
    carModel: 'پژو ۲۰۶ تیپ ۵ مدل ۱۴۰۱',
    policyNo: 'BD-1403-88219-DANA',
    insurerCode: 'dana',
    insurerName: 'بیمه دانا',
    coverageCeiling: 650000000,
    discountPercent: 45,
    franchisePercent: 10,
    expireDate: '۱۴۰۴/۰۶/۱۵',
    issueDate: '۱۴۰۳/۰۶/۱۵',
    carVin: 'IR206DAN8821034'
  },
  '0023456789': {
    nationalId: '0023456789',
    ownerName: 'علی رضایی',
    phone: '09121112233',
    plate: '۴۴-ج-۷۸۹-ایران-۶۶',
    carModel: 'دنا پلاس توربو اتوماتیک ۱۴۰۲',
    policyNo: 'IR-BD-9941-IRAN',
    insurerCode: 'iran',
    insurerName: 'بیمه ایران',
    coverageCeiling: 900000000,
    discountPercent: 30,
    franchisePercent: 10,
    expireDate: '۱۴۰۴/۰۸/۲۰',
    issueDate: '۱۴۰۳/۰۸/۲۰',
    carVin: 'IRDENIRAN994102'
  },
  '0034567890': {
    nationalId: '0034567890',
    ownerName: 'سارا ناصری',
    phone: '09129998877',
    plate: '۷۷-د-۱۱۱-ایران-۲۲',
    carModel: 'تارا اتوماتیک V4 مدل ۱۴۰۳',
    policyNo: 'ALB-BD-5512-ALBORZ',
    insurerCode: 'alborz',
    insurerName: 'بیمه البرز',
    coverageCeiling: 850000000,
    discountPercent: 20,
    franchisePercent: 10,
    expireDate: '۱۴۰۴/۱۱/۰۱',
    issueDate: '۱۴۰۳/۱۱/۰۱',
    carVin: 'IRTARALB551201'
  }
};

export const INSURANCE_BRANCHES: InsuranceBranch[] = [
  // Dana Branches
  {
    id: 'dana-br-1',
    insurerCode: 'dana',
    name: 'مرکز تخصصی ارزیابی و پرداخت خسارت بدنه دانا (مرکزی - مطهری)',
    type: 'CENTRAL_CLAIM',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، خیابان استاد مطهری، بعد از خیابان مفتح، پلاک ۱۵۴',
    phone: '۰۲۱-۸۸۸۸۱۰۰۱',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۳۰ - پنجشنبه ۸:۰۰ الی ۱۳:۰۰',
    managerName: 'مهندس حسینی',
    coordinates: { lat: 35.724, lng: 51.428 },
    keywords: ['مرکز', 'مطهری', 'مفتح', 'ولیعصر', 'بهشتی', 'هفت تیر', 'کریمخان', 'سهروردی', 'ونک', 'گاندی', 'وزرا']
  },
  {
    id: 'dana-br-2',
    insurerCode: 'dana',
    name: 'مرکز خسارت خودرو غرب تهران دانا (آزادی - کیلومتر ۴ مخصوص)',
    type: 'DRIVE_IN_ASSESSMENT',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، میدان آزادی، بزرگراه لشگری (جاده مخصوص کرج)، جنب پل اکباتان',
    phone: '۰۲۱-۴۴۵۵۶۶۷۷',
    operatingHours: 'شنبه تا پنجشنبه ۷:۳۰ الی ۱۸:۰۰ (ارزیابی حضوری بدون پیاده‌شدن)',
    managerName: 'مهندس مرادی',
    coordinates: { lat: 35.701, lng: 51.325 },
    keywords: ['غرب', 'آزادی', 'اکباتان', 'جاده مخصوص', 'صادقیه', 'ستارخان', 'پونک', 'جنت آباد', 'شهران', 'چیتگر', 'تهرانسر', 'آریاشهر']
  },
  {
    id: 'dana-br-3',
    insurerCode: 'dana',
    name: 'مرکز پرداخت خسارت بدنه شرق تهران دانا (تهرانپارس - دماوند)',
    type: 'REGIONAL_BRANCH',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، فلکه اول تهرانپارس، بزرگراه رسالت، نبش خیابان ۱۵۴ غربی',
    phone: '۰۲۱-۷۷۸۸۹۹۰۰',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ - پنجشنبه ۸:۰۰ الی ۱۲:۳۰',
    managerName: 'مهندس رضایی',
    coordinates: { lat: 35.736, lng: 51.528 },
    keywords: ['شرق', 'تهرانپارس', 'رسالت', 'دماوند', 'پیروزی', 'نارمک', 'حکیمیه', 'تهران نو', 'افسریه', 'نیروی هوایی', 'هنگام']
  },
  {
    id: 'dana-br-4',
    insurerCode: 'dana',
    name: 'مرکز ارزیابی خسارت شمال تهران دانا (شریعتی - پل رومی)',
    type: 'REGIONAL_BRANCH',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، خیابان شریعتی، بالاتر از پل رومی، نرسیده به میدان قدس',
    phone: '۰۲۱-۲۲۳۳۴۴۵۵',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰',
    managerName: 'مهندس کیانی',
    coordinates: { lat: 35.795, lng: 51.432 },
    keywords: ['شمال', 'تجریش', 'شریعتی', 'پل رومی', 'نیاوران', 'فرمانیه', 'الهیه', 'زعفرانیه', 'پاسداران', 'اقدسیه', 'قیطریه', 'دولت']
  },
  {
    id: 'dana-br-5',
    insurerCode: 'dana',
    name: 'مرکز ارزیابی خسارت جنوب تهران دانا (فدائیان اسلام)',
    type: 'REGIONAL_BRANCH',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، بزرگراه بعثت، خیابان فدائیان اسلام، نبش کوچه شهید بهشتی',
    phone: '۰۲۱-۵۵۶۶۷۷۸۸',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰',
    managerName: 'مهندس ابراهیمی',
    coordinates: { lat: 35.642, lng: 51.435 },
    keywords: ['جنوب', 'بعثت', 'فدائیان اسلام', 'نازی آباد', 'شهرری', 'شوش', 'یافت آباد', 'خزانه', 'شاهدشهر', 'اسلامشهر']
  },

  // Iran Branches
  {
    id: 'iran-br-1',
    insurerCode: 'iran',
    name: 'مجتمع خسارت و کارشناسی خودرو بیمه ایران (مرکزی - میدان فاطمی)',
    type: 'CENTRAL_CLAIM',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، میدان فاطمی، خیابان جویبار، کوچه نوربخش، پلاک ۴',
    phone: '۰۲۱-۸۶۰۹۱۰۰۰',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰',
    managerName: 'دکتر صابری',
    coordinates: { lat: 35.72, lng: 51.405 },
    keywords: ['فاطمی', 'مرکز', 'یوسف آباد', 'میدان ولیعصر', 'امیرآباد', 'کشاورز', 'انقلاب', 'کارگر']
  },
  {
    id: 'iran-br-2',
    insurerCode: 'iran',
    name: 'مرکز پرداخت خسارت اتومبیل غرب بیمه ایران (بزرگراه فتح)',
    type: 'DRIVE_IN_ASSESSMENT',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، بزرگراه فتح (جاده قدیم کرج)، سه راهی شهریار، پلاک ۲۸۰',
    phone: '۰۲۱-۶۶۲۲۳۳۴۴',
    operatingHours: 'شنبه تا پنجشنبه ۷:۳۰ الی ۱۷:۳۰',
    managerName: 'مهندس قنبری',
    coordinates: { lat: 35.68, lng: 51.27 },
    keywords: ['فتح', 'غرب', 'شهریار', 'یافت آباد', 'شادآباد', 'خلیج', 'آزادی', 'جاده قدیم', 'کرج']
  },

  // Alborz Branches
  {
    id: 'alborz-br-1',
    insurerCode: 'alborz',
    name: 'مجتمع ارزیابی خسارت بدنه بیمه البرز (خیابان بهشتی)',
    type: 'CENTRAL_CLAIM',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، خیابان شهید بهشتی، خیابان احمد قصیر (بخارست)، نبش کوچه هشتم',
    phone: '۰۲۱-۸۸۷۳۰۰۰۰',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰',
    managerName: 'مهندس تقوی',
    coordinates: { lat: 35.731, lng: 51.419 },
    keywords: ['بهشتی', 'بخارست', 'قصیر', 'آرژانتین', 'مطهری', 'مرکز', 'میرداماد']
  },
  {
    id: 'alborz-br-2',
    insurerCode: 'alborz',
    name: 'مرکز پرداخت خسارت غرب بیمه البرز (آزادی)',
    type: 'DRIVE_IN_ASSESSMENT',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، خیابان آزادی، نبش خیابان بهبودی، پلاک ۲۱۴',
    phone: '۰۲۱-۶۶۰۸۵۵۰۰',
    operatingHours: 'شنبه تا پنجشنبه ۸:۰۰ الی ۱۶:۳۰',
    managerName: 'مهندس حسینی',
    coordinates: { lat: 35.699, lng: 51.355 },
    keywords: ['آزادی', 'بهبودی', 'یادگار', 'شادمان', 'ستارخان', 'اکباتان']
  },

  // Asia Branches
  {
    id: 'asia-br-1',
    insurerCode: 'asia',
    name: 'مجتمع پرداخت خسارت خودرو بیمه آسیا (مرکزی - سپهبد قرنی)',
    type: 'CENTRAL_CLAIM',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، خیابان سپهبد قرنی، تقاطع خیابان طالقانی، پلاک ۸۲',
    phone: '۰۲۱-۸۸۸۰۰۰۰۰',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰',
    managerName: 'مهندس صالحی',
    coordinates: { lat: 35.707, lng: 51.418 },
    keywords: ['قرنی', 'طالقانی', 'فردوسی', 'انقلاب', 'مرکز', 'حافظ', 'کریمخان']
  },
  {
    id: 'asia-br-2',
    insurerCode: 'asia',
    name: 'مرکز خسارت غرب بیمه آسیا (بزرگراه شهید لشکری)',
    type: 'DRIVE_IN_ASSESSMENT',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، کیلومتر ۵ بزرگراه مخصوص کرج (شهید لشکری)، جنب کارخانه سایپا',
    phone: '۰۲۱-۴۴۵۵۶۶۷۷',
    operatingHours: 'شنبه تا پنجشنبه ۷:۳۰ الی ۱۷:۰۰',
    managerName: 'مهندس داوودی',
    coordinates: { lat: 35.71, lng: 51.24 },
    keywords: ['مخصوص', 'لشکری', 'تهرانسر', 'اکباتان', 'شهریار', 'آزادی', 'چیتگر']
  },

  // Mellat Branches
  {
    id: 'mellat-br-1',
    insurerCode: 'mellat',
    name: 'مجتمع خسارت خودرو بیمه ملت (خیابان شهید مطهری)',
    type: 'CENTRAL_CLAIM',
    city: 'تهران',
    province: 'تهران',
    address: 'تهران، خیابان شهید مطهری، بعد از تقاطع قائم مقام فراهانی، پلاک ۳۱۸',
    phone: '۰۲۱-۸۵۳۳۳',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰',
    managerName: 'دکتر افشار',
    coordinates: { lat: 35.724, lng: 51.422 },
    keywords: ['مطهری', 'قائم مقام', 'بهشتی', 'ولیعصر', 'میرزای شیرازی', 'سهروردی', 'مرکز']
  },

  // Provincial Main Branches
  {
    id: 'prov-karaj',
    insurerCode: 'all',
    name: 'مجتمع کارشناسی خسارت بدنه استان البرز (کرج - بلوار طالقانی)',
    type: 'REGIONAL_BRANCH',
    city: 'کرج',
    province: 'البرز',
    address: 'کرج، میدان شهدا، بلوار طالقانی شمالی، بالاتر از پل آزادگان، جنب پارک شرافت',
    phone: '۰۲۶-۳۲۵۵۶۶۷۷',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰',
    managerName: 'مهندس محمدی',
    coordinates: { lat: 35.832, lng: 50.991 },
    keywords: ['کرج', 'البرز', 'طالقانی', 'گوهردشت', 'عظیمیه', 'مهرشهر', 'فردیس', 'شهریار']
  },
  {
    id: 'prov-mashhad',
    insurerCode: 'all',
    name: 'مرکز تخصصی ارزیابی خسارت خودرو خراسان رضوی (مشهد - بلوار سجاد)',
    type: 'REGIONAL_BRANCH',
    city: 'مشهد',
    province: 'خراسان رضوی',
    address: 'مشهد، بلوار سجاد، چهارراه بزرگمهر، خیابان یاسمن',
    phone: '۰۵۱-۳۷۶۶۵۵۴۴',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰',
    managerName: 'مهندس باقری',
    coordinates: { lat: 36.312, lng: 59.548 },
    keywords: ['مشهد', 'خراسان', 'سجاد', 'احمدآباد', 'ملک آباد', 'وکیل آباد']
  },
  {
    id: 'prov-isfahan',
    insurerCode: 'all',
    name: 'مجتمع خسارت خودرو اصفهان (بلوار دانشگاه)',
    type: 'REGIONAL_BRANCH',
    city: 'اصفهان',
    province: 'اصفهان',
    address: 'اصفهان، خیابان هزارجریب، نبش کوچه یگانه',
    phone: '۰۳۱-۳۶۶۸۸۰۰۰',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰',
    managerName: 'مهندس اکبری',
    coordinates: { lat: 32.62, lng: 51.66 },
    keywords: ['اصفهان', 'هزارجریب', 'دروازه شیراز', 'چهارباغ', 'سپاهان شهر']
  },
  {
    id: 'prov-shiraz',
    insurerCode: 'all',
    name: 'مرکز کارشناسی و ارزیابی خسارت استان فارس (شیراز - بلوار زند)',
    type: 'REGIONAL_BRANCH',
    city: 'شیراز',
    province: 'فارس',
    address: 'شیراز، بلوار کریمخان زند، تقاطع خیابان رودکی، پلاک ۱۱۵',
    phone: '۰۷۱-۳۲۳۳۴۴۵۵',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰',
    managerName: 'مهندس دهقان',
    coordinates: { lat: 29.62, lng: 52.53 },
    keywords: ['شیراز', 'فارس', 'زند', 'قصردشت', 'معالی آباد', 'ستارخان شیراز']
  },
  {
    id: 'prov-tabriz',
    insurerCode: 'all',
    name: 'مرکز خسارت خودرو شمال غرب کشور (تبریز - آبرسان)',
    type: 'REGIONAL_BRANCH',
    city: 'تبریز',
    province: 'آذربایجان شرقی',
    address: 'تبریز، میدان آبرسان، بلوار آزادی، نبش کوچه چمران',
    phone: '۰۴۱-۳۳۳۵۶۷۸۹',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰',
    managerName: 'مهندس فرهمند',
    coordinates: { lat: 38.07, lng: 46.32 },
    keywords: ['تبریز', 'آذربایجان', 'آبرسان', 'ولیعصر تبریز', 'ائل گلی', 'شهناز']
  }
];

export function calculateGeoDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface RankedFieldExpertItem {
  rank: number;
  expert: {
    id: string;
    name: string;
    role: string;
    phone?: string;
    nationalId?: string;
    company?: string;
    branchId?: string;
    branchName?: string;
    rating?: number;
    expertise?: string;
    avatarUrl?: string;
  };
  branch: InsuranceBranch;
  distanceKm: number;
  distanceText: string;
  matchScore: number;
  activeCasesCount: number;
  availability: 'AVAILABLE' | 'ON_MISSION' | 'BUSY';
  availabilityText: string;
  reasonBadge: string;
  reasons: string[];
}

export function findBestMatchingBranch(
  insurerCode: string,
  userAddress: string,
  userCity: string = 'تهران',
  coordinates?: { lat?: number; lng?: number }
): { bestBranch: InsuranceBranch; nearbyBranches: InsuranceBranch[]; matchReason: string; distanceKm?: number } {
  const normAddress = (userAddress + ' ' + userCity).toLowerCase();
  
  // Filter branches for this insurer or multi-insurer branches
  const availableBranches = INSURANCE_BRANCHES.filter(
    (b) => b.insurerCode === insurerCode || b.insurerCode === 'all'
  );

  const fallbackBranch = availableBranches[0] || INSURANCE_BRANCHES[0];

  if (availableBranches.length === 0) {
    return {
      bestBranch: fallbackBranch,
      nearbyBranches: [fallbackBranch],
      matchReason: 'مرکز ارزیابی پیش‌فرض خسارت شرکت بیمه'
    };
  }

  // 1. If GPS coordinates are available, calculate Haversine distance
  if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number' && coordinates.lat > 0) {
    const branchesWithDist = availableBranches.map((branch) => {
      const dist = calculateGeoDistance(coordinates.lat!, coordinates.lng!, branch.coordinates.lat, branch.coordinates.lng);
      return { branch, dist };
    }).sort((a, b) => a.dist - b.dist);

    const closest = branchesWithDist[0];
    const nearby = branchesWithDist.slice(1, 3).map((item) => item.branch);

    return {
      bestBranch: closest.branch,
      nearbyBranches: [closest.branch, ...nearby],
      distanceKm: closest.dist,
      matchReason: `فاصله هوایی: ${closest.dist} کیلومتر تا محل ثبت‌شده لوکیشن`
    };
  }

  // 2. Fallback to keyword matching
  let bestScore = -1;
  let bestBranch = availableBranches[0];
  let matchedKeyword = '';

  for (const branch of availableBranches) {
    let score = 0;
    for (const kw of branch.keywords) {
      if (normAddress.includes(kw.toLowerCase())) {
        score += 10;
        matchedKeyword = kw;
      }
    }
    if (normAddress.includes(branch.city.toLowerCase())) {
      score += 5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestBranch = branch;
    }
  }

  const nearby = availableBranches.filter((b) => b.id !== bestBranch.id);

  const matchReason =
    bestScore > 0 && matchedKeyword
      ? `نزدیک‌ترین شعبه با توجه به موقعیت مکانی شما در محدوده «${matchedKeyword}»`
      : `مرکز تخصصی ارزیابی خسارت برگزیده برای منطقه ${userCity}`;

  return {
    bestBranch,
    nearbyBranches: [bestBranch, ...nearby.slice(0, 2)],
    matchReason
  };
}

export function getRankedFieldExpertsForAccidentLocation(params: {
  insurerCode: string;
  accidentLocation: string;
  userCity?: string;
  targetBranchId?: string;
  coordinates?: { lat?: number; lng?: number };
  activeCases?: Array<{ assignedFieldExpert?: { id: string } | null; status?: string }>;
  companyFieldExperts: Array<{
    id: string;
    name: string;
    role: string;
    phone?: string;
    nationalId?: string;
    company?: string;
    branchId?: string;
    branchName?: string;
    rating?: number;
    expertise?: string;
    avatarUrl?: string;
    status?: 'AVAILABLE' | 'ON_MISSION' | 'BUSY';
  }>;
}): {
  rankedExperts: RankedFieldExpertItem[];
  selectedBranchExperts: RankedFieldExpertItem[];
  otherBranchExperts: RankedFieldExpertItem[];
  bestBranch: InsuranceBranch;
  bestExpert: RankedFieldExpertItem | null;
  matchSummary: string;
} {
  const { insurerCode, accidentLocation, userCity = 'تهران', targetBranchId, coordinates, activeCases = [], companyFieldExperts } = params;
  
  const branchMatch = findBestMatchingBranch(insurerCode, accidentLocation, userCity, coordinates);
  const availableBranches = INSURANCE_BRANCHES.filter(
    (b) => b.insurerCode === insurerCode || b.insurerCode === 'all'
  );

  // If targetBranchId is specified, use that chosen branch, otherwise use best auto-matched branch
  let bestBranch = branchMatch.bestBranch;
  if (targetBranchId) {
    const foundTarget = availableBranches.find((b) => b.id === targetBranchId) || INSURANCE_BRANCHES.find((b) => b.id === targetBranchId);
    if (foundTarget) {
      bestBranch = foundTarget;
    }
  }

  // Compute active workload for each expert
  const workloadMap: Record<string, number> = {};
  activeCases.forEach((c) => {
    const expId = c.assignedFieldExpert?.id;
    if (expId && c.status !== 'پرداخت شده' && c.status !== 'رد شده') {
      workloadMap[expId] = (workloadMap[expId] || 0) + 1;
    }
  });

  const rankedExperts: RankedFieldExpertItem[] = companyFieldExperts.map((exp, idx) => {
    // Determine expert's affiliated branch
    let expBranch = availableBranches.find((b) => b.id === exp.branchId);
    if (!expBranch) {
      expBranch = availableBranches[idx % availableBranches.length] || bestBranch;
    }

    // Distance calculation
    let distKm = 2.5;
    if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number' && coordinates.lat > 0) {
      distKm = calculateGeoDistance(coordinates.lat, coordinates.lng, expBranch.coordinates.lat, expBranch.coordinates.lng);
    } else {
      // Approximate distance based on branch matching
      if (expBranch.id === bestBranch.id) {
        distKm = 1.2 + ((idx % 3) * 0.4);
      } else {
        distKm = 4.5 + ((idx % 4) * 1.5);
      }
    }
    distKm = Math.round(distKm * 10) / 10;

    const activeCount = workloadMap[exp.id] || 0;
    
    // Availability calculation
    let availability: 'AVAILABLE' | 'ON_MISSION' | 'BUSY' = 'AVAILABLE';
    let availabilityText = '🟢 آماده اعزام فوری (ظرفیت کامل)';
    if (activeCount >= 3) {
      availability = 'BUSY';
      availabilityText = `🔴 پرتردد (${activeCount} ماموریت فعال)`;
    } else if (activeCount > 0) {
      availability = 'ON_MISSION';
      availabilityText = `🟡 در دسترس (${activeCount} ماموریت جاری)`;
    }

    // Scoring algorithm (0 - 100)
    let score = 90;
    
    // 1. Same Branch Priority (Massive boost for experts of the selected/matched branch)
    const isSameBranch = expBranch.id === bestBranch.id;
    if (isSameBranch) {
      score += 8;
    } else {
      score -= Math.min(25, Math.round(distKm * 1.8) + 10);
    }

    // 2. Workload component (max 20 pts)
    score -= (activeCount * 5);

    // 3. Rating component
    const rating = exp.rating || 4.8;
    score += (rating - 4.5) * 12;

    score = Math.max(50, Math.min(99, Math.round(score)));

    const reasons: string[] = [];
    if (isSameBranch) {
      reasons.push(`مستقر در شعبه انتخابی (${expBranch.name})`);
    } else {
      reasons.push(`شعبه پشتیبان (${expBranch.name})`);
    }
    reasons.push(`فاصله تخمینی: ${distKm} کیلومتر از محل حادثه`);
    if (activeCount === 0) {
      reasons.push('بدون ماموریت معوق و آماده اعزام سریع');
    } else {
      reasons.push(`تعداد پرونده‌های جاری: ${activeCount} پرونده`);
    }
    if (exp.expertise) {
      reasons.push(exp.expertise);
    }

    const reasonBadge = isSameBranch
      ? `کارشناس مستقر در این شعبه (${distKm} km)`
      : `کارشناس معین سایر شعب (${distKm} km)`;

    return {
      rank: 0,
      expert: exp,
      branch: expBranch,
      distanceKm: distKm,
      distanceText: `${distKm} کیلومتر تا محل حادثه`,
      matchScore: score,
      activeCasesCount: activeCount,
      availability,
      availabilityText,
      reasonBadge,
      reasons
    };
  });

  // Sort by match score and distance
  rankedExperts.sort((a, b) => {
    // Put same branch experts first
    const aIsSame = a.branch.id === bestBranch.id;
    const bIsSame = b.branch.id === bestBranch.id;
    if (aIsSame && !bIsSame) return -1;
    if (!aIsSame && bIsSame) return 1;

    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  // Assign ranks 1, 2, 3...
  rankedExperts.forEach((item, index) => {
    item.rank = index + 1;
  });

  const selectedBranchExperts = rankedExperts.filter((r) => r.branch.id === bestBranch.id);
  const otherBranchExperts = rankedExperts.filter((r) => r.branch.id !== bestBranch.id);

  const bestExpert = selectedBranchExperts[0] || rankedExperts[0] || null;
  const matchSummary = bestExpert
    ? `بر اساس انتخاب شعبه «${bestBranch.name}»، ${bestExpert.expert.name} با انطباق ${bestExpert.matchScore}٪ در صدر فهرست کارشناسان میدانی این شعبه قرار دارد.`
    : 'کارشناسان میدانی شعبه مشخص گردیدند.';

  return {
    rankedExperts,
    selectedBranchExperts,
    otherBranchExperts,
    bestBranch,
    bestExpert,
    matchSummary
  };
}

export function queryBodyPolicyByNationalId(nationalId: string): BodyPolicyRecord {
  const cleanId = nationalId.trim();
  if (KNOWN_BODY_POLICIES[cleanId]) {
    return KNOWN_BODY_POLICIES[cleanId];
  }

  // Generate dynamic matching policy for any national ID
  const insurers: Array<{ code: string; name: string; prefix: string }> = [
    { code: 'dana', name: 'بیمه دانا', prefix: 'DANA' },
    { code: 'iran', name: 'بیمه ایران', prefix: 'IRAN' },
    { code: 'alborz', name: 'بیمه البرز', prefix: 'ALBORZ' },
    { code: 'asia', name: 'بیمه آسیا', prefix: 'ASIA' },
    { code: 'mellat', name: 'بیمه ملت', prefix: 'MELLAT' }
  ];

  // Hash the nationalId to choose an insurer deterministically
  const sum = cleanId.split('').reduce((acc, c) => acc + (c.charCodeAt(0) || 0), 0);
  const selectedInsurer = insurers[sum % insurers.length];
  const randNum = (Math.abs(sum * 9301 + 49297) % 8999) + 1000;

  return {
    nationalId: cleanId,
    ownerName: 'بیمه‌گذار محترم',
    phone: '۰۹۱۲' + ((sum * 13) % 9000000 + 1000000),
    plate: '۳۳-ج-' + ((sum * 7) % 900 + 100) + '-ایران-۲۱',
    carModel: 'پژو ۲۰۷i دنده‌ای پانوراما ۱۴۰۲',
    policyNo: `BD-1403-${randNum}-${selectedInsurer.prefix}`,
    insurerCode: selectedInsurer.code,
    insurerName: selectedInsurer.name,
    coverageCeiling: 750000000,
    discountPercent: 35,
    franchisePercent: 10,
    expireDate: '۱۴۰۴/۰۷/۱۰',
    issueDate: '۱۴۰۳/۰۷/۱۰',
    carVin: `IR${selectedInsurer.prefix}${randNum}99X`
  };
}
