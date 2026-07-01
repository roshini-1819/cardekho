import { useState } from "react";
import type { BodyType, FuelType, Preferences } from "../lib/types";
import { bodyLabel, fuelLabel } from "../lib/types";

const BODY_TYPES: BodyType[] = ["HATCHBACK", "SEDAN", "SUV", "MUV"];
const FUEL_TYPES: FuelType[] = ["PETROL", "DIESEL", "CNG", "HYBRID", "ELECTRIC"];

const PRIORITY_FIELDS: {
  key: keyof Preferences["priorities"];
  label: string;
  hint: string;
}[] = [
  { key: "value", label: "Value for money", hint: "Get the most car per rupee" },
  { key: "mileage", label: "Running cost", hint: "Fuel economy / EV range" },
  { key: "safety", label: "Safety", hint: "Crash-test rating" },
  { key: "space", label: "Space", hint: "Boot & practicality" },
  { key: "performance", label: "Performance", hint: "Power & punch" },
  { key: "features", label: "Features", hint: "Tech, comfort, gadgets" },
];

const WEIGHT_LABELS = ["Skip", "Nice", "Want", "Must"];

const DEFAULTS: Preferences = {
  budgetMinLakh: 7,
  budgetMaxLakh: 15,
  bodyTypes: [],
  fuelTypes: [],
  minSeating: 5,
  priorities: { value: 2, mileage: 2, safety: 3, space: 1, performance: 1, features: 1 },
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? "border-brand bg-brand text-white"
          : "border-white/15 bg-white/5 text-slate-200 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

export default function Questionnaire({
  onSubmit,
  loading,
}: {
  onSubmit: (prefs: Preferences) => void;
  loading: boolean;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(prefs);
      }}
      className="space-y-7 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
    >
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Budget:{" "}
          <span className="text-brand">
            ₹{prefs.budgetMinLakh}L – ₹{prefs.budgetMaxLakh}L
          </span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs text-slate-400">Min</span>
            <input
              type="range"
              min={3}
              max={30}
              value={prefs.budgetMinLakh}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  budgetMinLakh: Math.min(Number(e.target.value), p.budgetMaxLakh - 1),
                }))
              }
              className="w-full accent-brand"
            />
          </div>
          <div>
            <span className="text-xs text-slate-400">Max</span>
            <input
              type="range"
              min={4}
              max={30}
              value={prefs.budgetMaxLakh}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  budgetMaxLakh: Math.max(Number(e.target.value), p.budgetMinLakh + 1),
                }))
              }
              className="w-full accent-brand"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Body type <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {BODY_TYPES.map((b) => (
            <Chip
              key={b}
              active={prefs.bodyTypes.includes(b)}
              onClick={() => setPrefs((p) => ({ ...p, bodyTypes: toggle(p.bodyTypes, b) }))}
            >
              {bodyLabel[b]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Fuel <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {FUEL_TYPES.map((f) => (
            <Chip
              key={f}
              active={prefs.fuelTypes.includes(f)}
              onClick={() => setPrefs((p) => ({ ...p, fuelTypes: toggle(p.fuelTypes, f) }))}
            >
              {fuelLabel[f]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          Minimum seats
        </label>
        <div className="flex gap-2">
          {[4, 5, 7].map((s) => (
            <Chip
              key={s}
              active={prefs.minSeating === s}
              onClick={() => setPrefs((p) => ({ ...p, minSeating: s }))}
            >
              {s}+ seats
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-200">
          What matters most to you?
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRIORITY_FIELDS.map((f) => (
            <div key={f.key} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-100">{f.label}</span>
                <span className="text-xs font-semibold text-brand">
                  {WEIGHT_LABELS[prefs.priorities[f.key]]}
                </span>
              </div>
              <p className="mb-2 text-xs text-slate-400">{f.hint}</p>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={prefs.priorities[f.key]}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    priorities: { ...p.priorities, [f.key]: Number(e.target.value) },
                  }))
                }
                className="w-full accent-brand"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-brand px-5 py-3 text-base font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "Finding your matches…" : "Show me my matches →"}
      </button>
    </form>
  );
}
