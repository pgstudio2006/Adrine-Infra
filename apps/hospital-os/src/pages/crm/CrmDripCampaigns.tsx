import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Users, Plus, X, Play, Pause,
  Smartphone, Bell, Star, TrendingUp, Zap,
} from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import { allowDemoFallback } from '@/lib/platform/demo-fallback';
import { PlatformEmptyState } from '@/components/platform/PlatformEmptyState';

// ── Types ──
interface DripStep {
  day: number;
  channel: 'whatsapp' | 'sms' | 'email';
  message: string;
}

interface DripCampaign {
  id: string;
  name: string;
  segment: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  steps: DripStep[];
  patientCount: number;
  sentCount: number;
  openRate: number;
  createdAt: string;
}

// ── Demo campaigns ──
const DEMO_CAMPAIGNS: DripCampaign[] = [
  {
    id: 'c1',
    name: 'Post-Acne Treatment Follow-up',
    segment: 'Dermatology – Acne',
    description: 'Follow up with acne patients at 1w, 1m, 3m after treatment',
    status: 'active',
    steps: [
      { day: 7, channel: 'whatsapp', message: 'Hi {{name}}, it\'s been a week since your acne treatment. How is your skin responding? Any irritation or dryness? Reply to update us 😊' },
      { day: 30, channel: 'whatsapp', message: 'Hi {{name}}, 1 month update! Book your follow-up appointment to assess treatment progress. Reply "BOOK" to get an appointment.' },
      { day: 90, channel: 'sms', message: '3-month check: Your acne treatment progress evaluation is due. Call us at +91-98765-43210 to book. – Adrine Skin Clinic' },
    ],
    patientCount: 48,
    sentCount: 134,
    openRate: 78,
    createdAt: '2 weeks ago',
  },
  {
    id: 'c2',
    name: 'Weight Loss Program Check-in',
    segment: 'Weight Management',
    description: 'Weekly motivational nudges + dietary reminders for weight loss patients',
    status: 'active',
    steps: [
      { day: 1, channel: 'whatsapp', message: 'Welcome {{name}} to your weight loss journey! 🌟 Remember: small steps every day. Today\'s tip: drink 8 glasses of water and walk 30 mins.' },
      { day: 7, channel: 'whatsapp', message: 'Week 1 check! How many kgs have you lost? Share your update with your doctor. Book a tele-consultation if needed.' },
      { day: 30, channel: 'whatsapp', message: '1 month milestone {{name}}! Time for your monthly weight and vitals check. Reply "BOOK" for your next visit.' },
      { day: 90, channel: 'email', message: '3-month Weight Management Review — Book your comprehensive evaluation including BMI, lipid profile, and dietary assessment.' },
    ],
    patientCount: 31,
    sentCount: 89,
    openRate: 84,
    createdAt: '1 month ago',
  },
  {
    id: 'c3',
    name: 'Melasma Skin Brightening Follow-up',
    segment: 'Dermatology – Pigmentation',
    description: 'Track patients on skin brightening treatment every 4-6 weeks',
    status: 'paused',
    steps: [
      { day: 14, channel: 'whatsapp', message: 'Hi {{name}}, your melasma treatment has been running for 2 weeks. Are you applying sunscreen twice daily? It\'s very important 🌞' },
      { day: 42, channel: 'whatsapp', message: 'It\'s time for your 6-week pigmentation review appointment! Early assessment helps us adjust the treatment. Book now 📅' },
    ],
    patientCount: 22,
    sentCount: 31,
    openRate: 71,
    createdAt: '3 weeks ago',
  },
  {
    id: 'c4',
    name: 'Hair Loss PRP Follow-up',
    segment: 'Dermatology – Hair Loss',
    description: 'Post-PRP session reminders and progress tracking',
    status: 'draft',
    steps: [
      { day: 3, channel: 'whatsapp', message: 'Hi {{name}}, how are you feeling after your PRP session? Some scalp tenderness is normal. Avoid washing hair for 24h.' },
      { day: 30, channel: 'whatsapp', message: 'One month since your PRP! Time to evaluate hair density progress. Book session 2 for best results.' },
    ],
    patientCount: 0,
    sentCount: 0,
    openRate: 0,
    createdAt: 'Just now',
  },
];

