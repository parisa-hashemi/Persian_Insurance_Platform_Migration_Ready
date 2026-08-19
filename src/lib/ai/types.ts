/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Core AI Foundation & Typed Intelligence Models
 * Designed for modular, explainable, human-in-the-loop insurance intelligence.
 */

import { RoleType, ClaimCase, MediaFile, AdditionalDocItem, StaffMember, PartItem, CroquiData } from '../../types';

// ----------------------------------------------------
// 1. AI CAPABILITIES REGISTRY
// ----------------------------------------------------
export type AICapability =
  | 'evidence_intelligence'   // تحلیل، اعتبارسنجی و تطبیق مدارک، تصاویر و کروکی
  | 'claim_intelligence'      // طبقه‌بندی پرونده، پیش‌بینی پیچیدگی و نیازمندی‌ها
  | 'damage_intelligence'     // شناسایی خودکار خسارت، تعیین قطعات و شدت آسیب
  | 'estimate_intelligence'   // برآورد هزینه قطعات، اجرت تعمیر، کسر استهلاک و افت قیمت
  | 'assignment_intelligence' // ارزیابی شایستگی و رتبه‌بندی کارشناسان جهت تخصیص
  | 'routing_intelligence'    // مسیریابی خودکار پرونده (مسیر سبز/بررسی میدانی/حقوقی)
  | 'review_intelligence'     // بازبینی کیفی، انطباق با دستورالعمل‌ها و کشف انحرافات
  | 'integrity_intelligence'  // اصالت‌سنجی، تشخیص تقلب و تناقضات اطلاعاتی/سنهاب
  | 'copilot_intelligence';   // دستیار هوشمند تصمیم‌گیری و اقدام بهینه بعدی

export interface AICapabilityMetadata {
  id: AICapability;
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  category: 'ANALYSIS' | 'DECISION_SUPPORT' | 'AUTOMATION' | 'ASSISTANT';
  requiresHumanReview: boolean;
  defaultLatencyBudgetMs: number;
  minConfidenceThreshold: number;
}

// ----------------------------------------------------
// 2. AI EXECUTION & LIFECYCLE STATES
// ----------------------------------------------------
export type AIExecutionStatus =
  | 'IDLE'            // آماده به کار (هنوز تحلیلی شروع نشده)
  | 'ANALYZING'       // در حال پردازش و استنتاج مدل
  | 'READY'           // تکمیل موفقیت‌آمیز و آماده بهره‌برداری
  | 'REVIEW_REQUIRED' // نیازمند بازبینی و تایید اجباری کارشناس
  | 'FAILED'          // بروز خطای فنی در پردازش
  | 'UNAVAILABLE';    // سرویس هوش مصنوعی موقتاً غیرفعال/خارج از دسترس

// ----------------------------------------------------
// 3. CALIBRATED CONFIDENCE MODEL
// ----------------------------------------------------
export type AIConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AIConfidenceFactor {
  factorName: string;
  factorNameFa: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  weight: number; // 0.0 to 1.0
  detailFa?: string;
}

export interface AIConfidence {
  level: AIConfidenceLevel;
  score: number; // 0.0 to 1.0
  labelFa: 'بالا' | 'متوسط' | 'پایین';
  descriptionFa: string;
  factors?: AIConfidenceFactor[];
}

// ----------------------------------------------------
// 4. SOURCE REFERENCES & PROVENANCE
// ----------------------------------------------------
export type AISourceType =
  | 'CROQUI'
  | 'DAMAGE_PHOTO'
  | 'SCENE_PHOTO'
  | 'VIDEO'
  | 'AUDIO_STATEMENT'
  | 'SANHAB_INQUIRY'
  | 'POLICY_DOCUMENT'
  | 'FIELD_REPORT'
  | 'DRIVER_STATEMENT'
  | 'PARTS_CATALOG'
  | 'HISTORICAL_PATTERN';

export interface AISourceReference {
  type: AISourceType;
  id?: string;
  name: string;
  nameFa?: string;
  url?: string;
  snippet?: string;
  confidence?: number;
}

// ----------------------------------------------------
// 5. HUMAN-IN-THE-LOOP (HITL) AUDITING
// ----------------------------------------------------
export type AIHumanReviewStatus =
  | 'PENDING_REVIEW' // در انتظار بررسی انسانی
  | 'ACCEPTED'       // تایید کامل توسط کارشناس بدون تغییر
  | 'MODIFIED'       // تایید با اصلاح مقادیر توسط کارشناس
  | 'REJECTED';      // رد کامل پیشنهاد هوش مصنوعی

export interface AIHumanReview {
  status: AIHumanReviewStatus;
  reviewedBy?: string;
  reviewerId?: string;
  reviewerRole?: RoleType | string;
  reviewedAt?: string;
  originalValue?: any;
  modifiedValue?: any;
  reviewNote?: string;
  rejectionReason?: string;
}

