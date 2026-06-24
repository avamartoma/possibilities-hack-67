# Plan: Career Map v4 — Real UI, Curiosity Guide, Goals-Over-Time

## Context
v3 shipped a 207-role catalog, FIFA-card modal, weighted readiness, and a top-applicant feed.
Testing surfaced four problems and three new wants:

1. **Career Guide duplicates the jobs page.** It shows "jobs you'd be a top applicant for" — wrong audience. The Guide is for people who *don't* know what they want; it should surface roles to **learn from / get curious about**, not high-fit jobs.
2. **Discover looks "grey-ish."** Confirmed: the grid renders up to 100 cards but readiness only loads for the top 20 (`recommend` limit), so ~80 cards show a grey "—" badge (`ExploreView.tsx:129-130,145-147`).
3. **Lots of fake UI.** `LinkedInNav` nav icons / search / "Me ▾" are dead chrome; `MilestoneView` uses a hardcoded `COMPANIES` array + generic "Opportunity N" labels; a whole dead drill-down subsystem still ships (`RoleDetail`, `lib/explore/*`, `careerMatcher`, Explore subcomponents).
4. **Too many clicks; no memory.** Every visit starts cold.
5. **Milestones page is thin.** One-shot list, no dates, no persistence (`completionState` is always `"not_started"` and ignored), no progress-over-time. The unused `milestone_generator.py` already blueprints a quarterly multi-year roadmap.
6. **Bring back Opportunities.** Namyanzi's old `namyanzie-milestones` branch had an Opportunity card (QuestBridge, Code2040, NASA SEES, Coca-Cola Scholars …) shaped `{name, desc, fit, skills}`. Regenerate a few hundred non-traditional opportunities and surface them on the timeline.

Outcome: a Guide that broadens, a Discover that never looks broken, real navigation, a 2–3-click + resume experience, and a Milestones page that becomes a living goal tracker with opportunities.

**Constraints (unchanged):** no DB, no auth, no scraping, no external LLM. Client persistence via **localStorage only** (client UI state, not a server DB — allowed). Opportunities are **generated seed data**, not scraped. Legacy `/api/fit` + `/api/milestones` stay compatible. Strict red→green→refactor; 100% coverage gate continues; new files added to `vitest.config.ts` include.

First step on execution: copy this plan to `docs/PLAN-career-map-v4.md` and append per-track changelog stubs.

---

## Decisions locked
- Career Guide → **curiosity/stretch roles** (low-fit + adjacent + new-industry), auto rail + keep prompt.
- Discover grey → **drop the grid % badge; show industry + "N open roles"**; readiness % stays in the FIFA modal. No backend change for the grey fix.
- Static UI → **make as real as possible.**
- Resume → persist last location in localStorage; second "Lock In" resumes where you left off.

---

## Ownership
- **Track A (me):** Career Guide UI, Discover grey fix, `LinkedInNav` real nav, AppFlow resume, `lib/persistence.ts`, dead-code deletion. Owns `lib/*`, `AppFlow`, `ExploreView`, `ExplainView`, `LinkedInNav`, `RoleFifaCard`, Vitest config.
- **Track B (friend):** `explore-breadth` endpoint, opportunities dataset + endpoint, Milestones-page overhaul (`MilestoneView` + `app/milestones/*`), `MilestoneView` de-fake. Owns `ComparisonPanel`, `MilestoneView`, `backend/comparison.py`/`pathing.py`/`jobs.py`/`opportunities.py`, `docs/changelog/track-b.md`.
- Shared contracts land in `lib/types.ts` + `lib/api.ts` (Track A owns; publish early).

---

## Workstream A — Career Guide reframe (curiosity, not top-fit)

### A1 (backend, friend) — `POST /api/roles/explore-breadth`
New `recommend_exploratory_roles(profile, roles, limit)` (extend `backend/comparison.py`; reuse the `recommend_roles` scaffolding + `RELATED` in `roles.py` + `INDUSTRY_SKILLS` in `precompute.py`):
- Rank to **reward** adjacency (`RELATED`) + **industry novelty** (role's primary industry not implied by the user's skills via `INDUSTRY_SKILLS`) and **penalize** high overlap; prefer readiness in a "learnable but stretch" band (~10–45%).
- Each result carries an `exploreReason` (e.g. "New industry: Design", "Adjacent to your current skills", "Stretch — 1 shared skill") and `readinessScore`.
- New `ExploreBreadthRequest` schema; endpoint in `main.py`.
- RED tests (`test_explore.py`): returns roles NOT identical to top-applicant ordering; prefers new-industry/adjacent; excludes the user's already-high-fit roles; limit respected; unknown user → 404; override re-ranks without seed mutation.

