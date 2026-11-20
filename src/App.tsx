import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { HeroOverview } from './components/HeroOverview';
import { FetalDevelopment3D } from './components/FetalDevelopment3D';
import { ProgressTracker } from './components/ProgressTracker';
import { PregnancyCalendar } from './components/PregnancyCalendar';
import { WeightTracker } from './components/WeightTracker';
import { NutritionCareGuide } from './components/NutritionCareGuide';
import { MilestonesSection } from './components/MilestonesSection';
import {
  LMP_STORAGE_KEY,
  calculatePregnancySummary,
  getTodayIsoDate,
  parseIsoDate,
  resolveInitialLmp,
  validateLmpDate,
} from './utils/pregnancy';
import {
  THEME_STORAGE_KEY,
  Theme,
  resolveInitialTheme,
  toggleThemeValue,
} from './utils/theme';
import {
  StoredWeightState,
  WEIGHT_STORAGE_KEY,
  WeightEntry,
  WeightUnit,
  createEmptyWeightState,
  hasAnyWeightData,
  resolveInitialWeightState,
  sortWeightEntriesAsc,
} from './utils/weight';
import { resolveAssetUrl } from './utils/assets';

const SITE_ICON_PATH =
  '/assets/aistudio/Pregnancy_Symbol__Pregnant__Icon__Symbol_PNG_and_Vector_with_Transparent_Background_for_Free_Download_81192317.jpg';

function isFreshStartRequested(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('fresh') === '1' || params.get('reset') === '1';
  } catch {
    return false;
  }
}

function loadInitialLmp(forceFresh: boolean): string {
  if (forceFresh) return '';
  try {
    const saved = window.localStorage.getItem(LMP_STORAGE_KEY);
    return resolveInitialLmp(saved, false);
  } catch {
    return '';
  }
}

