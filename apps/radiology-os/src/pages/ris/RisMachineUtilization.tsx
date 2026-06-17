import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const MACHINES = [
  { name: 'MRI Suite 1', modality: 'MRI', status: 'In Use', utilization: 75, hoursUsed: 6, totalHours: 8, studies: 8 },
  { name: 'MRI Suite 2', modality: 'MRI', status: 'Available', utilization: 30, hoursUsed: 2.4, totalHours: 8, studies: 3 },
  { name: 'CT Suite 1', modality: 'CT Scan', status: 'In Use', utilization: 90, hoursUsed: 7.2, totalHours: 8, studies: 12 },
  { name: 'CT Suite 2', modality: 'CT Scan', status: 'Available', utilization: 45, hoursUsed: 3.6, totalHours: 8, studies: 5 },
  { name: 'X-Ray Room 1', modality: 'X-Ray', status: 'In Use', utilization: 80, hoursUsed: 6.4, totalHours: 8, studies: 18 },
  { name: 'X-Ray Room 2', modality: 'X-Ray', status: 'Maintenance', utilization: 0, hoursUsed: 0, totalHours: 8, studies: 0 },
  { name: 'US Room 1', modality: 'Ultrasound', status: 'In Use', utilization: 60, hoursUsed: 4.8, totalHours: 8, studies: 8 },
  { name: 'US Room 2', modality: 'Ultrasound', status: 'Available', utilization: 20, hoursUsed: 1.6, totalHours: 8, studies: 2 },
];

const HOURLY_TREND = [
  { hour: '8AM', mri: 1, ct: 2, xray: 3, usg: 1 },
  { hour: '9AM', mri: 1, ct: 2, xray: 4, usg: 2 },
  { hour: '10AM', mri: 2, ct: 2, xray: 3, usg: 2 },
  { hour: '11AM', mri: 1, ct: 2, xray: 3, usg: 1 },
  { hour: '12PM', mri: 0, ct: 1, xray: 1, usg: 0 },
  { hour: '2PM', mri: 1, ct: 2, xray: 3, usg: 2 },
  { hour: '3PM', mri: 1, ct: 1, xray: 2, usg: 1 },
  { hour: '4PM', mri: 1, ct: 1, xray: 1, usg: 1 },
];

const statusColor: Record<string, string> = {
  'In Use': 'bg-[#FFB300]/10 text-[#FFB300]',
  'Available': 'bg-[#00C853]/10 text-[#00C853]',
  'Maintenance': 'bg-[#E53935]/10 text-[#E53935]',
  'Offline': 'bg-white/5 text-white/30',
};

export default function RisMachineUtilization() {
  const avgUtilization = Math.round(MACHINES.filter(m => m.status !== 'Maintenance').reduce((s, m) => s + m.utilization, 0) / MACHINES.filter(m => m.status !== 'Maintenance').length);
  const totalStudies = MACHINES.reduce((s, m) => s + m.studies, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Machine Utilization</h1>
        <p className="text-sm text-white/40 mt-0.5">Equipment utilization tracking across all modalities</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Avg Utilization</p>
          <p className="text-xl font-bold text-white mt-1">{avgUtilization}%</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Studies</p>
          <p className="text-xl font-bold text-white mt-1">{totalStudies}</p>
        </div>
        <div className="bg-[#151922] rounded-lg border border-white/5 p-4">
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Down Machines</p>
          <p className="text-xl font-bold text-[#E53935] mt-1">{MACHINES.filter(m => m.status === 'Maintenance' || m.status === 'Offline').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Hourly Study Volume</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={HOURLY_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <Tooltip contentStyle={{ background: '#151922', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="mri" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ct" stroke="#E53935" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="xray" stroke="#00C853" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="usg" stroke="#FFB300" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#151922] rounded-xl border border-white/5 p-4">
          <p className="text-xs font-semibold text-white mb-3">Machine Status</p>
          <div className="space-y-2">
            {MACHINES.map(m => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="text-[10px] text-white/50 w-28 shrink-0">{m.name}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.utilization}%`, backgroundColor: m.utilization > 80 ? '#E53935' : m.utilization > 60 ? '#FFB300' : '#00C853' }} />
                </div>
                <span className="text-[10px] text-white/30 w-10 text-right">{m.utilization}%</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${statusColor[m.status]}`}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
