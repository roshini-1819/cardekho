export type FuelType = "Petrol" | "Diesel" | "CNG" | "Hybrid" | "Electric";
export type BodyType = "Hatchback" | "Sedan" | "SUV" | "MUV";
export type Transmission = "Manual" | "Automatic";

export interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  /** On-road-ish ex-showroom price in INR lakh */
  priceLakh: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  /** ARAI-style fuel efficiency in km/l (or km/kg for CNG, km/charge for EV) */
  mileage: number;
  /** Global NCAP safety rating, 0-5 stars */
  safetyStars: number;
  seating: number;
  /** Boot space in litres */
  bootLitres: number;
  /** Max power in bhp */
  powerBhp: number;
  /** Notable features that buyers care about */
  features: string[];
  /** One-line editorial summary */
  blurb: string;
}

/** What the buyer tells us through the guided questionnaire. */
export interface Preferences {
  budgetMinLakh: number;
  budgetMaxLakh: number;
  /** Empty array = no preference */
  bodyTypes: BodyType[];
  fuelTypes: FuelType[];
  minSeating: number;
  /** Each priority is weighted 0-3 (Not important -> Must have) by the user. */
  priorities: {
    value: number;
    mileage: number;
    safety: number;
    space: number;
    performance: number;
    features: number;
  };
}

export interface MatchReason {
  label: string;
  /** "positive" | "neutral" | "caution" */
  tone: "positive" | "neutral" | "caution";
}

export interface ScoredCar {
  car: Car;
  /** 0-100 overall match score */
  score: number;
  /** Breakdown of the weighted contributions, for transparency */
  breakdown: { factor: string; contribution: number }[];
  reasons: MatchReason[];
}
