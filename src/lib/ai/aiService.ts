/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Central AI & Intelligence Service Layer
 * Clean, safe boundary between UI components and AI models.
 */

import {
  ClaimCase,
  MediaFile,
  AdditionalDocItem,
  StaffMember,
} from '../../types';
import {
  AICapability,
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
  AIHumanReview,
  AIExecutionStatus,
} from './types';
import { IAIProvider } from './providers/baseProvider';
import { GeminiIntelligenceProvider } from './providers/geminiProvider';
import { MockIntelligenceProvider } from './providers/mockProvider';
import { loadCasesFromStorage, loadExpertsFromStorage } from '../storage';
import { createSafeFallbackEnvelope } from './fallback';

export class AIService {
  private static instance: AIService | null = null;
  private provider: IAIProvider;
  private resultCache: Map<string, { result: AIResult<any>; cachedAt: number }> = new Map();
  private humanReviews: Map<string, AIHumanReview> = new Map();
  private readonly cacheTtlMs = 60000; // 1 minute in-memory cache

  constructor(customProvider?: IAIProvider) {
    this.provider = customProvider || new GeminiIntelligenceProvider();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Allows hot-swapping or configuring the AI Provider (e.g. for unit testing or fallback mode)
   */
  public setProvider(newProvider: IAIProvider): void {
    this.provider = newProvider;
    this.resultCache.clear();
  }

  public getProviderName(): string {
    return this.provider.providerName;
  }

  public getModelVersion(): string {
    return this.provider.modelVersion;
  }

  /**
   * Resolves a ClaimCase from an ID or returns the claim object directly.
   */
  private resolveClaim(claimOrId: string | ClaimCase): ClaimCase | null {
    if (typeof claimOrId === 'object' && claimOrId !== null && claimOrId.id) {
      return claimOrId;
    }
    if (typeof claimOrId === 'string') {
      const cases = loadCasesFromStorage();
      return cases.find((c) => c.id === claimOrId) || null;
    }
    return null;
  }

  /**
   * Helper to manage cached results
   */
  private getCachedResult<T>(cacheKey: string, forceFresh = false): AIResult<T> | null {
    if (forceFresh) return null;
    const cached = this.resultCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
      // Attach recorded human review if any
      const hr = this.humanReviews.get(cached.result.id);
      if (hr) {
        return { ...cached.result, humanReview: hr };
      }
      return cached.result;
    }
    return null;
  }

  private setCachedResult<T>(cacheKey: string, result: AIResult<T>): void {
    this.resultCache.set(cacheKey, { result, cachedAt: Date.now() });
  }

