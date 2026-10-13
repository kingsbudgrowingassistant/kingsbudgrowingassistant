// ---------------------------------------------------------------------------
// VPD (Vapor Pressure Deficit) — auto-calculated from temp + humidity.
// Drives the Environment section's stage assessment + disease warnings.
// ---------------------------------------------------------------------------

export interface VpdResult {
  vpdKpa: number;             // VPD in kilopascals
  svpKpa: number;             // saturated vapor pressure
  stageAssessment: VpdStage;
  diseaseWarnings: VpdWarning[];
  idealRange: VpdRange;
  status: "ok" | "watch" | "danger";
}

export interface VpdStage {
  stage: "clone_seedling" | "vegetative" | "flower" | "late_flower" | "off";
  label: string;
  idealForThisStage: boolean;
  reason: string;
}

export interface VpdWarning {
  severity: "info" | "warning" | "danger";
  title: string;
  detail: string;
  disease?: string;
  preventionTip?: string;
}

export interface VpdRange {
  label: string;
  tempMin: number;
  tempMax: number;
  rhMin: number;
  rhMax: number;
  vpdMin: number;
  vpdMax: number;
}

// Cannabis growth stages and their ideal environmental ranges.
export const STAGE_RANGES: VpdRange[] = [
  {
    label: "Clone / Seedling",
    tempMin: 22, tempMax: 25,
    rhMin: 70, rhMax: 80,
    vpdMin: 0.4, vpdMax: 0.8,
  },
  {
    label: "Vegetative",
    tempMin: 22, tempMax: 28,
    rhMin: 50, rhMax: 70,
    vpdMin: 0.8, vpdMax: 1.2,
  },
  {
    label: "Flower (early/mid)",
    tempMin: 20, tempMax: 26,
    rhMin: 40, rhMax: 55,
    vpdMin: 1.0, vpdMax: 1.5,
  },
  {
    label: "Late Flower (last 2-3 weeks)",
    tempMin: 18, tempMax: 24,
    rhMin: 35, rhMax: 45,
    vpdMin: 1.2, vpdMax: 1.6,
  },
];

