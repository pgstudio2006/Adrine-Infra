import {
  DEFAULT_NAVAYU_LIFESTYLE,
  getNavayuLifestyleFields,
  getNavayuPainRegionOptions,
  getNavayuReferralOptions,
  type NavayuLifestyleFlags,
  type NavayuRegistrationMetadata,
} from '@/lib/navayu/navayu-forms';
import { AppSelect } from '@/components/ui/app-select';

export type NavayuRegistrationFormState = {
  hearAboutNavayu: string;
  lifestyle: NavayuLifestyleFlags;
  bodyRegions: string[];
};

export function createDefaultNavayuRegistrationState(): NavayuRegistrationFormState {
  return {
    hearAboutNavayu: '',
    lifestyle: { ...DEFAULT_NAVAYU_LIFESTYLE },
    bodyRegions: [],
  };
}

export function toNavayuRegistrationMetadata(state: NavayuRegistrationFormState): NavayuRegistrationMetadata {
  return {
    hearAboutNavayu: state.hearAboutNavayu,
    lifestyle: state.lifestyle,
    bodyRegions: state.bodyRegions,
    registeredAt: new Date().toISOString(),
  };
}

interface Props {
  value: NavayuRegistrationFormState;
  onChange: (next: NavayuRegistrationFormState) => void;
  errors?: { hearAboutNavayu?: string };
}

export function NavayuRegistrationFields({ value, onChange, errors }: Props) {
  const referralOptions = getNavayuReferralOptions();
  const lifestyleFields = getNavayuLifestyleFields();
  const painRegions = getNavayuPainRegionOptions();

  const toggleRegion = (region: string) => {
    const next = value.bodyRegions.includes(region)
      ? value.bodyRegions.filter((item) => item !== region)
      : [...value.bodyRegions, region];
    onChange({ ...value, bodyRegions: next });
  };

  const toggleLifestyle = (key: keyof NavayuLifestyleFlags) => {
    onChange({
      ...value,
      lifestyle: { ...value.lifestyle, [key]: !value.lifestyle[key] },
    });
  };

  return (
    <div className="border-t pt-4 mt-4 space-y-5">
      <div>
        <h3 className="text-sm font-semibold mb-1">MSK intake (Gurgaon)</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Referral, lifestyle, and pain regions sync to the doctor consult and CRM when platform runtime is on.
        </p>
        <label className="text-sm font-medium mb-1 block">How did you hear about us? *</label>
        <AppSelect
          value={value.hearAboutNavayu}
          onValueChange={(hearAboutNavayu) => onChange({ ...value, hearAboutNavayu })}
          options={[
            { value: '', label: 'Select referral source' },
            ...referralOptions.map((option) => ({ value: option.value, label: option.label })),
          ]}
          className={`w-full px-3 py-2 rounded-lg border bg-background text-sm ${errors?.hearAboutNavayu ? 'border-destructive' : ''}`}
        />
        {errors?.hearAboutNavayu && (
          <p className="text-xs text-destructive mt-1">{errors.hearAboutNavayu}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Lifestyle snapshot</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {lifestyleFields.map((field) => {
            const key = field.id as keyof NavayuLifestyleFlags;
            const active = value.lifestyle[key];
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => toggleLifestyle(key)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                  active ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                }`}
              >
                {field.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Affected pain regions</label>
        <div className="flex flex-wrap gap-2">
          {painRegions.map((region) => {
            const selected = value.bodyRegions.includes(region.value);
            return (
              <button
                key={region.value}
                type="button"
                onClick={() => toggleRegion(region.value)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  selected ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                }`}
              >
                {region.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
