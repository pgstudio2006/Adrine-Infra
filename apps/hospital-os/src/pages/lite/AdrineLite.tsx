import { FormEvent, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppSelect } from '@/components/ui/app-select';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  CreditCard,
  IndianRupee,
  Phone,
  Plus,
  ReceiptText,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

type LiteCategory = 'general' | 'corporate' | 'insurance' | 'government' | 'vip';
type LiteVisitType = 'OPD' | 'IPD';
type LitePaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

interface LitePatient {
  id: string;
  name: string;
  phone: string;
  category: LiteCategory;
  visitType: LiteVisitType;
  createdAt: string;
}

interface LiteBill {
  id: string;
  patientId: string;
  patientName: string;
  patientCategory: LiteCategory;
  service: string;
  amount: number;
  paymentMode: LitePaymentMode;
  createdAt: string;
}

const STORAGE_KEY = 'adrine_lite_records';

const CATEGORY_OPTIONS: Array<{ value: LiteCategory; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'government', label: 'Government Scheme' },
  { value: 'vip', label: 'VIP' },
];

const SERVICE_OPTIONS = [
  'Registration Fee',
  'OPD Consultation',
  'IPD Admission Deposit',
  'Nursing Charge',
  'Doctor Visit',
  'Basic Lab Test',
  'Pharmacy Sale',
  'Procedure Charge',
];

const PAYMENT_OPTIONS: LitePaymentMode[] = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

const categoryTone: Record<LiteCategory, string> = {
  general: 'bg-muted text-muted-foreground',
  corporate: 'bg-info/10 text-info border-info/20',
  insurance: 'bg-primary/10 text-primary border-primary/20',
  government: 'bg-success/10 text-success border-success/20',
  vip: 'bg-warning/10 text-warning border-warning/20',
};

