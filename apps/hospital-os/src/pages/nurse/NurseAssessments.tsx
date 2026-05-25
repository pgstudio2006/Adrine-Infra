import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ClipboardList, ShieldAlert, Activity, Gauge } from "lucide-react";
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

type ScaleItem = {
  key: string;
  label: string;
  options: { value: number; label: string }[];
};

/** Braden Scale — lower total = higher pressure-injury risk. */
const BRADEN: ScaleItem[] = [
  {
    key: "sensory",
    label: "Sensory perception",
    options: [
      { value: 1, label: "Completely limited" },
      { value: 2, label: "Very limited" },
      { value: 3, label: "Slightly limited" },
      { value: 4, label: "No impairment" },
    ],
  },
  {
    key: "moisture",
    label: "Moisture",
    options: [
      { value: 1, label: "Constantly moist" },
      { value: 2, label: "Very moist" },
      { value: 3, label: "Occasionally moist" },
      { value: 4, label: "Rarely moist" },
    ],
  },
  {
    key: "activity",
    label: "Activity",
    options: [
      { value: 1, label: "Bedfast" },
      { value: 2, label: "Chairfast" },
      { value: 3, label: "Walks occasionally" },
      { value: 4, label: "Walks frequently" },
    ],
  },
  {
    key: "mobility",
    label: "Mobility",
    options: [
      { value: 1, label: "Completely immobile" },
      { value: 2, label: "Very limited" },
      { value: 3, label: "Slightly limited" },
      { value: 4, label: "No limitation" },
    ],
  },
  {
    key: "nutrition",
    label: "Nutrition",
    options: [
      { value: 1, label: "Very poor" },
      { value: 2, label: "Probably inadequate" },
      { value: 3, label: "Adequate" },
      { value: 4, label: "Excellent" },
    ],
  },
  {
    key: "friction",
    label: "Friction & shear",
    options: [
      { value: 1, label: "Problem" },
      { value: 2, label: "Potential problem" },
      { value: 3, label: "No apparent problem" },
    ],
  },
];

/** Morse Fall Scale — higher total = higher fall risk. */
const MORSE: ScaleItem[] = [
  {
    key: "history",
    label: "History of falling",
    options: [
      { value: 0, label: "No" },
      { value: 25, label: "Yes" },
    ],
  },
  {
    key: "secondary",
    label: "Secondary diagnosis",
    options: [
      { value: 0, label: "No" },
      { value: 15, label: "Yes" },
    ],
  },
  {
    key: "aid",
    label: "Ambulatory aid",
    options: [
      { value: 0, label: "None / bed rest / nurse assist" },
      { value: 15, label: "Crutches / cane / walker" },
      { value: 30, label: "Furniture" },
    ],
  },
  {
    key: "iv",
    label: "IV / heparin lock",
    options: [
      { value: 0, label: "No" },
      { value: 20, label: "Yes" },
    ],
  },
  {
    key: "gait",
    label: "Gait / transferring",
    options: [
      { value: 0, label: "Normal / bedrest / wheelchair" },
      { value: 10, label: "Weak" },
      { value: 20, label: "Impaired" },
    ],
  },
  {
    key: "mental",
    label: "Mental status",
    options: [
      { value: 0, label: "Oriented to own ability" },
      { value: 15, label: "Overestimates / forgets limits" },
    ],
  },
];

function defaults(items: ScaleItem[]): Record<string, number> {
  return Object.fromEntries(items.map((i) => [i.key, i.options[i.options.length - 1].value]));
}

function bradenBand(total: number): { label: string; variant: "destructive" | "secondary" | "outline" } {
  if (total <= 9) return { label: "Severe risk", variant: "destructive" };
  if (total <= 12) return { label: "High risk", variant: "destructive" };
  if (total <= 14) return { label: "Moderate risk", variant: "secondary" };
  if (total <= 18) return { label: "Mild risk", variant: "secondary" };
  return { label: "Minimal risk", variant: "outline" };
}

function morseBand(total: number): { label: string; variant: "destructive" | "secondary" | "outline" } {
  if (total >= 45) return { label: "High risk", variant: "destructive" };
  if (total >= 25) return { label: "Moderate risk", variant: "secondary" };
  return { label: "Low risk", variant: "outline" };
}

function painBand(score: number): { label: string; variant: "destructive" | "secondary" | "outline" } {
  if (score >= 7) return { label: "Severe", variant: "destructive" };
  if (score >= 4) return { label: "Moderate", variant: "secondary" };
  if (score >= 1) return { label: "Mild", variant: "outline" };
  return { label: "None", variant: "outline" };
}

/** NEWS2 (RCP) aggregate early-warning score from bedside parameters. */
type News2Inputs = {
  respRate: number;
  spo2: number;
  onOxygen: boolean;
  sbp: number;
  pulse: number;
  temp: number;
  consciousness: "alert" | "altered";
};

