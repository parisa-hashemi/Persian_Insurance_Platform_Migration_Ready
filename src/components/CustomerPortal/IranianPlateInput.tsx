import React from 'react';

interface IranianPlateInputProps {
  p1: string; // 2 digits (e.g. 12)
  pLetter: string; // Letter (e.g. ب)
  p2: string; // 3 digits (e.g. 345)
  p3: string; // 2 digits city code (e.g. 11)
  onChangeP1: (val: string) => void;
  onChangePLetter: (val: string) => void;
  onChangeP2: (val: string) => void;
  onChangeP3: (val: string) => void;
  disabled?: boolean;
}

const PERSIAN_LETTERS = [
  'ب', 'ج', 'د', 'س', 'ص', 'ط', 'ق', 'ل', 'م', 'ن', 'و', 'هـ', 'ی', 'الف', 'ت', 'ع', 'ژ', 'پ', 'ث', 'ز', 'ش', 'ف', 'ک', 'گ'
];

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
  return (
    <div className="flex flex-col items-center gap-1.5 w-full">
      <div
        className="w-full max-w-[340px] h-14 bg-white border-[2.5px] border-slate-950 rounded-xl overflow-hidden shadow-sm flex items-stretch select-none transition-all focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-900"
        dir="ltr"
      >
        {/* Left: Blue Strip with Iran Flag & I.R. IRAN */}
        <div className="bg-[#003399] text-white flex flex-col items-center justify-between py-1 px-1.5 w-9 shrink-0 border-r-2 border-slate-950">
          {/* Flag SVG */}
          <div className="w-5 h-3 rounded-[1px] overflow-hidden flex flex-col border border-white/50 shadow-2xs mt-0.5">
            <div className="bg-[#239f40] h-1 w-full" />
            <div className="bg-white h-1 w-full flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-[#da0000]" />
            </div>
            <div className="bg-[#da0000] h-1 w-full" />
          </div>

          <div className="flex flex-col items-center leading-none text-[6.5px] font-black tracking-tight mb-0.5">
            <span>I.R.</span>
            <span>IRAN</span>
          </div>
        </div>

        {/* Middle Main Plate Section: 2 digits + Letter + 3 digits */}
        <div className="flex-1 flex items-center justify-evenly px-1.5 bg-white">
          {/* 2 Digits (e.g. 12) */}
          <input
            type="text"
            inputMode="numeric"
            value={p1}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9۰-۹]/g, '').slice(0, 2);
              onChangeP1(val);
            }}
            placeholder="۱۲"
            maxLength={2}
            className="w-10 sm:w-11 h-10 text-center text-xl sm:text-2xl font-black font-mono text-slate-950 bg-transparent focus:bg-sky-50 focus:outline-none rounded placeholder:text-slate-300"
            title="دو رقم اول پلاک"
          />

          {/* Letter Dropdown (e.g. ب) */}
          <select
            value={pLetter || 'ب'}
            disabled={disabled}
            onChange={(e) => onChangePLetter(e.target.value)}
            className="h-9 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black text-base sm:text-lg rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer text-center"
            title="حرف پلاک"
          >
            {PERSIAN_LETTERS.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>

          {/* 3 Digits (e.g. 345) */}
          <input
            type="text"
            inputMode="numeric"
            value={p2}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9۰-۹]/g, '').slice(0, 3);
              onChangeP2(val);
            }}
            placeholder="۳۴۵"
            maxLength={3}
            className="w-14 sm:w-16 h-10 text-center text-xl sm:text-2xl font-black font-mono text-slate-950 bg-transparent focus:bg-sky-50 focus:outline-none rounded placeholder:text-slate-300 tracking-wider"
            title="سه رقم پلاک"
          />
        </div>

        {/* Right Partitioned Box: "ایران" + 2 Digits City Code */}
        <div className="border-l-2 border-slate-950 bg-slate-50 flex flex-col items-center justify-center px-1 py-0.5 w-12 sm:w-14 shrink-0">
          <span className="text-[9.5px] font-black text-slate-800 leading-none">ایران</span>
          <input
            type="text"
            inputMode="numeric"
            value={p3}
            disabled={disabled}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9۰-۹]/g, '').slice(0, 2);
              onChangeP3(val);
            }}
            placeholder="۱۱"
            maxLength={2}
            className="w-9 h-7 text-center text-base sm:text-lg font-black font-mono text-slate-950 bg-transparent focus:bg-sky-50 focus:outline-none rounded placeholder:text-slate-300"
            title="کد ایران (شهر/منطقه)"
          />
        </div>
      </div>
      <span className="text-[10px] text-slate-500 font-medium">
        فرمت پلاک ملی: ۱۲ ب ۳۴۵ ایران ۱۱
      </span>
    </div>
  );
};
