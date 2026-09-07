import React, { useState } from 'react';
import { Building2, FileText, Upload, CheckCircle2, AlertCircle, X, ArrowRight, ArrowLeft, ShieldCheck, Phone, Mail, User, MapPin, Lock, FileCheck, Send, Eye, Trash2, Sparkles, Lightbulb } from 'lucide-react';
import { submitCompanyRegistrationRequest } from '../lib/storage';

interface CompanyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
}

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Company Info
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [economicCode, setEconomicCode] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [sanhabCode, setSanhabCode] = useState('');
  const [insuranceLines, setInsuranceLines] = useState<string[]>(['بیمه شخص ثالث خودرو', 'بیمه بدنه خودرو']);
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [address, setAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  const toggleInsuranceLine = (line: string) => {
    if (insuranceLines.includes(line)) {
      setInsuranceLines(insuranceLines.filter((item) => item !== line));
    } else {
      setInsuranceLines([...insuranceLines, line]);
    }
  };

  // Step 2: Senior Admin Info
  const [adminName, setAdminName] = useState('');
  const [adminNationalId, setAdminNationalId] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Step 3: Documents Upload
  const [gazetteFileName, setGazetteFileName] = useState<string | null>(null);
  const [gazetteFileUrl, setGazetteFileUrl] = useState<string | null>(null);

  const [introFileName, setIntroFileName] = useState<string | null>(null);
  const [introFileUrl, setIntroFileUrl] = useState<string | null>(null);

  const [licenseFileName, setLicenseFileName] = useState<string | null>(null);
  const [licenseFileUrl, setLicenseFileUrl] = useState<string | null>(null);

  // States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'gazette' | 'intro' | 'license'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (type === 'gazette') {
        setGazetteFileName(file.name);
        setGazetteFileUrl(url);
      } else if (type === 'intro') {
        setIntroFileName(file.name);
        setIntroFileUrl(url);
      } else if (type === 'license') {
        setLicenseFileName(file.name);
        setLicenseFileUrl(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!companyName.trim() || !economicCode.trim() || !registrationNumber.trim() || !companyPhone.trim() || !sanhabCode.trim()) {
      setErrorMsg('لطفاً فیلدهای الزامی مشخصات شرکت (نام، شناسه اقتصادی، شماره ثبت، تلفن و کد اختصاصی سنهاب) را تکمیل نمایید.');
      return;
    }
    if (insuranceLines.length === 0) {
      setErrorMsg('لطفاً حداقل یک رشته بیمه‌ای مجاز (بیمه شخص ثالث یا بیمه بدنه خودرو) را انتخاب فرمایید.');
      return;
    }
    // Auto-generate code if empty
    if (!companyCode.trim()) {
      const generated = 'ins-' + Math.random().toString(36).substring(2, 6);
      setCompanyCode(generated);
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!adminName.trim() || !adminNationalId.trim() || !adminPhone.trim() || !adminEmail.trim()) {
      setErrorMsg('لطفاً کلیه مشخصات مدیر ارشد متقاضی (نام، کد ملی، شماره همراه و ایمیل) را تکمیل فرمایید.');
      return;
    }
    if (adminNationalId.trim().length !== 10) {
      setErrorMsg('کد ملی مدیر ارشد باید دقیقاً ۱۰ رقمی باشد.');
      return;
    }
    setStep(3);
  };

  const handleSubmitFinal = () => {
    setErrorMsg(null);
    if (!gazetteFileName && !introFileName) {
      setErrorMsg('لطفاً حداقل آگهی روزنامه رسمی یا معرفی‌نامه سازمانی مدیر ارشد را بارگذاری نمایید.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = submitCompanyRegistrationRequest({
        companyName: companyName.trim(),
        companyCode: (companyCode || 'ins-' + Math.random().toString(36).substring(2, 6)).toLowerCase().trim(),
        economicCode: economicCode.trim(),
        registrationNumber: registrationNumber.trim(),
        licenseNumber: licenseNumber.trim() || `LIC-${registrationNumber}-1403`,
        sanhabCode: sanhabCode.trim(),
        insuranceLines: insuranceLines,
        province,
        city,
        address: address.trim() || 'دفتر مرکزی شرکت',
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim(),
        adminName: adminName.trim(),
        adminNationalId: adminNationalId.trim(),
        adminPhone: adminPhone.trim(),
        adminEmail: adminEmail.trim(),
        officialGazetteFile: gazetteFileUrl || undefined,
        officialGazetteFileName: gazetteFileName || undefined,
        introLetterFile: introFileUrl || undefined,
        introLetterFileName: introFileName || undefined,
        licenseDocFile: licenseFileUrl || undefined,
        licenseDocFileName: licenseFileName || undefined
      });

      setIsSubmitting(false);
      if (result.success) {
        setSubmittedId(result.requestId);
        if (onSuccess) onSuccess(result.requestId);
      } else {
        setErrorMsg(result.message);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto" dir="rtl">
      <div className="bg-white border-2 border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 font-sans">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-blue-900 flex items-center gap-2">
                ثبت‌نام و درخواست پنل شرکت بیمه
                <span className="text-xs bg-blue-100 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                  سطح ۲: مدیر ارشد شرکت (Company Admin)
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                فرآیند احراز هویت حقوقی، معرفی مدیر ارشد و بارگذاری مجوزهای بیمه مرکزی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Indicator */}
        {!submittedId && (
          <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                  step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                ۱
              </div>
              <span className={step === 1 ? 'text-blue-900 font-black' : 'text-slate-600 font-medium'}>
                اطلاعات ثبتی شرکت
              </span>
            </div>
            <div className="w-12 h-0.5 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                  step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                ۲
              </div>
              <span className={step === 2 ? 'text-blue-900 font-black' : 'text-slate-600 font-medium'}>
                مشخصات مدیر ارشد
              </span>
            </div>
            <div className="w-12 h-0.5 bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                  step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                }`}
              >
                ۳
              </div>
              <span className={step === 3 ? 'text-blue-900 font-black' : 'text-slate-600 font-medium'}>
                بارگذاری مستندات
              </span>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {submittedId ? (
            /* Success View */
            <div className="py-8 px-4 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-700 mb-4 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-black text-blue-900 mb-2">درخواست ثبت‌نام با موفقیت ثبت شد</h3>
              <p className="text-sm text-slate-600 max-w-lg mb-6 leading-relaxed font-medium">
                اطلاعات و مدارک شرکت «<span className="text-blue-900 font-black">{companyName}</span>» با شماره پیگیری{' '}
                <span className="text-blue-900 font-mono font-black bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">{submittedId}</span> جهت تایید به کارتابل{' '}
                <span className="text-blue-900 font-bold">مدیر کل سامانه (Super Admin)</span> ارسال گردید.
              </p>

              <div className="w-full max-w-md bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-right text-xs space-y-2 mb-6">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>نام مدیر ارشد:</span>
                  <span className="text-slate-900 font-bold">{adminName}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>کد ملی مدیر ارشد:</span>
                  <span className="text-slate-900 font-mono font-bold">{adminNationalId}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>شماره تماس سازمانی:</span>
                  <span className="text-slate-900 font-mono font-bold">{adminPhone}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>کد شرکت در سنهاب:</span>
                  <span className="text-blue-900 font-mono font-black bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{sanhabCode}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>رشته‌های بیمه‌ای مجاز:</span>
                  <span className="text-slate-900 font-bold">{insuranceLines.join(' • ')}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200 font-medium">
                  <span>وضعیت فعلی:</span>
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    در انتظار بررسی مدیر کل سامانه
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 mb-6 max-w-lg text-right font-medium">
                <Lightbulb className="w-4 h-4 inline-block align-middle text-blue-700" /> <span className="font-bold">نکته برای تست و ارزیابی:</span> شما می‌توانید همین حالا وارد پرتال «مدیر کل سامانه» (Super Admin) شوید، در تب «درخواست‌های ثبت شرکت» این درخواست را تایید فرمایید تا حساب مدیر ارشد بلافاصله فعال شود.
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-black transition-colors cursor-pointer shadow-sm"
              >
                متوجه شدم و بستن پنجره
              </button>
            </div>
          ) : step === 1 ? (
            /* Step 1 Form */
            <form onSubmit={handleNextStep1} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    نام کامل شرکت بیمه <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: بیمه سرمد / بیمه نوین"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    شناسه لاتین / شناسه شرکت <span className="text-slate-500 font-normal">(اختیاری)</span>
                  </label>
                  <input
                    type="text"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value)}
                    placeholder="مثال: sarmad / novin"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 text-left font-mono placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    شناسه ملی / کد اقتصادی <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={economicCode}
                    onChange={(e) => setEconomicCode(e.target.value)}
                    placeholder="مثال: 411492019482"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono text-left placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    شماره ثبت شرکت <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="مثال: 44819"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono text-left placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    کد اختصاصی در سنهاب <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={sanhabCode}
                    onChange={(e) => setSanhabCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="مثال: 26 یا 4 یا 1"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-black focus:outline-none focus:border-blue-500 font-mono text-left placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    شماره پروانه بیمه مرکزی
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="مثال: LIC-1392-SRM"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono text-left placeholder-slate-400"
                  />
                </div>
              </div>

              {/* یادداشت راهنمای سنهاب */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-black text-blue-900">کد اختصاصی شرکت بیمه در سنهاب (کد شرکت): </span>
                  بیمه مرکزی به هر شرکت بیمه یک کد اختصاصی یک تا دو رقمی می‌دهد (مثلاً بیمه ایران ۱، بیمه آسیا ۲، بیمه دانا ۴، بیمه سرمد ۲۶، بیمه کوثر ۲۴، بیمه ما ۲۳ و...). ثبت این کد جهت اتصال وب‌سرویس‌های استعلام و ثبت خسارت سنهاب اجباری است.
                </div>
              </div>

              {/* انتخاب رشته‌های بیمه‌ای مجاز */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-900">
                    انتخاب رشته‌های بیمه‌ای مجاز جهت فعالیت در پلتفرم <span className="text-rose-600">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    (حداقل یک مورد باید انتخاب شود)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => toggleInsuranceLine('بیمه شخص ثالث خودرو')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition select-none flex items-start gap-3 ${
                      insuranceLines.includes('بیمه شخص ثالث خودرو')
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={insuranceLines.includes('بیمه شخص ثالث خودرو')}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-900">بیمه شخص ثالث خودرو</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5 font-medium">
                        ارزیابی و پرداخت آنلاین خسارت مالی وارده به شخص ثالث زیان‌دیده (با کروکی و بدون کروکی)
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => toggleInsuranceLine('بیمه بدنه خودرو')}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition select-none flex items-start gap-3 ${
                      insuranceLines.includes('بیمه بدنه خودرو')
                        ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={insuranceLines.includes('بیمه بدنه خودرو')}
                      onChange={() => {}}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none"
                    />
                    <div>
                      <div className="text-xs font-black text-slate-900">بیمه بدنه خودرو</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5 font-medium">
                        تشکیل پرونده، کارشناسی آنلاین و پرداخت خسارت بدنه خودروی بیمه‌گذار (با اعمال فرانشیز و استهلاک)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    تلفن تماس دفتر مرکزی <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="۰۲۱-۴۳۹۷۵۰۰۰"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono text-left placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ایمیل رسمی شرکت
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="info@company.ir"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 text-left font-mono placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">استان</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="تهران">تهران</option>
                    <option value="اصفهان">اصفهان</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                    <option value="فارس">فارس</option>
                    <option value="آذربایجان شرقی">آذربایجان شرقی</option>
                    <option value="البرز">البرز</option>
                    <option value="خوزستان">خوزستان</option>
                    <option value="سایر استان‌ها">سایر استان‌ها</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    آدرس دفتر مرکزی
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="تهران، خیابان ولیعصر، تقاطع ..."
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <span>مرحله بعد: مشخصات مدیر ارشد</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : step === 2 ? (
            /* Step 2 Form */
            <form onSubmit={handleNextStep2} className="space-y-4">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 font-medium">
                <span className="font-black text-blue-900">توجه:</span> مدیر ارشد معرفی‌شده پس از تایید مدیر کل پلتفرم، با «کد ملی» و «شماره همراه» ثبت شده در این بخش به عنوان مدیر شرکت وارد پنل شده و اختیار تعریف کارشناسان خسارت را خواهد داشت.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    نام و نام خانوادگی مدیر ارشد / نماینده رسمی <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="مثال: دکتر علیرضا رضایی"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    کد ملی مدیر ارشد (۱۰ رقم) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={adminNationalId}
                    onChange={(e) => setAdminNationalId(e.target.value)}
                    placeholder="0012345678"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono text-left placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    شماره تلفن همراه سازمانی مدیر ارشد <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="09121112233"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 font-mono text-left placeholder-slate-400"
                  />
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-950 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-black text-amber-900">تطابق کد ملی و شماره همراه (الزام سامانه شاهکار): </span>
                      شماره همراه باید حتماً به نام شخص مدیر ارشد (صاحب کد ملی ثبت شده در این فرم) باشد؛ زیرا در فرآیند احراز هویت و تطابق هویت در سامانه شاهکار به این شماره پیامک اعتبارسنجی ارسال خواهد شد و در صورت عدم تطابق با خطا مواجه خواهید شد.
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    ایمیل سازمانی مدیر ارشد <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@company.ir"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500 text-left font-mono placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <ArrowRight className="w-4 h-4" />
                  مرحله قبل
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <span>مرحله بعد: بارگذاری مدارک</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* Step 3 Form - Documents */
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 font-medium">
                لطفاً تصویر یا فایل PDF روزنامه رسمی، معرفی‌نامه مدیر ارشد و پروانه فعالیت بیمه مرکزی را بارگذاری فرمایید.
              </div>

              {/* Upload Item 1: Gazette */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-900">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      روزنامه رسمی یا آگهی تأسیس / آخرین تغییرات شرکت <span className="text-rose-600">*</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {gazetteFileName ? (
                        <span className="text-emerald-700 font-mono font-bold">{gazetteFileName}</span>
                      ) : (
                        'فرمت‌های مجاز: PDF, JPG, PNG'
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="cursor-pointer px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border-2 border-slate-200">
                    <Upload className="w-3.5 h-3.5 text-blue-900" />
                    {gazetteFileName ? 'تغییر فایل' : 'انتخاب فایل'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'gazette')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Upload Item 2: Intro Letter */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-900">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      معرفی‌نامه رسمی و حکم انتصاب مدیر ارشد / نماینده حقوقی
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {introFileName ? (
                        <span className="text-emerald-700 font-mono font-bold">{introFileName}</span>
                      ) : (
                        'حاوی امضا و مهر مدیرعامل / هیئت مدیره شرکت'
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="cursor-pointer px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border-2 border-slate-200">
                    <Upload className="w-3.5 h-3.5 text-blue-900" />
                    {introFileName ? 'تغییر فایل' : 'انتخاب فایل'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'intro')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Upload Item 3: License */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      تصویر پروانه فعالیت بیمه مرکزی جمهوری اسلامی ایران
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {licenseFileName ? (
                        <span className="text-emerald-700 font-mono font-bold">{licenseFileName}</span>
                      ) : (
                        'پروانه معتبر در رشته بیمه اتومبیل (ثالث و بدنه)'
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="cursor-pointer px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border-2 border-slate-200">
                    <Upload className="w-3.5 h-3.5 text-amber-800" />
                    {licenseFileName ? 'تغییر فایل' : 'انتخاب فایل'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, 'license')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                >
                  <ArrowRight className="w-4 h-4" />
                  مرحله قبل
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitFinal}
                  className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    'در حال ثبت درخواست...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ارسال نهایی درخواست ثبت شرکت</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
