import type { AiRecommendation } from "../lib/types";
import { bodyLabel, fuelLabel } from "../lib/types";

export default function AiPanel({
  loading,
  data,
  aiEnabled,
  onAsk,
}: {
  loading: boolean;
  data: AiRecommendation | null;
  aiEnabled: boolean;
  onAsk: () => void;
}) {
  return (
    <div className="rounded-2xl border border-brand/30 bg-brand/[0.06] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <span>✨ Ask the AI advisor</span>
          </h2>
          <p className="text-sm text-slate-300">
            An LLM picks the best 3 from your matches and explains the trade-offs in plain English.
          </p>
        </div>
        <button
          onClick={onAsk}
          disabled={loading}
          className="shrink-0 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Ask AI"}
        </button>
      </div>

      {!aiEnabled && (
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          No <code>GEMINI_API_KEY</code> set — the advisor will answer using the deterministic
          scoring engine. Add a key to the backend to get AI-written reasoning.
        </p>
      )}

      {data && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                data.provider === "gemini"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-slate-500/20 text-slate-300"
              }`}
            >
              {data.provider === "gemini" ? "Gemini" : "Fallback engine"}
            </span>
            <p className="text-sm text-slate-200">{data.summary}</p>
          </div>

          <ol className="space-y-3">
            {data.picks.map((p, i) => (
              <li key={p.car.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-white">
                    <span className="mr-2 text-brand">#{i + 1}</span>
                    {p.car.make} {p.car.model}{" "}
                    <span className="font-normal text-slate-400">{p.car.variant}</span>
                  </h3>
                  <span className="shrink-0 text-xs text-slate-400">
                    ₹{p.car.priceLakh}L · {bodyLabel[p.car.bodyType]} · {fuelLabel[p.car.fuelType]}
                  </span>
                </div>
                {p.headline && (
                  <p className="mt-1 text-sm font-medium text-brand">{p.headline}</p>
                )}
                <p className="mt-1 text-sm text-slate-300">{p.reasoning}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
