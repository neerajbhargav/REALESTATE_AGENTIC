# REALESTATE_AGENTIC — Diagnosis, Fixes & Path to a 10/10 Demo

## TL;DR

Your repo, as pushed to GitHub, **could not run** — the backend had show-stopping
errors that prevent it from even importing. I've fixed them and verified everything
compiles. But the bigger issue is **architecture reliability on Vercel** — read
Section 3 carefully, because it's the difference between a demo that works Thursday
and one that crashes in front of the founders.

**Do this first:** open your live Vercel link right now and try a real address. I
strongly suspect it's failing. Confirm the actual current state before anything else.

---

## 1. What Was Broken (why the app couldn't run)

| # | Issue | Impact |
|---|-------|--------|
| 1 | `api/agent.py` — `get_recent_sales` had a `try:` with no `except`, and an import statement jammed mid-function | **SyntaxError — backend cannot import at all** |
| 2 | `api/tools/models.py` was **missing entirely** — every tool does `from .models import ...` | **ImportError — geocoder/pluto/acris all fail** |
| 3 | `api/tools/__init__.py` was **missing** — relative imports need package context | Fragile/broken imports on Vercel |
| 4 | `api/rag.py` split on `"\\n\\n"` (literal backslashes) instead of `"\n\n"` | Zoning RAG never found paragraphs |
| 5 | `api/zoning.txt` was a 14-line generic placeholder, no real districts (R6A, C4-2, R7X) | Weak/inaccurate zoning answers — bad in front of CRE pros |
| 6 | Heavy deps (`langgraph`, `langchain`, `pandas`, `mcp`, `fastmcp`) in the serverless function | Vercel size/cold-start risk (see Section 3) |

---

## 2. What I Fixed (in the REPO_FIXES bundle)

All files verified to compile and the data-layer import chain verified to resolve.

- **`api/tools/models.py`** (NEW) — recreated all Pydantic models (`GeoResult`,
  `PLUTOData`, `ComparableSale`) and typed exceptions used across the tools.
- **`api/tools/__init__.py`** (NEW) — makes `tools` a proper package.
- **`api/agent.py`** (FIXED) — correct syntax, clean imports, upgraded model to
  `claude-sonnet-4-5-20250929` (configurable via `ANTHROPIC_MODEL`), `max_tokens` set.
- **`api/rag.py`** (FIXED) — correct newline split.
- **`api/zoning.txt`** (ENRICHED) — real NYC districts (R1-R10, R6A/R6B/R7A/R7X,
  C4-2, M1/MX), FAR values, BSF formula, City of Yes note.
- **`api/requirements.txt`** (SLIMMED) — removed `pandas`, `mcp`, `fastmcp` (not used
  in the deployed agent path) to shrink the Vercel function.

**To apply:** copy these files into your repo at the same paths, commit, push, redeploy.

---

## 3. The Critical Architecture Decision (read this twice)

**The current setup deploys a heavy LangGraph streaming agent as a Vercel Python
serverless function. This is the single biggest reliability risk for Thursday.** Here's why:

- **Function size:** `langgraph` + `langchain-anthropic` + their transitive deps push
  toward (or past) Vercel's 250MB unzipped Python limit. Builds can fail or barely fit.
- **Cold starts:** heavy Python functions cold-start in 5-15s. The founders click your
  link, and nothing happens for 15 seconds before the agent even begins.
- **Timeout:** your agent makes 3 sequential tool calls (lookup → sales → zoning) plus a
  Claude synthesis. That's commonly 30-60s. Vercel serverless function timeouts
  (10s Hobby / 60s Pro, configurable) can cut it off mid-run.
- **SSE streaming on Vercel Python is finicky** and not its happy path.

### My recommendation — pick ONE:

**Option A (most reliable, recommended): Frontend on Vercel + backend you control.**
- Deploy the React frontend to Vercel (static, fast, bulletproof).
- Run the Python backend either (a) **locally on your laptop during the in-person demo**
  — you're in the room, you fully control it, zero serverless limits — or (b) on
  **Railway / Render**, which run real long-lived Python servers and handle LangGraph fine.
- Point the frontend at the backend URL via an env var.
- **This is what I'd do.** It removes every Vercel-Python failure mode. For an in-person
  demo, running the backend on your laptop (with the frontend either local or on Vercel)
  is completely legitimate and the safest possible setup.

**Option B (if you insist on all-Vercel): test it relentlessly.**
- Apply the fixes, redeploy, and run all 5 test addresses on the live link repeatedly.
- Set `maxDuration` in `vercel.json` and confirm you're on a plan that allows 60s.
- If any run times out or cold-starts painfully, fall back to Option A.