const createId = (prefix: string) => {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(2, 12);
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${stamp}-${random}`;
};

const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

function readStoredRecords(): { patients: LitePatient[]; bills: LiteBill[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { patients: [], bills: [] };
    const parsed = JSON.parse(raw);
    return {
      patients: Array.isArray(parsed?.patients) ? parsed.patients : [],
      bills: Array.isArray(parsed?.bills) ? parsed.bills : [],
    };
  } catch {
    return { patients: [], bills: [] };
  }
}

export default function AdrineLite() {
  const [records, setRecords] = useState(readStoredRecords);
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    category: 'general' as LiteCategory,
    visitType: 'OPD' as LiteVisitType,
  });
  const [billForm, setBillForm] = useState({
    patientId: '',
    service: SERVICE_OPTIONS[0],
    amount: '',
    paymentMode: 'UPI' as LitePaymentMode,
  });

  const persistRecords = (next: { patients: LitePatient[]; bills: LiteBill[] }) => {
    setRecords(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const todayPatients = useMemo(
    () => records.patients.filter((patient) => isToday(patient.createdAt)),
    [records.patients],
  );

  const todayBills = useMemo(
    () => records.bills.filter((bill) => isToday(bill.createdAt)),
    [records.bills],
  );

  const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.amount, 0);

  const categoryCounts = CATEGORY_OPTIONS.map((category) => ({
    ...category,
    count: todayPatients.filter((patient) => patient.category === category.value).length,
  }));

  const selectedPatient = records.patients.find((patient) => patient.id === billForm.patientId);

  const handlePatientSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = patientForm.name.trim();
    const phone = patientForm.phone.trim();

    if (!name || !phone) {
      toast.error('Patient name and phone are required.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10 digit Indian phone number.');
      return;
    }

    const patient: LitePatient = {
      id: createId('LPT'),
      name,
      phone,
      category: patientForm.category,
      visitType: patientForm.visitType,
      createdAt: new Date().toISOString(),
    };

    persistRecords({
      patients: [patient, ...records.patients],
      bills: records.bills,
    });
    setPatientForm({ name: '', phone: '', category: 'general', visitType: 'OPD' });
    setBillForm((current) => ({ ...current, patientId: patient.id }));
    toast.success('Patient registered in Adrine Lite.');
  };

  const handleBillSubmit = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(billForm.amount);

    if (!selectedPatient) {
      toast.error('Select a registered patient first.');
      return;
    }

    if (!billForm.service || !Number.isFinite(amount) || amount <= 0) {
      toast.error('Select service and enter a valid amount.');
      return;
    }

    const bill: LiteBill = {
      id: createId('LBill'),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientCategory: selectedPatient.category,
      service: billForm.service,
      amount,
      paymentMode: billForm.paymentMode,
      createdAt: new Date().toISOString(),
    };

    persistRecords({
      patients: records.patients,
      bills: [bill, ...records.bills],
    });
    setBillForm({ patientId: selectedPatient.id, service: SERVICE_OPTIONS[0], amount: '', paymentMode: 'UPI' });
    toast.success('Payment recorded.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Temporary Center Module
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">Adrine Lite</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Simple registration, basic billing, and category analytics for quick center operations.
          </p>
        </div>
        <div className="rounded-md border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Today:</span>{' '}
          <span className="font-semibold">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Patients Today</p>
                <p className="mt-1 text-3xl font-bold">{todayPatients.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue Today</p>
                <p className="mt-1 text-3xl font-bold">₹{todayRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success/10 text-success">
                <IndianRupee className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bills Today</p>
                <p className="mt-1 text-3xl font-bold">{todayBills.length}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-info/10 text-info">
                <ReceiptText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Category-Wise Count
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {categoryCounts.map((category) => (
              <div key={category.value} className="rounded-md border bg-background p-4">
                <Badge variant="outline" className={cn('border', categoryTone[category.value])}>
                  {category.label}
                </Badge>
                <p className="mt-3 text-2xl font-bold">{category.count}</p>
                <p className="text-xs text-muted-foreground">registered today</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" />
              Patient Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePatientSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={patientForm.name}
                    onChange={(event) => setPatientForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Patient full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={patientForm.phone}
                      onChange={(event) => setPatientForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="9876543210"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <AppSelect
                    value={patientForm.category}
                    onValueChange={(value) => setPatientForm((current) => ({ ...current, category: value as LiteCategory }))}
                    options={CATEGORY_OPTIONS}
                    className="w-full rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Visit Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['OPD', 'IPD'] as LiteVisitType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPatientForm((current) => ({ ...current, visitType: type }))}
                        className={cn(
                          'h-10 rounded-md border text-sm font-semibold transition-colors',
                          patientForm.visitType === type
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Register Patient
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Basic Billing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBillSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Patient</Label>
                <AppSelect
                  value={billForm.patientId || undefined}
                  onValueChange={(value) => setBillForm((current) => ({ ...current, patientId: value }))}
                  options={records.patients.map((patient) => ({
                    value: patient.id,
                    label: `${patient.name} · ${patient.phone}`,
                  }))}
                  placeholder={records.patients.length ? 'Select patient' : 'Register a patient first'}
                  disabled={!records.patients.length}
                  className="w-full rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Service</Label>
                  <AppSelect
                    value={billForm.service}
                    onValueChange={(value) => setBillForm((current) => ({ ...current, service: value }))}
                    options={SERVICE_OPTIONS.map((service) => ({ value: service, label: service }))}
                    className="w-full rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    value={billForm.amount}
                    onChange={(event) => setBillForm((current) => ({ ...current, amount: event.target.value }))}
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PAYMENT_OPTIONS.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setBillForm((current) => ({ ...current, paymentMode: mode }))}
                      className={cn(
                        'h-10 rounded-md border px-2 text-sm font-semibold transition-colors',
                        billForm.paymentMode === mode
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                <IndianRupee className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.patients.slice(0, 6).map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('border', categoryTone[patient.category])}>
                        {CATEGORY_OPTIONS.find((item) => item.value === patient.category)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.visitType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!records.patients.length && <p className="py-8 text-center text-sm text-muted-foreground">No Lite patients registered yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.bills.slice(0, 6).map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono text-xs">{bill.id}</TableCell>
                    <TableCell className="font-medium">{bill.patientName}</TableCell>
                    <TableCell>{bill.service}</TableCell>
                    <TableCell className="font-semibold">₹{bill.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{bill.paymentMode}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!records.bills.length && <p className="py-8 text-center text-sm text-muted-foreground">No Lite payments recorded yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
