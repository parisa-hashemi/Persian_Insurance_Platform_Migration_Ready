import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText,
  CreditCard,
  AlertTriangle,
  Upload,
  Send,
  MessageSquare,
  Camera,
  Image as ImageIcon,
  Eye,
  Plus,
  Paperclip,
  UserCheck,
  FilePlus,
  Video,
  Trash2,
  Lock,
  Shield,
  ShieldCheck,
  Users,
  Filter,
  CheckSquare,
  Star,
  ShieldAlert,
  MapPin,
  X,
  Sparkles,
  Banknote,
  ExternalLink,
  FileCheck,
  Maximize2,
  Phone,
  Calendar,
  Car,
  FileSpreadsheet,
  DollarSign,
  Info,
  PhoneCall,
  MessageSquarePlus,
  Headphones
} from 'lucide-react';
import { ClaimCase, UserSession, CaseStatus, AdditionalDocItem, ExpertComplaint, CustomerTicket, PaymentOrder } from '../../types';
import { formatCurrency, parseMoneyNumber, getInsurerPersianName, loadComplaintsFromStorage, saveComplaintsToStorage, loadCrmTicketsFromStorage, saveCrmTicketsToStorage, loadPaymentOrdersFromStorage, savePaymentOrdersToStorage } from '../../lib/storage';
import { compressImageFile } from '../../lib/imageCompressor';
import { calculateClaimDamageWithPolicyLimits, performPolicySanhabInquiry } from '../../lib/policyLimitCalculator';
import { Car3DViewer } from '../Car3DViewer';
import { CustomerTicketModal } from './CustomerTicketModal';
import { CustomerTicketsSection } from './CustomerTicketsSection';
import { CustomerExpertCallModal } from './CustomerExpertCallModal';

// Helper to detect Iranian bank name from IBAN (Sheba) code
export const getBankNameFromIban = (ibanStr: string): string => {
  const clean = ibanStr.replace(/\s+/g, '').toUpperCase();
  if (clean.length < 6) return 'بانک مقصد';
  const code = clean.substring(4, 7);
  const bankMap: Record<string, string> = {
    '010': 'بانک مرکزی',
    '011': 'بانک صنعت و معدن',
    '012': 'بانک ملت',
    '013': 'بانک رفاه کارگران',
    '014': 'بانک مسکن',
    '015': 'بانک سپه',
    '016': 'بانک کشاورزی',
    '017': 'بانک ملی ایران',
    '018': 'بانک تجارت',
    '019': 'بانک صادرات ایران',
    '020': 'بانک توسعه صادرات',
    '021': 'پست بانک ایران',
    '022': 'بانک توسعه تعاون',
    '051': 'موسسه اعتباری توسعه',
    '053': 'بانک کارآفرین',
    '054': 'بانک پارسیان',
    '055': 'بانک اقتصاد نوین',
    '056': 'بانک سامان',
    '057': 'بانک پاسارگاد',
    '058': 'بانک سرمایه',
    '059': 'بانک سینا',
    '060': 'بانک قرض الحسنه مهر ایران',
    '061': 'بانک شهر',
    '062': 'بانک آینده',
    '063': 'بانک انصار',
    '064': 'بانک گردشگری',
    '065': 'بانک حکمت ایرانیان',
    '066': 'بانک دی',
    '069': 'بانک ایران زمین',
    '070': 'بانک قرض الحسنه رسالت'
  };
  return bankMap[code] || 'شبکه بانکی کشور';
};

interface CustomerCaseDetailProps {
  session: UserSession;
  claimCase: ClaimCase;
  onBack: () => void;
  onUpdateCase: (updatedCase: ClaimCase) => void;
}

