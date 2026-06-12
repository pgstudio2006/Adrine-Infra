/**
 * Adrine 2026 login — workspace entry for the redesigned Hospital OS.
 *
 * Split composition: brand/ops statement (left) + role workspace grid and
 * standalone module spotlights (right). Credential wizard takes over when
 * the platform kernel is configured; role-picker only on demo builds.
 *
 * Navayu tenants never see this screen (gated in LoginPage.tsx).
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Droplets,
  FlaskConical,
  Shield,
  Stethoscope,
  Heart,
  UserCheck,
  Pill,
  CreditCard,
  ScanLine,
  Scissors,
  Package,
  Siren,
  Users,
  CalendarClock,
  HeartHandshake,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHospital } from '@/stores/hospitalStore';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { HospitalLoginWizard } from '@/components/login/HospitalLoginWizard';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/roles';
import { cn } from '@/lib/utils';

const ROLE_ICONS: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  doctor: Stethoscope,
  jr_doctor: GraduationCap,
  nurse: Heart,
  receptionist: UserCheck,
  lab_technician: FlaskConical,
  pharmacist: Pill,
  billing: CreditCard,
  radiologist: ScanLine,
  ot_coordinator: Scissors,
  inventory_manager: Package,
  emergency: Siren,
  hr_manager: Users,
  scheduler: CalendarClock,
  dialysis_tech: Droplets,
  crm_manager: HeartHandshake,
};

export default function AdrineLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { patients, appointments } = useHospital();
  const { settings, getAvailableRoles, getRoleLabel, getRoleDescription } = useTenantSettings();

  const platformRuntime = isPlatformRuntimeEnabled();
  const kernelUrl = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
  const useCredentialLogin = platformRuntime && Boolean(kernelUrl?.trim());

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const doctorDirectory = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const p of patients) {
      if (p.department && p.assignedDoctor) {
        if (!map.has(p.department)) map.set(p.department, new Set());
        map.get(p.department)!.add(p.assignedDoctor);
      }
    }
    for (const a of appointments) {
      if (a.department && a.doctor) {
        if (!map.has(a.department)) map.set(a.department, new Set());
        map.get(a.department)!.add(a.doctor);
      }
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([department, doctors]) => ({
        department,
        doctors: Array.from(doctors).sort(),
      }));
  }, [patients, appointments]);

  const availableDoctors =
    doctorDirectory.find((d) => d.department === selectedDepartment)?.doctors ?? [];

  useEffect(() => {
    if (selectedRole !== 'doctor') {
      setSelectedDepartment('');
      setSelectedDoctor('');
      return;
    }
    if (!selectedDepartment && doctorDirectory.length > 0) {
      setSelectedDepartment(doctorDirectory[0].department);
    }
  }, [selectedRole, selectedDepartment, doctorDirectory]);

  useEffect(() => {
    if (selectedRole !== 'doctor') return;
    if (availableDoctors.length === 0) {
      setSelectedDoctor('');
    } else if (!availableDoctors.includes(selectedDoctor)) {
      setSelectedDoctor(availableDoctors[0]);
    }
  }, [selectedRole, availableDoctors, selectedDoctor]);

  if (useCredentialLogin) {
    return <HospitalLoginWizard />;
  }

  const roles = getAvailableRoles();
  const doctorIncomplete = selectedRole === 'doctor' && (!selectedDepartment || !selectedDoctor);

  const enter = () => {
    if (!selectedRole || doctorIncomplete) return;
    if (selectedRole === 'doctor') {
      login(selectedRole, selectedDoctor, { department: selectedDepartment });
    } else {
      login(selectedRole, getRoleLabel(selectedRole));
    }
    navigate('/dashboard');
  };

  const launchModule = (module: 'lis' | 'blood-bank') => {
    login('lab_technician', module === 'lis' ? 'LIS Demo' : 'Blood Bank Demo');
    navigate(module === 'lis' ? '/lab/analyzers' : '/blood-bank');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left — brand statement */}
      <div className="lg:w-[42%] xl:w-[38%] bg-foreground text-background flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-lg bg-background text-foreground flex items-center justify-center text-base font-bold">
              A
            </span>
            <div>
              <p className="font-semibold tracking-tight text-lg leading-none">
                {settings.branding.hospitalName || 'Adrine Hospital OS'}
              </p>
              <p className="text-[11px] opacity-60 mt-0.5">Operating system for care</p>
            </div>
          </div>
        </div>

        <div className="relative my-12 lg:my-0">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.12]"
          >
            Every department.
            <br />
            One operating system.
            <br />
            <span className="opacity-50">AI on every workflow.</span>
          </motion.h1>
          <p className="text-sm opacity-60 mt-5 max-w-sm leading-relaxed">
            OPD to discharge, lab to blood bank, billing to command center —
            governed transitions, auditable intelligence, zero workflow dead ends.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-px bg-background/15 rounded-lg overflow-hidden text-center">
          {[
            { v: '16', l: 'Role workspaces' },
            { v: '200+', l: 'Module screens' },
            { v: '8', l: 'LIS analysers' },
          ].map((s) => (
            <div key={s.l} className="bg-foreground py-3.5">
              <p className="text-xl font-semibold tabular-nums">{s.v}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] opacity-50 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — role grid + spotlights */}
      <div className="flex-1 flex flex-col p-6 lg:p-10 xl:p-14 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto my-auto space-y-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Secure demo environment
            </p>
            <h2 className="text-xl font-semibold tracking-tight mt-1">Choose your workspace</h2>
          </div>

          {/* Spotlight modules */}
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => launchModule('lis')}
              className="group rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-foreground/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <FlaskConical className="h-5 w-5" strokeWidth={1.75} />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="font-semibold text-[14px] mt-3">LIS · Machine integration</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                8 analysers · HL7 middleware · auto reports
              </p>
            </button>
            <button
              onClick={() => launchModule('blood-bank')}
              className="group rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-foreground/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Droplets className="h-5 w-5 text-destructive" strokeWidth={1.75} />
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="font-semibold text-[14px] mt-3">Blood Bank</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Donor to transfusion · NBTC compliance
              </p>
            </button>
          </div>

          {/* Role grid */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2.5">
              Role workspaces
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {roles.map((role, i) => {
                const Icon = ROLE_ICONS[role];
                const active = selectedRole === role;
                return (
                  <motion.button
                    key={role}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-all',
                      active
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-border bg-card hover:border-foreground/40',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <p className="text-[12.5px] font-medium mt-2 leading-tight">
                      {getRoleLabel(role)}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Doctor sub-selection */}
          {selectedRole === 'doctor' && doctorDirectory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid sm:grid-cols-2 gap-3"
            >
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Department</p>
                <AppSelect
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  options={doctorDirectory.map((d) => ({
                    value: d.department,
                    label: d.department,
                  }))}
                  placeholder="Select department"
                />
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Doctor</p>
                <AppSelect
                  value={selectedDoctor}
                  onValueChange={setSelectedDoctor}
                  options={availableDoctors.map((d) => ({ value: d, label: d }))}
                  placeholder="Select doctor"
                />
              </div>
            </motion.div>
          )}

          {/* Selected role description + enter */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
            <div className="min-w-0">
              {selectedRole ? (
                <>
                  <p className="text-[13px] font-medium">{getRoleLabel(selectedRole)}</p>
                  <p className="text-[11.5px] text-muted-foreground truncate">
                    {getRoleDescription(selectedRole)}
                  </p>
                </>
              ) : (
                <p className="text-[12.5px] text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Select a workspace to continue
                </p>
              )}
            </div>
            <Button
              onClick={enter}
              disabled={!selectedRole || doctorIncomplete}
              className="gap-1.5 shrink-0"
            >
              Enter workspace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
