import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Building2, Activity, Target, TrendingUp, Users, Stethoscope } from 'lucide-react';

type CampLead = {
  id: string;
  campName: string;
  location: string;
  date: string;
  leads: number;
  converted: number;
  specialty: string;
  status: 'completed' | 'upcoming' | 'active';
};

type BodyRegionLead = {
  region: string;
  totalLeads: number;
  converted: number;
  avgPackageValue: number;
  topProtocol: string;
};

type TreatmentJourney = {
  patient: string;
  condition: string;
  region: string;
  currentStage: string;
  protocol: string;
  startDate: string;
  outcome: 'improved' | 'stable' | 'pending' | 'completed';
};

const DEMO_CAMPS: CampLead[] = [
  { id: 'c-1', campName: 'Sector 14 Corporate Screening', location: 'Gurgaon - Sector 14', date: '2026-06-10', leads: 42, converted: 12, specialty: 'Knee / Spine', status: 'completed' },
  { id: 'c-2', campName: 'Golf Course Road Wellness Camp', location: 'Gurgaon - Golf Course Road', date: '2026-06-14', leads: 28, converted: 8, specialty: 'Spine / Shoulder', status: 'completed' },
  { id: 'c-3', campName: 'Pataudi Village Health Mela', location: 'Pataudi - Main Road', date: '2026-06-18', leads: 0, converted: 0, specialty: 'General MSK', status: 'upcoming' },
  { id: 'c-4', campName: 'DLF Phase 3 Corporate Tie-up', location: 'Gurgaon - DLF Phase 3', date: '2026-06-05', leads: 65, converted: 22, specialty: 'Sports / Knee', status: 'completed' },
  { id: 'c-5', campName: 'Sohna Road Factory Screening', location: 'Gurgaon - Sohna Road', date: '2026-06-01', leads: 38, converted: 11, specialty: 'Spine', status: 'completed' },
];

const DEMO_REGIONS: BodyRegionLead[] = [
  { region: 'Lumbar Spine', totalLeads: 89, converted: 34, avgPackageValue: 1200000, topProtocol: 'Spine Care Advanced' },
  { region: 'Knee', totalLeads: 76, converted: 28, avgPackageValue: 950000, topProtocol: 'Advanced Knee Package' },
  { region: 'Cervical Spine', totalLeads: 52, converted: 18, avgPackageValue: 850000, topProtocol: 'Spine Care Basic' },
  { region: 'Shoulder', totalLeads: 34, converted: 12, avgPackageValue: 1100000, topProtocol: 'Frozen Shoulder Protocol' },
  { region: 'Hip', totalLeads: 21, converted: 7, avgPackageValue: 1800000, topProtocol: 'Regenerative Premium' },
  { region: 'Sports Injury', totalLeads: 28, converted: 10, avgPackageValue: 1500000, topProtocol: 'Sports Injury Recovery' },
];

const DEMO_JOURNEYS: TreatmentJourney[] = [
  { patient: 'Rajesh Kumar', condition: 'L4-L5 Disc Herniation', region: 'Lumbar', currentStage: 'Protocol - Stage 2', protocol: 'Spine Care Advanced', startDate: '2026-05-15', outcome: 'improved' },
  { patient: 'Sunita Devi', condition: 'Knee OA Grade 3', region: 'Knee', currentStage: 'Counsellor - Package Sent', protocol: 'Advanced Knee Package', startDate: '2026-06-01', outcome: 'pending' },
  { patient: 'Amit Singh', condition: 'Frozen Shoulder', region: 'Shoulder', currentStage: 'Treatment - Session 4/8', protocol: 'Frozen Shoulder Protocol', startDate: '2026-05-20', outcome: 'improved' },
  { patient: 'Neha Gupta', condition: 'Cervical Spondylosis', region: 'Cervical', currentStage: 'Protocol - Stage 1', protocol: 'Spine Care Basic', startDate: '2026-06-05', outcome: 'stable' },
  { patient: 'Vikram Patel', condition: 'ACL Tear (Post-op)', region: 'Sports', currentStage: 'Treatment - Session 6/10', protocol: 'Sports Injury Recovery', startDate: '2026-04-28', outcome: 'completed' },
];

const campStatusStyles: Record<string, string> = { completed: 'bg-success/10 text-success', upcoming: 'bg-blue-500/10 text-blue-600', active: 'bg-warning/10 text-warning' };
const outcomeStyles: Record<string, string> = { improved: 'bg-success/10 text-success', stable: 'bg-blue-500/10 text-blue-600', pending: 'bg-warning/10 text-warning', completed: 'bg-emerald-500/10 text-emerald-600' };

function formatPrice(cents: number) { return `₹${(cents / 100000).toFixed(1)}L`; }

