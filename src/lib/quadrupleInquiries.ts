import { QuadrupleInquiries, InquiryResultItem, ClaimCase } from '../types';

/**
 * تولید کد VIN استاندارد خودرو بر اساس مدل و پلاک
 */
export function generateDeterministicVin(plate: string = '', carType: string = ''): string {
  const cleanPlate = plate.replace(/[^0-9]/g, '') || '994821';
  const prefixMap: Record<string, string> = {
    'پژو ۲۰۶': 'IR206SD',
    'پژو پارس': 'IRPARS',
    'پژو ۲۰۷': 'IR207I',
    'سمند': 'IRSAMAND',
    'دنا': 'IRDENA',
    'تارا': 'IRTARA',
    'پراید': 'IRPRIDE',
    'تیبا': 'IRTIBA',
    'کوییک': 'IRQUICK',
    'شاهین': 'IRSHAHIN',
  };

  let prefix = 'IRAUTO';
  for (const [key, val] of Object.entries(prefixMap)) {
    if (carType && carType.includes(key)) {
      prefix = val;
      break;
    }
  }

  const paddedPlate = cleanPlate.padEnd(6, '0').slice(0, 6);
  const suffix = '829410'.slice(0, 4);
  return `${prefix}${paddedPlate}${suffix}`.toUpperCase().slice(0, 17);
}

/**
 * شبیه‌سازی جامع استعلامات چهارگانه رسمی
 * ۱. سنهاب (بیمه مرکزی)
 * ۲. فناوران (هسته مرکزی / Core شرکت بیمه‌گر)
 * ۳. کروکی راهور (فراجا)
 * ۴. ثبت احوال و سجلی
 */
