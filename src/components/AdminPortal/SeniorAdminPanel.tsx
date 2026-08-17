import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  UserPlus,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Wrench,
  DollarSign,
  PhoneCall,
  MapPin,
  Edit3,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Check,
  Eye,
  Key,
  BadgeCheck,
  Building,
  Briefcase,
  Layers,
  ChevronDown,
  Lock,
  Phone,
  Mail,
  Compass,
  Zap,
  Clock,
  Server
} from 'lucide-react';
import {
  InsurerInfo,
  StaffMember,
  StaffRoleCategory,
  UserSession,
  ClaimCase
} from '../../types';
import {
  loadInsurersFromStorage,
  saveInsurersToStorage,
  loadExpertsFromStorage,
  saveExpertsToStorage,
  loadReviewersFromStorage,
  saveReviewersToStorage,
  loadFieldExpertsFromStorage,
  saveFieldExpertsToStorage,
  loadFinanceStaffFromStorage,
  saveFinanceStaffToStorage,
  loadCrmStaffFromStorage,
  saveCrmStaffToStorage,
  loadCasesFromStorage
} from '../../lib/storage';

interface SeniorAdminPanelProps {
  session: UserSession;
  onLogout: () => void;
  onSwitchPortal?: (targetView: string, targetSession?: UserSession) => void;
}

type AdminTab = 'companies' | 'staff' | 'overview' | 'settings';

const SPECIALTIES_LIST = [
  'خسارت بدنه و صافکاری',
  'رنگ و شاسی‌کشی',
  'موتور و قطعات فنی',
  'خودروهای لوکس و وارداتی',
  'خودروهای برقی و هیبریدی',
  'ارزیابی تصادفات بدون کروکی',
  'محاسبه افت قیمت خودرو',
  'تصادفات زنجیره‌ای و چندخودرویی',
  'ارزیابی خسارت جرحی و بدنی'
];

