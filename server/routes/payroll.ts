import { Router, Request, Response } from 'express';

export interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  employmentType: 'Full-Time' | 'Contractor';
  location: string;
  countryCode: string;
  salaryLocal: number;
  receivingCurrency: string;
  bankName: string;
  accountEnding: string;
  routingCode: string;
  kycStatus: 'verified' | 'pending';
  lastPaidDate: string;
}

const employees: EmployeeProfile[] = [
  {
    id: 'emp_1',
    name: 'Amara Okafor',
    email: 'amara@acme.global',
    role: 'Staff Systems Engineer',
    department: 'Engineering',
    employmentType: 'Full-Time',
    location: 'London, United Kingdom',
    countryCode: 'GB',
    salaryLocal: 7200,
    receivingCurrency: 'GBP',
    bankName: 'ClearBank / Monzo',
    accountEnding: '9182',
    routingCode: '40-47-84',
    kycStatus: 'verified',
    lastPaidDate: '2026-10-31',
  },
  {
    id: 'emp_2',
    name: 'Lukas Müller',
    email: 'lukas@acme.global',
    role: 'Lead Infrastructure Architect',
    department: 'Engineering',
    employmentType: 'Full-Time',
    location: 'Berlin, Germany',
    countryCode: 'DE',
    salaryLocal: 8500,
    receivingCurrency: 'EUR',
    bankName: 'Deutsche Bank',
    accountEnding: '4410',
    routingCode: 'DEUTDEDD',
    kycStatus: 'verified',
    lastPaidDate: '2026-10-31',
  },
  {
    id: 'emp_3',
    name: 'Tunde Bakare',
    email: 'tunde@acme.global',
    role: 'Senior Product Manager',
    department: 'Product',
    employmentType: 'Contractor',
    location: 'Lagos, Nigeria',
    countryCode: 'NG',
    salaryLocal: 4500000,
    receivingCurrency: 'NGN',
    bankName: 'Guaranty Trust Bank',
    accountEnding: '7829',
    routingCode: '058',
    kycStatus: 'verified',
    lastPaidDate: '2026-10-31',
  },
  {
    id: 'emp_4',
    name: 'Sophie Dubois',
    email: 'sophie@acme.global',
    role: 'Product Designer',
    department: 'Design',
    employmentType: 'Full-Time',
    location: 'Paris, France',
    countryCode: 'FR',
    salaryLocal: 6200,
    receivingCurrency: 'EUR',
    bankName: 'BNP Paribas',
    accountEnding: '1094',
    routingCode: 'BNPAFR21',
    kycStatus: 'verified',
    lastPaidDate: '2026-10-31',
  },
  {
    id: 'emp_5',
    name: 'David Vance',
    email: 'david@acme.global',
    role: 'VP Financial Operations',
    department: 'Finance',
    employmentType: 'Full-Time',
    location: 'San Francisco, USA',
    countryCode: 'US',
    salaryLocal: 12500,
    receivingCurrency: 'USD',
    bankName: 'Silicon Valley Bank / First Republic',
    accountEnding: '3021',
    routingCode: '121000358',
    kycStatus: 'verified',
    lastPaidDate: '2026-10-31',
  },
];

export const payrollRouter = Router();

payrollRouter.get('/employees', (req: Request, res: Response) => {
  return res.json({ employees });
});

payrollRouter.post('/employees', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || !data.email || !data.salaryLocal || !data.receivingCurrency) {
      return res.status(400).json({ error: 'Name, email, salary, and currency are required.' });
    }

    const newEmp: EmployeeProfile = {
      id: `emp_${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role || 'Member',
      department: data.department || 'Engineering',
      employmentType: data.employmentType || 'Full-Time',
      location: data.location || 'Remote',
      countryCode: data.countryCode || 'US',
      salaryLocal: Number(data.salaryLocal),
      receivingCurrency: data.receivingCurrency,
      bankName: data.bankName || 'Local Bank',
      accountEnding: data.accountEnding || '0000',
      routingCode: data.routingCode || 'N/A',
      kycStatus: 'verified',
      lastPaidDate: 'Never',
    };

    employees.push(newEmp);
    return res.status(201).json({ employee: newEmp });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});
