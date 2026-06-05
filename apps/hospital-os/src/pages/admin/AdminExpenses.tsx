import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminExpenses() {
  return (
    <AdminConnectedPage
      title="Expense Management"
      description="Expense and utilization operations view synced from live finance and workflow activity."
      focus="expense"
    />
  );
}
