import { ClaimCase, UserSession, ThresholdProfile, DepreciationConfig, StaffMember, ExpertComplaint, AssessorNotification, CustomerNotification, PaymentOrder, PaymentBatch, CustomerCallLog, CustomerTicket, CrmSatisfactionSurvey, CrmFollowUpTask, InsurerInfo, CompanyRegistrationRequest, StaffRoleCategory } from '../types';
import { INITIAL_CASES, DEFAULT_THRESHOLDS, DEFAULT_DEPRECIATION_TABLES, INITIAL_EXPERTS, INITIAL_FIELD_EXPERTS, INITIAL_EXPERT_COMPLAINTS, INITIAL_FINANCE_STAFF, INITIAL_CRM_STAFF, INITIAL_REVIEWERS, INSURER_COMPANIES, INITIAL_COMPANY_REQUESTS } from '../data/mockData';
import { sanitizeMediaForStorage } from './imageCompressor';

const STORAGE_KEYS = {
  CASES: 'claimflow_cases',
  USER_SESSION: 'currentUser',
  CUSTOMERS: 'claimflow_customers',
  INSURERS: 'claimflow_insurers',
  COMPANY_REQUESTS: 'claimflow_company_requests',
  THRESHOLDS: 'claimflow_ai_threshold_profiles',
  DEPRECIATION: 'claimflow_depreciation_tables',
  EXPERTS: 'claimflow_experts',
  REVIEWERS: 'claimflow_reviewers',
  FIELD_EXPERTS: 'claimflow_field_experts',
  FINANCE_STAFF: 'claimflow_finance_staff',
  CRM_STAFF: 'claimflow_crm_staff',
  EXPERT_COMPLAINTS: 'claimflow_expert_complaints',
  ASSESSOR_NOTIFICATIONS: 'claimflow_assessor_notifications',
  CUSTOMER_NOTIFICATIONS: 'claimflow_customer_notifications',
  PAYMENT_ORDERS: 'claimflow_payment_orders',
  PAYMENT_BATCHES: 'claimflow_payment_batches',
  CRM_CALL_LOGS: 'claimflow_crm_call_logs',
  CRM_TICKETS: 'claimflow_crm_tickets',
  CRM_SURVEYS: 'claimflow_crm_surveys',
  CRM_FOLLOW_UPS: 'claimflow_crm_follow_ups',
};

export interface RegisteredCustomer {
  phone: string;
  name: string;
  nationalId?: string;
  avatarUrl?: string;
  password: string;
  registeredAt: string;
}

const INITIAL_CUSTOMERS: RegisteredCustomer[] = [
  {
    phone: '09121112233',
    name: 'رضا صادقی',
    nationalId: '0012345678',
    password: '1234',
    registeredAt: '1403/01/15'
  },
  {
    phone: '09128881122',
    name: 'مهرداد کاظمی',
    nationalId: '0023456789',
    password: '1234',
    registeredAt: '1403/02/10'
  },
  {
    phone: '09123456789',
    name: 'مهدی کشاورز',
    nationalId: '0012345678',
    password: '1234',
    registeredAt: '1403/01/15'
  },
  {
    phone: '09121111111',
    name: 'علی حسینی',
    nationalId: '0023456789',
    password: '1234',
    registeredAt: '1403/02/10'
  }
];

export function loadCustomersFromStorage(): RegisteredCustomer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading customers from storage:', e);
  }
  saveCustomersToStorage(INITIAL_CUSTOMERS);
  return INITIAL_CUSTOMERS;
}

export function saveCustomersToStorage(customers: RegisteredCustomer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers to storage:', e);
  }
}

export function registerCustomer(newCust: RegisteredCustomer): { success: boolean; message: string } {
  const customers = loadCustomersFromStorage();
  const existing = customers.find((c) => c.phone === newCust.phone);
  if (existing) {
    return { success: false, message: 'این شماره موبایل قبلاً در سامانه ثبت‌نام کرده است. لطفاً وارد شوید.' };
  }
  const updated = [newCust, ...customers];
  saveCustomersToStorage(updated);
  return { success: true, message: 'ثبت‌نام با موفقیت انجام شد.' };
}

export function updateCustomerProfile(
  oldPhone: string,
  updatedData: { name: string; phone: string; nationalId?: string; avatarUrl?: string }
): void {
  const customers = loadCustomersFromStorage();
  const idx = customers.findIndex((c) => c.phone === oldPhone || c.phone === updatedData.phone);
  if (idx !== -1) {
    customers[idx] = {
      ...customers[idx],
      name: updatedData.name,
      phone: updatedData.phone,
      nationalId: updatedData.nationalId,
      avatarUrl: updatedData.avatarUrl
    };
  } else {
    customers.push({
      phone: updatedData.phone,
      name: updatedData.name,
      nationalId: updatedData.nationalId,
      avatarUrl: updatedData.avatarUrl,
      password: '1234',
      registeredAt: new Date().toLocaleDateString('fa-IR')
    });
  }
  saveCustomersToStorage(customers);
}

export function loadCasesFromStorage(): ClaimCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge missing seed cases for full insurer company coverage
        const merged = [...parsed];
        INITIAL_CASES.forEach(seed => {
          if (!merged.some(m => m.id === seed.id)) {
            merged.push(seed);
          }
        });
        return merged;
      }
    }
  } catch (e) {
    console.error('Error reading cases from storage:', e);
  }
  // Fallback to initial seed
  saveCasesToStorage(INITIAL_CASES);
  return INITIAL_CASES;
}

export function saveCasesToStorage(cases: ClaimCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  } catch (e: any) {
    console.warn('Direct save to storage failed (likely quota limit). Attempting sanitization and recovery...', e);
    try {
      // Stage 1: Sanitize long base64/media payloads
      const sanitized = sanitizeMediaForStorage(cases, 50000);
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(sanitized));
      console.info('Successfully saved cases after Stage 1 media sanitization.');
    } catch (e2) {
      console.warn('Stage 1 sanitization still exceeded quota. Attempting aggressive compression...', e2);
      try {
        // Stage 2: Aggressive trimming of heavy historical blobs
        const aggressive = sanitizeMediaForStorage(cases, 15000);
        localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(aggressive));
        console.info('Successfully saved cases after Stage 2 aggressive sanitization.');
      } catch (e3) {
        console.error('Final fallback: could not persist all cases to localStorage due to browser quota.', e3);
        try {
          // Stage 3: Keep last 15 cases with lightweight attachments
          const lightweight = sanitizeMediaForStorage(cases.slice(0, 15), 5000);
          localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(lightweight));
        } catch (e4) {
          console.error('Critical quota exhaustion on localStorage:', e4);
        }
      }
    }
  }
}

export function loadSession(): UserSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading user session:', e);
  }
  return null;
}

export function saveSession(session: UserSession | null): void {
  try {
    if (!session) {
      sessionStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    }
  } catch (e) {
    console.error('Error saving user session:', e);
  }
}

export function loadThresholds(): Record<string, ThresholdProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_THRESHOLDS;
}

export function saveThresholds(data: Record<string, ThresholdProfile>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(data));
  } catch (e) {}
}

export function loadDepreciation(): Record<string, DepreciationConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPRECIATION);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_DEPRECIATION_TABLES;
}

