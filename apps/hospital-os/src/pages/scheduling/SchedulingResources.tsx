import { useMemo } from 'react';
import { useSchedulingPlatform } from '@/hooks/useSchedulingPlatform';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Stethoscope, Bed, DoorOpen, Settings, CheckCircle } from 'lucide-react';

const resources = [
  { id: 'RES-001', name: 'CT Scanner 1', type: 'Imaging', dept: 'Radiology', status: 'In Use', nextAvailable: '11:30 AM', todayBookings: 8, capacity: 12 },
  { id: 'RES-002', name: 'MRI Suite', type: 'Imaging', dept: 'Radiology', status: 'Available', nextAvailable: 'Now', todayBookings: 5, capacity: 8 },
  { id: 'RES-003', name: 'X-Ray Room 1', type: 'Imaging', dept: 'Radiology', status: 'Available', nextAvailable: 'Now', todayBookings: 12, capacity: 20 },
  { id: 'RES-004', name: 'Ultrasound Room A', type: 'Imaging', dept: 'Radiology', status: 'In Use', nextAvailable: '11:15 AM', todayBookings: 6, capacity: 10 },
  { id: 'RES-005', name: 'OT Room 1', type: 'Operation Theatre', dept: 'Surgery', status: 'In Use', nextAvailable: '2:00 PM', todayBookings: 3, capacity: 4 },
  { id: 'RES-006', name: 'OT Room 2', type: 'Operation Theatre', dept: 'Surgery', status: 'Maintenance', nextAvailable: 'Tomorrow', todayBookings: 0, capacity: 4 },
  { id: 'RES-007', name: 'Consultation Room 1', type: 'Consultation', dept: 'OPD', status: 'In Use', nextAvailable: '11:00 AM', todayBookings: 15, capacity: 24 },
  { id: 'RES-008', name: 'Consultation Room 2', type: 'Consultation', dept: 'OPD', status: 'Available', nextAvailable: 'Now', todayBookings: 10, capacity: 24 },
  { id: 'RES-009', name: 'ECG Machine', type: 'Equipment', dept: 'Cardiology', status: 'Available', nextAvailable: 'Now', todayBookings: 8, capacity: 15 },
  { id: 'RES-010', name: 'Hematology Analyzer', type: 'Laboratory', dept: 'Pathology', status: 'In Use', nextAvailable: '11:45 AM', todayBookings: 22, capacity: 30 },
];

const STATUS_STYLE: Record<string, string> = {
  'Available': 'bg-success/10 text-success',
  'In Use': 'bg-info/10 text-info',
  'Maintenance': 'bg-destructive/10 text-destructive',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  Imaging: Monitor,
  'Operation Theatre': DoorOpen,
  Consultation: Stethoscope,
  Equipment: Settings,
  Laboratory: Settings,
};

export default function SchedulingResources() {
  const { platformOn, resources: platformResources } = useSchedulingPlatform();
  const rows = useMemo(() => {
    if (platformOn && platformResources.length > 0) {
      return platformResources.map((r) => ({
        id: r.id,
        name: r.label,
        type: r.resourceType,
        dept: r.department ?? 'General',
        status: 'Available',
        nextAvailable: 'Now',
        todayBookings: 0,
        capacity: 12,
      }));
    }
    return resources;
  }, [platformOn, platformResources]);

  const available = rows.filter(r => r.status === 'Available').length;
  const inUse = rows.filter(r => r.status === 'In Use').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Resource Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage imaging machines, OT rooms, consultation rooms, and equipment</p>
        </div>
        <Button className="gap-2"><Settings className="w-4 h-4" />Manage Resources</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><p className="text-xl font-bold text-foreground">{available}</p><p className="text-xs text-muted-foreground">Available Now</p></Card>
        <Card className="p-4"><p className="text-xl font-bold text-foreground">{inUse}</p><p className="text-xs text-muted-foreground">In Use</p></Card>
        <Card className="p-4"><p className="text-xl font-bold text-foreground">{rows.length}</p><p className="text-xs text-muted-foreground">Total Resources</p></Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({rows.length})</TabsTrigger>
          <TabsTrigger value="Imaging">Imaging</TabsTrigger>
          <TabsTrigger value="Operation Theatre">OT</TabsTrigger>
          <TabsTrigger value="Consultation">Consultation</TabsTrigger>
        </TabsList>

        {['all', 'Imaging', 'Operation Theatre', 'Consultation'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {rows
                .filter(r => tab === 'all' || r.type === tab)
                .map(r => {
                  const Icon = TYPE_ICONS[r.type] || Settings;
                  return (
                    <Card key={r.id} className="p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4 text-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.type} · {r.dept}</p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] ${STATUS_STYLE[r.status] || ''}`}>{r.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Next Available</span><p className="font-medium text-foreground">{r.nextAvailable}</p></div>
                        <div><span className="text-muted-foreground">Today's Bookings</span><p className="font-medium text-foreground">{r.todayBookings}/{r.capacity}</p></div>
                      </div>
                      <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${(r.todayBookings / r.capacity) * 100}%` }} />
                      </div>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}