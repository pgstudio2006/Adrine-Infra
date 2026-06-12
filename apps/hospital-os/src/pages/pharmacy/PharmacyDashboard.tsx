import { useMemo } from "react";
import { isAdrine2026Experience } from "@/lib/adrine/experience";
import PharmacyDashboard2026 from "@/pages/pharmacy/PharmacyDashboard2026";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, ClipboardList, AlertTriangle, Package, TrendingUp, Clock, ShieldAlert, Activity } from "lucide-react";
import { useHospital } from "@/stores/hospitalStore";
import { useDepartmentWorklistSync } from "@/hooks/useDepartmentWorklistSync";
import { PlatformConnectivityStrip } from "@/components/PlatformConnectivityStrip";
import { isPlatformAuthoritative } from "@/runtime/platform-store-bridge";

type RecentRx = {
  id: string;
  patient: string;
  doctor: string;
  items: number;
  status: string;
  priority: string;
  time: string;
};

type DrugAlert = {
  drug: string;
  type: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
};

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Verified: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Dispensed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Partially dispensed": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const severityIcon: Record<string, string> = {
  critical: "text-destructive",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

export default function PharmacyDashboard() {
  if (isAdrine2026Experience()) {
    return <PharmacyDashboard2026 />;
  }

  const { prescriptions, pharmacyInventory } = useHospital();
  useDepartmentWorklistSync("pharmacy");

  const todayKey = new Date().toISOString().slice(0, 10);
  const pendingCount = prescriptions.filter(r => r.status === 'Pending' || r.status === 'Verified').length;
  const dispensedToday = prescriptions.filter(r => r.status === 'Dispensed' && r.date.startsWith(todayKey)).length;
  const lowStockCount = pharmacyInventory.filter(i => i.qty <= i.reorder).length;
  const nearExpiryCount = pharmacyInventory.filter(i => {
    const daysToExpiry = Math.floor((new Date(i.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 30 && daysToExpiry >= 0;
  }).length;

  const stats = [
    { label: "Pending Prescriptions", value: String(pendingCount), icon: ClipboardList, trend: pendingCount === 0 ? "No pending" : "Live store" },
    { label: "Dispensed Today", value: String(dispensedToday), icon: Pill, trend: "Live store" },
    { label: "Low Stock Alerts", value: String(lowStockCount), icon: AlertTriangle, trend: lowStockCount === 0 ? "Stock OK" : "At or below reorder" },
    { label: "Near-Expiry Items", value: String(nearExpiryCount), icon: Clock, trend: "Within 30 days" },
  ];

  const recentPrescriptions: RecentRx[] = useMemo(() => {
    return [...prescriptions]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 8)
      .map(r => ({
        id: r.id,
        patient: r.patientName,
        doctor: r.doctor,
        items: r.meds.length,
        status: r.status,
        priority: r.priority,
        time: r.date,
      }));
  }, [prescriptions]);

  const drugAlerts: DrugAlert[] = useMemo(() => {
    const alerts: DrugAlert[] = [];
    pharmacyInventory.forEach(item => {
      if (item.qty <= item.reorder) {
        alerts.push({
          drug: item.drug,
          type: "Low Stock",
          detail: `Only ${item.qty} units left (reorder at ${item.reorder})`,
          severity: item.qty === 0 ? 'critical' : 'warning',
        });
      }
      const daysToExpiry = Math.floor((new Date(item.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToExpiry <= 30 && daysToExpiry >= 0) {
        alerts.push({
          drug: item.drug,
          type: "Near Expiry",
          detail: `Batch ${item.batch} expires in ${daysToExpiry} days`,
          severity: daysToExpiry <= 7 ? 'critical' : 'warning',
        });
      }
    });
    return alerts.slice(0, 8);
  }, [pharmacyInventory]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground text-sm">Real-time overview of pharmacy operations</p>
      </div>

      {isPlatformAuthoritative() ? (
        <PlatformConnectivityStrip detail="Pharmacy worklist and inventory sync from domain-api when platform runtime is enabled." />
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.trend}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Prescriptions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Prescriptions</CardTitle>
            <Button variant="outline" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rx ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPrescriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                      No prescriptions yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentPrescriptions.map(rx => (
                  <TableRow key={rx.id}>
                    <TableCell className="font-mono text-sm">{rx.id}</TableCell>
                    <TableCell className="font-medium">{rx.patient}</TableCell>
                    <TableCell className="text-muted-foreground">{rx.doctor}</TableCell>
                    <TableCell>{rx.items}</TableCell>
                    <TableCell>
                      <Badge variant={rx.priority === "Emergency" ? "destructive" : rx.priority === "Urgent" ? "default" : "secondary"} className="text-xs">
                        {rx.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[rx.status]}`}>{rx.status}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{rx.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" /> Alerts & Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {drugAlerts.length === 0 && (
              <p className="text-xs text-muted-foreground">No stock or expiry alerts.</p>
            )}
            {drugAlerts.map((a, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className={`h-4 w-4 ${severityIcon[a.severity]}`} />
                  <span className="font-medium text-sm text-foreground">{a.drug}</span>
                </div>
                <Badge variant="outline" className="text-xs">{a.type}</Badge>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button><ClipboardList className="h-4 w-4 mr-2" /> Process Prescription</Button>
          <Button variant="outline"><Package className="h-4 w-4 mr-2" /> Add Stock</Button>
          <Button variant="outline"><TrendingUp className="h-4 w-4 mr-2" /> Sales Report</Button>
          <Button variant="outline"><AlertTriangle className="h-4 w-4 mr-2" /> Expiry Check</Button>
        </CardContent>
      </Card>
    </div>
  );
}
