export type RoleType = 'customer' | 'insurer' | 'assessor' | 'fieldexpert' | 'reviewer' | 'finance' | 'crm' | 'admin';

export type CaseStatus =
  | 'در انتظار تایید مقصر'
  | 'در انتظار تایید زیان‌دیده'
  | 'ثبت موقت - در انتظار افزودن کروکی'
  | 'در انتظار استعلام بیمه مقصر'
  | 'ارجاع شده به بیمه دانا'
  | 'ارجاع شده به شرکت بیمه'
  | 'در انتظار ارجاع به ارزیاب'
  | 'محول شده به کارشناس'
  | 'در حال ارزیابی'
  | 'در حال بازبینی'
  | 'در انتظار تایید کاربر'
  | 'در انتظار تایید ثانویه کاربر'
  | 'در حال ارزیابی سوم'
  | 'ارزیابی نهایی کاربر'
  | 'نیازمند اصلاح اطلاعات مشتری'
  | 'در انتظار مراجعه حضوری به کارشناس میدانی'
  | 'در انتظار ارجاع به کارشناس میدانی'
  | 'در انتظار بازدید کارشناس میدانی'
  | 'در انتظار پاسخ به ارزیاب'
  | 'در انتظار پرداخت'
  | 'پرداخت شده'
  | 'رد شده'
  | 'نیروی انتظامی: مقصری تعیین نشد'
  | 'تصادف ۵۰-۵۰ — پیگیری از بیمه بدنه طرفین'
  | 'تردید در اصالت تصادف'
  | (string & {});

export type PriorityLevel = 'normal' | 'high' | 'urgent';

export interface UserSession {
  id: string;
  role: RoleType;
  name: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
  company?: string;
  roleTitle?: string;
}

export interface MediaFile {
  name: string;
  type: 'image' | 'video' | 'audio';
  dataUrl: string;
  fileName?: string;
  role?: string;
}

export interface PartItem {
  name: string;
  type: 'replace' | 'repair';
  partPrice: number | string;
  repairPrice: number | string;
  salvageNeeded: boolean;
  salvageValue: number | string;
}

export interface AIDecisionLine {
  findingId: string;
  label: string;
  part: string;
  type: string;
  severity: string;
  operation: string;
  confidence: 'بالا' | 'متوسط' | 'پایین';
  explanation: string;
  decision?: 'APPROVED' | 'EDITED' | 'REJECTED';
  price?: number;
  editNote?: string;
  at?: string;
  actor?: string;
}

export interface CarDamageSpot {
  type: string;
  severity: 'none' | 'minor' | 'moderate' | 'major';
  operation?: string;
  color?: 'yellow' | 'orange' | 'red' | 'gray' | 'emerald';
  note?: string;
  updatedAt?: string;
}

export interface PoliceReport {
  code: string;
  reportNumber?: string;
  croquiType?: 'paper' | 'electronic';
  officerName: string;
  officerCode: string;
  unit: string;
  submittedAt: string;
  incidentDateTime?: string;
  location?: string;
  accidentType?: string;
  roadCondition?: string;
  briefDescription?: string;
  faultDetermination?: string;
  faultDriverName?: string;
  faultPlate?: string;
  victimDriverName?: string;
  victimPlate?: string;
  noFaultDetermined: boolean;
  description?: string;
  photos?: string[];
  videos?: MediaFile[];
  audios?: MediaFile[];
  submittedVia?: string;
  isChainAccident?: boolean;
  inquiryStatus?: string;
  inquiryDate?: string;
}

export interface HistoryEntry {
  status: string;
  time: string;
  user: string;
  userRole?: string;
  uploaderParty?: 'PARTY_ONE' | 'PARTY_TWO' | 'EXPERT' | 'FIELD_EXPERT' | 'SYSTEM' | string;
  note: string;
  actionType?: string;
}