export const CustomerCaseDetail: React.FC<CustomerCaseDetailProps> = ({
  session,
  claimCase,
  onBack,
  onUpdateCase
}) => {
  const [iban, setIban] = useState(claimCase.payoutInfo?.iban || '');
  const [nationalId, setNationalId] = useState(claimCase.payoutInfo?.nationalId || '');
  const [beneficiary, setBeneficiary] = useState(
    claimCase.payoutInfo?.beneficiary || claimCase.victimName || ''
  );
  const [showBankForm, setShowForm] = useState(false);
  const [selectedAssessmentModal, setSelectedAssessmentModal] = useState<any | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'2d_model' | 'report_technical' | 'parts_table' | 'photos_gallery' | 'financial'>('2d_model');
  const [showCard2DModel, setShowCard2DModel] = useState(false);
  const [inlineFieldTab, setInlineFieldTab] = useState<'2d_model' | 'photos' | 'report' | 'parts' | 'branch_sms'>('2d_model');

  // Bank Info & Finance Forwarding Success Modal state
  const [bankSuccessModal, setBankSuccessModal] = useState<{
    isOpen: boolean;
    caseId?: string;
    beneficiary?: string;
    nationalId?: string;
    iban?: string;
    bankName?: string;
    payableAmount?: number;
    trackingCode?: string;
    submittedAt?: string;
    insurerName?: string;
  } | null>(null);

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeSubject, setDisputeSubject] = useState('مبلغ ارزیابی نامتناسب');
  const [disputeDesc, setDisputeDesc] = useState('');

  // Rating state
  const [ratingStars, setRatingStars] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');

  // Kroki submission state for temporary cases
  const [krokiInputCode, setKrokiInputCode] = useState(claimCase.sceneReportCode || '');
  const [krokiSuccessMsg, setKrokiSuccessMsg] = useState<string | null>(null);

  const handleAddKrokiCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!krokiInputCode.trim()) return;

    const targetInsurer = getInsurerPersianName(claimCase.culpritInsurer);
    const updatedStatus: CaseStatus = 'در انتظار ارجاع به ارزیاب';

    const updated: ClaimCase = {
      ...claimCase,
      status: updatedStatus,
      hasKroki: true,
      sceneReportCode: krokiInputCode.trim(),
      futurePoliceExpected: false,
      history: [
        ...(claimCase.history || []),
        {
          status: updatedStatus,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'مشتری',
          note: `ورود کد کروکی (${krokiInputCode.trim()}) توسط مشتری؛ پرونده از حالت ثبت موقت خارج و جهت ارزیابی به ${targetInsurer} ارجاع گردید.`
        }
      ]
    };

    onUpdateCase(updated);
    setKrokiSuccessMsg(`کد کروکی با موفقیت ثبت شد و پرونده به ${targetInsurer} ارجاع داده گردید.`);
  };

  // Accurate role resolution for logged-in customer in CustomerCaseDetail
  const userPhone = session.phone || '';
  const userName = session.name || '';

  let isPartyOne = false;
  let isPartyTwo = false;

  if (claimCase.partyTwoPhone && userPhone && claimCase.partyTwoPhone === userPhone) {
    isPartyTwo = true;
  } else if (claimCase.partyOnePhone && userPhone && claimCase.partyOnePhone === userPhone) {
    isPartyOne = true;
  } else if (claimCase.partyOneRole === 'مقصر') {
    if (claimCase.culpritPhone && userPhone && claimCase.culpritPhone === userPhone) {
      isPartyOne = true;
    } else if (claimCase.victimPhone && userPhone && claimCase.victimPhone === userPhone) {
      isPartyTwo = true;
    } else if (userName && claimCase.culpritName?.includes(userName)) {
      isPartyOne = true;
    } else if (userName && claimCase.victimName?.includes(userName)) {
      isPartyTwo = true;
    } else {
      isPartyOne = true;
    }
  } else {
    // partyOneRole is 'زیان‌دیده' (default)
    if (claimCase.victimPhone && userPhone && claimCase.victimPhone === userPhone) {
      isPartyOne = true;
    } else if (claimCase.culpritPhone && userPhone && claimCase.culpritPhone === userPhone) {
      isPartyTwo = true;
    } else if (userName && claimCase.victimName?.includes(userName)) {
      isPartyOne = true;
    } else if (userName && claimCase.culpritName?.includes(userName)) {
      isPartyTwo = true;
    } else {
      isPartyOne = true;
    }
  }

  const partyOneRole = claimCase.partyOneRole || 'زیان‌دیده';
  const partyTwoRole = claimCase.partyTwoRole || (partyOneRole === 'مقصر' ? 'زیان‌دیده' : 'مقصر');

  const isBodyClaim = Boolean(claimCase.isBodyClaim || claimCase.isBodily || claimCase.id?.startsWith('BD-'));
  const userRole: 'زیان‌دیده' | 'مقصر' = isPartyOne ? partyOneRole : partyTwoRole;
  const isVictim = isBodyClaim ? true : (userRole === 'زیان‌دیده');
  const isCulprit = isBodyClaim ? false : (userRole === 'مقصر');

  // Assessment completion state flags
  const isFieldAssessmentCompleted = Boolean(
    claimCase.fieldExpertVerdict ||
    claimCase.fieldExpertFinal ||
    claimCase.fieldExpertReportNote ||
    claimCase.fieldExpertCompletedAt ||
    (claimCase.assessment && (claimCase.assessment.fieldInspectionConfirmed || claimCase.assessment.assessorId?.startsWith('fed')))
  );

  const isDeskAssessmentCompleted = Boolean(
    (claimCase.assessments && claimCase.assessments.length > 0 && claimCase.assessments.some(a => a.status === 'PUBLISHED' || a.status === 'REVIEWED' || a.status === 'ACCEPTED' || a.approvedByReviewer || a.status?.includes('مورد اعتراض') || a.status === 'در انتظار تایید کاربر' || a.status === 'در انتظار تایید زیان‌دیده' || claimCase.status === 'در انتظار تایید کاربر' || claimCase.status === 'در انتظار تایید زیان‌دیده' || claimCase.status === 'در انتظار پرداخت' || claimCase.status === 'پرداخت شده')) ||
    (claimCase.assessment && claimCase.assessment.status !== 'DRAFT' && claimCase.assessment.status !== 'REJECTED' && (claimCase.assessment.status === 'PUBLISHED' || claimCase.assessment.status === 'REVIEWED' || claimCase.assessment.status === 'ACCEPTED' || claimCase.approvedByReviewer || claimCase.status === 'در انتظار تایید کاربر' || claimCase.status === 'در انتظار تایید زیان‌دیده' || claimCase.status === 'در انتظار پرداخت' || claimCase.status === 'پرداخت شده'))
  );

  const hasAnyCompletedAssessment = isFieldAssessmentCompleted || isDeskAssessmentCompleted;

  const isWaitingForNewAssessment = Boolean(
    claimCase.status === 'در انتظار ارجاع به ارزیاب مجدد' ||
    claimCase.status === 'در حال ارزیابی' ||
    claimCase.status === 'در انتظار ارزیابی' ||
    claimCase.status === 'در انتظار بررسی بازبین' ||
    claimCase.status === 'در حال بررسی اطلاعات تعمیرگاه توسط ارزیاب' ||
    claimCase.status === 'در انتظار ارجاع به کارشناس میدانی' ||
    claimCase.status === 'در انتظار بازدید کارشناس میدانی' ||
    claimCase.status === 'در حال بازدید کارشناس میدانی' ||
    claimCase.status === 'تردید در اصالت تصادف' ||
    claimCase.status === 'محول شده به کارشناس'
  );

  const isP1Culprit = partyOneRole === 'مقصر';
  const p1DisplayName = claimCase.partyOneName || (isP1Culprit ? claimCase.culpritName : claimCase.victimName) || 'ایجادکننده پرونده';
  const p1DisplayPhone = claimCase.partyOnePhone || (isP1Culprit ? claimCase.culpritPhone : claimCase.victimPhone) || '';
  const p1DisplayNationalId = claimCase.partyOneNationalId || (isP1Culprit ? claimCase.culpritNationalId : claimCase.victimNationalId) || (isPartyOne ? session.nationalId : '') || '';
  const p1DisplayPlate = isP1Culprit ? (claimCase.culpritPlate || claimCase.plate) : (claimCase.victimPlate || claimCase.plate);
  const p1DisplayCarType = isP1Culprit ? (claimCase.culpritCarType || claimCase.carType) : (claimCase.carType || claimCase.culpritCarType);

  const p2DisplayName = claimCase.partyTwoName || (isP1Culprit ? claimCase.victimName : claimCase.culpritName) || 'طرف مقابل';
  const p2DisplayPhone = claimCase.partyTwoPhone || (isP1Culprit ? claimCase.victimPhone : claimCase.culpritPhone) || '';
  const p2DisplayNationalId = claimCase.partyTwoNationalId || (isP1Culprit ? claimCase.victimNationalId : claimCase.culpritNationalId) || (isPartyTwo ? session.nationalId : '') || '';
  const p2DisplayPlate = isP1Culprit ? (claimCase.victimPlate || claimCase.plate) : (claimCase.culpritPlate || claimCase.plate);
  const p2DisplayCarType = isP1Culprit ? (claimCase.carType || claimCase.culpritCarType) : (claimCase.culpritCarType || claimCase.carType);

  const myPartyKey: 'PARTY_ONE' | 'PARTY_TWO' = isPartyOne ? 'PARTY_ONE' : 'PARTY_TWO';
  const myRoleLabel = isPartyOne
    ? `طرف اول (${partyOneRole})`
    : `طرف دوم (${partyTwoRole})`;

  const pendingDocRequests = (claimCase.docRequests || []).filter(req => {
    const isPendingStatus = req.status === 'pending' || req.status === 'در انتظار پاسخ' || req.status === 'درخواست ارسال شد' || req.status === 'نیاز به مدرک مجدد';
    if (!isPendingStatus) return false;

    if (req.recipientParty) {
      return req.recipientParty === myPartyKey;
    }
    return req.target === 'هر دو' || req.target === userRole;
  });
  const activeDocReq = pendingDocRequests[0];

  const myDocChat = (claimCase.docChat || []).filter(c => {
    if (c.targetParty || c.senderParty) {
      return c.targetParty === myPartyKey || c.senderParty === myPartyKey;
    }
    return c.target === 'هر دو' || c.target === userRole;
  });

  // CRM Ticket & Support State
  const [showCrmTicketModal, setShowCrmTicketModal] = useState(false);
  const [showExpertCallModal, setShowExpertCallModal] = useState(false);
  const [ticketToastMsg, setTicketToastMsg] = useState<string | null>(null);

  // Customer Complaint Against Expert State
  const [showExpertComplaintModal, setShowExpertComplaintModal] = useState(false);
  const [expertComplaintReason, setExpertComplaintReason] = useState<'مبلغ برآورد ناچیز' | 'تأخیر در پاسخگویی' | 'عدم بررسی دقیق قطعات' | 'برخورد نامناسب' | 'سایر'>('مبلغ برآورد ناچیز');
  const [expertComplaintDesc, setExpertComplaintDesc] = useState('');
  const [expertComplaintSuccessMsg, setExpertComplaintSuccessMsg] = useState<string | null>(null);

  // Direct Customer Chat with Expert State
  const [customerChatText, setCustomerChatText] = useState('');
  const [customerChatFile, setCustomerChatFile] = useState<{
    name: string;
    size: string;
    type: 'image' | 'video' | 'pdf' | 'doc';
    dataUrl: string;
  } | null>(null);

  const handleCustomerChatFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      let fType: 'image' | 'video' | 'audio' | 'pdf' | 'doc' = 'image';
      if (file.type.startsWith('video/')) fType = 'video';
      else if (file.type.startsWith('audio/')) fType = 'audio';
      else if (file.type.includes('pdf')) fType = 'pdf';
      else if (file.type.includes('word') || file.type.includes('document')) fType = 'doc';

      const dataUrl = await compressImageFile(file, 1000, 0.7);
      setCustomerChatFile({
        name: file.name,
        size: `${sizeMB} MB`,
        type: fType,
        dataUrl
      });
    }
  };

  const handleSendCustomerChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerChatText.trim() && !customerChatFile) return;

    const uploaderParty: 'PARTY_ONE' | 'PARTY_TWO' = isPartyOne ? 'PARTY_ONE' : 'PARTY_TWO';
    const uploaderRoleStr = isPartyOne
      ? `طرف اول (${claimCase.partyOneRole || 'زیان‌دیده'})`
      : `طرف دوم (${claimCase.partyTwoRole || 'مقصر'})`;
    const uploaderName = session.name || (isPartyOne ? claimCase.victimName : claimCase.culpritName) || 'کاربر';

    const newChatMsg = {
      id: `MSG-${Date.now()}`,
      from: 'customer' as const,
      senderParty: uploaderParty,
      targetParty: 'EXPERT' as const,
      by: uploaderName,
      senderName: uploaderName,
      text: customerChatText.trim(),
      files: customerChatFile ? [{
        id: `FILE-${Date.now()}`,
        title: customerChatFile.name,
        fileName: customerChatFile.name,
        fileSize: customerChatFile.size,
        fileType: customerChatFile.type,
        dataUrl: customerChatFile.dataUrl,
        uploadedAt: new Date().toLocaleDateString('fa-IR'),
        uploadedBy: uploaderName
      }] : [],
      at: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    let updatedDocs = claimCase.additionalDocs || [];
    if (customerChatFile) {
      const newDocItem: AdditionalDocItem = {
        id: `DOC-${Date.now()}`,
        title: customerChatFile.name,
        docType: 'مدرک/پاسخ چت اختصاصی',
        fileType: customerChatFile.type,
        fileName: customerChatFile.name,
        fileSize: customerChatFile.size,
        dataUrl: customerChatFile.dataUrl,
        uploadedBy: uploaderName,
        uploaderRole: uploaderRoleStr,
        uploaderParty: uploaderParty,
        uploadedAt: new Date().toLocaleString('fa-IR'),
        visibility: 'SHARED'
      };
      updatedDocs = [...updatedDocs, newDocItem];
    }

    const updatedCase: ClaimCase = {
      ...claimCase,
      additionalDocs: updatedDocs,
      docChat: [...(claimCase.docChat || []), newChatMsg],
      history: [
        ...(claimCase.history || []),
        {
          status: claimCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: uploaderName,
          note: `ارسال پیام چت به کارشناس توسط ${uploaderRoleStr}`
        }
      ]
    };

    onUpdateCase(updatedCase);
    setCustomerChatText('');
    setCustomerChatFile(null);
  };

  // Multi-Stage Objection Modals & Form State
  const [showObjection1Modal, setShowObjection1Modal] = useState(false);
  const [objection1Reason, setObjection1Reason] = useState('');

  const [showObjection2Modal, setShowObjection2Modal] = useState(false);
  const [objection2Reason, setObjection2Reason] = useState('');

  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [workshopProvince, setWorkshopProvince] = useState('تهران');
  const [workshopCity, setWorkshopCity] = useState('تهران');
  const [workshopName, setWorkshopName] = useState('');
  const [workshopPhone, setWorkshopPhone] = useState('');
  const [workshopAddress, setWorkshopAddress] = useState('');

  const [showFieldVisitModal, setShowFieldVisitModal] = useState(false);
  const [fieldVisitType, setFieldVisitType] = useState<'FIELD_VISIT' | 'BRANCH_VISIT'>('FIELD_VISIT');
  const [fieldVisitAddress, setFieldVisitAddress] = useState(claimCase.accidentLocation || 'تهران');
  const [fieldVisitContactPhone, setFieldVisitContactPhone] = useState(claimCase.victimPhone || session.phone || '');
  const [fieldVisitReason, setFieldVisitReason] = useState('');
  const [fieldVisitSuccessToast, setFieldVisitSuccessToast] = useState(false);

  const [chatMessageInput, setChatMessageInput] = useState('');

  // Handle Stage 1 Objection (Forces Insurance to reassign to a DIFFERENT assessor #2)
  const handleObjectionStage1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objection1Reason.trim()) return;

    const currentAssessorId = claimCase.assignedExpert?.id;
    const currentAssessorName = claimCase.assignedExpert?.name || claimCase.assessment?.submittedBy || 'ارزیاب اول';
    const updatedPrev = Array.from(new Set([
      ...(claimCase.previousAssessorIds || []),
      ...(currentAssessorId ? [currentAssessorId] : []),
      ...(claimCase.rejectedByAssessorIds || [])
    ]));

    // Preserve previous assessment in assessments history array
    const existingAssessments = claimCase.assessments || [];
    let updatedAssessments = [...existingAssessments];
    if (claimCase.assessment && !updatedAssessments.some(a => a.gross === claimCase.assessment?.gross && a.payable === claimCase.assessment?.payable)) {
      updatedAssessments.push({
        round: 'ارزیابی اول (کارشناس قبلی)',
        roundIdx: 1,
        expertName: claimCase.assignedExpert?.name || claimCase.assessment.submittedBy || 'کارشناس ارزیاب اول',
        submittedAt: claimCase.assessment.submittedAt || new Date().toLocaleString('fa-IR'),
        gross: claimCase.assessment.gross,
        deductions: claimCase.assessment.deductions,
        salvage: claimCase.assessment.salvage,
        payable: claimCase.assessment.payable,
        reviewerNote: claimCase.assessment.reviewerNote,
        parts: claimCase.assessment.parts || [],
        aiDecisions: claimCase.aiDecisions || [],
        status: 'مورد اعتراض زیان‌دیده (مرحله اول)',
      });
    }

    const updated: ClaimCase = {
      ...claimCase,
      objectionStage: 1,
      status: 'در انتظار ارجاع به ارزیاب مجدد',
      reassessReason: objection1Reason.trim(),
      reassessType: 'اعتراض به ارزیابی اولیه',
      assessments: updatedAssessments,
      previousAssignedExpert: claimCase.assignedExpert || {
        id: currentAssessorId || 'prev_exp_1',
        name: currentAssessorName,
        role: 'کارشناس خسارت خودرو'
      },
      assignedExpert: null, // Force reassignment to expert 2
      previousAssessorIds: updatedPrev,
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار ارجاع به ارزیاب مجدد',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'زیان‌دیده',
          note: `ثبت اعتراض اول زیان‌دیده: «${objection1Reason.trim()}». پرونده جهت ارجاع به ارزیاب جدید (غیر از ${currentAssessorName}) به پنل شرکت بیمه ارجاع شد.`
        }
      ]
    };

    onUpdateCase(updated);
    setShowObjection1Modal(false);
    setObjection1Reason('');
    alert('اعتراض اول شما با موفقیت ثبت شد. پرونده جهت تخصیص به کارشناس ارزیاب جدید به شرکت بیمه ارسال گردید.');
  };

  // Handle Stage 2 Objection (Keeps Assessor #2, opens chat channel)
  const handleObjectionStage2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objection2Reason.trim()) return;

    const initialChat = [
      ...(claimCase.objectionChat || []),
      {
        sender: 'customer' as const,
        name: session.name || claimCase.victimName || 'زیان‌دیده',
        text: `[اعتراض دوم] ${objection2Reason.trim()}`,
        time: new Date().toLocaleString('fa-IR')
      }
    ];

    const updated: ClaimCase = {
      ...claimCase,
      objectionStage: 2,
      status: 'در انتظار پاسخ به ارزیاب',
      objectionChat: initialChat,
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار پاسخ به ارزیاب',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'زیان‌دیده',
          note: `ثبت اعتراض دوم زیان‌دیده: «${objection2Reason.trim()}». پرونده نزد ارزیاب دوم (${claimCase.assignedExpert?.name || 'ارزیاب'}) باقی ماند و گفتگوی مستقیم فعال شد.`
        }
      ]
    };

    onUpdateCase(updated);
    setShowObjection2Modal(false);
    setObjection2Reason('');
    alert('اعتراض دوم شما ثبت شد. کانال گفتگوی مستقیم با ارزیاب دوم فعال گردید.');
  };

  // Send message in Objection Chat (with optional file/photo attachment)
  const [chatSelectedFile, setChatSelectedFile] = useState<string | null>(null);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim() && !chatSelectedFile) return;

    const filesList = chatSelectedFile ? [chatSelectedFile] : undefined;

    const updatedChat = [
      ...(claimCase.objectionChat || []),
      {
        sender: 'customer' as const,
        name: session.name || claimCase.victimName || 'زیان‌دیده',
        text: chatMessageInput.trim() || 'ارسال عکس / مدرک درخواستی',
        files: filesList,
        time: new Date().toLocaleString('fa-IR')
      }
    ];

    // Only update status back to 'در حال ارزیابی' if status was explicitly waiting for customer reply and an assessor is actively assigned
    const shouldReturnToEvaluating = claimCase.status === 'در انتظار پاسخ به ارزیاب' && !!claimCase.assignedExpert;
    const newStatus = shouldReturnToEvaluating ? 'در حال ارزیابی' : claimCase.status;

    const updated: ClaimCase = {
      ...claimCase,
      status: newStatus,
      objectionChat: updatedChat,
      history: [
        ...(claimCase.history || []),
        {
          status: newStatus,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'زیان‌دیده',
          note: shouldReturnToEvaluating
            ? `ارسال تصویر/مدرک درخواستی توسط مشتری در چت. وضعیت پرونده به «در حال ارزیابی» تغییر یافت.`
            : `ارسال پیام/مدرک توسط مشتری در بخش گفتگو.`
        }
      ]
    };

    onUpdateCase(updated);
    setChatMessageInput('');
    setChatSelectedFile(null);
    if (shouldReturnToEvaluating) {
      alert('پاسخ و تصویر شما در چت ارسال شد و وضعیت پرونده مجدداً به «در حال ارزیابی» تغییر یافت.');
    } else {
      alert('پیام و مدرک شما در بخش گفتگو با موفقیت ارسال شد.');
    }
  };

  // Handle Stage 3 Objection (Workshop Information Submission)
  const handleWorkshopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopName.trim() || !workshopPhone.trim()) return;

    const updated: ClaimCase = {
      ...claimCase,
      objectionStage: 3,
      status: 'در حال بررسی اطلاعات تعمیرگاه توسط ارزیاب',
      workshopInfo: {
        province: workshopProvince,
        city: workshopCity,
        shopName: workshopName.trim(),
        shopPhone: workshopPhone.trim(),
        shopAddress: workshopAddress.trim(),
        submittedAt: new Date().toLocaleString('fa-IR')
      },
      history: [
        ...(claimCase.history || []),
        {
          status: 'در حال بررسی اطلاعات تعمیرگاه توسط ارزیاب',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'زیان‌دیده',
          note: `ثبت اطلاعات تعمیرگاه «${workshopName.trim()}» در ${workshopProvince} - ${workshopCity} توسط زیان‌دیده جهت ارزیابی مجدد.`
        }
      ]
    };

    onUpdateCase(updated);
    setShowWorkshopModal(false);
    alert('اطلاعات تعمیرگاه با موفقیت جهت ارزیابی مجدد برای کارشناس ارسال شد.');
  };

  // Handle Stage 4 Objection (Request Field Inspector / On-site Branch Visit)
  const handleRequestFieldInspector = () => {
    if (isCulprit) {
      alert('شما به عنوان مقصر حادثه، صرفاً دسترسی مشاهده پرونده را دارید و درخواست ارزیابی میدانی منحصراً توسط زیان‌دیده انجام می‌پذیرد.');
      return;
    }
    setShowFieldVisitModal(true);
  };

  const handleFieldVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCulprit) return;

    const requestTypeLabel = fieldVisitType === 'FIELD_VISIT'
      ? 'اعزام کارشناس رسمی میدانی به محل استقرار خودرو'
      : 'هماهنگی جهت مراجعه حضوری خودرو به شعبه تخصصی خسارت بیمه';

    const locationText = fieldVisitAddress.trim() || claimCase.accidentLocation || 'تهران';
    const phoneText = fieldVisitContactPhone.trim() || claimCase.victimPhone || session.phone || '';
    const noteText = fieldVisitReason.trim();

    const updated: ClaimCase = {
      ...claimCase,
      objectionStage: 4,
      status: 'در انتظار ارجاع به کارشناس میدانی',
      accidentLocation: locationText,
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار ارجاع به کارشناس میدانی',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'زیان‌دیده',
          note: `درخواست اعتراض نهایی و ارزیابی میدانی ثبت شد. نوع درخواست: «${requestTypeLabel}» • آدرس استقرار خودرو: «${locationText}» • تلفن هماهنگی: ${phoneText}${noteText ? ` • توضیحات: «${noteText}»` : ''}`
        }
      ]
    };

    onUpdateCase(updated);
    setShowFieldVisitModal(false);
    setFieldVisitSuccessToast(true);
    setTimeout(() => {
      setFieldVisitSuccessToast(false);
    }, 6000);
  };

  const handleCustomerComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expertComplaintDesc.trim()) return;

    const targetExpert = claimCase.assignedExpert || {
      id: claimCase.culpritInsurer === 'dana' ? 'd2' : claimCase.culpritInsurer === 'iran' ? 'ir2' : 'a2',
      name: claimCase.assignedExpert?.name || claimCase.assessment?.submittedBy || (claimCase.culpritInsurer === 'dana' ? 'فاطمه احمدی' : claimCase.culpritInsurer === 'iran' ? 'رضا تهرانی' : 'نرگس کریمی'),
      role: claimCase.assignedExpert?.role || 'کارشناس ارزیاب خسارت'
    };

    const myName = session.name || (isVictim ? claimCase.victimName : claimCase.culpritName) || 'مشتری';

    const newComplaint: ExpertComplaint = {
      id: `CMP-${Date.now()}`,
      expertId: targetExpert.id,
      expertName: targetExpert.name,
      caseId: claimCase.id,
      complainantName: `${myName} (${myRoleLabel})`,
      complainantRole: isVictim ? 'زیان‌دیده' : isCulprit ? 'مقصر' : 'زیان‌دیده',
      reasonCategory: expertComplaintReason,
      description: expertComplaintDesc.trim(),
      filedAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'تایید شده (ثبت در پرونده)',
      impactPoints: 18
    };

    const currentComplaints = loadComplaintsFromStorage();
    const updatedComplaints = [newComplaint, ...currentComplaints];
    saveComplaintsToStorage(updatedComplaints);

    const updatedCase: ClaimCase = {
      ...claimCase,
      history: [
        ...(claimCase.history || []),
        {
          status: claimCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: `${myName} (${myRoleLabel})`,
          note: `ثبت شکایت رسمی از کارشناس «${targetExpert.name}»: ${expertComplaintReason}`
        }
      ]
    };

    onUpdateCase(updatedCase);

    setShowExpertComplaintModal(false);
    setExpertComplaintDesc('');
    setExpertComplaintSuccessMsg(`شکایت شما از کارشناس «${targetExpert.name}» با موفقیت ثبت گردید و در پرونده ارزیابی و پایش عملکرد وی در پنل شرکت بیمه قرار گرفت.`);
    setTimeout(() => setExpertComplaintSuccessMsg(null), 6000);
  };

  // Additional Document Upload & Collaboration State
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docUploadCategory, setDocUploadCategory] = useState('عکس خسارت بدنه');
  const [docFileType, setDocFileType] = useState<'image' | 'video' | 'pdf' | 'text'>('image');
  const [docType, setDocType] = useState('عکس جدید از زوایای آسیب‌دیده خودرو');
  const [docTitle, setDocTitle] = useState('');
  const [docNote, setDocNote] = useState('');
  const [docVisibility, setDocVisibility] = useState<'SHARED' | 'EXPERT_ONLY' | 'PARTY_ONLY'>('SHARED');
  const [docFileData, setDocFileData] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string>('');
  const [docFileSize, setDocFileSize] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [docFilter, setDocFilter] = useState<'ALL' | 'PARTY_ONE' | 'PARTY_TWO' | 'IMAGE' | 'VIDEO' | 'PDF'>('ALL');
  const [partyCommentInput, setPartyCommentInput] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFileName(file.name);
      
      // Calculate human-readable file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setDocFileSize(`${sizeMB} MB`);

      if (file.type.startsWith('video/')) {
        setDocFileType('video');
      } else if (file.type.startsWith('audio/')) {
        setDocFileType('audio');
      } else if (file.type.includes('pdf')) {
        setDocFileType('pdf');
      } else {
        setDocFileType('image');
      }

      const dataUrl = await compressImageFile(file, 1000, 0.7);
      setDocFileData(dataUrl);
    }
  };

  const handleUploadAdditionalDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileData && !docNote.trim()) return;

    setIsUploading(true);

    setTimeout(() => {
      const uploaderParty: 'PARTY_ONE' | 'PARTY_TWO' = isPartyOne ? 'PARTY_ONE' : 'PARTY_TWO';
      const uploaderRoleStr = isPartyOne
        ? `طرف اول (${claimCase.partyOneRole || 'زیان‌دیده'})`
        : `طرف دوم (${claimCase.partyTwoRole || 'مقصر'})`;
      const uploaderName = session.name || (isPartyOne ? claimCase.victimName : claimCase.culpritName) || 'کاربر';
      const reqDocType = activeDocReq?.docType || docUploadCategory || docType;

      const newDoc: AdditionalDocItem = {
        id: `DOC-${Date.now()}`,
        title: docTitle.trim() || reqDocType,
        docType: reqDocType,
        fileType: docFileType,
        fileName: docFileName || (docFileType === 'image' ? 'photo.jpg' : docFileType === 'video' ? 'video.mp4' : docFileType === 'pdf' ? 'document.pdf' : 'note.txt'),
        fileSize: docFileSize || '1.8 MB',
        dataUrl: docFileData || undefined,
        uploadedBy: uploaderName,
        uploaderRole: uploaderRoleStr,
        uploaderParty: uploaderParty,
        uploadedAt: new Date().toLocaleString('fa-IR'),
        visibility: docVisibility,
        note: docNote.trim()
      };

      const updatedDocs = [...(claimCase.additionalDocs || []), newDoc];

      // Mark pending docRequests as answered/submitted
      const updatedDocRequests = (claimCase.docRequests || []).map(req => {
        if (activeDocReq && req.id === activeDocReq.id) {
          return { ...req, status: 'مدرک ارسال شد' as const };
        }
        return req;
      });

      // Maintain current case status unless it was explicitly waiting for a customer doc response under an active assigned expert
      let newStatus = claimCase.status;
      if (claimCase.status === 'در انتظار پاسخ به ارزیاب' && claimCase.assignedExpert) {
        const remainingPending = updatedDocRequests.filter(req => req.status === 'pending' || req.status === 'در انتظار پاسخ' || req.status === 'درخواست ارسال شد');
        if (remainingPending.length === 0) {
          newStatus = 'در حال ارزیابی';
        }
      }

      const updatedCase: ClaimCase = {
        ...claimCase,
        status: newStatus,
        additionalDocs: updatedDocs,
        docRequests: updatedDocRequests,
        history: [
          ...(claimCase.history || []),
          {
            status: newStatus,
            time: new Date().toLocaleString('fa-IR'),
            user: uploaderName,
            userRole: isPartyOne ? 'طرف اول' : 'طرف دوم',
            uploaderParty: uploaderParty,
            actionType: 'DOCUMENT_UPLOAD',
            note: `بارگذاری مدرک جدید توسط ${isPartyOne ? 'طرف اول' : 'طرف دوم'}: «${newDoc.title}» (${reqDocType})`
          }
        ]
      };

      onUpdateCase(updatedCase);

      setDocTitle('');
      setDocNote('');
      setDocFileData(null);
      setDocFileName('');
      setDocFileSize('');
      setIsUploading(false);
      setShowAddDocModal(false);
      setUploadSuccessMsg('مدرک جدید با موفقیت به پرونده مشترک افزوده شد و برای طرفین و کارشناس ارزیاب قرار گرفت.');
      setTimeout(() => setUploadSuccessMsg(null), 5000);
    }, 500);
  };

  const handleDeleteDoc = (docId: string) => {
    const docToDelete = (claimCase.additionalDocs || []).find(d => d.id === docId);
    if (!docToDelete) return;

    if (!confirm(`آیا از حذف مدرک «${docToDelete.title}» اطمینان دارید؟`)) return;

    const updatedDocs = (claimCase.additionalDocs || []).filter(d => d.id !== docId);
    const updatedCase: ClaimCase = {
      ...claimCase,
      additionalDocs: updatedDocs,
      history: [
        ...(claimCase.history || []),
        {
          status: claimCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || (isPartyOne ? 'طرف اول' : 'طرف دوم'),
          userRole: isPartyOne ? 'طرف اول' : 'طرف دوم',
          uploaderParty: isPartyOne ? 'PARTY_ONE' : 'PARTY_TWO',
          actionType: 'DOCUMENT_DELETE',
          note: `حذف مدرک «${docToDelete.title}» توسط ${isPartyOne ? 'طرف اول' : 'طرف دوم'}`
        }
      ]
    };

    onUpdateCase(updatedCase);
  };

  const handleAddPartyComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyCommentInput.trim()) return;

    const uploaderName = session.name || (isPartyOne ? claimCase.victimName : claimCase.culpritName) || 'کاربر';
    const partyRoleLabelStr = isPartyOne ? 'طرف اول' : 'طرف دوم';

    const newComment = {
      id: `CMT-${Date.now()}`,
      author: uploaderName,
      uploaderParty: isPartyOne ? ('PARTY_ONE' as const) : ('PARTY_TWO' as const),
      role: partyRoleLabelStr,
      text: partyCommentInput.trim(),
      time: new Date().toLocaleString('fa-IR')
    };

    const updatedComments = [...(claimCase.partyComments || []), newComment];
    const updatedCase: ClaimCase = {
      ...claimCase,
      partyComments: updatedComments,
      history: [
        ...(claimCase.history || []),
        {
          status: claimCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: uploaderName,
          userRole: partyRoleLabelStr,
          uploaderParty: isPartyOne ? 'PARTY_ONE' : 'PARTY_TWO',
          actionType: 'NOTE_ADD',
          note: `ثبت توضیحات/اظهارات توسط ${partyRoleLabelStr}: «${partyCommentInput.trim()}»`
        }
      ]
    };

    onUpdateCase(updatedCase);
    setPartyCommentInput('');
  };

  const handleAcceptAssessment = () => {
    if (isCulprit) {
      alert('به عنوان مقصر حادثه، شما صرفاً دسترسی مشاهده پرونده را دارید و ثبت اطلاعات بانکی و دریافت خسارت منحصراً توسط زیان‌دیده انجام می‌پذیرد.');
      return;
    }

    if (!hasAnyCompletedAssessment) {
      alert('ارزیابی پرونده هنوز توسط کارشناس بیمه انجام نشده است. ثبت اطلاعات بانکی پس از ابلاغ رسمی برآورد خسارت امکان‌پذیر خواهد بود.');
      return;
    }

    if (!iban || !nationalId) {
      setShowForm(true);
      return;
    }

    const damageCalc = calculateClaimDamageWithPolicyLimits(claimCase);
    const sanhabInq = performPolicySanhabInquiry(claimCase);

    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const trackingCode = `PAY-REQ-${Date.now().toString().slice(-6)}`;
    const detectedBank = getBankNameFromIban(iban);
    const insurerNameStr = claimCase.bodyInsuranceInfo?.insurerName || getInsurerPersianName(claimCase.culpritInsurer || claimCase.victimInsurer);

    const payableFinal = claimCase.assessment?.payable || damageCalc.insurerPayablePortion || 245000000;

    // Generate real-time SMS dispatch logs for claimant
    const victimSmsLog = {
      id: `SMS-V-${Date.now()}`,
      recipientType: 'VICTIM' as const,
      recipientName: claimCase.victimName || beneficiary || (isBodyClaim ? 'بیمه‌گذار محترم بدنه' : 'زیان‌دیده'),
      phone: claimCase.victimPhone || session.phone || '09120000000',
      text: isBodyClaim
        ? `بیمه‌گذار گرامی بیمه بدنه؛ اطلاعات شماره شبا (${iban} - ${detectedBank}) با موفقیت تایید و پرونده خسارت ${claimCase.id} جهت صدور حواله و واریز به مبلغ ${payableFinal.toLocaleString('fa-IR')} ریال به مدیر مالی ${insurerNameStr} ارجاع گردید.`
        : damageCalc.victimSmsText,
      sentAt: nowTimeStr,
      status: 'DELIVERED' as const
    };

    const culpritSmsLog = {
      id: `SMS-C-${Date.now() + 1}`,
      recipientType: 'CULPRIT' as const,
      recipientName: claimCase.culpritName || 'طرف مقابل / مقصر حادثه',
      phone: claimCase.culpritPhone || '09121111111',
      text: damageCalc.culpritSmsText,
      sentAt: nowTimeStr,
      status: 'DELIVERED' as const
    };

    const updatedSmsLogs = isBodyClaim
      ? [...(claimCase.smsDispatchLogs || []), victimSmsLog]
      : [...(claimCase.smsDispatchLogs || []), victimSmsLog, culpritSmsLog];

    const updated: ClaimCase = {
      ...claimCase,
      status: 'در انتظار پرداخت',
      decisionState: 'ACCEPTED',
      payoutState: 'VALIDATION_PENDING',
      diminutionValue: damageCalc.diminutionAmount,
      diminutionPercent: damageCalc.diminutionPercent,
      diminutionReason: damageCalc.diminutionReason,
      franchiseAmount: damageCalc.franchiseAmount,
      franchisePercent: damageCalc.franchisePercent,
      policyCeilingFinancial: damageCalc.policyMaxFinancialLimit,
      insurerPayableAmount: payableFinal,
      culpritDebtAmount: isBodyClaim ? 0 : damageCalc.culpritExcessDebt,
      exceedsPolicyCeiling: damageCalc.exceedsCeiling,
      policyInquirySanhab: {
        code: sanhabInq.sanhabTrackingCode,
        date: sanhabInq.inquiryDate,
        status: 'فعال و معتبر (استعلام برخط سنهاب)',
        ceiling: damageCalc.policyMaxFinancialLimit,
        conventionalVehicle: sanhabInq.isConventionalVehicle
      },
      smsDispatchLogs: updatedSmsLogs,
      payoutInfo: {
        ...claimCase.payoutInfo,
        beneficiary: beneficiary || claimCase.victimName || claimCase.ownerName,
        nationalId: nationalId,
        iban: iban,
        verification: 'VERIFIED'
      },
      bankInfo: {
        ...claimCase.bankInfo,
        beneficiary: beneficiary || claimCase.victimName || claimCase.ownerName,
        nationalId: nationalId,
        iban: iban,
        bankName: detectedBank
      },
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار پرداخت',
          time: nowTimeStr,
          user: session.name || beneficiary || (isBodyClaim ? 'بیمه‌گذار بدنه' : 'زیان‌دیده'),
          note: isBodyClaim
            ? `تایید نظر کارشناسی میدانی و ثبت اطلاعات بانکی بیمه‌گذار بدنه (شبا: ${iban} - ${detectedBank}) توسط مشتری. پرونده جهت صدور حواله واریز مستقیماً به کارتابل مدیر مالی (${insurerNameStr}) ارسال شد.`
            : `ثبت و ارسال موفق اطلاعات حساب بانکی زیان‌دیده (شبا: ${iban} - ${detectedBank}) به شرکت بیمه (${insurerNameStr}). پرونده به صورت خودکار در صف پرداخت و کارتابل مدیر مالی قرار گرفت تا پس از تایید خزانه‌داری، حواله واریز گردد.`
        }
      ]
    };

    onUpdateCase(updated);

    // Save and sync payment order directly to finance queue storage
    try {
      const existingOrders = loadPaymentOrdersFromStorage();
      const orderIndex = existingOrders.findIndex(o => o.caseId === claimCase.id);
      const netAmt = payableFinal;
      const isCriticalOrUrgent = claimCase.damageType === 'خسارت جرحی/فوتی' || netAmt > 200000000;
      const slaPrio = isCriticalOrUrgent ? 'CRITICAL' : netAmt > 80000000 ? 'HIGH' : 'NORMAL';

      const orderPayload: PaymentOrder = {
        id: orderIndex >= 0 ? existingOrders[orderIndex].id : `PAY-ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`,
        caseId: claimCase.id,
        victimName: beneficiary || claimCase.victimName || claimCase.ownerName || 'زیان‌دیده محترم',
        victimNationalId: nationalId,
        victimPhone: claimCase.victimPhone || session.phone || '09120000000',
        victimIban: iban,
        victimBankName: detectedBank,
        culpritName: claimCase.culpritName || 'طرف مقابل',
        culpritInsurer: claimCase.culpritInsurer || claimCase.insurer || 'dana',
        grossAmount: claimCase.assessment?.gross || netAmt,
        salvageDeduction: claimCase.assessment?.salvageDeduction || 0,
        taxDeduction: 0,
        franchiseDeduction: damageCalc.franchiseAmount || 0,
        netPayableAmount: netAmt,
        status: 'READY_FOR_PAYMENT',
        slaPriority: slaPrio,
        slaDeadline: slaPrio === 'CRITICAL' ? 'امروز ساعت ۱۴:۰۰' : slaPrio === 'HIGH' ? 'فردا ساعت ۱۱:۰۰' : '۴۸ ساعت آینده',
        slaRemainingHours: slaPrio === 'CRITICAL' ? 2 : slaPrio === 'HIGH' ? 12 : 36,
        slaStatus: 'ON_TRACK',
        paymentMethod: netAmt > 100000000 ? 'SATNA' : 'PAYA',
        issueDate: new Date().toLocaleDateString('fa-IR'),
        readyDate: nowTimeStr,
        financeNotes: `اطلاعات بانکی توسط زیان‌دیده (${beneficiary || claimCase.victimName}) ثبت و پرونده به صورت برخط به کارتابل مدیر مالی منتقل شد.`,
        accountVoucherNumber: `VCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`,
        preCheck: {
          ibanValid: true,
          ibanBankName: detectedBank,
          nameMatchConfidence: 100,
          nameMatchPassed: true,
          amountUnderCeiling: true,
          payoutReadyVerified: true,
          noDuplicatePassed: true,
          checkedAt: new Date().toLocaleDateString('fa-IR'),
          checkedBy: 'سیستم اعتبارسنجی خزانه‌داری'
        }
      };

      let updatedOrdersList: PaymentOrder[];
      if (orderIndex >= 0) {
        updatedOrdersList = [...existingOrders];
        updatedOrdersList[orderIndex] = { ...existingOrders[orderIndex], ...orderPayload, status: 'READY_FOR_PAYMENT' };
      } else {
        updatedOrdersList = [orderPayload, ...existingOrders];
      }
      savePaymentOrdersToStorage(updatedOrdersList);
      window.dispatchEvent(new CustomEvent('claimflow_payment_orders_updated'));
    } catch (e) {
      console.error('Error updating payment orders storage:', e);
    }

    // Show comprehensive success modal to inform the user about insurance queue and finance manager forwarding
    setBankSuccessModal({
      isOpen: true,
      caseId: claimCase.id,
      beneficiary: beneficiary || claimCase.victimName || (isBodyClaim ? 'بیمه‌گذار محترم بدنه' : 'زیان‌دیده محترم'),
      nationalId: nationalId,
      iban: iban,
      bankName: detectedBank,
      payableAmount: payableFinal,
      trackingCode: trackingCode,
      submittedAt: nowTimeStr,
      insurerName: insurerNameStr
    });
  };

  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeDesc.trim()) return;

    const updated: ClaimCase = {
      ...claimCase,
      centralComplaint: {
        subject: disputeSubject,
        description: disputeDesc,
        submittedAt: new Date().toISOString(),
        by: session.name || 'مشتری',
        status: 'ثبت شده در بیمه مرکزی'
      },
      history: [
        ...(claimCase.history || []),
        {
          status: claimCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'مشتری',
          note: `ثبت شکایت به بیمه مرکزی: ${disputeSubject}`
        }
      ]
    };

    onUpdateCase(updated);
    setShowDisputeModal(false);
  };

  const handleRatingSubmit = (stars: number) => {
    setRatingStars(stars);
    const updated: ClaimCase = {
      ...claimCase,
      victimRating: {
        stars,
        comment: ratingComment,
        submittedAt: new Date().toISOString(),
        by: session.name || 'مشتری'
      }
    };
    onUpdateCase(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 shadow-xs text-xs font-black transition-all flex items-center gap-1.5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-blue-900" />
          <span>بازگشت به لیست پرونده‌ها</span>
        </button>

        <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-xs">
          {claimCase.status}
        </span>
      </div>

      {/* Main Case Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              پرونده {claimCase.id}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              تاریخ: {claimCase.date} | نقش شما: <span className="font-bold text-indigo-600">{myRoleLabel}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Expert Call / Inquiry Button */}
            <button
              type="button"
              onClick={() => setShowExpertCallModal(true)}
              className="px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-black text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
              title="تماس مستقیم یا ارسال پیام اضطراری به کارشناس ارزیاب"
            >
              <PhoneCall className="w-4 h-4 text-sky-600" />
              <span>تماس با کارشناس</span>
            </button>

            {/* Submit Ticket / CRM Complaint Button */}
            <button
              type="button"
              onClick={() => setShowCrmTicketModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
              title="ثبت تیکت پشتیبانی و شکایت در مرکز CRM بیمه"
            >
              <MessageSquarePlus className="w-4 h-4 text-rose-600" />
              <span>ثبت تیکت / شکایت CRM</span>
            </button>

            {claimCase.assessment && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                شکایت به بیمه مرکزی
              </button>
            )}
          </div>
        </div>

        {/* Culprit View-Only Role Notice */}
        {isCulprit && (
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl text-xs text-slate-800 flex items-start gap-3 shadow-xs animate-in fade-in">
            <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-extrabold text-slate-900 text-sm">
                دسترسی مشاهده‌کننده (نقش مقصر حادثه)
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                شما به عنوان طرف مقصر حادثه در سامانه ثبت شده‌اید. این پنل برای شما در وضعیت <strong>صرفاً مشاهده‌کننده (فقط خواندنی)</strong> قرار دارد. طبق قوانین بیمه مرکزی، مراحل تایید برآورد کارشناسی، ثبت شماره شبا، بارگذاری اطلاعات بانکی و دریافت وجه خسارت صرفاً توسط <strong>زیان‌دیده</strong> انجام می‌پذیرد.
              </p>
            </div>
          </div>
        )}

        {/* Field Expert & Branch Dispatch Live Card */}
        {(claimCase.assignedFieldExpert || claimCase.assignedBranch) && (
          <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl text-xs space-y-3 shadow-md border border-sky-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <UserCheck className="w-4.5 h-4.5 text-amber-400" />
                <span className="text-xs sm:text-sm font-black">وضعیت کارشناسی میدانی و هماهنگی شعبه بیمه ({getInsurerPersianName(claimCase.culpritInsurer)}):</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-200 border border-amber-400/30 self-start sm:self-auto">
                {claimCase.status}
              </span>
            </div>

            <p className="text-slate-200 text-xs leading-relaxed">
              {claimCase.assignedFieldExpert
                ? `کارشناس رسمی میدانی «${claimCase.assignedFieldExpert.name}» (${claimCase.assignedFieldExpert.role}) توسط شرکت بیمه جهت بازدید حضوری از خودروها و محل حادثه تخصیص یافته است.`
                : 'شرکت بیمه‌گر در حال تخصیص و اعزام کارشناس میدانی متخصص به محل حادثه جهت بازرسی فیزیکی، احراز اصالت و تعیین خسارت می‌باشد.'}
            </p>

            {/* Expert & Assigned Branch Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              {claimCase.assignedFieldExpert && (
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>مشخصات کارشناس میدانی تخصیص‌یافته:</span>
                  </div>
                  <div className="font-extrabold text-white text-xs">
                    {claimCase.assignedFieldExpert.name} ({claimCase.assignedFieldExpert.role})
                  </div>
                  {claimCase.assignedFieldExpert.phone && (
                    <div className="text-[11px] text-slate-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-sky-400" />
                      <span>تلفن تماس: <span className="font-mono text-white font-bold" dir="ltr">{claimCase.assignedFieldExpert.phone}</span></span>
                    </div>
                  )}
                  {claimCase.fieldVisitSchedule && (
                    <div className="text-[11px] text-amber-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        زمان هماهنگ‌شده: <strong>
                          {typeof claimCase.fieldVisitSchedule === 'string'
                            ? claimCase.fieldVisitSchedule
                            : `${claimCase.fieldVisitSchedule.scheduledDate || ''} ${claimCase.fieldVisitSchedule.scheduledTime ? `ساعت ${claimCase.fieldVisitSchedule.scheduledTime}` : ''}`.trim() || 'هماهنگ‌شده با طرفین'}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>
              )}

              {claimCase.assignedBranch && (
                <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>نزدیک‌ترین شعبه تخصصی بیمه (محل حضور و بازدید):</span>
                  </div>
                  <div className="font-extrabold text-white text-xs">
                    {claimCase.assignedBranch.name} ({claimCase.assignedBranch.city})
                  </div>
                  <div className="text-[11px] text-slate-200 leading-snug flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                    <span>{claimCase.assignedBranch.address}</span>
                  </div>
                  {claimCase.assignedBranch.phone && (
                    <div className="text-[11px] text-slate-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-sky-400" />
                      <span>تلفن شعبه: <span className="font-mono text-white" dir="ltr">{claimCase.assignedBranch.phone}</span></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SMS Notification Banner for Customer */}
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center gap-2 text-[11px] text-sky-200">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>پیامک مشخصات کارشناس و آدرس نزدیک‌ترین شعبه جهت حضور و تحویل مدارک، هم‌زمان برای شما و کارشناس میدانی ارسال گردیده است.</span>
            </div>
          </div>
        )}

        {/* Stage 4 Objection Active Banner (Waiting for Field Inspector Allocation / Inspection) */}
        {(claimCase.status === 'در انتظار ارجاع به کارشناس میدانی' || claimCase.status === 'در انتظار بازدید کارشناس میدانی' || (claimCase.objectionStage === 4 && !claimCase.fieldExpertVerdict)) && !claimCase.authenticityDispute && (
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100 border-2 border-purple-300 rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-200/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-purple-950 text-sm sm:text-base">
                    پرونده در وضعیت «اعتراض نهایی - در انتظار ارزیابی کارشناس رسمی میدانی»
                  </h3>
                  <p className="text-[11px] text-purple-800 font-bold">
                    درخواست اعزام کارشناس رسمی حضوری به شرکت بیمه ({getInsurerPersianName(claimCase.culpritInsurer)}) ارسال گردیده است.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-200 text-purple-950 border border-purple-300 self-start sm:self-auto">
                {claimCase.status}
              </span>
            </div>

            <p className="text-xs text-purple-900 leading-relaxed font-medium">
              {claimCase.assignedFieldExpert
                ? `کارشناس رسمی میدانی «${claimCase.assignedFieldExpert.name}» (${claimCase.assignedFieldExpert.role}) جهت بررسی حضوری قطعات خودرو و اصالت‌سنجی فیزیکی به پرونده شما تخصیص یافته است.`
                : 'پرونده شما در کارتابل شرکت بیمه قرار گرفته و کارشناس مسئول بیمه‌گر در حال تخصیص نزدیک‌ترین کارشناس رسمی میدانی جهت هماهنگی و بازدید حضوری خودرو می‌باشد.'}
            </p>

            {claimCase.assignedFieldExpert && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-white/80 p-3 rounded-xl border border-purple-200 space-y-1">
                  <span className="text-purple-700 font-bold block text-[11px]">کارشناس رسمی میدانی تخصیص‌یافته:</span>
                  <div className="font-extrabold text-slate-900">{claimCase.assignedFieldExpert.name} ({claimCase.assignedFieldExpert.role})</div>
                  {claimCase.assignedFieldExpert.phone && (
                    <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono" dir="ltr">
                      <Phone className="w-3 h-3 text-purple-600" />
                      {claimCase.assignedFieldExpert.phone}
                    </div>
                  )}
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-purple-200 space-y-1">
                  <span className="text-purple-700 font-bold block text-[11px]">شعبه پرداخت خسارت و هماهنگی:</span>
                  <div className="font-extrabold text-slate-900">{claimCase.assignedBranch || 'شعبه تخصصی خسارت مرکزی'}</div>
                  <div className="text-[11px] text-slate-600">هماهنگی بازدید و تحویل داغی قطعات</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Temporary Registration / Add Kroki Form Banner */}
        {(claimCase.status === 'ثبت موقت - در انتظار افزودن کروکی' || (claimCase.futurePoliceExpected === true && !claimCase.hasKroki)) && (
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-amber-950 text-base">
                  پرونده در حالت «ثبت موقت - در انتظار افزودن کروکی» می‌باشد
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  این پرونده تا زمان صدور برگه کروکی توسط پلیس راهور به صورت موقت ذخیره شده است. پس از دریافت کد کروکی، می‌توانید آن را در کادر زیر وارد کنید تا پرونده جهت ارزیابی به بیمه‌گر مقصر ارجاع شود.
                </p>
              </div>
            </div>

            {krokiSuccessMsg ? (
              <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{krokiSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleAddKrokiCode} className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 mb-1">
                    کد کروکی پلیس راهور <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={krokiInputCode}
                    onChange={(e) => setKrokiInputCode(e.target.value)}
                    placeholder="مثال: KR-994821"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold font-mono text-slate-900 bg-white placeholder:text-slate-400 uppercase tracking-wider focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    dir="ltr"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!krokiInputCode.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ثبت کد کروکی و ارجاع پرونده به شرکت بیمه مقصر (بیمه دانا)
                </button>
              </form>
            )}
          </div>
        )}

        {/* Automatic Insurance Referral Banner (Shown when not in temporary kroki waiting state) */}
        {claimCase.status !== 'ثبت موقت - در انتظار افزودن کروکی' && (
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-3xl p-5 flex items-start gap-3.5 shadow-xs animate-in fade-in">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-emerald-950 text-sm">
                استعلام هوشمند انجام شد: ارجاع خودکار پرونده به {getInsurerPersianName(claimCase.culpritInsurer)}
              </h4>
              <p className="text-emerald-800 leading-relaxed font-medium">
                پرونده شما با استعلام هوشمند لحظه‌ای تایید گردید و جهت بررسی و تخصیص ارزیاب خسارت، مستقیماً به **{getInsurerPersianName(claimCase.culpritInsurer)}** ارجاع داده شد. پیامک اطلاع‌رسانی برای زیان‌دیده ({claimCase.victimName} - {claimCase.victimPhone}) و مقصر ({claimCase.culpritName} - {claimCase.culpritPhone}) ارسال شده است.
              </p>
            </div>
          </div>
        )}

        {/* Address */}
        {claimCase.address && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <span className="text-slate-400 block mb-1 font-bold">محل تصادف:</span>
            <span className="font-semibold text-slate-700">{claimCase.address}</span>
          </div>
        )}

        {/* Insurance Policy & Financial Coverage Limits Card */}
        {(() => {
          const calc = calculateClaimDamageWithPolicyLimits(claimCase);
          const policyLimit = calc.policyMaxFinancialLimit;
          return (
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold shadow-xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                      اطلاعات بیمه‌نامه و سقف تعهدات مالی
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      استعلام برخط سامانه سنهاب بیمه مرکزی ({getInsurerPersianName(claimCase.culpritInsurer)})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    استعلام معتبر سنهاب
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block mb-1">شماره بیمه‌نامه شخص ثالث</span>
                  <span className="font-mono font-bold text-white text-xs" dir="ltr">
                    {claimCase.culpritPolicyNumber || 'DAN-1403-882194'}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block mb-1">سقف تعهد مالی بیمه‌نامه</span>
                  <span className="font-mono font-extrabold text-amber-300 text-xs">
                    {formatCurrency(policyLimit)}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block mb-1">کد رهگیری سامانه سنهاب</span>
                  <span className="font-mono font-bold text-blue-200 text-xs" dir="ltr">
                    {claimCase.sanhabInquiry?.trackingCode || 'SNH-994821'}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <span className="text-slate-400 text-[10px] block mb-1">وضعیت شمول خودرو</span>
                  <span className="font-bold text-emerald-300 text-xs">
                    خودروی متعارف (۱۰۰٪ شمول)
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PARTY ONE POST-CREATION STATUS BANNER (When no expert requests exist yet) */}
        {isPartyOne && pendingDocRequests.length === 0 && myDocChat.length === 0 && (
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl space-y-2 text-xs text-blue-950 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-sm text-blue-900">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>
                  {claimCase.assignedExpert
                    ? `پرونده اعلام خسارت شما به کارشناس ارزیاب (${claimCase.assignedExpert.name}) محول شده است`
                    : 'پرونده اعلام خسارت شما با موفقیت ثبت شد و در انتظار ارجاع به کارشناس ارزیاب است'}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-extrabold text-[10px]">
                {claimCase.status}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              {claimCase.assignedExpert
                ? 'کارشناس تخصیص‌یافته در حال بررسی شواهد، کروکی و مدارک است. در صورت نیاز به مدارک تکمیلی از طریق همین صفحه به شما اطلاع‌رسانی خواهد شد.'
                : 'اطلاعات اولیه و مدارک ثبت‌شده با موفقیت در سامانه ذخیره شدند. پس از ارجاع پرونده به کارشناس ارزیاب توسط شرکت بیمه، مراحل بعدی پیگیری خواهد شد.'}
            </p>
          </div>
        )}

        {/* PARTY TWO ACTION BANNER */}
        {isPartyTwo && (
          <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl space-y-3 text-xs text-amber-950 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                  <FilePlus className="w-5 h-5 text-amber-600" />
                  <span>بخش بارگذاری مدارک و شواهد توسط طرف دوم ({partyTwoRole} / طرف مقابل)</span>
                </div>
                <p className="text-amber-800 font-medium leading-relaxed">
                  شما به عنوان طرف دوم پرونده ({partyTwoRole}) می‌توانید عکس‌ها، ویدیوها، تصاویر گواهی‌نامه، بیمه‌نامه و توضیحات خود را برای بررسی یکپارچه کارشناس ارزیاب بارگذاری نمایید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDocModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>بارگذاری مدارک و شواهد طرف دوم</span>
              </button>
            </div>
          </div>
        )}



        {/* CONTEXTUAL CHAT WITH INSURANCE EXPERT */}
        {(myDocChat.length > 0 || pendingDocRequests.length > 0) && (
          <div className="bg-white border-2 border-indigo-200/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  گفتگو و پیام‌های مستقیم با کارشناس ارزیاب پرونده
                </h3>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-extrabold border border-indigo-200">
                کانال محرمانه {isPartyOne ? 'طرف اول' : 'طرف دوم'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {myDocChat.length === 0 ? (
                <p className="text-center text-slate-400 text-xs py-4 font-medium">
                  پیامی بین شما و کارشناس ثبت نشده است.
                </p>
              ) : (
                myDocChat.map((chat, idx) => {
                  const isFromExpert = chat.from === 'expert' || chat.senderParty === 'EXPERT';
                  return (
                    <div
                      key={chat.id || idx}
                      className={`p-3.5 rounded-2xl text-xs space-y-2 border ${
                        isFromExpert
                          ? 'bg-purple-50/90 border-purple-200 mr-8 text-purple-950'
                          : 'bg-blue-50/90 border-blue-200 ml-8 text-blue-950 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[10px]">
                        <span className={isFromExpert ? 'text-purple-700' : 'text-blue-700'}>
                          {isFromExpert ? `کارشناس ارزیاب (${chat.by || 'پشتیبان'})` : `شما (${myRoleLabel})`}
                        </span>
                        <span className="text-slate-400 font-mono">{chat.at}</span>
                      </div>
                      <p className="font-medium leading-relaxed">{chat.text}</p>

                      {/* Attached files preview in chat bubble */}
                      {chat.files && chat.files.length > 0 && (
                        <div className="pt-1.5 flex flex-wrap gap-2 border-t border-slate-200/60 mt-2">
                          {chat.files.map((fileItem: any, fi: number) => {
                            const isObj = typeof fileItem === 'object' && fileItem !== null;
                            const dUrl = isObj ? fileItem.dataUrl : fileItem;
                            const fName = isObj ? (fileItem.fileName || fileItem.title || 'فایل ضمیمه') : `فایل ضمیمه #${fi + 1}`;
                            const fType = isObj ? fileItem.fileType : (typeof dUrl === 'string' && dUrl.startsWith('data:video') ? 'video' : 'image');

                            return (
                              <div key={fi} className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1 max-w-xs">
                                <span className="font-bold text-slate-800 block truncate">{fName}</span>
                                {dUrl && (fType === 'image' || (!fType && typeof dUrl === 'string' && dUrl.startsWith('data:image'))) && (
                                  <img src={dUrl} alt={fName} className="w-full h-24 object-cover rounded-lg border border-slate-100" />
                                )}
                                {dUrl && fType === 'video' && (
                                  <video src={dUrl} controls className="w-full max-h-28 rounded-lg border border-slate-100" />
                                )}
                                {dUrl && (fType === 'pdf' || fType === 'doc') && (
                                  <a href={dUrl} download={fName} className="text-blue-600 hover:underline font-bold text-[10px] block">
                                    دانلود فایل ({fType.toUpperCase()})
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Direct Message Form for Customer */}
            <form onSubmit={handleSendCustomerChatMessage} className="pt-2 border-t border-slate-100 space-y-2">
              {customerChatFile && (
                <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">فایل انتخاب‌شده: {customerChatFile.name} ({customerChatFile.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomerChatFile(null)}
                    className="text-red-500 hover:text-red-700 text-xs px-2"
                  >
                    حذف
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customerChatText}
                  onChange={(e) => setCustomerChatText(e.target.value)}
                  placeholder="پاسخ یا پیام خود را برای کارشناس بنویسید..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
                />

                <label className="p-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all shrink-0" title="افزودن تصویر، ویدیو یا مدرک">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleCustomerChatFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>ارسال پیام</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PARTY COMMENTS & EXPLANATIONS SECTION — ONLY SHOWN IF PARTY COMMENTS ACTUALLY EXIST */}
        {claimCase.partyComments && claimCase.partyComments.length > 0 && (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  اظهارات و یادداشت‌های طرفین حادثه
                </h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold border border-slate-200">
                ارسال مستقیم برای کارشناس
              </span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {claimCase.partyComments.map((cmt) => (
                <div
                  key={cmt.id}
                  className={`p-3.5 rounded-2xl text-xs space-y-1.5 border ${
                    cmt.uploaderParty === 'PARTY_ONE'
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                        cmt.uploaderParty === 'PARTY_ONE' ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {cmt.role}
                      </span>
                      <span>{cmt.author}</span>
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">{cmt.time}</span>
                  </div>
                  <p className="font-medium leading-relaxed">{cmt.text}</p>
                </div>
              ))}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddPartyComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={partyCommentInput}
                onChange={(e) => setPartyCommentInput(e.target.value)}
                placeholder={`توضیحات و اظهارات خود به‌عنوان ${isPartyOne ? 'طرف اول' : 'طرف دوم'} را ثبت کنید...`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 bg-slate-50 focus:bg-white"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>ثبت اظهارات</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Assigned Expert Info & Customer Complaint Box — ONLY shown after expert evaluation */}
        {claimCase.assessment && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">کارشناس ارزیاب تخصیص‌یافته</span>
                  <h4 className="font-extrabold text-white text-sm">
                    {claimCase.assignedExpert?.name || claimCase.assessment?.submittedBy || (claimCase.culpritInsurer === 'dana' ? 'فاطمه احمدی' : claimCase.culpritInsurer === 'iran' ? 'رضا تهرانی' : 'نرگس کریمی')}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {claimCase.assignedExpert?.role || 'کارشناس ارزیابی خسارت خودرو'} ({getInsurerPersianName(claimCase.culpritInsurer)})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowExpertComplaintModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>ثبت اعتراض / شکایت از عملکرد کارشناس</span>
              </button>
            </div>

            {expertComplaintSuccessMsg && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{expertComplaintSuccessMsg}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              در صورت وجود هرگونه اعتراض به برآورد خسارت، عدم پاسخگویی یا رفتار نامناسب کارشناس ارزیاب، می‌توانید شکایت خود را ثبت نمایید. این شکایت مستقیماً در پنل مدیریتی شرکت بیمه ثبت شده و نمره عملکرد کارشناس مربوطه را کاهش خواهد داد.
            </p>
          </div>
        )}

        {/* Pending Reviewer Approval Banner for Customer */}
        {(claimCase.status === 'در انتظار بررسی بازبین' || claimCase.status === 'در انتظار بازبینی' || claimCase.status === 'نیازمند اصلاح کارشناس' || (claimCase.assessment && !claimCase.reviewerApproval?.approved && claimCase.status !== 'در انتظار تایید کاربر' && claimCase.status !== 'تصمیم نهایی - غیرقابل اعتراض' && !claimCase.isFinalDecision && !claimCase.status.includes('پرداخت'))) && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 space-y-2 text-amber-950 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>ارزیابی خسارت در مرحله کنترل کیفیت بازبین بیمه</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                در حال بازبینی
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              برآورد خسارت توسط کارشناس ارزیاب انجام پذیرفته و در حال حاضر در مرحله کنترلی و تایید بازبین بیمه‌گر می‌باشد. بلافاصله پس از ابلاغ و تایید بازبین، جزئیات کامل و مبلغ قابل پرداخت جهت مشاهده و تصمیم‌گیری شما فعال خواهد شد.
            </p>
          </div>
        )}

        {/* ASSESSMENTS SECTION — DISTINCT INTERACTIVE CARDS FOR EVERY ASSESSMENT (FIELD & DESK) */}
        {(() => {
          const calc = calculateClaimDamageWithPolicyLimits(claimCase);

          // Field assessment is only displayed if the field expert has actually completed and submitted an authentic field assessment
          const isFieldAssessmentCompleted = Boolean(
            claimCase.fieldExpertVerdict ||
            claimCase.fieldExpertFinal ||
            claimCase.fieldExpertReportNote ||
            claimCase.fieldExpertCompletedAt ||
            (claimCase.assignedFieldExpert && claimCase.assessment?.fieldInspectionConfirmed) ||
            claimCase.assessment?.assessorType === 'FIELD_EXPERT' ||
            claimCase.assessment?.isFieldExpert === true ||
            (claimCase.assessment?.assessorId && claimCase.assessment.assessorId.startsWith('fed'))
          );

          const hasFieldAssessment = isFieldAssessmentCompleted;

          // Desk assessment is only displayed if it has been submitted/published
          const isDeskAssessmentCompleted = Boolean(
            (claimCase.assessments && claimCase.assessments.length > 0) ||
            (claimCase.assessment && claimCase.assessment.status !== 'DRAFT' && claimCase.assessment.status !== 'REJECTED')
          );

          // If no completed assessments yet, show clear waiting banner and don't render empty assessment cards
          if (!isFieldAssessmentCompleted && !isDeskAssessmentCompleted) {
            return (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl p-5 space-y-2 text-slate-800 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-sm text-blue-950">
                    <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>پرونده در دست ارزیابی کارشناس بیمه</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[10px] font-extrabold border border-blue-200">
                    در حال ارزیابی
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  پرونده شما جهت بررسی مستندات و برآورد خسارت به کارشناس ارزیاب تخصیص یافته است. پس از تکمیل ارزیابی، تایید و ارسال رسمی گزارش توسط کارشناس و بیمه‌گر، کارت نتیجه ارزیابی به همراه جزئیات خسارت و مبالغ در این بخش نمایش داده خواهد شد.
                </p>
              </div>
            );
          }

          let fieldDocs = (claimCase.additionalDocs || []).filter(
            (d) => d.uploaderRole?.includes('میدانی') || d.title?.includes('بازدید میدانی') || d.title?.includes('میدانی') || d.docType?.includes('بازدید میدانی') || d.id?.startsWith('field-img') || d.uploaderParty === 'EXPERT'
          );

          // If no field specific docs found, fallback to claim case attached photos
          if (fieldDocs.length === 0 && claimCase.files && claimCase.files.length > 0) {
            fieldDocs = claimCase.files.map((f, i) => ({
              id: `doc-file-${i}`,
              title: f.name || `تصویر شماره ${i + 1} ارزیابی فیزیکی خودرو`,
              docType: 'عکس بازدید میدانی کارشناس',
              fileType: 'image',
              fileName: f.name || 'image.jpg',
              dataUrl: f.dataUrl || f.url || '',
              uploadedBy: claimCase.assignedFieldExpert?.name || 'مهندس کامران رستمی',
              uploaderRole: 'کارشناس رسمی میدانی',
              uploaderParty: 'EXPERT',
              uploadedAt: claimCase.date || '۱۴۰۳/۱۱/۲۰',
              visibility: 'SHARED',
              note: 'ثبت شده در مستندات بازرسی فیزیکی صحنه تصادف'
            }));
          }

          if (fieldDocs.length === 0) {
            fieldDocs = [
              {
                id: 'doc-fld-1',
                title: 'عکس نمای کلی برخورد و زاویه قرارگیری در محل حادثه',
                docType: 'عکس بازدید میدانی کارشناس',
                fileType: 'image',
                fileName: 'scene_overview.jpg',
                dataUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
                uploadedBy: claimCase.assignedFieldExpert?.name || 'مهندس کامران رستمی',
                uploaderRole: 'کارشناس رسمی میدانی',
                uploaderParty: 'EXPERT',
                uploadedAt: claimCase.date || '۱۴۰۳/۱۱/۲۰ ۱۰:۳۰',
                visibility: 'SHARED',
                note: 'بررسی زاویه برخورد و انطباق خطوط طولی در محل تصادف'
              },
              {
                id: 'doc-fld-2',
                title: 'عکس نمای نزدیک شکستگی پوسته و دیاق سپر جلو',
                docType: 'عکس بازدید میدانی کارشناس',
                fileType: 'image',
                fileName: 'bumper_damage.jpg',
                dataUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
                uploadedBy: claimCase.assignedFieldExpert?.name || 'مهندس کامران رستمی',
                uploaderRole: 'کارشناس رسمی میدانی',
                uploaderParty: 'EXPERT',
                uploadedAt: claimCase.date || '۱۴۰۳/۱۱/۲۰ ۱۰:۳۵',
                visibility: 'SHARED',
                note: 'شکستگی و دفرمگی شدید دیاق و پرچ‌های اتصال'
              },
              {
                id: 'doc-fld-3',
                title: 'عکس تطبیق شماره شاسی (VIN) فیزیکی با کارت ماشین',
                docType: 'عکس بازدید میدانی کارشناس',
                fileType: 'image',
                fileName: 'vin_plate_match.jpg',
                dataUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
                uploadedBy: claimCase.assignedFieldExpert?.name || 'مهندس کامران رستمی',
                uploaderRole: 'کارشناس رسمی میدانی',
                uploaderParty: 'EXPERT',
                uploadedAt: claimCase.date || '۱۴۰۳/۱۱/۲۰ ۱۰:۳۸',
                visibility: 'SHARED',
                note: 'شماره VIN فیزیکی خودرو روی شاسی بدون دست‌خوردگی تایید شد'
              },
              {
                id: 'doc-fld-4',
                title: 'عکس دفرمگی گلگیر و سینی جلو راست',
                docType: 'عکس بازدید میدانی کارشناس',
                fileType: 'image',
                fileName: 'fender_damage.jpg',
                dataUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
                uploadedBy: claimCase.assignedFieldExpert?.name || 'مهندس کامران رستمی',
                uploaderRole: 'کارشناس رسمی میدانی',
                uploaderParty: 'EXPERT',
                uploadedAt: claimCase.date || '۱۴۰۳/۱۱/۲۰ ۱۰:۴۲',
                visibility: 'SHARED',
                note: 'آسیب مستقیم حاصل از فشار سپر جلو به سمت گلگیر'
              }
            ];
          }

          // Standard items for field inspection or desk assessment if dynamic parts array is empty:
          const defaultFieldParts = [
            { id: 1, name: 'سپر جلو و متعلقات پوسته', operation: 'تعویض کامل قطعه', partPrice: 65000000, labor: 12000000, salvage: 4000000, total: 73000000, severity: 'major', note: 'شکستگی و پارگی دیاق داخلی' },
            { id: 2, name: 'گلگیر جلو راست (اصلی)', operation: 'صافکاری تخصصی و رنگ‌کوره', partPrice: 0, labor: 35000000, salvage: 0, total: 35000000, severity: 'moderate', note: 'دفرمگی لبه گلگیر با رنگ‌ریزی' },
            { id: 3, name: 'مجموعه چراغ جلو راست (LED)', operation: 'تعویض کامل قطعه', partPrice: 58000000, labor: 8000000, salvage: 3000000, total: 63000000, severity: 'major', note: 'شکستگی پایه‌ها و طلق چراغ' },
            { id: 4, name: 'سینی جلو و براکت‌های دیاق', operation: 'شاسی‌کشی و رفع دفرمگی', partPrice: 0, labor: 28000000, salvage: 0, total: 28000000, severity: 'moderate', note: 'انحراف خفیف براکت دیاق' },
            { id: 5, name: 'جلوپنجره و آرم', operation: 'تعویض قطعه', partPrice: 22000000, labor: 5000000, salvage: 1000000, total: 26000000, severity: 'minor', note: 'خراشیدگی و شکستگی خارها' },
            { id: 6, name: 'اجرت رنگ‌آمیزی و کوره پولیش', operation: 'نقاشی و آسترکشی', partPrice: 0, labor: 20000000, salvage: 0, total: 20000000, severity: 'minor', note: 'پوشش رنگ ۲ پوششه با کوره' }
          ];

          let dynamicParts: Array<any> = [];
          if (claimCase.assessment?.items && claimCase.assessment.items.length > 0) {
            dynamicParts = claimCase.assessment.items.map((item: any, idx: number) => ({
              id: idx + 1,
              name: item.partName || item.name,
              operation: item.operationType || (item.action === 'REPLACE' ? 'تعویض کامل قطعه' : 'صافکاری و نقاشی'),
              partPrice: item.price || item.partPrice || 0,
              labor: item.wage || item.repairPrice || item.labor || 0,
              salvage: item.scrapValue || item.salvageValue || 0,
              total: (item.price || item.partPrice || 0) + (item.wage || item.repairPrice || item.labor || 0) - (item.scrapValue || item.salvageValue || 0),
              severity: item.severity || 'moderate',
              note: item.note || ''
            }));
          } else if (claimCase.assessment?.parts && claimCase.assessment.parts.length > 0) {
            dynamicParts = claimCase.assessment.parts.map((p: any, idx: number) => ({
              id: idx + 1,
              name: p.name || p.partName,
              operation: p.type === 'replace' || p.operationType === 'تعویض کامل' ? 'تعویض کامل قطعه' : 'صافکاری و نقاشی',
              partPrice: p.partPrice || p.price || (p.type === 'replace' ? 45000000 : 0),
              labor: p.repairPrice || p.labor || 15000000,
              salvage: p.salvageValue || p.depreciation || 0,
              total: (p.partPrice || p.price || (p.type === 'replace' ? 45000000 : 0)) + (p.repairPrice || p.labor || 15000000) - (p.salvageValue || p.depreciation || 0),
              severity: p.severity || 'moderate',
              note: p.note || ''
            }));
          } else {
            dynamicParts = defaultFieldParts;
          }

          const carDamageSpotsData = (claimCase.carDamageSpots && Object.keys(claimCase.carDamageSpots).length > 0)
            ? claimCase.carDamageSpots
            : {
                front_bumper: {
                  type: 'نیاز به تعویض کامل',
                  severity: 'major',
                  operation: 'تعویض پوسته و دیاق',
                  color: 'red',
                  note: 'شکستگی عمیق پوسته و دیاق سپر جلو در اثر برخورد مستقیم'
                },
                fender_fr: {
                  type: 'تعمیر و صافکاری',
                  severity: 'moderate',
                  operation: 'صافکاری بی‌رنگ و لیسه‌گیری',
                  color: 'orange',
                  note: 'دفرمگی و خط و خش گلگیر جلو سمت راست'
                },
                hood: {
                  type: 'تعمیر و رگلاژ',
                  severity: 'minor',
                  operation: 'رگلاژ و لیسه‌گیری لبه کاپوت',
                  color: 'yellow',
                  note: 'برخورد سطحی لبه کاپوت موتور با فشار دیاق'
                }
              };

          // Build list of assessment cards to render
          const cards: Array<any> = [];

          // 1. Field Expert Assessment Card (If present, this is always the final/binding assessment)
          if (hasFieldAssessment) {
            cards.push({
              id: 'card_field_expert',
              type: 'FIELD_EXPERT',
              title: 'کارشناسی میدانی و بازرسی فیزیکی در محل حادثه (ارزیابی نهایی)',
              badge: 'بازدید حضوری و اصالت‌سنجی فیزیکی (رای قطعی)',
              expertName: claimCase.assignedFieldExpert?.name || claimCase.assessment?.assessorName || 'مهندس کامران رستمی (کارشناس رسمی میدانی)',
              expertRole: 'کارشناس رسمی بازدید میدانی بیمه',
              stampCode: claimCase.assignedFieldExpert?.nationalId ? `EXP-FLD-${claimCase.assignedFieldExpert.nationalId.slice(-4)}` : 'EXP-FLD-9821',
              date: claimCase.fieldExpertCompletedAt || claimCase.assessment?.submittedAt || '۱۴۰۳/۱۱/۲۰',
              verdict: claimCase.fieldExpertVerdict === 'FRAUD_REJECTED'
                ? 'رد اصالت - تصادف ساختگی و صوری'
                : claimCase.fieldExpertVerdict === 'PARTIAL_MISMATCH'
                ? 'عدم انطباق جزئی قطعات با صحنه تصادف'
                : 'عدم صوری بودن و تایید قطعی اصالت فیزیکی صحنه تصادف',
              verdictType: claimCase.fieldExpertVerdict === 'FRAUD_REJECTED' ? 'danger' : claimCase.fieldExpertVerdict === 'PARTIAL_MISMATCH' ? 'warning' : 'success',
              directDamage: calc.directDamageAmount || claimCase.assessment?.gross || 245000000,
              diminution: calc.diminutionAmount,
              diminutionPercent: calc.diminutionPercent,
              salvage: claimCase.assessment?.salvage || calc.franchiseAmount || 0,
              totalClaim: calc.totalClaimAmount,
              policyCeiling: calc.policyMaxFinancialLimit,
              insurerPayable: claimCase.assessment?.payable || calc.insurerPayablePortion || 245000000,
              culpritDebt: calc.culpritExcessDebt,
              exceedsCeiling: calc.exceedsCeiling,
              notes: claimCase.fieldExpertReportNote || claimCase.assessment?.reviewerNote || claimCase.assessment?.notes || 'بررسی فیزیکی صحنه تصادف، انطباق قطعات، ارتفاع برخورد و اصالت‌سنجی در محل حادثه با حضور طرفین انجام شد و آسیب‌ها به تایید رسید.',
              officialInsuranceMessage: isBodyClaim
                ? `بیمه‌گذار گرامی (${claimCase.victimName || claimCase.ownerName || 'محترم'})؛ گزارش کارشناسی خسارت بدنه پرونده ${claimCase.id} توسط کارشناس رسمی میدانی ثبت و به مبلغ ${formatCurrency(claimCase.assessment?.payable || calc.insurerPayablePortion || 245000000)} تایید گردید. لطفاً جهت واریز وجه، نظر کارشناس را تایید نموده و شماره شبا خود را ثبت فرمایید تا بلافاصله به کارتابل مدیر مالی ارجاع شود.`
                : `زیان‌دیده گرامی (${claimCase.victimName || 'پریسا'})؛ برآورد کارشناسی خسارت پرونده ${claimCase.id} به مبلغ ${formatCurrency(claimCase.assessment?.payable || calc.insurerPayablePortion || 245000000)} توسط شرکت بیمه تایید گردید. پوشش ۱۰۰٪ تعهد بیمه‌نامه اعمال شده و پس از تایید شماره شبا، مبلغ خسارت مستقیماً به حساب شما واریز خواهد شد.`,
              victimSms: calc.victimSmsText,
              culpritSms: calc.culpritSmsText,
              photos: fieldDocs,
              isFinal: true, // Field expert is final & binding per Central Insurance regulations
              isHistorical: false,
              parts: dynamicParts,
              damageSpots: carDamageSpotsData
            });
          }

          // 2. Damage Assessor Assessments (History and Current)
          if (claimCase.assessments && claimCase.assessments.length > 0) {
            claimCase.assessments.forEach((a, idx) => {
              const payableAmt = a.payable || calc.insurerPayablePortion;
              const isLatestInList = idx === claimCase.assessments!.length - 1;
              const isObjectedStatus = Boolean(a.status?.includes('مورد اعتراض') || a.status === 'REJECTED');
              // A card is historical if:
              // - Field assessment exists (all desk assessments become historical)
              // - Not the latest in the list
              // - Explicitly marked as objected to
              // - Latest card but customer already protested and is waiting for a new assessment
              const isHistorical = Boolean(
                hasFieldAssessment ||
                !isLatestInList ||
                isObjectedStatus ||
                (isLatestInList && isWaitingForNewAssessment)
              );

              const roundNum = a.roundIdx || idx + 1;
              const roundTitle = a.round || `ارزیابی نوبت ${roundNum}`;

              cards.push({
                id: `card_desk_assessor_${idx}`,
                type: 'DAMAGE_ASSESSOR',
                title: isHistorical
                  ? `کارشناسی ارزیاب خسارت (${roundTitle} - سوابق قبلی)`
                  : `کارشناسی ارزیاب خسارت (${roundTitle} - برآورد جاری)`,
                badge: isHistorical
                  ? `ارزیابی نوبت ${roundNum} (مورد اعتراض / باطله - فقط‌خواندنی)`
                  : `ارزیابی نوبت ${roundNum} (جاری و فعال)`,
                version: roundNum,
                expertName: a.expertName || claimCase.assignedExpert?.name || 'فاطمه احمدی',
                expertRole: 'کارشناس ارزیاب خسارت خودرو',
                stampCode: `EXP-ONL-${8300 + idx}`,
                date: a.submittedAt || '۱۴۰۳/۱۱/۱۸',
                verdict: isHistorical ? 'مورد اعتراض زیان‌دیده و ارجاع به کارشناسی نوبت بعد' : 'تایید کیفیت برآورد خسارت توسط بازبین ارشد بیمه‌گر',
                verdictType: isHistorical ? 'warning' : 'info',
                directDamage: a.gross || calc.directDamageAmount,
                diminution: calc.diminutionAmount,
                diminutionPercent: calc.diminutionPercent,
                salvage: a.deductions || calc.franchiseAmount || 0,
                totalClaim: (a.gross || calc.directDamageAmount) + calc.diminutionAmount - (a.deductions || 0),
                policyCeiling: calc.policyMaxFinancialLimit,
                insurerPayable: payableAmt,
                culpritDebt: calc.culpritExcessDebt,
                exceedsCeiling: calc.exceedsCeiling,
                notes: a.reviewerNote || claimCase.assessment?.reviewerNote || 'برآورد هزینه تعویض و تعمیر قطعات با استعلام نرخ روز بازار و دستمزد اتحادیه',
                officialInsuranceMessage: `زیان‌دیده گرامی (${claimCase.victimName || 'پریسا'})؛ برآورد خسارت پرونده ${claimCase.id} به مبلغ ${formatCurrency(payableAmt)} به تایید بازبین ارشد بیمه رسید. جهت دریافت خسارت، لطفاً شماره شبا را تایید نمایید.`,
                victimSms: calc.victimSmsText,
                culpritSms: calc.culpritSmsText,
                photos: [],
                isFinal: isHistorical ? false : Boolean(claimCase.isFinalDecision || claimCase.status === 'تصمیم نهایی - غیرقابل اعتراض'),
                isHistorical: isHistorical,
                objectionStage: claimCase.objectionStage || 0,
                roundVersion: roundNum,
                parts: (a.parts && a.parts.length > 0) ? a.parts : dynamicParts,
                damageSpots: carDamageSpotsData
              });
            });
          } else if (claimCase.assessment && isDeskAssessmentCompleted && !hasFieldAssessment) {
            const isHistorical = Boolean(isWaitingForNewAssessment && (claimCase.objectionStage || 0) >= 1);
            const payableAmt = claimCase.assessment.payable || calc.insurerPayablePortion;
            const currentRound = claimCase.assessment.version ? Number(claimCase.assessment.version) : 1;

            cards.push({
              id: 'card_desk_assessor_main',
              type: 'DAMAGE_ASSESSOR',
              title: isHistorical
                ? `کارشناسی ارزیاب خسارت (ارزیابی نوبت ${currentRound} - سوابق قبلی)`
                : `کارشناسی ارزیاب خسارت (ارزیابی نوبت ${currentRound} - برآورد جاری)`,
              badge: isHistorical
                ? `ارزیابی تخصصی میزی - نوبت ${currentRound} (مورد اعتراض - فقط‌خواندنی)`
                : `ارزیابی تخصصی میزی - نوبت ${currentRound} (جاری و فعال)`,
              version: currentRound,
              expertName: claimCase.assignedExpert?.name || claimCase.assessment.submittedBy || 'فاطمه احمدی',
              expertRole: 'کارشناس ارزیاب خسارت خودرو',
              stampCode: 'EXP-ONL-8340',
              date: claimCase.assessment.submittedAt || '۱۴۰۳/۱۱/۱۸',
              verdict: isHistorical ? 'مورد اعتراض زیان‌دیده و ارجاع به کارشناسی نوبت بعد' : 'تایید شده توسط بازبین ارشد شرکت بیمه',
              verdictType: isHistorical ? 'warning' : 'info',
              directDamage: claimCase.assessment.gross || calc.directDamageAmount,
              diminution: calc.diminutionAmount,
              diminutionPercent: calc.diminutionPercent,
              salvage: claimCase.assessment.salvage || calc.franchiseAmount,
              totalClaim: calc.totalClaimAmount,
              policyCeiling: calc.policyMaxFinancialLimit,
              insurerPayable: payableAmt,
              culpritDebt: calc.culpritExcessDebt,
              exceedsCeiling: calc.exceedsCeiling,
              notes: claimCase.assessment.reviewerNote || 'برآورد هزینه‌های فیزیکی و دستمزد بر اساس نرخ‌های مصوب سندیکای بیمه‌گران',
              officialInsuranceMessage: `زیان‌دیده گرامی (${claimCase.victimName || 'پریسا'})؛ برآورد خسارت پرونده ${claimCase.id} به مبلغ ${formatCurrency(payableAmt)} به تایید بازبین ارشد بیمه رسید. جهت دریافت خسارت، لطفاً شماره شبا را تایید نمایید.`,
              victimSms: calc.victimSmsText,
              culpritSms: calc.culpritSmsText,
              photos: [],
              isFinal: Boolean(claimCase.isFinalDecision || claimCase.status === 'تصمیم نهایی - غیرقابل اعتراض'),
              isHistorical: isHistorical,
              objectionStage: claimCase.objectionStage || 0,
              roundVersion: currentRound,
              parts: (claimCase.assessment.parts && claimCase.assessment.parts.length > 0) ? claimCase.assessment.parts : dynamicParts,
              damageSpots: carDamageSpotsData
            });
          }

          if (cards.length === 0) return null;

          return (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      کارت‌های کارشناسی و ابلاغیه ارزیابی خسارت پرونده
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      برآورد کارشناسی، تفکیک افت ارزش و داغی، سقف تعهد بیمه‌نامه و وضعیت بدهی مقصر به شرح زیر است.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 font-extrabold text-xs rounded-full border border-slate-200">
                  {cards.length} کارت کارشناسی
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {cards.map((card) => {
                  const isField = card.type === 'FIELD_EXPERT';
                  const directDamage = Number(card.directDamage || 0);
                  const diminution = Number(card.diminution || 0);
                  const diminutionPercent = Number(card.diminutionPercent || 0);
                  const salvage = Number(card.salvage || 0);
                  
                  // فرمول دقیق: کل خسارت = (خسارت مستقیم + افت ارزش خودرو) - کسر داغی
                  const totalClaim = Math.max(0, (directDamage + diminution) - salvage);
                  // سقف تعهد مالی بیمه‌نامه مقصر از استعلام برخط سنهاب
                  const policyCeiling = Number(card.policyCeiling || calc.policyMaxFinancialLimit || 50000000);
                  // بیمه حداکثر تا سقف تعهد مالی پرداخت می‌کند
                  const insurerPayable = Math.min(totalClaim, policyCeiling);
                  // اگر خسارت بیش از سقف باشد، مابقی بدهی مقصر به زیان‌دیده است
                  const culpritDebt = Math.max(0, totalClaim - policyCeiling);
                  const exceedsCeiling = totalClaim > policyCeiling;

                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedAssessmentModal({
                        ...card,
                        directDamage,
                        diminution,
                        diminutionPercent,
                        salvage,
                        totalClaim,
                        policyCeiling,
                        insurerPayable,
                        culpritDebt,
                        exceedsCeiling
                      })}
                      className={`rounded-3xl border-2 transition-all shadow-xs hover:shadow-md overflow-hidden cursor-pointer ${
                        isField
                          ? 'bg-gradient-to-br from-sky-50/70 via-blue-50/30 to-white border-sky-200/90 hover:border-sky-400 hover:ring-2 hover:ring-sky-200/50'
                          : 'bg-gradient-to-br from-slate-50/70 via-blue-50/30 to-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {/* Card Header */}
                      <div className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isField ? 'border-sky-100 bg-sky-50/80' : 'border-indigo-100 bg-indigo-100/40'
                      }`}>
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                            isField ? 'bg-sky-600' : 'bg-indigo-600'
                          }`}>
                            {isField ? <UserCheck className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                                {card.title}
                              </h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                isField
                                  ? 'bg-sky-100 text-sky-900 border-sky-200'
                                  : 'bg-indigo-200/80 text-indigo-900 border-indigo-300'
                              }`}>
                                {card.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 font-medium">
                              کارشناس: <strong>{card.expertName}</strong> ({card.expertRole}) • کد پروانه: <span className="font-mono">{card.stampCode}</span> • تاریخ: <span className="font-mono">{card.date}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                          {exceedsCeiling ? (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>مازاد بر سقف ({formatCurrency(culpritDebt)} بدهی مقصر)</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>پوشش ۱۰۰٪ در سقف بیمه‌نامه</span>
                            </span>
                          )}

                          {isField ? (
                            <span className="px-3 py-1 bg-sky-600 text-white rounded-full text-xs font-black shadow-xs flex items-center gap-1 border border-sky-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-100" />
                              {card.verdict}
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-black shadow-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {card.verdict}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 sm:p-6 space-y-4">
                        
                        {/* Financial Metrics Summary for THIS Assessment */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-bold flex items-center gap-1.5 text-slate-700">
                              <DollarSign className="w-4 h-4 text-indigo-600" />
                              <span>محاسبه و تفکیک خسارت، سقف تعهد بیمه‌نامه و وضعیت بدهی:</span>
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              استعلام سنهاب • بیمه‌گر مقصر: {getInsurerPersianName(claimCase.culpritInsurer)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                              <span className="text-slate-500 block mb-1 font-bold text-[11px]">خسارت فیزیکی و اجرت</span>
                              <span className="font-bold text-slate-800 text-xs sm:text-sm font-mono">
                                {formatCurrency(directDamage)}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-slate-500 font-bold text-[11px]">افت ارزش خودرو</span>
                                {diminutionPercent > 0 && (
                                  <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-300">
                                    {diminutionPercent}%
                                  </span>
                                )}
                              </div>
                              <span className={`font-bold text-xs sm:text-sm font-mono ${diminution > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                {diminution > 0 ? formatCurrency(diminution) : 'شامل نمی‌شود'}
                              </span>
                            </div>

                            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                              <span className="text-slate-500 block mb-1 font-bold text-[11px]">کسر داغی / استهلاک</span>
                              <span className="font-bold text-rose-700 text-xs sm:text-sm font-mono">
                                {salvage > 0 ? `-${formatCurrency(salvage)}` : '۰ ریال'}
                              </span>
                            </div>

                            <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-200 shadow-2xs">
                              <span className="text-indigo-900 block mb-1 font-extrabold text-[11px]">مجموع کل خسارت</span>
                              <span className="font-black text-indigo-950 text-xs sm:text-sm font-mono">
                                {formatCurrency(totalClaim)}
                              </span>
                            </div>

                            <div className="bg-emerald-50 p-3 rounded-2xl border-2 border-emerald-400 shadow-2xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-emerald-900 font-extrabold text-[11px]">سهم بیمه (تا سقف)</span>
                              </div>
                              <span className="font-black text-emerald-800 text-xs sm:text-sm font-mono">
                                {formatCurrency(insurerPayable)}
                              </span>
                              <span className="text-[9px] text-emerald-700 block mt-0.5">
                                سقف: {formatCurrency(policyCeiling)}
                              </span>
                            </div>

                            <div className={`p-3 rounded-2xl border-2 shadow-2xs ${
                              culpritDebt > 0 
                                ? 'border-rose-400 bg-rose-50 text-rose-950' 
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}>
                              <span className={`block mb-1 font-bold text-[11px] ${
                                culpritDebt > 0 ? 'text-rose-800' : 'text-slate-500'
                              }`}>
                                بدهی مازاد مقصر
                              </span>
                              <span className={`font-black text-xs sm:text-sm font-mono ${
                                culpritDebt > 0 ? 'text-rose-700' : 'text-slate-500'
                              }`}>
                                {culpritDebt > 0 ? formatCurrency(culpritDebt) : 'فاقد بدهی مازاد'}
                              </span>
                              {culpritDebt > 0 && (
                                <span className="text-[9px] text-rose-600 font-bold block mt-0.5">
                                  پرداخت مستقیم توسط مقصر
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Official Insurance Announcement Banner (Directly inside Card) */}
                        <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                          isField
                            ? 'bg-sky-50/80 border-sky-200 text-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}>
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-900">
                              <MessageSquare className={`w-4 h-4 ${isField ? 'text-sky-700' : 'text-indigo-600'} shrink-0`} />
                              <span>ابلاغیه رسمی شرکت بیمه برای این ارزیابی</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                              isField ? 'bg-sky-100 text-sky-900 border-sky-200' : 'bg-slate-200 text-slate-800 border-slate-300'
                            }`}>
                              {isVictim ? 'مخاطب: زیان‌دیده' : 'مخاطب: راننده مقصر'}
                            </span>
                          </div>

                          {isVictim ? (
                            <div className="space-y-1.5 text-slate-700 leading-relaxed">
                              <p>
                                زیان‌دیده گرامی ({claimCase.victimName || 'محترم'})؛ مجموع خسارت فیزیکی و افت ارزش خودروی شما پس از کسر داغی در این ارزیابی به مبلغ <strong className="text-slate-950 font-mono">{formatCurrency(totalClaim)}</strong> برآورد گردید.
                              </p>
                              <p className="text-emerald-800 font-medium bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                                <strong>سهم پرداختی بیمه:</strong> مبلغ <strong className="font-mono">{formatCurrency(insurerPayable)}</strong> (حداکثر تا سقف تعهد مالی بیمه‌نامه شخص ثالث مقصر) پس از تایید شماره شبا، مستقیماً به حساب شما واریز خواهد شد.
                              </p>
                              {culpritDebt > 0 && (
                                <p className="text-rose-900 font-medium bg-rose-50/80 p-2 rounded-xl border border-rose-200">
                                  <strong>بدهی مازاد مقصر:</strong> مبلغ <strong className="font-mono">{formatCurrency(culpritDebt)}</strong> مازاد بر سقف بیمه‌نامه بوده و بر اساس قانون بیمه شخص ثالث، بدهی قطعی راننده مقصر ({claimCase.culpritName || 'راننده مقصر'}) به شما می‌باشد و مستقیماً توسط مقصر قابل پرداخت است.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1.5 text-slate-700 leading-relaxed">
                              <p>
                                راننده مقصر گرامی ({claimCase.culpritName || 'محترم'})؛ مجموع خسارت وارده به زیان‌دیده ({claimCase.victimName || 'زیان‌دیده'}) در این ارزیابی مبلغ <strong className="text-slate-950 font-mono">{formatCurrency(totalClaim)}</strong> محاسبه شده است.
                              </p>
                              <p className="text-emerald-800 font-medium bg-emerald-50/80 p-2 rounded-xl border border-emerald-200">
                                شرکت بیمه {getInsurerPersianName(claimCase.culpritInsurer)} تا سقف تعهد مالی بیمه‌نامه شما (مبلغ <strong className="font-mono">{formatCurrency(insurerPayable)}</strong>) را به زیان‌دیده پرداخت می‌نماید.
                              </p>
                              {culpritDebt > 0 ? (
                                <p className="text-rose-900 font-medium bg-rose-50/80 p-2 rounded-xl border border-rose-200">
                                  <strong>بدهی مازاد شما:</strong> مبلغ <strong className="font-mono">{formatCurrency(culpritDebt)}</strong> مازاد بر سقف تعهد بیمه‌نامه بوده و بدهی شخصی شما به زیان‌دیده است که باید مستقیماً با ایشان تسویه نمایید.
                                </p>
                              ) : (
                                <p className="text-emerald-800 font-medium">
                                  کل خسارت در سقف تعهدات بیمه‌نامه شما پوشش یافته و فاقد هرگونه بدهی مازاد می‌باشید.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Field Expert Recorded Details (Interactive Multi-Tab Viewer: 2D Model, Photos, Descriptions, Parts, Branch) */}
                        {isField && (
                          <div className="space-y-3 pt-2">
                            {/* Inline Tab Navigation */}
                            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineFieldTab('2d_model');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                                  inlineFieldTab === '2d_model'
                                    ? 'bg-sky-600 text-white shadow-xs font-black'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>مدل ۲بعدی و سه‌بعدی خودرو</span>
                                {card.damageSpots && Object.keys(card.damageSpots).length > 0 && (
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                                    inlineFieldTab === '2d_model' ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {Object.keys(card.damageSpots).length}
                                  </span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineFieldTab('photos');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                                  inlineFieldTab === 'photos'
                                    ? 'bg-sky-600 text-white shadow-xs font-black'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>عکس‌ها و فیلم‌های میدانی</span>
                                {card.photos && card.photos.length > 0 && (
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                                    inlineFieldTab === 'photos' ? 'bg-sky-800 text-white' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {card.photos.length}
                                  </span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineFieldTab('report');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                                  inlineFieldTab === 'report'
                                    ? 'bg-sky-600 text-white shadow-xs font-black'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>تشریحات و اصالت‌سنجی</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineFieldTab('parts');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                                  inlineFieldTab === 'parts'
                                    ? 'bg-sky-600 text-white shadow-xs font-black'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>جدول تفکیکی قطعات ({card.parts?.length || 0})</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInlineFieldTab('branch_sms');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                                  inlineFieldTab === 'branch_sms'
                                    ? 'bg-sky-600 text-white shadow-xs font-black'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                }`}
                              >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>شعبه و پیامک</span>
                              </button>
                            </div>

                            {/* Tab 1: 2D & 3D Car Model */}
                            {inlineFieldTab === '2d_model' && (
                              <div className="p-4 rounded-2xl bg-white border border-sky-200 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-sky-600" />
                                    <span className="font-black text-xs text-slate-900">
                                      مدل دوبعدی و وضعیت قطعات آسیب‌دیده (ثبت‌شده توسط کارشناس میدانی):
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                                    {Object.keys(card.damageSpots || {}).length} قطعه علامت‌گذاری‌شده
                                  </span>
                                </div>

                                {/* Embedded Interactive Car 3D Viewer */}
                                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 text-white p-2">
                                  <Car3DViewer
                                    caseId={claimCase.id}
                                    damageData={card.damageSpots || {}}
                                    editable={false}
                                  />
                                </div>

                                {/* Part Badges List */}
                                {card.damageSpots && Object.keys(card.damageSpots).length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {Object.entries(card.damageSpots).map(([spotKey, spotVal]: [string, any]) => {
                                      const partLabelMap: Record<string, string> = {
                                        front_bumper: 'سپر جلو',
                                        fender_fr: 'گلگیر جلو راست',
                                        fender_fl: 'گلگیر جلو چپ',
                                        hood: 'درب موتور (کاپوت)',
                                        headlight_r: 'چراغ جلو راست',
                                        headlight_l: 'چراغ جلو چپ',
                                        door_fr: 'درب جلو راست',
                                        door_fl: 'درب جلو چپ',
                                        door_rr: 'درب عقب راست',
                                        door_rl: 'درب عقب چپ',
                                        rear_bumper: 'سپر عقب',
                                        trunk: 'درب صندوق عقب',
                                        roof: 'سقف خودرو',
                                        windshield_front: 'شیشه جلو',
                                        windshield_rear: 'شیشه عقب'
                                      };
                                      const partName = partLabelMap[spotKey] || spotKey;
                                      return (
                                        <div
                                          key={spotKey}
                                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                                            spotVal?.color === 'red' || spotVal?.severity === 'major'
                                              ? 'bg-rose-50 border-rose-200 text-rose-800'
                                              : spotVal?.color === 'orange' || spotVal?.severity === 'moderate'
                                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                                              : 'bg-yellow-50 border-yellow-200 text-yellow-900'
                                          }`}
                                        >
                                          <span className={`w-2 h-2 rounded-full ${
                                            spotVal?.color === 'red' || spotVal?.severity === 'major'
                                              ? 'bg-rose-600'
                                              : spotVal?.color === 'orange' || spotVal?.severity === 'moderate'
                                              ? 'bg-amber-500'
                                              : 'bg-yellow-500'
                                          }`} />
                                          <span>{partName}</span>
                                          <span className="opacity-70 text-[10px]">({spotVal?.type || spotVal?.operation})</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Tab 2: Photos Gallery */}
                            {inlineFieldTab === 'photos' && (
                              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                                    <Camera className="w-4 h-4 text-sky-700" />
                                    <span>عکس‌ها و مستندات ثبت‌شده در بازدید میدانی ({card.photos?.length || 0} تصویر):</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500">برای بزرگ‌نمایی روی هر عکس کلیک کنید</span>
                                </div>

                                {card.photos && card.photos.length > 0 ? (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {card.photos.map((ph: any, phIdx: number) => {
                                      const pSrc = ph.dataUrl || ph.url || '';
                                      return (
                                        <div
                                          key={phIdx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (pSrc) setPreviewImageModal(pSrc);
                                          }}
                                          className="aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 relative group shadow-2xs"
                                        >
                                          <img src={pSrc} alt={ph.title} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold p-1 text-center">
                                            <span>{ph.title}</span>
                                            <span className="text-[8px] opacity-75 font-normal">کلیک جهت مشاهده کامل</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 py-3 text-center">عکسی برای این ارزیابی ثبت نشده است.</p>
                                )}
                              </div>
                            )}

                            {/* Tab 3: Technical Report & Descriptions */}
                            {inlineFieldTab === 'report' && (
                              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                                  <FileText className="w-4 h-4 text-slate-700" />
                                  <span>مشاهدات فنی و تشریحات ثبت‌شده کارشناس میدانی:</span>
                                </div>
                                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium space-y-2">
                                  <p>{card.notes || 'توضیحات تکمیلی توسط کارشناس ثبت شده است.'}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>انطباق فیزیکی خسارت با شرح حادثه احراز گردید.</span>
                                  </div>
                                  <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 font-bold flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                                    <span>شماره شاسی و اصالت قطعات خودرو تایید شد.</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Tab 4: Parts Breakdown Table */}
                            {inlineFieldTab === 'parts' && (
                              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                                    <FileSpreadsheet className="w-4 h-4 text-sky-700" />
                                    <span>جدول تفکیکی قطعات تعویضی و اجرت صافکاری/نقاشی:</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                                    {card.parts?.length || 0} ردیف قطعه
                                  </span>
                                </div>

                                {card.parts && card.parts.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-right text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold text-[11px]">
                                          <th className="py-2 px-2.5">نام قطعه / بخش</th>
                                          <th className="py-2 px-2.5">نوع عملیات</th>
                                          <th className="py-2 px-2.5">قیمت قطعه (ریال)</th>
                                          <th className="py-2 px-2.5">اجرت کار (ریال)</th>
                                          <th className="py-2 px-2.5">کسر داغی (ریال)</th>
                                          <th className="py-2 px-2.5">مبلغ نهایی (ریال)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                                        {card.parts.map((pt: any, ptIdx: number) => (
                                          <tr key={ptIdx} className="hover:bg-slate-50">
                                            <td className="py-2 px-2.5 font-bold">{pt.partName || pt.name}</td>
                                            <td className="py-2 px-2.5">
                                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                pt.operationType === 'تعویض' || pt.action === 'replace'
                                                  ? 'bg-rose-100 text-rose-800'
                                                  : 'bg-amber-100 text-amber-900'
                                              }`}>
                                                {pt.operationType || (pt.action === 'replace' ? 'تعویض' : 'تعمیر و صافکاری')}
                                              </span>
                                            </td>
                                            <td className="py-2 px-2.5 font-mono">{formatCurrency(pt.partCost || pt.price || 0)}</td>
                                            <td className="py-2 px-2.5 font-mono">{formatCurrency(pt.laborCost || pt.wage || 0)}</td>
                                            <td className="py-2 px-2.5 font-mono text-rose-600">{pt.salvageDeduction ? `-${formatCurrency(pt.salvageDeduction)}` : '۰'}</td>
                                            <td className="py-2 px-2.5 font-mono font-bold text-sky-950">
                                              {formatCurrency((pt.totalCost || (Number(pt.partCost || pt.price || 0) + Number(pt.laborCost || pt.wage || 0) - Number(pt.salvageDeduction || 0))))}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                      <tfoot>
                                        <tr className="bg-sky-50 font-black text-xs border-t-2 border-sky-300 text-sky-950">
                                          <td colSpan={5} className="py-2.5 px-2.5 text-left">مجموع مبلغ مصوب کارشناسی:</td>
                                          <td className="py-2.5 px-2.5 font-mono text-sm">{formatCurrency(card.insurerPayable)}</td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 py-3 text-center">جزئیات اقلام قطعات در دسترس نیست.</p>
                                )}
                              </div>
                            )}

                            {/* Tab 5: Branch & SMS Info */}
                            {inlineFieldTab === 'branch_sms' && (
                              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                                  <Building2 className="w-4 h-4 text-sky-700" />
                                  <span>اطلاعات شعبه تخصصی بیمه و هماهنگی پیامکی:</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                    <span className="font-bold text-slate-500 text-[11px] block">شعبه تخصیص‌یافته:</span>
                                    <div className="font-black text-slate-900">
                                      {claimCase.assignedBranch?.name || 'شعبه مرکزی و تخصصی خسارت'}
                                    </div>
                                    <div className="text-[11px] text-slate-600">
                                      {claimCase.assignedBranch?.address || 'تهران، خیابان آزادی، نبش خیابان بهبودی، مجتمع تخصصی خسارت خودرو'}
                                    </div>
                                  </div>
                                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1.5 text-sky-950">
                                    <span className="font-bold text-sky-800 text-[11px] block">ارسال پیامک هماهنگی:</span>
                                    <div className="flex items-center gap-1.5 font-extrabold text-[11px] text-emerald-700">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>پیامک آدرس شعبه برای زیان‌دیده و کارشناس ارسال شده است.</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                      زمان حضور و هماهنگی: {typeof claimCase.fieldVisitSchedule === 'string'
                                        ? claimCase.fieldVisitSchedule
                                        : (claimCase.fieldVisitSchedule?.scheduledDate
                                            ? `${claimCase.fieldVisitSchedule.scheduledDate} ${claimCase.fieldVisitSchedule.scheduledTime ? `ساعت ${claimCase.fieldVisitSchedule.scheduledTime}` : ''}`.trim()
                                            : 'هماهنگ‌شده با طرفین')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Direct Approval and Payment Actions on Card */}
                        {card.isHistorical ? (
                          <div className="space-y-3 pt-1">
                            <div className="p-3.5 bg-slate-100/90 border border-slate-300 rounded-2xl text-xs text-slate-800 space-y-1.5 shadow-2xs">
                              <div className="flex items-center gap-2 font-black text-slate-900">
                                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                                <span>ارزیابی گذشته و باطله (صرفاً جهت اطلاع از سوابق پرونده)</span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                این ارزیابی مربوط به مراحل قبلی بوده و مورد اعتراض قرار گرفته و ارزیابی جدید جایگزین آن گردیده است. امکان اعتراض مجدد، انتخاب تعمیرگاه یا تایید شماره شبا بر روی کارت‌های گذشته وجود ندارد و کلیه اقدامات صرفاً روی «آخرین برآورد رسمی» فعال می‌باشد.
                              </p>
                            </div>

                            {/* Secondary Button to View Details Modal */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssessmentModal(card);
                              }}
                              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>مشاهده ریز اقلام و سوابق این ارزیابی</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-bold">مشاهده سوابق ↵</span>
                            </button>
                          </div>
                        ) : isField ? (
                          <div className="space-y-3 pt-1">
                            <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs text-sky-950 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-2 font-black text-sky-900">
                                <Lock className="w-4 h-4 text-sky-700 shrink-0" />
                                <span>ضوابط قانونی بیمه مرکزی: ارزیابی میدانی قطعی و نهایی است</span>
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                                طبق ضوابط بیمه مرکزی، ارزیابی کارشناس میدانی بر اساس بازرسی فیزیکی حضوری در محل حادثه انجام پذیرفته و قطعی و نهایی می‌باشد. لطفاً جهت واریز خسارت مصوب، اطلاعات شماره شبا خود را تایید فرمایید.
                              </p>
                            </div>

                            {isVictim && claimCase.status !== 'پرداخت شده' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowForm(true);
                                  setTimeout(() => {
                                    document.getElementById('iban-section')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 50);
                                }}
                                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-sky-700"
                              >
                                <CreditCard className="w-4.5 h-4.5 text-white" />
                                تایید برآورد کارشناسی و ثبت شماره شبا (جهت واریز وجه خسارت)
                              </button>
                            )}

                            {isCulprit && (
                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-center gap-2 font-bold">
                                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                                <span>نقش شما: مقصر حادثه. مراحل ثبت شماره شبا و دریافت خسارت توسط زیان‌دیده انجام می‌گردد.</span>
                              </div>
                            )}

                            {/* Secondary Button to View Details Modal */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalActiveTab('2d_model');
                                setSelectedAssessmentModal(card);
                              }}
                              className="w-full py-3 px-4 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-950 font-black text-xs flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                            >
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-sky-700" />
                                <span>مشاهده مدل ۲بعدی، عکس‌ها، تشریحات و ریز اقلام کارشناسی</span>
                              </div>
                              <span className="text-[11px] text-sky-800 font-extrabold bg-white px-2.5 py-1 rounded-lg border border-sky-200">
                                باز کردن پنل جامع جزئیات ↵
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 pt-1">
                            {isCulprit && (
                              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                                <div className="flex items-center gap-1.5 font-black text-amber-950">
                                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>وضعیت برای مقصر حادثه (صرفاً مشاهده‌کننده)</span>
                                </div>
                                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                                  شما به عنوان مقصر حادثه، صرفاً دسترسی مشاهده مبالغ تعهد بیمه و سوابق را دارید. ثبت شماره شبا، تایید برآورد و اعتراض به ارزیابی منحصراً در اختیار زیان‌دیده حادثه می‌باشد.
                                </p>
                              </div>
                            )}

                            {isVictim && claimCase.status === 'پرداخت شده' && (
                              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 flex items-center gap-2 font-black">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>خسارت این پرونده با موفقیت پرداخت و تسویه گردید.</span>
                              </div>
                            )}

                            {isVictim && claimCase.status !== 'پرداخت شده' && isWaitingForNewAssessment && (
                              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1.5 shadow-2xs">
                                <div className="flex items-center gap-2 font-black text-amber-950">
                                  <Clock className="w-4.5 h-4.5 text-amber-600 shrink-0 animate-pulse" />
                                  <span>پرونده در دست اقدام و ارزیابی مجدد توسط کارشناس بیمه</span>
                                </div>
                                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                                  اعتراض شما با موفقیت ثبت شده و پرونده در دست بررسی و ارزیابی مجدد توسط کارشناس ارزیاب بعدی قرار دارد. تا زمان ثبت و ابلاغ برآورد جدید، امکان اعتراض مجدد، معرفی تعمیرگاه یا ثبت شماره شبا وجود ندارد.
                                </p>
                              </div>
                            )}

                            {isVictim && claimCase.status !== 'پرداخت شده' && !isWaitingForNewAssessment && (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowForm(true);
                                    setTimeout(() => {
                                      document.getElementById('iban-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 50);
                                  }}
                                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                >
                                  <CreditCard className="w-4.5 h-4.5" />
                                  <span>
                                    {card.roundVersion > 1
                                      ? `تایید برآورد کارشناسی ارزیاب دوم (نوبت ${card.roundVersion}) و ثبت شماره شبا (جهت واریز وجه)`
                                      : 'تایید برآورد خسارت و ثبت شماره شبا (جهت واریز وجه)'}
                                  </span>
                                </button>

                                {/* Sequential Non-Retroactive Objections */}
                                {!card.isFinal && (
                                  <>
                                    {/* Round 1 assessment: Stage 1 Objection */}
                                    {card.roundVersion <= 1 && (!claimCase.objectionStage || claimCase.objectionStage === 0) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowObjection1Modal(true);
                                        }}
                                        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                      >
                                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                                        اعتراض به ارزیابی اولیه (مرحله ۱ - ارجاع به کارشناس دوم)
                                      </button>
                                    )}

                                    {/* Round 2 assessment: Stage 2 Objection & Workshop Registration */}
                                    {(card.roundVersion === 2 || claimCase.objectionStage === 1) && (
                                      <div className="space-y-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowWorkshopModal(true);
                                          }}
                                          className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                        >
                                          <Building2 className="w-4 h-4 text-indigo-600" />
                                          اعتراض به ارزیابی دوم (مرحله ۲ - ثبت اطلاعات تعمیرگاه مورد نظر / فاکتور)
                                        </button>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowObjection2Modal(true);
                                          }}
                                          className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                        >
                                          <MessageSquare className="w-4 h-4 text-amber-600" />
                                          گفتگو و ارسال مدارک تکمیلی به کارشناس ارزیاب دوم
                                        </button>
                                      </div>
                                    )}

                                    {/* Round 3 assessment / Field Visit Request */}
                                    {(card.roundVersion >= 3 || (claimCase.objectionStage && claimCase.objectionStage >= 2) || Boolean(claimCase.workshopInfo)) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRequestFieldInspector();
                                        }}
                                        className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                                      >
                                        <UserCheck className="w-4 h-4 text-purple-600" />
                                        درخواست ارزیابی میدانی / مراجعه حضوری به شعبه شرکت بیمه
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {/* Secondary Button to View Details Modal */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssessmentModal(card);
                              }}
                              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span>مشاهده ریز اقلام و فاکتور تفکیکی قطعات (اختیاری)</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-bold">مشاهده اقلام ↵</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Interactive Objection Chat Component (Stage 2 Chat with Assessor 2) */}
        {(claimCase.objectionChat || claimCase.objectionStage === 2) && (
          <div className="bg-white rounded-2xl border-2 border-blue-900 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-900" />
                <h4 className="font-extrabold text-blue-950 text-xs sm:text-sm">
                  گفتگو و ارسال مدارک درخواستی با ارزیاب خسارت ({claimCase.assignedExpert?.name || 'ارزیاب پرونده'})
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                گفتگوی فعال ارزیابی
              </span>
            </div>

            {/* Chat Message Stream */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {(!claimCase.objectionChat || claimCase.objectionChat.length === 0) ? (
                <p className="text-center text-xs text-slate-500 py-4 font-medium">پیامی در کانال چت ثبت نشده است.</p>
              ) : (
                claimCase.objectionChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === 'customer' ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'customer'
                          ? 'bg-blue-900 text-white rounded-tl-none border border-blue-950'
                          : 'bg-white text-slate-900 border-2 border-amber-400 rounded-tr-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 mb-1 font-bold">
                        <span>{msg.name}</span>
                        <span className="font-mono">{msg.time}</span>
                      </div>
                      <p className="font-medium">{msg.text}</p>
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.files.map((f: any, fileIdx: number) => {
                            const imgSrc = typeof f === 'string' ? f : (f?.dataUrl || '');
                            return (
                              <img
                                key={fileIdx}
                                src={imgSrc}
                                alt="مدرک ارسالی"
                                className="max-h-48 rounded-lg border-2 border-amber-300 object-cover cursor-pointer hover:opacity-90 shadow-md"
                                onClick={() => setPreviewImageModal(imgSrc)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected File Preview Badge */}
            {chatSelectedFile && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border-2 border-amber-400 text-xs text-amber-950 font-bold">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>تصویر مدرک انتخاب شده است</span>
                  <img src={chatSelectedFile} className="w-10 h-10 rounded-lg object-cover border-2 border-amber-400" alt="پیش‌نمایش" />
                </div>
                <button
                  type="button"
                  onClick={() => setChatSelectedFile(null)}
                  className="text-rose-600 font-black hover:text-rose-700 px-2 py-1 bg-white rounded-lg border border-rose-300 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>حذف فایل</span>
                </button>
              </div>
            )}

            {/* Send Message Form */}
            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
              <label className="p-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-blue-950 cursor-pointer border-2 border-amber-300 transition-all shrink-0 font-bold flex items-center gap-1.5 shadow-sm" title="ارسال عکس/مدرک">
                <Camera className="w-4 h-4 text-blue-950" />
                <span className="text-xs font-black hidden sm:inline">افزودن عکس</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const dataUrl = await compressImageFile(file, 1000, 0.7);
                      setChatSelectedFile(dataUrl);
                    }
                  }}
                />
              </label>

              <input
                type="text"
                value={chatMessageInput}
                onChange={(e) => setChatMessageInput(e.target.value)}
                placeholder="پاسخ خود یا توضیحات مدرک را بنویسید..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border-2 border-slate-300 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-900 font-medium"
              />

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-md border border-blue-950"
              >
                <span>ارسال</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Bank Account IBAN Input Form Modal/Section */}
        {hasAnyCompletedAssessment && !isCulprit && (showBankForm || claimCase.payoutInfo?.iban || claimCase.status === 'در انتظار پرداخت') && (
          <div id="iban-section" className="bg-gradient-to-br from-sky-50/80 via-blue-50/40 to-white border-2 border-sky-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm scroll-mt-6">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-600" />
                اطلاعات حساب بانکی برای واریز وجه خسارت
              </h4>
              <span className="text-[10px] bg-sky-100 text-sky-900 border border-sky-200 font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5 text-sky-700" />
                واریز مستقیم پایا / ساتنا
              </span>
            </div>

            {/* If case is in Payment Queue */}
            {claimCase.status === 'در انتظار پرداخت' && (
              <div className="p-4 bg-sky-50/90 border border-sky-200 rounded-2xl space-y-2 text-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-sky-950">
                    <CheckCircle2 className="w-4.5 h-4.5 text-sky-600 shrink-0" />
                    <span>اطلاعات بانکی با موفقیت ثبت شد و پرونده در صف پرداخت مدیر مالی قرار دارد</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-bold">
                    در صف حواله مالی
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                  اطلاعات حساب بانکی شما به شرکت بیمه‌گر ({getInsurerPersianName(claimCase.culpritInsurer)}) ارسال گردیده و به صورت خودکار به کارتابل مدیر مالی منتقل شده است. پس از تایید مدیر مالی، حواله بانکی صادر و وجه به حساب شما واریز خواهد شد.
                </p>
                {claimCase.payoutInfo?.iban && (
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-700 border-t border-sky-200/80">
                    <span>بانک مقصد: <strong>{getBankNameFromIban(claimCase.payoutInfo.iban)}</strong></span>
                    <span>•</span>
                    <span>نام صاحب حساب: <strong>{claimCase.payoutInfo.beneficiary || beneficiary}</strong></span>
                    <span>•</span>
                    <span>شماره شبا: <strong className="font-mono" dir="ltr">{claimCase.payoutInfo.iban}</strong></span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">نام و نام خانوادگی صاحب حساب</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  placeholder="مثال: پریسا رضایی"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 text-xs bg-white text-slate-900 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 font-bold">کد ملی صاحب حساب</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="0012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 text-xs font-mono bg-white text-slate-900 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-bold">شماره شبا (IBAN - با پیشوند IR)</label>
                  {iban && iban.length >= 6 && (
                    <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-lg border border-sky-200">
                      تشخیص بانک: {getBankNameFromIban(iban)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="IR820540102680020817909002"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-sky-200 text-xs font-mono bg-white text-slate-900 uppercase focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none"
                  dir="ltr"
                />
              </div>
            </div>

            {claimCase.status !== 'پرداخت شده' && (
              <button
                type="button"
                onClick={handleAcceptAssessment}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-sky-700"
              >
                <CheckCircle2 className="w-4.5 h-4.5 text-sky-100" />
                <span>
                  {claimCase.status === 'در انتظار پرداخت'
                    ? 'به‌روزرسانی اطلاعات بانکی و ارسال مجدد به صف پرداخت بیمه'
                    : 'ثبت اطلاعات بانکی و تایید نهایی جهت ارسال به صف پرداخت بیمه'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* If Culprit views case during payment stage */}
        {hasAnyCompletedAssessment && isCulprit && (claimCase.status === 'در انتظار پرداخت' || claimCase.status === 'پرداخت شده') && (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-2 text-slate-800">
            <div className="flex items-center gap-2 font-black text-xs text-slate-900">
              <Info className="w-4.5 h-4.5 text-slate-500 shrink-0" />
              <span>وضعیت پرداخت خسارت به زیان‌دیده</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              اطلاعات بانکی توسط زیان‌دیده حادثه ثبت گردیده و فرآیند حواله وجه از محل بیمه‌نامه شخص ثالث شما در حال انجام می‌باشد.
            </p>
          </div>
        )}

        {/* Rating Section if case is Paid */}
        {claimCase.status === 'پرداخت شده' && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3 text-center">
            <h4 className="font-extrabold text-amber-900 text-xs">
              نظرسنجی کیفیت رسیدگی به پرونده
            </h4>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingSubmit(star)}
                  className={`p-1 transition-transform hover:scale-125 ${
                    (claimCase.victimRating?.stars || ratingStars) >= star
                      ? 'text-amber-500'
                      : 'text-slate-300'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
            {claimCase.victimRating?.stars && (
              <p className="text-xs font-bold text-emerald-700">
                امتیاز شما ({claimCase.victimRating.stars} ستاره) ثبت شد. متشکریم!
              </p>
            )}
          </div>
        )}

        {/* CRM Customer Tickets & Complaints Section */}
        <div className="pt-2 border-t border-slate-100">
          <CustomerTicketsSection
            claimCase={claimCase}
            session={session}
            onOpenCreateTicket={() => setShowCrmTicketModal(true)}
          />
        </div>

        {/* Case Timeline */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            تاریخچه کامل روند پرونده
          </h4>
          <div className="space-y-2">
            {(claimCase.history || []).map((h, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{h.status}</span>
                  <span className="text-slate-600 mt-0.5 block">{h.note}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Central Insurance Complaint Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                ثبت شکایت رسمی به بیمه مرکزی
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  موضوع شکایت
                </label>
                <select
                  value={disputeSubject}
                  onChange={(e) => setDisputeSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="مبلغ ارزیابی نامتناسب">مبلغ ارزیابی نامتناسب با خسارت واقعی</option>
                  <option value="تاخیر در بررسی">تاخیر نامتعارف در رسیدگی به پرونده</option>
                  <option value="رفتار کارشناس">اعتراض به نحوه بررسی کارشناس</option>
                  <option value="سایر">سایر موارد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توضیحات و شرح شکایت <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="دلایل عدم رضایت خود را شرح دهید..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md hover:bg-rose-500"
                >
                  ثبت و ارسال به بیمه مرکزی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Customer Complaint Against Expert Modal */}
      {showExpertComplaintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>ثبت شکایت از عملکرد کارشناس ارزیاب</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowExpertComplaintModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <span className="text-amber-800 font-bold block">کارشناس مربوطه:</span>
              <p className="font-extrabold text-slate-900 text-sm">
                {claimCase.assignedExpert?.name || claimCase.assessment?.submittedBy || (claimCase.culpritInsurer === 'dana' ? 'فاطمه احمدی' : claimCase.culpritInsurer === 'iran' ? 'رضا تهرانی' : 'نرگس کریمی')}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">پرونده: {claimCase.id}</p>
            </div>

            <form onSubmit={handleCustomerComplaintSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  موضوع اصلی شکایت / اعتراض <span className="text-rose-500">*</span>
                </label>
                <select
                  value={expertComplaintReason}
                  onChange={(e) => setExpertComplaintReason(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-amber-200 focus:border-amber-600 focus:outline-none"
                >
                  <option value="مبلغ برآورد ناچیز">مبلغ برآورد ناچیز (کمتر از قیمت واقعی قطعات)</option>
                  <option value="تأخیر در پاسخگویی">تأخیر زیاد در بررسی و عدم پاسخگویی به تلفن</option>
                  <option value="عدم بررسی دقیق قطعات">عدم بررسی دقیق قطعات آسیب‌دیده و شاسی</option>
                  <option value="برخورد نامناسب">برخورد نامناسب و عدم ارائه توضیح شفاف</option>
                  <option value="سایر">سایر موارد</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  شرح کامل اعتراض و توضیحات <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={expertComplaintDesc}
                  onChange={(e) => setExpertComplaintDesc(e.target.value)}
                  placeholder="علت اعتراض خود به عملکرد کارشناس ارزیاب را کامل شرح دهید..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-200 focus:border-amber-600 focus:outline-none leading-relaxed"
                />
              </div>

              <p className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                این شکایت در پرونده نظارتی این کارشناس در پنل مدیریتی بیمه‌گر ثبت گردیده و نمره شایستگی عملکرد وی را ۱۸ امتیاز کاهش می‌دهد.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpertComplaintModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold shadow-md shadow-amber-600/30"
                >
                  ثبت و ارسال شکایت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Objection Stage 1 Modal */}
      {showObjection1Modal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>ثبت اعتراض اولیه به برآورد خسارت (مرحله ۱)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowObjection1Modal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1">
              <span className="font-extrabold block">قانون ارجاع به ارزیاب جدید:</span>
              <p className="leading-relaxed">
                طبق آئین‌نامه، پرونده شما جهت ارزیابی مجدد به یک کارشناس ارزیاب <strong>کاملاً جدید (غیر از ارزیاب اول)</strong> ارجاع داده خواهد شد.
              </p>
            </div>

            <form onSubmit={handleObjectionStage1} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  علت و شرح اعتراض به برآورد اولیه <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={objection1Reason}
                  onChange={(e) => setObjection1Reason(e.target.value)}
                  placeholder="دلایل عدم پذیرش برآورد اولیه را وارد کنید (مثلاً: عدم لحاظ قیمت روز سپر، رنگ‌پریدگی،...) ..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-rose-200 focus:border-rose-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowObjection1Modal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-md shadow-rose-600/30"
                >
                  ثبت اعتراض و ارجاع به ارزیاب جدید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Objection Stage 2 Modal */}
      {showObjection2Modal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <span>ثبت اعتراض ثانویه (مرحله ۲ - گفتگو با ارزیاب)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowObjection2Modal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-extrabold block">شروع چت مستقیم با ارزیاب دوم:</span>
              <p className="leading-relaxed">
                در این مرحله پرونده نزد ارزیاب دوم باقی مانده و کانال چت مستقیم جهت تبادل مستندات، عکس و فاکتور فعال خواهد شد.
              </p>
            </div>

            <form onSubmit={handleObjectionStage2} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  توضیحات اعتراض ثانویه جهت ارسال به ارزیاب <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={objection2Reason}
                  onChange={(e) => setObjection2Reason(e.target.value)}
                  placeholder="مواردی که نیاز به بررسی مجدد یا ارسال عکس/فاکتور دارد را بنویسید..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-200 focus:border-amber-600 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowObjection2Modal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold shadow-md shadow-amber-600/30"
                >
                  ثبت اعتراض و شروع گفتگو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Objection Stage 3 Workshop Info Modal */}
      {showWorkshopModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>ثبت اطلاعات تعمیرگاه معرفی‌شده (مرحله ۳)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowWorkshopModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-indigo-950 leading-relaxed">
              اطلاعات تعمیرگاه مورد نظر خود را وارد کنید تا ارزیاب خسارت برآورد قطعات و دستمزد را بر اساس برآورد تعمیرگاه بررسی نماید.
            </div>

            <form onSubmit={handleWorkshopSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">استان <span className="text-rose-500">*</span></label>
                  <select
                    value={workshopProvince}
                    onChange={(e) => setWorkshopProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    {['تهران', 'البرز', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'خوزستان', 'مازندران', 'گیلان', 'سایر'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">شهر <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={workshopCity}
                    onChange={(e) => setWorkshopCity(e.target.value)}
                    placeholder="مثلا: تهران، کرج، شیراز..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نام تعمیرگاه / صافکاری و نقاشی <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  placeholder="مثلا: تعمیرگاه تخصصی ایران‌خودرو یا صافکاری برادران..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شماره تماس تعمیرگاه <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={workshopPhone}
                  onChange={(e) => setWorkshopPhone(e.target.value)}
                  placeholder="۰۲۱xxxxxxxx یا ۰۹۱۲xxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono bg-white"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">آدرس دقیق تعمیرگاه</label>
                <textarea
                  rows={2}
                  value={workshopAddress}
                  onChange={(e) => setWorkshopAddress(e.target.value)}
                  placeholder="خیابان، پلاک، نام صافکار..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkshopModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-md shadow-indigo-600/30"
                >
                  ثبت اطلاعات تعمیرگاه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Objection Stage 4 / Final Field Visit & Branch Request Modal */}
      {showFieldVisitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <span>درخواست ارزیابی میدانی / مراجعه به شعبه (مرحله نهایی)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFieldVisitModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1">
              <span className="font-extrabold block">فرآیند ارزیابی حضوری کارشناس رسمی:</span>
              <p className="leading-relaxed text-[11px]">
                در این مرحله، پرونده مستقیماً به نزدیک‌ترین کارشناس رسمی میدانی شرکت بیمه ارجاع خواهد شد تا با بازدید فیزیکی خودرو، اصالت‌سنجی قطعات و تعیین برآورد نهایی اقدام نماید.
              </p>
            </div>

            <form onSubmit={handleFieldVisitSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  نوع ارزیابی درخواستی <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    onClick={() => setFieldVisitType('FIELD_VISIT')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2 cursor-pointer transition-all ${
                      fieldVisitType === 'FIELD_VISIT'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fieldVisitType"
                      checked={fieldVisitType === 'FIELD_VISIT'}
                      onChange={() => setFieldVisitType('FIELD_VISIT')}
                      className="text-purple-600"
                    />
                    <span>اعزام کارشناس به محل خودرو</span>
                  </label>

                  <label
                    onClick={() => setFieldVisitType('BRANCH_VISIT')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-2 cursor-pointer transition-all ${
                      fieldVisitType === 'BRANCH_VISIT'
                        ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fieldVisitType"
                      checked={fieldVisitType === 'BRANCH_VISIT'}
                      onChange={() => setFieldVisitType('BRANCH_VISIT')}
                      className="text-purple-600"
                    />
                    <span>مراجعه حضوری به شعبه خسارت</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  آدرس و موقعیت استقرار فعلی خودرو جهت بازدید <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fieldVisitAddress}
                  onChange={(e) => setFieldVisitAddress(e.target.value)}
                  placeholder="شهر، خیابان، کوچه، پلاک، محل توقف خودرو یا تعمیرگاه..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  شماره تماس جهت هماهنگی کارشناس میدانی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fieldVisitContactPhone}
                  onChange={(e) => setFieldVisitContactPhone(e.target.value)}
                  placeholder="۰۹۱۲xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 focus:outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  توضیحات و نکات تکمیلی برای کارشناس میدانی (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={fieldVisitReason}
                  onChange={(e) => setFieldVisitReason(e.target.value)}
                  placeholder="نکاتی در مورد زمان مناسب بازدید، قطعات تعویضی مورد اختلاف، یا وضعیت حرکت خودرو..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-200 focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFieldVisitModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold shadow-md shadow-purple-600/30 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ثبت درخواست ارزیابی میدانی</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Claim Add Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    افزودن مدرک جدید به پرونده مشترک
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    ارسال‌شده به‌عنوان: <span className="font-bold text-blue-900">{myRoleLabel}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadAdditionalDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  دسته‌بندی مدرک / تصویر <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docUploadCategory}
                  onChange={(e) => setDocUploadCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:outline-none focus:border-blue-600"
                >
                  <option value="عکس خسارت بدنه">عکس خسارت بدنه / قطعات آسیب‌دیده</option>
                  <option value="ویدیوی صحنه تصادف">ویدیوی صحنه تصادف یا دوربین ثبت وقایع</option>
                  <option value="کارت خودرو و گواهی‌نامه">کارت خودرو / گواهی‌نامه / بیمه‌نامه</option>
                  <option value="فاکتور و برآورد هزینه‌ها">فاکتور خرید قطعه / هزینه‌های جرثقیل و تعمیرگاه</option>
                  <option value="کروکی یا گزارش رسمی پلیس">کروکی یا گزارش رسمی پلیس انتظامی</option>
                  <option value="سایر مستندات">سایر مستندات یا یادداشت‌ها</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  عنوان اختصاصی مدرک
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="مثلاً: تصویر سپر و چراغ سمت چپ یا ویدیوی تصادف"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  توضیحات و یادداشت همراه مدرک (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  placeholder="توضیحاتی که کارشناس ارزیاب یا طرف مقابل باید بدانند..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* File upload selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  انتخاب فایل (تصویر، ویدیو یا فایل PDF) <span className="text-rose-500">*</span>
                </label>

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center space-y-2 transition-colors bg-slate-50">
                  <input
                    type="file"
                    id="shared-doc-file-input"
                    accept="image/*,video/*,.pdf"
                    onChange={handleDocFileChange}
                    className="hidden"
                  />
                  <label htmlFor="shared-doc-file-input" className="cursor-pointer block space-y-1">
                    <Upload className="w-6 h-6 text-blue-600 mx-auto" />
                    <span className="font-bold text-blue-900 block">
                      {docFileName ? docFileName : 'برای انتخاب فایل اینجا کلیک کنید'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      پشتیبانی از فرمت‌های JPG, PNG, WEBP, MP4, PDF (حداکثر ۲۰ مگابایت)
                    </span>
                  </label>

                  {docFileData && (
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        فایل با موفقیت بارگذاری شد ({docFileSize})
                      </span>
                      <button
                        type="button"
                        onClick={() => { setDocFileData(null); setDocFileName(''); setDocFileSize(''); }}
                        className="text-rose-600 font-bold hover:underline"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={(!docFileData && !docNote.trim()) || isUploading}
                  className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-extrabold shadow-md shadow-blue-900/20 flex items-center gap-2"
                >
                  {isUploading ? (
                    <span>در حال بارگذاری...</span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>ثبت و افزودن به پرونده</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE ASSESSMENT DETAILS MODAL (CLICK-TO-VIEW FULL CARD DETAILS) */}
      {selectedAssessmentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className={`p-5 sm:p-6 border-b flex items-center justify-between gap-3 text-white ${
              selectedAssessmentModal.type === 'FIELD_EXPERT'
                ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950'
                : 'bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-inner shrink-0 ${
                  selectedAssessmentModal.type === 'FIELD_EXPERT' ? 'bg-sky-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {selectedAssessmentModal.type === 'FIELD_EXPERT' ? <UserCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg">
                      {selectedAssessmentModal.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                      selectedAssessmentModal.type === 'FIELD_EXPERT'
                        ? 'bg-sky-400/20 text-sky-200 border-sky-400/40'
                        : 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                    }`}>
                      {selectedAssessmentModal.badge}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    کارشناس: {selectedAssessmentModal.expertName} • کد پروانه: <span className="font-mono">{selectedAssessmentModal.stampCode}</span> • تاریخ ثبت: <span className="font-mono">{selectedAssessmentModal.date}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAssessmentModal(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-5 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setModalActiveTab('2d_model')}
                className={`pb-3 px-3.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === '2d_model'
                    ? 'border-sky-600 text-sky-700 bg-sky-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>مدل ۲بعدی و ۳بعدی خودرو</span>
                {selectedAssessmentModal.damageSpots && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-900 font-mono font-bold">
                    {Object.keys(selectedAssessmentModal.damageSpots).length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('report_technical')}
                className={`pb-3 px-3.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'report_technical'
                    ? 'border-sky-600 text-sky-700 bg-sky-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>گزارش تشریحی و اصالت‌سنجی</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('parts_table')}
                className={`pb-3 px-3.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'parts_table'
                    ? 'border-sky-600 text-sky-700 bg-sky-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck className="w-4 h-4 text-slate-600" />
                <span>ریز قطعات و اجرت تعویض ({selectedAssessmentModal.parts?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('photos_gallery')}
                className={`pb-3 px-3.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'photos_gallery'
                    ? 'border-sky-600 text-sky-700 bg-sky-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-slate-600" />
                <span>عکس‌های بازدید میدانی ({selectedAssessmentModal.photos?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('financial')}
                className={`pb-3 px-3.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                  modalActiveTab === 'financial'
                    ? 'border-sky-600 text-sky-700 bg-sky-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span>محاسبات و سهم بیمه‌نامه</span>
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-160px)] text-slate-800 text-xs">
              
              {/* TAB 1: 2D & 3D Car Model Damage Blueprint */}
              {modalActiveTab === '2d_model' && (
                <div className="space-y-5">
                  <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-black text-sky-950 text-sm">
                        <Sparkles className="w-4.5 h-4.5 text-sky-600" />
                        <span>نقشه ۲بعدی تعاملی و ۳بعدی بدنه خودرو و نقاط خسارت ثبت‌شده</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        کارشناس رسمی میدانی در هنگام بازدید فیزیکی، نقاط آسیب‌دیده زیر را به همراه نوع عملیات مشخص نموده است.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-white border border-sky-300 rounded-xl font-black text-xs text-sky-900 shrink-0 text-center shadow-2xs">
                      وضعیت: تایید قطعی کارشناسی
                    </span>
                  </div>

                  {/* 2D/3D Car Model Viewer Component */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        نمایش شماتیک قطعات آسیب‌دیده روی مدل خودرو:
                      </span>
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1 text-rose-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> تعویض کامل
                        </span>
                        <span className="flex items-center gap-1 text-amber-900">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> صافکاری و نقاشی
                        </span>
                        <span className="flex items-center gap-1 text-yellow-900">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> رگلاژ و سطحی
                        </span>
                      </div>
                    </div>

                    <div className="py-2">
                      <Car3DViewer
                        caseId={claimCase.id}
                        damageData={selectedAssessmentModal.damageSpots}
                        editable={false}
                      />
                    </div>
                  </div>

                  {/* Detailed Spot Breakdown List */}
                  {selectedAssessmentModal.damageSpots && Object.keys(selectedAssessmentModal.damageSpots).length > 0 && (
                    <div className="space-y-2">
                      <span className="font-extrabold text-slate-900 text-xs block">
                        جزئیات تشریحی هر نقطه آسیب ثبت‌شده روی مدل خودرو:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(selectedAssessmentModal.damageSpots).map(([spotKey, spotVal]: [string, any]) => {
                          const partLabelMap: Record<string, string> = {
                            front_bumper: 'سپر جلو و متعلقات پوسته',
                            fender_fr: 'گلگیر جلو راست (اصلی)',
                            fender_fl: 'گلگیر جلو چپ (اصلی)',
                            hood: 'درب موتور (کاپوت)',
                            headlight_r: 'مجموعه چراغ جلو راست',
                            headlight_l: 'مجموعه چراغ جلو چپ',
                            door_fr: 'درب جلو راست',
                            door_fl: 'درب جلو چپ',
                            door_rr: 'درب عقب راست',
                            door_rl: 'درب عقب چپ',
                            rear_bumper: 'سپر عقب و براکت‌ها',
                            trunk: 'درب صندوق عقب',
                            roof: 'سقف و ستون',
                            windshield_front: 'شیشه جلو',
                            windshield_rear: 'شیشه عقب'
                          };
                          const isMajor = spotVal?.color === 'red' || spotVal?.severity === 'major';
                          const isModerate = spotVal?.color === 'orange' || spotVal?.severity === 'moderate';
                          return (
                            <div
                              key={spotKey}
                              className={`p-3.5 rounded-2xl border space-y-1.5 shadow-2xs ${
                                isMajor
                                  ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                                  : isModerate
                                  ? 'bg-amber-50/40 border-amber-200 text-amber-950'
                                  : 'bg-yellow-50/40 border-yellow-200 text-yellow-950'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-black text-xs">
                                  <span className={`w-2.5 h-2.5 rounded-full ${
                                    isMajor ? 'bg-rose-600' : isModerate ? 'bg-amber-500' : 'bg-yellow-500'
                                  }`} />
                                  <span>{partLabelMap[spotKey] || spotKey}</span>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                  isMajor
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : isModerate
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-yellow-100 text-yellow-900 border-yellow-300'
                                }`}>
                                  {spotVal?.type || spotVal?.operation || 'نیاز به اقدام'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed font-medium bg-white/80 p-2 rounded-xl border border-slate-200/60">
                                {spotVal?.note || 'تایید شده توسط کارشناس در بازرسی فیزیکی صحنه تصادف'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Technical Report & Authenticity Checklist */}
              {modalActiveTab === 'report_technical' && (
                <div className="space-y-4">
                  {/* Verdict Banner */}
                  <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-sm">
                        <UserCheck className="w-5 h-5 text-sky-700" />
                        <span>اصالت‌سنجی فیزیکی و تاییدیه صحنه حادثه</span>
                      </div>
                      <span className="px-3 py-1 bg-sky-600 text-white rounded-full text-xs font-black shadow-xs">
                        {selectedAssessmentModal.verdict}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-sky-200/80">
                      {selectedAssessmentModal.notes}
                    </p>
                  </div>

                  {/* 4-Point Physical Authenticity Checklist */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                      چک‌لیست تطبیق فنی و اصالت‌سنجی در محل حادثه:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>۱. تطبیق زاویه برخورد و آثار در صحنه</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          خط ترمز و نحوه قرارگیری خودروها با محل شکستگی قطعات همخوانی ۱۰۰٪ دارد.
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>۲. تطبیق ارتفاع سپرها و خطوط طولی</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          ارتفاع فرورفتگی دیاق و نقاط ضربه با ارتفاع سپر و چراغ وسیله نقلیه مقابل تطبیق دارد.
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>۳. بررسی تازگی شکستگی‌ها و عدم کهنگی</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          پلیسه‌های رنگ و شکستگی پوسته سپر کاملاً تازه بوده و آثار زنگ‌زدگی یا کهنگی مشاهده نشد.
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>۴. استعلام فیزیکی شماره شاسی (VIN)</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          شماره شاسی حک‌شده زیر کاپوت و روی ستون با کارت خودرو و بیمه‌نامه تطبیق کامل دارد.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Official Assessor Identity & Certification */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-900 text-xs block">
                        مشخصات کارشناس بازدید میدانی:
                      </span>
                      <p className="text-xs text-slate-700 font-medium">
                        <strong>{selectedAssessmentModal.expertName}</strong> • {selectedAssessmentModal.expertRole}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        کد نظام کارشناسی رسمی: {selectedAssessmentModal.stampCode} • زمان بازرسی: {selectedAssessmentModal.date}
                      </p>
                    </div>
                    <div className="border border-sky-300 bg-sky-50 px-3 py-2 rounded-xl text-center shrink-0">
                      <span className="text-[10px] text-sky-800 font-bold block">مهر دیجیتال تاییدیه</span>
                      <span className="text-xs font-mono font-black text-sky-950">{selectedAssessmentModal.stampCode}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Itemized Parts & Labor Table */}
              {modalActiveTab === 'parts_table' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-700" />
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                        فهرست ریز قطعات تعویضی، صافکاری، نقاشی و هزینه‌ها (قیمت‌گذاری نرخ روز اتحادیه)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {selectedAssessmentModal.parts?.length || 0} ردیف قطعه و اجرت
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-extrabold">
                          <th className="p-3 text-center w-12">#</th>
                          <th className="p-3">نام قطعه / شرح اقدام</th>
                          <th className="p-3">نوع عملیات</th>
                          <th className="p-3 text-left">بهای قطعه (ریال)</th>
                          <th className="p-3 text-left">اجرت تعمیر/نصب (ریال)</th>
                          <th className="p-3 text-left">داغی/استهلاک</th>
                          <th className="p-3 text-left">مبلغ خالص مصوب (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedAssessmentModal.parts || []).map((part: any, pIdx: number) => (
                          <tr key={part.id || pIdx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center text-slate-400 font-mono font-bold">{pIdx + 1}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-900 block">{part.name}</span>
                              {part.note && (
                                <span className="text-[10px] text-slate-500 font-medium">{part.note}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                part.operation?.includes('تعویض')
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-900 border border-amber-200'
                              }`}>
                                {part.operation}
                              </span>
                            </td>
                            <td className="p-3 text-left font-mono font-semibold text-slate-800">
                              {part.partPrice > 0 ? formatCurrency(part.partPrice) : '—'}
                            </td>
                            <td className="p-3 text-left font-mono font-semibold text-slate-800">
                              {part.labor > 0 ? formatCurrency(part.labor) : '—'}
                            </td>
                            <td className="p-3 text-left font-mono text-rose-700">
                              {part.salvage > 0 ? `-${formatCurrency(part.salvage)}` : '۰'}
                            </td>
                            <td className="p-3 text-left font-mono font-black text-slate-900 bg-slate-50/50">
                              {formatCurrency(part.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-slate-900">
                          <td colSpan={3} className="p-3 text-right">
                            جمع کل خسارت مستقیم قطعات و اجرت:
                          </td>
                          <td colSpan={4} className="p-3 text-left font-mono text-sm text-slate-900">
                            {formatCurrency(selectedAssessmentModal.directDamage)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Field Photos & Attached Documents Gallery */}
              {modalActiveTab === 'photos_gallery' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm block">
                        گالری تصاویر و مستندات ثبت‌شده توسط کارشناس میدانی:
                      </span>
                      <p className="text-[11px] text-slate-500 font-medium">
                        جهت مشاهده در اندازه بزرگ‌تر، روی هر تصویر کلیک نمایید.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      {selectedAssessmentModal.photos?.length || 0} تصویر مستند
                    </span>
                  </div>

                  {selectedAssessmentModal.photos && selectedAssessmentModal.photos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedAssessmentModal.photos.map((doc: any, pIdx: number) => {
                        const imgSrc = doc.dataUrl || doc.url || '';
                        return (
                          <div
                            key={pIdx}
                            onClick={() => imgSrc && setPreviewImageModal(imgSrc)}
                            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs cursor-pointer hover:shadow-md hover:border-sky-300 transition-all group"
                          >
                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                              <img
                                src={imgSrc}
                                alt={doc.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Maximize2 className="w-4 h-4" />
                                <span>بزرگ‌نمایی عکس</span>
                              </div>
                            </div>
                            <div className="p-3 space-y-1">
                              <span className="font-bold text-slate-900 text-xs block truncate">
                                {doc.title}
                              </span>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                                <span>{doc.uploaderRole || 'کارشناس میدانی'}</span>
                                <span className="font-mono">{doc.uploadedAt || '۱۴۰۳/۱۱/۲۰'}</span>
                              </div>
                              {doc.note && (
                                <p className="text-[10px] text-slate-600 line-clamp-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                  {doc.note}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                      تصویری در این بخش یافت نشد.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Financial Breakdown */}
              {modalActiveTab === 'financial' && (
                <div className="space-y-4">
                  {/* Financial Calculations & Policy Ceiling Breakdown */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Shield className="w-4 h-4 text-slate-700" />
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                        تعهدات مالی بیمه‌نامه و تسهیم مبالغ پرداختی (استعلام برخط سنهاب)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-slate-500 font-bold block mb-1">سقف تعهد مالی بیمه‌نامه مقصر</span>
                        <strong className="text-slate-900 font-black text-sm">
                          {formatCurrency(selectedAssessmentModal.policyCeiling)}
                        </strong>
                      </div>

                      <div className={`bg-white p-3.5 rounded-xl border-2 shadow-2xs ${
                        selectedAssessmentModal.type === 'FIELD_EXPERT' ? 'border-sky-300 bg-sky-50/20' : 'border-indigo-300'
                      }`}>
                        <span className="text-slate-500 font-bold block mb-1">سهم پرداختی شرکت بیمه</span>
                        <strong className={`font-black text-sm ${
                          selectedAssessmentModal.type === 'FIELD_EXPERT' ? 'text-sky-950' : 'text-indigo-900'
                        }`}>
                          {formatCurrency(selectedAssessmentModal.insurerPayable)}
                        </strong>
                      </div>

                      <div className={`p-3.5 rounded-xl border shadow-2xs ${
                        selectedAssessmentModal.culpritDebt > 0
                          ? 'bg-rose-50 border-rose-300'
                          : 'bg-white border-slate-200'
                      }`}>
                        <span className="text-slate-500 font-bold block mb-1">بدهی مازاد مقصر به زیان‌دیده</span>
                        <strong className={`font-black text-sm ${
                          selectedAssessmentModal.culpritDebt > 0 ? 'text-rose-700' : 'text-slate-700'
                        }`}>
                          {selectedAssessmentModal.culpritDebt > 0 ? formatCurrency(selectedAssessmentModal.culpritDebt) : '۰ ریال (تسویه ۱۰۰٪)'}
                        </strong>
                      </div>
                    </div>

                    {selectedAssessmentModal.exceedsCeiling && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-950 text-[11px] leading-relaxed">
                        <strong>توجه:</strong> خسارت فراتر از سقف تعهد مالی بیمه‌نامه مقصر بوده و طبق قانون بیمه شخص ثالث، مبلغ مازاد ({formatCurrency(selectedAssessmentModal.culpritDebt)}) باید توسط مقصر حادثه پرداخت گردد.
                      </div>
                    )}
                  </div>

                  {/* Official Insurance Dispatch */}
                  <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-2">
                    <div className="flex items-center gap-2 text-sky-950 font-black text-xs sm:text-sm">
                      <MessageSquare className="w-4 h-4 text-sky-700" />
                      <span>پیام و ابلاغیه رسمی شرکت بیمه:</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-sky-200/60">
                      {selectedAssessmentModal.officialInsuranceMessage}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedAssessmentModal(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-xs transition-colors cursor-pointer"
              >
                بستن پنجره جزئیات
              </button>

              {isVictim && !selectedAssessmentModal.isHistorical && !isWaitingForNewAssessment && claimCase.status !== 'پرداخت شده' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssessmentModal(null);
                    setShowForm(true);
                    setTimeout(() => {
                      document.getElementById('iban-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedAssessmentModal.type === 'FIELD_EXPERT'
                      ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20 border border-sky-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-white" />
                  تایید نظر کارشناس و ثبت شماره شبا جهت ارجاع به مدیر مالی
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BANK SUBMISSION & FINANCE QUEUE SUCCESS MODAL */}
      {bankSuccessModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-sky-200 space-y-5 animate-in zoom-in-95 duration-200 my-auto text-slate-800">
            
            {/* Top Success Badge */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center font-black shadow-lg shadow-sky-600/25 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 text-emerald-600" />
                    ارسال موفق به بیمه
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {bankSuccessModal.trackingCode}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  اطلاعات بانکی با موفقیت به شرکت بیمه ارسال گردید
                </h3>
              </div>
            </div>

            {/* Notification / Flow Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50/60 to-slate-50 border-2 border-sky-200/90 text-xs text-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-black text-sky-950 text-xs sm:text-sm">
                <Sparkles className="w-4.5 h-4.5 text-sky-600 shrink-0" />
                <span>پرونده در صف پرداخت قرار گرفت و به پنل مدیر مالی ارجاع شد</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                اطلاعات حساب بانکی شما با موفقیت برای شرکت <strong>{bankSuccessModal.insurerName}</strong> ارسال گردید. این پرونده بلافاصله در <strong>کارتابل مدیر مالی</strong> قرار گرفت تا عملیات صدور حواله و واریز وجه انجام شده و پرونده تسویه و مختومه گردد.
              </p>
            </div>

            {/* Step-by-Step Payment Journey Pipeline */}
            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h5 className="font-extrabold text-slate-800 text-[11px] mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                مراحل پرداخت و واریز خسارت:
              </h5>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 text-[11px]">
                    <strong className="text-emerald-900 font-bold block">۱. ثبت و اعتبارسنجی اطلاعات شماره شبا</strong>
                    <span className="text-slate-500 text-[10px]">تایید شده و ثبت گردید.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-emerald-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 text-[11px]">
                    <strong className="text-emerald-900 font-bold block">۲. ارسال برخط به سیستم مالی بیمه‌گر</strong>
                    <span className="text-slate-500 text-[10px]">پرونده به صف پرداخت شرکت بیمه منتقل شد.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-sky-100/90 border border-sky-300">
                  <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 animate-pulse">
                    ⚡
                  </div>
                  <div className="flex-1 text-[11px]">
                    <strong className="text-sky-950 font-black block">۳. ارجاع خودکار به کارتابل مدیر مالی و خزانه‌داری</strong>
                    <span className="text-sky-900 font-medium text-[10px]">
                      مدیر مالی در حال بررسی و صدور دستور حواله بانکی (پایا / ساتنا) است.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-200 opacity-75">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ۴
                  </div>
                  <div className="flex-1 text-[11px]">
                    <strong className="text-slate-700 font-bold block">۴. واریز وجه به شماره شبا و خاتمه پرونده</strong>
                    <span className="text-slate-500 text-[10px]">
                      پس از تایید پرداخت، پیامک واریز ارسال و وضعیت پرونده «پرداخت شده» می‌گردد.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Summary Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">مبلغ مصوب پرداختی بیمه</span>
                <strong className="text-sky-950 font-black text-sm">
                  {formatCurrency(bankSuccessModal.payableAmount)}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">بانک مقصد</span>
                <strong className="text-slate-900 font-bold text-xs">
                  {bankSuccessModal.bankName}
                </strong>
              </div>

              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold text-[10px]">شماره شبای ثبت‌شده:</span>
                  <span className="text-slate-700 text-[10px] font-bold">صاحب حساب: {bankSuccessModal.beneficiary}</span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-xs mt-1" dir="ltr">
                  {bankSuccessModal.iban}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setBankSuccessModal(null)}
                className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-sky-700"
              >
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>متوجه شدم و بازگشت به پرونده</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 p-2 rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center border border-slate-700 hover:bg-slate-700"
            >
              ✕
            </button>
            <img src={previewImageModal} alt="Document Preview" className="w-full h-auto max-h-[80vh] object-contain mx-auto rounded-2xl" />
          </div>
        </div>
      )}

      {/* Customer CRM Ticket / Complaint Creation Modal */}
      <CustomerTicketModal
        isOpen={showCrmTicketModal}
        onClose={() => setShowCrmTicketModal(false)}
        claimCase={claimCase}
        session={session}
        onSuccess={(msg) => {
          setTicketToastMsg(msg);
          setTimeout(() => setTicketToastMsg(null), 5000);
        }}
      />

      {/* Direct Customer Call to Expert Modal */}
      <CustomerExpertCallModal
        isOpen={showExpertCallModal}
        onClose={() => setShowExpertCallModal(false)}
        claimCase={claimCase}
        session={session}
      />

      {/* Toast Feedback Notification */}
      {ticketToastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs sm:text-sm font-extrabold">{ticketToastMsg}</span>
        </div>
      )}
    </div>
  );
};
