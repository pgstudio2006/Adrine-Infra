import { FlaskConical } from 'lucide-react';
import { NavayuMetadataForm, type NavayuFormValues } from '@/components/navayu/NavayuMetadataForm';
import { getNavayuInvestigationsForm } from '@/lib/navayu/navayu-forms';
import { platformUploadNavayuInvestigation } from '@/lib/navayu/navayu-runtime';

interface Props {
  visitId?: string;
  value: NavayuFormValues;
  onChange: (next: NavayuFormValues) => void;
}

export function NavayuInvestigationsPanel({ visitId, value, onChange }: Props) {
  const form = getNavayuInvestigationsForm();

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (visitId) {
      const entry = await platformUploadNavayuInvestigation(visitId, fieldId, file);
      const existing = (value[fieldId] as unknown[]) ?? [];
      onChange({ ...value, [fieldId]: [...existing, entry] });
      return;
    }
    const entry = {
      fileName: file.name,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      stub: true,
    };
    const existing = (value[fieldId] as unknown[]) ?? [];
    onChange({ ...value, [fieldId]: [...existing, entry] });
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
        <FlaskConical className="w-3.5 h-3.5" /> Investigations
      </p>
      <NavayuMetadataForm
        form={form}
        value={value}
        onChange={onChange}
        visitId={visitId}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}
