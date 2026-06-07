import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { buildNavayuRuleBasedSummary } from '@/lib/navayu/navayu-summary';
import type { NavayuLumbarExamData, NavayuRegistrationMetadata } from '@/lib/navayu/navayu-forms';
import {
  platformFetchNavayuAiSummary,
  type NavayuIntakeData,
  type NavayuLlmSummaryResult,
} from '@/lib/navayu/navayu-runtime';

interface Props {
  visitId?: string;
  seniorQueue?: boolean;
  registration?: NavayuRegistrationMetadata | null;
  intake?: NavayuIntakeData | null;
  lumbarExam?: NavayuLumbarExamData | null;
  storedSummary?: NavayuLlmSummaryResult | null;
}

export function NavayuAiSummaryPanel({
  visitId,
  seniorQueue,
  registration,
  intake,
  lumbarExam,
  storedSummary,
}: Props) {
  const ruleSections = buildNavayuRuleBasedSummary({
    registration,
    intake,
    lumbarExam,
    seniorQueue,
  });

  const [llm, setLlm] = useState<NavayuLlmSummaryResult | null>(storedSummary ?? null);

  useEffect(() => {
    if (storedSummary?.sections?.length) {
      setLlm(
        storedSummary.mode === 'llm' || storedSummary.mode === 'rule'
          ? storedSummary
          : { mode: 'rule', sections: storedSummary.sections },
      );
      return;
    }
    if (!visitId || !seniorQueue) return;
    void platformFetchNavayuAiSummary(visitId, {
      registration,
      intake,
      lumbarExam,
      seniorQueue,
    }).then(setLlm);
  }, [visitId, seniorQueue, registration, intake, lumbarExam, storedSummary]);

  const sections =
    llm?.mode === 'llm' && llm.sections?.length ? llm.sections : ruleSections;

  const hasData = registration || intake?.answers || (lumbarExam && Object.keys(lumbarExam).length > 0);

  const modeLabel =
    llm?.mode === 'llm'
      ? 'LLM'
      : llm?.mode === 'blocked'
        ? 'rule-based v1 — LLM blocked'
        : 'rule-based v1';

  return (
    <div className="border border-violet-500/30 bg-violet-500/5 rounded-xl p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-violet-700 dark:text-violet-300 font-semibold flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" /> AI Clinical Summary
        <span className="text-[9px] font-normal normal-case text-muted-foreground">({modeLabel})</span>
      </p>

      {llm?.mode === 'blocked' && llm.requiredEnv ? (
        <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
          LLM blocked — set <code className="text-[9px]">{llm.requiredEnv}</code> on domain-api.{' '}
          {llm.blockedReason}
        </p>
      ) : null}

      {!hasData ? (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {seniorQueue
            ? 'Senior review queue — summary will populate when registration, intake, and junior MSK exam data are available.'
            : 'Complete reception registration, patient intake, and junior MSK exam to generate the structured summary.'}
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
