import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PregnancySummary, formatDisplayDate } from '../utils/pregnancy';

interface MilestonesSectionProps {
  summary: PregnancySummary;
  onJumpToMilestone: (iso: string) => void;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  summary,
  onJumpToMilestone,
}) => {
  return (
    <section
      id="milestones"
      aria-labelledby="milestones-heading"
      className="scroll-mt-20 pb-14 sm:pb-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-xs font-medium text-[#8C5B6A] dark:text-[#D68FA6]">
              Personalized Schedule
            </p>
            <h2
              id="milestones-heading"
              className="mt-1 font-serif text-2xl sm:text-3xl font-medium text-[#2E2428] dark:text-[#F5ECEF] tracking-tight"
            >
              Key Pregnancy Milestones
            </h2>
          </div>
          <p className="text-sm text-[#6B5B61] dark:text-[#C3B3B9]">
            Select any milestone to jump directly to that date on your calendar.
          </p>
        </div>

        <div className="bg-white dark:bg-[#211A1E] border border-[#EADFE2] dark:border-[#362A30] rounded-2xl divide-y divide-[#F0E6E9] dark:divide-[#33272D] overflow-hidden transition-colors duration-150">
          {summary.milestones.map((milestone) => {
            const statusText = milestone.isCompleted
              ? 'Reached'
              : milestone.isUpcoming
                ? 'Next milestone'
                : 'Upcoming';

            const statusColor = milestone.isCompleted
              ? 'text-[#3C6652] dark:text-[#86C5A7]'
              : milestone.isUpcoming
                ? 'text-[#A84A67] dark:text-[#E892AD] font-semibold'
                : 'text-[#7D6B72] dark:text-[#A8959C]';

            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => onJumpToMilestone(milestone.dateIso)}
                className="w-full text-left px-5 py-4 sm:px-7 sm:py-5 hover:bg-[#FCF7F9] dark:hover:bg-[#292025] transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#7D6B72] dark:text-[#A8959C] tabular-nums">
                    <span className="font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                      {formatDisplayDate(milestone.dateIso)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{milestone.weekLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className={statusColor}>{statusText}</span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                    {milestone.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-[#6B5B61] dark:text-[#C3B3B9]">
                    {milestone.description}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#A84A67] dark:text-[#E892AD] whitespace-nowrap shrink-0">
                  View on calendar
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
