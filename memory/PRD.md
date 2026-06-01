# PRD — cre-site-intelligence (NYC Development Site Analyzer)

## Original problem statement
Build a production-quality app that takes a NYC property address and returns an AI-generated
development site assessment — zoning summary, buildable square footage (BSF), comparable sales,
and a preliminary land value range — with every claim cited to a public data source
(NYC PLUTO, ACRIS, GeoSearch) and synthesized by Claude.

## User personas
- NYC development-site broker who needs to price a site in minutes, not hours.
- Non-technical real estate professional (live 2-minute demo audience).

## Core requirements (static)
- Address → BBL geocoding (GeoSearch)
- PLUTO lot + zoning ingestion (FAR, lot area, owner, year built, land use)
- ACRIS arm's-length DEED comps (same/adjacent block, joined for price)
- Local BSF calculation (lot area × residential FAR) + residual land value range
- Claude synthesis producing source-cited JSON assessment
- Every numeric claim cited to its source
- Clean web UI + JSON payload; report history persisted

## Architecture / stack
- Backend: FastAPI (`/app/backend/server.py`) + `analyzer/` modules
  (geocoder, pluto, acris, calculator, claude_client, zoning, models, http).
- LLM: Emergent Universal Key → `claude-sonnet-4-5-20250929` via `emergentintegrations`.
- DB: MongoDB `reports` collection (uuid id, ISO created_at).
- Frontend: React + Tailwind + shadcn/sonner. Swiss/high-contrast "Control Room" design.

## What's been implemented (2026-06-01)
- Full pipeline GeoSearch → PLUTO + ACRIS (parallel) → compute → Claude synthesis.
- ASYNC JOB architecture: POST /api/analyze returns a job_id immediately; client polls
  GET /api/jobs/{id}. Avoids the 60s Kubernetes gateway timeout (some analyses take 60s+).
- Endpoints: POST /api/analyze (job), GET /api/jobs/{id}, POST /api/analyze/sync (CLI),
  POST /api/analyze/batch, GET /api/reports, GET /api/reports/{id}, GET /api/health.
- Retry/backoff on NYC APIs; graceful errors (Geocoding/PLUTO/InsufficientComps/Claude).
- Comp $/BSF enrichment via per-comp PLUTO lookup (parallel); 25th/75th percentile land value range.
- Local zoning + land-use plain-english dictionary.
- Frontend: sidebar (samples + history), hero search, terminal-style loading pipeline with
  polling, bento dashboard report with citation chips on every metric, comps table, flags.
- README, .env.example, pytest smoke tests for 5 real addresses.
- Performance optimized: Claude no longer re-emits comps (injected deterministically),
  parallel comp enrichment, tighter ACRIS → ~27s typical (was ~98s).
- VERIFIED end-to-end live in browser: 21-48 44th Drive (LIC), 365 Rutland Rd (Brooklyn, R6,
  $1.47M-$1.87M high conf), 4408 60th St (Woodside, R7X, BSF 22,000). 100% backend + frontend tests pass.

## Known constraints
- Uses Emergent Universal Key. If the key balance runs out, jobs end with status "error"
  and the UI shows a clear toast — top up via Profile → Universal Key → Add Balance.

## Update (2026-06-01b)
- Removed the "Made with Emergent" badge from `frontend/public/index.html`.
- Added Google-Maps-style live address autocomplete: backend `GET /api/suggest?q=` proxies
  NYC GeoSearch autocomplete; `HeroSearch` shows a debounced (280ms) dropdown with keyboard
  nav (↑/↓/Enter/Esc), Enter picks the first/highlighted result, click selects + analyzes.
- Portability: added `docker-compose.yml` + `backend/Dockerfile` + `frontend/Dockerfile`
  (one-command local run), `frontend/vercel.json`, `frontend/.env.example`, and a "Run it
  anywhere" README section (Docker / manual / Vercel+Railway+Atlas).
- All env-driven (MONGO_URL, DB_NAME, CORS_ORIGINS, REACT_APP_BACKEND_URL, EMERGENT_LLM_KEY) — no hardcoding.
- Tested: iteration_2.json → 100% backend (18/18) + frontend (12/12), zero bugs. Live Claude run 66s via polling.

## Update (2026-06-01c) — impressive demo features
- Removed Emergent badge; portability (Docker/compose, vercel.json, env examples).
- Live address autocomplete (`/api/suggest` + debounced HeroSearch dropdown, keyboard nav).
- REAL-TIME pipeline progress: job stores numeric `stage` (0 geocoding → 1 PLUTO+ACRIS → 2 compute → 3 Claude → 4 done); `LoadingPipeline` reflects it live.
- Interactive Leaflet MAP of the subject lot (react-leaflet@5 + OSM tiles, CircleMarker, popup).
- Recharts Comparable $/BSF BAR CHART with the applied valuation range shaded (ReferenceArea).
- Utilization bar (built vs max-buildable) in the Development card.
- PRINT / Save-as-PDF (window.print + @media print, .no-print hides chrome).
- SHARE: deep-link route `/report/:id` loads any saved report + "Copy link" button (clipboard w/ legacy fallback).
- Tested iteration_3.json: 100% backend (19/19) + frontend (11/11), zero bugs. Live Woodside run ~27s.

## Prioritized backlog
- P1: Phase 2C ACRIS deep enrichment (grantor/grantee, mortgage amount, deed PDF link).
- P1: Map preview of subject + comps (coordinates already captured).
- P2: PDF/markdown export of the assessment for sharing.
- P2: Caching of PLUTO/ACRIS responses to speed up repeat lookups (<10s target).
- P2: Multi-address batch UI.
