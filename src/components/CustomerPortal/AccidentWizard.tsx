import React, { useState, useEffect, useRef } from 'react';
import { notifyApp } from '../../lib/appNotify';
import {
  ListChecks,
  MapPin,
  Camera,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Crosshair,
  Mic,
  MicOff,
  Video,
  Search,
  ScanLine,
  ChevronRight,
  ArrowLeft,
  FileText,
  Info,
  Car,
  Trash2,
  Play,
  Square,
  Upload,
  Volume2,
  Sparkles,
  FileCheck,
  Clock,
  X,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Check,
  Building2,
  Lock,
  HelpCircle,
  Loader2,
  ChevronDown,
  Gavel,
  BadgeCheck,
  Siren,
  Banknote,
  VolumeX,
  ExternalLink,
  KeyRound,
  Send
} from 'lucide-react';
import L from 'leaflet';
// آیکون‌های نشانگر نقشه از داخل بسته leaflet باندل می‌شوند (نه از CDN)،
// تا نقشه در محیط آفلاین/اینترانت هم نشانگر را درست نمایش دهد.
import leafletMarkerIcon from 'leaflet/dist/images/marker-icon.png';
import leafletMarkerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import leafletMarkerShadow from 'leaflet/dist/images/marker-shadow.png';
import { ClaimCase, UserSession, MediaFile, CaseStatus, CroquiData, DriverRole, PartyStatement } from '../../types';
import {
  ACCIDENT_TYPES,
  MANDATORY_CROQUI_CONDITIONS,
  BODY_CROQUI_CONDITIONS,
  NO_CROQUI_CEILING_LABEL,
  NO_CROQUI_CEILING_TOMAN,
  buildCeilingWarningText,
  evaluateCroquiRequirement,
  evaluateBodyInsuranceCroquiRequirement,
  isBodyInsuranceIncident,
  getAccidentTypeRule,
  speakWarning,
  stopWarningSpeech
} from '../../lib/accidentRules';
import {
  AUDIO_NOT_SUFFICIENT_NOTICE,
  MIN_STATEMENT_LENGTH,
  STATEMENT_LEGAL_NOTICE,
  buildConfirmedStatement,
  buildPendingStatementRequest,
  generateStatementOtp,
  validateStatementText
} from '../../lib/partyStatements';
import { generateTrackingCode, getInsurerPersianName } from '../../lib/storage';
import { compressImageFile } from '../../lib/imageCompressor';
import { sampleCroquis } from '../../data/mockData';
import { ShamsiDateTimePicker, toFaDigits } from '../ShamsiDateTimePicker';
import { IranianPlateInput } from './IranianPlateInput';
import { SearchableAccidentTypeSelect } from '../common/SearchableAccidentTypeSelect';
import { AIService } from '../../lib/ai/aiService';
import { EvidenceIntelligenceCard } from '../AI/EvidenceIntelligenceCard';
import { AIResult, EvidenceIntelligenceResult } from '../../lib/ai/types';
import { autoDispatchClaimWithAI } from '../../lib/ai/aiDispatcher';
import { QuadrupleInquiries } from '../../types';
import { executeQuadrupleInquiries, generateDeterministicVin } from '../../lib/quadrupleInquiries';
import { QuadrupleInquiriesModal } from '../common/QuadrupleInquiriesModal';

export interface WizardValidationError {
  field: string;
  message: string;
}

interface AccidentWizardProps {
  session: UserSession;
  onComplete: (newCase: ClaimCase) => void;
  onCancel: () => void;
  onSwitchToBodily?: (accidentTypeKey?: string, estimatedDamageToman?: number) => void;
}

const CHASSIS_LOCATIONS = [
  { name: 'تیبا', location: 'زیر صندلی عقب راست' },
  { name: 'پژو پارس', location: 'زیر کاپوت سمت چپ' },
  { name: 'پژو ۲۰۶', location: 'روی درب سرنشین جلوی راننده' },
  { name: 'پراید', location: 'روی شاسی نردبانی عقب' },
  { name: 'سمند', location: 'روی شیشه جلوی کاپوت' },
  { name: 'رنو ال‌۹۰', location: 'زیر کاپوت سمت راست' },
  { name: 'دنا پلاس', location: 'روی سازه بدنه داخلی درب راننده' },
  { name: 'تارا', location: 'داخل در کاپوت سمت راست' }
];

