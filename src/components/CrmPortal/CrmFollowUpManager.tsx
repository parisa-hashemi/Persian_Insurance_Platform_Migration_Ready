import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  User,
  Building,
  ArrowRight,
  FileSpreadsheet,
  Layers,
  X
} from 'lucide-react';
import { CrmFollowUpTask, UserSession, ClaimCase } from '../../types';
import { maskPhoneNumber } from './crmHelpers';

interface CrmFollowUpManagerProps {
  session: UserSession;
  followUps: CrmFollowUpTask[];
  cases: ClaimCase[];
  onUpdateFollowUps: (tasks: CrmFollowUpTask[]) => void;
  onOpenNewTaskModal: () => void;
  onSelectCase: (caseId: string) => void;
  onSelectCustomer: (phone: string) => void;
}

export const CrmFollowUpManager: React.FC<CrmFollowUpManagerProps> = ({
  session,
  followUps,
  cases,
  onUpdateFollowUps,
  onOpenNewTaskModal,
  onSelectCase,
  onSelectCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [resolveTaskId, setResolveTaskId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Filtered Follow-up Tasks
  const filteredTasks = useMemo(() => {
    return followUps.filter(t => {
      const matchesSearch =
        !searchTerm.trim() ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerPhone.includes(searchTerm.trim()) ||
        (t.caseId && t.caseId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.reason.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL' && t.targetDepartment !== departmentFilter) return false;

      return true;
    });
  }, [followUps, searchTerm, statusFilter, departmentFilter]);

  // Complete / Resolve Task
  const handleResolveTask = () => {
    if (!resolveTaskId || !resolutionText.trim()) return;

    const updated = followUps.map(t => {
      if (t.id !== resolveTaskId) return t;
      return {
        ...t,
        status: 'تکمیل و رفع مانع' as const,
        resolution: resolutionText.trim(),
        completedAt: `${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`
      };
    });

    onUpdateFollowUps(updated);
    setResolveTaskId(null);
    setResolutionText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              میز کار وظایف پیگیری و رفع موانع پرونده‌ها (Follow-up Tasks)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ارجاع و پیگیری رفع موانع اداری با واحدهای ارزیابی، بازبینی، مالی، کارشناسی میدانی و شعب
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewTaskModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تعریف وظیفه پیگیری جدید</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="جستجو در موضوع پیگیری، نام مشتری، شماره پرونده..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="در انتظار انجام">در انتظار انجام</option>
            <option value="در حال پیگیری">در حال پیگیری</option>
            <option value="تکمیل و رفع مانع">تکمیل و رفع مانع</option>
          </select>

          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
          >
            <option value="ALL">همه واحدها</option>
            <option value="ارزیابی خسارت">ارزیابی خسارت</option>
            <option value="بازبینی و نظارت">بازبینی و نظارت</option>
            <option value="مالی و خزانه‌داری">مالی و خزانه‌داری</option>
            <option value="کارشناسی میدانی">کارشناسی میدانی</option>
            <option value="شعبه و خسارت">شعبه و خسارت</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map(task => {
          const isUrgent = task.priority === 'فوری و بحرانی' || task.priority === 'مهم';
          const isCompleted = task.status === 'تکمیل و رفع مانع';

          return (
            <div
              key={task.id}
              className={`p-5 rounded-3xl border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                isCompleted
                  ? 'bg-white border-emerald-200'
                  : isUrgent
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {task.id}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2">
                      {task.reason}
                    </h4>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isUrgent
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                  <div>
                    <span className="text-slate-500 text-[10px] block">واحد مقصد:</span>
                    <span className="text-indigo-700 font-bold">{task.targetDepartment}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">مهلت سررسید:</span>
                    <span className="font-mono text-amber-800 font-bold">{task.dueDate}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-700">
                  <p>
                    مشتری: <strong className="text-slate-900">{task.customerName}</strong> ({maskPhoneNumber(task.customerPhone)})
                  </p>
                  {task.notes && (
                    <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      {task.notes}
                    </p>
                  )}
                  {task.resolution && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px]">
                      <strong>نتیجه پیگیری:</strong> {task.resolution}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {task.caseId && (
                    <button
                      onClick={() => onSelectCase(task.caseId!)}
                      className="font-mono text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded text-[10px] font-bold border border-indigo-200 transition-all cursor-pointer"
                    >
                      {task.caseId}
                    </button>
                  )}
                  <button
                    onClick={() => onSelectCustomer(task.customerPhone)}
                    className="text-slate-600 hover:text-slate-900 text-[11px] font-bold cursor-pointer"
                  >
                    مشتری ۳۶۰
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isCompleted && (
                    <button
                      onClick={() => setResolveTaskId(task.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ثبت نتیجه</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200/80 p-12 rounded-3xl text-center space-y-2 shadow-xs">
            <TrendingUp className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">وظیفه پیگیری با این فیلتر یافت نشد.</p>
            <p className="text-xs text-slate-500">برای تعریف وظیفه جدید از دکمه بالا استفاده فرمایید.</p>
          </div>
        )}
      </div>

      {/* Resolve Task Modal */}
      {resolveTaskId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ثبت نتیجه و رفع مانع پیگیری</span>
              </div>
              <button
                onClick={() => setResolveTaskId(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block text-slate-700 font-bold">شرح اقدامات انجام‌شده و نتیجه رفع مشکل:</label>
              <textarea
                value={resolutionText}
                onChange={e => setResolutionText(e.target.value)}
                placeholder="توضیح دهید هماهنگی با کدام واحد انجام شد و نتیجه به چه صورتی به اطلاع مشتری رسید..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setResolveTaskId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleResolveTask}
                disabled={!resolutionText.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تکمیل و ثبت در سابقه پرونده</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
