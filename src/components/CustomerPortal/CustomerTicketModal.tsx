import React, { useState } from 'react';
import {
  AlertTriangle,
  Send,
  X,
  FileText,
  CheckCircle2,
  Paperclip,
  Upload,
  User,
  Phone,
  ShieldAlert,
  Clock,
  Sparkles
} from 'lucide-react';
import { ClaimCase, UserSession, CustomerTicket, ExpertComplaint } from '../../types';
import { loadCrmTicketsFromStorage, saveCrmTicketsToStorage, loadComplaintsFromStorage, saveComplaintsToStorage } from '../../lib/storage';
import { compressImageFile } from '../../lib/imageCompressor';

interface CustomerTicketModalProps {
  claimCase: ClaimCase;
  session: UserSession;
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: CustomerTicket) => void;
  onUpdateCase: (updatedCase: ClaimCase) => void;
}

export const CustomerTicketModal: React.FC<CustomerTicketModalProps> = ({
  claimCase,
  session,
  isOpen,
  onClose,
  onTicketCreated,
  onUpdateCase
}) => {
  const isPartyOne = session.phone ? (claimCase.partyOnePhone === session.phone || claimCase.victimPhone === session.phone) : true;
  const isVictim = claimCase.victimPhone === session.phone || (!session.phone && isPartyOne);
  const isCulprit = claimCase.culpritPhone === session.phone;
  const myRoleLabel: 'زیان‌دیده' | 'مقصر' | 'بیمه‌گذار' = isVictim ? 'زیان‌دیده' : isCulprit ? 'مقصر' : 'زیان‌دیده';
  const myName = session.name || (isVictim ? claimCase.victimName : claimCase.culpritName) || 'مشتری گرامی';
  const myPhone = session.phone || (isVictim ? claimCase.victimPhone : claimCase.culpritPhone) || '09120000000';

  const [category, setCategory] = useState<
    'شکایت از مبلغ ارزیابی' | 'تاخیر در پرداخت خسارت' | 'اعتراض به کروکی و مقصر' | 'مشکل بارگذاری مدارک' | 'تغییر شماره شبا' | 'سوالات عمومی'
  >('شکایت از مبلغ ارزیابی');

  const [priority, setPriority] = useState<'عادی' | 'مهم' | 'فوری' | 'بحرانی (شکایت رسمی بیمه مرکزی)'>('مهم');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; dataUrl: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const dataUrl = await compressImageFile(file, 1000, 0.7);
      setAttachedFile({
        name: file.name,
        dataUrl
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);

    const ticketNumber = `TK-${claimCase.id.replace(/\D/g, '').slice(-4) || '1403'}-${Math.floor(100 + Math.random() * 900)}`;
    const nowStr = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    const newTicket: CustomerTicket = {
      id: `TCK-${Date.now()}`,
      caseId: claimCase.id,
      ticketNumber,
      customerName: myName,
      customerPhone: myPhone,
      customerRole: myRoleLabel,
      category,
      priority,
      status: 'در انتظار پاسخ',
      subject: subject.trim(),
      createdAt: nowStr,
      lastUpdate: nowStr,
      assignedAgent: claimCase.assignedExpert?.name || 'کارشناس پشتیبانی و شکایات CRM',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CUSTOMER',
          senderName: myName,
          senderRole: myRoleLabel,
          text: message.trim(),
          time: nowStr,
          attachmentUrl: attachedFile?.dataUrl
        }
      ]
    };

    // Save to CRM Tickets Storage
    const allTickets = loadCrmTicketsFromStorage();
    const updatedTickets = [newTicket, ...allTickets];
    saveCrmTicketsToStorage(updatedTickets);

    // Save to Expert Complaints if it's a dispute or high-priority complaint
    if (category === 'شکایت از مبلغ ارزیابی' || category === 'اعتراض به کروکی و مقصر' || priority.includes('بحرانی')) {
      const targetExpert = claimCase.assignedExpert || {
        id: claimCase.culpritInsurer === 'dana' ? 'd2' : 'ir2',
        name: claimCase.assignedExpert?.name || claimCase.assessment?.submittedBy || 'فاطمه احمدی',
        role: 'کارشناس ارزیاب خسارت'
      };
      const newComplaint: ExpertComplaint = {
        id: `CMP-${Date.now()}`,
        expertId: targetExpert.id,
        expertName: targetExpert.name,
        caseId: claimCase.id,
        complainantName: `${myName} (${myRoleLabel})`,
        complainantRole: myRoleLabel === 'مقصر' ? 'مقصر' : 'زیان‌دیده',
        reasonCategory: category === 'شکایت از مبلغ ارزیابی' ? 'مبلغ برآورد ناچیز' : 'سایر',
        description: `[تیکت پشتیبانی ${ticketNumber}] موضوع: ${subject.trim()} - شرح: ${message.trim()}`,
        filedAt: nowStr,
        status: 'در حال بررسی',
        impactPoints: 15
      };
      const existingComplaints = loadComplaintsFromStorage();
      saveComplaintsToStorage([newComplaint, ...existingComplaints]);
    }

    // Update case history
    const updatedCase: ClaimCase = {
      ...claimCase,
      history: [
        ...(claimCase.history || []),
        {
          status: claimCase.status,
          time: nowStr,
          user: `${myName} (${myRoleLabel})`,
          note: `ثبت تیکت و شکایت پشتیبانی CRM با کد پیگیری «${ticketNumber}» (موضوع: ${category})`
        }
      ]
    };

    onUpdateCase(updatedCase);
    onTicketCreated(newTicket);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border-2 border-slate-200 space-y-5 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                ثبت تیکت پشتیبانی و شکایت رسمی (CRM)
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                پرونده: <span className="font-mono font-bold text-indigo-700">{claimCase.id}</span> | متقاضی: {myName}
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

        {/* Assigned Expert Banner */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-blue-950 font-bold">
            <User className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              کارشناس مسئول پرونده: <strong>{claimCase.assignedExpert?.name || claimCase.assessment?.submittedBy || 'فاطمه احمدی'}</strong>
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-900 font-extrabold text-[10px]">
            واحد خسارت خودرو
          </span>
        </div>

        {/* Ticket Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Category */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              موضوع / دسته‌بندی تیکت <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="شکایت از مبلغ ارزیابی">شکایت از مبلغ ارزیابی و برآورد قیمت قطعات</option>
              <option value="تاخیر در پرداخت خسارت">تأخیر در واریز خسارت و بررسی شماره شبا</option>
              <option value="اعتراض به کروکی و مقصر">اعتراض به کروکی، اصالت حادثه و تعیین مقصر</option>
              <option value="مشکل بارگذاری مدارک">نقص در بارگذاری تصاویر و مدارک تکمیلی</option>
              <option value="تغییر شماره شبا">درخواست اصلاح شماره شبا بانکی یا مشخصات مالک</option>
              <option value="سوالات عمومی">سوال، هماهنگی یا درخواست تماس کارشناس</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              سطح اولویت و فوریت پیگیری <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['عادی', 'مهم', 'فوری', 'بحرانی (شکایت رسمی بیمه مرکزی)'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer ${
                    priority === p
                      ? p.includes('بحرانی')
                        ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-200'
                        : p === 'فوری'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-200'
                        : 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              عنوان خلاصه تیکت <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: اعتراض به عدم محاسبه افت ارزش خودرو و قیمت سپر جلو"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Detailed Message */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              شرح کامل درخواست یا شکایت <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="توضیحات دقیق خود، شماره فاکتور یا نکات مورد نظر را با جزئیات بنویسید..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-600 leading-relaxed"
            />
          </div>

          {/* Attach Document/Photo */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">
              ضمیمه کردن تصویر فاکتور یا مدرک (اختیاری)
            </label>
            {attachedFile ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-bold truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">فایل ضمیمه: {attachedFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5"
                >
                  حذف
                </button>
              </div>
            ) : (
              <label className="p-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2 cursor-pointer text-slate-600 transition-colors">
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="font-bold">انتخاب تصویر، عکس فاکتور یا استعلام</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Notice Box */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed space-y-1">
            <span className="font-extrabold block">فرآیند رسیدگی و پاسخگویی:</span>
            <p>
              پس از ثبت تیکت، پیام شما مستقیماً در کارتابل مدیریت شکایات CRM و پنل کارشناس ارزیاب قرار گرفته و حداکثر ظرف ۲ ساعت اداری بررسی و پاسخ آن در همین سامانه و از طریق پیامک به شما ابلاغ خواهد شد.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ثبت...' : 'ثبت و ارسال تیکت شکایت'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
