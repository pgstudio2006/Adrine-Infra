import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Heart,
  Scissors,
} from 'lucide-react';
import { WorkspacePage, MetricStrip, WorkflowPanel } from '@/components/shell/workspace-primitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useOtPlatformData } from '@/hooks/useOtPlatformData';
import { mapOtCaseToRoomCard } from '@/lib/ot/ot-presenters';
import { allowDemoFallback, pickPlatformRows } from '@/lib/platform/demo-fallback';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  in_progress: 'In progress',
  preparing: 'Preparing',
  available: 'Available',
  cleaning: 'Turnover',
};

const STATUS_CLASS: Record<string, string> = {
  in_progress: 'bg-emerald-500/10 text-emerald-700',
  preparing: 'bg-amber-500/10 text-amber-700',
  available: 'bg-blue-500/10 text-blue-700',
  cleaning: 'bg-muted text-muted-foreground',
};

const DEMO_UPCOMING = [
  { time: '11:00 AM', surgery: 'Total Knee Replacement', surgeon: 'Dr. Shah', room: 'OT-2', priority: 'elective' as const },
  { time: '01:30 PM', surgery: 'Appendectomy', surgeon: 'Dr. Mehta', room: 'OT-1', priority: 'urgent' as const },
  { time: '02:00 PM', surgery: 'Cataract Surgery', surgeon: 'Dr. Desai', room: 'OT-4', priority: 'elective' as const },
];

