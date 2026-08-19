/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Unified Documents & Media Repository Card
 * Compact, interactive, and uncluttered documents management for the Assessor Workspace.
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Film,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  HardDrive,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ClaimCase, MediaFile, AdditionalDocItem } from '../../types';
import { AIResult, EvidenceIntelligenceResult } from '../../lib/ai/types';
import { EvidenceIntelligenceCard } from '../AI/EvidenceIntelligenceCard';

export interface UnifiedDocItem {
  id: string;
  title: string;
  type: 'image' | 'audio' | 'video' | 'kroki' | 'pdf' | 'document';
  url: string;
  source: 'CUSTOMER_EXPLANATION' | 'PARTY_DOC' | 'INITIAL_FILE' | 'POLICE_CROQUI';
  uploader: string;
  uploaderRole: string;
  uploaderParty?: 'PARTY_ONE' | 'PARTY_TWO' | 'POLICE' | 'SYSTEM' | string;
  uploadedAt?: string;
  fileSize?: string;
  note?: string;
  category?: string;
  code?: string;
}

interface UnifiedDocumentsCardProps {
  claim: ClaimCase;
  aiResult?: AIResult<EvidenceIntelligenceResult>;
  isAiLoading?: boolean;
  onRefreshAi?: () => void;
  onPreviewMedia?: (media: {
    url: string;
    name: string;
    type: string;
    category?: string;
    uploader?: string;
    note?: string;
  }) => void;
}

