import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Droplets, Heart, LineChart, Search, Thermometer, Wind } from "lucide-react";
import { useHospital, type NursingRound } from "@/stores/hospitalStore";
import {
  ClinicalTableEmptyRow,
  ClinicalTableLoadingRow,
  NursePageHeader,
} from "@/components/clinical/ClinicalTableStates";
import {
  canUseNursingRuntime,
  platformListVitalsForAdmission,
  platformRecordVitals,
} from "@/runtime/nursing-runtime";
import { formatPlatformErrorBody, PlatformApiError } from "@/runtime/platform-client";

const painColor = (score: number) => {
  if (score >= 7) return "destructive";
  if (score >= 4) return "secondary";
  return "outline";
};

const shiftOptions = ["Morning", "Evening", "Night"] as const;

export default function NurseVitals() {
  const { admissions, patients, nursingRounds, addNursingRound } = useHospital();
  const platformOk = canUseNursingRuntime();
  const [platformRounds, setPlatformRounds] = useState<NursingRound[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [shift, setShift] = useState<(typeof shiftOptions)[number]>("Morning");
  const [roundForm, setRoundForm] = useState({
    nurse: "Nurse Priya",
    bp: "120/80",
    pulse: 80,
    temp: 98.6,
    spo2: 98,
    painScore: 2,
    notes: "",
  });

  const activeAdmissions = useMemo(() => admissions.filter((admission) => admission.status !== "discharged"), [admissions]);

  const ipdPlatformAdmissions = useMemo(
    () => activeAdmissions.filter((a) => !!a.platformAdmissionId),
    [activeAdmissions],
  );

  const refreshPlatformVitals = useCallback(async () => {
    if (!platformOk || ipdPlatformAdmissions.length === 0) {
      setPlatformRounds([]);
      return;
    }
    setLoading(true);
    try {
      const bundles = await Promise.all(
        ipdPlatformAdmissions.map(async (adm) => {
          const rows = await platformListVitalsForAdmission(adm.platformAdmissionId!);
          const patient = patients.find((p) => p.uhid === adm.uhid);
          return rows.map((v) => ({
            id: v.id,
            admissionId: adm.id,
            uhid: adm.uhid,
            patientName: adm.patientName,
            ward: adm.ward,
            bed: adm.bed,
            nurse: v.nurse,
            shift: (v.shift as NursingRound["shift"]) || "Morning",
            bp: v.bp,
            pulse: v.pulse,
            temp: v.temp,
            spo2: v.spo2,
            painScore: v.painScore,
            notes: v.notes ?? "",
            recordedAt: new Date(v.recordedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
          }));
        }),
      );
      setPlatformRounds(bundles.flat());
    } catch (err) {
      const body = err instanceof PlatformApiError ? err.body : undefined;
      toast.error("Could not load vitals", {
        description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
      });
    } finally {
      setLoading(false);
    }
  }, [platformOk, ipdPlatformAdmissions, patients]);

  useEffect(() => {
    void refreshPlatformVitals();
  }, [refreshPlatformVitals]);

  const usePlatformData = platformOk && ipdPlatformAdmissions.length > 0;
  const roundsSource = usePlatformData ? platformRounds : nursingRounds;

  const latestRounds = useMemo(() => {
    const map = new Map<string, (typeof roundsSource)[number]>();
    roundsSource.forEach((round) => {
      if (!map.has(round.admissionId)) {
        map.set(round.admissionId, round);
      }
    });
    return Array.from(map.values()).filter((round) => {
      const query = search.toLowerCase();
      return round.patientName.toLowerCase().includes(query) || round.uhid.toLowerCase().includes(query) || round.ward.toLowerCase().includes(query);
    });
  }, [roundsSource, search]);

  const ioRows = useMemo(() => {
    return latestRounds.map((round) => {
      const intakeIv = round.shift === "Morning" ? 500 : round.shift === "Evening" ? 350 : 200;
      const outputUrine = Math.max(120, 260 - round.painScore * 15);
      const outputDrain = round.ward.includes("ICU") ? 40 : 10;
      const balance = intakeIv - outputUrine - outputDrain;
      return {
        ...round,
        intakeOral: 100,
        intakeIV: intakeIv,
        intakeBlood: 0,
        outputUrine,
        outputDrain,
        outputVomit: 0,
        balance: `${balance >= 0 ? "+" : ""}${balance}`,
      };
    });
  }, [latestRounds]);

  const painRows = useMemo(() => latestRounds.filter((round) => round.painScore > 0), [latestRounds]);

  const fallRiskRows = useMemo(() => {
    return activeAdmissions.map((admission) => {
      const latest = roundsSource.find((round) => round.admissionId === admission.id);
      const score = latest ? Math.min(65, 20 + (latest.painScore * 4) + (latest.spo2 < 95 ? 20 : 0) + (admission.nursingPriority === "high" ? 15 : 0)) : 20;
      const risk = score >= 50 ? "High" : score >= 30 ? "Moderate" : "Low";
      return {
        admission,
        score,
        risk,
        measures: risk === "High"
          ? "Bed rails up, call bell within reach, non-slip socks"
          : risk === "Moderate"
            ? "Assisted mobility, bedside safety checks"
            : "Standard precautions",
      };
    }).sort((left, right) => right.score - left.score);
  }, [activeAdmissions, roundsSource]);

  const handleSaveRound = async () => {
    if (!selectedAdmissionId) return;

    const admission = admissions.find((item) => item.id === selectedAdmissionId);
    if (!admission) return;

    const patient = patients.find((p) => p.uhid === admission.uhid);
    if (usePlatformData && admission.platformAdmissionId && patient?.platformPatientId) {
      try {
        await platformRecordVitals({
          admissionId: admission.platformAdmissionId,
          patientId: patient.platformPatientId,
          nurse: roundForm.nurse,
          shift,
          bp: roundForm.bp,
          pulse: Number(roundForm.pulse),
          temp: Number(roundForm.temp),
          spo2: Number(roundForm.spo2),
          painScore: Number(roundForm.painScore),
          notes: roundForm.notes,
        });
        toast.success("Vitals recorded on platform");
        await refreshPlatformVitals();
        return;
      } catch (err) {
        const body = err instanceof PlatformApiError ? err.body : undefined;
        toast.error("Could not record vitals", {
          description: formatPlatformErrorBody(body) ?? (err instanceof Error ? err.message : undefined),
        });
        return;
      }
    }

    addNursingRound({
      admissionId: selectedAdmissionId,
      nurse: roundForm.nurse,
      shift,
      bp: roundForm.bp,
      pulse: Number(roundForm.pulse),
      temp: Number(roundForm.temp),
      spo2: Number(roundForm.spo2),
      painScore: Number(roundForm.painScore),
      notes: roundForm.notes,
    });
  };

  return (
    <div className="space-y-6">
      <NursePageHeader
        title="Vitals & monitoring"
        description={
          usePlatformData
            ? "Latest vitals from domain-api. Open trend charts per admission when platform-linked."
            : "Record local vitals or connect platform IPD for governed documentation."
        }
        actions={
          <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><Activity className="h-4 w-4 mr-1" /> Record vitals</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Record Vital Signs</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Admission</Label>
                <Select value={selectedAdmissionId} onValueChange={setSelectedAdmissionId}>
                  <SelectTrigger><SelectValue placeholder="Select patient admission" /></SelectTrigger>
                  <SelectContent>
                    {admissions.map((admission) => (
                      <SelectItem key={admission.id} value={admission.id}>
                        {admission.patientName} · {admission.ward} ({admission.bed})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nurse</Label>
                  <Input value={roundForm.nurse} onChange={(event) => setRoundForm((prev) => ({ ...prev, nurse: event.target.value }))} />
                </div>
                <div>
                  <Label>Shift</Label>
                  <Select value={shift} onValueChange={(value) => setShift(value as (typeof shiftOptions)[number])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {shiftOptions.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Blood Pressure</Label>
                  <Input value={roundForm.bp} onChange={(event) => setRoundForm((prev) => ({ ...prev, bp: event.target.value }))} />
                </div>
                <div>
                  <Label>Pulse Rate</Label>
                  <Input type="number" value={roundForm.pulse} onChange={(event) => setRoundForm((prev) => ({ ...prev, pulse: Number(event.target.value) }))} />
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input type="number" step="0.1" value={roundForm.temp} onChange={(event) => setRoundForm((prev) => ({ ...prev, temp: Number(event.target.value) }))} />
                </div>
                <div>
                  <Label>SpO2</Label>
                  <Input type="number" value={roundForm.spo2} onChange={(event) => setRoundForm((prev) => ({ ...prev, spo2: Number(event.target.value) }))} />
                </div>
                <div className="col-span-2">
                  <Label>Pain Score</Label>
                  <Input type="number" min={0} max={10} value={roundForm.painScore} onChange={(event) => setRoundForm((prev) => ({ ...prev, painScore: Number(event.target.value) }))} />
                </div>
              </div>
              <div>
                <Label>Observations</Label>
                <Textarea placeholder="Any clinical observations..." value={roundForm.notes} onChange={(event) => setRoundForm((prev) => ({ ...prev, notes: event.target.value }))} />
              </div>
              <Button className="w-full" onClick={() => void handleSaveRound()}>Save vitals</Button>
            </div>
          </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="vitals">
        <TabsList>
          <TabsTrigger value="vitals"><Heart className="h-3.5 w-3.5 mr-1" /> Vital Signs</TabsTrigger>
          <TabsTrigger value="io"><Droplets className="h-3.5 w-3.5 mr-1" /> Intake / Output</TabsTrigger>
          <TabsTrigger value="pain"><Thermometer className="h-3.5 w-3.5 mr-1" /> Pain Assessment</TabsTrigger>
          <TabsTrigger value="fallrisk"><Wind className="h-3.5 w-3.5 mr-1" /> Fall Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patient, ward, or UHID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ward / Bed</TableHead>
                    <TableHead>Nurse</TableHead>
                    <TableHead>BP</TableHead>
                    <TableHead>Pulse</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>SpO2</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Flag</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && usePlatformData ? (
                    <ClinicalTableLoadingRow colSpan={10} />
                  ) : latestRounds.length === 0 ? (
                    <ClinicalTableEmptyRow
                      colSpan={10}
                      title="No vitals recorded"
                      description="Record vital signs for inpatients to populate this table and trend charts."
                    />
                  ) : latestRounds.map((round) => (
                    <TableRow key={round.id}>
                      <TableCell>
                        <p className="font-medium text-sm text-foreground">{round.patientName}</p>
                        <p className="text-xs text-muted-foreground">{round.uhid}</p>
                      </TableCell>
                      <TableCell className="text-sm">{round.ward} · {round.bed}</TableCell>
                      <TableCell className="text-sm">{round.nurse}</TableCell>
                      <TableCell className="text-sm font-mono">{round.bp}</TableCell>
                      <TableCell className="text-sm font-mono">{round.pulse}</TableCell>
                      <TableCell className="text-sm font-mono">{round.temp}°F</TableCell>
                      <TableCell className={`text-sm font-mono ${round.spo2 < 94 ? "text-destructive font-bold" : ""}`}>{round.spo2}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{round.recordedAt}</TableCell>
                      <TableCell>{round.spo2 < 94 && <Badge variant="destructive" className="text-xs">SpO2 low</Badge>}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                          <Link to={`/nurse/vitals/chart/${round.admissionId}`}>
                            <LineChart className="mr-1 h-3 w-3" />
                            Trend
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="io" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Fluid intake and output tracking derived from live rounds</p>
            <Button size="sm" variant="outline" onClick={() => setSelectedAdmissionId(activeAdmissions[0]?.id ?? "")}>+ Record I/O</Button>
          </div>
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Bed</TableHead>
                    <TableHead>Oral (ml)</TableHead>
                    <TableHead>IV (ml)</TableHead>
                    <TableHead>Blood (ml)</TableHead>
                    <TableHead>Urine (ml)</TableHead>
                    <TableHead>Drain (ml)</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ioRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No I/O entries available.</TableCell>
                    </TableRow>
                  ) : ioRows.map((io) => (
                    <TableRow key={io.id}>
                      <TableCell>
                        <p className="font-medium text-sm text-foreground">{io.patientName}</p>
                        <p className="text-xs text-muted-foreground">{io.uhid}</p>
                      </TableCell>
                      <TableCell className="text-sm">{io.bed}</TableCell>
                      <TableCell className="text-sm font-mono">{io.intakeOral}</TableCell>
                      <TableCell className="text-sm font-mono">{io.intakeIV}</TableCell>
                      <TableCell className="text-sm font-mono">{io.intakeBlood}</TableCell>
                      <TableCell className="text-sm font-mono">{io.outputUrine}</TableCell>
                      <TableCell className="text-sm font-mono">{io.outputDrain}</TableCell>
                      <TableCell className="text-sm font-mono font-bold">{io.balance}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{io.recordedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pain" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Pain assessment records linked to live nursing rounds</p>
            <Button size="sm" variant="outline" onClick={() => setSelectedAdmissionId(activeAdmissions[0]?.id ?? "")}>+ Assess Pain</Button>
          </div>
          <div className="space-y-2">
            {painRows.length === 0 ? (
              <Card className="border-border"><CardContent className="p-6 text-sm text-muted-foreground">No pain assessments captured yet.</CardContent></Card>
            ) : painRows.map((round) => (
              <Card key={round.id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex flex-col items-center min-w-[50px]">
                    <Badge variant={painColor(round.painScore)} className="text-lg w-10 h-10 rounded-full flex items-center justify-center">{round.painScore}</Badge>
                    <span className="text-[10px] text-muted-foreground mt-1">/10</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{round.patientName} <span className="text-muted-foreground font-normal">· {round.uhid}</span></p>
                    <p className="text-sm text-foreground">{round.ward} · {round.bed} · {round.notes}</p>
                    <p className="text-xs text-muted-foreground mt-1">{round.recordedAt} · {round.nurse}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fallrisk" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">Morse Fall Scale assessment for admitted patients</p>
          <div className="space-y-2">
            {fallRiskRows.map((row) => (
              <Card key={row.admission.id} className="border-border">
                <CardContent className="p-4 flex items-center gap-4">
                  <Badge variant={row.risk === "High" ? "destructive" : row.risk === "Moderate" ? "secondary" : "outline"} className="min-w-[70px] justify-center">{row.risk}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{row.admission.patientName} <span className="text-muted-foreground font-normal">· {row.admission.uhid} · {row.admission.ward}</span></p>
                    <p className="text-xs text-muted-foreground">Morse Score: {row.score} · {row.measures}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs h-7">Reassess</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
