/**
 * HR Dashboard — Adrine 2026 experience.
 * People operations: roster, recruitment pipeline, credential intelligence.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, CalendarClock, BriefcaseBusiness } from 'lucide-react';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  StatusChip,
  WorkflowStepper,
  type Metric,
  type StatusTone,
  type WorkflowStep,
} from '@/components/adrine/primitives';
import { DenseTable, type DenseColumn } from '@/components/adrine/dense-table';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import type { AIInsight } from '@/lib/adrine/ai-insights';
import { useHrPlatform } from '@/hooks/useHrPlatform';

type StaffRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  tone: StatusTone;
};

const FALLBACK_ROSTER: StaffRow[] = [
  { id: 'EMP-1042', name: 'Dr. Ananya Iyer', role: 'Consultant Cardiologist', department: 'Cardiology', status: 'On duty', tone: 'success' },
  { id: 'EMP-1108', name: 'Vikram Singh', role: 'Senior Staff Nurse', department: 'ICU', status: 'On duty', tone: 'success' },
  { id: 'EMP-1216', name: 'Fatima Sheikh', role: 'Lab Technologist', department: 'Laboratory', status: 'On duty', tone: 'success' },
  { id: 'EMP-1187', name: 'Arjun Reddy', role: 'Clinical Pharmacist', department: 'Pharmacy', status: 'On leave', tone: 'warning' },
  { id: 'EMP-1294', name: 'Meera Krishnan', role: 'Physiotherapist', department: 'Rehabilitation', status: 'On duty', tone: 'success' },
  { id: 'EMP-1330', name: 'Rohan Deshmukh', role: 'Radiographer', department: 'Imaging', status: 'Night shift', tone: 'info' },
  { id: 'EMP-1371', name: 'Dr. Imran Qureshi', role: 'Orthopaedic Surgeon', department: 'OT', status: 'In surgery', tone: 'active' },
  { id: 'EMP-1402', name: 'Kavya Menon', role: 'Front Office Executive', department: 'Reception', status: 'On duty', tone: 'success' },
];

const RECRUITMENT_STEPS: WorkflowStep[] = [
  { id: 'requisition', label: 'Requisition', status: 'done', meta: 'ICU staff nurse ×2 — approved 09 Jun' },
  { id: 'interview', label: 'Interview', status: 'done', meta: 'Panel round completed for 5 candidates' },
  { id: 'offer', label: 'Offer', status: 'active', meta: '2 offers released, 1 acceptance awaited' },
  { id: 'credential', label: 'Credential check', status: 'pending', meta: 'Nursing council verification queued' },
  { id: 'onboard', label: 'Onboard', status: 'pending', meta: 'Target joining 24 Jun' },
];

const HR_INSIGHTS: AIInsight[] = [
  {
    id: 'credential-expiry',
    severity: 'warning',
    title: '2 clinical licenses expire within 30 days',
    recommendation: 'Start renewal for Dr. Imran Qureshi and Fatima Sheikh this week to keep roster eligibility.',
    reasoning: [
      'Dr. Imran Qureshi — state medical council registration expires 02 Jul 2026 (19 days out).',
      'Fatima Sheikh — lab technologist certification expires 09 Jul 2026 (26 days out).',
      'Credential lapse auto-blocks duty rostering; renewal turnaround averages 12 working days.',
      'Policy requires renewal initiation at least 21 days before expiry — Dr. Qureshi is already inside that window.',
    ],
    confidence: 0.91,
    action: { label: 'Open credentials', to: '/hr/credentials' },
  },
  {
    id: 'staffing-ratio',
    severity: 'suggestion',
    title: 'ICU nurse-to-bed ratio trending thin on night shift',
    recommendation: 'Move one float nurse to ICU nights for the next 7 days.',
    reasoning: [
      'ICU census is 11 occupied beds; night roster has 5 nurses — ratio 1:2.2 vs the 1:2 target for ventilated mix.',
      '3 of 11 ICU patients are ventilated, which weights acuity above the plain bed count.',
      'Float pool shows 2 ICU-credentialed nurses currently assigned to general wards at 1:5.',
      'A single reassignment restores 1:2 without breaching ward minimums.',
    ],
    confidence: 0.78,
    action: { label: 'Open scheduling', to: '/hr/scheduling' },
  },
];

export default function HRDashboard2026() {
  const navigate = useNavigate();
  const { platformOn, staff } = useHrPlatform();

  const roster: StaffRow[] = useMemo(() => {
    if (!platformOn || staff.length === 0) return FALLBACK_ROSTER;
    return staff.map((member) => ({
      id: member.id,
      name: member.fullName,
      role: member.assignments[0]?.roleTemplate.label ?? member.role,
      department: member.assignments[0]?.departmentCode ?? '—',
      status: 'Active',
      tone: 'success' as StatusTone,
    }));
  }, [platformOn, staff]);

  const metrics: Metric[] = useMemo(() => {
    const total = platformOn && staff.length > 0 ? staff.length : 86;
    return [
      { id: 'total-staff', label: 'Total staff', value: total, icon: Users, hint: 'Across 12 departments' },
      { id: 'on-duty', label: 'On duty', value: Math.round(total * 0.71), icon: CalendarCheck, hint: 'Current shift', delta: { value: '71%', direction: 'flat' } },
      { id: 'leave-requests', label: 'Leave requests', value: 5, icon: CalendarClock, hint: '2 pending approval' },
      { id: 'open-positions', label: 'Open positions', value: 4, icon: BriefcaseBusiness, hint: '2 in offer stage' },
    ];
  }, [platformOn, staff]);

  const columns: DenseColumn<StaffRow>[] = [
    { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span>, searchText: (r) => r.name },
    { key: 'role', header: 'Role', searchText: (r) => r.role },
    { key: 'department', header: 'Department', searchText: (r) => r.department },
    { key: 'status', header: 'Status', cell: (r) => <StatusChip tone={r.tone}>{r.status}</StatusChip> },
  ];

  return (
    <PageScaffold
      eyebrow="People"
      title="Workforce operations"
      subtitle="Roster health, recruitment pipeline, and credential compliance for the whole facility."
    >
      <MetricGrid metrics={metrics} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <SectionPanel
          title="Staff roster"
          description="Live duty status by department"
          flush
          className="xl:col-span-2"
        >
          <DenseTable
            columns={columns}
            rows={roster}
            rowKey={(r) => r.id}
            searchable
            searchPlaceholder="Search staff…"
            onRowClick={() => navigate('/hr/staff')}
            emptyTitle="No staff records"
          />
        </SectionPanel>

        <div className="space-y-5">
          <SectionPanel title="Recruitment pipeline" description="ICU staff nurse requisition">
            <WorkflowStepper steps={RECRUITMENT_STEPS} />
          </SectionPanel>
        </div>
      </div>

      <AIInsightPanel insights={HR_INSIGHTS} />
    </PageScaffold>
  );
}
