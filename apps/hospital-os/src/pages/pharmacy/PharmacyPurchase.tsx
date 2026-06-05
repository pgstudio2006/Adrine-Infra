import { ConnectedOpsPage } from '@/components/platform/ConnectedOpsPage';

export default function PharmacyPurchase() {
  return (
    <ConnectedOpsPage
      title="Purchase Orders"
      description="Procurement workspace connected to live inventory, dispensing, and billing operations."
      focus="purchase"
    />
  );
}
