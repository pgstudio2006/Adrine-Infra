import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, Clock, CheckCircle, AlertTriangle, IndianRupee, Activity,
  Plus, UserPlus, List, Play, ArrowUpRight, TrendingUp, TrendingDown,
  FileText, Users, BarChart3,
} from 'lucide-react';

// ═══════════════════════════════════════════
// Demo data — replaced with API when platform is wired
// ═══════════════════════════════════════════

const MODALITY_STATS = [
  { modality: 'MRI', count: 8, color: '#6366f1' },
  { modality: 'CT', count: 12, color: '#E53935' },
  { modality: 'X-Ray', count: 24, color: '#00C853' },
  { modality: 'USG', count: 15, color: '#FFB300' },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'order', patient: 'Priya Sharma', study: 'MRI Brain', modality: 'MRI', time: '2 min ago', status: 'ordered' },
  { id: 2, type: 'scan_complete', patient: 'Rajesh Kumar', study: 'CT Chest', modality: 'CT', time: '8 min ago', status: 'imaging_complete' },
  { id: 3, type: 'report_ready', patient: 'Anita Desai', study: 'X-Ray Knee', modality: 'X-Ray', time: '15 min ago', status: 'report_ready' },
  { id: 4, type: 'dispatched', patient: 'Suresh Patel', study: 'USG Abdomen', modality: 'USG', time: '22 min ago', status: 'dispatched' },
  { id: 5, type: 'critical', patient: 'Meena Devi', study: 'CT Abdomen', modality: 'CT', time: '35 min ago', status: 'critical' },
  { id: 6, type: 'order', patient: 'Vikram Singh', study: 'MRI Lumbar', modality: 'MRI', time: '41 min ago', status: 'ordered' },
  { id: 7, type: 'report_ready', patient: 'Kavita Joshi', study: 'X-Ray Chest', modality: 'X-Ray', time: '1 hr ago', status: 'report_ready' },
];

const statusIcon: Record<string, string> = {
  ordered: 'bg-blue-500/20 text-blue-400',
  imaging_complete: 'bg-purple-500/20 text-purple-400',
  report_ready: 'bg-green-500/20 text-green-400',
  dispatched: 'bg-emerald-500/20 text-emerald-400',
  critical: 'bg-[var(--c-accent-bg)] text-[var(--c-accent)]',
};

const statusLabel: Record<string, string> = {
  ordered: 'New Order',
  imaging_complete: 'Scan Complete',
  report_ready: 'Report Ready',
  dispatched: 'Dispatched',
  critical: 'Critical',
};

