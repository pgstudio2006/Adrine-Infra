import { createLifecycleRuntime } from './lifecycle-runtime.js';
import {
  inventoryStockMoveLifecycle,
  type InventoryStockMoveState,
} from '../lifecycles/inventory-stock-move.js';
import {
  runInventoryValidations,
  type InventoryValidationContext,
} from '../inventory/inventory-validation.js';

const inventoryRuntime = createLifecycleRuntime<
  InventoryStockMoveState,
  InventoryValidationContext
>({
  definition: inventoryStockMoveLifecycle,
  validate: runInventoryValidations,
});

export const evaluateInventoryTransition = inventoryRuntime.evaluate.bind(inventoryRuntime);
export const listAllowedInventoryActions = inventoryRuntime.allowedActions.bind(inventoryRuntime);

export const INVENTORY_MOVE_TERMINAL: readonly InventoryStockMoveState[] = [
  'received',
  'cancelled',
];
