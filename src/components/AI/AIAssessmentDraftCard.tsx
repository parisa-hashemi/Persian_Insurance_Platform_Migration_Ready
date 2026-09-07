/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * کاراینشو — کارت پیش‌نویس هوشمند ارزیابی (بازطراحی روشن)
 * هوش مصنوعی فقط «نوع عملیات» (تعویض/تعمیر) و «شدت آسیب» هر قطعه را تعیین می‌کند؛
 * قیمت‌گذاری تماماً بر عهده کارشناس است. با تایید پیش‌نویس، قطعات با قیمت خالی
 * به جدول کارشناس منتقل می‌شوند تا خودش برای هر مورد قیمت ثبت کند.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Edit3,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Wrench,
  Check,
  Copy,
  Info
} from 'lucide-react';
import { ClaimCase, PartItem } from '../../types';
import { generateAIAssessmentDraft, AIDraftAssessmentPackage, AIDraftCustomerMessage } from '../../lib/ai/aiDraftGenerator';

interface AIAssessmentDraftCardProps {
  claim: ClaimCase;
  carDamageSpots?: Record<string, any>;
  onApplyParts: (parts: PartItem[], gross: number, salvage: number, note?: string) => void;
  onSendMessageToCustomer?: (msg: { target: string; targetParty: 'PARTY_ONE' | 'PARTY_TWO'; text: string; docType?: string }) => void;
  onAppendNote: (note: string) => void;
  readOnly?: boolean;
  hideCustomerMessages?: boolean;
  isFieldExpert?: boolean;
}

