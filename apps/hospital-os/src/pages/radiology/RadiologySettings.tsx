import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Monitor, Plus, Edit, Settings2, Zap, AlertTriangle, ScanLine } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  installDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  status: "Active" | "Maintenance" | "Offline";
  room: string;
  dicomAE: string;
}

interface ImagingProcedure {
  id: string;
  name: string;
  category: string;
  bodyRegion: string;
  duration: string;
  price: number;
  contrast: boolean;
  radiation: boolean;
  prepInstructions: string;
  active: boolean;
}

const equipment: Equipment[] = [
  { id: "EQ-001", name: "CT Scanner", type: "CT Scan", manufacturer: "Siemens", model: "Somatom Go.Top", installDate: "2023-06-15", lastMaintenance: "2026-02-20", nextMaintenance: "2026-05-20", status: "Active", room: "Radiology Room 1", dicomAE: "CTSCANNER01" },
  { id: "EQ-002", name: "MRI 3T", type: "MRI", manufacturer: "GE Healthcare", model: "Signa Premier", installDate: "2024-01-10", lastMaintenance: "2026-01-15", nextMaintenance: "2026-04-15", status: "Active", room: "MRI Suite", dicomAE: "MRI3T01" },
  { id: "EQ-003", name: "X-ray Digital", type: "X-ray", manufacturer: "Philips", model: "DigitalDiagnost C90", installDate: "2022-09-01", lastMaintenance: "2026-03-01", nextMaintenance: "2026-06-01", status: "Active", room: "X-ray Room 1", dicomAE: "XRAY01" },
  { id: "EQ-004", name: "Ultrasound", type: "Ultrasound", manufacturer: "Samsung", model: "HS60", installDate: "2024-03-20", lastMaintenance: "2026-02-10", nextMaintenance: "2026-05-10", status: "Maintenance", room: "Radiology Room 3", dicomAE: "US01" },
  { id: "EQ-005", name: "Mammography", type: "Mammography", manufacturer: "Hologic", model: "3Dimensions", installDate: "2023-11-05", lastMaintenance: "2026-01-25", nextMaintenance: "2026-04-25", status: "Active", room: "Mammography Suite", dicomAE: "MAMMO01" },
];

const procedures: ImagingProcedure[] = [
  { id: "PRO-001", name: "X-ray Chest PA", category: "X-ray", bodyRegion: "Chest", duration: "10 min", price: 350, contrast: false, radiation: true, prepInstructions: "Remove metallic objects from chest area", active: true },
  { id: "PRO-002", name: "CT Head Plain", category: "CT Scan", bodyRegion: "Head", duration: "15 min", price: 2500, contrast: false, radiation: true, prepInstructions: "Remove jewellery, dentures, hearing aids", active: true },
  { id: "PRO-003", name: "CT Chest with Contrast", category: "CT Scan", bodyRegion: "Chest", duration: "25 min", price: 4500, contrast: true, radiation: true, prepInstructions: "NPO 4 hours. Check creatinine. IV contrast will be administered.", active: true },
  { id: "PRO-004", name: "MRI Brain with Contrast", category: "MRI", bodyRegion: "Brain", duration: "45 min", price: 8000, contrast: true, radiation: false, prepInstructions: "Check for metallic implants/pacemaker. NPO 4 hours. Remove all metal.", active: true },
  { id: "PRO-005", name: "MRI Lumbar Spine", category: "MRI", bodyRegion: "Lumbar Spine", duration: "40 min", price: 7500, contrast: false, radiation: false, prepInstructions: "Check for metallic implants. Remove jewellery and belt.", active: true },
  { id: "PRO-006", name: "Ultrasound Abdomen", category: "Ultrasound", bodyRegion: "Abdomen", duration: "20 min", price: 1200, contrast: false, radiation: false, prepInstructions: "NPO 6 hours for gallbladder evaluation. Full bladder preferred.", active: true },
  { id: "PRO-007", name: "Mammography Bilateral", category: "Mammography", bodyRegion: "Breast", duration: "15 min", price: 1800, contrast: false, radiation: true, prepInstructions: "No deodorant or powder on examination day. Schedule post-menstrual.", active: true },
  { id: "PRO-008", name: "CT Abdomen with Contrast", category: "CT Scan", bodyRegion: "Abdomen", duration: "30 min", price: 5000, contrast: true, radiation: true, prepInstructions: "NPO 4 hours. Oral contrast 1 hour prior. Check creatinine.", active: true },
  { id: "PRO-009", name: "PET-CT Whole Body", category: "PET Scan", bodyRegion: "Whole Body", duration: "90 min", price: 18000, contrast: false, radiation: true, prepInstructions: "NPO 6 hours. No strenuous exercise 24 hours prior. Blood glucose <200mg/dL.", active: false },
];

const eqStatusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Offline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function RadiologySettings() {
  const [showAddProc, setShowAddProc] = useState(false);
  const [showAddEq, setShowAddEq] = useState(false);
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Radiology Settings</h1>
        <p className="text-muted-foreground text-sm">Manage imaging catalog, equipment, and department configuration</p>
      </div>

      <Tabs defaultValue="procedures">
        <TabsList>
          <TabsTrigger value="procedures">Imaging Catalog</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Imaging Catalog */}
        <TabsContent value="procedures" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddProc(true)}><Plus className="h-4 w-4 mr-2" /> Add Procedure</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Procedure</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Body Region</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead>Contrast</TableHead>
                    <TableHead>Radiation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procedures.map(p => (
                    <TableRow key={p.id} className={!p.active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{p.bodyRegion}</TableCell>
                      <TableCell>{p.duration}</TableCell>
                      <TableCell>₹{p.price.toLocaleString()}</TableCell>
                      <TableCell>{p.contrast ? <Badge className="text-xs">Yes</Badge> : <span className="text-muted-foreground text-xs">No</span>}</TableCell>
                      <TableCell>{p.radiation ? <Zap className="h-4 w-4 text-yellow-600" /> : <span className="text-muted-foreground text-xs">No</span>}</TableCell>
                      <TableCell><Badge variant={p.active ? "default" : "secondary"} className="text-xs">{p.active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment */}
        <TabsContent value="equipment" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddEq(true)}><Plus className="h-4 w-4 mr-2" /> Register Equipment</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map(eq => (
              <Card key={eq.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedEq(eq)}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Monitor className="h-5 w-5 text-primary" /></div>
                      <div>
                        <p className="font-medium text-foreground">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">{eq.manufacturer} {eq.model}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${eqStatusColor[eq.status]}`}>{eq.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>Room: {eq.room}</span>
                    <span>DICOM AE: {eq.dicomAE}</span>
                    <span>Last Maint: {eq.lastMaintenance}</span>
                    <span>Next Maint: {eq.nextMaintenance}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Config */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings2 className="h-5 w-5" /> Department Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Department Name</Label><Input defaultValue="Radiology & Imaging" /></div>
                <div><Label>Department Head</Label><Input defaultValue="Dr. Iyer" /></div>
                <div><Label>PACS Server URL</Label><Input defaultValue="https://pacs.adrine-hospital.local" /></div>
                <div><Label>DICOM Port</Label><Input type="number" defaultValue="4242" /></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div><p className="text-sm font-medium text-foreground">Auto-notify on critical findings</p><p className="text-xs text-muted-foreground">Send immediate alerts to requesting doctor</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div><p className="text-sm font-medium text-foreground">Radiation dose tracking</p><p className="text-xs text-muted-foreground">Record cumulative radiation exposure per patient</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div><p className="text-sm font-medium text-foreground">DICOM compliance check</p><p className="text-xs text-muted-foreground">Validate DICOM metadata before archiving</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div><p className="text-sm font-medium text-foreground">SMS report delivery</p><p className="text-xs text-muted-foreground">Send SMS notification when report is ready</p></div>
                  <Switch />
                </div>
              </div>
              <Button>Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Equipment Detail */}
      <Dialog open={!!selectedEq} onOpenChange={() => setSelectedEq(null)}>
        <DialogContent>
          {selectedEq && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> {selectedEq.name}</DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Type:</span> {selectedEq.type}</div>
                  <div><span className="text-muted-foreground">Manufacturer:</span> {selectedEq.manufacturer}</div>
                  <div><span className="text-muted-foreground">Model:</span> {selectedEq.model}</div>
                  <div><span className="text-muted-foreground">Room:</span> {selectedEq.room}</div>
                  <div><span className="text-muted-foreground">Installed:</span> {selectedEq.installDate}</div>
                  <div><span className="text-muted-foreground">DICOM AE:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{selectedEq.dicomAE}</code></div>
                  <div><span className="text-muted-foreground">Last Maintenance:</span> {selectedEq.lastMaintenance}</div>
                  <div><span className="text-muted-foreground">Next Maintenance:</span> {selectedEq.nextMaintenance}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${eqStatusColor[selectedEq.status]}`}>{selectedEq.status}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Procedure */}
      <Dialog open={showAddProc} onOpenChange={setShowAddProc}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Imaging Procedure</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Procedure Name</Label><Input placeholder="e.g. CT Chest with Contrast" /></div>
              <div><Label>Category</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xray">X-ray</SelectItem>
                    <SelectItem value="ct">CT Scan</SelectItem>
                    <SelectItem value="mri">MRI</SelectItem>
                    <SelectItem value="us">Ultrasound</SelectItem>
                    <SelectItem value="mammo">Mammography</SelectItem>
                    <SelectItem value="pet">PET Scan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Body Region</Label><Input placeholder="e.g. Chest, Brain" /></div>
              <div><Label>Est. Duration</Label><Input placeholder="e.g. 25 min" /></div>
              <div><Label>Price (₹)</Label><Input type="number" placeholder="0" /></div>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><Switch id="contrast" /><Label htmlFor="contrast">Requires Contrast</Label></div>
                <div className="flex items-center gap-2"><Switch id="radiation" /><Label htmlFor="radiation">Radiation Exposure</Label></div>
              </div>
            </div>
            <div><Label>Preparation Instructions</Label><Textarea placeholder="Patient preparation steps..." rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddProc(false)}>Cancel</Button>
              <Button onClick={() => { setShowAddProc(false); toast.success("Procedure saved successfully"); }}>Save Procedure</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Equipment */}
      <Dialog open={showAddEq} onOpenChange={setShowAddEq}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Equipment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Equipment Name</Label><Input placeholder="e.g. CT Scanner" /></div>
              <div><Label>Type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ct">CT Scan</SelectItem>
                    <SelectItem value="mri">MRI</SelectItem>
                    <SelectItem value="xray">X-ray</SelectItem>
                    <SelectItem value="us">Ultrasound</SelectItem>
                    <SelectItem value="mammo">Mammography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Manufacturer</Label><Input placeholder="e.g. Siemens" /></div>
              <div><Label>Model</Label><Input placeholder="e.g. Somatom Go.Top" /></div>
              <div><Label>Room</Label><Input placeholder="e.g. Radiology Room 1" /></div>
              <div><Label>DICOM AE Title</Label><Input placeholder="e.g. CTSCANNER01" /></div>
              <div><Label>Installation Date</Label><Input type="date" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddEq(false)}>Cancel</Button>
              <Button onClick={() => { setShowAddEq(false); toast.success("Equipment registered successfully"); }}>Register</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
