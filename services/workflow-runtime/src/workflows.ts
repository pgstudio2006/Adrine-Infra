import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { logStep } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function opdJourney(): Promise<string> {
  await logStep({ workflow: 'opdJourney', step: 'check-in' });
  await logStep({ workflow: 'opdJourney', step: 'consultation' });
  return 'opd-complete';
}

export async function dischargeSummaryDraft(): Promise<string> {
  await logStep({ workflow: 'dischargeSummary', step: 'collect-encounter' });
  await logStep({ workflow: 'dischargeSummary', step: 'ai-draft' });
  return 'discharge-draft-ready';
}

export async function appointmentReminder(): Promise<string> {
  await logStep({ workflow: 'appointmentReminder', step: 'notify-patient' });
  return 'reminder-sent';
}
