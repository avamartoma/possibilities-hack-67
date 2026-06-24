# Career Map v3 — Handoff & Ownership

Read first: `docs/PLAN-career-map-v3.md` (full spec + RED test lists). This file is the "who does what / how to start" companion.

## Branch
Same model as v2 — everyone works on **`feature/v2-contract-base`** (it now carries the full shipped v2).
```
git checkout feature/v2-contract-base
git pull --rebase origin feature/v2-contract-base   # always pull before starting
```
Pull again before each session; conflict-prone shared files are `frontend/lib/types.ts` and `frontend/vitest.config.ts`.

## Ownership split

### Friend — Backend (W1, W2, W3). Land these FIRST; they are the contract the frontend builds on.
- **W1 — 207-role catalog.** Extend `backend/precompute.py` → `backend/data/rolesCatalog.json`; author `INDUSTRY_SKILLS` (all 21 industries) + `KEYWORD_SKILLS`; union with the 10 canonical roles (preserve their ids); load into `main.ROLES`. Keep `/api/fit` + `/api/milestones` working.
- **W2 — honest readiness.** New `backend/readiness.py::compute_readiness` (weighted core/supporting, case+synonym-folded, clamped, monotonic). Wire into `compare_profile_to_role` + `recommend_roles`.
- **W3 — top-applicant jobs.** `POST /api/jobs/top-applicant` → ranked real postings + score + `topApplicant` flag.
- Do NOT touch the frontend `RoleFifaCard`/Discover/Guide files (Muhammed owns).
- Files you own: `backend/precompute.py`, `backend/readiness.py` (new), `backend/data/rolesCatalog.json`, `backend/main.py` (route wiring for W3), `backend/test_*.py` (your sections), `docs/changelog/track-b.md`.

**Publish the contract early** so frontend can start: the expanded `CareerRole` shape (add `coreSkills`/`supportingSkills`), `TopApplicantJob`, and confirm `readinessScore` stays int 0–100. Put these in `frontend/lib/types.ts` in your first small commit (or coordinate with Muhammed who owns that file) so W4/W5/W6 have types to code against.

### Muhammed — Frontend (W4, W5, W6, W7)
- **W4** shared `RoleFifaCard` modal (starts immediately, only needs existing `getRole`/recommend). Blocks W5/W6.
- **W5** Discover overhaul (needs W1 catalog + W4). **W6** Career Guide overhaul (needs W3 + W4). **W7** Compare rename + single-role focus.
- Owns `frontend/lib/types.ts`, `frontend/lib/api.ts`, `frontend/vitest.config.ts`, `components/RoleCard/**`, `ExploreView`, `ExplainView`, `AppFlow`.

## Test-first, always
RED → GREEN → REFACTOR. Each workstream's RED specs are in the plan. Every new function/route/component/page gets tests in the SAME commit. 100% coverage gate stays.

Add new files to coverage scope:
- Frontend: append `components/RoleCard/**` (+ any helpers) to `vitest.config.ts` `include`.
- Backend: `readiness.py` + expanded `precompute.py` + top-applicant handler must hit 100%.

## Gate before every push (must all pass)
```
cd /home/muhamuham/projects/possibilities-hack-67
./.venv/bin/python -m coverage run -m unittest backend.test_logic backend.test_api
./.venv/bin/python -m coverage report --include="backend/*.py" --omit="backend/__init__.py,backend/test_*.py" --fail-under=100
cd frontend && npm run test:run && npm run test:cov && npm run build
```
Backend tests call handlers directly — NO FastAPI TestClient. Frontend mocks `fetch` at the api-client boundary.

## Changelogs
Keep appending to `docs/changelog/{shared,track-a,track-b}.md` under `[Unreleased]`. At v3 integration, fold into a dated `[3.0.0]` block in root `CHANGELOG.md` (same as the v2.0.0 fold).

## Run locally
Two terminals: `make api` (FastAPI :8000) + `make frontend` (Next :3000). Backend must be up first (frontend proxies `/api/*` → :8000). If :8000 is stuck: `fuser -k 8000/tcp`.

## Sequencing
1. Friend lands W1 + W2 (catalog + readiness), pushes — that's the contract.
2. Muhammed lands W4 (modal) in parallel from day one.
3. Friend lands W3; Muhammed lands W5/W6/W7 once their deps are in.
4. Integrate on the shared branch, fold changelog → `CHANGELOG.md [3.0.0]`, run the v3 acceptance flow.
