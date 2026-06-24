# Changelog — Track B (Comparison / Path)

Owner: Friend. Format: [Keep a Changelog](https://keepachangelog.com).
Append one bullet per behavior-changing commit, grouped by Added/Changed/Fixed/Tested. Reference the covering test.

> v2 Track B entries are released in root `CHANGELOG.md [2.0.0]`. Below is v3 (catalog/readiness/jobs) backend work.

## [Unreleased]

### Added
- **W1** — `backend/precompute.py` rebuilt as importable building blocks (`slugify`, `INDUSTRY_SKILLS` for all 21 industries, `KEYWORD_SKILLS`, `role_skills_for`, `build_catalog`, `build_demo_users`, `build_courses`, `main(out_dir)`); emits `backend/data/rolesCatalog.json` — 207 roles from `jobs_data.json` with real postings/companies/salary/levels/industries/jobCount/easyApplyPct and deterministic core (industry) + supporting (keyword) skills. (test_catalog.py)
- **W1** — `coreSkills`/`supportingSkills` exposed on `normalize_role` output (falls back to all-core for untagged legacy roles). (test_catalog.NormalizeRoleCoreSupportingTests)
- **Contract** — published v3 frontend types so W4–W6 can code against them: `CareerRole.coreSkills?`/`supportingSkills?`, `TopApplicantJob`, `TopApplicantJobs` (`lib/types.ts`); `getTopApplicantJobs` API client helper (`lib/api.ts`, api.test.ts). Optional skill fields keep existing CareerRole fixtures valid.

- **W2** — `backend/readiness.py::compute_readiness` — weighted (core 0.7 / supporting 0.3) readiness, case/whitespace/synonym-folded (`SKILL_SYNONYMS`), clamped 0–100, monotonic; supporting weight drops out when a role has none. (test_readiness.py)
- **W3** — `backend/jobs.py::rank_top_applicant_jobs` + `POST /api/jobs/top-applicant` (`TopApplicantRequest`): ranks real catalog postings by role readiness + level/industry alignment; returns `{jobs: Posting+roleId+score+topApplicant, total}` sorted desc, `topApplicant` when score ≥ 70, default limit 25, request-scoped overrides, no peer data. (test_jobs.py)

### Changed
- **W1** — `main.ROLES` now loads the full 207-role `rolesCatalog.json`; canonical ids preserved so `/api/fit` + `/api/milestones` + v2 tests keep resolving. Search paginates over the larger catalog. (test_api.CatalogApiTests)
- **W2** — `compare_profile_to_role` + `recommend_roles` now derive `readinessScore` from `compute_readiness` (replaces the inline matched/required ratio); semantics weighted, value range unchanged 0–100. (test_readiness.ReadinessWiringTests)

### Tested
- W1: slugger deterministic + collision-free over 207 names; INDUSTRY_SKILLS covers all 21 industries; catalog ≥200 roles with full shape; canonical ids present + skilled; known position (Environmental Scientist) resolves with real postings + industry skills; precompute builders + `main()` writer (temp dir) at 100% (test_catalog.py)
- W2: all-core→100, no-match→0, half-core→mid band, core weighted > supporting, case+synonym invariance, no-supporting not penalized, empty required→0, clamped int, monotonic; compare + recommend carry the weighted score (test_readiness.py)
- W3: postings sorted by descending score w/ roleId + topApplicant flag, flag tracks threshold, Finance skills surface Finance postings, limit respected; handler returns jobs+total, unknown user→404, override re-ranks without seed mutation, default limit 25 (test_jobs.py)

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