export default function NavayuCrm() {
  const [tab, setTab] = useState('overview');

  const stats = useMemo(() => ({
    totalCampLeads: DEMO_CAMPS.reduce((s, c) => s + c.leads, 0),
    totalConverted: DEMO_CAMPS.reduce((s, c) => s + c.converted, 0),
    totalRegionLeads: DEMO_REGIONS.reduce((s, r) => s + r.totalLeads, 0),
    activeJourneys: DEMO_JOURNEYS.filter(j => j.outcome !== 'completed').length,
  }), []);

  if (tab === 'overview') return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Navayu CRM — MSK Operations</h1><p className="text-sm text-muted-foreground">Camp lead tracking, body region analytics, treatment journey monitoring, and outcome tracking for Navayu Spine & Joint Care</p></div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[{ label: 'Camp Leads', value: stats.totalCampLeads, icon: MapPin }, { label: 'Converted', value: stats.totalConverted, icon: Target }, { label: 'Region Leads', value: stats.totalRegionLeads, icon: Activity }, { label: 'Active Journeys', value: stats.activeJourneys, icon: TrendingUp }].map(s => (
          <Card key={s.label}><CardContent className="pt-6"><div className="flex items-start justify-between"><div><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-1 text-2xl font-bold">{s.value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div></div></CardContent></Card>
        ))}
      </div>
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="camps">Camp Leads</TabsTrigger><TabsTrigger value="regions">Body Regions</TabsTrigger><TabsTrigger value="journeys">Treatment Journeys</TabsTrigger></TabsList></Tabs>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-lg">Recent Camp Leads</CardTitle></CardHeader><CardContent className="space-y-2">{DEMO_CAMPS.slice(0, 3).map(c => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">{c.campName}</p><p className="text-xs text-muted-foreground">{c.location} · {c.specialty}</p></div><div className="text-right"><p className="text-sm font-bold">{c.leads} leads</p><p className="text-xs text-success">{c.converted} converted</p></div></div>
        ))}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-lg">Top Body Regions</CardTitle></CardHeader><CardContent className="space-y-2">{DEMO_REGIONS.slice(0, 4).map(r => (
          <div key={r.region} className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">{r.region}</p><p className="text-xs text-muted-foreground">{r.topProtocol} · {formatPrice(r.avgPackageValue)} avg</p></div><div className="text-right"><p className="text-sm font-bold">{r.totalLeads}</p><p className="text-xs text-success">{r.converted} converted</p></div></div>
        ))}</CardContent></Card>
      </div>
    </div>
  );

  if (tab === 'camps') return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Camp Lead Tracking</h1><p className="text-sm text-muted-foreground">Track leads and conversions from health camps and corporate screenings</p></div></div>
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="camps">Camp Leads</TabsTrigger><TabsTrigger value="regions">Body Regions</TabsTrigger><TabsTrigger value="journeys">Treatment Journeys</TabsTrigger></TabsList></Tabs>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Camp</TableHead><TableHead>Location</TableHead><TableHead>Date</TableHead><TableHead>Specialty</TableHead><TableHead>Leads</TableHead><TableHead>Converted</TableHead><TableHead>Rate</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{DEMO_CAMPS.map(c => (
            <TableRow key={c.id}><TableCell className="font-medium">{c.campName}</TableCell><TableCell className="text-sm">{c.location}</TableCell><TableCell className="text-sm">{new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</TableCell><TableCell>{c.specialty}</TableCell><td className="text-sm font-medium">{c.leads}</td><td className="text-sm text-success font-medium">{c.converted}</td><td className="text-sm">{c.leads > 0 ? `${Math.round((c.converted / c.leads) * 100)}%` : '—'}</td><td><Badge variant="outline" className={`text-[10px] ${campStatusStyles[c.status] ?? ''}`}>{c.status}</Badge></td></TableRow>
          ))}</TableBody></Table>
      </CardContent></Card>
    </div>
  );

  if (tab === 'regions') return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Spine / Knee / Shoulder Lead Categorization</h1><p className="text-sm text-muted-foreground">Body region analytics with lead volume, conversion rates, and top protocol mapping</p></div>
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="camps">Camp Leads</TabsTrigger><TabsTrigger value="regions">Body Regions</TabsTrigger><TabsTrigger value="journeys">Treatment Journeys</TabsTrigger></TabsList></Tabs>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_REGIONS.map(r => (
          <Card key={r.region} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">{r.region}</CardTitle><Badge variant="outline" className="text-[10px]">{r.totalLeads} leads</Badge></div></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-lg font-bold">{r.converted}</p><p className="text-[10px] text-muted-foreground">Converted</p></div>
                <div className="rounded-lg bg-muted/50 p-2"><p className="text-lg font-bold">{Math.round((r.converted / r.totalLeads) * 100)}%</p><p className="text-[10px] text-muted-foreground">Conv. Rate</p></div>
              </div>
              <div className="text-sm"><p className="text-muted-foreground">Avg Package: <span className="font-medium text-foreground">{formatPrice(r.avgPackageValue)}</span></p><p className="text-muted-foreground">Top Protocol: <span className="font-medium text-foreground">{r.topProtocol}</span></p></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Treatment Journey Tracking</h1><p className="text-sm text-muted-foreground">Monitor patient treatment progress from registration through outcome</p></div>
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="camps">Camp Leads</TabsTrigger><TabsTrigger value="regions">Body Regions</TabsTrigger><TabsTrigger value="journeys">Treatment Journeys</TabsTrigger></TabsList></Tabs>
      <Card><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Condition</TableHead><TableHead>Region</TableHead><TableHead>Protocol</TableHead><TableHead>Stage</TableHead><TableHead>Started</TableHead><TableHead>Outcome</TableHead></TableRow></TableHeader>
          <TableBody>{DEMO_JOURNEYS.map(j => (
            <TableRow key={j.patient}><TableCell className="font-medium">{j.patient}</TableCell><TableCell className="text-sm">{j.condition}</TableCell><TableCell><Badge variant="outline" className="text-[10px]">{j.region}</Badge></TableCell><td className="text-sm">{j.protocol}</td><td className="text-sm">{j.currentStage}</td><td className="text-sm text-muted-foreground">{new Date(j.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td><td><Badge variant="outline" className={`text-[10px] ${outcomeStyles[j.outcome] ?? ''}`}>{j.outcome}</Badge></td></TableRow>
          ))}</TableBody></Table>
      </CardContent></Card>
    </div>
  );
}
