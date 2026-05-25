import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Stethoscope, Syringe, HeartPulse, Clock, Zap
} from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { EMERGENCY_TRIAGE_LABELS } from '@/lib/emergency/emergency-presenters';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';

const emergencyProcedures = [
  { name: 'CPR', icon: HeartPulse },
  { name: 'Intubation', icon: Zap },
  { name: 'Defibrillation', icon: Zap },
  { name: 'Wound Suturing', icon: Syringe },
  { name: 'Fracture Stabilization', icon: Stethoscope },
  { name: 'Chest Tube', icon: Stethoscope },
];

function parseVitals(vitals: string) {
  const parts = vitals.split(',').map((p) => p.trim());
  const map: Record<string, string> = {};
  for (const part of parts) {
    const [key, ...rest] = part.split(' ');
    if (key && rest.length) map[key.toLowerCase()] = rest.join(' ');
  }
  return map;
}

export default function EmergencyTreatment() {
  const {
    emergencyCases,
    startEmergencyTreatment,
    moveEmergencyToObservation,
    dischargeEmergencyCase,
    triageEmergencyCase,
  } = useHospital();
  useEmergencyOperationalStream();

  const activeTreatments = useMemo(
    () =>
      emergencyCases.filter(
        (c) =>
          c.status === 'in-treatment' ||
          c.status === 'triaged' ||
          (c.triage && c.status === 'triage-pending'),
      ),
    [emergencyCases],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Treatment Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">Record symptoms, procedures, and medications for active ER cases</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">Quick Procedure Log</h2>
        <div className="flex flex-wrap gap-2">
          {emergencyProcedures.map((p) => (
            <Button key={p.name} variant="outline" size="sm" className="text-xs gap-1.5">
              <p.icon className="w-3 h-3" /> {p.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activeTreatments.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">No active treatment cases. Triage a patient to begin.</Card>
        ) : (
          activeTreatments.map((t, i) => {
            const vitals = parseVitals(t.vitals);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`p-5 border-l-4 ${t.triage === 'critical' ? 'border-l-destructive' : 'border-l-warning'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                        {t.triage && (
                          <Badge variant={t.triage === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                            {EMERGENCY_TRIAGE_LABELS[t.triage]}
                          </Badge>
                        )}
                        {t.uhid && <Badge variant="outline" className="text-[10px] font-mono">{t.uhid}</Badge>}
                      </div>
                      <p className="font-medium text-foreground mt-1">{t.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.assignedDoctor ?? 'Unassigned'} · {t.location ?? 'ER Bay'} · Started {t.createdAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {t.status !== 'in-treatment' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            if (!t.triage) {
                              triageEmergencyCase(t.id, {
                                triage: 'urgent',
                                assignedDoctor: t.assignedDoctor ?? 'Dr. A. Shah',
                              });
                            }
                            startEmergencyTreatment(t.id, t.location ?? 'Treatment Bay');
                          }}
                        >
                          Start Treatment
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => moveEmergencyToObservation(t.id, `OBS-${String(i + 1).padStart(2, '0')}`)}
                      >
                        Move to Obs
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => dischargeEmergencyCase(t.id)}>
                        Discharge
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="vitals">
                    <TabsList className="h-8">
                      <TabsTrigger value="vitals" className="text-xs">Vitals</TabsTrigger>
                      <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="vitals" className="mt-3">
                      <div className="grid grid-cols-5 gap-3">
                        {Object.entries(vitals).map(([key, val]) => (
                          <Card key={key} className="p-3 text-center">
                            <p className="text-[10px] uppercase text-muted-foreground">{key}</p>
                            <p className="text-sm font-bold text-foreground mt-1">{val}</p>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-3">
                      <Textarea placeholder="Add treatment notes..." className="text-sm min-h-[80px]" defaultValue={t.complaint} />
                      <Button size="sm" className="mt-2 text-xs">Save Notes</Button>
                    </TabsContent>
                  </Tabs>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
