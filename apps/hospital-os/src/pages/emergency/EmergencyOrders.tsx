import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FlaskConical,
  ScanLine,
  Pill,
  Clock,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  ChevronDown,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import {
  emergencyCasesForOrders,
  isActiveEmergencyCase,
} from '@/lib/emergency/emergency-presenters';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';
import { isPlatformRuntimeEnabled } from '@/runtime/platform-session';

const TYPE_ICONS: Record<string, LucideIcon> = { Lab: FlaskConical, Radiology: ScanLine, Pharmacy: Pill };

const STATUS_STYLE: Record<string, string> = {
  Pending: 'bg-warning/10 text-warning',
  'In Progress': 'bg-info/10 text-info',
  Completed: 'bg-success/10 text-success',
  Dispensed: 'bg-success/10 text-success',
  'Pending Analysis': 'bg-warning/10 text-warning',
  'In Analysis': 'bg-info/10 text-info',
  Reported: 'bg-success/10 text-success',
  Ordered: 'bg-warning/10 text-warning',
  Scheduled: 'bg-info/10 text-info',
};

type ErOrderRow = {
  id: string;
  caseId: string;
  patient: string;
  type: 'Lab' | 'Radiology' | 'Pharmacy';
  item: string;
  priority: string;
  status: string;
  time: string;
  dept: string;
};

export default function EmergencyOrders() {
  const navigate = useNavigate();
  const { emergencyCases, labOrders, radiologyOrders, prescriptions } = useHospital();
  useEmergencyOperationalStream({ worklists: true });
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const activeCasesWithUhid = useMemo(
    () => emergencyCases.filter((c) => isActiveEmergencyCase(c) && c.uhid),
    [emergencyCases],
  );

  const orders = useMemo(() => {
    const { labs, rads, activeIds } = emergencyCasesForOrders(
      emergencyCases,
      labOrders,
      radiologyOrders,
    );
    const rows: ErOrderRow[] = [
      ...labs.map((o) => ({
        id: o.orderId,
        caseId: emergencyCases.find((c) => c.uhid === o.uhid)?.id ?? o.uhid,
        patient: o.patientName,
        type: 'Lab' as const,
        item: o.tests,
        priority: o.priority,
        status: o.stage,
        time: o.orderTime,
        dept: 'Laboratory',
      })),
      ...rads.map((o) => ({
        id: o.orderId,
        caseId: emergencyCases.find((c) => c.uhid === o.uhid)?.id ?? o.uhid,
        patient: o.patientName,
        type: 'Radiology' as const,
        item: o.study,
        priority: o.priority,
        status: o.status,
        time: o.orderTime,
        dept: 'Radiology',
      })),
    ];

    for (const rx of prescriptions) {
      const linked = emergencyCases.find((c) => c.uhid === rx.uhid && activeIds.has(c.id));
      if (!linked) continue;
      rows.push({
        id: rx.id,
        caseId: linked.id,
        patient: rx.patientName,
        type: 'Pharmacy',
        item: rx.meds.map((m) => m.drug).join(', '),
        priority: rx.priority ?? 'Routine',
        status: rx.status,
        time: rx.date,
        dept: 'Pharmacy',
      });
    }

    return rows;
  }, [emergencyCases, labOrders, radiologyOrders, prescriptions]);

  const filtered = useMemo(() => {
    const byTab = tab === 'all' ? orders : orders.filter((o) => o.type === tab);
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(
      (o) =>
        o.patient.toLowerCase().includes(q) ||
        o.caseId.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.item.toLowerCase().includes(q),
    );
  }, [orders, tab, search]);

  const canCreateOrders = activeCasesWithUhid.length > 0;
  const statOrders = orders;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Emergency Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lab, radiology, and pharmacy orders linked to active ER cases
            {isPlatformRuntimeEnabled() ? ' — worklists refresh via SSE when platform runtime is on' : ''}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2" disabled={!canCreateOrders}>
              Create Orders
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Order via governed clinical paths</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activeCasesWithUhid.slice(0, 5).map((c) => (
              <DropdownMenuItem
                key={c.id}
                className="gap-2 cursor-pointer"
                onClick={() => navigate(`/doctor/consultation/${c.uhid}`)}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="truncate">
                  Consultation — {c.patientName} ({c.id})
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/lab/worklist" className="gap-2 cursor-pointer">
                <FlaskConical className="w-4 h-4" />
                Lab worklist
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/radiology/orders" className="gap-2 cursor-pointer">
                <ScanLine className="w-4 h-4" />
                Radiology orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/pharmacy/prescriptions" className="gap-2 cursor-pointer">
                <Pill className="w-4 h-4" />
                Pharmacy prescriptions
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!canCreateOrders && (
        <Card className="p-4 border-dashed text-sm text-muted-foreground">
          No active ER case with a registered UHID yet. Complete triage first — orders are placed through{' '}
          <strong className="font-medium text-foreground">Doctor Consultation</strong> once the platform patient spine exists.
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: statOrders.length, icon: AlertTriangle },
          {
            label: 'STAT / Emergency',
            value: statOrders.filter((o) => o.priority === 'STAT' || o.priority === 'Emergency').length,
            icon: Clock,
          },
          {
            label: 'Completed',
            value: statOrders.filter((o) => ['Completed', 'Dispensed', 'Reported'].includes(o.status)).length,
            icon: CheckCircle,
          },
          {
            label: 'In Progress',
            value: statOrders.filter((o) => ['In Progress', 'In Analysis', 'Scheduled'].includes(o.status)).length,
            icon: FlaskConical,
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patient, case, or order…"
          className="pl-9 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="Lab">Lab ({orders.filter((o) => o.type === 'Lab').length})</TabsTrigger>
          <TabsTrigger value="Radiology">
            Radiology ({orders.filter((o) => o.type === 'Radiology').length})
          </TabsTrigger>
          <TabsTrigger value="Pharmacy">
            Pharmacy ({orders.filter((o) => o.type === 'Pharmacy').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              No orders match. Use <strong className="font-medium text-foreground">Create Orders → Consultation</strong> for a triaged patient with UHID.
            </Card>
          ) : (
            filtered.map((o) => {
              const Icon = TYPE_ICONS[o.type] || FlaskConical;
              const isStat = o.priority === 'STAT' || o.priority === 'Emergency';
              return (
                <Card
                  key={o.id}
                  className={`p-4 hover:shadow-sm transition-shadow ${isStat ? 'border-l-4 border-l-destructive' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-foreground" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                          <Badge variant={isStat ? 'destructive' : 'outline'} className="text-[10px]">
                            {o.priority}
                          </Badge>
                          <Badge className={`text-[10px] ${STATUS_STYLE[o.status] || ''}`}>{o.status}</Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">{o.item}</p>
                        <p className="text-xs text-muted-foreground">
                          {o.caseId} · {o.patient} · {o.dept}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {o.time}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