// ----------------------------------------------------
// 6. AUDIT TRACE & TELEMETRY
// ----------------------------------------------------
export interface AIAuditTrace {
  requestId: string;
  capability: AICapability;
  modelVersion: string;
  provider: 'GEMINI_AI' | 'RULES_ENGINE' | 'FALLBACK_STUB' | 'MOCK_PROVIDER';
  timestamp: string;
  durationMs: number;
  userRole?: string;
  userId?: string;
  inputHash?: string;
}

export interface AIErrorDetails {
  code:
    | 'TIMEOUT'
    | 'NETWORK_ERROR'
    | 'INVALID_INPUT'
    | 'RATE_LIMIT'
    | 'SERVICE_UNAVAILABLE'
    | 'PROVIDER_ERROR'
    | 'AUTH_MISSING'
    | 'UNKNOWN';
  message: string;
  messageFa: string;
  fallbackUsed: boolean;
  retryable: boolean;
  originalError?: string;
}

// ----------------------------------------------------
// 7. GENERIC ROOT AI RESULT ENVELOPE
// ----------------------------------------------------
export interface AIResult<T> {
  id: string;
  capability: AICapability;
  claimId: string;
  status: AIExecutionStatus;
  result: T;
  confidence: AIConfidence;
  modelVersion: string;
  timestamp: string;
  sourceReferences: AISourceReference[];
  explanation: string;
  explanationBullets?: string[];
  latencyMs: number;
  error?: AIErrorDetails;
  humanReview?: AIHumanReview;
  auditTrace: AIAuditTrace;
}

// ----------------------------------------------------
// 8. INTELLIGENCE DOMAIN PAYLOADS
// ----------------------------------------------------

/**
 * 8.1 Evidence Intelligence Result
 */
export interface EvidenceIntelligenceResult {
  mediaCount: number;
  verifiedCount: number;
  completenessScore?: number; // 0 to 100
  missingAnglesFa?: string[];
  recommendedNextStep?: 'PROCEED_TO_DAMAGE_PHOTOS' | 'REQUIRE_MANUAL_REVIEW' | 'REUPLOAD_CROQUI';
  croquiAuthenticity: 'VERIFIED' | 'SUSPECT' | 'UNVERIFIED' | 'NO_CROQUI';
  croquiStatusFa: string;
  roleAlignment?: {
    matches: boolean;
    declaredRole?: string;
    detectedRole?: string;
    notesFa?: string;
  };
  photoQualityAnalysis: Array<{
    mediaName: string;
    quality: 'EXCELLENT' | 'GOOD' | 'POOR';
    isBlurry: boolean;
    isAngleCorrect: boolean;
    detectedPlate?: string;
    plateMatchesClaim: boolean;
    notesFa: string;
  }>;
  croquiOcrExtract?: {
    policeCode: string;
    incidentDate: string;
    faultDriver: string;
    victimDriver: string;
    faultPlate?: string;
    victimPlate?: string;
    policeOfficerBadge?: string;
    hasOfficialStamp?: boolean;
    roadCondition?: string;
    description: string;
  };
  croquiData?: CroquiData;
  damageVisibilityScore?: number; // 0 to 100
  smartEvidenceRequests?: Array<{
    titleFa: string;
    reasonFa: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    category: 'ANGLE' | 'DOCUMENT' | 'CLOSEUP';
  }>;
  inconsistenciesDetected: string[];
  recommendationsFa: string[];
}

/**
 * 8.2 Claim Intelligence Result
 */
export interface ClaimIntelligenceResult {
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  complexityFa: 'ساده' | 'متوسط' | 'پیچیده';
  predictedProcessingHours: number;
  recommendedWorkflow: 'FAST_TRACK' | 'STANDARD_ONLINE' | 'FIELD_INSPECTION_REQUIRED' | 'LEGAL_REVIEW';
  workflowTitleFa: string;
  workflowReasonFa: string;
  keyRiskFlags: string[];
  completenessScore: number; // 0 - 100
  missingItemsFa: string[];
  prioritySuggestion: 'normal' | 'high' | 'urgent';
}

/**
 * 8.3 Damage Intelligence Result
 */
export interface DetectedDamagePart {
  partKey: string;
  partNameFa: string;
  damageType: 'SCRATCH' | 'DENT' | 'TEAR' | 'CRACK' | 'TOTAL_DAMAGE' | 'DEFORMATION';
  damageTypeFa: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  severityFa: string;
  recommendedOperation: 'REPAIR' | 'REPLACE' | 'PAINT_ONLY' | 'UNTOUCHED';
  operationFa: string;
  confidenceScore: number;
  estimatedAreaCm2?: number;
  sourcePhotoIndex?: number;
}

export interface DamageIntelligenceResult {
  detectedParts: DetectedDamagePart[];
  structuralDamageSuspected: boolean;
  airbagDeploymentLikely: boolean;
  overallDamageSeverity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS';
  overallSeverityFa: string;
  technicalSummaryFa: string;
}

/**
 * 8.4 Estimate Intelligence Result
 */
export interface EstimateLineItem {
  partName: string;
  operation: 'تعویض' | 'صافکاری' | 'نقاشی' | 'تعمیر';
  partCost: number;
  wageCost: number;
  salvageValue: number;
  depreciationPercent: number;
  depreciationAmount: number;
  netLineTotal: number;
  confidence: number;
  notesFa: string;
}