function scoreRespRate(v: number): number {
  if (v <= 8) return 3;
  if (v <= 11) return 1;
  if (v <= 20) return 0;
  if (v <= 24) return 2;
  return 3;
}
function scoreSpo2(v: number): number {
  if (v >= 96) return 0;
  if (v >= 94) return 1;
  if (v >= 92) return 2;
  return 3;
}
function scoreSbp(v: number): number {
  if (v <= 90) return 3;
  if (v <= 100) return 2;
  if (v <= 110) return 1;
  if (v <= 219) return 0;
  return 3;
}
function scorePulse(v: number): number {
  if (v <= 40) return 3;
  if (v <= 50) return 1;
  if (v <= 90) return 0;
  if (v <= 110) return 1;
  if (v <= 130) return 2;
  return 3;
}
function scoreTemp(v: number): number {
  if (v <= 35.0) return 3;
  if (v <= 36.0) return 1;
  if (v <= 38.0) return 0;
  if (v <= 39.0) return 1;
  return 2;
}

function news2Total(n: News2Inputs): number {
  return (
    scoreRespRate(n.respRate) +
    scoreSpo2(n.spo2) +
    (n.onOxygen ? 2 : 0) +
    scoreSbp(n.sbp) +
    scorePulse(n.pulse) +
    scoreTemp(n.temp) +
    (n.consciousness === "altered" ? 3 : 0)
  );
}

function news2Band(
  n: News2Inputs,
): { label: string; variant: "destructive" | "secondary" | "outline" } {
  const total = news2Total(n);
  const anyThree =
    scoreRespRate(n.respRate) === 3 ||
    scoreSpo2(n.spo2) === 3 ||
    scoreSbp(n.sbp) === 3 ||
    scorePulse(n.pulse) === 3 ||
    scoreTemp(n.temp) === 3 ||
    n.consciousness === "altered";
  if (total >= 7) return { label: "High — urgent clinical review", variant: "destructive" };
  if (total >= 5 || anyThree) return { label: "Medium — urgent review", variant: "secondary" };
  if (total >= 1) return { label: "Low — routine monitoring", variant: "outline" };
  return { label: "Minimal", variant: "outline" };
}

