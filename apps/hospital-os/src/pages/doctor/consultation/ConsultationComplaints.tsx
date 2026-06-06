import { useState } from 'react';
import { X, Sparkles, ChevronDown, ChevronUp, Stethoscope, AlertTriangle, Heart, Zap, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

interface Complaint {
  id: string;
  text: string;
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
}

interface Props {
  complaints: Complaint[];
  onChange: (complaints: Complaint[]) => void;
  hpiNotes: string;
  onHPIChange: (notes: string) => void;
}

const severityColors = {
  mild: 'bg-emerald-500/10 text-emerald-700',
  moderate: 'bg-amber-500/10 text-amber-700',
  severe: 'bg-destructive/10 text-destructive',
};

const QUICK_COMPLAINTS = [
  'Low back pain',
  'Neck pain',
  'Knee pain',
  'Shoulder pain',
  'Radiating leg pain',
  'Numbness / tingling',
  'Difficulty walking',
  'Posture imbalance',
  'Sports injury',
  'Follow-up review',
];

// Navayu MSK-focused clinical prompts for junior doctor handoff.
const AI_SYMPTOM_MAP: Record<string, {
  possibleDiagnoses: string[];
  suggestedTreatments: string[];
  redFlags: string[];
  specialistReferral?: string;
  doctorNote?: string;
}> = {
  'back': {
    possibleDiagnoses: ['Mechanical low back pain', 'Lumbar radiculopathy', 'Discogenic pain', 'Facet joint pain'],
    suggestedTreatments: ['Document ODI/VAS', 'Screen red flags', 'Start lumbar exam form', 'Escalate to senior if neurological deficit'],
    redFlags: ['Bowel/bladder symptoms', 'Progressive weakness', 'Saddle anesthesia', 'Fever/weight loss'],
    doctorNote: 'Complete regional MSK exam and submit junior MSK exam before senior handoff.',
  },
  'neck': {
    possibleDiagnoses: ['Cervical strain', 'Cervical radiculopathy', 'Postural neck pain'],
    suggestedTreatments: ['Document NDI/VAS', 'Assess neurological signs', 'Capture pain regions', 'Consider senior review if radiating pain'],
    redFlags: ['Myelopathy signs', 'Trauma', 'Progressive weakness', 'Severe night pain'],
    doctorNote: 'Use the cervical MSK form if neck is selected as pain region.',
  },
  'knee': {
    possibleDiagnoses: ['Knee osteoarthritis', 'Ligament sprain', 'Meniscal pathology', 'Patellofemoral pain'],
    suggestedTreatments: ['Document WOMAC/KOOS', 'Assess gait and swelling', 'Record pain score', 'Map protocol after senior classification'],
    redFlags: ['Hot swollen joint', 'Unable to bear weight', 'Recent trauma', 'Neurovascular compromise'],
  },
  'shoulder': {
    possibleDiagnoses: ['Rotator cuff tendinopathy', 'Frozen shoulder', 'Impingement syndrome'],
    suggestedTreatments: ['Document SPADI/DASH', 'Record ROM limitation', 'Add investigation if clinically needed'],
    redFlags: ['Trauma with deformity', 'Acute weakness', 'Fever', 'Neurovascular symptoms'],
  },
  'acne': {
    possibleDiagnoses: ['Acne vulgaris (comedonal/inflammatory)', 'Hormonal acne', 'Rosacea', 'Perioral dermatitis'],
    suggestedTreatments: ['Topical clindamycin 1% gel BD', 'Benzoyl peroxide 2.5% wash', 'Tab. Doxycycline 100mg BD × 6 weeks', 'Tretinoin 0.025% cream at night'],
    redFlags: ['Nodulocystic acne (risk of scarring)', 'Acne with hirsutism (suspect PCOS)', 'Acne fulminans'],
    specialistReferral: 'Endocrinology if PCOS suspected',
    doctorNote: 'Consider Isotretinoin for grade III/IV acne. Check for hormonal workup in females.',
  },
  'pigmentation': {
    possibleDiagnoses: ['Melasma', 'Post-inflammatory hyperpigmentation', 'Solar lentigines', 'Lichen planus pigmentosus'],
    suggestedTreatments: ['Topical hydroquinone 2-4% at night', 'Vitamin C serum 10-20%', 'SPF 50 sunscreen BD', 'Chemical peel series (glycolic 30-70%)'],
    redFlags: ['Asymmetric/irregular border — rule out melanoma', 'Rapidly changing pigmented lesion'],
    specialistReferral: 'Dermatoscopy if atypical mole',
    doctorNote: 'Assess Fitzpatrick skin type. Melasma: hormonal triggers? OCP use?',
  },
  'hair loss': {
    possibleDiagnoses: ['Androgenetic alopecia (AGA)', 'Telogen effluvium', 'Alopecia areata', 'Trichotillomania'],
    suggestedTreatments: ['Minoxidil 5% topical solution OD', 'Tab. Finasteride 1mg OD (males)', 'Biotin supplementation', 'PRP therapy referral'],
    redFlags: ['Rapid diffuse hair loss — check ferritin, TSH, ANA', 'Scarring alopecia (permanent — refer urgently)'],
    specialistReferral: 'Trichoscopy / dermoscopy evaluation',
    doctorNote: 'Order CBC, ferritin, TSH, testosterone, DHEA-S, ANA.',
  },
  'obesity': {
    possibleDiagnoses: ['Primary obesity (metabolic)', 'Hypothyroid-related weight gain', 'PCOS-associated obesity', 'Cushing\'s syndrome'],
    suggestedTreatments: ['Orlistat 120mg TDS with meals', 'Calorie deficit diet plan (1200-1500 kcal)', 'Structured exercise: 150 min/week moderate aerobic', 'Metformin 500mg BD if pre-diabetic'],
    redFlags: ['BMI > 40 — bariatric surgery evaluation', 'Obesity + hypertension + DM — metabolic syndrome', 'Rapid weight gain without dietary change'],
    specialistReferral: 'Endocrinology + Dietetics + Bariatric surgery (if BMI > 35 + comorbidity)',
    doctorNote: 'Order: fasting glucose, HbA1c, lipid profile, TSH, insulin levels.',
  },
  'weight': {
    possibleDiagnoses: ['Obesity (BMI > 30)', 'Overweight (BMI 25-30)', 'Metabolic syndrome'],
    suggestedTreatments: ['Lifestyle modification counseling', 'GLP-1 agonist (Semaglutide 0.25-1mg weekly SC)', 'High-protein low-carb diet', 'Behavioral therapy'],
    redFlags: ['Unexplained rapid weight loss — rule out malignancy', 'Rapid gain with edema — check cardiac/renal'],
    doctorNote: 'Calculate BMI. Target 5-10% weight loss in 6 months as initial goal.',
  },
  'rash': {
    possibleDiagnoses: ['Atopic dermatitis (eczema)', 'Contact dermatitis', 'Psoriasis vulgaris', 'Urticaria', 'Drug reaction'],
    suggestedTreatments: ['Topical hydrocortisone 1% BD × 2 weeks', 'Tab. Cetirizine 10mg HS', 'Calamine lotion for pruritus', 'Identify and avoid trigger'],
    redFlags: ['Target lesions — rule out erythema multiforme', 'Rash + fever + mucositis — Stevens-Johnson syndrome (emergency)', 'Rash in immunocompromised — rule out disseminated infection'],
    doctorNote: 'Check for drug history (antibiotics, NSAIDs). Patch test if contact dermatitis suspected.',
  },
  'itching': {
    possibleDiagnoses: ['Urticaria', 'Atopic dermatitis', 'Scabies', 'Hepatic pruritus', 'CKD pruritus'],
    suggestedTreatments: ['Tab. Cetirizine 10mg OD', 'Tab. Hydroxyzine 25mg HS', 'Calamine lotion', 'Permethrin 5% cream if scabies'],
    redFlags: ['Generalized pruritus without rash — check LFT, RFT, TFT, CBC', 'Nocturnal itching — suspect scabies or malignancy'],
    doctorNote: 'Rule out systemic causes: LFT, RFT, CBC, TSH, FBS.',
  },
  'dandruff': {
    possibleDiagnoses: ['Seborrheic dermatitis', 'Psoriasis of scalp', 'Tinea capitis', 'Dry scalp'],
    suggestedTreatments: ['Ketoconazole 2% shampoo 3×/week', 'Zinc pyrithione shampoo', 'Coal tar shampoo', 'Ciclopirox shampoo'],
    redFlags: ['Thick plaques + pustules — rule out tinea capitis (culture needed)', 'Involvement beyond scalp — psoriasis'],
    doctorNote: 'Ask about scalp psoriasis elsewhere. KOH scraping if tinea suspected.',
  },
};

function getAISuggestions(complaints: Complaint[]) {
  const keywords = complaints.map(c => c.text.toLowerCase());
  for (const [keyword, suggestions] of Object.entries(AI_SYMPTOM_MAP)) {
    if (keywords.some(k => k.includes(keyword))) {
      return { keyword, ...suggestions };
    }
  }
  // Generic fallback
  if (keywords.length > 0) {
    return {
      keyword: 'symptoms',
      possibleDiagnoses: ['Clinical evaluation required', 'Consider systemic review'],
      suggestedTreatments: ['Symptomatic management', 'Targeted investigation based on history'],
      redFlags: ['Any rapidly progressing symptom', 'Signs of systemic involvement'],
      doctorNote: 'Perform complete physical examination. Order relevant investigations.',
    };
  }
  return null;
}

export default function ConsultationComplaints({ complaints, onChange, hpiNotes, onHPIChange }: Props) {
  const [newText, setNewText] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newSeverity, setNewSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [showAI, setShowAI] = useState(false);

  const add = () => {
    if (!newText.trim()) return;
    onChange([...complaints, { id: Date.now().toString(), text: newText, duration: newDuration, severity: newSeverity }]);
    setNewText('');
    setNewDuration('');
  };

  const aiData = getAISuggestions(complaints);

  return (
    <div className="space-y-3">
      {/* Chief Complaints */}
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
          <span className="text-destructive">⊘</span> Chief Complaints
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {complaints.map(c => (
            <span key={c.id} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${severityColors[c.severity]}`}>
              {c.text} {c.duration && `(${c.duration})`}
              <button onClick={() => onChange(complaints.filter(x => x.id !== c.id))} className="hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Select
            value=""
            onValueChange={(value) => {
              setNewText(value);
            }}
          >
            <SelectTrigger className="h-7 text-xs w-[150px]">
              <SelectValue placeholder="Pick complaint" />
            </SelectTrigger>
            <SelectContent>
              {QUICK_COMPLAINTS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Complaint (e.g. low back pain, neck stiffness)…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="h-7 text-xs flex-1"
          />
          <Input
            placeholder="Duration"
            value={newDuration}
            onChange={e => setNewDuration(e.target.value)}
            className="h-7 text-xs w-20"
          />
          <Select value={newSeverity} onValueChange={v => setNewSeverity(v as any)}>
            <SelectTrigger className="h-7 text-xs w-[110px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mild">Mild</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={add}
            className="h-7 px-3 rounded-md bg-foreground text-background text-xs font-medium disabled:opacity-40"
            disabled={!newText.trim()}
          >
            Add
          </button>
        </div>

        {/* AI Suggestions trigger */}
        {complaints.length > 0 && aiData && (
          <button
            onClick={() => setShowAI(!showAI)}
            className={`mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              showAI
                ? 'bg-violet-500/10 text-violet-700 border border-violet-400/30'
                : 'bg-gradient-to-r from-violet-500/5 to-blue-500/5 text-violet-600 border border-violet-400/20 hover:border-violet-400/40'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Clinical Insights — based on "{aiData.keyword}" complaints
            </span>
            {showAI ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {showAI && aiData && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border border-violet-400/20 rounded-xl bg-gradient-to-br from-violet-500/5 to-blue-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <p className="text-xs font-semibold text-violet-700">AI Clinical Decision Support</p>
                <span className="text-[10px] bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-full ml-auto">
                  Navayu MSK
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Possible diagnoses */}
                <div className="rounded-lg bg-white/60 border border-violet-200/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 flex items-center gap-1 mb-2">
                    <Stethoscope className="w-3 h-3" /> Possible Diagnoses
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {aiData.possibleDiagnoses.map((d, i) => (
                      <span key={i} className="text-[11px] bg-violet-500/10 text-violet-700 px-2 py-0.5 rounded-full border border-violet-300/30">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested treatments */}
                <div className="rounded-lg bg-white/60 border border-emerald-200/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1 mb-2">
                    <Zap className="w-3 h-3" /> Suggested Treatments
                  </p>
                  <ul className="space-y-1">
                    {aiData.suggestedTreatments.map((t, i) => (
                      <li key={i} className="text-[11px] text-emerald-700 flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[9px] shrink-0 mt-0.5">{i + 1}</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Red flags */}
                <div className="rounded-lg bg-white/60 border border-red-200/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600 flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-3 h-3" /> Red Flags — Check Before Proceeding
                  </p>
                  <ul className="space-y-1">
                    {aiData.redFlags.map((f, i) => (
                      <li key={i} className="text-[11px] text-red-600 flex items-start gap-1.5">
                        <span className="shrink-0 mt-0.5">⚠</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Specialist referral + doctor note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiData.specialistReferral && (
                    <div className="rounded-lg bg-white/60 border border-blue-200/40 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 flex items-center gap-1 mb-1.5">
                        <Users className="w-3 h-3" /> Specialist Referral
                      </p>
                      <p className="text-[11px] text-blue-700">{aiData.specialistReferral}</p>
                    </div>
                  )}
                  {aiData.doctorNote && (
                    <div className="rounded-lg bg-amber-50/60 border border-amber-200/40 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 flex items-center gap-1 mb-1.5">
                        <Heart className="w-3 h-3" /> Doctor's Tip
                      </p>
                      <p className="text-[11px] text-amber-700 italic">{aiData.doctorNote}</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                AI suggestions are clinical decision support only — final judgment rests with the treating physician.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History of Present Illness */}
      <div className="border rounded-xl bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          History of Present Illness (HPI)
        </p>
        <Textarea
          placeholder="Symptom progression, trigger factors, relieving factors, previous treatments, associated conditions, family history…"
          value={hpiNotes}
          onChange={e => onHPIChange(e.target.value)}
          className="text-xs min-h-[70px] resize-none"
        />
      </div>
    </div>
  );
}

export type { Complaint };
