import React, { useState } from 'react';
import {
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  Layers,
  Sparkles,
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
} from 'lucide-react';
import { AIResult, EvidenceIntelligenceResult, AIHumanReviewStatus } from '../../lib/ai/types';
import { AIService } from '../../lib/ai/aiService';

interface EvidenceIntelligenceCardProps {
  claimId: string;
  aiResult?: AIResult<EvidenceIntelligenceResult> | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  userRole?: string;
  onReviewSubmitted?: (status: AIHumanReviewStatus, note?: string) => void;
  showHitlControls?: boolean;
  compact?: boolean;
}

export const EvidenceIntelligenceCard: React.FC<EvidenceIntelligenceCardProps> = ({
  claimId,
  aiResult,
  isLoading = false,
  onRefresh,
  userRole = 'ASSESSOR',
  onReviewSubmitted,
  showHitlControls = true,
  compact = false,
}) => {
  const [showDetails, setShowDetails] = useState(!compact);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [localReviewStatus, setLocalReviewStatus] = useState<AIHumanReviewStatus | null>(
    aiResult?.humanReview?.status || null
  );

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

  const { result, confidence, sourceReferences, explanationBullets } = aiResult;
  const completeness = result.completenessScore ?? 75;

  const handleReviewAction = async (status: AIHumanReviewStatus) => {
    setIsSubmittingReview(true);
    try {
      AIService.getInstance().recordHumanReview(aiResult.id, {
        status,
        reviewedBy: userRole === 'ADMIN' ? 'مدیر ارشد' : 'کارشناس خسارت',
        reviewerRole: userRole,
        reviewedAt: new Date().toISOString(),
        reviewNote: reviewNote || undefined,
      });
      setLocalReviewStatus(status);
      if (onReviewSubmitted) {
        onReviewSubmitted(status, reviewNote);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const confidenceColor =
    confidence.level === 'HIGH'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
      : confidence.level === 'MEDIUM'
      ? 'text-amber-700 bg-amber-50 border-amber-300'
      : 'text-rose-700 bg-rose-50 border-rose-300';

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden shadow-[0_14px_40px_-20px_rgba(16,185,129,0.35)] transition-all">
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
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              استخراج خودکار OCR، اعتبارسنجی پلیس راهور و پایش کیفیت تصاویر
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Calibrated Confidence Badge */}
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${confidenceColor}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>ضریب اطمینان: {(confidence.score * 100).toFixed(0)}٪ ({confidence.labelFa})</span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 hover:bg-white text-slate-500 hover:text-emerald-700 rounded-lg transition-colors"
              title="ارزیابی مجدد"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 hover:bg-white text-slate-500 hover:text-emerald-700 rounded-lg transition-colors"
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
            {result.croquiOcrExtract ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-600" />
                    داده‌های استخراج شده از کروکی فراجا (OCR)
                  </div>
                  <span className="text-[11px] px-2 py-0.5 bg-sky-50 border border-sky-300 text-sky-700 rounded font-bold">
                    کد پلیس: {result.croquiOcrExtract.policeCode}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1 bg-rose-50/50 p-2.5 rounded-lg border border-rose-200">
                    <span className="text-rose-700 font-bold block mb-1">راننده مقصر حادثه:</span>
                    <div className="text-slate-800 font-medium">{result.croquiOcrExtract.faultDriver}</div>
                    {result.croquiOcrExtract.faultPlate && (
                      <div className="text-slate-500 font-mono">پلاک: {result.croquiOcrExtract.faultPlate}</div>
                    )}
                  </div>

                  <div className="space-y-1 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-emerald-700 font-bold block mb-1">راننده زیان‌دیده:</span>
                    <div className="text-slate-800 font-medium">{result.croquiOcrExtract.victimDriver}</div>
                    {result.croquiOcrExtract.victimPlate && (
                      <div className="text-slate-500 font-mono">پلاک: {result.croquiOcrExtract.victimPlate}</div>
                    )}
                  </div>
                </div>

                {result.croquiOcrExtract.description && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-600 font-semibold">شرح حادثه در کروکی: </span>
                    {result.croquiOcrExtract.description}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-blue-50/60 border border-slate-200 rounded-lg p-3 text-slate-500 text-xs">
                {result.croquiStatusFa}
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
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                تاییدیه و نظارت کارشناسی (Human-in-the-Loop):
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                وضعیت: {localReviewStatus === 'ACCEPTED' ? 'تایید شد' : localReviewStatus === 'REJECTED' ? 'رد شد' : 'در انتظار تایید کارشناس'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSubmittingReview || localReviewStatus === 'ACCEPTED'}
                onClick={() => handleReviewAction('ACCEPTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  localReviewStatus === 'ACCEPTED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                تایید نتایج ارزیابی مدارک
              </button>

              <button
                type="button"
                disabled={isSubmittingReview || localReviewStatus === 'MODIFIED'}
                onClick={() => handleReviewAction('MODIFIED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  localReviewStatus === 'MODIFIED'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                تایید با اصلاحیه
              </button>

              <button
                type="button"
                disabled={isSubmittingReview || localReviewStatus === 'REJECTED'}
                onClick={() => handleReviewAction('REJECTED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  localReviewStatus === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                رد پیشنهاد
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
