import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowRightLeft, FileText, LineChart, Search, UserCheck, Users } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { useClinicalPlatformListSync } from '@/hooks/useClinicalPlatformListSync';
import { canUseIpdRuntime, platformIpdTransition } from '@/runtime/ipd-runtime';
import { formatPlatformErrorBody, PlatformApiError } from '@/runtime/platform-client';
import { PatientContextBar } from '@/components/clinical/PatientContextBar';
import {
  ClinicalTableEmptyRow,
  NursePageHeader,
} from '@/components/clinical/ClinicalTableStates';

const priorityVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const nurseRoster = ['Nurse Priya', 'Nurse Rekha', 'Nurse Sunita', 'Nurse Kavita', 'Nurse Deepa'];

export default function NurseWard() {
  const { admissions, nursingRounds, assignAdmissionBed, refreshPlatformIpdSnapshots } = useHospital();
  useClinicalPlatformListSync({ ipd: true, departmentWorklists: false });
  const platformIpd = canUseIpdRuntime();

  const [search, setSearch] = useState('');
  const [selectedWard, setSelectedWard] = useState('all');
  const [highlightAdmissionId, setHighlightAdmissionId] = useState('');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState('');
  const [transferWard, setTransferWard] = useState('');
  const [transferBed, setTransferBed] = useState('');
  const [transferNurse, setTransferNurse] = useState('Nurse Priya');
  const [doctorRoundAt, setDoctorRoundAt] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);

  const wardOptions = useMemo(() => {
    const wards = Array.from(new Set(admissions.map((admission) => admission.ward)));
    return wards.sort((left, right) => left.localeCompare(right));
  }, [admissions]);

  const activeAdmissions = useMemo(
    () => admissions.filter((admission) => admission.status !== 'discharged'),
    [admissions],
  );

  const filtered = useMemo(() => {
    return activeAdmissions.filter((admission) => {
      const query = search.toLowerCase();
      const matchSearch =
        admission.patientName.toLowerCase().includes(query)
        || admission.uhid.toLowerCase().includes(query)
        || admission.id.toLowerCase().includes(query)
        || admission.attendingDoctor.toLowerCase().includes(query);
      const matchWard = selectedWard === 'all' || admission.ward === selectedWard;
      return matchSearch && matchWard;
    });
  }, [activeAdmissions, search, selectedWard]);

  const highlightedAdmission =
    admissions.find((a) => a.id === highlightAdmissionId)
    ?? filtered[0]
    ?? null;

  const latestRoundByAdmission = useMemo(() => {
    const map = new Map<string, (typeof nursingRounds)[number]>();
    nursingRounds.forEach((round) => {
      if (!map.has(round.admissionId)) {
        map.set(round.admissionId, round);
      }
    });
    return map;
  }, [nursingRounds]);

  const handovers = useMemo(() => nursingRounds.slice(0, 8), [nursingRounds]);

  const infectionWatchlist = useMemo(() => {
    return admissions.filter((admission) => {
      const recentRound = latestRoundByAdmission.get(admission.id);
      return (
        admission.nursingPriority === 'high'
        || admission.status === 'icu'
        || admission.journeyType === 'Trauma'
        || (recentRound ? recentRound.spo2 < 94 || recentRound.temp >= 100 : false)
      );
    });
  }, [admissions, latestRoundByAdmission]);

  useEffect(() => {
    if (!platformIpd) return;
    void refreshPlatformIpdSnapshots();
    const timer = setInterval(() => void refreshPlatformIpdSnapshots(), 25_000);
    return () => clearInterval(timer);
  }, [platformIpd, refreshPlatformIpdSnapshots]);

  const handleTransfer = async () => {
    if (!selectedAdmissionId || !transferWard.trim() || !transferBed.trim()) {
      toast.error('Select admission, destination ward, and bed.');
      return;
    }

    const admission = admissions.find((a) => a.id === selectedAdmissionId);
    if (!admission) return;

    setTransferring(true);
    try {
      if (platformIpd && admission.platformAdmissionId) {
        try {
          await platformIpdTransition(admission.platformAdmissionId, 'initiate_transfer', {
            transferDestinationValid: true,
            bedAvailableAtDestination: true,
            handoverDocumented: Boolean(transferReason.trim()),
          });
          toast.success('Platform transfer initiated', {
            description: 'Complete bed assignment via reception if destination bed is not yet linked.',
          });
        } catch (err) {
          const msg =
            formatPlatformErrorBody(err instanceof PlatformApiError ? err.body : undefined)
            ?? (err instanceof Error ? err.message : 'Platform transfer rejected');
          toast.warning('Platform transfer not completed', {
            description: `${msg} Ward roster will update locally only.`,
          });
        }
      }

      assignAdmissionBed(
        selectedAdmissionId,
        transferWard.trim(),
        transferBed.trim(),
        transferNurse.trim() || undefined,
        doctorRoundAt.trim() || undefined,
        transferReason.trim() || undefined,
        transferNurse.trim() || undefined,
      );
      toast.success('Ward assignment updated');
      setTransferReason('');
      setHighlightAdmissionId(selectedAdmissionId);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <NursePageHeader
        title="Ward board"
        description="Active assignments, shift handover, and infection watchlist."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <ArrowRightLeft className="mr-1 h-4 w-4" />
                Ward transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ward transfer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {platformIpd ? (
                  <Alert>
                    <AlertTitle>Platform IPD</AlertTitle>
                    <AlertDescription className="text-xs">
                      Governed transfer uses <code className="text-[10px]">initiate_transfer</code> when the
                      admission is platform-linked. Destination bed graph assignment may still require{' '}
                      <Link to="/reception/beds" className="underline">
                        reception beds
                      </Link>
                      . Local ward labels always update for the nursing roster.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="default">
                    <AlertTitle>Preview</AlertTitle>
                    <AlertDescription className="text-xs">
                      Ward transfer updates the local roster only until platform runtime is enabled.
                    </AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label>Admission</Label>
                  <Select value={selectedAdmissionId} onValueChange={setSelectedAdmissionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inpatient" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAdmissions.map((admission) => (
                        <SelectItem key={admission.id} value={admission.id}>
                          {admission.patientName} · {admission.ward} ({admission.bed})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transfer to ward</Label>
                  <Input
                    value={transferWard}
                    onChange={(event) => setTransferWard(event.target.value)}
                    placeholder="Ward / unit"
                  />
                </div>
                <div>
                  <Label>Transfer to bed</Label>
                  <Input
                    value={transferBed}
                    onChange={(event) => setTransferBed(event.target.value)}
                    placeholder="Bed / bay"
                  />
                </div>
                <div>
                  <Label>Assigned nurse</Label>
                  <Select value={transferNurse} onValueChange={setTransferNurse}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nurseRoster.map((nurse) => (
                        <SelectItem key={nurse} value={nurse}>
                          {nurse}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next doctor round (optional)</Label>
                  <Input
                    value={doctorRoundAt}
                    onChange={(event) => setDoctorRoundAt(event.target.value)}
                    placeholder="e.g. 11:00 AM"
                  />
                </div>
                <div>
                  <Label>Transfer reason</Label>
                  <Textarea
                    value={transferReason}
                    onChange={(event) => setTransferReason(event.target.value)}
                    placeholder="Clinical reason and handover summary…"
                  />
                </div>
                <Button className="w-full" disabled={transferring} onClick={() => void handleTransfer()}>
                  {transferring ? 'Transferring…' : 'Confirm transfer'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {highlightedAdmission ? (
        <PatientContextBar
          patientName={highlightedAdmission.patientName}
          uhid={highlightedAdmission.uhid}
          ward={highlightedAdmission.ward}
          bed={highlightedAdmission.bed}
          status={highlightedAdmission.status}
          attendingDoctor={highlightedAdmission.attendingDoctor}
          platformLinked={Boolean(highlightedAdmission.platformAdmissionId)}
          actions={
            <>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/nurse/notes/${highlightedAdmission.id}`}>
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  Notes
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to={`/nurse/vitals/chart/${highlightedAdmission.id}`}>
                  <LineChart className="mr-1 h-3.5 w-3.5" />
                  Vitals trend
                </Link>
              </Button>
            </>
          }
        />
      ) : null}

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">
            <Users className="mr-1 h-3.5 w-3.5" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="handover">
            <ArrowRightLeft className="mr-1 h-3.5 w-3.5" />
            Handover
          </TabsTrigger>
          <TabsTrigger value="infection">
            <UserCheck className="mr-1 h-3.5 w-3.5" />
            Watchlist
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patient, UHID, or doctor…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedWard} onValueChange={setSelectedWard}>
              <SelectTrigger>
                <SelectValue placeholder="All wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All wards</SelectItem>
                {wardOptions.map((ward) => (
                  <SelectItem key={ward} value={ward}>
                    {ward}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Ward / bed</TableHead>
                    <TableHead>Nurse</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Next round</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <ClinicalTableEmptyRow
                      colSpan={8}
                      title="No patients on ward"
                      description="Adjust filters or admit patients to see assignments here."
                    />
                  ) : (
                    filtered.map((admission) => (
                      <TableRow
                        key={admission.id}
                        className={highlightAdmissionId === admission.id ? 'bg-muted/50' : undefined}
                        onClick={() => setHighlightAdmissionId(admission.id)}
                      >
                        <TableCell>
                          <p className="text-sm font-medium text-foreground">{admission.patientName}</p>
                          <p className="text-xs text-muted-foreground">{admission.uhid}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {admission.ward} · {admission.bed}
                        </TableCell>
                        <TableCell className="text-sm">{admission.assignedNurse || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {admission.roundingDoctor || admission.attendingDoctor}
                        </TableCell>
                        <TableCell className="text-sm">{admission.nextDoctorRoundAt || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={priorityVariant[admission.nursingPriority]} className="text-xs capitalize">
                            {admission.nursingPriority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {admission.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" asChild>
                            <Link to={`/nurse/notes/${admission.id}`} onClick={(e) => e.stopPropagation()}>
                              Notes
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="handover" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent handovers</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {handovers.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No nursing rounds recorded yet. Record vitals to capture shift notes.
                </p>
              ) : (
                handovers.map((round) => (
                  <div key={round.id} className="px-4 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {round.patientName}{' '}
                          <span className="font-normal text-muted-foreground">· {round.uhid}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {round.nurse} · {round.shift} · {round.ward} · {round.bed}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{round.recordedAt}</span>
                    </div>
                    <p className="rounded bg-muted/50 p-2 text-sm text-foreground">{round.notes || '—'}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infection" className="mt-4 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Safety watchlist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {infectionWatchlist.length === 0 ? (
                <p className="text-sm text-muted-foreground">No patients on the watchlist.</p>
              ) : (
                infectionWatchlist.map((admission) => {
                  const latestRound = latestRoundByAdmission.get(admission.id);
                  const flag =
                    latestRound && latestRound.spo2 < 94
                      ? 'SpO₂ low'
                      : latestRound && latestRound.temp >= 100
                        ? 'Temperature high'
                        : admission.nursingPriority === 'high'
                          ? 'High acuity'
                          : 'Ward watch';

                  return (
                    <div key={admission.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{admission.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {admission.uhid} · {admission.ward} · {admission.bed}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {flag}
                          </Badge>
                          {latestRound?.painScore !== undefined ? (
                            <Badge variant="outline" className="text-xs">
                              Pain {latestRound.painScore}/10
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      {latestRound ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Latest round by {latestRound.nurse} at {latestRound.recordedAt} · BP {latestRound.bp} ·
                          Pulse {latestRound.pulse} · SpO₂ {latestRound.spo2}%
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
