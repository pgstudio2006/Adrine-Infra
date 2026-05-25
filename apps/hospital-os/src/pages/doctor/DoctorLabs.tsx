import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FlaskConical, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDoctorScope } from '@/hooks/useDoctorScope';
import { useDepartmentWorklistSync } from '@/hooks/useDepartmentWorklistSync';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

type LabStatus = 'pending' | 'processing' | 'completed' | 'critical';

const statusStyle: Record<LabStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  critical: 'bg-destructive/10 text-destructive',
};

const filters: Array<'All' | 'Pending' | 'Processing' | 'Completed' | 'Critical'> = [
  'All',
  'Pending',
  'Processing',
  'Completed',
  'Critical',
];

function getLabStatus(input: {
  stage: string;
  sampleStatus: string;
  criticalAlert?: boolean;
}): LabStatus {
  if (input.criticalAlert) {
    return 'critical';
  }

  if (input.stage === 'Reported' || input.stage === 'Validated') {
    return 'completed';
  }

  if (input.stage === 'In Analysis' || input.stage === 'Awaiting Validation' || input.sampleStatus === 'Processing') {
    return 'processing';
  }

  return 'pending';
}

export default function DoctorLabs() {
  const {
    isDoctor,
    doctorName,
    department,
    labOrders,
    canAccessPatient,
  } = useDoctorScope();

  useDepartmentWorklistSync('lab');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<typeof filters[number]>('All');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const navigate = useNavigate();

  const normalizedOrders = useMemo(() => {
    return labOrders.map((order) => ({
      ...order,
      normalizedStatus: getLabStatus({
        stage: order.stage,
        sampleStatus: order.sampleStatus,
        criticalAlert: order.criticalAlert,
      }),
    }));
  }, [labOrders]);

  const filtered = normalizedOrders.filter((order) => {
    const query = search.toLowerCase().trim();
    const matchSearch =
      order.patientName.toLowerCase().includes(query) ||
      order.tests.toLowerCase().includes(query) ||
      order.orderId.toLowerCase().includes(query) ||
      order.uhid.toLowerCase().includes(query);

    const matchFilter = filter === 'All' || order.normalizedStatus === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedOrderId('');
      return;
    }

    if (!filtered.some((order) => order.orderId === selectedOrderId)) {
      setSelectedOrderId(filtered[0].orderId);
    }
  }, [filtered, selectedOrderId]);

  const selectedOrder = filtered.find((order) => order.orderId === selectedOrderId) || filtered[0];

  const summary = {
    total: normalizedOrders.length,
    pending: normalizedOrders.filter((order) => order.normalizedStatus === 'pending').length,
    processing: normalizedOrders.filter((order) => order.normalizedStatus === 'processing').length,
    completed: normalizedOrders.filter((order) => order.normalizedStatus === 'completed').length,
    critical: normalizedOrders.filter((order) => order.normalizedStatus === 'critical').length,
  };

  if (!isDoctor) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Access denied. Only doctor users can access lab orders.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn(0)} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab Orders And Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {doctorName} · {department || 'All Departments'}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate('/doctor/queue')}>
          <FlaskConical className="w-3.5 h-3.5" /> New Lab Order From Consultation
        </Button>
      </motion.div>

      <motion.div {...fadeIn(1)} className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Orders', value: summary.total, color: '' },
          { label: 'Pending', value: summary.pending, color: 'text-muted-foreground' },
          { label: 'Processing', value: summary.processing, color: 'text-amber-600' },
          { label: 'Completed', value: summary.completed, color: 'text-emerald-600' },
          { label: 'Critical', value: summary.critical, color: 'text-destructive' },
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
            placeholder="Search by patient, test, order ID, or UHID..."
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
          <div className="divide-y max-h-[650px] overflow-y-auto">
            {filtered.map((order) => (
              <div
                key={order.orderId}
                onClick={() => setSelectedOrderId(order.orderId)}
                className={`px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${selectedOrder?.orderId === order.orderId ? 'bg-accent/70' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-semibold text-muted-foreground">{order.orderId}</span>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusStyle[order.normalizedStatus]}`}>
                    {order.normalizedStatus}
                  </span>
                </div>
                <p className="text-xs font-semibold">{order.patientName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{order.tests}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{order.orderTime}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">{order.priority}</span>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No lab orders found for your patient scope.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div {...fadeIn(4)} className="lg:col-span-2 border rounded-xl bg-card">
          {selectedOrder ? (
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{selectedOrder.tests}</h3>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${statusStyle[selectedOrder.normalizedStatus]}`}>
                      {selectedOrder.normalizedStatus}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.patientName} · {selectedOrder.uhid} · {selectedOrder.category}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Ordered: {selectedOrder.orderTime} · Priority: {selectedOrder.priority}
                  </p>
                </div>
                {canAccessPatient(selectedOrder.uhid) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => navigate(`/doctor/patients/${selectedOrder.uhid}`)}
                  >
                    Patient 360
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="border rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Processing</p>
                  <p>Stage: <span className="font-medium">{selectedOrder.stage}</span></p>
                  <p>Sample: <span className="font-medium">{selectedOrder.sampleStatus}</span></p>
                  <p>Specimen: <span className="font-medium">{selectedOrder.specimenType || 'Not specified'}</span></p>
                  <p>Method: <span className="font-medium">{selectedOrder.methodName || 'Not specified'}</span></p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Reporting</p>
                  <p>Validated by: <span className="font-medium">{selectedOrder.validatedBy || 'Pending'}</span></p>
                  <p>Authorized by: <span className="font-medium">{selectedOrder.authorizedBy || 'Pending'}</span></p>
                  <p>Reported at: <span className="font-medium">{selectedOrder.reportedAt || 'Pending'}</span></p>
                  <p>
                    Critical: {selectedOrder.criticalAlert ? <span className="font-semibold text-destructive">Yes</span> : <span className="font-medium">No</span>}
                  </p>
                </div>
              </div>

              {selectedOrder.results ? (
                <div className="border rounded-lg p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Results</p>
                  <p className="text-sm leading-relaxed">{selectedOrder.results}</p>
                  {selectedOrder.interpretation && (
                    <p className="text-xs text-muted-foreground mt-2">Interpretation: {selectedOrder.interpretation}</p>
                  )}
                  {selectedOrder.comments && (
                    <p className="text-xs text-muted-foreground mt-1">Comments: {selectedOrder.comments}</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed">
                  {selectedOrder.normalizedStatus === 'critical' ? (
                    <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
                  ) : (
                    <Clock className="w-8 h-8 text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm font-medium">Results Pending</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lab has not released the final report yet.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Add To Case Notes
                </Button>
                <Button variant="outline" size="sm">Reorder Test</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <FlaskConical className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Select a lab order</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
