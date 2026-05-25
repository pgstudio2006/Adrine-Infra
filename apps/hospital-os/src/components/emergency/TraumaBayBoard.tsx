import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { isActiveEmergencyCase, EMERGENCY_TRIAGE_LABELS } from '@/lib/emergency/emergency-presenters';

const TRAUMA_BAYS = [
  { id: 'TB-1', label: 'Trauma Bay 1', capacity: 1 },
  { id: 'TB-2', label: 'Trauma Bay 2', capacity: 1 },
  { id: 'TB-3', label: 'Resus Bay', capacity: 1 },
  { id: 'TB-4', label: 'Observation', capacity: 2 },
] as const;

export function TraumaBayBoard() {
  const { emergencyCases } = useHospital();

  const traumaCases = useMemo(
    () =>
      emergencyCases.filter(
        (c) =>
          isActiveEmergencyCase(c) &&
          (c.triage === 'critical' ||
            c.triage === 'urgent' ||
            c.complaint?.toLowerCase().includes('trauma') ||
            c.arrivalMode === 'Ambulance'),
      ),
    [emergencyCases],
  );

  const assignments = useMemo(() => {
    const map = new Map<string, typeof traumaCases>();
    TRAUMA_BAYS.forEach((bay, i) => {
      const slice = traumaCases.slice(
        TRAUMA_BAYS.slice(0, i).reduce((s, b) => s + b.capacity, 0),
        TRAUMA_BAYS.slice(0, i + 1).reduce((s, b) => s + b.capacity, 0),
      );
      map.set(bay.id, slice);
    });
    return map;
  }, [traumaCases]);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Activity className="w-4 h-4 text-destructive" />
        Trauma bay board
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {TRAUMA_BAYS.map((bay) => {
          const occupants = assignments.get(bay.id) ?? [];
          const occupied = occupants.length >= bay.capacity;
          return (
            <Card
              key={bay.id}
              className={`p-3 ${occupied ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">{bay.label}</span>
                <Badge variant={occupied ? 'destructive' : 'outline'} className="text-[9px]">
                  {occupants.length}/{bay.capacity}
                </Badge>
              </div>
              {occupants.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">Available</p>
              ) : (
                occupants.map((c) => (
                  <div key={c.id} className="text-[10px] border-t border-border/60 pt-1.5 mt-1.5 first:mt-0 first:pt-0 first:border-0">
                    <p className="font-medium truncate">{c.patientName}</p>
                    {c.triage && (
                      <p className="text-muted-foreground">{EMERGENCY_TRIAGE_LABELS[c.triage]}</p>
                    )}
                  </div>
                ))
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
