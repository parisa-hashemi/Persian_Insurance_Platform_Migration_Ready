import { ClaimCase, UserSession, ThresholdProfile, DepreciationConfig, StaffMember, ExpertComplaint, AssessorNotification, PaymentOrder, PaymentBatch, CustomerCallLog, CustomerTicket, CrmSatisfactionSurvey } from '../types';
import { INITIAL_CASES, DEFAULT_THRESHOLDS, DEFAULT_DEPRECIATION_TABLES, INITIAL_EXPERTS, INITIAL_FIELD_EXPERTS, INITIAL_EXPERT_COMPLAINTS, INITIAL_FINANCE_STAFF, INITIAL_CRM_STAFF } from '../data/mockData';

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
  PAYMENT_ORDERS: 'claimflow_payment_orders',
  PAYMENT_BATCHES: 'claimflow_payment_batches',
  CRM_CALL_LOGS: 'claimflow_crm_call_logs',
  CRM_TICKETS: 'claimflow_crm_tickets',
  CRM_SURVEYS: 'claimflow_crm_surveys',
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
  } catch (e) {
    console.error('Error saving cases to storage:', e);
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
    salvageDeduction: 3500000,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 45000000,
    status: 'APPROVED_FOR_PAYMENT',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/20',
    approvedBy: 'مهرداد پاکزاد (مدیر مالی دانا)',
    financeNotes: 'تطبیق شبا با کد ملی زیان‌دیده احراز شد. آماده در صف صدور فایل پایا.',
    accountVoucherNumber: 'VCH-1403-9082'
  },
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
    grossAmount: 32000000,
    salvageDeduction: 2000000,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 30000000,
    status: 'PENDING_APPROVAL',
    paymentMethod: 'PAYA',
    issueDate: '1403/05/21',
    financeNotes: 'پرونده بازدید میدانی فاقد کروکی با تایید اصالت کارشناس رسمی.',
    accountVoucherNumber: 'VCH-1403-9083'
  },
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
    grossAmount: 72000000,
    salvageDeduction: 5000000,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 67000000,
    status: 'PAID',
    paymentMethod: 'PAYA',
    bankReferenceNumber: 'TRX-PAYA-78904512',
    issueDate: '1403/05/18',
    paidDate: '1403/05/19',
    approvedBy: 'مهرداد پاکزاد',
    paidBy: 'فرزانه شفیعی (کارشناس خزانه)',
    batchId: 'BATCH-PAYA-14030519-01',
    accountVoucherNumber: 'VCH-1403-8990'
  },
  {
    id: 'PAY-ORD-1403-0103',
    caseId: 'CLM-1403-9120',
    victimName: 'فرشاد کریمی',
    victimNationalId: '0078901234',
    victimPhone: '09351234567',
    victimIban: 'IR640560000000006677889900',
    victimBankName: 'بانک سامان',
    culpritName: 'وحید شریفی',
    culpritInsurer: 'alborz',
    grossAmount: 115000000,
    salvageDeduction: 10000000,
    taxDeduction: 0,
    franchiseDeduction: 0,
    netPayableAmount: 105000000,
    status: 'PENDING_APPROVAL',
    paymentMethod: 'SATNA',
    issueDate: '1403/05/22',
    financeNotes: 'خسارت بالای ۱۰۰ میلیون ریال - نیاز به امضای مدیر ارشد مالی و انتقال ساتنا.',
    accountVoucherNumber: 'VCH-1403-9084'
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




