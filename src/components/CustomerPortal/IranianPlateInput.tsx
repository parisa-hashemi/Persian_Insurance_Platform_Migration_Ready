import React from 'react';

interface IranianPlateInputProps {
  p1: string; // دو رقم اول (مثلاً ۱۲)
  pLetter: string; // حرف (مثلاً ب)
  p2: string; // سه رقم (مثلاً ۳۴۵)
  p3: string; // کد شهر (مثلاً ۱۱)
  onChangeP1: (val: string) => void;
  onChangePLetter: (val: string) => void;
  onChangeP2: (val: string) => void;
  onChangeP3: (val: string) => void;
  disabled?: boolean;
}

const PERSIAN_LETTERS = [
  'ب', 'ج', 'د', 'س', 'ص', 'ط', 'ق', 'ل', 'م', 'ن', 'و', 'هـ', 'ی', 'الف', 'ت', 'ع', 'ژ', 'پ', 'ث', 'ز', 'ش', 'ف', 'ک', 'گ'
];

/** تبدیل ارقام لاتین به فارسی برای نمایش یکدست روی پلاک */
const toPersianDigits = (val: string) =>
  val.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const sanitizeDigits = (raw: string, max: number) =>
  toPersianDigits(raw.replace(/[^0-9۰-۹]/g, '')).slice(0, max);

/**
 * پلاک استاندارد ایران — بازطراحی دقیق:
 * نوار آبی پرچم | دو رقم | حرف | سه رقم | باکس «ایران» + کد شهر
 * همه بخش‌ها هم‌ارتفاع، هم‌خط و با نسبت‌های واقعی پلاک ملی.
 */
export const IranianPlateInput: React.FC<IranianPlateInputProps> = ({
  p1,
  pLetter,
  p2,
  p3,
  onChangeP1,
  onChangePLetter,
  onChangeP2,
  onChangeP3,
  disabled = false
}) => {
  const cellBase =
    'h-full w-full bg-transparent text-center font-black text-slate-950 focus:outline-none focus:bg-sky-100/70 placeholder:text-slate-300 disabled:opacity-60';

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <div
        className="relative w-full max-w-[390px] h-[52px] sm:h-[62px] bg-gradient-to-b from-white to-slate-50 border-2 border-slate-950 rounded-xl overflow-hidden shadow-xs flex items-stretch select-none transition-shadow focus-within:shadow-[0_0_0_2px_rgba(37,99,235,0.4)]"
        dir="ltr"
      >
        {/* پیچ‌های پلاک */}
        <span className="absolute top-[4px] left-1/2 -translate-x-14 w-1.5 h-1.5 rounded-full bg-slate-300 border border-slate-400 pointer-events-none" />
        <span className="absolute top-[4px] left-1/2 translate-x-12 w-1.5 h-1.5 rounded-full bg-slate-300 border border-slate-400 pointer-events-none" />

        {/* نوار آبی: پرچم + I.R. IRAN */}
        <div className="bg-[#003399] text-white flex flex-col items-center justify-between py-1 px-1 w-9 sm:w-11 shrink-0">
          <div className="w-5 h-3.5 rounded-[1px] overflow-hidden flex flex-col border border-white/60 shadow-2xs">
            <div className="bg-[#239f40] flex-1 w-full" />
            <div className="bg-white flex-1 w-full flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#da0000]" />
            </div>
            <div className="bg-[#da0000] flex-1 w-full" />
          </div>
          <div className="flex flex-col items-center leading-[1.1] text-[6px] sm:text-[7px] font-black tracking-tight">
            <span>I.R.</span>
            <span>IRAN</span>
          </div>
        </div>

        {/* دو رقم اول */}
        <div className="flex-[2] min-w-0 border-l-2 border-transparent">
          <input
            type="text"
            inputMode="numeric"
            value={toPersianDigits(p1)}
            disabled={disabled}
            onChange={(e) => onChangeP1(sanitizeDigits(e.target.value, 2))}
            placeholder="۱۲"
            maxLength={2}
            className={`${cellBase} text-[20px] sm:text-[25px] tracking-[0.12em]`}
            title="دو رقم اول پلاک"
          />
        </div>

        {/* حرف — کاملاً هم‌شکل با بقیه پلاک */}
        <div className="flex-[1.5] min-w-0 relative">
          <select
            value={pLetter || 'ب'}
            disabled={disabled}
            onChange={(e) => onChangePLetter(e.target.value)}
            className={`${cellBase} appearance-none cursor-pointer text-[18px] sm:text-[23px] pt-0.5`}
            title="حرف پلاک (برای تغییر کلیک کنید)"
          >
            {PERSIAN_LETTERS.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>
          {/* نشانگر ظریف قابل‌کلیک بودن حرف */}
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-[2px] rounded-full bg-blue-500/60 pointer-events-none" />
        </div>

        {/* سه رقم */}
        <div className="flex-[3] min-w-0">
          <input
            type="text"
            inputMode="numeric"
            value={toPersianDigits(p2)}
            disabled={disabled}
            onChange={(e) => onChangeP2(sanitizeDigits(e.target.value, 3))}
            placeholder="۳۴۵"
            maxLength={3}
            className={`${cellBase} text-[20px] sm:text-[25px] tracking-[0.14em]`}
            title="سه رقم پلاک"
          />
        </div>

        {/* باکس «ایران» + کد شهر */}
        <div className="border-l-2 border-slate-950 bg-white flex flex-col items-stretch w-[62px] sm:w-[74px] shrink-0">
          <span className="text-[9px] sm:text-[10px] font-black text-slate-900 leading-none text-center pt-1 pb-0">
            ایران
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={toPersianDigits(p3)}
            disabled={disabled}
            onChange={(e) => onChangeP3(sanitizeDigits(e.target.value, 2))}
            placeholder="۱۱"
            maxLength={2}
            className="flex-1 w-full bg-transparent text-center font-black text-slate-950 text-[19px] sm:text-[23px] leading-none focus:outline-none focus:bg-sky-100/70 placeholder:text-slate-300 disabled:opacity-60"
            title="کد ایران (شهر/منطقه)"
          />
        </div>
      </div>

      <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
        نمونه: ۱۲ ب ۳۴۵ — ایران ۱۱ • برای تغییر حرف، روی آن کلیک کنید
      </span>
    </div>
  );
};
