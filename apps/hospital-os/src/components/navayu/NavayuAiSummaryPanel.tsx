import { Sparkles } from 'lucide-react';
import { buildNavayuRuleBasedSummary } from '@/lib/navayu/navayu-summary';
import type { NavayuLumbarExamData, NavayuRegistrationMetadata } from '@/lib/navayu/navayu-forms';
import type { NavayuIntakeData } from '@/lib/navayu/navayu-runtime';

interface Props {
  seniorQueue?: boolean;
  registration?: NavayuRegistrationMetadata | null;
  intake?: NavayuIntakeData | null;
  lumbarExam?: NavayuLumbarExamData | null;
}

export function NavayuAiSummaryPanel({
  seniorQueue,
  registration,
  intake,
  lumbarExam,
}: Props) {
  const sections = buildNavayuRuleBasedSummary({
    registration,
    intake,
    lumbarExam,
    seniorQueue,
  });

  const hasData = registration || intake?.answers || (lumbarExam && Object.keys(lumbarExam).length > 0);

  return (
    <div className="border border-violet-500/30 bg-violet-500/5 rounded-xl p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-violet-700 dark:text-violet-300 font-semibold flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> AI Clinical Summary
        <span className="text-[9px] font-normal normal-case text-muted-foreground">(rule-based v1)</span>
      </p>

      {!hasData ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {seniorQueue
            ? 'Senior review queue — summary will populate when registration, intake, and junior MSK exam data are available.'
            : 'Complete reception registration, patient intake, and junior lumbar exam to generate the structured summary.'}
        </p>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.label}
              className={`rounded-lg border p-3 text-xs space-y-1 ${
                section.urgent
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-violet-500/20 bg-background/60'
              }`}
            >
              <p className="font-semibold text-foreground">{section.label}</p>
              <ul className="space-y-0.5 text-muted-foreground">
                {section.lines.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
