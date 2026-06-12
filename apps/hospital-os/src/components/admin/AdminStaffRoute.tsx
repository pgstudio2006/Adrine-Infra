import { Navigate } from 'react-router-dom';
import { isNavayuTenant } from '@/lib/navayu/navayu-forms';
import AdminStaff from '@/pages/admin/AdminStaff';

/** Navayu: staff lives under HR. Other tenants: legacy admin staff page. */
export default function AdminStaffRoute() {
  if (isNavayuTenant()) {
    return <Navigate to="/hr/staff" replace />;
  }
  return <AdminStaff />;
}
