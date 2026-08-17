import { ClaimCase, UserSession, ThresholdProfile, DepreciationConfig, StaffMember, ExpertComplaint, AssessorNotification, CustomerNotification, PaymentOrder, PaymentBatch, CustomerCallLog, CustomerTicket, CrmSatisfactionSurvey, CrmFollowUpTask, InsurerInfo } from '../types';
import { INITIAL_CASES, DEFAULT_THRESHOLDS, DEFAULT_DEPRECIATION_TABLES, INITIAL_EXPERTS, INITIAL_FIELD_EXPERTS, INITIAL_EXPERT_COMPLAINTS, INITIAL_FINANCE_STAFF, INITIAL_CRM_STAFF, INITIAL_REVIEWERS, INSURER_COMPANIES } from '../data/mockData';
import { sanitizeMediaForStorage } from './imageCompressor';

const STORAGE_KEYS = {
  CASES: 'claimflow_cases',
  USER_SESSION: 'currentUser',
  CUSTOMERS: 'claimflow_customers',
  INSURERS: 'claimflow_insurers',
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
      if (Array.isArray(parsed)) {
        return parsed;
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
  } catch (e) {
    console.error('Error saving assessor notifications to storage:', e);
  }
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





