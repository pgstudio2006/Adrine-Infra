import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Search, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { HospitalAppointment } from '@/stores/hospitalStore';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import { loadPatientPhone } from '@/lib/navayu/navayu-forms';
import type { SeniorDoctor } from '@/lib/scheduling/senior-doctor-registry';
import {
  buildTimeSlots,
  findAppointmentConflict,
  slotBlockReason,
} from '@/lib/scheduling/appointment-slots';
import { isDoctorOnLeave } from '@/lib/scheduling/senior-doctor-registry';

const TIME_SLOTS = buildTimeSlots();

export type BookingFormState = {
  patientUhid: string;
  patientName: string;
  phone: string;
  department: string;
  doctor: string;
  date: string;
  time: string;
  duration: string;
  type: HospitalAppointment['type'];
  notes: string;
};

interface PatientOption {
  uhid: string;
  name: string;
  phone: string;
  department?: string;
  assignedDoctor?: string;
}

interface Props {
  open: boolean;
  title?: string;
  patients: PatientOption[];
  appointments: HospitalAppointment[];
  seniorDoctors: SeniorDoctor[];
  initialForm: BookingFormState;
  editingAppointmentId?: string | null;
  onClose: () => void;
  onSubmit: (form: BookingFormState) => void;
}

export function AppointmentBookingModal({
  open,
  title = 'Book Appointment',
  patients,
  appointments,
  seniorDoctors,
  initialForm,
  editingAppointmentId,
  onClose,
  onSubmit,
}: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState<BookingFormState>(initialForm);
  const [patientQuery, setPatientQuery] = useState(initialForm.patientName);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setPatientQuery(initialForm.patientName);
    }
  }, [open, initialForm]);

  const patientMatches = useMemo(() => {
    const query = patientQuery.trim().toLowerCase();
    if (!query) return patients.slice(0, 10);
    return patients
      .filter(
        (patient) =>
          patient.name.toLowerCase().includes(query)
          || patient.uhid.toLowerCase().includes(query)
          || patient.phone.includes(query),
      )
      .slice(0, 10);
  }, [patientQuery, patients]);

  const durationMinutes = Number(form.duration) || 30;
  const conflict = findAppointmentConflict(appointments, {
    doctor: form.doctor,
    date: form.date,
    time: form.time,
    duration: durationMinutes,
    excludeId: editingAppointmentId ?? undefined,
  });
  const doctorOnLeave = form.doctor ? isDoctorOnLeave(form.doctor, form.date) : false;

  const availableTimeSlots = useMemo(() => {
    if (!form.doctor || !form.date) return TIME_SLOTS;
    return TIME_SLOTS.filter((slot) =>
      !slotBlockReason(appointments, form.doctor, form.date, slot, durationMinutes, editingAppointmentId ?? undefined),
    );
  }, [appointments, durationMinutes, editingAppointmentId, form.date, form.doctor]);

  if (!open) return null;

  const pickPatient = (patient: PatientOption) => {
    const phone = patient.phone?.trim() || loadPatientPhone(patient.uhid) || '';
    setForm((prev) => ({
      ...prev,
      patientUhid: patient.uhid,
      patientName: patient.name,
      phone,
      department: patient.department || prev.department,
      doctor: seniorDoctors.find((d) => d.name === patient.assignedDoctor)?.name
        || prev.doctor
        || seniorDoctors[0]?.name
        || '',
    }));
    setPatientQuery(patient.name);
  };

  const handleSubmit = () => {
    if (!form.patientUhid || !form.patientName.trim()) {
      toast.error('Search and select a registered patient');
      return;
    }
    if (!form.phone.trim()) {
      toast.error('Patient phone is required');
      return;
    }
    if (!form.doctor || !form.department) {
      toast.error('Select doctor and department');
      return;
    }
    if (doctorOnLeave) {
      toast.error('Doctor is on leave for this date');
      return;
    }
    if (conflict) {
      toast.error('This slot overlaps an existing appointment', {
        description: `${conflict.patientName} at ${conflict.time}`,
      });
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        {(conflict || doctorOnLeave) && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {doctorOnLeave
              ? 'Selected doctor is on leave for this date.'
              : `Slot blocked — overlaps ${conflict?.patientName} (${conflict?.time}).`}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Search patient (UHID, name, phone)</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={patientQuery}
              onChange={(event) => setPatientQuery(event.target.value)}
              placeholder="Type to search registered patients…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>
          {patientMatches.length > 0 ? (
            <div className="rounded-lg border divide-y max-h-36 overflow-y-auto">
              {patientMatches.map((patient) => (
                <button
                  key={patient.uhid}
                  type="button"
                  onClick={() => pickPatient(patient)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/50 ${
                    form.patientUhid === patient.uhid ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className="font-medium">{patient.name}</span>
                  <span className="text-muted-foreground"> · {patient.uhid} · {patient.phone || 'No phone'}</span>
                </button>
              ))}
            </div>
          ) : patientQuery.trim() ? (
            <div className="rounded-lg border border-dashed p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm text-muted-foreground">No registered patient found for this search.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  onClose();
                  navigate('/reception/registration');
                }}
              >
                <UserPlus className="w-4 h-4" /> New registration
              </Button>
            </div>
          ) : null}
          {form.patientUhid ? (
            <p className="text-xs text-muted-foreground">
              Selected: <strong>{form.patientName}</strong> ({form.patientUhid})
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Phone</label>
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Senior doctor *</label>
            <AppSelect
              value={form.doctor || undefined}
              onValueChange={(value) => {
                const doctor = seniorDoctors.find((item) => item.name === value);
                setForm((prev) => ({
                  ...prev,
                  doctor: value,
                  department: doctor?.department || prev.department,
                }));
              }}
              options={seniorDoctors.map((doctor) => ({
                value: doctor.name,
                label: `${doctor.name} · ${doctor.department}`,
              }))}
              placeholder="Select senior doctor"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Department</label>
            <input
              value={form.department}
              readOnly
              className="w-full px-3 py-2 rounded-lg border bg-muted/30 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <AppSelect
              value={form.type}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, type: value as HospitalAppointment['type'] }))
              }
              options={[
                { value: 'new', label: 'New' },
                { value: 'follow-up', label: 'Follow-up' },
                { value: 'teleconsultation', label: 'Teleconsultation' },
              ]}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Time</label>
            <AppSelect
              value={form.time}
              onValueChange={(value) => setForm((prev) => ({ ...prev, time: value }))}
              options={availableTimeSlots.map((slot) => ({ value: slot, label: slot }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Duration</label>
            <AppSelect
              value={form.duration}
              onValueChange={(value) => setForm((prev) => ({ ...prev, duration: value }))}
              options={[
                { value: '15', label: '15 min' },
                { value: '30', label: '30 min' },
                { value: '45', label: '45 min' },
                { value: '60', label: '60 min' },
              ]}
              className="w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={Boolean(conflict) || doctorOnLeave}>
            {editingAppointmentId ? 'Save changes' : 'Save appointment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
