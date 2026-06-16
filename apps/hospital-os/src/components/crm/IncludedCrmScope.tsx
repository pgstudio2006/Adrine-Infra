import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ScopeSection = {
  title: string;
  items: string[];
};

const CRM_SCOPE: ScopeSection[] = [
  {
    title: 'Lead & Inquiry Management',
    items: [
      'Walk-in Inquiry Registration',
      'Phone Inquiry Registration',
      'Website Inquiry Registration',
      'Lead Source Tracking',
      'Lead Status Management',
      'Lead Notes',
      'Inquiry Timeline',
    ],
  },
  {
    title: 'Patient Pipeline',
    items: [
      'Inquiry -> Appointment',
      'Appointment -> Consultation',
      'Consultation -> Counsellor',
      'Counsellor -> Package',
      'Package -> Payment',
      'Payment -> Treatment',
    ],
  },
  {
    title: 'Counsellor Module',
    items: [
      'Assigned Patients',
      'Follow-up Queue',
      'Follow-up Notes',
      'Task Management',
      'Package Recommendation Tracking',
      'Conversion Tracking',
      'Counsellor Dashboard',
    ],
  },
  {
    title: 'Follow-up Management',
    items: [
      'Follow-up Scheduling',
      'Follow-up Reminders',
      'Missed Follow-up Alerts',
      'Follow-up Outcome Tracking',
    ],
  },
  {
    title: 'WhatsApp Automation',
    items: [
      'Appointment Confirmation',
      'Appointment Reminder',
      'Follow-up Reminder',
      'Treatment Reminder',
      'Feedback Request',
      'Review Request',
    ],
  },
  {
    title: 'Referral Management',
    items: [
      'Referral Source Tracking',
      'Doctor Referral Tracking',
      'Patient Referral Tracking',
    ],
  },
  {
    title: 'Package Management',
    items: [
      'Package Creation',
      'Package Proposal Tracking',
      'Package Conversion Tracking',
    ],
  },
  {
    title: 'CRM Dashboards',
    items: [
      'Lead Dashboard',
      'Counsellor Dashboard',
      'Conversion Dashboard',
      'Referral Dashboard',
      'Revenue Dashboard',
    ],
  },
  {
    title: 'Analytics',
    items: [
      'Lead Source Analytics',
      'Conversion Analytics',
      'Counsellor Performance',
      'Package Conversion Reports',
      'Revenue Reports',
    ],
  },
  {
    title: 'Navayu Specific',
    items: [
      'Camp Lead Tracking',
      'Corporate Lead Tracking',
      'Spine/Knee/Shoulder Lead Categorization',
      'Treatment Journey Tracking',
      'Outcome Tracking',
    ],
  },
];

type IncludedCrmScopeProps = {
  title?: string;
  subtitle?: string;
  sections?: ScopeSection[];
};

export function IncludedCrmScope({
  title = 'Adrine CRM (Included in HMS Package)',
  subtitle = 'End-to-end in-HMS CRM and counsellor operations without external CRM dependency.',
  sections = CRM_SCOPE,
}: IncludedCrmScopeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border p-4">
            <p className="font-medium text-foreground">{section.title}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {section.items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export const COUNSELLOR_SCOPE_SECTIONS: ScopeSection[] = CRM_SCOPE.filter((section) =>
  ['Counsellor Module', 'Follow-up Management', 'WhatsApp Automation', 'Package Management', 'CRM Dashboards', 'Analytics', 'Navayu Specific'].includes(
    section.title,
  ),
);
