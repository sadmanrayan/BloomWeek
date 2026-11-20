export interface FetalAnatomyMorph {
  /** Overall visual scale normalized inside the 3D framing camera (0.52..1.18) */
  displayScale: number;
  /** Head radius relative to torso length (larger in early embryo, smaller at term) */
  headScale: number;
  /** Torso length/plumpness progression (0..1) */
  torsoMaturity: number;
  /** Limb bud to full-length limb progression (0..1) */
  limbGrowth: number;
  /** Hand/foot digit separation (0 = paddle bud, 1 = distinct fingers & toes) */
  digitSeparation: number;
  /** Early embryonic tail bud presence (peaks W5-6, gone by W10) */
  tailBudFactor: number;
  /** Translucent subsurface glow strength (high in W6-13 like reference, softer by term) */
  skinTranslucency: number;
  /** Subtle dorsal spine somite ridges visibility (visible W6-13, fades as skin thickens) */
  spineSomiteVisibility: number;
  /** Eye frontward migration (0 = lateral embryonic eyes, 1 = forward-facing) */
  eyeMigration: number;
  /** Eyelid closure (0 = early open dark optic eye W6-10, 1 = fused closed W11-26, 0.25 = softly blinking W28-40) */
  eyelidClosure: number;
  /** Facial refinement (nose bridge, lips, rounded cheeks, ears) (0..1) */
  facialMaturity: number;
  /** Fetal C-curve curl amount (0..1) */
  fetalCurl: number;
  /** Spontaneous movement amplitude (0..1) */
  motionActivity: number;
}

export interface FetalDayMetrics {
  dayNumber: number; // 1..280 (LMP = Day 1 -> Week 1, Day 1)
  week: number; // 1..40
  dayOfWeek: number; // 1..7
  trimester: 1 | 2 | 3;
  trimesterLabel: string;
  stageName: string;
  lengthMm: number;
  lengthLabel: string;
  lengthMeasureType: 'Crown-to-Rump (CRL)' | 'Crown-to-Heel';
  weightGrams: number;
  weightLabel: string;
  heartRateBpm: number | null;
  headline: string;
  dailyFocus: string;
  developingSystems: string[];
  anatomy: FetalAnatomyMorph;
}

export const MIN_PREGNANCY_DAY = 1;
export const MAX_PREGNANCY_DAY = 280;
/** Week 9, Day 1 (Day 57) — luminous early fetal stage matching classic 3D translucent view */
export const DEFAULT_EXPLORE_DAY = 57;

interface WeeklyAnchor {
  week: number;
  lengthMm: number;
  weightGrams: number;
  heartRateBpm: number | null;
  stageName: string;
  headline: string;
  dailyFocus: string;
  systems: string[];
}

