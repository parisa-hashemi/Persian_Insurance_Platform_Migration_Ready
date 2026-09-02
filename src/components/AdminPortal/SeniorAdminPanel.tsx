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
  Server,
  FileText,
  Calendar,
  CreditCard,
  Headphones,
  Download,
  Car,
  AlertCircle,
  Camera,
  UserCheck,
  BarChart3,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  FileCheck,
  LogIn,
  X
} from 'lucide-react';
import {
  InsurerInfo,
  StaffMember,
  StaffRoleCategory,
  UserSession,
  ClaimCase,
  CompanyRegistrationRequest
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
  loadCasesFromStorage,
  saveCasesToStorage,
  isCaseBelongingToInsurer,
  getInsurerPersianName,
  loadCompanyRequestsFromStorage,
  saveCompanyRequestsToStorage,
  approveCompanyRegistrationRequest,
  rejectCompanyRegistrationRequest
} from '../../lib/storage';

interface SeniorAdminPanelProps {
  session?: UserSession;
  onLogout: () => void;
  onSwitchPortal?: (targetView: string, targetSession?: UserSession) => void;
}

type AdminTab = 'requests' | 'companies' | 'staff' | 'cases' | 'overview';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [insurers, setInsurers] = useState<InsurerInfo[]>([]);
  const [companyRequests, setCompanyRequests] = useState<CompanyRegistrationRequest[]>([]);
  const [experts, setExperts] = useState<Record<string, StaffMember[]>>({});
  const [reviewers, setReviewers] = useState<Record<string, StaffMember[]>>({});
  const [fieldExperts, setFieldExperts] = useState<Record<string, StaffMember[]>>({});
  const [financeStaff, setFinanceStaff] = useState<Record<string, StaffMember[]>>({});
  const [crmStaff, setCrmStaff] = useState<Record<string, StaffMember[]>>({});
  const [cases, setCases] = useState<ClaimCase[]>([]);

  // Requests Tab State & Filters
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [inspectingRequest, setInspectingRequest] = useState<CompanyRegistrationRequest | null>(null);
  const [rejectionModalRequest, setRejectionModalRequest] = useState<CompanyRegistrationRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Search and Filters
  const [companySearch, setCompanySearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('all');

  // Cases Tab Filters
  const [caseSearch, setCaseSearch] = useState('');
  const [caseCompanyFilter, setCaseCompanyFilter] = useState<string>('all');
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>('all');
  const [caseTypeFilter, setCaseTypeFilter] = useState<string>('all');
  const [inspectingCase, setInspectingCase] = useState<ClaimCase | null>(null);

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
    setCompanyRequests(loadCompanyRequestsFromStorage());
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
    const handleRequestsUpdate = () => {
      setCompanyRequests(loadCompanyRequestsFromStorage());
    };
    const handleStaffUpdate = () => {
      setExperts(loadExpertsFromStorage());
      setReviewers(loadReviewersFromStorage());
      setFieldExperts(loadFieldExpertsFromStorage());
      setFinanceStaff(loadFinanceStaffFromStorage());
      setCrmStaff(loadCrmStaffFromStorage());
    };
    const handleCaseUpdate = () => {
      setCases(loadCasesFromStorage());
    };

    window.addEventListener('claimflow_insurers_updated', handleInsurerUpdate);
    window.addEventListener('claimflow_company_requests_updated', handleRequestsUpdate);
    window.addEventListener('claimflow_staff_updated', handleStaffUpdate);
    window.addEventListener('storage', refreshAllData);

    return () => {
      window.removeEventListener('claimflow_insurers_updated', handleInsurerUpdate);
      window.removeEventListener('claimflow_company_requests_updated', handleRequestsUpdate);
      window.removeEventListener('claimflow_staff_updated', handleStaffUpdate);
      window.removeEventListener('storage', refreshAllData);
    };
  }, []);

  // Consolidate all staff across all companies
  const allStaffList = useMemo(() => {
    const list: Array<StaffMember & { companyCode: string; category: StaffRoleCategory }> = [];

    // Assessors
    (Object.entries(experts) as [string, StaffMember[]][]).forEach(([cCode, staffArr]) => {
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
    (Object.entries(reviewers) as [string, StaffMember[]][]).forEach(([cCode, staffArr]) => {
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
    (Object.entries(fieldExperts) as [string, StaffMember[]][]).forEach(([cCode, staffArr]) => {
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
    (Object.entries(financeStaff) as [string, StaffMember[]][]).forEach(([cCode, staffArr]) => {
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
    (Object.entries(crmStaff) as [string, StaffMember[]][]).forEach(([cCode, staffArr]) => {
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

  // Filtered Cases for Cases Tab
  const filteredCasesList = useMemo(() => {
    return cases.filter((c) => {
      // Company match (Strict Multi-tenant isolation helper)
      const matchCompany =
        caseCompanyFilter === 'all' ||
        isCaseBelongingToInsurer(c, caseCompanyFilter) ||
        c.insurerId === caseCompanyFilter ||
        c.thirdPartyInsurerId === caseCompanyFilter ||
        c.bodyInsuranceCompany === caseCompanyFilter;

      // Status match
      let matchStatus = true;
      if (caseStatusFilter !== 'all') {
        matchStatus = c.status === caseStatusFilter;
      }

      // Type match (bodily vs third party)
      let matchType = true;
      if (caseTypeFilter === 'bodily') {
        matchType = !!(c.isBodyClaim || c.isBodily || c.id?.startsWith('BD-'));
      } else if (caseTypeFilter === 'thirdparty') {
        matchType = !(c.isBodyClaim || c.isBodily || c.id?.startsWith('BD-'));
      }

      // Query match
      const q = caseSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.trackingCode?.toLowerCase().includes(q) ||
        c.claimantNationalId?.includes(q) ||
        c.claimantPhone?.includes(q) ||
        c.atFaultNationalId?.includes(q) ||
        c.policyNumber?.toLowerCase().includes(q) ||
        c.claimantName?.toLowerCase().includes(q) ||
        c.atFaultName?.toLowerCase().includes(q) ||
        c.victimName?.toLowerCase().includes(q) ||
        c.culpritName?.toLowerCase().includes(q) ||
        c.claimantPlate?.includes(q) ||
        c.atFaultPlate?.includes(q) ||
        c.victimPlate?.includes(q) ||
        c.culpritPlate?.includes(q) ||
        c.carModel?.toLowerCase().includes(q) ||
        c.victimVehicle?.toLowerCase().includes(q) ||
        c.culpritVehicle?.toLowerCase().includes(q) ||
        c.insurerName?.toLowerCase().includes(q);

      return matchCompany && matchStatus && matchType && matchQuery;
    });
  }, [cases, caseCompanyFilter, caseStatusFilter, caseTypeFilter, caseSearch]);

  // Requests Statistics & Filtering
  const pendingRequestsCount = useMemo(() => {
    return companyRequests.filter((r) => r.status === 'PENDING').length;
  }, [companyRequests]);

  const filteredRequests = useMemo(() => {
    return companyRequests.filter((r) => {
      if (requestStatusFilter !== 'all' && r.status !== requestStatusFilter) {
        return false;
      }
      if (!requestSearch) return true;
      const q = requestSearch.toLowerCase().trim();
      return (
        r.companyName.toLowerCase().includes(q) ||
        r.companyCode.toLowerCase().includes(q) ||
        r.adminName.toLowerCase().includes(q) ||
        r.adminNationalId.includes(q) ||
        r.adminPhone.includes(q) ||
        r.economicCode.includes(q) ||
        r.registrationNumber.includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [companyRequests, requestStatusFilter, requestSearch]);

  const handleApproveRequest = (request: CompanyRegistrationRequest) => {
    const result = approveCompanyRegistrationRequest(request.id, session?.name || 'مدیر کل سامانه');
    if (result.success) {
      showToast(`شرکت «${request.companyName}» با موفقیت تایید و حساب مدیر ارشد (${request.adminName}) فعال شد.`);
      refreshAllData();
      if (inspectingRequest?.id === request.id) {
        setInspectingRequest(null);
      }
    } else {
      showToast(result.message);
    }
  };

  const handleOpenRejectModal = (request: CompanyRegistrationRequest) => {
    setRejectionModalRequest(request);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = () => {
    if (!rejectionModalRequest) return;
    if (!rejectionReasonInput.trim()) {
      showToast('لطفاً دلیل عدم تایید درخواست را مرقوم فرمایید.');
      return;
    }
    const result = rejectCompanyRegistrationRequest(
      rejectionModalRequest.id,
      rejectionReasonInput.trim(),
      session?.name || 'مدیر کل سامانه'
    );
    if (result.success) {
      showToast(`درخواست شرکت «${rejectionModalRequest.companyName}» رد شد.`);
      refreshAllData();
      setRejectionModalRequest(null);
      if (inspectingRequest?.id === rejectionModalRequest.id) {
        setInspectingRequest(null);
      }
    } else {
      showToast(result.message);
    }
  };

  // Statistics
  const totalCompanies = insurers.length;
  const activeCompanies = insurers.filter((c) => c.status !== 'SUSPENDED').length;
  const totalAssessors = (Object.values(experts) as StaffMember[][]).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalReviewers = (Object.values(reviewers) as StaffMember[][]).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalField = (Object.values(fieldExperts) as StaffMember[][]).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalFinance = (Object.values(financeStaff) as StaffMember[][]).reduce((acc, curr) => acc + (curr?.length || 0), 0);
  const totalCrm = (Object.values(crmStaff) as StaffMember[][]).reduce((acc, curr) => acc + (curr?.length || 0), 0);
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
      id: targetStaff ? targetStaff.id : `admin-${companyCode}-${roleType}`,
      role: roleType as any,
      name: targetStaff ? targetStaff.name : `مدیر ${comp?.name || companyCode}`,
      company: companyCode,
      companyName: comp?.name || companyCode,
      phone: targetStaff?.phone || '09121112233',
      branchId: targetStaff?.branchId || 'main',
      licenseCode: targetStaff?.licenseCode
    };

    let targetView = 'insurer';
    if (roleType === 'expert' || roleType === 'assessor') targetView = 'assessor';
    else if (roleType === 'reviewer') targetView = 'reviewer';
    else if (roleType === 'fieldexpert') targetView = 'fieldexpert';
    else if (roleType === 'finance') targetView = 'finance';
    else if (roleType === 'crm') targetView = 'crm';

    onSwitchPortal(targetView, mockSession);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_EXPERT':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">در انتظار ارزیابی کارشناس</span>;
      case 'FIELD_VISIT_REQUIRED':
        return <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">ارجاع به بازدید میدانی</span>;
      case 'PENDING_REVIEW':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">در انتظار تایید بازبین کیفیت</span>;
      case 'PENDING_PAYOUT':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full text-[11px] font-bold">در صف واریز شبا و صدور حواله</span>;
      case 'PAID':
      case 'SETTLED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold">تسویه و پرداخت کامل</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-1 rounded-full text-[11px] font-bold">مردود شده</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-full text-[11px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans pb-16" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-700 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-900/20 text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg sm:text-xl text-blue-900 tracking-tight">
                  پنل مدیریت ارشد و راهبری کلان بیمه کشور
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-600" />
                  مدیر سیستم (Super Admin)
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                مرکز کنترل شرکت‌های بیمه، ارزیابان، بازبینان، کادر میدانی، مالی، CRM و پرونده‌های خسارت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={refreshAllData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              title="به‌روزرسانی داده‌ها"
            >
              <RefreshCw className="w-4 h-4 text-blue-700" />
              <span className="hidden md:inline">همگام‌سازی داده‌ها</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              خروج از مدیریت
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* KPI High-Level Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">شرکت‌های بیمه</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{totalCompanies}</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">{activeCompanies} فعال</span>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">ارزیابان خسارت</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{totalAssessors}</span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">کارشناس آنلاین</span>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">بازبینان کیفیت</span>
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{totalReviewers}</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">ناظر کیفی</span>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">کارشناسان میدانی</span>
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{totalField}</span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">حضور در محل</span>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">کادر مالی و پایا</span>
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{totalFinance}</span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">تسویه خزانه‌داری</span>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold">کل پرونده‌های ثبت‌شده</span>
              <FileText className="w-4 h-4 text-pink-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{cases.length}</span>
              <span className="text-[11px] font-bold text-pink-700 bg-pink-50 px-1.5 py-0.5 rounded-md border border-pink-200">پرونده فعال</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-6">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              <FileCheck className="w-4 h-4 text-amber-200" />
              درخواست‌های ثبت شرکت
              {pendingRequestsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                  {pendingRequestsCount} جدید
                </span>
              ) : (
                <span className="text-[11px] opacity-70">({companyRequests.length})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'companies'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              شرکت‌های بیمه و مدیران ارشد ({insurers.length})
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              <Users className="w-4 h-4" />
              مدیریت کارشناسان کل شبکه ({totalAllStaff})
            </button>

            <button
              onClick={() => setActiveTab('cases')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'cases'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              مانیتورینگ کل پرونده‌ها ({cases.length})
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/80'
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-900/20 transition"
              >
                <PlusCircle className="w-4 h-4" />
                ثبت شرکت بیمه جدید
              </button>
            )}

            {activeTab === 'staff' && (
              <button
                onClick={() => handleOpenAddStaff()}
                className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-700/20 transition"
              >
                <UserPlus className="w-4 h-4" />
                ثبت کارشناس / ارزیاب جدید
              </button>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 0: COMPANY REGISTRATION REQUESTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Header info banner */}
            <div className="bg-gradient-to-r from-amber-50 via-white to-blue-50 border-2 border-amber-200 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      کارتابل بررسی و تایید صلاحیت شرکت‌های بیمه متقاضی
                      <span className="text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                        سطح ۱: مدیر کل سامانه (Super Admin)
                      </span>
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                      بررسی مدارک هویتی و حقوقی، روزنامه رسمی، پروانه فعالیت بیمه مرکزی و فعال‌سازی حساب کاربری مدیران ارشد شرکت‌های بیمه
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-slate-500 font-bold">در انتظار بررسی:</span>
                    <span className="text-amber-700 font-black text-sm">{pendingRequestsCount}</span>
                  </div>
                  <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 shadow-xs">
                    <span className="text-slate-500 font-bold">کل درخواست‌ها:</span>
                    <span className="text-slate-800 font-black text-sm">{companyRequests.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setRequestStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    requestStatusFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  همه ({companyRequests.length})
                </button>
                <button
                  onClick={() => setRequestStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    requestStatusFilter === 'PENDING'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  در انتظار بررسی ({pendingRequestsCount})
                </button>
                <button
                  onClick={() => setRequestStatusFilter('APPROVED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    requestStatusFilter === 'APPROVED'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                  }`}
                >
                  تایید شده ({companyRequests.filter((r) => r.status === 'APPROVED').length})
                </button>
                <button
                  onClick={() => setRequestStatusFilter('REJECTED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    requestStatusFilter === 'REJECTED'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300'
                  }`}
                >
                  رد شده ({companyRequests.filter((r) => r.status === 'REJECTED').length})
                </button>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="جستجو در نام شرکت، مدیر ارشد، کد ملی، شماره ثبت..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
                <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">هیچ درخواستی با فیلترهای انتخابی یافت نشد.</p>
                <p className="text-xs text-slate-500 mt-1">
                  شرکت‌های جدید می‌توانند از طریق صفحه ورود و گزینه «ثبت‌نام شرکت بیمه جدید» درخواست خود را ارسال نمایند.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`bg-white border-2 rounded-2xl p-5 transition shadow-xs ${
                      req.status === 'PENDING'
                        ? 'border-amber-400 bg-amber-50/30'
                        : req.status === 'APPROVED'
                        ? 'border-emerald-300'
                        : 'border-rose-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-900 font-black text-sm">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900">{req.companyName}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs border border-slate-300 font-bold">
                              {req.companyCode}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5 font-medium">
                            <span>شناسه درخواست: <span className="font-mono text-slate-700">{req.id}</span></span>
                            <span>•</span>
                            <span>تاریخ ثبت: <span className="text-slate-700">{req.createdAt}</span></span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {req.status === 'PENDING' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            در انتظار بررسی و تایید
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تایید شده و فعال
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5" />
                            رد شده
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details 3-column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 text-xs">
                      {/* Column 1: Company Info */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 text-blue-900">
                          <Building2 className="w-3.5 h-3.5" />
                          مشخصات ثبتی شرکت
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>کد اقتصادی:</span>
                          <span className="text-slate-800 font-mono font-bold">{req.economicCode}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>شماره ثبت:</span>
                          <span className="text-slate-800 font-mono font-bold">{req.registrationNumber}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>پروانه بیمه مرکزی:</span>
                          <span className="text-slate-800 font-mono font-bold">{req.licenseNumber || 'استعلام برخط'}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>استان و شهر:</span>
                          <span className="text-slate-800 font-bold">{req.province} - {req.city}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>تلفن دفتر مرکزی:</span>
                          <span className="text-slate-800 font-mono font-bold">{req.companyPhone}</span>
                        </div>
                      </div>

                      {/* Column 2: Senior Admin Info */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 text-indigo-900">
                          <Users className="w-3.5 h-3.5" />
                          مشخصات مدیر ارشد متقاضی
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>نام مدیر ارشد:</span>
                          <span className="text-slate-900 font-bold">{req.adminName}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>کد ملی مدیر:</span>
                          <span className="text-amber-800 font-mono font-bold">{req.adminNationalId}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>شماره همراه:</span>
                          <span className="text-slate-800 font-mono font-bold">{req.adminPhone}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-medium">
                          <span>ایمیل سازمانی:</span>
                          <span className="text-slate-800 font-mono font-bold truncate max-w-[150px]">{req.adminEmail}</span>
                        </div>
                        <div className="pt-1 text-[11px] text-slate-500">
                          🔑 با تایید این درخواست، پنل مدیریت شرکت برای این کد ملی فعال می‌گردد.
                        </div>
                      </div>

                      {/* Column 3: Documents */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <div className="font-bold text-slate-800 border-b border-slate-200 pb-1.5 flex items-center gap-1.5 text-amber-800">
                          <FileText className="w-3.5 h-3.5" />
                          مستندات و مجوزهای بارگذاری‌شده
                        </div>
                        <div className="space-y-1.5 pt-0.5">
                          <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 truncate font-medium">روزنامه رسمی شرکت</span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              {req.officialGazetteFileName || 'ضمیمه شده'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 truncate font-medium">معرفی‌نامه مدیر ارشد</span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              {req.introLetterFileName || 'ضمیمه شده'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-700 truncate font-medium">پروانه بیمه مرکزی</span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              {req.licenseDocFileName || 'ضمیمه شده'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rejection reason note if rejected */}
                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <div className="mt-2 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">دلیل رد درخواست:</span> {req.rejectionReason}
                          <span className="text-rose-600 text-[11px] block mt-0.5">
                            (بررسی شده توسط {req.reviewedBy} در {req.reviewedAt})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 font-medium">
                        {req.status === 'APPROVED' && (
                          <span className="text-emerald-700 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            تایید شده توسط {req.reviewedBy} ({req.reviewedAt})
                          </span>
                        )}
                        {req.status === 'PENDING' && (
                          <span className="text-amber-800 flex items-center gap-1 font-bold">
                            <AlertCircle className="w-4 h-4" />
                            نیاز به بررسی مدارک و تایید صلاحیت توسط مدیر کل سامانه
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleOpenRejectModal(req)}
                              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                            >
                              <XCircle className="w-4 h-4" />
                              رد درخواست
                            </button>
                            <button
                              onClick={() => handleApproveRequest(req)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              تایید و فعال‌سازی فوری حساب مدیر ارشد
                            </button>
                          </>
                        )}

                        {req.status === 'APPROVED' && (
                          <button
                            onClick={() => handleImpersonate('insurer', req.companyCode)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                          >
                            <LogIn className="w-4 h-4" />
                            ورود به پنل این شرکت
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: INSURANCE COMPANIES MANAGEMENT */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  placeholder="جستجو در نام شرکت، کد یکتا، شماره پروانه..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-2">
                <span>تعداد شرکت‌های ثبت‌شده:</span>
                <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
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
                const compCasesCount = cases.filter(
                  (c) => c.insurerId === company.code || c.thirdPartyInsurerId === company.code || c.bodyInsuranceCompany === company.code
                ).length;

                return (
                  <div
                    key={company.code}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md shadow-sm"
                  >
                    <div>
                      {/* Company Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-lg">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-slate-900">{company.name}</h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  company.status === 'ACTIVE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {company.status === 'ACTIVE' ? 'فعال در سامانه' : 'معلق'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span>شناسه: <code className="text-slate-700 font-mono font-bold">{company.code}</code></span>
                              <span>•</span>
                              <span>پرونده‌ها: <strong className="text-blue-700">{compCasesCount}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sanhab & Ceilings */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-blue-600" />
                            کد وب‌سرویس سنهاب:
                          </span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px] font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {company.sanhabCode || 'SNH-CONN-OK'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">سقف بدون کروکی:</span>
                          <span className="text-slate-900 font-bold font-mono">
                            {((company.onlineWithoutCroquiCeiling || 400000000) / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">سقف با کروکی:</span>
                          <span className="text-slate-900 font-bold font-mono">
                            {((company.onlineWithCroquiCeiling || 1200000000) / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>

                      {/* Staff breakdown pills */}
                      <div className="mb-4">
                        <div className="text-xs text-slate-600 mb-2 flex items-center justify-between">
                          <span>پرسنل ثبت‌شده ({totalCompStaff} نفر):</span>
                          <button
                            onClick={() => handleOpenAddStaff(company.code)}
                            className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                          >
                            <PlusCircle className="w-3 h-3" />
                            افزودن کارشناس
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center">
                            <span className="block text-indigo-700 font-black">{compExpertsCount}</span>
                            <span className="text-slate-500 text-[10px]">ارزیاب آنلاین</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center">
                            <span className="block text-emerald-700 font-black">{compReviewersCount}</span>
                            <span className="text-slate-500 text-[10px]">بازبین کیفیت</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center">
                            <span className="block text-amber-700 font-black">{compFieldCount}</span>
                            <span className="text-slate-500 text-[10px]">میدانی و شعب</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact and address snippet */}
                      <div className="text-xs text-slate-500 space-y-1 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>تلفن مرکزی: {company.phone || '۰۲۱-۸۸۷۷۶۶۵۵'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{company.address || 'تهران، خیابان ولیعصر'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingCompany(company);
                            setCompanyForm(company);
                            setIsAddCompanyModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs flex items-center gap-1 transition"
                          title="ویرایش مشخصات"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">ویرایش</span>
                        </button>

                        <button
                          onClick={() => handleToggleCompanyStatus(company)}
                          className={`p-1.5 rounded-lg border text-[11px] font-medium transition ${
                            company.status === 'ACTIVE'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {company.status === 'ACTIVE' ? 'تعلیق موقت' : 'فعال‌سازی'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleImpersonate('insurer', company.code)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold flex items-center gap-1.5 transition"
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="جستجوی نام، کدملی، شماره تلفن، کد پروانه یا شرکت..."
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                {/* Company Filter Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">شرکت بیمه:</span>
                  <select
                    value={selectedCompanyFilter}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
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
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedRoleCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedRoleCategory === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  همه نقش‌ها ({allStaffList.length})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('assessor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'assessor'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  ارزیابان خسارت آنلاین ({totalAssessors})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('reviewer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'reviewer'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  بازبینان کیفیت ({totalReviewers})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('fieldexpert')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'fieldexpert'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  کارشناسان میدانی و شعب ({totalField})
                </button>
                <button
                  onClick={() => setSelectedRoleCategory('finance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    selectedRoleCategory === 'finance'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
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
                      : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200'
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
                      return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-bold">ارزیاب آنلاین خسارت</span>;
                    case 'reviewer':
                      return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">بازبین و تایید نهایی</span>;
                    case 'fieldexpert':
                      return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">کارشناس میدانی و شعب</span>;
                    case 'finance':
                      return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold">مدیر مالی و خزانه‌داری</span>;
                    case 'crm':
                      return <span className="bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-md text-[10px] font-bold">امور مشتریان و شکایات</span>;
                    default:
                      return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[10px]">کارشناس</span>;
                  }
                };

                return (
                  <div
                    key={`${st.companyCode}-${st.id}`}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-sm"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900">{st.name}</h3>
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                st.active !== false ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                              title={st.active !== false ? 'فعال' : 'غیرفعال'}
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {st.role} • <span className="text-blue-700 font-semibold">{st.companyName}</span>
                          </div>
                        </div>

                        {getRoleBadge()}
                      </div>

                      {/* Info grid */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1.5 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">شماره پروانه / نظام:</span>
                          <code className="text-indigo-700 font-mono font-bold">
                            {st.licenseCode || 'EXP-OFFICIAL'}
                          </code>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">کد ملی:</span>
                          <span className="text-slate-700 font-mono">{st.nationalId || '۰۴۹۰۱۲۳۴۵۶'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">شماره موبایل:</span>
                          <span className="text-slate-700 font-mono">{st.phone || '۰۹۱۲۱۱۱۲۲۳۳'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">سقف اختیار ریالی:</span>
                          <span className="text-slate-900 font-bold font-mono">
                            {((st.maxApprovalCeiling || 350000000) / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">موقعیت و شعبه:</span>
                          <span className="text-slate-700">
                            {st.province || 'تهران'} - {st.branchName || 'شعبه مرکزی'}
                          </span>
                        </div>
                      </div>

                      {/* Specialties / Expertise tags */}
                      {st.expertise && (
                        <div className="mb-4">
                          <span className="text-[10px] text-slate-500 block mb-1">تخصص‌ها:</span>
                          <div className="flex flex-wrap gap-1">
                            {st.expertise.split(', ').map((exp, idx) => (
                              <span
                                key={idx}
                                className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px]"
                              >
                                {exp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditStaff(st, st.companyCode, st.category)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs flex items-center gap-1 transition"
                          title="ویرایش اطلاعات"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">ویرایش</span>
                        </button>

                        <button
                          onClick={() => handleToggleStaffActive(st, st.companyCode, st.category)}
                          className={`p-1.5 rounded-lg border text-[11px] font-medium transition ${
                            st.active !== false
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {st.active !== false ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleImpersonate(st.category, st.companyCode, st)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition"
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
        {/* TAB 3: COMPANY CLAIMS & CASES VIEWER */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            {/* Filter and Search Bar for Cases */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="جستجوی شماره پرونده، پلاک، کدملی، نام زیان‌دیده..."
                    value={caseSearch}
                    onChange={(e) => setCaseSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                {/* Company Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 shrink-0">شرکت بیمه:</span>
                  <select
                    value={caseCompanyFilter}
                    onChange={(e) => setCaseCompanyFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">همه شرکت‌های بیمه</option>
                    {insurers.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 shrink-0">وضعیت:</span>
                  <select
                    value={caseStatusFilter}
                    onChange={(e) => setCaseStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="PENDING_EXPERT">در انتظار ارزیابی کارشناس</option>
                    <option value="FIELD_VISIT_REQUIRED">نیازمند بازدید میدانی</option>
                    <option value="PENDING_REVIEW">در انتظار تایید بازبین</option>
                    <option value="PENDING_PAYOUT">در صف پرداخت شبا</option>
                    <option value="SETTLED">تسویه و پرداخت‌شده</option>
                    <option value="REJECTED">مردود شده</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 shrink-0">نوع خسارت:</span>
                  <select
                    value={caseTypeFilter}
                    onChange={(e) => setCaseTypeFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">همه انواع (ثالث و بدنه)</option>
                    <option value="thirdparty">خسارت مالی شخص ثالث</option>
                    <option value="bodily">خسارت بیمه بدنه</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>تعداد پرونده‌های یافت‌شده:</span>
                  <strong className="text-blue-900 font-bold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {filteredCasesList.length} پرونده
                  </strong>
                </div>

                {caseCompanyFilter !== 'all' && (
                  <div className="text-xs text-blue-700 font-medium">
                    در حال نمایش پرونده‌های شرکت: {insurers.find((i) => i.code === caseCompanyFilter)?.name}
                  </div>
                )}
              </div>
            </div>

            {/* Cases Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">کد رهگیری / تاریخ</th>
                      <th className="py-3 px-4">شرکت بیمه</th>
                      <th className="py-3 px-4">زیان‌دیده و خودرو</th>
                      <th className="py-3 px-4">پلاک و کروکی</th>
                      <th className="py-3 px-4">برآورد خسارت (تومان)</th>
                      <th className="py-3 px-4">وضعیت پرونده</th>
                      <th className="py-3 px-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCasesList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          پرونده‌ای با این مشخصات یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      filteredCasesList.map((c) => {
                        const comp = insurers.find(
                          (i) => i.code === c.insurerId || i.code === c.thirdPartyInsurerId || i.code === c.bodyInsuranceCompany
                        );
                        const isBodily = !!(c.isBodyClaim || c.isBodily || c.id?.startsWith('BD-'));
                        const totalAmount = c.assessorSummary?.finalNetPayable || c.aiEstimate?.totalEstimate || 0;

                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 font-mono">{c.id}</div>
                              <div className="text-[11px] text-slate-500">{c.accidentDate || c.incidentDate || 'امروز'}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 font-bold text-blue-700">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>{comp?.name || c.insurerName || 'بیمه دانا'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {isBodily ? 'بیمه بدنه' : 'شخص ثالث مالی'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{c.claimantName || 'نامشخص'}</div>
                              <div className="text-[11px] text-slate-500">{c.carModel || 'پژو ۲۰۷'}</div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="text-slate-800 font-bold">{c.claimantPlate || 'ایران ۳۳ - ۱۲۳ب۴۵'}</div>
                              <div className="text-[10px] text-slate-500">
                                {c.hasPoliceReport ? 'دارای کروکی پلیس' : 'بدون کروکی'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-black text-slate-900">
                                {(totalAmount / 10).toLocaleString('fa-IR')} تومان
                              </div>
                              {c.assessorSummary?.depreciationAmount ? (
                                <div className="text-[10px] text-emerald-700 font-semibold">
                                  + افت: {((c.assessorSummary.depreciationAmount) / 10).toLocaleString('fa-IR')}
                                </div>
                              ) : null}
                            </td>

                            <td className="py-3.5 px-4">
                              {getStatusBadge(c.status)}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setInspectingCase(c)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1 mx-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>مشاهده جزئیات</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: OVERVIEW & SYSTEM HEALTH */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SANHAB & Police Core Link Health */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <Server className="w-4 h-4" />
                  <span>وضعیت اتصال هسته سنهاب و وب‌سرویس فراجا</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">وب‌سرویس استعلام بیمه‌نامه سنهاب (مرکزی):</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      پایدار (۹۹.۹٪)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">وب‌سرویس استعلام پلاک و تصادفات فراجا:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      متصل و برخط
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">سوئیچ حواله الکترونیک پایا/ساتنا بانکی:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      آماده صدور دستور پرداخت
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 font-medium">موتور هوش مصنوعی ارزیابی خسارت بدنه:</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      دقت ۹۴.۲٪
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Summary of cases */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 lg:col-span-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <Activity className="w-4 h-4" />
                    <span>خلاصه عملکرد شرکت‌های بیمه در پرونده‌های جاری</span>
                  </div>
                  <span className="text-xs text-slate-500">مجموع پرونده‌های ثبت‌شده: {cases.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                        <th className="py-2.5 px-3">شرکت بیمه</th>
                        <th className="py-2.5 px-3">ارزیابان فعال</th>
                        <th className="py-2.5 px-3">بازبینان</th>
                        <th className="py-2.5 px-3">سقف بدون کروکی</th>
                        <th className="py-2.5 px-3">وضعیت سامانه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {insurers.map((comp) => {
                        const countExp = (experts[comp.code] || []).length;
                        const countRev = (reviewers[comp.code] || []).length;
                        return (
                          <tr key={comp.code} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-blue-600" />
                              {comp.name}
                            </td>
                            <td className="py-2.5 px-3">{countExp} کارشناس</td>
                            <td className="py-2.5 px-3">{countRev} بازبین</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {((comp.onlineWithoutCroquiCeiling || 400000000) / 10).toLocaleString('fa-IR')} تومان
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {editingCompany ? `ویرایش اطلاعات ${editingCompany.name}` : 'افزودن شرکت بیمه جدید به سامانه'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    تعریف شناسه، مشخصات حقوقی، سقف‌های پرداخت و اتصال وب‌سرویس سنهاب
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCompanyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">نام کامل شرکت بیمه *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بیمه سامان، بیمه رازی، بیمه کوثر..."
                    value={companyForm.name || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    کد یکتای انگلیسی (شناسه سیستمی) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCompany}
                    placeholder="مثال: saman, razi, kowsar, alborz"
                    value={companyForm.code || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 ${
                      editingCompany ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">شماره پروانه بیمه مرکزی</label>
                  <input
                    type="text"
                    placeholder="مثال: LIC-SAM-1383"
                    value={companyForm.licenseNumber || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, licenseNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">کد اتصال وب‌سرویس سنهاب</label>
                  <input
                    type="text"
                    placeholder="مثال: SNH-SAMAN-9001"
                    value={companyForm.sanhabCode || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, sanhabCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    سقف مجاز ارزیابی بدون کروکی (ریال)
                  </label>
                  <input
                    type="number"
                    step="10000000"
                    placeholder="400000000"
                    value={companyForm.onlineWithoutCroquiCeiling || 400000000}
                    onChange={(e) => setCompanyForm({ ...companyForm, onlineWithoutCroquiCeiling: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    معادل: {(((companyForm.onlineWithoutCroquiCeiling || 0) / 10)).toLocaleString('fa-IR')} تومان
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    سقف مجاز ارزیابی با کروکی (ریال)
                  </label>
                  <input
                    type="number"
                    step="10000000"
                    placeholder="1200000000"
                    value={companyForm.onlineWithCroquiCeiling || 1200000000}
                    onChange={(e) => setCompanyForm({ ...companyForm, onlineWithCroquiCeiling: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    معادل: {(((companyForm.onlineWithCroquiCeiling || 0) / 10)).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">شماره تلفن پشتیبانی مرکزی</label>
                  <input
                    type="text"
                    placeholder="۰۲۱-۸۸۰۰۰۰۰۰"
                    value={companyForm.phone || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">کلمه عبور پیش‌فرض ورود پرسنل</label>
                  <input
                    type="text"
                    placeholder="1234"
                    value={companyForm.defaultPassword || '1234'}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">نشانی دفتر مرکزی</label>
                <input
                  type="text"
                  placeholder="تهران، خیابان ولیعصر، برج مرکزی بیمه"
                  value={companyForm.address || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {editingStaff
                      ? `ویرایش کارشناس «${editingStaff.staff.name}»`
                      : 'ثبت کارشناس / ارزیاب / بازبین جدید'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    تعیین شرکت بیمه متبوع، نقش سازمانی، پروانه نظام کارشناسی و اختیارات مالی
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">شرکت بیمه متبوع *</label>
                  <select
                    value={staffForm.companyCode}
                    onChange={(e) => setStaffForm({ ...staffForm, companyCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {insurers.map((comp) => (
                      <option key={comp.code} value={comp.code}>
                        {comp.name} ({comp.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">نقش و مسئولیت سازمانی *</label>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">نام و نام خانوادگی *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مهندس سهراب بختیاری"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">عنوان دقیق سمت</label>
                  <input
                    type="text"
                    placeholder="مثال: کارشناس ارشد خسارت بدنه"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">کد ملی (۱۰ رقم)</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0012345678"
                    value={staffForm.nationalId}
                    onChange={(e) => setStaffForm({ ...staffForm, nationalId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">شماره موبایل (جهت ورود)</label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="09121112233"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">شماره پروانه رسمی ارزیابی</label>
                  <input
                    type="text"
                    placeholder="EXP-90802"
                    value={staffForm.licenseCode}
                    onChange={(e) => setStaffForm({ ...staffForm, licenseCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-indigo-700 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">سقف مجاز اختیار ریالی</label>
                  <input
                    type="number"
                    step="10000000"
                    value={staffForm.maxApprovalCeiling}
                    onChange={(e) => setStaffForm({ ...staffForm, maxApprovalCeiling: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {((staffForm.maxApprovalCeiling || 0) / 10).toLocaleString('fa-IR')} تومان
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">استان / شهر</label>
                  <input
                    type="text"
                    placeholder="تهران / تهران"
                    value={staffForm.city}
                    onChange={(e) => setStaffForm({ ...staffForm, city: e.target.value, province: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">نام شعبه</label>
                  <input
                    type="text"
                    placeholder="شعبه ونک"
                    value={staffForm.branchName}
                    onChange={(e) => setStaffForm({ ...staffForm, branchName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Specialties Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">تخصص‌های فنی کارشناس</label>
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
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{spec}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="staffActiveChk"
                    checked={staffForm.active}
                    onChange={(e) => setStaffForm({ ...staffForm, active: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-50 border-slate-300"
                  />
                  <label htmlFor="staffActiveChk" className="text-xs text-slate-700 cursor-pointer font-medium">
                    کارشناس بلافاصله فعال و مجاز به دریافت ارجاعات پرونده شود
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStaffModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
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

      {/* ==================================================== */}
      {/* MODAL 3: CASE DETAILS INSPECTION MODAL */}
      {/* ==================================================== */}
      {inspectingCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-slate-900">
                      بررسی پرونده شماره {inspectingCase.id}
                    </h3>
                    {getStatusBadge(inspectingCase.status)}
                  </div>
                  <p className="text-xs text-slate-500">
                    کد رهگیری: <span className="font-mono text-blue-700 font-bold">{inspectingCase.trackingCode || 'ندارد'}</span> • تاریخ ثبت: {inspectingCase.accidentDate || inspectingCase.incidentDate || 'امروز'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCase(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Basic Parties Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-blue-700 block border-b border-slate-200 pb-1.5">
                    مشخصات طرف زیان‌دیده
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">نام و نام خانوادگی:</span>
                    <span className="font-bold text-slate-900">{inspectingCase.claimantName || 'نامشخص'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">کد ملی:</span>
                    <span className="font-mono text-slate-800">{inspectingCase.claimantNationalId || '۰۴۹۰۱۲۳۴۵۶'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">شماره تلفن:</span>
                    <span className="font-mono text-slate-800">{inspectingCase.claimantPhone || '۰۹۱۲۳۴۵۶۷۸۹'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">شماره پلاک:</span>
                    <span className="font-mono text-blue-700 font-bold">{inspectingCase.claimantPlate || 'ایران ۳۳ - ۱۲۳ب۴۵'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">مدل خودرو:</span>
                    <span className="text-slate-800">{inspectingCase.carModel || 'پژو ۲۰۷'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1.5">
                    مشخصات مقصر حادثه و بیمه‌نامه
                  </span>
                  <div className="flex justify-between">
                    <span className="text-slate-500">نام مقصر:</span>
                    <span className="font-bold text-slate-900">{inspectingCase.atFaultName || 'نامشخص'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">کد ملی مقصر:</span>
                    <span className="font-mono text-slate-800">{inspectingCase.atFaultNationalId || '۰۴۹۰۱۲۳۴۵۶'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">پلاک مقصر:</span>
                    <span className="font-mono text-slate-800">{inspectingCase.atFaultPlate || 'ایران ۲۲ - ۷۸۹ج۱۲'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">شرکت بیمه‌گر:</span>
                    <span className="font-bold text-blue-700">{inspectingCase.insurerName || 'بیمه دانا'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">شماره بیمه‌نامه:</span>
                    <span className="font-mono text-slate-800">{inspectingCase.policyNumber || 'POL-90801123'}</span>
                  </div>
                </div>
              </div>

              {/* Financial Calculation breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-emerald-700 block border-b border-slate-200 pb-1.5">
                  خلاصه ارزیابی مالی و تعیین خسارت
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 text-[11px] block mb-1">خسارت کل قطعات و اجرت</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {(((inspectingCase.assessorSummary?.totalPartsAndLabor || inspectingCase.aiEstimate?.totalEstimate || 0) / 10)).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 text-[11px] block mb-1">کسر ارزش داغی</span>
                    <span className="text-sm font-black text-rose-600 font-mono">
                      {(((inspectingCase.assessorSummary?.salvageDeduction || 0) / 10)).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 text-[11px] block mb-1">افت قیمت خودرو</span>
                    <span className="text-sm font-black text-blue-700 font-mono">
                      {(((inspectingCase.assessorSummary?.depreciationAmount || 0) / 10)).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 text-[11px] block mb-1">خالص پرداختی نهایی</span>
                    <span className="text-sm font-black text-blue-900 font-mono">
                      {(((inspectingCase.assessorSummary?.finalNetPayable || inspectingCase.aiEstimate?.totalEstimate || 0) / 10)).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>
              </div>

              {/* Photos & Damage parts */}
              {inspectingCase.damageLines && inspectingCase.damageLines.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1.5">
                    لیست قطعات و تصمیمات کارشناسی
                  </span>
                  <div className="divide-y divide-slate-200">
                    {inspectingCase.damageLines.map((line, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900">{line.partName}</span>
                          <span className="text-slate-500 mr-2">({line.damageSeverity})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold">
                            {line.action === 'REPLACE' ? 'تعویض' : line.action === 'REPAIR' ? 'تعمیر و صافکاری' : 'رد شده'}
                          </span>
                          <span className="font-mono text-slate-900 font-bold">
                            {((line.expertApprovedPrice || line.estimatedPrice || 0) / 10).toLocaleString('fa-IR')} تومان
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={() => setInspectingCase(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: REJECTION REASON MODAL FOR COMPANY REQUESTS */}
      {/* ==================================================== */}
      {rejectionModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    رد درخواست ثبت شرکت «{rejectionModalRequest.companyName}»
                  </h3>
                  <p className="text-xs text-slate-500">
                    علت عدم تایید جهت اطلاع‌رسانی به مدیر ارشد شرکت ثبت خواهد شد.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectionModalRequest(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">نام مدیر ارشد:</span>
                  <span className="text-slate-900 font-semibold">{rejectionModalRequest.adminName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شماره همراه اطلاع‌رسانی:</span>
                  <span className="text-blue-700 font-mono font-bold">{rejectionModalRequest.adminPhone}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  دلیل یا نواقص پرونده <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="مثال: تصویر روزنامه رسمی بارگذاری‌شده منقضی است / معرفی‌نامه فاقد مهر برجسته مدیرعامل می‌باشد..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectionModalRequest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  ثبت رد درخواست و ارسال پیامک
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SeniorAdminPanel;
