import { ClaimCase, PoliceReport, CroquiData } from '../types';
import { getInsurerPersianName } from './storage';

export interface StandardPoliceReportData {
  hasCroqui: boolean;
  croquiType: 'paper' | 'electronic';
  croquiTypePersian: string;
  reportCode: string;
  incidentDateTime: string;
  exactLocation: string;
  accidentType: string;
  roadCondition: string;
  briefDescription: string;
  faultDetermination: string;
  faultPercent: number;
  faultDriver: {
    name: string;
    nationalId: string;
    plate: string;
    carType: string;
    insurer: string;
    policyNo: string;
  };
  victimDriver: {
    name: string;
    nationalId: string;
    plate: string;
    carType: string;
    insurer: string;
    policyNo: string;
  };
  officerName: string;
  officerCode: string;
  policeUnit: string;
  inquiryStatus: string;
  inquiryDate: string;
  croquiPhotoUrl?: string;
  sketchUrl?: string;
  discrepancyNotes?: string;
}

/**
 * Returns normalized and consistent police report & croqui inquiry details for any ClaimCase.
 * Respects customer's selection during case creation (paper vs electronic).
 */
export function getStandardPoliceReport(claimCase: ClaimCase): StandardPoliceReportData {
  const hasCroqui = !!(claimCase.hasKroki || claimCase.sceneReportCode || claimCase.croquiData || claimCase.policeReport || claimCase.customerKrokiPhoto);
  
  // Determine croquiType: customer registration is primary source
  let croquiType: 'paper' | 'electronic' = 'electronic';
  if (claimCase.croquiType) {
    croquiType = claimCase.croquiType;
  } else if (claimCase.croquiData?.croquiType) {
    croquiType = claimCase.croquiData.croquiType;
  } else if (claimCase.policeReport?.croquiType) {
    croquiType = claimCase.policeReport.croquiType;
  } else if (claimCase.customerKrokiPhoto) {
    croquiType = 'paper';
  }

  const croquiTypePersian = croquiType === 'electronic'
    ? 'کروکی الکترونیکی پلیس راهور (ثبت برخط فراجا)'
    : 'کروکی کاغذی ترسیمی (دست‌نویس و تصویربرداری شده)';

  const reportCode =
    claimCase.sceneReportCode ||
    claimCase.croquiData?.reportNumber ||
    claimCase.policeReport?.code ||
    claimCase.policeReport?.reportNumber ||
    `KR-${claimCase.id.replace(/[^0-9]/g, '') || '140501'}`;

  // Date and Time
  const incidentDateTime =
    claimCase.croquiData?.incidentDate ||
    claimCase.policeReport?.incidentDateTime ||
    claimCase.date ||
    '۱۴۰۵/۰۵/۱۴ - ساعت ۱۰:۴۵';

  // Exact Location
  const exactLocation =
    claimCase.croquiData?.location ||
    claimCase.policeReport?.location ||
    claimCase.accidentLocation ||
    claimCase.address ||
    'تهران، تقاطع بزرگراه همت و اشرفی اصفهانی، مسیر شرق به غرب';

  // Accident Type (نوع تصادف)
  let accidentType =
    claimCase.croquiData?.accidentType ||
    claimCase.policeReport?.accidentType;

  if (!accidentType) {
    if (claimCase.isBodily) {
      accidentType = 'تصادف جرحی و خسارتی - برخورد دو وسیله نقلیه در تقاطع';
    } else if (claimCase.chainTotal && claimCase.chainTotal > 1) {
      accidentType = `تصادف زنجیره‌ای خسارتی (برخورد پیاپی ${claimCase.chainTotal} خودرو)`;
    } else {
      accidentType = 'تصادف خسارتی دو خودرو (عدم رعایت فاصله طولی و برخورد جلو به عقب)';
    }
  }

  // Road & Environmental Condition (وضعیت جاده)
  const roadCondition =
    claimCase.croquiData?.roadCondition ||
    claimCase.policeReport?.roadCondition ||
    'آسفالت خشک و هموار، شرایط جوی صاف و آفتابی، روشنایی کامل روز، میدان دید مناسب و بدون مانع فیزیکی';

  // Brief description by police officer (شرح مختصر افسر کاردان فنی)
  let briefDescription =
    claimCase.croquiData?.briefDescription ||
    claimCase.policeReport?.briefDescription ||
    claimCase.policeReport?.description ||
    claimCase.writtenReport;

  if (!briefDescription || briefDescription.trim().length === 0) {
    briefDescription = `خودرو ${claimCase.culpritCarType || 'مقصر'} در مسیر مستقیم در حال حرکت بوده که به علت عدم توجه کافی به جلو و عدم رعایت فاصله طولی مناسب با خودرو ${claimCase.carType || 'زیان‌دیده'} از قسمت جلو به عقب آن برخورد نموده و منجر به بروز خسارت مالی گردیده است.`;
  }

  // Fault determination (تعیین مقصر و علت تامه)
  const faultPercent = claimCase.culpritFaultPercent ?? 100;
  let faultDetermination =
    claimCase.croquiData?.faultDetermination ||
    claimCase.policeReport?.faultDetermination;

  if (!faultDetermination) {
    if (faultPercent === 100) {
      faultDetermination = `۱۰۰٪ مقصر حادثه: راننده خودرو ${claimCase.culpritCarType || 'مقصر'} به نام «${claimCase.culpritName}» (پلاک: ${claimCase.culpritPlate}) به علت نقض ماده ۱۷۱ آیین‌نامه راهنمایی و رانندگی (عدم رعایت فاصله طولی و بی‌توجهی به جلو).`;
    } else if (faultPercent === 50) {
      faultDetermination = `تقصیر مشترک ۵۰٪ - ۵۰٪ طرفین به علت تغییر مسیر همزمان بدون رعایت حق تقدم عبور.`;
    } else {
      faultDetermination = `مقصر حادثه: راننده طرف مقابل به علت عدم رعایت مقررات راهور.`;
    }
  }

  // Fault Driver Info
  const faultDriver = {
    name: claimCase.croquiData?.faultDriver?.fullName || claimCase.culpritName || 'رضا کاظمی',
    nationalId: claimCase.croquiData?.faultDriver?.nationalId || claimCase.culpritVin || '۰۰۷۱۶۲۵۳۴۲',
    plate: claimCase.croquiData?.faultDriver?.plateNumber || claimCase.culpritPlate || '۱۲ ب ۳۴۵ - ایران ۱۱',
    carType: claimCase.culpritCarType || 'پژو ۲۰۶',
    insurer: getInsurerPersianName(claimCase.culpritInsurer) || 'بیمه ایران',
    policyNo: claimCase.croquiData?.faultDriver?.insurancePolicyNumber || claimCase.culpritPolicyNo || 'POL-1405-9921',
  };

  // Victim Driver Info
  const victimDriver = {
    name: claimCase.croquiData?.victimDriver?.fullName || claimCase.victimName || 'پریسا حسینی',
    nationalId: claimCase.croquiData?.victimDriver?.nationalId || claimCase.victimVin || '۰۰۸۲۹۱۷۳۶۴',
    plate: claimCase.croquiData?.victimDriver?.plateNumber || claimCase.victimPlate || claimCase.plate || '۴۴ ج ۷۸۹ - ایران ۲۲',
    carType: claimCase.carType || 'تارا اتوماتیک',
    insurer: getInsurerPersianName(claimCase.victimInsurer) || 'بیمه دانا',
    policyNo: claimCase.croquiData?.victimDriver?.insurancePolicyNumber || 'POL-1405-1102',
  };

  // Officer Info
  const officerName =
    claimCase.croquiData?.officerName ||
    claimCase.policeReport?.officerName ||
    'سروان مهدی صادقی (کارشناس عالی تصادفات)';

  const officerCode =
    claimCase.croquiData?.policeBadgeId ||
    claimCase.policeReport?.officerCode ||
    'POL-88219';

  const policeUnit =
    claimCase.croquiData?.policeUnit ||
    claimCase.policeReport?.unit ||
    'منطقه ۵ پلیس راهور تهران بزرگ';

  const inquiryStatus =
    claimCase.croquiData?.inquiryStatus ||
    claimCase.policeReport?.inquiryStatus ||
    'استعلام برخط فراجا: معتبر، فعال و ثبت شده در سامانه جامع تصادفات کشور';

  const inquiryDate =
    claimCase.croquiData?.inquiryDate ||
    claimCase.policeReport?.inquiryDate ||
    '۱۴۰۵/۰۵/۱۴ ۱۱:۱۰ (برخط)';

  const croquiPhotoUrl = claimCase.customerKrokiPhoto || claimCase.croquiData?.fileUrl;

  return {
    hasCroqui,
    croquiType,
    croquiTypePersian,
    reportCode,
    incidentDateTime,
    exactLocation,
    accidentType,
    roadCondition,
    briefDescription,
    faultDetermination,
    faultPercent,
    faultDriver,
    victimDriver,
    officerName,
    officerCode,
    policeUnit,
    inquiryStatus,
    inquiryDate,
    croquiPhotoUrl,
    discrepancyNotes: claimCase.croquiData?.discrepancyNotes || undefined
  };
}
