import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Clock, Bell, UserPlus, ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSchedulingPlatform } from '@/hooks/useSchedulingPlatform';

const waitlist = [
  { id: 'WL-001', patient: 'Deepak Chauhan', uhid: 'UHID-10234', doctor: 'Dr. Rajesh Kumar', dept: 'Cardiology', type: 'OPD', requestedDate: '2024-03-08', addedOn: '2024-03-06', position: 1, priority: 'High', status: 'Waiting' },
  { id: 'WL-002', patient: 'Meera Jain', uhid: 'UHID-10567', doctor: 'Dr. Vikram Singh', dept: 'Orthopedics', type: 'OPD', requestedDate: '2024-03-08', addedOn: '2024-03-05', position: 2, priority: 'Normal', status: 'Waiting' },
  { id: 'WL-003', patient: 'Ramesh Patel', uhid: 'UHID-10890', doctor: 'Dr. Gupta', dept: 'ENT', type: 'Follow-up', requestedDate: '2024-03-09', addedOn: '2024-03-07', position: 1, priority: 'Normal', status: 'Waiting' },
  { id: 'WL-004', patient: 'Sunita Sharma', uhid: 'UHID-11023', doctor: 'Dr. Ananya Mishra', dept: 'Cardiology', type: 'OPD', requestedDate: '2024-03-10', addedOn: '2024-03-07', position: 1, priority: 'Low', status: 'Waiting' },
  { id: 'WL-005', patient: 'Kiran Devi', uhid: 'UHID-11156', doctor: 'Dr. Patel', dept: 'Dermatology', type: 'OPD', requestedDate: '2024-03-08', addedOn: '2024-03-04', position: 3, priority: 'High', status: 'Slot Available' },
];

const PRIORITY_STYLE: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive',
  Normal: 'bg-muted text-muted-foreground',
  Low: 'bg-info/10 text-info',
};

export default function SchedulingWaitlist() {
  const { platformOn, waitlist: platformWaitlist } = useSchedulingPlatform();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (platformOn && platformWaitlist.length > 0) {
      return platformWaitlist.map((w, idx) => ({
        id: w.id,
        patient: w.patient?.fullName ?? 'Patient',
        uhid: w.patient?.mrn ?? w.patientId,
        doctor: w.resourceLabel,
        dept: 'Scheduling',
        type: 'OPD',
        requestedDate: w.preferredStart?.slice(0, 10) ?? '—',
        addedOn: '—',
        position: idx + 1,
        priority: w.priority === 'urgent' ? 'High' : 'Normal',
        status: w.status === 'booked' ? 'Slot Available' : 'Waiting',
      }));
    }
    return waitlist;
  }, [platformOn, platformWaitlist]);

  const filtered = rows.filter(w =>
    !search || w.patient.toLowerCase().includes(search.toLowerCase()) || w.uhid.includes(search)
  );

  const slotAvailable = rows.filter(w => w.status === 'Slot Available').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Waitlist</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage patients waiting for appointment slots</p>
        </div>
        <div className="flex items-center gap-2">
          {slotAvailable > 0 && (
            <Badge variant="outline" className="text-sm px-3 py-1 gap-1 border-success text-success">
              <Bell className="w-3 h-3" />{slotAvailable} slots opened
            </Badge>
          )}
          <Button className="gap-2"><UserPlus className="w-4 h-4" />Add to Waitlist</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xl font-bold text-foreground">{rows.length}</p><p className="text-xs text-muted-foreground">Total Waitlisted</p></Card>
        <Card className="p-4"><p className="text-xl font-bold text-foreground">{rows.filter(w => w.priority === 'High').length}</p><p className="text-xs text-muted-foreground">High Priority</p></Card>
        <Card className="p-4 border-success/30"><p className="text-xl font-bold text-foreground">{slotAvailable}</p><p className="text-xs text-muted-foreground">Slots Available</p></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search patient..." className="pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map(w => (
          <Card key={w.id} className={`p-4 hover:shadow-sm transition-shadow ${w.status === 'Slot Available' ? 'border-success/30' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{w.id}</span>
                  <Badge className={`text-[10px] ${PRIORITY_STYLE[w.priority]}`}>{w.priority}</Badge>
                  {w.status === 'Slot Available' && <Badge variant="default" className="text-[10px] bg-success text-success-foreground">Slot Available!</Badge>}
                  <Badge variant="outline" className="text-[10px]">#{w.position} in queue</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{w.patient} <span className="text-muted-foreground font-normal">· {w.uhid}</span></p>
                <p className="text-xs text-muted-foreground">{w.doctor} · {w.dept} · {w.type}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Requested: {w.requestedDate}</span>
                  <span>Added: {w.addedOn}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {w.status === 'Slot Available' ? (
                  <Button size="sm" className="text-xs gap-1">Assign Slot <ArrowRight className="w-3 h-3" /></Button>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs">Notify</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}