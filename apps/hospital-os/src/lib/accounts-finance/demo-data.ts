import type { AfSectionId } from './sections';

export type AfTableRow = {
  id: string;
  name: string;
  category: string;
  amount: string;
  status: string;
  date: string;
  owner?: string;
};

function rowsForFeature(feature: string, section: AfSectionId): AfTableRow[] {
  const base = feature.slice(0, 3).toUpperCase();
  return [
    {
      id: `${base}-001`,
      name: `${feature} — sample record A`,
      category: section,
      amount: '₹12,400',
      status: 'Active',
      date: '17 Jun 2026',
      owner: 'Finance Team',
    },
    {
      id: `${base}-002`,
      name: `${feature} — sample record B`,
      category: section,
      amount: '₹8,750',
      status: 'Pending',
      date: '16 Jun 2026',
      owner: 'Accounts',
    },
    {
      id: `${base}-003`,
      name: `${feature} — sample record C`,
      category: section,
      amount: '₹24,100',
      status: 'Completed',
      date: '15 Jun 2026',
      owner: 'Cashier',
    },
  ];
}

export function getAfFeatureRows(section: AfSectionId, feature: string): AfTableRow[] {
  return rowsForFeature(feature, section);
}

export const AF_DASHBOARD_CHART = [
  { day: 'Mon', revenue: 420000, collections: 380000, expenses: 120000 },
  { day: 'Tue', revenue: 445000, collections: 410000, expenses: 118000 },
  { day: 'Wed', revenue: 468000, collections: 430000, expenses: 125000 },
  { day: 'Thu', revenue: 452000, collections: 418000, expenses: 122000 },
  { day: 'Fri', revenue: 482000, collections: 455000, expenses: 130000 },
  { day: 'Sat', revenue: 398000, collections: 372000, expenses: 98000 },
  { day: 'Sun', revenue: 310000, collections: 295000, expenses: 76000 },
];

export const AF_RECENT_ACTIVITY = [
  { id: 'ACT-901', text: 'UPI payment ₹1,500 — Ravi Sharma (OPD)', time: '10 min ago' },
  { id: 'ACT-900', text: 'GST invoice INV-28401 generated', time: '25 min ago' },
  { id: 'ACT-899', text: 'Vendor payment ₹42,000 — MedSupply Co.', time: '1 hr ago' },
  { id: 'ACT-898', text: 'Cash shift closed — Counter 2 (₹0 variance)', time: '2 hr ago' },
  { id: 'ACT-897', text: 'Journal JE-4402 posted — Pharmacy revenue', time: '3 hr ago' },
];

export const AF_AGING_BUCKETS = [
  { bucket: '0–30 days', amount: 420000, pct: 50 },
  { bucket: '31–60 days', amount: 210000, pct: 25 },
  { bucket: '61–90 days', amount: 125000, pct: 15 },
  { bucket: '> 90 days', amount: 90000, pct: 10 },
];
