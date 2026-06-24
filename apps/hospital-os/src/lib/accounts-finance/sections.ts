import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  ArrowLeftRight,
  Banknote,
  BarChart3,
  Bot,
  Building2,
  Calculator,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Landmark,
  LayoutDashboard,
  LineChart,
  Link2,
  PiggyBank,
  Receipt,
  Scale,
  Shield,
  Wallet,
} from 'lucide-react';

export type AfSectionId =
  | 'dashboard'
  | 'billing'
  | 'invoices'
  | 'payments'
  | 'receivable'
  | 'payable'
  | 'expenses'
  | 'ledger'
  | 'bank'
  | 'cash'
  | 'financial-reports'
  | 'budget'
  | 'tax'
  | 'approvals'
  | 'analytics'
  | 'audit'
  | 'ai'
  | 'integrations';

export type AfNavGroup = {
  label: string;
  items: AfSectionId[];
};

export type AfSectionDef = {
  id: AfSectionId;
  title: string;
  subtitle: string;
  path: string;
  icon: LucideIcon;
  features: string[];
  kpis: { label: string; value: string; hint?: string }[];
};

export const AF_BASE_PATH = '/accounts-finance';

export const AF_NAV_GROUPS: AfNavGroup[] = [
  { label: 'Overview', items: ['dashboard'] },
  {
    label: 'Revenue & billing',
    items: ['billing', 'invoices', 'payments', 'receivable'],
  },
  { label: 'Payables & spend', items: ['payable', 'expenses'] },
  { label: 'Accounting', items: ['ledger', 'bank', 'cash'] },
  { label: 'Planning & tax', items: ['budget', 'tax', 'financial-reports'] },
  { label: 'Governance', items: ['approvals', 'audit'] },
  { label: 'Intelligence', items: ['analytics', 'ai', 'integrations'] },
];

