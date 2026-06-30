"use client";

import type { Car } from "@/lib/types";

type Row = {
  label: string;
  get: (c: Car) => string | number;
  /** Higher is better → highlight the max. "low" → highlight the min. null → no highlight. */
  best: "high" | "low" | null;
};

const ROWS: Row[] = [
  { label: "Price", get: (c) => `₹${c.priceLakh}L`, best: null },
  { label: "Body", get: (c) => c.bodyType, best: null },
  { label: "Fuel", get: (c) => c.fuelType, best: null },
  { label: "Gearbox", get: (c) => c.transmission, best: null },
  { label: "Safety (★)", get: (c) => c.safetyStars, best: "high" },
  { label: "Mileage/Range", get: (c) => c.mileage, best: "high" },
  { label: "Seats", get: (c) => c.seating, best: "high" },
  { label: "Boot (L)", get: (c) => c.bootLitres, best: "high" },
  { label: "Power (bhp)", get: (c) => c.powerBhp, best: "high" },
];

export default function ComparisonTable({
  cars,
  onRemove,
}: {
  cars: Car[];
  onRemove: (id: string) => void;
}) {
  if (cars.length === 0) return null;

  const bestIndex = (row: Row): number | null => {
    if (!row.best) return null;
    const nums = cars.map((c) => Number(row.get(c)));
    if (nums.some((n) => Number.isNaN(n))) return null;
    const target = row.best === "high" ? Math.max(...nums) : Math.min(...nums);
    // Only highlight if there's a unique winner.
    if (nums.filter((n) => n === target).length !== 1) return null;
    return nums.indexOf(target);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-[#0e1830] p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Spec
            </th>
            {cars.map((c) => (
              <th key={c.id} className="min-w-[150px] p-3 text-left align-top">
                <div className="font-semibold text-white">
                  {c.make} {c.model}
                </div>
                <div className="text-xs font-normal text-slate-400">{c.variant}</div>
                <button
                  onClick={() => onRemove(c.id)}
                  className="mt-1 text-xs text-rose-400 hover:underline"
                >
                  remove
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const winner = bestIndex(row);
            return (
              <tr key={row.label} className="border-t border-white/5">
                <td className="sticky left-0 bg-[#0e1830] p-3 text-slate-300">
                  {row.label}
                </td>
                {cars.map((c, i) => (
                  <td
                    key={c.id}
                    className={`p-3 ${
                      winner === i
                        ? "font-semibold text-emerald-300"
                        : "text-slate-100"
                    }`}
                  >
                    {row.get(c)}
                    {winner === i && " ✓"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
