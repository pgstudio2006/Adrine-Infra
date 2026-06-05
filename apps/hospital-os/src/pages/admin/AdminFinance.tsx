import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminFinance() {
  return (
    <AdminConnectedPage
      title="Finance Overview"
      description="Branch finance workspace backed by live invoice, outstanding, and reconciliation data."
      focus="finance"
    />
  );
}
