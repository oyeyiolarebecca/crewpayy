/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CheckSquare,
  Globe,
  FileText,
  Landmark,
  Receipt,
  ShieldCheck,
  Building2,
  Activity,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Play,
  Check,
  UserCheck,
  Sparkles,
  LogOut,
} from 'lucide-react';
import {
  UserRole,
  NavSectionId,
  Organisation,
  Employee,
  Transaction,
  ApprovalItem,
  MonthlySpending,
  CurrencyAllocation,
  UpcomingPayrollCycle,
  EmployeePayslip,
  AdminAuditLog,
  ToastMessage,
} from './types/crewpay';
import {
  ORGANISATIONS,
  INITIAL_EMPLOYEES,
  INITIAL_TRANSACTIONS,
  INITIAL_APPROVALS,
  MONTHLY_SPENDING_DATA,
  INITIAL_CURRENCIES,
  INITIAL_UPCOMING_CYCLES,
  INITIAL_EMPLOYEE_PAYSLIPS,
  INITIAL_ADMIN_LOGS,
} from './data/initialData';
import { Button, ToastViewport } from './components/ui/DesignSystem';
import { CompanyViews } from './components/company/CompanyViews';
import { EmployeeViews } from './components/employee/EmployeeViews';
import { AdminViews } from './components/admin/AdminViews';
import { RunPayrollModal } from './components/modals/RunPayrollModal';
import { AuthPage, AuthUser } from './components/auth/AuthPage';
import { CrewPayMark } from './components/ui/Brand';

interface NavItemConfig {
  id: NavSectionId;
  label: string;
  icon: React.ReactNode;
  badgeCount?: number;
}

