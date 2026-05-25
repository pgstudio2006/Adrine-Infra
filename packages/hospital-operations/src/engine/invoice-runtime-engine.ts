import { createLifecycleRuntime } from './lifecycle-runtime.js';
import { invoiceLifecycle, type InvoiceState } from '../lifecycles/billing-payment.js';
import { runInvoiceValidations, type InvoiceValidationContext } from '../opd/billing-validation.js';

const invoiceRuntime = createLifecycleRuntime<InvoiceState, InvoiceValidationContext>({
  definition: invoiceLifecycle,
  validate: runInvoiceValidations,
  policyCheck: (transition, ctx) => {
    if (transition.action === 'settle_invoice' && ctx.notAlreadySettled === false) {
      return 'Duplicate settlement prevented';
    }
    return null;
  },
});

export function evaluateInvoiceTransition(
  req: Parameters<typeof invoiceRuntime.evaluate>[0],
) {
  return invoiceRuntime.evaluate(req);
}
export const listAllowedInvoiceActions = invoiceRuntime.allowedActions.bind(invoiceRuntime);
export const getInvoiceTransition = invoiceRuntime.getTransition.bind(invoiceRuntime);
