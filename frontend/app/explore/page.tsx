"use client";

// Standalone Explore route (/explore): a thin harness around the shared ExploreView.
// The integrated journey lives at / (AppFlow); this page defaults to the canonical
// demo user and hands a selected role to the standalone comparison demo.

import ExploreView from "../../components/Explore/ExploreView";
import { DEFAULT_USER_ID } from "../../components/Flow/AppFlow";

export default function ExplorePage() {
  return (
    <main style={{ minHeight: "100vh", background: "#F4F2EE", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1128, margin: "0 auto" }}>
        <ExploreView
          userId={DEFAULT_USER_ID}
          onCompareRole={(roleId) => {
            window.location.href = `/comparison-demo?role=${encodeURIComponent(roleId)}&user=${DEFAULT_USER_ID}`;
          }}
          onOpenGuide={() => { window.location.href = "/"; }}
        />
      </div>
    </main>
  );
}
