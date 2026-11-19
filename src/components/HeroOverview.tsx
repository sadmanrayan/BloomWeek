import React, { useState } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import {
  LmpValidationError,
  PregnancySummary,
  formatDisplayDate,
  formatWeekday,
} from '../utils/pregnancy';
import {
  DEFAULT_HERO_IMAGE_ALT,
  DEFAULT_HERO_IMAGE_PATH,
  formatSizeHeadline,
  getWeeklyMilestone,
} from '../data/milestones';

interface HeroOverviewProps {
  lmpInput: string;
  todayIso: string;
  summary: PregnancySummary | null;
  validationError: LmpValidationError | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onLmpChange: (value: string) => void;
  onClearLmp: () => void;
  onUseSampleLmp: () => void;
}

export const HeroOverview: React.FC<HeroOverviewProps> = ({
  lmpInput,
  todayIso,
  summary,
  validationError,
  inputRef,
  onLmpChange,
  onClearLmp,
  onUseSampleLmp,
}) => {
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);

  const weeklyMilestone = summary ? getWeeklyMilestone(summary.currentWeek) : null;
  const heroImageSrc = weeklyMilestone ? weeklyMilestone.imageSrc : DEFAULT_HERO_IMAGE_PATH;
  const heroImageAlt = weeklyMilestone ? weeklyMilestone.imageAlt : DEFAULT_HERO_IMAGE_ALT;
  const imageError = failedImageSrc === heroImageSrc;

  return (
    <section
      id="overview"
      aria-labelledby="hero-heading"
      className="scroll-mt-20 pt-8 pb-10 sm:pt-10 sm:pb-12"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Editorial Intro, LMP Form & Primary Gestational Age / EDD Readout */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white dark:bg-[#211A1E] border border-[#EADFE2] dark:border-[#362A30] rounded-2xl p-6 sm:p-8 transition-colors duration-150">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#8C5B6A] dark:text-[#D68FA6] mb-3">
                Pregnancy Tracker · Today is {formatDisplayDate(todayIso)}
              </p>
              <h1
                id="hero-heading"
                className="font-serif text-3xl sm:text-4xl lg:text-[2.65rem] font-medium leading-[1.15] tracking-tight text-[#2E2428] dark:text-[#F5ECEF] [text-wrap:balance]"
              >
                Follow every week and day from your LMP to due date
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#6B5B61] dark:text-[#C3B3B9] leading-relaxed max-w-xl">
                Enter the first day of your last menstrual period to calculate your current
                pregnancy stage, estimated delivery date, and a day-by-day calendar starting at
                Week 1, Day 1.
              </p>

              {/* LMP Input Form */}
              <div className="mt-6 pt-6 border-t border-[#F0E6E9] dark:border-[#33272D]">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="lmp-date-input"
                      className="block text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF] mb-1.5"
                    >
                      Last Menstrual Period (LMP) Date
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        id="lmp-date-input"
                        name="lmpDate"
                        type="date"
                        max={todayIso}
                        value={lmpInput}
                        onChange={(e) => onLmpChange(e.target.value)}
                        aria-invalid={validationError !== null}
                        aria-describedby={validationError ? 'lmp-error-message' : 'lmp-helper-text'}
                        className={`w-full h-11 px-3.5 rounded-lg border text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] bg-[#FDFBFA] dark:bg-[#181316] dark:[color-scheme:dark] tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] ${
                          validationError
                            ? 'border-[#B83B4A] bg-[#FFF8F8] dark:border-[#E06C7A] dark:bg-[#2D181C]'
                            : 'border-[#DCCBD0] hover:border-[#C2A4AE] dark:border-[#43343B] dark:hover:border-[#634B56]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {lmpInput ? (
                      <button
                        type="button"
                        onClick={onClearLmp}
                        className="h-11 px-4 text-sm font-medium text-[#6B5B61] hover:text-[#2E2428] dark:text-[#C8B8BE] dark:hover:text-[#F5ECEF] bg-[#F8F3F4] hover:bg-[#EFE5E8] dark:bg-[#2C2328] dark:hover:bg-[#382C32] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                      >
                        Clear
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onUseSampleLmp}
                        className="h-11 px-4 text-sm font-medium text-[#A84A67] hover:text-white dark:text-[#F0A4BC] dark:hover:text-white bg-[#F8EEF1] hover:bg-[#A84A67] dark:bg-[#35222A] dark:hover:bg-[#B34F6F] rounded-lg transition-colors duration-150 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        Use Sample LMP
                      </button>
                    )}
                  </div>
                </div>

                {validationError ? (
                  <p
                    id="lmp-error-message"
                    role="alert"
                    className="mt-2.5 text-sm font-medium text-[#A62E3C] dark:text-[#F2919D]"
                  >
                    {validationError.message}
                  </p>
                ) : (
                  <p id="lmp-helper-text" className="mt-2 text-xs text-[#7D6B72] dark:text-[#A8959C]">
                    Counted using Naegele’s 280-day rule (40 weeks). Your calendar marks LMP as
                    Week 1, Day 1.
                  </p>
                )}
              </div>
            </div>

            {/* Primary Readout: Gestational Age + Estimated Due Date */}
            {summary ? (
              <div
                data-testid="pregnancy-summary-readout"
                className="mt-7 pt-6 border-t border-[#F0E6E9] dark:border-[#33272D] grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <div>
                  <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                    Current Pregnancy Stage
                  </p>
                  <p
                    data-testid="current-week-day"
                    className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#A84A67] dark:text-[#E892AD] tabular-nums tracking-tight"
                  >
                    Week {summary.currentWeek}, Day {summary.currentDay}
                  </p>
                  <p className="mt-1.5 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                    Day {summary.dayNumber} · {summary.completedWeeks}w{' '}
                    {summary.completedDays}d completed · {summary.trimesterLabel}
                  </p>
                </div>

                <div className="sm:border-l sm:border-[#F0E6E9] dark:sm:border-[#33272D] sm:pl-6">
                  <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                    Estimated Due Date (EDD)
                  </p>
                  <p
                    data-testid="edd-display"
                    className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#3C6652] dark:text-[#86C5A7] tabular-nums tracking-tight"
                  >
                    {formatDisplayDate(summary.eddIso)}
                  </p>
                  <p className="mt-1.5 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                    {formatWeekday(summary.eddIso)} · 40 weeks from{' '}
                    {formatDisplayDate(summary.lmpIso)}
                  </p>
                </div>
              </div>
            ) : (
              <div
                data-testid="empty-summary-state"
                className="mt-7 pt-6 border-t border-[#F0E6E9] dark:border-[#33272D] flex items-start gap-3 text-sm text-[#6B5B61] dark:text-[#C3B3B9]"
              >
                <Calendar
                  className="w-5 h-5 text-[#A84A67] dark:text-[#E892AD] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-[#2E2428] dark:text-[#F5ECEF]">
                    Ready to calculate your journey
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#6B5B61] dark:text-[#C3B3B9]">
                    Select a valid LMP date above to see your current week and day, estimated due
                    date (EDD), journey progress bar, and complete Week 1 Day 1 calendar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Editorial Maternal Botanical Artwork & Current Week Highlight */}
          <div className="lg:col-span-5 relative overflow-hidden rounded-2xl border border-[#EADFE2] dark:border-[#362A30] bg-[#F5ECEF] dark:bg-[#241B20] min-h-[300px] lg:min-h-0 flex flex-col justify-end">
            {!imageError ? (
              <img
                key={heroImageSrc}
                data-testid="hero-size-image"
                src={heroImageSrc}
                alt={heroImageAlt}
                referrerPolicy="no-referrer"
                onError={() => setFailedImageSrc(heroImageSrc)}
                className="absolute inset-0 w-full h-full object-cover dark:brightness-90 transition-opacity duration-300"
              />
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-[#F4E3E8] via-[#FBF5F2] to-[#E6EFE9] dark:from-[#38232B] dark:via-[#231B1F] dark:to-[#1E2B25]"
              />
            )}

            {/* Measured dark scrim ensuring >= 4.5:1 legibility across bottom overlay */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#26181D]/88 via-[#26181D]/35 to-transparent dark:from-[#160E11]/92 dark:via-[#160E11]/45"
            />

            <div className="relative z-10 p-6 sm:p-7 text-white">
              {summary && weeklyMilestone ? (
                <>
                  <p className="text-xs font-medium text-[#F5D6DF] tabular-nums">
                    Week {summary.currentWeek} Snapshot · {summary.trimesterLabel}
                  </p>
                  <h2 className="mt-1.5 font-serif text-2xl sm:text-[1.7rem] font-medium leading-snug text-white">
                    {formatSizeHeadline(weeklyMilestone)}
                  </h2>
                  <p className="mt-2 text-sm text-[#F4EAEF] leading-relaxed">
                    {weeklyMilestone.highlight}
                  </p>
                  <p className="mt-3 text-xs text-[#DFC8D0] tabular-nums">
                    Approximate length: {weeklyMilestone.approxLength}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-[#F5D6DF]">Week-by-Week Companion</p>
                  <h2 className="mt-1.5 font-serif text-2xl font-medium leading-snug text-white">
                    Every day brings you closer
                  </h2>
                  <p className="mt-2 text-sm text-[#F4EAEF] leading-relaxed">
                    Enter your LMP date to reveal baby’s weekly growth comparison, key prenatal
                    milestones, and your personalized daily calendar.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
