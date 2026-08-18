import React, { useState, useEffect } from 'react';
import { ClaimCase, UserSession, RoleType } from './types';
import { loadCasesFromStorage, saveCasesToStorage, loadSession, saveSession, checkAndProcessTimeouts } from './lib/storage';

// Navigation Components
import { Navbar } from './components/Navbar';
import { PortalGateway } from './components/PortalGateway';
import { PublicTracker } from './components/PublicTracker';

// Customer Components
import { CustomerDashboard } from './components/CustomerPortal/CustomerDashboard';
import { AccidentWizard } from './components/CustomerPortal/AccidentWizard';
import { BodilyInsuranceModule } from './components/CustomerPortal/BodilyInsuranceModule';
import { CustomerCaseDetail } from './components/CustomerPortal/CustomerCaseDetail';

// Insurer Components
import { InsurerDashboard } from './components/InsurerPortal/InsurerDashboard';
import { InsurerCaseDetail } from './components/InsurerPortal/InsurerCaseDetail';
import { PayoutQueue } from './components/InsurerPortal/PayoutQueue';

// Assessor Components
import { AssessorPanel } from './components/AssessorPortal/AssessorPanel';

// Field Expert Components (Dedicated & Independent)
import { FieldExpertPanel } from './components/FieldExpertPortal/FieldExpertPanel';

// Reviewer Components
import { ReviewerPanel } from './components/ReviewerPortal/ReviewerPanel';

// Finance Components
import { FinanceManagerPanel } from './components/FinancePortal/FinanceManagerPanel';

// CRM & Support Components
import { CrmSupportPanel } from './components/CrmPortal/CrmSupportPanel';

// Senior Admin & System Management Component
import { SeniorAdminPanel } from './components/AdminPortal/SeniorAdminPanel';

