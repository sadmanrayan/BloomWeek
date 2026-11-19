import {
  addDays,
  diffCalendarDays,
  getPregnancyDayForDate,
  parseIsoDate,
} from './pregnancy';

export type WeightUnit = 'kg' | 'lb';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export type WeightGainStatus = 'below' | 'within' | 'above' | 'no-baseline';

export interface WeightEntry {
  id: string;
  dateIso: string;
  weightKg: number;
  note?: string;
}

export interface WeightProfile {
  prePregnancyWeightKg: number | null;
  heightCm: number | null;
  unit: WeightUnit;
}

export interface StoredWeightState {
  profile: WeightProfile;
  entries: WeightEntry[];
}

export interface BmiGuideline {
  category: BmiCategory;
  label: string;
  bmiRangeLabel: string;
  totalMinKg: number;
  totalMaxKg: number;
  firstTrimesterMinKg: number;
  firstTrimesterMaxKg: number;
  weeklyRateMinKg: number;
  weeklyRateMaxKg: number;
}

export interface GainRangeKg {
  minKg: number;
  maxKg: number;
}

export interface WeightValidationResult {
  valid: boolean;
  error: string | null;
  weightKg: number | null;
}

export const WEIGHT_STORAGE_KEY = 'bloomweeks_weight_v2';
export const MAX_RECENT_WEIGHT_LOGS = 5;
export const KG_TO_LB = 2.2046226218;
export const CM_PER_INCH = 2.54;
export const MIN_WEIGHT_KG = 25;
export const MAX_WEIGHT_KG = 250;
export const MIN_HEIGHT_CM = 100;
export const MAX_HEIGHT_CM = 220;

export interface TrajectoryPoint {
  id: string;
  week: number;
  weightKg: number;
  dateIso: string;
  weekLabel: string;
  note?: string;
  isBaselineAnchor: boolean;
}

export const BMI_GUIDELINES: Record<BmiCategory, BmiGuideline> = {
  underweight: {
    category: 'underweight',
    label: 'Underweight',
    bmiRangeLabel: 'BMI < 18.5',
    totalMinKg: 12.5,
    totalMaxKg: 18.0,
    firstTrimesterMinKg: 0.5,
    firstTrimesterMaxKg: 2.0,
    weeklyRateMinKg: 0.44,
    weeklyRateMaxKg: 0.58,
  },
  normal: {
    category: 'normal',
    label: 'Normal Weight',
    bmiRangeLabel: 'BMI 18.5–24.9',
    totalMinKg: 11.5,
    totalMaxKg: 16.0,
    firstTrimesterMinKg: 0.5,
    firstTrimesterMaxKg: 2.0,
    weeklyRateMinKg: 0.35,
    weeklyRateMaxKg: 0.5,
  },
  overweight: {
    category: 'overweight',
    label: 'Overweight',
    bmiRangeLabel: 'BMI 25.0–29.9',
    totalMinKg: 7.0,
    totalMaxKg: 11.5,
    firstTrimesterMinKg: 0.5,
    firstTrimesterMaxKg: 2.0,
    weeklyRateMinKg: 0.23,
    weeklyRateMaxKg: 0.33,
  },
  obese: {
    category: 'obese',
    label: 'Obese',
    bmiRangeLabel: 'BMI 30.0+',
    totalMinKg: 5.0,
    totalMaxKg: 9.0,
    firstTrimesterMinKg: 0.5,
    firstTrimesterMaxKg: 2.0,
    weeklyRateMinKg: 0.17,
    weeklyRateMaxKg: 0.27,
  },
};

export function kgToLb(kg: number): number {
  return Number((kg * KG_TO_LB).toFixed(1));
}

export function lbToKg(lb: number): number {
  return Number((lb / KG_TO_LB).toFixed(2));
}

export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Number((totalInches * CM_PER_INCH).toFixed(1));
}

export function cmToFeetInches(heightCm: number): { feet: number; inches: number } {
  const totalInches = Math.round(heightCm / CM_PER_INCH);
  return {
    feet: Math.floor(totalInches / 12),
    inches: totalInches % 12,
  };
}

export function formatHeightFeetInches(heightCm: number): string {
  const { feet, inches } = cmToFeetInches(heightCm);
  return `${feet}' ${inches}"`;
}

