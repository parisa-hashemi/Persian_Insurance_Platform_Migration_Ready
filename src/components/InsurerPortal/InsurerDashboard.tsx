import React, { useState } from 'react';
import {
  Building2,
  FolderOpen,
  Search,
  Download,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  X,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  UserCheck,
  Car,
  LogOut,
  Hourglass,
  User,
  ClipboardCheck,
  Wallet,
  AlertCircle,
  XCircle,
  FileText,
  ShieldCheck,
  Plus,
  Phone,
  Power,
  UserPlus,
  Star,
  RotateCcw,
  Timer
} from 'lucide-react';
import { ClaimCase, UserSession, StaffMember, ExpertComplaint } from '../../types';
import { INSURER_COMPANIES, INITIAL_EXPERTS, INITIAL_REVIEWERS } from '../../data/mockData';
import {
  formatCurrency,
  getInsurerPersianName,
  loadExpertsFromStorage,
  saveExpertsToStorage,
  loadComplaintsFromStorage,
  saveComplaintsToStorage
} from '../../lib/storage';

interface InsurerDashboardProps {
  session: UserSession;
  cases: ClaimCase[];
  onOpenCaseDetail: (caseId: string) => void;
  onNavigateTab: (tab: string) => void;
  onLogout?: () => void;
}

export type InsurerSubTab =
  | 'dash'
  | 'cases'
  | 'experts'
  | 'aiConsole'
  | 'assessors'
  | 'reviewers'
  | 'payments'
  | 'bodyClaim';

