import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock, FileText, Shield } from 'lucide-react';

const credentials = [
  { id: 'CRD-001', staff: 'Dr. Rajesh Kumar', role: 'Doctor', license: 'MCI Registration', number: 'MCI-2015-GJ-45678', issuer: 'Medical Council of India', issued: '2020-01-15', expiry: '2025-01-15', daysLeft: 312, status: 'Valid' },
  { id: 'CRD-002', staff: 'Dr. Ananya Mishra', role: 'Doctor', license: 'MCI Registration', number: 'MCI-2023-MH-78901', issuer: 'Medical Council of India', issued: '2023-06-01', expiry: '2028-06-01', daysLeft: 1546, status: 'Valid' },
  { id: 'CRD-003', staff: 'Dr. Vikram Singh', role: 'Doctor', license: 'MCI Registration', number: 'MCI-2014-GJ-12345', issuer: 'Medical Council of India', issued: '2019-03-10', expiry: '2024-03-10', daysLeft: 2, status: 'Expiring' },
  { id: 'CRD-004', staff: 'Nurse Priya Shah', role: 'Nurse', license: 'GNC Registration', number: 'GNC-2018-GJ-56789', issuer: 'Gujarat Nursing Council', issued: '2021-07-01', expiry: '2024-07-01', daysLeft: 115, status: 'Valid' },
  { id: 'CRD-005', staff: 'Mohammed Irfan', role: 'Pharmacist', license: 'Pharmacy Council License', number: 'PCI-2017-GJ-34567', issuer: 'Pharmacy Council of India', issued: '2022-02-15', expiry: '2024-02-15', daysLeft: -22, status: 'Expired' },
  { id: 'CRD-006', staff: 'Amit Patel', role: 'Lab Tech', license: 'DMLT Certificate', number: 'DMLT-2020-GJ-89012', issuer: 'Gujarat University', issued: '2020-08-01', expiry: null, daysLeft: null, status: 'No Expiry' },
  { id: 'CRD-007', staff: 'Dr. Sharma', role: 'Doctor', license: 'BLS Certification', number: 'BLS-AHA-2023-1234', issuer: 'American Heart Association', issued: '2023-09-01', expiry: '2025-09-01', daysLeft: 542, status: 'Valid' },
];

const STATUS_STYLE: Record<string, string> = {
  Valid: 'bg-success/10 text-success',
  Expiring: 'bg-warning/10 text-warning',
  Expired: 'bg-destructive/10 text-destructive',
  'No Expiry': 'bg-muted text-muted-foreground',
};

export default function HRCredentials() {
  const expiring = credentials.filter(c => c.status === 'Expiring').length;
  const expired = credentials.filter(c => c.status === 'Expired').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Credentials & Licenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Track professional licenses, certifications, and compliance</p>
        </div>
        <Button className="gap-2"><Shield className="w-4 h-4" />Add Credential</Button>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <CheckCircle className="w-4 h-4 text-success mb-2" />
          <p className="text-xl font-bold text-foreground">{credentials.filter(c => c.status === 'Valid').length}</p>
          <p className="text-xs text-muted-foreground">Valid Credentials</p>
        </Card>
        <Card className="p-4 border-warning/30">
          <AlertTriangle className="w-4 h-4 text-warning mb-2" />
          <p className="text-xl font-bold text-foreground">{expiring}</p>
          <p className="text-xs text-muted-foreground">Expiring Soon</p>
        </Card>
        <Card className="p-4 border-destructive/30">
          <AlertTriangle className="w-4 h-4 text-destructive mb-2" />
          <p className="text-xl font-bold text-foreground">{expired}</p>
          <p className="text-xs text-muted-foreground">Expired</p>
        </Card>
      </div>

      {/* Credentials List */}
      <div className="space-y-3">
        {credentials.map(c => (
          <Card key={c.id} className={`p-4 border-l-4 ${c.status === 'Expired' ? 'border-l-destructive' : c.status === 'Expiring' ? 'border-l-warning' : 'border-l-transparent'} hover:shadow-sm transition-shadow`}>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] ${STATUS_STYLE[c.status]}`}>{c.status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{c.role}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground">{c.staff}</p>
                <p className="text-xs text-foreground font-medium">{c.license}</p>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>#{c.number}</span>
                  <span>{c.issuer}</span>
                </div>
                {c.expiry && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Expires: {c.expiry}</span>
                    {c.daysLeft !== null && (
                      <span className={c.daysLeft < 0 ? 'text-destructive font-medium' : c.daysLeft < 30 ? 'text-warning font-medium' : ''}>
                        ({c.daysLeft < 0 ? `${Math.abs(c.daysLeft)} days overdue` : `${c.daysLeft} days left`})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-xs"><FileText className="w-3 h-3 mr-1" />View</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}