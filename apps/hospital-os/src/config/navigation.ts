import { 
  LayoutDashboard, Users, CalendarDays, Stethoscope, BedDouble, 
  Building2, Heart, FlaskConical, ScanLine, Pill, CreditCard,
  TrendingUp, ShieldCheck, Scissors, Package, BarChart3, Settings
} from 'lucide-react';
import { ModuleKey } from '@/types/roles';

export interface NavItem {
  key: ModuleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', group: 'Overview' },
  { key: 'patients', label: 'Patients', icon: Users, path: '/patients', group: 'Front Desk' },
  { key: 'appointments', label: 'Appointments', icon: CalendarDays, path: '/appointments', group: 'Front Desk' },
  { key: 'opd', label: 'OPD Queue', icon: Stethoscope, path: '/opd', group: 'Clinical' },
  { key: 'ipd', label: 'IPD', icon: Building2, path: '/ipd', group: 'Clinical' },
  { key: 'bed_management', label: 'Bed Management', icon: BedDouble, path: '/beds', group: 'Clinical' },
  { key: 'ot_management', label: 'OT Management', icon: Scissors, path: '/ot', group: 'Clinical' },
  { key: 'nursing', label: 'Nursing', icon: Heart, path: '/nursing', group: 'Clinical' },
  { key: 'laboratory', label: 'Laboratory', icon: FlaskConical, path: '/laboratory', group: 'Diagnostics' },
  { key: 'radiology', label: 'Radiology', icon: ScanLine, path: '/radiology', group: 'Diagnostics' },
  { key: 'pharmacy', label: 'Pharmacy', icon: Pill, path: '/pharmacy', group: 'Supply Chain' },
  { key: 'inventory', label: 'Inventory', icon: Package, path: '/inventory', group: 'Supply Chain' },
  { key: 'billing', label: 'Billing', icon: CreditCard, path: '/billing', group: 'Finance' },
  { key: 'revenue', label: 'Revenue', icon: TrendingUp, path: '/revenue', group: 'Finance' },
  { key: 'insurance', label: 'Insurance & TPA', icon: ShieldCheck, path: '/insurance', group: 'Finance' },
  { key: 'reports', label: 'Reports', icon: BarChart3, path: '/reports', group: 'Admin' },
  { key: 'settings', label: 'Settings', icon: Settings, path: '/settings', group: 'Admin' },
  { key: 'crm', label: 'CRM & Growth', icon: TrendingUp, path: '/crm', group: 'Growth' },
];
