# CarMatch 🚗

**Turn "I don't know what to buy" into a confident, explained shortlist — with an AI second opinion.**

A buyer answers a few questions about budget, body type, fuel, seating, and
*what actually matters to them*. CarMatch returns a **ranked top-5 with a
plain-English "why this fits you"** for each car, an **AI advisor** that picks
the best 3 and explains the trade-offs, a side-by-side comparison, and a
save-able shortlist.

> Built as a take-home for the CarDekho Group "AI-Native SWE" brief.

---

## Run it locally

You need **JDK 21** and **Node 18+**. No Maven install required — the project
ships the Maven wrapper. No database to boot — H2 runs embedded.

**Terminal 1 — backend (port 8090):**
```bash
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run
```

**Terminal 2 — frontend (port 5173):**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to the
backend, so there's nothing else to configure.

### Turn on the AI advisor (optional)

The app works fully without a key — the "Ask AI" button falls back to the
deterministic engine. To get real LLM-written reasoning, grab a free
[Gemini API key](https://aistudio.google.com/apikey) and start the backend with:

```bash
# macOS/Linux
GEMINI_API_KEY=your_key ./mvnw spring-boot:run
# Windows PowerShell
$env:GEMINI_API_KEY="your_key"; .\mvnw.cmd spring-boot:run
```

---

## What I built and why

The brief: help a confused buyer go from *no idea* to *confident shortlist*.
The highest-value thing isn't more listings — it's an **opinionated, ranked,
explained recommendation**. So the product is:

1. **Guided questionnaire** — budget, body/fuel filters, seating, and six
   priority sliders (value, running cost, safety, space, performance, features)
   on a `Skip → Nice → Want → Must` scale.
2. **A deterministic recommendation engine** (`RecommendationService`) — two stages:
   - **Hard filters** drop cars that violate non-negotiables (budget, seats, fuel/body).
   - **Weighted scoring** blends six normalised sub-scores by the buyer's
     priorities into a 0–100 match score. Mileage is normalised *within fuel
     type* so a 465 km EV range isn't unfairly compared to 24 km/l petrol.
   - Every score is **explainable** — dominant factors become reasons, and a
     **caution** is raised when a car is weak on something the buyer said matters
     (e.g. a 1-star car when safety is a "Must").
3. **AI advisor** (`AiService`, the AI-native layer) — the LLM never sees the
   whole catalogue and never invents cars. The engine first filters + ranks to a
   small candidate set, and **Gemini's only job is to pick the best 3 from those
   real rows and explain the fit**. This grounds the model in our data so it
   can't hallucinate a car or a spec. If no key is set (or the call fails), it
   degrades to the deterministic engine — the feature bends, the app never breaks.
4. **Comparison** (up to 3 cars) with best-in-row highlighting.
5. **Persistence** — save a shortlist; it's stored in H2 and survives restarts.

### What I deliberately cut

- **No real car DB / scraping.** A curated, hand-checked 24-car dataset
  (`backend/src/main/resources/cars.json`) is enough to make the engine and the
  AI layer sing. A live feed is a data-pipeline problem, not a product one.
- **No auth / multi-user accounts.** Single-user advisor — shortlists are global.
- **Postgres → H2.** The brief rewards "runs in 2 minutes." H2 embedded keeps
  setup to zero services; swapping in Postgres is a dependency + a datasource
  block in `application.properties`.
- **No exhaustive test suite** — a clean typed build + a hand-verified
  end-to-end run were the guardrails that fit the timebox.

---

## Tech stack & why

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | **React + TypeScript + Vite + Tailwind + TanStack Query** | Fast dev loop; TanStack Query removes hand-rolled fetch/loading/cache state; TS types mirror the backend DTOs. |
| Backend | **Spring Boot 3 (Java 21)** | Clean layering (web → service → repo), first-class validation and JPA, the stack I'm fastest and most idiomatic in. |
| Database | **H2 (file-backed)** | Zero-setup persistence; single-command run. Postgres-swappable. |
| AI | **Gemini** (`gemini-2.0-flash`) | Generous free tier, easy REST integration; provider is isolated behind `AiService` so OpenAI/Claude are a drop-in. |
| Deploy | **Vercel (frontend) + Render (backend)** | Vite → Vercel is zero-config; Render runs the backend `Dockerfile`. |

```
backend/   Spring Boot — domain / dto / repo / service / web / config
frontend/  Vite React — lib (api + types) / components / App
```

The domain logic (`RecommendationService`, `AiService`) is cleanly separated
from thin controllers and from persistence, so the engine is unit-testable and
the data source / AI provider / DB are all swappable.

---

## AI tools vs. manual

Built with **Claude Code** driving most of the typing.

- **Where AI helped most:** scaffolding two services fast, porting the scoring
  engine from a first TypeScript pass into idiomatic Java, generating the curated
  dataset, and writing repetitive UI (questionnaire fields, comparison rows).
- **What I drove / reviewed closely:**
  - **The AI architecture** — insisting the LLM be *grounded* (pick from a
    pre-ranked candidate set, echo back only valid `carId`s) instead of a naked
    "recommend a car" prompt that can hallucinate specs. The backend ignores any
    id the model invents.
  - **Scoring design** — two-stage filter-then-rank, and normalising mileage
    *within fuel type* (the first cut compared EV range to petrol km/l).
  - **Graceful degradation** — the AI feature must never break the app, so it
    falls back to the deterministic engine on any error or missing key.
- **Where it got in the way / real debugging:**
  - `create-next-app`/scaffolders assumed interactive prompts and a lowercase dir
    name — faster to write config by hand.
  - A genuine environment fight: the machine ran out of **RAM** (capped Maven's
    heap) and out of **disk** mid-build (reclaimed space), and port 8080 was
    taken by a local Apache (moved the backend to 8090). Normal ops work, handled
    by reading the actual errors rather than guessing.
  - Fixed an ambiguous-overload compile error in the scoring service and wired
    Jackson `@JsonCreator` onto the JPA entity so the dataset deserialises.

I verified the whole thing end-to-end — API calls against the running backend and
driving the real UI in a browser — rather than trusting it "looked right."

---

## If I had another 4 hours

- **Explainability charts** — a per-car bar breakdown of factor contributions
  (the data is already in the `/api/recommend` response).
- **"Why not X?"** — let the buyer ask why a popular car *didn't* make the list.
- **Stream the AI response** token-by-token for a snappier feel.
- **Real dataset** ingested from CSV/API with images, behind the same repository.
- **Unit tests** on the scoring engine (filter edges, within-fuel-type mileage
  normalisation, caution rules) and a `@WebMvcTest` on the controllers.

---

## API quick reference

```bash
# Deterministic ranking
curl -X POST localhost:8090/api/recommend -H 'Content-Type: application/json' -d '{
  "budgetMinLakh":15,"budgetMaxLakh":30,"fuelTypes":["DIESEL"],"minSeating":7,
  "priorities":{"safety":3,"space":2,"value":1,"mileage":1,"performance":1,"features":1}}'

# AI advisor (grounded top-3 + reasoning; falls back without a key)
curl -X POST localhost:8090/api/recommend/ai -H 'Content-Type: application/json' -d '{ ...same... }'

curl localhost:8090/api/ai/status          # { "enabled": false }
curl localhost:8090/api/cars               # the catalogue

# Shortlists (persisted in H2)
curl -X POST   localhost:8090/api/shortlists -H 'Content-Type: application/json' -d '{"label":"Family","carIds":["honda-city-vx"]}'
curl           localhost:8090/api/shortlists
curl -X DELETE localhost:8090/api/shortlists/sl_xxx
```

Enum values in requests are uppercase: `bodyTypes` ∈ {HATCHBACK, SEDAN, SUV, MUV},
`fuelTypes` ∈ {PETROL, DIESEL, CNG, HYBRID, ELECTRIC}.
"# cardekho" 
