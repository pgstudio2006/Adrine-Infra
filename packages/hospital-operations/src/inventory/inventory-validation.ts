export type InventoryValidationContext = {
  quantityPositive?: boolean;
  catalogItemActive?: boolean;
  approvalWithinPolicy?: boolean;
  stockAvailable?: boolean;
  receiptConfirmed?: boolean;
  cancelReasonProvided?: boolean;
};

const VALIDATORS: Record<string, (c: InventoryValidationContext) => string | null> = {
  quantity_positive: (c) => (c.quantityPositive === false ? 'Quantity must be positive' : null),
  catalog_item_active: (c) =>
    c.catalogItemActive === false ? 'Catalog item inactive or missing' : null,
  approval_within_policy: (c) =>
    c.approvalWithinPolicy === false ? 'Move exceeds approval policy' : null,
  stock_available: (c) => (c.stockAvailable === false ? 'Insufficient stock on hand' : null),
  receipt_confirmed: (c) => (c.receiptConfirmed === false ? 'Receipt must be confirmed' : null),
  cancel_reason_provided: (c) =>
    c.cancelReasonProvided === false ? 'Cancellation reason required' : null,
};

export function runInventoryValidations(
  validationIds: readonly string[] | undefined,
  ctx: InventoryValidationContext,
): string | null {
  if (!validationIds?.length) return null;
  for (const id of validationIds) {
    const fn = VALIDATORS[id];
    if (!fn) continue;
    const err = fn(ctx);
    if (err) return err;
  }
  return null;
}
