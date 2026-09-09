import React, { useState, useRef, useEffect } from 'react';
import {
  Siren,
  Search,
  Check,
  ChevronDown,
  X,
  Car,
  Truck,
  Layers,
  AlertTriangle,
  RotateCcw,
  Lock,
  Flame,
  CloudRain,
  Wrench,
  FileCheck
} from 'lucide-react';
import { AccidentTypeRule } from '../../lib/accidentRules';

interface SearchableAccidentTypeSelectProps {
  accidentTypes: AccidentTypeRule[];
  selectedKey: string;
  onSelectType: (type: AccidentTypeRule) => void;
  onClear?: () => void;
  hasError?: boolean;
}

const getAccidentIcon = (key: string) => {
  switch (key) {
    case 'TWO_VEHICLE':
      return <Car className="w-4 h-4 text-blue-600 shrink-0" />;
    case 'CHAIN':
      return <Layers className="w-4 h-4 text-indigo-600 shrink-0" />;
    case 'HEAVY_VEHICLE':
      return <Truck className="w-4 h-4 text-amber-600 shrink-0" />;
    case 'FIXED_OBJECT':
      return <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />;
    case 'PEDESTRIAN_MOTOR':
      return <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />;
    case 'ROLLOVER':
      return <RotateCcw className="w-4 h-4 text-purple-600 shrink-0" />;
    case 'THEFT':
      return <Lock className="w-4 h-4 text-red-600 shrink-0" />;
    case 'VANDALISM':
      return <Wrench className="w-4 h-4 text-slate-600 shrink-0" />;
    case 'FIRE_EXPLOSION':
      return <Flame className="w-4 h-4 text-orange-700 shrink-0" />;
    case 'NATURAL_DISASTER':
      return <CloudRain className="w-4 h-4 text-teal-600 shrink-0" />;
    default:
      return <Siren className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
};

export const SearchableAccidentTypeSelect: React.FC<SearchableAccidentTypeSelectProps> = ({
  accidentTypes,
  selectedKey,
  onSelectType,
  onClear,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedType = accidentTypes.find((t) => t.key === selectedKey);

  // Sync display text with selected item
  useEffect(() => {
    if (selectedType) {
      setQuery(selectedType.label);
    } else {
      setQuery('');
    }
  }, [selectedKey, selectedType]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedType) {
          setQuery(selectedType.label);
        } else {
          setQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedType]);

  const filteredTypes = accidentTypes.filter((t) => {
    if (!query.trim()) return true;
    if (selectedType && query.trim() === selectedType.label) return true;
    const term = query.trim().toLowerCase();
    return (
      t.label.toLowerCase().includes(term) ||
      t.hint.toLowerCase().includes(term) ||
      t.reportLabel.toLowerCase().includes(term)
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    inputRef.current?.select();
  };

  const handleSelect = (t: AccidentTypeRule) => {
    onSelectType(t);
    setQuery(t.label);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    if (onClear) onClear();
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        {/* Leading Icon */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {selectedType ? getAccidentIcon(selectedType.key) : <Search className="w-4 h-4 text-indigo-500" />}
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="جستجو و انتخاب نوع حادثه (مثلاً سرقت، زنجیره‌ای، جسم ثابت...)"
          className={`w-full h-11 sm:h-12 pr-10 pl-20 bg-white rounded-xl sm:rounded-2xl border-2 text-xs sm:text-sm font-bold text-slate-900 transition-all focus:outline-none shadow-2xs ${
            hasError
              ? 'border-rose-400 bg-rose-50/40 focus:border-rose-600 focus:bg-white'
              : isOpen
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-white'
              : 'border-indigo-200 hover:border-indigo-300 focus:border-indigo-600'
          }`}
          dir="rtl"
        />

        {/* Trailing Controls */}
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedKey && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              title="پاک کردن انتخاب"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="p-1 text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Selected Item Summary Pill below input (when closed or selected) */}
      {selectedType && (
        <div className="mt-2 p-2.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <FileCheck className="w-4 h-4 text-indigo-700 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] text-slate-600">مدرک رسمی الزامی برای این حادثه: </span>
              <strong className="text-indigo-950 font-black text-xs">{selectedType.reportLabel}</strong>
            </div>
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-2 py-0.5 rounded-md shrink-0 border border-indigo-200">
            {selectedType.supportsCroqui ? 'پوشش کروکی' : 'فاقد کروکی'}
          </span>
        </div>
      )}

      {/* Dropdown Options List */}
      {isOpen && (
        <div className="absolute z-50 right-0 left-0 mt-1.5 bg-white rounded-2xl border-2 border-indigo-200 shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95" dir="rtl">
          {filteredTypes.length > 0 ? (
            filteredTypes.map((t) => {
              const isSelected = selectedKey === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleSelect(t)}
                  className={`w-full text-right p-3 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/90 text-indigo-950 font-black'
                      : 'hover:bg-slate-50 text-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getAccidentIcon(t.key)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isSelected ? 'font-black text-indigo-950' : 'font-bold text-slate-900'}`}>
                          {t.label}
                        </span>
                        {!t.supportsCroqui && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded border border-amber-300">
                            گزارش ۱۱۰
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-500 font-normal truncate mt-0.5">
                        {t.hint}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                      {t.reportLabel}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              نوع حادثه‌ای با عنوان «{query}» یافت نشد.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
