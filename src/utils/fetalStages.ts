export interface FetalStageAnchor {
  id: string;
  anchorDay: number;
  anchorWeek: number;
  label: string;
  /** Normalized UV coordinates (0..1, bottom-left origin in WebGL) of the baby's chest/heart center */
  heartUv: [number, number];
  /** Normalized UV center of the baby for subtle organic breathing & framing zoom */
  bodyCenterUv: [number, number];
}

export interface FetalStageBlend {
  lowerIndex: number;
  upperIndex: number;
  blend: number;
  /** Subtle continuous day-by-day framing scale (0.94..1.08) so every +1 day shows gradual growth */
  growthZoom: number;
  /** Interpolated WebGL UV coordinates for the baby's anatomical heart center */
  heartUv: [number, number];
  /** Interpolated WebGL UV coordinates for subtle organic breathing center */
  bodyCenterUv: [number, number];
  /** Active nearest milestone stage label */
  stageId: string;
}

/**
 * Six photorealistic medical-CGI developmental anchor keyframes spanning Day 1..280.
 * UV coordinates use WebGL bottom-left origin (0,0 = bottom-left, 1,1 = top-right).
 */
export const FETAL_STAGE_ANCHORS: FetalStageAnchor[] = [
  {
    id: 'w5',
    anchorDay: 35,
    anchorWeek: 5,
    label: 'Week 5–6 Embryo',
    heartUv: [0.515, 0.375],
    bodyCenterUv: [0.51, 0.46],
  },
  {
    id: 'w9',
    anchorDay: 60,
    anchorWeek: 9,
    label: 'Week 9 Early Fetus',
    heartUv: [0.51, 0.34],
    bodyCenterUv: [0.51, 0.48],
  },
  {
    id: 'w14',
    anchorDay: 98,
    anchorWeek: 14,
    label: 'Week 14 Fetus',
    heartUv: [0.53, 0.35],
    bodyCenterUv: [0.52, 0.48],
  },
  {
    id: 'w20',
    anchorDay: 140,
    anchorWeek: 20,
    label: 'Week 20 Mid-Pregnancy',
    heartUv: [0.54, 0.36],
    bodyCenterUv: [0.52, 0.47],
  },
  {
    id: 'w28',
    anchorDay: 196,
    anchorWeek: 28,
    label: 'Week 28 Third Trimester',
    heartUv: [0.54, 0.37],
    bodyCenterUv: [0.52, 0.47],
  },
  {
    id: 'w38',
    anchorDay: 266,
    anchorWeek: 38,
    label: 'Week 38 Full Term',
    heartUv: [0.51, 0.35],
    bodyCenterUv: [0.50, 0.49],
  },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function smoothstep01(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Computes smooth cross-dissolve indices, blend weight, continuous daily growth zoom,
 * and interpolated anatomical heart UV for any gestational day (1..280).
 */
export function resolveFetalStageBlend(dayNumber: number): FetalStageBlend {
  const safeDay = clamp(Math.round(Number.isFinite(dayNumber) ? dayNumber : 57), 1, 280);
  const lastIdx = FETAL_STAGE_ANCHORS.length - 1;

  let lowerIndex = 0;
  let upperIndex = 0;
  let rawT = 0;

  if (safeDay <= FETAL_STAGE_ANCHORS[0].anchorDay) {
    lowerIndex = 0;
    upperIndex = 0;
    rawT = 0;
  } else if (safeDay >= FETAL_STAGE_ANCHORS[lastIdx].anchorDay) {
    lowerIndex = lastIdx;
    upperIndex = lastIdx;
    rawT = 0;
  } else {
    for (let i = 0; i < lastIdx; i++) {
      const a = FETAL_STAGE_ANCHORS[i];
      const b = FETAL_STAGE_ANCHORS[i + 1];
      if (safeDay >= a.anchorDay && safeDay < b.anchorDay) {
        lowerIndex = i;
        upperIndex = i + 1;
        rawT = (safeDay - a.anchorDay) / Math.max(1, b.anchorDay - a.anchorDay);
        break;
      }
    }
  }

  const blend = Number(smoothstep01(rawT).toFixed(4));
  const lower = FETAL_STAGE_ANCHORS[lowerIndex];
  const upper = FETAL_STAGE_ANCHORS[upperIndex];

  // Subtle day-by-day visual growth zoom across each segment + overall gestation
  const overallProgress = (safeDay - 1) / 279;
  const growthZoom = Number((0.94 + overallProgress * 0.12).toFixed(4));

  const heartUv: [number, number] = [
    Number((lower.heartUv[0] + (upper.heartUv[0] - lower.heartUv[0]) * blend).toFixed(4)),
    Number((lower.heartUv[1] + (upper.heartUv[1] - lower.heartUv[1]) * blend).toFixed(4)),
  ];

  const bodyCenterUv: [number, number] = [
    Number(
      (lower.bodyCenterUv[0] + (upper.bodyCenterUv[0] - lower.bodyCenterUv[0]) * blend).toFixed(4)
    ),
    Number(
      (lower.bodyCenterUv[1] + (upper.bodyCenterUv[1] - lower.bodyCenterUv[1]) * blend).toFixed(4)
    ),
  ];

  const stageId = blend < 0.5 ? lower.id : upper.id;

  return {
    lowerIndex,
    upperIndex,
    blend,
    growthZoom,
    heartUv,
    bodyCenterUv,
    stageId,
  };
}
