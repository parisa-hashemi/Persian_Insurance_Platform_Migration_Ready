import React, { useState, useMemo } from 'react';
import {
  Bell,
  Send,
  PhoneCall,
  UserCheck,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Search,
  Filter,
  User,
  Shield,
  PhoneForwarded,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import {
  ClaimCase,
  UserSession,
  StaffMember,
  AssessorNotification,
  CrmFollowUpTask,
  CustomerCallLog
} from '../../types';
import {
  loadExpertsFromStorage,
  loadFieldExpertsFromStorage,
  loadReviewersFromStorage,
  loadInsurersFromStorage,
  sendCrmMessageToExpert,
  loadAssessorNotifications,
  getInsurerPersianName
} from '../../lib/storage';

interface CrmExpertMessengerProps {
  session: UserSession;
  cases: ClaimCase[];
  followUps: CrmFollowUpTask[];
  onUpdateFollowUps: (tasks: CrmFollowUpTask[]) => void;
  onUpdateCase: (updated: ClaimCase) => void;
  onSelectCase: (caseId: string) => void;
  onLogCallWithCustomer?: (customerPhone: string, caseId?: string) => void;
}

export const CrmExpertMessenger: React.FC<CrmExpertMessengerProps> = ({
  session,
  cases,
  followUps,
  onUpdateFollowUps,
  onUpdateCase,
  onSelectCase,
  onLogCallWithCustomer
}) => {
  // 1. Load All Staff Members across categories
  const insurers = useMemo(() => loadInsurersFromStorage(), []);
  const expertsMap = useMemo(() => loadExpertsFromStorage(), []);
  const fieldExpertsMap = useMemo(() => loadFieldExpertsFromStorage(), []);
  const reviewersMap = useMemo(() => loadReviewersFromStorage(), []);

  // Flatten Staff List
  const allStaff = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      role: string;
      roleCategory: 'ASSESSOR' | 'FIELD' | 'REVIEWER' | 'INSURER';
      companyCode: string;
      companyName: string;
      phone: string;
      active: boolean;
    }> = [];

    // Assessors
    Object.entries(expertsMap).forEach(([cCode, staffList]) => {
      const compName = getInsurerPersianName(cCode);
      ((staffList as any[]) || []).forEach(s => {
        list.push({
          id: s.id,
          name: s.name,
          role: s.roleTitle || 'کارشناس ارزیاب خسارت',
          roleCategory: 'ASSESSOR',
          companyCode: cCode,
          companyName: compName,
          phone: s.phone || '09120000000',
          active: s.active ?? true
        });
      });
    });

    // Field Experts
    Object.entries(fieldExpertsMap).forEach(([cCode, staffList]) => {
      const compName = getInsurerPersianName(cCode);
      ((staffList as any[]) || []).forEach(s => {
        list.push({
          id: s.id,
          name: s.name,
          role: s.roleTitle || 'کارشناس بازدید میدانی در محل',
          roleCategory: 'FIELD',
          companyCode: cCode,
          companyName: compName,
          phone: s.phone || '09120000000',
          active: s.active ?? true
        });
      });
    });

    // Reviewers
    Object.entries(reviewersMap).forEach(([cCode, staffList]) => {
      const compName = getInsurerPersianName(cCode);
      ((staffList as any[]) || []).forEach(s => {
        list.push({
          id: s.id,
          name: s.name,
          role: s.roleTitle || 'کارشناس بازبین و نظارت ارشد',
          roleCategory: 'REVIEWER',
          companyCode: cCode,
          companyName: compName,
          phone: s.phone || '09120000000',
          active: s.active ?? true
        });
      });
    });

    return list;
  }, [expertsMap, fieldExpertsMap, reviewersMap]);

  // Form State: Send Message to Expert's Bell
  const [selectedExpertId, setSelectedExpertId] = useState<string>('');
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<string>('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [associatedCaseId, setAssociatedCaseId] = useState<string>('');
  const [msgTitle, setMsgTitle] = useState<string>('');
  const [msgBody, setMsgBody] = useState<string>('');
  const [sendSuccessMsg, setSendSuccessMsg] = useState<string | null>(null);

  // Filtered Staff for the Dropdown & Staff List
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const filteredStaff = useMemo(() => {
    return allStaff.filter(s => {
      if (roleCategoryFilter !== 'ALL' && s.roleCategory !== roleCategoryFilter) return false;
      if (selectedCompanyFilter !== 'ALL' && s.companyCode !== selectedCompanyFilter) return false;
      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.companyName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allStaff, roleCategoryFilter, selectedCompanyFilter, staffSearchQuery]);

  // Selected Expert Object
  const selectedExpert = useMemo(() => {
    return allStaff.find(s => s.id === selectedExpertId) || null;
  }, [allStaff, selectedExpertId]);

  // Expert Requests to CRM (Tasks requested by experts for CRM to call customers)
  const expertRequestsToCrm = useMemo(() => {
    return followUps.filter(
      f => f.requestedByRole || f.targetDepartment === 'امور مشتریان' || f.isOverdueAction
    );
  }, [followUps]);

  // Quick Preset Templates for CRM to Expert
  const quickTemplates = [
    {
      title: 'پیگیری تسریع در ثبت نظر کارشناسی',
      text: 'با سلام و احترام، مشتری محترم جهت اطلاع از نتیجه ارزیابی با مرکز امور مشتریان تماس گرفته است. خواهشمند است در صورت امکان بررسی و ثبت نظر نهایی را در اولویت قرار دهید.'
    },
    {
      title: 'تکمیل مدارک و ثبت شماره شبا توسط مشتری',
      text: 'با سلام، پیرو پیگیری امور مشتریان، شماره شبا و مدارک تکمیلی زیان‌دیده دریافت و در سامانه بارگذاری گردید. لطفاً ادامه مراحل را اقدام فرمایید.'
    },
    {
      title: 'هماهنگی مجدد زمان و محل بازدید میدانی',
      text: 'با سلام، با زیان‌دیده تماس حاصل شد و نامبرده در محل اعلامی حضور دارد. لطفاً جهت انجام بازدید حضوری و تطبیق اصالت اقدام فرمایید.'
    },
    {
      title: 'درخواست بازبینی مجدد مبلغ ارزیابی',
      text: 'با سلام، مشتری نسبت به برآورد اولیه معترض بوده و فاکتور تعمیرات تکمیلی ارائه نموده است. لطفاً مستندات جدید را در پرونده بررسی فرمایید.'
    }
  ];

  // Send Notification to Expert's Bell
  const handleSendMessageToBell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpertId || !msgTitle.trim() || !msgBody.trim()) {
      alert('لطفاً کارشناس مقصد، عنوان و متن پیام را وارد فرمایید.');
      return;
    }

    const notif = sendCrmMessageToExpert(
      selectedExpertId,
      selectedExpert?.phone,
      associatedCaseId || 'عمومی',
      msgTitle.trim(),
      msgBody.trim(),
      {
        name: session.name,
        role: session.roleTitle || 'کارشناس امور مشتریان (CRM)',
        phone: session.phone
      }
    );

    // If associated case exists, log into case history
    if (associatedCaseId) {
      const targetCase = cases.find(c => c.id === associatedCaseId);
      if (targetCase) {
        const updatedHistory = [
          ...(targetCase.history || []),
          {
            date: new Date().toLocaleDateString('fa-IR'),
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            action: `ارسال پیام فوری امور مشتریان (CRM) به ${selectedExpert?.name || 'کارشناس'}: «${msgTitle}»`,
            actor: session.name,
            role: 'امور مشتریان'
          }
        ];
        onUpdateCase({
          ...targetCase,
          history: updatedHistory
        });
      }
    }

    setSendSuccessMsg(`پیام با موفقیت در زنگوله اعلان‌های ${selectedExpert?.name || 'کارشناس'} ارسال شد.`);
    setMsgBody('');
    setTimeout(() => setSendSuccessMsg(null), 5000);
  };

  // Resolve an Expert Request to CRM
  const handleResolveExpertRequest = (task: CrmFollowUpTask) => {
    const updated = followUps.map(t => {
      if (t.id !== task.id) return t;
      return {
        ...t,
        status: 'تکمیل و رفع مانع' as const,
        completedAt: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`,
        resolution: `تماس توسط ${session.name} انجام شد و اطلاعات تکمیل گردید.`
      };
    });
    onUpdateFollowUps(updated);

    // Send acknowledgement notification to the requesting expert if applicable
    if (task.requestedByName) {
      const matchedStaff = allStaff.find(s => s.name === task.requestedByName);
      if (matchedStaff && task.caseId) {
        sendCrmMessageToExpert(
          matchedStaff.id,
          matchedStaff.phone,
          task.caseId,
          `پیگیری تماس با مشتری پرونده ${task.caseId} انجام شد`,
          `با سلام جناب ${matchedStaff.name}، پیرو درخواست جنابعالی، با مشتری (${task.customerName} - ${task.customerPhone}) تماس گرفته شد و مورد پیگیری گردید.`,
          {
            name: session.name,
            role: 'امور مشتریان'
          }
        );
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-purple-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-black">
              <Bell className="w-4 h-4 text-amber-300" />
              <span>مرکز ارتباط با کارشناسان و ارسال پیام به زنگوله اعلان‌ها</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              پیام‌رسان مستقیم به ارزیابان، کارشناسان میدانی و خسارت شرکت‌ها
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
              ارسال هشدار و دستور پیگیری فوری مستقیماً به زنگوله اعلان کارشناسان در پورتال اختصاصی، ثبت لاگ تماس داخلی و مدیریت درخواست‌های ارجاعی کارشناسان به CRM.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 bg-white/10 p-3 rounded-2xl border border-white/10 text-center">
            <div>
              <div className="text-2xl font-black text-amber-300">{expertRequestsToCrm.filter(t => t.status === 'در انتظار انجام').length}</div>
              <div className="text-[11px] text-purple-200 font-bold">درخواست تماس ارجاعی کارشناسان</div>
            </div>
          </div>
        </div>
      </div>

      {sendSuccessMsg && (
        <div className="p-4 bg-emerald-100 border-2 border-emerald-400 rounded-2xl text-emerald-950 text-xs sm:text-sm font-black flex items-center gap-3 shadow-md animate-in zoom-in-95">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
          <span>{sendSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Left = Send Message to Bell, Right = Expert Requests to CRM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RIGHT COLUMN (Lg: 7 cols): Message Dispatcher to Expert Bell */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ارسال پیام به زنگوله اعلان کارشناس (Push to Bell)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  اعلان فوری با بج قرمز در نوبار و سایدبار کارشناس مقصد
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendMessageToBell} className="space-y-4">
            {/* Filter Bar for Staff Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  دسته‌بندی نقش کارشناس:
                </label>
                <select
                  value={roleCategoryFilter}
                  onChange={(e) => setRoleCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  <option value="ALL">همه نقش‌ها (ارزیاب، میدانی، بازبین)</option>
                  <option value="ASSESSOR">کارشناسان ارزیاب خسارت</option>
                  <option value="FIELD">کارشناسان بازدید میدانی</option>
                  <option value="REVIEWER">کارشناسان بازبین و نظارت</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  شرکت بیمه:
                </label>
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  <option value="ALL">همه شرکت‌های بیمه</option>
                  {insurers.map(ins => (
                    <option key={ins.code} value={ins.code}>{ins.nameFa}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Expert Selection */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                انتخاب کارشناس مقصد <span className="text-rose-500">*</span>:
              </label>
              <select
                value={selectedExpertId}
                onChange={(e) => setSelectedExpertId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-purple-300 bg-purple-50/40 text-xs font-black text-purple-950 focus:outline-none focus:border-purple-600"
              >
                <option value="">-- لطفاً کارشناس مقصد را انتخاب نمایید --</option>
                {filteredStaff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role}) — {s.companyName} | {s.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Expert Info Card */}
            {selectedExpert && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-purple-950">{selectedExpert.name}</div>
                    <div className="text-[10px] text-purple-700">{selectedExpert.role} • {selectedExpert.companyName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedExpert.phone}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 shadow-xs"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>تماس: {selectedExpert.phone}</span>
                  </a>
                </div>
              </div>
            )}

            {/* Associated Case ID */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                شماره پرونده مرتبط (اختیاری):
              </label>
              <select
                value={associatedCaseId}
                onChange={(e) => setAssociatedCaseId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
              >
                <option value="">-- بدون پرونده (پیام عمومی / بخشنامه داخلی) --</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>
                    پرونده {c.id} — خودرو: {c.carType} — زیان‌دیده: {c.victimName} ({c.victimPhone})
                  </option>
                ))}
              </select>
            </div>

            {/* Message Title */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                عنوان پیام / موضوع هشدار <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                placeholder="مثال: پیگیری تسریع در ثبت ارزیابی خسارت..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Quick Preset Templates */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                قالب‌های آماده پیام به کارشناس:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setMsgTitle(t.title);
                      setMsgBody(t.text);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 text-[10px] font-bold border border-slate-200 transition-colors"
                  >
                    + {t.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                متن پیام به کارشناس <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={4}
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="متن کامل پیام یا دستور پیگیری که در زنگوله اعلان کارشناس نمایش داده می‌شود..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span>ارسال مستقیم به زنگوله اعلان کارشناس</span>
              </button>

              <span className="text-[11px] text-slate-500">
                فرستنده: {session.name} ({session.roleTitle || 'امور مشتریان'})
              </span>
            </div>
          </form>
        </div>

        {/* LEFT COLUMN (Lg: 5 cols): Expert Requests to CRM (Inbound Call Requests) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <PhoneForwarded className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  درخواست‌های تماس کارشناسان
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  پرونده‌هایی که ارزیاب یا کارشناس میدانی از CRM خواسته با مشتری تماس بگیرد
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
              {expertRequestsToCrm.length} مورد
            </span>
          </div>

          {expertRequestsToCrm.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-slate-700">درخواست معوقی از کارشناسان وجود ندارد.</p>
              <p className="text-[11px] text-slate-500">تمامی درخواست‌های تماس کارشناسان رسیدگی و رفع مانع شده‌اند.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {expertRequestsToCrm.map(task => {
                const isPending = task.status === 'در انتظار انجام';
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                      isPending
                        ? 'bg-amber-50/80 border-amber-300/90 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isPending ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
                          }`}>
                            {task.status}
                          </span>
                          {task.caseId && (
                            <button
                              type="button"
                              onClick={() => onSelectCase(task.caseId!)}
                              className="text-xs font-black text-blue-900 hover:underline flex items-center gap-1"
                            >
                              <span>پرونده {task.caseId}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 mt-1">
                          {task.reason}
                        </h4>
                      </div>

                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {task.createdAt}
                      </span>
                    </div>

                    {/* Requester Details */}
                    <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-800 font-bold">
                        <span>👤 درخواست‌دهنده: {task.requestedByName || 'کارشناس سامانه'}</span>
                        <span className="text-purple-800 text-[10px]">({task.requestedByRole || 'کارشناس ارزیاب'})</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 pt-0.5 border-t border-slate-100">
                        <span>مشتری هدف: {task.customerName}</span>
                        <span className="font-mono text-blue-900 font-bold">{task.customerPhone}</span>
                      </div>
                      {task.notes && (
                        <p className="text-slate-600 text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                          «{task.notes}»
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onLogCallWithCustomer?.(task.customerPhone, task.caseId)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>تماس با مشتری</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResolveExpertRequest(task)}
                            className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-[11px] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ثبت اتمام پیگیری</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>رفع مانع گردید در: {task.completedAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
