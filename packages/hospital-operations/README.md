# @adrine/hospital-operations

Canonical operational model for Adrine Hospital OS: lifecycles, platform events, journey spines, and gap analysis.

Hospital OS UI imports this package; persistence and automation remain in `kernel-api`, `domain-api`, and workflow runtime.

## Contents

- `HospitalPlatformEvents` — names for event bus / metering / automations
- Lifecycle definitions — OPD, IPD admission, emergency, lab, billing
- `OPERATIONAL_JOURNEYS` — correct step order (front desk, clinical OPD, IPD, ED)
- `OPERATIONAL_NAV_BY_ROLE` — journey-first navigation overlays
- `CURRENT_OPERATIONAL_GAPS` — prioritized remediation list

## Usage

```ts
import { evaluateOpdTransition, opdVisitLifecycle, HospitalPlatformEvents } from '@adrine/hospital-operations';

const check = evaluateOpdTransition({
  visitState: 'checked_in',
  action: 'issue_token',
  actorRole: 'receptionist',
  validationContext: { tokenNotDuplicateToday: true },
});
```

## OPD production runtime

Authoritative OPD state lives in **domain-api** (`OpdVisit` + `OpdVisitTransition`). The engine in `engine/opd-runtime-engine.ts` is the single ruleset used by API and Hospital OS guards.

Enable in Hospital OS: `VITE_PLATFORM_RUNTIME=true` with kernel + domain APIs running.
