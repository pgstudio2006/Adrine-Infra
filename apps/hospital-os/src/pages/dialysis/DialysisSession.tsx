import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity, Clock, Plus, AlertTriangle, CheckCircle,
  Droplets, Pill, FileText, Heart
} from "lucide-react";

// Flow chart monitoring data — recorded every 30 min
const monitoringData = [
  { time: "08:00", bp: "140/90", pulse: 78, heparin: "1000 IU", venousPressure: 120, ufRate: 500, clearance: 220, bfr: 300, ktv: "—", meds: "—", sign: "SK" },
  { time: "08:30", bp: "138/88", pulse: 76, heparin: "500 IU", venousPressure: 118, ufRate: 500, clearance: 225, bfr: 300, ktv: "—", meds: "—", sign: "SK" },
  { time: "09:00", bp: "135/85", pulse: 74, heparin: "500 IU", venousPressure: 115, ufRate: 500, clearance: 230, bfr: 300, ktv: "—", meds: "NS 100ml", sign: "SK" },
  { time: "09:30", bp: "130/82", pulse: 72, heparin: "—", venousPressure: 112, ufRate: 500, clearance: 228, bfr: 300, ktv: "—", meds: "—", sign: "SK" },
  { time: "10:00", bp: "128/80", pulse: 74, heparin: "—", venousPressure: 110, ufRate: 500, clearance: 232, bfr: 300, ktv: "—", meds: "—", sign: "SK" },
  { time: "10:30", bp: "125/78", pulse: 70, heparin: "—", venousPressure: 108, ufRate: 500, clearance: 235, bfr: 300, ktv: "1.4", meds: "—", sign: "SK" },
];

const medications = [
  { name: "Heparin", dose: "2000 IU total", time: "08:00–09:00", route: "IV", by: "Sunil K" },
  { name: "Erythropoietin", dose: "4000 IU", time: "08:15", route: "SC", by: "Sunil K" },
  { name: "Iron Sucrose", dose: "100mg", time: "09:00", route: "IV", by: "Sunil K" },
];

const consumablesUsed = [
  { item: "Dialyzer (F60S)", batch: "DZ-2024-5567", qty: 1, supplier: "Fresenius", expiry: "2025-06-30" },
  { item: "Blood Line Set", batch: "BL-2024-8834", qty: 1, supplier: "Nipro", expiry: "2025-03-15" },
  { item: "NS 0.9% 1L", batch: "NS-2024-1122", qty: 2, supplier: "B.Braun", expiry: "2025-12-31" },
  { item: "Heparin 5000IU/ml", batch: "HP-2024-4456", qty: 1, supplier: "Gland Pharma", expiry: "2025-09-30" },
  { item: "AV Fistula Needle 16G", batch: "FN-2024-7789", qty: 2, supplier: "Nipro", expiry: "2025-05-15" },
  { item: "Bicarbonate Cartridge", batch: "BC-2024-3345", qty: 1, supplier: "Fresenius", expiry: "2025-08-31" },
];

const complications = [
  { type: "Hypotension", time: "09:45", action: "NS 200ml bolus, Trendelenburg position, UF rate reduced to 300", outcome: "BP recovered to 120/80 in 10 min" },
];

