import { ClaimCase, UserSession, ThresholdProfile, DepreciationConfig, StaffMember, ExpertComplaint, AssessorNotification, CustomerNotification, PaymentOrder, PaymentBatch, CustomerCallLog, CustomerTicket, CrmSatisfactionSurvey, CrmFollowUpTask } from '../types';
import { INITIAL_CASES, DEFAULT_THRESHOLDS, DEFAULT_DEPRECIATION_TABLES, INITIAL_EXPERTS, INITIAL_FIELD_EXPERTS, INITIAL_EXPERT_COMPLAINTS, INITIAL_FINANCE_STAFF, INITIAL_CRM_STAFF } from '../data/mockData';
import { sanitizeMediaForStorage } from './imageCompressor';

const STORAGE_KEYS = {
  CASES: 'claimflow_cases',
  USER_SESSION: 'currentUser',
  CUSTOMERS: 'claimflow_customers',
  THRESHOLDS: 'claimflow_ai_threshold_profiles',
  DEPRECIATION: 'claimflow_depreciation_tables',
  EXPERTS: 'claimflow_experts',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
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
  } catch (e) {
    console.error('Error saving experts to storage:', e);
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
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading expert complaints from storage:', e);
  }

  saveComplaintsToStorage(INITIAL_EXPERT_COMPLAINTS);
  return INITIAL_EXPERT_COMPLAINTS;
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
  } catch (e) {
    console.error('Error saving finance staff', e);
  }
}

