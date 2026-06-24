"use client";

// Standalone Explore route (/explore): a thin harness around the shared ExploreView.
// The integrated journey lives at / (AppFlow); this page defaults to the canonical
// demo user and hands a selected role to the standalone comparison demo.

import ExploreView from "../../components/Explore/ExploreView";
import { DEFAULT_USER_ID } from "../../components/Flow/AppFlow";
import LinkedInNav from "../../components/LinkedInNav";
import { clearSession, clearUserProgress } from "../../lib/persistence";

export default function ExplorePage() {
  const search = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") || "";
  return (
    <main style={{ minHeight: "100vh", background: "#F4F2EE" }}>
      <LinkedInNav onHome={() => { window.location.href = "/"; }} onProfile={() => { window.location.href = "/"; }} onJobs={(query) => { window.location.href = `/explore${query ? `?q=${encodeURIComponent(query)}` : ""}`; }} onRestart={() => { clearSession(); clearUserProgress(DEFAULT_USER_ID); window.location.href = "/"; }} />
      <div style={{ maxWidth: 1128, margin: "0 auto", padding: "24px 16px" }}>
        <ExploreView
          userId={DEFAULT_USER_ID}
          initialQuery={search}
          onCompareRole={(roleId) => {
            window.location.href = `/comparison-demo?role=${encodeURIComponent(roleId)}&user=${DEFAULT_USER_ID}`;
          }}
          onOpenGuide={() => { window.location.href = "/"; }}
        />
      </div>
    </main>
  );
}
