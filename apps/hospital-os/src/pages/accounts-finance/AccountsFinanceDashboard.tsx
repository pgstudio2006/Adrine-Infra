import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AfKpiGrid } from '@/components/accounts-finance/AfKpiGrid';
import { AfFeatureWorkspace } from '@/components/accounts-finance/AfFeatureWorkspace';
import {
  AF_AGING_BUCKETS,
  AF_DASHBOARD_CHART,
  AF_RECENT_ACTIVITY,
} from '@/lib/accounts-finance/demo-data';
import {
  AF_ROLE_DASHBOARDS,
  AF_SECTIONS,
} from '@/lib/accounts-finance/sections';

const fade = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04 },
});

export default function AccountsFinanceDashboard() {
  const section = AF_SECTIONS.dashboard;

  return (
    <div className="space-y-6 pb-8">
      <motion.div {...fade(0)}>
        <h1 className="text-2xl font-bold tracking-tight">{section.title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{section.subtitle}</p>
      </motion.div>

      <motion.div {...fade(1)}>
        <AfKpiGrid kpis={section.kpis} />
      </motion.div>

      <motion.div {...fade(2)} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {AF_ROLE_DASHBOARDS.map((dash) => {
          const Icon = dash.icon;
          return (
            <Link
              key={dash.label}
              to={dash.path}
              className="rounded-xl border bg-card p-3 hover:border-emerald-500/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-lg bg-emerald-500/10 text-emerald-700 p-1.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] font-semibold leading-tight">{dash.label}</p>
              </div>
            </Link>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div {...fade(3)} className="xl:col-span-2">
          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenue vs collections (7 days)</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={AF_DASHBOARD_CHART}>
                  <defs>
                    <linearGradient id="afRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" fill="url(#afRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="collections" stroke="#0ea5e9" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fade(4)}>
          <Card className="rounded-xl h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">AR aging</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AF_AGING_BUCKETS.map((b) => (
                <div key={b.bucket}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{b.bucket}</span>
                    <span className="font-medium tabular-nums">₹{(b.amount / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div {...fade(5)}>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent financial activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {AF_RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-xs border-b border-border/50 last:border-0 pb-2 last:pb-0">
                <span>{item.text}</span>
                <span className="text-muted-foreground shrink-0">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...fade(6)} className="space-y-3">
        <h2 className="text-sm font-semibold">Dashboard workspaces</h2>
        <AfFeatureWorkspace sectionId="dashboard" features={section.features} />
      </motion.div>
    </div>
  );
}