export const AF_SECTIONS: Record<AfSectionId, AfSectionDef> = {
  dashboard: {
    id: 'dashboard',
    title: 'Finance Dashboard',
    subtitle: 'Executive snapshot — revenue, collections, cash position, and KPIs',
    path: AF_BASE_PATH,
    icon: LayoutDashboard,
    features: [
      'Daily Revenue',
      'Monthly Revenue',
      'Outstanding Collections',
      'Cash in Hand',
      'Bank Balance',
      'Pending Payments',
      'Expense Summary',
      'Profit & Loss Snapshot',
      'Financial KPIs',
      'Collection Analytics',
    ],
    kpis: [
      { label: 'Daily revenue', value: '₹4.82L', hint: '+12% vs yesterday' },
      { label: 'Monthly revenue', value: '₹1.28Cr', hint: 'MTD' },
      { label: 'Outstanding', value: '₹8.45L', hint: '47 open bills' },
      { label: 'Cash in hand', value: '₹1.12L', hint: 'All counters' },
    ],
  },
  billing: {
    id: 'billing',
    title: 'Billing Management',
    subtitle: 'OPD, diagnostics, pharmacy, packages, discounts, and bill lifecycle',
    path: `${AF_BASE_PATH}/billing`,
    icon: Receipt,
    features: [
      'OPD Billing',
      'Consultation Billing',
      'Procedure Billing',
      'Service Billing',
      'Package Billing',
      'Laboratory Billing',
      'Radiology Billing',
      'Pharmacy Billing',
      'Miscellaneous Billing',
      'Discount Management',
      'Tax Calculation',
      'Bill Cancellation',
      'Bill Revision',
    ],
    kpis: [
      { label: 'Bills today', value: '156' },
      { label: 'Avg bill value', value: '₹3,090' },
      { label: 'Discounts applied', value: '₹42,800' },
      { label: 'Revisions', value: '7' },
    ],
  },
  invoices: {
    id: 'invoices',
    title: 'Invoice Management',
    subtitle: 'GST invoices, credit/debit notes, refunds, and searchable history',
    path: `${AF_BASE_PATH}/invoices`,
    icon: FileText,
    features: [
      'Invoice Generation',
      'GST Invoices',
      'Invoice Templates',
      'Credit Notes',
      'Debit Notes',
      'Refund Invoices',
      'Invoice History',
      'Invoice Search',
    ],
    kpis: [
      { label: 'Invoices MTD', value: '2,840' },
      { label: 'GST issued', value: '₹18.2L' },
      { label: 'Credit notes', value: '12' },
      { label: 'Pending print', value: '23' },
    ],
  },
  payments: {
    id: 'payments',
    title: 'Payment Management',
    subtitle: 'Multi-mode collections, advances, partials, and receipt tracking',
    path: `${AF_BASE_PATH}/payments`,
    icon: Wallet,
    features: [
      'Cash Payments',
      'UPI Payments',
      'Card Payments',
      'Bank Transfer',
      'Cheque Payments',
      'Split Payments',
      'Partial Payments',
      'Advance Payments',
      'Outstanding Tracking',
      'Payment Receipts',
    ],
    kpis: [
      { label: 'Collected today', value: '₹4.82L' },
      { label: 'UPI share', value: '58%' },
      { label: 'Partials', value: '14' },
      { label: 'Advances', value: '₹96K' },
    ],
  },
  receivable: {
    id: 'receivable',
    title: 'Accounts Receivable',
    subtitle: 'Patient, corporate, and TPA dues with aging and follow-up',
    path: `${AF_BASE_PATH}/receivable`,
    icon: ArrowLeftRight,
    features: [
      'Pending Bills',
      'Patient Dues',
      'Corporate Dues',
      'TPA Outstanding',
      'Aging Reports',
      'Follow-up Tracking',
      'Collection Reports',
    ],
    kpis: [
      { label: 'Total AR', value: '₹8.45L' },
      { label: '> 90 days', value: '₹1.2L' },
      { label: 'TPA pending', value: '₹3.1L' },
      { label: 'Follow-ups due', value: '18' },
    ],
  },
  payable: {
    id: 'payable',
    title: 'Accounts Payable',
    subtitle: 'Vendor bills, supplier payments, and approval queue',
    path: `${AF_BASE_PATH}/payable`,
    icon: Building2,
    features: [
      'Vendor Bills',
      'Supplier Payments',
      'Due Date Tracking',
      'Expense Payments',
      'Outstanding Vendors',
      'Payment Approvals',
    ],
    kpis: [
      { label: 'Total AP', value: '₹6.72L' },
      { label: 'Due this week', value: '₹2.1L' },
      { label: 'Vendors', value: '34' },
      { label: 'Awaiting approval', value: '9' },
    ],
  },
  expenses: {
    id: 'expenses',
    title: 'Expense Management',
    subtitle: 'Department, utility, staff, and operational spend with approvals',
    path: `${AF_BASE_PATH}/expenses`,
    icon: PiggyBank,
    features: [
      'Department Expenses',
      'Utility Expenses',
      'Staff Expenses',
      'Vendor Expenses',
      'Operational Expenses',
      'Expense Categories',
      'Expense Approvals',
      'Expense Reports',
    ],
    kpis: [
      { label: 'MTD expenses', value: '₹28.4L' },
      { label: 'Utilities', value: '₹4.2L' },
      { label: 'Pending approval', value: '₹86K' },
      { label: 'Categories', value: '24' },
    ],
  },
  ledger: {
    id: 'ledger',
    title: 'General Ledger',
    subtitle: 'Chart of accounts, journals, balances, and trial balance',
    path: `${AF_BASE_PATH}/ledger`,
    icon: Scale,
    features: [
      'Ledger Creation',
      'Chart of Accounts',
      'Journal Entries',
      'Ledger Reports',
      'Account Balances',
      'Trial Balance',
    ],
    kpis: [
      { label: 'Active accounts', value: '142' },
      { label: 'Journals MTD', value: '1,204' },
      { label: 'Unposted', value: '3' },
      { label: 'TB variance', value: '₹0' },
    ],
  },
  bank: {
    id: 'bank',
    title: 'Bank Management',
    subtitle: 'Accounts, transactions, deposits, withdrawals, and reconciliation',
    path: `${AF_BASE_PATH}/bank`,
    icon: Landmark,
    features: [
      'Bank Accounts',
      'Transaction Records',
      'Deposit Tracking',
      'Withdrawal Tracking',
      'Bank Reconciliation',
      'Statement Reports',
    ],
    kpis: [
      { label: 'Bank balance', value: '₹42.8L' },
      { label: 'Accounts', value: '4' },
      { label: 'Unreconciled', value: '17' },
      { label: 'Last rec.', value: 'Yesterday' },
    ],
  },
  cash: {
    id: 'cash',
    title: 'Cash Management',
    subtitle: 'Cash counters, shift closing, collections, and daily reconciliation',
    path: `${AF_BASE_PATH}/cash`,
    icon: Banknote,
    features: [
      'Cash Counter',
      'Shift Closing',
      'Cash Collections',
      'Cash Expenses',
      'Daily Cash Reports',
      'Cash Reconciliation',
    ],
    kpis: [
      { label: 'Counters open', value: '3' },
      { label: 'Cash in hand', value: '₹1.12L' },
      { label: 'Shifts pending', value: '1' },
      { label: 'Variance', value: '₹0' },
    ],
  },
  'financial-reports': {
    id: 'financial-reports',
    title: 'Financial Reports',
    subtitle: 'P&L, balance sheet, cash flow, and departmental statements',
    path: `${AF_BASE_PATH}/financial-reports`,
    icon: FileSpreadsheet,
    features: [
      'Profit & Loss Statement',
      'Balance Sheet',
      'Cash Flow Statement',
      'Revenue Reports',
      'Expense Reports',
      'Collection Reports',
      'Outstanding Reports',
      'Department-wise Reports',
    ],
    kpis: [
      { label: 'Net profit MTD', value: '₹18.6L' },
      { label: 'Gross margin', value: '34%' },
      { label: 'Reports generated', value: '48' },
      { label: 'Scheduled', value: '6' },
    ],
  },
  budget: {
    id: 'budget',
    title: 'Budget Management',
    subtitle: 'Department and expense budgets with variance tracking',
    path: `${AF_BASE_PATH}/budget`,
    icon: Calculator,
    features: [
      'Department Budgets',
      'Expense Budgets',
      'Budget Tracking',
      'Budget Variance Reports',
    ],
    kpis: [
      { label: 'Annual budget', value: '₹4.2Cr' },
      { label: 'Utilized', value: '68%' },
      { label: 'Over budget depts', value: '2' },
      { label: 'Variance', value: '-4.2%' },
    ],
  },
  tax: {
    id: 'tax',
    title: 'Tax Management',
    subtitle: 'GST calculation, returns, input/output tax, and compliance',
    path: `${AF_BASE_PATH}/tax`,
    icon: ClipboardCheck,
    features: [
      'GST Calculation',
      'GST Reports',
      'Tax Summary',
      'Tax Invoices',
      'Input/Output Tax Tracking',
    ],
    kpis: [
      { label: 'Output GST', value: '₹18.2L' },
      { label: 'Input GST', value: '₹9.4L' },
      { label: 'Net payable', value: '₹8.8L' },
      { label: 'Filing status', value: 'On track' },
    ],
  },
  approvals: {
    id: 'approvals',
    title: 'Approval Workflow',
    subtitle: 'Expense, payment, and financial approvals with audit trail',
    path: `${AF_BASE_PATH}/approvals`,
    icon: Shield,
    features: [
      'Expense Approval',
      'Payment Approval',
      'Financial Approval',
      'Multi-level Approvals',
      'Approval Audit Logs',
    ],
    kpis: [
      { label: 'Pending', value: '14' },
      { label: 'Approved today', value: '22' },
      { label: 'Rejected', value: '2' },
      { label: 'SLA breaches', value: '0' },
    ],
  },
  analytics: {
    id: 'analytics',
    title: 'Analytics & MIS',
    subtitle: 'Revenue trends, profitability, doctor revenue, and executive KPIs',
    path: `${AF_BASE_PATH}/analytics`,
    icon: BarChart3,
    features: [
      'Revenue Trends',
      'Collection Analytics',
      'Expense Analytics',
      'Department Profitability',
      'Doctor Revenue Analytics',
      'Financial KPIs',
      'Executive Dashboard',
    ],
    kpis: [
      { label: 'Revenue growth', value: '+14%' },
      { label: 'Collection rate', value: '92%' },
      { label: 'Top department', value: 'OPD' },
      { label: 'MIS exports', value: '12' },
    ],
  },
  audit: {
    id: 'audit',
    title: 'Audit & Compliance',
    subtitle: 'Transaction history, user activity, and financial audit reports',
    path: `${AF_BASE_PATH}/audit`,
    icon: Activity,
    features: [
      'Audit Logs',
      'Transaction History',
      'User Activity Tracking',
      'Financial Audit Reports',
      'Data Security Logs',
    ],
    kpis: [
      { label: 'Events today', value: '1,842' },
      { label: 'Flagged', value: '3' },
      { label: 'Exports', value: '5' },
      { label: 'Retention', value: '7 years' },
    ],
  },
  ai: {
    id: 'ai',
    title: 'AI Finance',
    subtitle: 'Revenue insights, forecasting, collection predictions, and briefings',
    path: `${AF_BASE_PATH}/ai`,
    icon: Bot,
    features: [
      'AI Revenue Insights',
      'AI Expense Analysis',
      'AI Financial Forecasting',
      'AI Collection Predictions',
      'AI Financial Briefing',
    ],
    kpis: [
      { label: 'Forecast accuracy', value: '94%' },
      { label: 'At-risk AR', value: '₹1.8L' },
      { label: 'Savings identified', value: '₹2.4L' },
      { label: 'Briefings', value: 'Daily' },
    ],
  },
  integrations: {
    id: 'integrations',
    title: 'Integrations',
    subtitle: 'HMS billing, pharmacy, and HR payroll connectivity',
    path: `${AF_BASE_PATH}/integrations`,
    icon: Link2,
    features: ['HMS Billing', 'Pharmacy Billing', 'HR & Payroll'],
    kpis: [
      { label: 'Connected', value: '3/3' },
      { label: 'Last sync', value: '2 min ago' },
      { label: 'Errors', value: '0' },
      { label: 'Queue', value: 'Idle' },
    ],
  },
};

export const AF_SECTION_LIST = Object.values(AF_SECTIONS);

export function resolveAfSectionId(pathname: string): AfSectionId {
  const normalized = pathname.replace(/\/$/, '') || AF_BASE_PATH;
  const match = AF_SECTION_LIST.find((s) => s.path === normalized);
  return match?.id ?? 'dashboard';
}

export const AF_ROLE_DASHBOARDS = [
  { label: 'Finance Dashboard', path: AF_BASE_PATH, icon: LayoutDashboard },
  { label: 'Cashier Dashboard', path: `${AF_BASE_PATH}/cash`, icon: Banknote },
  { label: 'Accounts Dashboard', path: `${AF_BASE_PATH}/ledger`, icon: Scale },
  { label: 'Management Dashboard', path: `${AF_BASE_PATH}/analytics`, icon: LineChart },
  { label: 'MIS Dashboard', path: `${AF_BASE_PATH}/analytics`, icon: BarChart3 },
] as const;
