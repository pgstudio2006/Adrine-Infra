import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Plus, Search, Users, IndianRupee, Percent, FileText, Mail, Pencil, Trash2 } from 'lucide-react';

type SharingType = 'Percentage' | 'Fixed' | 'Mixed';
type PolicyStatus = 'Active' | 'Under Review' | 'Inactive';

interface SharingPolicy {
  id: string;
  doctor: string;
  department: string;
  type: SharingType;
  opdShare: string;
  ipdShare: string;
  surgeryShare: string;
  radiologyShare: string;
  referralShare: string;
  status: PolicyStatus;
  notes?: string;
}

type PolicyDraft = Omit<SharingPolicy, 'id'>;

const POLICY_STORAGE_KEY = 'adrine_doctor_sharing_policies';

const DEFAULT_SHARING_POLICIES: SharingPolicy[] = [
  {
    id: 'SP-001',
    doctor: 'Dr. Rajesh Sharma',
    department: 'Cardiology',
    type: 'Percentage',
    opdShare: '30%',
    ipdShare: '25%',
    surgeryShare: '35%',
    radiologyShare: '15%',
    referralShare: '10%',
    status: 'Active',
    notes: 'Standard cardiac consultant policy',
  },
  {
    id: 'SP-002',
    doctor: 'Dr. Priya Kumar',
    department: 'Orthopedics',
    type: 'Percentage',
    opdShare: '35%',
    ipdShare: '30%',
    surgeryShare: '40%',
    radiologyShare: '12%',
    referralShare: '15%',
    status: 'Active',
    notes: 'Includes implant case incentives',
  },
  {
    id: 'SP-003',
    doctor: 'Dr. Amit Patel',
    department: 'General Medicine',
    type: 'Fixed',
    opdShare: '₹300',
    ipdShare: '₹500',
    surgeryShare: '—',
    radiologyShare: '₹150',
    referralShare: '₹100',
    status: 'Active',
    notes: 'Fixed honorarium model',
  },
  {
    id: 'SP-004',
    doctor: 'Dr. Sunita Mishra',
    department: 'Gynecology',
    type: 'Percentage',
    opdShare: '28%',
    ipdShare: '22%',
    surgeryShare: '30%',
    radiologyShare: '10%',
    referralShare: '12%',
    status: 'Under Review',
    notes: 'Revising maternity package split',
  },
  {
    id: 'SP-005',
    doctor: 'Dr. Kavya Iyer',
    department: 'Radiology',
    type: 'Mixed',
    opdShare: '₹250',
    ipdShare: '20%',
    surgeryShare: '—',
    radiologyShare: '35%',
    referralShare: '8%',
    status: 'Active',
    notes: 'Radiology-first policy with scan incentive',
  },
];

const referralData = [
  { referrer: 'Dr. Mohan Rao', referred: 'Dr. Sharma', patient: 'Ramesh K.', service: 'Angiography', referralFee: 5000, date: '2026-03-05' },
  { referrer: 'Dr. Geeta Iyer', referred: 'Dr. Kumar', patient: 'Suresh P.', service: 'Knee Replacement', referralFee: 15000, date: '2026-03-04' },
  { referrer: 'Dr. Mohan Rao', referred: 'Dr. Patel', patient: 'Anita M.', service: 'OPD Consultation', referralFee: 100, date: '2026-03-06' },
  { referrer: 'Dr. Kamal Nath', referred: 'Dr. Mishra', patient: 'Lakshmi S.', service: 'C-Section', referralFee: 8000, date: '2026-03-03' },
];

const monthlySharing = [
  { month: 'Oct', total: 320000, hospital: 210000, doctors: 110000 },
  { month: 'Nov', total: 345000, hospital: 225000, doctors: 120000 },
  { month: 'Dec', total: 380000, hospital: 248000, doctors: 132000 },
  { month: 'Jan', total: 360000, hospital: 234000, doctors: 126000 },
  { month: 'Feb', total: 395000, hospital: 257000, doctors: 138000 },
  { month: 'Mar', total: 410000, hospital: 266000, doctors: 144000 },
];

