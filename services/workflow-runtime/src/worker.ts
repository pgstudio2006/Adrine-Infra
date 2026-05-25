import { existsSync } from 'node:fs';
import path from 'node:path';
import { NativeConnection, Worker, bundleWorkflowCode } from '@temporalio/worker';
import * as activities from './activities';

async function main(): Promise<void> {
  const address = process.env.TEMPORAL_ADDRESS ?? '127.0.0.1:7233';
  const connection = await NativeConnection.connect({ address });

  const tsWorkflows = path.join(__dirname, 'workflows.ts');
  const jsWorkflows = path.join(__dirname, 'workflows.js');
  const workflowsPath = existsSync(tsWorkflows) ? tsWorkflows : jsWorkflows;
  const workflowBundle = await bundleWorkflowCode({
    workflowsPath,
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'adrine-healthcare',
    workflowBundle,
    activities,
  });

  await worker.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