const SEGMENTS = [
  'Dermatology – Acne',
  'Dermatology – Pigmentation',
  'Dermatology – Hair Loss',
  'Dermatology – Anti-Aging',
  'Weight Management',
  'Weight Loss – Pre-Bariatric',
  'Post-Surgery Recovery',
  'General Follow-up',
  'Lab Results Reminder',
  'Vaccination Reminder',
];

const STEP_CHANNELS = [
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'sms', label: '📱 SMS' },
  { value: 'email', label: '📧 Email' },
];

const channelIcon = (ch: string) => {
  if (ch === 'whatsapp') return <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-400/20">💬 WhatsApp</span>;
  if (ch === 'sms') return <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full border border-blue-400/20">📱 SMS</span>;
  return <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full border border-purple-400/20">📧 Email</span>;
};

const statusBadge = (status: DripCampaign['status']) => {
  if (status === 'active') return <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-400/20 text-[10px]">● Active</Badge>;
  if (status === 'paused') return <Badge className="bg-amber-500/10 text-amber-700 border-amber-400/20 text-[10px]">⏸ Paused</Badge>;
  return <Badge variant="outline" className="text-[10px]">Draft</Badge>;
};

export default function CrmDripCampaigns() {
  const { patients } = useHospital();
  const [campaigns, setCampaigns] = useState<DripCampaign[]>(() =>
    allowDemoFallback() ? DEMO_CAMPAIGNS : [],
  );
  const [selectedCampaign, setSelectedCampaign] = useState<DripCampaign | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // New campaign form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    segment: SEGMENTS[0],
    description: '',
    steps: [{ day: 7, channel: 'whatsapp' as const, message: '' }],
  });

  const stats = useMemo(() => ({
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalPatients: campaigns.reduce((s, c) => s + c.patientCount, 0),
    totalSent: campaigns.reduce((s, c) => s + c.sentCount, 0),
    avgOpenRate: Math.round(campaigns.filter(c => c.openRate > 0).reduce((s, c) => s + c.openRate, 0) / campaigns.filter(c => c.openRate > 0).length) || 0,
  }), [campaigns]);

  const toggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c;
      const next = c.status === 'active' ? 'paused' : c.status === 'paused' ? 'active' : 'active';
      toast.success(`Campaign "${c.name}" ${next === 'active' ? 'resumed' : 'paused'}`);
      return { ...c, status: next };
    }));
  };

  const addStep = () => {
    setNewCampaign(prev => ({
      ...prev,
      steps: [...prev.steps, { day: (prev.steps[prev.steps.length - 1]?.day ?? 0) + 7, channel: 'whatsapp', message: '' }],
    }));
  };

  const handleCreate = () => {
    if (!newCampaign.name.trim() || !newCampaign.steps.some(s => s.message.trim())) {
      toast.error('Campaign name and at least one message are required.');
      return;
    }
    const campaign: DripCampaign = {
      id: Date.now().toString(),
      name: newCampaign.name,
      segment: newCampaign.segment,
      description: newCampaign.description,
      status: 'draft',
      steps: newCampaign.steps.filter(s => s.message.trim()),
      patientCount: 0,
      sentCount: 0,
      openRate: 0,
      createdAt: 'Just now',
    };
    setCampaigns(prev => [campaign, ...prev]);
    setNewCampaign({ name: '', segment: SEGMENTS[0], description: '', steps: [{ day: 7, channel: 'whatsapp', message: '' }] });
    setShowCreate(false);
    toast.success('Drip campaign created successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drip Marketing</h1>
          <p className="text-sm text-muted-foreground mt-1">Automated follow-up sequences via WhatsApp, SMS & Email for dermatology & weight loss patients</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Zap className="w-5 h-5 text-emerald-600" />, value: stats.activeCampaigns, label: 'Active Campaigns', color: 'bg-emerald-500/10' },
          { icon: <Users className="w-5 h-5 text-blue-600" />, value: stats.totalPatients, label: 'Enrolled Patients', color: 'bg-blue-500/10' },
          { icon: <Send className="w-5 h-5 text-violet-600" />, value: stats.totalSent, label: 'Messages Sent', color: 'bg-violet-500/10' },
          { icon: <TrendingUp className="w-5 h-5 text-amber-600" />, value: `${stats.avgOpenRate}%`, label: 'Avg Open Rate', color: 'bg-amber-500/10' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>{s.icon}</div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* WhatsApp Integration Status */}
      <Card className="border-emerald-400/30 bg-gradient-to-r from-emerald-500/5 to-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">WhatsApp Business API</p>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">✓ Connected</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">+91 98765 43210 · Adrine Skin & Wellness Clinic · 1,000 messages/day limit</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-center">
              <div><p className="text-lg font-bold text-emerald-600">{stats.totalSent}</p><p className="text-[10px] text-muted-foreground">Total Sent</p></div>
              <div><p className="text-lg font-bold text-blue-600">{stats.avgOpenRate}%</p><p className="text-[10px] text-muted-foreground">Read Rate</p></div>
              <div><p className="text-lg font-bold text-violet-600">{allowDemoFallback() ? '12' : '—'}</p><p className="text-[10px] text-muted-foreground">Replies Today</p></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <Bell className="w-3.5 h-3.5" /> Test Message
              </Button>
              <Button size="sm" className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
                <Smartphone className="w-3.5 h-3.5" /> Configure
              </Button>
            </div>
          </div>

          {/* Channel breakdown */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-400/20">
            {[
              { label: 'WhatsApp', icon: '💬', sent: Math.round(stats.totalSent * 0.7), read: '84%', color: 'emerald' },
              { label: 'SMS', icon: '📱', sent: Math.round(stats.totalSent * 0.2), read: '67%', color: 'blue' },
              { label: 'Email', icon: '📧', sent: Math.round(stats.totalSent * 0.1), read: '38%', color: 'purple' },
            ].map(ch => (
              <div key={ch.label} className={`rounded-lg border border-${ch.color}-400/20 bg-${ch.color}-500/5 p-3 text-center`}>
                <p className="text-lg">{ch.icon}</p>
                <p className="text-sm font-bold mt-1">{ch.sent}</p>
                <p className="text-[10px] text-muted-foreground">{ch.label} · {ch.read} read</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaign List + Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
        {/* List */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-xs">Campaigns ({campaigns.length})</p>
          {campaigns.length === 0 ? (
            <PlatformEmptyState message="No drip campaigns yet. Create one or enable VITE_ALLOW_DEMO_DATA for sample campaigns in local dev." />
          ) : (
          campaigns.map(c => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedCampaign(selectedCampaign?.id === c.id ? null : c)}
              className={`rounded-xl border bg-card p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCampaign?.id === c.id ? 'border-primary/50 shadow-sm ring-1 ring-primary/20' : 'hover:border-primary/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    {statusBadge(c.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.segment} · {c.steps.length} steps · Created {c.createdAt}</p>
                  {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.description}</p>}

                  {/* Channel chips */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {Array.from(new Set(c.steps.map(s => s.channel))).map(ch => channelIcon(ch))}
                    <span className="text-[10px] text-muted-foreground">Days: {c.steps.map(s => `D+${s.day}`).join(', ')}</span>
                  </div>
                </div>

                {/* Mini stats */}
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-3 text-right">
                    <div><p className="text-sm font-bold">{c.patientCount}</p><p className="text-[10px] text-muted-foreground">patients</p></div>
                    <div><p className="text-sm font-bold">{c.sentCount}</p><p className="text-[10px] text-muted-foreground">sent</p></div>
                    {c.openRate > 0 && <div><p className="text-sm font-bold text-emerald-600">{c.openRate}%</p><p className="text-[10px] text-muted-foreground">open</p></div>}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {c.status !== 'draft' && (
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1"
                        onClick={e => { e.stopPropagation(); toggleStatus(c.id); }}>
                        {c.status === 'active' ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Resume</>}
                      </Button>
                    )}
                    {c.status === 'draft' && (
                      <Button size="sm" className="h-7 px-2 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={e => { e.stopPropagation(); toggleStatus(c.id); }}>
                        <Play className="w-3 h-3" /> Launch
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selectedCampaign ? (
            <motion.div
              key={selectedCampaign.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="rounded-xl border bg-card overflow-hidden sticky top-4 self-start"
            >
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{selectedCampaign.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCampaign.segment}</p>
                  </div>
                  <button onClick={() => setSelectedCampaign(null)} className="p-1 rounded hover:bg-accent">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {/* Step timeline */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Follow-up Sequence</p>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-4">
                    {selectedCampaign.steps.map((step, i) => (
                      <div key={i} className="relative pl-10">
                        <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                          <span className="text-[8px] font-bold text-primary">{i + 1}</span>
                        </div>
                        <div className="rounded-lg border p-3 bg-accent/20">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium text-primary">Day +{step.day}</span>
                            {channelIcon(step.channel)}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{step.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enroll patients section */}
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Quick Enroll Patients</p>
                  <p className="text-xs text-muted-foreground mb-2">{patients.length} registered patients available</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {patients.slice(0, 6).map(p => (
                      <div key={p.uhid} className="flex items-center justify-between rounded-lg border px-2.5 py-1.5 hover:bg-accent/50 transition-colors">
                        <div>
                          <p className="text-xs font-medium">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.uhid} · {p.department || 'General'}</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-0.5"
                          onClick={() => toast.success(`${p.name} enrolled in "${selectedCampaign.name}"`)}>
                          <Plus className="w-2.5 h-2.5" /> Enroll
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 flex flex-col items-center justify-center p-8 text-center min-h-[300px]"
            >
              <MessageSquare className="w-8 h-8 text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">Select a campaign to view details and enroll patients</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Create Drip Campaign</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-accent"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Campaign Name *</Label>
                  <Input className="mt-1" placeholder="e.g. Post-Acne Treatment Follow-up" value={newCampaign.name}
                    onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Patient Segment</Label>
                  <AppSelect className="mt-1 w-full h-9 px-3 text-sm" value={newCampaign.segment}
                    onValueChange={v => setNewCampaign(p => ({ ...p, segment: v }))}
                    options={SEGMENTS.map(s => ({ value: s, label: s }))} />
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Input className="mt-1" placeholder="Brief description" value={newCampaign.description}
                    onChange={e => setNewCampaign(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Follow-up Steps</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addStep}>
                    <Plus className="w-3 h-3" /> Add Step
                  </Button>
                </div>
                <div className="space-y-3">
                  {newCampaign.steps.map((step, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Day +</span>
                            <Input type="number" className="h-7 w-16 text-xs" value={step.day}
                              onChange={e => {
                                const s = [...newCampaign.steps];
                                s[i] = { ...s[i], day: parseInt(e.target.value) || 1 };
                                setNewCampaign(p => ({ ...p, steps: s }));
                              }} />
                          </div>
                          <AppSelect className="h-7 text-xs w-36" value={step.channel}
                            onValueChange={v => {
                              const s = [...newCampaign.steps];
                              s[i] = { ...s[i], channel: v as any };
                              setNewCampaign(p => ({ ...p, steps: s }));
                            }}
                            options={STEP_CHANNELS} />
                        </div>
                        {newCampaign.steps.length > 1 && (
                          <button onClick={() => setNewCampaign(p => ({ ...p, steps: p.steps.filter((_, j) => j !== i) }))}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        className="w-full text-xs border rounded-lg p-2 bg-background resize-none"
                        rows={3}
                        placeholder={`Message for Day +${step.day}. Use {{name}} for patient name.`}
                        value={step.message}
                        onChange={e => {
                          const s = [...newCampaign.steps];
                          s[i] = { ...s[i], message: e.target.value };
                          setNewCampaign(p => ({ ...p, steps: s }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button className="flex-1 gap-2" onClick={handleCreate}>
                  <Plus className="w-4 h-4" /> Create Campaign
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