export function saveDepreciation(data: Record<string, DepreciationConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEPRECIATION, JSON.stringify(data));
  } catch (e) {}
}

// Utility functions
export function formatCurrency(amount: number | string | undefined): string {
  const num = typeof amount === 'number' ? amount : Number(String(amount || '0').replace(/[^0-9]/g, '')) || 0;
  return num.toLocaleString('fa-IR') + ' ریال';
}

export function parseMoneyNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const str = String(value)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[^0-9]/g, '');
  return Number(str) || 0;
}

export function generateTrackingCode(): string {
  const randNum = Math.floor(Math.random() * 9000 + 1000);
  const randLetters = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `CF-${randNum}-${randLetters}`;
}

export function getInsurerPersianName(insurerStr?: string): string {
  if (!insurerStr) return 'بیمه دانا';
  const clean = insurerStr.trim().toLowerCase();
  if (clean === 'dana' || clean.includes('دانا')) return 'بیمه دانا';
  if (clean === 'alborz' || clean.includes('البرز')) return 'بیمه البرز';
  if (clean === 'asia' || clean.includes('آسیا')) return 'بیمه آسیا';
  if (clean === 'iran' || clean.includes('ایران')) return 'بیمه ایران';
  if (clean === 'mellat' || clean.includes('ملت')) return 'بیمه ملت';
  if (clean === 'pasargad' || clean.includes('پاسارگاد')) return 'بیمه پاسارگاد';
  if (clean === 'parsian' || clean.includes('پارسیان')) return 'بیمه پارسیان';
  if (!insurerStr.startsWith('بیمه')) return `بیمه ${insurerStr}`;
  return insurerStr;
}

export interface InsurerBrandConfig {
  code: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  headerBgGradient: string;
  accentColor: string;
  cardBorder: string;
  accentBg: string;
  subtextColor: string;
  logoLetter: string;
  tagline: string;
}

export function getInsurerBrandConfig(companyCode?: string, companyName?: string): InsurerBrandConfig {
  const code = (companyCode || 'dana').toLowerCase().trim();
  const name = companyName || getInsurerPersianName(code);

  if (code === 'iran' || code.includes('iran') || name.includes('ایران')) {
    return {
      code: 'iran',
      name: 'بیمه ایران',
      badgeBg: 'bg-slate-900',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-400/60',
      headerBgGradient: 'from-amber-500 via-orange-500 to-amber-600 text-white',
      accentColor: 'text-amber-400',
      cardBorder: 'border-amber-400/40',
      accentBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
      subtextColor: 'text-amber-200/90',
      logoLetter: 'ایران',
      tagline: 'شرکت سهامی بیمه ایران • بزرگترین و نخستین بیمه‌گر دولتی کشور'
    };
  }

  if (code === 'asia' || code.includes('asia') || name.includes('آسیا')) {
    return {
      code: 'asia',
      name: 'بیمه آسیا',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-400/60',
      headerBgGradient: 'from-emerald-500 via-teal-500 to-emerald-600 text-white',
      accentColor: 'text-emerald-400',
      cardBorder: 'border-emerald-400/40',
      accentBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
      subtextColor: 'text-emerald-200/90',
      logoLetter: 'آسیا',
      tagline: 'بیمه آسیا • پیشرو در خدمت‌رسانی و ارزیابی هوشمند خسارت خودرو'
    };
  }

  if (code === 'alborz' || code.includes('alborz') || name.includes('البرز')) {
    return {
      code: 'alborz',
      name: 'بیمه البرز',
      badgeBg: 'bg-purple-600',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-400/60',
      headerBgGradient: 'from-purple-500 via-indigo-500 to-purple-600 text-white',
      accentColor: 'text-purple-400',
      cardBorder: 'border-purple-400/40',
      accentBg: 'bg-purple-500 hover:bg-purple-400 text-white',
      subtextColor: 'text-purple-200/90',
      logoLetter: 'البرز',
      tagline: 'بیمه البرز • توانگری مالی سطح یک و پرداخت برخط خسارات'
    };
  }

  if (code === 'pasargad' || code.includes('pasargad') || name.includes('پاسارگاد')) {
    return {
      code: 'pasargad',
      name: 'بیمه پاسارگاد',
      badgeBg: 'bg-rose-600',
      badgeText: 'text-rose-300',
      badgeBorder: 'border-rose-400/60',
      headerBgGradient: 'from-rose-500 via-pink-500 to-rose-600 text-white',
      accentColor: 'text-rose-400',
      cardBorder: 'border-rose-400/40',
      accentBg: 'bg-rose-500 hover:bg-rose-400 text-white',
      subtextColor: 'text-rose-200/90',
      logoLetter: 'پاسارگاد',
      tagline: 'بیمه پاسارگاد • آرامش شما، هدف ماست'
    };
  }

  if (code === 'parsian' || code.includes('parsian') || name.includes('پارسیان')) {
    return {
      code: 'parsian',
      name: 'بیمه پارسیان',
      badgeBg: 'bg-amber-600',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-400/60',
      headerBgGradient: 'from-orange-500 via-amber-500 to-orange-600 text-white',
      accentColor: 'text-amber-400',
      cardBorder: 'border-amber-400/40',
      accentBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
      subtextColor: 'text-amber-200/90',
      logoLetter: 'پارسیان',
      tagline: 'بیمه پارسیان • همراه مطمئن شما در جاده‌ها'
    };
  }

  if (code === 'mellat' || code.includes('mellat') || name.includes('ملت')) {
    return {
      code: 'mellat',
      name: 'بیمه ملت',
      badgeBg: 'bg-teal-600',
      badgeText: 'text-teal-300',
      badgeBorder: 'border-teal-400/60',
      headerBgGradient: 'from-teal-500 via-cyan-500 to-teal-600 text-white',
      accentColor: 'text-teal-400',
      cardBorder: 'border-teal-400/40',
      accentBg: 'bg-teal-500 hover:bg-teal-400 text-slate-950',
      subtextColor: 'text-teal-200/90',
      logoLetter: 'ملت',
      tagline: 'بیمه ملت • همراه خانواده‌ها و فعالان اقتصادی'
    };
  }

  // Default / Dana / Custom Company
  return {
    code: code,
    name: name,
    badgeBg: 'bg-blue-700',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-400/60',
    headerBgGradient: 'from-blue-500 via-indigo-500 to-blue-600 text-white',
    accentColor: 'text-cyan-400',
    cardBorder: 'border-blue-400/40',
    accentBg: 'bg-blue-600 hover:bg-blue-500 text-white',
    subtextColor: 'text-blue-200/90',
    logoLetter: name.slice(0, 5),
    tagline: `پورتال رسمی و اختصاصی مدیریت خسارت شرکت ${name}`
  };
}

/**
 * Checks whether a claim case strictly belongs to a specific insurance company.
 * By legal insurance rules, Third-Party claims are strictly routed to the Culprit's Insurer (بیمه‌گر مقصر).
 */
