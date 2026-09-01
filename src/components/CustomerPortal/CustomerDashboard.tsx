import React, { useState } from 'react';
import {
  User,
  FolderSearch,
  ShieldPlus,
  CarFront,
  ArrowLeft,
  CheckCircle2,
  Phone,
  BadgeCheck,
  FileText,
  Camera,
  Save,
  Search,
  MapPin,
  Calendar,
  AlertCircle,
  Upload,
  UserCheck,
  Scale,
  PhoneCall,
  Copy,
  Check,
  DollarSign,
  CreditCard,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';
import { updateCustomerProfile, formatCurrency, getInsurerPersianName } from '../../lib/storage';
import { compressImageFile } from '../../lib/imageCompressor';
import { calculateClaimDamageWithPolicyLimits } from '../../lib/policyLimitCalculator';
import { CustomerDebtModal } from './CustomerDebtModal';

interface CustomerDashboardProps {
  session: UserSession;
  cases: ClaimCase[];
  onNavigate: (view: string) => void;
  onOpenCaseDetail: (caseId: string) => void;
  onStartWizard: () => void;
  onUpdateSession?: (updatedSession: UserSession) => void;
  onUpdateCase?: (updatedCase: ClaimCase) => void;
}

// Preset avatars for quick choice
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
];

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  session,
  cases,
  onNavigate,
  onOpenCaseDetail,
  onStartWizard,
  onUpdateSession,
  onUpdateCase
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'profile'>('overview');
  const [caseSearch, setCaseSearch] = useState('');
  const [financialFilter, setFinancialFilter] = useState<'all' | 'debts_and_receivables' | 'receivables' | 'debts'>('all');
  const [debtModalCase, setDebtModalCase] = useState<ClaimCase | null>(null);
  const [copiedPhoneText, setCopiedPhoneText] = useState<string | null>(null);

  // Profile Form States
  const [profName, setProfName] = useState(session.name || '');
  const [profPhone, setProfPhone] = useState(session.phone || '');
  const [profNationalId, setProfNationalId] = useState(session.nationalId || '0012345678');
  const [profAvatar, setProfAvatar] = useState<string | undefined>(session.avatarUrl);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Filter cases belonging to current customer session
  const myCases = cases.filter((c) => {
    if (c.isBodily || c.isBodyClaim || c.id?.startsWith('BD-') || Boolean(c.bodyInsuranceInfo)) return false;
    if (!session.phone) return true;
    const isVictim = c.victimPhone === session.phone || c.partyOnePhone === session.phone || (session.name && c.victimName?.includes(session.name));
    const isCulprit = c.culpritPhone === session.phone || c.partyTwoPhone === session.phone || (session.name && c.culpritName?.includes(session.name));
    if (isVictim || isCulprit) return true;

    if (caseSearch.trim()) {
      const q = caseSearch.trim().toLowerCase();
      if (
        c.id.toLowerCase().includes(q) ||
        c.victimPhone?.includes(q) ||
        c.culpritPhone?.includes(q) ||
        c.victimPlate?.includes(q) ||
        c.culpritPlate?.includes(q) ||
        c.plate?.includes(q)
      ) {
        return true;
      }
    }
    return false;
  });

  // Calculate Financial Aggregates (Debts and Receivables) across my cases
  let totalReceivablesFromCulprit = 0;
  let totalReceivablesFromInsurer = 0;
  let totalDebtsToVictim = 0;
  let casesWithDebtCount = 0;

  myCases.forEach((c) => {
    const userPhone = session.phone || '';
    const userName = session.name || '';
    let isP1 = false;
    let isP2 = false;

    if (c.partyTwoPhone && userPhone && c.partyTwoPhone === userPhone) {
      isP2 = true;
    } else if (c.partyOnePhone && userPhone && c.partyOnePhone === userPhone) {
      isP1 = true;
    } else if (c.partyOneRole === 'مقصر') {
      if (c.culpritPhone && userPhone && c.culpritPhone === userPhone) isP1 = true;
      else if (c.victimPhone && userPhone && c.victimPhone === userPhone) isP2 = true;
      else if (userName && c.culpritName?.includes(userName)) isP1 = true;
      else if (userName && c.victimName?.includes(userName)) isP2 = true;
      else isP1 = true;
    } else {
      if (c.victimPhone && userPhone && c.victimPhone === userPhone) isP1 = true;
      else if (c.culpritPhone && userPhone && c.culpritPhone === userPhone) isP2 = true;
      else if (userName && c.victimName?.includes(userName)) isP1 = true;
      else if (userName && c.culpritName?.includes(userName)) isP2 = true;
      else isP1 = true;
    }

    const p1Role = c.partyOneRole || 'زیان‌دیده';
    const p2Role = c.partyTwoRole || (p1Role === 'مقصر' ? 'زیان‌دیده' : 'مقصر');
    const myRole = isP1 ? p1Role : p2Role;
    const isVictim = myRole === 'زیان‌دیده';

    const b = calculateClaimDamageWithPolicyLimits(c);
    const directDmg = b.directDamageGross || (c.assessment?.totalDamage || 0);
    const salv = b.salvageDeduction || (c.assessment?.salvage || 0);
    const dim = b.diminutionAmount || (c.diminutionValue || 0);
    const totalClaim = b.totalClaimAmount || Math.max(0, directDmg - salv + dim);
    const polLim = b.policyMaxFinancialLimit || (c.culpritCoverageFinancial || 50000000);
    const insurerPortion = b.insurerPayablePortion || Math.min(totalClaim, polLim);
    const excessDebt = b.culpritExcessDebt || Math.max(0, totalClaim - polLim);

    if (excessDebt > 0 || (isVictim && insurerPortion > 0)) {
      casesWithDebtCount++;
    }

    if (isVictim) {
      if (excessDebt > 0) {
        totalReceivablesFromCulprit += excessDebt;
      }
      if (insurerPortion > 0 && c.status !== 'پرداخت شده') {
        totalReceivablesFromInsurer += insurerPortion;
      }
    } else {
      // User is Culprit
      if (excessDebt > 0) {
        totalDebtsToVictim += excessDebt;
      }
    }
  });

  // Filter cases based on both text search and financial sub-filter
  const filteredCases = myCases.filter((c) => {
    // 1. Text Search Filter
    if (caseSearch.trim()) {
      const q = caseSearch.trim().toLowerCase();
      const match =
        c.id.toLowerCase().includes(q) ||
        c.plate.toLowerCase().includes(q) ||
        (c.carType && c.carType.toLowerCase().includes(q)) ||
        (c.status && c.status.toLowerCase().includes(q)) ||
        (c.culpritName && c.culpritName.toLowerCase().includes(q)) ||
        (c.victimName && c.victimName.toLowerCase().includes(q)) ||
        (c.culpritPhone && c.culpritPhone.includes(q)) ||
        (c.victimPhone && c.victimPhone.includes(q));
      if (!match) return false;
    }

    // 2. Financial Sub-Filter
    if (financialFilter === 'all') return true;

    const userPhone = session.phone || '';
    const userName = session.name || '';
    let isP1 = false;
    let isP2 = false;

    if (c.partyTwoPhone && userPhone && c.partyTwoPhone === userPhone) {
      isP2 = true;
    } else if (c.partyOnePhone && userPhone && c.partyOnePhone === userPhone) {
      isP1 = true;
    } else if (c.partyOneRole === 'مقصر') {
      if (c.culpritPhone && userPhone && c.culpritPhone === userPhone) isP1 = true;
      else if (c.victimPhone && userPhone && c.victimPhone === userPhone) isP2 = true;
      else if (userName && c.culpritName?.includes(userName)) isP1 = true;
      else if (userName && c.victimName?.includes(userName)) isP2 = true;
      else isP1 = true;
    } else {
      if (c.victimPhone && userPhone && c.victimPhone === userPhone) isP1 = true;
      else if (c.culpritPhone && userPhone && c.culpritPhone === userPhone) isP2 = true;
      else if (userName && c.victimName?.includes(userName)) isP1 = true;
      else if (userName && c.culpritName?.includes(userName)) isP2 = true;
      else isP1 = true;
    }

    const p1Role = c.partyOneRole || 'زیان‌دیده';
    const p2Role = c.partyTwoRole || (p1Role === 'مقصر' ? 'زیان‌دیده' : 'مقصر');
    const myRole = isP1 ? p1Role : p2Role;
    const isVictim = myRole === 'زیان‌دیده';

    const b = calculateClaimDamageWithPolicyLimits(c);
    const directDmg = b.directDamageGross || (c.assessment?.totalDamage || 0);
    const salv = b.salvageDeduction || (c.assessment?.salvage || 0);
    const dim = b.diminutionAmount || (c.diminutionValue || 0);
    const totalClaim = b.totalClaimAmount || Math.max(0, directDmg - salv + dim);
    const polLim = b.policyMaxFinancialLimit || (c.culpritCoverageFinancial || 50000000);
    const insurerPortion = b.insurerPayablePortion || Math.min(totalClaim, polLim);
    const excessDebt = b.culpritExcessDebt || Math.max(0, totalClaim - polLim);

    if (financialFilter === 'debts_and_receivables') {
      return excessDebt > 0 || (isVictim && insurerPortion > 0);
    }
    if (financialFilter === 'receivables') {
      return isVictim && (excessDebt > 0 || (insurerPortion > 0 && c.status !== 'پرداخت شده'));
    }
    if (financialFilter === 'debts') {
      return !isVictim && excessDebt > 0;
    }

    return true;
  });

  const activeClaimsCount = myCases.filter((c) => c.status !== 'پرداخت شده' && c.status !== 'رد شده').length;

  const copyPhoneNumber = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhoneText(phone);
    setTimeout(() => setCopiedPhoneText(null), 2000);
  };

  // Avatar File Upload Handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await compressImageFile(file, 256, 0.7);
      setProfAvatar(dataUrl);
    }
  };

  // Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);

    const updatedSession: UserSession = {
      ...session,
      name: profName.trim(),
      phone: profPhone.trim(),
      nationalId: profNationalId.trim(),
      avatarUrl: profAvatar
    };

    updateCustomerProfile(session.phone || '', {
      name: profName.trim(),
      phone: profPhone.trim(),
      nationalId: profNationalId.trim(),
      avatarUrl: profAvatar
    });

    if (onUpdateSession) {
      onUpdateSession(updatedSession);
    }

    setProfileSuccessMsg('اطلاعات پروفایل و تصویر شما با موفقیت در سامانه ذخیره گردید.');
    setTimeout(() => {
      setProfileSuccessMsg(null);
    }, 4000);
  };

  // Helper for Status Badge Color
  const getStatusBadgeClass = (status: string) => {
    if (status.startsWith('ارجاع')) {
      return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold';
    }
    switch (status) {
      case 'پرداخت شده':
      case 'تایید شده':
      case 'خسارت تسویه گردید':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold';
      case 'رد شده':
      case 'انصراف مشتری':
        return 'bg-rose-100 text-rose-950 border-rose-300 font-extrabold';
      case 'تصادف ۵۰-۵۰ — پیگیری بدنه طرفین':
        return 'bg-rose-100 text-rose-950 border-rose-300 font-extrabold';
      case 'در حال ارزیابی':
      case 'در حال بازبینی':
      case 'ارزیابی شده':
        return 'bg-indigo-100 text-indigo-950 border-indigo-300 font-extrabold';
      case 'در انتظار تایید مقصر':
      case 'در انتظار استعلام بیمه مقصر':
      case 'در انتظار ارجاع به ارزیاب':
      case 'در انتظار پاسخ به ارزیاب':
      case 'در انتظار تایید زیان‌دیده':
      case 'در انتظار پرداخت':
      case 'در انتظار ارجاع':
        return 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold';
      default:
        return 'bg-blue-100 text-blue-950 border-blue-300 font-extrabold';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in" dir="rtl">
      
      {/* Iranian Enterprise Portal User Header Card */}
      <div className="bg-white border-2 border-blue-200 rounded-3xl p-6 text-slate-900 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* RIGHT SIDE: User Avatar & Name */}
          <div
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-4 cursor-pointer group"
            title="برای مشاهده و ویرایش پروفایل کلیک کنید"
          >
            <div className="relative">
              {session.avatarUrl ? (
                <img
                  src={session.avatarUrl}
                  alt={session.name}
                  className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-blue-300 group-hover:border-amber-500 transition-colors"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-blue-900 text-amber-400 flex items-center justify-center font-black text-2xl shadow-md border-2 border-blue-200 group-hover:border-amber-500 transition-colors">
                  {session.name ? session.name.charAt(0) : 'ک'}
                </div>
              )}
              <div className="absolute -bottom-1 -left-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow" title="هویت تایید شده">
                <BadgeCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight group-hover:text-blue-700 transition-colors">
                  {session.name || 'مشتری گرامی'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-950 border border-blue-300">
                  پورتال خودخدمت بیمه‌گذار
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                <span className="flex items-center gap-1 font-mono text-slate-700 font-bold">
                  <Phone className="w-3.5 h-3.5 text-blue-800" />
                  {session.phone || '۰۹۱۲۳۴۵۶۷۸۹'}
                </span>
                {session.nationalId && (
                  <span className="flex items-center gap-1 font-mono text-slate-700 font-bold">
                    <span className="text-slate-500 font-medium">کد ملی:</span>
                    {session.nationalId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* LEFT SIDE: Quick Dashboard Stats */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-slate-200 pt-4 md:pt-0">
            <button
              onClick={() => {
                setActiveTab('cases');
                setFinancialFilter('all');
              }}
              className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-center min-w-[100px] transition-all shadow-sm cursor-pointer"
            >
              <span className="block text-xl font-black text-amber-900 font-mono">
                {myCases.length}
              </span>
              <span className="text-[10px] text-amber-950 font-extrabold block mt-0.5">
                کل پرونده‌ها
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('cases');
                setFinancialFilter('debts_and_receivables');
              }}
              className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-center min-w-[110px] transition-all shadow-sm cursor-pointer"
              title="مشاهده پرونده‌های دارای بدهی و طلب مالی"
            >
              <div className="flex items-center justify-center gap-1">
                <Scale className="w-4 h-4 text-emerald-700" />
                <span className="block text-xl font-black text-emerald-900 font-mono">
                  {casesWithDebtCount}
                </span>
              </div>
              <span className="text-[10px] text-emerald-950 font-extrabold block mt-0.5">
                بدهی و طلب
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('cases');
                setFinancialFilter('all');
              }}
              className="p-3.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl text-center min-w-[100px] transition-all shadow-sm cursor-pointer"
            >
              <span className="block text-xl font-black text-blue-950 font-mono">
                {activeClaimsCount}
              </span>
              <span className="text-[10px] text-blue-950 font-extrabold block mt-0.5">
                در حال بررسی
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Main Action Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Module 1: File Accident */}
            <div
              onClick={onStartWizard}
              className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-3xl shadow-lg hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 text-white cursor-pointer relative overflow-hidden group flex flex-col justify-between"
            >
              <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-amber-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md">
                  <CarFront className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">ثبت آنلاین تصادف</h3>
                  <p className="text-[11px] text-blue-100 mt-1 leading-relaxed">
                    ثبت آنلاین تصادف با GPS و ارسال مستندات
                  </p>
                </div>
              </div>
              <div className="pt-3 flex items-center gap-1 text-xs font-bold text-amber-300">
                <span>شروع ثبت حادثه</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>

            {/* Module 2: Debts and Claims (بدهی و طلب مالی) */}
            <div
              onClick={() => {
                setActiveTab('cases');
                setFinancialFilter('debts_and_receivables');
              }}
              className="bg-white p-5 rounded-3xl border-2 border-emerald-300 shadow-sm hover:border-emerald-500 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <Scale className="w-6 h-6 text-emerald-800" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-emerald-950 text-base">بدهی و طلب</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {casesWithDebtCount} مورد
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
                    دیدن طلب از مقصران، بدهی‌ها و شماره تماس
                  </p>
                </div>
              </div>
              <div className="pt-3 flex items-center gap-1 text-xs font-bold text-emerald-800">
                <span>مشاهده تراز و تماس</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>

            {/* Module 3: Own Damage (بیمه بدنه) */}
            <div
              onClick={() => onNavigate('bodily')}
              className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm hover:border-blue-600 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-900 border border-sky-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <ShieldPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-base">خسارت بدنه</h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
                    استعلام و ثبت خسارت بدنه مستقل از ثالث
                  </p>
                </div>
              </div>
              <div className="pt-3 flex items-center gap-1 text-xs font-bold text-sky-900">
                <span>استعلام و ثبت بدنه</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>

            {/* Module 4: My Claims */}
            <div
              onClick={() => {
                setActiveTab('cases');
                setFinancialFilter('all');
              }}
              className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between relative"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <FolderSearch className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-blue-950 text-base">پرونده‌های من</h3>
                    {activeClaimsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {activeClaimsCount} فعال
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
                    پیگیری وضعیت ارزیابی، پرداخت و کارشناسی
                  </p>
                </div>
              </div>
              <div className="pt-3 flex items-center gap-1 text-xs font-bold text-amber-800">
                <span>لیست کل پرونده‌ها</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>

            {/* Module 5: My Profile */}
            <div
              onClick={() => setActiveTab('profile')}
              className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm hover:border-blue-600 hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 border border-blue-300 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-blue-950 text-base">پروفایل من</h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-medium">
                    ویرایش نام، کد ملی، شماره تماس و تصویر
                  </p>
                </div>
              </div>
              <div className="pt-3 flex items-center gap-1 text-xs font-bold text-blue-900">
                <span>ویرایش پروفایل</span>
                <ArrowLeft className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Financial Debt/Receivable Spotlight Banner */}
          {(totalReceivablesFromCulprit > 0 || totalDebtsToVictim > 0 || totalReceivablesFromInsurer > 0) && (
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      تراز مالی، بدهی‌ها و مطالبات پرونده‌های شما
                    </h3>
                    <p className="text-xs text-slate-300">
                      خلاصه مبالغ قابل وصول از مقصران، شرکت‌های بیمه‌گر و بدهی‌های مازاد
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('cases');
                    setFinancialFilter('debts_and_receivables');
                  }}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer active:scale-95"
                >
                  <span>مشاهده جزئیات و تماس با طرفین</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                
                {/* 1. Receivables from Culprits */}
                <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      طلب شما از مقصران حادثه:
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
                      مازاد تعهد
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-white tracking-tight">
                    {formatCurrency(totalReceivablesFromCulprit)}
                  </div>
                  <span className="text-[10px] text-slate-300 block">
                    قابل وصول مستقیم از رانندگان مقصر
                  </span>
                </div>

                {/* 2. Receivables from Insurers */}
                <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-sky-300 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      سهم پرداختی شرکت‌های بیمه:
                    </span>
                    <span className="text-[10px] bg-sky-500/20 px-2 py-0.5 rounded text-sky-200">
                      واریز به شبا
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-white tracking-tight">
                    {formatCurrency(totalReceivablesFromInsurer)}
                  </div>
                  <span className="text-[10px] text-slate-300 block">
                    در انتظار واریز به حساب شبای شما
                  </span>
                </div>

                {/* 3. Debts to Victims */}
                <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-rose-300 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      بدهی شما به زیان‌دیدگان:
                    </span>
                    <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded text-rose-200">
                      بدهکاری
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-rose-200 tracking-tight">
                    {formatCurrency(totalDebtsToVictim)}
                  </div>
                  <span className="text-[10px] text-slate-300 block">
                    مازاد تعهد بیمه‌نامه شما به عنوان مقصر
                  </span>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MY CASES (پرونده‌های من) */}
      {activeTab === 'cases' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <FolderSearch className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-black text-blue-950">پرونده‌های من</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {myCases.length} پرونده
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                مشاهده وضعیت پرونده‌ها، بدهی‌ها، طلب‌ها و مشخصات رانندگان طرف حادثه
              </p>
            </div>

            {/* Actions: Return Button & Search Box */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 shadow-xs text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-blue-900 rotate-180" />
                <span>بازگشت به داشبورد</span>
              </button>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input
                  type="text"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  placeholder="جستجو کد، نام، تلفن یا پلاک..."
                  className="w-full pr-9 pl-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>
          </div>

          {/* FINANCIAL SUB-FILTER TABS (بخش فیلتر بدهی و طلب) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => setFinancialFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                financialFilter === 'all'
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <FolderSearch className="w-4 h-4" />
              <span>همه پرونده‌ها ({myCases.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFinancialFilter('debts_and_receivables')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                financialFilter === 'debts_and_receivables'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>پرونده‌های دارای بدهی و طلب ({casesWithDebtCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFinancialFilter('receivables')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                financialFilter === 'receivables'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>طلب‌های من (بستانکاری)</span>
            </button>

            <button
              type="button"
              onClick={() => setFinancialFilter('debts')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                financialFilter === 'debts'
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>بدهی‌های من (بدهکاری)</span>
            </button>
          </div>

          {/* FINANCIAL SUMMARY HIGHLIGHT BAR INSIDE "MY CASES" */}
          {financialFilter !== 'all' && (
            <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-blue-950 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-900" />
                  خلاصه تراز مالی فیلتر شده:
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {filteredCases.length} پرونده یافت شد
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">کل طلب از مقصران:</span>
                  <span className="font-mono font-black text-emerald-800 text-base block mt-0.5">
                    {formatCurrency(totalReceivablesFromCulprit)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-sky-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">سهم پرداختی بیمه‌ها:</span>
                  <span className="font-mono font-black text-sky-900 text-base block mt-0.5">
                    {formatCurrency(totalReceivablesFromInsurer)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium block">کل بدهی به زیان‌دیدگان:</span>
                  <span className="font-mono font-black text-rose-700 text-base block mt-0.5">
                    {formatCurrency(totalDebtsToVictim)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE IF NO CASES */}
          {myCases.length === 0 ? (
            <div className="py-12 px-4 text-center bg-blue-50/60 border border-blue-200 rounded-2xl space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto text-amber-900 shadow-sm">
                <FolderSearch className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-blue-950">
                  فعلاً هیچ پرونده‌ای ثبت نشده است
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto font-medium">
                  شما هنوز هیچ پرونده خسارتی در سامانه ثبت نکرده‌اید. در صورت وقوع حادثه یا تصادف، می‌توانید اولین پرونده خود را به صورت هوشمند ثبت کنید.
                </p>
              </div>
              <button
                onClick={onStartWizard}
                className="px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md border border-blue-950 transition-all flex items-center justify-center gap-2 mx-auto active:scale-95 cursor-pointer"
              >
                <CarFront className="w-4 h-4" />
                <span>ثبت آنلاین تصادف جدید</span>
              </button>
            </div>
          ) : filteredCases.length === 0 ? (
            /* SEARCH / FILTER RESULT EMPTY */
            <div className="py-10 text-center text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-bold text-slate-700">هیچ پرونده‌ای با معیارهای انتخابی یافت نشد.</p>
              <p className="text-[11px] text-slate-500">می‌توانید فیلتر را بر روی «همه پرونده‌ها» قرار دهید.</p>
              <button
                type="button"
                onClick={() => {
                  setFinancialFilter('all');
                  setCaseSearch('');
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-900 text-white font-bold text-xs mt-2 cursor-pointer"
              >
                نمایش همه پرونده‌ها
              </button>
            </div>
          ) : (
            /* CASE CARDS LIST */
            <div className="space-y-4">
              {filteredCases.map((c) => {
                const userPhone = session.phone || '';
                const userName = session.name || '';
                let isP1 = false;
                let isP2 = false;

                if (c.partyTwoPhone && userPhone && c.partyTwoPhone === userPhone) {
                  isP2 = true;
                } else if (c.partyOnePhone && userPhone && c.partyOnePhone === userPhone) {
                  isP1 = true;
                } else if (c.partyOneRole === 'مقصر') {
                  if (c.culpritPhone && userPhone && c.culpritPhone === userPhone) isP1 = true;
                  else if (c.victimPhone && userPhone && c.victimPhone === userPhone) isP2 = true;
                  else if (userName && c.culpritName?.includes(userName)) isP1 = true;
                  else if (userName && c.victimName?.includes(userName)) isP2 = true;
                  else isP1 = true;
                } else {
                  if (c.victimPhone && userPhone && c.victimPhone === userPhone) isP1 = true;
                  else if (c.culpritPhone && userPhone && c.culpritPhone === userPhone) isP2 = true;
                  else if (userName && c.victimName?.includes(userName)) isP1 = true;
                  else if (userName && c.culpritName?.includes(userName)) isP2 = true;
                  else isP1 = true;
                }

                const p1Role = c.partyOneRole || 'زیان‌دیده';
                const p2Role = c.partyTwoRole || (p1Role === 'مقصر' ? 'زیان‌دیده' : 'مقصر');
                const myRole = isP1 ? p1Role : p2Role;
                const isVictim = myRole === 'زیان‌دیده';
                const isCulprit = myRole === 'مقصر';

                const b = calculateClaimDamageWithPolicyLimits(c);
                const directDmg = b.directDamageGross || (c.assessment?.totalDamage || 0);
                const salv = b.salvageDeduction || (c.assessment?.salvage || 0);
                const dim = b.diminutionAmount || (c.diminutionValue || 0);
                const totalClaim = b.totalClaimAmount || Math.max(0, directDmg - salv + dim);
                const polLim = b.policyMaxFinancialLimit || (c.culpritCoverageFinancial || 50000000);
                const insurerPortion = b.insurerPayablePortion || Math.min(totalClaim, polLim);
                const excessDebt = b.culpritExcessDebt || Math.max(0, totalClaim - polLim);

                const culpritName = c.culpritName || 'راننده مقصر';
                const culpritPhone = c.culpritPhone || '---';
                const victimName = c.victimName || 'زیان‌دیده';
                const victimPhone = c.victimPhone || '---';

                return (
                  <div
                    key={c.id}
                    onClick={() => onOpenCaseDetail(c.id)}
                    className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer space-y-4 group relative"
                  >
                    {/* Card Top Row: Tracking code + Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center shadow-sm">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-lg text-blue-950 font-mono tracking-wide group-hover:text-blue-700 transition-colors">
                              {c.id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1 shadow-2xs">
                              <UserCheck className="w-3 h-3 text-blue-700" />
                              {isVictim ? 'شما: زیان‌دیده' : 'شما: راننده مقصر'}
                            </span>
                            {excessDebt > 0 ? (
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-2xs flex items-center gap-1 ${
                                  isVictim
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                    : 'bg-rose-100 text-rose-950 border-rose-300'
                                }`}
                              >
                                <Scale className="w-3 h-3" />
                                {isVictim ? 'طلب از مقصر' : 'بدهی به زیان‌دیده'}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5 font-mono">
                            <span className="flex items-center gap-1 font-bold">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              تاریخ: {c.date || '۱۴۰۳/۰۵/۱۴'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    {/* DEDICATED DEBT & RECEIVABLE SUMMARY STRIP (بخش اختصاصی دیدن بدهی و طلب، اسم مقصر و شماره تلفن) */}
                    <div
                      className={`p-4 rounded-2xl border-2 space-y-3 transition-all ${
                        isVictim
                          ? excessDebt > 0
                            ? 'bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-100/50 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                          : excessDebt > 0
                          ? 'bg-gradient-to-r from-rose-50 via-amber-50/60 to-rose-100/50 border-rose-300 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDebtModalCase(c);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Financial Title & Balance */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-2 rounded-xl border ${
                              excessDebt > 0
                                ? isVictim
                                  ? 'bg-emerald-200 text-emerald-900 border-emerald-400'
                                  : 'bg-rose-200 text-rose-900 border-rose-400'
                                : 'bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                          >
                            <Scale className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs">
                                {isVictim
                                  ? excessDebt > 0
                                    ? 'وضعیت تراز: طلب شما از راننده مقصر حادثه'
                                    : 'وضعیت تراز: تسویه در سقف تعهدات بیمه‌گر'
                                  : excessDebt > 0
                                  ? 'وضعیت تراز: بدهی مازاد شما به راننده زیان‌دیده'
                                  : 'وضعیت تراز: فاقد بدهی مازاد شخصی'}
                              </span>
                            </div>

                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-xs text-slate-600 font-medium">
                                {isVictim ? 'مبلغ طلب شما:' : 'مبلغ بدهی شما:'}
                              </span>
                              <span
                                className={`font-mono font-black text-sm sm:text-base ${
                                  excessDebt > 0
                                    ? isVictim
                                      ? 'text-emerald-800'
                                      : 'text-rose-700'
                                    : 'text-slate-700'
                                }`}
                              >
                                {excessDebt > 0 ? formatCurrency(excessDebt) : '۰ تومان'}
                              </span>
                              {insurerPortion > 0 && (
                                <span className="text-[10px] text-slate-500 mr-2">
                                  (سهم بیمه: {formatCurrency(insurerPortion)})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Button to open Debt Breakdown Modal */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDebtModalCase(c);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto ${
                            excessDebt > 0
                              ? isVictim
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-rose-700 hover:bg-rose-800 text-white'
                              : 'bg-blue-900 hover:bg-blue-800 text-white'
                          }`}
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>مشاهده ریز بدهی و طلب</span>
                        </button>
                      </div>

                      {/* Contact & Driver Info Strip inside the Debt Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-xs">
                        
                        {/* CULPRIT INFO (نام و شماره تلفن مقصر) */}
                        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">
                              نام راننده مقصر:
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {culpritName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${culpritPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-lg font-mono font-bold text-[11px] flex items-center gap-1 transition-all"
                              dir="ltr"
                              title="تماس مستقیم با مقصر حادثه"
                            >
                              <PhoneCall className="w-3 h-3 text-blue-800" />
                              <span>{culpritPhone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={(e) => copyPhoneNumber(culpritPhone, e)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="کپی شماره تماس"
                            >
                              {copiedPhoneText === culpritPhone ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* VICTIM INFO (نام و شماره تلفن زیان‌دیده) */}
                        <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-bold block">
                              نام راننده زیان‌دیده:
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {victimName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${victimPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 rounded-lg font-mono font-bold text-[11px] flex items-center gap-1 transition-all"
                              dir="ltr"
                              title="تماس مستقیم با زیان‌دیده حادثه"
                            >
                              <PhoneCall className="w-3 h-3 text-emerald-800" />
                              <span>{victimPhone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={(e) => copyPhoneNumber(victimPhone, e)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="کپی شماره تماس"
                            >
                              {copiedPhoneText === victimPhone ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Card Middle Row: Accident Details & Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-medium">خودرو و پلاک زیان‌دیده:</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {c.carType || 'سواری'} | پلاک: {c.plate || '---'}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-medium">شرکت بیمه‌گر مقصر:</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">
                          {getInsurerPersianName(c.culpritInsurer)} (سقف: {formatCurrency(polLim)})
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[11px] font-medium">ارزیاب / کارشناس:</span>
                        <span className="font-extrabold text-blue-900 mt-0.5 block">
                          {c.assignedExpert?.name ? `کارشناس: ${c.assignedExpert.name}` : 'در حال ارجاع به کارشناس'}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom Row: Address snippet & CTA button */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-md font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.address || 'موقعیت مکانی ثبت شده'}</span>
                      </div>

                      <div className="flex items-center gap-1 font-black text-blue-900 group-hover:translate-x-[-4px] transition-transform shrink-0">
                        <span>مشاهده پرونده کامل</span>
                        <ArrowLeft className="w-4 h-4" />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 3: MY PROFILE (پروفایل من) */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-blue-950 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-900" />
                پروفایل و مشخصات بیمه‌گذار
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                مدیریت نام و نام خانوادگی، شماره موبایل، کد ملی و عکس حساب کاربری
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 shadow-xs text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-blue-900 rotate-180" />
              <span>بازگشت به داشبورد</span>
            </button>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-2xl text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* AVATAR UPLOAD & SELECTION SECTION */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4">
              <label className="block text-xs font-bold text-blue-950">
                تصویر پروفایل
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                
                {/* Live Preview */}
                <div className="relative group">
                  {profAvatar ? (
                    <img
                      src={profAvatar}
                      alt="Profile Avatar"
                      className="w-24 h-24 rounded-3xl object-cover border-2 border-blue-400 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-blue-900 text-white font-black text-4xl flex items-center justify-center border-2 border-blue-300 shadow-md">
                      {profName ? profName.charAt(0) : 'ک'}
                    </div>
                  )}

                  <label
                    htmlFor="avatar-file-input"
                    className="absolute -bottom-2 -right-2 bg-amber-500 hover:bg-amber-400 text-blue-950 p-2 rounded-xl shadow cursor-pointer transition-transform active:scale-95 border border-white"
                    title="تغییر عکس"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>

                {/* Upload & Presets Actions */}
                <div className="space-y-3 text-center sm:text-right flex-1">
                  <div>
                    <label
                      htmlFor="avatar-file-input"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-blue-900" />
                      <span>آپلود تصویر جدید از دستگاه</span>
                    </label>
                    <p className="text-[11px] text-slate-600 mt-1 font-medium">
                      فرمت‌های مجاز: JPG, PNG (حداکثر حجم ۵ مگابایت)
                    </p>
                  </div>

                  {/* Preset Avatars */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                      یا یکی از تصویرهای پیشنهادی را انتخاب کنید:
                    </span>
                    <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                      {PRESET_AVATARS.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Preset ${idx}`}
                          onClick={() => setProfAvatar(url)}
                          className={`w-10 h-10 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                            profAvatar === url
                              ? 'border-amber-500 scale-110 shadow-md'
                              : 'border-slate-300 opacity-80 hover:opacity-100 hover:border-slate-500'
                          }`}
                        />
                      ))}
                      {profAvatar && (
                        <button
                          type="button"
                          onClick={() => setProfAvatar(undefined)}
                          className="text-[10px] text-rose-600 hover:underline mr-1 font-bold"
                        >
                          حذف عکس
                        </button>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* EDIT FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs text-blue-950 font-bold mb-1">
                  نام و نام خانوادگی
                </label>
                <input
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="مثال: مهدی کشاورز"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-blue-950 font-bold mb-1">
                  شماره موبایل ثبت‌شده (غیرقابل تغییر اصلی)
                </label>
                <input
                  type="tel"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-100 border-2 border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-blue-950 font-bold mb-1">
                  کد ملی (۱۰ رقمی)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={profNationalId}
                  onChange={(e) => setProfNationalId(e.target.value)}
                  placeholder="0012345678"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs text-blue-950 font-bold mb-1">
                  نوع حساب کاربری
                </label>
                <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>بیمه‌گذار حقیقی - احراز هویت شده</span>
                </div>
              </div>

            </div>

            {/* SAVE BUTTON */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md border border-blue-950 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات پروفایل</span>
              </button>
            </div>

          </form>

        </div>
      )}

      {/* DEBT & RECEIVABLE MODAL */}
      {debtModalCase && (
        <CustomerDebtModal
          claimCase={debtModalCase}
          session={session}
          onClose={() => setDebtModalCase(null)}
          onUpdateCase={onUpdateCase}
        />
      )}

    </div>
  );
};
