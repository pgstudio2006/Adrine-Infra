import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { UserRole } from '@/types/roles';
import {
  Shield,
  Stethoscope,
  Heart,
  UserCheck,
  FlaskConical,
  Pill,
  CreditCard,
  ScanLine,
  Scissors,
  Package,
  Siren,
  Users,
  CalendarClock,
  Droplets,
  HeartHandshake,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin: <Shield className="w-5 h-5" />,
  doctor: <Stethoscope className="w-5 h-5" />,
  jr_doctor: <GraduationCap className="w-5 h-5" />,
  nurse: <Heart className="w-5 h-5" />,
  receptionist: <UserCheck className="w-5 h-5" />,
  lab_technician: <FlaskConical className="w-5 h-5" />,
  pharmacist: <Pill className="w-5 h-5" />,
  billing: <CreditCard className="w-5 h-5" />,
  radiologist: <ScanLine className="w-5 h-5" />,
  ot_coordinator: <Scissors className="w-5 h-5" />,
  inventory_manager: <Package className="w-5 h-5" />,
  emergency: <Siren className="w-5 h-5" />,
  hr_manager: <Users className="w-5 h-5" />,
  scheduler: <CalendarClock className="w-5 h-5" />,
  dialysis_tech: <Droplets className="w-5 h-5" />,
  crm_manager: <HeartHandshake className="w-5 h-5" />,
};

const SPOTLIGHT = [
  {
    id: 'lis',
    title: 'Laboratory Information System',
    desc: '8-analyser HL7 middleware · auto reports · zero manual entry',
    path: '/lab/analyzers',
    role: 'lab_technician' as UserRole,
    name: 'LIS Demo',
  },
  {
    id: 'blood',
    title: 'Blood Bank Management',
    desc: 'Donor to transfusion · TTI · NBTC compliance',
    path: '/blood-bank',
    role: 'lab_technician' as UserRole,
    name: 'Blood Bank Demo',
  },
];

export default function AdrineLoginPage() {
  const { login } = useAuth();
  const { settings, getAvailableRoles, getRoleDescription, getRoleLabel } = useTenantSettings();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const roles = getAvailableRoles();

  const enter = (role: UserRole, name: string, path?: string) => {
    login(role, name);
    navigate(path ?? '/dashboard');
  };

  const spotlightModules = useMemo(() => SPOTLIGHT, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col lg:flex-row">
      <div className="lg:w-[44%] p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 45%), radial-gradient(circle at 80% 60%, rgba(120,120,255,0.12), transparent 40%)',
          }}
        />
        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-4">Adrine · 2026</p>
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
            AI-native Hospital
            <br />
            Operating System
          </h1>
          <p className="mt-5 text-sm text-white/60 max-w-md leading-relaxed">
            One platform for clinical, operational, and financial workflows — designed for how hospitals
            actually run in 2026.
          </p>
        </div>
        <div className="relative z-10 space-y-3 mt-12 lg:mt-0">
          {spotlightModules.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => enter(m.role, m.name, m.path)}
              className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-colors group"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{m.title}</p>
                  <p className="text-xs text-white/50 mt-1">{m.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
        <p className="relative z-10 text-[10px] text-white/30 mt-8">{settings.branding.platformName}</p>
      </div>

      <div className="flex-1 bg-[#fafaf8] text-foreground p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Select workspace
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((role, i) => {
              const selected = selectedRole === role;
              return (
                <motion.button
                  key={role}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    'text-left rounded-xl border p-4 transition-all',
                    selected
                      ? 'border-foreground bg-white shadow-md ring-1 ring-foreground/10'
                      : 'border-border/80 bg-white hover:border-foreground/30',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'rounded-lg p-2.5',
                        selected ? 'bg-foreground text-background' : 'bg-muted text-foreground',
                      )}
                    >
                      {ROLE_ICONS[role]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{getRoleLabel(role)}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                        {getRoleDescription(role)}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 h-11"
              disabled={!selectedRole}
              onClick={() => selectedRole && enter(selectedRole, getRoleLabel(selectedRole))}
            >
              Enter workspace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
