import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ArrowRight, UserPlus } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { isActiveEmergencyCase } from '@/lib/emergency/emergency-presenters';

const FAST_TRACK_TRIAGE = ['semi-urgent', 'non-urgent'] as const;

export function EmergencyFastTrackPanel() {
  const navigate = useNavigate();
  const { emergencyCases, triageEmergencyCase } = useHospital();

  const fastTrackCases = useMemo(
    () =>
      emergencyCases.filter(
        (c) =>
          isActiveEmergencyCase(c) &&
          (!c.triage || FAST_TRACK_TRIAGE.includes(c.triage as (typeof FAST_TRACK_TRIAGE)[number])),
      ),
    [emergencyCases],
  );

  const pending = fastTrackCases.filter((c) => !c.triage);

  return (
    <Card className="border-l-4 border-l-emerald-500/60 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-foreground">Fast track</h2>
          <Badge variant="secondary" className="text-[10px]">
            {fastTrackCases.length} cases
          </Badge>
        </div>
        <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => navigate('/emergency/treatment')}>
          Treatment bay
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Semi-urgent and non-urgent pathways — rapid assess, minimal workup, disposition within 2 hours.
      </p>
      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground">No pending fast-track assessments.</p>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {pending.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{c.patientName}</p>
                <p className="text-muted-foreground font-mono truncate">{c.id}</p>
              </div>
              <Button
                size="sm"
                className="h-7 text-[10px] shrink-0"
                onClick={() =>
                  triageEmergencyCase(c.id, {
                    triage: 'semi-urgent',
                    assignedNurse: 'Fast-track nurse',
                    assignedDoctor: 'Dr. ER Fast',
                  })
                }
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Fast assess
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
