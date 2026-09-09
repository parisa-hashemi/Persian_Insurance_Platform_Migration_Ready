// ----------------------------------------------------------------
// مستندسازی حقوقی اظهارات طرفین حادثه
// فایل صوتی یا تصویری به‌تنهایی وجاهت قانونی پرونده را تأمین نمی‌کند؛
// متن اظهارات باید در زمان تشکیل پرونده ثبت و با تأییدیه رسمی
// (امضای دیجیتال / کد پیامکی OTP / امضای فیزیکی) تثبیت شود.
// ----------------------------------------------------------------

import { PartyStatement, StatementConfirmationMethod } from '../types';

/** حداقل طول متن اظهارات جهت داشتن ارزش استنادی */
export const MIN_STATEMENT_LENGTH = 30;

export const STATEMENT_LEGAL_NOTICE =
  'اینجانب صحت مندرجات فوق را تأیید می‌نمایم. این متن به‌منزله اظهارات رسمی من در فرم اعلام خسارت ثبت ' +
  'می‌گردد و پس از تأیید، تغییر یک‌جانبه آن امکان‌پذیر نیست. مسئولیت حقوقی و کیفری اظهارات خلاف واقع ' +
  'بر عهده اظهارکننده است.';

export const AUDIO_NOT_SUFFICIENT_NOTICE =
  'فایل صوتی یا ویدیویی به‌تنهایی برای شرکت بیمه وجاهت قانونی ندارد و صرفاً مدرک تکمیلی محسوب می‌شود؛ ' +
  'ثبت متن اظهارات و اخذ تأییدیه رسمی الزامی است.';

export const STATEMENT_METHOD_LABELS: Record<StatementConfirmationMethod, string> = {
  OTP: 'کد تأیید پیامکی (OTP)',
  DIGITAL_SIGNATURE: 'امضای دیجیتال',
  PHYSICAL_SIGNATURE: 'امضای فیزیکی روی فرم اعلام خسارت'
};

/** تولید کد تأیید شش‌رقمی جهت امضای اظهارات */
export function generateStatementOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export interface StatementValidationResult {
  valid: boolean;
  error: string | null;
}

export function validateStatementText(text: string | undefined | null): StatementValidationResult {
  const value = (text || '').trim();
  if (!value) {
    return { valid: false, error: 'ثبت متن اظهارات نحوه وقوع حادثه الزامی است.' };
  }
  if (value.length < MIN_STATEMENT_LENGTH) {
    return {
      valid: false,
      error: `متن اظهارات باید حداقل ${MIN_STATEMENT_LENGTH} حرف و شامل شرح دقیق نحوه وقوع حادثه باشد.`
    };
  }
  return { valid: true, error: null };
}

export interface BuildStatementInput {
  party: 'PARTY_ONE' | 'PARTY_TWO';
  role: string;
  fullName: string;
  phone: string;
  nationalId?: string;
  statementText: string;
  hasAudioAttachment?: boolean;
}

/** اظهارات تأییدشده (امضاشده) — همراه با روش و زمان تأیید */
export function buildConfirmedStatement(
  input: BuildStatementInput,
  method: StatementConfirmationMethod,
  confirmationCode?: string
): PartyStatement {
  const now = new Date();
  return {
    id: `STM-${now.getTime()}-${input.party}`,
    party: input.party,
    role: input.role,
    fullName: input.fullName,
    phone: input.phone,
    nationalId: input.nationalId,
    statementText: input.statementText.trim(),
    recordedAt: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
    confirmationStatus: 'CONFIRMED',
    confirmationMethod: method,
    confirmationCode,
    confirmedAt: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
    hasAudioAttachment: !!input.hasAudioAttachment,
    legalNotice: STATEMENT_LEGAL_NOTICE
  };
}

/** درخواست اظهارات از طرف مقابل — تا زمان تأیید، وضعیت «در انتظار» است */
export function buildPendingStatementRequest(input: Omit<BuildStatementInput, 'statementText'>): PartyStatement {
  const now = new Date();
  return {
    id: `STM-${now.getTime()}-${input.party}`,
    party: input.party,
    role: input.role,
    fullName: input.fullName,
    phone: input.phone,
    nationalId: input.nationalId,
    statementText: '',
    recordedAt: `${now.toLocaleDateString('fa-IR')} - ${now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
    confirmationStatus: 'PENDING',
    confirmationMethod: null,
    hasAudioAttachment: false,
    legalNotice: STATEMENT_LEGAL_NOTICE
  };
}

/** آیا پرونده از نظر حقوقی دارای اظهارات معتبر و تأییدشده است؟ */
export function hasLegallyValidStatement(statements: PartyStatement[] | undefined): boolean {
  if (!statements || statements.length === 0) return false;
  return statements.some(
    (s) => s.confirmationStatus === 'CONFIRMED' && !!s.confirmationMethod && s.statementText.trim().length >= MIN_STATEMENT_LENGTH
  );
}
