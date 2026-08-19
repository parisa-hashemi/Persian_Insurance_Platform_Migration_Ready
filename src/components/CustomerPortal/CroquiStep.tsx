import React, { useState, useRef } from 'react';
import { FileCheck, Upload, AlertCircle, CheckCircle, RefreshCw, Shield, FileText, Code, Copy, Check, Eye, Sparkles } from 'lucide-react';
import { CroquiData, DriverRole, ClaimCase } from '../../types';
import { sampleCroquis } from '../../data/mockData';
import { compressImageFile } from '../../lib/imageCompressor';
import { AIService } from '../../lib/ai/aiService';

interface CroquiStepProps {
  data: CroquiData | null;
  driverRole: DriverRole | null;
  onUpdate: (data: CroquiData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CroquiStep: React.FC<CroquiStepProps> = ({
  data,
  driverRole,
  onUpdate,
  onNext,
  onBack
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(data?.fileUrl || null);
  const [croquiType, setCroquiType] = useState<'paper' | 'electronic'>(data?.croquiType || 'paper');
  const [showJsonView, setShowJsonView] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeCroquiApi = async (fileDataUri?: string, sampleIndex?: number) => {
    setIsAnalyzing(true);
    setApiError(null);

    const targetFileUrl = fileDataUri || selectedFile || (sampleIndex !== undefined ? sampleCroquis[sampleIndex].fileUrl : sampleCroquis[0].fileUrl);
    const sample = sampleIndex !== undefined ? sampleCroquis[sampleIndex] : undefined;

    try {
      // Build context claim for AIService Evidence Intelligence
      const simulatedClaim: Partial<ClaimCase> = {
        id: `TEMP-CROQUI-${Date.now()}`,
        partyOneRole: driverRole === 'at_fault' ? 'مقصر' : 'زیان‌دیده',
        hasKroki: true,
        croquiType,
        customerKrokiPhoto: targetFileUrl,
        sceneReportCode: sample?.reportNumber || 'CRQ-1403-88492',
        date: sample?.incidentDate || '1403/05/12',
        victimName: sample?.victimDriver?.fullName || 'رضا احمدی',
        victimPlate: sample?.victimDriver?.plateNumber || '۱۲ ب ۳۴۵ - ایران ۱۱',
        culpritName: sample?.faultDriver?.fullName || 'علی محمدی',
        culpritPlate: sample?.faultDriver?.plateNumber || '۶۸ ج ۴۵۱ - ایران ۲۲',
        files: targetFileUrl ? [{ name: 'تصویر مدرک کروکی پلیس', dataUrl: targetFileUrl, type: 'image' }] : []
      };

      if (sample) {
        simulatedClaim.croquiData = {
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
          declaredRoleMatches: driverRole === 'at_fault' ? sample.faultDriver.nationalId === '1234567890' : sample.victimDriver.nationalId === '1234567890',
          discrepancyNotes:
            (driverRole === 'victim' && sample.faultDriver.nationalId === '1234567890')
              ? 'نقش اظهار شده (زیان‌دیده) با راننده مقصر در کروکی پلیس مغایرت دارد.'
              : null,
          recommendedNextStep: sample.isValid ? 'PROCEED_TO_DAMAGE_PHOTOS' : 'REQUIRE_MANUAL_REVIEW'
        };
      }

      // Call Central AI Service Evidence Intelligence
      const aiResult = await AIService.getInstance().analyzeEvidence(
        simulatedClaim as ClaimCase,
        targetFileUrl ? [{ id: 'croqui-f', name: 'کروکی پلیس', dataUrl: targetFileUrl, type: 'image' }] : [],
        { forceFresh: true }
      );

      const evResult = aiResult.result;
      const ocr = evResult.croquiOcrExtract;
      const isValid = evResult.croquiAuthenticity === 'VERIFIED';
      const roleMatches = evResult.roleAlignment?.matches ?? true;

      const croquiResult: CroquiData = {
        croquiType,
        fileUrl: targetFileUrl,
        isValidDocument: isValid,
        confidenceScore: aiResult.confidence.score,
        rejectionReason: !isValid ? 'مدرک فاقد علائم و مهر رسمی انتظامی است یا وضوح ناکافی دارد.' : undefined,
        reportNumber: ocr?.policeCode || sample?.reportNumber || 'CRQ-1403-88492',
        incidentDate: ocr?.incidentDate || sample?.incidentDate || '1403/05/12',
        location: sample?.location || 'تهران - معبر اصلی',
        faultDriver: {
          fullName: ocr?.faultDriver || sample?.faultDriver.fullName || 'علی محمدی',
          nationalId: sample?.faultDriver.nationalId || '0012345678',
          plateNumber: ocr?.faultPlate || sample?.faultDriver.plateNumber || '۶۸ ج ۴۵۱ - ایران ۲۲',
          insurancePolicyNumber: sample?.faultDriver.insurancePolicyNumber || 'POL-99482716'
        },
        victimDriver: {
          fullName: ocr?.victimDriver || sample?.victimDriver.fullName || 'رضا احمدی',
          nationalId: sample?.victimDriver.nationalId || '1234567890',
          plateNumber: ocr?.victimPlate || sample?.victimDriver.plateNumber || '۱۲ ب ۳۴۵ - ایران ۱۱',
          insurancePolicyNumber: sample?.victimDriver.insurancePolicyNumber || 'POL-10029384'
        },
        policeBadgeId: ocr?.policeOfficerBadge || sample?.policeBadgeId || 'POLICE-9821',
        hasOfficialStamp: ocr?.hasOfficialStamp ?? sample?.hasOfficialStamp ?? true,
        declaredRoleMatches: roleMatches,
        discrepancyNotes: evResult.roleAlignment?.notesFa || (evResult.inconsistenciesDetected.length > 0 ? evResult.inconsistenciesDetected[0] : null),
        recommendedNextStep: evResult.recommendedNextStep || (isValid && roleMatches ? 'PROCEED_TO_DAMAGE_PHOTOS' : 'REQUIRE_MANUAL_REVIEW'),
        rawEvaluationJSON: {
          aiResultId: aiResult.id,
          capability: aiResult.capability,
          status: aiResult.status,
          confidence: aiResult.confidence,
          evidenceResult: evResult,
          auditTrace: aiResult.auditTrace
        }
      };

      onUpdate(croquiResult);
    } catch (err: any) {
      console.error('Error analyzing croqui via AIService:', err);
      setApiError(err.message || 'خطا در ارزیابی مدارک توسط سرویس هوش مصنوعی');

      const fallbackSample = sample || sampleCroquis[0];
      const fallbackResult: CroquiData = {
        croquiType,
        fileUrl: targetFileUrl,
        isValidDocument: fallbackSample.isValid,
        confidenceScore: fallbackSample.confidence,
        reportNumber: fallbackSample.reportNumber,
        incidentDate: fallbackSample.incidentDate,
        location: fallbackSample.location,
        faultDriver: fallbackSample.faultDriver,
        victimDriver: fallbackSample.victimDriver,
        policeBadgeId: fallbackSample.policeBadgeId,
        hasOfficialStamp: fallbackSample.hasOfficialStamp,
        declaredRoleMatches: true,
        discrepancyNotes: null,
        recommendedNextStep: fallbackSample.isValid ? 'PROCEED_TO_DAMAGE_PHOTOS' : 'REQUIRE_MANUAL_REVIEW'
      };

      onUpdate(fallbackResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUri = await compressImageFile(file, 1000, 0.7);
    setSelectedFile(dataUri);
    analyzeCroquiApi(dataUri);
  };

  const handleSampleSelect = (sampleIndex: number) => {
    const sample = sampleCroquis[sampleIndex];
    setSelectedFile(sample.fileUrl);
    analyzeCroquiApi(sample.fileUrl, sampleIndex);
  };

  const copyRawJson = () => {
    if (data?.rawEvaluationJSON) {
      navigator.clipboard.writeText(JSON.stringify(data.rawEvaluationJSON, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-emerald-400" />
            ارزیابی هوشمند کروکی پلیس (Croqui Evaluator)
          </h3>
          <span className="text-xs px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full font-mono">
            Gemini 2.5 OCR
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          تصویر یا فایل PDF کروکی پلیس راهور را آپلود کنید تا موتور هوش مصنوعی OCR، اعتبارسنجی مدرک، تطبیق مقصر و زیان‌دیده و بررسی عدم مغایرت را به طور خودکار انجام دهد.
        </p>

        {/* Croqui Type Selection */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setCroquiType('paper')}
            className={`flex-1 p-4 rounded-lg border text-right transition-all ${
              croquiType === 'paper'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-semibold mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              کروکی کاغذی دستی
            </div>
            <div className="text-xs text-slate-400">تحلیل OCR پیشرفته کروکی‌های سنتی دستی و مهر رسمی پلیس</div>
          </button>

          <button
            type="button"
            onClick={() => setCroquiType('electronic')}
            className={`flex-1 p-4 rounded-lg border text-right transition-all ${
              croquiType === 'electronic'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <div className="font-semibold mb-1 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              کروکی الکترونیکی راهور
            </div>
            <div className="text-xs text-slate-400">استخراج و اعتبارسنجی مستقیم از سامانه راهور</div>
          </button>
        </div>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 text-center bg-slate-900/30 transition-colors mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf"
            className="hidden"
          />
          <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">بارگذاری فایل تصویر کروکی (JPG, PNG) یا PDF</p>
          <p className="text-slate-500 text-xs mb-4">حداکثر حجم ۱۰ مگابایت</p>

          <div className="flex justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              انتخاب و آپلود فایل کروکی
            </button>
          </div>

          <div className="text-xs text-slate-400 my-3">یا انتخاب یکی از نمونه‌های پیش‌فرض جهت تست سریع:</div>

          <div className="flex flex-wrap justify-center gap-3">
            {sampleCroquis.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleSelect(idx)}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                تست نمونه {idx + 1}: {sample.title.split('-')[0]}
              </button>
            ))}
          </div>
        </div>

        {apiError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs mb-4">
            {apiError}
          </div>
        )}

        {/* Analysis Progress Indicator */}
        {isAnalyzing && (
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-6 text-center space-y-3 my-6 animate-pulse">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
            <p className="text-emerald-300 font-medium text-sm">در حال پردازش OCR و اعتبارسنجی هوشمند کروکی پلیس...</p>
            <p className="text-slate-400 text-xs">ارزیابی صحت مدرک، استخراج مشخصات طرفین و تطبیق با نقش اظهار شده</p>
          </div>
        )}

        {/* Selected Image Preview */}
        {selectedFile && !isAnalyzing && (
          <div className="mb-6 rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                تصویر مدرک بارگذاری شده:
              </span>
            </div>
            <div className="max-h-60 overflow-hidden rounded flex justify-center bg-black/40">
              <img src={selectedFile} alt="Croqui" className="object-contain max-h-60" />
            </div>
          </div>
        )}

        {/* OCR & AI Analysis Results */}
        {data && !isAnalyzing && (
          <div className="space-y-4 border-t border-slate-700/80 pt-6 mt-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-200 text-base flex items-center gap-2">
                نتایج تحلیل و استخراج داده‌های کروکی
              </h4>
              <div className="flex items-center gap-2">
                {data.rawEvaluationJSON && (
                  <button
                    type="button"
                    onClick={() => setShowJsonView(!showJsonView)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    {showJsonView ? 'پنهان‌سازی JSON' : 'مشاهده JSON خروجی AI'}
                  </button>
                )}
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  data.isValidDocument 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {data.isValidDocument ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {data.isValidDocument ? `مدرک معتبر (اطمینان ${(data.confidenceScore * 100).toFixed(0)}٪)` : 'مدرک فاقد اعتبار'}
                </span>
              </div>
            </div>

            {/* Raw JSON Modal / Viewer */}
            {showJsonView && data.rawEvaluationJSON && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs dir-ltr text-left text-emerald-400 overflow-x-auto relative">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800 dir-rtl text-right">
                  <span className="text-slate-400 text-xs font-sans">ساختار خروجی AI Evaluator (STRICT JSON):</span>
                  <button
                    type="button"
                    onClick={copyRawJson}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1 transition-colors"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedJson ? 'کپی شد' : 'کپی JSON'}
                  </button>
                </div>
                <pre>{JSON.stringify(data.rawEvaluationJSON, null, 2)}</pre>
              </div>
            )}

            {/* Validation Callout */}
            {!data.isValidDocument && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold mb-1">هشدار اعتبارسنجی مدرک:</div>
                  <p className="text-xs text-rose-300/90">
                    {data.rejectionReason || 'تصویر یا مدرک بارگذاری شده فاقد علائم رسمی راهور، مهر انتظامی یا دارای وضوح پایین است.'}
                  </p>
                </div>
              </div>
            )}

            {/* Alignment Check Warning */}
            {!data.declaredRoleMatches && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold mb-1">مغایرت در نقش اظهار شده (Alignment Check):</div>
                  <p className="text-xs text-amber-300/90">
                    {data.discrepancyNotes || 'نقش انتخابی شما با تعیین مقصر در کروکی پلیس مطابقت ندارد.'}
                  </p>
                </div>
              </div>
            )}

            {/* Recommended Next Step Badge */}
            <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">گام پیشنهادی سیستم هوشمند:</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                data.recommendedNextStep === 'PROCEED_TO_DAMAGE_PHOTOS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : data.recommendedNextStep === 'REQUIRE_MANUAL_REVIEW'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {data.recommendedNextStep === 'PROCEED_TO_DAMAGE_PHOTOS' && 'ادامه فرایند و ثبت تصاویر خسارت (PROCEED_TO_DAMAGE_PHOTOS)'}
                {data.recommendedNextStep === 'REQUIRE_MANUAL_REVIEW' && 'نیازمند بررسی و ارزیابی دستی کارشناس (REQUIRE_MANUAL_REVIEW)'}
                {data.recommendedNextStep === 'REUPLOAD_CROQUI' && 'بارگذاری مجدد کروکی پلیس (REUPLOAD_CROQUI)'}
              </span>
            </div>

            {/* Extracted Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
                <div className="font-bold text-emerald-400 text-sm mb-2 pb-1 border-b border-slate-800">
                  اطلاعات راننده مقصر حادثه (Fault Driver)
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">نام و نام خانوادگی:</span>
                  <span className="text-slate-200 font-semibold">{data.faultDriver.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">کد ملی:</span>
                  <span className="text-slate-200 font-mono">
                    {driverRole === 'victim' ? '*** (محرمانه - جهت حفظ حریم خصوصی)' : data.faultDriver.nationalId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">شماره پلاک:</span>
                  <span className="text-slate-200 font-medium">{data.faultDriver.plateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">شماره بیمه‌نامه:</span>
                  <span className="text-slate-200 font-mono">{data.faultDriver.insurancePolicyNumber}</span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
                <div className="font-bold text-sky-400 text-sm mb-2 pb-1 border-b border-slate-800">
                  اطلاعات راننده زیان‌دیده (Victim Driver)
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">نام و نام خانوادگی:</span>
                  <span className="text-slate-200 font-semibold">{data.victimDriver.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">کد ملی:</span>
                  <span className="text-slate-200 font-mono">
                    {driverRole === 'at_fault' ? '*** (محرمانه - جهت حفظ حریم خصوصی)' : data.victimDriver.nationalId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">شماره پلاک:</span>
                  <span className="text-slate-200 font-medium">{data.victimDriver.plateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">شماره بیمه‌نامه:</span>
                  <span className="text-slate-200 font-mono">{data.victimDriver.insurancePolicyNumber}</span>
                </div>
              </div>
            </div>

            {/* General Metadata */}
            <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">شماره گزارش:</span>
                <span className="font-mono text-slate-200 font-semibold">{data.reportNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">تاریخ حادثه:</span>
                <span className="text-slate-200 font-semibold">{data.incidentDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">کد افسر پلیس:</span>
                <span className="font-mono text-slate-200">{data.policeBadgeId}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">مهر و امضای رسمی:</span>
                <span className={`font-semibold ${data.hasOfficialStamp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.hasOfficialStamp ? 'تایید شده' : 'موجود نیست'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-8 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
          >
            بازگشت
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={!data || isAnalyzing}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              data && !isAnalyzing
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            تایید و مرحله بعدی (تصاویر خسارت)
          </button>
        </div>
      </div>
    </div>
  );
};