export const INITIAL_PAYMENT_ORDERS: PaymentOrder[] = [
  // --- READY_FOR_PAYMENT QUEUE (Diverse SLA Priorities) ---
  {
    id: 'PAY-ORD-1403-0105',
    caseId: 'CLM-1403-9910',
    victimName: 'حامد سرلک (خسارت فوتی/ویژه)',
    victimNationalId: '0054321098',
    victimPhone: '09121998877',
    victimIban: 'IR900190000000001122334455',
    victimBankName: 'بانک صادرات ایران',
    culpritName: 'بهنام توکلی',
    culpritInsurer: 'dana',
    grossAmount: 350000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 350000000,
    status: 'READY_FOR_PAYMENT',
    slaPriority: 'CRITICAL',
    slaDeadline: 'امروز ساعت ۱۴:۰۰',
    slaRemainingHours: 1,
    slaStatus: 'NEAR_BREACH',
    paymentMethod: 'SATNA',
    issueDate: '1403/05/22',
    readyDate: '1403/05/22 ۱۰:۱۵',
    approvedBy: 'دکتر صابری (معاونت خسارت)',
    financeNotes: 'پرونده خسارت بدنی فوری با حکم قضایی - الزام تسویه در موعد مقرر ساتنا.',
    accountVoucherNumber: 'VCH-1403-9086',
    preCheck: {
      ibanValid: true,
      ibanBankName: 'بانک صادرات ایران',
      nameMatchConfidence: 100,
      nameMatchPassed: true,
      amountUnderCeiling: true,
      payoutReadyVerified: true,
      noDuplicatePassed: true,
      checkedAt: '1403/05/22 ۱۰:۳۰',
      checkedBy: 'سیستم خزانه‌داری مرکزی'
    }
  },
  {
    id: 'PAY-ORD-1403-0106',
    caseId: 'CLM-1403-9844',
    victimName: 'مریم صبوری (مشتری شاکی VIP)',
    victimNationalId: '0067891234',
    victimPhone: '09361112233',
    victimIban: 'IR440150000000009988776655',
    victimBankName: 'بانک سپه',
    culpritName: 'داوود رحیمی',
    culpritInsurer: 'alborz',
    grossAmount: 85000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 85000000,
    status: 'READY_FOR_PAYMENT',
    slaPriority: 'URGENT',
    slaDeadline: 'امروز ساعت ۱۶:۳۰',
    slaRemainingHours: 3,
    slaStatus: 'ON_TRACK',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/22',
    readyDate: '1403/05/22 ۰۹:۴۰',
    approvedBy: 'مهرداد پاکزاد (مدیر مالی)',
    financeNotes: 'ارجاعی از امور مشتریان و CRM به دلیل درخواست تسریع در پرداخت حواله.',
    accountVoucherNumber: 'VCH-1403-9087',
    preCheck: {
      ibanValid: true,
      ibanBankName: 'بانک سپه',
      nameMatchConfidence: 100,
      nameMatchPassed: true,
      amountUnderCeiling: true,
      payoutReadyVerified: true,
      noDuplicatePassed: true,
      checkedAt: '1403/05/22 ۰۹:۵۵',
      checkedBy: 'سیستم خزانه‌داری مرکزی'
    }
  },
  {
    id: 'PAY-ORD-1403-0101',
    caseId: 'CLM-1403-8821',
    victimName: 'مهدی کشاورز',
    victimNationalId: '0012345678',
    victimPhone: '09123456789',
    victimIban: 'IR520120000000001234567890',
    victimBankName: 'بانک ملت',
    culpritName: 'رضا کمالی',
    culpritInsurer: 'dana',
    grossAmount: 48500000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 48500000,
    status: 'READY_FOR_PAYMENT',
    slaPriority: 'HIGH',
    slaDeadline: 'فردا ساعت ۱۰:۰۰',
    slaRemainingHours: 12,
    slaStatus: 'ON_TRACK',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/20',
    readyDate: '1403/05/20 ۱۱:۳۰',
    approvedBy: 'مهرداد پاکزاد (مدیر مالی)',
    financeNotes: 'تایید اصالت شبا و مدارک احراز شد. در صف ارسال دستور پرداخت به درگاه پایا.',
    accountVoucherNumber: 'VCH-1403-9082',
    preCheck: {
      ibanValid: true,
      ibanBankName: 'بانک ملت',
      nameMatchConfidence: 100,
      nameMatchPassed: true,
      amountUnderCeiling: true,
      payoutReadyVerified: true,
      noDuplicatePassed: true,
      checkedAt: '1403/05/20 ۱۱:۴۵',
      checkedBy: 'سیستم خزانه‌داری مرکزی'
    }
  },
  {
    id: 'PAY-ORD-1403-0107',
    caseId: 'CLM-1403-8740',
    victimName: 'پیمان یعقوبی',
    victimNationalId: '0098765432',
    victimPhone: '09123334455',
    victimIban: 'IR190160000000002233445566',
    victimBankName: 'بانک کشاورزی',
    culpritName: 'سعید احمدی',
    culpritInsurer: 'dana',
    grossAmount: 26000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 26000000,
    status: 'READY_FOR_PAYMENT',
    slaPriority: 'NORMAL',
    slaDeadline: 'فردا ساعت ۱۷:۰۰',
    slaRemainingHours: 24,
    slaStatus: 'ON_TRACK',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/21',
    readyDate: '1403/05/21 ۱۶:۲۰',
    approvedBy: 'مهرداد پاکزاد (مدیر مالی)',
    financeNotes: 'تاییدیه کارشناسی خسارت بدنه ثبت گردید. آماده ورود به بسته پایا.',
    accountVoucherNumber: 'VCH-1403-9088',
    preCheck: {
      ibanValid: true,
      ibanBankName: 'بانک کشاورزی',
      nameMatchConfidence: 100,
      nameMatchPassed: true,
      amountUnderCeiling: true,
      payoutReadyVerified: true,
      noDuplicatePassed: true,
      checkedAt: '1403/05/21 ۱۶:۴۵',
      checkedBy: 'سیستم خزانه‌داری مرکزی'
    }
  },
  {
    id: 'PAY-ORD-1403-0108',
    caseId: 'CLM-1403-8612',
    victimName: 'نیلوفر امینی',
    victimNationalId: '0041239876',
    victimPhone: '09124445566',
    victimIban: 'IR880180000000003344556677',
    victimBankName: 'بانک تجارت',
    culpritName: 'کاظم میرزایی',
    culpritInsurer: 'asia',
    grossAmount: 39000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 39000000,
    status: 'READY_FOR_PAYMENT',
    slaPriority: 'NORMAL',
    slaDeadline: '۲ روز آینده',
    slaRemainingHours: 40,
    slaStatus: 'ON_TRACK',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/22',
    readyDate: '1403/05/22 ۰۸:۰۰',
    approvedBy: 'مهرداد پاکزاد',
    financeNotes: 'مدارک بازدید آنلاین تکمیل است. در صف خزانه‌داری.',
    accountVoucherNumber: 'VCH-1403-9089',
    preCheck: {
      ibanValid: true,
      ibanBankName: 'بانک تجارت',
      nameMatchConfidence: 100,
      nameMatchPassed: true,
      amountUnderCeiling: true,
      payoutReadyVerified: true,
      noDuplicatePassed: true,
      checkedAt: '1403/05/22 ۰۸:۱۵',
      checkedBy: 'سیستم خزانه‌داری مرکزی'
    }
  },

  // --- PROCESSING QUEUE ---
  {
    id: 'PAY-ORD-1403-0102',
    caseId: 'CLM-1403-9014',
    victimName: 'سارا رضوی',
    victimNationalId: '0045678901',
    victimPhone: '09128889900',
    victimIban: 'IR890180000000009876543210',
    victimBankName: 'بانک تجارت',
    culpritName: 'محسن افشار',
    culpritInsurer: 'dana',
    grossAmount: 30000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 30000000,
    status: 'PROCESSING',
    slaPriority: 'NORMAL',
    slaDeadline: 'سیکل پایا ساعت ۱۳:۴۵',
    slaRemainingHours: 2,
    slaStatus: 'ON_TRACK',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/21',
    readyDate: '1403/05/21 ۰۹:۱۵',
    bankReferenceNumber: 'TRX-PAYA-PROC-901402',
    financeNotes: 'حواله به چرخه تسویه پایا بانک مرکزی ساعت ۱۳:۴۵ ارسال گردید. در انتظار اعلام نتیجه قطعی بانک.',
    accountVoucherNumber: 'VCH-1403-9083'
  },
  {
    id: 'PAY-ORD-1403-0109',
    caseId: 'CLM-1403-9421',
    victimName: 'پویا معتمدی (ساتنا فوری)',
    victimNationalId: '0071234567',
    victimPhone: '09126667788',
    victimIban: 'IR330560000000007788990011',
    victimBankName: 'بانک سامان',
    culpritName: 'حسین جلیلی',
    culpritInsurer: 'dana',
    grossAmount: 210000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 210000000,
    status: 'PROCESSING',
    slaPriority: 'CRITICAL',
    slaDeadline: 'امروز ساعت ۱۳:۰۰',
    slaRemainingHours: 1,
    slaStatus: 'NEAR_BREACH',
    paymentMethod: 'SATNA',
    issueDate: '1403/05/22',
    readyDate: '1403/05/22 ۱۱:۰۰',
    bankReferenceNumber: 'TRX-SATNA-PROC-94210',
    financeNotes: 'دستور پرداخت ساتنا به هسته صرافی و سوئیچ بانک مرکزی ارسال شد.',
    accountVoucherNumber: 'VCH-1403-9090'
  },

  // --- PAID / SETTLED ---
  {
    id: 'PAY-ORD-1403-0098',
    caseId: 'CLM-1403-7741',
    victimName: 'علی حسینی',
    victimNationalId: '0023456789',
    victimPhone: '09121111111',
    victimIban: 'IR120170000000005544332211',
    victimBankName: 'بانک ملی ایران',
    culpritName: 'کامران نوری',
    culpritInsurer: 'dana',
    grossAmount: 67000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 67000000,
    status: 'PAID',
    slaPriority: 'NORMAL',
    paymentMethod: 'PAYA',
    bankReferenceNumber: 'TRX-PAYA-78904512',
    issueDate: '1403/05/18',
    readyDate: '1403/05/18 ۱۰:۰۰',
    paidDate: '1403/05/19 ۱۲:۳۰',
    approvedBy: 'مهرداد پاکزاد',
    paidBy: 'فرزانه شفیعی (اپراتور خزانه)',
    batchId: 'BATCH-PAYA-14030519-01',
    accountVoucherNumber: 'VCH-1403-8990'
  },
  {
    id: 'PAY-ORD-1403-0099',
    caseId: 'CLM-1403-7802',
    victimName: 'الهام مقدسی',
    victimNationalId: '0089123456',
    victimPhone: '09123332211',
    victimIban: 'IR770120000000001144778899',
    victimBankName: 'بانک ملت',
    culpritName: 'فرشاد کیانی',
    culpritInsurer: 'dana',
    grossAmount: 145000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 145000000,
    status: 'PAID',
    slaPriority: 'HIGH',
    paymentMethod: 'SATNA',
    bankReferenceNumber: 'TRX-SATNA-88129034',
    issueDate: '1403/05/19',
    readyDate: '1403/05/19 ۰۹:۰۰',
    paidDate: '1403/05/19 ۱۱:۱۵',
    approvedBy: 'مهرداد پاکزاد',
    paidBy: 'مهرداد پاکزاد (مدیر مالی)',
    accountVoucherNumber: 'VCH-1403-8995'
  },

  // --- FAILED / RETRY ---
  {
    id: 'PAY-ORD-1403-0103',
    caseId: 'CLM-1403-9120',
    victimName: 'رضا امینی',
    victimNationalId: '0078901234',
    victimPhone: '09351234567',
    victimIban: 'IR640560000000006677889900',
    victimBankName: 'بانک سامان',
    culpritName: 'وحید شریفی',
    culpritInsurer: 'alborz',
    grossAmount: 120000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 120000000,
    status: 'FAILED',
    slaPriority: 'CRITICAL',
    slaDeadline: 'مهلت منقضی‌شده (نیاز به اقدام آنی)',
    slaRemainingHours: 0,
    slaStatus: 'BREACHED',
    paymentMethod: 'SATNA',
    issueDate: '1403/05/22',
    readyDate: '1403/05/22 ۰۸:۳۰',
    failureReason: 'خطای کد ۵۴ شاپرک: شماره حساب مقصد مسدود / غیرفعال است (عدم تطابق با کدملی)',
    retryCount: 1,
    retryHistory: [
      {
        attempt: 1,
        time: '1403/05/22 ۰۹:۰۰',
        previousFailureReason: 'عدم تطابق کدملی زیان‌دیده با صاحب شبا در استعلام بانک مرکزی',
        status: 'FAILED',
        operator: 'سیستم پایا بانکی'
      }
    ],
    financeNotes: 'ارسال با خطا مواجه شد. نیاز به بررسی اصلاح شبا توسط اپراتور خزانه و تلاش مجدد.',
    accountVoucherNumber: 'VCH-1403-9084'
  },

  // --- DISCREPANCY ---
  {
    id: 'PAY-ORD-1403-0104',
    caseId: 'CLM-1403-9250',
    victimName: 'علیرضا اسماعیلی',
    victimNationalId: '0034567890',
    victimPhone: '09127776655',
    victimIban: 'IR720540000000008899112233',
    victimBankName: 'بانک پارسیان',
    culpritName: 'احمد کمالی',
    culpritInsurer: 'dana',
    grossAmount: 125000000,
    salvageDeduction: 0,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 125000000,
    status: 'DISCREPANCY',
    slaPriority: 'URGENT',
    slaDeadline: 'امروز ساعت ۱۵:۰۰',
    slaRemainingHours: 2,
    slaStatus: 'NEAR_BREACH',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/22',
    readyDate: '1403/05/22 ۱۰:۱۵',
    bankReferenceNumber: 'TRX-PAYA-DISC-92501',
    discrepancy: {
      systemAmount: 125000000,
      bankAmount: 120000000,
      difference: 5000000,
      type: 'AMOUNT_MISMATCH',
      detectedAt: '1403/05/22 ۱۱:۲۰',
      details: 'مبلغ تایید شده در سیستم ۱۲۵,۰۰۰,۰۰۰ ریال است اما فیش اعلامی بانک ۱۲۰,۰۰۰,۰۰۰ ریال ثبت شده است (مغایرت ۵,۰۰۰,۰۰۰ ریال).',
      resolved: false
    },
    financeNotes: 'در صف مغایرت‌گیری بانکی خزانه‌داری - در انتظار تسویه و تطبیق سند اصلاحی.',
    accountVoucherNumber: 'VCH-1403-9085'
  }
];

