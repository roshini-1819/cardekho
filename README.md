# CarMatch 🚗

**Turn "I don't know what to buy" into a confident, explained shortlist.**

A car buyer answers a few questions about budget, body type, fuel, seating, and
*what actually matters to them* — and CarMatch returns a **ranked top-5 with a
plain-English "why this fits you"** for each car, a side-by-side comparison, and
a save-able shortlist.

> Built as a 2–3 hour take-home for the CarDekho Group "AI-Native SWE" brief.

---

## Run it in under 2 minutes

```bash
npm install
npm run dev
# open http://localhost:3000
```

No database, no env vars, no external services. That's deliberate (see below).

---

## What I built and why

The brief is "help a confused buyer go from *no idea* to *confident shortlist*."
The single highest-value thing for a confused buyer isn't more listings — it's a
tool that **takes their messy preferences and gives an opinionated, ranked,
*explained* recommendation.** So that's the core:

1. **Guided questionnaire** — budget range, body/fuel filters, seating, and six
   priority sliders (value, running cost, safety, space, performance, features)
   on a `Skip → Nice → Want → Must` scale.
2. **A real recommendation engine** (the non-trivial backend) — two stages:
   - **Hard filters** drop cars that violate non-negotiables (budget, seats, fuel/body).
   - **Weighted scoring** blends six normalised sub-scores by the buyer's
     priorities into a 0–100 match score. Mileage is normalised *within fuel
     type* so a 465 km EV range isn't unfairly compared to 24 km/l petrol.
   - Every score is **explainable** — the engine surfaces the dominant factors as
     reasons, and raises a **caution** when a car is weak on something the buyer
     said they care about (e.g. a 1-star car when safety is a "Must").
3. **Side-by-side comparison** (up to 3 cars) with best-in-row highlighting.
4. **Persistence** — save a shortlist; it's stored server-side via an API and
   survives restarts.

### What I deliberately cut

- **No real car DB / scraping.** A curated, hand-checked 25-car dataset
  (`src/lib/cars.ts`) of the actual Indian market is enough to make the engine
  sing. A live dataset is a data-pipeline problem, not a product problem, and
  wasn't where the value was for this timebox.
- **No auth / multi-user accounts.** Shortlists persist to a JSON file — right-
  sized for a single-user advisor. Swapping the store for Postgres is a one-file
  change (`src/lib/store.ts`).
- **No LLM in the loop.** The "intelligence" here is a transparent scoring
  engine, not a chatbot. For *"which car is right for me"* a deterministic,
  explainable ranker beats a black box — and it can't hallucinate a spec.
- **No pixel-perfect polish, no charts library, no test suite for everything.**
  Type-checking + lint + a clean build are the guardrails I had time for.

---

## Tech stack & why

| Choice | Why |
| --- | --- |
| **Next.js 14 (App Router) + TypeScript** | One repo = frontend + backend (API routes). Single `npm run dev`, one-click Vercel deploy. TS gives the scoring engine real types end-to-end. |
| **Tailwind** | Fast, consistent styling without leaving the markup — ideal for a timeboxed build. |
| **File-backed JSON store** | Zero infrastructure to boot. Keeps "runs in 2 minutes" true. |

The architecture keeps the domain logic (`src/lib/`) cleanly separated from the
API routes (`src/app/api/`) and the UI (`src/components/`), so the engine is
unit-testable and the data source / store are swappable.

```
src/
  lib/         types, dataset, recommendation engine, persistence  ← pure logic
  app/api/     /recommend (scoring) + /shortlist (CRUD)            ← thin handlers
  components/  Questionnaire, ResultCard, ComparisonTable          ← presentation
```

---

## AI tools vs. manual

This was built with **Claude Code** driving most of the typing.

- **Where AI helped most:** scaffolding the Next.js project by hand after
  `create-next-app` choked on the capitalised folder name; generating the
  curated dataset with realistic specs; and writing the repetitive UI
  (questionnaire fields, comparison rows) fast.
- **What I drove / reviewed closely:** the **scoring design** — deciding on
  two-stage filter-then-rank, normalising mileage *within fuel type* (the model's
  first cut compared EV range to petrol km/l, which is nonsense), and the rule
  that an explicit safety priority should raise a *caution* on weak cars rather
  than silently bury them. Those are product judgments, not autocomplete.
- **Where it got in the way:** the default scaffolder assumed an interactive
  prompt and a lowercase dir name; faster to write the config files directly.

I verified the whole thing end-to-end by driving the running app (API calls +
browser screenshots) rather than trusting that it "looked right."

---

## If I had another 4 hours

- **Explainability charts** — a small bar breakdown per car showing exactly how
  much each factor contributed (the data is already in the API response).
- **"Why not X?"** — let the user ask why a popular car *didn't* make their list.
- **Real dataset** ingested from a CSV/API with a nightly refresh, plus images.
- **Shareable shortlist URLs** and a proper DB (Postgres) behind the same store
  interface.
- **A handful of unit tests** on the scoring engine (filter edge cases, the
  within-fuel-type mileage normalisation, caution rules).

---

## API quick reference

```bash
# Recommend
curl -X POST localhost:3000/api/recommend -H 'Content-Type: application/json' -d '{
  "budgetMinLakh": 15, "budgetMaxLakh": 30, "fuelTypes": ["Diesel"],
  "minSeating": 7, "priorities": {"safety":3,"space":2,"value":1,"mileage":1,"performance":1,"features":1}
}'

# Save / list / delete a shortlist
curl -X POST   localhost:3000/api/shortlist -H 'Content-Type: application/json' -d '{"label":"Family","carIds":["honda-city-vx"]}'
curl           localhost:3000/api/shortlist
curl -X DELETE 'localhost:3000/api/shortlist?id=sl_xxx'
```
