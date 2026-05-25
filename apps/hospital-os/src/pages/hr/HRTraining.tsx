import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, CheckCircle, Clock, Plus, Users } from 'lucide-react';

const trainingPrograms = [
  { id: 'TRN-001', name: 'Basic Life Support (BLS)', type: 'Mandatory', targetRoles: ['Doctor', 'Nurse', 'Emergency'], enrolled: 45, completed: 38, compliance: 84, deadline: '2024-06-30' },
  { id: 'TRN-002', name: 'Fire Safety & Evacuation', type: 'Mandatory', targetRoles: ['All Staff'], enrolled: 342, completed: 310, compliance: 91, deadline: '2024-04-30' },
  { id: 'TRN-003', name: 'Infection Control Protocol', type: 'Mandatory', targetRoles: ['Doctor', 'Nurse', 'Lab Tech'], enrolled: 120, completed: 98, compliance: 82, deadline: '2024-05-15' },
  { id: 'TRN-004', name: 'EMR System Training', type: 'Onboarding', targetRoles: ['New Joiners'], enrolled: 8, completed: 5, compliance: 63, deadline: '2024-03-31' },
  { id: 'TRN-005', name: 'Advanced Cardiac Life Support', type: 'Optional', targetRoles: ['Doctor', 'Nurse'], enrolled: 22, completed: 22, compliance: 100, deadline: null },
  { id: 'TRN-006', name: 'NABH Quality Standards', type: 'Mandatory', targetRoles: ['All Staff'], enrolled: 342, completed: 280, compliance: 82, deadline: '2024-09-30' },
];

const recentCertifications = [
  { staff: 'Nurse Priya Shah', program: 'BLS Recertification', date: '2024-03-05', valid: '2026-03-05' },
  { staff: 'Dr. Sharma', program: 'ACLS Provider', date: '2024-02-20', valid: '2026-02-20' },
  { staff: 'Nurse Geeta', program: 'Fire Safety', date: '2024-03-01', valid: '2025-03-01' },
  { staff: 'Tech. Amit', program: 'Infection Control', date: '2024-02-28', valid: '2025-02-28' },
];

export default function HRTraining() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Training & Certifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Track training programs, compliance, and staff certifications</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />New Program</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <GraduationCap className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-xl font-bold text-foreground">{trainingPrograms.length}</p>
          <p className="text-xs text-muted-foreground">Active Programs</p>
        </Card>
        <Card className="p-4">
          <CheckCircle className="w-4 h-4 text-success mb-2" />
          <p className="text-xl font-bold text-foreground">{trainingPrograms.filter(t => t.compliance === 100).length}</p>
          <p className="text-xs text-muted-foreground">Fully Compliant</p>
        </Card>
        <Card className="p-4">
          <Users className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-xl font-bold text-foreground">{recentCertifications.length}</p>
          <p className="text-xs text-muted-foreground">Recent Certifications</p>
        </Card>
      </div>

      {/* Training Programs */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Training Programs</h2>
        <div className="space-y-3">
          {trainingPrograms.map(t => (
            <Card key={t.id} className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{t.name}</h3>
                    <Badge variant={t.type === 'Mandatory' ? 'destructive' : t.type === 'Onboarding' ? 'outline' : 'secondary'} className="text-[10px]">{t.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {t.targetRoles.map(r => <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>)}
                  </div>
                </div>
                {t.deadline && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />Due: {t.deadline}</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{t.completed}/{t.enrolled} completed</span>
                    <span>{t.compliance}%</span>
                  </div>
                  <Progress value={t.compliance} className={`h-2 ${t.compliance === 100 ? '[&>div]:bg-success' : t.compliance < 70 ? '[&>div]:bg-warning' : ''}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Certifications */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Certifications</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {recentCertifications.map((c, i) => (
            <Card key={i} className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{c.staff}</p>
                <p className="text-xs text-muted-foreground">{c.program}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Certified: {c.date}</p>
                <p className="text-[10px] text-muted-foreground">Valid until: {c.valid}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}