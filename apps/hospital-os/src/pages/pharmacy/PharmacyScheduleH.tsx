import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, ShieldAlert, Pill, FileText, AlertTriangle, ClipboardList } from 'lucide-react';
import { useState } from 'react';

const scheduleHDrugs = [
  { id: 'SH-001', name: 'Morphine Sulfate 10mg', schedule: 'H1', category: 'Opioid Analgesic', batchNo: 'BT-4521', stock: 45, dispensed: 12, prescribed: 'Dr. Sharma', lastDispensed: '2026-03-07' },
  { id: 'SH-002', name: 'Diazepam 5mg', schedule: 'H', category: 'Benzodiazepine', batchNo: 'BT-4522', stock: 120, dispensed: 28, prescribed: 'Dr. Kumar', lastDispensed: '2026-03-07' },
  { id: 'SH-003', name: 'Tramadol 50mg', schedule: 'H', category: 'Opioid Analgesic', batchNo: 'BT-4523', stock: 200, dispensed: 45, prescribed: 'Dr. Patel', lastDispensed: '2026-03-06' },
  { id: 'SH-004', name: 'Alprazolam 0.5mg', schedule: 'H', category: 'Benzodiazepine', batchNo: 'BT-4524', stock: 85, dispensed: 18, prescribed: 'Dr. Mishra', lastDispensed: '2026-03-07' },
  { id: 'SH-005', name: 'Fentanyl 100mcg Patch', schedule: 'H1', category: 'Opioid Analgesic', batchNo: 'BT-4525', stock: 15, dispensed: 3, prescribed: 'Dr. Sharma', lastDispensed: '2026-03-05' },
  { id: 'SH-006', name: 'Ketamine 50mg/ml', schedule: 'H1', category: 'Anesthetic', batchNo: 'BT-4526', stock: 30, dispensed: 8, prescribed: 'Dr. Singh', lastDispensed: '2026-03-06' },
  { id: 'SH-007', name: 'Codeine Phosphate 30mg', schedule: 'H', category: 'Opioid Analgesic', batchNo: 'BT-4527', stock: 60, dispensed: 15, prescribed: 'Dr. Kumar', lastDispensed: '2026-03-07' },
  { id: 'SH-008', name: 'Midazolam 5mg/ml', schedule: 'H', category: 'Benzodiazepine', batchNo: 'BT-4528', stock: 40, dispensed: 10, prescribed: 'Dr. Patel', lastDispensed: '2026-03-04' },
];

const dispensingLog = [
  { date: '2026-03-07', time: '09:15', drug: 'Morphine Sulfate 10mg', patient: 'Ramesh K. (UHID-4521)', doctor: 'Dr. Sharma', qty: 2, dispensedBy: 'Phm. Anita D.' },
  { date: '2026-03-07', time: '10:30', drug: 'Diazepam 5mg', patient: 'Suresh P. (UHID-4522)', doctor: 'Dr. Kumar', qty: 10, dispensedBy: 'Phm. Anita D.' },
  { date: '2026-03-07', time: '11:45', drug: 'Tramadol 50mg', patient: 'Lakshmi S. (UHID-4523)', doctor: 'Dr. Patel', qty: 5, dispensedBy: 'Phm. Rakesh M.' },
  { date: '2026-03-07', time: '14:00', drug: 'Alprazolam 0.5mg', patient: 'Anita M. (UHID-4524)', doctor: 'Dr. Mishra', qty: 14, dispensedBy: 'Phm. Rakesh M.' },
  { date: '2026-03-06', time: '16:20', drug: 'Fentanyl 100mcg Patch', patient: 'IPD-Ward 3 (UHID-4525)', doctor: 'Dr. Sharma', qty: 1, dispensedBy: 'Phm. Anita D.' },
  { date: '2026-03-06', time: '08:30', drug: 'Ketamine 50mg/ml', patient: 'OT-Room 2 (UHID-4526)', doctor: 'Dr. Singh', qty: 2, dispensedBy: 'Phm. Anita D.' },
];

const alerts = [
  { type: 'Low Stock', drug: 'Fentanyl 100mcg Patch', detail: 'Only 15 units remaining. Reorder level: 20', severity: 'High' },
  { type: 'High Consumption', drug: 'Tramadol 50mg', detail: '45 units dispensed this week vs avg 30', severity: 'Medium' },
  { type: 'Expiry Warning', drug: 'Ketamine 50mg/ml (BT-4526)', detail: 'Batch expires on 2026-04-15', severity: 'Medium' },
  { type: 'Unusual Pattern', drug: 'Diazepam 5mg', detail: '28 units to single department in 3 days', severity: 'Low' },
];

export default function PharmacyScheduleH() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedule H Drug Report</h1>
          <p className="text-sm text-muted-foreground mt-1">Controlled substance tracking, dispensing logs, and compliance reporting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Schedule H Drugs', value: '8', icon: Pill, sub: '3 Schedule H1' },
          { label: 'Dispensed Today', value: '4', icon: ClipboardList, sub: '31 units total' },
          { label: 'Active Alerts', value: '4', icon: AlertTriangle, sub: '1 high severity' },
          { label: 'Compliance Score', value: '96%', icon: ShieldAlert, sub: 'All prescriptions valid' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
              </div>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Drug Inventory</TabsTrigger>
          <TabsTrigger value="dispensing">Dispensing Log</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search controlled drugs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schedules</SelectItem>
                <SelectItem value="h">Schedule H</SelectItem>
                <SelectItem value="h1">Schedule H1</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug ID</TableHead>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Dispensed (Week)</TableHead>
                  <TableHead>Last Dispensed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduleHDrugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase())).map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.id}</TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>
                      <Badge variant={d.schedule === 'H1' ? 'destructive' : 'default'} className="text-xs">{d.schedule}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.category}</TableCell>
                    <TableCell className="font-mono text-xs">{d.batchNo}</TableCell>
                    <TableCell className={d.stock < 20 ? 'text-destructive font-bold' : 'font-medium'}>{d.stock}</TableCell>
                    <TableCell>{d.dispensed}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{d.lastDispensed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="dispensing" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Drug</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Prescribing Doctor</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Dispensed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispensingLog.map((l, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{l.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.time}</TableCell>
                    <TableCell className="font-medium">{l.drug}</TableCell>
                    <TableCell className="text-sm">{l.patient}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.doctor}</TableCell>
                    <TableCell className="font-bold">{l.qty}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.dispensedBy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-0.5 ${a.severity === 'High' ? 'text-destructive' : a.severity === 'Medium' ? 'text-warning' : 'text-muted-foreground'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{a.type}</h4>
                        <Badge variant={a.severity === 'High' ? 'destructive' : a.severity === 'Medium' ? 'secondary' : 'outline'} className="text-xs">{a.severity}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-0.5">{a.drug}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">Acknowledge</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
