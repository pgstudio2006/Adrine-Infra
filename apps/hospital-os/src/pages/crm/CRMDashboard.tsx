import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCrmPlatform } from '@/hooks/useCrmPlatform';
import { IncludedCrmScope } from '@/components/crm/IncludedCrmScope';

type InquiryChannel = 'Walk-in' | 'Phone' | 'Website';
type InquiryStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted';

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  channel: InquiryChannel;
  source: string;
  status: InquiryStatus;
  notes: string;
};

const INQUIRY_FLOW: InquiryStatus[] = ['New', 'Contacted', 'Qualified', 'Converted'];

export default function CRMDashboard() {
  const { leads, summary, campaigns, lifecycle } = useCrmPlatform();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    channel: 'Walk-in' as InquiryChannel,
    source: 'Camp',
    notes: '',
  });
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    { id: 'IQ-1101', name: 'Amit Kumar', phone: '98XXXX1001', channel: 'Walk-in', source: 'Camp', status: 'Contacted', notes: 'Knee pain package inquiry' },
    { id: 'IQ-1102', name: 'Priya S', phone: '97XXXX2202', channel: 'Website', source: 'Corporate', status: 'Qualified', notes: 'Wants Saturday consultation' },
  ]);

  const addInquiry = () => {
    if (!form.name.trim()) return;
    setInquiries((prev) => [
      {
        id: `IQ-${1100 + prev.length + 1}`,
        name: form.name.trim(),
        phone: form.phone.trim() || 'Not provided',
        channel: form.channel,
        source: form.source.trim() || 'Direct',
        status: 'New',
        notes: form.notes.trim() || 'Inquiry captured',
      },
      ...prev,
    ]);
    setForm({ name: '', phone: '', channel: 'Walk-in', source: 'Camp', notes: '' });
  };

  const advanceInquiry = (id: string) => {
    setInquiries((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const idx = INQUIRY_FLOW.indexOf(row.status);
        return { ...row, status: INQUIRY_FLOW[Math.min(idx + 1, INQUIRY_FLOW.length - 1)] };
      }),
    );
  };

  const pipelineRows = useMemo(
    () =>
      leads.slice(0, 8).map((lead) => ({
        patient: lead.fullName,
        pipeline: `${lead.stage.replace(/_/g, ' ')} -> consultation -> counsellor -> package -> payment -> treatment`,
        source: lead.channel ?? 'Direct',
      })),
    [leads],
  );

  const referralRows = useMemo(
    () =>
      inquiries.slice(0, 5).map((row) => ({
        patient: row.name,
        referral: row.source,
        type: row.source.toLowerCase().includes('doctor') ? 'Doctor Referral' : 'Patient/Source Referral',
      })),
    [inquiries],
  );

  const dashboardCards = [
    { label: 'Lead Dashboard', value: String(summary?.openLeads ?? inquiries.length) },
    { label: 'Counsellor Dashboard', value: `${leads.filter((l) => l.stage === 'counseling').length || 0}` },
    { label: 'Conversion Dashboard', value: `${inquiries.filter((i) => i.status === 'Converted').length}` },
    { label: 'Referral Dashboard', value: `${referralRows.length}` },
    { label: 'Revenue Dashboard', value: `${leads.reduce((sum, l) => sum + (l.valueCents ?? 0), 0) / 100_000 || 0}L` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Adrine CRM (Included in HMS Package)</h1>
        <p className="text-sm text-muted-foreground">Complete in-HMS CRM + counselling operations workspace</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {dashboardCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead & Inquiry Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Patient name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <select className="rounded-lg border px-3 py-2 text-sm" value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as InquiryChannel }))}>
                <option>Walk-in</option>
                <option>Phone</option>
                <option>Website</option>
              </select>
              <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Lead source (Camp/Corporate/Doctor)" value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} />
            </div>
            <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} placeholder="Lead notes / inquiry timeline note" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            <Button onClick={addInquiry} disabled={!form.name.trim()}>Register Inquiry</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inquiry Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.channel} / {row.source}</TableCell>
                    <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => advanceInquiry(row.id)}>Next</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Patient Pipeline + Package/Conversion</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Journey Flow</TableHead>
                  <TableHead>Lead Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelineRows.map((row, idx) => (
                  <TableRow key={`${row.patient}-${idx}`}>
                    <TableCell className="font-medium">{row.patient}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.pipeline}</TableCell>
                    <TableCell>{row.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Referral + WhatsApp + Analytics</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3 text-sm">
              WhatsApp automations live in CRM flow: appointment confirmation/reminder, follow-up/treatment reminder, feedback/review request.
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Referral Source</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referralRows.map((row, idx) => (
                  <TableRow key={`${row.patient}-${idx}`}>
                    <TableCell>{row.patient}</TableCell>
                    <TableCell>{row.referral}</TableCell>
                    <TableCell>{row.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Navayu specific analytics included: camp leads, corporate leads, spine/knee/shoulder categorization, treatment journey and outcome tracking.
            </div>
          </CardContent>
        </Card>
      </div>

      <IncludedCrmScope />
    </div>
  );
}
