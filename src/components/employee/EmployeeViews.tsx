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
  Sparkles,
  Clock,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Receipt,
  Building,
  Bell,
  Check,
  Briefcase,
  AlertCircle,
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
              Historical Payslips & Certified Tax Statements
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Review and download official monthly pay slips with statutory withholdings and FX rates.
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

        <motion.div variants={staggerItem}>
          <Card surface="white" padding="none" className="overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#14213D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4169E1]" />
                <span className="font-bold text-sm text-[#14213D]">
                  All Issued Payslip Statements ({payslips.length})
                </span>
              </div>
              <div className="w-full sm:w-64">
                <InputField
                  placeholder="Search period or code..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#14213D]/10 text-[11px] font-semibold text-[#252A34]/60 bg-[#FAF9F6]/50">
                    <th className="py-3 px-5">Statement Reference</th>
                    <th className="py-3 px-4">Pay Period</th>
                    <th className="py-3 px-4">Value Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Gross (USD)</th>
                    <th className="py-3 px-4 text-right">Tax & Pension</th>
                    <th className="py-3 px-4 text-right">Net Credited</th>
                    <th className="py-3 px-5 text-right">Actions</th>
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
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-xs text-[#FFE0D1] bg-[#14213D]/5 px-2 py-0.5 rounded">
                        -${(slip.taxWithheldUsd + slip.pensionContributionUsd).toLocaleString()}
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
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: BANK ACCOUNTS & SPLIT CONFIG
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
              Direct Deposit Accounts & Payout Preferences
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Manage verified destination bank accounts and multi-currency split ratios.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Sliders className="w-4 h-4" />}
            onClick={() => setIsSplitModalOpen(true)}
          >
            Configure Currency Split
          </Button>
        </motion.div>

        <motion.div
          variants={staggerItem}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          <Card surface="white" padding="lg" className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-[#4169E1] uppercase tracking-wider">
                  Primary Payout Corridor
                </span>
                <h3 className="text-lg font-bold text-[#14213D] mt-1">
                  {employee.bankName}
                </h3>
                <p className="text-xs text-[#252A34]/65">
                  Masked Account ending in •••• {employee.accountEnding}
                </p>
              </div>
              <StatusBadge status={employee.accountStatus} />
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#14213D]/8 space-y-2 text-xs font-mono-tabular">
              <div className="flex justify-between text-[#252A34]/70">
                <span>Routing / BIC Identifier:</span>
                <span className="font-bold text-[#14213D]">
                  {employee.routingLabel}
                </span>
              </div>
              <div className="flex justify-between text-[#252A34]/70">
                <span>Receiving Currency:</span>
                <span className="font-bold text-[#4169E1]">
                  {employee.receivingCurrency} ({primaryFx.name})
                </span>
              </div>
              <div className="flex justify-between text-[#252A34]/70">
                <span>Allocation Share:</span>
                <span className="font-bold text-[#14213D]">
                  {employee.primaryCurrencySplit}% of net earnings
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBankModalOpen(true)}
              >
                Edit Bank Details
              </Button>
            </div>
          </Card>

          <Card surface="lavender" padding="lg" className="space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#14213D]/70 uppercase tracking-wider">
                Split Routing Strategy
              </span>
              <h3 className="text-lg font-bold text-[#14213D] mt-1">
                {employee.primaryCurrencySplit < 100
                  ? `Dual-Currency Corridor (${employee.primaryCurrencySplit}% / ${100 - employee.primaryCurrencySplit}%)`
                  : 'Single Primary Corridor (100%)'}
              </h3>
              <p className="text-xs text-[#14213D]/75 mt-1">
                You can split your monthly payout across two currencies (e.g. 75% GBP in London + 25% NGN in Lagos) with zero intermediary deduction.
              </p>
            </div>

            <div className="pt-4 border-t border-[#14213D]/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#14213D]">
                Blaaiz Zero-Spread Guarantee
              </span>
              <Button
                variant="midnight"
                size="sm"
                onClick={() => setIsSplitModalOpen(true)}
              >
                Adjust Split %
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: EXPENSES
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
              Expense Claims & Reimbursements
            </h2>
            <p className="text-sm text-[#252A34]/65 mt-0.5">
              Submit out-of-pocket expenses and monitor authorization status from Finance Ops.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsExpenseModalOpen(true)}
          >
            Submit New Expense Claim
          </Button>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card surface="white" padding="none" className="overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#14213D]/10 flex items-center justify-between bg-[#FAF9F6]">
              <span className="font-bold text-sm text-[#14213D]">
                Pending & Processed Reimbursement Claims
              </span>
              <span className="text-xs text-[#252A34]/60">
                Directly added to upcoming cycle once approved
              </span>
            </div>

            <div className="p-6 text-center text-xs text-[#252A34]/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EEEAFE] text-[#4169E1] mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="font-semibold text-sm text-[#14213D]">
                No claims awaiting submission
              </div>
              <p className="max-w-md mx-auto">
                All previous expense claims have been reviewed, verified, and settled into your primary bank account.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                Submit Expense Claim
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================================================
  // DEFAULT: EMPLOYEE OVERVIEW (COMBINING BEST OF IMAGES 1 & 2)
  // ==========================================================================
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. WARM GOLDEN-CARAMEL HERO GREETING BANNER (INSPIRED BY REFERENCE 1) */}
      <motion.div
        variants={staggerItem}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#C6934B] via-[#D29E54] to-[#C08C43] text-white p-6 sm:p-8 shadow-md"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Circular Avatar Frame */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 p-1 border-2 border-white/60 shadow-lg">
                <div className="w-full h-full rounded-full bg-[#14213D] text-[#C9F2DF] flex items-center justify-center font-display font-extrabold text-xl sm:text-2xl">
                  {employee.avatarInitials}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#C6934B]" />
            </div>

            {/* Greeting text */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/20 text-white/90">
                  Staff Self-Service
                </span>
                <span className="text-[11px] text-white/80 font-medium flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-300" />
                  <span>Direct Deposit Active</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome back, {employee.name}!
              </h1>
              <p className="text-xs sm:text-sm text-white/85 mt-1 font-medium">
                {employee.role} · {employee.department} ({employee.location})
              </p>
            </div>
          </div>

          {/* Quick Action Pill Buttons (like Reference 1) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:self-center">
            <button
              type="button"
              onClick={() => payslips[0] && setSelectedSlip(payslips[0])}
              className="px-4 py-2 rounded-full bg-white text-[#14213D] hover:bg-white/90 font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              View Latest Payslip
            </button>
            <button
              type="button"
              onClick={() => setIsSplitModalOpen(true)}
              className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-sm transition active:scale-95 cursor-pointer"
            >
              Configure Split-Pay
            </button>
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-4 py-2 rounded-full bg-black/25 hover:bg-black/35 text-white font-semibold text-xs transition active:scale-95 cursor-pointer"
            >
              Submit Expense
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. 4 SLEEK STAT KPI CARDS (INSPIRED BY REFERENCE 1 & 2) */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* Card 1: Net Monthly Take-Home */}
        <Card surface="white" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#252A34]/60">
              Net Monthly Compensation
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#C9F2DF] text-[#0F6E46] flex items-center justify-center font-bold text-xs">
              {primaryFx.symbol}
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] font-mono-tabular">
              <AnimatedCounter
                value={primaryNetLocal}
                prefix={primaryFx.symbol}
              />
            </div>
            <div className="text-[11px] text-[#252A34]/60 font-mono-tabular mt-0.5">
              100% Guaranteed Payout ({employee.receivingCurrency})
            </div>
          </div>
          <div className="pt-2 border-t border-[#14213D]/8 flex items-center justify-between text-xs">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              + Instant Rails
            </span>
            <span className="text-[11px] text-[#252A34]/55">Next: 28 Nov 2026</span>
          </div>
        </Card>

        {/* Card 2: Currency Corridor Split */}
        <Card surface="white" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#252A34]/60">
              Currency Corridor Split
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EEEAFE] text-[#4169E1] flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] font-mono-tabular">
              {employee.primaryCurrencySplit}%
            </div>
            <div className="text-[11px] text-[#252A34]/60 font-mono-tabular mt-0.5">
              {employee.receivingCurrency} Corridor
              {employee.primaryCurrencySplit < 100 &&
                ` + ${100 - employee.primaryCurrencySplit}% ${employee.secondaryCurrency}`}
            </div>
          </div>
          <div className="pt-2 border-t border-[#14213D]/8 flex items-center justify-between text-xs">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
              0.00% Spread Locked
            </span>
            <button
              onClick={() => setIsSplitModalOpen(true)}
              className="text-[11px] text-[#4169E1] font-semibold hover:underline"
            >
              Adjust
            </button>
          </div>
        </Card>

        {/* Card 3: Annual Base Contract */}
        <Card surface="white" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#252A34]/60">
              Annual Contract Gross
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFE0D1] text-[#A84A1C] flex items-center justify-center font-bold text-xs">
              $
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] font-mono-tabular">
              ${(employee.baseSalaryUsd / 1000).toFixed(0)}k
            </div>
            <div className="text-[11px] text-[#252A34]/60 font-mono-tabular mt-0.5">
              ${employee.baseSalaryUsd.toLocaleString()} USD / Year
            </div>
          </div>
          <div className="pt-2 border-t border-[#14213D]/8 flex items-center justify-between text-xs">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              Tax Attested
            </span>
            <span className="text-[11px] text-[#252A34]/55">Monthly: ${monthlyGrossUsd.toLocaleString()}</span>
          </div>
        </Card>

        {/* Card 4: Expense Claims */}
        <Card surface="white" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#252A34]/60">
              Reimbursement Claims
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10 text-[#14213D] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#14213D] font-mono-tabular">
              1 Active
            </div>
            <div className="text-[11px] text-[#252A34]/60 font-mono-tabular mt-0.5">
              £420 GBP under verification
            </div>
          </div>
          <div className="pt-2 border-t border-[#14213D]/8 flex items-center justify-between text-xs">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
              Pending Review
            </span>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="text-[11px] text-[#14213D] font-semibold hover:underline"
            >
              + New Claim
            </button>
          </div>
        </Card>
      </motion.div>

      {/* 3. MAIN DASHBOARD CONTENT (2-COLUMN RESPONSIVE LAYOUT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 COLS ON DESKTOP, 12 ON MOBILE) */}
        <div className="lg:col-span-7 space-y-6">
          {/* COMPENSATION BREAKDOWN VISUAL (INSPIRED BY REFERENCE 1 'TEAM EXECUTIVE') */}
          <motion.div variants={staggerItem}>
            <Card surface="white" padding="lg">
              <div className="flex items-center justify-between pb-4 border-b border-[#14213D]/10">
                <div>
                  <h3 className="text-base font-bold text-[#14213D]">
                    Monthly Compensation & Deductions Breakdown
                  </h3>
                  <p className="text-xs text-[#252A34]/60 mt-0.5">
                    Statutory tax withholding, pension contributions, and direct take-home pay
                  </p>
                </div>
                <span className="text-xs font-mono-tabular font-bold text-[#4169E1] bg-[#EEEAFE] px-2.5 py-1 rounded-lg">
                  ${monthlyGrossUsd.toLocaleString()} USD Total
                </span>
              </div>

              {/* Donut representation & horizontal progress bars */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center mt-5">
                {/* Donut Ring Visual */}
                <div className="sm:col-span-4 flex flex-col items-center justify-center">
                  <div className="relative w-28 h-28 rounded-full border-8 border-[#4169E1] flex items-center justify-center bg-[#FAF9F6] shadow-inner">
                    <div className="text-center">
                      <div className="text-xl font-extrabold text-[#14213D] font-mono-tabular">
                        75%
                      </div>
                      <div className="text-[9px] font-bold text-[#252A34]/55 uppercase tracking-wider">
                        Take-Home
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bars & values (like Image 1) */}
                <div className="sm:col-span-8 space-y-3.5">
                  {/* Row 1: Net Salary */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-[#14213D] flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#4169E1]" />
                        Net Salary Payout
                      </span>
                      <span className="font-bold font-mono-tabular text-[#14213D]">
                        ${monthlyNetUsd.toLocaleString()} USD ({primaryFx.symbol}{primaryNetLocal.toLocaleString()})
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#4169E1] w-[75%]" />
                    </div>
                  </div>

                  {/* Row 2: Statutory Tax */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-[#14213D] flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E08A56]" />
                        Statutory Income Tax (21%)
                      </span>
                      <span className="font-bold font-mono-tabular text-[#252A34]/80">
                        ${monthlyTaxUsd.toLocaleString()} USD
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#E08A56] w-[21%]" />
                    </div>
                  </div>

                  {/* Row 3: Pension / Retirement */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-[#14213D] flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                        Pension & Benefits (4%)
                      </span>
                      <span className="font-bold font-mono-tabular text-[#252A34]/80">
                        ${monthlyPensionUsd.toLocaleString()} USD
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-[#10B981] w-[4%]" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* WEEKLY SCHEDULE & PAYROLL VALUE MATRIX (INSPIRED BY REFERENCE 2 'MEETING SCHEDULING') */}
          <motion.div variants={staggerItem}>
            <Card surface="white" padding="lg">
              <div className="flex items-center justify-between pb-4 border-b border-[#14213D]/10">
                <div>
                  <h3 className="text-base font-bold text-[#14213D]">
                    Weekly Shift & Payroll Value Calendar
                  </h3>
                  <p className="text-xs text-[#252A34]/60 mt-0.5">
                    Working schedule, cutoff dates, and scheduled instant disbursement
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#14213D]/10 text-[#14213D]">
                  Nov 24 – Nov 30, 2026
                </span>
              </div>

              {/* 7-Day Matrix Table (Responsive Scroll) */}
              <div className="mt-4 overflow-x-auto">
                <div className="min-w-[550px]">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[#252A34]/60 pb-2 border-b border-[#14213D]/8">
                    <div>Mon 24</div>
                    <div>Tue 25</div>
                    <div>Wed 26</div>
                    <div>Thu 27</div>
                    <div className="text-[#C6934B] font-bold">Fri 28</div>
                    <div>Sat 29</div>
                    <div>Sun 30</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 pt-3 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#14213D]/8 text-[#252A34]/70">
                      <span className="text-[11px] block font-medium">Remote</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#EEEAFE] border border-[#4169E1]/20 text-[#4169E1]">
                      <span className="text-[11px] block font-bold">HQ Office</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#EEEAFE] border border-[#4169E1]/20 text-[#4169E1]">
                      <span className="text-[11px] block font-bold">HQ Office</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#14213D]/8 text-[#252A34]/70">
                      <span className="text-[11px] block font-medium">Remote</span>
                    </div>
                    {/* Payday ⚡ */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#C6934B] to-[#D29E54] text-white shadow-sm ring-2 ring-[#C6934B]/30 font-bold">
                      <span className="text-[11px] block">Payday ⚡</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6]/50 text-[#252A34]/40">
                      <span className="text-[11px] block">Off</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF9F6]/50 text-[#252A34]/40">
                      <span className="text-[11px] block">Off</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* HISTORICAL STATEMENTS TABLE (INSPIRED BY REFERENCE 2 'EMPLOYEE LIST') */}
          <motion.div variants={staggerItem}>
            <Card surface="white" padding="none" className="overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#14213D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF9F6]">
                <div>
                  <h3 className="text-base font-bold text-[#14213D]">
                    Salary Disbursal Records & Statements
                  </h3>
                  <p className="text-xs text-[#252A34]/60 mt-0.5">
                    Click any payment entry to view breakdown or download statements
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('employee_payslips')}
                  className="text-xs font-semibold text-[#4169E1] hover:underline cursor-pointer shrink-0"
                >
                  View All ({payslips.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#14213D]/10 text-[11px] font-semibold text-[#252A34]/60 bg-[#FAF9F6]/50">
                      <th className="py-3 px-5">Period & Reference</th>
                      <th className="py-3 px-4">Value Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Net Credited</th>
                      <th className="py-3 px-5 text-right">Statement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#14213D]/8 text-sm">
                    {payslips.slice(0, 3).map((slip) => (
                      <tr
                        key={slip.id}
                        onClick={() => setSelectedSlip(slip)}
                        className="hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-xs text-[#14213D]">
                            {slip.periodLabel}
                          </div>
                          <div className="text-[11px] text-[#252A34]/55 font-mono-tabular">
                            {slip.referenceCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-xs text-[#252A34]/70">
                          {slip.payDate}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={slip.status} />
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
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: "MY ACTIVITY & EVENTS" (INSPIRED BY REFERENCE 1 & 2 RIGHT PANELS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* UPCOMING TALKS & MEETINGS STYLE: SCHEDULED DISBURSALS */}
          <motion.div variants={staggerItem}>
            <Card surface="white" padding="lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#14213D]/10">
                <h3 className="text-base font-bold text-[#14213D]">
                  Upcoming Disbursals
                </h3>
                <span className="text-xs text-[#252A34]/55 font-mono-tabular">
                  UTC Scheduled
                </span>
              </div>

              {/* Event Cards with Date Badges (Like Image 1 & 2) */}
              <div className="mt-4 space-y-3">
                {/* Event 1 */}
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#14213D]/8 flex items-center gap-3.5 hover:border-[#14213D]/20 transition">
                  {/* Date Badge */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C6934B] to-[#D29E54] text-white flex flex-col items-center justify-center font-bold shrink-0 shadow-xs">
                    <span className="text-sm leading-none font-extrabold">28</span>
                    <span className="text-[9px] uppercase tracking-wider mt-0.5">NOV</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#14213D] truncate">
                        Primary November Payroll
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Scheduled
                      </span>
                    </div>
                    <div className="text-[11px] text-[#252A34]/60 mt-0.5 font-mono-tabular">
                      17:00 UTC · {primaryFx.symbol}{primaryNetLocal.toLocaleString()} {employee.receivingCurrency} via Faster Payments
                    </div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#14213D]/8 flex items-center gap-3.5 hover:border-[#14213D]/20 transition">
                  {/* Date Badge */}
                  <div className="w-12 h-12 rounded-xl bg-[#14213D] text-white flex flex-col items-center justify-center font-bold shrink-0 shadow-xs">
                    <span className="text-sm leading-none font-extrabold">15</span>
                    <span className="text-[9px] uppercase tracking-wider text-[#C9F2DF] mt-0.5">DEC</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#14213D] truncate">
                        Mid-Month Reimbursement Run
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        In Clearing
                      </span>
                    </div>
                    <div className="text-[11px] text-[#252A34]/60 mt-0.5 font-mono-tabular">
                      12:00 UTC · Approved claim settlements
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* DIRECT DEPOSIT BANK RAIL CARD */}
          <motion.div variants={staggerItem}>
            <Card surface="mint" padding="lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white text-[#14213D] flex items-center justify-center shadow-xs">
                    <Landmark className="w-5 h-5 text-[#0F6E46]" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#0F6E46] uppercase tracking-wider">
                      Direct Deposit Destination
                    </div>
                    <div className="text-base font-bold text-[#14213D]">
                      {employee.bankName}
                    </div>
                  </div>
                </div>
                <StatusBadge status={employee.accountStatus} />
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-white/80 border border-[#0F6E46]/15 space-y-2 text-xs font-mono-tabular">
                <div className="flex justify-between">
                  <span className="text-[#252A34]/65">Account Ending:</span>
                  <span className="font-bold text-[#14213D]">•••• {employee.accountEnding}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#252A34]/65">Routing Identifier:</span>
                  <span className="font-bold text-[#14213D]">{employee.routingLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#252A34]/65">Clearing Rail:</span>
                  <span className="font-bold text-[#0F6E46]">UK Faster Payments (Instant)</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#0F6E46]/15 flex items-center justify-between text-xs">
                <span className="text-[#0F6E46] font-medium">Zero deduction guarantee</span>
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(true)}
                  className="font-bold text-[#14213D] underline cursor-pointer"
                >
                  Manage Account
                </button>
              </div>
            </Card>
          </motion.div>

          {/* LATEST SHOUTOUTS & ANNOUNCEMENTS (INSPIRED BY REFERENCE 1) */}
          <motion.div variants={staggerItem}>
            <Card surface="white" padding="lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#14213D]/10">
                <h3 className="text-base font-bold text-[#14213D]">
                  Corporate Operations Updates
                </h3>
                <span className="text-xs font-semibold text-[#4169E1]">
                  Verified
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#14213D]/8 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EEEAFE] text-[#4169E1] font-bold text-xs flex items-center justify-center shrink-0">
                    RO
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[#14213D]">
                      Rebecca Oyeyiola (VP Finance)
                    </div>
                    <p className="text-[#252A34]/70 mt-0.5">
                      November cycle FX rates have been locked at mid-market. Instant settlement cleared across SEPA and FPS rails.
                    </p>
                    <span className="text-[10px] text-[#252A34]/50 font-mono-tabular mt-1 block">
                      2 hours ago
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#14213D]/8 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#C9F2DF] text-[#0F6E46] font-bold text-xs flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[#14213D]">
                      Annual Tax Documentation
                    </div>
                    <p className="text-[#252A34]/70 mt-0.5">
                      Your certified P60 and annual compensation certificate have been uploaded to your Payslips tab.
                    </p>
                    <span className="text-[10px] text-[#252A34]/50 font-mono-tabular mt-1 block">
                      1 day ago
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

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
              onChange={(e) => setAccountEndingInput(e.target.value)}
              required
            />
            <InputField
              label="Routing / Sort Code / BIC"
              value={routingInput}
              onChange={(e) => setRoutingInput(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 3: SUBMIT EXPENSE CLAIM */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Submit Business Expense Claim"
        subtitle="Claims are verified and automatically bundled into the upcoming salary disbursement cycle."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
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
            placeholder="e.g. Annual JetBrains All Products Pack License"
            value={expTitle}
            onChange={(e) => setExpTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Claim Amount"
              type="number"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              required
            />
            <Dropdown
              label="Currency"
              value={expCurr}
              onChange={setExpCurr}
              options={Object.keys(FX_RATES).map((c) => ({
                value: c,
                label: `${c} (${FX_RATES[c].symbol})`,
              }))}
            />
          </div>
          <InputField
            label="Business Purpose & Notes"
            placeholder="Required for core infrastructure development"
            value={expNotes}
            onChange={(e) => setExpNotes(e.target.value)}
          />
        </form>
      </Modal>

      {/* MODAL 4: PAYSLIP STATEMENT BREAKDOWN INSPECTOR */}
      <Modal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip ? `Compensation Statement: ${selectedSlip.periodLabel}` : ''}
        subtitle="Certified multi-currency payroll receipt with tax and retirement withholding ledger."
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedSlip(null)}>
              Close
            </Button>
            {selectedSlip && (
              <Button
                variant="primary"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => downloadPayslipText(selectedSlip)}
              >
                Download Statement (PDF)
              </Button>
            )}
          </>
        }
      >
        {selectedSlip && (
          <div className="space-y-4 text-xs font-mono-tabular">
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-[#252A34]/55">
                  Reference: {selectedSlip.referenceCode}
                </div>
                <div className="text-2xl font-bold text-[#14213D] mt-1">
                  {selectedSlip.receivingCurrency}{' '}
                  {selectedSlip.netReceivedLocal.toLocaleString()}
                </div>
                <div className="text-[11px] text-[#0F6E46] mt-0.5">
                  Value Date: {selectedSlip.payDate} · Settled via UK Faster Payments
                </div>
              </div>
              <StatusBadge status={selectedSlip.status} />
            </div>

            <div className="space-y-2 p-3.5 rounded-xl border border-[#14213D]/8">
              <div className="flex justify-between py-1 border-b border-[#14213D]/6">
                <span className="text-[#252A34]/70">Gross Compensation (USD):</span>
                <span className="font-bold text-[#14213D]">
                  ${selectedSlip.grossUsd.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#14213D]/6 text-[#A84A1C]">
                <span>Statutory Tax Withholding:</span>
                <span>-${selectedSlip.taxWithheldUsd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#14213D]/6 text-[#252A34]/70">
                <span>Pension & Retirement Contribution:</span>
                <span>-${selectedSlip.pensionContributionUsd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#14213D]/6 font-bold text-[#14213D]">
                <span>Net USD Equivalent:</span>
                <span>${selectedSlip.netUsd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 text-[#4169E1]">
                <span>Guaranteed FX Conversion Rate:</span>
                <span>1 USD = {selectedSlip.fxRateUsed} {selectedSlip.receivingCurrency}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
