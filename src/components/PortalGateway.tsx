import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  ClipboardCheck,
  MapPin,
  ShieldCheck,
  Settings,
  Search,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  Lock,
  Phone,
  ShieldAlert,
  Zap,
  DollarSign,
  Sliders,
  Briefcase,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Headphones,
  FileCheck,
  BadgeCheck
} from 'lucide-react';
import { RoleType, UserSession, InsurerInfo, StaffMember } from '../types';
import { CompanyRegistrationModal } from './CompanyRegistrationModal';
import { ExpertOtpLoginForm } from './ExpertOtpLoginForm';
import { CustomerOtpLoginForm } from './CustomerOtpLoginForm';
import { SearchableCompanySelect } from './common/SearchableCompanySelect';
import { KarinshoHero } from './KarinshoHero';
import {
  INSURER_COMPANIES,
  INITIAL_EXPERTS,
  INITIAL_FIELD_EXPERTS,
  INITIAL_REVIEWERS,
  INITIAL_FINANCE_STAFF,
  INITIAL_CRM_STAFF
} from '../data/mockData';
import {
  loadInsurersFromStorage,
  loadExpertsFromStorage,
  loadFieldExpertsFromStorage,
  loadReviewersFromStorage,
  loadFinanceStaffFromStorage,
  loadCrmStaffFromStorage
} from '../lib/storage';

interface PortalGatewayProps {
  onSelectPortal: (role: RoleType, payload?: any) => void;
  onOpenPublicTrack: () => void;
}

export type MainLoginType = 'customer' | 'org';

