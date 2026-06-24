# Changelog — Shared / Phase 0 (Contract Freeze)

All notable changes to the shared v2 contract base. Format: [Keep a Changelog](https://keepachangelog.com).
Append one bullet per behavior-changing commit, grouped by Added/Changed/Fixed/Tested. Reference the covering test.

## [Unreleased]

### Added
- Backend `profile_source.py`: resolves `user_2340` (canonical hero) from immutable
  `sample_data/user_data.json` and normalizes seed + sample users into one profile shape.
- `readinessScore` (int 0–100) on each `/api/roles/recommend` result, computed from role
  required skills ∩ profile skills (distinct from ranking `score`).
- Vitest + React Testing Library + jsdom + v8 coverage; `test`/`test:run`/`test:cov` scripts;
  `vitest.config.ts` (coverage `include` scoped to the Track-A v2 surface, 100% thresholds) + `vitest.setup.ts`.
- Frozen TS contracts in frontend/lib/types.ts: `readinessScore` on `RoleRecommendation`, new `RoleExplanation`.
- API client helpers in frontend/lib/api.ts (getProfile, searchRoles, getRole, recommendRoles,
  explainRole, compareRole, generatePath) typed against the frozen contracts.

### Changed
- `main.seeded_profile` resolves through `resolve_profile` so Compare/Path/Recommend/Explain
  all accept `user_2340` without touching legacy seed users.

### Tested
- profile_source: seed resolve, user_2340 resolve, unknown→None, immutability, sparse/rich
  adapter fallbacks (test_logic.py).
- API: `GET /api/profile/user_2340`, override-does-not-mutate-baseline, compare/path with
  user_2340, recommend readinessScore, role-detail/compare 404s, legacy route smoke (test_api.py).
- roles: category/skills filters, explain with/without profile, stretch vs strength (test_logic.py).
- Backend coverage 100% on all Track-A + Phase-0 modules (milestones.py/pathing.py = Track B).
- API client (lib/api.test.ts): every v2 helper's method/URL-encoding/payload/non-OK rejection,
  plus legacy fallback branches; api.ts at 100% coverage. theme.ts token tests.
