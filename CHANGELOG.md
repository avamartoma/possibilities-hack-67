# Changelog

Format: [Keep a Changelog](https://keepachangelog.com). Per-track working logs live in
`docs/changelog/{shared,track-a,track-b}.md`; this file folds them into dated releases.

## [2.0.0] — 2026-06-24

Career Map v2: the full Profile → Explore → Explain → Compare → Your Path flow now runs on the
v2 FastAPI contracts end-to-end. LinkedIn-style visuals preserved; legacy `/api/fit` and
`/api/milestones` routes remain compatible. Backend 100% coverage (42 tests); frontend 100%
coverage (87 tests); `next build` green.

### Added
- **Phase 0** — `backend/profile_source.py` resolves the canonical hero `user_2340` from immutable
  `sample_data/user_data.json` and normalizes seed + sample users into one profile shape.
- **Phase 0** — `readinessScore` (int 0–100) on each `/api/roles/recommend` result, from role
  required skills ∩ profile skills (distinct from the ranking `score`).
- **Phase 0** — Vitest + React Testing Library + jsdom + v8 coverage; `test`/`test:run`/`test:cov`
  scripts; `vitest.config.ts` (100% thresholds) + `vitest.setup.ts`.
- **Phase 0** — frozen TS contracts (`lib/types.ts`): `RoleRecommendation.readinessScore`,
  `RoleExplanation`; API client helpers (`lib/api.ts`): getProfile, searchRoles, getRole,
  recommendRoles, explainRole, compareRole, generatePath.
- **Track B** — `app/milestones/selection.ts`: pure `resolveSelection(search)` for testable
  browser + SSR param resolution.

### Changed
- **Phase 0** — `main.seeded_profile` resolves through `resolve_profile`, so Compare / Path /
  Recommend / Explain all accept `user_2340` without touching legacy seed users.
- **Track A** — AppFlow added the explicit `explain` step (landing→explore→explain→comparison→
  milestone), owns canonical userId (default `user_2340`) + roleId, fetches the normalized profile
  once with loading/error/retry; child views no longer pick user/role.
- **Track A** — ProfilePage renders from the normalized v2 `UserProfile` (was bundled profile.json).
- **Track A** — ExploreView uses POST /api/roles/search (debounced 250ms) + /api/roles/recommend
  for backend readiness; removed local `computeFit` + `roleSkills.json`. Card click hands the
  canonical role id to AppFlow.
- **Track A** — ExplainView uses POST /api/roles/recommend (free-text prompt) + /api/roles/explain
  (replaced `matchCareers`/taxonomy); auto-explains the role from Explore; Compare hands the id up.
- **Track A** — `/explore` standalone route wires ExploreView with the canonical user.
- **Track B** — ComparisonPanel migrated `getFit()`/`FitResult` → `compareRole()`/`RoleComparison`
  (fit ring ← readinessScore; columns ← strengths + missing gaps; postings/aggregate ← backend;
  loading/error/retry; no `getFit` import).
- **Track B** — MilestoneView migrated `getMilestonePlan()`/`MilestonePlan` → `generatePath()`/
  `PersonalizedPath` (progress ← readinessScore; per-milestone course object; project/networking/
  checkpoint rows; component-local checkbox; loading/error/retry; no `getMilestonePlan` import).
- **Track B** — milestones page replaced local fit math + bundled JSON with `<MilestoneView>`
  driven by the v2 backend; URL `?user=&role=` resolved via `resolveSelection`, defaulting to
  `user_2340`/`data_scientist`.

### Fixed
- **Track A** — `MilestoneStep.course`/`courseLength` are now optional (`string | undefined`)
  rather than `string | null`, matching the MilestoneView prop type; cleared a pre-existing
  `next build` type error without modifying MilestoneView. Later superseded by Track B's
  MilestoneView migration to `PersonalizedPath`.

### Tested
- **Backend (42 tests, 100%)** — profile_source resolve/immutability/fallbacks; user_2340 across
  profile/compare/path/recommend; override isolation; role filters + explain; Compare service
  (strengths/gaps split, case-insensitive, gap shapes, 0-readiness, aggregate counts only); Path
  service (sequential orders, ≤max, real course objects, portfolio fallback, all milestone actions);
  legacy `/api/fit` + `/api/milestones` regression; 404 paths.
- **Frontend (87 tests, 100%)** — API client (every helper + legacy fallbacks); AppFlow flow +
  Back nav + profile fetch states; ProfilePage rich/sparse; ExploreView catalog/debounce/readiness/
  errors; ExplainView recommend+explain+Compare; ComparisonPanel + FitRing + SkillColumns;
  MilestoneView (ordered milestones, action rows, local checkbox, course-null, error/retry);
  comparison-demo + milestones + explore + root pages.
