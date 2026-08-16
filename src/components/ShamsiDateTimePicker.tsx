import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Check, ChevronDown } from 'lucide-react';

interface ShamsiDateTimePickerProps {
  value: string; // Formatted date string e.g. "۱۴۰۳/۰۵/۲۱ - ۱۴:۳۰"
  onChange: (newValue: string) => void;
}

const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

const PERSIAN_YEARS = [1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408];

// Helper to convert English digits to Persian
export function toFaDigits(str: string | number): string {
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => fa[parseInt(w, 10)]);
}

// Convert Gregorian date to Jalali (Shamsi) fallback
export function gregorianToJalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100))
    + (Math.floor((gy2 + 399) / 400)) + 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

// Robust helper to get accurate Jalali date parts using Intl DateTimeFormat
export function getJalaliDateParts(d: Date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(d);
    let jy = 1405, jm = 5, jd = 18, h = d.getHours(), min = d.getMinutes();
    for (const p of parts) {
      if (p.type === 'year') jy = parseInt(p.value, 10);
      if (p.type === 'month') jm = parseInt(p.value, 10);
      if (p.type === 'day') jd = parseInt(p.value, 10);
      if (p.type === 'hour') h = parseInt(p.value, 10);
      if (p.type === 'minute') min = parseInt(p.value, 10);
    }
    return { jy, jm, jd, hour: String(h).padStart(2, '0'), minute: String(min).padStart(2, '0') };
  } catch {
    const j = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return {
      jy: j.jy,
      jm: j.jm,
      jd: j.jd,
      hour: String(d.getHours()).padStart(2, '0'),
      minute: String(d.getMinutes()).padStart(2, '0')
    };
  }
}

export const ShamsiDateTimePicker: React.FC<ShamsiDateTimePickerProps> = ({
  value,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Initialize state with current Shamsi date
  const jalaliNow = getJalaliDateParts(new Date());

  const [year, setYear] = useState<number>(jalaliNow.jy);
  const [month, setMonth] = useState<number>(jalaliNow.jm); // 1-indexed (1-12)
  const [day, setDay] = useState<number>(jalaliNow.jd);
  const [hour, setHour] = useState<string>(jalaliNow.hour);
  const [minute, setMinute] = useState<string>(jalaliNow.minute);

  // Calculate max days for selected month
  const getMaxDays = (m: number) => {
    if (m <= 6) return 31;
    if (m <= 11) return 30;
    return 29;
  };

  const updateFormattedValue = (
    y: number,
    m: number,
    d: number,
    h: string,
    min: string
  ) => {
    const formattedMonth = String(m).padStart(2, '0');
    const formattedDay = String(d).padStart(2, '0');
    const str = `${toFaDigits(y)}/${toFaDigits(formattedMonth)}/${toFaDigits(formattedDay)} - ساعت ${toFaDigits(h)}:${toFaDigits(min)}`;
    onChange(str);
  };

  const handleSelectDay = (d: number) => {
    setDay(d);
    updateFormattedValue(year, month, d, hour, minute);
  };

  const handleMonthChange = (m: number) => {
    setMonth(m);
    const maxD = getMaxDays(m);
    const newDay = day > maxD ? maxD : day;
    setDay(newDay);
    updateFormattedValue(year, m, newDay, hour, minute);
  };

  const handleYearChange = (y: number) => {
    setYear(y);
    updateFormattedValue(y, month, day, hour, minute);
  };

  const handleHourChange = (h: string) => {
    setHour(h);
    updateFormattedValue(year, month, day, h, minute);
  };

  const handleMinuteChange = (m: string) => {
    setMinute(m);
    updateFormattedValue(year, month, day, hour, m);
  };

  // Preset Handlers
  const handleSetTodayNow = () => {
    const parts = getJalaliDateParts(new Date());
    setYear(parts.jy);
    setMonth(parts.jm);
    setDay(parts.jd);
    setHour(parts.hour);
    setMinute(parts.minute);
    updateFormattedValue(parts.jy, parts.jm, parts.jd, parts.hour, parts.minute);
  };

  const handleSetYesterday = () => {
    const n = new Date();
    n.setDate(n.getDate() - 1);
    const parts = getJalaliDateParts(n);
    setYear(parts.jy);
    setMonth(parts.jm);
    setDay(parts.jd);
    updateFormattedValue(parts.jy, parts.jm, parts.jd, hour, minute);
  };

  const maxDays = getMaxDays(month);
  const daysArray = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className="space-y-2 relative" dir="rtl">
      {/* Selected Value Bar / Trigger - Clean Light Indigo Theme */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 bg-white border-2 border-indigo-200 hover:border-indigo-400 p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-xs hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-indigo-600/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block font-bold">تاریخ و ساعت انتخاب شده:</span>
              <span className="font-extrabold text-sm text-indigo-950 font-mono">{value || 'انتخاب نشده'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white border border-indigo-200 transition-all">
            <span>{isOpen ? 'بستن تقویم' : 'تغییر تاریخ و ساعت'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Quick Today Button */}
        <button
          type="button"
          onClick={handleSetTodayNow}
          className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm shadow-indigo-600/20 active:scale-95"
          title="تنظیم خودکار روی زمان فعلی"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>هم‌اکنون</span>
        </button>
      </div>

      {/* POPUP / INLINE CALENDAR & TIME SELECTOR - Light Theme */}
      {isOpen && (
        <div className="bg-white border-2 border-indigo-200 rounded-3xl p-5 shadow-xl space-y-5 animate-in fade-in slide-in-from-top-2 z-30">
          
          {/* Header & Quick Presets */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-extrabold text-slate-900">انتخاب تاریخ و ساعت شمسی</h4>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSetTodayNow}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
              >
                امروز
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-200 transition-colors"
              >
                دیروز
              </button>
            </div>
          </div>

          {/* Year & Month Dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">ماه شمسی</label>
              <select
                value={month}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                {PERSIAN_MONTHS.map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {mName} ({toFaDigits(idx + 1)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">سال شمسی</label>
              <select
                value={year}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono"
              >
                {PERSIAN_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {toFaDigits(y)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* DAYS GRID CALENDAR */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-2">
              روز ({PERSIAN_MONTHS[month - 1]}):
            </label>
            <div className="grid grid-cols-7 gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
              {daysArray.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center font-mono ${
                    day === d
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black scale-105 border border-indigo-500'
                      : 'bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {toFaDigits(d)}
                </button>
              ))}
            </div>
          </div>

          {/* TIME SELECTOR (Hour & Minute) */}
          <div className="bg-indigo-50/60 border border-indigo-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>تنظیم ساعت دقیق وقوع حادثه:</span>
            </div>

            <div className="flex items-center justify-center gap-3" dir="rtl">
              {/* Minute Dropdown (RTL -> renders on RIGHT) */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold mb-1">دقیقه</span>
                <select
                  value={minute}
                  onChange={(e) => handleMinuteChange(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-indigo-900 font-mono focus:outline-none focus:border-indigo-600"
                >
                  {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                    <option key={m} value={m}>
                      {toFaDigits(m)}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xl font-black text-indigo-400 mt-4">:</span>

              {/* Hour Dropdown (RTL -> renders on LEFT) */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold mb-1">ساعت</span>
                <select
                  value={hour}
                  onChange={(e) => handleHourChange(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-indigo-900 font-mono focus:outline-none focus:border-indigo-600"
                >
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                    <option key={h} value={h}>
                      {toFaDigits(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* CLOSE & CONFIRM BUTTON */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>تایید تاریخ و ساعت</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
