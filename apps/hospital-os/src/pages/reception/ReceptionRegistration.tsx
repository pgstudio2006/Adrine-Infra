import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHospital } from '@/stores/hospitalStore';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';
import { RegistrationJourneyType } from '@/config/tenantSettings';
import {
  Search, UserPlus, Phone, CreditCard, Shield, ChevronRight, X, Check, User, FileText,
  AlertTriangle, Upload, Heart, MapPin, Camera, Scale, Merge, GitMerge,
  Building2, BadgeCheck, Globe, Eye, History, Clock, Copy, Link2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppSelect } from '@/components/ui/app-select';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { InlinePlatformError } from '@/components/opd/InlinePlatformError';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  NavayuRegistrationFields,
  createDefaultNavayuRegistrationState,
  toNavayuRegistrationMetadata,
  type NavayuRegistrationFormState,
} from '@/components/navayu/NavayuRegistrationFields';
import {
  buildNavayuRegistrationNotes,
  isNavayuTenant,
  NAVAYU_CLINICAL_DEPARTMENTS,
  saveNavayuVisitMetadata,
  savePatientPhone,
} from '@/lib/navayu/navayu-forms';
import {
  getClinicalDoctorsForDepartment,
  getDefaultAssignedDoctor,
} from '@/lib/opd/branch-clinical-roster';

// ── Types ──
interface Patient {
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  abhaId?: string;
  aadhaar?: string;
  registeredOn: string;
  lastVisit?: string;
  lastDoctor?: string;
  patientType: 'OPD' | 'IPD' | 'Emergency' | 'Maternity' | 'Newborn' | 'ICU' | 'Surgery' | 'Dialysis' | 'Trauma';
  category: 'general' | 'corporate' | 'insurance' | 'government' | 'vip';
  bloodGroup?: string;
  referralSource?: string;
  pendingBills?: number;
  activeAdmission?: boolean;
  photo?: string;
  branch: string;
}

// Patient list comes from useHospital().patients via the platform sync hook below.
// Empty placeholder retained only so the unused `Patient` type stays referenced.
const existingPatients: Patient[] = [];
void existingPatients;

// Duplicate candidates would come from a platform de-dupe service; empty until wired.
const duplicateCandidates: Array<{ uhid1: string; uhid2: string; name: string; phone1: string; phone2: string; matchScore: number }> = [];

const STEPS = [
  { label: 'Patient Info', icon: User },
  { label: 'Contact & Address', icon: MapPin },
  { label: 'Category & Schemes', icon: Building2 },
  { label: 'Medical Info', icon: Heart },
  { label: 'ID & Insurance', icon: Shield },
  { label: 'Consent & MLC', icon: Scale },
  { label: 'Review & Confirm', icon: FileText },
];

const BRANCHES = ['Main Hospital', 'City Branch', 'North Wing', 'South Campus'];

const categoryConfig: Record<string, { label: string; color: string }> = {
  general: { label: 'General', color: 'bg-muted text-muted-foreground' },
  corporate: { label: 'Corporate', color: 'bg-info/10 text-info' },
  insurance: { label: 'Insurance', color: 'bg-primary/10 text-primary' },
  government: { label: 'Govt Scheme', color: 'bg-success/10 text-success' },
  vip: { label: 'VIP', color: 'bg-warning/10 text-warning' },
};

// Validation helpers
const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);
const validateAadhaar = (aadhaar: string) => /^\d{4}\s?\d{4}\s?\d{4}$/.test(aadhaar.replace(/\s/g, ''));
const validateABHA = (abha: string) => /^\d{2}-\d{4}-\d{4}-\d{4}$/.test(abha);

function patientIntakeUrl(visitId: string): string {
  const base =
    (import.meta.env.VITE_PATIENT_APP_URL as string | undefined) ??
    (import.meta.env.PROD ? 'https://book.adrine.in' : 'http://localhost:3101');
  return `${base.replace(/\/$/, '')}/intake?visitId=${encodeURIComponent(visitId)}`;
}

