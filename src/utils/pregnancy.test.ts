import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOTAL_PREGNANCY_DAYS,
  addDays,
  buildCalendarMonth,
  calculatePregnancySummary,
  diffCalendarDays,
  formatDisplayDate,
  getPregnancyDayForDate,
  validateLmpDate,
} from './pregnancy';

test('LMP date maps to Week 1, Day 1 and increments accurately day by day', () => {
  const lmp = '2026-09-01';

  const day0 = getPregnancyDayForDate(lmp, '2026-09-01');
  assert.ok(day0);
  assert.equal(day0.week, 1);
  assert.equal(day0.day, 1);
  assert.equal(day0.shortLabel, 'W1 D1');
  assert.equal(day0.isLmp, true);

  const day6 = getPregnancyDayForDate(lmp, '2026-09-07');
  assert.ok(day6);
  assert.equal(day6.week, 1);
  assert.equal(day6.day, 7);
  assert.equal(day6.shortLabel, 'W1 D7');

  const day7 = getPregnancyDayForDate(lmp, '2026-09-08');
  assert.ok(day7);
  assert.equal(day7.week, 2);
  assert.equal(day7.day, 1);
  assert.equal(day7.shortLabel, 'W2 D1');
  assert.equal(day7.isNewWeekStart, true);

  // Date before LMP returns null
  const before = getPregnancyDayForDate(lmp, '2026-08-31');
  assert.equal(before, null);
});

test('EDD is exactly LMP + 280 days and progress numbers reconcile to 280', () => {
  const lmp = '2026-09-01';
  const today = '2026-11-19'; // 79 calendar days later

  const summary = calculatePregnancySummary(lmp, today);
  assert.ok(summary);
  assert.equal(summary.eddIso, addDays(lmp, TOTAL_PREGNANCY_DAYS));
  assert.equal(summary.eddIso, '2027-06-08');
  assert.equal(diffCalendarDays(lmp, summary.eddIso), 280);
  assert.equal(summary.daysElapsed, 79);
  assert.equal(summary.daysRemaining, 201);
  assert.equal(summary.daysElapsed + summary.daysRemaining, 280);
  assert.equal(summary.currentWeek, 12);
  assert.equal(summary.currentDay, 3);
  assert.equal(summary.completedWeeks, 11);
  assert.equal(summary.completedDays, 2);
  assert.equal(summary.trimester, 1);
  assert.equal(summary.progressPercent, 28.2);
});

test('Due date and overdue boundaries compute cleanly without overflowing 100%', () => {
  const lmp = '2026-01-01';
  const edd = addDays(lmp, 280); // 2026-10-08
  assert.equal(edd, '2026-10-08');

  const onEdd = calculatePregnancySummary(lmp, edd);
  assert.ok(onEdd);
  assert.equal(onEdd.isDueToday, true);
  assert.equal(onEdd.daysRemaining, 0);
  assert.equal(onEdd.daysOverdue, 0);
  assert.equal(onEdd.progressPercent, 100);

  const overdue = calculatePregnancySummary(lmp, addDays(edd, 5));
  assert.ok(overdue);
  assert.equal(overdue.isOverdue, true);
  assert.equal(overdue.daysRemaining, 0);
  assert.equal(overdue.daysOverdue, 5);
  assert.equal(overdue.progressPercent, 100);
});

test('Validation rejects empty, malformed, future, and >45-week-old LMP dates', () => {
  const today = '2026-11-19';
  assert.equal(validateLmpDate('', today)?.code, 'empty');
  assert.equal(validateLmpDate('2026-02-30', today)?.code, 'invalid');
  assert.equal(validateLmpDate('2026-11-20', today)?.code, 'future');
  assert.equal(validateLmpDate('2025-11-01', today)?.code, 'too-old');
  assert.equal(validateLmpDate('2026-08-13', today), null);
});

test('Calendar month grid labels LMP as W1 D1 and marks EDD in the due month', () => {
  const lmp = '2026-09-01';
  const today = '2026-11-19';

  const sepCells = buildCalendarMonth(2026, 8, lmp, today); // September 2026
  assert.ok(sepCells.length === 35 || sepCells.length === 42);

  const aug31 = sepCells.find((c) => c.iso === '2026-08-31');
  assert.ok(aug31);
  assert.equal(aug31.pregnancyDay, null);

  const sep1 = sepCells.find((c) => c.iso === '2026-09-01');
  assert.ok(sep1);
  assert.equal(sep1.isLmp, true);
  assert.equal(sep1.pregnancyDay?.shortLabel, 'W1 D1');

  const sep15 = sepCells.find((c) => c.iso === '2026-09-15');
  assert.ok(sep15);
  assert.equal(sep15.pregnancyDay?.shortLabel, 'W3 D1');

  const junCells = buildCalendarMonth(2027, 5, lmp, today); // June 2027
  const jun8 = junCells.find((c) => c.iso === '2027-06-08');
  assert.ok(jun8);
  assert.equal(jun8.isEdd, true);
  assert.equal(formatDisplayDate(jun8.iso), 'June 8, 2027');
});

test('Weekly size headlines use proper a/an articles and natural early-week labels', async () => {
  const { formatSizeHeadline, formatSizeShort, getWeeklyMilestone } = await import(
    '../data/milestones'
  );
  assert.equal(formatSizeHeadline(getWeeklyMilestone(1)), 'Beginning of Cycle');
  assert.equal(formatSizeHeadline(getWeeklyMilestone(8)), 'About the size of a raspberry');
  assert.equal(formatSizeHeadline(getWeeklyMilestone(15)), 'About the size of an apple');
  assert.equal(formatSizeShort(getWeeklyMilestone(16)), 'Size of an avocado');
  assert.equal(formatSizeHeadline(getWeeklyMilestone(12)), 'About the size of a plum');
});

test('Every pregnancy week 1-40 maps to a matching local size comparison photograph', async () => {
  const { getWeeklyMilestone } = await import('../data/milestones');
  for (let week = 1; week <= 40; week++) {
    const milestone = getWeeklyMilestone(week);
    assert.ok(
      milestone.imageSrc.startsWith('/src/assets/images/') && milestone.imageSrc.endsWith('.jpg'),
      `Week ${week} missing valid local image path`
    );
    assert.ok(milestone.imageAlt.length > 10, `Week ${week} missing descriptive alt text`);
  }
  assert.match(getWeeklyMilestone(8).imageSrc, /size_raspberry/);
  assert.match(getWeeklyMilestone(15).imageSrc, /size_apple/);
  assert.match(getWeeklyMilestone(40).imageSrc, /size_pumpkin/);
});

