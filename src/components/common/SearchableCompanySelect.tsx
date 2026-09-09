import React, { useState, useRef, useEffect } from 'react';
import { Building2, Check, ChevronDown, X } from 'lucide-react';
import { InsurerInfo } from '../../types';

interface SearchableCompanySelectProps {
  insurersList: InsurerInfo[];
  selectedCompanyCode: string;
  onSelectCompany: (companyCode: string) => void;
}

export const SearchableCompanySelect: React.FC<SearchableCompanySelectProps> = ({
  insurersList,
  selectedCompanyCode,
  onSelectCompany
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCompany = insurersList.find((c) => c.code === selectedCompanyCode);

  useEffect(() => {
    if (selectedCompany) {
      setQuery(selectedCompany.name);
    } else {
      setQuery('');
    }
  }, [selectedCompanyCode, selectedCompany]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedCompany) {
          setQuery(selectedCompany.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCompany]);

  const filteredCompanies = insurersList.filter((c) => {
    if (!query.trim()) return true;
    const term = query.trim().toLowerCase();
    if (selectedCompany && query.trim() === selectedCompany.name) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.province && c.province.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.adminName && c.adminName.toLowerCase().includes(term))
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

  const handleSelect = (comp: InsurerInfo) => {
    onSelectCompany(comp.code);
    setQuery(comp.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs text-slate-800 font-bold flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-900" />
          <span>انتخاب شرکت بیمه‌گر</span>
        </span>
        <span className="text-[11px] text-slate-500 font-normal">
          {insurersList.length} شرکت فعال
        </span>
      </label>

      <div className="relative">
        <div className="relative flex items-center">
          {/* Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Building2 className="w-4 h-4" />
          </div>

          {/* Direct Search Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="جستجو و انتخاب شرکت بیمه..."
            autoComplete="off"
            className={`w-full h-9 sm:h-10 md:h-12 pr-9 md:pr-10 pl-14 md:pl-16 py-1.5 md:py-2.5 bg-white border rounded-lg sm:rounded-xl md:rounded-2xl text-[11.5px] sm:text-xs md:text-sm font-medium text-slate-900 placeholder:text-[11px] sm:placeholder:text-xs md:placeholder:text-sm placeholder:text-slate-400 transition-all focus:outline-none ${
              isOpen
                ? 'border-blue-600 ring-2 ring-blue-100 shadow-2xs'
                : 'border-slate-300 hover:border-slate-400 shadow-2xs'
            }`}
          />

          {/* Action buttons on left (clear / chevron) */}
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
                title="پاک کردن"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isOpen) {
                  setIsOpen(false);
                } else {
                  inputRef.current?.focus();
                  setIsOpen(true);
                }
              }}
              className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Dropdown Floating Options List directly below */}
        {isOpen && (
          <div className="absolute z-50 top-full mt-1.5 right-0 left-0 bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-100 max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((comp) => {
                const isSelected = comp.code === selectedCompanyCode;
                return (
                  <button
                    key={comp.code}
                    type="button"
                    onClick={() => handleSelect(comp)}
                    className={`w-full p-2.5 rounded-xl text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'hover:bg-blue-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-900 border border-blue-200'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs truncate font-bold">{comp.name}</div>
                        {comp.province && (
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {comp.province} • {comp.city || 'مرکزی'}
                            {comp.adminName ? ` | مدیر: ${comp.adminName}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 font-medium">
                شرکت بیمه‌ای با عبارت «{query}» یافت نشد.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
