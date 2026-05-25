import { useBillingPageBanner, useBillingDeptPlatform } from '@/hooks/useBillingDeptPlatform';
import { useBillingDeptGates } from '@/hooks/useBillingDeptGates';
import { BillingReadinessStrip } from '@/components/billing/BillingReadinessStrip';
import { BillingPlatformStrip } from '@/components/billing/BillingPlatformStrip';
import { BillingGateAlerts } from '@/components/billing/BillingGateAlerts';
import type { BillingGateId } from '@/components/billing/billing-gate-messages';

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  blockers?: string[];
  warnings?: string[];
  platformError?: string | null;
  platformLabel?: string;
  gateFocus?: BillingGateId | 'all';
  showPlatformStrip?: boolean;
};

export function BillingDeptShell({
  title,
  subtitle,
  actions,
  children,
  blockers = [],
  warnings = [],
  platformError,
  platformLabel,
  gateFocus = 'all',
  showPlatformStrip = true,
}: Props) {
  const pageBanner = useBillingPageBanner();
  const { platformOn } = useBillingDeptPlatform();
  const branchGates = useBillingDeptGates();

  const focus =
    gateFocus === 'GAP-006' || gateFocus === 'GAP-007' ? gateFocus : 'all';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions}
      </div>

      {pageBanner && pageBanner !== 'live' && (
        <BillingReadinessStrip mode={pageBanner} />
      )}

      {platformOn && (
        <BillingGateAlerts
          blockers={blockers}
          extra={branchGates.messages}
          focus={focus}
        />
      )}

      {showPlatformStrip && platformOn && (
        <BillingPlatformStrip
          platformOn={platformOn}
          blockers={blockers}
          warnings={warnings}
          error={platformError}
          label={platformLabel}
        />
      )}

      {children}
    </div>
  );
}