export function displayWeightNumber(weightKg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kgToLb(weightKg) : Number(weightKg.toFixed(1));
}

export function formatWeight(weightKg: number, unit: WeightUnit): string {
  const value = displayWeightNumber(weightKg, unit);
  return `${value.toFixed(1)} ${unit}`;
}

export function formatWeightDelta(deltaKg: number, unit: WeightUnit): string {
  const raw = unit === 'lb' ? deltaKg * KG_TO_LB : deltaKg;
  const rounded = Number(raw.toFixed(1));
  if (Math.abs(rounded) < 0.05) {
    return `0.0 ${unit}`;
  }
  const sign = rounded > 0 ? '+' : '−';
  return `${sign}${Math.abs(rounded).toFixed(1)} ${unit}`;
}

export function formatGainRange(range: GainRangeKg, unit: WeightUnit): string {
  const minVal = unit === 'lb' ? kgToLb(range.minKg) : Number(range.minKg.toFixed(1));
  const maxVal = unit === 'lb' ? kgToLb(range.maxKg) : Number(range.maxKg.toFixed(1));
  return `${minVal.toFixed(1)}–${maxVal.toFixed(1)} ${unit}`;
}

export function calculateBmi(
  weightKg: number | null,
  heightCm: number | null
): number | null {
  if (
    weightKg === null ||
    heightCm === null ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightCm) ||
    weightKg <= 0 ||
    heightCm <= 0
  ) {
    return null;
  }
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBmiCategory(bmi: number | null): BmiCategory {
  if (bmi === null || !Number.isFinite(bmi)) return 'normal';
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function getBmiGuideline(
  weightKg: number | null,
  heightCm: number | null
): { bmi: number | null; guideline: BmiGuideline; isEstimated: boolean } {
  const bmi = calculateBmi(weightKg, heightCm);
  const category = getBmiCategory(bmi);
  return {
    bmi,
    guideline: BMI_GUIDELINES[category],
    isEstimated: bmi === null,
  };
}

/**
 * Returns the IOM recommended cumulative weight gain range (in kg)
 * at a given gestational week (0..40).
 */
export function getExpectedGainRangeForWeek(
  weekNumber: number,
  category: BmiCategory
): GainRangeKg {
  const guideline = BMI_GUIDELINES[category];
  const clampedWeek = Math.max(0, Math.min(40, weekNumber));

  if (clampedWeek <= 0) {
    return { minKg: 0, maxKg: 0 };
  }

  if (clampedWeek <= 13) {
    const t = clampedWeek / 13;
    return {
      minKg: Number((guideline.firstTrimesterMinKg * t).toFixed(2)),
      maxKg: Number((guideline.firstTrimesterMaxKg * t).toFixed(2)),
    };
  }

  const t = (clampedWeek - 13) / (40 - 13);
  const minKg =
    guideline.firstTrimesterMinKg +
    (guideline.totalMinKg - guideline.firstTrimesterMinKg) * t;
  const maxKg =
    guideline.firstTrimesterMaxKg +
    (guideline.totalMaxKg - guideline.firstTrimesterMaxKg) * t;

  return {
    minKg: Number(minKg.toFixed(2)),
    maxKg: Number(maxKg.toFixed(2)),
  };
}

export function evaluateWeightGainStatus(
  prePregnancyWeightKg: number | null,
  currentWeightKg: number | null,
  weekNumber: number,
  category: BmiCategory
): {
  status: WeightGainStatus;
  deltaKg: number | null;
  expectedRangeKg: GainRangeKg;
  label: string;
} {
  const expectedRangeKg = getExpectedGainRangeForWeek(weekNumber, category);

  if (prePregnancyWeightKg === null || currentWeightKg === null) {
    return {
      status: 'no-baseline',
      deltaKg: null,
      expectedRangeKg,
      label: 'Add starting weight to compare',
    };
  }

  const deltaKg = Number((currentWeightKg - prePregnancyWeightKg).toFixed(2));
  // Small 0.3 kg tolerance so minor daily hydration fluctuations do not trigger noise
  if (deltaKg < expectedRangeKg.minKg - 0.3) {
    return {
      status: 'below',
      deltaKg,
      expectedRangeKg,
      label: 'Below typical range',
    };
  }
  if (deltaKg > expectedRangeKg.maxKg + 0.3) {
    return {
      status: 'above',
      deltaKg,
      expectedRangeKg,
      label: 'Above typical range',
    };
  }
  return {
    status: 'within',
    deltaKg,
    expectedRangeKg,
    label: 'Within typical range',
  };
}

export function validateWeightInput(
  rawWeight: string,
  unit: WeightUnit,
  dateIso: string,
  todayIso: string
): WeightValidationResult {
  if (!dateIso || !parseIsoDate(dateIso)) {
    return {
      valid: false,
      error: 'Please choose a valid weigh-in date.',
      weightKg: null,
    };
  }

  if (diffCalendarDays(dateIso, todayIso) < 0) {
    return {
      valid: false,
      error: 'Weigh-in date cannot be in the future.',
      weightKg: null,
    };
  }

  const trimmed = rawWeight.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: `Please enter your weight in ${unit}.`,
      weightKg: null,
    };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      valid: false,
      error: 'Please enter a valid positive number for weight.',
      weightKg: null,
    };
  }

  const weightKg = unit === 'lb' ? lbToKg(parsed) : Number(parsed.toFixed(2));
  const minDisplay = unit === 'lb' ? Math.round(MIN_WEIGHT_KG * KG_TO_LB) : MIN_WEIGHT_KG;
  const maxDisplay = unit === 'lb' ? Math.round(MAX_WEIGHT_KG * KG_TO_LB) : MAX_WEIGHT_KG;

  if (weightKg < MIN_WEIGHT_KG || weightKg > MAX_WEIGHT_KG) {
    return {
      valid: false,
      error: `Weight should be between ${minDisplay} and ${maxDisplay} ${unit}.`,
      weightKg: null,
    };
  }

  return {
    valid: true,
    error: null,
    weightKg,
  };
}

