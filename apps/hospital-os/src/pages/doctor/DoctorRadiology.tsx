import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Scan, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { useDepartmentWorklistSync } from '@/hooks/useDepartmentWorklistSync';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

type RadStatus = 'pending' | 'in-progress' | 'completed' | 'reported';

const statusStyle: Record<RadStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  'in-progress': 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  reported: 'bg-blue-500/10 text-blue-700',
};

const priorityStyle: Record<string, string> = {
  Routine: 'text-muted-foreground',
  Urgent: 'text-amber-600',
  Emergency: 'text-destructive font-bold',
};

const filters: Array<'All' | 'Pending' | 'In-progress' | 'Completed' | 'Reported'> = [
  'All',
  'Pending',
  'In-progress',
  'Completed',
  'Reported',
];

function normalizeStatus(status: string): RadStatus {
  if (status === 'Ordered' || status === 'Scheduled') {
    return 'pending';
  }
  if (status === 'In Progress') {
    return 'in-progress';
  }
  if (status === 'Completed') {
    return 'completed';
  }
  return 'reported';
}

export default function DoctorRadiology() {
  const {
    isDoctor,
    doctorName,
    department,
    radiologyOrders,
    canAccessPatient,
  } = useDoctorScope();

  useDepartmentWorklistSync('radiology');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<typeof filters[number]>('All');
  const [selectedId, setSelectedId] = useState('');
  const navigate = useNavigate();

  const normalizedOrders = useMemo(() => {
    return radiologyOrders.map((order) => ({
      ...order,
      normalizedStatus: normalizeStatus(order.status),
    }));
  }, [radiologyOrders]);

  const filtered = normalizedOrders.filter((order) => {
    const query = search.toLowerCase().trim();
    const matchSearch =
      order.patientName.toLowerCase().includes(query) ||
      order.orderId.toLowerCase().includes(query) ||
      order.modality.toLowerCase().includes(query) ||
      order.study.toLowerCase().includes(query);

    const matchFilter = filter === 'All' || order.normalizedStatus === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId('');
      return;
    }

    if (!filtered.some((order) => order.orderId === selectedId)) {
      setSelectedId(filtered[0].orderId);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((order) => order.orderId === selectedId) || filtered[0];

  const summary = {
    total: normalizedOrders.length,
    pending: normalizedOrders.filter((order) => order.normalizedStatus === 'pending').length,
    inProgress: normalizedOrders.filter((order) => order.normalizedStatus === 'in-progress').length,
    completed: normalizedOrders.filter((order) => order.normalizedStatus === 'completed').length,
    reported: normalizedOrders.filter((order) => order.normalizedStatus === 'reported').length,
  };

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access radiology orders.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Radiology Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doctorName} · {department || 'All Departments'}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/doctor/queue')}>
          <Scan className="w-3.5 h-3.5" /> New Imaging Order From Consultation
        </Button>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Orders', value: summary.total, color: '' },
          { label: 'Pending', value: summary.pending, color: 'text-muted-foreground' },
          { label: 'In Progress', value: summary.inProgress, color: 'text-amber-600' },
          { label: 'Completed', value: summary.completed, color: 'text-emerald-600' },
          { label: 'Reported', value: summary.reported, color: 'text-blue-700' },
        ].map((card) => (
          <div key={card.label} className="border rounded-xl p-4 bg-card text-center">
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div {...fadeIn(2)} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, order ID, study, or modality..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((entry) => (
            <button
              key={entry}
              onClick={() => setFilter(entry)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === entry ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {entry}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...fadeIn(3)} className="lg:col-span-1 border rounded-xl bg-card overflow-hidden">
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filtered.map((order) => (
              <div
                key={order.orderId}
                onClick={() => setSelectedId(order.orderId)}
                className={`px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${selected?.orderId === order.orderId ? 'bg-accent/70' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground">{order.orderId}</span>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusStyle[order.normalizedStatus]}`}>
                    {order.normalizedStatus}
                  </span>
                </div>
                <p className="text-xs font-semibold">{order.patientName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{order.study}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{order.orderTime}</span>
                  <span className={`text-[10px] uppercase ${priorityStyle[order.priority]}`}>{order.priority}</span>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No radiology orders found for your patient scope.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeIn(4)} className="lg:col-span-2 border rounded-xl bg-card">
          {selected ? (
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{selected.study}</h3>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusStyle[selected.normalizedStatus]}`}>
                      {selected.normalizedStatus}
                    </span>
                    {selected.critical && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{selected.patientName} · {selected.uhid}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Modality: {selected.modality} · Ordered: {selected.orderTime}
                  </p>
                </div>
                {canAccessPatient(selected.uhid) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => navigate(`/doctor/patients/${selected.uhid}`)}
                  >
                    Patient 360
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="border rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Scheduling</p>
                  <p>Status: <span className="font-medium">{selected.status}</span></p>
                  <p>Scheduled date: <span className="font-medium">{selected.scheduledDate || 'Pending'}</span></p>
                  <p>Scheduled time: <span className="font-medium">{selected.scheduledTime || 'Pending'}</span></p>
                  <p>Technician: <span className="font-medium">{selected.technician || 'Not assigned'}</span></p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Reporting</p>
                  <p>Radiologist: <span className="font-medium">{selected.radiologist || 'Pending'}</span></p>
                  <p>Reported at: <span className="font-medium">{selected.reportedAt || 'Pending'}</span></p>
                  <p>Body part: <span className="font-medium">{selected.bodyPart || 'Not specified'}</span></p>
                  <p>Contrast: <span className="font-medium">{selected.contrastUsed || 'Not specified'}</span></p>
                </div>
              </div>

              {selected.reportFindings || selected.reportImpression ? (
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Findings</p>
                    <p className="text-sm leading-relaxed">{selected.reportFindings || 'No findings provided yet.'}</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Impression</p>
                    <p className="text-sm leading-relaxed">{selected.reportImpression || 'Impression pending.'}</p>
                    {selected.recommendation && (
                      <p className="text-xs text-muted-foreground mt-2">Recommendation: {selected.recommendation}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 border rounded-lg border-dashed">
                  {selected.critical ? (
                    <AlertTriangle className="w-8 h-8 text-destructive mb-3" />
                  ) : (
                    <Clock className="w-8 h-8 text-muted-foreground mb-3" />
                  )}
                  <p className="text-sm font-medium">Report Pending</p>
                  <p className="text-xs text-muted-foreground mt-1">Imaging report will appear once released by radiology.</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
                  <Eye className="w-3 h-3" /> View Images
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-7">Add To Clinical Notes</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <Scan className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Select an imaging order</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
