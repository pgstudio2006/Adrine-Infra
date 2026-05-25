import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Shield, FileText, AlertTriangle, Clock } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { EMERGENCY_STATUS_LABELS } from '@/lib/emergency/emergency-presenters';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';

export default function EmergencyMLC() {
  const { emergencyCases, createEmergencyCase } = useHospital();
  useEmergencyOperationalStream();
  const [search, setSearch] = useState('');

  const mlcCases = useMemo(
    () => emergencyCases.filter((c) => c.mlcRequired),
    [emergencyCases],
  );

  const filtered = mlcCases.filter((c) =>
    !search ||
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.id.includes(search) ||
    (c.mlcIncidentDescription ?? c.complaint).toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = mlcCases.filter((c) => c.status !== 'discharged' && c.status !== 'transferred-ipd').length;
  const pendingPolice = mlcCases.filter((c) => !c.mlcPoliceCase).length;
  const closedCount = mlcCases.filter((c) => c.status === 'discharged' || c.status === 'transferred-ipd').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Medico-Legal Cases</h1>
          <p className="text-sm text-muted-foreground mt-1">Track MLC registrations linked to ER cases with domain patient spine</p>
        </div>
        <Button
          className="gap-2"
          onClick={() =>
            createEmergencyCase({
              patientName: 'MLC Walk-in',
              arrivalMode: 'Walk-in',
              complaint: 'Medico-legal assessment required',
              vitals: 'Pending',
              mlcRequired: true,
              mlcIncidentDescription: 'Incident details pending',
            })
          }
        >
          <Shield className="w-4 h-4" />Register MLC
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-destructive">
          <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active MLCs</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-foreground">{pendingPolice}</p>
          <p className="text-xs text-muted-foreground">Pending Police Report</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-foreground">{closedCount}</p>
          <p className="text-xs text-muted-foreground">Closed</p>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search MLC cases..." className="pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">No MLC cases recorded.</Card>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} className="p-4 border-l-4 border-l-warning hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                    <Badge variant={c.status === 'discharged' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {EMERGENCY_STATUS_LABELS[c.status]}
                    </Badge>
                    {c.uhid && <Badge variant="outline" className="text-[10px] font-mono">{c.uhid}</Badge>}
                  </div>
                  <p className="font-medium text-sm text-foreground">{c.patientName}</p>
                  <p className="text-xs text-muted-foreground">{c.mlcIncidentDescription ?? c.complaint}</p>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.createdAt}</span>
                    {c.mlcPoliceCase ? (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />{c.mlcPoliceCase} · {c.mlcReportingAuthority ?? 'Police'}
                      </span>
                    ) : (
                      <span className="text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" />FIR Pending</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">View Details</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
