import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, Download, Clock, Scissors, User, 
  Package, AlertTriangle, CheckCircle2, Printer, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface SurgeryReport {
  id: string;
  patient: string;
  uhid: string;
  surgery: string;
  surgeon: string;
  date: string;
  room: string;
  duration: string;
  outcome: 'successful' | 'complications' | 'cancelled';
  hasAnesthesiaReport: boolean;
  hasImplantReport: boolean;
  hasComplicationReport: boolean;
}

const REPORTS: SurgeryReport[] = [
  { id: 'SR-001', patient: 'Ramesh Patel', uhid: 'P-1024', surgery: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. Mehta', date: '8 Mar 2026', room: 'OT-1', duration: '1h 50m', outcome: 'successful', hasAnesthesiaReport: true, hasImplantReport: false, hasComplicationReport: false },
  { id: 'SR-002', patient: 'Kanta Desai', uhid: 'P-1089', surgery: 'Hysterectomy', surgeon: 'Dr. Joshi', date: '8 Mar 2026', room: 'OT-3', duration: '2h 45m', outcome: 'successful', hasAnesthesiaReport: true, hasImplantReport: false, hasComplicationReport: false },
  { id: 'SR-003', patient: 'Suresh Bhatt', uhid: 'P-2103', surgery: 'Wound Debridement', surgeon: 'Dr. Trivedi', date: '8 Mar 2026', room: 'OT-4', duration: '1h 15m', outcome: 'successful', hasAnesthesiaReport: true, hasImplantReport: false, hasComplicationReport: false },
  { id: 'SR-004', patient: 'Jayesh Acharya', uhid: 'P-0784', surgery: 'Hernia Repair', surgeon: 'Dr. Mehta', date: '7 Mar 2026', room: 'OT-1', duration: '1h 30m', outcome: 'successful', hasAnesthesiaReport: true, hasImplantReport: false, hasComplicationReport: false },
  { id: 'SR-005', patient: 'Meena Sharma', uhid: 'P-1432', surgery: 'Total Hip Replacement', surgeon: 'Dr. Shah', date: '7 Mar 2026', room: 'OT-2', duration: '3h 10m', outcome: 'complications', hasAnesthesiaReport: true, hasImplantReport: true, hasComplicationReport: true },
  { id: 'SR-006', patient: 'Govind Rao', uhid: 'P-2456', surgery: 'CABG', surgeon: 'Dr. Kapoor', date: '6 Mar 2026', room: 'OT-3', duration: '4h 20m', outcome: 'successful', hasAnesthesiaReport: true, hasImplantReport: false, hasComplicationReport: false },
];

const REPORT_TYPES = [
  { label: 'Surgery Reports', value: 128, description: 'Complete surgical documentation', icon: Scissors },
  { label: 'Anesthesia Reports', value: 126, description: 'Anesthesia records & monitoring', icon: FileText },
  { label: 'Implant Reports', value: 34, description: 'Device tracking & traceability', icon: Package },
  { label: 'Complication Reports', value: 8, description: 'Adverse event documentation', icon: AlertTriangle },
];

const OUTCOME_CONFIG = {
  successful: { label: 'Successful', class: 'bg-success/10 text-success border-success/20' },
  complications: { label: 'With Complications', class: 'bg-warning/10 text-warning border-warning/20' },
  cancelled: { label: 'Cancelled', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTReports() {
  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Surgical reports"
      subtitle="Surgical documentation and compliance records"
      actions={<Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export all</Button>}
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Report Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {REPORT_TYPES.map(r => (
          <motion.div key={r.label} variants={item}>
            <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <r.icon className="h-5 w-5 mb-3 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-2xl font-bold">{r.value}</p>
                <p className="text-xs font-medium mt-0.5">{r.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{r.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Reports */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Recent Surgery Reports</span>
        </div>
        <div className="space-y-2">
          {REPORTS.map(r => (
            <Card key={r.id} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-5">
                <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                  <Scissors className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{r.surgery}</p>
                    <Badge className={`${OUTCOME_CONFIG[r.outcome].class} text-[10px]`}>{OUTCOME_CONFIG[r.outcome].label}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {r.patient} ({r.uhid}) • {r.surgeon} • {r.room} • {r.duration}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.hasAnesthesiaReport && <Badge className="bg-muted text-muted-foreground text-[9px]">Anesthesia</Badge>}
                  {r.hasImplantReport && <Badge className="bg-muted text-muted-foreground text-[9px]">Implant</Badge>}
                  {r.hasComplicationReport && <Badge className="bg-warning/10 text-warning text-[9px]">Complication</Badge>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{r.id}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Printer className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
      </motion.div>
    </OperationsModulePage>
  );
}
