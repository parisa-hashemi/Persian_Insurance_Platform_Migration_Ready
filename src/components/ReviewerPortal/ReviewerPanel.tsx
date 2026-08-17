import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Search,
  FileText,
  MapPin,
  User,
  Clock,
  Car,
  MessageSquare,
  Building2,
  Phone,
  CreditCard,
  Send,
  Sparkles,
  FileCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  ExternalLink,
  ChevronLeft,
  Eye,
  Layers,
  Wrench,
  Compass,
  Maximize2,
  Smartphone,
  Bell,
  Paperclip,
  CheckCheck,
  Lock,
  Archive,
  CheckCheck as CheckDouble,
  SlidersHorizontal,
  X,
  Filter,
  Tag,
  Video,
  Mic,
  Volume2,
  Play,
  Pause,
  Download,
  Film,
  Headphones,
  Music
} from 'lucide-react';
import { ClaimCase, UserSession, PartItem } from '../../types';
import { formatCurrency, parseMoneyNumber, getInsurerPersianName } from '../../lib/storage';
import { PoliceCroquiReportView } from '../common/PoliceCroquiReportView';
import { getStandardPoliceReport } from '../../lib/policeCroquiHelper';

// Helper to normalize Persian/Arabic numbers and letters for high-accuracy search
const normalizeSearchText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, (d) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[-_/\s]/g, '')
    .trim();
};

interface ReviewerPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updatedCase: ClaimCase) => void;
  onLogout?: () => void;
}

type CardViewMode = 'overview' | 'victim' | 'culprit' | 'docs' | 'police' | 'assessment';