export function validateBaselineProfile(
  rawWeight: string,
  rawHeightCm: string,
  unit: WeightUnit
): {
  valid: boolean;
  error: string | null;
  weightKg: number | null;
  heightCm: number | null;
} {
  let weightKg: number | null = null;
  if (rawWeight.trim() !== '') {
    const parsedW = Number(rawWeight.trim());
    if (!Number.isFinite(parsedW) || parsedW <= 0) {
      return {
        valid: false,
        error: 'Please enter a valid pre-pregnancy weight.',
        weightKg: null,
        heightCm: null,
      };
    }
    const converted = unit === 'lb' ? lbToKg(parsedW) : Number(parsedW.toFixed(2));
    if (converted < MIN_WEIGHT_KG || converted > MAX_WEIGHT_KG) {
      const minD = unit === 'lb' ? Math.round(MIN_WEIGHT_KG * KG_TO_LB) : MIN_WEIGHT_KG;
      const maxD = unit === 'lb' ? Math.round(MAX_WEIGHT_KG * KG_TO_LB) : MAX_WEIGHT_KG;
      return {
        valid: false,
        error: `Pre-pregnancy weight should be between ${minD} and ${maxD} ${unit}.`,
        weightKg: null,
        heightCm: null,
      };
    }
    weightKg = converted;
  }

  let heightCm: number | null = null;
  if (rawHeightCm.trim() !== '') {
    const parsedH = Number(rawHeightCm.trim());
    if (!Number.isFinite(parsedH) || parsedH < MIN_HEIGHT_CM || parsedH > MAX_HEIGHT_CM) {
      return {
        valid: false,
        error: `Height should be between ${MIN_HEIGHT_CM} and ${MAX_HEIGHT_CM} cm.`,
        weightKg: null,
        heightCm: null,
      };
    }
    heightCm = Number(parsedH.toFixed(1));
  }

  return {
    valid: true,
    error: null,
    weightKg,
    heightCm,
  };
}

