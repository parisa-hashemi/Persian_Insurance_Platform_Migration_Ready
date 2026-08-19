/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Base AI Provider Interface
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
} from '../types';

export interface IAIProvider {
  readonly providerName: string;
  readonly modelVersion: string;

  analyzeEvidence(
    claim: ClaimCase,
    evidenceItems: (MediaFile | AdditionalDocItem)[],
    options?: AIAnalysisOptions
  ): Promise<AIResult<EvidenceIntelligenceResult>>;

  analyzeClaim(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<ClaimIntelligenceResult>>;

  analyzeDamage(
    claim: ClaimCase,
    context?: DamageAnalysisContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<DamageIntelligenceResult>>;

  generateEstimate(
    claim: ClaimCase,
    context?: EstimateContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<EstimateIntelligenceResult>>;

  rankExperts(
    claim: ClaimCase,
    candidates: StaffMember[],
    options?: AIAnalysisOptions
  ): Promise<AIResult<AssignmentIntelligenceResult>>;

  routeClaim(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<RoutingIntelligenceResult>>;

  reviewAssessment(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<ReviewIntelligenceResult>>;

  analyzeIntegrity(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<IntegrityIntelligenceResult>>;

  generateSummary(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<SummaryIntelligenceResult>>;

  generateNextBestAction(
    claim: ClaimCase,
    context?: NextBestActionContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<NextBestActionIntelligenceResult>>;
}
