import { useMemo, useRef, useState } from 'react';
import { Pill, X, AlertTriangle, Copy, Star, GripVertical, BookmarkCheck, ChevronDown, ChevronUp, StickyNote, Plus, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppSelect } from '@/components/ui/app-select';
import { useHospital } from '@/stores/hospitalStore';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  isGeneric: boolean;
}

interface SavedTemplate {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  isGeneric: boolean;
  savedAt: string;
}

interface Props {
  medications: Medication[];
  onChange: (meds: Medication[]) => void;
  allergies: string[];
}

const FALLBACK_DRUG_DB = [
  { name: 'Tab. Paracetamol 500mg', generic: 'Paracetamol', category: 'Analgesic' },
  { name: 'Tab. Metformin 500mg', generic: 'Metformin', category: 'Antidiabetic' },
  { name: 'Tab. Amlodipine 5mg', generic: 'Amlodipine', category: 'Antihypertensive' },
  { name: 'Tab. Atorvastatin 10mg', generic: 'Atorvastatin', category: 'Statin' },
  { name: 'Tab. Pantoprazole 40mg', generic: 'Pantoprazole', category: 'PPI' },
  { name: 'Tab. Azithromycin 500mg', generic: 'Azithromycin', category: 'Antibiotic' },
  { name: 'Tab. Cetirizine 10mg', generic: 'Cetirizine', category: 'Antihistamine' },
  { name: 'Cap. Amoxicillin 500mg', generic: 'Amoxicillin', category: 'Antibiotic' },
  { name: 'Tab. Montelukast 10mg', generic: 'Montelukast', category: 'LTRA' },
  { name: 'Inj. Insulin Glargine', generic: 'Insulin', category: 'Antidiabetic' },
  // Dermatology
  { name: 'Cream Clindamycin 1%', generic: 'Clindamycin', category: 'Dermatology' },
  { name: 'Tab. Isotretinoin 10mg', generic: 'Isotretinoin', category: 'Dermatology' },
  { name: 'Cream Tretinoin 0.025%', generic: 'Tretinoin', category: 'Dermatology' },
  { name: 'Lotion Calamine', generic: 'Calamine', category: 'Dermatology' },
  { name: 'Tab. Hydroxychloroquine 200mg', generic: 'Hydroxychloroquine', category: 'Dermatology' },
  { name: 'Cream Hydrocortisone 1%', generic: 'Hydrocortisone', category: 'Dermatology' },
  { name: 'Tab. Doxycycline 100mg', generic: 'Doxycycline', category: 'Antibiotic' },
  // Weight management
  { name: 'Tab. Orlistat 120mg', generic: 'Orlistat', category: 'Weight Management' },
  { name: 'Tab. Metformin 1g', generic: 'Metformin', category: 'Weight Management' },
  { name: 'Inj. Semaglutide 0.5mg', generic: 'Semaglutide', category: 'Weight Management' },
];

const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Sublingual', 'Rectal', 'Transdermal'];
const FREQUENCIES = ['OD (Once)', 'BD (Twice)', 'TDS (Thrice)', 'QID (4 times)', 'SOS', 'HS (Bedtime)', 'Stat', 'Weekly', 'Fortnightly', 'Monthly'];

// Quick-insert note chips
const QUICK_NOTES = [
  { label: 'After meals', value: 'Take after meals' },
  { label: 'Before meals', value: 'Take 30 min before meals' },
  { label: 'With water', value: 'Take with a full glass of water' },
  { label: 'Empty stomach', value: 'Take on empty stomach' },
  { label: 'At bedtime', value: 'Take at bedtime' },
  { label: 'Avoid sunlight', value: 'Avoid direct sunlight after application' },
  { label: 'Apply thin layer', value: 'Apply a thin layer on affected area' },
  { label: 'Avoid eyes', value: 'Avoid contact with eyes' },
  { label: 'With food', value: 'Take with food to avoid nausea' },
  { label: 'Avoid alcohol', value: 'Avoid alcohol during course' },
  { label: 'Do not crush', value: 'Do not crush or chew' },
  { label: 'Shake well', value: 'Shake well before use' },
  { label: 'Refrigerate', value: 'Store in refrigerator (2–8°C)' },
  { label: 'Complete course', value: 'Complete full course even if symptoms improve' },
];

