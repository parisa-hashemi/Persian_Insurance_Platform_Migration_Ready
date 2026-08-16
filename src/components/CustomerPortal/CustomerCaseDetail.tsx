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
  Users,
  Filter,
  CheckSquare,
  Star,
  ShieldAlert,
  MapPin,
  X
} from 'lucide-react';
import { ClaimCase, UserSession, CaseStatus, AdditionalDocItem, ExpertComplaint } from '../../types';
import { formatCurrency, parseMoneyNumber, getInsurerPersianName, loadComplaintsFromStorage, saveComplaintsToStorage } from '../../lib/storage';
import { calculateClaimDamageWithPolicyLimits, performPolicySanhabInquiry } from '../../lib/policyLimitCalculator';
import { Car3DViewer } from '../Car3DViewer';

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

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeSubject, setDisputeSubject] = useState('مبلغ ارزیابی نامتناسب');
  const [disputeDesc, setDisputeDesc] = useState('');

  // Authenticity Dispute state (تردید در اصالت تصادف / اعزام کارشناس میدانی)
  const [showAuthenticityModal, setShowAuthenticityModal] = useState(false);
  const [authenticityReason, setAuthenticityReason] = useState('صحنه تصادف صوری یا ساختگی است');
  const [authenticityDesc, setAuthenticityDesc] = useState('');
  const [authenticityPhoto, setAuthenticityPhoto] = useState<string | null>(null);
  const [authenticityPhotoName, setAuthenticityPhotoName] = useState<string>('');
  const [authenticitySuccessMsg, setAuthenticitySuccessMsg] = useState<string | null>(null);

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

  const userRole: 'زیان‌دیده' | 'مقصر' = isPartyOne ? partyOneRole : partyTwoRole;
  const isVictim = userRole === 'زیان‌دیده';
  const isCulprit = userRole === 'مقصر';

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

  const handleCustomerChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      let fType: 'image' | 'video' | 'pdf' | 'doc' = 'image';
      if (file.type.startsWith('video/')) fType = 'video';
      else if (file.type.includes('pdf')) fType = 'pdf';
      else if (file.type.includes('word') || file.type.includes('document')) fType = 'doc';

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setCustomerChatFile({
            name: file.name,
            size: `${sizeMB} MB`,
            type: fType,
            dataUrl: uploadEvent.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
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

  const [chatMessageInput, setChatMessageInput] = useState('');

  // Handle Stage 1 Objection (Forces Insurance to reassign to a DIFFERENT assessor #2)
  const handleObjectionStage1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objection1Reason.trim()) return;

    const currentAssessorId = claimCase.assignedExpert?.id;
    const currentAssessorName = claimCase.assignedExpert?.name || 'ارزیاب اول';
    const updatedPrev = Array.from(new Set([
      ...(claimCase.previousAssessorIds || []),
      ...(currentAssessorId ? [currentAssessorId] : []),
      ...(claimCase.rejectedByAssessorIds || [])
    ]));

    const updated: ClaimCase = {
      ...claimCase,
      objectionStage: 1,
      status: 'در انتظار ارجاع به ارزیاب مجدد',
      previousAssignedExpert: claimCase.assignedExpert || undefined,
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
    if (!confirm('آیا از ارجاع پرونده جهت بازدید میدانی / مراجعه حضوری به شعبه شرکت بیمه اطمینان دارید؟')) return;

    const updated: ClaimCase = {
      ...claimCase,
      objectionStage: 4,
      status: 'در انتظار ارجاع به کارشناس میدانی',
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار ارجاع به کارشناس میدانی',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'زیان‌دیده',
          note: 'درخواست ارجاع پرونده به کارشناس میدانی / شعبه بیمه‌گر (مرحله نهایی) توسط زیان‌دیده ثبت شد.'
        }
      ]
    };

    onUpdateCase(updated);
    alert('درخواست ارجاع به کارشناس میدانی با موفقیت ثبت شد. شرکت بیمه پرونده را به کارشناس میدانی یا نزدیک‌ترین شعبه محول خواهد کرد.');
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

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFileName(file.name);
      
      // Calculate human-readable file size
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setDocFileSize(`${sizeMB} MB`);

      if (file.type.startsWith('video/')) {
        setDocFileType('video');
      } else if (file.type.includes('pdf')) {
        setDocFileType('pdf');
      } else {
        setDocFileType('image');
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setDocFileData(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
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
    if (!iban || !nationalId) {
      setShowForm(true);
      return;
    }

    const damageCalc = calculateClaimDamageWithPolicyLimits(claimCase);
    const sanhabInq = performPolicySanhabInquiry(claimCase);

    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    // Generate real-time SMS dispatch logs for both parties
    const victimSmsLog = {
      id: `SMS-V-${Date.now()}`,
      recipientType: 'VICTIM' as const,
      recipientName: claimCase.victimName || 'زیان‌دیده',
      phone: claimCase.victimPhone || '09120000000',
      text: damageCalc.victimSmsText,
      sentAt: nowTimeStr,
      status: 'DELIVERED' as const
    };

    const culpritSmsLog = {
      id: `SMS-C-${Date.now() + 1}`,
      recipientType: 'CULPRIT' as const,
      recipientName: claimCase.culpritName || 'مقصر حادثه',
      phone: claimCase.culpritPhone || '09121111111',
      text: damageCalc.culpritSmsText,
      sentAt: nowTimeStr,
      status: 'DELIVERED' as const
    };

    const updatedSmsLogs = [...(claimCase.smsDispatchLogs || []), victimSmsLog, culpritSmsLog];

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
      insurerPayableAmount: damageCalc.insurerPayablePortion,
      culpritDebtAmount: damageCalc.culpritExcessDebt,
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
        beneficiary: beneficiary || claimCase.victimName,
        nationalId: nationalId,
        iban: iban,
        verification: 'VERIFIED'
      },
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار پرداخت',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'مشتری',
          note: damageCalc.exceedsCeiling
            ? `تایید ارزیابی توسط زیان‌دیده با استعلام سقف تعهد بیمه. خسارت کل: ${formatCurrency(damageCalc.totalClaimAmount)} | سقف تعهد بیمه (قابل پرداخت): ${formatCurrency(damageCalc.insurerPayablePortion)} | مازاد بدهی مقصر: ${formatCurrency(damageCalc.culpritExcessDebt)}. پیامک رسمی به زیان‌دیده و مقصر ارسال گردید.`
            : `تایید ارزیابی و ثبت شماره شبا برای واریز وجه (${formatCurrency(damageCalc.insurerPayablePortion)}). پیامک تایید برای طرفین ارسال شد.`
        }
      ]
    };

    onUpdateCase(updated);
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

  const handleSubmitAuthenticityDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticityDesc.trim()) return;

    const myDisplayName = session.name || (isPartyOne ? claimCase.victimName : claimCase.culpritName) || 'مشتری';
    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    let updatedDocs = claimCase.additionalDocs || [];
    if (authenticityPhoto) {
      const docItem: AdditionalDocItem = {
        id: `DOC-AUTH-${Date.now()}`,
        title: authenticityPhotoName || 'مستندات تردید در اصالت تصادف',
        docType: 'مدرک تردید در اصالت تصادف',
        fileType: 'image',
        fileName: authenticityPhotoName || 'evidence.jpg',
        dataUrl: authenticityPhoto,
        uploadedBy: myDisplayName,
        uploaderRole: myRoleLabel,
        uploaderParty: isPartyOne ? 'PARTY_ONE' : 'PARTY_TWO',
        uploadedAt: nowTimeStr,
        visibility: 'SHARED',
        note: authenticityDesc.trim()
      };
      updatedDocs = [...updatedDocs, docItem];
    }

    const updated: ClaimCase = {
      ...claimCase,
      status: 'تردید در اصالت تصادف',
      needsCulpritFieldVisit: true,
      additionalDocs: updatedDocs,
      authenticityDispute: {
        disputedBy: myDisplayName,
        role: myRoleLabel,
        reason: authenticityReason,
        description: authenticityDesc.trim(),
        submittedAt: nowTimeStr,
        evidencePhotos: authenticityPhoto ? [authenticityPhoto] : undefined
      },
      history: [
        ...(claimCase.history || []),
        {
          status: 'تردید در اصالت تصادف',
          time: nowTimeStr,
          user: myDisplayName,
          userRole: myRoleLabel,
          uploaderParty: isPartyOne ? 'PARTY_ONE' : 'PARTY_TWO',
          note: `ثبت اعلام تردید در اصالت تصادف توسط ${myRoleLabel} (${myDisplayName}) به علت: «${authenticityReason}». پرونده جهت اعزام کارشناس میدانی به شرکت بیمه ارسال گردید.`
        }
      ]
    };

    onUpdateCase(updated);
    setShowAuthenticityModal(false);
    setAuthenticityDesc('');
    setAuthenticityPhoto(null);
    setAuthenticityPhotoName('');
    setAuthenticitySuccessMsg('اعلام تردید در اصالت تصادف با موفقیت ثبت شد و پرونده جهت اعزام کارشناس میدانی به شرکت بیمه ارسال گردید.');
    setTimeout(() => setAuthenticitySuccessMsg(null), 7000);
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
            {/* Authenticity Doubt Button */}
            {claimCase.status !== 'پرداخت شده' && (
              <button
                type="button"
                onClick={() => setShowAuthenticityModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border-2 border-amber-400 font-black text-xs transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                title="در صورت صوری یا ساختگی بودن تصادف یا عدم تطابق خسارت"
              >
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>تردید در اصالت تصادف (اعزام کارشناس میدانی)</span>
              </button>
            )}

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

        {/* Authenticity Success Feedback Banner */}
        {authenticitySuccessMsg && (
          <div className="bg-emerald-100 border-2 border-emerald-400 rounded-3xl p-5 flex items-start gap-3 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-black text-emerald-950 text-sm">
                درخواست بررسی اصالت تصادف با موفقیت ثبت شد
              </h4>
              <p className="text-emerald-900 font-medium leading-relaxed">
                {authenticitySuccessMsg}
              </p>
            </div>
          </div>
        )}

        {/* Active Authenticity Dispute Banner (When Case is flagged for authenticity inspection) */}
        {(claimCase.authenticityDispute || claimCase.status === 'تردید در اصالت تصادف' || claimCase.status === 'در انتظار بازدید کارشناس میدانی' || claimCase.status === 'در حال بازدید کارشناس میدانی') && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-amber-950 text-sm sm:text-base">
                    پرونده در وضعیت «تردید در اصالت تصادف و اعزام کارشناس میدانی»
                  </h3>
                  <p className="text-[11px] text-amber-800 font-bold">
                    ثبت‌شده توسط: {claimCase.authenticityDispute?.disputedBy || 'مشتری'} ({claimCase.authenticityDispute?.role || 'طرف حادثه'}) | تاریخ: {claimCase.authenticityDispute?.submittedAt || claimCase.date}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-200 text-amber-950 border border-amber-300 self-start sm:self-auto">
                {claimCase.status}
              </span>
            </div>

            <div className="bg-white/80 rounded-2xl p-4 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-900">علت اعلام تردید:</span>
                <span className="font-bold text-slate-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                  {claimCase.authenticityDispute?.reason || 'بررسی انطباق فیزیکی و اصالت صحنه'}
                </span>
              </div>
              {claimCase.authenticityDispute?.description && (
                <p className="text-slate-700 leading-relaxed font-medium">
                  <strong>توضیحات ثبت‌شده:</strong> {claimCase.authenticityDispute.description}
                </p>
              )}
            </div>

            <div className="p-3.5 bg-blue-900 text-white rounded-2xl text-xs space-y-1 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <MapPin className="w-4 h-4" />
                <span>روند پیگیری شرکت بیمه ({getInsurerPersianName(claimCase.culpritInsurer)}):</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {claimCase.assignedFieldExpert
                  ? `کارشناس میدانی مجرب «${claimCase.assignedFieldExpert.name}» (${claimCase.assignedFieldExpert.role}) توسط شرکت بیمه جهت بازدید حضوری از خودروها و محل حادثه تخصیص یافته است. نتیجه بررسی میدانی و برآورد قطعی پس از بازدید ثبت خواهد شد.`
                  : 'شرکت بیمه‌گر در حال تخصیص و اعزام کارشناس میدانی متخصص به محل حادثه جهت بازرسی فیزیکی، احراز اصالت و تعیین خسارت می‌باشد.'}
              </p>
            </div>
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

        {/* Car Blueprint & 3D Interactive Model Viewer with Clickable Spots & Assessor Notes */}
        {(claimCase.carDamageSpots || (claimCase.assessment && claimCase.assessment.parts && claimCase.assessment.parts.length > 0)) && (
          <Car3DViewer
            caseId={claimCase.id}
            editable={false}
            damageData={
              claimCase.carDamageSpots ||
              (claimCase.assessment?.parts?.reduce((acc: any, p: any) => {
                const keyMap: Record<string, string> = {
                  'سپر جلو': 'front_bumper',
                  'درب موتور': 'hood',
                  'کاپوت': 'hood',
                  'سقف': 'roof',
                  'درب صندوق عقب': 'trunk',
                  'صندوق عقب': 'trunk',
                  'سپر عقب': 'rear_bumper',
                  'درب جلو راست': 'door_fr',
                  'درب عقب راست': 'door_rr',
                  'درب جلو چپ': 'door_fl',
                  'درب عقب چپ': 'door_rl',
                  'گلگیر جلو راست': 'fender_fr',
                  'گلگیر جلو چپ': 'fender_fl',
                  'گلگیر عقب راست': 'fender_rr',
                  'گلگیر عقب چپ': 'fender_rl',
                  'رکاب راست': 'rocker_r',
                  'رکاب چپ': 'rocker_l'
                };
                const k = keyMap[p.name] || 'front_bumper';
                acc[k] = {
                  type: p.type === 'replace' ? 'نیاز به تعویض کامل' : 'تعمیر و صافکاری',
                  severity: p.type === 'replace' ? 'major' : 'moderate',
                  operation: p.type === 'replace' ? 'تعویض' : 'صافکاری و نقاشی',
                  color: p.type === 'replace' ? 'red' : 'orange',
                  note: claimCase.assessment?.reviewerNote || `این قطعه توسط کارشناس ارزیابی شده و نیاز به ${p.type === 'replace' ? 'تعویض' : 'صافکاری و رنگ'} دارد.`
                };
                return acc;
              }, {}) || {})
            }
          />
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

          const hasFieldAssessment = Boolean(
            claimCase.fieldExpertVerdict ||
            claimCase.fieldExpertFinal ||
            claimCase.fieldExpertReportNote ||
            claimCase.assessment?.fieldInspectionConfirmed ||
            (claimCase.assessment && claimCase.assessment.assessorId?.startsWith('fed')) ||
            (claimCase.assignedFieldExpert && (claimCase.status?.includes('میدانی') || claimCase.fieldVisitStarted || (claimCase.additionalDocs?.some(d => d.uploaderRole?.includes('میدانی')))))
          );

          const fieldDocs = (claimCase.additionalDocs || []).filter(
            (d) => d.uploaderRole?.includes('میدانی') || d.title?.includes('بازدید میدانی') || d.title?.includes('میدانی') || d.docType?.includes('بازدید میدانی')
          );

          // Standard items for field inspection or desk assessment if dynamic parts array is empty:
          const defaultFieldParts = [
            { id: 1, name: 'سپر جلو و متعلقات پوسته', operation: 'تعویض کامل قطعه', partPrice: 65000000, labor: 12000000, salvage: 4000000, total: 73000000 },
            { id: 2, name: 'گلگیر جلو راست (اصلی)', operation: 'صافکاری تخصصی و رنگ‌کوره', partPrice: 0, labor: 35000000, salvage: 0, total: 35000000 },
            { id: 3, name: 'مجموعه چراغ جلو راست (LED)', operation: 'تعویض کامل قطعه', partPrice: 58000000, labor: 8000000, salvage: 3000000, total: 63000000 },
            { id: 4, name: 'سینی جلو و براکت‌های دیاق', operation: 'شاسی‌کشی و رفع دفرمگی', partPrice: 0, labor: 28000000, salvage: 0, total: 28000000 },
            { id: 5, name: 'جلوپنجره و آرم', operation: 'تعویض قطعه', partPrice: 22000000, labor: 5000000, salvage: 1000000, total: 26000000 },
            { id: 6, name: 'اجرت رنگ‌آمیزی و کوره پولیش', operation: 'نقاشی و آسترکشی', partPrice: 0, labor: 20000000, salvage: 0, total: 20000000 }
          ];

          const dynamicParts = (claimCase.assessment?.parts && claimCase.assessment.parts.length > 0)
            ? claimCase.assessment.parts.map((p, idx) => ({
                id: idx + 1,
                name: p.name,
                operation: p.type === 'replace' ? 'تعویض کامل قطعه' : 'صافکاری و نقاشی',
                partPrice: p.price || (p.type === 'replace' ? 45000000 : 0),
                labor: p.labor || 15000000,
                salvage: p.depreciation || 0,
                total: (p.price || (p.type === 'replace' ? 45000000 : 0)) + (p.labor || 15000000) - (p.depreciation || 0)
              }))
            : defaultFieldParts;

          const carDamageSpotsData = claimCase.carDamageSpots || {
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

          // 1. Field Expert Assessment Card
          if (hasFieldAssessment) {
            cards.push({
              id: 'card_field_expert',
              type: 'FIELD_EXPERT',
              title: 'کارشناسی میدانی و بازرسی فیزیکی در محل حادثه',
              badge: 'بازدید حضوری و اصالت‌سنجی فیزیکی',
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
              victimSms: calc.victimSmsText,
              culpritSms: calc.culpritSmsText,
              photos: fieldDocs,
              isFinal: true, // No objection allowed!
              parts: dynamicParts,
              damageSpots: carDamageSpotsData
            });
          }

          // 2. Damage Assessor Assessments (History or Current)
          if (claimCase.assessments && claimCase.assessments.length > 0) {
            claimCase.assessments.forEach((a, idx) => {
              cards.push({
                id: `card_desk_assessor_${idx}`,
                type: 'DAMAGE_ASSESSOR',
                title: `کارشناسی ارزیاب خسارت (ارزیابی آنلاین - ${a.round || `مرحله ${idx + 1}`})`,
                badge: `ارزیابی تخصصی میزی - نوبت ${idx + 1}`,
                version: idx + 1,
                expertName: a.expertName || claimCase.assignedExpert?.name || 'فاطمه احمدی',
                expertRole: 'کارشناس ارزیاب خسارت خودرو',
                stampCode: `EXP-ONL-${8300 + idx}`,
                date: a.submittedAt || '۱۴۰۳/۱۱/۱۸',
                verdict: 'تایید کیفیت برآورد خسارت توسط بازبین ارشد بیمه‌گر',
                verdictType: 'info',
                directDamage: a.gross || calc.directDamageAmount,
                diminution: calc.diminutionAmount,
                diminutionPercent: calc.diminutionPercent,
                salvage: a.deductions || calc.franchiseAmount || 0,
                totalClaim: (a.gross || calc.directDamageAmount) + calc.diminutionAmount - (a.deductions || 0),
                policyCeiling: calc.policyMaxFinancialLimit,
                insurerPayable: a.payable || calc.insurerPayablePortion,
                culpritDebt: calc.culpritExcessDebt,
                exceedsCeiling: calc.exceedsCeiling,
                notes: a.reviewerNote || claimCase.assessment?.reviewerNote || 'برآورد هزینه تعویض و تعمیر قطعات با استعلام نرخ روز بازار و دستمزد اتحادیه',
                victimSms: calc.victimSmsText,
                culpritSms: calc.culpritSmsText,
                photos: [],
                isFinal: Boolean(claimCase.isFinalDecision || claimCase.status === 'تصمیم نهایی - غیرقابل اعتراض'),
                objectionStage: claimCase.objectionStage || 0,
                parts: dynamicParts,
                damageSpots: carDamageSpotsData
              });
            });
          } else if (claimCase.assessment && !hasFieldAssessment) {
            cards.push({
              id: 'card_desk_assessor_main',
              type: 'DAMAGE_ASSESSOR',
              title: 'کارشناسی ارزیاب خسارت (ارزیابی آنلاین و میزی)',
              badge: `ارزیابی تخصصی میزی - نسخه ${claimCase.assessment.version || 1}`,
              version: claimCase.assessment.version || 1,
              expertName: claimCase.assignedExpert?.name || claimCase.assessment.submittedBy || 'فاطمه احمدی',
              expertRole: 'کارشناس ارزیاب خسارت خودرو',
              stampCode: 'EXP-ONL-8340',
              date: claimCase.assessment.submittedAt || '۱۴۰۳/۱۱/۱۸',
              verdict: 'تایید شده توسط بازبین ارشد شرکت بیمه',
              verdictType: 'info',
              directDamage: calc.directDamageAmount,
              diminution: calc.diminutionAmount,
              diminutionPercent: calc.diminutionPercent,
              salvage: calc.franchiseAmount,
              totalClaim: calc.totalClaimAmount,
              policyCeiling: calc.policyMaxFinancialLimit,
              insurerPayable: calc.insurerPayablePortion,
              culpritDebt: calc.culpritExcessDebt,
              exceedsCeiling: calc.exceedsCeiling,
              notes: claimCase.assessment.reviewerNote || 'برآورد هزینه‌های فیزیکی و دستمزد بر اساس نرخ‌های مصوب سندیکای بیمه‌گران',
              victimSms: calc.victimSmsText,
              culpritSms: calc.culpritSmsText,
              photos: [],
              isFinal: Boolean(claimCase.isFinalDecision || claimCase.status === 'تصمیم نهایی - غیرقابل اعتراض'),
              objectionStage: claimCase.objectionStage || 0,
              parts: dynamicParts,
              damageSpots: carDamageSpotsData
            });
          }

          if (cards.length === 0) return null;

          return (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      کارت‌های کارشناسی و نتایج ارزیابی خسارت پرونده
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      برای مشاهده جزئیات کامل قطعات، قیمت‌ها، دیاگرام ۲بعدی و پیامک‌های ارسالی، روی هر کارت کلیک کنید.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-900 font-extrabold text-xs rounded-full border border-blue-200">
                  {cards.length} کارت کارشناسی
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {cards.map((card) => {
                  const isField = card.type === 'FIELD_EXPERT';
                  return (
                    <div
                      key={card.id}
                      className={`rounded-3xl border-2 transition-all shadow-sm hover:shadow-md overflow-hidden ${
                        isField
                          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-slate-50 border-emerald-300'
                          : 'bg-gradient-to-br from-blue-50 via-indigo-50/70 to-slate-50 border-indigo-200'
                      }`}
                    >
                      {/* Card Header */}
                      <div className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isField ? 'border-emerald-200/80 bg-emerald-100/40' : 'border-indigo-100 bg-indigo-100/40'
                      }`}>
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 ${
                            isField ? 'bg-emerald-600' : 'bg-indigo-600'
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
                                  ? 'bg-emerald-200/80 text-emerald-900 border-emerald-300'
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

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {isField ? (
                            <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-black shadow-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
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

                      {/* Card Body — Financial Metrics Summary */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <span className="text-slate-500 block mb-1 font-bold">خسارت مستقیم و اجرت</span>
                            <span className="font-bold text-slate-800 text-sm">
                              {formatCurrency(card.directDamage)}
                            </span>
                          </div>

                          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-500 font-bold">افت ارزش خودرو</span>
                              {card.diminutionPercent > 0 && (
                                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  {card.diminutionPercent}%
                                </span>
                              )}
                            </div>
                            <span className={`font-bold text-sm ${card.diminution > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                              {card.diminution > 0 ? formatCurrency(card.diminution) : 'شامل نمی‌شود'}
                            </span>
                          </div>

                          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <span className="text-slate-500 block mb-1 font-bold">کسورات داغی / استهلاک</span>
                            <span className="font-bold text-rose-700 text-sm">
                              {formatCurrency(card.salvage)}
                            </span>
                          </div>

                          <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-400 shadow-2xs">
                            <span className="text-slate-500 block mb-1 font-bold">مبلغ مصوب پرداختی بیمه</span>
                            <span className="font-black text-emerald-800 text-sm">
                              {formatCurrency(card.insurerPayable)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Click Banner to View Complete Breakdown Modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedAssessmentModal(card)}
                          className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 group active:scale-[0.99] cursor-pointer ${
                            isField
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-md shadow-indigo-600/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white shrink-0 group-hover:scale-110 transition-transform">
                              <Eye className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs sm:text-sm font-extrabold block">
                                مشاهده جزئیات کامل کارشناسی، قطعات، نمودار ۲بعدی خودرو، فاکتور و پیامک ابلاغیه (کلیک کنید)
                              </span>
                              <span className="text-[11px] text-white/80 block mt-0.5">
                                شامل فهرست کامل قطعات تعویضی و تعمیری، گزارش مستند، سقف تعهد مالی و پیامک‌های رسمی
                              </span>
                            </div>
                          </div>
                          <span className="px-3.5 py-1.5 rounded-xl bg-white/20 text-white text-xs font-black shrink-0 hidden sm:inline">
                            مشاهده ریز اقلام ↵
                          </span>
                        </button>

                        {/* Rules / Action Buttons */}
                        {isField ? (
                          <div className="space-y-3">
                            <div className="p-3.5 bg-emerald-100/90 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-1 shadow-2xs">
                              <div className="flex items-center gap-2 font-black text-emerald-900">
                                <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>ضوابط قانونی بیمه مرکزی: ارزیابی میدانی قطعی و نهایی است</span>
                              </div>
                              <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                                طبق ضوابط بیمه مرکزی، ارزیابی کارشناس میدانی بر اساس بازرسی فیزیکی حضوری در محل حادثه انجام پذیرفته و قطعی و نهایی می‌باشد؛ لذا امکان ثبت اعتراض وجود ندارد. لطفاً جهت دریافت خسارت، اطلاعات شماره شبا خود را تایید فرمایید.
                              </p>
                            </div>

                            {isVictim && claimCase.status !== 'پرداخت شده' && (
                              <button
                                onClick={() => setShowForm(true)}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                              >
                                <CreditCard className="w-4.5 h-4.5" />
                                تایید برآورد کارشناسی میدانی و ثبت شماره شبا (جهت واریز خسارت)
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {isVictim && claimCase.status !== 'پرداخت شده' && (
                              <div className="space-y-2">
                                <button
                                  onClick={() => setShowForm(true)}
                                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                  <CreditCard className="w-4.5 h-4.5" />
                                  تایید برآورد خسارت و ثبت شماره شبا (جهت واریز)
                                </button>

                                {/* Objection stages for damage assessor */}
                                {!card.isFinal && (
                                  <>
                                    {(!card.objectionStage || card.objectionStage === 0) && (
                                      <button
                                        onClick={() => setShowObjection1Modal(true)}
                                        className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                                      >
                                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                                        اعتراض به ارزیابی اولیه (مرحله ۱ - درخواست ارزیاب جدید)
                                      </button>
                                    )}

                                    {card.objectionStage === 1 && (
                                      <button
                                        onClick={() => setShowObjection2Modal(true)}
                                        className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                                      >
                                        <MessageSquare className="w-4 h-4 text-amber-600" />
                                        اعتراض به ارزیابی ثانویه (مرحله ۲ - چت مستقیم و ارسال مدارک تکمیلی به ارزیاب)
                                      </button>
                                    )}

                                    {card.objectionStage === 2 && (
                                      <button
                                        onClick={() => setShowWorkshopModal(true)}
                                        className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                                      >
                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                        اعتراض مرحله ۳ - ثبت اطلاعات تعمیرگاه مورد نظر
                                      </button>
                                    )}

                                    {card.objectionStage === 3 && (
                                      <button
                                        onClick={handleRequestFieldInspector}
                                        className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                                      >
                                        <UserCheck className="w-4 h-4 text-purple-600" />
                                        اعتراض مرحله ۴ - درخواست ارزیابی میدانی / مراجعه حضوری به شعبه
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
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
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setChatSelectedFile(evt.target?.result as string);
                      };
                      reader.readAsDataURL(file);
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
        {(showBankForm || claimCase.payoutInfo?.iban) && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              اطلاعات حساب بانکی برای واریز خسارت
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">نام صاحب حساب</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-bold">کد ملی</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  dir="ltr"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1 font-bold">شماره شبا (IBAN)</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="IR820540102680020817909002"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-white uppercase"
                  dir="ltr"
                />
              </div>
            </div>

            {claimCase.status === 'در انتظار تایید کاربر' && (
              <button
                onClick={handleAcceptAssessment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
              >
                ثبت اطلاعات بانکی و تایید نهایی
              </button>
            )}
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

      {/* Authenticity Doubt / Field Expert Request Modal */}
      {showAuthenticityModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 border-2 border-amber-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    اعلام تردید در اصالت تصادف و درخواست کارشناس میدانی
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    ثبت توسط: <span className="text-amber-800 font-black">{myRoleLabel}</span> | شرکت بیمه: {getInsurerPersianName(claimCase.culpritInsurer)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAuthenticityModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-900">
                <span>⚠️ توجه مهم:</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                با ثبت این فرم، پرونده مستقیماً برای شرکت بیمه‌گر ({getInsurerPersianName(claimCase.culpritInsurer)}) ارسال شده و یک <strong>کارشناس میدانی مجرب</strong> جهت بازدید حضوری از خودروها و صحنه تصادف، بررسی اصالت و ارزیابی خسارت به محل اعزام خواهد شد.
              </p>
            </div>

            <form onSubmit={handleSubmitAuthenticityDispute} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  علت اصلی تردید در اصالت یا نحوه حادثه <span className="text-rose-500">*</span>
                </label>
                <select
                  value={authenticityReason}
                  onChange={(e) => setAuthenticityReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="صحنه تصادف صوری یا ساختگی است">صحنه تصادف صوری یا ساختگی است</option>
                  <option value="عدم تطابق زاویه و ارتفاع برخورد با آسیب‌های خودرو">عدم تطابق زاویه و ارتفاع برخورد با آسیب‌های خودرو</option>
                  <option value="آسیب‌های ادعاشده قدیمی یا مربوط به حادثه قبلی است">آسیب‌های ادعاشده قدیمی یا مربوط به حادثه قبلی است</option>
                  <option value="راننده در زمان حادثه شخص دیگری بوده است (جابجایی راننده)">راننده در زمان حادثه شخص دیگری بوده است (جابجایی راننده)</option>
                  <option value="عدم حضور طرفین در محل اعلام‌شده / صحنه‌سازی مجدد">عدم حضور طرفین در محل اعلام‌شده / صحنه‌سازی مجدد</option>
                  <option value="اختلاف نظر جدی در نحوه وقوع و نیاز به بازدید فیزیکی">اختلاف نظر جدی در نحوه وقوع و نیاز به بازدید فیزیکی</option>
                  <option value="سایر موارد مشکوک به تقلب بیمه‌ای">سایر موارد مشکوک به تقلب بیمه‌ای</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  شرح دقیق دلایل و شواهد تردید <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={authenticityDesc}
                  onChange={(e) => setAuthenticityDesc(e.target.value)}
                  placeholder="لطفاً جزییات مواردی که نشان‌دهنده غیرواقعی بودن حادثه یا آسیب‌ها است را با دقت شرح دهید..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  پیوست عکس، ویدیو یا مدرک مستند (اختیاری)
                </label>
                <input
                  type="file"
                  id="auth-evidence-file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAuthenticityPhotoName(file.name);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setAuthenticityPhoto(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="auth-evidence-file"
                  className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-3 text-center block bg-slate-50 transition-colors"
                >
                  <Upload className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <span className="font-bold text-slate-700 block text-xs">
                    {authenticityPhotoName ? `فایل انتخاب شده: ${authenticityPhotoName}` : 'برای انتخاب تصویر یا فیلم مدرک کلیک کنید'}
                  </span>
                </label>
                {authenticityPhoto && (
                  <button
                    type="button"
                    onClick={() => { setAuthenticityPhoto(null); setAuthenticityPhotoName(''); }}
                    className="text-[11px] text-rose-600 font-bold mt-1 hover:underline block"
                  >
                    حذف فایل پیوست
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAuthenticityModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!authenticityDesc.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-blue-950 font-black shadow-md flex items-center gap-1.5 active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>ثبت و ارسال به بیمه‌گر جهت اعزام کارشناس</span>
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
                ? 'bg-gradient-to-r from-emerald-800 to-teal-900'
                : 'bg-gradient-to-r from-blue-900 to-indigo-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-white shadow-inner shrink-0">
                  {selectedAssessmentModal.type === 'FIELD_EXPERT' ? <UserCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg">
                      {selectedAssessmentModal.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 text-white border border-white/30">
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
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-140px)] text-slate-800 text-xs">
              
              {/* 1. Verdict & Summary Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                selectedAssessmentModal.type === 'FIELD_EXPERT'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-950'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>نتیجه و تاییدیه رسمی: {selectedAssessmentModal.verdict}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {selectedAssessmentModal.notes}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-white shadow-2xs border border-slate-200 font-extrabold text-xs text-slate-800 block text-center">
                    مبلغ قابل پرداخت بیمه: <strong className="text-emerald-700 font-black">{formatCurrency(selectedAssessmentModal.insurerPayable)}</strong>
                  </span>
                </div>
              </div>

              {/* 2. Interactive 2D Damage Car Diagram */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Car3DViewer readonly={true} damageData={{}} className="hidden" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                      نمودار دو بعدی (2D) قطعات و موقعیت آسیب‌دیدگی خودرو
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    اصالت‌سنجی فیزیکی
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
                  <Car3DViewer
                    readonly={true}
                    damageData={selectedAssessmentModal.damageSpots || {}}
                  />
                </div>
              </div>

              {/* 3. Detailed Parts & Labor Itemized Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-900" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                      فهرست ریز قطعات تعویضی، صافکاری، نقاشی و هزینه‌ها (قیمت‌گذاری نرخ روز)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200">
                    {selectedAssessmentModal.parts?.length || 0} ردیف خسارت
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
                        <th className="p-3 text-left">مبلغ خالص (ریال)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedAssessmentModal.parts || []).map((part: any, pIdx: number) => (
                        <tr key={part.id || pIdx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono font-bold">{pIdx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{part.name}</td>
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
                          <td className="p-3 text-left font-mono font-black text-emerald-800 bg-slate-50/50">
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
                        <td colSpan={4} className="p-3 text-left font-mono text-sm text-emerald-900">
                          {formatCurrency(selectedAssessmentModal.directDamage)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 4. Financial Calculations & Policy Ceiling Breakdown */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Shield className="w-4 h-4 text-blue-900" />
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                    تعهدات مالی بیمه‌نامه مقصر و تسهیم مبالغ پرداختی (استعلام برخط سنهاب)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 font-bold block mb-1">سقف تعهد مالی بیمه‌نامه مقصر</span>
                    <strong className="text-blue-950 font-black text-sm">
                      {formatCurrency(selectedAssessmentModal.policyCeiling)}
                    </strong>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-2xs">
                    <span className="text-slate-500 font-bold block mb-1">سهم پرداختی شرکت بیمه</span>
                    <strong className="text-emerald-700 font-black text-sm">
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

              {/* 5. Field Photos Gallery (if any) */}
              {selectedAssessmentModal.photos && selectedAssessmentModal.photos.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-extrabold text-slate-900 text-xs block">
                    تصاویر و مدارک پیوست کارشناسی میدانی در محل حادثه:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedAssessmentModal.photos.map((doc: any, pIdx: number) => {
                      const imgSrc = doc.dataUrl || doc.url || '';
                      return (
                        <div
                          key={pIdx}
                          onClick={() => imgSrc && setPreviewImageModal(imgSrc)}
                          className="aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer hover:opacity-90 relative group"
                        >
                          <img src={imgSrc} alt={doc.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold p-1 text-center">
                            {doc.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. SMS Messages & Official Notification Dispatches */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-900" />
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                      متن پیامک‌های رسمی ارسالی از سمت شرکت بیمه (ابلاغیه مالی و سقف تعهد)
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    ابلاغ شده به طرفین
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>پیامک ارسالی به زیان‌دیده ({claimCase.victimName || 'زیان‌دیده'}):</span>
                      <span className="text-emerald-700 text-[10px] font-black">تحویل داده شد</span>
                    </div>
                    <p className="text-[11px] text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-mono select-all">
                      {selectedAssessmentModal.victimSms}
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>پیامک ارسالی به مقصر حادثه ({claimCase.culpritName || 'مقصر'}):</span>
                      <span className="text-emerald-700 text-[10px] font-black">تحویل داده شد</span>
                    </div>
                    <p className="text-[11px] text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed font-mono select-all">
                      {selectedAssessmentModal.culpritSms}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedAssessmentModal(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold text-xs transition-colors"
              >
                بستن پنجره جزئیات
              </button>

              {isVictim && claimCase.status !== 'پرداخت شده' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssessmentModal(null);
                    setShowForm(true);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  تایید برآورد و ثبت شماره شبا جهت واریز
                </button>
              )}
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
    </div>
  );
};
