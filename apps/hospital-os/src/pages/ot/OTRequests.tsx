import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Inbox, Search, CheckCircle2, Clock, AlertTriangle, User,
  Scissors, FileText, Stethoscope, ArrowRight, XCircle,
  RefreshCw, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { allowDemoFallback } from '@/lib/platform/demo-fallback';
import { Badge as BadgeUI } from '@/components/ui/badge';

interface SurgeryRequest {
  id: string;
  patient: string;
  uhid: string;
  procedure: string;
  surgeon: string;
  specialty: string;
  priority: 'elective' | 'urgent' | 'emergency';
  status: 'pending' | 'reviewed' | 'scheduled' | 'declined';
  requestedAt: string;
  notes: string;
  ipdAdmissionId?: string;
}

const DEMO_REQUESTS: SurgeryRequest[] = [
  { id: 'REQ-001', patient: 'Meena Sharma', uhid: 'P-1432', procedure: 'Total Hip Replacement', surgeon: 'Dr. Shah', specialty: 'Orthopedics', priority: 'elective', status: 'pending', requestedAt: 'Today, 09:15 AM', notes: 'Severe OA right hip. Already worked up — labs and imaging complete.', ipdAdmissionId: 'IPD-2026-089' },
  { id: 'REQ-002', patient: 'Ravi Deshmukh', uhid: 'P-3211', procedure: 'Inguinal Hernia Repair', surgeon: 'Dr. Mehta', specialty: 'General Surgery', priority: 'elective', status: 'pending', requestedAt: 'Today, 10:30 AM', notes: 'Right-sided reducible hernia. Pre-op clearance pending.' },
  { id: 'REQ-003', patient: 'Sunita Kale', uhid: 'P-2109', procedure: 'Emergency Laparotomy', surgeon: 'Dr. Trivedi', specialty: 'General Surgery', priority: 'emergency', status: 'pending', requestedAt: 'Today, 11:45 AM', notes: 'Suspected perforation peritonitis. Needs urgent OR slot.' },
  { id: 'REQ-004', patient: 'Arun Nair', uhid: 'P-3345', procedure: 'CABG', surgeon: 'Dr. Kapoor', specialty: 'Cardiothoracic', priority: 'urgent', status: 'reviewed', requestedAt: 'Yesterday, 04:00 PM', notes: 'Triple vessel disease. Cath done. Waiting for ICU bed post-op.' },
  { id: 'REQ-005', patient: 'Kanta Desai', uhid: 'P-1089', procedure: 'Hysterectomy', surgeon: 'Dr. Joshi', specialty: 'Gynecology', priority: 'elective', status: 'scheduled', requestedAt: '2 days ago', notes: 'Uterine fibroids. Scheduled for OT-3 tomorrow 10 AM.' },
  { id: 'REQ-006', patient: 'Dinesh Rana', uhid: 'P-3245', procedure: 'Fracture Fixation ORIF', surgeon: 'Dr. Shah', specialty: 'Orthopedics', priority: 'emergency', status: 'declined', requestedAt: 'Yesterday, 11:00 PM', notes: 'Declined — patient opted for conservative management.' },
];

