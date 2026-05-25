import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOtPlatformData } from '@/hooks/useOtPlatformData';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { InlinePlatformError } from '@/components/shared/InlinePlatformError';
import { OperationsWorklistRow } from '@/components/operations/OperationsWorklistRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOtNextAction,
  isScheduledToday,
  OT_STATE_LABELS,
  otStateBadgeClass,
} from '@/lib/operations/module-lifecycle-ui';
import { platformOtTransition } from '@/runtime/ot-runtime';
import { guardOtTransition } from '@/operations/ot-inventory-dialysis-guards';
import { toast } from 'sonner';
import { CalendarDays, Plus, Search, RefreshCw, Scissors } from 'lucide-react';
import type { PlatformOtCase } from '@/runtime/ot-runtime';

const BOARD_COLUMNS: { key: string; label: string; states: string[] }[] = [
  { key: 'scheduled', label: 'Scheduled', states: ['scheduled', 'confirmed'] },
  { key: 'preop', label: 'Pre-op', states: ['preop_ready'] },
  { key: 'active', label: 'In theatre', states: ['in_progress', 'postop_recovery'] },
  { key: 'done', label: 'Completed', states: ['completed', 'cancelled'] },
];

const DEMO_CASES: PlatformOtCase[] = [
  {
    id: 'demo-1', state: 'preop_ready', procedureName: 'Total Knee Replacement',
    surgeonName: 'Dr. Shah', priority: 'elective', scheduledAt: new Date().toISOString(),
    version: 1, patient: { id: 'p1', fullName: 'Anilaben Joshi', mrn: 'P-2081' },
    otRoom: { id: 'r2', code: 'OT-2', label: 'Ortho Theatre', state: 'reserved' },
  },
  {
    id: 'demo-2', state: 'in_progress', procedureName: 'Laparoscopic Cholecystectomy',
    surgeonName: 'Dr. Mehta', priority: 'urgent', scheduledAt: new Date().toISOString(),
    version: 1, patient: { id: 'p2', fullName: 'Ramesh Patel', mrn: 'P-1024' },
    otRoom: { id: 'r1', code: 'OT-1', label: 'Main Theatre', state: 'occupied' },
  },
];

export default function OTBoard() {
  const { user } = useAuth();
  const { platformOn, cases, loading, error, refresh } = useOtPlatformData();
  const [search, setSearch] = useState('');

  const sourceCases = platformOn ? cases : DEMO_CASES;

  const todayCases = useMemo(() => {
    return sourceCases.filter(
      (c) =>
        isScheduledToday(c.scheduledAt) &&
        (search === '' ||
          c.procedureName.toLowerCase().includes(search.toLowerCase()) ||
          (c.patient?.fullName ?? '').toLowerCase().includes(search.toLowerCase())),
    );
  }, [sourceCases, search]);

  const runTransition = async (c: PlatformOtCase) => {
    const next = getOtNextAction(c.state, user.role);
    if (!next) return;
    try {
      guardOtTransition(c.state, next.action, user.role, {
        patientIdentified: true,
        procedureDocumented: true,
        otRoomAssigned: !!c.otRoomId,
        preopChecklistComplete: true,
        consentOnFile: true,
        teamAssigned: true,
        ipdAdmissionLinkedIfRequired: true,
        intraopDocumented: true,
        postopHandoverComplete: true,
        cancelReasonProvided: true,
      });
      if (platformOn) {
        await platformOtTransition(c.id, next.action, undefined, c.version);
        await refresh();
      }
      toast.success(next.label);
    } catch {
      /* guard toast */
    }
  };

  return (
    <OperationsModulePage
      module="ot"
      layout="board"
      title="Today's OT board"
      subtitle={`${todayCases.length} case(s) for ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}`}
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to="/ot/schedule">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
              Schedule
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/ot/schedule">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New case
            </Link>
          </Button>
        </>
      }
    >
      {/* Platform error banner */}
      {platformOn && error && (
        <InlinePlatformError error={error} onRetry={() => void refresh()} />
      )}

      <div className="relative max-w-sm mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-9"
          placeholder="Search patient or procedure…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading worklist…</p>
      ) : platformOn && todayCases.length === 0 && !error ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-10 flex flex-col items-center gap-3 text-center">
            <Scissors className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No cases on today's board</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Platform is connected but no OT cases are scheduled for today.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
              <Button size="sm" asChild>
                <Link to="/ot/schedule">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Schedule case
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-4 gap-4">
          {BOARD_COLUMNS.map((col) => {
            const colCases = todayCases.filter((c) => col.states.includes(c.state));
            return (
              <div key={col.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {colCases.length}
                  </Badge>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {colCases.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="p-3 text-xs text-muted-foreground">No cases</CardContent>
                    </Card>
                  ) : (
                    colCases.map((c) => (
                      <OperationsWorklistRow
                        key={c.id}
                        primary={c.procedureName}
                        secondary={`${c.patient?.fullName ?? '—'} • ${c.surgeonName ?? '—'} • ${c.otRoom?.code ?? 'TBD'}`}
                        meta={c.patient?.mrn ?? c.id}
                        stateLabel={OT_STATE_LABELS[c.state] ?? c.state}
                        stateClassName={otStateBadgeClass(c.state)}
                        nextAction={getOtNextAction(c.state, user.role)}
                        onAction={() => void runTransition(c)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OperationsModulePage>
  );
}
