import React, { useState } from 'react';
import { ShieldPlus, Calculator, SearchCheck, CheckCircle2, ArrowLeft, Camera, Video, Mic } from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';
import { generateTrackingCode } from '../../lib/storage';

interface BodilyInsuranceModuleProps {
  session: UserSession;
  cases: ClaimCase[];
  onSubmitBodily: (newCase: ClaimCase) => void;
  onBack: () => void;
}

export const BodilyInsuranceModule: React.FC<BodilyInsuranceModuleProps> = ({
  session,
  cases,
  onSubmitBodily,
  onBack
}) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(session.name || 'مهدی کشاورز');
  const [phone, setPhone] = useState(session.phone || '09123456789');
  const [p1, setP1] = useState('۱۲');
  const [pLetter, setPLetter] = useState('ب');
  const [p2, setP2] = useState('۳۴۵۶۷');
  const [p3, setP3] = useState('۸۹');
  const [policyNo, setPolicyNo] = useState('BD-1402-9988');
  const [datetime, setDatetime] = useState('۱۴۰۳/۰۵/۲۱ ۱۶:۰۰');
  const [address, setAddress] = useState('تهران، خیابان ولیعصر، خیابان مطهری');
  const [description, setDescription] = useState('');

  const bodilyCases = cases.filter(
    (c) => c.isBodily && (c.victimPhone === session.phone || !session.phone)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trackingCode = 'BD-' + Math.floor(Math.random() * 9000 + 1000) + '-YZ';
    const plateStr = `${p1}-${pLetter}-${p2}-ایران-${p3}`;

    const newBodilyCase: ClaimCase = {
      id: trackingCode,
      isBodily: true,
      date: datetime,
      address: address,
      victimName: name,
      victimPhone: phone,
      victimPlate: plateStr,
      plate: plateStr,
      victimVin: 'IRBODILY9938210',
      victimInsurer: 'dana',
      culpritName: name,
      culpritPhone: phone,
      culpritPlate: plateStr,
      culpritInsurer: 'dana',
      carType: 'پژو ۲۰۶',
      culpritPolicyNo: policyNo,
      status: 'در انتظار ارجاع به ارزیاب',
      priority: 'normal',
      approved: true,
      writtenReport: description,
      createdAt: new Date().toISOString(),
      history: [
        {
          status: 'در انتظار ارجاع به ارزیاب',
          time: new Date().toLocaleString('fa-IR'),
          user: name,
          note: 'ثبت درخواست خودخدمت استعلام و ارزیابی بیمه بدنه خودرو'
        }
      ]
    };

    onSubmitBodily(newBodilyCase);
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 shadow-xs text-xs font-black transition-all flex items-center gap-1.5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-blue-900" />
          <span>بازگشت به داشبورد</span>
        </button>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black shadow-md border border-blue-950 flex items-center gap-2 transition-all active:scale-95"
          >
            <Calculator className="w-4 h-4" />
            استعلام و ثبت درخواست جدید بیمه بدنه
          </button>
        )}
      </div>

      {!showForm ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-900 border border-sky-300 flex items-center justify-center font-bold">
                <ShieldPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-blue-950">
                  ماژول خودخدمت خسارت بیمه بدنه
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  استعلام آنلاین، ارجاع مستقیم به شرکت بیمه‌گر بدنه خودتان و پیگیری مستقل از بیمه شخص ثالث.
                </p>
              </div>
            </div>
          </div>

          {/* List of Bodily Claims */}
          <div className="space-y-4">
            <h3 className="font-black text-blue-950 text-sm">
              درخواست‌های بیمه بدنه شما ({bodilyCases.length})
            </h3>

            {bodilyCases.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-2">
                <ShieldPlus className="w-12 h-12 mx-auto text-sky-600" />
                <p className="text-xs font-bold">
                  هنوز درخواستی برای استفاده از بیمه بدنه ثبت نکرده‌اید.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bodilyCases.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-900 flex items-center justify-center font-black text-xs border border-sky-300">
                        BD
                      </div>
                      <div>
                        <span className="font-black text-blue-950 text-sm font-mono">{c.id}</span>
                        <span className="text-xs text-slate-600 font-medium block mt-0.5">
                          پلاک: {c.plate} | تاریخ: {c.date}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 w-fit">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Form View */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in"
        >
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-blue-950">
              استعلام و ثبت درخواست خسارت بیمه بدنه
            </h2>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              اطلاعات، مستندات و موقعیت خودرو را وارد کنید تا به صورت مستقیم به شرکت بیمه‌گر بدنه ارجاع گردد.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">نام مالک</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">شماره موبایل</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-blue-900"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">
                شماره بیمه‌نامه بدنه
              </label>
              <input
                type="text"
                value={policyNo}
                onChange={(e) => setPolicyNo(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-blue-900"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">تاریخ و ساعت</label>
              <input
                type="text"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-xs font-bold focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-950 mb-1">توضیحات خسارت بدنه</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح دهید خسارت بدنه در چه شرایطی رخ داده است..."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-blue-900"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border-2 border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xs shadow-md border border-blue-950 flex items-center gap-2 active:scale-95"
            >
              <SearchCheck className="w-4 h-4" />
              استعلام و ثبت نهایی بدنه
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
