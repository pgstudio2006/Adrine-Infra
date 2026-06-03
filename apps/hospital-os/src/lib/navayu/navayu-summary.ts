import {
  painRegionLabel,
  referralLabel,
  type NavayuLumbarExamData,
  type NavayuRegistrationMetadata,
} from '@/lib/navayu/navayu-forms';
import type { NavayuIntakeData } from '@/lib/navayu/navayu-runtime';

export type NavayuSummarySection = {
  label: string;
  lines: string[];
  urgent?: boolean;
};

export function buildNavayuRuleBasedSummary(input: {
  registration?: NavayuRegistrationMetadata | null;
  intake?: NavayuIntakeData | null;
  lumbarExam?: NavayuLumbarExamData | null;
  seniorQueue?: boolean;
}): NavayuSummarySection[] {
  const sections: NavayuSummarySection[] = [];

  if (input.registration) {
    const lifestyle = Object.entries(input.registration.lifestyle)
      .filter(([, active]) => active)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    sections.push({
      label: 'Registration snapshot',
      lines: [
        `Referral: ${referralLabel(input.registration.hearAboutNavayu)}`,
        input.registration.bodyRegions.length
          ? `Pain regions: ${input.registration.bodyRegions.map(painRegionLabel).join(', ')}`
          : 'Pain regions: not specified',
        lifestyle.length ? `Lifestyle flags: ${lifestyle.join(', ')}` : 'Lifestyle flags: none',
      ],
    });
  }

  const answers = input.intake?.answers;
  if (answers) {
    const redFlags = answers.redFlag ?? answers.redFlags ?? [];
    const urgent = redFlags.length > 0 && !redFlags.every((f) => f === 'none');
    sections.push({
      label: 'Patient intake',
      urgent,
      lines: [
        answers.complaintType ? `Complaint type: ${answers.complaintType}` : null,
        answers.complaintText ? `Chief complaint: ${answers.complaintText}` : null,
        answers.durationBucket ? `Duration: ${answers.durationBucket}` : null,
        answers.vas != null ? `Pain VAS: ${answers.vas}/10` : null,
        redFlags.length
          ? `Red flags: ${redFlags.join(', ')}${urgent ? ' — review urgently' : ''}`
          : 'Red flags: none reported',
      ].filter(Boolean) as string[],
    });
  }

  const exam = input.lumbarExam;
  if (exam && (exam.odi != null || exam.vas != null || exam.slrt || exam.neuroNotes)) {
    const neuroConcern =
      exam.slrt && exam.slrt !== 'negative'
        ? 'Positive SLR — consider radiculopathy'
        : null;
    sections.push({
      label: 'Junior lumbar MSK exam',
      lines: [
        exam.odi != null ? `ODI: ${exam.odi}%` : null,
        exam.vas != null ? `VAS: ${exam.vas}/10` : null,
        exam.slrt ? `SLR: ${exam.slrt.replace(/_/g, ' ')}` : null,
        exam.femoralStretch ? `Femoral stretch: ${exam.femoralStretch}` : null,
        exam.gait ? `Gait/posture: ${exam.gait}` : null,
        exam.neuroNotes ? `Neuro: ${exam.neuroNotes}` : null,
        neuroConcern,
      ].filter(Boolean) as string[],
    });
  }

  const urgentIntake = input.intake?.urgent || input.intake?.answers?.redFlag?.some((f) => f !== 'none');
  const suggested: string[] = [];
  if (urgentIntake) {
    suggested.push('Urgent review — intake red flags present; senior consult priority.');
  } else if (input.seniorQueue) {
    suggested.push('Proceed with senior MSK consult; junior documentation available for review.');
  } else if (exam?.slrt && exam.slrt !== 'negative') {
    suggested.push('Consider imaging / physio referral based on positive SLR.');
  } else {
    suggested.push('Complete junior MSK exam and intake review before senior handoff.');
  }

  if (exam?.odi != null && exam.odi >= 40) {
    suggested.push('ODI ≥40% — moderate–severe functional limitation; document counselling plan.');
  }

  sections.push({
    label: input.seniorQueue ? 'Suggested next steps (rule-based v1)' : 'Clinical handoff notes',
    lines: suggested,
    urgent: !!urgentIntake,
  });

  return sections;
}
