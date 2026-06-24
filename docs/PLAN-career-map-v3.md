# Plan: Career Map v3 — Catalog Depth, FIFA Cards, Honest Readiness

Builds on the shipped v2 (`feature/v2-contract-base`, 100% backend + frontend coverage).
Same hard rules carry over: **strict red→green→refactor**, **every function/route/component/page unit-tested**,
100% coverage gate, no DB/auth/scraping/LLM, legacy `/api/fit` + `/api/milestones` stay compatible.

## Decisions locked (2026-06-24)
1. **Catalog** — all **207 distinct positions** from `sample_data/jobs_data.json` (1000 postings, 21 industries) become roles, alongside the 10 canonical skilled roles. Search becomes necessary.
2. **Readiness** — deterministic **industry→skill map + position-keyword skills**, weighted core vs supporting, normalized + clamped 0–100. Replaces the raw `matched/required` ratio.
3. **FIFA card** — **centered modal overlay** (dim backdrop, X / Esc / backdrop-click close), no navigation, reused by Discover + Career Guide.

## Vocabulary
- **Discover** = the Explore page (`ExploreView`) — "Discover where you could go".
- **Career Guide** = the Explain page (`ExplainView`).
- **Compare** = `ComparisonPanel`. **Your Path** = `MilestoneView`.

---

## Data foundation (jobs have no skills field — this is the crux)

`jobs_data.json` postings carry `position, company, location, salary_range, industry, level, easy_apply, description` — **no skills**. The 30-term user-skill universe lives only on users + the 10 canonical roles. So every derived role needs skills assigned deterministically:

- **`INDUSTRY_SKILLS`** — a hand-authored table mapping each of the 21 industries → its core skills (drawn from the 30-skill universe), e.g. `Technology → [Software, Computer, Technology, AWS, DevOps]`, `Finance → [Corporate Finance, Financial Modeling, Investing, Economics]`.
- **`KEYWORD_SKILLS`** — position-title keyword → skill, e.g. `"engineer" → Engineering`, `"data"/"analyst" → Information`, `"nurse"/"clinical" → Nursing`. Supplements industry skills.
- A role's **core skills** = industry skills; **supporting skills** = keyword-derived extras. Both deterministic and unit-tested against fixed positions.

This table is the single source of truth for fit; it makes readiness explainable and testable.

---

## Workstreams (each test-first; tests listed are the RED specs)

### W1 — Backend: 207-role catalog `precompute` (owner: backend)
Extend `backend/precompute.py` to emit an expanded catalog (new `backend/data/rolesCatalog.json`) keyed by slug(position):
- Aggregate per position: `postings[]` (real), `companies` (distinct), `salaryFrom/To` (min/max across postings), `levels` (distinct), `industries`, `jobCount`, `easyApplyPct`.
- Attach `skills` via `INDUSTRY_SKILLS ∪ KEYWORD_SKILLS`; tag each as `core`/`supporting`.
- **Union with the 10 canonical roles**, deduped by slug; canonical ids (`data_scientist`, …) preserved so legacy routes + v2 tests keep resolving.
- `main.py` loads the expanded catalog into `ROLES`; `/api/fit` + `/api/milestones` still work on canonical ids.

RED tests (`test_logic.py` / `test_api.py`):
- catalog has ≥ 200 roles; every entry has the full shape (postings, salary, levels, industries, jobCount, skills with core/supporting tags).
- canonical ids (`data_scientist`) still present and unchanged in shape.
- a known position (e.g. "Environmental Scientist") resolves with its real postings + industry skills.
- slugger is deterministic + collision-free on the 207 names.
- `INDUSTRY_SKILLS` covers all 21 industries (no industry → empty skills).
- empty search still returns a catalog page; legacy `/api/fit` regression intact.

### W2 — Backend: honest weighted readiness (owner: backend)
New `backend/readiness.py::compute_readiness(profile_skills, role)` → int 0–100:
```
core_hit    = |core ∩ user| / |core|         (0 if no core)
support_hit = |support ∩ user| / |support|   (0 if no support)
readiness   = round(100 · (W_CORE·core_hit + W_SUP·support_hit) / (W_CORE + W_SUP'))
```
- case/whitespace-normalized; synonym-folded (small `SKILL_SYNONYMS` map, e.g. "Comp Sci"→"Computer").
- supporting term ignored in denominator when a role has none (no free penalty).
- clamped [0,100]; deterministic. Used by **both** `compare_profile_to_role` and `recommend_roles` (replaces the inline ratio).

RED tests:
- all-core-match → 100; no-match → 0; half-core → ~50 band.
- core weighted higher than supporting (same overlap count, core role scores higher).
- case + synonym variants don't change the score.
- role with no supporting skills isn't penalized.
- empty required skills → 0 (no crash).
- `compare` + `recommend` now return the weighted score (regression: monotonic — adding a matching skill never lowers readiness).

### W3 — Backend: top-applicant jobs (owner: backend)
`POST /api/jobs/top-applicant { userId, profileOverride?, limit? }` → ranked real postings where the user fits best:
- score each posting by its role's readiness + industry/level alignment; return `{ jobs: Posting[]+score+roleId, total }`, sorted desc.
- "top applicant" flag when score ≥ threshold. Scrollable list (limit default 25).
- request-scoped overrides; no peer data.

