import type { ScoredCar, Tone } from "../lib/types";
import { bodyLabel, fuelLabel, transmissionLabel } from "../lib/types";

const TONE_STYLES: Record<Tone, string> = {
  POSITIVE: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  NEUTRAL: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  CAUTION: "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

function ScoreRing({ score }: { score: number }) {
  const hue = score >= 75 ? "#34d399" : score >= 55 ? "#60a5fa" : "#fbbf24";
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{
        background: `conic-gradient(${hue} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0b1220] text-white">
        {score}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 py-2">
      <div className="font-semibold text-slate-100">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}

export default function ResultCard({
  rank,
  result,
  inCompare,
  onToggleCompare,
}: {
  rank: number;
  result: ScoredCar;
  inCompare: boolean;
  onToggleCompare: () => void;
}) {
  const { car, score, reasons } = result;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20">
      <div className="flex items-start gap-4">
        <ScoreRing score={score} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded bg-white/10 px-1.5 py-0.5 font-semibold text-slate-200">
              #{rank}
            </span>
            <span>{bodyLabel[car.bodyType]}</span>
            <span>·</span>
            <span>{fuelLabel[car.fuelType]}</span>
            <span>·</span>
            <span>{transmissionLabel[car.transmission]}</span>
          </div>
          <h3 className="mt-0.5 truncate text-lg font-semibold text-white">
            {car.make} {car.model}{" "}
            <span className="font-normal text-slate-300">{car.variant}</span>
          </h3>
          <p className="text-sm font-medium text-brand">₹{car.priceLakh} Lakh</p>
        </div>
        <button
          onClick={onToggleCompare}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            inCompare
              ? "border-brand bg-brand text-white"
              : "border-white/15 text-slate-200 hover:border-white/30"
          }`}
        >
          {inCompare ? "✓ Comparing" : "Compare"}
        </button>
      </div>

      <ul className="mt-4 flex flex-wrap gap-2">
        {reasons.map((r, i) => (
          <li key={i} className={`rounded-lg border px-2.5 py-1 text-xs ${TONE_STYLES[r.tone]}`}>
            {r.label}
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
        <Stat label="Safety" value={`${car.safetyStars}★`} />
        <Stat
          label={car.fuelType === "ELECTRIC" ? "Range" : "Mileage"}
          value={car.fuelType === "ELECTRIC" ? `${car.mileage}km` : `${car.mileage}`}
        />
        <Stat label="Boot" value={`${car.bootLitres}L`} />
        <Stat label="Power" value={`${car.powerBhp}bhp`} />
      </div>
    </div>
  );
}
