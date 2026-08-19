/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Intelligence Capabilities Registry
 */

import { AICapability, AICapabilityMetadata } from './types';

export const AI_CAPABILITIES_REGISTRY: Record<AICapability, AICapabilityMetadata> = {
  evidence_intelligence: {
    id: 'evidence_intelligence',
    nameFa: 'هوش تحلیل مدارک و تصویربرداری',
    nameEn: 'Evidence Intelligence',
    descriptionFa: 'اعتبارسنجی کیفی تصاویر، خوانش خودکار کروکی فراجا (OCR)، تطبیق پلاک و کشف نقص مدارک',
    category: 'ANALYSIS',
    requiresHumanReview: false,
    defaultLatencyBudgetMs: 4000,
    minConfidenceThreshold: 0.75,
  },
  claim_intelligence: {
    id: 'claim_intelligence',
    nameFa: 'هوش طبقه‌بندی و تحلیل پرونده',
    nameEn: 'Claim Intelligence',
    descriptionFa: 'تعیین درجه پیچیدگی پرونده، پیشنهاد فرآیند بهینه (مسیر سبز/آنلاین/میدانی) و پیش‌بینی زمان رسیدگی',
    category: 'DECISION_SUPPORT',
    requiresHumanReview: false,
    defaultLatencyBudgetMs: 3000,
    minConfidenceThreshold: 0.80,
  },
  damage_intelligence: {
    id: 'damage_intelligence',
    nameFa: 'هوش تشخیص و ارزیابی آسیب خودرو',
    nameEn: 'Damage Intelligence',
    descriptionFa: 'شناسایی خودکار قطعات آسیب‌دیده، تفکیک نیاز به تعویض یا صافکاری و نقاشی، و تحلیل شدت ضربه',
    category: 'ANALYSIS',
    requiresHumanReview: true,
    defaultLatencyBudgetMs: 5000,
    minConfidenceThreshold: 0.85,
  },
  estimate_intelligence: {
    id: 'estimate_intelligence',
    nameFa: 'هوش برآورد هزینه‌ها و قطعات',
    nameEn: 'Estimate Intelligence',
    descriptionFa: 'استعلام قیمت روز قطعات یدکی در بازار، محاسبه اجرت مصوب اتحادیه، استهلاک سال ساخت و ارزش داغی',
    category: 'DECISION_SUPPORT',
    requiresHumanReview: true,
    defaultLatencyBudgetMs: 4500,
    minConfidenceThreshold: 0.85,
  },
  assignment_intelligence: {
    id: 'assignment_intelligence',
    nameFa: 'هوش ارزیابی و رتبه‌بندی کارشناسان',
    nameEn: 'Assignment Intelligence',
    descriptionFa: 'تطبیق تخصص کارشناس، موقعیت جغرافیایی شعبه، بار کاری فعلی و سابقه SLA جهت ارجاع بهینه',
    category: 'AUTOMATION',
    requiresHumanReview: false,
    defaultLatencyBudgetMs: 2500,
    minConfidenceThreshold: 0.70,
  },
  routing_intelligence: {
    id: 'routing_intelligence',
    nameFa: 'هوش مسیریابی و اولویت‌بندی پرونده',
    nameEn: 'Routing Intelligence',
    descriptionFa: 'تشخیص پرونده‌های واجد شرایط پرداخت مستقیم، تعیین اولویت و صف تخصیص خزانه‌داری یا بازبینی',
    category: 'AUTOMATION',
    requiresHumanReview: false,
    defaultLatencyBudgetMs: 2500,
    minConfidenceThreshold: 0.80,
  },
  review_intelligence: {
    id: 'review_intelligence',
    nameFa: 'هوش کنترل کیفیت و بازبینی ارزیابی',
    nameEn: 'Review Intelligence',
    descriptionFa: 'بررسی عدم انحراف قیمت قطعات و اجرت‌ها از ضوابط بیمه‌گر، کنترل تصاویر مستند و کشف مغایرت‌های فنی',
    category: 'DECISION_SUPPORT',
    requiresHumanReview: true,
    defaultLatencyBudgetMs: 4000,
    minConfidenceThreshold: 0.85,
  },
  integrity_intelligence: {
    id: 'integrity_intelligence',
    nameFa: 'هوش اصالت‌سنجی و کشف تقلب',
    nameEn: 'Integrity & Anti-Fraud Intelligence',
    descriptionFa: 'پایش الگوهای تصادف ساختگی، تطبیق سوابق خسارت سنهاب، تناقض زاویه برخورد با کروکی و هشدار ریسک',
    category: 'ANALYSIS',
    requiresHumanReview: true,
    defaultLatencyBudgetMs: 5000,
    minConfidenceThreshold: 0.90,
  },
  copilot_intelligence: {
    id: 'copilot_intelligence',
    nameFa: 'دستیار هوشمند و اقدام بهینه بعدی',
    nameEn: 'Copilot & Next Best Action',
    descriptionFa: 'راهنمایی گام به گام کاربر، ارزیاب و مدیر مالی برای تکمیل اقدامات معوق و جلوگیری از نقض SLA',
    category: 'ASSISTANT',
    requiresHumanReview: false,
    defaultLatencyBudgetMs: 2000,
    minConfidenceThreshold: 0.75,
  },
};

export function getCapabilityMetadata(capability: AICapability): AICapabilityMetadata {
  return AI_CAPABILITIES_REGISTRY[capability] || {
    id: capability,
    nameFa: 'قابلیت هوش مصنوعی',
    nameEn: 'AI Capability',
    descriptionFa: 'سرویس هوشمند پردازش خسارت بیمه',
    category: 'ANALYSIS',
    requiresHumanReview: false,
    defaultLatencyBudgetMs: 3000,
    minConfidenceThreshold: 0.75,
  };
}

export function getAllCapabilities(): AICapabilityMetadata[] {
  return Object.values(AI_CAPABILITIES_REGISTRY);
}
