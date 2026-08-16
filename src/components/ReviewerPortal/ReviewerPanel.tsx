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
  Check
} from 'lucide-react';
import { ClaimCase, UserSession, PartItem } from '../../types';
import { formatCurrency, parseMoneyNumber, getInsurerPersianName } from '../../lib/storage';

interface ReviewerPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updatedCase: ClaimCase) => void;
  onLogout?: () => void;
}

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
  const [filterTab, setFilterTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
      companyCode === 'dana' // default fallback
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

  // Filtered case list based on selected tab and search
  const filteredCases = companyCases.filter((c) => {
    // Tab filtering
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

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchId = c.id.toLowerCase().includes(q);
      const matchVictim = c.victimName?.toLowerCase().includes(q);
      const matchCulprit = c.culpritName?.toLowerCase().includes(q);
      const matchPlate = c.victimPlate?.toLowerCase().includes(q) || c.culpritPlate?.toLowerCase().includes(q);
      return matchId || matchVictim || matchCulprit || matchPlate;
    }

    return true;
  });

  const activeCase = cases.find((c) => c.id === selectedCaseId);

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

        {selectedCaseId && (
          <button
            onClick={() => setSelectedCaseId(null)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md border border-white/20"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به صف پرونده‌ها</span>
          </button>
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
            className="text-white/80 hover:text-white font-bold text-sm"
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
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو با شماره پرونده، نام زیان‌دیده، نام مقصر، شماره پلاک..."
                  className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setFilterTab('pending')}
                  className={`px-3 py-2 rounded-xl transition-all ${
                    filterTab === 'pending'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  در انتظار بررسی ({pendingCases.length})
                </button>
                <button
                  onClick={() => setFilterTab('approved')}
                  className={`px-3 py-2 rounded-xl transition-all ${
                    filterTab === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  تایید شده ({approvedCases.length})
                </button>
                <button
                  onClick={() => setFilterTab('rejected')}
                  className={`px-3 py-2 rounded-xl transition-all ${
                    filterTab === 'rejected'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  اصلاحی / عودت ({rejectedCases.length})
                </button>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-2 rounded-xl transition-all ${
                    filterTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  همه ({companyCases.length})
                </button>
              </div>
            </div>
          </div>

          {/* Cases List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredCases.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-extrabold text-slate-600">
                  هیچ پرونده‌ای در این بخش یافت نشد.
                </p>
                <p className="text-xs text-slate-400">
                  جهت مشاهده سایر پرونده‌ها، فیلتر یا عبارت جستجو را تغییر دهید.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredCases.map((c) => {
                  const payable = c.assessment?.payable || 0;
                  const isPendingReview =
                    c.status === 'در انتظار بررسی بازبین' ||
                    c.status === 'در حال بازبینی' ||
                    c.assessment?.status === 'SUBMITTED';

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCaseId(c.id)}
                      className="p-5 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between flex-wrap gap-4"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-xs">
                            {c.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                              isPendingReview
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : c.approvedByReviewer || c.status === 'در انتظار تایید کاربر'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            {c.status}
                          </span>
                          <span className="text-[11px] text-slate-500 font-bold">
                            تاریخ حادثه: {c.date}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700">
                          <div>
                            <span className="text-slate-400 font-bold">زیان‌دیده: </span>
                            <span className="font-black text-slate-900">{c.victimName || 'ثبت نشده'}</span>
                            <span className="text-slate-500 font-mono text-[11px] mr-1">({c.victimPlate || c.plate})</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">مقصر: </span>
                            <span className="font-black text-slate-900">{c.culpritName || 'ثبت نشده'}</span>
                            <span className="text-slate-500 font-mono text-[11px] mr-1">({c.culpritPlate})</span>
                          </div>
                        </div>

                        {c.assignedExpert && (
                          <div className="text-[11px] text-slate-500 font-bold">
                            کارشناس خسارت: <span className="text-slate-800 font-extrabold">{c.assignedExpert.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        {payable > 0 && (
                          <div className="text-left">
                            <span className="block text-[10px] text-slate-400 font-bold">مبلغ برآورد خسارت:</span>
                            <span className="font-black text-emerald-700 text-sm font-mono">
                              {formatCurrency(payable)}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCaseId(c.id);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <span>بررسی پرونده</span>
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : activeCase ? (
        /* VIEW 2: FOCUSED REVIEWER CLAIM WORKSPACE */
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-black text-sm text-blue-900 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                پرونده شماره: {activeCase.id}
              </span>
              <span
                className={`px-3 py-1 rounded-full font-black border ${
                  activeCase.status === 'در انتظار بررسی بازبین' || activeCase.status === 'در حال بازبینی'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : activeCase.approvedByReviewer
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                وضعیت: {activeCase.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>رد / عودت به کارشناس خسارت</span>
              </button>

              <button
                onClick={() => setShowApproveModal(true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تایید نهایی و ارسال به مشتری</span>
              </button>
            </div>
          </div>

          {/* GRID OF THE REQUIRED 5 CARDS + DECISION BOX */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CARD 1: اطلاعات زیان‌دیده (Claimant Info) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  کارت ۱: اطلاعات زیان‌دیده (طرف آسیب‌دیده)
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">نام و نام خانوادگی:</span>
                  <span className="font-black text-slate-900 text-sm">{activeCase.victimName || 'ثبت نشده'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">شماره همراه:</span>
                  <span className="font-mono font-bold text-slate-900">{activeCase.victimPhone || 'ثبت نشده'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">خودرو و پلاک:</span>
                  <span className="font-black text-slate-900">{activeCase.carType || 'خودرو زیان‌دیده'}</span>
                  <span className="font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block text-[11px] font-bold mt-1">
                    پلاک: {activeCase.victimPlate || activeCase.plate}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">شرکت بیمه‌گر زیان‌دیده:</span>
                  <span className="font-extrabold text-slate-800">{activeCase.victimInsurer || companyPersianName}</span>
                  <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                    اصالت بیمه‌نامه تایید شده
                  </span>
                </div>

                <div className="col-span-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">شماره شبا جهت واریز خسارت:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-slate-900 text-xs">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{activeCase.payoutInfo?.iban || activeCase.victimIban || 'هنوز ثبت نشده (پس از تایید بازبین اخذ می‌گردد)'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: اطلاعات مقصر (At-Fault Party Info) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <User className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  کارت ۲: اطلاعات مقصر حادثه (بیمه‌گذار)
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">نام و نام خانوادگی مقصر:</span>
                  <span className="font-black text-slate-900 text-sm">{activeCase.culpritName || 'ثبت نشده'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">شماره همراه:</span>
                  <span className="font-mono font-bold text-slate-900">{activeCase.culpritPhone || 'ثبت نشده'}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">خودرو و پلاک مقصر:</span>
                  <span className="font-black text-slate-900">{activeCase.culpritCarType || 'خودرو مقصر'}</span>
                  <span className="font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block text-[11px] font-bold mt-1">
                    پلاک: {activeCase.culpritPlate}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">بیمه‌گر و بیمه‌نامه مقصر:</span>
                  <span className="font-extrabold text-slate-800">{getInsurerPersianName(activeCase.culpritInsurer)}</span>
                  <span className="font-mono text-slate-600 block text-[10px] mt-0.5">
                    شماره بیمه‌نامه: {activeCase.culpritPolicyNo || 'POL-99201'}
                  </span>
                </div>

                <div className="col-span-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-bold block text-[11px]">سقف تعهدات مالی بیمه‌نامه:</span>
                    <span className="font-black text-indigo-900 font-mono text-sm">
                      {formatCurrency(activeCase.culpritCoverageFinancial || 500000000)}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-lg border border-emerald-300">
                    استعلام بیمه‌نامه: فعال و معتبر
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: مستندات و مدارک (Documents & Media) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-black text-slate-900 text-sm">
                    کارت ۳: مخزن مستندات، مدارک شناسایی و تصاویر خسارت
                  </h3>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  تعداد مدارک ثبت شده: {(activeCase.files?.length || 0) + (activeCase.additionalDocs?.length || 0)} فایل
                </span>
              </div>

              {/* Combined Documents List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {activeCase.additionalDocs && activeCase.additionalDocs.length > 0 ? (
                  activeCase.additionalDocs.map((doc) => (
                    <div key={doc.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 truncate">{doc.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-200">
                          {doc.uploaderRole || 'زیان‌دیده'}
                        </span>
                      </div>
                      {doc.dataUrl ? (
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-200 h-36">
                          {doc.fileType === 'video' ? (
                            <video src={doc.dataUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img src={doc.dataUrl} alt={doc.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ) : (
                        <div className="h-28 bg-slate-200/60 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                          [فایل پیوست / مدرک تصویری]
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 font-medium">تاریخ آپلود: {doc.uploadedAt}</p>
                    </div>
                  ))
                ) : activeCase.files && activeCase.files.length > 0 ? (
                  activeCase.files.map((file, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <span className="font-extrabold text-slate-900 block truncate">
                        تصویر {idx + 1}: {file.fileName || file.name || 'مدرک تصادف'}
                      </span>
                      {file.dataUrl ? (
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-200 h-36">
                          <img src={file.dataUrl} alt="تصویر" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-28 bg-slate-200/60 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                          [عکس مدرک خسارت]
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 font-bold text-xs">
                    مدارک و تصاویری برای این پرونده ثبت نشده است.
                  </div>
                )}
              </div>
            </div>

            {/* CARD 4: گزارشات پلیس و کروکی (Police Reports & Croqui) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  کارت ۴: گزارشات انتظامی، نتیجه استعلام و کروکی پلیس
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block text-[11px]">کد و شماره گزارش پلیس:</span>
                    <span className="font-mono font-bold text-slate-900">{activeCase.sceneReportCode || activeCase.policeReport?.code || 'POL-88219'}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block text-[11px]">تعیین درصد تقصیر:</span>
                    <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                      {activeCase.culpritFaultPercent ?? 100}% مقصر (طرف دوم)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[11px]">تاریخ، زمان و آدرس وقوع حادثه:</span>
                  <p className="font-bold text-slate-800">{activeCase.date} — {activeCase.address}</p>
                </div>

                {/* Croqui Preview */}
                {(activeCase.customerKrokiPhoto || activeCase.croquiData) ? (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-extrabold text-slate-900 text-xs block">تصویر و رسم کروکی تصادف:</span>
                    {activeCase.customerKrokiPhoto && (
                      <div className="rounded-xl overflow-hidden border border-slate-300 max-h-48">
                        <img src={activeCase.customerKrokiPhoto} alt="کروکی" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 text-emerald-950 font-bold text-[11px]">
                    نتیجه استعلام کروکی: تصادف سازش‌یافته بدون نیاز به کروکی کاغذی (سازمانی)
                  </div>
                )}
              </div>
            </div>

            {/* CARD 5: برآورد خسارت کارشناس ارزیاب (Adjuster Assessment) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-slate-900 text-sm">
                  کارت ۵: گزارش ارزیابی و برآورد خسارت کارشناس
                </h3>
              </div>

              {activeCase.assessment ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between bg-purple-50 p-3 rounded-2xl border border-purple-100">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">ارزیاب مسئول:</span>
                      <span className="font-black text-purple-950">{activeCase.assessment.submittedBy || activeCase.assignedExpert?.name || 'کارشناس خسارت'}</span>
                    </div>
                    <span className="text-purple-800 font-mono text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-purple-200">
                      نسخه ارزیابی: {activeCase.assessment.version || 'A-1.0'}
                    </span>
                  </div>

                  {/* Parts table if exists */}
                  {activeCase.assessment.parts && activeCase.assessment.parts.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-extrabold text-slate-900 text-xs block">ریز قطعات و تعمیرات:</span>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {activeCase.assessment.parts.map((p, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{p.name} ({p.type === 'replace' ? 'تعویض' : 'تعمیر'})</span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatCurrency(p.type === 'replace' ? parseMoneyNumber(p.partPrice) : parseMoneyNumber(p.repairPrice))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Breakdown */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-inner">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>مبلغ ناخالص برآورد:</span>
                      <span className="font-mono">{formatCurrency(activeCase.assessment.gross)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>کسورات / فرانشیز:</span>
                      <span className="font-mono">-{formatCurrency(activeCase.assessment.deductions)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span>ارزش داغی:</span>
                      <span className="font-mono">-{formatCurrency(activeCase.assessment.salvage)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs font-black text-amber-300">
                      <span>مبلغ نهایی قابل پرداخت:</span>
                      <span className="font-mono text-sm text-emerald-400">{formatCurrency(activeCase.assessment.payable)}</span>
                    </div>
                  </div>

                  {activeCase.assessment.reviewerNote && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-slate-400 font-bold block text-[10px]">توضیحات کارشناس خسارت:</span>
                      <p className="text-slate-800 font-medium leading-relaxed">{activeCase.assessment.reviewerNote}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 font-bold text-xs">
                  ارزیابی رسمی برای این پرونده هنوز ثبت نشده است.
                </div>
              )}
            </div>

            {/* CARD 6: نظر و تصمیم‌گیری بازبین (Reviewer Decision & Actions) */}
            <div className="p-6 bg-blue-900 text-white rounded-3xl shadow-xl space-y-5 lg:col-span-2 border border-blue-700">
              <div className="flex items-center justify-between pb-3 border-b border-blue-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-amber-400" />
                  <h3 className="font-black text-white text-base">
                    بخش نظر و تصمیم‌گیری بازبین کیفیت بیمه
                  </h3>
                </div>
                <span className="text-xs text-blue-200 font-bold">
                  بازبین مسئول: {session.name}
                </span>
              </div>

              {activeCase.reviewerReturnReason && (
                <div className="p-4 bg-rose-900/60 border border-rose-500/50 rounded-2xl text-xs space-y-1">
                  <span className="font-extrabold text-rose-300 block">آخرین دلیل عودت پرونده توسط بازبین:</span>
                  <p className="text-white font-medium leading-relaxed">{activeCase.reviewerReturnReason}</p>
                </div>
              )}

              <div className="bg-blue-950/70 p-4 rounded-2xl border border-blue-800/80 text-xs space-y-3">
                <p className="text-slate-200 leading-relaxed font-bold">
                  با بررسی کامل مدارک زیان‌دیده، اطلاعات مقصر، استعلامات پلیس، کروکی و ارزیابی کارشناس، یکی از دو تصمیم زیر را اتخاذ نمایید:
                </p>

                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApproveModal(true)}
                    className="flex-1 min-w-[200px] py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>تایید نهایی پرونده و ارسال به مشتری</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 min-w-[200px] py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <XCircle className="w-5 h-5 text-white" />
                    <span>رد / عودت به کارشناس خسارت جهت اصلاح</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                انصراف
              </button>
              <button
                onClick={handleApproveClaim}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md"
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
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                انصراف
              </button>
              <button
                disabled={!rejectReason.trim()}
                onClick={handleRejectClaim}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                ثبت و عودت به کارشناس
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
