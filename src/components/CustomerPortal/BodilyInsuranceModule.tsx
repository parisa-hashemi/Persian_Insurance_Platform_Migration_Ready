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
  Zap,
  CreditCard,
  FileCheck,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { ClaimCase, UserSession, MediaFile } from '../../types';
import { compressImageFile } from '../../lib/imageCompressor';
import { queryBodyPolicyByNationalId, BodyPolicyRecord, findBestMatchingBranch } from '../../data/bodyInsuranceData';
import {
  evaluateBodyInsuranceCroquiRequirement,
  BODY_CROQUI_CONDITIONS,
  NO_CROQUI_CEILING_TOMAN,
  NO_CROQUI_CEILING_LABEL
} from '../../lib/accidentRules';
import { sampleCroquis } from '../../data/mockData';

export interface BodyAccidentTypeItem {
  key: string;
  label: string;
  shortDesc: string;
  category: 'collision' | 'standalone' | 'security' | 'natural';
  badge: string;
  requiresPoliceCroqui: boolean;
  requiresOfficialReport: boolean;
  officialAuthorityLabel?: string;
}

export const BODY_ACCIDENT_TYPES_LIST: BodyAccidentTypeItem[] = [
  {
    key: 'FIXED_OBJECT',
    label: 'برخورد با جسم یا مانع ثابت',
    shortDesc: 'گاردریل، جدول، درخت، تیر برق، دیوار، ستون پارکینگ',
    category: 'collision',
    badge: 'خسارت اول زیر ۷۰ میلیون: بدون کروکی',
    requiresPoliceCroqui: false,
    requiresOfficialReport: false
  },
  {
    key: 'ROLLOVER',
    label: 'واژگونی، چپ‌کردن یا سقوط خودرو',
    shortDesc: 'خسارت شدید به اتاق، سقف، ستون‌ها و شاسی خودرو',
    category: 'collision',
    badge: 'کروکی راهور الزامی است',
    requiresPoliceCroqui: true,
    requiresOfficialReport: false
  },
  {
    key: 'TWO_VEHICLE',
    label: 'تصادف با خودروی دیگر (خسارت راننده مقصر)',
    shortDesc: 'استفاده از پوشش بدنه برای جبران خسارت خودروی خود راننده',
    category: 'collision',
    badge: 'خسارت اول زیر ۷۰ میلیون: بدون کروکی',
    requiresPoliceCroqui: false,
    requiresOfficialReport: false
  },
  {
    key: 'CHAIN',
    label: 'تصادف زنجیره‌ای یا با وسایل سنگین',
    shortDesc: 'کامیون، تریلی، اتوبوس یا تصادفات زنجیره‌ای پی‌درپی',
    category: 'collision',
    badge: 'کروکی راهور الزامی است',
    requiresPoliceCroqui: true,
    requiresOfficialReport: false
  },
  {
    key: 'HIT_AND_RUN',
    label: 'تصادف نامعلوم در حالت توقف (فرار مقصر)',
    shortDesc: 'آسیب به خودرو در زمان پارک و نامعلوم بودن راننده ضارب',
    category: 'collision',
    badge: 'کروکی نامعلوم / صورتجلسه پلیس الزامی است',
    requiresPoliceCroqui: true,
    requiresOfficialReport: false
  },
  {
    key: 'THEFT',
    label: 'سرقت کلی خودرو یا قطعات و لوازم',
    shortDesc: 'سرقت رینگ و لاستیک، زاپاس، کامپیوتر خودرو (ECU)، ضبط و باند',
    category: 'security',
    badge: 'گزارش رسمی کلانتری ۱۱۰ الزامی است',
    requiresPoliceCroqui: false,
    requiresOfficialReport: true,
    officialAuthorityLabel: 'گزارش انتظامی کلانتری ۱۱۰ و مراجع قضایی'
  },
  {
    key: 'FIRE',
    label: 'آتش‌سوزی، صاعقه یا انفجار',
    shortDesc: 'حریق موتور، سیم‌کشی یا سوختگی قطعات و بدنه',
    category: 'standalone',
    badge: 'گزارش آتش‌نشانی ۱۲۵ الزامی است',
    requiresPoliceCroqui: false,
    requiresOfficialReport: true,
    officialAuthorityLabel: 'گزارش کارشناسی سازمان آتش‌نشانی (۱۲۵)'
  },
  {
    key: 'GLASS_BREAK',
    label: 'شکست شیشه مستقل از تصادف',
    shortDesc: 'شکست شیشه جلو یا عقب بدون تصادف فیزیکی بدنه',
    category: 'standalone',
    badge: 'معاف از کروکی (بدون کروکی)',
    requiresPoliceCroqui: false,
    requiresOfficialReport: false
  },
  {
    key: 'NATURAL_DISASTER',
    label: 'بلایای طبیعی (سیل، زلزله، طوفان، تگرگ)',
    shortDesc: 'خسارت شدید تگرگ، آب‌گرفتگی سیلاب یا سقوط اشیاء در طوفان',
    category: 'natural',
    badge: 'تاییدیه مرجع رسمی الزامی است',
    requiresPoliceCroqui: false,
    requiresOfficialReport: true,
    officialAuthorityLabel: 'تاییدیه ستاد مدیریت بحران / هواشناسی یا کلانتری'
  },
  {
    key: 'VANDALISM',
    label: 'خط و خش عمدی، اسیدپاشی یا تخریب',
    shortDesc: 'خسارت عمدی اشخاص ثالث یا پاشیدن مواد شیمیایی و اسیدی',
    category: 'security',
    badge: 'گزارش رسمی کلانتری ۱۱۰ الزامی است',
    requiresPoliceCroqui: false,
    requiresOfficialReport: true,
    officialAuthorityLabel: 'گزارش انتظامی کلانتری ۱۱۰'
  }
];

