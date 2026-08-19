/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - High-Fidelity Domain Mock Intelligence Provider
 * Provides safe, deterministic, explainable Persian insurance intelligence.
 */

import {
  ClaimCase,
  MediaFile,
  AdditionalDocItem,
  StaffMember,
} from '../../../types';
import {
  AIResult,
  AIAnalysisOptions,
  EvidenceIntelligenceResult,
  ClaimIntelligenceResult,
  DamageIntelligenceResult,
  EstimateIntelligenceResult,
  AssignmentIntelligenceResult,
  RoutingIntelligenceResult,
  ReviewIntelligenceResult,
  IntegrityIntelligenceResult,
  SummaryIntelligenceResult,
  NextBestActionIntelligenceResult,
  DamageAnalysisContext,
  EstimateContext,
  NextBestActionContext,
  AISourceReference,
} from '../types';
import { IAIProvider } from './baseProvider';
import { calibrateConfidence } from '../confidence';
import { createAuditTrace } from '../audit';

export class MockIntelligenceProvider implements IAIProvider {
  readonly providerName = 'MOCK_PROVIDER';
  readonly modelVersion = 'claimflow-rule-engine-v1.2';

  private createEnvelope<T>(
    capability: any,
    claimId: string,
    result: T,
    score: number,
    explanation: string,
    bullets: string[],
    sources: AISourceReference[],
    latencyMs = 80
  ): AIResult<T> {
    return {
      id: `ai-${capability}-${claimId}-${Date.now()}`,
      capability,
      claimId,
      status: 'READY',
      result,
      confidence: calibrateConfidence(score, [], explanation),
      modelVersion: this.modelVersion,
      timestamp: new Date().toISOString(),
      sourceReferences: sources,
      explanation,
      explanationBullets: bullets,
      latencyMs,
      humanReview: {
        status: 'PENDING_REVIEW',
      },
      auditTrace: createAuditTrace(
        capability,
        this.modelVersion,
        'MOCK_PROVIDER',
        latencyMs
      ),
    };
  }

