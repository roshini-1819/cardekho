import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Questionnaire from "./components/Questionnaire";
import ResultCard from "./components/ResultCard";
import ComparisonTable from "./components/ComparisonTable";
import AiPanel from "./components/AiPanel";
import * as api from "./lib/api";
import type { Car, Preferences } from "./lib/types";

export default function App() {
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [saveLabel, setSaveLabel] = useState("");

  const aiStatus = useQuery({ queryKey: ["ai-status"], queryFn: api.getAiStatus });
  const shortlists = useQuery({ queryKey: ["shortlists"], queryFn: api.listShortlists });

  const recommend = useMutation({
    mutationFn: (p: Preferences) => api.recommend(p),
    onSuccess: () => {
      setCompareIds([]);
      setTimeout(
        () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    },
  });

  const askAi = useMutation({
    mutationFn: (p: Preferences) => api.recommendWithAi(p),
  });

  const saveMutation = useMutation({
    mutationFn: ({ label, carIds }: { label: string; carIds: string[] }) =>
      api.saveShortlist(label, carIds),
    onSuccess: () => {
      setSaveLabel("");
      queryClient.invalidateQueries({ queryKey: ["shortlists"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteShortlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shortlists"] }),
  });

  const results = recommend.data?.matches ?? null;
  const carById = useMemo(() => {
    const map = new Map<string, Car>();
    results?.forEach((r) => map.set(r.car.id, r.car));
    return map;
  }, [results]);

  function handleSubmit(p: Preferences) {
    setPrefs(p);
    askAi.reset();
    recommend.mutate(p);
  }

  function toggleCompare(id: string) {
    setCompareIds((ids) =>
      ids.includes(id)
        ? ids.filter((x) => x !== id)
        : ids.length >= 3
          ? ids
          : [...ids, id]
    );
  }

  const compareCars = useMemo(
    () => compareIds.map((id) => carById.get(id)).filter((c): c is Car => Boolean(c)),
    [compareIds, carById]
  );

  function saveCurrentShortlist() {
    const carIds = compareIds.length > 0 ? compareIds : (results ?? []).map((r) => r.car.id);
    if (carIds.length === 0) return;
    saveMutation.mutate({ label: saveLabel, carIds });
  }

  return (
    <main className="min-h-screen w-full px-6 py-10 sm:px-10 sm:py-14 lg:px-16 xl:px-24 2xl:px-32">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Car<span className="text-brand">Match</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Too many cars, no clear answer? Tell us what matters and get a ranked,{" "}
          <span className="text-white">explained</span> shortlist — with an AI second opinion.
        </p>
      </header>

      <Questionnaire onSubmit={handleSubmit} loading={recommend.isPending} />

      {recommend.isError && (
        <p className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {(recommend.error as Error).message}
        </p>
      )}

      {results && (
        <section id="results" className="mt-12">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold text-white">
              {results.length > 0 ? "Your top matches" : "No matches"}
            </h2>
            <span className="text-sm text-slate-400">
              {recommend.data?.totalConsidered ?? 0} car
              {recommend.data?.totalConsidered === 1 ? "" : "s"} fit your filters
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-amber-200">
              Nothing fits those constraints. Try widening your budget or clearing the body/fuel
              filters.
            </div>
          ) : (
            <>
              <div className="mb-6">
                <AiPanel
                  loading={askAi.isPending}
                  data={askAi.data ?? null}
                  aiEnabled={aiStatus.data?.enabled ?? false}
                  onAsk={() => prefs && askAi.mutate(prefs)}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
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
            </>
          )}

          {compareCars.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-xl font-semibold text-white">
                Side-by-side ({compareCars.length}/3)
              </h2>
              <ComparisonTable cars={compareCars} onRemove={(id) => toggleCompare(id)} />
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-semibold text-white">Save this shortlist</h3>
              <p className="mb-3 text-sm text-slate-400">
                Persists your {compareIds.length > 0 ? "compared cars" : "top matches"} in the
                backend so you can come back to them.
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
                  disabled={saveMutation.isPending}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {saveMutation.isSuccess ? "Saved ✓" : "Save shortlist"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {(shortlists.data?.length ?? 0) > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold text-white">Saved shortlists</h2>
          <div className="space-y-3">
            {shortlists.data!.map((s) => (
              <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{s.label}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(s.id)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    delete
                  </button>
                </div>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {s.carIds.map((id) => (
                    <li
                      key={id}
                      className="rounded-lg bg-black/30 px-2.5 py-1 text-xs text-slate-200"
                    >
                      {id}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 text-center text-xs text-slate-500">
        React + Spring Boot · deterministic engine + Gemini · scores are explainable, not gospel.
      </footer>
    </main>
  );
}