interface BodilyInsuranceModuleProps {
  session: UserSession;
  cases: ClaimCase[];
  initialMode?: 'create' | 'list';
  initialAccidentType?: string;
  initialEstimatedDamage?: number;
  onSubmitBodily: (newCase: ClaimCase) => void;
  onBack: () => void;
  onOpenCaseDetail?: (caseId: string) => void;
}

export const BodilyInsuranceModule: React.FC<BodilyInsuranceModuleProps> = ({
  session,
  cases,
  initialMode = 'list',
  initialAccidentType,
  initialEstimatedDamage,
  onSubmitBodily,
  onBack,
  onOpenCaseDetail
}) => {
  const [viewState, setViewState] = useState<'list' | 'create_step1' | 'create_step2' | 'success'>(
    initialMode === 'create' ? 'create_step1' : 'list'
  );

  // National ID and inquiry state
  const [nationalId, setNationalId] = useState(session.nationalId || '0012345678');
  const [inquiredPolicy, setInquiredPolicy] = useState<BodyPolicyRecord | null>(null);
  const [isInquiring, setIsInquiring] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Form Fields
  const [ownerName, setOwnerName] = useState(session.name || 'مهدی کشاورز');
  const [ownerPhone, setOwnerPhone] = useState(session.phone || '09123456789');

  // Accident Type: synchronized with initialAccidentType from wizard if present!
  const [selectedAccidentTypeKey, setSelectedAccidentTypeKey] = useState<string>(() => {
    if (initialAccidentType && BODY_ACCIDENT_TYPES_LIST.some((t) => t.key === initialAccidentType)) {
      return initialAccidentType;
    }
    return 'FIXED_OBJECT';
  });
  const [isTransferredFromWizard, setIsTransferredFromWizard] = useState<boolean>(!!initialAccidentType);

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

  // --- کارت بیمه بدنه (پیش‌فرض خالی است تا کاربر خودش بارگذاری کند) ---
  const [bodyPolicyCardPhoto, setBodyPolicyCardPhoto] = useState<string | null>(null);
  const [bodyPolicyNumberManual, setBodyPolicyNumberManual] = useState('');

  // --- شرایط و ضوابط کروکی بیمه بدنه ---
  const [estimatedDamageToman, setEstimatedDamageToman] = useState<number>(() => {
    if (initialEstimatedDamage && initialEstimatedDamage > 0) {
      return initialEstimatedDamage;
    }
    return 45_000_000;
  });

  // کروکی پلیس راهور و گزارش مراجع رسمی
  const [croquiType, setCroquiType] = useState<'electronic' | 'paper' | 'judicial'>('electronic');
  const [krokiCode, setKrokiCode] = useState<string>('');
  const [krokiPhoto, setKrokiPhoto] = useState<MediaFile | null>(null);
  const [paperSerial, setPaperSerial] = useState<string>('');
  const [officialReportCode, setOfficialReportCode] = useState<string>('');
  const [officialReportFile, setOfficialReportFile] = useState<MediaFile | null>(null);
  const [optionalCroquiEnabled, setOptionalCroquiEnabled] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // ارزیابی هوشمند کروکی بر اساس نوع سانحه و مبلغ
  const selectedAccidentItem =
    BODY_ACCIDENT_TYPES_LIST.find((t) => t.key === selectedAccidentTypeKey) ||
    BODY_ACCIDENT_TYPES_LIST[0];

  const isOverCeiling = estimatedDamageToman > NO_CROQUI_CEILING_TOMAN;
  const isPoliceCroquiMandatory =
    selectedAccidentItem.requiresPoliceCroqui || isOverCeiling;
  const isOfficialReportMandatory = selectedAccidentItem.requiresOfficialReport;
  const isAnyCroquiOrReportRequired = isPoliceCroquiMandatory || isOfficialReportMandatory;

  const croquiReasons: string[] = [];
  if (isOverCeiling) {
    croquiReasons.push(
      `مبلغ برآورد خسارت (${estimatedDamageToman.toLocaleString('fa-IR')} تومان) از سقف پرداخت بدون کروکی (${NO_CROQUI_CEILING_LABEL}) بیشتر است.`
    );
  }
  if (selectedAccidentItem.requiresPoliceCroqui) {
    croquiReasons.push(
      `نوع حادثه (${selectedAccidentItem.label}) طبق مقررات بیمه بدنه الزاما نیازمند تنظیم و ارائه کروکی رسمی پلیس راهور است.`
    );
  }
  if (selectedAccidentItem.requiresOfficialReport) {
    croquiReasons.push(
      `برای سانحه ${selectedAccidentItem.label}، ارائه ${selectedAccidentItem.officialAuthorityLabel || 'گزارش رسمی مراجع ذی‌صلاح'} الزامی است.`
    );
  }

  // Update when props change
  useEffect(() => {
    if (initialAccidentType && BODY_ACCIDENT_TYPES_LIST.some((t) => t.key === initialAccidentType)) {
      setSelectedAccidentTypeKey(initialAccidentType);
      setIsTransferredFromWizard(true);
    }
    if (initialEstimatedDamage && initialEstimatedDamage > 0) {
      setEstimatedDamageToman(initialEstimatedDamage);
    }
  }, [initialAccidentType, initialEstimatedDamage]);

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

  // Respond to initialMode changes (e.g. when redirected from AccidentWizard)
  useEffect(() => {
    if (initialMode === 'create') {
      setViewState('create_step1');
    }
  }, [initialMode]);

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

  const handlePolicyCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await compressImageFile(file, 1200, 0.8);
      setBodyPolicyCardPhoto(url);
    }
  };

  const handleKrokiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await compressImageFile(file, 1200, 0.8);
      setKrokiPhoto({
        name: 'برگه کروکی پلیس راهور (بیمه بدنه)',
        type: 'image',
        dataUrl: url,
        fileName: file.name
      });
    }
  };

  const handlePaperCroquiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await compressImageFile(file, 1200, 0.8);
      setKrokiPhoto({
        name: 'تصویر برگه کروکی فیزیکی راهور',
        type: 'image',
        dataUrl: url,
        fileName: file.name
      });
    }
  };

  const handleOfficialReportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isPdf = file.type === 'application/pdf';
      const url = isPdf
        ? URL.createObjectURL(file)
        : await compressImageFile(file, 1200, 0.8);
      setOfficialReportFile({
        name: selectedAccidentItem.officialAuthorityLabel || 'گزارش رسمی مراجع انتظامی',
        type: isPdf ? 'document' : 'image',
        dataUrl: url,
        fileName: file.name
      });
    }
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
    if (bodyPolicyCardPhoto) {
      allFiles.push({
        name: 'تصویر کارت بیمه بدنه خودرو',
        type: 'image',
        dataUrl: bodyPolicyCardPhoto,
        fileName: 'body_insurance_card.jpg'
      });
    }
    if (krokiPhoto) {
      allFiles.push(krokiPhoto);
    }
    if (officialReportFile) {
      allFiles.push(officialReportFile);
    }

    // Recommend branch
    const branchMatch = findBestMatchingBranch(inquiredPolicy.insurerCode, address, city);

    const newClaimCase: ClaimCase = {
      id: trackingCode,
      isBodily: true,
      isBodyClaim: true,
      insuranceType: 'body',
      claimDepartment: 'BODY_INSURANCE_UNIT',
      claimDepartmentLabel: 'واحد رسیدگی خسارت بیمه بدنه',
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
      culpritPolicyNo: bodyPolicyNumberManual || inquiredPolicy.policyNo,
      bodyPolicyNumber: bodyPolicyNumberManual || inquiredPolicy.policyNo,
      bodyPolicyCardPhoto: bodyPolicyCardPhoto || undefined,
      bodyClaimCountThisYear: 1,
      bodyPolicyLessThan30Days: false,
      bodyCroquiReasons: croquiReasons,
      croquiRequired: isAnyCroquiOrReportRequired,
      croquiRequirementReasons: croquiReasons,
      estimatedDamageToman: estimatedDamageToman,
      bodyInsuranceInfo: {
        policyNo: bodyPolicyNumberManual || inquiredPolicy.policyNo,
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
        damageType: selectedAccidentItem.label
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
      hasKroki: !isAnyCroquiOrReportRequired || !!krokiPhoto || !!krokiCode || !!paperSerial || !!officialReportCode,
      customerKrokiPhoto: krokiPhoto?.dataUrl || undefined,
      sceneReportCode: krokiCode || paperSerial || officialReportCode || undefined,
      writtenReport: incidentDescription,
      files: allFiles,
      audioExplanation: audioFile,
      videoExplanation: videoFile,
      accidentTypeKey: selectedAccidentTypeKey,
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
          note: `ثبت خودخدمت خسارت بیمه بدنه خودرو و ارجاع برخط به واحد بیمه بدنه شرکت ${inquiredPolicy.insurerName}.${isAnyCroquiOrReportRequired ? ' (کروکی / گزارش رسمی الصاق گردید)' : ' (واجد شرایط رسیدگی بدون کروکی تا سقف ۷۰ میلیون تومان)'}`
        }
      ]
    };

    onSubmitBodily(newClaimCase);
    setCreatedCase(newClaimCase);
    setViewState('success');
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in" dir="rtl">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-900 text-amber-300 flex items-center justify-center font-bold shadow-md">
            <ShieldPlus className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-blue-900">پورتال خسارت بیمه بدنه خودرو</h1>
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
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md border border-blue-300 transition-all flex items-center gap-2 active:scale-95"
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
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-5 rounded-3xl shadow-sm space-y-2">
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
              <h3 className="font-extrabold text-sm text-blue-900">مستندسازی چندرسانه‌ای</h3>
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
                <h2 className="font-black text-blue-900 text-base">
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
              <div className="py-7 sm:py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShieldPlus className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-sm">تاکنون پرونده خسارت بدنه ثبت نکرده‌اید</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  در صورت بروز حادثه، واژگونی، برخورد با مانع یا آسیب به خودرو، می‌توانید با زدن دکمه زیر پرونده جدید بدنه ثبت کنید.
                </p>
                <button
                  onClick={() => setViewState('create_step1')}
                  className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-md mt-2 active:scale-95"
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
                          ? 'border-blue-300 bg-blue-50/40 hover:bg-blue-50/70 shadow-sm ring-1 ring-blue-900/20'
                          : 'border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-blue-900 font-mono text-sm">{c.id}</span>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-black">
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
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-blue-300 shadow-xs animate-pulse'
                            : 'bg-amber-100 text-amber-950 border-amber-300'
                        }`}>
                          {isFieldCompleted && c.status !== 'پرداخت شده' && c.status !== 'در انتظار پرداخت'
                            ? 'آماده تایید و ثبت شبا'
                            : c.status}
                        </span>
                      </div>

                      {/* Field expert completion alert banner */}
                      {isFieldCompleted && c.status !== 'پرداخت شده' && (
                        <div className="p-2.5 rounded-xl bg-blue-600 text-white text-[11px] font-bold flex items-center justify-between shadow-xs">
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
                <h2 className="text-lg font-black text-blue-900 mt-0.5">
                  استعلام هوشمند بیمه‌نامه بدنه و اطلاعات حادثه
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-900 font-black text-xs border border-blue-200">
                گام نخست: استعلام کدملی
              </span>
            </div>

            {/* National ID Inquiry Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-blue-200 space-y-3">
              <label className="block text-xs font-black text-blue-900">
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
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 font-mono font-bold text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                    dir="ltr"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleInquirePolicy(nationalId)}
                  disabled={isInquiring || !nationalId.trim()}
                  className="w-full sm:w-auto w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
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

                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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

            {/* پیام انتقال از فرآیند ثبت سانحه (در صورت ارجاع از ویزارد) */}
            {isTransferredFromWizard && (
              <div className="bg-gradient-to-r from-amber-50 to-indigo-50 border-2 border-amber-300/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black text-slate-900">
                      انتقال مستقیم از فرآیند ثبت خسارت خودرو
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-950 font-bold text-[10px]">
                      سانحه: {selectedAccidentItem.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                    اطلاعات حادثه و برآورد اولیه خسارت از مرحله قبل به این بخش منتقل گردید. بر اساس نوع حادثه یا برآورد خسارت، الزامات قانونی کروکی زیر بررسی شده است.
                  </p>
                </div>
              </div>
            )}

            {/* بخش بارگذاری تصویر کارت یا بیمه‌نامه بدنه (پیش‌فرض خالی است و کاربر باید بارگذاری کند) */}
            <div className="bg-slate-50 border-2 border-indigo-200 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <span>کارت یا بیمه‌نامه بدنه خودرو</span>
                      <span className="text-rose-600 font-black">* (الزامی)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      جهت استعلام اصالت بیمه‌نامه و الحاق مستقیم به پرونده خسارت
                    </p>
                  </div>
                </div>

                {bodyPolicyCardPhoto && (
                  <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    <span>تغییر تصویر کارت</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePolicyCardUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {bodyPolicyCardPhoto ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="sm:col-span-1">
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-400 group aspect-[16/10] bg-slate-900 shadow-sm">
                      <img
                        src={bodyPolicyCardPhoto}
                        alt="کارت بیمه بدنه"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-2 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-emerald-200 bg-emerald-950/80 px-2 py-0.5 rounded-md self-start border border-emerald-400/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          کارت بدنه بارگذاری شد
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-white">
                          <span className="font-mono">{bodyPolicyNumberManual || (inquiredPolicy ? inquiredPolicy.policyNo : 'بیمه‌نامه')}</span>
                          <button
                            type="button"
                            onClick={() => setBodyPolicyCardPhoto(null)}
                            className="text-rose-300 hover:text-rose-100 underline text-[10px]"
                          >
                            حذف تصویر
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      شماره بیمه‌نامه بدنه (بر اساس کارت بارگذاری‌شده):
                    </label>
                    <input
                      type="text"
                      value={bodyPolicyNumberManual || (inquiredPolicy ? inquiredPolicy.policyNo : '')}
                      onChange={(e) => setBodyPolicyNumberManual(e.target.value)}
                      placeholder="مثلاً: ۱۲/۹۹/۴۵۸۰۲/۱۴۰۳"
                      className="w-full px-3.5 py-2 rounded-xl border-2 border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      dir="ltr"
                    />
                    <p className="text-[11px] text-slate-500">
                      تصویر کارت بیمه بدنه با موفقیت دریافت گردید و در پرونده سنهاب ثبت شد.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-indigo-950 mb-1">
                      بارگذاری تصویر کارت یا بیمه‌نامه بدنه خودرو
                    </span>
                    <span className="text-[11px] text-slate-500 mb-3 max-w-sm">
                      برای احراز هویت بیمه‌ای، لطفاً عکسی واضح از روی کارت یا صفحه اول بیمه‌نامه بدنه را انتخاب یا عکس‌برداری نمایید.
                    </span>
                    <span className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      انتخاب تصویر یا عکاسی از کارت بدنه
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePolicyCardUpload}
                      className="hidden"
                    />
                  </label>
                  <div className="flex items-center gap-2 text-[11px] text-indigo-900 bg-indigo-50/80 p-2.5 rounded-xl border border-indigo-100">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      جهت دریافت خسارت بدنه، بارگذاری عکس کارت بیمه بدنه الزامی بوده و به پرونده ارزیابی پیوست می‌شود.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* بخش انتخاب نوع حادثه و سانحه */}
            <div className="bg-white border-2 border-slate-300 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>نوع حادثه و علت خسارت بدنه</span>
                      <span className="text-rose-600 font-black">*</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      نوع سانحه تعیین‌کننده الزامی یا اختیاری بودن کروکی پلیس راهور یا گزارش مراجع رسمی است
                    </p>
                  </div>
                </div>

                <span className="text-xs font-black px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {selectedAccidentItem.badge}
                </span>
              </div>

              {/* شبکه انتخاب سریع سانحه */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {BODY_ACCIDENT_TYPES_LIST.map((typeItem) => {
                  const isSelected = selectedAccidentTypeKey === typeItem.key;
                  return (
                    <button
                      key={typeItem.key}
                      type="button"
                      onClick={() => {
                        setSelectedAccidentTypeKey(typeItem.key);
                        setIsTransferredFromWizard(false);
                      }}
                      className={`p-3 rounded-xl border-2 text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-black ${isSelected ? 'text-blue-950' : 'text-slate-900'}`}>
                            {typeItem.label}
                          </span>
                          <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug line-clamp-2">
                          {typeItem.shortDesc}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px]">
                        <span className={`font-bold px-1.5 py-0.5 rounded ${
                          typeItem.requiresPoliceCroqui
                            ? 'bg-rose-100 text-rose-800'
                            : typeItem.requiresOfficialReport
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {typeItem.requiresPoliceCroqui
                            ? 'کروکی راهور الزامی'
                            : typeItem.requiresOfficialReport
                            ? 'گزارش رسمی الزامی'
                            : 'معاف از کروکی (شرط اول)'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* بخش مبالغ تخمینی خسارت */}
            <div className="bg-white border-2 border-slate-300 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    مبلغ تخمینی خسارت به خودرو
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    سقف پرداخت خسارت بدون کروکی طبق ضوابط بیمه مرکزی: حداکثر ۷۰ میلیون تومان
                  </p>
                </div>
                <span className="text-xs font-black font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {estimatedDamageToman.toLocaleString('fa-IR')} تومان
                </span>
              </div>

              {/* Slider for estimated damage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">برآورد تقریبی مبلغ خسارت به خودرو:</span>
                  <span className={`font-black font-mono ${isOverCeiling ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {isOverCeiling ? 'بالاتر از سقف معافیت (نیازمند کروکی)' : 'زیر سقف ۷۰ میلیون (معاف از کروکی)'}
                  </span>
                </div>
                <input
                  type="range"
                  min={5_000_000}
                  max={200_000_000}
                  step={5_000_000}
                  value={estimatedDamageToman}
                  onChange={(e) => setEstimatedDamageToman(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[20_000_000, 45_000_000, 70_000_000, 95_000_000, 150_000_000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEstimatedDamageToman(val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                        estimatedDamageToman === val
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {val === 70_000_000 ? '۷۰ میلیون (سقف قانونی)' : `${(val / 1000000).toLocaleString('fa-IR')} میلیون`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* بخش اختصاصی ثبت کروکی یا گزارش مراجع رسمی (مانند شخص ثالث با استعلام و نمونه‌ها) */}
            <div className="bg-white border-2 border-slate-300 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-black text-xs shadow ${
                    isAnyCroquiOrReportRequired ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}>
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">
                      {isOfficialReportMandatory
                        ? 'گزارش رسمی مراجع انتظامی / آتش‌نشانی'
                        : 'اطلاعات کروکی پلیس راهور (بیمه بدنه)'}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isAnyCroquiOrReportRequired
                        ? 'بر اساس شرایط پرونده، ارائه مدارک زیر الزامی است'
                        : 'این پرونده واجد شرایط پرداخت بدون کروکی است'}
                    </p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  isAnyCroquiOrReportRequired
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                }`}>
                  {isAnyCroquiOrReportRequired ? '⚠️ ارائه کروکی / گزارش الزامی است' : '✓ معاف از کروکی'}
                </span>
              </div>

              {/* اگر گزارش یا کروکی الزامی است */}
              {isAnyCroquiOrReportRequired ? (
                <div className="space-y-4">
                  {/* پیام هشدار الزام با دلایل صریح */}
                  <div className="bg-rose-50 border-2 border-rose-300/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-rose-950">
                          الزام قانونی: باید اطلاعات مربوط به کروکی یا گزارش رسمی حتماً وارد شود
                        </h4>
                        <p className="text-[11px] text-rose-800 font-medium">
                          طبق قوانین بیمه مرکزی جمهوری اسلامی ایران، به دلایل زیر ارائه کروکی یا گزارش رسمی الزامی است:
                        </p>
                        <ul className="list-disc list-inside text-[11px] text-rose-900 font-bold space-y-0.5 pt-1">
                          {croquiReasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* اگر حادثه نیاز به گزارش رسمی انتظامی/آتش‌نشانی دارد (سرقت، آتش‌سوزی، بلایای طبیعی، وندالیسم) */}
                  {isOfficialReportMandatory ? (
                    <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-black text-amber-950">
                          ثبت مشخصات {selectedAccidentItem.officialAuthorityLabel || 'گزارش مراجع ذی‌صلاح'}:
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            شماره یا کد پرونده / صورتجلسه <span className="text-rose-600">*</span>:
                          </label>
                          <input
                            type="text"
                            value={officialReportCode}
                            onChange={(e) => setOfficialReportCode(e.target.value)}
                            placeholder="مثلاً: کلانتری ۱۰۳ - پرونده ۹۹۴۸/۱۴۰۳"
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            بارگذاری تصویر یا فایل گزارش رسمی <span className="text-rose-600">*</span>:
                          </label>
                          <label className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-dashed border-amber-400 hover:bg-amber-50 text-amber-900 font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition-all">
                            <Upload className="w-4 h-4 text-amber-600" />
                            <span>{officialReportFile ? 'تغییر فایل گزارش' : 'انتخاب تصویر یا فایل PDF گزارش'}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleOfficialReportUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {officialReportFile && (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-slate-900">{officialReportFile.name}</span>
                            <span className="text-slate-400 font-mono text-[10px]">({officialReportFile.fileName})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOfficialReportFile(null)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* اگر حادثه نیاز به کروکی پلیس راهور دارد (مانند شخص ثالث: الکترونیک، کاغذی، قضایی) */
                    <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 space-y-4">
                      {/* تب‌های انتخاب نوع کروکی */}
                      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                        <button
                          type="button"
                          onClick={() => setCroquiType('electronic')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            croquiType === 'electronic'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>کروکی الکترونیک پلیس راهور (سیستمی)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCroquiType('paper')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            croquiType === 'paper'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>کروکی کاغذی / سنتی پلیس راهور (فیزیکی)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCroquiType('judicial')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            croquiType === 'judicial'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>کروکی قضایی / کارشناس دادگستری</span>
                        </button>
                      </div>

                      {/* حالت اول: کروکی الکترونیک راهور با نمونه‌های آماده */}
                      {croquiType === 'electronic' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              شماره یا کد پیگیری ۱۶ رقمی کروکی الکترونیک پلیس راهور <span className="text-rose-600">*</span>:
                            </label>
                            <input
                              type="text"
                              value={krokiCode}
                              onChange={(e) => setKrokiCode(e.target.value)}
                              placeholder="مثلاً: KR-1403-99812 یا کد ۱۶ رقمی پیامک‌شده از پلیس راهور"
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                              dir="ltr"
                            />
                          </div>

                          {/* نمونه‌های آماده کروکی الکترونیک برای تست و استعلام سریع */}
                          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                            <span className="text-[11px] font-black text-blue-950 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                              نمونه‌های ثبت‌شده در سامانه هوشمند کروکی راهور (کلیک جهت استعلام خودکار):
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {sampleCroquis.slice(0, 3).map((sample, sIdx) => (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => {
                                    setKrokiCode(sample.reportNumber);
                                    if (sample.fileUrl) {
                                      setKrokiPhoto({
                                        name: sample.title,
                                        type: 'image',
                                        dataUrl: sample.fileUrl,
                                        fileName: `croqui_${sample.reportNumber}.jpg`
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100/60 border border-blue-200 text-[10.5px] font-bold text-blue-900 flex items-center gap-1.5 transition-all active:scale-95"
                                >
                                  <span className="font-mono text-[10px]">{sample.reportNumber}</span>
                                  <span>-</span>
                                  <span>{sample.title}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* بارگذاری عکس پیامک یا رسید کروکی الکترونیک */}
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              بارگذاری تصویر رسید یا برگه کروکی (اختیاری):
                            </label>
                            <label className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-dashed border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-2">
                              <Upload className="w-4 h-4 text-blue-600" />
                              <span>{krokiPhoto ? 'تغییر تصویر کروکی' : 'انتخاب تصویر رسید یا برگه کروکی'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleKrokiUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {krokiPhoto && (
                            <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="font-bold text-emerald-950">{krokiPhoto.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setKrokiPhoto(null)}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                              >
                                حذف
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* حالت دوم: کروکی کاغذی فیزیکی */}
                      {croquiType === 'paper' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              شماره سریال برگه کروکی فیزیکی راهور <span className="text-rose-600">*</span>:
                            </label>
                            <input
                              type="text"
                              value={paperSerial}
                              onChange={(e) => setPaperSerial(e.target.value)}
                              placeholder="مثلاً: ب/۴۴۷۸۰۲"
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                              dir="ltr"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              بارگذاری تصویر برگه کروکی رسم‌شده توسط افسر راهور <span className="text-rose-600">*</span>:
                            </label>
                            <label className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-dashed border-blue-300 hover:bg-blue-50/50 text-blue-900 font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition-all">
                              <Camera className="w-4 h-4 text-blue-600" />
                              <span>{krokiPhoto ? 'تغییر عکس برگه کروکی' : 'انتخاب تصویر یا عکاسی از برگه کروکی'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePaperCroquiUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {krokiPhoto && (
                            <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                              <img
                                src={krokiPhoto.dataUrl}
                                alt="برگه کروکی"
                                className="w-14 h-14 object-cover rounded-lg border border-emerald-300"
                              />
                              <div className="text-xs">
                                <span className="font-black text-emerald-950 block">{krokiPhoto.name}</span>
                                <span className="text-[10px] text-emerald-700 font-mono block">{krokiPhoto.fileName}</span>
                                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                                  <Check className="w-3 h-3" />
                                  تصویر برگه فیزیکی ثبت شد
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* حالت سوم: کروکی قضایی و نظریه کارشناس دادگستری */}
                      {croquiType === 'judicial' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              شماره پرونده قضایی یا نظریه کارشناس رسمی <span className="text-rose-600">*</span>:
                            </label>
                            <input
                              type="text"
                              value={officialReportCode}
                              onChange={(e) => setOfficialReportCode(e.target.value)}
                              placeholder="مثلاً: شعبه ۱۰۴ شورای حل اختلاف - پرونده ۸۸۹۴"
                              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                              dir="ltr"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              بارگذاری فایل یا تصویر نظریه کارشناس دادگستری <span className="text-rose-600">*</span>:
                            </label>
                            <label className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-dashed border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-2">
                              <Upload className="w-4 h-4 text-blue-600" />
                              <span>{officialReportFile ? 'تغییر مدرک قضایی' : 'انتخاب فایل یا عکس نظریه قضایی'}</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleOfficialReportUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {officialReportFile && (
                            <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span className="font-bold text-emerald-950">{officialReportFile.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setOfficialReportFile(null)}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-bold"
                              >
                                حذف
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* اگر پرونده معاف از کروکی است (خسارت اول زیر ۷۰ میلیون) */
                <div className="space-y-3">
                  <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-black text-emerald-950">
                          واجد شرایط دریافت خسارت بدون کروکی (معاف از کروکی)
                        </h4>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-relaxed">
                          این سانحه به عنوان <strong>خسارت اول در سال جاری</strong> با مبلغ برآوردی زیر سقف قانونی <strong>۷۰ میلیون تومان</strong> و از نوع سانحه <strong>{selectedAccidentItem.label}</strong> ثبت گردیده است. طبق بخشنامه بیمه مرکزی، <strong>بدون نیاز به کروکی پلیس راهور</strong> و صرفاً با کارت بیمه بدنه و عکس‌های خسارت قابل رسیدگی و پرداخت است.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ثبت اختیاری کروکی در صورت تمایل بیمه‌گذار */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        آیا کروکی یا گزارش پلیس در اختیار دارید و مایل به ثبت آن هستید؟
                      </span>
                      <button
                        type="button"
                        onClick={() => setOptionalCroquiEnabled(!optionalCroquiEnabled)}
                        className="px-3 py-1 rounded-lg text-xs font-black bg-white border border-slate-300 text-slate-800 hover:bg-slate-100"
                      >
                        {optionalCroquiEnabled ? 'بستن فرم کروکی' : '+ ثبت کروکی اختیاری'}
                      </button>
                    </div>

                    {optionalCroquiEnabled && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            شماره یا کد پیگیری کروکی (اختیاری):
                          </label>
                          <input
                            type="text"
                            value={krokiCode}
                            onChange={(e) => setKrokiCode(e.target.value)}
                            placeholder="مثلاً: KR-1403-99812 یا کد ۱۶ رقمی"
                            className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 bg-white font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                            dir="ltr"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            بارگذاری تصویر کروکی (اختیاری):
                          </label>
                          <label className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-dashed border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4 text-blue-600" />
                            <span>{krokiPhoto ? 'تغییر تصویر کروکی' : 'انتخاب تصویر برگه کروکی'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleKrokiUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* مشخصات زمانی و مکانی سانحه */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-5">
              <h3 className="font-black text-blue-900 text-base pb-2 border-b border-slate-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-900" />
                <span>مشخصات زمانی، مکانی و شرح حادثه</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      تاریخ حادثه <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">استان</label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">شهر</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Address */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  آدرس دقیق محل وقوع حادثه یا پارکینگ خودرو (جهت تعیین نزدیک‌ترین شعبه و ارزیاب خسارت){' '}
                  <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثلاً: تهران، بزرگراه ستاری، خروجی جنت‌آباد، خیابان مخبری، پلاک ۲۰..."
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Written Report */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  شرح دقیق نحوه وقوع سانحه و قطعات آسیب‌دیده بدنه خودرو <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  placeholder="توضیح دهید حادثه چطور اتفاق افتاد و کدام قسمت‌ها (سپر، گلگیر، کاپوت، شاسی، سقف و...) آسیب دیده‌اند..."
                  className="w-full p-3.5 rounded-xl border-2 border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* خطای اعتبارسنجی در صورت وجود */}
              {validationError && (
                <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-black animate-in fade-in">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* دکمه‌های ناوبری */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewState('list')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    if (!inquiredPolicy) {
                      setValidationError('ابتدا باید استعلام بیمه‌نامه بدنه انجام شده و اطلاعات آن تایید شود.');
                      return;
                    }
                    if (!bodyPolicyCardPhoto) {
                      setValidationError('بارگذاری تصویر کارت یا بیمه‌نامه بدنه خودرو الزامی است. لطفاً تصویر را بارگذاری نمایید.');
                      return;
                    }
                    if (!address.trim()) {
                      setValidationError('لطفاً آدرس دقیق محل حادثه یا پارکینگ خودرو را وارد نمایید.');
                      return;
                    }
                    if (!incidentDescription.trim()) {
                      setValidationError('لطفاً شرح سانحه و قطعات آسیب‌دیده را وارد نمایید.');
                      return;
                    }

                    // بررسی سخت‌گیرانه کروکی یا گزارش در صورت الزام قانونی
                    if (isOfficialReportMandatory) {
                      if (!officialReportCode.trim() && !officialReportFile) {
                        setValidationError(
                          `با توجه به نوع سانحه (${selectedAccidentItem.label})، وارد کردن شماره پرونده یا بارگذاری فایل ${selectedAccidentItem.officialAuthorityLabel || 'گزارش رسمی'} حتماً الزامی است.`
                        );
                        return;
                      }
                    } else if (isPoliceCroquiMandatory) {
                      if (croquiType === 'electronic') {
                        if (!krokiCode.trim()) {
                          setValidationError(
                            'با توجه به الزام کروکی، باید اطلاعات مربوط به کروکی (کد پیگیری ۱۶ رقمی یا شماره سریال) حتماً وارد شود. می‌توانید از نمونه‌های آماده نیز انتخاب کنید.'
                          );
                          return;
                        }
                      } else if (croquiType === 'paper') {
                        if (!paperSerial.trim() && !krokiPhoto) {
                          setValidationError(
                            'با توجه به الزام کروکی، وارد کردن شماره سریال یا بارگذاری تصویر برگه کروکی فیزیکی حتماً الزامی است.'
                          );
                          return;
                        }
                      } else if (croquiType === 'judicial') {
                        if (!officialReportCode.trim() && !officialReportFile) {
                          setValidationError(
                            'با توجه به الزام کروکی قضایی، وارد کردن شماره پرونده یا بارگذاری مدارک حتماً الزامی است.'
                          );
                          return;
                        }
                      }
                    }

                    setViewState('create_step2');
                  }}
                  className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md border border-blue-300 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <span>مرحله بعد: بارگذاری عکس، ویدیو و ضبط صوت</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
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
                <h2 className="text-lg font-black text-blue-900 mt-0.5">
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
                <h3 className="font-black text-blue-900 text-sm">
                  عکس‌های خسارت و زوایای خودرو ({photos.length} تصویر)
                </h3>
              </div>

              <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95">
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
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-3">
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
                <h3 className="font-black text-blue-900 text-sm">
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
                <h3 className="font-black text-blue-900 text-sm">
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
            <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <span className="font-black text-xs text-blue-900 block">
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-blue-900 block">{audioFile.name}</span>
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
          <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-md space-y-4">
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
        <div className="bg-white rounded-3xl border-2 border-emerald-300 p-5 sm:p-8 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-4 border-emerald-300 shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-blue-900">
              درخواست خسارت بدنه شما با موفقیت ثبت و ارجاع گردید!
            </h2>
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-900 font-black text-sm font-mono border border-blue-300">
              کد رهگیری پرونده: {createdCase.id}
            </div>
          </div>

          {/* Routing Notification Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5 max-w-xl mx-auto text-right space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-black text-xs">
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
              className="w-full sm:w-auto justify-center px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md flex items-center gap-2 active:scale-95"
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
