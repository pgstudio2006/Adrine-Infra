import { AppSelect } from '@/components/ui/app-select';
import { Switch } from '@/components/ui/switch';
import {
  NAVAYU_APPOINTMENT_CENTRES,
  NAVAYU_COUNSELLORS,
  NAVAYU_COUNTRIES,
  NAVAYU_DISTRICTS,
  NAVAYU_REFERRAL_SOURCES,
  NAVAYU_REGISTRATION_BRANCHES,
  NAVAYU_SERVICE_CATEGORIES,
  NAVAYU_STATES,
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
  serviceCategory: string;
  appointmentCentre: string;
  appointmentDateTime: string;
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
}

export function NavayuRegistrationPageOne({ form, patientTypes, errors, onChange }: Props) {
  const stateOptions = NAVAYU_STATES[form.country] ?? NAVAYU_STATES.India;
  const districtOptions = NAVAYU_DISTRICTS[form.state] ?? [];

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
          <label className="text-sm font-medium mb-1 block">Date of Birth *</label>
          <input
            type="date"
            value={form.dob}
            onChange={(event) => onChange({ dob: event.target.value })}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors.dob ? 'border-destructive' : ''}`}
          />
          {errors.dob ? <p className="text-xs text-destructive mt-1">{errors.dob}</p> : null}
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
          <label className="text-sm font-medium mb-1 block">Service Category *</label>
          <AppSelect
            value={form.serviceCategory || undefined}
            onValueChange={(value) => onChange({ serviceCategory: value })}
            options={NAVAYU_SERVICE_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="Select service category"
            className={`w-full ${errors.serviceCategory ? 'border-destructive' : ''}`}
          />
          {errors.serviceCategory ? <p className="text-xs text-destructive mt-1">{errors.serviceCategory}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Appointment Centre *</label>
          <AppSelect
            value={form.appointmentCentre || undefined}
            onValueChange={(value) => onChange({ appointmentCentre: value })}
            options={NAVAYU_APPOINTMENT_CENTRES.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="Select centre"
            className={`w-full ${errors.appointmentCentre ? 'border-destructive' : ''}`}
          />
          {errors.appointmentCentre ? <p className="text-xs text-destructive mt-1">{errors.appointmentCentre}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Appointment Date and Time</label>
          <input
            type="datetime-local"
            value={form.appointmentDateTime}
            onChange={(event) => onChange({ appointmentDateTime: event.target.value })}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Country *</label>
          <AppSelect
            value={form.country}
            onValueChange={(value) =>
              onChange({
                country: value,
                state: NAVAYU_STATES[value]?.[0]?.value ?? '',
                district: '',
              })
            }
            options={NAVAYU_COUNTRIES.map((item) => ({ value: item.value, label: item.label }))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">State *</label>
          <AppSelect
            value={form.state || undefined}
            onValueChange={(value) =>
              onChange({
                state: value,
                district: NAVAYU_DISTRICTS[value]?.[0]?.value ?? '',
              })
            }
            options={stateOptions.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="Select state"
            className={`w-full ${errors.state ? 'border-destructive' : ''}`}
          />
          {errors.state ? <p className="text-xs text-destructive mt-1">{errors.state}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">District *</label>
          <AppSelect
            value={form.district || undefined}
            onValueChange={(value) => onChange({ district: value })}
            options={districtOptions.map((item) => ({ value: item.value, label: item.label }))}
            placeholder="Select district"
            className={`w-full ${errors.district ? 'border-destructive' : ''}`}
          />
          {errors.district ? <p className="text-xs text-destructive mt-1">{errors.district}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">City *</label>
          <input
            value={form.city}
            onChange={(event) => onChange({ city: event.target.value })}
            className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors.city ? 'border-destructive' : ''}`}
          />
          {errors.city ? <p className="text-xs text-destructive mt-1">{errors.city}</p> : null}
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
          <label className="text-sm font-medium mb-1 block">How did you hear about us? *</label>
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
            <label className="text-sm font-medium mb-1 block">Referring doctor name *</label>
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
      </div>
    </div>
  );
}