export function isCaseBelongingToInsurer(
  c: ClaimCase,
  targetCompanyCode: string,
  targetCompanyName?: string
): boolean {
  if (!c) return false;
  const targetCode = (targetCompanyCode || '').toLowerCase().trim();
  const targetPersian = (targetCompanyName || getInsurerPersianName(targetCode)).toLowerCase().trim();

  // 1. Primary culprit insurer
  const culpritInsurer = (c.culpritInsurer || '').toLowerCase().trim();
  const culpritPersian = getInsurerPersianName(culpritInsurer).toLowerCase().trim();

  if (culpritInsurer === targetCode || culpritPersian === targetPersian) return true;
  if (targetCode && culpritInsurer && (culpritInsurer.includes(targetCode) || targetCode.includes(culpritInsurer))) {
    if (culpritInsurer.length >= 3 && targetCode.length >= 3) return true;
  }

  // 2. Direct insurerCode or insuranceCompany match
  const cInsurerCode = (c.insurerCode || '').toLowerCase().trim();
  const cInsurerName = (c.insurerName || c.insuranceCompany || '').toLowerCase().trim();
  if (cInsurerCode === targetCode || cInsurerName === targetPersian) return true;

  // 3. For bodily claims specifically filed against victim's own policy (بیمه بدنه)
  if (c.isBodyClaim || c.isBodily || c.id?.startsWith('BD-')) {
    const victimInsurer = (c.victimInsurer || '').toLowerCase().trim();
    const victimPersian = getInsurerPersianName(victimInsurer).toLowerCase().trim();
    if (victimInsurer === targetCode || victimPersian === targetPersian) return true;
  }

  return false;
}

// ----------------------------------------------------
// INSURANCE COMPANIES MANAGEMENT
// ----------------------------------------------------
export function loadInsurersFromStorage(): InsurerInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INSURERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with initial companies if missing
        const merged = [...parsed];
        INSURER_COMPANIES.forEach((initComp) => {
          if (!merged.some((m) => m.code === initComp.code)) {
            merged.push(initComp);
          }
        });
        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading insurers from storage:', e);
  }

  saveInsurersToStorage(INSURER_COMPANIES);
  return INSURER_COMPANIES;
}

export function saveInsurersToStorage(insurers: InsurerInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INSURERS, JSON.stringify(insurers));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_insurers_updated'));
    }
  } catch (e) {
    console.error('Error saving insurers to storage:', e);
  }
}

export function loadExpertsFromStorage(): Record<string, StaffMember[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPERTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Ensure active field is set
        const normalized: Record<string, StaffMember[]> = {};
        for (const companyKey of Object.keys(parsed)) {
          normalized[companyKey] = (parsed[companyKey] || []).map((exp: StaffMember) => ({
            ...exp,
            active: exp.active !== false
          }));
        }
        return normalized;
      }
    }
  } catch (e) {
    console.error('Error loading experts from storage:', e);
  }

  // Fallback to initial seeds
  const initialData: Record<string, StaffMember[]> = {};
  for (const companyKey of Object.keys(INITIAL_EXPERTS)) {
    initialData[companyKey] = INITIAL_EXPERTS[companyKey].map((exp) => ({
      ...exp,
      active: true
    }));
  }
  saveExpertsToStorage(initialData);
  return initialData;
}

export function saveExpertsToStorage(data: Record<string, StaffMember[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPERTS, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_staff_updated'));
    }
  } catch (e) {
    console.error('Error saving experts to storage:', e);
  }
}

export function loadReviewersFromStorage(): Record<string, StaffMember[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const normalized: Record<string, StaffMember[]> = {};
        for (const companyKey of Object.keys(parsed)) {
          normalized[companyKey] = (parsed[companyKey] || []).map((rv: StaffMember) => ({
            ...rv,
            active: rv.active !== false
          }));
        }
        return normalized;
      }
    }
  } catch (e) {
    console.error('Error loading reviewers from storage:', e);
  }

  const initialData: Record<string, StaffMember[]> = {};
  for (const companyKey of Object.keys(INITIAL_REVIEWERS)) {
    initialData[companyKey] = INITIAL_REVIEWERS[companyKey].map((rv) => ({
      ...rv,
      active: true
    }));
  }
  saveReviewersToStorage(initialData);
  return initialData;
}

export function saveReviewersToStorage(data: Record<string, StaffMember[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWERS, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_staff_updated'));
    }
  } catch (e) {
    console.error('Error saving reviewers to storage:', e);
  }
}

export function loadFieldExpertsFromStorage(): Record<string, StaffMember[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIELD_EXPERTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const normalized: Record<string, StaffMember[]> = {};
        for (const companyKey of Object.keys(INITIAL_FIELD_EXPERTS)) {
          const storedList = parsed[companyKey] || [];
          const initialList = INITIAL_FIELD_EXPERTS[companyKey] || [];
          
          // Seed with latest initial branch experts, merging stored state if available
          const merged: StaffMember[] = initialList.map((initExp) => {
            const match = storedList.find((s: StaffMember) => s.id === initExp.id);
            return match ? { ...initExp, ...match } : { ...initExp, active: true };
          });

          // Add any custom staff added by user that are not in initial seeds
          storedList.forEach((st: StaffMember) => {
            if (!merged.some((m) => m.id === st.id)) {
              merged.push({ ...st, active: st.active !== false });
            }
          });

          normalized[companyKey] = merged;
        }

        // Also preserve other custom companies
        for (const companyKey of Object.keys(parsed)) {
          if (!normalized[companyKey]) {
            normalized[companyKey] = parsed[companyKey];
          }
        }

        return normalized;
      }
    }
  } catch (e) {
    console.error('Error loading field experts from storage:', e);
  }

  const initialData: Record<string, StaffMember[]> = {};
  for (const companyKey of Object.keys(INITIAL_FIELD_EXPERTS)) {
    initialData[companyKey] = INITIAL_FIELD_EXPERTS[companyKey].map((exp) => ({
      ...exp,
      active: true
    }));
  }
  saveFieldExpertsToStorage(initialData);
  return initialData;
}

export function saveFieldExpertsToStorage(data: Record<string, StaffMember[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FIELD_EXPERTS, JSON.stringify(data));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_staff_updated'));
    }
  } catch (e) {
    console.error('Error saving field experts to storage:', e);
  }
}

export function loadComplaintsFromStorage(): ExpertComplaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPERT_COMPLAINTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => !c.id.startsWith('CMP-10') && !c.id.startsWith('CMP-demo'));
      }
    }
  } catch (e) {
    console.error('Error loading expert complaints from storage:', e);
  }

  saveComplaintsToStorage([]);
  return [];
}

export function saveComplaintsToStorage(complaints: ExpertComplaint[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPERT_COMPLAINTS, JSON.stringify(complaints));
  } catch (e) {
    console.error('Error saving expert complaints to storage:', e);
  }
}

export function loadAssessorNotifications(): AssessorNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSOR_NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading assessor notifications from storage:', e);
  }
  return [];
}

export function saveAssessorNotifications(notifications: AssessorNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSESSOR_NOTIFICATIONS, JSON.stringify(notifications));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_notifications_updated'));
    }
  } catch (e) {
    console.error('Error saving assessor notifications to storage:', e);
  }
}

export function addAssessorNotification(notif: AssessorNotification): void {
  const existing = loadAssessorNotifications();
  const updated = [notif, ...existing];
  saveAssessorNotifications(updated);
}

