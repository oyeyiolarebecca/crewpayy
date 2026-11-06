import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Landmark,
  ArrowRightLeft,
  Download,
  FileText,
  ShieldCheck,
  Calendar,
  Plus,
  Search,
  Sliders,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import {
  Employee,
  EmployeePayslip,
  NavSectionId,
  Transaction,
} from '../../types/crewpay';
import {
  Button,
  Card,
  StatusBadge,
  InputField,
  Dropdown,
  Modal,
  EmptyState,
  AnimatedCounter,
} from '../ui/DesignSystem';

interface EmployeeViewsProps {
  activeSection: NavSectionId;
  onNavigate: (section: NavSectionId) => void;
  employee: Employee;
  payslips: EmployeePayslip[];
  transactions: Transaction[];
  onUpdateEmployeeAccount: (updates: Partial<Employee>) => void;
  onSubmitExpenseClaim: (
    title: string,
    amountLocal: number,
    currency: string,
    description: string
  ) => void;
}

const FX_RATES: Record<string, { rate: number; symbol: string; name: string }> =
  {
    GBP: { rate: 0.78, symbol: '£', name: 'British Pound' },
    EUR: { rate: 0.92, symbol: '€', name: 'Euro' },
    USD: { rate: 1.0, symbol: '$', name: 'US Dollar' },
    NGN: { rate: 1600.0, symbol: '₦', name: 'Nigerian Naira' },
    SGD: { rate: 1.35, symbol: 'S$', name: 'Singapore Dollar' },
    CAD: { rate: 1.38, symbol: 'C$', name: 'Canadian Dollar' },
  };

