import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  HelpCircle,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Car,
  AlertCircle,
  Layers,
  ArrowLeft,
  Search,
  RotateCcw,
  FileText,
  MapPin,
  User,
  Clock,
  ShieldAlert,
  FilePlus,
  Maximize2,
  Filter,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Flag,
  AlertTriangle,
  FolderOpen,
  Lock,
  Building2,
  MessageSquare,
  Users,
  ImageOff,
  Info,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Bell,
  Timer,
  Inbox,
  History,
  Eye,
  Copy,
  ExternalLink,
  BookOpen,
  FileSpreadsheet,
  Headphones,
  Mic,
  Film,
  Play,
  Pause,
  Paperclip,
  FileCheck,
  Image as ImageIcon
} from 'lucide-react';
import { ClaimCase, UserSession, PartItem, AIDecisionLine, AdditionalDocItem, CarDamageSpot, AssessorNotification } from '../../types';
import {
  formatCurrency,
  parseMoneyNumber,
  getInsurerPersianName,
  loadAssessorNotifications,
  saveAssessorNotifications,
  markAssessorNotificationAsRead,
  expireCaseManuallyForTesting,
  calculateAssessorSlaDetail,
  adjustCaseAssignmentTimeForTesting,
  requestCrmContactForCase
} from '../../lib/storage';
import { rialToPersianToman } from '../../lib/numberToPersianWords';
import { INITIAL_REVIEWERS } from '../../data/mockData';
import { Car3DViewer } from '../Car3DViewer';

interface AssessorPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updatedCase: ClaimCase) => void;
  onOpenCaseForm: (caseId: string) => void;
}

export const PART_OPTIONS = [
  'کاپوت',
  'سپر جلو',
  'سپر عقب',
  'گلگیر جلو راست',
  'گلگیر جلو چپ',
  'گلگیر عقب راست',
  'گلگیر عقب چپ',
  'درب جلو راست',
  'درب جلو چپ',
  'درب عقب راست',
  'درب عقب چپ',
  'درب صندوق',
  'چراغ جلو راست',
  'چراغ جلو چپ',
  'چراغ عقب',
  'رادیاتور',
  'شیشه جلو',
  'شیشه عقب',
  'آینه بغل',
  'رینگ',
  'لاستیک',
  'چرخ جلو',
  'سینی جلو',
  'سایر'
];

// Helper for Iranian License Plate widget
const IranianPlateWidget: React.FC<{ plateStr?: string }> = ({ plateStr }) => {
  const norm = (plateStr || '12-الف-456-ایران-45').replace(/[^0-9آ-ی]/g, '-');
  const parts = norm.split('-').filter(Boolean);
  const num1 = parts[0] || '12';
  const letter = parts[1] || 'الف';
  const num2 = parts[2] || '456';
  const cityCode = parts[4] || parts[3] || '56';

  return (
    <div className="inline-flex items-center border-2 border-slate-900 rounded-lg bg-white overflow-hidden shadow-xs text-slate-900 font-extrabold dir-ltr select-none">
      <div className="bg-blue-700 text-white px-1.5 py-1 flex flex-col items-center justify-center text-[8px] font-mono border-r border-slate-900">
        <span className="leading-none text-yellow-400 font-black">IR</span>
        <span className="text-[7px]">ایران</span>
      </div>
      <div className="px-2.5 py-1 flex items-center gap-1.5 text-xs font-black font-mono">
        <span>{num1}</span>
        <span className="text-purple-800 font-bold">{letter}</span>
        <span>{num2}</span>
      </div>
      <div className="bg-slate-100 border-r border-slate-900 px-2 py-1 text-[10px] font-black text-center min-w-[34px]">
        <span className="block text-[7px] text-slate-500 leading-none">ایران</span>
        <span>{cityCode.replace('ایران', '').trim()}</span>
      </div>
    </div>
  );
};

