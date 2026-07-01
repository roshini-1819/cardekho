import type {
  AiRecommendation,
  Preferences,
  RecommendationResponse,
  SavedShortlist,
} from "./types";

// Same-origin by default (Vite proxies /api in dev). Override for prod builds.
const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function recommend(prefs: Preferences): Promise<RecommendationResponse> {
  return fetch(`${BASE}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  }).then((r) => json<RecommendationResponse>(r));
}

export function recommendWithAi(prefs: Preferences): Promise<AiRecommendation> {
  return fetch(`${BASE}/api/recommend/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  }).then((r) => json<AiRecommendation>(r));
}

export function getAiStatus(): Promise<{ enabled: boolean }> {
  return fetch(`${BASE}/api/ai/status`).then((r) => json(r));
}

export function listShortlists(): Promise<SavedShortlist[]> {
  return fetch(`${BASE}/api/shortlists`).then((r) => json<SavedShortlist[]>(r));
}

export function saveShortlist(label: string, carIds: string[]): Promise<SavedShortlist> {
  return fetch(`${BASE}/api/shortlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, carIds }),
  }).then((r) => json<SavedShortlist>(r));
}

export function deleteShortlist(id: string): Promise<void> {
  return fetch(`${BASE}/api/shortlists/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then((r) => {
    if (!r.ok) throw new Error("Delete failed");
  });
}