export interface PayoutInfo {
  beneficiary: string;
  nationalId: string;
  birthDate?: string;
  iban: string;
  relationship?: string;
  verification?: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  trackingRef?: string;
  paidDate?: string;
  receiptFile?: {
    name: string;
    dataUrl: string;
    uploadedAt: string;
  };
  confirmedByInsurer?: boolean;
}

export interface AssessmentData {
  version: string;
  gross: number;
  deductions: number;
  salvage: number;
  payable: number;
  status: 'DRAFT' | 'REVIEWED' | 'SUBMITTED' | 'PUBLISHED' | 'ACCEPTED' | 'REJECTED' | 'RETURNED';
  reviewerNote?: string;
  draftSavedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  parts?: PartItem[];
  items?: any[];
  id?: string;
  caseId?: string;
  assessorId?: string;
  assessorName?: string;
  assessedAt?: string;
  totalPartsCost?: number;
  totalWageCost?: number;
  totalScrapValue?: number;
  totalAmount?: number;
  notes?: string;
  isFinalDecision?: boolean;
  fieldInspectionConfirmed?: boolean;
  authenticityVerdict?: 'CONFIRMED' | 'FRAUD_REJECTED' | 'PARTIAL_MISMATCH' | string;
  is5050?: boolean;
  faultUncoveredAmount?: number;
  insurerBaseAmount?: number;
  exceedsCeiling?: boolean;
  insurerPayablePortion?: number;
  culpritDebtAmount?: number;
  reviewStage?: number;
  reviewerReturnReason?: string;
}

export interface AdditionalDocItem {
  id: string;
  title: string;
  docType: string;
  dataUrl?: string;
  uploadedBy: string;
  uploaderRole: 'زیان‌دیده' | 'مقصر' | 'ارزیاب' | 'طرف اول' | 'طرف دوم' | string;
  uploaderParty?: 'PARTY_ONE' | 'PARTY_TWO' | 'EXPERT' | string;
  uploadedAt: string;
  note?: string;
  fileType?: 'image' | 'video' | 'pdf' | 'text' | string;
  fileName?: string;
  fileSize?: string;
  visibility?: 'SHARED' | 'EXPERT_ONLY' | 'PARTY_ONLY';
}

