import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Plus, Wrench, BarChart3, AlertTriangle } from "lucide-react";

const machines = [
  { id: "HD-01", model: "Fresenius 5008S", serial: "FS-2021-45678", location: "Bay 1", status: "Available", hours: 12450, maxHours: 15000, lastMaint: "2024-12-15", nextMaint: "2025-03-15", sessionsTotal: 3112, sessionsMonth: 24, downtime: 2 },
  { id: "HD-02", model: "Fresenius 5008S", serial: "FS-2021-45679", location: "Bay 2", status: "In Use", hours: 11200, maxHours: 15000, lastMaint: "2025-01-10", nextMaint: "2025-04-10", sessionsTotal: 2800, sessionsMonth: 22, downtime: 0 },
  { id: "HD-03", model: "B.Braun Dialog+", serial: "BB-2022-33456", location: "Bay 3", status: "Available", hours: 9800, maxHours: 15000, lastMaint: "2025-01-20", nextMaint: "2025-04-20", sessionsTotal: 2450, sessionsMonth: 20, downtime: 1 },
  { id: "HD-04", model: "Nipro Surdial X", serial: "NP-2023-22334", location: "Bay 4", status: "Available", hours: 7600, maxHours: 15000, lastMaint: "2025-02-05", nextMaint: "2025-05-05", sessionsTotal: 1900, sessionsMonth: 18, downtime: 0 },
  { id: "HD-05", model: "Fresenius 5008S", serial: "FS-2020-12345", location: "Bay 5", status: "In Use", hours: 13100, maxHours: 15000, lastMaint: "2024-11-28", nextMaint: "2025-02-28", sessionsTotal: 3275, sessionsMonth: 26, downtime: 4 },
  { id: "HD-06", model: "B.Braun Dialog+", serial: "BB-2019-99887", location: "Bay 6", status: "Maintenance", hours: 15200, maxHours: 15000, lastMaint: "2025-02-20", nextMaint: "—", sessionsTotal: 3800, sessionsMonth: 0, downtime: 15 },
];

const maintenanceLogs = [
  { machine: "HD-06", date: "2025-02-20", type: "Corrective", description: "Pump motor replacement — excessive noise and flow inconsistency", tech: "BioMed Team", status: "In Progress", cost: "₹45,000" },
  { machine: "HD-05", date: "2025-02-28", type: "Preventive", description: "Scheduled PM — 13000 hr service, membrane check, calibration", tech: "Fresenius Engineer", status: "Overdue", cost: "₹12,000" },
  { machine: "HD-01", date: "2024-12-15", type: "Preventive", description: "Routine PM — filter replacement, disinfection, calibration", tech: "Fresenius Engineer", status: "Completed", cost: "₹8,500" },
  { machine: "HD-03", date: "2025-01-20", type: "Preventive", description: "Routine PM — tubing replacement, pressure sensor calibration", tech: "B.Braun Engineer", status: "Completed", cost: "₹9,200" },
];

export default function DialysisMachines() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <OperationsModulePage module="dialysis" layout="list" title="Machine management" subtitle="Dialysis machine inventory, utilization, and maintenance" actions={
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Machine</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Machine</DialogTitle></DialogHeader>
            <div className="grid gap-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Machine ID</Label><Input placeholder="HD-07" className="mt-1" /></div>
                <div><Label>Model</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fresenius 5008S">Fresenius 5008S</SelectItem>
                      <SelectItem value="B.Braun Dialog+">B.Braun Dialog+</SelectItem>
                      <SelectItem value="Nipro Surdial X">Nipro Surdial X</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Serial Number</Label><Input placeholder="FS-2025-XXXXX" className="mt-1" /></div>
                <div><Label>Location</Label><Input placeholder="Bay 7" className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Installation Date</Label><Input type="date" className="mt-1" /></div>
                <div><Label>PM Interval (hours)</Label><Input type="number" placeholder="3000" className="mt-1" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => { setShowAdd(false); toast.success("Machine registered successfully"); }}>Register</Button>
            </div>
          </DialogContent>
        </Dialog>
      }>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory"><Cpu className="w-3.5 h-3.5 mr-1.5" />Inventory</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="w-3.5 h-3.5 mr-1.5" />Maintenance</TabsTrigger>
          <TabsTrigger value="utilization"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="grid md:grid-cols-3 gap-4">
            {machines.map(m => (
              <Card key={m.id} className={m.status === 'Maintenance' ? 'border-destructive/30' : m.hours > m.maxHours * 0.85 ? 'border-orange-300' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-muted-foreground" />
                      <span className="font-bold text-lg">{m.id}</span>
                    </div>
                    <Badge variant={m.status === 'Available' ? 'secondary' : m.status === 'In Use' ? 'default' : 'destructive'} className="text-xs">
                      {m.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Model</span><span>{m.model}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Serial</span><span className="font-mono text-xs">{m.serial}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{m.location}</span></div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Usage Hours</span>
                        <span className={`font-mono text-xs ${m.hours > m.maxHours ? 'text-destructive font-bold' : ''}`}>{m.hours.toLocaleString()} / {m.maxHours.toLocaleString()}</span>
                      </div>
                      <Progress value={(m.hours / m.maxHours) * 100} className="h-1.5" />
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Last PM</span><span className="text-xs">{m.lastMaint}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Next PM</span>
                      <span className={`text-xs ${m.nextMaint === '—' ? '' : new Date(m.nextMaint) < new Date() ? 'text-destructive font-bold' : ''}`}>
                        {m.nextMaint}
                        {m.nextMaint !== '—' && new Date(m.nextMaint) < new Date() && ' ⚠ OVERDUE'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Maintenance Log</CardTitle>
              <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1.5" /> Log Maintenance</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceLogs.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono font-bold text-sm">{l.machine}</TableCell>
                      <TableCell className="text-xs">{l.date}</TableCell>
                      <TableCell><Badge variant={l.type === 'Corrective' ? 'destructive' : 'secondary'} className="text-[10px]">{l.type}</Badge></TableCell>
                      <TableCell className="text-sm max-w-xs">{l.description}</TableCell>
                      <TableCell className="text-sm">{l.tech}</TableCell>
                      <TableCell className="font-mono text-sm">{l.cost}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === 'Completed' ? 'default' : l.status === 'Overdue' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {l.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Machine Utilization Analytics</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Total Sessions</TableHead>
                    <TableHead>This Month</TableHead>
                    <TableHead>Utilization Rate</TableHead>
                    <TableHead>Downtime (days)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map(m => {
                    const utilRate = m.status === 'Maintenance' ? 0 : Math.round((m.sessionsMonth / 26) * 100);
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono font-bold">{m.id}</TableCell>
                        <TableCell>{m.sessionsTotal.toLocaleString()}</TableCell>
                        <TableCell>{m.sessionsMonth}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={utilRate} className="h-2 w-20" />
                            <span className="text-xs font-mono">{utilRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className={m.downtime > 5 ? 'text-destructive font-bold' : ''}>{m.downtime}</TableCell>
                        <TableCell><Badge variant={m.status === 'Available' ? 'secondary' : m.status === 'In Use' ? 'default' : 'destructive'} className="text-[10px]">{m.status}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </OperationsModulePage>
  );
}
