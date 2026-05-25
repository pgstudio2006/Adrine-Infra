import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PatientContextBar } from '@/components/clinical/PatientContextBar';
import { NursePageHeader, ClinicalTableSkeleton } from '@/components/clinical/ClinicalTableStates';
import { useHospital } from '@/stores/hospitalStore';
import {
  canUseNursingRuntime,
  platformCreateNursingNote,
  platformListNotesForAdmission,
  type PlatformNursingNote,
} from '@/runtime/nursing-runtime';
import { formatPlatformErrorBody, PlatformApiError } from '@/runtime/platform-client';

const NOTE_TYPES = ['Progress', 'Handover', 'Assessment', 'Incident', 'Discharge prep'] as const;

export default function NurseNotesEditor() {
  const { admissionId = '' } = useParams();
  const { admissions, patients } = useHospital();
  const platformOk = canUseNursingRuntime();

  const admission = admissions.find((a) => a.id === admissionId);
  const patient = admission ? patients.find((p) => p.uhid === admission.uhid) : undefined;

  const [notes, setNotes] = useState<PlatformNursingNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteType, setNoteType] = useState<(typeof NOTE_TYPES)[number]>('Progress');
  const [body, setBody] = useState('');
  const [nurseName, setNurseName] = useState('Nurse Priya');

  const refresh = useCallback(async () => {
    if (!admission?.platformAdmissionId || !platformOk) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await platformListNotesForAdmission(admission.platformAdmissionId);
      setNotes(rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (err) {
      const msg =
        formatPlatformErrorBody(err instanceof PlatformApiError ? err.body : undefined)
        ?? (err instanceof Error ? err.message : 'Could not load notes');
      toast.error('Failed to load nursing notes', { description: msg });
    } finally {
      setLoading(false);
    }
  }, [admission?.platformAdmissionId, platformOk]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSave = async () => {
    if (!admission?.platformAdmissionId || !patient?.platformPatientId) {
      toast.error('Platform-linked admission and patient are required to save notes.');
      return;
    }
    if (!body.trim()) {
      toast.error('Enter note text before saving.');
      return;
    }
    setSaving(true);
    try {
      await platformCreateNursingNote({
        admissionId: admission.platformAdmissionId,
        patientId: patient.platformPatientId,
        nurse: nurseName.trim() || 'Nurse',
        noteType,
        body: body.trim(),
      });
      toast.success('Nursing note saved');
      setBody('');
      await refresh();
    } catch (err) {
      const msg =
        formatPlatformErrorBody(err instanceof PlatformApiError ? err.body : undefined)
        ?? (err instanceof Error ? err.message : 'Save rejected');
      toast.error('Could not save note', { description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!admission) {
    return (
      <div className="space-y-4">
        <NursePageHeader title="Nursing notes" description="Admission not found." />
        <Button variant="outline" asChild>
          <Link to="/nurse/ward">Back to ward</Link>
        </Button>
      </div>
    );
  }

  const platformLinked = Boolean(admission.platformAdmissionId);

  return (
    <div className="space-y-6">
      <PatientContextBar
        patientName={admission.patientName}
        uhid={admission.uhid}
        ward={admission.ward}
        bed={admission.bed}
        status={admission.status}
        attendingDoctor={admission.attendingDoctor}
        platformLinked={platformLinked}
        backTo="/nurse/ward"
      />

      <NursePageHeader
        title="Nursing notes"
        description={
          platformLinked && platformOk
            ? 'Document bedside observations — persisted via POST/GET /nursing/notes.'
            : 'Link this admission to the platform to use the governed nursing notes API.'
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!platformLinked || !platformOk ? (
              <p className="text-sm text-muted-foreground">
                Nursing notes require platform runtime and a synced IPD admission. Ward roster updates remain
                local until the patient is on domain-api.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Note type</Label>
                    <Select value={noteType} onValueChange={(v) => setNoteType(v as (typeof NOTE_TYPES)[number])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Documented by</Label>
                    <Select value={nurseName} onValueChange={setNurseName}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Nurse Priya', 'Nurse Rekha', 'Nurse Sunita', 'Nurse Kavita'].map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Note</Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Subjective findings, interventions, patient response…"
                    className="min-h-[160px]"
                  />
                </div>
                <Button disabled={saving} onClick={() => void handleSave()}>
                  <Save className="mr-1 h-4 w-4" />
                  {saving ? 'Saving…' : 'Save note'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                <ClinicalTableSkeleton rows={4} colSpan={1} />
              </div>
            ) : notes.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No nursing notes yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {notes.map((note) => (
                  <div key={note.id} className="px-4 py-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {note.noteType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString('en-IN')} · {note.nurse}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
