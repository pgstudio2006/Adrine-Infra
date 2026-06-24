import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { UserRole } from '@/types/roles';
import { motion } from 'framer-motion';
import { 
  Shield, Stethoscope, Heart, UserCheck, 
  FlaskConical, Pill, CreditCard, ScanLine, Scissors, Package, Siren, Users, CalendarClock, Droplets, HeartHandshake, GraduationCap, Landmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '@/stores/hospitalStore';
import { AppSelect } from '@/components/ui/app-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { HospitalLoginWizard } from '@/components/login/HospitalLoginWizard';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import { isFullHospitalDemoEnabled } from '@/lib/platform/full-hospital-demo';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
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
  finance_manager: <Landmark className="w-6 h-6" />,
};

type TicketCategory = 'technical' | 'access' | 'billing' | 'feature_request' | 'other';
type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

interface TicketFormState {
  reporterName: string;
  contact: string;
  role: string;
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
  details: string;
}

interface SupportTicket {
  id: string;
  createdAt: string;
  reporterName: string;
  contact: string;
  role: UserRole | 'other';
  category: TicketCategory;
  priority: TicketPriority;
  summary: string;
  details: string;
  status: 'open';
}

const SUPPORT_TICKET_STORAGE_KEY = 'adrine_support_tickets';

const TICKET_CATEGORY_OPTIONS: Array<{ value: TicketCategory; label: string }> = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'access', label: 'Login / Access Problem' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

const TICKET_PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const createInitialTicketForm = (selectedRole?: UserRole | null): TicketFormState => ({
  reporterName: '',
  contact: '',
  role: selectedRole ?? '',
  category: 'technical',
  priority: 'medium',
  summary: '',
  details: '',
});

const generateTicketId = () => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(2, 12);
  const randomSegment = Math.floor(100 + Math.random() * 900);
  return `SUP-${stamp}-${randomSegment}`;
};