export function loadPaymentOrdersFromStorage(): PaymentOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PAYMENT_ORDERS, JSON.stringify(INITIAL_PAYMENT_ORDERS));
      return INITIAL_PAYMENT_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PAYMENT_ORDERS;
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
  } catch (e) {
    console.error('Error saving CRM staff', e);
  }
}

export const INITIAL_CALL_LOGS: CustomerCallLog[] = [
  {
    id: 'CALL-1403-501',
    caseId: 'CLM-1403-8821',
    contactName: 'مهدی کشاورز',
    contactPhone: '09123456789',
    contactRole: 'زیان‌دیده',
    callDirection: 'ورودی (تماس مشتری)',
    topic: 'پیگیری واریز خسارت',
    sentiment: 'آرام و راضی',
    durationMinutes: 4,
    notes: 'مشتری جویای زمان دقیق واریز وجه شد. به ایشان اعلام شد حواله تایید مالی شده و تا پایان وقت اداری امروز از طریق پایا تسویه خواهد شد.',
    agentName: 'سپیده معتمدی',
    agentId: 'crm-d1',
    callDate: '1403/05/21',
    callTime: '10:35',
    followUpRequired: false,
    resolvedInCall: true
  },
  {
    id: 'CALL-1403-502',
    caseId: 'CLM-1403-9014',
    contactName: 'سارا رضوی',
    contactPhone: '09128889900',
    contactRole: 'زیان‌دیده',
    callDirection: 'خروجی (تماس کارشناس)',
    topic: 'هماهنگی کارشناس میدانی',
    sentiment: 'نگران و عجول',
    durationMinutes: 6,
    notes: 'تماس جهت هماهنگی آدرس و ساعت حضور کارشناس میدانی در محل حادثه. مشتری ابراز نگرانی از عدم کروکی داشت که توضیحات احراز هویت و عکس‌های بدنه ارائه و آرامش خاطر داده شد.',
    agentName: 'حامد شایان',
    agentId: 'crm-d2',
    callDate: '1403/05/21',
    callTime: '11:15',
    followUpRequired: true,
    followUpDate: '1403/05/22',
    resolvedInCall: true
  },
  {
    id: 'CALL-1403-503',
    caseId: 'CLM-1403-9120',
    contactName: 'فرشاد کریمی',
    contactPhone: '09351234567',
    contactRole: 'زیان‌دیده',
    callDirection: 'ورودی (تماس مشتری)',
    topic: 'اعتراض به ارزیابی خسارت',
    sentiment: 'ناراضی و شاکی',
    durationMinutes: 9,
    notes: 'مشتری مدعی بود چراغ جلو و سینی رادیاتور در فاکتور صافکاری خورده ولی نیاز به تعویض کامل دارد. به ایشان راهنمایی شد که می‌تواند درخواست بازبینی ثانویه توسط ارزیاب ارشد ثبت کند یا تیکت شکایت الصاق نماید.',
    agentName: 'سپیده معتمدی',
    agentId: 'crm-d1',
    callDate: '1403/05/20',
    callTime: '14:20',
    followUpRequired: true,
    followUpDate: '1403/05/22',
    resolvedInCall: false
  }
];

