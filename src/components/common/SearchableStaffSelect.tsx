import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Phone,
  Check,
  ChevronDown,
  UserPlus,
  X,
  Building2
} from 'lucide-react';
import { StaffMember } from '../../types';

interface SearchableStaffSelectProps {
  staffList: StaffMember[];
  selectedStaffId: string;
  selectedName: string;
  selectedPhone: string;
  isCustomEntry: boolean;
  companyName: string;
  roleTitle?: string;
  onSelectStaff: (staff: StaffMember) => void;
  onSelectCustom: () => void;
  onNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  accentColor?: string;
}

export const SearchableStaffSelect: React.FC<SearchableStaffSelectProps> = ({
  staffList,
  selectedStaffId,
  selectedName,
  selectedPhone,
  isCustomEntry,
  companyName,
  roleTitle,
  onSelectStaff,
  onSelectCustom,
  onNameChange,
  onPhoneChange,
  accentColor = 'blue'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  // Sync display text with selected staff or custom name
  useEffect(() => {
    if (isCustomEntry) {
      setQuery(selectedName || '');
    } else if (selectedStaff) {
      setQuery(selectedStaff.name);
    } else {
      setQuery('');
    }
  }, [selectedStaffId, selectedStaff, isCustomEntry, selectedName]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (isCustomEntry) {
          setQuery(selectedName || '');
        } else if (selectedStaff) {
          setQuery(selectedStaff.name);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedStaff, isCustomEntry, selectedName]);

  const filteredStaff = staffList.filter((s) => {
    if (!query.trim()) return true;
    const term = query.trim().toLowerCase();
    if (selectedStaff && !isCustomEntry && query.trim() === selectedStaff.name) return true;
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.phone && s.phone.toLowerCase().includes(term)) ||
      (s.role && s.role.toLowerCase().includes(term)) ||
      (s.nationalId && s.nationalId.includes(term)) ||
      (s.branchName && s.branchName.toLowerCase().includes(term))
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!isOpen) setIsOpen(true);
    if (isCustomEntry) {
      onNameChange(val);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    inputRef.current?.select();
  };

  const handleSelectStaff = (staff: StaffMember) => {
    onSelectStaff(staff);
    setQuery(staff.name);
    setIsOpen(false);
  };

  const handleChooseCustom = () => {
    onSelectCustom();
    if (query && isNaN(Number(query))) {
      onNameChange(query);
    }
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2.5" ref={containerRef}>
      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
        <label htmlFor="staff-select-input" className="flex items-center gap-1.5 cursor-pointer">
          <User className="w-3.5 h-3.5 text-blue-900" />
          <span>انتخاب یا جستجوی کارشناس / پرسنل</span>
        </label>
        <span className="text-[11px] text-slate-500 font-normal">
          {staffList.length} کارشناس در {companyName}
        </span>
      </div>

      {/* Main Inline Searchable Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            {isCustomEntry ? (
              <UserPlus className="w-4 h-4 text-amber-600" />
            ) : (
              <User className="w-4 h-4 text-slate-400" />
            )}
          </div>

          <input
            id="staff-select-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="نام کارشناس، کد ملی یا شماره موبایل..."
            autoComplete="off"
            className={`w-full pr-9 pl-14 py-2.5 bg-white border-2 rounded-xl text-xs font-bold text-slate-900 transition-all focus:outline-none ${
              isOpen
                ? 'border-blue-500 ring-2 ring-blue-100 shadow-sm'
                : isCustomEntry
                ? 'border-amber-300 bg-amber-50/30'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          />

          {/* Action buttons on left */}
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

        {/* Dropdown Floating Options List directly below the field */}
        {isOpen && (
          <div className="absolute z-50 top-full mt-1.5 right-0 left-0 bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-100 max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
            {/* Custom Entry Option */}
            <button
              type="button"
              onClick={handleChooseCustom}
              className={`w-full p-2.5 rounded-xl text-right transition flex items-center justify-between gap-2.5 cursor-pointer ${
                isCustomEntry
                  ? 'bg-amber-50 border border-amber-300 text-amber-950 font-bold'
                  : 'hover:bg-amber-50/70 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold">ورود کارشناس جدید (تعریف دستی)</div>
                  <div className="text-[10px] text-amber-700">ثبت مستقیم نام و شماره تلفن جدید</div>
                </div>
              </div>
              {isCustomEntry && <Check className="w-4 h-4 text-amber-700 shrink-0" />}
            </button>

            {/* List of matching staff */}
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => {
                const isSelected = !isCustomEntry && selectedStaffId === staff.id;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleSelectStaff(staff)}
                    className={`w-full p-2 rounded-xl text-right transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'hover:bg-blue-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs truncate">{staff.name}</span>
                          {staff.role && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-normal truncate ${
                                isSelected
                                  ? 'bg-white/20 text-blue-100'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {staff.role}
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-2 text-[10px] pt-0.5 ${
                            isSelected ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          <span className="font-mono font-bold" dir="ltr">
                            {staff.phone || 'بدون شماره'}
                          </span>
                          {staff.branchName && (
                            <span className="truncate opacity-75">
                              • {staff.branchName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-500 font-medium">
                کارشناسی با عبارت «{query}» یافت نشد.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phone Number Field */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-blue-900" />
          <span>شماره تلفن همراه (جهت دریافت کد پیامکی)</span>
        </label>
        <input
          type="tel"
          value={selectedPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="مثال: 09121234567"
          className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
          dir="ltr"
          required
        />
      </div>
    </div>
  );
};
