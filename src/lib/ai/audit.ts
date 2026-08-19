/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Auditability, Provenance & History Integration
 */

import { AICapability, AIResult, AIAuditTrace, AIHumanReview } from './types';
import { HistoryEntry } from '../../types';

export function createAuditTrace(
  capability: AICapability,
  modelVersion: string,
  provider: 'GEMINI_AI' | 'RULES_ENGINE' | 'FALLBACK_STUB' | 'MOCK_PROVIDER',
  durationMs: number,
  userRole?: string,
  userId?: string
): AIAuditTrace {
  return {
    requestId: `ai-req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    capability,
    modelVersion,
    provider,
    timestamp: new Date().toISOString(),
    durationMs,
    userRole,
    userId,
  };
}

/**
 * Converts a completed AI result or human review action into an existing ClaimFlow HistoryEntry.
 */
export function aiResultToHistoryEntry(
  aiResult: AIResult<any>,
  actionType: 'GENERATED' | 'HUMAN_ACCEPTED' | 'HUMAN_MODIFIED' | 'HUMAN_REJECTED' = 'GENERATED',
  reviewerName?: string
): HistoryEntry {
  const timeStr = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  let status = 'پردازش هوشمند سیستم';
  let note = aiResult.explanation || 'تحلیل خودکار سامانه هوشمند خسارت';
  let user = 'سامانه هوش مصنوعی (ClaimFlow AI)';
  let userRole = 'SYSTEM';

  if (actionType === 'HUMAN_ACCEPTED') {
    status = 'تایید ارزیابی هوشمند';
    user = reviewerName || 'کارشناس ارزیاب';
    userRole = 'ارزیاب خسارت';
    note = `پیشنهاد هوش مصنوعی (${aiResult.capability}) توسط کارشناس بدون تغییر تایید گردید.`;
  } else if (actionType === 'HUMAN_MODIFIED') {
    status = 'اصلاح ارزیابی هوشمند';
    user = reviewerName || 'کارشناس ارزیاب';
    userRole = 'ارزیاب خسارت';
    note = `پیشنهاد هوش مصنوعی (${aiResult.capability}) با اعمال اصلاحات فنی توسط کارشناس ذخیره شد.`;
  } else if (actionType === 'HUMAN_REJECTED') {
    status = 'رد پیشنهاد هوشمند';
    user = reviewerName || 'کارشناس ارزیاب';
    userRole = 'ارزیاب خسارت';
    note = `پیشنهاد هوش مصنوعی به دلیل عدم انطباق با واقعیت توسط کارشناس رد شد.`;
  }

  return {
    status,
    time: timeStr,
    user,
    userRole,
    uploaderParty: 'SYSTEM',
    note,
    actionType: `AI_${aiResult.capability.toUpperCase()}_${actionType}`,
  };
}
