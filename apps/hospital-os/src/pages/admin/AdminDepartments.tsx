import { AdminConnectedPage } from '@/components/admin/AdminConnectedPage';

export default function AdminDepartments() {
  return (
    <AdminConnectedPage
      title="Department Management"
      description="Department-level operational view based on live admissions, queue, and staff activity."
      focus="department"
    />
  );
}
