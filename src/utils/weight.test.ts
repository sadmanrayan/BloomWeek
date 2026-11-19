import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BMI_GUIDELINES,
  MAX_RECENT_WEIGHT_LOGS,
  buildWeightTrajectoryPoints,
  calculateBmi,
  cmToFeetInches,
  createEmptyWeightState,
  createSampleWeightState,
  evaluateWeightGainStatus,
  feetInchesToCm,
  formatGainRange,
  formatHeightFeetInches,
  formatWeight,
  formatWeightDelta,
  getBmiCategory,
  getExpectedGainRangeForWeek,
  getLatestWeightEntries,
  hasAnyWeightData,
  kgToLb,
  lbToKg,
  parseStoredWeightState,
  resolveInitialWeightState,
  validateBaselineProfile,
  validateBaselineProfileFeetInches,
  validateWeightInput,
} from './weight';
import { resolveInitialLmp } from './pregnancy';

test('BMI calculation and IOM category classification', () => {
  assert.equal(calculateBmi(58, 162), 22.1);
  assert.equal(getBmiCategory(17.5), 'underweight');
  assert.equal(getBmiCategory(22.1), 'normal');
  assert.equal(getBmiCategory(27.0), 'overweight');
  assert.equal(getBmiCategory(32.5), 'obese');
  assert.equal(calculateBmi(null, 162), null);
});

test('unit conversions and formatting stay accurate', () => {
  const lb = kgToLb(60);
  assert.equal(lb, 132.3);
  assert.ok(Math.abs(lbToKg(lb) - 60) < 0.05);

  assert.equal(formatWeight(60.5, 'kg'), '60.5 kg');
  assert.equal(formatWeight(60, 'lb'), '132.3 lb');
  assert.equal(formatWeightDelta(2.3, 'kg'), '+2.3 kg');
  assert.equal(formatWeightDelta(-0.8, 'kg'), '−0.8 kg');
  assert.equal(formatWeightDelta(0, 'kg'), '0.0 kg');
  assert.equal(formatGainRange({ minKg: 11.5, maxKg: 16.0 }, 'kg'), '11.5–16.0 kg');
});

test('IOM expected gestational gain corridor matches endpoints for all BMI categories', () => {
  const categories = ['underweight', 'normal', 'overweight', 'obese'] as const;
  for (const cat of categories) {
    const start = getExpectedGainRangeForWeek(0, cat);
    assert.deepEqual(start, { minKg: 0, maxKg: 0 });

    const t1End = getExpectedGainRangeForWeek(13, cat);
    assert.equal(t1End.minKg, BMI_GUIDELINES[cat].firstTrimesterMinKg);
    assert.equal(t1End.maxKg, BMI_GUIDELINES[cat].firstTrimesterMaxKg);

    const term = getExpectedGainRangeForWeek(40, cat);
    assert.equal(term.minKg, BMI_GUIDELINES[cat].totalMinKg);
    assert.equal(term.maxKg, BMI_GUIDELINES[cat].totalMaxKg);
  }
});

test('evaluateWeightGainStatus classifies below, within, above, and missing baseline', () => {
  const noBase = evaluateWeightGainStatus(null, 60, 15, 'normal');
  assert.equal(noBase.status, 'no-baseline');

  // At Week 20 for normal BMI, expected range is ~3.35–5.63 kg
  const within = evaluateWeightGainStatus(58, 62.5, 20, 'normal');
  assert.equal(within.status, 'within');
  assert.equal(within.deltaKg, 4.5);

  const below = evaluateWeightGainStatus(58, 59.0, 20, 'normal');
  assert.equal(below.status, 'below');

  const above = evaluateWeightGainStatus(58, 66.0, 20, 'normal');
  assert.equal(above.status, 'above');
});

test('validateWeightInput enforces required value, realistic bounds, and date rules', () => {
  const today = '2026-11-19';
  assert.equal(validateWeightInput('', 'kg', today, today).valid, false);
  assert.equal(validateWeightInput('10', 'kg', today, today).valid, false);
  assert.equal(validateWeightInput('300', 'kg', today, today).valid, false);
  assert.equal(validateWeightInput('60', 'kg', '2026-11-25', today).valid, false);

  const validKg = validateWeightInput('61.4', 'kg', today, today);
  assert.equal(validKg.valid, true);
  assert.equal(validKg.weightKg, 61.4);

  const validLb = validateWeightInput('135', 'lb', today, today);
  assert.equal(validLb.valid, true);
  assert.ok(validLb.weightKg !== null && Math.abs(validLb.weightKg - 61.23) < 0.05);
});

test('validateBaselineProfile validates optional baseline weight and height', () => {
  const valid = validateBaselineProfile('58', '162', 'kg');
  assert.equal(valid.valid, true);
  assert.equal(valid.weightKg, 58);
  assert.equal(valid.heightCm, 162);

  const badHeight = validateBaselineProfile('58', '50', 'kg');
  assert.equal(badHeight.valid, false);
});

