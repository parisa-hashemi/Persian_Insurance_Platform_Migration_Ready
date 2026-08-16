import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  CreditCard,
  Smartphone,
  Check,
  Building2,
  Lock,
  HelpCircle,
  Loader2
} from 'lucide-react';
import L from 'leaflet';
import { ClaimCase, UserSession, MediaFile, CaseStatus, CroquiData, DriverRole } from '../../types';
import { generateTrackingCode, getInsurerPersianName } from '../../lib/storage';
import { sampleCroquis } from '../../data/mockData';
import { ShamsiDateTimePicker, toFaDigits } from '../ShamsiDateTimePicker';
import { IranianPlateInput } from './IranianPlateInput';

interface AccidentWizardProps {
  session: UserSession;
  onComplete: (newCase: ClaimCase) => void;
  onCancel: () => void;
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
  onCancel
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
  const [croquiData, setCroquiData] = useState<CroquiData | null>(null);
  const [croquiType, setCroquiType] = useState<'paper' | 'electronic'>('paper');
  const [showFuturePoliceModal, setShowFuturePoliceModal] = useState(false);
  const [showChassisGuideModal, setShowChassisGuideModal] = useState(false);
  const [isAnalyzingCroqui, setIsAnalyzingCroqui] = useState(false);
  const [selectedCroquiSampleIdx, setSelectedCroquiSampleIdx] = useState<number | null>(null);

  const handleAnalyzeCroquiSample = async (sampleIdx: number) => {
    setIsAnalyzingCroqui(true);
    setSelectedCroquiSampleIdx(sampleIdx);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const sample = sampleCroquis[sampleIdx];

      let declaredMatch = true;
      let discrepancyNotes: string | null = null;

      if (wizardRole === 'victim' && sample.faultDriver.fullName.includes('پریسا')) {
        declaredMatch = false;
        discrepancyNotes = 'نقش شما به عنوان زیان‌دیده با راننده مقصر درج‌شده در این کروکی مغایرت دارد.';
      }

      const resData: CroquiData = {
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
        declaredRoleMatches: declaredMatch,
        discrepancyNotes: discrepancyNotes,
        recommendedNextStep: sample.isValid ? 'PROCEED_TO_DAMAGE_PHOTOS' : 'REQUIRE_MANUAL_REVIEW'
      };

      setCroquiData(resData);
      setHasKroki(true);
      setKrokiCode(sample.reportNumber);
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

  const handleFileUploadForLabel = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setFiles((prev) => [
          ...prev.filter((f) => f.name !== label),
          {
            name: label,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            dataUrl: event.target?.result as string,
            fileName: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('مرورگر شما از ضبط صدا پشتیبانی نمی‌کند.');
        return;
      }
      if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
        alert('امکان ضبط صدا در این مرورگر فعال نیست.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream);
      } catch (e) {
        console.error('MediaRecorder instantiation error:', e);
        alert('امکان ایجاد ضبط‌کننده صدا وجود ندارد.');
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
            type: 'video',
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
          type: 'video',
          dataUrl: simUrl,
          fileName: 'voice_description.wav'
        }
      ]);
    }
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

  // Central Inquiry Trigger for Party One (Victim / You)
  const handleOpenVicInquiry = () => {
    setVicInquiring(true);
    setTimeout(() => {
      setVicInquiring(false);
      // Fetch and fill official inquiry database records
      if (!vicName) setVicName(session.name || 'پریسا');
      if (!vicPhone) setVicPhone(session.phone || '09224511513');
      const realOrEnteredNationalId = vicNationalId || session.nationalId || '0012345678';
      setVicNationalId(realOrEnteredNationalId);
      setVicLicenseNo(vicLicenseNo || '9876543');
      setVicCarType(vicCarType || 'پژو ۲۰۶');
      setVicCarColor(vicCarColor || 'سفید');
      setVicPolicyNo(vicPolicyNo || 'BM-1402-999');
      setVicPolicyCompany(vicPolicyCompany || 'بیمه دانا');
      setVicPolicyExpiry(vicPolicyExpiry || '1406/08/15');
      setVicCoverageFinancial(50000000);
      setVicCoverageBodily(300000000);
      setVicCoverageDriver(100000000);
      if (!vicP1) setVicP1('۱۲');
      if (!vicPLetter) setVicPLetter('ب');
      if (!vicP2) setVicP2('۳۴۵');
      if (!vicP3) setVicP3('۱۱');
      if (!vicVin) setVicVin('IR206SD99482103829');
      setVicInquiryModalOpen(true);
    }, 600);
  };

