import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Globe,
  Lock,
  Send,
  Download,
  Check,
} from 'lucide-react';
import { Employee, UpcomingPayrollCycle } from '../../types/crewpay';
import { Button, Modal, StatusBadge, AnimatedCounter } from '../ui/DesignSystem';

interface RunPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycle: UpcomingPayrollCycle | null;
  employees: Employee[];
  onCompletePayroll: (
    cycleId: string,
    totalDisbursedUsd: number,
    selectedEmployeeIds: string[]
  ) => void;
}

const PROCESSING_STAGES = [
  {
    id: 'fx_lock',
    title: 'Locking Guaranteed Interbank FX Rates',
    detail: 'Securing spot liquidity across USD, EUR, GBP, NGN, SGD and CAD corridors',
  },
  {
    id: 'compliance',
    title: 'Executing Statutory Tax & Sanctions Screening',
    detail: 'Validating OFAC, HM Treasury, and local PAYE withholding schedules',
  },
  {
    id: 'treasury',
    title: 'Debiting Multi-Currency Treasury Accounts',
    detail: 'Reconciling batch ledger entries against Meridian segregated accounts',
  },
  {
    id: 'rails',
    title: 'Dispatching via Local Instant Payment Rails',
    detail: 'Routing instructions to SEPA Instant, Faster Payments, ACH Same-Day & NIP',
  },
];