/** شدت آسیب استنتاج‌شده از نوع عملیات پیشنهادی هوش مصنوعی */
const severityOf = (type: 'replace' | 'repair') =>
  type === 'replace'
    ? { label: 'شدید', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
    : { label: 'متوسط', cls: 'bg-amber-50 text-amber-800 border-amber-200' };

export const AIAssessmentDraftCard: React.FC<AIAssessmentDraftCardProps> = ({
  claim,
  carDamageSpots,
  onApplyParts,
  onSendMessageToCustomer,
  onAppendNote,
  readOnly = false,
  hideCustomerMessages = false,
  isFieldExpert = false
}) => {
  const isFieldMode = isFieldExpert || hideCustomerMessages || claim.status?.includes('میدانی') || claim.needsCulpritFieldVisit;
  const [isExpanded, setIsExpanded] = useState(true);

  // محاسبه پیش‌نویس با استفاده از نقاط آسیب خودرو و خودروی پرونده با اسامی دقیق و استاندارد فارسی
  const effectiveSpots = carDamageSpots || claim.carDamageSpots;
  const draft = React.useMemo(
    () => generateAIAssessmentDraft(claim, effectiveSpots),
    [claim, effectiveSpots]
  );

  const [selectedPartIds, setSelectedPartIds] = useState<string[]>(() => draft.parts.map(p => p.id));
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editedMsgText, setEditedMsgText] = useState<string>('');
  const [sentMsgIds, setSentMsgIds] = useState<string[]>([]);
  const [appliedPartsStatus, setAppliedPartsStatus] = useState<boolean>(false);
  const [appliedNoteStatus, setAppliedNoteStatus] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // همگام‌سازی انتخاب قطعات در صورت تغییر پیش‌نویس
  React.useEffect(() => {
    setSelectedPartIds(draft.parts.map(p => p.id));
    setAppliedPartsStatus(false);
  }, [draft]);

  const togglePartSelection = (id: string) => {
    setSelectedPartIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /** انتقال قطعات به جدول کارشناس — بدون هیچ قیمتی؛ قیمت‌گذاری با خود کارشناس */
  const buildPartsForAssessor = (ids: string[]): PartItem[] =>
    draft.parts
      .filter(p => ids.includes(p.id))
      .map(p => ({
        name: p.name,
        type: p.type,
        partPrice: 0,
        repairPrice: 0,
        salvageNeeded: p.type === 'replace',
        salvageValue: 0
      }));

  const handleApplyAllParts = () => {
    onApplyParts(
      buildPartsForAssessor(draft.parts.map(p => p.id)),
      0,
      0,
      draft.technicalReviewerNote
    );
    setAppliedPartsStatus(true);
    setAppliedNoteStatus(true);
  };

  const handleApplySelectedParts = () => {
    if (selectedPartIds.length === 0) {
      setApplyError('لطفاً حداقل یک قطعه را برای انتقال به جدول قیمت‌گذاری انتخاب فرمایید.');
      return;
    }
    setApplyError(null);
    onApplyParts(buildPartsForAssessor(selectedPartIds), 0, 0);
    setAppliedPartsStatus(true);
  };

  const handleSendDraftMessage = (msg: AIDraftCustomerMessage) => {
    const textToSend = editingMsgId === msg.id && editedMsgText.trim() ? editedMsgText.trim() : msg.messageText;
    if (onSendMessageToCustomer) {
      onSendMessageToCustomer({
        target: msg.target,
        targetParty: msg.targetParty,
        text: textToSend,
        docType: msg.docTypeRequested
      });
    }
    setSentMsgIds(prev => [...prev, msg.id]);
    setEditingMsgId(null);
  };

  return (
    <div className="bg-white text-slate-900 rounded-3xl border border-blue-200 shadow-[0_16px_44px_-20px_rgba(37,99,235,0.35)] overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-l from-blue-50 via-indigo-50/60 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-blue-300/50 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm text-blue-950">
                پیش‌نویس هوشمند ارزیابی (نوع عملیات و شدت آسیب)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                دقت تحلیل {draft.confidenceScore * 100}٪
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              هوش مصنوعی فقط <b className="text-blue-800">قطعات آسیب‌دیده، شدت آسیب و تعویضی/تعمیری بودن</b> را
              پیشنهاد می‌دهد؛ <b className="text-blue-800">قیمت‌گذاری همه موارد با شماست</b>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!appliedPartsStatus ? (
            <button
              type="button"
              disabled={readOnly}
              onClick={handleApplyAllParts}
              className="px-4 py-2 rounded-xl bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-blue-300/60 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>تایید به عنوان پیش‌نویس (افزودن به لیست قطعات و مدل ۲ بعدی و ۳ بعدی)</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-300 font-black text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              تایید شد — به لیست قطعات و مدل ۲ بعدی و ۳ بعدی افزوده شد
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
            title={isExpanded ? 'بستن کارت' : 'باز کردن کارت'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-6 animate-in fade-in">
          {/* ۱. قطعات پیشنهادی هوش مصنوعی (بدون قیمت) */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h4 className="font-extrabold text-xs text-blue-900">
                  ۱. قطعات آسیب‌دیده، شدت و نوع عملیات پیشنهادی ({draft.carModel})
                </h4>
              </div>
              <button
                type="button"
                disabled={readOnly}
                onClick={handleApplySelectedParts}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors disabled:opacity-60"
              >
                تایید و افزودن به لیست قطعات و مدل خودرو ({selectedPartIds.length} قلم)
              </button>
            </div>

            {applyError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {applyError}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-right text-xs">
                <thead className="bg-blue-50/80 text-blue-900 font-bold border-b border-blue-100">
                  <tr>
                    <th className="p-2.5 w-8 text-center">انتخاب</th>
                    <th className="p-2.5">عنوان قطعه</th>
                    <th className="p-2.5">شدت آسیب</th>
                    <th className="p-2.5">عملیات پیشنهادی</th>
                    <th className="p-2.5">قیمت‌گذاری</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {draft.parts.map((p) => {
                    const isSelected = selectedPartIds.includes(p.id);
                    const sev = severityOf(p.type);
                    return (
                      <tr key={p.id} className={`hover:bg-blue-50/40 transition-colors ${isSelected ? 'bg-blue-50/60' : 'opacity-55'}`}>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePartSelection(p.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">
                          <span>{p.name}</span>
                          <span className="block text-[10px] text-slate-500 font-normal mt-0.5">{p.reasonFa}</span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${sev.cls}`}>
                            {sev.label}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            p.type === 'replace'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            {p.type === 'replace' ? 'تعویض قطعه' : 'صافکاری و نقاشی'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            توسط کارشناس تعیین می‌شود
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 font-medium flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
              <span>
                پس از تایید، این قطعات با قیمت خالی به «جدول قیمت‌گذاری کارشناس» منتقل می‌شوند و شما برای هر مورد،
                هزینه قطعه، اجرت و ارزش داغی را ثبت می‌کنید. هوش مصنوعی هیچ مبلغی پیشنهاد نمی‌دهد.
              </span>
            </div>
          </div>

          {/* ۲. پیام‌های کسری مدارک (برای کارشناس میدانی حذف می‌شود) */}
          {isFieldMode ? (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-emerald-900 flex-wrap">
                  <span>وضعیت ارتباط با مشتری: کارشناسی میدانی در محل حادثه</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold">
                    حذف پیامک و پیام‌های برخط کسری مدرک
                  </span>
                </div>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  با توجه به اینکه ارزیابی به صورت میدانی و حضوری توسط کارشناس در صحنه تصادف انجام می‌شود،
                  آماده‌سازی و ارسال پیام‌های برخط کسری مدارک به مشتری لغو گردیده و کلیه نظرات هوشمند مستقیماً
                  در کارتابل کارشناس میدانی لحاظ شده است.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  <h4 className="font-extrabold text-xs text-sky-900">
                    ۲. پیش‌نویس پیام‌های هوشمند کسری مدارک و هماهنگی با مشتری ({draft.customerMessages.length} مورد آماده ارسال)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-500 font-bold">ارسال فقط با تایید ارزیاب</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draft.customerMessages.map((msg) => {
                  const isSent = sentMsgIds.includes(msg.id);
                  const isEditing = editingMsgId === msg.id;

                  return (
                    <div key={msg.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-slate-900 text-[11px] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            {msg.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                            گیرنده: {msg.target}
                          </span>
                        </div>

                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={editedMsgText}
                            onChange={(e) => setEditedMsgText(e.target.value)}
                            className="w-full p-2 rounded-lg bg-white border border-blue-400 text-slate-800 font-medium text-xs focus:outline-none focus:border-blue-600"
                          />
                        ) : (
                          <p className="text-slate-600 font-medium leading-relaxed text-[11px]">
                            {msg.messageText}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                        {isEditing ? (
                          <div className="flex gap-1.5 w-full">
                            <button
                              type="button"
                              onClick={() => handleSendDraftMessage(msg)}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              ارسال متن ویرایش‌شده
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMsgId(null)}
                              className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] border border-slate-200"
                            >
                              انصراف
                            </button>
                          </div>
                        ) : isSent ? (
                          <span className="text-emerald-600 font-black text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ارسال شد به چت پرونده
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 w-full justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsgId(msg.id);
                                setEditedMsgText(msg.messageText);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] border border-slate-200 transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              ویرایش متن
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendDraftMessage(msg)}
                              className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black text-[10px] transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              تایید و ارسال به مشتری
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ۳. یادداشت تحلیلی هوش مصنوعی */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-xs text-emerald-900">
                  {isFieldMode ? '۲. یادداشت تحلیلی و گزارش فنی هوش مصنوعی (ویژه بازدید میدانی)' : '۳. یادداشت تحلیلی و گزارش فنی هوش مصنوعی'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAppendNote(draft.technicalReviewerNote);
                  setAppliedNoteStatus(true);
                }}
                className="px-3 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-300 transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {appliedNoteStatus ? 'در یادداشت گزارش درج شد' : 'درج در یادداشت فنی گزارش'}
              </button>
            </div>

            <p className="text-slate-700 text-xs font-mono leading-relaxed bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-line">
              {draft.technicalReviewerNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
