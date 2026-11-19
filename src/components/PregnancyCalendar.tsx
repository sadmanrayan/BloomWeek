import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CalendarCell,
  PregnancySummary,
  buildCalendarMonth,
  diffCalendarDays,
  formatDisplayDate,
  formatMonthYear,
  formatWeekday,
  getPregnancyDayForDate,
} from '../utils/pregnancy';
import { formatSizeShort, getWeeklyMilestone } from '../data/milestones';

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface PregnancyCalendarProps {
  year: number;
  monthIndex: number;
  summary: PregnancySummary;
  todayIso: string;
  selectedDateIso: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToDate: (iso: string) => void;
  onSelectDate: (iso: string) => void;
}

export const PregnancyCalendar: React.FC<PregnancyCalendarProps> = ({
  year,
  monthIndex,
  summary,
  todayIso,
  selectedDateIso,
  onPrevMonth,
  onNextMonth,
  onJumpToDate,
  onSelectDate,
}) => {
  const cells = buildCalendarMonth(year, monthIndex, summary.lmpIso, todayIso);
  const selectedDayInfo = getPregnancyDayForDate(summary.lmpIso, selectedDateIso);
  const selectedDiffToEdd = diffCalendarDays(selectedDateIso, summary.eddIso);
  const selectedMilestone = selectedDayInfo ? getWeeklyMilestone(selectedDayInfo.week) : null;

  const getCellAriaLabel = (cell: CalendarCell): string => {
    const parts = [formatDisplayDate(cell.iso)];
    if (cell.pregnancyDay) {
      parts.push(cell.pregnancyDay.fullLabel);
    }
    if (cell.isLmp) parts.push('LMP start date');
    if (cell.isToday) parts.push('Today');
    if (cell.isEdd) parts.push('Estimated Due Date');
    return parts.join(', ');
  };

  return (
    <section
      id="calendar"
      aria-labelledby="calendar-heading"
      className="scroll-mt-20 pb-12 sm:pb-14"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#211A1E] border border-[#EADFE2] dark:border-[#362A30] rounded-2xl overflow-hidden transition-colors duration-150">
          {/* Calendar Toolbar Header */}
          <div className="p-5 sm:p-7 border-b border-[#F0E6E9] dark:border-[#33272D] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#8C5B6A] dark:text-[#D68FA6]">
                Day-by-Day Calendar · LMP = Week 1, Day 1
              </p>
              <div className="mt-1 flex items-center gap-3">
                <h2
                  id="calendar-heading"
                  data-testid="calendar-month-title"
                  className="font-serif text-2xl sm:text-3xl font-medium text-[#2E2428] dark:text-[#F5ECEF] tracking-tight"
                >
                  {formatMonthYear(year, monthIndex)}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Quick Jump Controls */}
              <div
                role="group"
                aria-label="Jump to key pregnancy dates"
                className="flex items-center gap-1 p-1 bg-[#F8F3F4] dark:bg-[#191316] rounded-lg border border-transparent dark:border-[#32262C]"
              >
                <button
                  type="button"
                  onClick={() => onJumpToDate(summary.lmpIso)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] ${
                    selectedDateIso === summary.lmpIso
                      ? 'bg-white dark:bg-[#2E2429] text-[#8C4924] dark:text-[#F2B896] shadow-xs'
                      : 'text-[#6B5B61] dark:text-[#B9A7AE] hover:text-[#2E2428] dark:hover:text-[#F5ECEF] hover:bg-white/70 dark:hover:bg-[#281F24]'
                  }`}
                >
                  Jump to LMP
                </button>
                <button
                  type="button"
                  onClick={() => onJumpToDate(todayIso)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] ${
                    selectedDateIso === todayIso
                      ? 'bg-white dark:bg-[#2E2429] text-[#A84A67] dark:text-[#E892AD] shadow-xs'
                      : 'text-[#6B5B61] dark:text-[#B9A7AE] hover:text-[#2E2428] dark:hover:text-[#F5ECEF] hover:bg-white/70 dark:hover:bg-[#281F24]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => onJumpToDate(summary.eddIso)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] ${
                    selectedDateIso === summary.eddIso
                      ? 'bg-white dark:bg-[#2E2429] text-[#2E5E49] dark:text-[#86C5A7] shadow-xs'
                      : 'text-[#6B5B61] dark:text-[#B9A7AE] hover:text-[#2E2428] dark:hover:text-[#F5ECEF] hover:bg-white/70 dark:hover:bg-[#281F24]'
                  }`}
                >
                  Jump to EDD
                </button>
              </div>

              {/* Prev / Next Month Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onPrevMonth}
                  aria-label="Previous month"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-[#E6D7DC] dark:border-[#3D2F36] text-[#2E2428] dark:text-[#F5ECEF] hover:bg-[#F8F3F4] dark:hover:bg-[#2C2328] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onNextMonth}
                  aria-label="Next month"
                  className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-[#E6D7DC] dark:border-[#3D2F36] text-[#2E2428] dark:text-[#F5ECEF] hover:bg-[#F8F3F4] dark:hover:bg-[#2C2328] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid + Selected Date Inspector Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Calendar Grid */}
            <div className="lg:col-span-8 p-4 sm:p-6">
              {/* Weekday Header Row */}
              <div className="grid grid-cols-7 mb-2" role="row">
                {WEEKDAYS_SHORT.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-xs font-semibold text-[#7D6B72] dark:text-[#A8959C]"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Date Cells Grid */}
              <div
                data-testid="calendar-grid"
                className="grid grid-cols-7 gap-1 sm:gap-1.5"
              >
                {cells.map((cell) => {
                  const isSelected = cell.iso === selectedDateIso;
                  const pDay = cell.pregnancyDay;

                  let cellSurface = cell.inCurrentMonth
                    ? 'bg-[#FDFBFA] dark:bg-[#1B1519] border-[#EFE5E8] dark:border-[#32262C] text-[#2E2428] dark:text-[#F5ECEF] hover:border-[#CFAFBB] dark:hover:border-[#5D4450] hover:bg-[#FAF2F4] dark:hover:bg-[#271E23]'
                    : 'bg-[#FAF8F8] dark:bg-[#171215] border-transparent text-[#A99A9F] dark:text-[#6B5A61] hover:bg-[#F5EEF0] dark:hover:bg-[#221B1F]';

                  if (cell.isLmp) {
                    cellSurface =
                      'bg-[#FDF4EE] dark:bg-[#2D2019] border-[#E8C5B0] dark:border-[#6B4835] text-[#7D4424] dark:text-[#F2B896] hover:border-[#C8845E] dark:hover:border-[#8F6148]';
                  }
                  if (cell.isEdd) {
                    cellSurface =
                      'bg-[#EEF5F1] dark:bg-[#182921] border-[#BBD7C8] dark:border-[#365C4B] text-[#294E3D] dark:text-[#95D1B4] hover:border-[#6EA087] dark:hover:border-[#4D826A]';
                  }
                  if (cell.isToday) {
                    cellSurface =
                      'bg-[#A84A67] dark:bg-[#B34F6F] border-[#A84A67] dark:border-[#C96B88] text-white hover:bg-[#943E59] dark:hover:bg-[#C45D7E]';
                  }

                  const selectedRing = isSelected
                    ? cell.isToday
                      ? 'ring-2 ring-offset-2 ring-[#A84A67] dark:ring-[#E892AD] dark:ring-offset-[#211A1E]'
                      : 'ring-2 ring-offset-1 ring-[#A84A67] dark:ring-[#E892AD] dark:ring-offset-[#211A1E]'
                    : '';

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      data-date={cell.iso}
                      onClick={() => onSelectDate(cell.iso)}
                      aria-label={getCellAriaLabel(cell)}
                      aria-pressed={isSelected}
                      className={`min-h-[60px] sm:min-h-[78px] px-1 py-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] ${cellSurface} ${selectedRing}`}
                    >
                      <div className="flex items-start justify-between gap-0.5 w-full">
                        <span
                          className={`text-xs sm:text-sm font-semibold tabular-nums leading-none ${
                            !cell.inCurrentMonth && !cell.isToday ? 'opacity-60' : ''
                          }`}
                        >
                          {cell.dayOfMonth}
                        </span>

                        {cell.isToday && (
                          <span className="text-[10px] font-semibold leading-none text-[#FDEAF0] hidden sm:inline">
                            Today
                          </span>
                        )}
                        {!cell.isToday && cell.isLmp && (
                          <span className="text-[9px] sm:text-[10px] font-semibold leading-none text-[#A65A30] dark:text-[#F2B896]">
                            LMP
                          </span>
                        )}
                        {!cell.isToday && cell.isEdd && (
                          <span className="text-[9px] sm:text-[10px] font-semibold leading-none text-[#2E5E49] dark:text-[#95D1B4]">
                            EDD
                          </span>
                        )}
                      </div>

                      {/* Week & Day Directly Beneath the Date */}
                      <div className="mt-auto pt-1 w-full">
                        {pDay ? (
                          <div className="leading-tight">
                            <span
                              className={`block text-[9.5px] sm:text-[11px] font-semibold tabular-nums tracking-tight whitespace-nowrap ${
                                cell.isToday
                                  ? 'text-white'
                                  : cell.isEdd
                                    ? 'text-[#294E3D] dark:text-[#95D1B4]'
                                    : cell.isLmp
                                      ? 'text-[#8C4924] dark:text-[#F2B896]'
                                      : pDay.isNewWeekStart
                                        ? 'text-[#A84A67] dark:text-[#E892AD]'
                                        : cell.inCurrentMonth
                                          ? 'text-[#6B5B61] dark:text-[#BDAAB1]'
                                          : 'text-[#A09096] dark:text-[#6B5A61]'
                              }`}
                            >
                              {cell.isEdd ? 'Due · 40w' : pDay.shortLabel}
                            </span>
                            {pDay.isNewWeekStart && !cell.isToday && !cell.isEdd && (
                              <span className="hidden sm:block text-[9px] text-[#A84A67]/80 dark:text-[#E892AD]/85 leading-tight">
                                New week
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="block text-[10px] text-transparent select-none">—</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Accessible Color + Text Legend */}
              <div className="mt-5 pt-4 border-t border-[#F0E6E9] dark:border-[#33272D] flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B5B61] dark:text-[#C3B3B9]">
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded bg-[#FDF4EE] dark:bg-[#2D2019] border border-[#E8C5B0] dark:border-[#6B4835]"
                  />
                  LMP Start (W1 D1)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded bg-[#A84A67] dark:bg-[#B34F6F]"
                  />
                  Today
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded bg-[#EEF5F1] dark:bg-[#182921] border border-[#BBD7C8] dark:border-[#365C4B]"
                  />
                  Estimated Due Date (EDD)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold text-[#A84A67] dark:text-[#E892AD]">W# D1</span>
                  Start of each new week
                </span>
              </div>
            </div>

            {/* Selected Day Inspector Column */}
            <aside
              aria-label="Selected day details"
              data-testid="selected-day-inspector"
              className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#F0E6E9] dark:border-[#33272D] bg-[#FCF8F9] dark:bg-[#1B1519] p-6 flex flex-col justify-between transition-colors duration-150"
            >
              <div>
                <p className="text-xs font-medium text-[#8C5B6A] dark:text-[#D68FA6]">
                  Selected Calendar Date
                </p>
                <h3 className="mt-1 font-serif text-xl sm:text-2xl font-medium text-[#2E2428] dark:text-[#F5ECEF]">
                  {formatDisplayDate(selectedDateIso)}
                </h3>
                <p className="mt-0.5 text-xs text-[#6B5B61] dark:text-[#C3B3B9]">
                  {formatWeekday(selectedDateIso)}
                  {selectedDateIso === todayIso ? ' · Today' : ''}
                  {selectedDateIso === summary.lmpIso ? ' · LMP Start Date' : ''}
                  {selectedDateIso === summary.eddIso ? ' · Estimated Due Date' : ''}
                </p>

                {selectedDayInfo ? (
                  <div className="mt-6 space-y-5">
                    <div className="pt-5 border-t border-[#EDE1E5] dark:border-[#33272D]">
                      <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                        Pregnancy Age on This Day
                      </p>
                      <p
                        data-testid="selected-day-week-label"
                        className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#A84A67] dark:text-[#E892AD] tabular-nums"
                      >
                        {selectedDayInfo.fullLabel}
                      </p>
                      <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                        Day {selectedDayInfo.dayNumber} of journey · {selectedDayInfo.completedLabel}{' '}
                        · {selectedDayInfo.trimesterLabel}
                      </p>
                    </div>

                    <div className="pt-5 border-t border-[#EDE1E5] dark:border-[#33272D] grid grid-cols-2 gap-4 tabular-nums">
                      <div>
                        <p className="text-xs text-[#7D6B72] dark:text-[#A8959C]">Days Elapsed</p>
                        <p className="mt-0.5 text-lg font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                          {selectedDayInfo.diffDays} days
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#7D6B72] dark:text-[#A8959C]">
                          {selectedDiffToEdd < 0 ? 'Days Past EDD' : 'Days to EDD'}
                        </p>
                        <p className="mt-0.5 text-lg font-semibold text-[#3C6652] dark:text-[#86C5A7]">
                          {selectedDiffToEdd < 0
                            ? `+${Math.abs(selectedDiffToEdd)} days`
                            : `${selectedDiffToEdd} days`}
                        </p>
                      </div>
                    </div>

                    {selectedMilestone && (
                      <div className="pt-5 border-t border-[#EDE1E5] dark:border-[#33272D]">
                        <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                          Week {selectedDayInfo.week} Development Note
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                          {formatSizeShort(selectedMilestone)} ·{' '}
                          <span className="font-normal text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                            {selectedMilestone.approxLength}
                          </span>
                        </p>
                        <p className="mt-1.5 text-sm text-[#5C4E53] dark:text-[#C8B8BE] leading-relaxed">
                          {selectedMilestone.highlight}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 pt-5 border-t border-[#EDE1E5] dark:border-[#33272D] text-sm text-[#6B5B61] dark:text-[#C3B3B9] leading-relaxed">
                    {diffCalendarDays(summary.lmpIso, selectedDateIso) < 0 ? (
                      <p>
                        This date is before your LMP date ({formatDisplayDate(summary.lmpIso)}).
                        Select your LMP date or any day afterward to view its Week and Day count.
                      </p>
                    ) : (
                      <p>
                        This date is beyond 43 weeks from your LMP. Use the quick-jump buttons above
                        to return to your active pregnancy timeline.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#EDE1E5] dark:border-[#33272D] text-xs text-[#7D6B72] dark:text-[#A8959C]">
                Click any date on the calendar to inspect its week, day count, and growth note.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};
