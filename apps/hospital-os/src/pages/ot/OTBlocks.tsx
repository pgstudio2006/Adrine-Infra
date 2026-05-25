import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  CalendarDays, Clock, User, Scissors, Plus, 
  CheckCircle2, AlertTriangle, Edit3, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface BlockSchedule {
  id: string;
  surgeon: string;
  specialty: string;
  dayOfWeek: string;
  room: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  utilization: number;
  nextBooking?: string;
  conflicts: number;
}

const DEMO_BLOCKS: BlockSchedule[] = [
  { id: 'BLK-001', surgeon: 'Dr. Rajesh Mehta', specialty: 'General Surgery', dayOfWeek: 'Monday', room: 'OT-1', startTime: '08:00', endTime: '13:00', recurring: true, utilization: 82, nextBooking: 'Lap. Cholecystectomy', conflicts: 0 },
  { id: 'BLK-002', surgeon: 'Dr. Priya Shah', specialty: 'Orthopedics', dayOfWeek: 'Tuesday', room: 'OT-2', startTime: '09:00', endTime: '15:00', recurring: true, utilization: 75, nextBooking: 'Total Knee Replacement', conflicts: 1 },
  { id: 'BLK-003', surgeon: 'Dr. Amit Kapoor', specialty: 'Cardiothoracic', dayOfWeek: 'Wednesday', room: 'OT-3', startTime: '08:00', endTime: '16:00', recurring: true, utilization: 45, nextBooking: 'CABG', conflicts: 0 },
  { id: 'BLK-004', surgeon: 'Dr. Neha Desai', specialty: 'Ophthalmology', dayOfWeek: 'Thursday', room: 'OT-4', startTime: '10:00', endTime: '14:00', recurring: true, utilization: 60, conflicts: 0 },
  { id: 'BLK-005', surgeon: 'Dr. Sunil Joshi', specialty: 'Gynecology', dayOfWeek: 'Friday', room: 'OT-3', startTime: '09:00', endTime: '13:00', recurring: false, utilization: 55, nextBooking: 'Hysterectomy', conflicts: 0 },
  { id: 'BLK-006', surgeon: 'Dr. Rahul Trivedi', specialty: 'General Surgery', dayOfWeek: 'Monday', room: 'OT-4', startTime: '14:00', endTime: '17:00', recurring: true, utilization: 35, conflicts: 0 },
  { id: 'BLK-007', surgeon: 'Dr. Rajesh Mehta', specialty: 'General Surgery', dayOfWeek: 'Wednesday', room: 'OT-1', startTime: '08:00', endTime: '12:00', recurring: true, utilization: 90, nextBooking: 'Hernia Repair', conflicts: 0 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTBlocks() {
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [blocks, setBlocks] = useState(DEMO_BLOCKS);

  const filtered = useMemo(() => {
    return selectedDay === 'All' ? blocks : blocks.filter(b => b.dayOfWeek === selectedDay);
  }, [blocks, selectedDay]);

  const totalUtilization = useMemo(() => {
    if (blocks.length === 0) return 0;
    return Math.round(blocks.reduce((s, b) => s + b.utilization, 0) / blocks.length);
  }, [blocks]);

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Surgeon Block Schedule"
      subtitle={`${blocks.length} blocks · ${totalUtilization}% avg utilization`}
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add block</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New block schedule</DialogTitle></DialogHeader>
            <div className="grid gap-3 mt-2">
              <div><Label>Surgeon</Label><Input className="mt-1" /></div>
              <div><Label>Day of week</Label><Input className="mt-1" placeholder="e.g. Monday" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Start time</Label><Input className="mt-1" type="time" /></div>
                <div><Label>End time</Label><Input className="mt-1" type="time" /></div>
              </div>
              <div><Label>Room</Label><Input className="mt-1" placeholder="e.g. OT-1" /></div>
              <Button size="sm" onClick={() => { toast.success('Block added'); }}>Save block</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        {/* Day filter tabs */}
        <motion.div variants={item} className="flex gap-1 bg-muted p-0.5 rounded-lg flex-wrap">
          {['All', ...DAYS].map(d => (
            <button key={d} onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedDay === d ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {d}
            </button>
          ))}
        </motion.div>

        {/* Blocks grid */}
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(block => (
            <motion.div key={block.id} variants={item}>
              <Card className={`border-border/60 hover:shadow-md transition-all ${block.conflicts > 0 ? 'ring-1 ring-destructive/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                        {block.surgeon.split(' ')[1]?.[0] || block.surgeon[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{block.surgeon}</p>
                        <p className="text-[11px] text-muted-foreground">{block.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-muted text-muted-foreground text-[10px]">{block.room}</Badge>
                      {block.recurring && <Badge className="bg-info/10 text-info border-info/20 text-[10px]">Recurring</Badge>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {block.dayOfWeek}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {block.startTime} – {block.endTime}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className={`font-semibold ${block.utilization > 80 ? 'text-success' : block.utilization > 50 ? 'text-info' : 'text-warning'}`}>{block.utilization}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${block.utilization > 80 ? 'bg-success' : block.utilization > 50 ? 'bg-info' : 'bg-warning'}`}
                        style={{ width: `${block.utilization}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {block.nextBooking && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Scissors className="h-3 w-3" /> {block.nextBooking}
                        </span>
                      )}
                      {block.conflicts > 0 && (
                        <span className="text-[11px] text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {block.conflicts} conflict(s)
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
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
