import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Car,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Eye,
  Camera,
  Upload,
  Plus,
  Trash2,
  Send,
  Bell,
  MessageSquare,
  FileCheck,
  RotateCcw,
  CheckSquare,
  ShieldAlert,
  Sparkles,
  Info,
  DollarSign,
  Phone,
  User,
  Building2,
  Compass,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  X,
  Layers,
  Edit3,
  ShieldCheck,
  Maximize2,
  FileBadge,
  Check,
  Sliders,
  Save,
  Lock,
  Mic,
  Video
} from 'lucide-react';
import { ClaimCase, UserSession, AssessmentData, AssessorNotification, AdditionalDocItem, CarDamageSpot } from '../../types';
import { formatCurrency, getInsurerPersianName, loadAssessorNotifications, markAssessorNotificationAsRead } from '../../lib/storage';
import { compressImageFile } from '../../lib/imageCompressor';
import { Car3DViewer, ALL_INSPECTION_PARTS } from '../Car3DViewer';

interface FieldExpertPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updatedCase: ClaimCase) => void;
  onOpenCaseForm?: (caseId: string) => void;
}

type FieldTab = 'new_assignments' | 'in_progress' | 'completed' | 'rejected';
type WorkspaceTab = 'docs' | 'authenticity' | 'assessment_parts' | 'photos' | 'finalize';

// Standard car parts dictionary for fast field selection
const STANDARD_CAR_PARTS = [
  'سپر جلو',
  'جلو پنجره و آرم',
  'چراغ جلو راست',
  'چراغ جلو چپ',
  'مه‌شکن جلو',
  'درب موتور (کاپوت)',
  'گلگیر جلو راست',
  'گلگیر جلو چپ',
  'سقف خودرو',
  'درب جلو راست',
  'درب جلو چپ',
  'درب عقب راست',
  'درب عقب چپ',
  'رکاب راست',
  'رکاب چپ',
  'شیشه جلو',
  'شیشه عقب',
  'آینه بغل راست',
  'آینه بغل چپ',
  'گلگیر عقب راست',
  'گلگیر عقب چپ',
  'درب صندوق عقب',
  'سپر عقب',
  'چراغ عقب راست',
  'چراغ عقب چپ',
  'دیاق سپر جلو',
  'دیاق سپر عقب',
  'سینی فن و رادیاتور آب',
  'سرشاسی و سینی جلو راست',
  'سرشاسی و سینی جلو چپ',
  'سرشاسی و سینی عقب راست',
  'سرشاسی و سینی عقب چپ',
  'ستون جلو راست (ستون A)',
  'ستون جلو چپ (ستون A)',
  'ستون وسط راست (ستون B)',
  'ستون وسط چپ (ستون B)',
  'ستون عقب راست (ستون C)',
  'ستون عقب چپ (ستون C)',
  'رام زیر موتور',
  'رینگ و لاستیک',
  'سایر قطعات (سفارشی)'
];

