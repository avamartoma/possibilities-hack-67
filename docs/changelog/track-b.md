# Changelog — Track B (Comparison / Path)

Owner: Friend. Format: [Keep a Changelog](https://keepachangelog.com).
Append one bullet per behavior-changing commit, grouped by Added/Changed/Fixed/Tested. Reference the covering test.

## [Unreleased]

### Changed
- ComparisonPanel: migrated `getFit()`/`FitResult` → `compareRole()`/`RoleComparison`. Fit ring ← `readinessScore`; skill columns ← `strengths` + missing `skillGaps`; postings/aggregate ← backend; Build Path passes `{userId, roleId, missingSkills}` (IDs + backend gaps, no local fit math). Explicit loading/error/retry. No `getFit` import. (ComparisonPanel.test.tsx)
- MilestoneView: migrated `getMilestonePlan()`/`MilestonePlan` → `generatePath()`/`PersonalizedPath`. Progress bar ← `readinessScore`; per-milestone course object; project/networking/checkpoint as distinct action rows; checkbox is component-local UI state only; loading/error/retry. No `getMilestonePlan` import. (MilestoneView.test.tsx)
- milestones page: replaced local fit math + bundled `roleSkills.json`/`flowUsers.json` (quarters/opportunities/leaderboard) with `<MilestoneView>` driven by the v2 backend; URL `?user=&role=` params resolved via pure `resolveSelection` (selection.ts), defaulting to canonical `user_2340`/`data_scientist`. (milestones/page.test.tsx)

### Added
- `app/milestones/selection.ts`: pure `resolveSelection(search)` so browser + SSR (null) param paths are directly testable.
- Track B surface appended to `vitest.config.ts` coverage `include` (per the Track A note in that file).

### Tested
- Compare service: strengths/gaps split, case-insensitive, missing-gap shape (no fabricated evidence) vs strength-gap shape, empty-required-skills → 0 readiness, aggregate counts only (test_logic.CompareServiceTests)
- Path service: maxMilestones with sequential orders, default ≤5, missing skill with course record → real course object, fully aligned → one portfolio milestone, every milestone has project/networking/checkpoint + `not_started` (test_logic.PathServiceTests)
- Milestone plan portfolio fallback when no skill gaps (test_logic.CareerLogicTests) — closes `milestones.py`/`pathing.py` fallback-branch coverage
- Compare/Path handlers: override adds strengths/removes gaps/raises readiness, Path full contract shape, Path unknown role → 404 (test_api.CompareAndPathHandlerTests)
- ComparisonPanel: loading, success (readiness/strengths/missing gaps/postings/aggregate), error + retry repeats request, high-readiness strong-applicant + singular aggregate, no-postings/no-jobCount edge, Build Path callback receives IDs, console fallback (ComparisonPanel.test.tsx)
- FitRing: value + band at 0/50/100 bounds (FitRing.test.tsx); SkillColumns: strengths + missing gaps with counts, empty-column states (SkillColumns.test.tsx)
- comparison-demo page: mounts + defaults to hero user + wires ComparisonPanel, user-picker re-compare, skill-based filtering w/ category-less roles + first-user fallback, no-results, empty collections (comparison-demo/page.test.tsx)
- MilestoneView: loading + request IDs, ordered milestones w/ course/project/networking/checkpoint, course-null + course-without-length, local checkbox toggle (hover reveal/unhover), singular/plural/fully-covered gap copy, error + retry (MilestoneView.test.tsx)
- milestones page: mounts + wires MilestoneView from URL params, canonical defaults, `resolveSelection` null + populated cases (milestones/page.test.tsx)

### Notes
- Gate (all green on this branch): backend `coverage run -m unittest backend.test_logic backend.test_api` + `coverage report --omit="*/test_*" --fail-under=100` → 100% on `backend/*.py`; `npm run test:run` (87 tests) + `npm run test:cov` → 100% lines/branches/functions/statements across the migrated Track A + Track B surface in `vitest.config.ts`; `npm run build` passes.
