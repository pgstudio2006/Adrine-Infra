import { useState } from 'react';
import { X, Stethoscope, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Diagnosis {
  id: string;
  code: string;
  text: string;
  type: 'primary' | 'secondary';
  certainty: 'confirmed' | 'provisional' | 'differential';
}

interface Props {
  diagnoses: Diagnosis[];
  onChange: (diagnoses: Diagnosis[]) => void;
}

const ICD_SUGGESTIONS = [
  // Infectious / Parasitic
  { code: 'A09', text: 'Infectious gastroenteritis / colitis' },
  { code: 'A41.9', text: 'Sepsis, unspecified' },
  { code: 'B34.9', text: 'Viral infection, unspecified' },
  { code: 'B97.2', text: 'COVID-19' },
  // Neoplasms
  { code: 'C34.9', text: 'Bronchogenic / lung malignancy' },
  { code: 'C50.9', text: 'Breast malignancy' },
  { code: 'C61', text: 'Prostate malignancy' },
  { code: 'C64', text: 'Renal cell carcinoma' },
  { code: 'C78.7', text: 'Metastatic liver disease' },
  { code: 'D64.9', text: 'Anaemia, unspecified' },
  // Endocrine / Metabolic
  { code: 'E03.9', text: 'Hypothyroidism, unspecified' },
  { code: 'E10.9', text: 'Type 1 Diabetes Mellitus' },
  { code: 'E11.9', text: 'Type 2 Diabetes Mellitus' },
  { code: 'E14.9', text: 'Diabetes Mellitus with complications' },
  { code: 'E66.9', text: 'Obesity, unspecified' },
  { code: 'E78.0', text: 'Pure hypercholesterolemia' },
  { code: 'E78.2', text: 'Mixed hyperlipidemia' },
  { code: 'E86', text: 'Volume depletion / dehydration' },
  { code: 'E87.1', text: 'Hyponatremia' },
  { code: 'E87.2', text: 'Acidosis' },
  // Mental / Behavioural
  { code: 'F03', text: 'Dementia, unspecified' },
  { code: 'F10.2', text: 'Alcohol dependence syndrome' },
  { code: 'F20.9', text: 'Schizophrenia, unspecified' },
  { code: 'F32.9', text: 'Major depressive disorder, single episode' },
  { code: 'F41.1', text: 'Generalized anxiety disorder' },
  { code: 'F41.9', text: 'Anxiety disorder, unspecified' },
  { code: 'F51.0', text: 'Insomnia, non-organic' },
  // Nervous System
  { code: 'G20', text: 'Parkinson disease' },
  { code: 'G40.9', text: 'Epilepsy, unspecified' },
  { code: 'G43.9', text: 'Migraine, unspecified' },
  { code: 'G44.2', text: 'Tension-type headache' },
  { code: 'G47.3', text: 'Sleep apnoea' },
  { code: 'G62.9', text: 'Polyneuropathy, unspecified' },
  { code: 'G81.9', text: 'Hemiplegia, unspecified' },
  // Eye / Ear
  { code: 'H10.9', text: 'Conjunctivitis, unspecified' },
  { code: 'H25.9', text: 'Age-related cataract' },
  { code: 'H40.9', text: 'Glaucoma, unspecified' },
  { code: 'H66.9', text: 'Otitis media, unspecified' },
  { code: 'H91.9', text: 'Hearing loss, unspecified' },
  // Circulatory
  { code: 'I10', text: 'Essential Hypertension' },
  { code: 'I20.9', text: 'Angina pectoris, unspecified' },
  { code: 'I21.9', text: 'Acute myocardial infarction' },
  { code: 'I25.1', text: 'Atherosclerotic heart disease' },
  { code: 'I25.9', text: 'Chronic ischaemic heart disease' },
  { code: 'I48', text: 'Atrial fibrillation' },
  { code: 'I48.1', text: 'Persistent atrial fibrillation' },
  { code: 'I49.9', text: 'Cardiac arrhythmia, unspecified' },
  { code: 'I50.9', text: 'Heart failure, unspecified' },
  { code: 'I63.9', text: 'Cerebral infarction' },
  { code: 'I64', text: 'Stroke, not specified' },
  { code: 'I67.2', text: 'Cerebral atherosclerosis' },
  { code: 'I70.9', text: 'Generalised atherosclerosis' },
  { code: 'I74.9', text: 'Arterial embolism / thrombosis' },
  { code: 'I80.9', text: 'Deep vein thrombosis (DVT)' },
  { code: 'I83.9', text: 'Varicose veins of lower extremities' },
  // Respiratory
  { code: 'J01.9', text: 'Acute sinusitis' },
  { code: 'J02.9', text: 'Acute pharyngitis' },
  { code: 'J03.9', text: 'Acute tonsillitis' },
  { code: 'J04.0', text: 'Acute laryngitis' },
  { code: 'J06.9', text: 'Acute Upper Respiratory Infection' },
  { code: 'J15.9', text: 'Bacterial pneumonia, unspecified' },
  { code: 'J18.9', text: 'Pneumonia, unspecified' },
  { code: 'J20.9', text: 'Acute bronchitis' },
  { code: 'J30.4', text: 'Allergic rhinitis' },
  { code: 'J32.9', text: 'Chronic sinusitis' },
  { code: 'J35.0', text: 'Chronic tonsillitis' },
  { code: 'J42', text: 'Chronic bronchitis' },
  { code: 'J44.1', text: 'COPD with Acute Exacerbation' },
  { code: 'J44.9', text: 'COPD, unspecified' },
  { code: 'J45.0', text: 'Allergic asthma' },
  { code: 'J45.9', text: 'Asthma, unspecified' },
  { code: 'J80', text: 'ARDS' },
  { code: 'J96.9', text: 'Respiratory failure, unspecified' },
  // Digestive
  { code: 'K04.7', text: 'Periapical abscess / dental infection' },
  { code: 'K21.0', text: 'GERD with Esophagitis' },
  { code: 'K25.9', text: 'Gastric ulcer' },
  { code: 'K26.9', text: 'Duodenal ulcer' },
  { code: 'K29.5', text: 'Chronic gastritis' },
  { code: 'K29.7', text: 'Gastritis, unspecified' },
  { code: 'K30', text: 'Functional dyspepsia' },
  { code: 'K35.9', text: 'Acute appendicitis' },
  { code: 'K40.9', text: 'Inguinal hernia' },
  { code: 'K52.9', text: 'Non-infective gastroenteritis' },
  { code: 'K56.7', text: 'Intestinal obstruction' },
  { code: 'K57.3', text: 'Diverticulitis of large intestine' },
  { code: 'K59.0', text: 'Constipation' },
  { code: 'K70.3', text: 'Alcoholic cirrhosis of liver' },
  { code: 'K74.6', text: 'Cirrhosis of liver' },
  { code: 'K75.9', text: 'Hepatitis, unspecified' },
  { code: 'K76.0', text: 'Fatty liver, non-alcoholic' },
  { code: 'K80.2', text: 'Cholelithiasis with cholecystitis' },
  { code: 'K80.5', text: 'Choledocholithiasis' },
  { code: 'K85.9', text: 'Acute pancreatitis' },
  { code: 'K92.0', text: 'Haematemesis' },
  // Dermatology
  { code: 'L00', text: 'Impetigo' },
  { code: 'L03.9', text: 'Cellulitis, unspecified' },
  { code: 'L08.9', text: 'Local skin infection' },
  { code: 'L20.9', text: 'Atopic dermatitis / eczema' },
  { code: 'L23.9', text: 'Allergic contact dermatitis' },
  { code: 'L24.9', text: 'Irritant contact dermatitis' },
  { code: 'L27.0', text: 'Generalised drug eruption' },
  { code: 'L29.9', text: 'Pruritus, unspecified' },
  { code: 'L30.0', text: 'Nummular dermatitis' },
  { code: 'L40.0', text: 'Psoriasis vulgaris' },
  { code: 'L40.5', text: 'Arthropathic psoriasis' },
  { code: 'L50.9', text: 'Urticaria, unspecified' },
  { code: 'L60.0', text: 'Ingrowing nail' },
  { code: 'L70.0', text: 'Acne vulgaris' },
  { code: 'L73.0', text: 'Acne keloidalis nuchae' },
  { code: 'L81.9', text: 'Pigmentation disorder' },
  { code: 'L89.9', text: 'Pressure ulcer / bedsore' },
  { code: 'L90.5', text: 'Scar / fibrosis' },
  { code: 'L93.0', text: 'Discoid lupus erythematosus' },
  { code: 'L98.9', text: 'Skin ulcer, unspecified' },
  // Musculoskeletal / Connective Tissue
  { code: 'M05.9', text: 'Rheumatoid arthritis, unspecified' },
  { code: 'M10.9', text: 'Gout, unspecified' },
  { code: 'M17.9', text: 'Osteoarthritis of knee' },
  { code: 'M19.9', text: 'Osteoarthritis, unspecified' },
  { code: 'M25.5', text: 'Joint pain' },
  { code: 'M35.3', text: 'Polymyalgia rheumatica' },
  { code: 'M48.0', text: 'Spinal stenosis' },
  { code: 'M51.2', text: 'Lumbar disc displacement' },
  { code: 'M54.5', text: 'Low back pain' },
  { code: 'M54.3', text: 'Sciatica' },
  { code: 'M62.8', text: 'Muscle weakness / myopathy' },
  { code: 'M75.1', text: 'Rotator cuff tear / syndrome' },
  { code: 'M79.1', text: 'Myalgia' },
  { code: 'M79.2', text: 'Neuralgia / neuritis' },
  { code: 'M81.9', text: 'Osteoporosis, unspecified' },
  { code: 'M84.3', text: 'Stress fracture / pathological fracture' },
  // Genitourinary
  { code: 'N10', text: 'Acute pyelonephritis' },
  { code: 'N17.9', text: 'Acute renal failure' },
  { code: 'N18.5', text: 'Chronic kidney disease, Stage 5' },
  { code: 'N18.9', text: 'Chronic kidney disease, unspecified' },
  { code: 'N20.0', text: 'Renal calculus' },
  { code: 'N20.1', text: 'Ureteral calculus' },
  { code: 'N30.0', text: 'Acute cystitis' },
  { code: 'N30.9', text: 'Cystitis, unspecified' },
  { code: 'N31.9', text: 'Urinary retention' },
  { code: 'N39.0', text: 'Urinary tract infection, site not specified' },
  { code: 'N40.0', text: 'Benign prostatic hyperplasia (BPH)' },
  { code: 'N41.9', text: 'Prostatitis' },
  { code: 'N76.0', text: 'Acute vaginitis / vulvitis' },
  // Pregnancy / Childbirth
  { code: 'O10.9', text: 'Pre-existing hypertension in pregnancy' },
  { code: 'O14.9', text: 'Preeclampsia, unspecified' },
  { code: 'O21.9', text: 'Hyperemesis gravidarum' },
  { code: 'O24.4', text: 'Gestational diabetes mellitus' },
  { code: 'O80', text: 'Normal spontaneous delivery' },
  { code: 'O82', text: 'Caesarean delivery' },
  // Perinatal
  { code: 'P05.1', text: 'Small for gestational age / IUGR' },
  { code: 'P22.9', text: 'Respiratory distress of newborn' },
  { code: 'P59.9', text: 'Neonatal jaundice, unspecified' },
  // Congenital / Chromosomal
  { code: 'Q21.1', text: 'Atrial septal defect' },
  { code: 'Q24.9', text: 'Congenital heart disease, unspecified' },
  // Symptoms NEC
  { code: 'R00.0', text: 'Tachycardia, unspecified' },
  { code: 'R05', text: 'Cough' },
  { code: 'R06.0', text: 'Dyspnoea' },
  { code: 'R10.4', text: 'Abdominal pain, unspecified' },
  { code: 'R11', text: 'Nausea / vomiting' },
  { code: 'R31.0', text: 'Pain on urination / dysuria' },
  { code: 'R42', text: 'Dizziness / giddiness' },
  { code: 'R50.9', text: 'Fever, unspecified' },
  { code: 'R51', text: 'Headache' },
  { code: 'R53', text: 'Malaise / fatigue' },
  { code: 'R55', text: 'Syncope / collapse' },
  { code: 'R57.0', text: 'Hypovolaemic shock' },
  { code: 'R57.2', text: 'Septic shock' },
  { code: 'R60.0', text: 'Localised oedema' },
  { code: 'R60.9', text: 'Oedema, unspecified' },
  { code: 'R64', text: 'Cachexia' },
  { code: 'R79.8', text: 'Electrolyte imbalance' },
  { code: 'R94.3', text: 'Abnormal ECG findings' },
  // Injury / Poisoning
  { code: 'S00.9', text: 'Superficial head injury' },
  { code: 'S06.0', text: 'Concussion' },
  { code: 'S06.9', text: 'Intracranial injury, unspecified' },
  { code: 'S22.4', text: 'Rib fracture' },
  { code: 'S42.0', text: 'Clavicle fracture' },
  { code: 'S42.3', text: 'Humeral fracture' },
  { code: 'S52.5', text: 'Distal radius fracture (Colles)' },
  { code: 'S62.6', text: 'Metacarpal fracture' },
  { code: 'S72.0', text: 'Neck of femur fracture' },
  { code: 'S82.6', text: 'Ankle fracture, medial / lateral malleolus' },
  { code: 'S92.0', text: 'Calcaneal fracture' },
  { code: 'T14.3', text: 'Laceration / open wound, unspecified' },
  { code: 'T30.0', text: 'Burn, unspecified degree, body region unspecified' },
  { code: 'T42.4', text: 'Benzodiazepine poisoning' },
  { code: 'T78.2', text: 'Anaphylactic shock, unspecified' },
  { code: 'T79.9', text: 'Traumatic compartment syndrome' },
  // External causes (supplementary)
  { code: 'V89.2', text: 'Road traffic accident (injuries)' },
  { code: 'W19', text: 'Fall, unspecified' },
  // Z codes
  { code: 'Z00.0', text: 'General medical examination' },
  { code: 'Z00.1', text: 'Routine child health examination' },
  { code: 'Z01.8', text: 'Pre-operative examination' },
  { code: 'Z23', text: 'Immunisation / vaccination encounter' },
  { code: 'Z30.0', text: 'Contraception counselling' },
  { code: 'Z34.9', text: 'Supervision of normal pregnancy' },
  { code: 'Z51.1', text: 'Chemotherapy session' },
];

const certaintyStyle = {
  confirmed: 'bg-emerald-500/10 text-emerald-700',
  provisional: 'bg-amber-500/10 text-amber-700',
  differential: 'bg-blue-500/10 text-blue-700',
};

export default function ConsultationDiagnosis({ diagnoses, onChange }: Props) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [certainty, setCertainty] = useState<'confirmed' | 'provisional' | 'differential'>('confirmed');

  const filtered = ICD_SUGGESTIONS.filter(s =>
    s.text.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const addDiagnosis = (code: string, text: string) => {
    const type = diagnoses.length === 0 ? 'primary' : 'secondary';
    onChange([...diagnoses, { id: Date.now().toString(), code, text, type, certainty }]);
    setSearch('');
    setShowSuggestions(false);
  };

  return (
    <div className="border rounded-xl bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-3">
        <Stethoscope className="w-3.5 h-3.5" /> Diagnosis (ICD-10)
      </p>

      {/* Clinical Decision Support hint */}
      {diagnoses.length === 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-1.5 mb-2">
          <AlertTriangle className="w-3 h-3" />
          Recording a diagnosis is mandatory before finalizing consultation.
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {diagnoses.map(d => (
          <span key={d.id} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${certaintyStyle[d.certainty]}`}>
            <span className="font-mono text-[10px] opacity-70">{d.code}</span> {d.text}
            {d.type === 'primary' && <span className="text-[9px] font-bold ml-0.5">★</span>}
            <button onClick={() => onChange(diagnoses.filter(x => x.id !== d.id))}><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>

      <div className="flex gap-1.5 relative">
        <Input
          placeholder="Search ICD-10 diagnosis..."
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          className="h-7 text-xs flex-1"
        />
        <Select value={certainty} onValueChange={(value) => setCertainty(value as 'confirmed' | 'provisional' | 'differential')}>
          <SelectTrigger className="h-7 text-xs w-[130px]">
            <SelectValue placeholder="Certainty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="provisional">Provisional</SelectItem>
            <SelectItem value="differential">Differential</SelectItem>
          </SelectContent>
        </Select>

        {showSuggestions && search && (
          <div className="absolute top-full left-0 right-32 mt-1 bg-card border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
            {filtered.map(s => (
              <button key={s.code} onClick={() => addDiagnosis(s.code, s.text)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors flex items-center gap-2">
                <span className="font-mono text-[10px] text-muted-foreground w-12">{s.code}</span>
                <span>{s.text}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <button onClick={() => addDiagnosis('', search)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-accent text-muted-foreground">
                Add "{search}" as custom diagnosis
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export type { Diagnosis };