export const InsurerDashboard: React.FC<InsurerDashboardProps> = ({
  session,
  cases,
  onOpenCaseDetail,
  onNavigateTab,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<InsurerSubTab>('dash');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedProvince, setSelectedProvince] = useState('');

  const companyCode = session.company || 'iran';
  const companyInfo = INSURER_COMPANIES.find((c) => c.code === companyCode) || {
    code: 'iran',
    name: 'بیمه ایران'
  };

  // Experts management state
  const [expertsMap, setExpertsMap] = useState<Record<string, StaffMember[]>>(() => loadExpertsFromStorage());
  const [assessorSearch, setAssessorSearch] = useState('');
  const [showAddAssessorModal, setShowAddAssessorModal] = useState(false);
  const [newAssessorName, setNewAssessorName] = useState('');
  const [newAssessorRole, setNewAssessorRole] = useState('کارشناس ارزیاب خسارت');
  const [newAssessorNationalId, setNewAssessorNationalId] = useState('');
  const [newAssessorPhone, setNewAssessorPhone] = useState('');
  const [assessorActionMsg, setAssessorActionMsg] = useState<string | null>(null);

  const currentCompanyExperts = expertsMap[companyCode] || expertsMap['iran'] || INITIAL_EXPERTS[companyCode] || [];

  const handleToggleAssessorStatus = (expertId: string) => {
    const list = expertsMap[companyCode] || currentCompanyExperts;
    const target = list.find((e) => e.id === expertId);
    if (!target) return;

    const newStatus = target.active === false ? true : false;
    const updatedList = list.map((e) => {
      if (e.id === expertId) {
        return { ...e, active: newStatus };
      }
      return e;
    });

    const updatedMap = { ...expertsMap, [companyCode]: updatedList };
    setExpertsMap(updatedMap);
    saveExpertsToStorage(updatedMap);

    const statusLabel = newStatus ? 'فعال' : 'غیرفعال';
    setAssessorActionMsg(`وضعیت کارشناس «${target.name}» به «${statusLabel}» تغییر یافت.`);
    setTimeout(() => setAssessorActionMsg(null), 4000);
  };

  const handleCreateAssessor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssessorName.trim() || !newAssessorPhone.trim()) return;

    const newExp: StaffMember = {
      id: `EXP-${Date.now()}`,
      name: newAssessorName.trim(),
      role: newAssessorRole.trim() || 'کارشناس ارزیاب خسارت',
      phone: newAssessorPhone.trim(),
      nationalId: newAssessorNationalId.trim() || '---',
      active: true,
      company: companyCode
    };

    const list = expertsMap[companyCode] || currentCompanyExperts;
    const updatedList = [newExp, ...list];
    const updatedMap = { ...expertsMap, [companyCode]: updatedList };

    setExpertsMap(updatedMap);
    saveExpertsToStorage(updatedMap);

    setNewAssessorName('');
    setNewAssessorPhone('');
    setNewAssessorNationalId('');
    setShowAddAssessorModal(false);
    setAssessorActionMsg(`ارزیاب جدید «${newExp.name}» با موفقیت افزوده شد.`);
    setTimeout(() => setAssessorActionMsg(null), 4000);
  };

  // Expert Complaints & Individual Performance Evaluation State
  const [complaintsList, setComplaintsList] = useState<ExpertComplaint[]>(() => loadComplaintsFromStorage());
  const [selectedExpertForComplaints, setSelectedExpertForComplaints] = useState<StaffMember | null>(null);
  const [showAddComplaintModal, setShowAddComplaintModal] = useState(false);
  const [targetExpertIdForComplaint, setTargetExpertIdForComplaint] = useState<string>('');

  const [newComplaintCaseId, setNewComplaintCaseId] = useState('');
  const [newComplainantName, setNewComplainantName] = useState('');
  const [newComplainantRole, setNewComplainantRole] = useState<'زیان‌دیده' | 'مقصر' | 'تعمیرگاه' | 'مدیر بیمه'>('زیان‌دیده');
  const [newReasonCategory, setNewReasonCategory] = useState<'مبلغ برآورد ناچیز' | 'تأخیر در پاسخگویی' | 'عدم بررسی دقیق قطعات' | 'برخورد نامناسب' | 'سایر'>('مبلغ برآورد ناچیز');
  const [newComplaintDesc, setNewComplaintDesc] = useState('');

  const [perfFilter, setPerfFilter] = useState<'ALL' | 'EXCELLENT' | 'COMPLAINTS' | 'SLOW'>('ALL');
  const [perfSearch, setPerfSearch] = useState('');

  // Helper to compute individual performance for an assessor
  const getExpertEvaluation = (exp: StaffMember) => {
    const assignedCases = companyCases.filter((c) => c.assignedExpert?.id === exp.id);
    const assignedCount = assignedCases.length;
    const evaluatedCount = assignedCases.filter((c) =>
      c.status.includes('ارزیابی') || c.status.includes('تایید') || c.status.includes('پرداخت')
    ).length;

    const expertComplaints = complaintsList.filter(
      (cmp) => cmp.expertId === exp.id && cmp.status !== 'مردود'
    );
    const complaintsCount = expertComplaints.length;

    // SLA response time (in minutes)
    let avgResponseMins = 25;
    if (exp.id === 'd2') avgResponseMins = 115;
    else if (exp.id === 'a2') avgResponseMins = 75;
    else if (exp.id === 'ir2') avgResponseMins = 140;
    else if (exp.id === 'd1') avgResponseMins = 22;
    else if (exp.id === 'a1') avgResponseMins = 18;
    else if (exp.id === 'ir1') avgResponseMins = 15;

    // AI Match Rate (%)
    let aiMatchRate = 95.0;
    if (exp.id === 'd2') aiMatchRate = 88.0;
    else if (exp.id === 'ir2') aiMatchRate = 82.5;
    else if (exp.id === 'a2') aiMatchRate = 91.0;
    else if (exp.id === 'd1') aiMatchRate = 96.5;

    // Satisfaction score out of 5
    let rating = 4.8;
    if (exp.id === 'd2') rating = 3.6;
    else if (exp.id === 'ir2') rating = 3.2;
    else if (exp.id === 'a2') rating = 4.1;

    // Calculate dynamic performance score (0 - 100)
    let score = 100;

    // 1. SLA response time impact
    if (avgResponseMins <= 20) {
      score += 5;
    } else if (avgResponseMins <= 45) {
      score -= 5;
    } else if (avgResponseMins <= 90) {
      score -= 15;
    } else {
      score -= 28; // Heavy delay penalty
    }

    // 2. Complaints Penalty (each complaint deducts impactPoints or 18 points)
    const complaintDeductions = expertComplaints.reduce((acc, c) => acc + (c.impactPoints || 18), 0);
    score -= complaintDeductions;

    // 3. Customer rating impact
    if (rating >= 4.7) score += 5;
    else if (rating < 3.5) score -= 15;
    else if (rating < 4.2) score -= 8;

    // AI Match impact
    if (aiMatchRate < 85) score -= 8;

    // 5. Inaction / 72-Hour Timeout Violations (Critical penalty for abandoning assigned cases)
    const timedOutCases = companyCases.filter(
      (c) =>
        c.autoReturnedDueToTimeout &&
        (c.timedOutExpert?.id === exp.id ||
          c.previousAssignedExpert?.id === exp.id ||
          c.rejectedByAssessorIds?.includes(exp.id))
    );
    const timeoutViolationsCount = timedOutCases.length;
    const timeoutPenaltyPoints = timeoutViolationsCount * 25; // 25 points penalty per 72h timeout inaction
    score -= timeoutPenaltyPoints;

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    let tierLabel = 'عالی (A+)';
    let tierColor = 'text-emerald-950 border-emerald-300 bg-emerald-100';
    let badgeClass = 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold';

    if (finalScore >= 88) {
      tierLabel = 'عالی (A+)';
      tierColor = 'text-emerald-950 border-emerald-300 bg-emerald-100';
      badgeClass = 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold';
    } else if (finalScore >= 70) {
      tierLabel = 'خوب (B)';
      tierColor = 'text-blue-950 border-blue-300 bg-blue-100';
      badgeClass = 'bg-blue-100 text-blue-950 border-blue-300 font-extrabold';
    } else if (finalScore >= 50) {
      tierLabel = 'نیازمند بهبود (C)';
      tierColor = 'text-amber-950 border-amber-300 bg-amber-100';
      badgeClass = 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold';
    } else {
      tierLabel = 'بحرانی / افت شدید (D)';
      tierColor = 'text-rose-950 border-rose-300 bg-rose-100';
      badgeClass = 'bg-rose-100 text-rose-950 border-rose-300 font-extrabold';
    }

    return {
      assignedCount,
      evaluatedCount,
      complaintsCount,
      expertComplaints,
      complaintDeductions,
      timeoutViolationsCount,
      timeoutPenaltyPoints,
      timedOutCases,
      avgResponseMins,
      aiMatchRate,
      rating,
      finalScore,
      tierLabel,
      tierColor,
      badgeClass
    };
  };

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetExpertIdForComplaint || !newComplainantName.trim() || !newComplaintDesc.trim()) return;

    const targetExp = currentCompanyExperts.find((exp) => exp.id === targetExpertIdForComplaint);
    if (!targetExp) return;

    const newCmp: ExpertComplaint = {
      id: `CMP-${Date.now()}`,
      expertId: targetExp.id,
      expertName: targetExp.name,
      caseId: newComplaintCaseId.trim() || 'CF-عمومی',
      complainantName: newComplainantName.trim(),
      complainantRole: newComplainantRole,
      reasonCategory: newReasonCategory,
      description: newComplaintDesc.trim(),
      filedAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'تایید شده (ثبت در پرونده)',
      impactPoints: 18
    };

    const updatedComplaints = [newCmp, ...complaintsList];
    setComplaintsList(updatedComplaints);
    saveComplaintsToStorage(updatedComplaints);

    setShowAddComplaintModal(false);
    setNewComplaintCaseId('');
    setNewComplainantName('');
    setNewComplaintDesc('');
    setAssessorActionMsg(`شکایت جدید برای کارشناس «${targetExp.name}» ثبت و در ارزیابی عملکرد وی لحاظ شد.`);
    setTimeout(() => setAssessorActionMsg(null), 4000);
  };

  const handleToggleComplaintStatus = (complaintId: string) => {
    const updated = complaintsList.map((cmp) => {
      if (cmp.id === complaintId) {
        const nextStatus = cmp.status === 'تایید شده (ثبت در پرونده)' ? 'مردود' : 'تایید شده (ثبت در پرونده)';
        return { ...cmp, status: nextStatus as any };
      }
      return cmp;
    });
    setComplaintsList(updated);
    saveComplaintsToStorage(updated);
  };


  // Filter cases relevant to this insurer
  const companyCases = cases.filter(
    (c) =>
      c.culpritInsurer === companyCode ||
      c.victimInsurer === companyCode ||
      (companyInfo && getInsurerPersianName(c.culpritInsurer) === companyInfo.name) ||
      (companyInfo && getInsurerPersianName(c.victimInsurer) === companyInfo.name) ||
      true // Show all cases for full demo completeness
  );

  // Status matching helper for cards and filters
  const matchesCardStatus = (caseStatus: string | undefined, cardStatus: string): boolean => {
    if (!caseStatus) return false;
    if (cardStatus === 'ALL') return true;

    const s = caseStatus.trim();
    const target = cardStatus.trim();

    if (s === target) return true;

    if (target === 'انتظار تایید مقصر') {
      return s.includes('تایید مقصر') || s.includes('انتظار تایید مقصر');
    }
    if (target === 'انتظار تایید زیان‌دیده') {
      return s.includes('زیان‌دیده') || s.includes('زیاندیده') || s.includes('تایید زیان');
    }
    if (target === 'در انتظار ارجاع') {
      return s.includes('در انتظار ارجاع') || s.includes('ارجاع به ارزیاب') || s.includes('انتظار ارجاع');
    }
    if (target === 'محول شده') {
      return s.includes('محول شده') || s.includes('محول') || s.includes('تخصیص یافته');
    }
    if (target === 'در حال ارزیابی') {
      return s.includes('در حال ارزیابی');
    }
    if (target === 'ارزیابی شده') {
      return s.includes('ارزیابی شده') || s.includes('بررسی شده');
    }
    if (target === 'در انتظار بررسی بازبین') {
      return s.includes('بازبین') || s.includes('در انتظار بررسی بازبین') || s.includes('در انتظار بازبینی');
    }
    if (target === 'در انتظار پرداخت') {
      return s.includes('در انتظار پرداخت') || s.includes('آماده پرداخت');
    }
    if (target === 'پرداخت شده') {
      return s.includes('پرداخت شده') || s.includes('تسویه شده');
    }
    if (target === 'نیازمند اصلاح مشتری') {
      return s.includes('اصلاح') || s.includes('نیازمند اصلاح');
    }
    if (target === 'رد شده') {
      return s.includes('رد شده') || s.includes('مردود');
    }

    return false;
  };

  // Status counts for the 11 cards
  const totalCount = companyCases.length;
  const countCulpritPending = companyCases.filter((c) => matchesCardStatus(c.status, 'انتظار تایید مقصر')).length;
  const countVictimPending = companyCases.filter((c) => matchesCardStatus(c.status, 'انتظار تایید زیان‌دیده')).length;
  const countReferralPending = companyCases.filter((c) => matchesCardStatus(c.status, 'در انتظار ارجاع')).length;
  const countAssigned = companyCases.filter((c) => matchesCardStatus(c.status, 'محول شده')).length;
  const countEvaluating = companyCases.filter((c) => matchesCardStatus(c.status, 'در حال ارزیابی')).length;

  const countEvaluated = companyCases.filter((c) => matchesCardStatus(c.status, 'ارزیابی شده')).length;
  const countReviewerPending = companyCases.filter((c) => matchesCardStatus(c.status, 'در انتظار بررسی بازبین') || (c.assessment && !c.reviewerApproval?.approved && c.status !== 'در انتظار تایید کاربر' && !c.status.includes('پرداخت'))).length;
  const countPaymentPending = companyCases.filter((c) => matchesCardStatus(c.status, 'در انتظار پرداخت')).length;
  const countPaid = companyCases.filter((c) => matchesCardStatus(c.status, 'پرداخت شده')).length;
  const countFixNeeded = companyCases.filter((c) => matchesCardStatus(c.status, 'نیازمند اصلاح مشتری')).length;
  const countRejected = companyCases.filter((c) => matchesCardStatus(c.status, 'رد شده')).length;

  const filteredCases = companyCases.filter((c) => {
    if (selectedStatus !== 'ALL' && !matchesCardStatus(c.status, selectedStatus)) return false;
    if (
      selectedProvince &&
      !c.address?.toLowerCase().includes(selectedProvince.toLowerCase())
    )
      return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = c.id.toLowerCase().includes(term);
      const matchPlate =
        c.victimPlate?.toLowerCase().includes(term) ||
        c.culpritPlate?.toLowerCase().includes(term) ||
        c.plate?.toLowerCase().includes(term);
      const matchName =
        c.victimName?.toLowerCase().includes(term) ||
        c.culpritName?.toLowerCase().includes(term);
      const matchAddress = c.address?.toLowerCase().includes(term);

      return matchId || matchPlate || matchName || matchAddress;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (!filteredCases.length) return;
    const headers = ['کد پیگیری', 'تاریخ', 'وضعیت', 'زیان‌دیده', 'مقصر', 'آدرس', 'مبلغ قابل پرداخت'];
    const rows = filteredCases.map((c) => [
      c.id,
      c.date || '',
      c.status || '',
      c.victimName || '',
      c.culpritName || '',
      c.address || '',
      c.assessment?.payable ? String(c.assessment.payable) : '0'
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ClaimFlow_Report_${companyCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCardClick = (status: string) => {
    setSelectedStatus(status);
    setActiveTab('cases');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in" dir="rtl">
      
      {/* TOP SUB-NAVIGATION HEADER BAR (As shown in reference image) */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        
        {/* Right side: Company Badge & Role */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-blue-950 block">
              {companyInfo.name}
            </span>
            <span className="text-[11px] text-slate-500 font-bold block">
              کارشناس {companyInfo.name}
            </span>
          </div>
        </div>

        {/* Center: Navigation Menu Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 flex-1 max-w-4xl">
          
          <button
            onClick={() => setActiveTab('dash')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'dash'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>داشبورد</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'cases'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>پرونده‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('experts')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'experts'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>عملکرد کارشناسان</span>
          </button>

          <button
            onClick={() => setActiveTab('aiConsole')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'aiConsole'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>کنسول هوش</span>
          </button>

          <button
            onClick={() => setActiveTab('assessors')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'assessors'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>مدیریت ارزیاب‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('reviewers')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'reviewers'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>مدیریت کارشناسان/بازبین‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>پرداخت</span>
          </button>

          <button
            onClick={() => setActiveTab('bodyClaim')}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'bodyClaim'
                ? 'bg-blue-900 text-white shadow-md border border-blue-950'
                : 'text-slate-700 hover:text-blue-950 hover:bg-blue-50 font-bold'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>ادعای بدنه</span>
          </button>

        </div>

        {/* Left side: Exit / Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200 shrink-0 font-bold"
            title="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}

      </div>

      {/* VIEW 1: MAIN DASHBOARD (داشبورد) */}
      {activeTab === 'dash' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Header Greeting Title */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-blue-950 tracking-tight">
              داشبورد مدیریت پرونده‌های بیمه
            </h1>
            <p className="text-xs text-slate-600 font-bold">
              خوش آمدید به درگاه سازمانی {companyInfo.name}
            </p>
          </div>

          {/* EXACT 11 STATS CARDS GRID */}
          <div className="space-y-3">
            
            {/* ROW 1: 6 Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              
              {/* Card 1: کل پرونده‌ها */}
              <div
                onClick={() => handleCardClick('ALL')}
                className="bg-white border-2 border-slate-200 hover:border-blue-900 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-blue-950 font-mono">{totalCount}</span>
                  <div className="p-2 rounded-xl bg-blue-900 text-amber-400 group-hover:scale-110 transition-transform shadow-xs">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800 block">کل پرونده‌ها</span>
              </div>

              {/* Card 2: انتظار تایید مقصر */}
              <div
                onClick={() => handleCardClick('انتظار تایید مقصر')}
                className="bg-white border-2 border-slate-200 hover:border-amber-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countCulpritPending}</span>
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">انتظار تایید مقصر</span>
              </div>

              {/* Card 3: انتظار تایید زیان‌دیده */}
              <div
                onClick={() => handleCardClick('انتظار تایید زیان‌دیده')}
                className="bg-white border-2 border-slate-200 hover:border-amber-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countVictimPending}</span>
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">انتظار تایید زیان‌دیده</span>
              </div>

              {/* Card 4: در انتظار ارجاع */}
              <div
                onClick={() => handleCardClick('در انتظار ارجاع')}
                className="bg-white border-2 border-slate-200 hover:border-orange-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countReferralPending}</span>
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-800 group-hover:scale-110 transition-transform">
                    <Hourglass className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">در انتظار ارجاع</span>
              </div>

              {/* Card 5: محول شده */}
              <div
                onClick={() => handleCardClick('محول شده')}
                className="bg-white border-2 border-slate-200 hover:border-sky-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countAssigned}</span>
                  <div className="p-2 rounded-xl bg-sky-100 text-sky-800 group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">محول شده</span>
              </div>

              {/* Card 6: در حال ارزیابی */}
              <div
                onClick={() => handleCardClick('در حال ارزیابی')}
                className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countEvaluating}</span>
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-800 group-hover:scale-110 transition-transform">
                    <Search className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">در حال ارزیابی</span>
              </div>

            </div>

            {/* ROW 2: 5 Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              
              {/* Card 7: ارزیابی شده */}
              <div
                onClick={() => handleCardClick('ارزیابی شده')}
                className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countEvaluated}</span>
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 group-hover:scale-110 transition-transform">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">ارزیابی شده</span>
              </div>

              {/* Card 7.5: در انتظار بررسی بازبین */}
              <div
                onClick={() => handleCardClick('در انتظار بررسی بازبین')}
                className="bg-purple-50/60 border-2 border-purple-200 hover:border-purple-600 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-purple-950 font-mono">{countReviewerPending}</span>
                  <div className="p-2 rounded-xl bg-purple-600 text-white group-hover:scale-110 transition-transform shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-black text-purple-900 block">در انتظار بررسی بازبین</span>
              </div>

              {/* Card 8: در انتظار پرداخت */}
              <div
                onClick={() => handleCardClick('در انتظار پرداخت')}
                className="bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countPaymentPending}</span>
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">در انتظار پرداخت</span>
              </div>

              {/* Card 9: پرداخت شده */}
              <div
                onClick={() => handleCardClick('پرداخت شده')}
                className="bg-white border-2 border-slate-200 hover:border-teal-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countPaid}</span>
                  <div className="p-2 rounded-xl bg-teal-100 text-teal-800 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">پرداخت شده</span>
              </div>

              {/* Card 10: نیازمند اصلاح مشتری */}
              <div
                onClick={() => handleCardClick('نیازمند اصلاح مشتری')}
                className="bg-white border-2 border-slate-200 hover:border-rose-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countFixNeeded}</span>
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-800 group-hover:scale-110 transition-transform">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">نیازمند اصلاح مشتری</span>
              </div>

              {/* Card 11: رد شده */}
              <div
                onClick={() => handleCardClick('رد شده')}
                className="bg-white border-2 border-slate-200 hover:border-rose-500 rounded-2xl p-4 shadow-xs transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900 font-mono">{countRejected}</span>
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-800 group-hover:scale-110 transition-transform">
                    <XCircle className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-700 block">رد شده</span>
              </div>

            </div>

          </div>

          {/* RECENT CLAIMS SECTION (آخرین پرونده‌ها) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-black text-blue-950">آخرین پرونده‌های ارجاعی</h2>
              <button
                onClick={() => setActiveTab('cases')}
                className="text-xs font-extrabold text-blue-900 hover:text-blue-700 transition-colors"
              >
                مشاهده همه
              </button>
            </div>

            {companyCases.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FolderOpen className="w-12 h-12 mx-auto text-slate-400" />
                <p className="text-xs font-bold">پرونده‌ای موجود نیست.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {companyCases.slice(0, 4).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onOpenCaseDetail(c.id)}
                    className="bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-md cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-200 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-black text-blue-950 font-mono block">
                          {c.id}
                        </span>
                        <p className="text-xs text-slate-700 font-medium">
                          {c.victimName} — {c.date}
                        </p>
                        {c.address && (
                          <p className="text-[11px] text-slate-500 max-w-md truncate font-medium">
                            {c.address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                        {c.status}
                      </span>
                      <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: CASES LIST TABLE (پرونده‌ها) */}
      {activeTab === 'cases' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Export Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-950">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">مدیریت جامع پرونده‌های ارجاعی</h2>
              <p className="text-xs text-blue-100 font-medium">
                جستجو، فیلتر و صدور خروجی اکسل گزارشات پرونده‌های شرکت {companyInfo.name}
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-blue-950 font-black text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 shrink-0 border border-amber-300"
            >
              <FileSpreadsheet className="w-4 h-4" />
              خروجی اکسل (CSV)
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-900" />
                فیلتر پیشرفته پرونده‌ها
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجوی سریع (کد، نام، پلاک، آدرس)..."
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:border-blue-900 transition-all"
              />

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900 cursor-pointer transition-all"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="انتظار تایید مقصر">انتظار تایید مقصر</option>
                <option value="انتظار تایید زیان‌دیده">انتظار تایید زیان‌دیده</option>
                <option value="در انتظار ارجاع">در انتظار ارجاع</option>
                <option value="محول شده">محول شده</option>
                <option value="در حال ارزیابی">در حال ارزیابی</option>
                <option value="ارزیابی شده">ارزیابی شده</option>
                <option value="در انتظار پرداخت">در انتظار پرداخت</option>
                <option value="پرداخت شده">پرداخت شده</option>
                <option value="نیازمند اصلاح مشتری">نیازمند اصلاح مشتری</option>
                <option value="رد شده">رد شده</option>
              </select>

              <input
                type="text"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                placeholder="فیلتر استان/شهر (مثال: تهران، اصفهان)..."
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:border-blue-900 transition-all"
              />
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-blue-950 text-sm">
                لیست پرونده‌های {companyInfo.name} ({filteredCases.length})
              </h3>
            </div>

            {filteredCases.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FolderOpen className="w-12 h-12 mx-auto text-slate-400" />
                <p className="text-xs font-bold">پرونده‌ای با این فیلترها یافت نشد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">کد پیگیری</th>
                      <th className="p-3.5">تاریخ</th>
                      <th className="p-3.5">زیان‌دیده</th>
                      <th className="p-3.5">مقصر</th>
                      <th className="p-3.5">آدرس</th>
                      <th className="p-3.5">وضعیت</th>
                      <th className="p-3.5 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                    {filteredCases.map((c) => (
                      <tr key={c.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="p-3.5 font-black font-mono text-blue-950">
                          {c.id}
                          {c.fraudFlag?.flagged && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 inline mr-1" />}
                        </td>
                        <td className="p-3.5 text-slate-600">{c.date}</td>
                        <td className="p-3.5">
                          <span className="font-bold block text-slate-900">{c.victimName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{c.victimPlate}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold block text-slate-900">{c.culpritName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{c.culpritPlate}</span>
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-slate-700">{c.address || '-'}</td>
                        <td className="p-3.5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                c.status === 'رد شده'
                                  ? 'bg-rose-100 text-rose-950 border-rose-300'
                                  : c.status.includes('ارزیابی')
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                  : 'bg-amber-100 text-amber-950 border-amber-300'
                              }`}
                            >
                              {c.status}
                            </span>
                            {c.status === 'رد شده' && (c.autoReturnedDueToTimeout || c.expertRejected?.reason?.includes('۷۲ ساعت')) && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-200/90 text-rose-950 border border-rose-400">
                                انقضای ۷۲ ساعته (عودت خودکار)
                              </span>
                            )}
                            {(!c.hasKroki && !c.sceneReportCode && !c.customerKrokiPhoto && !c.croquiData) && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-200/80 text-amber-950 border border-amber-400">
                                فاقد کروکی (نیازمند کارشناس میدانی)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => onOpenCaseDetail(c.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-black text-[11px] transition-all shadow-sm active:scale-95"
                          >
                            بررسی پرونده
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 3: EXPERTS PERFORMANCE (عملکرد کارشناسان) */}
      {activeTab === 'experts' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-900" />
                ارزیابی انفرادی عملکرد و SLA کارشناسان {companyInfo.name}
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                تحلیل جداگانه هر کارشناس، پایش زمان پاسخگویی (SLA) و تاثیر مستقیم شکایت‌های ثبت‌شده توسط مشتریان بر نمره عملکرد
              </p>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2 self-start md:self-auto shrink-0 shadow-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ثبت شکایت تنها توسط مشتریان (زیان‌دیده/مقصر) در پورتال پرونده انجام می‌شود</span>
            </div>
          </div>

          {/* Action Notification */}
          {assessorActionMsg && (
            <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-2xl text-blue-950 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-blue-900 shrink-0" />
              <span>{assessorActionMsg}</span>
            </div>
          )}

          {/* Company-Wide Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-600 font-bold block">تعداد کارشناسان</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-950 font-mono">{currentCompanyExperts.length}</span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  ({currentCompanyExperts.filter((e) => e.active !== false).length} فعال)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">کارشناسان ثبت‌شده شرکت</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-600 font-bold block">میانگین زمان بررسی</span>
              <span className="text-2xl font-black text-amber-700 font-mono">
                {Math.round(
                  currentCompanyExperts.reduce((acc, exp) => acc + getExpertEvaluation(exp).avgResponseMins, 0) /
                    (currentCompanyExperts.length || 1)
                )}{' '}
                دقیقه
              </span>
              <p className="text-[10px] text-slate-500 font-medium">شاخص سرعت SLA شرکت</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-600 font-bold block">مجموع شکایت‌های فعال</span>
              <span className="text-2xl font-black text-rose-700 font-mono">
                {
                  complaintsList.filter(
                    (c) => currentCompanyExperts.some((exp) => exp.id === c.expertId) && c.status !== 'مردود'
                  ).length
                }
              </span>
              <p className="text-[10px] text-rose-700 font-bold">کاهش مستقیم امتیاز عملکرد</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-600 font-bold block">میانگین نمره عملکرد</span>
              <span className="text-2xl font-black text-blue-950 font-mono">
                {(
                  currentCompanyExperts.reduce((acc, exp) => acc + getExpertEvaluation(exp).finalScore, 0) /
                  (currentCompanyExperts.length || 1)
                ).toFixed(1)}{' '}
                / ۱۰۰
              </span>
              <p className="text-[10px] text-slate-500 font-medium">بر اساس الگوریتم چندعاملی</p>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-800/50 p-3 rounded-2xl border border-slate-800">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setPerfFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  perfFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                همه کارشناسان
              </button>
              <button
                onClick={() => setPerfFilter('EXCELLENT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  perfFilter === 'EXCELLENT'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-emerald-400'
                }`}
              >
                <span>عملکرد عالی</span>
              </button>
              <button
                onClick={() => setPerfFilter('COMPLAINTS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  perfFilter === 'COMPLAINTS'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-rose-400'
                }`}
              >
                <span>دارای شکایت</span>
              </button>
              <button
                onClick={() => setPerfFilter('SLOW')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  perfFilter === 'SLOW'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-amber-400'
                }`}
              >
                <span>پاسخگویی کند</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={perfSearch}
                onChange={(e) => setPerfSearch(e.target.value)}
                placeholder="جستجوی نام یا سمت کارشناس..."
                className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Individual Assessor Evaluation Cards */}
          <div className="space-y-4">
            {currentCompanyExperts
              .filter((exp) => {
                const evalData = getExpertEvaluation(exp);
                if (perfFilter === 'EXCELLENT' && evalData.finalScore < 88) return false;
                if (perfFilter === 'COMPLAINTS' && evalData.complaintsCount === 0) return false;
                if (perfFilter === 'SLOW' && evalData.avgResponseMins <= 45) return false;

                if (perfSearch.trim()) {
                  const q = perfSearch.trim().toLowerCase();
                  return exp.name.toLowerCase().includes(q) || exp.role.toLowerCase().includes(q);
                }
                return true;
              })
              .map((exp) => {
                const evalData = getExpertEvaluation(exp);
                const isActive = exp.active !== false;

                return (
                  <div
                    key={exp.id}
                    className="bg-white border-2 border-slate-200 hover:border-blue-900 rounded-2xl p-5 shadow-sm transition-all space-y-4 relative overflow-hidden"
                  >
                    {/* Top Row: Expert Info & Performance Gauge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-900 flex items-center justify-center font-black text-white text-base shadow-sm shrink-0">
                          {exp.name.slice(0, 2)}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-blue-950 text-base">{exp.name}</h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-rose-100 text-rose-900 border-rose-300'
                              }`}
                            >
                              {isActive ? 'فعال' : 'غیرفعال'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600 font-bold block">{exp.role}</span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            تلفن: {exp.phone || 'ثبت نشده'} | کد ملی: {exp.nationalId || '-'}
                          </span>
                        </div>
                      </div>

                      {/* Performance Score Gauge Badge */}
                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="p-3 rounded-2xl border-2 border-amber-300 bg-amber-50 text-center font-mono space-y-0.5 text-amber-950">
                          <span className="text-[10px] font-bold text-slate-700 block">نمره عملکرد (تک‌به‌تک)</span>
                          <span className="text-2xl font-black block text-blue-950">{evalData.finalScore} / ۱۰۰</span>
                          <span className="text-[10px] font-black block">{evalData.tierLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* 5 Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                      {/* Metric 1: Avg Response Time */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px] font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            زمان پاسخگویی (SLA)
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-blue-950 font-mono block">
                          {evalData.avgResponseMins} دقیقه
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {evalData.avgResponseMins <= 30
                            ? 'پاسخگویی سریع (پاداش +۵)'
                            : evalData.avgResponseMins <= 60
                            ? 'پاسخگویی عادی (کسر -۵)'
                            : 'کندی محسوس (کسر -۲۸)'}
                        </span>
                      </div>

                      {/* Metric 2: Complaints Filed */}
                      <div
                        className={`p-3 rounded-xl border space-y-1 ${
                          evalData.complaintsCount > 0
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold flex items-center gap-1 text-slate-700">
                            <AlertTriangle
                              className={`w-3.5 h-3.5 ${
                                evalData.complaintsCount > 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}
                            />
                            شکایت‌های ثبت‌شده
                          </span>
                        </div>
                        <span
                          className={`text-base font-extrabold font-mono block ${
                            evalData.complaintsCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {evalData.complaintsCount} شکایت
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {evalData.complaintsCount > 0
                            ? `تاثیر: ${evalData.complaintDeductions}- امتیاز`
                            : 'بدون هیچ شکایت ثبت‌شده (عالی)'}
                        </span>
                      </div>

                      {/* Metric 3: 72-Hour Inaction Timeout Violations */}
                      <div
                        className={`p-3 rounded-xl border space-y-1 ${
                          evalData.timeoutViolationsCount > 0
                            ? 'bg-rose-50 border-rose-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold flex items-center gap-1 text-slate-700">
                            <Timer
                              className={`w-3.5 h-3.5 ${
                                evalData.timeoutViolationsCount > 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}
                            />
                            انقضای ۷۲ ساعته
                          </span>
                        </div>
                        <span
                          className={`text-base font-extrabold font-mono block ${
                            evalData.timeoutViolationsCount > 0 ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {evalData.timeoutViolationsCount} پرونده
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {evalData.timeoutViolationsCount > 0
                            ? `جریمه: ${evalData.timeoutPenaltyPoints}- نمره منفی`
                            : 'اقدام به‌موقع در مهلت مقرر'}
                        </span>
                      </div>

                      {/* Metric 4: Customer Satisfaction Rating */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px] font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            رضایت مشتریان
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-amber-700 font-mono flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                          <span>{evalData.rating} از ۵</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block">بر اساس نظرسنجی پرونده‌ها</span>
                      </div>

                      {/* Metric 5: Evaluated Cases */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[11px] font-bold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-blue-900" />
                            پرونده‌های ارزیابی‌شده
                          </span>
                        </div>
                        <span className="text-base font-extrabold text-blue-950 font-mono block">
                          {evalData.evaluatedCount} از {evalData.assignedCount} پرونده
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block">تطابق با AI: {evalData.aiMatchRate}٪</span>
                      </div>
                    </div>

                    {/* Timeout Violation Warning Banner if > 0 */}
                    {evalData.timeoutViolationsCount > 0 && (
                      <div className="p-3.5 bg-rose-100/90 border border-rose-300 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-950 font-bold animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                          <span>
                            <strong>هشدار انقضای مهلت ۷۲ ساعته:</strong> تعداد <strong>{evalData.timeoutViolationsCount} پرونده</strong> به علت عدم بررسی و رها شدن در کارتابل ظرف ۷۲ ساعت، به صورت خودکار از کارتابل وی عودت داده شد و <strong>{evalData.timeoutPenaltyPoints} امتیاز منفی</strong> در نمره شایستگی ایشان اعمال گردیده است.
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-rose-700 text-white text-[10px] font-black shrink-0">
                          عودت خودکار سیستم
                        </span>
                      </div>
                    )}

                    {/* Complaint Warning Banner if complaints > 0 */}
                    {evalData.complaintsCount > 0 && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-950 font-medium">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            تعداد <strong>{evalData.complaintsCount} شکایت رسمی</strong> برای این کارشناس ثبت شده و
                            باعث کسر <strong>{evalData.complaintDeductions} امتیاز</strong> از شایستگی عملکردی وی
                            گردیده است.
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedExpertForComplaints(exp)}
                          className="px-3 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-black text-[11px] shrink-0 active:scale-95 transition-all"
                        >
                          مشاهده لیست شکایت‌ها
                        </button>
                      </div>
                    )}

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500 font-bold">
                        ثبت شکایت: فقط توسط مشتریان در پورتال
                      </span>

                      <button
                        onClick={() => setSelectedExpertForComplaints(exp)}
                        className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 font-black flex items-center gap-1.5 border border-blue-200 transition-all active:scale-95"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>مشاهده و نظارت بر شکایت‌های مشتریان ({evalData.complaintsCount})</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* COMPLAINTS DETAILS MODAL */}
          {selectedExpertForComplaints && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl max-w-2xl w-full space-y-5 shadow-xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                      <span>سوابق و لیست شکایت‌های ثبت‌شده — {selectedExpertForComplaints.name}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-bold">
                      {selectedExpertForComplaints.role} ({companyInfo.name})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedExpertForComplaints(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                {complaintsList.filter((c) => c.expertId === selectedExpertForComplaints.id).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-slate-900">هیچ شکایتی برای این کارشناس ثبت نشده است!</p>
                    <p className="text-slate-500">عملکرد این کارشناس از نظر رضایت مشتریان بسیار مطلوب است.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {complaintsList
                      .filter((c) => c.expertId === selectedExpertForComplaints.id)
                      .map((cmp) => {
                        const isApproved = cmp.status === 'تایید شده (ثبت در پرونده)';

                        return (
                          <div
                            key={cmp.id}
                            className={`p-4 rounded-2xl border space-y-2.5 ${
                              isApproved ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">{cmp.complainantName}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
                                    {cmp.complainantRole}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                    دلیل: {cmp.reasonCategory}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 block mt-1 font-mono">
                                  کد پرونده: {cmp.caseId || 'عمومی'} | تاریخ ثبت: {cmp.filedAt}
                                </span>
                              </div>

                              <button
                                onClick={() => handleToggleComplaintStatus(cmp.id)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                  isApproved
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-900'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                                }`}
                              >
                                {isApproved ? 'رد/بایگانی شکایت' : 'تایید مجدد'}
                              </button>
                            </div>

                            <p className="text-slate-800 leading-relaxed text-xs bg-white p-2.5 rounded-xl border border-slate-200 font-medium">
                              {cmp.description}
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 font-bold">
                              <span>جریمه عملکردی: {isApproved ? `کسر ${cmp.impactPoints} امتیاز` : 'بدون جریمه (مردود)'}</span>
                              <span className="text-slate-900">وضعیت: {cmp.status}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-slate-200 text-xs">
                  <p className="text-[11px] text-slate-500 font-medium">
                    ثبت شکایت جدید فقط توسط مشتریان در پورتال انجام می‌شود. اپراتور امکان لغو/بایگانی شکایت‌های نامعتبر را دارد.
                  </p>
                  <button
                    onClick={() => setSelectedExpertForComplaints(null)}
                    className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shrink-0 self-end sm:self-auto shadow-sm"
                  >
                    بستن پنجره
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMER COMPLAINT REGISTRATION NOTICE MODAL */}
          {showAddComplaintModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>قوانین ثبت شکایت از کارشناسان ارزیاب</span>
                  </h3>
                  <button
                    onClick={() => setShowAddComplaintModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-amber-950">
                    <span className="font-bold block text-sm">اپراتور بیمه مجاز به ثبت شکایت دستی نیست</span>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      بر اساس سیاست شفافیت و پایش عملکرد، ثبت شکایت از کارشناس ارزیاب **تنها توسط مشتریان (زیان‌دیدگان و مقصرین)** در پورتال ثبت پرونده امکان‌پذیر است.
                    </p>
                  </div>

                  <p className="text-slate-600 font-medium">
                    شکایت‌های مشتریان به صورت مستقیم در پنل بیمه‌گر درج شده و نمره عملکرد کارشناس را کاهش می‌دهند. اپراتور بیمه می‌تواند شکایت‌های دریافتی را بررسی کرده و در صورت عدم صحت، آن‌ها را **«مردود / بایگانی»** نماید تا جریمه نمره‌ای لغو گردد.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowAddComplaintModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-sm"
                  >
                    متوجه شدم
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* VIEW 4: AI CONSOLE (کنسول هوش) */}
      {activeTab === 'aiConsole' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                کنسول هوش مصنوعی و پایش تقلب (ClaimFlow AI Console)
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">شناسایی هوشمند الگوهای مشکوک و تخمین خودکار برآورد</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
            <h3 className="font-black text-sm text-blue-950">الگوریتم پیشرفته تشخیص تقلب فعال است</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              سیستم به صورت خودکار تصاویر صحنه تصادف، خط و خش‌های قدیمی، تطابق پلاک و کد VIN را کنترل کرده و هشدار صادر می‌نماید.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 5: ASSESSORS (مدیریت ارزیاب‌ها) */}
      {activeTab === 'assessors' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-900" />
                مدیریت ارزیابان و کارشناسان خسارت {companyInfo.name}
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                مشاهده کد ملی، شماره تماس، مدیریت وضعیت فعالیت (فعال/غیرفعال) و عدم امکان ارجاع پرونده به کارشناسان غیرفعال
              </p>
            </div>

            <button
              onClick={() => setShowAddAssessorModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>افزودن ارزیاب جدید</span>
            </button>
          </div>

          {/* Action Message Notification */}
          {assessorActionMsg && (
            <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-2xl text-blue-950 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-blue-900 shrink-0" />
              <span>{assessorActionMsg}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={assessorSearch}
                onChange={(e) => setAssessorSearch(e.target.value)}
                placeholder="جستجو بر اساس نام، شماره تلفن، کد ملی یا نقش ارزیاب..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:border-blue-900"
              />
            </div>
            {assessorSearch && (
              <button
                onClick={() => setAssessorSearch('')}
                className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                پاکسازی
              </button>
            )}
          </div>

          {/* Assessors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCompanyExperts
              .filter((exp) => {
                if (!assessorSearch.trim()) return true;
                const q = assessorSearch.trim().toLowerCase();
                return (
                  exp.name.toLowerCase().includes(q) ||
                  exp.role.toLowerCase().includes(q) ||
                  exp.phone?.toLowerCase().includes(q) ||
                  exp.nationalId?.toLowerCase().includes(q)
                );
              })
              .map((exp) => {
                const isActive = exp.active !== false;

                return (
                  <div
                    key={exp.id}
                    className={`p-5 rounded-2xl border-2 transition-all space-y-3 relative overflow-hidden ${
                      isActive
                        ? 'bg-white border-slate-200 hover:border-blue-900'
                        : 'bg-slate-50 border-slate-300 opacity-75'
                    }`}
                  >
                    {/* Top row: Name, Role & Active Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-950 text-base">{exp.name}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                          >
                            {isActive ? 'فعال (آماده ارجاع)' : 'غیرفعال (عدم امکان ارجاع)'}
                          </span>
                        </div>
                        <span className="text-xs text-blue-900 font-bold block">{exp.role}</span>
                      </div>

                      {/* Active/Inactive Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleAssessorStatus(exp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                            : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}</span>
                      </button>
                    </div>

                    {/* Details: National ID & Phone */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">کد ملی کارشناس:</span>
                          <span className="font-bold text-slate-900 font-mono text-xs">{exp.nationalId || 'ثبت نشده'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">شماره تلفن همراه:</span>
                          <span className="font-bold text-slate-900 font-mono text-xs">{exp.phone || 'ثبت نشده'}</span>
                        </div>
                      </div>
                    </div>

                    {!isActive && (
                      <p className="text-[11px] text-amber-950 bg-amber-50 p-2 rounded-xl border border-amber-300 font-bold">
                        این کارشناس غیرفعال است و سیستم اجازه ارجاع یا تخصیص پرونده‌های جدید به وی را نخواهد داد.
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Add New Assessor Modal */}
          {showAddAssessorModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-900" />
                    <span>افزودن کارشناس / ارزیاب جدید ({companyInfo.name})</span>
                  </h3>
                  <button
                    onClick={() => setShowAddAssessorModal(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateAssessor} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      نام و نام خانوادگی <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssessorName}
                      onChange={(e) => setNewAssessorName(e.target.value)}
                      placeholder="مثلاً: علیرضا قربانی"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      سمت / مسئولیت ارزیاب
                    </label>
                    <input
                      type="text"
                      value={newAssessorRole}
                      onChange={(e) => setNewAssessorRole(e.target.value)}
                      placeholder="مثلاً: ارزیاب ارشد خسارت بدنه خودرو"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      کد ملی
                    </label>
                    <input
                      type="text"
                      value={newAssessorNationalId}
                      onChange={(e) => setNewAssessorNationalId(e.target.value)}
                      placeholder="مثلاً: ۰۰۱۲۳۴۵۶۷۸"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-bold font-mono focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      شماره تلفن همراه <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssessorPhone}
                      onChange={(e) => setNewAssessorPhone(e.target.value)}
                      placeholder="مثلاً: ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-bold font-mono focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAssessorModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold shadow-sm"
                    >
                      ثبت و فعال‌سازی ارزیاب
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 6: REVIEWERS (مدیریت کارشناسان/بازبین‌ها) */}
      {activeTab === 'reviewers' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-900" />
              مدیریت بازبین‌ها و کنترل کیفیت {companyInfo.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(INITIAL_REVIEWERS[companyCode] || INITIAL_REVIEWERS['iran'] || []).map((rv) => (
              <div key={rv.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">{rv.name}</span>
                  <span className="text-xs text-slate-600 font-medium">{rv.role}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  بازبین رسمی
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 7: PAYMENTS (پرداخت) */}
      {activeTab === 'payments' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-700" />
              مدیریت صف واریز و تسویه بانکی (شبا)
            </h2>
          </div>

          <div className="space-y-3">
            {companyCases.filter((c) => c.status === 'در انتظار پرداخت' || c.payoutState === 'READY').length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-bold text-xs">
                پرونده‌ای در صف پرداخت فوری بانک وجود ندارد.
              </div>
            ) : (
              companyCases.filter((c) => c.status === 'در انتظار پرداخت' || c.payoutState === 'READY').map((c) => (
                <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold">
                  <div>
                    <span className="font-extrabold font-mono text-blue-950 block">{c.id}</span>
                    <span className="text-slate-700">{c.victimName} | شبا: {c.payoutInfo?.iban || '-'}</span>
                  </div>
                  <button
                    onClick={() => onOpenCaseDetail(c.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black"
                  >
                    انجام واریز
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW 8: BODY CLAIM (ادعای بدنه) */}
      {activeTab === 'bodyClaim' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-900" />
              مدیریت پرونده‌های بیمه بدنه
            </h2>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            کلیه درخواست‌های اعلام خسارت بیمه بدنه پس از ارزیابی خودکار جهت دریافت داغی و صدور حواله در این بخش قابل پیگیری می‌باشند.
          </p>
        </div>
      )}

    </div>
  );
};