export function loadCrmCallLogsFromStorage(): CustomerCallLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_CALL_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CRM_CALL_LOGS, JSON.stringify(INITIAL_CALL_LOGS));
      return INITIAL_CALL_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CALL_LOGS;
  }
}

export function saveCrmCallLogsToStorage(logs: CustomerCallLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_CALL_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving CRM call logs', e);
  }
}

export const INITIAL_TICKETS: CustomerTicket[] = [
  {
    id: 'TCK-1403-101',
    caseId: 'CLM-1403-9120',
    ticketNumber: 'TK-9120-01',
    customerName: 'فرشاد کریمی',
    customerPhone: '09351234567',
    customerRole: 'زیان‌دیده',
    category: 'شکایت از مبلغ ارزیابی',
    priority: 'مهم',
    status: 'در حال پیگیری',
    subject: 'عدم احتساب تعویض چراغ زنون فابریک و سینی فن',
    createdAt: '1403/05/20 14:45',
    lastUpdate: '1403/05/21 09:30',
    assignedAgent: 'سپیده معتمدی',
    messages: [
      {
        id: 'msg-1',
        sender: 'CUSTOMER',
        senderName: 'فرشاد کریمی',
        senderRole: 'زیان‌دیده',
        text: 'با سلام، ارزیاب محترم قیمت چراغ اصلی را با نمونه طرح متفرقه محاسبه کرده است. لطفا بررسی مجدد فرمایید.',
        time: '1403/05/20 14:45'
      },
      {
        id: 'msg-2',
        sender: 'AGENT',
        senderName: 'سپیده معتمدی (کارشناس CRM دانا)',
        senderRole: 'کارشناس امور مشتریان',
        text: 'سلام جناب آقای کریمی. پرونده شما جهت بازبینی قیمت قطعه یدکی به ارزیاب ارشد ارجاع داده شد و نتیجه تا ۲۴ ساعت آینده در پنل شما منعکس می‌گردد.',
        time: '1403/05/21 09:30'
      }
    ]
  },
  {
    id: 'TCK-1403-102',
    caseId: 'CLM-1403-8821',
    ticketNumber: 'TK-8821-02',
    customerName: 'مهدی کشاورز',
    customerPhone: '09123456789',
    customerRole: 'زیان‌دیده',
    category: 'تغییر شماره شبا',
    priority: 'عادی',
    status: 'بسته شده و حل گردید',
    subject: 'اصلاح شماره شبای بانکی جهت واریز وجه خسارت',
    createdAt: '1403/05/19 16:10',
    lastUpdate: '1403/05/20 11:00',
    assignedAgent: 'حامد شایان',
    messages: [
      {
        id: 'msg-10',
        sender: 'CUSTOMER',
        senderName: 'مهدی کشاورز',
        senderRole: 'زیان‌دیده',
        text: 'شبای قبلی من بانک مسکن مسدود بود، شماره شبای بانک ملت به نام خودم را ثبت کردم.',
        time: '1403/05/19 16:10'
      },
      {
        id: 'msg-11',
        sender: 'AGENT',
        senderName: 'حامد شایان',
        senderRole: 'کارشناس امور مشتریان',
        text: 'شبای جدید با سامانه پایا بانک مرکزی استعلام و تایید گردید. حواله پرداخت با شماره جدید صادر شد.',
        time: '1403/05/20 11:00'
      }
    ]
  },
  {
    id: 'TCK-1403-103',
    caseId: 'CLM-1403-9014',
    ticketNumber: 'TK-9014-03',
    customerName: 'سارا رضوی',
    customerPhone: '09128889900',
    customerRole: 'زیان‌دیده',
    category: 'اعتراض به کروکی و مقصر',
    priority: 'بحرانی (شکایت رسمی بیمه مرکزی)',
    status: 'در انتظار پاسخ',
    subject: 'اعلام تصادف صوری توسط مقصر و درخواست بازرسی کارشناس میدانی در محل',
    createdAt: '1403/05/21 12:00',
    lastUpdate: '1403/05/21 12:00',
    assignedAgent: 'سپیده معتمدی',
    messages: [
      {
        id: 'msg-20',
        sender: 'CUSTOMER',
        senderName: 'سارا رضوی',
        senderRole: 'زیان‌دیده',
        text: 'مقصر حادثه منکر برخورد شده در حالی که آثار رنگ خودروی ایشان روی سپر من وجود دارد. لطفا کارشناس رسمی میدانی اعزام کنید.',
        time: '1403/05/21 12:00'
      }
    ]
  }
];

