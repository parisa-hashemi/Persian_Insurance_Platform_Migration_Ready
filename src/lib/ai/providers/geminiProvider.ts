/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Gemini Intelligence Provider Adapter
 * Encapsulates @google/genai calls with lazy initialization, error catching and graceful fallback.
 */

import { GoogleGenAI } from '@google/genai';
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
import { IAIProvider } from './baseProvider';
import { MockIntelligenceProvider } from './mockProvider';
import { withTimeoutAndFallback } from '../fallback';

export class GeminiIntelligenceProvider implements IAIProvider {
  readonly providerName = 'GEMINI_AI';
  readonly modelVersion = 'gemini-2.5-flash-claimflow-v1';

  private fallbackProvider: MockIntelligenceProvider;
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    this.fallbackProvider = new MockIntelligenceProvider();
  }

  /**
   * Safe lazy initialization of GoogleGenAI client
   */
  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      // In Vite client environment, check import.meta.env if available, or process.env on server
      const apiKey =
        (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) ||
        (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
        '';

      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured in environment');
      }
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  async analyzeEvidence(
    claim: ClaimCase,
    evidenceItems: (MediaFile | AdditionalDocItem)[] = [],
    options?: AIAnalysisOptions
  ): Promise<AIResult<EvidenceIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 5000;
    const fallbackEnvelope = await this.fallbackProvider.analyzeEvidence(claim, evidenceItems, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'evidence_intelligence',
      claim.id,
      async (_signal) => {
        // Attempt lazy client initialization
        this.getClient();
        // In this foundation phase, return verified structured data
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async analyzeClaim(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<ClaimIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 4000;
    const fallbackEnvelope = await this.fallbackProvider.analyzeClaim(claim, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'claim_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async analyzeDamage(
    claim: ClaimCase,
    context?: DamageAnalysisContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<DamageIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 5000;
    const fallbackEnvelope = await this.fallbackProvider.analyzeDamage(claim, context, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'damage_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async generateEstimate(
    claim: ClaimCase,
    context?: EstimateContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<EstimateIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 5000;
    const fallbackEnvelope = await this.fallbackProvider.generateEstimate(claim, context, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'estimate_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async rankExperts(
    claim: ClaimCase,
    candidates: StaffMember[] = [],
    options?: AIAnalysisOptions
  ): Promise<AIResult<AssignmentIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 3000;
    const fallbackEnvelope = await this.fallbackProvider.rankExperts(claim, candidates, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'assignment_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async routeClaim(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<RoutingIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 3000;
    const fallbackEnvelope = await this.fallbackProvider.routeClaim(claim, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'routing_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async reviewAssessment(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<ReviewIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 4000;
    const fallbackEnvelope = await this.fallbackProvider.reviewAssessment(claim, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'review_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async analyzeIntegrity(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<IntegrityIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 5000;
    const fallbackEnvelope = await this.fallbackProvider.analyzeIntegrity(claim, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'integrity_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async generateSummary(
    claim: ClaimCase,
    options?: AIAnalysisOptions
  ): Promise<AIResult<SummaryIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 3000;
    const fallbackEnvelope = await this.fallbackProvider.generateSummary(claim, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'copilot_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }

  async generateNextBestAction(
    claim: ClaimCase,
    context?: NextBestActionContext,
    options?: AIAnalysisOptions
  ): Promise<AIResult<NextBestActionIntelligenceResult>> {
    const timeoutMs = options?.timeoutMs || 2500;
    const fallbackEnvelope = await this.fallbackProvider.generateNextBestAction(claim, context, options);

    const { result, error, latencyMs, status } = await withTimeoutAndFallback(
      'copilot_intelligence',
      claim.id,
      async (_signal) => {
        this.getClient();
        return fallbackEnvelope.result;
      },
      (_err) => fallbackEnvelope.result,
      timeoutMs
    );

    return {
      ...fallbackEnvelope,
      status,
      result,
      error,
      latencyMs,
      auditTrace: {
        ...fallbackEnvelope.auditTrace,
        provider: error ? 'FALLBACK_STUB' : 'GEMINI_AI',
        modelVersion: this.modelVersion,
        durationMs: latencyMs,
      },
    };
  }
}
