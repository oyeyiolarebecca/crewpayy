import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ShieldCheck,
  Building2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Search,
  Lock,
  Check,
  Download,
  Eye,
  RefreshCw,
  Wallet,
  Clock,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AdminAuditLog,
  Employee,
  NavSectionId,
  Organisation,
  Transaction,
} from '../../types/crewpay';
import {
  Button,
  Card,
  StatusBadge,
  InputField,
  AnimatedCounter,
  Modal,
  Dropdown,
} from '../ui/DesignSystem';

interface AdminViewsProps {
  activeSection: NavSectionId;
  organisations: Organisation[];
  employees: Employee[];
  auditLogs: AdminAuditLog[];
  transactions?: Transaction[];
  onVerifyEmployeeBank: (empId: string) => void;
  onResolveAuditFlag: (logId: string) => void;
}

export const AdminViews: React.FC<AdminViewsProps> = ({
  activeSection,
  organisations,
  employees,
  auditLogs,
  transactions = [],
  onVerifyEmployeeBank,
  onResolveAuditFlag,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [auditSearch, setAuditSearch] = useState('');

  // Salary transaction history state for Admin
  const [txnSearch, setTxnSearch] = useState('');
  const [txnStatusFilter, setTxnStatusFilter] = useState('all');
  const [txnCurrencyFilter, setTxnCurrencyFilter] = useState('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const unverifiedEmployees = employees.filter(
    (e) => e.accountStatus !== 'verified'
  );
  const flaggedLogs = auditLogs.filter((l) => l.status === 'flagged');

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.actor.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.entityName.toLowerCase().includes(auditSearch.toLowerCase())
  );

  // Filter salary & payroll transactions across all corporate entities
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.employeeName.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.reference.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.department.toLowerCase().includes(txnSearch.toLowerCase()) ||
        t.settlementRail.toLowerCase().includes(txnSearch.toLowerCase());
      const matchesStatus =
        txnStatusFilter === 'all' || t.status === txnStatusFilter;
      const matchesCurrency =
        txnCurrencyFilter === 'all' || t.currency === txnCurrencyFilter;
      return matchesSearch && matchesStatus && matchesCurrency;
    });
  }, [transactions, txnSearch, txnStatusFilter, txnCurrencyFilter]);

  const totalSalaryVolumeUsd = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (t.amountUsd || 0), 0);
  }, [transactions]);

  const handleExportAdminCsv = () => {
    const headers =
      'Reference,Beneficiary,Department,Category,LocalAmount,Currency,AmountUSD,FXRate,Rail,Status,Date';
    const rows = filteredTransactions.map(
      (t) =>
        `${t.reference},"${t.employeeName}","${t.department}",${t.type},${t.amountLocal},${t.currency},${t.amountUsd},${t.fxRate},"${t.settlementRail}",${t.status},"${t.date}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crewpay-platform-salary-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: prefersReducedMotion ? 0 : 0.05 },
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

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. ADMIN KPI SUMMARY */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <Card surface="midnight">
          <div className="text-xs font-semibold text-white/70">
            Active Regulated Entities
          </div>
          <div className="text-3xl font-bold text-white mt-2 font-mono-tabular">
            <AnimatedCounter value={organisations.length} />
          </div>
          <div className="text-xs text-[#C9F2DF] mt-1.5">
            100% KYB & AML Attested
          </div>
        </Card>

        <Card surface="lavender">
          <div className="text-xs font-semibold text-[#14213D]/75">
            Global Salary Volume Disbursed
          </div>
          <div className="text-3xl font-bold text-[#14213D] mt-2 font-mono-tabular">
            <AnimatedCounter
              value={totalSalaryVolumeUsd > 0 ? totalSalaryVolumeUsd : 2640800}
              prefix="$"
            />
          </div>
          <div className="text-xs text-[#14213D]/75 mt-1.5">
            Across 6 regulated currency rails
          </div>
        </Card>

        <Card surface="mint">
          <div className="text-xs font-semibold text-[#14213D]/75">
            Verified Beneficiary Accounts
          </div>
          <div className="text-3xl font-bold text-[#14213D] mt-2 font-mono-tabular">
            <AnimatedCounter
              value={employees.length - unverifiedEmployees.length}
            />
            <span className="text-base font-normal text-[#14213D]/65">
              {' '}
              / {employees.length}
            </span>
          </div>
          <div className="text-xs text-[#14213D]/75 mt-1.5">
            Instant IBAN & NUBAN name match
          </div>
        </Card>

        <Card surface="peach">
          <div className="text-xs font-semibold text-[#14213D]/75">
            Compliance Review Queue
          </div>
          <div className="text-3xl font-bold text-[#14213D] mt-2 font-mono-tabular">
            <AnimatedCounter
              value={unverifiedEmployees.length + flaggedLogs.length}
            />
          </div>
          <div className="text-xs text-[#14213D]/75 mt-1.5">
            Pending manual KYB/KYC sign-off
          </div>
        </Card>
      </motion.div>

      {/* 2. ORGANISATIONS & KYB ENTITIES */}
      {(activeSection === 'admin_overview' ||
        activeSection === 'admin_organisations') && (
        <motion.div variants={staggerItem}>
          <Card surface="white" padding="lg">
            <div className="flex items-center justify-between pb-4 border-b border-[#14213D]/10">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">
                  Multi-Entity Corporate Hierarchy & Tax Registrations
                </h3>
                <p className="text-xs text-[#252A34]/60 mt-0.5">
                  Regulated subsidiaries authorized to originate global payroll batches
                </p>
              </div>
              <span className="text-xs font-mono-tabular font-semibold text-[#0F6E46] bg-[#C9F2DF]/60 px-3 py-1 rounded-md">
                ISO 27001 & SOC 2 Type II Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {organisations.map((org) => (
                <div
                  key={org.id}
                  className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono-tabular font-semibold text-[#4169E1]">
                        {org.taxEntityId}
                      </span>
                      <StatusBadge status={org.kybStatus} />
                    </div>
                    <h4 className="text-base font-bold text-[#14213D] mt-1.5">
                      {org.name}
                    </h4>
                    <p className="text-xs text-[#252A34]/65 mt-0.5">
                      {org.region}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#14213D]/8 flex items-center justify-between text-xs font-mono-tabular">
                    <span>Base: {org.baseCurrency}</span>
                    <span className="font-bold text-[#14213D]">
                      {org.employeesCount} Active Personnel
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* 3. PLATFORM-WIDE SALARY & PAYROLL SETTLEMENT LEDGER (NEW: ADMIN SALARY TRACKING) */}
      {(activeSection === 'admin_overview' ||
        activeSection === 'admin_compliance') && (
        <motion.div variants={staggerItem}>
          <Card surface="white" padding="none" className="overflow-hidden">
            <div className="p-5 border-b border-[#14213D]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#FAF9F6]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#14213D]">
                    Platform-Wide Salary & Payroll Settlement Ledger
                  </h3>
                  <span className="text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded-full bg-[#EEEAFE] text-[#4169E1]">
                    {filteredTransactions.length} Payouts
                  </span>
                </div>
                <p className="text-xs text-[#252A34]/65 mt-0.5">
                  Audit real-time salary disbursements, contractor fees, and banking rail execution across all subsidiaries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-full sm:w-60">
                  <InputField
                    placeholder="Search payee or reference..."
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
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleExportAdminCsv}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="px-5 py-2.5 bg-white border-b border-[#14213D]/8 flex items-center justify-between gap-4 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'All Settlements' },
                  { id: 'completed', label: 'Settled' },
                  { id: 'processing', label: 'In Clearing' },
                  { id: 'pending_approval', label: 'Awaiting Sign-off' },
                  { id: 'failed', label: 'Exceptions' },
                ].map((tab) => (
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
              <div className="text-xs text-[#252A34]/60 font-mono-tabular shrink-0">
                100% Pre-Funded Settlement Rails
              </div>
            </div>

            {/* Salary Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#14213D]/10 text-[11px] font-semibold text-[#252A34]/60 bg-[#FAF9F6]/50">
                    <th className="py-3 px-5">Transaction Ref & Value Date</th>
                    <th className="py-3 px-4">Payee & Department</th>
                    <th className="py-3 px-4">Type & Settlement Rail</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Disbursed Local</th>
                    <th className="py-3 px-4 text-right">USD Equivalent</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14213D]/8 text-sm">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#252A34]/60">
                        No salary or payroll transactions match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => (
                      <tr
                        key={txn.id}
                        onClick={() => setSelectedTxn(txn)}
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
                          <div className="text-[11px] text-[#252A34]/60">
                            {txn.department}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-[#14213D]">
                            {txn.type}
                          </div>
                          <div className="text-[11px] text-[#4169E1] font-mono-tabular">
                            {txn.settlementRail}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={txn.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#14213D]">
                          {txn.amountLocal.toLocaleString()} {txn.currency}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-tabular text-xs text-[#252A34]/75">
                          ${txn.amountUsd.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxn(txn);
                            }}
                            className="p-1.5 rounded-lg text-[#252A34]/60 hover:text-[#14213D] hover:bg-[#EEEAFE] transition-colors"
                            title="Audit Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* 4. BENEFICIARY ACCOUNT KYC VERIFICATION QUEUE */}
      <motion.div variants={staggerItem}>
        <Card surface="white" padding="lg">
          <div className="flex items-center justify-between pb-4 border-b border-[#14213D]/10">
            <div>
              <h3 className="text-base font-bold text-[#14213D]">
                Beneficiary Bank Account Verification Queue
              </h3>
              <p className="text-xs text-[#252A34]/60 mt-0.5">
                Approve pending employee and contractor payout corridors after automated micro-deposit confirmation
              </p>
            </div>
          </div>

          {unverifiedEmployees.length === 0 ? (
            <div className="py-6 text-center text-sm font-semibold text-[#0F6E46]">
              All employee beneficiary bank accounts are verified and active for instant settlement.
            </div>
          ) : (
            <div className="divide-y divide-[#14213D]/8 mt-2">
              {unverifiedEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#14213D]">
                        {emp.name}
                      </span>
                      <span className="text-xs text-[#252A34]/60">
                        · {emp.role} ({emp.location})
                      </span>
                    </div>
                    <div className="text-xs text-[#252A34]/70 font-mono-tabular mt-1">
                      {emp.bankName} (*{emp.accountEnding}) · {emp.routingLabel}{' '}
                      · Currency: {emp.receivingCurrency}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={emp.accountStatus} />
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => onVerifyEmployeeBank(emp.id)}
                    >
                      Verify Corridor
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* 5. SYSTEM COMPLIANCE & GOVERNANCE AUDIT LOGS */}
      {(activeSection === 'admin_overview' ||
        activeSection === 'admin_compliance') && (
        <motion.div variants={staggerItem}>
          <Card surface="white" padding="none" className="overflow-hidden">
            <div className="p-5 border-b border-[#14213D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6]">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">
                  Immutable Governance & Compliance Audit Trail
                </h3>
                <p className="text-xs text-[#252A34]/60 mt-0.5">
                  Cryptographically signed log of treasury conversions, FX rate locks, and sanctions screenings
                </p>
              </div>
              <div className="w-full sm:w-64">
                <InputField
                  placeholder="Filter audit events..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#14213D]/10 text-[11px] font-semibold text-[#252A34]/60 bg-[#FAF9F6]/60">
                    <th className="py-3 px-5">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Actor & Role</th>
                    <th className="py-3 px-4">Governance Event</th>
                    <th className="py-3 px-4">Entity & Corridor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14213D]/8 text-sm">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FAF9F6]">
                      <td className="py-3.5 px-5 font-mono-tabular text-xs text-[#252A34]/75">
                        {log.timestamp}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#14213D] text-xs">
                          {log.actor}
                        </div>
                        <div className="text-[11px] text-[#252A34]/55">
                          {log.actorRole}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#14213D] text-xs">
                        {log.action}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#252A34]/70">
                        <div>{log.entityName}</div>
                        <div className="text-[11px] font-mono-tabular text-[#252A34]/55">
                          {log.corridor}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {log.status === 'flagged' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onResolveAuditFlag(log.id)}
                          >
                            Clear Hold
                          </Button>
                        ) : (
                          <span className="text-xs font-mono-tabular text-[#252A34]/50">
                            Attested
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ADMIN TRANSACTION AUDIT DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedTxn)}
        onClose={() => setSelectedTxn(null)}
        title="Salary Transaction & Banking Rail Audit"
        subtitle="Regulated settlement telemetry, FX verification, and clearing house timestamps."
        footer={
          <Button variant="primary" onClick={() => setSelectedTxn(null)}>
            Close Audit Details
          </Button>
        }
      >
        {selectedTxn && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#252A34]/60 font-mono-tabular">
                  Reference: {selectedTxn.reference}
                </div>
                <div className="text-2xl font-bold font-mono-tabular text-[#14213D] mt-1">
                  {selectedTxn.amountLocal.toLocaleString()} {selectedTxn.currency}
                </div>
                <div className="text-xs text-[#252A34]/65 mt-0.5 font-mono-tabular">
                  USD Value: ${selectedTxn.amountUsd.toLocaleString()} · FX Locked at{' '}
                  {selectedTxn.fxRate}
                </div>
              </div>
              <StatusBadge status={selectedTxn.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-[#14213D]/10">
                <div className="text-[#252A34]/55">Beneficiary & Department</div>
                <div className="font-bold text-[#14213D] text-sm mt-0.5">
                  {selectedTxn.employeeName}
                </div>
                <div className="text-[#252A34]/65">{selectedTxn.department}</div>
              </div>
              <div className="p-3.5 rounded-lg border border-[#14213D]/10">
                <div className="text-[#252A34]/55">Settlement Rail & Type</div>
                <div className="font-bold text-[#14213D] text-sm mt-0.5">
                  {selectedTxn.settlementRail}
                </div>
                <div className="text-[#252A34]/65">{selectedTxn.type}</div>
              </div>
              <div className="p-3.5 rounded-lg border border-[#14213D]/10">
                <div className="text-[#252A34]/55">Execution Timestamp</div>
                <div className="font-bold text-[#14213D] text-sm mt-0.5 font-mono-tabular">
                  {selectedTxn.date}
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-[#14213D]/10">
                <div className="text-[#252A34]/55">Regulatory Compliance</div>
                <div className="font-bold text-[#0F6E46] text-sm mt-0.5 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sanctions Cleared</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
