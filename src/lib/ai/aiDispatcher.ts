/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ClaimFlow AI - Intelligent Automated Claim Dispatcher & Objection Engine
 * Automatically routes and assigns claims to the optimal branch and expert (desk assessor or field inspector)
 * based on geographic location, presence of police croqui, complexity, and active SLA workload.
 * Also manages 4-stage customer objections, expert rejections, performance penalties, and automated 2-way SMS alerts.
 */

import { ClaimCase, StaffMember, AssessorNotification, CustomerNotification } from '../../types';
import { INITIAL_EXPERTS, INITIAL_FIELD_EXPERTS } from '../../data/mockData';
import {
  loadExpertsFromStorage,
  saveExpertsToStorage,
  loadFieldExpertsFromStorage,
  saveFieldExpertsToStorage,
  loadAssessorNotifications,
  saveAssessorNotifications,
  addCustomerNotification,
  getInsurerPersianName
} from '../../lib/storage';
import { findBestMatchingBranch } from '../../data/bodyInsuranceData';

export interface DispatchResult {
  updatedCase: ClaimCase;
  assignedExpertName: string;
  assignedRole: string;
  assignedBranch: string;
  rationale: string;
}

export function determineBranchByLocation(address: string = '', lat?: number | string, lng?: number | string): {
  branchId: string;
  branchName: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  operatingHours: string;
} {
  const norm = (address || '').toLowerCase();

  if (
    norm.includes('غرب') ||
    norm.includes('آزادی') ||
    norm.includes('ستارخان') ||
    norm.includes('صادقیه') ||
    norm.includes('پونک') ||
    norm.includes('جنت آباد') ||
    norm.includes('اکباتان') ||
    norm.includes('منطقه ۵') ||
    norm.includes('منطقه ۲') ||
    norm.includes('منطقه ۹') ||
    norm.includes('منطقه ۲۱') ||
    norm.includes('منطقه ۲۲') ||
    norm.includes('چیتگر') ||
    norm.includes('کرج') ||
    norm.includes('مخصوص')
  ) {
    return {
      branchId: 'dana-br-2',
      branchName: 'مرکز تخصصی خسارت اتومبیل غرب تهران (آزادی - کیلومتر ۴ مخصوص)',
      city: 'تهران',
      region: 'منطقه غرب و جاده مخصوص',
      address: 'تهران، میدان آزادی، بزرگراه مخصوص کرج، کیلومتر ۴، روبروی تهرانسر',
      phone: '۰۲۱-۴۴۵۵۶۶۷۷',
      operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۳۰ | پنج‌شنبه ۸:۰۰ الی ۱۲:۳۰'
    };
  }

  if (
    norm.includes('شرق') ||
    norm.includes('رسالت') ||
    norm.includes('تهرانپارس') ||
    norm.includes('نارمک') ||
    norm.includes('پیروزی') ||
    norm.includes('افسریه') ||
    norm.includes('منطقه ۴') ||
    norm.includes('منطقه ۸') ||
    norm.includes('منطقه ۱۳') ||
    norm.includes('منطقه ۱۴') ||
    norm.includes('دماوند')
  ) {
    return {
      branchId: 'dana-br-3',
      branchName: 'مرکز تخصصی خسارت اتومبیل شرق تهران (رسالت - هنگام)',
      city: 'تهران',
      region: 'منطقه شرق و شمال شرق',
      address: 'تهران، بزرگراه رسالت، بعد از چهارراه سرسبز، خیابان هنگام، پلاک ۴۴',
      phone: '۰۲۱-۷۷۸۸۹۹۰۰',
      operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۳۰ | پنج‌شنبه ۸:۰۰ الی ۱۲:۳۰'
    };
  }

  if (
    norm.includes('جنوب') ||
    norm.includes('ری') ||
    norm.includes('نازی آباد') ||
    norm.includes('یافت آباد') ||
    norm.includes('منطقه ۱۶') ||
    norm.includes('منطقه ۱۹') ||
    norm.includes('منطقه ۲۰') ||
    norm.includes('شوش') ||
    norm.includes('رجایی')
  ) {
    return {
      branchId: 'dana-br-4',
      branchName: 'مرکز تخصصی خسارت اتومبیل جنوب تهران (میدان ری - بلوار مدرس)',
      city: 'تهران',
      region: 'منطقه جنوب و شهرستان ری',
      address: 'شهر ری، میدان ساعی، خیابان فداییان اسلام، مجتمع تخصصی خسارت خودرو',
      phone: '۰۲۱-۵۵۶۶۷۷۸۸',
      operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۶:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۲:۰۰'
    };
  }

  if (norm.includes('شیراز') || norm.includes('فارس')) {
    return {
      branchId: 'dana-br-shiraz',
      branchName: 'مجتمع تخصصی خسارت اتومبیل شیراز (بلوار مدرس)',
      city: 'شیراز',
      region: 'استان فارس',
      address: 'شیراز، بلوار مدرس، روبروی پایگاه هوایی، مجتمع خسارت بیمه',
      phone: '۰۷۱-۳۷۲۲۱۱۰۰',
      operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰'
    };
  }

  if (norm.includes('اصفهان')) {
    return {
      branchId: 'dana-br-isfahan',
      branchName: 'مجتمع تخصصی خسارت اتومبیل اصفهان (بلوار کاوه)',
      city: 'اصفهان',
      region: 'استان اصفهان',
      address: 'اصفهان، خیابان کاوه، روبروی ترمینال بابلدشت، شعبه تخصصی خسارت',
      phone: '۰۳۱-۳۴۴۵۵۶۶۰',
      operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰'
    };
  }

  if (norm.includes('مشهد') || norm.includes('خراسان')) {
    return {
      branchId: 'dana-br-mashhad',
      branchName: 'مجتمع تخصصی خسارت اتومبیل مشهد (بلوار وکیل آباد)',
      city: 'مشهد',
      region: 'خراسان رضوی',
      address: 'مشهد، بلوار وکیل‌آباد، بین وکیل‌آباد ۲۴ و ۲۶',
      phone: '۰۵۱-۳۸۸۹۹۰۰۰',
      operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۵:۳۰'
    };
  }

  // Default Central Branch (Vanak / Gandhi)
  return {
    branchId: 'dana-br-1',
    branchName: 'مجتمع تخصصی خسارت اتومبیل (مرکزی - میدان ونک)',
    city: 'تهران',
    region: 'منطقه مرکزی و شمال تهران',
    address: 'تهران، میدان ونک، خیابان گاندی جنوبی، کوچه هفدهم، پلاک ۱۲',
    phone: '۰۲۱-۸۸۷۷۶۶۵۵',
    operatingHours: 'شنبه تا چهارشنبه ۸:۰۰ الی ۱۷:۰۰ | پنج‌شنبه ۸:۰۰ الی ۱۳:۰۰'
  };
}

