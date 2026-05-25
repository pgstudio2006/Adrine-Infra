import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Monitor, Search, Plus, CheckCircle2, AlertTriangle, 
  Wrench, Calendar, MapPin, Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  department: string;
  location: string;
  purchaseDate: string;
  warrantyUntil: string;
  status: 'operational' | 'maintenance' | 'repair' | 'decommissioned';
  lastService: string;
  nextService: string;
  value: string;
}

const EQUIPMENT_LIST: Equipment[] = [
  { id: 'EQP-001', name: 'Ventilator (ICU)', serialNumber: 'DRG-V500-2241', department: 'ICU', location: 'ICU Bed-03', purchaseDate: 'Jan 2024', warrantyUntil: 'Jan 2029', status: 'operational', lastService: '15 Feb 2026', nextService: '15 May 2026', value: '₹18,00,000' },
  { id: 'EQP-002', name: 'Defibrillator', serialNumber: 'PHI-DF-8810', department: 'Emergency', location: 'ER Bay-1', purchaseDate: 'Mar 2023', warrantyUntil: 'Mar 2028', status: 'operational', lastService: '01 Mar 2026', nextService: '01 Jun 2026', value: '₹5,50,000' },
  { id: 'EQP-003', name: 'C-Arm (Fluoroscopy)', serialNumber: 'SIE-CA-3345', department: 'OT', location: 'OT-2', purchaseDate: 'Jun 2022', warrantyUntil: 'Jun 2027', status: 'operational', lastService: '20 Feb 2026', nextService: '20 Apr 2026', value: '₹45,00,000' },
  { id: 'EQP-004', name: 'Patient Monitor (5-Para)', serialNumber: 'PHI-PM-1120', department: 'General Ward', location: 'GW-Station', purchaseDate: 'Sep 2024', warrantyUntil: 'Sep 2029', status: 'maintenance', lastService: '05 Mar 2026', nextService: '—', value: '₹2,20,000' },
  { id: 'EQP-005', name: 'Autoclave (Large)', serialNumber: 'TUT-AC-5567', department: 'CSSD', location: 'CSSD Room', purchaseDate: 'Nov 2021', warrantyUntil: 'Nov 2026', status: 'operational', lastService: '28 Feb 2026', nextService: '28 May 2026', value: '₹8,00,000' },
  { id: 'EQP-006', name: 'ECG Machine (12-Lead)', serialNumber: 'GE-ECG-7789', department: 'Cardiology', location: 'Cardio OPD', purchaseDate: 'Apr 2023', warrantyUntil: 'Apr 2028', status: 'repair', lastService: '10 Feb 2026', nextService: '—', value: '₹3,50,000' },
  { id: 'EQP-007', name: 'Syringe Pump', serialNumber: 'BBR-SP-2234', department: 'ICU', location: 'ICU Bed-01', purchaseDate: 'Feb 2025', warrantyUntil: 'Feb 2030', status: 'operational', lastService: '01 Mar 2026', nextService: '01 Jun 2026', value: '₹85,000' },
  { id: 'EQP-008', name: 'Oxygen Concentrator', serialNumber: 'PHI-OC-4456', department: 'General Ward', location: 'GW-Store', purchaseDate: 'May 2024', warrantyUntil: 'May 2029', status: 'operational', lastService: '22 Feb 2026', nextService: '22 May 2026', value: '₹1,20,000' },
];

const STATUS_CONFIG = {
  operational: { label: 'Operational', class: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  maintenance: { label: 'Under Maintenance', class: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  repair: { label: 'Under Repair', class: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  decommissioned: { label: 'Decommissioned', class: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function InventoryEquipment() {
  const [search, setSearch] = useState('');

  const filtered = EQUIPMENT_LIST.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase())
  );

  const operational = EQUIPMENT_LIST.filter(e => e.status === 'operational').length;
  const issues = EQUIPMENT_LIST.filter(e => e.status === 'maintenance' || e.status === 'repair').length;

  return (
    <OperationsModulePage module="inventory" layout="list" title="Equipment registry" subtitle={`${EQUIPMENT_LIST.length} assets • ${operational} operational • ${issues} need attention`} actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Register equipment</Button>}>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(equip => (
          <motion.div key={equip.id} variants={item}>
            <Card className={`border-border/60 hover:shadow-md transition-all cursor-pointer ${equip.status === 'repair' ? 'ring-1 ring-destructive/20' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center">
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{equip.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{equip.serialNumber}</p>
                    </div>
                  </div>
                  <Badge className={`${STATUS_CONFIG[equip.status].class} text-[10px]`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[equip.status].dot} mr-1.5`} />
                    {STATUS_CONFIG[equip.status].label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {equip.department} — {equip.location}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Purchased: {equip.purchaseDate}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Wrench className="h-3 w-3" />
                    <span>Last service: {equip.lastService}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {equip.nextService !== '—' ? (
                      <span className="text-muted-foreground">Next: <span className="font-medium text-foreground">{equip.nextService}</span></span>
                    ) : (
                      <span className="text-warning font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Service needed</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Value: <span className="font-medium text-foreground">{equip.value}</span></span>
                  <span>Warranty: {equip.warrantyUntil}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      </motion.div>
    </OperationsModulePage>
  );
}