export default function DialysisSession() {
  const [activeTab, setActiveTab] = useState("flowchart");

  return (
    <OperationsModulePage
      module="dialysis"
      layout="detail"
      title="Dialysis session — flow chart"
      subtitle="Session DS-001 · real-time monitoring and recording"
      actions={
        <>
          <Badge variant="default" className="text-xs py-1">● LIVE SESSION</Badge>
          <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-2" /> Generate PDF</Button>
        </>
      }
    >
      {/* Patient & Session Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Patient Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <strong>Ramesh Kumar</strong></div>
              <div><span className="text-muted-foreground">Age/Sex:</span> 58/M</div>
              <div><span className="text-muted-foreground">Reg No:</span> UH-10234</div>
              <div><span className="text-muted-foreground">IP No:</span> IP-2024-456</div>
              <div><span className="text-muted-foreground">Blood Group:</span> B+</div>
              <div><span className="text-muted-foreground">Machine No:</span> HD-01</div>
              <div><span className="text-muted-foreground">Vascular Access:</span> AV Fistula (L)</div>
              <div><span className="text-muted-foreground">Nephrologist:</span> Dr. Sanjay Mehta</div>
              <div><span className="text-muted-foreground">Technician:</span> Sunil K</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Dialysis Parameters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-y-2 text-sm">
              <div><span className="text-muted-foreground">Type:</span> Hemodialysis</div>
              <div><span className="text-muted-foreground">Dialyzer:</span> F60S (Fresenius)</div>
              <div><span className="text-muted-foreground">Duration:</span> 4 hours</div>
              <div><span className="text-muted-foreground">Pre BP:</span> <strong>140/90</strong></div>
              <div><span className="text-muted-foreground">Post BP:</span> <strong className="text-green-600">125/78</strong></div>
              <div><span className="text-muted-foreground">Pre Weight:</span> 72.5 kg</div>
              <div><span className="text-muted-foreground">Post Weight:</span> 70.3 kg</div>
              <div><span className="text-muted-foreground">UF Goal:</span> 2200 ml</div>
              <div><span className="text-muted-foreground">UF Removed:</span> <strong>2000 ml</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="flowchart"><Activity className="w-3.5 h-3.5 mr-1.5" />Flow Chart</TabsTrigger>
          <TabsTrigger value="medications"><Pill className="w-3.5 h-3.5 mr-1.5" />Medications</TabsTrigger>
          <TabsTrigger value="consumables"><Droplets className="w-3.5 h-3.5 mr-1.5" />Consumables</TabsTrigger>
          <TabsTrigger value="complications"><AlertTriangle className="w-3.5 h-3.5 mr-1.5" />Complications</TabsTrigger>
          <TabsTrigger value="summary"><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Summary</TabsTrigger>
        </TabsList>

        {/* Flow Chart Tab */}
        <TabsContent value="flowchart" className="space-y-4">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Monitoring Table (Every 30 min)</CardTitle>
              <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Reading</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Time</TableHead>
                    <TableHead>BP</TableHead>
                    <TableHead>Pulse</TableHead>
                    <TableHead>Heparin</TableHead>
                    <TableHead>VP (mmHg)</TableHead>
                    <TableHead>UF Rate</TableHead>
                    <TableHead>Clearance</TableHead>
                    <TableHead>BFR</TableHead>
                    <TableHead>KTV</TableHead>
                    <TableHead>Meds/Fluids</TableHead>
                    <TableHead>Sign</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitoringData.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{r.time}</TableCell>
                      <TableCell className="font-mono text-xs">{r.bp}</TableCell>
                      <TableCell className="text-xs">{r.pulse}</TableCell>
                      <TableCell className="text-xs">{r.heparin}</TableCell>
                      <TableCell className="text-xs">{r.venousPressure}</TableCell>
                      <TableCell className="text-xs">{r.ufRate} ml/hr</TableCell>
                      <TableCell className="text-xs">{r.clearance}</TableCell>
                      <TableCell className="text-xs">{r.bfr}</TableCell>
                      <TableCell className="text-xs">{r.ktv}</TableCell>
                      <TableCell className="text-xs">{r.meds}</TableCell>
                      <TableCell className="text-xs">{r.sign}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Add Reading Form */}
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Record New Reading</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-3">
                <div><Label className="text-xs">Time</Label><Input type="time" className="mt-1" /></div>
                <div><Label className="text-xs">BP (Sys/Dia)</Label><Input placeholder="120/80" className="mt-1" /></div>
                <div><Label className="text-xs">Pulse</Label><Input type="number" placeholder="72" className="mt-1" /></div>
                <div><Label className="text-xs">Heparin Dose</Label><Input placeholder="500 IU" className="mt-1" /></div>
                <div><Label className="text-xs">Venous Pressure</Label><Input type="number" placeholder="110" className="mt-1" /></div>
                <div><Label className="text-xs">UF Rate (ml/hr)</Label><Input type="number" placeholder="500" className="mt-1" /></div>
                <div><Label className="text-xs">Clearance</Label><Input type="number" placeholder="230" className="mt-1" /></div>
                <div><Label className="text-xs">Blood Flow Rate</Label><Input type="number" placeholder="300" className="mt-1" /></div>
                <div><Label className="text-xs">KTV</Label><Input placeholder="—" className="mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs">Meds / Fluids</Label><Input placeholder="NS 100ml, etc." className="mt-1" /></div>
                <div className="flex items-end"><Button className="w-full">Save</Button></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Medications Administered</CardTitle>
              <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1.5" /> Add Medication</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dose</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Administered By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{m.name}</TableCell>
                      <TableCell className="text-sm">{m.dose}</TableCell>
                      <TableCell className="font-mono text-xs">{m.time}</TableCell>
                      <TableCell className="text-sm">{m.route}</TableCell>
                      <TableCell className="text-sm">{m.by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consumables Tab */}
        <TabsContent value="consumables">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Consumables Used</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumablesUsed.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{c.item}</TableCell>
                      <TableCell className="font-mono text-xs">{c.batch}</TableCell>
                      <TableCell className="text-sm">{c.qty}</TableCell>
                      <TableCell className="text-sm">{c.supplier}</TableCell>
                      <TableCell className="text-xs">{c.expiry}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complications Tab */}
        <TabsContent value="complications">
          <Card>
            <CardHeader className="py-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Complications Log</CardTitle>
              <Button size="sm" variant="outline"><Plus className="w-3.5 h-3.5 mr-1.5" /> Log Complication</Button>
            </CardHeader>
            <CardContent>
              {complications.length > 0 ? (
                <div className="space-y-3">
                  {complications.map((c, i) => (
                    <div key={i} className="p-4 rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold text-sm">{c.type}</span>
                        <Badge variant="outline" className="text-[10px]">{c.time}</Badge>
                      </div>
                      <p className="text-sm"><strong>Action:</strong> {c.action}</p>
                      <p className="text-sm mt-1"><strong>Outcome:</strong> {c.outcome}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No complications recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm">Session Treatment Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-muted-foreground">Session Duration</div><div className="font-medium">4 hours (08:00 – 12:00)</div>
                    <div className="text-muted-foreground">Fluid Removed</div><div className="font-medium">2000 ml</div>
                    <div className="text-muted-foreground">Pre Weight → Post Weight</div><div className="font-medium">72.5 kg → 70.3 kg</div>
                    <div className="text-muted-foreground">Pre BP → Post BP</div><div className="font-medium">140/90 → 125/78</div>
                    <div className="text-muted-foreground">Final KTV</div><div className="font-medium">1.4</div>
                    <div className="text-muted-foreground">Complications</div><div className="font-medium text-orange-600">1 (Hypotension — resolved)</div>
                    <div className="text-muted-foreground">Patient Condition</div><div className="font-medium text-green-600">Stable</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Doctor Notes</Label>
                    <Textarea className="mt-1" placeholder="Nephrologist notes..." defaultValue="Patient tolerated dialysis well. One episode of hypotension managed with NS bolus. Target UF nearly achieved. Continue current dialysis prescription." />
                  </div>
                  <div>
                    <Label className="text-xs">Technician Notes</Label>
                    <Textarea className="mt-1" placeholder="Technician notes..." defaultValue="Machine HD-01 functioned normally. AV fistula access was uneventful. Dialyzer performance adequate. Venous pressure stable throughout." />
                  </div>
                  <Button className="w-full" onClick={() => toast.success("Session completed — summary generated")}><CheckCircle className="w-4 h-4 mr-2" /> Complete Session & Generate Summary</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </OperationsModulePage>
  );
}