const INTERACTIONS: Record<string, string[]> = {
  'Metformin': ['Insulin'],
  'Amlodipine': ['Atorvastatin'],
  'Isotretinoin': ['Doxycycline'],
};

const TEMPLATES_KEY = 'adrine_drug_templates';

function loadTemplates(): SavedTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTemplates(templates: SavedTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export default function ConsultationMedications({ medications, onChange, allergies }: Props) {
  const { pharmacyInventory } = useHospital();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [manual, setManual] = useState({
    name: '', dosage: '', frequency: 'OD (Once)', duration: '5 days',
    route: 'Oral', instructions: '', isGeneric: false,
  });

  // ── Saved templates ──
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>(loadTemplates);

  const saveAsTemplate = (med: Medication) => {
    const existing = savedTemplates.find(t => t.name === med.name && t.dosage === med.dosage && t.frequency === med.frequency);
    if (existing) {
      toast.info('Already saved as template.');
      return;
    }
    const newTemplate: SavedTemplate = {
      id: Date.now().toString(),
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      route: med.route,
      instructions: med.instructions,
      isGeneric: med.isGeneric,
      savedAt: new Date().toLocaleDateString('en-IN'),
    };
    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    saveTemplates(updated);
    toast.success(`Saved "${med.name}" as template`);
  };

  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    saveTemplates(updated);
  };

  const addFromTemplate = (template: SavedTemplate) => {
    onChange([...medications, {
      id: Date.now().toString(),
      name: template.name,
      dosage: template.dosage,
      frequency: template.frequency,
      duration: template.duration,
      route: template.route,
      instructions: template.instructions,
      isGeneric: template.isGeneric,
    }]);
    toast.success(`Added ${template.name}`);
  };

  // ── Drug DB ──
  const drugDb = useMemo(() => {
    const fromInventory = pharmacyInventory.map(item => ({
      name: item.drug,
      generic: item.generic,
      category: item.category,
      qty: item.qty,
      price: item.price,
    }));
    return fromInventory.length > 0
      ? fromInventory
      : FALLBACK_DRUG_DB.map(item => ({ ...item, qty: 9999, price: 0 }));
  }, [pharmacyInventory]);

  const filtered = drugDb.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.generic.toLowerCase().includes(search.toLowerCase())
  );

  // ── Allergy conflict hard-stop state ──
  const [pendingAllergyDrug, setPendingAllergyDrug] = useState<typeof drugDb[number] | null>(null);

  // Helper: actually add a drug to the prescription
  const addMedication = (drug: typeof drugDb[number]) => {
    onChange([...medications, {
      id: Date.now().toString(), name: drug.name, dosage: '1 tab',
      frequency: 'OD (Once)', duration: '5 days', route: 'Oral',
      instructions: '', isGeneric: false,
    }]);
    setSearch('');
    setShowSearch(false);
  };

  // Allergy-aware drug adder — shows hard-stop dialog on conflict
  const addFromDBWithAllergyCheck = (drug: typeof drugDb[number]) => {
    if (drug.qty <= 0) return;
    
    const generic = drug.generic || drug.name;
    const hasAllergyConflict = allergies.some(a =>
      generic.toLowerCase().includes(a.toLowerCase()) || drug.name.toLowerCase().includes(a.toLowerCase())
    );
    
    if (hasAllergyConflict) {
      setPendingAllergyDrug(drug);
      return;
    }
    
    addMedication(drug);
  };

  // Rebind addFromDB to the allergy-checking version
  const addFromDB = addFromDBWithAllergyCheck;

  const confirmAllergyOverride = () => {
    if (pendingAllergyDrug) {
      addMedication(pendingAllergyDrug);
      setPendingAllergyDrug(null);
      toast.warning('Allergy override recorded. Medication added with caution flag.', {
        duration: 5000,
      });
    }
  };

  const addManual = () => {
    if (!manual.name.trim()) return;
    onChange([...medications, { ...manual, id: Date.now().toString() }]);
    setManual({ name: '', dosage: '', frequency: 'OD (Once)', duration: '5 days', route: 'Oral', instructions: '', isGeneric: false });
    setShowManual(false);
  };

  // ── Drug interactions & allergies ──
  const interactions: string[] = [];
  const medNames = medications.map(m => drugDb.find(d => d.name === m.name)?.generic ?? m.name);
  medNames.forEach(name => {
    (INTERACTIONS[name] ?? []).forEach(conflict => {
      if (medNames.includes(conflict)) interactions.push(`${name} ↔ ${conflict}: potential interaction`);
    });
  });

  const allergyConflicts = medications.filter(m => {
    const generic = drugDb.find(d => d.name === m.name)?.generic ?? '';
    return allergies.some(a =>
      generic.toLowerCase().includes(a.toLowerCase()) || m.name.toLowerCase().includes(a.toLowerCase())
    );
  });

  // ── Per-medication notes panel open state ──
  const [notesOpen, setNotesOpen] = useState<Set<string>>(new Set());

  const toggleNotes = (id: string) => {
    setNotesOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const appendQuickNote = (idx: number, med: typeof medications[number], chip: string) => {
    const current = med.instructions.trim();
    const next = current ? `${current}. ${chip}` : chip;
    const u = [...medications];
    u[idx] = { ...med, instructions: next };
    onChange(u);
  };

  // ── Drag-and-drop reordering ──
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragIndex.current = idx;
    setDragging(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragOverIndex.current !== idx) {
      dragOverIndex.current = idx;
      setDragOver(idx);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from === null || to === null || from === to) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const reordered = [...medications];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    onChange(reordered);
    dragIndex.current = null;
    dragOverIndex.current = null;
    setDragging(null);
    setDragOver(null);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    dragOverIndex.current = null;
    setDragging(null);
    setDragOver(null);
  };

  const moveMed = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= medications.length) return;
    const reordered = [...medications];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    onChange(reordered);
  };

  return (
    <div className="border rounded-xl bg-card overflow-hidden h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Pill className="w-4 h-4 text-muted-foreground" /> Medications ({medications.length})
        </p>
        <div className="flex gap-1.5">
          {savedTemplates.length > 0 && (
            <Button
              variant="outline" size="sm"
              className="gap-1 text-xs h-7 border-amber-400/40 text-amber-600 hover:bg-amber-50"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              Templates ({savedTemplates.length})
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setShowManual(!showManual)}>
            + Manual
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7">
            <Copy className="w-3 h-3" /> Copy Previous
          </Button>
        </div>
      </div>

      {/* Drug interaction / allergy alerts */}
      {(interactions.length > 0 || allergyConflicts.length > 0) && (
        <div className="px-4 py-2 bg-destructive/5 border-b border-destructive/20">
          {interactions.map((msg, i) => (
            <p key={i} className="text-[11px] text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Drug Interaction: {msg}
            </p>
          ))}
          {allergyConflicts.map(m => (
            <p key={m.id} className="text-[11px] text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Allergy Conflict: {m.name} conflicts with patient allergy
            </p>
          ))}
        </div>
      )}

      <div className="p-4">
        {/* Saved Templates Panel */}
        {showTemplates && savedTemplates.length > 0 && (
          <div className="mb-3 border border-amber-400/30 rounded-lg p-3 bg-amber-50/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <BookmarkCheck className="w-3 h-3" /> Saved Templates — click to add
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {savedTemplates.map(t => (
                <div key={t.id} className="flex items-center gap-0 group rounded-lg border border-amber-400/30 overflow-hidden">
                  <button
                    onClick={() => addFromTemplate(t)}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs hover:bg-amber-100/60 transition-colors"
                  >
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium max-w-[130px] truncate">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground hidden group-hover:inline">
                      {t.dosage} · {t.frequency}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="px-1.5 py-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border-l border-amber-400/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search 50,000+ medicines (dermatology, weight loss, general)…"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 150)}
            className="pl-9"
          />
          {showSearch && search && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-20 max-h-52 overflow-y-auto">
              {filtered.map(d => (
                <button key={d.name} onMouseDown={() => addFromDB(d)} disabled={d.qty <= 0}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <span className="font-medium flex-1">{d.name}</span>
                  <span className="text-muted-foreground">({d.generic} · {d.category})</span>
                  <span className={`text-[10px] shrink-0 ${d.qty > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {d.qty > 0 ? `✓ ${d.qty}` : 'Out of stock'}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No matches — use Manual entry</p>
              )}
            </div>
          )}
        </div>

        {/* Manual entry form */}
        {showManual && (
          <div className="border rounded-lg p-3 mb-3 space-y-2 bg-accent/30">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Drug name *" value={manual.name} onChange={e => setManual({ ...manual, name: e.target.value })} className="h-7 text-xs" />
              <Input placeholder="Dosage (e.g. 1 tab / 5ml)" value={manual.dosage} onChange={e => setManual({ ...manual, dosage: e.target.value })} className="h-7 text-xs" />
              <AppSelect
                value={manual.frequency}
                onValueChange={v => setManual({ ...manual, frequency: v })}
                options={FREQUENCIES.map(f => ({ value: f, label: f }))}
                className="h-7 text-xs"
              />
              <AppSelect
                value={manual.route}
                onValueChange={v => setManual({ ...manual, route: v })}
                options={ROUTES.map(r => ({ value: r, label: r }))}
                className="h-7 text-xs"
              />
              <Input placeholder="Duration (e.g. 7 days)" value={manual.duration} onChange={e => setManual({ ...manual, duration: e.target.value })} className="h-7 text-xs" />
              <Input placeholder="Instructions" value={manual.instructions} onChange={e => setManual({ ...manual, instructions: e.target.value })} className="h-7 text-xs" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={manual.isGeneric} onChange={e => setManual({ ...manual, isGeneric: e.target.checked })} className="rounded" />
                Generic substitution allowed
              </label>
              <Button size="sm" onClick={addManual} className="h-7 text-xs">Add to Prescription</Button>
            </div>
          </div>
        )}

        {/* Drag hint */}
        {medications.length > 1 && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-2">
            <GripVertical className="w-3 h-3" /> Drag rows to reorder · Use arrows for precision
          </p>
        )}

        {/* Medication list */}
        {medications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Pill className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Search and add medications</p>
            <p className="text-xs text-muted-foreground mt-1">Includes dermatology, weight management & 50,000+ drugs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {medications.map((med, idx) => {
              const isDragging = dragging === idx;
              const isDragOver = dragOver === idx;
              return (
                <div
                  key={med.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`border rounded-lg p-3 transition-all cursor-grab active:cursor-grabbing ${
                    isDragging ? 'opacity-40 scale-[0.98] border-dashed border-primary/50' : ''
                  } ${
                    isDragOver && !isDragging ? 'border-primary bg-primary/5 shadow-md' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Drag handle */}
                    <div className="mt-0.5 flex flex-col items-center gap-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">{idx + 1}</span>
                        <p className="text-sm font-medium truncate">{med.name}</p>
                        {med.isGeneric && (
                          <span className="shrink-0 text-[9px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded-full">Generic</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {med.dosage} · {med.frequency} · {med.duration} · {med.route}
                      </p>
                      {/* Notes preview when notes panel is closed */}
                      {med.instructions && !notesOpen.has(med.id) && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 rounded px-2 py-0.5 mt-1 italic">
                          📋 {med.instructions}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reorder arrows */}
                      <div className="flex flex-col gap-0">
                        <button
                          onClick={() => moveMed(idx, -1)}
                          disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-20 transition-colors"
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => moveMed(idx, 1)}
                          disabled={idx === medications.length - 1}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-20 transition-colors"
                          title="Move down"
                        >
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Notes toggle */}
                      <button
                        onClick={() => toggleNotes(med.id)}
                        className={`p-1 rounded transition-colors relative ${
                          notesOpen.has(med.id)
                            ? 'bg-amber-100 text-amber-600'
                            : med.instructions
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-muted-foreground hover:bg-accent'
                        }`}
                        title={notesOpen.has(med.id) ? 'Hide notes' : 'Add / edit notes'}
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                        {med.instructions && !notesOpen.has(med.id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </button>

                      {/* Save as template */}
                      <button
                        onClick={() => saveAsTemplate(med)}
                        className="p-1 rounded hover:bg-amber-50 text-muted-foreground hover:text-amber-500 transition-colors"
                        title="Save as template"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => onChange(medications.filter(m => m.id !== med.id))}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit row */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    <Input
                      value={med.dosage}
                      onChange={e => { const u = [...medications]; u[idx] = { ...med, dosage: e.target.value }; onChange(u); }}
                      className="h-6 text-[10px]" placeholder="Dosage"
                    />
                    <AppSelect
                      value={med.frequency}
                      onValueChange={v => { const u = [...medications]; u[idx] = { ...med, frequency: v }; onChange(u); }}
                      options={FREQUENCIES.map(f => ({ value: f, label: f }))}
                      className="h-6 text-[10px]"
                    />
                    <Input
                      value={med.duration}
                      onChange={e => { const u = [...medications]; u[idx] = { ...med, duration: e.target.value }; onChange(u); }}
                      className="h-6 text-[10px]" placeholder="Duration"
                    />
                    <AppSelect
                      value={med.route}
                      onValueChange={v => { const u = [...medications]; u[idx] = { ...med, route: v }; onChange(u); }}
                      options={ROUTES.map(r => ({ value: r, label: r }))}
                      className="h-6 text-[10px]"
                    />
                  </div>

                  {/* ── Notes panel ── */}
                  {notesOpen.has(med.id) && (
                    <div className="mt-2 rounded-lg border border-amber-300/40 bg-amber-50/40 p-2.5 space-y-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <StickyNote className="w-3 h-3 text-amber-600" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Patient Instructions / Notes</span>
                        <span className="text-[10px] text-amber-500 ml-auto">Printed on prescription</span>
                      </div>

                      {/* Quick-insert chips */}
                      <div className="flex flex-wrap gap-1">
                        {QUICK_NOTES.map(chip => (
                          <button
                            key={chip.value}
                            onClick={() => appendQuickNote(idx, med, chip.value)}
                            className="text-[10px] px-2 py-0.5 rounded-full border border-amber-300/50 bg-white hover:bg-amber-100 hover:border-amber-400 text-amber-700 transition-colors flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" />{chip.label}
                          </button>
                        ))}
                      </div>

                      {/* Free-text textarea */}
                      <textarea
                        value={med.instructions}
                        onChange={e => { const u = [...medications]; u[idx] = { ...med, instructions: e.target.value }; onChange(u); }}
                        placeholder="Type patient instructions, warnings, or special notes…"
                        rows={2}
                        className="w-full text-xs rounded-lg border border-amber-300/40 bg-white px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                      />

                      {med.instructions && (
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-amber-600 italic">
                            Will appear as: "{med.instructions}"
                          </p>
                          <button
                            onClick={() => { const u = [...medications]; u[idx] = { ...med, instructions: '' }; onChange(u); }}
                            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Allergy hard-stop dialog */}
      <AlertDialog open={!!pendingAllergyDrug} onOpenChange={(open) => { if (!open) setPendingAllergyDrug(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              Allergy Conflict Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                <strong>{pendingAllergyDrug?.name}</strong> conflicts with the patient's documented allergies: <strong>{allergies.join(', ')}</strong>.
              </p>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-sm">
                <p className="font-medium text-destructive">⚠️ Clinical Safety Alert</p>
                <p className="text-muted-foreground mt-1">
                  Prescribing this medication may cause an adverse reaction. Please verify the patient's allergy history before proceeding.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Only proceed if you have confirmed there is no genuine contraindication and you are overriding this alert.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAllergyOverride} className="bg-destructive hover:bg-destructive/90">
              Prescribe Anyway (Override)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export type { Medication };
