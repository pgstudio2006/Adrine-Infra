import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AppSelect } from '@/components/ui/app-select';
import {
  addDoctorLeave,
  listAllSeniorDoctors,
  listDoctorLeave,
  listSeniorDoctors,
  removeDoctorLeave,
  removeSeniorDoctor,
  saveSeniorDoctors,
  upsertSeniorDoctor,
  type DoctorLeaveEntry,
  type SeniorDoctor,
} from '@/lib/scheduling/senior-doctor-registry';
import { getClinicalDepartments } from '@/lib/opd/branch-clinical-roster';

export function AdminSchedulingPanel() {
  const [doctors, setDoctors] = useState<SeniorDoctor[]>(() => listAllSeniorDoctors());
  const [leaveEntries, setLeaveEntries] = useState<DoctorLeaveEntry[]>(() => listDoctorLeave());
  const [doctorForm, setDoctorForm] = useState({ name: '', department: getClinicalDepartments()[0] ?? '' });
  const [leaveForm, setLeaveForm] = useState({
    doctorId: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const refresh = () => {
    setDoctors(listAllSeniorDoctors());
    setLeaveEntries(listDoctorLeave());
  };

  const handleAddDoctor = () => {
    if (!doctorForm.name.trim()) {
      toast.error('Doctor name is required');
      return;
    }
    upsertSeniorDoctor({
      name: doctorForm.name.trim(),
      department: doctorForm.department,
      active: true,
    });
    setDoctorForm({ name: '', department: doctorForm.department });
    refresh();
    toast.success('Senior doctor added');
  };

  const handleSaveDoctors = () => {
    saveSeniorDoctors(doctors);
    toast.success('Senior doctor list saved');
  };

  const handleAddLeave = () => {
    const doctor = doctors.find((item) => item.id === leaveForm.doctorId);
    if (!doctor || !leaveForm.fromDate || !leaveForm.toDate) {
      toast.error('Select doctor and leave dates');
      return;
    }
    addDoctorLeave({
      doctorId: doctor.id,
      doctorName: doctor.name,
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate,
      reason: leaveForm.reason.trim() || 'Leave',
    });
    setLeaveForm({ doctorId: '', fromDate: '', toDate: '', reason: '' });
    refresh();
    toast.success('Leave recorded — slots blocked on appointment calendar');
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Senior doctors (appointment calendar)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Only senior doctors appear on the reception appointment and check-in calendars.
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="text-left px-4 py-2">Doctor</th>
              <th className="text-left px-4 py-2">Department</th>
              <th className="text-left px-4 py-2">Active</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {doctors.map((doctor) => (
              <tr key={doctor.id}>
                <td className="px-4 py-2">
                  <input
                    value={doctor.name}
                    onChange={(event) =>
                      setDoctors((prev) =>
                        prev.map((item) =>
                          item.id === doctor.id ? { ...item, name: event.target.value } : item,
                        ),
                      )
                    }
                    className="w-full px-2 py-1 rounded border bg-background"
                  />
                </td>
                <td className="px-4 py-2">
                  <AppSelect
                    value={doctor.department}
                    onValueChange={(value) =>
                      setDoctors((prev) =>
                        prev.map((item) =>
                          item.id === doctor.id ? { ...item, department: value } : item,
                        ),
                      )
                    }
                    options={getClinicalDepartments().map((dept) => ({ value: dept, label: dept }))}
                    className="w-full"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={doctor.active}
                    onChange={(event) =>
                      setDoctors((prev) =>
                        prev.map((item) =>
                          item.id === doctor.id ? { ...item, active: event.target.checked } : item,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      removeSeniorDoctor(doctor.id);
                      refresh();
                    }}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <input
          value={doctorForm.name}
          onChange={(event) => setDoctorForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Doctor name"
          className="px-3 py-2 rounded-lg border bg-background text-sm"
        />
        <AppSelect
          value={doctorForm.department}
          onValueChange={(value) => setDoctorForm((prev) => ({ ...prev, department: value }))}
          options={getClinicalDepartments().map((dept) => ({ value: dept, label: dept }))}
          className="min-w-[180px]"
        />
        <Button type="button" variant="outline" onClick={handleAddDoctor} className="gap-1">
          <Plus className="w-4 h-4" /> Add doctor
        </Button>
        <Button type="button" onClick={handleSaveDoctors}>Save doctors</Button>
      </div>

      <div className="border-t pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Doctor leave</h3>
          <p className="text-sm text-muted-foreground mt-1">
            When a doctor is on leave, all slots for that day are unavailable for booking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <AppSelect
            value={leaveForm.doctorId || undefined}
            onValueChange={(value) => setLeaveForm((prev) => ({ ...prev, doctorId: value }))}
            options={listSeniorDoctors().map((doctor) => ({
              value: doctor.id,
              label: doctor.name,
            }))}
            placeholder="Select doctor"
            className="w-full"
          />
          <input
            type="date"
            value={leaveForm.fromDate}
            onChange={(event) => setLeaveForm((prev) => ({ ...prev, fromDate: event.target.value }))}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          />
          <input
            type="date"
            value={leaveForm.toDate}
            onChange={(event) => setLeaveForm((prev) => ({ ...prev, toDate: event.target.value }))}
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          />
          <input
            value={leaveForm.reason}
            onChange={(event) => setLeaveForm((prev) => ({ ...prev, reason: event.target.value }))}
            placeholder="Reason"
            className="px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <Button type="button" onClick={handleAddLeave}>Add leave</Button>

        <div className="rounded-xl border divide-y">
          {leaveEntries.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No leave entries</p>
          ) : (
            leaveEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>
                  <strong>{entry.doctorName}</strong> · {entry.fromDate} → {entry.toDate}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    removeDoctorLeave(entry.id);
                    refresh();
                  }}
                  className="text-destructive hover:underline text-xs"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
