import { ClaimCase, CustomerTicket, CustomerCallLog, CrmFollowUpTask } from '../../types';
import { RegisteredCustomer } from '../../lib/storage';

/**
 * Mask sensitive national ID for CRM display (preserving security & compliance)
 */
export function maskNationalId(nationalId?: string): string {
  if (!nationalId || nationalId.length < 8) return nationalId || 'ثبت نشده';
  const clean = nationalId.trim();
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}****${clean.slice(7)}`;
  }
  return `${clean.slice(0, 2)}***${clean.slice(-2)}`;
}

/**
 * Mask sensitive phone number for CRM display where needed
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone || phone.length < 10) return phone || '—';
  const clean = phone.trim();
  if (clean.length === 11) {
    return `${clean.slice(0, 4)}***${clean.slice(7)}`;
  }
  return clean;
}

/**
 * Mask sensitive IBAN number for CRM safe view
 */
export function maskIban(iban?: string): string {
  if (!iban) return 'ثبت نشده';
  const clean = iban.replace(/\s+/g, '');
  if (clean.length >= 24) {
    return `IR** **** **** **** **${clean.slice(-4)}`;
  }
  return clean;
}

/**
 * Format currency to Persian formatted Rials or Tomans
 */
export function formatCurrency(amount?: number | string | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '۰ ریال';
  const num = Math.round(Number(amount));
  return `${num.toLocaleString('fa-IR')} ریال`;
}

/**
 * Unified customer aggregate profile for Customer 360
 */
export interface UnifiedCustomerProfile {
  id: string;
  name: string;
  phone: string;
  nationalId?: string;
  roles: Array<'زیان‌دیده' | 'مقصر' | 'بیمه‌گذار' | 'کاربر ثبت‌نامی'>;
  relatedCases: ClaimCase[];
  relatedTickets: CustomerTicket[];
  relatedCallLogs: CustomerCallLog[];
  relatedFollowUps: CrmFollowUpTask[];
  pendingActions: Array<{
    type: 'MISSING_DOC' | 'APPROVAL_PENDING' | 'IBAN_MISSING' | 'CROQUI_PENDING' | 'VISIT_PENDING';
    title: string;
    description: string;
    caseId: string;
  }>;
  totalClaimsCount: number;
  openComplaintsCount: number;
  lastContactDate?: string;
}

/**
 * Aggregate all customers from registered users and case parties
 */
export function aggregateCustomers(
  registeredCustomers: RegisteredCustomer[],
  cases: ClaimCase[],
  tickets: CustomerTicket[],
  callLogs: CustomerCallLog[],
  followUps: CrmFollowUpTask[]
): UnifiedCustomerProfile[] {
  const customerMap = new Map<string, UnifiedCustomerProfile>();

  const getOrCreate = (phone: string, name: string, nationalId?: string): UnifiedCustomerProfile => {
    const key = phone.trim();
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        id: `CUST-${phone.slice(-6)}`,
        name: name.trim(),
        phone: phone.trim(),
        nationalId: nationalId?.trim(),
        roles: [],
        relatedCases: [],
        relatedTickets: [],
        relatedCallLogs: [],
        relatedFollowUps: [],
        pendingActions: [],
        totalClaimsCount: 0,
        openComplaintsCount: 0
      });
    }
    const cust = customerMap.get(key)!;
    if (nationalId && !cust.nationalId) cust.nationalId = nationalId.trim();
    if (name && (!cust.name || cust.name === 'کاربر' || cust.name === 'مشتری')) cust.name = name.trim();
    return cust;
  };

  // 1. Add Registered Customers
  for (const reg of registeredCustomers) {
    if (!reg.phone) continue;
    const cust = getOrCreate(reg.phone, reg.name, reg.nationalId);
    if (!cust.roles.includes('کاربر ثبت‌نامی')) {
      cust.roles.push('کاربر ثبت‌نامی');
    }
  }

  // 2. Add Parties from Cases
  for (const c of cases) {
    // Victim
    if (c.victimPhone) {
      const vCust = getOrCreate(c.victimPhone, c.victimName || 'زیان‌دیده', c.victimNationalId || c.partyOneNationalId);
      if (!vCust.roles.includes('زیان‌دیده')) vCust.roles.push('زیان‌دیده');
      if (!vCust.relatedCases.some(rc => rc.id === c.id)) {
        vCust.relatedCases.push(c);
      }

      // Check Pending Actions for Victim
      if (c.status === 'در انتظار تایید زیان‌دیده' || c.status === 'در انتظار تایید کاربر') {
        vCust.pendingActions.push({
          type: 'APPROVAL_PENDING',
          title: 'تایید مبلغ برآورد ارزیابی',
          description: 'پرونده منتظر تایید مبالغ خسارت و ثبت شماره شبا توسط زیان‌دیده است.',
          caseId: c.id
        });
      }
      if (c.status === 'در انتظار پرداخت' && (!c.payoutInfo?.iban || c.payoutInfo.verification === 'FAILED')) {
        vCust.pendingActions.push({
          type: 'IBAN_MISSING',
          title: 'ثبت و تایید شماره شبا',
          description: 'شماره شبای بانکی جهت واریز خسارت ثبت یا تایید نشده است.',
          caseId: c.id
        });
      }
      if (c.docRequests?.some(d => d.status !== 'تأیید شد' && d.status !== 'مدرک ارسال شد')) {
        vCust.pendingActions.push({
          type: 'MISSING_DOC',
          title: 'بارگذاری مدارک و عکس‌های درخواستی ارزیاب',
          description: 'ارزیاب خسارت درخواست مدارک تکمیلی یا عکس‌های جدید ثبت نموده است.',
          caseId: c.id
        });
      }
      if (c.status === 'ثبت موقت - در انتظار افزودن کروکی' || (c.hasKroki && !c.croquiData?.isValidDocument)) {
        vCust.pendingActions.push({
          type: 'CROQUI_PENDING',
          title: 'تکمیل کروکی یا بارگذاری گزارش پلیس',
          description: 'نیاز به ثبت شماره پیگیری کروکی الکترونیک یا تصویر کروکی سازشی پلیس است.',
          caseId: c.id
        });
      }
    }

    // Culprit
    if (c.culpritPhone) {
      const cCust = getOrCreate(c.culpritPhone, c.culpritName || 'مقصر حادثه', c.culpritNationalId || c.partyTwoNationalId);
      if (!cCust.roles.includes('مقصر')) cCust.roles.push('مقصر');
      if (!cCust.relatedCases.some(rc => rc.id === c.id)) {
        cCust.relatedCases.push(c);
      }

      if (c.status === 'در انتظار تایید مقصر') {
        cCust.pendingActions.push({
          type: 'APPROVAL_PENDING',
          title: 'تایید تقصیر در حادثه',
          description: 'مقصر حادثه باید جزئیات تصادف را در پنل کاربری تایید نماید.',
          caseId: c.id
        });
      }
    }
  }

  // 3. Link Tickets
  for (const t of tickets) {
    if (!t.customerPhone) continue;
    const cust = customerMap.get(t.customerPhone.trim());
    if (cust) {
      if (!cust.relatedTickets.some(rt => rt.id === t.id)) {
        cust.relatedTickets.push(t);
      }
      if (t.status !== 'بسته شده و حل گردید') {
        cust.openComplaintsCount++;
      }
    }
  }

  // 4. Link Call Logs
  for (const cl of callLogs) {
    if (!cl.contactPhone) continue;
    const cust = customerMap.get(cl.contactPhone.trim());
    if (cust) {
      if (!cust.relatedCallLogs.some(rc => rc.id === cl.id)) {
        cust.relatedCallLogs.push(cl);
      }
      if (!cust.lastContactDate || cl.callDate > cust.lastContactDate) {
        cust.lastContactDate = cl.callDate;
      }
    }
  }

  // 5. Link Follow-ups
  for (const f of followUps) {
    if (!f.customerPhone) continue;
    const cust = customerMap.get(f.customerPhone.trim());
    if (cust) {
      if (!cust.relatedFollowUps.some(rf => rf.id === f.id)) {
        cust.relatedFollowUps.push(f);
      }
    }
  }

  // Final Calculations
  for (const cust of customerMap.values()) {
    cust.totalClaimsCount = cust.relatedCases.length;
  }

  return Array.from(customerMap.values());
}

/**
 * Generate claimant-safe AI/rule-grounded case summary for CRM support agents
 */
export function generateClaimantSafeSummary(claimCase: ClaimCase): string {
  const directDamage = claimCase.assessment?.payable || claimCase.assessment?.totalAmount || 0;
  const diminution = claimCase.diminutionValue || 0;
  const salvage = claimCase.assessment?.salvage || 0;
  const policyCeiling = claimCase.culpritCoverageFinancial || 50000000;
  const total = Math.max(0, directDamage + diminution - salvage);
  const payableByInsurance = Math.min(total, policyCeiling);
  const culpritDebt = Math.max(0, total - policyCeiling);

  let statusExplanation = '';
  switch (claimCase.status) {
    case 'در انتظار تایید مقصر':
      statusExplanation = 'پرونده منتظر تایید تقصیر توسط راننده مقصر حادثه است.';
      break;
    case 'در انتظار استعلام بیمه مقصر':
      statusExplanation = 'استعلام اصالت بیمه‌نامه شخص ثالث مقصر از سامانه برخط سنهاب بیمه مرکزی در جریان است.';
      break;
    case 'در حال ارزیابی':
      statusExplanation = 'کارشناس رسمی ارزیابی خسارت در حال بررسی عکس‌ها، قیمت‌گذاری قطعات یدکی و محاسبه اجرت صافکاری و نقاشی است.';
      break;
    case 'در حال بازبینی':
      statusExplanation = 'گزارش ارزیاب به کارشناس ناظر ارشد ارجاع شده و در حال ممیزی نهایی جهت صدور ابلاغیه است.';
      break;
    case 'در انتظار تایید زیان‌دیده':
    case 'در انتظار تایید کاربر':
      statusExplanation = 'ابلاغیه رسمی خسارت صادر شده و منتظر تایید مبالغ و ثبت شماره شبا توسط زیان‌دیده محترم در پنل کاربری است.';
      break;
    case 'در انتظار پرداخت':
      if (claimCase.payoutInfo?.iban) {
        statusExplanation = `شماره شبا (${maskIban(claimCase.payoutInfo.iban)}) تایید شده و حواله تسویه پایا به مبلغ ${formatCurrency(payableByInsurance)} در صف واریز بانک مرکزی است.`;
      } else {
        statusExplanation = 'پرونده جهت صدور حواله واریز، منتظر ثبت شماره شبای بانکی به نام زیان‌دیده است.';
      }
      break;
    case 'پرداخت شده':
      statusExplanation = `خسارت به مبلغ ${formatCurrency(payableByInsurance)} به شماره شبای ثبت‌شده واریز و پرونده با موفقیت تسویه گردید.`;
      break;
    case 'در انتظار بازدید کارشناس میدانی':
      statusExplanation = 'به دلیل لزوم بررسی فیزیکی قطعات یا کروکی، بازدید کارشناس رسمی میدانی در محل هماهنگ شده است.';
      break;
    default:
      statusExplanation = `وضعیت فعلی پرونده: ${claimCase.status}`;
  }

  return `خلاصه رسمی جهت پاسخگویی به مشتری (پشتیبانی تلفنی و پیامکی):
• کد رهگیری پرونده: ${claimCase.id} | تاریخ حادثه: ${claimCase.date}
• زیان‌دیده: ${claimCase.victimName || 'نامشخص'} (خودرو: ${claimCase.carType || 'سواری'} - پلاک: ${claimCase.plate || '—'})
• شرکت بیمه‌گر مقصر: ${claimCase.culpritInsurer || 'بیمه دانا'} | سقف تعهد مالی: ${formatCurrency(policyCeiling)}
• وضعیت جاری: ${statusExplanation}
• کل مبلغ خسارت مصوب: ${formatCurrency(total)} (سهم بیمه: ${formatCurrency(payableByInsurance)}${culpritDebt > 0 ? ` | مازاد بر سقف/بدهی مقصر: ${formatCurrency(culpritDebt)}` : ''})`;
}
