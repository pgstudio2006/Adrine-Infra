import { useState } from 'react';
import { motion } from 'framer-motion';
import { canUseAIRuntime, platformExecuteAI } from '@/runtime/ai-runtime';
import { PlatformConnectivityStrip } from '@/components/PlatformConnectivityStrip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Sparkles, BookOpen, AlertTriangle, Stethoscope, Pill, Activity,
  CheckCircle2, FileText, Brain, ClipboardList, Bell, Shield
} from 'lucide-react';

const fadeIn = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.04, duration: 0.3 },
});

const clinicalGuidelines = [
  {
    id: 1, condition: 'Type 2 Diabetes Mellitus', icd: 'E11',
    guidelines: [
      'Start Metformin 500mg BD as first-line therapy',
      'Order HbA1c, Fasting glucose, Renal function panel',
      'Initiate diabetic diet counseling',
      'Schedule ophthalmology referral for retinopathy screening',
      'Check foot examination — monofilament test',
    ],
    alerts: ['Check renal function before Metformin initiation', 'Avoid in eGFR <30'],
  },
  {
    id: 2, condition: 'Community-Acquired Pneumonia', icd: 'J18.9',
    guidelines: [
      'Assess CURB-65 score for severity stratification',
      'Start empirical antibiotics within 4 hours of diagnosis',
      'Order Chest X-ray PA view, CBC, CRP, Blood cultures',
      'Oxygen supplementation if SpO2 <94%',
      'Switch to oral antibiotics after 48h clinical improvement',
    ],
    alerts: ['Check for drug allergies to penicillin/cephalosporins', 'Severe CAP → ICU referral'],
  },
  {
    id: 3, condition: 'Acute Coronary Syndrome', icd: 'I21.9',
    guidelines: [
      'Immediate ECG within 10 minutes of presentation',
      'MONA protocol: Morphine, Oxygen, Nitrate, Aspirin',
      'Troponin I at 0h and 3h for serial monitoring',
      'Dual antiplatelet: Aspirin 325mg + Clopidogrel 300mg loading',
      'Activate cath lab if STEMI confirmed',
    ],
    alerts: ['Contraindications to thrombolytics: recent surgery, bleeding', 'Door-to-balloon time target: <90 min'],
  },
  {
    id: 4, condition: 'Dengue Fever', icd: 'A90',
    guidelines: [
      'Serial platelet count monitoring every 12 hours',
      'Avoid NSAIDs and Aspirin — use Paracetamol only',
      'IV fluid resuscitation if warning signs present',
      'Monitor for plasma leakage — HCT rise >20%',
      'Daily CBC and hematocrit tracking',
    ],
    alerts: ['Warning signs: Abdominal pain, persistent vomiting, mucosal bleeding', 'Platelet <20,000 → consider transfusion'],
  },
];

const monitoringAlerts = [
  { id: 1, patient: 'Bed 12 — Rajesh K.', alert: 'Creatinine rising: 1.8 → 2.4 mg/dL over 24h', type: 'lab', severity: 'warning', action: 'Consider nephrology consult' },
  { id: 2, patient: 'Bed 5 — Priya M.', alert: 'Potassium 5.8 mEq/L — Hyperkalemia', type: 'lab', severity: 'critical', action: 'Order ECG, Calcium gluconate, Insulin+D50' },
  { id: 3, patient: 'Bed 8 — Anil S.', alert: 'Drug interaction: Warfarin + Metronidazole', type: 'drug', severity: 'warning', action: 'Monitor INR closely, consider dose reduction' },
  { id: 4, patient: 'Ward 3 — Meena D.', alert: 'No vitals documented in 8 hours', type: 'workflow', severity: 'moderate', action: 'Assign nurse for immediate assessment' },
  { id: 5, patient: 'ICU-A2 — Suresh P.', alert: 'Ventilator day 5 — SAT/SBT protocol due', type: 'protocol', severity: 'info', action: 'Initiate spontaneous breathing trial' },
];

const suggestedNotes = [
  { trigger: 'Post-appendectomy Day 1', note: 'Patient tolerated procedure well. Vitals stable. Started on clear liquids. Surgical site clean, no signs of infection. Continue IV antibiotics for 24h. Monitor for signs of ileus.' },
  { trigger: 'Diabetic Ketoacidosis Admission', note: 'Admitted with DKA. Blood glucose 420 mg/dL, pH 7.18, HCO3 10. Started on insulin infusion protocol. Aggressive IV hydration with NS. Monitoring hourly glucose, q4h ABG, BMP.' },
  { trigger: 'Pneumonia Day 3 Progress', note: 'Day 3 of antibiotics. Fever trending down (101°F → 99.2°F). WBC improving (18k → 12k). Cough productive but decreasing. SpO2 maintained on room air. Plan to step down to oral antibiotics if afebrile for 24h.' },
];

