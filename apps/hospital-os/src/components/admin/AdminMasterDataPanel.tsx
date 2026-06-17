import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { STAFF_REGISTER_ROLES } from '@/lib/hr/staff-role-departments';
import {
  ADMIN_DASHBOARD_SECTION_OPTIONS,
  DEFAULT_EXPENSE_CATEGORIES,
} from '@/lib/admin/master-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

function parseLines(value: string) {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function AdminMasterDataPanel() {
  const { settings, updateMasterData } = useTenantSettings();
  const masterData = settings.masterData!;
  const [doctorDeptText, setDoctorDeptText] = useState(masterData.doctorDepartments.join('\n'));
  const [expenseCatText, setExpenseCatText] = useState(masterData.expenseCategories.join('\n'));
  const [roleDeptDrafts, setRoleDeptDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(masterData.roleDepartments).map(([role, departments]) => [role, departments.join('\n')]),
    ),
  );

  const sectionSet = useMemo(() => new Set(masterData.adminDashboardSections), [masterData.adminDashboardSections]);

  const applyDoctorDepartments = () => {
    const doctorDepartments = parseLines(doctorDeptText);
    if (!doctorDepartments.length) {
      toast.error('Add at least one doctor department');
      return;
    }
    updateMasterData({ doctorDepartments });
    toast.success('Doctor departments updated across the app');
  };

  const applyExpenseCategories = () => {
    const expenseCategories = parseLines(expenseCatText);
    if (!expenseCategories.length) {
      toast.error('Add at least one expense category');
      return;
    }
    updateMasterData({ expenseCategories });
    toast.success('Expense categories updated');
  };

  const applyRoleDepartments = () => {
    const roleDepartments = Object.fromEntries(
      Object.entries(roleDeptDrafts).map(([role, text]) => [role, parseLines(text)]),
    );
    updateMasterData({ roleDepartments });
    toast.success('Role-to-department mappings updated');
  };

  const toggleDashboardSection = (key: string, enabled: boolean) => {
    const next = enabled
      ? [...masterData.adminDashboardSections, key]
      : masterData.adminDashboardSections.filter((item) => item !== key);
    updateMasterData({ adminDashboardSections: next });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Centralized Master Data</CardTitle>
          <p className="text-sm text-muted-foreground">
            All dropdowns across HMS read from here. Changes reflect in staff registration, scheduling, finance, and clinical routing.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Doctor departments (one per line)</Label>
              <Textarea className="min-h-[220px]" value={doctorDeptText} onChange={(e) => setDoctorDeptText(e.target.value)} />
              <Button onClick={applyDoctorDepartments}>Apply doctor departments</Button>
            </div>
            <div className="space-y-2">
              <Label>Expense categories (one per line)</Label>
              <Textarea
                className="min-h-[220px]"
                value={expenseCatText}
                onChange={(e) => setExpenseCatText(e.target.value)}
                placeholder={DEFAULT_EXPENSE_CATEGORIES.join('\n')}
              />
              <Button onClick={applyExpenseCategories}>Apply expense categories</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role → Department mapping</CardTitle>
          <p className="text-sm text-muted-foreground">
            When a role is selected in staff registration, only matching departments appear.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {Object.entries(STAFF_REGISTER_ROLES).map(([role, label]) => (
            <div key={role} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <Badge variant="outline" className="text-[10px]">{role}</Badge>
              </div>
              <Textarea
                className="min-h-[100px] text-xs"
                value={roleDeptDrafts[role] ?? ''}
                onChange={(e) =>
                  setRoleDeptDrafts((current) => ({
                    ...current,
                    [role]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button onClick={applyRoleDepartments}>Apply role-department mappings</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin dashboard sections</CardTitle>
          <p className="text-sm text-muted-foreground">Choose which operational blocks appear on the admin home screen.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {ADMIN_DASHBOARD_SECTION_OPTIONS.map((section) => (
            <div key={section.key} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
              <Switch
                checked={sectionSet.has(section.key)}
                onCheckedChange={(checked) => toggleDashboardSection(section.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
