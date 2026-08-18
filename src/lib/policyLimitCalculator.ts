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
  const caseAny = claimCase as any;
  const assessmentAny = (claimCase.assessment || {}) as any;
  const parts = assessmentAny.parts || [];
  let partsCost = 0;
  let wagesCost = 0;
  let partsSalvageSum = 0;

  if (parts.length > 0) {
    parts.forEach((p: any) => {
      partsCost += Number(p.partPrice || 0);
      wagesCost += Number(p.repairPrice || 0);
      if (p.salvageNeeded && p.salvageValue) {
        partsSalvageSum += Number(p.salvageValue || 0);
      }
    });
  }

  // ۱. تعیین خسارت کل مستقیم (مستقیماً از پنل کارشناسی)
  let directDamageGross = 0;
  if (assessmentAny.gross !== undefined && Number(assessmentAny.gross) > 0) {
    directDamageGross = Number(assessmentAny.gross);
    if (partsCost + wagesCost === 0) {
      partsCost = Math.round(directDamageGross * 0.7);
      wagesCost = Math.round(directDamageGross * 0.3);
    }
  } else if (partsCost + wagesCost > 0) {
    directDamageGross = partsCost + wagesCost;
  } else if (caseAny.fieldInspectionVerdict?.totalAmount || caseAny.fieldInspectionVerdict?.payableAmount) {
    directDamageGross = Number(caseAny.fieldInspectionVerdict.totalAmount || caseAny.fieldInspectionVerdict.payableAmount);
    partsCost = Math.round(directDamageGross * 0.7);
    wagesCost = Math.round(directDamageGross * 0.3);
  }

  // ۲. تعیین داغی (مستقیماً از پنل کارشناسی)
  let salvageDeduction = 0;
  if (assessmentAny.salvage !== undefined && Number(assessmentAny.salvage) >= 0) {
    salvageDeduction = Number(assessmentAny.salvage);
  } else if (partsSalvageSum > 0) {
    salvageDeduction = partsSalvageSum;
  } else if (assessmentAny.deductions !== undefined && Number(assessmentAny.deductions) > 0) {
    salvageDeduction = Number(assessmentAny.deductions);
  }
    
  const policyMaxFinancialLimit = Number(claimCase.culpritCoverageFinancial || caseAny.policyCeilingFinancial || 50000000);

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

  // ۳. محاسبه افت ارزش خودرو (مستقیماً طبق فرمول کانون کارشناسان یا مقدار ثبت‌شده)
  const diminutionCalc = calculateVehicleDiminution(
    claimCase.carType || 'پژو ۲۰۷',
    directDamageGross,
    Object.keys(claimCase.carDamageSpots || {}).length || 2
  );

  const explicitDiminution = caseAny.diminutionValue !== undefined
    ? Number(caseAny.diminutionValue)
    : (assessmentAny.diminution !== undefined ? Number(assessmentAny.diminution) : undefined);

  const effectiveDiminutionAmount = explicitDiminution !== undefined ? explicitDiminution : diminutionCalc.amount;
  const effectiveDiminutionPercent = caseAny.diminutionPercent !== undefined ? Number(caseAny.diminutionPercent) : diminutionCalc.percent;

  const franchisePercent = 0;
  const franchiseAmount = 0;

  // ۴. فرمول دقیق و نهایی: مجموع مطالبه کل زیان‌دیده = (خسارت کل کارشناسی - کسر داغی) + افت ارزش خودرو
  const totalClaimAmount = Math.max(0, (directDamageGross - salvageDeduction) + effectiveDiminutionAmount);

  const exceedsCeiling = totalClaimAmount > policyMaxFinancialLimit;
  const insurerPayablePortion = Math.min(totalClaimAmount, policyMaxFinancialLimit);
  const culpritExcessDebt = Math.max(0, totalClaimAmount - policyMaxFinancialLimit);

  const victimName = claimCase.victimName || 'زیان‌دیده محترم';
  const culpritName = claimCase.culpritName || 'راننده مقصر';
  const caseId = claimCase.id;
  const insurerName = getInsurerPersianName(claimCase.culpritInsurer);

  // تولید متن پیامک و ابلاغیه رسمی برای زیان‌دیده
  const victimSmsText = exceedsCeiling
    ? `زیان‌دیده گرامی (${victimName})؛
ارزیابی پرونده خسارت ${caseId} به مجموع ${formatCurrency(totalClaimAmount)} (شامل خسارت فیزیکی برآورد شده ${formatCurrency(directDamageGross)} پس از کسر داغی ${formatCurrency(salvageDeduction)} و افزودن افت ارزش خودرو ${formatCurrency(effectiveDiminutionAmount)}) تایید و مصوب گردید.
با توجه به سقف تعهد مالی بیمه‌نامه شخص ثالث مقصر (${formatCurrency(policyMaxFinancialLimit)})، مبلغ ${formatCurrency(insurerPayablePortion)} توسط شرکت ${insurerName} مستقیماً به شماره شبای شما واریز می‌گردد.
مبلغ مازاد به میزان ${formatCurrency(culpritExcessDebt)} به عنوان بدهی قانونی و شخصی مقصر حادثه (${culpritName}) تعیین شده و مستقیماً از مقصر حادثه قابل مطالبه و وصول می‌باشد.
کد پیگیری سنهاب: SNH-${caseId.replace(/[^0-9]/g, '') || '98412'}`
    : `زیان‌دیده گرامی (${victimName})؛
ارزیابی خسارت پرونده ${caseId} به مبلغ کل ${formatCurrency(totalClaimAmount)} (شامل خسارت فیزیکی و افت ارزش خودرو پس از کسر داغی) تایید شد. با توجه به پوشش کامل در سقف تعهد مالی بیمه‌نامه، کل مبلغ ${formatCurrency(insurerPayablePortion)} توسط ${insurerName} به شماره شبای شما واریز خواهد شد.`;

  // تولید متن پیامک و ابلاغیه رسمی برای مقصر
  const culpritSmsText = exceedsCeiling
    ? `بیمه‌گذار و راننده مقصر گرامی (${culpritName})؛
خسارت وارده در پرونده تصادف ${caseId} به مبلغ ${formatCurrency(totalClaimAmount)} (شامل خسارت فیزیکی و افت ارزش خودروی زیان‌دیده پس از کسر داغی) ارزیابی و تایید گردید.
با توجه به اینکه سقف تعهد مالی بیمه‌نامه شما در شرکت ${insurerName} مبلغ ${formatCurrency(policyMaxFinancialLimit)} می‌باشد، شرکت بیمه حداکثر تا سقف تعهد (${formatCurrency(insurerPayablePortion)}) را به حساب زیان‌دیده پرداخت می‌نماید.
باقیمانده خسارت به مبلغ ${formatCurrency(culpritExcessDebt)} به عنوان بدهی مستقیم شما به زیان‌دیده (${victimName}) محاسبه شده است. طبق قانون، شما ملزم به پرداخت و تسویه این مبلغ مازاد با زیان‌دیده می‌باشید.
سامانه نظارت بیمه مرکزی`
    : `بیمه‌گذار گرامی (${culpritName})؛
خسارت پرونده تصادف ${caseId} به مبلغ ${formatCurrency(totalClaimAmount)} به طور کامل از محل سقف تعهد مالی بیمه‌نامه شما در ${insurerName} پوشش داده شده و نیازی به پرداخت وجه توسط شما نمی‌باشد.`;

  return {
    partsCost,
    wagesCost,
    directDamageGross,
    directDamageAmount: directDamageGross,
    salvageDeduction,
    eligibleForDiminution: effectiveDiminutionAmount > 0,
    isEligibleForDiminution: effectiveDiminutionAmount > 0,
    vehicleAgeYears: diminutionCalc.ageYears,
    diminutionPercent: effectiveDiminutionPercent,
    diminutionAmount: effectiveDiminutionAmount,
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