export default function App() {
  // ==========================================================================
  // APPLICATION STATE
  // ==========================================================================
  const [session, setSession] = useState<{ user: AuthUser; token: string } | null>(() => {
    const token = window.localStorage.getItem('crewpay_session_token');
    const storedUser = window.localStorage.getItem('crewpay_session_user');
    return token && storedUser ? { token, user: JSON.parse(storedUser) as AuthUser } : null;
  });
  const [authChecking, setAuthChecking] = useState(true);
  const [role, setRole] = useState<UserRole>('company');
  const [activeSection, setActiveSection] =
    useState<NavSectionId>('company_dashboard');
  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    ORGANISATIONS[0].id
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!session) {
      setAuthChecking(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Session expired');
        return response.json();
      })
      .then(({ user }) => {
        const nextSession = { token: session.token, user: user as AuthUser };
        setSession(nextSession);
        setRole(user.role);
        window.localStorage.setItem('crewpay_session_user', JSON.stringify(user));
      })
      .catch(() => {
        window.localStorage.removeItem('crewpay_session_token');
        window.localStorage.removeItem('crewpay_session_user');
        setSession(null);
      })
      .finally(() => setAuthChecking(false));
  }, []);

  const handleAuthenticated = (user: AuthUser, token: string) => {
    setSession({ user, token });
    setRole(user.role);
    window.localStorage.setItem('crewpay_session_token', token);
    window.localStorage.setItem('crewpay_session_user', JSON.stringify(user));
  };

  const handleSignOut = async () => {
    if (session) {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      }).catch(() => undefined);
    }
    window.localStorage.removeItem('crewpay_session_token');
    window.localStorage.removeItem('crewpay_session_user');
    setSession(null);
  };

  // Core Domain State
  const [organisations] = useState<Organisation[]>(ORGANISATIONS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [transactions, setTransactions] = useState<Transaction[]>(
    INITIAL_TRANSACTIONS
  );
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [spendingData, setSpendingData] = useState<MonthlySpending[]>(
    MONTHLY_SPENDING_DATA
  );
  const [currencies, setCurrencies] =
    useState<CurrencyAllocation[]>(INITIAL_CURRENCIES);
  const [upcomingCycles, setUpcomingCycles] = useState<UpcomingPayrollCycle[]>(
    INITIAL_UPCOMING_CYCLES
  );
  const [employeePayslips, setEmployeePayslips] = useState<EmployeePayslip[]>(
    INITIAL_EMPLOYEE_PAYSLIPS
  );
  const [auditLogs, setAuditLogs] =
    useState<AdminAuditLog[]>(INITIAL_ADMIN_LOGS);

  // Modals & Popovers
  const [activePayrollCycle, setActivePayrollCycle] =
    useState<UpcomingPayrollCycle | null>(null);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'November Global Payroll Ready',
      detail: '148 employees verified across 6 currency corridors ($1,770,400).',
      time: '12m ago',
      unread: true,
      targetSection: 'company_payroll' as NavSectionId,
      targetRole: 'company' as UserRole,
    },
    {
      id: 'notif_2',
      title: '4 Dual-Control Approvals Pending',
      detail: 'Marcus Vance off-cycle bonus & 3 other requests await sign-off.',
      time: '2h ago',
      unread: true,
      targetSection: 'company_approvals' as NavSectionId,
      targetRole: 'company' as UserRole,
    },
    {
      id: 'notif_3',
      title: 'October Payslip Statement Available',
      detail: 'Amara Okafor (£8,211.00 GBP) settled via UK Faster Payments.',
      time: '1d ago',
      unread: false,
      targetSection: 'employee_payslips' as NavSectionId,
      targetRole: 'employee' as UserRole,
    },
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const orgRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) {
        setOrgMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const pushToast = (
    title: string,
    description: string,
    variant: ToastMessage['variant'] = 'success'
  ) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Switch role & set default section
  const handleSwitchRole = (newRole: UserRole) => {
    setRole(newRole);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    if (newRole === 'company') setActiveSection('company_dashboard');
    if (newRole === 'employee') setActiveSection('employee_overview');
    if (newRole === 'admin') setActiveSection('admin_overview');
  };

  const currentOrg = useMemo(
    () =>
      organisations.find((o) => o.id === selectedOrgId) || organisations[0],
    [organisations, selectedOrgId]
  );

  const pendingApprovalsCount = useMemo(
    () => approvals.filter((a) => a.status === 'pending').length,
    [approvals]
  );

  const unverifiedAccountsCount = useMemo(
    () => employees.filter((e) => e.accountStatus !== 'verified').length,
    [employees]
  );

  // ==========================================================================
  // BUSINESS LOGIC HANDLERS
  // ==========================================================================
  const handleCompletePayroll = (
    cycleId: string,
    totalDisbursedUsd: number,
    selectedEmployeeIds: string[]
  ) => {
    setUpcomingCycles((prev) =>
      prev.map((c) =>
        c.id === cycleId
          ? { ...c, status: 'completed', readinessPercent: 100 }
          : c
      )
    );

    const newBatchTxn: Transaction = {
      id: `txn_${Date.now()}`,
      reference: `CP-2026-${Math.floor(89000 + Math.random() * 9000)}`,
      employeeId: 'batch',
      employeeName: `Global Batch (${selectedEmployeeIds.length} Key Personnel)`,
      department: 'All Departments',
      type: 'Payroll',
      amountLocal: totalDisbursedUsd,
      currency: 'USD',
      amountUsd: totalDisbursedUsd,
      fxRate: 1.0,
      status: 'completed',
      date: 'Just now · UTC',
      settlementRail: 'SEPA Instant',
    };

    setTransactions((prev) => [newBatchTxn, ...prev]);

    // Mark scheduled November payslip as paid for employee view
    setEmployeePayslips((prev) =>
      prev.map((s, idx) => (idx === 0 ? { ...s, status: 'paid' } : s))
    );

    setAuditLogs((prev) => [
      {
        id: `aud_${Date.now()}`,
        timestamp: 'Just now · UTC',
        actor: 'Amaka Nwosu',
        actorRole: 'VP Finance & Treasury',
        action: `Disbursed Global Payroll Batch ($${totalDisbursedUsd.toLocaleString()} USD)`,
        entityName: currentOrg.name,
        corridor: 'Multi-Rail Instant',
        status: 'completed',
        amountUsd: totalDisbursedUsd,
      },
      ...prev,
    ]);

    pushToast(
      'Payroll Batch Settled',
      `$${totalDisbursedUsd.toLocaleString()} USD disbursed across ${currentOrg.name}.`,
      'success'
    );
  };

  const handleApproveItem = (id: string) => {
    const target = approvals.find((a) => a.id === id);
    if (!target) return;

    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' } : a))
    );

    const newTxn: Transaction = {
      id: `txn_${Date.now()}`,
      reference: `CP-2026-${Math.floor(89000 + Math.random() * 9000)}`,
      employeeId: 'emp_approved',
      employeeName: target.requesterName,
      department: target.department,
      type:
        target.category === 'Expense Claim'
          ? 'Expense Reimbursement'
          : 'Bonus',
      amountLocal: target.amountLocal,
      currency: target.currency,
      amountUsd: target.amountUsd,
      fxRate: Number((target.amountLocal / target.amountUsd).toFixed(2)) || 1,
      status: 'completed',
      date: 'Just now · UTC',
      settlementRail: 'Faster Payments',
    };

    setTransactions((prev) => [newTxn, ...prev]);
    pushToast(
      'Authorization Approved & Released',
      `${target.title} (${target.currency} ${target.amountLocal.toLocaleString()}) has been settled.`,
      'success'
    );
  };

  const handleRejectItem = (id: string) => {
    const target = approvals.find((a) => a.id === id);
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
    );
    if (target) {
      pushToast(
        'Request Declined',
        `${target.title} by ${target.requesterName} was marked as declined.`,
        'info'
      );
    }
  };

  const handleAddEmployee = (newEmpData: Omit<Employee, 'id'>) => {
    const created: Employee = {
      ...newEmpData,
      id: `emp_${Date.now()}`,
    };
    setEmployees((prev) => [created, ...prev]);
    pushToast(
      'Team Member Onboarded',
      `${created.name} (${created.role}) added to ${currentOrg.name}.`,
      'success'
    );
  };

  const handleRetryTransaction = (txnId: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txnId ? { ...t, status: 'completed' } : t))
    );
    pushToast(
      'Settlement Re-Routed & Completed',
      'Transaction cleared via fallback instant corridor.',
      'success'
    );
  };

  const handleConvertCurrency = (
    fromCode: string,
    toCode: string,
    usdAmount: number
  ) => {
    setCurrencies((prev) =>
      prev.map((c) => {
        if (c.code === fromCode) {
          const deductionLocal = Math.round(usdAmount * c.fxRateToUsd);
          return {
            ...c,
            walletBalanceLocal: Math.max(
              0,
              c.walletBalanceLocal - deductionLocal
            ),
          };
        }
        if (c.code === toCode) {
          const additionLocal = Math.round(usdAmount * c.fxRateToUsd);
          return {
            ...c,
            walletBalanceLocal: c.walletBalanceLocal + additionLocal,
          };
        }
        return c;
      })
    );

    pushToast(
      'FX Conversion Executed',
      `Converted $${usdAmount.toLocaleString()} USD equivalent from ${fromCode} to ${toCode} at 0.00% spread.`,
      'success'
    );
  };

  const handleUpdateEmployeeAccount = (updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((emp, idx) => (idx === 0 ? { ...emp, ...updates } : emp))
    );
    pushToast(
      'Employee Payout Preferences Saved',
      'Your receiving currency and beneficiary account settings are active for the next payroll run.',
      'success'
    );
  };

  const handleSubmitExpenseClaim = (
    title: string,
    amountLocal: number,
    currency: string,
    description: string
  ) => {
    const rateMap: Record<string, number> = {
      GBP: 0.78,
      EUR: 0.92,
      USD: 1,
      NGN: 1600,
      SGD: 1.35,
    };
    const usdAmount = Math.round(amountLocal / (rateMap[currency] || 1));
    const newApproval: ApprovalItem = {
      id: `apr_${Date.now()}`,
      title,
      requesterName: employees[0].name,
      requesterRole: employees[0].role,
      department: employees[0].department,
      category: 'Expense Claim',
      amountLocal,
      currency,
      amountUsd: usdAmount,
      submittedAt: 'Just now',
      urgency: 'standard',
      description,
      status: 'pending',
    };
    setApprovals((prev) => [newApproval, ...prev]);
    pushToast(
      'Expense Claim Submitted',
      `${title} (${currency} ${amountLocal.toLocaleString()}) sent to Finance Approvals queue.`,
      'success'
    );
  };

  const handleVerifyEmployeeBank = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === empId ? { ...e, accountStatus: 'verified' } : e
      )
    );
    if (emp) {
      pushToast(
        'Beneficiary Account Verified',
        `${emp.name}'s ${emp.bankName} corridor is now cleared for instant payouts.`,
        'success'
      );
    }
  };

  const handleResolveAuditFlag = (logId: string) => {
    setAuditLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, status: 'verified' } : l))
    );
    pushToast(
      'Compliance Hold Cleared',
      'Sanctions and IBAN name-match attestation logged.',
      'info'
    );
  };

  // ==========================================================================
  // NAVIGATION CONFIGURATION
  // ==========================================================================
  const navItems: NavItemConfig[] = useMemo(() => {
    if (role === 'company') {
      return [
        {
          id: 'company_dashboard',
          label: 'Financial Overview',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'company_payroll',
          label: 'Payroll Cycles',
          icon: <Wallet className="w-4 h-4" />,
        },
        {
          id: 'company_employees',
          label: 'Employees & Crew',
          icon: <Users className="w-4 h-4" />,
        },
        {
          id: 'company_approvals',
          label: 'Pending Approvals',
          icon: <CheckSquare className="w-4 h-4" />,
          badgeCount: pendingApprovalsCount,
        },
        {
          id: 'company_treasury',
          label: 'FX & Treasury',
          icon: <Globe className="w-4 h-4" />,
        },
      ];
    }
    if (role === 'employee') {
      return [
        {
          id: 'employee_overview',
          label: 'My Compensation',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'employee_payslips',
          label: 'Payslips & Tax',
          icon: <FileText className="w-4 h-4" />,
        },
        {
          id: 'employee_accounts',
          label: 'Currency & Bank',
          icon: <Landmark className="w-4 h-4" />,
        },
        {
          id: 'employee_expenses',
          label: 'Expense Claims',
          icon: <Receipt className="w-4 h-4" />,
        },
      ];
    }
    return [
      {
        id: 'admin_overview',
        label: 'Platform Governance',
        icon: <ShieldCheck className="w-4 h-4" />,
        badgeCount: unverifiedAccountsCount,
      },
      {
        id: 'admin_organisations',
        label: 'Legal Entities',
        icon: <Building2 className="w-4 h-4" />,
      },
      {
        id: 'admin_compliance',
        label: 'Audit & KYB Ledger',
        icon: <Activity className="w-4 h-4" />,
      },
    ];
  }, [role, pendingApprovalsCount, unverifiedAccountsCount]);

  const pageMeta: Record<
    NavSectionId,
    { title: string; breadcrumb: string }
  > = {
    company_dashboard: {
      title: 'Financial Operations Dashboard',
      breadcrumb: 'Company Operations / Overview',
    },
    company_payroll: {
      title: 'Global Payroll Cycles',
      breadcrumb: 'Company Operations / Payroll Runs',
    },
    company_employees: {
      title: 'Employees & Compensation Directory',
      breadcrumb: 'Company Operations / Workforce',
    },
    company_approvals: {
      title: 'Approvals & Authorizations',
      breadcrumb: 'Company Operations / Dual-Control Queue',
    },
    company_treasury: {
      title: 'Multi-Currency Treasury',
      breadcrumb: 'Company Operations / FX Liquidity',
    },
    employee_overview: {
      title: 'Welcome back, Amara Okafor',
      breadcrumb: 'Employee Portal / Compensation Summary',
    },
    employee_payslips: {
      title: 'Payslips & Statutory Tax Statements',
      breadcrumb: 'Employee Portal / Statements',
    },
    employee_accounts: {
      title: 'Payment Account & Receiving Currency',
      breadcrumb: 'Employee Portal / Routing Settings',
    },
    employee_expenses: {
      title: 'Reimbursements & Expense Claims',
      breadcrumb: 'Employee Portal / Expenses',
    },
    admin_overview: {
      title: 'Platform Governance & Compliance',
      breadcrumb: 'Administrator / Global Operations',
    },
    admin_organisations: {
      title: 'Multi-Entity Corporate Registry',
      breadcrumb: 'Administrator / Legal Entities',
    },
    admin_compliance: {
      title: 'Cryptographic Audit & AML Trail',
      breadcrumb: 'Administrator / Compliance',
    },
  };

  // Global search results
  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return [];
    const q = globalSearch.toLowerCase();
    const matchedEmps = employees
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        label: e.name,
        sub: `${e.role} · ${e.location} (${e.receivingCurrency})`,
        action: () => {
          setRole('company');
          setActiveSection('company_employees');
          setSearchFocused(false);
          setGlobalSearch('');
        },
      }));

    const matchedTxns = transactions
      .filter(
        (t) =>
          t.reference.toLowerCase().includes(q) ||
          t.employeeName.toLowerCase().includes(q)
      )
      .slice(0, 3)
      .map((t) => ({
        id: t.id,
        label: `${t.reference} · ${t.employeeName}`,
        sub: `${t.currency} ${t.amountLocal.toLocaleString()} · ${t.settlementRail}`,
        action: () => {
          setRole('company');
          setActiveSection('company_dashboard');
          setSearchFocused(false);
          setGlobalSearch('');
        },
      }));

    return [...matchedEmps, ...matchedTxns];
  }, [globalSearch, employees, transactions]);

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#14213D] flex items-center justify-center">
        <CrewPayMark />
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#FAF9F6] text-[#252A34]">
      {/* ====================================================================
          DESKTOP SIDEBAR
      ==================================================================== */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 268 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex h-screen sticky top-0 flex-col justify-between bg-[#14213D] text-white shrink-0 border-r border-[#14213D] select-none z-30 overflow-hidden"
      >
        <div className="p-4 space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-3 min-w-0">
              {!sidebarCollapsed && (
                <CrewPayMark />
              )}
              {sidebarCollapsed && (
                <CrewPayMark compact />
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar width"
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Organisation Switcher (shown in Company & Admin views) */}
          {!sidebarCollapsed && role !== 'employee' && (
            <div ref={orgRef} className="relative">
              <button
                type="button"
                onClick={() => setOrgMenuOpen((prev) => !prev)}
                className="w-full p-2.5 rounded-xl bg-white/7 hover:bg-white/12 border border-white/10 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-medium text-[#C9F2DF] tracking-wide">
                    ACTIVE ENTITY
                  </div>
                  <div className="text-xs font-bold text-white truncate mt-0.5">
                    {currentOrg.name}
                  </div>
                  <div className="text-[11px] text-white/60 truncate">
                    {currentOrg.region}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-white/60 shrink-0" />
              </button>

              <AnimatePresence>
                {orgMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute left-0 right-0 mt-1.5 bg-white text-[#252A34] rounded-xl shadow-xl border border-[#14213D]/15 py-1.5 z-50"
                  >
                    {organisations.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrgId(org.id);
                          setOrgMenuOpen(false);
                          pushToast(
                            'Switched Active Organisation',
                            `Now viewing ${org.name} (${org.employeesCount} personnel).`,
                            'info'
                          );
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-[#FAF9F6] cursor-pointer ${org.id === selectedOrgId
                          ? 'bg-[#EEEAFE]/70 font-bold text-[#14213D]'
                          : ''
                          }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate">{org.name}</div>
                          <div className="text-[11px] text-[#252A34]/55 truncate">
                            {org.employeesCount} personnel · {org.baseCurrency}
                          </div>
                        </div>
                        {org.id === selectedOrgId && (
                          <Check className="w-3.5 h-3.5 text-[#4169E1] shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Role Experience Switcher */}
          {!sidebarCollapsed && (
            <div className="p-1 rounded-xl bg-white/8 border border-white/10 grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'company', label: 'Company' },
                  { id: 'employee', label: 'Employee' },
                  { id: 'admin', label: 'Admin' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSwitchRole(tab.id)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${role === tab.id
                    ? 'bg-[#4169E1] text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Primary Navigation Links */}
          <nav className="space-y-1">
            {!sidebarCollapsed && (
              <div className="px-2.5 pb-1 text-[11px] font-semibold text-white/45">
                {role === 'company'
                  ? 'Financial Operations'
                  : role === 'employee'
                    ? 'Employee Self-Service'
                    : 'Platform Governance'}
              </div>
            )}
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`relative w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${isActive
                    ? 'text-white font-semibold'
                    : 'text-white/70 hover:text-white hover:bg-white/6'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="crewpay-sidebar-active"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                      className="absolute inset-0 rounded-xl bg-[#4169E1]"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!sidebarCollapsed &&
                    typeof item.badgeCount === 'number' &&
                    item.badgeCount > 0 && (
                      <span
                        className={`relative z-10 px-2 py-0.5 text-[11px] font-mono-tabular font-bold rounded-md ${isActive
                          ? 'bg-white text-[#14213D]'
                          : 'bg-[#FFE0D1] text-[#14213D]'
                          }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EEEAFE] text-[#14213D] font-display font-bold text-xs flex items-center justify-center shrink-0">
              {role === 'employee' ? 'AO' : role === 'admin' ? 'SA' : 'RO'}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {role === 'employee'
                    ? 'Amara Okafor'
                    : role === 'admin'
                      ? 'System Compliance Lead'
                      : 'Amaka Nwosu'}
                </div>
                <div className="text-[11px] text-white/60 truncate">
                  {role === 'employee'
                    ? 'Principal Engineer · London'
                    : role === 'admin'
                      ? 'Global Risk & KYB Officer'
                      : 'VP Finance & Treasury'}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ====================================================================
          MOBILE SLIDE-OVER SIDEBAR
      ==================================================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-[#14213D]/60"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-72 bg-[#14213D] text-white h-full flex flex-col justify-between p-5 overflow-hidden"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <CrewPayMark />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-white/70 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Role switcher on mobile */}
                <div className="p-1 rounded-xl bg-white/10 grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'company', label: 'Company' },
                      { id: 'employee', label: 'Employee' },
                      { id: 'admin', label: 'Admin' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSwitchRole(tab.id)}
                      className={`py-1.5 text-xs font-semibold rounded-lg ${role === tab.id
                        ? 'bg-[#4169E1] text-white'
                        : 'text-white/70'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${activeSection === item.id
                        ? 'bg-[#4169E1] text-white font-semibold'
                        : 'text-white/75 hover:bg-white/8'
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MAIN CONTENT VIEWPORT
      ==================================================================== */}
      <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP NAVIGATION BAR */}
        <header className="sticky top-0 z-20 bg-white/95 border-b border-[#14213D]/10 px-4 sm:px-7 py-3.5 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Trigger + Breadcrumb & Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-[#14213D]/15 text-[#14213D]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-[#252A34]/55 flex items-center gap-1.5 truncate">
                <span>{pageMeta[activeSection]?.breadcrumb}</span>
                {role !== 'employee' && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#4169E1]">
                      {currentOrg.name}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#14213D] truncate">
                {pageMeta[activeSection]?.title}
              </h1>
            </div>
          </div>

          {/* Right: Search + Quick Run Payroll CTA + Notifications + Profile Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Global Search Box */}
            <div ref={searchRef} className="relative hidden md:block w-64">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#252A34]/45 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search crew, reference, currency..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#14213D]/15 rounded-lg text-[#252A34] placeholder:text-[#252A34]/45 focus:bg-white focus:border-[#4169E1] outline-none transition-colors min-h-[36px]"
                />
              </div>

              <AnimatePresence>
                {searchFocused && globalSearch.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute right-0 mt-1.5 w-80 bg-white border border-[#14213D]/12 rounded-xl shadow-xl py-2 z-50"
                  >
                    {searchResults.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-[#252A34]/60">
                        No matching personnel or transactions for "{globalSearch}"
                      </div>
                    ) : (
                      searchResults.map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={res.action}
                          className="w-full px-4 py-2 text-left hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                        >
                          <div className="text-xs font-bold text-[#14213D]">
                            {res.label}
                          </div>
                          <div className="text-[11px] text-[#252A34]/60">
                            {res.sub}
                          </div>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Run Payroll CTA when in Company role */}
            {role === 'company' && upcomingCycles[0] && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-3.5 h-3.5" />}
                onClick={() => setActivePayrollCycle(upcomingCycles[0])}
                className="hidden sm:inline-flex"
              >
                Run Payroll
              </Button>
            )}

            {/* Notifications Dropdown */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifMenuOpen((prev) => !prev)}
                aria-label="Open notifications"
                className="relative p-2 rounded-lg bg-[#FAF9F6] hover:bg-[#EEEAFE]/60 text-[#14213D] border border-[#14213D]/12 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className=" -top-1 -right-1 absolute px-1.5 py-0.2 rounded-full bg-[#4169E1] text-white text-[10px] font-mono-tabular font-bold">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#14213D]/12 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 bg-[#FAF9F6] border-b border-[#14213D]/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14213D]">
                        Operations Notifications
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, unread: false }))
                          )
                        }
                        className="text-[11px] font-semibold text-[#4169E1] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="divide-y divide-[#14213D]/8 max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setRole(n.targetRole);
                            setActiveSection(n.targetSection);
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === n.id
                                  ? { ...item, unread: false }
                                  : item
                              )
                            );
                            setNotifMenuOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-[#FAF9F6] transition-colors cursor-pointer ${n.unread ? 'bg-[#EEEAFE]/35' : ''
                            }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#14213D]">
                              {n.title}
                            </span>
                            <span className="text-[11px] text-[#252A34]/50 font-mono-tabular">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#252A34]/70 mt-0.5">
                            {n.detail}
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile & Role Switcher Menu */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#EEEAFE]/50 border border-[#14213D]/12 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-[#14213D] text-white text-[11px] font-bold flex items-center justify-center">
                  {role === 'employee' ? 'AO' : role === 'admin' ? 'SA' : 'RO'}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-[#14213D]">
                  {role === 'company'
                    ? 'Company View'
                    : role === 'employee'
                      ? 'Employee View'
                      : 'Admin View'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#252A34]/60" />
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.14 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-[#14213D]/12 rounded-xl shadow-xl py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-[#14213D]/8">
                      <div className="text-xs font-bold text-[#14213D]">
                        Switch Interface Perspective
                      </div>
                      <div className="text-[11px] text-[#252A34]/60">
                        Preview CrewPay across all user roles
                      </div>
                    </div>
                    {(
                      [
                        {
                          id: 'company',
                          title: 'Company Finance & Ops',
                          sub: 'Amaka Nwosu · VP Finance',
                        },
                        {
                          id: 'employee',
                          title: 'Employee Self-Service',
                          sub: 'Amara Okafor · Principal Engineer',
                        },
                        {
                          id: 'admin',
                          title: 'Platform Administrator',
                          sub: 'Global KYB & Treasury Governance',
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSwitchRole(opt.id)}
                        className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between hover:bg-[#FAF9F6] cursor-pointer ${role === opt.id
                          ? 'bg-[#EEEAFE]/65 font-bold text-[#14213D]'
                          : ''
                          }`}
                      >
                        <div>
                          <div>{opt.title}</div>
                          <div className="text-[11px] text-[#252A34]/55">
                            {opt.sub}
                          </div>
                        </div>
                        {role === opt.id && (
                          <Check className="w-4 h-4 text-[#4169E1]" />
                        )}
                      </button>
                    ))}
                    <div className="mt-1 pt-1 border-t border-[#14213D]/8">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#B94A48] hover:bg-[#FFE0D1]/45 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* MAIN PAGE CONTENT WITH SUBTLE PAGE TRANSITIONS */}
        <main className="flex-1 p-4 sm:p-7 max-w-[1440px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${role}-${activeSection}-${selectedOrgId}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              {role === 'company' && (
                <CompanyViews
                  activeSection={activeSection}
                  onNavigate={setActiveSection}
                  employees={employees}
                  transactions={transactions}
                  approvals={approvals}
                  spendingData={spendingData}
                  currencies={currencies}
                  upcomingCycles={upcomingCycles}
                  orgEmployeeCount={
                    currentOrg.id === 'org_global'
                      ? currentOrg.employeesCount +
                      (employees.length - INITIAL_EMPLOYEES.length)
                      : currentOrg.employeesCount
                  }
                  onOpenRunPayroll={(cycle) => setActivePayrollCycle(cycle)}
                  onApproveItem={handleApproveItem}
                  onRejectItem={handleRejectItem}
                  onAddEmployee={handleAddEmployee}
                  onRetryTransaction={handleRetryTransaction}
                  onConvertCurrency={handleConvertCurrency}
                />
              )}

              {role === 'employee' && (
                <EmployeeViews
                  activeSection={activeSection}
                  onNavigate={setActiveSection}
                  employee={employees[0]}
                  payslips={employeePayslips}
                  transactions={transactions}
                  onUpdateEmployeeAccount={handleUpdateEmployeeAccount}
                  onSubmitExpenseClaim={handleSubmitExpenseClaim}
                />
              )}

              {role === 'admin' && (
                <AdminViews
                  activeSection={activeSection}
                  organisations={organisations}
                  employees={employees}
                  transactions={transactions}
                  auditLogs={auditLogs}
                  onVerifyEmployeeBank={handleVerifyEmployeeBank}
                  onResolveAuditFlag={handleResolveAuditFlag}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* INTERACTIVE PAYROLL EXECUTION MODAL */}
      <RunPayrollModal
        isOpen={Boolean(activePayrollCycle)}
        onClose={() => setActivePayrollCycle(null)}
        cycle={activePayrollCycle}
        employees={employees}
        onCompletePayroll={handleCompletePayroll}
      />

      {/* TOAST NOTIFICATIONS */}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
