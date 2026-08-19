/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Calibrated Confidence Calibration & Formatting
 */

import { AIConfidence, AIConfidenceLevel, AIConfidenceFactor } from './types';

export const CONFIDENCE_THRESHOLDS = {
  HIGH_MIN: 0.85,    // 85% and above -> HIGH (اطمینان بالا)
  MEDIUM_MIN: 0.60,  // 60% to 84% -> MEDIUM (اطمینان متوسط)
  LOW_MAX: 0.59,     // Below 60% -> LOW (اطمینان پایین)
};

/**
 * Calibrates a raw numeric score (0.0 to 1.0) into a qualitative, explainable AIConfidence structure.
 */
export function calibrateConfidence(
  score: number,
  customFactors?: AIConfidenceFactor[],
  contextExplanationFa?: string
): AIConfidence {
  const normalizedScore = Math.max(0, Math.min(1, Number(score) || 0));

  let level: AIConfidenceLevel;
  let labelFa: 'بالا' | 'متوسط' | 'پایین';
  let descriptionFa: string;

  if (normalizedScore >= CONFIDENCE_THRESHOLDS.HIGH_MIN) {
    level = 'HIGH';
    labelFa = 'بالا';
    descriptionFa =
      contextExplanationFa ||
      'سطح اطمینان بالا بر اساس انطباق کامل مستندات، تصاویر باکیفیت و استعلامات برخط رسمی فراجا و سنهاب.';
  } else if (normalizedScore >= CONFIDENCE_THRESHOLDS.MEDIUM_MIN) {
    level = 'MEDIUM';
    labelFa = 'متوسط';
    descriptionFa =
      contextExplanationFa ||
      'سطح اطمینان متوسط؛ نتایج اولیه نیازمند بازبینی اجمالی توسط کارشناس ارزیاب یا بررسی تصویر مکمل است.';
  } else {
    level = 'LOW';
    labelFa = 'پایین';
    descriptionFa =
      contextExplanationFa ||
      'سطح اطمینان پایین به دلیل کمبود داده‌های ورودی، تار بودن تصاویر یا عدم انطباق اولیه؛ مداخله دستی الزامی است.';
  }

  return {
    level,
    score: Math.round(normalizedScore * 100) / 100,
    labelFa,
    descriptionFa,
    factors: customFactors,
  };
}

/**
 * Helper to get Tailwind badge classes for confidence levels
 */
export function getConfidenceBadgeClass(level: AIConfidenceLevel): string {
  switch (level) {
    case 'HIGH':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'MEDIUM':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'LOW':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