export default function AdminAIWorkflow() {
  const [selectedGuideline, setSelectedGuideline] = useState<number | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiPolicyNote, setAiPolicyNote] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleApplyGuideline = (condition: string) => {
    toast.success(`${condition} guideline applied to current workflow`);
  };

  const handleAcknowledgeAlert = (id: number) => {
    toast.success(`Alert #${id} acknowledged and logged`);
  };

  const handleCopyNote = (note: string) => {
    navigator.clipboard.writeText(note);
    toast.success('Clinical note copied to clipboard');
  };

  const handleAIQuery = async () => {
    if (!customQuery.trim()) return;
    if (!canUseAIRuntime()) {
      toast.error('Platform AI runtime is off — enable VITE_PLATFORM_RUNTIME and sign in.');
      return;
    }
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await platformExecuteAI({
        actionType: 'admin_clinical_query',
        payload: { query: customQuery.trim() },
      });
      const output = res.output ?? {};
      setAiAnswer(String(output.answer ?? 'No answer returned.'));
      setAiPolicyNote(String(output.policyNote ?? ''));
      toast.success(`AI action logged (${res.logId})`);
      setCustomQuery('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI request failed';
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiBusy(false);
    }
  };

  const handleStuckWorkflows = async () => {
    if (!canUseAIRuntime()) {
      toast.error('Platform AI runtime is off.');
      return;
    }
    setAiBusy(true);
    try {
      const res = await platformExecuteAI({ actionType: 'stuck_workflows' });
      const stuck = (res.output.stuck as string[] | undefined) ?? [];
      toast.success(stuck.length ? `Stuck: ${stuck.join(', ')}` : 'No stuck workflows detected');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {canUseAIRuntime() && (
        <PlatformConnectivityStrip
          label="Domain AI (audited)"
          detail="Queries route through domain-api /ai/execute with tenant quota + policy stub"
          error={aiError}
        />
      )}
      {!canUseAIRuntime() && (
        <p className="text-xs text-muted-foreground border border-dashed rounded-lg px-3 py-2">
          Guideline library and monitoring cards are preview content. Connect platform runtime to execute governed AI actions.
        </p>
      )}
      <motion.div {...fadeIn(0)}>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" /> AI Workflow Assistance
        </h1>
        <p className="text-sm text-muted-foreground">Clinical decision support, suggested notes, treatment guidelines & monitoring alerts</p>
      </motion.div>

      {/* AI Query */}
      <motion.div {...fadeIn(1)}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Clinical Assistant
            </p>
            <div className="flex gap-2">
              <Textarea
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                placeholder="Ask a clinical question... e.g., 'What are the first-line antibiotics for UTI in pregnant women?'"
                className="text-xs min-h-[50px] resize-none flex-1"
              />
              <Button size="sm" className="self-end gap-1.5" onClick={() => void handleAIQuery()} disabled={aiBusy}>
                <Sparkles className="w-3.5 h-3.5" /> {aiBusy ? 'Running…' : 'Ask AI'}
              </Button>
            </div>
            {aiAnswer && (
              <div className="mt-3 rounded-md border bg-background p-2 text-xs space-y-1">
                <p>{aiAnswer}</p>
                {aiPolicyNote && <p className="text-muted-foreground">{aiPolicyNote}</p>}
              </div>
            )}
            <Button size="sm" variant="outline" className="mt-2 h-7 text-[10px]" onClick={() => void handleStuckWorkflows()} disabled={aiBusy}>
              Scan stuck workflows (platform)
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monitoring Alerts */}
      <motion.div {...fadeIn(2)}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Patient Monitoring Alerts
              </p>
              <Badge variant="secondary" className="text-[10px]">{monitoringAlerts.length} Active</Badge>
            </div>
            <div className="space-y-2">
              {monitoringAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start justify-between border rounded-lg p-2.5 ${alert.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      alert.severity === 'critical' ? 'bg-destructive animate-pulse' :
                      alert.severity === 'warning' ? 'bg-amber-500' :
                      alert.severity === 'moderate' ? 'bg-blue-500' : 'bg-muted-foreground'
                    }`} />
                    <div>
                      <p className="text-xs font-medium">{alert.patient}</p>
                      <p className="text-[10px] text-muted-foreground">{alert.alert}</p>
                      <p className="text-[10px] text-primary font-medium mt-0.5">→ {alert.action}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{alert.type}</Badge>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleAcknowledgeAlert(alert.id)}>
                      Ack
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Clinical Guidelines */}
        <motion.div {...fadeIn(3)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Treatment Guidelines Library
              </p>
              <div className="space-y-2">
                {clinicalGuidelines.map(g => (
                  <div key={g.id} className="border rounded-lg">
                    <button
                      onClick={() => setSelectedGuideline(selectedGuideline === g.id ? null : g.id)}
                      className="w-full flex items-center justify-between p-2.5 text-left hover:bg-accent/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium">{g.condition}</p>
                          <p className="text-[10px] text-muted-foreground">ICD-10: {g.icd}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{g.guidelines.length} steps</Badge>
                    </button>
                    {selectedGuideline === g.id && (
                      <div className="px-3 pb-3 space-y-2">
                        <div className="space-y-1">
                          {g.guidelines.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                        {g.alerts.length > 0 && (
                          <div className="border-t pt-2 space-y-1">
                            {g.alerts.map((a, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px] text-amber-700">
                                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                <span>{a}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button size="sm" className="h-7 text-[10px] w-full" onClick={() => handleApplyGuideline(g.condition)}>
                          Apply to Workflow
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Suggested Clinical Notes */}
        <motion.div {...fadeIn(4)}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <FileText className="w-3.5 h-3.5" /> AI-Suggested Clinical Notes
              </p>
              <div className="space-y-3">
                {suggestedNotes.map((n, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="secondary" className="text-[10px]">{n.trigger}</Badge>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1" onClick={() => handleCopyNote(n.note)}>
                        <ClipboardList className="w-3 h-3" /> Copy
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{n.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