**Either way:** the demo must run flawlessly 5+ times in a row before Thursday, or you
lead with VIBETTER instead.

---

## 4. Path to a 10/10 Demo (prioritized)

Right now, even when running, the app only **streams markdown text**. You have gorgeous
unused components (`CompsTable`, `DevelopmentCard`, `LandValueCard`, `FlagsCard`, maps,
charts) sitting orphaned in `src/components/report/`. Wiring them is what takes this from
"nice" to "wow."

### P0 — Make it run (done in fixes; you deploy + verify)
- Apply REPO_FIXES, set `ANTHROPIC_API_KEY` in your backend env, redeploy.
- Verify all 5 test addresses run end-to-end.

### P1 — Structured output + wire the rich dashboard (biggest visual win)
The agent currently emits freeform markdown. To populate the dashboard cards, have the
final agent step return **structured JSON** (zoning, BSF, comps[], land value, flags),
then render the existing `report/` components instead of raw markdown.
- Easiest approach: after the agent finishes its tool calls, make one final Claude call
  with a strict JSON schema (you already specced this in the original build prompt) and
  render the cards from that JSON.
- This unlocks the citation chips, the comps table, the dev-potential card — the stuff
  that looks like a real product.

### P2 — Wire the map + chart (you already have the libraries)
- `react-leaflet` is installed → drop a `<MapContainer>` with a marker at the subject
  lot's lat/lon (geocoder already returns them).
- `recharts` is installed → a bar chart of comp $/BSF with the valuation range shaded.

### P3 — Polish for the demo
- Show the **agent's live tool-calling** in the loading pipeline ("Running tool:
  lookup_property... ✓", "get_recent_sales... ✓"). This is your "agentic" money shot —
  it visibly proves autonomous tool use, which is exactly what the JD asks for.
- A clean empty state with the 5 sample NYC addresses as clickable chips.
- Make sure the README has a real screenshot and a one-line live link at the top.

### P4 — Nice-to-haves if time
- Report history (currently a stub) using localStorage — NOT browser storage if deploying
  as an artifact, but fine in a real Vercel app.
- "Copy shareable link" per report.

---

## 5. Pre-Flight Checklist (do before Thursday)

- [ ] Live link loads in under 3 seconds
- [ ] All 5 test addresses (LIC, Astoria, Rutland Rd, Forest Hills, Woodside) run cleanly
- [ ] Each run completes in under ~30s with visible progress (no dead-air)
- [ ] Comps actually appear (ACRIS is the flakiest part — verify)
- [ ] Citations show on the numbers
- [ ] Works on your laptop's browser specifically, on the venue's likely network
- [ ] You can run it 5x in a row with zero failures
- [ ] README is clean with a screenshot and the live link
- [ ] GitHub repo is pinned on your profile
- [ ] Backup: screen recording of a successful run saved locally + VIBETTER ready

---

## 6. The 2-Minute Demo Script

**[0:00]** "Pricing a development site means pulling zoning, computing buildable square
footage, finding comps, and running land-value math — hours of manual work. This does it
autonomously in under 30 seconds. I'll use one of your actual listings."

**[0:10]** Type a real Landair address (e.g. 21-48 44th Drive, LIC).

**[0:15]** "Watch the agent — it's deciding which tools to call. It geocodes to a BBL,
pulls PLUTO for zoning and FAR, queries ACRIS for nearby deed sales, checks the zoning
code — all autonomously. This is a LangGraph agent with tool-calling, not a fixed script."

**[0:35]** Result renders. Point to: zoning + FAR (cited to PLUTO), the BSF calc, the
comps table (cited to ACRIS document IDs), the value range, the risk flags.

**[1:10]** "Every number is cited to its public-record source — it can't hallucinate a
FAR, it has to show its work. That verification discipline is the same principle I used
at T-Mobile to cut wrong answers 60%."

**[1:40]** "This is v1, built this week specifically to show you the pattern. In a Landair
context it's the underwriting layer under the marketplace — knowing exactly what's
buildable on every lot is where the buyer-profile matching starts."

---

## 7. The Bail-Out Rule

By **10 PM Wednesday**, if you cannot run the live demo flawlessly 5 times in a row,
lead with VIBETTER and mention this project as "something I prototyped this week to
explore your exact problem space" — still a strong signal, zero crash risk.

A calm, working VIBETTER demo beats a half-working flashy one. Decide honestly Wednesday night.
