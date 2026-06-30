import { CARS } from "./cars";
import type { Car, MatchReason, Preferences, ScoredCar } from "./types";

/**
 * The recommendation engine.
 *
 * Two stages:
 *  1. Hard filters — non-negotiable constraints (budget, seating, fuel/body
 *     preferences). Cars that fail are dropped entirely.
 *  2. Weighted scoring — each surviving car earns a 0-100 score built from
 *     normalised sub-scores (value, mileage, safety, space, performance,
 *     features) blended by the priority weights the buyer set.
 *
 * Everything is explainable: we keep the per-factor contributions and turn the
 * dominant ones into human-readable reasons.
 */

const DATASET_RANGES = computeRanges(CARS);

interface Range {
  min: number;
  max: number;
}

function computeRanges(cars: Car[]) {
  const pick = (fn: (c: Car) => number): Range => {
    const vals = cars.map(fn);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };
  return {
    price: pick((c) => c.priceLakh),
    mileage: pick((c) => c.mileage),
    boot: pick((c) => c.bootLitres),
    power: pick((c) => c.powerBhp),
    features: pick((c) => c.features.length),
  };
}

/** Scale a value into 0..1 within a range. */
function normalize(value: number, range: Range): number {
  if (range.max === range.min) return 0.5;
  return (value - range.min) / (range.max - range.min);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Mileage lives on wildly different scales across fuel types (24 km/l petrol vs
 * 465 km/charge EV), so a raw min-max across the whole dataset would be
 * meaningless. We score efficiency relative to peers of the same fuel type.
 */
function efficiencyScore(car: Car, cars: Car[]): number {
  const peers = cars.filter((c) => c.fuelType === car.fuelType);
  const range: Range = {
    min: Math.min(...peers.map((c) => c.mileage)),
    max: Math.max(...peers.map((c) => c.mileage)),
  };
  return normalize(car.mileage, range);
}

interface FactorScore {
  factor: string;
  /** 0..1 raw quality of the car on this factor */
  quality: number;
  weight: number;
}

function scoreCar(car: Car, prefs: Preferences): ScoredCar {
  // How well the price sits inside the buyer's budget. Cheaper-within-budget
  // scores higher, so "value" rewards leaving money on the table.
  const budgetSpan = Math.max(prefs.budgetMaxLakh - prefs.budgetMinLakh, 1);
  const valueQuality = clamp01(
    (prefs.budgetMaxLakh - car.priceLakh) / budgetSpan
  );

  const factors: FactorScore[] = [
    { factor: "value", quality: valueQuality, weight: prefs.priorities.value },
    {
      factor: "mileage",
      quality: efficiencyScore(car, CARS),
      weight: prefs.priorities.mileage,
    },
    {
      factor: "safety",
      quality: car.safetyStars / 5,
      weight: prefs.priorities.safety,
    },
    {
      factor: "space",
      quality: normalize(car.bootLitres, DATASET_RANGES.boot),
      weight: prefs.priorities.space,
    },
    {
      factor: "performance",
      quality: normalize(car.powerBhp, DATASET_RANGES.power),
      weight: prefs.priorities.performance,
    },
    {
      factor: "features",
      quality: normalize(car.features.length, DATASET_RANGES.features),
      weight: prefs.priorities.features,
    },
  ];

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0) || 1;

  const breakdown = factors.map((f) => ({
    factor: f.factor,
    contribution: Math.round((f.quality * f.weight * 100) / totalWeight),
  }));

  const score = Math.round(
    factors.reduce((s, f) => s + f.quality * f.weight, 0) * (100 / totalWeight)
  );

  return {
    car,
    score,
    breakdown: breakdown.sort((a, b) => b.contribution - a.contribution),
    reasons: buildReasons(car, prefs, factors),
  };
}

/** Turn the scoring internals into a few plain-English reasons. */
function buildReasons(
  car: Car,
  prefs: Preferences,
  factors: FactorScore[]
): MatchReason[] {
  const reasons: MatchReason[] = [];

  // Surface the buyer's top weighted factors where this car does well.
  const ranked = [...factors]
    .filter((f) => f.weight > 0 && f.quality >= 0.6)
    .sort((a, b) => b.weight * b.quality - a.weight * a.quality);

  const labels: Record<string, string> = {
    value: `Priced ₹${car.priceLakh}L — comfortably inside your budget`,
    mileage: `Strong ${car.fuelType === "Electric" ? `${car.mileage} km range` : `${car.mileage} km/l economy`} for the segment`,
    safety: `${car.safetyStars}-star crash safety`,
    space: `Big ${car.bootLitres}L boot`,
    performance: `Punchy ${car.powerBhp} bhp`,
    features: `Loaded: ${car.features.slice(0, 2).join(", ")}`,
  };

  for (const f of ranked.slice(0, 3)) {
    reasons.push({ label: labels[f.factor], tone: "positive" });
  }

  // Always honour an explicit safety priority with a caution if it's weak.
  if (prefs.priorities.safety >= 2 && car.safetyStars <= 2) {
    reasons.push({
      label:
        car.safetyStars === 0
          ? "Not crash-tested — a real trade-off given you care about safety"
          : `Only ${car.safetyStars}-star safety — worth weighing against the rest`,
      tone: "caution",
    });
  }

  if (reasons.length === 0) {
    reasons.push({ label: car.blurb, tone: "neutral" });
  }

  return reasons;
}

/** Stage 1: hard filters. Returns the cars a buyer would actually consider. */
function passesFilters(car: Car, prefs: Preferences): boolean {
  if (car.priceLakh > prefs.budgetMaxLakh) return false;
  if (car.priceLakh < prefs.budgetMinLakh) return false;
  if (car.seating < prefs.minSeating) return false;
  if (prefs.bodyTypes.length > 0 && !prefs.bodyTypes.includes(car.bodyType))
    return false;
  if (prefs.fuelTypes.length > 0 && !prefs.fuelTypes.includes(car.fuelType))
    return false;
  return true;
}

export interface RecommendationResult {
  matches: ScoredCar[];
  totalConsidered: number;
  /** True when filters were so tight nothing matched. */
  empty: boolean;
}

export function recommend(prefs: Preferences, limit = 5): RecommendationResult {
  const eligible = CARS.filter((c) => passesFilters(c, prefs));
  const scored = eligible
    .map((c) => scoreCar(c, prefs))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    matches: scored,
    totalConsidered: eligible.length,
    empty: eligible.length === 0,
  };
}
