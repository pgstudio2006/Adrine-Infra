import { useMemo, useState } from 'react';
import { Hash, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useHospital } from '@/stores/hospitalStore';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import {
  getClinicalDepartments,
  getClinicalDoctorsForDepartment,
  getDefaultAssignedDoctor,
} from '@/lib/opd/branch-clinical-roster';
import { isNavayuTenant, NAVAYU_CLINICAL_DEPARTMENTS } from '@/lib/navayu/navayu-forms';

interface Props {
  open: boolean;
  onClose: () => void;
  onTokenIssued?: (result: { uhid: string; patientName: string; tokenNo: number }) => void;
}

const DEPARTMENTS = isNavayuTenant()
  ? [...NAVAYU_CLINICAL_DEPARTMENTS]
  : getClinicalDepartments();

function toYmd(date: Date) {
  return date.toISOString().split('T')[0];
}

export function OpdTokenDialog({ open, onClose, onTokenIssued }: Props) {
  const { patients, bookAppointment, checkInPatient } = useHospital();
  const [query, setQuery] = useState('');
  const [selectedUhid, setSelectedUhid] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0] ?? 'Spine & MSK');
  const [doctor, setDoctor] = useState(getDefaultAssignedDoctor(DEPARTMENTS[0] ?? 'Spine & MSK'));
  const [notes, setNotes] = useState('Walk-in OPD token — no prior appointment');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 12);
    return patients
      .filter((patient) => {
        return (
          patient.uhid.toLowerCase().includes(q)
          || patient.name.toLowerCase().includes(q)
          || patient.phone.includes(q)
        );
      })
      .slice(0, 12);
  }, [patients, query]);

  const selectedPatient = patients.find((patient) => patient.uhid === selectedUhid) ?? null;

  const doctorOptions = useMemo(
    () => getClinicalDoctorsForDepartment(department),
    [department],
  );

  if (!open) return null;

  const handleIssueToken = () => {
    if (!selectedPatient) {
      toast.error('Select a registered patient first');
      return;
    }
    if (!selectedPatient.phone?.trim()) {
      toast.error('Patient record has no phone — update registration first');
      return;
    }

    const now = new Date();
    const appointmentId = bookAppointment({
      uhid: selectedPatient.uhid,
      patientName: selectedPatient.name,
      phone: selectedPatient.phone,
      doctor: doctor || getDefaultAssignedDoctor(department),
      department,
      date: toYmd(now),
      time: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      duration: 20,
      status: 'scheduled',
      type: 'follow-up',
      notes,
    });

    const tokenNo = checkInPatient(appointmentId, notes);
    if (!tokenNo) {
      toast.error('Could not issue OPD token', {
        description: 'Check platform connectivity or patient OPD state.',
      });
      return;
    }

    toast.success(`OPD token #${tokenNo} issued`, {
      description: `${selectedPatient.name} (${selectedPatient.uhid})`,
    });
    onTokenIssued?.({
      uhid: selectedPatient.uhid,
      patientName: selectedPatient.name,
      tokenNo,
    });
    setQuery('');
    setSelectedUhid('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Hash className="w-5 h-5" /> OPD token
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              For registered patients visiting without an appointment — search by UHID, name, or mobile.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search UHID, name, or phone…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>

        <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
          {matches.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">No matching patients</p>
          ) : (
            matches.map((patient) => (
              <button
                key={patient.uhid}
                type="button"
                onClick={() => setSelectedUhid(patient.uhid)}
                className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors ${
                  selectedUhid === patient.uhid ? 'bg-primary/10' : ''
                }`}
              >
                <p className="text-sm font-medium">{patient.name}</p>
                <p className="text-xs text-muted-foreground">
                  {patient.uhid} · {patient.phone || 'No phone'}
                </p>
              </button>
            ))
          )}
        </div>

        {selectedPatient ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Department</label>
              <AppSelect
                value={department}
                onValueChange={(value) => {
                  setDepartment(value);
                  setDoctor(getDefaultAssignedDoctor(value));
                }}
                options={DEPARTMENTS.map((item) => ({ value: item, label: item }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Doctor</label>
              <AppSelect
                value={doctor}
                onValueChange={setDoctor}
                options={doctorOptions.map((item) => ({ value: item, label: item }))}
                className="w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleIssueToken} disabled={!selectedPatient}>
            Issue OPD token
          </Button>
        </div>
      </div>
    </div>
  );
}
