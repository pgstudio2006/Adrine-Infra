import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Clock, AlertTriangle, User, Activity } from 'lucide-react';
import { useHospital, type PatientJourneyType } from '@/stores/hospitalStore';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';
import { EmergencyFastTrackPanel } from '@/components/emergency/EmergencyFastTrackPanel';

type TriageCategory = 'critical' | 'urgent' | 'semi-urgent' | 'non-urgent';

const TRIAGE_CONFIG: Record<TriageCategory, { label: string; color: string; badge: 'destructive' | 'outline' | 'secondary' | 'default' }> = {
  critical: { label: 'Critical (Immediate)', color: 'border-l-destructive', badge: 'destructive' },
  urgent: { label: 'Urgent', color: 'border-l-warning', badge: 'outline' },
  'semi-urgent': { label: 'Semi-Urgent', color: 'border-l-info', badge: 'secondary' },
  'non-urgent': { label: 'Non-Urgent', color: 'border-l-success', badge: 'default' },
};

export default function EmergencyTriage() {
  const {
    emergencyCases,
    createEmergencyCase,
    triageEmergencyCase,
    transferEmergencyToIPD,
  } = useHospital();
  useEmergencyOperationalStream({ worklists: true, ipd: true });
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferForm, setTransferForm] = useState({
    journeyType: 'IPD' as PatientJourneyType,
    ward: 'ICU',
    bed: 'ICU-01',
    attendingDoctor: 'Dr. A. Shah',
    primaryDiagnosis: 'Emergency stabilization required',
    nursingPriority: 'high' as 'high' | 'medium' | 'low',
  });

  const selectedEmergency = useMemo(
    () => emergencyCases.find(item => item.id === selectedEmergencyId) ?? null,
    [emergencyCases, selectedEmergencyId],
  );

  const filtered = emergencyCases.filter(p => {
    if (filter !== 'all' && p.triage !== filter && !(filter === 'pending' && !p.triage)) return false;
    if (search && !p.patientName.toLowerCase().includes(search.toLowerCase()) && !p.id.includes(search)) return false;
    return true;
  });

  const triageCount = (key: TriageCategory) => emergencyCases.filter(caseItem => caseItem.triage === key).length;

  const handleQuickRegister = () => {
    createEmergencyCase({
      patientName: 'Unidentified Emergency Walk-in',
      arrivalMode: 'Walk-in',
      complaint: 'Acute distress - initial assessment pending',
      vitals: 'BP --, HR --, SpO2 --',
      mlcRequired: false,
    });
  };

  const handleAssessNow = (emergencyId: string) => {
    triageEmergencyCase(emergencyId, {
      triage: 'urgent',
      assignedNurse: 'Nurse Priya',
      assignedDoctor: 'Dr. A. Shah',
    });
  };

  const handleTransfer = async () => {
    if (!selectedEmergency) return;

    try {
      await transferEmergencyToIPD(selectedEmergency.id, {
        journeyType: transferForm.journeyType,
        ward: transferForm.ward,
        bed: transferForm.bed,
        attendingDoctor: transferForm.attendingDoctor,
        primaryDiagnosis: transferForm.primaryDiagnosis,
        nursingPriority: transferForm.nursingPriority,
      });
    } catch {
      /* Error surfaces via store toasts / throw from admit path */
    }

    setShowTransferDialog(false);
    setSelectedEmergencyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Triage</h1>
          <p className="text-sm text-muted-foreground mt-1">Assess and prioritize emergency patients</p>
        </div>
        <Button className="gap-2" onClick={handleQuickRegister}>
          <User className="w-4 h-4" />
          Quick Register
        </Button>
      </div>

      <EmergencyFastTrackPanel />

      {/* Triage Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(TRIAGE_CONFIG) as [TriageCategory, typeof TRIAGE_CONFIG[TriageCategory]][]).map(([key, config]) => {
          const count = triageCount(key);
          return (
            <Card key={key} className={`p-4 border-l-4 ${config.color} cursor-pointer hover:shadow-sm transition-shadow`} onClick={() => setFilter(key)}>
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search patient or case ID..." className="pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="pending">Pending Triage</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="semi-urgent">Semi-Urgent</SelectItem>
            <SelectItem value="non-urgent">Non-Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Patient List */}
      <div className="space-y-3">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className={`p-4 border-l-4 ${!p.triage ? 'border-l-warning animate-pulse-subtle' : TRIAGE_CONFIG[p.triage].color} hover:shadow-sm transition-shadow`}>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                    {p.triage ? (
                      <Badge variant={TRIAGE_CONFIG[p.triage].badge} className="text-[10px]">{TRIAGE_CONFIG[p.triage].label}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] border-warning text-warning">⏳ Pending Triage</Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">{p.arrivalMode}</Badge>
                  </div>
                  <p className="font-medium text-sm text-foreground">{p.patientName}</p>
                  <p className="text-xs text-muted-foreground"><strong>Complaint:</strong> {p.complaint}</p>
                  <p className="text-xs font-mono text-muted-foreground"><Activity className="w-3 h-3 inline mr-1" />{p.vitals}</p>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{p.createdAt}</p>
                  {p.assignedNurse && <p className="text-[11px] text-muted-foreground">{p.assignedNurse}</p>}
                  {!p.triage && (
                    <Button size="sm" className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleAssessNow(p.id)}>
                      Assess Now
                    </Button>
                  )}
                  {(p.triage === 'critical' || p.triage === 'urgent') && p.status !== 'transferred-ipd' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setSelectedEmergencyId(p.id);
                        setTransferForm(prev => ({ ...prev, attendingDoctor: p.assignedDoctor || prev.attendingDoctor }));
                        setShowTransferDialog(true);
                      }}
                    >
                      Transfer to IPD
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Emergency Case to Inpatient Flow</DialogTitle>
          </DialogHeader>
          {selectedEmergency ? (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{selectedEmergency.patientName}</p>
                <p className="text-muted-foreground">{selectedEmergency.id} • {selectedEmergency.complaint}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Journey Type</label>
                  <Select value={transferForm.journeyType} onValueChange={(value) => setTransferForm(prev => ({ ...prev, journeyType: value as PatientJourneyType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IPD">IPD</SelectItem>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="Trauma">Trauma</SelectItem>
                      <SelectItem value="Surgery">Surgery / OT</SelectItem>
                      <SelectItem value="Maternity">Maternity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Nursing Priority</label>
                  <Select value={transferForm.nursingPriority} onValueChange={(value) => setTransferForm(prev => ({ ...prev, nursingPriority: value as 'high' | 'medium' | 'low' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ward</label>
                  <Input value={transferForm.ward} onChange={(event) => setTransferForm(prev => ({ ...prev, ward: event.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Bed</label>
                  <Input value={transferForm.bed} onChange={(event) => setTransferForm(prev => ({ ...prev, bed: event.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Attending Doctor</label>
                  <Input value={transferForm.attendingDoctor} onChange={(event) => setTransferForm(prev => ({ ...prev, attendingDoctor: event.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground">Primary Diagnosis</label>
                  <Input value={transferForm.primaryDiagnosis} onChange={(event) => setTransferForm(prev => ({ ...prev, primaryDiagnosis: event.target.value }))} />
                </div>
              </div>
              <Button className="w-full" onClick={handleTransfer}>Confirm Transfer</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No case selected.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}