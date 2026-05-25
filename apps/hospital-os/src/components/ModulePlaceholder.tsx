import { ModuleKey } from '@/types/roles';

interface ModulePageProps {
  moduleKey: ModuleKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ModulePlaceholder({ title, description, icon: Icon }: ModulePageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold tracking-tight mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
      <div className="mt-6 px-4 py-2 rounded-md bg-muted text-xs text-muted-foreground font-medium">
        Module under development
      </div>
    </div>
  );
}