export interface EstimateIntelligenceResult {
  estimatedPartsCost: number;
  estimatedWageCost: number;
  estimatedDepreciation: number;
  estimatedSalvageValue: number;
  estimatedNetPayable: number;
  marketPriceRange: {
    min: number;
    max: number;
    average: number;
  };
  lineItems: EstimateLineItem[];
  policyCeilingCheck: {
    policyLimit: number;
    withinLimit: boolean;
    excessAmount: number;
  };
  summaryFa: string;
}

/**
 * 8.5 Assignment Intelligence Result
 */
export interface ExpertRankCandidate {
  expertId: string;
  expertName: string;
  role: string;
  company: string;
  branchName?: string;
  suitabilityScore: number; // 0 - 100
  matchReasonsFa: string[];
  currentWorkload: number;
  averageSlaHours: number;
  rating: number;
  distanceKm?: number;
}

export interface AssignmentIntelligenceResult {
  rankedExperts: ExpertRankCandidate[];
  recommendedExpertId: string;
  recommendedExpertName: string;
  assignmentRationaleFa: string;
  autoAssignable: boolean;
}

/**
 * 8.6 Routing Intelligence Result
 */
export interface RoutingIntelligenceResult {
  priority: 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  targetQueue: 'DIRECT_SETTLEMENT' | 'EXPERT_DESK' | 'FIELD_INSPECTION' | 'FRAUD_INVESTIGATION' | 'MEDICAL_LEGAL';
  targetQueueFa: string;
  autoApprovalEligible: boolean;
  fastTrackEligible: boolean;
  slaHoursTarget: number;
  routingRationaleFa: string;
}

/**
 * 8.7 Review Intelligence Result
 */
export interface ReviewDiscrepancy {
  category: 'PRICE_OUTLIER' | 'UNJUSTIFIED_REPLACEMENT' | 'SALVAGE_UNDERVALUED' | 'DEPRECIATION_MISMATCH' | 'MISSING_PHOTO_PROOF';
  categoryFa: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  descriptionFa: string;
  suggestedFixFa: string;
}

export interface ReviewIntelligenceResult {
  compliancePassed: boolean;
  auditScore: number; // 0 - 100
  discrepanciesDetected: ReviewDiscrepancy[];
  recommendedAction: 'APPROVE' | 'REQUEST_MODIFICATION' | 'REJECT_TO_ASSESSOR' | 'ESCALATE_TO_SENIOR';
  recommendedActionFa: string;
  reviewerSummaryFa: string;
}

/**
 * 8.8 Integrity & Fraud Intelligence Result
 */
export interface IntegrityIndicator {
  code: string;
  titleFa: string;
  descriptionFa: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  matchedCondition: string;
}

export interface IntegrityIntelligenceResult {
  fraudRiskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskLevelFa: 'ریسک پایین' | 'ریسک متوسط' | 'مشکوک به تقلب' | 'ریسک بحرانی';
  indicators: IntegrityIndicator[];
  croquiConsistency: {
    partiesMatch: boolean;
    locationsMatch: boolean;
    damageConsistencyWithStatement: boolean;
    notesFa: string;
  };
  sanhabCrossCheck: {
    policyValid: boolean;
    duplicateClaimFound: boolean;
    priorClaimsInPast6Months: number;
  };
  recommendationFa: string;
}

/**
 * 8.9 Summary Intelligence Result
 */
export interface SummaryIntelligenceResult {
  executiveSummaryFa: string;
  keyFactsFa: string[];
  financialSummary: {
    claimedAmount?: number;
    estimatedLoss: number;
    deductibles: number;
    payableToVictim: number;
  };
  timelineHighlights: Array<{ date: string; eventFa: string }>;
  stakeholderImpactFa: string;
}

/**
 * 8.10 Copilot & Next Best Action Intelligence Result
 */
export interface NextBestActionIntelligenceResult {
  recommendedAction: string;
  recommendedActionFa: string;
  targetRole: RoleType | string;
  urgency: 'IMMEDIATE' | 'TODAY' | 'WITHIN_SLA' | 'INFORMATIONAL';
  urgencyFa: string;
  rationaleFa: string;
  alternativeActionsFa: string[];
  prerequisitesFa: string[];
}

// ----------------------------------------------------
// 9. SERVICE INVOCATION OPTIONS & CONTEXT
// ----------------------------------------------------
export interface AIAnalysisOptions {
  timeoutMs?: number;
  forceFresh?: boolean;
  userRole?: RoleType | string;
  userId?: string;
  modelOverride?: string;
}

export interface DamageAnalysisContext {
  spots?: Record<string, any>;
  photos?: MediaFile[];
  vehicleModel?: string;
  impactArea?: string;
}

export interface EstimateContext {
  parts?: PartItem[];
  vehicleModel?: string;
  vehicleAgeYears?: number;
  insurerCode?: string;
}

export interface NextBestActionContext {
  userRole: RoleType;
  currentStatus: string;
  claimId: string;
}