  // Central Inquiry Trigger for Party Two (Culprit / Other Party)
  const handleOpenFltInquiry = () => {
    setFltInquiring(true);
    setTimeout(() => {
      setFltInquiring(false);
      // Fetch and fill official inquiry database records
      setFltName(fltName || 'رضا احمدی');
      setFltPhone(fltPhone || '09129876543');
      setFltNationalId(fltNationalId || '0087654321');
      setFltLicenseNo(fltLicenseNo || '87654321');
      setFltCarType(fltCarType || 'سمند LX');
      setFltCarColor(fltCarColor || 'مشکی');
      setFltPolicyNo(fltPolicyNo || 'AL-1401-883');
      setFltPolicyCompany(fltPolicyCompany || 'بیمه دانا');
      setFltPolicyExpiry(fltPolicyExpiry || '1406/05/20');
      setFltCoverageFinancial(50000000);
      setFltCoverageBodily(300000000);
      setFltCoverageDriver(100000000);
      if (!fltP1) setFltP1('۴۵');
      if (!fltPLetter) setFltPLetter('ج');
      if (!fltP2) setFltP2('۷۸۹');
      if (!fltP3) setFltP3('۳۳');
      if (!fltVin) setFltVin('IRPARS99482103829');
      setFltInquiryModalOpen(true);
    }, 600);
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
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setFiles((prev) => [
          ...prev,
          {
            name: label,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            dataUrl: event.target?.result as string,
            fileName: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
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
      victimPhone: victimPhoneVal,
      victimName: victimNameVal,
      victimNationalId: victimNationalIdVal,
      victimPlate: victimPlateVal,
      victimVin: victimVinVal,
      victimInsurer: victimInsurerVal,
      culpritPhone: culpritPhoneVal,
      culpritName: culpritNameVal,
      culpritNationalId: culpritNationalIdVal,
      culpritPlate: culpritPlateVal,
      culpritVin: culpritVinVal,
      culpritInsurer: culpritInsurerVal,
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
      futurePoliceExpected: futurePolice,
      needsCulpritFieldVisit: !hasKroki && futurePolice === false,
      sceneReportCode: krokiCode || undefined,
      croquiData: croquiData || undefined,
      writtenReport: writtenReport,
      files: files,
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

    onComplete(newCase);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      {/* Wizard Header Progress Bar */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full" />
          <div
            className="absolute top-1/2 right-0 h-1.5 bg-blue-900 -translate-y-1/2 z-0 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />

          {[
            { step: 1, label: 'شرایط و نقش', icon: ListChecks },
            { step: 2, label: 'موقعیت', icon: MapPin },
            { step: 3, label: 'مستندات', icon: Camera },
            { step: 4, label: wizardRole === 'culprit' ? 'اطلاعات شما (مقصر)' : 'اطلاعات شما (زیان‌دیده)', icon: User },
            { step: 5, label: wizardRole === 'culprit' ? 'طرف مقابل (زیان‌دیده)' : 'طرف مقابل (مقصر)', icon: Users }
          ].map(({ step, label, icon: Icon }) => (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                  currentStep >= step
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500 border-2 border-slate-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-800 mt-1.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Conditions, Policy Acceptance, Croqui & Role */}
        {currentStep === 1 && (
          <div className="space-y-6 pt-2 animate-in fade-in">
            <h3 className="font-black text-lg text-blue-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-900" />
              تایید قوانین، ارزیابی کروکی و تعیین نقش
            </h3>

            {/* 1. Policy & Terms Box */}
            <div className="space-y-2 bg-sky-50 p-4 rounded-2xl border-2 border-sky-200 text-xs text-slate-800 leading-relaxed">
              <div className="flex items-center gap-2 text-sky-950 font-black">
                <CheckCircle2 className="w-4 h-4 text-sky-700" />
                شرایط عمومی و قوانین ثبت خسارت خودرو:
              </div>
              <ul className="list-disc list-inside space-y-1.5 pr-2 text-slate-800 font-bold">
                <li>طرف مقصر باید دارای بیمه‌نامه شخص ثالث معتبر باشد.</li>
                <li>حادثه نباید دارای صدمات جانی شدید یا فوت باشد.</li>
                <li>بارگذاری اطلاعات دقیق، تصویر مدارک و تصاویر زوایای خودرو الزامی است.</li>
              </ul>
            </div>

            {/* Checkbox for accepting terms */}
            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border-2 border-slate-300 hover:border-blue-400 transition-all">
              <input
                type="checkbox"
                checked={agreePolicy}
                onChange={(e) => setAgreePolicy(e.target.checked)}
                className="w-5 h-5 text-blue-900 rounded focus:ring-blue-900"
              />
              <span className="text-xs font-black text-blue-950">
                قوانین و مقررات حریم خصوصی و صحت اطلاعات وارد شده را می‌پذیرم.
              </span>
            </label>

            {/* 2. Croqui Section - Shown after accepting terms */}
            {agreePolicy ? (
              <div className="space-y-5 pt-4 border-t-2 border-slate-200 animate-in fade-in">
                <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-800" />
                      وضعیت و ارزیابی کروکی پلیس راهور <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2.5 py-0.5 rounded-md border border-amber-400">
                      مرحله ۱: کروکی
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-bold">
                    آیا پلیس راهور در صحنه تصادف حاضر شده و برگه کروکی صادر کرده است؟
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setHasKroki(true);
                        setFuturePolice(null);
                      }}
                      className={`p-3.5 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2 ${
                        hasKroki === true
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm scale-[1.01]'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-950" />
                      بله، کروکی کشیده شد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasKroki(false);
                        setCroquiData(null);
                        setShowFuturePoliceModal(true);
                      }}
                      className={`p-3.5 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2 ${
                        hasKroki === false
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm scale-[1.01]'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <X className="w-4 h-4 text-amber-950" />
                      خیر، کروکی کشیده نشد
                    </button>
                  </div>

                  {/* If Kroki was drawn */}
                  {hasKroki === true && (
                    <div className="space-y-4 pt-3 border-t border-amber-300 animate-in fade-in">
                      {/* Kroki Type */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-300">
                        <span className="text-xs font-black text-amber-950">نوع کروکی:</span>
                        <button
                          type="button"
                          onClick={() => setCroquiType('paper')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            croquiType === 'paper'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          کروکی کاغذی
                        </button>
                        <button
                          type="button"
                          onClick={() => setCroquiType('electronic')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            croquiType === 'electronic'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          کروکی الکترونیکی
                        </button>
                      </div>

                      {/* Kroki Code Input */}
                      <div>
                        <label className="block text-xs font-black text-amber-950 mb-1">
                          کد یا شماره گزارش کروکی پلیس <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={krokiCode}
                          onChange={(e) => setKrokiCode(e.target.value)}
                          placeholder="مثال: CRQ-1403-88492"
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 text-sm font-bold font-mono text-slate-900 bg-white placeholder:text-slate-400 uppercase tracking-wider focus:outline-none focus:border-amber-600"
                          dir="ltr"
                        />
                      </div>

                      {/* AI Croqui Sample Evaluation Option */}
                      <div className="bg-white p-4 rounded-xl border-2 border-amber-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            ارزیابی و پردازش تصویر کروکی با هوش مصنوعی (AI OCR):
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 font-bold">
                          می‌توانید تصویر کروکی را بارگذاری کنید یا یکی از کروکی‌های نمونه زیر را برای ارزیابی هوشمند تست نمایید:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {sampleCroquis.map((sample, idx) => (
                            <button
                              key={idx}
                              type="button"
                              disabled={isAnalyzingCroqui}
                              onClick={() => handleAnalyzeCroquiSample(idx)}
                              className={`p-2.5 rounded-xl border-2 text-right transition-all text-xs font-extrabold flex flex-col justify-between h-20 ${
                                selectedCroquiSampleIdx === idx && croquiData
                                  ? 'border-amber-600 bg-amber-100 text-amber-950 shadow-xs'
                                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800'
                              }`}
                            >
                              <span className="line-clamp-2 text-[11px]">{sample.title}</span>
                              <span className="text-[10px] font-mono font-bold text-amber-800">
                                {sample.reportNumber}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Upload Kroki photo slot */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {[
                            { label: 'عکس کروکی', icon: FileText },
                            { label: 'عکس برگه گزارش پلیس', icon: Camera }
                          ].map((item, idx) => {
                            const uploaded = getFileForLabel(item.label);
                            return (
                              <div key={idx} className="relative">
                                {uploaded ? (
                                  <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                                      <span className="text-xs font-bold text-emerald-950">{item.label} بارگذاری شد</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFileForLabel(item.label)}
                                      className="p-1 bg-rose-100 text-rose-700 rounded-lg"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="border-2 border-dashed border-amber-400 bg-white rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-amber-600 hover:bg-amber-100/50 transition-all">
                                    <div className="flex items-center gap-2">
                                      <item.icon className="w-4 h-4 text-amber-800" />
                                      <span className="text-xs font-black text-amber-950">{item.label}</span>
                                    </div>
                                    <Upload className="w-4 h-4 text-amber-800" />
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

                      {/* Display Analysis Results if available */}
                      {isAnalyzingCroqui && (
                        <div className="p-4 bg-amber-100 border border-amber-300 rounded-2xl flex items-center justify-center gap-2 text-amber-950 text-xs font-black animate-pulse">
                          <Sparkles className="w-4 h-4 text-amber-700 animate-spin" />
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
                              <span className="font-mono font-black text-blue-950">{croquiData.reportNumber}</span>
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
                    <div className="space-y-3 pt-3 border-t border-amber-300 animate-in fade-in">
                      {futurePolice === true ? (
                        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-2xl text-blue-950 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-5 h-5 text-blue-700 shrink-0" />
                            <div>
                              <span className="font-black block text-blue-900 text-xs">نتیجه ثبت: ثبت موقت - در انتظار افزودن کروکی</span>
                              <span className="text-[11px] text-slate-600 font-medium block">
                                پس از حضور پلیس و دریافت کروکی، وارد پرونده شده و کد کروکی را ثبت می‌نمایید.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowFuturePoliceModal(true)}
                            className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-100 text-blue-900 font-black rounded-xl text-[11px] shrink-0 transition-all shadow-2xs"
                          >
                            تغییر پاسخ
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 text-xs font-bold flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />
                            <div>
                              <span className="font-black block text-amber-950 text-xs">نتیجه ثبت: خسارت بدون کروکی - ارجاع مستقیم به بیمه‌گر</span>
                              <span className="text-[11px] text-slate-700 font-medium block">
                                پرونده شما بدون نیاز به کروکی جهت برآورد خسارت به شرکت بیمه‌گر ارجاع می‌گردد.
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowFuturePoliceModal(true)}
                            className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-black rounded-xl text-[11px] shrink-0 transition-all shadow-2xs"
                          >
                            تغییر پاسخ
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Driver Role Selection & Alignment */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border-2 border-slate-200">
                  <label className="block text-xs font-black text-blue-950">
                    بر اساس مدارک فوق، نقش شما در این تصادف چیست؟ <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setWizardRole('victim')}
                      className={`p-4 rounded-2xl border-2 font-black text-sm flex flex-col items-center gap-2 transition-all ${
                        wizardRole === 'victim'
                          ? 'border-blue-900 bg-sky-100 text-blue-950 shadow-sm'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <User className="w-6 h-6 text-blue-900" />
                      زیان‌دیده هستم
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardRole('culprit')}
                      className={`p-4 rounded-2xl border-2 font-black text-sm flex flex-col items-center gap-2 transition-all ${
                        wizardRole === 'culprit'
                          ? 'border-blue-900 bg-sky-100 text-blue-950 shadow-sm'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Users className="w-6 h-6 text-blue-900" />
                      مقصر هستم
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
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>لطفاً ابتدا قوانین و مقررات فوق را بپذیرید تا بخش ارزیابی کروکی و تعیین نقش فعال شود.</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={!agreePolicy || hasKroki === null}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-blue-900 disabled:opacity-50 text-white font-black text-xs hover:bg-blue-800 shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                تایید و ادامه به مرحله بعد <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date & GPS Map */}
        {currentStep === 2 && (
          <div className="space-y-6 pt-2 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-lg text-blue-950">
                زمان و موقعیت مکانی دقیق وقوع حادثه
              </h3>
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-950 text-xs font-extrabold border border-sky-300">
                مرحله ۲ از ۵
              </span>
            </div>

            {/* Shamsi Calendar & Time Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-blue-950">
                تاریخ و ساعت وقوع حادثه (تقویم شمسی) <span className="text-rose-600">*</span>
              </label>
              <ShamsiDateTimePicker
                value={accidentDateTime}
                onChange={(newVal) => setAccidentDateTime(newVal)}
              />
            </div>

            {/* GPS Map & Auto Address */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-900" />
                  موقعیت وقوع حادثه روی نقشه <span className="text-rose-600">*</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleGetCurrentGPS}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-black shadow-md transition-all active:scale-95"
                >
                  <Crosshair className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>{gpsLoading ? 'در حال دریافت موقعیت GPS...' : 'تعیین موقعیت GPS من'}</span>
                </button>
              </div>

              {/* Leaflet Map Box */}
              <div className="relative">
                <div ref={mapRef} className="w-full h-60 rounded-2xl border-2 border-slate-300 overflow-hidden shadow-xs z-10" />
                <div className="absolute bottom-2 right-2 z-20 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-lg border border-slate-700">
                  مختصات: {toFaDigits(lat.toFixed(4))}, {toFaDigits(lng.toFixed(4))}
                </div>
              </div>

              {/* GPS Address Extraction Feedback Alert */}
              {gpsStatusMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center gap-2 animate-in fade-in shadow-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>{gpsStatusMsg}</span>
                </div>
              )}

              {/* Auto-filled Address Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-blue-950">
                    آدرس محل تصادف (تولید خودکار بر اساس GPS / قابل ویرایش):
                  </label>
                  <span className="text-[10px] text-sky-950 font-black bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-md">
                    استخراج خودکار
                  </span>
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="آدرس دقیق محل تصادف..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-900 transition-all shadow-xs placeholder:text-slate-400"
                />
              </div>

            </div>

            <div className="flex justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-black text-xs hover:bg-blue-800 shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                تایید موقعیت و ادامه <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Media Upload, VIN Scanner, Voice Notes & Kroki Code */}
        {currentStep === 3 && (
          <div className="space-y-6 pt-2 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-lg text-blue-950">
                  تکمیل مستندات صحنه تصادف و مدارک
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  لطفاً تصاویر زوایا، فیلم، صدای توضیحات و مدارک پلیس را بارگذاری کنید.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-950 text-xs font-extrabold border border-sky-300 shrink-0">
                مرحله ۳ از ۵
              </span>
            </div>

            {/* 1. Scene Documentation Photo Grid (8 slots) */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-900" />
                  تکمیل مستندات صحنه (تصاویر زوایای مختلف خودرو) <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] font-black text-blue-950 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-300">
                  {toFaDigits(files.filter(f => ['پلاک', 'جلو', 'عقب', 'راست', 'چپ', 'سقف', 'خسارت ۱', 'خسارت ۲'].includes(f.name)).length)} از ۸ بارگذاری شده
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'پلاک', label: 'پلاک' },
                  { id: 'جلو', label: 'جلو' },
                  { id: 'عقب', label: 'عقب' },
                  { id: 'راست', label: 'راست' },
                  { id: 'چپ', label: 'چپ' },
                  { id: 'سقف', label: 'سقف' },
                  { id: 'خسارت ۱', label: 'خسارت ۱' },
                  { id: 'خسارت ۲', label: 'خسارت ۲' }
                ].map((slot) => {
                  const uploaded = getFileForLabel(slot.label);
                  return (
                    <div key={slot.id} className="relative group">
                      {uploaded ? (
                        <div className="aspect-square border-2 border-emerald-500 bg-emerald-50 rounded-2xl p-2 flex flex-col items-center justify-between relative overflow-hidden shadow-xs">
                          {uploaded.dataUrl && uploaded.type === 'image' ? (
                            <img src={uploaded.dataUrl} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-emerald-700">
                              <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-1" />
                              <span className="text-[10px] font-bold truncate max-w-[90%] text-emerald-900">{uploaded.fileName}</span>
                            </div>
                          )}

                          {/* Overlay & Remove Button */}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                            <button
                              type="button"
                              onClick={() => removeFileForLabel(slot.label)}
                              className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-md"
                              title="حذف و بارگذاری مجدد"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white p-1 rounded-full shadow-md z-10">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <div className="absolute bottom-1 inset-x-1 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black text-center py-0.5 rounded-lg z-10 border border-slate-200">
                            {slot.label}
                          </div>
                        </div>
                      ) : (
                        <label className="aspect-square border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-blue-900 hover:bg-blue-50 transition-all p-2 text-center group/label bg-white">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover/label:bg-blue-100 text-slate-600 group-hover/label:text-blue-900 flex items-center justify-center mb-1.5 transition-colors">
                            <Camera className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-800 group-hover/label:text-blue-900 transition-colors">
                            {slot.label}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold mt-0.5">افزودن تصویر</span>
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
            </div>

            {/* 2. Chassis VIN Lookup & Vehicle Documentation */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 space-y-3">
              <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-blue-900" />
                موقعیت شماره شاسی و مدارک شناسایی خودرو
              </label>

              {/* Clean Chassis Help Toolbar */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="text-xs font-black text-slate-800">
                      نمی‌دانید شماره شاسی (VIN) خودرویتان کجاست؟
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChassisGuideModal(true)}
                    className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>راهنمای موقعیت شاسی</span>
                  </button>
                </div>

                {selectedChassisLoc && (
                  <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-xl text-blue-950 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>راهنمای انتخاب‌شده: <strong className="text-blue-900">{selectedChassisLoc}</strong></span>
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

              {/* 2 Document Upload Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'عکس کارت ماشین', icon: CreditCard, accept: 'image/*' },
                  { label: 'عکس از شماره شاسی', icon: Camera, accept: 'image/*' }
                ].map((item, idx) => {
                  const uploaded = getFileForLabel(item.label);
                  return (
                    <div key={idx} className="relative">
                      {uploaded ? (
                        <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-extrabold text-emerald-950 block">{item.label}</span>
                              <span className="text-[10px] text-emerald-800 truncate block font-mono font-bold">{uploaded.fileName}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFileForLabel(item.label)}
                            className="p-1.5 bg-rose-100 text-rose-700 border border-rose-300 rounded-lg hover:bg-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-blue-900 hover:bg-blue-50 transition-all bg-white group/doc">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-100 group-hover/doc:bg-sky-200 text-blue-900 flex items-center justify-center transition-colors">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-extrabold text-slate-800 block group-hover/doc:text-blue-900 transition-colors">
                                {item.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold block">کلیک کنید برای انتخاب فایل</span>
                            </div>
                          </div>
                          <Upload className="w-4 h-4 text-slate-400 group-hover/doc:text-blue-900" />
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
            </div>

            {/* 3. Video from Accident Scene */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 space-y-2">
              <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-blue-900" />
                ویدیو از صحنه تصادف
              </label>

              {getFileForLabel('ویدیو صحنه') ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-emerald-950 block">ویدیو صحنه با موفقیت بارگذاری شد</span>
                      <span className="text-[11px] text-emerald-800 font-mono font-bold">{getFileForLabel('ویدیو صحنه')?.fileName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFileForLabel('ویدیو صحنه')}
                    className="p-2 bg-rose-100 text-rose-700 border border-rose-300 rounded-xl hover:bg-rose-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-900 hover:bg-blue-50 transition-all bg-white group/vid">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-blue-900 group-hover/vid:scale-110 flex items-center justify-center mb-2 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-blue-950 block">آپلود ویدیو کامل صحنه تصادف</span>
                  <span className="text-[10px] text-slate-500 font-bold mt-1">فرمت‌های MP4, MOV یا WEBM (حداکثر ۵۰ مگابایت)</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFileUploadForLabel(e, 'ویدیو صحنه')}
                  />
                </label>
              )}
            </div>

            {/* 4. Audio Description & Text Explanation */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 space-y-3">
              <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-blue-900" />
                توضیحات صوتی و متنی حادثه
              </label>

              {/* Voice Note Recorder Widget */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isRecordingVoice ? 'bg-rose-600 animate-ping' : 'bg-blue-900'}`} />
                    <span className="text-xs font-bold text-slate-900">ضبط توضیحات صوتی (اختیاری)</span>
                  </div>

                  {isRecordingVoice ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-300">
                        {toFaDigits(Math.floor(recordingTime / 60))}:{toFaDigits(String(recordingTime % 60).padStart(2, '0'))}
                      </span>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>توقف ضبط</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      <span>برای ضبط توضیحات کلیک کنید</span>
                    </button>
                  )}
                </div>

                {/* Audio Playback if recorded */}
                {audioUrl && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-5 h-5 text-blue-900" />
                      <span className="text-xs font-bold text-blue-950">فایل صوتی شما با موفقیت آماده شد</span>
                    </div>
                    <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                  </div>
                )}
              </div>

              {/* Text Description Textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-blue-950">یا به صورت متنی شرح دهید (اختیاری):</label>
                <textarea
                  value={writtenReport}
                  onChange={(e) => setWrittenReport(e.target.value)}
                  rows={3}
                  placeholder="توضیح کامل درباره نحوه وقوع تصادف، خسارت‌ها بنویسید..."
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-900 shadow-xs placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-black text-xs hover:bg-blue-800 shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                ثبت مستندات و ادامه <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: User Details (Victim or Culprit) */}
        {currentStep === 4 && (
          <div className="space-y-5 pt-2 animate-in fade-in">
            <h3 className="font-extrabold text-base text-blue-950 text-center">
              {wizardRole === 'culprit' ? 'اطلاعات مقصر حادثه (شما)' : 'اطلاعات زیان‌دیده (شما)'}
            </h3>

            {/* Segment Toggle: Owner = Driver vs Two Different People */}
            <div className="p-1 bg-slate-100 rounded-2xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setVicIsDriverSameOwner(false)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  !vicIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                دو نفر متفاوت
              </button>
              <button
                type="button"
                onClick={() => setVicIsDriverSameOwner(true)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  vicIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                مالک و راننده یک نفر
              </button>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام مالک</label>
                <input
                  type="text"
                  value={vicName}
                  onChange={(e) => setVicName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  موبایل مالک <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={vicPhone}
                  onChange={(e) => setVicPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>

              {!vicIsDriverSameOwner && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">کد ملی مالک</label>
                    <input
                      type="text"
                      value={vicNationalId}
                      onChange={(e) => setVicNationalId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" />
                      اطلاعات راننده زمان حادثه (غیر از مالک):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          شماره موبایل راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={vicDriverPhone}
                          onChange={(e) => setVicDriverPhone(e.target.value)}
                          placeholder="مثال: 09121112233"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          کد ملی راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={vicDriverNationalId}
                          onChange={(e) => setVicDriverNationalId(e.target.value)}
                          placeholder="مثال: 0012345678"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Iranian Plate Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                پلاک خودرو <span className="text-rose-500">*</span>
              </label>
              <IranianPlateInput
                p1={vicP1}
                pLetter={vicPLetter}
                p2={vicP2}
                p3={vicP3}
                onChangeP1={setVicP1}
                onChangePLetter={setVicPLetter}
                onChangeP2={setVicP2}
                onChangeP3={setVicP3}
              />
            </div>

            {/* VIN Barcode Scanner */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">VIN (شماره شاسی)</label>
              <input
                type="text"
                value={vicVin}
                onChange={(e) => setVicVin(e.target.value)}
                placeholder="00000000000000000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-center uppercase tracking-widest text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => startBarcodeScanner('vic')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <ScanLine className="w-4 h-4 text-blue-600" />
                اسکن بارکد شماره شاسی (خودروی شما) - ضدتقلب
              </button>
            </div>

            {/* Insurance Inquiry Action Button */}
            <button
              type="button"
              disabled={vicInquiring}
              onClick={handleOpenVicInquiry}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-75"
            >
              {vicInquiring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  در حال استعلام از وب‌سرویس سنهاب بیمه مرکزی...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  استعلام اطلاعات بیمه و هویت (سنهاب)
                </>
              )}
            </button>

            {vicInquired && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                اطلاعات بیمه‌نامه شما با موفقیت استعلام و تایید گردید.
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/10 transition-all flex items-center gap-2"
              >
                ثبت اطلاعات و رفتن به مرحله بعد <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Culprit Details & Finish */}
        {currentStep === 5 && (
          <div className="space-y-5 pt-2 animate-in fade-in">
            <h3 className="font-extrabold text-base text-blue-950 text-center">
              اطلاعات طرف مقابل ({wizardRole === 'culprit' ? 'زیان‌دیده' : 'مقصر'})
            </h3>

            {/* Segment Toggle: Owner = Driver vs Two Different People */}
            <div className="p-1 bg-slate-100 rounded-2xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setFltIsDriverSameOwner(false)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  !fltIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                دو نفر متفاوت
              </button>
              <button
                type="button"
                onClick={() => setFltIsDriverSameOwner(true)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  fltIsDriverSameOwner
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                مالک و راننده یک نفر
              </button>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام مالک طرف مقابل</label>
                <input
                  type="text"
                  value={fltName}
                  onChange={(e) => setFltName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>شماره موبایل طرف دوم (طرف مقابل) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">پرونده مشترک</span>
                </label>
                <input
                  type="tel"
                  value={fltPhone}
                  onChange={(e) => setFltPhone(e.target.value)}
                  placeholder="۰۹۱۲..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-200 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                  dir="ltr"
                />
                <p className="text-[11px] text-blue-800 mt-1 font-medium">
                  این شماره موبایل جهت اتصال طرف دوم به همین پرونده استفاده می‌شود تا امکان بارگذاری مستندات توسط وی فراهم گردد.
                </p>
              </div>

              {!fltIsDriverSameOwner && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">کد ملی مالک</label>
                    <input
                      type="text"
                      value={fltNationalId}
                      onChange={(e) => setFltNationalId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                      dir="ltr"
                    />
                  </div>

                  <div className="sm:col-span-2 p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
                    <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-blue-600" />
                      اطلاعات راننده زمان حادثه طرف مقابل:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          شماره موبایل راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={fltDriverPhone}
                          onChange={(e) => setFltDriverPhone(e.target.value)}
                          placeholder="مثال: 09123334455"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          کد ملی راننده <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fltDriverNationalId}
                          onChange={(e) => setFltDriverNationalId(e.target.value)}
                          placeholder="مثال: 0087654321"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Iranian Plate Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 text-center mb-1">
                پلاک خودرو طرف مقابل <span className="text-rose-500">*</span>
              </label>
              <IranianPlateInput
                p1={fltP1}
                pLetter={fltPLetter}
                p2={fltP2}
                p3={fltP3}
                onChangeP1={setFltP1}
                onChangePLetter={setFltPLetter}
                onChangeP2={setFltP2}
                onChangeP3={setFltP3}
              />
            </div>

            {/* VIN Barcode Scanner */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">VIN (شماره شاسی)</label>
              <input
                type="text"
                value={fltVin}
                onChange={(e) => setFltVin(e.target.value)}
                placeholder="00000000000000000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-center uppercase tracking-widest text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => startBarcodeScanner('flt')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <ScanLine className="w-4 h-4 text-blue-600" />
                اسکن بارکد شماره شاسی (طرف مقابل) - ضدتقلب
              </button>
            </div>

            {/* Insurance Inquiry Action Button */}
            <button
              type="button"
              disabled={fltInquiring}
              onClick={handleOpenFltInquiry}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-75"
            >
              {fltInquiring ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  در حال استعلام از وب‌سرویس سنهاب و راهور...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  استعلام اطلاعات بیمه و هویت طرف مقابل (سنهاب)
                </>
              )}
            </button>

            {fltInquired && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                اطلاعات بیمه‌نامه طرف مقابل با موفقیت استعلام و تایید گردید.
              </div>
            )}

            {/* Referral Info Box */}
            {(!vicIsDriverSameOwner || !fltIsDriverSameOwner) && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 animate-in fade-in">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  ارجاع خودکار پرونده به بیمه مالک خودرو:
                </p>
                <p className="text-slate-700 leading-relaxed font-medium">
                  با توجه به تفاوت راننده و مالک، استعلام اطلاعات بیمه و ارجاع پرونده در سامانه مرکزی به نام **مالک خودرو** انجام می‌گیرد و سوابق راننده نیز در پرونده حفظ خواهد شد.
                </p>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                مرحله قبل
              </button>
              <button
                type="button"
                onClick={handleFinishWizard}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                ثبت نهایی و دریافت کد رهگیری
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Insurance Inquiry Modal (Victim / You) */}
      {vicInquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto dir-rtl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-extrabold text-blue-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                فرم استعلام اطلاعات بیمه (زیان‌دیده)
              </h4>
              <button
                type="button"
                onClick={() => setVicInquiryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نام مالک</label>
                <input
                  type="text"
                  value={vicName}
                  onChange={(e) => setVicName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">شماره موبایل</label>
                <input
                  type="tel"
                  value={vicPhone}
                  onChange={(e) => setVicPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">کد ملی مالک</label>
                <input
                  type="text"
                  value={vicNationalId}
                  onChange={(e) => setVicNationalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">شماره گواهی‌نامه</label>
                <input
                  type="text"
                  value={vicLicenseNo}
                  onChange={(e) => setVicLicenseNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع خودرو</label>
                <input
                  type="text"
                  value={vicCarType}
                  onChange={(e) => setVicCarType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">رنگ خودرو</label>
                <input
                  type="text"
                  value={vicCarColor}
                  onChange={(e) => setVicCarColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">شماره بیمه‌نامه</label>
                <input
                  type="text"
                  value={vicPolicyNo}
                  onChange={(e) => setVicPolicyNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">شرکت بیمه</label>
                <input
                  type="text"
                  value={vicPolicyCompany}
                  onChange={(e) => setVicPolicyCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">تاریخ انقضا</label>
                <input
                  type="text"
                  value={vicPolicyExpiry}
                  onChange={(e) => setVicPolicyExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 text-center focus:bg-white focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>

              {/* Coverage Caps */}
              <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="font-extrabold text-blue-950 text-xs text-center">سقف پوشش‌ها (ریال)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">مالی</label>
                    <input
                      type="text"
                      value={vicCoverageFinancial.toLocaleString('fa-IR')}
                      readOnly
                      className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold font-mono text-center bg-white text-blue-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">جانی</label>
                    <input
                      type="text"
                      value={vicCoverageBodily.toLocaleString('fa-IR')}
                      readOnly
                      className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold font-mono text-center bg-white text-blue-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-1">راننده</label>
                    <input
                      type="text"
                      value={vicCoverageDriver.toLocaleString('fa-IR')}
                      readOnly
                      className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold font-mono text-center bg-white text-blue-950"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setVicInquired(true);
                  setVicInquiryModalOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/10 transition-all active:scale-98"
              >
                تایید اطلاعات
              </button>
              <button
                type="button"
                onClick={() => setVicInquiryModalOpen(false)}
                className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Inquiry Modal (Culprit / Other Party) */}
      {fltInquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto dir-rtl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-extrabold text-blue-950 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                نتیجه استعلام اطلاعات بیمه و هویت (طرف مقابل)
              </h4>
              <button
                type="button"
                onClick={() => setFltInquiryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Security & Privacy Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-bold space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>حفظ حریم خصوصی و امنیت اطلاعات طرف مقابل:</span>
              </div>
              <p className="leading-relaxed text-slate-700 text-[11px]">
                مطابق با دستورالعمل‌های امنیتی، در این استعلام تنها <strong>نام و نام خانوادگی</strong>، <strong>شماره پلاک</strong> و <strong>مشخصات بیمه‌نامه شخص ثالث</strong> طرف مقابل نمایش داده شده و سایر اطلاعات شخصی (کد ملی، موبایل و گواهی‌نامه) به صورت محرمانه در سامانه پردازش می‌گردد.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نام و نام خانوادگی (طرف مقابل)</label>
                <input
                  type="text"
                  value={fltName}
                  onChange={(e) => setFltName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شماره پلاک خودرو</label>
                <input
                  type="text"
                  value={`${fltP1} ${fltPLetter} ${fltP2} ایران ${fltP3}`}
                  readOnly
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 font-bold font-mono text-emerald-950 bg-emerald-50 text-center"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شماره بیمه‌نامه شخص ثالث</label>
                <input
                  type="text"
                  value={fltPolicyNo}
                  onChange={(e) => setFltPolicyNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">شرکت بیمه‌گر شخص ثالث</label>
                <input
                  type="text"
                  value={fltPolicyCompany}
                  onChange={(e) => setFltPolicyCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع و رنگ خودرو (محرمانه)</label>
                <input
                  type="text"
                  value="*** (محرمانه جهت حفظ حریم خصوصی)"
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-400 bg-slate-100 text-center"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاریخ انقضای بیمه‌نامه (محرمانه)</label>
                <input
                  type="text"
                  value="*** (محرمانه جهت حفظ حریم خصوصی)"
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-400 bg-slate-100 text-center"
                  dir="ltr"
                />
              </div>

              {/* MASKED SENSITIVE FIELDS */}
              <div>
                <label className="block font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  شماره موبایل (محرمانه)
                </label>
                <input
                  type="text"
                  value="*** (محرمانه جهت حفظ حریم خصوصی)"
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-400 bg-slate-100 text-center"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  کد ملی (محرمانه)
                </label>
                <input
                  type="text"
                  value="*** (محرمانه - ثبت شده در سامانه)"
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-400 bg-slate-100 text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  شماره گواهی‌نامه (محرمانه)
                </label>
                <input
                  type="text"
                  value="*** (محرمانه - استعلام مستقیم از راهور)"
                  readOnly
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-400 bg-slate-100 text-center"
                />
              </div>

              {/* Coverage Caps */}
              <div className="sm:col-span-2 p-3 bg-slate-100 border border-slate-200 rounded-2xl space-y-1.5 text-center">
                <p className="font-extrabold text-slate-600 text-xs flex items-center justify-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  پوشش‌ها و تعهدات مالی بیمه‌نامه (محرمانه)
                </p>
                <p className="text-[11px] text-slate-500 font-bold">
                  *** (اطلاعات تعهدات مالی به صورت خودکار توسط سامانه بیمه مرکزی و ارزیاب ارزیابی می‌گردد)
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setFltInquired(true);
                  setFltInquiryModalOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/10 transition-all active:scale-98"
              >
                تایید اطلاعات
              </button>
              <button
                type="button"
                onClick={() => setFltInquiryModalOpen(false)}
                className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera VIN Barcode Scanner Simulator Modal */}
      {scannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center text-slate-900 space-y-5 border border-slate-200 shadow-2xl relative overflow-hidden dir-rtl">
            <button
              type="button"
              onClick={() => setScannerModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h4 className="font-extrabold text-base flex items-center justify-center gap-2 text-blue-950">
                <ScanLine className="w-5 h-5 animate-pulse text-blue-600" />
                دوربین اسکن بارکد شماره شاسی (VIN)
              </h4>
              <p className="text-xs text-slate-500">
                کارت خودرو را مقابل دوربین نگه دارید
              </p>
            </div>

            {/* Simulated Viewfinder */}
            <div className="relative w-full h-44 bg-slate-950 rounded-2xl border-2 border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Corner Targets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-500" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-500" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-500" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-500" />

              {/* Laser Scan Line Animation */}
              <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_#ef4444] animate-bounce" />

              {/* Barcode Mock Card */}
              <div className="opacity-40 space-y-2 pointer-events-none text-center">
                <div className="w-28 h-6 bg-slate-800 rounded mx-auto border border-slate-700 flex items-center justify-center text-[10px] font-mono tracking-widest text-indigo-300">
                  ||||| | |||| ||
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  VIN SCANNER AI ACTIVE
                </div>
              </div>

              {scannerSuccess && (
                <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-in zoom-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                  <p className="text-xs font-extrabold text-emerald-200">
                    شماره شاسی با موفقیت استخراج شد!
                  </p>
                </div>
              )}
            </div>

            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>{scannerProgress}%</span>
                <span>
                  {scannerSuccess ? 'شناسایی نهایی' : 'در حال اسکن نوری...'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300"
                  style={{ width: `${scannerProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Future Police / Kroki Inquiry Modal */}
      {showFuturePoliceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 border border-slate-200 text-slate-900 animate-in zoom-in-95 dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                استعلام وضعیت کروکی پلیس راهور
              </h3>
              <button
                type="button"
                onClick={() => setShowFuturePoliceModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
              >
                ✕
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
                  className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 border-2 border-blue-600 text-blue-950 text-right transition-all flex items-center justify-between group shadow-xs"
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
                  className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-500 text-amber-950 text-right transition-all flex items-center justify-between group shadow-xs"
                >
                  <div className="space-y-1 pl-2">
                    <span className="font-black text-xs block text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      خیر، کلاً کروکی ندارد (خسارت بدون کروکی)
                    </span>
                    <span className="text-[11px] text-slate-600 font-bold block leading-normal">
                      نیازی به ثبت موقت نیست؛ پرونده مستقیماً و بدون کروکی جهت ارزیابی به بیمه‌گر ارجاع می‌گردد.
                    </span>
                  </div>
                  <X className="w-5 h-5 text-amber-600 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chassis Guide Search & Selection Modal */}
      {showChassisGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-200 text-slate-900 animate-in zoom-in-95 dir-rtl">
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
                ✕
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
                    className="w-full pr-10 pl-9 py-2.5 rounded-xl border-2 border-slate-300 text-xs font-bold text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-900 shadow-2xs transition-colors"
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
                      ✕
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
                              ? 'bg-blue-900 text-white font-black shadow-xs'
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
                <div className="p-3.5 bg-sky-50 border-2 border-sky-300 rounded-2xl text-blue-950 text-xs font-bold space-y-2 animate-in fade-in">
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
                    className="w-full py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-1.5"
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