  // ====================================================
  // 1. EVIDENCE INTELLIGENCE
  // ====================================================
  public async analyzeEvidence(
    claimOrId: string | ClaimCase,
    evidenceItems: (MediaFile | AdditionalDocItem)[] = [],
    options?: AIAnalysisOptions
  ): Promise<AIResult<EvidenceIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'evidence_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          mediaCount: 0,
          verifiedCount: 0,
          croquiAuthenticity: 'NO_CROQUI',
          croquiStatusFa: 'پرونده یافت نشد.',
          photoQualityAnalysis: [],
          inconsistenciesDetected: [],
          recommendationsFa: [],
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found for evidence analysis',
          messageFa: 'شناسه پرونده جهت تحلیل مدارک معتبر نمی‌باشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'شناسه پرونده معتبر نیست.'
      );
    }

    const cacheKey = `evidence_${claim.id}_${evidenceItems.length}`;
    const cached = this.getCachedResult<EvidenceIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.analyzeEvidence(claim, evidenceItems, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 2. CLAIM INTELLIGENCE
  // ====================================================
  public async analyzeClaim(
    claimOrId: string | ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<ClaimIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'claim_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          complexity: 'SIMPLE',
          complexityFa: 'ساده',
          predictedProcessingHours: 24,
          recommendedWorkflow: 'STANDARD_ONLINE',
          workflowTitleFa: 'ارزیابی استاندارد برخط',
          workflowReasonFa: 'شناسه پرونده یافت نشد؛ حالت پیش‌فرض.',
          keyRiskFlags: [],
          completenessScore: 50,
          missingItemsFa: [],
          prioritySuggestion: 'normal',
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت طبقه‌بندی یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده در پایگاه داده یافت نشد.'
      );
    }

    const cacheKey = `claim_${claim.id}_${claim.status}`;
    const cached = this.getCachedResult<ClaimIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.analyzeClaim(claim, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 3. DAMAGE INTELLIGENCE
  // ====================================================
  public async analyzeDamage(
    claimOrId: string | ClaimCase,
    context?: DamageAnalysisContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<DamageIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'damage_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          detectedParts: [],
          structuralDamageSuspected: false,
          airbagDeploymentLikely: false,
          overallDamageSeverity: 'MINOR',
          overallSeverityFa: 'جزئی',
          technicalSummaryFa: 'پرونده یافت نشد.',
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت تشخیص آسیب یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `damage_${claim.id}`;
    const cached = this.getCachedResult<DamageIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.analyzeDamage(claim, context, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 4. ESTIMATE INTELLIGENCE
  // ====================================================
  public async generateEstimate(
    claimOrId: string | ClaimCase,
    context?: EstimateContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<EstimateIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'estimate_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          estimatedPartsCost: 0,
          estimatedWageCost: 0,
          estimatedDepreciation: 0,
          estimatedSalvageValue: 0,
          estimatedNetPayable: 0,
          marketPriceRange: { min: 0, max: 0, average: 0 },
          lineItems: [],
          policyCeilingCheck: { policyLimit: 0, withinLimit: true, excessAmount: 0 },
          summaryFa: 'پرونده یافت نشد.',
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت برآورد مالی یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `estimate_${claim.id}_${context?.parts?.length || claim.assessment?.parts?.length || 0}`;
    const cached = this.getCachedResult<EstimateIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.generateEstimate(claim, context, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 5. ASSIGNMENT INTELLIGENCE
  // ====================================================
  public async rankExperts(
    claimOrId: string | ClaimCase,
    candidates?: StaffMember[],
    options?: AIAnalysisOptions
  ): Promise<AIResult<AssignmentIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    let resolvedCandidates: StaffMember[] = [];
    if (candidates && candidates.length > 0) {
      resolvedCandidates = candidates;
    } else {
      const allExpertsMap = loadExpertsFromStorage();
      resolvedCandidates = Object.values(allExpertsMap).flat();
    }

    if (!claim) {
      return createSafeFallbackEnvelope(
        'assignment_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          rankedExperts: [],
          recommendedExpertId: '',
          recommendedExpertName: '',
          assignmentRationaleFa: 'پرونده یافت نشد.',
          autoAssignable: false,
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت رتبه‌بندی کارشناسان یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `assignment_${claim.id}_${resolvedCandidates.length}`;
    const cached = this.getCachedResult<AssignmentIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.rankExperts(claim, resolvedCandidates, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 6. ROUTING INTELLIGENCE
  // ====================================================
  public async routeClaim(
    claimOrId: string | ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<RoutingIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'routing_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          priority: 'NORMAL',
          targetQueue: 'EXPERT_DESK',
          targetQueueFa: 'میز کار ارزیاب',
          autoApprovalEligible: false,
          fastTrackEligible: false,
          slaHoursTarget: 48,
          routingRationaleFa: 'پرونده یافت نشد.',
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت مسیریابی یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `routing_${claim.id}`;
    const cached = this.getCachedResult<RoutingIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.routeClaim(claim, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 7. REVIEW INTELLIGENCE
  // ====================================================
  public async reviewAssessment(
    claimOrId: string | ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<ReviewIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'review_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          compliancePassed: true,
          auditScore: 80,
          discrepanciesDetected: [],
          recommendedAction: 'APPROVE',
          recommendedActionFa: 'تایید',
          reviewerSummaryFa: 'پرونده یافت نشد.',
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت بازبینی کیفی یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `review_${claim.id}`;
    const cached = this.getCachedResult<ReviewIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.reviewAssessment(claim, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 8. INTEGRITY & FRAUD INTELLIGENCE
  // ====================================================
  public async analyzeIntegrity(
    claimOrId: string | ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<IntegrityIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'integrity_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          fraudRiskScore: 0,
          riskLevel: 'LOW',
          riskLevelFa: 'ریسک پایین',
          indicators: [],
          croquiConsistency: {
            partiesMatch: true,
            locationsMatch: true,
            damageConsistencyWithStatement: true,
            notesFa: '',
          },
          sanhabCrossCheck: {
            policyValid: true,
            duplicateClaimFound: false,
            priorClaimsInPast6Months: 0,
          },
          recommendationFa: 'پرونده یافت نشد.',
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت اصالت‌سنجی یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `integrity_${claim.id}`;
    const cached = this.getCachedResult<IntegrityIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.analyzeIntegrity(claim, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 9. SUMMARY INTELLIGENCE
  // ====================================================
  public async generateSummary(
    claimOrId: string | ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<SummaryIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'copilot_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          executiveSummaryFa: 'پرونده یافت نشد.',
          keyFactsFa: [],
          financialSummary: { estimatedLoss: 0, deductibles: 0, payableToVictim: 0 },
          timelineHighlights: [],
          stakeholderImpactFa: '',
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت خلاصه‌سازی یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `summary_${claim.id}`;
    const cached = this.getCachedResult<SummaryIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.generateSummary(claim, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // 10. COPILOT / NEXT BEST ACTION INTELLIGENCE
  // ====================================================
  public async generateNextBestAction(
    claimOrId: string | ClaimCase,
    context?: NextBestActionContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<NextBestActionIntelligenceResult>> {
    const claim = this.resolveClaim(claimOrId);
    if (!claim) {
      return createSafeFallbackEnvelope(
        'copilot_intelligence',
        typeof claimOrId === 'string' ? claimOrId : 'UNKNOWN',
        {
          recommendedAction: 'NOOP',
          recommendedActionFa: 'اقدامی یافت نشد.',
          targetRole: context?.userRole || 'assessor',
          urgency: 'INFORMATIONAL',
          urgencyFa: 'اطلاعاتی',
          rationaleFa: 'پرونده یافت نشد.',
          alternativeActionsFa: [],
          prerequisitesFa: [],
        },
        {
          code: 'INVALID_INPUT',
          message: 'Claim not found',
          messageFa: 'پرونده جهت پیشنهاد اقدام بعدی یافت نشد.',
          fallbackUsed: true,
          retryable: false,
        },
        'پرونده یافت نشد.'
      );
    }

    const cacheKey = `nba_${claim.id}_${context?.userRole || 'assessor'}_${claim.status}`;
    const cached = this.getCachedResult<NextBestActionIntelligenceResult>(cacheKey, options?.forceFresh);
    if (cached) return cached;

    const res = await this.provider.generateNextBestAction(claim, context, options);
    this.setCachedResult(cacheKey, res);
    return res;
  }

  // ====================================================
  // HUMAN-IN-THE-LOOP (HITL) AUDIT RECORDING
  // ====================================================
  public recordHumanReview(
    resultId: string,
    review: AIHumanReview
  ): void {
    this.humanReviews.set(resultId, review);
  }

  public getHumanReview(resultId: string): AIHumanReview | undefined {
    return this.humanReviews.get(resultId);
  }
}

// Export default singleton instance
export const aiService = AIService.getInstance();
export const intelligenceService = aiService;
