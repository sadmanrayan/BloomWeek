import React, { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import {
  PregnancySummary,
  formatShortDate,
} from '../utils/pregnancy';
import {
  MAX_RECENT_WEIGHT_LOGS,
  StoredWeightState,
  WeightEntry,
  WeightUnit,
  buildWeightTrajectoryPoints,
  cmToFeetInches,
  displayWeightNumber,
  evaluateWeightGainStatus,
  formatGainRange,
  formatHeightFeetInches,
  formatWeight,
  formatWeightDelta,
  getBmiGuideline,
  getEntryGestationalWeekFloat,
  getEntryWeekShortLabel,
  getExpectedGainRangeForWeek,
  getLatestWeightEntries,
  sortWeightEntriesAsc,
  validateBaselineProfileFeetInches,
  validateWeightInput,
} from '../utils/weight';

interface WeightTrackerProps {
  summary: PregnancySummary;
  todayIso: string;
  weightState: StoredWeightState;
  onChangeUnit: (unit: WeightUnit) => void;
  onUpdateProfile: (prePregnancyWeightKg: number | null, heightCm: number | null) => void;
  onAddEntry: (entry: WeightEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAllEntries: () => void;
}

const CHART_W = 640;
const CHART_H = 296;
const PAD = { top: 22, right: 20, bottom: 38, left: 54 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

export const WeightTracker: React.FC<WeightTrackerProps> = ({
  summary,
  todayIso,
  weightState,
  onChangeUnit,
  onUpdateProfile,
  onAddEntry,
  onDeleteEntry,
  onClearAllEntries,
}) => {
  const { profile, entries } = weightState;
  const unit = profile.unit;

  // Always-visible Pre-Pregnancy Baseline form state (Weight & Height in ft/in)
  const [baselineWeightInput, setBaselineWeightInput] = useState<string>(() =>
    profile.prePregnancyWeightKg !== null
      ? String(displayWeightNumber(profile.prePregnancyWeightKg, unit))
      : ''
  );
  const [baselineFeetInput, setBaselineFeetInput] = useState<string>(() =>
    profile.heightCm !== null ? String(cmToFeetInches(profile.heightCm).feet) : ''
  );
  const [baselineInchesInput, setBaselineInchesInput] = useState<string>(() =>
    profile.heightCm !== null ? String(cmToFeetInches(profile.heightCm).inches) : ''
  );
  const [baselineError, setBaselineError] = useState<string | null>(null);
  const [baselineSavedNotice, setBaselineSavedNotice] = useState<boolean>(false);

  // Pregnancy Weigh-In log form state
  const [entryDate, setEntryDate] = useState<string>(todayIso);
  const [entryWeight, setEntryWeight] = useState<string>('');
  const [entryNote, setEntryNote] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Selected/hovered point on trajectory chart
  const [activePointId, setActivePointId] = useState<string | null>(null);

  // Keep baseline inputs synced when unit switches or sample data loads
  useEffect(() => {
    setBaselineWeightInput(
      profile.prePregnancyWeightKg !== null
        ? String(displayWeightNumber(profile.prePregnancyWeightKg, unit))
        : ''
    );
    if (profile.heightCm !== null) {
      const { feet, inches } = cmToFeetInches(profile.heightCm);
      setBaselineFeetInput(String(feet));
      setBaselineInchesInput(String(inches));
    } else {
      setBaselineFeetInput('');
      setBaselineInchesInput('');
    }
    setBaselineError(null);
  }, [profile.prePregnancyWeightKg, profile.heightCm, unit]);

  const sortedEntries = useMemo(() => sortWeightEntriesAsc(entries), [entries]);
  const latestEntry = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1] : null;
  const recentFiveEntries = useMemo(
    () => getLatestWeightEntries(entries, MAX_RECENT_WEIGHT_LOGS),
    [entries]
  );

  const { bmi, guideline, isEstimated } = useMemo(
    () => getBmiGuideline(profile.prePregnancyWeightKg, profile.heightCm),
    [profile.prePregnancyWeightKg, profile.heightCm]
  );

  const referenceWeek = useMemo(() => {
    if (latestEntry) {
      const w = getEntryGestationalWeekFloat(summary.lmpIso, latestEntry.dateIso);
      if (w !== null) return Math.min(40, Math.max(0, w));
    }
    return Math.min(40, Math.max(0, summary.diffDays / 7));
  }, [latestEntry, summary.lmpIso, summary.diffDays]);

  const gainEvaluation = useMemo(
    () =>
      evaluateWeightGainStatus(
        profile.prePregnancyWeightKg,
        latestEntry ? latestEntry.weightKg : null,
        referenceWeek,
        guideline.category
      ),
    [profile.prePregnancyWeightKg, latestEntry, referenceWeek, guideline.category]
  );

  // Build graphical trajectory series (Pre-Pregnancy Baseline -> Logged Pregnancy Weigh-Ins + IOM Band)
  const chartData = useMemo(() => {
    const rawPoints = buildWeightTrajectoryPoints(
      summary.lmpIso,
      profile.prePregnancyWeightKg,
      sortedEntries
    );

    const plottedPoints = rawPoints.map((pt) => ({
      ...pt,
      displayVal: displayWeightNumber(pt.weightKg, unit),
      expectedRangeKg: getExpectedGainRangeForWeek(pt.week, guideline.category),
    }));

    const corridorWeeks = [0, 4, 8, 13, 18, 22, 27, 32, 36, 40];
    const corridorBand =
      profile.prePregnancyWeightKg !== null
        ? corridorWeeks.map((week) => {
            const range = getExpectedGainRangeForWeek(week, guideline.category);
            return {
              week,
              minVal: displayWeightNumber(profile.prePregnancyWeightKg! + range.minKg, unit),
              maxVal: displayWeightNumber(profile.prePregnancyWeightKg! + range.maxKg, unit),
            };
          })
        : [];

    const allValues: number[] = [];
    for (const pt of plottedPoints) allValues.push(pt.displayVal);
    for (const band of corridorBand) {
      allValues.push(band.minVal, band.maxVal);
    }

    const fallbackMin = unit === 'lb' ? 115 : 52;
    const fallbackMax = unit === 'lb' ? 165 : 75;
    const rawMin = allValues.length > 0 ? Math.min(...allValues) : fallbackMin;
    const rawMax = allValues.length > 0 ? Math.max(...allValues) : fallbackMax;
    const padSpan = Math.max(unit === 'lb' ? 5 : 2.5, (rawMax - rawMin) * 0.14);
    const yMin = Math.floor(rawMin - padSpan);
    const yMax = Math.ceil(rawMax + padSpan);
    const ySpan = Math.max(1, yMax - yMin);

    const xScale = (week: number) => PAD.left + (Math.min(40, Math.max(0, week)) / 40) * PLOT_W;
    const yScale = (val: number) => PAD.top + PLOT_H - ((val - yMin) / ySpan) * PLOT_H;

    const yTicks: number[] = [];
    const tickCount = 4;
    for (let i = 0; i <= tickCount; i++) {
      yTicks.push(Number((yMin + (ySpan * i) / tickCount).toFixed(1)));
    }

    const corridorPolygonPoints =
      corridorBand.length > 0
        ? [
            ...corridorBand.map(
              (b) => `${xScale(b.week).toFixed(1)},${yScale(b.maxVal).toFixed(1)}`
            ),
            ...[...corridorBand]
              .reverse()
              .map((b) => `${xScale(b.week).toFixed(1)},${yScale(b.minVal).toFixed(1)}`),
          ].join(' ')
        : '';

    const upperBoundPath =
      corridorBand.length > 0
        ? corridorBand
            .map(
              (b, i) =>
                `${i === 0 ? 'M' : 'L'} ${xScale(b.week).toFixed(1)} ${yScale(b.maxVal).toFixed(1)}`
            )
            .join(' ')
        : '';

    const lowerBoundPath =
      corridorBand.length > 0
        ? corridorBand
            .map(
              (b, i) =>
                `${i === 0 ? 'M' : 'L'} ${xScale(b.week).toFixed(1)} ${yScale(b.minVal).toFixed(1)}`
            )
            .join(' ')
        : '';

    const linePath =
      plottedPoints.length > 1
        ? plottedPoints
            .map(
              (pt, i) =>
                `${i === 0 ? 'M' : 'L'} ${xScale(pt.week).toFixed(1)} ${yScale(pt.displayVal).toFixed(1)}`
            )
            .join(' ')
        : '';

    const currentWeekFloat = Math.min(40, Math.max(0, summary.diffDays / 7));

    return {
      plottedPoints,
      yTicks,
      xScale,
      yScale,
      corridorPolygonPoints,
      upperBoundPath,
      lowerBoundPath,
      linePath,
      currentWeekX: xScale(currentWeekFloat),
      hasCorridor: corridorBand.length > 0,
    };
  }, [
    sortedEntries,
    summary.lmpIso,
    summary.diffDays,
    profile.prePregnancyWeightKg,
    guideline.category,
    unit,
  ]);

  const activePoint = useMemo(() => {
    if (!activePointId) return null;
    return chartData.plottedPoints.find((p) => p.id === activePointId) ?? null;
  }, [activePointId, chartData.plottedPoints]);

  const handleBaselineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateBaselineProfileFeetInches(
      baselineWeightInput,
      baselineFeetInput,
      baselineInchesInput,
      unit
    );
    if (!result.valid) {
      setBaselineError(result.error);
      setBaselineSavedNotice(false);
      return;
    }
    onUpdateProfile(result.weightKg, result.heightCm);
    setBaselineError(null);
    setBaselineSavedNotice(true);
    window.setTimeout(() => setBaselineSavedNotice(false), 2400);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateWeightInput(entryWeight, unit, entryDate, todayIso);
    if (!validation.valid || validation.weightKg === null) {
      setFormError(validation.error);
      return;
    }

    const trimmedNote = entryNote.trim();
    const newEntry: WeightEntry = {
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dateIso: entryDate,
      weightKg: validation.weightKg,
      note: trimmedNote ? trimmedNote.slice(0, 80) : undefined,
    };

    onAddEntry(newEntry);
    setEntryWeight('');
    setEntryNote('');
    setFormError(null);
    setActivePointId(newEntry.id);
  };

  const statusTextColor =
    gainEvaluation.status === 'within'
      ? 'text-[#3C6652] dark:text-[#86C5A7]'
      : gainEvaluation.status === 'below' || gainEvaluation.status === 'above'
        ? 'text-[#9A5B25] dark:text-[#F0BE82]'
        : 'text-[#7D6B72] dark:text-[#A8959C]';

  return (
    <section
      id="weight"
      aria-labelledby="weight-heading"
      className="scroll-mt-20 pb-8 sm:pb-10"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#211A1E] border border-[#EADFE2] dark:border-[#362A30] rounded-2xl p-6 sm:p-8 transition-colors duration-150">
          {/* Header Row & Unit Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#8C5B6A] dark:text-[#D68FA6]">
                Maternal Health Log · IOM Singleton Guideline Curve
              </p>
              <h2
                id="weight-heading"
                className="mt-1 font-serif text-2xl sm:text-3xl font-medium text-[#2E2428] dark:text-[#F5ECEF] tracking-tight"
              >
                Pregnancy Weight Tracker
              </h2>
            </div>

            {/* Segmented Unit Switch (kg / lb) */}
            <div
              role="group"
              aria-label="Weight unit"
              className="inline-flex items-center p-0.5 rounded-lg bg-[#F5ECEF] dark:bg-[#2B2227] border border-[#E5D5DA] dark:border-[#3E3037] self-start sm:self-end"
            >
              <button
                type="button"
                data-testid="unit-kg-btn"
                aria-pressed={unit === 'kg'}
                onClick={() => onChangeUnit('kg')}
                className={`h-8 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  unit === 'kg'
                    ? 'bg-white dark:bg-[#3D2F36] text-[#2E2428] dark:text-[#F5ECEF] shadow-xs'
                    : 'text-[#6B5B61] dark:text-[#B9A8AF] hover:text-[#2E2428] dark:hover:text-[#F5ECEF]'
                }`}
              >
                kg
              </button>
              <button
                type="button"
                data-testid="unit-lb-btn"
                aria-pressed={unit === 'lb'}
                onClick={() => onChangeUnit('lb')}
                className={`h-8 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  unit === 'lb'
                    ? 'bg-white dark:bg-[#3D2F36] text-[#2E2428] dark:text-[#F5ECEF] shadow-xs'
                    : 'text-[#6B5B61] dark:text-[#B9A8AF] hover:text-[#2E2428] dark:hover:text-[#F5ECEF]'
                }`}
              >
                lb
              </button>
            </div>
          </div>

          {/* Step 1: Always-Visible Pre-Pregnancy Weight & Height Setup */}
          <form
            data-testid="pre-pregnancy-baseline-form"
            onSubmit={handleBaselineSubmit}
            className="mt-6 pt-5 border-t border-[#F0E6E9] dark:border-[#33272D]"
            noValidate
          >
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
                <div>
                  <label
                    htmlFor="baseline-weight-input"
                    className="block text-xs font-semibold text-[#2E2428] dark:text-[#F5ECEF] mb-1.5"
                  >
                    Pre-Pregnancy Weight ({unit})
                  </label>
                  <input
                    id="baseline-weight-input"
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    placeholder={unit === 'kg' ? 'e.g. 58.0' : 'e.g. 128.0'}
                    value={baselineWeightInput}
                    onChange={(e) => {
                      setBaselineWeightInput(e.target.value);
                      if (baselineError) setBaselineError(null);
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#DCCBD0] dark:border-[#43343B] bg-[#FDFBFA] dark:bg-[#181316] text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] tabular-nums focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                  />
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#2E2428] dark:text-[#F5ECEF] mb-1.5">
                    Height (ft &amp; in)
                  </span>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative">
                      <input
                        id="baseline-height-feet-input"
                        type="number"
                        min={3}
                        max={7}
                        step={1}
                        inputMode="numeric"
                        aria-label="Height in feet"
                        placeholder="5"
                        value={baselineFeetInput}
                        onChange={(e) => {
                          setBaselineFeetInput(e.target.value);
                          if (baselineError) setBaselineError(null);
                        }}
                        className="w-full h-10 pl-3 pr-9 rounded-lg border border-[#DCCBD0] dark:border-[#43343B] bg-[#FDFBFA] dark:bg-[#181316] text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] tabular-nums focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]"
                      >
                        ft
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        id="baseline-height-inches-input"
                        type="number"
                        min={0}
                        max={11}
                        step={1}
                        inputMode="numeric"
                        aria-label="Height in inches"
                        placeholder="4"
                        value={baselineInchesInput}
                        onChange={(e) => {
                          setBaselineInchesInput(e.target.value);
                          if (baselineError) setBaselineError(null);
                        }}
                        className="w-full h-10 pl-3 pr-9 rounded-lg border border-[#DCCBD0] dark:border-[#43343B] bg-[#FDFBFA] dark:bg-[#181316] text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] tabular-nums focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]"
                      >
                        in
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="submit"
                  className="h-10 px-4 rounded-lg border border-[#D9BDC7] dark:border-[#4F3C46] bg-[#F8EEF1] hover:bg-[#EFE0E5] dark:bg-[#312329] dark:hover:bg-[#3E2C34] text-xs font-semibold text-[#7A3148] dark:text-[#F4B6CA] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                >
                  {baselineSavedNotice && (
                    <Check className="w-3.5 h-3.5 text-[#3C6652] dark:text-[#86C5A7]" aria-hidden="true" />
                  )}
                  {baselineSavedNotice ? 'Baseline Updated' : 'Update Baseline'}
                </button>
                <p className="text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                  {bmi !== null
                    ? `Pre-pregnancy BMI ${bmi.toFixed(1)} · ${guideline.label}`
                    : 'Enter weight & height to calculate BMI target'}
                </p>
              </div>
            </div>

            {baselineError && (
              <p
                id="baseline-form-error"
                role="alert"
                className="mt-2 text-xs font-medium text-[#A62E3C] dark:text-[#F2919D]"
              >
                {baselineError}
              </p>
            )}
          </form>

          {/* 4-Column Flat Metrics Strip (Starting Weight, Latest Weight, Total Change, IOM Target) */}
          <div className="mt-6 pt-6 border-t border-[#F0E6E9] dark:border-[#33272D] grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6">
            <div>
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                Starting Weight
              </p>
              <p
                data-testid="starting-weight-display"
                className="mt-1 text-2xl font-semibold text-[#2E2428] dark:text-[#F5ECEF] tabular-nums"
              >
                {profile.prePregnancyWeightKg !== null
                  ? formatWeight(profile.prePregnancyWeightKg, unit)
                  : 'Not set'}
              </p>
              <p
                data-testid="starting-height-display"
                className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums"
              >
                {profile.heightCm !== null
                  ? `Height ${formatHeightFeetInches(profile.heightCm)} · ${bmi !== null ? `BMI ${bmi.toFixed(1)}` : 'Baseline'}`
                  : 'Before pregnancy'}
              </p>
            </div>

            <div className="lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-6">
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                Latest Weight
              </p>
              <p
                data-testid="latest-weight-display"
                className="mt-1 text-2xl font-semibold text-[#A84A67] dark:text-[#E892AD] tabular-nums"
              >
                {latestEntry ? formatWeight(latestEntry.weightKg, unit) : '—'}
              </p>
              <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                {latestEntry
                  ? `${formatShortDate(latestEntry.dateIso)} · ${getEntryWeekShortLabel(summary.lmpIso, latestEntry.dateIso)}`
                  : 'Log a weigh-in to begin'}
              </p>
            </div>

            <div className="lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-6">
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                Total Change
              </p>
              <p
                data-testid="weight-change-display"
                className="mt-1 text-2xl font-semibold text-[#2E2428] dark:text-[#F5ECEF] tabular-nums"
              >
                {gainEvaluation.deltaKg !== null
                  ? formatWeightDelta(gainEvaluation.deltaKg, unit)
                  : '—'}
              </p>
              <p className={`mt-1 text-xs font-medium ${statusTextColor}`}>
                {gainEvaluation.label}
              </p>
            </div>

            <div className="lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-6">
              <p className="text-xs font-medium text-[#7D6B72] dark:text-[#A8959C]">
                IOM Healthy Gain (40w)
              </p>
              <p
                data-testid="iom-target-gain-display"
                className="mt-1 text-2xl font-semibold text-[#3C6652] dark:text-[#86C5A7] tabular-nums"
              >
                {formatGainRange(
                  { minKg: guideline.totalMinKg, maxKg: guideline.totalMaxKg },
                  unit
                )}
              </p>
              <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums">
                {isEstimated
                  ? 'Normal-BMI reference · Singleton'
                  : `${guideline.bmiRangeLabel} · Singleton`}
              </p>
            </div>
          </div>

          {/* Main 2-Column Workspace: Trajectory Graph (Left) + Weigh-In Form & Latest 5 Logs (Right) */}
          <div className="mt-7 pt-7 border-t border-[#F0E6E9] dark:border-[#33272D] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Graphical Weight Curve vs. IOM Healthy Gain Band */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                  Weight Progress vs. IOM Healthy Gain Band
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9]">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="inline-block w-3 h-0.5 bg-[#A84A67] dark:bg-[#E892AD]"
                    />
                    Your weight curve
                  </span>
                  {chartData.hasCorridor && (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="inline-block w-3 h-2.5 rounded-[2px] bg-[#3C6652]/20 dark:bg-[#86C5A7]/25 border border-[#3C6652]/40 dark:border-[#86C5A7]/40"
                      />
                      IOM healthy band
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full">
                <svg
                  data-testid="weight-chart-svg"
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  role="img"
                  aria-label="Pregnancy weight graph comparing your pre-pregnancy baseline and logged weigh-ins against the IOM singleton healthy gain band from pre-pregnancy through week 40"
                  className="w-full h-auto select-none"
                >
                  {/* Horizontal Gridlines & Y-Axis Labels */}
                  {chartData.yTicks.map((tick) => {
                    const y = chartData.yScale(tick);
                    return (
                      <g key={tick}>
                        <line
                          x1={PAD.left}
                          y1={y}
                          x2={CHART_W - PAD.right}
                          y2={y}
                          className="stroke-[#EFE4E8] dark:stroke-[#33272D]"
                          strokeWidth="1"
                        />
                        <text
                          x={PAD.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-[#7D6B72] dark:fill-[#A8959C] text-[11px] tabular-nums"
                        >
                          {tick.toFixed(0)} {unit}
                        </text>
                      </g>
                    );
                  })}

                  {/* X-Axis Week Labels */}
                  {[0, 8, 13, 20, 27, 34, 40].map((w) => {
                    const x = chartData.xScale(w);
                    return (
                      <g key={w}>
                        <line
                          x1={x}
                          y1={PAD.top}
                          x2={x}
                          y2={PAD.top + PLOT_H}
                          className="stroke-[#F5ECEF] dark:stroke-[#2A2025]"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={CHART_H - 12}
                          textAnchor="middle"
                          className="fill-[#7D6B72] dark:fill-[#A8959C] text-[11px] tabular-nums"
                        >
                          {w === 0 ? 'Pre-Preg' : `W${w}`}
                        </text>
                      </g>
                    );
                  })}

                  {/* IOM Healthy Gain Band */}
                  {chartData.hasCorridor && (
                    <>
                      <polygon
                        points={chartData.corridorPolygonPoints}
                        className="fill-[#3C6652]/14 dark:fill-[#86C5A7]/18"
                      />
                      <path
                        d={chartData.upperBoundPath}
                        fill="none"
                        className="stroke-[#3C6652]/50 dark:stroke-[#86C5A7]/55"
                        strokeWidth="1.25"
                        strokeDasharray="4 4"
                      />
                      <path
                        d={chartData.lowerBoundPath}
                        fill="none"
                        className="stroke-[#3C6652]/50 dark:stroke-[#86C5A7]/55"
                        strokeWidth="1.25"
                        strokeDasharray="4 4"
                      />
                    </>
                  )}

                  {/* Current Gestational Week Vertical Marker */}
                  <line
                    x1={chartData.currentWeekX}
                    y1={PAD.top}
                    x2={chartData.currentWeekX}
                    y2={PAD.top + PLOT_H}
                    className="stroke-[#A84A67]/45 dark:stroke-[#E892AD]/45"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={Math.min(
                      CHART_W - PAD.right - 26,
                      Math.max(PAD.left + 28, chartData.currentWeekX)
                    )}
                    y={PAD.top - 6}
                    textAnchor="middle"
                    className="fill-[#A84A67] dark:fill-[#E892AD] text-[10px] font-semibold tabular-nums"
                  >
                    Now · W{summary.currentWeek}
                  </text>

                  {/* User's Weight Trajectory Line (starting from Pre-Pregnancy Baseline) */}
                  {chartData.linePath && (
                    <path
                      d={chartData.linePath}
                      fill="none"
                      className="stroke-[#A84A67] dark:stroke-[#E892AD]"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {chartData.plottedPoints.map((pt) => {
                    const cx = chartData.xScale(pt.week);
                    const cy = chartData.yScale(pt.displayVal);
                    const isSelected = activePointId === pt.id;

                    return (
                      <g
                        key={pt.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setActivePointId(pt.id)}
                        onClick={() => setActivePointId(pt.id)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 7 : pt.isBaselineAnchor ? 5.5 : 5}
                          className={
                            pt.isBaselineAnchor
                              ? 'fill-[#3C6652] dark:fill-[#86C5A7] stroke-white dark:stroke-[#211A1E]'
                              : 'fill-white dark:fill-[#211A1E] stroke-[#A84A67] dark:stroke-[#E892AD]'
                          }
                          strokeWidth={isSelected ? 3 : 2.25}
                        />
                        <title>
                          {pt.isBaselineAnchor
                            ? `Pre-pregnancy baseline: ${formatWeight(pt.weightKg, unit)}`
                            : `${formatShortDate(pt.dateIso)} (${pt.weekLabel}): ${formatWeight(pt.weightKg, unit)}`}
                        </title>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Active Point Readout & IOM Expected Target Comparison */}
              <div className="mt-3 pt-3 border-t border-[#F3EAED] dark:border-[#30242A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6B5B61] dark:text-[#C3B3B9]">
                {activePoint ? (
                  <p className="tabular-nums">
                    <strong className="text-[#2E2428] dark:text-[#F5ECEF]">
                      {activePoint.isBaselineAnchor
                        ? 'Pre-Pregnancy Baseline'
                        : `${formatShortDate(activePoint.dateIso)} · ${activePoint.weekLabel}`}
                    </strong>{' '}
                    ·{' '}
                    <strong className="text-[#A84A67] dark:text-[#E892AD]">
                      {formatWeight(activePoint.weightKg, unit)}
                    </strong>
                    {profile.prePregnancyWeightKg !== null && !activePoint.isBaselineAnchor && (
                      <>
                        {' '}
                        (IOM target:{' '}
                        {formatGainRange(
                          {
                            minKg: profile.prePregnancyWeightKg + activePoint.expectedRangeKg.minKg,
                            maxKg: profile.prePregnancyWeightKg + activePoint.expectedRangeKg.maxKg,
                          },
                          unit
                        )}
                        )
                      </>
                    )}
                  </p>
                ) : (
                  <p>
                    Hover or click any point on the graph to compare your measured weight with the
                    IOM target range for that week.
                  </p>
                )}
                <p className="text-[#7D6B72] dark:text-[#9D8B92] tabular-nums shrink-0">
                  IOM gain at{' '}
                  {latestEntry
                    ? getEntryWeekShortLabel(summary.lmpIso, latestEntry.dateIso)
                    : `W${summary.currentWeek} D${summary.currentDay}`}
                  : {formatGainRange(gainEvaluation.expectedRangeKg, unit)}
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Log Pregnancy Weigh-In Form + Latest 5 Log History */}
            <div className="lg:col-span-5 lg:border-l lg:border-[#F0E6E9] dark:lg:border-[#33272D] lg:pl-8">
              <h3 className="text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                Log a Pregnancy Weigh-In
              </h3>

              <form onSubmit={handleAddSubmit} className="mt-3 space-y-3" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="weight-entry-date"
                      className="block text-xs font-medium text-[#6B5B61] dark:text-[#C3B3B9] mb-1"
                    >
                      Weigh-In Date
                    </label>
                    <input
                      id="weight-entry-date"
                      type="date"
                      max={todayIso}
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCCBD0] dark:border-[#43343B] bg-[#FDFBFA] dark:bg-[#181316] dark:[color-scheme:dark] text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] tabular-nums focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="weight-entry-value"
                      className="block text-xs font-medium text-[#6B5B61] dark:text-[#C3B3B9] mb-1"
                    >
                      Measured Weight ({unit})
                    </label>
                    <input
                      id="weight-entry-value"
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      placeholder={unit === 'kg' ? 'e.g. 61.4' : 'e.g. 135.4'}
                      value={entryWeight}
                      onChange={(e) => {
                        setEntryWeight(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      aria-invalid={formError !== null}
                      aria-describedby={formError ? 'weight-form-error' : undefined}
                      className={`w-full h-10 px-3 rounded-lg border bg-[#FDFBFA] dark:bg-[#181316] text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF] tabular-nums focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6] ${
                        formError
                          ? 'border-[#B83B4A] dark:border-[#E06C7A]'
                          : 'border-[#DCCBD0] dark:border-[#43343B]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="weight-entry-note"
                    className="block text-xs font-medium text-[#6B5B61] dark:text-[#C3B3B9] mb-1"
                  >
                    Note (optional)
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      id="weight-entry-note"
                      type="text"
                      maxLength={80}
                      placeholder="e.g. Morning checkup"
                      value={entryNote}
                      onChange={(e) => setEntryNote(e.target.value)}
                      className="w-full sm:flex-1 min-w-0 h-10 px-3 rounded-lg border border-[#DCCBD0] dark:border-[#43343B] bg-[#FDFBFA] dark:bg-[#181316] text-sm text-[#2E2428] dark:text-[#F5ECEF] placeholder:text-[#9A8A90] dark:placeholder:text-[#7D6C73] focus-visible:outline-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-lg bg-[#A84A67] hover:bg-[#8F3B55] dark:bg-[#B34F6F] dark:hover:bg-[#C45D7E] text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A84A67] dark:focus-visible:outline-[#E58AA6]"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      Add Weigh-In
                    </button>
                  </div>
                </div>

                {formError && (
                  <p
                    id="weight-form-error"
                    role="alert"
                    className="text-xs font-medium text-[#A62E3C] dark:text-[#F2919D]"
                  >
                    {formError}
                  </p>
                )}
              </form>

              {/* Latest 5 Weigh-In Log History */}
              <div className="mt-6 pt-5 border-t border-[#F0E6E9] dark:border-[#33272D]">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <h4
                    data-testid="weight-history-heading"
                    className="text-xs font-semibold text-[#6B5B61] dark:text-[#C3B3B9] tabular-nums"
                  >
                    Latest 5 Logs
                    {sortedEntries.length > 0
                      ? ` · ${recentFiveEntries.length}${sortedEntries.length > MAX_RECENT_WEIGHT_LOGS ? ` of ${sortedEntries.length}` : ''}`
                      : ''}
                  </h4>
                  {sortedEntries.length > 0 ? (
                    <button
                      type="button"
                      onClick={onClearAllEntries}
                      className="text-xs font-medium text-[#7D6B72] hover:text-[#A62E3C] dark:text-[#A8959C] dark:hover:text-[#F2919D] transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>

                {recentFiveEntries.length > 0 ? (
                  <>
                    <ul
                      data-testid="weight-history-list"
                      className="divide-y divide-[#F3EAED] dark:divide-[#30242A]"
                    >
                      {recentFiveEntries.map((entry) => {
                        const delta =
                          profile.prePregnancyWeightKg !== null
                            ? entry.weightKg - profile.prePregnancyWeightKg
                            : null;
                        const formattedDate = formatShortDate(entry.dateIso);
                        const weekLabel = getEntryWeekShortLabel(summary.lmpIso, entry.dateIso);

                        return (
                          <li
                            key={entry.id}
                            className="py-2.5 flex items-center justify-between gap-3 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#7D6B72] dark:text-[#A8959C] tabular-nums">
                                <span className="font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                                  {formattedDate}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{weekLabel}</span>
                              </div>
                              {entry.note && (
                                <p className="mt-0.5 text-xs text-[#6B5B61] dark:text-[#C3B3B9] truncate">
                                  {entry.note}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right tabular-nums">
                                <p className="text-sm font-semibold text-[#2E2428] dark:text-[#F5ECEF]">
                                  {formatWeight(entry.weightKg, unit)}
                                </p>
                                {delta !== null && (
                                  <p className="text-[11px] text-[#7D6B72] dark:text-[#A8959C]">
                                    {formatWeightDelta(delta, unit)}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => onDeleteEntry(entry.id)}
                                aria-label={`Delete weigh-in on ${formattedDate}`}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[#8C7B82] hover:text-[#A62E3C] hover:bg-[#FCF2F4] dark:text-[#A8959C] dark:hover:text-[#F2919D] dark:hover:bg-[#321E23] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A84A67]"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {sortedEntries.length > MAX_RECENT_WEIGHT_LOGS && (
                      <p className="mt-2.5 text-[11px] text-[#7D6B72] dark:text-[#9D8B92] tabular-nums">
                        Showing your 5 most recent weigh-ins. All {sortedEntries.length} logged
                        entries remain plotted on the graph.
                      </p>
                    )}
                  </>
                ) : (
                  <div data-testid="weight-empty-state" className="py-6 text-center">
                    <p className="text-sm font-medium text-[#2E2428] dark:text-[#F5ECEF]">
                      No weigh-ins logged yet
                    </p>
                    <p className="mt-1 text-xs text-[#6B5B61] dark:text-[#C3B3B9] max-w-xs mx-auto leading-relaxed">
                      Set your pre-pregnancy weight &amp; height above, then log a weigh-in with
                      the date you measured to plot your curve against the IOM healthy gain band.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="mt-6 pt-4 border-t border-[#F3EAED] dark:border-[#30242A] text-xs text-[#7D6B72] dark:text-[#9D8B92] leading-relaxed">
            Healthy gain bands reflect general Institute of Medicine (IOM) singleton pregnancy
            guidelines based on pre-pregnancy BMI. Every pregnancy is unique—review personal weight
            targets with your OB-GYN or midwife, especially for twins or medical conditions.
          </p>
        </div>
      </div>
    </section>
  );
};