test('createSampleWeightState and parseStoredWeightState round-trip cleanly', () => {
  const sample = createSampleWeightState('2026-08-13', '2026-11-19');
  assert.equal(sample.entries.length, 4);
  assert.equal(sample.entries[0].dateIso, '2026-08-13');
  assert.equal(sample.entries[sample.entries.length - 1].dateIso, '2026-11-19');

  const serialized = JSON.stringify(sample);
  const restored = parseStoredWeightState(serialized);
  assert.ok(restored);
  assert.equal(restored.entries.length, 4);
  assert.equal(restored.profile.prePregnancyWeightKg, 58);
  assert.equal(parseStoredWeightState('{bad json'), null);
});

test('getLatestWeightEntries keeps at most the 5 most recent weigh-ins newest-first', () => {
  const entries = [
    { id: '1', dateIso: '2026-08-20', weightKg: 58.2 },
    { id: '2', dateIso: '2026-09-03', weightKg: 58.5 },
    { id: '3', dateIso: '2026-09-17', weightKg: 58.9 },
    { id: '4', dateIso: '2026-10-01', weightKg: 59.4 },
    { id: '5', dateIso: '2026-10-15', weightKg: 59.8 },
    { id: '6', dateIso: '2026-11-01', weightKg: 60.2 },
    { id: '7', dateIso: '2026-11-19', weightKg: 60.8 },
  ];

  const latest = getLatestWeightEntries(entries);
  assert.equal(latest.length, MAX_RECENT_WEIGHT_LOGS);
  assert.equal(latest.length, 5);
  assert.deepEqual(
    latest.map((e) => e.id),
    ['7', '6', '5', '4', '3']
  );
});

test('buildWeightTrajectoryPoints anchors pre-pregnancy weight at Week 0 when no LMP-day log exists', () => {
  const lmpIso = '2026-08-13';
  const points = buildWeightTrajectoryPoints(lmpIso, 58.0, [
    { id: 'a', dateIso: '2026-09-24', weightKg: 59.0 },
    { id: 'b', dateIso: '2026-11-19', weightKg: 60.5 },
  ]);

  assert.equal(points.length, 3);
  assert.equal(points[0].isBaselineAnchor, true);
  assert.equal(points[0].week, 0);
  assert.equal(points[0].weightKg, 58.0);
  assert.equal(points[1].weekLabel, 'W7 D1');
  assert.equal(points[2].weekLabel, 'W15 D1');
});

test('feet and inches height helpers convert, format, and validate accurately', () => {
  const cm = feetInchesToCm(5, 4);
  assert.equal(cm, 162.6);
  assert.deepEqual(cmToFeetInches(cm), { feet: 5, inches: 4 });
  assert.equal(formatHeightFeetInches(cm), `5' 4"`);

  const valid = validateBaselineProfileFeetInches('58', '5', '4', 'kg');
  assert.equal(valid.valid, true);
  assert.equal(valid.weightKg, 58);
  assert.equal(valid.heightCm, 162.6);

  // Blank inches defaults to 0
  const exactFeet = validateBaselineProfileFeetInches('60', '5', '', 'kg');
  assert.equal(exactFeet.valid, true);
  assert.equal(exactFeet.heightCm, feetInchesToCm(5, 0));

  // Rejects invalid inches >= 12 or missing feet when inches provided
  assert.equal(validateBaselineProfileFeetInches('58', '5', '12', 'kg').valid, false);
  assert.equal(validateBaselineProfileFeetInches('58', '', '5', 'kg').valid, false);
  assert.equal(validateBaselineProfileFeetInches('58', '2', '6', 'kg').valid, false);
});

test('new visitors and fresh-start links always initialize completely empty without pre-filled data', () => {
  // Brand-new visitor (no saved storage)
  assert.equal(resolveInitialLmp(null), '');
  assert.equal(resolveInitialLmp(''), '');
  assert.equal(resolveInitialLmp('not-a-date'), '');

  const freshWeight = resolveInitialWeightState(null);
  assert.deepEqual(freshWeight, createEmptyWeightState());
  assert.equal(freshWeight.profile.prePregnancyWeightKg, null);
  assert.equal(freshWeight.profile.heightCm, null);
  assert.equal(freshWeight.entries.length, 0);
  assert.equal(hasAnyWeightData(freshWeight), false);

  // Returning user restores their own device data unless forceFresh is requested
  assert.equal(resolveInitialLmp('2026-09-01'), '2026-09-01');
  assert.equal(resolveInitialLmp('2026-09-01', true), '');

  const savedJson = JSON.stringify({
    profile: { prePregnancyWeightKg: 56, heightCm: 160, unit: 'kg' },
    entries: [{ id: 'e1', dateIso: '2026-10-01', weightKg: 57 }],
  });
  const restored = resolveInitialWeightState(savedJson, false);
  assert.equal(hasAnyWeightData(restored), true);
  assert.equal(restored.entries.length, 1);

  const forcedEmpty = resolveInitialWeightState(savedJson, true);
  assert.equal(hasAnyWeightData(forcedEmpty), false);
  assert.equal(forcedEmpty.entries.length, 0);
});


