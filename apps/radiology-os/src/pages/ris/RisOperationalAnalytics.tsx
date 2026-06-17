import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const STUDIES_PER_DAY = [
  { day: 'Mon', mri: 8, ct: 12, xray: 18, usg: 10 },
  { day: 'Tue', mri: 10, ct: 14, xray: 20, usg: 12 },
  { day: 'Wed', mri: 7, ct: 11, xray: 16, usg: 9 },
  { day: 'Thu', mri: 9, ct: 13, xray: 22, usg: 11 },
  { day: 'Fri', mri: 11, ct: 15, xray: 24, usg: 14 },
  { day: 'Sat', mri: 6, ct: 8, xray: 12, usg: 7 },
];

const TAT_DATA = [
  { modality: 'MRI', avgMinutes: 45, target: 60, breaches: 2 },
  { modality: 'CT Scan', avgMinutes: 38, target: 60, breaches: 1 },
  { modality: 'X-Ray', avgMinutes: 22, target: 30, breaches: 0 },
  { modality: 'Ultrasound', avgMinutes: 30, target: 45, breaches: 1 },
];

const STATUS_DIST = [
  { name: 'Completed', value: 38, color: '#00C853' },
  { name: 'Pending', value: 14, color: '#FFB300' },
  { name: 'In Progress', value: 7, color: '#E53935' },
];

export default function RisOperationalAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Operational Analytics</h1>
        <p className="text-sm text-white/40 mt-0.5">Studies per day, report TAT, and operational metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Studies Today', value: 59, color: 'text-white' },
          { label: 'Report TAT (avg)', value: '34 min', color: 'text-[#00C853]' },
          { label: 'Pending Reports', value: 14, color: 'text-[#FFB300]' },
          { label: 'SLA Breaches', value: 4, color: 'text-[#E53935]' },
        ].map(s => (
          <div key={s.label} className="bg-[#151922] rounded-lg border border-white/5 p-4">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Studies per Day by Modality</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={STUDIES_PER_DAY} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="mri" fill="#6366f1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="ct" fill="#E53935" radius={[2, 2, 0, 0]} />
              <Bar dataKey="xray" fill="#00C853" radius={[2, 2, 0, 0]} />
              <Bar dataKey="usg" fill="#FFB300" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Report Turnaround Time</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={STATUS_DIST} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                {STATUS_DIST.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
        <p className="text-xs font-semibold text-white mb-3">TAT by Modality (Target vs Actual)</p>
        <div className="space-y-3">
          {TAT_DATA.map(t => {
            const pct = Math.min((t.avgMinutes / t.target) * 100, 100);
            return (
              <div key={t.modality} className="flex items-center gap-4">
                <span className="text-[11px] text-white/50 w-24 shrink-0">{t.modality}</span>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden relative">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 80 ? '#E53935' : pct > 60 ? '#FFB300' : '#00C853' }} />
                    <div className="absolute top-0 h-full w-[2px] bg-white/30" style={{ left: '100%' }} />
                  </div>
                </div>
                <span className="text-[10px] text-white/40 w-20 text-right">{t.avgMinutes}m / {t.target}m</span>
                {t.breaches > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E53935]/10 text-[#E53935]">{t.breaches} breach</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
