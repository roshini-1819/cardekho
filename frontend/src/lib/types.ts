// Mirrors the backend DTOs. Enum values are the uppercase names the API uses.

export type FuelType = "PETROL" | "DIESEL" | "CNG" | "HYBRID" | "ELECTRIC";
export type BodyType = "HATCHBACK" | "SEDAN" | "SUV" | "MUV";
export type Transmission = "MANUAL" | "AUTOMATIC";
export type Tone = "POSITIVE" | "NEUTRAL" | "CAUTION";

export interface Car {
  id: string;
  make: string;
  model: string;
  variant: string;
  priceLakh: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: Transmission;
  mileage: number;
  safetyStars: number;
  seating: number;
  bootLitres: number;
  powerBhp: number;
  features: string[];
  blurb: string;
}

export interface Priorities {
  value: number;
  mileage: number;
  safety: number;
  space: number;
  performance: number;
  features: number;
}

export interface Preferences {
  budgetMinLakh: number;
  budgetMaxLakh: number;
  bodyTypes: BodyType[];
  fuelTypes: FuelType[];
  minSeating: number;
  priorities: Priorities;
}

export interface MatchReason {
  label: string;
  tone: Tone;
}

export interface ScoredCar {
  car: Car;
  score: number;
  breakdown: { factor: string; contribution: number }[];
  reasons: MatchReason[];
}

export interface RecommendationResponse {
  matches: ScoredCar[];
  totalConsidered: number;
  empty: boolean;
}

export interface AiPick {
  car: Car;
  matchScore: number;
  headline: string;
  reasoning: string;
}

export interface AiRecommendation {
  summary: string;
  picks: AiPick[];
  provider: "gemini" | "fallback";
}

export interface SavedShortlist {
  id: string;
  createdAt: string;
  label: string;
  carIds: string[];
}

// Display helpers for the uppercase enum values.
export const bodyLabel: Record<BodyType, string> = {
  HATCHBACK: "Hatchback",
  SEDAN: "Sedan",
  SUV: "SUV",
  MUV: "MUV",
};

export const fuelLabel: Record<FuelType, string> = {
  PETROL: "Petrol",
  DIESEL: "Diesel",
  CNG: "CNG",
  HYBRID: "Hybrid",
  ELECTRIC: "Electric",
};

export const transmissionLabel: Record<Transmission, string> = {
  MANUAL: "Manual",
  AUTOMATIC: "Automatic",
};
