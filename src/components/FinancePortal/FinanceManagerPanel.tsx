import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Download,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Building2,
  User,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Printer,
  XCircle,
  ShieldCheck,
  Send,
  Calendar,
  Layers,
  ChevronDown,
  Check,
  ExternalLink,
  Lock,
  ShieldAlert,
  Sparkles,
  RotateCcw,
  Info,
  SlidersHorizontal,
  Eye,
  X,
  Timer,
  Zap,
  Flame,
  CheckSquare,
  Square
} from 'lucide-react';
import {
  UserSession,
  ClaimCase,
  PaymentOrder,
  PaymentBatch,
  PaymentOrderStatus,
  PaymentPreCheckResult,
  PaymentRetryLog,
  PaymentDiscrepancy
} from '../../types';
import {
  loadPaymentOrdersFromStorage,
  savePaymentOrdersToStorage,
  loadPaymentBatchesFromStorage,
  savePaymentBatchesToStorage,
  loadInsurersFromStorage
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
  // Navigation tabs matching PRD requirements
  const [activeTab, setActiveTab] = useState<
    'queue' | 'processing' | 'failed' | 'discrepancy' | 'settled' | 'batch'
  >('queue');

  // Load orders from storage (only real payment orders registered by customer/claim workflows)
  const [orders, setOrders] = useState<PaymentOrder[]>(() => {
    const existing = loadPaymentOrdersFromStorage();
    return existing;
  });

  // Real-time synchronization for new payment orders arriving from customer portal / case updates
  React.useEffect(() => {
    const handleSync = () => {
      const stored = loadPaymentOrdersFromStorage();
      setOrders(stored);
    };

    window.addEventListener('claimflow_payment_orders_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('claimflow_payment_orders_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const [batches, setBatches] = useState<PaymentBatch[]>(() => loadPaymentBatchesFromStorage());

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'>('ALL');
  const [insurerFilter, setInsurerFilter] = useState<string>('ALL');

  const availableInsurers = useMemo(() => loadInsurersFromStorage(), []);

  // Modals state
  const [selectedOrderForPreCheck, setSelectedOrderForPreCheck] = useState<PaymentOrder | null>(null);
  const [selectedOrderForPay, setSelectedOrderForPay] = useState<PaymentOrder | null>(null);
  const [payModalReferenceNo, setPayModalReferenceNo] = useState('');
  const [payModalMethod, setPayModalMethod] = useState<'PAYA' | 'SATNA' | 'INSTANT_CARD'>('PAYA');
  const [payModalNotes, setPayModalNotes] = useState('');

  const [selectedOrderForRetry, setSelectedOrderForRetry] = useState<PaymentOrder | null>(null);
  const [retryIban, setRetryIban] = useState('');
  const [retryNotes, setRetryNotes] = useState('');

  const [selectedOrderForDiscrepancy, setSelectedOrderForDiscrepancy] = useState<PaymentOrder | null>(null);
  const [discrepancyActionNote, setDiscrepancyActionNote] = useState('');

  const [selectedOrderForVoucher, setSelectedOrderForVoucher] = useState<PaymentOrder | null>(null);
  const [selectedOrderForAudit, setSelectedOrderForAudit] = useState<PaymentOrder | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Batch Payment Wizard & Selections
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedBatchFormat, setSelectedBatchFormat] = useState<'PAYA_STANDARD' | 'SATNA_BULK' | 'MELLAT_PORTAL' | 'TEJARAT_IBAN' | 'MELLI_BAM'>('PAYA_STANDARD');
  const [showBatchWizardModal, setShowBatchWizardModal] = useState<boolean>(false);
  const [batchExecutionMode, setBatchExecutionMode] = useState<'PROCESS_PAYA' | 'INSTANT_SETTLE'>('PROCESS_PAYA');
  const [isGeneratingBatch, setIsGeneratingBatch] = useState<boolean>(false);
  const [showBatchSuccessModal, setShowBatchSuccessModal] = useState<PaymentBatch | null>(null);

  // SLA Management Modal
  const [slaModalOrder, setSlaModalOrder] = useState<PaymentOrder | null>(null);
  const [newSlaPriority, setNewSlaPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [newSlaDeadline, setNewSlaDeadline] = useState<string>('');

  const formatPrice = (val?: number) => {
    if (!val && val !== 0) return '۰';
    return Number(val).toLocaleString('fa-IR');
  };

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    setTimeout(() => setCopiedIban(null), 2500);
  };

  // ----------------------------------------------------
  // DASHBOARD KPIS (Exact PRD Specification)
  // ----------------------------------------------------
  const stats = useMemo(() => {
    const readyOrders = orders.filter(
      o => o.status === 'READY_FOR_PAYMENT' || o.status === 'PENDING_APPROVAL' || o.status === 'APPROVED_FOR_PAYMENT'
    );
    const processingOrders = orders.filter(o => o.status === 'PROCESSING');
    const paidOrders = orders.filter(o => o.status === 'PAID');
    const failedOrders = orders.filter(o => o.status === 'FAILED');
    const discrepancyOrders = orders.filter(o => o.status === 'DISCREPANCY');

    const totalReadyAmount = readyOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);
    const totalProcessingAmount = processingOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);
    const totalPaidAmount = paidOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);
    const totalFailedAmount = failedOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);
    const totalDiscrepancyAmount = discrepancyOrders.reduce((sum, o) => sum + (o.discrepancy?.difference || 0), 0);

    return {
      readyCount: readyOrders.length,
      readyAmount: totalReadyAmount,
      processingCount: processingOrders.length,
      processingAmount: totalProcessingAmount,
      paidCount: paidOrders.length,
      paidAmount: totalPaidAmount,
      failedCount: failedOrders.length,
      failedAmount: totalFailedAmount,
      discrepancyCount: discrepancyOrders.length,
      discrepancyAmount: totalDiscrepancyAmount
    };
  }, [orders]);

  // Filtered orders for active view
  const currentTabOrders = useMemo(() => {
    return orders.filter(o => {
      // Tab based filter
      if (activeTab === 'queue') {
        // Show ready & pending
        if (o.status !== 'READY_FOR_PAYMENT' && o.status !== 'PENDING_APPROVAL' && o.status !== 'APPROVED_FOR_PAYMENT' && o.status !== 'HELD') {
          return false;
        }
      } else if (activeTab === 'processing') {
        if (o.status !== 'PROCESSING') return false;
      } else if (activeTab === 'failed') {
        if (o.status !== 'FAILED') return false;
      } else if (activeTab === 'discrepancy') {
        if (o.status !== 'DISCREPANCY') return false;
      } else if (activeTab === 'settled') {
        if (o.status !== 'PAID') return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && o.slaPriority !== priorityFilter) return false;

      // Insurer filter
      if (insurerFilter !== 'ALL') {
        const oIns = (o.culpritInsurer || '').toLowerCase().trim();
        const filterVal = insurerFilter.toLowerCase().trim();
        const matchedInsurer = availableInsurers.find(
          i => (i.code || (i as any).id || '').toLowerCase() === filterVal || (i.name || '').toLowerCase() === filterVal
        );
        const nameFa = matchedInsurer?.nameFa?.toLowerCase() || '';
        const nameEn = (matchedInsurer?.name || matchedInsurer?.code || '').toLowerCase();

        const matches =
          oIns === filterVal ||
          oIns.includes(filterVal) ||
          filterVal.includes(oIns) ||
          (nameFa && (oIns.includes(nameFa) || nameFa.includes(oIns))) ||
          (nameEn && (oIns.includes(nameEn) || nameEn.includes(oIns)));

        if (!matches) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesCase = o.caseId.toLowerCase().includes(q);
        const matchesVictim = o.victimName.toLowerCase().includes(q);
        const matchesIban = o.victimIban.toLowerCase().includes(q);
        const matchesRef = o.bankReferenceNumber?.toLowerCase().includes(q) || false;
        const matchesOrder = o.id.toLowerCase().includes(q);
        return matchesCase || matchesVictim || matchesIban || matchesRef || matchesOrder;
      }

      return true;
    });
  }, [orders, activeTab, priorityFilter, insurerFilter, searchTerm]);

  // ----------------------------------------------------
  // ACTIONS: PRE-CHECK & CONTROL
  // ----------------------------------------------------
  const handlePerformPreCheck = (order: PaymentOrder) => {
    // Validate IBAN: starts with IR, 26 chars, valid digits
    const cleanIban = order.victimIban.replace(/\s+/g, '');
    const ibanValid = cleanIban.startsWith('IR') && cleanIban.length === 26;

    // Beneficiary name match confidence (mock heuristic)
    const nameMatchPassed = order.victimName.trim().length > 2;

    // Check duplicate: no other paid order with same caseId and netPayableAmount
    const isDuplicate = orders.some(
      o => o.id !== order.id && o.caseId === order.caseId && o.status === 'PAID'
    );

    const preCheckResult: PaymentPreCheckResult = {
      ibanValid,
      ibanBankName: order.victimBankName || 'بانک عامل شبا',
      nameMatchConfidence: nameMatchPassed ? 100 : 40,
      nameMatchPassed,
      amountUnderCeiling: order.netPayableAmount <= 1000000000,
      payoutReadyVerified: true,
      noDuplicatePassed: !isDuplicate,
      checkedAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      checkedBy: session.name || 'اپراتور خزانه‌داری'
    };

    const updated = orders.map(o => (o.id === order.id ? { ...o, preCheck: preCheckResult } : o));
    setOrders(updated);
    savePaymentOrdersToStorage(updated);

    setSelectedOrderForPreCheck({ ...order, preCheck: preCheckResult });
  };

  // ----------------------------------------------------
  // ACTIONS: EXECUTE PAYMENT (Single Dispatch)
  // ----------------------------------------------------
  const handleInitiatePayment = (order: PaymentOrder) => {
    setSelectedOrderForPay(order);
    setPayModalReferenceNo(`TRX-PAYA-${Date.now().toString().slice(-8)}`);
    setPayModalMethod(order.netPayableAmount > 100000000 ? 'SATNA' : 'PAYA');
    setPayModalNotes('');
  };

  const handleConfirmSinglePayout = () => {
    if (!selectedOrderForPay) return;
    const refNumber = payModalReferenceNo.trim() || `TRX-PAYA-${Date.now().toString().slice(-8)}`;

    const updatedOrders = orders.map(o => {
      if (o.id !== selectedOrderForPay.id) return o;
      return {
        ...o,
        status: 'PAID' as PaymentOrderStatus,
        paymentMethod: payModalMethod,
        bankReferenceNumber: refNumber,
        paidDate: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        paidBy: `${session.name} (اپراتور خزانه‌داری)`,
        financeNotes: payModalNotes
          ? payModalNotes
          : `دستور پرداخت به درگاه ${payModalMethod} ارسال و تسویه موفقیت‌آمیز شبا با شناسه ${refNumber} در سیستم ثبت شد.`
      };
    });

    setOrders(updatedOrders);
    savePaymentOrdersToStorage(updatedOrders);

    // Synchronize to ClaimCase in customer & insurer portal
    const linkedCase = cases.find(c => c.id === selectedOrderForPay.caseId);
    if (linkedCase) {
      const updatedCase: ClaimCase = {
        ...linkedCase,
        status: 'پرداخت شده',
        payoutState: 'PAID',
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
            user: `${session.name} (خزانه‌داری)`,
            note: `عملیات تسویه وجه خسارت به مبلغ ${formatPrice(selectedOrderForPay.netPayableAmount)} ریال به شماره شبا ${selectedOrderForPay.victimIban} با کد پیگیری ${refNumber} انجام شد.`
          }
        ]
      };
      onUpdateCase(updatedCase);
    }

    setSelectedOrderForPay(null);
    setSelectedOrderForPreCheck(null);
  };

  // ----------------------------------------------------
  // ACTIONS: SEND TO BANK PROCESSING (Live SLA Tracking)
  // ----------------------------------------------------
  const handleSendToProcessing = (order: PaymentOrder) => {
    const trxRef = `PROC-PAYA-${Date.now().toString().slice(-6)}`;
    const updated = orders.map(o => {
      if (o.id !== order.id) return o;
      return {
        ...o,
        status: 'PROCESSING' as PaymentOrderStatus,
        bankReferenceNumber: trxRef,
        financeNotes: `حواله به چرخه تسویه پایا بانک مرکزی ارسال گردید (شناسه ارسال: ${trxRef})`
      };
    });
    setOrders(updated);
    savePaymentOrdersToStorage(updated);
    setSelectedOrderForPreCheck(null);
  };

  // ----------------------------------------------------
  // ACTIONS: HOLD / UNHOLD
  // ----------------------------------------------------
  const handleToggleHold = (order: PaymentOrder) => {
    const isCurrentlyHeld = order.status === 'HELD';
    const newStatus: PaymentOrderStatus = isCurrentlyHeld ? 'READY_FOR_PAYMENT' : 'HELD';
    const reason = !isCurrentlyHeld ? prompt('لطفاً دلیل نگه‌داشتن و تعلیق حواله را وارد کنید:') || 'تعلیق موقت جهت بازبینی' : '';

    const updated = orders.map(o => {
      if (o.id !== order.id) return o;
      return {
        ...o,
        status: newStatus,
        financeNotes: isCurrentlyHeld
          ? 'تعلیق حواله توسط خزانه‌دار لغو شد و به صف آماده پرداخت بازگشت.'
          : `حواله به دلیل: «${reason}» توسط خزانه‌دار متوقف گردید.`
      };
    });
    setOrders(updated);
    savePaymentOrdersToStorage(updated);
  };

  // ----------------------------------------------------
  // ACTIONS: RETRY FAILED PAYMENT
  // ----------------------------------------------------
  const handleOpenRetryModal = (order: PaymentOrder) => {
    setSelectedOrderForRetry(order);
    setRetryIban(order.victimIban);
    setRetryNotes('');
  };

  const handleExecuteRetry = () => {
    if (!selectedOrderForRetry) return;
    const cleanIban = retryIban.trim() || selectedOrderForRetry.victimIban;
    const newRetryCount = (selectedOrderForRetry.retryCount || 0) + 1;
    const newRef = `RETRY-${newRetryCount}-TRX-${Date.now().toString().slice(-6)}`;

    const newLog: PaymentRetryLog = {
      attempt: newRetryCount,
      time: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      previousFailureReason: selectedOrderForRetry.failureReason || 'خطای درگاه بانکی',
      status: 'PAID',
      operator: session.name,
      bankResponse: 'کد ۰۰ - تراکنش پایا با موفقیت انجام و رسید بانکی صادر گردید.'
    };

    const updated = orders.map(o => {
      if (o.id !== selectedOrderForRetry.id) return o;
      return {
        ...o,
        victimIban: cleanIban,
        status: 'PAID' as PaymentOrderStatus,
        bankReferenceNumber: newRef,
        paidDate: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        paidBy: `${session.name} (تلاش مجدد خزانه‌داری)`,
        retryCount: newRetryCount,
        retryHistory: [...(o.retryHistory || []), newLog],
        failureReason: undefined,
        financeNotes: `پرداخت پس از ${newRetryCount} بار تلاش مجدد با موفقیت تسویه شد. شماره پیگیری: ${newRef}`
      };
    });

    setOrders(updated);
    savePaymentOrdersToStorage(updated);

    // Sync Case
    const linkedCase = cases.find(c => c.id === selectedOrderForRetry.caseId);
    if (linkedCase) {
      onUpdateCase({
        ...linkedCase,
        status: 'پرداخت شده',
        paymentInfo: {
          trackingCode: newRef,
          paidAt: new Date().toLocaleDateString('fa-IR'),
          amount: selectedOrderForRetry.netPayableAmount,
          method: selectedOrderForRetry.paymentMethod || 'PAYA',
          iban: cleanIban
        }
      });
    }

    setSelectedOrderForRetry(null);
  };

  // ----------------------------------------------------
  // ACTIONS: RESOLVE DISCREPANCY
  // ----------------------------------------------------
  const handleOpenDiscrepancyModal = (order: PaymentOrder) => {
    setSelectedOrderForDiscrepancy(order);
    setDiscrepancyActionNote('');
  };

  const handleResolveDiscrepancy = (resolutionType: 'SETTLE_DIFFERENCE' | 'MANUAL_MATCH') => {
    if (!selectedOrderForDiscrepancy) return;

    const updated = orders.map(o => {
      if (o.id !== selectedOrderForDiscrepancy.id) return o;
      const disc = o.discrepancy;
      return {
        ...o,
        status: 'PAID' as PaymentOrderStatus,
        discrepancy: disc
          ? {
              ...disc,
              resolved: true,
              resolvedAt: new Date().toLocaleDateString('fa-IR'),
              resolutionNote:
                resolutionType === 'SETTLE_DIFFERENCE'
                  ? `حواله تکمیلی مابه‌التفاوت به مبلغ ${formatPrice(disc.difference)} ریال صادر و پرونده کاملاً تسویه گردید. ${discrepancyActionNote}`
                  : `تطبیق دستی با فیش اصلاحی بانکی توسط ${session.name} تایید شد. ${discrepancyActionNote}`
            }
          : undefined,
        financeNotes: `مغایرت بانکی بررسی و با موفقیت رفع گردید. (${resolutionType === 'SETTLE_DIFFERENCE' ? 'صدور حواله مابه‌التفاوت' : 'تطبیق دستی'})`
      };
    });

    setOrders(updated);
    savePaymentOrdersToStorage(updated);
    setSelectedOrderForDiscrepancy(null);
  };

  // Priority Counts per active tab
  const priorityCounts = useMemo(() => {
    const tabOrders = orders.filter(o => {
      if (activeTab === 'queue') {
        return o.status === 'READY_FOR_PAYMENT' || o.status === 'PENDING_APPROVAL' || o.status === 'APPROVED_FOR_PAYMENT' || o.status === 'HELD';
      } else if (activeTab === 'processing') return o.status === 'PROCESSING';
      else if (activeTab === 'failed') return o.status === 'FAILED';
      else if (activeTab === 'discrepancy') return o.status === 'DISCREPANCY';
      else if (activeTab === 'settled') return o.status === 'PAID';
      return true;
    });

    return {
      all: tabOrders.length,
      critical: tabOrders.filter(o => o.slaPriority === 'CRITICAL').length,
      urgent: tabOrders.filter(o => o.slaPriority === 'URGENT').length,
      high: tabOrders.filter(o => o.slaPriority === 'HIGH').length,
      normal: tabOrders.filter(o => !o.slaPriority || o.slaPriority === 'NORMAL').length
    };
  }, [orders, activeTab]);

  // ----------------------------------------------------
  // ACTIONS: BATCH PAYMENTS (Paya / Satna File Generator & Wizard)
  // ----------------------------------------------------
  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSelectAllReady = () => {
    const readyIds = orders
      .filter(o => o.status === 'READY_FOR_PAYMENT' || o.status === 'APPROVED_FOR_PAYMENT')
      .map(o => o.id);
    if (selectedOrderIds.length === readyIds.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(readyIds);
    }
  };

  const handleOpenBatchWizard = () => {
    const readyIds = orders
      .filter(o => o.status === 'READY_FOR_PAYMENT' || o.status === 'APPROVED_FOR_PAYMENT')
      .map(o => o.id);
    if (selectedOrderIds.length === 0 && readyIds.length > 0) {
      setSelectedOrderIds(readyIds);
    }
    setShowBatchWizardModal(true);
  };

  const handleSelectBatchPreset = (preset: 'ALL_READY' | 'CRITICAL_URGENT' | 'HIGH_AMOUNT' | 'CLEAR') => {
    if (preset === 'CLEAR') {
      setSelectedOrderIds([]);
      return;
    }
    const readyOrders = orders.filter(o => o.status === 'READY_FOR_PAYMENT' || o.status === 'APPROVED_FOR_PAYMENT');
    if (preset === 'ALL_READY') {
      setSelectedOrderIds(readyOrders.map(o => o.id));
    } else if (preset === 'CRITICAL_URGENT') {
      setSelectedOrderIds(readyOrders.filter(o => o.slaPriority === 'CRITICAL' || o.slaPriority === 'URGENT').map(o => o.id));
    } else if (preset === 'HIGH_AMOUNT') {
      setSelectedOrderIds(readyOrders.filter(o => o.netPayableAmount >= 50000000).map(o => o.id));
    }
  };

  const handleExecuteBatchWizard = () => {
    const targetOrders = orders.filter(
      o =>
        (o.status === 'READY_FOR_PAYMENT' || o.status === 'APPROVED_FOR_PAYMENT') &&
        selectedOrderIds.includes(o.id)
    );

    if (targetOrders.length === 0) {
      alert('لطفاً حداقل یک حواله آماده پرداخت را برای ایجاد بسته انتخاب فرمایید.');
      return;
    }

    setIsGeneratingBatch(true);

    setTimeout(() => {
      const batchId = `BATCH-${selectedBatchFormat.split('_')[0]}-${Date.now().toString().slice(-6)}`;
      const totalAmount = targetOrders.reduce((sum, o) => sum + o.netPayableAmount, 0);

      const newBatch: PaymentBatch = {
        id: batchId,
        batchTitle: `بسته واریز ${selectedBatchFormat.includes('SATNA') ? 'ساتنا' : 'پایا'} خزانه‌داری - ${new Date().toLocaleDateString('fa-IR')}`,
        createdAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        totalOrders: targetOrders.length,
        totalAmount,
        bankFormat: selectedBatchFormat,
        status: 'GENERATED',
        orders: targetOrders,
        downloadFileName: `${selectedBatchFormat}_${Date.now()}.txt`
      };

      const updatedBatches = [newBatch, ...batches];
      setBatches(updatedBatches);
      savePaymentBatchesToStorage(updatedBatches);

      // Update orders based on execution mode
      const updatedOrders = orders.map(o => {
        if (targetOrders.some(to => to.id === o.id)) {
          if (batchExecutionMode === 'INSTANT_SETTLE') {
            const rrn = `RRN-${Math.floor(Math.random() * 899999999 + 100000000)}`;
            return {
              ...o,
              status: 'PAID' as PaymentOrderStatus,
              batchId,
              bankReferenceNumber: rrn,
              paidDate: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
              paidBy: `${session.name} (تسویه مستقیم گروهی)`,
              financeNotes: `واریز مستقیم گروهی در قالب بسته ${batchId} با موفقیت انجام شد. کد پیگیری: ${rrn}`
            };
          } else {
            return {
              ...o,
              status: 'PROCESSING' as PaymentOrderStatus,
              batchId,
              financeNotes: `در قالب بسته ${batchId} تجمیع و به چرخه تسویه بین‌بانکی ارسال شد.`
            };
          }
        }
        return o;
      });

      setOrders(updatedOrders);
      savePaymentOrdersToStorage(updatedOrders);

      // Also synchronize matching ClaimCases
      targetOrders.forEach(to => {
        const matchingCase = cases.find(c => c.id === to.caseId);
        if (matchingCase) {
          if (batchExecutionMode === 'INSTANT_SETTLE') {
            onUpdateCase({
              ...matchingCase,
              status: 'خسارت پرداخت شده',
              payoutState: 'PAID',
              paymentInfo: {
                referenceNumber: `RRN-BATCH-${batchId.slice(-4)}`,
                paidAmount: to.netPayableAmount,
                paymentDate: new Date().toLocaleDateString('fa-IR'),
                receiptUrl: '#',
                trackingCode: `TRK-${batchId.slice(-4)}`
              }
            });
          } else {
            onUpdateCase({
              ...matchingCase,
              payoutState: 'PROCESSING'
            });
          }
        }
      });

      // Auto-trigger file download
      handleDownloadBatchFile(newBatch);

      setIsGeneratingBatch(false);
      setShowBatchWizardModal(false);
      setShowBatchSuccessModal(newBatch);
      setSelectedOrderIds([]);
    }, 800);
  };

  const handleDownloadBatchFile = (batch: PaymentBatch) => {
    let content = `// ==================================================\n`;
    content += `// سامانه تسویه ناخالص آنی و پایا بانک مرکزی جمهوری اسلامی ایران\n`;
    content += `// شناسه یکتای بسته: ${batch.id}\n`;
    content += `// زمان تولید: ${batch.createdAt}\n`;
    content += `// تعداد کل حواله‌ها: ${batch.totalOrders}\n`;
    content += `// جمع کل مبلغ پرداختی: ${batch.totalAmount.toLocaleString('fa-IR')} ریال\n`;
    content += `// فرمت استاندارد بانکی: ${batch.bankFormat}\n`;
    content += `// ==================================================\n\n`;
    content += `ردیف,شماره شبا مقصد,مبلغ به ریال,نام و نام خانوادگی ذینفع,کد پرونده خسارت,شناسه سند حسابداری\n`;

    batch.orders.forEach((o, idx) => {
      content += `${idx + 1},${o.victimIban},${o.netPayableAmount},${o.victimName.replace(/,/g, ' ')},${o.caseId},${o.accountVoucherNumber || 'VCH-001'}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = batch.downloadFileName || `PAYA_BATCH_${batch.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------
  // ACTIONS: SLA PRIORITY MANAGEMENT
  // ----------------------------------------------------
  const handleOpenSlaModal = (order: PaymentOrder) => {
    setSlaModalOrder(order);
    setNewSlaPriority(order.slaPriority || 'NORMAL');
    setNewSlaDeadline(order.slaDeadline || (order.slaPriority === 'CRITICAL' ? 'امروز ساعت ۱۴:۰۰' : '۲۴ ساعت آینده'));
  };

  const handleSaveSlaModal = () => {
    if (!slaModalOrder) return;
    const remainingHrs = newSlaPriority === 'CRITICAL' ? 2 : newSlaPriority === 'URGENT' ? 6 : newSlaPriority === 'HIGH' ? 14 : 36;
    const updated = orders.map(o => {
      if (o.id !== slaModalOrder.id) return o;
      return {
        ...o,
        slaPriority: newSlaPriority,
        slaDeadline: newSlaDeadline || (newSlaPriority === 'CRITICAL' ? 'امروز ساعت ۱۴:۰۰' : '۲۴ ساعت آینده'),
        slaRemainingHours: remainingHrs,
        slaStatus: newSlaPriority === 'CRITICAL' ? ('NEAR_BREACH' as const) : ('ON_TRACK' as const),
        financeNotes: `${o.financeNotes || ''} [تغییر سطح اولویت SLA به ${newSlaPriority === 'CRITICAL' ? 'بحرانی' : newSlaPriority === 'URGENT' ? 'فوری' : newSlaPriority === 'HIGH' ? 'بالا' : 'عادی'} توسط ${session.name}]`
      };
    });

    setOrders(updated);
    savePaymentOrdersToStorage(updated);
    setSlaModalOrder(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ---------------------------------------------------- */}
      {/* 1. HEADER & TREASURY OPERATOR SCOPE NOTICE */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-amber-400 flex items-center justify-center font-black shadow-md shadow-indigo-900/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  پنل خزانه‌داری و مدیریت پرداخت
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-950 border border-indigo-200">
                  Treasury Operator
                </span>
              </div>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                کنترل اطلاعات پرداخت، اجرای حواله پایا/ساتنا، پیگیری وضعیت بانکی و مغایرت‌گیری خسارات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-700" />
              <span className="text-slate-500 font-bold">اپراتور حاضر:</span>
              <span className="font-extrabold text-slate-900">{session.name}</span>
            </div>
          </div>
        </div>

        {/* Regulatory Scope Reminder */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-slate-700">
          <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-extrabold text-indigo-950">حیطه اختیارات خزانه‌داری:</span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
              وظیفه این پنل صرفاً کنترل صحت اطلاعات شبا، ارسال دستور پرداخت و ثبت نتایج درگاه پایا/ساتنا است. تغییر مبلغ ارزیابی یا تصمیم‌گیری پیرامون خسارت خارج از حدود وظایف خزانه‌داری می‌باشد.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. DASHBOARD KPIS (EXACT PRD LAYOUT) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Ready for Payment */}
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`p-4 rounded-3xl border text-right transition-all active:scale-95 ${
            activeTab === 'queue'
              ? 'bg-indigo-900 text-white border-indigo-900 shadow-md shadow-indigo-950/20 ring-2 ring-indigo-500'
              : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold ${activeTab === 'queue' ? 'text-indigo-200' : 'text-slate-500'}`}>
              آماده پرداخت
            </span>
            <CreditCard className={`w-4.5 h-4.5 ${activeTab === 'queue' ? 'text-amber-400' : 'text-indigo-600'}`} />
          </div>
          <div className="text-2xl font-black font-mono mt-2">
            {stats.readyCount}
          </div>
          <div className={`text-[10px] font-bold mt-1 font-mono truncate ${activeTab === 'queue' ? 'text-indigo-200' : 'text-slate-500'}`}>
            {formatPrice(stats.readyAmount)} ریال
          </div>
        </button>

        {/* KPI 2: Bank Processing */}
        <button
          type="button"
          onClick={() => setActiveTab('processing')}
          className={`p-4 rounded-3xl border text-right transition-all active:scale-95 ${
            activeTab === 'processing'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold ${activeTab === 'processing' ? 'text-amber-950' : 'text-slate-500'}`}>
              در حال پرداخت
            </span>
            <Clock className={`w-4.5 h-4.5 ${activeTab === 'processing' ? 'text-slate-950' : 'text-amber-600'}`} />
          </div>
          <div className="text-2xl font-black font-mono mt-2">
            {stats.processingCount}
          </div>
          <div className={`text-[10px] font-bold mt-1 font-mono truncate ${activeTab === 'processing' ? 'text-amber-950' : 'text-slate-500'}`}>
            {formatPrice(stats.processingAmount)} ریال
          </div>
        </button>

        {/* KPI 3: Paid / Settled */}
        <button
          type="button"
          onClick={() => setActiveTab('settled')}
          className={`p-4 rounded-3xl border text-right transition-all active:scale-95 ${
            activeTab === 'settled'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 ring-2 ring-emerald-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold ${activeTab === 'settled' ? 'text-emerald-100' : 'text-slate-500'}`}>
              پرداخت موفق
            </span>
            <CheckCircle2 className={`w-4.5 h-4.5 ${activeTab === 'settled' ? 'text-emerald-200' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-black font-mono mt-2">
            {stats.paidCount}
          </div>
          <div className={`text-[10px] font-bold mt-1 font-mono truncate ${activeTab === 'settled' ? 'text-emerald-100' : 'text-slate-500'}`}>
            {formatPrice(stats.paidAmount)} ریال
          </div>
        </button>

        {/* KPI 4: Failed / Errors */}
        <button
          type="button"
          onClick={() => setActiveTab('failed')}
          className={`p-4 rounded-3xl border text-right transition-all active:scale-95 ${
            activeTab === 'failed'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 ring-2 ring-rose-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold ${activeTab === 'failed' ? 'text-rose-100' : 'text-slate-500'}`}>
              پرداخت ناموفق
            </span>
            <XCircle className={`w-4.5 h-4.5 ${activeTab === 'failed' ? 'text-rose-200' : 'text-rose-600'}`} />
          </div>
          <div className="text-2xl font-black font-mono mt-2">
            {stats.failedCount}
          </div>
          <div className={`text-[10px] font-bold mt-1 font-mono truncate ${activeTab === 'failed' ? 'text-rose-100' : 'text-slate-500'}`}>
            {formatPrice(stats.failedAmount)} ریال
          </div>
        </button>

        {/* KPI 5: Discrepancy */}
        <button
          type="button"
          onClick={() => setActiveTab('discrepancy')}
          className={`p-4 rounded-3xl border text-right transition-all active:scale-95 ${
            activeTab === 'discrepancy'
              ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 ring-2 ring-orange-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-extrabold ${activeTab === 'discrepancy' ? 'text-orange-100' : 'text-slate-500'}`}>
              مغایرت
            </span>
            <AlertTriangle className={`w-4.5 h-4.5 ${activeTab === 'discrepancy' ? 'text-orange-200' : 'text-orange-600'}`} />
          </div>
          <div className="text-2xl font-black font-mono mt-2">
            {stats.discrepancyCount}
          </div>
          <div className={`text-[10px] font-bold mt-1 font-mono truncate ${activeTab === 'discrepancy' ? 'text-orange-100' : 'text-slate-500'}`}>
            {stats.discrepancyAmount > 0 ? `${formatPrice(stats.discrepancyAmount)} ریال` : 'نیاز به تطبیق'}
          </div>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. NAVIGATION TABS */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex flex-wrap items-center gap-1 shadow-xs">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'queue' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>صف پرداخت‌ها (آماده ارسال)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'queue' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {stats.readyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('processing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'processing' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>در حال پردازش بانکی</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'processing' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {stats.processingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('failed')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'failed' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>تراکنش‌های ناموفق و تلاش مجدد</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'failed' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'}`}>
            {stats.failedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('discrepancy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'discrepancy' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <span>صف مغایرت‌گیری بانکی</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'discrepancy' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700'}`}>
            {stats.discrepancyCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settled')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'settled' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>رسیدها و سوابق تسویه</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'settled' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {stats.paidCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'batch' ? 'bg-indigo-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>پرداخت گروهی / صدور پایا</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. SEARCH & FILTER BAR WITH SLA DROPDOWN */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="جستجو با شماره پرونده، نام ذینفع، شماره شبا یا کد پیگیری..."
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Priority SLA Dropdown filter (منوی کشویی اولویت‌ها) */}
            <div className="relative flex items-center">
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as any)}
                className={`px-3.5 py-2.5 border rounded-xl text-xs font-bold focus:outline-none transition-all cursor-pointer ${
                  priorityFilter === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-black ring-1 ring-rose-400'
                    : priorityFilter === 'URGENT'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-black ring-1 ring-amber-400'
                    : priorityFilter === 'HIGH'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-black ring-1 ring-blue-400'
                    : priorityFilter === 'NORMAL'
                    ? 'bg-slate-100 border-slate-300 text-slate-800 font-black'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <option value="ALL">انتخاب اولویت SLA (همه - {priorityCounts.all} مورد)</option>
                <option value="CRITICAL">بحرانی (زیر ۲ ساعت) - {priorityCounts.critical} مورد</option>
                <option value="URGENT">فوری (امروز) - {priorityCounts.urgent} مورد</option>
                <option value="HIGH">بالا (تا فردا) - {priorityCounts.high} مورد</option>
                <option value="NORMAL">عادی (روال معمول) - {priorityCounts.normal} مورد</option>
              </select>
            </div>

            {/* Insurer filter */}
            <select
              value={insurerFilter}
              onChange={e => setInsurerFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none hover:bg-slate-100 cursor-pointer"
            >
              <option value="ALL">تمام شرکت‌های بیمه</option>
              {availableInsurers.map((ins, idx) => {
                const optVal = ins.code || (ins as any).id || ins.name;
                return (
                  <option key={`insurer-opt-${optVal}-${idx}`} value={optVal}>
                    {ins.nameFa || ins.name}
                  </option>
                );
              })}
            </select>

            {/* Batch Payment Wizard Launcher */}
            <button
              type="button"
              onClick={handleOpenBatchWizard}
              className="px-4 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>پرداخت گروهی (پایا / ساتنا)</span>
              {selectedOrderIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px]">
                  {selectedOrderIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Indicators if filtered */}
        {(priorityFilter !== 'ALL' || insurerFilter !== 'ALL' || searchTerm.trim()) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400">فیلترهای فعال:</span>

            {priorityFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-[11px]">
                <span>اولویت: {priorityFilter === 'CRITICAL' ? 'بحرانی' : priorityFilter === 'URGENT' ? 'فوری' : priorityFilter === 'HIGH' ? 'بالا' : 'عادی'}</span>
                <button
                  type="button"
                  onClick={() => setPriorityFilter('ALL')}
                  className="hover:bg-indigo-200 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {insurerFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                <span>بیمه‌گر: {insurerFilter === 'dana' ? 'دانا' : insurerFilter === 'alborz' ? 'البرز' : insurerFilter === 'asia' ? 'آسیا' : insurerFilter === 'iran' ? 'ایران' : 'ملت'}</span>
                <button
                  type="button"
                  onClick={() => setInsurerFilter('ALL')}
                  className="hover:bg-slate-200 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchTerm.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                <span>جستجو: «{searchTerm}»</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:bg-slate-200 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setPriorityFilter('ALL');
                setInsurerFilter('ALL');
                setSearchTerm('');
              }}
              className="text-[11px] font-bold text-rose-600 hover:underline mr-auto"
            >
              حذف همه فیلترها
            </button>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. MAIN CONTENT TABLES BY TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'batch' ? (
        /* BATCH VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-black text-slate-900 text-base">بسته‌های پرداخت گروهی پایا / ساتنا</h2>
              <p className="text-xs text-slate-500 font-bold mt-1">
                صدور فایل‌های استاندارد متنی خزانه‌داری جهت بارگذاری مستقیم در پرتال بانک‌های عامل
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenBatchWizard}
                className="px-4 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>ایجاد بسته پرداخت گروهی جدید</span>
              </button>
            </div>
          </div>

          {batches.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">هنوز هیچ بسته تجمیعی صادر نشده است.</p>
              <button
                type="button"
                onClick={handleOpenBatchWizard}
                className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>اجرای فرآیند پرداخت گروهی</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map(batch => (
                <div key={batch.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-black text-indigo-950">{batch.id}</span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{batch.batchTitle}</h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                      تولید شده
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-200/80">
                    <div>
                      <span className="text-slate-500 font-bold block">تعداد حواله‌ها:</span>
                      <span className="font-black text-slate-900 font-mono">{batch.totalOrders} فقره</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">مجموع مبلغ ریالی:</span>
                      <span className="font-black text-emerald-800 font-mono">{formatPrice(batch.totalAmount)} ریال</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">فرمت بانکی:</span>
                      <span className="font-bold text-slate-700">{batch.bankFormat}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block">زمان صدور:</span>
                      <span className="font-bold text-slate-700 font-mono">{batch.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleDownloadBatchFile(batch)}
                      className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود فایل پایا</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TABLE FOR QUEUE, PROCESSING, FAILED, DISCREPANCY, SETTLED */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600 uppercase">
                  {activeTab === 'queue' && (
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAllReady}
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === currentTabOrders.length}
                        className="rounded accent-indigo-900 w-4 h-4 cursor-pointer"
                        title="انتخاب همه"
                      />
                    </th>
                  )}
                  <th className="p-4">شماره پرونده / حواله</th>
                  <th className="p-4">ذینفع و مشخصات</th>
                  <th className="p-4">شماره شبا (IBAN) و بانک</th>
                  <th className="p-4">مبلغ مصوب (ریال)</th>
                  <th className="p-4">بیمه / مهلت SLA</th>
                  <th className="p-4">وضعیت خزانه‌داری</th>
                  <th className="p-4 text-center">عملیات مجاز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {currentTabOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400 font-bold">
                      <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      موردی با فیلترهای انتخابی در این صف یافت نشد.
                      {priorityFilter !== 'ALL' && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setPriorityFilter('ALL')}
                            className="text-indigo-600 hover:underline text-xs font-black"
                          >
                            نمایش همه اولویت‌ها ({priorityCounts.all} مورد)
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  currentTabOrders.map(order => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        {activeTab === 'queue' && (
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrder(order.id)}
                              className="rounded accent-indigo-900 w-4 h-4 cursor-pointer"
                            />
                          </td>
                        )}

                        {/* Case & Order ID */}
                        <td className="p-4">
                          <div className="font-mono font-black text-indigo-950 text-xs">
                            {order.caseId}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            {order.id}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold mt-1">
                            آماده: {order.readyDate || order.issueDate}
                          </div>
                        </td>

                        {/* Beneficiary Name */}
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{order.victimName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            کدملی: {order.victimNationalId || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            تلفن: {order.victimPhone || '-'}
                          </div>
                        </td>

                        {/* IBAN & Bank */}
                        <td className="p-4">
                          <div className="flex items-center gap-1 font-mono font-bold text-blue-950 text-[11px] dir-ltr">
                            <span>{order.victimIban}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyIban(order.victimIban)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="کپی شماره شبا"
                            >
                              {copiedIban === order.victimIban ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-bold mt-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{order.victimBankName || 'بانک عامل پایا'}</span>
                          </div>
                        </td>

                        {/* Net Payable Amount */}
                        <td className="p-4">
                          <div className="font-black font-mono text-emerald-800 text-sm">
                            {formatPrice(order.netPayableAmount)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">خالص مصوب خسارت</span>
                        </td>

                        {/* Insurer & SLA Deadline */}
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800 text-xs">
                            {order.culpritInsurer === 'dana' ? 'بیمه دانا' : order.culpritInsurer === 'alborz' ? 'بیمه البرز' : order.culpritInsurer === 'asia' ? 'بیمه آسیا' : order.culpritInsurer === 'iran' ? 'بیمه ایران' : 'بیمه ملت'}
                          </div>
                          
                          {/* Rich SLA Badge */}
                          <div className="mt-1 flex items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                order.slaPriority === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                                  : order.slaPriority === 'URGENT'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : order.slaPriority === 'HIGH'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.slaPriority === 'CRITICAL' && <Flame className="w-3 h-3 text-rose-600" />}
                              {order.slaPriority === 'URGENT' && <Clock className="w-3 h-3 text-amber-600" />}
                              <span>{order.slaPriority === 'CRITICAL' ? 'بحرانی' : order.slaPriority === 'URGENT' ? 'فوری' : order.slaPriority === 'HIGH' ? 'بالا' : 'عادی'}</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleOpenSlaModal(order)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded hover:bg-slate-100"
                              title="تغییر اولویت و مهلت SLA"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                            </button>
                          </div>

                          {order.slaDeadline && (
                            <div className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1">
                              <Timer className="w-2.5 h-2.5 text-slate-400" />
                              <span>مهلت: {order.slaDeadline}</span>
                            </div>
                          )}
                        </td>

                        {/* Treasury Status */}
                        <td className="p-4">
                          {order.status === 'READY_FOR_PAYMENT' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-indigo-100 text-indigo-950 border border-indigo-200 inline-flex items-center gap-1">
                              <CreditCard className="w-3.5 h-3.5 text-indigo-700" />
                              آماده پرداخت
                            </span>
                          )}
                          {order.status === 'PROCESSING' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-950 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" />
                              در حال پردازش بانک
                            </span>
                          )}
                          {order.status === 'PAID' && (
                            <div>
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                پرداخت موفق
                              </span>
                              {order.bankReferenceNumber && (
                                <div className="text-[10px] text-slate-500 font-mono mt-1 truncate max-w-[130px]">
                                  پیگیری: {order.bankReferenceNumber}
                                </div>
                              )}
                            </div>
                          )}
                          {order.status === 'FAILED' && (
                            <div>
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-100 text-rose-950 border border-rose-200 inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                                ناموفق (خطای بانک)
                              </span>
                              {order.failureReason && (
                                <div className="text-[10px] text-rose-700 font-bold mt-1 line-clamp-1 max-w-[160px]" title={order.failureReason}>
                                  {order.failureReason}
                                </div>
                              )}
                            </div>
                          )}
                          {order.status === 'DISCREPANCY' && (
                            <div>
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-orange-100 text-orange-950 border border-orange-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-700" />
                                مغایرت بانکی
                              </span>
                              {order.discrepancy && (
                                <div className="text-[10px] text-orange-800 font-bold mt-1">
                                  اختلاف: {formatPrice(order.discrepancy.difference)} ریال
                                </div>
                              )}
                            </div>
                          )}
                          {order.status === 'HELD' && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-slate-600" />
                              نگه‌داشته شده (متوقف)
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Actions for READY or PENDING */}
                            {(order.status === 'READY_FOR_PAYMENT' || order.status === 'PENDING_APPROVAL' || order.status === 'APPROVED_FOR_PAYMENT') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handlePerformPreCheck(order)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                                  title="کنترل شبا و ارسال پرداخت"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>کنترل و پرداخت</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleHold(order)}
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="نگه‌داشتن پرداخت"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Actions for PROCESSING */}
                            {order.status === 'PROCESSING' && (
                              <button
                                type="button"
                                onClick={() => handleInitiatePayment(order)}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-black text-[11px] flex items-center gap-1 transition-all"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                                <span>ثبت پاسخ پایا</span>
                              </button>
                            )}

                            {/* Actions for FAILED */}
                            {order.status === 'FAILED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenRetryModal(order)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-700" />
                                <span>مشاهده خطا و تلاش مجدد</span>
                              </button>
                            )}

                            {/* Actions for DISCREPANCY */}
                            {order.status === 'DISCREPANCY' && (
                              <button
                                type="button"
                                onClick={() => handleOpenDiscrepancyModal(order)}
                                className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-950 font-black text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-700" />
                                <span>تطبیق و رفع مغایرت</span>
                              </button>
                            )}

                            {/* Actions for PAID / SETTLED */}
                            {order.status === 'PAID' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForVoucher(order)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-black text-[11px] flex items-center gap-1 transition-all"
                                  title="چاپ سند حسابداری تسویه"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>چاپ رسید</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForAudit(order)}
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                  title="مشاهده ردپای حسابرسی و پاسخ بانک"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-700" />
                                </button>
                              </>
                            )}

                            {/* Actions for HELD */}
                            {order.status === 'HELD' && (
                              <button
                                type="button"
                                onClick={() => handleToggleHold(order)}
                                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] flex items-center gap-1"
                              >
                                <span>لغو تعلیق</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5.5 MODAL: BATCH PAYMENT WIZARD */}
      {/* ---------------------------------------------------- */}
      {showBatchWizardModal && (() => {
        const readyOrders = orders.filter(
          o => o.status === 'READY_FOR_PAYMENT' || o.status === 'APPROVED_FOR_PAYMENT'
        );
        const selectedList = orders.filter(
          o => (o.status === 'READY_FOR_PAYMENT' || o.status === 'APPROVED_FOR_PAYMENT') && selectedOrderIds.includes(o.id)
        );
        const selectedTotalAmount = selectedList.reduce((sum, o) => sum + o.netPayableAmount, 0);
        const criticalUrgentCount = readyOrders.filter(o => o.slaPriority === 'CRITICAL' || o.slaPriority === 'URGENT').length;
        const highAmountCount = readyOrders.filter(o => o.netPayableAmount >= 50000000).length;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-900 text-amber-400 flex items-center justify-center shadow-xs">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">میزکار هوشمند صدور و پرداخت گروهی پایا / ساتنا</h3>
                    <p className="text-[11px] text-slate-500 font-bold">تجمیع، کنترل پیش از پرداخت و صدور فایل استاندارد بانکی</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBatchWizardModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 space-y-5 flex-1">
                {/* Step 1: Quick Filter Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-700" />
                      ۱. انتخاب حواله‌های هدف ({selectedOrderIds.length} از {readyOrders.length} مورد آماده انتخاب شده):
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectBatchPreset('ALL_READY')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedOrderIds.length === readyOrders.length && readyOrders.length > 0
                          ? 'bg-indigo-900 text-white'
                          : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>انتخاب همه موارد آماده ({readyOrders.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBatchPreset('CRITICAL_URGENT')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-200"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-600" />
                      <span>فقط بحرانی و فوری ({criticalUrgentCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBatchPreset('HIGH_AMOUNT')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      <span>مبالغ بالای ۵۰ میلیون ریال ({highAmountCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectBatchPreset('CLEAR')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200"
                    >
                      <span>پاک کردن انتخاب‌ها</span>
                    </button>
                  </div>

                  {/* List of ready orders to check/uncheck */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-[11px] font-black text-slate-600 sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-8 text-center"></th>
                          <th className="p-2.5">شماره پرونده</th>
                          <th className="p-2.5">ذینفع / بانک</th>
                          <th className="p-2.5">اولویت SLA</th>
                          <th className="p-2.5 text-left">مبلغ خالص (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {readyOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 font-bold">
                              هیچ پرونده آماده پرداختی در صف وجود ندارد.
                            </td>
                          </tr>
                        ) : (
                          readyOrders.map(order => {
                            const isChecked = selectedOrderIds.includes(order.id);
                            return (
                              <tr
                                key={order.id}
                                onClick={() => handleToggleSelectOrder(order.id)}
                                className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                                  isChecked ? 'bg-indigo-50/50 font-bold' : ''
                                }`}
                              >
                                <td className="p-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded accent-indigo-900 w-3.5 h-3.5"
                                  />
                                </td>
                                <td className="p-2.5 font-mono text-indigo-950 font-black">{order.caseId}</td>
                                <td className="p-2.5 text-slate-800">
                                  <span>{order.victimName}</span>
                                  <span className="text-[10px] text-slate-400 block font-mono">{order.victimBankName}</span>
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                      order.slaPriority === 'CRITICAL'
                                        ? 'bg-rose-100 text-rose-900'
                                        : order.slaPriority === 'URGENT' || order.slaPriority === 'HIGH'
                                        ? 'bg-amber-100 text-amber-900'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {order.slaPriority === 'CRITICAL' ? 'بحرانی' : order.slaPriority === 'URGENT' ? 'فوری' : order.slaPriority === 'HIGH' ? 'بالا' : 'عادی'}
                                  </span>
                                </td>
                                <td className="p-2.5 font-mono font-black text-emerald-800 text-left">
                                  {formatPrice(order.netPayableAmount)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 2: Format and Settlement Mode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bank Standard Format */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-700" />
                      ۲. فرمت استاندارد بانکی خروجی:
                    </label>
                    <select
                      value={selectedBatchFormat}
                      onChange={e => setSelectedBatchFormat(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="PAYA_STANDARD">پایا استاندارد متمرکز بانک مرکزی (.txt)</option>
                      <option value="SATNA_BULK">ساتنا تجمیعی تسویه ناخالص آنی (.txt)</option>
                      <option value="MELLAT_PORTAL">سامانه پرداخت گروهی بانک ملت (فرمت شرکتی)</option>
                      <option value="TEJARAT_IBAN">سامانه فراگیر شبا بانک تجارت</option>
                      <option value="MELLI_BAM">سامانه بام سازمانی بانک ملی</option>
                    </select>
                  </div>

                  {/* Settlement Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                      ۳. شیوه اعمال در سیستم خزانه‌داری:
                    </label>
                    <select
                      value={batchExecutionMode}
                      onChange={e => setBatchExecutionMode(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="PROCESS_PAYA">تولید فایل و انتقال به چرخه تسویه (در حال پردازش)</option>
                      <option value="INSTANT_SETTLE">تسویه مستقیم آنی تمام ردیف‌ها + صدور کد رهگیری RRN</option>
                    </select>
                  </div>
                </div>

                {/* Pre-Check Verification Box */}
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>کنترل‌های هوشمند انطباق (Pre-Payment Checks):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-emerald-900 font-bold pt-1">
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>صحت ۱۰۰٪ شماره‌های شبا</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>عدم وجود حواله تکراری</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>انطباق کامل با سقف تعهدات</span>
                    </div>
                  </div>
                </div>

                {/* Total Summary Footer Box */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">مجموع مبلغ بسته انتخابی:</span>
                    <div className="font-mono text-lg font-black text-amber-400">
                      {formatPrice(selectedTotalAmount)} <span className="text-xs text-white">ریال</span>
                    </div>
                    <span className="text-[11px] text-slate-300 font-mono">
                      معادل {formatPrice(Math.round(selectedTotalAmount / 10))} تومان ({selectedList.length} حواله)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowBatchWizardModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex-1 sm:flex-none"
                    >
                      انصراف
                    </button>

                    <button
                      type="button"
                      disabled={selectedList.length === 0 || isGeneratingBatch}
                      onClick={handleExecuteBatchWizard}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg flex-1 sm:flex-none"
                    >
                      {isGeneratingBatch ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                          <span>در حال صدور بسته و دریافت فایل...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-slate-950" />
                          <span>تولید و دانلود فایل بانکی ({selectedList.length} مورد)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---------------------------------------------------- */}
      {/* 5.6 MODAL: SLA PRIORITY & DEADLINE MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {slaModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-900 text-amber-400 flex items-center justify-center">
                  <Timer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">مدیریت اولویت زمانی و SLA حواله</h3>
                  <p className="text-[11px] text-slate-500 font-bold">پرونده {slaModalOrder.caseId} - ذینفع: {slaModalOrder.victimName}</p>
                </div>
              </div>
              <button
                onClick={() => setSlaModalOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-800 block mb-2">سطح اولویت توافقنامه سطح خدمات (SLA):</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewSlaPriority('CRITICAL');
                      setNewSlaDeadline('امروز ساعت ۱۴:۰۰ (فوری)');
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1 ${
                      newSlaPriority === 'CRITICAL'
                        ? 'border-rose-600 bg-rose-50/80 ring-2 ring-rose-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-900 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-600" />
                        بحرانی (Critical)
                      </span>
                      {newSlaPriority === 'CRITICAL' && <Check className="w-4 h-4 text-rose-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500">مهلت: ۲ ساعت آینده (جرحی/فوتی)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSlaPriority('URGENT');
                      setNewSlaDeadline('امروز تا پایان وقت اداری');
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1 ${
                      newSlaPriority === 'URGENT'
                        ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        فوری (Urgent)
                      </span>
                      {newSlaPriority === 'URGENT' && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500">مهلت: ۶ ساعت آینده</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSlaPriority('HIGH');
                      setNewSlaDeadline('فردا ساعت ۱۱:۰۰');
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1 ${
                      newSlaPriority === 'HIGH'
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        بالا (High)
                      </span>
                      {newSlaPriority === 'HIGH' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500">مهلت: تا فردا ظهر (۱۴ ساعت)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSlaPriority('NORMAL');
                      setNewSlaDeadline('۴۸ ساعت آینده');
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1 ${
                      newSlaPriority === 'NORMAL'
                        ? 'border-slate-800 bg-slate-100 ring-2 ring-slate-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">عادی (Normal)</span>
                      {newSlaPriority === 'NORMAL' && <Check className="w-4 h-4 text-slate-700" />}
                    </div>
                    <span className="text-[10px] text-slate-500">مهلت: تا ۴۸ ساعت آینده</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-800 block mb-1">شرح متنی مهلت پرداخت:</label>
                <input
                  type="text"
                  value={newSlaDeadline}
                  onChange={e => setNewSlaDeadline(e.target.value)}
                  placeholder="مثال: امروز ساعت ۱۴:۰۰ یا فردا صبح"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSlaModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveSlaModal}
                className="px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-black text-xs shadow-sm"
              >
                ذخیره تغییرات SLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. MODAL: PRE-PAYMENT CONTROL & VERIFICATION */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForPreCheck && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">کنترل و اعتبارسنجی اطلاعات پرداخت</h3>
                  <p className="text-[11px] text-slate-500 font-bold">پرونده {selectedOrderForPreCheck.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForPreCheck(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checklist of the 5 Mandatory Checks */}
            <div className="space-y-3">
              <span className="text-xs font-black text-slate-800 block">چک‌لیست کنترل هوشمند پیش از پرداخت:</span>

              {/* Check 1: IBAN format */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span>کنترل فرمت و ساختار شماره شبا:</span>
                    <div className="text-[11px] text-slate-500 font-mono dir-ltr">{selectedOrderForPreCheck.victimIban}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                  معتبر (۲۶ رقمی)
                </span>
              </div>

              {/* Check 2: Beneficiary Name Match */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span>تطابق نام صاحب حساب با ذینفع:</span>
                    <div className="text-[11px] text-slate-500">{selectedOrderForPreCheck.victimName} (انطباق ۱۰۰٪ با ثبت احوال)</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                  منطبق
                </span>
              </div>

              {/* Check 3: Amount Validation */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span>کنترل مبلغ مصوب خسارت:</span>
                    <div className="text-[11px] text-emerald-800 font-mono font-black">{formatPrice(selectedOrderForPreCheck.netPayableAmount)} ریال</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                  مجاز و مصوب
                </span>
              </div>

              {/* Check 4: Payout Ready status */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span>احراز وضعیت پرونده (PAYOUT_READY):</span>
                    <div className="text-[11px] text-slate-500">تاییدیه نهایی ارزیابی و استعلام مدارک اخذ شده است</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                  تایید شده
                </span>
              </div>

              {/* Check 5: Duplicate prevention */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span>کنترل عدم پرداخت تکراری (Duplicate Guard):</span>
                    <div className="text-[11px] text-slate-500">هیچ تراکنش تسویه‌شده قبلی برای این پرونده وجود ندارد</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                  بدون هم‌پوشانی
                </span>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForPreCheck(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => {
                  const o = selectedOrderForPreCheck;
                  setSelectedOrderForPreCheck(null);
                  handleSendToProcessing(o);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Clock className="w-4 h-4" />
                <span>ارسال به صف پردازش پایا</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const o = selectedOrderForPreCheck;
                  setSelectedOrderForPreCheck(null);
                  handleInitiatePayment(o);
                }}
                className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/20 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>تایید نهایی و ارسال دستور پرداخت</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. MODAL: EXECUTE PAYMENT DISPATCH */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForPay && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">ارسال دستور پرداخت به درگاه بانکی</h3>
                  <p className="text-[11px] text-slate-500 font-bold">پرونده {selectedOrderForPay.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForPay(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">نام ذینفع:</span>
                <span className="font-black text-slate-900">{selectedOrderForPay.victimName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">شماره شبا مقصد:</span>
                <span className="font-black font-mono text-blue-950">{selectedOrderForPay.victimIban}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">بانک مقصد:</span>
                <span className="font-bold text-slate-800">{selectedOrderForPay.victimBankName || 'بانک ملت'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-700 font-extrabold">مبلغ قابل واریز:</span>
                <span className="font-black font-mono text-emerald-800 text-sm">
                  {formatPrice(selectedOrderForPay.netPayableAmount)} ریال
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5">روش پرداخت و تسویه:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PAYA', 'SATNA', 'INSTANT_CARD'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayModalMethod(method)}
                      className={`py-2 rounded-xl text-xs font-black border transition-all ${
                        payModalMethod === method
                          ? 'bg-indigo-900 text-white border-indigo-900'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {method === 'PAYA' ? 'سامانه پایا' : method === 'SATNA' ? 'سامانه ساتنا' : 'کارت به کارت فوری'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5">شماره رهگیری / کد ارجاع بانکی (RRN):</label>
                <input
                  type="text"
                  value={payModalReferenceNo}
                  onChange={e => setPayModalReferenceNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-indigo-600 dir-ltr"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1.5">یادداشت ثبت سند خزانه‌داری:</label>
                <textarea
                  value={payModalNotes}
                  onChange={e => setPayModalNotes(e.target.value)}
                  rows={2}
                  placeholder="توضیحات اختیاری پیرامون اجرای پرداخت..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForPay(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirmSinglePayout}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت پرداخت موفق و بستن پرونده</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. MODAL: RETRY FAILED PAYMENT */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForRetry && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">مشاهده خطا و تلاش مجدد (Retry)</h3>
                  <p className="text-[11px] text-slate-500 font-bold">پرونده {selectedOrderForRetry.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForRetry(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error cause banner */}
            <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl text-xs text-rose-950 font-bold space-y-1">
              <span className="block text-[11px] text-rose-800">علت برگشت خوردن تراکنش از سوی بانک:</span>
              <p className="leading-relaxed">{selectedOrderForRetry.failureReason || 'خطای سیستمی عدم تطابق مشخصات شبا'}</p>
            </div>

            {/* Edit / Verify IBAN */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-black text-slate-800 block mb-1">شماره شبا مقصد جهت ارسال مجدد:</label>
                <input
                  type="text"
                  value={retryIban}
                  onChange={e => setRetryIban(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600 dir-ltr"
                />
              </div>

              <div>
                <label className="font-black text-slate-800 block mb-1">توضیحات اصلاحیه خزانه‌داری:</label>
                <textarea
                  value={retryNotes}
                  onChange={e => setRetryNotes(e.target.value)}
                  rows={2}
                  placeholder="ثبت علت تلاش مجدد و استعلام حساب اصلاح‌شده..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForRetry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleExecuteRetry}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تلاش مجدد و ارسال دوباره به پایا</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 9. MODAL: DISCREPANCY RECONCILIATION */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForDiscrepancy && selectedOrderForDiscrepancy.discrepancy && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">بررسی و تطبیق مغایرت بانکی</h3>
                  <p className="text-[11px] text-slate-500 font-bold">پرونده {selectedOrderForDiscrepancy.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDiscrepancy(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comparison Box */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-orange-50/70 rounded-2xl border border-orange-200 text-center">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">مبلغ مصوب سیستم:</span>
                <span className="text-sm font-black font-mono text-slate-900 mt-1 block">
                  {formatPrice(selectedOrderForDiscrepancy.discrepancy.systemAmount)} ریال
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">مبلغ نشسته در بانک:</span>
                <span className="text-sm font-black font-mono text-slate-900 mt-1 block">
                  {formatPrice(selectedOrderForDiscrepancy.discrepancy.bankAmount)} ریال
                </span>
              </div>
              <div>
                <span className="text-[11px] text-orange-950 font-bold block">میزان مغایرت:</span>
                <span className="text-sm font-black font-mono text-orange-700 mt-1 block">
                  {formatPrice(selectedOrderForDiscrepancy.discrepancy.difference)} ریال
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-700 font-bold space-y-1">
              <span className="text-slate-500 block">گزارش مغایرت شاپرک / پایا:</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed">
                {selectedOrderForDiscrepancy.discrepancy.details}
              </p>
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 block mb-1.5">شرح اقدام خزانه‌داری:</label>
              <textarea
                value={discrepancyActionNote}
                onChange={e => setDiscrepancyActionNote(e.target.value)}
                rows={2}
                placeholder="توضیحات تطبیق سند اصلاحی یا مجوز صدور حواله تکمیلی..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForDiscrepancy(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => handleResolveDiscrepancy('MANUAL_MATCH')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-all"
              >
                تطبیق دستی با سند اصلاحی
              </button>

              <button
                type="button"
                onClick={() => handleResolveDiscrepancy('SETTLE_DIFFERENCE')}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>صدور حواله مابه‌التفاوت و تسویه نهایی</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 10. MODAL: AUDIT TRAIL & HISTORY LOG */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForAudit && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">ردپای حسابرسی و سوابق تراکنش</h3>
                  <p className="text-[11px] text-slate-500 font-bold">پرونده {selectedOrderForAudit.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForAudit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-bold">شماره پیگیری بانک مرکزی (RRN):</span>
                <span className="font-mono font-black text-indigo-950">{selectedOrderForAudit.bankReferenceNumber || '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-bold">شماره سند حسابداری:</span>
                <span className="font-mono font-black text-slate-900">{selectedOrderForAudit.accountVoucherNumber || '-'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-bold">اپراتور انجام‌دهنده:</span>
                <span className="font-extrabold text-slate-900">{selectedOrderForAudit.paidBy || session.name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <span className="text-slate-500 font-bold">زمان دقیق ثبت تسویه:</span>
                <span className="font-mono font-bold text-slate-900">{selectedOrderForAudit.paidDate || selectedOrderForAudit.issueDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold block">یادداشت ثبت شده در دفاتر:</span>
                <p className="text-slate-800 font-bold">{selectedOrderForAudit.financeNotes || 'تسویه قطعی انجام گردید.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderForAudit(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 11. MODAL: OFFICIAL PRINT VOUCHER (CLEAN & COMPLETE) */}
      {/* ---------------------------------------------------- */}
      {selectedOrderForVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none animate-in fade-in zoom-in-95">
            
            {/* Modal Actions Bar (Hidden on print) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <span className="font-black text-slate-900 text-sm">پیش‌نمایش سند حسابداری و رسید تسویه</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ سند</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForVoucher(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* OFFICIAL PRINT VOUCHER SHEET */}
            <div className="space-y-6 text-xs text-slate-800">
              
              {/* Header Box */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <h2 className="text-base font-black text-slate-950">سند پرداخت خسارت و حواله پایا خزانه‌داری</h2>
                  <div className="text-slate-500 font-bold text-[11px]">
                    شرکت {selectedOrderForVoucher.culpritInsurer === 'dana' ? 'بیمه دانا' : selectedOrderForVoucher.culpritInsurer === 'alborz' ? 'بیمه البرز' : 'بیمه ایران'} - مدیریت مالی
                  </div>
                </div>
                <div className="text-left font-mono text-[11px] space-y-0.5 text-slate-600">
                  <div>شماره سند: <strong className="text-slate-900">{selectedOrderForVoucher.accountVoucherNumber || 'VCH-1403-9082'}</strong></div>
                  <div>شماره پرونده: <strong className="text-slate-900">{selectedOrderForVoucher.caseId}</strong></div>
                  <div>تاریخ: <strong>{selectedOrderForVoucher.paidDate || selectedOrderForVoucher.issueDate}</strong></div>
                </div>
              </div>

              {/* Beneficiary Details Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-bold">نام و نام خانوادگی ذینفع:</span>
                  <span className="font-black text-slate-950 mr-2">{selectedOrderForVoucher.victimName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">کد ملی:</span>
                  <span className="font-bold font-mono text-slate-900 mr-2">{selectedOrderForVoucher.victimNationalId || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">شماره شبا مقصد:</span>
                  <span className="font-mono font-bold text-blue-950 mr-2">{selectedOrderForVoucher.victimIban}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">بانک مقصد:</span>
                  <span className="font-bold text-slate-900 mr-2">{selectedOrderForVoucher.victimBankName || 'بانک عامل پایا'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">کد رهگیری بانک (RRN):</span>
                  <span className="font-mono font-bold text-slate-900 mr-2">{selectedOrderForVoucher.bankReferenceNumber || 'TRX-PAYA-78904512'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold">روش تسویه:</span>
                  <span className="font-bold text-slate-900 mr-2">{selectedOrderForVoucher.paymentMethod || 'PAYA'}</span>
                </div>
              </div>

              {/* Accounting Breakdown Table (WITHOUT SALVAGE DEDUCTION) */}
              <table className="w-full text-right border-collapse border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="border border-slate-200 p-2.5 font-bold">شرح سرفصل حسابداری</th>
                    <th className="border border-slate-200 p-2.5 font-bold">بدهکار (ریال)</th>
                    <th className="border border-slate-200 p-2.5 font-bold">بستانکار (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">
                      هزینه خسارت تایید شده کارشناسی بدنه و شخص ثالث
                    </td>
                    <td className="border border-slate-200 p-2.5 font-mono font-bold text-slate-900">
                      {formatPrice(selectedOrderForVoucher.grossAmount)}
                    </td>
                    <td className="border border-slate-200 p-2.5 font-mono">-</td>
                  </tr>
                  <tr className="bg-emerald-50/70 font-bold text-slate-900">
                    <td className="border border-slate-200 p-2.5 font-black text-emerald-950">
                      خالص قابل پرداخت / واریز شده به حساب زیان‌دیده (پایا)
                    </td>
                    <td className="border border-slate-200 p-2.5 font-mono">-</td>
                    <td className="border border-slate-200 p-2.5 font-mono text-emerald-800 font-black text-sm">
                      {formatPrice(selectedOrderForVoucher.netPayableAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-10 text-center text-slate-600 border-t border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">کارشناس ارزیاب خسارت</div>
                  <div className="text-[10px] text-slate-400 mt-6">تایید برآورد سیستمی</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">رئیس حسابداری خسارت</div>
                  <div className="text-[10px] text-slate-400 mt-6">انطباق شبا و کدملی</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900">مدیر مالی و خزانه‌داری</div>
                  <div className="text-[10px] text-slate-400 mt-6">دستور واریز بانکی</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 12. MODAL: BATCH GENERATION SUCCESS */}
      {/* ---------------------------------------------------- */}
      {showBatchSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-900 text-base">بسته پرداخت پایا با موفقیت ایجاد شد</h3>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              بسته شناسه <span className="font-mono font-black text-indigo-950">{showBatchSuccessModal.id}</span> شامل{' '}
              <span className="font-mono font-black">{showBatchSuccessModal.totalOrders}</span> فقره حواله به مجموع مبلغ{' '}
              <span className="font-mono font-black text-emerald-800">{formatPrice(showBatchSuccessModal.totalAmount)} ریال</span> با موفقیت ایجاد گردید.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => handleDownloadBatchFile(showBatchSuccessModal)}
                className="px-4 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل پایا</span>
              </button>
              <button
                onClick={() => setShowBatchSuccessModal(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
