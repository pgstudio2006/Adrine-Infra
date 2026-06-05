import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminDiseaseMapping() {
  return (
    <AdminConnectedPage
      title="Disease Mapping"
      description="Clinical trend mapping sourced from real branch workflow and outcome events."
      focus="clinical"
    />
  );
}