export function loadCrmTicketsFromStorage(): CustomerTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CRM_TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TICKETS;
  }
}

export function saveCrmTicketsToStorage(tickets: CustomerTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving CRM tickets', e);
  }
}

export const INITIAL_SURVEYS: CrmSatisfactionSurvey[] = [
  {
    id: 'SRV-101',
    caseId: 'CLM-1403-7741',
    customerName: 'علی حسینی',
    customerPhone: '09121111111',
    ratingSpeed: 5,
    ratingFairness: 4,
    ratingSupport: 5,
    overallRating: 5,
    comment: 'سرعت پرداخت خسارت و عدم نیاز به مراجعه حضوری عالی بود.',
    submittedAt: '1403/05/19'
  },
  {
    id: 'SRV-102',
    caseId: 'CLM-1403-8821',
    customerName: 'مهدی کشاورز',
    customerPhone: '09123456789',
    ratingSpeed: 4,
    ratingFairness: 5,
    ratingSupport: 5,
    overallRating: 5,
    comment: 'پشتیبانی تلفنی و راهنمایی خانم معتمدی بسیار محترمانه و دقیق بود.',
    submittedAt: '1403/05/21'
  }
];

export function loadCrmSurveysFromStorage(): CrmSatisfactionSurvey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_SURVEYS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CRM_SURVEYS, JSON.stringify(INITIAL_SURVEYS));
      return INITIAL_SURVEYS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SURVEYS;
  }
}

