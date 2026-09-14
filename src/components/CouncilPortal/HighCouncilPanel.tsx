/**
 * ============================================================================
 * پنل شورای عالی کارشناسی
 * ============================================================================
 * شامل پنج بخش خواسته‌شده:
 *   ۱. کارتابل پرونده‌های ارجاعی (با تفکیک درجه فوریت)
 *   ۲. خط زمانی گرافیکی کامل پرونده
 *   ۳. مستندات و شواهد تخصصی (مقایسه بازدید اولیه و بازدید مجدد)
 *   ۴. رأی‌گیری اعضا + اجماع/اکثریت + صورت‌جلسه
 *   ۵. صدور رأی نهایی توسط رئیس شورا
 * به‌علاوه: دعوت به جلسه حضوری و ثبت صورت‌جلسه حضوری.
 * ============================================================================
 */

import React, { useMemo, useState } from 'react';
import {
  Gavel, Scale, Clock, FileText, Users, AlertTriangle, CheckCircle2,
  Landmark, Camera, ShieldCheck, Lock, Send, CalendarClock, MapPin,
  ClipboardCheck, Vote, ArrowLeft, Printer, UserCheck, Layers, XCircle
} from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';
import { notifyApp } from '../../lib/appNotify';
import { formatCurrency } from '../../lib/storage';
import { maskPhone } from '../../lib/contactPrivacy';
import {
  computeCouncilConsensus, recordCouncilVote, issueFinalVerdict,
  inviteToInPersonHearing, recordHearingMinutes, COUNCIL_LOCK_NOTICE,
  CouncilVote
} from '../../lib/objectionWorkflow';

interface HighCouncilPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updated: ClaimCase) => void;
}

const VOTE_OPTIONS: CouncilVote[] = [
  'تایید ارزیابی اولیه',
  'افزایش خسارت',
  'تعدیل مبالغ',
  'بازدید میدانی مجدد'
];

const urgencyStyle = (u?: string) => {
  if (!u || u === 'عادی') return 'bg-slate-100 text-slate-700 border-slate-300';
  if (u.includes('بحرانی')) return 'bg-rose-100 text-rose-900 border-rose-400 animate-pulse';
  return 'bg-amber-100 text-amber-900 border-amber-400';
};

