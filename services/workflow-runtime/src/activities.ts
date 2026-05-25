import { log } from '@temporalio/activity';

export async function logStep(input: { workflow: string; step: string }): Promise<void> {
  log.info('workflow-step', input);
}