export function sendCrmMessageToExpert(
  expertId: string,
  expertPhone: string | undefined,
  caseId: string,
  title: string,
  message: string,
  sender: { name: string; role: string; phone?: string }
): AssessorNotification {
  const now = new Date();
  const notif: AssessorNotification = {
    id: `notif-crm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'CRM_MESSAGE',
    caseId,
    expertId,
    recipientPhone: expertPhone,
    senderPhone: sender.phone,
    sender: sender.name,
    senderRole: sender.role,
    title: title || 'پیام فوری از امور مشتریان و CRM',
    message,
    sentAt: now.toISOString(),
    date: now.toLocaleDateString('fa-IR'),
    time: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    read: false,
    requiresReply: true
  };

  addAssessorNotification(notif);
  return notif;
}

export function requestCrmContactForCase(
  caseId: string,
  customerName: string,
  customerPhone: string,
  reason: string,
  reasonType: string,
  requester: { name: string; role: string; phone?: string },
  priority: 'عادی' | 'مهم' | 'فوری و بحرانی' = 'مهم',
  notes?: string
): CrmFollowUpTask {
  const now = new Date();
  const task: CrmFollowUpTask = {
    id: `TSK-REQ-${Date.now().toString().slice(-6)}`,
    caseId,
    customerName,
    customerPhone,
    reason,
    targetDepartment: 'امور مشتریان',
    assignedAgent: 'مرکز تماس و CRM',
    priority,
    dueDate: now.toLocaleDateString('fa-IR'),
    status: 'در انتظار انجام',
    notes: notes || '',
    createdAt: `${now.toLocaleDateString('fa-IR')} ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
    requestedByRole: requester.role,
    requestedByName: requester.name,
    requestedByPhone: requester.phone,
    requestedReasonType: reasonType,
    isOverdueAction: true,
    contactAttemptsCount: 0
  };

  const existing = loadCrmFollowUpsFromStorage();
  const updated = [task, ...existing];
  saveCrmFollowUpsToStorage(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('claimflow_crm_followups_updated', { detail: task }));
  }
  return task;
}

export function markAssessorNotificationAsRead(id: string): void {
  const list = loadAssessorNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveAssessorNotifications(updated);
}

// ----------------------------------------------------
// CUSTOMER NOTIFICATIONS MANAGEMENT
// ----------------------------------------------------
const INITIAL_CUSTOMER_NOTIFICATIONS: CustomerNotification[] = [
  {
    id: 'notif-cust-init-1',
    type: 'BRANCH_VISIT',
    caseId: 'BD-1403-8821-DANA',
    recipientPhone: '09123456789',
    title: 'درخواست مراجعه حضوری به شعبه و ارزیابی خسارت',
    message: 'مشتری گرامی مهدی کشاورز، پرونده خسارت بدنه شما ارجاع گردید. جهت رویت خودرو و تطبیق اصالت با کارشناس رسمی میدانی جناب آقای کیوان عزیزی (همراه: ۰۹۱۲۹۰۰۱۰۰۱)، لطفاً به نزدیک‌ترین شعبه بیمه دانا به نشانی: تهران، میدان ونک، خیابان گاندی جنوبی، پلاک ۱۲ (تلفن: ۰۲۱-۸۸۷۷۶۶۵۵) مراجعه فرمایید.',
    branchName: 'مجتمع تخصصی خسارت اتومبیل بیمه دانا (مرکزی - میدان ونک)',
    branchAddress: 'تهران، میدان ونک، خیابان گاندی جنوبی، کوچه هفدهم، پلاک ۱۲',
    branchPhone: '۰۲۱-۸۸۷۷۶۶۵۵',
    expertName: 'کیوان عزیزی (کارشناس میدانی)',
    expertPhone: '09129001001',
    sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    date: '۱۴۰۵/۰۵/۱۷',
    time: '۱۰:۱۵',
    read: false,
    linkAction: 'case_detail'
  }
];

export function loadCustomerNotifications(phone?: string): CustomerNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (!phone) return parsed;
        return parsed.filter((n) => !n.recipientPhone || n.recipientPhone === phone);
      }
    }
    // Return initial default notifications on first launch
    saveCustomerNotifications(INITIAL_CUSTOMER_NOTIFICATIONS);
    if (!phone) return INITIAL_CUSTOMER_NOTIFICATIONS;
    return INITIAL_CUSTOMER_NOTIFICATIONS.filter((n) => !n.recipientPhone || n.recipientPhone === phone);
  } catch (e) {
    console.error('Error loading customer notifications from storage:', e);
  }
  return [];
}

export function saveCustomerNotifications(notifications: CustomerNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Error saving customer notifications to storage:', e);
  }
}

export function addCustomerNotification(notification: CustomerNotification): void {
  const existing = loadCustomerNotifications();
  const updated = [notification, ...existing.filter((n) => n.id !== notification.id)];
  saveCustomerNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('claimflow_notifications_updated'));
  }
}

export function markCustomerNotificationAsRead(id: string): void {
  const list = loadCustomerNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveCustomerNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('claimflow_notifications_updated'));
  }
}

export function markAllCustomerNotificationsAsRead(phone?: string): void {
  const list = loadCustomerNotifications();
  const updated = list.map((n) => {
    if (!phone || n.recipientPhone === phone) {
      return { ...n, read: true };
    }
    return n;
  });
  saveCustomerNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('claimflow_notifications_updated'));
  }
}

export function deleteCustomerNotification(id: string): void {
  const list = loadCustomerNotifications();
  const updated = list.filter((n) => n.id !== id);
  saveCustomerNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('claimflow_notifications_updated'));
  }
}

const TIMEOUT_72_HOURS_MS = 72 * 60 * 60 * 1000;
const TIMEOUT_72_HOURS_MINUTES = 72 * 60; // 4320 minutes

export interface SlaDetail {
  totalElapsedMinutes: number;
  elapsedHours: number;
  elapsedMinutes: number;
  totalRemainingMinutes: number;
  remainingHours: number;
  remainingMinutes: number;
  isExpired: boolean;
  isNearDeadline: boolean;
  progressPercent: number;
  elapsedText: string;
  remainingText: string;
  statusLabel: string;
  badgeClass: string;
}