export default function LoginPage() {
  const { login } = useAuth();
  const platformRuntime = isPlatformRuntimeEnabled();
  const kernelUrl = import.meta.env.VITE_KERNEL_API_URL as string | undefined;
  const { patients, appointments } = useHospital();
  const { settings, getAvailableRoles, getRoleDescription, getRoleLabel } = useTenantSettings();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState<TicketFormState>(createInitialTicketForm());
  const openTicketDialog = () => setIsTicketDialogOpen(true);
  const showStandaloneModules =
    !isPlatformRuntimeEnabled() || !isNavayuTenant() || isFullHospitalDemoEnabled(settings);

  const doctorDirectory = useMemo(() => {
    const departmentMap = new Map<string, Set<string>>();

    patients.forEach((patient) => {
      if (!patient.department || !patient.assignedDoctor) {
        return;
      }
      if (!departmentMap.has(patient.department)) {
        departmentMap.set(patient.department, new Set<string>());
      }
      departmentMap.get(patient.department)?.add(patient.assignedDoctor);
    });

    appointments.forEach((appointment) => {
      if (!appointment.department || !appointment.doctor) {
        return;
      }
      if (!departmentMap.has(appointment.department)) {
        departmentMap.set(appointment.department, new Set<string>());
      }
      departmentMap.get(appointment.department)?.add(appointment.doctor);
    });

    const normalized = Array.from(departmentMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([department, doctors]) => ({
        department,
        doctors: Array.from(doctors).sort((a, b) => a.localeCompare(b)),
      }));

    return normalized;
  }, [appointments, patients]);

  const availableDoctors = useMemo(() => {
    const selected = doctorDirectory.find((entry) => entry.department === selectedDepartment);
    return selected?.doctors ?? [];
  }, [doctorDirectory, selectedDepartment]);

  useEffect(() => {
    if (selectedRole !== 'doctor') {
      setSelectedDepartment('');
      setSelectedDoctor('');
      return;
    }

    if (!selectedDepartment && doctorDirectory.length > 0) {
      setSelectedDepartment(doctorDirectory[0].department);
    }
  }, [doctorDirectory, selectedDepartment, selectedRole]);

  useEffect(() => {
    if (selectedRole !== 'doctor') {
      return;
    }

    if (availableDoctors.length === 0) {
      setSelectedDoctor('');
      return;
    }

    if (!availableDoctors.includes(selectedDoctor)) {
      setSelectedDoctor(availableDoctors[0]);
    }
  }, [availableDoctors, selectedDoctor, selectedRole]);

  const roles = getAvailableRoles();
  const doctorSelectionIncomplete = selectedRole === 'doctor' && (!selectedDepartment || !selectedDoctor);
  const useCredentialLogin = platformRuntime && Boolean(kernelUrl?.trim());

  const updateTicketForm = <K extends keyof TicketFormState>(field: K, value: TicketFormState[K]) => {
    setTicketForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleTicketDialogOpenChange = (open: boolean) => {
    setIsTicketDialogOpen(open);

    if (open) {
      if (selectedRole) {
        setTicketForm((current) => (current.role ? current : { ...current, role: selectedRole }));
      }
      return;
    }

    setTicketForm(createInitialTicketForm(selectedRole));
  };

  const handleRaiseTicket = () => {
    const reporterName = ticketForm.reporterName.trim();
    const contact = ticketForm.contact.trim();
    const summary = ticketForm.summary.trim();
    const details = ticketForm.details.trim();

    if (!reporterName || !contact || !summary || !details) {
      toast.error('Please complete all required ticket fields.');
      return;
    }

    const roleValue = roles.includes(ticketForm.role as UserRole)
      ? (ticketForm.role as UserRole)
      : 'other';

    const ticket: SupportTicket = {
      id: generateTicketId(),
      createdAt: new Date().toISOString(),
      reporterName,
      contact,
      role: roleValue,
      category: ticketForm.category,
      priority: ticketForm.priority,
      summary,
      details,
      status: 'open',
    };

    try {
      const rawTickets = localStorage.getItem(SUPPORT_TICKET_STORAGE_KEY);
      const parsedTickets: unknown = rawTickets ? JSON.parse(rawTickets) : [];
      const existingTickets = Array.isArray(parsedTickets) ? parsedTickets : [];

      localStorage.setItem(
        SUPPORT_TICKET_STORAGE_KEY,
        JSON.stringify([ticket, ...existingTickets].slice(0, 100)),
      );

      toast.success(`Ticket ${ticket.id} submitted. Our support team will contact you shortly.`);
      setIsTicketDialogOpen(false);
      setTicketForm(createInitialTicketForm(selectedRole));
    } catch {
      toast.error(`Could not submit ticket right now. Please email ${settings.branding.supportEmail}.`);
    }
  };

  const handleLogin = () => {
    if (!selectedRole) return;

    if (selectedRole === 'doctor') {
      if (!selectedDepartment || !selectedDoctor) {
        return;
      }

      login(selectedRole, selectedDoctor, { department: selectedDepartment });
    } else {
      login(selectedRole, getRoleLabel(selectedRole));
    }

    navigate('/dashboard');
  };

  const launchStandaloneModule = (module: 'lis' | 'blood-bank' | 'ris') => {
    if (module === 'ris') {
      login('radiologist', 'RIS Demo');
      navigate('/radiology');
      return;
    }
    login('lab_technician', module === 'lis' ? 'LIS Demo' : 'Blood Bank Demo');
    navigate(module === 'lis' ? '/lab/analyzers' : '/blood-bank');
  };

  return (
    <div className="min-h-screen bg-[#fbfbf9] text-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(24,24,27,0.11) 1px, transparent 1px), linear-gradient(to bottom, rgba(24,24,27,0.11) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(251,251,249,0.38)_44%,rgba(251,251,249,0.92)_78%)]" />
      <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="inline-block"
          >
            <h1 className="text-2xl md:text-3xl font-black tracking-[-0.08em] text-zinc-950 mb-2">
              {settings.branding.platformMark}
            </h1>
          </motion.div>
        </div>

        {useCredentialLogin ? (
          <HospitalLoginWizard onRaiseTicket={openTicketDialog} />
        ) : (
          <>
        {showStandaloneModules && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => launchStandaloneModule('lis')}
            className="rounded-md border border-primary/40 bg-primary/5 p-5 text-left hover:border-primary hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-sm bg-primary text-primary-foreground p-2">
                <FlaskConical className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm">Laboratory Information System (LIS)</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              8 pathology analysers — Sysmex, Transasia, Biomérieux, Dyses, BioRad. HL7 middleware demo with auto report generation.
            </p>
          </motion.button>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => launchStandaloneModule('ris')}
            className="rounded-md border border-violet-300/60 bg-violet-50/80 p-5 text-left hover:border-violet-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-sm bg-violet-600 text-white p-2">
                <ScanLine className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm">Radiology Information System (RIS)</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Imaging orders, modality worklist, PACS viewer, reporting, and radiologist queue — full diagnostics workflow.
            </p>
          </motion.button>
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => launchStandaloneModule('blood-bank')}
            className="rounded-md border border-rose-300/60 bg-rose-50/80 p-5 text-left hover:border-rose-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-sm bg-rose-600 text-white p-2">
                <Droplets className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm">Blood Bank Management</p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Donor to transfusion lifecycle — TTI testing, component inventory, cross-match, NBTC & DCA reporting.
            </p>
          </motion.button>
        </div>
        )}

        {/* Role Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {roles.map((role, i) => {
            const isSelected = selectedRole === role;
            const isDimmed = selectedRole && !isSelected;
            
            return (
              <motion.button
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setSelectedRole(role)}
                className={`
                  relative flex flex-col items-start gap-4 p-5 rounded-md border transition-all duration-500 text-left group
                  ${isSelected
                    ? 'border-primary bg-primary/5 text-foreground shadow-md scale-[1.01] z-10' 
                    : 'border-border/60 bg-card text-foreground hover:border-primary/40 hover:shadow-md'
                  }
                  ${isDimmed ? 'opacity-40 scale-[0.98] grayscale hover:opacity-80' : 'opacity-100'}
                `}
              >
                {isSelected && (
                  <div className="absolute right-5 top-5 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" />
                )}

                <div className={`rounded-sm p-3 transition-colors duration-300 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                  {ROLE_ICONS[role]}
                </div>

                <div className="pt-2">
                  <p className="font-bold text-sm tracking-tight">{getRoleLabel(role)}</p>
                  <p className={`text-[11px] mt-1.5 leading-relaxed font-medium ${
                    isSelected ? 'text-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {getRoleDescription(role)}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>

        {selectedRole === 'doctor' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto mb-10 border border-border/70 rounded-md bg-card p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">Doctor Access Scope</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Department</span>
                <AppSelect
                  value={selectedDepartment || undefined}
                  onValueChange={setSelectedDepartment}
                  options={doctorDirectory.map((entry) => ({ value: entry.department, label: entry.department }))}
                  placeholder={doctorDirectory.length === 0 ? 'No departments found' : 'Select department'}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Doctor</span>
                <AppSelect
                  value={selectedDoctor || undefined}
                  onValueChange={setSelectedDoctor}
                  options={availableDoctors.map((doctor) => ({ value: doctor, label: doctor }))}
                  placeholder={availableDoctors.length === 0 ? 'No doctors found' : 'Select doctor'}
                  disabled={!selectedDepartment}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              Doctor module data is restricted to assigned patients for this doctor and department.
            </p>
          </motion.div>
        )}

        {/* Login Action Area */}
        <div className="max-w-md mx-auto relative">
          <motion.div
            initial={false}
            animate={{ 
              opacity: selectedRole ? 1 : 0.5,
              y: selectedRole ? 0 : 10
            }}
            transition={{ duration: 0.4 }}
          >
            <button
              onClick={handleLogin}
              disabled={!selectedRole || doctorSelectionIncomplete}
              className={`
                group relative w-full overflow-hidden rounded-md py-4 font-bold tracking-widest uppercase transition-all duration-300
                ${selectedRole && !doctorSelectionIncomplete
                  ? 'bg-foreground text-background hover:shadow-2xl hover:-translate-y-1' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                }
              `}
            >
              {selectedRole && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out" />
              )}
              <span className="relative z-10 text-xs">
                {selectedRole
                  ? selectedRole === 'doctor'
                    ? doctorSelectionIncomplete
                      ? 'Select Department And Doctor'
                      : `Initialize Sequence: ${selectedDoctor}`
                    : `Initialize Sequence: ${getRoleLabel(selectedRole)}`
                  : 'Awaiting Role Selection'}
              </span>
            </button>
          </motion.div>

          <button
            type="button"
            onClick={openTicketDialog}
            className="mt-3 w-full rounded-md border border-border bg-card px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            Raise Support Ticket
          </button>
        </div>
          </>
        )}

        <Dialog open={isTicketDialogOpen} onOpenChange={handleTicketDialogOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Raise A Ticket</DialogTitle>
              <DialogDescription>
                Share the issue with our support team. You will receive your ticket ID immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Full Name *</span>
                  <Input
                    value={ticketForm.reporterName}
                    onChange={(event) => updateTicketForm('reporterName', event.target.value)}
                    placeholder="Enter your name"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Email / Phone *</span>
                  <Input
                    value={ticketForm.contact}
                    onChange={(event) => updateTicketForm('contact', event.target.value)}
                    placeholder="you@example.com or +91..."
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Role</span>
                  <AppSelect
                    value={ticketForm.role || undefined}
                    onValueChange={(value) => updateTicketForm('role', value)}
                    options={[
                      ...roles.map((role) => ({ value: role, label: getRoleLabel(role) })),
                      { value: 'other', label: 'Other / Not Sure' },
                    ]}
                    placeholder="Select role"
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Issue Type</span>
                  <AppSelect
                    value={ticketForm.category}
                    onValueChange={(value) => updateTicketForm('category', value as TicketCategory)}
                    options={TICKET_CATEGORY_OPTIONS}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Priority</span>
                  <AppSelect
                    value={ticketForm.priority}
                    onValueChange={(value) => updateTicketForm('priority', value as TicketPriority)}
                    options={TICKET_PRIORITY_OPTIONS}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  />
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Short Summary *</span>
                <Input
                  value={ticketForm.summary}
                  onChange={(event) => updateTicketForm('summary', event.target.value)}
                  placeholder="Eg. Unable to open pharmacy billing"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Describe Your Issue *</span>
                <Textarea
                  value={ticketForm.details}
                  onChange={(event) => updateTicketForm('details', event.target.value)}
                  placeholder="Explain what happened and what you expected."
                  rows={5}
                />
              </label>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => handleTicketDialogOpenChange(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRaiseTicket}
                className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
              >
                Submit Ticket
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </motion.div>
    </div>
  );
}