export const FieldExpertPanel: React.FC<FieldExpertPanelProps> = ({
  session,
  cases,
  onUpdateCase
}) => {
  const [activeTab, setActiveTab] = useState<FieldTab>('new_assignments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<ClaimCase | null>(null);

  // SMS Notifications modal & states
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [notifications, setNotifications] = useState<AssessorNotification[]>(() => loadAssessorNotifications());

  // Insurer Instructions / Note Modal
  const [insurerNoteModalCase, setInsurerNoteModalCase] = useState<ClaimCase | null>(null);

  // Workspace sub-tabs when editing a case (Merged into 5 unified, highly organized stages)
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('docs');

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [caseToReject, setCaseToReject] = useState<ClaimCase | null>(null);
  const [rejectReason, setRejectReason] = useState('خارج از محدوده جغرافیایی و ترافیک سنگین');
  const [rejectDescription, setRejectDescription] = useState('');

  // Authenticity & Technical Verification State
  const [authVerdict, setAuthVerdict] = useState<'CONFIRMED' | 'FRAUD_REJECTED' | 'PARTIAL_MISMATCH'>('CONFIRMED');
  const [fieldReportText, setFieldReportText] = useState('');
  const [checklistItems, setChecklistItems] = useState({
    brakeMatch: true,
    impactHeightMatch: true,
    paintScratchesFresh: true,
    vinPhysicallyMatched: true,
    debrisAndFragmentsMatch: true
  });

  // 2D Diagram Car Damage Spots State (synchronized with 2D model)
  const [carDamageSpotsState, setCarDamageSpotsState] = useState<Record<string, CarDamageSpot>>({});

  // Field Parts & Pricing List State
  const [fieldParts, setFieldParts] = useState<Array<{
    id: string;
    partName: string;
    partKey?: string;
    operationType: 'تعویض کامل' | 'صافکاری و نقاشی' | 'تعمیر و تنظیم' | 'رنگ‌آمیزی' | 'صافکاری PDR بدون رنگ';
    partPrice: number;
    wagePrice: number;
    scrapPrice: number;
    damageSeverity: 'minor' | 'moderate' | 'major';
    note?: string;
  }>>([]);

  // New part input builder state
  const [selectedPartName, setSelectedPartName] = useState('سپر جلو');
  const [customPartName, setCustomPartName] = useState('');
  const [partOpType, setPartOpType] = useState<'تعویض کامل' | 'صافکاری و نقاشی' | 'تعمیر و تنظیم' | 'رنگ‌آمیزی' | 'صافکاری PDR بدون رنگ'>('تعویض کامل');
  const [partSeverity, setPartSeverity] = useState<'minor' | 'moderate' | 'major'>('major');
  const [partPriceInput, setPartPriceInput] = useState('18500000');
  const [wagePriceInput, setWagePriceInput] = useState('4500000');
  const [scrapPriceInput, setScrapPriceInput] = useState('2000000');
  const [partNoteInput, setPartNoteInput] = useState('');

  // Field photos with category
  const [fieldPhotos, setFieldPhotos] = useState<Array<{
    id: string;
    title: string;
    category: 'damage' | 'vin' | 'scene' | 'other';
    url: string;
    note?: string;
  }>>([]);
  const [newPhotoTitle, setNewPhotoTitle] = useState('عکس از قطعه آسیب‌دیده');
  const [newPhotoCategory, setNewPhotoCategory] = useState<'damage' | 'vin' | 'scene' | 'other'>('damage');

  // Preview modal for images
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Sync notifications
  const reloadNotifications = () => {
    setNotifications(loadAssessorNotifications());
  };

  const myNotifications = useMemo(() => {
    return notifications.filter((n) => !n.expertId || n.expertId === session.id || n.recipientPhone === session.phone);
  }, [notifications, session.id, session.phone]);

  const unreadSmsCount = useMemo(() => {
    return myNotifications.filter((n) => !n.read).length;
  }, [myNotifications]);

  // Filter cases assigned to this field expert (or matching company/id)
  const myCases = useMemo(() => {
    return cases.filter((c) => {
      const isAssignedToMe =
        c.assignedFieldExpert?.id === session.id ||
        c.assignedExpert?.id === session.id ||
        c.fieldVisitSchedule?.expertId === session.id;
      const isCompanyField =
        c.culpritInsurer === session.company ||
        c.victimInsurer === session.company ||
        c.bodyInsuranceInfo?.insurerCode === session.company ||
        !c.culpritInsurer;
      return (
        isAssignedToMe ||
        (session.id.startsWith('fe') && (c.isBodyClaim || c.isBodily || c.status.includes('میدانی') || c.needsCulpritFieldVisit)) ||
        (session.id === 'fed1' && (c.needsCulpritFieldVisit || c.status === 'تردید در اصالت تصادف' || c.status.includes('میدانی')))
      );
    });
  }, [cases, session.id, session.company]);

  // Categorize cases into 4 independent queues
  const rejectedCases = useMemo(() => {
    return myCases.filter((c) => {
      return c.rejectedByAssessorIds?.includes(session.id) || c.status === 'رد شده توسط کارشناس میدانی';
    });
  }, [myCases, session.id]);

  const completedCases = useMemo(() => {
    return myCases.filter((c) => {
      const isRejected = c.rejectedByAssessorIds?.includes(session.id) || c.status === 'رد شده توسط کارشناس میدانی';
      if (isRejected) return false;

      return (
        c.status === 'ارزیابی میدانی تکمیل شد - در انتظار صدور حواله پرداخت بیمه‌گر' ||
        c.status === 'در انتظار پرداخت' ||
        c.status === 'پرداخت شده' ||
        c.status === 'مختومه - پرداخت شد' ||
        c.status.includes('رد خسارت - صوری بودن') ||
        c.fieldExpertFinal === true ||
        Boolean(c.assessment && (c.assessment.fieldInspectionConfirmed || c.assessment.isFinalDecision))
      );
    });
  }, [myCases, session.id]);

  const inProgressCases = useMemo(() => {
    return myCases.filter((c) => {
      const isRejected = c.rejectedByAssessorIds?.includes(session.id) || c.status === 'رد شده توسط کارشناس میدانی';
      if (isRejected) return false;

      const isCompleted =
        c.status === 'ارزیابی میدانی تکمیل شد - در انتظار صدور حواله پرداخت بیمه‌گر' ||
        c.status === 'در انتظار پرداخت' ||
        c.status === 'پرداخت شده' ||
        c.status === 'مختومه - پرداخت شد' ||
        c.status.includes('رد خسارت - صوری بودن') ||
        c.fieldExpertFinal === true ||
        Boolean(c.assessment && (c.assessment.fieldInspectionConfirmed || c.assessment.isFinalDecision));
      if (isCompleted) return false;

      return (
        c.status === 'در حال بازدید کارشناس میدانی' ||
        c.status.includes('پیش‌نویس') ||
        c.status === 'در حال ارزیابی' ||
        c.fieldDraftSaved === true ||
        c.fieldVisitStarted === true
      );
    });
  }, [myCases, session.id]);

  const newAssignments = useMemo(() => {
    return myCases.filter((c) => {
      const isRejected = c.rejectedByAssessorIds?.includes(session.id) || c.status === 'رد شده توسط کارشناس میدانی';
      if (isRejected) return false;

      const isCompleted =
        c.status === 'ارزیابی میدانی تکمیل شد - در انتظار صدور حواله پرداخت بیمه‌گر' ||
        c.status === 'در انتظار پرداخت' ||
        c.status === 'پرداخت شده' ||
        c.status === 'مختومه - پرداخت شد' ||
        c.status.includes('رد خسارت - صوری بودن') ||
        c.fieldExpertFinal === true ||
        Boolean(c.assessment && (c.assessment.fieldInspectionConfirmed || c.assessment.isFinalDecision));
      if (isCompleted) return false;

      if (c.fieldVisitStarted || c.fieldDraftSaved) return false;

      return (
        c.status === 'در انتظار بازدید کارشناس میدانی' ||
        c.status === 'تردید در اصالت تصادف' ||
        (c.status === 'در انتظار ارجاع به ارزیاب' && c.needsCulpritFieldVisit) ||
        (!c.fieldVisitStarted && !c.assessment?.fieldInspectionConfirmed)
      );
    });
  }, [myCases, session.id]);

  // Read-only and Lock status for selected case
  const isCaseRejected = useMemo(() => {
    if (!selectedCase) return false;
    return Boolean(
      selectedCase.rejectedByAssessorIds?.includes(session.id) ||
      selectedCase.status === 'رد شده توسط کارشناس میدانی'
    );
  }, [selectedCase, session.id]);

  const isCaseSubmitted = useMemo(() => {
    if (!selectedCase) return false;
    return !isCaseRejected && (
      selectedCase.fieldExpertFinal === true ||
      selectedCase.status === 'ارزیابی میدانی تکمیل شد - در انتظار صدور حواله پرداخت بیمه‌گر' ||
      selectedCase.status.includes('رد خسارت - صوری بودن') ||
      selectedCase.status === 'در انتظار پرداخت' ||
      selectedCase.status === 'پرداخت شده' ||
      selectedCase.status === 'مختومه - پرداخت شد' ||
      Boolean(selectedCase.assessment?.fieldInspectionConfirmed || selectedCase.assessment?.isFinalDecision)
    );
  }, [selectedCase, isCaseRejected]);

  const isCaseReadOnly = isCaseSubmitted || isCaseRejected;

  // Active list based on activeTab
  const currentList = useMemo(() => {
    let list: ClaimCase[] = [];
    if (activeTab === 'new_assignments') list = newAssignments;
    else if (activeTab === 'in_progress') list = inProgressCases;
    else if (activeTab === 'completed') list = completedCases;
    else if (activeTab === 'rejected') list = rejectedCases;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((c) => {
      return (
        c.id.toLowerCase().includes(q) ||
        (c.carModel && c.carModel.toLowerCase().includes(q)) ||
        (c.carType && c.carType.toLowerCase().includes(q)) ||
        (c.plateNumber && c.plateNumber.includes(q)) ||
        (c.victimPlate && c.victimPlate.includes(q)) ||
        (c.victimName && c.victimName.toLowerCase().includes(q)) ||
        (c.accidentLocation && c.accidentLocation.toLowerCase().includes(q))
      );
    });
  }, [activeTab, newAssignments, inProgressCases, completedCases, rejectedCases, searchQuery]);

  // Open Workspace for a Case
  const handleOpenWorkspace = (claimCase: ClaimCase) => {
    setSelectedCase(claimCase);
    setWorkspaceTab('docs');

    // 1. If draft exists, reload draft state directly!
    if (claimCase.fieldExpertDraft) {
      const draft = claimCase.fieldExpertDraft;
      setFieldReportText(draft.fieldReportText || draft.note || claimCase.fieldExpertReportNote || claimCase.assessment?.notes || '');
      if (draft.authVerdict) {
        setAuthVerdict(draft.authVerdict as any);
      } else if (claimCase.fieldExpertVerdict) {
        setAuthVerdict(claimCase.fieldExpertVerdict as any);
      } else {
        setAuthVerdict('CONFIRMED');
      }

      if (draft.checklistItems) {
        setChecklistItems({
          brakeMatch: draft.checklistItems.brakeMatch ?? true,
          impactHeightMatch: draft.checklistItems.impactHeightMatch ?? true,
          paintScratchesFresh: draft.checklistItems.paintScratchesFresh ?? true,
          vinPhysicallyMatched: draft.checklistItems.vinPhysicallyMatched ?? true
        });
      }

      if (draft.carDamageSpots && Object.keys(draft.carDamageSpots).length > 0) {
        setCarDamageSpotsState(draft.carDamageSpots);
      } else if (claimCase.carDamageSpots && Object.keys(claimCase.carDamageSpots).length > 0) {
        setCarDamageSpotsState(claimCase.carDamageSpots);
      }

      if (draft.fieldParts && draft.fieldParts.length > 0) {
        setFieldParts(draft.fieldParts);
      } else if (draft.parts && draft.parts.length > 0) {
        setFieldParts(draft.parts);
      }

      if (draft.fieldPhotos && draft.fieldPhotos.length > 0) {
        setFieldPhotos(draft.fieldPhotos);
      }
      return;
    }

    // 2. Regular initial or completed load
    setFieldReportText(claimCase.fieldExpertReportNote || claimCase.assessment?.notes || '');

    // Set authenticity verdict
    if (claimCase.fieldExpertVerdict) {
      setAuthVerdict(claimCase.fieldExpertVerdict as any);
    } else if (claimCase.assessment?.authenticityVerdict) {
      setAuthVerdict(claimCase.assessment.authenticityVerdict as any);
    } else if (claimCase.fraudFlag?.flagged) {
      setAuthVerdict('FRAUD_REJECTED');
    } else {
      setAuthVerdict('CONFIRMED');
    }

    // Load 2D Car damage spots
    if (claimCase.carDamageSpots && Object.keys(claimCase.carDamageSpots).length > 0) {
      setCarDamageSpotsState(claimCase.carDamageSpots);
    } else {
      // Default initial damage spots based on impact area
      setCarDamageSpotsState({
        front_bumper: {
          type: 'شکستگی و خراشیدگی عمیق دیاق',
          severity: 'major',
          operation: 'تعویض کامل',
          color: 'red',
          note: 'سپر جلو دارای شکستگی عمیق در اثر ضربه مستقیم است.',
          updatedAt: new Date().toLocaleDateString('fa-IR')
        },
        fender_fr: {
          type: 'قرشدگی و خط و خش',
          severity: 'moderate',
          operation: 'صافکاری و نقاشی',
          color: 'orange',
          note: 'گلگیر جلو راست نیاز به صافکاری بی‌رنگ و لکه‌گیری دارد.',
          updatedAt: new Date().toLocaleDateString('fa-IR')
        }
      });
    }

    // Load parts list
    if (claimCase.assessment?.items && claimCase.assessment.items.length > 0) {
      setFieldParts(
        claimCase.assessment.items.map((it: any, idx: number) => ({
          id: `item-${idx}-${Date.now()}`,
          partName: it.partName,
          operationType: (it.operationType as any) || (it.action === 'REPLACE' ? 'تعویض کامل' : 'صافکاری و نقاشی'),
          partPrice: it.price || 0,
          wagePrice: it.wage || 0,
          scrapPrice: it.scrapValue || 0,
          damageSeverity: it.action === 'REPLACE' ? 'major' : 'moderate',
          note: it.note || ''
        }))
      );
    } else {
      // Default sample parts for field inspection
      setFieldParts([
        {
          id: 'part-1',
          partName: 'سپر جلو',
          partKey: 'front_bumper',
          operationType: 'تعویض کامل',
          partPrice: 18500000,
          wagePrice: 4500000,
          scrapPrice: 2000000,
          damageSeverity: 'major',
          note: 'شکستگی دیاق و پوسته سپر'
        },
        {
          id: 'part-2',
          partName: 'چراغ جلو راست',
          partKey: 'fender_fr',
          operationType: 'تعویض کامل',
          partPrice: 9200000,
          wagePrice: 1800000,
          scrapPrice: 1000000,
          damageSeverity: 'major',
          note: 'شکستگی پایه‌ها و طلق چراغ'
        },
        {
          id: 'part-3',
          partName: 'گلگیر جلو راست',
          partKey: 'fender_fr',
          operationType: 'صافکاری و نقاشی',
          partPrice: 0,
          wagePrice: 8500000,
          scrapPrice: 0,
          damageSeverity: 'moderate',
          note: 'صافکاری و رنگ‌آمیزی کلاف گلگیر'
        }
      ]);
    }

    // Load any existing field photos
    const loadedPhotos: Array<{ id: string; title: string; category: 'damage' | 'vin' | 'scene' | 'other'; url: string; note?: string }> = [];
    if (claimCase.additionalDocs) {
      claimCase.additionalDocs.forEach((d) => {
        if (d.uploaderRole?.includes('میدانی') || d.uploaderRole?.includes('expert') || d.docType?.includes('بازدید میدانی')) {
          loadedPhotos.push({
            id: d.id,
            title: d.title,
            category: d.title.includes('شاسی') || d.title.includes('VIN') ? 'vin' : d.title.includes('صحنه') ? 'scene' : 'damage',
            url: d.dataUrl || '',
            note: d.note
          });
        }
      });
    }

    // Add default demo field photos if none exist
    if (loadedPhotos.length === 0) {
      loadedPhotos.push(
        {
          id: 'p-1',
          title: 'عکس قطعه آسیب‌دیده - سپر و چراغ جلو راست',
          category: 'damage',
          url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80',
          note: 'نمای نزدیک از شکستگی دیاق و چراغ'
        },
        {
          id: 'p-2',
          title: 'عکس شماره شاسی و پلاک فیزیکی خودرو',
          category: 'vin',
          url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
          note: 'تطابق کامل شماره شاسی با کارت ماشین'
        },
        {
          id: 'p-3',
          title: 'زاویه برخورد و وضعیت خط ترمز در صحنه',
          category: 'scene',
          url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
          note: 'انطباق ارتفاع سپرها در محل تصادف'
        }
      );
    }
    setFieldPhotos(loadedPhotos);
  };

  // Save Draft (ثبت موقت) Handler
  const handleSaveDraft = () => {
    if (!selectedCase) return;
    if (isCaseReadOnly) {
      alert('این پرونده نهایی شده یا رد شده است و امکان تغییر ندارد.');
      return;
    }

    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const draftData = {
      gross: grossDamage,
      deductions: 0,
      salvage: totalScrapValue,
      payable: netPayable,
      note: fieldReportText.trim(),
      fieldReportText: fieldReportText.trim(),
      authVerdict,
      checklistItems,
      parts: fieldParts,
      fieldParts,
      fieldPhotos,
      carDamageSpots: carDamageSpotsState,
      savedAt: nowTimeStr,
      savedBy: session.name
    };

    const updated: ClaimCase = {
      ...selectedCase,
      fieldVisitStarted: true,
      fieldDraftSaved: true,
      fieldDraftSavedAt: nowTimeStr,
      fieldExpertDraft: draftData,
      carDamageSpots: carDamageSpotsState,
      fieldExpertVerdict: authVerdict,
      fieldExpertReportNote: fieldReportText.trim(),
      status: selectedCase.status === 'در انتظار بازدید کارشناس میدانی' ? 'در حال بازدید کارشناس میدانی' : selectedCase.status,
      history: [
        ...(selectedCase.history || []),
        {
          status: 'ثبت موقت پیش‌نویس ارزیابی میدانی',
          time: nowTimeStr,
          user: session.name,
          userRole: 'کارشناس میدانی',
          note: `اطلاعات و ارزیابی موقت پرونده با موفقیت ذخیره شد (تعداد قطعات: ${fieldParts.length}، عکس‌ها: ${fieldPhotos.length}، برآورد: ${formatCurrency(netPayable)} ریال). پرونده ارسال نشده و در کارتابل «در دست اقدام» کارشناس باقی ماند.`
        }
      ]
    };

    onUpdateCase(updated);
    setSelectedCase(updated);
    setActionSuccessMsg(`اطلاعات پرونده ${selectedCase.id} به عنوان پیش‌نویس موقت ذخیره شد و در کارتابل کارهای در دست اقدام شما باقی ماند.`);
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  // Accept Mission & Move to In-Progress
  const handleAcceptMission = (claimCase: ClaimCase) => {
    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const updated: ClaimCase = {
      ...claimCase,
      status: 'در حال بازدید کارشناس میدانی',
      fieldVisitStarted: true,
      assignedFieldExpert: {
        id: session.id,
        name: session.name,
        role: session.roleTitle || 'کارشناس رسمی میدانی',
        phone: session.phone || '۰۹۱۲۳۴۵۶۷۸۹',
        company: session.company || claimCase.culpritInsurer || 'dana'
      },
      history: [
        ...(claimCase.history || []),
        {
          status: 'در حال بازدید کارشناس میدانی',
          time: nowTimeStr,
          user: session.name,
          userRole: 'کارشناس میدانی',
          note: `ماموریت بازدید میدانی توسط کارشناس «${session.name}» قبول شد و اعزام به محل حادثه آغاز گردید.`
        }
      ]
    };

    onUpdateCase(updated);
    setActionSuccessMsg(`ماموریت پرونده ${claimCase.id} با موفقیت پذیرفته شد و وضعیت به «در حال بازدید میدانی» تغییر یافت.`);
    setTimeout(() => setActionSuccessMsg(null), 5000);
    handleOpenWorkspace(updated);
  };

  // Trigger Reject Modal
  const handleOpenReject = (claimCase: ClaimCase) => {
    setCaseToReject(claimCase);
    setRejectReason('خارج از محدوده جغرافیایی و ترافیک سنگین');
    setRejectDescription('');
    setShowRejectModal(true);
  };

  // Confirm Reject
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseToReject) return;

    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const updated: ClaimCase = {
      ...caseToReject,
      status: 'در انتظار ارجاع به ارزیاب',
      rejectedByAssessorIds: [...(caseToReject.rejectedByAssessorIds || []), session.id],
      history: [
        ...(caseToReject.history || []),
        {
          status: 'در انتظار ارجاع به ارزیاب',
          time: nowTimeStr,
          user: session.name,
          userRole: 'کارشناس میدانی',
          note: `رد مأموریت ارجاع‌شده توسط کارشناس میدانی «${session.name}». علت رد: «${rejectReason}» - توضیحات: ${rejectDescription || 'بدون توضیحات'}. پرونده جهت ارجاع به کارشناس دیگر به بیمه‌گر بازگردانده شد.`
        }
      ]
    };

    onUpdateCase(updated);
    setShowRejectModal(false);
    setCaseToReject(null);
    setActionSuccessMsg('ماموریت رد گردید و پرونده جهت تخصیص مجدد به کارشناس دیگر به شرکت بیمه‌گر بازگردانده شد.');
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // Sync damage spots change from 2D Car Viewer
  const handleDamageSpotsChange = (newSpots: Record<string, CarDamageSpot>) => {
    if (isCaseReadOnly) return;
    setCarDamageSpotsState(newSpots);
    if (selectedCase) {
      onUpdateCase({
        ...selectedCase,
        carDamageSpots: newSpots
      });
    }
  };

  // Auto add/update part when clicking/editing on 2D Car Model
  const handleAutoAddPartFromBlueprint = (partName: string, operationType: 'replace' | 'repair', note?: string) => {
    if (isCaseReadOnly) return;
    const existingIndex = fieldParts.findIndex((p) => p.partName === partName);
    const isReplace = operationType === 'replace';

    if (existingIndex >= 0) {
      const copy = [...fieldParts];
      copy[existingIndex] = {
        ...copy[existingIndex],
        operationType: isReplace ? 'تعویض کامل' : 'صافکاری و نقاشی',
        damageSeverity: isReplace ? 'major' : 'moderate',
        note: note || copy[existingIndex].note
      };
      setFieldParts(copy);
    } else {
      const newPartItem = {
        id: `part-${Date.now()}`,
        partName,
        operationType: (isReplace ? 'تعویض کامل' : 'صافکاری و نقاشی') as any,
        partPrice: isReplace ? 15000000 : 0,
        wagePrice: isReplace ? 3500000 : 8000000,
        scrapPrice: isReplace ? 1500000 : 0,
        damageSeverity: (isReplace ? 'major' : 'moderate') as any,
        note: note || ''
      };
      setFieldParts([...fieldParts, newPartItem]);
    }
  };

  // Add Part manually in unified workspace
  const handleAddPart = () => {
    if (isCaseReadOnly) return;
    const finalPartName = selectedPartName === 'سایر قطعات (سفارشی)' ? customPartName.trim() : selectedPartName;
    if (!finalPartName) return;

    const price = Number(partPriceInput) || 0;
    const wage = Number(wagePriceInput) || 0;
    const scrap = Number(scrapPriceInput) || 0;

    const newItem = {
      id: `part-${Date.now()}`,
      partName: finalPartName,
      operationType: partOpType,
      partPrice: price,
      wagePrice: wage,
      scrapPrice: scrap,
      damageSeverity: partSeverity,
      note: partNoteInput.trim()
    };

    setFieldParts([...fieldParts, newItem]);

    // Also sync to 2D car damage spots
    const matchingDef = ALL_INSPECTION_PARTS.find((p) => p.label === finalPartName);
    if (matchingDef) {
      const key = matchingDef.key;
      const colorMap = partSeverity === 'major' ? 'red' : partSeverity === 'moderate' ? 'orange' : 'yellow';
      const updatedSpots = {
        ...carDamageSpotsState,
        [key]: {
          type: partNoteInput.trim() || 'آسیب‌دیده در اثر تصادف',
          severity: partSeverity,
          operation: partOpType,
          color: colorMap as any,
          note: partNoteInput.trim(),
          updatedAt: new Date().toLocaleDateString('fa-IR')
        }
      };
      handleDamageSpotsChange(updatedSpots);
    }

    if (selectedPartName === 'سایر قطعات (سفارشی)') {
      setCustomPartName('');
    }
    setPartNoteInput('');
  };

  // Remove Part
  const handleRemovePart = (id: string, partName?: string) => {
    if (isCaseReadOnly) return;
    setFieldParts(fieldParts.filter((p) => p.id !== id));
    if (partName) {
      const matchingDef = ALL_INSPECTION_PARTS.find((p) => p.label === partName);
      if (matchingDef && carDamageSpotsState[matchingDef.key]) {
        const updatedSpots = { ...carDamageSpotsState };
        delete updatedSpots[matchingDef.key];
        handleDamageSpotsChange(updatedSpots);
      }
    }
  };

  // Financial Calculations
  const totalPartsCost = useMemo(() => fieldParts.reduce((acc, p) => acc + p.partPrice, 0), [fieldParts]);
  const totalWageCost = useMemo(() => fieldParts.reduce((acc, p) => acc + p.wagePrice, 0), [fieldParts]);
  const totalScrapValue = useMemo(() => fieldParts.reduce((acc, p) => acc + p.scrapPrice, 0), [fieldParts]);
  const grossDamage = totalPartsCost + totalWageCost;
  const netPayable = Math.max(0, grossDamage - totalScrapValue);

  // Add Photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCaseReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await compressImageFile(file, 1000, 0.7);
    const newP = {
      id: `field-img-${Date.now()}`,
      title: newPhotoTitle || file.name,
      category: newPhotoCategory,
      url
    };
    setFieldPhotos([...fieldPhotos, newP]);
  };

  // Preset quick capture demo photo
  const handleAddPresetPhoto = (title: string, category: 'damage' | 'vin' | 'scene' | 'other', url: string) => {
    if (isCaseReadOnly) return;
    const newP = {
      id: `field-img-${Date.now()}`,
      title,
      category,
      url
    };
    setFieldPhotos([...fieldPhotos, newP]);
  };

  // Descriptive report quick templates
  const handleInsertReportTemplate = (type: 'confirmed' | 'partial' | 'fraud') => {
    if (isCaseReadOnly) return;
    if (type === 'confirmed') {
      setAuthVerdict('CONFIRMED');
      setFieldReportText(
        `پس از حضور در محل اعلامی حادثه و بررسی فیزیکی خودروی ${selectedCase?.carType || selectedCase?.carModel || 'زیان‌دیده'} با پلاک ${selectedCase?.victimPlate || selectedCase?.plateNumber || ''}، انطباق کامل ارتفاع سپرها، زاویه برخورد و ترکش‌های ناشی از تصادف تایید گردید. شماره شاسی و VIN فیزیکی خودرو با مشخصات مندرج در کارت ماشین و بیمه‌نامه تطابق ۱۰۰٪ دارد. آسیب‌های ثبت‌شده در مدل دوبعدی و جدول قطعات مربوط به همین حادثه بوده و اصالت تصادف تایید می‌شود.`
      );
    } else if (type === 'partial') {
      setAuthVerdict('PARTIAL_MISMATCH');
      setFieldReportText(
        `در بررسی میدانی خودرو در محل، اصل وقوع حادثه از ناحیه جلو تایید شد؛ اما آثار خط و خش و رنگ‌پریدگی کهنه روی گلگیر و درب عقب مربوط به تصادفات قبلی بوده و از شمول ارزیابی این پرونده حذف گردید. خسارت صرفاً برای قطعات آسیب‌دیده مستقیم این برخورد محاسبه و منظور شده است.`
      );
    } else {
      setAuthVerdict('FRAUD_REJECTED');
      setFieldReportText(
        `با بررسی دقیق فیزیکی در محل، عدم انطباق شدید در ارتفاع ضربه، عدم وجود خط ترمز منطبق، کهنگی گرد و غبار روی محل شکستگی قطعات و عدم تطابق رنگ خودروی مقصر با آثار به جا مانده مشاهده شد. تصادف صوری و ساختگی تشخیص داده شد و پرونده جهت رد خسارت و بررسی حقوقی به شرکت بیمه‌گر ارسال می‌گردد.`
      );
    }
  };

  // Final Submit to Insurer for Payment (No user confirmation needed)
  const handleSubmitDirectToInsurer = () => {
    if (!selectedCase) return;
    if (isCaseReadOnly) {
      alert('این پرونده نهایی شده یا رد شده است و امکان ارسال مجدد ندارد.');
      return;
    }

    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    // Build assessment data
    const assessmentItems = fieldParts.map((p) => ({
      partName: p.partName,
      action: (p.operationType === 'تعویض کامل' ? 'REPLACE' : 'REPAIR') as 'REPLACE' | 'REPAIR',
      operationType: p.operationType,
      price: p.partPrice,
      wage: p.wagePrice,
      scrapValue: p.scrapPrice,
      totalItemCost: p.partPrice + p.wagePrice - p.scrapPrice,
      severity: p.damageSeverity,
      note: p.note
    }));

    const assessmentResult: AssessmentData = {
      version: '1.0',
      gross: grossDamage,
      deductions: 0,
      salvage: totalScrapValue,
      payable: netPayable,
      status: 'SUBMITTED',
      id: `FIELD-ASSESS-${Date.now()}`,
      caseId: selectedCase.id,
      assessorId: session.id,
      assessorName: session.name,
      assessedAt: nowTimeStr,
      items: assessmentItems,
      parts: fieldParts.map((p) => ({
        name: p.partName,
        type: p.operationType === 'تعویض کامل' ? 'replace' : 'repair',
        partPrice: p.partPrice,
        repairPrice: p.wagePrice,
        salvageNeeded: p.scrapPrice > 0,
        salvageValue: p.scrapPrice
      })),
      totalPartsCost,
      totalWageCost,
      totalScrapValue,
      totalAmount: netPayable,
      notes: fieldReportText.trim() || 'گزارش ارزیابی میدانی در محل حادثه تکمیل و اصالت تایید گردید.',
      reviewerNote: fieldReportText.trim(),
      isFinalDecision: true,
      fieldInspectionConfirmed: authVerdict === 'CONFIRMED',
      authenticityVerdict: authVerdict
    };

    // Prepare uploaded photos as additional docs with field expert role
    const uploadedDocs: AdditionalDocItem[] = fieldPhotos.map((fp) => ({
      id: fp.id,
      title: fp.title,
      docType: 'عکس بازدید میدانی کارشناس',
      fileType: 'image',
      fileName: 'field_evidence.jpg',
      dataUrl: fp.url,
      uploadedBy: session.name,
      uploaderRole: 'کارشناس میدانی',
      uploaderParty: 'EXPERT',
      uploadedAt: nowTimeStr,
      visibility: 'SHARED',
      note: fp.note || `عکس بازدید میدانی در دسته: ${fp.category}`
    }));

    const finalStatus = authVerdict === 'FRAUD_REJECTED'
      ? 'رد خسارت - صوری بودن تصادف توسط کارشناس میدانی'
      : 'ارزیابی میدانی تکمیل شد - در انتظار صدور حواله پرداخت بیمه‌گر';

    const updated: ClaimCase = {
      ...selectedCase,
      status: finalStatus,
      assessment: assessmentResult,
      carDamageSpots: carDamageSpotsState,
      fieldExpertFinal: true,
      fieldExpertVerdict: authVerdict,
      fieldExpertReportNote: fieldReportText.trim(),
      additionalDocs: [...(selectedCase.additionalDocs || []), ...uploadedDocs],
      history: [
        ...(selectedCase.history || []),
        {
          status: finalStatus,
          time: nowTimeStr,
          user: session.name,
          userRole: 'کارشناس میدانی',
          note: `تنظیم و ثبت نهایی گزارش میدانی توسط کارشناس «${session.name}» با مبلغ خالص ${formatCurrency(netPayable)} ریال (${formatCurrency(Math.round(netPayable / 10))} تومان) و ارسال مستقیم به واحد مالی و صدور حواله شرکت بیمه. اصالت‌سنجی: ${authVerdict === 'CONFIRMED' ? 'تایید اصالت' : authVerdict === 'PARTIAL_MISMATCH' ? 'عدم انطباق جزئی' : 'رد خسارت صوری'}.`
        }
      ]
    };

    onUpdateCase(updated);
    setSelectedCase(null);
    setActionSuccessMsg(`گزارش میدانی پرونده ${selectedCase.id} با موفقیت ثبت و به پنل بیمه‌گر ارسال گردید.`);
    setTimeout(() => setActionSuccessMsg(null), 6000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in" dir="rtl">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span>پورتال اختصاصی و مستقل کارشناس میدانی (بازدید در محل)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{session.name}</span>
              <span className="text-xs font-bold px-3 py-1 bg-amber-400 text-blue-950 rounded-xl shadow-xs">
                {session.roleTitle || 'کارشناس میدانی رسمی'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ماموریت‌های اعزام به محل حادثه، بازرسی فیزیکی خودروها، احراز اصالت صحنه تصادف و برآورد مستقیم خسارت با مدل تعاملی ۲بعدی جهت تسویه فوری توسط شرکت بیمه.
            </p>
          </div>

          {/* SMS & Dispatch Alerts Button */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => {
                setShowSmsModal(true);
                myNotifications.forEach((n) => markAssessorNotificationAsRead(n.id));
                reloadNotifications();
              }}
              className="relative px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black transition-all flex items-center gap-2.5 shadow-lg active:scale-95 cursor-pointer"
            >
              <Bell className="w-5 h-5 text-amber-400" />
              <span>پیامک‌ها و اعلان‌های اعزام فوری</span>
              {unreadSmsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[11px] flex items-center justify-center animate-pulse">
                  {unreadSmsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback Message */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-100 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs sm:text-sm font-black flex items-center gap-3 shadow-md animate-in zoom-in-95">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Content Area: Case List or Active Workspace */}
      {!selectedCase ? (
        <div className="space-y-6">
          {/* Tabs Navigation */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab('new_assignments')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'new_assignments'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>ماموریت‌های جدید ارجاعی (قبول/رد)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'new_assignments' ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {newAssignments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('in_progress')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'in_progress'
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>در حال بازدید و تنظیم گزارش میدانی</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'in_progress' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {inProgressCases.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'completed'
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تکمیل‌شده و ارسالی به بیمه (تسویه)</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'completed' ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {completedCases.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'rejected'
                    ? 'bg-rose-700 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>ماموریت‌های رد شده</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'rejected' ? 'bg-rose-900 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {rejectedCases.length}
                </span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی شماره پرونده، پلاک، مدل خودرو..."
                className="w-full pr-9 pl-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Cases Grid */}
          {currentList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="font-black text-slate-800 text-sm">موردی در این بخش یافت نشد</h3>
              <p className="text-xs text-slate-500">
                در صورت ارجاع پرونده جدید از طرف شرکت بیمه یا اعلام تردید در اصالت تصادف، بلافاصله در این بخش ظاهر خواهد شد.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentList.map((c) => {
                const isDisputed = Boolean(c.authenticityDispute || c.status === 'تردید در اصالت تصادف');
                const isNoKroki = !c.hasKroki && !c.sceneReportCode;

                return (
                  <div
                    key={c.id}
                    className={`bg-white rounded-3xl p-5 border-2 shadow-xs transition-all flex flex-col justify-between space-y-4 hover:shadow-md ${
                      isDisputed ? 'border-amber-400 bg-gradient-to-b from-amber-50/40 to-white' : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-black font-mono text-blue-950 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {c.id}
                        </span>

                        <div className="flex items-center gap-1 flex-wrap">
                          {c.fieldDraftSaved && activeTab === 'in_progress' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                              <Save className="w-3 h-3 text-amber-700" />
                              <span>پیش‌نویس موقت</span>
                            </span>
                          )}
                          {activeTab === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                              <Lock className="w-3 h-3 text-emerald-700" />
                              <span>ارزیابی ارسال شده</span>
                            </span>
                          )}
                          {activeTab === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 shadow-2xs">
                              <Lock className="w-3 h-3 text-rose-700" />
                              <span>رد شده</span>
                            </span>
                          )}
                          {isDisputed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1 shadow-2xs">
                              <ShieldAlert className="w-3 h-3" />
                              <span>تردید در اصالت</span>
                            </span>
                          )}
                          {isNoKroki && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-950 border border-orange-200">
                              فاقد کروکی
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Car & Plate Details */}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-1.5">
                          <Car className="w-4 h-4 text-emerald-700" />
                          <span>{c.carModel || c.carType || 'خودرو زیان‌دیده'}</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          پلاک: <span className="font-bold text-slate-800">{c.plateNumber || c.victimPlate || 'نامشخص'}</span>
                        </p>
                        {c.fieldDraftSaved && c.fieldDraftSavedAt && activeTab === 'in_progress' && (
                          <p className="text-[11px] text-amber-700 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                            <span>آخرین ذخیره موقت:</span>
                            <span className="font-mono">{c.fieldDraftSavedAt}</span>
                          </p>
                        )}
                      </div>

                      {/* Location & Parties */}
                      <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight font-medium">
                            {c.accidentLocation || c.address || 'تهران، محل اعلامی طرفین حادثه'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-600">
                          <span>زیان‌دیده: <strong>{c.victimName || 'نامشخص'}</strong></span>
                          <span>تاریخ: <strong>{c.date}</strong></span>
                        </div>
                      </div>

                      {/* Authenticity Dispute Details if present */}
                      {c.authenticityDispute && (
                        <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-[11px] text-amber-950 space-y-1">
                          <span className="font-extrabold block text-amber-900">علت اعلام تردید مشتری:</span>
                          <p className="line-clamp-2 font-medium">«{c.authenticityDispute.reason}» - {c.authenticityDispute.description}</p>
                        </div>
                      )}

                      {/* Insurer Note / Instructions Button & Preview */}
                      <button
                        type="button"
                        onClick={() => setInsurerNoteModalCase(c)}
                        className="w-full p-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 hover:border-purple-300 rounded-xl text-right transition-all group flex items-center justify-between shadow-2xs cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="font-black text-xs text-purple-950 block">
                              دستور بیمه‌گر ({getInsurerPersianName(c.culpritInsurer) || 'بیمه‌گر'})
                            </span>
                            {(c.insurerFieldExpertNote || c.insurerAssignmentNote || c.insurerInstruction) ? (
                              <span className="text-[10px] text-purple-800 line-clamp-1 font-medium mt-0.5">
                                «{c.insurerFieldExpertNote || c.insurerAssignmentNote || c.insurerInstruction}»
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium">مشاهده مشخصات و دستور ارجاع</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-purple-700 bg-white/90 px-2 py-1 rounded-lg border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0 mr-2">
                          دستور بیمه
                        </span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {activeTab === 'new_assignments' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAcceptMission(c)}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>قبول ماموریت</span>
                          </button>

                          <button
                            onClick={() => handleOpenReject(c)}
                            className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>رد ماموریت</span>
                          </button>
                        </div>
                      )}

                      {(activeTab === 'in_progress' || activeTab === 'completed' || activeTab === 'rejected') && (
                        <button
                          onClick={() => handleOpenWorkspace(c)}
                          className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
                            activeTab === 'completed'
                              ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                              : activeTab === 'rejected'
                              ? 'bg-rose-900 hover:bg-rose-800 text-white'
                              : c.fieldDraftSaved
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-blue-900 hover:bg-blue-800 text-white'
                          }`}
                        >
                          {activeTab === 'completed' || activeTab === 'rejected' ? (
                            <Lock className="w-4 h-4 text-amber-300" />
                          ) : c.fieldDraftSaved ? (
                            <Edit3 className="w-4 h-4 text-white" />
                          ) : (
                            <Eye className="w-4 h-4 text-amber-400" />
                          )}
                          <span>
                            {activeTab === 'completed'
                              ? 'مشاهده گزارش ارسالی به بیمه (فقط خواندنی)'
                              : activeTab === 'rejected'
                              ? 'مشاهده پرونده رد شده (فقط خواندنی)'
                              : c.fieldDraftSaved
                              ? 'ادامه ویرایش پیش‌نویس موقت'
                              : 'ورود به فرم گزارش میدانی'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* WORKSPACE: UNIFIED FIELD INSPECTION WORKSPACE */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
          {/* Top Bar of Workspace */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به لیست ماموریت‌ها</span>
                </button>
                <span className="text-xs font-black text-blue-950 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                  پرونده {selectedCase.id}
                </span>
                {isCaseSubmitted && (
                  <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>ارزیابی ارسال شده (فقط خواندنی)</span>
                  </span>
                )}
                {isCaseRejected && (
                  <span className="text-xs font-black text-rose-950 bg-rose-100 px-3 py-1 rounded-xl border border-rose-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-rose-700" />
                    <span>رد شده (فقط خواندنی)</span>
                  </span>
                )}
                {!isCaseReadOnly && selectedCase.fieldDraftSaved && (
                  <span className="text-xs font-black text-amber-950 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1">
                    <Save className="w-3.5 h-3.5 text-amber-700" />
                    <span>پیش‌نویس موقت ذخیره شده {selectedCase.fieldDraftSavedAt ? `(${selectedCase.fieldDraftSavedAt})` : ''}</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-black text-slate-900 pt-1">
                فرم کارشناسی میدانی در محل: {selectedCase.carModel || selectedCase.carType} ({selectedCase.plateNumber || selectedCase.victimPlate})
              </h2>
            </div>

            {/* Actions & Status Banner */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {!isCaseReadOnly ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
                    title="ذخیره موقت بدون ارسال به بیمه‌گر"
                  >
                    <Save className="w-4 h-4" />
                    <span>ثبت موقت اطلاعات</span>
                  </button>

                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-950 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-extrabold block text-emerald-900">تسویه مستقیم بیمه:</span>
                      <span className="text-[11px] text-emerald-800">برآورد میدانی پس از تایید نهایی به پنل بیمه‌گر ارسال می‌گردد.</span>
                    </div>
                  </div>
                </>
              ) : isCaseSubmitted ? (
                <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3 text-xs text-emerald-950 flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-extrabold block text-emerald-900">گزارش ارزیابی نهایی ارسال شده است</span>
                    <span className="text-[11px] text-emerald-800">این پرونده جهت صدور حواله در اختیار بیمه‌گر است و اطلاعات در حالت فقط خواندنی قرار دارد.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-3 text-xs text-rose-950 flex items-center gap-2.5">
                  <XCircle className="w-5 h-5 text-rose-700 shrink-0" />
                  <div>
                    <span className="font-extrabold block text-rose-900">این ماموریت رد شده است</span>
                    <span className="text-[11px] text-rose-800">اطلاعات پرونده در وضعیت فقط خواندنی نگهداری می‌شود.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Insurer Instructions Alert in Workspace */}
          {(selectedCase.insurerFieldExpertNote || selectedCase.insurerAssignmentNote || selectedCase.insurerInstruction) && (
            <div className="p-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-purple-200 rounded-2xl flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-black text-xs text-purple-950 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    دستورالعمل و توضیحات شرکت بیمه ({getInsurerPersianName(selectedCase.culpritInsurer) || 'بیمه‌گر'}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setInsurerNoteModalCase(selectedCase)}
                    className="text-[10px] font-black text-purple-800 bg-white px-2.5 py-1 rounded-lg border border-purple-300 hover:bg-purple-100 flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                  >
                    <span>مشاهده صفحه توضیحات</span>
                    <ExternalLink className="w-3 h-3 text-purple-700" />
                  </button>
                </div>
                <p className="text-xs text-purple-950 font-bold leading-relaxed bg-white/80 p-2.5 rounded-xl border border-purple-100">
                  «{selectedCase.insurerFieldExpertNote || selectedCase.insurerAssignmentNote || selectedCase.insurerInstruction}»
                </p>
                <div className="flex items-center justify-between text-[10px] text-purple-700 font-medium">
                  <span>ثبت توسط: {selectedCase.insurerNoteAuthor || 'کارشناس پذیرش پورتال بیمه‌گر'}</span>
                  {selectedCase.insurerNoteDate && <span className="font-mono">{selectedCase.insurerNoteDate}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Workspace Unified 5 Sub-Tabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setWorkspaceTab('docs')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                workspaceTab === 'docs'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>۱. مدارک و پرونده اصلی</span>
            </button>

            <button
              onClick={() => setWorkspaceTab('authenticity')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                workspaceTab === 'authenticity'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>۲. اصالت‌سنجی و گزارش تشریحی</span>
              {authVerdict && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  authVerdict === 'CONFIRMED' ? 'bg-emerald-400 text-emerald-950' : authVerdict === 'PARTIAL_MISMATCH' ? 'bg-amber-400 text-amber-950' : 'bg-rose-500 text-white'
                }`}>
                  {authVerdict === 'CONFIRMED' ? 'تایید' : authVerdict === 'PARTIAL_MISMATCH' ? 'مغایرت' : 'رد صوری'}
                </span>
              )}
            </button>

            <button
              onClick={() => setWorkspaceTab('assessment_parts')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                workspaceTab === 'assessment_parts'
                  ? 'bg-blue-900 text-white shadow-xs ring-2 ring-blue-900/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>۳. ارزیابی خسارت، مدل ۲بعدی و قیمت‌گذاری</span>
              {fieldParts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                  {fieldParts.length} قطعه
                </span>
              )}
            </button>

            <button
              onClick={() => setWorkspaceTab('photos')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                workspaceTab === 'photos'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>۴. عکس‌های بازدید میدانی و خسارت</span>
              {fieldPhotos.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-black">
                  {fieldPhotos.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setWorkspaceTab('finalize')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                workspaceTab === 'finalize'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>۵. تایید نهایی و ارسال به بیمه‌گر</span>
            </button>
          </div>

          {/* TAB 1: ORIGINAL DOSSIER & DOCUMENTS (مدارک و پرونده اصلی) */}
          {workspaceTab === 'docs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Accident & Parties Info */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-900" />
                    <span>مشخصات طرفین و بیمه‌نامه‌های پرونده اصلی</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">زیان‌دیده:</span>
                      <span className="font-bold">{selectedCase.victimName} ({selectedCase.victimPhone})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">پلاک زیان‌دیده:</span>
                      <span className="font-bold font-mono">{selectedCase.victimPlate || selectedCase.plateNumber}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">شماره شاسی (VIN):</span>
                      <span className="font-mono font-bold text-slate-900">{selectedCase.victimVin || 'IR-VIN-99283411'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">مقصر حادثه:</span>
                      <span className="font-bold">{selectedCase.culpritName} ({selectedCase.culpritPhone})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">پلاک مقصر:</span>
                      <span className="font-bold font-mono">{selectedCase.culpritPlate || 'نامشخص'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">شرکت بیمه‌گر مقصر:</span>
                      <span className="font-black text-blue-950">{getInsurerPersianName(selectedCase.culpritInsurer)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">محل دقیق حادثه:</span>
                      <span className="font-bold text-slate-900">{selectedCase.accidentLocation || selectedCase.address || 'تهران'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">تاریخ و زمان حادثه:</span>
                      <span className="font-bold text-slate-900">{selectedCase.date}</span>
                    </div>
                  </div>
                </div>

                {/* Dispute / Kroki Info */}
                <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="font-black text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>وضعیت کروکی و مشخصات مأموریت</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-800">
                    <div className="flex justify-between py-1 border-b border-amber-200/70">
                      <span className="text-slate-600">کروکی رسمی پلیس:</span>
                      <span className="font-bold">{selectedCase.hasKroki ? `دارد (کد: ${selectedCase.sceneReportCode || 'الکترونیک'})` : 'فاقد کروکی (نیاز به احراز اصالت فیزیکی)'}</span>
                    </div>
                    {selectedCase.assignedBranch && (
                      <div className="flex justify-between py-1 border-b border-amber-200/70">
                        <span className="text-slate-600">شعبه ارجاعی بازدید:</span>
                        <span className="font-bold text-indigo-950">{selectedCase.assignedBranch.name}</span>
                      </div>
                    )}
                    {selectedCase.fieldVisitSchedule && (
                      <div className="flex justify-between py-1 border-b border-amber-200/70">
                        <span className="text-slate-600">زمان هماهنگ‌شده بازدید:</span>
                        <span className="font-bold text-indigo-950">{selectedCase.fieldVisitSchedule.scheduledDate} ساعت {selectedCase.fieldVisitSchedule.scheduledTime}</span>
                      </div>
                    )}
                    {selectedCase.customerKrokiPhoto && (
                      <div className="py-2">
                        <span className="text-slate-700 font-bold block mb-1">تصویر کروکی بارگذاری‌شده:</span>
                        <div
                          onClick={() => setPreviewPhotoUrl(selectedCase.customerKrokiPhoto!)}
                          className="w-full h-32 bg-slate-200 rounded-xl overflow-hidden cursor-pointer border border-amber-300 relative group"
                        >
                          <img src={selectedCase.customerKrokiPhoto} alt="کروکی" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                            بزرگ‌نمایی کروکی
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCase.authenticityDispute && (
                      <div className="py-1">
                        <span className="text-amber-900 font-extrabold block mb-1">متن اعتراض و تردید در اصالت:</span>
                        <p className="bg-white p-2.5 rounded-xl border border-amber-200 font-medium text-slate-800 leading-relaxed text-[11px]">
                          <strong>«{selectedCase.authenticityDispute.reason}»</strong>: {selectedCase.authenticityDispute.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bodily Claim Multimedia (Audio / Video / Description) */}
              {(selectedCase.audioExplanation ||
                selectedCase.videoExplanation ||
                selectedCase.writtenReport ||
                selectedCase.files?.some((f) => f.type === 'audio' || f.type === 'video')) && (
                <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-200 rounded-2xl p-5 space-y-4 shadow-xs">
                  <h4 className="font-black text-blue-950 text-xs sm:text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    <span>مستندات صوتی، تصویری و شرح سانحه بارگذاری‌شده توسط بیمه‌گذار</span>
                  </h4>

                  {selectedCase.writtenReport && (
                    <div className="bg-white p-3.5 rounded-xl border border-sky-200 text-xs space-y-1">
                      <span className="font-black text-slate-900 block text-[11px]">شرح کتبی حادثه:</span>
                      <p className="text-slate-700 leading-relaxed">{selectedCase.writtenReport}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(selectedCase.audioExplanation ||
                      selectedCase.files?.find((f) => f.type === 'audio' || f.name.includes('صوت'))) && (
                      <div className="bg-white p-3.5 rounded-xl border border-sky-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-sky-600" />
                          <span className="font-black text-xs text-sky-950">صوت ضبط شده راننده:</span>
                        </div>
                        <audio
                          src={
                            selectedCase.audioExplanation?.dataUrl ||
                            selectedCase.files?.find((f) => f.type === 'audio' || f.name.includes('صوت'))?.dataUrl ||
                            'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
                          }
                          controls
                          className="w-full h-9"
                        />
                      </div>
                    )}

                    {(selectedCase.videoExplanation ||
                      selectedCase.files?.find((f) => f.type === 'video' || f.name.includes('ویدیو'))) && (
                      <div className="bg-white p-3.5 rounded-xl border border-sky-200 space-y-2">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-rose-600" />
                          <span className="font-black text-xs text-rose-950">ویدیوی دور خودرو:</span>
                        </div>
                        <video
                          src={
                            selectedCase.videoExplanation?.dataUrl ||
                            selectedCase.files?.find((f) => f.type === 'video' || f.name.includes('ویدیو'))?.dataUrl
                          }
                          controls
                          className="w-full max-h-40 rounded-lg object-contain bg-slate-900"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photos & Evidence Uploaded in Original Case */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <FileBadge className="w-4 h-4 text-blue-900" />
                    <span>عکس‌ها، مدارک و اسناد اولیه پرونده (مشتریان، پلیس و سامانه):</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-bold">
                    کلیک روی هر تصویر جهت بزرگ‌نمایی
                  </span>
                </div>

                {(!selectedCase.additionalDocs || selectedCase.additionalDocs.length === 0) ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    مدرک اضافه‌ای بارگذاری نشده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedCase.additionalDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => doc.dataUrl && setPreviewPhotoUrl(doc.dataUrl)}
                        className="bg-slate-50 rounded-2xl p-2 border border-slate-200 cursor-pointer hover:border-blue-900 transition-all space-y-1.5 group"
                      >
                        <div className="w-full h-28 bg-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center">
                          {doc.dataUrl ? (
                            <img src={doc.dataUrl} alt={doc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-400" />
                          )}
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                            مشاهده
                          </div>
                        </div>
                        <div className="px-1">
                          <span className="text-[11px] font-bold text-slate-800 truncate block">{doc.title}</span>
                          <span className="text-[9px] text-slate-500 block">{doc.uploaderRole || 'مشتری'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setWorkspaceTab('authenticity')}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>مرحله بعدی: اصالت‌سنجی و گزارش تشریحی</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: AUTHENTICITY & PHYSICAL REPORT (اصالت‌سنجی و گزارش تشریحی) */}
          {workspaceTab === 'authenticity' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1">
                <h4 className="font-black text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>دستورالعمل احراز اصالت فیزیکی تصادف در محل:</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-blue-900/90 font-medium">
                  لطفاً تطابق خطوط ترمز، زاویه و ارتفاع نقاط برخورد دو خودرو، کهنگی یا تازگی رنگ‌پریدگی‌ها، وضعیت شماره شاسی (VIN) و قطعات داغی را به دقت ارزیابی نمایید.
                </p>
              </div>

              {/* Verdict Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-900">
                  نتیجه بررسی اصالت فیزیکی تصادف و انطباق آسیب‌ها: <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => !isCaseReadOnly && handleInsertReportTemplate('confirmed')}
                    className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                      isCaseReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      authVerdict === 'CONFIRMED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                        : isCaseReadOnly
                        ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">✅ اصالت تایید گردید</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      تصادف واقعی بوده و زاویه و ابعاد برخورد با خسارت ادعاشده کاملاً منطبق است.
                    </p>
                  </div>

                  <div
                    onClick={() => !isCaseReadOnly && handleInsertReportTemplate('partial')}
                    className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                      isCaseReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      authVerdict === 'PARTIAL_MISMATCH'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-sm'
                        : isCaseReadOnly
                        ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">⚠️ عدم انطباق بخشی از خسارت</span>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      اصل برخورد تایید شده اما برخی قطعات مربوط به تصادف قبلی است و حذف می‌گردد.
                    </p>
                  </div>

                  <div
                    onClick={() => !isCaseReadOnly && handleInsertReportTemplate('fraud')}
                    className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                      isCaseReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      authVerdict === 'FRAUD_REJECTED'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-sm'
                        : isCaseReadOnly
                        ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">❌ تصادف صوری (رد خسارت)</span>
                      <XCircle className="w-4 h-4 text-rose-600" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      صحنه ساختگی بوده و آسیب‌ها فاقد انطباق فیزیکی و اصطکاک لازم است.
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Inspection Checklist */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <span className="font-extrabold text-slate-900 block mb-2">چک‌لیست بررسی فنی و میدانی کارشناس:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <label className={`flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 ${isCaseReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={isCaseReadOnly}
                      checked={checklistItems.brakeMatch}
                      onChange={(e) => setChecklistItems({ ...checklistItems, brakeMatch: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span>بررسی خط ترمز و مسیر حرکت خودروها در صحنه</span>
                  </label>
                  <label className={`flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 ${isCaseReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={isCaseReadOnly}
                      checked={checklistItems.impactHeightMatch}
                      onChange={(e) => setChecklistItems({ ...checklistItems, impactHeightMatch: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span>تطبیق ارتفاع سپرها و خطوط طولی برخورد دو خودرو</span>
                  </label>
                  <label className={`flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 ${isCaseReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={isCaseReadOnly}
                      checked={checklistItems.paintScratchesFresh}
                      onChange={(e) => setChecklistItems({ ...checklistItems, paintScratchesFresh: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span>بررسی تازگی رنگ‌پریدگی و خراش‌های سطحی</span>
                  </label>
                  <label className={`flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 ${isCaseReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={isCaseReadOnly}
                      checked={checklistItems.vinPhysicallyMatched}
                      onChange={(e) => setChecklistItems({ ...checklistItems, vinPhysicallyMatched: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span>تطبیق شماره شاسی فیزیکی (VIN) و شماره موتور با کارت خودرو</span>
                  </label>
                </div>
              </div>

              {/* Text Report */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-900">
                    گزارش تشریحی و فنی کارشناس میدانی: <span className="text-rose-500">*</span>
                  </label>
                  {!isCaseReadOnly && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500">قالب‌های سریع:</span>
                      <button
                        type="button"
                        onClick={() => handleInsertReportTemplate('confirmed')}
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 cursor-pointer"
                      >
                        تایید انطباق
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertReportTemplate('partial')}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold hover:bg-amber-200 cursor-pointer"
                      >
                        مغایرت جزئی
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertReportTemplate('fraud')}
                        className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold hover:bg-rose-200 cursor-pointer"
                      >
                        صوری
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={fieldReportText}
                  readOnly={isCaseReadOnly}
                  onChange={(e) => setFieldReportText(e.target.value)}
                  placeholder="مشاهدات حضوری از وضعیت بدنه، شاسی، رنگ‌شدگی، ارتفاع سپرها، بررسی کیلومترشمار، کارت ماشین و نحوه برخورد..."
                  className={`w-full p-4 rounded-2xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none leading-relaxed ${
                    isCaseReadOnly ? 'bg-slate-100 text-slate-800' : 'bg-white focus:border-blue-900 focus:ring-1 focus:ring-blue-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {!isCaseReadOnly ? (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>ثبت موقت (پیش‌نویس)</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setWorkspaceTab('assessment_parts')}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>مرحله بعدی: ارزیابی خسارت و مدل ۲بعدی خودرو</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* UNIFIED TAB 3: DAMAGE ASSESSMENT, 2D INTERACTIVE MODEL & PRICING (ارزیابی خسارت، مدل ۲بعدی و قیمت‌گذاری) */}
          {workspaceTab === 'assessment_parts' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Box */}
              <div className="p-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl flex items-center justify-between flex-wrap gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                      <span>ارزیابی هوشمند روی نقشه ۲بعدی و تعیین قیمت قطعات</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        یکپارچه با کارشناس خسارت
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      روی هر قطعه در نقشه ۲بعدی یا ۳بعدی کلیک کنید تا شدت آسیب (زرد/نارنجی/قرمز)، نوع عملیات و قیمت تعیین گردد.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 bg-white/10 rounded-xl border border-white/20 text-slate-200">
                    تعداد قطعات ثبت‌شده: <strong className="text-amber-300 font-mono">{fieldParts.length}</strong>
                  </span>
                </div>
              </div>

              {/* 2D Blueprint & 3D Interactive Model Viewer */}
              <Car3DViewer
                caseId={selectedCase.id}
                editable={!isCaseReadOnly}
                damageData={carDamageSpotsState}
                onChangeDamageData={handleDamageSpotsChange}
                onAddPartToEstimate={handleAutoAddPartFromBlueprint}
              />

              {/* Part Builder Form or Read-Only Notice */}
              {!isCaseReadOnly ? (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-700" />
                      <span>افزودن مستقیم قطعه آسیب‌دیده و درج قیمت / اجرت</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-bold">
                      همگام با نقشه ۲بعدی بالا
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
                    <div className="xl:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">نام قطعه خودرو</label>
                      <select
                        value={selectedPartName}
                        onChange={(e) => setSelectedPartName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                      >
                        {STANDARD_CAR_PARTS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {selectedPartName === 'سایر قطعات (سفارشی)' && (
                      <div className="xl:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">عنوان قطعه دلخواه</label>
                        <input
                          type="text"
                          value={customPartName}
                          onChange={(e) => setCustomPartName(e.target.value)}
                          placeholder="نام قطعه..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">شدت آسیب / رنگ</label>
                      <select
                        value={partSeverity}
                        onChange={(e) => setPartSeverity(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                      >
                        <option value="major">🔴 شدید / تعویض (قرمز)</option>
                        <option value="moderate">🟠 متوسط / صافکاری و رنگ (نارنجی)</option>
                        <option value="minor">🟡 جزئی / خط و خش (زرد)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">نوع عملیات</label>
                      <select
                        value={partOpType}
                        onChange={(e) => setPartOpType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                      >
                        <option value="تعویض کامل">تعویض کامل</option>
                        <option value="صافکاری و نقاشی">صافکاری و نقاشی</option>
                        <option value="تعمیر و تنظیم">تعمیر و تنظیم</option>
                        <option value="رنگ‌آمیزی">رنگ‌آمیزی</option>
                        <option value="صافکاری PDR بدون رنگ">صافکاری PDR بدون رنگ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">قیمت قطعه (ریال)</label>
                      <input
                        type="number"
                        value={partPriceInput}
                        onChange={(e) => setPartPriceInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">اجرت دستمزد (ریال)</label>
                      <input
                        type="number"
                        value={wagePriceInput}
                        onChange={(e) => setWagePriceInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ارزش داغی (ریال)</label>
                      <input
                        type="number"
                        value={scrapPriceInput}
                        onChange={(e) => setScrapPriceInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                        dir="ltr"
                      />
                    </div>

                    <div className="xl:col-span-5">
                      <label className="block font-bold text-slate-700 mb-1">توضیحات و شرح آسیب قطعه</label>
                      <input
                        type="text"
                        value={partNoteInput}
                        onChange={(e) => setPartNoteInput(e.target.value)}
                        placeholder="مثلاً: شکستگی دیاق و پوسته از سمت راست..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium bg-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleAddPart}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>افزودن به لیست</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl flex items-center gap-2.5 text-xs text-slate-700">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="font-bold">ثبت و تغییر قطعات به دلیل ارسال نهایی یا رد پرونده قفل است (فقط خواندنی).</span>
                </div>
              )}

              {/* Parts Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black">
                    <tr>
                      <th className="p-3">ردیف</th>
                      <th className="p-3">نام قطعه</th>
                      <th className="p-3">شدت آسیب</th>
                      <th className="p-3">نوع عملیات</th>
                      <th className="p-3">قیمت قطعه (ریال)</th>
                      <th className="p-3">اجرت (ریال)</th>
                      <th className="p-3">ارزش داغی (ریال)</th>
                      <th className="p-3">خالص آیتم (ریال)</th>
                      <th className="p-3">توضیحات</th>
                      {!isCaseReadOnly && <th className="p-3 text-center">عملیات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {fieldParts.length === 0 ? (
                      <tr>
                        <td colSpan={isCaseReadOnly ? 9 : 10} className="p-6 text-center text-slate-400 font-bold">
                          هنوز قطعه‌ای افزوده نشده است. از روی مدل ۲بعدی خودرو بالا یا فرم افزودن قطعه استفاده نمایید.
                        </td>
                      </tr>
                    ) : (
                      fieldParts.map((p, idx) => {
                        const netItem = p.partPrice + p.wagePrice - p.scrapPrice;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{p.partName}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                p.damageSeverity === 'major'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                  : p.damageSeverity === 'moderate'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                  : 'bg-yellow-100 text-yellow-900 border border-yellow-200'
                              }`}>
                                {p.damageSeverity === 'major' ? '🔴 شدید' : p.damageSeverity === 'moderate' ? '🟠 متوسط' : '🟡 جزئی'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold">
                                {p.operationType}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold">{formatCurrency(p.partPrice)}</td>
                            <td className="p-3 font-mono text-slate-700">{formatCurrency(p.wagePrice)}</td>
                            <td className="p-3 font-mono text-amber-700">-{formatCurrency(p.scrapPrice)}</td>
                            <td className="p-3 font-mono font-black text-emerald-800">{formatCurrency(netItem)}</td>
                            <td className="p-3 text-slate-600 text-[11px] max-w-xs truncate">{p.note || '-'}</td>
                            {!isCaseReadOnly && (
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleRemovePart(p.id, p.partName)}
                                  className="text-rose-600 hover:text-rose-800 font-bold p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pricing Totals Bar */}
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shadow-md">
                <div>
                  <span className="text-slate-400 block text-[11px]">مجموع بهای قطعات:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-amber-300">{formatCurrency(totalPartsCost)} ریال</span>
                  <span className="text-[10px] text-slate-400 block font-mono">({formatCurrency(Math.round(totalPartsCost / 10))} تومان)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">مجموع دستمزد و اجرت:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-slate-200">{formatCurrency(totalWageCost)} ریال</span>
                  <span className="text-[10px] text-slate-400 block font-mono">({formatCurrency(Math.round(totalWageCost / 10))} تومان)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">کسر ارزش داغی:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-rose-400">-{formatCurrency(totalScrapValue)} ریال</span>
                  <span className="text-[10px] text-slate-400 block font-mono">({formatCurrency(Math.round(totalScrapValue / 10))} تومان)</span>
                </div>
                <div className="bg-emerald-600/30 p-2.5 rounded-xl border border-emerald-500/50">
                  <span className="text-emerald-300 block text-[11px] font-bold">خالص نهایی قابل پرداخت:</span>
                  <span className="font-mono text-base sm:text-lg font-black text-white">{formatCurrency(netPayable)} ریال</span>
                  <span className="text-[10px] text-emerald-200 block font-mono font-bold">({formatCurrency(Math.round(netPayable / 10))} تومان)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {!isCaseReadOnly ? (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>ثبت موقت (پیش‌نویس)</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setWorkspaceTab('photos')}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>مرحله بعدی: عکس‌های بازدید میدانی و خسارت</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: FIELD PHOTOS & DAMAGE EVIDENCE (عکس‌های بازدید میدانی و خسارت) */}
          {workspaceTab === 'photos' && (
            <div className="space-y-6 animate-in fade-in">
              {!isCaseReadOnly ? (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-700" />
                      <span>بارگذاری عکس‌های ثبت‌شده در محل حادثه توسط کارشناس</span>
                    </h4>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-slate-500">ثبت سریع نمونه آزمایشی:</span>
                      <button
                        type="button"
                        onClick={() => handleAddPresetPhoto('عکس خسارت سپر و گلگیر جلو', 'damage', 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80')}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        + عکس خسارت
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetPhoto('عکس شماره شاسی و پلاک فیزیکی', 'vin', 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80')}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        + عکس شاسی / VIN
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetPhoto('عکس زاویه برخورد در صحنه', 'scene', 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80')}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        + عکس صحنه تصادف
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    <div className="sm:col-span-6">
                      <label className="block font-bold text-slate-700 mb-1">عنوان عکس</label>
                      <input
                        type="text"
                        value={newPhotoTitle}
                        onChange={(e) => setNewPhotoTitle(e.target.value)}
                        placeholder="عنوان عکس (مثلاً: عکس شماره شاسی، زاویه برخورد، شکستگی سپر...)"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-700 mb-1">دسته‌بندی</label>
                      <select
                        value={newPhotoCategory}
                        onChange={(e) => setNewPhotoCategory(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                      >
                        <option value="damage">عکس از قطعات آسیب‌دیده</option>
                        <option value="vin">عکس از شماره شاسی و پلاک</option>
                        <option value="scene">عکس از صحنه و زاویه برخورد</option>
                        <option value="other">عکس‌های تکمیلی و متفرقه</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex items-end">
                      <input
                        type="file"
                        id="field-photo-input"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="field-photo-input"
                        className="w-full px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black cursor-pointer flex items-center justify-center gap-2 shadow-xs transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        <span>انتخاب فایل عکس</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl flex items-center gap-2.5 text-xs text-slate-700">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="font-bold">بارگذاری یا حذف تصاویر به دلیل اتمام کارشناسی و ثبت نهایی (یا رد) پرونده قفل است.</span>
                </div>
              )}

              {/* Photos Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                    گالری عکس‌های بازدید میدانی ({fieldPhotos.length} تصویر):
                  </h4>
                  <span className="text-[11px] text-slate-500 font-bold">
                    کلیک روی تصویر جهت بزرگ‌نمایی
                  </span>
                </div>

                {fieldPhotos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 text-xs text-slate-400 font-bold">
                    هنوز عکسی بارگذاری نشده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fieldPhotos.map((fp) => (
                      <div
                        key={fp.id}
                        className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2 relative group"
                      >
                        <div
                          onClick={() => setPreviewPhotoUrl(fp.url)}
                          className="w-full h-44 bg-slate-200 rounded-xl overflow-hidden cursor-pointer relative"
                        >
                          <img src={fp.url} alt={fp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                            <Maximize2 className="w-4 h-4 ml-1" />
                            بزرگ‌نمایی تصویر
                          </div>
                        </div>
                        <div className="flex items-start justify-between gap-2 px-1">
                          <div>
                            <span className="text-xs font-bold text-slate-800 line-clamp-1 block">{fp.title}</span>
                            <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                              {fp.category === 'damage' ? 'قطعه آسیب‌دیده' : fp.category === 'vin' ? 'شماره شاسی / VIN' : fp.category === 'scene' ? 'صحنه تصادف' : 'متفرقه'}
                            </span>
                          </div>
                          {!isCaseReadOnly && (
                            <button
                              onClick={() => setFieldPhotos(fieldPhotos.filter((p) => p.id !== fp.id))}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                {!isCaseReadOnly ? (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>ثبت موقت (پیش‌نویس)</span>
                  </button>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setWorkspaceTab('finalize')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span>مرحله بعدی: تایید نهایی و ارسال به بیمه‌گر</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: FINALIZE & DIRECT SUBMISSION TO INSURER (تایید نهایی و ارسال به بیمه‌گر) */}
          {workspaceTab === 'finalize' && (
            <div className="space-y-6 animate-in fade-in">
              <div className={`p-6 border-2 rounded-3xl space-y-4 ${
                isCaseSubmitted
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400'
                  : isCaseRejected
                  ? 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-400'
                  : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0 ${
                    isCaseRejected ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {isCaseReadOnly ? <Lock className="w-7 h-7" /> : <FileCheck className="w-7 h-7" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base sm:text-lg">
                      {isCaseSubmitted
                        ? 'گزارش نهایی کارشناسی میدانی (ارسال شده به بیمه‌گر - فقط خواندنی)'
                        : isCaseRejected
                        ? 'گزارش پرونده رد شده توسط کارشناس (فقط خواندنی)'
                        : 'خلاصه نهایی گزارش ارزیابی میدانی جهت ارسال مستقیم به شرکت بیمه‌گر'}
                    </h3>
                    <p className="text-xs text-slate-700 font-medium">
                      {isCaseReadOnly
                        ? 'این پرونده نهایی یا رد شده است و اطلاعات آن صرفاً جهت بازبینی و سوابق قابل مشاهده است.'
                        : `پرونده مستقیماً وارد سیستم تسویه و صدور حواله مالی شرکت ${getInsurerPersianName(selectedCase.culpritInsurer)} خواهد شد.`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 font-bold block">نتیجه اصالت‌سنجی:</span>
                    <span className="font-black text-slate-900 block text-xs">
                      {authVerdict === 'CONFIRMED' ? '✅ تایید کامل اصالت' : authVerdict === 'PARTIAL_MISMATCH' ? '⚠️ عدم انطباق جزئی' : '❌ رد خسارت صوری'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 font-bold block">تعداد قطعات ارزیابی‌شده:</span>
                    <span className="font-black text-slate-900 block font-mono">{fieldParts.length} قطعه</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 font-bold block">تعداد عکس‌های پیوست:</span>
                    <span className="font-black text-slate-900 block font-mono">{fieldPhotos.length} تصویر</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 font-bold block">خالص قابل پرداخت:</span>
                    <span className="font-black text-emerald-700 block font-mono text-sm">{formatCurrency(netPayable)} ریال</span>
                    <span className="text-[10px] text-emerald-600 block font-mono">({formatCurrency(Math.round(netPayable / 10))} تومان)</span>
                  </div>
                </div>

                {/* Summary of Report Text */}
                <div className="p-4 bg-white rounded-2xl border border-emerald-200 space-y-1 text-xs">
                  <span className="font-black text-emerald-950 block">متن گزارش تشریحی ثبت‌شده:</span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {fieldReportText || 'گزارش ارزیابی میدانی در محل حادثه تکمیل و اصالت تایید گردید.'}
                  </p>
                </div>

                {!isCaseReadOnly ? (
                  <div className="p-3.5 bg-blue-900 text-white rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-amber-300 block">نکته مربوط به تسویه مستقیم:</span>
                    <p className="text-slate-200 text-[11px] leading-relaxed">
                      به دلیل انجام کارشناسی فیزیکی در محل توسط کارشناس رسمی میدانی، نیازی به تایید مجدد ارزیابی توسط مشتری نیست. زیان‌دیده تنها شماره شبای بانکی خود را وارد می‌کند و وجه خسارت توسط شرکت بیمه واریز خواهد شد.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-800 text-white rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-amber-300 block">وضعیت پرونده: غیرقابل ویرایش (قفل شده)</span>
                    <p className="text-slate-200 text-[11px] leading-relaxed">
                      کلیه مدارک، مبالغ و گزارش ارزیابی این پرونده نهایی شده و غیرقابل تغییر است.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-200/60">
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    بازگشت به لیست پرونده‌ها
                  </button>

                  {!isCaseReadOnly ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>ثبت موقت اطلاعات (پیش‌نویس بدون ارسال)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSubmitDirectToInsurer}
                        className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                      >
                        <Send className="w-5 h-5" />
                        <span>تایید نهایی گزارش میدانی و ارسال به بیمه‌گر جهت تسویه</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-black text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>این پرونده خاتمه یافته و امکان ارسال مجدد ندارد.</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SMS & NOTIFICATIONS MODAL */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 border-2 border-emerald-400">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    پیامک‌ها و اعلان‌های اعزام لحظه‌ای کارشناس
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    ارسال شده به شماره همراه: {session.phone || '۰۹۱۲۳۴۵۶۷۸۹'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 text-xs">
              {myNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold">
                  پیامک جدیدی دریافت نشده است.
                </div>
              ) : (
                myNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5 text-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-blue-950 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{notif.title}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{notif.date} {notif.time}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-700 font-medium">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSmsModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-900 text-white font-extrabold text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MISSION MODAL */}
      {showRejectModal && caseToReject && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 border-2 border-rose-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-6 h-6" />
                <h3 className="font-black text-sm">رد ماموریت ارجاع‌شده: پرونده {caseToReject.id}</h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  دلیل رد ماموریت <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                >
                  <option value="خارج از محدوده جغرافیایی و ترافیک سنگین">خارج از محدوده جغرافیایی و ترافیک سنگین</option>
                  <option value="تداخل با ماموریت بازدید حضوری دیگر">تداخل با ماموریت بازدید حضوری دیگر</option>
                  <option value="عدم پاسخگویی یا جابجایی خودرو از محل حادثه">عدم پاسخگویی یا جابجایی خودرو از محل حادثه</option>
                  <option value="نقص فنی یا عدم امکان حضور در زمان مقرر">نقص فنی یا عدم امکان حضور در زمان مقرر</option>
                  <option value="سایر دلایل موجه">سایر دلایل موجه</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  توضیحات تکمیلی جهت اطلاع بیمه‌گر
                </label>
                <textarea
                  rows={3}
                  value={rejectDescription}
                  onChange={(e) => setRejectDescription(e.target.value)}
                  placeholder="علت دقیق عدم امکان انجام ماموریت..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-md cursor-pointer"
                >
                  تایید و عودت پرونده به بیمه‌گر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO PREVIEW MODAL */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 p-2 rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center border border-slate-700 hover:bg-slate-700 cursor-pointer"
            >
              ✕
            </button>
            <img src={previewPhotoUrl} alt="Document Preview" className="w-full h-auto max-h-[80vh] object-contain mx-auto rounded-2xl" />
          </div>
        </div>
      )}

      {/* INSURER NOTE MODAL: دستورالعمل و توضیحات شرکت بیمه‌گر به کارشناس میدانی */}
      {insurerNoteModalCase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 border border-slate-200 animate-in zoom-in-95 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">دستورالعمل و توضیحات شرکت بیمه‌گر</h3>
                  <p className="text-xs text-slate-500 font-mono">ماموریت بازدید میدانی پرونده {insurerNoteModalCase.id}</p>
                </div>
              </div>
              <button
                onClick={() => setInsurerNoteModalCase(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Case Info Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">شرکت بیمه‌گر:</span>
                <strong className="text-purple-900 font-black">{getInsurerPersianName(insurerNoteModalCase.culpritInsurer) || 'نامشخص'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">خودرو زیان‌دیده:</span>
                <strong className="text-slate-800">{insurerNoteModalCase.carType || insurerNoteModalCase.carModel}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">شماره پلاک:</span>
                <strong className="text-slate-800 font-mono text-[11px]">{insurerNoteModalCase.victimPlate || insurerNoteModalCase.plateNumber}</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[10px]">محل وقوع حادثه / بازدید:</span>
                <strong className="text-slate-800 text-[11px] leading-tight block">{insurerNoteModalCase.address || insurerNoteModalCase.accidentLocation || 'تهران'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">زیان‌دیده:</span>
                <strong className="text-slate-800">{insurerNoteModalCase.victimName}</strong>
              </div>
            </div>

            {/* Authenticity dispute warning if present */}
            {insurerNoteModalCase.authenticityDispute && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-1 text-amber-950">
                <span className="font-extrabold flex items-center gap-1 text-amber-900">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  علت ارجاع میدانی (اعلام تردید در اصالت تصادف):
                </span>
                <p className="font-medium">
                  {insurerNoteModalCase.authenticityDispute.reason} — {insurerNoteModalCase.authenticityDispute.description}
                </p>
              </div>
            )}

            {/* The Note Body */}
            <div className="space-y-2 text-right">
              <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>متن یادداشت و دستور کار ابلاغی از سوی شرکت بیمه‌گر به کارشناس میدانی:</span>
              </label>

              <div className="p-4 rounded-2xl bg-purple-50/90 border-2 border-purple-200 text-purple-950 space-y-3">
                <p className="text-sm font-extrabold leading-relaxed">
                  «{insurerNoteModalCase.insurerFieldExpertNote || insurerNoteModalCase.insurerAssignmentNote || insurerNoteModalCase.insurerInstruction || 'توضیحات تکمیلی خاصی توسط شرکت بیمه‌گر درج نشده است. لطفاً تطبیق مشخصات خودرو، آثار خسارت و مدارک هویتی در محل حادثه با دقت بررسی و ثبت گردد.'}»
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-200/80 text-[11px] text-purple-800 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>ثبت توسط: <strong>{insurerNoteModalCase.insurerNoteAuthor || 'کارشناس پذیرش پورتال بیمه‌گر'}</strong></span>
                  </span>
                  {insurerNoteModalCase.insurerNoteDate && (
                    <span className="font-mono text-[10px]">
                      تاریخ ارجاع: {insurerNoteModalCase.insurerNoteDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInsurerNoteModalCase(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                بستن
              </button>
              {activeTab === 'new_assignments' && (
                <button
                  type="button"
                  onClick={() => {
                    const current = insurerNoteModalCase;
                    setInsurerNoteModalCase(null);
                    handleAcceptMission(current);
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>قبول ماموریت و شروع بازدید</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
