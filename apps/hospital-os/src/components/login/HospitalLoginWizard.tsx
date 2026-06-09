import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  KeyRound,
  LayoutGrid,
  MapPin,
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
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { Input } from '@/components/ui/input';
import {
  fetchBranchPortalRoles,
  verifyHospitalGate,
  type BranchPortalRole,
  type HospitalGateResponse,
  type PortalBranch,
} from '@/runtime/auth-portal';
import { getNavayuRoleDisplayLabel } from '@/lib/navayu/navayu-forms';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="w-6 h-6" />,
  doctor: <Stethoscope className="w-6 h-6" />,
  jr_doctor: <GraduationCap className="w-6 h-6" />,
  nurse: <Heart className="w-6 h-6" />,
  receptionist: <UserCheck className="w-6 h-6" />,
  lab_technician: <FlaskConical className="w-6 h-6" />,
  pharmacist: <Pill className="w-6 h-6" />,
  billing: <CreditCard className="w-6 h-6" />,
  radiologist: <ScanLine className="w-6 h-6" />,
  ot_coordinator: <Scissors className="w-6 h-6" />,
  inventory_manager: <Package className="w-6 h-6" />,
  emergency: <Siren className="w-6 h-6" />,
  hr_manager: <Users className="w-6 h-6" />,
  scheduler: <CalendarClock className="w-6 h-6" />,
  dialysis_tech: <Droplets className="w-6 h-6" />,
  crm_manager: <HeartHandshake className="w-6 h-6" />,
};

type WizardStep = 'hospital' | 'branch' | 'module' | 'staff';

const STEP_META: Record<WizardStep, { label: string; icon: React.ReactNode }> = {
  hospital: { label: 'Sign in', icon: <Building2 className="w-4 h-4" /> },
  branch: { label: 'Branch', icon: <MapPin className="w-4 h-4" /> },
  module: { label: 'Module', icon: <LayoutGrid className="w-4 h-4" /> },
  staff: { label: 'Staff', icon: <KeyRound className="w-4 h-4" /> },
};

const VISIBLE_STEPS: WizardStep[] = ['hospital', 'branch', 'module', 'staff'];

function roleIcon(role: string) {
  return ROLE_ICONS[role] ?? <LayoutGrid className="w-6 h-6" />;
}

type Props = {
  onRaiseTicket?: () => void;
};

