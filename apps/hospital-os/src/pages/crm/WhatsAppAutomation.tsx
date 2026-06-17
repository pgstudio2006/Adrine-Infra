import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Send, Bell, Clock, CheckCircle2, Users, Smartphone, Mail, Plus, X, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';

type AutomationType = 'appointment_confirmation' | 'appointment_reminder' | 'follow_up_reminder' | 'treatment_reminder' | 'feedback_request' | 'review_request';

interface AutomationRule {
  id: string;
  name: string;
  type: AutomationType;
  channel: 'whatsapp' | 'sms' | 'email';
  trigger: string;
  message: string;
  status: 'active' | 'paused' | 'draft';
  sentCount: number;
  lastSentAt?: string;
}

const DEMO_RULES: AutomationRule[] = [
  { id: 'ar-1', name: 'Appointment Confirmation', type: 'appointment_confirmation', channel: 'whatsapp', trigger: 'On appointment booking', message: 'Hi {{name}}, your appointment with {{doctor}} is confirmed for {{date}} at {{time}}. Location: {{branch}}. Reply CONFIRM to confirm.', status: 'active', sentCount: 342, lastSentAt: '2 hours ago' },
  { id: 'ar-2', name: 'Appointment Reminder (24h)', type: 'appointment_reminder', channel: 'whatsapp', trigger: '24 hours before appointment', message: 'Reminder: You have an appointment tomorrow at {{time}} with {{doctor}} at {{branch}}. Please arrive 15 minutes early. See you soon!', status: 'active', sentCount: 289, lastSentAt: '1 hour ago' },
  { id: 'ar-3', name: 'Appointment Reminder (2h)', type: 'appointment_reminder', channel: 'sms', trigger: '2 hours before appointment', message: 'Reminder: Your appointment is in 2 hours at {{branch}}. Please arrive 15 min early. — Navayu Health', status: 'active', sentCount: 287, lastSentAt: '30 min ago' },
  { id: 'ar-4', name: 'Follow-up Reminder', type: 'follow_up_reminder', channel: 'whatsapp', trigger: 'Follow-up date approaching', message: 'Hi {{name}}, it\'s time for your follow-up visit. Your doctor recommended a review on {{date}}. Reply BOOK to schedule or call us.', status: 'active', sentCount: 156, lastSentAt: 'Yesterday' },
  { id: 'ar-5', name: 'Treatment Reminder', type: 'treatment_reminder', channel: 'whatsapp', trigger: 'Daily during treatment course', message: 'Hi {{name}}, reminder for your {{treatment}} session today. Stay consistent for best results! 💪', status: 'active', sentCount: 523, lastSentAt: 'Today' },
  { id: 'ar-6', name: 'Feedback Request', type: 'feedback_request', channel: 'whatsapp', trigger: '24h after treatment completion', message: 'Hi {{name}}, we hope you had a great experience at Navayu! How would you rate your visit? Reply 1-5 (5=excellent). Your feedback helps us serve you better!', status: 'active', sentCount: 98, lastSentAt: '3 days ago' },
  { id: 'ar-7', name: 'Google Review Request', type: 'review_request', channel: 'sms', trigger: '48h after positive feedback', message: 'Thank you for your feedback! If you loved your experience, we\'d appreciate a Google review: {{review_link}} — Navayu Health', status: 'paused', sentCount: 34, lastSentAt: '1 week ago' },
  { id: 'ar-8', name: 'Missed Appointment Follow-up', type: 'follow_up_reminder', channel: 'whatsapp', trigger: '2h after missed appointment', message: 'Hi {{name}}, we noticed you missed your appointment today. Would you like to reschedule? Reply RESCHEDULE and we\'ll book a new slot.', status: 'active', sentCount: 67, lastSentAt: 'Today' },
];

