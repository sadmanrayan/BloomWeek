import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { PregnancySummary } from '../utils/pregnancy';
import { getTrimesterCareGuide } from '../data/nutritionGuide';

interface NutritionCareGuideProps {
  summary: PregnancySummary;
}

const TRIMESTER_TABS: Array<{ id: 1 | 2 | 3; shortLabel: string; range: string }> = [
  { id: 1, shortLabel: '1st Trimester', range: 'W1–13' },
  { id: 2, shortLabel: '2nd Trimester', range: 'W14–27' },
  { id: 3, shortLabel: '3rd Trimester', range: 'W28–40' },
];

export const NutritionCareGuide: React.FC<NutritionCareGuideProps> = ({ summary }) => {
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(summary.trimester);

  // Sync automatically whenever the user's LMP date moves them into a different trimester
  useEffect(() => {
    setSelectedTrimester(summary.trimester);
  }, [summary.trimester]);

  const guide = getTrimesterCareGuide(selectedTrimester);
  const isCurrentStage = selectedTrimester === summary.trimester;

  return (
    <section
      id="nutrition"
      aria-labelledby="nutrition-heading"
      className="scroll-mt-20 pb-8 sm:pb-10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#211A1E] border border-[#EADFE2] dark:border-[#362A30] rounded-2xl p-6 sm:p-8 transition-colors duration-150">
          {/* Header Row & Trimester Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <p className="text-xs font-medium text-[#8C5B6A] dark:text-[#D68FA6]">
                Trimester Nutrition &amp; Care Guide ·{' '}
                {isCurrentStage
                  ? `Tailored to your current stage (Week ${summary.currentWeek})`
                  : `Viewing ${guide.title} (${guide.weekRange})`}
              </p>
              <h2
                id="nutrition-heading"
                className="mt-1 font-serif text-2xl sm:text-3xl font-medium text-[#2E2428] dark:text-[#F5ECEF] tracking-tight"
              >
                {guide.title}: Eat Well, Stay Safe
              </h2>
              <p className="mt-2 text-sm text-[#6B5B61] dark:text-[#C3B3B9] max-w-2xl leading-relaxed">
                {guide.summary}
              </p>
            </div>

            {/* Interactive Trimester Segmented Tabs */}
            <div
              role="tablist"
              aria-label="Select pregnancy trimester guide"
              className="inline-flex items-center p-1 rounded-xl bg-[#F5ECEF] dark:bg-[#2B2227] border border-[#E5D5DA] dark:border-[#3E3037] self-start lg:self-end overflow-x-auto max-w-full"
            >
              {TRIMESTER_TABS.map((tab) => {
                const active = selectedTrimester === tab.id;
                const matchesUser = summary.trimester === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`trimester-tab-${tab.id}`}
                    aria-selected={active}
                    aria-controls="trimester-guide-panel"
                    onClick={() => setSelectedTrimester(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] ${
                      active
                        ? 'bg-white dark:bg-[#3D2F36] text-[#2E2428] dark:text-[#F5ECEF] shadow-xs'
                        : 'text-[#6B5B61] dark:text-[#B9A8AF] hover:text-[#2E2428] dark:hover:text-[#F5ECEF]'
                    }`}
                  >
                    {tab.shortLabel}
                    {matchesUser ? ' (Now)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id="trimester-guide-panel"
            role="tabpanel"
            aria-labelledby={`trimester-tab-${selectedTrimester}`}
          >
            {/* 3-Column Daily Targets Strip (Flat Hairline Dividers, Zero Pill Badges) */}
            <div className="mt-6 pt-6 border-t border-[#F0E6E9] dark:border-[#33272D] grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                  Key Priority Nutrients
                </p>
                <p className="mt-1.5 text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF] leading-snug">
                  {guide.priorityNutrients.join(' · ')}
                </p>
              </div>

              <div className="md:border-l md:border-[#F0E6E9] dark:md:border-[#33272D] md:pl-6">
                <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                  Energy &amp; Meal Rhythm
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] leading-snug">
                  {guide.calorieGuidance}
                </p>
              </div>

              <div className="md:border-l md:border-[#F0E6E9] dark:md:border-[#33272D] md:pl-6">
                <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                  Daily Hydration Target
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] leading-snug">
                  {guide.hydrationTarget}
                </p>
              </div>
            </div>

            {/* 2-Column Editorial Comparison: What to Eat vs. What to Avoid */}
            <div className="mt-7 pt-7 border-t border-[#F0E6E9] dark:border-[#33272D] grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              {/* Column 1: Recommended Foods */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Check
                    className="w-4 h-4 text-[#3C6652] dark:text-[#86C5A7] shrink-0"
                    aria-hidden="true"
                  />
                  <h3 className="font-serif text-xl font-medium text-[#2E2428] dark:text-[#F5ECEF]">
                    What to Eat &amp; Focus On
                  </h3>
                </div>

                <ul
                  data-testid="recommended-foods-list"
                  className="divide-y divide-[#F3EAED] dark:divide-[#30242A]"
                >
                  {guide.recommendedFoods.map((food) => (
                    <li key={food.name} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="min-w-0 text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                          {food.name}
                        </h4>
                        <span className="shrink-0 text-right text-xs font-medium text-[#3C6652] dark:text-[#86C5A7]">
                          {food.keyNutrient}
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-[#6B5B61] dark:text-[#C3B3B9] leading-relaxed">
                        {food.benefit}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 2: Foods & Habits to Avoid */}
              <div className="lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-10">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert
                    className="w-4 h-4 text-[#9A5B25] dark:text-[#F0BE82] shrink-0"
                    aria-hidden="true"
                  />
                  <h3 className="font-serif text-xl font-medium text-[#2E2428] dark:text-[#F5ECEF]">
                    What to Avoid &amp; Limit
                  </h3>
                </div>

                <ul
                  data-testid="avoid-foods-list"
                  className="divide-y divide-[#F3EAED] dark:divide-[#30242A]"
                >
                  {guide.foodsToAvoid.map((avoid) => (
                    <li key={avoid.item} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="min-w-0 text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                          {avoid.item}
                        </h4>
                        <span className="shrink-0 text-right text-xs font-medium text-[#9A5B25] dark:text-[#F0BE82]">
                          {avoid.category}
                        </span>
                      </div>
                      <p className="mt-1 text-xs sm:text-sm text-[#6B5B61] dark:text-[#C3B3B9] leading-relaxed">
                        {avoid.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Urgent Warning Signs Summary Panel (Uniform 1px Border, No Thick Left Accent Bar) */}
            <div
              data-testid="warning-signs-panel"
              className="mt-8 rounded-xl border border-[#ECC9D1] dark:border-[#552C36] bg-[#FFF7F8] dark:bg-[#29171C] p-5 sm:p-6 transition-colors duration-150"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="w-5 h-5 text-[#A62E3C] dark:text-[#F2919D] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-serif text-lg sm:text-xl font-medium text-[#5A1922] dark:text-[#FBD7DC]">
                      {guide.title} Warning Signs — When to Call Your Doctor
                    </h3>
                    <span className="text-xs font-semibold text-[#A62E3C] dark:text-[#F2919D]">
                      Seek prompt medical evaluation
                    </span>
                  </div>

                  <ul
                    data-testid="warning-signs-list"
                    className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5"
                  >
                    {guide.warningSigns.map((sign) => (
                      <li key={sign.symptom} className="text-sm">
                        <p className="font-semibold text-[#4B1A22] dark:text-[#FCE7EA]">
                          {sign.symptom}
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm text-[#6E3A43] dark:text-[#DFB6BE] leading-relaxed">
                          {sign.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Daily Care Tip */}
            <p className="mt-5 text-xs sm:text-sm text-[#6B5B61] dark:text-[#C3B3B9] leading-relaxed">
              <strong className="font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                Everyday {guide.title} Care Tip:{' '}
              </strong>
              {guide.dailyCareNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
