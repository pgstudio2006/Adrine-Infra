import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, IndianRupee, PieChart } from 'lucide-react';
import { useState } from 'react';

const REVENUE_SUMMARY = [
  { label: 'Total Revenue (MTD)', value: '₹1,24,50,000', change: '+12%' },
  { label: 'Total Expenses (MTD)', value: '₹78,30,000', change: '+8%' },
  { label: 'Net Profit (MTD)', value: '₹46,20,000', change: '+18%' },
  { label: 'Outstanding', value: '₹15,80,000', change: '-5%' },
];

const DEPT_REVENUE = [
  { dept: 'OPD', revenue: '₹32,50,000', percentage: 26 },
  { dept: 'IPD', revenue: '₹45,00,000', percentage: 36 },
  { dept: 'Pharmacy', revenue: '₹18,00,000', percentage: 15 },
  { dept: 'Laboratory', revenue: '₹15,00,000', percentage: 12 },
  { dept: 'Radiology', revenue: '₹8,50,000', percentage: 7 },
  { dept: 'Other', revenue: '₹5,50,000', percentage: 4 },
];

const COST_CENTERS = [
  { center: 'Staff Salaries', amount: '₹42,00,000', percentage: 54 },
  { center: 'Medical Supplies', amount: '₹12,50,000', percentage: 16 },
  { center: 'Equipment Maintenance', amount: '₹8,00,000', percentage: 10 },
  { center: 'Utilities', amount: '₹5,80,000', percentage: 7 },
  { center: 'Pharmacy Purchase', amount: '₹6,00,000', percentage: 8 },
  { center: 'Other', amount: '₹4,00,000', percentage: 5 },
];

const DOCTOR_REVENUE = [
  { doctor: 'Dr. Rajesh Mehta', consultations: 145, procedures: 12, totalRevenue: '₹8,75,000', share: '₹2,62,500', sharePercent: 30 },
  { doctor: 'Dr. Priya Sharma', consultations: 180, procedures: 5, totalRevenue: '₹6,20,000', share: '₹1,86,000', sharePercent: 30 },
  { doctor: 'Dr. Anil Kumar', consultations: 95, procedures: 18, totalRevenue: '₹9,50,000', share: '₹3,32,500', sharePercent: 35 },
  { doctor: 'Dr. Vikram Singh', consultations: 0, procedures: 85, totalRevenue: '₹12,00,000', share: '₹3,60,000', sharePercent: 30 },
];

export default function AdminFinance() {
  const [tab, setTab] = useState<'overview' | 'cost' | 'doctor'>('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Overview</h1>
        <p className="text-sm text-muted-foreground">Hospital financial performance & cost center analysis</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {REVENUE_SUMMARY.map(r => (
          <Card key={r.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="text-xl font-bold mt-1">{r.value}</p>
              <Badge variant={r.change.startsWith('+') ? 'default' : 'destructive'} className="text-xs mt-1">{r.change}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 border-b pb-1">
        {(['overview', 'cost', 'doctor'] as const).map(t => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'ghost'} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Revenue by Department' : t === 'cost' ? 'Cost Centers' : 'Doctor Revenue Sharing'}
          </Button>
        ))}
      </div>

      {tab === 'overview' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Department-wise Revenue (MTD)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {DEPT_REVENUE.map(d => (
              <div key={d.dept} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{d.dept}</span>
                  <span>{d.revenue} ({d.percentage}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${d.percentage}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'cost' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Expense Breakdown (MTD)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {COST_CENTERS.map(c => (
              <div key={c.center} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{c.center}</span>
                  <span>{c.amount} ({c.percentage}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-destructive/60 rounded-full" style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'doctor' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Doctor Revenue & Payout (MTD)</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Doctor</th>
                  <th className="pb-2 font-medium">Consultations</th>
                  <th className="pb-2 font-medium">Procedures</th>
                  <th className="pb-2 font-medium">Total Revenue</th>
                  <th className="pb-2 font-medium">Share %</th>
                  <th className="pb-2 font-medium">Payout</th>
                </tr>
              </thead>
              <tbody>
                {DOCTOR_REVENUE.map(d => (
                  <tr key={d.doctor} className="border-b last:border-0">
                    <td className="py-2 font-medium">{d.doctor}</td>
                    <td className="py-2">{d.consultations}</td>
                    <td className="py-2">{d.procedures}</td>
                    <td className="py-2">{d.totalRevenue}</td>
                    <td className="py-2"><Badge variant="outline">{d.sharePercent}%</Badge></td>
                    <td className="py-2 font-medium text-emerald-600">{d.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
