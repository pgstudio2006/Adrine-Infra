import { AppSelect } from '@/components/ui/app-select';
import { Switch } from '@/components/ui/switch';
import {
  districtsForState,
  INDIA_COUNTRIES,
  statesForCountry,
} from '@/lib/geo/india-locations';
import {
  getDoctorsForDepartment,
  navayuOpdDepartmentOptions,
} from '@/lib/navayu/navayu-opd-departments';
import {
  NAVAYU_APPOINTMENT_CENTRES,
  NAVAYU_COUNSELLORS,
  NAVAYU_REFERRAL_SOURCES,
  NAVAYU_REGISTRATION_BRANCHES,
} from '@/lib/navayu/navayu-registration-intake';
import { normalizeNavayuReferralValue } from '@/lib/navayu/navayu-forms';
import type { TenantPatientTypeOption } from '@/config/tenantSettings';

export type NavayuPageOneForm = {
  fullName: string;
  phone: string;
  altPhone: string;
  email: string;
  gender: string;
  dob: string;
  age: string;
  opdDepartment: string;
  assignedDoctor: string;
  opdMode: boolean;
  appointmentCentre: string;
  country: string;
  state: string;
  district: string;
  city: string;
  address: string;
  pin: string;
  patientType: string;
  branch: string;
  hearAboutNavayu: string;
  referringDoctor: string;
  counsellorId: string;
  autoAssignCounsellor: boolean;
};

interface Props {
  form: NavayuPageOneForm;
  patientTypes: TenantPatientTypeOption[];
  errors: Record<string, string>;
  onChange: (patch: Partial<NavayuPageOneForm>) => void;
  onOpdStart?: () => void;
  opdStartDisabled?: boolean;
}

