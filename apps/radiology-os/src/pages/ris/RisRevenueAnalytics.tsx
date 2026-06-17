import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 280000, collected: 245000 },
  { month: 'Feb', revenue: 320000, collected: 290000 },
  { month: 'Mar', revenue: 350000, collected: 310000 },
  { month: 'Apr', revenue: 290000, collected: 260000 },
  { month: 'May', revenue: 380000, collected: 340000 },
  { month: 'Jun', revenue: 342500, collected: 310000 },
];

const MODALITY_REVENUE = [
  { name: 'MRI', value: 120000, color: '#6366f1' },
  { name: 'CT Scan', value: 98000, color: '#E53935' },
  { name: 'X-Ray', value: 45000, color: '#00C853' },
  { name: 'Ultrasound', value: 52000, color: '#FFB300' },
  { name: 'Mammography', value: 27500, color: '#2196F3' },
];

const DOCTOR_REVENUE = [
  { name: 'Dr. Iyer', revenue: 145000 },
  { name: 'Dr. Mehta', revenue: 98000 },
  { name: 'Dr. Nair', revenue: 62000 },
  { name: 'Dr. Sharma', revenue: 37500 },
];

export default function RisRevenueAnalytics() {
  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0);
  const totalCollected = REVENUE_DATA.reduce((s, d) => s + d.collected, 0);
  const outstanding = totalRevenue - totalCollected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Revenue Dashboard</h1>
        <p className="text-sm text-white/40 mt-0.5">Financial analytics — revenue by modality, doctor, and time period</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Revenue</p>
          <p className="text-xl font-bold text-white mt-1">₹{(totalRevenue / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-[#00C853] mt-0.5">Last 6 months</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Collected</p>
          <p className="text-xl font-bold text-[#00C853] mt-1">₹{(totalCollected / 1000).toFixed(0)}K</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Outstanding</p>
          <p className="text-xl font-bold text-[#E53935] mt-1">₹{(outstanding / 1000).toFixed(0)}K</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Monthly Revenue</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={REVENUE_DATA} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="revenue" fill="#E53935" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" fill="#00C853" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Revenue by Modality</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={MODALITY_REVENUE} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {MODALITY_REVENUE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
        <p className="text-xs font-semibold text-white mb-3">Revenue by Referring Doctor</p>
        <div className="space-y-2">
          {DOCTOR_REVENUE.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-[11px] text-white/50 w-24 shrink-0">{d.name}</span>
              <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-[#E53935]" style={{ width: `${(d.revenue / DOCTOR_REVENUE[0].revenue) * 100}%` }} />
              </div>
              <span className="text-[10px] text-white/40 w-16 text-right">₹{(d.revenue / 1000).toFixed(0)}K</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
