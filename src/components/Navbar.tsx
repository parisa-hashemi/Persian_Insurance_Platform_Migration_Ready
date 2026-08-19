import React, { useState, useEffect, useMemo } from 'react';
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
  Headphones,
  Calendar,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  Navigation,
  MessageSquare
} from 'lucide-react';
import { UserSession, RoleType, CustomerNotification, AssessorNotification } from '../types';
import {
  loadCustomerNotifications,
  markCustomerNotificationAsRead,
  markAllCustomerNotificationsAsRead,
  loadAssessorNotifications,
  markAssessorNotificationAsRead,
  getInsurerPersianName
} from '../lib/storage';

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
  const [customerNotifs, setCustomerNotifs] = useState<CustomerNotification[]>([]);
  const [assessorNotifs, setAssessorNotifs] = useState<AssessorNotification[]>([]);

  const refreshNotifications = () => {
    if (!currentSession) {
      setCustomerNotifs([]);
      setAssessorNotifs([]);
      return;
    }

    if (currentSession.role === 'customer') {
      const all = loadCustomerNotifications();
      const filtered = currentSession.phone
        ? all.filter(n => !n.recipientPhone || n.recipientPhone === currentSession.phone || n.recipientPhone.includes(currentSession.phone.slice(-7)))
        : all;
      setCustomerNotifs(filtered.length > 0 ? filtered : all);
    } else {
      const all = loadAssessorNotifications();
      const filtered = all.filter(n =>
        (n.expertId && n.expertId === currentSession.id) ||
        (n.recipientPhone && currentSession.phone && n.recipientPhone.includes(currentSession.phone.slice(-7)))
      );
      setAssessorNotifs(filtered.length > 0 ? filtered : all);
    }
  };

  useEffect(() => {
    refreshNotifications();

    const handleUpdate = () => {
      refreshNotifications();
    };

    window.addEventListener('claimflow_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('claimflow_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [currentSession]);

  const unreadCount = useMemo(() => {
    if (currentSession?.role === 'customer') {
      return customerNotifs.filter(n => !n.read).length;
    }
    if (currentSession?.role === 'assessor' || currentSession?.role === 'fieldexpert') {
      return assessorNotifs.filter(n => !n.read).length;
    }
    return 0;
  }, [currentSession, customerNotifs, assessorNotifs]);

  const handleMarkCustomerNotifRead = (id: string) => {
    markCustomerNotificationAsRead(id);
    refreshNotifications();
  };

  const handleMarkAllCustomerRead = () => {
    markAllCustomerNotificationsAsRead(currentSession?.phone);
    refreshNotifications();
  };

  const handleMarkAssessorNotifRead = (id: string) => {
    markAssessorNotificationAsRead(id);
    refreshNotifications();
  };

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
      case 'insurer': {
        const companyName = currentSession?.companyName || currentSession?.name || getInsurerPersianName(currentSession?.company);
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-900 text-amber-300 border border-blue-950 shadow-xs">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>پورتال {companyName}</span>
          </span>
        );
      }
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
    <header className="sticky top-0 z-40 w-full bg-white/95 text-slate-900 border-b border-slate-200 shadow-2xs backdrop-blur-md" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* RIGHT SIDE (Start in RTL): Brand Logo */}
        <div className="flex items-center gap-3">
          {/* Brand & Home */}
          <button
            onClick={onGoHome}
            className="flex items-center gap-2.5 text-right group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-base sm:text-lg tracking-tight flex items-center gap-1 text-blue-950">
                سامانه خسارت <span className="text-blue-700 font-extrabold">بیمه</span>
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
            <span className="text-xs font-bold text-blue-950 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
              پورتال مشتریان
            </span>
          )}
          {currentSession?.role === 'insurer' && (
            <span className="text-xs font-black text-blue-950 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-blue-900" />
              <span>پورتال اختصاصی {currentSession.companyName || currentSession.name || getInsurerPersianName(currentSession.company)}</span>
            </span>
          )}
        </div>

        {/* LEFT SIDE (End in RTL): Quick Search, Notifications, Logout */}
        <div className="flex items-center gap-2">
          {/* Quick Track Button */}
          <button
            onClick={onOpenPublicTrack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-2xs active:scale-95 border border-blue-950"
            title="پیگیری بدون ورود"
          >
            <Search className="w-4 h-4 text-white" />
            <span className="hidden md:inline">پیگیری پرونده</span>
          </button>

          {/* Home Portal Button */}
          <button
            onClick={onGoHome}
            className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-slate-700 hover:text-blue-950 hover:bg-slate-100 text-xs font-bold transition-colors border border-slate-200"
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
                  title="اعلان‌ها و پیامک‌های سامانه"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs">
                        {unreadCount}
                      </span>
                    </>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border-2 border-amber-400 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-right max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <span className="font-extrabold text-xs text-blue-950">صندوق پیام‌ها و اعلان‌ها</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md">
                            {unreadCount} خوانده‌نشده
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {currentSession.role === 'customer' && customerNotifs.some(n => !n.read) && (
                          <button
                            onClick={handleMarkAllCustomerRead}
                            className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline"
                          >
                            خوانده شدن همه
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifs(false)}
                          className="text-slate-400 hover:text-slate-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Specific Notifications */}
                    {currentSession.role === 'customer' && (
                      <div className="space-y-2.5 text-xs">
                        {customerNotifs.length === 0 ? (
                          <div className="p-4 text-center text-slate-500 font-medium">
                            <MessageSquare className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                            هنوز پیامی دریافت نشده است.
                          </div>
                        ) : (
                          customerNotifs.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkCustomerNotifRead(n.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                n.type === 'BRANCH_VISIT'
                                  ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/60'
                                  : n.read
                                  ? 'bg-slate-50 border-slate-200'
                                  : 'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1.5 font-black text-slate-900 text-[11px]">
                                  {n.type === 'BRANCH_VISIT' ? (
                                    <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  ) : (
                                    <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                  )}
                                  <span>{n.title}</span>
                                </div>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                                )}
                              </div>

                              <p className="text-[11px] text-slate-700 leading-relaxed font-medium whitespace-pre-line mb-2">
                                {n.message}
                              </p>

                              {/* Branch Visit Specific Details Highlight */}
                              {n.branchName && (
                                <div className="p-2 bg-white rounded-lg border border-amber-200 space-y-1 text-[10px]">
                                  <div className="flex items-center justify-between font-bold text-amber-950">
                                    <span>شعبه: {n.branchName}</span>
                                    {n.branchPhone && <span>تلفن: {n.branchPhone}</span>}
                                  </div>
                                  {n.branchAddress && (
                                    <div className="text-slate-600 leading-tight">
                                      نشانی: {n.branchAddress}
                                    </div>
                                  )}
                                  {n.expertName && (
                                    <div className="text-blue-900 font-bold flex items-center justify-between pt-0.5 border-t border-slate-100">
                                      <span>کارشناس معتمد: {n.expertName}</span>
                                      {n.expertPhone && <span>تلفن: {n.expertPhone}</span>}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1.5 mt-1 border-t border-slate-200/60">
                                <span>{n.date || 'امروز'} • ساعت {n.time || '—'}</span>
                                <span className="font-bold text-amber-800">
                                  {n.read ? 'خوانده شده' : 'پیام جدید'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Assessor / Field Expert / Reviewer / Insurer Notifications */}
                    {currentSession.role !== 'customer' && (
                      <div className="space-y-2.5 text-xs">
                        {assessorNotifs.length === 0 ? (
                          <div className="p-4 text-center text-slate-500 font-medium">
                            <MessageSquare className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                            پیام یا اعلان جدیدی ثبت نشده است.
                          </div>
                        ) : (
                          assessorNotifs.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkAssessorNotifRead(n.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                n.type === 'CRM_MESSAGE'
                                  ? n.read ? 'bg-purple-50/50 border-purple-200' : 'bg-purple-50 border-2 border-purple-400 shadow-xs'
                                  : n.read ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-300'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5">
                                  {n.type === 'CRM_MESSAGE' ? (
                                    <Headphones className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                  ) : (
                                    <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                  )}
                                  <span>{n.title}</span>
                                  {n.type === 'CRM_MESSAGE' && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 font-black text-[9px]">
                                      CRM
                                    </span>
                                  )}
                                </div>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-700 leading-relaxed font-medium whitespace-pre-line mb-1.5">
                                {n.message}
                              </p>
                              <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-200/60">
                                <span>{n.date} ساعت {n.time} {n.sender ? `• از طرف ${n.sender}` : ''}</span>
                                {n.caseId && <span className="font-bold text-blue-900">پرونده {n.caseId}</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
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
