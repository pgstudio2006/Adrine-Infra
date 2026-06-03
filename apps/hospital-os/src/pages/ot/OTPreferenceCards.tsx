import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ClipboardList, Search, User, Scissors, Package, Syringe,
  Stethoscope, Plus, Edit3, Eye, Heart, Wrench, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { allowDemoFallback } from '@/lib/platform/demo-fallback';

interface PreferenceCard {
  id: string;
  surgeon: string;
  specialty: string;
  procedure: string;
  position: string;
  anesthesia: string;
  incision: string;
  instruments: string[];
  implants: string[];
  sutures: string[];
  drapes: string[];
  medications: string[];
  notes: string;
  lastUsed: string;
}

const DEMO_CARDS: PreferenceCard[] = [
  {
    id: 'PC-001', surgeon: 'Dr. Priya Shah', specialty: 'Orthopedics', procedure: 'Total Knee Replacement',
    position: 'Supine with knee bolster', anesthesia: 'Spinal + Sedation', incision: 'Midline parapatellar',
    instruments: ['TKR Instrument Set (Zimmer)', 'Bone saw', 'Cement mixer', 'Tourniquet'],
    implants: ['Zimmer NexGen Femoral Component', 'Zimmer NexGen Tibial Baseplate', 'Polyethylene Insert (10mm)'],
    sutures: ['Vicryl 1-0 (deep)', 'Ethilon 3-0 (skin)', 'Staples'],
    drapes: ['Full body drape', 'Stockinette', 'Antimicrobial incise drape'],
    medications: ['Cefuroxime 1.5g IV', 'Tranexamic acid 1g', 'Bupivacaine 0.25% 30ml'],
    notes: 'Use long-acting spinal. Cement 2 packs. Drain placed before closure.',
    lastUsed: '8 Mar 2026',
  },
  {
    id: 'PC-002', surgeon: 'Dr. Rajesh Mehta', specialty: 'General Surgery', procedure: 'Laparoscopic Cholecystectomy',
    position: 'Supine, arms tucked', anesthesia: 'General Anesthesia', incision: '4-port laparoscopic',
    instruments: ['Laparoscopic tower (Stryker)', '30° scope 5mm', 'Hooks (monopolar)', 'Clip applier', 'Graspers', 'Scissors'],
    implants: [],
    sutures: ['Monocryl 3-0 (port sites)', 'Dermabond'],
    drapes: ['Four-quadrant drape', 'Body drape'],
    medications: ['Cefazolin 2g IV', 'Ondansetron 4mg', 'Ketorolac 30mg'],
    notes: 'Reverse Trendelenburg. Left tilt. Check for CBD stones on IOC if indicated.',
    lastUsed: '8 Mar 2026',
  },
  {
    id: 'PC-003', surgeon: 'Dr. Amit Kapoor', specialty: 'Cardiothoracic', procedure: 'CABG',
    position: 'Supine with arms tucked', anesthesia: 'General + TEE', incision: 'Median sternotomy',
    instruments: ['Sternotomy saw', 'CABG instrument set', 'Retractor (Cosgrove)', 'Micro scissors', 'Proximal anastomosis device'],
    implants: ['LIMA graft', 'SVG graft', 'Pacing wires', 'Chest tubes (28Fr × 2)'],
    sutures: ['Prolene 7-0 (anastomosis)', 'Prolene 5-0 (proximal)', 'Stainless steel wires (sternum)'],
    drapes: ['Cardiac drape with pouch', 'Head drape', 'Leg drape (SVG harvest)'],
    medications: ['Heparin 300U/kg', 'Protamine 1mg/100U heparin', 'Amiodarone 150mg', 'Norepinephrine drip'],
    notes: 'CPB on standby. TEE probe placed. Cell saver connected.',
    lastUsed: '6 Mar 2026',
  },
  {
    id: 'PC-004', surgeon: 'Dr. Neha Desai', specialty: 'Ophthalmology', procedure: 'Cataract Surgery (Phaco)',
    position: 'Supine', anesthesia: 'Topical + MAC', incision: 'Clear corneal (2.8mm)',
    instruments: ['Phacoemulsifier (Alcon)', 'Microscope (Zeiss)', 'IOL injector', 'Capsulorhexis forceps'],
    implants: ['IOL (Alcon AcrySof SN60WF)', 'Viscoelastic (Provisc)'],
    sutures: ['Nylon 10-0 (if needed)'],
    drapes: ['Ophthalmic drape', 'Head cover'],
    medications: ['Proparacaine drops', 'Phenylephrine 2.5%', 'Cefuroxime intracameral', 'Ketorolac drops'],
    notes: 'No mydriatic contraindicating. Pre-op biometry in chart.',
    lastUsed: '3 Mar 2026',
  },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTPreferenceCards() {
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const allCards = allowDemoFallback() ? DEMO_CARDS : [];

  const filtered = useMemo(() => {
    return allCards.filter(c => 
      c.surgeon.toLowerCase().includes(search.toLowerCase()) ||
      c.procedure.toLowerCase().includes(search.toLowerCase()) ||
      c.specialty.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, allCards]);

  const active = useMemo(() => {
    if (!selectedCard) return filtered[0];
    return filtered.find(c => c.id === selectedCard) || filtered[0];
  }, [filtered, selectedCard]);

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Surgeon Preference Cards"
      subtitle={`${allCards.length} cards · ${new Set(allCards.map(c => c.surgeon)).size} surgeons`}
      actions={
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New card</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New preference card</DialogTitle></DialogHeader>
            <div className="grid gap-3 mt-2">
              <div><Label>Surgeon</Label><Input className="mt-1" /></div>
              <div><Label>Procedure</Label><Input className="mt-1" /></div>
              <div><Label>Instruments</Label><Input className="mt-1" placeholder="Comma-separated" /></div>
              <Button size="sm" onClick={() => { toast.success('Preference card created'); }}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        {/* Search */}
        <motion.div variants={item} className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search surgeon or procedure..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Cards List */}
          <motion.div variants={item} className="space-y-2">
            <span className="text-xs font-medium tracking-[0.1em] uppercase text-muted-foreground">Preference Cards</span>
            {filtered.map(c => (
              <Card key={c.id} onClick={() => setSelectedCard(c.id)}
                className={`border-border/60 cursor-pointer transition-all hover:shadow-md ${selectedCard === c.id ? 'ring-1 ring-foreground/20 shadow-md' : ''}`}>
                <CardContent className="p-3">
                  <p className="text-sm font-semibold">{c.procedure}</p>
                  <p className="text-[11px] text-muted-foreground">{c.surgeon} • {c.specialty}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Last used: {c.lastUsed}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Card Detail */}
          {active && (
            <motion.div variants={item} className="md:col-span-2">
              <Card className="border-border/60">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/40">
                    <div>
                      <h2 className="text-lg font-bold">{active.procedure}</h2>
                      <p className="text-sm text-muted-foreground">{active.surgeon} • {active.specialty}</p>
                    </div>
                    <Badge className="bg-muted text-muted-foreground text-[10px]">Last: {active.lastUsed}</Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Position</p>
                        <p className="text-xs font-medium">{active.position}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Anesthesia</p>
                        <p className="text-xs font-medium">{active.anesthesia}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Incision / Approach</p>
                        <p className="text-xs font-medium">{active.incision}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <Wrench className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">Instruments</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {active.instruments.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-muted text-[10px]">{t}</span>
                        ))}
                      </div>

                      {active.implants.length > 0 && (
                        <>
                          <div className="flex items-center gap-1 mb-2 mt-3">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] font-medium uppercase text-muted-foreground">Implants</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {active.implants.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full bg-info/10 text-info text-[10px]">{t}</span>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="flex items-center gap-1 mb-2 mt-3">
                        <Syringe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium uppercase text-muted-foreground">Medications</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {active.medications.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[10px]">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {active.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/40">
                      <p className="text-[10px] text-muted-foreground mb-1">Notes</p>
                      <p className="text-xs italic">{active.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </OperationsModulePage>
  );
}
