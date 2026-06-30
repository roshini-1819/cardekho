"use client";

import { useEffect, useMemo, useState } from "react";
import Questionnaire from "@/components/Questionnaire";
import ResultCard from "@/components/ResultCard";
import ComparisonTable from "@/components/ComparisonTable";
import { CARS } from "@/lib/cars";
import type { Preferences, ScoredCar } from "@/lib/types";
import type { SavedShortlist } from "@/lib/store";

const CAR_BY_ID = new Map(CARS.map((c) => [c.id, c]));

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScoredCar[] | null>(null);
  const [considered, setConsidered] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedShortlist[]>([]);
  const [saveLabel, setSaveLabel] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    refreshSaved();
  }, []);

  async function refreshSaved() {
    try {
      const res = await fetch("/api/shortlist");
      const data = await res.json();
      setSaved(data.shortlists ?? []);
    } catch {
      /* non-fatal */
    }
  }

  async function handleSubmit(prefs: Preferences) {
    setLoading(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      setResults(data.matches ?? []);
      setConsidered(data.totalConsidered ?? 0);
      setCompareIds([]);
      setTimeout(
        () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleCompare(id: string) {
    setCompareIds((ids) =>
      ids.includes(id)
        ? ids.filter((x) => x !== id)
        : ids.length >= 3
          ? ids // cap at 3
          : [...ids, id]
    );
  }

  const compareCars = useMemo(
    () => compareIds.map((id) => CAR_BY_ID.get(id)!).filter(Boolean),
    [compareIds]
  );

  async function saveCurrentShortlist() {
    const carIds = compareIds.length > 0 ? compareIds : (results ?? []).map((r) => r.car.id);
    if (carIds.length === 0) return;
    const res = await fetch("/api/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: saveLabel, carIds }),
    });
    if (res.ok) {
      setSaveLabel("");
      setSavedMsg("Saved ✓");
      refreshSaved();
      setTimeout(() => setSavedMsg(""), 2500);
    }
  }

  async function removeSaved(id: string) {
    await fetch(`/api/shortlist?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    refreshSaved();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Car<span className="text-brand">Match</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-300">
          Too many cars, no clear answer? Tell us what matters and get a ranked,
          <span className="text-white"> explained</span> shortlist — not another endless list.
        </p>
      </header>

      <Questionnaire onSubmit={handleSubmit} loading={loading} />

      {results && (
        <section id="results" className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-white">
              {results.length > 0 ? "Your top matches" : "No matches"}
            </h2>
            <span className="text-sm text-slate-400">
              {considered} car{considered === 1 ? "" : "s"} fit your filters
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-amber-200">
              Nothing fits those constraints. Try widening your budget or clearing the
              body/fuel filters.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((r, i) => (
                <ResultCard
                  key={r.car.id}
                  rank={i + 1}
                  result={r}
                  inCompare={compareIds.includes(r.car.id)}
                  onToggleCompare={() => toggleCompare(r.car.id)}
                />
              ))}
            </div>
          )}

          {compareCars.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-xl font-semibold text-white">
                Side-by-side ({compareCars.length}/3)
              </h2>
              <ComparisonTable
                cars={compareCars}
                onRemove={(id) => toggleCompare(id)}
              />
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-semibold text-white">Save this shortlist</h3>
              <p className="mb-3 text-sm text-slate-400">
                Persists your{" "}
                {compareIds.length > 0 ? "compared cars" : "top matches"} server-side so you
                can come back to them.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="e.g. Family car under 15L"
                  className="flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand focus:outline-none"
                />
                <button
                  onClick={saveCurrentShortlist}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  {savedMsg || "Save shortlist"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {saved.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold text-white">Saved shortlists</h2>
          <div className="space-y-3">
            {saved.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{s.label}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => removeSaved(s.id)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    delete
                  </button>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {s.carIds.map((id) => {
                    const c = CAR_BY_ID.get(id);
                    if (!c) return null;
                    return (
                      <li
                        key={id}
                        className="rounded-lg bg-black/30 px-2.5 py-1 text-xs text-slate-200"
                      >
                        {c.make} {c.model} · ₹{c.priceLakh}L
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 text-center text-xs text-slate-500">
        Built as a take-home MVP · {CARS.length} cars in the dataset · scores are explainable,
        not gospel.
      </footer>
    </main>
  );
}
