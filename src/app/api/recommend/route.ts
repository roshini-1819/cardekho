import { NextRequest, NextResponse } from "next/server";
import { recommend } from "@/lib/recommend";
import type { BodyType, FuelType, Preferences } from "@/lib/types";

const BODY_TYPES: BodyType[] = ["Hatchback", "Sedan", "SUV", "MUV"];
const FUEL_TYPES: FuelType[] = ["Petrol", "Diesel", "CNG", "Hybrid", "Electric"];

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampWeight(v: unknown): number {
  const n = Math.round(num(v, 0));
  return Math.max(0, Math.min(3, n));
}

/** Coerce arbitrary JSON into a safe Preferences object. */
function parsePreferences(body: any): Preferences {
  const budgetMinLakh = Math.max(0, num(body?.budgetMinLakh, 0));
  const budgetMaxLakh = Math.max(budgetMinLakh + 1, num(body?.budgetMaxLakh, 30));

  const bodyTypes = Array.isArray(body?.bodyTypes)
    ? body.bodyTypes.filter((b: unknown): b is BodyType =>
        BODY_TYPES.includes(b as BodyType)
      )
    : [];
  const fuelTypes = Array.isArray(body?.fuelTypes)
    ? body.fuelTypes.filter((f: unknown): f is FuelType =>
        FUEL_TYPES.includes(f as FuelType)
      )
    : [];

  const p = body?.priorities ?? {};
  return {
    budgetMinLakh,
    budgetMaxLakh,
    bodyTypes,
    fuelTypes,
    minSeating: Math.max(2, Math.min(7, Math.round(num(body?.minSeating, 5)))),
    priorities: {
      value: clampWeight(p.value),
      mileage: clampWeight(p.mileage),
      safety: clampWeight(p.safety),
      space: clampWeight(p.space),
      performance: clampWeight(p.performance),
      features: clampWeight(p.features),
    },
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prefs = parsePreferences(body);
  const result = recommend(prefs, 5);
  return NextResponse.json(result);
}
