import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  FileText,
  AlertCircle,
  CreditCard,
  Building,
  User,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Copy,
  Printer,
  XCircle,
  ShieldCheck,
  Send,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { UserSession, ClaimCase, PaymentOrder, PaymentBatch } from '../../types';
import {
  loadPaymentOrdersFromStorage,
  savePaymentOrdersToStorage,
  loadPaymentBatchesFromStorage,
  savePaymentBatchesToStorage,
  saveCasesToStorage
} from '../../lib/storage';

interface FinanceManagerPanelProps {
  session: UserSession;
  cases: ClaimCase[];
  onUpdateCase: (updated: ClaimCase) => void;
  onOpenCaseForm?: (caseId: string) => void;
}

export const FinanceManagerPanel: React.FC<FinanceManagerPanelProps> = ({
  session,
  cases,
  onUpdateCase,
  onOpenCaseForm
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'batch' | 'settled' | 'analytics'>('queue');
  const [orders, setOrders] = useState<PaymentOrder[]>(() => {
    const existing = loadPaymentOrdersFromStorage();
    // Auto-generate payment orders for cases in 'در انتظار پرداخت' that don't have one yet
    const pendingCases = cases.filter(
      c => c.status === 'در انتظار پرداخت' || c.status === 'در انتظار تایید پرداخت'
    );
    let updatedOrders = [...existing];
    let createdCount = 0;

    pendingCases.forEach(c => {
      const exists = updatedOrders.some(o => o.caseId === c.id);
      if (!exists) {
        const netAmt = c.assessment?.payable || 25000000;
        const salvage = c.assessment?.salvage || 0;
        const gross = c.assessment?.gross || netAmt + salvage;

        const newOrder: PaymentOrder = {
          id: `PAY-ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 899 + 100)}`,
          caseId: c.id,
          victimName: c.customerName || 'زیان‌دیده محترم',
          victimNationalId: c.customerNationalId || '0019876543',
          victimPhone: c.customerPhone || '09120000000',
          victimIban: c.bankInfo?.iban || 'IR120120000000001234567890',
          victimBankName: c.bankInfo?.bankName || 'بانک ملت',
          culpritName: c.culpritName || 'مقصر حادثه',
          culpritInsurer: c.insurer || 'dana',
          grossAmount: gross,
          salvageDeduction: salvage,
          taxDeduction: 0,
          franchiseDeduction: 0,
          netPayableAmount: netAmt,
          status: 'PENDING_APPROVAL',
          paymentMethod: netAmt > 100000000 ? 'SATNA' : 'PAYA',
          issueDate: new Date().toLocaleDateString('fa-IR'),
          financeNotes: 'تاییدیه ارزیابی خسارت صادر شده و در انتظار تایید حواله مالی است.',
          accountVoucherNumber: `VCH-${new Date().getFullYear()}-${Math.floor(Math.random() * 8999 + 1000)}`
        };
        updatedOrders.unshift(newOrder);
        createdCount++;
      }
    });

    if (createdCount > 0) {
      savePaymentOrdersToStorage(updatedOrders);
    }
    return updatedOrders;
  });

  const [batches, setBatches] = useState<PaymentBatch[]>(() => loadPaymentBatchesFromStorage());

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED_FOR_PAYMENT' | 'PAID' | 'REJECTED'>('ALL');
  const [selectedBatchMethod, setSelectedBatchMethod] = useState<'PAYA_STANDARD' | 'SATNA_BULK' | 'MELLAT_PORTAL'>('PAYA_STANDARD');

  // Modal states
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<PaymentOrder | null>(null);
  const [payModalReferenceNo, setPayModalReferenceNo] = useState('');
  const [payModalMethod, setPayModalMethod] = useState<'PAYA' | 'SATNA' | 'INSTANT_CARD'>('PAYA');
  const [payModalNotes, setPayModalNotes] = useState('');

  const [selectedOrderForVoucher, setSelectedOrderForVoucher] = useState<PaymentOrder | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Selected for batch
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBatchSuccessModal, setShowBatchSuccessModal] = useState<PaymentBatch | null>(null);

  const formatPrice = (val?: number) => {
    if (!val && val !== 0) return '۰';
    return Number(val).toLocaleString('fa-IR');
  };

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    setTimeout(() => setCopiedIban(null), 2500);
  };

  // Stats
  const stats = useMemo(() => {
    const pendingOrders = orders.filter(o => o.status === 'PENDING_APPROVAL');
    const approvedOrders = orders.filter(o => o.status === 'APPROVED_FOR_PAYMENT');
    const paidOrders = orders.filter(o => o.status === 'PAID');

    const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);
    const totalApprovedAmount = approvedOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);
    const totalPaidAmount = paidOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);
    const totalSalvageRecovered = orders.reduce((sum, o) => sum + (o.salvageDeduction || 0), 0);

    return {
      pendingCount: pendingOrders.length,
      pendingAmount: totalPendingAmount,
      approvedCount: approvedOrders.length,
      approvedAmount: totalApprovedAmount,
      paidCount: paidOrders.length,
      paidAmount: totalPaidAmount,
      salvageAmount: totalSalvageRecovered
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesCase = o.caseId.toLowerCase().includes(query);
        const matchesVictim = o.victimName.toLowerCase().includes(query);
        const matchesIban = o.victimIban.toLowerCase().includes(query);
        const matchesRef = o.bankReferenceNumber?.toLowerCase().includes(query) || false;
        const matchesOrder = o.id.toLowerCase().includes(query);
        return matchesCase || matchesVictim || matchesIban || matchesRef || matchesOrder;
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Action: Approve Order
  const handleApproveOrder = (orderId: string) => {
    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: 'APPROVED_FOR_PAYMENT' as const,
        approvedBy: `${session.name} (${session.roleTitle || 'مدیر مالی'})`,
        financeNotes: 'تایید اصالت شبا و سقف پرداخت توسط مدیر مالی احراز شد. حواله در صف صدور پایا قرار گرفت.'
      };
    });
    setOrders(updated);
    savePaymentOrdersToStorage(updated);
  };

  // Action: Reject / Hold Order
  const handleRejectOrder = (orderId: string) => {
    const reason = prompt('لطفاً دلیل عدم تایید مالی یا مسدودی حواله را وارد کنید:');
    if (reason === null) return;

    const updated = orders.map(o => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        status: 'REJECTED' as const,
        rejectionReason: reason || 'مغایرت نام صاحب شبا با کدملی زیان‌دیده',
        financeNotes: `حواله توسط ${session.name} رد شد: ${reason || 'عدم تایید مدارک مالی'}`
      };
    });
    setOrders(updated);
    savePaymentOrdersToStorage(updated);
  };

  // Action: Execute Single Payout
  const handleConfirmSinglePayout = () => {
    if (!selectedOrderForPay) return;
    const refNumber = payModalReferenceNo.trim() || `PAYA-TRX-${Date.now().toString().slice(-8)}`;

    const updatedOrders = orders.map(o => {
      if (o.id !== selectedOrderForPay.id) return o;
      return {
        ...o,
        status: 'PAID' as const,
        paymentMethod: payModalMethod,
        bankReferenceNumber: refNumber,
        paidDate: new Date().toLocaleDateString('fa-IR'),
        paidBy: `${session.name} (${session.roleTitle || 'خزانه‌داری'})`,
        financeNotes: payModalNotes ? payModalNotes : `تسویه قطعی از طریق سامانه ${payModalMethod} بانکی به شماره رهگیری ${refNumber} انجام شد.`
      };
    });

    setOrders(updatedOrders);
    savePaymentOrdersToStorage(updatedOrders);

    // Update the linked ClaimCase
    const linkedCase = cases.find(c => c.id === selectedOrderForPay.caseId);
    if (linkedCase) {
      const updatedCase: ClaimCase = {
        ...linkedCase,
        status: 'پرداخت شده',
        paymentInfo: {
          trackingCode: refNumber,
          paidAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          amount: selectedOrderForPay.netPayableAmount,
          method: payModalMethod,
          bankName: selectedOrderForPay.victimBankName || 'سامانه پایا بانک مرکزی',
          iban: selectedOrderForPay.victimIban
        },
        history: [
          ...(linkedCase.history || []),
          {
            status: 'پرداخت شده',
            time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            user: `${session.name} (مدیریت مالی و خزانه‌داری)`,
            note: `خسارت به مبلغ خالص ${formatPrice(selectedOrderForPay.netPayableAmount)} ریال به شماره شبای ${selectedOrderForPay.victimIban} واریز شد. کد رهگیری بانکی: ${refNumber}`
          }
        ]
      };
      onUpdateCase(updatedCase);
    }

    setSelectedOrderForPay(null);
    setPayModalReferenceNo('');
    setPayModalNotes('');
  };

  // Action: Generate Batch Payout File
  const handleGenerateBatch = () => {
    const readyOrders = orders.filter(
      o => o.status === 'APPROVED_FOR_PAYMENT' && (selectedOrderIds.length === 0 || selectedOrderIds.includes(o.id))
    );

    if (readyOrders.length === 0) {
      alert('هیچ حواله تایید شده‌ای برای صدور فایل پایا انتخاب نشده است.');
      return;
    }

    const batchId = `BATCH-${selectedBatchMethod}-${Date.now().toString().slice(-6)}`;
    const totalBatchAmount = readyOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);

    const newBatch: PaymentBatch = {
      id: batchId,
      batchTitle: `دستور پرداخت گروهی ${selectedBatchMethod === 'PAYA_STANDARD' ? 'پایا' : 'ساتنا'} - ${new Date().toLocaleDateString('fa-IR')}`,
      createdAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      totalOrders: readyOrders.length,
      totalAmount: totalBatchAmount,
      bankFormat: selectedBatchMethod,
      status: 'GENERATED',
      orders: readyOrders,
      downloadFileName: `${batchId}.txt`
    };

    const updatedBatches = [newBatch, ...batches];
    setBatches(updatedBatches);
    savePaymentBatchesToStorage(updatedBatches);

    // Prompt to mark as paid in batch
    setShowBatchSuccessModal(newBatch);
  };

  const handleMarkBatchAsPaid = (batch: PaymentBatch) => {
    const batchRefPrefix = `PAYA-BATCH-${Date.now().toString().slice(-6)}`;
    const batchOrderIds = new Set(batch.orders.map(o => o.id));

    const updatedOrders = orders.map(o => {
      if (!batchOrderIds.has(o.id)) return o;
      return {
        ...o,
        status: 'PAID' as const,
        paymentMethod: 'PAYA' as const,
        bankReferenceNumber: `${batchRefPrefix}-${o.id.slice(-4)}`,
        paidDate: new Date().toLocaleDateString('fa-IR'),
        paidBy: `${session.name} (پرداخت گروهی پایا)`,
        batchId: batch.id,
        financeNotes: `تسویه گروهی پایا با شناسه بچ ${batch.id}`
      };
    });

    setOrders(updatedOrders);
    savePaymentOrdersToStorage(updatedOrders);

    // Update cases
    batch.orders.forEach(bo => {
      const linkedCase = cases.find(c => c.id === bo.caseId);
      if (linkedCase) {
        const updatedCase: ClaimCase = {
          ...linkedCase,
          status: 'پرداخت شده',
          paymentInfo: {
            trackingCode: `${batchRefPrefix}-${bo.id.slice(-4)}`,
            paidAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            amount: bo.netPayableAmount,
            method: 'PAYA',
            bankName: bo.victimBankName || 'پایا بانک مرکزی',
            iban: bo.victimIban
          },
          history: [
            ...(linkedCase.history || []),
            {
              status: 'پرداخت شده',
              time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
              user: `${session.name} (مدیریت مالی - تسویه گروهی پایا)`,
              note: `واریز پایا از طریق حواله گروهی ${batch.id} به مبلغ ${formatPrice(bo.netPayableAmount)} ریال انجام شد.`
            }
          ]
        };
        onUpdateCase(updatedCase);
      }
    });

    const updatedBatches = batches.map(b => (b.id === batch.id ? { ...b, status: 'EXECUTED_SETTLED' as const } : b));
    setBatches(updatedBatches);
    savePaymentBatchesToStorage(updatedBatches);

    setShowBatchSuccessModal(null);
    setSelectedOrderIds([]);
  };

  // Generate Bank File Content Text for simulated download
  const generateBankFileContent = (batch: PaymentBatch) => {
    let content = `HEADER|${batch.id}|${new Date().toISOString()}|TOTAL=${batch.totalAmount}|COUNT=${batch.totalOrders}\n`;
    batch.orders.forEach((ord, index) => {
      content += `ROW|${index + 1}|${ord.victimIban}|${ord.netPayableAmount}|${ord.victimName}|${ord.victimNationalId || 'N/A'}|${ord.caseId}|${ord.accountVoucherNumber}\n`;
    });
    content += `FOOTER|CHECKSUM=${Math.floor(Math.random() * 999999)}|EOF`;
    return content;
  };

  const handleDownloadBankFile = (batch: PaymentBatch) => {
    const text = generateBankFileContent(batch);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = batch.downloadFileName || `${batch.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in" dir="rtl">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>پورتال تخصصی مدیریت مالی، خزانه‌داری و صدور حواله</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            مدیریت صف پرداخت خسارت و صدور اسناد حسابداری
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            کارشناس مالی: <span className="font-bold text-amber-300">{session.name}</span> | سمت: <span className="font-bold text-white">{session.roleTitle || 'مدیر مالی و خزانه‌داری'}</span>
          </p>
        </div>

        {/* Quick Tab Selectors */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-700/60">
          <button
            id="fin-tab-queue"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-amber-500 text-blue-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>کارتابل حواله‌ها</span>
            {stats.pendingCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'queue' ? 'bg-blue-950 text-amber-400' : 'bg-amber-500 text-blue-950'
              }`}>
                {stats.pendingCount}
              </span>
            )}
          </button>

          <button
            id="fin-tab-batch"
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'batch'
                ? 'bg-amber-500 text-blue-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>واریز گروهی پایا/ساتنا</span>
            {stats.approvedCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                activeTab === 'batch' ? 'bg-blue-950 text-amber-400' : 'bg-amber-500 text-blue-950'
              }`}>
                {stats.approvedCount}
              </span>
            )}
          </button>

          <button
            id="fin-tab-settled"
            onClick={() => setActiveTab('settled')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'settled'
                ? 'bg-amber-500 text-blue-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>سوابق تسویه</span>
          </button>

          <button
            id="fin-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-blue-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>آمار خزانه‌داری</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-amber-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>در انتظار تایید مدیر مالی</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-1">
            {formatPrice(stats.pendingAmount)} <span className="text-xs text-slate-500 font-bold">ریال</span>
          </div>
          <div className="text-xs text-amber-700 font-bold flex items-center gap-1">
            <span>{stats.pendingCount} پرونده آماده بررسی و تایید شبا</span>
          </div>
        </div>

        <div className="bg-white border-2 border-blue-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>تایید شده (در صف پایا/ساتنا)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-950 mb-1">
            {formatPrice(stats.approvedAmount)} <span className="text-xs text-slate-500 font-bold">ریال</span>
          </div>
          <div className="text-xs text-blue-700 font-bold flex items-center gap-1">
            <span>{stats.approvedCount} حواله آماده صدور فایل بانکی</span>
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>مجموع خسارت تسویه شده</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 mb-1">
            {formatPrice(stats.paidAmount)} <span className="text-xs text-slate-500 font-bold">ریال</span>
          </div>
          <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
            <span>{stats.paidCount} فقره پرداخت قطعی و موفق</span>
          </div>
        </div>

        <div className="bg-white border-2 border-purple-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>ارزش داغی بازیافت شده</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-900 mb-1">
            {formatPrice(stats.salvageAmount)} <span className="text-xs text-slate-500 font-bold">ریال</span>
          </div>
          <div className="text-xs text-purple-700 font-bold flex items-center gap-1">
            <span>کسورات سودآور قطعات داغی</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {/* TAB 1: Payment Orders Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="fin-search-input"
                  type="text"
                  placeholder="جستجو با شماره پرونده، نام زیان‌دیده، شبا یا کد رهگیری..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-600 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-slate-500" /> فیلتر وضعیت:
                </span>
                {(['ALL', 'PENDING_APPROVAL', 'APPROVED_FOR_PAYMENT', 'PAID', 'REJECTED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      statusFilter === st
                        ? 'bg-blue-950 text-white shadow-sm border border-blue-950'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {st === 'ALL' && 'همه'}
                    {st === 'PENDING_APPROVAL' && 'در انتظار تایید'}
                    {st === 'APPROVED_FOR_PAYMENT' && 'آماده واریز'}
                    {st === 'PAID' && 'پرداخت شده'}
                    {st === 'REJECTED' && 'مسدود/ردشده'}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 text-xs font-black border-b border-slate-200">
                    <tr>
                      <th className="p-4">شناسه حواله / پرونده</th>
                      <th className="p-4">زیان‌دیده و کدملی</th>
                      <th className="p-4">مشخصات حساب و شبا</th>
                      <th className="p-4">مبلغ ناخالص</th>
                      <th className="p-4">کسر داغی</th>
                      <th className="p-4">خالص پرداختی</th>
                      <th className="p-4">وضعیت حواله</th>
                      <th className="p-4 text-center">عملیات مالی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-500 font-bold">
                          حواله‌ای با مشخصات درخواستی یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-4">
                            <div className="font-black text-blue-950 font-mono">{order.id}</div>
                            <button
                              onClick={() => onOpenCaseForm?.(order.caseId)}
                              className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              پرونده: {order.caseId}
                            </button>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">سند: {order.accountVoucherNumber}</div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {order.victimName}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 font-bold">
                              کدملی: <span className="font-mono text-slate-700">{order.victimNationalId || 'ثبت نشده'}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-mono">
                              موبایل: {order.victimPhone || '-'}
                            </div>
                          </td>

                          <td className="p-4 max-w-xs">
                            <div className="flex items-center gap-1 font-mono text-xs text-blue-950 font-bold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                              <span className="truncate">{order.victimIban}</span>
                              <button
                                title="کپی شبا"
                                onClick={() => handleCopyIban(order.victimIban)}
                                className="text-slate-400 hover:text-blue-900 p-0.5 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-xs text-slate-600 font-bold flex items-center gap-1 mt-1">
                              <Building className="w-3 h-3 text-slate-400" />
                              {order.victimBankName || 'بانک عضو شتاب'}
                              {copiedIban === order.victimIban && (
                                <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">کپی شد!</span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 font-mono font-bold text-slate-700">
                            {formatPrice(order.grossAmount)}
                          </td>

                          <td className="p-4 font-mono font-bold text-purple-700">
                            {order.salvageDeduction > 0 ? `-${formatPrice(order.salvageDeduction)}` : '۰'}
                          </td>

                          <td className="p-4 font-mono text-sm font-black text-emerald-700">
                            {formatPrice(order.netPayableAmount)} <span className="text-[11px] font-bold text-slate-500">ریال</span>
                          </td>

                          <td className="p-4">
                            {order.status === 'PENDING_APPROVAL' && (
                              <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3 text-amber-700" /> در انتظار تایید
                              </span>
                            )}
                            {order.status === 'APPROVED_FOR_PAYMENT' && (
                              <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 rounded-full flex items-center gap-1 w-fit">
                                <ShieldCheck className="w-3 h-3 text-blue-700" /> تایید مالی / صف پایا
                              </span>
                            )}
                            {order.status === 'PAID' && (
                              <div className="space-y-1">
                                <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full flex items-center gap-1 w-fit">
                                  <CheckCircle className="w-3 h-3 text-emerald-700" /> پرداخت شده
                                </span>
                                {order.bankReferenceNumber && (
                                  <div className="text-[10px] text-slate-600 font-mono font-bold">
                                    رهگیری: {order.bankReferenceNumber}
                                  </div>
                                )}
                              </div>
                            )}
                            {order.status === 'REJECTED' && (
                              <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 rounded-full flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3 text-rose-700" /> مسدود / رد شده
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {order.status === 'PENDING_APPROVAL' && (
                                <>
                                  <button
                                    title="تایید مالی حواله"
                                    onClick={() => handleApproveOrder(order.id)}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" /> تایید حواله
                                  </button>
                                  <button
                                    title="رد یا تعلیق حواله"
                                    onClick={() => handleRejectOrder(order.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {order.status === 'APPROVED_FOR_PAYMENT' && (
                                <button
                                  onClick={() => setSelectedOrderForPay(order)}
                                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-amber-400" /> ثبت واریز آنی
                                </button>
                              )}

                              <button
                                title="مشاهده سند حسابداری و فاکتور"
                                onClick={() => setSelectedOrderForVoucher(order)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Batch Payment Generator */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-500" />
                    سامانه تولید فایل تسویه گروهی پایا / ساتنا (بانک مرکزی و سامانه‌های پرداخت)
                  </h2>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    حواله‌های تایید شده را به صورت دسته‌ای انتخاب و فایل استاندارد انتقال وجه پایا جهت بارگذاری در پیشخوان اینترنت‌بانک تولید کنید.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedBatchMethod}
                    onChange={e => setSelectedBatchMethod(e.target.value as any)}
                    className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-900"
                  >
                    <option value="PAYA_STANDARD">فرمت استاندارد پایا (بانک مرکزی)</option>
                    <option value="SATNA_BULK">فرمت ساتنا گروهی (خسارت‌های کلان)</option>
                    <option value="MELLAT_PORTAL">درگاه پیشخوان شرکتی بانک ملت</option>
                  </select>

                  <button
                    onClick={handleGenerateBatch}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    تولید فایل و بستن بچ واریز
                  </button>
                </div>
              </div>

              {/* Ready Orders Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-600">
                  <span>حواله‌های تایید شده آماده صدور فایل ({orders.filter(o => o.status === 'APPROVED_FOR_PAYMENT').length} مورد):</span>
                  <button
                    onClick={() => {
                      const allReady = orders.filter(o => o.status === 'APPROVED_FOR_PAYMENT').map(o => o.id);
                      if (selectedOrderIds.length === allReady.length) {
                        setSelectedOrderIds([]);
                      } else {
                        setSelectedOrderIds(allReady);
                      }
                    }}
                    className="text-blue-700 hover:text-blue-900 font-bold hover:underline"
                  >
                    {selectedOrderIds.length === orders.filter(o => o.status === 'APPROVED_FOR_PAYMENT').length
                      ? 'لغو انتخاب همه'
                      : 'انتخاب همه'}
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {orders.filter(o => o.status === 'APPROVED_FOR_PAYMENT').length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs font-bold">
                      هیچ حواله‌ای در وضعیت «تایید شده برای پرداخت» وجود ندارد. ابتدا از تب کارتابل، حواله‌های مورد نظر را تایید کنید.
                    </div>
                  ) : (
                    orders
                      .filter(o => o.status === 'APPROVED_FOR_PAYMENT')
                      .map(order => (
                        <div
                          key={order.id}
                          onClick={() => {
                            if (selectedOrderIds.includes(order.id)) {
                              setSelectedOrderIds(selectedOrderIds.filter(id => id !== order.id));
                            } else {
                              setSelectedOrderIds([...selectedOrderIds, order.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                            selectedOrderIds.includes(order.id)
                              ? 'bg-amber-50/80 border-2 border-amber-400 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-amber-600 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                {order.victimName}
                                <span className="text-xs text-slate-500 font-mono font-bold">({order.caseId})</span>
                              </div>
                              <div className="text-xs text-slate-600 font-mono font-bold mt-0.5">
                                {order.victimIban} | {order.victimBankName}
                              </div>
                            </div>
                          </div>

                          <div className="text-left font-mono">
                            <div className="text-sm font-black text-emerald-700">{formatPrice(order.netPayableAmount)} ریال</div>
                            <div className="text-[11px] text-slate-500 font-bold">تاریخ تایید: {order.issueDate}</div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Previous Batches History */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-base font-black text-blue-950 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                سوابق بچ‌های پایا صادر شده
              </h3>

              <div className="space-y-3">
                {batches.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs font-bold">
                    تاکنون هیچ فایل واریز گروهی صادر نشده است.
                  </div>
                ) : (
                  batches.map(batch => (
                    <div
                      key={batch.id}
                      className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {batch.batchTitle}
                          <span className="text-xs font-mono font-bold text-blue-900">({batch.id})</span>
                        </div>
                        <div className="text-xs text-slate-600 font-bold mt-1 flex items-center gap-3">
                          <span>زمان تولید: {batch.createdAt}</span>
                          <span>تعداد حواله‌ها: {batch.totalOrders}</span>
                          <span>فرمت: {batch.bankFormat}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left font-mono">
                          <div className="text-sm font-black text-emerald-700">{formatPrice(batch.totalAmount)} ریال</div>
                          <span className="text-[10px] text-blue-900 bg-blue-100 font-bold px-2 py-0.5 rounded border border-blue-200">
                            {batch.status === 'EXECUTED_SETTLED' ? 'تسویه شده' : 'تولید شده'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDownloadBankFile(batch)}
                          className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> دانلود مجدد فایل
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Settled History */}
        {activeTab === 'settled' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  آرشیو اسناد تسویه شده و پرداخت‌های قطعی
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  گزارش رسمی حواله‌هایی که با شماره پیگیری بانکی تسویه شده و به وضعیت نهایی «پرداخت شده» رسیده‌اند.
                </p>
              </div>

              <div className="text-left font-mono">
                <div className="text-xs text-slate-500 font-bold">مجموع واریزی‌ها:</div>
                <div className="text-xl font-black text-emerald-700">{formatPrice(stats.paidAmount)} ریال</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 text-xs font-black border-b border-slate-200">
                    <tr>
                      <th className="p-4">شناسه پرونده</th>
                      <th className="p-4">زیان‌دیده</th>
                      <th className="p-4">شماره شبا و بانک</th>
                      <th className="p-4">مبلغ واریز شده</th>
                      <th className="p-4">کد رهگیری بانکی (Trace No)</th>
                      <th className="p-4">تاریخ تسویه</th>
                      <th className="p-4">کارشناس ثبت‌کننده</th>
                      <th className="p-4 text-center">سند پرداخت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.filter(o => o.status === 'PAID').length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-slate-500 font-bold">
                          هیچ پرداختی در سیستم ثبت نشده است.
                        </td>
                      </tr>
                    ) : (
                      orders
                        .filter(o => o.status === 'PAID')
                        .map(order => (
                          <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-4 font-black text-blue-950 font-mono">{order.caseId}</td>
                            <td className="p-4 font-bold text-slate-900">{order.victimName}</td>
                            <td className="p-4 font-mono text-xs font-bold text-slate-800">
                              <div>{order.victimIban}</div>
                              <div className="text-[11px] text-slate-500 font-sans font-bold">{order.victimBankName}</div>
                            </td>
                            <td className="p-4 font-mono font-black text-emerald-700">
                              {formatPrice(order.netPayableAmount)} ریال
                            </td>
                            <td className="p-4 font-mono text-xs font-bold text-blue-950">
                              <span className="bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                {order.bankReferenceNumber || 'TRX-PAYA-SUCCESS'}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-600 font-bold">{order.paidDate || order.issueDate}</td>
                            <td className="p-4 text-xs text-slate-800 font-bold">{order.paidBy || session.name}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedOrderForVoucher(order)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs rounded-xl flex items-center gap-1 mx-auto transition-colors font-bold"
                              >
                                <Printer className="w-3.5 h-3.5" /> فاکتور
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Financial Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Payout Distribution */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-base font-black text-blue-950 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  توزیع خسارت‌های پرداختی بر اساس روش واریز
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>حواله پایا بانکی (زیر ۱۰۰ میلیون ریال)</span>
                      <span className="font-mono text-emerald-700 font-black">۷۸٪ (۴۴ فقره)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full w-[78%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>انتقال ساتنا (خسارت‌های کلان بالای ۱۰۰ میلیون)</span>
                      <span className="font-mono text-blue-700 font-black">۱۸٪ (۱۰ فقره)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full w-[18%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>واریز آنی کارت به کارت / حساب تجاری</span>
                      <span className="font-mono text-purple-700 font-black">۴٪ (۲ فقره)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full w-[4%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Speed & Performance */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h3 className="text-base font-black text-blue-950 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  شاخص‌های کلیدی عملکرد خزانه‌داری (Treasury KPIs)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-bold">متوسط زمان صدور تا تسویه</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">۳.۲ ساعت</div>
                    <div className="text-[11px] text-slate-500 font-bold mt-1">۸۵٪ سریع‌تر از میانگین صنعت</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-bold">نرخ استرداد ارزش داغی</div>
                    <div className="text-2xl font-black text-purple-800 mt-1">۱۲.۴٪</div>
                    <div className="text-[11px] text-slate-500 font-bold mt-1">کاهش بار مالی پرداخت نقدی</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-bold">دقت تطابق شبا و کدملی</div>
                    <div className="text-2xl font-black text-blue-900 mt-1">۹۹.۸٪</div>
                    <div className="text-[11px] text-slate-500 font-bold mt-1">صحت‌سنجی از سامانه نهاب</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-bold">نرخ مغایرت‌های بانکی</div>
                    <div className="text-2xl font-black text-emerald-700 mt-1">۰.۰٪</div>
                    <div className="text-[11px] text-slate-500 font-bold mt-1">تراز کامل دفاتر خزانه‌داری</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Single Payment Confirmation */}
      {selectedOrderForPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                <CreditCard className="w-5 h-5 text-amber-500" />
                ثبت واریز آنی و صدور سند تسویه
              </div>
              <button
                onClick={() => setSelectedOrderForPay(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">شماره پرونده:</span>
                  <span className="text-blue-950 font-black font-mono">{selectedOrderForPay.caseId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">زیان‌دیده:</span>
                  <span className="text-slate-900 font-bold">{selectedOrderForPay.victimName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">شماره شبا:</span>
                  <span className="text-blue-950 font-mono font-bold">{selectedOrderForPay.victimIban}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">بانک مقصد:</span>
                  <span className="text-slate-800 font-bold">{selectedOrderForPay.victimBankName}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                  <span className="text-slate-800 font-bold">مبلغ قابل پرداخت:</span>
                  <span className="text-emerald-700 font-black text-base font-mono">
                    {formatPrice(selectedOrderForPay.netPayableAmount)} ریال
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">روش انتقال وجه:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PAYA', 'SATNA', 'INSTANT_CARD'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayModalMethod(method)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        payModalMethod === method
                          ? 'bg-blue-950 border-blue-950 text-white shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {method === 'PAYA' && 'پایا (بانک مرکزی)'}
                      {method === 'SATNA' && 'ساتنا (آنی)'}
                      {method === 'INSTANT_CARD' && 'کارت به کارت'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شماره پیگیری بانکی / شناسه ارجاع (Trace No):
                </label>
                <input
                  type="text"
                  placeholder="مثال: TRX-89210943"
                  value={payModalReferenceNo}
                  onChange={e => setPayModalReferenceNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-mono font-bold focus:outline-none focus:border-blue-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات خزانه‌داری (اختیاری):</label>
                <textarea
                  rows={2}
                  placeholder="توضیحات مربوط به سند بانکی یا مرجع واریز..."
                  value={payModalNotes}
                  onChange={e => setPayModalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-900 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedOrderForPay(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmSinglePayout}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" /> تایید و ثبت قطعی پرداخت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Success and Settlement prompt */}
      {showBatchSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="bg-amber-50 border-b border-amber-200 p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto mb-2 shadow-sm">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-blue-950">فایل حواله پایا با موفقیت تولید شد</h3>
              <p className="text-xs font-bold text-amber-900 mt-1 font-mono">شناسه بچ: {showBatchSuccessModal.id}</p>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">تعداد حواله‌ها:</span>
                  <span className="text-slate-900 font-black">{showBatchSuccessModal.totalOrders} فقره</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">مجموع مبلغ واریز:</span>
                  <span className="text-emerald-700 font-black font-mono text-sm">
                    {formatPrice(showBatchSuccessModal.totalAmount)} ریال
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                می‌توانید هم‌اکنون فایل متنی استاندارد را جهت بارگذاری در بانک دانلود نمایید. همچنین در صورت تمایل، وضعیت تمام پرونده‌های این بچ را به «پرداخت شده» تغییر دهید.
              </p>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => handleDownloadBankFile(showBatchSuccessModal)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> دانلود فایل TXT پایا
              </button>

              <button
                onClick={() => handleMarkBatchAsPaid(showBatchSuccessModal)}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" /> تغییر وضعیت همه به «پرداخت شده»
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Accounting Voucher & Receipt Preview */}
      {selectedOrderForVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl print:m-0 print:w-full border border-slate-200">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="font-black text-blue-950 text-xs sm:text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                سند حسابداری پرداخت خسارت خودرو (Payment Voucher)
              </div>
              <button
                onClick={() => setSelectedOrderForVoucher(null)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs" id="printable-voucher">
              {/* Header Box */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-base font-black text-blue-950">شرکت سهامی بیمه دانا</div>
                  <div className="text-slate-500 font-bold mt-0.5">اداره کل مالی و حسابداری خسارت خودرو</div>
                </div>
                <div className="text-left font-mono font-bold text-slate-700">
                  <div>شماره سند: {selectedOrderForVoucher.accountVoucherNumber || 'VCH-1403-9082'}</div>
                  <div>تاریخ صدور: {selectedOrderForVoucher.issueDate}</div>
                  <div>شماره پرونده: {selectedOrderForVoucher.caseId}</div>
                </div>
              </div>

              {/* Payee Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold">نام و نام خانوادگی زیان‌دیده:</span>
                  <span className="font-bold text-slate-900 mr-2">{selectedOrderForVoucher.victimName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">کد ملی:</span>
                  <span className="font-bold font-mono text-slate-900 mr-2">{selectedOrderForVoucher.victimNationalId}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">شماره شبا مقصد:</span>
                  <span className="font-mono font-bold text-blue-950 mr-2">{selectedOrderForVoucher.victimIban}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">بانک عامل:</span>
                  <span className="font-bold text-slate-900 mr-2">{selectedOrderForVoucher.victimBankName}</span>
                </div>
              </div>

              {/* Amount Breakdown Table */}
              <table className="w-full text-right border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-200 p-2.5 font-bold">شرح حسابداری</th>
                    <th className="border border-slate-200 p-2.5 font-bold">بدهکار (ریال)</th>
                    <th className="border border-slate-200 p-2.5 font-bold">بستانکار (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">هزینه خسارت تایید شده کارشناسی بدنه</td>
                    <td className="border border-slate-200 p-2.5 font-mono font-bold text-slate-900">
                      {formatPrice(selectedOrderForVoucher.grossAmount)}
                    </td>
                    <td className="border border-slate-200 p-2.5 font-mono">-</td>
                  </tr>
                  {selectedOrderForVoucher.salvageDeduction > 0 && (
                    <tr>
                      <td className="border border-slate-200 p-2.5 font-medium">کسر بابت ارزش بازیافت قطعات داغی</td>
                      <td className="border border-slate-200 p-2.5 font-mono">-</td>
                      <td className="border border-slate-200 p-2.5 font-mono text-purple-700 font-bold">
                        {formatPrice(selectedOrderForVoucher.salvageDeduction)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-amber-50 font-bold text-slate-900">
                    <td className="border border-slate-200 p-2.5 font-bold">خالص قابل پرداخت / واریز شده به حساب زیان‌دیده</td>
                    <td className="border border-slate-200 p-2.5 font-mono">-</td>
                    <td className="border border-slate-200 p-2.5 font-mono text-emerald-700 font-black text-sm">
                      {formatPrice(selectedOrderForVoucher.netPayableAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-slate-600 border-t border-slate-200">
                <div>
                  <div className="font-bold text-slate-800">کارشناس رسیدگی و ارزیاب</div>
                  <div className="text-[10px] text-slate-400 mt-6">امضای الکترونیک سامانه</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">رئیس حسابداری خسارت</div>
                  <div className="text-[10px] text-slate-400 mt-6">تایید انطباق شبا</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">مدیر مالی و خزانه‌داری</div>
                  <div className="text-[10px] text-slate-400 mt-6">مجوز واریز بانکی</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" /> چاپ سند حسابداری
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
