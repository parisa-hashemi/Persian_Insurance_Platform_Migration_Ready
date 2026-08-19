/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - AI Assessment Pre-Draft Card Component
 * Provides assessors with ready-to-approve parts estimation, labor pricing,
 * customer deficiency messages, and technical notes with one-click acceptance or custom editing.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Send,
  Plus,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Wrench,
  Check,
  X,
  Copy,
  Info
} from 'lucide-react';
import { ClaimCase, PartItem } from '../../types';
import { generateAIAssessmentDraft, AIDraftAssessmentPackage, AIDraftPartItem, AIDraftCustomerMessage } from '../../lib/ai/aiDraftGenerator';
import { formatCurrency } from '../../lib/storage';

interface AIAssessmentDraftCardProps {
  claim: ClaimCase;
  onApplyParts: (parts: PartItem[], gross: number, salvage: number, note?: string) => void;
  onSendMessageToCustomer?: (msg: { target: string; targetParty: 'PARTY_ONE' | 'PARTY_TWO'; text: string; docType?: string }) => void;
  onAppendNote: (note: string) => void;
  readOnly?: boolean;
  hideCustomerMessages?: boolean;
  isFieldExpert?: boolean;
}

export const AIAssessmentDraftCard: React.FC<AIAssessmentDraftCardProps> = ({
  claim,
  onApplyParts,
  onSendMessageToCustomer,
  onAppendNote,
  readOnly = false,
  hideCustomerMessages = false,
  isFieldExpert = false
}) => {
  const isFieldMode = isFieldExpert || hideCustomerMessages || claim.status?.includes('میدانی') || claim.needsCulpritFieldVisit;
  const [isExpanded, setIsExpanded] = useState(true);
  const [draft, setDraft] = useState<AIDraftAssessmentPackage>(() => generateAIAssessmentDraft(claim));
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>(() => draft.parts.map(p => p.id));
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editedMsgText, setEditedMsgText] = useState<string>('');
  const [sentMsgIds, setSentMsgIds] = useState<string[]>([]);
  const [appliedPartsStatus, setAppliedPartsStatus] = useState<boolean>(false);
  const [appliedNoteStatus, setAppliedNoteStatus] = useState<boolean>(false);

  const togglePartSelection = (id: string) => {
    setSelectedPartIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApplyAllParts = () => {
    const partsToApply: PartItem[] = draft.parts.map(p => ({
      name: p.name,
      type: p.type,
      partPrice: p.partPrice,
      repairPrice: p.repairPrice,
      salvageValue: p.salvageValue,
      depreciation: p.depreciation
    }));

    onApplyParts(partsToApply, draft.totals.grossTotal, draft.totals.totalSalvage, draft.technicalReviewerNote);
    setAppliedPartsStatus(true);
    setAppliedNoteStatus(true);
  };

  const handleApplySelectedParts = () => {
    const selectedItems = draft.parts.filter(p => selectedPartIds.includes(p.id));
    if (selectedItems.length === 0) {
      alert('لطفاً حداقل یک قطعه را برای اعمال انتخاب فرمایید.');
      return;
    }

    let gross = 0;
    let salvage = 0;
    const partsToApply: PartItem[] = selectedItems.map(p => {
      gross += p.partPrice + p.repairPrice;
      salvage += p.salvageValue;
      return {
        name: p.name,
        type: p.type,
        partPrice: p.partPrice,
        repairPrice: p.repairPrice,
        salvageValue: p.salvageValue,
        depreciation: p.depreciation
      };
    });

    onApplyParts(partsToApply, gross, salvage);
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
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl border-2 border-indigo-500/30 shadow-xl overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white">
                پیش‌نویس جامع ارزیابی و برآورد هوش مصنوعی
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                دقت تحلیل {draft.confidenceScore * 100}٪
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              هوش مصنوعی قیمت‌گذاری قطعات، اجرت‌ها و پیش‌نویس پیام‌های کسری مدارک را آماده کرده است؛ صرفاً تایید یا ویرایش نمایید.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!appliedPartsStatus ? (
            <button
              type="button"
              onClick={handleApplyAllParts}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>تایید کامل پیش‌نویس (یک‌کلیک)</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              در جدول کارشناس درج شد
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isExpanded ? 'بستن کارت' : 'باز کردن کارت'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-6 animate-in fade-in">
          {/* 1. Parts & Price Estimation Section */}
          <div className="space-y-3 bg-slate-900/70 p-4 rounded-2xl border border-indigo-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <h4 className="font-extrabold text-xs text-indigo-200">
                  ۱. برآورد هوشمند قطعات، اجرت‌ها و استهلاک ({draft.carModel})
                </h4>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleApplySelectedParts}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-colors"
                >
                  اعمال موارد انتخابی ({selectedPartIds.length} قلم)
                </button>
              </div>
            </div>

            {/* Parts Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-2.5 w-8 text-center">انتخاب</th>
                    <th className="p-2.5">عنوان قطعه</th>
                    <th className="p-2.5">عملیات پیشنهادی</th>
                    <th className="p-2.5">هزینه قطعه (ریال)</th>
                    <th className="p-2.5">اجرت تعمیر/نقاشی (ریال)</th>
                    <th className="p-2.5">کسر داغی (ریال)</th>
                    <th className="p-2.5 font-black text-indigo-200">خالص ردیف (ریال)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {draft.parts.map((p) => {
                    const isSelected = selectedPartIds.includes(p.id);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-800/50 ${isSelected ? 'bg-indigo-950/40' : 'opacity-60'}`}>
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePartSelection(p.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-white">
                          <span>{p.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{p.reasonFa}</span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            p.type === 'replace' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}>
                            {p.type === 'replace' ? 'تعویض قطعه' : 'صافکاری و نقاشی'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono">{formatCurrency(p.partPrice)}</td>
                        <td className="p-2.5 font-mono">{formatCurrency(p.repairPrice)}</td>
                        <td className="p-2.5 font-mono text-amber-300">{formatCurrency(p.salvageValue)}</td>
                        <td className="p-2.5 font-mono font-black text-indigo-300">{formatCurrency(p.totalRow)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-800/90 font-bold border-t border-slate-700 text-slate-200">
                  <tr>
                    <td colSpan={3} className="p-2.5 text-left font-black text-white">مجموع برآورد هوش مصنوعی:</td>
                    <td className="p-2.5 font-mono text-slate-300">{formatCurrency(draft.totals.grossParts)}</td>
                    <td className="p-2.5 font-mono text-slate-300">{formatCurrency(draft.totals.grossLabor)}</td>
                    <td className="p-2.5 font-mono text-amber-300">{formatCurrency(draft.totals.totalSalvage)}</td>
                    <td className="p-2.5 font-mono font-black text-emerald-400">{formatCurrency(draft.totals.netPayable)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 2. Customer Deficiency & Coordination Messages Section (Suppressed for Field Experts) */}
          {isFieldMode ? (
            <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-black text-emerald-200">
                  <span>وضعیت ارتباط با مشتری: کارشناسی میدانی در محل حادثه</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                    حذف پیامک و پیام‌های برخط کسری مدرک
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  با توجه به اینکه ارزیابی به صورت میدانی و حضوری توسط کارشناس در صحنه تصادف انجام می‌شود، آماده‌سازی و ارسال پیام‌های برخط کسری مدارک به مشتری لغو گردیده و کلیه نظرات هوشمند، برآورد قطعات، اجرت‌ها و تطبیق اصالت مستقیماً در کارتابل کارشناس میدانی لحاظ شده است.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-900/70 p-4 rounded-2xl border border-indigo-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <h4 className="font-extrabold text-xs text-sky-200">
                    ۲. پیش‌نویس پیام‌های هوشمند کسری مدارک و هماهنگی با مشتری ({draft.customerMessages.length} مورد آماده ارسال)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">ارسال با تایید ارزیاب</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {draft.customerMessages.map((msg) => {
                  const isSent = sentMsgIds.includes(msg.id);
                  const isEditing = editingMsgId === msg.id;

                  return (
                    <div key={msg.id} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/90 space-y-2 text-xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-[11px] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-sky-400" />
                            {msg.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[10px] font-bold">
                            گیرنده: {msg.target}
                          </span>
                        </div>

                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={editedMsgText}
                            onChange={(e) => setEditedMsgText(e.target.value)}
                            className="w-full p-2 rounded-lg bg-slate-900 border border-indigo-500 text-slate-100 font-medium text-xs focus:outline-none"
                          />
                        ) : (
                          <p className="text-slate-300 font-medium leading-relaxed text-[11px]">
                            {msg.messageText}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 mt-1">
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
                              className="px-2 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-[11px]"
                            >
                              انصراف
                            </button>
                          </div>
                        ) : isSent ? (
                          <span className="text-emerald-400 font-black text-[11px] flex items-center gap-1">
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
                              className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 font-bold text-[10px] transition-colors flex items-center gap-1"
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

          {/* 3. Technical Notes & Fraud Rationale */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h4 className="font-extrabold text-xs text-emerald-200">
                  {isFieldMode ? '۲. یادداشت تحلیلی و گزارش فنی هوش مصنوعی (ویژه بازدید میدانی)' : '۳. یادداشت تحلیلی و گزارش فنی هوش مصنوعی'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAppendNote(draft.technicalReviewerNote);
                  setAppliedNoteStatus(true);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] border border-slate-600 transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {appliedNoteStatus ? 'در یادداشت گزارش درج شد' : 'درج در یادداشت فنی گزارش'}
              </button>
            </div>

            <p className="text-slate-300 text-xs font-mono leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800 whitespace-pre-line">
              {draft.technicalReviewerNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
