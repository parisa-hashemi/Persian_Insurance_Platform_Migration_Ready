import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  LogOut,
  Home,
  Bell,
  User,
  Building2,
  ClipboardCheck,
  MapPin,
  Settings,
  HelpCircle,
  X,
  CreditCard,
  Headphones
} from 'lucide-react';
import { UserSession, RoleType } from '../types';

interface NavbarProps {
  currentSession: UserSession | null;
  onLogout: () => void;
  onGoHome: () => void;
  onOpenPublicTrack: () => void;
  onSelectPortal?: (role: RoleType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSession,
  onLogout,
  onGoHome,
  onOpenPublicTrack,
  onSelectPortal
}) => {
  const [showNotifs, setShowNotifs] = useState(false);

  const getRoleBadge = () => {
    if (!currentSession) return null;
    switch (currentSession.role) {
      case 'customer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-950 border border-blue-300">
            <User className="w-3 h-3 text-blue-800" />
            مشتری
          </span>
        );
      case 'insurer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-900 text-amber-300 border border-blue-950">
            <Building2 className="w-3 h-3 text-amber-400" />
            بیمه‌گر
          </span>
        );
      case 'assessor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-950 border border-indigo-300">
            <ClipboardCheck className="w-3 h-3 text-indigo-800" />
            ارزیاب خسارت
          </span>
        );
      case 'fieldexpert':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
            <MapPin className="w-3 h-3 text-emerald-800" />
            کارشناس میدانی
          </span>
        );
      case 'reviewer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-950 border border-teal-300">
            <ShieldCheck className="w-3 h-3 text-teal-800" />
            بازبین کیفیت
          </span>
        );
      case 'finance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
            <CreditCard className="w-3 h-3 text-emerald-800" />
            مدیر مالی و خزانه‌داری
          </span>
        );
      case 'crm':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-950 border border-purple-300">
            <Headphones className="w-3 h-3 text-purple-800" />
            امور مشتریان و CRM
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-950 border border-amber-300">
            <Settings className="w-3 h-3 text-amber-800" />
            مدیر سامانه
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 text-slate-900 border-b-2 border-amber-400 shadow-sm backdrop-blur-md" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* RIGHT SIDE (Start in RTL): Brand Logo */}
        <div className="flex items-center gap-3">
          {/* Brand & Home */}
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-right group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg tracking-tight flex items-center gap-1 text-blue-950">
                سامانه خسارت <span className="text-amber-500 font-extrabold">بیمه</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-500 font-bold">
                سامانه ملی ارزیابی و تسویه هوشمند خسارت خودرو
              </span>
            </div>
          </button>
        </div>

        {/* CENTER: Navigation Breadcrumb or Quick Title */}
        <div className="hidden lg:flex items-center gap-2">
          {currentSession?.role === 'customer' && (
            <span className="text-xs font-bold text-blue-900 px-3 py-1 bg-amber-50 rounded-lg border border-amber-300">
              پورتال مشتریان
            </span>
          )}
        </div>

        {/* LEFT SIDE (End in RTL): Quick Search, Notifications, Logout */}
        <div className="flex items-center gap-2">
          {/* Quick Track Button */}
          <button
            onClick={onOpenPublicTrack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-blue-950 text-xs font-black transition-all shadow-sm active:scale-95 border border-amber-300"
            title="پیگیری بدون ورود"
          >
            <Search className="w-4 h-4 text-blue-950" />
            <span className="hidden md:inline">پیگیری پرونده</span>
          </button>

          {/* Home Portal Button */}
          <button
            onClick={onGoHome}
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-slate-700 hover:text-blue-950 hover:bg-blue-50 text-xs font-bold transition-colors border border-slate-200"
            title="بازگشت به درگاه اصلی"
          >
            <Home className="w-4 h-4 text-blue-900" />
            <span className="hidden lg:inline">درگاه اصلی</span>
          </button>

          {currentSession ? (
            <>
              {/* Notification Popover Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 transition-colors relative border border-blue-200"
                  title="اعلان‌ها"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                </button>

                {showNotifs && (
                  <div className="absolute left-0 mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border-2 border-amber-400 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-right">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <span className="font-bold text-xs text-blue-950">اعلان‌های سامانه</span>
                      <button
                        onClick={() => setShowNotifs(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="font-bold text-blue-950">ورود موفق به سامانه</p>
                        <p className="text-slate-600 mt-0.5">
                          خوش آمدید، کلیه استعلامات بیمه‌نامه‌ای شما فعال گردید.
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="font-bold text-amber-950">امکان پیگیری با کد رهگیری</p>
                        <p className="text-slate-600 mt-0.5">
                          هر زمان می‌توانید با کد رهگیری وضعیت خسارت را چک کنید.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all active:scale-95"
                title="خروج از حساب"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </>
          ) : (
            <button
              onClick={onGoHome}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-blue-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 border border-amber-300"
            >
              ورود به سامانه
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
