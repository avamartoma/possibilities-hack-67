"use client";

// Your Path page receives a direct role selection and renders the backend-driven plan.
// All path content comes from POST /api/path/generate via <MilestoneView>;
// there is no local fit/path calculation here.

import { li } from "../../lib/theme";
import LinkedInNav from "../../components/LinkedInNav";
import MilestoneView from "../../components/Milestone/MilestoneView";
import { resolveSelection } from "./selection";
import { clearSession, clearUserProgress } from "../../lib/persistence";

export default function MilestonesPage() {
  /* v8 ignore next -- SSR guard: the no-window branch can't run under jsdom; resolveSelection(null) is unit-tested directly */
  const search = typeof window !== "undefined" ? window.location.search : null;
  const { userId, roleId } = resolveSelection(search);

  return (
    <div style={{ minHeight: "100vh", background: li.pageBg, fontFamily: li.font }}>
      <LinkedInNav onHome={() => { window.location.href = "/"; }} onProfile={() => { window.location.href = "/"; }} onJobs={(query) => { window.location.href = `/explore${query ? `?q=${encodeURIComponent(query)}` : ""}`; }} onRestart={() => { clearSession(); clearUserProgress(userId); window.location.href = "/"; }} />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px", minWidth: 0 }}>
        <MilestoneView userId={userId} roleId={roleId} onCompare={() => { window.location.href = `/comparison?user=${encodeURIComponent(userId)}&role=${encodeURIComponent(roleId)}`; }} />
      </div>
    </div>
  );
}
