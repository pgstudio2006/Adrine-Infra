import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Shield, AlertTriangle, Eye, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useHospital } from '@/stores/hospitalStore';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { useAdminOperationalData } from '@/hooks/useAdminOperationalData';
import { downloadCsv } from '@/lib/export';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function severityFromEventName(name: string): 'info' | 'warning' | 'critical' {
  const lower = name.toLowerCase();
  if (/critical|quota|failed|denied/.test(lower)) return 'critical';
  if (/warning|blocked|pending|deferred/.test(lower)) return 'warning';
  return 'info';
}

export default function AdminAudit() {
  const { workflowEvents } = useHospital();
  const { auditEvents, platformOn, error, loading } = useAdminOperationalData('7d');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const combinedLogs = useMemo(() => {
    const workflowLogs = workflowEvents.map((event) => {
      const severity =
        /critical|icu|mlc|emergency/.test(`${event.action} ${event.details}`.toLowerCase())
          ? 'critical'
          : /warning|overdue|partial/.test(`${event.action} ${event.details}`.toLowerCase())
            ? 'warning'
            : 'info';

      return {
        id: event.id,
        timestamp: event.timestamp,
        user: `${event.module.toUpperCase()} workflow`,
        userId: event.module,
        action: event.action.replaceAll('_', ' '),
        module: event.module.charAt(0).toUpperCase() + event.module.slice(1),
        target: event.refId || event.uhid || 'System event',
        ip: 'hospital-store',
        device: 'Workflow Engine',
        severity,
      };
    });

    const platformLogs = auditEvents.map((event) => ({
      id: event.id,
      timestamp: event.timestamp,
      user: 'Platform',
      userId: 'domain-api',
      action: event.eventName.replaceAll('.', ' '),
      module: event.resourceType ?? 'Platform',
      target: event.resourceId ?? '—',
      ip: 'domain-api',
      device: 'PlatformEvent',
      severity: severityFromEventName(event.eventName),
    }));

    return [...platformLogs, ...workflowLogs].sort(
      (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
    );
  }, [auditEvents, workflowEvents]);

  const filtered = combinedLogs.filter(l =>
    (search === '' || l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase())) &&
    (moduleFilter === 'all' || l.module === moduleFilter) &&
    (severityFilter === 'all' || l.severity === severityFilter)
  );

  const warningCount = combinedLogs.filter(item => item.severity === 'warning').length;
  const criticalCount = combinedLogs.filter(item => item.severity === 'critical').length;

  const exportLogs = () => {
    downloadCsv(
      filtered.map((l) => ({
        timestamp: l.timestamp,
        user: l.user,
        userId: l.userId,
        action: l.action,
        module: l.module,
        target: l.target,
        ip: l.ip,
        device: l.device,
        severity: l.severity,
      })),
      `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success(`Exported ${filtered.length} audit rows`);
  };

  return (
    <div className="space-y-6">
      {platformOn && (
        <PlatformConnectivityStrip
          label="Live audit feed"
          detail={`${auditEvents.length} platform events (7d) + ${workflowEvents.length} local workflow events`}
          error={error}
        />
      )}
      {!platformOn && !loading && (
        <p className="text-xs text-muted-foreground rounded-lg border border-dashed px-3 py-2">
          Preview: showing local workflow events only. Enable platform runtime for domain analytics event stream.
        </p>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">Platform events + workflow engine activity (demo seed logs removed)</p>
        </div>
        <Button variant="outline" onClick={exportLogs} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Export CSV ({filtered.length})
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Eye className="h-5 w-5 text-primary" />
          <div><p className="text-2xl font-bold">{combinedLogs.length.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Tracked Workflow Actions</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div><p className="text-2xl font-bold">{warningCount}</p><p className="text-xs text-muted-foreground">Warnings</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-destructive" />
          <div><p className="text-2xl font-bold">{criticalCount}</p><p className="text-xs text-muted-foreground">Critical Alerts</p></div>
        </CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by user or action..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {Array.from(new Set(combinedLogs.map(log => log.module))).sort((left, right) => left.localeCompare(right)).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[140px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-[90px]">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No audit events match filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow
                    key={l.id}
                    className={
                      l.severity === 'critical'
                        ? 'bg-destructive/5'
                        : l.severity === 'warning'
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : ''
                    }
                  >
                    <TableCell className="font-mono text-xs whitespace-nowrap">{l.timestamp}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{l.user}</div>
                      {l.userId && <div className="text-xs text-muted-foreground">{l.userId}</div>}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px]">{l.action}</TableCell>
                    <TableCell><Badge variant="outline">{l.module}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[160px] truncate">{l.target}</TableCell>
                    <TableCell className="font-mono text-xs">{l.ip}</TableCell>
                    <TableCell>
                      <Badge variant={l.severity === 'critical' ? 'destructive' : l.severity === 'warning' ? 'secondary' : 'outline'}>
                        {l.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