export const HighCouncilPanel: React.FC<HighCouncilPanelProps> = ({ session, cases, onUpdateCase }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'timeline' | 'evidence' | 'voting' | 'verdict'>('timeline');

  // فرم‌ها
  const [voteChoice, setVoteChoice] = useState<CouncilVote>('تعدیل مبالغ');
  const [voteAmount, setVoteAmount] = useState('');
  const [voteNote, setVoteNote] = useState('');
  const [verdictText, setVerdictText] = useState('');
  const [verdictAmount, setVerdictAmount] = useState('');
  const [showHearing, setShowHearing] = useState(false);
  const [hDate, setHDate] = useState('۱۴۰۵/۰۷/۰۵');
  const [hTime, setHTime] = useState('۱۰:۰۰');
  const [hPlace, setHPlace] = useState('ساختمان مرکزی، اتاق جلسات طبقه ۵');
  const [hReason, setHReason] = useState('ارائه توضیحات تکمیلی درباره نحوه وقوع حادثه');
  const [minutesText, setMinutesText] = useState('');

  /** ۱. کارتابل: پرونده‌های ارجاعی به شورا، مرتب بر اساس فوریت */
  const inbox = useMemo(() => {
    const rank = (u?: string) => (u?.includes('بحرانی') ? 0 : u?.includes('فوری') ? 1 : 2);
    return cases
      .filter(c => Boolean(c.highCommitteeReview))
      .sort((a, b) => rank(a.councilUrgency) - rank(b.councilUrgency));
  }, [cases]);

  const activeCase = inbox.find(c => c.id === selectedId) || null;
  const review = activeCase?.highCommitteeReview;
  const consensus = useMemo(() => computeCouncilConsensus(review), [review]);

  const isChair = (session.roleTitle || '').includes('رئیس') || session.role === 'admin';
  const myMember = review?.members.find(m => m.name === session.name) || review?.members[0];

  /** ۲. خط زمانی: از تاریخچه پرونده ساخته می‌شود */
  const timeline = useMemo(() => {
    if (!activeCase) return [];
    const items = (activeCase.history || []).map(h => ({
      time: h.time, user: h.user, note: h.note, status: h.status
    }));
    return items;
  }, [activeCase]);

  /** ۳. شواهد: تفکیک بازدید اولیه از بازدید مجدد */
  const evidence = useMemo(() => {
    if (!activeCase) return { initial: [] as any[], reInspection: [] as any[] };
    const initial = [
      ...(activeCase.files || []).map((f: any) => ({ name: f.name, url: f.dataUrl || f.url })),
      ...(activeCase.additionalDocs || [])
        .filter((d: any) => !String(d.docType || '').includes('بازدید مجدد'))
        .map((d: any) => ({ name: d.title || d.docType, url: d.dataUrl || d.url }))
    ];
    const reInspection = (activeCase.reInspectionRequest?.report?.photos || [])
      .map((p: string, i: number) => ({ name: `بازدید مجدد ${i + 1}`, url: p }));
    return { initial, reInspection };
  }, [activeCase]);

  const handleVote = () => {
    if (!activeCase || !myMember) return;
    const updated = recordCouncilVote(
      activeCase, myMember.name, voteChoice, voteNote || undefined,
      voteAmount ? Number(voteAmount.replace(/\D/g, '')) : undefined
    );
    onUpdateCase(updated);
    setVoteNote(''); setVoteAmount('');
    notifyApp(`رأی شما («${voteChoice}») در صورت‌جلسه شورا ثبت شد.`);
  };

  const handleVerdict = () => {
    if (!activeCase) return;
    const amt = Number(verdictAmount.replace(/\D/g, ''));
    if (!verdictText.trim() || !amt) {
      notifyApp('متن رأی و مبلغ نهایی الزامی است.');
      return;
    }
    onUpdateCase(issueFinalVerdict(activeCase, {
      verdict: verdictText.trim(), finalAmount: amt, issuedBy: session.name || 'رئیس شورا'
    }));
    setVerdictText(''); setVerdictAmount('');
    notifyApp('رأی قطعی شورای عالی صادر و در پرونده ثبت شد. این رأی غیرقابل تغییر است.');
  };

  const handleInvite = () => {
    if (!activeCase) return;
    onUpdateCase(inviteToInPersonHearing(activeCase, {
      date: hDate, time: hTime, location: hPlace, reason: hReason,
      invitedBy: session.name || 'شورای عالی'
    }));
    setShowHearing(false);
    notifyApp('دعوت‌نامه حضوری ثبت و پیامک رسمی برای بیمه‌گذار ارسال شد.');
  };

  const handleMinutes = (attended: boolean) => {
    if (!activeCase || !minutesText.trim()) {
      notifyApp('متن صورت‌جلسه را وارد کنید.');
      return;
    }
    onUpdateCase(recordHearingMinutes(activeCase, {
      minutes: minutesText.trim(), recordedBy: session.name || 'شورای عالی', attended
    }));
    setMinutesText('');
    notifyApp('صورت‌جلسه حضوری در پرونده ثبت شد.');
  };

  /** صورت‌جلسه چاپی (PDF از طریق پنجره چاپ مرورگر) */
  const printMinutes = () => {
    if (!activeCase || !review) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const rows = review.members.map(m =>
      `<tr><td>${m.name}</td><td>${m.title}</td><td>${m.vote || '—'}</td><td>${(m as any).proposedAmount ? Number((m as any).proposedAmount).toLocaleString('fa-IR') + ' ریال' : '—'}</td><td>${m.notes || '—'}</td></tr>`
    ).join('');
    w.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
      <title>صورت‌جلسه شورای عالی — ${activeCase.id}</title>
      <style>body{font-family:Tahoma,sans-serif;padding:32px;color:#0f172a}
      h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
      th,td{border:1px solid #cbd5e1;padding:8px;text-align:right}th{background:#f1f5f9}
      .box{border:2px solid #1e3a8a;border-radius:8px;padding:12px;margin-top:16px;font-size:13px}
      .sig{margin-top:32px;display:flex;gap:24px;flex-wrap:wrap}
      .sig div{border-top:1px solid #94a3b8;padding-top:6px;min-width:180px;font-size:12px}</style></head><body>
      <h1>صورت‌جلسه شورای عالی کارشناسی — پرونده ${activeCase.id}</h1>
      <p>کد صورت‌جلسه: ${review.id} | تاریخ ارجاع: ${review.referredAt}</p>
      <p>علت ارجاع: ${review.reason}</p>
      <table><thead><tr><th>عضو شورا</th><th>سمت</th><th>رأی</th><th>مبلغ پیشنهادی</th><th>توضیح</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="box"><strong>رأی اکثریت:</strong> ${consensus.majorityVote || 'در انتظار تکمیل آراء'}
      (${consensus.majorityCount} از ${consensus.totalMembers})<br/>
      <strong>میانگین مبالغ پیشنهادی:</strong> ${consensus.averageProposedAmount ? consensus.averageProposedAmount.toLocaleString('fa-IR') + ' ریال' : '—'}<br/>
      <strong>رأی قطعی:</strong> ${review.finalVerdict || 'صادر نشده'} ${review.finalAmount ? '— ' + review.finalAmount.toLocaleString('fa-IR') + ' ریال' : ''}</div>
      <div class="sig">${review.members.map(m => `<div>امضای الکترونیک: ${m.name}</div>`).join('')}</div>
      </body></html>`);
    w.document.close();
    w.print();
  };

  /* ===================== کارتابل ===================== */
  if (!activeCase) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in" dir="rtl">
        <div className="bg-gradient-to-r from-indigo-700 via-slate-900 to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-md shrink-0">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black flex items-center gap-2 flex-wrap">
                <span>شورای عالی کارشناسی</span>
                <span className="text-xs font-bold px-3 py-1 bg-amber-400 text-slate-900 rounded-xl">
                  {session.name} ({session.roleTitle || 'عضو شورا'})
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                رسیدگی نهایی به پرونده‌های دارای بن‌بست در اعتراض یا مبالغ کلان. رأی این شورا فصل‌الخطاب و غیرقابل تغییر است.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Landmark className="w-4.5 h-4.5 text-indigo-700" />
              کارتابل پرونده‌های ارجاعی به شورا ({inbox.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-bold">مرتب‌شده بر اساس درجه فوریت</span>
          </div>

          {inbox.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Scale className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-500">در حال حاضر پرونده‌ای به شورا ارجاع نشده است.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inbox.map(c => {
                const cons = computeCouncilConsensus(c.highCommitteeReview);
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedId(c.id); setTab('timeline'); }}
                    className="w-full text-right p-4 hover:bg-indigo-50/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-indigo-900 text-xs">{c.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${urgencyStyle(c.councilUrgency)}`}>
                          {c.councilUrgency || 'عادی'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                          {c.highCommitteeReview?.status}
                        </span>
                        {c.isLockedForExperts && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white flex items-center gap-1">
                            <Lock className="w-3 h-3" /> قفل‌شده
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 font-bold flex items-center gap-3 flex-wrap">
                        <span>زیان‌دیده: {c.victimName}</span>
                        <span className="text-slate-300">|</span>
                        <span>برآورد جاری: {formatCurrency(c.assessment?.payable || 0)}</span>
                        <span className="text-slate-300">|</span>
                        <span>آراء ثبت‌شده: {cons.votedCount} از {cons.totalMembers}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                        علت ارجاع: {c.highCommitteeReview?.reason}
                      </p>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-300 group-hover:text-indigo-700 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ===================== نمای پرونده ===================== */
  return (
    <div className="space-y-5 pb-12 animate-in fade-in" dir="rtl">
      {/* سربرگ پرونده */}
      <div className="bg-white border-2 border-indigo-200 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSelectedId(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" /> بازگشت به کارتابل
            </button>
            <h2 className="font-black text-slate-900 text-sm">پرونده {activeCase.id}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${urgencyStyle(activeCase.councilUrgency)}`}>
              {activeCase.councilUrgency || 'عادی'}
            </span>
          </div>
          <button
            onClick={printMinutes}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> صورت‌جلسه شورا (PDF)
          </button>
        </div>

        <div className="p-3 bg-slate-900 text-white rounded-2xl text-[11px] font-bold flex items-start gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{COUNCIL_LOCK_NOTICE}</span>
        </div>

        {/* تب‌ها */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {([
            ['timeline', 'خط زمانی پرونده', Clock],
            ['evidence', 'مستندات و شواهد', Camera],
            ['voting', 'رأی‌گیری اعضا', Vote],
            ['verdict', 'رأی نهایی و جلسه حضوری', Gavel]
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                tab === k ? 'bg-indigo-700 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ۲. خط زمانی */}
      {tab === 'timeline' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-indigo-700" /> مسیر کامل پرونده از ثبت تا ارجاع به شورا
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              ['تاریخ ثبت حادثه', activeCase.date || '—'],
              ['برآورد کارشناس اولیه', formatCurrency(activeCase.assessments?.[0]?.payable || activeCase.assessment?.payable || 0)],
              ['مرحله اعتراض', String(activeCase.objectionStage || 0)],
              ['تاریخ ارجاع به شورا', review?.referredAt || '—']
            ].map(([label, val]) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">{label}</span>
                <span className="font-black text-slate-900 text-[12px] font-mono">{val}</span>
              </div>
            ))}
          </div>

          {activeCase.reassessReason && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-1">
              <span className="font-black text-amber-900 block">اعتراض ثبت‌شده مشتری:</span>
              <p className="text-amber-950 font-medium leading-relaxed">«{activeCase.reassessReason}»</p>
              {activeCase.objectionFiledBy && (
                <p className="text-[11px] text-amber-800 font-bold pt-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  {activeCase.objectionFiledBy.name} ({activeCase.objectionFiledBy.role})
                  {activeCase.objectionFiledBy.nationalId && ` — کد ملی ${activeCase.objectionFiledBy.nationalId}`}
                </p>
              )}
            </div>
          )}

          {/* خط زمانی گرافیکی */}
          <div className="relative pr-5">
            <div className="absolute right-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-400 via-slate-300 to-slate-200" />
            <div className="space-y-3">
              {timeline.map((t, i) => (
                <div key={i} className="relative">
                  <div className="absolute right-[-15px] top-2 w-3 h-3 rounded-full bg-white border-2 border-indigo-500" />
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-[11px]">{t.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{t.time}</span>
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed text-[11px]">{t.note}</p>
                    <span className="text-[10px] text-slate-500 font-bold">ثبت توسط: {t.user}</span>
                  </div>
                </div>
              ))}
              {timeline.length === 0 && (
                <p className="text-xs text-slate-400 font-bold py-6 text-center">تاریخچه‌ای ثبت نشده است.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ۳. شواهد */}
      {tab === 'evidence' && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-indigo-700" /> مقایسه شواهد بازدید اولیه و بازدید مجدد
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {([
              ['بازدید اولیه', evidence.initial, 'sky'],
              ['بازدید مجدد (پس از دمونتاژ)', evidence.reInspection, 'emerald']
            ] as const).map(([title, list, tone]) => (
              <div key={title} className={`border-2 rounded-2xl p-4 space-y-3 ${tone === 'sky' ? 'border-sky-200 bg-sky-50/40' : 'border-emerald-200 bg-emerald-50/40'}`}>
                <span className={`font-black text-xs ${tone === 'sky' ? 'text-sky-900' : 'text-emerald-900'}`}>
                  {title} ({list.length})
                </span>
                {list.length === 0 ? (
                  <p className="text-[11px] text-slate-500 font-bold py-4 text-center">مدرکی ثبت نشده است.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {list.map((f: any, i: number) => (
                      <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="h-24 bg-slate-100 flex items-center justify-center">
                          {f.url ? (
                            <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 p-1.5 truncate">{f.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> کد کروکی پلیس
              </span>
              <span className="font-mono font-black text-slate-900">{activeCase.sceneReportCode || '—'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">تماس زیان‌دیده (ماسک‌شده)</span>
              <span className="font-mono font-black text-slate-900">{maskPhone(activeCase.victimPhone)}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">گزارش بازدید مجدد</span>
              <span className="font-black text-slate-900 text-[11px]">
                {activeCase.reInspectionRequest?.report?.expertNotes || 'ثبت‌نشده'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ۴. رأی‌گیری */}
      {tab === 'voting' && review && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-indigo-700" /> آراء اعضای شورا ({consensus.votedCount} از {consensus.totalMembers})
            </h3>

            <div className="space-y-2">
              {review.members.map(m => (
                <div key={m.name} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-900 block">{m.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{m.title}</span>
                    {m.notes && <p className="text-[11px] text-slate-600 font-medium pt-1">{m.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {(m as any).proposedAmount ? (
                      <span className="font-mono font-black text-slate-800 text-[11px]">
                        {formatCurrency((m as any).proposedAmount)}
                      </span>
                    ) : null}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                      m.vote ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-500 border-slate-300'
                    }`}>
                      {m.vote || 'در انتظار رأی'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* اجماع */}
            <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-700 font-bold block">رأی اکثریت</span>
                <span className="font-black text-indigo-950">{consensus.majorityVote || 'در انتظار'}</span>
                <span className="text-[10px] text-indigo-600 block">{consensus.majorityCount} از {consensus.totalMembers} رأی</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-700 font-bold block">میانگین مبالغ پیشنهادی</span>
                <span className="font-black text-indigo-950 font-mono">
                  {consensus.averageProposedAmount ? formatCurrency(consensus.averageProposedAmount) : '—'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-700 font-bold block">وضعیت اجماع</span>
                <span className={`font-black ${consensus.isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {consensus.isComplete ? 'کامل — آماده صدور رأی' : 'ناقص — در انتظار آراء'}
                </span>
              </div>
            </div>
          </div>

          {/* ثبت رأی من */}
          <div className="bg-white border-2 border-indigo-300 rounded-3xl p-5 space-y-3">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Vote className="w-4.5 h-4.5 text-indigo-700" /> ثبت رأی من ({myMember?.name})
            </h4>
            <div className="flex flex-wrap gap-2">
              {VOTE_OPTIONS.map(v => (
                <button
                  key={v}
                  onClick={() => setVoteChoice(v)}
                  className={`px-3.5 py-2 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                    voteChoice === v ? 'bg-indigo-700 text-white border-indigo-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={voteAmount}
                onChange={e => setVoteAmount(e.target.value)}
                placeholder="مبلغ مدنظر شما (ریال) — اختیاری"
                className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-xs font-bold font-mono"
                dir="ltr"
              />
              <input
                value={voteNote}
                onChange={e => setVoteNote(e.target.value)}
                placeholder="توضیح کارشناسی (اختیاری)"
                className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none text-xs font-bold"
              />
            </div>
            <button
              onClick={handleVote}
              className="w-full py-3 rounded-2xl bg-indigo-700 hover:bg-indigo-800 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> ثبت رأی در صورت‌جلسه
            </button>
          </div>
        </div>
      )}

      {/* ۵. رأی نهایی + جلسه حضوری */}
      {tab === 'verdict' && review && (
        <div className="space-y-4">
          {review.finalVerdict ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                <Gavel className="w-5 h-5" /> رأی قطعی صادر شد
              </div>
              <p className="text-emerald-950 font-medium leading-relaxed">{review.finalVerdict}</p>
              <div className="flex items-center gap-3 flex-wrap font-bold text-emerald-800 pt-1">
                <span>مبلغ نهایی: <span className="font-mono font-black">{formatCurrency(review.finalAmount || 0)}</span></span>
                <span className="text-emerald-300">|</span>
                <span>کد رأی: <span className="font-mono">{review.verdictCode}</span></span>
                <span className="text-emerald-300">|</span>
                <span>{review.verdictDate}</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-bold pt-1">این رأی فصل‌الخطاب و غیرقابل تغییر است.</p>
            </div>
          ) : (
            <div className="bg-white border-2 border-amber-300 rounded-3xl p-5 space-y-3">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Gavel className="w-4.5 h-4.5 text-amber-700" /> صدور رأی نهایی (رئیس شورا)
              </h4>
              {!consensus.isComplete && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  هنوز همه اعضا رأی نداده‌اند ({consensus.votedCount} از {consensus.totalMembers}).
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {[
                  ['تایید مبلغ درخواستی مشتری', activeCase.assessments?.[0]?.gross || 0],
                  ['تایید نظر کارشناس اولیه', activeCase.assessments?.[0]?.payable || activeCase.assessment?.payable || 0],
                  ['تعیین مبلغ سوم (میانگین آراء)', consensus.averageProposedAmount || 0]
                ].map(([label, amt]) => (
                  <button
                    key={String(label)}
                    onClick={() => { setVerdictText(String(label)); setVerdictAmount(String(amt)); }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black transition-all cursor-pointer"
                  >
                    {label} {Number(amt) > 0 && `(${Number(amt).toLocaleString('fa-IR')})`}
                  </button>
                ))}
              </div>
              <textarea
                value={verdictText}
                onChange={e => setVerdictText(e.target.value)}
                rows={3}
                placeholder="متن رأی قطعی شورا..."
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none text-xs font-bold resize-none"
              />
              <input
                value={verdictAmount}
                onChange={e => setVerdictAmount(e.target.value)}
                placeholder="مبلغ نهایی مصوب (ریال)"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:outline-none text-xs font-black font-mono"
                dir="ltr"
              />
              <button
                onClick={handleVerdict}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Gavel className="w-4 h-4" /> صدور رأی قطعی و غیرقابل تغییر
              </button>
            </div>
          )}

          {/* جلسه حضوری */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CalendarClock className="w-4.5 h-4.5 text-sky-700" /> دعوت به جلسه حضوری
              </h4>
              {!activeCase.councilHearing && (
                <button
                  onClick={() => setShowHearing(!showHearing)}
                  className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> درخواست حضور بیمه‌گذار / راننده
                </button>
              )}
            </div>

            {showHearing && !activeCase.councilHearing && (
              <div className="space-y-3 p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={hDate} onChange={e => setHDate(e.target.value)} placeholder="تاریخ جلسه"
                    className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-bold" />
                  <input value={hTime} onChange={e => setHTime(e.target.value)} placeholder="ساعت جلسه"
                    className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-bold" />
                </div>
                <input value={hPlace} onChange={e => setHPlace(e.target.value)} placeholder="محل جلسه"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-bold" />
                <input value={hReason} onChange={e => setHReason(e.target.value)} placeholder="علت دعوت"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-bold" />
                <button
                  onClick={handleInvite}
                  className="w-full py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> ثبت دعوت و ارسال پیامک رسمی
                </button>
              </div>
            )}

            {activeCase.councilHearing && (
              <div className="space-y-3">
                <div className="p-3.5 bg-sky-50 border border-sky-300 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap font-black text-sky-900">
                    <MapPin className="w-4 h-4" />
                    <span>{activeCase.councilHearing.date} ساعت {activeCase.councilHearing.time}</span>
                    <span className="text-sky-300">|</span>
                    <span>{activeCase.councilHearing.location}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                      activeCase.councilHearing.status === 'ATTENDED' ? 'bg-emerald-200 text-emerald-900'
                      : activeCase.councilHearing.status === 'NO_SHOW' ? 'bg-rose-200 text-rose-900'
                      : 'bg-amber-200 text-amber-900'}`}>
                      {activeCase.councilHearing.status === 'ATTENDED' ? 'حاضر شد'
                        : activeCase.councilHearing.status === 'NO_SHOW' ? 'حاضر نشد' : 'دعوت ارسال شد'}
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-800 font-medium bg-white/70 p-2 rounded-lg border border-sky-200 leading-relaxed">
                    {activeCase.councilHearing.smsText}
                  </p>
                  {activeCase.councilHearing.minutes && (
                    <p className="text-[11px] text-slate-700 font-bold pt-1">
                      صورت‌جلسه: {activeCase.councilHearing.minutes}
                    </p>
                  )}
                </div>

                {!activeCase.councilHearing.minutes && (
                  <div className="space-y-2">
                    <textarea
                      value={minutesText}
                      onChange={e => setMinutesText(e.target.value)}
                      rows={3}
                      placeholder="خلاصه اظهارات بیمه‌گذار در جلسه حضوری..."
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-sky-500 focus:outline-none text-xs font-bold resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMinutes(true)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> ثبت صورت‌جلسه (حاضر شد)
                      </button>
                      <button
                        onClick={() => handleMinutes(false)}
                        className="px-4 py-2.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-black text-[11px] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> عدم حضور
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
