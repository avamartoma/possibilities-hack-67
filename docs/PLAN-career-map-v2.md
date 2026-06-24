# Parallel TDD Plan: Career Map v2 Integration

## Summary

Migrate the existing UI from bundled JSON / local calculations to the v2 FastAPI
contracts while preserving current styling and legacy routes. Two developers work
in **true parallel** — no track blocks on the other after a short shared setup.

Contract baseline: `origin/codex/v2-backend-foundation` @ `0a41815` ("Add v2 career API foundation").

**Method: strict red → green → refactor.** No implementation line is written before a
failing test asserts the behavior it satisfies.

Ownership split:
- **You (Track A):** Profile → Explore → Explain, the shared API client/types, AppFlow coordinator, Vitest setup.
- **Friend (Track B):** Compare → Your Path, plus backend Compare/Path service tests.

---

## Why this version is "better"

The original plan serialized both tracks twice:
1. Track B could not start UI work until it cherry-picked Track A's client commit.
2. Track B's Path tests needed `user_2340`, which Track A owned.

This version removes both blocks with a **Phase 0 contract freeze**: the TypeScript
contracts, client stubs, Vitest setup, and `user_2340` backend support all land
*before* either track begins feature work. After Phase 0, the two tracks never touch
the same files and never wait on each other. It also adds **per-track changelogs** so
each developer keeps an auditable, mergeable history.

---

## Phase 0 — Shared Contract Freeze (do FIRST, together, ~1 short session)

Goal: publish everything both tracks depend on, so Tracks A and B run with zero cross-blocking.

Owner: **You** author it; friend reviews the contract before either proceeds. Single small PR
merged to a shared integration branch `feature/v2-contract-base` (branched from
`origin/codex/v2-backend-foundation`). Both feature branches branch from *that*.

```
origin/codex/v2-backend-foundation
        │
        └── feature/v2-contract-base   ← Phase 0 lands here, merged fast
                 ├── feature/profile-explore-v2   (You / Track A)
                 └── feature/compare-path-v2       (Friend / Track B)
```

Phase 0 deliverables (each test-first):

