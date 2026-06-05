import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminClaims() {
  return (
    <AdminConnectedPage
      title="Insurance Claims"
      description="Live claim and authorization activity from finance and billing operations."
      focus="claim"
    />
  );
}
