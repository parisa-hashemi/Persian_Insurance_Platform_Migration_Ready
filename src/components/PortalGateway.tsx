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
  Headphones
} from 'lucide-react';
import { RoleType, UserSession, InsurerInfo, StaffMember } from '../types';
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
  loadCrmStaffFromStorage,
  loadCustomersFromStorage,
  registerCustomer,
  RegisteredCustomer
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

  // Form states for Customer
  const [isCustomerRegistering, setIsCustomerRegistering] = useState(false);
  const [customerPhone, setCustPhone] = useState('');
  const [customerPass, setCustPass] = useState('');

  // Customer Registration Fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNationalId, setRegNationalId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Customer Feedback Banners
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [customerSuccess, setCustomerSuccess] = useState<string | null>(null);

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

  // Customer Login Handler
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerError(null);
    setCustomerSuccess(null);

    const customers = loadCustomersFromStorage();
    const found = customers.find((c) => c.phone.trim() === customerPhone.trim());

    if (!found) {
      setCustomerError('حساب کاربری با این شماره پیدا نشد! برای استفاده از خدمات ابتدا باید ثبت‌نام کنید.');
      return;
    }

    if (found.password && found.password !== customerPass) {
      setCustomerError('کلمه عبور وارد شده نادرست است.');
      return;
    }

    onSelectPortal('customer', {
      id: found.phone,
      role: 'customer',
      name: found.name,
      phone: found.phone,
      nationalId: found.nationalId
    });
  };

  // Customer Registration Handler
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerError(null);
    setCustomerSuccess(null);

    if (!regName.trim()) {
      setCustomerError('لطفاً نام و نام خانوادگی را وارد نمایید.');
      return;
    }
    if (!regPhone.trim() || regPhone.trim().length < 11) {
      setCustomerError('لطفاً شماره موبایل معتبر (۱۱ رقمی) وارد نمایید.');
      return;
    }
    if (!regNationalId.trim() || regNationalId.trim().length !== 10) {
      setCustomerError('کد ملی باید ۱۰ رقم کامل باشد.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setCustomerError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setCustomerError('رمز عبور و تکرار آن مطابقت ندارند.');
      return;
    }

    const res = registerCustomer({
      phone: regPhone.trim(),
      name: regName.trim(),
      nationalId: regNationalId.trim(),
      password: regPassword,
      registeredAt: new Date().toLocaleDateString('fa-IR')
    });

    if (!res.success) {
      setCustomerError(res.message);
      return;
    }

    setCustomerSuccess('ثبت‌نام شما با موفقیت انجام شد! در حال انتقال به پورتال...');
    
    setTimeout(() => {
      onSelectPortal('customer', {
        id: regPhone.trim(),
        role: 'customer',
        name: regName.trim(),
        phone: regPhone.trim(),
        nationalId: regNationalId.trim()
      });
    }, 1000);
  };

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
    <div className="w-full min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between selection:bg-blue-900 selection:text-amber-300" dir="rtl">
      {/* Hero Header */}
      <div className="relative overflow-hidden pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b-4 border-amber-400 bg-gradient-to-b from-blue-100 via-sky-50 to-white text-slate-900 shadow-sm">
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-blue-200 text-blue-900 text-xs font-black shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>سامانه ملی و هوشمند ارزیابی و تسویه خسارت بیمه خودرو</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-blue-950 leading-tight tracking-tight">
            درگاه ورودی سامانه یکپارچه پرداخت و ارزیابی خسارت
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-700 leading-relaxed font-bold">
            جهت ورود یا ثبت‌نام، یکی از گزینه‌های ورود مشتری یا ورود سازمانی (کارشناسان و مدیران) را انتخاب نمایید.
          </p>

          {/* Quick Public Track Button */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={onOpenPublicTrack}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-blue-950 font-black text-xs shadow-md border-2 border-amber-300 transition-all flex items-center gap-2.5 active:scale-95"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>استعلام و پیگیری پرونده با کد رهگیری (بدون نیاز به ورود)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Portal Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        
        {/* TWO PRIMARY LOGIN TABS: Customer vs Organizational */}
        <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto bg-white p-2 rounded-2xl border-2 border-blue-900 shadow-md">
          <button
            type="button"
            onClick={() => setMainMode('customer')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 ${
              mainMode === 'customer'
                ? 'bg-blue-900 text-white shadow-md border-2 border-blue-900'
                : 'text-slate-700 hover:text-blue-900 hover:bg-blue-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ورود مشتری (زیان‌دیده/مقصر)</span>
          </button>

          <button
            type="button"
            onClick={() => setMainMode('org')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 ${
              mainMode === 'org'
                ? 'bg-amber-500 text-blue-950 shadow-md border-2 border-amber-400'
                : 'text-slate-700 hover:text-blue-900 hover:bg-amber-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>ورود سازمانی (ارزیابان و مدیران)</span>
          </button>
        </div>

        {/* Dynamic Login Panel - Clean, Spacious & Focused */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          
          {/* OPTION 1: Customer Login & Register (Decluttered, Centered, Minimalist) */}
          {mainMode === 'customer' && (
            <div className="max-w-md mx-auto space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
                  <User className="w-4 h-4 text-blue-900" />
                  <span>پورتال زیان‌دیدگان و مقصران حادثه</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {isCustomerRegistering ? 'ثبت‌نام و عضویت در سامانه' : 'ورود زیان‌دیده و مقصر'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isCustomerRegistering
                    ? 'جهت ثبت پرونده خسارت و پیگیری آنلاین اطلاعات خود را تکمیل فرمایید'
                    : 'جهت پیگیری آنلاین پرونده، ثبت شواهد و دریافت خسارت وارد شوید'}
                </p>
              </div>

              {/* Mode Selector Toggle: Login vs Register */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerRegistering(false);
                    setCustomerError(null);
                    setCustomerSuccess(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    !isCustomerRegistering
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-blue-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ورود به حساب</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerRegistering(true);
                    setCustomerError(null);
                    setCustomerSuccess(null);
                  }}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    isCustomerRegistering
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-blue-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ثبت‌نام جدید</span>
                </button>
              </div>

              {/* Feedback Banners */}
              {customerError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{customerError}</span>
                </div>
              )}

              {customerSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{customerSuccess}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {!isCustomerRegistering ? (
                <form onSubmit={handleCustomerLogin} className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                      شماره موبایل
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white transition-all font-bold"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                      رمز عبور
                    </label>
                    <input
                      type="password"
                      value={customerPass}
                      onChange={(e) => setCustPass(e.target.value)}
                      placeholder="••••"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white transition-all font-bold"
                      dir="ltr"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>ورود به حساب کاربری</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {/* Quick Demo Fill Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">ورود سریع تستی:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCustPhone('09121112233');
                          setCustPass('1234');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 font-bold border border-slate-200 transition-colors"
                      >
                        زیان‌دیده
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustPhone('09128881122');
                          setCustPass('1234');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 font-bold border border-slate-200 transition-colors"
                      >
                        مقصر
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-xs text-slate-600">
                    <span>حساب کاربری ندارید؟ </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerRegistering(true);
                        setCustomerError(null);
                      }}
                      className="text-blue-900 font-black hover:underline"
                    >
                      همین حالا ثبت‌نام کنید
                    </button>
                  </div>
                </form>
              ) : (
                /* REGISTER FORM */
                <form onSubmit={handleCustomerRegister} className="space-y-3.5 animate-in fade-in">
                  <div>
                    <label className="block text-xs text-slate-800 mb-1 font-bold">
                      نام و نام خانوادگی
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="مثال: مهدی کشاورز"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white font-bold transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-800 mb-1 font-bold">
                      شماره موبایل
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="09121234567"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white font-bold transition-all"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-800 mb-1 font-bold">
                      کد ملی (۱۰ رقمی)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={regNationalId}
                      onChange={(e) => setRegNationalId(e.target.value)}
                      placeholder="0012345678"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white font-bold transition-all"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1 font-bold">
                        رمز عبور
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white font-bold transition-all"
                        dir="ltr"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-800 mb-1 font-bold">
                        تکرار رمز عبور
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 focus:bg-white font-bold transition-all"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-blue-950 font-black rounded-xl text-xs shadow-md border border-amber-300 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>تکمیل ثبت‌نام و ورود</span>
                  </button>

                  <div className="pt-2 text-center text-xs text-slate-600">
                    <span>قبلاً ثبت‌نام کرده‌اید؟ </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerRegistering(false);
                        setCustomerError(null);
                      }}
                      className="text-blue-900 font-black hover:underline"
                    >
                      وارد حساب شوید
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* OPTION 2: Organizational Login (Clean, Centered, Dynamic Role Selector) */}
          {mainMode === 'org' && (
            <div className="max-w-lg mx-auto space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>درگاه ورود پرسنل و مدیران سازمانی</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  ورود به پنل تخصصی سازمانی
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  نقش سازمانی، شرکت بیمه‌گر و حساب کاربری خود را انتخاب نمایید
                </p>
              </div>

              {/* ROLE DROPDOWN SELECTOR */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ChevronDown className="w-3.5 h-3.5 text-blue-900" />
                  نقش و سطح دسترسی
                </label>
                <select
                  value={orgRole}
                  onChange={(e) => setOrgRole(e.target.value as RoleType)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs sm:text-sm font-black text-blue-950 focus:outline-none focus:border-blue-900 focus:bg-white transition-all cursor-pointer shadow-sm"
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

              {/* ROLE FORMS */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                
                {/* 1. Insurer */}
                {orgRole === 'insurer' && (
                  <form onSubmit={handleInsurerLogin} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        شرکت بیمه‌گر
                      </label>
                      <select
                        value={insurerCompany}
                        onChange={(e) => setInsCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {insurersList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        رمز عبور
                      </label>
                      <input
                        type="password"
                        value={insurerPass}
                        onChange={(e) => setInsPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>ورود به پنل بیمه‌گر</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 2. Assessor */}
                {orgRole === 'assessor' && (
                  <form onSubmit={handleAssessorLogin} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        شرکت بیمه‌گر
                      </label>
                      <select
                        value={assessorCompany}
                        onChange={(e) => {
                          setAssessorCompany(e.target.value);
                          const exps = expertsMap[e.target.value] || [];
                          if (exps.length) setAssessorId(exps[0].id);
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {insurersList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        انتخاب کارشناس ارزیاب
                      </label>
                      <select
                        value={assessorId}
                        onChange={(e) => setAssessorId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {(expertsMap[assessorCompany] || []).length > 0 ? (
                          (expertsMap[assessorCompany] || []).map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name} — {e.role}
                            </option>
                          ))
                        ) : (
                          <option value={`exp-${assessorCompany}-default`}>
                            کارشناس ارزیاب پیش‌فرض ({insurersList.find((c) => c.code === assessorCompany)?.name || assessorCompany})
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
                        value={assessorPass}
                        onChange={(e) => setAssessorPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>ورود به پنل ارزیاب</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 3. Field Expert */}
                {orgRole === 'fieldexpert' && (
                  <form onSubmit={handleFieldExpertLogin} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        شرکت بیمه‌گر
                      </label>
                      <select
                        value={fieldCompany}
                        onChange={(e) => {
                          setFieldCompany(e.target.value);
                          const list = fieldExpertsMap[e.target.value] || [];
                          if (list.length) setFieldId(list[0].id);
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {insurersList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        انتخاب کارشناس میدانی
                      </label>
                      <select
                        value={fieldId}
                        onChange={(e) => setFieldId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {(fieldExpertsMap[fieldCompany] || []).length > 0 ? (
                          (fieldExpertsMap[fieldCompany] || []).map((fe) => (
                            <option key={fe.id} value={fe.id}>
                              {fe.name} — {fe.role}
                            </option>
                          ))
                        ) : (
                          <option value={`fe-${fieldCompany}-default`}>
                            کارشناس میدانی پیش‌فرض ({insurersList.find((c) => c.code === fieldCompany)?.name || fieldCompany})
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
                        value={fieldPass}
                        onChange={(e) => setFieldPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>ورود به پنل کارشناس میدانی</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 4. Reviewer */}
                {orgRole === 'reviewer' && (
                  <form onSubmit={handleReviewerLogin} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        شرکت بیمه‌گر
                      </label>
                      <select
                        value={reviewerCompany}
                        onChange={(e) => {
                          setReviewerCompany(e.target.value);
                          const list = reviewersMap[e.target.value] || [];
                          if (list.length) setReviewerId(list[0].id);
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {insurersList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        انتخاب بازبین
                      </label>
                      <select
                        value={reviewerId}
                        onChange={(e) => setReviewerId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                      >
                        {(reviewersMap[reviewerCompany] || []).length > 0 ? (
                          (reviewersMap[reviewerCompany] || []).map((rv) => (
                            <option key={rv.id} value={rv.id}>
                              {rv.name} — {rv.role}
                            </option>
                          ))
                        ) : (
                          <option value={`rv-${reviewerCompany}-default`}>
                            بازبین کیفی پیش‌فرض ({insurersList.find((c) => c.code === reviewerCompany)?.name || reviewerCompany})
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
                        value={reviewerPass}
                        onChange={(e) => setReviewerPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>ورود به پنل بازبین</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 5. Finance */}
                {orgRole === 'finance' && (
                  <form onSubmit={handleFinanceLogin} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        شرکت بیمه‌گر
                      </label>
                      <select
                        value={financeCompany}
                        onChange={(e) => {
                          setFinanceCompany(e.target.value);
                          const list = financeStaffMap[e.target.value] || [];
                          if (list.length > 0) setFinanceId(list[0].id);
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                      >
                        {insurersList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        کارشناس / مدیر مالی
                      </label>
                      <select
                        value={financeId}
                        onChange={(e) => setFinanceId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
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
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>ورود به پنل مالی و خزانه‌داری</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* 6. CRM */}
                {orgRole === 'crm' && (
                  <form onSubmit={handleCrmLogin} className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        شرکت بیمه‌گر
                      </label>
                      <select
                        value={crmCompany}
                        onChange={(e) => {
                          setCrmCompany(e.target.value);
                          const list = crmStaffMap[e.target.value] || [];
                          if (list.length > 0) setCrmId(list[0].id);
                        }}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-purple-600"
                      >
                        {insurersList.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                        کارشناس پشتیبانی / CRM
                      </label>
                      <select
                        value={crmId}
                        onChange={(e) => setCrmId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-purple-600"
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
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-purple-600"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
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
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
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
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-blue-950 font-black rounded-xl text-xs shadow-md border border-amber-300 transition-all flex items-center justify-center gap-2 active:scale-95"
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

        {/* System Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-800 pt-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-extrabold text-xs text-slate-900">انطباق با قوانین بیمه</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              پشتیبانی از قوانین کروکی، فرانشیز، افت ارزش و مراحل اعتراض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <Zap className="w-5 h-5 text-amber-600" />
            <h4 className="font-extrabold text-xs text-slate-900">پردازش هوشمند شواهد</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              شناسایی آسیب‌های بدنه، پیشنهاد قطعات و مدل‌سازی سه‌بعدی خودرو.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h4 className="font-extrabold text-xs text-slate-900">تسویه مستقیم به شبا</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              اعتبارسنجی کد ملی و شماره شبا و صدور دستور پرداخت آنلاین.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h4 className="font-extrabold text-xs text-slate-900">تفکیک شفاف وظایف</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              دسترسی مجزا برای مشتری، بیمه‌گر، ارزیاب، میدانی، بازبین و مدیر.
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-600 font-bold">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© ۱۴۰۵ سامانه ملی ارزیابی و تسویه خسارت بیمه خودرو. تمام حقوق محفوظ است.</p>
          <p className="text-blue-900 font-black">
            سامانه هوشمند مدیریت و تسویه خسارت
          </p>
        </div>
      </footer>
    </div>
  );
};