export async function executeQuadrupleInquiries(params: {
  nationalId?: string;
  fullName?: string;
  phone?: string;
  plate?: string;
  croquiCode?: string;
  insurerName?: string;
  carType?: string;
  isCulprit?: boolean;
}): Promise<QuadrupleInquiries> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR');
  const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const fullDate = `${dateStr} ساعت ${timeStr}`;

  const cleanNationalId = params.nationalId || '0019283741';
  const safeName = params.fullName || (params.isCulprit ? 'محسن رضایی' : 'علیرضا تقوی');
  const safePlate = params.plate || '۱۲ب۳۴۵-ایران۷۷';
  const safeInsurer = params.insurerName || 'بیمه دانا';
  const safeCar = params.carType || 'پژو ۲۰۶';
  const safeCroquiCode = params.croquiCode || `KR-${Math.floor(100000 + Math.random() * 900000)}`;

  const vinNumber = generateDeterministicVin(safePlate, safeCar);

  // ۱. استعلام سنهاب (بیمه مرکزی)
  const sanhabTracking = `SNH-1403-${Math.floor(100000 + Math.random() * 900000)}`;
  const sanhab: InquiryResultItem = {
    service: 'SANHAB',
    serviceNameFa: 'سامانه سنهاب (بیمه مرکزی جمهوری اسلامی ایران)',
    trackingCode: sanhabTracking,
    inquiryDate: fullDate,
    status: 'VERIFIED',
    statusLabelFa: 'بیمه‌نامه معتبر و فعال',
    details: {
      policyNumber: `${safeInsurer.replace(/\s+/g, '')}-1403-${Math.floor(100000 + Math.random() * 900000)}`,
      insurerName: safeInsurer,
      validFrom: '۱۴۰۳/۰۱/۱۵',
      validTo: '۱۴۰۴/۰۱/۱۵',
      financialCeiling: 50_000_000, // ۵۰ میلیون تومان سقف تعهد مالی
      bodilyCeiling: 1_600_000_000, // سقف دیه کامل در ماه حرام
      driverCeiling: 900_000_000, // حوادث راننده
      conventionalThreshold: 400_000_000,
      isConventionalVehicle: true,
      policyStatus: 'فعال / فاقد تعلیق',
    },
    summaryText: `بیمه‌نامه شخص ثالث در سامانه نظارت و هدایت الکترونیک بیمه مرکزی (سنهاب) با سقف مالی ۵۰ میلیون تومان تایید شد.`,
  };

  // ۲. استعلام فناوران (Core شرکت بیمه)
  const fanavaranTracking = `FNV-CORE-${Math.floor(100000 + Math.random() * 900000)}`;
  const fanavaran: InquiryResultItem = {
    service: 'FANAVARAN',
    serviceNameFa: 'سامانه فناوران (سیستم جامع Core شرکت بیمه‌گر)',
    trackingCode: fanavaranTracking,
    inquiryDate: fullDate,
    status: 'VERIFIED',
    statusLabelFa: 'تایید صدور و سوابق در هسته بیمه‌گری',
    details: {
      coreSystem: 'Fanavaran Core Insurance Suite v4.8',
      issuingBranch: 'شعبه مرکزی و خسارت خودرو',
      noClaimDiscountPercent: 40, // ۴۰٪ تخفیف عدم خسارت
      claimHistoryCountThisYear: 0, // فاقد سابقه خسارت در سال جاری
      accountStatus: 'تسویه‌شده و فاقد بدهی اقساطی',
      contractActive: true,
      deductibleApproved: true,
    },
    summaryText: `سوابق بیمه‌گذار در هسته مرکزی فناوران (${safeInsurer}) تایید گردید؛ فاقد بدهی معوق و دارای ۴۰٪ تخفیف عدم خسارت.`,
  };

  // ۳. استعلام کروکی فراجا (راهور)
  const croquiTracking = safeCroquiCode;
  const croqui: InquiryResultItem = {
    service: 'CROQUI',
    serviceNameFa: 'سامانه جامع تصادفات و کروکی راهور (فراجا)',
    trackingCode: croquiTracking,
    inquiryDate: fullDate,
    status: 'VERIFIED',
    statusLabelFa: 'کروکی الکترونیک تایید شده راهور',
    details: {
      croquiReportNumber: croquiTracking,
      officerBadgeId: 'PL-8491',
      policeStation: 'پلیس راهور منطقه ۳ تهران بزرگ',
      incidentDateTime: `${dateStr} ساعت ۰۹:۳۰`,
      faultPlateNumber: params.isCulprit ? safePlate : '۶۸ج۸۹۱-ایران۱۱',
      victimPlateNumber: params.isCulprit ? '۲۴د۳۱۱-ایران۲۲' : safePlate,
      faultDeterminationPercentage: params.isCulprit ? 100 : 0,
      digitalStampVerified: true,
      accidentKind: 'برخورد پهلو به پهلو در تغییر مسیر ناگهانی',
    },
    summaryText: `کد رهگیری کروکی الکترونیک در سامانه راهور احراز گردید؛ مقصر حادثه و اصالت صورت‌جلسه پلیس ثبت قطعی شد.`,
  };

  // ۴. استعلام ثبت احوال و سجلی
  const registryTracking = `SJL-${Math.floor(100000 + Math.random() * 900000)}`;
  const civilRegistry: InquiryResultItem = {
    service: 'REGISTRY',
    serviceNameFa: 'سازمان ثبت احوال کشور و پایگاه سجلی',
    trackingCode: registryTracking,
    inquiryDate: fullDate,
    status: 'VERIFIED',
    statusLabelFa: 'انطباق ۱۰۰٪ هویت و کد ملی',
    details: {
      nationalId: cleanNationalId,
      fullName: safeName,
      fatherName: 'غلام‌رضا',
      birthDate: '۱۳۶۵/۰۴/۱۸',
      vitalStatus: 'حَی (قید حیات)',
      shahkarVerification: 'منطبق با شماره همراه ثبت شده',
      drivingLicenseNumber: `DL-${cleanNationalId.slice(0, 8)}`,
      licenseValidityStatus: 'دارای اعتبار قانونی تا ۱۴۰۶',
    },
    summaryText: `اطلاعات هویتی با پایگاه سازمان ثبت احوال و سامانه شاهکار تطبیق داده شد؛ اصالت کد ملی و حیات دارنده محرز است.`,
  };

  return {
    sanhab,
    fanavaran,
    croqui,
    civilRegistry,
    verifiedAt: fullDate,
    allVerified: true,
    chassisExtracted: true,
    chassisVin: vinNumber,
  };
}

/**
 * بازیابی یا ساخت استعلامات چهارگانه برای پرونده
 */