1. **Vitest stack + scripts** in `frontend/package.json`:
   `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
   Scripts: `"test": "vitest"`, `"test:run": "vitest run"`, `"test:cov": "vitest run --coverage"`.
   Add `@vitest/coverage-v8`. Config: React plugin, jsdom env, setup file importing
   `@testing-library/jest-dom/vitest`, coverage provider `v8` with 100% thresholds for
   `frontend/lib/**`, `frontend/components/**`, `frontend/app/**`.
   Acceptance: a trivial passing test runs under `npm run test:run`; `npm run test:cov` reports coverage.

2. **Frozen TS contracts** in `frontend/lib/types.ts`:
   `UserProfile`, `ProfileOverride`, `CareerRole`, `RoleRecommendation` (incl. `readinessScore: number`),
   `RoleComparison`, `PersonalizedPath`.

3. **API client helpers** in `frontend/lib/api.ts`:
   `getProfile`, `searchRoles`, `getRole`, `recommendRoles`, `explainRole`, `compareRole`, `generatePath`.
   Client unit tests (mock `fetch` at the client boundary) land in the SAME commit:
   - `searchRoles` sends expected JSON body.
   - `recommendRoles` sends `userId`, optional `query`/`interests`, optional override.
   - `compareRole` / `generatePath` use POST and reject non-OK responses.
   - URL identifiers are encoded for profile and role fetches.

4. **Canonical `user_2340` backend support** — profile-source adapter resolving `user_2340`
   from `sample_data/user_data.json` (backend seed currently starts at `user_5329`).
   Normalize into: `id, name, headline, currentStatus, skills, experience, education,
   interests, savedGoals, location`. Deterministic fallback copy when source lacks a field.
   Source data stays immutable. Tests first:
   - `GET /api/profile/user_2340` → 200 with all normalized fields.
   - Unknown user → 404.
   - A `ProfileOverride` changes only the response, never the seed.
   - A fresh lookup after an override returns original seed data.
   - `user_2340` is usable by Compare and Path endpoints.

**Phase 0 done = both tracks unblocked.** Push immediately; friend rebases/branches off it.
No cherry-picking needed — the contract is in their branch base.

---

## Collaboration Rules

- Branch from `feature/v2-contract-base` (which carries Phase 0). Never branch from raw `main`.
- File ownership is exclusive. You own `lib/api.ts`, `lib/types.ts`, `components/Flow/AppFlow.tsx`,
  Vitest setup. Friend consumes these; friend does not redesign them. If a contract change is
  needed mid-flight, it is a small Track-A PR that friend rebases onto — never a parallel edit.
- Rebase each feature branch onto `feature/v2-contract-base` before opening a PR. Do not merge
  `main` into either branch until the integration owner asks.
- Preserve legacy routes unchanged: `GET /api/fit`, `GET /api/milestones`.
- Forbidden: database persistence, auth, scraping, LinkedIn access, external LLM deps, Claude API calls.

---

## Testing Policy (applies to both tracks)

- Backend: `unittest` service/handler tests. **Do not** use FastAPI `TestClient` — this env's
  Python 3.14 / Starlette combo has shown client compatibility problems. Test services + handlers directly.
- Frontend: mock `fetch` at the API-client boundary. No live backend in unit tests.
- No snapshot-only tests. Assert user-visible state, outgoing request payloads, data transforms.
- **Every integration defect → a failing regression test before its fix.** Log it in the changelog.
- Required before every PR (all must pass — coverage gate included):
  ```
  ./.venv/bin/python -m coverage run -m unittest backend.test_logic backend.test_api
  ./.venv/bin/python -m coverage report --fail-under=100   # backend/*.py
  npm run test:run
  npm run test:cov          # 100% lines/fns/branches on migrated dirs
  npm run build
  ```

### Red-green-refactor commit rhythm (both tracks)

1. `test:` commit — failing test(s) for one behavior.
2. `feat:`/`fix:` commit — smallest code to go green.
3. `refactor:` commit — optional, tests stay green.

Keep commits small and single-purpose. Append a changelog line in the same commit (see below).

---

## Exhaustive Unit-Test Coverage Mandate (NEW — hard gate)

**Rule: no code ships untested.** Every function, every page, every route, every component, and
every AI-generated line touched in this migration must have a unit test in the SAME PR. A PR that
adds or changes code without its covering test does not merge.

### What "covered" means per artifact type

| Artifact | Minimum required tests |
|----------|------------------------|
| **Backend function** (service/helper) | happy path + ≥1 edge + ≥1 error/empty case |
| **Backend route handler** | 200 success (payload shape asserted) + 404/4xx + override/edge case |
| **Frontend API client fn** | request method + URL encoding + body payload + non-OK rejection |
| **Frontend pure helper** (lib) | happy + edge + empty/invalid input |
| **React component** | render + each visible state (loading/empty/error) + each user interaction |
| **Next.js page** | mounts without throw + wires correct child + async boundary states |

### Coverage enforcement (tooling)

- Frontend: enable Vitest coverage (`vitest run --coverage`, v8 provider). Threshold **100%**
  (lines/functions/branches/statements) for migrated dirs: `frontend/lib/**`,
  `frontend/components/**`, `frontend/app/**`. Add to `package.json`:
  `"test:cov": "vitest run --coverage"`. PRs run it; a drop below threshold fails the gate.
- Backend: `./.venv/bin/python -m coverage run -m unittest backend.test_logic backend.test_api`
  then `coverage report --fail-under=100` for `backend/*.py` (excluding `__init__`, test files).
- A file legitimately being deleted in the migration is exempt from coverage but MUST have a test
  asserting it is no longer imported anywhere (the "does not import getFit / getMilestonePlan /
  roleSkills.json" tests). Code-being-removed still gets a guard test, not a free pass.

### Full coverage matrix — every file has an owner and a test target

**Backend** (`backend/<x>.py` → tests live in `backend/test_logic.py` / `backend/test_api.py`)

| File | Owner | Required unit tests |
|------|-------|---------------------|
| `profiles.py` | Phase 0 | user_2340 resolve, normalize all fields, unknown→404, override isolation, seed immutability |
| `roles.py` | Track A | search (empty→catalog, "data"→Data Scientist), recommend (query+interests→3), explain (no LLM key), get-role, readinessScore computation |
| `comparison.py` | Track B | strengths/gaps, case-insensitive, override raises score, no peer leak, unknown→404 |
| `pathing.py` | Track B | ≤5 default, ≤maxMilestones, sequential orders, real course objects, portfolio-evidence milestone, all action types |
| `milestones.py` | Track B | legacy `/api/milestones` shape unchanged (regression lock) |
| `fit.py` | Track B | legacy `/api/fit` shape unchanged (regression lock) |
| `analysis.py` | Track B | aggregate counts only (analyzed/landed/similar), no individual peer data |
| `roles.py`+`schemas.py` validation | Track A | schema accepts valid, rejects malformed payloads |
| `precompute.py` | shared | deterministic output for seeded input, idempotent |
| `main.py` (route wiring) | split by route owner | each registered route returns expected status + content-type |

**Frontend pages** (`frontend/app/**`)

| Page | Owner | Required tests |
|------|-------|----------------|
| `page.tsx` (landing) | Track A | mounts, renders AppFlow, defaults user_2340 |
| `layout.tsx` | Track A | renders children + nav without throw |
| `explore/page.tsx` | Track A | mounts, wires ExploreView, async states |
| `comparison-demo/page.tsx` | Track B | mounts, wires ComparisonPanel, loading/error |
| `milestones/page.tsx` | Track B | mounts, wires MilestoneView, loading/error |

**Frontend components** (`frontend/components/**`)

| Component | Owner | Required tests |
|-----------|-------|----------------|
| `Flow/AppFlow.tsx` | Track A | flow states, role/user propagation, Back nav determinism |
| `Profile/ProfilePage.tsx` | Track A | renders normalized profile, Lock-In transition |
| `Explore/ExploreView.tsx` | Track A | empty→catalog, debounced search, empty/error/retry, card→Explain |
| `Explore/RoleList.tsx` | Track A | renders list, selection callback |
| `Explore/RoleDetail.tsx` | Track A | renders role fields, no local fit math |
| `Explore/FieldList.tsx` | Track A | renders fields, empty state |
| `Explore/BubbleGrid.tsx` | Track A | renders nodes, click callback |
| `Explore/Breadcrumb.tsx` | Track A | renders trail, nav callback |
| `Explore/UserPicker.tsx` | Track A | lists users, selection (or assert disabled post-AppFlow-selection) |
| `Explain/ExplainView.tsx` | Track A | prompt→recommend, loading, score reasons, explain fetch, Compare callback |
| `ComparisonPanel/ComparisonPanel.tsx` | Track B | loading/success/error/retry, Build-Path IDs, no getFit import |
| `ComparisonPanel/FitRing.tsx` | Track B | renders readinessScore value, 0 and 100 bounds |
| `ComparisonPanel/SkillColumns.tsx` | Track B | renders strengths + missing gaps, empty columns |
| `Milestone/MilestoneView.tsx` | Track B | order/course/3 action types, course-null fallback, local checkbox, no getMilestonePlan import |
| `LinkedInNav.tsx` | Track A | renders nav items, active route highlight |

**Frontend lib** (`frontend/lib/**`)

| File | Owner | Required tests |
|------|-------|----------------|
| `api.ts` | Phase 0 | every helper: method, URL encode, payload, non-OK reject (see Phase 0 §3) |
| `types.ts` | Phase 0 | type-level only (compile check via `npm run build`; no runtime test needed) |
| `theme.ts` | Track A | exported tokens/helpers return expected values |
| `fit.ts` (local fit) | Track A | **being removed** → guard test: not imported by migrated components |
| `explore/careerMatcher.ts` (→ explain/) | Track A | **being removed** → guard test: not imported |
| `explore/buildTree.ts` | Track A | tree shape from input, empty input |
| `explore/eligibility.ts` | Track A | eligible/ineligible cases, boundary |
| `explore/taxonomy.ts` | Track A | lookup hit/miss; if removed, guard test |
| `explore/data.ts` | Track A | **being replaced by API** → guard test: not imported for fit |
| `explore/ui.ts` | Track A | each exported UI helper, edge inputs |

Anything not in this matrix that gets added during the migration inherits the same rule: **ships
with its test or it does not ship.** Update the matrix in the PR that adds the file.

---

## Changelogs (NEW — required for both)

Each track keeps its own changelog so histories merge cleanly and progress is auditable.

- Track A → `docs/changelog/track-a.md`
- Track B → `docs/changelog/track-b.md`
- Phase 0 / shared → `docs/changelog/shared.md`

Format: [Keep a Changelog](https://keepachangelog.com) style. **Every commit that changes behavior
appends one bullet** under an `## [Unreleased]` section, grouped by `Added / Changed / Fixed / Tested`.
Reference the test that covers it.

Example entry:
```
## [Unreleased]
### Tested
- Explore: empty query renders API catalog (ExploreView.test.tsx)
### Changed
- Explore: replaced roleSkills.json import with POST /api/roles/search
```

Rule: separate per-track files = no merge conflicts on the changelog. At integration, the owner
folds both `[Unreleased]` sections into a single dated release heading in a root `CHANGELOG.md`.

---

## Track A — You: Profile, Explore, Explain (+ owns shared client/flow)

> Prereq: Phase 0 merged. Everything below is test-first.

### A1. Migrate Profile + AppFlow
Keep the LinkedIn-style visual design. Replace data flow, not layout.
- AppFlow owns the canonical selected `userId` and `roleId`. Default `user_2340`.
- Fetch normalized profile once on Profile entry; pass down to Explore/Explain.
- Explicit flow state: `landing → explore → explain → comparison → milestone`.
- Deterministic Back nav: Explore→Profile, Explain→Explore, Compare→Explain, Path→Compare.
- Child components never independently choose user/role after AppFlow selects them.

Tests first:
- Flow starts with canonical profile.
- Selecting a role: Explore → Explain carries the role ID.
- Compare from Explain → Comparison with same role ID.
- Back nav preserves user + role selection.

### A2. Migrate Explore
Replace direct `roleSkills.json` import + local filtering in `ExploreView`.
- Initial load: `POST /api/roles/search` with empty query → catalog.
- Debounce search input 250 ms.
- Each query: `POST /api/roles/search` `{ query, categories: [], skills: [], limit: 20 }`.
- Initial ordering for selected user may call `/api/roles/recommend`; typed search always uses `/api/roles/search`.
- Use backend `readinessScore`, `scoreReasons`, `matchedSkills` for personalized cards. No local fit math.
- Render loading / empty / retryable-error states. Preserve card layout, hover, theme.
- Card click → Explain (not directly Compare).

Tests first:
- Empty query renders API catalog.
- Typing "data" sends one debounced request and renders Data Scientist.
- Empty result → existing no-results state.
- Request failure → error + retry control.
- Card selection sends canonical role ID to AppFlow.
- No readiness % computed from a local role-skills JSON import.

### A3. Migrate Explain
Replace `matchCareers` + client-side taxonomy matcher in `ExplainView`.
- Free-text prompt → `POST /api/roles/recommend` `{ userId, query, interests: [], limit: 3 }`.
- Render score reasons + matched skills from response.
- Opening a recommendation → `POST /api/roles/explain` `{ roleId, userId }`.
- Show plain-language summary, day-to-day bullets, core skills, related roles, salary guidance,
  personalized fit rationale. Copy is deterministic and labeled demo guidance.
- Primary action becomes "Compare this role", passing exact role ID to AppFlow.

Tests first:
- Prompt submit calls `recommendRoles` with selected user + query.
- Loading state visible while recommendations resolve.
- Result cards render returned score reasons + skills.
- Selecting a role requests explanation details.
- Explanation renders day-to-day and "why it may fit".
- Compare callback receives canonical role ID.

---

## Track B — Friend: Comparison, Path (+ backend Compare/Path tests)

> Prereq: Phase 0 merged into branch base. **No cherry-pick step** — contract is already present.
> Track B can begin the moment Phase 0 lands, fully parallel to Track A.

### B1. Backend — Compare as canonical fit source (`POST /api/compare`)
Response: `profile, role, readinessScore, strengths, skillGaps, suggestedNextSteps, aggregateAnalysis`.
Rules: case-insensitive skill compare; `readinessScore` int 0–100; strengths = required role skills
present in resolved profile; missing gaps `{status:"missing", importance:"core", concrete project, no fabricated evidence}`;
strength gaps `{status:"strength", evidence "Listed in your profile"}`; `aggregateAnalysis` exposes
counts only (`analyzed, landed, similar`) — never individual peer data; overrides request-scoped, non-persistent.

Failing backend tests first:
- `user_5329` vs Data Scientist → stable score, strengths, gaps. (uses 5329, NOT blocked on 2340)
- Case changes in user skills don't change result.
- Override adds strengths, removes matching gaps, raises readiness.
- Override does not mutate future baseline requests.
- Aggregate contains only `analyzed, landed, similar`.
- Unknown profile/role → 404.
- Legacy `/api/fit` shape unchanged.

### B2. Wire `ComparisonPanel`
Migrate `getFit() + FitResult` → `compareRole() + RoleComparison`. Keep visual composition.
- Fit ring ← `readinessScore`. Skill columns ← `strengths` + missing `skillGaps`.
- Job listings / salary / company / summary ← `comparison.role`. Aggregate card ← `aggregateAnalysis`.
- Suggested next steps ← `suggestedNextSteps`. Build Path passes `userId` + `roleId` only
  (no client-calculated missing skills as source of truth). Explicit loading/error/retry.

Tests first:
- Loading state before resolution.
- Success renders readiness, strengths, gaps, postings, aggregate counts.
- Error on rejected request; retry repeats call.
- Build Path callback receives selected IDs, not derived local data.
- Component does not import or call `getFit`.

### B3. Backend — Path generation (`POST /api/path/generate`)
Response: `profileId, role, readinessScore, startingStrengths, skillGaps, milestones, generatedAt, disclaimer`.
Each milestone: `order, title, targetSkill, reason, course, project, networkingAction,
profileCheckpoint, completionState:"not_started"`.
Rules: default max 5 milestones; orders sequential from 1; missing core skills drive order;
courses from seeded catalog when available; every milestone has project + networking + checkpoint;
a fully matched profile still gets one portfolio-evidence milestone; completion state is local UI only.

Failing backend tests first:
- `maxMilestones:2` → ≤ 2 sequential milestones.
- Default → ≤ 5.
- Missing skill with a course record → that real course object.
- Fully aligned profile → one portfolio-evidence milestone.
- Every milestone has project, networking, checkpoint, `not_started`.
- `user_2340` works (Phase 0 already landed this).
- Legacy `/api/milestones` unchanged.

### B4. Wire `MilestoneView`
Migrate `getMilestonePlan() + MilestonePlan` → `generatePath() + PersonalizedPath`. Preserve visuals.
- Progress bar ← `readinessScore`. Headline + target skill ← `title`, `targetSkill`.
- Course display ← returned course object. Render project / networking / checkpoint as distinct action rows.
- Checkbox state is component-local, initialized from `completionState`. Loading/error/retry states.
- Do not re-create quarterly milestones, opportunities, or peer scores locally.

Tests first:
- Path data renders order, course, all three action types.
- Course-null fallback renders without error.
- Checkbox toggle changes local UI state only.
- Error/retry works.
- Component does not import or call `getMilestonePlan`.

---

## Parallelization Map

| When | You (Track A) | Friend (Track B) |
|------|---------------|------------------|
| Phase 0 | Author contract base + `user_2340` + Vitest | Review contract; prep backend test scaffolding |
| Wave 1 | A1 AppFlow/Profile | B1 backend Compare tests + impl |
| Wave 2 | A2 Explore | B2 ComparisonPanel |
| Wave 3 | A3 Explain | B3 backend Path tests + impl |
| Wave 4 | A-track polish / a11y / error states | B4 MilestoneView |

After Phase 0, waves are independent — neither track waits on the other within a wave.
Only contract changes (rare) cross the boundary, and those route through a small Track-A PR.

---

## Integration & Merge Order

1. Phase 0 PR → merge to `feature/v2-contract-base`. Both branches (re)base on it.
2. Tracks A and B run fully parallel, small red-green-refactor commits, per-track changelogs.
   No PR merges unless the coverage gate (backend 100% + frontend 100% on migrated dirs) is green.
3. Merge **Track A first** (owns shared client + flow coordinator).
4. Rebase Track B onto merged Track A; resolve only contract-level conflicts; merge Track B.
5. Integration owner folds both `[Unreleased]` changelog sections into a dated `CHANGELOG.md` release.

---

## Final Acceptance Matrix

### Backend — `./.venv/bin/python -m unittest backend.test_logic backend.test_api -v`
- `GET /api/profile/user_2340` succeeds.
- Empty search → catalog. "data" search includes Data Scientist.
- Role detail + explanation work without an LLM key.
- Interest/query recommendation → three explainable roles.
- Compare override changes score/gaps without seed mutation.
- Path has ordered milestones + real course objects where available.
- `/api/fit` and `/api/milestones` remain compatible.

### Frontend — `npm run test:run` && `npm run build`
Manual demo flow (must be v2 data end-to-end):
```
Profile (user_2340) → Lock In → Explore → search "data" → select Data Scientist
→ read explanation + fit rationale → Compare this role
→ inspect backend score / strengths / gaps / aggregate evidence
→ Build my path → inspect ordered course/project/networking/checkpoint milestones
```
Done only when: flow uses v2 backend data end-to-end; loading/error states at every async boundary;
no local role-fit/path calculations in migrated components; existing visual design preserved;
both changelogs current.
