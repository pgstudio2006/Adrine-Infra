import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, Search, Plus, Stethoscope, Heart, Shield, 
  Wrench, Clock, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';

interface TeamMember {
  id: string;
  name: string;
  role: 'surgeon' | 'assistant' | 'anesthesiologist' | 'nurse' | 'technician';
  specialty: string;
  status: 'available' | 'in_surgery' | 'on_call' | 'off_duty';
  currentSurgery?: string;
  todaySurgeries: number;
  experience: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: 'D-01', name: 'Dr. Rajesh Mehta', role: 'surgeon', specialty: 'General Surgery', status: 'in_surgery', currentSurgery: 'Lap. Cholecystectomy', todaySurgeries: 2, experience: '18 yrs' },
  { id: 'D-02', name: 'Dr. Priya Shah', role: 'surgeon', specialty: 'Orthopedics', status: 'in_surgery', currentSurgery: 'Total Knee Replacement', todaySurgeries: 1, experience: '12 yrs' },
  { id: 'D-03', name: 'Dr. Amit Kapoor', role: 'surgeon', specialty: 'Cardiothoracic', status: 'available', todaySurgeries: 0, experience: '22 yrs' },
  { id: 'D-04', name: 'Dr. Neha Desai', role: 'surgeon', specialty: 'Ophthalmology', status: 'available', todaySurgeries: 0, experience: '8 yrs' },
  { id: 'A-01', name: 'Dr. Vikram Patel', role: 'anesthesiologist', specialty: 'General Anesthesia', status: 'in_surgery', currentSurgery: 'OT-1', todaySurgeries: 3, experience: '15 yrs' },
  { id: 'A-02', name: 'Dr. Sunita Joshi', role: 'anesthesiologist', specialty: 'Regional Anesthesia', status: 'available', todaySurgeries: 1, experience: '10 yrs' },
  { id: 'N-01', name: 'Sr. Priya Nair', role: 'nurse', specialty: 'Scrub Nurse', status: 'in_surgery', currentSurgery: 'OT-1', todaySurgeries: 2, experience: '9 yrs' },
  { id: 'N-02', name: 'Sr. Meena Kumari', role: 'nurse', specialty: 'Circulating Nurse', status: 'in_surgery', currentSurgery: 'OT-2', todaySurgeries: 2, experience: '7 yrs' },
  { id: 'N-03', name: 'Sr. Kavita Sharma', role: 'nurse', specialty: 'Recovery Nurse', status: 'available', todaySurgeries: 2, experience: '5 yrs' },
  { id: 'T-01', name: 'Ravi Kumar', role: 'technician', specialty: 'OT Technician', status: 'in_surgery', currentSurgery: 'OT-1', todaySurgeries: 3, experience: '6 yrs' },
  { id: 'T-02', name: 'Sunil Patil', role: 'technician', specialty: 'Anesthesia Tech', status: 'available', todaySurgeries: 1, experience: '4 yrs' },
  { id: 'D-05', name: 'Dr. Rahul Trivedi', role: 'assistant', specialty: 'General Surgery', status: 'available', todaySurgeries: 1, experience: '3 yrs' },
];

const ROLE_CONFIG = {
  surgeon: { label: 'Surgeon', icon: Stethoscope, color: 'text-foreground' },
  assistant: { label: 'Assistant', icon: Users, color: 'text-info' },
  anesthesiologist: { label: 'Anesthesiologist', icon: Shield, color: 'text-success' },
  nurse: { label: 'OT Nurse', icon: Heart, color: 'text-warning' },
  technician: { label: 'Technician', icon: Wrench, color: 'text-muted-foreground' },
};

const STATUS_CONFIG = {
  available: { label: 'Available', class: 'bg-success/10 text-success border-success/20' },
  in_surgery: { label: 'In Surgery', class: 'bg-warning/10 text-warning border-warning/20' },
  on_call: { label: 'On Call', class: 'bg-info/10 text-info border-info/20' },
  off_duty: { label: 'Off Duty', class: 'bg-muted text-muted-foreground' },
};

const ROLES_FILTER = ['All', 'surgeon', 'anesthesiologist', 'nurse', 'technician', 'assistant'] as const;

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function OTTeams() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const filtered = TEAM_MEMBERS.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const available = TEAM_MEMBERS.filter(m => m.status === 'available').length;
  const inSurgery = TEAM_MEMBERS.filter(m => m.status === 'in_surgery').length;

  return (
    <OperationsModulePage
      module="ot"
      layout="list"
      title="Surgical teams"
      subtitle={`${available} available • ${inSurgery} in surgery • ${TEAM_MEMBERS.length} total staff`}
      actions={<Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add team member</Button>}
    >
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(ROLE_CONFIG).map(([key, config]) => {
          const count = TEAM_MEMBERS.filter(m => m.role === key).length;
          const avail = TEAM_MEMBERS.filter(m => m.role === key && m.status === 'available').length;
          return (
            <motion.div key={key} variants={item}>
              <Card className="border-border/60 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter(key)}>
                <CardContent className="p-4">
                  <config.icon className={`h-4 w-4 mb-2 ${config.color}`} strokeWidth={1.5} />
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground">{config.label}s</p>
                  <p className="text-[10px] text-success mt-1">{avail} available</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1 bg-muted p-0.5 rounded-lg">
          {ROLES_FILTER.map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${roleFilter === r ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {r === 'All' ? 'All' : ROLE_CONFIG[r as keyof typeof ROLE_CONFIG]?.label || r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Team Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(member => {
          const roleConfig = ROLE_CONFIG[member.role];
          const Icon = roleConfig.icon;
          return (
            <motion.div key={member.id} variants={item}>
              <Card className="border-border/60 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{member.name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Icon className="h-3 w-3" /> {roleConfig.label} • {member.specialty}
                        </div>
                      </div>
                    </div>
                    <Badge className={`${STATUS_CONFIG[member.status].class} text-[10px]`}>
                      {STATUS_CONFIG[member.status].label}
                    </Badge>
                  </div>
                  {member.currentSurgery && (
                    <div className="p-2 rounded-md bg-warning/5 border border-warning/20 mb-2 text-[11px]">
                      <span className="text-muted-foreground">Currently in: </span>
                      <span className="font-medium">{member.currentSurgery}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {member.experience} exp</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {member.todaySurgeries} today</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      </motion.div>
    </OperationsModulePage>
  );
}