export interface ClaimCase {
  id: string; // CF-1234
  date: string;
  address: string;
  lat?: number | string;
  lng?: number | string;
  victimName: string;
  victimPhone: string;
  victimPlate: string;
  victimVin?: string;
  victimInsurer?: string;
  culpritName: string;
  culpritPhone: string;
  culpritPlate: string;
  culpritVin?: string;
  culpritInsurer: string;
  carType: string;
  culpritCarType?: string;
  plate: string;
  culpritPolicyNo?: string;
  culpritPolicyExpiry?: string;
  culpritCoverageFinancial?: number;
  culpritCoverageBodily?: number;
  culpritCoverageDriver?: number;
  culpritPolicyVerified?: boolean;
  victimPolicyVerified?: boolean;
  culpritFaultPercent?: number; // 100 or 50 or 0
  status: CaseStatus;
  priority?: PriorityLevel;
  pendingApprovalPhone?: string | null;
  pendingApprovalRole?: string | null;
  approved?: boolean;
  hasKroki?: boolean;
  croquiType?: 'paper' | 'electronic';
  futurePoliceExpected?: boolean | null;
  needsCulpritFieldVisit?: boolean;
  inPersonVisitAddress?: string;
  sceneReportCode?: string;
  customerKrokiPhoto?: string | null;
  customerPoliceReportFile?: string | null;
  croquiData?: CroquiData;
  writtenReport?: string;
  files?: MediaFile[];
  assignedExpert?: {
    id: string;
    name: string;
    role: string;
    phone?: string;
    nationalId?: string;
  } | null;
  assignedFieldExpert?: {
    id: string;
    name: string;
    role: string;
    phone?: string;
    nationalId?: string;
    company?: string;
  } | null;
  assignedReviewer?: {
    id: string;
    name: string;
    role: string;
    phone?: string;
    nationalId?: string;
    company?: string;
  } | null;
  expertAcceptance?: 'now' | 'later' | null;
  acceptedByExpertAt?: string;
  expertRejected?: {
    by: string;
    at: string;
    reason: string;
  } | null;
  previousAssignedExpert?: {
    id: string;
    name: string;
    role: string;
  } | null;
  previousAssessorIds?: string[];
  rejectedByAssessorIds?: string[];
  assignedAt?: string;
  assignedTimestamp?: number;
  autoReturnedDueToTimeout?: boolean;
  autoReturnedAt?: string;
  timedOutExpert?: {
    id: string;
    name: string;
    phone?: string;
  } | null;
  insurerInstruction?: string;
  insurerAssignmentNote?: string;
  insurerFieldExpertNote?: string;
  insurerNoteAuthor?: string;
  insurerNoteDate?: string;
  assessment?: AssessmentData;
  carDamageSpots?: Record<string, CarDamageSpot>;
  aiDecisions?: AIDecisionLine[];
  aiAnalysis?: {
    difficulty: 'ساده' | 'متوسط' | 'پیچیده';
    docs: string;
    marketMin: number;
    marketMax: number;
    fraudSuspect: boolean;
    fraudReasons: string[];
    at: string;
    parts: Array<{
      name: string;
      type: string;
      min: number;
      max: number;
      source: string;
      entered: number;
      within: boolean | null;
    }>;
  };
  decisionState?: 'NOT_PUBLISHED' | 'PUBLISHED' | 'VIEWED' | 'ACCEPTED' | 'OBJECTED' | 'EXPIRED' | 'SUPERSEDED';
  payoutState?: 'NOT_APPLICABLE' | 'INFO_PENDING' | 'VALIDATION_PENDING' | 'EXCEPTION' | 'READY' | 'SUBMISSION_PENDING' | 'SUBMITTED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'RETURNED' | 'CANCELLED';
  payoutInfo?: PayoutInfo;
  payoutInstruction?: {
    amount: number;
    assessmentVersion: string;
    createdAt: string;
    createdBy?: string;
  };
  acceptance?: {
    assessmentVersion: string;
    amount: number;
    consentTextVersion: string;
    acceptedAt: string;
    method: string;
  };
  fraudFlag?: {
    flagged: boolean;
    auto?: boolean;
    reason?: string;
    flaggedAt?: string;
    by?: string;
  };
  centralComplaint?: {
    subject: string;
    description: string;
    submittedAt: string;
    by: string;
    status: string;
  };
  authenticityDispute?: {
    disputedBy: string;
    role: string;
    reason: string;
    description: string;
    submittedAt: string;
    evidencePhotos?: string[];
  };
  victimRating?: {
    stars: number;
    comment?: string;
    submittedAt: string;
    by: string;
  };
  culpritRating?: {
    stars: number;
    comment?: string;
    submittedAt: string;
    by: string;
  };
  additionalDocs?: AdditionalDocItem[];
  correctionRequest?: {
    reason: string;
    requestedAt: string;
    requestedBy: string;
  } | null;
  customerCorrection?: {
    note: string;
    correctedAt: string;
    correctedBy: string;
  };
  correctionChat?: Array<{
    sender: 'customer' | 'police' | 'expert';
    text: string;
    time: string;
  }>;
  correctionChatUnreadForCustomer?: boolean;
  correctionChatUnreadForPolice?: boolean;
  docRequests?: Array<{
    id: number | string;
    target?: string;
    recipientParty?: 'PARTY_ONE' | 'PARTY_TWO';
    recipientRole?: string;
    docType: string;
    customDocType?: string;
    description?: string;
    requestedAt: string;
    requestedBy: string;
    status: 'درخواست ارسال شد' | 'در انتظار پاسخ' | 'مدرک ارسال شد' | 'در حال بررسی' | 'تأیید شد' | 'نیاز به مدرک مجدد' | 'pending' | 'answered' | string;
    expertNote?: string;
  }>;
  docChat?: Array<{
    id?: string;
    from?: 'expert' | 'customer';
    senderParty?: 'PARTY_ONE' | 'PARTY_TWO' | 'EXPERT';
    targetParty?: 'PARTY_ONE' | 'PARTY_TWO';
    by?: string;
    senderName?: string;
    target?: string;
    docType?: string;
    text?: string;
    files?: MediaFile[] | string[];
    at: string;
  }>;
  policeReport?: PoliceReport | null;
  chainCode?: string;
  chainIndex?: number;
  chainTotal?: number;
  chainCaseIds?: string[];
  isBodily?: boolean;
  bodilyClaimId?: string;
  parentCaseId?: string;
  bodilyFaultPercent?: number;
  history?: HistoryEntry[];
  createdAt?: string;
  awaitingSince?: string;
  culpritAccepted?: boolean;
  victimAccepted?: boolean;
  fieldVisitKind?: 'initial' | 'final-appeal';
  fieldExpertFinal?: boolean;
  fieldVisitStarted?: boolean;
  fieldExpertVerdict?: 'CONFIRMED' | 'FRAUD_REJECTED' | 'PARTIAL_MISMATCH';
  fieldExpertReportNote?: string;
  carModel?: string;
  plateNumber?: string;
  accidentLocation?: string;
  impactCoordinates?: Array<{ x: number; y: number; part: string }>;
  fieldExpertVisit?: {
    name: string;
    at: string;
    note: string;
  };
  fieldExpertDraft?: {
    gross: string;
    deductions: string;
    salvage: string;
    note: string;
    photos: MediaFile[];
    videos: MediaFile[];
    savedAt: string;
    savedBy: string;
  };
  reviewerApproval?: {
    approved: boolean;
    approvedBy: string;
    approvedAt: string;
    note?: string;
  };
  reviewerReturn?: {
    reason: string;
    returnedBy: string;
    returnedAt: string;
  };
  isFinalDecision?: boolean;
  assessments?: Array<{
    round: string;
    roundIdx: number;
    expertName: string;
    submittedAt: string;
    assignedAt?: string;
    accidentDate?: string;
    gross: number;
    salvage?: number;
    deductions?: number;
    withSalvage?: number;
    withoutSalvage?: number;
    paid?: number;
    payable: number;
    reviewerNote?: string;
    parts?: PartItem[];
    aiDecisions?: AIDecisionLine[];
    status: string;
    approvedByReviewer?: boolean;
    approvedAt?: string;
  }>;
  reassessReason?: string;
  reassessType?: string;
  thirdAssessmentActive?: boolean;
  objectionStage?: number; // 0: None, 1: First Objection, 2: Second Objection (Chat with Expert 2), 3: Third Objection (Workshop Info), 4: Field Visit / Branch Visit
  objectionChat?: Array<{
    sender: 'customer' | 'expert' | 'system';
    name: string;
    text: string;
    files?: string[];
    time: string;
  }>;
  workshopInfo?: {
    province: string;
    city: string;
    shopName: string;
    shopPhone: string;
    shopAddress?: string;
    submittedAt: string;
  };
  secondaryObjection?: {
    type: 'ارزیاب مستقل' | 'تعمیرگاه';
    fee?: number;
    paidAt?: string;
    province?: string;
    city?: string;
    shopName?: string;
    shopPhone?: string;
    shopAddress?: string;
  };
  partyOneName?: string;
  partyOnePhone?: string;
  partyOneNationalId?: string;
  partyOneRole?: 'زیان‌دیده' | 'مقصر' | string;
  partyTwoName?: string;
  partyTwoPhone?: string;
  partyTwoNationalId?: string;
  partyTwoRole?: 'زیان‌دیده' | 'مقصر' | string;
  victimNationalId?: string;
  culpritNationalId?: string;
  isSharedCase?: boolean;
  partyComments?: Array<{
    id: string;
    authorName: string;
    authorRole: string;
    party: 'PARTY_ONE' | 'PARTY_TWO' | 'EXPERT';
    text: string;
    createdAt: string;
    files?: MediaFile[];
  }>;
  diminutionValue?: number;
  diminutionPercent?: number;
  diminutionReason?: string;
  franchiseAmount?: number;
  franchisePercent?: number;
  policyCeilingFinancial?: number;
  insurerPayableAmount?: number;
  culpritDebtAmount?: number;
  exceedsPolicyCeiling?: boolean;
  policyInquirySanhab?: {
    code: string;
    date: string;
    status: string;
    ceiling: number;
    conventionalVehicle?: boolean;
  };
  smsDispatchLogs?: Array<{
    id: string;
    recipientType: 'VICTIM' | 'CULPRIT';
    recipientName: string;
    phone: string;
    text: string;
    sentAt: string;
    status: 'DELIVERED' | 'SENT' | 'FAILED';
  }>;
}

