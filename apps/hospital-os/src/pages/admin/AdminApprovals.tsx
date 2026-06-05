import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminApprovals() {
  return (
    <AdminConnectedPage
      title="Approval Workflows"
      description="Live operational approvals and decision activity from branch runtime."
      focus="approval"
    />
  );
}