### A2 (frontend, me) — ExplainView curiosity rail
- Replace the top-applicant scroller with a **"Roles to get curious about"** rail backed by `exploreBreadth({userId, limit})`; each card shows role name + `exploreReason` + "Explore this role →" → FIFA modal. Keep the free-text prompt + recommendations below.
- Remove `getTopApplicantJobs` usage from the Guide (top-applicant stays available elsewhere if wanted, but NOT here — no duplication of the jobs surface).
- Contract: `ExploreRole` type + `exploreBreadth()` client helper (`lib/types.ts`, `lib/api.ts`, api.test.ts).
- RED tests (ExplainView.test.tsx): loads curiosity rail on entry; renders exploreReason; "Explore this role" → modal → compare; loading/empty/error+retry; prompt flow unchanged; does NOT call `getTopApplicantJobs`.

---

## Workstream B — Discover grey fix (me, no backend)
- `ExploreView` `RoleCard`: remove the readiness badge + the `recommend` lookup entirely from the grid. Show **industry** (`role.industries[0]`/`category`) + **"{jobCount} open roles"** (already present, never grey). Readiness % remains in the FIFA modal (`compareRole`, accurate per-role).
- Drop `RECOMMEND_LIMIT`/readiness state from ExploreView → simpler, fewer calls, zero grey "—".
- Soften remaining legitimate empty states ("New territory" etc.) only if trivial — not required.
- RED tests: grid cards show industry + open-role count, never "—"; no `recommendRoles` call from Discover; modal still opens with readiness; load-more + search unchanged.

---

## Workstream C — Make the static UI real (me + friend)

### C1 (me) — `LinkedInNav` real navigation
- Logo + "Home" → app home (landing/resume). "Jobs" → Discover. Header **search** becomes a real input that routes to Discover with the query prefilled. "Me ▾" → a small real menu (e.g., "View profile" → landing profile; "Restart" → clears saved session). Remove `cursor:pointer`/hover affordances from anything still inert.
- Nav needs callbacks (`onHome`, `onJobs`, `onSearch`, …) wired through AppFlow (Track A owns both).
- RED tests (LinkedInNav.test.tsx): each wired control fires its callback; search submits the query; no inert element advertises clickability.

### C2 (friend) — `MilestoneView` de-fake
- Replace hardcoded `COMPANIES` array + "Opportunity N" with real data: milestone `title`/`targetSkill` as the heading and the course provider (or skill) as the avatar source. (Part of Workstream E anyway.)

### C3 (me) — delete dead code
- Remove unused: `components/Explore/{RoleDetail,RoleList,FieldList,BubbleGrid,Breadcrumb,UserPicker}.tsx`, `lib/explore/{buildTree,eligibility,taxonomy,data,ui}.ts`, `lib/explain/careerMatcher.ts`, `lib/fit.ts` if no longer referenced. Confirm zero imports first (grep); keep guard tests where v2 referenced removal. Update `next.config.js` `externalDir` only if it becomes unused.

---

## Workstream D — Minimize clicks + resume (me)

### D1 — `lib/persistence.ts` (pure, client-only, localStorage)
- `loadSession(): {step, userId, roleId, origin} | null`, `saveSession(s)`, `clearSession()`, plus milestone completion: `loadCompleted(userId, roleId): number[]`, `toggleCompleted(userId, roleId, order)`. Guard against SSR (`typeof window`), JSON-parse failures. Pure + fully unit-testable (jsdom localStorage).
- RED tests (persistence.test.ts): round-trip save/load; corrupt JSON → null; SSR-safe (no window) → null/no-throw; completion toggle add/remove; namespaced by user+role.

### D2 — AppFlow resume
- On mount, after profile loads, read `loadSession()`. Landing CTA: **new user** → "Lock In" → Explore; **returning user with saved step** → "Resume → {last place}" jumps straight to the saved step (e.g. Milestones). Persist `{step, roleId, origin}` on every transition.
- Keeps a new person at 2–3 clicks to a role (Lock In → Discover → role card → Compare), and returning users at **1 click** to where they left off.
- RED tests (AppFlow.test.tsx): no saved session → standard flow; saved session → Resume CTA jumps to saved step with role preserved; transitions write session; "Restart" clears it.