  async analyzeEvidence(
    claim: ClaimCase,
    evidenceItems: (MediaFile | AdditionalDocItem)[] = [],
    _options?: AIAnalysisOptions
  ): Promise<AIResult<EvidenceIntelligenceResult>> {
    // Combine all available files
    const allFiles: Array<{ name: string; type?: string; dataUrl?: string }> = [];
    if (claim.files && Array.isArray(claim.files)) {
      claim.files.forEach((f) => allFiles.push({ name: f.name || 'مدرک', type: f.type, dataUrl: f.dataUrl }));
    }
    if (claim.additionalDocs && Array.isArray(claim.additionalDocs)) {
      claim.additionalDocs.forEach((d) => allFiles.push({ name: d.title || d.docType || 'مدرک ضمیمه', type: d.fileType, dataUrl: d.dataUrl || d.url }));
    }
    if (evidenceItems && Array.isArray(evidenceItems)) {
      evidenceItems.forEach((item) => {
        const name = (item as any).name || (item as any).title || (item as any).docType || 'مدرک ارسالی';
        const type = (item as any).type || (item as any).fileType || 'image';
        const dataUrl = (item as any).dataUrl || (item as any).url;
        allFiles.push({ name, type, dataUrl });
      });
    }

    const hasKroki = !!(claim.hasKroki || claim.sceneReportCode || claim.croquiData || claim.customerKrokiPhoto || allFiles.some(f => f.name?.includes('کروکی')));

    // Standard 8 angles for car accident documentation
    const REQUIRED_ANGLES = ['پلاک', 'جلو', 'عقب', 'راست', 'چپ', 'سقف', 'خسارت ۱', 'خسارت ۲'];
    const presentAngleNames = allFiles.map((f) => f.name || '');
    const missingAnglesFa = REQUIRED_ANGLES.filter((ang) => !presentAngleNames.some((n) => n.includes(ang)));

    // Analyze photo quality for each file
    const photoQualityAnalysis = allFiles.map((file, idx) => {
      const fileName = file.name || `تصویر شماره ${idx + 1}`;
      const isBlurry = fileName.includes('مشکوک') || fileName.includes('تار');
      const isPoor = isBlurry;
      const detectedPlate = claim.plate || claim.victimPlate || '۱۲ ب ۳۴۵ ایران ۱۱';
      const plateMatches = !fileName.includes('مغایر');

      return {
        mediaName: fileName,
        quality: isPoor ? ('POOR' as const) : ('GOOD' as const),
        isBlurry,
        isAngleCorrect: true,
        detectedPlate: fileName.includes('پلاک') ? detectedPlate : undefined,
        plateMatchesClaim: plateMatches,
        notesFa: isBlurry
          ? 'تصویر به دلیل لرزش دوربین یا نور ناکافی تار است؛ بارگذاری مجدد پیشنهاد می‌شود.'
          : 'وضوح، زاویه دید و کادربندی تصویر مناسب و بدون تاری است.',
      };
    });

    // Inconsistencies detection
    const inconsistenciesDetected: string[] = [];
    let declaredRoleMatches = true;
    let discrepancyNotes: string | null = null;

    // Check Croqui OCR extraction
    let croquiExtract = undefined;
    let croquiAuthenticity: 'VERIFIED' | 'SUSPECT' | 'UNVERIFIED' | 'NO_CROQUI' = hasKroki ? 'VERIFIED' : 'NO_CROQUI';
    let croquiStatusFa = hasKroki
      ? 'کروکی رسمی پلیس راهور با موفقیت استخراج و اعتبارسنجی شد.'
      : 'پرونده فاقد کروکی است؛ ارزیابی بر مبنای مدارک و تصاویر بدنه صورت می‌پذیرد.';

    if (claim.croquiData) {
      const cd = claim.croquiData;
      croquiAuthenticity = cd.isValidDocument ? 'VERIFIED' : 'SUSPECT';
      declaredRoleMatches = cd.declaredRoleMatches ?? true;
      discrepancyNotes = cd.discrepancyNotes || null;
      if (!declaredRoleMatches && discrepancyNotes) {
        inconsistenciesDetected.push(discrepancyNotes);
      }
      croquiExtract = {
        policeCode: cd.reportNumber || claim.sceneReportCode || 'POL-88192',
        incidentDate: cd.incidentDate || claim.date || '۱۴۰۵/۰۵/۱۴',
        faultDriver: cd.faultDriver?.fullName || claim.culpritName || 'راننده مقصر',
        victimDriver: cd.victimDriver?.fullName || claim.victimName || 'زیان‌دیده',
        faultPlate: cd.faultDriver?.plateNumber || claim.culpritPlate,
        victimPlate: cd.victimDriver?.plateNumber || claim.victimPlate,
        policeOfficerBadge: cd.policeBadgeId || 'POLICE-4412',
        hasOfficialStamp: cd.hasOfficialStamp ?? true,
        roadCondition: 'آسفالت خشک، دید روز',
        description: claim.writtenReport || 'برخورد دو وسیله نقلیه در معبر اصلی.',
      };
    } else if (hasKroki) {
      croquiExtract = {
        policeCode: claim.sceneReportCode || 'POL-88192',
        incidentDate: claim.date || '۱۴۰۵/۰۵/۱۴',
        faultDriver: claim.culpritName || 'راننده مقصر',
        victimDriver: claim.victimName || 'زیان‌دیده',
        faultPlate: claim.culpritPlate || '۶۸ ج ۴۵۱ ایران ۲۲',
        victimPlate: claim.victimPlate || '۱۲ ب ۳۴۵ ایران ۱۱',
        policeOfficerBadge: 'POLICE-9821',
        hasOfficialStamp: true,
        roadCondition: 'آسفالت خشک و دید مناسب',
        description: claim.writtenReport || 'برخورد از عقب به جلو به علت عدم رعایت فاصله طولی.',
      };
    }

    // Role alignment check
    const userRole = (claim.partyOneRole as string) || 'زیان‌دیده';
    if (claim.croquiData && !claim.croquiData.declaredRoleMatches) {
      declaredRoleMatches = false;
      discrepancyNotes = claim.croquiData.discrepancyNotes || 'نقش اظهار شده با راننده مقصر درج شده در کروکی مطابقت ندارد.';
      inconsistenciesDetected.push(discrepancyNotes);
    }

    // Completeness score
    const uploadedCount = allFiles.length;
    const completenessScore = Math.min(100, Math.round((uploadedCount / Math.max(4, REQUIRED_ANGLES.length)) * 100));

    // Smart evidence requests
    const smartEvidenceRequests: Array<{
      titleFa: string;
      reasonFa: string;
      urgency: 'HIGH' | 'MEDIUM' | 'LOW';
      category: 'ANGLE' | 'DOCUMENT' | 'CLOSEUP';
    }> = [];

    if (missingAnglesFa.includes('خسارت ۱') && missingAnglesFa.includes('خسارت ۲')) {
      smartEvidenceRequests.push({
        titleFa: 'تصویر کلوزآپ از نمای نزدیک محل برخورد',
        reasonFa: 'جهت تشخیص دقیق عمق فرورفتگی و شکستگی دیاق و رنگ',
        urgency: 'HIGH',
        category: 'CLOSEUP',
      });
    }

    if (missingAnglesFa.includes('پلاک')) {
      smartEvidenceRequests.push({
        titleFa: 'تصویر واضح از پلاک جلو و عقب',
        reasonFa: 'جهت تطبیق با مشخصات سنهاب و بیمه‌نامه شخص ثالث',
        urgency: 'HIGH',
        category: 'ANGLE',
      });
    }

    if (!allFiles.some((f) => f.name?.includes('شاسی') || f.name?.includes('کارت'))) {
      smartEvidenceRequests.push({
        titleFa: 'تصویر کارت ماشین یا پلاک شماره شاسی (VIN)',
        reasonFa: 'جهت تایید هویت خودرو و بررسی عدم اصالت‌سنجی معکوس',
        urgency: 'MEDIUM',
        category: 'DOCUMENT',
      });
    }

    // Recommendations
    const recommendationsFa: string[] = [];
    if (missingAnglesFa.length > 0 && missingAnglesFa.length <= 3) {
      recommendationsFa.push(`پیشنهاد می‌شود تصاویر زوایای (${missingAnglesFa.slice(0, 2).join('، ')}) نیز افزوده شوند.`);
    } else if (missingAnglesFa.length === 0) {
      recommendationsFa.push('کلیه زوایای استاندارد ۸ گانه بدنه خودرو با کیفیت مطلوب ثبت شده‌اند.');
    }
    if (photoQualityAnalysis.some((p) => p.isBlurry)) {
      recommendationsFa.push('برخی تصاویر دارای تاری یا انعکاس نور هستند؛ عکس‌برداری در نور مستقیم روز پیشنهاد می‌گردد.');
    }
    if (hasKroki && croquiAuthenticity === 'VERIFIED') {
      recommendationsFa.push('کروکی دارای مهر رسمی انتظامی و شماره رهگیری معتبر است.');
    }

    const recommendedNextStep: 'PROCEED_TO_DAMAGE_PHOTOS' | 'REQUIRE_MANUAL_REVIEW' | 'REUPLOAD_CROQUI' =
      !declaredRoleMatches || inconsistenciesDetected.length > 0
        ? 'REQUIRE_MANUAL_REVIEW'
        : croquiAuthenticity === 'SUSPECT'
        ? 'REUPLOAD_CROQUI'
        : 'PROCEED_TO_DAMAGE_PHOTOS';

    const result: EvidenceIntelligenceResult = {
      mediaCount: Math.max(1, uploadedCount),
      verifiedCount: photoQualityAnalysis.filter((p) => p.quality === 'GOOD').length,
      completenessScore,
      missingAnglesFa,
      recommendedNextStep,
      croquiAuthenticity,
      croquiStatusFa,
      roleAlignment: {
        matches: declaredRoleMatches,
        declaredRole: userRole,
        detectedRole: declaredRoleMatches ? userRole : (userRole === 'زیان‌دیده' ? 'مقصر' : 'زیان‌دیده'),
        notesFa: discrepancyNotes || 'نقش اظهار شده با کروکی پلیس کاملاً منطبق است.',
      },
      photoQualityAnalysis,
      croquiOcrExtract: croquiExtract,
      croquiData: claim.croquiData,
      damageVisibilityScore: Math.min(100, 75 + uploadedCount * 3),
      smartEvidenceRequests,
      inconsistenciesDetected,
      recommendationsFa,
    };

    const sources: AISourceReference[] = [
      {
        type: hasKroki ? 'CROQUI' : 'DRIVER_STATEMENT',
        name: hasKroki ? 'کروکی پلیس راهور' : 'اظهارات طرفین حادثه',
        nameFa: hasKroki ? 'کروکی فراجا' : 'فرم اعلام خسارت',
      },
      {
        type: 'DAMAGE_PHOTO',
        name: 'تصاویر زوایای بدنه خودرو',
        nameFa: 'مستندات تصویری صحنه',
      },
    ];

    const calibratedScore = hasKroki && declaredRoleMatches && inconsistenciesDetected.length === 0 ? 0.95 : 0.78;

    return this.createEnvelope(
      'evidence_intelligence',
      claim.id,
      result,
      calibratedScore,
      `ارزیابی هوشمند مستندات: ${result.verifiedCount} مدرک تایید شده، درصد تکمیل ${result.completenessScore}٪.`,
      [
        hasKroki
          ? `کروکی رسمی فراجا با کد رهگیری ${croquiExtract?.policeCode || 'ثبت شده'} تطبیق یافت.`
          : 'پرونده بدون کروکی است؛ مستندات تصویری و اظهارات مبنای ارزیابی قرار گرفت.',
        declaredRoleMatches
          ? 'نقش اظهار شده با مدارک صحنه تصادف همخوانی دارد.'
          : 'هشدار مغایرت در نقش اظهار شده با مدارک کروکی پلیس.',
        missingAnglesFa.length === 0
          ? 'پوشش کامل زوایای ۸ گانه بدنه خودرو.'
          : `تعداد ${missingAnglesFa.length} زاویه بدنه هنوز بارگذاری نشده است.`,
      ],
      sources
    );
  }

