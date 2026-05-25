import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  Thermometer,
  Heart,
  Droplets,
  Pill,
  FlaskConical,
  Scan,
  Calendar,
  ClipboardCheck,
  ListTodo,
  Utensils,
  Stethoscope,
  Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useHospital } from '@/stores/hospitalStore';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { canUseIpdRuntime, platformListIpdAllowedActions } from '@/runtime/ipd-runtime';
import { guardLocalAdmissionStatusAgainstPlatform } from '@/operations/lifecycle-guards';
import { formatPlatformErrorBody, PlatformApiError } from '@/runtime/platform-client';
import { OperationalDischargePanel } from '@/components/operations/OperationalDischargePanel';
import { canUseDischargeRuntime } from '@/runtime/discharge-runtime';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const tabs = [
  'Summary',
  'Progress Notes',
  'Orders',
  'Medication Chart',
  'Labs & Reports',
  'Tasks',
  'Discharge',
];

const conditionColors: Record<'stable' | 'critical' | 'improving' | 'observation', string> = {
  stable: 'bg-emerald-500/10 text-emerald-600',
  critical: 'bg-destructive/10 text-destructive',
  improving: 'bg-blue-500/10 text-blue-600',
  observation: 'bg-amber-500/10 text-amber-600',
};

const roundStatusStyles: Record<'pending' | 'seen' | 'follow-up-required', string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  seen: 'bg-emerald-500/10 text-emerald-700',
  'follow-up-required': 'bg-destructive/10 text-destructive',
};

const roundStatusLabel: Record<'pending' | 'seen' | 'follow-up-required', string> = {
  pending: 'Pending',
  seen: 'Seen',
  'follow-up-required': 'Follow-up required',
};

function toCondition(input: {
  status: string;
  nursingPriority: string;
  spo2?: number;
}): 'stable' | 'critical' | 'improving' | 'observation' {
  if (input.status === 'icu' || (typeof input.spo2 === 'number' && input.spo2 < 94)) {
    return 'critical';
  }
  if (input.status === 'discharge-ready') {
    return 'improving';
  }
  if (input.nursingPriority === 'high') {
    return 'observation';
  }
  return 'stable';
}