export const ReviewerPanel: React.FC<ReviewerPanelProps> = ({
  session,
  cases,
  onUpdateCase,
  onLogout
}) => {
  const companyCode = session.company || 'dana';
  const companyPersianName = getInsurerPersianName(companyCode);

  // States
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCardTab, setActiveCardTab] = useState<CardViewMode>('overview');
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTag, setSearchTag] = useState<'all' | 'kroki' | 'peugeot' | 'saipa' | 'depreciation' | 'returned'>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState<{
    url: string;
    name: string;
    type: 'image' | 'video' | 'audio' | 'pdf' | 'document' | string;
    category?: string;
    uploader?: string;
    date?: string;
    note?: string;
  } | null>(null);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOC' | 'KROKI'>('ALL');
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [showQuickSearchModal, setShowQuickSearchModal] = useState<boolean>(false);
  
  // Decision Form State
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter cases for reviewer's company
  const companyCases = cases.filter(
    (c) =>
      !c.culpritInsurer ||
      c.culpritInsurer.toLowerCase() === companyCode.toLowerCase() ||
      c.victimInsurer?.toLowerCase() === companyCode.toLowerCase() ||
      c.assignedReviewer?.company?.toLowerCase() === companyCode.toLowerCase() ||
      companyCode === 'dana'
  );

  // Case counts by status
  const pendingCases = companyCases.filter((c) =>
    c.status === 'در انتظار بررسی بازبین' ||
    c.status === 'در حال بازبینی' ||
    c.status === 'در انتظار ارزیابی بازبین' ||
    c.assessment?.status === 'SUBMITTED'
  );

  const approvedCases = companyCases.filter((c) =>
    c.status === 'در انتظار تایید کاربر' ||
    c.status === 'در انتظار تایید زیان‌دیده' ||
    c.status === 'در انتظار پرداخت' ||
    c.status === 'پرداخت شده' ||
    c.approvedByReviewer
  );

  const rejectedCases = companyCases.filter((c) =>
    c.status === 'نیازمند اصلاح توسط کارشناس' ||
    c.status === 'عودت داده شده به کارشناس' ||
    c.reviewerReturnReason ||
    c.assessment?.reviewerReturnReason
  );

  // Filtered case list based on selected tab, search tags, and search query
  const filteredCases = companyCases.filter((c) => {
    // 1. Status Filter Tab
    if (filterTab === 'pending') {
      const isPending =
        c.status === 'در انتظار بررسی بازبین' ||
        c.status === 'در حال بازبینی' ||
        c.status === 'در انتظار ارزیابی بازبین' ||
        (c.assessment?.status === 'SUBMITTED' && !c.approvedByReviewer);
      if (!isPending) return false;
    } else if (filterTab === 'approved') {
      const isApproved =
        c.status === 'در انتظار تایید کاربر' ||
        c.status === 'در انتظار تایید زیان‌دیده' ||
        c.status === 'در انتظار پرداخت' ||
        c.status === 'پرداخت شده' ||
        c.approvedByReviewer;
      if (!isApproved) return false;
    } else if (filterTab === 'rejected') {
      const isRejected =
        c.status === 'نیازمند اصلاح توسط کارشناس' ||
        c.status === 'عودت داده شده به کارشناس' ||
        c.status === 'در حال ارزیابی' ||
        !!c.reviewerReturnReason ||
        !!c.assessment?.reviewerReturnReason;
      if (!isRejected) return false;
    }

    // 2. Quick Search Tag Pills
    if (searchTag === 'kroki') {
      const hasKroki = !!c.croquiData?.reportNumber || !!c.policeReport?.code || !!c.customerKrokiPhoto || !!c.customerKrokiNumber;
      if (!hasKroki) return false;
    } else if (searchTag === 'peugeot') {
      const isPeugeot = (c.carType || '').includes('پژو') || (c.culpritCarType || '').includes('پژو');
      if (!isPeugeot) return false;
    } else if (searchTag === 'saipa') {
      const isSaipa = (c.carType || '').includes('پراید') || (c.carType || '').includes('تیبا') || (c.carType || '').includes('کوییک') || (c.carType || '').includes('ساینا') || (c.culpritCarType || '').includes('پراید');
      if (!isSaipa) return false;
    } else if (searchTag === 'depreciation') {
      const hasDepr = (c.assessment?.depreciationAmount || 0) > 0 || (c.assessment?.customDepreciationAmount || 0) > 0;
      if (!hasDepr) return false;
    } else if (searchTag === 'returned') {
      const isReturned = !!c.reviewerReturnReason || !!c.assessment?.reviewerReturnReason;
      if (!isReturned) return false;
    }

    // 3. Multi-field Deep Search Query
    if (searchQuery.trim()) {
      const rawQ = searchQuery.trim().toLowerCase();
      const normQ = normalizeSearchText(searchQuery);

      const fieldsToMatch = [
        c.id,
        c.victimName,
        c.victimPhone,
        c.victimNationalId,
        c.victimPlate,
        c.carType,
        c.culpritName,
        c.culpritPhone,
        c.culpritNationalId,
        c.culpritPlate,
        c.culpritCarType,
        c.assessment?.expertName,
        c.assignedExpert?.name,
        c.croquiData?.reportNumber,
        c.policeReport?.code,
        c.customerKrokiNumber,
        c.branch,
        c.incidentLocation || c.location,
        c.writtenReport
      ];

      const matchesRaw = fieldsToMatch.some((field) =>
        field && field.toString().toLowerCase().includes(rawQ)
      );

      const matchesNormalized = fieldsToMatch.some((field) => {
        if (!field) return false;
        const normField = normalizeSearchText(field.toString());
        return normField.includes(normQ);
      });

      return matchesRaw || matchesNormalized;
    }

    return true;
  });

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  // Check if the selected case is already processed (approved, returned to adjuster, or advanced in workflow)
  // When locked, the reviewer can view all 5 cards and documents in read-only mode, but cannot re-submit or change actions.
  const isCasePendingReview = !!activeCase && (
    activeCase.status === 'در انتظار بررسی بازبین' ||
    activeCase.status === 'در حال بازبینی' ||
    activeCase.status === 'در انتظار ارزیابی بازبین' ||
    (activeCase.assessment?.status === 'SUBMITTED' && !activeCase.approvedByReviewer)
  );

  const isCaseLocked = !!activeCase && !isCasePendingReview;
  const isCaseApproved = !!activeCase && (
    activeCase.approvedByReviewer ||
    activeCase.status === 'در انتظار تایید کاربر' ||
    activeCase.status === 'در انتظار تایید زیان‌دیده' ||
    activeCase.status === 'در انتظار پرداخت' ||
    activeCase.status === 'پرداخت شده'
  );
  const isCaseReturned = !!activeCase && (
    !isCaseApproved && (
      activeCase.status === 'نیازمند اصلاح توسط کارشناس' ||
      activeCase.status === 'عودت داده شده به کارشناس' ||
      activeCase.status === 'در حال ارزیابی' ||
      !!activeCase.reviewerReturnReason ||
      !!activeCase.assessment?.reviewerReturnReason
    )
  );

  // Select case handler
  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveCardTab('overview');
  };

  // Actions: Approve Claim
  const handleApproveClaim = () => {
    if (!activeCase) return;

    const reviewerName = session.name || 'بازبین ارشد کیفیت';
    const updatedCase: ClaimCase = {
      ...activeCase,
      status: 'در انتظار تایید کاربر',
      approvedByReviewer: true,
      reviewerReturnReason: undefined,
      assessment: activeCase.assessment
        ? {
            ...activeCase.assessment,
            status: 'PUBLISHED',
            reviewerNote: activeCase.assessment.reviewerNote || 'تایید شده توسط بازبین کیفیت'
          }
        : undefined,
      assessments: activeCase.assessments
        ? activeCase.assessments.map((a, i) =>
            i === activeCase.assessments!.length - 1
              ? { ...a, status: 'PUBLISHED', approvedByReviewer: true }
              : a
          )
        : undefined,
      docChat: [
        ...(activeCase.docChat || []),
        {
          id: `MSG-${Date.now()}`,
          from: 'system',
          senderParty: 'SYSTEM',
          by: reviewerName,
          text: `اطلاعیه بازبینی: پرونده توسط بازبین کیفی (${reviewerName}) تایید گردید و جهت اخذ تایید نهایی و شماره شبا به زیان‌دیده ارجاع شد.`,
          at: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        }
      ],
      history: [
        ...(activeCase.history || []),
        {
          status: 'در انتظار تایید کاربر',
          time: new Date().toLocaleString('fa-IR'),
          user: reviewerName,
          note: `پرونده خسارت توسط بازبین کیفیت (${reviewerName}) تایید شد و جهت تایید نهایی کاربر به زیان‌دیده ارسال گردید.`
        }
      ]
    };

    onUpdateCase(updatedCase);
    setShowApproveModal(false);
    setActionSuccessMsg('پرونده با موفقیت تایید شد و جهت اخذ تایید نهایی و شماره شبا به زیان‌دیده منتقل گردید.');
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // Actions: Reject/Return to Adjuster with Reason
  const handleRejectClaim = () => {
    if (!activeCase || !rejectReason.trim()) return;

    const reviewerName = session.name || 'بازبین ارشد کیفیت';
    const reasonText = rejectReason.trim();

    const updatedCase: ClaimCase = {
      ...activeCase,
      status: 'در حال ارزیابی',
      approvedByReviewer: false,
      reviewerReturnReason: reasonText,
      assessment: activeCase.assessment
        ? {
            ...activeCase.assessment,
            status: 'RETURNED',
            reviewerReturnReason: reasonText
          }
        : undefined,
      docChat: [
        ...(activeCase.docChat || []),
        {
          id: `MSG-${Date.now()}`,
          from: 'system',
          senderParty: 'SYSTEM',
          by: reviewerName,
          text: `هشدار بازبین به کارشناس خسارت: پرونده جهت اصلاح ارجاع داده شد. علت: ${reasonText}`,
          at: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        }
      ],
      history: [
        ...(activeCase.history || []),
        {
          status: 'در حال ارزیابی (عودت به کارشناس)',
          time: new Date().toLocaleString('fa-IR'),
          user: reviewerName,
          note: `عودت پرونده به کارشناس خسارت توسط بازبین (${reviewerName}). دلیل عدم تایید: ${reasonText}`
        }
      ]
    };

    onUpdateCase(updatedCase);
    setShowRejectModal(false);
    setRejectReason('');
    setActionSuccessMsg('پرونده با موفقیت جهت اصلاح به کارشناس خسارت عودت داده شد.');
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const policeDetails = activeCase ? getStandardPoliceReport(activeCase) : null;

  const cardNavList = [
    { id: 'victim', label: 'کارت ۱: اطلاعات زیان‌دیده', shortLabel: 'زیان‌دیده', icon: User, color: 'text-emerald-700' },
    { id: 'culprit', label: 'کارت ۲: اطلاعات مقصر حادثه', shortLabel: 'مقصر حادثه', icon: ShieldCheck, color: 'text-rose-700' },
    { id: 'docs', label: 'کارت ۳: مدارک و تصاویر', shortLabel: 'مدارک و تصاویر', icon: ImageIcon, color: 'text-blue-700' },
    { id: 'police', label: 'کارت ۴: گزارش پلیس و استعلام کروکی', shortLabel: 'گزارش پلیس و کروکی', icon: FileCheck, color: 'text-amber-700' },
    { id: 'assessment', label: 'کارت ۵: برآورد کارشناسی خسارت', shortLabel: 'برآورد کارشناس', icon: Wrench, color: 'text-purple-700' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-black">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>پورتال تخصصی بازبین کیفیت بیمه</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            بررسی تخصصی، کنترل مدارک و تایید برآورد خسارت
          </h1>
          <p className="text-xs text-slate-300 font-medium">
            بازبین محترم: <span className="font-bold text-white">{session.name}</span> | شرکت: <span className="font-bold text-amber-300">{companyPersianName}</span>
          </p>
        </div>

        {selectedCaseId ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickSearchModal(true)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
              title="جستجوی سریع در کل پرونده‌ها"
            >
              <Search className="w-4 h-4 text-blue-300" />
              <span>جستجوی سریع</span>
            </button>
            <button
              onClick={() => setShowSmsModal(true)}
              className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span>پیامک‌های همراه بازبین</span>
              {pendingCases.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black flex items-center justify-center">
                  {pendingCases.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedCaseId(null);
                setActiveCardTab('overview');
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md border border-white/20 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به صف پرونده‌ها</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuickSearchModal(true)}
              className="px-3.5 py-2.5 bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border border-blue-400/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <Search className="w-4 h-4 text-blue-300" />
              <span>جستجوی سریع پرونده</span>
            </button>
            <button
              onClick={() => setShowSmsModal(true)}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span>پیامک‌های دریافتی تلفن همراه</span>
              {pendingCases.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black flex items-center justify-center">
                  {pendingCases.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-white/80 hover:text-white font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: CLAIM QUEUE / LIST */}
      {!selectedCaseId ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setFilterTab('pending')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                filterTab === 'pending'
                  ? 'bg-blue-900 text-white border-blue-500 shadow-lg ring-2 ring-blue-400'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-black">{pendingCases.length}</span>
              </div>
              <p className="text-xs font-black">در انتظار بررسی بازبین</p>
            </div>

            <div
              onClick={() => setFilterTab('approved')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                filterTab === 'approved'
                  ? 'bg-blue-900 text-white border-blue-500 shadow-lg ring-2 ring-blue-400'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-2xl font-black">{approvedCases.length}</span>
              </div>
              <p className="text-xs font-black">تایید شده توسط بازبین</p>
            </div>

            <div
              onClick={() => setFilterTab('rejected')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                filterTab === 'rejected'
                  ? 'bg-blue-900 text-white border-blue-500 shadow-lg ring-2 ring-blue-400'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span className="text-2xl font-black">{rejectedCases.length}</span>
              </div>
              <p className="text-xs font-black">عودت داده شده به کارشناس</p>
            </div>

            <div
              onClick={() => setFilterTab('all')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                filterTab === 'all'
                  ? 'bg-blue-900 text-white border-blue-500 shadow-lg ring-2 ring-blue-400'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <FileCheck className="w-5 h-5 text-indigo-500" />
                <span className="text-2xl font-black">{companyCases.length}</span>
              </div>
              <p className="text-xs font-black">کل پرونده‌ها</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[280px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی سریع: شماره پرونده (مثلاً CF-...)، نام زیان‌دیده یا مقصر، شماره پلاک، مدل خودرو، نام کارشناس..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 absolute left-3 top-3 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                    title="پاک کردن جستجو"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setFilterTab('pending')}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    filterTab === 'pending'
                      ? 'bg-blue-600 text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>در انتظار بررسی ({pendingCases.length})</span>
                </button>
                <button
                  onClick={() => setFilterTab('approved')}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    filterTab === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تایید شده ({approvedCases.length})</span>
                </button>
                <button
                  onClick={() => setFilterTab('rejected')}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    filterTab === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>اصلاحی / عودت ({rejectedCases.length})</span>
                </button>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-slate-800 text-white shadow-xs font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>همه ({companyCases.length})</span>
                </button>
              </div>
            </div>

            {/* Quick Search Tag Filters & Result Count */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-[11px] font-extrabold text-slate-400 flex items-center gap-1 shrink-0 ml-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  برچسب‌های فیلتر:
                </span>

                <button
                  type="button"
                  onClick={() => setSearchTag('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    searchTag === 'all'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  همه
                </button>

                <button
                  type="button"
                  onClick={() => setSearchTag('kroki')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchTag === 'kroki'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>📋 دارای کروکی پلیس</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchTag('peugeot')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchTag === 'peugeot'
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>🚗 خودروهای پژو</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchTag('saipa')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchTag === 'saipa'
                      ? 'bg-teal-100 text-teal-900 border border-teal-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>🚙 خودروهای سایپا</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchTag('depreciation')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchTag === 'depreciation'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>💰 دارای افت قیمت</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSearchTag('returned')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    searchTag === 'returned'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>⚠️ عودت داده شده</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">
                  تعداد پرونده‌های منطبق: <strong className="text-slate-900 font-mono text-xs">{filteredCases.length}</strong> از <span className="font-mono">{companyCases.length}</span>
                </span>
                {(searchQuery || searchTag !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchTag('all');
                    }}
                    className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
                  >
                    حذف فیلترها
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cases List */}
          {filteredCases.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-extrabold text-sm text-slate-700">هیچ پرونده‌ای در این بخش یافت نشد.</p>
              <p className="text-xs text-slate-400">می‌توانید فیلترها را تغییر داده یا عبارت دیگری جستجو کنید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCases.map((claim) => {
                const claimPolice = getStandardPoliceReport(claim);
                const hasAss = !!claim.assessment;
                const isPending =
                  claim.status === 'در انتظار بررسی بازبین' ||
                  claim.status === 'در حال بازبینی' ||
                  claim.status === 'در انتظار ارزیابی بازبین' ||
                  (claim.assessment?.status === 'SUBMITTED' && !claim.approvedByReviewer);

                return (
                  <div
                    key={claim.id}
                    onClick={() => handleSelectCase(claim.id)}
                    className="bg-white rounded-3xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all p-5 space-y-4 cursor-pointer relative group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                          {claim.id}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            claim.approvedByReviewer
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : claim.reviewerReturnReason
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>

                      {/* Cars & Parties */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500 font-medium">زیان‌دیده:</span>
                          <strong className="text-slate-900 font-bold">{claim.victimName || 'نامشخص'} ({claim.carType || 'خودرو'})</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500 font-medium">پلاک زیان‌دیده:</span>
                          <span className="font-mono font-bold text-slate-900">{claim.victimPlate || claim.plate}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="text-slate-500 font-medium">مقصر حادثه:</span>
                          <span className="font-bold text-rose-900">{claim.culpritName || 'نامشخص'} ({claim.culpritCarType || 'خودرو'})</span>
                        </div>
                        {/* Croqui status badge */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-500 font-medium">نوع کروکی:</span>
                          <span className={`font-extrabold px-2 py-0.5 rounded-md ${
                            claimPolice.croquiType === 'electronic'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}>
                            {claimPolice.croquiType === 'electronic' ? 'کروکی الکترونیکی' : 'کروکی کاغذی'}
                          </span>
                        </div>
                      </div>

                      {/* Assessment preview */}
                      {hasAss && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block">مبلغ نهایی برآورد:</span>
                            <span className="font-mono font-black text-emerald-800 text-sm">
                              {formatCurrency(claim.assessment?.payable || 0)}
                            </span>
                          </div>
                          <span className="text-[10px] text-purple-900 font-bold bg-purple-100 px-2 py-1 rounded-lg">
                            ارزیاب: {claim.assessment?.submittedBy || 'کارشناس خسارت'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Open Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-black group-hover:text-blue-900">
                      <span>مشاهده ۵ کارت اطلاعات پرونده</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeCase ? (
        /* VIEW 2: ACTIVE CASE WORKSPACE WITH SPACE-SAVING 5 CARDS */
        <div className="space-y-6">
          {/* Active Case Top Navigation & Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (activeCardTab !== 'overview') {
                      setActiveCardTab('overview');
                    } else {
                      setSelectedCaseId(null);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>{activeCardTab !== 'overview' ? 'بازگشت به ۵ کارت پرونده' : 'بازگشت به صف پرونده‌ها'}</span>
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">
                    پرونده <span className="font-mono text-blue-900">{activeCase.id}</span>
                  </h2>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-xl border ${
                      activeCase.approvedByReviewer
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : activeCase.reviewerReturnReason
                        ? 'bg-rose-50 text-rose-900 border-rose-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    {activeCase.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick summary badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">زیان‌دیده:</span>
                <span className="font-extrabold text-slate-900">{activeCase.victimName} ({activeCase.carType})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">مقصر حادثه:</span>
                <span className="font-extrabold text-rose-900">{activeCase.culpritName} ({activeCase.culpritCarType})</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px]">استعلام کروکی فراجا:</span>
                <span className="font-extrabold text-blue-900">{policeDetails?.croquiTypePersian.split('(')[0]}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="text-emerald-700 font-bold block text-[10px]">خسارت قابل پرداخت:</span>
                <span className="font-mono font-black text-emerald-950 text-sm">
                  {formatCurrency(activeCase.assessment?.payable || 0)}
                </span>
              </div>
            </div>

            {/* Case Processing Status / Read-only Notice */}
            {isCaseLocked && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 text-xs ${
                isCaseApproved
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                    isCaseApproved ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                  }`}>
                    {isCaseApproved ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-black text-xs">
                      {isCaseApproved ? 'این پرونده توسط بازبین تایید نهایی شده است (حالت فقط خواندنی)' : 'این پرونده به کارشناس عودت داده شده است (حالت فقط خواندنی)'}
                    </h4>
                    <p className="text-[11px] opacity-80 font-medium mt-0.5">
                      {isCaseApproved
                        ? 'پرونده از صف بازبینی خارج شده و جهت مشاهده و تایید مبلغ به زیان‌دیده ارجاع گردیده است. تمامی ۵ کارت پرونده و مدارک صرفاً جهت مشاهده و بازخوانی در دسترس است.'
                        : 'پرونده جهت رفع نواقص و تجدید ارزیابی در اختیار کارشناس خسارت قرار دارد. پس از ثبت اصلاحیه مجدد توسط کارشناس، امکان بازبینی فعال خواهد شد.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/80 rounded-xl font-black text-xs border shadow-xs flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>غیرقابل ویرایش توسط بازبین</span>
                  </span>
                </div>
              </div>
            )}

            {/* If on dedicated card page, show quick switcher tabs */}
            {activeCardTab !== 'overview' && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setActiveCardTab('overview')}
                  className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>نمای ۵ کارت</span>
                </button>
                {cardNavList.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeCardTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCardTab(tab.id as CardViewMode)}
                      className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SUB-VIEW A: 5 COMPACT INTERACTIVE CARDS OVERVIEW (SPACE SAVING) */}
          {/* ========================================================================= */}
          {activeCardTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">کارت‌های ۵ گانه پرونده خسارت</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    برای بررسی عمیق و مشاهده فرم اختصاصی هر بخش، روی کارت مربوطه کلیک نمایید:
                  </p>
                </div>
              </div>

              {/* 5 Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* CARD 1: VICTIM */}
                <div
                  onClick={() => setActiveCardTab('victim')}
                  className="bg-white rounded-3xl p-5 border-2 border-emerald-200 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <User className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-emerald-950">کارت ۱: اطلاعات زیان‌دیده</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200">
                        طرف اول (زیان‌دیده)
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">نام:</span>
                        <strong className="text-slate-900">{activeCase.victimName || 'پریسا حسینی'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">خودرو و پلاک:</span>
                        <span className="font-bold text-slate-900">{activeCase.carType} — <span className="font-mono text-xs">{activeCase.victimPlate || activeCase.plate}</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">شماره تماس:</span>
                        <span className="font-mono text-[11px] font-bold text-slate-800">
                          {activeCase.victimPhone || '۰۹۱۲۳۴۵۶۷۸۹'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-black group-hover:text-emerald-900">
                    <span>مشاهده صفحه کامل زیان‌دیده</span>
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>

                {/* CARD 2: CULPRIT */}
                <div
                  onClick={() => setActiveCardTab('culprit')}
                  className="bg-white rounded-3xl p-5 border-2 border-rose-200 hover:border-rose-500 hover:shadow-xl transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-rose-950">کارت ۲: اطلاعات مقصر حادثه</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-200">
                        طرف دوم (مقصر ۱۰۰٪)
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">نام:</span>
                        <strong className="text-slate-900">{activeCase.culpritName || 'رضا کاظمی'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">خودرو و پلاک:</span>
                        <span className="font-bold text-slate-900">{activeCase.culpritCarType} — <span className="font-mono text-xs">{activeCase.culpritPlate}</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">بیمه‌گر مقصر:</span>
                        <span className="font-extrabold text-rose-900">{getInsurerPersianName(activeCase.culpritInsurer)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-rose-700 font-black group-hover:text-rose-900">
                    <span>مشاهده صفحه کامل مقصر حادثه</span>
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>

                {/* CARD 3: DOCUMENTS */}
                <div
                  onClick={() => setActiveCardTab('docs')}
                  className="bg-white rounded-3xl p-5 border-2 border-blue-200 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-blue-950">کارت ۳: مدارک و تصاویر</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                        {activeCase.files?.length || 4} مدرک بارگذاری شده
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">تصاویر خسارت طرفین:</span>
                        <span className="font-bold text-slate-900">کامل و تفکیک‌شده</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">بیمه‌نامه و کارت خودرو:</span>
                        <span className="font-bold text-emerald-800">احراز اصالت شده</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">ویدیو / ویس صحنه:</span>
                        <span className="font-bold text-slate-800">موجود در پرونده</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-700 font-black group-hover:text-blue-900">
                    <span>مشاهده گالری اسناد و مدارک</span>
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>

                {/* CARD 4: POLICE REPORT & CROQUI */}
                <div
                  onClick={() => setActiveCardTab('police')}
                  className="bg-white rounded-3xl p-5 border-2 border-amber-200 hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer space-y-3 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-amber-950">کارت ۴: گزارش پلیس و استعلام کروکی</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        policeDetails?.croquiType === 'electronic'
                          ? 'bg-blue-50 text-blue-900 border-blue-200'
                          : 'bg-amber-100 text-amber-950 border-amber-300'
                      }`}>
                        {policeDetails?.croquiType === 'electronic' ? 'الکترونیکی (فراجا)' : 'کاغذی (ترسیمی)'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">شماره استعلام:</span>
                        <span className="font-mono font-bold text-slate-900">{policeDetails?.reportCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">تاریخ تصادف:</span>
                        <span className="font-mono text-slate-900 text-[11px]">{policeDetails?.incidentDateTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">تعیین مقصر:</span>
                        <span className="font-bold text-rose-900">{policeDetails?.faultPercent}٪ طرف دوم</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 font-black group-hover:text-amber-950">
                    <span>مشاهده استعلام رسمی پلیس راهور</span>
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>

                {/* CARD 5: DAMAGE ASSESSMENT */}
                <div
                  onClick={() => setActiveCardTab('assessment')}
                  className="bg-white rounded-3xl p-5 border-2 border-purple-200 hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer space-y-3 flex flex-col justify-between group md:col-span-2 lg:col-span-2"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black text-purple-950">کارت ۵: برآورد کارشناسی خسارت</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200">
                        ارزیاب: {activeCase.assessment?.submittedBy || activeCase.assignedExpert?.name || 'کارشناس خسارت'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-500 block text-[10px]">مبلغ ناخالص برآورد:</span>
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(activeCase.assessment?.gross || 0)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">کسورات و داغی:</span>
                        <span className="font-mono font-bold text-rose-800">
                          -{formatCurrency((activeCase.assessment?.deductions || 0) + (activeCase.assessment?.salvage || 0))}
                        </span>
                      </div>
                      <div>
                        <span className="text-emerald-700 font-bold block text-[10px]">مبلغ خالص قابل پرداخت:</span>
                        <span className="font-mono font-black text-emerald-900 text-sm">
                          {formatCurrency(activeCase.assessment?.payable || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-purple-700 font-black group-hover:text-purple-900">
                    <span>مشاهده صفحه کامل ریزقطعات و برآورد مالی</span>
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>
              </div>

              {/* Bottom Decision Section */}
              {isCaseLocked ? (
                <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-lg space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-amber-400" />
                      <h3 className="font-black text-white text-sm">
                        وضعیت بازبینی: {isCaseApproved ? 'تایید نهایی شده (خارج از صف بازبین)' : 'عودت داده شده به کارشناس'}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">
                      بازبین: {session.name}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {isCaseApproved
                      ? 'این پرونده قبلاً توسط بازبین کیفیت تایید و به زیان‌دیده ارسال شده است. شما در حال حاضر در حالت «فقط مشاهده» قرار دارید و تا زمانی که اقدام جدیدی به شما ارجاع نشود، نیازی به ثبت مجدد عملیات ندارید.'
                      : 'این پرونده به کارشناس خسارت عودت داده شده است. پس از ارسال مجدد گزارش اصلاحی توسط کارشناس، دکمه‌های تایید و تصمیم‌گیری مجدداً فعال خواهند شد.'}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      کلیه اطلاعات و مدارک ۵ کارت فوق به صورت کامل قابل مشاهده است.
                    </span>
                    <button
                      onClick={() => setSelectedCaseId(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all cursor-pointer"
                    >
                      بازگشت به کارتابل پرونده‌ها
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl space-y-4 border border-blue-800">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-800/80">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      <h3 className="font-black text-white text-sm">
                        تصمیم‌گیری نهایی بازبین کیفیت بیمه
                      </h3>
                    </div>
                    <span className="text-xs text-blue-200 font-bold">
                      بازبین مسئول: {session.name}
                    </span>
                  </div>

                  {activeCase.reviewerReturnReason && (
                    <div className="p-3.5 bg-rose-900/60 border border-rose-500/50 rounded-2xl text-xs space-y-1">
                      <span className="font-extrabold text-rose-300 block">آخرین دلیل عودت پرونده توسط بازبین:</span>
                      <p className="text-white font-medium leading-relaxed">{activeCase.reviewerReturnReason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                    <p className="text-xs text-slate-300 font-medium">
                      با بررسی اطلاعات زیان‌دیده، مقصر، مدارک، استعلام کروکی و برآورد کارشناس، تصمیم خود را اتخاذ کنید:
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowApproveModal(true)}
                        className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>تایید نهایی و ارسال به زیان‌دیده</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRejectModal(true)}
                        className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-white" />
                        <span>عودت به کارشناس خسارت</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW B: DEDICATED PAGE FOR CARD 1 (VICTIM DETAILS) */}
          {/* ========================================================================= */}
          {activeCardTab === 'victim' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">صفحه اختصاصی کارت ۱: مشخصات کامل زیان‌دیده (طرف اول)</h3>
                    <p className="text-xs text-slate-500 font-medium">مشخصات هویتی، وسیله نقلیه، بیمه‌نامه و اطلاعات بانکی جهت تسویه خسارت</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-black rounded-xl">
                  زیان‌دیده رسمی پرونده
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Identity Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-black text-slate-900 block text-xs border-b pb-2 border-slate-200">
                    اطلاعات هویتی و تماسی:
                  </span>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">نام و نام خانوادگی:</span>
                      <strong className="text-slate-900">{activeCase.victimName || 'پریسا حسینی'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">کد ملی:</span>
                      <span className="font-mono font-bold text-slate-800">{activeCase.victimNationalId || activeCase.victimVin || '۰۰۸۲۹۱۷۳۶۴'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">شماره موبایل ثبت‌شده:</span>
                      <span className="font-mono font-bold text-slate-800">{activeCase.victimPhone || '۰۹۱۲۳۴۵۶۷۸۹'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">وضعیت احراز هویت:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> احراز شده (شاهکار)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Car and Policy Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-black text-slate-900 block text-xs border-b pb-2 border-slate-200">
                    اطلاعات خودرو و بیمه‌نامه:
                  </span>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">نوع خودرو:</span>
                      <strong className="text-slate-900">{activeCase.carType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">شماره پلاک انتظامی:</span>
                      <span className="font-mono font-bold text-slate-900">{activeCase.victimPlate || activeCase.plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">شرکت بیمه‌گر شخص ثالث:</span>
                      <span className="font-bold text-slate-900">{getInsurerPersianName(activeCase.victimInsurer)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">وضعیت اصالت بیمه‌نامه:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> استعلام سنهاب فراجا تایید شد
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Data Privacy Notice */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-black text-slate-850">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>محرمانگی و امنیت اطلاعات بانکی:</span>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">
                  اطلاعات حساس بانکی و شماره شبای زیان‌دیده بر اساس پروتکل امنیتی، پس از تایید نهایی بازبین و ارجاع پرونده به مرحله تسویه، مستقیماً در اختیار واحد مالی بیمه‌گر قرار می‌گیرد و به منظور حفظ حریم خصوصی در این بخش به بازبین نمایش داده نمی‌شود.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW C: DEDICATED PAGE FOR CARD 2 (CULPRIT DETAILS) */}
          {/* ========================================================================= */}
          {activeCardTab === 'culprit' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-black">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">صفحه اختصاصی کارت ۲: مشخصات مقصر حادثه (طرف دوم)</h3>
                    <p className="text-xs text-slate-500 font-medium">بیمه‌نامه مقصر، سقف تعهدات مالی و بدنی و درصد مسئولیت قانونی</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-rose-50 text-rose-900 border border-rose-200 text-xs font-black rounded-xl">
                  {activeCase.culpritFaultPercent ?? 100}٪ مقصر قانونی
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Identity Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-black text-slate-900 block text-xs border-b pb-2 border-slate-200">
                    اطلاعات هویتی راننده مقصر:
                  </span>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">نام و نام خانوادگی:</span>
                      <strong className="text-slate-900">{activeCase.culpritName || 'رضا کاظمی'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">کد ملی / شناسه:</span>
                      <span className="font-mono font-bold text-slate-800">{activeCase.culpritNationalId || activeCase.culpritVin || '۰۰۷۱۶۲۵۳۴۲'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">شماره تلفن همراه:</span>
                      <span className="font-mono font-bold text-slate-800">{activeCase.culpritPhone || '۰۹۱۹۸۷۶۵۴۳۲'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">خودرو و پلاک:</span>
                      <span className="font-bold text-slate-900">{activeCase.culpritCarType} — <span className="font-mono text-xs">{activeCase.culpritPlate}</span></span>
                    </div>
                  </div>
                </div>

                {/* Insurance Policy Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-black text-slate-900 block text-xs border-b pb-2 border-slate-200">
                    مشخصات بیمه‌نامه شخص ثالث مقصر:
                  </span>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">شرکت بیمه‌گر صادرکننده:</span>
                      <strong className="text-rose-950 font-bold">{getInsurerPersianName(activeCase.culpritInsurer)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">شماره بیمه‌نامه:</span>
                      <span className="font-mono font-bold text-slate-900">{activeCase.culpritPolicyNo || 'POL-1405-9921'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">تاریخ انقضای بیمه‌نامه:</span>
                      <span className="font-mono text-slate-800">{activeCase.culpritPolicyExpiry || '۱۴۰۶/۰۵/۲۰'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">وضعیت اعتبارسنجی:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> استعلام سنهاب معتبر است
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Coverages Breakdown */}
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2.5 text-xs">
                <span className="font-black text-rose-950 block">سقف تعهدات بیمه‌نامه مقصر حادثه:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                    <span className="text-slate-500 text-[10px] block">سقف تعهدات مالی:</span>
                    <strong className="font-mono text-rose-900 text-sm block">
                      {formatCurrency(activeCase.culpritCoverageFinancial || 50000000)}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                    <span className="text-slate-500 text-[10px] block">سقف تعهدات بدنی (دیه):</span>
                    <strong className="font-mono text-slate-800 text-sm block">
                      {formatCurrency(activeCase.culpritCoverageBodily || 300000000)}
                    </strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1">
                    <span className="text-slate-500 text-[10px] block">حوادث راننده:</span>
                    <strong className="font-mono text-slate-800 text-sm block">
                      {formatCurrency(activeCase.culpritCoverageDriver || 100000000)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW D: DEDICATED PAGE FOR CARD 3 (DOCUMENTS, PHOTOS, AUDIO & VIDEO) */}
          {/* ========================================================================= */}
          {activeCardTab === 'docs' && (() => {
            // Aggregate all uploaded media from registration, victim, culprit, expert, and croqui
            interface MediaGalleryItem {
              id: string;
              url: string;
              name: string;
              category: string;
              uploader: string;
              type: 'image' | 'video' | 'audio' | 'pdf' | 'document' | string;
              date?: string;
              duration?: string;
              note?: string;
            }

            const allMedia: MediaGalleryItem[] = [];

            // 1. Initial uploaded files (photos, audio explanation, video clips, etc.)
            (activeCase.files || []).forEach((file, idx) => {
              const fileType = file.type || (file.name?.includes('صوتی') || file.name?.includes('voice') ? 'audio' : file.name?.includes('ویدیو') || file.name?.includes('video') ? 'video' : 'image');
              allMedia.push({
                id: `case-file-${idx}-${file.name || 'file'}`,
                url: file.dataUrl || file.url || file.preview || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&q=80&w=400',
                name: file.name || file.fileName || `مدرک ثبت اولیه ${idx + 1}`,
                category: file.category || (fileType === 'audio' ? 'توضیحات صوتی مشتری' : fileType === 'video' ? 'ویدیو صحنه تصادف' : 'تصویر ثبت اولیه'),
                uploader: file.uploadedBy || file.uploadedByRole || 'ثبت‌کننده پرونده (مشتری)',
                type: fileType,
                date: file.uploadedAt || activeCase.date,
                duration: file.duration
              });
            });

            // 2. Explicit Audio Explanation if available and not already added
            if (activeCase.audioExplanation?.dataUrl) {
              const exists = allMedia.some(m => m.url === activeCase.audioExplanation?.dataUrl);
              if (!exists) {
                allMedia.unshift({
                  id: 'audio-explanation-item',
                  url: activeCase.audioExplanation.dataUrl,
                  name: activeCase.audioExplanation.name || 'توضیحات صوتی کامل راننده/زیان‌دیده',
                  category: 'وویس و صوت ضبط‌شده',
                  uploader: activeCase.victimName || 'زیان‌دیده (طرف اول)',
                  type: 'audio',
                  date: activeCase.date
                });
              }
            }

            // 3. Explicit Video Explanation if available and not already added
            if (activeCase.videoExplanation?.dataUrl) {
              const exists = allMedia.some(m => m.url === activeCase.videoExplanation?.dataUrl);
              if (!exists) {
                allMedia.unshift({
                  id: 'video-explanation-item',
                  url: activeCase.videoExplanation.dataUrl,
                  name: activeCase.videoExplanation.name || 'ویدیو مستند ضبط‌شده از صحنه تصادف',
                  category: 'ویدیو صحنه تصادف',
                  uploader: activeCase.victimName || 'زیان‌دیده (طرف اول)',
                  type: 'video',
                  date: activeCase.date
                });
              }
            }

            // 4. Additional Documents (uploaded later by customer, culprit, or field expert)
            (activeCase.additionalDocs || []).forEach((doc, idx) => {
              if (doc.dataUrl || doc.url) {
                const docUrl = doc.dataUrl || doc.url || '';
                // Avoid exact duplicate URLs
                if (!allMedia.some(m => m.url === docUrl)) {
                  allMedia.push({
                    id: `additional-doc-${doc.id || idx}`,
                    url: docUrl,
                    name: doc.title || doc.fileName || `سند ضمیمه ${idx + 1}`,
                    category: doc.docType || (doc.fileType === 'audio' ? 'صوت ضمیمه' : doc.fileType === 'video' ? 'ویدیو ضمیمه' : 'مدرک بارگذاری شده'),
                    uploader: doc.uploadedBy || doc.uploaderRole || 'کاربر سامانه',
                    type: doc.fileType || (doc.title?.includes('صوتی') || doc.title?.includes('ویس') ? 'audio' : doc.title?.includes('ویدیو') ? 'video' : 'image'),
                    date: doc.uploadedAt,
                    note: doc.note
                  });
                }
              }
            });

            // 5. Customer Kroki / Police Report Photo
            if (activeCase.customerKrokiPhoto) {
              allMedia.push({
                id: 'kroki-photo-item',
                url: activeCase.customerKrokiPhoto,
                name: 'تصویر برگه رسمی کروکی فراجا',
                category: 'کروکی رسمی پلیس راهور',
                uploader: 'بارگذاری مشتری / فراجا',
                type: 'kroki',
                date: activeCase.date
              });
            } else if (activeCase.croquiData?.fileUrl) {
              allMedia.push({
                id: 'croqui-sketch-item',
                url: activeCase.croquiData.fileUrl,
                name: 'تصویر کروکی الکترونیک ترسیم شده فراجا',
                category: 'کروکی الکترونیک',
                uploader: 'سامانه برخط راهور',
                type: 'kroki',
                date: activeCase.date
              });
            }

            if (activeCase.customerPoliceReportFile && activeCase.customerPoliceReportFile !== activeCase.customerKrokiPhoto) {
              allMedia.push({
                id: 'police-report-item',
                url: activeCase.customerPoliceReportFile,
                name: 'تصویر گزارش پلیس و صورتجلسه صحنه',
                category: 'گزارش پلیس',
                uploader: 'ثبت در پرونده',
                type: 'document',
                date: activeCase.date
              });
            }

            // 6. Culprit uploaded files if any
            if ((activeCase as any).culpritFiles && Array.isArray((activeCase as any).culpritFiles)) {
              (activeCase as any).culpritFiles.forEach((cf: any, idx: number) => {
                if (cf.url || cf.preview || cf.dataUrl) {
                  const cfUrl = cf.url || cf.preview || cf.dataUrl;
                  if (!allMedia.some(m => m.url === cfUrl)) {
                    allMedia.push({
                      id: `culprit-file-${idx}`,
                      url: cfUrl,
                      name: cf.name || `مدرک ارسالی مقصر ${idx + 1}`,
                      category: 'مدارک طرف مقصر',
                      uploader: 'مقصر حادثه (طرف دوم)',
                      type: cf.type || 'image'
                    });
                  }
                }
              });
            }

            // 7. Field Expert Inspection Photos if available
            if (activeCase.fieldAssessmentReport?.inspectionPhotos && activeCase.fieldAssessmentReport.inspectionPhotos.length > 0) {
              activeCase.fieldAssessmentReport.inspectionPhotos.forEach((photoUrl, idx) => {
                if (!allMedia.some(m => m.url === photoUrl)) {
                  allMedia.push({
                    id: `field-inspect-photo-${idx}`,
                    url: photoUrl,
                    name: `عکس کارشناسی در محل ${idx + 1}`,
                    category: 'کارشناسی حضوری خسارت',
                    uploader: activeCase.fieldAssessmentReport?.expertName || 'کارشناس سیار',
                    type: 'image',
                    date: activeCase.fieldAssessmentReport?.visitedAt
                  });
                }
              });
            }

            // Media Counts for filter chips
            const totalCount = allMedia.length;
            const imgCount = allMedia.filter(m => m.type === 'image').length;
            const videoCount = allMedia.filter(m => m.type === 'video').length;
            const audioCount = allMedia.filter(m => m.type === 'audio').length;
            const docCount = allMedia.filter(m => m.type === 'document' || m.type === 'pdf').length;
            const krokiCount = allMedia.filter(m => m.type === 'kroki').length;

            // Apply active category filter
            const filteredMedia = allMedia.filter(m => {
              if (mediaCategoryFilter === 'ALL') return true;
              if (mediaCategoryFilter === 'IMAGE') return m.type === 'image';
              if (mediaCategoryFilter === 'VIDEO') return m.type === 'video';
              if (mediaCategoryFilter === 'AUDIO') return m.type === 'audio';
              if (mediaCategoryFilter === 'DOC') return m.type === 'document' || m.type === 'pdf';
              if (mediaCategoryFilter === 'KROKI') return m.type === 'kroki';
              return true;
            });

            return (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
                {/* Header */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-200 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-black shadow-xs">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        صفحه اختصاصی کارت ۳: گالری کلیه مدارک، عکس‌ها، صوت و ویدیو
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        نمایش جامع و تفکیک‌شده تمام عکس‌های خسارت، ویدیوهای صحنه، وویس‌های ضبط‌شده و مدارک هویتی و کروکی
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xs">
                      <Paperclip className="w-4 h-4 text-blue-700" />
                      <span>کل مدارک پرونده: {totalCount} مورد</span>
                    </div>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                  <button
                    onClick={() => setMediaCategoryFilter('ALL')}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mediaCategoryFilter === 'ALL'
                        ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>همه مدارک ({totalCount})</span>
                  </button>

                  <button
                    onClick={() => setMediaCategoryFilter('IMAGE')}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mediaCategoryFilter === 'IMAGE'
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تصاویر خسارت و خودرو ({imgCount})</span>
                  </button>

                  <button
                    onClick={() => setMediaCategoryFilter('VIDEO')}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mediaCategoryFilter === 'VIDEO'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-purple-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5 text-purple-600" />
                    <span>ویدیوهای صحنه ({videoCount})</span>
                  </button>

                  <button
                    onClick={() => setMediaCategoryFilter('AUDIO')}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mediaCategoryFilter === 'AUDIO'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                    <span>توضیحات صوتی و وویس ({audioCount})</span>
                  </button>

                  <button
                    onClick={() => setMediaCategoryFilter('KROKI')}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mediaCategoryFilter === 'KROKI'
                        ? 'bg-amber-700 text-white border-amber-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>کروکی پلیس ({krokiCount})</span>
                  </button>

                  <button
                    onClick={() => setMediaCategoryFilter('DOC')}
                    className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      mediaCategoryFilter === 'DOC'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>مدارک و بیمه‌نامه ({docCount})</span>
                  </button>
                </div>

                {/* Media Grid */}
                {filteredMedia.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMedia.map((file) => {
                      // AUDIO ITEM CARD
                      if (file.type === 'audio') {
                        return (
                          <div
                            key={file.id}
                            className="bg-emerald-50/80 border-2 border-emerald-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md group"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 border border-emerald-300">
                                  {file.category}
                                </span>
                                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                  <Mic className="w-4 h-4" />
                                </div>
                              </div>
                              <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2">
                                {file.name}
                              </h4>
                              <p className="text-[10px] text-emerald-800 font-bold">
                                بارگذاری توسط: {file.uploader}
                              </p>
                            </div>

                            {/* Embedded Audio Player */}
                            <div className="space-y-2 pt-2 border-t border-emerald-200">
                              <audio
                                controls
                                src={file.url}
                                className="w-full h-8 rounded-lg outline-none"
                              />
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>{file.date || 'ثبت شده'}</span>
                                <button
                                  onClick={() => setSelectedMediaItem(file)}
                                  className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  پخش تمام‌صفحه <Maximize2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // VIDEO ITEM CARD
                      if (file.type === 'video') {
                        return (
                          <div
                            key={file.id}
                            className="bg-purple-50/80 border-2 border-purple-300 hover:border-purple-500 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-md group"
                          >
                            <div className="relative aspect-video bg-slate-900 flex items-center justify-center cursor-pointer overflow-hidden"
                              onClick={() => setSelectedMediaItem(file)}
                            >
                              <video
                                src={file.url}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                preload="metadata"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <Play className="w-6 h-6 fill-white ml-0.5" />
                                </div>
                              </div>
                              <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-900/80 text-purple-200 border border-purple-400/30 backdrop-blur-xs">
                                {file.category}
                              </span>
                            </div>

                            <div className="p-3.5 space-y-2 bg-white">
                              <h4 className="font-extrabold text-xs text-slate-900 truncate" title={file.name}>
                                {file.name}
                              </h4>
                              <div className="flex items-center justify-between text-[10px] text-slate-600 border-t border-slate-100 pt-2">
                                <span>{file.uploader}</span>
                                <button
                                  onClick={() => setSelectedMediaItem(file)}
                                  className="text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  پخش ویدیو <Maximize2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // IMAGE / KROKI / DOCUMENT ITEM CARD
                      return (
                        <div
                          key={file.id}
                          onClick={() => setSelectedMediaItem(file)}
                          className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 bg-slate-100 cursor-pointer aspect-4/3 flex flex-col justify-between shadow-xs hover:shadow-md transition-all"
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/50 p-2.5 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs border truncate max-w-[130px] ${
                                file.type === 'kroki'
                                  ? 'bg-amber-900/80 text-amber-200 border-amber-400/30'
                                  : 'bg-blue-900/80 text-blue-200 border-blue-400/30'
                              }`}>
                                {file.category}
                              </span>
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-900/70 text-slate-300 backdrop-blur-xs">
                                {file.uploader}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-white pt-1">
                              <span className="text-[11px] font-bold truncate max-w-[150px]">{file.name}</span>
                              <div className="w-6 h-6 rounded-md bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
                                <Maximize2 className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <Paperclip className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-xs text-slate-600">مدرکی در این دسته‌بندی یافت نشد.</p>
                    <button
                      onClick={() => setMediaCategoryFilter('ALL')}
                      className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                    >
                      نمایش تمام مدارک پرونده
                    </button>
                  </div>
                )}

                {/* Written narrative */}
                {activeCase.writtenReport && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                    <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-700" />
                      شرح و اظهارات کتبی ثبت‌شده توسط مشتری در پرونده:
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                      {activeCase.writtenReport}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* SUB-VIEW E: DEDICATED PAGE FOR CARD 4 (POLICE REPORT & CROQUI INQUIRY) */}
          {/* ========================================================================= */}
          {activeCardTab === 'police' && (
            <div className="space-y-6 animate-in fade-in">
              <PoliceCroquiReportView claimCase={activeCase} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-VIEW F: DEDICATED PAGE FOR CARD 5 (DAMAGE ASSESSMENT) */}
          {/* ========================================================================= */}
          {activeCardTab === 'assessment' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-black">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">صفحه اختصاصی کارت ۵: گزارش برآورد کارشناسی خسارت</h3>
                    <p className="text-xs text-slate-500 font-medium">ریز قطعات تعویضی، اجرت صافکاری و نقاشی، فرانشیز، داغی و مبلغ نهایی</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-purple-50 text-purple-950 px-3 py-1 rounded-xl border border-purple-200">
                  نسخه: {activeCase.assessment?.version || 'A-1.0'} | ارزیاب: {activeCase.assessment?.submittedBy || 'کارشناس رسمی'}
                </span>
              </div>

              {activeCase.assessment ? (
                <div className="space-y-5 text-xs">
                  {/* Parts table */}
                  {activeCase.assessment.parts && activeCase.assessment.parts.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-black text-slate-900 text-xs block">جدول قطعات، تعمیرات و اجرت‌ها:</span>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">ردیف</th>
                              <th className="p-3">نام قطعه / عملیات</th>
                              <th className="p-3">نوع اقدام</th>
                              <th className="p-3">قیمت قطعه (تومان)</th>
                              <th className="p-3">اجرت تعمیر/نصب (تومان)</th>
                              <th className="p-3">جمع ردیف (تومان)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeCase.assessment.parts.map((part, idx) => {
                              const partCost = parseMoneyNumber(part.partPrice || 0);
                              const repCost = parseMoneyNumber(part.repairPrice || 0);
                              const totalRow = partCost + repCost;
                              return (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                                  <td className="p-3 font-extrabold text-slate-900">{part.name}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      part.type === 'replace' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                                    }`}>
                                      {part.type === 'replace' ? 'تعویض' : 'تعمیر'}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono font-bold text-slate-800">{formatCurrency(partCost)}</td>
                                  <td className="p-3 font-mono font-bold text-slate-800">{formatCurrency(repCost)}</td>
                                  <td className="p-3 font-mono font-black text-slate-900">{formatCurrency(totalRow)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Financial calculation breakdown */}
                  <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3 shadow-inner">
                    <h4 className="text-xs font-black text-slate-300 border-b border-slate-800 pb-2">صورت‌حساب نهایی خسارت:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">مبلغ ناخالص برآورد:</span>
                        <span className="font-mono text-white text-sm font-bold">{formatCurrency(activeCase.assessment.gross)}</span>
                      </div>
                      <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">کسورات / فرانشیز:</span>
                        <span className="font-mono text-rose-300 text-sm font-bold">-{formatCurrency(activeCase.assessment.deductions)}</span>
                      </div>
                      <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                        <span className="text-slate-400 block text-[10px]">ارزش داغی قطعات:</span>
                        <span className="font-mono text-amber-300 text-sm font-bold">-{formatCurrency(activeCase.assessment.salvage)}</span>
                      </div>
                      <div className="p-3 bg-emerald-950/80 rounded-2xl border border-emerald-600/50">
                        <span className="text-emerald-300 block text-[10px] font-bold">مبلغ نهایی قابل پرداخت:</span>
                        <span className="font-mono text-emerald-400 text-base font-black">{formatCurrency(activeCase.assessment.payable)}</span>
                      </div>
                    </div>
                  </div>

                  {activeCase.assessment.reviewerNote && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block text-[10px]">توضیحات کارشناس خسارت:</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{activeCase.assessment.reviewerNote}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-500 font-bold text-xs">
                  ارزیابی رسمی برای این پرونده هنوز توسط کارشناس ثبت نشده است.
                </div>
              )}
            </div>
          )}

          {/* Bottom Card Navigation Bar when viewing a card page */}
          {activeCardTab !== 'overview' && (
            <div className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-200 shadow-xs flex-wrap gap-2">
              <button
                onClick={() => setActiveCardTab('overview')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>بازگشت به نمای ۵ کارت</span>
              </button>

              {isCaseLocked ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    حالت مشاهده اطلاعات (اقدام ثبت شده)
                  </span>
                  <button
                    onClick={() => setSelectedCaseId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    بازگشت به لیست پرونده‌ها
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApproveModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تایید پرونده</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>عودت به کارشناس</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* MODAL 1: APPROVE CONFIRMATION */}
      {showApproveModal && activeCase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                تایید نهایی پرونده توسط بازبین
              </h3>
              <button
                onClick={() => setShowApproveModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              آیا از تایید نهایی پرونده <span className="font-mono font-bold text-blue-900">{activeCase.id}</span> اطمینان دارید؟
              پس از تایید، وضعیت پرونده به <span className="font-bold text-emerald-800">«در انتظار تایید کاربر»</span> تغییر یافته و مشتری امکان مشاهده برآورد، درج تاییدیه و ثبت شماره شبا جهت دریافت واریزی را خواهد داشت.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleApproveClaim}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                تایید و ارسال پرونده
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT / RETURN TO ADJUSTER */}
      {showRejectModal && activeCase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 border border-slate-200 text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                عودت پرونده به کارشناس خسارت جهت اصلاح
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800">
                علت عدم تایید / توضیحات اشکال جهت اصلاح توسط کارشناس خسارت:
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثلاً: مغایرت در قیمت تعویض سپر جلو با استعلام بازار / نیازمند بررسی مجدد تصویر کروکی..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-600 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                انصراف
              </button>
              <button
                disabled={!rejectReason.trim()}
                onClick={handleRejectClaim}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                ثبت و عودت به کارشناس
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom & Player for All Media (Photo, Video, Audio, Doc) */}
      {(selectedMediaItem || selectedImage) && (() => {
        const item = selectedMediaItem || {
          url: selectedImage!,
          name: 'تصویر مدرک',
          type: 'image',
          category: 'مدرک پرونده',
          uploader: 'بارگذاری شده'
        };

        return (
          <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
            <div className="relative max-w-4xl w-full bg-white rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                    {item.type === 'audio' ? (
                      <Headphones className="w-4 h-4 text-emerald-600" />
                    ) : item.type === 'video' ? (
                      <Film className="w-4 h-4 text-purple-600" />
                    ) : item.type === 'kroki' ? (
                      <FileCheck className="w-4 h-4 text-amber-600" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{item.name}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      دسته‌بندی: <span className="font-bold text-slate-700">{item.category}</span> • ارسال‌کننده: <span className="font-bold text-slate-700">{item.uploader}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedMediaItem(null);
                    setSelectedImage(null);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Media Content Display */}
              <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-950/5 rounded-2xl p-3">
                {item.type === 'audio' ? (
                  <div className="w-full max-w-lg bg-emerald-950 text-white rounded-2xl p-6 space-y-5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Mic className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white">توضیحات صوتی ضبط شده راننده / زیان‌دیده</h4>
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
                      <span>ثبت شده در پرونده شماره {activeCase.id}</span>
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
                    className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md"
                  />
                )}
              </div>

              {/* Note / metadata footer */}
              {item.note && (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-slate-800">
                  <span className="font-bold text-blue-950 block mb-0.5">یادداشت مدرک:</span>
                  <p>{item.note}</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: REVIEWER SMS NOTIFICATION INBOX SIMULATOR */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 text-slate-900 overflow-hidden animate-in zoom-in-95">
            {/* Phone Header */}
            <div className="bg-slate-900 text-white p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">صندوق پیامک‌های همراه بازبین</h3>
                    <p className="text-[10px] text-slate-400 font-mono font-bold">
                      {session.phone || '۰۹۱۲۲۱۴۵۶۷۸'} | {companyPersianName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSmsModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-xl text-slate-300 flex items-center justify-between">
                <span>پیامک‌های خودکار سامانه خسارت:</span>
                <span className="font-black text-amber-400">{companyCases.length} پیامک ثبت‌شده</span>
              </div>
            </div>

            {/* SMS Messages List */}
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-100/70">
              {companyCases.length > 0 ? (
                companyCases.map((c, idx) => {
                  const isAssignedToThis = c.assignedReviewer?.name === session.name || !c.assignedReviewer;
                  const expertName = c.assessment?.expertName || c.assignedExpert?.name || 'کارشناس خسارت';
                  return (
                    <div
                      key={c.id || idx}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>سرشماره ۲۰۰۰۰۱ بیمه {companyPersianName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {c.assessment?.calculatedAt || c.date || 'امروز'}
                        </span>
                      </div>

                      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-slate-800 font-medium leading-relaxed">
                        بازبین محترم ({session.name})، پرونده خسارت شماره <strong className="font-mono text-blue-900">{c.id}</strong> ({c.victimName}) توسط {expertName} نهایی گردید و جهت بازبینی کیفی و تایید نهایی به شما ارجاع شد.
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          تحویل شده به سیم‌کارت
                        </span>
                        <button
                          onClick={() => {
                            setShowSmsModal(false);
                            handleSelectCase(c.id);
                          }}
                          className="text-xs font-black text-blue-700 hover:text-blue-900 cursor-pointer flex items-center gap-1"
                        >
                          <span>مشاهده پرونده</span>
                          <ArrowRight className="w-3 h-3 rotate-180" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs font-bold">
                  هیچ پیامک جدیدی در صندوق موجود نیست.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSmsModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SPOTLIGHT QUICK SEARCH MODAL */}
      {showQuickSearchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 text-slate-900 overflow-hidden space-y-0 animate-in zoom-in-95">
            {/* Header & Search Bar */}
            <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">جستجوی هوشمند و سریع پرونده‌های خسارت</h3>
                    <p className="text-[11px] text-blue-200">
                      جستجو در نام طرفین، شماره پرونده، پلاک، مدل خودرو، کروکی و کارشناس
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickSearchModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="عبارت مورد نظر خود را تایپ کنید..."
                  className="w-full pl-10 pr-11 py-3 rounded-2xl border border-white/20 bg-white text-slate-900 font-bold text-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400/40"
                />
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 absolute left-3 top-3 flex items-center justify-center text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Search Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
              {filteredCases.length > 0 ? (
                filteredCases.map((c) => {
                  const isApproved =
                    c.status === 'در انتظار تایید کاربر' ||
                    c.status === 'در انتظار تایید زیان‌دیده' ||
                    c.status === 'در انتظار پرداخت' ||
                    c.status === 'پرداخت شده' ||
                    c.approvedByReviewer;

                  const isReturned =
                    c.status === 'نیازمند اصلاح توسط کارشناس' ||
                    c.status === 'عودت داده شده به کارشناس' ||
                    !!c.reviewerReturnReason ||
                    !!c.assessment?.reviewerReturnReason;

                  const payable = c.assessment?.totalPayable || (c.assessment?.totalLabor || 0) + (c.assessment?.totalParts || 0);

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setShowQuickSearchModal(false);
                        handleSelectCase(c.id);
                        setActiveCardTab('overview');
                      }}
                      className="p-3.5 rounded-2xl hover:bg-blue-50/80 border border-transparent hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between flex-wrap gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-900 border border-blue-200">
                            {c.id}
                          </span>
                          <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-900">
                            {c.victimName || 'زیان‌دیده'} ({c.carType || 'خودرو'})
                          </span>
                          {isApproved ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ تایید شده
                            </span>
                          ) : isReturned ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                              ⚠️ عودت داده شده
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              ⏱️ در انتظار بررسی
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          {c.victimPlate && (
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              پلاک: {c.victimPlate}
                            </span>
                          )}
                          {c.culpritName && (
                            <span>
                              مقصر: <strong className="text-slate-700">{c.culpritName}</strong>
                            </span>
                          )}
                          {c.croquiData?.reportNumber && (
                            <span className="text-amber-700 font-mono">
                              کروکی: {c.croquiData.reportNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {payable > 0 && (
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block">مبلغ برآورد</span>
                            <span className="font-mono font-black text-xs text-emerald-700">
                              {formatCurrency(payable)}
                            </span>
                          </div>
                        )}
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all">
                          <ArrowRight className="w-4 h-4 rotate-180" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center space-y-2">
                  <Search className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-sm text-slate-700">هیچ پرونده‌ای با عبارت جستجو شده یافت نشد.</p>
                  <p className="text-xs text-slate-400">می‌توانید شماره پرونده، نام یا شماره پلاک را بررسی و دوباره امتحان کنید.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>{filteredCases.length} پرونده منطبق</span>
              <button
                onClick={() => setShowQuickSearchModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