export const UnifiedDocumentsCard: React.FC<UnifiedDocumentsCardProps> = ({
  claim,
  aiResult,
  isAiLoading = false,
  onRefreshAi,
  onPreviewMedia,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'audio' | 'kroki' | 'video'>('all');
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [localPreviewModal, setLocalPreviewModal] = useState<UnifiedDocItem | null>(null);

  // Normalize and deduplicate all documents across the claim
  const allDocs = useMemo<UnifiedDocItem[]>(() => {
    const list: UnifiedDocItem[] = [];
    const seenUrls = new Set<string>();

    // 1. Audio Explanation from Driver
    if (claim.audioExplanation) {
      seenUrls.add(claim.audioExplanation);
      list.push({
        id: 'driver-audio-explanation',
        title: 'شرح صوتی راننده / زیان‌دیده',
        type: 'audio',
        url: claim.audioExplanation,
        source: 'CUSTOMER_EXPLANATION',
        uploader: claim.victimName || 'زیان‌دیده',
        uploaderRole: 'زیان‌دیده (راننده)',
        uploaderParty: 'PARTY_ONE',
        uploadedAt: claim.date || 'ثبت اولیه',
        fileSize: '1.2 MB',
        category: 'توضیحات صوتی وقوع حادثه',
        note: 'صدای ضبط‌شده راننده در هنگام ثبت برخط پرونده',
      });
    }

    // 2. Video Explanation from Driver
    if (claim.videoExplanation) {
      seenUrls.add(claim.videoExplanation);
      list.push({
        id: 'driver-video-explanation',
        title: 'فیلم صحنه تصادف و خسارت',
        type: 'video',
        url: claim.videoExplanation,
        source: 'CUSTOMER_EXPLANATION',
        uploader: claim.victimName || 'زیان‌دیده',
        uploaderRole: 'زیان‌دیده (راننده)',
        uploaderParty: 'PARTY_ONE',
        uploadedAt: claim.date || 'ثبت اولیه',
        fileSize: '18.4 MB',
        category: 'فیلم صحنه حادثه',
        note: 'ویدیو ضبط‌شده از محل وقوع تصادف و زاویه قرارگیری خودروها',
      });
    }

    // 3. Official Police Croqui
    const croquiUrl = claim.customerKrokiPhoto || claim.croquiData?.fileUrl;
    if (croquiUrl) {
      seenUrls.add(croquiUrl);
      list.push({
        id: 'police-croqui-doc',
        title: 'برگه کروکی رسمی پلیس راهور',
        type: 'kroki',
        url: croquiUrl,
        source: 'POLICE_CROQUI',
        uploader: 'افسر کارشناس پلیس راهور',
        uploaderRole: 'پلیس راهور ناجا',
        uploaderParty: 'POLICE',
        uploadedAt: claim.croquiData?.incidentDate || claim.date || '۱۴۰۵/۰۵/۱۴',
        fileSize: '2.4 MB',
        category: 'کروکی و گزارش انتظامی',
        code: claim.sceneReportCode || claim.croquiData?.reportNumber || 'CRQ-88492',
        note: claim.croquiData?.discrepancyNotes || 'برگه رسمی ترسیم کروکی صحنه تصادف توسط کارشناس تصادفات پلیس راهور',
      });
    }

    // 4. Additional Documents Uploaded by Parties
    if (claim.additionalDocs && Array.isArray(claim.additionalDocs)) {
      claim.additionalDocs.forEach((doc, idx) => {
        const url = doc.dataUrl || doc.url || '';
        if (url && seenUrls.has(url)) return; // Deduplicate
        if (url) seenUrls.add(url);

        const isAudio =
          doc.fileType === 'audio' ||
          doc.type === 'audio' ||
          doc.title?.includes('صوت') ||
          doc.title?.includes('voice');
        const isVideo =
          doc.fileType === 'video' ||
          doc.type === 'video' ||
          doc.title?.includes('ویدیو');

        list.push({
          id: doc.id || `add-doc-${idx}`,
          title: doc.title || 'مستند تکمیلی',
          type: isAudio ? 'audio' : isVideo ? 'video' : 'image',
          url,
          source: 'PARTY_DOC',
          uploader: doc.uploadedBy || (doc.uploaderParty === 'PARTY_ONE' ? 'طرف اول' : 'طرف دوم'),
          uploaderRole:
            doc.uploaderRole || (doc.uploaderParty === 'PARTY_ONE' ? 'طرف اول (زیان‌دیده)' : 'طرف دوم (مقصر)'),
          uploaderParty: doc.uploaderParty || 'PARTY_ONE',
          uploadedAt: doc.uploadedAt || claim.date || '۱۴۰۵/۰۵/۲۸',
          fileSize: doc.fileSize || '1.5 MB',
          category: doc.docType || 'مستند تکمیلی طرفین',
          note: doc.note,
        });
      });
    }

    // 5. Initial Claim Photos & Files
    if (claim.files && Array.isArray(claim.files)) {
      claim.files.forEach((f: any, idx: number) => {
        const fileName = typeof f === 'string' ? f : f?.name || f?.fileName || `تصویر شماره ${idx + 1}`;
        const dataUrl = typeof f === 'object' ? f?.dataUrl || f?.url : undefined;
        if (dataUrl && seenUrls.has(dataUrl)) return; // Deduplicate
        if (dataUrl) seenUrls.add(dataUrl);

        const isAudio =
          fileName?.includes('صوت') ||
          fileName?.includes('voice') ||
          f?.type === 'audio';
        const isVideo =
          fileName?.includes('ویدیو') ||
          fileName?.includes('video') ||
          f?.type === 'video';

        list.push({
          id: `initial-file-${idx}`,
          title: fileName,
          type: isAudio ? 'audio' : isVideo ? 'video' : 'image',
          url: dataUrl || '',
          source: 'INITIAL_FILE',
          uploader: claim.victimName || 'زیان‌دیده',
          uploaderRole: 'زیان‌دیده (ثبت اولیه)',
          uploaderParty: 'PARTY_ONE',
          uploadedAt: claim.date || 'ثبت اولیه',
          fileSize: f?.fileSize || '1.8 MB',
          category: 'عکس خسارت ثبت اولیه',
        });
      });
    }

    return list;
  }, [claim]);

  // Counts by category
  const counts = useMemo(() => {
    const images = allDocs.filter((d) => d.type === 'image').length;
    const audio = allDocs.filter((d) => d.type === 'audio').length;
    const kroki = allDocs.filter((d) => d.type === 'kroki').length;
    const video = allDocs.filter((d) => d.type === 'video').length;
    return {
      total: allDocs.length,
      images,
      audio,
      kroki,
      video,
    };
  }, [allDocs]);

  // Filtered list
  const filteredDocs = useMemo(() => {
    if (activeFilter === 'all') return allDocs;
    if (activeFilter === 'image') return allDocs.filter((d) => d.type === 'image');
    if (activeFilter === 'audio') return allDocs.filter((d) => d.type === 'audio');
    if (activeFilter === 'kroki') return allDocs.filter((d) => d.type === 'kroki');
    if (activeFilter === 'video') return allDocs.filter((d) => d.type === 'video');
    return allDocs;
  }, [allDocs, activeFilter]);

  const handleOpenPreview = (item: UnifiedDocItem) => {
    if (onPreviewMedia) {
      onPreviewMedia({
        url: item.url,
        name: item.title,
        type: item.type,
        category: item.category,
        uploader: item.uploader,
        note: item.note,
      });
    } else {
      setLocalPreviewModal(item);
    }
  };

  const toggleAudioPlay = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingAudioId((prev) => (prev === id ? null : id));
  };

  return (
    <div id="unified-documents-repository-card" className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200">
      
      {/* 1. COMPACT COLLAPSIBLE CARD HEADER */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                مستندات و فایل‌های ارسالی طرفین
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-black">
                {counts.total} فایل
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              مخزن تجمیع‌شده تصاویر بدنه، فایل‌های صوتی، برگه کروکی و اسناد طرفین
            </p>
          </div>
        </div>

        {/* Quick summary badges & Expand toggle button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
            {counts.images > 0 && (
              <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-slate-500" />
                <span>{counts.images} عکس</span>
              </span>
            )}
            {counts.audio > 0 && (
              <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Mic className="w-3 h-3 text-emerald-600" />
                <span>{counts.audio} صوت</span>
              </span>
            )}
            {counts.kroki > 0 && (
              <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                <span>کروکی</span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>{isExpanded ? 'بستن مخزن' : 'مشاهده و بازبینی فایل‌ها'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. EXPANDED CONTENT VIEW */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
          
          {/* Top Bar: Filters + AI Intelligence Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                همه ({counts.total})
              </button>

              {counts.images > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'image'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>عکس‌ها ({counts.images})</span>
                </button>
              )}

              {counts.audio > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('audio')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'audio'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>صوت راننده ({counts.audio})</span>
                </button>
              )}

              {counts.kroki > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('kroki')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'kroki'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-white text-amber-800 hover:bg-amber-100/80 border border-amber-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>کروکی پلیس ({counts.kroki})</span>
                </button>
              )}

              {counts.video > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    activeFilter === 'video'
                      ? 'bg-indigo-700 text-white shadow-xs'
                      : 'bg-white text-indigo-800 hover:bg-indigo-100/80 border border-indigo-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>فیلم ({counts.video})</span>
                </button>
              )}
            </div>

            {/* AI Evidence Intelligence Accordion Button */}
            <button
              type="button"
              onClick={() => setShowAiAnalysis(!showAiAnalysis)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                showAiAnalysis
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                  : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>تحلیل هوشمند مدارک و OCR</span>
              {showAiAnalysis ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* AI Evidence Intelligence Panel (Collapsible) */}
          {showAiAnalysis && (
            <div className="pt-1 pb-2 animate-in fade-in duration-150">
              <EvidenceIntelligenceCard
                claimId={claim.id}
                aiResult={aiResult}
                isLoading={isAiLoading}
                userRole="ASSESSOR"
                onRefresh={onRefreshAi}
              />
            </div>
          )}

          {/* 3. CLEAN COMPACT DOCUMENTS GRID */}
          {filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDocs.map((item) => {
                const isAudio = item.type === 'audio';
                const isKroki = item.type === 'kroki';
                const isVideo = item.type === 'video';
                const isPlaying = playingAudioId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-purple-300 rounded-xl transition-all shadow-2xs space-y-3 flex flex-col justify-between group"
                  >
                    {/* Item Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isAudio
                              ? 'bg-emerald-100 text-emerald-700'
                              : isKroki
                              ? 'bg-amber-100 text-amber-800'
                              : isVideo
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {isAudio ? (
                            <Mic className="w-3.5 h-3.5" />
                          ) : isKroki ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : isVideo ? (
                            <Film className="w-3.5 h-3.5" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-slate-900 text-xs truncate" title={item.title}>
                            {item.title}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-medium block truncate">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Uploader Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0 border ${
                          item.uploaderParty === 'PARTY_ONE'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : item.uploaderParty === 'POLICE'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-orange-50 text-orange-800 border-orange-200'
                        }`}
                      >
                        {item.uploaderRole}
                      </span>
                    </div>

                    {/* Thumbnail / Media Action Area */}
                    <div className="relative rounded-lg overflow-hidden bg-slate-200/60 border border-slate-200 aspect-16/9 flex items-center justify-center">
                      {isAudio ? (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-950 to-slate-900 p-3 flex flex-col justify-between text-white">
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                            <span className="flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>فایل صوتی</span>
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400">MP3 / 0:45</span>
                          </div>

                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => toggleAudioPlay(item.id, e)}
                              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md transition-transform active:scale-95 cursor-pointer"
                            >
                              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                            </button>
                          </div>

                          {isPlaying ? (
                            <audio src={item.url} autoPlay controls className="w-full h-6 rounded mt-1" />
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-300">
                              <span>برای پخش کلیک کنید</span>
                            </div>
                          )}
                        </div>
                      ) : isVideo ? (
                        <div
                          onClick={() => handleOpenPreview(item)}
                          className="w-full h-full bg-slate-900 relative cursor-pointer group/video flex items-center justify-center"
                        >
                          <video src={item.url} className="w-full h-full object-cover opacity-70" />
                          <div className="absolute inset-0 bg-black/30 group-hover/video:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-md">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleOpenPreview(item)}
                          className="w-full h-full relative cursor-pointer group/img"
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>بزرگ‌نمایی</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Note if available */}
                    {item.note && (
                      <p className="text-[11px] text-slate-600 font-medium bg-white p-2 rounded-lg border border-slate-100 leading-relaxed truncate" title={item.note}>
                        «{item.note}»
                      </p>
                    )}

                    {/* Footer Info & Preview Trigger Button */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.uploadedAt}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>نمایش کامل</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
              <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-bold">فایلی در این دسته‌بندی یافت نشد.</p>
            </div>
          )}
        </div>
      )}

      {/* Local Fallback Preview Modal (if parent doesn't handle modal) */}
      {localPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm">{localPreviewModal.title}</h4>
              <button
                type="button"
                onClick={() => setLocalPreviewModal(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕ بستن
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-950">
              {localPreviewModal.type === 'audio' ? (
                <div className="p-6 bg-slate-900 text-white rounded-xl w-full text-center space-y-4">
                  <Mic className="w-10 h-10 text-emerald-400 mx-auto" />
                  <audio src={localPreviewModal.url} controls className="w-full" />
                </div>
              ) : localPreviewModal.type === 'video' ? (
                <video src={localPreviewModal.url} controls className="max-h-[70vh] rounded-lg" />
              ) : (
                <img src={localPreviewModal.url} alt={localPreviewModal.title} className="max-h-[70vh] object-contain rounded-lg" />
              )}
            </div>

            {localPreviewModal.note && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700">
                <span className="font-bold">یادداشت پیوست:</span> {localPreviewModal.note}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
