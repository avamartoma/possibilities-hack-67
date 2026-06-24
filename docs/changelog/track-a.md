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

### Added

### Fixed

### Tested
- AppFlow (AppFlow.test.tsx): profile fetch loading/error/retry, full flow transition carrying
  the role id, deterministic Back navigation. 100% coverage.
- ProfilePage (ProfilePage.test.tsx): rich + sparse profiles, empty-section omission, Lock-In. 100%.
- LinkedInNav (LinkedInNav.test.tsx): nav items + initial fallback. 100%.
