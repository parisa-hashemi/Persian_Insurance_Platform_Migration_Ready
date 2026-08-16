import React, { useState } from 'react';
import { Search, Shield, Clock, MapPin, CheckCircle2, AlertCircle, X, ChevronRight, FileText } from 'lucide-react';
import { ClaimCase } from '../types';
import { formatCurrency } from '../lib/storage';

interface PublicTrackerProps {
  cases: ClaimCase[];
  onClose?: () => void;
  onOpenCaseDetail?: (caseId: string) => void;
}

export const PublicTracker: React.FC<PublicTrackerProps> = ({
  cases,
  onClose,
  onOpenCaseDetail
}) => {
  const [trackingCode, setTrackingCode] = useState('');
  const [phone, setPhone] = useState('');
  const [searched, setSearched] = useState(false);
  const [resultCase, setResultCase] = useState<ClaimCase | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const codeClean = trackingCode.trim().toUpperCase();
    const phoneClean = phone.trim();

    const found = cases.find(
      (c) =>
        c.id.toUpperCase() === codeClean &&
        (c.victimPhone === phoneClean || c.culpritPhone === phoneClean || !phoneClean)
    );

    setResultCase(found || null);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute left-6 top-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow-lg">
            <Search className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">پیگیری عمومی پرونده خسارت</h2>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              کد رهگیری و شماره موبایل ثبت‌شده در پرونده را وارد کنید
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 md:p-8 space-y-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                کد رهگیری پرونده <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="مثال: CF-8382-YZ"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm font-mono tracking-wider focus:outline-none focus:border-blue-900 transition-all uppercase font-bold"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                شماره موبایل ثبت‌شده <span className="text-slate-500 font-medium">(اختیاری)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09123456789"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-sm font-mono tracking-wider focus:outline-none focus:border-blue-900 transition-all font-bold"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 border border-blue-950"
          >
            <Search className="w-5 h-5 stroke-[2.5]" />
            جستجو و استعلام وضعیت
          </button>
        </form>

        {/* Results Box */}
        {searched && (
          <div className="pt-4 border-t border-slate-200 animate-in fade-in">
            {resultCase ? (
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-blue-200">
                  <div>
                    <span className="text-xs text-slate-500 font-medium block">کد رهگیری</span>
                    <span className="text-lg font-black text-blue-950 font-mono">
                      {resultCase.id}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300">
                    {resultCase.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1 font-medium">تاریخ حادثه</span>
                    <span className="font-bold text-slate-900">{resultCase.date}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1 font-medium">خودرو زیان‌دیده</span>
                    <span className="font-bold text-slate-900">{resultCase.carType}</span>
                  </div>
                </div>

                {resultCase.address && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-500 block mb-1 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-blue-900" />
                      محل وقوع حادثه
                    </span>
                    <span className="font-bold text-slate-800">{resultCase.address}</span>
                  </div>
                )}

                {/* Timeline History */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-blue-950 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-900" />
                    تاریخچه گذر وضعیت پرونده:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(resultCase.history || []).map((h, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{h.status}</p>
                          <p className="text-slate-600 mt-0.5 font-medium">{h.note}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 font-bold">
                          {h.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {onOpenCaseDetail && (
                  <button
                    onClick={() => {
                      if (onClose) onClose();
                      onOpenCaseDetail(resultCase.id);
                    }}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <FileText className="w-4 h-4" />
                    ورود به صفحه کامل جزئیات پرونده
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-6 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
                <p className="font-bold text-sm text-rose-950">پرونده‌ای با این مشخصات یافت نشد</p>
                <p className="text-xs text-rose-700 leading-relaxed font-medium">
                  لطفاً کد رهگیری (مانند CF-8382-YZ) و شماره موبایل را بررسی کرده و مجدداً تلاش فرمایید.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