export function validateBaselineProfileFeetInches(
  rawWeight: string,
  rawFeet: string,
  rawInches: string,
  unit: WeightUnit
): {
  valid: boolean;
  error: string | null;
  weightKg: number | null;
  heightCm: number | null;
} {
  let weightKg: number | null = null;
  if (rawWeight.trim() !== '') {
    const parsedW = Number(rawWeight.trim());
    if (!Number.isFinite(parsedW) || parsedW <= 0) {
      return {
        valid: false,
        error: 'Please enter a valid pre-pregnancy weight.',
        weightKg: null,
        heightCm: null,
      };
    }
    const converted = unit === 'lb' ? lbToKg(parsedW) : Number(parsedW.toFixed(2));
    if (converted < MIN_WEIGHT_KG || converted > MAX_WEIGHT_KG) {
      const minD = unit === 'lb' ? Math.round(MIN_WEIGHT_KG * KG_TO_LB) : MIN_WEIGHT_KG;
      const maxD = unit === 'lb' ? Math.round(MAX_WEIGHT_KG * KG_TO_LB) : MAX_WEIGHT_KG;
      return {
        valid: false,
        error: `Pre-pregnancy weight should be between ${minD} and ${maxD} ${unit}.`,
        weightKg: null,
        heightCm: null,
      };
    }
    weightKg = converted;
  }

  const trimmedFeet = rawFeet.trim();
  const trimmedInches = rawInches.trim();
  let heightCm: number | null = null;

  if (trimmedFeet === '' && trimmedInches !== '') {
    return {
      valid: false,
      error: 'Please enter feet along with inches for your height.',
      weightKg: null,
      heightCm: null,
    };
  }

  if (trimmedFeet !== '') {
    const feet = Number(trimmedFeet);
    const inches = trimmedInches === '' ? 0 : Number(trimmedInches);

    if (!Number.isInteger(feet) || feet < 3 || feet > 7) {
      return {
        valid: false,
        error: 'Height feet should be a whole number between 3 and 7 ft.',
        weightKg: null,
        heightCm: null,
      };
    }

    if (!Number.isFinite(inches) || inches < 0 || inches >= 12) {
      return {
        valid: false,
        error: 'Height inches should be between 0 and 11 in.',
        weightKg: null,
        heightCm: null,
      };
    }

    const computedCm = feetInchesToCm(feet, inches);
    if (computedCm < MIN_HEIGHT_CM || computedCm > MAX_HEIGHT_CM) {
      return {
        valid: false,
        error: 'Height should be between 3\' 4" and 7\' 2".',
        weightKg: null,
        heightCm: null,
      };
    }
    heightCm = computedCm;
  }

  return {
    valid: true,
    error: null,
    weightKg,
    heightCm,
  };
}

