import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3, FileText, Download, Activity,
  Users, Cpu, IndianRupee, AlertTriangle, TrendingUp
} from "lucide-react";

const operationalReports = [
  { name: "Daily Dialysis Sessions Report", desc: "All sessions conducted today with patient, machine, technician details", records: 6, lastGenerated: "Today 10:30 AM" },
  { name: "Dialysis Patient List", desc: "Complete list of active dialysis patients with profiles", records: 42, lastGenerated: "Today 08:00 AM" },
  { name: "Consumables Usage Report", desc: "Daily/weekly/monthly consumables consumption breakdown", records: 156, lastGenerated: "Yesterday" },
  { name: "Machine Utilization Report", desc: "Machine-wise utilization rate, downtime, sessions count", records: 6, lastGenerated: "Yesterday" },
  { name: "Staff Duty Roster", desc: "Technician and nurse scheduling across shifts", records: 12, lastGenerated: "2025-03-01" },
];

const clinicalReports = [
  { name: "Patient Dialysis History", desc: "Longitudinal treatment record for individual patient", records: "Per patient", lastGenerated: "On demand" },
  { name: "Complication Report", desc: "All dialysis complications logged with outcomes", records: 28, lastGenerated: "2025-03-05" },
  { name: "Treatment Outcomes Report", desc: "KTV adequacy, UF achievement, BP trends across patients", records: 42, lastGenerated: "2025-03-01" },
  { name: "Vascular Access Report", desc: "Access type distribution, access complications, re-interventions", records: 42, lastGenerated: "2025-02-28" },
  { name: "Infection Control Report", desc: "Dialysis-related infections, blood culture results", records: 5, lastGenerated: "2025-03-01" },
];

const financialReports = [
  { name: "Dialysis Revenue Report", desc: "Revenue by billing type: private, insurance, PMJAY, govt", total: "₹3,20,400", period: "March 2025" },
  { name: "Package Usage Report", desc: "Active packages, sessions consumed, remaining balance", total: "₹8,50,000", period: "Q1 2025" },
  { name: "Cost Per Session Analysis", desc: "Average cost breakdown: consumables, meds, staff", total: "₹6,150 avg", period: "March 2025" },
  { name: "Outstanding Payments", desc: "Unpaid invoices by patient and billing type", total: "₹1,24,600", period: "Current" },
  { name: "Insurance Claims Report", desc: "Submitted, approved, rejected, pending claims", total: "₹2,45,000", period: "March 2025" },
];

const patientHistory = [
  { patient: "Ramesh Kumar", uhid: "UH-10234", totalSessions: 142, avgUF: "2.1L", complications: 8, weightTrend: "72→70 kg", bpTrend: "Improving", ktvAvg: "1.35" },
  { patient: "Lakshmi Devi", uhid: "UH-10456", totalSessions: 98, avgUF: "1.8L", complications: 3, weightTrend: "58→56 kg", bpTrend: "Stable", ktvAvg: "1.42" },
  { patient: "Savita Joshi", uhid: "UH-11023", totalSessions: 245, avgUF: "2.3L", complications: 15, weightTrend: "65→62 kg", bpTrend: "Improving", ktvAvg: "1.28" },
  { patient: "Anil Sharma", uhid: "UH-11234", totalSessions: 32, avgUF: "1.5L", complications: 2, weightTrend: "80→78 kg", bpTrend: "Variable", ktvAvg: "1.18" },
];

export default function DialysisReports() {
  return (
    <OperationsModulePage module="dialysis" layout="list" title="Dialysis reports" subtitle="Operational, clinical, and financial reporting" actions={
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs whitespace-nowrap">Date Range</Label>
            <Input type="date" className="w-36" defaultValue="2025-03-01" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" className="w-36" defaultValue="2025-03-08" />
          </div>
        </div>
      }>

      <Tabs defaultValue="operational">
        <TabsList>
          <TabsTrigger value="operational"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Operational</TabsTrigger>
          <TabsTrigger value="clinical"><Activity className="w-3.5 h-3.5 mr-1.5" />Clinical</TabsTrigger>
          <TabsTrigger value="financial"><IndianRupee className="w-3.5 h-3.5 mr-1.5" />Financial</TabsTrigger>
          <TabsTrigger value="patient-history"><Users className="w-3.5 h-3.5 mr-1.5" />Patient History</TabsTrigger>
        </TabsList>

        <TabsContent value="operational">
          <div className="space-y-3">
            {operationalReports.map((r, i) => (
              <Card key={i}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono">{r.records} records</p>
                      <p className="text-[10px] text-muted-foreground">Last: {r.lastGenerated}</p>
                    </div>
                    <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />Export</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="clinical">
          <div className="space-y-3">
            {clinicalReports.map((r, i) => (
              <Card key={i}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/10"><Activity className="w-4 h-4 text-green-600" /></div>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-mono">{r.records} records</p>
                      <p className="text-[10px] text-muted-foreground">Last: {r.lastGenerated}</p>
                    </div>
                    <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />Export</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="space-y-3">
            {financialReports.map((r, i) => (
              <Card key={i}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-500/10"><IndianRupee className="w-4 h-4 text-orange-600" /></div>
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold">{r.total}</p>
                      <p className="text-[10px] text-muted-foreground">{r.period}</p>
                    </div>
                    <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />Export</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="patient-history">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Long-term Patient Treatment Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Total Sessions</TableHead>
                    <TableHead>Avg UF Removal</TableHead>
                    <TableHead>Complications</TableHead>
                    <TableHead>Weight Trend</TableHead>
                    <TableHead>BP Trend</TableHead>
                    <TableHead>Avg KTV</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientHistory.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div><p className="font-medium text-sm">{p.patient}</p><p className="text-[10px] text-muted-foreground">{p.uhid}</p></div>
                      </TableCell>
                      <TableCell className="font-mono">{p.totalSessions}</TableCell>
                      <TableCell className="font-mono">{p.avgUF}</TableCell>
                      <TableCell>
                        <Badge variant={p.complications > 10 ? "destructive" : "secondary"} className="text-[10px]">
                          {p.complications}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.weightTrend}</TableCell>
                      <TableCell>
                        <Badge variant={p.bpTrend === "Improving" ? "default" : p.bpTrend === "Stable" ? "secondary" : "destructive"} className="text-[10px]">
                          {p.bpTrend}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-mono ${parseFloat(p.ktvAvg) < 1.2 ? 'text-destructive font-bold' : 'text-green-600'}`}>{p.ktvAvg}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="text-xs">Full Report</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </OperationsModulePage>
  );
}