// Tetens equation — saturation vapor pressure (kPa) at given temp (°C).
export function saturationVaporPressure(tempC: number): number {
  // SVP = 0.6108 × exp(17.27 × T / (T + 237.3))
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

// VPD = SVP × (1 − RH/100), in kPa.
export function computeVpd(tempC: number, humidityPct: number): number {
  const svp = saturationVaporPressure(tempC);
  const vpd = svp * (1 - humidityPct / 100);
  return Math.max(0, vpd);
}

// Find the stage whose VPD range best matches the current VPD.
// If none match, returns "off" with a clear reason.
export function assessStage(tempC: number, humidityPct: number, vpd: number): VpdStage {
  const matchedStages = STAGE_RANGES.filter(
    (s) =>
      vpd >= s.vpdMin &&
      vpd <= s.vpdMax &&
      tempC >= s.tempMin - 1 &&
      tempC <= s.tempMax + 1 &&
      humidityPct >= s.rhMin - 5 &&
      humidityPct <= s.rhMax + 5
  );

  if (matchedStages.length > 0) {
    const stage = matchedStages[0];
    const stageKey = stage.label.includes("Clone")
      ? "clone_seedling"
      : stage.label.includes("Vegetative")
      ? "vegetative"
      : stage.label.includes("Late")
      ? "late_flower"
      : "flower";
    return {
      stage: stageKey as VpdStage["stage"],
      label: stage.label,
      idealForThisStage: true,
      reason: `Conditions match the ideal range for ${stage.label} stage (VPD ${stage.vpdMin}–${stage.vpdMax} kPa, ${stage.tempMin}–${stage.tempMax}°C, ${stage.rhMin}–${stage.rhMax}% RH). Plants will transpire and uptake nutrients efficiently.`,
    };
  }

  // No ideal match — find the closest stage for the VPD value alone.
  let closestStage = STAGE_RANGES[0];
  let minDist = Math.abs(vpd - (STAGE_RANGES[0].vpdMin + STAGE_RANGES[0].vpdMax) / 2);
  for (const s of STAGE_RANGES.slice(1)) {
    const mid = (s.vpdMin + s.vpdMax) / 2;
    const d = Math.abs(vpd - mid);
    if (d < minDist) {
      minDist = d;
      closestStage = s;
    }
  }
  const stageKey = closestStage.label.includes("Clone")
    ? "clone_seedling"
    : closestStage.label.includes("Vegetative")
    ? "vegetative"
    : closestStage.label.includes("Late")
    ? "late_flower"
    : "flower";

  return {
    stage: stageKey as VpdStage["stage"],
    label: closestStage.label,
    idealForThisStage: false,
    reason: `VPD of ${vpd.toFixed(2)} kPa is closest to ${closestStage.label} (ideal ${closestStage.vpdMin}–${closestStage.vpdMax} kPa), but the temperature or humidity is outside the ideal range. Adjust environment to match.`,
  };
}

// Build disease / stress warnings based on temp + humidity + VPD.
export function buildDiseaseWarnings(tempC: number, humidityPct: number, vpd: number): VpdWarning[] {
  const warnings: VpdWarning[] = [];

  // --- High humidity risks (during flower especially) ---
  if (humidityPct >= 70) {
    warnings.push({
      severity: "danger",
      title: "Humidity too high — bud rot (Botrytis) risk",
      detail: `Humidity at ${humidityPct.toFixed(0)}% is above the safe threshold of 65% for flowering. Grey mould (Botrytis cinerea) thrives in still, humid air and can destroy a crop in 48 hours once established.`,
      disease: "Bud rot (Botrytis cinerea)",
      preventionTip:
        "Increase exhaust fan runtime, open up the canopy with defoliation, and consider a small circulation fan directly under the canopy. Drop RH below 55% during flower.",
    });
  } else if (humidityPct >= 65 && humidityPct < 70) {
    warnings.push({
      severity: "warning",
      title: "Borderline humidity — watch for powdery mildew",
      detail: `Humidity at ${humidityPct.toFixed(0)}% is at the edge of the danger zone. Powdery mildew (Podosphaera xanthii) spores germinate above 65% RH and can spread fast.`,
      disease: "Powdery mildew",
      preventionTip:
        "Ensure leaves are dry by nightfall, prune lower foliage to improve airflow, and remove any suspect leaves immediately.",
    });
  }

  // --- Very high humidity — additional disease risks ---
  if (humidityPct >= 80) {
    warnings.push({
      severity: "danger",
      title: "Extreme humidity — multiple disease risks",
      detail: `At ${humidityPct.toFixed(0)}% RH you are at risk of: bud rot, powdery mildew, root rot (Pythium), and leaf septoria. This environment also slows transpiration and nutrient uptake.`,
      disease: "Bud rot, Powdery mildew, Pythium root rot, Leaf septoria",
      preventionTip:
        "Drop humidity urgently — dehumidifier or fresh-air intake. Inspect daily for any grey patches or white powder on leaves.",
    });
  }

  // --- High temperature stress ---
  if (tempC >= 32) {
    warnings.push({
      severity: "danger",
      title: "Too hot — heat stress + terpene loss",
      detail: `Temperature at ${tempC.toFixed(1)}°C is above the safe ceiling of 30°C. Plants will transpire heavily, may droop or curl leaves (canoeing), and terpene production drops sharply. Pollen-sensitive crops risk hermaphroditism under sustained heat.`,
      disease: "Heat stress, terpene loss, possible hermaphroditism",
      preventionTip:
        "Drop lights intensity or raise them, increase exhaust fan speed, and ensure roots aren't sitting in hot runoff. Consider running lights at night if the grow space lacks AC.",
    });
  } else if (tempC >= 30 && tempC < 32) {
    warnings.push({
      severity: "warning",
      title: "Borderline hot — watch for heat stress",
      detail: `Temperature at ${tempC.toFixed(1)}°C is at the upper edge. Plants will drink more water and transpiration rates will spike. CalMag deficiencies often appear first under heat stress.`,
      preventionTip:
        "Bump up airflow, check root zone temperature (keep below 24°C), and watch for canoeing leaves.",
    });
  }

  // --- Cold stress ---
  if (tempC < 15) {
    warnings.push({
      severity: "danger",
      title: "Too cold — metabolism slowed",
      detail: `Temperature at ${tempC.toFixed(1)}°C is below the safe floor of 16°C. Plant metabolism slows, nutrient uptake drops, and purple / purple-stem colouration can appear (anthocyanin). Risk of cold shock + root diseases if sustained.`,
      disease: "Cold stress, slow growth, root disease risk",
      preventionTip:
        "Add a thermostatically-controlled space heater, insulate the tent floor, and bring night temps at least above 18°C.",
    });
  } else if (tempC < 18) {
    warnings.push({
      severity: "warning",
      title: "Cool temperatures — slower growth",
      detail: `Temperature at ${tempC.toFixed(1)}°C is below the optimal range. Growth will slow and uptake of phosphorus drops visibly (purple petioles).`,
      preventionTip:
        "Bump temperature up to at least 20°C during the day cycle for active growth.",
    });
  }

  // --- Low humidity (too dry) ---
  if (humidityPct < 35) {
    warnings.push({
      severity: "warning",
      title: "Too dry — transpiration stress",
      detail: `Humidity at ${humidityPct.toFixed(0)}% is below the safe floor of 40%. Plants transpire too fast, leading to nutrient burn on leaf tips and slower growth. Clones and seedlings are especially vulnerable.`,
      disease: "Nutrient burn, stunted growth, dry-medium stress",
      preventionTip:
        "Add a humidifier, mist the tent floor (not the plants) and reduce exhaust fan speed. Aim for 50–60% RH during veg.",
    });
  }

  // --- VPD-specific warnings ---
  if (vpd > 1.6) {
    warnings.push({
      severity: "warning",
      title: "VPD very high — plants can't keep up",
      detail: `VPD of ${vpd.toFixed(2)} kPa is above 1.6 kPa. Plants are transpiring faster than they can replace water — watch for drooping even when medium is moist.`,
      preventionTip: "Raise humidity by 5–10% or drop temperature by 2°C.",
    });
  } else if (vpd < 0.4) {
    warnings.push({
      severity: "warning",
      title: "VPD very low — transpiration stalled",
      detail: `VPD of ${vpd.toFixed(2)} kPa is below 0.4 kPa. Plants barely transpire, nutrient uptake slows, and calcium / magnesium deficiencies can show up. Risk of mould is also elevated.`,
      preventionTip: "Lower humidity or raise temperature by 2–3°C.",
    });
  }

  return warnings;
}

export function computeVpdAssessment(tempC: number, humidityPct: number): VpdResult {
  const svpKpa = saturationVaporPressure(tempC);
  const vpdKpa = computeVpd(tempC, humidityPct);
  const stageAssessment = assessStage(tempC, humidityPct, vpdKpa);
  const diseaseWarnings = buildDiseaseWarnings(tempC, humidityPct, vpdKpa);
  const idealRange = STAGE_RANGES.find((s) => s.label === stageAssessment.label) ?? STAGE_RANGES[1];
  const status: VpdResult["status"] = diseaseWarnings.some((w) => w.severity === "danger")
    ? "danger"
    : diseaseWarnings.some((w) => w.severity === "warning")
    ? "watch"
    : "ok";
  return { vpdKpa, svpKpa, stageAssessment, diseaseWarnings, idealRange, status };
}
