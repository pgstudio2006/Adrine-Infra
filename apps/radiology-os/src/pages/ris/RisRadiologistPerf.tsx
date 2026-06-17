import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const RADIOLOGISTS = [
  { name: 'Dr. Iyer', reportsFinalized: 145, avgTat: 32, pending: 3, revenue: 145000 },
  { name: 'Dr. Mehta', reportsFinalized: 98, avgTat: 28, pending: 2, revenue: 98000 },
  { name: 'Dr. Nair', reportsFinalized: 62, avgTat: 41, pending: 5, revenue: 62000 },
  { name: 'Dr. Sharma', reportsFinalized: 45, avgTat: 35, pending: 1, revenue: 37500 },
];

const MONTHLY_TREND = [
  { month: 'Jan', iyer: 22, mehta: 16, nair: 10, sharma: 8 },
  { month: 'Feb', iyer: 24, mehta: 17, nair: 11, sharma: 7 },
  { month: 'Mar', iyer: 25, mehta: 18, nair: 12, sharma: 8 },
  { month: 'Apr', iyer: 23, mehta: 16, nair: 10, sharma: 7 },
  { month: 'May', iyer: 26, mehta: 17, nair: 11, sharma: 8 },
  { month: 'Jun', iyer: 25, mehta: 14, nair: 8, sharma: 7 },
];

export default function RisRadiologistPerf() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Radiologist Performance</h1>
        <p className="text-sm text-white/40 mt-0.5">Reports finalized, TAT, pending, and revenue contribution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {RADIOLOGISTS.map(r => (
          <div key={r.name} className="bg-[#151922] rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-[#E53935]/10 flex items-center justify-center text-[#E53935] text-[10px] font-bold">{r.name.split(' ').pop()?.[0]}</div>
              <p className="text-xs font-semibold text-white">{r.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-[9px] text-white/30 uppercase">Reports</p><p className="text-sm font-bold text-white">{r.reportsFinalized}</p></div>
              <div><p className="text-[9px] text-white/30 uppercase">Avg TAT</p><p className={`text-sm font-bold ${r.avgTat > 35 ? 'text-[#FFB300]' : 'text-[#00C853]'}`}>{r.avgTat}m</p></div>
              <div><p className="text-[9px] text-white/30 uppercase">Pending</p><p className="text-sm font-bold text-white">{r.pending}</p></div>
              <div><p className="text-[9px] text-white/30 uppercase">Revenue</p><p className="text-sm font-bold text-white">₹{(r.revenue / 1000).toFixed(0)}K</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
        <p className="text-xs font-semibold text-white mb-3">Monthly Reports Finalized</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={MONTHLY_TREND} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
            <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="iyer" fill="#E53935" name="Dr. Iyer" radius={[2, 2, 0, 0]} />
            <Bar dataKey="mehta" fill="#6366f1" name="Dr. Mehta" radius={[2, 2, 0, 0]} />
            <Bar dataKey="nair" fill="#00C853" name="Dr. Nair" radius={[2, 2, 0, 0]} />
            <Bar dataKey="sharma" fill="#FFB300" name="Dr. Sharma" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
