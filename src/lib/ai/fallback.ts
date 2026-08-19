/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Safe Fallbacks & Error Resilience
 */

import { AICapability, AIErrorDetails, AIResult, AIExecutionStatus } from './types';
import { calibrateConfidence } from './confidence';

/**
 * Execute an async AI operation with a strict timeout and automatic fallback.
 */
export async function withTimeoutAndFallback<T>(
  capability: AICapability,
  claimId: string,
  operation: (signal: AbortSignal) => Promise<T>,
  fallbackGenerator: (error: AIErrorDetails) => T,
  timeoutMs = 4000
): Promise<{ result: T; error?: AIErrorDetails; latencyMs: number; status: AIExecutionStatus }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await operation(controller.signal);
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    return {
      result,
      latencyMs,
      status: 'READY',
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    let errorDetails: AIErrorDetails;
    if (err.name === 'AbortError' || controller.signal.aborted) {
      errorDetails = {
        code: 'TIMEOUT',
        message: `AI request exceeded time budget of ${timeoutMs}ms`,
        messageFa: `زمان پاسخگویی هوش مصنوعی از سقف مجاز (${timeoutMs} میلی‌ثانیه) فراتر رفت؛ داده‌های استاندارد پشتیبان فعال شد.`,
        fallbackUsed: true,
        retryable: true,
      };
    } else if (err.message?.includes('API_KEY') || err.message?.includes('GEMINI_API_KEY')) {
      errorDetails = {
        code: 'AUTH_MISSING',
        message: 'AI Provider key not configured',
        messageFa: 'کلید وب‌سرویس هوش مصنوعی در سرور پیکربندی نشده است؛ ارزیابی به صورت پیش‌فرض و سنتی فعال شد.',
        fallbackUsed: true,
        retryable: false,
        originalError: err.message,
      };
    } else {
      errorDetails = {
        code: 'SERVICE_UNAVAILABLE',
        message: err.message || 'AI service execution failed',
        messageFa: 'سرویس هوشمند موقتاً با خطا مواجه شد؛ فرآیند کارشناسی بدون توقف و با اطلاعات پیش‌فرض ادامه می‌یابد.',
        fallbackUsed: true,
        retryable: true,
        originalError: String(err),
      };
    }

    const fallbackResult = fallbackGenerator(errorDetails);
    return {
      result: fallbackResult,
      error: errorDetails,
      latencyMs,
      status: 'UNAVAILABLE',
    };
  }
}

/**
 * Creates an empty safe result envelope when catastrophic failure occurs
 */
export function createSafeFallbackEnvelope<T>(
  capability: AICapability,
  claimId: string,
  payload: T,
  error: AIErrorDetails,
  explanationFa: string
): AIResult<T> {
  return {
    id: `ai-fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    capability,
    claimId,
    status: 'UNAVAILABLE',
    result: payload,
    confidence: calibrateConfidence(0.5, [], 'حالت داده‌های پیش‌فرض به دلیل عدم دسترسی به سرویس هوش مصنوعی'),
    modelVersion: 'claimflow-fallback-v1',
    timestamp: new Date().toISOString(),
    sourceReferences: [],
    explanation: explanationFa,
    explanationBullets: [
      'سرویس هوش مصنوعی در این لحظه در دسترس نیست.',
      'کلیه اطلاعات و محاسبات باید به صورت دستی توسط کارشناس ارزیاب تکمیل گردد.',
      'هیچ تغییری در روند پرونده ایجاد نشده و گردش کار متوقف نخواهد شد.',
    ],
    latencyMs: 10,
    error,
    humanReview: {
      status: 'PENDING_REVIEW',
    },
    auditTrace: {
      requestId: `req-${Date.now()}`,
      capability,
      modelVersion: 'claimflow-fallback-v1',
      provider: 'FALLBACK_STUB',
      timestamp: new Date().toISOString(),
      durationMs: 10,
    },
  };
}
