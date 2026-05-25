import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Download, Building2, IndianRupee, FileSpreadsheet, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useBillingTpaChargesData } from '@/hooks/useBillingDeptData';
import { BillingDeptShell } from '@/components/billing/BillingDeptShell';

const tpaProviders = [
  { id: 'TPA-001', name: 'Star Health TPA', type: 'Insurance', totalServices: 145, lastUpdated: '2026-02-15', status: 'Active' },
  { id: 'TPA-002', name: 'Medi Assist TPA', type: 'Insurance', totalServices: 138, lastUpdated: '2026-01-20', status: 'Active' },
  { id: 'TPA-003', name: 'ICICI Lombard', type: 'Insurance', totalServices: 152, lastUpdated: '2026-03-01', status: 'Active' },
  { id: 'TPA-004', name: 'Infosys Ltd.', type: 'Corporate', totalServices: 95, lastUpdated: '2026-02-28', status: 'Active' },
  { id: 'TPA-005', name: 'Wipro Technologies', type: 'Corporate', totalServices: 88, lastUpdated: '2026-02-10', status: 'Active' },
  { id: 'TPA-006', name: 'PMJAY / Ayushman', type: 'Government', totalServices: 120, lastUpdated: '2026-01-05', status: 'Active' },
  { id: 'TPA-007', name: 'CGHS', type: 'Government', totalServices: 110, lastUpdated: '2025-12-20', status: 'Under Review' },
];

const chargeComparison = [
  { service: 'OPD Consultation (General)', general: 500, starHealth: 450, mediAssist: 400, infosys: 350, pmjay: 300 },
  { service: 'OPD Consultation (Specialist)', general: 1000, starHealth: 900, mediAssist: 850, infosys: 700, pmjay: 500 },
  { service: 'ICU Charges (per day)', general: 8000, starHealth: 7000, mediAssist: 6500, infosys: 6000, pmjay: 4500 },
  { service: 'General Ward (per day)', general: 2500, starHealth: 2200, mediAssist: 2000, infosys: 1800, pmjay: 1500 },
  { service: 'Semi-Private Room (per day)', general: 4000, starHealth: 3500, mediAssist: 3200, infosys: 3000, pmjay: 2500 },
  { service: 'ECG', general: 500, starHealth: 450, mediAssist: 400, infosys: 400, pmjay: 300 },
  { service: 'Echo Cardiogram', general: 3000, starHealth: 2700, mediAssist: 2500, infosys: 2200, pmjay: 1800 },
  { service: 'CT Scan (Head)', general: 4500, starHealth: 4000, mediAssist: 3800, infosys: 3500, pmjay: 2800 },
  { service: 'MRI (Brain)', general: 8000, starHealth: 7200, mediAssist: 6800, infosys: 6500, pmjay: 5000 },
  { service: 'CBC', general: 400, starHealth: 350, mediAssist: 300, infosys: 300, pmjay: 200 },
  { service: 'Appendectomy (package)', general: 45000, starHealth: 40000, mediAssist: 38000, infosys: 35000, pmjay: 25000 },
  { service: 'C-Section (package)', general: 85000, starHealth: 75000, mediAssist: 70000, infosys: 65000, pmjay: 50000 },
];

const packageRates = [
  { pkg: 'Normal Delivery', general: 35000, starHealth: 30000, mediAssist: 28000, pmjay: 20000 },
  { pkg: 'C-Section', general: 85000, starHealth: 75000, mediAssist: 70000, pmjay: 50000 },
  { pkg: 'Appendectomy', general: 45000, starHealth: 40000, mediAssist: 38000, pmjay: 25000 },
  { pkg: 'Knee Replacement', general: 250000, starHealth: 220000, mediAssist: 200000, pmjay: 150000 },
  { pkg: 'Cataract Surgery', general: 35000, starHealth: 30000, mediAssist: 28000, pmjay: 20000 },
  { pkg: 'Hernia Repair', general: 55000, starHealth: 48000, mediAssist: 45000, pmjay: 30000 },
];

export default function BillingTPACharges() {
  const [search, setSearch] = useState('');
  const { data: live, platformOn } = useBillingTpaChargesData();

  const providers = useMemo(() => {
    if (!platformOn || !live?.providers?.length) return tpaProviders;
    return (live.providers as { code: string; name: string; type: string; status: string }[]).map((p) => ({
      id: p.code,
      name: p.name,
      type: p.type,
      totalServices: live.serviceRates?.length ?? 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: p.status,
    }));
  }, [platformOn, live]);

  const rates = useMemo(() => {
    if (!platformOn || !live?.serviceRates?.length) return chargeComparison;
    return (live.serviceRates as { service: string; general: number; rates: Record<string, number> }[]).map((r) => ({
      service: r.service,
      general: r.general,
      starHealth: r.rates.star_health ?? r.general,
      mediAssist: r.rates.medi_assist ?? r.general,
      infosys: r.rates.infosys ?? r.general,
      pmjay: r.rates.pmjay ?? r.general,
    }));
  }, [platformOn, live]);

  return (
    <BillingDeptShell
      title="TPA / Corporate Charge Lists"
      subtitle="Manage different rate cards per TPA, corporate client, and government scheme"
      gateFocus="GAP-007"
      showPlatformStrip={false}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export All</Button>
          <Button className="gap-2 text-sm"><Plus className="w-4 h-4" />New Rate Card</Button>
        </div>
      }
    >

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TPA Partners', value: '4', icon: Shield, sub: 'Insurance TPAs' },
          { label: 'Corporate Clients', value: '2', icon: Building2, sub: 'Active contracts' },
          { label: 'Govt. Schemes', value: '2', icon: FileSpreadsheet, sub: 'PMJAY, CGHS' },
          { label: 'Avg Discount', value: '18.5%', icon: IndianRupee, sub: 'Off general rates' },
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

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">TPA/Corporate List</TabsTrigger>
          <TabsTrigger value="comparison">Rate Comparison</TabsTrigger>
          <TabsTrigger value="packages">Package Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search providers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Provider Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Services Mapped</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tpaProviders.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <Badge variant={p.type === 'Insurance' ? 'default' : p.type === 'Corporate' ? 'secondary' : 'outline'} className="text-xs">{p.type}</Badge>
                    </TableCell>
                    <TableCell>{p.totalServices}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.lastUpdated}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'Active' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs">View Rates</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <Card className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10">Service</TableHead>
                  <TableHead className="text-right">General</TableHead>
                  <TableHead className="text-right">Star Health</TableHead>
                  <TableHead className="text-right">Medi Assist</TableHead>
                  <TableHead className="text-right">Infosys</TableHead>
                  <TableHead className="text-right">PMJAY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargeComparison.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10">{c.service}</TableCell>
                    <TableCell className="text-right font-bold">₹{c.general.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{c.starHealth.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{c.mediAssist.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{c.infosys.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">₹{c.pmjay.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-right">General</TableHead>
                  <TableHead className="text-right">Star Health</TableHead>
                  <TableHead className="text-right">Medi Assist</TableHead>
                  <TableHead className="text-right">PMJAY</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageRates.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.pkg}</TableCell>
                    <TableCell className="text-right font-bold">₹{p.general.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{p.starHealth.toLocaleString()}</TableCell>
                    <TableCell className="text-right">₹{p.mediAssist.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">₹{p.pmjay.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </BillingDeptShell>
  );
}
