import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bed, ClipboardList, FileText, Search } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { canUseIpdRuntime } from "@/runtime/ipd-runtime";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";

const priorityStyles = {
  high: "destructive" as const,
  medium: "secondary" as const,
  low: "outline" as const,
};

export default function NurseAdmissions() {
  const { admissions, nursingRounds, emergencyCases, addNursingRound, refreshPlatformIpdSnapshots } = useHospital();
  const [search, setSearch] = useState("");
  const [platformSynced, setPlatformSynced] = useState<number>(0);

  const refreshCensus = useCallback(async () => {
    if (!canUseIpdRuntime()) {
      setPlatformSynced(0);
      return;
    }
    await refreshPlatformIpdSnapshots();
    setPlatformSynced(admissions.filter((a) => a.platformAdmissionId && a.status !== "discharged").length);
  }, [admissions, refreshPlatformIpdSnapshots]);

  useEffect(() => {
    void refreshCensus();
    if (!canUseIpdRuntime()) return;
    const t = setInterval(() => void refreshCensus(), 25_000);
    return () => clearInterval(t);
  }, [refreshCensus]);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string>("");
  const [shift, setShift] = useState<"Morning" | "Evening" | "Night">("Morning");
  const [roundForm, setRoundForm] = useState({
    nurse: "Nurse Priya",
    bp: "120/80",
    pulse: 80,
    temp: 98.6,
    spo2: 98,
    painScore: 2,
    notes: "Patient stable. Continue protocol.",
  });

  const filteredAdmissions = admissions.filter((admission) => {
    const query = search.toLowerCase();
    return admission.patientName.toLowerCase().includes(query) || admission.uhid.toLowerCase().includes(query);
  });

  const incidentCases = useMemo(
    () => emergencyCases.filter((item) => item.mlcRequired || item.triage === "critical"),
    [emergencyCases],
  );

  const handleSaveRound = () => {
    if (!selectedAdmissionId) return;

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
      {canUseIpdRuntime() && (
        <PlatformConnectivityStrip
          label="IPD admissions"
          detail={`${platformSynced} platform-linked active admissions · ${filteredAdmissions.length} shown in list`}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Live inpatient admissions, nursing rounds, and safety incidents</p>
        </div>
      </div>

      <Tabs defaultValue="patients">
        <TabsList>
          <TabsTrigger value="patients"><Bed className="h-3.5 w-3.5 mr-1" /> Admitted Patients</TabsTrigger>
          <TabsTrigger value="notes"><FileText className="h-3.5 w-3.5 mr-1" /> Nursing Rounds</TabsTrigger>
          <TabsTrigger value="incidents"><ClipboardList className="h-3.5 w-3.5 mr-1" /> Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patient or UHID..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </div>
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Journey</TableHead>
                    <TableHead>Ward / Bed</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmissions.map((admission) => (
                    <TableRow key={admission.id}>
                      <TableCell>
                        <p className="font-medium text-sm text-foreground">{admission.patientName}</p>
                        <p className="text-xs text-muted-foreground">{admission.uhid} · {admission.id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{admission.journeyType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{admission.ward} · {admission.bed}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{admission.attendingDoctor}</TableCell>
                      <TableCell className="text-sm">{admission.primaryDiagnosis}</TableCell>
                      <TableCell>
                        <Badge variant={priorityStyles[admission.nursingPriority]} className="text-xs capitalize">{admission.nursingPriority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admission.status === "discharged" ? "outline" : "default"} className="text-xs">{admission.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Nursing rounds linked to admission journeys</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm"><FileText className="h-4 w-4 mr-1" /> Add Round</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Nursing Round</DialogTitle></DialogHeader>
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
                      <Select value={shift} onValueChange={(value) => setShift(value as "Morning" | "Evening" | "Night")}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning">Morning</SelectItem>
                          <SelectItem value="Evening">Evening</SelectItem>
                          <SelectItem value="Night">Night</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>BP</Label>
                      <Input value={roundForm.bp} onChange={(event) => setRoundForm((prev) => ({ ...prev, bp: event.target.value }))} />
                    </div>
                    <div>
                      <Label>Pulse</Label>
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
                    <Label>Round Notes</Label>
                    <Textarea rows={3} value={roundForm.notes} onChange={(event) => setRoundForm((prev) => ({ ...prev, notes: event.target.value }))} />
                  </div>
                  <Button className="w-full" onClick={handleSaveRound}>Save Round</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="border-border">
            <CardContent className="p-0 divide-y divide-border">
              {nursingRounds.map((round) => (
                <div key={round.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{round.shift}</Badge>
                      <span className="text-sm font-medium text-foreground">{round.patientName}</span>
                      <span className="text-xs text-muted-foreground">{round.uhid}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{round.nurse} · {round.recordedAt}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{round.ward} · {round.bed} · BP {round.bp} · Pulse {round.pulse} · Temp {round.temp}F · SpO2 {round.spo2}% · Pain {round.painScore}/10</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded p-2">{round.notes}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Critical or medico-legal emergency cases requiring nursing attention</p>
          </div>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Safety Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incidentCases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active incidents found.</p>
              ) : (
                incidentCases.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{item.patientName}</p>
                        <p className="text-xs text-muted-foreground">{item.id} · {item.complaint}</p>
                      </div>
                      <div className="flex gap-2">
                        {item.mlcRequired && <Badge variant="destructive" className="text-xs">MLC</Badge>}
                        {item.triage && <Badge variant="outline" className="text-xs capitalize">{item.triage}</Badge>}
                      </div>
                    </div>
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