export const AssessorPanel: React.FC<AssessorPanelProps> = ({
  session,
  cases,
  onUpdateCase,
  onOpenCaseForm
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'parts' | 'money'>('parts');

  // Modals according to user images:
  // Image 2: "قبول ارزیابی پرونده"
  const [acceptModalCase, setAcceptModalCase] = useState<ClaimCase | null>(null);
  // Image 3: "بررسی اولیه پرونده"
  const [preliminaryCheckCase, setPreliminaryCheckCase] = useState<ClaimCase | null>(null);
  const [cardDetailModal, setCardDetailModal] = useState<'accident' | 'victim' | 'culprit' | null>(null);

  // Insurer Instructions / Notes Modal
  const [insurerNoteModalCase, setInsurerNoteModalCase] = useState<ClaimCase | null>(null);

  // Reject case modal (Bug 3)
  const [rejectModalCase, setRejectModalCase] = useState<ClaimCase | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');

  // Multi-Media & Image Preview Modal
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [previewMediaModal, setPreviewMediaModal] = useState<{
    url: string;
    name: string;
    type: 'image' | 'video' | 'audio' | 'kroki' | 'document' | string;
    category?: string;
    uploader?: string;
    date?: string;
    note?: string;
  } | null>(null);
  const [assessorMediaFilter, setAssessorMediaFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOC' | 'KROKI'>('ALL');

  // Police Inquiry State
  const [policeInquiryState, setPoliceInquiryState] = useState<{
    [caseId: string]: {
      queried: boolean;
      policeStation?: string;
      officer?: string;
      faultPercent?: number;
      krokiCode?: string;
      isChain?: boolean;
      details?: string;
      sketchUrl?: string;
      queriedAt?: string;
      queriedBy?: string;
    };
  }>({});

  // Helper to determine if a case is truly a reassessment (Bug 2)
  const isReassessmentCase = (c?: ClaimCase | null) => {
    if (!c) return false;
    const cAny = c as any;
    return !!(
      c.reassessType === 'REASSESSMENT' ||
      cAny.isObjected ||
      (cAny.objectionStage && cAny.objectionStage > 0) ||
      cAny.objectionReason ||
      c.status?.includes('اعتراض') ||
      c.status === 'ارزیابی مجدد'
    );
  };

  // SMS Notifications & 72h Inaction Warnings State
  const [showSmsInboxModal, setShowSmsInboxModal] = useState(false);
  const [assignmentSuccessModal, setAssignmentSuccessModal] = useState<{
    reviewerName: string;
    reviewerPhone?: string;
    caseId: string;
    payable: number;
  } | null>(null);
  const [smsNotifications, setSmsNotifications] = useState<AssessorNotification[]>(() => loadAssessorNotifications());

  // CRM Contact Request State
  const [showCrmRequestModal, setShowCrmRequestModal] = useState(false);
  const [crmRequestReasonType, setCrmRequestReasonType] = useState('MISSING_DOCS');
  const [crmRequestReasonText, setCrmRequestReasonText] = useState('نقص تصاویر و بارگذاری عکس واضح از قطعات');
  const [crmRequestPriority, setCrmRequestPriority] = useState<'عادی' | 'مهم' | 'فوری و بحرانی'>('مهم');
  const [crmRequestNotes, setCrmRequestNotes] = useState('');
  const [crmRequestSuccessMsg, setCrmRequestSuccessMsg] = useState<string | null>(null);

  // Sync Notifications from Storage & Window Events
  useEffect(() => {
    const handleSync = () => {
      setSmsNotifications(loadAssessorNotifications());
    };
    window.addEventListener('claimflow_notifications_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('claimflow_notifications_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const assessorSmsList = useMemo(() => {
    return smsNotifications.filter((n) => !n.expertId || n.expertId === session.id);
  }, [smsNotifications, session.id]);

  const unreadSmsCount = useMemo(() => {
    return assessorSmsList.filter((n) => !n.read).length;
  }, [assessorSmsList]);

  const handleMarkAllSmsAsRead = () => {
    const all = loadAssessorNotifications();
    const updated = all.map((n) => (!n.expertId || n.expertId === session.id ? { ...n, read: true } : n));
    saveAssessorNotifications(updated);
    setSmsNotifications(updated);
  };

  const handleMarkSingleSmsAsRead = (id: string) => {
    markAssessorNotificationAsRead(id);
    setSmsNotifications(loadAssessorNotifications());
  };

  const handleSubmitCrmContactRequest = () => {
    if (!activeCase) return;
    requestCrmContactForCase(
      activeCase.id,
      activeCase.victimName,
      activeCase.victimPhone,
      crmRequestReasonText,
      crmRequestReasonType,
      {
        name: session.name,
        role: session.roleTitle || 'کارشناس ارزیاب خسارت',
        phone: session.phone
      },
      crmRequestPriority,
      crmRequestNotes
    );

    const updatedHistory = [
      ...(activeCase.history || []),
      {
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        action: `درخواست تماس فوری امور مشتریان (CRM) توسط کارشناس ارزیاب (${session.name}): «${crmRequestReasonText}»`,
        actor: session.name,
        role: 'کارشناس ارزیاب'
      }
    ];

    onUpdateCase({
      ...activeCase,
      history: updatedHistory
    });

    setCrmRequestSuccessMsg(`درخواست تماس با مشتری با موفقیت به واحد امور مشتریان (CRM) ارسال و در کارت اقدامات معوق ثبت گردید.`);
    setShowCrmRequestModal(false);
    setCrmRequestNotes('');
    setTimeout(() => setCrmRequestSuccessMsg(null), 5000);
  };

  const handleSimulate72hExpiry = (c: ClaimCase) => {
    const result = expireCaseManuallyForTesting(c.id, cases);
    const updatedCase = result.updatedCases.find((x) => x.id === c.id);
    if (updatedCase) {
      onUpdateCase(updatedCase);
    }
    setSmsNotifications(loadAssessorNotifications());
    if (preliminaryCheckCase?.id === c.id) setPreliminaryCheckCase(null);
    if (acceptModalCase?.id === c.id) setAcceptModalCase(null);
    if (selectedCaseId === c.id) setSelectedCaseId(null);
    setShowSmsInboxModal(true);
  };

  // Helper to check if a case is rejected, timed out, or unaccepted after SMS/deadline
  const isCaseRejected = (c?: ClaimCase | null) => {
    if (!c) return false;
    const slaDetail = calculateAssessorSlaDetail(c);
    return (
      c.status === 'رد شده' ||
      c.status === 'رد شده از سمت کارشناس' ||
      c.status.includes('رد شده') ||
      c.autoReturnedDueToTimeout === true ||
      slaDetail.isExpired ||
      Boolean(c.rejectedByAssessorIds && c.rejectedByAssessorIds.includes(session.id))
    );
  };

  // Helper for "جدید و ارزیابی‌نشده / ثبت موقت" (قبل از 72 ساعت)
  const isCaseUnassessedOrDraft = (c: ClaimCase) => {
    if (isCaseRejected(c)) return false;
    // Exclude submitted/completed
    if (
      c.status === 'ارزیابی شده' ||
      c.status === 'در انتظار بررسی بازبین' ||
      c.status === 'در انتظار تایید کاربر' ||
      c.status === 'پرداخت شده' ||
      c.assessment?.status === 'SUBMITTED'
    ) {
      return false;
    }
    // Exclude active in-progress
    if (c.status === 'در حال ارزیابی') return false;
    // Exclude customer correction request
    if (c.status === 'نیازمند اصلاح اطلاعات مشتری') return false;
    // Includes: 'ثبت موقت', 'ثبت اولیه', 'محول شده به کارشناس', 'جدید', 'ارزیابی‌نشده', etc. before 72 hours
    return true;
  };

  // Helper for "در حال ارزیابی"
  const isCaseInProgress = (c: ClaimCase) => {
    if (isCaseRejected(c)) return false;
    return c.status === 'در حال ارزیابی';
  };

  // Helper for "ارزیابی‌شده و ارسالی"
  const isCaseEvaluated = (c: ClaimCase) => {
    if (isCaseRejected(c)) return false;
    return (
      c.status === 'ارزیابی شده' ||
      c.status === 'در انتظار بررسی بازبین' ||
      c.status === 'در انتظار تایید کاربر' ||
      c.status === 'پرداخت شده' ||
      c.assessment?.status === 'SUBMITTED'
    );
  };

  // Helper for "نیازمند اصلاح مشتری"
  const isCaseCorrection = (c: ClaimCase) => {
    if (isCaseRejected(c)) return false;
    return c.status === 'نیازمند اصلاح اطلاعات مشتری';
  };

  // Interactive Quick Filter Cards
  const [quickFilter, setQuickFilter] = useState<'all' | 'unassessed' | 'inprogress' | 'evaluated' | 'correction' | 'rejected'>('all');

  // Search Bar State
  const [searchAny, setSearchAny] = useState('');
  const [searchProvince, setSearchProvince] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');

  // AI "Why?" Modal
  const [whyFinding, setWhyFinding] = useState<AIDecisionLine | null>(null);

  // AI Edit Item Modal
  const [editingAiFinding, setEditingAiFinding] = useState<AIDecisionLine | null>(null);

  // Request Document Modal State
  const [showDocRequestModal, setShowDocRequestModal] = useState(false);
  const [docRequestTarget, setDocRequestTarget] = useState<'زیان‌دیده' | 'مقصر'>('زیان‌دیده');
  const [docRequestType, setDocRequestType] = useState('عکس از چراغ خودرو');
  const [customDocType, setCustomDocType] = useState('');
  const [docRequestDesc, setDocRequestDesc] = useState('');

  // Expert Chat & Party Management State
  const [expertChatActiveTab, setExpertChatActiveTab] = useState<'PARTY_ONE' | 'PARTY_TWO'>('PARTY_ONE');
  const [expertChatInput, setExpertChatInput] = useState('');
  const [isDocRequestsOpen, setIsDocRequestsOpen] = useState(false);
  const [isQuickDocMenuOpen, setIsQuickDocMenuOpen] = useState(false);

  // Previous Assessment Viewer (For reassigned / objected cases)
  const [selectedPrevAssessmentModal, setSelectedPrevAssessmentModal] = useState<any | null>(null);
  const [isPrevAssessmentsCardExpanded, setIsPrevAssessmentsCardExpanded] = useState<boolean>(false);

  // Correction Request Reason
  const [correctionReason, setCorrectionReason] = useState('');

  // Parts List State for current editing case
  const [parts, setParts] = useState<PartItem[]>([
    { name: 'سپر جلو', type: 'repair', partPrice: 0, repairPrice: 8500000, salvageNeeded: false, salvageValue: 0 },
    { name: 'درب جلو چپ', type: 'repair', partPrice: 0, repairPrice: 10000000, salvageNeeded: false, salvageValue: 0 }
  ]);

  const [grossInput, setGrossInput] = useState('18500000');
  const [deductionsInput, setDeductionsInput] = useState('1500000');
  const [salvageInput, setSalvageInput] = useState('0');
  const [noteInput, setNoteInput] = useState('خسارت شامل رنگ‌آمیزی سپر جلو و صافکاری جزئی درب چپ جلو است.');

  // Car Damage Spots State (for 2D Blueprint / 3D model)
  const [carDamageSpotsState, setCarDamageSpotsState] = useState<Record<string, CarDamageSpot>>({
    front_bumper: {
      type: 'شکستگی و خراشیدگی',
      severity: 'minor',
      operation: 'صافکاری و نقاشی',
      color: 'yellow',
      note: 'سپر جلو از سمت راست دچار خط و خش عمیق و شکستگی موضعی دیاق است.'
    },
    door_fl: {
      type: 'دفرمگی شدید کلاف',
      severity: 'major',
      operation: 'تعویض کامل قطعه',
      color: 'red',
      note: 'درب جلو چپ دچار له‌شدگی شدید شده و غیرقابل ترمیم است.'
    }
  });

  const companyCode = session.company || 'dana';

  // Filter cases assigned to current expert, rejected/timed-out cases, or unassigned for current insurer
  const assignedCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesCompany =
        c.culpritInsurer === companyCode ||
        c.victimInsurer === companyCode ||
        getInsurerPersianName(c.culpritInsurer) === getInsurerPersianName(companyCode);

      const isMyAssigned = c.assignedExpert?.id === session.id;
      const isMyRejectedOrTimedOut =
        c.timedOutExpert?.id === session.id ||
        c.previousAssignedExpert?.id === session.id ||
        Boolean(c.rejectedByAssessorIds && c.rejectedByAssessorIds.includes(session.id));

      const isUnassignedInCompany = !c.assignedExpert && matchesCompany;

      return isMyAssigned || isMyRejectedOrTimedOut || isUnassignedInCompany;
    });
  }, [cases, session.id, companyCode]);

  // SLA Calculation helper
  const getSlaInfo = (c: ClaimCase) => {
    if (isCaseRejected(c)) {
      return { cls: 'bg-rose-700 shadow-rose-700/30', rank: 5, label: 'رد شده (سلب صلاحیت / ارسال پیامک)' };
    }
    const detail = calculateAssessorSlaDetail(c);
    if (detail.isExpired) {
      return { cls: 'bg-rose-600 shadow-rose-600/30 animate-pulse', rank: 4, label: 'مهلت ۷۲ ساعته منقضی شد (سلب صلاحیت)' };
    }
    if (detail.isNearDeadline) {
      return { cls: 'bg-rose-500 shadow-rose-500/20', rank: 3, label: `کمتر از ۲۴ ساعت مانده (${detail.remainingText})` };
    }
    if (detail.totalElapsedMinutes >= 24 * 60) {
      return { cls: 'bg-amber-500 shadow-amber-500/20', rank: 2, label: `در حال سپری شدن (${detail.remainingText})` };
    }
    return { cls: 'bg-emerald-500 shadow-emerald-500/20', rank: 1, label: `فرصت کافی (${detail.remainingText})` };
  };

  // Filtered cases based on search and quick cards
  const filteredCases = useMemo(() => {
    return assignedCases.filter((c) => {
      const rejected = isCaseRejected(c);

      // 1. Quick Card Filter
      if (quickFilter === 'rejected') {
        if (!isCaseRejected(c)) return false;
      } else if (quickFilter === 'unassessed') {
        if (!isCaseUnassessedOrDraft(c)) return false;
      } else if (quickFilter === 'inprogress') {
        if (!isCaseInProgress(c)) return false;
      } else if (quickFilter === 'evaluated') {
        if (!isCaseEvaluated(c)) return false;
      } else if (quickFilter === 'correction') {
        if (!isCaseCorrection(c)) return false;
      }

      // 2. Search Inputs
      const norm = (s?: string) => (s || '').toLowerCase().trim();
      if (searchAny) {
        const query = norm(searchAny);
        const matchBlob = norm(`${c.id} ${c.victimName} ${c.culpritName} ${c.victimPlate} ${c.culpritPlate} ${c.address}`);
        if (!matchBlob.includes(query)) return false;
      }
      if (searchProvince && !norm(c.address).includes(norm(searchProvince))) return false;
      if (searchCity && !norm(c.address).includes(norm(searchCity))) return false;
      if (searchType) {
        const isReassessment = c.reassessType || c.status.includes('مجدد') || (c.history && c.history.some(h => h.note.includes('رد')));
        if (searchType.includes('مجدد') && !isReassessment) return false;
        if (searchType.includes('اولیه') && isReassessment) return false;
      }
      if (searchStatus && !norm(c.status).includes(norm(searchStatus))) return false;

      return true;
    });
  }, [assignedCases, quickFilter, searchAny, searchProvince, searchCity, searchType, searchStatus]);

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  // Previous Assessments List (For reassigned / objected cases to view previous expert findings)
  const previousAssessmentsList = useMemo(() => {
    if (!activeCase) return [];
    const list: any[] = [];
    if (activeCase.assessments && activeCase.assessments.length > 0) {
      activeCase.assessments.forEach((a, idx) => {
        list.push({
          id: `prev-assess-${idx}`,
          round: a.round || `ارزیابی نوبت ${idx + 1}`,
          roundIdx: a.roundIdx || idx + 1,
          expertName: a.expertName || activeCase.previousAssignedExpert?.name || 'کارشناس ارزیاب اول',
          submittedAt: a.submittedAt || activeCase.assignedAt || 'ثبت شده',
          gross: a.gross || 0,
          deductions: a.deductions || 0,
          salvage: a.salvage || 0,
          payable: a.payable || 0,
          reviewerNote: a.reviewerNote || '',
          parts: a.parts || [],
          aiDecisions: a.aiDecisions || [],
          status: a.status || 'ارزیابی شده',
          isPrevious: true
        });
      });
    } else if (activeCase.previousAssignedExpert || activeCase.objectionStage || activeCase.reassessReason || activeCase.reassessType || activeCase.status.includes('مجدد')) {
      if (activeCase.assessment) {
        list.push({
          id: 'prev-assess-single',
          round: 'ارزیابی کارشناس اول (مورد اعتراض زیان‌دیده)',
          roundIdx: 1,
          expertName: activeCase.previousAssignedExpert?.name || activeCase.assessment.submittedBy || 'کارشناس ارزیاب اول',
          submittedAt: activeCase.assessment.submittedAt || activeCase.assignedAt || 'ثبت اولیه',
          gross: activeCase.assessment.gross || 0,
          deductions: activeCase.assessment.deductions || 0,
          salvage: activeCase.assessment.salvage || 0,
          payable: activeCase.assessment.payable || 0,
          reviewerNote: activeCase.assessment.reviewerNote || '',
          parts: activeCase.assessment.parts || [],
          aiDecisions: activeCase.aiDecisions || [],
          status: 'مورد اعتراض زیان‌دیده',
          isPrevious: true
        });
      }
    }
    return list;
  }, [activeCase]);

  const handleCopyPrevAssessmentToCurrent = (prevItem: any) => {
    if (prevItem.parts && prevItem.parts.length > 0) {
      setParts(JSON.parse(JSON.stringify(prevItem.parts)));
      setGrossInput(String(prevItem.gross || 0));
      setDeductionsInput(String(prevItem.deductions || 0));
      setSalvageInput(String(prevItem.salvage || 0));
      if (prevItem.reviewerNote) {
        setNoteInput(`[بر مبنای بازبینی ارزیابی کارشناس قبل (${prevItem.expertName})]: ` + prevItem.reviewerNote);
      }
      alert('کلیه اقلام قطعات و برآوردهای کارشناس قبلی با موفقیت به پیش‌نویس ارزیابی شما منتقل شد. اکنون می‌توانید تغییرات مورد نظرتان را اعمال فرمایید.');
    } else {
      alert('اقلام قطعه‌ای برای کپی یافت نشد.');
    }
  };

  // Default AI Findings
  const defaultAiFindings: AIDecisionLine[] = useMemo(() => {
    if (!activeCase) return [];
    if (activeCase.aiDecisions && activeCase.aiDecisions.length > 0) return activeCase.aiDecisions;
    return [
      {
        findingId: 'front_bumper',
        label: 'سپر جلو',
        part: 'سپر جلو',
        type: 'خراش و سایش رنگ',
        severity: '۲ از ۵',
        operation: 'رنگ‌آمیزی',
        confidence: 'بالا',
        explanation: 'ناحیه آسیب در کادربندی زوایای جلو و کلوزآپ تطبیق داده شده است.'
      },
      {
        findingId: 'left_front_door',
        label: 'درب جلو چپ',
        part: 'درب جلو چپ',
        type: 'فرورفتگی بدنه',
        severity: '۳ از ۵',
        operation: 'صافکاری و نقاشی',
        confidence: 'متوسط',
        explanation: 'الگوی فرورفتگی با برخورد جانبی سازگار بوده اما انحنای لولا نیازمند بازبینی کارشناس است.'
      }
    ];
  }, [activeCase]);

  const [aiDecisionsState, setAiDecisionsState] = useState<AIDecisionLine[]>(defaultAiFindings);
  const [assessorChatMsg, setAssessorChatMsg] = useState('');

  const handleSendAssessorChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessorChatMsg.trim() || !activeCase) return;
    if (isCaseRejected(activeCase)) {
      alert('این پرونده در وضعیت «رد شده» قرار دارد و ارسال پیام یا ایجاد تغییر در آن مسدود است.');
      return;
    }

    const newMsg = {
      sender: 'expert' as const,
      name: session.name || activeCase.assignedExpert?.name || 'کارشناس ارزیاب',
      text: assessorChatMsg.trim(),
      time: new Date().toLocaleString('fa-IR')
    };

    const updatedChat = [...(activeCase.objectionChat || []), newMsg];

    const updatedCase: ClaimCase = {
      ...activeCase,
      objectionChat: updatedChat,
      history: [
        ...(activeCase.history || []),
        {
          status: activeCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس ارزیاب',
          note: `پاسخ ارزیاب در چت پرونده: «${assessorChatMsg.trim()}»`
        }
      ]
    };

    onUpdateCase(updatedCase);
    setAssessorChatMsg('');
  };

  // Synchronize AI decisions state when activeCase changes
  React.useEffect(() => {
    if (activeCase) {
      setAiDecisionsState(activeCase.aiDecisions && activeCase.aiDecisions.length > 0 ? activeCase.aiDecisions : defaultAiFindings);
      if (activeCase.assessment?.parts && activeCase.assessment.parts.length > 0) {
        setParts(activeCase.assessment.parts);
      }
      if (activeCase.assessment?.gross) {
        setGrossInput(String(activeCase.assessment.gross));
      }
      if (activeCase.assessment?.deductions) {
        setDeductionsInput(String(activeCase.assessment.deductions));
      }
      if (activeCase.assessment?.salvage) {
        setSalvageInput(String(activeCase.assessment.salvage));
      }
      if (activeCase.assessment?.reviewerNote) {
        setNoteInput(activeCase.assessment.reviewerNote);
      }
      if (activeCase.carDamageSpots && Object.keys(activeCase.carDamageSpots).length > 0) {
        setCarDamageSpotsState(activeCase.carDamageSpots);
      } else {
        setCarDamageSpotsState({
          front_bumper: {
            type: 'شکستگی و خراشیدگی',
            severity: 'minor',
            operation: 'صافکاری و نقاشی',
            color: 'yellow',
            note: 'سپر جلو از سمت راست دچار خط و خش عمیق و شکستگی موضعی دیاق است.'
          },
          door_fl: {
            type: 'دفرمگی شدید کلاف',
            severity: 'major',
            operation: 'تعویض کامل قطعه',
            color: 'red',
            note: 'درب جلو چپ دچار له‌شدگی شدید شده و غیرقابل ترمیم است.'
          }
        });
      }
    }
  }, [selectedCaseId]);

  const handleDecideAiLine = (findingId: string, decision: 'APPROVED' | 'EDITED' | 'REJECTED') => {
    if (isCaseRejected(activeCase)) {
      alert('این پرونده در وضعیت «رد شده» قرار دارد و تغییر تصمیم هوش مصنوعی مسدود است.');
      return;
    }
    setAiDecisionsState((prev) =>
      prev.map((item) => (item.findingId === findingId ? { ...item, decision } : item))
    );
  };

  const handleAutoAddPartFromBlueprint = (partName: string, operationType: 'replace' | 'repair', note?: string) => {
    if (isCaseRejected(activeCase)) return;
    setParts((prev) => {
      // Check if part already exists
      const existingIdx = prev.findIndex((p) => p.name.trim() === partName.trim());
      if (existingIdx >= 0) {
        // update type if changed
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          type: operationType
        };
        return copy;
      }
      // Add new part with 0 prices so assessor just fills in the price
      return [
        ...prev,
        {
          name: partName,
          type: operationType,
          partPrice: 0,
          repairPrice: 0,
          salvageNeeded: false,
          salvageValue: 0
        }
      ];
    });
  };

  const handleAddPart = () => {
    if (isCaseRejected(activeCase)) return;
    setParts((prev) => [
      ...prev,
      { name: 'گلگیر جلو راست', type: 'replace', partPrice: 0, repairPrice: 0, salvageNeeded: false, salvageValue: 0 }
    ]);
  };

  const handleRemovePart = (index: number) => {
    if (isCaseRejected(activeCase)) return;
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePart = (index: number, field: keyof PartItem, val: any) => {
    if (isCaseRejected(activeCase)) return;
    setParts((prev) => {
      const copy = [...prev];
      if (field === 'type') {
        if (val === 'repair') {
          copy[index] = {
            ...copy[index],
            type: 'repair',
            partPrice: 0,
            salvageNeeded: false,
            salvageValue: 0
          };
        } else {
          copy[index] = {
            ...copy[index],
            type: 'replace',
            repairPrice: 0
          };
        }
      } else if (field === 'salvageNeeded') {
        copy[index] = {
          ...copy[index],
          salvageNeeded: val,
          salvageValue: val ? copy[index].salvageValue : 0
        };
      } else {
        copy[index] = { ...copy[index], [field]: val };
      }
      return copy;
    });
  };

  const computePartsTotal = () => {
    return parts.reduce((sum, p) => {
      if (p.type === 'repair') {
        return sum + parseMoneyNumber(p.repairPrice);
      }
      const partCost = parseMoneyNumber(p.partPrice);
      const repairCost = parseMoneyNumber(p.repairPrice);
      const salvage = p.salvageNeeded ? parseMoneyNumber(p.salvageValue) : 0;
      return sum + Math.max(0, partCost + repairCost - salvage);
    }, 0);
  };

  const handleSaveDraft = () => {
    if (!activeCase) return;
    if (isCaseRejected(activeCase)) {
      alert('این پرونده در وضعیت «رد شده (سلب صلاحیت)» قرار دارد و امکان ذخیره پیش‌نویس وجود ندارد.');
      return;
    }
    const gross = parseMoneyNumber(grossInput) || computePartsTotal();
    const salvage = parseMoneyNumber(salvageInput);
    const deductions = activeCase.assessment?.deductions || 0;
    const payable = Math.max(0, gross - salvage - deductions);

    const updated: ClaimCase = {
      ...activeCase,
      status: 'ثبت موقت',
      aiDecisions: aiDecisionsState,
      carDamageSpots: carDamageSpotsState,
      assessment: {
        ...(activeCase.assessment || { version: 'A-1.0', gross: 0, deductions: 0, salvage: 0, payable: 0, status: 'DRAFT' }),
        gross,
        deductions,
        salvage,
        payable,
        status: 'DRAFT',
        draftSavedAt: new Date().toISOString(),
        reviewerNote: noteInput,
        parts
      },
      history: [
        ...(activeCase.history || []),
        {
          status: 'ثبت موقت',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: 'ذخیره پیش‌نویس موقت ارزیابی خسارت'
        }
      ]
    };

    onUpdateCase(updated);
    alert('پیش‌نویس ارزیابی با موفقیت ذخیره شد.');
  };

  const handleFinalizeAssessment = () => {
    if (!activeCase) return;
    if (isCaseRejected(activeCase)) {
      alert('این پرونده در وضعیت «رد شده (سلب صلاحیت)» قرار دارد و امکان ثبت یا ارسال ارزیابی وجود ندارد.');
      return;
    }

    const partsTotal = computePartsTotal();
    const gross = parseMoneyNumber(grossInput) || partsTotal;
    const salvage = parseMoneyNumber(salvageInput);
    const deductions = activeCase.assessment?.deductions || 0;
    const payable = Math.max(0, gross - salvage - deductions);

    const currentStage = activeCase.objectionStage || 0;
    const currentRoundLabel = currentStage === 0
      ? 'ارزیابی اولیه'
      : currentStage === 1
      ? 'ارزیابی ثانویه'
      : currentStage === 2 || currentStage === 3
      ? 'ارزیابی مرحله ۳ (تعمیرگاهی)'
      : 'ارزیابی نهایی کارشناس میدانی';

    const versionStr = `A-${currentStage + 1}.0`;

    const newAssessmentEntry = {
      round: currentRoundLabel,
      roundIdx: currentStage + 1,
      expertName: session.name || activeCase.assignedExpert?.name || 'کارشناس خسارت',
      submittedAt: new Date().toLocaleString('fa-IR'),
      gross,
      deductions,
      salvage,
      payable,
      reviewerNote: noteInput,
      parts,
      aiDecisions: aiDecisionsState,
      status: 'در انتظار بررسی بازبین',
      approvedByReviewer: false
    };

    const existingAssessments = activeCase.assessments || [];
    const updatedAssessments = [...existingAssessments, newAssessmentEntry];

    // Determine auto-assigned reviewer for this company
    const compKey = (session.company || activeCase.culpritInsurer || 'dana').toLowerCase();
    const reviewerList = INITIAL_REVIEWERS[compKey] || INITIAL_REVIEWERS['dana'] || [];
    const autoReviewer = activeCase.assignedReviewer || {
      id: reviewerList[0]?.id || 'rvd1',
      name: reviewerList[0]?.name || 'حسین موحدی (بازبین ارشد کیفی)',
      role: reviewerList[0]?.role || 'بازبین ارشد کنترل کیفیت',
      company: compKey
    };

    const sysNoticeMsg = {
      id: `MSG-${Date.now()}`,
      from: 'system' as const,
      senderParty: 'SYSTEM' as const,
      by: 'سیستم ارجاع خودکار',
      text: `اطلاعیه سیستم: پرونده جهت بررسی نهایی و تایید به بازبین کیفی (${autoReviewer.name}) ارجاع داده شد.`,
      at: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated: ClaimCase = {
      ...activeCase,
      status: 'در انتظار بررسی بازبین',
      assignedReviewer: autoReviewer,
      reviewerReturn: undefined, // Clear return reason on re-submission
      aiDecisions: aiDecisionsState,
      carDamageSpots: carDamageSpotsState,
      docChat: [...(activeCase.docChat || []), sysNoticeMsg],
      assignedExpert: activeCase.assignedExpert || {
        id: session.id,
        name: session.name || 'کارشناس خسارت',
        role: session.roleTitle || 'کارشناس خسارت'
      },
      assessment: {
        version: versionStr,
        gross,
        deductions,
        salvage,
        payable,
        status: 'SUBMITTED',
        submittedBy: session.name || 'کارشناس خسارت',
        submittedAt: new Date().toLocaleString('fa-IR'),
        reviewerNote: noteInput,
        parts
      },
      assessments: updatedAssessments,
      history: [
        ...(activeCase.history || []),
        {
          status: 'در انتظار بررسی بازبین',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: `ثبت نهایی برآورد خسارت توسط کارشناس (${currentRoundLabel}) — ارجاع خودکار به بازبین کیفی (${autoReviewer.name}). (مبلغ: ${formatCurrency(payable)})`
        }
      ]
    };

    onUpdateCase(updated);
    setSelectedCaseId(null);
    setAssignmentSuccessModal({
      reviewerName: autoReviewer.name,
      reviewerPhone: autoReviewer.phone || '۰۹۱۲۲۱۴۵۶۷۸',
      caseId: activeCase.id,
      payable
    });
  };

  const handleRequestCorrection = () => {
    if (!activeCase || !correctionReason.trim()) return;
    if (isCaseRejected(activeCase)) {
      alert('این پرونده در وضعیت «رد شده (سلب صلاحیت)» قرار دارد و امکان درخواست اصلاح اطلاعات وجود ندارد.');
      return;
    }

    const updated: ClaimCase = {
      ...activeCase,
      status: 'نیازمند اصلاح اطلاعات مشتری',
      correctionRequest: {
        reason: correctionReason,
        requestedAt: new Date().toISOString(),
        requestedBy: session.name || 'کارشناس خسارت'
      },
      history: [
        ...(activeCase.history || []),
        {
          status: 'نیازمند اصلاح اطلاعات مشتری',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: `ارجاع پرونده به مشتری برای اصلاح اطلاعات: ${correctionReason}`
        }
      ]
    };

    onUpdateCase(updated);
    setCorrectionReason('');
    alert('درخواست اصلاح اطلاعات با موفقیت برای مشتری ارسال گردید.');
  };

  const handleSendDocRequest = () => {
    if (!activeCase || !docRequestType) return;
    if (isCaseRejected(activeCase)) {
      alert('این پرونده در وضعیت «رد شده (سلب صلاحیت)» قرار دارد و ارسال درخواست مدارک مسدود است.');
      return;
    }

    const finalDocType = docRequestType === 'سایر مدارک' ? (customDocType.trim() || 'سایر مدارک') : docRequestType;
    const recipientParty: 'PARTY_ONE' | 'PARTY_TWO' = docRequestTarget === 'زیان‌دیده' ? 'PARTY_ONE' : 'PARTY_TWO';
    const recipientRoleStr = docRequestTarget === 'زیان‌دیده'
      ? (activeCase.partyOneRole || 'زیان‌دیده')
      : (activeCase.partyTwoRole || 'مقصر');

    const newDocReq = {
      id: `REQ-${Date.now()}`,
      target: docRequestTarget,
      recipientParty: recipientParty,
      recipientRole: recipientRoleStr,
      docType: finalDocType,
      customDocType: docRequestType === 'سایر مدارک' ? customDocType.trim() : undefined,
      description: docRequestDesc.trim(),
      requestedAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      requestedBy: session.name || 'کارشناس خسارت',
      status: 'در انتظار پاسخ' as const
    };

    const newChatMsg = {
      id: `MSG-${Date.now()}`,
      from: 'expert' as const,
      senderParty: 'EXPERT' as const,
      targetParty: recipientParty,
      by: session.name || 'کارشناس خسارت',
      target: docRequestTarget,
      docType: finalDocType,
      text: `[درخواست مدرک: ${finalDocType}] ${docRequestDesc.trim()}`,
      at: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated: ClaimCase = {
      ...activeCase,
      status: 'درخواست مدارک',
      docRequests: [...(activeCase.docRequests || []), newDocReq],
      docChat: [...(activeCase.docChat || []), newChatMsg],
      history: [
        ...(activeCase.history || []),
        {
          status: 'درخواست مدارک',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: `ثبت درخواست مدرک تکمیلی «${finalDocType}» از ${docRequestTarget} (${recipientRoleStr})`
        }
      ]
    };

    onUpdateCase(updated);
    setShowDocRequestModal(false);
    setDocRequestDesc('');
    setCustomDocType('');
    alert(`درخواست مدرک تکمیلی «${finalDocType}» برای ${docRequestTarget} ارسال گردید.`);
  };

  const handleUpdateDocReqStatus = (reqId: string | number, newStatus: string) => {
    if (!activeCase || isCaseRejected(activeCase)) return;
    const updatedRequests = (activeCase.docRequests || []).map(req => {
      if (req.id === reqId) {
        return { ...req, status: newStatus };
      }
      return req;
    });

    const updatedCase: ClaimCase = {
      ...activeCase,
      docRequests: updatedRequests,
      history: [
        ...(activeCase.history || []),
        {
          status: activeCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: `تغییر وضعیت درخواست مدرک به «${newStatus}»`
        }
      ]
    };

    onUpdateCase(updatedCase);
  };

  const handleSendExpertChatMessage = (recipientParty: 'PARTY_ONE' | 'PARTY_TWO') => {
    if (!activeCase || !expertChatInput.trim()) return;
    if (isCaseRejected(activeCase)) {
      alert('این پرونده در وضعیت «رد شده (سلب صلاحیت)» قرار دارد و ارسال پیام مسدود است.');
      return;
    }

    const targetLabel = recipientParty === 'PARTY_ONE' ? (activeCase.partyOneRole || 'زیان‌دیده') : (activeCase.partyTwoRole || 'مقصر');

    const newMsg = {
      id: `MSG-${Date.now()}`,
      from: 'expert' as const,
      senderParty: 'EXPERT' as const,
      targetParty: recipientParty,
      by: session.name || 'کارشناس خسارت',
      target: targetLabel,
      text: expertChatInput.trim(),
      at: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedCase: ClaimCase = {
      ...activeCase,
      docChat: [...(activeCase.docChat || []), newMsg],
      history: [
        ...(activeCase.history || []),
        {
          status: activeCase.status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: `ارسال پیام مستقیم کارشناس به ${targetLabel}`
        }
      ]
    };

    onUpdateCase(updatedCase);
    setExpertChatInput('');
  };

  // Handler for Accept Later ("بعداً ارزیابی می‌کنم")
  const handleAcceptLater = (c: ClaimCase) => {
    const updated: ClaimCase = {
      ...c,
      status: 'در حال ارزیابی',
      assignedExpert: {
        id: session.id,
        name: session.name || 'رضا تهرانی',
        role: session.roleTitle || 'ارزیاب ارشد'
      },
      acceptedByExpertAt: new Date().toISOString(),
      history: [
        ...(c.history || []),
        {
          status: 'در حال ارزیابی',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: 'پرونده توسط کارشناس پذیرفته شد و در لیست پرونده‌های در حال ارزیابی قرار گرفت.'
        }
      ]
    };
    onUpdateCase(updated);
    setAcceptModalCase(null);
    alert('پرونده با موفقیت پذیرفته شد و وضعیت آن به «در حال ارزیابی» تغییر یافت.');
  };

  // Handler for Rejecting Assignment (Red Cross ✕ button opens modal)
  const handleRejectAssignment = (c: ClaimCase) => {
    setRejectModalCase(c);
    setRejectReasonInput('');
  };

  // Confirm rejection with reason (Bug 3)
  const handleConfirmRejectCase = () => {
    if (!rejectModalCase) return;
    const reasonText = rejectReasonInput.trim() || 'عدم امکان انجام ارزیابی توسط کارشناس';

    const updated: ClaimCase = {
      ...rejectModalCase,
      status: 'رد شده',
      assignedExpert: undefined,
      rejectedByAssessorIds: [...(rejectModalCase.rejectedByAssessorIds || []), session.id],
      expertRejected: {
        by: session.name || 'کارشناس ارزیاب',
        at: new Date().toISOString(),
        reason: reasonText
      },
      history: [
        ...(rejectModalCase.history || []),
        {
          status: 'رد شده',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس ارزیاب',
          note: `پرونده توسط کارشناس (${session.name}) نپذیرفته و رد شد. علت: ${reasonText}`
        }
      ]
    };

    onUpdateCase(updated);
    if (preliminaryCheckCase && preliminaryCheckCase.id === rejectModalCase.id) {
      setPreliminaryCheckCase(null);
    }
    if (selectedCaseId === rejectModalCase.id) {
      setSelectedCaseId(null);
    }
    setRejectModalCase(null);
    setRejectReasonInput('');
    alert(`پرونده ${updated.id} با وضعیت «رد شده» ثبت شد و از پنل شما حذف گردید. شرکت بیمه می‌تواند آن را به کارشناس دیگری محول نماید.`);
  };

  // Handler for Police Inquiry in Image 3 (Second Police Inquiry in Adjuster Workflow)
  const handlePoliceInquiry = (c: ClaimCase) => {
    const cAny = c as any;
    const croquiAny = c.croquiData as any;
    const policeAny = c.policeReport as any;

    const kroki = c.sceneReportCode || c.policeReport?.code || croquiAny?.trackingCode || croquiAny?.reportNumber || 'KR-770303';
    const station = c.policeReport?.unit || policeAny?.station || croquiAny?.policeStation || 'کلانتری ۱۲ شهر تهران (ناحیه ۴)';
    const officer = c.policeReport?.officerName || policeAny?.officer || croquiAny?.officerName || 'سروان حسینی (کد: ۹۹۸۸)';
    const faultPercent = c.culpritFaultPercent ?? croquiAny?.faultPercent ?? policeAny?.faultPercent ?? 100;
    const details = c.policeReport?.description || croquiAny?.rawEvaluationJSON?.policeDetails || 'گزارش رسمی پلیس راهور: برخورد مستقیم از عقب با زاویه ۳۰ درجه، درصد تقصیر مقصر ۱۰۰٪ تایید شد.';
    const sketchUrl = c.croquiData?.fileUrl || policeAny?.sketchUrl || (typeof c.files?.[0] === 'string' ? c.files[0] : (c.files?.[0] as any)?.dataUrl);

    const resultData = {
      queried: true,
      policeStation: station,
      officer: officer,
      faultPercent: faultPercent,
      krokiCode: kroki,
      isChain: cAny.isChainAccident || cAny.isChainCollision || false,
      details: details,
      sketchUrl: sketchUrl,
      queriedAt: new Date().toLocaleString('fa-IR'),
      queriedBy: session.name || 'کارشناس ارزیاب'
    };

    setPoliceInquiryState((prev) => ({
      ...prev,
      [c.id]: resultData
    }));

    const updated: ClaimCase = {
      ...c,
      policeInquiryResult: resultData,
      policeReport: c.policeReport || {
        code: kroki,
        unit: station,
        officerName: officer,
        officerCode: '9988',
        submittedAt: new Date().toLocaleDateString('fa-IR'),
        noFaultDetermined: false,
        description: details
      },
      history: [
        ...(c.history || []),
        {
          status: c.status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس ارزیاب',
          note: `استعلام مجدد کروکی و گزارش انتظامی از سامانه پلیس راهور (کد کروکی: ${kroki}، افسر: ${officer}، درصد تقصیر مقصر: ${faultPercent}٪)`
        }
      ]
    } as any;

    onUpdateCase(updated);
    if (preliminaryCheckCase && preliminaryCheckCase.id === c.id) {
      setPreliminaryCheckCase(updated);
    }

    alert(`استعلام رسمی از سامانه پلیس/نیروی انتظامی با موفقیت انجام شد.\nکد کروکی: ${kroki}\nمرکز انتظامی: ${station}\nافسر: ${officer}\nدرصد تقصیر مقصر: ${faultPercent}٪`);
  };

  // Handler for Chain Collision simulation in Image 3
  const handleSimulateChainCollision = (c: ClaimCase) => {
    const resultData = {
      queried: true,
      policeStation: 'پلیس راهور فراجا - مرکز کنترل',
      officer: 'سرهنگ محمدی',
      faultPercent: 50,
      krokiCode: 'CHAIN-99011',
      isChain: true,
      details: 'تصادف زنجیره‌ای ۳ خودرویی ثبت گردید. خودروهای میانی و انتهایی در زنجیره تقصیر مشترک ۵۰٪ قرار دارند.',
      queriedAt: new Date().toLocaleString('fa-IR'),
      queriedBy: session.name || 'کارشناس ارزیاب'
    };

    setPoliceInquiryState((prev) => ({
      ...prev,
      [c.id]: resultData
    }));

    const updated: ClaimCase = {
      ...c,
      policeInquiryResult: resultData,
      history: [
        ...(c.history || []),
        {
          status: c.status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس ارزیاب',
          note: 'ثبت تصادف زنجیره‌ای با ۵۰٪ تقصیر مشترک در استعلام نیروی انتظامی.'
        }
      ]
    } as any;

    onUpdateCase(updated);
    if (preliminaryCheckCase && preliminaryCheckCase.id === c.id) {
      setPreliminaryCheckCase(updated);
    }

    alert('تصادف زنجیره‌ای با موفقیت شبیه‌سازی و جزییات سه خودرو در پرونده بروزرسانی گردید.');
  };

  // Handler for Fraud/Suspicion flag in Image 3
  const handleFlagFraud = (c: ClaimCase) => {
    const reason = prompt('لطفاً دلیل تردید در اصالت تصادف / احتمال تبانی را وارد نمایید:');
    if (!reason) return;
    const updated: ClaimCase = {
      ...c,
      status: 'تردید در اصالت تصادف',
      fraudFlag: {
        flagged: true,
        reason,
        by: session.name || 'کارشناس خسارت',
        flaggedAt: new Date().toISOString()
      },
      history: [
        ...(c.history || []),
        {
          status: 'تردید در اصالت تصادف',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'کارشناس خسارت',
          note: `ثبت تردید در اصالت تصادف: ${reason}`
        }
      ]
    };
    onUpdateCase(updated);
    setPreliminaryCheckCase(null);
    alert('گزارش تردید در اصالت تصادف ثبت شد و جهت بررسی تخصصی به شرکت بیمه ارسال گردید.');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-16">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex items-center justify-between flex-wrap gap-4 border border-purple-800/40">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-extrabold">
            <ClipboardCheck className="w-4 h-4 text-purple-400" />
            پنل اختصاصی کارشناسان خسارت و ارزیابان
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            ارزیابی هوشمند، مدلسازی سه‌بعدی و برآورد خسارت
          </h1>
          <p className="text-xs text-slate-300 font-medium">
            کارشناس محترم: {session.name} | شرکت: {getInsurerPersianName(companyCode)}
          </p>
        </div>

        {/* SMS / Notifications Inbox Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSmsInboxModal(true)}
            className="relative px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <Smartphone className="w-4 h-4 text-purple-300" />
            <span>صندوق پیامک و اخطارها</span>
            {unreadSmsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {unreadSmsCount} پیام جدید
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-slate-300 text-[10px] font-bold">
                {assessorSmsList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {!selectedCaseId ? (
        /* CASE LIST VIEW */
        <div className="space-y-6">
          
          {/* Modern Tab-Based Navigation for Case Statuses */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-2 sm:p-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                {
                  id: 'all' as const,
                  label: 'همه پرونده‌ها',
                  count: assignedCases.length,
                  icon: FolderOpen,
                  accentColor: 'purple'
                },
                {
                  id: 'unassessed' as const,
                  label: 'جدید و ارزیابی‌نشده (ثبت موقت)',
                  count: assignedCases.filter(isCaseUnassessedOrDraft).length,
                  icon: Clock,
                  accentColor: 'amber'
                },
                {
                  id: 'inprogress' as const,
                  label: 'در حال ارزیابی',
                  count: assignedCases.filter(isCaseInProgress).length,
                  icon: Edit3,
                  accentColor: 'blue'
                },
                {
                  id: 'evaluated' as const,
                  label: 'ارزیابی‌شده و ارسالی',
                  count: assignedCases.filter(isCaseEvaluated).length,
                  icon: CheckCircle2,
                  accentColor: 'emerald'
                },
                {
                  id: 'correction' as const,
                  label: 'نیازمند اصلاح مشتری',
                  count: assignedCases.filter(isCaseCorrection).length,
                  icon: AlertTriangle,
                  accentColor: 'rose'
                },
                {
                  id: 'rejected' as const,
                  label: 'رد شده / سلب صلاحیت (قفل)',
                  count: assignedCases.filter(isCaseRejected).length,
                  icon: Lock,
                  accentColor: 'red'
                }
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = quickFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setQuickFilter(tab.id)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-purple-900 text-white shadow-md shadow-purple-950/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-transparent'
                    }`}
                  >
                    <IconComp
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-purple-300'
                          : tab.accentColor === 'amber'
                          ? 'text-amber-500'
                          : tab.accentColor === 'blue'
                          ? 'text-blue-500'
                          : tab.accentColor === 'emerald'
                          ? 'text-emerald-500'
                          : tab.accentColor === 'rose'
                          ? 'text-rose-500'
                          : tab.accentColor === 'red'
                          ? 'text-red-500'
                          : 'text-purple-500'
                      }`}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white border border-white/20'
                          : tab.count > 0
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar & Filters */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-500 font-bold mb-1">جستجوی سریع</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchAny}
                    onChange={(e) => setSearchAny(e.target.value)}
                    placeholder="کد پیگیری، نام، پلاک، آدرس..."
                    className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">استان</label>
                <input
                  type="text"
                  value={searchProvince}
                  onChange={(e) => setSearchProvince(e.target.value)}
                  placeholder="مثلا تهران"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">شهر</label>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="مثلا کرج"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">نوع ارزیابی</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:border-purple-500"
                >
                  <option value="">همه انواع</option>
                  <option value="اولیه">ارزیابی اولیه</option>
                  <option value="مجدد">ارزیابی مجدد</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchAny('');
                    setSearchProvince('');
                    setSearchCity('');
                    setSearchType('');
                    setSearchStatus('');
                    setQuickFilter('all');
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-xs"
                >
                  پاک‌سازی فیلترها
                </button>
              </div>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className="font-black text-slate-900 text-sm">
                  لیست پرونده‌های ارجاعی ({filteredCases.length})
                </h3>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                  <span>
                    تب فعال:{' '}
                    {quickFilter === 'all'
                      ? 'همه پرونده‌ها'
                      : quickFilter === 'unassessed'
                      ? 'جدید و ارزیابی‌نشده'
                      : quickFilter === 'inprogress'
                      ? 'در حال ارزیابی / پیش‌نویس'
                      : quickFilter === 'evaluated'
                      ? 'ارزیابی‌شده و ارسالی'
                      : 'نیازمند اصلاح مدارک مشتری'}
                  </span>
                </span>
              </div>
              <span className="text-xs text-slate-400 font-bold">
                {assignedCases.length} پرونده کل در کارتابل
              </span>
            </div>

            {filteredCases.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FolderOpen className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-500">پرونده‌ای با این مشخصات یافت نشد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-center whitespace-nowrap">SLA</th>
                      <th className="p-3 whitespace-nowrap">کد پیگیری</th>
                      <th className="p-3 whitespace-nowrap">تاریخ</th>
                      <th className="p-3 whitespace-nowrap">زمان</th>
                      <th className="p-3 whitespace-nowrap">خودرو زیان‌دیده</th>
                      <th className="p-3 whitespace-nowrap">خودرو مقصر</th>
                      <th className="p-3 whitespace-nowrap">نوع ارزیابی</th>
                      <th className="p-3 whitespace-nowrap">استان</th>
                      <th className="p-3 whitespace-nowrap">شهر</th>
                      <th className="p-3 whitespace-nowrap">آدرس</th>
                      <th className="p-3 whitespace-nowrap">مدت از ارجاع</th>
                      <th className="p-3 whitespace-nowrap">وضعیت</th>
                      <th className="p-3 text-center whitespace-nowrap">ارزیابی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredCases.map((c) => {
                      const sla = getSlaInfo(c);
                      const isReassessment = isReassessmentCase(c);
                      
                      const slaDetail = calculateAssessorSlaDetail(c);
                      
                      const addressParts = (c.address || '').split('،').map(s => s.trim());
                      const province = addressParts[0] || 'تهران';
                      const city = addressParts[1] || 'تهران';

                      return (
                        <tr key={c.id} className="hover:bg-purple-50/50 transition-colors">
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block w-2.5 h-2.5 rounded-full ${sla.cls}`}
                              title={sla.label}
                            />
                          </td>
                          <td className="p-3 font-bold font-mono text-purple-700 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span>{c.id}</span>
                              {c.fraudFlag?.flagged && (
                                <span className="mr-1 inline-flex items-center" title="مشکوک به تقلب">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                </span>
                              )}
                            </div>
                            {(c.insurerInstruction || c.insurerAssignmentNote) && (
                              <button
                                type="button"
                                onClick={() => setInsurerNoteModalCase(c)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 font-bold text-[10px] shadow-2xs transition-all cursor-pointer"
                                title="مشاهده توضیحات و دستور کار بیمه‌گر"
                              >
                                <FileText className="w-3 h-3 text-purple-700 shrink-0" />
                                <span>توضیحات بیمه‌گر</span>
                              </button>
                            )}
                          </td>
                          <td className="p-3 font-extrabold text-slate-900 whitespace-nowrap">
                            {c.date || '۱۴۰۵/۰۵/۰۶'}
                          </td>
                          <td className="p-3 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                            ۱۰:۰۲
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 block">{c.carType}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.victimPlate}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 block">{c.culpritCarType || 'خودرو مقصر'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{c.culpritPlate}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap ${
                                isReassessment
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              {isReassessment ? 'ارزیابی مجدد' : 'ارزیابی اولیه'}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{province}</td>
                          <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{city}</td>
                          <td className="p-3 max-w-[180px] truncate" title={c.address}>
                            {c.address || '-'}
                          </td>
                          <td className="p-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                            {isCaseRejected(c) ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[11px]">
                                  سلب صلاحیت / رد
                                </span>
                                <span className="text-[10px] font-black text-rose-700">
                                  پیامک ارسال شده
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                                  {slaDetail.elapsedText}
                                </span>
                                <span className={`text-[10px] font-black ${
                                  slaDetail.isExpired
                                    ? 'text-rose-700 font-extrabold'
                                    : slaDetail.isNearDeadline
                                    ? 'text-amber-700'
                                    : 'text-slate-500'
                                }`}>
                                  {slaDetail.isExpired ? 'انقضا یافته' : `باقی‌مانده: ${slaDetail.remainingHours}h`}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {(() => {
                              if (isCaseRejected(c)) {
                                return (
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap bg-rose-600 text-white shadow-xs">
                                    رد شده (سلب صلاحیت)
                                  </span>
                                );
                              }

                              const isDraft = c.assessment?.status === 'DRAFT' || c.status === 'ثبت موقت';
                              const isSubmitted = c.assessment?.status === 'SUBMITTED' || c.status === 'ارزیابی شده' || c.status === 'در انتظار بررسی بازبین' || c.status === 'در انتظار تایید کاربر';
                              
                              if (isDraft) {
                                return (
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap bg-amber-500 text-white shadow-xs">
                                    ثبت موقت
                                  </span>
                                );
                              }

                              return (
                                <span
                                  className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap ${
                                    c.status === 'در حال ارزیابی'
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : isSubmitted
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : c.status.includes('محول') || c.status.includes('جدید') || c.status === 'ارزیابی‌نشده'
                                      ? 'bg-sky-500 text-white shadow-xs'
                                      : c.status.includes('مجدد')
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {(() => {
                              if (isCaseRejected(c)) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCaseId(c.id);
                                      setActiveTab('summary');
                                    }}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-all"
                                    title="مشاهده اطلاعات پرونده رد شده (فقط خواندنی)"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-rose-600" />
                                    <span>رد شده (غیرقابل ویرایش)</span>
                                  </button>
                                );
                              }

                              const isSubmitted = c.assessment?.status === 'SUBMITTED' || c.status === 'ارزیابی شده' || c.status === 'در انتظار بررسی بازبین' || c.status === 'در انتظار تایید کاربر' || c.status === 'پرداخت شده';
                              
                              if (isSubmitted) {
                                return (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-black shadow-2xs mx-auto">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                    <span>ارزیابی شده</span>
                                  </span>
                                );
                              }

                              if (c.status === 'در حال ارزیابی' || (c.assignedExpert?.id === session.id && c.status !== 'ارزیابی‌نشده' && !c.status.includes('محول'))) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCaseId(c.id);
                                      setActiveTab('parts');
                                    }}
                                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                                  >
                                    <span>ادامه ارزیابی</span>
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                );
                              }

                              return (
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Checkmark Button (Opens Modal 1: قبول ارزیابی پرونده) */}
                                  <button
                                    type="button"
                                    onClick={() => setAcceptModalCase(c)}
                                    className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center font-black transition-all shadow-xs cursor-pointer"
                                    title="قبول ارزیابی پرونده"
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                  </button>

                                  {/* Cross Button (Rejects assignment) */}
                                  <button
                                    type="button"
                                    onClick={() => handleRejectAssignment(c)}
                                    className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-300 flex items-center justify-center font-black transition-all shadow-xs cursor-pointer"
                                    title="عدم پذیرش پرونده (بازگشت به شرکت بیمه)"
                                  >
                                    <X className="w-4 h-4 stroke-[3]" />
                                  </button>

                                  {/* 72h Inaction Simulation Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleSimulate72hExpiry(c)}
                                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 font-extrabold text-[10px] transition-all shadow-xs cursor-pointer"
                                    title="شبیه‌سازی عدم اقدام ۷۲ ساعته (ارسال پیامک، عودت خودکار به بیمه و کسر امتیاز شایستگی)"
                                  >
                                    <Timer className="w-3 h-3 text-amber-700" />
                                    <span>تست ۷۲h</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* WORKSPACE VIEW FOR SELECTED CASE */
        activeCase && (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedCaseId(null)}
              className="flex items-center gap-1.5 text-xs font-black text-slate-900 bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border-2 border-slate-300 shadow-xs transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-blue-900" />
              <span>بازگشت به لیست پرونده‌ها</span>
            </button>

            {/* Workspace Navigation Header */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              {/* REJECTED / TIMEOUT STATUS LOCK BANNER */}
              {isCaseRejected(activeCase) && (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Lock className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-xs text-rose-950 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        پرونده در وضعیت «رد شده / سلب صلاحیت» (غیرقابل تغییر)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                        پیامک اخطار ارسال گردیده است
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 font-medium leading-relaxed bg-white/80 p-2.5 rounded-xl border border-rose-100">
                      این پرونده به دلیل عدم اقدام در مهلت قانونی ۷۲ ساعته یا عدم پذیرش، در وضعیت سلب صلاحیت قرار گرفته و جهت تخصیص به کارشناس جایگزین به شرکت بیمه بازگردانده شده است. کلیه امکانات ویرایش، تغییر قطعات و ثبت برآورد برای شما غیرفعال و فقط‌خواندنی است.
                    </p>
                  </div>
                </div>
              )}

              {/* Insurer Note / Instructions Banner for Assessor */}
              {activeCase.insurerInstruction && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-200 rounded-2xl flex items-start gap-3 shadow-xs animate-in fade-in">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        دستور کار و توضیحات شرکت بیمه ({getInsurerPersianName(activeCase.culpritInsurer) || 'بیمه‌گر'}):
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        ابلاغیه رسمی ارجاع
                      </span>
                    </div>
                    <p className="text-xs text-indigo-900 font-bold leading-relaxed bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                      «{activeCase.insurerInstruction}»
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    فضای کاری کارشناس — پرونده {activeCase.id}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    خودرو: {activeCase.carType} | زیان‌دیده: {activeCase.victimName} | مقصر: {activeCase.culpritName}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl text-xs font-black flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab === 'summary' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    خلاصه پرونده
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('parts')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab === 'parts' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    ارزیابی هوشمند و انتخاب قطعات
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('money')}
                    className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                      activeTab === 'money' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-600 hover:bg-white/60'
                    }`}
                  >
                    برآورد نهایی و ثبت
                  </button>

                  {/* Button to request CRM Support to call customer */}
                  <button
                    type="button"
                    onClick={() => setShowCrmRequestModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer mr-auto"
                    title="ارجاع به امور مشتریان (CRM) جهت تماس تلفنی برای تکمیل مدارک، شبا یا رفع تاخیر"
                  >
                    <Headphones className="w-4 h-4 text-slate-950" />
                    <span>درخواست تماس CRM با مشتری</span>
                  </button>

                  {previousAssessmentsList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPrevAssessmentModal(previousAssessmentsList[0])}
                      className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      title="دیدن صفحه و کلیه ارزیابی‌های کارشناس قبلی"
                    >
                      <History className="w-4 h-4 text-amber-700" />
                      <span>دیدن صفحه ارزیابی کارشناس قبل</span>
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-mono">
                        {previousAssessmentsList.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* 72-Hour SLA Countdown Gauge & Warning Widget */}
              {(() => {
                const sla = calculateAssessorSlaDetail(activeCase);
                const isSubmitted = activeCase.assessment?.status === 'SUBMITTED' || activeCase.status === 'ارزیابی شده' || activeCase.status === 'در انتظار بررسی بازبین' || activeCase.status === 'در انتظار تایید کاربر';

                return (
                  <div className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                    sla.isExpired
                      ? 'bg-rose-100/90 border-rose-400 text-rose-950 shadow-sm'
                      : sla.isNearDeadline
                      ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          sla.isExpired
                            ? 'bg-rose-700 text-white shadow-sm'
                            : sla.isNearDeadline
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          <Timer className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-xs">
                              مدت زمان رسیدگی و مهلت قانونی ارزیابی (SLA حداکثر ۷۲ ساعت)
                            </h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${sla.badgeClass}`}>
                              {sla.statusLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            سپری شده: <strong>{sla.elapsedText}</strong> | باقی‌مانده تا سلب صلاحیت خودکار: <strong>{sla.remainingText}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Manual Test Buttons */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = adjustCaseAssignmentTimeForTesting(activeCase.id, 73, cases);
                            const thisCase = updated.find(x => x.id === activeCase.id);
                            if (thisCase) onUpdateCase(thisCase);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-extrabold shadow-2xs transition-all"
                          title="شبیه‌سازی گذر ۷۳ ساعت برای آزمودن سلب صلاحیت خودکار"
                        >
                          تست گذشت ۷۳ ساعت
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulate72hExpiry(activeCase)}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black shadow-xs transition-all flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>اجرای فوری سلب صلاحیت ۷۲h</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            sla.isExpired
                              ? 'bg-rose-600'
                              : sla.isNearDeadline
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${sla.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>زمان ارجاع: {activeCase.assignedAt ? new Date(activeCase.assignedAt).toLocaleDateString('fa-IR') : 'آغاز فرآیند'}</span>
                        <span className="font-bold">{sla.progressPercent}٪ مهلت مصرف شده</span>
                        <span>پایان مهلت: ۷۲ ساعت (۴۳۲۰ دقیقه)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PREVIOUS EXPERT ASSESSMENT CARD (FOR REASSIGNED / OBJECTED CASES) */}
              {previousAssessmentsList.length > 0 && (
                <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-indigo-500/10 border-2 border-amber-300/80 rounded-3xl space-y-4 shadow-sm animate-in fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-200/70 pb-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/20 shrink-0">
                        <History className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm sm:text-base">
                            سوابق و برآورد کارشناس قبلی (پرونده اعتراضی / ارجاع مجدد)
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-[11px] border border-amber-300">
                            مرحله {activeCase.objectionStage || 1} اعتراض زیان‌دیده
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          کارشناس ارزیاب اول: <strong className="text-slate-900">{previousAssessmentsList[0].expertName}</strong> | تاریخ ثبت ارزیابی قبلی: <span className="font-mono font-bold text-slate-800">{previousAssessmentsList[0].submittedAt}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons: Open Full Page Modal & Toggle In-Card View */}
                    <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedPrevAssessmentModal(previousAssessmentsList[0])}
                        className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-black shadow-md shadow-purple-700/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-4 h-4" />
                        <span>دیدن صفحه ارزیابی کارشناس قبل</span>
                        <Maximize2 className="w-3.5 h-3.5 opacity-80" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPrevAssessmentsCardExpanded(!isPrevAssessmentsCardExpanded)}
                        className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <span>{isPrevAssessmentsCardExpanded ? 'بستن خلاصه کارت' : 'مشاهده سریع در کارت'}</span>
                        {isPrevAssessmentsCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Customer Objection Statement */}
                  <div className="p-4 bg-amber-100/80 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-black">
                        <span>علت ثبت اعتراض توسط زیان‌دیده (مشتری):</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900">مرحله {activeCase.objectionStage || 1}</span>
                      </div>
                      <p className="font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-200 text-amber-950">
                        {activeCase.reassessReason || 'زیان‌دیده نسبت به مبالغ تعیین‌شده و عدم تایید تعویض قطعات آسیب‌دیده اعتراض نموده و پرونده جهت ارزیابی به کارشناس مجدد محول گردیده است.'}
                      </p>
                    </div>
                  </div>

                  {/* Financial Overview Cards of Previous Assessment */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white/95 p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-slate-500 font-bold block text-[11px]">خسارت ناخالص قبلی</span>
                      <span className="font-black font-mono text-slate-900 text-base">
                        {formatCurrency(previousAssessmentsList[0].gross)}
                      </span>
                    </div>
                    <div className="bg-white/95 p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-slate-500 font-bold block text-[11px]">کسورات و فرانشیز قبلی</span>
                      <span className="font-black font-mono text-rose-700 text-base">
                        {formatCurrency(previousAssessmentsList[0].deductions)}
                      </span>
                    </div>
                    <div className="bg-white/95 p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-slate-500 font-bold block text-[11px]">ارزش داغی / اسقاط قبلی</span>
                      <span className="font-black font-mono text-amber-700 text-base">
                        {formatCurrency(previousAssessmentsList[0].salvage)}
                      </span>
                    </div>
                    <div className="bg-purple-50 p-3.5 rounded-2xl border-2 border-purple-300 shadow-2xs space-y-1">
                      <span className="text-purple-700 font-extrabold block text-[11px]">خالص پرداختی قبلی</span>
                      <span className="font-black font-mono text-purple-900 text-base">
                        {formatCurrency(previousAssessmentsList[0].payable)}
                      </span>
                    </div>
                  </div>

                  {/* Quick In-Card Expanded View */}
                  {isPrevAssessmentsCardExpanded && (
                    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-amber-200 space-y-4 animate-in fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <h5 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-600" />
                          <span>ریز اقلام و تصمیمات کارشناس قبلی ({previousAssessmentsList[0].expertName}):</span>
                        </h5>
                        <button
                          type="button"
                          onClick={() => handleCopyPrevAssessmentToCurrent(previousAssessmentsList[0])}
                          className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>کپی کلیه اقلام در برآورد جاری</span>
                        </button>
                      </div>

                      {previousAssessmentsList[0].parts && previousAssessmentsList[0].parts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">نام قطعه / عملیات</th>
                                <th className="p-2.5">نوع اقدام</th>
                                <th className="p-2.5">قیمت قطعه</th>
                                <th className="p-2.5">اجرت تعمیر / صافکاری</th>
                                <th className="p-2.5">کسر داغی</th>
                                <th className="p-2.5">جمع ردیف</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                              {previousAssessmentsList[0].parts.map((p: any, idx: number) => {
                                const rowTotal = (p.partPrice || 0) + (p.repairPrice || 0) - (p.salvageValue || 0);
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/60">
                                    <td className="p-2.5 font-bold text-slate-900">{p.name}</td>
                                    <td className="p-2.5">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                        p.type === 'replace' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {p.type === 'replace' ? 'تعویض قطعه' : 'تعمیر / صافکاری / نقاشی'}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-mono">{formatCurrency(p.partPrice || 0)}</td>
                                    <td className="p-2.5 font-mono">{formatCurrency(p.repairPrice || 0)}</td>
                                    <td className="p-2.5 font-mono text-amber-700">{formatCurrency(p.salvageValue || 0)}</td>
                                    <td className="p-2.5 font-mono font-black text-slate-900">{formatCurrency(rowTotal)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">اقلام تفکیکی برای این ارزیابی ثبت نشده است.</p>
                      )}

                      {previousAssessmentsList[0].reviewerNote && (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <span className="font-black text-slate-800 block">یادداشت فنی کارشناس قبلی:</span>
                          <p className="text-slate-600 font-medium leading-relaxed">{previousAssessmentsList[0].reviewerNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1: Summary & Checklist */}
              {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Both Parties Overview Card */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        <h4 className="font-extrabold text-sm text-white">
                          اطلاعات طرفین پرونده مشترک (طرف اول و طرف دوم)
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        پرونده دوطرفه
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
                        <span className="text-blue-400 font-extrabold block mb-1">
                          طرف اول ({activeCase.partyOneRole || 'زیان‌دیده'})
                        </span>
                        <p className="font-extrabold text-white text-sm">{activeCase.victimName || activeCase.partyOneName}</p>
                        <p className="text-slate-400 font-mono" dir="ltr">{activeCase.victimPhone || activeCase.partyOnePhone}</p>
                        <p className="text-slate-300 font-semibold pt-1">پلاک: {activeCase.victimPlate}</p>
                      </div>

                      <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-1">
                        <span className="text-amber-400 font-extrabold block mb-1">
                          طرف دوم ({activeCase.partyTwoRole || 'مقصر'})
                        </span>
                        <p className="font-extrabold text-white text-sm">{activeCase.culpritName || activeCase.partyTwoName}</p>
                        <p className="text-slate-400 font-mono" dir="ltr">{activeCase.culpritPhone || activeCase.partyTwoPhone}</p>
                        <p className="text-slate-300 font-semibold pt-1">پلاک: {activeCase.culpritPlate}</p>
                      </div>
                    </div>
                  </div>

                  {/* EXPERT COMMUNICATION & DOCUMENT REQUEST SECTION BY PARTY - CLEAN CHAT BOX WITH CORNER DROPDOWN MENU */}
                  <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            ارتباط با طرفین پرونده و مدیریت درخواست مدارک
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            ارسال درخواست مدرک و چت مجزا و محرمانه برای طرف اول و طرف دوم
                          </p>
                        </div>
                      </div>

                      {/* CORNER DROPDOWN MENU BUTTON FOR DOCUMENT REQUESTS */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsDocRequestsOpen(!isDocRequestsOpen)}
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center justify-between gap-2 w-full sm:w-auto"
                        >
                          <div className="flex items-center gap-1.5">
                            <Plus className="w-4 h-4" />
                            <span>درخواست مدرک جدید از {expertChatActiveTab === 'PARTY_ONE' ? 'طرف اول' : 'طرف دوم'}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDocRequestsOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* FLOATING CORNER DROPDOWN MENU */}
                        {isDocRequestsOpen && (
                          <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white border-2 border-purple-200 rounded-2xl shadow-2xl z-30 p-4 space-y-4 text-xs animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <span className="font-black text-purple-900 flex items-center gap-1.5 text-xs">
                                <FilePlus className="w-4 h-4 text-purple-600" />
                                درخواست مدرک جدید از {expertChatActiveTab === 'PARTY_ONE' ? 'طرف اول' : 'طرف دوم'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsDocRequestsOpen(false)}
                                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Quick Request Form */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-slate-600 font-extrabold mb-1">نوع مدرک درخواستی</label>
                                <select
                                  value={docRequestType}
                                  onChange={(e) => setDocRequestType(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-extrabold text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                                >
                                  <option value="عکس از چراغ خودرو">عکس از چراغ خودرو</option>
                                  <option value="عکس از سپر خودرو">عکس از سپر خودرو</option>
                                  <option value="عکس از قسمت آسیب‌دیده خودرو">عکس از قسمت آسیب‌دیده خودرو</option>
                                  <option value="عکس از پلاک خودرو">عکس از پلاک خودرو</option>
                                  <option value="عکس از محل حادثه">عکس از محل حادثه</option>
                                  <option value="ویدیوی محل حادثه">ویدیوی محل حادثه</option>
                                  <option value="تصویر کارت خودرو">تصویر کارت خودرو</option>
                                  <option value="تصویر گواهی‌نامه">تصویر گواهی‌نامه</option>
                                  <option value="تصویر بیمه‌نامه">تصویر بیمه‌نامه</option>
                                  <option value="گزارش پلیس">گزارش پلیس</option>
                                  <option value="کروکی">کروکی</option>
                                  <option value="فاکتور تعمیرات">فاکتور تعمیرات</option>
                                  <option value="سایر مدارک">سایر مدارک</option>
                                </select>
                              </div>

                              {docRequestType === 'سایر مدارک' && (
                                <div>
                                  <label className="block text-slate-600 font-extrabold mb-1">عنوان مدرک سفارشی</label>
                                  <input
                                    type="text"
                                    value={customDocType}
                                    onChange={(e) => setCustomDocType(e.target.value)}
                                    placeholder="عنوان مدرک..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-none focus:border-purple-600"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="block text-slate-600 font-extrabold mb-1">توضیحات تکمیلی برای مشتری</label>
                                <input
                                  type="text"
                                  value={docRequestDesc}
                                  onChange={(e) => setDocRequestDesc(e.target.value)}
                                  placeholder="مثلاً: لطفاً تصویر باکیفیت و خوانا ارسال شود..."
                                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-none focus:border-purple-600"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setDocRequestTarget(expertChatActiveTab === 'PARTY_ONE' ? 'زیان‌دیده' : 'مقصر');
                                  handleSendDocRequest();
                                  setIsDocRequestsOpen(false);
                                }}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-sm text-xs transition-all flex items-center justify-center gap-1.5"
                              >
                                <FilePlus className="w-4 h-4" />
                                <span>ثبت و ارسال درخواست مدرک</span>
                              </button>
                            </div>

                            {/* Existing Requests Summary inside Dropdown */}
                            {(() => {
                              const activePartyKey = expertChatActiveTab;
                              const activeRoleKey = expertChatActiveTab === 'PARTY_ONE' ? 'زیان‌دیده' : 'مقصر';
                              const reqs = (activeCase.docRequests || []).filter(r => 
                                r.recipientParty === activePartyKey || r.target === activeRoleKey
                              );

                              if (reqs.length === 0) return null;

                              return (
                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                  <span className="font-extrabold text-[11px] text-slate-700 block">
                                    مدارک درخواستی قبلی ({reqs.length}):
                                  </span>
                                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                                    {reqs.map((r) => (
                                      <div key={r.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-slate-800">{r.docType}</span>
                                        <select
                                          value={r.status || 'در انتظار پاسخ'}
                                          onChange={(e) => handleUpdateDocReqStatus(r.id, e.target.value)}
                                          className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 bg-white text-purple-900"
                                        >
                                          <option value="درخواست ارسال شد">ارسال شد</option>
                                          <option value="در انتظار پاسخ">در انتظار پاسخ</option>
                                          <option value="مدرک ارسال شد">مدرک ارسال شد</option>
                                          <option value="تأیید شد">تأیید شد</option>
                                        </select>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Party Tabs */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <button
                        type="button"
                        onClick={() => setExpertChatActiveTab('PARTY_ONE')}
                        className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 ${
                          expertChatActiveTab === 'PARTY_ONE'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>طرف اول: {activeCase.victimName || activeCase.partyOneName} ({activeCase.partyOneRole || 'زیان‌دیده'})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpertChatActiveTab('PARTY_TWO')}
                        className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 ${
                          expertChatActiveTab === 'PARTY_TWO'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>طرف دوم: {activeCase.culpritName || activeCase.partyTwoName} ({activeCase.partyTwoRole || 'مقصر'})</span>
                      </button>
                    </div>

                    {/* Active Party Chat Feed */}
                    {(() => {
                      const activePartyKey = expertChatActiveTab;
                      const activeRoleKey = expertChatActiveTab === 'PARTY_ONE' ? 'زیان‌دیده' : 'مقصر';

                      const chatsForTab = (activeCase.docChat || []).filter(c =>
                        c.targetParty === activePartyKey || c.senderParty === activePartyKey || c.target === activeRoleKey
                      );

                      return (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                            <span>تاریخچه پیام‌ها و گفتگوهای اختصاصی با {expertChatActiveTab === 'PARTY_ONE' ? 'طرف اول' : 'طرف دوم'}</span>
                          </h5>

                          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {chatsForTab.length === 0 ? (
                              <p className="text-slate-400 text-[11px] font-medium text-center py-6">
                                پیامی ثبت نشده است.
                              </p>
                            ) : (
                              chatsForTab.map((chat, idx) => {
                                const isFromExpert = chat.from === 'expert' || chat.senderParty === 'EXPERT';
                                return (
                                  <div
                                    key={chat.id || idx}
                                    className={`p-3 rounded-xl text-xs space-y-1.5 border ${
                                      isFromExpert
                                        ? 'bg-purple-50/90 border-purple-200 mr-8 text-purple-950'
                                        : 'bg-white border-slate-200 ml-8 text-slate-900 shadow-2xs'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold text-[10px]">
                                      <span className={isFromExpert ? 'text-purple-700' : 'text-slate-700'}>
                                        {isFromExpert ? `کارشناس (${chat.by || 'ارزیاب'})` : (chat.senderName || chat.by || 'مشتری')}
                                      </span>
                                      <span className="text-slate-400 font-mono">{chat.at}</span>
                                    </div>
                                    <p className="font-medium leading-relaxed">{chat.text}</p>

                                    {chat.files && chat.files.length > 0 && (
                                      <div className="pt-1.5 flex flex-wrap gap-2 border-t border-slate-200/60 mt-1.5">
                                        {chat.files.map((fileItem: any, fi: number) => {
                                          const isObj = typeof fileItem === 'object' && fileItem !== null;
                                          const dUrl = isObj ? fileItem.dataUrl : fileItem;
                                          const fName = isObj ? (fileItem.fileName || fileItem.title || 'فایل ضمیمه') : `فایل ضمیمه #${fi + 1}`;
                                          const fType = isObj ? fileItem.fileType : (typeof dUrl === 'string' && dUrl.startsWith('data:video') ? 'video' : 'image');

                                          return (
                                            <div key={fi} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1 max-w-xs">
                                              <span className="font-bold text-slate-800 block truncate">{fName}</span>
                                              {dUrl && (fType === 'image' || (!fType && typeof dUrl === 'string' && dUrl.startsWith('data:image'))) && (
                                                <img src={dUrl} alt={fName} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                                              )}
                                              {dUrl && fType === 'video' && (
                                                <video src={dUrl} controls className="w-full max-h-28 rounded-lg border border-slate-200" />
                                              )}
                                              {dUrl && (fType === 'pdf' || fType === 'doc') && (
                                                <a href={dUrl} download={fName} className="text-purple-600 hover:underline font-bold block">
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

                          {/* Send Message Input */}
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendExpertChatMessage(expertChatActiveTab);
                            }}
                            className="flex gap-2 pt-2"
                          >
                            <input
                              type="text"
                              value={expertChatInput}
                              onChange={(e) => setExpertChatInput(e.target.value)}
                              placeholder={`ارسال پیام اختصاصی برای ${expertChatActiveTab === 'PARTY_ONE' ? 'طرف اول' : 'طرف دوم'}...`}
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-purple-600"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1 shrink-0"
                            >
                              <span>ارسال</span>
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Unified Documents & Media Section for Assessor */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          مستندات و فایل‌های ارسالی طرفین (مخزن یکپارچه)
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        مجموع: {(activeCase.additionalDocs?.length || 0) + (activeCase.files?.length || 0)} فایل
                      </span>
                    </div>

                    {((activeCase.additionalDocs && activeCase.additionalDocs.length > 0) || (activeCase.files && activeCase.files.length > 0) || activeCase.audioExplanation || activeCase.videoExplanation || activeCase.customerKrokiPhoto || activeCase.croquiData?.fileUrl) ? (
                      <div className="space-y-4">
                        {/* Audio & Video Explanations */}
                        {(activeCase.audioExplanation || activeCase.videoExplanation) && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-slate-700">شرح صوتی و فیلم ارسالی راننده:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeCase.audioExplanation && (
                                <div className="p-3.5 bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-xl space-y-2 border border-emerald-800/60">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <Mic className="w-3.5 h-3.5 animate-pulse" />
                                      </div>
                                      <span className="font-bold text-xs">توضیحات صوتی راننده</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewMediaModal({
                                        url: activeCase.audioExplanation!,
                                        name: 'توضیحات صوتی راننده',
                                        type: 'audio',
                                        category: 'شرح صوتی حادثه',
                                        uploader: 'زیان‌دیده / راننده'
                                      })}
                                      className="p-1 bg-emerald-800/80 hover:bg-emerald-700 rounded text-white cursor-pointer"
                                      title="نمای بزرگ"
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <audio controls src={activeCase.audioExplanation} className="w-full h-8 rounded-lg" />
                                </div>
                              )}
                              {activeCase.videoExplanation && (
                                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                                        <Film className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="font-bold text-xs">فیلم صحنه تصادف</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewMediaModal({
                                        url: activeCase.videoExplanation!,
                                        name: 'فیلم صحنه تصادف',
                                        type: 'video',
                                        category: 'فیلم حادثه',
                                        uploader: 'زیان‌دیده / راننده'
                                      })}
                                      className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-white cursor-pointer"
                                      title="نمای بزرگ"
                                    >
                                      <Maximize2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                                    <video controls src={activeCase.videoExplanation} className="w-full h-full object-contain" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional Documents Uploaded by Parties */}
                        {activeCase.additionalDocs && activeCase.additionalDocs.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-bold text-slate-700">مدارک و شواهد ثبت‌شده توسط طرفین حادثه:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {activeCase.additionalDocs.map((doc) => {
                                const isAudio = doc.fileType === 'audio' || doc.type === 'audio' || doc.title?.includes('صوت') || doc.title?.includes('voice');
                                const isVideo = doc.fileType === 'video' || doc.type === 'video' || doc.title?.includes('ویدیو');

                                return (
                                  <div key={doc.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-extrabold text-slate-900 truncate">{doc.title}</span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                                        doc.uploaderParty === 'PARTY_ONE' || doc.uploaderRole?.includes('اول') || doc.uploaderRole?.includes('زیان‌دیده')
                                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                                          : 'bg-amber-100 text-amber-900 border-amber-300'
                                      }`}>
                                        {doc.uploaderRole || (doc.uploaderParty === 'PARTY_ONE' ? 'طرف اول' : 'طرف دوم')}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                                      <div><span className="font-bold text-slate-500">ارسال‌کننده:</span> {doc.uploadedBy || 'کاربر'}</div>
                                      <div><span className="font-bold text-slate-500">نوع مدرک:</span> {doc.docType || 'مستند تکمیلی'}</div>
                                    </div>

                                    {doc.note && (
                                      <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100 leading-relaxed font-medium">
                                        {doc.note}
                                      </p>
                                    )}

                                    {doc.dataUrl && (
                                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                        {isAudio ? (
                                          <div className="p-2 bg-emerald-950 rounded-lg">
                                            <audio src={doc.dataUrl} controls className="w-full h-8" />
                                          </div>
                                        ) : isVideo ? (
                                          <video src={doc.dataUrl} controls className="w-full max-h-36 rounded-lg" />
                                        ) : (
                                          <div
                                            onClick={() => setPreviewMediaModal({
                                              url: doc.dataUrl!,
                                              name: doc.title,
                                              type: 'image',
                                              category: doc.docType || 'مستند تکمیلی',
                                              uploader: doc.uploadedBy || 'طرفین',
                                              note: doc.note
                                            })}
                                            className="cursor-pointer group relative"
                                          >
                                            <img src={doc.dataUrl} alt={doc.title} className="w-full h-36 object-cover rounded-lg group-hover:scale-105 transition-transform" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                              <Maximize2 className="w-3.5 h-3.5" />
                                              <span>بزرگ‌نمایی</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                                      <span>تاریخ: {doc.uploadedAt}</span>
                                      <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{doc.fileSize || '1.5 MB'}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Initial Wizard Files & Damage Photos */}
                        {activeCase.files && activeCase.files.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <h5 className="text-xs font-bold text-slate-700">عکس‌ها و مستندات ثبت اولیه پرونده:</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {activeCase.files.map((f: any, i: number) => {
                                const fileName = typeof f === 'string' ? f : (f?.name || f?.fileName || `تصویر ${i + 1}`);
                                const dataUrl = typeof f === 'object' ? f?.dataUrl : undefined;
                                const isAudio = fileName?.includes('صوت') || fileName?.includes('voice') || f?.type === 'audio';
                                const isVideo = fileName?.includes('ویدیو') || fileName?.includes('video') || f?.type === 'video';

                                return (
                                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-bold text-slate-800 truncate">{fileName}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded font-mono">ثبت اولیه</span>
                                    </div>

                                    {dataUrl && !isAudio && !isVideo && (
                                      <div
                                        onClick={() => setPreviewMediaModal({
                                          url: dataUrl,
                                          name: fileName,
                                          type: 'image',
                                          category: 'عکس خسارت ثبت اولیه',
                                          uploader: 'زیان‌دیده'
                                        })}
                                        className="relative rounded-lg overflow-hidden border border-slate-200 bg-white cursor-pointer group"
                                      >
                                        <img src={dataUrl} alt={fileName} className="w-full h-28 object-cover rounded-lg group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                          <Maximize2 className="w-3.5 h-3.5" />
                                        </div>
                                      </div>
                                    )}

                                    {dataUrl && isAudio && (
                                      <div className="p-2 bg-emerald-950 rounded-lg">
                                        <audio src={dataUrl} controls className="w-full h-8" />
                                      </div>
                                    )}

                                    {dataUrl && isVideo && (
                                      <div className="rounded-lg overflow-hidden bg-black aspect-video">
                                        <video src={dataUrl} controls className="w-full h-full object-contain" />
                                      </div>
                                    )}

                                    {!dataUrl && (
                                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-slate-600">
                                        <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                                        <span className="text-[11px] truncate">فایل پیوست</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Official Croqui Preview */}
                        {(activeCase.customerKrokiPhoto || activeCase.croquiData?.fileUrl) && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <h5 className="text-xs font-bold text-slate-700">تصویر کروکی رسمی راهور:</h5>
                            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs text-amber-900 font-bold">
                                <span>برگه کروکی رسمی پلیس</span>
                                {activeCase.sceneReportCode && <span className="font-mono">کد: {activeCase.sceneReportCode}</span>}
                              </div>
                              <div
                                onClick={() => setPreviewMediaModal({
                                  url: activeCase.customerKrokiPhoto || activeCase.croquiData?.fileUrl || '',
                                  name: 'برگه رسمی کروکی راهور',
                                  type: 'kroki',
                                  category: 'کروکی پلیس راهور',
                                  uploader: 'پلیس / راننده'
                                })}
                                className="cursor-pointer group relative rounded-lg overflow-hidden"
                              >
                                <img
                                  src={activeCase.customerKrokiPhoto || activeCase.croquiData?.fileUrl || ''}
                                  alt="Official Croqui"
                                  className="w-full max-h-56 object-contain rounded-lg bg-white border border-amber-300 group-hover:scale-101 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <Maximize2 className="w-4 h-4" />
                                  <span>بزرگ‌نمایی کروکی</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <ImageOff className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-500 font-bold">مستندی برای این پرونده ثبت نشده است.</p>
                      </div>
                    )}
                  </div>

                  {/* Party Comments Section for Assessor */}
                  {activeCase.partyComments && activeCase.partyComments.length > 0 && (
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-extrabold text-slate-900 text-xs">
                          اظهارات و پیام‌های طرفین حادثه برای کارشناس
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {activeCase.partyComments.map((cmt) => (
                          <div
                            key={cmt.id}
                            className={`p-3 rounded-xl text-xs space-y-1 border ${
                              cmt.uploaderParty === 'PARTY_ONE'
                                ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                                : 'bg-amber-50/80 border-amber-200 text-amber-950'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold text-[10px]">
                              <span>{cmt.role}: {cmt.author}</span>
                              <span className="font-mono text-slate-400">{cmt.time}</span>
                            </div>
                            <p className="font-medium">{cmt.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviewer Return Banner if applicable */}
                  {(activeCase.reviewerReturn || activeCase.status === 'نیازمند اصلاح کارشناس') && (
                    <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl space-y-2 text-xs text-rose-950 shadow-sm animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                          <span>بازگشت پرونده از بازبین کیفیت — نیازمند اصلاح ارزیابی</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 font-extrabold text-[10px]">
                          توسط: {activeCase.reviewerReturn?.returnedBy || 'بازبین کیفیت'}
                        </span>
                      </div>
                      <p className="font-bold leading-relaxed bg-white/80 p-3 rounded-xl border border-rose-200 text-rose-900">
                        دلیل عودت بازبین: {activeCase.reviewerReturn?.reason || 'برآورد نیازمند بازبینی و اصلاح مجدد توسط کارشناس می‌باشد.'}
                      </p>
                      <p className="text-[11px] text-rose-700">
                        لطفاً پس از اعمال تغییرات لازم در برآورد، مجدداً دکمه «تایید نهایی کارشناس و ارسال به بازبین» را کلیک نمایید.
                      </p>
                    </div>
                  )}

                  {/* Re-assessment history banner if applicable */}
                  {(activeCase.reassessType || activeCase.status.includes('مجدد') || activeCase.objectionStage) && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-xs text-amber-900">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>وضعیت اعتراض / ارزیابی مجدد</span>
                        </div>
                        {activeCase.objectionStage && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                            مرحله {activeCase.objectionStage} اعتراض
                          </span>
                        )}
                      </div>
                      <p className="font-medium leading-relaxed">
                        توضیحات پرونده: {activeCase.reassessReason || 'پرونده دارای روند اعتراض و ارزیابی مجدد می‌باشد.'}
                      </p>
                    </div>
                  )}

                  {/* Workshop Information Card (Stage 3) */}
                  {activeCase.workshopInfo && (
                    <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl space-y-3 text-xs text-indigo-950 shadow-sm">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <h4 className="font-extrabold text-sm text-indigo-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          <span>اطلاعات تعمیرگاه معرفی‌شده توسط زیان‌دیده (مرحله ۳)</span>
                        </h4>
                        <span className="text-[10px] text-indigo-700 font-mono">
                          ثبت: {activeCase.workshopInfo.submittedAt}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-indigo-100">
                          <span className="text-slate-400 block mb-1">استان / شهر</span>
                          <span className="font-extrabold text-slate-800">
                            {activeCase.workshopInfo.province} - {activeCase.workshopInfo.city}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100">
                          <span className="text-slate-400 block mb-1">نام تعمیرگاه</span>
                          <span className="font-extrabold text-slate-800">
                            {activeCase.workshopInfo.shopName}
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-100">
                          <span className="text-slate-400 block mb-1">شماره تماس تعمیرگاه</span>
                          <span className="font-extrabold text-indigo-700 font-mono" dir="ltr">
                            {activeCase.workshopInfo.shopPhone}
                          </span>
                        </div>
                      </div>

                      {activeCase.workshopInfo.shopAddress && (
                        <div className="bg-white p-3 rounded-xl border border-indigo-100 text-slate-700">
                          <span className="text-slate-400 block mb-1 font-bold">آدرس تعمیرگاه:</span>
                          <p>{activeCase.workshopInfo.shopAddress}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Objection Chat Stream for Assessor */}
                  {(activeCase.objectionChat || activeCase.objectionStage === 2) && (
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 space-y-4 shadow-xl text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-indigo-400" />
                          <h4 className="font-extrabold text-white text-xs">
                            گفتگو و چت مستقیم با زیان‌دیده ({activeCase.victimName || 'مشتری'})
                          </h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                          کانال فعال پاسخگویی ارزیاب
                        </span>
                      </div>

                      {/* Chat Messages */}
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {(!activeCase.objectionChat || activeCase.objectionChat.length === 0) ? (
                          <p className="text-center text-xs text-slate-500 py-4">پیامی در این گفتگو ثبت نشده است.</p>
                        ) : (
                          activeCase.objectionChat.map((msg, idx) => (
                            <div
                              key={idx}
                              className={`flex flex-col ${
                                msg.sender === 'expert' ? 'items-start' : 'items-end'
                              }`}
                            >
                              <div
                                className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                                  msg.sender === 'expert'
                                    ? 'bg-purple-600 text-white rounded-tl-none'
                                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tr-none'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1">
                                  <span className="font-bold">{msg.name}</span>
                                  <span className="font-mono">{msg.time}</span>
                                </div>
                                <p>{msg.text}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Reply Form */}
                      <form onSubmit={handleSendAssessorChatMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={assessorChatMsg}
                          onChange={(e) => setAssessorChatMsg(e.target.value)}
                          placeholder="پاسخ کارشناس ارزیاب را بنویسید..."
                          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <span>ارسال پاسخ</span>
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">تعداد مستندات</span>
                      <span className="font-black text-slate-900 text-lg">
                        {activeCase.files?.length || 0} فایل
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">امتیاز شواهد AI</span>
                      <span className="font-black text-emerald-700 text-lg">۷۸٪ (خوب)</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">مسیر ارزیابی</span>
                      <span className="font-black text-purple-700 text-lg">استاندارد</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-slate-500 font-bold block mb-1">سطح ریسک</span>
                      <span className="font-black text-slate-900 text-lg">پایین</span>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-extrabold text-slate-900 text-sm">چک‌لیست بررسی کارشناس</h4>
                    <div className="space-y-2 font-medium text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                        <span>اطلاعات زمان، مکان و آدرس تصادف بررسی شد.</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                        <span>تطبیق شماره پلاک و VIN با مستندات ارسالی انجام گرفت.</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-purple-600" />
                        <span>زوایای تصاویر جهت برآورد بدنه کافی است.</span>
                      </label>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setActiveTab('parts')}
                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <span>مرحله بعدی: ارزیابی هوشمند و انتخاب قطعات</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* UNIFIED TAB 2: AI Analysis, 3D Model & Parts Selection Combined */}
              {activeTab === 'parts' && (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* AI Analysis & Decision Table (Integrated directly into evaluation) */}
                  <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 font-black text-purple-950 text-sm">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>پیشنهادات و تحلیل هوش مصنوعی (AI Damage Detection)</span>
                      </div>
                      <span className="px-3 py-1 bg-purple-200/90 text-purple-900 rounded-xl font-extrabold text-[11px]">
                        تشخیص هوشمند قطعات آسیب‌دیده
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs bg-white rounded-2xl border border-purple-200/80 overflow-hidden shadow-2xs">
                        <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">قطعه / یافته</th>
                            <th className="p-3.5">نوع آسیب</th>
                            <th className="p-3.5">شدت</th>
                            <th className="p-3.5">عملیات پیشنهادی</th>
                            <th className="p-3.5">اطمینان AI</th>
                            <th className="p-3.5">وضعیت تصمیم</th>
                            <th className="p-3.5 text-center">اقدام کارشناس</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {aiDecisionsState.map((f) => (
                            <tr key={f.findingId} className="hover:bg-purple-50/40 transition-colors">
                              <td className="p-3.5 font-bold text-slate-900">{f.part}</td>
                              <td className="p-3.5">{f.type}</td>
                              <td className="p-3.5">{f.severity}</td>
                              <td className="p-3.5 font-bold text-purple-700">{f.operation}</td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {f.confidence}
                                </span>
                              </td>
                              <td className="p-3.5">
                                {f.decision === 'APPROVED' && (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                    تایید شد
                                  </span>
                                )}
                                {f.decision === 'EDITED' && (
                                  <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                                    ویرایش شد
                                  </span>
                                )}
                                {f.decision === 'REJECTED' && (
                                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                                    رد شد
                                  </span>
                                )}
                                {!f.decision && (
                                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px]">
                                    در انتظار
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDecideAiLine(f.findingId, 'APPROVED')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all"
                                  >
                                    تایید
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingAiFinding(f)}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold transition-all"
                                  >
                                    ویرایش
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDecideAiLine(f.findingId, 'REJECTED')}
                                    className="px-2 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg text-[10px] font-bold transition-all"
                                  >
                                    رد
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setWhyFinding(f)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all"
                                  >
                                    چرا AI؟
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Car Blueprint & 3D Interactive Model Viewer */}
                  <Car3DViewer
                    caseId={activeCase.id}
                    editable={!isCaseRejected(activeCase)}
                    damageData={carDamageSpotsState}
                    onChangeDamageData={(newData) => {
                      if (isCaseRejected(activeCase)) return;
                      setCarDamageSpotsState(newData);
                      const updated: ClaimCase = {
                        ...activeCase,
                        carDamageSpots: newData
                      };
                      onUpdateCase(updated);
                    }}
                    onAddPartToEstimate={handleAutoAddPartFromBlueprint}
                  />

                  {/* Parts Builder Header & Add Button */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">
                          انتخاب قطعات تعویضی / تعمیری و اجرت کارشناس
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          برای هر قطعه نوع (تعویض/تعمیر) و قیمت‌ها را وارد کنید؛ قیمت‌ها به تومان نیز درج می‌شوند.
                        </p>
                      </div>

                      {!isCaseRejected(activeCase) ? (
                        <button
                          type="button"
                          onClick={handleAddPart}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          افزودن قطعه
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          غیرقابل ویرایش (پرونده رد شده)
                        </span>
                      )}
                    </div>

                    {/* List of Parts */}
                    <div className="space-y-3">
                      {parts.map((p, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={p.name}
                              onChange={(e) => handleUpdatePart(idx, 'name', e.target.value)}
                              className="font-bold text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-500"
                            >
                              {PART_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-2">
                              <div className="inline-flex bg-slate-200 p-1 rounded-xl font-bold text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePart(idx, 'type', 'replace')}
                                  className={`px-3 py-1 rounded-lg transition-all ${
                                    p.type === 'replace' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                                  }`}
                                >
                                  تعویضی
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePart(idx, 'type', 'repair')}
                                  className={`px-3 py-1 rounded-lg transition-all ${
                                    p.type === 'repair' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                                  }`}
                                >
                                  تعمیری
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemovePart(idx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-xl"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Conditional Fields based on Repair vs Replace */}
                          {p.type === 'repair' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                              <div className="sm:col-span-2">
                                <label className="block text-slate-700 font-bold mb-1">
                                  اجرت تعمیر، صافکاری و نقاشی (ریال)
                                </label>
                                <input
                                  type="text"
                                  value={p.repairPrice}
                                  onChange={(e) => handleUpdatePart(idx, 'repairPrice', e.target.value)}
                                  placeholder="0"
                                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:border-purple-500"
                                />
                                {p.repairPrice && (
                                  <p className="text-[10px] text-purple-700 font-bold mt-1 leading-tight">
                                    {rialToPersianToman(p.repairPrice)}
                                  </p>
                                )}
                              </div>
                              <div className="sm:col-span-1 p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-[11px] font-bold space-y-1">
                                <span className="block font-black text-purple-950">وضعیت قطعه:</span>
                                <p className="text-[10px] text-purple-800 leading-snug">
                                  قطعه تعمیری است؛ بدون نیاز به تحویل داغی و بدون احتساب قیمت قطعه نو.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                              <div>
                                <label className="block text-slate-700 font-bold mb-1">قیمت قطعه نو (ریال)</label>
                                <input
                                  type="text"
                                  value={p.partPrice}
                                  onChange={(e) => handleUpdatePart(idx, 'partPrice', e.target.value)}
                                  placeholder="0"
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:border-purple-500"
                                />
                                {p.partPrice && (
                                  <p className="text-[10px] text-purple-700 font-bold mt-1 leading-tight">
                                    {rialToPersianToman(p.partPrice)}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-slate-700 font-bold mb-1">اجرت تعویض/نصب (ریال)</label>
                                <input
                                  type="text"
                                  value={p.repairPrice}
                                  onChange={(e) => handleUpdatePart(idx, 'repairPrice', e.target.value)}
                                  placeholder="0"
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:border-purple-500"
                                />
                                {p.repairPrice && (
                                  <p className="text-[10px] text-purple-700 font-bold mt-1 leading-tight">
                                    {rialToPersianToman(p.repairPrice)}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-slate-700 font-bold mb-1">نیاز به داغی</label>
                                <select
                                  value={p.salvageNeeded ? 'yes' : 'no'}
                                  onChange={(e) => handleUpdatePart(idx, 'salvageNeeded', e.target.value === 'yes')}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:border-purple-500"
                                >
                                  <option value="no">ندارد (بدون داغی)</option>
                                  <option value="yes">دارد (نیازمند داغی)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-slate-700 font-bold mb-1">ارزش داغی (ریال)</label>
                                <input
                                  type="text"
                                  value={p.salvageValue}
                                  disabled={!p.salvageNeeded}
                                  onChange={(e) => handleUpdatePart(idx, 'salvageValue', e.target.value)}
                                  placeholder={p.salvageNeeded ? '0' : 'بدون داغی'}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono disabled:bg-slate-100 disabled:text-slate-400 font-bold focus:outline-none focus:border-purple-500"
                                />
                                {p.salvageNeeded && p.salvageValue && (
                                  <p className="text-[10px] text-purple-700 font-bold mt-1 leading-tight">
                                    {rialToPersianToman(p.salvageValue)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Parts Total Sum */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-emerald-950 block">جمع کل قطعات و اجرت:</span>
                        <span className="text-[11px] text-emerald-800 font-bold">
                          {rialToPersianToman(computePartsTotal())}
                        </span>
                      </div>
                      <span className="font-black text-emerald-800 text-sm font-mono">
                        {formatCurrency(computePartsTotal())}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const total = computePartsTotal();
                        if (total > 0) {
                          setGrossInput(String(total));
                        }
                        setActiveTab('money');
                      }}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <span>مرحله بعدی: برآورد نهایی و ثبت مالی</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Final Assessment & Money */}
              {activeTab === 'money' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-black text-emerald-950 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ثبت برآورد خسارت کارشناس و ارسال به بازبین / بیمه‌گر
                      </h4>
                      <span className="text-[11px] font-bold text-slate-600 bg-white/80 border border-slate-200 px-3 py-1 rounded-xl">
                        محاسبه فرانشیز، استهلاک و کسورات برعهده واحد خسارت بیمه‌گر است
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-700 font-bold">
                            مبلغ ناخالص برآورد خسارت (ریال)
                          </label>
                          {!isCaseRejected(activeCase) && (
                            <button
                              type="button"
                              onClick={() => setGrossInput(String(computePartsTotal()))}
                              className="text-[10px] text-purple-700 hover:text-purple-900 font-extrabold flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200"
                              title="دریافت خودکار از جمع اقلام قطعات و اجرت"
                            >
                              <RefreshCw className="w-3 h-3" />
                              بروزرسانی از جمع قطعات
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          disabled={isCaseRejected(activeCase)}
                          value={grossInput}
                          onChange={(e) => setGrossInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        {grossInput && (
                          <p className="text-[10px] text-emerald-800 font-bold mt-1 leading-tight">
                            {rialToPersianToman(grossInput)}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">ارزش داغی قطعات مستهلک (ریال)</label>
                        <input
                          type="text"
                          disabled={isCaseRejected(activeCase)}
                          value={salvageInput}
                          onChange={(e) => setSalvageInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        {salvageInput && (
                          <p className="text-[10px] text-amber-700 font-bold mt-1 leading-tight">
                            {rialToPersianToman(salvageInput)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-emerald-200 flex items-center justify-between text-xs flex-wrap gap-2 shadow-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 block">مبلغ برآورد خالص کارشناسی:</span>
                        <span className="text-[11px] text-emerald-800 font-black">
                          {rialToPersianToman(
                            Math.max(
                              0,
                              parseMoneyNumber(grossInput) -
                                parseMoneyNumber(salvageInput)
                            )
                          )}
                        </span>
                      </div>
                      <span className="font-black text-emerald-700 text-base font-mono">
                        {formatCurrency(
                          Math.max(
                            0,
                            parseMoneyNumber(grossInput) -
                              parseMoneyNumber(salvageInput)
                          )
                        )}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        توضیحات و گزارش کارشناس
                      </label>
                      <textarea
                        rows={3}
                        disabled={isCaseRejected(activeCase)}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="دلیل برآورد، جزئیات قطعات تعویضی و توضیح کارشناسی..."
                        className="w-full p-3.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 font-medium leading-relaxed focus:outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    {!isCaseRejected(activeCase) ? (
                      <div className="flex items-center gap-3 pt-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSaveDraft}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                        >
                          ثبت موقت (پیش‌نویس)
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowDocRequestModal(true)}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
                        >
                          درخواست مدارک بیشتر
                        </button>

                        <button
                          type="button"
                          onClick={handleFinalizeAssessment}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 active:scale-95 mr-auto"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          تایید نهایی کارشناس و ارسال به بیمه‌گر
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-rose-600" />
                          <span>پرونده در وضعیت «رد شده (سلب صلاحیت)» قرار دارد و کلیه عملیات ثبت و تایید مسدود است.</span>
                        </div>
                        <span className="text-[11px] text-rose-600 font-semibold">صرفاً مشاهده سوابق</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* MODAL 1: Why AI Modal */}
      {whyFinding && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                تحلیل علت پیشنهاد AI — {whyFinding.part}
              </h3>
              <button
                onClick={() => setWhyFinding(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-purple-50 p-4 rounded-2xl border border-purple-100 font-medium">
              {whyFinding.explanation}
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setWhyFinding(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit AI Finding Modal */}
      {editingAiFinding && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                ویرایش نظر AI برای {editingAiFinding.part}
              </h3>
              <button
                onClick={() => setEditingAiFinding(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1">نوع آسیب</label>
                <input
                  type="text"
                  value={editingAiFinding.type}
                  onChange={(e) => setEditingAiFinding({ ...editingAiFinding, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">عملیات نهایی کارشناس</label>
                <select
                  value={editingAiFinding.operation}
                  onChange={(e) => setEditingAiFinding({ ...editingAiFinding, operation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="رنگ‌آمیزی">رنگ‌آمیزی</option>
                  <option value="صافکاری و نقاشی">صافکاری و نقاشی</option>
                  <option value="تعویض قطعه">تعویض قطعه</option>
                  <option value="بازدید مجدد">بازدید مجدد</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingAiFinding(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiDecisionsState((prev) =>
                    prev.map((item) =>
                      item.findingId === editingAiFinding.findingId
                        ? { ...editingAiFinding, decision: 'EDITED' }
                        : item
                    )
                  );
                  setEditingAiFinding(null);
                }}
                className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Request Documents Modal */}
      {showDocRequestModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 text-slate-900 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900">
                درخواست مدرک جدید از مشتری
              </h3>
              <button
                onClick={() => setShowDocRequestModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1">این درخواست برای کدام طرف است؟</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocRequestTarget('زیان‌دیده')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      docRequestTarget === 'زیان‌دیده'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    طرف اول (زیان‌دیده)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocRequestTarget('مقصر')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      docRequestTarget === 'مقصر'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    طرف دوم (مقصر)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">نوع مدرک مورد نیاز</label>
                <select
                  value={docRequestType}
                  onChange={(e) => setDocRequestType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="عکس از چراغ خودرو">عکس از چراغ خودرو</option>
                  <option value="عکس از سپر خودرو">عکس از سپر خودرو</option>
                  <option value="عکس از قسمت آسیب‌دیده خودرو">عکس از قسمت آسیب‌دیده خودرو</option>
                  <option value="عکس از پلاک خودرو">عکس از پلاک خودرو</option>
                  <option value="عکس از محل حادثه">عکس از محل حادثه</option>
                  <option value="ویدیوی محل حادثه">ویدیوی محل حادثه</option>
                  <option value="تصویر کارت خودرو">تصویر کارت خودرو</option>
                  <option value="تصویر گواهی‌نامه">تصویر گواهی‌نامه</option>
                  <option value="تصویر بیمه‌نامه">تصویر بیمه‌نامه</option>
                  <option value="گزارش پلیس">گزارش پلیس</option>
                  <option value="کروکی">کروکی</option>
                  <option value="فاکتور تعمیرات">فاکتور تعمیرات</option>
                  <option value="سایر مدارک">سایر مدارک</option>
                </select>
              </div>

              {docRequestType === 'سایر مدارک' && (
                <div>
                  <label className="block text-slate-500 font-bold mb-1">عنوان مدرک درخواستی سفارشی</label>
                  <input
                    type="text"
                    value={customDocType}
                    onChange={(e) => setCustomDocType(e.target.value)}
                    placeholder="مثلاً: تصویر برگه معاینه فنی یا فاکتور جرثقیل..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-500 font-bold mb-1">توضیحات و پیام کارشناس برای مشتری</label>
                <textarea
                  rows={3}
                  value={docRequestDesc}
                  onChange={(e) => setDocRequestDesc(e.target.value)}
                  placeholder="لطفاً تصویر واضحی از بخش مربوطه با زاویه مناسب ارسال کنید..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDocRequestModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSendDocRequest}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md"
              >
                ثبت و ارسال درخواست
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Image 2 — قبول ارزیابی پرونده */}
      {acceptModalCase && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-200 animate-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between pb-2">
              <div className="space-y-0.5">
                <h3 className="font-black text-base text-slate-900">قبول ارزیابی پرونده</h3>
                <p className="text-xs text-slate-500 font-mono">پرونده {acceptModalCase.id} — {acceptModalCase.carType} ({acceptModalCase.victimPlate})</p>
              </div>
              <button
                onClick={() => setAcceptModalCase(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Insurer Instructions / Note Section before Accepting */}
            <div className="p-4 bg-purple-50/80 border-2 border-purple-200 rounded-2xl space-y-2.5 text-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-purple-900 font-black text-xs">
                  <FileText className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>توضیحات شرکت بیمه ({getInsurerPersianName(acceptModalCase.culpritInsurer) || 'بیمه‌گر'})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInsurerNoteModalCase(acceptModalCase)}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 border border-purple-300 text-purple-900 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                >
                  <span>مشاهده صفحه توضیحات</span>
                  <ArrowLeft className="w-3 h-3 text-purple-700" />
                </button>
              </div>

              {acceptModalCase.insurerInstruction || acceptModalCase.insurerAssignmentNote ? (
                <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs space-y-1.5">
                  <p className="text-xs text-purple-950 font-bold leading-relaxed">
                    «{acceptModalCase.insurerInstruction || acceptModalCase.insurerAssignmentNote}»
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-purple-700 pt-1 border-t border-purple-100 font-medium">
                    <span>ثبت‌کننده: {acceptModalCase.insurerNoteAuthor || 'پورتال شرکت بیمه'}</span>
                    {acceptModalCase.insurerNoteDate && <span className="font-mono">{acceptModalCase.insurerNoteDate}</span>}
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 p-2.5 rounded-xl border border-dashed border-purple-200 text-xs text-slate-500 font-medium flex items-center justify-between">
                  <span>توضیحات خاصی توسط بیمه‌گر ثبت نشده است. ارزیابی طبق تعرفه مصوب انجام شود.</span>
                  <button
                    type="button"
                    onClick={() => setInsurerNoteModalCase(acceptModalCase)}
                    className="text-[10px] font-bold text-purple-700 underline shrink-0 mr-2"
                  >
                    اطلاعات پرونده
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: الان ارزیابی می‌کنم */}
              <button
                type="button"
                onClick={() => {
                  const currentCase = acceptModalCase;
                  if (!currentCase) return;
                  const updated: ClaimCase = {
                    ...currentCase,
                    status: 'در حال ارزیابی',
                    assignedExpert: {
                      id: session.id,
                      name: session.name || 'رضا تهرانی',
                      role: session.roleTitle || 'ارزیاب ارشد'
                    },
                    acceptedByExpertAt: new Date().toISOString(),
                    history: [
                      ...(currentCase.history || []),
                      {
                        status: 'در حال ارزیابی',
                        time: new Date().toLocaleString('fa-IR'),
                        user: session.name || 'کارشناس خسارت',
                        note: 'ارزیاب پرونده را پذیرفت و بررسی اولیه را آغاز نمود.'
                      }
                    ]
                  };
                  onUpdateCase(updated);
                  setAcceptModalCase(null);
                  setPreliminaryCheckCase(updated);
                }}
                className="p-5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 text-right space-y-2 transition-all group flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-extrabold text-sm mb-1">الان ارزیابی می‌کنم</h4>
                  <p className="text-[11px] text-purple-100 leading-relaxed font-medium">
                    اطلاعات پرونده باز می‌شود و ارزیابی را شروع می‌کنید.
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-white bg-white/20 px-3 py-1 rounded-xl w-fit">
                  ورود به بررسی اولیه <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Option 2: بعداً ارزیابی می‌کنم */}
              <button
                type="button"
                onClick={() => handleAcceptLater(acceptModalCase)}
                className="p-5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-purple-300 text-slate-900 text-right space-y-2 transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-extrabold text-sm mb-1 text-slate-900">بعداً ارزیابی می‌کنم</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    پرونده قبول می‌شود و در بخش ارزیابی‌نشده باقی می‌ماند.
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl w-fit">
                  ثبت در صف ارزیابی
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Image 3 — بررسی اولیه پرونده */}
      {preliminaryCheckCase && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 border border-slate-200 animate-in zoom-in-95 text-slate-900 my-8">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-lg text-slate-900">
                    بررسی اولیه پرونده {preliminaryCheckCase.id}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    isReassessmentCase(preliminaryCheckCase)
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {isReassessmentCase(preliminaryCheckCase) ? 'ارزیابی مجدد' : 'ارزیابی اولیه'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                  <span>تاریخ و زمان: {preliminaryCheckCase.date || '۱۴۰۵/۰۵/۰۶ ۱۰:۰۲'}</span>
                  <span>•</span>
                  <span>آدرس: {preliminaryCheckCase.address || 'شهید گمنام، تخت جمشید، منطقه ۱۲'}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRejectAssignment(preliminaryCheckCase)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-extrabold text-xs flex items-center gap-1 transition-all"
                  title="عدم پذیرش / رد پرونده"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>رد پرونده</span>
                </button>
                <button
                  onClick={() => setPreliminaryCheckCase(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Insurer Instructions Alert Banner in Preliminary Check */}
            {(preliminaryCheckCase.insurerInstruction || preliminaryCheckCase.insurerAssignmentNote) && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-200 rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-black text-xs text-purple-950 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      توضیحات و دستور کار شرکت بیمه ({getInsurerPersianName(preliminaryCheckCase.culpritInsurer) || 'بیمه‌گر'}):
                    </span>
                    <button
                      type="button"
                      onClick={() => setInsurerNoteModalCase(preliminaryCheckCase)}
                      className="text-[10px] font-black text-purple-700 bg-white/90 px-2 py-0.5 rounded-md border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>مشاهده کامل</span>
                      <ArrowLeft className="w-3 h-3 text-purple-700" />
                    </button>
                  </div>
                  <p className="text-xs text-purple-950 font-bold leading-relaxed bg-white/80 p-2.5 rounded-xl border border-purple-100">
                    «{preliminaryCheckCase.insurerInstruction || preliminaryCheckCase.insurerAssignmentNote}»
                  </p>
                </div>
              </div>
            )}

            {/* Yellow/Emerald Banner: Police Inquiry & Kroki */}
            {(() => {
              const activeInquiry = policeInquiryState[preliminaryCheckCase.id] || preliminaryCheckCase.policeInquiryResult;
              const croquiFile = preliminaryCheckCase.croquiData?.fileUrl || activeInquiry?.sketchUrl;

              return (
                <div className={`border rounded-3xl p-5 space-y-4 text-xs transition-colors ${
                  activeInquiry ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-200/80'
                }`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      {activeInquiry ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1 font-medium leading-relaxed">
                        <p className={`font-black text-sm ${activeInquiry ? 'text-emerald-950' : 'text-amber-900'}`}>
                          {activeInquiry
                            ? 'استعلام رسمی پرونده و کروکی از پلیس راهور با موفقیت تایید شد'
                            : 'استعلام رسمی کروکی از نیروی انتظامی جهت ارزیابی کارشناس'}
                        </p>
                        <p className={activeInquiry ? 'text-emerald-800' : 'text-amber-950'}>
                          {activeInquiry
                            ? 'اطلاعات کامل صحنه تصادف، مشخصات طرفین، درصد تقصیر و گزارش افسر راهور از سامانه یکپارچه فاوا استعلام شد.'
                            : 'پیش از تعیین درصد تقصیر و ثبت برآورد خسارت، کارشناس ارزیاب می‌تواند استعلام رسمی کروکی را مجدداً از سامانه پلیس دریافت کند.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePoliceInquiry(preliminaryCheckCase)}
                        className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-700/20 transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        {activeInquiry ? 'استعلام مجدد از پلیس' : 'استعلام از پلیس'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateChainCollision(preliminaryCheckCase)}
                        className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs transition-all shadow-xs"
                      >
                        شبیه‌سازی تصادف زنجیره‌ای
                      </button>
                    </div>
                  </div>

                  {/* FULL POLICE REPORT CARD MATCHING INSURER PORTAL (BUG 1) */}
                  {activeInquiry && (
                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-400 space-y-4 shadow-sm animate-in fade-in text-xs text-slate-800">
                      {/* Header Status & Report Number */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-xs font-black text-emerald-950 block">
                              وضعیت استعلام: معتبر و تاییدشده در سامانه یکپارچه پلیس راهور (فاوا ناجا)
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              استعلام آنلاین پرونده و رسم کروکی از بانک اطلاعاتی راهنمایی و رانندگی
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                            (preliminaryCheckCase.croquiType === 'paper' || preliminaryCheckCase.croquiData?.croquiType === 'paper')
                              ? 'bg-amber-50 text-amber-950 border-amber-300'
                              : 'bg-blue-50 text-blue-900 border-blue-300'
                          }`}>
                            {(preliminaryCheckCase.croquiType === 'paper' || preliminaryCheckCase.croquiData?.croquiType === 'paper') ? 'کروکی کاغذی (ثبت مشتری)' : 'کروکی الکترونیکی فراجا'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-bold">کد گزارش:</span>
                          <span className="px-3 py-1 bg-amber-100 text-amber-950 font-mono font-black rounded-lg text-xs">
                            {activeInquiry.krokiCode || preliminaryCheckCase.croquiData?.reportNumber || preliminaryCheckCase.sceneReportCode || 'CRQ-1403-88492'}
                          </span>
                        </div>
                      </div>

                      {/* Key Grid Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* Incident Date & Time */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">تاریخ و ساعت دقیق تصادف:</span>
                          <span className="font-extrabold text-slate-900 font-mono">{preliminaryCheckCase.croquiData?.incidentDate || preliminaryCheckCase.date || '۱۴۰۵/۰۵/۱۴ - ۱۰:۴۵'}</span>
                        </div>

                        {/* Exact Location */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">محل دقیق وقوع حادثه:</span>
                          <span className="font-bold text-slate-900 block truncate" title={preliminaryCheckCase.croquiData?.location || preliminaryCheckCase.address}>{preliminaryCheckCase.croquiData?.location || preliminaryCheckCase.address || 'تهران - بزرگراه همت'}</span>
                        </div>

                        {/* Accident Type */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">نوع تصادف:</span>
                          <span className="font-bold text-slate-900 block truncate">{preliminaryCheckCase.croquiData?.accidentType || 'تصادف خسارتی دو خودرو (برخورد جلو به عقب)'}</span>
                        </div>

                        {/* Road Condition */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-bold block text-[11px]">وضعیت جاده و جوی:</span>
                          <span className="font-bold text-slate-900 block truncate">{preliminaryCheckCase.croquiData?.roadCondition || 'آسفالت خشک، هوا صاف و دید کافی'}</span>
                        </div>

                        {/* Fault Determination & Percentage */}
                        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1 sm:col-span-2">
                          <span className="text-rose-800 font-bold block text-[11px]">تعیین مقصر قانونی و علت تامه:</span>
                          <span className="font-black text-rose-950 text-xs">
                            {preliminaryCheckCase.croquiData?.faultDetermination || `${activeInquiry.faultPercent}% مقصر: راننده ${preliminaryCheckCase.culpritCarType || 'خودرو مقصر'} (${preliminaryCheckCase.culpritName}) به علت عدم رعایت فاصله طولی`}
                          </span>
                        </div>

                        {/* Claimant Info */}
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 space-y-1">
                          <span className="text-emerald-800 font-bold block text-[11px]">زیان‌دیده (طرف اول):</span>
                          <span className="font-black text-emerald-950 block">
                            {preliminaryCheckCase.croquiData?.victimDriver?.fullName || preliminaryCheckCase.victimName || 'پریسا'}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-mono block">
                            {preliminaryCheckCase.victimPlate || '۴۴ ج ۷۸۹ ایران ۲۲'}
                          </span>
                        </div>

                        {/* Police Badge & Official Stamp */}
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-1">
                          <span className="text-blue-900 font-bold block text-[11px]">افسر کاردان فنی و یگان:</span>
                          <span className="font-bold text-blue-950 text-xs block">
                            {preliminaryCheckCase.croquiData?.officerName || activeInquiry.officer || 'سروان صادقی'}
                          </span>
                          <span className="text-[10px] text-blue-800 font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-700" />
                            مهر رسمی پلیس تایید شد
                          </span>
                        </div>
                      </div>

                      {/* Vehicles Involved */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <span className="font-black text-slate-800 block text-[11px]">خودروهای درگیر در حادثه:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                            <span>۱. خودروی زیان‌دیده ({preliminaryCheckCase.victimName || 'پریسا'}) — {preliminaryCheckCase.carType}</span>
                            <IranianPlateWidget plateStr={preliminaryCheckCase.victimPlate || '56 الف 456 ایران 56'} />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                            <span>۲. خودروی مقصر ({preliminaryCheckCase.culpritName || 'رضا'}) — {preliminaryCheckCase.culpritCarType || 'خودرو مقصر'}</span>
                            <IranianPlateWidget plateStr={preliminaryCheckCase.culpritPlate || '12 الف 456 ایران 45'} />
                          </div>
                        </div>
                      </div>

                      {/* Accident Description & Reported Damages */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-black text-slate-800 text-[11px] block">شرح حادثه و چگونگی برخورد طبق گزارش پلیس:</span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {activeInquiry.details || preliminaryCheckCase.writtenReport || 'عدم رعایت فاصله طولی و بی احتیاطی راننده خودروی مقصر منجر به برخورد از عقب با خودروی زیان‌دیده متوقف در ترافیک گردیده است.'}
                            {activeInquiry.isChain && ' (تصادف زنجیره‌ای ۳ خودرویی ثبت گردید)'}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-black text-slate-800 text-[11px] block">قطعات و خسارات گزارش‌شده در برگه کروکی:</span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            آسیب‌دیدگی سپر عقب، درب صندوق عقب، سنسورهای دنده عقب و چراغ خطر سمت راست خودروی زیان‌دیده.
                          </p>
                        </div>
                      </div>

                      {/* Croqui Sketch Image Preview */}
                      {(activeInquiry.sketchUrl || preliminaryCheckCase.croquiData?.fileUrl || croquiFile) && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <span className="font-black text-slate-800 text-[11px] block">تصویر برگه رسمی کروکی و رسم صحنه تصادف:</span>
                          <div className="flex items-center gap-3 overflow-x-auto pb-1">
                            <div
                              onClick={() => setPreviewImageModal(activeInquiry.sketchUrl || preliminaryCheckCase.croquiData?.fileUrl || croquiFile || '')}
                              className="relative w-44 h-28 rounded-xl border-2 border-amber-300 overflow-hidden shrink-0 cursor-pointer group bg-white shadow-xs"
                            >
                              <img
                                src={activeInquiry.sketchUrl || preliminaryCheckCase.croquiData?.fileUrl || croquiFile}
                                alt="Croqui Sketch"
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                بزرگ‌نمایی کروکی
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Subnote: Expert view Privacy */}
            <div className="text-[11px] text-slate-500 font-medium text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
              نمای کارشناس: نام، نام خانوادگی و کد ملی اشخاص مخفی است؛ اما اطلاعات عملیاتی پرونده برای ارزیابی نمایش داده می‌شود.
            </div>

            {/* Three Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Card 1: جزئیات تصادف */}
              <div
                onClick={() => setCardDetailModal('accident')}
                className="bg-slate-50 hover:bg-purple-50/40 border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-5 space-y-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 group-hover:bg-purple-600 group-hover:text-white text-purple-700 flex items-center justify-center transition-colors shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm group-hover:text-purple-700 transition-colors">جزئیات تصادف</h4>
                      <p className="text-[10px] text-slate-400 font-medium">زمان، مکان، آدرس و مستندات صحنه</p>
                    </div>
                  </div>

                  <div className="pt-2 text-slate-700 space-y-1.5 font-medium text-[11px] bg-white p-3 rounded-xl border border-slate-100">
                    <p><span className="text-slate-400 font-normal">تاریخ و زمان:</span> <span className="font-extrabold text-slate-900">{preliminaryCheckCase.date || '۱۴۰۵/۰۵/۱۸ - ساعت ۱۱:۵۱'}</span></p>
                    <p className="truncate" title={preliminaryCheckCase.address}><span className="text-slate-400 font-normal">مکان:</span> {preliminaryCheckCase.address || 'تهران، خیابان ولیعصر'}</p>
                    <p><span className="text-slate-400 font-normal">کد کروکی پلیس:</span> <span className="font-mono text-purple-700 font-bold">{preliminaryCheckCase.sceneReportCode || preliminaryCheckCase.policeReport?.code || 'KR-770303'}</span></p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-[11px] text-purple-700">
                  <span>مستندات: {preliminaryCheckCase.files?.length || 2} فایل بارگذاری شده</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    مشاهده جزئیات <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card 2: اطلاعات زیان‌دیده */}
              <div
                onClick={() => setCardDetailModal('victim')}
                className="bg-slate-50 hover:bg-indigo-50/40 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-5 space-y-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 flex items-center justify-center transition-colors shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">اطلاعات زیان‌دیده</h4>
                      <p className="text-[10px] text-slate-400 font-medium">پلاک، تلفن، کد ملی، شاسی و مدارک</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{preliminaryCheckCase.carType || 'پژو ۲۰۶'}</span>
                    </div>
                    <IranianPlateWidget plateStr={preliminaryCheckCase.victimPlate || '۱۲-الف-۴۵۶-ایران-۴۵'} />
                    
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-700">
                      <p><span className="text-slate-400 font-normal">شماره تلفن:</span> <span className="font-mono dir-ltr inline-block font-bold">{preliminaryCheckCase.victimPhone || '۰۹۱۲***۴۵۶۷'}</span></p>
                      <p><span className="text-slate-400 font-normal">کد ملی:</span> <span className="font-mono text-slate-800 font-bold">۰۰۱۲۳۴۵۶۷۸</span></p>
                      <p className="truncate"><span className="text-slate-400 font-normal">شماره شاسی (VIN):</span> <span className="font-mono text-[10px] text-slate-600">{preliminaryCheckCase.victimVin || 'IRN998822110033'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-[11px] text-indigo-700">
                  <span className="text-slate-500 font-medium">مدارک: کارت خودرو، گواهینامه</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    مشاهده جزئیات <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Card 3: اطلاعات مقصر */}
              <div
                onClick={() => setCardDetailModal('culprit')}
                className="bg-slate-50 hover:bg-amber-50/40 border-2 border-slate-200 hover:border-amber-400 rounded-2xl p-5 space-y-3 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 group-hover:bg-amber-600 group-hover:text-white text-amber-700 flex items-center justify-center transition-colors shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm group-hover:text-amber-700 transition-colors">اطلاعات مقصر</h4>
                      <p className="text-[10px] text-slate-400 font-medium">پلاک، تلفن، کد ملی، شاسی و شرکت بیمه</p>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>{preliminaryCheckCase.culpritCarType || 'پژو ۴۰۵'}</span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {getInsurerPersianName(preliminaryCheckCase.culpritInsurer)}
                      </span>
                    </div>
                    <IranianPlateWidget plateStr={preliminaryCheckCase.culpritPlate || '۵۶-الف-۴۵۶-ایران-۱۲'} />

                    <div className="bg-white p-2.5 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-700">
                      <p><span className="text-slate-400 font-normal">شماره تلفن:</span> <span className="font-mono dir-ltr inline-block font-bold">{preliminaryCheckCase.culpritPhone || '۰۹۳۵***۸۸۹۹'}</span></p>
                      <p><span className="text-slate-400 font-normal">کد ملی:</span> <span className="font-mono text-slate-800 font-bold">۰۰۵۵۴۴۳۳۲۲</span></p>
                      <p className="truncate"><span className="text-slate-400 font-normal">شماره شاسی (VIN):</span> <span className="font-mono text-[10px] text-slate-600">{preliminaryCheckCase.culpritVin || 'IRN112233445566'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-[11px] text-amber-700">
                  <span className="text-slate-500 font-medium">مدارک: بیمه‌نامه، گواهینامه مقصر</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    مشاهده جزئیات <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              
              {/* Green Button: شروع ارزیابی */}
              <button
                type="button"
                onClick={() => {
                  const caseId = preliminaryCheckCase.id;
                  setPreliminaryCheckCase(null);
                  setSelectedCaseId(caseId);
                  setActiveTab('ai');
                }}
                className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-right space-y-1 transition-all group"
              >
                <div className="flex items-center gap-2 font-black text-sm text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>شروع ارزیابی</span>
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  ورود به جدول AI و فرم قیمت نهایی کارشناس
                </p>
              </button>

              {/* Yellow Button: مغایرت مدارک */}
              <button
                type="button"
                onClick={() => {
                  const caseId = preliminaryCheckCase.id;
                  setPreliminaryCheckCase(null);
                  setSelectedCaseId(caseId);
                  setActiveTab('ai');
                  setShowDocRequestModal(true);
                }}
                className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-right space-y-1 transition-all"
              >
                <div className="flex items-center gap-2 font-black text-sm text-amber-950">
                  <FilePlus className="w-5 h-5 text-amber-600" />
                  <span>مغایرت مدارک</span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium">
                  ثبت دلیل و ارجاع برای اصلاح اطلاعات/مدارک
                </p>
              </button>

              {/* Red Button: تردید در اصالت تصادف */}
              <button
                type="button"
                onClick={() => handleFlagFraud(preliminaryCheckCase)}
                className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-right space-y-1 transition-all"
              >
                <div className="flex items-center gap-2 font-black text-sm text-rose-950">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>تردید در اصالت تصادف</span>
                </div>
                <p className="text-[11px] text-rose-800 font-medium">
                  ثبت دلیل و ارسال برای بررسی بیمه‌گر
                </p>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* Detail Form Modals (Accident, Victim, Culprit) */}
      {cardDetailModal && preliminaryCheckCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] dir-rtl animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-5 shadow-2xl border border-slate-100 relative">
            
            {/* Top Bar with Red Cross Close Button on Top Left */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg md:text-xl">
                  {cardDetailModal === 'accident' && 'فرم زمان، مکان و مستندات حادثه'}
                  {cardDetailModal === 'victim' && 'فرم اطلاعات زیان‌دیده'}
                  {cardDetailModal === 'culprit' && 'فرم اطلاعات مقصر'}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  پرونده {preliminaryCheckCase.id} — نسخه قابل مشاهده برای کارشناس
                </p>
              </div>

              {/* Red Cross Close Button on Top-Left */}
              <button
                type="button"
                onClick={() => setCardDetailModal(null)}
                className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-600 border border-rose-200 flex items-center justify-center transition-colors cursor-pointer shadow-xs shrink-0"
                title="بستن"
              >
                <X className="w-4 h-4 text-rose-600" />
              </button>
            </div>

            {/* Privacy Notice Banner */}
            <div className="bg-slate-50/80 border border-dashed border-slate-300 rounded-2xl p-3.5 text-center text-[11px] text-slate-600 font-medium leading-relaxed">
              حریم خصوصی: کارشناس به اطلاعات عملیاتی پرونده، خودرو، پلاک، VIN، آدرس، زمان و مستندات دسترسی دارد؛ اما نام و نام خانوادگی و کد ملی اشخاص نمایش داده نمی‌شود.
            </div>

            {/* Modal 1: Accident Details */}
            {cardDetailModal === 'accident' && (() => {
              // Aggregate all media items for the preliminary check case
              const allMediaItems: Array<{
                id: string;
                name: string;
                url: string;
                type: 'image' | 'video' | 'audio' | 'kroki' | 'document';
                category: string;
                uploader: string;
                date?: string;
                note?: string;
              }> = [];

              // 1. Files from initial wizard
              (preliminaryCheckCase.files || []).forEach((f: any, idx: number) => {
                const name = typeof f === 'string' ? f : (f?.name || f?.fileName || `مدرک ${idx + 1}`);
                const url = typeof f === 'object' ? (f?.dataUrl || f?.preview || f?.url) : undefined;
                const explicitType = typeof f === 'object' ? f?.type : undefined;
                const isAudio = explicitType === 'audio' || name.toLowerCase().includes('صوت') || name.toLowerCase().includes('voice') || name.toLowerCase().includes('audio');
                const isVideo = explicitType === 'video' || name.toLowerCase().includes('ویدیو') || name.toLowerCase().includes('video') || name.toLowerCase().includes('film');

                if (url) {
                  allMediaItems.push({
                    id: `init-${idx}`,
                    name,
                    url,
                    type: isAudio ? 'audio' : isVideo ? 'video' : 'image',
                    category: (typeof f === 'object' && f?.category) || (isAudio ? 'توضیحات صوتی' : isVideo ? 'فیلم حادثه' : 'عکس خسارت اولیه'),
                    uploader: (typeof f === 'object' && f?.uploader) || 'زیان‌دیده (ثبت اولیه)',
                    date: preliminaryCheckCase.date
                  });
                }
              });

              // 2. Audio Explanation if separate
              if (preliminaryCheckCase.audioExplanation) {
                allMediaItems.push({
                  id: 'audio-exp',
                  name: 'توضیحات صوتی راننده / زیان‌دیده',
                  url: preliminaryCheckCase.audioExplanation,
                  type: 'audio',
                  category: 'شرح صوتی حادثه',
                  uploader: 'راننده / زیان‌دیده',
                  date: preliminaryCheckCase.date
                });
              }

              // 3. Video Explanation if separate
              if (preliminaryCheckCase.videoExplanation) {
                allMediaItems.push({
                  id: 'video-exp',
                  name: 'ویدیوی ضبط‌شده از صحنه تصادف',
                  url: preliminaryCheckCase.videoExplanation,
                  type: 'video',
                  category: 'فیلم صحنه تصادف',
                  uploader: 'راننده / زیان‌دیده',
                  date: preliminaryCheckCase.date
                });
              }

              // 4. Kroki Photo
              if (preliminaryCheckCase.customerKrokiPhoto) {
                allMediaItems.push({
                  id: 'kroki-photo',
                  name: 'برگه رسمی کروکی پلیس راهور',
                  url: preliminaryCheckCase.customerKrokiPhoto,
                  type: 'kroki',
                  category: 'کروکی رسمی راهور',
                  uploader: 'پلیس / راننده',
                  date: preliminaryCheckCase.date
                });
              }
              if (preliminaryCheckCase.croquiData?.fileUrl && preliminaryCheckCase.croquiData.fileUrl !== preliminaryCheckCase.customerKrokiPhoto) {
                allMediaItems.push({
                  id: 'croqui-data-file',
                  name: 'ترسیم دیجیتال / برگه کروکی سازمانی',
                  url: preliminaryCheckCase.croquiData.fileUrl,
                  type: 'kroki',
                  category: 'کروکی سیستمی',
                  uploader: 'راهور ناجا',
                  date: preliminaryCheckCase.date
                });
              }

              // 5. Culprit Files
              (preliminaryCheckCase.culpritFiles || []).forEach((cf: any, idx: number) => {
                const name = typeof cf === 'string' ? cf : (cf?.name || `مستند طرف دوم ${idx + 1}`);
                const url = typeof cf === 'object' ? (cf?.dataUrl || cf?.preview || cf?.url) : undefined;
                if (url) {
                  allMediaItems.push({
                    id: `culprit-${idx}`,
                    name,
                    url,
                    type: 'image',
                    category: 'مدارک و عکس‌های طرف دوم (مقصر)',
                    uploader: 'طرف دوم (مقصر)',
                    date: preliminaryCheckCase.date
                  });
                }
              });

              // 6. Additional Docs
              (preliminaryCheckCase.additionalDocs || []).forEach((doc: AdditionalDocItem) => {
                const isAudio = doc.fileType === 'audio' || (doc as any).type === 'audio' || doc.title?.includes('صوت') || doc.title?.includes('voice');
                const isVideo = doc.fileType === 'video' || (doc as any).type === 'video' || doc.title?.includes('ویدیو') || doc.title?.includes('فیلم');
                const isDoc = doc.fileType === 'pdf' || doc.fileType === 'document' || doc.docType === 'سند / مدرک';

                allMediaItems.push({
                  id: doc.id,
                  name: doc.title,
                  url: doc.dataUrl || '',
                  type: isAudio ? 'audio' : isVideo ? 'video' : isDoc ? 'document' : 'image',
                  category: doc.docType || (isAudio ? 'فایل صوتی' : isVideo ? 'ویدیوی تکمیلی' : 'مستند تکمیلی'),
                  uploader: doc.uploaderRole || (doc.uploaderParty === 'PARTY_ONE' ? 'طرف اول (زیان‌دیده)' : 'طرف دوم (مقصر)'),
                  date: doc.uploadedAt,
                  note: doc.note
                });
              });

              // Filtered list
              const filteredItems = allMediaItems.filter((item) => {
                if (assessorMediaFilter === 'ALL') return true;
                if (assessorMediaFilter === 'IMAGE') return item.type === 'image';
                if (assessorMediaFilter === 'VIDEO') return item.type === 'video';
                if (assessorMediaFilter === 'AUDIO') return item.type === 'audio';
                if (assessorMediaFilter === 'KROKI') return item.type === 'kroki';
                if (assessorMediaFilter === 'DOC') return item.type === 'document';
                return true;
              });

              const countPhotos = allMediaItems.filter(i => i.type === 'image').length;
              const countVideos = allMediaItems.filter(i => i.type === 'video').length;
              const countAudios = allMediaItems.filter(i => i.type === 'audio').length;
              const countKrokis = allMediaItems.filter(i => i.type === 'kroki').length;
              const countDocs = allMediaItems.filter(i => i.type === 'document').length;

              return (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">شماره پیگیری</label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-black text-slate-800">
                        {preliminaryCheckCase.id}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">تاریخ و ساعت حادثه</label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-slate-800">
                        {preliminaryCheckCase.date || '۱۰:۰۲ ۱۴۰۵/۰۵/۰۶'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">وضعیت پرونده</label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800">
                        {preliminaryCheckCase.status || 'محول شده'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">مختصات GPS</label>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-[11px] text-slate-700">
                        51.412582397460945, 35.66622234103479
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">آدرس ثبت‌شده</label>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 leading-relaxed text-right">
                      {preliminaryCheckCase.address || 'شهید پلمه، تختی، ناحیه ۴، منطقه ۱۲ شهر تهران، تهران، بخش مرکزی تهران، شهرستان تهران، استان تهران، 11987-65116، ایران'}
                    </div>
                  </div>

                  {/* Customer Text Explanation (if present) */}
                  {preliminaryCheckCase.writtenExplanation && (
                    <div className="p-3.5 bg-purple-50/50 border border-purple-200/80 rounded-2xl text-xs space-y-1.5 text-right">
                      <div className="flex items-center gap-2 text-purple-950 font-bold">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span>شرح کتبی نحوه وقوع حادثه توسط زیان‌دیده:</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed pr-6">
                        {preliminaryCheckCase.writtenExplanation}
                      </p>
                    </div>
                  )}

                  {/* Comprehensive Multi-Media Gallery Section */}
                  <div className="pt-2 space-y-3.5 border-t border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                          <Layers className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900">
                          مخزن جامع مستندات چندرسانه‌ای بارگذاری‌شده (عکس، صوت، ویدیو، کروکی)
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">
                        مجموع: {allMediaItems.length} مدرک
                      </span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setAssessorMediaFilter('ALL')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                          assessorMediaFilter === 'ALL'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        همه ({allMediaItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssessorMediaFilter('IMAGE')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          assessorMediaFilter === 'IMAGE'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>عکس‌ها ({countPhotos})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssessorMediaFilter('VIDEO')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          assessorMediaFilter === 'VIDEO'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>ویدیوها ({countVideos})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssessorMediaFilter('AUDIO')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          assessorMediaFilter === 'AUDIO'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>وویس / صوت ({countAudios})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssessorMediaFilter('KROKI')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                          assessorMediaFilter === 'KROKI'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>کروکی پلیس ({countKrokis})</span>
                      </button>
                      {countDocs > 0 && (
                        <button
                          type="button"
                          onClick={() => setAssessorMediaFilter('DOC')}
                          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                            assessorMediaFilter === 'DOC'
                              ? 'bg-slate-800 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>مدارک ({countDocs})</span>
                        </button>
                      )}
                    </div>

                    {/* Media Items Grid */}
                    {filteredItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        {filteredItems.map((item) => {
                          if (item.type === 'audio') {
                            return (
                              <div
                                key={item.id}
                                className="p-4 bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-2xl border border-emerald-800/60 shadow-xs space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                      <Mic className="w-4 h-4 animate-pulse" />
                                    </div>
                                    <div>
                                      <span className="font-extrabold text-xs text-white block truncate max-w-[160px]">
                                        {item.name}
                                      </span>
                                      <span className="text-[10px] text-emerald-300">
                                        ارسال‌کننده: {item.uploader}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMediaModal(item)}
                                    className="p-1.5 bg-emerald-800/80 hover:bg-emerald-700 rounded-lg text-white transition-colors cursor-pointer"
                                    title="پخش در نمای کامل"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Audio Wave visualizer */}
                                <div className="flex items-center justify-center gap-1 h-7 px-3 bg-emerald-900/40 rounded-lg">
                                  {[30, 70, 45, 80, 95, 60, 40, 85, 90, 65, 50, 75, 40].map((h, i) => (
                                    <div
                                      key={i}
                                      className="w-1 bg-emerald-400 rounded-full"
                                      style={{ height: `${h}%` }}
                                    />
                                  ))}
                                </div>

                                {item.url && (
                                  <audio controls src={item.url} className="w-full h-8 rounded-lg" />
                                )}

                                {item.note && (
                                  <p className="text-[10px] text-emerald-200/90 bg-emerald-900/40 p-2 rounded-lg leading-relaxed">
                                    {item.note}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          if (item.type === 'video') {
                            return (
                              <div
                                key={item.id}
                                className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center">
                                      <Film className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <span className="font-bold text-xs text-white block truncate max-w-[160px]">
                                        {item.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        ارسال‌کننده: {item.uploader}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewMediaModal(item)}
                                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors cursor-pointer"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {item.url && (
                                  <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                                    <video controls src={item.url} className="w-full h-full object-contain" />
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // Photo / Kroki / Doc Item
                          return (
                            <div
                              key={item.id}
                              className="p-3 bg-white border border-slate-200 hover:border-purple-300 rounded-2xl text-xs space-y-2.5 shadow-2xs transition-all flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {item.type === 'kroki' ? (
                                    <FileCheck className="w-4 h-4 text-amber-600 shrink-0" />
                                  ) : (
                                    <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                                  )}
                                  <span className="font-bold text-slate-900 truncate">{item.name}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                                  item.type === 'kroki'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-purple-50 text-purple-800 border border-purple-200'
                                }`}>
                                  {item.category}
                                </span>
                              </div>

                              {item.url && (
                                <div
                                  onClick={() => setPreviewMediaModal(item)}
                                  className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer aspect-16/10 flex items-center justify-center"
                                >
                                  <img
                                    src={item.url}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 font-black text-[11px] flex items-center gap-1.5 shadow-md">
                                      <Maximize2 className="w-3.5 h-3.5" />
                                      <span>مشاهده تصویر بزرگ</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {item.note && (
                                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 leading-relaxed font-medium">
                                  {item.note}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                                <span>ارسال: {item.uploader}</span>
                                <span className="font-mono">{item.date || preliminaryCheckCase.date}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                        <Paperclip className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-bold text-xs text-slate-600">مستندی در این دسته‌بندی یافت نشد.</p>
                        <button
                          type="button"
                          onClick={() => setAssessorMediaFilter('ALL')}
                          className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                        >
                          مشاهده همه مدارک
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal 2: Victim Info */}
            {cardDetailModal === 'victim' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">نام و نام خانوادگی زیان‌دیده</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      مخفی برای کارشناس
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">کد ملی زیان‌دیده</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      مخفی برای کارشناس
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">موبایل</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-slate-800">
                      {preliminaryCheckCase.victimPhone || '09224511513'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">نوع خودرو</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800">
                      {preliminaryCheckCase.carType || 'پژو ۲۰۶'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">شرکت بیمه بدنه زیان‌دیده</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800">
                      {getInsurerPersianName(preliminaryCheckCase.victimInsurer) || 'بیمه دانا'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">VIN / شماره شاسی</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-slate-800">
                      {preliminaryCheckCase.victimVin || '757474ق'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">نقش در پرونده</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800">
                      زیان‌دیده
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">پلاک خودرو</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                      <IranianPlateWidget plateStr={preliminaryCheckCase.victimPlate || '56-الف-456-ایران-45'} />
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="pt-2">
                  <h4 className="font-bold text-xs text-slate-800 mb-3 text-center">
                    مستندات قابل مشاهده
                  </h4>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                      <ImageOff className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">مستندی برای این پرونده ثبت نشده است.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal 3: Culprit Info */}
            {cardDetailModal === 'culprit' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">نام و نام خانوادگی مقصر</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      مخفی برای کارشناس
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">کد ملی مقصر</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      مخفی برای کارشناس
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">موبایل مقصر</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-slate-800">
                      {preliminaryCheckCase.culpritPhone || '09126989561'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">شرکت بیمه مقصر</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800">
                      {getInsurerPersianName(preliminaryCheckCase.culpritInsurer) || 'بیمه ایران'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">VIN / شماره شاسی</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-slate-800">
                      {preliminaryCheckCase.culpritVin || '2197398762876'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">پلاک خودرو مقصر</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                      <IranianPlateWidget plateStr={preliminaryCheckCase.culpritPlate || '12-الف-456-ایران-45'} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-500 font-bold mb-1.5 text-center">نوع خودرو</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-800 max-w-md mx-auto">
                      {preliminaryCheckCase.culpritCarType || 'پراید'}
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                <div className="pt-2">
                  <h4 className="font-bold text-xs text-slate-800 mb-3 text-center">
                    مستندات قابل مشاهده
                  </h4>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                      <ImageOff className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">مستندی برای این پرونده ثبت نشده است.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL: Reject Case Modal (عدم پذیرش / رد پرونده توسط کارشناس) */}
      {rejectModalCase && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 border border-slate-200 animate-in zoom-in-95 text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5 text-rose-700">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    عدم پذیرش و رد پرونده {rejectModalCase.id}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    ارجاع پرونده به پنل شرکت بیمه جهت تخصیص به ارزیاب جدید
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalCase(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Case Brief Info */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1 font-medium">
              <p><span className="font-bold text-slate-700">زیان‌دیده:</span> {rejectModalCase.victimName} ({rejectModalCase.carType})</p>
              <p><span className="font-bold text-slate-700">پلاک:</span> <span className="font-mono font-bold text-slate-900">{rejectModalCase.victimPlate}</span></p>
              <p className="truncate"><span className="font-bold text-slate-700">مکان حادثه:</span> {rejectModalCase.address || 'تهران'}</p>
            </div>

            {/* Quick Reason Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                علت عدم پذیرش / رد پرونده را انتخاب کنید:
              </label>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {[
                  'عدم تطابق مدارک و تصاویر با وقوع حادثه',
                  'ترافیک کاری بالا و عدم امکان بازدید در مهلت مقرر',
                  'خارج از محدوده جغرافیایی و استان محل خدمت',
                  'اشکال فنی و ناقص بودن مدارک پرونده',
                  'نیاز به بازبینی و ورود تیم تخصصی بیمه‌گر'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRejectReasonInput(chip)}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                      rejectReasonInput === chip
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                توضیحات تکمیلی علت رد (قابل مشاهده برای شرکت بیمه):
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="دلیل عدم پذیرش را بنویسید..."
                className="w-full p-3 rounded-2xl border-2 border-slate-200 text-xs font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalCase(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectCase}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>تایید رد پرونده و حذف از کارشناس</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Image & Media Modal (Audio, Video, Photo, Kroki, Docs) */}
      {(previewMediaModal || previewImageModal) && (() => {
        const item = previewMediaModal || {
          url: previewImageModal!,
          name: 'تصویر مدرک و کروکی پرونده',
          type: 'image',
          category: 'مستندات پرونده',
          uploader: 'بارگذاری شده'
        };

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold shadow-xs">
                    {item.type === 'audio' ? (
                      <Headphones className="w-5 h-5 text-emerald-600" />
                    ) : item.type === 'video' ? (
                      <Film className="w-5 h-5 text-purple-600" />
                    ) : item.type === 'kroki' ? (
                      <FileCheck className="w-5 h-5 text-amber-600" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{item.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      دسته‌بندی: <span className="font-bold text-slate-700">{item.category || 'مستندات پرونده'}</span> • ارسال‌کننده: <span className="font-bold text-slate-700">{item.uploader || 'مشتری / سیستم'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPreviewMediaModal(null);
                    setPreviewImageModal(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Media Content Display */}
              <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-slate-950/5 p-3">
                {item.type === 'audio' ? (
                  <div className="w-full max-w-lg bg-emerald-950 text-white rounded-2xl p-6 space-y-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Mic className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white">توضیحات صوتی ضبط شده توسط راننده / زیان‌دیده</h4>
                          <span className="text-xs text-emerald-300">فرمت صوتی وب‌ام/ویو با کیفیت استاندارد</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-200">
                        صوت معتبر
                      </span>
                    </div>

                    {/* Audio Wave Visualizer Bars */}
                    <div className="flex items-center justify-center gap-1 h-12 py-2 bg-emerald-900/40 rounded-xl px-4">
                      {[40, 65, 80, 45, 90, 75, 60, 85, 95, 70, 50, 65, 80, 90, 60, 45, 70, 85, 60, 40].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-emerald-400 rounded-full transition-all duration-300"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>

                    {/* Native Audio Controls */}
                    <audio controls autoPlay src={item.url} className="w-full rounded-xl" />

                    <div className="flex items-center justify-between text-xs text-emerald-200/80 pt-2 border-t border-emerald-800/60">
                      <span>مدرک صوتی رسمی در کارتابل ارزیابی</span>
                      <span>ارسال توسط: {item.uploader}</span>
                    </div>
                  </div>
                ) : item.type === 'video' ? (
                  <div className="w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl">
                    <video
                      controls
                      autoPlay
                      src={item.url}
                      className="w-full max-h-[60vh] object-contain"
                    />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="max-h-[72vh] w-auto object-contain rounded-xl shadow-md"
                  />
                )}
              </div>

              {item.note && (
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs text-slate-800">
                  <span className="font-bold text-purple-950 block mb-0.5">یادداشت مدرک:</span>
                  <p>{item.note}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SMS & SYSTEM NOTIFICATIONS INBOX MODAL */}
      {showSmsInboxModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base flex items-center gap-2">
                    <span>صندوق پیامک و اخطارهای سیستمی</span>
                    {unreadSmsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                        {unreadSmsCount} پیام خوانده نشده
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-purple-200 font-medium">
                    پیامک‌های دریافتی از سامانه متمرکز ارزیابی خسارت بیمه مرکزی
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadSmsCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllSmsAsRead}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                  >
                    علامت‌گذاری همه به عنوان خوانده شده
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSmsInboxModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50">
              {assessorSmsList.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Inbox className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">هیچ پیامکی در صندوق وجود ندارد.</p>
                </div>
              ) : (
                assessorSmsList.map((sms) => (
                  <div
                    key={sms.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      sms.type === 'CRM_MESSAGE'
                        ? 'bg-purple-50/95 border-purple-300 text-purple-950 shadow-xs'
                        : sms.type === 'TIMEOUT_ALERT'
                        ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                        : sms.type === 'REASSIGNMENT'
                        ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                        : 'bg-white border-slate-200 text-slate-900'
                    } ${!sms.read ? 'ring-2 ring-purple-500/30' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {sms.type === 'CRM_MESSAGE' ? (
                          <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Headphones className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : sms.type === 'TIMEOUT_ALERT' ? (
                          <div className="w-8 h-8 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0">
                            <Timer className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-xs flex items-center gap-1.5">
                              <span>{sms.title}</span>
                              {!sms.read && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                              )}
                            </h4>
                            {sms.type === 'CRM_MESSAGE' && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-black text-[9px]">
                                پیام امور مشتریان (CRM)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span>فرستنده: {sms.sender || sms.senderPhone || 'واحد امور مشتریان'}</span>
                            <span>|</span>
                            <span>{sms.date} - {sms.time}</span>
                            {sms.caseId && (
                              <>
                                <span>|</span>
                                <span className="font-bold text-purple-700">پرونده: {sms.caseId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {!sms.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkSingleSmsAsRead(sms.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-purple-50 text-purple-800 text-[10px] font-extrabold shadow-2xs transition-all shrink-0"
                        >
                          علامت به عنوان خوانده شده
                        </button>
                      )}
                    </div>

                    <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 text-xs font-medium leading-relaxed">
                      {sms.message}
                    </div>

                    {sms.penaltyPoints && sms.penaltyPoints > 0 && (
                      <div className="mt-2 text-[11px] text-rose-700 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>اثر در کارنامه: {sms.penaltyPoints}- نمره منفی در شایستگی کارشناس اعمال گردید.</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>مهلت بررسی پرونده‌های محول شده: حداکثر ۷۲ ساعت پس از تخصیص</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSmsInboxModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition-all"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRM REQUEST CONTACT MODAL */}
      {showCrmRequestModal && activeCase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border-2 border-amber-400 animate-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    درخواست تماس فوری امور مشتریان (CRM) با مشتری
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    پرونده {activeCase.id} • مخاطب: {activeCase.victimName} ({activeCase.victimPhone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCrmRequestModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  علت ارجاع به امور مشتریان:
                </label>
                <select
                  value={crmRequestReasonText}
                  onChange={(e) => {
                    setCrmRequestReasonText(e.target.value);
                    if (e.target.value.includes('شبا')) setCrmRequestReasonType('MISSING_IBAN');
                    else if (e.target.value.includes('تصاویر') || e.target.value.includes('مدارک')) setCrmRequestReasonType('MISSING_DOCS');
                    else setCrmRequestReasonType('FOLLOW_UP');
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="نقص تصاویر و بارگذاری عکس واضح از قطعات">نقص تصاویر و بارگذاری عکس واضح از قطعات</option>
                  <option value="عدم ثبت یا مغایرت شماره شبای زیان‌دیده جهت واریز خسارت">عدم ثبت یا مغایرت شماره شبای زیان‌دیده جهت واریز خسارت</option>
                  <option value="عدم پاسخ یا تایید مبلغ ارزیابی توسط زیان‌دیده">عدم پاسخ یا تایید مبلغ ارزیابی توسط زیان‌دیده</option>
                  <option value="نیاز به بارگذاری کروکی پلیس و گزارش حادثه">نیاز به بارگذاری کروکی پلیس و گزارش حادثه</option>
                  <option value="هماهنگی حضور خودرو در تعمیرگاه / مرکز بازدید">هماهنگی حضور خودرو در تعمیرگاه / مرکز بازدید</option>
                  <option value="سایر موارد و پیگیری ضروری">سایر موارد و پیگیری ضروری</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  سطح اولویت پیگیری:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['عادی', 'مهم', 'فوری و بحرانی'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCrmRequestPriority(p)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        crmRequestPriority === p
                          ? p === 'فوری و بحرانی'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : p === 'مهم'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  توضیحات و نکات کارشناس برای تیم پشتیبانی امور مشتریان:
                </label>
                <textarea
                  rows={3}
                  value={crmRequestNotes}
                  onChange={(e) => setCrmRequestNotes(e.target.value)}
                  placeholder="نکات خاصی که کارشناس امور مشتریان باید هنگام تماس به زیان‌دیده اعلام کند..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSubmitCrmContactRequest}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>ارسال درخواست به کارتابل اقدامات معوق CRM</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCrmRequestModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: دستورالعمل و توضیحات شرکت بیمه‌گر */}
      {insurerNoteModalCase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 border border-slate-200 animate-in zoom-in-95 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">دستورالعمل و توضیحات شرکت بیمه‌گر</h3>
                  <p className="text-xs text-slate-500 font-mono">پرونده {insurerNoteModalCase.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInsurerNoteModalCase(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Case Info Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">شرکت بیمه‌گر:</span>
                <strong className="text-purple-900 font-black">{getInsurerPersianName(insurerNoteModalCase.culpritInsurer) || 'نامشخص'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">خودرو زیان‌دیده:</span>
                <strong className="text-slate-800">{insurerNoteModalCase.carType}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">شماره پلاک:</span>
                <strong className="text-slate-800 font-mono text-[11px]">{insurerNoteModalCase.victimPlate}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">زیان‌دیده:</span>
                <strong className="text-slate-800">{insurerNoteModalCase.victimName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">مقصر حادثه:</span>
                <strong className="text-slate-800">{insurerNoteModalCase.culpritName} ({insurerNoteModalCase.culpritCarType})</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">سقف تعهد مالی:</span>
                <strong className="text-emerald-700 font-black">{((insurerNoteModalCase.culpritCoverageFinancial || 50000000) / 10).toLocaleString('fa-IR')} تومان</strong>
              </div>
            </div>

            {/* The Note Body */}
            <div className="space-y-2 text-right">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>متن یادداشت و دستور کار ابلاغی از سوی شرکت بیمه‌گر:</span>
              </label>
              
              <div className="p-4 rounded-2xl bg-purple-50/90 border-2 border-purple-200 text-purple-950 space-y-3">
                <p className="text-sm font-extrabold leading-relaxed">
                  «{insurerNoteModalCase.insurerInstruction || insurerNoteModalCase.insurerAssignmentNote || 'توضیحات تکمیلی خاصی توسط شرکت بیمه‌گر ثبت نشده است. ارزیابی بر اساس ضوابط استاندارد و قطعات آسیب‌دیده انجام گیرد.'}»
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-200/80 text-[11px] text-purple-800 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>ثبت توسط: <strong>{insurerNoteModalCase.insurerNoteAuthor || 'کارشناس پذیرش پورتال بیمه‌گر'}</strong></span>
                  </span>
                  {insurerNoteModalCase.insurerNoteDate && (
                    <span className="font-mono text-[10px]">
                      تاریخ ارجاع: {insurerNoteModalCase.insurerNoteDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInsurerNoteModalCase(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                بستن
              </button>
              {(insurerNoteModalCase.status.includes('محول') || insurerNoteModalCase.status === 'ارزیابی‌نشده') ? (
                <button
                  type="button"
                  onClick={() => {
                    const current = insurerNoteModalCase;
                    setInsurerNoteModalCase(null);
                    setAcceptModalCase(current);
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>ورود به قبول ارزیابی</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGNMENT TO REVIEWER SUCCESS & SMS NOTIFICATION */}
      {assignmentSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 text-slate-900 animate-in zoom-in-95" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    برآورد خسارت ثبت و ارجاع داده شد
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    شماره پرونده: {assignmentSuccessModal.caseId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignmentSuccessModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>پرونده شما به بازبین کیفی زیر ارجاع شد:</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">نام بازبین اختصاصی:</span>
                    <strong className="text-slate-900">{assignmentSuccessModal.reviewerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">مبلغ خالص قابل پرداخت:</span>
                    <strong className="font-mono text-emerald-800">{formatCurrency(assignmentSuccessModal.payable)}</strong>
                  </div>
                </div>
              </div>

              {/* Simulated SMS Notification */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-950">
                  <Smartphone className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>پیامک ارسال‌شده به تلفن همراه بازبین:</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-blue-100 text-[11px] font-medium text-slate-800 leading-relaxed font-sans space-y-1">
                  <p>
                    «بازبین محترم ({assignmentSuccessModal.reviewerName})، پرونده خسارت شماره <strong>{assignmentSuccessModal.caseId}</strong> ارزیابی گردید و جهت بازبینی کیفی به شما واگذار شد. پورتال خسارت بیمه»
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono border-t border-slate-100">
                    <span>گیرنده: {assignmentSuccessModal.reviewerPhone || '۰۹۱۲۲۱۴۵۶۷۸'}</span>
                    <span className="text-emerald-700 font-bold">وضعیت: تحویل شد (SMS Sent)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setAssignmentSuccessModal(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
              >
                متوجه شدم و بازگشت به لیست پرونده‌ها
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PAGE MODAL: PREVIOUS EXPERT ASSESSMENT DETAILED VIEWER (دیدن صفحه و بستن صفحه) */}
      {selectedPrevAssessmentModal && activeCase && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in overflow-y-auto">
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 text-slate-900 overflow-hidden animate-in zoom-in-95 my-auto"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-md">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold shadow-sm shrink-0">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-base sm:text-lg text-white">
                      صفحه ارزیابی و برآورد کارشناس قبلی
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-xs">
                      {selectedPrevAssessmentModal.round || 'ارزیابی اول'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 font-bold text-xs border border-purple-400/30 font-mono">
                      پرونده: {activeCase.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    کارشناس ثبت‌کننده: <strong className="text-white">{selectedPrevAssessmentModal.expertName}</strong> | تاریخ و ساعت ثبت: <span className="font-mono text-amber-300 font-bold">{selectedPrevAssessmentModal.submittedAt}</span>
                  </p>
                </div>
              </div>

              {/* Close Button Top */}
              <button
                type="button"
                onClick={() => setSelectedPrevAssessmentModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/20 shrink-0 self-start sm:self-auto"
              >
                <span>بستن صفحه</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* 1. Customer Objection Reason Banner */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl space-y-2.5 text-amber-950 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>شکواییه و علت اعتراض ثبت‌شده توسط زیان‌دیده (مشتری)</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 font-extrabold text-[11px]">
                    مرحله {activeCase.objectionStage || 1} اعتراض
                  </span>
                </div>
                
                <div className="bg-white/90 p-4 rounded-xl border border-amber-200 text-slate-900 space-y-1.5 leading-relaxed font-medium">
                  <span className="text-slate-500 font-bold block text-[11px]">شرح اعتراض زیان‌دیده ({activeCase.victimName || 'مشتری'}):</span>
                  <p className="text-slate-900 font-bold text-xs sm:text-sm">
                    «{activeCase.reassessReason || 'زیان‌دیده نسبت به برآورد اولیه و عدم تایید تعویض سپر و درب صندوق اعتراض داشته و اعلام نموده هزینه‌های واقعی تعمیرات بیشتر از رقم مصوب کارشناس اول است.'}»
                  </p>
                </div>

                {/* Objection Chat messages if available */}
                {activeCase.objectionChat && activeCase.objectionChat.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-amber-200/80">
                    <span className="font-extrabold text-amber-900 block text-[11px]">پیام‌های رد و بدل شده در چت اعتراض:</span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {activeCase.objectionChat.map((msg, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-white border border-amber-100 text-xs flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-800">{msg.name}: <span className="font-normal text-slate-700">{msg.text}</span></span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{msg.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Financial Summary Cards */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                  <span>خلاصه محاسبات مالی و ارقام مصوب کارشناس اول</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <span className="text-slate-500 font-extrabold text-[11px] block">۱. خسارت ناخالص قطعات و اجرت</span>
                    <div className="font-black font-mono text-slate-900 text-base">
                      {formatCurrency(selectedPrevAssessmentModal.gross)}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">
                      {rialToPersianToman(selectedPrevAssessmentModal.gross || 0)}
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                    <span className="text-rose-700 font-extrabold text-[11px] block">۲. فرانشیز و کسورات قانونی</span>
                    <div className="font-black font-mono text-rose-800 text-base">
                      {formatCurrency(selectedPrevAssessmentModal.deductions)}
                    </div>
                    <div className="text-[10px] text-rose-600 font-medium leading-tight">
                      {rialToPersianToman(selectedPrevAssessmentModal.deductions || 0)}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                    <span className="text-amber-800 font-extrabold text-[11px] block">۳. کسر ارزش داغی / اسقاط</span>
                    <div className="font-black font-mono text-amber-900 text-base">
                      {formatCurrency(selectedPrevAssessmentModal.salvage)}
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium leading-tight">
                      {rialToPersianToman(selectedPrevAssessmentModal.salvage || 0)}
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-2xl space-y-1.5 shadow-2xs">
                    <span className="text-purple-800 font-black text-[11px] block">۴. خالص پرداختی مصوب کارشناس قبل</span>
                    <div className="font-black font-mono text-purple-950 text-lg">
                      {formatCurrency(selectedPrevAssessmentModal.payable)}
                    </div>
                    <div className="text-[10px] text-purple-700 font-bold leading-tight">
                      {rialToPersianToman(selectedPrevAssessmentModal.payable || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Official Notes & Reviewer Instructions */}
              <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>توضیحات و گزارش فنی کارشناس ثبت‌کننده اولیه ({selectedPrevAssessmentModal.expertName})</span>
                </h4>
                <p className="font-medium text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                  {selectedPrevAssessmentModal.reviewerNote || 'توضیحات تکمیلی توسط کارشناس ثبت نگردیده است. ارزیابی بر اساس تصاویر و مستندات خسارت خودرو انجام شده است.'}
                </p>
              </div>

              {/* 4. Full Itemized Parts and Labor Breakdown Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Car className="w-4 h-4 text-purple-600" />
                    <span>جدول ریز اقلام، قطعات تعویضی و اجرت‌های صافکاری/نقاشی کارشناس قبل</span>
                  </h4>
                  <span className="text-slate-500 font-bold text-xs">
                    تعداد اقلام: {selectedPrevAssessmentModal.parts?.length || 0} ردیف
                  </span>
                </div>

                {selectedPrevAssessmentModal.parts && selectedPrevAssessmentModal.parts.length > 0 ? (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">ردیف</th>
                          <th className="p-3.5">نام قطعه / بخش خودرو</th>
                          <th className="p-3.5">نوع اقدام</th>
                          <th className="p-3.5">قیمت قطعه</th>
                          <th className="p-3.5">اجرت تعمیر / نقاشی</th>
                          <th className="p-3.5">کسر داغی</th>
                          <th className="p-3.5">جمع کل ردیف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800 bg-white">
                        {selectedPrevAssessmentModal.parts.map((p: any, idx: number) => {
                          const rowTotal = (p.partPrice || 0) + (p.repairPrice || 0) - (p.salvageValue || 0);
                          return (
                            <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                              <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                                  p.type === 'replace' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                  {p.type === 'replace' ? 'تعویض قطعه' : 'تعمیر / صافکاری / نقاشی'}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono">{formatCurrency(p.partPrice || 0)}</td>
                              <td className="p-3.5 font-mono">{formatCurrency(p.repairPrice || 0)}</td>
                              <td className="p-3.5 font-mono text-amber-700 font-bold">{formatCurrency(p.salvageValue || 0)}</td>
                              <td className="p-3.5 font-mono font-black text-purple-900">{formatCurrency(rowTotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200 text-slate-900">
                        <tr>
                          <td colSpan={3} className="p-3.5 text-left font-black">جمع کل اقلام کارشناس قبل:</td>
                          <td className="p-3.5 font-mono">
                            {formatCurrency(selectedPrevAssessmentModal.parts.reduce((s: number, p: any) => s + (p.partPrice || 0), 0))}
                          </td>
                          <td className="p-3.5 font-mono">
                            {formatCurrency(selectedPrevAssessmentModal.parts.reduce((s: number, p: any) => s + (p.repairPrice || 0), 0))}
                          </td>
                          <td className="p-3.5 font-mono text-amber-700">
                            {formatCurrency(selectedPrevAssessmentModal.parts.reduce((s: number, p: any) => s + (p.salvageValue || 0), 0))}
                          </td>
                          <td className="p-3.5 font-mono text-purple-950 text-sm">
                            {formatCurrency(selectedPrevAssessmentModal.gross)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 font-bold">
                    اقلام تفکیکی قطعات برای این ارزیابی ثبت نشده است.
                  </div>
                )}
              </div>

              {/* 5. AI Findings Recorded in that round if any */}
              {selectedPrevAssessmentModal.aiDecisions && selectedPrevAssessmentModal.aiDecisions.length > 0 && (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2">
                  <h4 className="font-black text-purple-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>تصمیمات هوش مصنوعی ثبت‌شده در ارزیابی اول:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedPrevAssessmentModal.aiDecisions.map((ai: any, i: number) => (
                      <div key={i} className="p-2.5 bg-white rounded-xl border border-purple-100 text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-800">{ai.part || ai.label} ({ai.operation})</span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                          {ai.decision === 'APPROVED' ? 'تایید شد' : ai.decision === 'REJECTED' ? 'رد شد' : 'بررسی شد'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer with Close and Copy Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleCopyPrevAssessmentToCurrent(selectedPrevAssessmentModal);
                  setSelectedPrevAssessmentModal(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-purple-300 shadow-2xs"
              >
                <Copy className="w-4 h-4 text-purple-700" />
                <span>کپی کلیه اقلام کارشناس قبل در برآورد جاری من</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPrevAssessmentModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <X className="w-4 h-4" />
                <span>بستن صفحه و بازگشت به کارتابل ارزیابی</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