---

## Workstream E — Milestones / Goals over-time overhaul (friend)

### E1 — Opportunities dataset (generated, not scraped)
- `backend/opportunities_gen.py` (precompute-style, deterministic): expand Namyanzi's 6 seeds into **~300** non-traditional opportunities across categories (scholarships, fellowships, cohorts/bootcamps, research programs, competitions, leadership programs) by combining authored templates × orgs × fields. Emit `backend/data/opportunities.json`.
- Shape: `{id, name, organization, type, desc, award?, eligibility[], skills[], deadline, category, link?}`.
- `POST /api/opportunities {userId, profileOverride?, limit?}` → opportunities ranked by skill-overlap fit% (reuse the readiness/overlap idea), each with `fit` + matched/missing skills. Sorted by fit (and/or deadline).
- RED tests (test_opportunities.py): dataset ≥ 200 with full shape + deterministic ids; endpoint ranks by fit; matched/missing skills correct; unknown user → 404; limit respected.

### E2 — Milestones page becomes a living tracker (`MilestoneView` + `app/milestones`)
- **Phased timeline:** group the `generatePath` milestones into time phases (deterministic from `order`: "Next 4 weeks" / "This quarter" / "6 months") with target-date labels. (Optionally fold in `milestone_generator.py`'s quarterly arc later — out of scope for v4 unless cheap.)
- **Persistence + progress:** completion checkboxes persist via `lib/persistence.ts` (D1), survive reload, namespaced by user+role; show "X of N done", a progress ring, completed section, and "last check-in" date.
- **Opportunities rail:** reuse Namyanzi's Opportunity card (title, org, desc, fit bar, matched/missing skill chips, deadline) fed by `POST /api/opportunities`; scrollable.
- De-fake (C2) folded in here.
- RED tests (MilestoneView.test.tsx + page): renders phases + dates; checkbox persists across remount (localStorage mock); progress count/ring reflects completed; opportunities rail renders ranked cards + fit bars; loading/empty/error per async boundary; no hardcoded COMPANIES/"Opportunity N".

---

## Contract additions (frozen, `lib/types.ts`)
- `ExploreRole = { role: CareerRole; exploreReason: string; readinessScore: number }` (+ `exploreBreadth()` client helper).
- `Opportunity = { id; name; organization; type; desc; award?; eligibility[]; skills[]; deadline; category; link? }` and `OpportunityMatch = Opportunity & { fit: number; matchedSkills: string[]; missingSkills: string[] }` (+ `getOpportunities()` helper).
- Session/persistence types live in `lib/persistence.ts`.

## Coverage / gate (unchanged)
- Append new files to `vitest.config.ts` include: `lib/persistence.ts` (Track A); `app/milestones/**`, opportunities UI (Track B).
- Backend new modules (`explore`/`opportunities`/gen) at 100%.
- Before every PR: backend `coverage … --fail-under=100`; `npm run test:run && test:cov && build`.

## Sequencing
1. **Contracts first** (me): publish `ExploreRole`/`exploreBreadth`, `Opportunity(Match)`/`getOpportunities` types + `lib/persistence.ts` so both tracks build against them.
2. Parallel: A (Guide), B (grey), C1/C3 (nav + dead code), D (resume) — me. A1 (explore-breadth), E1 (opportunities data+endpoint), E2 (milestones overhaul + C2) — friend.
3. Integrate on `feature/v2-contract-base`; fold changelogs into `CHANGELOG.md [4.0.0]`.

## Verification (end-to-end)
- Backend: `./.venv/bin/python -m unittest backend.test_* -v` + `coverage report --fail-under=100`. Live smoke: `make api` then curl `/api/roles/explore-breadth` (returns NON-top-applicant roles), `/api/opportunities` (ranked, ~300 dataset), `/api/path/generate`.
- Frontend: `npm run test:run && test:cov && build`. Manual: `make frontend` →
  - Discover: cards show industry + "N open roles", **no grey "—"**; click → FIFA modal with real readiness.
  - Career Guide: a "Roles to get curious about" rail (new-industry/adjacent), NOT the jobs page; prompt still works.
  - Nav: logo→home, search→Discover, Me menu real.
  - Milestones: phased timeline with dates, checkboxes persist across reload, progress ring, Opportunities rail (QuestBridge-style) ranked by fit.
  - Resume: leave on Milestones, reload / re-enter → "Resume" lands back on Milestones (1 click).
