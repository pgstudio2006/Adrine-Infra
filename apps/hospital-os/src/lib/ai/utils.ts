// ── AI Engine Utility Functions ──

import { SCORE_MIN, SCORE_MAX } from './constants';

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

export function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

export function parseStoreDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }
  const dmy = trimmed.match(/^(\d{1,2})\s+(\w{3,})\s+(\d{4})/);
  if (dmy) {
    const d = new Date(`${dmy[2]} ${dmy[1]}, ${dmy[3]}`);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  return Math.abs(Math.round((a.getTime() - b.getTime()) / msPerDay));
}

let alertSeq = 0;
export function alertId(engine: string): string {
  alertSeq += 1;
  return `${engine}-alert-${alertSeq}`;
}

export function clampScore(value: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(value)));
}

export function parseBP(bp: string): { systolic: number; diastolic: number } | null {
  if (!bp) return null;
  const match = bp.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return null;
  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  return { systolic, diastolic };
}

export function normalizeDrugName(drug: string): string {
  return drug
    .toLowerCase()
    .replace(/\s*\d+\s*(mg|mcg|ml|g|iu|units?|%|inj|tab|cap|sr|er|cr|xl|xr)\b.*/i, '')
    .trim();
}

/** Alias kept for backward compat */
export const normalizeDrug = normalizeDrugName;

export function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function nowIST(): string {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
}

export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}
