import { HospitalPlatformEvents } from '../events.js';
import type { LifecycleDefinition } from '../types.js';

export type NursingTaskState =
  | 'scheduled'
  | 'acknowledged'
  | 'in_progress'
  | 'completed'
  | 'escalated'
  | 'missed';

export const nursingTaskLifecycle: LifecycleDefinition<NursingTaskState> = {
  id: 'nursing_round',
  label: 'Nursing task',
  initial: 'scheduled',
  states: ['scheduled', 'acknowledged', 'in_progress', 'completed', 'escalated', 'missed'],
  transitions: [
    {
      from: 'scheduled',
      to: 'acknowledged',
      action: 'acknowledge_task',
      roles: ['nurse', 'nurse_supervisor'],
      validations: ['nurse_assigned'],
      emits: [HospitalPlatformEvents.nursing.taskAcknowledged],
      metering: ['nursing.task.acknowledged'],
      auditLevel: 'standard',
    },
    {
      from: 'acknowledged',
      to: 'in_progress',
      action: 'start_task',
      roles: ['nurse'],
      emits: [HospitalPlatformEvents.nursing.taskStarted],
      auditLevel: 'standard',
    },
    {
      from: 'in_progress',
      to: 'completed',
      action: 'complete_task',
      roles: ['nurse', 'nurse_supervisor'],
      validations: ['task_documentation_complete'],
      emits: [HospitalPlatformEvents.nursing.taskCompleted],
      metering: ['nursing.task.completed'],
      auditLevel: 'phi',
    },
    {
      from: ['scheduled', 'acknowledged', 'in_progress'],
      to: 'escalated',
      action: 'escalate_task',
      roles: ['nurse', 'nurse_supervisor', 'doctor'],
      validations: ['escalation_reason_provided'],
      emits: [HospitalPlatformEvents.nursing.taskEscalated, HospitalPlatformEvents.workflow.escalated],
      notifications: ['nursing_escalation_alert'],
      auditLevel: 'critical',
    },
    {
      from: ['scheduled', 'acknowledged'],
      to: 'missed',
      action: 'mark_missed',
      roles: ['nurse_supervisor', 'admin'],
      validations: ['miss_reason_documented'],
      emits: [HospitalPlatformEvents.nursing.taskMissed],
      auditLevel: 'standard',
    },
    {
      from: 'escalated',
      to: 'in_progress',
      action: 'resume_after_escalation',
      roles: ['nurse', 'nurse_supervisor', 'doctor'],
      auditLevel: 'standard',
    },
    {
      from: 'escalated',
      to: 'completed',
      action: 'resolve_escalation',
      roles: ['nurse_supervisor', 'doctor'],
      validations: ['task_documentation_complete'],
      emits: [HospitalPlatformEvents.nursing.taskCompleted],
      auditLevel: 'phi',
    },
  ],
};
