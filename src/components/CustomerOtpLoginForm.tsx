import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  User,
  ShieldCheck,
  Lock,
  UserPlus,
  LogIn,
  KeyRound,
  IdCard,
  Car,
  ChevronRight,
  Edit2
} from 'lucide-react';
import { UserSession } from '../types';
import {
  loadCustomersFromStorage,
  saveCustomersToStorage,
  registerCustomer,
  loadCasesFromStorage
} from '../lib/storage';

interface CustomerOtpLoginFormProps {
  onSuccess: (session: UserSession) => void;
}

export const CustomerOtpLoginForm: React.FC<CustomerOtpLoginFormProps> = ({ onSuccess }) => {
  // Login Sub-modes: 'OTP' | 'PASSWORD' | 'REGISTER'
  const [authMode, setAuthMode] = useState<'OTP' | 'PASSWORD' | 'REGISTER'>('OTP');

  // OTP Step: 'PHONE' | 'VERIFY'
  const [otpStep, setOtpStep] = useState<'PHONE' | 'VERIFY'>('PHONE');

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Unregistered user warning state for direct redirection to registration tab
  const [isUnregisteredError, setIsUnregisteredError] = useState(false);

  // OTP Verification state
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(120);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Notifications / Feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-detect existing customer details from storage / cases
  const existingCustomers = loadCustomersFromStorage();
  const allCases = loadCasesFromStorage();

  const matchedCustomer = existingCustomers.find(
    (c) => c.phone.trim() === phoneNumber.trim()
  );

  // Also check if this phone matches any case victim/culprit
  const matchedCase = !matchedCustomer
    ? allCases.find(
        (c) =>
          c.victimPhone?.trim() === phoneNumber.trim() ||
          c.culpritPhone?.trim() === phoneNumber.trim()
      )
    : null;

  const detectedName =
    matchedCustomer?.name ||
    (matchedCase?.victimPhone?.trim() === phoneNumber.trim()
      ? matchedCase.victimName
      : matchedCase?.culpritPhone?.trim() === phoneNumber.trim()
      ? matchedCase.culpritName
      : '');

  // OTP countdown timer
  useEffect(() => {
    let timer: any = null;
    if (otpStep === 'VERIFY' && countdown > 0) {
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
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpStep, countdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Quick Preset Selector
  const handleQuickPreset = (phone: string, name: string, pass: string = '1234') => {
    setPhoneNumber(phone);
    setFullName(name);
    setPassword(pass);
    setErrorMsg(null);
    setIsUnregisteredError(false);
    setSuccessMsg(null);
  };

  // Switch directly to Registration tab with pre-filled phone number
  const handleGoToRegistration = () => {
    setAuthMode('REGISTER');
    setErrorMsg(null);
    setIsUnregisteredError(false);
    setSuccessMsg('لطفاً اطلاعات خود را جهت تکمیل ثبت‌نام وارد نمایید.');
  };

  // Trigger Send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsUnregisteredError(false);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 11 || !cleanPhone.startsWith('09')) {
      setErrorMsg('لطفاً شماره تلفن همراه معتبر ۱۱ رقمی (شروع با ۰۹) وارد فرمایید.');
      return;
    }

    // Check if user is registered
    const isRegistered = existingCustomers.some((c) => c.phone.trim() === cleanPhone);

    if (!isRegistered) {
      setIsUnregisteredError(true);
      setErrorMsg('شما هنوز در سامانه ثبت‌نام نکرده‌اید! جهت استفاده از خدمات ابتدا باید ثبت‌نام فرمایید.');
      return;
    }

    // Generate random 4-digit code (e.g., 4829)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setCountdown(120);
    setCanResend(false);
    setOtpStep('VERIFY');

    setSuccessMsg(`کد تایید پیامکی (OTP) با موفقیت به شماره ${cleanPhone} ارسال شد.`);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (!canResend) return;

    const cleanPhone = phoneNumber.trim();
    const isRegistered = existingCustomers.some((c) => c.phone.trim() === cleanPhone);
    if (!isRegistered) {
      setIsUnregisteredError(true);
      setErrorMsg('شما هنوز در سامانه ثبت‌نام نکرده‌اید! لطفاً ابتدا ثبت‌نام فرمایید.');
      return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setCountdown(120);
    setCanResend(false);
    setErrorMsg(null);
    setIsUnregisteredError(false);
    setSuccessMsg(`کد تایید پیامکی جدید به شماره ${phoneNumber} ارسال شد.`);
  };

  // Verify OTP and Login Customer
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsUnregisteredError(false);

    if (enteredOtp.trim() !== generatedOtp.trim()) {
      setErrorMsg('کد پیامکی وارد شده صحیح نمی‌باشد. لطفاً مجدداً بررسی فرمایید.');
      return;
    }

    const cleanPhone = phoneNumber.trim();
    const isRegistered = existingCustomers.find((c) => c.phone.trim() === cleanPhone);

    if (!isRegistered) {
      setIsUnregisteredError(true);
      setErrorMsg('حساب کاربری با این شماره ثبت‌نام نشده است. لطفاً ابتدا در سامانه ثبت‌نام فرمایید.');
      setOtpStep('PHONE');
      return;
    }

    let finalName = isRegistered.name || fullName.trim() || detectedName || 'کاربر گرامی';
    let finalNationalId = isRegistered.nationalId || nationalId.trim() || matchedCustomer?.nationalId || '';

    setSuccessMsg('احراز هویت پیامکی با موفقیت انجام شد. در حال انتقال به پورتال...');

    setTimeout(() => {
      onSuccess({
        id: cleanPhone,
        role: 'customer',
        name: finalName,
        phone: cleanPhone,
        nationalId: finalNationalId
      });
    }, 600);
  };

  // Traditional Password Login
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsUnregisteredError(false);
    setSuccessMsg(null);

    const cleanPhone = phoneNumber.trim();
    const found = existingCustomers.find((c) => c.phone.trim() === cleanPhone);

    if (!found) {
      setIsUnregisteredError(true);
      setErrorMsg('شما هنوز در سامانه ثبت‌نام نکرده‌اید! لطفاً ابتدا اقدام به ثبت‌نام فرمایید.');
      return;
    }

    if (found.password && found.password !== password) {
      setErrorMsg('کلمه عبور وارد شده نادرست است.');
      return;
    }

    setSuccessMsg('ورود با موفقیت انجام شد. در حال انتقال...');
    setTimeout(() => {
      onSuccess({
        id: found.phone,
        role: 'customer',
        name: found.name,
        phone: found.phone,
        nationalId: found.nationalId
      });
    }, 500);
  };

  // Registration Form Handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('لطفاً نام و نام خانوادگی را وارد فرمایید.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 11) {
      setErrorMsg('لطفاً شماره موبایل معتبر (۱۱ رقمی) وارد فرمایید.');
      return;
    }
    if (!nationalId.trim() || nationalId.trim().length !== 10) {
      setErrorMsg('کد ملی باید ۱۰ رقم باشد.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    const res = registerCustomer({
      phone: phoneNumber.trim(),
      name: fullName.trim(),
      nationalId: nationalId.trim(),
      password: password,
      registeredAt: new Date().toLocaleDateString('fa-IR')
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    // After registration, directly send OTP for instant phone verification
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp('');
    setCountdown(120);
    setCanResend(false);
    setAuthMode('OTP');
    setOtpStep('VERIFY');
    setSuccessMsg('ثبت‌نام اولیه انجام شد! لطفاً کد پیامک شده را جهت تایید نهایی شماره وارد نمایید.');
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Mode Navigation Tabs (OTP & Password only) */}
      {authMode !== 'REGISTER' && (
        <div className="grid grid-cols-2 gap-1.5 md:gap-2 bg-slate-100/90 p-1 sm:p-1 md:p-1.5 rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200/80 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setAuthMode('OTP');
              setOtpStep('PHONE');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`h-8.5 sm:h-9.5 md:h-12 lg:h-13 text-[11px] sm:text-xs md:text-sm lg:text-base font-black rounded-md sm:rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 cursor-pointer active:scale-[0.98] ${
              authMode === 'OTP'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 shrink-0" />
            <span className="truncate">ورود پیامکی (OTP)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('PASSWORD');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`h-8.5 sm:h-9.5 md:h-12 lg:h-13 text-[11px] sm:text-xs md:text-sm lg:text-base font-black rounded-md sm:rounded-lg md:rounded-xl transition-all flex items-center justify-center gap-1.5 md:gap-2 cursor-pointer active:scale-[0.98] ${
              authMode === 'PASSWORD'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 shrink-0" />
            <span className="truncate">ورود با رمز عبور</span>
          </button>
        </div>
      )}

      {/* Registration Mode Header */}
      {authMode === 'REGISTER' && (
        <div className="flex items-center justify-between p-2 sm:p-2.5 md:p-3.5 bg-blue-50/80 rounded-lg sm:rounded-xl md:rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <UserPlus className="w-3.5 h-3.5 md:w-5 md:h-5" />
            </div>
            <div>
              <h3 className="text-[11px] sm:text-xs md:text-base font-black text-slate-900">ثبت‌نام جدید در سامانه</h3>
              <p className="text-[9.5px] sm:text-[10.5px] md:text-xs text-slate-500 font-medium">اطلاعات هویتی خود را وارد نمایید</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAuthMode('OTP');
              setOtpStep('PHONE');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-700 text-[11px] md:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <span>بازگشت</span>
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      )}

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-2 sm:p-2.5 md:p-3.5 bg-rose-50 border border-rose-200 rounded-lg sm:rounded-xl md:rounded-2xl text-rose-900 text-[11px] sm:text-xs md:text-sm space-y-1.5 animate-in fade-in">
          <div className="flex items-start gap-1.5 md:gap-2 font-bold">
            <AlertCircle className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>

          {isUnregisteredError && (
            <div className="pt-1.5 md:pt-2 border-t border-rose-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 md:gap-2">
              <span className="text-[10px] sm:text-[11px] md:text-xs text-rose-800 font-medium">
                شماره <strong className="font-mono" dir="ltr">{phoneNumber || 'وارد شده'}</strong> در سامانه یافت نشد.
              </span>
              <button
                type="button"
                onClick={handleGoToRegistration}
                className="w-full sm:w-auto px-2.5 py-1 md:px-3.5 md:py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg md:rounded-xl text-[10px] sm:text-[11px] md:text-xs font-black shadow-xs transition flex items-center justify-center gap-1 shrink-0 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>انتقال به بخش ثبت‌نام</span>
                <ArrowLeft className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-2 sm:p-2.5 md:p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl md:rounded-2xl text-emerald-900 text-[11px] sm:text-xs md:text-sm flex items-start gap-1.5 md:gap-2 animate-in fade-in font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: OTP FLOW */}
      {/* ========================================================================= */}
      {authMode === 'OTP' && (
        <div>
          {otpStep === 'PHONE' ? (
            /* STEP 1: Phone input */
            <form onSubmit={handleSendOtp} className="space-y-3 sm:space-y-4 md:space-y-5 animate-in fade-in">
              <div>
                <label className="block text-[11px] sm:text-xs md:text-sm lg:text-base text-slate-800 mb-1.5 md:mb-2 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5 md:gap-2">
                    <Phone className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-blue-700" />
                    <span>شماره تلفن همراه</span>
                  </span>
                  <span className="text-[9.5px] sm:text-[10px] md:text-xs text-slate-500 font-normal">
                    ارسال کد تایید ۴ رقمی
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="09121234567"
                    className="w-full h-9 sm:h-10 md:h-13 lg:h-14 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-3.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-[12px] sm:text-[13px] md:text-base lg:text-lg font-mono text-slate-900 font-bold placeholder:text-[11px] sm:placeholder:text-xs md:placeholder:text-sm lg:placeholder:text-base placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs transition"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-9 sm:h-10 md:h-13 lg:h-14 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 md:gap-2.5 active:scale-[0.98] cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
                <span>دریافت کد تایید پیامکی</span>
                <ArrowLeft className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
              </button>
            </form>
          ) : (
            /* STEP 2: Verify OTP Code */
            <form onSubmit={handleVerifyOtp} className="space-y-3 sm:space-y-4 md:space-y-5 animate-in fade-in">
              {/* Simulated SMS Notification Banner - App Push Notification Style */}
              <div className="bg-slate-900/95 text-white p-2 sm:p-2.5 md:p-3.5 rounded-lg sm:rounded-xl md:rounded-2xl shadow-xs border border-slate-700 space-y-1.5 md:space-y-2">
                <div className="flex items-center justify-between text-[11px] md:text-xs border-b border-slate-800 pb-1.5 md:pb-2">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <MessageSquare className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
                    <span>پیامک دریافتی شبیه‌سازی‌شده</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(generatedOtp)}
                    className="px-2 py-0.5 md:px-3 md:py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-md md:rounded-lg text-[10px] md:text-xs font-black shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    درج خودکار کد
                  </button>
                </div>
                <div className="text-[11px] md:text-sm text-slate-200 leading-relaxed font-mono flex items-center justify-between">
                  <span>کد تایید کاراینـشو:</span>
                  <strong className="text-amber-400 text-sm md:text-lg font-black tracking-wider bg-slate-800/80 px-2 py-0.5 rounded">{generatedOtp}</strong>
                </div>
              </div>

              {/* Number and Edit button */}
              <div className="flex items-center justify-between text-[11px] md:text-xs px-2 bg-slate-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 md:gap-2 text-slate-700 font-bold">
                  <Phone className="w-3 h-3 md:w-4 md:h-4 text-blue-700" />
                  <span className="text-[10px] md:text-xs text-slate-500">ارسال به:</span>
                  <span className="font-mono text-blue-900 font-black text-xs md:text-sm" dir="ltr">
                    {phoneNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('PHONE');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] sm:text-[11px] md:text-xs font-black text-blue-700 hover:underline flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Edit2 className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                  <span>تغییر شماره</span>
                </button>
              </div>

              {/* Input for OTP */}
              <div>
                <label className="block text-[11px] sm:text-xs md:text-sm lg:text-base text-slate-800 mb-1.5 font-bold text-center">
                  کد تایید ۴ رقمی پیامک‌شده را وارد نمایید:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full krn-otp-input h-10 sm:h-11 md:h-14 lg:h-16 bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg sm:rounded-xl md:rounded-2xl text-center text-sm sm:text-base md:text-2xl lg:text-3xl font-mono tracking-[0.25em] sm:tracking-[0.35em] md:tracking-[0.5em] text-slate-900 font-bold shadow-2xs transition"
                  dir="ltr"
                  autoFocus
                  required
                />
              </div>

              {/* Timer and Resend */}
              <div className="flex items-center justify-between text-[11px] md:text-xs pt-0.5 px-0.5">
                <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px] sm:text-[11px] md:text-xs">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                  <span>{formatTime(countdown)} تا انقضا</span>
                </div>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[10px] sm:text-[11px] md:text-xs font-black text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
                    <span>ارسال مجدد پیامک</span>
                  </button>
                ) : (
                  <span className="text-[9.5px] sm:text-[10px] md:text-xs text-slate-400 font-medium">
                    ارسال مجدد پس از پایان تایمر
                  </span>
                )}
              </div>

              {/* Submit Verification Button */}
              <button
                type="submit"
                className="w-full h-9 sm:h-10 md:h-13 lg:h-14 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
                <span>تایید کد و ورود به سامانه</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FIXED PASSWORD LOGIN */}
      {/* ========================================================================= */}
      {authMode === 'PASSWORD' && (
        <form onSubmit={handlePasswordLogin} className="space-y-3 sm:space-y-4 md:space-y-5 animate-in fade-in">
          <div>
            <label className="block text-[11px] sm:text-xs md:text-sm lg:text-base text-slate-800 mb-1.5 md:mb-2 font-bold flex items-center gap-1.5 md:gap-2">
              <Phone className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-blue-700" />
              <span>شماره تلفن همراه</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09121112233"
              className="w-full h-9 sm:h-10 md:h-13 lg:h-14 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-3.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-[12px] sm:text-[13px] md:text-base lg:text-lg font-mono text-slate-900 font-bold placeholder:text-[11px] sm:placeholder:text-xs md:placeholder:text-sm lg:placeholder:text-base placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs md:text-sm lg:text-base text-slate-800 mb-1.5 md:mb-2 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5 md:gap-2">
                <KeyRound className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 text-blue-700" />
                <span>کلمه عبور</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('OTP');
                  setOtpStep('PHONE');
                }}
                className="text-[10px] sm:text-[11px] md:text-xs text-blue-700 font-bold hover:underline cursor-pointer"
              >
                ورود با کد پیامکی (OTP)
              </button>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className="w-full h-9 sm:h-10 md:h-13 lg:h-14 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-3.5 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-[12px] sm:text-[13px] md:text-base lg:text-lg font-mono text-slate-900 font-bold placeholder:text-[11px] sm:placeholder:text-xs md:placeholder:text-sm lg:placeholder:text-base placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full h-9 sm:h-10 md:h-13 lg:h-14 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <span>ورود به حساب کاربری</span>
            <ArrowLeft className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: FULL REGISTRATION */}
      {/* ========================================================================= */}
      {authMode === 'REGISTER' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4 animate-in fade-in">
          <div>
            <label className="block text-[10.5px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
              نام و نام خانوادگی
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علی احمدی"
              className="w-full h-8.5 sm:h-9.5 md:h-12 lg:h-13 px-3 md:px-4 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm lg:text-base text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
              required
            />
          </div>

          <div>
            <label className="block text-[10.5px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
              شماره موبایل
            </label>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09121234567"
              className="w-full h-8.5 sm:h-9.5 md:h-12 lg:h-13 px-3 md:px-4 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm lg:text-base font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-[10.5px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
              کد ملی (۱۰ رقم)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
              placeholder="0012345678"
              className="w-full h-8.5 sm:h-9.5 md:h-12 lg:h-13 px-3 md:px-4 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm lg:text-base font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
              dir="ltr"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <div>
              <label className="block text-[10.5px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                رمز عبور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full h-8.5 sm:h-9.5 md:h-12 lg:h-13 px-3 md:px-4 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm lg:text-base font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-[10.5px] sm:text-xs md:text-sm text-slate-800 mb-1 font-bold">
                تکرار رمز عبور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••"
                className="w-full h-8.5 sm:h-9.5 md:h-12 lg:h-13 px-3 md:px-4 bg-white border border-slate-300 rounded-lg sm:rounded-xl md:rounded-2xl text-xs md:text-sm lg:text-base font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-600 shadow-2xs"
                dir="ltr"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-9 sm:h-10 md:h-13 lg:h-14 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer mt-1 md:mt-2"
          >
            <span>ثبت‌نام و دریافت پیامک تایید (OTP)</span>
            <ArrowLeft className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM REGISTRATION / LOGIN SWITCH */}
      {/* ========================================================================= */}
      {authMode !== 'REGISTER' ? (
        <div className="pt-2 sm:pt-2.5 md:pt-4 border-t border-slate-200/80 text-center">
          <p className="text-[11px] sm:text-xs md:text-sm lg:text-base text-slate-600 font-medium flex items-center justify-center gap-1.5 md:gap-2">
            <span>هنوز ثبت‌نام نکرده‌اید؟</span>
            <button
              type="button"
              onClick={() => {
                setAuthMode('REGISTER');
                setErrorMsg(null);
                setIsUnregisteredError(false);
                setSuccessMsg(null);
              }}
              className="font-black text-blue-700 hover:text-blue-800 hover:underline cursor-pointer transition inline-flex items-center gap-1 md:gap-1.5"
            >
              <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
              <span>ثبت‌نام آنلاین در سامانه</span>
            </button>
          </p>
        </div>
      ) : (
        <div className="pt-2 sm:pt-2.5 md:pt-4 border-t border-slate-200/80 text-center">
          <p className="text-[11px] sm:text-xs md:text-sm lg:text-base text-slate-600 font-medium flex items-center justify-center gap-1.5 md:gap-2">
            <span>قبلاً ثبت‌نام کرده‌اید؟</span>
            <button
              type="button"
              onClick={() => {
                setAuthMode('OTP');
                setOtpStep('PHONE');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="font-black text-blue-700 hover:text-blue-800 hover:underline cursor-pointer transition inline-flex items-center gap-1 md:gap-1.5"
            >
              <LogIn className="w-3 h-3 md:w-4 md:h-4" />
              <span>ورود به حساب کاربری</span>
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