export function calculateAssessorSlaDetail(c: ClaimCase): SlaDetail {
  let startTime = Date.now();
  if (c.assignedTimestamp) {
    startTime = c.assignedTimestamp;
  } else if (c.assignedAt) {
    const parsed = new Date(c.assignedAt).getTime();
    if (!isNaN(parsed)) startTime = parsed;
  } else if (c.createdAt) {
    const parsed = new Date(c.createdAt).getTime();
    if (!isNaN(parsed)) startTime = parsed;
  }

  const elapsedMs = Math.max(0, Date.now() - startTime);
  const totalElapsedMinutes = Math.floor(elapsedMs / 60000);
  const elapsedHours = Math.floor(totalElapsedMinutes / 60);
  const elapsedMinutes = totalElapsedMinutes % 60;

  const totalRemainingMinutes = Math.max(0, TIMEOUT_72_HOURS_MINUTES - totalElapsedMinutes);
  const remainingHours = Math.floor(totalRemainingMinutes / 60);
  const remainingMinutes = totalRemainingMinutes % 60;

  const isExpired = totalElapsedMinutes >= TIMEOUT_72_HOURS_MINUTES;
  const isNearDeadline = !isExpired && totalElapsedMinutes >= 48 * 60; // Less than 24 hours remaining
  const progressPercent = Math.min(100, Math.round((totalElapsedMinutes / TIMEOUT_72_HOURS_MINUTES) * 100));

  const elapsedText = `${elapsedHours} ساعت و ${elapsedMinutes} دقیقه`;
  const remainingText = isExpired
    ? 'مهلت ۷۲ ساعته منقضی شد'
    : `${remainingHours} ساعت و ${remainingMinutes} دقیقه`;

  let statusLabel = 'زمان کافی (سبز)';
  let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';

  if (isExpired) {
    statusLabel = 'منقضی شده (سلب صلاحیت)';
    badgeClass = 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse';
  } else if (isNearDeadline) {
    statusLabel = 'هشدار انقضا (کمتر از ۲۴ ساعت)';
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  return {
    totalElapsedMinutes,
    elapsedHours,
    elapsedMinutes,
    totalRemainingMinutes,
    remainingHours,
    remainingMinutes,
    isExpired,
    isNearDeadline,
    progressPercent,
    elapsedText,
    remainingText,
    statusLabel,
    badgeClass
  };
}

export function checkAndProcessTimeouts(cases: ClaimCase[]): {
  updatedCases: ClaimCase[];
  newNotifications: AssessorNotification[];
  didChange: boolean;
} {
  const now = Date.now();
  let didChange = false;
  const newNotifications: AssessorNotification[] = [];
  const existingNotifications = loadAssessorNotifications();

  const updatedCases = cases.map((c) => {
    // Check if case is assigned and pending action (not yet evaluated/approved/rejected)
    const isAssignedPending =
      (c.status === 'محول شده' || c.status === 'محول شده به کارشناس' || c.status === 'در حال ارزیابی' || c.status === 'در انتظار ارجاع به ارزیاب') &&
      Boolean(c.assignedExpert?.id) &&
      (!c.assessment || (c.assessment.status !== 'SUBMITTED' && c.assessment.status !== 'REVIEWED' && c.assessment.status !== 'ACCEPTED'));

    if (!isAssignedPending) {
      return c;
    }

    const sla = calculateAssessorSlaDetail(c);

    // If exactly 72h (4320 minutes) elapsed
    if (sla.isExpired) {
      didChange = true;
      const exp = c.assignedExpert!;
      const notifId = `sms-timeout-${c.id}-${exp.id}`;

      // Avoid creating duplicate notification if already sent
      if (!existingNotifications.some((n) => n.id === notifId) && !newNotifications.some((n) => n.id === notifId)) {
        const smsNotification: AssessorNotification = {
          id: notifId,
          type: 'SMS',
          caseId: c.id,
          expertId: exp.id,
          recipientPhone: exp.phone || '09121112233',
          title: 'پیامک سلب صلاحیت پرونده (انقضای مهلت ۷۲ ساعته ارزیابی)',
          message: `همکار گرامی (${exp.name})؛ پرونده خسارت به کد رهگیری ${c.id} مربوط به خودروی ${c.carType} (پلاک: ${c.victimPlate || c.plate}) متعلق به زیان‌دیده «${c.victimName}» و مقصر «${c.culpritName}» به دلیل اتمام مهلت قانونی ۷۲ ساعته (۴۳۲۰ دقیقه) و عدم اقدام ارزیابی (تایید یا رد)، از کارتابل شما سلب صلاحیت گردیده و جهت تخصیص مجدد به شرکت بیمه عودت داده شد. این تأخیر به عنوان نمره منفی در شایستگی عملکردی شما ثبت گردید.`,
          sentAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          read: false
        };
        newNotifications.push(smsNotification);
      }

      return {
        ...c,
        status: 'رد شده' as const,
        autoReturnedDueToTimeout: true,
        autoReturnedAt: new Date().toISOString(),
        timedOutExpert: {
          id: exp.id,
          name: exp.name,
          phone: exp.phone
        },
        previousAssignedExpert: {
          id: exp.id,
          name: exp.name,
          role: exp.role
        },
        rejectedByAssessorIds: Array.from(new Set([...(c.rejectedByAssessorIds || []), exp.id])),
        expertRejected: {
          by: exp.name,
          at: new Date().toISOString(),
          reason: `انقضای مهلت ۷۲ ساعته (${sla.elapsedText} معطلی) و عدم ارزیابی پرونده توسط کارشناس (سلب صلاحیت خودکار و عودت به شرکت بیمه)`
        },
        assignedExpert: null,
        history: [
          ...(c.history || []),
          {
            status: 'رد شده (انقضای ۷۲ ساعته)',
            time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            user: 'سامانه هوشمند پایش و نظارت بیمه',
            note: `پرونده به دلیل سپری شدن دقیق مهلت ۷۲ ساعته (${sla.elapsedText}) و عدم ثبت تایید یا رد توسط کارشناس (${exp.name})، به صورت خودکار سلب صلاحیت و جهت ارجاع به کارشناس دیگر به کارتابل بیمه عودت داده شد.`
          }
        ]
      };
    }

    return c;
  });

  if (newNotifications.length > 0) {
    saveAssessorNotifications([...newNotifications, ...existingNotifications]);
  }

  return { updatedCases, newNotifications, didChange };
}

export function expireCaseManuallyForTesting(
  caseId: string,
  cases: ClaimCase[]
): { updatedCases: ClaimCase[]; notification: AssessorNotification | null } {
  let createdNotification: AssessorNotification | null = null;

  const updatedCases = cases.map((c) => {
    if (c.id !== caseId) return c;
    const exp = c.assignedExpert || {
      id: 'ir1',
      name: 'مریم نجفی',
      role: 'کارشناس ارزیاب خسارت',
      phone: '09124004001'
    };

    const notifId = `sms-timeout-${c.id}-${exp.id}-${Date.now()}`;
    createdNotification = {
      id: notifId,
      type: 'SMS',
      caseId: c.id,
      expertId: exp.id,
      recipientPhone: exp.phone || '09124004001',
      title: 'پیامک سلب صلاحیت پرونده (انقضای مهلت ۷۲ ساعته ارزیابی)',
      message: `همکار گرامی (${exp.name})؛ پرونده خسارت به کد رهگیری ${c.id} مربوط به خودروی ${c.carType} (پلاک: ${c.victimPlate || c.plate}) متعلق به زیان‌دیده «${c.victimName}» و مقصر «${c.culpritName}» به دلیل اتمام مهلت قانونی ۷۲ ساعته (۴۳۲۰ دقیقه) و عدم اقدام ارزیابی (تایید یا رد)، از کارتابل شما سلب صلاحیت گردیده و جهت تخصیص مجدد به شرکت بیمه عودت داده شد. این تأخیر به عنوان نمره منفی در شایستگی عملکردی شما ثبت گردید.`,
      sentAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    return {
      ...c,
      status: 'رد شده' as const,
      autoReturnedDueToTimeout: true,
      autoReturnedAt: new Date().toISOString(),
      timedOutExpert: {
        id: exp.id,
        name: exp.name,
        phone: exp.phone
      },
      previousAssignedExpert: {
        id: exp.id,
        name: exp.name,
        role: exp.role
      },
      rejectedByAssessorIds: Array.from(new Set([...(c.rejectedByAssessorIds || []), exp.id])),
      expertRejected: {
        by: exp.name,
        at: new Date().toISOString(),
        reason: 'انقضای مهلت ۷۲ ساعته کارشناس و عدم ارزیابی پرونده (سلب صلاحیت خودکار و عودت به شرکت بیمه)'
      },
      assignedExpert: null,
      history: [
        ...(c.history || []),
        {
          status: 'رد شده (انقضای ۷۲ ساعته)',
          time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          user: 'سامانه هوشمند پایش و نظارت بیمه',
          note: `پرونده به دلیل سپری شدن مهلت ۷۲ ساعته و عدم اقدام توسط کارشناس (${exp.name})، به صورت خودکار سلب صلاحیت و جهت ارجاع به کارشناس دیگر در کارتابل ردشده‌ها/نیازمند ارجاع بیمه قرار گرفت.`
        }
      ]
    };
  });

  if (createdNotification) {
    const existing = loadAssessorNotifications();
    saveAssessorNotifications([createdNotification, ...existing]);
  }

  return { updatedCases, notification: createdNotification };
}

export function adjustCaseAssignmentTimeForTesting(
  caseId: string,
  hoursAgo: number,
  cases: ClaimCase[]
): ClaimCase[] {
  const targetTs = Date.now() - (hoursAgo * 60 * 60 * 1000);
  return cases.map((c) => {
    if (c.id !== caseId) return c;
    return {
      ...c,
      assignedTimestamp: targetTs,
      assignedAt: new Date(targetTs).toISOString(),
      createdAt: new Date(targetTs).toISOString()
    };
  });
}

// ----------------------------------------------------
// FINANCE & TREASURY STORAGE FUNCTIONS
// ----------------------------------------------------
export function loadFinanceStaffFromStorage(): Record<string, StaffMember[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FINANCE_STAFF);
    if (!raw) return INITIAL_FINANCE_STAFF;
    return JSON.parse(raw);
  } catch {
    return INITIAL_FINANCE_STAFF;
  }
}