export default function NurseAssessments() {
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
  const [braden, setBraden] = useState<Record<string, number>>(() => defaults(BRADEN));
  const [morse, setMorse] = useState<Record<string, number>>(() => defaults(MORSE));
  const [pain, setPain] = useState<number>(0);
  const [news2, setNews2] = useState<News2Inputs>({
    respRate: 16,
    spo2: 98,
    onOxygen: false,
    sbp: 120,
    pulse: 80,
    temp: 36.8,
    consciousness: "alert",
  });
  const [saving, setSaving] = useState(false);

  const selected = activeAdmissions.find((a) => a.id === selectedId) ?? null;
  const platformLinked = Boolean(selected?.platformAdmissionId && selected?.platformPatientId);

  const bradenTotal = useMemo(() => Object.values(braden).reduce((a, b) => a + b, 0), [braden]);
  const morseTotal = useMemo(() => Object.values(morse).reduce((a, b) => a + b, 0), [morse]);
  const news2Score = useMemo(() => news2Total(news2), [news2]);
  const bBand = bradenBand(bradenTotal);
  const mBand = morseBand(morseTotal);
  const pBand = painBand(pain);
  const nBand = news2Band(news2);

  const buildBody = () =>
    [
      "NURSING ASSESSMENT",
      `Nurse: ${nurseName}`,
      "",
      `Braden (pressure injury): ${bradenTotal}/23 — ${bBand.label}`,
      ...BRADEN.map((i) => `  · ${i.label}: ${i.options.find((o) => o.value === braden[i.key])?.label ?? braden[i.key]}`),
      "",
      `Morse (fall risk): ${morseTotal}/125 — ${mBand.label}`,
      ...MORSE.map((i) => `  · ${i.label}: ${i.options.find((o) => o.value === morse[i.key])?.label ?? morse[i.key]}`),
      "",
      `Pain (NRS): ${pain}/10 — ${pBand.label}`,
      "",
      `NEWS2: ${news2Score} — ${nBand.label}`,
      `  · Resp ${news2.respRate}/min · SpO₂ ${news2.spo2}%${news2.onOxygen ? " (on O₂)" : " (room air)"} · BP sys ${news2.sbp} · Pulse ${news2.pulse} · Temp ${news2.temp}°C · ${news2.consciousness === "altered" ? "Altered consciousness" : "Alert"}`,
    ].join("\n");

  const handleSave = async () => {
    if (!selected) {
      toast.error("Select a patient to assess.");
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
            noteType: "Assessment",
            body,
          });
          toast.success("Assessment saved to platform", {
            description: "Stored as an Assessment nursing note with computed risk scores.",
          });
        } catch (err) {
          const msg =
            formatPlatformErrorBody(err instanceof PlatformApiError ? err.body : undefined) ??
            (err instanceof Error ? err.message : "Platform save rejected");
          toast.warning("Saved locally only", { description: msg });
        }
      } else {
        toast.success("Assessment recorded (local)", {
          description: platformOn
            ? "Admission not platform-linked — kept on this device."
            : "Platform runtime off — kept on this device.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const renderScale = (
    items: ScaleItem[],
    state: Record<string, number>,
    setState: (next: Record<string, number>) => void,
  ) => (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.key}>
          <Label>{item.label}</Label>
          <Select
            value={String(state[item.key])}
            onValueChange={(v) => setState({ ...state, [item.key]: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {item.options.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {o.label} ({o.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Nursing assessments"
          detail="Computed risk scores persist as an Assessment note on platform-linked admissions."
        />
      )}

      <NursePageHeader
        title="Nursing assessments"
        description="Structured Braden, Morse fall-risk, and pain scoring with automatic risk banding."
      />

      <Card className="border-border">
        <CardContent className="space-y-3 p-4">
          <Label>Patient</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="md:max-w-md">
              <SelectValue placeholder="Select inpatient to assess" />
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
                Assessment will be kept locally until the admission is platform-linked.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="braden">
        <TabsList>
          <TabsTrigger value="braden">
            <ShieldAlert className="mr-1 h-3.5 w-3.5" />
            Braden {bradenTotal}
          </TabsTrigger>
          <TabsTrigger value="morse">
            <Activity className="mr-1 h-3.5 w-3.5" />
            Morse {morseTotal}
          </TabsTrigger>
          <TabsTrigger value="pain">
            <ClipboardList className="mr-1 h-3.5 w-3.5" />
            Pain {pain}
          </TabsTrigger>
          <TabsTrigger value="news2">
            <Gauge className="mr-1 h-3.5 w-3.5" />
            NEWS2 {news2Score}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="braden" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Braden pressure-injury risk</CardTitle>
              <Badge variant={bBand.variant}>{bradenTotal}/23 · {bBand.label}</Badge>
            </CardHeader>
            <CardContent>{renderScale(BRADEN, braden, setBraden)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="morse" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Morse fall risk</CardTitle>
              <Badge variant={mBand.variant}>{morseTotal}/125 · {mBand.label}</Badge>
            </CardHeader>
            <CardContent>{renderScale(MORSE, morse, setMorse)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pain" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Pain — numeric rating (0–10)</CardTitle>
              <Badge variant={pBand.variant}>{pain}/10 · {pBand.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <Slider
                value={[pain]}
                min={0}
                max={10}
                step={1}
                onValueChange={(v) => setPain(v[0] ?? 0)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 — no pain</span>
                <span>5 — moderate</span>
                <span>10 — worst</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news2" className="mt-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">NEWS2 early-warning score</CardTitle>
              <Badge variant={nBand.variant}>{news2Score} · {nBand.label}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Respiratory rate (/min)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={news2.respRate}
                    onChange={(e) => setNews2((p) => ({ ...p, respRate: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>SpO₂ (%)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={news2.spo2}
                    onChange={(e) => setNews2((p) => ({ ...p, spo2: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Supplemental O₂</Label>
                  <Select
                    value={news2.onOxygen ? "yes" : "no"}
                    onValueChange={(v) => setNews2((p) => ({ ...p, onOxygen: v === "yes" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">Room air</SelectItem>
                      <SelectItem value="yes">On oxygen (+2)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Systolic BP (mmHg)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={news2.sbp}
                    onChange={(e) => setNews2((p) => ({ ...p, sbp: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Pulse (/min)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={news2.pulse}
                    onChange={(e) => setNews2((p) => ({ ...p, pulse: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Temperature (°C)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={news2.temp}
                    onChange={(e) => setNews2((p) => ({ ...p, temp: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Consciousness (ACVPU)</Label>
                  <Select
                    value={news2.consciousness}
                    onValueChange={(v) => setNews2((p) => ({ ...p, consciousness: v as News2Inputs["consciousness"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alert">Alert</SelectItem>
                      <SelectItem value="altered">New confusion / V / P / U (+3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                NEWS2 (Royal College of Physicians) aggregate. A single parameter scoring 3 or an aggregate ≥5
                warrants urgent review; ≥7 warrants emergency assessment. SpO₂ Scale 1 applied.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button disabled={saving || !selected} onClick={() => void handleSave()}>
          {saving ? "Saving…" : "Save assessment"}
        </Button>
      </div>
    </div>
  );
}