export function sortWeightEntriesAsc(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

export function getLatestWeightEntries(
  entries: WeightEntry[],
  limit: number = MAX_RECENT_WEIGHT_LOGS
): WeightEntry[] {
  return [...entries]
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .slice(0, Math.max(0, limit));
}

export function getEntryGestationalWeekFloat(
  lmpIso: string,
  entryDateIso: string
): number | null {
  if (!parseIsoDate(lmpIso) || !parseIsoDate(entryDateIso)) return null;
  const diffDays = diffCalendarDays(lmpIso, entryDateIso);
  if (diffDays < 0 || diffDays > 301) return null;
  return Number((diffDays / 7).toFixed(2));
}

export function getEntryWeekShortLabel(lmpIso: string, entryDateIso: string): string {
  const info = getPregnancyDayForDate(lmpIso, entryDateIso);
  if (!info) return 'Pre-LMP';
  return info.shortLabel;
}

/**
 * Builds the chronological weight trajectory starting from the pre-pregnancy
 * baseline at Week 0 (LMP) through all logged pregnancy weigh-ins.
 */
export function buildWeightTrajectoryPoints(
  lmpIso: string,
  prePregnancyWeightKg: number | null,
  entries: WeightEntry[]
): TrajectoryPoint[] {
  const sorted = sortWeightEntriesAsc(entries);
  const points: TrajectoryPoint[] = [];

  const hasDayZeroEntry = sorted.some(
    (entry) => getEntryGestationalWeekFloat(lmpIso, entry.dateIso) === 0
  );

  if (prePregnancyWeightKg !== null && !hasDayZeroEntry) {
    points.push({
      id: 'baseline-anchor',
      week: 0,
      weightKg: prePregnancyWeightKg,
      dateIso: lmpIso,
      weekLabel: 'Pre-pregnancy',
      note: 'Pre-pregnancy starting weight',
      isBaselineAnchor: true,
    });
  }

  for (const entry of sorted) {
    const weekFloat = getEntryGestationalWeekFloat(lmpIso, entry.dateIso);
    if (weekFloat === null) continue;
    points.push({
      id: entry.id,
      week: Math.min(40, Math.max(0, weekFloat)),
      weightKg: entry.weightKg,
      dateIso: entry.dateIso,
      weekLabel: getEntryWeekShortLabel(lmpIso, entry.dateIso),
      note: entry.note,
      isBaselineAnchor: false,
    });
  }

  return points;
}

export function createSampleWeightState(
  lmpIso: string,
  todayIso: string
): StoredWeightState {
  const diffDays = Math.max(0, diffCalendarDays(lmpIso, todayIso));
  const prePregnancyWeightKg = 58.0;
  const heightCm = feetInchesToCm(5, 4); // 5' 4" (162.6 cm)

  const candidateOffsets: Array<{ offset: number; deltaKg: number; note: string }> = [
    { offset: 0, deltaKg: 0.0, note: 'Starting baseline' },
    { offset: 35, deltaKg: 0.6, note: 'First prenatal check' },
    { offset: 70, deltaKg: 1.3, note: 'Morning weigh-in' },
    { offset: Math.min(diffDays, 98), deltaKg: 2.3, note: 'Second trimester check-in' },
  ];

  const seenDates = new Set<string>();
  const entries: WeightEntry[] = [];

  for (const item of candidateOffsets) {
    if (item.offset > diffDays) continue;
    const dateIso = addDays(lmpIso, item.offset);
    if (seenDates.has(dateIso)) continue;
    seenDates.add(dateIso);
    entries.push({
      id: `sample-${item.offset}`,
      dateIso,
      weightKg: Number((prePregnancyWeightKg + item.deltaKg).toFixed(1)),
      note: item.note,
    });
  }

  return {
    profile: {
      prePregnancyWeightKg,
      heightCm,
      unit: 'kg',
    },
    entries: sortWeightEntriesAsc(entries),
  };
}

export function parseStoredWeightState(raw: string | null): StoredWeightState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredWeightState>;
    if (!parsed || typeof parsed !== 'object') return null;

    const unit: WeightUnit = parsed.profile?.unit === 'lb' ? 'lb' : 'kg';
    const prePregnancyWeightKg =
      typeof parsed.profile?.prePregnancyWeightKg === 'number' &&
      Number.isFinite(parsed.profile.prePregnancyWeightKg)
        ? parsed.profile.prePregnancyWeightKg
        : null;
    const heightCm =
      typeof parsed.profile?.heightCm === 'number' &&
      Number.isFinite(parsed.profile.heightCm)
        ? parsed.profile.heightCm
        : null;

    const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const entries: WeightEntry[] = rawEntries
      .filter(
        (item): item is WeightEntry =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.dateIso === 'string' &&
          parseIsoDate(item.dateIso) !== null &&
          typeof item.weightKg === 'number' &&
          Number.isFinite(item.weightKg) &&
          item.weightKg >= MIN_WEIGHT_KG &&
          item.weightKg <= MAX_WEIGHT_KG
      )
      .map((item) => ({
        id: item.id,
        dateIso: item.dateIso,
        weightKg: Number(item.weightKg.toFixed(2)),
        note: typeof item.note === 'string' ? item.note.slice(0, 80) : undefined,
      }));

    return {
      profile: {
        prePregnancyWeightKg,
        heightCm,
        unit,
      },
      entries: sortWeightEntriesAsc(entries),
    };
  } catch {
    return null;
  }
}

export function createEmptyWeightState(unit: WeightUnit = 'kg'): StoredWeightState {
  return {
    profile: {
      prePregnancyWeightKg: null,
      heightCm: null,
      unit,
    },
    entries: [],
  };
}

export function hasAnyWeightData(state: StoredWeightState): boolean {
  return (
    state.profile.prePregnancyWeightKg !== null ||
    state.profile.heightCm !== null ||
    state.entries.length > 0
  );
}

export function resolveInitialWeightState(
  savedRaw: string | null,
  forceFresh: boolean = false
): StoredWeightState {
  if (forceFresh || !savedRaw) {
    return createEmptyWeightState();
  }
  return parseStoredWeightState(savedRaw) ?? createEmptyWeightState();
}
