import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { OperationsModulePage } from '@/components/operations/OperationsModulePage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventoryPlatformData } from '@/hooks/useInventoryPlatformData';
import { useAuth } from '@/contexts/AuthContext';
import {
  platformCreateStockMove,
  platformInventoryTransition,
} from '@/runtime/inventory-runtime';
import { guardInventoryTransition } from '@/operations/ot-inventory-dialysis-guards';
import { ArrowLeft, ArrowRight, Package } from 'lucide-react';

const DESTINATIONS = ['OT Department', 'Emergency Ward', 'ICU', 'General Ward', 'Pharmacy', 'Laboratory'];

export default function InventoryIssue() {
  const { user } = useAuth();
  const { platformOn, catalog, refresh } = useInventoryPlatformData();
  const [step, setStep] = useState(0);
  const [catalogItemId, setCatalogItemId] = useState('');
  const [qty, setQty] = useState('1');
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => catalog.find((i) => i.id === catalogItemId),
    [catalog, catalogItemId],
  );

  const submitIssue = async () => {
    if (!selected) {
      toast.error('Select a catalog item');
      return;
    }
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    setBusy(true);
    try {
      if (platformOn) {
        const move = await platformCreateStockMove({
          catalogItemId: selected.id,
          moveType: 'issue',
          quantity,
          toLocation: destination,
        });
        guardInventoryTransition('draft', 'submit_move', user.role, {
          quantityPositive: true,
          catalogItemActive: true,
        });
        const submitted = await platformInventoryTransition(move.id, 'submit_move', {
          quantityPositive: true,
          catalogItemActive: true,
        }, move.version);
        guardInventoryTransition(submitted.move.state, 'approve_move', user.role, {
          approvalWithinPolicy: true,
        });
        const approved = await platformInventoryTransition(
          submitted.move.id,
          'approve_move',
          { approvalWithinPolicy: true },
          submitted.move.version,
        );
        guardInventoryTransition(approved.move.state, 'issue_stock', user.role, {
          stockAvailable: true,
        });
        await platformInventoryTransition(
          approved.move.id,
          'issue_stock',
          { stockAvailable: true },
          approved.move.version,
        );
        await refresh();
        toast.success(`Issued ${quantity} ${selected.unit} to ${destination}`);
      } else {
        toast.success(`Demo issue: ${selected.name} × ${quantity} → ${destination}`);
      }
      setStep(0);
      setCatalogItemId('');
      setQty('1');
    } catch {
      /* guard handles toast */
    } finally {
      setBusy(false);
    }
  };

  return (
    <OperationsModulePage
      module="inventory"
      layout="detail"
      title="Stock issue"
      subtitle="Guided issue from catalog — submit, approve, and issue on platform spine"
      showConnectivity
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="/inventory/catalog">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Catalog
          </Link>
        </Button>
      }
    >
      <div className="flex gap-2 text-xs text-muted-foreground mb-4">
        {['Select item', 'Quantity & destination', 'Confirm'].map((label, i) => (
          <span
            key={label}
            className={i === step ? 'text-foreground font-medium' : ''}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <Card className="border-border/60 max-w-xl">
        <CardContent className="p-6 space-y-4">
          {step === 0 && (
            <>
              <Label>Catalog item</Label>
              <Select value={catalogItemId} onValueChange={setCatalogItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose SKU to issue" />
                </SelectTrigger>
                <SelectContent>
                  {(catalog.length > 0 ? catalog : []).map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.sku} — {i.name} ({i.qtyOnHand} {i.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!platformOn && (
                <p className="text-xs text-muted-foreground">
                  Enable platform runtime to load live catalog SKUs.
                </p>
              )}
            </>
          )}
          {step === 1 && selected && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selected.name}</span>
                <span className="text-muted-foreground">({selected.qtyOnHand} on hand)</span>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={selected.qtyOnHand}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Issue to</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {step === 2 && selected && (
            <div className="text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Item:</span> {selected.name} ({selected.sku})
              </p>
              <p>
                <span className="text-muted-foreground">Quantity:</span> {qty} {selected.unit}
              </p>
              <p>
                <span className="text-muted-foreground">Destination:</span> {destination}
              </p>
              <p className="text-xs text-muted-foreground">
                Platform path: draft → submit → approve → issue_stock
              </p>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={step === 0 || busy}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {step < 2 ? (
              <Button
                size="sm"
                disabled={step === 0 && !catalogItemId}
                onClick={() => setStep((s) => s + 1)}
              >
                Next
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button size="sm" disabled={busy} onClick={() => void submitIssue()}>
                {busy ? 'Issuing…' : 'Confirm issue'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </OperationsModulePage>
  );
}
