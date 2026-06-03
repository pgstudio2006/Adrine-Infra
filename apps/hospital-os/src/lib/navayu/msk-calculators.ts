/** MSK score calculator definitions — Form Engine `calculator` field bindings. */

export type CalculatorItem = {
  id: string;
  label: string;
  maxPoints: number;
};

export type MskCalculatorDef = {
  id: string;
  label: string;
  unit: '%' | 'points' | '/10';
  maxScore: number;
  items: CalculatorItem[];
  /** Optional threshold hints for rule-based summary. */
  moderateThreshold?: number;
  severeThreshold?: number;
};

export type CalculatorAnswers = Record<string, number>;

export const MSK_CALCULATORS: Record<string, MskCalculatorDef> = {
  odi: {
    id: 'odi',
    label: 'Oswestry Disability Index (ODI)',
    unit: '%',
    maxScore: 100,
    moderateThreshold: 40,
    severeThreshold: 60,
    items: [
      { id: 'pain', label: 'Pain intensity', maxPoints: 5 },
      { id: 'self_care', label: 'Personal care', maxPoints: 5 },
      { id: 'lifting', label: 'Lifting', maxPoints: 5 },
      { id: 'walking', label: 'Walking', maxPoints: 5 },
      { id: 'sitting', label: 'Sitting', maxPoints: 5 },
    ],
  },
  ndi: {
    id: 'ndi',
    label: 'Neck Disability Index (NDI)',
    unit: '%',
    maxScore: 100,
    moderateThreshold: 30,
    severeThreshold: 50,
    items: [
      { id: 'pain', label: 'Neck pain', maxPoints: 5 },
      { id: 'personal_care', label: 'Personal care', maxPoints: 5 },
      { id: 'reading', label: 'Reading', maxPoints: 5 },
      { id: 'headache', label: 'Headache', maxPoints: 5 },
      { id: 'concentration', label: 'Concentration', maxPoints: 5 },
    ],
  },
  womac: {
    id: 'womac',
    label: 'WOMAC (simplified)',
    unit: 'points',
    maxScore: 96,
    items: [
      { id: 'pain_walking', label: 'Pain walking', maxPoints: 4 },
      { id: 'pain_stairs', label: 'Pain on stairs', maxPoints: 4 },
      { id: 'stiffness_morning', label: 'Morning stiffness', maxPoints: 4 },
      { id: 'function_stairs', label: 'Difficulty stairs', maxPoints: 4 },
    ],
  },
  koos: {
    id: 'koos',
    label: 'KOOS — Pain subscale (simplified)',
    unit: 'points',
    maxScore: 100,
    items: [
      { id: 'pain_swelling', label: 'Swelling', maxPoints: 4 },
      { id: 'pain_stairs', label: 'Pain stairs', maxPoints: 4 },
      { id: 'pain_squat', label: 'Pain squatting', maxPoints: 4 },
      { id: 'pain_rest', label: 'Pain at rest', maxPoints: 4 },
    ],
  },
  dash: {
    id: 'dash',
    label: 'DASH (simplified)',
    unit: 'points',
    maxScore: 100,
    items: [
      { id: 'open_jar', label: 'Open tight jar', maxPoints: 4 },
      { id: 'carry_bag', label: 'Carry shopping bag', maxPoints: 4 },
      { id: 'wash_back', label: 'Wash back', maxPoints: 4 },
      { id: 'recreational', label: 'Recreational activity', maxPoints: 4 },
    ],
  },
  spadi: {
    id: 'spadi',
    label: 'SPADI (simplified)',
    unit: 'points',
    maxScore: 100,
    items: [
      { id: 'shoulder_pain_rest', label: 'Shoulder pain at rest', maxPoints: 4 },
      { id: 'shoulder_pain_activity', label: 'Shoulder pain with activity', maxPoints: 4 },
      { id: 'dressing', label: 'Difficulty dressing', maxPoints: 4 },
    ],
  },
  harris_hip: {
    id: 'harris_hip',
    label: 'Harris Hip Score (simplified)',
    unit: 'points',
    maxScore: 100,
    items: [
      { id: 'pain', label: 'Pain', maxPoints: 44 },
      { id: 'limp', label: 'Limp', maxPoints: 11 },
      { id: 'distance', label: 'Distance walked', maxPoints: 11 },
      { id: 'stairs', label: 'Stairs', maxPoints: 4 },
    ],
  },
  vas: {
    id: 'vas',
    label: 'Visual Analog Scale (VAS)',
    unit: '/10',
    maxScore: 10,
    items: [{ id: 'pain', label: 'Current pain level', maxPoints: 10 }],
  },
};

export function computeCalculatorScore(
  calculatorId: string,
  answers: CalculatorAnswers,
): { score: number; display: string } | null {
  const def = MSK_CALCULATORS[calculatorId];
  if (!def) return null;

  if (calculatorId === 'vas') {
    const v = answers.pain ?? 0;
    return { score: v, display: `${v}/10` };
  }

  if (calculatorId === 'harris_hip') {
    const raw = def.items.reduce((sum, item) => sum + (answers[item.id] ?? 0), 0);
    return { score: raw, display: `${raw} pts` };
  }

  const raw = def.items.reduce((sum, item) => sum + (answers[item.id] ?? 0), 0);
  const maxRaw = def.items.reduce((sum, item) => sum + item.maxPoints, 0);
  if (def.unit === '%') {
    const pct = maxRaw > 0 ? Math.round((raw / maxRaw) * 100) : 0;
    return { score: pct, display: `${pct}%` };
  }

  const normalized =
    def.maxScore > 0 && maxRaw > 0 ? Math.round((raw / maxRaw) * def.maxScore) : raw;
  return { score: normalized, display: `${normalized} pts` };
}

export function getCalculatorDef(calculatorId: string): MskCalculatorDef | undefined {
  return MSK_CALCULATORS[calculatorId];
}
