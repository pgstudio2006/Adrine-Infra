import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminPhonebook() {
  return (
    <AdminConnectedPage
      title="Phonebook"
      description="Operational contact and escalation activity sourced from live branch workflow events."
      focus="escalation"
    />
  );
}
