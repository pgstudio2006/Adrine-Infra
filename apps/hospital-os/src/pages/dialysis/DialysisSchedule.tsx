import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { IpdAdmissionPicker } from '@/components/operations/IpdAdmissionPicker';
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarClock, Plus, ChevronLeft, ChevronRight } from "lucide-react";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shifts = [
  { label: "Shift 1", time: "06:00 – 10:00" },
  { label: "Shift 2", time: "10:00 – 14:00" },
  { label: "Shift 3", time: "14:00 – 18:00" },
  { label: "Shift 4", time: "18:00 – 22:00" },
];

const scheduleData: Record<string, Record<string, { patient: string; machine: string; tech: string; status: string }[]>> = {
  Monday: {
    "Shift 1": [
      { patient: "Ramesh Kumar", machine: "HD-01", tech: "Sunil K", status: "Confirmed" },
      { patient: "Lakshmi Devi", machine: "HD-03", tech: "Priya M", status: "Confirmed" },
      { patient: "Savita Joshi", machine: "HD-02", tech: "Ravi T", status: "Confirmed" },
    ],
    "Shift 2": [
      { patient: "Mohammad Ali", machine: "HD-05", tech: "Sunil K", status: "Confirmed" },
      { patient: "Anil Sharma", machine: "HD-04", tech: "Priya M", status: "Confirmed" },
    ],
    "Shift 3": [
      { patient: "Fatima Begum", machine: "HD-01", tech: "Ravi T", status: "Confirmed" },
      { patient: "Suresh Patil", machine: "HD-03", tech: "Sunil K", status: "Tentative" },
    ],
    "Shift 4": [],
  },
  Wednesday: {
    "Shift 1": [
      { patient: "Ramesh Kumar", machine: "HD-01", tech: "Sunil K", status: "Confirmed" },
      { patient: "Lakshmi Devi", machine: "HD-03", tech: "Priya M", status: "Confirmed" },
      { patient: "Savita Joshi", machine: "HD-02", tech: "Ravi T", status: "Confirmed" },
    ],
    "Shift 2": [
      { patient: "Mohammad Ali", machine: "HD-05", tech: "Sunil K", status: "Confirmed" },
    ],
    "Shift 3": [
      { patient: "Anil Sharma", machine: "HD-04", tech: "Priya M", status: "Confirmed" },
    ],
    "Shift 4": [],
  },
  Friday: {
    "Shift 1": [
      { patient: "Ramesh Kumar", machine: "HD-01", tech: "Sunil K", status: "Confirmed" },
      { patient: "Lakshmi Devi", machine: "HD-03", tech: "Priya M", status: "Confirmed" },
      { patient: "Savita Joshi", machine: "HD-02", tech: "Ravi T", status: "Confirmed" },
    ],
    "Shift 2": [
      { patient: "Suresh Patil", machine: "HD-05", tech: "Sunil K", status: "Confirmed" },
    ],
    "Shift 3": [
      { patient: "Fatima Begum", machine: "HD-01", tech: "Ravi T", status: "Confirmed" },
    ],
    "Shift 4": [],
  },
};

export default function DialysisSchedule() {
  const [showNewSession, setShowNewSession] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [syncBilling, setSyncBilling] = useState(false);
  const [ipdAdmissionId, setIpdAdmissionId] = useState<string>();

  const getWeekLabel = () => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    return `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <OperationsModulePage
      module="dialysis"
      layout="list"
      title="Dialysis schedule"
      subtitle="Recurring sessions with machine and technician allocation"
      actions={
        <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Schedule Session</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Schedule Dialysis Session</DialogTitle></DialogHeader>
            <div className="grid gap-4 mt-4">
              <div><Label>Patient</Label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {["Ramesh Kumar","Lakshmi Devi","Mohammad Ali","Savita Joshi","Anil Sharma"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recurring Days</Label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {weekDays.map(d => (
                    <label key={d} className="flex items-center gap-1.5 text-sm">
                      <Checkbox defaultChecked={["Monday","Wednesday","Friday"].includes(d)} />
                      {d.slice(0,3)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Shift</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select shift" /></SelectTrigger>
                    <SelectContent>{shifts.map(s => <SelectItem key={s.label} value={s.label}>{s.label} ({s.time})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Machine</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-assign</SelectItem>
                      {["HD-01","HD-02","HD-03","HD-04","HD-05","HD-06"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Technician</Label>
                  <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {["Sunil K","Priya M","Ravi T"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" className="mt-1" /></div>
                <div><Label>End Date (optional)</Label><Input type="date" className="mt-1" /></div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dialysis-sync-billing"
                  checked={syncBilling}
                  onCheckedChange={(v) => setSyncBilling(v === true)}
                />
                <Label htmlFor="dialysis-sync-billing" className="text-sm font-normal">
                  Sync charges to IPD billing
                </Label>
              </div>
              {syncBilling ? (
                <IpdAdmissionPicker value={ipdAdmissionId} onChange={(id) => setIpdAdmissionId(id)} />
              ) : null}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowNewSession(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (syncBilling && !ipdAdmissionId) {
                    toast.error('Select IPD admission for billing sync');
                    return;
                  }
                  setShowNewSession(false);
                  toast.success('Dialysis schedule created successfully');
                }}
              >
                Create schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {/* Week Navigator */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{getWeekLabel()}</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)}><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>This Week</Button>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-6 gap-3">
        {weekDays.map(day => (
          <Card key={day} className={!scheduleData[day] ? 'opacity-50' : ''}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{day}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {scheduleData[day] ? (
                <div className="space-y-3">
                  {shifts.map(shift => {
                    const sessions = scheduleData[day]?.[shift.label] || [];
                    if (sessions.length === 0) return null;
                    return (
                      <div key={shift.label}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{shift.label} <span className="font-normal">({shift.time})</span></p>
                        <div className="space-y-1.5">
                          {sessions.map((s, i) => (
                            <div key={i} className="p-2 rounded border bg-muted/30 text-xs">
                              <p className="font-medium">{s.patient}</p>
                              <p className="text-muted-foreground">{s.machine} · {s.tech}</p>
                              <Badge variant={s.status === "Confirmed" ? "default" : "secondary"} className="mt-1 text-[9px]">{s.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No sessions</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </OperationsModulePage>
  );
}
