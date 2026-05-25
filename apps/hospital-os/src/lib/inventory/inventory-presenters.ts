import type { PlatformInventoryItem, PlatformStockMove } from '@/runtime/inventory-runtime';

export function mapCatalogToUiItem(item: PlatformInventoryItem) {
  return {
    sku: item.sku,
    name: item.name,
    category: item.category,
    unit: item.unit,
    qty: item.qtyOnHand,
    reorder: item.reorderLevel,
    value: `₹${(item.qtyOnHand * item.unitCostCents) / 100}`,
  };
}

export function mapMoveToRecentRow(move: PlatformStockMove) {
  const name = move.catalogItem?.name ?? 'Item';
  const type = move.moveType === 'receive' || move.moveType === 'adjustment' ? 'in' : 'out';
  return {
    type: type as 'in' | 'out',
    item: name,
    qty: `${type === 'in' ? '+' : '-'}${move.quantity} ${move.catalogItem?.unit ?? 'pcs'}`,
    dept: move.toLocation ?? move.fromLocation ?? move.moveType,
    time: move.state,
  };
}