export interface InsurerInfo {
  code: string;
  name: string;
  defaultPassword: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  nationalId?: string;
  active?: boolean;
  company?: string;
}

export interface ThresholdProfile {
  minConfidence: number;
  fraudSensitivity: 'کم' | 'متوسط' | 'زیاد';
  fastTrackCeiling: number;
}

export interface DepreciationConfig {
  y1: number;
  y2: number;
  y3: number;
  y5: number;
}

export interface ExpertComplaint {
  id: string;
  expertId: string;
  expertName: string;
  caseId?: string;
  complainantName: string;
  complainantRole: 'زیان‌دیده' | 'مقصر' | 'تعمیرگاه' | 'مدیر بیمه';
  reasonCategory: 'مبلغ برآورد ناچیز' | 'تأخیر در پاسخگویی' | 'عدم بررسی دقیق قطعات' | 'برخورد نامناسب' | 'سایر';
  description: string;
  filedAt: string;
  status: 'در حال بررسی' | 'تایید شده (ثبت در پرونده)' | 'مردود';
  impactPoints: number;
}

export type DriverRole = 'victim' | 'at_fault';

export interface DriverInfo {
  fullName: string;
  nationalId: string;
  plateNumber: string;
  insurancePolicyNumber: string;
}

export interface CroquiData {
  croquiType: 'paper' | 'electronic';
  fileUrl?: string;
  isValidDocument: boolean;
  confidenceScore: number;
  rejectionReason?: string;
  reportNumber: string;
  incidentDate: string;
  location: string;
  accidentType?: string;
  roadCondition?: string;
  briefDescription?: string;
  faultDetermination?: string;
  faultDriver: DriverInfo;
  victimDriver: DriverInfo;
  policeBadgeId: string;
  officerName?: string;
  policeUnit?: string;
  hasOfficialStamp: boolean;
  declaredRoleMatches: boolean;
  discrepancyNotes?: string | null;
  recommendedNextStep: 'PROCEED_TO_DAMAGE_PHOTOS' | 'REQUIRE_MANUAL_REVIEW' | 'REUPLOAD_CROQUI';
  rawEvaluationJSON?: any;
  inquiryStatus?: string;
  inquiryDate?: string;
}

