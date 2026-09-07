import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  Layers,
  HelpCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Check,
  X,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  RotateCcw,
  Send,
  MessageSquare,
  Car,
  User,
  CheckSquare,
  AlertOctagon,
} from 'lucide-react';
import { AIResult, EvidenceIntelligenceResult, AIHumanReviewStatus } from '../../lib/ai/types';
import { AIService } from '../../lib/ai/aiService';
import { ClaimCase, AdditionalDocItem } from '../../types';

interface EvidenceIntelligenceCardProps {
  claimId: string;
  claim?: ClaimCase;
  onUpdateCase?: (updatedCase: ClaimCase) => void;
  reviewerName?: string;
  aiResult?: AIResult<EvidenceIntelligenceResult> | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  userRole?: string;
  onReviewSubmitted?: (status: AIHumanReviewStatus, note?: string, modifiedValues?: any) => void;
  showHitlControls?: boolean;
  compact?: boolean;
}

export const EvidenceIntelligenceCard: React.FC<EvidenceIntelligenceCardProps> = ({
  claimId,
  claim,
  onUpdateCase,
  reviewerName = 'کارشناس خسارت',
  aiResult,
  isLoading = false,
  onRefresh,
  userRole = 'ASSESSOR',
  onReviewSubmitted,
  showHitlControls = true,
  compact = false,
}) => {
  const [showDetails, setShowDetails] = useState(!compact);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'amber' | 'rose'; text: string } | null>(null);

  // Stored review info from claim or aiResult
  const initialReview = claim?.aiIntelligence?.ocrReview || aiResult?.humanReview || null;
  const [localReviewStatus, setLocalReviewStatus] = useState<AIHumanReviewStatus | null>(
    initialReview?.status || null
  );
  const [reviewMetadata, setReviewMetadata] = useState<any>(initialReview || null);

  // Active extracted data (original from AI result or overridden by user modification)
  const [activeExtract, setActiveExtract] = useState<any>(
    initialReview?.status === 'MODIFIED' && initialReview?.modifiedExtract
      ? initialReview.modifiedExtract
      : aiResult?.result?.croquiOcrExtract || null
  );

  useEffect(() => {
    if (initialReview?.status) {
      setLocalReviewStatus(initialReview.status);
      setReviewMetadata(initialReview);
      if (initialReview.status === 'MODIFIED' && initialReview.modifiedExtract) {
        setActiveExtract(initialReview.modifiedExtract);
      }
    } else if (aiResult?.result?.croquiOcrExtract) {
      setActiveExtract(aiResult.result.croquiOcrExtract);
    }
  }, [claim?.id, claim?.aiIntelligence?.ocrReview, aiResult]);

  // Modals state
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [acceptNote, setAcceptNote] = useState('');

  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modPoliceCode, setModPoliceCode] = useState('');
  const [modIncidentDate, setModIncidentDate] = useState('');
  const [modFaultDriver, setModFaultDriver] = useState('');
  const [modFaultPlate, setModFaultPlate] = useState('');
  const [modVictimDriver, setModVictimDriver] = useState('');
  const [modVictimPlate, setModVictimPlate] = useState('');
  const [modDescription, setModDescription] = useState('');
  const [modNote, setModNote] = useState('');
  const [syncToClaim, setSyncToClaim] = useState(true);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('دست‌خط یا تصویر برگه کروکی کاملاً مخدوش و ناخوانا است');
  const [customRejectNote, setCustomRejectNote] = useState('');
  const [requestDocFromCustomer, setRequestDocFromCustomer] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-slate-50 border border-emerald-200 rounded-xl p-5 text-center space-y-3 animate-pulse">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
        <div className="text-emerald-700 font-medium text-sm">در حال تحلیل هوشمند مدارک و مستندات (Evidence Intelligence)...</div>
        <div className="text-slate-500 text-xs">اعتبارسنجی کروکی، بررسی وضوح تصاویر و تطبیق نقش‌ها</div>
      </div>
    );
  }

  if (!aiResult) {
    return null;
  }

  const { result, confidence, explanationBullets } = aiResult;
  const completeness = result.completenessScore ?? 75;

  // Handler 1: Confirm / Accept
  const handleConfirmAccept = () => {
    setIsSubmittingReview(true);
    const nowFa = new Date().toLocaleString('fa-IR');
    const reviewer = reviewerName || (userRole === 'ADMIN' ? 'مدیر ارشد بیمه' : 'کارشناس خسارت');
    const noteText = acceptNote.trim() || 'اطلاعات استخراج‌شده کروکی و تطابق نقش‌ها کاملاً صحیح و مورد تأیید است.';

    try {
      AIService.getInstance().recordHumanReview(aiResult.id, {
        status: 'ACCEPTED',
        reviewedBy: reviewer,
        reviewerRole: userRole,
        reviewedAt: new Date().toISOString(),
        reviewNote: noteText,
      });

      const updatedReviewMeta = {
        status: 'ACCEPTED' as AIHumanReviewStatus,
        reviewedBy: reviewer,
        reviewedAt: nowFa,
        note: noteText,
        verifiedExtract: activeExtract,
      };

      setLocalReviewStatus('ACCEPTED');
      setReviewMetadata(updatedReviewMeta);

      if (claim && onUpdateCase) {
        const updatedHistory = [
          ...(claim.history || []),
          {
            status: claim.status,
            time: nowFa,
            user: reviewer,
            note: `تأیید استخراج هوشمند OCR و مدارک کروکی توسط کارشناس ارزیاب. اطلاعات کروکی، پلاک‌ها و نقش طرفین حادثه در سوابق تثبیت گردید.${acceptNote.trim() ? ` (یادداشت: ${acceptNote.trim()})` : ''}`,
          },
        ];

        const updatedCase: ClaimCase = {
          ...claim,
          history: updatedHistory,
          sceneReportCode: claim.sceneReportCode || activeExtract?.policeCode || undefined,
          aiIntelligence: {
            ...(claim.aiIntelligence || {}),
            ocrReview: updatedReviewMeta,
          },
        };

        onUpdateCase(updatedCase);
      }

      setToastMessage({
        type: 'success',
        text: 'نتایج OCR کروکی با موفقیت تایید و در سوابق و تاریخچه پرونده ثبت گردید.',
      });
      setShowAcceptConfirm(false);
      setAcceptNote('');

      if (onReviewSubmitted) {
        onReviewSubmitted('ACCEPTED', noteText);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handler 2: Open Modification Modal
  const handleOpenModifyModal = () => {
    const current = activeExtract || result.croquiOcrExtract || {};
    setModPoliceCode(current.policeCode || claim?.sceneReportCode || '');
    setModIncidentDate(current.incidentDate || claim?.date || '');
    setModFaultDriver(current.faultDriver || claim?.culpritName || '');
    setModFaultPlate(current.faultPlate || claim?.culpritPlate || '');
    setModVictimDriver(current.victimDriver || claim?.victimName || '');
    setModVictimPlate(current.victimPlate || claim?.victimPlate || '');
    setModDescription(current.description || claim?.writtenReport || '');
    setModNote('');
    setSyncToClaim(true);
    setShowModifyModal(true);
  };

  // Handler 2 (Save): Save Modification
  const handleSaveModification = () => {
    setIsSubmittingReview(true);
    const nowFa = new Date().toLocaleString('fa-IR');
    const reviewer = reviewerName || (userRole === 'ADMIN' ? 'مدیر ارشد بیمه' : 'کارشناس خسارت');

    const modifiedExtractData = {
      ...(activeExtract || {}),
      policeCode: modPoliceCode.trim(),
      incidentDate: modIncidentDate.trim(),
      faultDriver: modFaultDriver.trim(),
      faultPlate: modFaultPlate.trim(),
      victimDriver: modVictimDriver.trim(),
      victimPlate: modVictimPlate.trim(),
      description: modDescription.trim(),
    };

    try {
      AIService.getInstance().recordHumanReview(aiResult.id, {
        status: 'MODIFIED',
        reviewedBy: reviewer,
        reviewerRole: userRole,
        reviewedAt: new Date().toISOString(),
        originalValue: result.croquiOcrExtract,
        modifiedValue: modifiedExtractData,
        reviewNote: modNote.trim() || undefined,
      });

      const updatedReviewMeta = {
        status: 'MODIFIED' as AIHumanReviewStatus,
        reviewedBy: reviewer,
        reviewedAt: nowFa,
        note: modNote.trim() || 'اصلاح پلاک و اسامی طرفین حادثه بر اساس بازبینی چشمی کارشناس',
        originalExtract: result.croquiOcrExtract,
        modifiedExtract: modifiedExtractData,
      };

      setLocalReviewStatus('MODIFIED');
      setReviewMetadata(updatedReviewMeta);
      setActiveExtract(modifiedExtractData);

      if (claim && onUpdateCase) {
        const changesSummaryList = [
          modFaultPlate && modFaultPlate !== result.croquiOcrExtract?.faultPlate ? `پلاک مقصر: ${modFaultPlate}` : null,
          modVictimPlate && modVictimPlate !== result.croquiOcrExtract?.victimPlate ? `پلاک زیان‌دیده: ${modVictimPlate}` : null,
          modFaultDriver && modFaultDriver !== result.croquiOcrExtract?.faultDriver ? `راننده مقصر: ${modFaultDriver}` : null,
          modVictimDriver && modVictimDriver !== result.croquiOcrExtract?.victimDriver ? `راننده زیان‌دیده: ${modVictimDriver}` : null,
        ].filter(Boolean);

        const summaryText = changesSummaryList.length > 0 ? `موارد اصلاحی: ${changesSummaryList.join(' | ')}` : 'اصلاح اطلاعات کروکی';

        const updatedHistory = [
          ...(claim.history || []),
          {
            status: claim.status,
            time: nowFa,
            user: reviewer,
            note: `تأیید با اصلاحیه اطلاعات OCR کروکی توسط کارشناس ارزیاب (${reviewer}). ${summaryText}.${modNote.trim() ? ` یادداشت: ${modNote.trim()}` : ''}`,
          },
        ];

        const updatedCase: ClaimCase = {
          ...claim,
          history: updatedHistory,
          sceneReportCode: modPoliceCode.trim() || claim.sceneReportCode,
          ...(syncToClaim
            ? {
                culpritName: modFaultDriver.trim() || claim.culpritName,
                culpritPlate: modFaultPlate.trim() || claim.culpritPlate,
                victimName: modVictimDriver.trim() || claim.victimName,
                victimPlate: modVictimPlate.trim() || claim.victimPlate,
              }
            : {}),
          aiIntelligence: {
            ...(claim.aiIntelligence || {}),
            ocrReview: updatedReviewMeta,
          },
        };

        onUpdateCase(updatedCase);
      }

      setToastMessage({
        type: 'amber',
        text: 'اطلاعات کروکی با موفقیت اصلاح و در پرونده خسارت و سوابق ثبت شد.',
      });
      setShowModifyModal(false);

      if (onReviewSubmitted) {
        onReviewSubmitted('MODIFIED', modNote, modifiedExtractData);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handler 3: Open Rejection Modal
  const handleOpenRejectModal = () => {
    setSelectedRejectReason('دست‌خط یا تصویر برگه کروکی کاملاً مخدوش و ناخوانا است');
    setCustomRejectNote('');
    setRequestDocFromCustomer(true);
    setShowRejectModal(true);
  };

  // Handler 3 (Save): Save Rejection
  const handleConfirmRejection = () => {
    setIsSubmittingReview(true);
    const nowFa = new Date().toLocaleString('fa-IR');
    const reviewer = reviewerName || (userRole === 'ADMIN' ? 'مدیر ارشد بیمه' : 'کارشناس خسارت');
    const fullReason = `${selectedRejectReason}${customRejectNote.trim() ? ` - توضیحات: ${customRejectNote.trim()}` : ''}`;

    try {
      AIService.getInstance().recordHumanReview(aiResult.id, {
        status: 'REJECTED',
        reviewedBy: reviewer,
        reviewerRole: userRole,
        reviewedAt: new Date().toISOString(),
        rejectionReason: fullReason,
        reviewNote: customRejectNote.trim() || undefined,
      });

      const updatedReviewMeta = {
        status: 'REJECTED' as AIHumanReviewStatus,
        reviewedBy: reviewer,
        reviewedAt: nowFa,
        rejectionReason: fullReason,
        note: customRejectNote.trim(),
        customerRequested: requestDocFromCustomer,
      };

      setLocalReviewStatus('REJECTED');
      setReviewMetadata(updatedReviewMeta);

      if (claim && onUpdateCase) {
        let updatedDocRequests = claim.docRequests || [];
        let updatedAdditionalDocs = claim.additionalDocs || [];

        if (requestDocFromCustomer) {
          const reqId = `REQ-${Date.now()}`;
          updatedDocRequests = [
            ...updatedDocRequests,
            {
              id: reqId,
              docType: 'کروکی و گزارش پلیس',
              customDocType: 'تصویر واضح و باکیفیت برگه کروکی یا گزارش دادگستری',
              description: `تصویر کروکی ارسالی قبلی به دلیل «${selectedRejectReason}» مورد تأیید قرار نگرفت. لطفاً تصویر باکیفیت‌تر و بدون انعکاس نور بارگذاری نمایید.${customRejectNote.trim() ? ` (یادداشت کارشناس: ${customRejectNote.trim()})` : ''}`,
              requestedAt: nowFa,
              requestedBy: reviewer,
              status: 'درخواست ارسال شد',
            },
          ];

          updatedAdditionalDocs = [
            ...updatedAdditionalDocs,
            {
              id: `DOC-REQ-${Date.now()}`,
              name: 'تصویر مجدد و باکیفیت کروکی',
              type: 'kroki',
              status: 'PENDING',
              requestedAt: new Date().toLocaleDateString('fa-IR'),
              reason: `عدم وضوح یا مغایرت سند قبلی: ${selectedRejectReason}`,
              category: 'کروکی',
            },
          ];
        }

        const updatedHistory = [
          ...(claim.history || []),
          {
            status: claim.status,
            time: nowFa,
            user: reviewer,
            note: `رد استخراج هوشمند OCR کروکی توسط کارشناس (${reviewer}). علت رد: «${fullReason}». ${requestDocFromCustomer ? '(درخواست تصویر جایگزین به پرتال مشتری ارسال گردید)' : ''}`,
          },
        ];

        const updatedCase: ClaimCase = {
          ...claim,
          history: updatedHistory,
          docRequests: updatedDocRequests,
          additionalDocs: updatedAdditionalDocs,
          aiIntelligence: {
            ...(claim.aiIntelligence || {}),
            ocrReview: updatedReviewMeta,
          },
        };

        onUpdateCase(updatedCase);
      }

      setToastMessage({
        type: 'rose',
        text: `پیشنهاد هوش مصنوعی رد شد${requestDocFromCustomer ? ' و درخواست مدرک جدید به پرتال مشتری ارسال گردید.' : '.'}`,
      });
      setShowRejectModal(false);

      if (onReviewSubmitted) {
        onReviewSubmitted('REJECTED', fullReason);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handler: Reset / Re-evaluate Review
  const handleResetReview = () => {
    setLocalReviewStatus(null);
    setReviewMetadata(null);
    setActiveExtract(aiResult.result.croquiOcrExtract || null);
    setToastMessage({
      type: 'amber',
      text: 'وضعیت بررسی به حالت اولیه بازگشت. می‌توانید مجدداً تصمیم‌گیری نمایید.',
    });
  };

  const confidenceColor =
    confidence.level === 'HIGH'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
      : confidence.level === 'MEDIUM'
      ? 'text-amber-700 bg-amber-50 border-amber-300'
      : 'text-rose-700 bg-rose-50 border-rose-300';

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-[0_14px_40px_-20px_rgba(16,185,129,0.35)] transition-all">
      {/* Toast feedback banner */}
      {toastMessage && (
        <div
          className={`p-3 text-xs font-bold flex items-center justify-between transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-100 text-emerald-900 border-b border-emerald-200'
              : toastMessage.type === 'amber'
              ? 'bg-amber-100 text-amber-900 border-b border-amber-200'
              : 'bg-rose-100 text-rose-900 border-b border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'amber' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="p-4 bg-gradient-to-l from-emerald-50 via-teal-50/70 to-white border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 border border-emerald-600 flex items-center justify-center text-white shadow-sm">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">تحلیل هوشمند مدارک و کروکی (Evidence Intelligence)</h4>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                هوش فعال
              </span>
              {localReviewStatus === 'ACCEPTED' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  تأیید شده توسط کارشناس
                </span>
              )}
              {localReviewStatus === 'MODIFIED' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                  تأیید با اصلاحیه
                </span>
              )}
              {localReviewStatus === 'REJECTED' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                  رد شده توسط کارشناس
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              استخراج خودکار OCR، اعتبارسنجی پلیس راهور و پایش کیفیت تصاویر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Calibrated Confidence Badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${confidenceColor}`}>
            <span>ضریب اطمینان: {(confidence.score * 100).toFixed(0)}٪ ({confidence.labelFa})</span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 hover:bg-white text-slate-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
              title="ارزیابی مجدد"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 hover:bg-white text-slate-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4 text-xs">
        {/* Completeness Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              درصد پوشش و تکمیل مستندات پرونده:
            </span>
            <span className="font-bold text-emerald-600 font-mono text-sm">{completeness}٪</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                completeness >= 85 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${completeness}%` }}
            />
          </div>

          {result.missingAnglesFa && result.missingAnglesFa.length > 0 && (
            <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5">
              <span className="text-amber-700 font-bold">زوایای تکمیل نشده:</span>
              {result.missingAnglesFa.map((ang, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-700 font-medium">
                  {ang}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Inconsistencies or Discrepancies Alerts */}
        {result.inconsistenciesDetected && result.inconsistenciesDetected.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-700 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
              هشدار مغایرت در مدارک پرونده:
            </div>
            {result.inconsistenciesDetected.map((msg, idx) => (
              <p key={idx} className="text-xs text-rose-800 leading-relaxed pr-5">
                • {msg}
              </p>
            ))}
          </div>
        )}

        {/* Role Alignment Pill */}
        {result.roleAlignment && (
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              result.roleAlignment.matches
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-semibold">تطبیق نقش اظهار شده: </span>
                <span className="text-xs">{result.roleAlignment.notesFa}</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-current/20">
              {result.roleAlignment.matches ? 'منطبق' : 'مغایرت دارد'}
            </span>
          </div>
        )}

        {showDetails && (
          <>
            {/* Croqui OCR Extraction Panel */}
            {activeExtract ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>داده‌های استخراج شده از برگه کروکی (OCR)</span>
                    {localReviewStatus === 'MODIFIED' && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-300">
                        اصلاح‌شده توسط کارشناس
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] px-2.5 py-1 bg-sky-50 border border-sky-300 text-sky-800 rounded-lg font-mono font-bold">
                    کد پلیس: {activeExtract.policeCode || 'ثبت‌نشده'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  {/* Fault Driver Card */}
                  <div className="space-y-1.5 bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-700 font-bold flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5" />
                        راننده مقصر حادثه (مسئول):
                      </span>
                      <span className="text-[10px] text-rose-600 font-bold px-1.5 py-0.2 bg-white rounded border border-rose-200">
                        طرف مقصر
                      </span>
                    </div>
                    <div className="text-slate-900 font-black text-xs">
                      {activeExtract.faultDriver || 'نامشخص در متن کروکی'}
                    </div>
                    {activeExtract.faultPlate ? (
                      <div className="text-slate-700 font-mono font-bold bg-white/80 px-2 py-1 rounded border border-rose-100 inline-block text-xs" dir="ltr">
                        {activeExtract.faultPlate}
                      </div>
                    ) : (
                      <div className="text-slate-400 font-mono">پلاک: ثبت‌نشده</div>
                    )}
                  </div>

                  {/* Victim Driver Card */}
                  <div className="space-y-1.5 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5" />
                        راننده زیان‌دیده (متقاضی):
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold px-1.5 py-0.2 bg-white rounded border border-emerald-200">
                        زیان‌دیده
                      </span>
                    </div>
                    <div className="text-slate-900 font-black text-xs">
                      {activeExtract.victimDriver || 'نامشخص در متن کروکی'}
                    </div>
                    {activeExtract.victimPlate ? (
                      <div className="text-slate-700 font-mono font-bold bg-white/80 px-2 py-1 rounded border border-emerald-100 inline-block text-xs" dir="ltr">
                        {activeExtract.victimPlate}
                      </div>
                    ) : (
                      <div className="text-slate-400 font-mono">پلاک: ثبت‌نشده</div>
                    )}
                  </div>
                </div>

                {activeExtract.incidentDate && (
                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <span className="font-bold text-slate-700">تاریخ وقوع در کروکی:</span>
                    <span className="font-mono font-bold text-slate-900">{activeExtract.incidentDate}</span>
                  </div>
                )}

                {activeExtract.description && (
                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-700 font-bold block">شرح حادثه مندرج در کروکی پلیس:</span>
                    <p className="leading-relaxed text-slate-800">{activeExtract.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50/60 border border-slate-200 rounded-lg p-3 text-slate-500 text-xs">
                {result.croquiStatusFa || 'اطلاعات متنی کروکی یافت نشد.'}
              </div>
            )}

            {/* Photo Quality Analysis Matrix */}
            {result.photoQualityAnalysis && result.photoQualityAnalysis.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  کیفیت و وضوح تصاویر بارگذاری شده:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.photoQualityAnalysis.map((photo, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-2"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">{photo.mediaName}</div>
                        <div className="text-[11px] text-slate-500">{photo.notesFa}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          photo.quality === 'EXCELLENT' || photo.quality === 'GOOD'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-300'
                        }`}
                      >
                        {photo.quality === 'EXCELLENT'
                          ? 'بسیار عالی'
                          : photo.quality === 'GOOD'
                          ? 'واضح و معتبر'
                          : 'نیازمند بازبینی'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Missing Evidence Requests */}
            {result.smartEvidenceRequests && result.smartEvidenceRequests.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="font-bold text-amber-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  مستندات تکمیلی پیشنهادی هوش مصنوعی:
                </div>
                <div className="space-y-1.5">
                  {result.smartEvidenceRequests.map((req, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2 bg-white p-2.5 rounded-lg border border-amber-100">
                      <div>
                        <div className="font-medium text-slate-800 text-xs">{req.titleFa}</div>
                        <div className="text-[11px] text-slate-500">{req.reasonFa}</div>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                          req.urgency === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {req.urgency === 'HIGH' ? 'اولویت بالا' : 'اختیاری'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations & Summary Bullets */}
            {explanationBullets && explanationBullets.length > 0 && (
              <div className="bg-blue-50/60 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="text-blue-900 font-bold mb-1">جمع‌بندی سیستم ارزیابی مدارک:</div>
                {explanationBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-black">•</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Human-in-the-Loop Review Controls (Assessor / Reviewer) */}
        {showHitlControls && (
          <div className="mt-4 pt-4 border-t-2 border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-800">
                  نظارت و تصمیم‌گیری کارشناس (Human-in-the-Loop):
                </span>
              </div>
              {localReviewStatus && (
                <button
                  type="button"
                  onClick={handleResetReview}
                  className="text-[11px] font-bold text-slate-500 hover:text-purple-700 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                  title="بازگردانی به حالت اولیه و تصمیم‌گیری مجدد"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>تغییر وضعیت یا ارزیابی مجدد</span>
                </button>
              )}
            </div>

            {/* Status 1: Already Accepted */}
            {localReviewStatus === 'ACCEPTED' && (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تأیید نتایج ارزیابی مدارک و OCR توسط کارشناس</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {reviewMetadata?.reviewedAt || 'ثبت شده'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  {reviewMetadata?.note || 'اطلاعات کروکی و مدارک هوش مصنوعی توسط کارشناس خسارت بازبینی و در سوابق پرونده مورد تأیید قرار گرفت.'}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200 text-[10px] text-emerald-700 font-bold">
                  <span>کارشناس تأییدکننده: {reviewMetadata?.reviewedBy || reviewerName}</span>
                  <span className="text-emerald-800">وضعیت سابقه: درج در تاریخچه و لاگ رسمی پرونده ✓</span>
                </div>
              </div>
            )}

            {/* Status 2: Already Modified */}
            {localReviewStatus === 'MODIFIED' && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                    <Edit3 className="w-4 h-4 text-amber-700" />
                    <span>تأیید با اصلاحیه کارشناس (داده‌های OCR ویرایش و اعمال شد)</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                    {reviewMetadata?.reviewedAt || 'ثبت شده'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  {reviewMetadata?.note || 'داده‌های کروکی توسط کارشناس ویرایش و در فیلدهای پرونده اعمال گردید.'}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-amber-200 text-[10px] text-amber-800 font-bold">
                  <span>کارشناس ویرایش‌کننده: {reviewMetadata?.reviewedBy || reviewerName}</span>
                  <button
                    type="button"
                    onClick={handleOpenModifyModal}
                    className="text-amber-900 underline hover:text-amber-950 font-black cursor-pointer"
                  >
                    ویرایش مجدد مقادیر
                  </button>
                </div>
              </div>
            )}

            {/* Status 3: Already Rejected */}
            {localReviewStatus === 'REJECTED' && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-950 font-black text-xs">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>رد استخراج هوش مصنوعی و OCR توسط کارشناس</span>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-rose-800 bg-white px-2 py-0.5 rounded border border-rose-200">
                    {reviewMetadata?.reviewedAt || 'ثبت شده'}
                  </span>
                </div>
                <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
                  علت رد: {reviewMetadata?.rejectionReason || 'مخدوش یا ناخوانا بودن مدارک'}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-rose-200 text-[10px] text-rose-800 font-bold">
                  <span>کارشناس: {reviewMetadata?.reviewedBy || reviewerName}</span>
                  {reviewMetadata?.customerRequested && (
                    <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded border border-rose-200">
                      درخواست مدرک جایگزین به پرتال مشتری ارسال شد ✓
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* If pending or when user wants to change, show active buttons */}
            {(!localReviewStatus || showAcceptConfirm) && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  نتایج استخراج کروکی و ارزیابی کیفیت تصاویر نیازمند صحه‌گذاری کارشناس است. نتیجه تصمیم شما در گردش کار و تاریخچه پرونده ثبت خواهد شد:
                </p>

                {/* Inline Confirmation for Accept */}
                {showAcceptConfirm ? (
                  <div className="p-3.5 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      تأیید نهایی نتایج OCR و ارزیابی مدارک:
                    </div>
                    <input
                      type="text"
                      value={acceptNote}
                      onChange={(e) => setAcceptNote(e.target.value)}
                      placeholder="یادداشت اختیاری کارشناس (مثلاً: با سامانه راهور مطابقت داده شد)..."
                      className="w-full px-3 py-2 bg-white rounded-lg border border-emerald-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAcceptConfirm(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingReview}
                        onClick={handleConfirmAccept}
                        className="px-4 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ثبت تأیید در پرونده
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    {/* Button 1: تایید */}
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={() => setShowAcceptConfirm(true)}
                      className="px-3 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>تایید نتایج OCR</span>
                    </button>

                    {/* Button 2: تایید با اصلاحیه */}
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={handleOpenModifyModal}
                      className="px-3 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 shrink-0" />
                      <span>تایید با اصلاحیه</span>
                    </button>

                    {/* Button 3: رد پیشنهاد */}
                    <button
                      type="button"
                      disabled={isSubmittingReview}
                      onClick={handleOpenRejectModal}
                      className="px-3 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <X className="w-4 h-4 shrink-0" />
                      <span>رد پیشنهاد</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================= */}
      {/* MODAL: MODIFICATION (تایید با اصلاحیه) */}
      {/* ======================================================= */}
      {showModifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-amber-300 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">اصلاح و تأیید اطلاعات استخراج‌شده کروکی</h3>
                  <p className="text-[11px] text-slate-500">ویرایش شماره پلاک، اسامی و مشخصات کروکی جهت اعمال در پرونده</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModifyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                مقادیر زیر از تصویر کروکی با هوش مصنوعی استخراج شده‌اند. در صورت وجود خطا در خواندن پلاک یا اسامی، آن‌ها را تصحیح نمایید تا مستقیماً در پرونده ذخیره شوند.
              </div>

              {/* Police Code & Incident Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 mb-1">شماره سریال / کد پلیس کروکی</label>
                  <input
                    type="text"
                    value={modPoliceCode}
                    onChange={(e) => setModPoliceCode(e.target.value)}
                    placeholder="مثال: CRQ-1403-994"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 text-xs"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">تاریخ وقوع حادثه در کروکی</label>
                  <input
                    type="text"
                    value={modIncidentDate}
                    onChange={(e) => setModIncidentDate(e.target.value)}
                    placeholder="مثال: ۱۴۰۳/۰۶/۱۵"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Fault Party */}
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
                <span className="font-black text-rose-800 block text-xs">طرف مقصر حادثه:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نام راننده مقصر</label>
                    <input
                      type="text"
                      value={modFaultDriver}
                      onChange={(e) => setModFaultDriver(e.target.value)}
                      placeholder="نام و نام خانوادگی راننده مقصر"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">شماره پلاک مقصر</label>
                    <input
                      type="text"
                      value={modFaultPlate}
                      onChange={(e) => setModFaultPlate(e.target.value)}
                      placeholder="مثال: ایران 11 - 123 ج 45"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Victim Party */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-black text-emerald-800 block text-xs">طرف زیان‌دیده حادثه:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نام راننده زیان‌دیده</label>
                    <input
                      type="text"
                      value={modVictimDriver}
                      onChange={(e) => setModVictimDriver(e.target.value)}
                      placeholder="نام و نام خانوادگی زیان‌دیده"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">شماره پلاک زیان‌دیده</label>
                    <input
                      type="text"
                      value={modVictimPlate}
                      onChange={(e) => setModVictimPlate(e.target.value)}
                      placeholder="مثال: ایران 22 - 678 ب 90"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-black text-slate-700 mb-1">شرح حادثه مندرج در کروکی</label>
                <textarea
                  rows={2}
                  value={modDescription}
                  onChange={(e) => setModDescription(e.target.value)}
                  placeholder="شرح چگونگی تصادف طبق گزارش افسر یا کارشناس..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                />
              </div>

              {/* Assessor modification note */}
              <div>
                <label className="block font-black text-slate-700 mb-1">یادداشت کارشناس جهت درج در سوابق</label>
                <input
                  type="text"
                  value={modNote}
                  onChange={(e) => setModNote(e.target.value)}
                  placeholder="علت اصلاحیه (مثلاً: رقم آخر پلاک با کارت ماشین تطبیق داده شد)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              {/* Sync to Claim Checkbox */}
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToClaim}
                  onChange={(e) => setSyncToClaim(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="font-bold text-slate-800 text-[11px]">
                  به‌روزرسانی خودکار مشخصات پلاک و نام طرفین در پرونده اصلی خسارت
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowModifyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleSaveModification}
                className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره اصلاحات و تأیید نهایی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: REJECTION (رد پیشنهاد) */}
      {/* ======================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 border border-rose-300 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">رد استخراج OCR و ارزیابی هوش مصنوعی</h3>
                  <p className="text-[11px] text-slate-500">ثبت دلیل کارشناسی برای عدم تأیید مدارک یا کروکی</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 font-bold">لطفاً علت اصلی عدم تأیید را انتخاب نمایید:</p>

              {/* Predefined Reasons */}
              <div className="space-y-2">
                {[
                  'دست‌خط یا تصویر برگه کروکی کاملاً مخدوش و ناخوانا است',
                  'پلاک یا اطلاعات استخراج‌شده با بیمه‌نامه و پرونده مغایرت فاحش دارد',
                  'تصویر بارگذاری‌شده مربوط به برگه رسمی کروکی یا این حادثه نیست',
                  'سند ارسالی ناقص بوده و فاقد کروکی ترسیمی، مهر پلیس یا امضا است',
                  'سایر دلایل کارشناسی خسارت',
                ].map((reasonOption, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedRejectReason === reasonOption
                        ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      value={reasonOption}
                      checked={selectedRejectReason === reasonOption}
                      onChange={() => setSelectedRejectReason(reasonOption)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs leading-relaxed">{reasonOption}</span>
                  </label>
                ))}
              </div>

              {/* Additional Note */}
              <div>
                <label className="block font-black text-slate-700 mb-1">توضیحات تکمیلی کارشناس (اختیاری):</label>
                <textarea
                  rows={2}
                  value={customRejectNote}
                  onChange={(e) => setCustomRejectNote(e.target.value)}
                  placeholder="در صورت نیاز توضیحات بیشتری درج نمایید تا در پرونده ثبت شود..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-rose-500 text-xs leading-relaxed"
                />
              </div>

              {/* Checkbox: Dispatch document request to customer */}
              <label className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestDocFromCustomer}
                  onChange={(e) => setRequestDocFromCustomer(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <span className="font-black text-amber-950 block text-xs">
                    ارسال خودکار درخواست بارگذاری مجدد به پرتال مشتری (ثبت کسری مدارک)
                  </span>
                  <span className="text-[11px] text-amber-800 leading-relaxed block font-medium">
                    پیام و نوتیفیکیشنی برای مشتری ارسال می‌شود تا برگه کروکی یا تصویر واضح‌تری را در پرونده بارگذاری نماید.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>ثبت قطعی رد پیشنهاد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
