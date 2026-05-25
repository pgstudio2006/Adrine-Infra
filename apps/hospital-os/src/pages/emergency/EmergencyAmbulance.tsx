import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ambulance, Clock, MapPin, Phone, User, Radio } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { isActiveEmergencyCase } from '@/lib/emergency/emergency-presenters';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';

const STATUS_STYLE: Record<string, string> = {
  'At Hospital': 'bg-success/10 text-success',
  'En Route': 'bg-warning/10 text-warning',
  Available: 'bg-muted text-muted-foreground',
  'On Call': 'bg-info/10 text-info',
};

export default function EmergencyAmbulance() {
  const { emergencyCases, createEmergencyCase } = useHospital();
  useEmergencyOperationalStream();

  const ambulanceCases = useMemo(
    () => emergencyCases.filter((c) => c.arrivalMode === 'Ambulance'),
    [emergencyCases],
  );

  const activeAmbulance = ambulanceCases.filter((c) => isActiveEmergencyCase(c));
  const enRoute = activeAmbulance.filter((c) => c.status === 'triage-pending');
  const atHospital = activeAmbulance.filter((c) => c.status !== 'triage-pending');

  const logAmbulanceArrival = () => {
    createEmergencyCase({
      patientName: 'Ambulance Arrival — TBD',
      arrivalMode: 'Ambulance',
      complaint: 'Pre-hospital handoff — assessment pending',
      vitals: 'Pending paramedic report',
      mlcRequired: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ambulance Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Ambulance-linked ER cases with governed patient registration</p>
        </div>
        <Button className="gap-2" onClick={logAmbulanceArrival}>
          <Radio className="w-4 h-4" />Log Ambulance Arrival
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Ambulance Cases', value: ambulanceCases.length },
          { label: 'En Route / Pending', value: enRoute.length },
          { label: 'At Hospital', value: atHospital.length },
          { label: 'Closed', value: ambulanceCases.length - activeAmbulance.length },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>

        {['all', 'active', 'closed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
            {ambulanceCases
              .filter((c) =>
                tab === 'all' ||
                (tab === 'active' && isActiveEmergencyCase(c)) ||
                (tab === 'closed' && !isActiveEmergencyCase(c)),
              )
              .map((a) => {
                const status =
                  a.status === 'triage-pending' ? 'En Route' : isActiveEmergencyCase(a) ? 'At Hospital' : 'Closed';
                return (
                  <Card key={a.id} className="p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Ambulance className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">{a.id}</span>
                            <Badge className={`text-[10px] ${STATUS_STYLE[status]}`}>{status}</Badge>
                            {a.uhid && <Badge variant="outline" className="text-[10px] font-mono">{a.uhid}</Badge>}
                          </div>
                          <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{a.assignedDoctor ?? 'ER team'}</span>
                            {a.phone && (
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>
                            )}
                          </div>
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs space-y-0.5">
                            <p className="text-muted-foreground">{a.complaint}</p>
                            {a.referralHospital && (
                              <p className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />From {a.referralHospital}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />{a.createdAt}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
