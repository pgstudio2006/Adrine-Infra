import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bed, Clock, User } from 'lucide-react';
import { useHospital, type PatientJourneyType } from '@/stores/hospitalStore';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';

const OBS_BEDS = ['OBS-01', 'OBS-02', 'OBS-03', 'OBS-04', 'OBS-05', 'OBS-06'];

const STATUS_BADGE: Record<string, 'destructive' | 'outline' | 'secondary' | 'default'> = {
  'under-observation': 'outline',
  'in-treatment': 'secondary',
  triaged: 'secondary',
  'transferred-ipd': 'default',
};

export default function EmergencyObservation() {
  const {
    emergencyCases,
    moveEmergencyToObservation,
    dischargeEmergencyCase,
    transferEmergencyToIPD,
  } = useHospital();
  useEmergencyOperationalStream({ worklists: true, ipd: true });
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [assignBed, setAssignBed] = useState('OBS-01');
  const [transferForm, setTransferForm] = useState({
    journeyType: 'IPD' as PatientJourneyType,
    ward: 'General Ward',
    bed: 'GW-01',
    attendingDoctor: 'Dr. A. Shah',
    primaryDiagnosis: 'Observation complete — requires admission',
    nursingPriority: 'medium' as 'high' | 'medium' | 'low',
  });
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const observationCases = useMemo(
    () => emergencyCases.filter((c) => c.status === 'under-observation'),
    [emergencyCases],
  );

  const observationBeds = useMemo(() => {
    return OBS_BEDS.map((bed) => {
      const occupant = observationCases.find((c) => c.location === bed);
      return { bed, occupant };
    });
  }, [observationCases]);

  const occupied = observationCases.length;
  const available = OBS_BEDS.length - occupied;

  const assignableCases = emergencyCases.filter(
    (c) => c.status === 'in-treatment' || c.status === 'triaged',
  );

  const handleAssign = () => {
    if (!selectedCaseId) return;
    moveEmergencyToObservation(selectedCaseId, assignBed);
    setShowAssignDialog(false);
    setSelectedCaseId(null);
  };

  const handleTransfer = async () => {
    if (!selectedCaseId) return;
    try {
      await transferEmergencyToIPD(selectedCaseId, transferForm);
    } catch {
      /* store surfaces errors */
    }
    setShowTransferDialog(false);
    setSelectedCaseId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Observation Unit</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor patients under ER observation</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAssignDialog(true)}>
          <Bed className="w-4 h-4" />Assign Bed
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-2xl font-bold text-foreground">{occupied}</p><p className="text-xs text-muted-foreground">Occupied Beds</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-foreground">{available}</p><p className="text-xs text-muted-foreground">Available Beds</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-foreground">{assignableCases.length}</p><p className="text-xs text-muted-foreground">Awaiting Observation</p></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {observationBeds.map(({ bed, occupant }) => (
          <Card key={bed} className={`p-4 ${!occupant ? 'border-dashed opacity-60' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm font-semibold text-foreground">{bed}</span>
              </div>
              <Badge variant={occupant ? STATUS_BADGE[occupant.status] : 'secondary'} className="text-[10px]">
                {occupant ? 'Monitoring' : 'Available'}
              </Badge>
            </div>

            {occupant ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{occupant.patientName}</p>
                  <p className="text-xs text-muted-foreground">{occupant.id} · {occupant.assignedDoctor ?? 'Unassigned'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{occupant.complaint}</p>
                  {occupant.uhid && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">{occupant.uhid}</p>
                  )}
                </div>

                <div className="text-xs font-mono text-muted-foreground">{occupant.vitals}</div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Since {occupant.createdAt}</span>
                  </div>
                  <Progress value={50} className="h-1.5" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex-1"
                    onClick={() => dischargeEmergencyCase(occupant.id)}
                  >
                    Discharge
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs flex-1"
                    onClick={() => {
                      setSelectedCaseId(occupant.id);
                      setShowTransferDialog(true);
                    }}
                  >
                    Transfer to IPD
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                <User className="w-4 h-4 mr-2" /> Bed Available
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Observation Bed</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedCaseId ?? ''} onValueChange={setSelectedCaseId}>
              <SelectTrigger><SelectValue placeholder="Select case" /></SelectTrigger>
              <SelectContent>
                {assignableCases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.id} — {c.patientName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignBed} onValueChange={setAssignBed}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBS_BEDS.filter((b) => !observationCases.some((c) => c.location === b)).map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleAssign} disabled={!selectedCaseId}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Observation Case to IPD</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Ward</label>
                <Input value={transferForm.ward} onChange={(e) => setTransferForm((p) => ({ ...p, ward: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bed</label>
                <Input value={transferForm.bed} onChange={(e) => setTransferForm((p) => ({ ...p, bed: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full" onClick={handleTransfer}>Confirm Transfer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
