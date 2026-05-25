import { createLifecycleRuntime } from './lifecycle-runtime.js';
import { bedOccupancyLifecycle, type BedOccupancyState } from '../lifecycles/bed-occupancy.js';
import { runBedValidations, type BedValidationContext } from '../bed/bed-validation.js';

const bedRuntime = createLifecycleRuntime<BedOccupancyState, BedValidationContext>({
  definition: bedOccupancyLifecycle,
  validate: runBedValidations,
});

export const evaluateBedTransition = bedRuntime.evaluate.bind(bedRuntime);
export const listAllowedBedActions = bedRuntime.allowedActions.bind(bedRuntime);
export const getBedTransition = bedRuntime.getTransition.bind(bedRuntime);

export const BED_OCCUPIED_STATES: readonly BedOccupancyState[] = ['reserved', 'occupied'];