export const AccidentWizard: React.FC<AccidentWizardProps> = ({
  session,
  onComplete,
  onCancel,
  onSwitchToBodily
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardRole, setWizardRole] = useState<'victim' | 'culprit'>('victim');
  const [agreePolicy, setAgreePolicy] = useState(false);

  // Step 2 state
  const [accidentDateTime, setAccidentDateTime] = useState('۱۴۰۵/۰۵/۱۹ - ساعت ۱۸:۳۰');
  const [lat, setLat] = useState<number>(35.6892);
  const [lng, setLng] = useState<number>(51.389);
  const [address, setAddress] = useState('تهران، خیابان ولیعصر، نرسیده به ونک');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Helper to fetch address from coordinates and populate address input
  const fetchAddressFromCoords = (latitude: number, longitude: number) => {
    setGpsStatusMsg('در حال استخراج آدرس دقیق از موقعیت مکانی GPS...');
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fa`)
      .then((res) => res.json())
      .then((data) => {
        let fetchedAddr = '';
        if (data && data.address) {
          const a = data.address;
          const parts = [
            a.state || a.city || 'تهران',
            a.suburb || a.neighbourhood || a.district,
            a.road || a.pedestrian || a.street,
            a.amenity || a.building
          ].filter(Boolean);
          fetchedAddr = parts.length > 0 ? parts.join('، ') : data.display_name;
        } else if (data && data.display_name) {
          fetchedAddr = data.display_name;
        }

        if (!fetchedAddr) {
          fetchedAddr = `تهران، خیابان ولیعصر، محدوده ونک (موقعیت GPS: ${toFaDigits(latitude.toFixed(4))}، ${toFaDigits(longitude.toFixed(4))})`;
        }

        setAddress(fetchedAddr);
        setGpsStatusMsg('آدرس و موقعیت مکانی شما با موفقیت شناسایی و در کادر آدرس جای‌گذاری شد.');
      })
      .catch(() => {
        const fallbackAddr = `تهران، خیابان ولیعصر، محدوده ونک (موقعیت GPS: ${toFaDigits(latitude.toFixed(4))}، ${toFaDigits(longitude.toFixed(4))})`;
        setAddress(fallbackAddr);
        setGpsStatusMsg('آدرس بر اساس موقعیت مکانی با موفقیت ثبت شد.');
      });
  };

  // Step 3 state & Croqui evaluation state
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [chassisFilter, setChassisFilter] = useState('');
  const [selectedChassisLoc, setSelectedChassisLoc] = useState('');
  const [writtenReport, setWrittenReport] = useState('');
  const [hasKroki, setHasKroki] = useState<boolean | null>(null);
  const [krokiCode, setKrokiCode] = useState('');
  const [futurePolice, setFuturePolice] = useState<boolean | null>(null);
  // پیام خطای داخل-سامانه‌ای برای مدارک الزامی (به‌جای alert مرورگر)
  const [requiredDocsError, setRequiredDocsError] = useState<string | null>(null);
  const showRequiredDocsError = (msg: string) => {
    setRequiredDocsError(msg);
    window.setTimeout(() => setRequiredDocsError((cur) => (cur === msg ? null : cur)), 7000);
  };
  const [croquiData, setCroquiData] = useState<CroquiData | null>(null);
  const [croquiType, setCroquiType] = useState<'paper' | 'electronic' | 'judicial'>('electronic');

  // --- قوانین کروکی، نوع حادثه و سقف تعهدات ---
  const [accidentTypeKey, setAccidentTypeKey] = useState<string>('');
  const [estimatedDamage, setEstimatedDamage] = useState<string>('');
  const [selectedConditionIds, setSelectedConditionIds] = useState<string[]>([]);
  const [showConditionsGuide, setShowConditionsGuide] = useState(false);
  const [isSpeakingWarning, setIsSpeakingWarning] = useState(false);
  const [incidentReportCode, setIncidentReportCode] = useState('');

  // --- وضعیت‌ها و اطلاعات بیمه بدنه خودرو (در صورت عدم شمول ثالث) ---
  const isBodyClaim = isBodyInsuranceIncident(accidentTypeKey, wizardRole);
  const [bodyPolicyNumber, setBodyPolicyNumber] = useState<string>('');
  const [bodyPolicyCardPhoto, setBodyPolicyCardPhoto] = useState<string | null>(null);
  const [bodyClaimCountThisYear, setBodyClaimCountThisYear] = useState<number>(1);
  const [bodyPolicyLessThan30Days, setBodyPolicyLessThan30Days] = useState<boolean>(false);
  const [selectedBodyConditionIds, setSelectedBodyConditionIds] = useState<string[]>([]);
  const [hasBodilyInjuryBody, setHasBodilyInjuryBody] = useState<boolean>(false);

  const handleBodyPolicyCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await compressImageFile(file, 1200, 0.8);
      setBodyPolicyCardPhoto(url);
    }
  };

  const estimatedDamageToman = Number(
    String(estimatedDamage)
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[^0-9]/g, '')
  ) || 0;

  const accidentRule = getAccidentTypeRule(accidentTypeKey);

  // ارزیابی اختصاصی ضوابط کروکی بیمه بدنه (سقف ۷۰ میلیون، بار دوم به بعد، کمتر از ۳۰ روز و شروط خاص)
  const bodyCroquiRequirement = evaluateBodyInsuranceCroquiRequirement({
    accidentTypeKey,
    estimatedDamageToman,
    claimCountThisYear: bodyClaimCountThisYear,
    isPolicyUnder30Days: bodyPolicyLessThan30Days,
    selectedConditionIds: selectedBodyConditionIds,
    hasBodilyInjury: hasBodilyInjuryBody
  });

  const croquiRequirement = isBodyClaim
    ? {
        mandatory: bodyCroquiRequirement.croquiMandatory,
        reasons: bodyCroquiRequirement.reasons,
        exceedsCeiling: estimatedDamageToman > 70_000_000,
        supportsCroqui: true,
        reportKind: 'کروکی رسمی پلیس راهور (بیمه بدنه)',
        reportLabel: 'برگه کروکی رسمی پلیس راهور'
      }
    : evaluateCroquiRequirement({
        accidentTypeKey,
        selectedConditionIds,
        estimatedDamageToman
      });
  const needsAlternativeReport = !isBodyClaim && !!accidentRule && accidentRule.supportsCroqui === false;

  const handleToggleWarningSpeech = () => {
    if (isSpeakingWarning) {
      stopWarningSpeech();
      setIsSpeakingWarning(false);
      return;
    }
    const ok = speakWarning(buildCeilingWarningText(estimatedDamageToman));
    setIsSpeakingWarning(ok);
    if (ok) {
      window.setTimeout(() => setIsSpeakingWarning(false), 15000);
    }
  };

  // --- تأیید رسمی اظهارات (OTP) ---
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementOtp, setStatementOtp] = useState('');
  const [enteredStatementOtp, setEnteredStatementOtp] = useState('');
  const [statementOtpSent, setStatementOtpSent] = useState(false);
  const [statementOtpError, setStatementOtpError] = useState<string | null>(null);
  const [statementAgreed, setStatementAgreed] = useState(false);
  const [confirmedStatement, setConfirmedStatement] = useState<PartyStatement | null>(null);
  const [showFuturePoliceModal, setShowFuturePoliceModal] = useState(false);
  const [showChassisGuideModal, setShowChassisGuideModal] = useState(false);
  const [isAnalyzingCroqui, setIsAnalyzingCroqui] = useState(false);
  const [selectedCroquiSampleIdx, setSelectedCroquiSampleIdx] = useState<number | null>(null);
  const [evidenceAiResult, setEvidenceAiResult] = useState<AIResult<EvidenceIntelligenceResult> | null>(null);

  const handleAnalyzeCroquiSample = async (sampleIdx: number) => {
    setIsAnalyzingCroqui(true);
    setSelectedCroquiSampleIdx(sampleIdx);

    try {
      const sample = sampleCroquis[sampleIdx];

      const simClaim: Partial<ClaimCase> = {
        id: `WIZ-CROQUI-${Date.now()}`,
        partyOneRole: wizardRole === 'culprit' ? 'مقصر' : 'زیان‌دیده',
        hasKroki: true,
        croquiType,
        customerKrokiPhoto: sample.fileUrl,
        sceneReportCode: sample.reportNumber,
        date: sample.incidentDate,
        victimName: sample.victimDriver.fullName,
        victimPlate: sample.victimDriver.plateNumber,
        culpritName: sample.faultDriver.fullName,
        culpritPlate: sample.faultDriver.plateNumber,
        files: [
          { id: 'croqui-f', name: 'تصویر مدرک کروکی پلیس', dataUrl: sample.fileUrl, type: 'image' },
          ...files
        ],
        croquiData: {
          croquiType,
          fileUrl: sample.fileUrl,
          isValidDocument: sample.isValid,
          confidenceScore: sample.confidence,
          reportNumber: sample.reportNumber,
          incidentDate: sample.incidentDate,
          location: sample.location,
          faultDriver: sample.faultDriver,
          victimDriver: sample.victimDriver,
          policeBadgeId: sample.policeBadgeId,
          hasOfficialStamp: sample.hasOfficialStamp,
          declaredRoleMatches: wizardRole === 'culprit' ? sample.faultDriver.nationalId === '1234567890' : sample.victimDriver.nationalId === '1234567890',
          discrepancyNotes: null,
          recommendedNextStep: sample.isValid ? 'PROCEED_TO_DAMAGE_PHOTOS' : 'REQUIRE_MANUAL_REVIEW'
        }
      };

      const aiResult = await AIService.getInstance().analyzeEvidence(
        simClaim as ClaimCase,
        simClaim.files || [],
        { forceFresh: true }
      );

      setEvidenceAiResult(aiResult);

      const ev = aiResult.result;
      const ocr = ev.croquiOcrExtract;
      const isValid = ev.croquiAuthenticity === 'VERIFIED';
      const roleMatches = ev.roleAlignment?.matches ?? true;

      const resData: CroquiData = {
        croquiType,
        fileUrl: sample.fileUrl,
        isValidDocument: isValid,
        confidenceScore: aiResult.confidence.score,
        rejectionReason: !isValid ? 'مدرک فاقد علائم و مهر رسمی انتظامی است.' : undefined,
        reportNumber: ocr?.policeCode || sample.reportNumber,
        incidentDate: ocr?.incidentDate || sample.incidentDate,
        location: sample.location,
        faultDriver: {
          fullName: ocr?.faultDriver || sample.faultDriver.fullName,
          nationalId: sample.faultDriver.nationalId,
          plateNumber: ocr?.faultPlate || sample.faultDriver.plateNumber,
          insurancePolicyNumber: sample.faultDriver.insurancePolicyNumber
        },
        victimDriver: {
          fullName: ocr?.victimDriver || sample.victimDriver.fullName,
          nationalId: sample.victimDriver.nationalId,
          plateNumber: ocr?.victimPlate || sample.victimDriver.plateNumber,
          insurancePolicyNumber: sample.victimDriver.insurancePolicyNumber
        },
        policeBadgeId: ocr?.policeOfficerBadge || sample.policeBadgeId,
        hasOfficialStamp: ocr?.hasOfficialStamp ?? sample.hasOfficialStamp,
        declaredRoleMatches: roleMatches,
        discrepancyNotes: ev.roleAlignment?.notesFa || (ev.inconsistenciesDetected.length > 0 ? ev.inconsistenciesDetected[0] : null),
        recommendedNextStep: ev.recommendedNextStep || (isValid && roleMatches ? 'PROCEED_TO_DAMAGE_PHOTOS' : 'REQUIRE_MANUAL_REVIEW'),
        rawEvaluationJSON: {
          aiResultId: aiResult.id,
          capability: aiResult.capability,
          confidence: aiResult.confidence,
          evidenceResult: ev
        }
      };

      setCroquiData(resData);
      setHasKroki(true);
      setKrokiCode(sample.reportNumber);
      if (resData.victimDriver?.plateNumber) {
        setVicVin(generateDeterministicVin(resData.victimDriver.plateNumber, 'پژو ۲۰۶'));
      }
      if (resData.faultDriver?.plateNumber) {
        setFltVin(generateDeterministicVin(resData.faultDriver.plateNumber, 'سمند LX'));
      }
    } finally {
      setIsAnalyzingCroqui(false);
    }
  };

  // Audio recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const getFileForLabel = (label: string) => files.find((f) => f.name === label);

  const removeFileForLabel = (label: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== label));
  };

  const handleFileUploadForLabel = async (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await compressImageFile(file, 1000, 0.7);
      setFiles((prev) => [
        ...prev.filter((f) => f.name !== label),
        {
          name: label,
          type: file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'video'),
          dataUrl,
          fileName: file.name
        }
      ]);
      if (label === 'عکس کارت ماشین' || label === 'عکس از شماره شاسی') {
        const pStr = `${vicP1 || '۱۲'}${vicPLetter || 'ب'}${vicP2 || '۳۴۵'}-ایران${vicP3 || '۱۱'}`;
        const autoVin = vicVin || generateDeterministicVin(pStr, vicCarType || 'پژو ۲۰۶');
        setVicVin(autoVin);
        notifyApp(`شماره شاسی (${autoVin}) از روی تصویر مدارک استخراج و در پرونده قفل شد.`);
      }
      // Clear relevant validation errors when user uploads
      setValidationErrors((prev) =>
        prev.filter((err) => {
          if (label === 'پلاک' && err.field === 'photo_plate') return false;
          if (['خسارت ۱', 'خسارت ۲', 'جلو', 'عقب', 'راست', 'چپ', 'سقف'].includes(label) && err.field === 'photo_damage') return false;
          if ((label === 'عکس کارت ماشین' || label === 'عکس از شماره شاسی') && err.field === 'vehicle_card') return false;
          if (label.includes('روی گواهینامه') && label.includes('طرف مقابل') && err.field === 'fltFrontLicense') return false;
          if (label.includes('پشت گواهینامه') && label.includes('طرف مقابل') && err.field === 'fltBackLicense') return false;
          if (label.includes('روی گواهینامه') && !label.includes('طرف مقابل') && err.field === 'vicFrontLicense') return false;
          if (label.includes('پشت گواهینامه') && !label.includes('طرف مقابل') && err.field === 'vicBackLicense') return false;
          if ((label === 'عکس کروکی' || label === 'عکس برگه گزارش پلیس') && err.field === 'paperCroqui') return false;
          if (['بارگذاری تصویر/PDF گزارش کارشناس', 'گزارش کارشناس دادگستری', 'عکس کروکی', 'عکس برگه گزارش پلیس'].includes(label) && err.field === 'judicialCroqui') return false;
          return true;
        })
      );
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        notifyApp('مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.');
        return;
      }
      if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
        notifyApp('امکان ضبط صدا در این مرورگر فعال نیست.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream);
      } catch (e) {
        console.error('MediaRecorder instantiation error:', e);
        notifyApp('امکان ایجاد ضبط‌کننده صدا وجود ندارد.');
        return;
      }
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setFiles((prev) => [
          ...prev.filter((f) => f.name !== 'توضیحات صوتی'),
          {
            name: 'توضیحات صوتی',
            type: 'audio',
            dataUrl: url,
            fileName: 'voice_description.webm'
          }
        ]);
      };

      recorder.start();
      setIsRecordingVoice(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      // Fallback simulation if microphone permission is not granted
      setIsRecordingVoice(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    } else {
      const simUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      setAudioUrl(simUrl);
      setFiles((prev) => [
        ...prev.filter((f) => f.name !== 'توضیحات صوتی'),
        {
          name: 'توضیحات صوتی',
          type: 'audio',
          dataUrl: simUrl,
          fileName: 'voice_description.wav'
        }
      ]);
    }
    clearFieldError('description');
    setIsRecordingVoice(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  // Step 4 state (Victim / You / Party One)
  const [vicIsDriverSameOwner, setVicIsDriverSameOwner] = useState<boolean>(true); // true = مالک و راننده یک نفر, false = دو نفر متفاوت
  const [vicName, setVicName] = useState(session.name || '');
  const [vicPhone, setVicPhone] = useState(session.phone || '');
  const [vicNationalId, setVicNationalId] = useState(session.nationalId || '');
  const [vicDriverPhone, setVicDriverPhone] = useState('');
  const [vicDriverNationalId, setVicDriverNationalId] = useState('');
  const [vicLicenseNo, setVicLicenseNo] = useState('');
  const [vicCarType, setVicCarType] = useState('');
  const [vicCarColor, setVicCarColor] = useState('');
  const [vicPolicyNo, setVicPolicyNo] = useState('');
  const [vicPolicyCompany, setVicPolicyCompany] = useState('');
  const [vicPolicyExpiry, setVicPolicyExpiry] = useState('');
  const [vicCoverageFinancial, setVicCoverageFinancial] = useState(0);
  const [vicCoverageBodily, setVicCoverageBodily] = useState(0);
  const [vicCoverageDriver, setVicCoverageDriver] = useState(0);
  const [vicP1, setVicP1] = useState('');
  const [vicPLetter, setVicPLetter] = useState('ب');
  const [vicP2, setVicP2] = useState('');
  const [vicP3, setVicP3] = useState('');
  const [vicVin, setVicVin] = useState('');
  const [vicInsurer, setVicInsurer] = useState('dana');
  const [vicInquired, setVicInquired] = useState(false);
  const [vicInquiryModalOpen, setVicInquiryModalOpen] = useState(false);
  const [vicInquiring, setVicInquiring] = useState(false);

  // Step 5 state (Culprit / Other Party / Party Two - starts completely empty)
  const [fltIsDriverSameOwner, setFltIsDriverSameOwner] = useState<boolean>(true); // true = مالک و راننده یک نفر, false = دو نفر متفاوت
  const [fltName, setFltName] = useState('');
  const [fltPhone, setFltPhone] = useState('');
  const [fltNationalId, setFltNationalId] = useState('');
  const [fltDriverPhone, setFltDriverPhone] = useState('');
  const [fltDriverNationalId, setFltDriverNationalId] = useState('');
  const [fltLicenseNo, setFltLicenseNo] = useState('');
  const [fltCarType, setFltCarType] = useState('');
  const [fltCarColor, setFltCarColor] = useState('');
  const [fltPolicyNo, setFltPolicyNo] = useState('');
  const [fltPolicyCompany, setFltPolicyCompany] = useState('');
  const [fltPolicyExpiry, setFltPolicyExpiry] = useState('');
  const [fltCoverageFinancial, setFltCoverageFinancial] = useState(0);
  const [fltCoverageBodily, setFltCoverageBodily] = useState(0);
  const [fltCoverageDriver, setFltCoverageDriver] = useState(0);
  const [fltP1, setFltP1] = useState('');
  const [fltPLetter, setFltPLetter] = useState('ج');
  const [fltP2, setFltP2] = useState('');
  const [fltP3, setFltP3] = useState('');
  const [fltVin, setFltVin] = useState('');
  const [fltInsurer, setFltInsurer] = useState('dana');
  const [fltInquired, setFltInquired] = useState(false);
  const [fltInquiryModalOpen, setFltInquiryModalOpen] = useState(false);
  const [fltInquiring, setFltInquiring] = useState(false);

  // Quadruple Inquiries State (Sanhab, Fanavaran Core, Police Croqui, Civil Registry)
  const [activeQuadrupleInquiries, setActiveQuadrupleInquiries] = useState<QuadrupleInquiries | null>(null);
  const [quadrupleModalOpen, setQuadrupleModalOpen] = useState(false);
  const [quadrupleTargetParty, setQuadrupleTargetParty] = useState<'vic' | 'flt'>('vic');

  // Field validation and warning state
  const [validationErrors, setValidationErrors] = useState<WizardValidationError[]>([]);

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find((e) => e.field === fieldName)?.message;
  };

  const clearFieldError = (fieldName: string) => {
    setValidationErrors((prev) => prev.filter((e) => e.field !== fieldName));
  };

  const clearFieldErrors = (fieldNames: string[]) => {
    setValidationErrors((prev) => prev.filter((e) => !fieldNames.includes(e.field)));
  };

  const validateStep = (step: number): WizardValidationError[] => {
    const errors: WizardValidationError[] = [];

    if (step === 1) {
      if (!agreePolicy) {
        errors.push({ field: 'agreePolicy', message: 'پذیرش شرایط و قوانین عمومی ثبت آنلاین خسارت الزامی است.' });
      }
      if (!accidentTypeKey) {
        errors.push({ field: 'accidentType', message: 'انتخاب نوع حادثه الزامی است.' });
      }

      // اگر حادثه مربوط به بیمه بدنه باشد، ادامه مرحله در سامانه شخص ثالث مسدود است
      if (isBodyClaim) {
        errors.push({
          field: 'accidentType',
          message: 'این سانحه مشمول بیمه بدنه خودرو است و در سامانه شخص ثالث قابل ثبت نیست. جهت ثبت پرونده مستقیماً به پورتال بیمه بدنه مراجعه فرمایید.'
        });
        return errors;
      }

      // حوادثی مانند سرقت و آتش‌سوزی کروکی راهور ندارند و گزارش رسمی جایگزین لازم دارند.
      if (needsAlternativeReport) {
        if (!incidentReportCode.trim()) {
          errors.push({
            field: 'incidentReportCode',
            message: `ثبت شماره پرونده / کد رهگیری ${accidentRule?.reportLabel || 'گزارش رسمی'} الزامی است.`
          });
        }
        const hasReportFile =
          !!getFileForLabel('گزارش رسمی حادثه') ||
          files.some((f) => f.name?.includes('گزارش ۱۱۰') || f.name?.includes('گزارش رسمی'));
        if (!hasReportFile) {
          errors.push({
            field: 'incidentReportFile',
            message: `بارگذاری تصویر/PDF ${accidentRule?.reportLabel || 'گزارش رسمی حادثه'} الزامی است.`
          });
        }
      } else {
        if (hasKroki === null) {
          errors.push({ field: 'hasKroki', message: 'مشخص نمودن وضعیت کروکی پلیس راهور (دارد یا ندارد) الزامی است.' });
        } else if (hasKroki === false && croquiRequirement.mandatory) {
          errors.push({
            field: 'hasKroki',
            message:
              'با توجه به شرایط اعلامی، ارائه کروکی پلیس راهور برای این حادثه الزامی است و ثبت پرونده بدون کروکی امکان‌پذیر نیست.'
          });
        } else if (hasKroki === true) {
          if (croquiType === 'electronic') {
            if (!krokiCode.trim()) {
              errors.push({ field: 'krokiCode', message: 'شماره سریال کروکی / کد پیگیری پیامک‌شده الزامی است.' });
            }
          } else if (croquiType === 'paper') {
            const hasPaperDoc =
              !!getFileForLabel('بارگذاری تصویر برگه کروکی کاغذی') ||
              !!getFileForLabel('تصویر برگه کروکی کاغذی') ||
              !!getFileForLabel('عکس کروکی') ||
              !!getFileForLabel('برگه کروکی') ||
              !!croquiData ||
              files.some((f) => f.name?.includes('کاغذی') || f.name?.includes('کروکی'));
            if (!hasPaperDoc) {
              errors.push({ field: 'paperCroqui', message: 'بارگذاری تصویر یا PDF برگه کروکی کاغذی پلیس راهور الزامی است.' });
            }
          } else if (croquiType === 'judicial') {
            const hasJudicialDoc =
              !!getFileForLabel('بارگذاری تصویر/PDF گزارش کارشناس') ||
              !!getFileForLabel('گزارش کارشناس دادگستری') ||
              !!getFileForLabel('عکس کروکی') ||
              !!getFileForLabel('عکس برگه گزارش پلیس') ||
              !!croquiData ||
              files.some((f) => f.name?.includes('کارشناس') || f.name?.includes('قضایی') || f.name?.includes('دادگستری'));
            if (!hasJudicialDoc) {
              errors.push({ field: 'judicialCroqui', message: 'بارگذاری تصویر/PDF گزارش کارشناس الزامی است.' });
            }
          }
        }
      }
    }

    if (step === 2) {
      if (!accidentDateTime || !accidentDateTime.trim()) {
        errors.push({ field: 'accidentDateTime', message: 'ثبت تاریخ و ساعت دقیق وقوع تصادف الزامی است.' });
      }
      if (!address || address.trim().length < 5) {
        errors.push({ field: 'address', message: 'ورود آدرس دقیق محل وقوع تصادف (حداقل ۵ حرف) الزامی است.' });
      }
    }

    if (step === 3) {
      const hasPlate = !!getFileForLabel('پلاک');
      if (!hasPlate) {
        errors.push({ field: 'photo_plate', message: 'بارگذاری تصویر واضح از پلاک خودرو الزامی است.' });
      }
      const hasDamage = ['خسارت ۱', 'خسارت ۲', 'جلو', 'عقب', 'راست', 'چپ', 'سقف'].some((lbl) => !!getFileForLabel(lbl));
      if (!hasDamage) {
        errors.push({
          field: 'photo_damage',
          message: 'بارگذاری حداقل یک تصویر از زوایای خودرو و محل آسیب‌دیدگی الزامی است.'
        });
      }
      const hasDoc = !!getFileForLabel('عکس کارت ماشین') || !!getFileForLabel('عکس از شماره شاسی');
      if (!hasDoc) {
        errors.push({ field: 'vehicle_card', message: 'بارگذاری تصویر کارت خودرو (یا برگ سبز) الزامی است.' });
      }
      // متن اظهارات الزامی است؛ فایل صوتی به‌تنهایی وجاهت قانونی ندارد.
      const statementCheck = validateStatementText(writtenReport);
      if (!statementCheck.valid) {
        errors.push({ field: 'description', message: statementCheck.error || 'ثبت متن اظهارات الزامی است.' });
      }
    }

    if (step === 4) {
      if (!vicName.trim() || vicName.trim().length < 2) {
        errors.push({ field: 'vicName', message: 'نام و نام خانوادگی مالک / شما الزامی است.' });
      }
      const cleanPhone = vicPhone.replace(/\D/g, '');
      if (!vicPhone.trim() || cleanPhone.length < 10) {
        errors.push({ field: 'vicPhone', message: 'شماره تلفن همراه معتبر (۱۱ رقمی با فرمت 09...) الزامی است.' });
      }
      if (!vicIsDriverSameOwner) {
        if (!vicNationalId.trim()) {
          errors.push({ field: 'vicNationalId', message: 'کد ملی مالک الزامی است.' });
        }
        const cleanDriverPhone = vicDriverPhone.replace(/\D/g, '');
        if (!vicDriverPhone.trim() || cleanDriverPhone.length < 10) {
          errors.push({ field: 'vicDriverPhone', message: 'شماره موبایل راننده زمان حادثه الزامی است.' });
        }
        if (!vicDriverNationalId.trim()) {
          errors.push({ field: 'vicDriverNationalId', message: 'کد ملی راننده زمان حادثه الزامی است.' });
        }
      }
      const vicPlateFilled =
        vicP1.trim().length >= 2 &&
        vicPLetter.trim().length >= 1 &&
        vicP2.trim().length >= 3 &&
        vicP3.trim().length >= 2;
      if (!vicPlateFilled) {
        errors.push({ field: 'vicPlate', message: 'تکمیل تمامی ۴ بخش شماره پلاک خودروی شما الزامی است.' });
      }
      const vicFrontLicense =
        getFileForLabel(`عکس روی گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`) ||
        files.find((f) => f.name?.includes('روی گواهینامه') && (f.name?.includes('شما') || f.name?.includes('زیان‌دیده')));
      if (!vicFrontLicense) {
        errors.push({ field: 'vicFrontLicense', message: 'بارگذاری تصویر روی گواهینامه راننده (شما) الزامی است.' });
      }
      const vicBackLicense =
        getFileForLabel(`عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`) ||
        files.find((f) => f.name?.includes('پشت گواهینامه') && (f.name?.includes('شما') || f.name?.includes('زیان‌دیده')));
      if (!vicBackLicense) {
        errors.push({ field: 'vicBackLicense', message: 'بارگذاری تصویر پشت گواهینامه راننده (شما) الزامی است.' });
      }
    }

    if (step === 5) {
      if (!fltName.trim() || fltName.trim().length < 2) {
        errors.push({ field: 'fltName', message: 'نام مالک یا راننده طرف مقابل الزامی است.' });
      }
      const cleanFltPhone = fltPhone.replace(/\D/g, '');
      if (!fltPhone.trim() || cleanFltPhone.length < 10) {
        errors.push({
          field: 'fltPhone',
          message: 'شماره تلفن همراه طرف مقابل (جهت اتصال به پرونده مشترک) الزامی است.'
        });
      }
      if (!fltIsDriverSameOwner) {
        if (!fltNationalId.trim()) {
          errors.push({ field: 'fltNationalId', message: 'کد ملی مالک طرف مقابل الزامی است.' });
        }
        const cleanFltDriverPhone = fltDriverPhone.replace(/\D/g, '');
        if (!fltDriverPhone.trim() || cleanFltDriverPhone.length < 10) {
          errors.push({ field: 'fltDriverPhone', message: 'شماره موبایل راننده طرف مقابل الزامی است.' });
        }
        if (!fltDriverNationalId.trim()) {
          errors.push({ field: 'fltDriverNationalId', message: 'کد ملی راننده طرف مقابل الزامی است.' });
        }
      }
      const fltPlateFilled =
        fltP1.trim().length >= 2 &&
        fltPLetter.trim().length >= 1 &&
        fltP2.trim().length >= 3 &&
        fltP3.trim().length >= 2;
      if (!fltPlateFilled) {
        errors.push({ field: 'fltPlate', message: 'تکمیل تمامی ۴ بخش پلاک خودروی طرف مقابل الزامی است.' });
      }
      const fltFrontLicense =
        getFileForLabel(`عکس روی گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`) ||
        files.find((f) => f.name?.includes('روی گواهینامه') && (f.name?.includes('طرف مقابل') || f.name?.includes('مقصر')));
      if (!fltFrontLicense) {
        errors.push({
          field: 'fltFrontLicense',
          message: 'بارگذاری تصویر روی گواهینامه راننده طرف مقابل الزامی است.'
        });
      }
      const fltBackLicense =
        getFileForLabel(`عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`) ||
        files.find((f) => f.name?.includes('پشت گواهینامه') && (f.name?.includes('طرف مقابل') || f.name?.includes('مقصر')));
      if (!fltBackLicense) {
        errors.push({
          field: 'fltBackLicense',
          message: 'بارگذاری تصویر پشت گواهینامه راننده طرف مقابل الزامی است.'
        });
      }
    }

    return errors;
  };

  const handleProceedToStep = (targetStep: number) => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      setValidationErrors(errors);
      showRequiredDocsError(`لطفاً ${toFaDigits(errors.length)} مورد الزامی مشخص‌شده را تکمیل فرمایید.`);
      setTimeout(() => {
        const firstErrField = errors[0]?.field;
        const fieldEl = firstErrField ? document.getElementById(`field-${firstErrField}`) : null;
        const targetEl = fieldEl || document.getElementById('wizard-validation-alert') || document.getElementById('wizard-header-container');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 80, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    setValidationErrors([]);
    setRequiredDocsError(null);
    setCurrentStep(targetStep);
    const el = document.getElementById('wizard-header-container');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 80, behavior: 'smooth' });
  };

  // Central Quadruple Inquiry Trigger for Party One (Victim / You)
  const handleOpenVicInquiry = async () => {
    setVicInquiring(true);
    setQuadrupleTargetParty('vic');
    const pStr = `${vicP1 || '۱۲'}${vicPLetter || 'ب'}${vicP2 || '۳۴۵'}-ایران${vicP3 || '۱۱'}`;
    const realOrEnteredNationalId = vicNationalId || session.nationalId || '0012345678';
    const cType = vicCarType || 'پژو ۲۰۶';

    const inq = await executeQuadrupleInquiries({
      nationalId: realOrEnteredNationalId,
      fullName: vicName || session.name || 'علیرضا تقوی',
      phone: vicPhone || session.phone || '09224511513',
      plate: pStr,
      carType: cType,
      insurerName: vicPolicyCompany || 'بیمه دانا',
      croquiCode: krokiCode || croquiData?.reportNumber,
      isCulprit: wizardRole === 'culprit',
    });

    setActiveQuadrupleInquiries(inq);
    setVicInquiring(false);

    // Auto-fill and lock records in case state
    if (!vicName) setVicName(inq.civilRegistry.details.fullName || session.name || 'علیرضا تقوی');
    if (!vicPhone) setVicPhone(session.phone || '09224511513');
    setVicNationalId(inq.civilRegistry.details.nationalId);
    setVicLicenseNo(vicLicenseNo || inq.civilRegistry.details.drivingLicenseNumber || '9876543');
    setVicCarType(cType);
    setVicCarColor(vicCarColor || 'سفید');
    setVicPolicyNo(inq.sanhab.details.policyNumber || 'DAN-1403-994821');
    setVicPolicyCompany(inq.sanhab.details.insurerName || 'بیمه دانا');
    setVicPolicyExpiry(vicPolicyExpiry || '1404/01/15');
    setVicCoverageFinancial(Number(inq.sanhab.details.financialCeiling) || 50000000);
    setVicCoverageBodily(Number(inq.sanhab.details.bodilyCeiling) || 1600000000);
    setVicCoverageDriver(900000000);
    if (!vicP1) setVicP1('۱۲');
    if (!vicPLetter) setVicPLetter('ب');
    if (!vicP2) setVicP2('۳۴۵');
    if (!vicP3) setVicP3('۱۱');
    const assignedVin = inq.chassisVin || generateDeterministicVin(pStr, cType);
    setVicVin(assignedVin);
    setVicInquired(true);
    setQuadrupleModalOpen(true);
  };

  // Central Quadruple Inquiry Trigger for Party Two (Culprit / Other Party)
  const handleOpenFltInquiry = async () => {
    setFltInquiring(true);
    setQuadrupleTargetParty('flt');
    const pStr = `${fltP1 || '۴۵'}${fltPLetter || 'ج'}${fltP2 || '۷۸۹'}-ایران${fltP3 || '۳۳'}`;
    const cType = fltCarType || 'سمند LX';

    const inq = await executeQuadrupleInquiries({
      nationalId: fltNationalId || '0087654321',
      fullName: fltName || 'رضا احمدی',
      phone: fltPhone || '09129876543',
      plate: pStr,
      carType: cType,
      insurerName: fltPolicyCompany || 'بیمه دانا',
      croquiCode: krokiCode || croquiData?.reportNumber,
      isCulprit: wizardRole !== 'culprit',
    });

    setActiveQuadrupleInquiries(inq);
    setFltInquiring(false);

    // Auto-fill and lock records in case state
    setFltName(inq.civilRegistry.details.fullName || 'رضا احمدی');
    setFltPhone(fltPhone || '09129876543');
    setFltNationalId(inq.civilRegistry.details.nationalId);
    setFltLicenseNo(fltLicenseNo || inq.civilRegistry.details.drivingLicenseNumber || '87654321');
    setFltCarType(cType);
    setFltCarColor(fltCarColor || 'مشکی');
    setFltPolicyNo(inq.sanhab.details.policyNumber || 'DAN-1403-883194');
    setFltPolicyCompany(inq.sanhab.details.insurerName || 'بیمه دانا');
    setFltPolicyExpiry(fltPolicyExpiry || '1404/05/20');
    setFltCoverageFinancial(Number(inq.sanhab.details.financialCeiling) || 50000000);
    setFltCoverageBodily(Number(inq.sanhab.details.bodilyCeiling) || 1600000000);
    setFltCoverageDriver(900000000);
    if (!fltP1) setFltP1('۴۵');
    if (!fltPLetter) setFltPLetter('ج');
    if (!fltP2) setFltP2('۷۸۹');
    if (!fltP3) setFltP3('۳۳');
    const assignedVin = inq.chassisVin || generateDeterministicVin(pStr, cType);
    setFltVin(assignedVin);
    setFltInquired(true);
    setQuadrupleModalOpen(true);
  };

  // Barcode VIN Scanner Camera Simulation state
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'vic' | 'flt' | null>(null);
  const [scannerProgress, setScannerProgress] = useState(0);
  const [scannerSuccess, setScannerSuccess] = useState(false);

  const startBarcodeScanner = (target: 'vic' | 'flt') => {
    setScannerTarget(target);
    setScannerModalOpen(true);
    setScannerProgress(0);
    setScannerSuccess(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setScannerProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setScannerSuccess(true);
        // Generate simulated VIN
        const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
        let code = 'IR';
        for (let i = 0; i < 15; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        
        setTimeout(() => {
          if (target === 'vic') setVicVin(code);
          else setFltVin(code);
          setScannerModalOpen(false);
        }, 1000);
      }
    }, 300);
  };

  // Leaflet Map Ref
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    let timer: any;
    if (currentStep === 2 && mapRef.current) {
      if (leafletMap.current) {
        try {
          leafletMap.current.remove();
        } catch {
          // ignore cleanup error
        }
        leafletMap.current = null;
      }

      timer = setTimeout(() => {
        if (!mapRef.current) return;
        if ((mapRef.current as any)._leaflet_id) {
          (mapRef.current as any)._leaflet_id = null;
        }

        try {
          const mapInstance = L.map(mapRef.current).setView([lat, lng], 14);
          leafletMap.current = mapInstance;

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
          }).addTo(mapInstance);

          const defaultMarkerIcon = L.icon({
            iconUrl: leafletMarkerIcon,
            iconRetinaUrl: leafletMarkerIcon2x,
            shadowUrl: leafletMarkerShadow,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          const markerInstance = L.marker([lat, lng], { icon: defaultMarkerIcon }).addTo(mapInstance);
          markerRef.current = markerInstance;

          mapInstance.on('click', (e: L.LeafletMouseEvent) => {
            const { lat: newLat, lng: newLng } = e.latlng;
            setLat(newLat);
            setLng(newLng);
            if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
            fetchAddressFromCoords(newLat, newLng);
          });
        } catch (err) {
          console.warn('Leaflet map initialization skipped or handled:', err);
        }
      }, 200);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (leafletMap.current) {
        try {
          leafletMap.current.remove();
        } catch {
          // ignore
        }
        leafletMap.current = null;
      }
    };
  }, [currentStep]);

  const handleGetCurrentGPS = () => {
    setGpsLoading(true);
    setGpsStatusMsg(null);

    if (!navigator.geolocation) {
      setGpsLoading(false);
      fetchAddressFromCoords(lat, lng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        if (leafletMap.current) leafletMap.current.setView([latitude, longitude], 16);
        if (markerRef.current) markerRef.current.setLatLng([latitude, longitude]);
        fetchAddressFromCoords(latitude, longitude);
      },
      () => {
        setGpsLoading(false);
        fetchAddressFromCoords(lat, lng);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await compressImageFile(file, 1000, 0.7);
      setFiles((prev) => [
        ...prev.filter((f) => f.name !== label),
        {
          name: label,
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image',
          dataUrl,
          fileName: file.name
        }
      ]);
    }
  };

  const handleSimulateScanVIN = (target: 'vic' | 'flt') => {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let code = 'IR';
    for (let i = 0; i < 15; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    if (target === 'vic') setVicVin(code);
    else setFltVin(code);
  };

  const handleFinishWizard = () => {
    // Validate all Step 5 fields
    const errors = validateStep(5);
    if (errors.length > 0) {
      setValidationErrors(errors);
      showRequiredDocsError(`امکان ثبت نهایی وجود ندارد؛ لطفاً ${toFaDigits(errors.length)} مورد الزامی مشخص‌شده را تکمیل فرمایید.`);
      setTimeout(() => {
        const firstErrField = errors[0]?.field;
        const fieldEl = firstErrField ? document.getElementById(`field-${firstErrField}`) : null;
        const targetEl = fieldEl || document.getElementById('wizard-validation-alert') || document.getElementById('wizard-header-container');
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: 80, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    setValidationErrors([]);
    setRequiredDocsError(null);

    // Validate driver license photos for both parties (mandatory)
    const vicFrontLicense = getFileForLabel(`عکس روی گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`) || files.find(f => f.name?.includes('روی گواهینامه') && (f.name?.includes('شما') || f.name?.includes('زیان‌دیده')));
    const vicBackLicense = getFileForLabel(`عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`) || files.find(f => f.name?.includes('پشت گواهینامه') && (f.name?.includes('شما') || f.name?.includes('زیان‌دیده')));
    
    const fltFrontLicense = getFileForLabel(`عکس روی گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`) || files.find(f => f.name?.includes('روی گواهینامه') && (f.name?.includes('طرف مقابل') || f.name?.includes('مقصر')));
    const fltBackLicense = getFileForLabel(`عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`) || files.find(f => f.name?.includes('پشت گواهینامه') && (f.name?.includes('طرف مقابل') || f.name?.includes('مقصر')));

    if (!vicFrontLicense || !vicBackLicense) {
      showRequiredDocsError('بارگذاری عکس پشت و روی گواهینامه راننده (شما) الزامی است؛ لطفاً در مرحله ۴ تکمیل نمایید.');
      setCurrentStep(4);
      return;
    }

    if (!fltFrontLicense || !fltBackLicense) {
      showRequiredDocsError('بارگذاری عکس پشت و روی گواهینامه راننده طرف مقابل الزامی است.');
      return;
    }

    // اعتبارسنجی مجدد متن اظهارات پیش از اخذ تأییدیه رسمی
    const statementCheck = validateStatementText(writtenReport);
    if (!statementCheck.valid) {
      showRequiredDocsError(statementCheck.error || 'ثبت متن اظهارات الزامی است.');
      setCurrentStep(3);
      return;
    }

    // دروازه حقوقی: بدون تأییدیه رسمی اظهارات، پرونده تشکیل نمی‌شود.
    if (!confirmedStatement) {
      setStatementOtp('');
      setEnteredStatementOtp('');
      setStatementOtpSent(false);
      setStatementOtpError(null);
      setStatementAgreed(false);
      setShowStatementModal(true);
      return;
    }

    finalizeCase(confirmedStatement);
  };

  const finalizeCase = (signedStatement: PartyStatement) => {
    // این مقادیر پس از تفکیک تابع ثبت نهایی، مجدداً در این محدوده محاسبه می‌شوند.
    const vicFrontLicense = getFileForLabel(`عکس روی گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`) || files.find(f => f.name?.includes('روی گواهینامه') && (f.name?.includes('شما') || f.name?.includes('زیان‌دیده')));
    const vicBackLicense = getFileForLabel(`عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`) || files.find(f => f.name?.includes('پشت گواهینامه') && (f.name?.includes('شما') || f.name?.includes('زیان‌دیده')));
    const fltFrontLicense = getFileForLabel(`عکس روی گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`) || files.find(f => f.name?.includes('روی گواهینامه') && (f.name?.includes('طرف مقابل') || f.name?.includes('مقصر')));
    const fltBackLicense = getFileForLabel(`عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`) || files.find(f => f.name?.includes('پشت گواهینامه') && (f.name?.includes('طرف مقابل') || f.name?.includes('مقصر')));

    const trackingCode = generateTrackingCode();
    const vicPlateStr = `${vicP1}-${vicPLetter}-${vicP2}-ایران-${vicP3}`;
    const fltPlateStr = `${fltP1}-${fltPLetter}-${fltP2}-ایران-${fltP3}`;

    const isCulprit = wizardRole === 'culprit';
    const rawCulpritCompany = isCulprit ? (vicPolicyCompany || vicInsurer) : (fltPolicyCompany || fltInsurer);
    const culpritInsurerName = getInsurerPersianName(rawCulpritCompany);

    let status: CaseStatus = 'در انتظار ارجاع به ارزیاب';
    let historyNote = '';

    if (hasKroki) {
      status = 'در انتظار ارجاع به ارزیاب';
      historyNote = `استعلام خودکار با موفقیت انجام شد؛ پرونده همراه با کروکی راهور به ${culpritInsurerName} ارجاع گردید و در انتظار تخصیص ارزیاب است.`;
    } else if (futurePolice === true) {
      status = 'ثبت موقت - در انتظار افزودن کروکی';
      historyNote = 'ثبت موقت پرونده؛ در انتظار حضور پلیس و ثبت کد کروکی توسط مشتری';
    } else {
      status = 'در انتظار ارجاع به کارشناس میدانی';
      historyNote = `استعلام خودکار بیمه‌نامه با موفقیت انجام شد؛ پرونده بدون کروکی به ${culpritInsurerName} ارجاع گردید و بر اساس ضوابط بیمه مرکزی نیازمند ارجاع به کارشناس میدانی جهت بازدید حضوری است.`;
    }

    // Party 1 is ALWAYS the person creating the wizard (Step 4 "شما")
    const p1Name = vicName || session.name || (isCulprit ? 'راننده مقصر' : 'راننده زیان‌دیده');
    const p1Phone = vicPhone || session.phone || '۰۹۱۲۰۰۰۰۰۰۰';
    const p1NationalId = vicNationalId || session.nationalId || '';
    const p1Role = isCulprit ? 'مقصر' : 'زیان‌دیده';

    // Party 2 is ALWAYS the other party entered in Step 5 ("طرف مقابل")
    const p2Name = fltName || (isCulprit ? 'راننده زیان‌دیده' : 'راننده مقصر');
    const p2Phone = fltPhone || '۰۹۱۹۰۰۰۰۰۰۰';
    const p2NationalId = fltNationalId || '';
    const p2Role = isCulprit ? 'زیان‌دیده' : 'مقصر';

    // Map victim and culprit details accurately
    const victimNameVal = isCulprit ? p2Name : p1Name;
    const victimPhoneVal = isCulprit ? p2Phone : p1Phone;
    const victimNationalIdVal = isCulprit ? p2NationalId : p1NationalId;
    const victimPlateVal = isCulprit ? fltPlateStr : vicPlateStr;
    const victimVinVal = isCulprit ? fltVin : vicVin;
    const victimInsurerVal = isCulprit ? fltInsurer : vicInsurer;
    const victimCarTypeVal = isCulprit ? (fltCarType || 'پژو ۲۰۶') : (vicCarType || 'پژو ۲۰۶');

    const culpritNameVal = isCulprit ? p1Name : p2Name;
    const culpritPhoneVal = isCulprit ? p1Phone : p2Phone;
    const culpritNationalIdVal = isCulprit ? p1NationalId : p2NationalId;
    const culpritPlateVal = isCulprit ? vicPlateStr : fltPlateStr;
    const culpritVinVal = isCulprit ? vicVin : fltVin;
    const culpritInsurerVal = isCulprit ? vicInsurer : fltInsurer;
    const culpritCarTypeVal = isCulprit ? (vicCarType || 'پژو پارس') : (fltCarType || 'پژو پارس');

    const newCase: ClaimCase = {
      id: trackingCode,
      date: accidentDateTime,
      address: address,
      lat: lat,
      lng: lng,
      partyOneName: p1Name,
      partyOnePhone: p1Phone,
      partyOneNationalId: p1NationalId,
      partyOneRole: p1Role,
      partyTwoName: p2Name,
      partyTwoPhone: p2Phone,
      partyTwoNationalId: p2NationalId,
      partyTwoRole: p2Role,
      isSharedCase: true,
      isBodily: isBodyClaim || undefined,
      isBodyClaim: isBodyClaim || undefined,
      insuranceType: isBodyClaim ? 'body' : 'third_party',
      claimDepartment: isBodyClaim ? 'BODY_INSURANCE_UNIT' : 'THIRD_PARTY_UNIT',
      claimDepartmentLabel: isBodyClaim ? 'واحد رسیدگی خسارت بیمه بدنه' : 'واحد رسیدگی خسارت شخص ثالث',
      bodyPolicyNumber: isBodyClaim ? (bodyPolicyNumber || (isCulprit ? vicPolicyNo : fltPolicyNo)) : undefined,
      bodyPolicyCardPhoto: isBodyClaim ? (bodyPolicyCardPhoto || undefined) : undefined,
      bodyClaimCountThisYear: isBodyClaim ? bodyClaimCountThisYear : undefined,
      bodyPolicyLessThan30Days: isBodyClaim ? bodyPolicyLessThan30Days : undefined,
      bodyCroquiReasons: isBodyClaim ? bodyCroquiRequirement.reasons : undefined,

      // --- قوانین کروکی، نوع حادثه و سقف تعهدات ---
      accidentTypeKey: accidentTypeKey || undefined,
      accidentTypeLabel: accidentRule?.label,
      estimatedDamageToman: estimatedDamageToman || undefined,
      croquiRequired: croquiRequirement.mandatory,
      croquiRequirementReasons: croquiRequirement.reasons.length ? croquiRequirement.reasons : undefined,
      mandatoryCroquiConditionIds: selectedConditionIds.length ? selectedConditionIds : undefined,
      incidentReport: needsAlternativeReport
        ? {
            kind: croquiRequirement.reportKind,
            label: croquiRequirement.reportLabel,
            trackingCode: incidentReportCode.trim() || undefined,
            issuedAt: accidentDateTime,
            file:
              getFileForLabel('گزارش رسمی حادثه') ||
              files.find((f) => f.name?.includes('گزارش ۱۱۰') || f.name?.includes('گزارش رسمی'))
          }
        : undefined,

      // --- مستندسازی حقوقی اظهارات طرفین ---
      partyStatements: [
        signedStatement,
        buildPendingStatementRequest({
          party: 'PARTY_TWO',
          role: p2Role,
          fullName: p2Name,
          phone: p2Phone,
          nationalId: p2NationalId
        })
      ],
      victimPhone: victimPhoneVal,
      victimName: victimNameVal,
      victimNationalId: victimNationalIdVal,
      victimPlate: victimPlateVal,
      victimVin: victimVinVal || generateDeterministicVin(victimPlateVal, victimCarTypeVal),
      victimInsurer: victimInsurerVal,
      culpritPhone: culpritPhoneVal,
      culpritName: culpritNameVal,
      culpritNationalId: culpritNationalIdVal,
      culpritPlate: culpritPlateVal,
      culpritVin: culpritVinVal || generateDeterministicVin(culpritPlateVal, culpritCarTypeVal),
      culpritInsurer: culpritInsurerVal,
      chassisLocked: true,
      chassisSource: 'استخراج‌شده در مرحله نخست پرونده و استعلامات چهارگانه',
      quadrupleInquiries: activeQuadrupleInquiries || undefined,
      carType: victimCarTypeVal,
      culpritCarType: culpritCarTypeVal,
      plate: victimPlateVal,
      culpritPolicyNo: isCulprit ? (vicPolicyNo || 'AL-1401-883') : (fltPolicyNo || 'AL-1401-883'),
      culpritPolicyExpiry: isCulprit ? (vicPolicyExpiry || '۱۴۰۶/۰۵/۲۰') : (fltPolicyExpiry || '۱۴۰۶/۰۵/۲۰'),
      culpritCoverageFinancial: isCulprit ? (vicCoverageFinancial || 50000000) : (fltCoverageFinancial || 50000000),
      culpritCoverageBodily: isCulprit ? (vicCoverageBodily || 300000000) : (fltCoverageBodily || 300000000),
      culpritCoverageDriver: isCulprit ? (vicCoverageDriver || 100000000) : (fltCoverageDriver || 100000000),
      culpritPolicyVerified: true,
      victimPolicyVerified: true,
      culpritFaultPercent: 100,
      status: status,
      priority: 'normal',
      pendingApprovalPhone: victimPhoneVal,
      pendingApprovalRole: 'زیان‌دیده',
      approved: !!hasKroki,
      hasKroki: !!hasKroki,
      croquiType: hasKroki ? (croquiType || croquiData?.croquiType || 'electronic') : undefined,
      futurePoliceExpected: futurePolice,
      needsCulpritFieldVisit: !hasKroki && futurePolice === false,
      sceneReportCode: krokiCode || croquiData?.reportNumber || (hasKroki ? `KR-${Math.floor(100000 + Math.random() * 900000)}` : undefined),
      croquiData: hasKroki ? (croquiData || {
        croquiType: croquiType || 'electronic',
        isValidDocument: true,
        confidenceScore: 0.98,
        reportNumber: krokiCode || `KR-${Math.floor(100000 + Math.random() * 900000)}`,
        incidentDate: accidentDateTime || `${new Date().toLocaleDateString('fa-IR')} - ۱۰:۴۵`,
        location: address || 'تهران',
        accidentType: 'تصادف خسارتی دو خودرو (عدم رعایت فاصله طولی و برخورد جلو به عقب)',
        roadCondition: 'آسفالت خشک و هموار، شرایط جوی صاف، روشنایی روز',
        briefDescription: writtenReport || `برخورد خودرو ${culpritCarTypeVal || 'مقصر'} با عقب خودرو ${victimCarTypeVal || 'زیان‌دیده'}`,
        faultDetermination: `۱۰۰٪ مقصر حادثه: راننده خودرو ${culpritCarTypeVal || 'مقصر'} (${culpritNameVal}) به علت عدم توجه به جلو`,
        faultDriver: {
          fullName: culpritNameVal || 'راننده مقصر',
          nationalId: culpritNationalIdVal || '۰۰۷۱۶۲۵۳۴۲',
          plateNumber: culpritPlateVal || '۱۲ ب ۳۴۵ - ایران ۱۱',
          insurancePolicyNumber: (isCulprit ? vicPolicyNo : fltPolicyNo) || 'POL-1405-9921'
        },
        victimDriver: {
          fullName: victimNameVal || 'زیان‌دیده',
          nationalId: victimNationalIdVal || '۰۰۸۲۹۱۷۳۶۴',
          plateNumber: victimPlateVal || '۴۴ ج ۷۸۹ - ایران ۲۲',
          insurancePolicyNumber: (isCulprit ? fltPolicyNo : vicPolicyNo) || 'POL-1405-1102'
        },
        policeBadgeId: 'POL-88219',
        officerName: 'سروان مهدی صادقی (کارشناس عالی تصادفات)',
        policeUnit: 'پلیس راهور فراجا',
        hasOfficialStamp: true,
        declaredRoleMatches: true,
        recommendedNextStep: 'PROCEED_TO_DAMAGE_PHOTOS',
        inquiryStatus: 'استعلام برخط فراجا: معتبر، فعال و ثبت شده در سامانه جامع تصادفات کشور',
        inquiryDate: `${new Date().toLocaleDateString('fa-IR')} ۱۱:۱۰ (برخط)`
      }) : undefined,
      policeReport: hasKroki ? {
        code: krokiCode || croquiData?.reportNumber || `KR-${Math.floor(100000 + Math.random() * 900000)}`,
        reportNumber: krokiCode || croquiData?.reportNumber || `KR-${Math.floor(100000 + Math.random() * 900000)}`,
        croquiType: croquiType || croquiData?.croquiType || 'electronic',
        officerName: 'سروان مهدی صادقی (کارشناس عالی تصادفات)',
        officerCode: 'POL-88219',
        unit: 'پلیس راهور فراجا',
        submittedAt: accidentDateTime || `${new Date().toLocaleDateString('fa-IR')} - ۱۰:۴۵`,
        incidentDateTime: accidentDateTime || `${new Date().toLocaleDateString('fa-IR')} - ۱۰:۴۵`,
        location: address || 'تهران',
        accidentType: 'تصادف خسارتی دو خودرو (عدم رعایت فاصله طولی و برخورد جلو به عقب)',
        roadCondition: 'آسفالت خشک و هموار، شرایط جوی صاف، روشنایی روز',
        briefDescription: writtenReport || `برخورد خودرو ${culpritCarTypeVal || 'مقصر'} با عقب خودرو ${victimCarTypeVal || 'زیان‌دیده'}`,
        faultDetermination: `۱۰۰٪ مقصر حادثه: راننده خودرو ${culpritCarTypeVal || 'مقصر'} (${culpritNameVal}) به علت عدم توجه به جلو`,
        faultDriverName: culpritNameVal,
        faultPlate: culpritPlateVal,
        victimDriverName: victimNameVal,
        victimPlate: victimPlateVal,
        noFaultDetermined: false,
        inquiryStatus: 'استعلام برخط فراجا: معتبر، فعال و ثبت شده در سامانه جامع تصادفات کشور',
        inquiryDate: `${new Date().toLocaleDateString('fa-IR')} ۱۱:۱۰ (برخط)`
      } : undefined,
      writtenReport: writtenReport,
      files: (() => {
        const seenUrls = new Set<string>();
        const seenNames = new Set<string>();
        return files.filter(f => {
          if (!f) return false;
          const url = (f.dataUrl || '').trim();
          const name = (f.name || f.fileName || '').trim();
          if (url && seenUrls.has(url)) return false;
          if (name && seenNames.has(name)) return false;
          if (url) seenUrls.add(url);
          if (name) seenNames.add(name);
          return true;
        });
      })(),
      audioExplanation: files.find(f => f.type === 'audio' || f.name?.includes('صوتی')) || (audioUrl ? { name: 'توضیحات صوتی', type: 'audio', dataUrl: audioUrl, fileName: 'voice_description.webm' } : undefined),
      videoExplanation: files.find(f => f.type === 'video' || f.name?.includes('ویدیو')),
      customerKrokiPhoto: croquiData?.fileUrl || files.find(f => f.name?.includes('کارشناس') || f.name?.includes('دادگستری') || f.name?.includes('کروکی'))?.dataUrl || undefined,
      customerPoliceReportFile: files.find(f => f.name?.includes('کارشناس') || f.name?.includes('دادگستری') || f.name?.includes('پلیس'))?.dataUrl || undefined,
      victimLicenseFrontPhoto: isCulprit ? fltFrontLicense?.dataUrl : vicFrontLicense?.dataUrl,
      victimLicenseBackPhoto: isCulprit ? fltBackLicense?.dataUrl : vicBackLicense?.dataUrl,
      culpritLicenseFrontPhoto: isCulprit ? vicFrontLicense?.dataUrl : fltFrontLicense?.dataUrl,
      culpritLicenseBackPhoto: isCulprit ? vicBackLicense?.dataUrl : fltBackLicense?.dataUrl,
      additionalDocs: (() => {
        const seenDocUrls = new Set<string>();
        const seenDocNames = new Set<string>();
        const docs: any[] = [];

        files.forEach((f, idx) => {
          if (!f) return;
          const url = (f.dataUrl || '').trim();
          const name = (f.name || f.fileName || `مدرک ${idx + 1}`).trim();
          if (url && seenDocUrls.has(url)) return;
          if (name && seenDocNames.has(name)) return;
          if (url) seenDocUrls.add(url);
          if (name) seenDocNames.add(name);

          const isPartyTwo = name.includes('طرف مقابل') || name.includes('مقابل');
          const uploaderParty = isPartyTwo ? ('PARTY_TWO' as const) : ('PARTY_ONE' as const);
          const uploaderRole = isPartyTwo ? (p2Role || 'طرف دوم') : (p1Role || 'طرف اول');
          const uploadedBy = isPartyTwo ? (p2Name || 'طرف مقابل') : (session.name || p1Name || 'ثبت‌کننده اولیه');

          docs.push({
            id: `wiz-doc-${idx}-${Date.now()}`,
            title: name,
            docType: f.type === 'audio' ? 'توضیحات صوتی' : f.type === 'video' ? 'ویدیو صحنه تصادف' : (f.name || 'مدرک ضمیمه'),
            dataUrl: f.dataUrl,
            url: f.dataUrl,
            uploadedBy: uploadedBy,
            uploaderRole: uploaderRole,
            uploaderParty: uploaderParty,
            uploadedAt: new Date().toLocaleDateString('fa-IR'),
            fileType: f.type as any,
            fileName: f.fileName,
            visibility: 'SHARED' as const
          });
        });

        if (isBodyClaim && bodyPolicyCardPhoto) {
          docs.push({
            id: `wiz-doc-bodycard-${Date.now()}`,
            title: 'کارت و تصویر بیمه‌نامه بدنه خودرو',
            docType: 'کارت بیمه بدنه',
            dataUrl: bodyPolicyCardPhoto,
            url: bodyPolicyCardPhoto,
            uploadedBy: session.name || p1Name || 'بیمه‌گذار بدنه',
            uploaderRole: 'بیمه‌گذار بدنه',
            uploaderParty: 'PARTY_ONE' as const,
            uploadedAt: new Date().toLocaleDateString('fa-IR'),
            fileType: 'image',
            fileName: 'body_insurance_card.jpg',
            visibility: 'SHARED' as const
          });
        }

        return docs;
      })(),
      createdAt: new Date().toISOString(),
      history: [
        {
          status: status,
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || p1Name,
          userRole: `طرف اول (${p1Role})`,
          uploaderParty: 'PARTY_ONE',
          note: `ایجاد پرونده مشترک در سامانه توسط طرف اول (${p1Role})؛ شماره موبایل طرف دوم (${p2Phone} - ${p2Name} / ${p2Role}) ثبت گردید.`
        },
        {
          status: status,
          time: new Date().toLocaleString('fa-IR'),
          user: 'سیستم AI',
          note: historyNote
        }
      ]
    };

    // ثبت موقت (در انتظار کروکی): هیچ ارجاعی انجام نمی‌شود؛
    // پس از ورود کد کروکی توسط مشتری، هوش مصنوعی کارشناس خسارت را بر اساس موقعیت تخصیص می‌دهد.
    if (status === 'ثبت موقت - در انتظار افزودن کروکی') {
      onComplete(newCase);
      return;
    }

    // Trigger AI Auto-Dispatcher to assign optimal expert and branch based on location and kroki
    const { updatedCase } = autoDispatchClaimWithAI(newCase);
    onComplete(updatedCase);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3.5 sm:space-y-6 animate-in fade-in">
      {/* اعلان و هشدار خطاهای اعتبارسنجی فیلدهای الزامی */}
      {(validationErrors.length > 0 || requiredDocsError) && (
        <div
          id="wizard-validation-alert"
          className="bg-rose-50/95 border border-rose-300 text-rose-900 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 space-y-2 shadow-xs animate-in fade-in slide-in-from-top-1"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5" />
              </span>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h4 className="font-black text-xs text-rose-950">
                  {requiredDocsError || 'لطفاً موارد الزامی مشخص‌شده را تکمیل فرمایید:'}
                </h4>
                {validationErrors.length > 0 && (
                  <span className="bg-rose-200 text-rose-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-300 whitespace-nowrap">
                    {toFaDigits(validationErrors.length)} مورد
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRequiredDocsError(null);
                setValidationErrors([]);
              }}
              className="p-1 rounded-lg hover:bg-rose-200 text-rose-700 transition-colors shrink-0 cursor-pointer"
              title="بستن هشدار"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* لیست موارد ناقص در قالب چیپ‌های فشرده و کلیک‌پذیر */}
          {validationErrors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5 pr-8">
              {validationErrors.map((err, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`field-${err.field}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="inline-flex items-center gap-1 bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-100/50 cursor-pointer px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-rose-900 shadow-2xs transition-all text-right"
                  title="پرش به این بخش"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{err.message}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wizard Header Progress Bar */}
      <div id="wizard-header-container" className="bg-white p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs space-y-2.5 sm:space-y-4">
        <div className="w-full">
          {/* Row of Circles & Connecting Line Segments */}
          <div className="flex items-center justify-between">
            {[
              { step: 1, icon: ListChecks },
              { step: 2, icon: MapPin },
              { step: 3, icon: Camera },
              { step: 4, icon: User },
              { step: 5, icon: Users }
            ].map(({ step, icon: Icon }, index, arr) => (
              <React.Fragment key={step}>
                {/* Step Circle Button */}
                <button
                  type="button"
                  disabled={step > currentStep}
                  onClick={() => step < currentStep && setCurrentStep(step)}
                  className={`w-7 h-7 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all relative z-10 ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-2 border-slate-300'
                  } ${step < currentStep ? 'cursor-pointer hover:bg-blue-700 active:scale-95' : 'cursor-default'}`}
                  title={step < currentStep ? 'بازگشت به این مرحله' : undefined}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </button>

                {/* Connecting Line between steps */}
                {index < arr.length - 1 && (
                  <div className="flex-1 h-1 sm:h-1.5 bg-slate-200 rounded-full overflow-hidden mx-1 sm:mx-2.5">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: currentStep > step ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Row of Step Labels - Responsive and non-wrapping */}
          <div className="flex justify-between items-start mt-1.5 sm:mt-2">
            {[
              { step: 1, labelSm: 'قوانین', label: 'شرایط و نقش' },
              { step: 2, labelSm: 'موقعیت', label: 'موقعیت حادثه' },
              { step: 3, labelSm: 'مستندات', label: 'مستندات و عکس' },
              { step: 4, labelSm: 'اطلاعات شما', label: wizardRole === 'culprit' ? 'اطلاعات شما (مقصر)' : 'اطلاعات شما (زیان‌دیده)' },
              { step: 5, labelSm: 'طرف مقابل', label: wizardRole === 'culprit' ? 'طرف مقابل (زیان‌دیده)' : 'طرف مقابل (مقصر)' }
            ].map(({ step, labelSm, label }, index, arr) => {
              const alignClass =
                index === 0
                  ? 'text-right items-start'
                  : index === arr.length - 1
                  ? 'text-left items-end'
                  : 'text-center items-center';

              const isActive = currentStep === step;
              const isDone = currentStep > step;

              return (
                <div
                  key={step}
                  className={`flex flex-col ${alignClass} flex-1 min-w-0 px-0.5`}
                >
                  <span className={`text-[9px] sm:text-[11px] font-extrabold leading-tight truncate sm:whitespace-normal ${
                    isActive ? 'text-blue-900 font-black' : isDone ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    <span className="sm:hidden">{labelSm}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Conditions, Policy Acceptance, Croqui & Role */}
        {currentStep === 1 && (
          <div className="space-y-3.5 sm:space-y-5 pt-1 sm:pt-2 animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-100">
              <h3 className="font-black text-xs sm:text-base text-blue-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-800 shrink-0" />
                <span>تایید قوانین، ارزیابی کروکی و تعیین نقش</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                مرحله ۱ از ۵
              </span>
            </div>

            {/* 1. Policy & Terms Box */}
            <div className="space-y-1 bg-sky-50/80 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-sky-200 text-slate-800">
              <div className="flex items-center justify-between gap-1.5 text-sky-950 font-black text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                  <span className="truncate">شرایط عمومی و قوانین ثبت خسارت خودرو:</span>
                </div>
                {agreePolicy && (
                  <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 shrink-0">
                    پذیرفته شد ✓
                  </span>
                )}
              </div>
              {!agreePolicy && (
                <ul className="list-disc list-inside space-y-0.5 pr-1 text-slate-700 font-bold text-[10px] sm:text-xs leading-relaxed animate-in fade-in">
                  <li>طرف مقصر باید دارای بیمه‌نامه شخص ثالث معتبر باشد.</li>
                  <li>حادثه نباید دارای صدمات جانی شدید یا فوت باشد.</li>
                  <li>بارگذاری اطلاعات دقیق، تصویر مدارک و تصاویر زوایای خودرو الزامی است.</li>
                </ul>
              )}
            </div>

            {/* Checkbox for accepting terms */}
            <div id="field-agreePolicy" className="space-y-1">
              <label
                className={`flex items-center gap-2 cursor-pointer p-2 sm:p-2.5 rounded-xl border-2 transition-all ${
                  getFieldError('agreePolicy')
                    ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-200 shadow-xs'
                    : agreePolicy
                    ? 'bg-blue-50/60 border-blue-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => {
                    setAgreePolicy(e.target.checked);
                    if (e.target.checked) clearFieldError('agreePolicy');
                  }}
                  className="w-4 h-4 text-blue-900 rounded focus:ring-blue-300 shrink-0 cursor-pointer"
                />
                <span className="text-[11px] sm:text-xs font-black text-blue-950 leading-snug">
                  قوانین و مقررات حریم خصوصی و صحت اطلاعات وارد شده را می‌پذیرم. <span className="text-rose-600">*</span>
                </span>
              </label>
              {getFieldError('agreePolicy') && (
                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-2 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {getFieldError('agreePolicy')}
                </p>
              )}
            </div>

            {/* 2. Croqui Section - Shown after accepting terms */}
            {agreePolicy ? (
              <div className="space-y-3 sm:space-y-4 pt-2 border-t-2 border-slate-200 animate-in fade-in">

                {/* 2-A. نوع حادثه */}
                <div id="field-accidentType" className="bg-indigo-50/70 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-indigo-200 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5 min-w-0">
                      <Siren className="w-4 h-4 text-indigo-800 shrink-0" />
                      <span className="truncate">نوع حادثه <span className="text-rose-600">*</span></span>
                    </label>
                    <span className="text-[10px] bg-indigo-100 text-indigo-900 font-black px-2 py-0.5 rounded-md border border-indigo-300 whitespace-nowrap shrink-0">
                      مدرک رسمی متناسب
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-700 font-medium leading-relaxed">
                    هر نوع حادثه مدرک رسمی مخصوص خود را دارد؛ برای مثال سرقت و خرابکاری نیازمند گزارش ۱۱۰ نیروی انتظامی است و کروکی راهور برای آن صادر نمی‌شود.
                  </p>
                  {/* Searchable Select (یک جا با امکان جستجو) */}
                  <SearchableAccidentTypeSelect
                    accidentTypes={ACCIDENT_TYPES}
                    selectedKey={accidentTypeKey}
                    onSelectType={(t) => {
                      setAccidentTypeKey(t.key);
                      clearFieldError('accidentType');
                      if (!t.supportsCroqui) {
                        setHasKroki(null);
                        setCroquiData(null);
                      }
                    }}
                    onClear={() => {
                      setAccidentTypeKey('');
                      clearFieldError('accidentType');
                    }}
                    hasError={!!getFieldError('accidentType')}
                  />

                  {getFieldError('accidentType') && (
                    <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError('accidentType')}
                    </p>
                  )}

                  {/* بنر هوشمند و قطعی ارجاع به بخش بیمه بدنه */}
                  {isBodyClaim && (
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl border-2 border-indigo-400 shadow-lg space-y-4 animate-in fade-in">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/30 border border-blue-400 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-white">
                              این سانحه مشمول پوشش «بیمه بدنه خودرو» است
                            </span>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40 font-bold">
                              خارج از شمول تعهدات شخص ثالث
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-blue-100 font-medium leading-relaxed">
                            سانحه انتخابی «<strong>{accidentRule?.label}</strong>» به دلیل تک‌وسیله بودن یا عدم درگیری مقصر شخص ثالث، منحصراً مشمول دریافت خسارت از محل <strong>بیمه بدنه خودرو</strong> می‌باشد و امکان تشکیل یا پرداخت پرونده از محل بیمه شخص ثالث وجود ندارد.
                          </p>
                          <p className="text-[11px] text-amber-200 font-bold">
                            امکان تکمیل فیلدهای بعدی در این فرم وجود ندارد. جهت استعلام سنهاب، بارگذاری کارت بدنه و بررسی ضوابط کروکی، لطفاً مستقیماً به پورتال بیمه بدنه مراجعه فرمایید.
                          </p>
                        </div>
                      </div>

                      {onSwitchToBodily && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-indigo-700/60">
                          <button
                            type="button"
                            onClick={() => {
                              setAccidentTypeKey('');
                              clearFieldError('accidentType');
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-600 transition-colors cursor-pointer"
                          >
                            تغییر نوع حادثه
                          </button>
                          <button
                            type="button"
                            onClick={() => onSwitchToBodily && onSwitchToBodily(accidentTypeKey, estimatedDamageToman)}
                            className="w-full sm:flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-slate-950" />
                            <span>انتقال مستقیم به پورتال بیمه بدنه</span>
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* در صورتی که سانحه مشمول بیمه بدنه باشد، سایر فیلدهای مرحله ۱ نمایش داده نمی‌شوند */}
                {!isBodyClaim && (
                  <>
                {/* هشدار صریح: سقف خسارت بدون کروکی ۷۰ میلیون تومان */}
                <div
                  id="notice-ceiling-without-croqui"
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 bg-amber-50/90 border-amber-300 text-amber-950 flex items-start gap-2.5 shadow-2xs"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-black leading-snug">
                      هشدار مهم: در صورتی که مبلغ خسارت بیشتر از ۷۰ میلیون تومان باشد، حتماً باید کروکی وارد شود.
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-amber-900 opacity-95">
                      رسیدگی و پرداخت بدون کروکی فقط تا سقف ۷۰ میلیون تومان امکان‌پذیر است.
                    </p>
                  </div>
                </div>

                {/* 2-C. نتیجه ارزیابی الزام کروکی */}
                {croquiRequirement.mandatory && (
                  <div className="bg-rose-50 p-3 rounded-xl border-2 border-rose-300 space-y-1.5 animate-in fade-in">
                    <p className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ارائه کروکی برای این پرونده الزامی است
                    </p>
                    <ul className="space-y-1 pr-1">
                      {croquiRequirement.reasons.map((reason, i) => (
                        <li key={i} className="text-[10px] sm:text-[11px] text-rose-900 font-bold flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 rotate-180" />
                          <span className="leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2-E. گزارش رسمی جایگزین (سرقت، آتش‌سوزی، حوادث طبیعی) */}
                {needsAlternativeReport && accidentRule && (
                  <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-rose-200 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5">
                      <Siren className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-xs font-black text-rose-950">
                        {accidentRule.reportLabel} <span className="text-rose-600">*</span>
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-700 font-medium leading-relaxed">
                      برای حادثه «{accidentRule.label}» کروکی پلیس راهور صادر نمی‌شود؛ ثبت شماره پرونده و بارگذاری تصویر گزارش رسمی الزامی است.
                    </p>

                    <div id="field-incidentReportCode">
                      <label className="block text-[11px] font-black text-slate-900 mb-1">
                        شماره پرونده / کد رهگیری گزارش
                      </label>
                      <input
                        type="text"
                        value={incidentReportCode}
                        onChange={(e) => {
                          setIncidentReportCode(e.target.value);
                          if (e.target.value.trim()) clearFieldError('incidentReportCode');
                        }}
                        placeholder="مثال: 110-1405-448219"
                        className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold font-mono bg-white text-slate-900 focus:outline-none transition-all ${
                          getFieldError('incidentReportCode')
                            ? 'border-rose-500 bg-rose-50/30 ring-2 ring-rose-200'
                            : 'border-slate-300 focus:border-rose-500'
                        }`}
                        dir="ltr"
                      />
                      {getFieldError('incidentReportCode') && (
                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {getFieldError('incidentReportCode')}
                        </p>
                      )}
                    </div>

                    <div id="field-incidentReportFile">
                      <label
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                          getFileForLabel('گزارش رسمی حادثه')
                            ? 'border-emerald-400 bg-emerald-50/60'
                            : getFieldError('incidentReportFile')
                            ? 'border-rose-500 bg-rose-50/40'
                            : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            handleFileUploadForLabel(e, 'گزارش رسمی حادثه');
                            clearFieldError('incidentReportFile');
                          }}
                        />
                        {getFileForLabel('گزارش رسمی حادثه') ? (
                          <>
                            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-[11px] font-black text-emerald-800">گزارش رسمی بارگذاری شد</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="text-[11px] font-black text-slate-700">بارگذاری تصویر یا PDF گزارش</span>
                          </>
                        )}
                      </label>
                      {getFieldError('incidentReportFile') && (
                        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {getFieldError('incidentReportFile')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* استعلامات چهارگانه جامع برخط (سنهاب، فناوران، کروکی راهور، ثبت احوال) */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-indigo-200 space-y-2.5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          استعلامات چهارگانه برخط و یکپارچگی داده‌ها
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                          سنهاب بیمه مرکزی • سامانه Core فناوران • کروکی راهور • احراز هویت ثبت احوال
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={vicInquiring}
                      onClick={handleOpenVicInquiry}
                      className="px-3 py-2 sm:px-4 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-75 cursor-pointer self-stretch sm:self-auto shrink-0"
                    >
                      {vicInquiring ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>در حال فراخوانی وب‌سرویس‌های ۴گانه...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>استعلامات چهارگانه و قفل شاسی</span>
                        </>
                      )}
                    </button>
                  </div>

                  {activeQuadrupleInquiries && (
                    <div className="p-2.5 bg-white/95 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-in fade-in">
                      <div className="flex items-center gap-2 text-emerald-950 font-black flex-wrap">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>استعلامات ۴گانه با موفقیت برقرار است • شماره شاسی (VIN):</span>
                        <span className="font-mono text-xs bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 text-slate-900" dir="ltr">
                          {activeQuadrupleInquiries.chassisVin}
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 self-start sm:self-auto shrink-0">
                        قفل و تثبیت‌شده در مرحله اول ✓
                      </span>
                    </div>
                  )}
                </div>

                {!needsAlternativeReport && (
                <div className="bg-purple-50/70 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-purple-200 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black text-purple-950 flex items-center gap-1.5 min-w-0">
                      <FileText className="w-4 h-4 text-purple-800 shrink-0" />
                      <span className="truncate">وضعیت و ارزیابی کروکی پلیس راهور <span className="text-rose-600">*</span></span>
                    </label>
                    <span className="text-[10px] bg-purple-100 text-purple-900 font-black px-2 py-0.5 rounded-md border border-purple-300 whitespace-nowrap shrink-0">
                      مرحله ۱: کروکی
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-800 font-bold">
                    آیا پلیس راهور در صحنه تصادف حاضر شده و برگه کروکی صادر کرده است؟
                  </p>

                  <div id="field-hasKroki" className="space-y-1.5">
                    <div
                      className={`grid grid-cols-2 gap-2 p-0.5 rounded-xl transition-all ${
                        getFieldError('hasKroki')
                          ? 'border-2 border-rose-500 bg-rose-50/50 p-1.5 rounded-xl ring-2 ring-rose-200'
                          : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setHasKroki(true);
                          setFuturePolice(null);
                          clearFieldError('hasKroki');
                        }}
                        className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black border-2 transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                          hasKroki === true
                            ? 'bg-purple-700 border-purple-800 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-purple-50/60 font-bold'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${hasKroki === true ? 'text-white' : 'text-purple-700'}`} />
                        <span className="whitespace-nowrap">بله، کروکی کشیده شد</span>
                      </button>
                      <button
                        type="button"
                        disabled={croquiRequirement.mandatory}
                        onClick={() => {
                          if (croquiRequirement.mandatory) return;
                          setHasKroki(false);
                          setCroquiData(null);
                          setShowFuturePoliceModal(true);
                          clearFieldError('hasKroki');
                        }}
                        title={
                          croquiRequirement.mandatory
                            ? 'با توجه به شرایط اعلامی، ثبت پرونده بدون کروکی مجاز نیست.'
                            : undefined
                        }
                        className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black border-2 transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                          croquiRequirement.mandatory
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            : hasKroki === false
                            ? 'bg-purple-700 border-purple-800 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-purple-50/60 font-bold'
                        }`}
                      >
                        {croquiRequirement.mandatory ? (
                          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-slate-400" />
                        ) : (
                          <X className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${hasKroki === false ? 'text-white' : 'text-purple-700'}`} />
                        )}
                        <span className="whitespace-nowrap">خیر، کروکی کشیده نشد</span>
                      </button>
                    </div>
                    {getFieldError('hasKroki') && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-2 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {getFieldError('hasKroki')}
                      </p>
                    )}
                  </div>

                  {/* If Kroki was drawn */}
                  {hasKroki === true && (
                    <div className="space-y-4 pt-3 border-t border-purple-200 animate-in fade-in">
                      {/* Dropdown: نوع کروکی */}
                      <div className="bg-purple-50/60 p-2.5 sm:p-3.5 rounded-xl border-2 border-purple-200 space-y-1.5">
                        <label htmlFor="croqui-type-select" className="block text-[11px] sm:text-xs font-black text-purple-950">
                          نوع کروکی <span className="text-rose-600">*</span>
                        </label>
                        <div className="relative">
                          <select
                            id="croqui-type-select"
                            value={croquiType}
                            onChange={(e) => {
                              const val = e.target.value as 'electronic' | 'paper' | 'judicial';
                              setCroquiType(val);
                              clearFieldError('krokiCode');
                              clearFieldError('paperCroqui');
                              clearFieldError('judicialCroqui');
                            }}
                            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border-2 border-purple-300 text-xs font-black text-purple-950 bg-white shadow-xs focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-200 transition-all cursor-pointer appearance-none pl-8"
                          >
                            <option value="electronic">کروکی الکترونیک راهور (سیستمی)</option>
                            <option value="paper">کروکی کاغذی پلیس راهور (فیزیکی / سنتی)</option>
                            <option value="judicial">کروکی قضایی / گزارش کارشناس دادگستری (فیزیکی)</option>
                          </select>
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-purple-700">
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Option 1: Electronic Kroki */}
                      {croquiType === 'electronic' && (
                        <div className="space-y-3 animate-in fade-in">
                          {/* Mandatory Field: شماره سریال کروکی / کد پیگیری پیامک‌شده */}
                          <div id="field-krokiCode">
                            <label className="block text-[11px] sm:text-xs font-black text-purple-950 mb-1">
                              شماره سریال کروکی / کد پیگیری پیامک‌شده <span className="text-rose-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={krokiCode}
                              onChange={(e) => {
                                setKrokiCode(e.target.value);
                                if (e.target.value.trim()) clearFieldError('krokiCode');
                              }}
                              placeholder="مثال: CRQ-1403-88492 یا کد پیگیری ۱۶ رقمی"
                              className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm font-bold font-mono text-slate-900 bg-white placeholder:text-slate-400 uppercase tracking-wider focus:outline-none transition-all ${
                                getFieldError('krokiCode')
                                  ? 'border-rose-500 bg-rose-50/30 ring-2 ring-rose-200'
                                  : 'border-purple-300 focus:border-purple-700 focus:ring-1 focus:ring-purple-700'
                              }`}
                              dir="ltr"
                            />
                            {getFieldError('krokiCode') && (
                              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-1 animate-in fade-in">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {getFieldError('krokiCode')}
                              </p>
                            )}
                          </div>

                          {/* AI Croqui Sample Evaluation Option & Optional Photo */}
                          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border-2 border-purple-200 space-y-2.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] sm:text-xs font-black text-purple-950 flex items-center gap-1 min-w-0">
                                <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                <span className="truncate">استعلام و ارزیابی نمونه کروکی هوشمند:</span>
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-purple-700 font-extrabold bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                                اختیاری
                              </span>
                            </div>

                            <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                              برای استعلام خودکار می‌توانید از نمونه‌های زیر استفاده فرمایید:
                            </p>

                            <div className="grid grid-cols-3 gap-1.5">
                              {sampleCroquis.map((sample, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isAnalyzingCroqui}
                                  onClick={() => handleAnalyzeCroquiSample(idx)}
                                  className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 text-right transition-all text-[10px] sm:text-xs font-extrabold flex flex-col justify-between h-16 sm:h-20 ${
                                    selectedCroquiSampleIdx === idx && croquiData
                                      ? 'border-purple-700 bg-purple-100/70 text-purple-950 shadow-xs'
                                      : 'border-slate-200 bg-slate-50 hover:bg-purple-50/50 text-slate-800'
                                  }`}
                                >
                                  <span className="line-clamp-2 leading-tight">{sample.title}</span>
                                  <span className="font-mono text-[9px] sm:text-[10px] font-bold text-purple-700 truncate">
                                    {sample.reportNumber}
                                  </span>
                                </button>
                              ))}
                            </div>

                            {/* Optional photo slot */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] sm:text-xs font-black text-purple-950">
                                  بارگذاری تصویر یا رسید پیامک (اختیاری):
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                                  اختیاری
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { label: 'عکس کروکی', icon: FileText },
                                  { label: 'عکس برگه گزارش پلیس', icon: Camera }
                                ].map((item, idx) => {
                                  const uploaded = getFileForLabel(item.label);
                                  return (
                                    <div key={idx} className="relative">
                                      {uploaded ? (
                                        <div className="p-2 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between gap-1">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                            <span className="text-[11px] font-bold text-emerald-950 truncate">{item.label}</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeFileForLabel(item.label)}
                                            className="p-1 bg-rose-100 text-rose-700 rounded-md cursor-pointer shrink-0"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <label className="border-2 border-dashed border-purple-300 bg-purple-50/30 rounded-xl p-2 flex items-center justify-between cursor-pointer hover:border-purple-600 hover:bg-purple-100/50 transition-all">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <item.icon className="w-3.5 h-3.5 text-purple-800 shrink-0" />
                                            <div className="min-w-0">
                                              <span className="text-[11px] font-black text-purple-950 block truncate">{item.label}</span>
                                              <span className="text-[9px] text-purple-700 font-bold block truncate">+ افزودن تصویر</span>
                                            </div>
                                          </div>
                                          <Upload className="w-3.5 h-3.5 text-purple-800 shrink-0" />
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleFileUploadForLabel(e, item.label)}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Option 2: Paper Croqui (Physical Police Diagram) */}
                      {croquiType === 'paper' && (
                        <div className="space-y-4 animate-in fade-in" id="field-paperCroqui">
                          {/* Optional Serial / Sheet Number */}
                          <div>
                            <label className="block text-[11px] sm:text-xs font-black text-purple-950 mb-1">
                              شماره سریال یا شماره برگه کروکی کاغذی <span className="text-slate-500 font-bold text-[11px]">(اختیاری)</span>
                            </label>
                            <input
                              type="text"
                              value={krokiCode}
                              onChange={(e) => {
                                setKrokiCode(e.target.value);
                                clearFieldError('krokiCode');
                              }}
                              placeholder="مثال: ب/۴۴۷۸۰۲ یا شماره درج‌شده در بالای برگه کروکی"
                              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border-2 border-purple-300 text-xs sm:text-sm font-bold font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-purple-700 transition-all"
                              dir="ltr"
                            />
                          </div>

                          {/* Mandatory Field: Upload Paper Croqui photo or PDF */}
                          <div
                            className={`p-4 rounded-2xl border-2 transition-all ${
                              getFieldError('paperCroqui')
                                ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-200'
                                : 'bg-white border-purple-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-purple-700" />
                                بارگذاری تصویر یا PDF برگه کروکی کاغذی <span className="text-rose-600">*</span>
                              </label>
                              <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                                الزامی
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium mb-3">
                              تصویر واضح و خوانا یا فایل PDF از برگه کروکی رسم‌شده توسط افسر کارشناس پلیس راهور را بارگذاری فرمایید.
                            </p>

                            {(() => {
                              const uploadedPaper =
                                getFileForLabel('بارگذاری تصویر برگه کروکی کاغذی') ||
                                getFileForLabel('تصویر برگه کروکی کاغذی') ||
                                getFileForLabel('عکس کروکی') ||
                                getFileForLabel('برگه کروکی') ||
                                files.find((f) => f.name?.includes('کاغذی') || f.name?.includes('کروکی'));

                              if (uploadedPaper) {
                                return (
                                  <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                                      <div>
                                        <span className="text-xs font-black text-emerald-950 block">
                                          {uploadedPaper.fileName || uploadedPaper.name}
                                        </span>
                                        <span className="text-[10px] text-emerald-800 font-bold block">
                                          {uploadedPaper.type === 'pdf' ? 'فایل سند PDF کروکی' : 'تصویر برگه کروکی کاغذی'} — بارگذاری با موفقیت انجام شد
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeFileForLabel('بارگذاری تصویر برگه کروکی کاغذی');
                                        removeFileForLabel('تصویر برگه کروکی کاغذی');
                                        removeFileForLabel('عکس کروکی');
                                        removeFileForLabel('برگه کروکی');
                                      }}
                                      className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
                                      title="حذف فایل"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <label className="border-2 border-dashed border-purple-400 bg-purple-50/40 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-purple-600 hover:bg-purple-100/50 transition-all text-center">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                                    <Upload className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-black text-purple-950 block">
                                      برای انتخاب تصویر یا PDF برگه کروکی کاغذی کلیک کنید
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                                      فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۲۰ مگابایت)
                                    </span>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      handleFileUploadForLabel(e, 'بارگذاری تصویر برگه کروکی کاغذی');
                                      clearFieldError('paperCroqui');
                                    }}
                                  />
                                </label>
                              );
                            })()}

                            {getFieldError('paperCroqui') && (
                              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-2 pr-1 animate-in fade-in">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {getFieldError('paperCroqui')}
                              </p>
                            )}
                          </div>

                          {/* AI Croqui Sample Evaluation Option */}
                          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border-2 border-purple-200 space-y-2.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] sm:text-xs font-black text-purple-950 flex items-center gap-1 min-w-0">
                                <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                <span className="truncate">استعلام و ارزیابی نمونه کروکی هوشمند:</span>
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-purple-700 font-extrabold bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                                اختیاری
                              </span>
                            </div>

                            <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                              برای بررسی خودکار کروکی کاغذی می‌توانید از نمونه‌های زیر استفاده فرمایید:
                            </p>

                            <div className="grid grid-cols-3 gap-1.5">
                              {sampleCroquis.map((sample, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isAnalyzingCroqui}
                                  onClick={() => handleAnalyzeCroquiSample(idx)}
                                  className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border-2 text-right transition-all text-[10px] sm:text-xs font-extrabold flex flex-col justify-between h-16 sm:h-20 ${
                                    selectedCroquiSampleIdx === idx && croquiData
                                      ? 'border-purple-700 bg-purple-100/70 text-purple-950 shadow-xs'
                                      : 'border-slate-200 bg-slate-50 hover:bg-purple-50/50 text-slate-800'
                                  }`}
                                >
                                  <span className="line-clamp-2 leading-tight">{sample.title}</span>
                                  <span className="font-mono text-[9px] sm:text-[10px] font-bold text-purple-700 truncate">
                                    {sample.reportNumber}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Option 3: Judicial Croqui / Forensic Report (Physical) */}
                      {croquiType === 'judicial' && (
                        <div className="space-y-4 animate-in fade-in" id="field-judicialCroqui">
                          {/* Mandatory Field: بارگذاری تصویر/PDF گزارش کارشناس */}
                          <div className={`p-4 rounded-2xl border-2 transition-all ${
                            getFieldError('judicialCroqui')
                              ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-200'
                              : 'bg-white border-purple-300'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-purple-700" />
                                بارگذاری تصویر/PDF گزارش کارشناس <span className="text-rose-600">*</span>
                              </label>
                              <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md border border-rose-200">
                                الزامی
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 font-medium mb-3">
                              تصویر خوانا یا فایل PDF از نظریه کارشناس رسمی دادگستری یا برگه گزارش قضایی را بارگذاری فرمایید.
                            </p>

                            {(() => {
                              const uploadedJudicial =
                                getFileForLabel('بارگذاری تصویر/PDF گزارش کارشناس') ||
                                getFileForLabel('گزارش کارشناس دادگستری') ||
                                getFileForLabel('عکس کروکی') ||
                                files.find((f) => f.name?.includes('کارشناس') || f.name?.includes('دادگستری'));

                              if (uploadedJudicial) {
                                return (
                                  <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                                      <div>
                                        <span className="text-xs font-black text-emerald-950 block">
                                          {uploadedJudicial.fileName || uploadedJudicial.name}
                                        </span>
                                        <span className="text-[10px] text-emerald-800 font-bold block">
                                          {uploadedJudicial.type === 'pdf' ? 'فایل سند PDF' : 'تصویر سند گزارش'} — بارگذاری با موفقیت انجام شد
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeFileForLabel('بارگذاری تصویر/PDF گزارش کارشناس');
                                        removeFileForLabel('گزارش کارشناس دادگستری');
                                        removeFileForLabel('عکس کروکی');
                                      }}
                                      className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
                                      title="حذف فایل"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <label className="border-2 border-dashed border-purple-400 bg-purple-50/40 rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:border-purple-600 hover:bg-purple-100/50 transition-all text-center">
                                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                                    <Upload className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-black text-purple-950 block">
                                      برای انتخاب فایل تصویر یا PDF کلیک کنید
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                                      فرمت‌های مجاز: JPG, PNG, PDF (حداکثر ۲۰ مگابایت)
                                    </span>
                                  </div>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      handleFileUploadForLabel(e, 'بارگذاری تصویر/PDF گزارش کارشناس');
                                      clearFieldError('judicialCroqui');
                                    }}
                                  />
                                </label>
                              );
                            })()}

                            {getFieldError('judicialCroqui') && (
                              <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-2 pr-1 animate-in fade-in">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                {getFieldError('judicialCroqui')}
                              </p>
                            )}
                          </div>

                          {/* Optional Field: شماره کلاسه پرونده یا بایگانی دادگستری */}
                          <div>
                            <label className="block text-xs font-black text-purple-950 mb-1">
                              شماره بایگانی / کلاسه پرونده قضایی <span className="text-slate-500 font-bold text-[11px]">(اختیاری)</span>
                            </label>
                            <input
                              type="text"
                              value={krokiCode}
                              onChange={(e) => setKrokiCode(e.target.value)}
                              placeholder="در صورت درج در گزارش کارشناس، وارد نمایید..."
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 text-sm font-bold font-mono text-slate-900 bg-white placeholder:text-slate-400 focus:border-purple-700 focus:ring-1 focus:ring-purple-700 focus:outline-none transition-all"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      )}

                      {/* Display Analysis Results if available */}
                      {isAnalyzingCroqui && (
                        <div className="p-4 bg-purple-100/80 border border-purple-300 rounded-2xl flex items-center justify-center gap-2 text-purple-950 text-xs font-black animate-pulse">
                          <Sparkles className="w-4 h-4 text-purple-700 animate-spin" />
                          <span>در حال پردازش هوشمند تصویر کروکی، استخراج شماره گزارش و رانندگان...</span>
                        </div>
                      )}

                      {croquiData && !isAnalyzingCroqui && (
                        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-300 space-y-3 animate-in fade-in shadow-xs">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              <span className="text-xs font-black text-emerald-950">
                                نتیجه ارزیابی هوش مصنوعی کروکی:
                              </span>
                            </div>
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md">
                              اطمینان: {toFaDigits(Math.round(croquiData.confidenceScore * 100))}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[11px] font-black text-slate-500 block">شماره گزارش:</span>
                              <span className="font-mono font-black text-blue-900">{croquiData.reportNumber}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                              <span className="text-[11px] font-black text-slate-500 block">تاریخ و محل:</span>
                              <span className="font-bold text-slate-900">{croquiData.incidentDate} — {croquiData.location}</span>
                            </div>
                            <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 space-y-1">
                              <span className="text-[11px] font-black text-rose-800 block">راننده مقصر کروکی:</span>
                              <span className="font-bold text-rose-950">{croquiData.faultDriver.fullName} ({croquiData.faultDriver.plateNumber})</span>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                              <span className="text-[11px] font-black text-emerald-800 block">راننده زیان‌دیده کروکی:</span>
                              <span className="font-bold text-emerald-950">{croquiData.victimDriver.fullName} ({croquiData.victimDriver.plateNumber})</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If Kroki was NOT drawn: ONLY display clean Result Summary box after prompt decision */}
                  {hasKroki === false && (
                    <div className="space-y-2 pt-2 border-t border-purple-200 animate-in fade-in">
                      {futurePolice === true ? (
                        <div className="p-2.5 sm:p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-950 text-xs font-bold space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                              <span className="font-black text-xs text-blue-900 truncate">
                                نتیجه: ثبت موقت - در انتظار کروکی
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowFuturePoliceModal(true)}
                              className="px-2.5 py-1 bg-white border border-blue-300 hover:bg-blue-100 text-blue-900 font-black rounded-lg text-[10px] sm:text-[11px] shrink-0 transition-all shadow-2xs"
                            >
                              تغییر پاسخ
                            </button>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium pr-5 leading-relaxed">
                            پس از حضور پلیس و دریافت کروکی، وارد پرونده شده و کد کروکی را ثبت می‌نمایید.
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 sm:p-3 bg-purple-50/90 border border-purple-200 rounded-xl text-purple-950 text-xs font-bold space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                              <span className="font-black text-xs text-purple-950 truncate">
                                نتیجه: بدون کروکی - ارجاع مستقیم به بیمه‌گر
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowFuturePoliceModal(true)}
                              className="px-2.5 py-1 bg-white border border-purple-200 hover:bg-purple-100 text-purple-900 font-black rounded-lg text-[10px] sm:text-[11px] shrink-0 transition-all shadow-2xs"
                            >
                              تغییر پاسخ
                            </button>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-700 font-medium pr-5 leading-relaxed">
                            پرونده شما بدون نیاز به کروکی جهت برآورد خسارت به شرکت بیمه‌گر ارجاع می‌گردد.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* 3. Driver Role Selection & Alignment */}
                <div id="field-wizardRole" className="space-y-2 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-200">
                  <label className="block text-xs font-black text-blue-900">
                    بر اساس مدارک فوق، نقش شما در این تصادف چیست؟ <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWizardRole('victim')}
                      className={`py-2 px-2 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                        wizardRole === 'victim'
                          ? 'border-blue-500 bg-sky-100 text-blue-950 shadow-xs'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <User className="w-4 h-4 text-blue-900 shrink-0" />
                      <span className="whitespace-nowrap">زیان‌دیده هستم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardRole('culprit')}
                      className={`py-2 px-2 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                        wizardRole === 'culprit'
                          ? 'border-blue-500 bg-sky-100 text-blue-950 shadow-xs'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <Users className="w-4 h-4 text-blue-900 shrink-0" />
                      <span className="whitespace-nowrap">مقصر هستم</span>
                    </button>
                  </div>

                  {/* Alignment check feedback banner */}
                  {croquiData && (
                    <div className="pt-2">
                      {croquiData.declaredRoleMatches ? (
                        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>تطابق کامل: نقش انتخاب شده با استخراج کروکی پلیس کاملاً همخوانی دارد.</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-100 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-800 shrink-0" />
                          <span>توجه: {croquiData.discrepancyNotes || 'لطفاً نقش انتخابی را مجدداً با متن کروکی بررسی نمایید.'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3 sm:p-3.5 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs text-amber-900 font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>لطفاً ابتدا قوانین و مقررات فوق را بپذیرید تا بخش ارزیابی کروکی و تعیین نقش فعال شود.</span>
              </div>
            )}

            {/* Navigation Buttons */}
            {isBodyClaim ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-10 sm:h-11 px-4 sm:px-5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors active:scale-95 shrink-0"
                >
                  انصراف
                </button>
                {onSwitchToBodily && (
                  <button
                    type="button"
                    onClick={() => onSwitchToBodily && onSwitchToBodily(accidentTypeKey, estimatedDamageToman)}
                    className="w-full sm:flex-1 h-10 sm:h-11 px-4 sm:px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>انتقال مستقیم به پورتال بیمه بدنه</span>
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors active:scale-95 shrink-0"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedToStep(2)}
                  className="flex-1 h-10 sm:h-11 px-4 sm:px-6 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-sm hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>تایید و ادامه</span>
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & GPS Map */}
        {currentStep === 2 && (
          <div className="space-y-3 sm:space-y-5 pt-1 sm:pt-2 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 sm:pb-3">
              <h3 className="font-black text-sm sm:text-lg text-blue-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                <span>زمان و موقعیت مکانی دقیق وقوع حادثه</span>
              </h3>
              <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-sky-100 text-sky-950 text-[10px] sm:text-xs font-extrabold border border-sky-300 shrink-0">
                مرحله ۲ از ۵
              </span>
            </div>

            {/* GPS Auto-Dispatch Policy Callout */}
            <div className="p-3 sm:p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-950 font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-black text-xs block text-blue-950">تخصیص هوشمند ارزیاب بر اساس موقعیت مکانی (GPS):</span>
                <p className="text-[11px] text-blue-900 font-medium leading-relaxed">
                  طبق ضوابط جدید، انتخاب دستی کارشناس توسط بیمه‌گذار حذف شده و ارجاع پرونده بر اساس مختصات جغرافیایی (GPS) صحنه حادثه به صورت سیستمی به نزدیک‌ترین ارزیاب فعال و مجاز در منطقه انجام خواهد شد.
                </p>
              </div>
            </div>

            {/* Shamsi Calendar & Time Picker */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-blue-900">
                تاریخ و ساعت وقوع حادثه (تقویم شمسی) <span className="text-rose-600">*</span>
              </label>
              <ShamsiDateTimePicker
                value={accidentDateTime}
                onChange={(newVal) => setAccidentDateTime(newVal)}
              />
            </div>

            {/* GPS Map & Auto Address */}
            <div className="space-y-2.5 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-black text-blue-900 flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                  <span className="truncate">موقعیت وقوع حادثه روی نقشه <span className="text-rose-600">*</span></span>
                </label>
                
                <button
                  type="button"
                  onClick={handleGetCurrentGPS}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] sm:text-xs font-black shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'دریافت...' : 'تعیین موقعیت GPS من'}</span>
                </button>
              </div>

              {/* Leaflet Map Box */}
              <div className="relative">
                <div ref={mapRef} className="w-full h-40 sm:h-56 rounded-xl sm:rounded-2xl border-2 border-slate-300 overflow-hidden shadow-xs z-10" />
                <div className="absolute bottom-1.5 right-1.5 z-20 bg-slate-900/90 backdrop-blur-md text-white text-[9px] sm:text-[11px] font-mono px-2 py-0.5 rounded sm:rounded-md border border-slate-700 pointer-events-none">
                  مختصات: {toFaDigits(lat.toFixed(4))}, {toFaDigits(lng.toFixed(4))}
                </div>
              </div>

              {/* GPS Address Extraction Feedback Alert */}
              {gpsStatusMsg && (
                <div className="p-2 sm:p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-[11px] sm:text-xs flex items-center gap-1.5 animate-in fade-in shadow-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                  <span>{gpsStatusMsg}</span>
                </div>
              )}

              {/* Auto-filled Address Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-blue-900">
                    آدرس محل تصادف <span className="text-rose-600">*</span>:
                  </label>
                  <span className="text-[9px] sm:text-[10px] text-sky-950 font-black bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-md">
                    استخراج خودکار با GPS / دستی
                  </span>
                </div>
                <textarea
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (e.target.value.trim()) clearFieldError('address');
                  }}
                  rows={2}
                  placeholder="آدرس دقیق محل تصادف..."
                  className={`w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border-2 text-xs font-bold text-slate-900 bg-white focus:outline-none transition-all shadow-xs placeholder:text-slate-400 ${
                    getFieldError('address')
                      ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                {getFieldError('address') && (
                  <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pr-1 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {getFieldError('address')}
                  </p>
                )}
              </div>

            </div>

            <div className="flex flex-row items-center gap-2 sm:gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors active:scale-95 shrink-0"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={() => handleProceedToStep(3)}
                className="flex-1 h-10 sm:h-11 px-3 sm:px-6 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-sm hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>تایید موقعیت و ادامه</span>
                <ArrowLeft className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Media Upload, VIN Scanner, Voice Notes & Kroki Code */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 sm:pb-3">
              <div>
                <h3 className="font-black text-base sm:text-lg text-blue-900">
                  تکمیل مستندات صحنه تصادف و مدارک
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-600 font-bold mt-0.5">
                  لطفاً تصاویر زوایا، فیلم، صدای توضیحات و مدارک پلیس را بارگذاری کنید.
                </p>
              </div>
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-sky-100 text-sky-950 text-[11px] sm:text-xs font-extrabold border border-sky-300 shrink-0">
                مرحله ۳ از ۵
              </span>
            </div>

            {/* 1. Scene Documentation Photo Grid (8 slots) */}
            <div className="bg-slate-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-slate-200 space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>تکمیل مستندات صحنه (تصاویر زوایای خودرو) <span className="text-rose-600">*</span></span>
                </label>
                <span className="text-[10px] font-black text-blue-900 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-300 shrink-0">
                  {toFaDigits(files.filter(f => ['پلاک', 'جلو', 'عقب', 'راست', 'چپ', 'سقف', 'خسارت ۱', 'خسارت ۲'].includes(f.name)).length)} از ۸ بارگذاری شده
                </span>
              </div>

              {/* Compact Responsive Photo Grid: 3 cols on mobile, 4 on small tablets, up to 8 on desktop */}
              <div className="grid grid-cols-3 min-[460px]:grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 sm:gap-2.5">
                {[
                  { id: 'پلاک', label: 'پلاک', required: true },
                  { id: 'جلو', label: 'جلو', required: false },
                  { id: 'عقب', label: 'عقب', required: false },
                  { id: 'راست', label: 'راست', required: false },
                  { id: 'چپ', label: 'چپ', required: false },
                  { id: 'سقف', label: 'سقف', required: false },
                  { id: 'خسارت ۱', label: 'خسارت ۱', required: true },
                  { id: 'خسارت ۲', label: 'خسارت ۲', required: false }
                ].map((slot) => {
                  const uploaded = getFileForLabel(slot.label);
                  return (
                    <div key={slot.id} className="relative group">
                      {uploaded ? (
                        <div className="aspect-[4/3.8] sm:aspect-square border-2 border-emerald-500 bg-emerald-50 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between relative overflow-hidden shadow-xs">
                          {uploaded.dataUrl && uploaded.type === 'image' ? (
                            <img src={uploaded.dataUrl} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-emerald-700 p-1">
                              <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600 mb-0.5" />
                              <span className="text-[9px] sm:text-[10px] font-bold truncate max-w-full text-emerald-900">{uploaded.fileName}</span>
                            </div>
                          )}

                          {/* Top Controls: Badge and Always-Accessible Delete on Mobile */}
                          <div className="absolute top-1 right-1 bg-emerald-600 text-white p-0.5 sm:p-1 rounded-full shadow-xs z-10">
                            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFileForLabel(slot.label);
                            }}
                            className="absolute top-1 left-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-md sm:rounded-lg shadow-xs z-20 active:scale-90 transition-all"
                            title="حذف و بارگذاری مجدد"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>

                          {/* Bottom Label Badge */}
                          <div className="absolute bottom-1 inset-x-1 bg-white/90 backdrop-blur-xs text-slate-900 text-[9px] sm:text-[10px] font-black text-center py-0.5 rounded-md z-10 border border-slate-200 truncate">
                            {slot.label}
                          </div>
                        </div>
                      ) : (
                        <label
                          className={`aspect-[4/3.8] sm:aspect-square border-2 border-dashed rounded-xl sm:rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all p-1 sm:p-2 text-center group/label ${
                            getFieldError(`media_${slot.label}`)
                              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-200 shadow-xs'
                              : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:bg-blue-50 bg-white'
                          }`}
                        >
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-0.5 sm:mb-1 transition-colors ${
                            getFieldError(`media_${slot.label}`)
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 group-hover/label:bg-blue-100 text-slate-600 group-hover/label:text-blue-900'
                          }`}>
                            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          <span className={`text-[10px] sm:text-[11px] font-extrabold leading-tight truncate max-w-full px-0.5 transition-colors ${
                            getFieldError(`media_${slot.label}`) ? 'text-rose-800' : 'text-slate-800 group-hover/label:text-blue-900'
                          }`}>
                            {slot.label} {slot.required && <span className="text-rose-600">*</span>}
                          </span>
                          <span className={`text-[8px] sm:text-[9px] font-bold mt-0.5 truncate max-w-full px-0.5 ${
                            getFieldError(`media_${slot.label}`) ? 'text-rose-600 font-black' : 'text-slate-400'
                          }`}>
                            {getFieldError(`media_${slot.label}`) ? 'الزامی' : 'افزودن'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUploadForLabel(e, slot.label)}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {(getFieldError('photo_plate') || getFieldError('photo_damage')) && (
                <div className="p-2.5 sm:p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 animate-in fade-in">
                  {getFieldError('photo_plate') && (
                    <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError('photo_plate')}
                    </p>
                  )}
                  {getFieldError('photo_damage') && (
                    <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {getFieldError('photo_damage')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 2. Chassis VIN Lookup & Vehicle Documentation */}
            <div className="bg-slate-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-slate-200 space-y-2.5 sm:space-y-3">
              <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-blue-900 shrink-0" />
                <span>موقعیت شماره شاسی و مدارک شناسایی خودرو</span>
              </label>

              {/* Clean Chassis Help Toolbar */}
              <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                    <span className="text-[11px] sm:text-xs font-black text-slate-800">
                      نمی‌دانید شماره شاسی (VIN) خودرویتان کجاست؟
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChassisGuideModal(true)}
                    className="w-full sm:w-auto px-3 py-1.5 sm:px-3.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] sm:text-xs rounded-lg sm:rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>راهنمای موقعیت شاسی</span>
                  </button>
                </div>

                {selectedChassisLoc && (
                  <div className="p-2 sm:p-3 bg-sky-50 border-2 border-sky-300 rounded-lg sm:rounded-xl text-blue-900 text-[11px] sm:text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                      <span className="truncate">راهنما: <strong className="text-blue-900">{selectedChassisLoc}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedChassisLoc('')}
                      className="text-slate-400 hover:text-rose-600 font-black text-[11px] shrink-0"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>

              {/* 2 Document Upload Slots: 2 columns on mobile too */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { label: 'عکس کارت ماشین', icon: CreditCard, accept: 'image/*' },
                  { label: 'عکس از شماره شاسی', icon: Camera, accept: 'image/*' }
                ].map((item, idx) => {
                  const uploaded = getFileForLabel(item.label);
                  return (
                    <div key={idx} className="relative">
                      {uploaded ? (
                        <div className="p-2 sm:p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] sm:text-xs font-extrabold text-emerald-950 block truncate">{item.label}</span>
                              <span className="text-[9px] sm:text-[10px] text-emerald-800 truncate block font-mono font-bold">{uploaded.fileName}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFileForLabel(item.label)}
                            className="p-1 sm:p-1.5 bg-rose-100 text-rose-700 border border-rose-300 rounded-md sm:rounded-lg hover:bg-rose-200 transition-colors shrink-0 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 rounded-xl sm:rounded-2xl p-2 sm:p-3 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-white group/doc">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-sky-100 group-hover/doc:bg-sky-200 text-blue-900 flex items-center justify-center transition-colors shrink-0">
                              <item.icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 block truncate group-hover/doc:text-blue-900 transition-colors">
                                {item.label}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold block truncate">انتخاب تصویر</span>
                            </div>
                          </div>
                          <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover/doc:text-blue-900 shrink-0 mr-1" />
                          <input
                            type="file"
                            accept={item.accept}
                            className="hidden"
                            onChange={(e) => handleFileUploadForLabel(e, item.label)}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              {getFieldError('vehicle_card') && (
                <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 p-2 sm:p-2.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {getFieldError('vehicle_card')}
                </p>
              )}
            </div>

            {/* 3. Video from Accident Scene */}
            <div className="bg-slate-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-slate-200 space-y-2">
              <label className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-blue-900 shrink-0" />
                <span>ویدیو از صحنه تصادف (اختیاری)</span>
              </label>

              {getFileForLabel('ویدیو صحنه') ? (
                <div className="p-2.5 sm:p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl sm:rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] sm:text-xs font-extrabold text-emerald-950 block truncate">ویدیو صحنه با موفقیت بارگذاری شد</span>
                      <span className="text-[10px] text-emerald-800 font-mono font-bold truncate block">{getFileForLabel('ویدیو صحنه')?.fileName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFileForLabel('ویدیو صحنه')}
                    className="p-1.5 sm:p-2 bg-rose-100 text-rose-700 border border-rose-300 rounded-lg hover:bg-rose-200 transition-colors shrink-0 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all bg-white group/vid">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-100 text-blue-900 flex items-center justify-center shrink-0 transition-colors">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="text-[11px] sm:text-xs font-extrabold text-blue-900 block truncate">آپلود ویدیو کامل صحنه تصادف</span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold block truncate">فرمت‌های MP4، MOV (حداکثر ۵۰ مگابایت)</span>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg shrink-0 mr-1">
                    انتخاب فایل
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFileUploadForLabel(e, 'ویدیو صحنه')}
                  />
                </label>
              )}
            </div>

            {/* 4. Audio Description & Text Explanation (Compact & Responsive) */}
            <div id="field-description" className="bg-slate-50/90 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-black text-blue-900 flex items-center gap-1.5 min-w-0">
                  <Mic className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                  <span className="truncate">توضیحات صوتی یا متنی حادثه</span>
                </label>
                <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                  حداقل یکی الزامی است
                </span>
              </div>

              {/* Voice Note Recorder Widget - Compact Bar */}
              <div className="bg-white p-2 rounded-lg sm:rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isRecordingVoice ? 'bg-rose-600 animate-ping' : (audioUrl ? 'bg-emerald-500' : 'bg-blue-600')}`} />
                  <span className="text-[11px] font-bold text-slate-700 truncate">
                    {isRecordingVoice ? 'در حال ضبط صدا...' : (audioUrl ? 'صوت ذخیره شد ✓' : 'ضبط صدای توضیحات')}
                  </span>
                </div>

                {isRecordingVoice ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                      {toFaDigits(Math.floor(recordingTime / 60))}:{toFaDigits(String(recordingTime % 60).padStart(2, '0'))}
                    </span>
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>توقف</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {audioUrl && (
                      <div className="flex items-center gap-1">
                        <audio src={audioUrl} controls className="h-6 w-28 sm:w-40" />
                        <button
                          type="button"
                          onClick={() => {
                            setAudioUrl(null);
                            setFiles((prev) => prev.filter((f) => f.name !== 'توضیحات صوتی'));
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="حذف صوت"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{audioUrl ? 'ضبط مجدد' : 'شروع ضبط صوت'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Text Statement — متن اظهارات رسمی (الزامی) */}
              <div id="field-description" className="space-y-1.5">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-1.5">
                  <Gavel className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-[11px] text-amber-950 font-bold leading-relaxed">
                    {AUDIO_NOT_SUFFICIENT_NOTICE}
                  </p>
                </div>

                <label className="block text-[11px] sm:text-xs font-black text-blue-900">
                  متن اظهارات نحوه وقوع حادثه <span className="text-rose-600">*</span>
                </label>

                <textarea
                  value={writtenReport}
                  onChange={(e) => {
                    setWrittenReport(e.target.value);
                    if (e.target.value.trim().length >= MIN_STATEMENT_LENGTH) clearFieldError('description');
                    // با تغییر متن، تأییدیه قبلی باطل می‌شود و باید مجدداً امضا شود.
                    if (confirmedStatement) setConfirmedStatement(null);
                  }}
                  rows={3}
                  placeholder="شرح دقیق نحوه وقوع حادثه، جهت حرکت خودروها، زوایای برخورد و خسارت‌های وارده..."
                  className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border text-xs font-medium text-slate-900 bg-white focus:outline-none shadow-2xs placeholder:text-slate-400 transition-all resize-y ${
                    getFieldError('description')
                      ? 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-200'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold ${
                      writtenReport.trim().length >= MIN_STATEMENT_LENGTH ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {toFaDigits(writtenReport.trim().length)} از حداقل {toFaDigits(MIN_STATEMENT_LENGTH)} حرف
                  </span>
                  {confirmedStatement && (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      اظهارات امضا شد
                    </span>
                  )}
                </div>
                {getFieldError('description') && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 p-1.5 rounded-lg flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {getFieldError('description')}
                  </p>
                )}
              </div>
            </div>

            {/* Evidence Intelligence AI Overview Card */}
            {evidenceAiResult && (
              <div className="pt-1">
                <EvidenceIntelligenceCard
                  claimId="WIZ-ACTIVE"
                  aiResult={evidenceAiResult}
                  showHitlControls={false}
                  compact={true}
                />
              </div>
            )}

            {/* Bottom Navigation Buttons: Harmonious and Compact on Mobile */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors active:scale-95 shrink-0"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={() => handleProceedToStep(4)}
                className="flex-1 h-10 sm:h-11 px-4 sm:px-6 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-sm hover:bg-blue-500 shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>ثبت مستندات و ادامه</span>
                <ArrowLeft className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: User Details (Victim or Culprit) */}
        {currentStep === 4 && (
          <div className="space-y-3.5 sm:space-y-4 pt-1 animate-in fade-in">
            <h3 className="font-extrabold text-xs sm:text-sm text-blue-900 text-center">
              {wizardRole === 'culprit' ? 'اطلاعات مقصر حادثه (شما)' : 'اطلاعات زیان‌دیده (شما)'}
            </h3>

            {/* Segment Toggle: Owner = Driver vs Two Different People */}
            <div className="p-0.5 bg-slate-100 rounded-xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setVicIsDriverSameOwner(false)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all ${
                  !vicIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                دو نفر متفاوت
              </button>
              <button
                type="button"
                onClick={() => setVicIsDriverSameOwner(true)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all ${
                  vicIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                مالک و راننده یک نفر
              </button>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div id="field-vicName">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                  نام مالک <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={vicName}
                  onChange={(e) => {
                    setVicName(e.target.value);
                    if (e.target.value.trim()) clearFieldError('vicName');
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none transition-all ${
                    getFieldError('vicName')
                      ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                      : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
                {getFieldError('vicName') && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {getFieldError('vicName')}
                  </p>
                )}
              </div>

              <div id="field-vicPhone">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                  موبایل مالک <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={vicPhone}
                  onChange={(e) => {
                    setVicPhone(e.target.value);
                    if (e.target.value.trim()) clearFieldError('vicPhone');
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none transition-all ${
                    getFieldError('vicPhone')
                      ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                      : 'border-slate-200 focus:border-blue-600'
                  }`}
                  dir="ltr"
                />
                {getFieldError('vicPhone') && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {getFieldError('vicPhone')}
                  </p>
                )}
              </div>

              {!vicIsDriverSameOwner && (
                <>
                  <div id="field-vicNationalId">
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">کد ملی مالک</label>
                    <input
                      type="text"
                      value={vicNationalId}
                      onChange={(e) => {
                        setVicNationalId(e.target.value);
                        if (e.target.value.trim()) clearFieldError('vicNationalId');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2 p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
                    <p className="text-[11px] sm:text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      اطلاعات راننده زمان حادثه (غیر از مالک):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div id="field-vicDriverPhone">
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1">
                          شماره موبایل راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={vicDriverPhone}
                          onChange={(e) => {
                            setVicDriverPhone(e.target.value);
                            if (e.target.value.trim()) clearFieldError('vicDriverPhone');
                          }}
                          placeholder="مثال: 09121112233"
                          className={`w-full px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none placeholder:text-slate-400 transition-all ${
                            getFieldError('vicDriverPhone')
                              ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                              : 'border-slate-200 focus:border-blue-600'
                          }`}
                          dir="ltr"
                        />
                        {getFieldError('vicDriverPhone') && (
                          <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {getFieldError('vicDriverPhone')}
                          </p>
                        )}
                      </div>
                      <div id="field-vicDriverNationalId">
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1">
                          کد ملی راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vicDriverNationalId}
                          onChange={(e) => {
                            setVicDriverNationalId(e.target.value);
                            if (e.target.value.trim()) clearFieldError('vicDriverNationalId');
                          }}
                          placeholder="مثال: 0012345678"
                          className={`w-full px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none placeholder:text-slate-400 transition-all ${
                            getFieldError('vicDriverNationalId')
                              ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                              : 'border-slate-200 focus:border-blue-600'
                          }`}
                          dir="ltr"
                        />
                        {getFieldError('vicDriverNationalId') && (
                          <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {getFieldError('vicDriverNationalId')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Driver's License Photos (Front & Back) - Mandatory */}
            <div id="field-vicDriverLicense" className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>تصاویر گواهینامه راننده {wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'} <span className="text-rose-500 font-bold">*</span></span>
                </label>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                  پشت و رو الزامی
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: `عکس روی گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`, shortLabel: 'روی گواهینامه (شما)', errKey: 'vicFrontLicense' },
                  { label: `عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'مقصر (شما)' : 'زیان‌دیده (شما)'}`, shortLabel: 'پشت گواهینامه (شما)', errKey: 'vicBackLicense' }
                ].map((item, idx) => {
                  const uploaded = getFileForLabel(item.label);
                  const hasErr = getFieldError(item.errKey);
                  return (
                    <div key={idx} id={`field-${item.errKey}`} className="relative group">
                      {uploaded ? (
                        <div className="p-1.5 sm:p-2 bg-emerald-50 border border-emerald-300 rounded-lg sm:rounded-xl flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {uploaded.dataUrl && uploaded.type === 'image' ? (
                              <img src={uploaded.dataUrl} alt={item.shortLabel} className="w-7 h-7 sm:w-9 sm:h-9 rounded-md object-cover border border-emerald-400 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] sm:text-xs font-black text-emerald-950 block truncate">{item.shortLabel}</span>
                              <span className="text-[9px] text-emerald-700 truncate block font-mono font-bold">{uploaded.fileName}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFileForLabel(item.label)}
                            className="p-1 bg-rose-100 text-rose-700 border border-rose-300 rounded-md hover:bg-rose-200 transition-colors shrink-0 active:scale-95 cursor-pointer"
                            title="حذف فایل"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className={`border-2 border-dashed rounded-lg sm:rounded-xl p-1.5 sm:p-2 flex items-center justify-between cursor-pointer transition-all bg-white group/license ${
                            hasErr
                              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-200 shadow-2xs'
                              : 'border-slate-300 hover:border-blue-600 hover:bg-blue-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              hasErr
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-blue-50 group-hover/license:bg-blue-100 text-blue-600'
                            }`}>
                              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className={`text-[10px] sm:text-[11px] font-black block truncate transition-colors ${
                                hasErr
                                ? 'text-rose-800'
                                : 'text-slate-800 group-hover/license:text-blue-900'
                              }`}>
                                {item.shortLabel} <span className="text-rose-500">*</span>
                              </span>
                              <span className={`text-[9px] font-bold block truncate ${
                                hasErr
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}>
                                {hasErr ? 'الزامی' : 'انتخاب تصویر'}
                              </span>
                            </div>
                          </div>
                          <Upload className={`w-3 h-3 shrink-0 mr-1 ${
                            hasErr
                              ? 'text-rose-600'
                              : 'text-slate-400 group-hover/license:text-blue-600'
                          }`} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUploadForLabel(e, item.label)}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              {(getFieldError('vicFrontLicense') || getFieldError('vicBackLicense')) && (
                <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{getFieldError('vicFrontLicense') || getFieldError('vicBackLicense')}</span>
                </p>
              )}
            </div>

            {/* Iranian Plate Input */}
            <div id="field-vicPlate" className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 text-center">
                پلاک خودرو <span className="text-rose-500">*</span>
              </label>
              <div className={getFieldError('vicPlate') ? 'p-0.5 rounded-xl border-2 border-rose-500 bg-rose-50/40 ring-2 ring-rose-200' : ''}>
                <IranianPlateInput
                  p1={vicP1}
                  pLetter={vicPLetter}
                  p2={vicP2}
                  p3={vicP3}
                  onChangeP1={(v) => { setVicP1(v); clearFieldError('vicPlate'); }}
                  onChangePLetter={(v) => { setVicPLetter(v); clearFieldError('vicPlate'); }}
                  onChangeP2={(v) => { setVicP2(v); clearFieldError('vicPlate'); }}
                  onChangeP3={(v) => { setVicP3(v); clearFieldError('vicPlate'); }}
                />
              </div>
              {getFieldError('vicPlate') && (
                <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center justify-center gap-1 mt-0.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {getFieldError('vicPlate')}
                </p>
              )}
            </div>

            {/* Chassis VIN (Read-only / Deduplicated / Locked from Initial Step) */}
            <div id="field-vicVin" className="p-3.5 bg-emerald-50/75 border-2 border-emerald-300 rounded-xl sm:rounded-2xl space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-[11px] sm:text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>شماره شاسی خودرو (VIN)</span>
                </label>
                <span className="text-[10px] bg-emerald-200/90 text-emerald-950 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400 self-start sm:self-auto shadow-2xs">
                  ثبت و قفل در مرحله نخست • عدم نیاز به ورود مجدد
                </span>
              </div>
              <div className="font-mono text-xs sm:text-sm font-black text-slate-900 tracking-widest bg-white p-2.5 rounded-xl border border-emerald-300 text-center shadow-2xs" dir="ltr">
                {vicVin || generateDeterministicVin(`${vicP1 || '۱۲'}${vicPLetter || 'ب'}${vicP2 || '۳۴۵'}-ایران${vicP3 || '۱۱'}`, vicCarType || 'پژو ۲۰۶')}
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-900 font-bold leading-relaxed">
                شماره شاسی خودرو در مرحله نخست پرونده از روی اسناد و استعلامات خوانده شده و نیازی به ورود مجدد ندارد. کنترل فیزیکی بارکد و اصالت شاسی صرفاً در محل بازدید توسط ارزیاب جهت احراز عدم تقلب انجام خواهد شد.
              </p>
            </div>

            {/* Quadruple Inquiries Action Button */}
            <button
              type="button"
              disabled={vicInquiring}
              onClick={handleOpenVicInquiry}
              className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-75 cursor-pointer"
            >
              {vicInquiring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>در حال استعلامات چهارگانه (سنهاب، فناوران، راهور، ثبت احوال)...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>استعلامات چهارگانه برخط (سنهاب، Core فناوران، راهور، ثبت احوال)</span>
                </>
              )}
            </button>

            {vicInquired && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-xs font-bold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                اطلاعات بیمه‌نامه شما با موفقیت استعلام و تایید گردید.
              </div>
            )}

            <div className="flex flex-row items-center gap-2 sm:gap-3 pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors active:scale-95 shrink-0 cursor-pointer"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={() => handleProceedToStep(5)}
                className="flex-1 h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <span>ثبت اطلاعات و ادامه</span>
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Culprit Details & Finish */}
        {currentStep === 5 && (
          <div className="space-y-3.5 sm:space-y-4 pt-1 animate-in fade-in">
            <h3 className="font-extrabold text-xs sm:text-sm text-blue-900 text-center">
              اطلاعات طرف مقابل ({wizardRole === 'culprit' ? 'زیان‌دیده' : 'مقصر'})
            </h3>

            {/* Segment Toggle: Owner = Driver vs Two Different People */}
            <div className="p-0.5 bg-slate-100 rounded-xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFltIsDriverSameOwner(false)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all ${
                  !fltIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                دو نفر متفاوت
              </button>
              <button
                type="button"
                onClick={() => setFltIsDriverSameOwner(true)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-black transition-all ${
                  fltIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                مالک و راننده یک نفر
              </button>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div id="field-fltName">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
                  نام مالک طرف مقابل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fltName}
                  onChange={(e) => {
                    setFltName(e.target.value);
                    if (e.target.value.trim()) clearFieldError('fltName');
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none transition-all ${
                    getFieldError('fltName')
                      ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                      : 'border-slate-200 focus:border-blue-600'
                  }`}
                />
                {getFieldError('fltName') && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {getFieldError('fltName')}
                  </p>
                )}
              </div>

              <div id="field-fltPhone">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>شماره موبایل طرف مقابل <span className="text-rose-500">*</span></span>
                  <span className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-full font-bold">پرونده مشترک</span>
                </label>
                <input
                  type="tel"
                  value={fltPhone}
                  onChange={(e) => {
                    setFltPhone(e.target.value);
                    if (e.target.value.trim()) clearFieldError('fltPhone');
                  }}
                  placeholder="۰۹۱۲..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none transition-all ${
                    getFieldError('fltPhone')
                      ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                      : 'border-blue-200 focus:border-blue-600'
                  }`}
                  dir="ltr"
                />
                {getFieldError('fltPhone') && (
                  <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {getFieldError('fltPhone')}
                  </p>
                )}
                <p className="text-[10px] sm:text-[11px] text-blue-800 mt-0.5 font-medium leading-relaxed">
                  جهت اتصال طرف دوم به پرونده برای بارگذاری مدارک.
                </p>
              </div>

              {!fltIsDriverSameOwner && (
                <>
                  <div id="field-fltNationalId">
                    <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">کد ملی مالک</label>
                    <input
                      type="text"
                      value={fltNationalId}
                      onChange={(e) => {
                        setFltNationalId(e.target.value);
                        if (e.target.value.trim()) clearFieldError('fltNationalId');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2 p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
                    <p className="text-[11px] sm:text-xs font-black text-blue-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      اطلاعات راننده زمان حادثه طرف مقابل:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div id="field-fltDriverPhone">
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1">
                          شماره موبایل راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={fltDriverPhone}
                          onChange={(e) => {
                            setFltDriverPhone(e.target.value);
                            if (e.target.value.trim()) clearFieldError('fltDriverPhone');
                          }}
                          placeholder="مثال: 09123334455"
                          className={`w-full px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none placeholder:text-slate-400 transition-all ${
                            getFieldError('fltDriverPhone')
                              ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                              : 'border-slate-200 focus:border-blue-600'
                          }`}
                          dir="ltr"
                        />
                        {getFieldError('fltDriverPhone') && (
                          <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {getFieldError('fltDriverPhone')}
                          </p>
                        )}
                      </div>
                      <div id="field-fltDriverNationalId">
                        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 mb-1">
                          کد ملی راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fltDriverNationalId}
                          onChange={(e) => {
                            setFltDriverNationalId(e.target.value);
                            if (e.target.value.trim()) clearFieldError('fltDriverNationalId');
                          }}
                          placeholder="مثال: 0087654321"
                          className={`w-full px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none placeholder:text-slate-400 transition-all ${
                            getFieldError('fltDriverNationalId')
                              ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-200'
                              : 'border-slate-200 focus:border-blue-600'
                          }`}
                          dir="ltr"
                        />
                        {getFieldError('fltDriverNationalId') && (
                          <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {getFieldError('fltDriverNationalId')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Driver's License Photos of Other Party (Front & Back) - Mandatory */}
            <div id="field-fltDriverLicense" className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>تصاویر گواهینامه راننده {wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'} <span className="text-rose-500 font-bold">*</span></span>
                </label>
                <span className="text-[10px] font-bold text-slate-500 shrink-0">
                  پشت و رو الزامی
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: `عکس روی گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`, shortLabel: 'روی گواهینامه (طرف مقابل)', errKey: 'fltFrontLicense' },
                  { label: `عکس پشت گواهینامه ${wizardRole === 'culprit' ? 'زیان‌دیده (طرف مقابل)' : 'مقصر (طرف مقابل)'}`, shortLabel: 'پشت گواهینامه (طرف مقابل)', errKey: 'fltBackLicense' }
                ].map((item, idx) => {
                  const uploaded = getFileForLabel(item.label);
                  const hasErr = getFieldError(item.errKey);
                  return (
                    <div key={idx} id={`field-${item.errKey}`} className="relative group">
                      {uploaded ? (
                        <div className="p-1.5 sm:p-2 bg-emerald-50 border border-emerald-300 rounded-lg sm:rounded-xl flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {uploaded.dataUrl && uploaded.type === 'image' ? (
                              <img src={uploaded.dataUrl} alt={item.shortLabel} className="w-7 h-7 sm:w-9 sm:h-9 rounded-md object-cover border border-emerald-400 shrink-0" />
                            ) : (
                              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[10px] sm:text-xs font-black text-emerald-950 block truncate">{item.shortLabel}</span>
                              <span className="text-[9px] text-emerald-700 truncate block font-mono font-bold">{uploaded.fileName}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFileForLabel(item.label)}
                            className="p-1 bg-rose-100 text-rose-700 border border-rose-300 rounded-md hover:bg-rose-200 transition-colors shrink-0 active:scale-95 cursor-pointer"
                            title="حذف فایل"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className={`border-2 border-dashed rounded-lg sm:rounded-xl p-1.5 sm:p-2 flex items-center justify-between cursor-pointer transition-all bg-white group/license ${
                            hasErr
                              ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-200 shadow-2xs'
                              : 'border-slate-300 hover:border-blue-600 hover:bg-blue-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                              hasErr
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-blue-50 group-hover/license:bg-blue-100 text-blue-600'
                            }`}>
                              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className={`text-[10px] sm:text-[11px] font-black block truncate transition-colors ${
                                hasErr
                                ? 'text-rose-800'
                                : 'text-slate-800 group-hover/license:text-blue-900'
                              }`}>
                                {item.shortLabel} <span className="text-rose-500">*</span>
                              </span>
                              <span className={`text-[9px] font-bold block truncate ${
                                hasErr
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}>
                                {hasErr ? 'الزامی' : 'انتخاب تصویر'}
                              </span>
                            </div>
                          </div>
                          <Upload className={`w-3 h-3 shrink-0 mr-1 ${
                            hasErr
                              ? 'text-rose-600'
                              : 'text-slate-400 group-hover/license:text-blue-600'
                          }`} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUploadForLabel(e, item.label)}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              {(getFieldError('fltFrontLicense') || getFieldError('fltBackLicense')) && (
                <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1 pr-0.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{getFieldError('fltFrontLicense') || getFieldError('fltBackLicense')}</span>
                </p>
              )}
            </div>

            {/* Iranian Plate Input */}
            <div id="field-fltPlate" className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 text-center">
                پلاک خودرو طرف مقابل <span className="text-rose-500">*</span>
              </label>
              <div className={getFieldError('fltPlate') ? 'p-0.5 rounded-xl border-2 border-rose-500 bg-rose-50/40 ring-2 ring-rose-200' : ''}>
                <IranianPlateInput
                  p1={fltP1}
                  pLetter={fltPLetter}
                  p2={fltP2}
                  p3={fltP3}
                  onChangeP1={(v) => { setFltP1(v); clearFieldError('fltPlate'); }}
                  onChangePLetter={(v) => { setFltPLetter(v); clearFieldError('fltPlate'); }}
                  onChangeP2={(v) => { setFltP2(v); clearFieldError('fltPlate'); }}
                  onChangeP3={(v) => { setFltP3(v); clearFieldError('fltPlate'); }}
                />
              </div>
              {getFieldError('fltPlate') && (
                <p className="text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center justify-center gap-1 mt-0.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {getFieldError('fltPlate')}
                </p>
              )}
            </div>

            {/* Chassis VIN (Read-only / Deduplicated / Locked from Initial Step / Croqui) */}
            <div id="field-fltVin" className="p-3.5 bg-emerald-50/75 border-2 border-emerald-300 rounded-xl sm:rounded-2xl space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label className="text-[11px] sm:text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>شماره شاسی خودروی طرف مقابل (VIN)</span>
                </label>
                <span className="text-[10px] bg-emerald-200/90 text-emerald-950 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400 self-start sm:self-auto shadow-2xs">
                  استخراج‌شده از استعلامات اولیه • عدم نیاز به ثبت مجدد
                </span>
              </div>
              <div className="font-mono text-xs sm:text-sm font-black text-slate-900 tracking-widest bg-white p-2.5 rounded-xl border border-emerald-300 text-center shadow-2xs" dir="ltr">
                {fltVin || generateDeterministicVin(`${fltP1 || '۴۵'}${fltPLetter || 'ج'}${fltP2 || '۷۸۹'}-ایران${fltP3 || '۳۳'}`, fltCarType || 'سمند LX')}
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-900 font-bold leading-relaxed">
                شماره شاسی طرف مقابل از استعلامات اولیه پایگاه‌های رسمی و کروکی استخراج و ذخیره شده است و هیچ‌گونه نیازی به ثبت مجدد ندارد.
              </p>
            </div>

            {/* Quadruple Inquiries Action Button */}
            <button
              type="button"
              disabled={fltInquiring}
              onClick={handleOpenFltInquiry}
              className="w-full py-3 px-4 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/10 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-75 cursor-pointer"
            >
              {fltInquiring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>در حال استعلامات چهارگانه (سنهاب، فناوران، کروکی راهور، ثبت احوال)...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>استعلامات چهارگانه طرف مقابل (سنهاب، Core فناوران، راهور، ثبت احوال)</span>
                </>
              )}
            </button>

            {fltInquired && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-1.5 text-xs font-bold text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                اطلاعات بیمه‌نامه طرف مقابل با موفقیت استعلام و تایید گردید.
              </div>
            )}

            {/* Referral Info Box */}
            {(!vicIsDriverSameOwner || !fltIsDriverSameOwner) && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 animate-in fade-in">
                <p className="font-black flex items-center gap-1.5 text-amber-800 text-[11px] sm:text-xs">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  ارجاع خودکار پرونده به بیمه مالک خودرو:
                </p>
                <p className="text-slate-700 leading-relaxed font-medium text-[10px] sm:text-[11px]">
                  با توجه به تفاوت راننده و مالک، استعلام اطلاعات بیمه و ارجاع پرونده در سامانه مرکزی به نام **مالک خودرو** انجام می‌گیرد و سوابق راننده نیز در پرونده حفظ خواهد شد.
                </p>
              </div>
            )}

            <div className="flex flex-row items-center gap-2 sm:gap-3 pt-1 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-xl border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors active:scale-95 shrink-0 cursor-pointer"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={handleFinishWizard}
                className="flex-1 h-9 sm:h-10 px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>ثبت نهایی و دریافت کد رهگیری</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: تأیید رسمی اظهارات با کد پیامکی (OTP) */}
      {showStatementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border-2 border-emerald-200 max-h-[92vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Gavel className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-slate-900">تأیید رسمی اظهارات و امضای فرم اعلام خسارت</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    اخذ تأییدیه معتبر جهت تثبیت حقوقی اظهارات شما
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatementModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* متن اظهارات ثبت‌شده */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-black text-slate-800">متن اظهارات ثبت‌شده شما:</span>
              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 text-[11px] sm:text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                {writtenReport.trim()}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStatementModal(false);
                  setCurrentStep(3);
                }}
                className="text-[11px] font-black text-blue-700 hover:text-blue-900 cursor-pointer inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                ویرایش متن اظهارات
              </button>
            </div>

            {/* تعهدنامه حقوقی */}
            <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-200 space-y-2">
              <p className="text-[10px] sm:text-[11px] text-amber-950 font-bold leading-relaxed">
                {STATEMENT_LEGAL_NOTICE}
              </p>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statementAgreed}
                  onChange={(e) => setStatementAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 shrink-0 cursor-pointer accent-emerald-600"
                />
                <span className="text-[11px] font-black text-slate-900 leading-snug">
                  صحت اظهارات فوق را تأیید می‌کنم و می‌پذیرم که این متن به‌عنوان اظهارات رسمی من ثبت شود.
                </span>
              </label>
            </div>

            {/* مرحله OTP */}
            {!statementOtpSent ? (
              <button
                type="button"
                disabled={!statementAgreed}
                onClick={() => {
                  const code = generateStatementOtp();
                  setStatementOtp(code);
                  setStatementOtpSent(true);
                  setStatementOtpError(null);
                  notifyApp(
                    `کد تأیید اظهارات به شماره ${vicPhone || session.phone || ''} پیامک شد: ${code}`,
                    'info'
                  );
                }}
                className={`w-full h-11 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
                  statementAgreed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>ارسال کد تأیید پیامکی به {toFaDigits(vicPhone || session.phone || '')}</span>
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] font-bold text-sky-950 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                  <span>
                    کد تأیید پیامک شد (نمایش آزمایشی):{' '}
                    <strong className="font-mono tracking-widest">{toFaDigits(statementOtp)}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-800 mb-1">
                    کد تأیید شش‌رقمی <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={enteredStatementOtp}
                    onChange={(e) => {
                      setEnteredStatementOtp(
                        e.target.value
                          .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
                          .replace(/\D/g, '')
                          .slice(0, 6)
                      );
                      setStatementOtpError(null);
                    }}
                    placeholder="------"
                    className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-black font-mono tracking-[0.4em] text-slate-900 bg-white focus:outline-none transition-all ${
                      statementOtpError ? 'border-rose-500 bg-rose-50/40' : 'border-emerald-300 focus:border-emerald-600'
                    }`}
                    dir="ltr"
                  />
                  {statementOtpError && (
                    <p className="text-[11px] font-bold text-rose-700 flex items-center gap-1 mt-1.5 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {statementOtpError}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (enteredStatementOtp !== statementOtp) {
                      setStatementOtpError('کد تأیید وارد شده صحیح نیست.');
                      return;
                    }
                    const isCulpritRole = wizardRole === 'culprit';
                    const statement = buildConfirmedStatement(
                      {
                        party: 'PARTY_ONE',
                        role: isCulpritRole ? 'مقصر' : 'زیان‌دیده',
                        fullName: vicName || session.name || '',
                        phone: vicPhone || session.phone || '',
                        nationalId: vicNationalId || session.nationalId,
                        statementText: writtenReport,
                        hasAudioAttachment: !!audioUrl
                      },
                      'OTP',
                      statementOtp
                    );
                    setConfirmedStatement(statement);
                    setShowStatementModal(false);
                    notifyApp('اظهارات شما با کد تأیید پیامکی امضا و در پرونده ثبت شد.', 'success');
                    finalizeCase(statement);
                  }}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <BadgeCheck className="w-4 h-4" />
                  <span>امضای اظهارات و ثبت نهایی پرونده</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const code = generateStatementOtp();
                    setStatementOtp(code);
                    setEnteredStatementOtp('');
                    setStatementOtpError(null);
                    notifyApp(`کد تأیید جدید: ${code}`, 'info');
                  }}
                  className="w-full text-[11px] font-black text-slate-600 hover:text-slate-900 cursor-pointer flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  ارسال مجدد کد تأیید
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-500 font-medium leading-relaxed border-t border-slate-100 pt-2.5">
              پس از ثبت پرونده، درخواست تأیید اظهارات برای طرف مقابل نیز ارسال می‌شود و تا زمان امضای ایشان، وضعیت اظهارات طرف مقابل «در انتظار تأیید» باقی می‌ماند.
            </p>
          </div>
        </div>
      )}

      {/* Quadruple Inquiries Modal (Sanhab, Fanavaran Core, Police Croqui, Civil Registry) */}
      <QuadrupleInquiriesModal
        isOpen={quadrupleModalOpen}
        onClose={() => setQuadrupleModalOpen(false)}
        inquiries={activeQuadrupleInquiries}
        partyLabel={quadrupleTargetParty === 'flt' ? 'طرف مقابل (مقصر/راننده دیگر)' : 'شما (زیان‌دیده/طرف اول)'}
        onApplyInquiryData={(inq) => {
          if (quadrupleTargetParty === 'flt') {
            setFltInquired(true);
            if (inq.chassisVin) setFltVin(inq.chassisVin);
          } else {
            setVicInquired(true);
            if (inq.chassisVin) setVicVin(inq.chassisVin);
          }
          setQuadrupleModalOpen(false);
          notifyApp('اطلاعات استعلامات چهارگانه با موفقیت در پرونده اعمال و شماره شاسی قفل گردید.');
        }}
      />

      {/* Future Police / Kroki Inquiry Modal */}
      {showFuturePoliceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 text-slate-900 animate-in zoom-in-95 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-700" />
                استعلام وضعیت کروکی پلیس راهور
              </h3>
              <button
                type="button"
                onClick={() => setShowFuturePoliceModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-slate-800 leading-relaxed">
                آیا کروکی پلیس راهور به زودی حاضر و صادر می‌شود؟
              </p>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFuturePolice(true);
                    setShowFuturePoliceModal(false);
                  }}
                  className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border-2 border-blue-600 text-blue-900 text-right transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-1 pl-2">
                    <span className="font-black text-xs block text-blue-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" />
                      بله، به زودی حاضر می‌شود (ثبت موقت)
                    </span>
                    <span className="text-[11px] text-slate-600 font-bold block leading-normal">
                      پرونده تا زمان صدور کروکی به‌صورت «ثبت موقت» ذخیره شده و پس از ورود مجدد، کد کروکی را وارد می‌نمایید.
                    </span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFuturePolice(false);
                    setShowFuturePoliceModal(false);
                  }}
                  className="p-4 rounded-2xl bg-purple-50/80 hover:bg-purple-100 border-2 border-purple-300 text-purple-950 text-right transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-1 pl-2">
                    <span className="font-black text-xs block text-purple-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-purple-700" />
                      خیر، کلاً کروکی ندارد (خسارت بدون کروکی)
                    </span>
                    <span className="text-[11px] text-slate-600 font-bold block leading-normal">
                      نیازی به ثبت موقت نیست؛ پرونده مستقیماً و بدون کروکی جهت ارزیابی به بیمه‌گر ارجاع می‌گردد.
                    </span>
                  </div>
                  <X className="w-5 h-5 text-purple-700 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chassis Guide Search & Selection Modal */}
      {showChassisGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 text-slate-900 animate-in zoom-in-95 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-900" />
                راهنمای پیدا کردن شماره شاسی (VIN) خودرو
              </h3>
              <button
                type="button"
                onClick={() => setShowChassisGuideModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Unified Searchable Select (Combobox) */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-800">
                  جستجو و انتخاب نوع خودرو:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={chassisFilter || (selectedChassisLoc ? selectedChassisLoc.split(' — ')[0] : '')}
                    onChange={(e) => {
                      setChassisFilter(e.target.value);
                      if (!e.target.value) {
                        setSelectedChassisLoc('');
                      }
                    }}
                    onFocus={() => {
                      if (selectedChassisLoc && !chassisFilter) {
                        setChassisFilter(selectedChassisLoc.split(' — ')[0]);
                      }
                    }}
                    placeholder="نام خودرو را تایپ کنید یا از لیست زیر انتخاب کنید (مثلاً: پژو ۲۰۶، پراید)..."
                    className="w-full pr-10 pl-9 py-2.5 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-colors"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  {(chassisFilter || selectedChassisLoc) && (
                    <button
                      type="button"
                      onClick={() => {
                        setChassisFilter('');
                        setSelectedChassisLoc('');
                      }}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-rose-600 font-bold text-xs p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                      title="پاک کردن"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filtered Dropdown List */}
                <div className="mt-2 border-2 border-slate-200 rounded-2xl p-1.5 max-h-60 overflow-y-auto space-y-1 text-xs bg-white shadow-md dir-rtl">
                  {CHASSIS_LOCATIONS.filter((c) =>
                    !chassisFilter ||
                    c.name.includes(chassisFilter) ||
                    c.location.includes(chassisFilter)
                  ).length === 0 ? (
                    <div className="p-3 text-center text-slate-500 font-bold text-xs">
                      خودرویی با این مشخصات یافت نشد
                    </div>
                  ) : (
                    CHASSIS_LOCATIONS.filter((c) =>
                      !chassisFilter ||
                      c.name.includes(chassisFilter) ||
                      c.location.includes(chassisFilter)
                    ).map((c, i) => {
                      const isSelected = selectedChassisLoc.startsWith(c.name);
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            setSelectedChassisLoc(`${c.name} — ${c.location}`);
                            setChassisFilter(c.name);
                          }}
                          className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white font-black shadow-xs'
                              : 'hover:bg-sky-50 text-slate-800 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Car className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-blue-900'}`} />
                            <span>{c.name}</span>
                          </div>
                          <span
                            className={`text-[11px] px-2.5 py-1 rounded-lg shrink-0 ${
                              isSelected
                                ? 'bg-blue-800 text-amber-300 font-black'
                                : 'bg-slate-100 text-slate-700 font-bold'
                            }`}
                          >
                            {c.location}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedChassisLoc && (
                <div className="p-3.5 bg-sky-50 border-2 border-sky-300 rounded-2xl text-blue-900 text-xs font-bold space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block font-black text-blue-900 text-xs">موقعیت شماره شاسی:</span>
                      <span className="block text-slate-800 font-extrabold text-xs mt-0.5">{selectedChassisLoc}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChassisGuideModal(false)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ثبت و بستن راهنما</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
