import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Search,
  Download,
  Plus,
  Play,
  ArrowRightLeft,
  Calendar,
  Building2,
  Check,
  X,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Employee,
  Transaction,
  ApprovalItem,
  MonthlySpending,
  CurrencyAllocation,
  UpcomingPayrollCycle,
  NavSectionId,
} from '../../types/crewpay';
import {
  Button,
  Card,
  StatusBadge,
  InputField,
  Dropdown,
  Modal,
  EmptyState,
  LoadingState,
  ErrorState,
  AnimatedCounter,
} from '../ui/DesignSystem';

interface CompanyViewsProps {
  activeSection: NavSectionId;
  onNavigate: (section: NavSectionId) => void;
  employees: Employee[];
  transactions: Transaction[];
  approvals: ApprovalItem[];
  spendingData: MonthlySpending[];
  currencies: CurrencyAllocation[];
  upcomingCycles: UpcomingPayrollCycle[];
  orgEmployeeCount: number;
  onOpenRunPayroll: (cycle: UpcomingPayrollCycle) => void;
  onApproveItem: (id: string) => void;
  onRejectItem: (id: string) => void;
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onRetryTransaction: (id: string) => void;
  onConvertCurrency: (
    fromCode: string,
    toCode: string,
    usdAmount: number
  ) => void;
}

