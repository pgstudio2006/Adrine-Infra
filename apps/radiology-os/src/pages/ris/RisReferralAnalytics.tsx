import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const REFERRAL_DATA = [
  { name: 'Dr. Gupta', studies: 45, revenue: 180000 },
  { name: 'Dr. Singh', studies: 38, revenue: 152000 },
  { name: 'Dr. Patel', studies: 28, revenue: 112000 },
  { name: 'Dr. Kumar', studies: 22, revenue: 88000 },
  { name: 'Walk-in', studies: 18, revenue: 54000 },
  { name: 'Online Booking', studies: 12, revenue: 36000 },
];

const CHANNEL_DATA = [
  { name: 'Doctor Referral', value: 55, color: '#E53935' },
  { name: 'Walk-in', value: 20, color: '#6366f1' },
  { name: 'Online Booking', value: 15, color: '#00C853' },
  { name: 'Corporate', value: 10, color: '#FFB300' },
];

export default function RisReferralAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Referral Analytics</h1>
        <p className="text-sm text-white/40 mt-0.5">Referring doctor performance, channel distribution, and growth trends</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Referrals</p>
          <p className="text-xl font-bold text-white mt-1">163</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Top Referrer</p>
          <p className="text-xl font-bold text-[#E53935] mt-1">Dr. Gupta</p>
          <p className="text-[10px] text-white/30">45 studies</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Revenue from Referrals</p>
          <p className="text-xl font-bold text-[#00C853] mt-1">₹6.2L</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Revenue by Referring Doctor</p>
          <div className="space-y-2">
            {REFERRAL_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-[11px] text-white/50 w-28 shrink-0">{d.name}</span>
                <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-[#E53935]" style={{ width: `${(d.studies / REFERRAL_DATA[0].studies) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/40 w-16 text-right">{d.studies} studies</span>
                <span className="text-[10px] text-white/30 w-16 text-right">₹{(d.revenue / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Referral Channel Distribution</p>
          <div className="flex items-center justify-center">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CHANNEL_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {CHANNEL_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 justify-center mt-3">
            {CHANNEL_DATA.map(c => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] text-white/40">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
        <p className="text-xs font-semibold text-white mb-3">Top Referrers — Studies Volume</p>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={REFERRAL_DATA} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
            <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="studies" fill="#E53935" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
