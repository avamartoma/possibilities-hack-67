# Changelog — Track A (Profile / Explore / Explain)

Owner: You. Format: [Keep a Changelog](https://keepachangelog.com).
Append one bullet per behavior-changing commit, grouped by Added/Changed/Fixed/Tested. Reference the covering test.

## [Unreleased]

### Changed
- AppFlow: added explicit `explain` step (landing→explore→explain→comparison→milestone);
  owns canonical userId (default `user_2340`) and roleId; fetches the normalized profile once
  on entry via `getProfile` with loading/error/retry; child views no longer pick user/role.
- ProfilePage: renders entirely from the normalized v2 `UserProfile` (was bundled profile.json);
  LinkedIn card layout preserved; sections hidden when their data is empty.
- ExploreView: replaced `roleSkills.json` import + local `computeFit` with POST /api/roles/search
  (debounced 250ms) for the catalog/typed search and POST /api/roles/recommend for per-card
  backend readiness; loading/empty/error+retry states; card click hands canonical role id to AppFlow.

### Added

### Fixed

### Tested
- AppFlow (AppFlow.test.tsx): profile fetch loading/error/retry, full flow transition carrying
  the role id, deterministic Back navigation. 100% coverage.
- ProfilePage (ProfilePage.test.tsx): rich + sparse profiles, empty-section omission, Lock-In. 100%.
- LinkedInNav (LinkedInNav.test.tsx): nav items + initial fallback. 100%.
- ExploreView (ExploreView.test.tsx): empty→catalog, backend readiness badges (all branches),
  one debounced search for typed query, no-results, error+retry, card→AppFlow, hover, recommend
  failure non-fatal. 100% coverage. No local role-fit JSON import remains.
