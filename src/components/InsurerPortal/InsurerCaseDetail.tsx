import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  Building2,
  Clock,
  AlertTriangle,
  CreditCard,
  Printer,
  CheckCircle2,
  FileText,
  UserCheck,
  RotateCcw,
  Sparkles,
  Info,
  MapPin,
  User,
  X,
  ExternalLink,
  Search,
  Maximize2,
  FileBadge,
  Phone,
  Hash,
  Shield,
  Car,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Lock,
  DollarSign
} from 'lucide-react';
import { ClaimCase, UserSession, StaffMember, AssessorNotification } from '../../types';
import { INITIAL_EXPERTS, INITIAL_FIELD_EXPERTS } from '../../data/mockData';
import { formatCurrency, getInsurerPersianName, loadExpertsFromStorage, loadFieldExpertsFromStorage, loadAssessorNotifications, saveAssessorNotifications } from '../../lib/storage';
import { calculateClaimDamageWithPolicyLimits, performPolicySanhabInquiry } from '../../lib/policyLimitCalculator';
import { Car3DViewer } from '../Car3DViewer';

interface InsurerCaseDetailProps {
  session: UserSession;
  claimCase: ClaimCase;
  onBack: () => void;
  onUpdateCase: (updatedCase: ClaimCase) => void;
}

// Persian License Plate Badge Component
const IranianPlateBadge: React.FC<{ plate?: string }> = ({ plate = '45 الف 567 ایران 33' }) => {
  return (
    <div className="inline-flex items-center dir-ltr border-2 border-slate-900 rounded-lg overflow-hidden bg-white text-slate-900 shadow-2xs font-extrabold text-xs select-none">
      <div className="bg-blue-800 text-white px-1.5 py-1 text-[8px] flex flex-col items-center justify-center border-r border-slate-900 leading-tight">
        <span className="text-[7px]">IR</span>
        <span>ایران</span>
      </div>
      <div className="px-2 py-1 font-black text-xs tracking-wider flex items-center gap-1.5 dir-rtl">
        {plate}
      </div>
    </div>
  );
};