export function saveFinanceStaffToStorage(staff: Record<string, StaffMember[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FINANCE_STAFF, JSON.stringify(staff));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_staff_updated'));
    }
  } catch (e) {
    console.error('Error saving finance staff', e);
  }
}

export const INITIAL_PAYMENT_ORDERS: PaymentOrder[] = [];

export function loadPaymentOrdersFromStorage(): PaymentOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_ORDERS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any mock/demo cases that are not real registered cases
    const cleaned = parsed.filter((o: PaymentOrder) => {
      if (!o || !o.id) return false;
      if (
        o.id === 'PAY-ORD-1403-0105' ||
        o.id === 'PAY-ORD-1403-0106' ||
        o.id === 'PAY-ORD-1403-0101' ||
        o.id === 'PAY-ORD-1403-0107' ||
        o.id === 'PAY-ORD-1403-0108' ||
        o.id === 'PAY-ORD-1403-0102' ||
        o.id === 'PAY-ORD-1403-0109' ||
        o.id === 'PAY-ORD-1403-0098' ||
        o.id === 'PAY-ORD-1403-0099' ||
        o.id === 'PAY-ORD-1403-0103' ||
        o.id === 'PAY-ORD-1403-0104'
      ) {
        return false;
      }
      return true;
    });
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_ORDERS, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function savePaymentOrdersToStorage(orders: PaymentOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error saving payment orders', e);
  }
}

export function loadPaymentBatchesFromStorage(): PaymentBatch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_BATCHES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePaymentBatchesToStorage(batches: PaymentBatch[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_BATCHES, JSON.stringify(batches));
  } catch (e) {
    console.error('Error saving payment batches', e);
  }
}

// ----------------------------------------------------
// CRM & CUSTOMER SUPPORT STORAGE FUNCTIONS
// ----------------------------------------------------
export function loadCrmStaffFromStorage(): Record<string, StaffMember[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_STAFF);
    if (!raw) return INITIAL_CRM_STAFF;
    return JSON.parse(raw);
  } catch {
    return INITIAL_CRM_STAFF;
  }
}

export function saveCrmStaffToStorage(staff: Record<string, StaffMember[]>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_STAFF, JSON.stringify(staff));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_staff_updated'));
    }
  } catch (e) {
    console.error('Error saving CRM staff', e);
  }
}

export const INITIAL_CALL_LOGS: CustomerCallLog[] = [];

export function loadCrmCallLogsFromStorage(): CustomerCallLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_CALL_LOGS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(l => !l.id.startsWith('CALL-1403-50') && !l.id.startsWith('CALL-demo'));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveCrmCallLogsToStorage(logs: CustomerCallLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_CALL_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving CRM call logs', e);
  }
}

export const INITIAL_TICKETS: CustomerTicket[] = [];

export function loadCrmTicketsFromStorage(): CustomerTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_TICKETS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(t => !t.id.startsWith('TCK-1403-10') && !t.id.startsWith('TCK-demo'));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveCrmTicketsToStorage(tickets: CustomerTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving CRM tickets', e);
  }
}

export const INITIAL_SURVEYS: CrmSatisfactionSurvey[] = [];

export function loadCrmSurveysFromStorage(): CrmSatisfactionSurvey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_SURVEYS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(s => !s.id.startsWith('SRV-10') && !s.id.startsWith('SRV-demo'));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveCrmSurveysToStorage(surveys: CrmSatisfactionSurvey[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_SURVEYS, JSON.stringify(surveys));
  } catch (e) {
    console.error('Error saving CRM surveys', e);
  }
}

export const INITIAL_CRM_FOLLOW_UPS: CrmFollowUpTask[] = [];

export function loadCrmFollowUpsFromStorage(): CrmFollowUpTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_FOLLOW_UPS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(f => !f.id.startsWith('TSK-10') && !f.id.startsWith('TSK-demo'));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveCrmFollowUpsToStorage(tasks: CrmFollowUpTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_FOLLOW_UPS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving CRM follow-ups', e);
  }
}

// ----------------------------------------------------
// COMPANY REGISTRATION REQUESTS & APPROVAL FLOW
// ----------------------------------------------------
export function loadCompanyRequestsFromStorage(): CompanyRegistrationRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANY_REQUESTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading company registration requests:', e);
  }

  saveCompanyRequestsToStorage(INITIAL_COMPANY_REQUESTS);
  return INITIAL_COMPANY_REQUESTS;
}

export function saveCompanyRequestsToStorage(requests: CompanyRegistrationRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANY_REQUESTS, JSON.stringify(requests));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_company_requests_updated'));
    }
  } catch (e) {
    console.error('Error saving company registration requests:', e);
  }
}

