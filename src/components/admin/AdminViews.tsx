import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  AdminAuditLog,
  Employee,
  NavSectionId,
  Organisation,
} from '../../types/crewpay';
import {
  Button,
  Card,
  StatusBadge,
  InputField,
  AnimatedCounter,
} from '../ui/DesignSystem';

interface AdminViewsProps {
  activeSection: NavSectionId;
  organisations: Organisation[];
  employees: Employee[];
  auditLogs: AdminAuditLog[];
  onVerifyEmployeeBank: (empId: string) => void;
  onResolveAuditFlag: (logId: string) => void;
}

export const AdminViews: React.FC<AdminViewsProps> = ({
  activeSection,
  organisations,
  employees,
  auditLogs,
  onVerifyEmployeeBank,
  onResolveAuditFlag,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [auditSearch, setAuditSearch] = useState('');

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
            Monthly Clearing Volume
          </div>
          <div className="text-3xl font-bold text-[#14213D] mt-2 font-mono-tabular">
            <AnimatedCounter value={2640800} prefix="$" />
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

      {/* 3. BENEFICIARY ACCOUNT KYC VERIFICATION QUEUE */}
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

      {/* 4. SYSTEM COMPLIANCE & GOVERNANCE AUDIT LOGS */}
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
    </motion.div>
  );
};