export function saveCrmSurveysToStorage(surveys: CrmSatisfactionSurvey[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_SURVEYS, JSON.stringify(surveys));
  } catch (e) {
    console.error('Error saving CRM surveys', e);
  }
}

export const INITIAL_CRM_FOLLOW_UPS: CrmFollowUpTask[] = [
  {
    id: 'TSK-101',
    caseId: 'CLM-1403-8821',
    customerName: 'مهدی کشاورز',
    customerPhone: '09123456789',
    customerRole: 'زیان‌دیده',
    ticketId: 'TCK-1403-102',
    reason: 'بررسی مجدد تایید شماره شبا پس از اصلاح توسط کاربر و تسریع صدور حواله پایا',
    targetDepartment: 'مالی و خزانه‌داری',
    assignedAgent: 'حامد شایان',
    priority: 'مهم',
    dueDate: '1403/05/22',
    status: 'در حال پیگیری',
    notes: 'کاربر شماره شبای جدید ثبت نموده و منتظر تسویه است.',
    createdAt: '1403/05/20 11:30'
  },
  {
    id: 'TSK-102',
    caseId: 'CLM-1403-9014',
    customerName: 'سارا رضوی',
    customerPhone: '09128889900',
    customerRole: 'زیان‌دیده',
    ticketId: 'TCK-1403-103',
    reason: 'هماهنگی اعزام کارشناس رسمی میدانی جهت بررسی آثار برخورد و رفع ادعای تصادف صوری',
    targetDepartment: 'کارشناسی میدانی',
    assignedAgent: 'سپیده معتمدی',
    priority: 'فوری و بحرانی',
    dueDate: '1403/05/21',
    status: 'در انتظار انجام',
    notes: 'مقصر منکر برخورد شده و شکایت در سنهاب ثبت شده است.',
    createdAt: '1403/05/21 12:15'
  },
  {
    id: 'TSK-103',
    caseId: 'CLM-1403-7741',
    customerName: 'علی حسینی',
    customerPhone: '09121111111',
    customerRole: 'زیان‌دیده',
    reason: 'اطلاع‌رسانی وضعیت واریز خسارت به شماره شبای بانک سامان',
    targetDepartment: 'شعبه و خسارت',
    assignedAgent: 'سپیده معتمدی',
    priority: 'عادی',
    dueDate: '1403/05/20',
    status: 'تکمیل و رفع مانع',
    notes: 'واریز تایید و به کاربر پیامک ارسال شد.',
    resolution: 'تماس با مشتری برقرار شد و رضایت کامل ثبت گردید.',
    createdAt: '1403/05/19 14:00',
    completedAt: '1403/05/19 17:30'
  }
];

export function loadCrmFollowUpsFromStorage(): CrmFollowUpTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_FOLLOW_UPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CRM_FOLLOW_UPS, JSON.stringify(INITIAL_CRM_FOLLOW_UPS));
      return INITIAL_CRM_FOLLOW_UPS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CRM_FOLLOW_UPS;
  }
}

export function saveCrmFollowUpsToStorage(tasks: CrmFollowUpTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_FOLLOW_UPS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving CRM follow-ups', e);
  }
}





