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
  X
} from 'lucide-react';
import { ClaimCase, UserSession, AssessmentData, AssessorNotification, AdditionalDocItem } from '../../types';
import { formatCurrency, getInsurerPersianName, loadAssessorNotifications, saveAssessorNotifications, markAssessorNotificationAsRead } from '../../lib/storage';
import { Car3DViewer } from '../Car3DViewer';

interface FieldExpertPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updatedCase: ClaimCase) => void;
  onOpenCaseForm?: (caseId: string) => void;
}

type FieldTab = 'new_assignments' | 'in_progress' | 'completed' | 'rejected';

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
  'پوسته سقف و ستون‌ها',
  'درب جلو راست (شاگرد)',
  'درب جلو چپ (راننده)',
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
  'رادیاتور کولر و کندانسور',
  'اکسل، طبق و جلوبندی',
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

  // Workspace sub-tabs when editing a case
  const [workspaceTab, setWorkspaceTab] = useState<'docs' | 'authenticity' | 'parts' | 'photos' | 'finalize'>('docs');

  // Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [caseToReject, setCaseToReject] = useState<ClaimCase | null>(null);
  const [rejectReason, setRejectReason] = useState('خارج از محدوده جغرافیایی و ترافیک سنگین');
  const [rejectDescription, setRejectDescription] = useState('');

  // Field Report form states for selected case
  const [authVerdict, setAuthVerdict] = useState<'CONFIRMED' | 'FRAUD_REJECTED' | 'PARTIAL_MISMATCH'>('CONFIRMED');
  const [fieldReportText, setFieldReportText] = useState('');
  const [fieldParts, setFieldParts] = useState<Array<{
    id: string;
    partName: string;
    operationType: 'تعویض کامل' | 'صافکاری و نقاشی' | 'تعمیر و تنظیم';
    partPrice: number;
    wagePrice: number;
    scrapPrice: number;
  }>>([]);

  // New part input
  const [selectedPartName, setSelectedPartName] = useState('سپر جلو');
  const [customPartName, setCustomPartName] = useState('');
  const [partOpType, setPartOpType] = useState<'تعویض کامل' | 'صافکاری و نقاشی' | 'تعمیر و تنظیم'>('تعویض کامل');
  const [partPriceInput, setPartPriceInput] = useState('15000000');
  const [wagePriceInput, setWagePriceInput] = useState('5000000');
  const [scrapPriceInput, setScrapPriceInput] = useState('1500000');

  // Field photos
  const [fieldPhotos, setFieldPhotos] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [newPhotoTitle, setNewPhotoTitle] = useState('عکس از شماره شاسی و VIN');

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
      // Check if specifically assigned to this field expert
      const isAssignedToMe = c.assignedFieldExpert?.id === session.id || c.assignedExpert?.id === session.id;
      // Or in general pool for field expert testing
      const isCompanyField = c.culpritInsurer === session.company || !c.culpritInsurer;
      return isAssignedToMe || (session.id === 'fed1' && (c.needsCulpritFieldVisit || c.status === 'تردید در اصالت تصادف' || c.status.includes('میدانی')));
    });
  }, [cases, session.id, session.company]);

  // Categorize cases into 4 independent queues
  const newAssignments = useMemo(() => {
    return myCases.filter((c) => {
      return (
        c.status === 'در انتظار بازدید کارشناس میدانی' ||
        c.status === 'تردید در اصالت تصادف' ||
        (c.status === 'در انتظار ارجاع به ارزیاب' && c.needsCulpritFieldVisit) ||
        (!c.fieldVisitStarted && !c.assessment?.fieldInspectionConfirmed && !c.rejectedByAssessorIds?.includes(session.id))
      );
    });
  }, [myCases, session.id]);

  const inProgressCases = useMemo(() => {
    return myCases.filter((c) => {
      return (
        c.status === 'در حال بازدید کارشناس میدانی' ||
        c.status === 'در حال ارزیابی' ||
        (c.fieldVisitStarted && !c.assessment && !c.fieldExpertFinal)
      );
    });
  }, [myCases]);

  const completedCases = useMemo(() => {
    return myCases.filter((c) => {
      return (
        c.status === 'ارزیابی میدانی تکمیل شد - در انتظار صدور حواله پرداخت بیمه‌گر' ||
        c.status === 'در انتظار پرداخت' ||
        c.status === 'پرداخت شده' ||
        c.status === 'مختومه - پرداخت شد' ||
        c.fieldExpertFinal === true ||
        (c.assessment && (c.assessment.fieldInspectionConfirmed || c.assessment.isFinalDecision))
      );
    });
  }, [myCases]);

  const rejectedCases = useMemo(() => {
    return myCases.filter((c) => {
      return c.rejectedByAssessorIds?.includes(session.id) || c.status === 'رد شده توسط کارشناس میدانی';
    });
  }, [myCases, session.id]);

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
        (c.plateNumber && c.plateNumber.includes(q)) ||
        (c.victimName && c.victimName.includes(q)) ||
        (c.accidentLocation && c.accidentLocation.includes(q))
      );
    });
  }, [activeTab, newAssignments, inProgressCases, completedCases, rejectedCases, searchQuery]);

  // Open Workspace for a Case
  const handleOpenWorkspace = (claimCase: ClaimCase) => {
    setSelectedCase(claimCase);
    setWorkspaceTab('docs');
    setFieldReportText(claimCase.assessment?.notes || claimCase.fieldExpertReportNote || '');
    
    // Load existing items if any
    if (claimCase.assessment?.items && claimCase.assessment.items.length > 0) {
      setFieldParts(
        claimCase.assessment.items.map((it, idx) => ({
          id: `item-${idx}-${Date.now()}`,
          partName: it.partName,
          operationType: (it.operationType as any) || (it.action === 'REPLACE' ? 'تعویض کامل' : 'صافکاری و نقاشی'),
          partPrice: it.price || 0,
          wagePrice: it.wage || 0,
          scrapPrice: it.scrapValue || 0
        }))
      );
    } else {
      // Default sample parts for quick field start
      setFieldParts([
        {
          id: 'part-1',
          partName: 'سپر جلو',
          operationType: 'تعویض کامل',
          partPrice: 18500000,
          wagePrice: 4500000,
          scrapPrice: 2000000
        },
        {
          id: 'part-2',
          partName: 'چراغ جلو راست',
          operationType: 'تعویض کامل',
          partPrice: 9200000,
          wagePrice: 1800000,
          scrapPrice: 1000000
        }
      ]);
    }

    if (claimCase.fieldExpertVerdict) {
      setAuthVerdict(claimCase.fieldExpertVerdict);
    } else if (claimCase.fraudFlag?.flagged) {
      setAuthVerdict('FRAUD_REJECTED');
    } else {
      setAuthVerdict('CONFIRMED');
    }

    // Load any existing field photos
    if (claimCase.additionalDocs) {
      const photos = claimCase.additionalDocs
        .filter((d) => d.uploaderRole?.includes('میدانی') || d.uploaderRole?.includes('expert'))
        .map((d) => ({
          id: d.id,
          title: d.title,
          url: d.dataUrl || ''
        }));
      setFieldPhotos(photos);
    }
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
          note: `رد مأموریت ارجاع‌شده توسط کارشناس میدانی «${session.name}». علت رد: «${rejectReason}» - توضیحات: ${rejectDescription || 'بدون توضیحات'}. پرونده جهت ارجاع به کارشناس میدانی دیگر به بیمه‌گر بازگردانده شد.`
        }
      ]
    };

    onUpdateCase(updated);
    setShowRejectModal(false);
    setCaseToReject(null);
    setActionSuccessMsg('ماموریت رد گردید و پرونده جهت تخصیص مجدد به کارشناس دیگر به شرکت بیمه‌گر بازگردانده شد.');
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  // Add Part in workspace
  const handleAddPart = () => {
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
      scrapPrice: scrap
    };

    setFieldParts([...fieldParts, newItem]);
    if (selectedPartName === 'سایر قطعات (سفارشی)') {
      setCustomPartName('');
    }
  };

  // Remove Part
  const handleRemovePart = (id: string) => {
    setFieldParts(fieldParts.filter((p) => p.id !== id));
  };

  // Part calculations
  const totalPartsCost = useMemo(() => fieldParts.reduce((acc, p) => acc + p.partPrice, 0), [fieldParts]);
  const totalWageCost = useMemo(() => fieldParts.reduce((acc, p) => acc + p.wagePrice, 0), [fieldParts]);
  const totalScrapValue = useMemo(() => fieldParts.reduce((acc, p) => acc + p.scrapPrice, 0), [fieldParts]);
  const grossDamage = totalPartsCost + totalWageCost;
  const netPayable = Math.max(0, grossDamage - totalScrapValue);

  // Add Photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const newP = {
        id: `field-img-${Date.now()}`,
        title: newPhotoTitle || file.name,
        url
      };
      setFieldPhotos([...fieldPhotos, newP]);
    };
    reader.readAsDataURL(file);
  };

  // Final Submit to Insurer for Payment (No user confirmation needed)
  const handleSubmitDirectToInsurer = () => {
    if (!selectedCase) return;

    const nowTimeStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    // Build assessment data
    const assessmentItems = fieldParts.map((p) => ({
      partName: p.partName,
      action: (p.operationType === 'تعویض کامل' ? 'REPLACE' : 'REPAIR') as 'REPLACE' | 'REPAIR',
      operationType: p.operationType,
      price: p.partPrice,
      wage: p.wagePrice,
      scrapValue: p.scrapPrice,
      totalItemCost: p.partPrice + p.wagePrice - p.scrapPrice
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
      totalPartsCost,
      totalWageCost,
      totalScrapValue,
      totalAmount: netPayable,
      notes: fieldReportText.trim() || 'گزارش ارزیابی میدانی در محل حادثه تکمیل و اصالت تایید گردید.',
      isFinalDecision: true,
      fieldInspectionConfirmed: authVerdict === 'CONFIRMED',
      authenticityVerdict: authVerdict
    };

    // Prepare uploaded photos as additional docs
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
      note: 'ثبت‌شده در حین بازدید فیزیکی از محل حادثه'
    }));

    const finalStatus = authVerdict === 'FRAUD_REJECTED'
      ? 'رد خسارت - صوری بودن تصادف توسط کارشناس میدانی'
      : 'ارزیابی میدانی تکمیل شد - در انتظار صدور حواله پرداخت بیمه‌گر';

    const updated: ClaimCase = {
      ...selectedCase,
      status: finalStatus,
      assessment: assessmentResult,
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
          note: `تنظیم و ثبت نهایی گزارش میدانی توسط کارشناس «${session.name}» با مبلغ خالص ${formatCurrency(netPayable)} ریال و ارسال مستقیم به واحد مالی و پرداخت بیمه‌گر. به دلیل قطعی بودن ارزیابی میدانی، نیازی به تایید مجدد مشتری نیست و پرونده آماده تسویه است.`
        }
      ]
    };

    onUpdateCase(updated);
    setSelectedCase(null);
    setActionSuccessMsg(`گزارش میدانی پرونده ${selectedCase.id} با موفقیت ثبت و جهت پرداخت مستقیم به بیمه‌گر ارسال گردید.`);
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
              ماموریت‌های اعزام به محل حادثه، بازرسی فیزیکی خودروها، احراز اصالت صحنه تصادف و برآورد مستقیم خسارت جهت تسویه فوری توسط شرکت بیمه.
            </p>
          </div>

          {/* SMS & Dispatch Alerts Button */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => {
                setShowSmsModal(true);
                // Mark visible notifications as read
                myNotifications.forEach((n) => markAssessorNotificationAsRead(n.id));
                reloadNotifications();
              }}
              className="relative px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black transition-all flex items-center gap-2.5 shadow-lg active:scale-95"
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
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
                در صورت ارجاع پرونده جدید از طرف شرکت بیمه یا اعلام تردید در اصالت تصادف توسط مشتری، بلافاصله در این بخش ظاهر خواهد شد.
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
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black font-mono text-blue-950 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {c.id}
                        </span>

                        <div className="flex items-center gap-1">
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
                          <span>{c.carModel || 'خودرو زیان‌دیده'}</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          پلاک: <span className="font-bold text-slate-800">{c.plateNumber || 'نامشخص'}</span>
                        </p>
                      </div>

                      {/* Location & Parties */}
                      <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight font-medium">
                            {c.accidentLocation || 'تهران، محل اعلامی طرفین حادثه'}
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
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {activeTab === 'new_assignments' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAcceptMission(c)}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span>قبول ماموریت</span>
                          </button>

                          <button
                            onClick={() => handleOpenReject(c)}
                            className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                          >
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>رد ماموریت</span>
                          </button>
                        </div>
                      )}

                      {(activeTab === 'in_progress' || activeTab === 'completed' || activeTab === 'rejected') && (
                        <button
                          onClick={() => handleOpenWorkspace(c)}
                          className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                        >
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>{activeTab === 'completed' ? 'مشاهده گزارش ارسالی به بیمه' : 'ورود به فرم گزارش میدانی'}</span>
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
        /* WORKSPACE: DEDICATED FIELD INSPECTION REPORTING ENVIRONMENT */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
          {/* Top Bar of Workspace */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به لیست ماموریت‌ها</span>
                </button>
                <span className="text-xs font-black text-blue-950 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                  پرونده {selectedCase.id}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 pt-1">
                محیط کارشناسی میدانی و تنظیم گزارش در محل: {selectedCase.carModel} ({selectedCase.plateNumber})
              </h2>
            </div>

            {/* Direct Payout Notice Banner */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <span className="font-extrabold block text-emerald-900">تسویه مستقیم بدون نیاز به تایید کاربر:</span>
                <span className="text-[11px] text-emerald-800">برآورد میدانی شما مستقیماً به پنل بیمه‌گر جهت واریز به شبای زیان‌دیده ارسال می‌شود.</span>
              </div>
            </div>
          </div>

          {/* Workspace Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setWorkspaceTab('docs')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                workspaceTab === 'docs'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>۱. مدارک، کروکی و عکس‌های حادثه</span>
            </button>

            <button
              onClick={() => setWorkspaceTab('authenticity')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                workspaceTab === 'authenticity'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>۲. احراز اصالت و بررسی فیزیکی</span>
            </button>

            <button
              onClick={() => setWorkspaceTab('parts')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                workspaceTab === 'parts'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>۳. قطعات، خسارت و قیمت‌گذاری</span>
              {fieldParts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                  {fieldParts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setWorkspaceTab('photos')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                workspaceTab === 'photos'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>۴. عکس‌های بازدید میدانی</span>
              {fieldPhotos.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-black">
                  {fieldPhotos.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setWorkspaceTab('finalize')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                workspaceTab === 'finalize'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>۵. تایید نهایی و ارسال به بیمه (تسویه)</span>
            </button>
          </div>

          {/* TAB 1: FULL DOCUMENTS & DOSSIER */}
          {workspaceTab === 'docs' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Accident & Parties Info */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-900" />
                    <span>مشخصات طرفین و بیمه‌نامه‌ها</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">زیان‌دیده:</span>
                      <span className="font-bold">{selectedCase.victimName} ({selectedCase.victimPhone})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">مقصر حادثه:</span>
                      <span className="font-bold">{selectedCase.culpritName} ({selectedCase.culpritPhone})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">شرکت بیمه‌گر مقصر:</span>
                      <span className="font-black text-blue-950">{getInsurerPersianName(selectedCase.culpritInsurer)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">محل دقیق حادثه:</span>
                      <span className="font-bold text-slate-900">{selectedCase.accidentLocation || 'نامشخص'}</span>
                    </div>
                  </div>
                </div>

                {/* Dispute / Kroki Info */}
                <div className="p-5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="font-black text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>وضعیت کروکی و دلایل اعزام میدانی</span>
                  </h4>
                  <div className="space-y-2 text-xs text-slate-800">
                    <div className="flex justify-between py-1 border-b border-amber-200/70">
                      <span className="text-slate-600">کروکی رسمی:</span>
                      <span className="font-bold">{selectedCase.hasKroki ? `دارد (کد: ${selectedCase.sceneReportCode || 'الکترونیک'})` : 'فاقد کروکی (نیاز به احراز اصالت)'}</span>
                    </div>
                    {selectedCase.authenticityDispute && (
                      <div className="py-1">
                        <span className="text-amber-900 font-extrabold block mb-1">متن اعتراض و تردید اصالت:</span>
                        <p className="bg-white p-2.5 rounded-xl border border-amber-200 font-medium text-slate-800 leading-relaxed text-[11px]">
                          <strong>«{selectedCase.authenticityDispute.reason}»</strong>: {selectedCase.authenticityDispute.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos & Evidence from Customer */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                  عکس‌ها و ویدیوهای بارگذاری‌شده توسط مشتریان و پلیس:
                </h4>
                {(!selectedCase.additionalDocs || selectedCase.additionalDocs.length === 0) ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    مدرک اضافه‌ای بارگذاری نشده است. از تصاویر فرم پذیرش استفاده کنید.
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

              {/* 3D Car Diagram */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm">نمای سه‌بعدی نقاط آسیب‌دیده خودرو:</h4>
                <div className="bg-slate-900 rounded-3xl p-4 overflow-hidden">
                  <Car3DViewer highlightSpots={selectedCase.impactCoordinates || []} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTHENTICITY & PHYSICAL VERIFICATION */}
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
                    onClick={() => setAuthVerdict('CONFIRMED')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                      authVerdict === 'CONFIRMED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
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
                    onClick={() => setAuthVerdict('PARTIAL_MISMATCH')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                      authVerdict === 'PARTIAL_MISMATCH'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-sm'
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
                    onClick={() => setAuthVerdict('FRAUD_REJECTED')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                      authVerdict === 'FRAUD_REJECTED'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-sm'
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

              {/* Text Report */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-900">
                  گزارش تشریحی و فنی کارشناس میدانی: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={fieldReportText}
                  onChange={(e) => setFieldReportText(e.target.value)}
                  placeholder="مشاهدات حضوری از وضعیت بدنه، شاسی، رنگ‌شدگی، ارتفاع سپرها، بررسی کیلومترشمار، کارت ماشین و نحوه برخورد..."
                  className="w-full p-4 rounded-2xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>
          )}

          {/* TAB 3: PARTS & PRICING */}
          {workspaceTab === 'parts' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Add Part Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>افزودن قطعه آسیب‌دیده و قیمت‌گذاری در محل</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">نام قطعه</label>
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
                    <div>
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
                    <label className="block font-bold text-slate-700 mb-1">نوع عملیات</label>
                    <select
                      value={partOpType}
                      onChange={(e) => setPartOpType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800"
                    >
                      <option value="تعویض کامل">تعویض کامل</option>
                      <option value="صافکاری و نقاشی">صافکاری و نقاشی</option>
                      <option value="تعمیر و تنظیم">تعمیر و تنظیم</option>
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
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleAddPart}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>افزودن به لیست خسارت</span>
                  </button>
                </div>
              </div>

              {/* Parts Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black">
                    <tr>
                      <th className="p-3">ردیف</th>
                      <th className="p-3">نام قطعه</th>
                      <th className="p-3">نوع عملیات</th>
                      <th className="p-3">قیمت قطعه (ریال)</th>
                      <th className="p-3">اجرت (ریال)</th>
                      <th className="p-3">ارزش داغی (ریال)</th>
                      <th className="p-3">خالص آیتم (ریال)</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {fieldParts.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 font-bold">
                          هنوز قطعه‌ای افزوده نشده است.
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
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-bold">
                                {p.operationType}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold">{formatCurrency(p.partPrice)}</td>
                            <td className="p-3 font-mono text-slate-700">{formatCurrency(p.wagePrice)}</td>
                            <td className="p-3 font-mono text-amber-700">-{formatCurrency(p.scrapPrice)}</td>
                            <td className="p-3 font-mono font-black text-emerald-800">{formatCurrency(netItem)}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemovePart(p.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold p-1 rounded-lg hover:bg-rose-50"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pricing Totals Bar */}
              <div className="bg-gradient-to-r from-blue-950 to-slate-900 text-white rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">مجموع بهای قطعات:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-amber-300">{formatCurrency(totalPartsCost)} ریال</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">مجموع دستمزد و اجرت:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-slate-200">{formatCurrency(totalWageCost)} ریال</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">کسر ارزش داغی:</span>
                  <span className="font-mono text-sm sm:text-base font-black text-rose-400">-{formatCurrency(totalScrapValue)} ریال</span>
                </div>
                <div className="bg-emerald-600/30 p-2.5 rounded-xl border border-emerald-500/50">
                  <span className="text-emerald-300 block text-[11px] font-bold">خالص نهایی قابل پرداخت:</span>
                  <span className="font-mono text-base sm:text-lg font-black text-white">{formatCurrency(netPayable)} ریال</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FIELD PHOTOS */}
          {workspaceTab === 'photos' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>بارگذاری عکس‌های ثبت‌شده در محل حادثه توسط کارشناس</span>
                </h4>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                  <input
                    type="text"
                    value={newPhotoTitle}
                    onChange={(e) => setNewPhotoTitle(e.target.value)}
                    placeholder="عنوان عکس (مثلاً: شماره شاسی، زاویه برخورد...)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                  />

                  <input
                    type="file"
                    id="field-photo-input"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="field-photo-input"
                    className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>انتخاب و بارگذاری تصویر</span>
                  </label>
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {fieldPhotos.map((fp) => (
                  <div
                    key={fp.id}
                    className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200 space-y-2 relative group"
                  >
                    <div
                      onClick={() => setPreviewPhotoUrl(fp.url)}
                      className="w-full h-36 bg-slate-200 rounded-xl overflow-hidden cursor-pointer"
                    >
                      <img src={fp.url} alt={fp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{fp.title}</span>
                      <button
                        onClick={() => setFieldPhotos(fieldPhotos.filter((p) => p.id !== fp.id))}
                        className="text-rose-600 hover:text-rose-800"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FINALIZE & SUBMIT DIRECT TO INSURER */}
          {workspaceTab === 'finalize' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                    <FileCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-emerald-950 text-base sm:text-lg">
                      خلاصه نهایی گزارش ارزیابی میدانی جهت ارسال به بیمه‌گر
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      پرونده مستقیماً وارد صف پرداخت مالی شرکت {getInsurerPersianName(selectedCase.culpritInsurer)} خواهد شد.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-3 bg-white rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 font-bold">نتیجه اصالت:</span>
                    <span className="font-black text-slate-900 block">
                      {authVerdict === 'CONFIRMED' ? '✅ اصالت تایید گردید' : authVerdict === 'PARTIAL_MISMATCH' ? '⚠️ عدم انطباق بخشی از خسارت' : '❌ تصادف صوری'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 font-bold">تعداد قطعات برآورد شده:</span>
                    <span className="font-black text-slate-900 block font-mono">{fieldParts.length} قطعه</span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-emerald-200 space-y-1">
                    <span className="text-slate-500 font-bold">خالص قابل پرداخت به زیان‌دیده:</span>
                    <span className="font-black text-emerald-700 block font-mono text-sm">{formatCurrency(netPayable)} ریال</span>
                  </div>
                </div>

                <div className="p-3 bg-blue-900 text-white rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-amber-300 block">نکته مربوط به تسویه:</span>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    به دلیل انجام کارشناسی فیزیکی در محل توسط کارشناس میدانی رسمی، نیازی به تایید مجدد ارزیابی توسط مشتری نیست. زیان‌دیده تنها مشخصات بانکی (شبا) خود را وارد می‌کند و وجه خسارت توسط شرکت بیمه واریز خواهد شد.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    onClick={() => setSelectedCase(null)}
                    className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs"
                  >
                    انصراف و بازگشت
                  </button>

                  <button
                    onClick={handleSubmitDirectToInsurer}
                    className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    <span>تایید نهایی گزارش میدانی و ارسال به بیمه‌گر جهت تسویه</span>
                  </button>
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
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
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
                className="px-5 py-2 rounded-xl bg-blue-900 text-white font-extrabold text-xs"
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
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs"
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
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-md"
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
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center border border-slate-700 hover:bg-slate-700"
            >
              ✕
            </button>
            <img src={previewPhotoUrl} alt="Document Preview" className="w-full h-auto max-h-[80vh] object-contain mx-auto rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};