export default function ReceptionRegistration() {
  const { patients: storePatients, startFrontDeskVisit, createEmergencyCase, refreshPatientsFromPlatform, backfillPlatformPatientId, updatePatient } = useHospital();
  const { settings } = useTenantSettings();
  const navayuMode = isNavayuTenant();
  const defaultPatientType = settings.registration.patientTypes[0]?.label ?? 'OPD';
  const [mode, setMode] = useState<'list' | 'new' | 'emergency' | 'merge' | 'abha-lookup'>('list');
  const [registrationTab, setRegistrationTab] = useState<'full' | 'walkin'>('full');
  const [platformError, setPlatformError] = useState<string | null>(null);
  useClinicalPlatformListSync({ patients: true, queue: true, appointments: false, departmentWorklists: false, ipd: false });
  const [search, setSearch] = useState('');
  const [step, setStep] = useState(0);
  const [searchBy, setSearchBy] = useState<'all' | 'uhid' | 'phone' | 'name' | 'aadhaar' | 'abha'>('all');
  const [selectedBranch, setSelectedBranch] = useState('Main Hospital');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [allowDuplicateRegistration, setAllowDuplicateRegistration] = useState(false);
  const [editingUhid, setEditingUhid] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<null | {
    patientName: string;
    uhid: string;
    appointmentId: string | null;
    tokenNo: number | null;
    invoiceId: string | null;
    admissionId: string | null;
    platformOpdVisitId?: string | null;
  }>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dob: '', gender: 'male', nationality: 'Indian',
    phone: '', altPhone: '', email: '', address: '', city: '', state: '', pin: '',
    emergencyContact: '', emergencyPhone: '', emergencyRelation: '',
    guardianName: '', guardianPhone: '', guardianRelation: '',
    bloodGroup: '', allergies: '', chronicDiseases: '', disabilityStatus: 'none',
    patientType: defaultPatientType,
    category: 'general' as 'general' | 'corporate' | 'insurance' | 'government' | 'vip',
    // Government schemes
    govScheme: '', schemeId: '', schemeEligibility: '', authorizationNo: '',
    // Corporate / TPA
    corporateName: '', tpaProvider: '', tpaPolicyNo: '', preAuthStatus: 'none' as 'none' | 'pending' | 'approved' | 'rejected',
    // ID & Insurance
    abhaId: '', aadhaar: '', passportNo: '', govtIdType: '', govtIdNo: '',
    insuranceProvider: '', policyNo: '',
    // Referral
    referralSource: 'walk-in', referringDoctor: '', referringHospital: '', referringClinic: '',
    department: '', assignedDoctor: '',
    // Consent flags
    dataConsent: false, insuranceConsent: false, emergencyConsent: false, privacyConsent: false,
    // MLC
    isMLC: false, mlcPoliceCase: '', mlcReportingAuthority: '', mlcIncidentDescription: '',
    // Photo
    hasPhoto: false,
    photoDataUrl: '',
    // Branch
    branch: 'Main Hospital',
    documents: [] as { name: string; type: string; size: number; dataUrl: string }[],
  });
  const [navayuFields, setNavayuFields] = useState<NavayuRegistrationFormState>(createDefaultNavayuRegistrationState);
  const handleNavayuFieldsChange = useCallback((next: NavayuRegistrationFormState) => {
    setNavayuFields(next);
    if (next.hearAboutNavayu) {
      setValidationErrors((prev) => {
        if (!prev.hearAboutNavayu) return prev;
        const updated = { ...prev };
        delete updated.hearAboutNavayu;
        return updated;
      });
    }
  }, []);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const routingDepartments = navayuMode ? NAVAYU_CLINICAL_DEPARTMENTS : settings.registration.departments;

  const clinicalDoctorsForDepartment = useCallback(
    (dept: string) => getClinicalDoctorsForDepartment(dept || routingDepartments[0] || 'General Medicine'),
    [routingDepartments],
  );

  const walkInDoctorOptions = useMemo(
    () => clinicalDoctorsForDepartment(formData.department),
    [clinicalDoctorsForDepartment, formData.department],
  );

  useEffect(() => {
    if (isPlatformRuntimeEnabled()) {
      void refreshPatientsFromPlatform();
    }
  }, [refreshPatientsFromPlatform]);

  useEffect(() => {
    if (!isPlatformRuntimeEnabled() || !search.trim()) return;
    const timer = window.setTimeout(() => {
      void refreshPatientsFromPlatform(search.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, refreshPatientsFromPlatform]);

  const selectedPatientType = useMemo(
    () => settings.registration.patientTypes.find((item) => item.label === formData.patientType),
    [settings.registration.patientTypes, formData.patientType],
  );
  const selectedJourneyType: RegistrationJourneyType = selectedPatientType?.journeyType ?? 'OPD';
  const isEmergencyJourney = selectedJourneyType === 'Emergency' || selectedJourneyType === 'Trauma';
  const isAdmissionJourney = selectedJourneyType === 'IPD' || selectedJourneyType === 'ICU' || selectedJourneyType === 'Maternity' || selectedJourneyType === 'Surgery' || selectedJourneyType === 'Newborn';

  useEffect(() => {
    setFormData((current) => {
      const hasPatientType = settings.registration.patientTypes.some((item) => item.label === current.patientType);
      const nextPatientType = hasPatientType ? current.patientType : settings.registration.patientTypes[0]?.label ?? 'OPD';

      const hasDepartment = !current.department || routingDepartments.includes(current.department);
      const nextDepartment = hasDepartment ? current.department : '';

      if (nextPatientType === current.patientType && nextDepartment === current.department) {
        return current;
      }

      return {
        ...current,
        patientType: nextPatientType,
        department: nextDepartment,
      };
    });
  }, [settings.registration.patientTypes, routingDepartments]);

  // Emergency quick-form
  const [emergencyForm, setEmergencyForm] = useState({
    name: '', age: '', gender: 'male', emergencyType: '', arrivalMode: 'walk-in',
    triagePriority: 'urgent' as 'immediate' | 'urgent' | 'delayed',
    phone: '', guardianName: '', guardianPhone: '', emergencyContactName: '', emergencyContactPhone: '',
    assignedDoctor: '', notes: '', isMLC: false, mlcPoliceCase: '', mlcReportingAuthority: '',
  });

  // ABHA lookup
  const [abhaSearch, setAbhaSearch] = useState('');
  const [abhaResult, setAbhaResult] = useState<null | { name: string; dob: string; gender: string; phone: string; address: string; abhaId: string }>(null);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (['firstName', 'lastName', 'phone', 'aadhaar'].includes(field)) {
      setAllowDuplicateRegistration(false);
    }
    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handlePhotoFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Photo must be an image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        hasPhoto: true,
        photoDataUrl: typeof reader.result === 'string' ? reader.result : '',
      }));
      toast.success('Patient photo attached');
    };
    reader.readAsDataURL(file);
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  }, []);

  const openCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not available in this browser. Use Upload Photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 0);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Could not open camera');
    }
  }, []);

  const captureCameraPhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera is not ready yet');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setFormData(prev => ({ ...prev, hasPhoto: true, photoDataUrl: dataUrl }));
    toast.success('Patient photo captured');
    stopCamera();
  }, [stopCamera]);

  const handleDocumentFiles = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5 MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          documents: [
            ...prev.documents,
            {
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              dataUrl: typeof reader.result === 'string' ? reader.result : '',
            },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} document${files.length > 1 ? 's' : ''} attached`);
  };

  // Validation per step
  const validateStep = (stepIdx: number): boolean => {
    const errors: Record<string, string> = {};
    if (stepIdx === 0) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.dob) errors.dob = 'Date of birth is required';
      if (!formData.patientType.trim()) errors.patientType = 'Patient type is required';
    }
    if (stepIdx === 1) {
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
      else if (!validatePhone(formData.phone)) errors.phone = 'Invalid phone format (10 digits, starting 6-9)';
      if (formData.altPhone && !validatePhone(formData.altPhone)) errors.altPhone = 'Invalid phone format';
    }
    if (stepIdx === 3) {
      if (!formData.department.trim()) errors.department = 'Select department to route the patient';
      if (navayuMode && !navayuFields.hearAboutNavayu) {
        errors.hearAboutNavayu = 'Select how the patient heard about us';
      }
    }
    if (stepIdx === 4) {
      if (formData.aadhaar && !validateAadhaar(formData.aadhaar)) errors.aadhaar = 'Invalid Aadhaar format (12 digits)';
      if (formData.abhaId && !validateABHA(formData.abhaId)) errors.abhaId = 'Invalid ABHA format (XX-XXXX-XXXX-XXXX)';
    }
    if (stepIdx === 5) {
      if (!formData.dataConsent) errors.dataConsent = 'Data consent is required';
      if (!formData.privacyConsent) errors.privacyConsent = 'Privacy consent is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  // Duplicate detection
  const duplicateWarning = useMemo(() => {
    if (!formData.phone && !formData.aadhaar) return null;
    return storePatients.find(p =>
      (formData.phone && p.phone === formData.phone) ||
      (formData.aadhaar && formData.aadhaar.length >= 4 && p.aadhaar?.includes(formData.aadhaar.slice(-4)))
    ) || null;
  }, [formData.phone, formData.aadhaar, storePatients]);

  // Duplicate phone detection
  const duplicatePhoneWarning = useMemo(() => {
    if (!formData.phone || formData.phone.length < 10) return null;
    return storePatients.find(p => p.phone === formData.phone) || null;
  }, [formData.phone, storePatients]);

  const newUHID = `UHID-${(240000 + storePatients.length + 1).toString()}`;
  const calculatedAge = formData.dob ? Math.floor((Date.now() - new Date(formData.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const buildNavayuVisitPayload = () => {
    if (!navayuMode || !navayuFields.hearAboutNavayu) {
      return { visitMetadata: undefined, navayuNotes: undefined as string | undefined };
    }
    const metadata = toNavayuRegistrationMetadata(navayuFields);
    return {
      visitMetadata: { navayu: metadata },
      navayuNotes: buildNavayuRegistrationNotes(metadata),
    };
  };

  useEffect(() => {
    if (!demoResult?.uhid) return;
    const match = storePatients.find((p) => p.uhid === demoResult.uhid);
    if (match?.platformOpdVisitId && match.platformOpdVisitId !== demoResult.platformOpdVisitId) {
      setDemoResult((prev) =>
        prev ? { ...prev, platformOpdVisitId: match.platformOpdVisitId } : prev,
      );
    }
  }, [storePatients, demoResult?.uhid, demoResult?.platformOpdVisitId]);

  const afterNavayuRegistration = async (
    uhid: string,
    _patientName: string,
    phone: string,
    _platformPatientId?: string,
  ) => {
    savePatientPhone(uhid, phone);
    if (!navayuMode || !navayuFields.hearAboutNavayu) return;
    const metadata = toNavayuRegistrationMetadata(navayuFields);
    saveNavayuVisitMetadata(uhid, metadata);
  };

  const filtered = storePatients.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const branchMatch = p.branch === selectedBranch || selectedBranch === 'All Branches';
    if (!branchMatch) return false;
    if (searchBy === 'uhid') return p.uhid.toLowerCase().includes(q);
    if (searchBy === 'phone') return p.phone.includes(search);
    if (searchBy === 'name') return p.name.toLowerCase().includes(q);
    if (searchBy === 'aadhaar') return p.aadhaar?.includes(search) ?? false;
    if (searchBy === 'abha') return p.abhaId?.toLowerCase().includes(q) ?? false;
    return p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q) || p.phone.includes(search);
  });

  const startEditingPatient = (uhid: string) => {
    const patient = storePatients.find((item) => item.uhid === uhid);
    if (!patient) return;
    const [firstName = patient.name, ...rest] = patient.name.split(' ');
    setEditingUhid(uhid);
    setFormData(prev => ({
      ...prev,
      firstName,
      lastName: rest.join(' '),
      dob: '',
      gender: patient.gender === 'F' ? 'female' : patient.gender === 'M' ? 'male' : 'other',
      phone: patient.phone,
      patientType: patient.registrationPatientType ?? patient.patientType,
      category: patient.category,
      bloodGroup: patient.bloodGroup ?? '',
      abhaId: patient.abhaId ?? '',
      aadhaar: patient.aadhaar ?? '',
      department: patient.department ?? '',
      assignedDoctor: patient.assignedDoctor ?? '',
      allergies: patient.allergies ?? '',
      chronicDiseases: patient.chronicDiseases ?? '',
      branch: patient.branch,
      insuranceProvider: patient.insuranceProvider ?? '',
      policyNo: patient.policyNo ?? '',
      referralSource: patient.referralSource ?? 'walk-in',
      photoDataUrl: patient.photoUrl ?? '',
      hasPhoto: Boolean(patient.photoUrl),
      documents: patient.documents ?? [],
    }));
    setAllowDuplicateRegistration(true);
    setRegistrationTab('full');
    setStep(0);
    setMode('new');
  };

  const FieldError = ({ field }: { field: string }) => validationErrors[field] ? (
    <p className="text-xs text-destructive mt-1">{validationErrors[field]}</p>
  ) : null;

  // ── ABHA Lookup Mode ──
  if (mode === 'abha-lookup') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center"><Shield className="w-5 h-5 text-info" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ABHA / ABDM Lookup</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Search patient by ABHA ID or create new ABHA health account</p>
            </div>
          </div>
          <button onClick={() => setMode('list')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="w-4 h-4" /> Back</button>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search by ABHA ID</label>
              <input value={abhaSearch} onChange={e => setAbhaSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="XX-XXXX-XXXX-XXXX" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => setAbhaResult({ name: 'Rajesh Sharma', dob: '1981-05-15', gender: 'Male', phone: '9876543210', address: '12 MG Road, Delhi', abhaId: abhaSearch || '91-1234-5678-9012' })}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                Search ABDM
              </button>
              <button className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent">
                Create New ABHA
              </button>
            </div>
          </div>

          {abhaResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-success flex items-center gap-2"><BadgeCheck className="w-4 h-4" /> Patient Found in ABDM</h3>
                <span className="text-xs font-mono bg-success/10 px-2 py-0.5 rounded">{abhaResult.abhaId}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div><span className="text-muted-foreground">Name:</span> {abhaResult.name}</div>
                <div><span className="text-muted-foreground">DOB:</span> {abhaResult.dob}</div>
                <div><span className="text-muted-foreground">Gender:</span> {abhaResult.gender}</div>
                <div><span className="text-muted-foreground">Phone:</span> {abhaResult.phone}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {abhaResult.address}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setMode('new'); updateField('abhaId', abhaResult.abhaId); updateField('firstName', abhaResult.name.split(' ')[0]); updateField('lastName', abhaResult.name.split(' ').slice(1).join(' ')); updateField('phone', abhaResult.phone); }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                  Link & Register
                </button>
                <button className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent">
                  Request Health Records
                </button>
                <button className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent">
                  Health Locker Sync
                </button>
              </div>
            </motion.div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">ABDM Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Create ABHA ID', 'Link UHID ↔ ABHA', 'Health Record Consent', 'Health Locker Sync'].map(s => (
                <button key={s} className="px-3 py-3 rounded-lg border text-sm hover:bg-accent transition-colors text-center">{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Merge Workflow ──
  if (mode === 'merge') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><GitMerge className="w-5 h-5 text-warning" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Patient Merge / Resolution</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Identify and merge duplicate patient records</p>
            </div>
          </div>
          <button onClick={() => setMode('list')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="w-4 h-4" /> Back</button>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold mb-3">Potential Duplicates ({duplicateCandidates.length})</h3>
          <div className="space-y-3">
            {duplicateCandidates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No potential duplicates detected. Use manual merge below if needed.
              </p>
            )}
            {duplicateCandidates.map((d, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{d.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.matchScore > 90 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      {d.matchScore}% match
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-semibold">Record A</p>
                    <p>UHID: <span className="font-mono">{d.uhid1}</span></p>
                    <p>Phone: {d.phone1}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <p className="text-xs text-muted-foreground font-semibold">Record B</p>
                    <p>UHID: <span className="font-mono">{d.uhid2}</span></p>
                    <p>Phone: {d.phone2}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center gap-1">
                    <Merge className="w-3 h-3" /> Merge Records
                  </button>
                  <button className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-accent">Not Duplicate</button>
                  <button className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-accent">View Conflict Log</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold">Manual Merge</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">UHID to Keep (Primary)</label>
              <input className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="UHID-XXXXXX" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">UHID to Merge (Secondary)</label>
              <input className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="UHID-XXXXXX" />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Preview Merge</button>
            <button className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent">Split Records</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Emergency Registration ──
  if (mode === 'emergency') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Emergency Registration</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Fast-track · Minimal fields · UHID: <span className="font-mono font-bold">{newUHID}</span></p>
            </div>
          </div>
          <button onClick={() => setMode('list')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
        </div>

        <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Patient Name *</label>
              <input value={emergencyForm.name} onChange={e => setEmergencyForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Full name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Age *</label>
              <input value={emergencyForm.age} onChange={e => setEmergencyForm(f => ({ ...f, age: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Years" type="number" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Gender *</label>
              <div className="flex gap-2">
                {['male', 'female', 'other'].map(g => (
                  <button key={g} onClick={() => setEmergencyForm(f => ({ ...f, gender: g }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${emergencyForm.gender === g ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Patient Phone</label>
              <input value={emergencyForm.phone} onChange={e => setEmergencyForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="10-digit mobile" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Guardian Name</label>
              <input value={emergencyForm.guardianName} onChange={e => setEmergencyForm(f => ({ ...f, guardianName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Guardian / attendant" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Guardian Phone</label>
              <input value={emergencyForm.guardianPhone} onChange={e => setEmergencyForm(f => ({ ...f, guardianPhone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Guardian contact" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Emergency Contact Name</label>
              <input value={emergencyForm.emergencyContactName} onChange={e => setEmergencyForm(f => ({ ...f, emergencyContactName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Emergency contact" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Emergency Contact Phone</label>
              <input value={emergencyForm.emergencyContactPhone} onChange={e => setEmergencyForm(f => ({ ...f, emergencyContactPhone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Emergency phone" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Emergency Type *</label>
              <AppSelect
                value={emergencyForm.emergencyType}
                onValueChange={(value) => setEmergencyForm((prev) => ({ ...prev, emergencyType: value }))}
                options={[
                  { value: '', label: 'Select type' },
                  { value: 'trauma', label: 'Trauma / Accident' },
                  { value: 'cardiac', label: 'Cardiac Emergency' },
                  { value: 'respiratory', label: 'Respiratory Distress' },
                  { value: 'neurological', label: 'Neurological' },
                  { value: 'poisoning', label: 'Poisoning' },
                  { value: 'burns', label: 'Burns' },
                  { value: 'obstetric', label: 'Obstetric Emergency' },
                  { value: 'other', label: 'Other' },
                ]}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mode of Arrival</label>
              <div className="flex gap-2">
                {['ambulance', 'walk-in', 'referred'].map(m => (
                  <button key={m} onClick={() => setEmergencyForm(f => ({ ...f, arrivalMode: m }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${emergencyForm.arrivalMode === m ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Triage Priority *</label>
              <div className="flex gap-2">
                {[
                  { value: 'immediate', label: 'P1 – Immediate', color: 'bg-destructive text-destructive-foreground' },
                  { value: 'urgent', label: 'P2 – Urgent', color: 'bg-warning text-warning-foreground' },
                  { value: 'delayed', label: 'P3 – Delayed', color: 'bg-success text-success-foreground' },
                ].map(p => (
                  <button key={p.value} onClick={() => setEmergencyForm(f => ({ ...f, triagePriority: p.value as any }))}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${emergencyForm.triagePriority === p.value ? p.color : 'bg-background hover:bg-accent'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Assigned Doctor</label>
              <AppSelect
                value={emergencyForm.assignedDoctor}
                onValueChange={(value) => setEmergencyForm((prev) => ({ ...prev, assignedDoctor: value }))}
                options={[
                  { value: '', label: 'Auto-assign' },
                  ...clinicalDoctorsForDepartment('Emergency').map((doctor) => ({ value: doctor, label: doctor })),
                ]}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
          </div>

          {/* MLC Section */}
          <div className="border-t border-destructive/20 pt-4">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input type="checkbox" checked={emergencyForm.isMLC} onChange={e => setEmergencyForm(f => ({ ...f, isMLC: e.target.checked }))}
                className="rounded border-2" />
              <span className="text-sm font-semibold text-destructive">⚠ Medical Legal Case (MLC)</span>
            </label>
            {emergencyForm.isMLC && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Police Case Number</label>
                  <input value={emergencyForm.mlcPoliceCase} onChange={e => setEmergencyForm(f => ({ ...f, mlcPoliceCase: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="FIR / Case No." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Reporting Authority</label>
                  <input value={emergencyForm.mlcReportingAuthority} onChange={e => setEmergencyForm(f => ({ ...f, mlcReportingAuthority: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Police station / Authority" />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <textarea value={emergencyForm.notes} onChange={e => setEmergencyForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm" rows={2} placeholder="Brief description..." />
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={() => setMode('list')} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent">Cancel</button>
          <button onClick={() => {
            if (!emergencyForm.name.trim() || !emergencyForm.age.trim() || !emergencyForm.emergencyType.trim()) {
              toast.error('Please complete required emergency fields (name, age, type).');
              return;
            }

            const arrivalMode = emergencyForm.arrivalMode === 'ambulance'
              ? 'Ambulance'
              : emergencyForm.arrivalMode === 'referred'
                ? 'Referral'
                : 'Walk-in';

            createEmergencyCase({
              patientName: emergencyForm.name.trim(),
              age: Number(emergencyForm.age),
              gender: emergencyForm.gender,
              phone: emergencyForm.phone || undefined,
              guardianName: emergencyForm.guardianName || undefined,
              guardianPhone: emergencyForm.guardianPhone || undefined,
              emergencyContactName: emergencyForm.emergencyContactName || undefined,
              emergencyContactPhone: emergencyForm.emergencyContactPhone || undefined,
              arrivalMode,
              complaint: emergencyForm.emergencyType,
              vitals: `Priority ${emergencyForm.triagePriority.toUpperCase()} · Notes: ${emergencyForm.notes || 'None'}`,
              mlcRequired: emergencyForm.isMLC,
              mlcPoliceCase: emergencyForm.mlcPoliceCase || undefined,
              mlcReportingAuthority: emergencyForm.mlcReportingAuthority || undefined,
              mlcIncidentDescription: emergencyForm.notes || undefined,
            });

            setEmergencyForm({
              name: '',
              age: '',
              gender: 'male',
              emergencyType: '',
              arrivalMode: 'walk-in',
              triagePriority: 'urgent',
              phone: '',
              guardianName: '',
              guardianPhone: '',
              emergencyContactName: '',
              emergencyContactPhone: '',
              assignedDoctor: '',
              notes: '',
              isMLC: false,
              mlcPoliceCase: '',
              mlcReportingAuthority: '',
            });
            setMode('list');
          }}
            className="px-6 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Register & Notify Emergency Dept
          </button>
        </div>
      </div>
    );
  }

  // ── New Registration Form ──
  if (mode === 'new') {
    const handleWalkInFast = () => {
      if (!formData.firstName.trim() || !validatePhone(formData.phone)) {
        setValidationErrors({
          firstName: !formData.firstName.trim() ? 'Name required' : '',
          phone: !validatePhone(formData.phone) ? 'Valid 10-digit mobile required' : '',
          hearAboutNavayu: navayuMode && !navayuFields.hearAboutNavayu ? 'Referral source required' : '',
        });
        return;
      }
      if (navayuMode && !navayuFields.hearAboutNavayu) {
        setValidationErrors({ hearAboutNavayu: 'Select how the patient heard about us' });
        return;
      }
      const existingMatch = duplicatePhoneWarning ?? duplicateWarning;
      if (existingMatch?.uhid && !allowDuplicateRegistration) {
        toast.error('Possible duplicate patient', {
          description: 'Open the existing record, merge it, or click Continue anyway before creating another record.',
        });
        return;
      }
      setPlatformError(null);
      try {
        const patientName = `${formData.firstName} ${formData.lastName}`.trim();
        const { visitMetadata, navayuNotes } = buildNavayuVisitPayload();
        const result = startFrontDeskVisit({
          patient: {
            name: patientName,
            age: Number(formData.dob) || 30,
            gender: formData.gender === 'female' ? 'F' : formData.gender === 'male' ? 'M' : 'O',
            phone: formData.phone,
            category: formData.category,
            patientType: selectedJourneyType,
            registrationPatientType: formData.patientType,
            photoUrl: formData.photoDataUrl || undefined,
            documents: formData.documents,
            department: formData.department || routingDepartments[0] || 'Spine & MSK',
            assignedDoctor: formData.assignedDoctor || getDefaultAssignedDoctor(formData.department || routingDepartments[0]),
            branch: formData.branch,
            referralSource: navayuFields.hearAboutNavayu || formData.referralSource,
            visitMetadata,
          },
          appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          appointmentType: 'new',
          notes: navayuNotes ?? 'Walk-in fast path registration',
          visitMetadata,
          initialBillingItems: [{ description: 'OPD walk-in registration', amount: 250 }],
        });
        void afterNavayuRegistration(result.uhid, patientName, formData.phone);
        setDemoResult({ patientName, ...result });
        setMode('list');
        setRegistrationTab('full');
        setStep(0);
        setNavayuFields(createDefaultNavayuRegistrationState());
        setAllowDuplicateRegistration(false);
        navigate('/reception/queue');
      } catch (e) {
        setPlatformError(e instanceof Error ? e.message : 'Walk-in registration failed');
      }
    };

    return (
      <div className="space-y-6">
        <InlinePlatformError message={platformError} onDismiss={() => setPlatformError(null)} />

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{editingUhid ? 'Edit Patient Information' : 'New Patient Registration'}</h1>
            <p className="text-sm text-muted-foreground mt-1">UHID: <span className="font-mono font-semibold text-foreground">{editingUhid ?? newUHID}</span> · Branch: {formData.branch}</p>
          </div>
          <button onClick={() => { setMode('list'); setStep(0); setRegistrationTab('full'); setEditingUhid(null); }} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
        </div>

        <Tabs
          value={registrationTab}
          onValueChange={(v) => setRegistrationTab(v === 'walkin' ? 'walkin' : 'full')}
        >
          <TabsList>
            <TabsTrigger value="full">Full registration</TabsTrigger>
            <TabsTrigger value="walkin">Walk-in fast path</TabsTrigger>
          </TabsList>
          <TabsContent value="walkin" className="mt-4 space-y-4">
            <div className="rounded-xl border bg-card p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Minimal capture for walk-ins — registers patient, books today&apos;s slot, checks in, and issues a queue token in one step.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm"
                  placeholder="First name *"
                />
                <input
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm"
                  placeholder="Last name"
                />
                <input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="px-3 py-2 rounded-lg border bg-background text-sm"
                  placeholder="Mobile *"
                />
                <AppSelect
                  value={formData.department}
                  onValueChange={(value) => {
                    updateField('department', value);
                    if (!formData.assignedDoctor) {
                      updateField('assignedDoctor', getDefaultAssignedDoctor(value));
                    }
                  }}
                  options={(navayuMode ? routingDepartments : ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Dermatology']).map((d) => ({ value: d, label: d }))}
                  className="px-3 py-2 rounded-lg border bg-background text-sm"
                />
                <AppSelect
                  value={formData.assignedDoctor}
                  onValueChange={(value) => updateField('assignedDoctor', value)}
                  options={walkInDoctorOptions.map((d) => ({ value: d, label: d }))}
                  className="px-3 py-2 rounded-lg border bg-background text-sm sm:col-span-2"
                />
              </div>
              {navayuMode && (
                <NavayuRegistrationFields
                  value={navayuFields}
                  onChange={handleNavayuFieldsChange}
                  errors={{ hearAboutNavayu: validationErrors.hearAboutNavayu }}
                />
              )}
              <Button className="w-full sm:w-auto" onClick={handleWalkInFast}>
                Register walk-in & go to queue
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="full" className="mt-4 space-y-6">
        {/* Duplicate Warning */}
        <AnimatePresence>
          {(duplicateWarning || duplicatePhoneWarning) && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border-2 border-warning/40 bg-warning/5 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-foreground">Possible Duplicate Detected</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Patient <strong>{(duplicateWarning || duplicatePhoneWarning)!.name}</strong> ({(duplicateWarning || duplicatePhoneWarning)!.uhid}) has matching data.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      const existing = duplicatePhoneWarning ?? duplicateWarning;
                      if (existing?.uhid) {
                        setSearch(existing.uhid);
                        setSearchBy('uhid');
                        setMode('list');
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent/80"
                  >
                    View existing record
                  </button>
                  <button onClick={() => setMode('merge')} className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent/80">Merge records</button>
                  <button
                    onClick={() => {
                      setAllowDuplicateRegistration(true);
                      toast.warning('Duplicate override enabled', {
                        description: 'Reception can continue, but this will create another patient record.',
                      });
                    }}
                    className="text-xs px-2 py-1 rounded bg-accent hover:bg-accent/80"
                  >
                    Continue anyway
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stepper */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-1 flex-1 min-w-0">
                <button onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors flex-1 min-w-0 ${
                    i === step ? 'bg-primary text-primary-foreground' :
                    i < step ? 'bg-success/10 text-success cursor-pointer hover:bg-success/20' :
                    'bg-muted text-muted-foreground'
                  }`}>
                  {i < step ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Icon className="w-3.5 h-3.5 shrink-0" />}
                  <span className="hidden xl:inline truncate">{s.label}</span>
                  <span className="xl:hidden">{i + 1}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-xl border bg-card p-6">
          {/* Step 0: Patient Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><User className="w-4 h-4" /> Patient Information</h2>
              {/* Photo Capture */}
              <div className="flex items-center gap-4">
                <label className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted/30 cursor-pointer hover:bg-accent/30 transition-colors overflow-hidden">
                  {formData.photoDataUrl ? (
                    <img src={formData.photoDataUrl} alt="Patient" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-muted-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                  />
                </label>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void openCamera()}
                      className="inline-flex text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                    >
                      {formData.hasPhoto ? 'Retake photo' : 'Open camera'}
                    </button>
                    <label className="inline-flex text-xs px-3 py-1.5 rounded-lg border hover:bg-accent font-medium cursor-pointer">
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  {cameraError ? <p className="text-xs text-destructive mt-1">{cameraError}</p> : null}
                  <p className="text-xs text-muted-foreground mt-1">Patient photo for ID verification</p>
                </div>
              </div>
              {cameraOpen ? (
                <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
                  <video ref={videoRef} className="w-full max-w-sm rounded-lg bg-black" playsInline muted />
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={captureCameraPhoto}>Capture photo</Button>
                    <Button type="button" size="sm" variant="outline" onClick={stopCamera}>Cancel camera</Button>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">First Name *</label>
                  <input value={formData.firstName} onChange={e => updateField('firstName', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${validationErrors.firstName ? 'border-destructive' : ''}`} placeholder="Enter first name" />
                  <FieldError field="firstName" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Last Name *</label>
                  <input value={formData.lastName} onChange={e => updateField('lastName', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${validationErrors.lastName ? 'border-destructive' : ''}`} placeholder="Enter last name" />
                  <FieldError field="lastName" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date of Birth *</label>
                  <input type="date" value={formData.dob} onChange={e => updateField('dob', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${validationErrors.dob ? 'border-destructive' : ''}`} />
                  {calculatedAge !== null && calculatedAge >= 0 && <p className="text-xs text-muted-foreground mt-1">Age: {calculatedAge} years</p>}
                  <FieldError field="dob" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Gender *</label>
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map(g => (
                      <button key={g} onClick={() => updateField('gender', g)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.gender === g ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nationality</label>
                  <input value={formData.nationality} onChange={e => updateField('nationality', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Patient Type *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {settings.registration.patientTypes.map((typeOption) => (
                      <button
                        key={typeOption.label}
                        onClick={() => updateField('patientType', typeOption.label)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          formData.patientType === typeOption.label
                            ? typeOption.journeyType === 'Emergency' || typeOption.journeyType === 'Trauma'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-primary text-primary-foreground'
                            : 'bg-background hover:bg-accent'
                        }`}
                      >
                        {typeOption.label}
                      </button>
                    ))}
                  </div>
                  <FieldError field="patientType" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Branch</label>
                  <AppSelect
                    value={formData.branch}
                    onValueChange={(value) => updateField('branch', value)}
                    options={BRANCHES.map((branch) => ({ value: branch, label: branch }))}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
              </div>
              {!navayuMode && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-3">Referral Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Referral Source</label>
                      <AppSelect
                        value={formData.referralSource}
                        onValueChange={(value) => updateField('referralSource', value)}
                        options={[
                          { value: 'walk-in', label: 'Walk-in' },
                          { value: 'doctor-referral', label: 'Doctor Referral' },
                          { value: 'hospital-referral', label: 'Hospital Referral' },
                          { value: 'clinic-referral', label: 'Clinic Referral' },
                          { value: 'online', label: 'Online Booking' },
                          { value: 'emergency', label: 'Emergency / 108' },
                        ]}
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Referring Doctor</label>
                      <input value={formData.referringDoctor} onChange={e => updateField('referringDoctor', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Doctor name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Referring Hospital</label>
                      <input value={formData.referringHospital} onChange={e => updateField('referringHospital', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Hospital name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Referring Clinic</label>
                      <input value={formData.referringClinic} onChange={e => updateField('referringClinic', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Clinic name" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4" /> Contact & Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone Number *</label>
                  <input value={formData.phone} onChange={e => updateField('phone', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${validationErrors.phone ? 'border-destructive' : ''}`} placeholder="10-digit mobile" maxLength={10} />
                  <FieldError field="phone" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Alternate Phone</label>
                  <input value={formData.altPhone} onChange={e => updateField('altPhone', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${validationErrors.altPhone ? 'border-destructive' : ''}`} placeholder="+91" />
                  <FieldError field="altPhone" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="patient@email.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Address *</label>
                  <textarea value={formData.address} onChange={e => updateField('address', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" rows={2} placeholder="Full address" />
                </div>
                <div><label className="text-sm font-medium mb-1 block">City</label><input value={formData.city} onChange={e => updateField('city', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" /></div>
                <div>
                  <label className="text-sm font-medium mb-1 block">State</label>
                  <AppSelect
                    value={formData.state}
                    onValueChange={(value) => updateField('state', value)}
                    options={[
                      { value: '', label: 'Select' },
                      ...['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'].map((state) => ({ value: state, label: state })),
                    ]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div><label className="text-sm font-medium mb-1 block">PIN Code</label><input value={formData.pin} onChange={e => updateField('pin', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="6 digits" maxLength={6} /></div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">Guardian Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div><label className="text-sm font-medium mb-1 block">Guardian Name</label><input value={formData.guardianName} onChange={e => updateField('guardianName', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" /></div>
                  <div><label className="text-sm font-medium mb-1 block">Guardian Phone</label><input value={formData.guardianPhone} onChange={e => updateField('guardianPhone', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" /></div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Guardian Relation</label>
                    <AppSelect
                      value={formData.guardianRelation}
                      onValueChange={(value) => updateField('guardianRelation', value)}
                      options={[
                        { value: '', label: 'Select' },
                        ...['Spouse', 'Parent', 'Sibling', 'Child', 'Other'].map((relation) => ({ value: relation, label: relation })),
                      ]}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                </div>
                <h3 className="text-sm font-semibold mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="text-sm font-medium mb-1 block">Name</label><input value={formData.emergencyContact} onChange={e => updateField('emergencyContact', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" /></div>
                  <div><label className="text-sm font-medium mb-1 block">Phone</label><input value={formData.emergencyPhone} onChange={e => updateField('emergencyPhone', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" /></div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Relation</label>
                    <AppSelect
                      value={formData.emergencyRelation}
                      onValueChange={(value) => updateField('emergencyRelation', value)}
                      options={[
                        { value: '', label: 'Select' },
                        ...['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'].map((relation) => ({ value: relation, label: relation })),
                      ]}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Category & Schemes */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4" /> Patient Category & Schemes</h2>
              {/* Category Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Patient Category *</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {Object.entries(categoryConfig).map(([key, cfg]) => (
                    <button key={key} onClick={() => updateField('category', key)}
                      className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors text-center ${formData.category === key ? 'bg-primary text-primary-foreground' : `${cfg.color} hover:opacity-80`}`}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Government Scheme */}
              {formData.category === 'government' && (
                <div className="rounded-lg border border-success/30 bg-success/5 p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-success" /> Government Scheme Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Scheme *</label>
                      <AppSelect
                        value={formData.govScheme}
                        onValueChange={(value) => updateField('govScheme', value)}
                        options={[
                          { value: '', label: 'Select scheme' },
                          { value: 'ayushman', label: 'Ayushman Bharat (PMJAY)' },
                          { value: 'esi', label: 'ESI' },
                          { value: 'cghs', label: 'CGHS' },
                          { value: 'aarogyasri', label: 'Aarogyasri (Telangana)' },
                          { value: 'mahatma-jyotiba', label: 'Mahatma Jyotiba Phule (Maharashtra)' },
                          { value: 'chief-minister', label: "Chief Minister's Insurance" },
                          { value: 'other', label: 'Other State Scheme' },
                        ]}
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Scheme ID / Card No.</label>
                      <input value={formData.schemeId} onChange={e => updateField('schemeId', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Scheme card number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Eligibility Status</label>
                      <AppSelect
                        value={formData.schemeEligibility}
                        onValueChange={(value) => updateField('schemeEligibility', value)}
                        options={[
                          { value: '', label: 'Pending verification' },
                          { value: 'eligible', label: 'Eligible' },
                          { value: 'not-eligible', label: 'Not Eligible' },
                          { value: 'expired', label: 'Expired' },
                        ]}
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Authorization Number</label>
                      <input value={formData.authorizationNo} onChange={e => updateField('authorizationNo', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Pre-auth number" />
                    </div>
                  </div>
                </div>
              )}

              {/* Corporate / TPA */}
              {formData.category === 'corporate' && (
                <div className="rounded-lg border border-info/30 bg-info/5 p-4 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-info" /> Corporate / TPA Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Corporate Name *</label>
                      <input value={formData.corporateName} onChange={e => updateField('corporateName', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Company name" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">TPA Provider</label>
                      <AppSelect
                        value={formData.tpaProvider}
                        onValueChange={(value) => updateField('tpaProvider', value)}
                        options={[
                          { value: '', label: 'Select TPA' },
                          { value: 'medi-assist', label: 'Medi Assist' },
                          { value: 'paramount', label: 'Paramount Health' },
                          { value: 'heritage', label: 'Heritage Health' },
                          { value: 'vidal', label: 'Vidal Health' },
                          { value: 'raksha', label: 'Raksha TPA' },
                          { value: 'other', label: 'Other' },
                        ]}
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">TPA Policy No.</label>
                      <input value={formData.tpaPolicyNo} onChange={e => updateField('tpaPolicyNo', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Policy number" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Pre-Authorization Status</label>
                      <div className="flex gap-2">
                        {[
                          { value: 'none', label: 'None' },
                          { value: 'pending', label: 'Pending' },
                          { value: 'approved', label: 'Approved' },
                          { value: 'rejected', label: 'Rejected' },
                        ].map(s => (
                          <button key={s.value} onClick={() => updateField('preAuthStatus', s.value)}
                            className={`flex-1 px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${formData.preAuthStatus === s.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance category */}
              {formData.category === 'insurance' && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm text-muted-foreground">Insurance details will be captured in Step 5 (ID & Insurance).</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Medical Info */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><Heart className="w-4 h-4" /> Medical Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Blood Group</label>
                  <AppSelect
                    value={formData.bloodGroup}
                    onValueChange={(value) => updateField('bloodGroup', value)}
                    options={[
                      { value: '', label: 'Select' },
                      ...['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => ({ value: group, label: group })),
                    ]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Disability Status</label>
                  <AppSelect
                    value={formData.disabilityStatus}
                    onValueChange={(value) => updateField('disabilityStatus', value)}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'visual', label: 'Visual Impairment' },
                      { value: 'hearing', label: 'Hearing Impairment' },
                      { value: 'locomotor', label: 'Locomotor Disability' },
                      { value: 'intellectual', label: 'Intellectual Disability' },
                      { value: 'multiple', label: 'Multiple Disabilities' },
                    ]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Department to Route Patient *</label>
                  <AppSelect
                    value={formData.department}
                    onValueChange={(value) => updateField('department', value)}
                    options={[
                      { value: '', label: 'Select department' },
                      ...routingDepartments.map((department) => ({ value: department, label: department })),
                    ]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                  <FieldError field="department" />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium mb-1 block">Known Allergies</label>
                  <textarea value={formData.allergies} onChange={e => updateField('allergies', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" rows={2} placeholder="e.g., Penicillin, Sulfa drugs..." />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="text-sm font-medium mb-1 block">Chronic Diseases</label>
                  <textarea value={formData.chronicDiseases} onChange={e => updateField('chronicDiseases', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" rows={2} placeholder="e.g., Diabetes, Hypertension..." />
                </div>
              </div>
              {navayuMode && (
                <NavayuRegistrationFields
                  value={navayuFields}
                  onChange={handleNavayuFieldsChange}
                  errors={{ hearAboutNavayu: validationErrors.hearAboutNavayu }}
                />
              )}
            </div>
          )}

          {/* Step 4: ID & Insurance */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" /> ID & Insurance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 rounded-lg border border-dashed p-4 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-info" />
                    <span className="text-sm font-semibold">ABHA (Ayushman Bharat Health Account)</span>
                  </div>
                  <input value={formData.abhaId} onChange={e => updateField('abhaId', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${validationErrors.abhaId ? 'border-destructive' : ''}`} placeholder="XX-XXXX-XXXX-XXXX" />
                  <FieldError field="abhaId" />
                  <p className="text-xs text-muted-foreground mt-1">Link ABHA for ABDM digital health records</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Aadhaar Number</label>
                  <input value={formData.aadhaar} onChange={e => updateField('aadhaar', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${validationErrors.aadhaar ? 'border-destructive' : ''}`} placeholder="XXXX XXXX XXXX" maxLength={14} />
                  <FieldError field="aadhaar" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Passport Number</label>
                  <input value={formData.passportNo} onChange={e => updateField('passportNo', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Government ID Type</label>
                  <AppSelect
                    value={formData.govtIdType}
                    onValueChange={(value) => updateField('govtIdType', value)}
                    options={[
                      { value: '', label: 'None' },
                      { value: 'voter', label: 'Voter ID' },
                      { value: 'driving', label: 'Driving License' },
                      { value: 'ration', label: 'Ration Card' },
                      { value: 'pan', label: 'PAN Card' },
                    ]}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Government ID Number</label>
                  <input value={formData.govtIdNo} onChange={e => updateField('govtIdNo', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="ID number" />
                </div>
                <div className="sm:col-span-2 border-t pt-4 mt-2">
                  <h3 className="text-sm font-semibold mb-3">Insurance Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Insurance Provider</label>
                      <AppSelect
                        value={formData.insuranceProvider}
                        onValueChange={(value) => updateField('insuranceProvider', value)}
                        options={[
                          { value: '', label: 'None / Self-pay' },
                          { value: 'star', label: 'Star Health' },
                          { value: 'hdfc', label: 'HDFC ERGO' },
                          { value: 'icici', label: 'ICICI Lombard' },
                          { value: 'niva', label: 'Niva Bupa' },
                          { value: 'ayushman', label: 'Ayushman Bharat (PMJAY)' },
                          { value: 'cghs', label: 'CGHS' },
                          { value: 'esi', label: 'ESI' },
                          { value: 'other', label: 'Other' },
                        ]}
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Policy Number</label>
                      <input value={formData.policyNo} onChange={e => updateField('policyNo', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Policy / Card number" />
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2 border-t pt-4 mt-2">
                  <h3 className="text-sm font-semibold mb-3">Document Upload</h3>
                  <label className="block rounded-lg border-2 border-dashed p-6 text-center hover:bg-accent/30 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drop files or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">ID proofs, insurance cards, referral letters, previous records</p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleDocumentFiles(e.target.files)}
                    />
                  </label>
                  {formData.documents.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {formData.documents.map((doc, index) => (
                        <div key={`${doc.name}-${index}`} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                          <span className="truncate">{doc.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData(prev => ({
                                ...prev,
                                documents: prev.documents.filter((_, i) => i !== index),
                              }))
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Consent & MLC */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-semibold flex items-center gap-2"><Scale className="w-4 h-4" /> Consent & Legal</h2>
              {/* Consent Checkboxes */}
              <div className="space-y-3">
                <p className="text-sm font-semibold">Required Consents</p>
                {[
                  { key: 'dataConsent', label: 'Data Collection & Processing Consent', desc: 'I consent to the collection and processing of my personal and medical data', required: true },
                  { key: 'privacyConsent', label: 'Privacy Policy Consent', desc: 'I have read and agree to the privacy policy', required: true },
                  { key: 'insuranceConsent', label: 'Insurance Data Sharing Consent', desc: 'I consent to sharing my data with insurance/TPA providers' },
                  { key: 'emergencyConsent', label: 'Emergency Treatment Consent', desc: 'I consent to emergency treatment if required' },
                ].map(c => (
                  <label key={c.key} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors ${validationErrors[c.key] ? 'border-destructive' : ''}`}>
                    <input type="checkbox" checked={(formData as any)[c.key]} onChange={e => updateField(c.key, e.target.checked)}
                      className="rounded border-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{c.label} {c.required && <span className="text-destructive">*</span>}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* MLC */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={formData.isMLC} onChange={e => updateField('isMLC', e.target.checked)} className="rounded border-2" />
                  <span className="text-sm font-semibold text-destructive">⚠ Medical Legal Case (MLC)</span>
                </label>
                {formData.isMLC && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Police Case / FIR Number</label>
                        <input value={formData.mlcPoliceCase} onChange={e => updateField('mlcPoliceCase', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Reporting Authority</label>
                        <input value={formData.mlcReportingAuthority} onChange={e => updateField('mlcReportingAuthority', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Police station / Authority" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Incident Description</label>
                        <textarea value={formData.mlcIncidentDescription} onChange={e => updateField('mlcIncidentDescription', e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" rows={3} placeholder="Brief description of the incident..." />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Review & Confirm</h2>
              <div className="bg-muted/30 rounded-lg px-4 py-2 text-sm flex items-center gap-4 flex-wrap">
                <span><span className="text-muted-foreground">UHID:</span> <span className="font-mono font-bold">{newUHID}</span></span>
                <span>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span className={isEmergencyJourney ? 'text-destructive font-semibold' : 'font-semibold'}>
                    {formData.patientType}
                    {formData.patientType !== selectedJourneyType ? ` → ${selectedJourneyType}` : ''}
                  </span>
                </span>
                <span><span className="text-muted-foreground">Category:</span> <span className={`px-1.5 py-0.5 rounded-full text-xs ${categoryConfig[formData.category].color}`}>{categoryConfig[formData.category].label}</span></span>
                {formData.isMLC && <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">MLC Case</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Personal</p>
                  <p className="text-sm"><span className="text-muted-foreground">Name:</span> {formData.firstName} {formData.lastName}</p>
                  <p className="text-sm"><span className="text-muted-foreground">DOB:</span> {formData.dob || '—'} {calculatedAge !== null ? `(${calculatedAge}y)` : ''}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Gender:</span> {formData.gender}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Photo:</span> {formData.hasPhoto ? '✓ Captured' : 'Not captured'}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Documents:</span> {formData.documents.length}</p>
                </div>
                <div className="rounded-lg border p-4 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contact</p>
                  <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {formData.phone || '—'}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Email:</span> {formData.email || '—'}</p>
                  <p className="text-sm"><span className="text-muted-foreground">City:</span> {formData.city} {formData.state}</p>
                </div>
                <div className="rounded-lg border p-4 space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Medical</p>
                  <p className="text-sm"><span className="text-muted-foreground">Blood:</span> {formData.bloodGroup || '—'}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Allergies:</span> {formData.allergies || 'None'}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Dept:</span> {formData.department || '—'}</p>
                </div>
                <div className="rounded-lg border p-4 space-y-1.5 sm:col-span-2 lg:col-span-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">ID, Insurance & Consent</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <p className="text-sm"><span className="text-muted-foreground">ABHA:</span> {formData.abhaId || 'Not linked'}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Aadhaar:</span> {formData.aadhaar || '—'}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Insurance:</span> {formData.insuranceProvider || 'Self-pay'}</p>
                    <p className="text-sm"><span className="text-muted-foreground">Referral:</span> {formData.referralSource}</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {formData.dataConsent && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Data ✓</span>}
                    {formData.privacyConsent && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Privacy ✓</span>}
                    {formData.insuranceConsent && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Insurance ✓</span>}
                    {formData.emergencyConsent && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Emergency ✓</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-30 hover:bg-accent transition-colors">Back</button>
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Continue</button>
          ) : (
            <button onClick={async () => {
              const patientName = `${formData.firstName} ${formData.lastName}`.trim();
              const registrationPatientType = formData.patientType;
              const journeyPatientType = selectedJourneyType;

              if (!editingUhid && navayuMode && !navayuFields.hearAboutNavayu) {
                setValidationErrors({ hearAboutNavayu: 'Select how the patient heard about us' });
                setStep(3);
                return;
              }

              if (editingUhid) {
                updatePatient(editingUhid, {
                  name: patientName,
                  age: calculatedAge ?? 0,
                  gender: formData.gender === 'male' ? 'M' : formData.gender === 'female' ? 'F' : 'O',
                  phone: formData.phone,
                  photoUrl: formData.photoDataUrl || undefined,
                  documents: formData.documents,
                  bloodGroup: formData.bloodGroup || undefined,
                  abhaId: formData.abhaId || undefined,
                  aadhaar: formData.aadhaar || undefined,
                  category: formData.category,
                  patientType: journeyPatientType,
                  registrationPatientType,
                  department: formData.department || undefined,
                  assignedDoctor: formData.assignedDoctor || undefined,
                  allergies: formData.allergies || undefined,
                  chronicDiseases: formData.chronicDiseases || undefined,
                  branch: formData.branch,
                  insuranceProvider: formData.insuranceProvider || undefined,
                  policyNo: formData.policyNo || undefined,
                  referralSource: navayuFields.hearAboutNavayu || formData.referralSource || undefined,
                });
                setEditingUhid(null);
                setMode('list');
                setStep(0);
                return;
              }

              const existingMatch = duplicatePhoneWarning ?? duplicateWarning;
              if (existingMatch?.uhid && !allowDuplicateRegistration) {
                toast.error('Possible duplicate patient', {
                  description: `Use View existing record / Merge records, or click Continue anyway to override.`,
                });
                setStep(0);
                return;
              }
              if (existingMatch?.uhid) {
                await backfillPlatformPatientId(existingMatch.uhid);
              }

              const { visitMetadata, navayuNotes } = buildNavayuVisitPayload();
              const registrationNotes = navayuNotes
                ?? `Front-desk demo visit for ${registrationPatientType} (journey: ${journeyPatientType})`;

              const result = startFrontDeskVisit({
                patient: {
                  name: patientName,
                  age: calculatedAge ?? 0,
                  gender: formData.gender === 'male' ? 'M' : formData.gender === 'female' ? 'F' : 'O',
                  phone: formData.phone,
                  photoUrl: formData.photoDataUrl || undefined,
                  documents: formData.documents,
                  guardianName: formData.guardianName || undefined,
                  guardianRelation: formData.guardianRelation || undefined,
                  guardianPhone: formData.guardianPhone || undefined,
                  emergencyContactName: formData.emergencyContact || undefined,
                  emergencyContactPhone: formData.emergencyPhone || undefined,
                  emergencyContactRelation: formData.emergencyRelation || undefined,
                  bloodGroup: formData.bloodGroup || undefined,
                  abhaId: formData.abhaId || undefined,
                  aadhaar: formData.aadhaar || undefined,
                  category: formData.category,
                  patientType: journeyPatientType,
                  registrationPatientType,
                  department: formData.department || routingDepartments[0] || 'General Medicine',
                  assignedDoctor: formData.assignedDoctor || getDefaultAssignedDoctor(formData.department || routingDepartments[0]),
                  allergies: formData.allergies || undefined,
                  chronicDiseases: formData.chronicDiseases || undefined,
                  branch: formData.branch,
                  insuranceProvider: formData.insuranceProvider || undefined,
                  policyNo: formData.policyNo || undefined,
                  tpaProvider: formData.tpaProvider || undefined,
                  tpaPolicyNo: formData.tpaPolicyNo || undefined,
                  tpaPreAuthStatus: formData.preAuthStatus,
                  referralSource: navayuFields.hearAboutNavayu || formData.referralSource || undefined,
                  referralDoctor: formData.referringDoctor || undefined,
                  referralHospital: formData.referringHospital || undefined,
                  referralClinic: formData.referringClinic || undefined,
                  isMLC: formData.isMLC,
                  mlcPoliceCase: formData.mlcPoliceCase || undefined,
                  mlcReportingAuthority: formData.mlcReportingAuthority || undefined,
                  mlcIncidentDescription: formData.mlcIncidentDescription || undefined,
                  visitMetadata,
                },
                notes: registrationNotes,
                visitMetadata,
                initialBillingItems: [
                  {
                    description: `${registrationPatientType} registration and front-desk processing`,
                    amount: isEmergencyJourney
                      ? 500
                      : isAdmissionJourney
                        ? 350
                        : 250,
                  },
                ],
              });
              void afterNavayuRegistration(result.uhid, patientName, formData.phone);
              setDemoResult({
                patientName,
                ...result,
              });
              setNavayuFields(createDefaultNavayuRegistrationState());
              setAllowDuplicateRegistration(false);
              setMode('list'); setStep(0);
            }}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2">
              <Check className="w-4 h-4" /> {editingUhid ? 'Save Patient Info' : 'Start Live Visit'}
            </button>
          )}
        </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ── Patient List (default) ──
  return (
    <div className="space-y-6">
      <InlinePlatformError message={platformError} onDismiss={() => setPlatformError(null)} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">{storePatients.length} registered patients</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setMode('abha-lookup')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors">
            <Shield className="w-4 h-4" /> ABHA Lookup
          </button>
          <button onClick={() => setMode('merge')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors">
            <GitMerge className="w-4 h-4" /> Merge
          </button>
          <button onClick={() => setMode('emergency')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
            <AlertTriangle className="w-4 h-4" /> Emergency
          </button>
          <button
            onClick={() => { setRegistrationTab('walkin'); setMode('new'); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
          >
            <Clock className="w-4 h-4" /> Walk-in fast
          </button>
          <button onClick={() => { setRegistrationTab('full'); setMode('new'); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <UserPlus className="w-4 h-4" /> New Patient
          </button>
        </div>
      </div>

      {demoResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-success/30 bg-success/5 p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-success">Live front-desk workflow started</p>
              <h2 className="text-lg font-bold mt-1">{demoResult.patientName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                UHID {demoResult.uhid}
                {demoResult.tokenNo ? ` · Token #${demoResult.tokenNo}` : ''}
                {demoResult.invoiceId ? ` · Invoice ${demoResult.invoiceId}` : ''}
                {demoResult.admissionId ? ` · Admission ${demoResult.admissionId}` : ''}
              </p>
            </div>
            {(() => {
              const intakeVisitId =
                demoResult.platformOpdVisitId ?? demoResult.appointmentId ?? demoResult.uhid;
              const intakeUrl = patientIntakeUrl(intakeVisitId);
              const usingPlatformVisit = Boolean(demoResult.platformOpdVisitId);
              return (
                <div className="rounded-lg border border-dashed p-3 space-y-2 w-full lg:w-auto lg:min-w-[20rem]">
                  <p className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                    <Link2 className="w-3.5 h-3.5" /> Patient tablet intake
                  </p>
                  <p className="text-xs font-mono break-all text-foreground/80">{intakeUrl}</p>
                  <p className="text-xs text-muted-foreground">
                    {usingPlatformVisit
                      ? 'Platform visit linked — patient app intake will sync to domain-api.'
                      : 'Waiting for platform visit id — link copies local id until sync completes.'}
                    {' · visitId='}
                    {intakeVisitId}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(intakeUrl);
                      toast.success('Intake link copied', {
                        description: 'Paste into patient app or tablet browser.',
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-background transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy intake URL
                  </button>
                </div>
              );
            })()}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/reception/queue')}
                className="px-3 py-2 rounded-lg border text-sm font-medium hover:bg-background transition-colors"
              >
                Open Queue Screen
              </button>
              <button
                onClick={() => navigate('/reception/billing')}
                className="px-3 py-2 rounded-lg border text-sm font-medium hover:bg-background transition-colors"
              >
                Open Billing
              </button>
              <button
                onClick={() => navigate('/doctor/queue')}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Open Doctor Queue
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Multi-Branch Selector */}
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1.5">
          {['All Branches', ...BRANCHES].map(b => (
            <button key={b} onClick={() => setSelectedBranch(b)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${selectedBranch === b ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Search with filters */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' }, { key: 'uhid', label: 'UHID' }, { key: 'phone', label: 'Phone' },
            { key: 'name', label: 'Name' }, { key: 'aadhaar', label: 'Aadhaar' }, { key: 'abha', label: 'ABHA' },
          ].map(f => (
            <button key={f.key} onClick={() => setSearchBy(f.key as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${searchBy === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm"
            placeholder={`Search by ${searchBy === 'all' ? 'name, UHID, or phone' : searchBy}...`} />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Last Visit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(p => (
              <tr
                key={p.uhid}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => { void backfillPlatformPatientId(p.uhid); }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${p.category === 'vip' ? 'bg-warning/20 text-warning' : 'bg-muted'}`}>
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1">
                        {p.name}
                        {p.patientType === 'IPD' && <span className="text-xs px-1 py-0.5 rounded bg-info/10 text-info">IPD</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.uhid} · {p.age}{p.gender} {p.bloodGroup ? `· ${p.bloodGroup}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{p.phone}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryConfig[p.category].color}`}>{categoryConfig[p.category].label}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div>
                    <p className="text-sm text-muted-foreground">{p.lastVisit || 'No visits'}</p>
                    {p.assignedDoctor && <p className="text-xs text-muted-foreground">{p.assignedDoctor}</p>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex gap-1">
                    {p.abhaId && <span className="text-xs px-1.5 py-0.5 rounded-full bg-info/10 text-info">ABHA</span>}
                    {p.patientType === 'Emergency' && <span className="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">ER</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-accent"
                      title="Edit patient info"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditingPatient(p.uhid);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded hover:bg-accent"
                      title="Copy intake link"
                      onClick={(event) => {
                        event.stopPropagation();
                        const visitId = p.platformOpdVisitId ?? p.uhid;
                        const intakeUrl = patientIntakeUrl(visitId);
                        void navigator.clipboard.writeText(intakeUrl);
                        toast.success('Intake link copied');
                      }}
                    >
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 rounded hover:bg-accent" title="Visit history"><History className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No patients found</div>}
      </div>
    </div>
  );
}
