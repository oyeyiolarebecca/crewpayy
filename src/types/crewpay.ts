export type UserRole = 'company' | 'employee' | 'admin';

export type NavSectionId =
  // Company navigation
  | 'company_dashboard'
  | 'company_payroll'
  | 'company_employees'
  | 'company_approvals'
  | 'company_treasury'
  // Employee navigation
  | 'employee_overview'
  | 'employee_payslips'
  | 'employee_accounts'
  | 'employee_expenses'
  // Admin navigation
  | 'admin_overview'
  | 'admin_organisations'
  | 'admin_compliance';

export interface Organisation {
  id: string;
  name: string;
  region: string;
  baseCurrency: string;
  employeesCount: number;
  taxEntityId: string;
  kybStatus: 'verified' | 'review';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: 'Engineering' | 'Product' | 'Finance & Ops' | 'Growth' | 'Design';
  employmentType: 'Full-Time' | 'Contractor';
  location: string;
  countryCode: string;
  baseSalaryUsd: number;
  receivingCurrency: string;
  secondaryCurrency?: string;
  primaryCurrencySplit: number; // e.g., 100 or 75
  bankName: string;
  accountEnding: string;
  routingLabel: string;
  accountStatus: 'verified' | 'pending' | 'action_required';
  paymentFrequency: 'Monthly' | 'Bi-Weekly';
  startDate: string;
  nextPayDate: string;
  avatarInitials: string;
  avatarTone: 'navy' | 'electric' | 'lavender' | 'mint' | 'peach';
}

export type TransactionStatus = 'completed' | 'processing' | 'pending_approval' | 'failed';

export interface Transaction {
  id: string;
  reference: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: 'Payroll' | 'Bonus' | 'Expense Reimbursement' | 'Contractor Invoice';
  amountLocal: number;
  currency: string;
  amountUsd: number;
  fxRate: number;
  status: TransactionStatus;
  date: string;
  settlementRail: 'SEPA Instant' | 'Faster Payments' | 'ACH Same-Day' | 'SWIFT gpi' | 'NIP Local Rail';
}

export interface ApprovalItem {
  id: string;
  title: string;
  requesterName: string;
  requesterRole: string;
  department: string;
  category: 'Off-Cycle Payroll' | 'Salary Adjustment' | 'Expense Claim' | 'New Bank Account';
  amountLocal: number;
  currency: string;
  amountUsd: number;
  submittedAt: string;
  urgency: 'standard' | 'high';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface MonthlySpending {
  month: string;
  fullMonth: string;
  basePayroll: number;
  bonusesAndCommissions: number;
  taxesAndContributions: number;
  totalUsd: number;
  headcount: number;
}

export interface CurrencyAllocation {
  code: string;
  name: string;
  symbol: string;
  corridor: string;
  percentage: number;
  monthlyVolumeUsd: number;
  walletBalanceLocal: number;
  fxRateToUsd: number; // 1 USD = X Local
  tone: 'electric' | 'navy' | 'mint' | 'peach' | 'lavender';
}

export interface UpcomingPayrollCycle {
  id: string;
  cycleName: string;
  periodLabel: string;
  payDate: string;
  cutoffDate: string;
  employeesCount: number;
  estimatedTotalUsd: number;
  currenciesCount: number;
  status: 'ready' | 'completed' | 'funding_required';
  readinessPercent: number;
}

export interface EmployeePayslip {
  id: string;
  periodLabel: string;
  payDate: string;
  grossUsd: number;
  taxWithheldUsd: number;
  pensionContributionUsd: number;
  netUsd: number;
  receivingCurrency: string;
  fxRateUsed: number;
  netReceivedLocal: number;
  status: 'paid' | 'processing' | 'scheduled';
  referenceCode: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  entityName: string;
  corridor: string;
  status: 'verified' | 'flagged' | 'completed';
  amountUsd?: number;
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  variant: 'success' | 'info' | 'warning' | 'error';
}