const WEEKLY_ANCHORS: WeeklyAnchor[] = [
  {
    week: 1,
    lengthMm: 0.1,
    weightGrams: 0.001,
    heartRateBpm: null,
    stageName: 'Cycle Start',
    headline: 'Preparing the maternal environment',
    dailyFocus: 'Your body begins the cycle that will mature the egg and nourish early life.',
    systems: ['Follicle maturation', 'Uterine lining renewal'],
  },
  {
    week: 4,
    lengthMm: 1.0,
    weightGrams: 0.01,
    heartRateBpm: null,
    stageName: 'Implanting Embryo',
    headline: 'Tiny blastocyst settles into the uterine lining',
    dailyFocus: 'Rapid cell division forms the early embryonic disc, yolk sac, and amniotic cavity.',
    systems: ['Amniotic sac', 'Early placenta', 'Neural plate'],
  },
  {
    week: 5,
    lengthMm: 2.5,
    weightGrams: 0.05,
    heartRateBpm: 95,
    stageName: 'Early Embryo',
    headline: 'A C-shaped silhouette and first cardiac flicker',
    dailyFocus: 'The neural tube closes along the back while primitive cardiac cells begin pulsing.',
    systems: ['Early heart tube', 'Neural tube', 'Curved spine'],
  },
  {
    week: 6,
    lengthMm: 6.0,
    weightGrams: 0.15,
    heartRateBpm: 112,
    stageName: 'Early Embryo',
    headline: 'Optic eye spots and tiny limb buds emerge',
    dailyFocus: 'Dark pigment forms in the developing eyes while arm and leg paddles bud from the torso.',
    systems: ['Dark optic vesicles', 'Arm & leg buds', 'Rhythmic heartbeat'],
  },
  {
    week: 7,
    lengthMm: 11.0,
    weightGrams: 0.4,
    heartRateBpm: 138,
    stageName: 'Growing Embryo',
    headline: 'Brain hemispheres expand and hand paddles form',
    dailyFocus: 'Head growth accelerates dramatically as tiny arm buds lengthen into elbow and wrist zones.',
    systems: ['Forebrain growth', 'Hand paddles', 'Umbilical circulation'],
  },
  {
    week: 8,
    lengthMm: 16.5,
    weightGrams: 1.0,
    heartRateBpm: 160,
    stageName: 'Late Embryo',
    headline: 'Tiny webbed fingers and gentle spontaneous twitches',
    dailyFocus: 'Elbows bend forward, delicate notches mark future fingers and toes, and subtle motion starts.',
    systems: ['Notched fingers & toes', 'Spinal somites', 'First subtle movements'],
  },
  {
    week: 9,
    lengthMm: 23.0,
    weightGrams: 2.2,
    heartRateBpm: 170,
    stageName: 'Early Fetus',
    headline: 'Distinct tiny fingers, toes, and translucent skin',
    dailyFocus: 'The embryonic tail disappears while delicate hands, feet, ear ridges, and a glowing heart chamber take shape.',
    systems: ['Separated digits', '4-chamber heart', 'Outer ears & nose tip'],
  },
  {
    week: 10,
    lengthMm: 31.0,
    weightGrams: 4.5,
    heartRateBpm: 168,
    stageName: 'Early Fetus',
    headline: 'Vital organs in place and joints bending freely',
    dailyFocus: 'Translucent skin reveals delicate blood vessels while wrists, ankles, and knees flex gently.',
    systems: ['All vital organs formed', 'Active limb joints', 'Tooth buds'],
  },
  {
    week: 12,
    lengthMm: 54.0,
    weightGrams: 14.0,
    heartRateBpm: 160,
    stageName: 'First-Trimester Fetus',
    headline: 'Closed protective eyelids and curling finger reflexes',
    dailyFocus: 'Eyelids fuse softly over the eyes while baby practices opening and closing tiny fists.',
    systems: ['Reflex curling', 'Closed eyelids', 'Refined facial profile'],
  },
  {
    week: 14,
    lengthMm: 87.0,
    weightGrams: 43.0,
    heartRateBpm: 154,
    stageName: 'Second-Trimester Fetus',
    headline: 'Neck lengthens and subtle facial expressions begin',
    dailyFocus: 'Baby lifts the chin slightly off the chest, squints, and stretches arms and legs in amniotic fluid.',
    systems: ['Facial muscles', 'Longer limbs', 'Fine lanugo coat'],
  },
  {
    week: 16,
    lengthMm: 116.0,
    weightGrams: 100.0,
    heartRateBpm: 150,
    stageName: 'Growing Fetus',
    headline: 'Stronger legs, coordinated kicks, and erect head posture',
    dailyFocus: 'Lower limbs catch up to arm proportions and small bones continue calcifying smoothly.',
    systems: ['Skeletal hardening', 'Coordinated kicks', 'Ears in final position'],
  },
  {
    week: 20,
    lengthMm: 256.0,
    weightGrams: 300.0,
    heartRateBpm: 146,
    stageName: 'Mid-Pregnancy Fetus',
    headline: 'Halfway milestone with active stretches and hearing',
    dailyFocus: 'Skin thickens with protective vernix while baby responds to muffled heartbeat and voices.',
    systems: ['Hearing pathways', 'Vernix coating', 'Regular sleep-wake cycles'],
  },
  {
    week: 24,
    lengthMm: 300.0,
    weightGrams: 600.0,
    heartRateBpm: 144,
    stageName: 'Developing Fetus',
    headline: 'Defined face, eyelashes, and rhythmic breathing practice',
    dailyFocus: 'Lung air sacs branch rapidly as baby practices gentle chest movements and grasping.',
    systems: ['Lung alveoli branching', 'Inner ear balance', 'Defined lips & brows'],
  },
  {
    week: 28,
    lengthMm: 376.0,
    weightGrams: 1050.0,
    heartRateBpm: 142,
    stageName: 'Third-Trimester Baby',
    headline: 'Eyelids unseal to blink and dream sleep begins',
    dailyFocus: 'Subcutaneous baby fat begins softening cheeks and limbs as brain folds deepen.',
    systems: ['Blinking eyes', 'Rapid brain folding', 'Early baby fat'],
  },
  {
    week: 32,
    lengthMm: 424.0,
    weightGrams: 1750.0,
    heartRateBpm: 140,
    stageName: 'Growing Baby',
    headline: 'Plumper limbs, smoother skin, and cozy tucked posture',
    dailyFocus: 'Skin becomes opaque and rosy-peach as weight gain accelerates toward birth.',
    systems: ['Opaque rosy skin', 'Strong grip reflex', 'Practicing breathing'],
  },
  {
    week: 36,
    lengthMm: 474.0,
    weightGrams: 2650.0,
    heartRateBpm: 138,
    stageName: 'Late-Term Baby',
    headline: 'Chubby cheeks and snug head-down readiness',
    dailyFocus: 'Limbs tuck comfortably close to the chest while sucking muscles and lungs mature.',
    systems: ['Mature sucking reflex', 'Full rounded cheeks', 'Final lung surfactant'],
  },
  {
    week: 40,
    lengthMm: 512.0,
    weightGrams: 3420.0,
    heartRateBpm: 136,
    stageName: 'Full-Term Newborn',
    headline: 'Ready to meet the world',
    dailyFocus: 'Fully developed newborn proportions with soft cheeks, strong grasp, and steady rhythm.',
    systems: ['Full-term lungs', 'Newborn reflexes', 'Ready for delivery'],
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function clampPregnancyDay(dayNumber: number): number {
  if (!Number.isFinite(dayNumber)) return DEFAULT_EXPLORE_DAY;
  return Math.round(clamp(dayNumber, MIN_PREGNANCY_DAY, MAX_PREGNANCY_DAY));
}

export function dayNumberToWeekAndDay(dayNumber: number): {
  dayNumber: number;
  week: number;
  dayOfWeek: number;
  trimester: 1 | 2 | 3;
  trimesterLabel: string;
} {
  const safeDay = clampPregnancyDay(dayNumber);
  const zeroBased = safeDay - 1;
  const week = Math.floor(zeroBased / 7) + 1;
  const dayOfWeek = (zeroBased % 7) + 1;
  const trimester: 1 | 2 | 3 = week <= 13 ? 1 : week <= 27 ? 2 : 3;
  const trimesterLabel =
    trimester === 1 ? '1st Trimester' : trimester === 2 ? '2nd Trimester' : '3rd Trimester';

  return {
    dayNumber: safeDay,
    week,
    dayOfWeek,
    trimester,
    trimesterLabel,
  };
}

export function formatLengthFromMm(lengthMm: number): string {
  if (lengthMm < 10) {
    return `${lengthMm.toFixed(1)} mm`;
  }
  return `${(lengthMm / 10).toFixed(1)} cm`;
}

export function formatWeightFromGrams(weightGrams: number): string {
  if (weightGrams < 1) {
    return '< 1 g';
  }
  if (weightGrams < 1000) {
    return `${Math.round(weightGrams)} g`;
  }
  return `${(weightGrams / 1000).toFixed(2)} kg`;
}

/**
 * Computes smooth, continuous 3D anatomy morph targets for any gestational
 * week float (1.0 .. 40.9) so stepping day-by-day visibly transforms the fetus.
 */
export function computeFetalAnatomyMorph(weekFloat: number): FetalAnatomyMorph {
  const w = clamp(weekFloat, 1, 40.9);

  // Visual framing scale: smaller delicate embryo early on, filling frame nicely by W9..W40
  const displayScale = Number(
    (
      0.54 +
      0.34 * smoothstep(3.5, 11.0, w) +
      0.24 * smoothstep(11.0, 38.0, w)
    ).toFixed(3)
  );

  // Head proportion: iconic large translucent forehead dome at W6-11 (like reference), normalizing by W40
  const headScale = Number(
    (
      1.18 +
      0.16 * smoothstep(4.5, 8.8, w) -
      0.34 * smoothstep(10.5, 36.0, w)
    ).toFixed(3)
  );

  // Torso elongation & soft plumpness
  const torsoMaturity = Number(smoothstep(4.0, 38.0, w).toFixed(3));

  // Limbs grow from tiny paddle buds (W6) -> reference arms/legs (W9) -> full baby limbs (W36)
  const limbGrowth = Number(
    (
      0.06 +
      0.46 * smoothstep(5.5, 10.5, w) +
      0.48 * smoothstep(10.5, 34.0, w)
    ).toFixed(3)
  );

  // Fingers & toes separate rapidly between W7.5 and W10.5
  const digitSeparation = Number(smoothstep(7.0, 10.2, w).toFixed(3));

  // Embryonic tail bud peaks around W5.5-6.5 and recedes cleanly by W9.5
  const tailBudFactor = Number(
    (smoothstep(4.0, 6.0, w) * (1 - smoothstep(7.0, 9.6, w))).toFixed(3)
  );

  // Subsurface glowing translucency: luminous thin embryonic skin W6-13, thickening into soft peach skin W22-40
  const skinTranslucency = Number(
    (
      0.96 -
      0.32 * smoothstep(12.0, 24.0, w) -
      0.38 * smoothstep(24.0, 38.0, w)
    ).toFixed(3)
  );

  // Dorsal spine somites subtly visible through translucent back in W6-13 (as seen in reference)
  const spineSomiteVisibility = Number(
    (smoothstep(5.0, 7.5, w) * (1 - smoothstep(11.0, 18.0, w))).toFixed(3)
  );

  // Eyes migrate from side-set optic vesicles toward forward-facing
  const eyeMigration = Number(smoothstep(6.0, 16.0, w).toFixed(3));

  // Eyelids: open dark glossy eye W6-10 (matching reference), closed W11-26, gently open/blinking W27-40
  const closedPhase = smoothstep(10.3, 12.0, w) * (1 - smoothstep(26.5, 29.5, w));
  const lateSoftLid = 0.22 * smoothstep(28.0, 36.0, w);
  const eyelidClosure = Number(clamp(closedPhase + lateSoftLid, 0, 1).toFixed(3));

  // Nose, lips, ears, cheek fullness
  const facialMaturity = Number(smoothstep(7.0, 34.0, w).toFixed(3));

  // C-curve fetal posture: tightly curled embryo early, slightly uncurled mid-trimester, snug curl late
  const fetalCurl = Number(
    (
      0.88 -
      0.34 * smoothstep(9.0, 20.0, w) +
      0.24 * smoothstep(28.0, 39.0, w)
    ).toFixed(3)
  );

  // Motion activity: subtle pulse early -> lively floating/wiggling mid -> calm cozy breathing late
  const motionActivity = Number(
    (
      0.28 +
      0.62 * smoothstep(7.0, 18.0, w) -
      0.32 * smoothstep(32.0, 40.0, w)
    ).toFixed(3)
  );

  return {
    displayScale,
    headScale,
    torsoMaturity,
    limbGrowth,
    digitSeparation,
    tailBudFactor,
    skinTranslucency,
    spineSomiteVisibility,
    eyeMigration,
    eyelidClosure,
    facialMaturity,
    fetalCurl,
    motionActivity,
  };
}

export function getFetalDayMetrics(dayNumber: number): FetalDayMetrics {
  const { dayNumber: safeDay, week, dayOfWeek, trimester, trimesterLabel } =
    dayNumberToWeekAndDay(dayNumber);
  const weekFloat = 1 + (safeDay - 1) / 7;

  // Find surrounding weekly anchors for smooth day-by-day interpolation
  let lower = WEEKLY_ANCHORS[0];
  let upper = WEEKLY_ANCHORS[WEEKLY_ANCHORS.length - 1];

  for (let i = 0; i < WEEKLY_ANCHORS.length - 1; i++) {
    const curr = WEEKLY_ANCHORS[i];
    const next = WEEKLY_ANCHORS[i + 1];
    if (weekFloat >= curr.week && weekFloat <= next.week) {
      lower = curr;
      upper = next;
      break;
    }
  }

  const span = Math.max(0.0001, upper.week - lower.week);
  const t = clamp((weekFloat - lower.week) / span, 0, 1);

  const lengthMm = Number(lerp(lower.lengthMm, upper.lengthMm, t).toFixed(1));
  const weightGrams = Number(lerp(lower.weightGrams, upper.weightGrams, t).toFixed(2));

  let heartRateBpm: number | null = null;
  if (safeDay >= 35) {
    const bpmLow = lower.heartRateBpm ?? 95;
    const bpmHigh = upper.heartRateBpm ?? bpmLow;
    heartRateBpm = Math.round(lerp(bpmLow, bpmHigh, t));
  }

  const activeAnchor = t < 0.65 ? lower : upper;
  const anatomy = computeFetalAnatomyMorph(weekFloat);

  return {
    dayNumber: safeDay,
    week,
    dayOfWeek,
    trimester,
    trimesterLabel,
    stageName: activeAnchor.stageName,
    lengthMm,
    lengthLabel: formatLengthFromMm(lengthMm),
    lengthMeasureType: week < 20 ? 'Crown-to-Rump (CRL)' : 'Crown-to-Heel',
    weightGrams,
    weightLabel: formatWeightFromGrams(weightGrams),
    heartRateBpm,
    headline: activeAnchor.headline,
    dailyFocus: activeAnchor.dailyFocus,
    developingSystems: activeAnchor.systems,
    anatomy,
  };
}
