"use client";

import ComparisonPanel from "../../components/Comparison/ComparisonPanel";
import LinkedInNav from "../../components/LinkedInNav";
import { li } from "../../lib/theme";
import { resolveSelection } from "../milestones/selection";

export default function ComparisonPage() {
  const { userId, roleId } = resolveSelection(typeof window === "undefined" ? null : window.location.search);
  return <main style={{ minHeight: "100vh", background: li.pageBg, fontFamily: li.font }}><LinkedInNav onHome={() => { window.location.href = "/"; }} onProfile={() => { window.location.href = "/"; }} onJobs={() => { window.location.href = "/explore"; }} /><div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}><button onClick={() => { window.location.href = `/milestones?user=${encodeURIComponent(userId)}&role=${encodeURIComponent(roleId)}`; }} style={{ border: "none", background: "none", color: li.blue, cursor: "pointer", fontWeight: 600, padding: "0 0 14px" }}>← Back to Your Path</button><ComparisonPanel userId={userId} roleId={roleId} onBuildPath={() => { window.location.href = `/milestones?user=${encodeURIComponent(userId)}&role=${encodeURIComponent(roleId)}`; }} /></div></main>;
}
