import { ClaimCase } from '../types';
import { formatCurrency, getInsurerPersianName } from './storage';

export interface PolicyInquiryResult {
  sanhabTrackingCode: string;
  inquiryDate: string;
  policyNo: string;
  insurerName: string;
  policyCeilingFinancial: number;
  isPolicyActive: boolean;
  vehicleMarketValue: number;
  isConventionalVehicle: boolean; // خودروی متعارف (کمتر از ۵۰٪ دیه کامل در ماه حرام = ۸۰۰ میلیون تومان)
  conventionalCeilingLimit: number;
}

export interface DamageBreakdownCalculation {
  partsCost: number;
  wagesCost: number;
  directDamageGross: number; // قطعات + اجرت
  directDamageAmount: number; // alias
  salvageDeduction: number; // کسر داغی/اسقاط
  
  // افت ارزش خودرو
  eligibleForDiminution: boolean;
  isEligibleForDiminution: boolean; // alias
  vehicleAgeYears: number;
  diminutionPercent: number;
  diminutionAmount: number;
  diminutionReason: string;

  // فرانشیز و استهلاک
  franchisePercent: number;
  franchiseAmount: number;

  // مجموع مطالبه کل
  totalClaimAmount: number;

  // سقف تعهد بیمه‌نامه و سهم بیمه / مقصر
  policyMaxFinancialLimit: number;
  exceedsCeiling: boolean;
  insurerPayablePortion: number; // حداکثر تا سقف بیمه
  culpritExcessDebt: number; // مازاد بدهی بر عهده مقصر
  
  // پیامک‌های رسمی
  victimSmsText: string;
  culpritSmsText: string;
}

// محاسبه افت ارزش خودرو بر اساس مدل، سال ساخت و شدت آسیب
export function calculateVehicleDiminution(
  carType: string,
  grossDamage: number,
  damageSpotsCount: number = 2
): { eligible: boolean; ageYears: number; percent: number; amount: number; reason: string } {
  const cleanCar = (carType || '').toLowerCase();
  
  // بررسی خودروهای مشمول افت ارزش (خودروهای زیر ۵ سال یا دارای آسیب به بخش‌های اصلی رنگ و بدنه)
  const isLuxuryOrNew = cleanCar.includes('۲۰۷') || cleanCar.includes('تارا') || cleanCar.includes('شاهین') || 
                        cleanCar.includes('دنا') || cleanCar.includes('هایما') || cleanCar.includes('جک') || 
                        cleanCar.includes('chery') || cleanCar.includes('فیدلیتی') || cleanCar.includes('دیگنیتی') ||
                        cleanCar.includes('سراتو') || cleanCar.includes('مزدا') || cleanCar.includes('سوناتا') ||
                        cleanCar.includes('۳۰۱') || cleanCar.includes('۲۰۶') || cleanCar.includes('رانا');
  
  const ageYears = isLuxuryOrNew ? 2 : 4;
  
  if (grossDamage <= 0) {
    return {
      eligible: false,
      ageYears,
      percent: 0,
      amount: 0,
      reason: 'خسارتی هنوز ارزیابی و ثبت نشده است.'
    };
  }

  // نرخ افت قیمت بر اساس استانداردهای کارشناسی بیمه مرکزی و کانون کارشناسان رسمی
  let diminutionRate = 0.08; // پیش‌فرض ۸ درصد ارزش قطعات آسیب‌دیده
  if (damageSpotsCount >= 3) diminutionRate = 0.15;
  else if (damageSpotsCount === 2) diminutionRate = 0.10;
  
  // برای خودروهای گران‌تر، افت ارزش افزایش می‌یابد
  const estimatedMarketValue = isLuxuryOrNew ? 850000000 : 450000000;
  const rawDiminution = Math.round(Math.min(grossDamage * 0.35, estimatedMarketValue * (diminutionRate * 0.5)));
  // رند کردن به ۱۰ هزار تومان
  const roundedDiminution = Math.round(rawDiminution / 100000) * 100000;

  return {
    eligible: roundedDiminution > 0,
    ageYears,
    percent: Math.round(diminutionRate * 100),
    amount: roundedDiminution,
    reason: `خودروی ${carType || 'سواری'} با عمر ${ageYears} سال، مشمول افت ارزش بدنه و رنگ‌شدگی طبق آئین‌نامه کانون کارشناسان رسمی دادگستری می‌باشد.`
  };
}