function parsePercent(value: string): number | null {
  if (!value.includes('%')) return null;
  const parsed = Number.parseFloat(value.replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCurrency(value: string): number | null {
  if (!value.includes('₹')) return null;
  const parsed = Number.parseFloat(value.replace('₹', '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function createEmptyPolicyDraft(): PolicyDraft {
  return {
    doctor: '',
    department: '',
    type: 'Percentage',
    opdShare: '',
    ipdShare: '',
    surgeryShare: '',
    radiologyShare: '',
    referralShare: '',
    status: 'Active',
    notes: '',
  };
}

function getServiceRowsFromPolicies(policies: SharingPolicy[]) {
  const serviceBaseRevenue: Record<'OPD' | 'IPD' | 'Surgery' | 'Radiology' | 'Referral', number> = {
    OPD: 45000,
    IPD: 52000,
    Surgery: 180000,
    Radiology: 36000,
    Referral: 12000,
  };

  const serviceMap: Array<{ key: 'OPD' | 'IPD' | 'Surgery' | 'Radiology' | 'Referral'; label: string; shareKey: keyof SharingPolicy }> = [
    { key: 'OPD', label: 'OPD Consultation', shareKey: 'opdShare' },
    { key: 'IPD', label: 'IPD Consultation', shareKey: 'ipdShare' },
    { key: 'Surgery', label: 'Surgery', shareKey: 'surgeryShare' },
    { key: 'Radiology', label: 'Radiology Reporting', shareKey: 'radiologyShare' },
    { key: 'Referral', label: 'Referral Fee', shareKey: 'referralShare' },
  ];

  return policies.flatMap((policy) => {
    return serviceMap
      .map((service) => {
        const shareValue = policy[service.shareKey];
        if (!shareValue || shareValue === '—') {
          return null;
        }

        const revenue = serviceBaseRevenue[service.key];
        const pct = parsePercent(shareValue);
        const fixed = parseCurrency(shareValue);

        let doctorPayout = 0;
        let doctorSharePct = 0;

        if (pct !== null) {
          doctorSharePct = Math.max(0, Math.min(100, pct));
          doctorPayout = Math.round((revenue * doctorSharePct) / 100);
        } else if (fixed !== null) {
          doctorPayout = Math.max(0, fixed);
          doctorSharePct = Math.min(100, Math.round((doctorPayout / revenue) * 100));
        }

        return {
          service: `${service.label} (${policy.department})`,
          doctor: policy.doctor,
          hospitalShare: Math.max(0, 100 - doctorSharePct),
          doctorShare: doctorSharePct,
          amount: revenue,
          doctorPayout,
        };
      })
      .filter((row): row is {
        service: string;
        doctor: string;
        hospitalShare: number;
        doctorShare: number;
        amount: number;
        doctorPayout: number;
      } => row !== null);
  });
}

export default function AdminDoctorSharing() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | SharingType>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState<PolicyDraft>(createEmptyPolicyDraft());
  const [policies, setPolicies] = useState<SharingPolicy[]>(() => {
    const stored = localStorage.getItem(POLICY_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SHARING_POLICIES;
    }

    try {
      const parsed = JSON.parse(stored) as SharingPolicy[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_SHARING_POLICIES;
      }
      return parsed;
    } catch {
      return DEFAULT_SHARING_POLICIES;
    }
  });

  useEffect(() => {
    localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(policies));
  }, [policies]);

  const departments = useMemo(() => {
    return Array.from(new Set(policies.map((policy) => policy.department))).sort();
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return policies.filter((policy) => {
      const matchesSearch =
        query === ''
        || policy.doctor.toLowerCase().includes(query)
        || policy.department.toLowerCase().includes(query)
        || policy.id.toLowerCase().includes(query);
      const matchesType = typeFilter === 'all' || policy.type === typeFilter;
      const matchesDepartment = departmentFilter === 'all' || policy.department === departmentFilter;

      return matchesSearch && matchesType && matchesDepartment;
    });
  }, [departmentFilter, policies, search, typeFilter]);

  const serviceWiseSharing = useMemo(() => {
    return getServiceRowsFromPolicies(policies);
  }, [policies]);

  const totalDoctorPayout = useMemo(() => {
    return serviceWiseSharing.reduce((sum, row) => sum + row.doctorPayout, 0);
  }, [serviceWiseSharing]);

  const averageSharing = useMemo(() => {
    if (!serviceWiseSharing.length) return 0;
    const total = serviceWiseSharing.reduce((sum, row) => sum + row.doctorShare, 0);
    return total / serviceWiseSharing.length;
  }, [serviceWiseSharing]);

  const tdsData = useMemo(() => {
    const payoutByDoctor = new Map<string, number>();

    serviceWiseSharing.forEach((row) => {
      payoutByDoctor.set(row.doctor, (payoutByDoctor.get(row.doctor) || 0) + row.doctorPayout);
    });

    return Array.from(payoutByDoctor.entries()).map(([doctor, grossSharing]) => {
      const tdsAmount = Math.round(grossSharing * 0.1);
      return {
        doctor,
        grossSharing,
        tdsRate: '10%',
        tdsAmount,
        netPayable: grossSharing - tdsAmount,
        quarter: 'Q4 FY2025-26',
      };
    });
  }, [serviceWiseSharing]);

  const tdsTotal = useMemo(() => {
    return tdsData.reduce((sum, row) => sum + row.tdsAmount, 0);
  }, [tdsData]);

  function openNewPolicyDialog() {
    setEditingPolicyId(null);
    setPolicyDraft(createEmptyPolicyDraft());
    setPolicyDialogOpen(true);
  }

  function openEditPolicyDialog(policy: SharingPolicy) {
    setEditingPolicyId(policy.id);
    setPolicyDraft({
      doctor: policy.doctor,
      department: policy.department,
      type: policy.type,
      opdShare: policy.opdShare,
      ipdShare: policy.ipdShare,
      surgeryShare: policy.surgeryShare,
      radiologyShare: policy.radiologyShare,
      referralShare: policy.referralShare,
      status: policy.status,
      notes: policy.notes || '',
    });
    setPolicyDialogOpen(true);
  }

  function getNextPolicyId() {
    const maxId = policies.reduce((max, policy) => {
      const number = Number.parseInt(policy.id.replace('SP-', ''), 10);
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);

    return `SP-${String(maxId + 1).padStart(3, '0')}`;
  }

  function savePolicy() {
    if (!policyDraft.doctor.trim()) {
      toast.error('Doctor name is required.');
      return;
    }

    if (!policyDraft.department.trim()) {
      toast.error('Department is required.');
      return;
    }

    const hasAtLeastOneShare = [
      policyDraft.opdShare,
      policyDraft.ipdShare,
      policyDraft.surgeryShare,
      policyDraft.radiologyShare,
      policyDraft.referralShare,
    ].some((value) => value.trim() && value.trim() !== '—');

    if (!hasAtLeastOneShare) {
      toast.error('Add at least one share value.');
      return;
    }

    const nextPolicy: SharingPolicy = {
      id: editingPolicyId || getNextPolicyId(),
      ...policyDraft,
      doctor: policyDraft.doctor.trim(),
      department: policyDraft.department.trim(),
      notes: policyDraft.notes?.trim() || '',
    };

    if (editingPolicyId) {
      setPolicies((current) => current.map((policy) => policy.id === editingPolicyId ? nextPolicy : policy));
      toast.success('Policy updated.');
    } else {
      setPolicies((current) => [nextPolicy, ...current]);
      toast.success('Policy created.');
    }

    setPolicyDialogOpen(false);
  }

  function removePolicy(id: string) {
    setPolicies((current) => current.filter((policy) => policy.id !== id));
    toast.success('Policy removed.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Doctor Revenue Sharing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create your own sharing policies for any department, including radiology doctors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-sm"><Mail className="w-4 h-4" />Email Statements</Button>
          <Button variant="outline" className="gap-2 text-sm"><Download className="w-4 h-4" />Export</Button>
          <Button className="gap-2 text-sm" onClick={openNewPolicyDialog}><Plus className="w-4 h-4" />New Policy</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Doctor Payouts', value: `₹${totalDoctorPayout.toLocaleString('en-IN')}`, icon: IndianRupee, sub: 'Estimated from active policies' },
          { label: 'Active Policies', value: String(policies.length), icon: Users, sub: `${policies.filter((policy) => policy.status === 'Under Review').length} under review` },
          { label: 'Avg Sharing %', value: `${averageSharing.toFixed(1)}%`, icon: Percent, sub: 'Across mapped services' },
          { label: 'TDS Deducted', value: `₹${tdsTotal.toLocaleString('en-IN')}`, icon: FileText, sub: 'Q4 FY2025-26' },
        ].map((summary) => (
          <Card key={summary.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{summary.value}</p>
                <p className="text-xs text-muted-foreground">{summary.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{summary.sub}</p>
              </div>
              <summary.icon className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">Sharing Policies</TabsTrigger>
          <TabsTrigger value="service-wise">Service-Wise</TabsTrigger>
          <TabsTrigger value="referral">Referral Sharing</TabsTrigger>
          <TabsTrigger value="tds">TDS Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search doctors, policy id, or department..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | SharingType)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Percentage">Percentage</SelectItem>
                <SelectItem value="Fixed">Fixed Amount</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department} value={department}>{department}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy ID</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>OPD Share</TableHead>
                  <TableHead>IPD Share</TableHead>
                  <TableHead>Surgery Share</TableHead>
                  <TableHead>Radiology Share</TableHead>
                  <TableHead>Referral Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">
                      No policies found for current filters.
                    </TableCell>
                  </TableRow>
                ) : filteredPolicies.map((policy) => (
                  <TableRow key={policy.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{policy.id}</TableCell>
                    <TableCell className="font-medium">{policy.doctor}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{policy.department}</TableCell>
                    <TableCell>
                      <Badge variant={policy.type === 'Percentage' ? 'default' : policy.type === 'Fixed' ? 'secondary' : 'outline'} className="text-xs">
                        {policy.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{policy.opdShare || '—'}</TableCell>
                    <TableCell className="font-medium">{policy.ipdShare || '—'}</TableCell>
                    <TableCell className="font-medium">{policy.surgeryShare || '—'}</TableCell>
                    <TableCell className="font-medium">{policy.radiologyShare || '—'}</TableCell>
                    <TableCell className="font-medium">{policy.referralShare || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={policy.status === 'Active' ? 'default' : 'secondary'} className="text-xs">{policy.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditPolicyDialog(policy)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removePolicy(policy.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="service-wise" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Hospital %</TableHead>
                  <TableHead>Doctor %</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Doctor Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceWiseSharing.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No service mapping available for current policies.</TableCell>
                  </TableRow>
                ) : serviceWiseSharing.map((serviceRow, index) => (
                  <TableRow key={`${serviceRow.doctor}-${serviceRow.service}-${index}`}>
                    <TableCell className="font-medium">{serviceRow.service}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{serviceRow.doctor}</TableCell>
                    <TableCell>{serviceRow.hospitalShare}%</TableCell>
                    <TableCell className="font-medium">{serviceRow.doctorShare}%</TableCell>
                    <TableCell className="text-right">₹{serviceRow.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-medium">₹{serviceRow.doctorPayout.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="referral" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referring Doctor</TableHead>
                  <TableHead>Referred To</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Referral Fee</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralData.map((referral, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{referral.referrer}</TableCell>
                    <TableCell className="text-muted-foreground">{referral.referred}</TableCell>
                    <TableCell>{referral.patient}</TableCell>
                    <TableCell>{referral.service}</TableCell>
                    <TableCell className="text-right font-medium">₹{referral.referralFee.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{referral.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="tds" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">TDS Report — Q4 FY2025-26</h3>
            <Button variant="outline" size="sm" className="gap-1 text-xs"><Download className="w-3 h-3" />Download TDS Certificate</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="text-right">Gross Sharing</TableHead>
                  <TableHead>TDS Rate</TableHead>
                  <TableHead className="text-right">TDS Amount</TableHead>
                  <TableHead className="text-right">Net Payable</TableHead>
                  <TableHead>Quarter</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tdsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payout records available.</TableCell>
                  </TableRow>
                ) : tdsData.map((tdsRow, index) => (
                  <TableRow key={`${tdsRow.doctor}-${index}`}>
                    <TableCell className="font-medium">{tdsRow.doctor}</TableCell>
                    <TableCell className="text-right">₹{tdsRow.grossSharing.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{tdsRow.tdsRate}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">₹{tdsRow.tdsAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-bold">₹{tdsRow.netPayable.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{tdsRow.quarter}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Revenue Split (Hospital vs Doctor)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlySharing}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Bar dataKey="hospital" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} name="Hospital" />
                <Bar dataKey="doctors" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Doctors" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicyId ? 'Edit Sharing Policy' : 'Create Sharing Policy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Doctor Name</Label>
                <Input
                  value={policyDraft.doctor}
                  onChange={(event) => setPolicyDraft((current) => ({ ...current, doctor: event.target.value }))}
                  placeholder="Dr. Example"
                />
              </div>
              <div className="space-y-2">
                <Label>Department (Radiology allowed)</Label>
                <Input
                  value={policyDraft.department}
                  onChange={(event) => setPolicyDraft((current) => ({ ...current, department: event.target.value }))}
                  placeholder="Radiology / Cardiology / Any custom"
                />
              </div>
              <div className="space-y-2">
                <Label>Policy Type</Label>
                <Select
                  value={policyDraft.type}
                  onValueChange={(value) => setPolicyDraft((current) => ({ ...current, type: value as SharingType }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={policyDraft.status}
                  onValueChange={(value) => setPolicyDraft((current) => ({ ...current, status: value as PolicyStatus }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>OPD Share</Label>
                <Input
                  value={policyDraft.opdShare}
                  onChange={(event) => setPolicyDraft((current) => ({ ...current, opdShare: event.target.value }))}
                  placeholder="30% or ₹300"
                />
              </div>
              <div className="space-y-2">
                <Label>IPD Share</Label>
                <Input
                  value={policyDraft.ipdShare}
                  onChange={(event) => setPolicyDraft((current) => ({ ...current, ipdShare: event.target.value }))}
                  placeholder="25% or ₹500"
                />
              </div>
              <div className="space-y-2">
                <Label>Surgery Share</Label>
                <Input
                  value={policyDraft.surgeryShare}
                  onChange={(event) => setPolicyDraft((current) => ({ ...current, surgeryShare: event.target.value }))}
                  placeholder="40% or ₹7000"
                />
              </div>
              <div className="space-y-2">
                <Label>Radiology Share</Label>
                <Input
                  value={policyDraft.radiologyShare}
                  onChange={(event) => setPolicyDraft((current) => ({ ...current, radiologyShare: event.target.value }))}
                  placeholder="35% or ₹1500"
                />
              </div>
              <div className="space-y-2">
                <Label>Referral Share</Label>
                <Input
                  value={policyDraft.referralShare}
                  onChange={(event) => setPolicyDraft((current) => ({ ...current, referralShare: event.target.value }))}
                  placeholder="10% or ₹100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={policyDraft.notes || ''}
                onChange={(event) => setPolicyDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Any custom policy rule or exception"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPolicyDialogOpen(false)}>Cancel</Button>
              <Button onClick={savePolicy}>{editingPolicyId ? 'Update Policy' : 'Create Policy'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