export const PortalGateway: React.FC<PortalGatewayProps> = ({
  onSelectPortal,
  onOpenPublicTrack
}) => {
  // Main Login Mode: 'customer' or 'org'
  const [mainMode, setMainMode] = useState<MainLoginType>('customer');

  // Dynamic Data loaded from storage
  const [insurersList, setInsurersList] = useState<InsurerInfo[]>(() => loadInsurersFromStorage());
  const [expertsMap, setExpertsMap] = useState<Record<string, StaffMember[]>>(() => loadExpertsFromStorage());
  const [fieldExpertsMap, setFieldExpertsMap] = useState<Record<string, StaffMember[]>>(() => loadFieldExpertsFromStorage());
  const [reviewersMap, setReviewersMap] = useState<Record<string, StaffMember[]>>(() => loadReviewersFromStorage());
  const [financeStaffMap, setFinanceStaffMap] = useState<Record<string, StaffMember[]>>(() => loadFinanceStaffFromStorage());
  const [crmStaffMap, setCrmStaffMap] = useState<Record<string, StaffMember[]>>(() => loadCrmStaffFromStorage());

  const refreshDynamicData = () => {
    setInsurersList(loadInsurersFromStorage());
    setExpertsMap(loadExpertsFromStorage());
    setFieldExpertsMap(loadFieldExpertsFromStorage());
    setReviewersMap(loadReviewersFromStorage());
    setFinanceStaffMap(loadFinanceStaffFromStorage());
    setCrmStaffMap(loadCrmStaffFromStorage());
  };

  useEffect(() => {
    refreshDynamicData();
    window.addEventListener('claimflow_insurers_updated', refreshDynamicData);
    window.addEventListener('claimflow_staff_updated', refreshDynamicData);
    window.addEventListener('storage', refreshDynamicData);
    return () => {
      window.removeEventListener('claimflow_insurers_updated', refreshDynamicData);
      window.removeEventListener('claimflow_staff_updated', refreshDynamicData);
      window.removeEventListener('storage', refreshDynamicData);
    };
  }, []);

  // Organizational Role selected from Dropdown
  const [orgRole, setOrgRole] = useState<RoleType>('insurer');

  // Company Registration Modal State
  const [isCompanyRegModalOpen, setIsCompanyRegModalOpen] = useState(false);

  // Form states for Insurer
  const [insurerCompany, setInsCompany] = useState('dana');
  const [insurerPass, setInsPass] = useState('1234');

  // Form states for Assessor
  const [assessorCompany, setAssessorCompany] = useState('dana');
  const [assessorId, setAssessorId] = useState('d1');
  const [assessorPass, setAssessorPass] = useState('1111');

  // Form states for Field Expert
  const [fieldCompany, setFieldCompany] = useState('dana');
  const [fieldId, setFieldId] = useState('fed1');
  const [fieldPass, setFieldPass] = useState('1111');

  // Form states for Reviewer
  const [reviewerCompany, setReviewerCompany] = useState('dana');
  const [reviewerId, setReviewerId] = useState('rvd1');
  const [reviewerPass, setReviewerPass] = useState('1111');

  // Form states for Finance Manager
  const [financeCompany, setFinanceCompany] = useState('dana');
  const [financeId, setFinanceId] = useState('fin-d1');
  const [financePass, setFinancePass] = useState('1111');

  // Form states for CRM & Support
  const [crmCompany, setCrmCompany] = useState('dana');
  const [crmId, setCrmId] = useState('crm-d1');
  const [crmPass, setCrmPass] = useState('1111');

  // Form states for Admin
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('admin123');

  const handleInsurerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const compInfo = insurersList.find((c) => c.code === insurerCompany) || insurersList[0];
    const cCode = compInfo?.code || insurerCompany;
    onSelectPortal('insurer', {
      id: cCode,
      role: 'insurer',
      name: compInfo?.name || 'پورتال بیمه‌گر',
      company: cCode,
      companyName: compInfo?.name
    });
  };

  const handleAssessorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const compInfo = insurersList.find((c) => c.code === assessorCompany);
    const companyExperts = expertsMap[assessorCompany] || [];
    const expert = companyExperts.find((e) => e.id === assessorId) || companyExperts[0] || {
      id: `exp-${assessorCompany}-1`,
      name: `کارشناس ${compInfo?.name || assessorCompany}`,
      role: 'کارشناس ارزیاب خسارت'
    };
    onSelectPortal('assessor', {
      id: expert.id,
      role: 'assessor',
      name: expert.name,
      roleTitle: expert.role,
      company: assessorCompany,
      companyName: compInfo?.name,
      phone: expert.phone,
      nationalId: expert.nationalId,
      branchId: expert.branchId,
      licenseCode: expert.licenseCode
    });
  };

  const handleFieldExpertLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const compInfo = insurersList.find((c) => c.code === fieldCompany);
    const companyFields = fieldExpertsMap[fieldCompany] || [];
    const fe = companyFields.find((e) => e.id === fieldId) || companyFields[0] || {
      id: `fe-${fieldCompany}-1`,
      name: `کارشناس میدانی ${compInfo?.name || fieldCompany}`,
      role: 'کارشناس بازدید میدانی'
    };
    onSelectPortal('fieldexpert', {
      id: fe.id,
      role: 'fieldexpert',
      name: fe.name,
      roleTitle: fe.role,
      company: fieldCompany,
      companyName: compInfo?.name,
      phone: fe.phone,
      nationalId: fe.nationalId,
      branchId: fe.branchId,
      licenseCode: fe.licenseCode
    });
  };

  const handleReviewerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const compInfo = insurersList.find((c) => c.code === reviewerCompany);
    const companyReviewers = reviewersMap[reviewerCompany] || [];
    const rv = companyReviewers.find((e) => e.id === reviewerId) || companyReviewers[0] || {
      id: `rv-${reviewerCompany}-1`,
      name: `بازبین ${compInfo?.name || reviewerCompany}`,
      role: 'بازبین ارشد کیفیت'
    };
    onSelectPortal('reviewer', {
      id: rv.id,
      role: 'reviewer',
      name: rv.name,
      roleTitle: rv.role,
      company: reviewerCompany,
      companyName: compInfo?.name,
      phone: rv.phone,
      nationalId: rv.nationalId,
      branchId: rv.branchId,
      licenseCode: rv.licenseCode
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectPortal('admin', {
      id: 'admin',
      role: 'admin',
      name: 'مدیر ارشد کلان سامانه'
    });
  };

  const handleFinanceLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const compInfo = insurersList.find((c) => c.code === financeCompany);
    const companyStaff = financeStaffMap[financeCompany] || [];
    const fin = companyStaff.find((s) => s.id === financeId) || companyStaff[0] || {
      id: `fin-${financeCompany}-1`,
      name: `مدیر مالی ${compInfo?.name || financeCompany}`,
      role: 'مدیر مالی و خزانه‌داری'
    };
    onSelectPortal('finance', {
      id: fin.id,
      role: 'finance',
      name: fin.name,
      roleTitle: fin.role,
      company: financeCompany,
      companyName: compInfo?.name,
      phone: fin.phone,
      nationalId: fin.nationalId,
      branchId: fin.branchId,
      licenseCode: fin.licenseCode
    });
  };

  const handleCrmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const compInfo = insurersList.find((c) => c.code === crmCompany);
    const companyStaff = crmStaffMap[crmCompany] || [];
    const crm = companyStaff.find((s) => s.id === crmId) || companyStaff[0] || {
      id: `crm-${crmCompany}-1`,
      name: `سرپرست CRM ${compInfo?.name || crmCompany}`,
      role: 'سرپرست امور مشتریان و شکایات'
    };
    onSelectPortal('crm', {
      id: crm.id,
      role: 'crm',
      name: crm.name,
      roleTitle: crm.role,
      company: crmCompany,
      companyName: compInfo?.name,
      phone: crm.phone,
      nationalId: crm.nationalId,
      branchId: crm.branchId,
      licenseCode: crm.licenseCode
    });
  };


  return (
    <div className="w-full min-h-screen bg-[#f4f7fc] text-slate-900 flex flex-col selection:bg-blue-700 selection:text-white" dir="rtl">

      {/* ================= HERO: کاراینشو — خودروی متحرک با ردِ نور ================= */}
      <KarinshoHero />

      {/* ================= کارت ورود شناور روی هیرو ================= */}
      <main className="relative z-10 -mt-16 sm:-mt-24 px-3 sm:px-5 lg:px-7 flex-1 w-full pb-8">
        <div className="w-full space-y-8">

          {/* کارت اصلی ورود */}
          <div className="w-full max-w-5xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] border border-slate-200/80 shadow-[0_24px_70px_-24px_rgba(29,78,216,0.28)] p-5 sm:p-8">

            {/* دو تب اصلی: مشتری / سازمانی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-100/80 p-1.5 rounded-2xl mb-7 max-w-3xl mx-auto">
              <button
                type="button"
                onClick={() => setMainMode('customer')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  mainMode === 'customer'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-600 hover:text-blue-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>ورود مشتری</span>
              </button>

              <button
                type="button"
                onClick={() => setMainMode('org')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  mainMode === 'org'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-600 hover:text-blue-800'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>ورود سازمانی</span>
              </button>
            </div>

            {/* ---------- ورود مشتری ---------- */}
            {mainMode === 'customer' && (
              <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    ورود بیمه‌گذار و زیان‌دیده
                  </h2>
                </div>

                <CustomerOtpLoginForm
                  onSuccess={(session) => onSelectPortal('customer', session)}
                />
              </div>
            )}

            {/* ---------- ورود سازمانی ---------- */}
            {mainMode === 'org' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
                <div className="text-center space-y-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    ورود به پنل تخصصی سازمانی
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    نقش سازمانی، شرکت بیمه‌گر و حساب کاربری خود را انتخاب نمایید
                  </p>
                </div>

                {/* انتخاب نقش */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ChevronDown className="w-3.5 h-3.5 text-blue-700" />
                    نقش و سطح دسترسی
                  </label>
                  <select
                    value={orgRole}
                    onChange={(e) => setOrgRole(e.target.value as RoleType)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-black text-blue-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer shadow-sm"
                  >
                    <option value="insurer">شرکت بیمه‌گر (مدیریت پرونده‌ها و ارجاع خسارت)</option>
                    <option value="assessor">کارشناس ارزیابی خسارت (برآورد هوشمند و مدل ۳D)</option>
                    <option value="fieldexpert">کارشناس میدانی (بازدید صحنه و ارزیابی حضوری)</option>
                    <option value="reviewer">بازبین کیفیت و ریسک (Audit & Reviewer)</option>
                    <option value="finance">مدیریت مالی و خزانه‌داری (دستور پرداخت، حواله پایا و اسناد)</option>
                    <option value="crm">امور مشتریان و CRM (کال‌سنتر و پیگیری شکایات)</option>
                    <option value="admin">مدیر ارشد سامانه (System Administrator)</option>
                  </select>
                </div>

                {/* فرم نقش انتخاب‌شده */}
                <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200 space-y-4">
                {/* 1. Insurer */}
                {orgRole === 'insurer' && (
                  <form onSubmit={handleInsurerLogin} className="space-y-4 animate-in fade-in">
                    <SearchableCompanySelect
                      insurersList={insurersList}
                      selectedCompanyCode={insurerCompany}
                      onSelectCompany={(code) => setInsCompany(code)}
                    />

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        رمز عبور مدیر ارشد
                      </label>
                      <input
                        type="password"
                        value={insurerPass}
                        onChange={(e) => setInsPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <span>ورود به پنل مدیریت شرکت بیمه</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="pt-2 border-t border-slate-200 text-center">
                      <p className="text-[11px] text-slate-600 mb-2">
                        شرکت بیمه شما هنوز در سامانه ثبت نشده است؟
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCompanyRegModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 transition active:scale-95 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-blue-700" />
                        <span>ثبت‌نام شرکت بیمه جدید و درخواست صدور پنل</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. Assessor (Claims Expert) with Company + Name + Phone + OTP */}
                {orgRole === 'assessor' && (
                  <ExpertOtpLoginForm
                    role="assessor"
                    insurersList={insurersList}
                    staffMap={expertsMap}
                    onLoginSuccess={onSelectPortal}
                    onRefreshData={refreshDynamicData}
                  />
                )}

                {/* 3. Field Expert with Company + Name + Phone + OTP */}
                {orgRole === 'fieldexpert' && (
                  <ExpertOtpLoginForm
                    role="fieldexpert"
                    insurersList={insurersList}
                    staffMap={fieldExpertsMap}
                    onLoginSuccess={onSelectPortal}
                    onRefreshData={refreshDynamicData}
                  />
                )}

                {/* 4. Reviewer with Company + Name + Phone + OTP */}
                {orgRole === 'reviewer' && (
                  <ExpertOtpLoginForm
                    role="reviewer"
                    insurersList={insurersList}
                    staffMap={reviewersMap}
                    onLoginSuccess={onSelectPortal}
                    onRefreshData={refreshDynamicData}
                  />
                )}

                {/* 5. Finance */}
                {orgRole === 'finance' && (
                  <form onSubmit={handleFinanceLogin} className="space-y-4 animate-in fade-in">
                    <SearchableCompanySelect
                      insurersList={insurersList}
                      selectedCompanyCode={financeCompany}
                      onSelectCompany={(code) => {
                        setFinanceCompany(code);
                        const list = financeStaffMap[code] || [];
                        if (list.length > 0) setFinanceId(list[0].id);
                      }}
                    />

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        کارشناس / مدیر مالی
                      </label>
                      <select
                        value={financeId}
                        onChange={(e) => setFinanceId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                      >
                        {(financeStaffMap[financeCompany] || []).length > 0 ? (
                          (financeStaffMap[financeCompany] || []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))
                        ) : (
                          <option value={`fin-${financeCompany}-default`}>
                            مدیر مالی پیش‌فرض ({insurersList.find((c) => c.code === financeCompany)?.name || financeCompany})
                          </option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        رمز عبور
                      </label>
                      <input
                        type="password"
                        value={financePass}
                        onChange={(e) => setFinancePass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <span>ورود به پنل مالی و خزانه‌داری</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 6. CRM */}
                {orgRole === 'crm' && (
                  <form onSubmit={handleCrmLogin} className="space-y-4 animate-in fade-in">
                    <SearchableCompanySelect
                      insurersList={insurersList}
                      selectedCompanyCode={crmCompany}
                      onSelectCompany={(code) => {
                        setCrmCompany(code);
                        const list = crmStaffMap[code] || [];
                        if (list.length > 0) setCrmId(list[0].id);
                      }}
                    />

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        کارشناس پشتیبانی / CRM
                      </label>
                      <select
                        value={crmId}
                        onChange={(e) => setCrmId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                      >
                        {(crmStaffMap[crmCompany] || []).length > 0 ? (
                          (crmStaffMap[crmCompany] || []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))
                        ) : (
                          <option value={`crm-${crmCompany}-default`}>
                            کارشناس CRM پیش‌فرض ({insurersList.find((c) => c.code === crmCompany)?.name || crmCompany})
                          </option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        رمز عبور
                      </label>
                      <input
                        type="password"
                        value={crmPass}
                        onChange={(e) => setCrmPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-sm"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <span>ورود به پنل امور مشتریان و CRM</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 7. Senior Admin */}
                {orgRole === 'admin' && (
                  <form onSubmit={handleAdminLogin} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        نام کاربری مدیر ارشد
                      </label>
                      <input
                        type="text"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        رمز عبور مدیر ارشد
                      </label>
                      <input
                        type="password"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-xl text-xs shadow-md border border-blue-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>ورود به پنل مدیریت ارشد کلان</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}
                </div>
              </div>
            )}
          </div>

          {/* استعلام سریع بدون ورود */}
          <div className="flex justify-center">
            <button
              onClick={onOpenPublicTrack}
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white border border-blue-200 text-blue-800 font-black text-xs shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <span className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <span>استعلام و پیگیری پرونده با کد رهگیری — بدون نیاز به ورود</span>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </button>
          </div>

          {/* ================= کارت‌های ویژگی (مثل رفرنس) ================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
            <div className="krn-spotlight krn-proximity p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm transition-all text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-50 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-violet-500" />
              </div>
              <h4 className="font-black text-sm text-slate-900">امن و مطمئن</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                حفاظت از اطلاعات شما با بالاترین استانداردهای امنیتی
              </p>
            </div>

            <div className="krn-spotlight krn-proximity p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm transition-all text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl krn-accent-sand flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="font-black text-sm text-slate-900">سریع و هوشمند</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                استعلام و پرداخت خسارت در کوتاه‌ترین زمان ممکن
              </p>
            </div>

            <div className="krn-spotlight krn-proximity p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm transition-all text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl krn-accent-sage flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <h4 className="font-black text-sm text-slate-900">شفاف و دقیق</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                اطلاعات جامع و به‌روز خسارت‌ها در هر لحظه
              </p>
            </div>

            <div className="krn-spotlight krn-proximity p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm transition-all text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="font-black text-sm text-slate-900">پشتیبانی ۲۴/۷</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                پاسخگویی در تمام ساعات شبانه‌روز در کنار شما هستیم
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 font-bold">
        <div className="w-full px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© ۱۴۰۵ کاراینـشو — تمام حقوق محفوظ است.</p>
          <p className="text-blue-800 font-black">
            سامانه هوشمند پرداخت و ارزیابی خسارت بیمه خودرو
          </p>
        </div>
      </footer>

      {/* Insurance Company Registration Modal */}
      <CompanyRegistrationModal
        isOpen={isCompanyRegModalOpen}
        onClose={() => setIsCompanyRegModalOpen(false)}
        onSuccess={() => {
          refreshDynamicData();
          setIsCompanyRegModalOpen(false);
        }}
      />
    </div>
  );
};