export function getOrGenerateCaseQuadrupleInquiries(claimCase: ClaimCase): QuadrupleInquiries {
  if (claimCase.quadrupleInquiries) {
    return claimCase.quadrupleInquiries;
  }

  const dateStr = claimCase.date || '۱۴۰۳/۰۸/۱۲';
  const timeStr = '۱۰:۱۵';
  const fullDate = `${dateStr} ساعت ${timeStr}`;

  const victimVin = claimCase.victimVin || generateDeterministicVin(claimCase.victimPlate, claimCase.carType);
  const culpritVin = claimCase.culpritVin || generateDeterministicVin(claimCase.culpritPlate, claimCase.culpritCarType);

  const sanhabTracking = claimCase.policyInquirySanhab?.code || claimCase.sanhabInquiry?.trackingCode || 'SNH-994821';
  const croquiCode = claimCase.sceneReportCode || claimCase.croquiData?.reportNumber || 'KR-882194';

  return {
    sanhab: {
      service: 'SANHAB',
      serviceNameFa: 'سامانه سنهاب (بیمه مرکزی جمهوری اسلامی ایران)',
      trackingCode: sanhabTracking,
      inquiryDate: fullDate,
      status: 'VERIFIED',
      statusLabelFa: 'بیمه‌نامه معتبر و فعال',
      details: {
        policyNumber: claimCase.culpritPolicyNo || 'DAN-1403-882194',
        insurerName: claimCase.culpritInsurer || 'بیمه دانا',
        financialCeiling: claimCase.culpritCoverageFinancial || 50_000_000,
        bodilyCeiling: claimCase.culpritCoverageBodily || 1_600_000_000,
        policyStatus: 'فعال در سامانه بیمه مرکزی',
        isConventionalVehicle: true,
      },
      summaryText: 'استعلام اصالت بیمه‌نامه شخص ثالث و سقف تعهد مالی در سامانه نظارت سنهاب بیمه مرکزی تایید گردید.',
    },
    fanavaran: {
      service: 'FANAVARAN',
      serviceNameFa: 'سامانه فناوران (سیستم جامع Core شرکت بیمه‌گر)',
      trackingCode: `FNV-CORE-${Math.floor(100000 + Math.random() * 900000)}`,
      inquiryDate: fullDate,
      status: 'VERIFIED',
      statusLabelFa: 'تایید صدور و وضعیت حساب Core',
      details: {
        coreSystem: 'Fanavaran Core Insurance System',
        insurer: claimCase.culpritInsurer || 'بیمه دانا',
        discountPercent: 40,
        unpaidDebts: 'فاقد بدهی معوق',
        activePolicy: true,
      },
      summaryText: `اطلاعات بیمه‌نامه در سیستم جامع بیمه‌گری فناوران (${claimCase.culpritInsurer || 'بیمه دانا'}) منطبق و فاقد انسداد است.`,
    },
    croqui: {
      service: 'CROQUI',
      serviceNameFa: 'سامانه جامع تصادفات و کروکی راهور (فراجا)',
      trackingCode: croquiCode,
      inquiryDate: fullDate,
      status: 'VERIFIED',
      statusLabelFa: claimCase.hasKroki ? 'کروکی الکترونیک راهور تایید شد' : 'عدم نیاز به کروکی (زیر سقف قانونی)',
      details: {
        croquiReportNumber: croquiCode,
        hasKroki: claimCase.hasKroki !== false,
        faultPlate: claimCase.culpritPlate,
        victimPlate: claimCase.victimPlate,
        policeBadge: 'PL-5512',
      },
      summaryText: claimCase.hasKroki
        ? 'کد رهگیری کروکی الکترونیک در سامانه راهور استعلام شده و مقصر بودن خودروی طرف مقابل قطعی است.'
        : 'با توجه به توافق طرفین و خسارت زیر سقف مصوب، استعلام عدم سابقه سوءاستفاده تایید شد.',
    },
    civilRegistry: {
      service: 'REGISTRY',
      serviceNameFa: 'سازمان ثبت احوال کشور و سامانه سجلی',
      trackingCode: `SJL-${Math.floor(100000 + Math.random() * 900000)}`,
      inquiryDate: fullDate,
      status: 'VERIFIED',
      statusLabelFa: 'احراز هویت سجلی و شاهکار تایید شد',
      details: {
        victimNationalId: claimCase.victimNationalId || '0018294711',
        victimName: claimCase.victimName,
        culpritNationalId: claimCase.culpritNationalId || '0029384722',
        culpritName: claimCase.culpritName,
        aliveStatus: 'معتبر و در قید حیات',
        mobileMatch: true,
      },
      summaryText: 'کد ملی و مشخصات شناسنامه‌ای طرفین با پایگاه سجلی ثبت احوال کشور و سامانه شاهکار تطبیق داده شد.',
    },
    verifiedAt: fullDate,
    allVerified: true,
    chassisExtracted: true,
    chassisVin: victimVin,
  };
}