function loadInitialTheme(): Theme {
  let saved: string | null = null;
  try {
    saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return resolveInitialTheme(saved, prefersDark);
}

function loadInitialWeightState(forceFresh: boolean): StoredWeightState {
  if (forceFresh) return createEmptyWeightState();
  try {
    const saved = window.localStorage.getItem(WEIGHT_STORAGE_KEY);
    return resolveInitialWeightState(saved, false);
  } catch {
    return createEmptyWeightState();
  }
}

export function App() {
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const initialFreshStart = useMemo(() => isFreshStartRequested(), []);
  const [theme, setTheme] = useState<Theme>(() => loadInitialTheme());
  const [lmpInput, setLmpInput] = useState<string>(() => loadInitialLmp(initialFreshStart));
  const [weightState, setWeightState] = useState<StoredWeightState>(() =>
    loadInitialWeightState(initialFreshStart)
  );

  const todayParsed = useMemo(() => parseIsoDate(todayIso)!, [todayIso]);
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; monthIndex: number }>({
    year: todayParsed.year,
    monthIndex: todayParsed.month - 1,
  });
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);

  const lmpInputRef = useRef<HTMLInputElement | null>(null);

  const validationError = useMemo(
    () => validateLmpDate(lmpInput, todayIso),
    [lmpInput, todayIso]
  );

  const summary = useMemo(
    () => calculatePregnancySummary(lmpInput, todayIso),
    [lmpInput, todayIso]
  );

  // Sync theme with <html class="dark"> and persist to localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage access errors
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => toggleThemeValue(prev));
  };

  // If opened via a ?fresh=1 link, wipe any previous local entries and clean the URL
  useEffect(() => {
    if (!initialFreshStart) return;
    try {
      window.localStorage.removeItem(LMP_STORAGE_KEY);
      window.localStorage.removeItem(WEIGHT_STORAGE_KEY);
      const url = new URL(window.location.href);
      url.searchParams.delete('fresh');
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Ignore history/storage errors in restricted frames
    }
  }, [initialFreshStart]);

  // Persist valid LMP date only on this browser; clear storage key when empty
  useEffect(() => {
    try {
      if (lmpInput === '') {
        window.localStorage.removeItem(LMP_STORAGE_KEY);
      } else if (validationError === null) {
        window.localStorage.setItem(LMP_STORAGE_KEY, lmpInput);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [lmpInput, validationError]);

  // Persist weight tracker only when user has entered personal data
  useEffect(() => {
    try {
      if (hasAnyWeightData(weightState)) {
        window.localStorage.setItem(WEIGHT_STORAGE_KEY, JSON.stringify(weightState));
      } else {
        window.localStorage.removeItem(WEIGHT_STORAGE_KEY);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [weightState]);

  const handleChangeWeightUnit = (unit: WeightUnit) => {
    setWeightState((prev) => ({
      ...prev,
      profile: { ...prev.profile, unit },
    }));
  };

  const handleUpdateWeightProfile = (
    prePregnancyWeightKg: number | null,
    heightCm: number | null
  ) => {
    setWeightState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        prePregnancyWeightKg,
        heightCm,
      },
    }));
  };

  const handleAddWeightEntry = (entry: WeightEntry) => {
    setWeightState((prev) => {
      // Replace an existing entry on the same calendar date or append
      const withoutSameDate = prev.entries.filter((item) => item.dateIso !== entry.dateIso);
      return {
        ...prev,
        entries: sortWeightEntriesAsc([...withoutSameDate, entry]),
      };
    });
  };

  const handleDeleteWeightEntry = (id: string) => {
    setWeightState((prev) => ({
      ...prev,
      entries: prev.entries.filter((item) => item.id !== id),
    }));
  };

  const handleClearWeightEntries = () => {
    setWeightState((prev) => ({
      ...prev,
      entries: [],
    }));
  };

  const handleLmpChange = (nextValue: string) => {
    setLmpInput(nextValue);
  };

  const handleClearLmp = () => {
    setLmpInput('');
    lmpInputRef.current?.focus();
  };

  const handleResetAllData = () => {
    setLmpInput('');
    setWeightState((prev) => createEmptyWeightState(prev.profile.unit));
    setSelectedDateIso(todayIso);
    setCalendarMonth({ year: todayParsed.year, monthIndex: todayParsed.month - 1 });
    try {
      window.localStorage.removeItem(LMP_STORAGE_KEY);
      window.localStorage.removeItem(WEIGHT_STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
    lmpInputRef.current?.focus();
  };

  const handleFocusLmpInput = () => {
    const input = lmpInputRef.current;
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      input.focus();
    }
  };

  const handlePrevMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.monthIndex === 0) {
        return { year: prev.year - 1, monthIndex: 11 };
      }
      return { year: prev.year, monthIndex: prev.monthIndex - 1 };
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth((prev) => {
      if (prev.monthIndex === 11) {
        return { year: prev.year + 1, monthIndex: 0 };
      }
      return { year: prev.year, monthIndex: prev.monthIndex + 1 };
    });
  };

  const handleJumpToDate = (iso: string) => {
    const parsed = parseIsoDate(iso);
    if (!parsed) return;
    setCalendarMonth({ year: parsed.year, monthIndex: parsed.month - 1 });
    setSelectedDateIso(iso);
  };

  const handleSelectDate = (iso: string) => {
    const parsed = parseIsoDate(iso);
    if (!parsed) return;
    setSelectedDateIso(iso);
    if (parsed.year !== calendarMonth.year || parsed.month - 1 !== calendarMonth.monthIndex) {
      setCalendarMonth({ year: parsed.year, monthIndex: parsed.month - 1 });
    }
  };

  const handleJumpToMilestone = (iso: string) => {
    handleJumpToDate(iso);
    const calendarEl = document.getElementById('calendar');
    calendarEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasAnySavedData = Boolean(lmpInput) || hasAnyWeightData(weightState);

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBFA] text-[#2E2428] dark:bg-[#171215] dark:text-[#F5ECEF] transition-colors duration-150">
      <Header
        theme={theme}
        hasSummary={summary !== null}
        onToggleTheme={handleToggleTheme}
        onFocusLmpInput={handleFocusLmpInput}
      />

      <main className="flex-1">
        <HeroOverview
          lmpInput={lmpInput}
          todayIso={todayIso}
          summary={summary}
          validationError={validationError}
          hasAnySavedData={hasAnySavedData}
          inputRef={lmpInputRef}
          onLmpChange={handleLmpChange}
          onClearLmp={handleClearLmp}
          onResetAllData={handleResetAllData}
        />

        {summary && (
          <>
            <FetalDevelopment3D summary={summary} />

            <ProgressTracker summary={summary} />

            <PregnancyCalendar
              year={calendarMonth.year}
              monthIndex={calendarMonth.monthIndex}
              summary={summary}
              todayIso={todayIso}
              selectedDateIso={selectedDateIso}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onJumpToDate={handleJumpToDate}
              onSelectDate={handleSelectDate}
            />

            <WeightTracker
              summary={summary}
              todayIso={todayIso}
              weightState={weightState}
              onChangeUnit={handleChangeWeightUnit}
              onUpdateProfile={handleUpdateWeightProfile}
              onAddEntry={handleAddWeightEntry}
              onDeleteEntry={handleDeleteWeightEntry}
              onClearAllEntries={handleClearWeightEntries}
            />

            <NutritionCareGuide summary={summary} />

            <MilestonesSection
              summary={summary}
              onJumpToMilestone={handleJumpToMilestone}
            />
          </>
        )}
      </main>

      <footer className="border-t border-[#EADFE2] dark:border-[#34282E] bg-[#FAF5F6] dark:bg-[#1B1519] transition-colors duration-150">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6B5B61] dark:text-[#C3B3B9]">
          <span className="inline-flex items-center gap-2 font-serif text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF]">
            <img
              src={resolveAssetUrl(SITE_ICON_PATH)}
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-contain bg-white p-0.5 border border-[#EADFE2] dark:border-[#4A3842] shrink-0"
            />
            <span>BloomWeeks</span>
          </span>
          <p className="max-w-2xl leading-relaxed">
            Calculations follow Naegele’s 280-day rule from your LMP date and are for personal
            tracking only. Please consult your OB-GYN or midwife for clinical dating and prenatal
            care.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