export const EmployeeViews: React.FC<EmployeeViewsProps> = ({
  activeSection,
  onNavigate,
  employee,
  payslips,
  transactions,
  onUpdateEmployeeAccount,
  onSubmitExpenseClaim,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Currency & Bank Config Modal
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [primaryCurr, setPrimaryCurr] = useState(employee.receivingCurrency);
  const [secondaryCurr, setSecondaryCurr] = useState(
    employee.secondaryCurrency || 'NGN'
  );
  const [splitPercent, setSplitPercent] = useState(
    employee.primaryCurrencySplit
  );

  // Bank Account Edit Modal
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankNameInput, setBankNameInput] = useState(employee.bankName);
  const [accountEndingInput, setAccountEndingInput] = useState(
    employee.accountEnding
  );
  const [routingInput, setRoutingInput] = useState(employee.routingLabel);

  // Payslip Inspection Modal
  const [selectedSlip, setSelectedSlip] = useState<EmployeePayslip | null>(
    null
  );

  // Expense Submission Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('420');
  const [expCurr, setExpCurr] = useState('GBP');
  const [expNotes, setExpNotes] = useState('');

  // History filter
  const [historySearch, setHistorySearch] = useState('');

  const monthlyGrossUsd = Math.round(employee.baseSalaryUsd / 12);
  const monthlyTaxUsd = Math.round(monthlyGrossUsd * 0.21);
  const monthlyPensionUsd = Math.round(monthlyGrossUsd * 0.04);
  const monthlyNetUsd = monthlyGrossUsd - monthlyTaxUsd - monthlyPensionUsd;

  const primaryFx = FX_RATES[employee.receivingCurrency] || FX_RATES.GBP;
  const secondaryFx =
    FX_RATES[employee.secondaryCurrency || 'NGN'] || FX_RATES.NGN;

  const primaryNetLocal = Math.round(
    monthlyNetUsd *
      (employee.primaryCurrencySplit / 100) *
      primaryFx.rate
  );
  const secondaryNetLocal = Math.round(
    monthlyNetUsd *
      ((100 - employee.primaryCurrencySplit) / 100) *
      secondaryFx.rate
  );

  const handleSaveCurrencySplit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmployeeAccount({
      receivingCurrency: primaryCurr,
      secondaryCurrency: splitPercent < 100 ? secondaryCurr : undefined,
      primaryCurrencySplit: splitPercent,
    });
    setIsSplitModalOpen(false);
  };

  const handleSaveBankDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateEmployeeAccount({
      bankName: bankNameInput,
      accountEnding: accountEndingInput.slice(-4),
      routingLabel: routingInput,
      accountStatus: 'verified',
    });
    setIsBankModalOpen(false);
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;
    onSubmitExpenseClaim(
      expTitle.trim(),
      Number(expAmount) || 250,
      expCurr,
      expNotes.trim() || 'Employee business expense reimbursement claim'
    );
    setExpTitle('');
    setExpNotes('');
    setIsExpenseModalOpen(false);
  };

  const downloadPayslipText = (slip: EmployeePayslip) => {
    const content = [
      `CREWPAY OFFICIAL COMPENSATION STATEMENT`,
      `Reference: ${slip.referenceCode}`,
      `Employee: ${employee.name} (${employee.role})`,
      `Pay Period: ${slip.periodLabel} | Value Date: ${slip.payDate}`,
      `----------------------------------------`,
      `Gross Base Compensation: $${slip.grossUsd.toLocaleString()} USD`,
      `Statutory Tax Withholding: -$${slip.taxWithheldUsd.toLocaleString()} USD`,
      `Pension / Retirement Contribution: -$${slip.pensionContributionUsd.toLocaleString()} USD`,
      `Net USD Compensation: $${slip.netUsd.toLocaleString()} USD`,
      `Guaranteed FX Rate Applied: 1 USD = ${slip.fxRateUsed} ${slip.receivingCurrency}`,
      `Net Local Payout Credited: ${slip.receivingCurrency} ${slip.netReceivedLocal.toLocaleString()}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slip.referenceCode}.txt`;
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

  // Filter employee-specific or personal ledger history
  const personalHistory = payslips.filter(
    (s) =>
      s.periodLabel.toLowerCase().includes(historySearch.toLowerCase()) ||
      s.referenceCode.toLowerCase().includes(historySearch.toLowerCase())
  );

  // ==========================================================================
  // SUB-VIEW: PAYSLIPS & TAX STATEMENTS
  // ==========================================================================
  if (activeSection === 'employee_payslips') {
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
              Compensation Statements & Tax Certificates
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Download itemized monthly payslips, FX conversion receipts, and statutory tax filings.
            </p>
          </div>
          <Button
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => payslips[0] && downloadPayslipText(payslips[0])}
          >
            Download Latest Statement
          </Button>
        </motion.div>

        <motion.div variants={staggerItem} className="space-y-3">
          {payslips.map((slip) => (
            <Card key={slip.id} surface="white" padding="md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#EEEAFE] text-[#4169E1] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#252A34]/60">
                      <span className="font-mono-tabular font-semibold text-[#14213D]">
                        {slip.referenceCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Value Date: {slip.payDate}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#14213D] mt-0.5">
                      {slip.periodLabel}
                    </h3>
                    <div className="text-xs text-[#252A34]/65 font-mono-tabular mt-0.5">
                      Gross: ${slip.grossUsd.toLocaleString()} · Tax: -$
                      {slip.taxWithheldUsd.toLocaleString()} · Pension: -$
                      {slip.pensionContributionUsd.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#14213D]/8">
                  <div className="text-left sm:text-right font-mono-tabular">
                    <div className="text-base font-bold text-[#14213D]">
                      {slip.receivingCurrency}{' '}
                      {slip.netReceivedLocal.toLocaleString()}
                    </div>
                    <div className="text-xs text-[#252A34]/55">
                      Net (${slip.netUsd.toLocaleString()} @ {slip.fxRateUsed})
                    </div>
                  </div>
                  <StatusBadge status={slip.status} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSlip(slip)}
                  >
                    Inspect
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: BANK & RECEIVING CURRENCY SETTINGS
  // ==========================================================================
  if (activeSection === 'employee_accounts') {
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
              Payout Accounts & Multi-Currency Split Routing
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Configure how your net compensation is converted and routed on payday at zero FX spread.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Sliders className="w-4 h-4" />}
            onClick={() => setIsSplitModalOpen(true)}
          >
            Adjust Currency Split
          </Button>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          <Card surface="mint" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#14213D]/75">
                PRIMARY VERIFIED PAYOUT ACCOUNT
              </span>
              <StatusBadge status={employee.accountStatus} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#14213D]">
                {employee.bankName}
              </h3>
              <p className="text-xs text-[#14213D]/75 font-mono-tabular mt-1">
                Account Ending *{employee.accountEnding} · {employee.routingLabel}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#14213D]/10 flex items-center justify-between text-xs">
              <span>Allocation Share: {employee.primaryCurrencySplit}%</span>
              <span className="font-mono-tabular font-bold text-[#14213D]">
                {primaryFx.symbol}
                {primaryNetLocal.toLocaleString()} {employee.receivingCurrency} / mo
              </span>
            </div>
            <div className="pt-2">
              <Button
                variant="midnight"
                size="sm"
                onClick={() => setIsBankModalOpen(true)}
              >
                Update Beneficiary Bank
              </Button>
            </div>
          </Card>

          <Card surface="lavender" padding="lg" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#14213D]/75">
                SECONDARY CURRENCY SPLIT CORRIDOR
              </span>
              <span className="text-xs font-mono-tabular font-bold text-[#4169E1]">
                {100 - employee.primaryCurrencySplit}% Allocation
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#14213D]">
                {employee.secondaryCurrency
                  ? `${employee.secondaryCurrency} Instant Settlement Wallet`
                  : 'Single-Currency Payout Active'}
              </h3>
              <p className="text-xs text-[#14213D]/75 mt-1">
                Automatically split a portion of your salary into a secondary local currency with zero wire fees.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/80 border border-[#14213D]/10 flex items-center justify-between text-xs">
              <span>Monthly Secondary Payout</span>
              <span className="font-mono-tabular font-bold text-[#14213D]">
                {employee.primaryCurrencySplit < 100
                  ? `${secondaryFx.symbol}${secondaryNetLocal.toLocaleString()} ${employee.secondaryCurrency}`
                  : '0% Allocated'}
              </span>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSplitModalOpen(true)}
              >
                Configure Multi-Currency Split
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: EXPENSES & REIMBURSEMENTS
  // ==========================================================================
  if (activeSection === 'employee_expenses') {
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
              Employee Expense Reimbursements
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Submit out-of-pocket expenses for direct settlement alongside your next payroll or instant off-cycle payout.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsExpenseModalOpen(true)}
          >
            Submit Expense Claim
          </Button>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card surface="peach" padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#14213D]/75">
                  FAST-TRACK EXPENSE SETTLEMENT
                </div>
                <h3 className="text-lg font-bold text-[#14213D] mt-1">
                  Claims approved by Finance are reimbursed directly to {employee.bankName} (*{employee.accountEnding})
                </h3>
                <p className="text-xs text-[#14213D]/75 mt-1">
                  New claims submitted here immediately appear in the Company Pending Approvals queue.
                </p>
              </div>
              <Button
                variant="midnight"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                New Reimbursement Claim
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // PRIMARY VIEW: EMPLOYEE PORTAL OVERVIEW
  // ==========================================================================
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. DISTINCT EMPLOYEE HERO SUMMARY + NEXT PAYDAY */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* Salary Information & Compensation Breakdown (7 cols) */}
        <Card
          surface="midnight"
          padding="lg"
          className="lg:col-span-7 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-[#C9F2DF] flex items-center gap-2">
                <span>PERSONAL COMPENSATION SUMMARY</span>
                <span aria-hidden="true">·</span>
                <span>{employee.paymentFrequency} Schedule</span>
              </div>
              <span className="text-xs font-mono-tabular px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/15">
                Next Payday: {employee.nextPayDate}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="text-xs text-white/65">
                  Net Monthly Payout ({employee.receivingCurrency})
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-white mt-1 font-mono-tabular">
                  <AnimatedCounter
                    value={primaryNetLocal}
                    prefix={primaryFx.symbol}
                  />
                </div>
                <div className="text-xs text-[#C9F2DF] font-mono-tabular mt-1">
                  {employee.primaryCurrencySplit < 100
                    ? `+ ${secondaryFx.symbol}${secondaryNetLocal.toLocaleString()} ${employee.secondaryCurrency} (${100 - employee.primaryCurrencySplit}% split)`
                    : `100% settled in ${employee.receivingCurrency}`}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/8 border border-white/12 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Annual Base Contract</span>
                  <span className="font-mono-tabular font-bold text-white">
                    ${employee.baseSalaryUsd.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/70 mt-2">
                  <span>Monthly Gross</span>
                  <span className="font-mono-tabular text-white">
                    ${monthlyGrossUsd.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-white/70 mt-2">
                  <span>Tax & Pension Withheld</span>
                  <span className="font-mono-tabular text-[#FFE0D1]">
                    -${(monthlyTaxUsd + monthlyPensionUsd).toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-white/12 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/70 font-mono-tabular">
              Guaranteed FX Lock: 1 USD = {primaryFx.rate}{' '}
              {employee.receivingCurrency} (0.00% employee fee)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => payslips[0] && setSelectedSlip(payslips[0])}
              >
                View Latest Payslip
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                Submit Expense
              </Button>
            </div>
          </div>
        </Card>

        {/* Payment Account Status & Receiving Currency (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
          {/* Payment Account Status */}
          <Card surface="mint" padding="md" className="flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/85 text-[#14213D] flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#14213D]/70">
                    Payment Account Status
                  </div>
                  <div className="text-base font-bold text-[#14213D]">
                    {employee.bankName} (*{employee.accountEnding})
                  </div>
                </div>
              </div>
              <StatusBadge status={employee.accountStatus} />
            </div>

            <div className="mt-3 pt-3 border-t border-[#14213D]/10 flex items-center justify-between text-xs">
              <span className="font-mono-tabular text-[#14213D]/75">
                {employee.routingLabel}
              </span>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(true)}
                className="font-semibold text-[#14213D] underline cursor-pointer"
              >
                Manage Account
              </button>
            </div>
          </Card>

          {/* Receiving Currency Card */}
          <Card
            surface="lavender"
            padding="md"
            className="flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/85 text-[#4169E1] flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#14213D]/70">
                    Receiving Currency & Split Routing
                  </div>
                  <div className="text-base font-bold text-[#14213D] font-mono-tabular">
                    {employee.primaryCurrencySplit}% {employee.receivingCurrency}
                    {employee.primaryCurrencySplit < 100 &&
                    employee.secondaryCurrency
                      ? ` · ${100 - employee.primaryCurrencySplit}% ${employee.secondaryCurrency}`
                      : ' (Single Corridor)'}
                  </div>
                </div>
              </div>
              <Button
                variant="midnight"
                size="sm"
                onClick={() => setIsSplitModalOpen(true)}
              >
                Configure
              </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-[#14213D]/10 flex items-center justify-between text-xs text-[#14213D]/75">
              <span>Zero FX conversion fee for employees</span>
              <span className="font-mono-tabular font-semibold">
                Instant Faster Payments
              </span>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* 2. RECENT PAYMENTS CARDS */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[#14213D]">
              Recent Payments & Scheduled Disbursements
            </h3>
            <p className="text-xs text-[#252A34]/60">
              Click any payment card to inspect full tax & FX breakdown
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('employee_payslips')}
            className="text-xs font-semibold text-[#4169E1] hover:underline cursor-pointer"
          >
            All Statements ({payslips.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {payslips.slice(0, 3).map((slip, idx) => (
            <Card
              key={slip.id}
              surface={idx === 0 ? 'peach' : 'white'}
              interactive
              onClick={() => setSelectedSlip(slip)}
              className="flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono-tabular font-semibold text-[#14213D]/70">
                    {slip.payDate}
                  </span>
                  <StatusBadge status={slip.status} />
                </div>
                <div className="text-sm font-bold text-[#14213D] mt-2">
                  {slip.periodLabel}
                </div>
                <div className="text-2xl font-bold text-[#14213D] font-mono-tabular mt-1">
                  {FX_RATES[slip.receivingCurrency]?.symbol || ''}
                  {slip.netReceivedLocal.toLocaleString()}{' '}
                  <span className="text-xs font-normal">
                    {slip.receivingCurrency}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#14213D]/10 flex items-center justify-between text-xs text-[#14213D]/75">
                <span className="font-mono-tabular">
                  Gross: ${slip.grossUsd.toLocaleString()}
                </span>
                <span className="font-semibold underline">View Statement</span>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* 3. TRANSACTION HISTORY TABLE */}
      <motion.div variants={staggerItem}>
        <Card surface="white" padding="none" className="overflow-hidden">
          <div className="p-5 border-b border-[#14213D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6]">
            <div>
              <h3 className="text-base font-bold text-[#14213D]">
                Personal Transaction History & Settlement Ledger
              </h3>
              <p className="text-xs text-[#252A34]/60 mt-0.5">
                Complete audit trail of salary credits, performance bonuses, and expense reimbursements
              </p>
            </div>
            <div className="w-full sm:w-64">
              <InputField
                placeholder="Search period or reference..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>

          {personalHistory.length === 0 ? (
            <EmptyState
              title="No matching payment statements"
              description="Clear your search query to view all historical salary disbursements."
              actionLabel="Reset Search"
              onAction={() => setHistorySearch('')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#14213D]/10 text-[11px] font-semibold text-[#252A34]/60 bg-[#FAF9F6]/60">
                    <th className="py-3 px-5">Statement Reference</th>
                    <th className="py-3 px-4">Pay Period</th>
                    <th className="py-3 px-4">Value Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Gross (USD)</th>
                    <th className="py-3 px-4 text-right">Net Local Payout</th>
                    <th className="py-3 px-5 text-right">Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#14213D]/8 text-sm">
                  {personalHistory.map((slip) => (
                    <tr
                      key={slip.id}
                      onClick={() => setSelectedSlip(slip)}
                      className="hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-mono-tabular font-semibold text-xs text-[#14213D]">
                        {slip.referenceCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#14213D]">
                        {slip.periodLabel}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-xs text-[#252A34]/70">
                        {slip.payDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={slip.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-[#252A34]/80">
                        ${slip.grossUsd.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-bold text-[#14213D]">
                        {slip.receivingCurrency}{' '}
                        {slip.netReceivedLocal.toLocaleString()}
                      </td>
                      <td
                        className="py-3.5 px-5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                          onClick={() => downloadPayslipText(slip)}
                        >
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* MODAL 1: CONFIGURE RECEIVING CURRENCY & SPLIT */}
      <Modal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        title="Configure Receiving Currency & Split-Pay"
        subtitle="Route your net salary across one or two local currencies with guaranteed mid-market FX rates."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSplitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCurrencySplit}>
              Save Currency Routing
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCurrencySplit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Dropdown
              label="Primary Receiving Currency"
              value={primaryCurr}
              onChange={setPrimaryCurr}
              options={Object.entries(FX_RATES).map(([code, info]) => ({
                value: code,
                label: `${code} (${info.symbol}) · ${info.name}`,
              }))}
            />
            <Dropdown
              label="Secondary Split Currency (Optional)"
              value={secondaryCurr}
              onChange={setSecondaryCurr}
              options={Object.entries(FX_RATES).map(([code, info]) => ({
                value: code,
                label: `${code} (${info.symbol}) · ${info.name}`,
              }))}
            />
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#14213D]">
              <span>
                Primary Allocation ({primaryCurr}): {splitPercent}%
              </span>
              <span>
                Secondary Allocation ({secondaryCurr}): {100 - splitPercent}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={splitPercent}
              onChange={(e) => setSplitPercent(Number(e.target.value))}
              className="w-full accent-[#4169E1] cursor-pointer"
            />
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono-tabular">
              <div className="p-3 rounded-lg bg-white border border-[#14213D]/10">
                <div className="text-[#252A34]/60">Estimated Primary Net</div>
                <div className="text-sm font-bold text-[#14213D] mt-0.5">
                  {FX_RATES[primaryCurr]?.symbol}
                  {Math.round(
                    monthlyNetUsd *
                      (splitPercent / 100) *
                      (FX_RATES[primaryCurr]?.rate || 1)
                  ).toLocaleString()}{' '}
                  {primaryCurr}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#14213D]/10">
                <div className="text-[#252A34]/60">Estimated Secondary Net</div>
                <div className="text-sm font-bold text-[#14213D] mt-0.5">
                  {FX_RATES[secondaryCurr]?.symbol}
                  {Math.round(
                    monthlyNetUsd *
                      ((100 - splitPercent) / 100) *
                      (FX_RATES[secondaryCurr]?.rate || 1)
                  ).toLocaleString()}{' '}
                  {secondaryCurr}
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: UPDATE BANK ACCOUNT */}
      <Modal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        title="Update Beneficiary Bank Details"
        subtitle="Instant IBAN / Sort Code / ACH name-match verification protects your salary payouts."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsBankModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveBankDetails}>
              Verify & Save Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBankDetails} className="space-y-4">
          <InputField
            label="Bank or Financial Institution Name"
            value={bankNameInput}
            onChange={(e) => setBankNameInput(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Account Number (Last 4 Digits)"
              value={accountEndingInput}
              maxLength={4}
              onChange={(e) => setAccountEndingInput(e.target.value)}
              required
            />
            <InputField
              label="Routing / Sort Code / IBAN Identifier"
              value={routingInput}
              onChange={(e) => setRoutingInput(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 3: INSPECT PAYSLIP STATEMENT */}
      <Modal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        title={`Official Compensation Statement · ${selectedSlip?.periodLabel}`}
        subtitle={`Reference: ${selectedSlip?.referenceCode} · Value Date: ${selectedSlip?.payDate}`}
        footer={
          <>
            {selectedSlip && (
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => downloadPayslipText(selectedSlip)}
              >
                Download Statement
              </Button>
            )}
            <Button variant="midnight" onClick={() => setSelectedSlip(null)}>
              Done
            </Button>
          </>
        }
      >
        {selectedSlip && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#EEEAFE] border border-[#4169E1]/20 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#14213D]/70">
                  Net Credited to {employee.bankName} (*{employee.accountEnding})
                </div>
                <div className="text-2xl font-bold text-[#14213D] font-mono-tabular mt-0.5">
                  {selectedSlip.receivingCurrency}{' '}
                  {selectedSlip.netReceivedLocal.toLocaleString()}
                </div>
              </div>
              <StatusBadge status={selectedSlip.status} />
            </div>

            <div className="divide-y divide-[#14213D]/10 border border-[#14213D]/10 rounded-xl px-4">
              <div className="py-3 flex items-center justify-between text-sm">
                <span className="text-[#252A34]/75">Gross Base Compensation</span>
                <span className="font-mono-tabular font-semibold text-[#14213D]">
                  ${selectedSlip.grossUsd.toLocaleString()} USD
                </span>
              </div>
              <div className="py-3 flex items-center justify-between text-sm">
                <span className="text-[#252A34]/75">
                  Statutory Income Tax & National Insurance
                </span>
                <span className="font-mono-tabular text-[#DC2626]">
                  -${selectedSlip.taxWithheldUsd.toLocaleString()} USD
                </span>
              </div>
              <div className="py-3 flex items-center justify-between text-sm">
                <span className="text-[#252A34]/75">
                  Employee Pension Contribution (4%)
                </span>
                <span className="font-mono-tabular text-[#252A34]">
                  -${selectedSlip.pensionContributionUsd.toLocaleString()} USD
                </span>
              </div>
              <div className="py-3 flex items-center justify-between text-sm font-bold text-[#14213D]">
                <span>Net Compensation (USD Equivalent)</span>
                <span className="font-mono-tabular">
                  ${selectedSlip.netUsd.toLocaleString()} USD
                </span>
              </div>
              <div className="py-3 flex items-center justify-between text-xs text-[#252A34]/65">
                <span>Guaranteed Interbank Exchange Rate</span>
                <span className="font-mono-tabular">
                  1 USD = {selectedSlip.fxRateUsed}{' '}
                  {selectedSlip.receivingCurrency}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: SUBMIT EXPENSE REIMBURSEMENT */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Submit Expense Reimbursement Claim"
        subtitle="Approved expenses are added directly to the Company Approvals queue for instant payout."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsExpenseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateExpense}>
              Submit for Approval
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <InputField
            label="Expense Description / Title"
            placeholder="e.g. Cloud Security Conference Registration"
            value={expTitle}
            onChange={(e) => setExpTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Reimbursement Amount"
              type="number"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              required
            />
            <Dropdown
              label="Currency"
              value={expCurr}
              onChange={setExpCurr}
              options={[
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'NGN', label: 'NGN (₦)' },
                { value: 'SGD', label: 'SGD (S$)' },
              ]}
            />
          </div>
          <InputField
            label="Business Justification & Receipt Reference"
            placeholder="e.g. Receipt #INV-8812 attached for Q4 engineering summit"
            value={expNotes}
            onChange={(e) => setExpNotes(e.target.value)}
          />
        </form>
      </Modal>
    </motion.div>
  );
};