function toDaysAdmitted(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 1;
  }
  return Math.max(1, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

function hasAbnormalResult(order: { results?: string; interpretation?: string; comments?: string; criticalAlert?: boolean }) {
  if (order.criticalAlert) {
    return true;
  }
  const merged = `${order.results || ''} ${order.interpretation || ''} ${order.comments || ''}`.toLowerCase();
  return /(abnormal|critical|high|low|positive)/.test(merged);
}

export default function DoctorIPDPatientProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const {
    nursingRounds,
    doctorProgressNotes,
    admissionTasks,
    inpatientCareOrders,
    prescriptions,
    pharmacyInventory,
    labOrders,
    radiologyOrders,
    saveConsultation,
    updateAdmissionStatus,
    addDoctorProgressNote,
    markDoctorRoundCompleted,
    addAdmissionTask,
    updateAdmissionTaskStatus,
    addInpatientCareOrder,
    updateInpatientCareOrderStatus,
    saveAdmissionDischargeSummary,
    updateMedicationLineStatus,
    getPatientWorkflowTimeline,
  } = useHospital();

  const { isDoctor, admissions, getPatient } = useDoctorScope();
  const admission = admissions.find((item) => item.id === patientId);
  const patient = admission ? getPatient(admission.uhid) : undefined;

  const [activeTab, setActiveTab] = useState('Summary');
  const [soapNote, setSoapNote] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    followUpRequired: false,
  });
  const [medOrder, setMedOrder] = useState({ drug: '', dosage: '', frequency: 'BD', duration: '5 days', route: 'Oral', qty: 10 });
  const [labOrderDraft, setLabOrderDraft] = useState<{ tests: string; priority: 'Routine' | 'Urgent' | 'Emergency' }>({
    tests: '',
    priority: 'Routine',
  });
  const [radiologyOrderDraft, setRadiologyOrderDraft] = useState<{ study: string; modality: string; priority: 'Routine' | 'Urgent' | 'Emergency' }>({
    study: '',
    modality: 'X-Ray',
    priority: 'Routine',
  });
  const [careOrderDraft, setCareOrderDraft] = useState<{ type: 'Procedure' | 'Diet'; item: string; priority: 'Routine' | 'Urgent' | 'Emergency' }>({
    type: 'Procedure',
    item: '',
    priority: 'Routine',
  });
  const [taskDraft, setTaskDraft] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [platformState, setPlatformState] = useState<string | null>(null);
  const [platformAllowed, setPlatformAllowed] = useState<string[]>([]);
  const [platformLifecycleError, setPlatformLifecycleError] = useState<string | null>(null);

  useEffect(() => {
    if (admission) {
      setDischargeSummary(admission.dischargeSummary || '');
      setTaskAssignee(admission.assignedNurse || 'Nurse Station');
    }
  }, [admission]);

  useEffect(() => {
    if (!canUseIpdRuntime() || !admission?.platformAdmissionId) {
      setPlatformState(null);
      setPlatformAllowed([]);
      setPlatformLifecycleError(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const lifecycle = await platformListIpdAllowedActions(admission.platformAdmissionId);
        if (!cancelled) {
          setPlatformState(lifecycle.state);
          setPlatformAllowed(lifecycle.allowed);
          setPlatformLifecycleError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const body = err instanceof PlatformApiError ? err.body : undefined;
          setPlatformLifecycleError(
            formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : 'Lifecycle unavailable'),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admission?.platformAdmissionId, admission?.status]);

  if (!isDoctor || !patientId) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access IPD profiles.
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h1 className="text-lg font-semibold">Admission Not Found</h1>
        <p className="text-sm text-muted-foreground">
          This IPD case is not in your current doctor and department scope.
        </p>
        <Button size="sm" onClick={() => navigate('/doctor/ipd')}>Back To IPD Rounds</Button>
      </div>
    );
  }

  const patientRounds = nursingRounds.filter((round) => round.admissionId === admission.id);
  const latestRound = patientRounds[0];
  const patientProgressNotes = doctorProgressNotes.filter((note) => note.admissionId === admission.id);
  const patientTasks = admissionTasks.filter((task) => task.admissionId === admission.id);
  const patientCareOrders = inpatientCareOrders.filter((order) => order.admissionId === admission.id);
  const patientPrescriptions = prescriptions.filter((prescription) => prescription.uhid === admission.uhid);
  const patientLabOrders = labOrders.filter((order) => order.uhid === admission.uhid);
  const patientRadiologyOrders = radiologyOrders.filter((order) => order.uhid === admission.uhid);
  const workflowTimeline = getPatientWorkflowTimeline(admission.uhid).slice(0, 12);

  const medicationLines = patientPrescriptions.flatMap((prescription) => (
    prescription.meds.map((medication, lineIndex) => ({
      ...medication,
      rxId: prescription.id,
      lineIndex,
      rxStatus: prescription.status,
      orderedAt: prescription.date,
    }))
  ));

  const activeMedications = medicationLines.filter((line) => line.status !== 'stopped');

  const condition = toCondition({
    status: admission.status,
    nursingPriority: admission.nursingPriority,
    spo2: latestRound?.spo2,
  });

  const medSuggestions = (() => {
    const query = medOrder.drug.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return pharmacyInventory
      .filter((item) => item.drug.toLowerCase().includes(query) || item.generic.toLowerCase().includes(query))
      .slice(0, 8);
  })();

  const handleAddSoapNote = () => {
    const hasContent = [soapNote.subjective, soapNote.objective, soapNote.assessment, soapNote.plan]
      .some((item) => item.trim().length > 0);

    if (!hasContent) {
      toast.error('Enter at least one SOAP section');
      return;
    }

    addDoctorProgressNote({
      admissionId: admission.id,
      doctor: admission.roundingDoctor || admission.attendingDoctor,
      subjective: soapNote.subjective,
      objective: soapNote.objective,
      assessment: soapNote.assessment,
      plan: soapNote.plan,
      followUpRequired: soapNote.followUpRequired,
    });

    setSoapNote({
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      followUpRequired: false,
    });
  };

  const handleAddMedicationOrder = () => {
    if (!medOrder.drug.trim()) {
      toast.error('Enter medication name');
      return;
    }

    void saveConsultation({
      uhid: admission.uhid,
      patientName: admission.patientName,
      doctor: admission.roundingDoctor || admission.attendingDoctor,
      department: patient?.department || 'Inpatient Care',
      medications: [{ ...medOrder }],
    });

    setMedOrder({ drug: '', dosage: '', frequency: 'BD', duration: '5 days', route: 'Oral', qty: 10 });
  };

  const handleAddLabOrder = () => {
    if (!labOrderDraft.tests.trim()) {
      toast.error('Enter lab test name');
      return;
    }

    void saveConsultation({
      uhid: admission.uhid,
      patientName: admission.patientName,
      doctor: admission.roundingDoctor || admission.attendingDoctor,
      department: patient?.department || 'Inpatient Care',
      labTests: [{ tests: labOrderDraft.tests, category: 'General', priority: labOrderDraft.priority }],
    });

    setLabOrderDraft({ tests: '', priority: 'Routine' });
  };

  const handleAddRadiologyOrder = () => {
    if (!radiologyOrderDraft.study.trim()) {
      toast.error('Enter imaging study');
      return;
    }

    void saveConsultation({
      uhid: admission.uhid,
      patientName: admission.patientName,
      doctor: admission.roundingDoctor || admission.attendingDoctor,
      department: patient?.department || 'Inpatient Care',
      radiologyOrders: [{
        study: radiologyOrderDraft.study,
        modality: radiologyOrderDraft.modality,
        priority: radiologyOrderDraft.priority,
      }],
    });

    setRadiologyOrderDraft({ study: '', modality: 'X-Ray', priority: 'Routine' });
  };

  const handleAddCareOrder = () => {
    if (!careOrderDraft.item.trim()) {
      toast.error(`Enter ${careOrderDraft.type.toLowerCase()} instruction`);
      return;
    }

    addInpatientCareOrder({
      admissionId: admission.id,
      type: careOrderDraft.type,
      item: careOrderDraft.item,
      priority: careOrderDraft.priority,
      orderedBy: admission.roundingDoctor || admission.attendingDoctor,
    });

    setCareOrderDraft((prev) => ({ ...prev, item: '' }));
  };

  const handleAssignTask = () => {
    if (!taskDraft.trim()) {
      toast.error('Enter task details');
      return;
    }

    addAdmissionTask({
      admissionId: admission.id,
      task: taskDraft,
      assignedTo: taskAssignee || admission.assignedNurse || 'Nurse Station',
      createdBy: admission.roundingDoctor || admission.attendingDoctor,
    });

    setTaskDraft('');
  };

  const handleSaveDischargeSummary = () => {
    if (!dischargeSummary.trim()) {
      toast.error('Enter discharge summary');
      return;
    }
    saveAdmissionDischargeSummary(
      admission.id,
      dischargeSummary,
      admission.roundingDoctor || admission.attendingDoctor,
    );
  };

  const handleMarkDischargeReady = () => {
    if (canUseIpdRuntime() && admission.platformAdmissionId) {
      try {
        guardLocalAdmissionStatusAgainstPlatform('discharge-ready', platformAllowed, platformState ?? undefined);
      } catch {
        return;
      }
    }
    if (dischargeSummary.trim()) {
      saveAdmissionDischargeSummary(
        admission.id,
        dischargeSummary,
        admission.roundingDoctor || admission.attendingDoctor,
      );
    }
    updateAdmissionStatus(admission.id, 'discharge-ready');
  };

  const canMarkDischargeReady =
    !canUseIpdRuntime()
    || !admission.platformAdmissionId
    || platformAllowed.some((action) => ['start_active_care', 'initiate_discharge'].includes(action));

  const vitalsCards = [
    { label: 'Pulse', value: latestRound ? String(latestRound.pulse) : '--', unit: 'bpm', icon: Heart, color: 'text-red-500' },
    { label: 'BP', value: latestRound?.bp || '--', unit: 'mmHg', icon: Activity, color: 'text-blue-500' },
    { label: 'SpO2', value: latestRound ? `${latestRound.spo2}` : '--', unit: '%', icon: Droplets, color: 'text-amber-500' },
    { label: 'Temp', value: latestRound ? String(latestRound.temp) : '--', unit: 'F', icon: Thermometer, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/doctor/ipd')} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{admission.patientName}</h1>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${conditionColors[condition]}`}>
                {condition}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roundStatusStyles[admission.doctorRoundStatus]}`}>
                {roundStatusLabel[admission.doctorRoundStatus]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {admission.bed} · {admission.ward}{admission.room ? ` · ${admission.room}` : ''} · Day {toDaysAdmitted(admission.admittedAt)} · {admission.uhid}
            </p>
            {admission.lastDoctorRoundAt && (
              <p className="text-xs text-muted-foreground mt-0.5">Last doctor round: {admission.lastDoctorRoundAt}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markDoctorRoundCompleted(admission.id, admission.roundingDoctor || admission.attendingDoctor)}
          >
            <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Mark Round Completed
          </Button>
          <Button size="sm" onClick={() => navigate(`/doctor/consultation/${admission.uhid}`)}>Open Consultation</Button>
        </div>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {vitalsCards.map((card) => (
          <div key={card.label} className="border rounded-xl bg-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold">{card.value} <span className="text-xs font-normal text-muted-foreground">{card.unit}</span></p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div {...fadeIn(2)} className="border rounded-xl bg-card overflow-hidden">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
                {activeTab === tab && <motion.div layoutId="ipdProfileTab" className="absolute inset-x-2 -bottom-px h-0.5 bg-foreground rounded-full" />}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'Summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Patient Summary</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Diagnosis</span><span className="font-medium text-right max-w-[60%]">{admission.primaryDiagnosis}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Admission Date</span><span className="font-medium">{admission.admittedAt}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Current Treatment Plan</span><span className="font-medium text-right max-w-[60%]">{admission.currentTreatmentPlan || 'Not recorded yet'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Allergies</span><span className="font-medium text-right max-w-[60%]">{patient?.allergies || 'None documented'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Comorbidities</span><span className="font-medium text-right max-w-[60%]">{patient?.chronicDiseases || 'None documented'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Latest Vitals Snapshot</span><span className="font-medium text-right max-w-[60%]">{latestRound ? `${latestRound.bp} · P ${latestRound.pulse} · T ${latestRound.temp}F · SpO2 ${latestRound.spo2}%` : 'No vitals available'}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Vitals And Nursing Data</p>
                <div className="space-y-2">
                  {patientRounds.slice(0, 5).map((round) => (
                    <div key={round.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">{round.nurse} · {round.shift} Shift</p>
                        <p className="text-xs text-muted-foreground">{round.recordedAt}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">BP {round.bp} · Pulse {round.pulse} · Temp {round.temp}F · SpO2 {round.spo2}% · Pain {round.painScore}/10</p>
                      <p className="text-sm mt-1">{round.notes}</p>
                    </div>
                  ))}
                  {patientRounds.length === 0 && (
                    <p className="text-sm text-muted-foreground">No nursing rounds recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Progress Notes' && (
            <div className="space-y-5">
              <div className="border rounded-lg p-4 bg-accent/20 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Daily Progress Note (SOAP)</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <Textarea
                    placeholder="Subjective"
                    value={soapNote.subjective}
                    onChange={(event) => setSoapNote((prev) => ({ ...prev, subjective: event.target.value }))}
                    className="text-xs min-h-[90px]"
                  />
                  <Textarea
                    placeholder="Objective"
                    value={soapNote.objective}
                    onChange={(event) => setSoapNote((prev) => ({ ...prev, objective: event.target.value }))}
                    className="text-xs min-h-[90px]"
                  />
                  <Textarea
                    placeholder="Assessment"
                    value={soapNote.assessment}
                    onChange={(event) => setSoapNote((prev) => ({ ...prev, assessment: event.target.value }))}
                    className="text-xs min-h-[90px]"
                  />
                  <Textarea
                    placeholder="Plan"
                    value={soapNote.plan}
                    onChange={(event) => setSoapNote((prev) => ({ ...prev, plan: event.target.value }))}
                    className="text-xs min-h-[90px]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={soapNote.followUpRequired ? 'yes' : 'no'}
                    onValueChange={(value) => setSoapNote((prev) => ({ ...prev, followUpRequired: value === 'yes' }))}
                  >
                    <SelectTrigger className="h-8 text-xs w-[220px]">
                      <SelectValue placeholder="Follow-up required?" />
                    </SelectTrigger>
                    <SelectContent portal className="z-[120]">
                      <SelectItem value="no">No follow-up required</SelectItem>
                      <SelectItem value="yes">Follow-up required</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 text-xs" onClick={handleAddSoapNote}>
                    <Stethoscope className="w-3.5 h-3.5 mr-1" /> Save SOAP Note
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Progress Notes History</p>
                  {patientProgressNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{note.doctor}</p>
                        <p className="text-xs text-muted-foreground">{note.createdAt}</p>
                      </div>
                      <p className="text-xs"><span className="font-semibold">S:</span> {note.subjective || '—'}</p>
                      <p className="text-xs"><span className="font-semibold">O:</span> {note.objective || '—'}</p>
                      <p className="text-xs"><span className="font-semibold">A:</span> {note.assessment || '—'}</p>
                      <p className="text-xs"><span className="font-semibold">P:</span> {note.plan || '—'}</p>
                    </div>
                  ))}
                  {patientProgressNotes.length === 0 && (
                    <p className="text-sm text-muted-foreground">No doctor progress notes yet.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Complete Timeline</p>
                  {workflowTimeline.map((event) => (
                    <div key={event.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold uppercase tracking-wide">{event.module}</p>
                        <p className="text-[11px] text-muted-foreground">{event.timestamp}</p>
                      </div>
                      <p className="text-sm">{event.details}</p>
                    </div>
                  ))}
                  {workflowTimeline.length === 0 && (
                    <p className="text-sm text-muted-foreground">No timeline activity found yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Orders' && (
            <div className="space-y-5">
              <div className="border rounded-lg p-4 bg-accent/20 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Management</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="relative">
                    <Input
                      placeholder="Medication name"
                      value={medOrder.drug}
                      onChange={(event) => setMedOrder((prev) => ({ ...prev, drug: event.target.value }))}
                      className="h-8 text-xs"
                    />
                    {medSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-[120] rounded-lg border bg-card shadow-lg max-h-48 overflow-y-auto">
                        {medSuggestions.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setMedOrder((prev) => ({ ...prev, drug: item.drug }))}
                            className="w-full px-2 py-1.5 text-left text-xs hover:bg-accent transition-colors"
                          >
                            <span className="font-medium">{item.drug}</span>
                            <span className="ml-2 text-muted-foreground">{item.generic}</span>
                            <span className={`ml-2 ${item.qty > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                              {item.qty > 0 ? `Stock ${item.qty}` : 'Out of stock'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input placeholder="Dosage" value={medOrder.dosage} onChange={(event) => setMedOrder((prev) => ({ ...prev, dosage: event.target.value }))} className="h-8 text-xs" />
                  <Input placeholder="Frequency" value={medOrder.frequency} onChange={(event) => setMedOrder((prev) => ({ ...prev, frequency: event.target.value }))} className="h-8 text-xs" />
                  <Input placeholder="Duration" value={medOrder.duration} onChange={(event) => setMedOrder((prev) => ({ ...prev, duration: event.target.value }))} className="h-8 text-xs" />
                  <Input placeholder="Route" value={medOrder.route} onChange={(event) => setMedOrder((prev) => ({ ...prev, route: event.target.value }))} className="h-8 text-xs" />
                  <Input type="number" min={1} placeholder="Qty" value={medOrder.qty} onChange={(event) => setMedOrder((prev) => ({ ...prev, qty: Number(event.target.value) || 1 }))} className="h-8 text-xs" />
                </div>
                <Button size="sm" className="text-xs h-8" onClick={handleAddMedicationOrder}>
                  <Pill className="w-3.5 h-3.5 mr-1" /> Prescribe Medication
                </Button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lab And Imaging</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input placeholder="Lab test" value={labOrderDraft.tests} onChange={(event) => setLabOrderDraft((prev) => ({ ...prev, tests: event.target.value }))} className="h-8 text-xs md:col-span-2" />
                    <Select value={labOrderDraft.priority} onValueChange={(value) => setLabOrderDraft((prev) => ({ ...prev, priority: value as 'Routine' | 'Urgent' | 'Emergency' }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent portal className="z-[120]">
                        <SelectItem value="Routine">Routine</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" className="h-8 text-xs" onClick={handleAddLabOrder}><FlaskConical className="w-3.5 h-3.5 mr-1" /> Order Lab Test</Button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input placeholder="Procedure / Imaging" value={radiologyOrderDraft.study} onChange={(event) => setRadiologyOrderDraft((prev) => ({ ...prev, study: event.target.value }))} className="h-8 text-xs md:col-span-2" />
                    <Input placeholder="Modality" value={radiologyOrderDraft.modality} onChange={(event) => setRadiologyOrderDraft((prev) => ({ ...prev, modality: event.target.value }))} className="h-8 text-xs" />
                    <Select value={radiologyOrderDraft.priority} onValueChange={(value) => setRadiologyOrderDraft((prev) => ({ ...prev, priority: value as 'Routine' | 'Urgent' | 'Emergency' }))}>
                      <SelectTrigger className="h-8 text-xs md:col-span-2">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent portal className="z-[120]">
                        <SelectItem value="Routine">Routine</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 text-xs" onClick={handleAddRadiologyOrder}><Scan className="w-3.5 h-3.5 mr-1" /> Request Imaging</Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Procedure And Diet Instructions</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Select value={careOrderDraft.type} onValueChange={(value) => setCareOrderDraft((prev) => ({ ...prev, type: value as 'Procedure' | 'Diet' }))}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent portal className="z-[120]">
                        <SelectItem value="Procedure">Procedure</SelectItem>
                        <SelectItem value="Diet">Diet</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={careOrderDraft.type === 'Diet' ? 'Diet instruction' : 'Procedure request'}
                      value={careOrderDraft.item}
                      onChange={(event) => setCareOrderDraft((prev) => ({ ...prev, item: event.target.value }))}
                      className="h-8 text-xs md:col-span-2"
                    />
                    <Select value={careOrderDraft.priority} onValueChange={(value) => setCareOrderDraft((prev) => ({ ...prev, priority: value as 'Routine' | 'Urgent' | 'Emergency' }))}>
                      <SelectTrigger className="h-8 text-xs md:col-span-2">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent portal className="z-[120]">
                        <SelectItem value="Routine">Routine</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="Emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 text-xs" onClick={handleAddCareOrder}>
                      {careOrderDraft.type === 'Diet' ? <Utensils className="w-3.5 h-3.5 mr-1" /> : <Workflow className="w-3.5 h-3.5 mr-1" />}
                      Add {careOrderDraft.type}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Current Procedure And Diet Orders</p>
                {patientCareOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{order.type}: {order.item}</p>
                      <p className="text-xs text-muted-foreground">{order.priority} · {order.orderedBy} · {order.orderedAt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{order.status}</span>
                      {order.status !== 'Completed' ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateInpatientCareOrderStatus(order.id, 'Completed')}>
                          Complete
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateInpatientCareOrderStatus(order.id, 'Pending')}>
                          Reopen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {patientCareOrders.length === 0 && <p className="text-sm text-muted-foreground">No procedure or diet orders yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'Medication Chart' && (
            <div className="space-y-4">
              <div className="border rounded-lg p-3 bg-accent/20">
                <p className="text-sm font-semibold">Active Medications ({activeMedications.length})</p>
              </div>

              <div className="space-y-2">
                {medicationLines.map((line) => {
                  const medStatus = line.status || 'active';
                  return (
                    <div key={`${line.rxId}-${line.lineIndex}`} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{line.drug}</p>
                        <p className="text-xs text-muted-foreground">{line.dosage} · {line.frequency} · {line.route} · Qty {line.qty}</p>
                        <p className="text-xs text-muted-foreground">Start: {line.startAt || line.orderedAt}{line.stopAt ? ` · Stop: ${line.stopAt}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${medStatus === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                          {medStatus}
                        </span>
                        {medStatus === 'active' ? (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMedicationLineStatus(line.rxId, line.lineIndex, 'stopped')}>
                            Stop
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateMedicationLineStatus(line.rxId, line.lineIndex, 'active')}>
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {medicationLines.length === 0 && (
                  <p className="text-sm text-muted-foreground">No medication chart entries yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Labs & Reports' && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-2">Lab Results</p>
                <div className="space-y-2">
                  {patientLabOrders.map((order) => {
                    const abnormal = hasAbnormalResult(order);
                    return (
                      <div key={order.orderId} className={`border rounded-lg p-3 ${abnormal ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{order.tests}</p>
                          <p className="text-xs text-muted-foreground">{order.orderTime}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{order.orderId} · {order.priority} · {order.stage}</p>
                        <p className="text-sm">{order.results || order.interpretation || 'Result pending'}</p>
                        {abnormal && (
                          <p className="text-xs font-semibold text-destructive mt-1">Abnormal value detected</p>
                        )}
                      </div>
                    );
                  })}
                  {patientLabOrders.length === 0 && <p className="text-sm text-muted-foreground">No lab orders yet.</p>}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Imaging Reports</p>
                <div className="space-y-2">
                  {patientRadiologyOrders.map((order) => (
                    <div key={order.orderId} className={`border rounded-lg p-3 ${order.critical ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{order.study}</p>
                        <p className="text-xs text-muted-foreground">{order.orderTime}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{order.orderId} · {order.modality} · {order.status}</p>
                      <p className="text-sm">{order.reportImpression || order.reportFindings || 'Report pending'}</p>
                      {order.critical && <p className="text-xs font-semibold text-destructive mt-1">Critical radiology alert</p>}
                    </div>
                  ))}
                  {patientRadiologyOrders.length === 0 && <p className="text-sm text-muted-foreground">No imaging orders yet.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div className="space-y-5">
              <div className="border rounded-lg p-4 bg-accent/20 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task And Follow-up</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Task for nursing"
                    value={taskDraft}
                    onChange={(event) => setTaskDraft(event.target.value)}
                    className="h-8 text-xs md:col-span-2"
                  />
                  <Input
                    placeholder="Assign to"
                    value={taskAssignee}
                    onChange={(event) => setTaskAssignee(event.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <Button size="sm" className="h-8 text-xs" onClick={handleAssignTask}>
                  <ListTodo className="w-3.5 h-3.5 mr-1" /> Assign Task
                </Button>
              </div>

              <div className="space-y-2">
                {patientTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{task.task}</p>
                      <p className="text-xs text-muted-foreground">{task.assignedTo} · {task.createdAt}{task.completedAt ? ` · Completed ${task.completedAt}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                        {task.status}
                      </span>
                      {task.status === 'Pending' ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateAdmissionTaskStatus(task.id, 'Completed')}>
                          Mark Completed
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateAdmissionTaskStatus(task.id, 'Pending')}>
                          Mark Pending
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {patientTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No nursing tasks assigned yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Discharge' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Discharge Planning</p>
              {canUseDischargeRuntime() && admission.platformAdmissionId && (
                <OperationalDischargePanel
                  admissionId={admission.platformAdmissionId}
                  patientName={admission.patientName}
                  clinicalClearanceContext={
                    dischargeSummary.trim()
                      ? {
                          dischargeSummaryDraft: true,
                          clinicalNoteSigned: true,
                          dischargeMedicationsReconciled: true,
                        }
                      : { dischargeSummaryDraft: false }
                  }
                />
              )}
              {platformLifecycleError && (
                <p className="text-xs text-destructive rounded-lg border border-destructive/30 bg-destructive/5 p-2">
                  Platform lifecycle: {platformLifecycleError}
                </p>
              )}
              {platformState && (
                <p className="text-xs text-muted-foreground">
                  Platform state: {platformState}
                  {platformAllowed.length > 0 ? ` · Next: ${platformAllowed.join(', ')}` : ''}
                </p>
              )}
              <Textarea
                placeholder="Add discharge summary, medication instructions, and follow-up plan..."
                value={dischargeSummary}
                onChange={(event) => setDischargeSummary(event.target.value)}
                className="text-xs min-h-[160px] resize-none"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleSaveDischargeSummary}>
                  Save Discharge Summary
                </Button>
                <Button
                  size="sm"
                  className="bg-foreground text-background hover:bg-foreground/90"
                  onClick={handleMarkDischargeReady}
                  disabled={!canMarkDischargeReady || admission.isIpLocked}
                >
                  Mark Ready For Discharge
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Status: {admission.status}</p>
                {admission.dischargeReadyAt && <p>Marked ready at: {admission.dischargeReadyAt}</p>}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
