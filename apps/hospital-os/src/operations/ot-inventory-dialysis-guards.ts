import {
  evaluateOtTransition,
  evaluateInventoryTransition,
  evaluateDialysisTransition,
  type OtValidationContext,
  type InventoryValidationContext,
  type DialysisValidationContext,
} from '@adrine/hospital-operations';
import { getBranchConfigOverrides } from '@/runtime/branch-config';
import { transitionFailureReason } from '@/operations/transition-errors';
import { toast } from 'sonner';

export function guardOtTransition(
  from: string,
  action: string,
  role: string,
  context?: OtValidationContext,
): void {
  const result = evaluateOtTransition({
    state: from,
    action,
    actorRole: role,
    validationContext: context,
    branchOverrides: getBranchConfigOverrides(),
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result, 'OT action blocked');
    toast.error('OT action blocked', { description: reason });
    throw new Error(reason);
  }
}

export function guardInventoryTransition(
  from: string,
  action: string,
  role: string,
  context?: InventoryValidationContext,
): void {
  const result = evaluateInventoryTransition({
    state: from,
    action,
    actorRole: role,
    validationContext: context,
    branchOverrides: getBranchConfigOverrides(),
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result, 'Inventory move blocked');
    toast.error('Inventory move blocked', { description: reason });
    throw new Error(reason);
  }
}

export function guardDialysisTransition(
  from: string,
  action: string,
  role: string,
  context?: DialysisValidationContext,
): void {
  const result = evaluateDialysisTransition({
    state: from,
    action,
    actorRole: role,
    validationContext: context,
    branchOverrides: getBranchConfigOverrides(),
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result, 'Dialysis step blocked');
    toast.error('Dialysis step blocked', { description: reason });
    throw new Error(reason);
  }
}
