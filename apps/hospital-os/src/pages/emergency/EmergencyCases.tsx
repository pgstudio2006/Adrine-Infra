import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useHospital } from '@/stores/hospitalStore';
import {
  EMERGENCY_STATUS_LABELS,
  EMERGENCY_TRIAGE_LABELS,
  isActiveEmergencyCase,
  isClosedEmergencyCase,
} from '@/lib/emergency/emergency-presenters';
import { useEmergencyOperationalStream } from '@/hooks/useEmergencyOperationalStream';

const STATUS_COLORS: Record<string, string> = {
  'Waiting for Triage': 'bg-warning/10 text-warning border-warning/30',
  'Waiting for Doctor': 'bg-info/10 text-info border-info/30',
  'Under Treatment': 'bg-foreground/10 text-foreground border-border',
  'Under Observation': 'bg-accent text-accent-foreground border-border',
  'Transferred to IPD': 'bg-success/10 text-success border-success/30',
  Discharged: 'bg-muted text-muted-foreground border-border',
};

export default function EmergencyCases() {
  const { emergencyCases } = useHospital();
  useEmergencyOperationalStream();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState('active');

  const activeCases = useMemo(
    () => emergencyCases.filter(isActiveEmergencyCase),
    [emergencyCases],
  );
  const closedCases = useMemo(
    () => emergencyCases.filter(isClosedEmergencyCase),
    [emergencyCases],
  );

  const currentList = tab === 'active' ? activeCases : closedCases;
  const filtered = currentList.filter((c) => {
    const statusLabel = EMERGENCY_STATUS_LABELS[c.status];
    if (search && !c.patientName.toLowerCase().includes(search.toLowerCase()) && !c.id.includes(search)) {
      return false;
    }
    if (statusFilter !== 'all' && statusLabel !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Emergency Cases</h1>
        <p className="text-sm text-muted-foreground mt-1">Track all ER patient cases and their status</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({activeCases.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedCases.length})</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search case ID or patient..." className="pl-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_COLORS).map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={tab} className="mt-4">
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="p-4 text-sm text-muted-foreground">No cases match the current filters.</Card>
            ) : (
              filtered.map((c, i) => {
                const statusLabel = EMERGENCY_STATUS_LABELS[c.status];
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="p-4 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{c.id}</span>
                            {c.triage && (
                              <Badge variant={c.triage === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                                {EMERGENCY_TRIAGE_LABELS[c.triage]}
                              </Badge>
                            )}
                            <Badge className={`text-[10px] border ${STATUS_COLORS[statusLabel] || ''}`}>{statusLabel}</Badge>
                            {c.uhid && <Badge variant="outline" className="text-[10px] font-mono">{c.uhid}</Badge>}
                          </div>
                          <p className="font-medium text-sm text-foreground">
                            {c.patientName}{' '}
                            <span className="text-muted-foreground font-normal">
                              · {c.age ?? '—'}{c.gender ?? ''} · {c.arrivalMode}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">{c.complaint}</p>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.createdAt}</span>
                            {c.location && (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.location}</span>
                            )}
                            <span>{c.assignedDoctor ?? 'Unassigned'}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs">
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
