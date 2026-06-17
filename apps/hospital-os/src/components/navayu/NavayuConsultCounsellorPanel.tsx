import { useMemo, useState } from 'react';
import { MessageCircle, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AppSelect } from '@/components/ui/app-select';
import { Badge } from '@/components/ui/badge';
import type { Diagnosis } from '@/pages/doctor/consultation/ConsultationDiagnosis';
import type { Medication } from '@/pages/doctor/consultation/ConsultationMedications';
import {
  listDoctorConsultTemplates,
  saveCounsellorHandoff,
  saveDoctorConsultTemplate,
  sharePrescriptionWhatsApp,
  type CounsellorHandoffPayload,
  type DoctorConsultTemplate,
} from '@/lib/navayu/navayu-opd-journey';
import { listNavayuPackageTiers } from '@/lib/navayu/navayu-protocol-engine';
import { toast } from 'sonner';

type CareMode = CounsellorHandoffPayload['careMode'];

interface Props {
  uhid: string;
  patientName: string;
  phone?: string;
  doctorName: string;
  department: string;
  diagnoses: Diagnosis[];
  treatmentPlan: string;
  advice: string;
  medications: Medication[];
  nextProcedure?: string;
  onSkipCounsellor?: () => void;
}

export function NavayuConsultCounsellorPanel({
  uhid,
  patientName,
  phone,
  doctorName,
  department,
  diagnoses,
  treatmentPlan,
  advice,
  medications,
  nextProcedure = '',
  onSkipCounsellor,
}: Props) {
  const [careMode, setCareMode] = useState<CareMode>('OPD');
  const [counselNotes, setCounselNotes] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [packageTierId, setPackageTierId] = useState('advanced');

  const templates = useMemo(() => listDoctorConsultTemplates(doctorName), [doctorName]);
  const tiers = useMemo(() => listNavayuPackageTiers(), []);
  const selectedTier = tiers.find((tier) => tier.id === packageTierId) ?? tiers[0];

  const applyTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    toast.success(`Template applied: ${template.name}`);
    setSelectedTemplateId(templateId);
  };

  const buildHandoff = (): CounsellorHandoffPayload => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    return {
      uhid,
      patientName,
      doctorName,
      department,
      diagnoses: diagnoses.length > 0 ? diagnoses : template?.diagnoses ?? [],
      treatmentPlan: treatmentPlan || template?.treatmentPlan || '',
      advice: advice || template?.advice || '',
      nextProcedure,
      medications: medications.length > 0 ? medications : template?.medications ?? [],
      packages: selectedTier
        ? [{ code: selectedTier.id, name: selectedTier.label, amountInr: selectedTier.priceInr }]
        : [],
      counselNotes,
      careMode,
      savedAt: new Date().toISOString(),
    };
  };

  const handoffToCounsellor = () => {
    const payload = buildHandoff();
    saveCounsellorHandoff(payload);
    toast.success('Handoff saved for counsellor desk', {
      description: 'Full clinical payload visible at counsellor queue.',
    });
  };

  const shareWhatsApp = () => {
    if (!phone) {
      toast.error('Patient phone required for WhatsApp share');
      return;
    }
    sharePrescriptionWhatsApp({
      phone,
      patientName,
      doctorName,
      advice,
      medications,
    });
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Counsellor handoff</h3>
        <Badge variant="outline">{careMode}</Badge>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Disease / treatment template</label>
        <AppSelect
          value={selectedTemplateId || undefined}
          onValueChange={(value) => applyTemplate(value)}
          options={templates.map((item) => ({ value: item.id, label: item.name }))}
          placeholder="Pick template to pre-fill Rx & notes"
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Suggested package</label>
        <AppSelect
          value={packageTierId}
          onValueChange={setPackageTierId}
          options={tiers.map((tier) => ({
            value: tier.id,
            label: `${tier.label} — Rs ${tier.priceInr.toLocaleString('en-IN')}`,
          }))}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Care mode</label>
        <div className="flex gap-2">
          {(['OPD', 'IPD', 'Daycare'] as CareMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCareMode(mode)}
              className={`flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium ${
                careMode === mode ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Counsel notes</label>
        <Textarea
          value={counselNotes}
          onChange={(event) => setCounselNotes(event.target.value)}
          rows={3}
          placeholder="Package rationale, patient concerns…"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handoffToCounsellor}>
          Send to counsellor
        </Button>
        <Button size="sm" variant="outline" className="gap-1" onClick={shareWhatsApp}>
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp Rx
        </Button>
        {onSkipCounsellor ? (
          <Button size="sm" variant="ghost" className="gap-1" onClick={onSkipCounsellor}>
            <SkipForward className="w-3.5 h-3.5" />
            Skip counsellor
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function seedDefaultDoctorTemplates(doctorName: string): void {
  const existing = listDoctorConsultTemplates(doctorName);
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const defaults: DoctorConsultTemplate[] = [
    {
      id: `tpl_lumbar_${doctorName.replace(/\s/g, '_')}`,
      name: 'Lumbar disc — conservative',
      diseaseOrTreatment: 'Lumbar disc prolapse',
      medications: [
        {
          id: 'med_pregabalin',
          name: 'Pregabalin',
          dosage: '75mg',
          frequency: 'OD',
          duration: '14 days',
          route: 'Oral',
          instructions: 'After food',
          isGeneric: false,
        },
      ],
      advice: 'Avoid prolonged sitting. Core strengthening after pain settles.',
      treatmentPlan: 'Physiotherapy 2×/week × 4 weeks + oral neuropathic agent',
      diagnoses: [
        {
          id: 'dx_lumbar',
          code: 'M51.1',
          text: 'Lumbar disc disorder with radiculopathy',
          type: 'primary',
          certainty: 'provisional',
        },
      ],
      createdBy: doctorName,
      createdAt: now,
    },
  ];
  defaults.forEach((item) => saveDoctorConsultTemplate(item));
}
