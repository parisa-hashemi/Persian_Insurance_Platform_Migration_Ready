import React, { useState } from 'react';
import {
  Phone,
  UserCheck,
  X,
  PhoneCall,
  Clock,
  CheckCircle2,
  Headphones,
  Shield,
  Building2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { ClaimCase, UserSession } from '../../types';
import { getInsurerPersianName, loadCrmFollowUpsFromStorage, saveCrmFollowUpsToStorage } from '../../lib/storage';

interface CustomerExpertCallModalProps {
  claimCase: ClaimCase;
  session: UserSession;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerExpertCallModal: React.FC<CustomerExpertCallModalProps> = ({
  claimCase,
  session,
  isOpen,
  onClose
}) => {
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [callbackReason, setCallbackReason] = useState('هماهنگی ارزیابی و استعلام زمان واریز');

  if (!isOpen) return null;

  const expertName = claimCase.assignedExpert?.name || claimCase.assessment?.submittedBy || (claimCase.culpritInsurer === 'dana' ? 'فاطمه احمدی' : 'رضا تهرانی');
  const expertRole = claimCase.assignedExpert?.role || 'کارشناس ارزیابی خسارت خودرو';
  const expertPhone = claimCase.assignedExpert?.phone || (claimCase.culpritInsurer === 'dana' ? '09121234567' : '09129876543');
  const insurerName = getInsurerPersianName(claimCase.culpritInsurer);

  const handleRequestCallback = () => {
    const nowStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const myName = session.name || claimCase.victimName || 'مشتری گرامی';
    const myPhone = session.phone || claimCase.victimPhone || '09120000000';

    const followUps = loadCrmFollowUpsFromStorage();
    const newTask = {
      id: `FLW-${Date.now()}`,
      caseId: claimCase.id,
      customerName: myName,
      customerPhone: myPhone,
      customerRole: 'زیان‌دیده' as const,
      reason: `درخواست تماس و مشاوره تلفنی توسط مشتری: ${callbackReason}`,
      targetDepartment: 'ارزیابی خسارت' as const,
      assignedAgent: expertName,
      priority: 'فوری و بحرانی' as const,
      dueDate: new Date().toLocaleDateString('fa-IR'),
      status: 'در انتظار انجام' as const,
      createdAt: nowStr,
      notes: `درخواست تماس ثبت شده از پورتال خودخدمت مشتری برای پرونده ${claimCase.id}`
    };

    saveCrmFollowUpsToStorage([newTask, ...followUps]);
    setCallbackRequested(true);
    setTimeout(() => {
      setCallbackRequested(false);
      onClose();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-slate-200 space-y-5 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                تماس و ارتباط با کارشناس ارزیاب
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                مرکز پاسخگویی تخصصی {insurerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expert Info Card */}
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-white border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-700 font-extrabold block">کارشناس ارزیاب رسمی پرونده</span>
              <h4 className="font-black text-slate-900 text-sm">{expertName}</h4>
              <p className="text-xs text-slate-600 font-medium">{expertRole} ({insurerName})</p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold">شماره مستقیم کارشناس:</span>
              <span className="font-mono font-bold text-indigo-700 text-sm" dir="ltr">{expertPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-bold">ساعات پاسخگویی:</span>
              <span className="text-slate-700 font-bold">شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰</span>
            </div>
          </div>

          {/* Direct Phone Call Button */}
          <a
            href={`tel:${expertPhone}`}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>تماس تلفنی مستقیم با کارشناس ({expertPhone})</span>
          </a>
        </div>

        {/* Centralized CRM Call Center 1640 */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-slate-900">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span>مرکز شبانه‌روزی پشتیبانی و شکایات بیمه:</span>
            </div>
            <span className="font-mono font-black text-base text-emerald-700">۱۶۴۰</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
            در صورت عدم پاسخگویی کارشناس ارزیاب یا نیاز به پیگیری فوری خسارت، با خط ۴ رقمی ۱۶۴۰ بدون پیش‌شماره تماس حاصل فرمایید.
          </p>
        </div>

        {/* Request Immediate Callback */}
        <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
          <label className="block font-bold text-slate-800">
            درخواست تماس معکوس کارشناس با شما (CRM Callback)
          </label>
          <select
            value={callbackReason}
            onChange={(e) => setCallbackReason(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
          >
            <option value="هماهنگی ارزیابی و استعلام زمان واریز">هماهنگی ارزیابی و استعلام زمان واریز</option>
            <option value="اعتراض به کسورات داغی و استهلاک">اعتراض به کسورات داغی و استهلاک قطعات</option>
            <option value="درخواست اعزام کارشناس میدانی به تعمیرگاه">درخواست اعزام کارشناس میدانی به تعمیرگاه</option>
            <option value="بررسی شماره شبا و رفع مسدودی پرداخت">بررسی شماره شبا و رفع مسدودی پرداخت</option>
          </select>

          {callbackRequested ? (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-950 font-bold flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>درخواست تماس با موفقیت ثبت شد. کارشناس حداکثر تا ۳۰ دقیقه آینده با شما تماس خواهد گرفت.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestCallback}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>ثبت درخواست تماس فوری کارشناس با من</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