export const InsurerCaseDetail: React.FC<InsurerCaseDetailProps> = ({
  session,
  claimCase,
  onBack,
  onUpdateCase
}) => {
  const companyCode = session.company || 'dana';
  const allStoredExperts = loadExpertsFromStorage();
  const allCompanyExperts = allStoredExperts[companyCode] || INITIAL_EXPERTS[companyCode] || [];
  // Filter ONLY active experts (cannot assign cases to inactive assessors)
  const activeCompanyExperts = allCompanyExperts.filter((e) => e.active !== false);

  // Field Experts (کارشناسان میدانی)
  const allStoredFieldExperts = loadFieldExpertsFromStorage();
  const allCompanyFieldExperts = allStoredFieldExperts[companyCode] || INITIAL_FIELD_EXPERTS[companyCode] || [];
  const activeCompanyFieldExperts = allCompanyFieldExperts.filter((e) => e.active !== false);

  const hasCroqui = Boolean(
    claimCase.hasKroki ||
    claimCase.sceneReportCode ||
    claimCase.customerKrokiPhoto ||
    claimCase.croquiData ||
    claimCase.isOnlineCroqui
  );
  const isNoCroquiCase = !hasCroqui;

  const [selectedExpertId, setSelectedExpertId] = useState(
    claimCase.assignedExpert?.id || (activeCompanyExperts[0]?.id || '')
  );

  const [selectedFieldExpertId, setSelectedFieldExpertId] = useState(
    claimCase.assignedFieldExpert?.id || (activeCompanyFieldExperts[0]?.id || '')
  );

  // Search filters & custom note to expert
  const [expertSearchTerm, setExpertSearchTerm] = useState('');
  const [fieldExpertSearchTerm, setFieldExpertSearchTerm] = useState('');
  const [expertAssignmentNote, setExpertAssignmentNote] = useState('');
  const [fieldExpertAssignmentNote, setFieldExpertAssignmentNote] = useState('');
  const [isExpertDropdownOpen, setIsExpertDropdownOpen] = useState(false);
  const [isFieldExpertDropdownOpen, setIsFieldExpertDropdownOpen] = useState(false);

  // State to toggle re-assignment dropdown if already assigned
  const [isChangingExpert, setIsChangingExpert] = useState(!claimCase.assignedExpert);
  const [isChangingFieldExpert, setIsChangingFieldExpert] = useState(!claimCase.assignedFieldExpert && (!claimCase.assignedExpert || !claimCase.assignedExpert.role?.includes('میدانی')));
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [fieldAssignmentFeedback, setFieldAssignmentFeedback] = useState<string | null>(null);

  // Assessment rounds evaluation (supports single or multi-round assessments)
  const allAssessments = useMemo(() => {
    if (claimCase.assessments && claimCase.assessments.length > 0) {
      return claimCase.assessments;
    }
    if (
      claimCase.assessment &&
      ((claimCase.assessment.gross && claimCase.assessment.gross > 0) ||
        (claimCase.assessment.parts && claimCase.assessment.parts.length > 0) ||
        claimCase.assessment.submittedAt)
    ) {
      return [
        {
          round: 'ارزیابی کارشناس اول',
          roundIdx: 1,
          expertName: claimCase.assignedExpert?.name || claimCase.assessment.submittedBy || 'کارشناس ارزیاب',
          submittedAt: claimCase.assessment.submittedAt || claimCase.date || 'ثبت‌شده',
          gross: claimCase.assessment.gross || 0,
          deductions: claimCase.assessment.deductions || 0,
          salvage: claimCase.assessment.salvage || 0,
          payable: claimCase.assessment.payable || 0,
          reviewerNote: claimCase.assessment.reviewerNote || '',
          parts: claimCase.assessment.parts || [],
          status: claimCase.assessment.status || 'SUBMITTED'
        }
      ];
    }
    return [];
  }, [claimCase]);

  // Is case evaluated yet? (Must have real assessments recorded)
  const hasCompletedAssessment = allAssessments.length > 0;
  const [selectedAssessmentTabIndex, setSelectedAssessmentTabIndex] = useState(0);
  const activeAssessment = allAssessments[selectedAssessmentTabIndex] || allAssessments[0] || null;

  // Modal State for Cards ("time_location", "victim_info", "culprit_info")
  const [activeModalTab, setActiveModalTab] = useState<'time_location' | 'victim_info' | 'culprit_info' | null>(null);

  // Police Croqui Inquiry State (Only for croqui cases)
  const [isQueryingCroqui, setIsQueryingCroqui] = useState(false);
  const [hasQueriedCroqui, setHasQueriedCroqui] = useState(
    hasCroqui && !!(claimCase.croquiData || claimCase.sceneReportCode || claimCase.customerKrokiPhoto)
  );
  // Section Expand/Collapse states for Insurer Portal tabs
  const [isCroquiExpanded, setIsCroquiExpanded] = useState(true);
  const [isAssessmentExpanded, setIsAssessmentExpanded] = useState(true);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(true);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);

  const handleQueryCroqui = async () => {
    setIsCroquiExpanded(true);
    setIsQueryingCroqui(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsQueryingCroqui(false);
    setHasQueriedCroqui(true);
  };

  // Reviewer State
  const [reviewerNote, setReviewerNote] = useState('');
  const [showReviewerReturnModal, setShowReviewerReturnModal] = useState(false);
  const [reviewerReturnReason, setReviewerReturnReason] = useState('');

  const handleReviewerApprove = () => {
    if (!claimCase.assessment) return;

    const isFinalStage = claimCase.objectionStage === 4;
    const nextStatus = isFinalStage ? 'تصمیم نهایی - غیرقابل اعتراض' : 'در انتظار تایید کاربر';

    const damageCalc = calculateClaimDamageWithPolicyLimits(claimCase);
    const sanhabInq = performPolicySanhabInquiry(claimCase);

    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

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

    const currentAssessments = claimCase.assessments || [];
    const updatedAssessments = currentAssessments.map(a => ({
      ...a,
      approvedByReviewer: true,
      approvedAt: new Date().toLocaleString('fa-IR')
    }));

    const updated: ClaimCase = {
      ...claimCase,
      status: nextStatus,
      isFinalDecision: isFinalStage ? true : claimCase.isFinalDecision,
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
      smsDispatchLogs: [...(claimCase.smsDispatchLogs || []), victimSmsLog, culpritSmsLog],
      reviewerApproval: {
        approved: true,
        approvedBy: session.name || 'بازبین ارشد بیمه',
        approvedAt: new Date().toLocaleString('fa-IR'),
        note: reviewerNote.trim() || undefined
      },
      reviewerReturn: undefined,
      assessments: updatedAssessments,
      history: [
        ...(claimCase.history || []),
        {
          status: nextStatus,
          time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          user: session.name || 'بازبین ارشد بیمه',
          note: isFinalStage
            ? `تایید ارزیابی میدانی توسط بازبین ارشد — سهم بیمه: ${formatCurrency(damageCalc.insurerPayablePortion)} | مازاد بدهی مقصر: ${formatCurrency(damageCalc.culpritExcessDebt)} (رای قطعی).`
            : `تایید ارزیابی خسارت توسط بازبین ارشد (${session.name}) با سقف تعهد مالی ${formatCurrency(damageCalc.policyMaxFinancialLimit)} — پرونده جهت تایید نهایی به زیان‌دیده ابلاغ گردید.`
        }
      ]
    };

    onUpdateCase(updated);
    alert(isFinalStage ? 'ارزیابی میدانی نهایی تایید گردید. این پرونده مختومه اعلام شده و رای قطعی صادر شد.' : 'برآورد خسارت کارشناس توسط بازبین تایید گردید و جهت مشاهده/تایید به زیان‌دیده ابلاغ شد.');
  };

  const handleReviewerReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerReturnReason.trim()) return;

    const updated: ClaimCase = {
      ...claimCase,
      status: 'نیازمند اصلاح کارشناس',
      reviewerReturn: {
        reason: reviewerReturnReason.trim(),
        returnedBy: session.name || 'بازبین ارشد بیمه',
        returnedAt: new Date().toLocaleString('fa-IR')
      },
      history: [
        ...(claimCase.history || []),
        {
          status: 'نیازمند اصلاح کارشناس',
          time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          user: session.name || 'بازبین ارشد بیمه',
          note: `عدم تایید ارزیابی و عودت به کارشناس خسارت جهت اصلاح. دلیل عودت: «${reviewerReturnReason.trim()}»`
        }
      ]
    };

    onUpdateCase(updated);
    setShowReviewerReturnModal(false);
    setReviewerReturnReason('');
    alert('پرونده جهت اصلاح برآورد به کارشناس خسارت عودت داده شد.');
  };
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const filteredExperts = activeCompanyExperts.filter(e =>
    e.name.includes(expertSearchTerm) || e.role.includes(expertSearchTerm) || (e.phone && e.phone.includes(expertSearchTerm))
  );

  const filteredFieldExperts = activeCompanyFieldExperts.filter(fe =>
    fe.name.includes(fieldExpertSearchTerm) || fe.role.includes(fieldExpertSearchTerm) || (fe.phone && fe.phone.includes(fieldExpertSearchTerm)) || (fe.nationalId && fe.nationalId.includes(fieldExpertSearchTerm))
  );

  const isPreviousAssessor = (expertId: string) => {
    return (
      claimCase.previousAssessorIds?.includes(expertId) ||
      claimCase.previousAssignedExpert?.id === expertId ||
      claimCase.rejectedByAssessorIds?.includes(expertId)
    );
  };

  const handleAssignFieldExpert = () => {
    const fieldExpert = activeCompanyFieldExperts.find((fe) => fe.id === selectedFieldExpertId);
    if (!fieldExpert) return;

    const isReassign = !!claimCase.assignedFieldExpert || !!claimCase.assignedExpert;
    const noteText = fieldExpertAssignmentNote.trim();

    // Create real-time SMS notification for the Field Expert
    const existingNotifs = loadAssessorNotifications();
    const newSmsNotif: AssessorNotification = {
      id: `SMS-FE-${Date.now()}`,
      type: 'SMS',
      caseId: claimCase.id,
      expertId: fieldExpert.id,
      recipientPhone: fieldExpert.phone,
      senderPhone: '10008000',
      title: 'ارجاع فوری ماموریت بازدید میدانی و احراز اصالت',
      message: `کارشناس گرامی ${fieldExpert.name}، پرونده خسارت ${claimCase.id} (${claimCase.carModel || 'خودرو زیان‌دیده'} - پلاک ${claimCase.plateNumber || 'نامشخص'}) جهت بازرسی فوری در محل حادثه و احراز اصالت به شما محول گردید. آدرس: ${claimCase.accidentLocation || 'محل حادثه'} ${noteText ? `| دستور بیمه‌گر: ${noteText}` : ''}`,
      sentAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    saveAssessorNotifications([newSmsNotif, ...existingNotifs]);

    const updated: ClaimCase = {
      ...claimCase,
      assignedExpert: fieldExpert,
      assignedFieldExpert: fieldExpert,
      status: 'در انتظار بازدید کارشناس میدانی',
      needsCulpritFieldVisit: true,
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار بازدید کارشناس میدانی',
          time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          user: session.name || 'پورتال بیمه‌گر',
          userRole: 'کارشناس پذیرش شرکت بیمه',
          note: isReassign
            ? `ارجاع پرونده به کارشناس میدانی جدید «${fieldExpert.name}» (${fieldExpert.role} - ${fieldExpert.phone}) تغییر یافت و پیامک اعزام به محل ارسال شد.${noteText ? ` توضیحات بیمه‌گر: «${noteText}»` : ''}`
            : `پرونده به کارشناس میدانی «${fieldExpert.name}» (${fieldExpert.role} - ${fieldExpert.phone}) جهت بازدید میدانی و احراز اصالت ارجاع شد و پیامک فوری ارسال گردید.${noteText ? ` توضیحات بیمه‌گر: «${noteText}»` : ''}`
        }
      ]
    };

    onUpdateCase(updated);
    setIsChangingFieldExpert(false);
    setFieldExpertAssignmentNote('');
    setFieldAssignmentFeedback(`پرونده با موفقیت به کارشناس میدانی «${fieldExpert.name}» ارجاع گردید و پیامک مأموریت ارسال شد.`);
    setTimeout(() => setFieldAssignmentFeedback(null), 5000);
  };

  const handleAssignExpert = () => {
    const expert = activeCompanyExperts.find((e) => e.id === selectedExpertId);
    if (!expert) return;

    if (isPreviousAssessor(expert.id)) {
      alert('امکان ارجاع پرونده به ارزیاب اول/قبلی وجود ندارد! طبق مقررات بیمه مرکزی، پرونده‌های معترض باید به ارزیاب دیگری محول گردند.');
      return;
    }

    const isReassign = !!claimCase.assignedExpert;
    const isTimeoutReassign = Boolean(claimCase.autoReturnedDueToTimeout);
    const noteText = expertAssignmentNote.trim();

    const updated: ClaimCase = {
      ...claimCase,
      assignedExpert: expert,
      status: 'محول شده به کارشناس',
      autoReturnedDueToTimeout: false,
      assignedTimestamp: Date.now(),
      assignedAt: new Date().toISOString(),
      history: [
        ...(claimCase.history || []),
        {
          status: 'محول شده به کارشناس',
          time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          user: session.name || 'پورتال بیمه‌گر',
          note: isTimeoutReassign
            ? `ارجاع مجدد پرونده (پس از انقضای ۷۲ ساعته کارشناس قبلی) به کارشناس جدید «${expert.name}» با بازنشانی مهلت ۷۲ ساعته SLA.${noteText ? ` توضیحات بیمه‌گر: «${noteText}»` : ''}`
            : isReassign
            ? `ارجاع پرونده از «${claimCase.assignedExpert?.name}» به کارشناس «${expert.name}» تغییر یافت.${noteText ? ` توضیحات بیمه‌گر: «${noteText}»` : ''}`
            : `پرونده به کارشناس ارزیاب «${expert.name}» محول گردید.${noteText ? ` توضیحات بیمه‌گر: «${noteText}»` : ''}`
        }
      ]
    };

    onUpdateCase(updated);
    setIsChangingExpert(false);
    setExpertAssignmentNote('');
    setAssignmentFeedback(`پرونده با موفقیت به کارشناس جدید «${expert.name}» محول شد و مهلت ۷۲ ساعته فعال گردید.`);
    setTimeout(() => setAssignmentFeedback(null), 5000);
  };

  const handleStatusChange = (newStatus: any) => {
    const updated: ClaimCase = {
      ...claimCase,
      status: newStatus,
      history: [
        ...(claimCase.history || []),
        {
          status: newStatus,
          time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          user: session.name || 'پورتال بیمه‌گر',
          note: `تغییر وضعیت پرونده به «${newStatus}»`
        }
      ]
    };
    onUpdateCase(updated);
  };

  // Timeline History items fallback if none recorded
  const timelineHistory = (claimCase.history && claimCase.history.length > 0)
    ? claimCase.history
    : [
        {
          status: 'در انتظار استعلام بیمه مقصر',
          time: claimCase.date || '۱۴۰۵/۰۵/۰۶ - ۱۰:۰۲',
          user: claimCase.victimName || 'پریسا',
          note: 'ثبت اولیه پرونده خسارت توسط زیان‌دیده'
        },
        {
          status: 'در انتظار ارجاع به ارزیاب',
          time: claimCase.date || '۱۴۰۵/۰۵/۰۶ - ۱۰:۰۵',
          user: 'سامانه (استعلام خودکار)',
          note: 'استعلام خودکار با بیمه مرکزی انجام و سقف تعهدات تایید گردید.'
        },
        ...(claimCase.assignedExpert ? [{
          status: 'محول شده به کارشناس',
          time: '۱۴۰۵/۰۵/۰۶ - ۱۰:۳۰',
          user: session.name || 'پورتال بیمه‌گر',
          note: `پرونده به کارشناس ارزیاب ${claimCase.assignedExpert.name} محول گردید`
        }] : [])
      ];

  // Sample photos if claimCase doesn't have images
  const sampleImages = claimCase.images && claimCase.images.length > 0
    ? claimCase.images
    : [
        { url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', title: 'پلاک خودرو و زاویه جلوی حادثه' },
        { url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80', title: 'تصویر آسیب‌دیدگی بدنه و سپر' }
      ];

  // Documents uploaded for Victim
  const victimDocs = [
    { url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', title: 'تصویر کارت خودرو زیان‌دیده' },
    { url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&q=80', title: 'تصویر گواهینامه رانندگی زیان‌دیده' },
    { url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', title: 'بیمه‌نامه ثالث زیان‌دیده' }
  ];

  // Documents uploaded for Culprit
  const culpritDocs = [
    { url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80', title: 'بیمه‌نامه شخص ثالث مقصر' },
    { url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80', title: 'تصویر کارت ماشین مقصر' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in pb-16">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black text-slate-900 bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border-2 border-slate-300 shadow-xs transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-blue-900" />
          <span>بازگشت به لیست پرونده‌ها</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">کد پرونده:</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-lg text-xs font-black font-mono">
            {claimCase.id}
          </span>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Sidebar: Assessor Assignment & Controls */}
        <div className="lg:col-span-4 space-y-5 order-2 lg:order-1">
          {/* Card: Assessor or Field Expert Assignment */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                {isNoCroquiCase ? (
                  <>
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                    <span>تخصیص کارشناس میدانی</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4.5 h-4.5 text-purple-600" />
                    <span>جستجوی ارزیاب و ارجاع</span>
                  </>
                )}
              </h3>
              {isNoCroquiCase && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  بدون کروکی
                </span>
              )}
            </div>

            {/* Mandatory Regulatory Warning for No-Croqui Cases */}
            {isNoCroquiCase && (
              <div className="p-3 bg-amber-50/90 border-2 border-amber-300 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>الزام ارجاع به کارشناس میدانی:</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed font-bold">
                  این پرونده چون بدون کروکی است، باید شما به یک کارشناس میدانی جهت بازدید حضوری و احراز اصالت ارجاع دهید.
                </p>
              </div>
            )}

            {/* Alert: Case Returned Due to 72h Timeout or Rejected by Assessor */}
            {(claimCase.status === 'رد شده' || claimCase.expertRejected || claimCase.autoReturnedDueToTimeout) && !claimCase.assignedExpert && (
              <div className={`p-4 border-2 rounded-2xl text-xs space-y-2 animate-in fade-in ${
                claimCase.autoReturnedDueToTimeout
                  ? 'bg-rose-100/90 border-rose-400 text-rose-950 shadow-sm'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-black text-rose-950 text-xs">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-700 shrink-0" />
                    <span>
                      {claimCase.autoReturnedDueToTimeout
                        ? 'عودت خودکار سیستمی به دلیل انقضای مهلت ۷۲ ساعته:'
                        : 'عدم پذیرش پرونده توسط کارشناس ارزیاب:'}
                    </span>
                  </div>
                  {claimCase.autoReturnedDueToTimeout && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-700 text-white shadow-2xs">
                      سلب صلاحیت کارشناس
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-rose-900 leading-relaxed font-bold">
                  {claimCase.autoReturnedDueToTimeout
                    ? `این پرونده پس از تخصیص به کارشناس (${claimCase.timedOutExpert?.name || claimCase.expertRejected?.by || 'کارشناس قبلی'})، به مدت ۷۲ ساعت (۴۳۲۰ دقیقه) بلاتکلیف ماند و بدون ثبت تایید یا رد ارزیابی، توسط سامانه هوشمند سلب صلاحیت و به شرکت بیمه عودت داده شد. پیامک اطلاع‌رسانی سلب صلاحیت برای کارشناس ارسال و جریمه منفی در شایستگی ایشان اعمال گردید.`
                    : claimCase.expertRejected?.reason
                    ? `دلیل عدم پذیرش: «${claimCase.expertRejected.reason}» (${claimCase.expertRejected.by || 'کارشناس قبلی'})`
                    : 'کارشناس قبلی این پرونده را نپذیرفته و رد کرده است.'}
                </p>

                <div className="p-2.5 bg-white/80 rounded-xl border border-rose-300/80 text-[11px] text-rose-950 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                  <span>اقدام مورد نیاز: لطفاً از فرم زیر، پرونده را به کارشناس فعال دیگری محول نمایید.</span>
                </div>
              </div>
            )}

            {assignmentFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{assignmentFeedback}</span>
              </div>
            )}

            {fieldAssignmentFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{fieldAssignmentFeedback}</span>
              </div>
            )}

            {/* Authenticity Dispute Alert Banner */}
            {claimCase.authenticityDispute && (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>اعلام تردید در اصالت تصادف توسط مشتری ({claimCase.authenticityDispute.disputedBy} - {claimCase.authenticityDispute.role})</span>
                </div>
                <p className="text-[11px] text-rose-950 font-bold bg-white p-2.5 rounded-xl border border-rose-200 leading-relaxed">
                  «{claimCase.authenticityDispute.reason}»: {claimCase.authenticityDispute.description}
                </p>
                <p className="text-[10px] text-rose-800 font-bold">
                  دستور اقدام: لطفاً یک کارشناس میدانی مجرب انتخاب کرده و جهت بازرسی فیزیکی خودروها و صحنه تصادف به محل اعزام نمایید.
                </p>
              </div>
            )}

            {(isNoCroquiCase || claimCase.authenticityDispute || claimCase.status === 'تردید در اصالت تصادف' || claimCase.status === 'در انتظار بازدید کارشناس میدانی' || claimCase.status === 'در حال بازدید کارشناس میدانی' || claimCase.needsCulpritFieldVisit) ? (
              /* NO CROQUI OR AUTHENTICITY DISPUTE: FIELD EXPERT ASSIGNMENT FLOW */
              (claimCase.assignedFieldExpert || (claimCase.assignedExpert && claimCase.assignedExpert.role?.includes('میدانی'))) && !isChangingFieldExpert ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-amber-800 font-extrabold block">کارشناس میدانی پرونده:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                      محول شده به میدانی
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 text-sm">
                        {claimCase.assignedFieldExpert?.name || claimCase.assignedExpert?.name}
                      </h5>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {claimCase.assignedFieldExpert?.role || claimCase.assignedExpert?.role} ({claimCase.assignedFieldExpert?.phone || claimCase.assignedExpert?.phone || 'بدون همراه'})
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-amber-100">
                    پرونده جهت بررسی میدانی و بازدید صحنه/خودرو به این کارشناس میدانی ارجاع داده شده است.
                  </p>

                  <button
                    onClick={() => {
                      setIsChangingFieldExpert(true);
                      setIsFieldExpertDropdownOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-600/20 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تغییر یا ارجاع به کارشناس میدانی دیگر</span>
                  </button>
                </div>
              ) : (
                /* Unified Single Search & Select Combobox for Field Expert */
                <div className="space-y-3.5 animate-in fade-in">
                  {(claimCase.assignedFieldExpert || claimCase.assignedExpert) && (
                    <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-950 font-bold flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>کارشناس کنونی: {claimCase.assignedFieldExpert?.name || claimCase.assignedExpert?.name}</span>
                    </div>
                  )}

                  {/* Combobox Container */}
                  <div className="space-y-1.5 relative">
                    <label className="block text-xs font-bold text-slate-800">
                      انتخاب و جستجوی کارشناس میدانی:
                    </label>

                    {/* Integrated Search & Dropdown Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-amber-700 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={fieldExpertSearchTerm}
                        onChange={(e) => {
                          setFieldExpertSearchTerm(e.target.value);
                          setIsFieldExpertDropdownOpen(true);
                        }}
                        onFocus={() => setIsFieldExpertDropdownOpen(true)}
                        placeholder="نام کارشناس میدانی، تخصص، تلفن یا کد ملی..."
                        className="w-full pr-10 pl-9 py-2.5 rounded-xl border-2 border-amber-300 bg-amber-50/40 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-200 transition-all placeholder:text-slate-400"
                      />
                      {fieldExpertSearchTerm ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFieldExpertSearchTerm('');
                            setIsFieldExpertDropdownOpen(true);
                          }}
                          className="absolute left-3 top-3 text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                      )}
                    </div>

                    {/* Combobox Dropdown Results List */}
                    {isFieldExpertDropdownOpen && (
                      <div className="absolute z-30 w-full mt-1 bg-white rounded-2xl border-2 border-amber-300 shadow-xl overflow-hidden animate-in fade-in max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {filteredFieldExperts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 font-bold">
                            کارشناس میدانی با مشخصات جستجو شده یافت نشد
                          </div>
                        ) : (
                          filteredFieldExperts.map((fe) => {
                            const isSelected = selectedFieldExpertId === fe.id;
                            return (
                              <div
                                key={fe.id}
                                onClick={() => {
                                  setSelectedFieldExpertId(fe.id);
                                  setFieldExpertSearchTerm(fe.name);
                                  setIsFieldExpertDropdownOpen(false);
                                }}
                                className={`p-3 cursor-pointer transition-all flex items-center justify-between text-xs ${
                                  isSelected
                                    ? 'bg-amber-50 text-amber-950 font-black'
                                    : 'hover:bg-slate-50 text-slate-800 font-bold'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 pr-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate">{fe.name}</span>
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] rounded-md font-bold shrink-0">
                                      {fe.role}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal">
                                    تلفن: {fe.phone || 'ثبت نشده'} {fe.nationalId ? `• کد ملی: ${fe.nationalId}` : ''}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <span className="px-2 py-1 bg-amber-600 text-white text-[10px] rounded-lg font-bold shrink-0 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>انتخاب شده</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-700 font-bold shrink-0">
                                    انتخاب
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Field Expert Display Badge */}
                  {selectedFieldExpertId && (
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-300 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="w-4 h-4 text-amber-700 shrink-0" />
                        <div className="truncate">
                          <span className="text-slate-600 font-medium">کارشناس انتخاب‌شده: </span>
                          <span className="font-black text-amber-950">
                            {activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId)?.name || 'انتخاب نشده'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 shrink-0">
                        {activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId)?.phone}
                      </span>
                    </div>
                  )}

                  {/* Optional Note / Instruction for Field Expert */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      توضیحات و دستور کار برای کارشناس میدانی (اختیاری):
                    </label>
                    <textarea
                      rows={2}
                      value={fieldExpertAssignmentNote}
                      onChange={(e) => setFieldExpertAssignmentNote(e.target.value)}
                      placeholder="مثال: لطفاً تصاویر محل حادثه و زاویه برخورد دو خودرو به همراه مطابقت بیمه‌نامه بررسی گردد..."
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-medium text-xs focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    onClick={handleAssignFieldExpert}
                    disabled={!selectedFieldExpertId}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs shadow-md shadow-amber-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>ارجاع پرونده به کارشناس میدانی</span>
                  </button>

                  {(claimCase.assignedFieldExpert || claimCase.assignedExpert) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingFieldExpert(false);
                        setIsFieldExpertDropdownOpen(false);
                      }}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      انصراف از تغییر
                    </button>
                  )}
                </div>
              )
            ) : (
              /* REGULAR CROQUI CASE: ASSESSOR ASSIGNMENT FLOW */
              claimCase.assignedExpert && !isChangingExpert ? (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-700 font-extrabold block">ارزیاب فعلی پرونده:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      محول شده
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-900 text-sm">
                        {claimCase.assignedExpert.name}
                      </h5>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {claimCase.assignedExpert.role} ({claimCase.assignedExpert.phone || 'بدون همراه'})
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-purple-100/80">
                    پرونده به این ارزیاب محول گردیده و در صف بررسی کارشناسی قرار دارد.
                  </p>

                  <button
                    onClick={() => {
                      setIsChangingExpert(true);
                      setIsExpertDropdownOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تغییر یا ارجاع به ارزیاب دیگر</span>
                  </button>
                </div>
              ) : (
                /* Unified Single Search & Select Combobox for Regular Assessor */
                <div className="space-y-3.5 animate-in fade-in">
                  {claimCase.assignedExpert && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-bold flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>ارزیاب کنونی: {claimCase.assignedExpert.name}</span>
                    </div>
                  )}

                  {(claimCase.previousAssessorIds && claimCase.previousAssessorIds.length > 0) && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-950 font-bold space-y-1">
                      <div className="flex items-center gap-1 text-rose-700">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>هشدار عدم ارجاع مجدد:</span>
                      </div>
                      <p className="text-[10px] text-rose-800 leading-relaxed font-normal">
                        طبق آئین‌نامه، امکان ارجاع پرونده به کارشناس اول/قبلی وجود ندارد. لطفاً ارزیاب دیگری انتخاب فرمایید.
                      </p>
                    </div>
                  )}

                  {/* Combobox Container */}
                  <div className="space-y-1.5 relative">
                    <label className="block text-xs font-bold text-slate-800">
                      انتخاب و جستجوی ارزیاب خسارت:
                    </label>

                    {/* Integrated Search & Dropdown Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-purple-700 absolute right-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={expertSearchTerm}
                        onChange={(e) => {
                          setExpertSearchTerm(e.target.value);
                          setIsExpertDropdownOpen(true);
                        }}
                        onFocus={() => setIsExpertDropdownOpen(true)}
                        placeholder="نام ارزیاب، تخصص، تلفن یا کد ملی..."
                        className="w-full pr-10 pl-9 py-2.5 rounded-xl border-2 border-purple-300 bg-purple-50/40 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-slate-400"
                      />
                      {expertSearchTerm ? (
                        <button
                          type="button"
                          onClick={() => {
                            setExpertSearchTerm('');
                            setIsExpertDropdownOpen(true);
                          }}
                          className="absolute left-3 top-3 text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                      )}
                    </div>

                    {/* Combobox Dropdown Results List */}
                    {isExpertDropdownOpen && (
                      <div className="absolute z-30 w-full mt-1 bg-white rounded-2xl border-2 border-purple-300 shadow-xl overflow-hidden animate-in fade-in max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {filteredExperts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 font-bold">
                            ارزیابی با مشخصات جستجو شده یافت نشد
                          </div>
                        ) : (
                          filteredExperts.map((exp) => {
                            const disabled = isPreviousAssessor(exp.id);
                            const isSelected = selectedExpertId === exp.id;
                            return (
                              <div
                                key={exp.id}
                                onClick={() => {
                                  if (disabled) {
                                    alert('امکان ارجاع پرونده به ارزیاب قبلی وجود ندارد.');
                                    return;
                                  }
                                  setSelectedExpertId(exp.id);
                                  setExpertSearchTerm(exp.name);
                                  setIsExpertDropdownOpen(false);
                                }}
                                className={`p-3 transition-all flex items-center justify-between text-xs ${
                                  disabled
                                    ? 'bg-slate-50/70 text-slate-400 cursor-not-allowed opacity-60'
                                    : isSelected
                                    ? 'bg-purple-50 text-purple-950 font-black cursor-pointer'
                                    : 'hover:bg-slate-50 text-slate-800 font-bold cursor-pointer'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0 pr-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate">{exp.name}</span>
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-900 text-[10px] rounded-md font-bold shrink-0">
                                      {exp.role}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal">
                                    تلفن: {exp.phone || 'ثبت نشده'} {disabled ? '• (ارزیاب قبلی - غیرمجاز)' : ''}
                                  </div>
                                </div>
                                {isSelected ? (
                                  <span className="px-2 py-1 bg-purple-600 text-white text-[10px] rounded-lg font-bold shrink-0 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>انتخاب شده</span>
                                  </span>
                                ) : disabled ? (
                                  <span className="text-[10px] text-rose-600 font-bold shrink-0">
                                    غیرمجاز
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-purple-700 font-bold shrink-0">
                                    انتخاب
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Assessor Display Badge */}
                  {selectedExpertId && (
                    <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserCheck className="w-4 h-4 text-purple-700 shrink-0" />
                        <div className="truncate">
                          <span className="text-slate-600 font-medium">ارزیاب انتخاب‌شده: </span>
                          <span className="font-black text-purple-950">
                            {activeCompanyExperts.find(e => e.id === selectedExpertId)?.name || 'انتخاب نشده'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-purple-800 shrink-0">
                        {activeCompanyExperts.find(e => e.id === selectedExpertId)?.phone}
                      </span>
                    </div>
                  )}

                  {/* Optional Note / Instruction for Assessor */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      توضیحات یا یادداشت برای کارشناس ارزیاب (اختیاری):
                    </label>
                    <textarea
                      rows={2}
                      value={expertAssignmentNote}
                      onChange={(e) => setExpertAssignmentNote(e.target.value)}
                      placeholder="مثال: لطفاً برآورد قطعات تعویضی با دقت بالا و قیمت‌های استعلامی قطعه‌فروشان رسمی ثبت شود..."
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-900 font-medium text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    onClick={handleAssignExpert}
                    disabled={!selectedExpertId || isPreviousAssessor(selectedExpertId)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>ارجاع پرونده به ارزیاب خسارت</span>
                  </button>

                  {claimCase.assignedExpert && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingExpert(false);
                        setIsExpertDropdownOpen(false);
                      }}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      انصراف از تغییر
                    </button>
                  )}
                </div>
              )
            )}

            {/* Quick Actions Panel */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-extrabold text-slate-700 block mb-2">تغییر سریع وضعیت پرونده</span>
              <button
                onClick={() => handleStatusChange('در انتظار پرداخت')}
                className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>انتقال به صف پرداخت</span>
              </button>
              <button
                onClick={() => handleStatusChange('پرداخت شده')}
                className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ثبت پرداخت موفق</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Column */}
        <div className="lg:col-span-8 space-y-5 order-1 lg:order-2">
          
          {/* Main Case Details Header Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            
            {/* Header Status & Code Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                {hasCroqui && (
                  <button
                    type="button"
                    onClick={handleQueryCroqui}
                    disabled={isQueryingCroqui}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all active:scale-95"
                  >
                    {isQueryingCroqui ? (
                      <Sparkles className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 text-white" />
                    )}
                    <span>{isQueryingCroqui ? 'در حال دریافت اطلاعات کروکی...' : 'استعلام کروکی'}</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveModalTab('time_location')}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>نمایش فرم کامل</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  پرونده {claimCase.id}
                </h2>
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                  {claimCase.status}
                </span>
                {isNoCroquiCase ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-900 border border-rose-200">
                    بدون کروکی
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                    دارای کروکی پلیس
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  {sampleImages.length} مستند
                </span>
              </div>
            </div>

            {/* MANDATORY REGULATORY NOTICE FOR NO-CROQUI CASES (CLEAN & COMPACT NOTICE ONLY) */}
            {isNoCroquiCase && (
              <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-400 rounded-3xl p-5 space-y-3 shadow-sm animate-in fade-in">
                <div className="flex items-start justify-between gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md font-black">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black text-amber-950">
                          دستورالعمل نظارتی: این پرونده چون بدون کروکی است، باید به یک کارشناس میدانی ارجاع داده شود
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-400">
                          پرونده بدون کروکی پلیس
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 leading-relaxed font-bold">
                        طبق آئین‌نامه نظارتی بیمه مرکزی ایران، ارزیابی خسارت تصادفات فاقد کروکی بدون بازدید حضوری صحنه یا وسیله نقلیه مجاز نمی‌باشد. لطفاً از طریق کادر تخصیص در پنل کناری، کارشناس میدانی مربوطه را تعیین و پرونده را ارجاع فرمایید.
                      </p>
                    </div>
                  </div>
                </div>

                {claimCase.assignedFieldExpert && (
                  <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900">
                          کارشناس میدانی تخصیص‌یافته: «{claimCase.assignedFieldExpert.name}»
                        </span>
                        <span className="text-[11px] text-slate-600 block">
                          تلفن: {claimCase.assignedFieldExpert.phone || 'ثبت نشده'} — وضعیت: {claimCase.status}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[11px] rounded-lg font-bold">
                      ارجاع شده
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* POLICE ACCIDENT SKETCH INQUIRY SECTION & RESULT ACCORDION (ONLY DISPLAYED IF CASE HAS CROQUI - POSITIONED ABOVE CARDS) */}
            {hasCroqui && (
              <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in transition-all">
                {/* Accordion / Tab Header */}
                <div
                  onClick={() => setIsCroquiExpanded(!isCroquiExpanded)}
                  className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-950 text-sm sm:text-base">
                          استعلام کروکی و گزارش پلیس راهور
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                          سامانه فاوا ناجا
                        </span>
                        {hasQueriedCroqui && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 text-amber-950 border border-amber-400">
                            کد: {claimCase.croquiData?.reportNumber || claimCase.sceneReportCode || 'CRQ-1403-88492'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        استعلام آنلاین پرونده و رسم کروکی از بانک اطلاعاتی راهنمایی و رانندگی
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mr-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQueryCroqui();
                      }}
                      disabled={isQueryingCroqui}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      {isQueryingCroqui ? (
                        <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5 text-white" />
                      )}
                      <span>{hasQueriedCroqui ? 'استعلام مجدد کروکی' : 'استعلام آنلاین کروکی'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCroquiExpanded(!isCroquiExpanded);
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-amber-100 border border-amber-300 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <span className="hidden sm:inline text-[11px]">
                        {isCroquiExpanded ? 'بستن تب' : 'مشاهده جزئیات'}
                      </span>
                      {isCroquiExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-700" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Loading State during Inquiry */}
                {isQueryingCroqui && (
                  <div className="p-6 bg-white rounded-2xl border border-amber-300 flex flex-col items-center justify-center gap-3 text-amber-950 text-xs font-black animate-pulse">
                    <Sparkles className="w-6 h-6 text-amber-600 animate-spin" />
                    <span>در حال استعلام آنلاین و دریافت رسم کروکی از سامانه فاوا ناجا...</span>
                  </div>
                )}

                {/* Expanded Full Inquiry Details */}
                {isCroquiExpanded && hasQueriedCroqui && !isQueryingCroqui && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    {/* 1. Status & Reference Header */}
                    <div className="bg-white p-4 rounded-2xl border border-amber-300 space-y-3 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span className="text-xs font-black text-emerald-950">
                            وضعیت استعلام: معتبر و تاییدشده در سامانه یکپارچه پلیس راهور
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-bold">کد/شماره گزارش کروکی:</span>
                          <span className="px-3 py-1 bg-amber-100 text-amber-950 font-mono font-black rounded-lg text-xs">
                            {claimCase.croquiData?.reportNumber || claimCase.sceneReportCode || 'CRQ-1403-88492'}
                          </span>
                        </div>
                      </div>

                      {/* 2. Key Grid Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {/* Incident Date & Time */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">تاریخ و زمان وقوع حادثه:</span>
                          <span className="font-extrabold text-slate-900">{claimCase.croquiData?.incidentDate || claimCase.date || '۱۴۰۳/۰۵/۱۲ - ۱۰:۰۲'}</span>
                        </div>

                        {/* Location & GPS */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">موقعیت مکانی و جغرافیایی (GPS):</span>
                          <span className="font-bold text-slate-900 block truncate">{claimCase.croquiData?.location || claimCase.incidentAddress || claimCase.address || 'تهران - بزرگراه همت غرب'}</span>
                          <span className="font-mono text-[10px] text-slate-500 block">GPS: {claimCase.lat && claimCase.lng ? `${claimCase.lng}, ${claimCase.lat}` : '35.7512, 51.3821'}</span>
                        </div>

                        {/* Fault Determination & Percentage */}
                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1">
                          <span className="text-rose-800 font-bold block text-[11px]">تعیین مقصریت و درصد تقصیر:</span>
                          <span className="font-black text-rose-950 text-xs">
                            ۱۰۰٪ مقصر: {claimCase.croquiData?.faultDriver?.fullName || claimCase.culpritName || 'رضا'} ({claimCase.croquiData?.faultDriver?.plateNumber || claimCase.culpritPlate || '۱۲ ب ۳۴۵ - ایران ۱۱'})
                          </span>
                        </div>

                        {/* Claimant Info */}
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                          <span className="text-emerald-800 font-bold block text-[11px]">مشخصات زیان‌دیده (طرف شاکی):</span>
                          <span className="font-black text-emerald-950">
                            {claimCase.croquiData?.victimDriver?.fullName || claimCase.victimName || 'پریسا'}
                          </span>
                          <span className="text-[10px] text-emerald-800 block">
                            کد ملی: {claimCase.victimNationalId || '0022451151'} — پلاک: {claimCase.victimPlate || '۵۶ الف ۴۵۶ ایران ۵۶'}
                          </span>
                        </div>

                        {/* At-fault Party Info */}
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-1">
                          <span className="text-amber-900 font-bold block text-[11px]">مشخصات راننده مقصر:</span>
                          <span className="font-black text-amber-950">
                            {claimCase.croquiData?.faultDriver?.fullName || claimCase.culpritName || 'رضا'}
                          </span>
                          <span className="text-[10px] text-amber-900 block">
                            کد ملی: {claimCase.culpritNationalId || '0018374652'} — بیمه‌نامه: {claimCase.culpritPolicyNo || 'POL-99482716'}
                          </span>
                        </div>

                        {/* Police Badge & Official Stamp */}
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-1">
                          <span className="text-blue-900 font-bold block text-[11px]">افسر انتظامی و اصالت مهر:</span>
                          <span className="font-bold text-blue-950 text-xs">
                            کد افسر: {claimCase.croquiData?.policeBadgeId || 'POLICE-9821'}
                          </span>
                          <span className="text-[10px] text-blue-800 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-700" />
                            مهر رسمی پلیس راهور تایید گردید
                          </span>
                        </div>
                      </div>

                      {/* Vehicles Involved */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <span className="font-black text-slate-800 block text-[11px]">خودروهای درگیر در حادثه:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                            <span>۱. خودروی زیان‌دیده ({claimCase.victimName || 'پریسا'})</span>
                            <IranianPlateBadge plate={claimCase.victimPlate || '56 الف 456 ایران 56'} />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                            <span>۲. خودروی مقصر ({claimCase.culpritName || 'رضا'})</span>
                            <IranianPlateBadge plate={claimCase.culpritPlate || '12 الف 456 ایران 45'} />
                          </div>
                        </div>
                      </div>

                      {/* Accident Description & Reported Damages */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-black text-slate-800 text-[11px] block">شرح حادثه و چگونگی برخورد طبق گزارش پلیس:</span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {claimCase.writtenReport || 'عدم رعایت فاصله طولی و بی احتیاطی راننده خودروی مقصر منجر به برخورد از عقب با خودروی زیان‌دیده متوقف در ترافیک گردیده است.'}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-black text-slate-800 text-[11px] block">قطعات و خسارات گزارش‌شده در برگه کروکی:</span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            آسیب‌دیدگی سپر عقب، درب صندوق عقب، سنسورهای دنده عقب و چراغ خطر سمت راست خودروی زیان‌دیده.
                          </p>
                        </div>
                      </div>

                      {/* Sketch Image Preview & Evidence Documents */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <span className="font-black text-slate-800 text-[11px] block">تصویر برگه رسمی کروکی و مدارک منضم:</span>
                        <div className="flex items-center gap-3 overflow-x-auto pb-1">
                          <div
                            onClick={() => setPreviewImage(claimCase.croquiData?.fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000')}
                            className="relative w-36 h-24 rounded-xl border-2 border-amber-300 overflow-hidden shrink-0 cursor-pointer group"
                          >
                            <img
                              src={claimCase.croquiData?.fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000'}
                              alt="Croqui"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              بزرگ‌نمایی کروکی
                            </div>
                          </div>

                          {sampleImages.slice(0, 2).map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => setPreviewImage(img.url)}
                              className="relative w-36 h-24 rounded-xl border border-slate-200 overflow-hidden shrink-0 cursor-pointer group"
                            >
                              <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                تصویر مستند {idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button: Proceed to Adjuster Assignment */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500">
                          اطلاعات کروکی با موفقیت با پرونده انطباق داده شد.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingExpert(true);
                            const el = document.querySelector('.lg\\:col-span-4');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-2 active:scale-95"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>تایید و ارجاع پرونده به ارزیاب خسارت</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* THREE INTERACTIVE CARDS GRID (INCIDENT & PARTIES DETAILS) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* CARD 1: زمان و مکان خسارت */}
              <div
                onClick={() => setActiveModalTab('time_location')}
                className="bg-slate-50 hover:bg-blue-50/80 border-2 border-slate-200 hover:border-blue-400 rounded-2xl p-4 cursor-pointer transition-all shadow-2xs space-y-2.5 group relative active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-blue-700 transition-colors">
                    زمان، مکان و مستندات
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-1">
                    {claimCase.date || '۱۰:۰۲ ۱۴۰۵/۰۵/۰۶'} — {claimCase.incidentAddress ? claimCase.incidentAddress.substring(0, 18) + '...' : 'شهید بلمه، تختی...'}
                  </p>
                </div>
              </div>

              {/* CARD 2: اطلاعات زیان‌دیده */}
              <div
                onClick={() => setActiveModalTab('victim_info')}
                className="bg-slate-50 hover:bg-emerald-50/80 border-2 border-slate-200 hover:border-emerald-400 rounded-2xl p-4 cursor-pointer transition-all shadow-2xs space-y-2.5 group relative active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">
                    اطلاعات زیان‌دیده
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-1">
                    {claimCase.victimName || 'پریسا'} — {claimCase.victimPhone || '09224511513'}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-start">
                  <IranianPlateBadge plate={claimCase.victimPlate || '56 الف 456 ایران 56'} />
                </div>
              </div>

              {/* CARD 3: اطلاعات مقصر */}
              <div
                onClick={() => setActiveModalTab('culprit_info')}
                className="bg-slate-50 hover:bg-amber-50/80 border-2 border-slate-200 hover:border-amber-400 rounded-2xl p-4 cursor-pointer transition-all shadow-2xs space-y-2.5 group relative active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-amber-700 transition-colors">
                    اطلاعات مقصر
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-1">
                    {claimCase.culpritName || 'رضا'} — {getInsurerPersianName(claimCase.culpritInsurer)}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-start">
                  <IranianPlateBadge plate={claimCase.culpritPlate || '12 الف 456 ایران 45'} />
                </div>
              </div>

            </div>

            {/* اطلاعات بیمه‌نامه مقصر section (COLLAPSIBLE TAB) */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 sm:p-5 space-y-4 transition-all">
              <div
                onClick={() => setIsPolicyExpanded(!isPolicyExpanded)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                      اطلاعات بیمه‌نامه و سقف تعهدات مقصر
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      بیمه {getInsurerPersianName(claimCase.culpritInsurer)} — شماره: {claimCase.culpritPolicyNo || 'AL-1401-102'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('استعلام آنلاین با موفقیت انجام گردید و سقف تعهدات تایید شد.');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95"
                  >
                    استعلام آنلاین
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPolicyExpanded(!isPolicyExpanded);
                    }}
                    className="p-2 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-bold"
                  >
                    <span className="hidden sm:inline text-[11px]">
                      {isPolicyExpanded ? 'بستن تب' : 'مشاهده جزئیات'}
                    </span>
                    {isPolicyExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {isPolicyExpanded && (
                <div className="space-y-4 pt-2 border-t border-slate-200/80 animate-in fade-in text-xs">
                  {/* Basic Policy Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block mb-1">شماره بیمه‌نامه</span>
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {claimCase.culpritPolicyNo || 'AL-1401-102'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block mb-1">شرکت بیمه صادرکننده</span>
                      <span className="font-extrabold text-purple-700">
                        {getInsurerPersianName(claimCase.culpritInsurer)}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block mb-1">تاریخ انقضا</span>
                      <span className="font-extrabold text-slate-900">
                        {claimCase.culpritPolicyExpiry || '1406/05/20'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block mb-1 font-bold">سقف تعهد مالی بیمه‌نامه</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {formatCurrency(claimCase.culpritCoverageFinancial || 50000000)}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block mb-1">سقف تعهد جانی (دیه)</span>
                      <span className="font-black text-slate-800">
                        {formatCurrency(300000000)}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-slate-500 block mb-1">کد رهگیری استعلام سنهاب</span>
                      <span className="font-mono font-bold text-blue-900">
                        {claimCase.policyInquirySanhab?.code || 'SNH-994821034-IR'}
                      </span>
                    </div>
                  </div>

                  {/* Financial & Debt Limit Analysis Card */}
                  {(() => {
                    const calc = calculateClaimDamageWithPolicyLimits(claimCase);
                    return (
                      <div className="bg-white p-4 rounded-2xl border-2 border-indigo-200 space-y-3.5 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-700" />
                            <h5 className="font-extrabold text-indigo-950 text-xs sm:text-sm">
                              محاسبه هوشمند سقف تعهد، افت ارزش، فرانشیز و بدهی مقصر
                            </h5>
                          </div>
                          {calc.exceedsCeiling ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-lg font-black text-[11px] flex items-center gap-1 self-start sm:self-auto">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              خسارت فراتر از سقف تعهد مالی بیمه‌نامه
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-black text-[11px] flex items-center gap-1 self-start sm:self-auto">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              پوشش کامل در سقف تعهد
                            </span>
                          )}
                        </div>

                        {/* Calculations Breakdown Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">خسارت فیزیکی (قطعه + اجرت):</span>
                            <strong className="text-slate-900 text-xs font-black">{formatCurrency(calc.directDamageAmount)}</strong>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">
                              افت ارزش خودرو ({calc.diminutionPercent}%):
                            </span>
                            <strong className={`text-xs font-black ${calc.diminutionAmount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                              {calc.diminutionAmount > 0 ? formatCurrency(calc.diminutionAmount) : '۰ ریال'}
                            </strong>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">کسر فرانشیز و استهلاک:</span>
                            <strong className="text-rose-700 text-xs font-black">{formatCurrency(calc.franchiseAmount)}</strong>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">مجموع خسارت واقعی زیان‌دیده:</span>
                            <strong className="text-slate-950 text-xs font-black">{formatCurrency(calc.totalClaimAmount)}</strong>
                          </div>
                        </div>

                        {/* Pay split highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-emerald-950">سهم قابل پرداخت توسط بیمه‌گر:</span>
                              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-black">حداکثر تا سقف تعهد</span>
                            </div>
                            <div className="text-lg font-black text-emerald-700 font-mono">
                              {formatCurrency(calc.insurerPayablePortion)}
                            </div>
                            <p className="text-[10px] text-emerald-800 font-medium">
                              این مبلغ طبق حواله شبا مستقیماً از خزانه شرکت بیمه واریز خواهد شد.
                            </p>
                          </div>

                          <div className={`p-3 rounded-xl border-2 space-y-1 ${
                            calc.culpritExcessDebt > 0
                              ? 'bg-rose-50 border-rose-300 text-rose-950'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-900">بدهی مازاد مقصر به زیان‌دیده:</span>
                              {calc.culpritExcessDebt > 0 && (
                                <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-black">مطالبه حقوقی</span>
                              )}
                            </div>
                            <div className={`text-lg font-black font-mono ${calc.culpritExcessDebt > 0 ? 'text-rose-700' : 'text-slate-600'}`}>
                              {calc.culpritExcessDebt > 0 ? formatCurrency(calc.culpritExcessDebt) : '۰ ریال (تعهدات تسویه شد)'}
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium">
                              {calc.culpritExcessDebt > 0
                                ? 'به علت تکمیل سقف بیمه‌نامه، مازاد به عنوان دین مستقیم بر عهده مقصر حادثه است.'
                                : 'سقف تعهدات بیمه‌نامه برای پوشش کل خسارت کافی بوده و بدهی مازادی وجود ندارد.'}
                            </p>
                          </div>
                        </div>

                        {/* SMS Dispatches and Legal Notification Preview */}
                        <div className="pt-2 border-t border-indigo-100 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-indigo-600" />
                              پیش‌نمایش پیامک‌های رسمی سامانه ابلاغ
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
                                const vSms = {
                                  id: `SMS-V-${Date.now()}`,
                                  recipientType: 'VICTIM' as const,
                                  recipientName: claimCase.victimName || 'زیان‌دیده',
                                  phone: claimCase.victimPhone || '09120000000',
                                  text: calc.victimSmsText,
                                  sentAt: nowTimeStr,
                                  status: 'DELIVERED' as const
                                };
                                const cSms = {
                                  id: `SMS-C-${Date.now() + 1}`,
                                  recipientType: 'CULPRIT' as const,
                                  recipientName: claimCase.culpritName || 'مقصر حادثه',
                                  phone: claimCase.culpritPhone || '09121111111',
                                  text: calc.culpritSmsText,
                                  sentAt: nowTimeStr,
                                  status: 'DELIVERED' as const
                                };
                                const updatedCase: ClaimCase = {
                                  ...claimCase,
                                  diminutionValue: calc.diminutionAmount,
                                  diminutionPercent: calc.diminutionPercent,
                                  franchiseAmount: calc.franchiseAmount,
                                  policyCeilingFinancial: calc.policyMaxFinancialLimit,
                                  insurerPayableAmount: calc.insurerPayablePortion,
                                  culpritDebtAmount: calc.culpritExcessDebt,
                                  exceedsPolicyCeiling: calc.exceedsCeiling,
                                  smsDispatchLogs: [...(claimCase.smsDispatchLogs || []), vSms, cSms],
                                  history: [
                                    ...(claimCase.history || []),
                                    {
                                      status: claimCase.status,
                                      time: nowTimeStr,
                                      user: session.name || 'کارشناس بیمه',
                                      note: `ارسال مجدد پیامک ابلاغ سهم بیمه (${formatCurrency(calc.insurerPayablePortion)}) و بدهی مقصر (${formatCurrency(calc.culpritExcessDebt)}).`
                                    }
                                  ]
                                };
                                onUpdateCase(updatedCase);
                                alert('پیامک‌های رسمی ابلاغ سهم بیمه و بدهی مقصر به تلفن همراه طرفین ارسال شد.');
                              }}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <span>ارسال پیامک ابلاغ به طرفین</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                              <span className="font-bold text-slate-700 block">پیامک زیان‌دیده ({claimCase.victimPhone || '09224511513'}):</span>
                              <p className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-800 leading-relaxed select-all">
                                {calc.victimSmsText}
                              </p>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                              <span className="font-bold text-slate-700 block">پیامک مقصر ({claimCase.culpritPhone || '09121112233'}):</span>
                              <p className="font-mono bg-white p-2 rounded-lg border border-slate-200 text-slate-800 leading-relaxed select-all">
                                {calc.culpritSmsText}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* REVIEWER ACTION PANEL — SHOWN WHEN ASSESSMENT IS WAITING FOR REVIEWER APPROVAL */}
            {(claimCase.status === 'در انتظار بررسی بازبین' || claimCase.status === 'در انتظار بازبینی' || (claimCase.assessment && !claimCase.reviewerApproval?.approved && claimCase.status !== 'در انتظار تایید کاربر' && claimCase.status !== 'نیازمند اصلاح کارشناس' && !claimCase.status.includes('پرداخت'))) && (
              <div className="bg-gradient-to-br from-indigo-900 via-purple-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 border-2 border-amber-400 shadow-xl space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">بررسی و بازبینی کیفیت ارزیابی (پنل بازبین)</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          نیازمند تایید بازبین
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        برآورد خسارت توسط {claimCase.assignedExpert?.name || 'کارشناس ارزیاب'} ثبت گردیده و پیش از ابلاغ به زیان‌دیده نیازمند بررسی بازبین ارشد است.
                      </p>
                    </div>
                  </div>
                </div>

                {claimCase.assessment && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">خسارت ناخالص:</span>
                      <strong className="text-white text-sm">{formatCurrency(claimCase.assessment.gross)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">کسورات و فرانشیز:</span>
                      <strong className="text-slate-200 text-sm">{formatCurrency(claimCase.assessment.deductions)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">ارزش اسقاط:</span>
                      <strong className="text-slate-200 text-sm">{formatCurrency(claimCase.assessment.salvage)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] mb-0.5 font-bold">قابل پرداخت نهایی:</span>
                      <strong className="text-emerald-400 text-sm font-black">{formatCurrency(claimCase.assessment.payable)}</strong>
                    </div>
                  </div>
                )}

                {claimCase.assessment?.reviewerNote && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-slate-200">
                    <span className="font-extrabold text-amber-300 block mb-1">یادداشت کارشناس ارزیاب:</span>
                    <p className="leading-relaxed font-medium">{claimCase.assessment.reviewerNote}</p>
                  </div>
                )}

                {/* Reviewer Note Input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-200 mb-1">
                    توضیحات و دستور بازبین (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    placeholder="مثال: برآورد و فرانشیز طبق آئین‌نامه بیمه مرکزی تایید گردید..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Approve & Return Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReviewerApprove}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>تایید ارزیابی و ابلاغ به زیان‌دیده</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReviewerReturnModal(true)}
                    className="py-3 px-5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>عدم تایید / عودت به کارشناس جهت اصلاح</span>
                  </button>
                </div>
              </div>
            )}

            {/* DAMAGE ASSESSMENT SECTION (COLLAPSIBLE TAB - POSITIONED AFTER INQUIRY & INCIDENT DETAILS) */}
            {hasCompletedAssessment && (
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 shadow-sm space-y-5 animate-in fade-in transition-all">
                <div
                  onClick={() => setIsAssessmentExpanded(!isAssessmentExpanded)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-200 pb-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-blue-950 flex items-center gap-2">
                        <span>برآورد و نظریه کارشناسی خسارت</span>
                        {allAssessments.length > 1 && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black border border-blue-200">
                            {allAssessments.length} مرحله ارزیابی ثبت‌شده
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        مشاهده تفکیکی قطعات، اجرت تعمیرات، مبالغ خسارت و نظریه کارشناس ارزیاب
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mr-auto sm:mr-0">
                    {activeAssessment && (
                      <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                        <span className="text-slate-500 font-bold">کارشناس:</span>
                        <strong className="text-blue-950 font-black">{activeAssessment.expertName}</strong>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAssessmentExpanded(!isAssessmentExpanded);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <span className="hidden sm:inline text-[11px]">
                        {isAssessmentExpanded ? 'بستن تب' : 'مشاهده جزئیات'}
                      </span>
                      {isAssessmentExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isAssessmentExpanded && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    {/* MULTI-ROUND ASSESSMENT TABS (IF MULTIPLE ROUNDS EXIST) */}
                    {allAssessments.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
                        {allAssessments.map((roundAssessment, idx) => {
                          const isSelected = selectedAssessmentTabIndex === idx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedAssessmentTabIndex(idx)}
                              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
                                isSelected
                                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20 ring-2 ring-blue-900/30'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <FileBadge className="w-3.5 h-3.5" />
                              <span>{roundAssessment.round || (idx === 0 ? 'ارزیابی کارشناس اول' : `ارزیابی کارشناس دوم (اعتراض)`)}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-200'
                              }`}>
                                {roundAssessment.expertName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {activeAssessment && (
                      <div className="space-y-4">
                        {/* Financial Summary 4-Grid for Active Assessment */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-slate-500 block text-[10px] font-bold">خسارت ناخالص:</span>
                            <strong className="text-slate-900 text-sm font-black">{formatCurrency(activeAssessment.gross)}</strong>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-500 block text-[10px] font-bold">کسورات و فرانشیز:</span>
                            <strong className="text-slate-800 text-sm font-bold">{formatCurrency(activeAssessment.deductions || 0)}</strong>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-500 block text-[10px] font-bold">ارزش اسقاط:</span>
                            <strong className="text-slate-800 text-sm font-bold">{formatCurrency(activeAssessment.salvage || 0)}</strong>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-500 block text-[10px] font-bold">قابل پرداخت نهایی:</span>
                            <strong className="text-emerald-700 text-sm font-black">{formatCurrency(activeAssessment.payable)}</strong>
                          </div>
                        </div>

                        {/* Car Blueprint & 3D Interactive Model Viewer with Clickable Spots & Assessor Notes */}
                        <Car3DViewer
                          caseId={claimCase.id}
                          editable={false}
                          damageData={
                            claimCase.carDamageSpots ||
                            (activeAssessment.parts && activeAssessment.parts.length > 0
                              ? activeAssessment.parts.reduce((acc: any, p: any) => {
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
                                    note: activeAssessment.reviewerNote || `قطعه ${p.name} طبق بررسی کارشناس نیاز به ${p.type === 'replace' ? 'تعویض' : 'تعمیر'} دارد.`
                                  };
                                  return acc;
                                }, {})
                              : {
                                  front_bumper: {
                                    type: 'خط و خش و شکستگی',
                                    severity: 'minor',
                                    operation: 'صافکاری و نقاشی',
                                    color: 'yellow',
                                    note: 'سپر جلو دارای خط و خش عمیق و شکستگی موضعی است.'
                                  }
                                })
                          }
                        />

                        {/* Parts Breakdown Table */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-blue-900" />
                              <span>جدول تفکیکی قطعات و اجرت‌های برآوردشده ({activeAssessment.round || (selectedAssessmentTabIndex === 0 ? 'ارزیابی اول' : 'ارزیابی مجدد')})</span>
                            </h4>
                            <span className="text-[11px] text-slate-500 font-bold">
                              تعداد اقلام: <strong className="text-blue-950 font-black">{activeAssessment.parts?.length || 0}</strong>
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                                <tr>
                                  <th className="p-3">ردیف</th>
                                  <th className="p-3">قطعه / بخش آسیب‌دیده</th>
                                  <th className="p-3">نوع عملیات</th>
                                  <th className="p-3">قیمت قطعه (ریال)</th>
                                  <th className="p-3">اجرت / تعمیر (ریال)</th>
                                  <th className="p-3">ارزش اسقاط (ریال)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 font-medium">
                                {activeAssessment.parts && activeAssessment.parts.length > 0 ? (
                                  activeAssessment.parts.map((p: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                      <td className="p-3 font-mono text-slate-400 font-bold">{idx + 1}</td>
                                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                                      <td className="p-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                          p.type === 'replace' ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                                        }`}>
                                          {p.type === 'replace' ? 'تعویض قطعه' : 'تعمیر / صافکاری'}
                                        </span>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-slate-800">{p.partPrice ? formatCurrency(Number(p.partPrice)) : '-'}</td>
                                      <td className="p-3 font-mono font-bold text-slate-800">{p.repairPrice ? formatCurrency(Number(p.repairPrice)) : '-'}</td>
                                      <td className="p-3 font-mono font-bold text-rose-700">{p.salvageValue ? formatCurrency(Number(p.salvageValue)) : '-'}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="p-6 text-center text-slate-400 font-bold">
                                      هیچ قطعه تفکیکی برای این ارزیابی ثبت نگردیده است.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Expert's Remarks & Reviewer Note */}
                        {(activeAssessment.reviewerNote || (activeAssessment as any).note) && (
                          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-1">
                            <span className="font-extrabold text-amber-950 block">نظریه و توضیحات کارشناس ارزیاب ({activeAssessment.expertName}):</span>
                            <p className="text-slate-800 leading-relaxed font-medium">
                              {activeAssessment.reviewerNote || (activeAssessment as any).note}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* RESTORED: گذر وضعیت پرونده (CASE TIMELINE & HISTORY - COLLAPSIBLE TAB) */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 sm:p-6 space-y-4 transition-all">
              <div
                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                className="flex items-center justify-between cursor-pointer select-none border-b border-slate-200 pb-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <span>گذر وضعیت پرونده (تاریخچه و گردش کار)</span>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-black border border-purple-200">
                        {timelineHistory.length} رویداد
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      ثبت دقیق لاگ و تغییرات وضعیت پرونده از زمان تشکیل تا ارزیابی و تسویه
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTimelineExpanded(!isTimelineExpanded);
                  }}
                  className="p-2 rounded-xl bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-bold"
                >
                  <span className="hidden sm:inline text-[11px]">
                    {isTimelineExpanded ? 'بستن تب' : 'مشاهده جزئیات'}
                  </span>
                  {isTimelineExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {isTimelineExpanded && (
                <div className="space-y-4 relative pr-3 pt-2 before:absolute before:right-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-purple-200 animate-in fade-in">
                  {timelineHistory.map((item, idx) => {
                    const isLast = idx === timelineHistory.length - 1;
                    return (
                      <div key={idx} className="relative flex items-start gap-4 group">
                        {/* Timeline Node Icon */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                          isLast
                            ? 'bg-purple-600 text-white ring-4 ring-purple-100 shadow-md'
                            : 'bg-emerald-500 text-white shadow-xs'
                        }`}>
                          {isLast ? (
                            <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                              {item.status}
                            </h4>
                            <span className="text-[11px] font-mono font-semibold text-slate-400">
                              {item.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {item.note}
                          </p>
                          <div className="text-[10px] text-slate-400 font-bold pt-1 flex items-center gap-1">
                            <span>ثبت‌کننده:</span>
                            <strong className="text-slate-700">{item.user}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3D Model Damage Viewer if assessment parts exist */}
            {claimCase.assessment && claimCase.assessment.parts && claimCase.assessment.parts.length > 0 && (
              <Car3DViewer
                caseId={claimCase.id}
                damageData={
                  claimCase.assessment.parts.reduce((acc, p) => {
                    acc[p.name] = { type: p.type === 'replace' ? 'تعویضی' : 'تعمیری', severity: 'minor' };
                    return acc;
                  }, {} as any) || {}
                }
              />
            )}

            {/* وضعیت پرداخت و مبلغ نهایی section */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-emerald-950 text-xs flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>وضعیت پرداخت و مبلغ نهایی</span>
                </h4>

                <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg">
                  مدیریت واریز
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">قابل پرداخت</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {claimCase.assessment ? formatCurrency(claimCase.assessment.payable) : '۰ ریال'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">تصمیم زیان‌دیده</span>
                  <span className="font-bold text-slate-800">
                    تایید اولیه
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">وضعیت واریز</span>
                  <span className="font-bold text-slate-800">
                    در انتظار شبا
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">نسخه ارزیابی</span>
                  <span className="font-bold text-purple-700 font-mono">
                    A-1
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* DETAILED MODAL WITH 3 SPECIFIC TABS FOR EACH CARD */}
      {activeModalTab && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col">
            
            {/* Modal Header & Tab Buttons */}
            <div className="sticky top-0 bg-white border-b border-slate-100 p-5 z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900">
                    جزئیات کامل پرونده {claimCase.id}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    اطلاعات ثبت‌شده توسط مشتری و استعلامات بیمه مرکزی
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalTab(null)}
                  className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center font-bold transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3 Tab Switchers inside Modal */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-black">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('time_location')}
                  className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeModalTab === 'time_location'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>زمان و مکان خسارت</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('victim_info')}
                  className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeModalTab === 'victim_info'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>اطلاعات زیان‌دیده</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('culprit_info')}
                  className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeModalTab === 'culprit_info'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>اطلاعات مقصر</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs flex-1">
              
              {/* TAB 1: زمان و مکان خسارت */}
              {activeModalTab === 'time_location' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-blue-950 text-sm">اطلاعات زمان، مکان و آدرس وقوع حادثه</h4>
                      <p className="text-[11px] text-blue-800 font-medium">اطلاعات جغرافیایی ثبت‌شده هنگام اعلام خسارت آنلاین</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">شماره پیگیری پرونده</span>
                      <span className="font-mono font-black text-slate-900 text-sm">{claimCase.id}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">تاریخ و ساعت دقیق حادثه</span>
                      <span className="font-extrabold text-slate-900 text-sm">{claimCase.date || '۱۰:۰۲ ۱۴۰۵/۰۵/۰۶'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">مختصات جغرافیایی (GPS)</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {claimCase.lat && claimCase.lng ? `${claimCase.lng}, ${claimCase.lat}` : '51.412582397460945, 35.66622234103479'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">وضعیت کنونی پرونده</span>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-black text-xs inline-block">
                        {claimCase.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-extrabold mb-1.5">آدرس دقیق ثبت‌شده محل تصادف</label>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium leading-relaxed">
                      {claimCase.incidentAddress || claimCase.address || 'شهید بلمه، تختی، ناحیه ۴، منطقه ۱۲ شهر تهران، تهران، بخش مرکزی تهران، شهرستان تهران، استان تهران، 65116-11987، ایران'}
                    </div>
                  </div>

                  {/* Images of Incident */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>عکس‌ها و مستندات ارسالی موقعیت تصادف</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sampleImages.map((img, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
                          <div className="relative h-44 rounded-xl overflow-hidden group">
                            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPreviewImage(img.url)}
                              className="absolute bottom-2 left-2 px-3 py-1 bg-slate-900/80 text-white rounded-lg text-[10px] font-bold backdrop-blur-xs flex items-center gap-1"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>قابل بزرگ‌نمایی</span>
                            </button>
                          </div>
                          <p className="text-center font-bold text-slate-800 text-xs">
                            {img.title || `تصویر موقعیت ${idx + 1}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: اطلاعات زیان‌دیده + مدارک */}
              {activeModalTab === 'victim_info' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-950 text-sm">اطلاعات کامل و مدارک بارگذاری‌شده زیان‌دیده</h4>
                      <p className="text-[11px] text-emerald-800 font-medium">مشخصات هویتی، خودرویی و اسناد زیان‌دیده اصلی</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">نام و نام خانوادگی زیان‌دیده</span>
                      <span className="font-extrabold text-slate-900 text-sm">{claimCase.victimName || 'پریسا'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">کد ملی</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">{claimCase.victimNationalId || '0022451151'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شماره تلفن همراه</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">{claimCase.victimPhone || '09224511513'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">نقش در حادثه</span>
                      <span className="font-bold text-emerald-800 text-xs">زیان‌دیده (راننده / مالک خودرو)</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">پلاک خودرو</span>
                      <IranianPlateBadge plate={claimCase.victimPlate || '56 الف 456 ایران 56'} />
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شماره شاسی (VIN)</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{claimCase.victimVin || 'IR99283411029384'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 sm:col-span-2">
                      <span className="text-slate-500 font-bold block">شرکت بیمه‌گر زیان‌دیده</span>
                      <span className="font-extrabold text-purple-700 text-xs">{getInsurerPersianName(claimCase.victimInsurer || 'dana')}</span>
                    </div>
                  </div>

                  {/* Uploaded Documents for Victim */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <FileBadge className="w-4 h-4 text-emerald-600" />
                      <span>مدارک و اسناد بارگذاری‌شده توسط زیان‌دیده</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {victimDocs.map((doc, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-2.5 space-y-2">
                          <div className="relative h-36 rounded-xl overflow-hidden group">
                            <img src={doc.url} alt={doc.title} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPreviewImage(doc.url)}
                              className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                            >
                              مشاهده تصویر
                            </button>
                          </div>
                          <p className="text-center font-bold text-slate-800 text-[11px] truncate">
                            {doc.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: اطلاعات مقصر + بیمه‌نامه */}
              {activeModalTab === 'culprit_info' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-amber-950 text-sm">اطلاعات مقصر و تعهدات بیمه‌نامه</h4>
                      <p className="text-[11px] text-amber-800 font-medium">مشخصات هویتی مقصر و استعلام سقف پوشش بیمه شخص ثالث</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">نام و نام خانوادگی مقصر</span>
                      <span className="font-extrabold text-slate-900 text-sm">{claimCase.culpritName || 'رضا'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">کد ملی مقصر</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">{claimCase.culpritNationalId || '0018374652'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شماره تلفن همراه</span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">{claimCase.culpritPhone || '09121112233'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">پلاک خودرو مقصر</span>
                      <IranianPlateBadge plate={claimCase.culpritPlate || '12 الف 456 ایران 45'} />
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شماره شاسی (VIN)</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{claimCase.culpritVin || 'IR8837102938472'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شرکت بیمه‌گر مقصر</span>
                      <span className="font-extrabold text-purple-700 text-xs">{getInsurerPersianName(claimCase.culpritInsurer)}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شماره بیمه‌نامه مقصر</span>
                      <span className="font-mono font-extrabold text-slate-900 text-xs">{claimCase.culpritPolicyNo || 'AL-1401-102'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">تاریخ انقضای بیمه‌نامه</span>
                      <span className="font-extrabold text-slate-900 text-xs">{claimCase.culpritPolicyExpiry || '1406/05/20'}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 sm:col-span-2">
                      <span className="text-slate-500 font-bold block">سقف تعهد مالی بیمه‌نامه</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {formatCurrency(claimCase.culpritCoverageFinancial || 50000000)}
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Documents for Culprit */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <FileBadge className="w-4 h-4 text-amber-600" />
                      <span>مدارک و اسناد مقصر</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {culpritDocs.map((doc, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-2.5 space-y-2">
                          <div className="relative h-36 rounded-xl overflow-hidden group">
                            <img src={doc.url} alt={doc.title} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setPreviewImage(doc.url)}
                              className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                            >
                              مشاهده تصویر
                            </button>
                          </div>
                          <p className="text-center font-bold text-slate-800 text-[11px] truncate">
                            {doc.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveModalTab(null)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md"
                >
                  بستن پنجره
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* IMAGE ENLARGE PREVIEW MODAL */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white font-bold text-xs bg-slate-800/80 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-600"
            >
              ✕ بستن تصویر
            </button>
          </div>
        </div>
      )}

      {/* REVIEWER RETURN MODAL */}
      {showReviewerReturnModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>عودت پرونده به کارشناس خسارت</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewerReturnModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              لطفاً دلیل و موارد نیازمند اصلاح در برآورد ارزیاب را ذکر نمایید. این توضیحات مستقیماً در پنل کارشناس نمایش داده خواهد شد.
            </p>

            <form onSubmit={handleReviewerReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  دلیل عودت و موارد اصلاحی <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reviewerReturnReason}
                  onChange={(e) => setReviewerReturnReason(e.target.value)}
                  placeholder="مثال: نرخ اجرت صافکاری و نقاشی سپر فراتر از تعرفه مصوب است، لطفاً اصلاح شود..."
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-rose-600 font-medium"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!reviewerReturnReason.trim()}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
                >
                  ثبت عودت و ارسال به کارشناس
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewerReturnModal(false)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};



