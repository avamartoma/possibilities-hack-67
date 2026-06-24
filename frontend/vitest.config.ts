import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Track A owns the Vitest setup. Coverage `include` is scoped to the v2-migrated
// Track A surface so the 100% gate is meaningful and green on this branch.
// Track B appends its own files (ComparisonPanel, MilestoneView) to this list;
// the integration owner reconciles dead legacy drill-down code separately.
const TRACK_A_SURFACE = [
  "lib/api.ts",
  "lib/theme.ts",
  "lib/persistence.ts",
  "components/Flow/AppFlow.tsx",
  "components/Profile/ProfilePage.tsx",
  "components/Explore/ExploreView.tsx",
  "components/Explain/ExplainView.tsx",
  "components/LinkedInNav.tsx",
  "app/page.tsx",
  "app/layout.tsx",
  "app/explore/page.tsx",
  // v3 — shared FIFA-card modal (W4)
  "components/RoleCard/RoleFifaCard.tsx",
];

// Track B surface (Compare → Your Path). Appended per the note above so the 100%
// gate covers the v2-migrated Comparison/Path files this track owns.
const TRACK_B_SURFACE = [
  "components/ComparisonPanel/ComparisonPanel.tsx",
  "components/ComparisonPanel/FitRing.tsx",
  "components/ComparisonPanel/SkillColumns.tsx",
  "components/Milestone/MilestoneView.tsx",
  "app/comparison-demo/page.tsx",
  "app/milestones/page.tsx",
  "app/milestones/selection.ts",
];

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    // jsdom only exposes a real Storage (localStorage/sessionStorage) when the
    // document has a concrete, non-opaque origin — otherwise window.localStorage
    // is undefined and the shared setup's .clear() throws.
    environmentOptions: { jsdom: { url: "http://localhost" } },
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [...TRACK_A_SURFACE, ...TRACK_B_SURFACE],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
      reporter: ["text", "text-summary"],
    },
  },
});
