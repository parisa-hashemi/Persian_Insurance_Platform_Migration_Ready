import React, { useState, useRef, useEffect } from 'react';
import { Building2, Search, Check, ChevronDown, X } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedCompany =
    insurersList.find((c) => c.code === selectedCompanyCode) || insurersList[0];

  const filteredCompanies = insurersList.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.province && c.province.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.adminName && c.adminName.toLowerCase().includes(term))
    );
  });

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
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl text-right transition-all flex items-center justify-between gap-2 shadow-sm ${
            isOpen
              ? 'border-blue-900 ring-4 ring-blue-50'
              : 'border-slate-300 hover:border-blue-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate">
                {selectedCompany?.name || 'انتخاب شرکت بیمه'}
              </span>
              {selectedCompany?.province && (
                <span className="text-[10px] text-slate-500 font-normal block truncate">
                  {selectedCompany.province} • {selectedCompany.city || 'مرکزی'}
                </span>
              )}
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              isOpen ? 'rotate-180 text-blue-900' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full mt-1.5 right-0 left-0 bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی نام شرکت بیمه یا شهر..."
                  className="w-full pr-9 pl-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 p-1">
              {filteredCompanies.map((comp) => {
                const isSelected = comp.code === selectedCompanyCode;
                return (
                  <button
                    key={comp.code}
                    type="button"
                    onClick={() => {
                      onSelectCompany(comp.code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full p-2 rounded-xl text-right transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-900 text-white font-bold shadow-sm'
                        : 'hover:bg-blue-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs truncate">{comp.name}</div>
                        {comp.adminName && (
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            مدیر: {comp.adminName}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
