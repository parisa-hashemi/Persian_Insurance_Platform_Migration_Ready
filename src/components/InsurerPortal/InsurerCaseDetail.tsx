import React, { useState, useMemo, useEffect } from 'react';
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
  DollarSign,
  ImageOff,
  Compass,
  Camera,
  CheckSquare,
  ShieldAlert,
  RefreshCw,
  Send,
  Navigation,
  MessageSquare,
  PhoneCall
} from 'lucide-react';
import { ClaimCase, UserSession, StaffMember, AssessorNotification, CustomerNotification } from '../../types';
import { INITIAL_EXPERTS, INITIAL_FIELD_EXPERTS } from '../../data/mockData';
import { findBestMatchingBranch, INSURANCE_BRANCHES, InsuranceBranch, getRankedFieldExpertsForAccidentLocation, RankedFieldExpertItem } from '../../data/bodyInsuranceData';
import {
  formatCurrency,
  getInsurerPersianName,
  getInsurerBrandConfig,
  loadInsurersFromStorage,
  loadExpertsFromStorage,
  loadFieldExpertsFromStorage,
  loadAssessorNotifications,
  saveAssessorNotifications,
  addCustomerNotification,
  loadCasesFromStorage
} from '../../lib/storage';
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
  const allInsurers = useMemo(() => loadInsurersFromStorage(), []);
  const companyCode = session.company || session.id || 'dana';
  const companyInfo = allInsurers.find((c) => c.code === companyCode) || {
    code: companyCode,
    name: session.companyName || session.name || getInsurerPersianName(companyCode)
  };
  const brand = getInsurerBrandConfig(companyCode, companyInfo.name);

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
  const isFieldExpertRequired = Boolean(
    isNoCroquiCase ||
    claimCase.objectionStage === 4 ||
    claimCase.status === 'در انتظار ارجاع به کارشناس میدانی' ||
    claimCase.status === 'در انتظار بازدید کارشناس میدانی' ||
    claimCase.status === 'در حال بازدید کارشناس میدانی' ||
    claimCase.status?.includes('کارشناس میدانی') ||
    claimCase.assignedFieldExpert ||
    claimCase.authenticityDispute ||
    claimCase.status === 'تردید در اصالت تصادف' ||
    claimCase.needsCulpritFieldVisit
  );
  const isPaidCase =
    claimCase.status === 'پرداخت شده' ||
    claimCase.payoutState === 'PAID' ||
    claimCase.status === 'تسویه شده';

  const allStoredCases = useMemo(() => loadCasesFromStorage(), []);

  // Address and Nearest Branch calculation
  const caseInsurerCode = claimCase.bodyInsuranceInfo?.insurerCode || claimCase.victimInsurer || claimCase.culpritInsurer || companyCode || 'dana';
  const accidentLocationAddress = claimCase.accidentLocation || claimCase.accidentAddress || claimCase.address || claimCase.location || 'تهران، بزرگراه شهید همت، تقاطع مدرس';

  const branchMatch = useMemo(() => {
    return findBestMatchingBranch(
      caseInsurerCode,
      accidentLocationAddress,
      claimCase.assignedBranch?.city || 'تهران',
      claimCase.accidentLocationCoordinates
    );
  }, [caseInsurerCode, accidentLocationAddress, claimCase.assignedBranch?.city, claimCase.accidentLocationCoordinates]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    claimCase.assignedBranch?.branchId || branchMatch.bestBranch.id
  );

  const rankedRecommendation = useMemo(() => {
    return getRankedFieldExpertsForAccidentLocation({
      insurerCode: caseInsurerCode,
      accidentLocation: accidentLocationAddress,
      userCity: claimCase.assignedBranch?.city || 'تهران',
      targetBranchId: selectedBranchId,
      coordinates: claimCase.accidentLocationCoordinates || (claimCase.isBodyClaim ? { lat: 35.7592, lng: 51.4112 } : undefined),
      activeCases: allStoredCases,
      companyFieldExperts: activeCompanyFieldExperts
    });
  }, [caseInsurerCode, accidentLocationAddress, selectedBranchId, claimCase, allStoredCases, activeCompanyFieldExperts]);

  const [selectedExpertId, setSelectedExpertId] = useState(
    claimCase.assignedExpert?.id || (activeCompanyExperts[0]?.id || '')
  );

  const [selectedFieldExpertId, setSelectedFieldExpertId] = useState(
    claimCase.assignedFieldExpert?.id || (rankedRecommendation.bestExpert?.expert.id || activeCompanyFieldExperts[0]?.id || '')
  );

  const currentSelectedBranch = useMemo(() => {
    return INSURANCE_BRANCHES.find(b => b.id === selectedBranchId) || rankedRecommendation.bestBranch || branchMatch.bestBranch;
  }, [selectedBranchId, rankedRecommendation.bestBranch, branchMatch.bestBranch]);

  // Tab for live SMS preview (Field Expert vs Customer)
  const [smsPreviewTab, setSmsPreviewTab] = useState<'EXPERT' | 'CUSTOMER'>('EXPERT');
  const [showSmsPreview, setShowSmsPreview] = useState(false);
  const [expertFilterTab, setExpertFilterTab] = useState<'BRANCH' | 'ALL'>('BRANCH');
  const [isExpertPickerModalOpen, setIsExpertPickerModalOpen] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Customer & Vehicle details for SMS
  const customerName = claimCase.victimName || claimCase.partyOneName || claimCase.culpritName || (claimCase.isBodyClaim ? 'بیمه‌گذار محترم بدنه' : 'زیان‌دیده محترم');
  const customerPhone = claimCase.victimPhone || claimCase.partyOnePhone || claimCase.culpritPhone || '09123456789';
  const vehicleName = claimCase.carType || claimCase.carModel || claimCase.bodyInsuranceInfo?.carModel || 'خودرو زیان‌دیده';
  const plateText = claimCase.victimPlate || claimCase.plate || claimCase.plateNumber || claimCase.bodyInsuranceInfo?.plate || 'نامشخص';

  // Search filters & custom note to expert
  const [expertSearchTerm, setExpertSearchTerm] = useState('');
  const [fieldExpertSearchTerm, setFieldExpertSearchTerm] = useState('');
  const [expertAssignmentNote, setExpertAssignmentNote] = useState('');
  const [fieldExpertAssignmentNote, setFieldExpertAssignmentNote] = useState('');
  const [isExpertDropdownOpen, setIsExpertDropdownOpen] = useState(false);
  const [isFieldExpertDropdownOpen, setIsFieldExpertDropdownOpen] = useState(false);

  // Filtered field experts based on tab and search
  const displayedFieldExpertsList = useMemo(() => {
    const baseList = expertFilterTab === 'BRANCH' && rankedRecommendation.selectedBranchExperts.length > 0
      ? rankedRecommendation.selectedBranchExperts
      : rankedRecommendation.rankedExperts;

    if (!fieldExpertSearchTerm.trim()) {
      return baseList;
    }
    const q = fieldExpertSearchTerm.trim().toLowerCase();
    return baseList.filter((item) =>
      item.expert.name.toLowerCase().includes(q) ||
      (item.expert.role && item.expert.role.toLowerCase().includes(q)) ||
      (item.expert.phone && item.expert.phone.includes(q)) ||
      (item.expert.nationalId && item.expert.nationalId.includes(q)) ||
      (item.branch.name && item.branch.name.toLowerCase().includes(q))
    );
  }, [expertFilterTab, rankedRecommendation, fieldExpertSearchTerm]);

  // State to toggle re-assignment dropdown if already assigned
  const [isChangingExpert, setIsChangingExpert] = useState(!claimCase.assignedExpert);
  const [isChangingFieldExpert, setIsChangingFieldExpert] = useState(
    !claimCase.assignedFieldExpert ||
    claimCase.status === 'در انتظار ارجاع به کارشناس میدانی' ||
    (!claimCase.assignedExpert || !claimCase.assignedExpert.role?.includes('میدانی'))
  );
  const [assignmentFeedback, setAssignmentFeedback] = useState<string | null>(null);
  const [fieldAssignmentFeedback, setFieldAssignmentFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (
      (claimCase.status === 'در انتظار ارجاع به کارشناس میدانی' || claimCase.objectionStage === 4) &&
      !claimCase.assignedFieldExpert
    ) {
      setIsChangingFieldExpert(true);
    }
  }, [claimCase.status, claimCase.objectionStage, claimCase.assignedFieldExpert]);

  // Unified Expert Assessment evaluation (supports Field Expert, Multi-round Damage Assessor, or clean empty state)
  const allAssessments = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'FIELD_EXPERT' | 'DAMAGE_EXPERT';
      tabTitle: string;
      round: string;
      roundIdx: number;
      expertName: string;
      expertRole: string;
      expertPhone?: string;
      submittedAt: string;
      gross: number;
      deductions: number;
      salvage: number;
      payable: number;
      status?: string;
      reviewerNote?: string;
      parts: Array<{
        name: string;
        type: 'replace' | 'repair' | string;
        partPrice?: number;
        repairPrice?: number;
        salvageNeeded?: boolean;
        salvageValue?: number;
      }>;
      damageSpots?: Record<string, any>;
      verdict?: string;
      photos?: Array<{
        id?: string;
        title: string;
        url: string;
        uploadedAt?: string;
        note?: string;
      }>;
    }> = [];

    // 1. Field Expert Assessment / Inspection (if conducted)
    const hasFieldAssessment = Boolean(
      claimCase.fieldExpertVerdict ||
      claimCase.fieldExpertFinal ||
      claimCase.fieldExpertReportNote ||
      claimCase.assessment?.fieldInspectionConfirmed ||
      (claimCase.assessment && claimCase.assessment.assessorId?.startsWith('fed')) ||
      (claimCase.assignedFieldExpert && (claimCase.status?.includes('میدانی') || claimCase.fieldVisitStarted || (claimCase.additionalDocs?.some(d => d.uploaderRole?.includes('میدانی')))))
    );

    if (hasFieldAssessment) {
      const fieldDocs = (claimCase.additionalDocs || []).filter(
        (d) => d.uploaderRole?.includes('میدانی') || d.title?.includes('بازدید میدانی') || d.title?.includes('میدانی') || d.docType?.includes('بازدید میدانی')
      );
      
      list.push({
        id: 'field-eval',
        type: 'FIELD_EXPERT',
        tabTitle: `بازدید و ارزیابی میدانی (${claimCase.assignedFieldExpert?.name || claimCase.assessment?.assessorName || 'کارشناس میدانی'})`,
        round: 'ارزیابی و اصالت‌سنجی میدانی',
        roundIdx: 0,
        expertName: claimCase.assignedFieldExpert?.name || claimCase.assessment?.assessorName || 'کارشناس رسمی میدانی',
        expertRole: 'کارشناس رسمی بازدید میدانی و احراز اصالت',
        expertPhone: claimCase.assignedFieldExpert?.phone,
        submittedAt: claimCase.assessment?.assessedAt || claimCase.assessment?.submittedAt || claimCase.date || 'ثبت‌شده',
        gross: claimCase.assessment?.gross || 0,
        deductions: claimCase.assessment?.deductions || 0,
        salvage: claimCase.assessment?.salvage || 0,
        payable: claimCase.assessment?.payable || 0,
        status: claimCase.assessment?.status || 'SUBMITTED',
        reviewerNote: claimCase.fieldExpertReportNote || claimCase.assessment?.notes || claimCase.assessment?.reviewerNote || 'گزارش ارزیابی میدانی و اصالت‌سنجی در محل حادثه ثبت گردید.',
        parts: claimCase.assessment?.parts || [],
        damageSpots: claimCase.carDamageSpots || {},
        verdict: claimCase.fieldExpertVerdict || claimCase.assessment?.authenticityVerdict,
        photos: fieldDocs.map(d => ({
          id: d.id,
          title: d.title,
          url: d.dataUrl || d.url || '',
          uploadedAt: d.uploadedAt,
          note: d.note
        }))
      });
    }

    // 2. Multi-round Damage Assessor Assessments
    if (claimCase.assessments && claimCase.assessments.length > 0) {
      claimCase.assessments.forEach((a, idx) => {
        list.push({
          id: `damage-eval-${idx + 1}`,
          type: 'DAMAGE_EXPERT',
          tabTitle: a.round || (idx === 0 ? `ارزیابی خسارت - مرحله اول (${a.expertName})` : `ارزیابی مجدد / اعتراض (${a.expertName})`),
          round: a.round || (idx === 0 ? 'ارزیابی مرحله اول' : 'ارزیابی مجدد (اعتراض)'),
          roundIdx: idx + 1,
          expertName: a.expertName || 'کارشناس ارزیاب خسارت',
          expertRole: idx === 0 ? 'کارشناس ارزیاب خسارت خودرو' : 'کارشناس ارزیاب دوم (هیئت تجدیدنظر)',
          submittedAt: a.submittedAt || claimCase.date || 'ثبت‌شده',
          gross: a.gross || 0,
          deductions: a.deductions || 0,
          salvage: a.salvage || 0,
          payable: a.payable || 0,
          status: a.status || 'SUBMITTED',
          reviewerNote: a.reviewerNote || '',
          parts: a.parts || [],
          damageSpots: a.carDamageSpots || claimCase.carDamageSpots || {}
        });
      });
    } else if (
      // 3. Single standard damage assessor assessment (only if not already created as a field assessment)
      !hasFieldAssessment &&
      claimCase.assessment &&
      ((claimCase.assessment.gross && claimCase.assessment.gross > 0) ||
        (claimCase.assessment.parts && claimCase.assessment.parts.length > 0) ||
        claimCase.assessment.submittedAt)
    ) {
      list.push({
        id: 'damage-eval-single',
        type: 'DAMAGE_EXPERT',
        tabTitle: `ارزیابی کارشناس خسارت (${claimCase.assignedExpert?.name || claimCase.assessment.submittedBy || 'کارشناس خسارت'})`,
        round: 'ارزیابی کارشناس خسارت',
        roundIdx: 1,
        expertName: claimCase.assignedExpert?.name || claimCase.assessment.submittedBy || 'کارشناس ارزیاب خسارت',
        expertRole: 'کارشناس خسارت خودرو',
        expertPhone: claimCase.assignedExpert?.phone,
        submittedAt: claimCase.assessment.submittedAt || claimCase.date || 'ثبت‌شده',
        gross: claimCase.assessment.gross || 0,
        deductions: claimCase.assessment.deductions || 0,
        salvage: claimCase.assessment.salvage || 0,
        payable: claimCase.assessment.payable || 0,
        status: claimCase.assessment.status || 'SUBMITTED',
        reviewerNote: claimCase.assessment.reviewerNote || claimCase.assessment.notes || '',
        parts: claimCase.assessment.parts || [],
        damageSpots: claimCase.carDamageSpots || {}
      });
    }

    return list;
  }, [claimCase]);

  // Selected assessment for pop-up / modal detail inspection
  const [selectedAssessmentForModal, setSelectedAssessmentForModal] = useState<typeof allAssessments[0] | null>(null);

  // Verdict mapper ensuring field expert authentication verdict is 100% accurate
  const getVerdictDetails = (verdict?: string) => {
    if (!verdict) return null;
    const v = String(verdict).toUpperCase();
    if (
      v === 'CONFIRMED' ||
      v === 'VERIFIED' ||
      v === 'GENUINE' ||
      v.includes('تایید') ||
      v.includes('عدم صوری') ||
      v.includes('اصالت')
    ) {
      return {
        label: 'تایید اصالت حادثه (عدم صوری بودن)',
        shortLabel: 'عدم صوری بودن',
        badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        cardBadgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        iconClass: 'text-emerald-700',
        type: 'VERIFIED'
      };
    }
    if (
      v === 'MINOR_DISCREPANCY' ||
      v === 'PARTIAL_MISMATCH' ||
      v.includes('مغایرت') ||
      v.includes('جزئی')
    ) {
      return {
        label: 'انطباق با مغایرت جزئی در شواهد',
        shortLabel: 'مغایرت جزئی',
        badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
        cardBadgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
        iconClass: 'text-amber-700',
        type: 'MINOR_DISCREPANCY'
      };
    }
    if (
      v === 'FRAUD_REJECTED' ||
      v === 'FRAUD' ||
      v === 'SUSPICIOUS' ||
      v.includes('رد') ||
      v.includes('صوری')
    ) {
      return {
        label: 'رد اصالت / مشکوک به تصادف صوری و ساختگی',
        shortLabel: 'رد اصالت (صوری)',
        badgeClass: 'bg-rose-100 text-rose-900 border border-rose-300',
        cardBadgeClass: 'bg-rose-50 text-rose-800 border border-rose-200',
        iconClass: 'text-rose-700',
        type: 'FRAUD_REJECTED'
      };
    }
    return {
      label: verdict,
      shortLabel: verdict,
      badgeClass: 'bg-blue-100 text-blue-900 border border-blue-300',
      cardBadgeClass: 'bg-blue-50 text-blue-800 border border-blue-200',
      iconClass: 'text-blue-700',
      type: 'OTHER'
    };
  };

  // Safe Damage Spots extractor without ANY dummy/default fallback
  const getAssessmentDamageSpots = (assessment: typeof allAssessments[0]) => {
    if (assessment.damageSpots && Object.keys(assessment.damageSpots).length > 0) {
      return assessment.damageSpots;
    }
    if (assessment.parts && assessment.parts.length > 0) {
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
      const spots: Record<string, any> = {};
      assessment.parts.forEach((p: any) => {
        const k = keyMap[p.name];
        if (k) {
          spots[k] = {
            type: p.type === 'replace' ? 'نیاز به تعویض کامل' : 'تعمیر و صافکاری',
            severity: p.type === 'replace' ? 'major' : 'moderate',
            operation: p.type === 'replace' ? 'تعویض' : 'صافکاری و نقاشی',
            color: p.type === 'replace' ? 'red' : 'orange',
            note: assessment.reviewerNote || `قطعه ${p.name} طبق بررسی کارشناس نیاز به ${p.type === 'replace' ? 'تعویض' : 'تعمیر'} دارد.`
          };
        }
      });
      return spots;
    }
    return {};
  };

  // Is case evaluated yet? (Must have real assessments recorded)
  const hasCompletedAssessment = allAssessments.length > 0;
  const [selectedAssessmentTabIndex, setSelectedAssessmentTabIndex] = useState(0);
  const activeAssessment = allAssessments[selectedAssessmentTabIndex] || allAssessments[0] || null;

  // Modal State for Cards ("time_location", "victim_info", "culprit_info", "policy_info")
  const [activeModalTab, setActiveModalTab] = useState<'time_location' | 'victim_info' | 'culprit_info' | 'policy_info' | null>(null);

  // Police Croqui Inquiry State (Only for croqui cases)
  const [isQueryingCroqui, setIsQueryingCroqui] = useState(false);
  const [hasQueriedCroqui, setHasQueriedCroqui] = useState(
    hasCroqui && !!(claimCase.croquiData || claimCase.sceneReportCode || claimCase.customerKrokiPhoto)
  );
  // Section Expand/Collapse states for Insurer Portal tabs
  const [isCroquiExpanded, setIsCroquiExpanded] = useState(true);
  const [isFieldExpertReportExpanded, setIsFieldExpertReportExpanded] = useState(true);
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
    const branch = currentSelectedBranch;
    const nowFa = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const insurerName = getInsurerPersianName(caseInsurerCode);

    // SMS 1: Dispatch notification for Field Expert containing accident location AND nearest branch address
    const fieldExpertSmsText = `کارشناس گرامی ${fieldExpert.name}،
ماموریت ارزیابی میدانی پرونده ${claimCase.id} (${vehicleName} - پلاک ${plateText}) به شما محول گردید.
📍 محل حادثه: ${accidentLocationAddress}
🏢 نزدیک‌ترین شعبه بیمه جهت حضور و هماهنگی: ${branch.name}
📌 نشانی شعبه: ${branch.address}
📞 تلفن شعبه: ${branch.phone}
👤 مشتری: ${customerName} (همراه: ${customerPhone})
${noteText ? `📝 دستور بیمه‌گر: ${noteText}` : ''}
لطفاً جهت هماهنگی و حضور در محل یا شعبه اقدام فرمایید.
شرکت ${insurerName}`;

    // SMS 2: Dispatch notification for Customer / Insured containing expert info AND nearest branch address
    const customerSmsText = `مشتری/بیمه‌گذار گرامی ${customerName}،
پرونده خسارت شماره ${claimCase.id} به کارشناس رسمی میدانی جناب آقای/سرکار خانم ${fieldExpert.name} (همراه: ${fieldExpert.phone || '—'}) محول گردید.
🏢 نزدیک‌ترین شعبه تخصصی پرداخت خسارت بر اساس آدرس حادثه شما:
نام مرکز: ${branch.name}
نشانی: ${branch.address}
تلفن تماس: ${branch.phone}
⏱ ساعت کاری: ${branch.operatingHours || 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰'}
لطفاً جهت رویت خودرو و ارائه اصل مدارک، در زمان مقرر در محل حادثه یا شعبه مذکور حاضر باشید یا با کارشناس هماهنگ فرمایید.
شرکت ${insurerName}`;

    const feSmsLog = {
      id: `SMS-FE-${Date.now()}`,
      recipientType: 'FIELD_EXPERT' as const,
      recipientName: fieldExpert.name,
      phone: fieldExpert.phone || '09129001001',
      text: fieldExpertSmsText,
      sentAt: nowFa,
      status: 'DELIVERED' as const
    };

    const custSmsLog = {
      id: `SMS-CUST-${Date.now() + 1}`,
      recipientType: (claimCase.isBodyClaim || claimCase.isBodily) ? ('INSURED' as const) : ('VICTIM' as const),
      recipientName: customerName,
      phone: customerPhone,
      text: customerSmsText,
      sentAt: nowFa,
      status: 'DELIVERED' as const
    };

    // 1. Create real-time in-app notification for the Field Expert
    const existingNotifs = loadAssessorNotifications();
    const newSmsNotif: AssessorNotification = {
      id: `SMS-FE-${Date.now()}`,
      type: 'SMS',
      caseId: claimCase.id,
      expertId: fieldExpert.id,
      recipientPhone: fieldExpert.phone,
      senderPhone: '10008000',
      title: `ماموریت ارزیابی میدانی و تعیین شعبه (${branch.name})`,
      message: fieldExpertSmsText,
      sentAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    saveAssessorNotifications([newSmsNotif, ...existingNotifs]);

    // 2. Create real-time in-app notification for the Customer (shown in Bell icon)
    const newCustomerNotif: CustomerNotification = {
      id: `NOTIF-CUST-${Date.now()}`,
      type: 'BRANCH_VISIT',
      caseId: claimCase.id,
      recipientPhone: customerPhone,
      title: 'درخواست مراجعه حضوری به شعبه و ارزیابی خسارت',
      message: customerSmsText,
      branchName: branch.name,
      branchAddress: branch.address,
      branchPhone: branch.phone,
      expertName: fieldExpert.name,
      expertPhone: fieldExpert.phone,
      sentAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      linkAction: 'case_detail'
    };
    addCustomerNotification(newCustomerNotif);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('claimflow_notifications_updated'));
    }

    const updated: ClaimCase = {
      ...claimCase,
      assignedExpert: fieldExpert,
      assignedFieldExpert: fieldExpert,
      assignedBranch: {
        branchId: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        city: branch.city,
        managerName: branch.managerName,
        distance: branchMatch.matchReason
      },
      fieldVisitSchedule: {
        scheduledDate: new Date().toLocaleDateString('fa-IR'),
        scheduledTime: '۱۰:۳۰',
        branchName: branch.name,
        branchAddress: branch.address,
        branchPhone: branch.phone,
        expertId: fieldExpert.id,
        expertName: fieldExpert.name,
        expertPhone: fieldExpert.phone,
        note: noteText || undefined,
        status: 'SCHEDULED'
      },
      insurerInstruction: noteText || claimCase.insurerInstruction || '',
      insurerAssignmentNote: noteText || claimCase.insurerAssignmentNote || '',
      insurerFieldExpertNote: noteText || claimCase.insurerFieldExpertNote || '',
      insurerNoteAuthor: session.name || 'پورتال شرکت بیمه‌گر',
      insurerNoteDate: nowFa,
      status: 'در انتظار بازدید کارشناس میدانی',
      needsCulpritFieldVisit: true,
      smsDispatchLogs: [...(claimCase.smsDispatchLogs || []), feSmsLog, custSmsLog],
      history: [
        ...(claimCase.history || []),
        {
          status: 'در انتظار بازدید کارشناس میدانی',
          time: nowFa,
          user: session.name || 'پورتال بیمه‌گر',
          userRole: 'کارشناس پذیرش شرکت بیمه',
          note: isReassign
            ? `ارجاع پرونده به کارشناس میدانی «${fieldExpert.name}» و نزدیک‌ترین شعبه «${branch.name}» (${branch.address}) انجام شد و ۲ پیامک هماهنگی حاوی آدرس شعبه برای کارشناس و مشتری ارسال گردید.${noteText ? ` دستور بیمه‌گر: «${noteText}»` : ''}`
            : `پرونده به کارشناس میدانی «${fieldExpert.name}» و نزدیک‌ترین شعبه «${branch.name}» (${branch.address}) ارجاع داده شد و پیامک‌های آدرس شعبه و هماهنگی برای کارشناس و مشتری ارسال شدند.${noteText ? ` دستور بیمه‌گر: «${noteText}»` : ''}`
        }
      ]
    };

    onUpdateCase(updated);
    setIsChangingFieldExpert(false);
    setFieldExpertAssignmentNote('');
    setFieldAssignmentFeedback(`پرونده با موفقیت به کارشناس میدانی «${fieldExpert.name}» و شعبه «${branch.name}» ارجاع شد و پیامک آدرس شعبه برای کارشناس و مشتری ارسال گردید.`);
    setTimeout(() => setFieldAssignmentFeedback(null), 6000);
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
      insurerInstruction: noteText || claimCase.insurerInstruction || '',
      insurerAssignmentNote: noteText || claimCase.insurerAssignmentNote || '',
      insurerNoteAuthor: session.name || 'پورتال شرکت بیمه‌گر',
      insurerNoteDate: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
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

  // Genuine incident photos & media uploaded by parties
  const incidentPhotos: Array<{ url: string; title: string; uploader?: string; date?: string }> = useMemo(() => {
    const list: Array<{ url: string; title: string; uploader?: string; date?: string }> = [];

    // From initial claim registration files (Wizard)
    if (claimCase.files && claimCase.files.length > 0) {
      claimCase.files.forEach((f: any, idx: number) => {
        const title = typeof f === 'string' ? f : (f?.name || f?.fileName || `تصویر صحنه تصادف ${idx + 1}`);
        const url = typeof f === 'object' ? f?.dataUrl : undefined;
        if (url && (f?.type === 'image' || !f?.type || f?.type === 'video')) {
          list.push({
            url,
            title,
            uploader: 'ثبت‌کننده اولیه (طرف اول)'
          });
        }
      });
    }

    // From additional documents uploaded by parties
    if (claimCase.additionalDocs && claimCase.additionalDocs.length > 0) {
      claimCase.additionalDocs.forEach((doc) => {
        if (doc.dataUrl && (doc.fileType === 'image' || doc.fileType === 'video')) {
          list.push({
            url: doc.dataUrl,
            title: doc.title || doc.docType,
            uploader: `${doc.uploadedBy || 'کاربر'} (${doc.uploaderRole || (doc.uploaderParty === 'PARTY_ONE' ? 'طرف اول' : 'طرف دوم')})`,
            date: doc.uploadedAt
          });
        }
      });
    }

    // From Kroki official upload
    if (claimCase.customerKrokiPhoto) {
      list.push({
        url: claimCase.customerKrokiPhoto,
        title: 'تصویر برگه رسمی کروکی راهور',
        uploader: 'پلیس راهور / مشتری'
      });
    } else if (claimCase.croquiData?.fileUrl) {
      list.push({
        url: claimCase.croquiData.fileUrl,
        title: 'برگه کروکی رسمی راهور',
        uploader: 'پلیس راهور'
      });
    }

    // From explicit case images array if present (e.g. seeded mock data)
    if (claimCase.images && claimCase.images.length > 0) {
      claimCase.images.forEach((img) => {
        if (img.url && !list.some(p => p.url === img.url)) {
          list.push({
            url: img.url,
            title: img.title || 'تصویر تصادف'
          });
        }
      });
    }

    return list;
  }, [claimCase]);

  // Genuine documents uploaded by or for Victim
  const isP1Victim = claimCase.partyOneRole !== 'مقصر';
  const victimPartyTag = isP1Victim ? 'PARTY_ONE' : 'PARTY_TWO';

  const victimDocuments = useMemo(() => {
    return (claimCase.additionalDocs || []).filter(doc => {
      return (
        doc.uploaderParty === victimPartyTag ||
        doc.uploaderRole?.includes('زیان‌دیده') ||
        (doc.uploaderRole?.includes('اول') && isP1Victim) ||
        (doc.uploaderRole?.includes('دوم') && !isP1Victim) ||
        (doc.uploadedBy && doc.uploadedBy === claimCase.victimName)
      );
    });
  }, [claimCase, victimPartyTag, isP1Victim]);

  // Genuine documents uploaded by or for Culprit
  const culpritPartyTag = isP1Victim ? 'PARTY_TWO' : 'PARTY_ONE';

  const culpritDocuments = useMemo(() => {
    return (claimCase.additionalDocs || []).filter(doc => {
      return (
        doc.uploaderParty === culpritPartyTag ||
        doc.uploaderRole?.includes('مقصر') ||
        (doc.uploaderRole?.includes('دوم') && isP1Victim) ||
        (doc.uploaderRole?.includes('اول') && !isP1Victim) ||
        (doc.uploadedBy && doc.uploadedBy === claimCase.culpritName)
      );
    });
  }, [claimCase, culpritPartyTag, isP1Victim]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in pb-16">
      
      {/* Navigation & Insurer Branding Header */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-300 shadow-xs transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-blue-900" />
            <span>بازگشت به کارتابل</span>
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Company Badge */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${brand.badgeBg} ${brand.badgeText} border ${brand.badgeBorder} flex items-center justify-center font-bold text-xs shadow-xs`}>
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block">
                {companyInfo.name}
              </span>
              <span className="text-[10px] text-slate-500 font-bold block">
                بیمه‌گر مقصر حادثه (مسئول جبران خسارت)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-bold">شماره پرونده:</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-900 rounded-lg text-xs font-black font-mono border border-purple-200">
            {claimCase.id}
          </span>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Sidebar: Assessor Assignment & Controls */}
        <div className="lg:col-span-4 space-y-5 order-2 lg:order-1">
          {isPaidCase ? (
            /* Locked Card for Paid/Settled Case */
            <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-3xl p-5 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2.5 border-b border-emerald-200 pb-3.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-black text-emerald-950 text-sm">پرونده مختومه و پرداخت‌شده</h3>
                  <p className="text-[11px] text-emerald-800 font-bold">تسویه مالی از طریق پنل مدیر مالی انجام شد</p>
                </div>
              </div>

              <div className="p-3.5 bg-white/90 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-bold space-y-2">
                <p className="leading-relaxed">
                  این پرونده به دلیل انجام موفق عملیات پرداخت به شماره شبا زیان‌دیده، مختومه گردیده است.
                </p>
                <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 pt-1 border-t border-emerald-100">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>کلیه عملیات ارجاع، ویرایش و تغییر کارشناس به صورت دائمی قفل می‌باشد.</span>
                </div>
              </div>

              {claimCase.assignedFieldExpert && (
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">کارشناس میدانی رسیدگی‌کننده:</span>
                  <div className="font-black text-slate-900 text-xs">{claimCase.assignedFieldExpert.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">تلفن: {claimCase.assignedFieldExpert.phone || '-'}</div>
                </div>
              )}

              {claimCase.assignedExpert && (
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">کارشناس ارزیاب خسارت:</span>
                  <div className="font-black text-slate-900 text-xs">{claimCase.assignedExpert.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">تلفن: {claimCase.assignedExpert.phone || '-'}</div>
                </div>
              )}

              {claimCase.payoutInfo && (
                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                  <span className="text-[10px] text-slate-500 font-bold block">اطلاعات حساب واریزی:</span>
                  <div className="font-bold text-slate-900">{claimCase.victimName}</div>
                  <div className="font-mono text-xs font-bold text-blue-950 truncate">{claimCase.payoutInfo.iban}</div>
                  <div className="text-[11px] text-slate-600">{claimCase.payoutInfo.bankName || 'بانک عامل'}</div>
                </div>
              )}

              <div className="p-3 bg-emerald-100/80 rounded-2xl border border-emerald-300 text-center text-xs font-black text-emerald-950 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>سند تسویه در پورتال خزانه‌داری آرشیو شد</span>
              </div>
            </div>
          ) : (
            /* Card: Assessor or Field Expert Assignment */
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  {isFieldExpertRequired ? (
                    <>
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                      <span>تخصیص کارشناس رسمی میدانی</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4.5 h-4.5 text-purple-600" />
                      <span>جستجوی ارزیاب و ارجاع</span>
                    </>
                  )}
                </h3>
                {isNoCroquiCase ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                    بدون کروکی
                  </span>
                ) : (claimCase.objectionStage === 4 || claimCase.status === 'در انتظار ارجاع به کارشناس میدانی' || claimCase.status === 'در انتظار بازدید کارشناس میدانی') ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                    اعتراض نهایی (مرحله ۴ - میدانی)
                  </span>
                ) : null}
              </div>

            {/* Mandatory Notice for Stage 4 Objection / Field Inspector Request */}
            {(claimCase.objectionStage === 4 || claimCase.status === 'در انتظار ارجاع به کارشناس میدانی' || claimCase.status === 'در انتظار بازدید کارشناس میدانی') && !claimCase.assignedFieldExpert && (
              <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-100 border-2 border-purple-300 rounded-2xl text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-extrabold text-purple-950">
                  <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>درخواست اعتراض نهایی و ارزیابی میدانی توسط زیان‌دیده:</span>
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed font-bold">
                  زیان‌دیده در مرحله چهارم اعتراض، درخواست اعزام کارشناس رسمی میدانی / ارجاع به شعبه را ثبت نموده است. لطفاً نزدیک‌ترین کارشناس رسمی میدانی را بر اساس موقعیت ثبت‌شده خودرو و شعبه مربوطه تعیین و مأموریت را ابلاغ نمایید.
                </p>
                {accidentLocationAddress && (
                  <div className="p-2 bg-white/90 rounded-xl border border-purple-200 text-[11px] text-purple-950 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>موقعیت استقرار خودرو جهت بازدید: {accidentLocationAddress}</span>
                  </div>
                )}
              </div>
            )}

            {/* Mandatory Regulatory Warning for No-Croqui Cases */}
            {isNoCroquiCase && !claimCase.objectionStage && (
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

            {isFieldExpertRequired ? (
              /* NO CROQUI OR AUTHENTICITY DISPUTE: FIELD EXPERT ASSIGNMENT FLOW */
              (claimCase.assignedFieldExpert || (claimCase.assignedExpert && claimCase.assignedExpert.role?.includes('میدانی'))) && !isChangingFieldExpert ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl space-y-3.5">
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

                  {/* Nearest Branch Card for already assigned cases */}
                  {(claimCase.assignedBranch || currentSelectedBranch) && (
                    <div className="p-3 bg-white/95 rounded-xl border border-blue-200 space-y-1.5 text-right">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-blue-900 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-700" />
                          <span>شعبه تخصصی بیمه جهت مراجعه و هماهنگی:</span>
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 text-[9px] rounded font-bold">
                          {claimCase.assignedBranch?.city || currentSelectedBranch.city}
                        </span>
                      </div>
                      <p className="font-black text-xs text-slate-900">
                        {claimCase.assignedBranch?.name || currentSelectedBranch.name}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        نشانی: {claimCase.assignedBranch?.address || currentSelectedBranch.address}
                      </p>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>تلفن: {claimCase.assignedBranch?.phone || currentSelectedBranch.phone}</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>آدرس پیامک شد</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-700 leading-relaxed bg-white/90 p-2.5 rounded-xl border border-amber-100">
                    پرونده جهت بررسی میدانی، احراز اصالت و رویت فیزیکی به این کارشناس میدانی ارجاع داده شده و آدرس نزدیک‌ترین شعبه بیمه به همراه مشخصات پرونده به کارشناس و مشتری پیامک شده است.
                  </p>

                  {(claimCase.insurerFieldExpertNote || claimCase.insurerAssignmentNote || claimCase.insurerInstruction) && (
                    <div className="p-2.5 bg-amber-100/90 border border-amber-300 rounded-xl space-y-1 text-right">
                      <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-[10px]">
                        <FileText className="w-3 h-3 text-amber-700" />
                        <span>دستور و توضیحات ابلاغی به کارشناس میدانی:</span>
                      </div>
                      <p className="text-[11px] text-amber-950 font-bold leading-relaxed">
                        «{claimCase.insurerFieldExpertNote || claimCase.insurerAssignmentNote || claimCase.insurerInstruction}»
                      </p>
                      {claimCase.insurerNoteDate && (
                        <span className="text-[9px] text-amber-700 block text-left font-mono">
                          ثبت: {claimCase.insurerNoteDate}
                        </span>
                      )}
                    </div>
                  )}

                  {(() => {
                    // Expert assignment is locked unless rejected by expert or customer has raised an objection
                    const isUnlockedByRejectionOrObjection = Boolean(
                      claimCase.expertRejected ||
                      claimCase.autoReturnedDueToTimeout ||
                      claimCase.status === 'رد شده' ||
                      (claimCase.objectionStage && claimCase.objectionStage > 0) ||
                      claimCase.objectionChat ||
                      claimCase.status?.includes('اعتراض') ||
                      claimCase.complaintStatus === 'SUBMITTED' ||
                      claimCase.authenticityDispute
                    );

                    if (isUnlockedByRejectionOrObjection) {
                      return (
                        <div className="space-y-2">
                          <div className="p-2 bg-amber-100/80 border border-amber-300 rounded-xl text-[10px] text-amber-950 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>امکان تغییر کارشناس به دلیل رد توسط کارشناس یا اعتراض مشتری فعال گردید.</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsChangingFieldExpert(true);
                              setIsFieldExpertDropdownOpen(true);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-600/20 active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>تغییر یا ارجاع به کارشناس میدانی دیگر (رفع اعتراض / عدم پذیرش)</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 bg-slate-100 border border-slate-300/80 rounded-xl text-[11px] text-slate-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>تخصیص کارشناس نهایی و قفل است</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          (فقط در صورت رد کارشناس یا ثبت اعتراض مشتری باز می‌شود)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Ultra-Clean, High-Visibility Field Expert Assignment UX */
                <div className="space-y-3 animate-in fade-in">
                  {(claimCase.assignedFieldExpert || claimCase.assignedExpert) && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span className="truncate">کارشناس قبلی: {claimCase.assignedFieldExpert?.name || claimCase.assignedExpert?.name}</span>
                      </div>
                      <span className="text-[10px] text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded font-bold shrink-0">
                        در حال تغییر
                      </span>
                    </div>
                  )}

                  {/* 1. Location & Branch Selector (Compact & High Legibility) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-xs">
                        <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>شعبه معین ارزیابی و خسارت:</span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                        {branchMatch.matchReason}
                      </span>
                    </div>

                    <select
                      value={selectedBranchId}
                      onChange={(e) => {
                        const newBranchId = e.target.value;
                        setSelectedBranchId(newBranchId);
                        const branchExperts = activeCompanyFieldExperts.filter((fe) => fe.branchId === newBranchId);
                        if (branchExperts.length > 0) {
                          setSelectedFieldExpertId(branchExperts[0].id);
                        }
                      }}
                      className="w-full py-2 px-3 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    >
                      <optgroup label={`شعب تخصصی ${getInsurerPersianName(caseInsurerCode)}`}>
                        {INSURANCE_BRANCHES.filter(b => b.insurerCode === caseInsurerCode).map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="سایر مراکز و شعب استانی">
                        {INSURANCE_BRANCHES.filter(b => b.insurerCode !== caseInsurerCode).map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.city})
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 px-0.5 pt-0.5">
                      <span className="flex items-center gap-1 truncate text-slate-500 font-medium">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <strong className="text-slate-800">محل حادثه:</strong> {accidentLocationAddress}
                      </span>
                      <span className="font-mono text-[10px] text-blue-800 shrink-0 font-bold mr-2">
                        تلفن: {currentSelectedBranch.phone}
                      </span>
                    </div>
                  </div>

                  {/* 2. Featured Selected Field Expert (Hero Card) */}
                  {(() => {
                    const currentExpert = activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId) || activeCompanyFieldExperts[0];
                    const rankedInfo = rankedRecommendation.rankedExperts.find(r => r.expert.id === currentExpert?.id) || rankedRecommendation.rankedExperts[0];
                    const otherBranchExperts = activeCompanyFieldExperts.filter(fe => fe.branchId === selectedBranchId && fe.id !== currentExpert?.id);

                    return (
                      <div className="bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white border-2 border-amber-300/90 rounded-2xl p-3.5 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>کارشناس رسمی منتخب:</span>
                          </div>
                          {rankedInfo?.matchScore && (
                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                              {rankedInfo.matchScore}٪ انطباق هوشمند
                            </span>
                          )}
                        </div>

                        {/* Expert Detail Block */}
                        <div className="bg-white p-3 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              {currentExpert?.avatarUrl ? (
                                <img
                                  src={currentExpert.avatarUrl}
                                  alt={currentExpert.name}
                                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-300"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-base shadow-2xs">
                                  {currentExpert?.name.slice(0, 1) || 'ک'}
                                </div>
                              )}
                              <span className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-black text-slate-950 text-sm truncate">{currentExpert?.name}</h4>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              </div>
                              <p className="text-[11px] text-slate-600 font-bold truncate">
                                {currentExpert?.role}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                                <span>امتیاز: {currentExpert?.rating || 4.9}</span>
                                <span>•</span>
                                <span>فاصله: {rankedInfo?.distanceText || 'نزدیک محل'}</span>
                                <span>•</span>
                                <span className="font-mono text-amber-900 font-bold">تلفن: {currentExpert?.phone}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Switch / Change Expert Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setFieldExpertSearchTerm('');
                            setIsExpertPickerModalOpen(true);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-amber-100/90 hover:bg-amber-200/90 text-amber-950 text-xs font-extrabold flex items-center justify-center gap-2 transition-all border border-amber-300 shadow-2xs active:scale-98"
                        >
                          <Search className="w-3.5 h-3.5 text-amber-800" />
                          <span>انتخاب یا تغییر کارشناس از بین تمام شعب ({rankedRecommendation.rankedExperts.length} کارشناس)</span>
                        </button>

                        {/* Quick 1-Click Alternate Chips from the same branch */}
                        {otherBranchExperts.length > 0 && (
                          <div className="pt-1 border-t border-amber-200/60 space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold block">
                              سایر کارشناسان مستقر در «{currentSelectedBranch.name.replace('مرکز پرداخت خسارت و کارشناسی خودرو ', '').replace('مجتمع خسارت و کارشناسی خودرو ', '')}»:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {otherBranchExperts.map((exp) => (
                                <button
                                  key={exp.id}
                                  type="button"
                                  onClick={() => setSelectedFieldExpertId(exp.id)}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white text-slate-800 hover:bg-amber-100/70 border border-amber-200 transition-all flex items-center gap-1 shadow-2xs"
                                >
                                  <span>{exp.name}</span>
                                  <span className="text-[9px] text-slate-500 font-normal font-mono">({exp.phone.slice(-4)})</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. Collapsible Instruction Note */}
                  <div className="space-y-1.5">
                    {!showNoteInput && !fieldExpertAssignmentNote ? (
                      <button
                        type="button"
                        onClick={() => setShowNoteInput(true)}
                        className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>+ افزودن دستور یا یادداشت برای کارشناس میدانی (اختیاری)</span>
                      </button>
                    ) : (
                      <div className="space-y-1 animate-in fade-in">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>دستور کار و توضیحات تکمیلی به کارشناس:</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!fieldExpertAssignmentNote) setShowNoteInput(false);
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-600"
                          >
                            بستن
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={fieldExpertAssignmentNote}
                          onChange={(e) => setFieldExpertAssignmentNote(e.target.value)}
                          placeholder="مثال: رویت اصالت قطعات تعویضی و تطابق زاویه برخورد دو خودرو در صحنه..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium text-xs focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 transition-all placeholder:text-slate-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* 4. Streamlined SMS Notice Pill with Preview Modal Trigger */}
                  <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 text-emerald-950 font-bold text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="truncate">پیامک نشانی شعبه و پرونده به کارشناس و مشتری</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSmsPreview(!showSmsPreview)}
                      className="px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-black shrink-0 transition-colors"
                    >
                      {showSmsPreview ? 'پنهان‌سازی' : 'پیش‌نمایش متن'}
                    </button>
                  </div>

                  {/* SMS Preview Drawer if expanded */}
                  {showSmsPreview && (
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-2 animate-in fade-in text-xs shadow-xs">
                      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSmsPreviewTab('EXPERT')}
                          className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                            smsPreviewTab === 'EXPERT'
                              ? 'bg-white text-blue-950 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ۱. پیامک به کارشناس
                        </button>
                        <button
                          type="button"
                          onClick={() => setSmsPreviewTab('CUSTOMER')}
                          className={`flex-1 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                            smsPreviewTab === 'CUSTOMER'
                              ? 'bg-white text-emerald-950 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ۲. پیامک به مشتری
                        </button>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-800 leading-relaxed font-sans font-medium whitespace-pre-line max-h-40 overflow-y-auto">
                        {smsPreviewTab === 'EXPERT' ? (
                          <>
                            <div className="text-[10px] text-blue-700 font-bold mb-1 border-b border-slate-200 pb-1">
                              گیرنده: {activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId)?.name || 'کارشناس'} ({activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId)?.phone || '09129001001'})
                            </div>
                            {`کارشناس گرامی ${activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId)?.name || 'کارشناس'}،
ماموریت ارزیابی میدانی پرونده ${claimCase.id} (${vehicleName} - پلاک ${plateText}) به شما محول گردید.
📍 محل حادثه: ${accidentLocationAddress}
🏢 شعبه هماهنگی: ${currentSelectedBranch.name} (${currentSelectedBranch.phone})
📌 نشانی: ${currentSelectedBranch.address}
👤 مشتری: ${customerName} (${customerPhone})
${fieldExpertAssignmentNote.trim() ? `📝 دستور بیمه‌گر: ${fieldExpertAssignmentNote.trim()}` : ''}`}
                          </>
                        ) : (
                          <>
                            <div className="text-[10px] text-emerald-700 font-bold mb-1 border-b border-slate-200 pb-1">
                              گیرنده: {customerName} ({customerPhone})
                            </div>
                            {`مشتری گرامی ${customerName}،
پرونده خسارت ${claimCase.id} به کارشناس رسمی میدانی جناب آقای/سرکار خانم ${activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId)?.name || 'کارشناس'} (${activeCompanyFieldExperts.find(fe => fe.id === selectedFieldExpertId)?.phone || '—'}) محول گردید.
🏢 نزدیک‌ترین شعبه تخصصی خسارت: ${currentSelectedBranch.name}
📌 نشانی: ${currentSelectedBranch.address}
📞 تلفن: ${currentSelectedBranch.phone}
شرکت ${getInsurerPersianName(caseInsurerCode)}`}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5. Primary Action Button */}
                  <button
                    onClick={handleAssignFieldExpert}
                    disabled={!selectedFieldExpertId}
                    className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs shadow-md shadow-amber-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>تأیید و ابلاغ مأموریت به کارشناس میدانی</span>
                  </button>

                  {(claimCase.assignedFieldExpert || claimCase.assignedExpert) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingFieldExpert(false);
                        setIsFieldExpertDropdownOpen(false);
                      }}
                      className="w-full py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      انصراف از تغییر
                    </button>
                  )}

                  {/* 6. Comprehensive Expert Picker Modal (Spacious & Clean UX) */}
                  {isExpertPickerModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-black text-sm">انتخاب کارشناس رسمی میدانی</h3>
                              <p className="text-[11px] text-slate-300">
                                شرکت {getInsurerPersianName(caseInsurerCode)} • شعبه معین: {currentSelectedBranch.name}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsExpertPickerModalOpen(false)}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Search & Tabs */}
                        <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setExpertFilterTab('BRANCH')}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                                expertFilterTab === 'BRANCH'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              کارشناسان شعبه منتخب ({rankedRecommendation.selectedBranchExperts.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpertFilterTab('ALL')}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                                expertFilterTab === 'ALL'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              تمام کارشناسان استانی ({rankedRecommendation.rankedExperts.length})
                            </button>
                          </div>

                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                            <input
                              type="text"
                              value={fieldExpertSearchTerm}
                              onChange={(e) => setFieldExpertSearchTerm(e.target.value)}
                              placeholder="جستجوی نام کارشناس، تخصص، شعبه یا تلفن..."
                              className="w-full pr-10 pl-8 py-2.5 bg-white rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                            />
                            {fieldExpertSearchTerm && (
                              <button
                                type="button"
                                onClick={() => setFieldExpertSearchTerm('')}
                                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expert Cards Grid List */}
                        <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
                          {displayedFieldExpertsList.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500 font-bold">
                              کارشناسی با این مشخصات یافت نشد
                            </div>
                          ) : (
                            displayedFieldExpertsList.map((item) => {
                              const isSelected = selectedFieldExpertId === item.expert.id;
                              return (
                                <div
                                  key={item.expert.id}
                                  onClick={() => {
                                    setSelectedFieldExpertId(item.expert.id);
                                    if (item.branch?.id && item.branch.id !== selectedBranchId) {
                                      setSelectedBranchId(item.branch.id);
                                    }
                                    setIsExpertPickerModalOpen(false);
                                  }}
                                  className={`pt-2 first:pt-0 p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    isSelected
                                      ? 'bg-amber-50 border-amber-600 shadow-sm ring-2 ring-amber-300/40'
                                      : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative shrink-0">
                                      {item.expert.avatarUrl ? (
                                        <img
                                          src={item.expert.avatarUrl}
                                          alt={item.expert.name}
                                          className="w-11 h-11 rounded-2xl object-cover border border-slate-300"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                                          {item.expert.name.slice(0, 1)}
                                        </div>
                                      )}
                                      <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-black text-slate-900 text-xs truncate">{item.expert.name}</h4>
                                        <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md font-bold shrink-0">
                                          {item.expert.role}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-2">
                                        <Building2 className="w-3 h-3 text-blue-700 shrink-0" />
                                        <span className="truncate">{item.branch.name}</span>
                                        <span>•</span>
                                        <span className="font-mono text-slate-500">تلفن: {item.expert.phone}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                        <span>امتیاز: {item.expert.rating || 4.9}</span>
                                        <span>•</span>
                                        <span>فاصله تا حادثه: {item.distanceText}</span>
                                        <span>•</span>
                                        <span>{item.availabilityText}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-3">
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                      item.matchScore >= 90
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}>
                                      {item.matchScore}٪ انطباق
                                    </span>
                                    <button
                                      type="button"
                                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                        isSelected
                                          ? 'bg-amber-600 text-white shadow-xs'
                                          : 'bg-slate-100 text-slate-800 hover:bg-amber-100'
                                      }`}
                                    >
                                      {isSelected ? 'منتخب' : 'انتخاب'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsExpertPickerModalOpen(false)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-extrabold hover:bg-slate-800 transition-colors"
                          >
                            بستن
                          </button>
                        </div>
                      </div>
                    </div>
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

                  {(claimCase.insurerAssignmentNote || claimCase.insurerInstruction) && (
                    <div className="p-2.5 bg-purple-100/90 border border-purple-300 rounded-xl space-y-1 text-right">
                      <div className="flex items-center gap-1.5 text-purple-900 font-extrabold text-[10px]">
                        <FileText className="w-3 h-3 text-purple-700" />
                        <span>دستور و توضیحات ابلاغی بیمه‌گر:</span>
                      </div>
                      <p className="text-[11px] text-purple-950 font-bold leading-relaxed">
                        «{claimCase.insurerAssignmentNote || claimCase.insurerInstruction}»
                      </p>
                      {claimCase.insurerNoteDate && (
                        <span className="text-[9px] text-purple-700 block text-left font-mono">
                          ثبت: {claimCase.insurerNoteDate}
                        </span>
                      )}
                    </div>
                  )}

                  {(() => {
                    // Expert assignment is locked unless rejected by expert or customer has raised an objection
                    const isUnlockedByRejectionOrObjection = Boolean(
                      claimCase.expertRejected ||
                      claimCase.autoReturnedDueToTimeout ||
                      claimCase.status === 'رد شده' ||
                      (claimCase.objectionStage && claimCase.objectionStage > 0) ||
                      claimCase.objectionChat ||
                      claimCase.status?.includes('اعتراض') ||
                      claimCase.complaintStatus === 'SUBMITTED' ||
                      claimCase.authenticityDispute
                    );

                    if (isUnlockedByRejectionOrObjection) {
                      return (
                        <div className="space-y-2">
                          <div className="p-2 bg-purple-100/80 border border-purple-300 rounded-xl text-[10px] text-purple-950 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            <span>امکان تغییر ارزیاب به دلیل رد توسط کارشناس یا اعتراض مشتری فعال گردید.</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsChangingExpert(true);
                              setIsExpertDropdownOpen(true);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-600/20 active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>تغییر یا ارجاع به ارزیاب دیگر (رفع اعتراض / عدم پذیرش)</span>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 bg-slate-100 border border-slate-300/80 rounded-xl text-[11px] text-slate-700 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>تخصیص ارزیاب نهایی و قفل است</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          (فقط در صورت رد کارشناس یا ثبت اعتراض مشتری باز می‌شود)
                        </span>
                      </div>
                    );
                  })()}
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
          )}
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
                {isPaidCase ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>پرداخت شده (مختومه)</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    {claimCase.status}
                  </span>
                )}
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
                  {incidentPhotos.length + (claimCase.additionalDocs?.length || 0)} مستند
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
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                            (claimCase.croquiType === 'paper' || claimCase.croquiData?.croquiType === 'paper')
                              ? 'bg-amber-50 text-amber-950 border-amber-300'
                              : 'bg-blue-50 text-blue-900 border-blue-300'
                          }`}>
                            {(claimCase.croquiType === 'paper' || claimCase.croquiData?.croquiType === 'paper') ? 'کروکی کاغذی (ثبت مشتری)' : 'کروکی الکترونیکی فراجا'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-bold">کد/شماره گزارش:</span>
                          <span className="px-3 py-1 bg-amber-100 text-amber-950 font-mono font-black rounded-lg text-xs">
                            {claimCase.croquiData?.reportNumber || claimCase.sceneReportCode || 'CRQ-1403-88492'}
                          </span>
                        </div>
                      </div>

                      {/* 2. Key Grid Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* Incident Date & Time */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">تاریخ و ساعت دقیق تصادف:</span>
                          <span className="font-extrabold text-slate-900 font-mono">{claimCase.croquiData?.incidentDate || claimCase.date || '۱۴۰۵/۰۵/۱۴ - ۱۰:۴۵'}</span>
                        </div>

                        {/* Location & GPS */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">محل دقیق وقوع حادثه:</span>
                          <span className="font-bold text-slate-900 block truncate" title={claimCase.croquiData?.location || claimCase.incidentAddress || claimCase.address}>{claimCase.croquiData?.location || claimCase.incidentAddress || claimCase.address || 'تهران - بزرگراه همت غرب'}</span>
                        </div>

                        {/* Accident Type */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">نوع تصادف:</span>
                          <span className="font-bold text-slate-900 block truncate">{claimCase.croquiData?.accidentType || 'تصادف خسارتی دو خودرو (عدم رعایت فاصله طولی)'}</span>
                        </div>

                        {/* Road Condition */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">وضعیت جاده و جوی:</span>
                          <span className="font-bold text-slate-900 block truncate">{claimCase.croquiData?.roadCondition || 'آسفالت خشک، هوا صاف، دید کافی'}</span>
                        </div>

                        {/* Fault Determination & Percentage */}
                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1 sm:col-span-2">
                          <span className="text-rose-800 font-bold block text-[11px]">تعیین مقصر قانونی و علت تامه:</span>
                          <span className="font-black text-rose-950 text-xs">
                            {claimCase.croquiData?.faultDetermination || `۱۰۰٪ مقصر: راننده خودرو ${claimCase.culpritCarType || 'مقصر'} (${claimCase.culpritName}) به علت عدم توجه به جلو`}
                          </span>
                        </div>

                        {/* Claimant Info */}
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                          <span className="text-emerald-800 font-bold block text-[11px]">زیان‌دیده (طرف اول):</span>
                          <span className="font-black text-emerald-950 block">
                            {claimCase.croquiData?.victimDriver?.fullName || claimCase.victimName || 'پریسا'}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-mono block">
                            {claimCase.victimPlate || '۴۴ ج ۷۸۹ ایران ۲۲'}
                          </span>
                        </div>

                        {/* Police Badge & Official Stamp */}
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-1">
                          <span className="text-blue-900 font-bold block text-[11px]">افسر کاردان فنی و یگان:</span>
                          <span className="font-bold text-blue-950 text-xs block">
                            {claimCase.croquiData?.officerName || 'سروان صادقی (پلیس راهور فراجا)'}
                          </span>
                          <span className="text-[10px] text-blue-800 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-700" />
                            مهر رسمی پلیس تایید گردید
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
                        <span className="font-black text-slate-800 text-[11px] block">تصویر برگه رسمی کروکی و مستندات منضم:</span>
                        {(claimCase.customerKrokiPhoto || claimCase.croquiData?.fileUrl || incidentPhotos.length > 0) ? (
                          <div className="flex items-center gap-3 overflow-x-auto pb-1">
                            {(claimCase.customerKrokiPhoto || claimCase.croquiData?.fileUrl) && (
                              <div
                                onClick={() => setPreviewImage(claimCase.customerKrokiPhoto || claimCase.croquiData?.fileUrl || '')}
                                className="relative w-36 h-24 rounded-xl border-2 border-amber-400 bg-amber-50 overflow-hidden shrink-0 cursor-pointer group shadow-2xs"
                              >
                                <img
                                  src={claimCase.customerKrokiPhoto || claimCase.croquiData?.fileUrl || ''}
                                  alt="Croqui"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                  بزرگ‌نمایی کروکی
                                </div>
                              </div>
                            )}

                            {incidentPhotos.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setPreviewImage(img.url)}
                                className="relative w-36 h-24 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 cursor-pointer group shadow-2xs"
                              >
                                <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold p-1 text-center truncate">
                                  {img.title}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                            تصویر یا فایلی برای کروکی بارگذاری نشده است (کروکی به‌صورت ثبتی/کد رهگیری موجود است).
                          </div>
                        )}
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

            {/* FOUR INTERACTIVE CARDS GRID (INCIDENT, PARTIES & POLICY DETAILS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
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
                    {claimCase.date || '۱۰:۰۲ ۱۴۰۵/۰۵/۰۶'} — {claimCase.incidentAddress ? claimCase.incidentAddress.substring(0, 16) + '...' : 'شهید بلمه، تختی...'}
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

              {/* CARD 4: بیمه‌نامه و سقف تعهدات */}
              <div
                onClick={() => setActiveModalTab('policy_info')}
                className="bg-slate-50 hover:bg-purple-50/80 border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-4 cursor-pointer transition-all shadow-2xs space-y-2.5 group relative active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-purple-700 transition-colors">
                    بیمه‌نامه و سقف تعهدات
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-1">
                    بیمه {getInsurerPersianName(claimCase.culpritInsurer)} — {claimCase.culpritPolicyNo || 'AL-1401-102'}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-bold">سقف مالی:</span>
                  <span className="font-black text-emerald-700 font-mono">
                    {formatCurrency(claimCase.culpritCoverageFinancial || 50000000)}
                  </span>
                </div>
              </div>

            </div>

            {/* COMPACT EXPERT ASSESSMENT CARDS GRID (SPACE-SAVING ACCORDION / CARDS VIEW) */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-blue-950 flex items-center gap-2">
                      <span>گزارش‌ها و ارزیابی‌های کارشناسی</span>
                      {hasCompletedAssessment ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black border border-emerald-300">
                          {allAssessments.length} گزارش کارشناسی ثبت‌شده
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                          در انتظار ارزیابی کارشناس
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      خلاصه ارزیابی‌های میدانی و کارشناسی خسارت. جهت مشاهده جزئیات کامل، دیاگرام ۲بعدی و قطعات روی هر کارت کلیک کنید.
                    </p>
                  </div>
                </div>
              </div>

              {hasCompletedAssessment ? (
                <div className="space-y-4">
                  {/* Comprehensive Financial Apportionment Card */}
                  {(() => {
                    const calc = calculateClaimDamageWithPolicyLimits(claimCase);
                    return (
                      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-indigo-500/30 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs sm:text-sm text-white">
                                تفکیک خسارت، سقف تعهد مالی بیمه‌نامه و وضعیت بدهی مقصر
                              </h4>
                              <p className="text-[11px] text-slate-300">
                                استعلام سنهاب بیمه مرکزی • بیمه‌گر مقصر: {getInsurerPersianName(claimCase.culpritInsurer)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {calc.culpritExcessDebt > 0 ? (
                              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                <span>مازاد بر سقف ({formatCurrency(calc.culpritExcessDebt)} بدهی مقصر)</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>پوشش ۱۰۰٪ در سقف بیمه‌نامه</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 text-xs">
                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <span className="text-slate-400 text-[10px] block mb-1">خسارت کل کارشناسی</span>
                            <span className="font-mono font-bold text-white text-xs">
                              {formatCurrency(calc.directDamageAmount)}
                            </span>
                          </div>

                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <span className="text-slate-400 text-[10px] block mb-1">کسر ارزش داغی</span>
                            <span className="font-mono font-bold text-rose-300 text-xs">
                              {calc.salvageDeduction > 0 ? `-${formatCurrency(calc.salvageDeduction)}` : '۰ ریال'}
                            </span>
                          </div>

                          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-400 text-[10px]">افت ارزش خودرو</span>
                              {calc.diminutionPercent > 0 && (
                                <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded">
                                  {calc.diminutionPercent}%
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-amber-300 text-xs">
                              {calc.diminutionAmount > 0 ? `+${formatCurrency(calc.diminutionAmount)}` : 'شامل نمی‌شود'}
                            </span>
                          </div>

                          <div className="bg-white/10 border border-indigo-400/40 p-3 rounded-xl">
                            <span className="text-indigo-200 text-[10px] block mb-1 font-bold">مجموع کل مطالبه</span>
                            <span className="font-mono font-extrabold text-white text-xs">
                              {formatCurrency(calc.totalClaimAmount)}
                            </span>
                          </div>

                          <div className="bg-emerald-500/15 border border-emerald-400/30 p-3 rounded-xl">
                            <span className="text-emerald-300 text-[10px] block mb-1 font-bold">سهم پرداختی بیمه (سقف)</span>
                            <span className="font-mono font-black text-emerald-300 text-xs">
                              {formatCurrency(calc.insurerPayablePortion)}
                            </span>
                          </div>

                          <div className={`p-3 rounded-xl border ${
                            calc.culpritExcessDebt > 0 
                              ? 'bg-rose-500/20 border-rose-400/40' 
                              : 'bg-white/5 border-white/10'
                          }`}>
                            <span className={`text-[10px] block mb-1 font-bold ${
                              calc.culpritExcessDebt > 0 ? 'text-rose-300' : 'text-slate-400'
                            }`}>
                              بدهی مازاد مقصر حادثه
                            </span>
                            <span className={`font-mono font-black text-xs ${
                              calc.culpritExcessDebt > 0 ? 'text-rose-200' : 'text-slate-400'
                            }`}>
                              {calc.culpritExcessDebt > 0 ? formatCurrency(calc.culpritExcessDebt) : 'بدون بدهی'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {allAssessments.map((item, idx) => {
                    const verdictInfo = getVerdictDetails(item.verdict);
                    const isField = item.type === 'FIELD_EXPERT';

                    return (
                      <div
                        key={item.id || idx}
                        className={`rounded-2xl border-2 p-4 flex flex-col justify-between transition-all shadow-2xs hover:shadow-md ${
                          isField
                            ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-400'
                            : 'bg-blue-50/40 border-blue-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Header Tag */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 ${
                                isField ? 'bg-emerald-700 text-white' : 'bg-blue-900 text-white'
                              }`}>
                                {isField ? <Compass className="w-3.5 h-3.5" /> : <FileBadge className="w-3.5 h-3.5" />}
                                <span>{isField ? 'بازدید و اصالت‌سنجی میدانی' : 'ارزیابی خسارت خودرو'}</span>
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                                {item.round}
                              </span>
                            </div>

                            {verdictInfo && (
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${verdictInfo.badgeClass}`}>
                                <ShieldCheck className="w-3 h-3" />
                                <span>{verdictInfo.shortLabel}</span>
                              </span>
                            )}
                          </div>

                          {/* Expert Info */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <strong className="text-slate-900 font-black text-xs sm:text-sm">
                                {item.expertName}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.submittedAt}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center justify-between">
                              <span>{item.expertRole}</span>
                              {item.expertPhone && (
                                <span className="font-mono text-slate-600 font-bold">{item.expertPhone}</span>
                              )}
                            </div>
                          </div>

                          {/* Verdict detail description if present */}
                          {verdictInfo && (
                            <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${verdictInfo.cardBadgeClass}`}>
                              <ShieldCheck className={`w-4 h-4 shrink-0 ${verdictInfo.iconClass}`} />
                              <span>وضعیت اصالت: <strong>{verdictInfo.label}</strong></span>
                            </div>
                          )}

                          {/* Financial Summary Strip */}
                          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] font-bold">خسارت ناخالص:</span>
                              <strong className="text-slate-800 font-black text-xs font-mono">{formatCurrency(item.gross)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] font-bold">قابل پرداخت نهایی:</span>
                              <strong className="text-emerald-700 font-black text-xs font-mono">{formatCurrency(item.payable)}</strong>
                            </div>
                          </div>

                          {/* Summary metrics pills */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                              تعداد قطعات: <strong className="text-slate-900">{item.parts.length}</strong>
                            </span>
                            {item.photos && item.photos.length > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                                تصاویر بازدید: <strong className="text-slate-900">{item.photos.length}</strong>
                              </span>
                            )}
                          </div>

                          {/* Note Excerpt */}
                          {item.reviewerNote && (
                            <p className="text-[11px] text-slate-600 font-medium line-clamp-2 bg-white/80 p-2 rounded-lg border border-slate-100 leading-relaxed">
                              «{item.reviewerNote}»
                            </p>
                          )}
                        </div>

                        {/* Open Modal Button */}
                        <div className="pt-3 mt-3 border-t border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => setSelectedAssessmentForModal(item)}
                            className={`w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 ${
                              isField
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                                : 'bg-blue-900 hover:bg-blue-950 text-white shadow-blue-900/20'
                            }`}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>مشاهده جزئیات کامل، فاکتور و مدل ۲بعدی</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              ) : (
                /* Clean Pending/Waiting State when no assessment has been conducted yet */
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      در انتظار ثبت ارزیابی و بازدید کارشناس
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      هنوز ارزیابی یا گزارشی توسط کارشناس برای این پرونده ثبت نگردیده است. پس از انجام بازدید و ثبت گزارش توسط کارشناس محول‌شده، کارت ارزیابی به همراه فاکتور قطعات و مدل ۲بعدی در این بخش قرار می‌گیرد.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                    <span>کارشناس محول‌شده:</span>
                    <strong className="text-blue-900">
                      {claimCase.assignedFieldExpert?.name || claimCase.assignedExpert?.name || 'در انتظار ارجاع به کارشناس'}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* CASE TIMELINE & HISTORY (PERMANENTLY VISIBLE AT THE BOTTOM OF THE PAGE) */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 sm:p-6 space-y-4 transition-all">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <span>گذر وضعیت پرونده (تاریخچه و گردش کار)</span>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-black border border-purple-200">
                        {timelineHistory.length} رویداد ثبت‌شده
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      ثبت دقیق لاگ و تغییرات وضعیت پرونده از زمان تشکیل تا ارزیابی و تسویه
                    </p>
                  </div>
                </div>
              </div>

              {/* Permanent Timeline Stream */}
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
            </div>

            {/* PAYMENT & FINANCIAL SETTLEMENT SECTION (ALWAYS AT THE VERY BOTTOM OF THE PAGE) */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-emerald-950 text-xs flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>وضعیت پرداخت و صدور حواله مالی خسارت</span>
                </h4>

                <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg">
                  مدیریت واریز
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">قابل پرداخت</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {hasCompletedAssessment && activeAssessment ? formatCurrency(activeAssessment.payable) : 'در انتظار تایید ارزیابی'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">تصمیم زیان‌دیده</span>
                  <span className="font-bold text-slate-800">
                    {hasCompletedAssessment ? 'تایید اولیه' : 'ثبت نشده'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">وضعیت واریز</span>
                  <span className="font-bold text-slate-800">
                    {hasCompletedAssessment ? 'در انتظار شبا و حواله' : 'در انتظار ارزیابی'}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block mb-1">نسخه ارزیابی</span>
                  <span className="font-bold text-purple-700 font-mono">
                    {hasCompletedAssessment && activeAssessment ? `A-${activeAssessment.roundIdx || 1}` : '-'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* DETAILED ASSESSMENT & 2D BLUEPRINT MODAL */}
      {selectedAssessmentForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 sm:p-5 z-20 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                  selectedAssessmentForModal.type === 'FIELD_EXPERT' ? 'bg-emerald-700' : 'bg-blue-900'
                }`}>
                  {selectedAssessmentForModal.type === 'FIELD_EXPERT' ? <Compass className="w-5 h-5" /> : <FileBadge className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span>{selectedAssessmentForModal.tabTitle}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                      {selectedAssessmentForModal.round}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                    <span>کارشناس: <strong className="text-slate-800">{selectedAssessmentForModal.expertName}</strong></span>
                    {selectedAssessmentForModal.expertPhone && (
                      <span className="font-mono text-slate-500">({selectedAssessmentForModal.expertPhone})</span>
                    )}
                    <span>•</span>
                    <span>تاریخ: <strong className="text-slate-700">{selectedAssessmentForModal.submittedAt}</strong></span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAssessmentForModal(null)}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all font-bold flex items-center gap-1.5 text-xs"
              >
                <span>بستن</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Authenticity / Verdict Banner */}
              {(() => {
                const verdictInfo = getVerdictDetails(selectedAssessmentForModal.verdict);
                if (!verdictInfo) return null;
                return (
                  <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 shadow-2xs ${verdictInfo.cardBadgeClass}`}>
                    <ShieldCheck className={`w-6 h-6 shrink-0 mt-0.5 ${verdictInfo.iconClass}`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black">وضعیت اصالت و اصالت‌سنجی: {verdictInfo.label}</strong>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">
                        {selectedAssessmentForModal.verdict === 'CONFIRMED'
                          ? 'طبق بررسی کارشناس میدانی و تطبیق آثار برخورد با اظهارات طرفین و مستندات، اصالت حادثه تایید شده و هیچ‌گونه شواهدی مبنی بر تصادف صوری یا ساختگی مشاهده نگردید.'
                          : selectedAssessmentForModal.verdict === 'PARTIAL_MISMATCH'
                          ? 'کارشناس میدانی مغایرت جزئی در شواهد خسارت ثبت کرده است که نیازمند توجه بازبین ارشد است.'
                          : 'اصالت حادثه توسط کارشناس رد شده و پرونده مشکوک به تصادف صوری / ساختگی اعلام گردیده است.'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Financial Metrics 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[10px] font-bold">خسارت ناخالص:</span>
                  <strong className="text-slate-900 text-sm font-black font-mono">
                    {formatCurrency(selectedAssessmentForModal.gross)}
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[10px] font-bold">کسورات و فرانشیز:</span>
                  <strong className="text-slate-800 text-sm font-bold font-mono">
                    {formatCurrency(selectedAssessmentForModal.deductions || 0)}
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[10px] font-bold">ارزش داغی / اسقاط:</span>
                  <strong className="text-slate-800 text-sm font-bold font-mono">
                    {formatCurrency(selectedAssessmentForModal.salvage || 0)}
                  </strong>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[10px] font-bold">قابل پرداخت نهایی:</span>
                  <strong className="text-emerald-700 text-sm font-black font-mono">
                    {formatCurrency(selectedAssessmentForModal.payable)}
                  </strong>
                </div>
              </div>

              {/* Interactive 2D Car Model Viewer */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-900" />
                  <span>دیاگرام ۲بعدی و مدل نقاط آسیب‌دیده خودرو</span>
                </h4>
                <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <Car3DViewer
                    caseId={claimCase.id}
                    editable={false}
                    damageData={getAssessmentDamageSpots(selectedAssessmentForModal)}
                  />
                </div>
              </div>

              {/* Itemized Parts Breakdown Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-900" />
                    <span>جدول تفکیکی قطعات و اجرت‌های برآوردشده</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-bold">
                    تعداد اقلام: <strong className="text-blue-950 font-black">{selectedAssessmentForModal.parts?.length || 0}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                      <tr>
                        <th className="p-3">ردیف</th>
                        <th className="p-3">قطعه / بخش آسیب‌دیده</th>
                        <th className="p-3">نوع عملیات</th>
                        <th className="p-3">قیمت قطعه</th>
                        <th className="p-3">اجرت / تعمیر</th>
                        <th className="p-3">ارزش اسقاط</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {selectedAssessmentForModal.parts && selectedAssessmentForModal.parts.length > 0 ? (
                        selectedAssessmentForModal.parts.map((p: any, idx: number) => (
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

              {/* Expert Descriptive Remarks */}
              {selectedAssessmentForModal.reviewerNote && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs space-y-1.5">
                  <span className="font-extrabold text-amber-950 block flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-800" />
                    <span>گزارش تشریحی و نظریه کارشناس ({selectedAssessmentForModal.expertName}):</span>
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium bg-white/90 p-3.5 rounded-xl border border-amber-100 whitespace-pre-wrap">
                    {selectedAssessmentForModal.reviewerNote}
                  </p>
                </div>
              )}

              {/* Photos Gallery */}
              {selectedAssessmentForModal.photos && selectedAssessmentForModal.photos.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-900" />
                      <span>تصاویر و مستندات ثبت‌شده در بازدید ({selectedAssessmentForModal.expertName})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-bold">
                      تعداد تصاویر: <strong className="text-blue-950 font-black">{selectedAssessmentForModal.photos.length}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedAssessmentForModal.photos.map((photo: any, idx: number) => (
                      <div
                        key={photo.id || idx}
                        onClick={() => photo.url && setPreviewImage(photo.url)}
                        className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:scale-[1.02]"
                      >
                        {photo.url ? (
                          <img
                            src={photo.url}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2">
                            <ImageOff className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 p-2.5 flex flex-col justify-end">
                          <span className="text-white text-[11px] font-bold line-clamp-1">
                            {photo.title}
                          </span>
                          {photo.uploadedAt && (
                            <span className="text-slate-300 text-[9px] font-mono">
                              {photo.uploadedAt}
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAssessmentForModal(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                بستن پنجره گزارش
              </button>
            </div>
          </div>
        </div>
      )}

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

              {/* 4 Tab Switchers inside Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-black">
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
                  <span>زمان و مکان</span>
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

                <button
                  type="button"
                  onClick={() => setActiveModalTab('policy_info')}
                  className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    activeModalTab === 'policy_info'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>بیمه‌نامه و تعهدات</span>
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
                      <span>عکس‌ها و مستندات ارسالی موقعیت تصادف ({incidentPhotos.length})</span>
                    </h4>

                    {incidentPhotos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {incidentPhotos.map((img, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
                            <div className="relative h-44 rounded-xl overflow-hidden group bg-slate-200">
                              <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPreviewImage(img.url)}
                                className="absolute bottom-2 left-2 px-3 py-1 bg-slate-900/80 text-white rounded-lg text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 hover:bg-slate-900 transition-colors"
                              >
                                <Maximize2 className="w-3 h-3" />
                                <span>بزرگ‌نمایی تصویر</span>
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-slate-800 truncate">{img.title || `تصویر شماره ${idx + 1}`}</span>
                              {img.uploader && (
                                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                                  {img.uploader}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <ImageOff className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-600 font-bold">هیچ تصویر یا مستندی از صحنه تصادف توسط ثبت‌کننده بارگذاری نشده است.</p>
                        <p className="text-[11px] text-slate-400 mt-1">فقط فایل‌های واقعی ارسالی طرفین پرونده در این بخش نمایش داده می‌شوند.</p>
                      </div>
                    )}
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
                      <span>مدارک و اسناد بارگذاری‌شده توسط زیان‌دیده ({victimDocuments.length})</span>
                    </h4>

                    {victimDocuments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {victimDocuments.map((doc) => (
                          <div key={doc.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-2.5 space-y-2">
                            {doc.dataUrl ? (
                              <div className="relative h-36 rounded-xl overflow-hidden group bg-slate-200">
                                {doc.fileType === 'video' ? (
                                  <video src={doc.dataUrl} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={doc.dataUrl} alt={doc.title} className="w-full h-full object-cover" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(doc.dataUrl!)}
                                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                                >
                                  مشاهده تصویر
                                </button>
                              </div>
                            ) : (
                              <div className="h-36 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-3 text-center">
                                <FileText className="w-8 h-8 text-emerald-600 mb-1" />
                                <span className="text-[11px] font-bold text-slate-700">{doc.title}</span>
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="font-bold text-slate-800 text-[11px] truncate">
                                {doc.title}
                              </p>
                              {doc.note && (
                                <p className="text-[10px] text-slate-500 line-clamp-1">
                                  {doc.note}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                                <span>{doc.uploadedAt}</span>
                                <span>{doc.docType}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30">
                        <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs text-emerald-900 font-bold">تاکنون مدرک یا سندی توسط زیان‌دیده بارگذاری نشده است.</p>
                        <p className="text-[11px] text-emerald-700 mt-1">اطلاعات هویتی و خودرویی زیان‌دیده در جدول بالا قابل مشاهده است.</p>
                      </div>
                    )}
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
                      <span>مدارک و اسناد مقصر ({culpritDocuments.length})</span>
                    </h4>

                    {culpritDocuments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {culpritDocuments.map((doc) => (
                          <div key={doc.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-2.5 space-y-2">
                            {doc.dataUrl ? (
                              <div className="relative h-36 rounded-xl overflow-hidden group bg-slate-200">
                                {doc.fileType === 'video' ? (
                                  <video src={doc.dataUrl} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={doc.dataUrl} alt={doc.title} className="w-full h-full object-cover" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(doc.dataUrl!)}
                                  className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                                >
                                  مشاهده تصویر
                                </button>
                              </div>
                            ) : (
                              <div className="h-36 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-3 text-center">
                                <FileText className="w-8 h-8 text-amber-600 mb-1" />
                                <span className="text-[11px] font-bold text-slate-700">{doc.title}</span>
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="font-bold text-slate-800 text-[11px] truncate">
                                {doc.title}
                              </p>
                              {doc.note && (
                                <p className="text-[10px] text-slate-500 line-clamp-1">
                                  {doc.note}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
                                <span>{doc.uploadedAt}</span>
                                <span>{doc.docType}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/30">
                        <FileText className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                        <p className="text-xs text-amber-900 font-bold">تاکنون مدرک یا سندی توسط راننده مقصر بارگذاری نشده است.</p>
                        <p className="text-[11px] text-amber-700 mt-1">اطلاعات بیمه‌نامه و تعهدات مقصر در جدول بالا ثبت گردیده است.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: اطلاعات بیمه‌نامه و سقف تعهدات */}
              {activeModalTab === 'policy_info' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-purple-950 text-sm">اطلاعات بیمه‌نامه، استعلام سنهاب و سقف تعهدات مقصر</h4>
                        <p className="text-[11px] text-purple-800 font-medium">بیمه {getInsurerPersianName(claimCase.culpritInsurer)} — شماره: {claimCase.culpritPolicyNo || 'AL-1401-102'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => alert('استعلام آنلاین بیمه مرکزی (سنهاب) با موفقیت انجام شد و وضعیت بیمه‌نامه فعال تایید گردید.')}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-2xs self-start sm:self-auto transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>استعلام آنلاین مجدد</span>
                    </button>
                  </div>

                  {/* Basic Policy Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شماره بیمه‌نامه</span>
                      <span className="font-extrabold text-slate-900 font-mono text-xs">
                        {claimCase.culpritPolicyNo || 'AL-1401-102'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">شرکت بیمه صادرکننده</span>
                      <span className="font-extrabold text-purple-700 text-xs">
                        {getInsurerPersianName(claimCase.culpritInsurer)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">تاریخ انقضای بیمه‌نامه</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {claimCase.culpritPolicyExpiry || '1406/05/20'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">سقف تعهد مالی بیمه‌نامه</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {formatCurrency(claimCase.culpritCoverageFinancial || 50000000)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">سقف تعهد جانی (دیه)</span>
                      <span className="font-black text-slate-800 text-xs">
                        {formatCurrency(300000000)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 font-bold block">کد رهگیری سنهاب</span>
                      <span className="font-mono font-bold text-blue-900 text-xs">
                        {claimCase.policyInquirySanhab?.code || 'SNH-994821034-IR'}
                      </span>
                    </div>
                  </div>

                  {/* Financial & Debt Limit Analysis Card */}
                  {(() => {
                    const calc = calculateClaimDamageWithPolicyLimits(claimCase);
                    const hasAssessment = calc.directDamageAmount > 0;

                    if (!hasAssessment) {
                      return (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-dashed border-indigo-200 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Shield className="w-5 h-5 text-indigo-600" />
                              <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                                محاسبه هوشمند سقف تعهد، افت ارزش، فرانشیز و بدهی مقصر
                              </h5>
                            </div>
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-black text-[11px] flex items-center gap-1 self-start sm:self-auto">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              در انتظار ثبت و تایید ارزیابی خسارت
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                            <p className="text-slate-600 leading-relaxed">
                              این پرونده هم‌اکنون در وضعیت <strong className="text-indigo-950">«{claimCase.status}»</strong> قرار دارد. پس از ثبت ارزیابی خسارت توسط کارشناس ارزیاب و تایید بازبین، کلیه محاسبات تفکیکی قطعات، دستمزد، افت ارزش، فرانشیز قانونی و سقف تعهدات بیمه‌نامه در این بخش محاسبه و ابلاغ خواهد شد.
                            </p>
                            <div className="shrink-0 bg-indigo-50 border border-indigo-200 p-2 rounded-lg text-center">
                              <span className="text-[10px] text-indigo-700 font-bold block">سقف تعهد مالی بیمه‌نامه مقصر</span>
                              <span className="font-black text-indigo-950 text-xs font-mono">{formatCurrency(calc.policyMaxFinancialLimit)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-white p-4 rounded-2xl border-2 border-indigo-200 space-y-3.5 shadow-xs">
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
                            <span className="text-[10px] text-slate-500 font-bold block">خسارت کل (قطعه + اجرت):</span>
                            <strong className="text-slate-900 text-xs font-black">{formatCurrency(calc.directDamageAmount)}</strong>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">کسر ارزش داغی / اسقاط:</span>
                            <strong className="text-rose-700 text-xs font-black">
                              {calc.salvageDeduction > 0 ? `-${formatCurrency(calc.salvageDeduction)}` : '۰ ریال'}
                            </strong>
                          </div>

                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">
                              افت ارزش خودرو ({calc.diminutionPercent}%):
                            </span>
                            <strong className={`text-xs font-black ${calc.diminutionAmount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                              {calc.diminutionAmount > 0 ? `+${formatCurrency(calc.diminutionAmount)}` : '۰ ریال'}
                            </strong>
                          </div>

                          <div className="bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-200 space-y-0.5">
                            <span className="text-[10px] text-indigo-900 font-bold block">مجموع کل خسارت زیان‌دیده:</span>
                            <strong className="text-indigo-950 text-xs font-black">{formatCurrency(calc.totalClaimAmount)}</strong>
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



