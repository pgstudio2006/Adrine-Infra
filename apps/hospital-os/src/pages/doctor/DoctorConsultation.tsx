import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Monitor, Tablet, Mic, Camera, ZoomIn, ZoomOut, X as XIcon, Circle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConsultationVitals from './consultation/ConsultationVitals';
import ConsultationComplaints, { type Complaint } from './consultation/ConsultationComplaints';
import ConsultationDiagnosis, { type Diagnosis } from './consultation/ConsultationDiagnosis';
import ConsultationExamination, { type ExamFindings } from './consultation/ConsultationExamination';
import ConsultationOrders, { type LabTest, type RadiologyOrder, type ProcedureOrder } from './consultation/ConsultationOrders';
import ConsultationMedications, { type Medication } from './consultation/ConsultationMedications';
import ConsultationRightPanel, { type AdmissionRecommendationPayload } from './consultation/ConsultationRightPanel';
import PrescriptionPreview from './consultation/PrescriptionPreview';
import ConsultationAIScribe from './consultation/ConsultationAIScribe';
import { toast } from 'sonner';
import { useHospital } from '@/stores/hospitalStore';
import { useAuth } from '@/contexts/AuthContext';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { PatientContextBar } from '@/components/opd/PatientContextBar';
import { ConsultationBlockerStrip } from '@/components/opd/ConsultationBlockerStrip';
import { useConsultationBlockers } from '@/hooks/useConsultationBlockers';
import { useOperationalRouteGuard } from '@/hooks/useOperationalRouteGuard';
import { formatWaitMinutes } from '@/lib/opd/queue-presenters';
import { NavayuIntakePanel } from '@/components/navayu/NavayuIntakePanel';
import { NavayuSeniorReviewForm } from '@/components/navayu/NavayuSeniorReviewForm';
import { NavayuAiSummaryPanel } from '@/components/navayu/NavayuAiSummaryPanel';
import { NavayuMskWorkflowStrip } from '@/components/navayu/NavayuMskWorkflowStrip';
import { NavayuMskExamPanel } from '@/components/navayu/NavayuMskExamPanel';
import { NavayuInvestigationsPanel } from '@/components/navayu/NavayuInvestigationsPanel';
import { NavayuProtocolMapPanel } from '@/components/navayu/NavayuProtocolMapPanel';
import {
  isNavayuTenant,
  isNavayuSeniorDoctor,
  isJrDoctorRole,
  loadNavayuLumbarExam,
  loadNavayuSeniorReview,
  loadNavayuVisitMetadata,
  saveNavayuLumbarExam,
  saveNavayuSeniorReview,
  type NavayuFormValues,
  type NavayuLumbarExamData,
  type NavayuProtocolMapData,
  type NavayuRegistrationMetadata,
  type NavayuSeniorReviewData,
} from '@/lib/navayu/navayu-forms';
import {
  canUseNavayuRuntime,
  MSK_STATE_LABELS,
  platformMskTransition,
  platformLoadNavayuVisitBundle,
  platformSaveNavayuMskExams,
  platformSaveNavayuInvestigations,
  platformHandoffProtocolToCounsellor,
  platformSaveNavayuSeniorReview,
  platformStartAssociateEval,
  platformHandoffJuniorToSenior,
  type NavayuIntakeData,
  type NavayuVisitBundle,
} from '@/lib/navayu/navayu-runtime';
import { getPlatformSession } from '@/runtime/platform-session';
import { useClinicalBasePath } from '@/hooks/useClinicalBasePath';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

// ── Inline patient photo viewer for doctor consultation ──
const MARKER_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

interface StoredPhoto {
  id: string; uhid: string; patientName: string; url: string;
  uploadedAt: string; uploadedBy: string; note: string;
  markers: { id: string; x: number; y: number; color: string; label: string }[];
}

