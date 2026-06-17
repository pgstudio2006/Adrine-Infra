import { useState } from 'react';
import { Send, CheckCircle, Clock, AlertTriangle, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';

const DEMO_DISPATCH = [
  { id: '1', patient: 'Priya Sharma', uhid: 'UH-2026-001', mobile: '9876543210', study: 'MRI Brain', orderId: 'ORD-2026-0888', status: 'delivered', sentAt: '10:50 AM', deliveredAt: '10:52 AM' },
  { id: '2', patient: 'Rajesh Kumar', uhid: 'UH-2026-002', mobile: '9876543211', study: 'CT Chest', orderId: 'ORD-2026-0889', status: 'sent', sentAt: '11:05 AM', deliveredAt: '' },
  { id: '3', patient: 'Anita Desai', uhid: 'UH-2026-003', mobile: '9876543212', study: 'X-Ray Knee', orderId: 'ORD-2026-0890', status: 'queued', sentAt: '', deliveredAt: '' },
  { id: '4', patient: 'Suresh Patel', uhid: 'UH-2026-004', mobile: '9876543213', study: 'USG Abdomen', orderId: 'ORD-2026-0891', status: 'failed', sentAt: '11:15 AM', deliveredAt: '', error: 'Invalid mobile number' },
];

const statusStyle: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  queued: { bg: 'bg-[#FFB300]/10', text: 'text-[#FFB300]', icon: Clock },
  sent: { bg: 'bg-[#2196F3]/10', text: 'text-[#2196F3]', icon: Send },
  delivered: { bg: 'bg-[#00C853]/10', text: 'text-[#00C853]', icon: CheckCircle },
  failed: { bg: 'bg-[#E53935]/10', text: 'text-[#E53935]', icon: AlertTriangle },
};

export default function RisDispatch() {
  const [tab, setTab] = useState<'all' | 'queued' | 'delivered' | 'failed'>('all');
  const filtered = tab === 'all' ? DEMO_DISPATCH : DEMO_DISPATCH.filter(d => d.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">WhatsApp Dispatch Center</h1>
          <p className="text-sm text-white/40 mt-0.5">Send finalized reports to patients via WhatsApp</p>
        </div>
        <button className="h-8 px-3 rounded-md bg-[#00C853] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#00b848] transition-colors">
          <Send className="h-3.5 w-3.5" />Send All Pending
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Queued', count: DEMO_DISPATCH.filter(d => d.status === 'queued').length, color: '#FFB300' },
          { label: 'Sent', count: DEMO_DISPATCH.filter(d => d.status === 'sent').length, color: '#2196F3' },
          { label: 'Delivered', count: DEMO_DISPATCH.filter(d => d.status === 'delivered').length, color: '#00C853' },
          { label: 'Failed', count: DEMO_DISPATCH.filter(d => d.status === 'failed').length, color: '#E53935' },
        ].map(s => (
          <div key={s.label} className="bg-[#151922] rounded-lg border border-white/5 p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['all', 'queued', 'delivered', 'failed'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-[#E53935] text-white' : 'bg-[#151922] text-white/50 hover:text-white/70'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-[#151922] rounded-xl border border-white/5 divide-y divide-white/5">
        {filtered.map(d => {
          const s = statusStyle[d.status];
          const Icon = s.icon;
          return (
            <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                <Icon className={`h-4 w-4 ${s.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">{d.patient}</p>
                  <span className="text-[9px] font-mono text-white/30">{d.uhid}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${s.bg} ${s.text}`}>{d.status}</span>
                </div>
                <p className="text-[10px] text-white/40 mt-0.5">{d.study} · {d.orderId} · 📱 {d.mobile}</p>
                {d.error && <p className="text-[10px] text-[#E53935] mt-0.5">Error: {d.error}</p>}
              </div>
              <div className="text-right shrink-0">
                {d.sentAt && <p className="text-[10px] text-white/30">Sent: {d.sentAt}</p>}
                {d.deliveredAt && <p className="text-[10px] text-[#00C853]">Delivered: {d.deliveredAt}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                {d.status === 'queued' && (
                  <button className="h-7 px-2.5 rounded-md bg-[#00C853] text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-[#00b848] transition-colors">
                    <Send className="h-3 w-3" />Send
                  </button>
                )}
                {d.status === 'failed' && (
                  <button className="h-7 px-2.5 rounded-md bg-[#FFB300]/10 text-[#FFB300] text-[10px] font-semibold flex items-center gap-1 hover:bg-[#FFB300]/20 transition-colors">
                    <RefreshCw className="h-3 w-3" />Retry
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
