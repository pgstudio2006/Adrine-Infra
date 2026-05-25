import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Download, FileText, Package, IndianRupee, 
  TrendingUp, AlertTriangle, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

const MONTHLY_CONSUMPTION = [
  { month: 'Sep', value: 38 },
  { month: 'Oct', value: 42 },
  { month: 'Nov', value: 36 },
  { month: 'Dec', value: 31 },
  { month: 'Jan', value: 45 },
  { month: 'Feb', value: 48 },
  { month: 'Mar', value: 18 },
];

const CATEGORY_DIST = [
  { name: 'Medical Consumables', value: 35, color: 'hsl(var(--foreground))' },
  { name: 'Surgical Supplies', value: 25, color: 'hsl(var(--muted-foreground))' },
  { name: 'Lab Reagents', value: 18, color: 'hsl(var(--info))' },
  { name: 'Pharmacy Stock', value: 12, color: 'hsl(var(--success))' },
  { name: 'Others', value: 10, color: 'hsl(var(--border))' },
];

const PURCHASE_TREND = [
  { month: 'Sep', amount: 12.5 },
  { month: 'Oct', amount: 15.2 },
  { month: 'Nov', amount: 11.8 },
  { month: 'Dec', amount: 9.4 },
  { month: 'Jan', amount: 14.6 },
  { month: 'Feb', amount: 16.1 },
];

const REPORT_TYPES = [
  { label: 'Current Stock Report', description: 'Complete inventory with stock levels', icon: Package, count: 'Live' },
  { label: 'Stock Movement Report', description: 'All receipts and issues', icon: TrendingUp, count: '342 entries' },
  { label: 'Expiry Report', description: 'Items expiring within 90 days', icon: AlertTriangle, count: '18 items' },
  { label: 'Purchase Expenditure', description: 'Monthly procurement spend', icon: IndianRupee, count: '₹16.1L' },
  { label: 'Department Consumption', description: 'Usage by department', icon: BarChart3, count: '8 depts' },
  { label: 'Inventory Valuation', description: 'Total stock value analysis', icon: FileText, count: '₹48.2L' },
  { label: 'Audit Trail', description: 'All inventory operations logged', icon: Calendar, count: '1,247 logs' },
  { label: 'Supplier Performance', description: 'Delivery & quality metrics', icon: TrendingUp, count: '6 suppliers' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryReports() {
  return (
    <OperationsModulePage module="inventory" layout="list" title="Inventory reports" subtitle="Operational and financial inventory analytics" actions={<Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export all</Button>}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Monthly Consumption (₹ Lakhs)</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MONTHLY_CONSUMPTION}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Stock by Category</span>
              </div>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={CATEGORY_DIST} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                      {CATEGORY_DIST.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {CATEGORY_DIST.map(c => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-xs">{c.name}</span>
                      </div>
                      <span className="text-xs font-mono font-semibold">{c.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Purchase Trend */}
      <motion.div variants={item}>
        <Card className="border-border/60">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Purchase Expenditure Trend (₹ Lakhs)</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={PURCHASE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Types Grid */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Available Reports</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {REPORT_TYPES.map(r => (
            <Card key={r.label} className="border-border/60 hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <r.icon className="h-5 w-5 mb-3 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.description}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                  <Badge className="bg-muted text-muted-foreground text-[10px]">{r.count}</Badge>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1"><Download className="h-3 w-3" /> Export</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
      </motion.div>
    </OperationsModulePage>
  );
}
