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
  Award,
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
  INITIAL_SPECIALIST_EXPERTS,
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
  onOpenCompanyRegistration?: () => void;
}

export type MainLoginType = 'customer' | 'org';

export const PortalGateway: React.FC<PortalGatewayProps> = ({
  onSelectPortal,
  onOpenPublicTrack,
  onOpenCompanyRegistration
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

  // Company Registration Modal State
  const [isCompanyRegModalOpen, setIsCompanyRegModalOpen] = useState(false);

  const handleOpenCompanyModal = () => {
    if (onOpenCompanyRegistration) {
      onOpenCompanyRegistration();
    } else {
      setIsCompanyRegModalOpen(true);
    }
  };

  useEffect(() => {
    const handleOpen = () => handleOpenCompanyModal();
    window.addEventListener('claimflow_open_company_reg', handleOpen);
    return () => {
      window.removeEventListener('claimflow_open_company_reg', handleOpen);
    };
  }, [onOpenCompanyRegistration]);

  // Organizational Role selected from Dropdown
  const [orgRole, setOrgRole] = useState<RoleType | 'specialist'>('insurer');

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
      <main className="relative z-10 -mt-8 sm:-mt-24 px-2.5 sm:px-5 lg:px-7 flex-1 w-full pb-8">
        <div className="w-full space-y-5 sm:space-y-8">

          {/* کارت اصلی ورود */}
          <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto bg-white/95 sm:bg-white/90 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-[0_16px_48px_-12px_rgba(29,78,216,0.2)] p-3.5 sm:p-7 md:p-10 lg:p-12">

            {/* دکمه ثبت‌نام شرکت بیمه جدید و درخواست صدور پنل */}
            <div className="flex items-center justify-center mb-3 sm:mb-5 md:mb-7">
              <button
                type="button"
                onClick={handleOpenCompanyModal}
                className="group inline-flex items-center justify-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-blue-50/90 border border-blue-200 hover:border-blue-500 text-blue-950 font-bold text-[11px] sm:text-xs md:text-sm lg:text-base shadow-2xs hover:bg-blue-100/90 transition-all active:scale-95 cursor-pointer max-w-full"
              >
                <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-md sm:rounded-lg bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-all shadow-2xs shrink-0">
                  <Building2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4.5 md:h-4.5 stroke-[2.5]" />
                </span>
                <span className="truncate">ثبت‌نام شرکت بیمه جدید و درخواست صدور پنل</span>
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 text-blue-800 transition-transform group-hover:-translate-x-0.5 shrink-0" />
              </button>
            </div>

            {/* دو تب اصلی: مشتری / سازمانی — سگمنت افقی تمیز ۲ تایی */}
            <div className="grid grid-cols-2 gap-1.5 md:gap-2.5 bg-slate-100/90 p-1 sm:p-1.5 md:p-2 rounded-lg sm:rounded-xl md:rounded-2xl mb-3 sm:mb-5 md:mb-7 max-w-xs sm:max-w-sm md:max-w-xl lg:max-w-2xl mx-auto shadow-inner">
              <button
                type="button"
                onClick={() => setMainMode('customer')}
                className={`py-1.5 sm:py-2 md:py-3.5 lg:py-4 px-2 md:px-5 rounded-md sm:rounded-lg md:rounded-xl text-[11px] sm:text-xs md:text-base lg:text-lg font-black transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2.5 cursor-pointer ${
                  mainMode === 'customer'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-blue-800'
                }`}
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5.5 lg:h-5.5" />
                <span>ورود مشتری</span>
              </button>

              <button
                type="button"
                onClick={() => setMainMode('org')}
                className={`py-1.5 sm:py-2 md:py-3.5 lg:py-4 px-2 md:px-5 rounded-md sm:rounded-lg md:rounded-xl text-[11px] sm:text-xs md:text-base lg:text-lg font-black transition-all duration-200 flex items-center justify-center gap-1.5 md:gap-2.5 cursor-pointer ${
                  mainMode === 'org'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-blue-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5.5 lg:h-5.5" />
                <span>ورود سازمانی</span>
              </button>
            </div>

            {/* ---------- ورود مشتری ---------- */}
            {mainMode === 'customer' && (
              <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 animate-in fade-in">
                <div className="text-center">
                  <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-black text-slate-900">
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
              <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto space-y-3 sm:space-y-4 md:space-y-6 animate-in fade-in">
                <div className="text-center space-y-1 sm:space-y-1.5">
                  <h2 className="text-xs sm:text-sm md:text-lg lg:text-xl font-black text-slate-900">
                    ورود به پنل تخصصی سازمانی
                  </h2>
                  <p className="text-[10px] sm:text-[11px] md:text-sm lg:text-base text-slate-500 font-medium">
                    نقش سازمانی، شرکت بیمه‌گر و حساب کاربری خود را انتخاب نمایید
                  </p>
                </div>

                {/* انتخاب نقش */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <ChevronDown className="w-3 h-3 text-blue-700" />
                    نقش و سطح دسترسی
                  </label>
                  <select
                    value={orgRole}
                    onChange={(e) => setOrgRole(e.target.value as RoleType | 'specialist')}
                    className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 sm:py-2 bg-slate-50 border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-blue-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="insurer">شرکت بیمه‌گر (مدیریت پرونده‌ها و ارجاع خسارت)</option>
                    <option value="assessor">کارشناس ارزیابی خسارت (برآورد هوشمند و مدل ۳D)</option>
                    <option value="specialist">کارشناس تخصصی خسارت (خسارت‌های مازاد بر ۱۰۰ میلیون تومان)</option>
                    <option value="fieldexpert">کارشناس میدانی (بازدید صحنه و ارزیابی حضوری)</option>
                    <option value="reviewer">بازبین کیفیت و ریسک (Audit & Reviewer)</option>
                    <option value="finance">مدیریت مالی و خزانه‌داری (دستور پرداخت، حواله پایا و اسناد)</option>
                    <option value="crm">امور مشتریان و CRM (کال‌سنتر و پیگیری شکایات)</option>
                    <option value="admin">مدیر ارشد سامانه (System Administrator)</option>
                  </select>
                </div>

                {/* فرم نقش انتخاب‌شده */}
                <div className="bg-slate-50/90 p-2.5 sm:p-4 md:p-5 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 space-y-3 md:space-y-4">
                {/* 1. Insurer */}
                {orgRole === 'insurer' && (
                  <form onSubmit={handleInsurerLogin} className="space-y-3 md:space-y-4 animate-in fade-in">
                    <SearchableCompanySelect
                      insurersList={insurersList}
                      selectedCompanyCode={insurerCompany}
                      onSelectCompany={(code) => setInsCompany(code)}
                    />

                    <div>
                      <label className="block text-[11px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                        رمز عبور مدیر ارشد
                      </label>
                      <input
                        type="password"
                        value={insurerPass}
                        onChange={(e) => setInsPass(e.target.value)}
                        placeholder="••••"
                        className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-9 sm:h-10 md:h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base shadow-xs transition-all flex items-center justify-center gap-1.5 md:gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      <span>ورود به پنل مدیریت شرکت بیمه</span>
                      <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                    </button>
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

                {/* 2.1 Specialist Expert (Claims >100M) with Company + Name + Phone + OTP */}
                {orgRole === 'specialist' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-700 shrink-0" />
                      <div>
                        <strong className="block font-black">ورود کارشناسان ارشد و تخصصی</strong>
                        <span>رسیدگی به پرونده‌های با ارزیابی بیش از ۱۰۰ میلیون تومان</span>
                      </div>
                    </div>
                    <ExpertOtpLoginForm
                      role="assessor"
                      insurersList={insurersList}
                      staffMap={INITIAL_SPECIALIST_EXPERTS}
                      onLoginSuccess={(role, payload) =>
                        onSelectPortal('assessor', {
                          ...payload,
                          roleTitle: payload?.roleTitle || 'کارشناس تخصصی و ارشد خسارت‌های سنگین',
                          isSpecialist: true
                        })
                      }
                      onRefreshData={refreshDynamicData}
                    />
                  </div>
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
                  <form onSubmit={handleFinanceLogin} className="space-y-3 md:space-y-4 animate-in fade-in">
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
                      <label className="block text-[11px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                        کارشناس / مدیر مالی
                      </label>
                      <select
                        value={financeId}
                        onChange={(e) => setFinanceId(e.target.value)}
                        className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-black text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
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
                      <label className="block text-[11px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                        رمز عبور
                      </label>
                      <input
                        type="password"
                        value={financePass}
                        onChange={(e) => setFinancePass(e.target.value)}
                        placeholder="••••"
                        className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-9 sm:h-10 md:h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base shadow-xs transition-all flex items-center justify-center gap-1.5 md:gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      <span>ورود به پنل مالی و خزانه‌داری</span>
                      <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                    </button>
                  </form>
                )}

                {/* 6. CRM */}
                {orgRole === 'crm' && (
                  <form onSubmit={handleCrmLogin} className="space-y-3 md:space-y-4 animate-in fade-in">
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
                      <label className="block text-[11px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                        کارشناس پشتیبانی / CRM
                      </label>
                      <select
                        value={crmId}
                        onChange={(e) => setCrmId(e.target.value)}
                        className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 sm:py-2 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-black text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
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
                      <label className="block text-[11px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                        رمز عبور
                      </label>
                      <input
                        type="password"
                        value={crmPass}
                        onChange={(e) => setCrmPass(e.target.value)}
                        placeholder="••••"
                        className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-9 sm:h-10 md:h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base shadow-xs transition-all flex items-center justify-center gap-1.5 md:gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      <span>ورود به پنل امور مشتریان و CRM</span>
                      <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                    </button>
                  </form>
                )}

                {/* 7. Senior Admin */}
                {orgRole === 'admin' && (
                  <form onSubmit={handleAdminLogin} className="space-y-3 md:space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                        نام کاربری مدیر ارشد
                      </label>
                      <input
                        type="text"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                        رمز عبور مدیر ارشد
                      </label>
                      <input
                        type="password"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="••••"
                        className="w-full h-9 sm:h-10 md:h-12 px-3 md:px-4 py-1.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-9 sm:h-10 md:h-12 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base shadow-xs transition-all flex items-center justify-center gap-1.5 md:gap-2 active:scale-[0.98] cursor-pointer"
                    >
                      <span>ورود به پنل مدیریت ارشد کلان</span>
                      <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                    </button>
                  </form>
                )}
                </div>
              </div>
            )}
          </div>

          {/* استعلام سریع بدون ورود */}
          <div className="flex justify-center px-1">
            <button
              onClick={onOpenPublicTrack}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 md:px-7 md:py-3.5 rounded-lg sm:rounded-xl md:rounded-2xl bg-white border border-blue-200 text-blue-900 font-black text-[11px] sm:text-xs md:text-sm shadow-2xs hover:shadow-xs hover:border-blue-400 transition-all cursor-pointer active:scale-[0.98]"
            >
              <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-md sm:rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 stroke-[2.5] text-blue-700" />
              </span>
              <span className="truncate">استعلام و پیگیری پرونده با کد رهگیری (بدون ورود)</span>
              <ArrowLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-700 transition-transform group-hover:-translate-x-0.5 shrink-0" />
            </button>
          </div>

          {/* ================= کارت‌های ویژگی ================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 pb-6 sm:pb-10">
            <div className="krn-spotlight krn-proximity p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all text-center space-y-1 sm:space-y-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg sm:rounded-xl bg-violet-50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
              </div>
              <h4 className="font-black text-[11px] sm:text-xs text-slate-900">امن و مطمئن</h4>
              <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 leading-relaxed font-medium">
                حفاظت از اطلاعات شما با استانداردهای امنیتی
              </p>
            </div>

            <div className="krn-spotlight krn-proximity p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all text-center space-y-1 sm:space-y-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg sm:rounded-xl krn-accent-sand flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-black text-[11px] sm:text-xs text-slate-900">سریع و هوشمند</h4>
              <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 leading-relaxed font-medium">
                استعلام و پرداخت خسارت در کمترین زمان
              </p>
            </div>

            <div className="krn-spotlight krn-proximity p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all text-center space-y-1 sm:space-y-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg sm:rounded-xl krn-accent-sage flex items-center justify-center">
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h4 className="font-black text-[11px] sm:text-xs text-slate-900">شفاف و دقیق</h4>
              <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 leading-relaxed font-medium">
                اطلاعات جامع و به‌روز پرونده‌ها در هر لحظه
              </p>
            </div>

            <div className="krn-spotlight krn-proximity p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all text-center space-y-1 sm:space-y-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <h4 className="font-black text-[11px] sm:text-xs text-slate-900">پشتیبانی ۲۴/۷</h4>
              <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 leading-relaxed font-medium">
                پاسخگویی در تمام ساعات شبانه‌روز در کنار شما
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

      {/* Insurance Company Registration Modal (standalone fallback) */}
      {!onOpenCompanyRegistration && (
        <CompanyRegistrationModal
          isOpen={isCompanyRegModalOpen}
          onClose={() => setIsCompanyRegModalOpen(false)}
          onSuccess={() => {
            refreshDynamicData();
            setIsCompanyRegModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
