import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pill, ClipboardList, AlertTriangle, Package, TrendingUp, Clock, ShieldAlert, Activity } from "lucide-react";

const stats = [
  { label: "Pending Prescriptions", value: "23", icon: ClipboardList, trend: "+5 from yesterday" },
  { label: "Dispensed Today", value: "87", icon: Pill, trend: "12% above avg" },
  { label: "Low Stock Alerts", value: "14", icon: AlertTriangle, trend: "3 critical" },
  { label: "Near-Expiry Items", value: "9", icon: Clock, trend: "Within 30 days" },
];

const recentPrescriptions = [
  { id: "RX-2401", patient: "Ravi Sharma", doctor: "Dr. Patel", items: 4, status: "Pending", priority: "Urgent", time: "2 min ago" },
  { id: "RX-2400", patient: "Anita Desai", doctor: "Dr. Mehta", items: 2, status: "Verified", priority: "Routine", time: "8 min ago" },
  { id: "RX-2399", patient: "Suresh Kumar", doctor: "Dr. Rao", items: 6, status: "Dispensed", priority: "Routine", time: "15 min ago" },
  { id: "RX-2398", patient: "Meena Joshi", doctor: "Dr. Shah", items: 3, status: "Partially dispensed", priority: "Urgent", time: "22 min ago" },
  { id: "RX-2397", patient: "Vikram Singh", doctor: "Dr. Gupta", items: 1, status: "Dispensed", priority: "Emergency", time: "30 min ago" },
];

const drugAlerts = [
  { drug: "Amoxicillin 500mg", type: "Low Stock", detail: "Only 24 units left", severity: "critical" },
  { drug: "Metformin 850mg", type: "Near Expiry", detail: "Batch B-4421 expires in 12 days", severity: "warning" },
  { drug: "Morphine 10mg", type: "Controlled", detail: "Dispensed 3 times today — review required", severity: "info" },
  { drug: "Ciprofloxacin 250mg", type: "Interaction Alert", detail: "Flagged in 2 prescriptions today", severity: "warning" },
];

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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pharmacy Dashboard</h1>
        <p className="text-muted-foreground text-sm">Real-time overview of pharmacy operations</p>
      </div>

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
