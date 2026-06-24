import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Coverage is scoped to the product flow.
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
];

const TRACK_B_SURFACE = [
  "components/Milestone/MilestoneView.tsx",
  "app/milestones/page.tsx",
  "app/milestones/selection.ts",
];

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
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
