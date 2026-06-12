/**
 * ModuleWorkspace — standard 2026 screen for extended/planned module routes.
 * Replaces "Coming soon" placeholders with a functional operational layout:
 * metrics, workflow sequencing, and the advisory AI panel.
 */
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PageScaffold,
  MetricGrid,
  SectionPanel,
  WorkflowStepper,
} from '@/components/adrine/primitives';
import { AIInsightPanel } from '@/components/adrine/ai-panel';
import { getModulePreset } from '@/lib/adrine/module-presets';

export default function ModuleWorkspace({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const navigate = useNavigate();
  const preset = getModulePreset(title);

  return (
    <PageScaffold
      eyebrow={preset.eyebrow}
      title={title}
      subtitle={subtitle ?? preset.subtitle}
      actions={
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
      }
    >
      <MetricGrid metrics={preset.metrics} />

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionPanel title="Workflow">
          <WorkflowStepper steps={preset.workflow} />
        </SectionPanel>
        <AIInsightPanel insights={preset.insights} />
      </div>
    </PageScaffold>
  );
}
