import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, Save, Target, Trash2 } from "lucide-react";
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
import { NursePageHeader, ClinicalTableEmptyRow } from "@/components/clinical/ClinicalTableStates";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CarePlanEntry = {
  id: string;
  diagnosis: string;
  goal: string;
  interventions: string;
  status: "active" | "met" | "discontinued";
};

let seq = 0;
const newId = () => `cp-${Date.now()}-${seq++}`;

const statusVariant: Record<CarePlanEntry["status"], "outline" | "secondary" | "destructive"> = {
  active: "secondary",
  met: "outline",
  discontinued: "destructive",
};

export default function NurseCarePlan() {
  const { admissions } = useHospital();
  const { user } = useAuth();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });
  const platformOn = canUseNursingRuntime();
  const nurseName = user?.name ?? "Nurse";

  const activeAdmissions = useMemo(
    () => admissions.filter((a) => a.status !== "discharged"),
    [admissions],
  );

  const [selectedId, setSelectedId] = useState("");
  const [entries, setEntries] = useState<CarePlanEntry[]>([]);
  const [draft, setDraft] = useState<Omit<CarePlanEntry, "id">>({
    diagnosis: "",
    goal: "",
    interventions: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);

  const selected = activeAdmissions.find((a) => a.id === selectedId) ?? null;
  const platformLinked = Boolean(selected?.platformAdmissionId && selected?.platformPatientId);

  const addEntry = () => {
    if (!draft.diagnosis.trim() || !draft.goal.trim()) {
      toast.error("Add a nursing diagnosis and a goal.");
      return;
    }
    setEntries((prev) => [...prev, { ...draft, id: newId() }]);
    setDraft({ diagnosis: "", goal: "", interventions: "", status: "active" });
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const buildBody = () =>
    [
      "NURSING CARE PLAN",
      `Nurse: ${nurseName}`,
      `Entries: ${entries.length}`,
      "",
      ...entries.flatMap((e, i) => [
        `${i + 1}. [${e.status.toUpperCase()}] ${e.diagnosis}`,
        `   Goal: ${e.goal}`,
        `   Interventions: ${e.interventions || "—"}`,
      ]),
    ].join("\n");

  const handleSave = async () => {
    if (!selected) {
      toast.error("Select a patient.");
      return;
    }
    if (entries.length === 0) {
      toast.error("Add at least one care plan entry.");
      return;
    }
    setSaving(true);
    try {
      const body = buildBody();
      if (platformOn && platformLinked) {
        try {
          await platformCreateNursingNote({
            admissionId: selected.platformAdmissionId!,
            patientId: selected.platformPatientId!,
            nurse: nurseName,
            noteType: "CarePlan",
            body,
          });
          toast.success("Care plan saved to platform", {
            description: "Stored as a CarePlan nursing note on the admission record.",
          });
        } catch (err) {
          const msg =
            formatPlatformErrorBody(err instanceof PlatformApiError ? err.body : undefined) ??
            (err instanceof Error ? err.message : "Platform save rejected");
          toast.warning("Saved locally only", { description: msg });
        }
      } else {
        toast.success("Care plan recorded (local)", {
          description: platformOn
            ? "Admission not platform-linked — kept on this device."
            : "Platform runtime off — kept on this device.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Care plan"
          detail="Care plan entries persist as a CarePlan note on platform-linked admissions."
        />
      )}

      <NursePageHeader
        title="Nursing care plan"
        description="Problem-oriented (NANDA-style) diagnoses with goals and interventions."
        actions={
          <Button size="sm" disabled={saving || !selected || entries.length === 0} onClick={() => void handleSave()}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? "Saving…" : "Save care plan"}
          </Button>
        }
      />

      <Card className="border-border">
        <CardContent className="space-y-3 p-4">
          <Label>Patient</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="md:max-w-md">
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
          {selected && !platformLinked ? (
            <Alert>
              <AlertTitle>{platformOn ? "Not platform-linked" : "Preview"}</AlertTitle>
              <AlertDescription className="text-xs">
                Care plan is kept locally until the admission is platform-linked.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" /> Add care plan entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nursing diagnosis / problem</Label>
              <Input
                value={draft.diagnosis}
                onChange={(e) => setDraft((p) => ({ ...p, diagnosis: e.target.value }))}
                placeholder="e.g. Risk for impaired skin integrity"
              />
            </div>
            <div>
              <Label>Goal / expected outcome</Label>
              <Input
                value={draft.goal}
                onChange={(e) => setDraft((p) => ({ ...p, goal: e.target.value }))}
                placeholder="e.g. Skin intact through admission"
              />
            </div>
          </div>
          <div>
            <Label>Interventions</Label>
            <Textarea
              value={draft.interventions}
              onChange={(e) => setDraft((p) => ({ ...p, interventions: e.target.value }))}
              placeholder="2-hourly repositioning, pressure-relieving mattress, daily skin check…"
            />
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="w-40">
              <Label>Status</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft((p) => ({ ...p, status: v as CarePlanEntry["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="met">Met</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={addEntry}>
              <Plus className="mr-1 h-4 w-4" />
              Add entry
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Care plan ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Goal</TableHead>
                <TableHead>Interventions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <ClinicalTableEmptyRow
                  colSpan={5}
                  title="No care plan entries"
                  description="Add a nursing diagnosis above to start the care plan."
                />
              ) : (
                entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm font-medium">{e.diagnosis}</TableCell>
                    <TableCell className="text-sm">{e.goal}</TableCell>
                    <TableCell className="max-w-[260px] text-xs text-muted-foreground">
                      {e.interventions || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[e.status]} className="text-xs capitalize">
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => removeEntry(e.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
