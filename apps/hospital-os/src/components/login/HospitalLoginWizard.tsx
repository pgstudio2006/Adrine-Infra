import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
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

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="w-6 h-6" />,
  doctor: <Stethoscope className="w-6 h-6" />,
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

type WizardStep = 'welcome' | 'hospital' | 'branch' | 'module' | 'staff';

const STEP_META: Record<WizardStep, { label: string; icon: React.ReactNode }> = {
  welcome: { label: 'Welcome', icon: <Shield className="w-4 h-4" /> },
  hospital: { label: 'Hospital', icon: <Building2 className="w-4 h-4" /> },
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

  const [step, setStep] = useState<WizardStep>('welcome');
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
        setPortalRoles(roles);
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
    if (step === 'welcome') return;
    if (step === 'hospital') {
      setStep('welcome');
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
      {step !== 'welcome' && (
        <div className="mb-8 flex items-center justify-center gap-2 flex-wrap">
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
      )}

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="text-center space-y-8"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground font-bold mb-3">
                {settings.branding.loginHeadline}
              </p>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Sign in with your hospital credentials, choose your center and module, then enter your staff
                account to access {settings.branding.organizationName}.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep('hospital')}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-background hover:opacity-90 transition-opacity"
            >
              Continue to sign in
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 'hospital' && (
          <motion.div
            key="hospital"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="max-w-md mx-auto border border-border/70 rounded-md bg-card p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="w-4 h-4 text-primary" />
              Hospital sign-in
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use your hospital&apos;s main access email and password. This verifies your organization before
              you choose a branch and module.
            </p>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-muted-foreground">Hospital email</span>
              <Input
                type="email"
                autoComplete="username"
                value={hospitalEmail}
                onChange={(e) => setHospitalEmail(e.target.value)}
                placeholder={`admin@${settings.branding.organizationShortName.toLowerCase()}health.in`}
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-muted-foreground">Password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={hospitalPassword}
                onChange={(e) => setHospitalPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && void handleHospitalSubmit()}
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-md border border-border py-3 text-xs font-bold uppercase tracking-widest hover:bg-muted"
              >
                <span className="inline-flex items-center gap-1 justify-center">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </span>
              </button>
              <button
                type="button"
                onClick={() => void handleHospitalSubmit()}
                disabled={submitting}
                className="flex-[2] rounded-md py-3 text-xs font-bold uppercase tracking-widest bg-foreground text-background hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Verifying…' : 'Continue'}
              </button>
            </div>
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
              <p className="text-sm font-semibold">{gate.organizationName}</p>
              <p className="text-xs text-muted-foreground mt-1">Select your hospital center</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gate.branches.map((branch) => {
                const selected = selectedBranch?.id === branch.id;
                return (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => setSelectedBranch(branch)}
                    className={`text-left rounded-md border p-5 transition-all ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                        : 'border-border/70 bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-sm p-2.5 ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{branch.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
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
                className="flex-1 rounded-md border border-border py-3 text-xs font-bold uppercase tracking-widest hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleBranchContinue}
                disabled={!selectedBranch}
                className="flex-[2] rounded-md py-3 text-xs font-bold uppercase tracking-widest bg-foreground text-background hover:opacity-90 disabled:opacity-50"
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
              <p className="text-sm font-semibold">{selectedBranch.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Choose your module</p>
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
                      className={`relative flex flex-col items-start gap-3 p-5 rounded-md border text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                          : 'border-border/60 bg-card hover:border-primary/40'
                      }`}
                    >
                      <div
                        className={`rounded-sm p-3 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}
                      >
                        {roleIcon(role.role)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{role.label}</p>
                        {role.description && (
                          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
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
                className="flex-1 rounded-md border border-border py-3 text-xs font-bold uppercase tracking-widest hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleModuleContinue}
                disabled={!selectedRole || loadingRoles}
                className="flex-[2] rounded-md py-3 text-xs font-bold uppercase tracking-widest bg-foreground text-background hover:opacity-90 disabled:opacity-50"
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
            className="max-w-md mx-auto border border-border/70 rounded-md bg-card p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <KeyRound className="w-4 h-4 text-primary" />
              {selectedRole.label} access
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your personal staff credentials for{' '}
              <span className="font-medium text-foreground">{selectedRole.label}</span> at{' '}
              <span className="font-medium text-foreground">{selectedBranch.name}</span>.
            </p>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-muted-foreground">Staff email</span>
              <Input
                type="email"
                autoComplete="username"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="you@hospital.in"
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs font-semibold text-muted-foreground">Password</span>
              <Input
                type="password"
                autoComplete="current-password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && void handleStaffSubmit()}
              />
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 rounded-md border border-border py-3 text-xs font-bold uppercase tracking-widest hover:bg-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleStaffSubmit()}
                disabled={submitting}
                className="flex-[2] rounded-md py-3 text-xs font-bold uppercase tracking-widest bg-foreground text-background hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Signing in…' : 'Enter module'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {onRaiseTicket && step === 'welcome' && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={onRaiseTicket}
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
          >
            Need help? Raise a support ticket
          </button>
        </div>
      )}
    </div>
  );
}