  async analyzeClaim(
    claim: ClaimCase,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<ClaimIntelligenceResult>> {
    const isComplex = !!(claim.isBodily || (claim.chainTotal && claim.chainTotal > 1) || (claim.culpritFaultPercent === 50));
    const complexity = isComplex ? 'COMPLEX' : 'SIMPLE';
    const complexityFa = isComplex ? 'پیچیده' : 'ساده';

    const result: ClaimIntelligenceResult = {
      complexity,
      complexityFa,
      predictedProcessingHours: isComplex ? 48 : 12,
      recommendedWorkflow: isComplex ? 'FIELD_INSPECTION_REQUIRED' : 'STANDARD_ONLINE',
      workflowTitleFa: isComplex ? 'نیازمند بازدید میدانی و کارشناسی حضوری' : 'ارزیابی برخط و تسویه مستقیم',
      workflowReasonFa: isComplex
        ? 'به دلیل جراحت بدنه یا تصادف چندگانه، بازدید حضوری پیشنهاد می‌شود.'
        : 'خسارت جزئی بدنه با کروکی معتبر واجد شرایط فرآیند سریع آنلاین است.',
      keyRiskFlags: isComplex ? ['پرونده دارای جراحت یا تقصیر مشترک است'] : [],
      completenessScore: 92,
      missingItemsFa: claim.ibanConfirmed ? [] : ['تایید نهایی شماره شبا زیان‌دیده'],
      prioritySuggestion: isComplex ? 'high' : 'normal',
    };

    return this.createEnvelope(
      'claim_intelligence',
      claim.id,
      result,
      0.90,
      `پرونده از نوع «${complexityFa}» ارزیابی شد و مسیر «${result.workflowTitleFa}» پیشنهاد می‌گردد.`,
      [
        `مدت زمان برآورد شده جهت تکمیل فرآیند: ${result.predictedProcessingHours} ساعت`,
        `درصد تکمیل اطلاعات پرونده: ${result.completenessScore}٪`,
      ],
      [{ type: 'SANHAB_INQUIRY', name: 'استعلام سنهاب بیمه مرکزی' }]
    );
  }

  async analyzeDamage(
    claim: ClaimCase,
    context?: DamageAnalysisContext,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<DamageIntelligenceResult>> {
    const spots = context?.spots || claim.carDamageSpots || {};
    const detectedParts = Object.entries(spots).map(([key, spot]: [string, any]) => ({
      partKey: key,
      partNameFa: key.replace(/_/g, ' '),
      damageType: 'DENT' as const,
      damageTypeFa: 'فرورفتگی و دفرمگی',
      severity: (spot.severity === 'major' ? 'SEVERE' : spot.severity === 'moderate' ? 'MODERATE' : 'MINOR') as any,
      severityFa: spot.severity === 'major' ? 'شدید' : spot.severity === 'moderate' ? 'متوسط' : 'جزئی',
      recommendedOperation: (spot.operation === 'replace' ? 'REPLACE' : 'REPAIR') as any,
      operationFa: spot.operation === 'replace' ? 'تعویض' : 'صافکاری و نقاشی',
      confidenceScore: 0.88,
      estimatedAreaCm2: 450,
    }));

    if (detectedParts.length === 0) {
      detectedParts.push({
        partKey: 'rear_bumper',
        partNameFa: 'سپر عقب و دیاق',
        damageType: 'DENT',
        damageTypeFa: 'شکستگی و خراشیدگی',
        severity: 'MODERATE',
        severityFa: 'متوسط',
        recommendedOperation: 'REPAIR',
        operationFa: 'صافکاری و رنگ‌آمیزی',
        confidenceScore: 0.89,
        estimatedAreaCm2: 300,
      });
    }

    const result: DamageIntelligenceResult = {
      detectedParts,
      structuralDamageSuspected: detectedParts.some((p) => p.severity === 'SEVERE'),
      airbagDeploymentLikely: false,
      overallDamageSeverity: detectedParts.some((p) => p.severity === 'SEVERE') ? 'MAJOR' : 'MODERATE',
      overallSeverityFa: 'متوسط',
      technicalSummaryFa: `آسیب در ناحیه عقب خودرو مشاهده شد؛ ساختار شاسی سالم تشخیص داده شد.`,
    };

    return this.createEnvelope(
      'damage_intelligence',
      claim.id,
      result,
      0.88,
      `تعداد ${detectedParts.length} قطعه آسیب‌دیده با تفکیک نوع عملیات شناسایی شد.`,
      [
        'آسیب به قطعات مصرفی و پوسته خارجی محدود است.',
        'نیاز به بازبینی شاسی یا موتور گزارش نشده است.',
      ],
      [{ type: 'DAMAGE_PHOTO', name: 'تصاویر خسارت بدنه خودرو' }]
    );
  }

  async generateEstimate(
    claim: ClaimCase,
    context?: EstimateContext,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<EstimateIntelligenceResult>> {
    const existingParts = context?.parts || claim.assessment?.parts || [];
    
    let partsCost = 0;
    let wageCost = 0;
    let salvage = 0;

    const lineItems = existingParts.map((p) => {
      const pCost = Number(p.partPrice) || 0;
      const wCost = Number(p.repairPrice) || 0;
      const sVal = Number(p.salvageValue) || 0;
      partsCost += pCost;
      wageCost += wCost;
      salvage += sVal;
      return {
        partName: p.name,
        operation: (p.type === 'replace' ? 'تعویض' : 'صافکاری') as any,
        partCost: pCost,
        wageCost: wCost,
        salvageValue: sVal,
        depreciationPercent: 5,
        depreciationAmount: Math.round(pCost * 0.05),
        netLineTotal: pCost + wCost - sVal - Math.round(pCost * 0.05),
        confidence: 0.87,
        notesFa: 'منطبق با میانگین استعلام بازار تهران و نرخ‌نامه مصوب اتحادیه.',
      };
    });

    if (lineItems.length === 0) {
      partsCost = 18500000;
      wageCost = 7500000;
      salvage = 1500000;
      lineItems.push({
        partName: 'پوسته سپر عقب',
        operation: 'صافکاری',
        partCost: 18500000,
        wageCost: 7500000,
        salvageValue: 1500000,
        depreciationPercent: 5,
        depreciationAmount: 925000,
        netLineTotal: 23575000,
        confidence: 0.89,
        notesFa: 'استعلام قیمت از سامانه جامع قطعات یدکی خودرو.',
      });
    }

    const depreciation = Math.round(partsCost * 0.05);
    const netPayable = partsCost + wageCost - salvage - depreciation;
    const policyLimit = claim.culpritCoverageFinancial || 400000000;

    const result: EstimateIntelligenceResult = {
      estimatedPartsCost: partsCost,
      estimatedWageCost: wageCost,
      estimatedDepreciation: depreciation,
      estimatedSalvageValue: salvage,
      estimatedNetPayable: netPayable,
      marketPriceRange: {
        min: Math.round(netPayable * 0.92),
        max: Math.round(netPayable * 1.08),
        average: netPayable,
      },
      lineItems,
      policyCeilingCheck: {
        policyLimit,
        withinLimit: netPayable <= policyLimit,
        excessAmount: Math.max(0, netPayable - policyLimit),
      },
      summaryFa: `مبلغ خالص قابل پرداخت پیشنهادی: ${netPayable.toLocaleString('fa-IR')} ریال (کاملاً درون سقف بیمه‌نامه).`,
    };

    return this.createEnvelope(
      'estimate_intelligence',
      claim.id,
      result,
      0.89,
      result.summaryFa,
      [
        `کل هزینه قطعات: ${partsCost.toLocaleString('fa-IR')} ریال`,
        `کل اجرت مصوب: ${wageCost.toLocaleString('fa-IR')} ریال`,
        `کسورات استهلاک و داغی: ${(salvage + depreciation).toLocaleString('fa-IR')} ریال`,
      ],
      [{ type: 'PARTS_CATALOG', name: 'سامانه استعلام قیمت قطعات و اجرت اتحادیه' }]
    );
  }

  async rankExperts(
    claim: ClaimCase,
    candidates: StaffMember[] = [],
    _options?: AIAnalysisOptions
  ): Promise<AIResult<AssignmentIntelligenceResult>> {
    const rankedExperts = candidates.map((expert, idx) => {
      const active = expert.activeCases || 0;
      const rating = expert.rating || 4.8;
      const score = Math.max(50, Math.round((rating / 5) * 60 + Math.max(0, 40 - active * 10)));
      return {
        expertId: expert.id,
        expertName: expert.name,
        role: expert.role,
        company: expert.company || 'بیمه دانا',
        branchName: expert.branchName || 'شعبه تخصصی خسارت',
        suitabilityScore: score,
        matchReasonsFa: [
          `امتیاز رضایت مشتری: ${rating} از ۵`,
          `بار کاری فعلی: ${active} پرونده فعال`,
          'تخصص منطبق با نوع آسیب خودرو',
        ],
        currentWorkload: active,
        averageSlaHours: 18,
        rating,
      };
    }).sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    const top = rankedExperts[0] || {
      expertId: 'd1',
      expertName: 'محسن کریمی',
      suitabilityScore: 95,
    };

    const result: AssignmentIntelligenceResult = {
      rankedExperts,
      recommendedExpertId: top.expertId,
      recommendedExpertName: top.expertName,
      assignmentRationaleFa: `کارشناس «${top.expertName}» به دلیل بالاترین امتیاز شایستگی (${top.suitabilityScore}٪) و بار کاری مناسب به عنوان گزینه برتر پیشنهاد می‌شود.`,
      autoAssignable: true,
    };

    return this.createEnvelope(
      'assignment_intelligence',
      claim.id,
      result,
      0.91,
      result.assignmentRationaleFa,
      [
        'تطبیق محدوده جغرافیایی و نوع خودرو انجام شد.',
        'کارشناس پیشنهادی دارای کمترین میزان تاخیر در پاسخگویی است.',
      ],
      [{ type: 'HISTORICAL_PATTERN', name: 'ماتریس مهارت و سوابق کارشناسان' }]
    );
  }

  async routeClaim(
    claim: ClaimCase,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<RoutingIntelligenceResult>> {
    const isDirectFastTrack = !!(claim.hasKroki && claim.culpritFaultPercent === 100 && !claim.isBodily);
    const result: RoutingIntelligenceResult = {
      priority: 'NORMAL',
      targetQueue: isDirectFastTrack ? 'DIRECT_SETTLEMENT' : 'EXPERT_DESK',
      targetQueueFa: isDirectFastTrack ? 'صف ارزیابی سریع و تسویه مستقیم' : 'میز کار کارشناس ارزیاب آنلاین',
      autoApprovalEligible: isDirectFastTrack,
      fastTrackEligible: isDirectFastTrack,
      slaHoursTarget: isDirectFastTrack ? 24 : 48,
      routingRationaleFa: isDirectFastTrack
        ? 'پرونده دارای کروکی قطعی با تقصیر ۱۰۰٪ و بدون جراحت است و واجد شرایط تسویه سریع می‌باشد.'
        : 'پرونده نیازمند ارزیابی فنی و تطبیق مدارک توسط ارزیاب است.',
    };

    return this.createEnvelope(
      'routing_intelligence',
      claim.id,
      result,
      0.92,
      result.routingRationaleFa,
      [`مهلت SLA تعیین شده: ${result.slaHoursTarget} ساعت`],
      [{ type: 'POLICY_DOCUMENT', name: 'سیاست‌های مسیریابی و کنترل خسارت بیمه‌گر' }]
    );
  }

  async reviewAssessment(
    claim: ClaimCase,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<ReviewIntelligenceResult>> {
    const result: ReviewIntelligenceResult = {
      compliancePassed: true,
      auditScore: 94,
      discrepanciesDetected: [],
      recommendedAction: 'APPROVE',
      recommendedActionFa: 'تایید کامل و ارجاع به صف پرداخت خزانه‌داری',
      reviewerSummaryFa: 'کلیه مبالغ قطعات، اجرت‌ها و کسر استهلاک با آیین‌نامه خسارت شرکت بیمه همخوانی دارد.',
    };

    return this.createEnvelope(
      'review_intelligence',
      claim.id,
      result,
      0.93,
      result.reviewerSummaryFa,
      [
        'هیچ‌گونه اضافه برآورد یا تعویض غیرضروری قطعه مشاهده نشد.',
        'ارزش داغی قطعات به درستی کسر گردیده است.',
      ],
      [{ type: 'PARTS_CATALOG', name: 'ضوابط کنترل کیفیت و نظارت ارزیابی' }]
    );
  }

  async analyzeIntegrity(
    claim: ClaimCase,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<IntegrityIntelligenceResult>> {
    const isSuspicious = !!(claim.fraudFlag?.flagged || claim.fraudFlag?.auto);
    const riskScore = isSuspicious ? 72 : 12;

    const result: IntegrityIntelligenceResult = {
      fraudRiskScore: riskScore,
      riskLevel: isSuspicious ? 'HIGH' : 'LOW',
      riskLevelFa: isSuspicious ? 'مشکوک به تقلب' : 'ریسک پایین',
      indicators: isSuspicious
        ? [
            {
              code: 'REPEATED_CLAIM',
              titleFa: 'سابقه اعلام خسارت مکرر در بازه کوتاه',
              descriptionFa: 'پلاک خودرو دارای اعلام خسارت مشابه در ۶ ماه گذشته است.',
              severity: 'HIGH',
              matchedCondition: 'سوابق استعلام سنهاب بیمه مرکزی',
            },
          ]
        : [],
      croquiConsistency: {
        partiesMatch: true,
        locationsMatch: true,
        damageConsistencyWithStatement: true,
        notesFa: 'آثار ضربه با نحوه برخورد شرح داده شده در کروکی همخوانی دارد.',
      },
      sanhabCrossCheck: {
        policyValid: true,
        duplicateClaimFound: false,
        priorClaimsInPast6Months: 0,
      },
      recommendationFa: isSuspicious
        ? 'ارجاع پرونده به واحد تحقیق و کشف تقلب جهت بررسی میدانی قطعات.'
        : 'اصالت تصادف تایید است؛ مانع حقوقی جهت ادامه فرآیند وجود ندارد.',
    };

    return this.createEnvelope(
      'integrity_intelligence',
      claim.id,
      result,
      0.90,
      result.recommendationFa,
      [
        `نمره ریسک اصالت تصادف: ${riskScore} از ۱۰۰ (${result.riskLevelFa})`,
        'استعلام سنهاب و سوابق خسارت فراجا استخراج شد.',
      ],
      [{ type: 'SANHAB_INQUIRY', name: 'پایگاه داده جامع سنهاب فراجا و بیمه مرکزی' }]
    );
  }

  async generateSummary(
    claim: ClaimCase,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<SummaryIntelligenceResult>> {
    const gross = claim.assessment?.totalDamage || 26000000;
    const payable = claim.assessment?.payableAmount || 26000000;

    const result: SummaryIntelligenceResult = {
      executiveSummaryFa: `پرونده خسارت خودرو ${claim.carType} (پلاک ${claim.plate || claim.victimPlate}) متعلق به ${claim.victimName} به طرفیت ${claim.culpritName} با بیمه‌نامه ${claim.insurerName || 'بیمه دانا'}.`,
      keyFactsFa: [
        `تاریخ حادثه: ${claim.date}`,
        `محل تصادف: ${claim.address}`,
        `میزان تقصیر راننده مقصر: ${claim.culpritFaultPercent ?? 100}٪`,
        `وضعیت فعلی: ${claim.status}`,
      ],
      financialSummary: {
        estimatedLoss: gross,
        deductibles: gross - payable,
        payableToVictim: payable,
      },
      timelineHighlights: [
        { date: claim.date, eventFa: 'ثبت پرونده و ارسال مستندات تصادف' },
        { date: 'مرحله ارزیابی', eventFa: 'محاسبه خسارت قطعات و تایید فنی' },
      ],
      stakeholderImpactFa: 'زیان‌دیده منتظر تایید نهایی حواله و واریز بانکی شبا است.',
    };

    return this.createEnvelope(
      'copilot_intelligence',
      claim.id,
      result,
      0.95,
      'خلاصه جامع پرونده با موفقیت تولید شد.',
      result.keyFactsFa,
      [{ type: 'POLICY_DOCUMENT', name: 'داده‌های اصلی پرونده خسارت' }]
    );
  }

  async generateNextBestAction(
    claim: ClaimCase,
    context?: NextBestActionContext,
    _options?: AIAnalysisOptions
  ): Promise<AIResult<NextBestActionIntelligenceResult>> {
    const role = context?.userRole || 'assessor';
    let actionFa = 'بررسی و تایید مبالغ کارشناسی';
    let targetRole = role;
    let urgency: 'IMMEDIATE' | 'TODAY' | 'WITHIN_SLA' = 'TODAY';
    let urgencyFa = 'اقدام امروز';

    if (claim.status === 'در انتظار تایید مقصر') {
      actionFa = 'پیگیری تایید پیامکی مقصر حادثه یا ثبت کروکی فراجا';
      targetRole = 'customer';
    } else if (claim.status === 'در انتظار پرداخت') {
      actionFa = 'صدور دستور پرداخت و ارسال به صف حواله پایا خزانه‌داری';
      targetRole = 'finance';
      urgency = 'IMMEDIATE';
      urgencyFa = 'فوری (در اولویت خزانه‌داری)';
    } else if (claim.status === 'در حال ارزیابی') {
      actionFa = 'ثبت برآورد قیمت قطعات و تایید فرم ارزیابی آنلاین';
      targetRole = 'assessor';
    }

    const result: NextBestActionIntelligenceResult = {
      recommendedAction: 'PROCESS_NEXT_STEP',
      recommendedActionFa: actionFa,
      targetRole,
      urgency,
      urgencyFa,
      rationaleFa: `با توجه به وضعیت فعلی پرونده («${claim.status}»)، انجام این مرحله مانع از نقض مهلت استاندارد SLA خواهد شد.`,
      alternativeActionsFa: [
        'ارسال پیامک یادآوری به مشتری',
        'ارجاع به کارشناس پشتیبانی CRM جهت تماس فوری',
      ],
      prerequisitesFa: ['انطباق مدارک بارگذاری شده با استعلام اولیه'],
    };

    return this.createEnvelope(
      'copilot_intelligence',
      claim.id,
      result,
      0.92,
      result.rationaleFa,
      [
        `اقدام پیشنهادی: ${result.recommendedActionFa}`,
        `سطح فوریت: ${result.urgencyFa}`,
      ],
      [{ type: 'HISTORICAL_PATTERN', name: 'موتور پیشنهاد اقدام بهینه گردش کار' }]
    );
  }
}
