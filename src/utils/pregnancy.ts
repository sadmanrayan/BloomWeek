export const TOTAL_PREGNANCY_DAYS = 280;
export const MAX_CALENDAR_TRACK_DAYS = 301; // Up to 43 weeks on calendar
export const MAX_VALID_LMP_DAYS_AGO = 315; // 45 weeks sanity upper bound

export interface ParsedDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface LmpValidationError {
  code: 'empty' | 'invalid' | 'future' | 'too-old';
  message: string;
}

export interface PregnancyDayInfo {
  diffDays: number; // 0 on LMP, 280 on EDD
  dayNumber: number; // 1 on LMP (1-indexed)
  week: number; // 1 on LMP (Week 1 Day 1 convention)
  day: number; // 1..7 on LMP..LMP+6
  completedWeeks: number; // 0 on LMP, 40 on EDD
  completedDays: number; // 0..6
  shortLabel: string; // e.g., "W1 D1"
  fullLabel: string; // e.g., "Week 1, Day 1"
  completedLabel: string; // e.g., "0w 0d completed"
  trimester: 1 | 2 | 3;
  trimesterLabel: string;
  isLmp: boolean;
  isEdd: boolean;
  isNewWeekStart: boolean;
  isPostTerm: boolean;
}

export interface PregnancyMilestoneDate {
  id: string;
  title: string;
  weekLabel: string;
  dayOffset: number;
  dateIso: string;
  description: string;
  trimester: 1 | 2 | 3;
  isCompleted: boolean;
  isUpcoming: boolean;
}

export interface PregnancySummary {
  lmpIso: string;
  todayIso: string;
  eddIso: string;
  diffDays: number; // Calendar days since LMP (0 on LMP)
  dayNumber: number; // 1-indexed day (1 on LMP)
  currentWeek: number; // 1-indexed week (Week 1 on LMP)
  currentDay: number; // 1-indexed day 1..7 (Day 1 on LMP)
  completedWeeks: number;
  completedDays: number;
  daysElapsed: number; // Days along from LMP (0..280+)
  daysRemaining: number; // Days until EDD (280..0)
  daysOverdue: number; // Days past EDD (0 if <= EDD)
  remainingWeeks: number;
  remainingDays: number;
  progressPercent: number; // 0.0 to 100.0
  trimester: 1 | 2 | 3;
  trimesterLabel: string;
  trimesterRange: string;
  isDueToday: boolean;
  isOverdue: boolean;
  milestones: PregnancyMilestoneDate[];
}

export interface CalendarCell {
  iso: string;
  year: number;
  monthIndex: number; // 0-11
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isLmp: boolean;
  isEdd: boolean;
  pregnancyDay: PregnancyDayInfo | null;
}

