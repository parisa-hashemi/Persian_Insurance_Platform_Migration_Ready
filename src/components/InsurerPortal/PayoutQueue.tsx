import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Building2, Upload, Send, AlertCircle, FileCheck } from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';
import { formatCurrency, getInsurerPersianName } from '../../lib/storage';

interface PayoutQueueProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updatedCase: ClaimCase) => void;
}

export const PayoutQueue: React.FC<PayoutQueueProps> = ({
  session,
  cases,
  onUpdateCase
}) => {
  const companyCode = session.company || 'dana';

  const payoutCases = cases.filter(
    (c) =>
      (c.culpritInsurer === companyCode ||
        c.victimInsurer === companyCode ||
        getInsurerPersianName(c.culpritInsurer) === getInsurerPersianName(companyCode) ||
        getInsurerPersianName(c.victimInsurer) === getInsurerPersianName(companyCode)) &&
      (c.status === 'در انتظار پرداخت' ||
        c.status === 'پرداخت شده' ||
        c.payoutState === 'READY' ||
        c.payoutState === 'SUBMITTED' ||
        c.payoutState === 'PAID')
  );

  const handleExecutePayout = (c: ClaimCase) => {
    const updated: ClaimCase = {
      ...c,
      status: 'پرداخت شده',
      payoutState: 'PAID',
      payoutInfo: {
        ...c.payoutInfo,
        beneficiary: c.payoutInfo?.beneficiary || c.victimName,
        nationalId: c.payoutInfo?.nationalId || '0012345678',
        iban: c.payoutInfo?.iban || 'IR820540102680020817909002',
        verification: 'VERIFIED',
        trackingRef: 'SIM-BANK-' + Math.floor(Math.random() * 900000 + 100000),
        paidDate: new Date().toLocaleDateString('fa-IR')
      },
      history: [
        ...(c.history || []),
        {
          status: 'پرداخت شده',
          time: new Date().toLocaleString('fa-IR'),
          user: session.name || 'پورتال بیمه‌گر',
          note: `واریز آنلاین خسارت به مبلغ ${formatCurrency(c.assessment?.payable)} انجام شد`
        }
      ]
    };
    onUpdateCase(updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold border border-emerald-200">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-blue-950">
              صف تسویه مالی و دستور واریز بانک
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              مدیریت واریز وجه خسارت به شماره شبای تاییدشده زیان‌دیدگان.
            </p>
          </div>
        </div>
      </div>

      {payoutCases.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-2">
          <CreditCard className="w-12 h-12 mx-auto text-slate-400" />
          <p className="text-xs font-bold">پرونده‌ای در صف واریز بانک قرار ندارد.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payoutCases.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4 hover:border-emerald-500 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <span className="font-extrabold text-blue-950 text-sm font-mono">{c.id}</span>
                  <span className="text-xs text-slate-600 font-medium block mt-0.5">
                    ذی‌نفع: {c.payoutInfo?.beneficiary || c.victimName} | تاریخ: {c.date}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 w-fit">
                  {c.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-1">کد ملی ذی‌نفع</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {c.payoutInfo?.nationalId || '0012345678'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 sm:col-span-2">
                  <span className="text-slate-500 font-bold block mb-1">شماره شبا (IBAN)</span>
                  <span className="font-bold text-slate-900 font-mono" dir="ltr">
                    {c.payoutInfo?.iban || 'IR820540102680020817909002'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs">
                <div>
                  <span className="text-slate-700 block mb-0.5 font-bold">مبلغ قابل واریز</span>
                  <span className="font-black text-emerald-800 text-base">
                    {formatCurrency(c.assessment?.payable || 17000000)}
                  </span>
                </div>

                {c.status === 'در انتظار پرداخت' ? (
                  <button
                    onClick={() => handleExecutePayout(c)}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    صدور و شبیه‌سازی واریز بانک
                  </button>
                ) : (
                  <span className="font-black text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    پرداخت شده ({c.payoutInfo?.trackingRef})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