export default function RisDashboard() {
  const navigate = useNavigate();

  const stats = useMemo(() => ({
    todayStudies: 59,
    pendingReports: 14,
    completedToday: 38,
    avgTat: 47,
    revenue: 342500,
    criticalAlerts: 2,
    pendingDispatch: 6,
    activePatients: 42,
  }), []);

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">RIS Dashboard</h1>
          <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">Central command center — today&apos;s radiology operations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/orders')} className="c-btn-primary">
            <Plus className="h-3.5 w-3.5" />New Order
          </button>
          <button onClick={() => navigate('/patients')} className="c-btn-secondary">
            <UserPlus className="h-3.5 w-3.5" />New Patient
          </button>
        </div>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Today\'s Studies', value: stats.todayStudies, icon: ScanLine, color: 'text-[var(--c-text)]' },
          { label: 'Pending Reports', value: stats.pendingReports, icon: Clock, color: 'text-[#FFB300]' },
          { label: 'Completed', value: stats.completedToday, icon: CheckCircle, color: 'text-[#00C853]' },
          { label: 'Avg TAT', value: `${stats.avgTat}m`, icon: Activity, color: 'text-[#2196F3]' },
          { label: 'Revenue', value: `₹${(stats.revenue / 1000).toFixed(0)}K`, icon: IndianRupee, color: 'text-[#00C853]' },
          { label: 'Critical', value: stats.criticalAlerts, icon: AlertTriangle, color: 'text-[var(--c-accent)]' },
          { label: 'To Dispatch', value: stats.pendingDispatch, icon: FileText, color: 'text-[#FFB300]' },
          { label: 'Active Patients', value: stats.activePatients, icon: Users, color: 'text-[var(--c-text-secondary)]' },
        ].map(s => (
          <div key={s.label} className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-[10px] text-[var(--c-text-secondary)] font-medium uppercase tracking-wider">{s.label}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Modality Breakdown ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {MODALITY_STATS.map(m => (
          <div key={m.modality} className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--c-text-secondary)] font-medium uppercase tracking-wider">{m.modality}</p>
              <p className="text-2xl font-bold text-[var(--c-text)] mt-0.5">{m.count}</p>
              <p className="text-[10px] text-[var(--c-text-tertiary)]">today</p>
            </div>
            <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
              <ScanLine className="h-6 w-6" style={{ color: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Recent Activity Feed ─── */}
        <div className="lg:col-span-2 bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)]">
          <div className="px-4 py-3 border-b border-[var(--c-border-light)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--c-text)]">Recent Activity</h2>
            <button onClick={() => navigate('/worklist')} className="text-[10px] text-[var(--c-accent)] font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-[var(--c-border-light)]">
            {RECENT_ACTIVITY.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--c-surface-hover)] transition-colors cursor-pointer">
                <div className={`h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold ${statusIcon[a.status]}`}>
                  {a.modality.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-[var(--c-text)] truncate">{a.patient}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${statusIcon[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--c-text-tertiary)]">{a.study}</p>
                </div>
                <span className="text-[10px] text-[var(--c-text-tertiary)] shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Quick Actions ─── */}
        <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-[var(--c-text)]">Quick Actions</h2>
          {[
            { label: 'New Order', icon: Plus, path: '/orders', color: '#E53935' },
            { label: 'New Patient', icon: UserPlus, path: '/patients', color: '#6366f1' },
            { label: 'Worklist', icon: List, path: '/worklist', color: '#00C853' },
            { label: 'Radiologist Queue', icon: Play, path: '/radiologist-queue', color: '#FFB300' },
            { label: 'Revenue', icon: TrendingUp, path: '/analytics/revenue', color: '#2196F3' },
            { label: 'Templates', icon: FileText, path: '/templates', color: '#8b5cf6' },
          ].map(q => (
            <button
              key={q.path}
              onClick={() => navigate(q.path)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border-light)] hover:bg-[var(--c-surface-hover)] hover:border-[var(--c-border)] transition-all group"
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${q.color}15` }}>
                <q.icon className="h-4 w-4" style={{ color: q.color }} />
              </div>
              <span className="text-xs font-medium text-[var(--c-text-secondary)] group-hover:text-[var(--c-text)] transition-colors">{q.label}</span>
              <ArrowUpRight className="h-3 w-3 text-[var(--c-text-placeholder)] ml-auto group-hover:text-[var(--c-text-tertiary)] transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* ─── Modality Utilization Bar ─── */}
      <div className="bg-[var(--c-surface-raised)] rounded-lg border border-[var(--c-border-light)] p-4">
        <h2 className="text-sm font-semibold text-[var(--c-text)] mb-3">Machine Utilization Today</h2>
        <div className="space-y-2">
          {[
            { name: 'MRI Suite 1', modality: 'MRI', utilization: 75, status: 'In Use' },
            { name: 'CT Suite 1', modality: 'CT', utilization: 90, status: 'In Use' },
            { name: 'CT Suite 2', modality: 'CT', utilization: 45, status: 'Available' },
            { name: 'X-Ray Room 1', modality: 'X-Ray', utilization: 80, status: 'In Use' },
            { name: 'US Room 1', modality: 'USG', utilization: 60, status: 'In Use' },
          ].map(m => (
            <div key={m.name} className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--c-text-secondary)] w-28 shrink-0">{m.name}</span>
              <div className="flex-1 h-2 rounded-full bg-[var(--c-surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${m.utilization}%`,
                    backgroundColor: m.utilization > 80 ? 'var(--c-accent)' : m.utilization > 60 ? 'var(--c-warning)' : 'var(--c-success)',
                  }}
                />
              </div>
              <span className="text-[10px] text-[var(--c-text-tertiary)] w-10 text-right">{m.utilization}%</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                m.status === 'In Use' ? 'c-badge-warning' : 'c-badge-success'
              }`}>
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