export function HospitalLoginWizard({ onRaiseTicket }: Props) {
  const { loginWithCredentials } = useAuth();
  const { settings } = useTenantSettings();
  const navigate = useNavigate();

  const [step, setStep] = useState<WizardStep>('hospital');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [hospitalEmail, setHospitalEmail] = useState('');
  const [hospitalPassword, setHospitalPassword] = useState('');
  const [gate, setGate] = useState<HospitalGateResponse | null>(null);

  const [selectedBranch, setSelectedBranch] = useState<PortalBranch | null>(null);
  const [portalRoles, setPortalRoles] = useState<BranchPortalRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<BranchPortalRole | null>(null);

  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const activeSteps = useMemo(() => {
    if (!gate) return ['hospital'] as WizardStep[];
    if (gate.branches.length <= 1) {
      return ['hospital', 'module', 'staff'] as WizardStep[];
    }
    return VISIBLE_STEPS;
  }, [gate]);

  const stepIndex = activeSteps.indexOf(step as (typeof activeSteps)[number]);

  useEffect(() => {
    if (step !== 'module' || !selectedBranch || !gate) return;

    setLoadingRoles(true);
    void fetchBranchPortalRoles(selectedBranch.id, gate.tenantId)
      .then((roles) => {
        setPortalRoles(
          roles.map((role) => ({
            ...role,
            label: getNavayuRoleDisplayLabel(role.role, role.label),
          })),
        );
        if (roles.length === 0) {
          toast.error('No modules enabled for this branch');
        }
      })
      .catch((err) => {
        toast.error('Could not load modules', {
          description: err instanceof Error ? err.message : undefined,
        });
      })
      .finally(() => setLoadingRoles(false));
  }, [step, selectedBranch, gate]);

  const goBack = () => {
    if (step === 'hospital') return;
    if (step === 'hospital') {
      return;
    }
    if (step === 'branch') {
      setStep('hospital');
      return;
    }
    if (step === 'module') {
      setStep(gate && gate.branches.length > 1 ? 'branch' : 'hospital');
      return;
    }
    if (step === 'staff') {
      setStep('module');
    }
  };

  const handleHospitalSubmit = async () => {
    if (!hospitalEmail.trim() || !hospitalPassword) {
      toast.error('Enter hospital email and password');
      return;
    }

    setSubmitting(true);
    try {
      const result = await verifyHospitalGate(hospitalEmail, hospitalPassword);
      setGate(result);

      if (result.branches.length === 1) {
        setSelectedBranch(result.branches[0]);
        setStep('module');
      } else if (!result.canAccessAllBranches) {
        const home = result.branches.find((b) => b.id === result.userBranchId) ?? result.branches[0];
        setSelectedBranch(home);
        setStep('module');
      } else {
        setStep('branch');
      }
    } catch (err) {
      toast.error('Hospital sign-in failed', {
        description: err instanceof Error ? err.message : 'Check email and password',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBranchContinue = () => {
    if (!selectedBranch) {
      toast.error('Select a branch');
      return;
    }
    setStep('module');
  };

  const handleModuleContinue = () => {
    if (!selectedRole) {
      toast.error('Select a module to continue');
      return;
    }
    setStaffEmail('');
    setStaffPassword('');
    setStep('staff');
  };

  const handleStaffSubmit = async () => {
    if (!selectedBranch || !selectedRole) return;
    if (!staffEmail.trim() || !staffPassword) {
      toast.error('Enter your staff email and password');
      return;
    }

    setSubmitting(true);
    const ok = await loginWithCredentials(staffEmail, staffPassword, {
      branchId: selectedBranch.id,
      expectedRole: selectedRole.role,
    });
    setSubmitting(false);

    if (ok) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-center gap-2 flex-wrap">
          {activeSteps.map((s, i) => {
            const meta = STEP_META[s];
            const isActive = s === step;
            const isDone = stepIndex > i;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={`h-px w-6 ${isDone ? 'bg-primary' : 'bg-border'}`} />}
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : isDone
                        ? 'border-primary/40 text-primary/80'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {meta.icon}
                  {meta.label}
                </div>
              </div>
            );
          })}
      </div>

      <AnimatePresence mode="wait">
        {step === 'hospital' && (
          <motion.div
            key="hospital"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-md mx-auto rounded-2xl border border-zinc-200/90 bg-white/92 p-6 shadow-[0_24px_80px_rgba(24,24,27,0.08)] backdrop-blur space-y-5"
          >
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50">
                <Building2 className="w-4 h-4 text-zinc-800" />
              </div>
              <h2 className="text-xl font-semibold tracking-[-0.04em] text-zinc-950">Sign in to your workspace</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Verify the hospital account first. Branch selection opens on the next screen.
              </p>
            </div>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-zinc-600">Hospital email</span>
              <Input
                type="email"
                autoComplete="username"
                value={hospitalEmail}
                onChange={(e) => setHospitalEmail(e.target.value)}
                placeholder={`admin@${settings.branding.organizationShortName.toLowerCase()}health.in`}
                className="h-11 rounded-xl border-zinc-200 bg-white text-sm"
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-zinc-600">Password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={hospitalPassword}
                onChange={(e) => setHospitalPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && void handleHospitalSubmit()}
                className="h-11 rounded-xl border-zinc-200 bg-white text-sm"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => void handleHospitalSubmit()}
                disabled={submitting}
                className="w-full rounded-xl py-3 text-xs font-bold uppercase tracking-[0.22em] bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {submitting ? 'Verifying…' : 'Continue'}
              </button>
            </div>
            {onRaiseTicket ? (
              <button
                type="button"
                onClick={onRaiseTicket}
                className="w-full text-[11px] font-semibold text-zinc-500 hover:text-zinc-950"
              >
                Need access help?
              </button>
            ) : null}
          </motion.div>
        )}

        {step === 'branch' && gate && (
          <motion.div
            key="branch"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-950">{gate.organizationName}</p>
              <p className="text-xs text-zinc-500 mt-1">Select your hospital center</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {gate.branches.map((branch) => {
                const selected = selectedBranch?.id === branch.id;
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => setSelectedBranch(branch)}
                    className={`text-left rounded-2xl border p-5 transition-all bg-white/92 backdrop-blur shadow-[0_18px_50px_rgba(24,24,27,0.06)] ${
                      selected
                        ? 'border-zinc-950 ring-4 ring-zinc-950/5 scale-[1.01]'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-xl p-2.5 ${selected ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-950">{branch.name}</p>
                        <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider">
                          {branch.code}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="max-w-md mx-auto flex gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleBranchContinue}
                disabled={!selectedBranch}
                className="flex-[2] rounded-xl py-3 text-xs font-bold uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === 'module' && selectedBranch && (
          <motion.div
            key="module"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-950">{selectedBranch.name}</p>
              <p className="text-xs text-zinc-500 mt-1">Choose your module</p>
            </div>

            {loadingRoles ? (
              <div className="flex justify-center py-16 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {portalRoles.map((role, i) => {
                  const isSelected = selectedRole?.role === role.role;
                  return (
                    <motion.button
                      key={role.role}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedRole(role)}
                      className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all bg-white/92 shadow-[0_18px_50px_rgba(24,24,27,0.06)] ${
                        isSelected
                          ? 'border-zinc-950 ring-4 ring-zinc-950/5 scale-[1.01]'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div
                        className={`rounded-xl p-3 ${isSelected ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                      >
                        {roleIcon(role.role)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-950">{role.label}</p>
                        {role.description && (
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <div className="max-w-md mx-auto flex gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleModuleContinue}
                disabled={!selectedRole || loadingRoles}
                className="flex-[2] rounded-xl py-3 text-xs font-bold uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {step === 'staff' && selectedBranch && selectedRole && (
          <motion.div
            key="staff"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-md mx-auto rounded-2xl border border-zinc-200/90 bg-white/92 p-6 shadow-[0_24px_80px_rgba(24,24,27,0.08)] backdrop-blur space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <KeyRound className="w-4 h-4 text-zinc-700" />
              {selectedRole.label} access
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Enter your personal staff credentials for{' '}
              <span className="font-medium text-foreground">{selectedRole.label}</span> at{' '}
              <span className="font-medium text-foreground">{selectedBranch.name}</span>.
            </p>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-zinc-600">Staff email</span>
              <Input
                type="email"
                autoComplete="username"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="you@hospital.in"
                className="h-11 rounded-xl border-zinc-200 bg-white text-sm"
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-zinc-600">Password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && void handleStaffSubmit()}
                className="h-11 rounded-xl border-zinc-200 bg-white text-sm"
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleStaffSubmit()}
                disabled={submitting}
                className="flex-[2] rounded-xl py-3 text-xs font-bold uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {submitting ? 'Signing in…' : 'Enter module'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