export function NavayuRegistrationPageOne({
  form,
  patientTypes,
  errors,
  onChange,
  onOpdStart,
  opdStartDisabled,
}: Props) {
  const stateOptions = statesForCountry(form.country);
  const districtOptions = districtsForState(form.state);
  const departmentOptions = navayuOpdDepartmentOptions();
  const doctorOptions = form.opdDepartment
    ? getDoctorsForDepartment(form.opdDepartment)
    : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-sm font-medium mb-1 block">Full Name *</label>
          <input
            value={form.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors.fullName ? 'border-destructive' : ''}`}
            placeholder="Patient full name"
          />
          {errors.fullName ? <p className="text-xs text-destructive mt-1">{errors.fullName}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Mobile No *</label>
          <input
            value={form.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            maxLength={10}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors.phone ? 'border-destructive' : ''}`}
            placeholder="10-digit mobile"
          />
          {errors.phone ? <p className="text-xs text-destructive mt-1">{errors.phone}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Alternate Number</label>
          <input
            value={form.altPhone}
            onChange={(event) => onChange({ altPhone: event.target.value })}
            maxLength={10}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => onChange({ email: event.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Gender *</label>
          <div className="flex gap-2">
            {['male', 'female', 'other'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => onChange({ gender })}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${
                  form.gender === gender ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                }`}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Date of Birth</label>
          <input
            type="date"
            value={form.dob}
            onChange={(event) => onChange({ dob: event.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Age *</label>
          <input
            type="number"
            min={0}
            max={120}
            value={form.age}
            onChange={(event) => onChange({ age: event.target.value })}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors.age ? 'border-destructive' : ''}`}
          />
          {errors.age ? <p className="text-xs text-destructive mt-1">{errors.age}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Appointment Centre</label>
          <AppSelect
            value={form.appointmentCentre || undefined}
            onValueChange={(value) => onChange({ appointmentCentre: value })}
            options={NAVAYU_APPOINTMENT_CENTRES.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="Select centre"
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Country</label>
          <AppSelect
            value={form.country}
            onValueChange={(value) =>
              onChange({
                country: value,
                state: statesForCountry(value)[0]?.value ?? '',
                district: '',
              })
            }
            options={INDIA_COUNTRIES.map((item) => ({ value: item.value, label: item.label }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">State</label>
          <AppSelect
            value={form.state || undefined}
            onValueChange={(value) =>
              onChange({
                state: value,
                district: districtsForState(value)[0]?.value ?? '',
              })
            }
            options={stateOptions.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="Select state"
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">District</label>
          <AppSelect
            value={form.district || undefined}
            onValueChange={(value) => onChange({ district: value })}
            options={districtOptions.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="Select district"
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">City</label>
          <input
            value={form.city}
            onChange={(event) => onChange({ city: event.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium mb-1 block">Address</label>
          <textarea
            value={form.address}
            onChange={(event) => onChange({ address: event.target.value })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Pincode</label>
          <input
            value={form.pin}
            onChange={(event) => onChange({ pin: event.target.value })}
            maxLength={6}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Branch *</label>
          <AppSelect
            value={form.branch}
            onValueChange={(value) => onChange({ branch: value })}
            options={NAVAYU_REGISTRATION_BRANCHES.map((item) => ({ value: item, label: item }))}
            className="w-full"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="text-sm font-medium mb-1 block">Patient Type *</label>
          <div className="flex flex-wrap gap-2">
            {patientTypes.map((typeOption) => (
              <button
                key={typeOption.label}
                type="button"
                onClick={() => onChange({ patientType: typeOption.label })}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  form.patientType === typeOption.label
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent'
                }`}
              >
                {typeOption.label}
              </button>
            ))}
          </div>
          {errors.patientType ? <p className="text-xs text-destructive mt-1">{errors.patientType}</p> : null}
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">How did you hear about us?</label>
          <AppSelect
            value={form.hearAboutNavayu || undefined}
            onValueChange={(value) =>
              onChange({ hearAboutNavayu: normalizeNavayuReferralValue(value) })
            }
            options={[
              { value: '', label: 'Select referral source' },
              ...NAVAYU_REFERRAL_SOURCES.map((item) => ({ value: item.value, label: item.label })),
            ]}
            className={`w-full ${errors.hearAboutNavayu ? 'border-destructive' : ''}`}
          />
          {errors.hearAboutNavayu ? (
            <p className="text-xs text-destructive mt-1">{errors.hearAboutNavayu}</p>
          ) : null}
        </div>
        {form.hearAboutNavayu === 'doctor_referral' ? (
          <div>
            <label className="text-sm font-medium mb-1 block">Referring doctor name</label>
            <input
              value={form.referringDoctor}
              onChange={(event) => onChange({ referringDoctor: event.target.value })}
              className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors.referringDoctor ? 'border-destructive' : ''}`}
              placeholder="Doctor name"
            />
            {errors.referringDoctor ? (
              <p className="text-xs text-destructive mt-1">{errors.referringDoctor}</p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="text-sm font-medium mb-1 block">Counsellor</label>
            <AppSelect
              value={form.autoAssignCounsellor ? '__auto__' : form.counsellorId || undefined}
              onValueChange={(value) => {
                if (value === '__auto__') {
                  onChange({ autoAssignCounsellor: true, counsellorId: '' });
                  return;
                }
                onChange({ autoAssignCounsellor: false, counsellorId: value });
              }}
              disabled={form.autoAssignCounsellor}
              options={[
                { value: '__auto__', label: 'Auto-assign counsellor' },
                ...NAVAYU_COUNSELLORS.map((item) => ({ value: item.id, label: item.name })),
              ]}
              placeholder="Select counsellor"
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Auto-assign counsellor</p>
              <p className="text-xs text-muted-foreground">Use when no counsellor is pre-selected</p>
            </div>
            <Switch
              checked={form.autoAssignCounsellor}
              onCheckedChange={(checked) => onChange({ autoAssignCounsellor: checked })}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">OPD visit</p>
              <p className="text-xs text-muted-foreground">
                Enable to register for same-day OPD — routes to billing queue first
              </p>
            </div>
            <Switch
              checked={form.opdMode}
              onCheckedChange={(checked) =>
                onChange({
                  opdMode: checked,
                  opdDepartment: checked ? form.opdDepartment : '',
                  assignedDoctor: checked ? form.assignedDoctor : '',
                })
              }
            />
          </div>

          {form.opdMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Department *</label>
                <AppSelect
                  value={form.opdDepartment || undefined}
                  onValueChange={(value) =>
                    onChange({
                      opdDepartment: value,
                      assignedDoctor: getDoctorsForDepartment(value)[0] ?? '',
                    })
                  }
                  options={departmentOptions}
                  placeholder="Select department"
                  className={`w-full ${errors.opdDepartment ? 'border-destructive' : ''}`}
                />
                {errors.opdDepartment ? (
                  <p className="text-xs text-destructive mt-1">{errors.opdDepartment}</p>
                ) : null}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Doctor *</label>
                <AppSelect
                  value={form.assignedDoctor || undefined}
                  onValueChange={(value) => onChange({ assignedDoctor: value })}
                  options={doctorOptions.map((name) => ({ value: name, label: name }))}
                  placeholder="Select doctor"
                  disabled={!form.opdDepartment}
                  className={`w-full ${errors.assignedDoctor ? 'border-destructive' : ''}`}
                />
                {errors.assignedDoctor ? (
                  <p className="text-xs text-destructive mt-1">{errors.assignedDoctor}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {form.opdMode && onOpdStart ? (
            <button
              type="button"
              disabled={opdStartDisabled}
              onClick={onOpdStart}
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              OPD Start → Billing queue
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
