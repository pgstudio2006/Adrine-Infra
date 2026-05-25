import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle, LogOut, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useHospital } from '@/stores/hospitalStore';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { OperationalDischargePanel } from '@/components/operations/OperationalDischargePanel';
import { PatientContextBar } from '@/components/clinical/PatientContextBar';
import {
  ClinicalTableEmptyRow,
  NursePageHeader,
} from '@/components/clinical/ClinicalTableStates';
import {
  canMarkLocalDischarged,
  canUseDischargeRuntime,
  type LiveDischargeState,
} from '@/runtime/discharge-runtime';

const EDUCATION_ITEMS = [
  { id: 1, category: 'Medication', instruction: 'Explain medication schedule and possible side effects.' },
  { id: 2, category: 'Wound Care', instruction: 'Share dressing care and warning signs.' },
  { id: 3, category: 'Diet', instruction: 'Provide personalized diet plan from treating team.' },
  { id: 4, category: 'Activity', instruction: 'Counsel on mobility limits and safe activity progression.' },
  { id: 5, category: 'Follow-up', instruction: 'Confirm follow-up date, time, and department.' },
  { id: 6, category: 'Emergency', instruction: 'Educate on danger signs and emergency contact route.' },
];

export default function NurseDischarge() {
  const { admissions, nursingRounds, prescriptions, updateAdmissionStatus } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });

  const [search, setSearch] = useState('');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<string | null>(null);
  const [educationByAdmission, setEducationByAdmission] = useState<Record<string, Record<number, boolean>>>({});
  const [docsByAdmission, setDocsByAdmission] = useState<Record<string, boolean>>({});
  const [dischargeNotesByAdmission, setDischargeNotesByAdmission] = useState<Record<string, string>>({});
  const [platformBlockersByAdmission, setPlatformBlockersByAdmission] = useState<
    Record<string, LiveDischargeState['blockers']>
  >({});
  const [liveDischargeByAdmission, setLiveDischargeByAdmission] = useState<
    Record<string, LiveDischargeState | null>
  >({});

  const activeDischarges = useMemo(
    () => admissions.filter((admission) => admission.status !== 'discharged'),
    [admissions],
  );

  const completedDischarges = useMemo(
    () => admissions.filter((admission) => admission.status === 'discharged'),
    [admissions],
  );

  const filteredQueue = useMemo(() => {
    const query = search.toLowerCase();
    return activeDischarges.filter(
      (admission) =>
        admission.patientName.toLowerCase().includes(query)
        || admission.uhid.toLowerCase().includes(query)
        || admission.ward.toLowerCase().includes(query),
    );
  }, [activeDischarges, search]);

  const selectedAdmission = useMemo(() => {
    const id = selectedAdmissionId ?? filteredQueue[0]?.id;
    return activeDischarges.find((admission) => admission.id === id) ?? null;
  }, [activeDischarges, filteredQueue, selectedAdmissionId]);

  const getChecklistState = (admissionId: string, uhid: string) => {
    const latestRound = nursingRounds.find((round) => round.admissionId === admissionId);
    const rxForPatient = prescriptions.filter((rx) => rx.uhid === uhid);
    const medsExplained =
      rxForPatient.length === 0
      || rxForPatient.every((rx) => rx.status === 'Dispensed' || rx.status === 'Partially dispensed');
    const educationMap = educationByAdmission[admissionId] || {};
    const educationDone = EDUCATION_ITEMS.every((item) => educationMap[item.id]);

    return {
      vitals: Boolean(latestRound),
      meds: medsExplained,
      education: educationDone,
      docs: Boolean(docsByAdmission[admissionId]),
    };
  };

  const hasCriticalPlatformBlockers = (admissionId: string) => {
    const blockers = platformBlockersByAdmission[admissionId] ?? [];
    return blockers.some((b) => b.severity === 'critical');
  };

  const handleMarkReady = (admissionId: string, uhid: string) => {
    const checklist = getChecklistState(admissionId, uhid);
    if (!checklist.vitals || !checklist.meds || !checklist.education || !checklist.docs) {
      toast.error('Complete all checklist items before marking discharge-ready.');
      return;
    }
    if (canUseDischargeRuntime() && hasCriticalPlatformBlockers(admissionId)) {
      toast.error('Platform discharge blockers must be resolved first.');
      return;
    }
    updateAdmissionStatus(admissionId, 'discharge-ready');
  };

  const handleMarkDischarged = (admissionId: string) => {
    if (canUseDischargeRuntime() && hasCriticalPlatformBlockers(admissionId)) {
      toast.error('Platform discharge blockers must be cleared before discharge.');
      return;
    }
    const live = liveDischargeByAdmission[admissionId];
    if (canUseDischargeRuntime() && !canMarkLocalDischarged(live)) {
      toast.error('Complete discharge on platform before marking discharged locally.');
      return;
    }
    updateAdmissionStatus(admissionId, 'discharged');
  };

  const selectedChecklist = selectedAdmission
    ? getChecklistState(selectedAdmission.id, selectedAdmission.uhid)
    : null;
  const selectedChecklistComplete = selectedChecklist
    ? selectedChecklist.vitals && selectedChecklist.meds && selectedChecklist.education && selectedChecklist.docs
    : false;
  const selectedPlatformBlocked = selectedAdmission
    ? hasCriticalPlatformBlockers(selectedAdmission.id)
    : false;

  return (
    <div className="space-y-6">
      <NursePageHeader
        title="Discharge prep"
        description="Nursing checklist, patient education, and platform discharge clearance (GAP-012)."
      />

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">
            <LogOut className="mr-1 h-3.5 w-3.5" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="education">
            <BookOpen className="mr-1 h-3.5 w-3.5" />
            Education
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="mr-1 h-3.5 w-3.5" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patient, UHID, ward…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Candidates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Ward</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueue.length === 0 ? (
                      <ClinicalTableEmptyRow
                        colSpan={3}
                        title="No discharge candidates"
                        description="Active inpatients appear here when nursing discharge prep is in progress."
                      />
                    ) : (
                      filteredQueue.map((admission) => {
                        const checklist = getChecklistState(admission.id, admission.uhid);
                        const ready =
                          checklist.vitals && checklist.meds && checklist.education && checklist.docs;
                        const queueStatus =
                          admission.status === 'discharge-ready' ? 'Ready' : ready ? 'Checklist done' : 'In progress';
                        return (
                          <TableRow
                            key={admission.id}
                            className={
                              selectedAdmission?.id === admission.id ? 'bg-muted/50' : 'cursor-pointer'
                            }
                            onClick={() => setSelectedAdmissionId(admission.id)}
                          >
                            <TableCell>
                              <p className="text-sm font-medium">{admission.patientName}</p>
                              <p className="text-xs text-muted-foreground">{admission.uhid}</p>
                            </TableCell>
                            <TableCell className="text-sm">
                              {admission.ward} · {admission.bed}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={admission.status === 'discharge-ready' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {queueStatus}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {selectedAdmission ? (
                <>
                  <PatientContextBar
                    patientName={selectedAdmission.patientName}
                    uhid={selectedAdmission.uhid}
                    ward={selectedAdmission.ward}
                    bed={selectedAdmission.bed}
                    status={selectedAdmission.status}
                    attendingDoctor={selectedAdmission.attendingDoctor}
                    platformLinked={Boolean(selectedAdmission.platformAdmissionId)}
                  />

                  <Card className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Nursing checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ['Final vitals recorded', selectedChecklist?.vitals],
                          ['Discharge meds explained', selectedChecklist?.meds],
                          ['Patient education done', selectedChecklist?.education],
                          ['Documents prepared', selectedChecklist?.docs],
                        ] as const
                      ).map(([label, checked]) => (
                        <div key={label} className="flex items-center gap-2 text-sm">
                          <Checkbox checked={Boolean(checked)} disabled />
                          <span>{label}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {canUseDischargeRuntime() && selectedAdmission.platformAdmissionId ? (
                    <OperationalDischargePanel
                      admissionId={selectedAdmission.platformAdmissionId}
                      patientName={selectedAdmission.patientName}
                      nurseClearanceContext={
                        selectedChecklistComplete
                          ? {
                              nursingTasksComplete: true,
                              patientEducationDocumented: true,
                            }
                          : undefined
                      }
                      onBlockersChange={(blockers) =>
                        setPlatformBlockersByAdmission((prev) => ({
                          ...prev,
                          [selectedAdmission.id]: blockers,
                        }))
                      }
                      onLiveStateChange={(live) =>
                        setLiveDischargeByAdmission((prev) => ({
                          ...prev,
                          [selectedAdmission.id]: live,
                        }))
                      }
                    />
                  ) : null}

                  <Card className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Handover note</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Nursing discharge note</Label>
                        <Textarea
                          placeholder="Patient and attendant counseled. Handover complete."
                          value={dischargeNotesByAdmission[selectedAdmission.id] || ''}
                          onChange={(event) =>
                            setDischargeNotesByAdmission((prev) => ({
                              ...prev,
                              [selectedAdmission.id]: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-[72px] text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAdmissionId(selectedAdmission.id)}
                        >
                          Open education tab
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            !selectedChecklistComplete
                            || selectedAdmission.status === 'discharge-ready'
                            || selectedPlatformBlocked
                          }
                          onClick={() => handleMarkReady(selectedAdmission.id, selectedAdmission.uhid)}
                        >
                          Mark ready
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={
                            selectedAdmission.status !== 'discharge-ready'
                            || selectedPlatformBlocked
                            || (canUseDischargeRuntime()
                              && !canMarkLocalDischarged(liveDischargeByAdmission[selectedAdmission.id]))
                          }
                          onClick={() => handleMarkDischarged(selectedAdmission.id)}
                        >
                          Mark discharged
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-border">
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">
                    Select a patient from the queue to review checklist and platform clearance.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="education" className="mt-4 space-y-4">
          {selectedAdmission ? (
            <PatientContextBar
              patientName={selectedAdmission.patientName}
              uhid={selectedAdmission.uhid}
              ward={selectedAdmission.ward}
              bed={selectedAdmission.bed}
              status={selectedAdmission.status}
            />
          ) : null}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Patient education
                {selectedAdmission ? ` — ${selectedAdmission.patientName}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {EDUCATION_ITEMS.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <Checkbox
                    checked={selectedAdmission ? Boolean(educationByAdmission[selectedAdmission.id]?.[item.id]) : false}
                    disabled={!selectedAdmission}
                    onCheckedChange={(checked) => {
                      if (!selectedAdmission) return;
                      setEducationByAdmission((prev) => ({
                        ...prev,
                        [selectedAdmission.id]: {
                          ...(prev[selectedAdmission.id] || {}),
                          [item.id]: Boolean(checked),
                        },
                      }));
                    }}
                  />
                  <Badge variant="outline" className="min-w-[90px] justify-center text-xs">
                    {item.category}
                  </Badge>
                  <span className="text-sm text-foreground">{item.instruction}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Button
            disabled={!selectedAdmission}
            onClick={() => {
              if (!selectedAdmission) return;
              setDocsByAdmission((prev) => ({ ...prev, [selectedAdmission.id]: true }));
              toast.success('Education and documentation marked complete.');
            }}
          >
            Mark education complete
          </Button>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Bed</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Admitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedDischarges.length === 0 ? (
                    <ClinicalTableEmptyRow colSpan={5} title="No completed discharges" />
                  ) : (
                    completedDischarges.map((admission) => (
                      <TableRow key={admission.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{admission.patientName}</p>
                          <p className="text-xs text-muted-foreground">{admission.uhid}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {admission.ward} · {admission.bed}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {admission.attendingDoctor}
                        </TableCell>
                        <TableCell className="text-sm">{admission.primaryDiagnosis}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{admission.admittedAt}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