export interface AssessorNotification {
  id: string;
  type: 'SMS' | 'SYSTEM' | 'WARNING' | 'TIMEOUT_ALERT' | 'REASSIGNMENT';
  caseId: string;
  expertId: string;
  recipientPhone?: string;
  senderPhone?: string;
  title: string;
  message: string;
  sentAt: string;
  date?: string;
  time?: string;
  read?: boolean;
  penaltyPoints?: number;
}

// ----------------------------------------------------
// FINANCIAL & TREASURY DISBURSEMENT TYPES
// ----------------------------------------------------
export interface PaymentOrder {
  id: string;
  caseId: string;
  victimName: string;
  victimNationalId?: string;
  victimPhone?: string;
  victimIban: string;
  victimBankName?: string;
  culpritName?: string;
  culpritInsurer: string;
  grossAmount: number;
  diminutionAmount?: number;
  salvageDeduction: number;
  taxDeduction: number;
  franchiseDeduction: number;
  policyCeiling?: number;
  culpritDebtAmount?: number;
  exceedsPolicyCeiling?: boolean;
  netPayableAmount: number;
  status: 'PENDING_APPROVAL' | 'APPROVED_FOR_PAYMENT' | 'PAID' | 'REJECTED' | 'HELD';
  paymentMethod?: 'PAYA' | 'SATNA' | 'INSTANT_CARD' | 'CHEQUE';
  bankReferenceNumber?: string;
  issueDate: string;
  paidDate?: string;
  approvedBy?: string;
  paidBy?: string;
  rejectionReason?: string;
  financeNotes?: string;
  batchId?: string;
  accountVoucherNumber?: string;
}

