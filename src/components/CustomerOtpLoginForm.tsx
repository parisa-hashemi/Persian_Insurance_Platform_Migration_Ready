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
    <div className="space-y-4">
      {/* Mode Navigation Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setAuthMode('OTP');
            setOtpStep('PHONE');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'OTP'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:text-blue-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>ورود پیامکی (OTP)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode('PASSWORD');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'PASSWORD'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:text-blue-900'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>ورود با رمز عبور</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode('REGISTER');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'REGISTER'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:text-blue-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>ثبت‌نام جدید</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl text-rose-900 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-start gap-2 font-black">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>

          {isUnregisteredError && (
            <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-rose-800 font-medium">
                شماره <strong className="font-mono" dir="ltr">{phoneNumber || 'وارد شده'}</strong> در سامانه یافت نشد.
              </span>
              <button
                type="button"
                onClick={handleGoToRegistration}
                className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>انتقال به بخش ثبت‌نام</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
            <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs text-slate-800 mb-1.5 font-bold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-900" />
                  <span>شماره تلفن همراه (جهت دریافت کد پیامکی)</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="مثال: 09121234567"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-2xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-50 shadow-sm transition"
                  dir="ltr"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>ارسال کد تایید پیامکی (OTP)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Quick Demo Pre-fill */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500">حساب‌های تستی آماده:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPreset('09121112233', 'رضا صادقی (زیان‌دیده)')
                    }
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-right transition group cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-slate-800 group-hover:text-blue-900">
                      رضا صادقی
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                      09121112233 (زیان‌دیده)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickPreset('09128881122', 'مهرداد کاظمی (مقصر)')
                    }
                    className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-right transition group cursor-pointer"
                  >
                    <div className="text-[11px] font-black text-slate-800 group-hover:text-blue-900">
                      مهرداد کاظمی
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                      09128881122 (مقصر)
                    </div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: Verify OTP Code */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              {/* Simulated SMS Notification Banner */}
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <MessageSquare className="w-4 h-4" />
                    <span>پیامک دریافتی شبیه‌سازی‌شده:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnteredOtp(generatedOtp)}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-lg text-xs font-black shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    درج خودکار کد
                  </button>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed font-mono">
                  کد ورود شما به سامانه خسارت بیمه: <strong className="text-amber-400 text-sm font-black">{generatedOtp}</strong>
                </div>
              </div>

              {/* Number and Edit button */}
              <div className="flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                  <Phone className="w-3.5 h-3.5 text-blue-900" />
                  <span>ارسال شده به:</span>
                  <span className="font-mono text-blue-950 font-black" dir="ltr">
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
                  className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>ویرایش شماره</span>
                </button>
              </div>

              {/* Input for OTP */}
              <div>
                <label className="block text-xs text-slate-800 mb-1.5 font-bold">
                  کد تایید ۴ رقمی پیامک‌شده را وارد فرمایید:
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full py-3.5 bg-white border-2 border-slate-300 focus:border-blue-900 focus:ring-4 focus:ring-blue-50 rounded-2xl text-center text-2xl font-mono tracking-[0.5em] text-slate-900 font-black shadow-sm"
                  dir="ltr"
                  autoFocus
                  required
                />
              </div>

              {/* Timer and Resend */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(countdown)} تا انقضای کد</span>
                </div>

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ارسال مجدد پیامک</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    ارسال مجدد پس از پایان تایمر
                  </span>
                )}
              </div>

              {/* Submit Verification Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تایید کد پیامکی و ورود به سامانه</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FIXED PASSWORD LOGIN */}
      {/* ========================================================================= */}
      {authMode === 'PASSWORD' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4 animate-in fade-in">
          <div>
            <label className="block text-xs text-slate-800 mb-1.5 font-bold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-900" />
              <span>شماره تلفن همراه</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09121112233"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-800 mb-1.5 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-900" />
                <span>کلمه عبور</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('OTP');
                  setOtpStep('PHONE');
                }}
                className="text-[11px] text-blue-900 font-bold hover:underline cursor-pointer"
              >
                ورود بدون رمز با OTP
              </button>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
              dir="ltr"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>ورود به حساب کاربری</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: FULL REGISTRATION */}
      {/* ========================================================================= */}
      {authMode === 'REGISTER' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3 animate-in fade-in">
          <div>
            <label className="block text-xs text-slate-800 mb-1 font-bold">
              نام و نام خانوادگی
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علی احمدی"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-800 mb-1 font-bold">
              شماره موبایل
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09121234567"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-800 mb-1 font-bold">
              کد ملی (۱۰ رقم)
            </label>
            <input
              type="text"
              maxLength={10}
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
              placeholder="0012345678"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
                dir="ltr"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer mt-2"
          >
            <span>ثبت‌نام و دریافت پیامک تایید (OTP)</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