export const CompanyViews: React.FC<CompanyViewsProps> = ({
  activeSection,
  onNavigate,
  employees,
  transactions,
  approvals,
  spendingData,
  currencies,
  upcomingCycles,
  orgEmployeeCount,
  onOpenRunPayroll,
  onApproveItem,
  onRejectItem,
  onAddEmployee,
  onRetryTransaction,
  onConvertCurrency,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Chart states
  const [chartRange, setChartRange] = useState<'6m' | '12m'>('12m');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  // Table states
  const [txnSearch, setTxnSearch] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState<string>('all');
  const [txnCurrencyFilter, setTxnCurrencyFilter] = useState<string>('all');
  const [isSimulatingLoad, setIsSimulatingLoad] = useState(false);
  const [isSimulatingError, setIsSimulatingError] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // Employee directory states
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('all');
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpDept, setNewEmpDept] =
    useState<Employee['department']>('Engineering');
  const [newEmpLocation, setNewEmpLocation] = useState('London, United Kingdom');
  const [newEmpSalary, setNewEmpSalary] = useState('140000');
  const [newEmpCurrency, setNewEmpCurrency] = useState('GBP');
  const [newEmpBank, setNewEmpBank] = useState('HSBC UK Bank PLC');

  // FX Treasury Convert Modal
  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [fxFrom, setFxFrom] = useState('USD');
  const [fxTo, setFxTo] = useState('EUR');
  const [fxAmountUsd, setFxAmountUsd] = useState('50000');

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === 'pending'),
    [approvals]
  );

  const completedTxnCount = useMemo(
    () =>
      transactions.filter((t) => t.status === 'completed').length + 138, // Historical completed this month
    [transactions]
  );

  const currentMonthPayrollUsd =
    spendingData[spendingData.length - 1]?.totalUsd || 1770400;

  const visibleSpending = useMemo(() => {
    return chartRange === '6m' ? spendingData.slice(-6) : spendingData;
  }, [spendingData, chartRange]);

  const maxSpendingUsd = useMemo(
    () => Math.max(...visibleSpending.map((d) => d.totalUsd), 1900000),
    [visibleSpending]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesQuery =
        t.employeeName.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.reference.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.department.toLowerCase().includes(txnSearch.toLowerCase());
      const matchesStatus =
        txnStatusFilter === 'all' || t.status === txnStatusFilter;
      const matchesCurr =
        txnCurrencyFilter === 'all' || t.currency === txnCurrencyFilter;
      return matchesQuery && matchesStatus && matchesCurr;
    });
  }, [transactions, txnSearch, txnStatusFilter, txnCurrencyFilter]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const matchesQ =
        e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.role.toLowerCase().includes(empSearch.toLowerCase()) ||
        e.location.toLowerCase().includes(empSearch.toLowerCase());
      const matchesDept =
        empDeptFilter === 'all' || e.department === empDeptFilter;
      return matchesQ && matchesDept;
    });
  }, [employees, empSearch, empDeptFilter]);

  const handleRefreshLedger = () => {
    setIsSimulatingError(false);
    setIsSimulatingLoad(true);
    setTimeout(() => {
      setIsSimulatingLoad(false);
    }, 600);
  };

  const handleExportCsv = () => {
    const headers = 'Reference,Employee,Department,Type,AmountLocal,Currency,AmountUSD,Status,Rail,Date';
    const rows = filteredTransactions.map(
      (t) =>
        `${t.reference},"${t.employeeName}",${t.department},${t.type},${t.amountLocal},${t.currency},${t.amountUsd},${t.status},"${t.settlementRail}","${t.date}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crewpay-transactions-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpRole.trim()) return;
    const initials = newEmpName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    onAddEmployee({
      name: newEmpName.trim(),
      email:
        newEmpEmail.trim() ||
        `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@meridian.io`,
      role: newEmpRole.trim(),
      department: newEmpDept,
      employmentType: 'Full-Time',
      location: newEmpLocation,
      countryCode: newEmpCurrency.slice(0, 2),
      baseSalaryUsd: Number(newEmpSalary) || 120000,
      receivingCurrency: newEmpCurrency,
      primaryCurrencySplit: 100,
      bankName: newEmpBank,
      accountEnding: String(Math.floor(1000 + Math.random() * 9000)),
      routingLabel: 'Verified Instant Corridor',
      accountStatus: 'verified',
      paymentFrequency: 'Monthly',
      startDate: '06 Nov 2026',
      nextPayDate: '28 Nov 2026',
      avatarInitials: initials || 'CP',
      avatarTone: 'electric',
    });

    setNewEmpName('');
    setNewEmpEmail('');
    setNewEmpRole('');
    setIsAddEmpOpen(false);
  };

  const handleExecuteFxConversion = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(fxAmountUsd);
    if (!num || num <= 0 || fxFrom === fxTo) return;
    onConvertCurrency(fxFrom, fxTo, num);
    setIsFxModalOpen(false);
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
      },
    },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  // ==========================================================================
  // SUB-VIEW: EMPLOYEES DIRECTORY
  // ==========================================================================
  if (activeSection === 'company_employees') {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-bold text-[#14213D]">
              Global Workforce & Compensation Directory
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Manage international contracts, local receiving currencies, and verified beneficiary accounts.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddEmpOpen(true)}
          >
            Onboard Team Member
          </Button>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card surface="white" padding="none" className="overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#14213D]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAF9F6]">
              <div className="w-full sm:w-80">
                <InputField
                  placeholder="Search by name, role, or country..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {(
                  [
                    'all',
                    'Engineering',
                    'Product',
                    'Finance & Ops',
                    'Design',
                    'Growth',
                  ] as const
                ).map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setEmpDeptFilter(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      empDeptFilter === dept
                        ? 'bg-[#14213D] text-white'
                        : 'bg-white text-[#252A34]/75 hover:text-[#14213D] border border-[#14213D]/10'
                    }`}
                  >
                    {dept === 'all' ? 'All Departments' : dept}
                  </button>
                ))}
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <EmptyState
                title="No matching team members"
                description="Try clearing your department filter or onboarding a new international employee."
                actionLabel="Reset Filters"
                onAction={() => {
                  setEmpSearch('');
                  setEmpDeptFilter('all');
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#14213D]/10 text-[11px] font-semibold text-[#252A34]/60 bg-[#FAF9F6]/60">
                      <th className="py-3 px-5">Employee</th>
                      <th className="py-3 px-4">Department & Location</th>
                      <th className="py-3 px-4">Receiving Bank & Rail</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4 text-right">Annual Base (USD)</th>
                      <th className="py-3 px-5 text-right">Payout Currency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14213D]/8 text-sm">
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-[#FAF9F6] transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#EEEAFE] text-[#14213D] font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.avatarInitials}
                            </div>
                            <div>
                              <div className="font-semibold text-[#14213D]">
                                {emp.name}
                              </div>
                              <div className="text-xs text-[#252A34]/60">
                                {emp.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-[#14213D]">
                            {emp.department} · {emp.employmentType}
                          </div>
                          <div className="text-xs text-[#252A34]/60 mt-0.5">
                            {emp.location}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-medium text-[#14213D]">
                            {emp.bankName} (*{emp.accountEnding})
                          </div>
                          <div className="text-xs text-[#252A34]/55 font-mono-tabular mt-0.5">
                            {emp.routingLabel}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={emp.accountStatus} />
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#14213D]">
                          ${emp.baseSalaryUsd.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="font-mono-tabular text-xs font-semibold text-[#14213D]">
                            {emp.primaryCurrencySplit}% {emp.receivingCurrency}
                            {emp.secondaryCurrency
                              ? ` · ${100 - emp.primaryCurrencySplit}% ${emp.secondaryCurrency}`
                              : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Add Employee Modal */}
        <Modal
          isOpen={isAddEmpOpen}
          onClose={() => setIsAddEmpOpen(false)}
          title="Onboard International Team Member"
          subtitle="Configure employment contract, annual compensation, and local payout corridor."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddEmpOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateEmployee}>
                Complete Onboarding
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Full Legal Name"
                placeholder="e.g. Nadia Al-Mansoor"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                required
              />
              <InputField
                label="Work Email"
                type="email"
                placeholder="nadia@meridian.io"
                value={newEmpEmail}
                onChange={(e) => setNewEmpEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Job Title"
                placeholder="e.g. Senior Treasury Analyst"
                value={newEmpRole}
                onChange={(e) => setNewEmpRole(e.target.value)}
                required
              />
              <Dropdown
                label="Department"
                value={newEmpDept}
                onChange={(val) =>
                  setNewEmpDept(val as Employee['department'])
                }
                options={[
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'Product', label: 'Product' },
                  { value: 'Finance & Ops', label: 'Finance & Ops' },
                  { value: 'Design', label: 'Design' },
                  { value: 'Growth', label: 'Growth' },
                ]}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Country / City"
                value={newEmpLocation}
                onChange={(e) => setNewEmpLocation(e.target.value)}
              />
              <InputField
                label="Annual Base (USD)"
                type="number"
                value={newEmpSalary}
                onChange={(e) => setNewEmpSalary(e.target.value)}
              />
              <Dropdown
                label="Receiving Currency"
                value={newEmpCurrency}
                onChange={setNewEmpCurrency}
                options={[
                  { value: 'GBP', label: 'GBP (£) · UK Faster Payments' },
                  { value: 'EUR', label: 'EUR (€) · SEPA Instant' },
                  { value: 'USD', label: 'USD ($) · ACH Same-Day' },
                  { value: 'NGN', label: 'NGN (₦) · NIP Local Rail' },
                  { value: 'SGD', label: 'SGD (S$) · FAST Rail' },
                ]}
              />
            </div>
            <InputField
              label="Receiving Bank Institution"
              value={newEmpBank}
              onChange={(e) => setNewEmpBank(e.target.value)}
            />
          </form>
        </Modal>
      </motion.div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: PAYROLL RUNS & CYCLES
  // ==========================================================================
  if (activeSection === 'company_payroll') {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-bold text-[#14213D]">
              Global Payroll Cycles & Batch Execution
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Review cut-off schedules, verify tax withholdings, and dispatch multi-currency payroll batches.
            </p>
          </div>
          {upcomingCycles[0] && (
            <Button
              variant="primary"
              leftIcon={<Play className="w-4 h-4" />}
              onClick={() => onOpenRunPayroll(upcomingCycles[0])}
            >
              Execute Primary November Cycle
            </Button>
          )}
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          {upcomingCycles.map((cyc, idx) => (
            <Card
              key={cyc.id}
              surface={idx === 0 ? 'lavender' : 'white'}
              padding="lg"
              className="flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-[#14213D]/70">
                      {cyc.periodLabel} · Cutoff: {cyc.cutoffDate}
                    </div>
                    <h3 className="text-lg font-bold text-[#14213D] mt-0.5">
                      {cyc.cycleName}
                    </h3>
                  </div>
                  <StatusBadge status={cyc.status} />
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-white/80 border border-[#14213D]/8">
                    <div className="text-[11px] text-[#252A34]/60">
                      Estimated Total
                    </div>
                    <div className="text-base font-bold text-[#14213D] font-mono-tabular mt-0.5">
                      ${cyc.estimatedTotalUsd.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/80 border border-[#14213D]/8">
                    <div className="text-[11px] text-[#252A34]/60">
                      Headcount
                    </div>
                    <div className="text-base font-bold text-[#14213D] font-mono-tabular mt-0.5">
                      {cyc.employeesCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/80 border border-[#14213D]/8">
                    <div className="text-[11px] text-[#252A34]/60">
                      Value Date
                    </div>
                    <div className="text-sm font-bold text-[#14213D] font-mono-tabular mt-0.5">
                      {cyc.payDate}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#14213D]/10 flex items-center justify-between gap-4">
                <div className="text-xs text-[#14213D]/75 font-medium">
                  Pre-flight compliance & FX lock readiness:{' '}
                  <span className="font-mono-tabular font-bold">
                    {cyc.readinessPercent}%
                  </span>
                </div>
                <Button
                  variant={cyc.status === 'completed' ? 'outline' : 'midnight'}
                  size="sm"
                  onClick={() => onOpenRunPayroll(cyc)}
                >
                  {cyc.status === 'completed'
                    ? 'Run Off-Cycle Batch'
                    : 'Review & Authorize'}
                </Button>
              </div>
            </Card>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: APPROVALS & COMPLIANCE QUEUE
  // ==========================================================================
  if (activeSection === 'company_approvals') {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-bold text-[#14213D]">
              Pending Approvals & Dual-Control Authorizations
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Review off-cycle bonuses, compensation adjustments, expense claims, and beneficiary bank updates.
            </p>
          </div>
          <div className="text-xs font-mono-tabular font-semibold text-[#14213D] bg-[#FFE0D1] px-3.5 py-2 rounded-lg border border-[#14213D]/12">
            {pendingApprovals.length} Pending Authorizations
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-3">
          {approvals.map((item) => (
            <Card key={item.id} surface="white" padding="md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#252A34]/65">
                    <span className="font-semibold text-[#4169E1]">
                      {item.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.department}</span>
                    <span aria-hidden="true">·</span>
                    <span>Submitted {item.submittedAt}</span>
                    {item.urgency === 'high' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#9A4B1A]">
                          Priority Review
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#14213D]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#252A34]/70">
                    Requested by <strong className="text-[#14213D]">{item.requesterName}</strong> ({item.requesterRole}) — {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#14213D]/8 shrink-0">
                  <div className="text-left lg:text-right">
                    <div className="text-base font-bold text-[#14213D] font-mono-tabular">
                      {item.currency} {item.amountLocal.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#252A34]/55 font-mono-tabular">
                      ≈ ${item.amountUsd.toLocaleString()} USD
                    </div>
                  </div>

                  {item.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<X className="w-3.5 h-3.5" />}
                        onClick={() => onRejectItem(item.id)}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        onClick={() => onApproveItem(item.id)}
                      >
                        Approve & Release
                      </Button>
                    </div>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: MULTI-CURRENCY TREASURY
  // ==========================================================================
  if (activeSection === 'company_treasury') {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div
          variants={staggerItem}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h2 className="text-xl font-bold text-[#14213D]">
              Multi-Currency Treasury & FX Liquidity Pools
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Monitor segregated local currency wallets, lock interbank FX rates, and rebalance payroll corridors.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<ArrowRightLeft className="w-4 h-4" />}
            onClick={() => setIsFxModalOpen(true)}
          >
            Convert Currency Liquidity
          </Button>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {currencies.map((curr, i) => {
            const surfaceMap: Array<'midnight' | 'lavender' | 'mint' | 'peach' | 'white'> = [
              'midnight',
              'lavender',
              'white',
              'mint',
              'peach',
            ];
            const surface = surfaceMap[i % surfaceMap.length];
            const isDark = surface === 'midnight';
            return (
              <Card
                key={curr.code}
                surface={surface}
                interactive
                padding="md"
                onClick={() => {
                  setFxTo(curr.code === 'USD' ? 'EUR' : curr.code);
                  setIsFxModalOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-white/75' : 'text-[#14213D]/70'
                    }`}
                  >
                    {curr.name} ({curr.code})
                  </span>
                  <span
                    className={`text-xs font-mono-tabular font-bold ${
                      isDark ? 'text-[#C9F2DF]' : 'text-[#4169E1]'
                    }`}
                  >
                    {curr.percentage}% of Payroll
                  </span>
                </div>
                <div
                  className={`text-2xl font-bold font-mono-tabular mt-2 ${
                    isDark ? 'text-white' : 'text-[#14213D]'
                  }`}
                >
                  {curr.symbol}
                  {curr.walletBalanceLocal.toLocaleString()}
                </div>
                <div
                  className={`text-xs mt-1 font-mono-tabular ${
                    isDark ? 'text-white/65' : 'text-[#252A34]/65'
                  }`}
                >
                  Monthly Run Demand: ${curr.monthlyVolumeUsd.toLocaleString()} USD
                </div>
                <div
                  className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                    isDark
                      ? 'border-white/15 text-white/75'
                      : 'border-[#14213D]/10 text-[#14213D]/80'
                  }`}
                >
                  <span>{curr.corridor}</span>
                  <span className="font-mono-tabular">
                    1 USD = {curr.fxRateToUsd} {curr.code}
                  </span>
                </div>
              </Card>
            );
          })}
        </motion.div>

        {/* FX Modal */}
        <Modal
          isOpen={isFxModalOpen}
          onClose={() => setIsFxModalOpen(false)}
          title="Instant Interbank FX Treasury Conversion"
          subtitle="Rebalance liquidity across Meridian segregated currency accounts at 0.00% spread."
          footer={
            <>
              <Button variant="outline" onClick={() => setIsFxModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleExecuteFxConversion}>
                Execute Instant Conversion
              </Button>
            </>
          }
        >
          <form onSubmit={handleExecuteFxConversion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Dropdown
                label="Source Treasury Wallet"
                value={fxFrom}
                onChange={setFxFrom}
                options={currencies.map((c) => ({
                  value: c.code,
                  label: `${c.code} · ${c.name}`,
                }))}
              />
              <Dropdown
                label="Destination Treasury Wallet"
                value={fxTo}
                onChange={setFxTo}
                options={currencies.map((c) => ({
                  value: c.code,
                  label: `${c.code} · ${c.name}`,
                }))}
              />
            </div>
            <InputField
              label="Transfer Value (USD Equivalent)"
              type="number"
              value={fxAmountUsd}
              onChange={(e) => setFxAmountUsd(e.target.value)}
              helperText="Guaranteed mid-market settlement with immediate ledger availability."
            />
          </form>
        </Modal>
      </motion.div>
    );
  }

  // ==========================================================================
  // PRIMARY VIEW: COMPANY DASHBOARD OVERVIEW
  // ==========================================================================
  const activeChartPoint =
    hoveredMonthIdx !== null
      ? visibleSpending[hoveredMonthIdx]
      : visibleSpending[visibleSpending.length - 1];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. FOUR PRIMARY KPI CARDS */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* Total Employees */}
        <Card
          surface="white"
          interactive
          onClick={() => onNavigate('company_employees')}
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#252A34]/65">
              Total Employees
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#EEEAFE] text-[#4169E1] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#14213D]">
              <AnimatedCounter value={orgEmployeeCount} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#252A34]/65 mt-1.5">
              <span className="font-semibold text-[#0F6E46]">+6 onboarded</span>
              <span aria-hidden="true">·</span>
              <span>14 active countries</span>
            </div>
          </div>
        </Card>

        {/* Payroll Overview */}
        <Card
          surface="lavender"
          interactive
          onClick={() => onNavigate('company_payroll')}
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#14213D]/75">
              Monthly Payroll Overview
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/80 text-[#14213D] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#14213D]">
              <AnimatedCounter value={currentMonthPayrollUsd} prefix="$" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#14213D]/75 mt-1.5">
              <span className="font-mono-tabular font-semibold">+3.9% vs Oct</span>
              <span aria-hidden="true">·</span>
              <span>Next run 28 Nov</span>
            </div>
          </div>
        </Card>

        {/* Completed Transactions */}
        <Card
          surface="mint"
          interactive
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#14213D]/75">
              Completed Transactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/80 text-[#0F6E46] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#14213D]">
              <AnimatedCounter value={completedTxnCount} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#14213D]/75 mt-1.5">
              <span className="font-mono-tabular font-semibold">99.4% SLA</span>
              <span aria-hidden="true">·</span>
              <span>Instant rail finality</span>
            </div>
          </div>
        </Card>

        {/* Pending Approvals */}
        <Card
          surface="peach"
          interactive
          onClick={() => onNavigate('company_approvals')}
          className="flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#14213D]/75">
              Pending Approvals
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/80 text-[#9A4B1A] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#14213D]">
              <AnimatedCounter value={pendingApprovals.length} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#14213D]/75 mt-1.5">
              <span className="font-mono-tabular font-semibold">
                $
                {pendingApprovals
                  .reduce((acc, item) => acc + item.amountUsd, 0)
                  .toLocaleString()}{' '}
                value
              </span>
              <span aria-hidden="true">·</span>
              <span className="underline">Review queue</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 2. PAYROLL SPENDING CHART + CURRENCY DISTRIBUTION */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Payroll Spending Chart (7 cols) */}
        <Card
          surface="white"
          padding="lg"
          className="lg:col-span-7 flex flex-col justify-between"
        >
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#14213D]/8">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">
                  Payroll Spending & Statutory Outflow
                </h3>
                <p className="text-xs text-[#252A34]/60 mt-0.5">
                  Consolidated USD volume across base compensation, bonuses, and employer tax contributions
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-[#FAF9F6] border border-[#14213D]/10 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setChartRange('6m')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    chartRange === '6m'
                      ? 'bg-[#14213D] text-white'
                      : 'text-[#252A34]/70 hover:text-[#14213D]'
                  }`}
                >
                  6 Months
                </button>
                <button
                  type="button"
                  onClick={() => setChartRange('12m')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    chartRange === '12m'
                      ? 'bg-[#14213D] text-white'
                      : 'text-[#252A34]/70 hover:text-[#14213D]'
                  }`}
                >
                  12 Months
                </button>
              </div>
            </div>

            {/* Active Month Telemetry Readout */}
            {activeChartPoint && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-[#14213D]/8">
                <div>
                  <div className="text-[11px] text-[#252A34]/55">
                    {activeChartPoint.fullMonth} Total
                  </div>
                  <div className="text-base font-bold text-[#14213D] font-mono-tabular mt-0.5">
                    ${activeChartPoint.totalUsd.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#252A34]/55 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-[#14213D]" />
                    Base Salaries
                  </div>
                  <div className="text-sm font-semibold text-[#14213D] font-mono-tabular mt-0.5">
                    ${activeChartPoint.basePayroll.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#252A34]/55 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-[#4169E1]" />
                    Employer Taxes
                  </div>
                  <div className="text-sm font-semibold text-[#14213D] font-mono-tabular mt-0.5">
                    ${activeChartPoint.taxesAndContributions.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#252A34]/55 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-[#C9F2DF] border border-[#0F6E46]/30" />
                    Bonuses & Variable
                  </div>
                  <div className="text-sm font-semibold text-[#14213D] font-mono-tabular mt-0.5">
                    ${activeChartPoint.bonusesAndCommissions.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Animated Stacked Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="h-52 flex items-end justify-between gap-2 sm:gap-3">
                {visibleSpending.map((item, idx) => {
                  const totalHeightPct = Math.max(
                    20,
                    Math.round((item.totalUsd / maxSpendingUsd) * 100)
                  );
                  const baseShare = Math.round(
                    (item.basePayroll / item.totalUsd) * 100
                  );
                  const taxShare = Math.round(
                    (item.taxesAndContributions / item.totalUsd) * 100
                  );
                  const bonusShare = Math.max(0, 100 - baseShare - taxShare);
                  const isHovered =
                    hoveredMonthIdx === idx ||
                    (hoveredMonthIdx === null &&
                      idx === visibleSpending.length - 1);

                  return (
                    <div
                      key={item.month}
                      onMouseEnter={() => setHoveredMonthIdx(idx)}
                      onMouseLeave={() => setHoveredMonthIdx(null)}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      <div className="w-full h-full flex items-end justify-center">
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{
                            duration: prefersReducedMotion ? 0 : 0.45,
                            delay: prefersReducedMotion ? 0 : idx * 0.03,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{
                            height: `${totalHeightPct}%`,
                            transformOrigin: 'bottom',
                          }}
                          className={`w-full max-w-[38px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-opacity ${
                            isHovered ? 'opacity-100 ring-2 ring-[#4169E1]/35' : 'opacity-85'
                          }`}
                        >
                          <div
                            style={{ height: `${bonusShare}%` }}
                            className="w-full bg-[#C9F2DF]"
                          />
                          <div
                            style={{ height: `${taxShare}%` }}
                            className="w-full bg-[#4169E1]"
                          />
                          <div
                            style={{ height: `${baseShare}%` }}
                            className="w-full bg-[#14213D]"
                          />
                        </motion.div>
                      </div>
                      <span
                        className={`mt-2.5 text-[11px] font-mono-tabular ${
                          isHovered
                            ? 'font-bold text-[#14213D]'
                            : 'text-[#252A34]/60'
                        }`}
                      >
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#14213D]/8 flex items-center justify-between text-xs text-[#252A34]/65">
            <span>Hover any monthly bar to inspect exact ledger breakdown</span>
            <span className="font-mono-tabular font-semibold text-[#14213D]">
              YTD Disbursed: $18,242,400 USD
            </span>
          </div>
        </Card>

        {/* Currency Distribution (5 cols) */}
        <Card
          surface="white"
          padding="lg"
          className="lg:col-span-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#14213D]/8">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">
                  Currency Distribution
                </h3>
                <p className="text-xs text-[#252A34]/60 mt-0.5">
                  Settlement corridors & active treasury balances
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowRightLeft className="w-3.5 h-3.5" />}
                onClick={() => setIsFxModalOpen(true)}
              >
                FX Convert
              </Button>
            </div>

            {/* Proportional Multi-Currency Bar */}
            <div className="my-4">
              <div className="h-3 w-full rounded-lg overflow-hidden flex gap-0.5 bg-[#FAF9F6]">
                {currencies.map((c) => {
                  const colorMap: Record<CurrencyAllocation['tone'], string> = {
                    navy: 'bg-[#14213D]',
                    electric: 'bg-[#4169E1]',
                    lavender: 'bg-[#8F7AE5]',
                    mint: 'bg-[#259D68]',
                    peach: 'bg-[#E67E45]',
                  };
                  return (
                    <motion.div
                      key={c.code}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ width: `${c.percentage}%` }}
                      className={`h-full ${colorMap[c.tone]}`}
                      title={`${c.code}: ${c.percentage}%`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Currency Rows */}
            <div className="divide-y divide-[#14213D]/8">
              {currencies.map((curr) => {
                const dotColorMap: Record<CurrencyAllocation['tone'], string> = {
                  navy: 'bg-[#14213D]',
                  electric: 'bg-[#4169E1]',
                  lavender: 'bg-[#8F7AE5]',
                  mint: 'bg-[#259D68]',
                  peach: 'bg-[#E67E45]',
                };
                return (
                  <div
                    key={curr.code}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-xs shrink-0 ${dotColorMap[curr.tone]}`}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                          <span>{curr.code}</span>
                          <span className="font-normal text-[#252A34]/60">
                            · {curr.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#252A34]/55 truncate">
                          {curr.corridor} · Wallet: {curr.symbol}
                          {curr.walletBalanceLocal.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 font-mono-tabular">
                      <div className="font-bold text-[#14213D]">
                        ${curr.monthlyVolumeUsd.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#252A34]/60">
                        {curr.percentage}% share
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#14213D]/8 flex items-center justify-between text-xs">
            <span className="text-[#252A34]/65">
              Mid-market FX rate protection active
            </span>
            <button
              type="button"
              onClick={() => onNavigate('company_treasury')}
              className="font-semibold text-[#4169E1] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Manage Treasury
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </motion.div>

      {/* 3. UPCOMING PAYROLL + PENDING APPROVALS */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Upcoming Payroll (6 cols) */}
        <Card
          surface="midnight"
          padding="lg"
          className="lg:col-span-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[#C9F2DF] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>UPCOMING SCHEDULED PAYROLL CYCLE</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  {upcomingCycles[0]?.cycleName}
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Pay Period: {upcomingCycles[0]?.periodLabel} · Cutoff:{' '}
                  {upcomingCycles[0]?.cutoffDate}
                </p>
              </div>
              {upcomingCycles[0] && (
                <StatusBadge status={upcomingCycles[0].status} />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/8 border border-white/12">
                <div className="text-[11px] text-white/65">Disbursement</div>
                <div className="text-lg font-bold text-white font-mono-tabular mt-0.5">
                  ${upcomingCycles[0]?.estimatedTotalUsd.toLocaleString()}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/8 border border-white/12">
                <div className="text-[11px] text-white/65">Active Crew</div>
                <div className="text-lg font-bold text-white font-mono-tabular mt-0.5">
                  {upcomingCycles[0]?.employeesCount}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/8 border border-white/12">
                <div className="text-[11px] text-white/65">Value Date</div>
                <div className="text-base font-bold text-[#C9F2DF] font-mono-tabular mt-0.5">
                  {upcomingCycles[0]?.payDate}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-white/12 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-white/75">
              Treasury wallets funded across all 6 payout currencies
            </div>
            {upcomingCycles[0] && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={() => onOpenRunPayroll(upcomingCycles[0])}
              >
                Execute Payroll Batch
              </Button>
            )}
          </div>
        </Card>

        {/* Actionable Approvals Queue (6 cols) */}
        <Card
          surface="white"
          padding="lg"
          className="lg:col-span-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#14213D]/8">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">
                  Pending Approvals Queue
                </h3>
                <p className="text-xs text-[#252A34]/60 mt-0.5">
                  Requires dual-control sign-off before ledger release
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('company_approvals')}
                className="text-xs font-semibold text-[#4169E1] hover:underline cursor-pointer"
              >
                View All ({approvals.length})
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-sm font-bold text-[#0F6E46]">
                  All pending items authorized!
                </div>
                <p className="text-xs text-[#252A34]/60 mt-1">
                  Zero awaiting items in the dual-control queue.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#14213D]/8">
                {pendingApprovals.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#252A34]/60">
                        <span className="font-semibold text-[#14213D]">
                          {item.requesterName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{item.category}</span>
                      </div>
                      <div className="text-sm font-bold text-[#14213D] truncate mt-0.5">
                        {item.title}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono-tabular">
                        <div className="text-xs font-bold text-[#14213D]">
                          {item.currency} {item.amountLocal.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[#252A34]/55">
                          ${item.amountUsd.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onApproveItem(item.id)}
                          title="Approve request"
                          className="px-2.5 py-1.5 rounded-lg bg-[#C9F2DF] text-[#0F5132] hover:bg-[#B2E9D0] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectItem(item.id)}
                          title="Decline request"
                          className="p-1.5 rounded-lg bg-[#FAF9F6] text-[#252A34]/65 hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 border border-[#14213D]/10 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#14213D]/8 flex items-center justify-between text-xs text-[#252A34]/60">
            <span>Approved items automatically generate ledger transactions</span>
            <span className="font-mono-tabular font-semibold text-[#14213D]">
              SLA: &lt; 4 hrs
            </span>
          </div>
        </Card>
      </motion.div>

      {/* 4. RECENT TRANSACTIONS FINANCIAL LEDGER TABLE */}
      <motion.div variants={staggerItem}>
        <Card surface="white" padding="none" className="overflow-hidden">
          <div className="p-5 border-b border-[#14213D]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FAF9F6]">
            <div>
              <h3 className="text-base font-bold text-[#14213D]">
                Recent Financial Transactions & Clearing Ledger
              </h3>
              <p className="text-xs text-[#252A34]/65 mt-0.5">
                Real-time settlement tracking across SEPA Instant, Faster Payments, ACH Same-Day, and NIP local corridors
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-full sm:w-64">
                <InputField
                  placeholder="Search recipient or reference..."
                  value={txnSearch}
                  onChange={(e) => setTxnSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <Dropdown
                value={txnCurrencyFilter}
                onChange={setTxnCurrencyFilter}
                options={[
                  { value: 'all', label: 'All Currencies' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'NGN', label: 'NGN (₦)' },
                  { value: 'SGD', label: 'SGD (S$)' },
                  { value: 'CAD', label: 'CAD (C$)' },
                ]}
              />

              <Button
                variant="outline"
                size="md"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={handleRefreshLedger}
              >
                Sync
              </Button>

              <Button
                variant="outline"
                size="md"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={handleExportCsv}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Interactive Status Filter Bar */}
          <div className="px-5 py-2.5 bg-white border-b border-[#14213D]/8 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'all', label: 'All Settlements' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'processing', label: 'In Clearing' },
                  { id: 'pending_approval', label: 'Awaiting Approval' },
                  { id: 'failed', label: 'Returned' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTxnStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    txnStatusFilter === tab.id
                      ? 'bg-[#EEEAFE] text-[#14213D] font-semibold'
                      : 'text-[#252A34]/65 hover:text-[#14213D] hover:bg-[#FAF9F6]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-[#252A34]/55 shrink-0">
              <button
                type="button"
                onClick={() => setIsSimulatingError((prev) => !prev)}
                className="hover:text-[#14213D] underline cursor-pointer"
              >
                {isSimulatingError ? 'Restore Feed' : 'Test Feed Alert'}
              </button>
            </div>
          </div>

          {/* Table Content with Complete Loading / Error / Empty / Populated States */}
          {isSimulatingLoad ? (
            <LoadingState rows={5} label="Reconciling multi-rail settlement ledger..." />
          ) : isSimulatingError ? (
            <div className="p-6">
              <ErrorState
                message="Clearing house telemetry feed timed out while verifying SWIFT gpi correspondent acknowledgements."
                onRetry={handleRefreshLedger}
              />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title="No matching ledger transactions"
              description="No settlement records match your current search or filter criteria."
              actionLabel="Clear All Filters"
              onAction={() => {
                setTxnSearch('');
                setTxnStatusFilter('all');
                setTxnCurrencyFilter('all');
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#14213D]/10 text-[11px] font-semibold text-[#252A34]/60 bg-[#FAF9F6]/50">
                    <th className="py-3 px-5">Reference & Date</th>
                    <th className="py-3 px-4">Recipient & Department</th>
                    <th className="py-3 px-4">Category & Clearing Rail</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Local Payout</th>
                    <th className="py-3 px-4 text-right">USD Equivalent</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14213D]/8 text-sm">
                  {filteredTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      onClick={() => setSelectedTransaction(txn)}
                      className="hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-mono-tabular font-semibold text-xs text-[#14213D]">
                          {txn.reference}
                        </div>
                        <div className="text-[11px] text-[#252A34]/55 font-mono-tabular mt-0.5">
                          {txn.date}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#14213D]">
                          {txn.employeeName}
                        </div>
                        <div className="text-xs text-[#252A34]/60">
                          {txn.department}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-[#14213D]">
                          {txn.type}
                        </div>
                        <div className="text-[11px] text-[#252A34]/55 mt-0.5">
                          {txn.settlementRail} · FX {txn.fxRate}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={txn.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#14213D]">
                        {txn.currency} {txn.amountLocal.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-[#252A34]/75">
                        ${txn.amountUsd.toLocaleString()}
                      </td>
                      <td
                        className="py-3.5 px-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {txn.status === 'failed' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onRetryTransaction(txn.id)}
                          >
                            Retry Rail
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedTransaction(txn)}
                          >
                            Receipt
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Transaction Receipt Modal */}
      <Modal
        isOpen={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        title={`Settlement Receipt · ${selectedTransaction?.reference}`}
        subtitle={`Cleared via ${selectedTransaction?.settlementRail} · ${selectedTransaction?.date}`}
        footer={
          <>
            {selectedTransaction?.status === 'failed' && (
              <Button
                variant="primary"
                onClick={() => {
                  if (selectedTransaction) {
                    onRetryTransaction(selectedTransaction.id);
                    setSelectedTransaction(null);
                  }
                }}
              >
                Re-Queue via Instant Clearing Rail
              </Button>
            )}
            <Button
              variant="midnight"
              onClick={() => setSelectedTransaction(null)}
            >
              Close Receipt
            </Button>
          </>
        }
      >
        {selectedTransaction && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#252A34]/60">
                  Disbursed Amount ({selectedTransaction.currency})
                </div>
                <div className="text-2xl font-bold text-[#14213D] font-mono-tabular mt-0.5">
                  {selectedTransaction.currency}{' '}
                  {selectedTransaction.amountLocal.toLocaleString()}
                </div>
                <div className="text-xs text-[#252A34]/60 font-mono-tabular mt-0.5">
                  USD Debit: ${selectedTransaction.amountUsd.toLocaleString()} @{' '}
                  {selectedTransaction.fxRate}
                </div>
              </div>
              <StatusBadge status={selectedTransaction.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-[#14213D]/10">
                <div className="text-[#252A34]/55">Beneficiary</div>
                <div className="font-bold text-[#14213D] text-sm mt-0.5">
                  {selectedTransaction.employeeName}
                </div>
                <div className="text-[#252A34]/65">
                  {selectedTransaction.department}
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-[#14213D]/10">
                <div className="text-[#252A34]/55">Payment Rail & Category</div>
                <div className="font-bold text-[#14213D] text-sm mt-0.5">
                  {selectedTransaction.settlementRail}
                </div>
                <div className="text-[#252A34]/65">
                  {selectedTransaction.type}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* FX Modal when opened from Dashboard */}
      <Modal
        isOpen={isFxModalOpen}
        onClose={() => setIsFxModalOpen(false)}
        title="Instant Interbank FX Treasury Conversion"
        subtitle="Rebalance liquidity across Meridian segregated currency accounts at 0.00% spread."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsFxModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExecuteFxConversion}>
              Execute Instant Conversion
            </Button>
          </>
        }
      >
        <form onSubmit={handleExecuteFxConversion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dropdown
              label="Source Treasury Wallet"
              value={fxFrom}
              onChange={setFxFrom}
              options={currencies.map((c) => ({
                value: c.code,
                label: `${c.code} · ${c.name}`,
              }))}
            />
            <Dropdown
              label="Destination Treasury Wallet"
              value={fxTo}
              onChange={setFxTo}
              options={currencies.map((c) => ({
                value: c.code,
                label: `${c.code} · ${c.name}`,
              }))}
            />
          </div>
          <InputField
            label="Transfer Value (USD Equivalent)"
            type="number"
            value={fxAmountUsd}
            onChange={(e) => setFxAmountUsd(e.target.value)}
            helperText="Guaranteed mid-market settlement with immediate ledger availability."
          />
        </form>
      </Modal>
    </motion.div>
  );
};
