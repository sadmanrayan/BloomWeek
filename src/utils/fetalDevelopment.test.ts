import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EXPLORE_DAY,
  MAX_PREGNANCY_DAY,
  MIN_PREGNANCY_DAY,
  clampPregnancyDay,
  computeFetalAnatomyMorph,
  dayNumberToWeekAndDay,
  getFetalDayMetrics,
} from './fetalDevelopment';

test('clampPregnancyDay and dayNumberToWeekAndDay enforce Day 1-280 LMP convention', () => {
  assert.equal(clampPregnancyDay(-10), MIN_PREGNANCY_DAY);
  assert.equal(clampPregnancyDay(400), MAX_PREGNANCY_DAY);
  assert.equal(clampPregnancyDay(Number.NaN), DEFAULT_EXPLORE_DAY);

  const day1 = dayNumberToWeekAndDay(1);
  assert.equal(day1.week, 1);
  assert.equal(day1.dayOfWeek, 1);
  assert.equal(day1.trimester, 1);

  const day57 = dayNumberToWeekAndDay(57);
  assert.equal(day57.week, 9);
  assert.equal(day57.dayOfWeek, 1);

  const day280 = dayNumberToWeekAndDay(280);
  assert.equal(day280.week, 40);
  assert.equal(day280.dayOfWeek, 7);
  assert.equal(day280.trimester, 3);
});

test('length and weight increase monotonically day by day across pregnancy', () => {
  let prevLength = 0;
  let prevWeight = 0;

  for (let day = 1; day <= 280; day++) {
    const metrics = getFetalDayMetrics(day);
    assert.ok(
      metrics.lengthMm >= prevLength,
      `Length regressed on day ${day}: ${metrics.lengthMm} < ${prevLength}`
    );
    assert.ok(
      metrics.weightGrams >= prevWeight,
      `Weight regressed on day ${day}: ${metrics.weightGrams} < ${prevWeight}`
    );
    prevLength = metrics.lengthMm;
    prevWeight = metrics.weightGrams;
  }

  const week9 = getFetalDayMetrics(57);
  assert.ok(week9.lengthMm >= 20 && week9.lengthMm <= 28);
  assert.equal(week9.lengthMeasureType, 'Crown-to-Rump (CRL)');

  const week40 = getFetalDayMetrics(280);
  assert.ok(week40.lengthMm >= 490 && week40.lengthMm <= 530);
  assert.ok(week40.weightGrams >= 3200);
  assert.equal(week40.lengthMeasureType, 'Crown-to-Heel');
});

test('fetal heart rate starts in early embryo, peaks around week 9, and steadies at term', () => {
  assert.equal(getFetalDayMetrics(14).heartRateBpm, null);
  const week6 = getFetalDayMetrics(36);
  assert.ok(week6.heartRateBpm !== null && week6.heartRateBpm >= 90 && week6.heartRateBpm <= 125);

  const week9 = getFetalDayMetrics(57);
  assert.ok(week9.heartRateBpm !== null && week9.heartRateBpm >= 160 && week9.heartRateBpm <= 178);

  const week38 = getFetalDayMetrics(260);
  assert.ok(week38.heartRateBpm !== null && week38.heartRateBpm >= 130 && week38.heartRateBpm <= 148);
});

test('3D anatomy morph curves reflect biological transitions from embryo to term', () => {
  const w6 = computeFetalAnatomyMorph(6);
  const w9 = computeFetalAnatomyMorph(9);
  const w20 = computeFetalAnatomyMorph(20);
  const w38 = computeFetalAnatomyMorph(38);

  // Embryonic tail bud present at W6, gone by W20
  assert.ok(w6.tailBudFactor > 0.5);
  assert.equal(w20.tailBudFactor, 0);

  // Skin is luminous and translucent at W9 (reference look) and becomes more opaque by W38
  assert.ok(w9.skinTranslucency > 0.85);
  assert.ok(w38.skinTranslucency < 0.35);

  // Limbs and fingers grow continuously
  assert.ok(w6.limbGrowth < w9.limbGrowth);
  assert.ok(w9.limbGrowth < w38.limbGrowth);
  assert.ok(w9.digitSeparation > 0.5);
  assert.equal(w20.digitSeparation, 1);

  // Eyelids: open dark optic eye at W9, closed at W20, partially open/blinking at W38
  assert.equal(w9.eyelidClosure, 0);
  assert.equal(w20.eyelidClosure, 1);
  assert.ok(w38.eyelidClosure < 0.4);
});
