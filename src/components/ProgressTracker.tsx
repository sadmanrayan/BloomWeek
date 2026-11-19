import React from 'react';
import {
  PregnancySummary,
  TOTAL_PREGNANCY_DAYS,
  formatShortDate,
  formatWeekday,
} from '../utils/pregnancy';

interface ProgressTrackerProps {
  summary: PregnancySummary;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ summary }) => {
  const clampedPercent = Math.min(100, Math.max(0, summary.progressPercent));
  const t1Mark = (91 / TOTAL_PREGNANCY_DAYS) * 100; // Week 13 end (~32.5%)
  const t2Mark = (189 / TOTAL_PREGNANCY_DAYS) * 100; // Week 27 end (~67.5%)

  const remainingSummary = summary.isOverdue
    ? `${summary.daysOverdue} ${summary.daysOverdue === 1 ? 'day' : 'days'} past EDD`
    : summary.isDueToday
      ? 'Estimated due date is today'
      : `${summary.remainingWeeks}w ${summary.remainingDays}d left`;

  return (
    <section
      id="progress"
      aria-labelledby="progress-heading"
      className="scroll-mt-20 pb-8 sm:pb-10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#211A1E] border border-[#EADFE2] dark:border-[#362A30] rounded-2xl p-6 sm:p-8 transition-colors duration-150">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#8C5B6A] dark:text-[#D68FA6]">
                LMP to EDD Journey
              </p>
              <h2
                id="progress-heading"
                className="mt-1 font-serif text-2xl sm:text-3xl font-medium text-[#2E2428] dark:text-[#F5ECEF] tracking-tight"
              >
                Pregnancy Progress
              </h2>
            </div>

            <div className="flex items-baseline gap-2.5 tabular-nums">
              <span
                data-testid="progress-percent"
                className="font-serif text-3xl sm:text-4xl font-semibold text-[#A84A67] dark:text-[#E892AD]"
              >
                {clampedPercent.toFixed(1)}%
              </span>
              <span className="text-sm text-[#6B5B61] dark:text-[#C3B3B9]">
                of 280-day journey
              </span>
            </div>
          </div>

          {/* Visual Progress Track */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-medium text-[#6B5B61] dark:text-[#C3B3B9] mb-2.5 tabular-nums">
              <span>
                LMP Start ·{' '}
                <strong className="text-[#2E2428] dark:text-[#F5ECEF]">
                  {formatShortDate(summary.lmpIso)}
                </strong>
              </span>
              <span>
                EDD Target ·{' '}
                <strong className="text-[#3C6652] dark:text-[#86C5A7]">
                  {formatShortDate(summary.eddIso)}
                </strong>
              </span>
            </div>

            <div
              role="progressbar"
              aria-label="Pregnancy progress from LMP to estimated due date"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clampedPercent}
              aria-valuetext={`${clampedPercent.toFixed(1)} percent complete, ${summary.daysElapsed} days pregnant, ${summary.daysRemaining} days until delivery`}
              className="relative h-4 w-full rounded-full bg-[#F4EAED] dark:bg-[#32262C] overflow-visible"
            >
              {/* Filled Track */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#D17B96] via-[#B75675] to-[#A84A67] dark:from-[#E58AA6] dark:via-[#CD6988] dark:to-[#B5506F] transition-all duration-300"
                style={{ width: `${clampedPercent}%` }}
              />

              {/* Trimester Divider Hairlines */}
              <div
                aria-hidden="true"
                title="End of 1st Trimester (Week 13)"
                className="absolute top-0 bottom-0 w-px bg-white/90 dark:bg-[#211A1E]/90"
                style={{ left: `${t1Mark}%` }}
              />
              <div
                aria-hidden="true"
                title="End of 2nd Trimester (Week 27)"
                className="absolute top-0 bottom-0 w-px bg-white/90 dark:bg-[#211A1E]/90"
                style={{ left: `${t2Mark}%` }}
              />

              {/* Current Day Pin */}
              <div
                aria-hidden="true"
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#211A1E] border-[3px] border-[#A84A67] dark:border-[#E892AD] shadow-sm transition-all duration-300"
                style={{ left: `${clampedPercent}%` }}
              />
            </div>

            {/* Trimester Labels Below Track */}
            <div className="mt-2.5 grid grid-cols-3 text-xs text-[#7D6B72] dark:text-[#A8959C]">
              <div
                className={
                  summary.trimester === 1 ? 'font-semibold text-[#A84A67] dark:text-[#E892AD]' : ''
                }
              >
                1st Trimester · W1–13
              </div>
              <div
                className={`text-center ${
                  summary.trimester === 2 ? 'font-semibold text-[#A84A67] dark:text-[#E892AD]' : ''
                }`}
              >
                2nd Trimester · W14–27
              </div>
              <div
                className={`text-right ${
                  summary.trimester === 3 ? 'font-semibold text-[#A84A67] dark:text-[#E892AD]' : ''
                }`}
              >
                3rd Trimester · W28–40
              </div>
            </div>
          </div>

          {/* 4-Column Tabular Metrics Strip (Flat Dividers, No Nested Cards) */}
          <div className="mt-7 pt-6 border-t border-[#F0E6E9] dark:border-[#33272D] grid grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-6">
            <div>
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">Days Pregnant</p>
              <p
                data-testid="days-pregnant"
                className="mt-1 text-2xl sm:text-3xl font-semibold text-[#2E2428] dark:text-[#F5ECEF] tabular-nums"
              >
                {summary.daysElapsed} {summary.daysElapsed === 1 ? 'day' : 'days'}
              </p>
              <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                Week {summary.currentWeek}, Day {summary.currentDay} (Day {summary.dayNumber})
              </p>
            </div>

            <div className="lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-6">
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                {summary.isOverdue ? 'Past Due Date' : 'Days Until Delivery'}
              </p>
              <p
                data-testid="days-remaining"
                className="mt-1 text-2xl sm:text-3xl font-semibold text-[#A84A67] dark:text-[#E892AD] tabular-nums"
              >
                {summary.isOverdue
                  ? `+${summary.daysOverdue} ${summary.daysOverdue === 1 ? 'day' : 'days'}`
                  : `${summary.daysRemaining} ${summary.daysRemaining === 1 ? 'day' : 'days'}`}
              </p>
              <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                {remainingSummary}
              </p>
            </div>

            <div className="lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-6">
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                Current Trimester
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                {summary.trimesterLabel}
              </p>
              <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                {summary.trimesterRange}
              </p>
            </div>

            <div className="lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-6">
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                Estimated Due Date
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-semibold text-[#3C6652] dark:text-[#86C5A7] tabular-nums">
                {formatShortDate(summary.eddIso)}
              </p>
              <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9]">
                {formatWeekday(summary.eddIso)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