RED tests:
- returns postings sorted by descending fit; each carries roleId + score + topApplicant bool.
- user with Finance skills surfaces Finance postings above unrelated ones.
- limit respected; unknown user → 404; override changes ranking without seed mutation.

### W4 — Frontend: shared `RoleFifaCard` modal (owner: frontend; BLOCKS W5/W6)
New `components/RoleCard/RoleFifaCard.tsx` — centered overlay:
- props `{ roleId, userId, onClose, onCompare }`; fetches `getRole` (+ readiness via recommend/compare-lite) on open.
- FIFA-style: big readiness ring, role name/industry, core vs supporting skill chips (owned/missing colored), salary, top companies, scrollable real postings list, primary CTA **"Compare your profile to this role"** → `onCompare(roleId)`.
- close via X button, Esc key, backdrop click; focus-trap; `role="dialog"` + `aria-modal`.

RED tests (`RoleFifaCard.test.tsx`):
- opens with loading → renders role detail + readiness ring.
- Esc / backdrop / X each call `onClose`; clicking inside the card does NOT close.
- owned vs missing skills rendered distinctly; postings list scroll container present.
- CTA fires `onCompare(roleId)`.
- error + retry on fetch failure.

### W5 — Frontend: Discover overhaul (owner: frontend; after W1, W4)
`ExploreView`:
- load the **full catalog** (paginate/virtualize — show first N, "load more" or windowed scroll); search-as-filter is now meaningful.
- card click opens **`RoleFifaCard` modal** (no navigation, no AppFlow step change).
- modal CTA "Compare your profile to this role" → AppFlow `comparison` with that roleId.
- keep debounced search; readiness badges from recommend lookup over the larger set.

RED tests:
- renders a page of many roles; typing filters via `/api/roles/search`.
- clicking a card opens the modal (role detail visible), does not navigate.
- modal Compare CTA transitions AppFlow to comparison with the role id.
- pagination/"load more" reveals additional roles; empty/error/retry preserved.

### W6 — Frontend: Career Guide overhaul (owner: frontend; after W3, W4)
`ExplainView`:
- **"Explore this Role" opens the `RoleFifaCard` modal** (centered) instead of the scroll-down explanation section — remove the inline explanation panel.
- add a **Top-applicant jobs scroller** (from `POST /api/jobs/top-applicant`) — horizontally/vertically scrollable real postings the user fits.
- prompt → recommend still ranks roles; each recommendation's "Explore this role" → modal.

RED tests:
- prompt → recommendations; "Explore this role" opens modal (not a scroll section).
- top-applicant scroller renders ranked jobs; loading/empty/error states.
- modal Compare CTA hands role id to AppFlow.

### W7 — Frontend: Compare focus + rename (owner: frontend)
- Button label everywhere: **"Compare your profile to this role"** (Explore modal, Guide modal, Explain).
- Compare page (`ComparisonPanel`) stays **single-role focused** — confirm it renders only the selected role (no list of other roles). Add a regression test asserting no multi-role list is present.

RED tests:
- the CTA copy is exactly "Compare your profile to this role".
- ComparisonPanel shows exactly one role's data; no sibling-role list rendered.

---

## Contract additions (frozen, `lib/types.ts`)
- `CareerRole.skills` gains per-skill role tags OR add `coreSkills: string[]` + `supportingSkills: string[]`.
- `TopApplicantJob = Posting & { roleId: string; score: number; topApplicant: boolean }`.
- `RoleRecommendation.readinessScore` semantics now = weighted model (value range unchanged 0–100).

## Coverage / gate (unchanged, extended)
- Append new files to `vitest.config.ts` `include`: `components/RoleCard/**`, plus any new helpers.
- Backend: new `readiness.py`, expanded `precompute.py`, top-applicant handler all at 100%.
- Gate before every PR: backend unittest+coverage `--fail-under=100`; `npm run test:run && test:cov && build`.
- Every defect found in manual demo → failing regression test first.

## Parallelization
| Wave | Backend track | Frontend track |
|------|---------------|----------------|
| 1 | W1 catalog, W2 readiness (contract) | W4 RoleFifaCard modal (shared, blocks W5/W6) |
| 2 | W3 top-applicant endpoint | W5 Discover overhaul |
| 3 | — | W6 Career Guide overhaul, W7 Compare rename |

W4 depends only on existing `getRole`/recommend contracts → starts immediately, parallel to backend. W5 needs W1+W4; W6 needs W3+W4.

## Acceptance (manual, v3)
Discover shows 200+ roles, search filters them → click a role → **FIFA card modal** opens centered with readiness ring + real postings → **"Compare your profile to this role"** → single-role Compare → Build path.
Career Guide: prompt → recommendations + a **top-applicant jobs** scroller → "Explore this role" opens the same modal.
Readiness scores are stable, explainable, and never drop when a matching skill is added.

## Open items to confirm during build
- Discover scale strategy: simple "load more" vs windowed virtualization (recommend: load-more page of ~30, simplest + testable).
- `INDUSTRY_SKILLS`/`KEYWORD_SKILLS` exact contents — draft in W1, review once.
- Whether top-applicant scroller also appears on Discover (currently Career Guide only).
