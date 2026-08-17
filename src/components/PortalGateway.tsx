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
    const compInfo = INSURER_COMPANIES.find((c) => c.code === insurerCompany);
    onSelectPortal('insurer', {
      id: insurerCompany,
      role: 'insurer',
      name: compInfo?.name || 'پورتال بیمه‌گر',
      company: insurerCompany
    });
  };

  const handleAssessorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const companyExperts = INITIAL_EXPERTS[assessorCompany] || [];
    const expert = companyExperts.find((e) => e.id === assessorId) || companyExperts[0];
    onSelectPortal('assessor', {
      id: expert.id,
      role: 'assessor',
      name: expert.name,
      roleTitle: expert.role,
      company: assessorCompany
    });
  };

  const handleFieldExpertLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const companyFields = INITIAL_FIELD_EXPERTS[fieldCompany] || [];
    const fe = companyFields.find((e) => e.id === fieldId) || companyFields[0];
    onSelectPortal('fieldexpert', {
      id: fe.id,
      role: 'fieldexpert',
      name: fe.name,
      roleTitle: fe.role,
      company: fieldCompany
    });
  };

  const handleReviewerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const companyReviewers = INITIAL_REVIEWERS[reviewerCompany] || [];
    const rv = companyReviewers.find((e) => e.id === reviewerId) || companyReviewers[0];
    onSelectPortal('reviewer', {
      id: rv.id,
      role: 'reviewer',
      name: rv.name,
      roleTitle: rv.role,
      company: reviewerCompany
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectPortal('admin', {
      id: 'admin',
      role: 'admin',
      name: 'مدیر سامانه'
    });
  };

  const handleFinanceLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const companyStaff = INITIAL_FINANCE_STAFF[financeCompany] || [];
    const fin = companyStaff.find((s) => s.id === financeId) || companyStaff[0] || {
      id: 'fin-d1',
      name: 'مهرداد پاکزاد',
      role: 'مدیر مالی و خزانه‌داری'
    };
    onSelectPortal('finance', {
      id: fin.id,
      role: 'finance',
      name: fin.name,
      roleTitle: fin.role,
      company: financeCompany
    });
  };

  const handleCrmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const companyStaff = INITIAL_CRM_STAFF[crmCompany] || [];
    const crm = companyStaff.find((s) => s.id === crmId) || companyStaff[0] || {
      id: 'crm-d1',
      name: 'سپیده معتمدی',
      role: 'سرپرست امور مشتریان و شکایات'
    };
    onSelectPortal('crm', {
      id: crm.id,
      role: 'crm',
      name: crm.name,
      roleTitle: crm.role,
      company: crmCompany
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

        {/* Dynamic Login Panel */}
        <div className="bg-white border-2 border-blue-900 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          {/* OPTION 1: Customer Login */}
          {mainMode === 'customer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
              {/* Features Side */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 text-xs font-bold">
                  <User className="w-4 h-4 text-blue-900" />
                  <span>پورتال زیان‌دیدگان و مقصران حادثه</span>
                </div>
                <h2 className="text-2xl font-black text-blue-950">
                  ثبت تصادف آنلاین، استعلام بیمه بدنه و پیگیری تسویه
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  مشتریان محترم می‌توانند با ورود به این بخش، تصادف جدید را به‌صورت کاملا آنلاین ثبت نمایند، اسناد را بارگذاری کنند، خسارت بیمه بدنه را پیگیری کنند و واریز وجه خسارت به شماره شبا را دنبال کنند.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                  <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                    <span className="font-extrabold text-blue-950 block mb-1">موقعیت‌یا‌بی GPS</span>
                    تعیین محل حادثه روی نقشه تعاملی
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-slate-800">
                    <span className="font-extrabold text-amber-900 block mb-1">اسکن بارکد VIN</span>
                    ثبت هوشمند کارت خودرو و بیمه‌نامه
                  </div>
                  <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200 text-slate-800">
                    <span className="font-extrabold text-sky-950 block mb-1">بیمه بدنه مستقل</span>
                    استعلام و ثبت خسارت بدنه خودرو
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-slate-800">
                    <span className="font-extrabold text-emerald-950 block mb-1">واریز به شماره شبا</span>
                    دریافت خسارت مستقیم در حساب بانکی
                  </div>
                </div>
              </div>

              {/* Form Side */}
              <div className="lg:col-span-5 bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg space-y-4">
                
                {/* Mode Selector Header: Login vs Register */}
                <div className="flex items-center bg-white p-1 rounded-xl border border-blue-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerRegistering(false);
                      setCustomerError(null);
                      setCustomerSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      !isCustomerRegistering
                        ? 'bg-blue-900 text-white shadow font-black'
                        : 'text-slate-600 hover:text-blue-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>ورود مشتری</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerRegistering(true);
                      setCustomerError(null);
                      setCustomerSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      isCustomerRegistering
                        ? 'bg-blue-900 text-white shadow font-black'
                        : 'text-slate-600 hover:text-blue-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>ثبت‌نام جدید</span>
                  </button>
                </div>

                {/* Feedback Banners */}
                {customerError && (
                  <div className="p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{customerError}</span>
                  </div>
                )}

                {customerSuccess && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{customerSuccess}</span>
                  </div>
                )}

                {/* LOGIN FORM */}
                {!isCustomerRegistering ? (
                  <form onSubmit={handleCustomerLogin} className="space-y-3.5 animate-in fade-in">
                    <div>
                      <label className="block text-xs text-blue-950 mb-1 font-bold">
                        شماره موبایل ثبت‌شده
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-blue-950 mb-1 font-bold">
                        رمز عبور
                      </label>
                      <input
                        type="password"
                        value={customerPass}
                        onChange={(e) => setCustPass(e.target.value)}
                        placeholder="••••"
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                        dir="ltr"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 mt-2 border border-blue-950"
                    >
                      <span>ورود به حساب کاربری</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="pt-2 text-center text-xs text-slate-600 border-t border-blue-200">
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
                  <form onSubmit={handleCustomerRegister} className="space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] text-blue-950 mb-1 font-bold">
                        نام و نام خانوادگی
                      </label>
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="مثال: مهدی کشاورز"
                        className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-blue-950 mb-1 font-bold">
                        شماره موبایل (جهت پیامک و پیگیری)
                      </label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="09121234567"
                        className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-blue-950 mb-1 font-bold">
                        کد ملی (۱۰ رقمی)
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        value={regNationalId}
                        onChange={(e) => setRegNationalId(e.target.value)}
                        placeholder="0012345678"
                        className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-blue-950 mb-1 font-bold">
                          رمز عبور
                        </label>
                        <input
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••"
                          className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                          dir="ltr"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-blue-950 mb-1 font-bold">
                          تکرار رمز عبور
                        </label>
                        <input
                          type="password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••"
                          className="w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-900 font-bold"
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-blue-950 font-black rounded-xl text-xs shadow-md border border-amber-300 transition-all flex items-center justify-center gap-2 active:scale-95 mt-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>تکمیل ثبت‌نام و ورود به سامانه</span>
                    </button>

                    <div className="pt-2 text-center text-xs text-slate-600 border-t border-blue-200">
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
            </div>
          )}

          {/* OPTION 2: Organizational Login (With Dropdown Menu for Roles) */}
          {mainMode === 'org' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* ORGANIZATIONAL DROPDOWN MENU SELECTOR */}
              <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-200 space-y-2">
                <label className="block text-xs font-black text-blue-950 flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-amber-500" />
                  انتخاب پنل سازمانی (منوی کشویی نقش‌ها)
                </label>

                <select
                  value={orgRole}
                  onChange={(e) => setOrgRole(e.target.value as RoleType)}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-900 rounded-xl text-sm font-black text-blue-950 focus:outline-none focus:border-amber-500 transition-all cursor-pointer shadow-md"
                >
                  <option value="insurer">شرکت بیمه‌گر (مدیریت پرونده‌ها و ارجاع خسارت)</option>
                  <option value="assessor">کارشناس ارزیابی خسارت (برآورد هوشمند و مدل ۳D)</option>
                  <option value="fieldexpert">کارشناس میدانی (بازدید صحنه و ارزیابی حضوری)</option>
                  <option value="reviewer">بازبین کیفیت و ریسک (Audit & Reviewer)</option>
                  <option value="finance">مدیریت مالی و خزانه‌داری (دستور پرداخت، حواله پایا و اسناد)</option>
                  <option value="crm">امور مشتریان، CRM و رسیدگی به شکایات (کال‌سنتر و پیگیری)</option>
                  <option value="admin">مدیر ارشد سامانه (System Administrator)</option>
                </select>
              </div>

              {/* SUB-FORM BASED ON DROPDOWN SELECTION */}
              
              {/* 1. Insurer Sub-Form */}
              {orgRole === 'insurer' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 text-xs font-bold">
                      <Building2 className="w-3.5 h-3.5 text-blue-900" />
                      <span>پورتال مدیریت پرونده‌ها و تسویه مالی شرکت بیمه</span>
                    </div>
                    <h2 className="text-2xl font-black text-blue-950">
                      مدیریت صف ادعاها، تخصیص هوشمند ارزیاب و واریز خسارت
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      اپراتوران و مدیران شرکت‌های بیمه می‌توانند پرونده‌های وارده را مشاهده کنند، جستجوی پیشرفته بر اساس پلاک/استان انجام دهند، ارزیابی‌ها را به کارشناس تحویل داده و دستور واریز بانک را صادر کنند.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                        <span className="font-extrabold text-blue-950 block mb-1">جستجوی پیشرفته و اکسل</span>
                        فیلتر پلاک، استان، شهر، تاریخ و خروجی CSV
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-slate-800">
                        <span className="font-extrabold text-emerald-950 block mb-1">صف واریز شبا</span>
                        اعتبارسنجی کد ملی، شماره شبا و صدور دستور پرداخت
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg space-y-4">
                    <div className="border-b border-blue-200 pb-3">
                      <h3 className="font-black text-base text-blue-950">ورود به پورتال بیمه‌گر</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-bold">انتخاب شرکت بیمه و کلمه عبور</p>
                    </div>

                    <form onSubmit={handleInsurerLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          شرکت بیمه‌گر
                        </label>
                        <select
                          value={insurerCompany}
                          onChange={(e) => setInsCompany(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        >
                          {INSURER_COMPANIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          رمز عبور (پیش‌فرض: ۱۲۳۴)
                        </label>
                        <input
                          type="password"
                          value={insurerPass}
                          onChange={(e) => setInsPass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                          dir="ltr"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md border border-blue-950 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                      >
                        <span>ورود به پورتال بیمه‌گر</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 2. Assessor Sub-Form */}
              {orgRole === 'assessor' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 text-xs font-bold">
                      <ClipboardCheck className="w-3.5 h-3.5 text-blue-900" />
                      <span>پنل تخصصی کارشناس ارزیابی خسارت بدنه</span>
                    </div>
                    <h2 className="text-2xl font-black text-blue-950">
                      تحلیل AI، مدل سه‌بعدی خودرو و جدول برآورد قطعات
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      کارشناسان خسارت با ورود به این پنل، پیشنهادهای هوش مصنوعی را به تفکیک قطعه تایید یا ویرایش می‌کنند، مدل سه‌بعدی آسیب بدنه را بررسی می‌کنند و برآورد قیمت قطعه و اجرت تعمیر را ثبت می‌نمایند.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                        <span className="font-extrabold text-blue-950 block mb-1">جدول تصمیم AI</span>
                        تایید/ویرایش/رد خطوط پیشنهادی هوش مصنوعی
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-slate-800">
                        <span className="font-extrabold text-amber-900 block mb-1">مدل سه‌بعدی بدنه</span>
                        مشاهده سه‌بعدی و ثبت نقاط آسیب‌دیده
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg space-y-4">
                    <div className="border-b border-blue-200 pb-3">
                      <h3 className="font-black text-base text-blue-950">ورود کارشناس ارزیابی</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-bold">انتخاب کارشناس و کلمه عبور</p>
                    </div>

                    <form onSubmit={handleAssessorLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          شرکت بیمه‌گر
                        </label>
                        <select
                          value={assessorCompany}
                          onChange={(e) => {
                            setAssessorCompany(e.target.value);
                            const exps = INITIAL_EXPERTS[e.target.value] || [];
                            if (exps.length) setAssessorId(exps[0].id);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        >
                          {INSURER_COMPANIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          انتخاب کارشناس ارزیاب
                        </label>
                        <select
                          value={assessorId}
                          onChange={(e) => setAssessorId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        >
                          {(INITIAL_EXPERTS[assessorCompany] || []).map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name} — {e.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          رمز عبور (پیش‌فرض: ۱۱۱۱)
                        </label>
                        <input
                          type="password"
                          value={assessorPass}
                          onChange={(e) => setAssessorPass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                          dir="ltr"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md border border-blue-950 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                      >
                        <span>ورود به پنل کارشناس ارزیابی</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 3. Field Expert Sub-Form */}
              {orgRole === 'fieldexpert' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 text-xs font-bold">
                      <MapPin className="w-3.5 h-3.5 text-blue-900" />
                      <span>پنل کارشناس میدانی و بازرسی حضوری</span>
                    </div>
                    <h2 className="text-2xl font-black text-blue-950">
                      بازدید حضوری صحنه و ثبت گزارش نهایی
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      در پرونده‌های فاقد کروکی یا در صورت وجود ابهام، کارشناس میدانی با حضور در محل، اصالت حادثه و میزان آسیب بدنه را ارزیابی و تایید می‌نماید.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                        <span className="font-extrabold text-blue-950 block mb-1">ارزیابی نهایی صحنه</span>
                        ثبت موقعیت مکانی دقیق و اصالت خسارت
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-slate-800">
                        <span className="font-extrabold text-amber-900 block mb-1">ثبت عکس/فیلم صحنه</span>
                        آپلود مستقیم تصاویر و گزارش میدانی
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg space-y-4">
                    <div className="border-b border-blue-200 pb-3">
                      <h3 className="font-black text-base text-blue-950">ورود کارشناس میدانی</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-bold">انتخاب کارشناس میدانی و کلمه عبور</p>
                    </div>

                    <form onSubmit={handleFieldExpertLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          شرکت بیمه‌گر
                        </label>
                        <select
                          value={fieldCompany}
                          onChange={(e) => {
                            setFieldCompany(e.target.value);
                            const list = INITIAL_FIELD_EXPERTS[e.target.value] || [];
                            if (list.length) setFieldId(list[0].id);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        >
                          {INSURER_COMPANIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          انتخاب کارشناس میدانی
                        </label>
                        <select
                          value={fieldId}
                          onChange={(e) => setFieldId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        >
                          {(INITIAL_FIELD_EXPERTS[fieldCompany] || []).map((fe) => (
                            <option key={fe.id} value={fe.id}>
                              {fe.name} — {fe.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          رمز عبور (پیش‌فرض: ۱۱۱۱)
                        </label>
                        <input
                          type="password"
                          value={fieldPass}
                          onChange={(e) => setFieldPass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                          dir="ltr"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md border border-blue-950 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                      >
                        <span>ورود به پنل میدانی</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 4. Reviewer Sub-Form */}
              {orgRole === 'reviewer' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                      <span>پنل بازبینی داخلی و کنترل کیفیت (Reviewer)</span>
                    </div>
                    <h2 className="text-2xl font-black text-blue-950">
                      بررسی انحرافات قیمتی و تایید انتشار
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      بازبینان پیش از ارسال ارزیابی برای زیان‌دیده، کیفیت داده‌ها، ریسک تقلب و تطابق خطوط برآورد را بررسی نموده و تصمیم انتشار صادر می‌کنند.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                        <span className="font-extrabold text-blue-950 block mb-1">پایش انحراف قیمتی</span>
                        بررسی برآورد نسبت به شاخص‌های مرجع
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-slate-800">
                        <span className="font-extrabold text-emerald-950 block mb-1">انتشار نتیجه</span>
                        ارسال برای زیان‌دیده جهت تایید و واریز
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg space-y-4">
                    <div className="border-b border-blue-200 pb-3">
                      <h3 className="font-black text-base text-blue-950">ورود بازبین کیفیت</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-bold">انتخاب بازبین و کلمه عبور</p>
                    </div>

                    <form onSubmit={handleReviewerLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          شرکت بیمه‌گر
                        </label>
                        <select
                          value={reviewerCompany}
                          onChange={(e) => {
                            setReviewerCompany(e.target.value);
                            const list = INITIAL_REVIEWERS[e.target.value] || [];
                            if (list.length) setReviewerId(list[0].id);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        >
                          {INSURER_COMPANIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          انتخاب بازبین
                        </label>
                        <select
                          value={reviewerId}
                          onChange={(e) => setReviewerId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                        >
                          {(INITIAL_REVIEWERS[reviewerCompany] || []).map((rv) => (
                            <option key={rv.id} value={rv.id}>
                              {rv.name} — {rv.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          رمز عبور (پیش‌فرض: ۱۱۱۱)
                        </label>
                        <input
                          type="password"
                          value={reviewerPass}
                          onChange={(e) => setReviewerPass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                          dir="ltr"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md border border-blue-950 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                      >
                        <span>ورود به پنل بازبین</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 5. Admin Sub-Form */}
              {orgRole === 'admin' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-950 border border-blue-300 text-xs font-bold">
                      <Settings className="w-3.5 h-3.5 text-blue-900" />
                      <span>پورتال مدیریت ارشد سامانه (System Administrator)</span>
                    </div>
                    <h2 className="text-2xl font-black text-blue-950">
                      پیکربندی استعلامات، افت ارزش و آستانه‌های هوش مصنوعی
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      مدیر ارشد به کلیه پرونده‌های سامانه دسترسی داشته، استعلام کروکی بیمه مرکزی را شبیه‌سازی می‌کند، جداول کسر افت ارزش خودرو را تنظیم نموده و آستانه‌های AI را مدیریت می‌نماید.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-slate-800">
                        <span className="font-extrabold text-amber-950 block mb-1">استعلام آنلاین بیمه مرکزی</span>
                        تعیین بیمه‌گر و استعلام کروکی راهور
                      </div>
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                        <span className="font-extrabold text-blue-950 block mb-1">جدول افت ارزش</span>
                        تعیین درصد افت ارزش بر اساس سال خودرو
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-blue-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg space-y-4">
                    <div className="border-b border-blue-200 pb-3">
                      <h3 className="font-black text-base text-blue-950">ورود مدیر سامانه</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-bold">نام کاربری و رمز عبور مدیر</p>
                    </div>

                    <form onSubmit={handleAdminLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          نام کاربری مدیر
                        </label>
                        <input
                          type="text"
                          value={adminUser}
                          onChange={(e) => setAdminUser(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                          dir="ltr"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          رمز عبور مدیر
                        </label>
                        <input
                          type="password"
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                          dir="ltr"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-blue-950 font-black rounded-xl text-xs shadow-md border border-amber-300 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                      >
                        <span>ورود به پنل مدیریت</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 6. Finance Manager Sub-Form */}
              {orgRole === 'finance' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 text-xs font-bold">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-800" />
                      <span>پنل تخصصی مدیریت مالی، خزانه‌داری و صدور اسناد حسابداری</span>
                    </div>
                    <h2 className="text-2xl font-black text-blue-950">
                      بررسی صف پرداخت خسارت، تولید فایل پایا و صدور سند حسابداری
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      مدیر و کارشناسان مالی شرکت بیمه در این بخش پرونده‌های تایید شده را اعتبارسنجی نموده، دستور پرداخت صادر کرده، پکیج‌های بانکی پایا/ساتنا تولید کرده و گردش خزانه‌داری را ثبت می‌نمایند.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-slate-800">
                        <span className="font-extrabold text-emerald-950 block mb-1">تولید بچ پایا / ساتنا</span>
                        خروجی استاندارد بانکی جهت تسویه شبا
                      </div>
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                        <span className="font-extrabold text-blue-950 block mb-1">سند دوبل حسابداری</span>
                        ثبت بدهکار/بستانکار خسارت و خزانه‌داری
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-emerald-50/60 p-6 rounded-2xl border-2 border-emerald-300 shadow-lg space-y-4">
                    <div className="border-b border-emerald-200 pb-3">
                      <h3 className="font-black text-base text-blue-950">ورود مدیر مالی و خزانه‌داری</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-bold">انتخاب شرکت و کارشناس مالی</p>
                    </div>

                    <form onSubmit={handleFinanceLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          شرکت بیمه‌گر
                        </label>
                        <select
                          value={financeCompany}
                          onChange={(e) => {
                            setFinanceCompany(e.target.value);
                            const list = INITIAL_FINANCE_STAFF[e.target.value] || [];
                            if (list.length > 0) setFinanceId(list[0].id);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                        >
                          {INSURER_COMPANIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          کارشناس / مدیر مالی
                        </label>
                        <select
                          value={financeId}
                          onChange={(e) => setFinanceId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                        >
                          {(INITIAL_FINANCE_STAFF[financeCompany] || []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          رمز عبور پرسنلی
                        </label>
                        <input
                          type="password"
                          value={financePass}
                          onChange={(e) => setFinancePass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                          dir="ltr"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md border border-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                      >
                        <span>ورود به پنل امور مالی و خزانه‌داری</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* 7. CRM & Customer Support Sub-Form */}
              {orgRole === 'crm' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-in fade-in">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-950 border border-purple-300 text-xs font-bold">
                      <Headphones className="w-3.5 h-3.5 text-purple-800" />
                      <span>پورتال امور مشتریان، CRM، مرکز تماس و رسیدگی به شکایات</span>
                    </div>
                    <h2 className="text-2xl font-black text-blue-950">
                      ثبت سوابق مکالمات، پیگیری تیکت‌ها و رسیدگی به شکایات رسمی
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                      کارشناسان پشتیبانی و مرکز تماس در این پنل سوابق تماس‌های ورودی/خروجی را به پرونده خسارت متصل نموده، به تیکت‌های پشتیبانی پاسخ داده، شکایات ارجاعی را پیگیری کرده و شاخص رضایت‌سنجی (CSAT) را تحلیل می‌نمایند.
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-slate-800">
                        <span className="font-extrabold text-purple-950 block mb-1">کال‌سنتر و ثبت مکالمات</span>
                        ثبت لحظه‌ای تماس با زیان‌دیده و مقصر
                      </div>
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-slate-800">
                        <span className="font-extrabold text-blue-950 block mb-1">میز شکایات بیمه مرکزی</span>
                        رسیدگی فوری به اعتراضات ارزیابی و تاخیر
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-purple-50/60 p-6 rounded-2xl border-2 border-purple-300 shadow-lg space-y-4">
                    <div className="border-b border-purple-200 pb-3">
                      <h3 className="font-black text-base text-blue-950">ورود کارشناس CRM و پشتیبانی</h3>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-bold">انتخاب شرکت و اپراتور کال‌سنتر</p>
                    </div>

                    <form onSubmit={handleCrmLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          شرکت بیمه‌گر
                        </label>
                        <select
                          value={crmCompany}
                          onChange={(e) => {
                            setCrmCompany(e.target.value);
                            const list = INITIAL_CRM_STAFF[e.target.value] || [];
                            if (list.length > 0) setCrmId(list[0].id);
                          }}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-purple-600"
                        >
                          {INSURER_COMPANIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          کارشناس پشتیبانی / CRM
                        </label>
                        <select
                          value={crmId}
                          onChange={(e) => setCrmId(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-purple-600"
                        >
                          {(INITIAL_CRM_STAFF[crmCompany] || []).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-blue-950 mb-1 font-bold">
                          رمز عبور پرسنلی
                        </label>
                        <input
                          type="password"
                          value={crmPass}
                          onChange={(e) => setCrmPass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-purple-600"
                          dir="ltr"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs shadow-md border border-purple-400 transition-all flex items-center justify-center gap-2 active:scale-95 mt-2"
                      >
                        <span>ورود به پنل امور مشتریان و CRM</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* System Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-800 pt-2">
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-extrabold text-xs text-blue-950">انطباق کامل با قوانین بیمه</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              پشتیبانی از قوانین کروکی، فرانشیز، افت ارزش و سه مرحله اعتراض.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-1.5">
            <Zap className="w-5 h-5 text-amber-600" />
            <h4 className="font-extrabold text-xs text-blue-950">پردازش هوشمند شواهد</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              شناسایی آسیب‌های بدنه، پیشنهاد قطعات و مدل‌سازی سه‌بعدی خودرو.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-1.5">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h4 className="font-extrabold text-xs text-blue-950">تسویه مستقیم به شبا</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              اعتبارسنجی کد ملی و شماره شبا و صدور دستور پرداخت آنلاین.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-1.5">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h4 className="font-extrabold text-xs text-blue-950">تفکیک شفاف وظایف</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
              سطوح دسترسی مجزا برای مشتری، بیمه‌گر، ارزیاب، میدانی، بازبین و مدیر.
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t-2 border-amber-400 bg-white py-5 text-center text-xs text-slate-700 font-bold shadow-inner">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© ۱۴۰۳ سامانه ملی ارزیابی و تسویه خسارت بیمه خودرو. تمام حقوق محفوظ است.</p>
          <p className="text-blue-900 font-black">
            سامانه هوشمند مدیریت و تسویه خسارت
          </p>
        </div>
      </footer>
    </div>
  );
};
