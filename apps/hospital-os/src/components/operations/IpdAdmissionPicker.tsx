import { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHospital } from '@/stores/hospitalStore';
import {
  canUseIpdRuntime,
  platformListActiveIpdCensus,
  platformGetActiveAdmission,
  type PlatformIpdCensusRow,
} from '@/runtime/ipd-runtime';

export type IpdAdmissionOption = {
  id: string;
  label: string;
  ward?: string | null;
  patientName: string;
  mrn?: string | null;
};

type Props = {
  value?: string;
  onChange: (admissionId: string | undefined, row?: IpdAdmissionOption) => void;
  patientId?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export function IpdAdmissionPicker({
  value,
  onChange,
  patientId,
  disabled,
  label = 'IPD admission (billing sync)',
  placeholder = 'Select active admission',
}: Props) {
  const { admissions } = useHospital();
  const [platformRows, setPlatformRows] = useState<PlatformIpdCensusRow[]>([]);
  const platformOn = canUseIpdRuntime();

  useEffect(() => {
    if (!platformOn) return;
    let cancelled = false;
    void (async () => {
      try {
        if (patientId) {
          const active = await platformGetActiveAdmission(patientId);
          if (!cancelled) setPlatformRows(active ? [active as PlatformIpdCensusRow] : []);
          return;
        }
        const census = await platformListActiveIpdCensus();
        if (!cancelled) setPlatformRows(census);
      } catch {
        if (!cancelled) setPlatformRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [platformOn, patientId]);

  const options = useMemo((): IpdAdmissionOption[] => {
    if (platformOn && platformRows.length > 0) {
      return platformRows.map((row) => ({
        id: row.id,
        label: `${row.patient?.fullName ?? 'Patient'} — ${row.ward ?? 'Ward'} (${row.state})`,
        ward: row.ward,
        patientName: row.patient?.fullName ?? '—',
        mrn: row.patient?.mrn,
      }));
    }
    return admissions
      .filter((a) => a.status !== 'discharged')
      .filter((a) => !patientId || a.platformPatientId === patientId)
      .map((a) => ({
        id: a.platformAdmissionId ?? a.id,
        label: `${a.patientName} — ${a.ward ?? a.bed} (${a.status})`,
        ward: a.ward,
        patientName: a.patientName,
        mrn: a.uhid,
      }));
  }, [platformOn, platformRows, admissions, patientId]);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value ?? '__none__'}
        onValueChange={(v) => {
          if (v === '__none__') {
            onChange(undefined);
            return;
          }
          const row = options.find((o) => o.id === v);
          onChange(v, row);
        }}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={options.length === 0 ? 'No active IPD admissions' : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None (outpatient / no IPD billing)</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!platformOn ? (
        <p className="text-[10px] text-muted-foreground">Local census — link platform for governed IPD sync.</p>
      ) : null}
    </div>
  );
}
