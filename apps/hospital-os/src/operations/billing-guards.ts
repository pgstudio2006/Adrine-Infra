import { evaluateInvoiceTransition, type InvoiceState } from '@adrine/hospital-operations';
import { getBranchConfigOverrides } from '@/runtime/branch-config';
import { transitionFailureReason } from '@/operations/transition-errors';
import { toast } from 'sonner';

export function guardInvoiceTransition(
  from: InvoiceState,
  action: string,
  role: string,
  context?: Parameters<typeof evaluateInvoiceTransition>[0]['validationContext'],
): void {
  const result = evaluateInvoiceTransition({
    state: from,
    action,
    actorRole: role,
    validationContext: context,
    branchOverrides: getBranchConfigOverrides(),
  });
  if (!result.ok) {
    const reason = transitionFailureReason(result, 'Billing action blocked');
    toast.error('Billing action blocked', { description: reason });
    throw new Error(reason);
  }
}
