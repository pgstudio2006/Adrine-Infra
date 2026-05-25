import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowDownToLine, ArrowUpFromLine, Droplets, Plus, Save, Trash2 } from "lucide-react";
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

type IoKind = "intake" | "output";

type IoEntry = {
  id: string;
  kind: IoKind;
  category: string;
  volumeMl: number;
  at: string;
};

const INTAKE_CATEGORIES = ["Oral", "IV fluids", "IV medication", "Tube feed", "Blood product"];
const OUTPUT_CATEGORIES = ["Urine", "Drain", "Vomitus", "Stool", "NG aspirate", "Blood loss"];

let seq = 0;
const newId = () => `io-${Date.now()}-${seq++}`;

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function NurseIO() {
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
  const [entries, setEntries] = useState<IoEntry[]>([]);
  const [kind, setKind] = useState<IoKind>("intake");
  const [category, setCategory] = useState(INTAKE_CATEGORIES[0]);
  const [volume, setVolume] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = activeAdmissions.find((a) => a.id === selectedId) ?? null;
  const platformLinked = Boolean(selected?.platformAdmissionId && selected?.platformPatientId);

  const totals = useMemo(() => {
    const intake = entries.filter((e) => e.kind === "intake").reduce((s, e) => s + e.volumeMl, 0);
    const output = entries.filter((e) => e.kind === "output").reduce((s, e) => s + e.volumeMl, 0);
    return { intake, output, net: intake - output };
  }, [entries]);

  const onKindChange = (next: IoKind) => {
    setKind(next);
    setCategory(next === "intake" ? INTAKE_CATEGORIES[0] : OUTPUT_CATEGORIES[0]);
  };

  const addEntry = () => {
    const vol = Number(volume);
    if (!Number.isFinite(vol) || vol <= 0) {
      toast.error("Enter a valid volume in mL.");
      return;
    }
    setEntries((prev) => [
      { id: newId(), kind, category, volumeMl: Math.round(vol), at: nowLabel() },
      ...prev,
    ]);
    setVolume("");
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const buildBody = () =>
    [
      "INTAKE / OUTPUT SUMMARY",
      `Nurse: ${nurseName}`,
      `Total intake: ${totals.intake} mL`,
      `Total output: ${totals.output} mL`,
      `Net balance: ${totals.net >= 0 ? "+" : ""}${totals.net} mL`,
      "",
      ...entries.map((e) => `  ${e.at} · ${e.kind === "intake" ? "IN " : "OUT"} · ${e.category}: ${e.volumeMl} mL`),
    ].join("\n");

  const handleSave = async () => {
    if (!selected) {
      toast.error("Select a patient.");
      return;
    }
    if (entries.length === 0) {
      toast.error("Add at least one intake or output entry.");
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
            noteType: "IntakeOutput",
            body,
          });
          toast.success("I/O summary saved to platform", {
            description: "Stored as an IntakeOutput nursing note. Running totals stay on this device.",
          });
        } catch (err) {
          const msg =
            formatPlatformErrorBody(err instanceof PlatformApiError ? err.body : undefined) ??
            (err instanceof Error ? err.message : "Platform save rejected");
          toast.warning("Saved locally only", { description: msg });
        }
      } else {
        toast.success("I/O summary recorded (local)", {
          description: platformOn
            ? "Admission not platform-linked — kept on this device."
            : "Platform runtime off — kept on this device.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const categories = kind === "intake" ? INTAKE_CATEGORIES : OUTPUT_CATEGORIES;

  return (
    <div className="space-y-6">
      {platformOn ? (
        <PlatformConnectivityStrip
          label="Intake / output"
          detail="Running fluid balance is local; a summary note persists on platform-linked admissions."
        />
      ) : null}

      <NursePageHeader
        title="Intake / output balance"
        description="Track fluid intake and output and compute net balance for the shift."
        actions={
          <Button size="sm" disabled={saving || !selected || entries.length === 0} onClick={() => void handleSave()}>
            <Save className="mr-1 h-4 w-4" />
            {saving ? "Saving…" : "Save summary"}
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
          ) : (
            <Alert>
              <AlertTitle>Preview</AlertTitle>
              <AlertDescription className="text-xs">
                Intake/output is recorded per shift on this device. Select a platform-linked patient to also
                persist a summary note.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Intake</span>
              <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totals.intake} mL</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Output</span>
              <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totals.output} mL</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Net balance</span>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {totals.net >= 0 ? "+" : ""}
              {totals.net} mL
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Add entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[150px_1fr_150px_auto] md:items-end">
            <div>
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => onKindChange(v as IoKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intake">Intake</SelectItem>
                  <SelectItem value="output">Output</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Volume (mL)</Label>
              <Input
                type="number"
                inputMode="numeric"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="e.g. 200"
              />
            </div>
            <Button onClick={addEntry}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <ClinicalTableEmptyRow
                  colSpan={5}
                  title="No entries"
                  description="Add an intake or output entry to start the balance."
                />
              ) : (
                entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{e.at}</TableCell>
                    <TableCell>
                      <Badge variant={e.kind === "intake" ? "secondary" : "outline"} className="text-xs capitalize">
                        {e.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{e.category}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{e.volumeMl} mL</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => removeEntry(e.id)}>
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
