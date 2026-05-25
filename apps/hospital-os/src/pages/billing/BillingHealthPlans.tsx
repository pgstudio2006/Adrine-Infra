import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, HeartPulse, Package, Users, IndianRupee } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useBillingHealthPlansData } from '@/hooks/useBillingDeptData';
import { BillingDeptShell } from '@/components/billing/BillingDeptShell';

const healthPlans = [
  { id: 'HCP-001', name: 'Basic Health Checkup', tests: 12, price: 1499, discountedPrice: 1199, category: 'Basic', ageGroup: 'All Ages', gender: 'Both', popularity: 145, status: 'Active' },
  { id: 'HCP-002', name: 'Executive Health Checkup', tests: 28, price: 4999, discountedPrice: 3999, category: 'Premium', ageGroup: '25-60', gender: 'Both', popularity: 89, status: 'Active' },
  { id: 'HCP-003', name: 'Cardiac Screening Package', tests: 15, price: 6500, discountedPrice: 5500, category: 'Specialty', ageGroup: '40+', gender: 'Both', popularity: 62, status: 'Active' },
  { id: 'HCP-004', name: 'Women\'s Wellness Package', tests: 20, price: 3500, discountedPrice: 2999, category: 'Specialty', ageGroup: '18-55', gender: 'Female', popularity: 78, status: 'Active' },
  { id: 'HCP-005', name: 'Diabetes Screening', tests: 10, price: 1999, discountedPrice: 1599, category: 'Basic', ageGroup: '30+', gender: 'Both', popularity: 112, status: 'Active' },
  { id: 'HCP-006', name: 'Senior Citizen Comprehensive', tests: 35, price: 8999, discountedPrice: 7499, category: 'Premium', ageGroup: '60+', gender: 'Both', popularity: 45, status: 'Active' },
  { id: 'HCP-007', name: 'Pre-Employment Checkup', tests: 8, price: 999, discountedPrice: 799, category: 'Basic', ageGroup: '18-40', gender: 'Both', popularity: 200, status: 'Active' },
  { id: 'HCP-008', name: 'Thyroid Profile Package', tests: 6, price: 1200, discountedPrice: 999, category: 'Specialty', ageGroup: 'All Ages', gender: 'Both', popularity: 95, status: 'Draft' },
];

const planTests: Record<string, string[]> = {
  'HCP-001': ['CBC', 'Blood Sugar (F/PP)', 'Lipid Profile', 'Liver Function', 'Kidney Function', 'Urine Routine', 'Thyroid (TSH)', 'Chest X-Ray', 'ECG', 'BMI Assessment', 'Blood Pressure', 'Eye Screening'],
  'HCP-002': ['All Basic Tests', 'HbA1c', 'Vitamin D', 'Vitamin B12', 'Iron Studies', 'Calcium', 'Phosphorus', 'Uric Acid', 'PSA (Male)', 'Mammography (Female)', 'USG Abdomen', 'Pulmonary Function', 'Stress Test (TMT)', 'Bone Density', 'Diet Consultation', 'Doctor Consultation'],
};

const bookingStats = [
  { month: 'Oct', basic: 45, premium: 18, specialty: 22 },
  { month: 'Nov', basic: 52, premium: 21, specialty: 25 },
  { month: 'Dec', basic: 38, premium: 15, specialty: 19 },
  { month: 'Jan', basic: 48, premium: 20, specialty: 28 },
  { month: 'Feb', basic: 55, premium: 24, specialty: 30 },
  { month: 'Mar', basic: 60, premium: 28, specialty: 32 },
];

export default function BillingHealthPlans() {
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>('HCP-001');
  const { data: live, platformOn } = useBillingHealthPlansData();

  const planRows = useMemo(() => {
    if (!platformOn || !live?.plans?.length) return healthPlans;
    return (live.plans as {
      code: string;
      name: string;
      tests: number;
      price: number;
      discountedPrice: number;
      category: string;
      ageGroup: string;
      gender: string;
      status: string;
    }[]).map((p) => ({
      id: p.code,
      name: p.name,
      tests: p.tests,
      price: p.price,
      discountedPrice: p.discountedPrice,
      category: p.category,
      ageGroup: p.ageGroup,
      gender: p.gender,
      popularity: 0,
      status: p.status === 'active' ? 'Active' : 'Draft',
    }));
  }, [platformOn, live]);

  const filtered = planRows.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <BillingDeptShell
      title="Health Checkup Plans"
      subtitle="Pre-defined health checkup packages for OPD patients"
      showPlatformStrip={false}
      actions={<Button className="gap-2 text-sm"><Plus className="w-4 h-4" />Create Plan</Button>}
    >

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Plans', value: '7', icon: Package, sub: '1 draft' },
          { label: 'Monthly Bookings', value: '120', icon: Users, sub: '+18% vs last month' },
          { label: 'Avg Plan Value', value: '₹3,213', icon: IndianRupee, sub: 'After discount' },
          { label: 'Top Plan', value: 'Pre-Employment', icon: HeartPulse, sub: '200 bookings' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
              </div>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">All Plans</TabsTrigger>
          <TabsTrigger value="details">Plan Details</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search plans..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan ID</TableHead>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-right">MRP</TableHead>
                  <TableHead className="text-right">Offer Price</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPlan(p.id)}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.category === 'Premium' ? 'default' : p.category === 'Specialty' ? 'secondary' : 'outline'} className="text-xs">{p.category}</Badge>
                    </TableCell>
                    <TableCell>{p.tests}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.ageGroup}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.gender}</TableCell>
                    <TableCell className="text-right line-through text-muted-foreground text-sm">₹{p.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">₹{p.discountedPrice.toLocaleString()}</TableCell>
                    <TableCell>{p.popularity}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'Active' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          {selectedPlan && planTests[selectedPlan] ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {planRows.find(p => p.id === selectedPlan)?.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Included tests and investigations</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {planTests[selectedPlan].map(test => (
                  <div key={test} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                    <span className="text-sm">{test}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <p>Select a plan from the "All Plans" tab to view details</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </BillingDeptShell>
  );
}