export const RunPayrollModal: React.FC<RunPayrollModalProps> = ({
  isOpen,
  onClose,
  cycle,
  employees,
  onCompletePayroll,
}) => {
  const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [batchReference, setBatchReference] = useState('CP-BATCH-2026-1194');

  useEffect(() => {
    if (isOpen) {
      setStep('review');
      setSelectedIds(employees.map((e) => e.id));
      setProgress(0);
      setActiveStageIndex(0);
      setBatchReference(
        `CP-BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`
      );
    }
  }, [isOpen, employees]);

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedEmployees = employees.filter((e) => selectedIds.includes(e.id));
  const monthlySampleTotal = selectedEmployees.reduce(
    (sum, emp) => sum + Math.round(emp.baseSalaryUsd / 12),
    0
  );
  // Scale to full organisation cycle total proportionally
  const baseTotal = cycle?.estimatedTotalUsd || 1770400;
  const computedTotalUsd =
    employees.length > 0
      ? Math.round((selectedEmployees.length / employees.length) * baseTotal)
      : baseTotal;

  const handleStartProcessing = () => {
    setStep('processing');
    setProgress(8);
    setActiveStageIndex(0);
  };

  useEffect(() => {
    if (step !== 'processing') return;

    const timer1 = setTimeout(() => {
      setProgress(34);
      setActiveStageIndex(1);
    }, 650);

    const timer2 = setTimeout(() => {
      setProgress(66);
      setActiveStageIndex(2);
    }, 1350);

    const timer3 = setTimeout(() => {
      setProgress(92);
      setActiveStageIndex(3);
    }, 2050);

    const timer4 = setTimeout(() => {
      setProgress(100);
      if (cycle) {
        onCompletePayroll(cycle.id, computedTotalUsd, selectedIds);
      }
      setStep('success');
    }, 2750);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [step, cycle, computedTotalUsd, selectedIds, onCompletePayroll]);

  if (!cycle) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'processing' ? () => {} : onClose}
      title={
        step === 'review'
          ? `Execute Payroll · ${cycle.cycleName}`
          : step === 'processing'
          ? 'Processing Global Settlement Batch'
          : 'Payroll Batch Dispatched Successfully'
      }
      subtitle={
        step === 'review'
          ? `Pay Period: ${cycle.periodLabel} · Scheduled Value Date: ${cycle.payDate}`
          : step === 'processing'
          ? `Reference ${batchReference} · Do not close this window`
          : `Batch ${batchReference} settled across ${cycle.currenciesCount} currency corridors`
      }
      maxWidth="2xl"
      footer={
        step === 'review' ? (
          <div className="w-full flex items-center justify-between gap-4">
            <div className="text-xs text-[#252A34]/70">
              <span>Selected: </span>
              <span className="font-mono-tabular font-semibold text-[#14213D]">
                {selectedEmployees.length} of {employees.length}
              </span>{' '}
              featured records ({cycle.employeesCount} total org headcount)
            </div>
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={selectedEmployees.length === 0}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleStartProcessing}
              >
                Authorize & Disburse ${computedTotalUsd.toLocaleString()}
              </Button>
            </div>
          </div>
        ) : step === 'success' ? (
          <div className="w-full flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {
                const csv = [
                  'Reference,Cycle,TotalUSD,PayDate,Status',
                  `${batchReference},${cycle.cycleName},${computedTotalUsd},${cycle.payDate},COMPLETED`,
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${batchReference}-settlement.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Download Settlement Manifest (CSV)
            </Button>
            <Button variant="midnight" size="md" onClick={onClose}>
              Return to Financial Operations
            </Button>
          </div>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait">
        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="space-y-5"
          >
            {/* Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#EEEAFE] border border-[#4169E1]/15">
                <div className="text-xs font-medium text-[#14213D]/70">
                  Total Batch Settlement
                </div>
                <div className="text-xl font-bold text-[#14213D] mt-1 font-mono-tabular">
                  <AnimatedCounter value={computedTotalUsd} prefix="$" />
                </div>
                <div className="text-[11px] text-[#14213D]/65 mt-1">
                  Includes employer taxes & benefits
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#C9F2DF]/65 border border-[#14213D]/10">
                <div className="text-xs font-medium text-[#14213D]/70">
                  FX Rate Guarantee
                </div>
                <div className="text-xl font-bold text-[#14213D] mt-1 font-mono-tabular">
                  0.00% Markup
                </div>
                <div className="text-[11px] text-[#14213D]/65 mt-1">
                  Mid-market interbank lock active
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10">
                <div className="text-xs font-medium text-[#252A34]/70">
                  Direct Sample Monthly Net
                </div>
                <div className="text-xl font-bold text-[#14213D] mt-1 font-mono-tabular">
                  <AnimatedCounter value={monthlySampleTotal} prefix="$" />
                </div>
                <div className="text-[11px] text-[#252A34]/60 mt-1">
                  Across {selectedEmployees.length} key personnel below
                </div>
              </div>
            </div>

            {/* Employee Selection Table */}
            <div className="border border-[#14213D]/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#14213D]/10 flex items-center justify-between text-xs font-semibold text-[#14213D]">
                <span>Key Personnel Disbursement Preview</span>
                <span>Click row to include/exclude from batch</span>
              </div>
              <div className="divide-y divide-[#14213D]/8 max-h-60 overflow-y-auto">
                {employees.map((emp) => {
                  const checked = selectedIds.includes(emp.id);
                  const monthlyUsd = Math.round(emp.baseSalaryUsd / 12);
                  return (
                    <div
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={`px-4 py-3 flex items-center justify-between gap-3 text-sm transition-colors cursor-pointer ${
                        checked ? 'bg-white hover:bg-[#FAF9F6]' : 'bg-[#FAF9F6]/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            checked
                              ? 'bg-[#4169E1] border-[#4169E1] text-white'
                              : 'border-[#14213D]/25 bg-white'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#14213D] truncate">
                            {emp.name}
                          </div>
                          <div className="text-xs text-[#252A34]/60 truncate">
                            {emp.department} · {emp.location} · {emp.bankName} (*{emp.accountEnding})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <StatusBadge status={emp.accountStatus} />
                        <div className="text-right">
                          <div className="font-mono-tabular font-semibold text-[#14213D]">
                            ${monthlyUsd.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-[#252A34]/55 font-mono-tabular">
                            Payout in {emp.receivingCurrency}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10 text-xs text-[#252A34]/80">
              <Lock className="w-4 h-4 text-[#4169E1] shrink-0" />
              <span>
                Dual-control treasury authorization verified. Funds will be debited from Meridian segregated currency accounts with instant finality.
              </span>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="py-4 space-y-6"
          >
            {/* Progress Header */}
            <div className="p-5 rounded-xl bg-[#14213D] text-white">
              <div className="flex items-center justify-between text-xs text-white/75 mb-2">
                <span className="flex items-center gap-2 font-medium">
                  <Globe className="w-4 h-4 text-[#C9F2DF]" />
                  Executing Multi-Rail Settlement Protocol
                </span>
                <span className="font-mono-tabular font-bold text-[#C9F2DF]">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/12 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#4169E1] rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/70 font-mono-tabular">
                <span>Batch: {batchReference}</span>
                <span>Value: ${computedTotalUsd.toLocaleString()} USD</span>
              </div>
            </div>

            {/* Stage Checklist */}
            <div className="space-y-3">
              {PROCESSING_STAGES.map((stage, index) => {
                const isDone = index < activeStageIndex;
                const isCurrent = index === activeStageIndex;
                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`p-4 rounded-xl border flex items-start gap-3.5 transition-colors ${
                      isCurrent
                        ? 'bg-[#EEEAFE]/75 border-[#4169E1]/35'
                        : isDone
                        ? 'bg-[#C9F2DF]/35 border-[#0F6E46]/20'
                        : 'bg-[#FAF9F6] border-[#14213D]/8 opacity-55'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-[#0F6E46] text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#4169E1] border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#14213D]/25" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#14213D]">
                        {stage.title}
                      </div>
                      <div className="text-xs text-[#252A34]/70 mt-0.5">
                        {stage.detail}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="py-4 text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 18,
              }}
              className="w-16 h-16 rounded-2xl bg-[#C9F2DF] text-[#0F5132] border border-[#0F6E46]/20 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-9 h-9" />
            </motion.div>

            <div>
              <div className="text-xs font-semibold text-[#0F6E46] tracking-wide">
                SETTLEMENT CONFIRMED · {batchReference}
              </div>
              <h4 className="text-2xl font-bold text-[#14213D] mt-1 font-mono-tabular">
                ${computedTotalUsd.toLocaleString()} Disbursed
              </h4>
              <p className="text-sm text-[#252A34]/70 max-w-md mx-auto mt-1.5">
                All local rail payment instructions have been transmitted. Employees will receive instant payslip notifications and bank credits according to corridor settlement windows.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10">
                <div className="text-xs text-[#252A34]/60">Settlement Rails</div>
                <div className="text-sm font-bold text-[#14213D] mt-1">
                  SEPA · FPS · ACH · NIP
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10">
                <div className="text-xs text-[#252A34]/60">Recipients Credited</div>
                <div className="text-sm font-bold text-[#14213D] mt-1 font-mono-tabular">
                  {cycle.employeesCount} Employees
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#14213D]/10">
                <div className="text-xs text-[#252A34]/60">Audit Status</div>
                <div className="text-sm font-bold text-[#0F6E46] mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Ledger Reconciled
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};