export default function App() {
  const [cases, setCases] = useState<ClaimCase[]>(() => loadCasesFromStorage());
  const [session, setSession] = useState<UserSession | null>(() => loadSession());
  const [activeView, setActiveView] = useState<string>(() => {
    const s = loadSession();
    if (!s) return 'gateway';
    switch (s.role) {
      case 'customer':
        return 'customerDashboard';
      case 'reviewer':
        return 'reviewerPanel';
      case 'finance':
        return 'financePanel';
      case 'crm':
        return 'crmPanel';
      case 'admin':
        return 'seniorAdminPanel';
      case 'insurer':
        return 'insurerDashboard';
      case 'fieldexpert':
        return 'fieldExpertPanel';
      case 'assessor':
        return 'assessorPanel';
      default:
        return 'gateway';
    }
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Sync cases to local storage whenever state updates and process 72h timeouts
  useEffect(() => {
    const result = checkAndProcessTimeouts(cases);
    if (result.didChange) {
      setCases(result.updatedCases);
      saveCasesToStorage(result.updatedCases);
    } else {
      saveCasesToStorage(cases);
    }
  }, [cases]);

  // Periodic check for 72h timeouts every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCases((prev) => {
        const result = checkAndProcessTimeouts(prev);
        if (result.didChange) {
          saveCasesToStorage(result.updatedCases);
          return result.updatedCases;
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync user session to session storage
  useEffect(() => {
    saveSession(session);
  }, [session]);

  const handleSelectPortal = (role: RoleType, payload?: UserSession) => {
    let newSession: UserSession;
    if (payload) {
      newSession = payload;
    } else {
      newSession = {
        id: role === 'customer' ? '09123456789' : 'dana',
        role: role,
        name:
          role === 'customer'
            ? 'مهدی کشاورز'
            : role === 'insurer'
            ? 'پورتال بیمه دانا'
            : role === 'assessor'
            ? 'ارزیاب خسارت'
            : role === 'fieldexpert'
            ? 'کارشناس میدانی'
            : role === 'reviewer'
            ? 'بازبین کیفیت'
            : role === 'finance'
            ? 'مدیر مالی و خزانه‌داری'
            : role === 'crm'
            ? 'امور مشتریان و CRM'
            : 'مدیر سامانه'
      };
    }

    setSession(newSession);

    switch (role) {
      case 'customer':
        setActiveView('customerDashboard');
        break;
      case 'reviewer':
        setActiveView('reviewerPanel');
        break;
      case 'finance':
        setActiveView('financePanel');
        break;
      case 'crm':
        setActiveView('crmPanel');
        break;
      case 'admin':
        setActiveView('seniorAdminPanel');
        break;
      case 'insurer':
        setActiveView('insurerDashboard');
        break;
      case 'fieldexpert':
        setActiveView('fieldExpertPanel');
        break;
      case 'assessor':
        setActiveView('assessorPanel');
        break;
      default:
        setActiveView('gateway');
        break;
    }
  };

  const handleLogout = () => {
    setSession(null);
    saveSession(null);
    setActiveView('gateway');
    setSelectedCaseId(null);
  };

  const handleUpdateCase = (updatedCase: ClaimCase) => {
    setCases((prev) => {
      const exists = prev.some((c) => c.id === updatedCase.id);
      if (exists) {
        return prev.map((c) => (c.id === updatedCase.id ? updatedCase : c));
      } else {
        return [updatedCase, ...prev];
      }
    });
  };

  const handleNewAccidentCompleted = (newCase: ClaimCase) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
    setActiveView('customerCaseDetail');
  };

  const handleBodilySubmit = (newBodilyCase: ClaimCase) => {
    setCases((prev) => [newBodilyCase, ...prev]);
  };

  const handleOpenCaseDetail = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (!session || session.role === 'customer') {
      setActiveView('customerCaseDetail');
    } else if (session.role === 'reviewer') {
      setActiveView('reviewerPanel');
    } else if (session.role === 'finance') {
      setActiveView('financePanel');
    } else if (session.role === 'crm') {
      setActiveView('crmPanel');
    } else if (session.role === 'fieldexpert') {
      setActiveView('fieldExpertPanel');
    } else if (session.role === 'assessor') {
      setActiveView('assessorPanel');
    } else {
      setActiveView('insurerCaseDetail');
    }
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-amber-300" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        currentSession={session}
        onLogout={handleLogout}
        onGoHome={() => setActiveView('gateway')}
        onOpenPublicTrack={() => setActiveView('publicTrack')}
        onSelectPortal={(role) => handleSelectPortal(role)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View 1: Gateway */}
        {activeView === 'gateway' && (
          <PortalGateway
            onSelectPortal={(role, payload) => handleSelectPortal(role, payload)}
            onOpenPublicTrack={() => setActiveView('publicTrack')}
          />
        )}

        {/* View 2: Public Tracker */}
        {activeView === 'publicTrack' && (
          <div className="py-6">
            <PublicTracker
              cases={cases}
              onClose={() => setActiveView('gateway')}
              onOpenCaseDetail={(caseId) => handleOpenCaseDetail(caseId)}
            />
          </div>
        )}

        {/* View 3: Customer Dashboard */}
        {activeView === 'customerDashboard' && session && (
          <CustomerDashboard
            session={session}
            cases={cases}
            onNavigate={(view) => {
              if (view === 'bodily') setActiveView('customerBodily');
            }}
            onOpenCaseDetail={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveView('customerCaseDetail');
            }}
            onStartWizard={() => setActiveView('customerWizard')}
            onUpdateSession={(updatedSession) => setSession(updatedSession)}
          />
        )}

        {/* View 4: Customer Accident Wizard */}
        {activeView === 'customerWizard' && session && (
          <AccidentWizard
            session={session}
            onComplete={handleNewAccidentCompleted}
            onCancel={() => setActiveView('customerDashboard')}
          />
        )}

        {/* View 5: Customer Bodily Insurance Module */}
        {activeView === 'customerBodily' && session && (
          <BodilyInsuranceModule
            session={session}
            cases={cases}
            onSubmitBodily={handleBodilySubmit}
            onBack={() => setActiveView('customerDashboard')}
            onOpenCaseDetail={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveView('customerCaseDetail');
            }}
          />
        )}

        {/* View 6: Customer Case Detail */}
        {activeView === 'customerCaseDetail' && session && selectedCase && (
          <CustomerCaseDetail
            session={session}
            claimCase={selectedCase}
            onBack={() => {
              if (selectedCase.isBodyClaim || selectedCase.isBodily || selectedCase.id?.startsWith('BD-')) {
                setActiveView('customerBodily');
              } else {
                setActiveView('customerDashboard');
              }
            }}
            onUpdateCase={handleUpdateCase}
          />
        )}

        {/* View 7: Insurer Dashboard */}
        {activeView === 'insurerDashboard' && session && (
          <InsurerDashboard
            session={session}
            cases={cases}
            onOpenCaseDetail={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveView('insurerCaseDetail');
            }}
            onNavigateTab={(tab) => {
              if (tab === 'payout') setActiveView('insurerPayoutQueue');
            }}
            onUpdateCase={handleUpdateCase}
            onLogout={handleLogout}
          />
        )}

        {/* View 8: Insurer Case Detail */}
        {activeView === 'insurerCaseDetail' && session && selectedCase && (
          <InsurerCaseDetail
            session={session}
            claimCase={selectedCase}
            onBack={() => setActiveView('insurerDashboard')}
            onUpdateCase={handleUpdateCase}
          />
        )}

        {/* View 9: Insurer Payout Queue */}
        {activeView === 'insurerPayoutQueue' && session && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-xs">
              <span className="font-bold text-slate-300">
                پورتال بیمه‌گر ({session.name})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('insurerDashboard')}
                  className="px-3 py-1.5 rounded-xl font-bold bg-slate-700 text-slate-300 hover:text-white"
                >
                  پرونده‌های ارجاعی
                </button>
                <button
                  onClick={() => setActiveView('insurerPayoutQueue')}
                  className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 text-white"
                >
                  صف واریز بانک (شبا)
                </button>
              </div>
            </div>

            <PayoutQueue
              session={session}
              cases={cases}
              onUpdateCase={handleUpdateCase}
            />
          </div>
        )}

        {/* View 10: Assessor Panel */}
        {activeView === 'assessorPanel' && session && (
          <AssessorPanel
            session={session}
            cases={cases}
            onUpdateCase={handleUpdateCase}
            onOpenCaseForm={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveView('customerCaseDetail');
            }}
          />
        )}

        {/* View 10.5: Dedicated Field Expert Panel */}
        {activeView === 'fieldExpertPanel' && session && (
          <FieldExpertPanel
            session={session}
            cases={cases}
            onUpdateCase={handleUpdateCase}
            onOpenCaseForm={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveView('customerCaseDetail');
            }}
          />
        )}

        {/* View 11: Dedicated Reviewer Panel */}
        {activeView === 'reviewerPanel' && session && (
          <ReviewerPanel
            session={session}
            cases={cases}
            onUpdateCase={handleUpdateCase}
            onLogout={handleLogout}
          />
        )}

        {/* View 12: Dedicated Finance Manager Panel */}
        {activeView === 'financePanel' && session && (
          <FinanceManagerPanel
            session={session}
            cases={cases}
            onUpdateCase={handleUpdateCase}
            onOpenCaseForm={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveView('insurerCaseDetail');
            }}
          />
        )}

        {/* View 13: Dedicated CRM & Customer Support Panel */}
        {activeView === 'crmPanel' && session && (
          <CrmSupportPanel
            session={session}
            cases={cases}
            onUpdateCase={handleUpdateCase}
            onOpenCaseForm={(caseId) => {
              setSelectedCaseId(caseId);
              setActiveView('insurerCaseDetail');
            }}
          />
        )}

        {/* View 14: Dedicated Senior Admin & System Management Panel */}
        {activeView === 'seniorAdminPanel' && session && (
          <SeniorAdminPanel
            session={session}
            onLogout={handleLogout}
            onSwitchPortal={(targetPortal, mockSession) => {
              if (mockSession) {
                setSession(mockSession);
                saveSession(mockSession);
              }
              switch (targetPortal) {
                case 'insurer':
                  setActiveView('insurerDashboard');
                  break;
                case 'expert':
                case 'assessor':
                  setActiveView('assessorPanel');
                  break;
                case 'fieldexpert':
                  setActiveView('fieldExpertPanel');
                  break;
                case 'reviewer':
                  setActiveView('reviewerPanel');
                  break;
                case 'finance':
                  setActiveView('financePanel');
                  break;
                case 'crm':
                  setActiveView('crmPanel');
                  break;
                default:
                  setActiveView('insurerDashboard');
                  break;
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
