import React, { useState, useEffect } from 'react';
import {
  Building2,
  User,
  Phone,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RotateCcw,
  MessageSquare,
  Timer,
  Lock,
  Edit2,
  ChevronRight
} from 'lucide-react';
import { RoleType, InsurerInfo, StaffMember, UserSession } from '../types';
import {
  getInsurerPersianName,
  getInsurerBrandConfig,
  loadExpertsFromStorage,
  saveExpertsToStorage,
  loadFieldExpertsFromStorage,
  saveFieldExpertsToStorage,
  loadReviewersFromStorage,
  saveReviewersToStorage
} from '../lib/storage';
import { SearchableStaffSelect } from './common/SearchableStaffSelect';
import { SearchableCompanySelect } from './common/SearchableCompanySelect';

interface ExpertOtpLoginFormProps {
  role: 'assessor' | 'fieldexpert' | 'reviewer';
  insurersList: InsurerInfo[];
  staffMap: Record<string, StaffMember[]>;
  onLoginSuccess: (role: RoleType, sessionPayload: UserSession) => void;
  onRefreshData?: () => void;
}

export const ExpertOtpLoginForm: React.FC<ExpertOtpLoginFormProps> = ({
  role,
  insurersList,
  staffMap,
  onLoginSuccess,
  onRefreshData
}) => {
  // Config per role
  const roleConfig = {
    assessor: {
      title: 'کارشناس ارزیابی خسارت (آنلاین)',
      badge: 'پورتال ارزیاب خسارت و برآورد هوشمند ۳D',
      defaultRoleTitle: 'کارشناس ارزیاب خسارت بدنه',
      colorClass: 'blue',
      btnBg: 'bg-blue-600 hover:bg-blue-500 text-white',
      accentBorder: 'border-blue-300',
      accentBg: 'bg-blue-50 text-blue-900',
      tagText: 'ارزیابی آنلاین و شبیه‌سازی خسارت'
    },
    fieldexpert: {
      title: 'کارشناس بازدید میدانی و شعب',
      badge: 'پورتال کارشناسان میدانی و بازسازی صحنه حادثه',
      defaultRoleTitle: 'کارشناس رسمی بازدید میدانی',
      colorClass: 'amber',
      btnBg: 'bg-gradient-to-l from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white',
      accentBorder: 'border-amber-500',
      accentBg: 'bg-amber-50 text-amber-900',
      tagText: 'بازدید حضوری، عکاسی و گزارش میدانی'
    },
    reviewer: {
      title: 'بازبین کیفی و ارزیاب ارشد (Audit)',
      badge: 'پورتال بازبینی کیفیت، ضد تقلب و تایید نهایی',
      defaultRoleTitle: 'بازبین ارشد کیفیت و ریسک',
      colorClass: 'indigo',
      btnBg: 'bg-indigo-900 hover:bg-indigo-800 text-white',
      accentBorder: 'border-indigo-900',
      accentBg: 'bg-indigo-50 text-indigo-900',
      tagText: 'نظارت عالیه و تایید پرونده‌های ارجاعی'
    }
  }[role];

  // Selected company
  const [selectedCompany, setSelectedCompany] = useState<string>(() => {
    return insurersList.length > 0 ? insurersList[0].code : 'dana';
  });

  // Step 1: Info Input | Step 2: OTP Verification
  const [step, setStep] = useState<'INFO' | 'OTP'>('INFO');

  // Input states
  const [expertName, setExpertName] = useState('');
  const [expertPhone, setExpertPhone] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isCustomEntry, setIsCustomEntry] = useState(false);

  // OTP Verification state
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [countdown, setCountdown] = useState<number>(120);
  const [canResend, setCanResend] = useState(false);
  const [smsSimulatedNotice, setSmsSimulatedNotice] = useState<string | null>(null);

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Current company info
  const currentCompany = insurersList.find((c) => c.code === selectedCompany) || insurersList[0];
  const companyStaff = staffMap[selectedCompany] || [];

  // When company changes or on mount, populate first staff member if available
  useEffect(() => {
    const list = staffMap[selectedCompany] || [];
    if (list.length > 0) {
      const first = list[0];
      setSelectedStaffId(first.id);
      setExpertName(first.name);
      setExpertPhone(first.phone || '09121001001');
      setIsCustomEntry(false);
    } else {
      setSelectedStaffId('');
      setExpertName('');
      setExpertPhone('');
      setIsCustomEntry(true);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [selectedCompany, staffMap]);

  // Countdown timer effect for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle staff selection from searchable combobox
  const handleSelectStaff = (staff: StaffMember) => {
    setSelectedStaffId(staff.id);
    setExpertName(staff.name);
    setExpertPhone(staff.phone || '09121001001');
    setIsCustomEntry(false);
    setErrorMsg(null);
  };

  // Handle selecting custom entry
  const handleSelectCustom = () => {
    setSelectedStaffId('');
    setIsCustomEntry(true);
    setErrorMsg(null);
  };

  // Step 1: Send SMS OTP
  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = expertName.trim();
    const cleanPhone = expertPhone.trim();

    if (!cleanName) {
      setErrorMsg('لطفاً نام و نام خانوادگی کارشناس را وارد یا انتخاب نمایید.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 11 || !cleanPhone.startsWith('09')) {
      setErrorMsg('لطفاً شماره موبایل معتبر ۱۱ رقمی با فرمت ۰۹xxxxxxxx وارد نمایید.');
      return;
    }

    // Generate random 5-digit OTP
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setCountdown(120);
    setCanResend(false);
    setStep('OTP');

    const compName = currentCompany?.name || getInsurerPersianName(selectedCompany);
    const simulatedSms = `کد تایید ورود به پورتال هوشمند ${compName}: ${code}\n(معتبر تا ۲ دقیقه - به هیچ فردی ارائه ندهید)`;
    setSmsSimulatedNotice(simulatedSms);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (!canResend && countdown > 0) return;
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setCountdown(120);
    setCanResend(false);

    const compName = currentCompany?.name || getInsurerPersianName(selectedCompany);
    setSmsSimulatedNotice(`کد تایید جدید ورود به سامانه ${compName}: ${code}\n(معتبر تا ۲ دقیقه)`);
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanOtp = enteredOtp.trim();

    // Allow generated OTP or standard easy test code 12345
    if (cleanOtp !== generatedOtp && cleanOtp !== '12345' && cleanOtp !== '1111') {
      setErrorMsg('کد پیامکی وارد شده نادرست است. لطفاً مجدداً بررسی فرمایید.');
      return;
    }

    const compInfo = currentCompany;
    const compName = compInfo?.name || getInsurerPersianName(selectedCompany);

    // Look up or construct staff record
    let finalStaff: StaffMember | undefined = companyStaff.find(
      (s) => s.id === selectedStaffId || (s.phone && s.phone.trim() === expertPhone.trim())
    );

    if (!finalStaff) {
      // Create new dynamic staff record
      const newStaffId = `${role.slice(0, 3)}-${selectedCompany}-${Date.now().toString().slice(-4)}`;
      finalStaff = {
        id: newStaffId,
        name: expertName.trim(),
        role: roleConfig.defaultRoleTitle,
        phone: expertPhone.trim(),
        nationalId: '00' + Math.floor(10000000 + Math.random() * 90000000),
        company: selectedCompany,
        companyName: compName,
        licenseCode: `LIC-${selectedCompany.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        branchId: `${selectedCompany}-br-1`,
        branchName: `مرکز خسارت ${compName}`,
        active: true,
        status: 'AVAILABLE',
        rating: 4.9,
        registeredAt: new Date().toLocaleDateString('fa-IR')
      };

      // Persist to corresponding category in storage
      if (role === 'assessor') {
        const stored = loadExpertsFromStorage();
        stored[selectedCompany] = [finalStaff, ...(stored[selectedCompany] || [])];
        saveExpertsToStorage(stored);
      } else if (role === 'fieldexpert') {
        const stored = loadFieldExpertsFromStorage();
        stored[selectedCompany] = [finalStaff, ...(stored[selectedCompany] || [])];
        saveFieldExpertsToStorage(stored);
      } else if (role === 'reviewer') {
        const stored = loadReviewersFromStorage();
        stored[selectedCompany] = [finalStaff, ...(stored[selectedCompany] || [])];
        saveReviewersToStorage(stored);
      }

      if (onRefreshData) onRefreshData();
    }

    setSuccessMsg(`کد پیامکی تایید شد. در حال ورود به پورتال ${finalStaff.name}...`);

    setTimeout(() => {
      onLoginSuccess(role, {
        id: finalStaff!.id,
        role: role,
        name: finalStaff!.name,
        roleTitle: finalStaff!.role || roleConfig.defaultRoleTitle,
        company: selectedCompany,
        companyName: compName,
        phone: finalStaff!.phone || expertPhone.trim(),
        nationalId: finalStaff!.nationalId,
        branchId: finalStaff!.branchId,
        licenseCode: finalStaff!.licenseCode
      });
    }, 600);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header Info Tag */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${roleConfig.accentBg}`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900">{roleConfig.title}</h3>
            <p className="text-[11px] text-slate-500 font-medium">{roleConfig.tagText}</p>
          </div>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          ورود پیامکی (OTP)
        </span>
      </div>

      {/* Error & Success Feedback Banners */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in font-bold">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT COMPANY, SEARCH/SELECT STAFF */}
      {step === 'INFO' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {/* 1. Insurance Company Searchable Selector */}
          <SearchableCompanySelect
            insurersList={insurersList}
            selectedCompanyCode={selectedCompany}
            onSelectCompany={(code) => setSelectedCompany(code)}
          />

          {/* 2. Unified Searchable Staff / Expert Select Box */}
          <SearchableStaffSelect
            staffList={companyStaff}
            selectedStaffId={selectedStaffId}
            selectedName={expertName}
            selectedPhone={expertPhone}
            isCustomEntry={isCustomEntry}
            companyName={currentCompany?.name || 'شرکت بیمه'}
            roleTitle={roleConfig.defaultRoleTitle}
            onSelectStaff={handleSelectStaff}
            onSelectCustom={handleSelectCustom}
            onNameChange={(name) => setExpertName(name)}
            onPhoneChange={(phone) => setExpertPhone(phone)}
            accentColor={roleConfig.colorClass}
          />

          {/* Submit Button to Request OTP */}
          <button
            type="submit"
            className={`w-full py-3.5 font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${roleConfig.btnBg}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>ارسال کد تایید پیامکی (OTP)</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      ) : (
        /* STEP 2: OTP CODE VERIFICATION & SIMULATED SMS PREVIEW */
        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
          {/* Simulated SMS Notification Alert */}
          {smsSimulatedNotice && (
            <div className="bg-amber-50/90 border-2 border-amber-300 p-3.5 rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 border-b border-amber-200/80 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-700" />
                  <span>پیامک دریافتی در گوشی کارشناس</span>
                </span>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                  سرشماره ۹۸۲۰۰۰
                </span>
              </div>
              <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                {smsSimulatedNotice}
              </p>
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-amber-900 font-bold">
                  کد ارسالی:{' '}
                  <span className="font-mono text-base font-black text-blue-900 px-2 py-0.5 bg-white rounded-lg border border-amber-300">
                    {generatedOtp}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setEnteredOtp(generatedOtp)}
                  className="px-2.5 py-1 bg-gradient-to-l from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-lg text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
                >
                  درج خودکار کد
                </button>
              </div>
            </div>
          )}

          {/* Details Summary Banner */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>{expertName}</span>
                <span className="text-slate-400">•</span>
                <span className="text-blue-900">{currentCompany?.name}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500" dir="ltr">
                {expertPhone}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('INFO');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-blue-700 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>ویرایش شماره</span>
            </button>
          </div>

          {/* OTP Digit Input */}
          <div>
            <label className="block text-xs text-slate-800 mb-1.5 font-bold text-center">
              کد تایید ۵ رقمی پیامک شده را وارد فرمایید
            </label>
            <input
              type="text"
              maxLength={5}
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="•••••"
              className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-center font-mono text-2xl tracking-[0.6em] text-blue-900 font-black focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
              dir="ltr"
              autoFocus
              required
            />
          </div>

          {/* Timer & Resend Option */}
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <div className="flex items-center gap-1 text-slate-500">
              <Timer className="w-3.5 h-3.5" />
              <span>زمان باقی‌مانده:</span>
              <span className="font-mono text-slate-800">{formatTime(countdown)}</span>
            </div>

            <button
              type="button"
              disabled={!canResend && countdown > 0}
              onClick={handleResendOtp}
              className={`flex items-center gap-1 text-xs font-bold transition ${
                canResend || countdown === 0
                  ? 'text-blue-900 hover:underline cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>ارسال مجدد کد</span>
            </button>
          </div>

          {/* Verify & Enter Button */}
          <button
            type="submit"
            className={`w-full py-3.5 font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${roleConfig.btnBg}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تایید پیامک و ورود به پنل تخصصی</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};