export interface PaymentBatch {
  id: string;
  batchTitle: string;
  createdAt: string;
  totalOrders: number;
  totalAmount: number;
  bankFormat: 'PAYA_STANDARD' | 'SATNA_BULK' | 'MELLAT_PORTAL' | 'TEJARAT_IBAN' | 'MELLI_BAM';
  status: 'GENERATED' | 'UPLOADED_TO_BANK' | 'EXECUTED_SETTLED';
  orders: PaymentOrder[];
  downloadFileName?: string;
}

// ----------------------------------------------------
// CRM, SUPPORT & CUSTOMER COMPLAINTS MANAGEMENT
// ----------------------------------------------------
export interface CustomerCallLog {
  id: string;
  caseId?: string;
  contactName: string;
  contactPhone: string;
  contactRole: 'زیان‌دیده' | 'مقصر حادثه' | 'بیمه‌گذار' | 'کارشناس میدانی' | 'شخص ثالث';
  callDirection: 'ورودی (تماس مشتری)' | 'خروجی (تماس کارشناس)';
  topic: 'پیگیری واریز خسارت' | 'نقص مدارک و عکس‌ها' | 'اعتراض به ارزیابی خسارت' | 'هماهنگی کارشناس میدانی' | 'استعلام اصالت کروکی' | 'سوال عمومی و مشاوره' | 'سایر';
  sentiment: 'آرام و راضی' | 'نیازمند راهنمایی' | 'نگران و عجول' | 'ناراضی و شاکی' | 'فوری و بحرانی';
  durationMinutes: number;
  notes: string;
  agentName: string;
  agentId: string;
  callDate: string;
  callTime: string;
  followUpRequired: boolean;
  followUpDate?: string;
  resolvedInCall: boolean;
}

export interface CustomerTicket {
  id: string;
  caseId?: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerRole: 'زیان‌دیده' | 'مقصر' | 'بیمه‌گذار';
  category: 'شکایت از مبلغ ارزیابی' | 'تاخیر در پرداخت خسارت' | 'اعتراض به کروکی و مقصر' | 'مشکل بارگذاری مدارک' | 'تغییر شماره شبا' | 'سوالات عمومی';
  priority: 'عادی' | 'مهم' | 'فوری' | 'بحرانی (شکایت رسمی بیمه مرکزی)';
  status: 'در انتظار پاسخ' | 'در حال پیگیری' | 'پاسخ داده شده' | 'ارجاع به ارزیاب ارشد' | 'بسته شده و حل گردید';
  subject: string;
  createdAt: string;
  lastUpdate: string;
  assignedAgent?: string;
  messages: Array<{
    id: string;
    sender: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
    senderName: string;
    senderRole?: string;
    text: string;
    time: string;
    attachmentUrl?: string;
  }>;
}

export interface CrmSatisfactionSurvey {
  id: string;
  caseId: string;
  customerName: string;
  customerPhone: string;
  ratingSpeed: number; // 1 to 5
  ratingFairness: number; // 1 to 5
  ratingSupport: number; // 1 to 5
  overallRating: number; // 1 to 5
  comment?: string;
  submittedAt: string;
}

