// ── Adrine AI Intelligence Layer — Barrel Export ──
//
// 7 Intelligence Layers + AI Command Center Morning Briefing
//
// Layer 1: Financial Intelligence (CFO's Best Friend)
// Layer 2: Workforce Intelligence (HRMS AI)
// Layer 3: Operations Intelligence (COO's Dashboard)
// Layer 4: Strategic Intelligence (CEO's War Room)
// Layer 5: Revenue Cycle Intelligence (Billing/Finance)
// Layer 6: Clinical Intelligence (Quality & Safety)
// Layer 7: Procurement Intelligence (SAP-like)
// Command Center: Morning Briefing

// ── Types ──
export type * from './types';

// ── Hooks (primary consumption pattern for React components) ──
export { useFinancialIntelligence } from './hooks/useFinancialIntelligence';
export { useWorkforceIntelligence } from './hooks/useWorkforceIntelligence';
export { useOperationsIntelligence } from './hooks/useOperationsIntelligence';
export { useStrategicIntelligence } from './hooks/useStrategicIntelligence';
export { useRevenueCycleIntelligence } from './hooks/useRevenueCycleIntelligence';
export { useClinicalIntelligence } from './hooks/useClinicalIntelligence';
export { useProcurementIntelligence } from './hooks/useProcurementIntelligence';
export { useMorningBriefing } from './hooks/useMorningBriefing';

// ── Inline clinical safety hooks ──
export { useDrugSafetyCheck } from './hooks/useDrugSafetyCheck';
export { useCriticalValueAlert } from './hooks/useCriticalValueAlert';

// ── Direct engine access (for non-React contexts / testing) ──
export { computeFinancialIntelligence } from './engines/financial.engine';
export { computeWorkforceIntelligence } from './engines/workforce.engine';
export { computeOperationsIntelligence } from './engines/operations.engine';
export { computeStrategicIntelligence } from './engines/strategic.engine';
export { computeRevenueCycleIntelligence } from './engines/revenue-cycle.engine';
export { computeClinicalIntelligence, checkDrugAllergySafety, checkDrugInteractions, detectCriticalLabValues } from './engines/clinical.engine';
export { computeProcurementIntelligence } from './engines/procurement.engine';
export { computeMorningBriefing } from './engines/morning-briefing.engine';
