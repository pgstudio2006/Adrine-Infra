import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminTreatmentSuccess() {
  return (
    <AdminConnectedPage
      title="Treatment Success"
      description="Outcome monitoring connected to live OPD/IPD lifecycle and branch execution metrics."
      focus="outcome"
    />
  );
}