export const SeniorAdminPanel: React.FC<SeniorAdminPanelProps> = ({
  session,
  onLogout,
  onSwitchPortal
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('companies');
  const [insurers, setInsurers] = useState<InsurerInfo[]>([]);
  const [experts, setExperts] = useState<Record<string, StaffMember[]>>({});
  const [reviewers, setReviewers] = useState<Record<string, StaffMember[]>>({});
  const [fieldExperts, setFieldExperts] = useState<Record<string, StaffMember[]>>({});
  const [financeStaff, setFinanceStaff] = useState<Record<string, StaffMember[]>>({});
  const [crmStaff, setCrmStaff] = useState<Record<string, StaffMember[]>>({});
  const [cases, setCases] = useState<ClaimCase[]>([]);

  // Search and Filters
  const [companySearch, setCompanySearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('all');

  // Modals state
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<InsurerInfo | null>(null);

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<{
    staff: StaffMember;
    companyCode: string;
    category: StaffRoleCategory;
  } | null>(null);

  // Success / Alert message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Company Form state
  const [companyForm, setCompanyForm] = useState<Partial<InsurerInfo>>({
    code: '',
    name: '',
    defaultPassword: '1234',
    licenseNumber: '',
    sanhabCode: '',
    phone: '',
    email: '',
    address: '',
    province: 'تهران',
    onlineWithoutCroquiCeiling: 400000000,
    onlineWithCroquiCeiling: 1200000000,
    status: 'ACTIVE',
    sanhabConnected: true,
    brandColor: 'blue',
    description: ''
  });

  // New Staff Form state
  const [staffForm, setStaffForm] = useState<{
    companyCode: string;
    category: StaffRoleCategory;
    name: string;
    role: string;
    phone: string;
    nationalId: string;
    licenseCode: string;
    maxApprovalCeiling: number;
    province: string;
    city: string;
    branchName: string;
    specialties: string[];
    password: string;
    active: boolean;
  }>({
    companyCode: 'dana',
    category: 'assessor',
    name: '',
    role: 'کارشناس ارزیاب خسارت',
    phone: '',
    nationalId: '',
    licenseCode: '',
    maxApprovalCeiling: 300000000,
    province: 'تهران',
    city: 'تهران',
    branchName: 'شعبه مرکزی',
    specialties: ['خسارت بدنه و صافکاری', 'رنگ و شاسی‌کشی'],
    password: '1234',
    active: true
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Load all data
  const refreshAllData = () => {
    setInsurers(loadInsurersFromStorage());
    setExperts(loadExpertsFromStorage());
    setReviewers(loadReviewersFromStorage());
    setFieldExperts(loadFieldExpertsFromStorage());
    setFinanceStaff(loadFinanceStaffFromStorage());
    setCrmStaff(loadCrmStaffFromStorage());
    setCases(loadCasesFromStorage());
  };

  useEffect(() => {
    refreshAllData();

    const handleInsurerUpdate = () => {
      setInsurers(loadInsurersFromStorage());
    };
    const handleStaffUpdate = () => {
      setExperts(loadExpertsFromStorage());
      setReviewers(loadReviewersFromStorage());
      setFieldExperts(loadFieldExpertsFromStorage());
      setFinanceStaff(loadFinanceStaffFromStorage());
      setCrmStaff(loadCrmStaffFromStorage());
    };

    window.addEventListener('claimflow_insurers_updated', handleInsurerUpdate);
    window.addEventListener('claimflow_staff_updated', handleStaffUpdate);

    return () => {
      window.removeEventListener('claimflow_insurers_updated', handleInsurerUpdate);
      window.removeEventListener('claimflow_staff_updated', handleStaffUpdate);
    };
  }, []);

  // Consolidate all staff across all companies
  const allStaffList = useMemo(() => {
    const list: Array<StaffMember & { companyCode: string; category: StaffRoleCategory }> = [];

    // Assessors
    Object.entries(experts).forEach(([cCode, staffArr]) => {
      const comp = insurers.find((i) => i.code === cCode);
      (staffArr || []).forEach((s) => {
        list.push({
          ...s,
          companyCode: cCode,
          companyName: comp?.name || cCode,
          category: 'assessor'
        });
      });
    });

    // Reviewers
    Object.entries(reviewers).forEach(([cCode, staffArr]) => {
      const comp = insurers.find((i) => i.code === cCode);
      (staffArr || []).forEach((s) => {
        list.push({
          ...s,
          companyCode: cCode,
          companyName: comp?.name || cCode,
          category: 'reviewer'
        });
      });
    });

    // Field Experts
    Object.entries(fieldExperts).forEach(([cCode, staffArr]) => {
      const comp = insurers.find((i) => i.code === cCode);
      (staffArr || []).forEach((s) => {
        list.push({
          ...s,
          companyCode: cCode,
          companyName: comp?.name || cCode,
          category: 'fieldexpert'
        });
      });
    });

    // Finance Staff
    Object.entries(financeStaff).forEach(([cCode, staffArr]) => {
      const comp = insurers.find((i) => i.code === cCode);
      (staffArr || []).forEach((s) => {
        list.push({
          ...s,
          companyCode: cCode,
          companyName: comp?.name || cCode,
          category: 'finance'
        });
      });
    });

    // CRM Staff
    Object.entries(crmStaff).forEach(([cCode, staffArr]) => {
      const comp = insurers.find((i) => i.code === cCode);
      (staffArr || []).forEach((s) => {
        list.push({
          ...s,
          companyCode: cCode,
          companyName: comp?.name || cCode,
          category: 'crm'
        });
      });
    });

    return list;
  }, [experts, reviewers, fieldExperts, financeStaff, crmStaff, insurers]);

  // Filtered staff list
  const filteredStaffList = useMemo(() => {
    return allStaffList.filter((s) => {
      const matchCompany = selectedCompanyFilter === 'all' || s.companyCode === selectedCompanyFilter;
      const matchRole = selectedRoleCategory === 'all' || s.category === selectedRoleCategory;
      const matchQuery =
        !staffSearch ||
        s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.phone?.includes(staffSearch) ||
        s.nationalId?.includes(staffSearch) ||
        s.licenseCode?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.companyName?.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.role?.toLowerCase().includes(staffSearch.toLowerCase());

      return matchCompany && matchRole && matchQuery;
    });
  }, [allStaffList, selectedCompanyFilter, selectedRoleCategory, staffSearch]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return insurers.filter((c) => {
      if (!companySearch) return true;
      const q = companySearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.licenseNumber?.toLowerCase().includes(q) ||
        c.sanhabCode?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.province?.toLowerCase().includes(q)
      );
    });
  }, [insurers, companySearch]);

  // Statistics
  const totalCompanies = insurers.length;
  const activeCompanies = insurers.filter((c) => c.status !== 'SUSPENDED').length;
  const totalAssessors = Object.values(experts).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalReviewers = Object.values(reviewers).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalField = Object.values(fieldExperts).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalFinance = Object.values(financeStaff).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalCrm = Object.values(crmStaff).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalAllStaff = totalAssessors + totalReviewers + totalField + totalFinance + totalCrm;

  // Handler: Save/Add Company
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.code) {
      showToast('لطفاً نام شرکت و شناسه یکتای انگلیسی را وارد کنید.');
      return;
    }

    const cleanCode = companyForm.code.trim().toLowerCase().replace(/\s+/g, '-');
    const existing = insurers.find((i) => i.code === cleanCode && (!editingCompany || editingCompany.code !== cleanCode));
    if (existing) {
      showToast(`خطا: شناسه انگلیسی «${cleanCode}» قبلاً برای شرکت ${existing.name} ثبت شده است.`);
      return;
    }

    const updatedCompany: InsurerInfo = {
      code: cleanCode,
      name: companyForm.name.trim(),
      defaultPassword: companyForm.defaultPassword || '1234',
      licenseNumber: companyForm.licenseNumber || `LIC-${cleanCode.toUpperCase()}-${new Date().getFullYear()}`,
      sanhabCode: companyForm.sanhabCode || `SNH-${cleanCode.toUpperCase()}-1001`,
      phone: companyForm.phone || '۰۲۱-۸۸۰۰۰۰۰۰',
      email: companyForm.email || `info@${cleanCode}-insurance.ir`,
      address: companyForm.address || 'تهران، خیابان ولیعصر، برج مرکزی بیمه',
      province: companyForm.province || 'تهران',
      onlineWithoutCroquiCeiling: Number(companyForm.onlineWithoutCroquiCeiling) || 400000000,
      onlineWithCroquiCeiling: Number(companyForm.onlineWithCroquiCeiling) || 1200000000,
      status: companyForm.status || 'ACTIVE',
      sanhabConnected: companyForm.sanhabConnected ?? true,
      brandColor: companyForm.brandColor || 'blue',
      activeBranchesCount: Number(companyForm.activeBranchesCount) || 12,
      establishedYear: companyForm.establishedYear || '۱۴۰۰',
      description: companyForm.description || `شرکت ${companyForm.name} با اتصال فعال به سامانه متمرکز پایش خسارت خودرو.`
    };

    let newInsurersList: InsurerInfo[];
    if (editingCompany) {
      newInsurersList = insurers.map((c) => (c.code === editingCompany.code ? updatedCompany : c));
      showToast(`اطلاعات شرکت بیمه «${updatedCompany.name}» با موفقیت به‌روزرسانی شد.`);
    } else {
      newInsurersList = [...insurers, updatedCompany];
      showToast(`شرکت بیمه جدید «${updatedCompany.name}» با موفقیت افزوده و فعال گردید.`);
    }

    saveInsurersToStorage(newInsurersList);
    setInsurers(newInsurersList);
    setIsAddCompanyModalOpen(false);
    setEditingCompany(null);
  };

  // Handler: Toggle Insurer Status
  const handleToggleCompanyStatus = (company: InsurerInfo) => {
    const newStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updated = insurers.map((c) => (c.code === company.code ? { ...c, status: newStatus as any } : c));
    saveInsurersToStorage(updated);
    setInsurers(updated);
    showToast(`وضعیت شرکت «${company.name}» به ${newStatus === 'ACTIVE' ? 'فعال' : 'تعلیق موقت'} تغییر یافت.`);
  };

  // Handler: Open Add Staff for a specific company or general
  const handleOpenAddStaff = (presetCompany?: string, presetCategory?: StaffRoleCategory) => {
    setEditingStaff(null);
    setStaffForm({
      companyCode: presetCompany || insurers[0]?.code || 'dana',
      category: presetCategory || 'assessor',
      name: '',
      role: presetCategory === 'reviewer' ? 'بازبین ارشد کیفیت' : presetCategory === 'fieldexpert' ? 'کارشناس بازدید میدانی' : presetCategory === 'finance' ? 'مدیر مالی و پرداخت' : presetCategory === 'crm' ? 'کارشناس امور مشتریان' : 'کارشناس ارزیاب خسارت',
      phone: '',
      nationalId: '',
      licenseCode: `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      maxApprovalCeiling: 350000000,
      province: 'تهران',
      city: 'تهران',
      branchName: 'شعبه مرکزی',
      specialties: ['خسارت بدنه و صافکاری', 'رنگ و شاسی‌کشی'],
      password: '1234',
      active: true
    });
    setIsAddStaffModalOpen(true);
  };

  // Handler: Edit Staff
  const handleEditStaff = (staff: StaffMember, companyCode: string, category: StaffRoleCategory) => {
    setEditingStaff({ staff, companyCode, category });
    setStaffForm({
      companyCode,
      category,
      name: staff.name,
      role: staff.role,
      phone: staff.phone || '',
      nationalId: staff.nationalId || '',
      licenseCode: staff.licenseCode || `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      maxApprovalCeiling: staff.maxApprovalCeiling || 350000000,
      province: staff.province || 'تهران',
      city: staff.city || 'تهران',
      branchName: staff.branchName || 'شعبه مرکزی',
      specialties: staff.expertise ? staff.expertise.split(', ') : ['خسارت بدنه و صافکاری'],
      password: staff.password || '1234',
      active: staff.active !== false
    });
    setIsAddStaffModalOpen(true);
  };

  // Handler: Save Staff
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.companyCode) {
      showToast('لطفاً نام کارشناس و شرکت بیمه مربوطه را مشخص نمایید.');
      return;
    }

    const comp = insurers.find((i) => i.code === staffForm.companyCode);
    const targetId = editingStaff ? editingStaff.staff.id : `stf-${staffForm.category}-${staffForm.companyCode}-${Date.now().toString().slice(-4)}`;

    const newStaffObj: StaffMember = {
      id: targetId,
      name: staffForm.name.trim(),
      role: staffForm.role.trim() || 'کارشناس رسمی',
      category: staffForm.category,
      company: staffForm.companyCode,
      companyName: comp?.name || staffForm.companyCode,
      phone: staffForm.phone.trim() || '09121112233',
      nationalId: staffForm.nationalId.trim() || '0012345678',
      licenseCode: staffForm.licenseCode.trim() || `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      maxApprovalCeiling: Number(staffForm.maxApprovalCeiling) || 300000000,
      province: staffForm.province,
      city: staffForm.city,
      branchName: staffForm.branchName,
      expertise: staffForm.specialties.join(', '),
      active: staffForm.active,
      password: staffForm.password || '1234',
      status: staffForm.active ? 'AVAILABLE' : 'INACTIVE',
      rating: editingStaff?.staff.rating || 5.0,
      activeCases: editingStaff?.staff.activeCases || 0,
      completedCases: editingStaff?.staff.completedCases || 0,
      registeredAt: editingStaff?.staff.registeredAt || new Date().toLocaleDateString('fa-IR')
    };

    // Save into the corresponding category collection
    if (staffForm.category === 'assessor') {
      const current = { ...experts };
      const list = [...(current[staffForm.companyCode] || [])];
      if (editingStaff && editingStaff.category === 'assessor') {
        const idx = list.findIndex((s) => s.id === targetId);
        if (idx >= 0) list[idx] = newStaffObj;
        else list.push(newStaffObj);
      } else {
        list.push(newStaffObj);
      }
      current[staffForm.companyCode] = list;
      saveExpertsToStorage(current);
      setExperts(current);
    } else if (staffForm.category === 'reviewer') {
      const current = { ...reviewers };
      const list = [...(current[staffForm.companyCode] || [])];
      if (editingStaff && editingStaff.category === 'reviewer') {
        const idx = list.findIndex((s) => s.id === targetId);
        if (idx >= 0) list[idx] = newStaffObj;
        else list.push(newStaffObj);
      } else {
        list.push(newStaffObj);
      }
      current[staffForm.companyCode] = list;
      saveReviewersToStorage(current);
      setReviewers(current);
    } else if (staffForm.category === 'fieldexpert') {
      const current = { ...fieldExperts };
      const list = [...(current[staffForm.companyCode] || [])];
      if (editingStaff && editingStaff.category === 'fieldexpert') {
        const idx = list.findIndex((s) => s.id === targetId);
        if (idx >= 0) list[idx] = newStaffObj;
        else list.push(newStaffObj);
      } else {
        list.push(newStaffObj);
      }
      current[staffForm.companyCode] = list;
      saveFieldExpertsToStorage(current);
      setFieldExperts(current);
    } else if (staffForm.category === 'finance') {
      const current = { ...financeStaff };
      const list = [...(current[staffForm.companyCode] || [])];
      if (editingStaff && editingStaff.category === 'finance') {
        const idx = list.findIndex((s) => s.id === targetId);
        if (idx >= 0) list[idx] = newStaffObj;
        else list.push(newStaffObj);
      } else {
        list.push(newStaffObj);
      }
      current[staffForm.companyCode] = list;
      saveFinanceStaffToStorage(current);
      setFinanceStaff(current);
    } else if (staffForm.category === 'crm') {
      const current = { ...crmStaff };
      const list = [...(current[staffForm.companyCode] || [])];
      if (editingStaff && editingStaff.category === 'crm') {
        const idx = list.findIndex((s) => s.id === targetId);
        if (idx >= 0) list[idx] = newStaffObj;
        else list.push(newStaffObj);
      } else {
        list.push(newStaffObj);
      }
      current[staffForm.companyCode] = list;
      saveCrmStaffToStorage(current);
      setCrmStaff(current);
    }

    showToast(
      editingStaff
        ? `اطلاعات «${newStaffObj.name}» با موفقیت به‌روزرسانی شد.`
        : `کارشناس جدید «${newStaffObj.name}» برای شرکت ${comp?.name} با موفقیت ثبت شد.`
    );
    setIsAddStaffModalOpen(false);
    setEditingStaff(null);
  };

  // Handler: Toggle Staff Active
  const handleToggleStaffActive = (staff: StaffMember, companyCode: string, category: StaffRoleCategory) => {
    const newActive = staff.active === false;

    const toggleInCollection = (
      collection: Record<string, StaffMember[]>,
      saver: (data: Record<string, StaffMember[]>) => void,
      setter: React.Dispatch<React.SetStateAction<Record<string, StaffMember[]>>>
    ) => {
      const copy = { ...collection };
      copy[companyCode] = (copy[companyCode] || []).map((s) =>
        s.id === staff.id ? { ...s, active: newActive, status: newActive ? 'AVAILABLE' : 'INACTIVE' } : s
      );
      saver(copy);
      setter(copy);
    };

    if (category === 'assessor') toggleInCollection(experts, saveExpertsToStorage, setExperts);
    else if (category === 'reviewer') toggleInCollection(reviewers, saveReviewersToStorage, setReviewers);
    else if (category === 'fieldexpert') toggleInCollection(fieldExperts, saveFieldExpertsToStorage, setFieldExperts);
    else if (category === 'finance') toggleInCollection(financeStaff, saveFinanceStaffToStorage, setFinanceStaff);
    else if (category === 'crm') toggleInCollection(crmStaff, saveCrmStaffToStorage, setCrmStaff);

    showToast(`وضعیت «${staff.name}» به ${newActive ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
  };

  // Handler: Impersonate / Direct Switch to Portal
  const handleImpersonate = (roleType: string, companyCode: string, targetStaff?: StaffMember) => {
    if (!onSwitchPortal) {
      showToast('امکان سوییچ مستقیم فعال نیست.');
      return;
    }

    const comp = insurers.find((i) => i.code === companyCode);
    const mockSession: UserSession = {
      role: roleType as any,
      name: targetStaff ? targetStaff.name : `مدیر ارشد ${comp?.name || companyCode}`,
      company: companyCode,
      companyName: comp?.name || companyCode,
      phone: targetStaff?.phone || '09121112233',
      branchId: targetStaff?.branchId || 'main',
      licenseCode: targetStaff?.licenseCode
    };

    let targetView = 'insurer';
    if (roleType === 'expert' || roleType === 'assessor') targetView = 'expert';
    else if (roleType === 'reviewer') targetView = 'reviewer';
    else if (roleType === 'fieldexpert') targetView = 'fieldexpert';
    else if (roleType === 'finance') targetView = 'finance';
    else if (roleType === 'crm') targetView = 'crm';

    onSwitchPortal(targetView, mockSession);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg sm:text-xl text-slate-100 tracking-tight">
                  پنل مدیریت ارشد و راهبری کلان بیمه کشور
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  مدیر سیستم (Super Admin)
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                مرکز کنترل شرکت‌های بیمه، ارزیابان، بازبینان، کادر میدانی، مالی و CRM سراسر کشور
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshAllData}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition"
              title="به‌روزرسانی داده‌ها"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">همگام‌سازی</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <XCircle className="w-4 h-4" />
              خروج از مدیریت
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* KPI High-Level Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">شرکت‌های بیمه</span>
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalCompanies}</span>
              <span className="text-[11px] font-bold text-emerald-400">{activeCompanies} فعال</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">ارزیابان آنلاین</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalAssessors}</span>
              <span className="text-[11px] font-medium text-indigo-400">کارشناس</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">بازبینان کیفیت</span>
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalReviewers}</span>
              <span className="text-[11px] font-medium text-emerald-400">ناظر عالی</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">کارشناسان میدانی</span>
              <MapPin className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalField}</span>
              <span className="text-[11px] font-medium text-amber-400">حضور در محل</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">کادر مالی و پایا</span>
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalFinance}</span>
              <span className="text-[11px] font-medium text-purple-400">تسویه خزانه‌داری</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">امور مشتریان و CRM</span>
              <PhoneCall className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalCrm}</span>
              <span className="text-[11px] font-medium text-pink-400">رسیدگی شکایات</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'companies'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              مدیریت شرکت‌های بیمه ({insurers.length})
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'staff'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              مدیریت جامع کارشناسان و پرسنل ({totalAllStaff})
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              پایش و سلامت سرویس‌ها
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'companies' && (
              <button
                onClick={() => {
                  setEditingCompany(null);
                  setCompanyForm({
                    code: '',
                    name: '',
                    defaultPassword: '1234',
                    licenseNumber: '',
                    sanhabCode: '',
                    phone: '',
                    email: '',
                    address: '',
                    province: 'تهران',
                    onlineWithoutCroquiCeiling: 400000000,
                    onlineWithCroquiCeiling: 1200000000,
                    status: 'ACTIVE',
                    sanhabConnected: true,
                    brandColor: 'blue',
                    description: ''
                  });
                  setIsAddCompanyModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                ثبت شرکت بیمه جدید
              </button>
            )}

            {activeTab === 'staff' && (
              <button
                onClick={() => handleOpenAddStaff()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
              >
                <UserPlus className="w-4 h-4" />
                ثبت کارشناس / ارزیاب / بازبین جدید
              </button>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: INSURANCE COMPANIES MANAGEMENT */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="جستجو در نام شرکت، کد یکتا، شماره پروانه..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>تعداد شرکت‌های یافت‌شده:</span>
                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">
                  {filteredCompanies.length}
                </span>
              </div>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => {
                const compExpertsCount = (experts[company.code] || []).length;
                const compReviewersCount = (reviewers[company.code] || []).length;
                const compFieldCount = (fieldExperts[company.code] || []).length;
                const compFinanceCount = (financeStaff[company.code] || []).length;
                const compCrmCount = (crmStaff[company.code] || []).length;
                const totalCompStaff =
                  compExpertsCount + compReviewersCount + compFieldCount + compFinanceCount + compCrmCount;

                return (
                  <div
                    key={company.code}
                    className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-slate-950/50"
                  >
                    <div>
                      {/* Company Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400 font-black text-lg">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-white">{company.name}</h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  company.status === 'ACTIVE'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {company.status === 'ACTIVE' ? 'فعال در سامانه' : 'معلق'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <span>شناسه: <code className="text-slate-300 font-mono">{company.code}</code></span>
                              <span>•</span>
                              <span>پروانه: <code className="text-slate-300">{company.licenseNumber || 'نامشخص'}</code></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sanhab & Ceilings */}
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-indigo-400" />
                            اتصال وب‌سرویس سنهاب:
                          </span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {company.sanhabCode || 'SNH-CONN-OK'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">سقف پرداخت بدون کروکی:</span>
                          <span className="text-amber-300 font-bold font-mono">
                            {((company.onlineWithoutCroquiCeiling || 400000000) / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">سقف پرداخت با کروکی:</span>
                          <span className="text-slate-200 font-bold font-mono">
                            {((company.onlineWithCroquiCeiling || 1200000000) / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>

                      {/* Staff breakdown pills */}
                      <div className="mb-4">
                        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
                          <span>پرسنل و کارشناسان ثبت‌شده ({totalCompStaff} نفر):</span>
                          <button
                            onClick={() => handleOpenAddStaff(company.code)}
                            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3" />
                            افزودن کارشناس
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center">
                            <span className="block text-indigo-400 font-black">{compExpertsCount}</span>
                            <span className="text-slate-400 text-[10px]">ارزیاب آنلاین</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center">
                            <span className="block text-emerald-400 font-black">{compReviewersCount}</span>
                            <span className="text-slate-400 text-[10px]">بازبین کیفیت</span>
                          </div>
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center">
                            <span className="block text-amber-400 font-black">{compFieldCount}</span>
                            <span className="text-slate-400 text-[10px]">میدانی و شعب</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact and address snippet */}
                      <div className="text-xs text-slate-400 space-y-1 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>تلفن مرکزی: {company.phone || '۰۲۱-۸۸۷۷۶۶۵۵'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{company.address || 'تهران، خیابان ولیعصر'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-slate-800/80 pt-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCompany(company);
                            setCompanyForm(company);
                            setIsAddCompanyModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1 transition"
                          title="ویرایش مشخصات"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">ویرایش</span>
                        </button>

                        <button
                          onClick={() => handleToggleCompanyStatus(company)}
                          className={`p-1.5 rounded-lg border text-[11px] font-medium transition ${
                            company.status === 'ACTIVE'
                              ? 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-800/40'
                              : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/40'
                          }`}
                        >
                          {company.status === 'ACTIVE' ? 'تعلیق موقت' : 'فعال‌سازی'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleImpersonate('insurer', company.code)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <span>ورود به پرتال</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: COMPREHENSIVE EXPERTS & STAFF MANAGEMENT */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="جستجوی نام، کدملی، شماره تلفن، کد پروانه یا شرکت..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Company Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">شرکت بیمه:</span>
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">همه شرکت‌های بیمه</option>
                    {insurers.map((comp) => (
                      <option key={comp.code} value={comp.code}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role Categories Tabs */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setSelectedRoleCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedRoleCategory === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  همه نقش‌ها ({allStaffList.length})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('assessor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'assessor'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-indigo-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  کارشناسان ارزیاب خسارت آنلاین ({totalAssessors})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('reviewer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'reviewer'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-emerald-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  بازبینان و کنترل کیفیت ({totalReviewers})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('fieldexpert')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'fieldexpert'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  کارشناسان بازدید میدانی و شعب ({totalField})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('finance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'finance'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-purple-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  مدیران مالی و پایا ({totalFinance})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('crm')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'crm'
                      ? 'bg-pink-600 text-white'
                      : 'bg-slate-900 text-pink-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  امور مشتریان و CRM ({totalCrm})
                </button>
              </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaffList.map((st) => {
                const getRoleBadge = () => {
                  switch (st.category) {
                    case 'assessor':
                      return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">ارزیاب آنلاین خسارت</span>;
                    case 'reviewer':
                      return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">بازبین و تایید نهایی</span>;
                    case 'fieldexpert':
                      return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">کارشناس میدانی و شعب</span>;
                    case 'finance':
                      return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">مدیر مالی و خزانه‌داری</span>;
                    case 'crm':
                      return <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">امور مشتریان و شکایات</span>;
                    default:
                      return <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md text-[10px]">کارشناس</span>;
                  }
                };

                return (
                  <div
                    key={`${st.companyCode}-${st.id}`}
                    className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-white">{st.name}</h3>
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                st.active !== false ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              title={st.active !== false ? 'فعال' : 'غیرفعال'}
                            />
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {st.role} • <span className="text-blue-400 font-semibold">{st.companyName}</span>
                          </div>
                        </div>

                        {getRoleBadge()}
                      </div>

                      {/* Info grid */}
                      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/80 text-xs space-y-1.5 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">شماره پروانه / نظام:</span>
                          <code className="text-indigo-300 font-mono font-bold">
                            {st.licenseCode || 'EXP-OFFICIAL'}
                          </code>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">کد ملی:</span>
                          <span className="text-slate-300 font-mono">{st.nationalId || '۰۴۹۰۱۲۳۴۵۶'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">شماره موبایل:</span>
                          <span className="text-slate-300 font-mono">{st.phone || '۰۹۱۲۱۱۱۲۲۳۳'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">سقف اختیار ریالی:</span>
                          <span className="text-amber-300 font-bold font-mono">
                            {((st.maxApprovalCeiling || 350000000) / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">موقعیت و شعبه:</span>
                          <span className="text-slate-300">
                            {st.province || 'تهران'} - {st.branchName || 'شعبه مرکزی'}
                          </span>
                        </div>
                      </div>

                      {/* Specialties / Expertise tags */}
                      {st.expertise && (
                        <div className="mb-4">
                          <span className="text-[10px] text-slate-400 block mb-1">تخصص‌ها:</span>
                          <div className="flex flex-wrap gap-1">
                            {st.expertise.split(', ').map((exp, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[10px]"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-800/80 pt-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditStaff(st, st.companyCode, st.category)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs flex items-center gap-1 transition"
                          title="ویرایش اطلاعات"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">ویرایش</span>
                        </button>

                        <button
                          onClick={() => handleToggleStaffActive(st, st.companyCode, st.category)}
                          className={`p-1.5 rounded-lg border text-[11px] font-medium transition ${
                            st.active !== false
                              ? 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-800/40'
                              : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/40'
                          }`}
                        >
                          {st.active !== false ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleImpersonate(st.category, st.companyCode, st)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                        title="ورود به کارتابل این کارشناس جهت تست و بررسی"
                      >
                        <span>ورود به کارتابل</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: OVERVIEW & SYSTEM HEALTH */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SANHAB & Police Core Link Health */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Server className="w-4 h-4" />
                  <span>وضعیت اتصال هسته سنهاب و وب‌سرویس فراجا</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">وب‌سرویس استعلام بیمه‌نامه سنهاب (مرکزی):</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      پایدار (۹۹.۹٪)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">وب‌سرویس استعلام پلاک و تصادفات فراجا:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      متصل و برخط
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">سوئیچ حواله الکترونیک پایا/ساتنا بانکی:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      آماده صدور دستور پرداخت
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-300">موتور هوش مصنوعی ارزیابی خسارت بدنه:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      دقت ۹۴.۲٪
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Summary of cases */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Activity className="w-4 h-4" />
                    <span>خلاصه عملکرد شرکت‌های بیمه در پرونده‌های جاری</span>
                  </div>
                  <span className="text-xs text-slate-400">مجموع پرونده‌های ثبت‌شده: {cases.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">شرکت بیمه</th>
                        <th className="py-2.5 px-3">ارزیابان فعال</th>
                        <th className="py-2.5 px-3">بازبینان</th>
                        <th className="py-2.5 px-3">سقف بدون کروکی</th>
                        <th className="py-2.5 px-3">وضعیت سامانه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-slate-300">
                      {insurers.map((comp) => {
                        const countExp = (experts[comp.code] || []).length;
                        const countRev = (reviewers[comp.code] || []).length;
                        return (
                          <tr key={comp.code} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-blue-400" />
                              {comp.name}
                            </td>
                            <td className="py-2.5 px-3">{countExp} کارشناس</td>
                            <td className="py-2.5 px-3">{countRev} بازبین</td>
                            <td className="py-2.5 px-3 font-mono text-amber-300">
                              {((comp.onlineWithoutCroquiCeiling || 400000000) / 10).toLocaleString('fa-IR')} تومان
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                فعال و متصل
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT INSURANCE COMPANY */}
      {/* ==================================================== */}
      {isAddCompanyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {editingCompany ? `ویرایش اطلاعات ${editingCompany.name}` : 'افزودن شرکت بیمه جدید به سامانه'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    تعریف شناسه، مشخصات حقوقی، سقف‌های پرداخت و اتصال وب‌سرویس سنهاب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCompanyModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام کامل شرکت بیمه *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بیمه سامان، بیمه رازی..."
                    value={companyForm.name || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    کد یکتای انگلیسی (شناسه سیستمی) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCompany}
                    placeholder="مثال: saman, razi, kowsar"
                    value={companyForm.code || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })}
                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 ${
                      editingCompany ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره پروانه بیمه مرکزی</label>
                  <input
                    type="text"
                    placeholder="مثال: LIC-SAM-1383"
                    value={companyForm.licenseNumber || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, licenseNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">کد اتصال وب‌سرویس سنهاب</label>
                  <input
                    type="text"
                    placeholder="مثال: SNH-SAMAN-9001"
                    value={companyForm.sanhabCode || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, sanhabCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    سقف مجاز ارزیابی بدون کروکی (ریال)
                  </label>
                  <input
                    type="number"
                    step="10000000"
                    placeholder="400000000"
                    value={companyForm.onlineWithoutCroquiCeiling || 400000000}
                    onChange={(e) => setCompanyForm({ ...companyForm, onlineWithoutCroquiCeiling: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    معادل: {(((companyForm.onlineWithoutCroquiCeiling || 0) / 10)).toLocaleString('fa-IR')} تومان
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    سقف مجاز ارزیابی با کروکی (ریال)
                  </label>
                  <input
                    type="number"
                    step="10000000"
                    placeholder="1200000000"
                    value={companyForm.onlineWithCroquiCeiling || 1200000000}
                    onChange={(e) => setCompanyForm({ ...companyForm, onlineWithCroquiCeiling: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    معادل: {(((companyForm.onlineWithCroquiCeiling || 0) / 10)).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره تلفن پشتیبانی مرکزی</label>
                  <input
                    type="text"
                    placeholder="۰۲۱-۸۸۰۰۰۰۰۰"
                    value={companyForm.phone || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">کلمه عبور پیش‌فرض ورود پرسنل</label>
                  <input
                    type="text"
                    placeholder="1234"
                    value={companyForm.defaultPassword || '1234'}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultPassword: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">نشانی دفتر مرکزی</label>
                <input
                  type="text"
                  placeholder="تهران، خیابان ولیعصر، برج مرکزی بیمه"
                  value={companyForm.address || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingCompany ? 'ذخیره تغییرات شرکت' : 'ثبت و راه‌اندازی شرکت بیمه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: ADD / EDIT EXPERT, ASSESSOR, REVIEWER, STAFF */}
      {/* ==================================================== */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {editingStaff
                      ? `ویرایش کارشناس «${editingStaff.staff.name}»`
                      : 'ثبت کارشناس / ارزیاب / بازبین جدید'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    تعیین شرکت بیمه متبوع، نقش سازمانی، پروانه نظام کارشناسی و اختیارات مالی
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">شرکت بیمه متبوع *</label>
                  <select
                    value={staffForm.companyCode}
                    onChange={(e) => setStaffForm({ ...staffForm, companyCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {insurers.map((comp) => (
                      <option key={comp.code} value={comp.code}>
                        {comp.name} ({comp.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نقش و مسئولیت سازمانی *</label>
                  <select
                    value={staffForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as StaffRoleCategory;
                      let roleTitle = 'کارشناس ارزیاب خسارت';
                      if (cat === 'reviewer') roleTitle = 'بازبین ارشد کیفیت و کنترل خسارت';
                      else if (cat === 'fieldexpert') roleTitle = 'کارشناس بازدید میدانی و شعب';
                      else if (cat === 'finance') roleTitle = 'مدیر مالی و صدور حواله پایا';
                      else if (cat === 'crm') roleTitle = 'کارشناس امور مشتریان و شکایات';

                      setStaffForm({ ...staffForm, category: cat, role: roleTitle });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="assessor">🟢 کارشناس ارزیاب خسارت آنلاین (Assessor)</option>
                    <option value="reviewer">🔵 بازبین و تایید نهایی کیفیت (Reviewer)</option>
                    <option value="fieldexpert">🟠 کارشناس بازدید میدانی و شعب (Field Inspector)</option>
                    <option value="finance">🟣 مدیر مالی و تسویه خزانه‌داری (Finance)</option>
                    <option value="crm">🟤 کارشناس امور مشتریان و شکایات (CRM & Support)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: دکتر آرش سرمدی"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان دقیق سمت</label>
                  <input
                    type="text"
                    placeholder="مثال: کارشناس ارشد خسارت بدنه"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">کد ملی (۱۰ رقم)</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0012345678"
                    value={staffForm.nationalId}
                    onChange={(e) => setStaffForm({ ...staffForm, nationalId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره موبایل (جهت ورود)</label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="09121112233"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">شماره پروانه رسمی ارزیابی</label>
                  <input
                    type="text"
                    placeholder="EXP-90802"
                    value={staffForm.licenseCode}
                    onChange={(e) => setStaffForm({ ...staffForm, licenseCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">سقف مجاز اختیار ریالی</label>
                  <input
                    type="number"
                    step="10000000"
                    value={staffForm.maxApprovalCeiling}
                    onChange={(e) => setStaffForm({ ...staffForm, maxApprovalCeiling: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {((staffForm.maxApprovalCeiling || 0) / 10).toLocaleString('fa-IR')} تومان
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">استان / شهر</label>
                  <input
                    type="text"
                    placeholder="تهران / تهران"
                    value={staffForm.city}
                    onChange={(e) => setStaffForm({ ...staffForm, city: e.target.value, province: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام شعبه</label>
                  <input
                    type="text"
                    placeholder="شعبه ونک"
                    value={staffForm.branchName}
                    onChange={(e) => setStaffForm({ ...staffForm, branchName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Specialties Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">تخصص‌های فنی کارشناس</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SPECIALTIES_LIST.map((spec) => {
                    const isChecked = staffForm.specialties.includes(spec);
                    return (
                      <button
                        type="button"
                        key={spec}
                        onClick={() => {
                          if (isChecked) {
                            setStaffForm({
                              ...staffForm,
                              specialties: staffForm.specialties.filter((s) => s !== spec)
                            });
                          } else {
                            setStaffForm({
                              ...staffForm,
                              specialties: [...staffForm.specialties, spec]
                            });
                          }
                        }}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-medium text-right border flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate">{spec}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="staffActiveChk"
                    checked={staffForm.active}
                    onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="staffActiveChk" className="text-xs text-slate-300 cursor-pointer">
                    کارشناس بلافاصله فعال و مجاز به دریافت ارجاعات پرونده شود
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {editingStaff ? 'ذخیره مشخصات کارشناس' : 'ثبت قطعی و صدور مجوز'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SeniorAdminPanel;
