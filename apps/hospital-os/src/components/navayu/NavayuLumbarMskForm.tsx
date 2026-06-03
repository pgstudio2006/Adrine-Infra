import { getNavayuLumbarForm, type NavayuLumbarExamData } from '@/lib/navayu/navayu-forms';
import { NavayuMetadataForm } from '@/components/navayu/NavayuMetadataForm';

interface Props {
  value: NavayuLumbarExamData;
  onChange: (next: NavayuLumbarExamData) => void;
}

/** @deprecated Prefer NavayuMskExamPanel — kept for queue compatibility. */
export function NavayuLumbarMskForm({ value, onChange }: Props) {
  const form = getNavayuLumbarForm();
  return <NavayuMetadataForm form={form} value={value} onChange={onChange} />;
}