const PRIORITY_CONFIG = {
  elective: { label: 'Elective', class: 'bg-muted text-muted-foreground' },
  urgent: { label: 'Urgent', class: 'bg-warning/10 text-warning border-warning/20' },
  emergency: { label: 'Emergency', class: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', class: 'bg-info/10 text-info border-info/20', icon: Clock },
  reviewed: { label: 'Reviewed', class: 'bg-muted text-muted-foreground', icon: FileText },
  scheduled: { label: 'Scheduled', class: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  declined: { label: 'Declined', class: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTRequests() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [requests, setRequests] = useState<SurgeryRequest[]>(() =>
    allowDemoFallback() ? DEMO_REQUESTS : [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [newNotes, setNewNotes] = useState('');

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = r.patient.toLowerCase().includes(search.toLowerCase()) ||
        r.procedure.toLowerCase().includes(search.toLowerCase()) ||
        r.surgeon.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, search, filterStatus]);

  const stats = useMemo(() => ({
    pending: requests.filter(r => r.status === 'pending').length,
    emergency: requests.filter(r => r.priority === 'emergency' && r.status === 'pending').length,
    total: requests.length,
  }), [requests]);

  const handleReview = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'reviewed' as const } : r));
    toast.success('Request marked as reviewed');
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined' as const } : r));
    toast.success('Request declined');
  };

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Surgery Requests"
      subtitle={`${stats.pending} pending${stats.emergency > 0 ? ` · ${stats.emergency} emergency` : ''}`}
      actions={
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New surgery request</DialogTitle></DialogHeader>
            <div className="grid gap-3 mt-2">
              <div>
                <Label>Patient name</Label>
                <Input className="mt-1" placeholder="Search or enter name..." />
              </div>
              <div>
                <Label>Procedure</Label>
                <Input className="mt-1" placeholder="e.g. Laparoscopic Cholecystectomy" />
              </div>
              <div>
                <Label>Surgeon</Label>
                <Input className="mt-1" placeholder="Dr. ..." />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea className="mt-1" rows={3} placeholder="Clinical notes, urgency..." />
              </div>
              <Button size="sm" onClick={() => { toast.success('Request submitted'); setShowDialog(false); }}>
                Submit request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div variants={item}>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <Inbox className="h-4 w-4 text-info mb-2" strokeWidth={1.5} />
                <p className="text-xl font-bold">{stats.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <AlertTriangle className="h-4 w-4 text-destructive mb-2" strokeWidth={1.5} />
                <p className="text-xl font-bold">{stats.emergency}</p>
                <p className="text-[10px] text-muted-foreground">Emergency</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={item}>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <Scissors className="h-4 w-4 text-muted-foreground mb-2" strokeWidth={1.5} />
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground">Total Requests</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div variants={item} className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patient, procedure, surgeon..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
            {['All', 'pending', 'reviewed', 'scheduled', 'declined'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${filterStatus === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {s === 'All' ? 'All' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label || s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Request Cards */}
        <div className="space-y-2">
          {filtered.map(r => {
            const StatusIcon = STATUS_CONFIG[r.status].icon;
            return (
              <motion.div key={r.id} variants={item}>
                <Card className={`border-border/60 hover:shadow-md transition-all ${r.priority === 'emergency' && r.status === 'pending' ? 'ring-1 ring-destructive/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{r.patient}</p>
                            <Badge className={`${PRIORITY_CONFIG[r.priority].class} text-[10px]`}>{r.priority}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{r.procedure} • {r.surgeon} • {r.specialty}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                            <span>{r.uhid}</span>
                            <span>•</span>
                            <span>{r.requestedAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {r.ipdAdmissionId && (
                          <BadgeUI className="text-[9px] bg-muted text-muted-foreground">IPD: {r.ipdAdmissionId}</BadgeUI>
                        )}
                        <Badge className={`${STATUS_CONFIG[r.status].class} text-[10px] gap-1`}>
                          <StatusIcon className="h-3 w-3" /> {STATUS_CONFIG[r.status].label}
                        </Badge>
                        {r.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleReview(r.id)}>
                              <FileText className="h-3 w-3 mr-1" /> Review
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={() => handleDecline(r.id)}>
                              <XCircle className="h-3 w-3 mr-1" /> Decline
                            </Button>
                          </div>
                        )}
                        {r.status === 'reviewed' && (
                          <Button size="sm" className="h-7 text-[11px] gap-1">
                            <ArrowRight className="h-3 w-3" /> Schedule
                          </Button>
                        )}
                      </div>
                    </div>
                    {r.notes && (
                      <div className="mt-2 pl-14">
                        <p className="text-[11px] text-muted-foreground italic">{r.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No requests match your filters.
            </div>
          )}
        </div>
      </motion.div>
    </OperationsModulePage>
  );
}
