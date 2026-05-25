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
import { Search, Plus, User, Droplets, TrendingUp } from "lucide-react";

const patients = [
  { id: "DL-001", uhid: "UH-10234", name: "Ramesh Kumar", age: 58, gender: "M", blood: "B+", startDate: "2023-06-15", frequency: "3x/week", type: "Hemodialysis", access: "AV Fistula", nephrologist: "Dr. Sanjay Mehta", machine: "HD-01", totalSessions: 142, status: "Active" },
  { id: "DL-002", uhid: "UH-10456", name: "Lakshmi Devi", age: 62, gender: "F", blood: "O+", startDate: "2023-09-20", frequency: "3x/week", type: "Hemodialysis", access: "AV Fistula", nephrologist: "Dr. Sanjay Mehta", machine: "HD-03", totalSessions: 98, status: "Active" },
  { id: "DL-003", uhid: "UH-10789", name: "Mohammad Ali", age: 45, gender: "M", blood: "A+", startDate: "2024-01-10", frequency: "2x/week", type: "Hemodialysis", access: "Catheter", nephrologist: "Dr. Priya Nair", machine: "HD-05", totalSessions: 56, status: "Active" },
  { id: "DL-004", uhid: "UH-11023", name: "Savita Joshi", age: 70, gender: "F", blood: "AB+", startDate: "2022-11-01", frequency: "3x/week", type: "Hemodialysis", access: "AV Graft", nephrologist: "Dr. Sanjay Mehta", machine: "HD-02", totalSessions: 245, status: "Active" },
  { id: "DL-005", uhid: "UH-11234", name: "Anil Sharma", age: 52, gender: "M", blood: "O-", startDate: "2024-03-05", frequency: "3x/week", type: "SLED", access: "Catheter", nephrologist: "Dr. Priya Nair", machine: "HD-04", totalSessions: 32, status: "Active" },
  { id: "DL-006", uhid: "UH-11456", name: "Fatima Begum", age: 65, gender: "F", blood: "B-", startDate: "2023-12-18", frequency: "2x/week", type: "Peritoneal", access: "PD Catheter", nephrologist: "Dr. Sanjay Mehta", machine: "—", totalSessions: 72, status: "Active" },
  { id: "DL-007", uhid: "UH-11678", name: "Suresh Patil", age: 48, gender: "M", blood: "A-", startDate: "2024-05-20", frequency: "3x/week", type: "Hemodialysis", access: "AV Fistula", nephrologist: "Dr. Priya Nair", machine: "HD-01", totalSessions: 18, status: "Active" },
  { id: "DL-008", uhid: "UH-11890", name: "Kamal Verma", age: 55, gender: "M", blood: "O+", startDate: "2023-04-01", frequency: "3x/week", type: "CRRT", access: "Catheter", nephrologist: "Dr. Sanjay Mehta", machine: "HD-06", totalSessions: 0, status: "Paused" },
];


export default function DialysisPatients() {
  const [search, setSearch] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const filtered = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.uhid.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <OperationsModulePage module="dialysis" layout="list" title="Dialysis patients" subtitle="Chronic dialysis patient registry and profiles" actions={
        <Dialog open={showRegister} onOpenChange={setShowRegister}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Register Patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Dialysis Patient Registration</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div><Label>UHID</Label><Input placeholder="UH-XXXXX" className="mt-1" /></div>
              <div><Label>Patient Name</Label><Input placeholder="Full name" className="mt-1" /></div>
              <div><Label>Age</Label><Input type="number" placeholder="Age" className="mt-1" /></div>
              <div><Label>Gender</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Blood Group</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Dialysis Type</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hemodialysis">Hemodialysis</SelectItem>
                    <SelectItem value="Peritoneal">Peritoneal Dialysis</SelectItem>
                    <SelectItem value="CRRT">CRRT</SelectItem>
                    <SelectItem value="SLED">SLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Access Type</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AV Fistula">AV Fistula</SelectItem>
                    <SelectItem value="AV Graft">AV Graft</SelectItem>
                    <SelectItem value="Catheter">Catheter</SelectItem>
                    <SelectItem value="PD Catheter">PD Catheter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Frequency</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2x/week">2x/week</SelectItem>
                    <SelectItem value="3x/week">3x/week</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nephrologist</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dr. Sanjay Mehta">Dr. Sanjay Mehta</SelectItem>
                    <SelectItem value="Dr. Priya Nair">Dr. Priya Nair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Machine Preference</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Available</SelectItem>
                    {["HD-01","HD-02","HD-03","HD-04","HD-05","HD-06"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Dialysis Start Date</Label><Input type="date" className="mt-1" /></div>
              <div><Label>Insurance / Scheme</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="pmjay">PMJAY</SelectItem>
                    <SelectItem value="govt">Government Scheme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowRegister(false)}>Cancel</Button>
              <Button onClick={() => { setShowRegister(false); toast.success("Dialysis patient registered successfully"); }}>Register Patient</Button>
            </div>
          </DialogContent>
        </Dialog>
      }>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <div><p className="text-2xl font-bold">{patients.filter(p=>p.status==="Active").length}</p><p className="text-xs text-muted-foreground">Active Patients</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Droplets className="w-5 h-5 text-blue-600" />
          <div><p className="text-2xl font-bold">{patients.filter(p=>p.type==="Hemodialysis").length}</p><p className="text-xs text-muted-foreground">Hemodialysis</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Droplets className="w-5 h-5 text-green-600" />
          <div><p className="text-2xl font-bold">{patients.filter(p=>p.type==="Peritoneal").length}</p><p className="text-xs text-muted-foreground">Peritoneal</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <div><p className="text-2xl font-bold">{patients.reduce((a,p)=>a+p.totalSessions,0)}</p><p className="text-xs text-muted-foreground">Total Sessions</p></div>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, UHID, or dialysis ID..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Patient Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dialysis ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Blood</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Nephrologist</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.uhid} · {p.age}{p.gender} · Since {new Date(p.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{p.blood}</Badge></TableCell>
                  <TableCell className="text-sm">{p.type}</TableCell>
                  <TableCell className="text-sm">{p.access}</TableCell>
                  <TableCell className="text-sm">{p.frequency}</TableCell>
                  <TableCell className="text-sm">{p.nephrologist}</TableCell>
                  <TableCell className="font-mono text-sm">{p.totalSessions}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "Active" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </OperationsModulePage>
  );
}
