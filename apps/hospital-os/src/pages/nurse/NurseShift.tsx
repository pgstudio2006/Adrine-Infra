import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowRightLeft, ClipboardCheck, Send } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useAuth } from "@/contexts/AuthContext";
import { useClinicalPlatformListSync } from "@/hooks/useClinicalPlatformListSync";
import {
  canUseNursingRuntime,
  platformCreateNursingNote,
} from "@/runtime/nursing-runtime";
import { formatPlatformErrorBody, PlatformApiError } from "@/runtime/platform-client";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { PatientContextBar } from "@/components/clinical/PatientContextBar";
import { NursePageHeader } from "@/components/clinical/ClinicalTableStates";

const SHIFTS = ["Morning", "Evening", "Night"] as const;

type SbarForm = {
  shift: (typeof SHIFTS)[number];
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  priority: "routine" | "watch" | "urgent";
};

const EMPTY_FORM: SbarForm = {
  shift: "Morning",
  situation: "",
  background: "",
  assessment: "",
  recommendation: "",
  priority: "routine",
};

function buildSbarBody(form: SbarForm, nurse: string): string {
  return [
    `SBAR HANDOVER · ${form.shift} shift · priority ${form.priority.toUpperCase()}`,
    `Outgoing nurse: ${nurse}`,
    "",
    `S (Situation): ${form.situation || "—"}`,
    `B (Background): ${form.background || "—"}`,
    `A (Assessment): ${form.assessment || "—"}`,
    `R (Recommendation): ${form.recommendation || "—"}`,
  ].join("\n");
}

export default function NurseShift() {
  const { admissions, nursingRounds } = useHospital();
  const { user } = useAuth();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });
  const platformOn = canUseNursingRuntime();
  const nurseName = user?.name ?? "Nurse";

  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "discharged"),
    [admissions],
  );

  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<SbarForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const selected = activeAdmissions.find((a) => a.id === selectedId) ?? null;
  const platformLinked = Boolean(selected?.platformAdmissionId && selected?.platformPatientId);

  const recentHandovers = useMemo(
    () => nursingRounds.filter((r) => Boolean(r.notes)).slice(0, 10),
    [nursingRounds],
  );

  const update = (patch: Partial<SbarForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!selected) {
      toast.error("Select a patient for handover.");
      return;
    }
    if (!form.situation.trim() && !form.assessment.trim()) {
      toast.error("Add at least a Situation and Assessment.");
      return;
    }
    setSaving(true);
    try {
      const body = buildSbarBody(form, nurseName);
      if (platformOn && platformLinked) {
        try {
          await platformCreateNursingNote({
            admissionId: selected.platformAdmissionId!,
            patientId: selected.platformPatientId!,
            nurse: nurseName,
            noteType: "Handover",
            body,
          });
          toast.success("SBAR handover saved to platform", {
            description: "Stored as a Handover nursing note on the admission record.",
          });
        } catch (err) {
          const msg =
            formatPlatformErrorBody(err instanceof PlatformApiError ? err.body : undefined) ??
            (err instanceof Error ? err.message : "Platform save rejected");
          toast.warning("Saved locally only", { description: msg });
        }
      } else {
        toast.success("SBAR handover recorded (local)", {
          description: platformOn
            ? "Admission is not platform-linked yet — note kept on this device."
            : "Platform runtime is off — note kept on this device.",
        });
      }
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Shift handoff"
          detail={`${activeAdmissions.length} active patient(s) · SBAR notes persist on platform-linked admissions`}
        />
      )}

      <NursePageHeader
        title="Shift overview & handoff"
        description="Structured SBAR handover for the oncoming shift, with a quick acuity snapshot."
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link to="/nurse/ward">
              <ArrowRightLeft className="mr-1 h-4 w-4" />
              Ward board
            </Link>
          </Button>
        }
      />

      {selected ? (
        <PatientContextBar
          patientName={selected.patientName}
          uhid={selected.uhid}
          ward={selected.ward}
          bed={selected.bed}
          status={selected.status}
          attendingDoctor={selected.attendingDoctor}
          platformLinked={platformLinked}
        />
      ) : null}

      <Tabs defaultValue="handoff">
        <TabsList>
          <TabsTrigger value="handoff">
            <Send className="mr-1 h-3.5 w-3.5" />
            New SBAR
          </TabsTrigger>
          <TabsTrigger value="recent">
            <ClipboardCheck className="mr-1 h-3.5 w-3.5" />
            Recent handovers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="handoff" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SBAR handover</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!platformLinked && (
                <Alert>
                  <AlertTitle>{platformOn ? "Not platform-linked" : "Preview"}</AlertTitle>
                  <AlertDescription className="text-xs">
                    {platformOn
                      ? "This admission has no platform id yet — the handover is kept locally until it is linked."
                      : "Platform runtime is off. Handover is recorded locally for the shift roster."}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
                <div>
                  <Label>Patient</Label>
                  <Select value={selectedId} onValueChange={setSelectedId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inpatient" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAdmissions.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.patientName} · {a.ward}/{a.bed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shift</Label>
                  <Select value={form.shift} onValueChange={(v) => update({ shift: v as SbarForm["shift"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => update({ priority: v as SbarForm["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="watch">Watch</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>S — Situation</Label>
                  <Textarea
                    value={form.situation}
                    onChange={(e) => update({ situation: e.target.value })}
                    placeholder="Current status, presenting concern, code status…"
                  />
                </div>
                <div>
                  <Label>B — Background</Label>
                  <Textarea
                    value={form.background}
                    onChange={(e) => update({ background: e.target.value })}
                    placeholder="Diagnosis, relevant history, allergies, lines/drains…"
                  />
                </div>
                <div>
                  <Label>A — Assessment</Label>
                  <Textarea
                    value={form.assessment}
                    onChange={(e) => update({ assessment: e.target.value })}
                    placeholder="Latest vitals trend, pain, intake/output, mental status…"
                  />
                </div>
                <div>
                  <Label>R — Recommendation</Label>
                  <Textarea
                    value={form.recommendation}
                    onChange={(e) => update({ recommendation: e.target.value })}
                    placeholder="Pending tasks, watch parameters, escalation criteria…"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={saving} onClick={() => void handleSubmit()}>
                  <Send className="mr-1 h-4 w-4" />
                  {saving ? "Saving…" : "Save handover"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent shift notes</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {recentHandovers.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No shift notes recorded yet. Record vitals or save an SBAR handover to populate this list.
                </p>
              ) : (
                recentHandovers.map((round) => (
                  <div key={round.id} className="px-4 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {round.patientName}{" "}
                          <span className="font-normal text-muted-foreground">· {round.uhid}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {round.nurse} · {round.shift} · {round.ward} · {round.bed}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">{round.recordedAt}</Badge>
                    </div>
                    <p className="rounded bg-muted/50 p-2 text-sm text-foreground">{round.notes}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
