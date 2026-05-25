import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { OperationsWorklistRow } from '@/components/operations/OperationsWorklistRow';
import { Button } from '@/components/ui/button';
import { useInventoryPlatformData } from '@/hooks/useInventoryPlatformData';
import { useAuth } from '@/contexts/AuthContext';
import {
  getInventoryMoveNextAction,
  INVENTORY_MOVE_STATE_LABELS,
  inventoryStateBadgeClass,
} from '@/lib/operations/module-lifecycle-ui';
import { platformInventoryTransition } from '@/runtime/inventory-runtime';
import { guardInventoryTransition } from '@/operations/ot-inventory-dialysis-guards';
import type { PlatformStockMove } from '@/runtime/inventory-runtime';
import { ClipboardCheck } from 'lucide-react';

const RECEIVABLE_STATES = new Set(['issued', 'in_transit']);

export default function InventoryGrn() {
  const { user } = useAuth();
  const { platformOn, moves, loading, refresh } = useInventoryPlatformData();

  const receivable = useMemo(
    () =>
      moves.filter((m) => RECEIVABLE_STATES.has(m.state) || m.moveType === 'receive'),
    [moves],
  );

  const receive = async (move: PlatformStockMove) => {
    try {
      guardInventoryTransition(move.state, 'receive_stock', user.role, {
        receiptConfirmed: true,
      });
      if (platformOn) {
        await platformInventoryTransition(
          move.id,
          'receive_stock',
          { receiptConfirmed: true },
          move.version,
        );
        await refresh();
      }
      toast.success(`GRN received — ${move.catalogItem?.name ?? 'stock move'}`);
    } catch {
      /* guard toast */
    }
  };

  return (
    <OperationsModulePage
      module="inventory"
      layout="board"
      title="GRN receive"
      subtitle="Confirm inbound stock with receive_stock transition"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/inventory/stock-entry">
            <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
            Stock entry
          </Link>
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading stock moves…</p>
      ) : receivable.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No moves awaiting receipt. Issue or transfer stock first, then receive here.
        </p>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {receivable.map((m) => (
            <OperationsWorklistRow
              key={m.id}
              primary={m.catalogItem?.name ?? 'Stock move'}
              secondary={`${m.quantity} ${m.catalogItem?.unit ?? 'units'} • ${m.fromLocation ?? 'Central'} → ${m.toLocation ?? '—'}`}
              meta={`${m.moveType} • v${m.version}`}
              stateLabel={INVENTORY_MOVE_STATE_LABELS[m.state] ?? m.state}
              stateClassName={inventoryStateBadgeClass(m.state)}
              nextAction={
                RECEIVABLE_STATES.has(m.state)
                  ? { action: 'receive_stock', label: 'Receive (GRN)', href: undefined }
                  : getInventoryMoveNextAction(m.state, user.role)
              }
              onAction={() => void receive(m)}
            />
          ))}
        </div>
      )}
    </OperationsModulePage>
  );
}
