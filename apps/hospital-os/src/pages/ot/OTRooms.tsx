import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, Settings, Wrench, CheckCircle2, Clock, AlertTriangle,
  Monitor, Thermometer, Wind, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface OTRoom {
  id: string;
  name: string;
  department: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  equipment: string[];
  currentSurgery?: string;
  currentSurgeon?: string;
  nextSurgery?: { time: string; name: string };
  utilization: number;
  todaySurgeries: number;
  features: string[];
}

const ROOMS: OTRoom[] = [
  {
    id: 'OT-1', name: 'Main Theatre', department: 'General Surgery',
    status: 'occupied', equipment: ['Laparoscopic Tower', 'Electrosurgical Unit', 'Suction', 'Defibrillator'],
    currentSurgery: 'Laparoscopic Cholecystectomy', currentSurgeon: 'Dr. Mehta',
    nextSurgery: { time: '01:30 PM', name: 'Appendectomy' },
    utilization: 82, todaySurgeries: 3,
    features: ['Laminar Airflow', 'HEPA Filtration', 'Video Recording']
  },
  {
    id: 'OT-2', name: 'Ortho Theatre', department: 'Orthopedics',
    status: 'occupied', equipment: ['C-Arm', 'Power Tools', 'Traction Table', 'Image Intensifier'],
    currentSurgery: 'Total Knee Replacement', currentSurgeon: 'Dr. Shah',
    nextSurgery: { time: '03:00 PM', name: 'Fracture Fixation' },
    utilization: 75, todaySurgeries: 2,
    features: ['Lead Lining', 'Laminar Airflow', 'Ultra-clean Zone']
  },
  {
    id: 'OT-3', name: 'Cardiac Theatre', department: 'Cardiothoracic',
    status: 'available', equipment: ['Heart-Lung Machine', 'IABP', 'TEE', 'Cell Saver'],
    nextSurgery: { time: '02:00 PM', name: 'CABG' },
    utilization: 45, todaySurgeries: 1,
    features: ['Hybrid Cath Lab', 'HEPA Filtration', 'Dedicated HVAC']
  },
  {
    id: 'OT-4', name: 'Minor Procedures', department: 'Multi-Specialty',
    status: 'cleaning', equipment: ['Basic Surgical Kit', 'Electrocautery', 'Local Anesthesia Setup'],
    nextSurgery: { time: '01:30 PM', name: 'Cataract Surgery' },
    utilization: 60, todaySurgeries: 3,
    features: ['Ophthalmic Microscope', 'Portable Monitor']
  },
];

const STATUS_CONFIG = {
  available: { label: 'Available', class: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  occupied: { label: 'In Use', class: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  maintenance: { label: 'Maintenance', class: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  cleaning: { label: 'Turnover', class: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
};

const ENVIRONMENTAL = [
  { label: 'Temperature', value: '21°C', icon: Thermometer, status: 'normal' },
  { label: 'Humidity', value: '55%', icon: Wind, status: 'normal' },
  { label: 'Air Changes', value: '25/hr', icon: Zap, status: 'normal' },
  { label: 'Pressure', value: 'Positive', icon: Monitor, status: 'normal' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTRooms() {
  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="OT rooms"
      subtitle="4 theatres • room status and environmental monitoring"
      actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add room</Button>}
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Environmental Monitoring */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Environmental Monitoring</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ENVIRONMENTAL.map(e => (
            <Card key={e.label} className="border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                  <e.icon className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="text-lg font-bold">{e.value}</p>
                  <p className="text-[10px] text-muted-foreground">{e.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Room Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {ROOMS.map(room => (
          <motion.div key={room.id} variants={item}>
            <Card className={`border-border/60 hover:shadow-md transition-all ${room.status === 'occupied' ? 'ring-1 ring-warning/20' : ''}`}>
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center text-xs font-bold">
                      {room.id}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{room.name}</p>
                      <p className="text-[11px] text-muted-foreground">{room.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${STATUS_CONFIG[room.status].class} text-[10px]`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[room.status].dot} mr-1.5`} />
                      {STATUS_CONFIG[room.status].label}
                    </Badge>
                    <button className="p-1.5 rounded-md hover:bg-accent transition-colors">
                      <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Current Surgery */}
                {room.currentSurgery && (
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 mb-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Current Surgery</p>
                    <p className="text-sm font-semibold">{room.currentSurgery}</p>
                    <p className="text-[11px] text-muted-foreground">{room.currentSurgeon}</p>
                  </div>
                )}

                {/* Next Surgery */}
                {room.nextSurgery && (
                  <div className="flex items-center gap-2 mb-3 text-[11px]">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Next:</span>
                    <span className="font-medium">{room.nextSurgery.name}</span>
                    <span className="text-muted-foreground">at {room.nextSurgery.time}</span>
                  </div>
                )}

                {/* Utilization Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-semibold">{room.utilization}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted">
                    <div className={`h-full rounded-full transition-all ${room.utilization > 70 ? 'bg-success' : room.utilization > 40 ? 'bg-info' : 'bg-muted-foreground'}`}
                      style={{ width: `${room.utilization}%` }} />
                  </div>
                </div>

                {/* Equipment Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {room.equipment.slice(0, 3).map(e => (
                    <span key={e} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">{e}</span>
                  ))}
                  {room.equipment.length > 3 && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">+{room.equipment.length - 3}</span>
                  )}
                </div>

                {/* Features */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {room.features.map(f => (
                    <span key={f} className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-success" /> {f}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                  <span className="text-[11px] text-muted-foreground">{room.todaySurgeries} surgeries today</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1"><Wrench className="h-3 w-3" /> Maintenance</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      </motion.div>
    </OperationsModulePage>
  );
}