export function submitCompanyRegistrationRequest(
  data: Omit<CompanyRegistrationRequest, 'id' | 'submittedAt' | 'status'>
): { success: boolean; message: string; requestId: string } {
  const requests = loadCompanyRequestsFromStorage();
  const existingInsurers = loadInsurersFromStorage();

  // Check if company code or economic code is already registered
  const duplicateActive = existingInsurers.find(
    (i) => i.code.toLowerCase() === data.companyCode.toLowerCase() ||
           (data.economicCode && i.economicCode === data.economicCode)
  );
  if (duplicateActive) {
    return {
      success: false,
      message: `این شرکت بیمه قبلاً در سامانه تایید و فعال شده است. مدیر ارشد شرکت با شماره تماس ${duplicateActive.adminPhone || 'ثبت شده'} می‌تواند وارد شود.`,
      requestId: ''
    };
  }

  const newId = `REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR') + ' ' + now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  const newReq: CompanyRegistrationRequest = {
    ...data,
    id: newId,
    submittedAt: dateStr,
    status: 'PENDING'
  };

  const updated = [newReq, ...requests];
  saveCompanyRequestsToStorage(updated);

  return {
    success: true,
    message: `درخواست ثبت شرکت «${data.companyName}» با شماره رهگیری ${newId} با موفقیت در سامانه ثبت شد و در صف بررسی مدیر کل پلتفرم قرار گرفت.`,
    requestId: newId
  };
}

export function approveCompanyRegistrationRequest(
  requestId: string,
  reviewerAdminName: string = 'مدیر کل سامانه (Super Admin)'
): { success: boolean; message: string; newCompany?: InsurerInfo } {
  const requests = loadCompanyRequestsFromStorage();
  const targetIdx = requests.findIndex((r) => r.id === requestId);
  if (targetIdx === -1) {
    return { success: false, message: 'درخواست مورد نظر یافت نشد.' };
  }

  const req = requests[targetIdx];
  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR') + ' ' + now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  // 1. Update request status to APPROVED
  requests[targetIdx] = {
    ...req,
    status: 'APPROVED',
    reviewedAt: dateStr,
    reviewedBy: reviewerAdminName
  };
  saveCompanyRequestsToStorage(requests);

  // 2. Add or update in Insurers list
  const insurers = loadInsurersFromStorage();
  let brandColor = 'blue';
  const colorOptions = ['indigo', 'emerald', 'teal', 'violet', 'cyan', 'amber', 'rose', 'sky'];
  brandColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];

  const newCompany: InsurerInfo = {
    code: req.companyCode.toLowerCase().trim(),
    name: req.companyName.trim(),
    defaultPassword: '1234',
    brandColor: brandColor,
    licenseNumber: req.licenseNumber || `LIC-${req.companyCode.toUpperCase()}-1403`,
    sanhabCode: `SNH-${req.companyCode.toUpperCase()}-5050`,
    economicCode: req.economicCode,
    registrationNumber: req.registrationNumber,
    adminName: req.adminName,
    adminNationalId: req.adminNationalId,
    adminPhone: req.adminPhone,
    adminEmail: req.adminEmail,
    phone: req.companyPhone,
    email: req.companyEmail,
    address: req.address,
    province: req.province || 'تهران',
    city: req.city || 'تهران',
    onlineWithoutCroquiCeiling: 400000000,
    onlineWithCroquiCeiling: 1500000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    activeBranchesCount: 15,
    establishedYear: '۱۴۰۳',
    approvedAt: dateStr,
    description: `شرکت بیمه ${req.companyName} تایید شده توسط مدیر ارشد پلتفرم با مجوز رسمی بیمه مرکزی`
  };

  const existingCompanyIdx = insurers.findIndex((i) => i.code.toLowerCase() === newCompany.code);
  if (existingCompanyIdx !== -1) {
    insurers[existingCompanyIdx] = { ...insurers[existingCompanyIdx], ...newCompany };
  } else {
    insurers.push(newCompany);
  }
  saveInsurersToStorage(insurers);

  return {
    success: true,
    message: `شرکت «${req.companyName}» تایید و به سامانه اضافه شد. پیامک فعال‌سازی حساب کاربری مدیر ارشد به شماره ${req.adminPhone} ارسال گردید.`,
    newCompany
  };
}

export function rejectCompanyRegistrationRequest(
  requestId: string,
  rejectionReason: string,
  reviewerAdminName: string = 'مدیر کل سامانه (Super Admin)'
): { success: boolean; message: string } {
  const requests = loadCompanyRequestsFromStorage();
  const targetIdx = requests.findIndex((r) => r.id === requestId);
  if (targetIdx === -1) {
    return { success: false, message: 'درخواست مورد نظر یافت نشد.' };
  }

  const req = requests[targetIdx];
  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR') + ' ' + now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  requests[targetIdx] = {
    ...req,
    status: 'REJECTED',
    rejectionReason: rejectionReason || 'عدم تطابق مدارک ثبتی یا پروانه فعالیت',
    reviewedAt: dateStr,
    reviewedBy: reviewerAdminName
  };
  saveCompanyRequestsToStorage(requests);

  return {
    success: true,
    message: `درخواست شرکت «${req.companyName}» رد شد و پیامک اعلام دلیل رد به متقاضی (${req.adminPhone}) ارسال گردید.`
  };
}

// ----------------------------------------------------
// SMART RBAC STAFF LOOKUP & INVITATION SYSTEM
// ----------------------------------------------------
export interface StaffLookupResult {
  found: boolean;
  staff?: StaffMember;
  companyCode?: string;
  companyName?: string;
  category?: StaffRoleCategory;
  isActive: boolean;
  message?: string;
}

export function lookupStaffByCredentials(nationalId: string, phone?: string): StaffLookupResult {
  const cleanNatId = (nationalId || '').trim();
  const cleanPhone = (phone || '').trim();
  if (!cleanNatId && !cleanPhone) {
    return { found: false, isActive: false, message: 'کد ملی یا شماره موبایل وارد نشده است.' };
  }

  const insurers = loadInsurersFromStorage();
  const experts = loadExpertsFromStorage();
  const reviewers = loadReviewersFromStorage();
  const fieldExperts = loadFieldExpertsFromStorage();
  const financeStaff = loadFinanceStaffFromStorage();
  const crmStaff = loadCrmStaffFromStorage();

  const allMaps: Array<{ category: StaffRoleCategory; map: Record<string, StaffMember[]> }> = [
    { category: 'assessor', map: experts },
    { category: 'reviewer', map: reviewers },
    { category: 'fieldexpert', map: fieldExperts },
    { category: 'finance', map: financeStaff },
    { category: 'crm', map: crmStaff }
  ];

  for (const item of allMaps) {
    for (const companyCode of Object.keys(item.map)) {
      const list = item.map[companyCode] || [];
      const match = list.find((s) => {
        const matchNatId = cleanNatId && s.nationalId && s.nationalId.trim() === cleanNatId;
        const matchPhone = cleanPhone && s.phone && s.phone.trim() === cleanPhone;
        if (cleanNatId && cleanPhone) {
          return matchNatId || matchPhone;
        }
        return matchNatId || matchPhone;
      });

      if (match) {
        const companyInfo = insurers.find((c) => c.code.toLowerCase() === companyCode.toLowerCase());
        const companyName = companyInfo?.name || getInsurerPersianName(companyCode);
        const isActive = match.active !== false;

        return {
          found: true,
          staff: match,
          companyCode: companyCode,
          companyName: companyName,
          category: item.category,
          isActive: isActive,
          message: isActive
            ? `احراز هویت موفق: ${match.name} (${match.role || 'کارشناس خسارت'} - ${companyName})`
            : `دسترسی کاربری «${match.name}» توسط مدیر ارشد شرکت ${companyName} به حالت غیرفعال درآمده است.`
        };
      }
    }
  }

  return {
    found: false,
    isActive: false,
    message: 'کد ملی یا شماره موبایل در فهرست کارشناسان و پرسنل هیچ‌یک از شرکت‌های بیمه ثبت نشده است.'
  };
}

export function inviteNewStaffMember(
  companyCode: string,
  staffData: {
    name: string;
    nationalId: string;
    phone: string;
    role?: string;
    category?: StaffRoleCategory;
    licenseCode?: string;
    branchName?: string;
    province?: string;
    city?: string;
  },
  invitedByName: string = 'مدیر ارشد شرکت بیمه'
): { success: boolean; message: string; newStaff: StaffMember; inviteLink: string; smsText: string } {
  const cleanCode = (companyCode || 'dana').toLowerCase().trim();
  const category = staffData.category || 'assessor';
  const insurers = loadInsurersFromStorage();
  const comp = insurers.find((c) => c.code === cleanCode);
  const compName = comp?.name || getInsurerPersianName(cleanCode);

  const staffId = `STF-${cleanCode.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const dateStr = now.toLocaleDateString('fa-IR');
  const inviteLink = `https://claimflow.ir/login?invite=${staffId}&org=${cleanCode}`;
  const smsText = `همکار گرامی ${staffData.name}، شما توسط ${invitedByName} به عنوان ${staffData.role || 'کارشناس ارزیاب'} در پرتال خسارت «${compName}» عضو شدید. جهت ورود و فعال‌سازی از لینک زیر با کد ملی ${staffData.nationalId} استفاده کنید:\n${inviteLink}`;

  const newStaff: StaffMember = {
    id: staffId,
    name: staffData.name.trim(),
    role: staffData.role?.trim() || 'کارشناس ارزیاب خسارت',
    category: category,
    phone: staffData.phone.trim(),
    nationalId: staffData.nationalId.trim(),
    active: true,
    company: cleanCode,
    companyName: compName,
    licenseCode: staffData.licenseCode || `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
    branchName: staffData.branchName || 'شعبه مرکزی',
    province: staffData.province || comp?.province || 'تهران',
    city: staffData.city || comp?.city || 'تهران',
    status: 'AVAILABLE',
    rating: 5.0,
    registeredAt: dateStr,
    invitedBy: invitedByName,
    invitedAt: dateStr,
    invitationStatus: 'ACTIVATED',
    smsInviteSent: true,
    smsInviteText: smsText
  };

  // Add to the appropriate category storage
  if (category === 'assessor') {
    const experts = loadExpertsFromStorage();
    const list = experts[cleanCode] || [];
    experts[cleanCode] = [newStaff, ...list];
    saveExpertsToStorage(experts);
  } else if (category === 'reviewer') {
    const reviewers = loadReviewersFromStorage();
    const list = reviewers[cleanCode] || [];
    reviewers[cleanCode] = [newStaff, ...list];
    saveReviewersToStorage(reviewers);
  } else if (category === 'fieldexpert') {
    const fieldExperts = loadFieldExpertsFromStorage();
    const list = fieldExperts[cleanCode] || [];
    fieldExperts[cleanCode] = [newStaff, ...list];
    saveFieldExpertsToStorage(fieldExperts);
  } else if (category === 'finance') {
    const finance = loadFinanceStaffFromStorage();
    const list = finance[cleanCode] || [];
    finance[cleanCode] = [newStaff, ...list];
    saveFinanceStaffToStorage(finance);
  } else if (category === 'crm') {
    const crm = loadCrmStaffFromStorage();
    const list = crm[cleanCode] || [];
    crm[cleanCode] = [newStaff, ...list];
    saveCrmStaffToStorage(crm);
  }

  return {
    success: true,
    message: `کارشناس «${staffData.name}» با موفقیت تعریف شد و پیامک دعوت و فعال‌سازی به شماره ${staffData.phone} ارسال گردید.`,
    newStaff,
    inviteLink,
    smsText
  };
}

export function toggleStaffActiveStatus(
  companyCode: string,
  staffId: string,
  category: StaffRoleCategory = 'assessor'
): { success: boolean; newStatus: boolean; message: string } {
  const cleanCode = (companyCode || 'dana').toLowerCase().trim();

  let targetList: StaffMember[] = [];
  let saveFn: (data: Record<string, StaffMember[]>) => void;
  let allData: Record<string, StaffMember[]> = {};

  if (category === 'assessor') {
    allData = loadExpertsFromStorage();
    saveFn = saveExpertsToStorage;
  } else if (category === 'reviewer') {
    allData = loadReviewersFromStorage();
    saveFn = saveReviewersToStorage;
  } else if (category === 'fieldexpert') {
    allData = loadFieldExpertsFromStorage();
    saveFn = saveFieldExpertsToStorage;
  } else if (category === 'finance') {
    allData = loadFinanceStaffFromStorage();
    saveFn = saveFinanceStaffToStorage;
  } else {
    allData = loadCrmStaffFromStorage();
    saveFn = saveCrmStaffToStorage;
  }

  targetList = allData[cleanCode] || [];
  const staffIdx = targetList.findIndex((s) => s.id === staffId);
  if (staffIdx === -1) {
    return { success: false, newStatus: false, message: 'کارشناس مورد نظر پیدا نشد.' };
  }

  const current = targetList[staffIdx];
  const newStatus = current.active === false ? true : false;
  targetList[staffIdx] = { ...current, active: newStatus };
  allData[cleanCode] = targetList;
  saveFn(allData);

  const statusLabel = newStatus ? 'فعال و مجاز به دسترسی' : 'غیرفعال و مسدود';
  return {
    success: true,
    newStatus,
    message: `وضعیت دسترسی کارشناس «${current.name}» به حالت «${statusLabel}» تغییر یافت.`
  };
}

export function deleteStaffMember(
  companyCode: string,
  staffId: string,
  category: StaffRoleCategory = 'assessor'
): { success: boolean; message: string } {
  const cleanCode = (companyCode || 'dana').toLowerCase().trim();

  let saveFn: (data: Record<string, StaffMember[]>) => void;
  let allData: Record<string, StaffMember[]> = {};

  if (category === 'assessor') {
    allData = loadExpertsFromStorage();
    saveFn = saveExpertsToStorage;
  } else if (category === 'reviewer') {
    allData = loadReviewersFromStorage();
    saveFn = saveReviewersToStorage;
  } else if (category === 'fieldexpert') {
    allData = loadFieldExpertsFromStorage();
    saveFn = saveFieldExpertsToStorage;
  } else if (category === 'finance') {
    allData = loadFinanceStaffFromStorage();
    saveFn = saveFinanceStaffToStorage;
  } else {
    allData = loadCrmStaffFromStorage();
    saveFn = saveCrmStaffToStorage;
  }

  const targetList = allData[cleanCode] || [];
  const targetStaff = targetList.find((s) => s.id === staffId);
  const updatedList = targetList.filter((s) => s.id !== staffId);
  allData[cleanCode] = updatedList;
  saveFn(allData);

  return {
    success: true,
    message: `کارشناس «${targetStaff?.name || staffId}» با موفقیت از سیستم این شرکت حذف شد.`
  };
}