function DoctorPhotoViewer({ patientId }: { patientId: string }) {
  const [photos, setPhotos] = useState<StoredPhoto[]>(() => {
    try { return (JSON.parse(localStorage.getItem('adrine_patient_photos') || '[]') as StoredPhoto[]).filter(p => p.uhid === patientId); }
    catch { return []; }
  });
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [markerMode, setMarkerMode] = useState(false);
  const [markerColor, setMarkerColor] = useState(MARKER_COLORS[0]);
  const [markerLabel, setMarkerLabel] = useState('');

  const persist = (updated: StoredPhoto[]) => {
    try {
      const all: StoredPhoto[] = JSON.parse(localStorage.getItem('adrine_patient_photos') || '[]');
      const merged = all.map(p => updated.find(u => u.id === p.id) ?? p);
      localStorage.setItem('adrine_patient_photos', JSON.stringify(merged));
    } catch {}
  };

  const addMarker = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!markerMode || lightboxIdx === null) return;
    const rect = (e.target as HTMLImageElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const updated = photos.map((p, i) =>
      i === lightboxIdx ? { ...p, markers: [...p.markers, { id: Date.now().toString(), x, y, color: markerColor, label: markerLabel || 'Mark' }] } : p
    );
    setPhotos(updated);
    persist(updated);
  };

  const removeMarker = (photoIdx: number, markerId: string) => {
    const updated = photos.map((p, i) => i === photoIdx ? { ...p, markers: p.markers.filter(m => m.id !== markerId) } : p);
    setPhotos(updated);
    persist(updated);
  };

  const currentPhoto = lightboxIdx !== null ? photos[lightboxIdx] : null;

  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 flex flex-col items-center justify-center py-16 text-center">
        <Camera className="w-8 h-8 text-muted-foreground mb-3 opacity-30" />
        <p className="text-sm text-muted-foreground">No pre-consultation photos yet</p>
        <p className="text-xs text-muted-foreground mt-1">Reception uploads photos before the appointment</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{photos.length} Pre-Consultation Photo{photos.length > 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo, idx) => (
          <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="group relative rounded-xl overflow-hidden border bg-muted aspect-square cursor-pointer"
            onClick={() => { setLightboxIdx(idx); setZoom(1); }}>
            <img src={photo.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            {/* Source badge */}
            {(photo as any).source === 'camera' && (
              <div className="absolute top-1 left-1 text-[9px] bg-emerald-500/90 text-white px-1.5 py-0.5 rounded-full font-medium">📷 Cam</div>
            )}
            {photo.markers.map(m => (
              <div key={m.id} className="absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow"
                style={{ left: `${m.x}%`, top: `${m.y}%`, backgroundColor: m.color, transform: 'translate(-50%, -50%)' }} />
            ))}
            <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded-lg px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white/80">{photo.uploadedAt} · {photo.uploadedBy}</p>
              {photo.markers.length > 0 && <p className="text-[9px] text-white/70">{photo.markers.length} marker{photo.markers.length > 1 ? 's' : ''}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      {currentPhoto && lightboxIdx !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" onClick={() => { setLightboxIdx(null); setMarkerMode(false); }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
            <p className="text-white text-sm">{lightboxIdx + 1}/{photos.length} · {currentPhoto.uploadedAt}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-white/50 text-xs">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><ZoomIn className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button onClick={() => setMarkerMode(m => !m)} className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${markerMode ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <Circle className="w-3 h-3" /> {markerMode ? 'Marking ON' : 'Add Mark'}
              </button>
              {markerMode && MARKER_COLORS.map(c => (
                <button key={c} onClick={() => setMarkerColor(c)} className={`w-5 h-5 rounded-full border-2 ${markerColor === c ? 'border-white scale-125' : 'border-white/30'}`} style={{ backgroundColor: c }} />
              ))}
              {markerMode && (
                <input className="bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/20 w-24 focus:outline-none" placeholder="Label…" value={markerLabel} onChange={e => setMarkerLabel(e.target.value)} onClick={e => e.stopPropagation()} />
              )}
              {currentPhoto.markers.length > 0 && (
                <button onClick={() => { const u = photos.map((p, i) => i === lightboxIdx ? { ...p, markers: [] } : p); setPhotos(u); persist(u); }} className="px-2 py-1 rounded text-xs bg-white/10 text-white hover:bg-destructive/60">
                  <RotateCcw className="w-3 h-3 inline mr-1" />Clear
                </button>
              )}
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button onClick={() => { setLightboxIdx(null); setMarkerMode(false); setZoom(1); }} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><XIcon className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden relative" onClick={e => e.stopPropagation()}>
            {lightboxIdx > 0 && <button onClick={() => setLightboxIdx(lightboxIdx - 1)} className="absolute left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"><ChevronLeft className="w-5 h-5" /></button>}
            {lightboxIdx < photos.length - 1 && <button onClick={() => setLightboxIdx(lightboxIdx + 1)} className="absolute right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-10"><ChevronRight className="w-5 h-5" /></button>}
            <div className="relative" style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s' }}>
              <img src={currentPhoto.url} alt="" className={`max-h-[70vh] max-w-full object-contain rounded-lg select-none ${markerMode ? 'cursor-crosshair' : ''}`}
                onClick={markerMode ? addMarker : undefined} draggable={false} />
              {currentPhoto.markers.map(m => (
                <div key={m.id} className="absolute group" style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%, -50%)' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-white shadow cursor-pointer hover:scale-125 transition-transform"
                    style={{ backgroundColor: m.color }}
                    onClick={e => { e.stopPropagation(); removeMarker(lightboxIdx, m.id); }} />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          {currentPhoto.markers.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 flex-wrap" onClick={e => e.stopPropagation()}>
              {currentPhoto.markers.map(m => (
                <span key={m.id} className="flex items-center gap-1 text-xs text-white/60">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />{m.label}
                  <button onClick={() => removeMarker(lightboxIdx, m.id)} className="hover:text-destructive"><XIcon className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DoctorConsultation() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { saveConsultation, transferOpdToIPD, refreshQueueFromPlatform } = useHospital();
  const { user } = useAuth();
  const { isDoctor, queue, canAccessPatient, getPatient } = useDoctorScope();
  const roleBasePath = useClinicalBasePath();

  const patient = patientId ? getPatient(patientId) : undefined;
  const queueEntry = queue.find((entry) => entry.uhid === patientId);
  const hasAccess = !!patientId && canAccessPatient(patientId);
  const opdVisitId = patient?.platformOpdVisitId;
  const { hasCritical: saveBlockedByPlatform } = useConsultationBlockers(opdVisitId);
  const patientName = patient?.name ?? queueEntry?.patientName ?? 'Patient';
  const patientInfo = patient 
    ? `${patient.age}y / ${patient.gender}  •  UHID: ${patient.uhid}  •  ${patient.phone}`
    : `UHID: ${patientId ?? 'Unknown'}`;
  const patientAllergies = patient?.allergies ? patient.allergies.split(',').map(a => a.trim()) : [];

  // Vitals
  const [vitals, setVitals] = useState({ bp: '120/80', spo2: '98', temp: '98.6', pulse: '72', weight: '70', sugar: '110', height: '170', rr: '18', bmi: '24.2' });
  const [complaints, setComplaints] = useState<Complaint[]>([{ id: '1', text: 'Fever and headache', duration: '2 days', severity: 'moderate' }]);
  const [hpiNotes, setHpiNotes] = useState('');
  const [examFindings, setExamFindings] = useState<ExamFindings>({ general: '', cardiovascular: '', respiratory: '', neurological: '', abdominal: '', musculoskeletal: '', ent: '', dermatological: '' });
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>([]);
  const [procedures, setProcedures] = useState<ProcedureOrder[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [advice, setAdvice] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState('15');
  const [followUpUnit, setFollowUpUnit] = useState('Days');
  const [viewMode, setViewMode] = useState<'Digital' | 'Tablet'>('Digital');
  const [leftTab, setLeftTab] = useState<'clinical' | 'orders' | 'photos'>('clinical');
  const [showPreview, setShowPreview] = useState(false);
  const [showAIScribe, setShowAIScribe] = useState(false);
  const navayuMode = isNavayuTenant();
  const navayuSenior = isNavayuSeniorDoctor(
    getPlatformSession()?.email ?? user?.email,
    user?.role,
    user?.name,
  );
  const navayuJunior = isJrDoctorRole(user?.role);
  const [submittingJuniorExam, setSubmittingJuniorExam] = useState(false);
  const [navayuLumbarExam, setNavayuLumbarExam] = useState<NavayuLumbarExamData>(() =>
    patientId ? loadNavayuLumbarExam(patientId) : {},
  );
  const [navayuSeniorReview, setNavayuSeniorReview] = useState<NavayuSeniorReviewData>(() =>
    patientId ? loadNavayuSeniorReview(patientId) : {},
  );
  const [navayuBundle, setNavayuBundle] = useState<NavayuVisitBundle>({});
  const [navayuMskExams, setNavayuMskExams] = useState<Record<string, NavayuFormValues>>({});
  const [navayuInvestigations, setNavayuInvestigations] = useState<NavayuFormValues>({});
  const [navayuProtocolMap, setNavayuProtocolMap] = useState<NavayuProtocolMapData>({
    protocolId: '',
    stageId: '',
  });

  useEffect(() => {
    if (!patientId) return;
    setNavayuLumbarExam(loadNavayuLumbarExam(patientId));
    setNavayuSeniorReview(loadNavayuSeniorReview(patientId));

    const localReg =
      (patient?.visitMetadata?.navayu as NavayuRegistrationMetadata | undefined) ??
      loadNavayuVisitMetadata(patientId) ??
      undefined;

    if (canUseNavayuRuntime() && opdVisitId) {
      void platformLoadNavayuVisitBundle(opdVisitId).then((bundle) => {
        if (!bundle) {
          setNavayuBundle({ registration: localReg });
          return;
        }
        setNavayuBundle({
          registration: bundle.registration ?? localReg,
          intake: bundle.intake,
          lumbarExam: bundle.lumbarExam,
          mskExams: bundle.mskExams,
          investigations: bundle.investigations,
          protocolMap: bundle.protocolMap,
          mskLifecycleState: bundle.mskLifecycleState,
        });
        if (bundle.mskExams && Object.keys(bundle.mskExams).length > 0) {
          setNavayuMskExams(bundle.mskExams);
        }
        if (bundle.lumbarExam && Object.keys(bundle.lumbarExam).length > 0) {
          setNavayuLumbarExam(bundle.lumbarExam);
          setNavayuMskExams((prev) => ({
            ...prev,
            'navayu.exam.lumbar': bundle.lumbarExam as NavayuFormValues,
          }));
        }
        if (bundle.investigations) setNavayuInvestigations(bundle.investigations);
        if (bundle.protocolMap) setNavayuProtocolMap(bundle.protocolMap);
        if (bundle.seniorReview && Object.keys(bundle.seniorReview).length > 0) {
          setNavayuSeniorReview(bundle.seniorReview);
        }
      });
    } else {
      setNavayuBundle({ registration: localReg });
    }
  }, [patientId, opdVisitId, patient?.visitMetadata]);

  useEffect(() => {
    if (!navayuJunior || !opdVisitId || !canUseNavayuRuntime()) return;
    if (navayuBundle.mskLifecycleState !== 'intake_complete') return;
    void platformStartAssociateEval(opdVisitId).then((state) => {
      setNavayuBundle((prev) => ({ ...prev, mskLifecycleState: state }));
    });
  }, [navayuJunior, opdVisitId, navayuBundle.mskLifecycleState]);

  const handleNavayuMskExamChange = (formId: string, values: NavayuFormValues) => {
    const nextExams = { ...navayuMskExams, [formId]: values };
    setNavayuMskExams(nextExams);
    if (formId === 'navayu.exam.lumbar') {
      const lumbar = values as NavayuLumbarExamData;
      setNavayuLumbarExam(lumbar);
      if (patientId) saveNavayuLumbarExam(patientId, lumbar);
    }
    if (opdVisitId && canUseNavayuRuntime()) {
      void platformSaveNavayuMskExams(opdVisitId, nextExams, navayuSenior).then(async (state) => {
        setNavayuBundle((prev) => ({
          ...prev,
          mskLifecycleState: state,
          mskExams: nextExams,
          lumbarExam: (nextExams['navayu.exam.lumbar'] as NavayuLumbarExamData) ?? prev.lumbarExam,
        }));
        await refreshQueueFromPlatform();
      });
    }
  };

  const handleNavayuInvestigationsChange = (next: NavayuFormValues) => {
    setNavayuInvestigations(next);
    if (opdVisitId && canUseNavayuRuntime()) {
      void platformSaveNavayuInvestigations(opdVisitId, next);
    }
  };

  const handleNavayuProtocolChange = (next: NavayuProtocolMapData) => {
    setNavayuProtocolMap(next);
    if (opdVisitId && canUseNavayuRuntime() && next.protocolId && next.stageId) {
      void platformHandoffProtocolToCounsellor(opdVisitId, next).then((mskState) => {
        setNavayuBundle((prev) => ({ ...prev, protocolMap: next, mskLifecycleState: mskState }));
      });
    }
  };

  const handleNavayuSeniorReviewChange = (next: NavayuSeniorReviewData) => {
    setNavayuSeniorReview(next);
    if (patientId) {
      saveNavayuSeniorReview(patientId, next);
    }
    if (opdVisitId && canUseNavayuRuntime()) {
      void platformSaveNavayuSeniorReview(opdVisitId, next).then((mskState) => {
        setNavayuBundle((prev) => ({ ...prev, seniorReview: next, mskLifecycleState: mskState }));
      });
    }
  };

  const handleSubmitJuniorMskExam = async () => {
    if (!opdVisitId || !canUseNavayuRuntime()) return;
    setSubmittingJuniorExam(true);
    try {
      const state = await platformHandoffJuniorToSenior(opdVisitId);
      setNavayuBundle((prev) => ({ ...prev, mskLifecycleState: state }));
      await refreshQueueFromPlatform();
      toast.success('Junior MSK exam submitted for senior review');
    } catch {
      toast.error('Could not submit MSK exam — check workflow state');
    } finally {
      setSubmittingJuniorExam(false);
    }
  };

  const navayuRegistration =
    navayuBundle.registration ??
    (patient?.visitMetadata?.navayu as NavayuRegistrationMetadata | undefined) ??
    (patientId ? loadNavayuVisitMetadata(patientId) : null);
  const navayuIntake: NavayuIntakeData | null = navayuBundle.intake ?? null;

  // ── Operational route guard: patient must be queued or in_consultation ──
  const { currentAccess } = useOperationalRouteGuard();
  const operationalBlocked = !currentAccess.allowed && currentAccess.reason;

  if (!isDoctor || !patientId || !hasAccess) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h1 className="text-lg font-semibold">Consultation Access Restricted</h1>
        <p className="text-sm text-muted-foreground">
          You can only open consultations for patients assigned to your doctor profile and department.
        </p>
        <Button size="sm" onClick={() => navigate(`${roleBasePath}/queue`)}>Back to OPD Queue</Button>
      </div>
    );
  }

  if (operationalBlocked) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h1 className="text-lg font-semibold">Consultation Not Available</h1>
        <p className="text-sm text-muted-foreground">
          {currentAccess.reason}
        </p>
        <div className="flex gap-2">
          {currentAccess.redirectTo && (
            <Button size="sm" onClick={() => navigate(currentAccess.redirectTo!)}>
              Go to Queue
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate(`${roleBasePath}/queue`)}>
            Back to OPD Queue
          </Button>
        </div>
      </div>
    );
  }

  const handleAIScribeApply = (result: any) => {
    if (result.complaints.length > 0) setComplaints(result.complaints);
    if (result.diagnoses.length > 0) setDiagnoses(result.diagnoses);
    if (result.medications.length > 0) setMedications(result.medications);
    if (result.labTests.length > 0) setLabTests(result.labTests);
    if (result.radiologyOrders.length > 0) setRadiologyOrders(result.radiologyOrders);
    if (result.advice) setAdvice(result.advice);
    if (result.followUpDays) setFollowUpDays(result.followUpDays);
    // Apply vitals if present
    if (result.vitals) {
      setVitals(prev => {
        const updated = { ...prev };
        Object.entries(result.vitals).forEach(([k, v]) => {
          if (v && typeof v === 'string' && v.trim()) (updated as any)[k] = v;
        });
        return updated;
      });
    }
  };

  const handleSaveConsultation = async () => {
    if (!patientId) {
      return;
    }

    if (diagnoses.length === 0) {
      toast.error('Add at least one diagnosis before saving', {
        description: 'Platform OPD requires coded diagnosis to complete consultation.',
      });
      return;
    }

    const ok = await saveConsultation({
      uhid: patientId,
      patientName,
      doctor: user?.name || 'Dr. Doctor',
      department: patient?.department || queueEntry?.department || user?.department || 'General Medicine',
      labTests: labTests.map(t => ({ tests: t.text, category: 'General', priority: t.priority === 'stat' ? 'Emergency' as const : t.priority === 'urgent' ? 'Urgent' as const : 'Routine' as const })),
      medications: medications.map(m => ({
        drug: m.name,
        dosage: m.dosage,
        frequency: m.frequency || 'OD',
        duration: m.duration || '7 days',
        route: m.route || 'Oral',
        qty: 10,
      })),
      radiologyOrders: radiologyOrders.map(r => ({
        study: `${r.type} - ${r.bodyPart}`,
        modality: r.type,
        priority: r.priority === 'urgent' ? 'Urgent' as const : 'Routine' as const,
      })),
      consultationFee: 800,
    });
    if (ok && navayuMode && opdVisitId && canUseNavayuRuntime()) {
      if (navayuSenior) {
        void platformSaveNavayuSeniorReview(opdVisitId, navayuSeniorReview);
        void platformMskTransition(opdVisitId, 'classify_diagnosis');
      }
    }
    if (ok) navigate(-1);
  };

  const handleRecommendAdmission = (payload: AdmissionRecommendationPayload) => {
    if (!patientId) {
      return;
    }

    const result = transferOpdToIPD({
      uhid: patientId,
      patientName,
      attendingDoctor: user?.name || 'Doctor On Call',
      department: payload.department || patient?.department || queueEntry?.department || user?.department || 'General Medicine',
      reason: payload.reason || diagnoses[0]?.text || complaints[0]?.text || 'Inpatient observation advised',
      bedType: payload.bedType,
      priority: payload.priority,
      journeyType: payload.journeyType,
      requestedBy: user?.name || 'Doctor',
    });

    navigate(`/doctor/ipd/${result.admissionId}`);
  };

  return (
    <div className="space-y-4">
      <PatientContextBar
        patientName={patientName}
        uhid={patientId ?? ''}
        department={patient?.department || queueEntry?.department}
        doctor={queueEntry?.doctor || user?.name}
        tokenNo={queueEntry?.tokenNo}
        opdState={patient?.opdState}
        waitLabel={
          queueEntry?.waitMinutes != null
            ? formatWaitMinutes(queueEntry.waitMinutes)
            : undefined
        }
        extra={
          navayuMode && navayuBundle.mskLifecycleState ? (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-700">
              MSK: {MSK_STATE_LABELS[navayuBundle.mskLifecycleState] ?? navayuBundle.mskLifecycleState}
            </span>
          ) : undefined
        }
      />

      <ConsultationBlockerStrip opdVisitId={opdVisitId} patientName={patientName} />

      {/* Header */}
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{patientName}</h1>
            <p className="text-sm text-muted-foreground">{patientInfo}</p>
            {patientAllergies.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                  ⚠ Allergy: {patientAllergies.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('Digital')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'Digital' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Monitor className="w-3.5 h-3.5" /> Digital
            </button>
            <button onClick={() => setViewMode('Tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'Tablet' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Tablet className="w-3.5 h-3.5" /> Tablet
            </button>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Mic className="w-3.5 h-3.5" /> Voice Dictation
          </Button>
          <Button size="sm" className="gap-1.5 bg-foreground text-background hover:bg-foreground/90" onClick={() => setShowAIScribe(true)}>
            <Sparkles className="w-3.5 h-3.5" /> AI Scribe
          </Button>
        </div>
      </motion.div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-4">
        {/* Left Column */}
        <motion.div {...fadeIn(1)} className="space-y-1">
          {/* Sub-tabs */}
          <div className="flex border rounded-lg overflow-hidden mb-3">
            <button onClick={() => setLeftTab('clinical')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${leftTab === 'clinical' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
              Clinical
            </button>
            <button onClick={() => setLeftTab('orders')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${leftTab === 'orders' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
              Orders
            </button>
            <button onClick={() => setLeftTab('photos')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${leftTab === 'photos' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}>
              <Camera className="w-3 h-3" /> Photos
              {(() => {
                try {
                  const all = JSON.parse(localStorage.getItem('adrine_patient_photos') || '[]');
                  const cnt = all.filter((p: any) => p.uhid === patientId).length;
                  if (cnt > 0) return <span className="bg-primary text-primary-foreground text-[9px] px-1 rounded-full">{cnt}</span>;
                } catch {}
                return null;
              })()}
            </button>
          </div>

          {leftTab === 'clinical' ? (
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {navayuMode && patientId && (
                <NavayuIntakePanel
                  uhid={patientId}
                  visitMetadata={navayuRegistration ?? undefined}
                  intake={navayuIntake}
                />
              )}
              <ConsultationVitals vitals={vitals} onChange={setVitals} />
              <ConsultationComplaints complaints={complaints} onChange={setComplaints} hpiNotes={hpiNotes} onHPIChange={setHpiNotes} />
              {navayuMode && !navayuSenior ? (
                <>
                  <NavayuMskExamPanel
                    bodyRegions={navayuRegistration?.bodyRegions ?? ['back']}
                    examsByFormId={navayuMskExams}
                    onExamChange={handleNavayuMskExamChange}
                  />
                  <NavayuInvestigationsPanel
                    visitId={opdVisitId}
                    value={navayuInvestigations}
                    onChange={handleNavayuInvestigationsChange}
                  />
                </>
              ) : (
                <>
                  <ConsultationExamination findings={examFindings} onChange={setExamFindings} />
                  {!navayuMode ? (
                    <ConsultationDiagnosis diagnoses={diagnoses} onChange={setDiagnoses} />
                  ) : null}
                </>
              )}
              {navayuMode ? (
                <ConsultationDiagnosis diagnoses={diagnoses} onChange={setDiagnoses} />
              ) : null}
            </div>
          ) : leftTab === 'orders' ? (
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              <ConsultationOrders
                labTests={labTests} onLabChange={setLabTests}
                radiologyOrders={radiologyOrders} onRadiologyChange={setRadiologyOrders}
                procedures={procedures} onProcedureChange={setProcedures}
              />
            </div>
          ) : (
            <DoctorPhotoViewer patientId={patientId || ''} />
          )}
        </motion.div>

        {/* Center — Medications */}
        <motion.div {...fadeIn(2)}>
          <ConsultationMedications medications={medications} onChange={setMedications} allergies={patientAllergies} />
        </motion.div>

        {/* Right Column */}
        <motion.div {...fadeIn(3)} className="max-h-[calc(100vh-200px)] overflow-y-auto pr-1 space-y-3">
          {navayuMode ? (
            <>
              {navayuSenior ? (
                <NavayuAiSummaryPanel
                  visitId={opdVisitId}
                  seniorQueue={navayuSenior}
                  registration={navayuRegistration}
                  intake={navayuIntake}
                  lumbarExam={navayuLumbarExam}
                />
              ) : null}
              {navayuJunior ? (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={submittingJuniorExam}
                  onClick={() => void handleSubmitJuniorMskExam()}
                >
                  {submittingJuniorExam ? 'Submitting…' : 'Submit junior MSK exam'}
                </Button>
              ) : null}
              {navayuSenior ? (
                <>
                  <NavayuSeniorReviewForm
                    value={navayuSeniorReview}
                    onChange={handleNavayuSeniorReviewChange}
                  />
                  <NavayuProtocolMapPanel value={navayuProtocolMap} onChange={handleNavayuProtocolChange} />
                  {navayuBundle.mskLifecycleState === 'protocol_mapped' &&
                  navayuProtocolMap.protocolId &&
                  navayuProtocolMap.stageId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/billing-dept/counselling')}
                    >
                      Hand off to counsellor desk
                    </Button>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
          <ConsultationRightPanel
            advice={advice} onAdviceChange={setAdvice}
            privateNotes={privateNotes} onPrivateNotesChange={setPrivateNotes}
            followUpDays={followUpDays} onFollowUpDaysChange={setFollowUpDays}
            followUpUnit={followUpUnit} onFollowUpUnitChange={setFollowUpUnit}
            treatmentPlan={treatmentPlan} onTreatmentPlanChange={setTreatmentPlan}
            onSave={handleSaveConsultation}
            onDraft={() => {}}
            saveDisabled={saveBlockedByPlatform}
            saveDisabledReason={
              saveBlockedByPlatform
                ? 'Resolve critical lab, radiology, pharmacy, or billing blockers above before completing the visit.'
                : undefined
            }
            onPreview={() => setShowPreview(true)}
            onRecommendAdmission={handleRecommendAdmission}
          />
        </motion.div>
      </div>

      {/* AI Scribe Dialog */}
      <ConsultationAIScribe
        open={showAIScribe}
        onClose={() => setShowAIScribe(false)}
        onApply={handleAIScribeApply}
        patientName={patientName}
      />

      {/* Prescription Preview Dialog */}
      <PrescriptionPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={{
          patientName,
          patientAge: patient?.age ?? 0,
          patientGender: patient?.gender ?? 'Male',
          uhid: patientId || '',
          phone: patient?.phone,
          doctorName: user?.name || 'Dr. Doctor',
          department: patient?.department || 'General Medicine',
          vitals,
          complaints,
          diagnoses,
          medications,
          labTests,
          radiologyOrders,
          advice,
          followUpDays,
          followUpUnit,
        }}
      />
    </div>
  );
}
