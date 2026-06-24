# Changelog — Track A (Profile / Explore / Explain)

Owner: You. Format: [Keep a Changelog](https://keepachangelog.com).
Append one bullet per behavior-changing commit, grouped by Added/Changed/Fixed/Tested. Reference the covering test.

## [Unreleased]

### Added (v3)
- W5 Discover overhaul (ExploreView): loads the large v3 catalog (search limit 100) with client
  "Load more" pagination (30/page); search genuinely filters; clicking a card opens the shared
  RoleFifaCard modal (no navigation); modal CTA → AppFlow Compare; "Open the Career Guide" link;
  readiness badges from /api/roles/recommend. 100% coverage (ExploreView.test.tsx).
- W6 Career Guide overhaul (ExplainView): replaced the inline scroll-down explanation with the
  RoleFifaCard modal ("Explore this role" → modal); added a Top-applicant jobs scroller
  (POST /api/jobs/top-applicant); prompt → recommend cards still rank roles. 100% (ExplainView.test.tsx).
- AppFlow: Compare is reachable from both Discover and the Career Guide via the modal CTA; Back from
  Compare is origin-aware (returns to Explore or Career Guide). 100% (AppFlow.test.tsx).
- `components/RoleCard/RoleFifaCard.tsx` (W4): shared centered modal "FIFA card" for a role —
  backed by one `compareRole()` call (readiness ring, owned vs missing skills, salary, top companies,
  scrollable real postings); CTA "Compare your profile to this role" → `onCompare(roleId)`. Closes via
  X / Esc / backdrop (card click does not close); `role="dialog"` + `aria-modal`. Added to coverage `include`.
  Tests (RoleFifaCard.test.tsx): load/error+retry, all close paths, owned/missing/empty states, salary
  present/demo, postings present/empty/undefined, ring color bands, CTA. 100% coverage.

### Changed (v3)
- ExplainView CTA renamed "Compare this role →" → "Compare your profile to this role" (W7).
  RoleFifaCard already uses this copy. NOTE for Track B: add a single-role-focus regression test to
  ComparisonPanel (assert no list of other roles is rendered) — that's a Track-B-owned file.

### Changed
- AppFlow: added explicit `explain` step (landing→explore→explain→comparison→milestone);
  owns canonical userId (default `user_2340`) and roleId; fetches the normalized profile once
  on entry via `getProfile` with loading/error/retry; child views no longer pick user/role.
- ProfilePage: renders entirely from the normalized v2 `UserProfile` (was bundled profile.json);
  LinkedIn card layout preserved; sections hidden when their data is empty.
- ExploreView: replaced `roleSkills.json` import + local `computeFit` with POST /api/roles/search
  (debounced 250ms) for the catalog/typed search and POST /api/roles/recommend for per-card
  backend readiness; loading/empty/error+retry states; card click hands canonical role id to AppFlow.
- ExplainView: replaced `matchCareers` + client taxonomy matcher with POST /api/roles/recommend
  (free-text prompt → ranked roles with score reasons + matched skills) and POST /api/roles/explain
  (plain-language summary, day-to-day, core skills, related roles, salary, why-it-may-fit). Auto-explains
  the role carried in from Explore; "Compare this role" hands the canonical id to AppFlow. Loading/error/retry.
- /explore standalone route now wires ExploreView with the canonical user + a comparison-demo handoff.

### Added

### Fixed
- Build unblock (contract-side only): `MilestoneStep.course`/`courseLength` are now optional
  (`string | undefined`) instead of `string | null`, matching the existing MilestoneView prop type.
  This clears a PRE-EXISTING `next build` type error in Track B's MilestoneView (confirmed present at
  parent commit bfc5582) without modifying MilestoneView. `api.getMilestonePlan` emits `undefined` for
  the absent-course portfolio milestone.

### Tested
- AppFlow (AppFlow.test.tsx): profile fetch loading/error/retry, full flow transition carrying
  the role id, deterministic Back navigation. 100% coverage.
- ProfilePage (ProfilePage.test.tsx): rich + sparse profiles, empty-section omission, Lock-In. 100%.
- LinkedInNav (LinkedInNav.test.tsx): nav items + initial fallback. 100%.
- ExploreView (ExploreView.test.tsx): empty→catalog, backend readiness badges (all branches),
  one debounced search for typed query, no-results, error+retry, card→AppFlow, hover, recommend
  failure non-fatal. 100% coverage. No local role-fit JSON import remains.
- ExplainView (ExplainView.test.tsx): auto-explain carried-in role + Compare handoff, prompt→recommend,
  loading, score reasons + matched skills (incl. empty), open-recommendation→explain, empty/error recs,
  explain error+retry, salary present/demo + related-roles present/absent, empty-prompt guard. 100%.
- Pages: app/page (AppFlow mount), app/layout (children + metadata), app/explore (wires ExploreView +
  comparison-demo navigation). 100%.
- Full frontend suite: 58 tests, 100% lines/branches/functions on the Track-A surface; `next build` green.