/**
 * Helper to generate and save standard 2-way SMS notifications for Expert and Customer.
 */
export function dispatchTwoWaySmsNotifications(params: {
  claim: ClaimCase;
  expert: StaffMember;
  branch: { name: string; address: string; phone: string; operatingHours?: string };
  isFieldExpert?: boolean;
  suppressCustomerSms?: boolean;
  reason?: string;
  customNote?: string;
}): { expertSmsLog: any; customerSmsLog: any | null } {
  const { claim, expert, branch, isFieldExpert, suppressCustomerSms = isFieldExpert, reason, customNote } = params;
  const companyCode = (claim.culpritInsurer || claim.insurerCode || 'dana').toLowerCase();
  const insurerName = getInsurerPersianName(companyCode);
  const nowFa = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  const vehicleName = claim.carModel || 'خودرو زیان‌دیده';
  const plateText = claim.plate || '—';
  const customerName = claim.victimName || 'مشتری گرامی';
  const customerPhone = claim.victimPhone || '09120000000';
  const accidentLocation = claim.accidentLocation || claim.address || 'موقعیت ثبت‌شده در سامانه';

  // 1. SMS Text for Expert
  let expertSmsText: string;
  if (isFieldExpert) {
    expertSmsText = `کارشناس رسمی گرامی ${expert.name}،
ماموریت ارزیابی و بازدید میدانی پرونده ${claim.id} (${vehicleName} - پلاک ${plateText}) توسط سامانه هوشمند AI به شما محول گردید.
📍 محل حادثه/استقرار: ${accidentLocation}
🏢 نزدیک‌ترین شعبه بیمه: ${branch.name}
👤 مشتری: ${customerName} (همراه: ${customerPhone})
${reason ? `📌 دلیل ارجاع هوشمند: ${reason}` : ''}
${customNote ? `📝 دستور تکمیلی بیمه‌گر: ${customNote}` : ''}
لطفاً جهت هماهنگی و بررسی در کارتابل اقدام فرمایید.
شرکت ${insurerName}`;
  } else {
    expertSmsText = `کارشناس ارزیاب گرامی ${expert.name}،
پرونده خسارت خودرو به شماره ${claim.id} (${vehicleName} - پلاک ${plateText}) توسط سامانه توزیع هوشمند AI به کارتابل شما ارجاع گردید.
🏢 شعبه مرجع: ${branch.name}
👤 طرف پرونده: ${customerName} (همراه: ${customerPhone})
${reason ? `📌 علت ارجاع: ${reason}` : ''}
${customNote ? `📝 دستور تکمیلی بیمه‌گر: ${customNote}` : ''}
لطفاً جهت بررسی مدارک و ثبت برآورد مالی به سامانه مراجعه فرمایید.
شرکت ${insurerName}`;
  }

  const expertSmsLog = {
    id: `SMS-EXP-${Date.now()}`,
    recipientType: (isFieldExpert ? 'FIELD_EXPERT' : 'EXPERT') as any,
    recipientName: expert.name,
    phone: expert.phone || '09120000000',
    text: expertSmsText,
    sentAt: nowFa,
    status: 'DELIVERED' as const
  };

  let customerSmsLog: any = null;

  // 2. SMS Text for Customer (Suppressed for field expert missions since coordination is done in the field)
  if (!suppressCustomerSms) {
    const customerSmsText = `مشتری/بیمه‌گذار گرامی ${customerName}،
پرونده خسارت شماره ${claim.id} با موفقیت در سامانه ثبت و توسط هوش مصنوعی به کارشناس ارزیاب خسارت جناب آقای/سرکار خانم ${expert.name} (همراه: ${expert.phone || '—'}) ارجاع گردید.
🏢 شعبه رسیدگی‌کننده: ${branch.name}
نشانی: ${branch.address}
تلفن: ${branch.phone}
نتیجه ارزیابی آنلاین خسارت متعاقباً از طریق همین سامانه به اطلاع شما خواهد رسید.
شرکت ${insurerName}`;

    customerSmsLog = {
      id: `SMS-CUST-${Date.now() + 1}`,
      recipientType: (claim.isBodyClaim || claim.isBodily ? 'INSURED' : 'VICTIM') as any,
      recipientName: customerName,
      phone: customerPhone,
      text: customerSmsText,
      sentAt: nowFa,
      status: 'DELIVERED' as const
    };

    // Push into Customer Notifications
    try {
      const newCustNotif: CustomerNotification = {
        id: `CUST-NOTIF-${Date.now()}`,
        type: 'EXPERT_ASSIGNED',
        caseId: claim.id,
        recipientPhone: customerPhone,
        title: 'تخصیص هوشمند کارشناس ارزیاب خسارت',
        message: customerSmsText,
        branchName: branch.name,
        branchAddress: branch.address,
        branchPhone: branch.phone,
        expertName: expert.name,
        expertPhone: expert.phone,
        sentAt: new Date().toISOString(),
        date: new Date().toLocaleDateString('fa-IR'),
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        linkAction: 'case_detail'
      };
      addCustomerNotification(newCustNotif);
    } catch (e) {
      console.error('Error saving customer notification:', e);
    }
  }

  // Push into In-App Assessor Notifications
  try {
    const existingNotifs = loadAssessorNotifications();
    const newAssessorNotif: AssessorNotification = {
      id: `SMS-NOTIF-${Date.now()}`,
      type: 'SMS',
      caseId: claim.id,
      expertId: expert.id,
      recipientPhone: expert.phone,
      sender: 'سامانه ارجاع هوشمند AI',
      senderRole: 'سیستم خودکار توزیع بار کاری',
      title: isFieldExpert ? `ارجاع ماموریت بازدید میدانی پرونده ${claim.id}` : `ارجاع هوشمند پرونده خسارت ${claim.id}`,
      message: expertSmsText,
      sentAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('fa-IR'),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    saveAssessorNotifications([newAssessorNotif, ...existingNotifs]);
  } catch (e) {
    console.error('Error saving assessor notification:', e);
  }

  return { expertSmsLog, customerSmsLog };
}

/**
 * Intelligent Automated Claim Dispatcher
 */
export function autoDispatchClaimWithAI(
  claim: ClaimCase,
  options?: {
    excludeExpertIds?: string[];
    forceFieldExpert?: boolean;
    forceDeskExpert?: boolean;
    reason?: string;
    customNote?: string;
  }
): DispatchResult {
  const branchInfo = determineBranchByLocation(claim.address || claim.accidentLocation, claim.lat, claim.lng);
  const hasKroki = !!(claim.hasKroki || claim.sceneReportCode || claim.croquiData || (claim as any).croquiNumber || (claim as any).isOnlineCroqui);
  const nowShamsi = new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  const companyCode = (claim.culpritInsurer || claim.insurerCode || 'dana').toLowerCase();

  const excluded = new Set([
    ...(options?.excludeExpertIds || []),
    ...(claim.previousAssessorIds || []),
    ...(claim.rejectedByAssessorIds || []),
    ...(claim.assignedExpert?.id ? [claim.assignedExpert.id] : [])
  ]);

  const requireField = options?.forceFieldExpert || (!hasKroki && !options?.forceDeskExpert);

  let assignedExpert: StaffMember;
  let assignedRole: string;
  let newStatus: string;
  let rationale: string;

  if (!requireField) {
    // Desk Assessor
    const allStoredExperts = loadExpertsFromStorage();
    const companyExperts = (allStoredExperts[companyCode] || INITIAL_EXPERTS[companyCode] || INITIAL_EXPERTS.dana || []).filter(e => e.active !== false);
    
    // Filter available experts not in exclusion list
    const available = companyExperts.filter(e => !excluded.has(e.id));
    const candidates = available.length > 0 ? available : companyExperts;

    // Pick expert with least active load or highest rating
    candidates.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
    assignedExpert = candidates[0] || {
      id: 'd1',
      name: 'محسن کریمی',
      role: 'کارشناس ارزیاب خسارت خودرو',
      phone: '09121001001',
      nationalId: '0011111111'
    };

    assignedRole = 'کارشناس ارزیاب خسارت خودرو';
    newStatus = 'محول شده به کارشناس';
    rationale = options?.reason || `پرونده به دلیل دارا بودن کروکی رسمی فراجا و مستندات برخط، توسط هوش مصنوعی به ${assignedExpert.name} در ${branchInfo.branchName} محول گردید.`;
  } else {
    // Field Expert
    const allStoredFieldExperts = loadFieldExpertsFromStorage();
    const companyFieldExperts = (allStoredFieldExperts[companyCode] || INITIAL_FIELD_EXPERTS[companyCode] || INITIAL_FIELD_EXPERTS.dana || []).filter(e => e.active !== false);

    const availableField = companyFieldExperts.filter(e => !excluded.has(e.id));
    const matchedBranch = availableField.filter(e => e.branchId === branchInfo.branchId);
    
    if (matchedBranch.length > 0) {
      assignedExpert = matchedBranch[0];
    } else if (availableField.length > 0) {
      assignedExpert = availableField[0];
    } else {
      assignedExpert = companyFieldExperts[0] || {
        id: 'fed1',
        name: 'کیوان عزیزی',
        role: 'کارشناس رسمی بازدید میدانی (بدنه و ثالث)',
        phone: '09129001001',
        nationalId: '0099111111',
        company: 'بیمه دانا',
        branchName: branchInfo.branchName
      };
    }

    assignedRole = 'کارشناس رسمی ارزیاب میدانی';
    newStatus = 'محول شده به کارشناس';
    rationale = options?.reason || `پرونده به دلیل نیاز به بازدید حضوری، با توجه به موقعیت مکانی حادثه (${branchInfo.region}) توسط هوش مصنوعی به کارشناس میدانی ${assignedExpert.name} در ${branchInfo.branchName} محول گردید.`;
  }

  // Generate SMS Notifications (suppress customer SMS for field missions as interaction is handled directly in field)
  const { expertSmsLog, customerSmsLog } = dispatchTwoWaySmsNotifications({
    claim,
    expert: assignedExpert,
    branch: {
      name: branchInfo.branchName,
      address: branchInfo.address,
      phone: branchInfo.phone,
      operatingHours: branchInfo.operatingHours
    },
    isFieldExpert: requireField,
    suppressCustomerSms: requireField,
    reason: rationale,
    customNote: options?.customNote
  });

  const customerSmsStatusText = requireField
    ? `• وضعیت اطلاع‌رسانی مشتری: ارجاع به کارشناس میدانی (انجام هماهنگی حضوری در محل حادثه بدون ارسال پیامک متنی)`
    : `• پیامک مشتری: ارسال موفق به ${claim.victimPhone || 'شماره زیان‌دیده'}`;

  const dispatchHistoryNote = `🤖 ارجاع هوشمند توسط هوش مصنوعی (AI Auto-Dispatcher):
• مقصد ارجاع: ${branchInfo.branchName}
• کارشناس منتخب: ${assignedExpert.name} (${assignedRole})
• پیامک کارشناس: ارسال موفق به ${assignedExpert.phone || 'شماره ثبت‌شده'}
${customerSmsStatusText}
• دلیل ارجاع: ${rationale}`;

  const updatedHistory = [
    ...(claim.history || []),
    {
      status: newStatus as any,
      time: nowShamsi,
      user: 'سامانه توزیع هوشمند AI',
      userRole: 'سیستم هوشمند ارجاع و پیام‌رسانی',
      note: dispatchHistoryNote
    }
  ];

  const aiAnnouncementMessage = {
    sender: 'system' as const,
    name: 'سامانه هوشمند ارجاع AI',
    text: requireField
      ? `پرونده شما با موفقیت توسط هوش مصنوعی ارزیابی و بر اساس موقعیت مکانی و مستندات، جهت بازدید حضوری به ${assignedExpert.name} (${assignedRole} - ${branchInfo.branchName}) ارجاع داده شد.`
      : `پرونده شما با موفقیت توسط هوش مصنوعی ارزیابی و بر اساس موقعیت مکانی و مستندات، به ${assignedExpert.name} (${assignedRole} - ${branchInfo.branchName}) ارجاع داده شد. پیامک اطلاع‌رسانی برای طرفین ارسال گردید.`,
    time: nowShamsi
  };

  const updatedCase: ClaimCase = {
    ...claim,
    status: newStatus as any,
    assignedExpert: {
      id: assignedExpert.id,
      name: assignedExpert.name,
      role: assignedRole,
      phone: assignedExpert.phone,
      nationalId: assignedExpert.nationalId
    },
    assignedFieldExpert: requireField ? {
      id: assignedExpert.id,
      name: assignedExpert.name,
      role: assignedRole,
      phone: assignedExpert.phone,
      nationalId: assignedExpert.nationalId,
      company: companyCode
    } : claim.assignedFieldExpert,
    assignedAt: nowShamsi,
    assignedTimestamp: Date.now(),
    smsDispatchLogs: [
      ...(claim.smsDispatchLogs || []),
      expertSmsLog,
      ...(customerSmsLog ? [customerSmsLog] : [])
    ],
    history: updatedHistory,
    objectionChat: [...(claim.objectionChat || []), aiAnnouncementMessage as any],
    docChat: [...(claim.docChat || []), {
      id: `MSG-AI-${Date.now()}`,
      from: 'expert' as const,
      senderParty: 'EXPERT' as const,
      targetParty: 'PARTY_ONE' as const,
      by: 'سامانه هوشمند AI',
      senderName: 'سامانه هوشمند ارجاع AI',
      text: requireField
        ? `پرونده جهت بازدید میدانی در محل به کارشناس رسمی ${assignedExpert.name} ارجاع گردید.`
        : `پرونده به ${assignedExpert.name} ارجاع گردید و پیامک‌های اطلاع‌رسانی ارسال شدند.`,
      at: nowShamsi
    }],
    aiIntelligence: {
      ...(claim.aiIntelligence || {}),
      aiDispatched: true,
      dispatchBranch: branchInfo.branchName,
      dispatchRationale: rationale,
      dispatchedAt: nowShamsi
    }
  };

  return {
    updatedCase,
    assignedExpertName: assignedExpert.name,
    assignedRole,
    assignedBranch: branchInfo.branchName,
    rationale
  };
}

/**
 * Handles 4-Stage Objections with automated AI dispatch & notification.
 */
export function dispatchObjectionStageWithAI(
  claim: ClaimCase,
  stage: 1 | 2 | 3 | 4,
  objectionReason: string = '',
  extraData?: any
): ClaimCase {
  const currentAssessorId = claim.assignedExpert?.id;
  const currentAssessorName = claim.assignedExpert?.name || claim.assessment?.submittedBy || 'ارزیاب قبلی';
  const nowShamsi = new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  if (stage === 1) {
    // Stage 1: Re-assign to a completely new, independent senior desk assessor
    const updatedPrev = Array.from(new Set([
      ...(claim.previousAssessorIds || []),
      ...(currentAssessorId ? [currentAssessorId] : []),
      ...(claim.rejectedByAssessorIds || [])
    ]));

    const existingAssessments = claim.assessments || [];
    let updatedAssessments = [...existingAssessments];
    if (claim.assessment && !updatedAssessments.some(a => a.gross === claim.assessment?.gross && a.payable === claim.assessment?.payable)) {
      updatedAssessments.push({
        round: 'ارزیابی اول (کارشناس قبلی)',
        roundIdx: 1,
        expertName: currentAssessorName,
        submittedAt: claim.assessment.submittedAt || new Date().toLocaleString('fa-IR'),
        gross: claim.assessment.gross,
        deductions: claim.assessment.deductions,
        salvage: claim.assessment.salvage,
        payable: claim.assessment.payable,
        reviewerNote: claim.assessment.reviewerNote,
        parts: claim.assessment.parts || [],
        aiDecisions: claim.aiDecisions || [],
        status: 'مورد اعتراض زیان‌دیده (مرحله اول)',
      });
    }

    const baseUpdated: ClaimCase = {
      ...claim,
      objectionStage: 1,
      reassessReason: objectionReason.trim(),
      reassessType: 'اعتراض به ارزیابی اولیه',
      assessments: updatedAssessments,
      previousAssignedExpert: claim.assignedExpert || {
        id: currentAssessorId || 'prev_exp_1',
        name: currentAssessorName,
        role: 'کارشناس خسارت خودرو'
      },
      previousAssessorIds: updatedPrev
    };

    // Auto-dispatch via AI excluding previous assessor
    const dispatchResult = autoDispatchClaimWithAI(baseUpdated, {
      excludeExpertIds: updatedPrev,
      forceDeskExpert: true,
      reason: `ثبت اعتراض مرحله اول زیان‌دیده (علت: «${objectionReason.trim()}»). ارجاع خودکار به ارزیاب مستقل جدید (${currentAssessorName} مستثنی گردید).`
    });

    return dispatchResult.updatedCase;
  }

  if (stage === 2) {
    // Stage 2: Direct Chat with Expert 2
    const initialChatMsg = {
      sender: 'customer' as const,
      name: claim.victimName || 'زیان‌دیده',
      text: `[اعتراض مرحله دوم] ${objectionReason.trim()}`,
      time: nowShamsi
    };

    return {
      ...claim,
      objectionStage: 2,
      status: 'در انتظار پاسخ به ارزیاب',
      objectionChat: [...(claim.objectionChat || []), initialChatMsg as any],
      history: [
        ...(claim.history || []),
        {
          status: 'در انتظار پاسخ به ارزیاب',
          time: nowShamsi,
          user: claim.victimName || 'زیان‌دیده',
          note: `ثبت اعتراض مرحله دوم: «${objectionReason.trim()}». کانال گفتگوی مستقیم با ارزیاب دوم فعال شد.`
        }
      ]
    };
  }

  if (stage === 3) {
    // Stage 3: Workshop Info
    return {
      ...claim,
      objectionStage: 3,
      status: 'در حال بررسی اطلاعات تعمیرگاه توسط ارزیاب',
      workshopInfo: extraData?.workshopInfo || claim.workshopInfo,
      history: [
        ...(claim.history || []),
        {
          status: 'در حال بررسی اطلاعات تعمیرگاه توسط ارزیاب',
          time: nowShamsi,
          user: claim.victimName || 'زیان‌دیده',
          note: `ثبت اطلاعات و فاکتور تعمیرگاه منتخب جهت ارزیابی مجدد توسط هوش مصنوعی و کارشناس.`
        }
      ]
    };
  }

  if (stage === 4) {
    // Stage 4: Field Inspection / Branch Visit Reassignment
    const baseUpdated: ClaimCase = {
      ...claim,
      objectionStage: 4,
      accidentLocation: extraData?.address || claim.accidentLocation || 'تهران'
    };

    const dispatchResult = autoDispatchClaimWithAI(baseUpdated, {
      forceFieldExpert: true,
      reason: `ثبت اعتراض مرحله چهارم زیان‌دیده جهت بازدید حضوری و تطبیق اصالت در محل حادثه یا نزدیک‌ترین شعبه تخصصی.`
    });

    return dispatchResult.updatedCase;
  }

  return claim;
}

/**
 * Handles expert rejection: Penalizes the rejecting expert's rating & score in storage,
 * and automatically triggers an AI re-dispatch to another qualified assessor with 2-way SMS.
 */
export function handleExpertRejectionWithAI(
  claim: ClaimCase,
  rejectingExpert: { id: string; name: string },
  rejectReason: string
): ClaimCase {
  const companyCode = (claim.culpritInsurer || claim.insurerCode || 'dana').toLowerCase();
  const nowShamsi = new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  // 1. Penalize expert rating in storage (-0.2 score deduction, track rejectedCases)
  try {
    const allStoredExperts = loadExpertsFromStorage();
    const companyList = allStoredExperts[companyCode] || INITIAL_EXPERTS[companyCode] || [];
    const expIndex = companyList.findIndex(e => e.id === rejectingExpert.id);

    if (expIndex !== -1) {
      const exp = companyList[expIndex];
      const currentRating = exp.rating || 4.8;
      const newRating = Math.max(1.0, Number((currentRating - 0.2).toFixed(1)));
      const rejectedCount = (exp as any).rejectedCases ? (exp as any).rejectedCases + 1 : 1;

      companyList[expIndex] = {
        ...exp,
        rating: newRating,
        status: 'AVAILABLE',
        activeCases: Math.max(0, (exp.activeCases || 1) - 1),
        ...({ rejectedCases: rejectedCount })
      };

      allStoredExperts[companyCode] = companyList;
      saveExpertsToStorage(allStoredExperts);
    }
  } catch (e) {
    console.error('Error updating expert penalty in storage:', e);
  }

  // Also penalize field experts if applicable
  try {
    const allStoredField = loadFieldExpertsFromStorage();
    const fieldList = allStoredField[companyCode] || INITIAL_FIELD_EXPERTS[companyCode] || [];
    const fIndex = fieldList.findIndex(e => e.id === rejectingExpert.id);
    if (fIndex !== -1) {
      const fe = fieldList[fIndex];
      const currentRating = fe.rating || 4.8;
      const newRating = Math.max(1.0, Number((currentRating - 0.2).toFixed(1)));
      const rejectedCount = (fe as any).rejectedCases ? (fe as any).rejectedCases + 1 : 1;

      fieldList[fIndex] = {
        ...fe,
        rating: newRating,
        status: 'AVAILABLE',
        activeCases: Math.max(0, (fe.activeCases || 1) - 1),
        ...({ rejectedCases: rejectedCount })
      };

      allStoredField[companyCode] = fieldList;
      saveFieldExpertsToStorage(allStoredField);
    }
  } catch (e) {
    console.error('Error updating field expert penalty in storage:', e);
  }

  // 2. Prepare claim state with rejection metadata
  const updatedRejections = Array.from(new Set([
    ...(claim.rejectedByAssessorIds || []),
    rejectingExpert.id
  ]));

  const baseCase: ClaimCase = {
    ...claim,
    rejectedByAssessorIds: updatedRejections,
    expertRejected: {
      by: rejectingExpert.name,
      at: nowShamsi,
      reason: rejectReason
    },
    history: [
      ...(claim.history || []),
      {
        status: 'رد شده توسط کارشناس',
        time: nowShamsi,
        user: rejectingExpert.name,
        userRole: 'کارشناس ارزیاب',
        note: `❌ پرونده توسط کارشناس (${rejectingExpert.name}) رد شد. علت رد: «${rejectReason}» (کسر ۰.۲ از امتیاز عملکرد کارشناس در سامانه).`
      }
    ]
  };

  // 3. Immediately Auto Re-dispatch with AI to an alternative expert
  const dispatchResult = autoDispatchClaimWithAI(baseCase, {
    excludeExpertIds: updatedRejections,
    reason: `بازارجاع هوشمند به دلیل عدم امکان بررسی توسط ${rejectingExpert.name} (علت: «${rejectReason}»). پرونده به کارشناس جایگزین واجد شرایط محول گردید.`
  });

  return dispatchResult.updatedCase;
}