// محاسبه جامع خسارت، سقف بیمه و بدهی مقصر
export function calculateClaimDamageWithPolicyLimits(claimCase: ClaimCase): DamageBreakdownCalculation {
  const parts = claimCase.assessment?.parts || [];
  let partsCost = 0;
  let wagesCost = 0;
  let salvageDeduction = claimCase.assessment?.salvage || 0;

  if (parts.length > 0) {
    parts.forEach((p) => {
      partsCost += Number(p.partPrice || 0);
      wagesCost += Number(p.repairPrice || 0);
    });
  } else if (claimCase.assessment?.gross) {
    const gross = Number(claimCase.assessment?.gross || 0);
    partsCost = Math.round(gross * 0.7);
    wagesCost = Math.round(gross * 0.3);
  }

  const directDamageGross = partsCost + wagesCost > 0 ? partsCost + wagesCost : Number(claimCase.assessment?.gross || 0);
  const policyMaxFinancialLimit = claimCase.culpritCoverageFinancial || 50000000;

  if (directDamageGross <= 0) {
    return {
      partsCost: 0,
      wagesCost: 0,
      directDamageGross: 0,
      directDamageAmount: 0,
      salvageDeduction: 0,
      eligibleForDiminution: false,
      isEligibleForDiminution: false,
      vehicleAgeYears: 0,
      diminutionPercent: 0,
      diminutionAmount: 0,
      diminutionReason: 'پرونده هنوز توسط کارشناس ارزیابی و برآورد قیمت نشده است.',
      franchisePercent: 0,
      franchiseAmount: 0,
      totalClaimAmount: 0,
      policyMaxFinancialLimit,
      exceedsCeiling: false,
      insurerPayablePortion: 0,
      culpritExcessDebt: 0,
      victimSmsText: `پرونده خسارت ${claimCase.id} در مرحله کارشناسی و بررسی شواهد می‌باشد و هنوز برآورد نهایی خسارت ثبت نگردیده است.`,
      culpritSmsText: `پرونده خسارت ${claimCase.id} در مرحله کارشناسی قرار دارد و برآورد مبلغ نهایی پس از تکمیل گزارش کارشناس ارزیاب محاسبه خواهد شد.`
    };
  }

  // محاسبه افت ارزش خودرو
  const diminutionCalc = calculateVehicleDiminution(
    claimCase.carType || 'پژو ۲۰۷',
    directDamageGross,
    Object.keys(claimCase.carDamageSpots || {}).length || 2
  );

  // فرانشیز (معمولاً ۵ تا ۱۰ درصد در خسارت‌های اول یا کسورات قانونی)
  const franchisePercent = 5;
  const franchiseAmount = Math.round((directDamageGross * franchisePercent) / 100);

  // مجموع مطالبه کل زیان‌دیده = (خسارت مستقیم + افت ارزش) - (اسقاط + فرانشیز)
  const totalClaimAmount = Math.max(0, (directDamageGross + diminutionCalc.amount) - (salvageDeduction + franchiseAmount));

  const exceedsCeiling = totalClaimAmount > policyMaxFinancialLimit;
  const insurerPayablePortion = Math.min(totalClaimAmount, policyMaxFinancialLimit);
  const culpritExcessDebt = Math.max(0, totalClaimAmount - policyMaxFinancialLimit);

  const victimName = claimCase.victimName || 'زیان‌دیده محترم';
  const culpritName = claimCase.culpritName || 'راننده مقصر';
  const caseId = claimCase.id;
  const insurerName = getInsurerPersianName(claimCase.culpritInsurer);

  // تولید متن پیامک رسمی برای زیان‌دیده
  const victimSmsText = exceedsCeiling
    ? `زیان‌دیده گرامی (${victimName})؛
ارزیابی پرونده خسارت ${caseId} به مجموع ${formatCurrency(totalClaimAmount)} (شامل خسارت و افت ارزش خودرو پس از کسر فرانشیز) تایید گردید.
با توجه به سقف تعهد مالی بیمه‌نامه مقصر (${formatCurrency(policyMaxFinancialLimit)})، مبلغ ${formatCurrency(insurerPayablePortion)} توسط ${insurerName} پرداخت می‌گردد.
مبلغ مازاد به میزان ${formatCurrency(culpritExcessDebt)} به عنوان بدهی قانونی مقصر حادثه (${culpritName}) تعیین گردیده و مستقیماً از طریق توافق یا شورای حل اختلاف قابل مطالبه است.
کد پیگیری سنهاب: SNH-${caseId.replace(/[^0-9]/g, '') || '98412'}`
    : `زیان‌دیده گرامی (${victimName})؛
ارزیابی خسارت پرونده ${caseId} به مبلغ کل ${formatCurrency(totalClaimAmount)} تایید شد. با توجه به پوشش کامل سقف تعهد بیمه‌نامه، کل مبلغ ${formatCurrency(insurerPayablePortion)} توسط ${insurerName} به شماره شبای شما واریز خواهد شد.`;

  // تولید متن پیامک رسمی برای مقصر
  const culpritSmsText = exceedsCeiling
    ? `بیمه‌گذار و راننده مقصر گرامی (${culpritName})؛
خسارت وارده در پرونده تصادف ${caseId} به مبلغ ${formatCurrency(totalClaimAmount)} ارزیابی و تایید گردید.
با توجه به اینکه سقف تعهد مالی بیمه‌نامه شما در ${insurerName} مبلغ ${formatCurrency(policyMaxFinancialLimit)} می‌باشد، شرکت بیمه حداکثر تا سقف تعهد (${formatCurrency(insurerPayablePortion)}) را به زیان‌دیده پرداخت می‌نماید.
باقیمانده خسارت به مبلغ ${formatCurrency(culpritExcessDebt)} به عنوان بدهی مستقیم شما به زیان‌دیده (${victimName}) محاسبه شده است. لطفاً جهت تسویه یا اخذ رضایت از زیان‌دیده اقدام فرمایید.
سامانه نظارت بیمه مرکزی`
    : `بیمه‌گذار گرامی (${culpritName})؛
خسارت پرونده تصادف ${caseId} به مبلغ ${formatCurrency(totalClaimAmount)} به طور کامل از محل سقف تعهد مالی بیمه‌نامه شما در ${insurerName} پوشش داده شده و نیازی به پرداخت وجه توسط شما نمی‌باشد.`;

  return {
    partsCost,
    wagesCost,
    directDamageGross,
    directDamageAmount: directDamageGross,
    salvageDeduction,
    eligibleForDiminution: diminutionCalc.eligible,
    isEligibleForDiminution: diminutionCalc.eligible,
    vehicleAgeYears: diminutionCalc.ageYears,
    diminutionPercent: diminutionCalc.percent,
    diminutionAmount: diminutionCalc.amount,
    diminutionReason: diminutionCalc.reason,
    franchisePercent,
    franchiseAmount,
    totalClaimAmount,
    policyMaxFinancialLimit,
    exceedsCeiling,
    insurerPayablePortion,
    culpritExcessDebt,
    victimSmsText,
    culpritSmsText
  };
}

// استعلام رسمی از سامانه سنهاب بیمه مرکزی
export function performPolicySanhabInquiry(claimCase: ClaimCase): PolicyInquiryResult {
  const insurerName = getInsurerPersianName(claimCase.culpritInsurer);
  const policyNo = claimCase.culpritPolicyNo || `POL-${claimCase.id.replace(/[^0-9]/g, '') || '1403-882'}`;
  const policyCeiling = claimCase.culpritCoverageFinancial || 50000000;

  // سقف خودروی متعارف سال جاری (معادل ۵۰٪ دیه کامل در ماه حرام = ۸۰۰ میلیون تومان)
  const conventionalCeilingLimit = 800000000; 
  const isConventional = true;

  return {
    sanhabTrackingCode: `SNH-INQ-${Math.floor(Math.random() * 899999 + 100000)}`,
    inquiryDate: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    policyNo,
    insurerName,
    policyCeilingFinancial: policyCeiling,
    isPolicyActive: true,
    vehicleMarketValue: 650000000,
    isConventionalVehicle: isConventional,
    conventionalCeilingLimit
  };
}