const MS_PER_DAY = 86_400_000;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SHORT_MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function parseIsoDate(iso: string): ParsedDate | null {
  if (!iso || typeof iso !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function formatIsoDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayIsoDate(now: Date = new Date()): string {
  return formatIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function toDayIndex(iso: string): number {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return Math.floor(Date.UTC(parsed.year, parsed.month - 1, parsed.day) / MS_PER_DAY);
}

export function fromDayIndex(dayIndex: number): string {
  const date = new Date(dayIndex * MS_PER_DAY);
  return formatIsoDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

export function addDays(iso: string, days: number): string {
  return fromDayIndex(toDayIndex(iso) + days);
}

export function diffCalendarDays(fromIso: string, toIso: string): number {
  return toDayIndex(toIso) - toDayIndex(fromIso);
}

export function getTrimesterForWeek(week: number): {
  trimester: 1 | 2 | 3;
  label: string;
  range: string;
} {
  if (week <= 13) {
    return { trimester: 1, label: '1st Trimester', range: 'Weeks 1–13' };
  }
  if (week <= 27) {
    return { trimester: 2, label: '2nd Trimester', range: 'Weeks 14–27' };
  }
  return { trimester: 3, label: '3rd Trimester', range: 'Weeks 28–40' };
}

export function validateLmpDate(
  lmpIso: string,
  todayIso: string
): LmpValidationError | null {
  if (!lmpIso || !lmpIso.trim()) {
    return {
      code: 'empty',
      message: 'Enter the first day of your last menstrual period (LMP) to start tracking.',
    };
  }

  if (!parseIsoDate(lmpIso)) {
    return {
      code: 'invalid',
      message: 'Please enter a valid calendar date in YYYY-MM-DD format.',
    };
  }

  const diff = diffCalendarDays(lmpIso, todayIso);
  if (diff < 0) {
    return {
      code: 'future',
      message: 'Your LMP date cannot be in the future. Please pick today or an earlier date.',
    };
  }

  if (diff > MAX_VALID_LMP_DAYS_AGO) {
    return {
      code: 'too-old',
      message:
        'This LMP date is more than 45 weeks ago. Please select a date within the past 45 weeks for an active pregnancy.',
    };
  }

  return null;
}

/**
 * Computes the pregnancy week & day for a given date under the
 * LMP = Week 1, Day 1 convention.
 */
export function getPregnancyDayForDate(
  lmpIso: string,
  targetIso: string
): PregnancyDayInfo | null {
  if (!parseIsoDate(lmpIso) || !parseIsoDate(targetIso)) return null;

  const diffDays = diffCalendarDays(lmpIso, targetIso);
  if (diffDays < 0 || diffDays > MAX_CALENDAR_TRACK_DAYS) {
    return null;
  }

  const dayNumber = diffDays + 1;
  const week = Math.floor(diffDays / 7) + 1;
  const day = (diffDays % 7) + 1;
  const completedWeeks = Math.floor(diffDays / 7);
  const completedDays = diffDays % 7;
  const { trimester, label: trimesterLabel } = getTrimesterForWeek(week);

  return {
    diffDays,
    dayNumber,
    week,
    day,
    completedWeeks,
    completedDays,
    shortLabel: `W${week} D${day}`,
    fullLabel: `Week ${week}, Day ${day}`,
    completedLabel: `${completedWeeks}w ${completedDays}d completed`,
    trimester,
    trimesterLabel,
    isLmp: diffDays === 0,
    isEdd: diffDays === TOTAL_PREGNANCY_DAYS,
    isNewWeekStart: day === 1 && diffDays > 0 && diffDays < TOTAL_PREGNANCY_DAYS,
    isPostTerm: diffDays > TOTAL_PREGNANCY_DAYS,
  };
}

export function calculatePregnancySummary(
  lmpIso: string,
  todayIso: string
): PregnancySummary | null {
  if (validateLmpDate(lmpIso, todayIso) !== null) {
    return null;
  }

  const diffDays = diffCalendarDays(lmpIso, todayIso);
  const eddIso = addDays(lmpIso, TOTAL_PREGNANCY_DAYS);

  const dayNumber = diffDays + 1;
  const currentWeek = Math.floor(diffDays / 7) + 1;
  const currentDay = (diffDays % 7) + 1;
  const completedWeeks = Math.floor(diffDays / 7);
  const completedDays = diffDays % 7;

  const daysElapsed = diffDays;
  const daysRemaining = Math.max(0, TOTAL_PREGNANCY_DAYS - diffDays);
  const daysOverdue = Math.max(0, diffDays - TOTAL_PREGNANCY_DAYS);
  const remainingWeeks = Math.floor(daysRemaining / 7);
  const remainingDays = daysRemaining % 7;

  const rawPercent = (diffDays / TOTAL_PREGNANCY_DAYS) * 100;
  const progressPercent = Math.min(100, Math.max(0, Number(rawPercent.toFixed(1))));

  const { trimester, label: trimesterLabel, range: trimesterRange } =
    getTrimesterForWeek(currentWeek);

  const milestoneSpecs: Array<{
    id: string;
    title: string;
    weekLabel: string;
    dayOffset: number;
    description: string;
    trimester: 1 | 2 | 3;
  }> = [
    {
      id: 'lmp',
      title: 'Pregnancy Count Begins (LMP)',
      weekLabel: 'Week 1, Day 1',
      dayOffset: 0,
      description: 'First day of your last menstrual period — Day 1 on your calendar.',
      trimester: 1,
    },
    {
      id: 'heartbeat',
      title: 'First Heartbeat Window',
      weekLabel: 'Week 7, Day 1',
      dayOffset: 42,
      description: 'Early ultrasound can often detect baby’s steady cardiac flicker.',
      trimester: 1,
    },
    {
      id: 'second-trimester',
      title: 'Second Trimester Begins',
      weekLabel: 'Week 14, Day 1',
      dayOffset: 91,
      description: 'Morning nausea often eases as energy steadies into the middle months.',
      trimester: 2,
    },
    {
      id: 'anatomy-scan',
      title: 'Halfway & Anatomy Scan Window',
      weekLabel: 'Week 20, Day 1',
      dayOffset: 133,
      description: 'Detailed mid-pregnancy ultrasound to check baby’s organs and growth.',
      trimester: 2,
    },
    {
      id: 'third-trimester',
      title: 'Third Trimester Begins',
      weekLabel: 'Week 28, Day 1',
      dayOffset: 189,
      description: 'Final stretch of rapid brain growth, weight gain, and birth preparation.',
      trimester: 3,
    },
    {
      id: 'full-term',
      title: 'Early Full Term Reached',
      weekLabel: 'Week 37, Day 1',
      dayOffset: 252,
      description: 'Baby’s lungs and vital systems are maturing nicely for arrival.',
      trimester: 3,
    },
    {
      id: 'edd',
      title: 'Estimated Due Date (EDD)',
      weekLabel: '40 Weeks Complete',
      dayOffset: TOTAL_PREGNANCY_DAYS,
      description: '280 days from your LMP — your anticipated delivery milestone.',
      trimester: 3,
    },
  ];

  let upcomingMarked = false;
  const milestones: PregnancyMilestoneDate[] = milestoneSpecs.map((spec) => {
    const isCompleted = diffDays >= spec.dayOffset;
    const isUpcoming = !isCompleted && !upcomingMarked;
    if (isUpcoming) {
      upcomingMarked = true;
    }
    return {
      ...spec,
      dateIso: addDays(lmpIso, spec.dayOffset),
      isCompleted,
      isUpcoming,
    };
  });

  return {
    lmpIso,
    todayIso,
    eddIso,
    diffDays,
    dayNumber,
    currentWeek,
    currentDay,
    completedWeeks,
    completedDays,
    daysElapsed,
    daysRemaining,
    daysOverdue,
    remainingWeeks,
    remainingDays,
    progressPercent,
    trimester,
    trimesterLabel,
    trimesterRange,
    isDueToday: diffDays === TOTAL_PREGNANCY_DAYS,
    isOverdue: diffDays > TOTAL_PREGNANCY_DAYS,
    milestones,
  };
}

export function buildCalendarMonth(
  year: number,
  monthIndex: number,
  lmpIso: string | null,
  todayIso: string
): CalendarCell[] {
  const firstOfMonthUtc = new Date(Date.UTC(year, monthIndex, 1));
  const firstWeekday = firstOfMonthUtc.getUTCDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const totalCells = firstWeekday + daysInMonth > 35 ? 42 : 35;
  const startDayIndex = Math.floor(firstOfMonthUtc.getTime() / MS_PER_DAY) - firstWeekday;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const iso = fromDayIndex(startDayIndex + i);
    const parsed = parseIsoDate(iso)!;
    const cellMonthIndex = parsed.month - 1;
    const pregnancyDay = lmpIso ? getPregnancyDayForDate(lmpIso, iso) : null;

    cells.push({
      iso,
      year: parsed.year,
      monthIndex: cellMonthIndex,
      dayOfMonth: parsed.day,
      inCurrentMonth: parsed.year === year && cellMonthIndex === monthIndex,
      isToday: iso === todayIso,
      isLmp: pregnancyDay?.isLmp ?? false,
      isEdd: pregnancyDay?.isEdd ?? false,
      pregnancyDay,
    });
  }

  return cells;
}

export function formatDisplayDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return '';
  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
}

export function formatShortDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return '';
  return `${SHORT_MONTH_NAMES[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
}

export function formatWeekday(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return '';
  const utcDate = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  return WEEKDAY_NAMES[utcDate.getUTCDay()];
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export function getDefaultSampleLmp(todayIso: string): string {
  // 98 days prior => Week 15, Day 1 (start of second trimester, visually balanced on progress bar)
  return addDays(todayIso, -98);
}
