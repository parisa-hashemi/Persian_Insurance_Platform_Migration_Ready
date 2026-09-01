import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  User,
  Phone,
  Check,
  ChevronDown,
  UserPlus,
  X,
  Sparkles,
  ShieldCheck,
  Building2,
  Edit3
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
  accentColor?: string; // 'blue' | 'amber' | 'indigo'
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Filter staff by search term (name, phone, role, nationalId)
  const filteredStaff = staffList.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.phone && s.phone.toLowerCase().includes(term)) ||
      (s.role && s.role.toLowerCase().includes(term)) ||
      (s.nationalId && s.nationalId.includes(term)) ||
      (s.branchName && s.branchName.toLowerCase().includes(term))
    );
  });

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId);

  return (
    <div className="space-y-3" ref={containerRef}>
      <label className="block text-xs text-slate-800 font-bold flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-blue-900" />
          <span>انتخاب یا جستجوی کارشناس / پرسنل</span>
        </span>
        <span className="text-[11px] text-slate-500 font-normal">
          {staffList.length} کارشناس تعریف‌شده در {companyName}
        </span>
      </label>

      {/* Trigger & Searchable Dropdown Container */}
      <div className="relative">
        {/* Main Select Button / Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-3 bg-white border-2 rounded-2xl text-right transition-all flex items-center justify-between gap-3 shadow-sm hover:shadow ${
            isOpen
              ? 'border-blue-900 ring-4 ring-blue-50'
              : selectedStaff || selectedName
              ? 'border-slate-300 hover:border-blue-700'
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          {isCustomEntry ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center shrink-0 font-black text-xs">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs text-slate-900 truncate">
                    {selectedName || 'ورود کارشناس جدید (دستی)'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                    کارشناس جدید
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 truncate" dir="ltr">
                  {selectedPhone || 'شماره موبایل را وارد نمایید'}
                </div>
              </div>
            </div>
          ) : selectedStaff ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-900 flex items-center justify-center shrink-0 font-black text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-right">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-xs text-slate-900 truncate">
                    {selectedStaff.name}
                  </span>
                  {selectedStaff.role && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 truncate">
                      {selectedStaff.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                  <span className="font-mono font-bold text-blue-950" dir="ltr">
                    {selectedPhone || selectedStaff.phone || 'بدون شماره'}
                  </span>
                  {selectedStaff.branchName && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                      • {selectedStaff.branchName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500">
                جستجو و انتخاب از لیست پرسنل یا ثبت جدید...
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 text-slate-600 ${
                isOpen ? 'rotate-180 text-blue-900' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Popover Menu */}
        {isOpen && (
          <div className="absolute z-50 top-full mt-1.5 right-0 left-0 bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Bar inside Dropdown */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="جستجوی نام کارشناس، کد ملی یا شماره همراه..."
                  className="w-full pr-9 pl-8 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100"
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

            {/* List of Staff */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
              {/* Option to Add / Enter Custom Expert */}
              <button
                type="button"
                onClick={() => {
                  onSelectCustom();
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className={`w-full p-2.5 rounded-xl text-right transition flex items-center justify-between gap-2.5 ${
                  isCustomEntry
                    ? 'bg-amber-50 border border-amber-300 text-amber-950'
                    : 'bg-amber-50/50 hover:bg-amber-100/70 border border-dashed border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-950">
                      ورود کارشناس جدید (تعریف دستی نام و شماره موبایل)
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium">
                      در صورتی که نام شما در لیست نیست، جهت ثبت شماره اختصاصی کلیک نمایید
                    </div>
                  </div>
                </div>
                {isCustomEntry && <Check className="w-4 h-4 text-amber-700 shrink-0" />}
              </button>

              {/* Staff Items */}
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  const isSelected = !isCustomEntry && selectedStaffId === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        onSelectStaff(staff);
                        setIsOpen(false);
                        setSearchTerm('');
                        setIsEditingPhone(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-right transition flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-blue-900 text-white font-bold shadow-sm'
                          : 'hover:bg-blue-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs truncate">{staff.name}</span>
                            {staff.role && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-normal truncate ${
                                  isSelected
                                    ? 'bg-white/20 text-blue-100'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {staff.role}
                              </span>
                            )}
                          </div>
                          <div
                            className={`flex items-center gap-2 text-[11px] pt-0.5 ${
                              isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            <span className="font-mono font-bold" dir="ltr">
                              {staff.phone || 'بدون شماره'}
                            </span>
                            {staff.branchName && (
                              <span className="truncate opacity-75 max-w-[150px]">
                                • {staff.branchName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs space-y-2">
                  <p>کارشناسی با عبارت «{searchTerm}» پیدا نشد.</p>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCustom();
                      if (searchTerm && isNaN(Number(searchTerm))) {
                        onNameChange(searchTerm);
                      } else if (searchTerm && !isNaN(Number(searchTerm))) {
                        onPhoneChange(searchTerm);
                      }
                      setIsOpen(false);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold hover:bg-amber-100"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>ادامه با عنوان کارشناس جدید</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* In Custom Entry Mode: Display Name and Phone inputs */}
      {isCustomEntry && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              مشخصات کارشناس جدید:
            </span>
            <button
              type="button"
              onClick={() => {
                if (staffList.length > 0) {
                  onSelectStaff(staffList[0]);
                }
              }}
              className="text-[11px] font-bold text-blue-900 hover:underline"
            >
              بازگشت به پرسنل پیش‌فرض
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-700 mb-1 font-bold">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                value={selectedName}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="مثال: مهندس سارا محمدی"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-700 mb-1 font-bold">
                شماره موبایل (جهت OTP)
              </label>
              <input
                type="tel"
                value={selectedPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="09121234567"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-bold focus:outline-none focus:border-blue-900 shadow-sm"
                dir="ltr"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* If an existing staff is selected, show a compact confirmation badge with optional quick phone editor */}
      {!isCustomEntry && selectedStaff && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <span className="text-slate-600 font-medium">ارسال پیامک تایید به شماره:</span>
            {isEditingPhone ? (
              <input
                type="tel"
                value={selectedPhone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="px-2 py-0.5 bg-white border border-blue-900 rounded font-mono text-xs font-bold text-blue-950 w-32"
                dir="ltr"
                autoFocus
              />
            ) : (
              <span className="font-mono font-black text-blue-950 px-2 py-0.5 bg-white rounded-md border border-slate-200" dir="ltr">
                {selectedPhone}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsEditingPhone(!isEditingPhone)}
            className="text-[11px] font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 transition"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isEditingPhone ? 'ثبت شماره' : 'ویرایش شماره'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
