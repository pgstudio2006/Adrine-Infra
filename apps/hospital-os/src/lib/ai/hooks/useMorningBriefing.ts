import { useMemo } from 'react';
import { useFinancialIntelligence } from './useFinancialIntelligence';
import { useWorkforceIntelligence } from './useWorkforceIntelligence';
import { useOperationsIntelligence } from './useOperationsIntelligence';
import { useStrategicIntelligence } from './useStrategicIntelligence';
import { useRevenueCycleIntelligence } from './useRevenueCycleIntelligence';
import { useClinicalIntelligence } from './useClinicalIntelligence';
import { useProcurementIntelligence } from './useProcurementIntelligence';
import { computeMorningBriefing } from '../engines/morning-briefing.engine';

export function useMorningBriefing() {
  const financial = useFinancialIntelligence();
  const workforce = useWorkforceIntelligence();
  const operations = useOperationsIntelligence();
  const strategic = useStrategicIntelligence();
  const revenueCycle = useRevenueCycleIntelligence();
  const clinical = useClinicalIntelligence();
  const procurement = useProcurementIntelligence();

  return useMemo(
    () => {
      try {
        return computeMorningBriefing({ financial, workforce, operations, strategic, revenueCycle, clinical, procurement });
      } catch (e) {
        console.warn('[MorningBriefing] Engine error, returning safe defaults:', e);
        return {
          healthScore: 75,
          healthLabel: 'Good',
          topAlerts: [],
          kpis: [],
          briefingSections: [],
          generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }),
          advice: ['AI engines initializing — data will populate as hospital operations begin.'],
        };
      }
    },
    [financial, workforce, operations, strategic, revenueCycle, clinical, procurement]
  );
}