const typeLabels: Record<AutomationType, string> = {
  appointment_confirmation: 'Appointment Confirmation', appointment_reminder: 'Appointment Reminder',
  follow_up_reminder: 'Follow-up Reminder', treatment_reminder: 'Treatment Reminder',
  feedback_request: 'Feedback Request', review_request: 'Review Request',
};
const channelIcons: Record<string, typeof MessageSquare> = { whatsapp: MessageSquare, sms: Smartphone, email: Mail };
const channelStyles: Record<string, string> = { whatsapp: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', sms: 'bg-blue-500/10 text-blue-600 border-blue-200', email: 'bg-violet-500/10 text-violet-600 border-violet-200' };
const statusStyles: Record<string, string> = { active: 'bg-success/10 text-success', paused: 'bg-warning/10 text-warning', draft: 'bg-muted text-muted-foreground' };

export default function WhatsAppAutomation() {
  const [rules, setRules] = useState<AutomationRule[]>(DEMO_RULES);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'appointment_confirmation' as AutomationType, channel: 'whatsapp' as const, trigger: '', message: '' });

  const stats = useMemo(() => ({
    active: rules.filter(r => r.status === 'active').length,
    totalSent: rules.reduce((s, r) => s + r.sentCount, 0),
    channels: { whatsapp: rules.filter(r => r.channel === 'whatsapp').length, sms: rules.filter(r => r.channel === 'sms').length, email: rules.filter(r => r.channel === 'email').length },
  }), [rules]);

  const toggleStatus = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r));
    toast.success('Automation status updated');
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.message.trim()) { toast.error('Name and message are required'); return; }
    setRules(prev => [{ id: `ar-${Date.now()}`, ...form, status: 'draft', sentCount: 0 }, ...prev]);
    setForm({ name: '', type: 'appointment_confirmation', channel: 'whatsapp', trigger: '', message: '' });
    setShowCreate(false); toast.success('Automation rule created');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">WhatsApp Automation</h1><p className="text-sm text-muted-foreground">Configure automated messages for appointments, follow-ups, feedback, and reviews</p></div>
        <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 h-4 w-4" /> New Automation</Button>
      </div>

      <Card className="border-emerald-400/30 bg-gradient-to-r from-emerald-500/5 to-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-white" /></div>
              <div>
                <div className="flex items-center gap-2"><p className="text-sm font-semibold">WhatsApp Business API</p><span className="text-[10px] bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">✓ Connected</span></div>
                <p className="text-xs text-muted-foreground mt-0.5">+91 124 000 0000 · Navayu Spine & Joint Care · 1,000 messages/day</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-center">
              <div><p className="text-lg font-bold text-emerald-600">{stats.totalSent.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Total Sent</p></div>
              <div><p className="text-lg font-bold text-blue-600">{stats.active}</p><p className="text-[10px] text-muted-foreground">Active Rules</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {Object.entries(stats.channels).map(([ch, count]) => (
          <Card key={ch}><CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Badge variant="outline" className={`text-xs ${channelStyles[ch] ?? ''}`}>{ch === 'whatsapp' ? '💬' : ch === 'sms' ? '📱' : '📧'} {ch}</Badge>
            <span className="text-sm font-medium">{count} rule{count !== 1 ? 's' : ''}</span>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Automation</TableHead><TableHead>Channel</TableHead><TableHead>Trigger</TableHead><TableHead>Messages Sent</TableHead><TableHead>Last Sent</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rules.map(rule => {
                const Icon = channelIcons[rule.channel] ?? MessageSquare;
                return (
                  <TableRow key={rule.id}>
                    <TableCell><p className="font-medium">{rule.name}</p><p className="text-xs text-muted-foreground">{typeLabels[rule.type]}</p></TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${channelStyles[rule.channel] ?? ''}`}><Icon className="h-3 w-3 mr-1 inline" />{rule.channel}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rule.trigger}</TableCell>
                    <TableCell className="text-sm font-medium">{rule.sentCount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rule.lastSentAt ?? '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] ${statusStyles[rule.status] ?? ''}`}>{rule.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toggleStatus(rule.id)}>
                        {rule.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Message Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-emerald-500/5 p-4 max-w-sm">
            <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-white" /></div><div><p className="text-sm font-semibold">Navayu Health</p><p className="text-[10px] text-muted-foreground">Verified Business</p></div></div>
            <div className="rounded-lg bg-white p-3 text-sm text-gray-800 shadow-sm">
              {rules[0]?.message.replace(/\{\{name\}\}/g, 'Rajesh').replace(/\{\{doctor\}\}/g, 'Dr. Sharma').replace(/\{\{date\}\}/g, '20 Jun 2026').replace(/\{\{time\}\}/g, '10:30 AM').replace(/\{\{branch\}\}/g, 'Gurgaon Center') ?? 'Select an automation to preview'}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-right">Template variables auto-fill from appointment data</p>
          </div>
        </CardContent>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">New Automation Rule</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></Button></CardHeader>
            <CardContent className="space-y-3">
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Rule name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as AutomationType }))}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value as 'whatsapp' | 'sms' | 'email' }))}>
                  <option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option>
                </select>
              </div>
              <input className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="Trigger condition" value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))} />
              <textarea className="w-full rounded-lg border bg-background px-3 py-2 text-sm" rows={4} placeholder="Message template. Use {{name}}, {{doctor}}, {{date}}, {{time}}, {{branch}}, {{treatment}}, {{review_link}}" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button onClick={handleCreate}><Send className="mr-2 h-4 w-4" /> Create Rule</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
