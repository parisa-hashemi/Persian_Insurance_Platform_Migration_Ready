import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldPlus,
  Car,
  Camera,
  Video,
  Mic,
  Square,
  Play,
  Pause,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  ArrowLeft,
  Trash2,
  Sparkles,
  Building2,
  Check,
  Send,
  Volume2,
  Calendar,
  AlertTriangle,
  Info,
  Phone,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ClaimCase, UserSession, MediaFile } from '../../types';
import { compressImageFile } from '../../lib/imageCompressor';
import { queryBodyPolicyByNationalId, BodyPolicyRecord, findBestMatchingBranch } from '../../data/bodyInsuranceData';

interface BodilyInsuranceModuleProps {
  session: UserSession;
  cases: ClaimCase[];
  onSubmitBodily: (newCase: ClaimCase) => void;
  onBack: () => void;
  onOpenCaseDetail?: (caseId: string) => void;
}

export const BodilyInsuranceModule: React.FC<BodilyInsuranceModuleProps> = ({
  session,
  cases,
  onSubmitBodily,
  onBack,
  onOpenCaseDetail
}) => {
  const [viewState, setViewState] = useState<'list' | 'create_step1' | 'create_step2' | 'success'>('list');

  // National ID and inquiry state
  const [nationalId, setNationalId] = useState(session.nationalId || '0012345678');
  const [inquiredPolicy, setInquiredPolicy] = useState<BodyPolicyRecord | null>(null);
  const [isInquiring, setIsInquiring] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Form Fields
  const [ownerName, setOwnerName] = useState(session.name || 'مهدی کشاورز');
  const [ownerPhone, setOwnerPhone] = useState(session.phone || '09123456789');
  const [damageType, setDamageType] = useState('تصادف تک‌وسیله (برخورد با مانع / جدول / گاردریل)');
  const [incidentDate, setIncidentDate] = useState('۱۴۰۳/۰۵/۲۲');
  const [incidentTime, setIncidentTime] = useState('۱۴:۳۰');
  const [province, setProvince] = useState('تهران');
  const [city, setCity] = useState('تهران');
  const [address, setAddress] = useState('تهران، بزرگراه شهید همت، تقاطع ستاری، نرسیده به خروجی جنت‌آباد');
  const [incidentDescription, setIncidentDescription] = useState(
    'در حال رانندگی در لاین سرعت بودم که به دلیل لغزندگی معبر، کنترل خودرو از دست خارج شده و قسمت جلو و گلگیر سمت راست به گاردریل برخورد کرد. رادیاتور و سپر جلو آسیب شدید دیده است.'
  );

  // Multimedia state
  const [photos, setPhotos] = useState<MediaFile[]>([
    {
      name: 'عکس زاویه جلو و سپر آسیب‌دیده',
      type: 'image',
      dataUrl: 'https://images.unsplash.com/photo-1590362891988-306565785084?w=600&auto=format&fit=crop&q=80',
      fileName: 'front_damage_photo.jpg'
    },
    {
      name: 'عکس گلگیر راست و چراغ جلو',
      type: 'image',
      dataUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
      fileName: 'fender_damage.jpg'
    }
  ]);
  const [customPhotoLabel, setCustomPhotoLabel] = useState('');

  // Video State
  const [videoFile, setVideoFile] = useState<MediaFile | null>({
    name: 'ویدیوی ۳۰ ثانیه‌ای بازبینی دور خودرو و آسیب‌های بدنه',
    type: 'video',
    dataUrl: 'https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-highway-at-night-42284-large.mp4',
    fileName: 'vehicle_damage_walkaround.mp4'
  });

  // Audio Recording / Upload State
  const [audioFile, setAudioFile] = useState<MediaFile | null>({
    name: 'صوت توضیحات مالک در خصوص نحوه سانحه و قطعات آسیب‌دیده',
    type: 'audio',
    dataUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    fileName: 'driver_explanation_voice.mp3'
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Last submitted case result
  const [createdCase, setCreatedCase] = useState<ClaimCase | null>(null);

  // Strict Body claims filter - exclude third party liability (شخص ثالث)
  const bodilyCases = cases.filter((c) => {
    // Exclude third party liability cases
    if (c.id?.startsWith('CF-') && !c.isBodyClaim && !c.isBodily) {
      return false;
    }
    // Must be marked as body claim or have BD- prefix or body insurance metadata
    const isBody = Boolean(c.isBodily || c.isBodyClaim || c.id?.startsWith('BD-') || c.bodyInsuranceInfo);
    if (!isBody) return false;

    // If logged in as a customer, only show cases belonging to this customer
    if (session?.role === 'customer' && session.phone) {
      const matchPhone = c.victimPhone === session.phone || c.culpritPhone === session.phone || c.bodyInsuranceInfo?.nationalId === session.nationalId;
      const matchName = session.name && (c.victimName?.includes(session.name) || c.culpritName?.includes(session.name));
      const matchNationalId = session.nationalId && (c.victimNationalId === session.nationalId || c.bodyInsuranceInfo?.nationalId === session.nationalId);
      if (!matchPhone && !matchName && !matchNationalId) {
        return false;
      }
    }
    return true;
  });

  // Auto-inquire on load if nationalId is present
  useEffect(() => {
    if (nationalId && nationalId.length >= 8) {
      handleInquirePolicy(nationalId);
    }
  }, []);

  // Handle Sanhab Body Policy Inquiry
  const handleInquirePolicy = (idToQuery: string) => {
    setIsInquiring(true);
    setInquiryError(null);

    setTimeout(() => {
      try {
        const policy = queryBodyPolicyByNationalId(idToQuery);
        setInquiredPolicy(policy);
        setOwnerName(policy.ownerName || session.name || 'مهدی کشاورز');
        setOwnerPhone(policy.phone || session.phone || '09123456789');
      } catch (err) {
        setInquiryError('خطا در برقراری ارتباط با سامانه سنهاب بیمه مرکزی.');
      } finally {
        setIsInquiring(false);
      }
    }, 500);
  };

  // Audio recording simulation
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    // Create recorded voice note
    const recordedAudio: MediaFile = {
      name: `صوت ضبط شده مالک (${recordingSeconds} ثانیه)`,
      type: 'audio',
      dataUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      fileName: `voice_note_${Date.now()}.mp3`
    };
    setAudioFile(recordedAudio);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await compressImageFile(file, 1000, 0.7);
      if (type === 'image') {
        setPhotos((prev) => [
          ...prev,
          {
            name: customPhotoLabel || file.name,
            type: 'image',
            dataUrl: url,
            fileName: file.name
          }
        ]);
        setCustomPhotoLabel('');
      } else if (type === 'video') {
        setVideoFile({
          name: file.name,
          type: 'video',
          dataUrl: url,
          fileName: file.name
        });
      } else if (type === 'audio') {
        setAudioFile({
          name: file.name,
          type: 'audio',
          dataUrl: url,
          fileName: file.name
        });
      }
    }
  };

  // Handle Form Submission
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiredPolicy) return;

    const trackingCode = 'BD-1403-' + Math.floor(Math.random() * 9000 + 1000);
    const incidentDateTimeStr = `${incidentDate} ${incidentTime}`;

    // Combine all media files
    const allFiles: MediaFile[] = [...photos];
    if (videoFile) allFiles.push(videoFile);
    if (audioFile) allFiles.push(audioFile);

    // Recommend branch
    const branchMatch = findBestMatchingBranch(inquiredPolicy.insurerCode, address, city);

    const newClaimCase: ClaimCase = {
      id: trackingCode,
      isBodily: true,
      isBodyClaim: true,
      date: incidentDateTimeStr,
      address: address,
      victimName: ownerName,
      victimPhone: ownerPhone,
      victimPlate: inquiredPolicy.plate,
      plate: inquiredPolicy.plate,
      carType: inquiredPolicy.carModel,
      carModel: inquiredPolicy.carModel,
      victimVin: inquiredPolicy.carVin,
      victimNationalId: nationalId,
      victimInsurer: inquiredPolicy.insurerCode,
      culpritName: ownerName,
      culpritPhone: ownerPhone,
      culpritPlate: inquiredPolicy.plate,
      culpritInsurer: inquiredPolicy.insurerCode,
      culpritPolicyNo: inquiredPolicy.policyNo,
      bodyInsuranceInfo: {
        policyNo: inquiredPolicy.policyNo,
        insurerCode: inquiredPolicy.insurerCode,
        insurerName: inquiredPolicy.insurerName,
        nationalId: nationalId,
        carModel: inquiredPolicy.carModel,
        plate: inquiredPolicy.plate,
        coverageCeiling: inquiredPolicy.coverageCeiling,
        discountPercent: inquiredPolicy.discountPercent,
        franchisePercent: inquiredPolicy.franchisePercent,
        expireDate: inquiredPolicy.expireDate,
        autoSanhabMatched: true,
        damageType: damageType
      },
      assignedBranch: {
        branchId: branchMatch.bestBranch.id,
        name: branchMatch.bestBranch.name,
        address: branchMatch.bestBranch.address,
        phone: branchMatch.bestBranch.phone,
        distance: 'نزدیک‌ترین شعبه با توجه به آدرس حادثه',
        city: branchMatch.bestBranch.city,
        managerName: branchMatch.bestBranch.managerName
      },
      status: 'ارجاع شده به شرکت بیمه',
      priority: 'normal',
      approved: true,
      writtenReport: incidentDescription,
      files: allFiles,
      audioExplanation: audioFile,
      videoExplanation: videoFile,
      customerKrokiPhoto: allFiles.find(f => f.name?.includes('کروکی') || f.fileName?.includes('kroki'))?.dataUrl || undefined,
      additionalDocs: [
        ...allFiles.map((f, idx) => ({
          id: `bodily-doc-${idx}-${Date.now()}`,
          title: f.name || f.fileName || `سند بدنه ${idx + 1}`,
          docType: f.type === 'audio' ? 'توضیحات صوتی' : f.type === 'video' ? 'ویدیو صحنه و آسیب بدنه' : (f.name || 'مدرک بیمه بدنه'),
          dataUrl: f.dataUrl,
          url: f.dataUrl,
          uploadedBy: ownerName || 'بیمه‌گذار بدنه',
          uploaderRole: 'بیمه‌گذار بدنه',
          uploaderParty: 'PARTY_ONE' as const,
          uploadedAt: new Date().toLocaleDateString('fa-IR'),
          fileType: f.type as any,
          fileName: f.fileName,
          visibility: 'SHARED' as const
        }))
      ],
      createdAt: new Date().toISOString(),
      history: [
        {
          status: 'ارجاع شده به شرکت بیمه',
          time: new Date().toLocaleString('fa-IR'),
          user: ownerName,
          userRole: 'بیمه‌گذار بدنه',
          note: `ثبت خودخدمت خسارت بیمه بدنه خودرو و ارجاع برخط به شرکت ${inquiredPolicy.insurerName} با توجه به کد ملی (${nationalId}).`
        }
      ]
    };

    onSubmitBodily(newClaimCase);
    setCreatedCase(newClaimCase);
    setViewState('success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in" dir="rtl">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-900 text-amber-300 flex items-center justify-center font-bold shadow-md">
            <ShieldPlus className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-blue-950">پورتال خسارت بیمه بدنه خودرو</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-950 border border-sky-300">
                مستقل از شخص ثالث
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              استعلام هوشمند با کدملی، بارگذاری چندرسانه‌ای و ارجاع مستقیم به شرکت بیمه‌گر بدنه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewState === 'list' ? (
            <>
              <button
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>بازگشت به داشبورد</span>
              </button>
              <button
                onClick={() => setViewState('create_step1')}
                className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-black shadow-md border border-blue-950 transition-all flex items-center gap-2 active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>ثبت اعلام خسارت بدنه جدید</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setViewState('list')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>مشاهده پرونده‌های بدنه</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW STATE 1: CLAIMS LIST */}
      {viewState === 'list' && (
        <div className="space-y-6">
          {/* Quick Guide Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-3xl shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-amber-400 font-bold">
                ۱
              </div>
              <h3 className="font-extrabold text-sm text-amber-300">استعلام خودکار با کد ملی</h3>
              <p className="text-[11px] text-blue-100 leading-relaxed font-medium">
                سیستم با دریافت کد ملی، شرکت بیمه‌گر بدنه و سقف تعهدات شما را فوراً از سنهاب فراخوانی می‌کند.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 p-5 rounded-3xl shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-900 flex items-center justify-center font-bold">
                ۲
              </div>
              <h3 className="font-extrabold text-sm text-blue-950">مستندسازی چندرسانه‌ای</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                عکس، ویدیو و فایل صوتی توضیحات راننده را بدون نیاز به حضور فیزیکی اولیه در سیستم بارگذاری کنید.
              </p>
            </div>

            <div className="bg-white border-2 border-slate-200 p-5 rounded-3xl shadow-sm space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                ۳
              </div>
              <h3 className="font-extrabold text-sm text-emerald-950">ارجاع به نزدیک‌ترین شعبه و کارشناس</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                شرکت بیمه پرونده را به کارشناس میدانی و نزدیک‌ترین مرکز خسارت تخصصی به آدرس شما ارجاع می‌دهد.
              </p>
            </div>
          </div>

          {/* List of Previous Body Claims */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-900" />
                <h2 className="font-black text-blue-950 text-base">
                  پرونده‌های خسارت بدنه من ({bodilyCases.length})
                </h2>
              </div>

              <button
                onClick={() => setViewState('create_step1')}
                className="text-xs font-black text-blue-900 hover:text-blue-700 flex items-center gap-1"
              >
                <span>+ ثبت خسارت جدید</span>
              </button>
            </div>

            {bodilyCases.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShieldPlus className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">تاکنون پرونده خسارت بدنه ثبت نکرده‌اید</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  در صورت بروز حادثه، واژگونی، برخورد با مانع یا آسیب به خودرو، می‌توانید با زدن دکمه زیر پرونده جدید بدنه ثبت کنید.
                </p>
                <button
                  onClick={() => setViewState('create_step1')}
                  className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-black text-xs shadow-md mt-2 active:scale-95"
                >
                  ثبت اولین اعلام خسارت بدنه
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bodilyCases.map((c) => {
                  const insurerName =
                    c.bodyInsuranceInfo?.insurerName ||
                    (c.victimInsurer === 'dana' ? 'بیمه دانا' : c.victimInsurer === 'iran' ? 'بیمه ایران' : 'شرکت بیمه‌گر بدنه');

                  const isFieldCompleted = Boolean(
                    c.fieldExpertVerdict ||
                    c.fieldExpertFinal ||
                    c.status?.includes('میدانی') ||
                    (c.assessment && c.assessment.payable)
                  );

                  const payableAmt = c.assessment?.payable;

                  return (
                    <div
                      key={c.id}
                      onClick={() => onOpenCaseDetail && onOpenCaseDetail(c.id)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer space-y-3 relative group shadow-xs ${
                        isFieldCompleted && c.status !== 'پرداخت شده' && c.status !== 'در انتظار پرداخت'
                          ? 'border-blue-900 bg-blue-50/40 hover:bg-blue-50/70 shadow-sm ring-1 ring-blue-900/20'
                          : 'border-slate-200 hover:border-blue-900 bg-slate-50/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-blue-950 font-mono text-sm">{c.id}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-950 text-[10px] font-black">
                              {insurerName}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-800 block mt-1">
                            {c.carType || c.carModel || 'خودروی سواری'}
                          </span>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${
                          c.status === 'پرداخت شده'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : c.status === 'در انتظار پرداخت'
                            ? 'bg-sky-100 text-sky-950 border-sky-300'
                            : isFieldCompleted
                            ? 'bg-blue-900 text-amber-300 border-blue-950 shadow-xs animate-pulse'
                            : 'bg-amber-100 text-amber-950 border-amber-300'
                        }`}>
                          {isFieldCompleted && c.status !== 'پرداخت شده' && c.status !== 'در انتظار پرداخت'
                            ? 'آماده تایید و ثبت شبا'
                            : c.status}
                        </span>
                      </div>

                      {/* Field expert completion alert banner */}
                      {isFieldCompleted && c.status !== 'پرداخت شده' && (
                        <div className="p-2.5 rounded-xl bg-blue-900 text-white text-[11px] font-bold flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>
                              {c.status === 'در انتظار پرداخت'
                                ? 'اطلاعات بانکی ثبت شد • در کارتابل مدیر مالی'
                                : 'کارشناسی میدانی انجام شد • تایید نظر و ورود شبا'}
                            </span>
                          </div>
                          {payableAmt && (
                            <span className="font-mono text-amber-300 font-black">
                              {payableAmt.toLocaleString('fa-IR')} ریال
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span>پلاک انتظامی:</span>
                          <span className="font-bold text-slate-900 font-mono">{c.plate || c.victimPlate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>تاریخ و زمان حادثه:</span>
                          <span className="font-medium text-slate-700">{c.date}</span>
                        </div>
                        {c.assignedBranch && (
                          <div className="flex items-center justify-between text-indigo-900 font-bold">
                            <span>شعبه ارجاعی:</span>
                            <span className="truncate max-w-[200px]">{c.assignedBranch.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 text-xs font-black text-blue-900 group-hover:text-blue-700">
                        <span>مشاهده جزئیات و گردش کار</span>
                        <ArrowLeft className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW STATE 2: STEP 1 - INQUIRY & ACCIDENT INFO */}
      {viewState === 'create_step1' && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-blue-900">مرحله ۱ از ۲</span>
                <h2 className="text-lg font-black text-blue-950 mt-0.5">
                  استعلام هوشمند بیمه‌نامه بدنه و اطلاعات حادثه
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 font-black text-xs border border-blue-200">
                گام نخست: استعلام کدملی
              </span>
            </div>

            {/* National ID Inquiry Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-blue-200 space-y-3">
              <label className="block text-xs font-black text-blue-950">
                کد ملی مالک / بیمه‌گذار جهت استعلام برخط سنهاب:
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="کد ملی ۱۰ رقمی (مثلاً ۰۰۱۲۳۴۵۶۷۸)"
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                    dir="ltr"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleInquirePolicy(nationalId)}
                  disabled={isInquiring || !nationalId.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isInquiring ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>در حال استعلام سنهاب...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>استعلام بیمه‌نامه بدنه</span>
                    </>
                  )}
                </button>
              </div>

              {inquiryError && (
                <p className="text-xs text-rose-700 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {inquiryError}
                </p>
              )}
            </div>

            {/* Inquiry Result Card */}
            {inquiredPolicy && (
              <div className="bg-emerald-50/70 border-2 border-emerald-300 p-5 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-emerald-950 block">
                        بیمه‌نامه بدنه فعال یافت شد: {inquiredPolicy.insurerName}
                      </span>
                      <span className="text-[11px] text-emerald-800 font-bold font-mono">
                        شماره بیمه‌نامه: {inquiredPolicy.policyNo}
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-950 font-black text-xs">
                    استعلام معتبر از سنهاب
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">نام بیمه‌گذار:</span>
                    <span className="font-black text-slate-900 mt-0.5 block">{inquiredPolicy.ownerName}</span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">مدل خودرو:</span>
                    <span className="font-black text-slate-900 mt-0.5 block">{inquiredPolicy.carModel}</span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">پلاک انتظامی:</span>
                    <span className="font-black text-slate-900 font-mono mt-0.5 block">{inquiredPolicy.plate}</span>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">سقف پوشش بدنه:</span>
                    <span className="font-black text-emerald-900 font-mono mt-0.5 block">
                      {((inquiredPolicy.coverageCeiling || 0) / 1000000).toLocaleString('fa-IR')} میلیون تومان
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-xl">
                  <span>تخفیف عدم خسارت: {inquiredPolicy.discountPercent}٪</span>
                  <span>فرانشیز خسارت اول: {inquiredPolicy.franchisePercent}٪</span>
                  <span>اعتبار بیمه‌نامه تا: {inquiredPolicy.expireDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Accident Details Form */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="font-black text-blue-950 text-base pb-2 border-b border-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-900" />
              <span>مشخصات و شرایط سانحه خسارت بدنه</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  نوع سانحه / علت خسارت بدنه <span className="text-rose-600">*</span>
                </label>
                <select
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                >
                  <option value="تصادف تک‌وسیله (برخورد با مانع / جدول / گاردریل)">
                    تصادف تک‌وسیله (برخورد با مانع / جدول / گاردریل)
                  </option>
                  <option value="برخورد با خودروی دیگر (بدون کروکی یا خودروی متواری)">
                    برخورد با خودروی دیگر (بدون کروکی یا خودروی متواری)
                  </option>
                  <option value="واژگونی و سقوط خودرو">واژگونی و سقوط خودرو</option>
                  <option value="سرقت کلی یا جزئی قطعات (رینگ، لاستیک، سیستم صوتی، کامپیوتر)">
                    سرقت کلی یا جزئی قطعات (رینگ، لاستیک، سیستم صوتی، کامپیوتر)
                  </option>
                  <option value="آتش‌سوزی، صاعقه یا انفجار">آتش‌سوزی، صاعقه یا انفجار</option>
                  <option value="شکست شیشه مستقل از حادثه">شکست شیشه مستقل از حادثه</option>
                  <option value="بلایای طبیعی (سیل، زلزله، طوفان)">بلایای طبیعی (سیل، زلزله، طوفان)</option>
                  <option value="سایر خسارات بدنه">سایر خسارات بدنه</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    تاریخ حادثه <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    ساعت حادثه <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>
            </div>

            {/* Location & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">استان محل حادثه / خودرو</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">شهر محل خودرو</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  آدرس دقیق محل حادثه یا پارکینگ خودرو (جهت تعیین نزدیک‌ترین شعبه و کارشناس میدانی){' '}
                  <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثلاً: تهران، بزرگراه ستاری، خروجی جنت‌آباد، خیابان مخبری، پلاک ۲۰..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>
            </div>

            {/* Written Report */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                شرح کتبی سانحه و قطعات آسیب‌دیده <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="توضیح دهید حادثه چطور اتفاق افتاد و کدام قطعات (کاپوت، گلگیر، شاسی، چراغ و...) صدمه دیده‌اند..."
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setViewState('list')}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => setViewState('create_step2')}
                disabled={!inquiredPolicy || !address.trim() || !incidentDescription.trim()}
                className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs shadow-md border border-blue-950 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span>مرحله بعد: بارگذاری عکس، ویدیو و ضبط صوت</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW STATE 3: STEP 2 - MULTIMEDIA UPLOAD & AUDIO RECORDING */}
      {viewState === 'create_step2' && inquiredPolicy && (
        <form onSubmit={handleFinalSubmit} className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black text-blue-900">مرحله ۲ از ۲</span>
                <h2 className="text-lg font-black text-blue-950 mt-0.5">
                  مستندات چندرسانه‌ای: عکس، ویدیو و فایل صوتی
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 font-black text-xs border border-blue-200">
                گام دوم: بارگذاری مدارک
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              ارسال مدارک کامل تصویری و ضبط توضیحات صوتی باعث سرعت‌بخشی به تصمیم‌گیری بیمه‌گر و ارجاع دقیق به کارشناس میدانی می‌گردد.
            </p>
          </div>

          {/* SECTION 1: PHOTOS (عکس‌ها) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-900" />
                <h3 className="font-black text-blue-950 text-sm">
                  عکس‌های خسارت و زوایای خودرو ({photos.length} تصویر)
                </h3>
              </div>

              <label className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95">
                <Upload className="w-4 h-4" />
                <span>افزودن عکس جدید</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((ph, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden border-2 border-slate-200 group bg-slate-100">
                  <img
                    src={ph.dataUrl}
                    alt={ph.name}
                    className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-2.5 flex flex-col justify-between">
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="self-end w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-white truncate">{ph.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: VIDEO (ویدیو) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-900" />
                <h3 className="font-black text-blue-950 text-sm">
                  ویدیوی ۳۰ ثانیه‌ای دور خودرو و جزئیات ضربه
                </h3>
              </div>

              <label className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                <span>{videoFile ? 'تغییر فایل ویدیو' : 'بارگذاری ویدیو'}</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                />
              </label>
            </div>

            {videoFile ? (
              <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/30 text-rose-400 flex items-center justify-center font-bold">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">{videoFile.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{videoFile.fileName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                    آماده ارسال
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="p-2 text-rose-400 hover:text-rose-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center text-slate-500 space-y-2">
                <Video className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-bold">ویدیویی بارگذاری نشده است (اختیاری اما بسیار موثر در تسریع ارزیابی)</p>
              </div>
            )}
          </div>

          {/* SECTION 3: VOICE NOTE (صوت و ضبط صدای راننده) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-900" />
                <h3 className="font-black text-blue-950 text-sm">
                  ضبط یا بارگذاری صوت توضیحات راننده (Voice Note)
                </h3>
              </div>

              <label className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>آپلود فایل صوتی</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'audio')}
                  className="hidden"
                />
              </label>
            </div>

            {/* Audio Recorder Controls */}
            <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <span className="font-black text-xs text-blue-950 block">
                    توضیح صوتی نحوه تصادف و صدای غیرعادی موتور یا جلوبندی
                  </span>
                  <p className="text-[11px] text-slate-600 font-medium">
                    با فشردن دکمه ضبط، می‌توانید به مدت ۱ الی ۲ دقیقه توضیحات خود را بیان فرمایید.
                  </p>
                </div>

                {/* Record Button */}
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md flex items-center gap-2 active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      <span>شروع ضبط صدا</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md flex items-center gap-2 animate-pulse"
                    >
                      <Square className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>توقف ضبط ({recordingSeconds} ثانیه)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Recorded Audio Player Preview */}
              {audioFile && (
                <div className="bg-white p-4 rounded-xl border border-blue-200 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-900 text-amber-300 flex items-center justify-center font-bold">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-blue-950 block">{audioFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{audioFile.fileName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <audio
                      ref={audioPlayerRef}
                      src={audioFile.dataUrl}
                      controls
                      className="h-9 max-w-[240px] sm:max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setAudioFile(null)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="حذف صوت"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submission Notice & Action */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-black text-sm text-amber-300">
                  ارجاع خودکار به شرکت بیمه‌گر بدنه ({inquiredPolicy.insurerName})
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1">
                  پس از فشردن دکمه ثبت نهایی، پرونده به همراه مدارک، صوت و ویدیو مستقیماً در کارتابل «ادعای بدنه» شرکت{' '}
                  {inquiredPolicy.insurerName} قرار خواهد گرفت. مسئول بیمه با توجه به آدرس وارد شده شما، نزدیک‌ترین شعبه و کارشناس میدانی را جهت بازدید و ارزیابی حضوری تعیین خواهد نمود.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setViewState('create_step1')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                بازگشت به مرحله قبل
              </button>

              <button
                type="submit"
                className="px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>ثبت نهایی و ارجاع به شرکت بیمه بدنه</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW STATE 4: SUCCESS CONFIRMATION MODAL / VIEW */}
      {viewState === 'success' && createdCase && (
        <div className="bg-white rounded-3xl border-2 border-emerald-300 p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-4 border-emerald-300 shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-blue-950">
              درخواست خسارت بدنه شما با موفقیت ثبت و ارجاع گردید!
            </h2>
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-950 font-black text-sm font-mono border border-blue-300">
              کد رهگیری پرونده: {createdCase.id}
            </div>
          </div>

          {/* Routing Notification Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 max-w-xl mx-auto text-right space-y-3">
            <div className="flex items-center gap-2 text-blue-950 font-black text-xs">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>نتیجه ارجاع هوشمند پرونده:</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              با توجه به کد ملی <strong className="font-mono">{createdCase.victimNationalId}</strong> و استعلام سنهاب، این پرونده مستقیماً به{' '}
              <strong>شرکت {createdCase.bodyInsuranceInfo?.insurerName || 'بیمه دانا'}</strong> ارجاع گردید و در بخش «ادعای بدنه» کارتابل بیمه‌گر ثبت شد.
            </p>

            {createdCase.assignedBranch && (
              <div className="bg-white p-3 rounded-xl border border-blue-200 text-xs text-slate-800 space-y-1">
                <span className="font-black text-indigo-950 block">مرکز ارزیابی و شعبه پیشنهادی سیستم:</span>
                <span className="text-[11px] text-slate-600 block">{createdCase.assignedBranch.name}</span>
                <span className="text-[10px] text-slate-500 block">{createdCase.assignedBranch.address}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenCaseDetail && onOpenCaseDetail(createdCase.id)}
              className="px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs shadow-md flex items-center gap-2 active:scale-95"
            >
              <span>مشاهده و پیگیری زنده پرونده</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewState('list')}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              بازگشت به لیست پرونده‌های بدنه
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