export default function OTDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, cases, rooms, loading, error, refresh } = useOtPlatformData();

  const hasLiveData = platformOn && cases.length > 0;

  const todaySurgeries = useMemo(() => {
    if (hasLiveData) {
      return cases.filter((c) => !['cancelled'].includes(c.state));
    }
    return pickPlatformRows(false, [], DEMO_UPCOMING.map((s, i) => ({
      id: `demo-${i}`,
      state: 'scheduled',
      procedureName: s.surgery,
      surgeonName: s.surgeon,
      scheduledAt: null,
      priority: s.priority,
      otRoom: { code: s.room },
    })));
  }, [hasLiveData, cases]);

  const roomCards = useMemo(() => {
    if (platformOn && rooms.length > 0) {
      return rooms.map((room) => {
        const active = cases.find((c) => c.otRoomId === room.id);
        return mapOtCaseToRoomCard(room, active);
      });
    }
    return [];
  }, [platformOn, cases, rooms]);

  const stats = useMemo(() => {
    if (hasLiveData) {
      const scheduled = cases.filter((c) => ['scheduled', 'confirmed'].includes(c.state)).length;
      const inProgress = cases.filter((c) => c.state === 'in_progress').length;
      const completed = cases.filter((c) => c.state === 'completed').length;
      const preOp = cases.filter((c) => ['confirmed', 'preop_ready'].includes(c.state)).length;
      const postOp = cases.filter((c) => c.state === 'postop_recovery').length;
      const occupiedRooms = roomCards.filter((r) => r.status === 'in_progress' || r.status === 'preparing').length;
      const utilizationPct = rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
      return { scheduled, inProgress, completed, preOp, postOp, utilizationPct, occupiedRooms, totalRooms: rooms.length };
    }
    const fallbackScheduled = allowDemoFallback() ? 8 : 0;
    const fallbackInProgress = allowDemoFallback() ? 1 : 0;
    const fallbackCompleted = allowDemoFallback() ? 3 : 0;
    return {
      scheduled: fallbackScheduled,
      inProgress: fallbackInProgress,
      completed: fallbackCompleted,
      preOp: allowDemoFallback() ? 2 : 0,
      postOp: allowDemoFallback() ? 2 : 0,
      utilizationPct: allowDemoFallback() ? 50 : 0,
      occupiedRooms: allowDemoFallback() ? 2 : 0,
      totalRooms: allowDemoFallback() ? 4 : 0,
    };
  }, [hasLiveData, cases, roomCards, rooms.length]);

  const upcomingList = useMemo(() => {
    if (hasLiveData) {
      return cases
        .filter((c) => !['completed', 'cancelled', 'in_progress', 'postop_recovery'].includes(c.state))
        .slice(0, 6)
        .map((c) => ({
          id: c.id,
          time: c.scheduledAt
            ? new Date(c.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
            : '—',
          surgery: c.procedureName,
          surgeon: c.surgeonName ?? '—',
          room: c.otRoom?.code ?? 'TBD',
          priority: c.priority,
        }));
    }
    return DEMO_UPCOMING;
  }, [hasLiveData, cases]);

  const preOpCases = useMemo(
    () => (hasLiveData ? cases.filter((c) => ['confirmed', 'preop_ready'].includes(c.state)).slice(0, 6) : []),
    [hasLiveData, cases],
  );

  const postOpCases = useMemo(
    () => (hasLiveData ? cases.filter((c) => c.state === 'postop_recovery').slice(0, 6) : []),
    [hasLiveData, cases],
  );

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <WorkspacePage
      title="Operation theatre"
      subtitle={`${dateLabel} · Today's surgeries, room utilization, pre-op checklist, and post-op recovery.`}
      actions={
        <>
          {platformOn && error && (
            <Button size="sm" variant="outline" onClick={() => void refresh()}>
              Retry
            </Button>
          )}
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/ot/board')}>
            <Scissors className="h-3.5 w-3.5" />
            Today's board
          </Button>
        </>
      }
    >
      <MetricStrip
        columns={4}
        metrics={[
          {
            id: 'scheduled',
            label: "Today's surgeries",
            value: todaySurgeries.length,
            hint: `${stats.scheduled} scheduled`,
            icon: Clock,
          },
          {
            id: 'rooms',
            label: 'Room utilization',
            value: `${stats.utilizationPct}%`,
            hint: `${stats.occupiedRooms}/${stats.totalRooms || '—'} rooms active`,
            icon: Activity,
          },
          {
            id: 'preop',
            label: 'Pre-op checklist',
            value: stats.preOp,
            hint: 'Awaiting clearance',
            icon: ClipboardCheck,
          },
          {
            id: 'postop',
            label: 'Post-op recovery',
            value: stats.postOp,
            hint: stats.inProgress ? `${stats.inProgress} in theatre` : 'Recovery ward',
            icon: Heart,
          },
        ]}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <WorkflowPanel title="Today's surgeries" className="lg:col-span-2">
          {loading && platformOn ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading OT worklist…</p>
          ) : upcomingList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No surgeries scheduled today.</p>
          ) : (
            <ul className="divide-y divide-border/60 -mx-4 -mb-4">
              {upcomingList.map((s, i) => (
                <li
                  key={'id' in s ? s.id : i}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => navigate('/ot/board')}
                >
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.surgery}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.surgeon} · {s.room}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground">{s.time}</span>
                    {'priority' in s && s.priority !== 'elective' && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {s.priority}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/ot/schedule')}
          >
            Full schedule <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="Room utilization">
          {roomCards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {platformOn ? 'No OT rooms configured.' : 'Connect OT platform for live room status.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {roomCards.map((room) => (
                <li
                  key={room.room}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/ot/rooms')}
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{room.label || room.room}</span>
                    <Badge variant="outline" className={cn('text-[10px]', STATUS_CLASS[room.status])}>
                      {STATUS_LABEL[room.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{room.surgery}</p>
                </li>
              ))}
            </ul>
          )}
        </WorkflowPanel>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <WorkflowPanel title="Pre-op checklist">
          {preOpCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasLiveData ? 'No cases awaiting pre-op clearance.' : 'Open pre-op workspace for checklist drill.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {preOpCases.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/ot/preop')}
                >
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.procedureName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.surgeonName ?? '—'} · {c.otRoom?.code ?? 'TBD'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {c.state}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/ot/preop')}
          >
            Pre-op workspace <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>

        <WorkflowPanel title="Post-op recovery">
          {postOpCases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasLiveData ? 'No patients in post-op recovery.' : 'Recovery patients appear when cases complete.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {postOpCases.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/ot/postop')}
                >
                  <Heart className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.patient?.fullName ?? c.procedureName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.procedureName} · {c.surgeonName ?? '—'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    recovery
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 gap-1 text-xs"
            onClick={() => navigate('/ot/postop')}
          >
            Post-op workspace <ArrowRight className="h-3 w-3" />
          </Button>
        </WorkflowPanel>
      </div>

      <WorkflowPanel title="Quick actions">
        <div className="grid sm:grid-cols-3 gap-3">
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/ot/board')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <Scissors className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">OT board</p>
                <p className="text-xs text-muted-foreground">{stats.completed} completed today</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/ot/preop')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Pre-op</p>
                <p className="text-xs text-muted-foreground">{stats.preOp} awaiting</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer border-foreground/10 hover:border-foreground/25 hover:shadow-sm transition-all"
            onClick={() => navigate('/ot/postop')}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-foreground/70" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Post-op</p>
                <p className="text-xs text-muted-foreground">{stats.postOp} in recovery</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </WorkflowPanel>
    </WorkspacePage>
  );
}
