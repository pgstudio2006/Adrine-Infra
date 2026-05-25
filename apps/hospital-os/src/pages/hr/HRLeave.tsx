import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle, XCircle, User } from 'lucide-react';

const leaveRequests = [
  { id: 'LR-0412', staff: 'Nurse Priya Shah', dept: 'ICU', type: 'Casual Leave', from: '2024-03-10', to: '2024-03-12', days: 3, status: 'Pending', reason: 'Family function', applied: '2024-03-06' },
  { id: 'LR-0411', staff: 'Amit Patel', dept: 'Pathology', type: 'Sick Leave', from: '2024-03-09', to: '2024-03-09', days: 1, status: 'Pending', reason: 'Fever and body ache', applied: '2024-03-08' },
  { id: 'LR-0410', staff: 'Rekha Desai', dept: 'Emergency', type: 'Casual Leave', from: '2024-03-07', to: '2024-03-09', days: 3, status: 'Approved', reason: 'Personal work', applied: '2024-03-04' },
  { id: 'LR-0409', staff: 'Dr. Ananya Mishra', dept: 'Cardiology', type: 'Annual Leave', from: '2024-03-15', to: '2024-03-22', days: 8, status: 'Pending', reason: 'Vacation', applied: '2024-03-01' },
  { id: 'LR-0408', staff: 'Sunita Verma', dept: 'Front Desk', type: 'Emergency Leave', from: '2024-03-08', to: '2024-03-08', days: 1, status: 'Approved', reason: 'Family emergency', applied: '2024-03-08' },
  { id: 'LR-0407', staff: 'Tech. Jayesh', dept: 'OT', type: 'Sick Leave', from: '2024-03-05', to: '2024-03-06', days: 2, status: 'Rejected', reason: 'No medical certificate provided', applied: '2024-03-05' },
];

const leaveBalances = [
  { staff: 'Nurse Priya Shah', casual: { used: 4, total: 12 }, sick: { used: 2, total: 10 }, annual: { used: 0, total: 15 } },
  { staff: 'Amit Patel', casual: { used: 6, total: 12 }, sick: { used: 3, total: 10 }, annual: { used: 5, total: 15 } },
  { staff: 'Dr. Ananya Mishra', casual: { used: 2, total: 12 }, sick: { used: 0, total: 10 }, annual: { used: 0, total: 20 } },
];

const STATUS_STYLE: Record<string, 'destructive' | 'outline' | 'secondary' | 'default'> = {
  Pending: 'outline',
  Approved: 'default',
  Rejected: 'destructive',
};

const TYPE_COLORS: Record<string, string> = {
  'Casual Leave': 'bg-info/10 text-info',
  'Sick Leave': 'bg-warning/10 text-warning',
  'Annual Leave': 'bg-success/10 text-success',
  'Emergency Leave': 'bg-destructive/10 text-destructive',
};

export default function HRLeave() {
  const pending = leaveRequests.filter(l => l.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Process leave requests and track balances</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">{pending} Pending Approvals</Badge>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {leaveRequests.map(l => (
            <Card key={l.id} className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{l.id}</span>
                    <Badge className={`text-[10px] ${TYPE_COLORS[l.type] || ''}`}>{l.type}</Badge>
                    <Badge variant={STATUS_STYLE[l.status]} className="text-[10px]">{l.status}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{l.staff} <span className="text-muted-foreground font-normal">· {l.dept}</span></p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{l.from} → {l.to}</span>
                    <span>{l.days} day{l.days > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Reason: {l.reason}</p>
                </div>
                {l.status === 'Pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" className="text-xs gap-1"><CheckCircle className="w-3 h-3" />Approve</Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1"><XCircle className="w-3 h-3" />Reject</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <div className="space-y-3">
            {leaveBalances.map(b => (
              <Card key={b.staff} className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-3">{b.staff}</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Casual', data: b.casual },
                    { label: 'Sick', data: b.sick },
                    { label: 'Annual', data: b.annual },
                  ].map(({ label, data }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground mb-1">{label} Leave</p>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${(data.used / data.total) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{data.used}/{data.total} used</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}