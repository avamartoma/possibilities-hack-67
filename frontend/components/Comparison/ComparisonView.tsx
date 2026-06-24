"use client";

import { useCallback, useEffect, useState } from "react";
import { compareRole } from "../../lib/api";
import type { RoleComparison } from "../../lib/types";
import { li } from "../../lib/theme";

export default function ComparisonView({ userId, roleId, onViewPath }: { userId: string; roleId: string; onViewPath: () => void }) {
  const [comparison, setComparison] = useState<RoleComparison | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(() => { setError(false); compareRole({ userId, roleId }).then(setComparison).catch(() => setError(true)); }, [userId, roleId]);
  useEffect(() => { load(); }, [load]);
  if (error) return <section style={panel}><p>We couldn’t compare this role right now.</p><button onClick={load} style={button}>Retry</button></section>;
  if (!comparison) return <section style={panel}>Comparing your profile…</section>;
  const gaps = comparison.skillGaps.filter((gap) => gap.status === "missing");
  return <section style={{ display: "grid", gap: 16, width: "min(100%, 760px)", margin: "0 auto" }}>
    <div style={panel}><p style={{ margin: 0, color: li.green, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Profile comparison</p><h1 style={{ margin: "4px 0", fontSize: 25, overflowWrap: "anywhere" }}>{comparison.role.name}</h1><p style={{ color: li.textSecondary }}>{comparison.readinessScore}% readiness based on the skills visible on your profile.</p><button onClick={onViewPath} style={button}>View your path</button></div>
    <div style={panel}><h2 style={heading}>Strengths</h2>{comparison.strengths.length ? <ChipList values={comparison.strengths} color={li.green} bg={li.greenBg} /> : <p style={{ color: li.textSecondary }}>No direct skill matches yet.</p>}</div>
    <div style={panel}><h2 style={heading}>Gaps to close</h2>{gaps.length ? <div style={{ display: "grid", gap: 8 }}>{gaps.map((gap) => <div key={gap.skill} style={{ borderTop: `1px solid ${li.cardBorder}`, paddingTop: 8 }}><strong>{gap.skill}</strong><p style={{ margin: "4px 0 0", color: li.textSecondary, fontSize: 13 }}>{gap.suggestedProject}</p></div>)}</div> : <p style={{ color: li.textSecondary }}>Your profile covers this role’s listed skills.</p>}</div>
  </section>;
}
const panel: React.CSSProperties = { background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: "20px 24px", minWidth: 0 };
const button: React.CSSProperties = { background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 16px", fontWeight: 600, cursor: "pointer" };
const heading: React.CSSProperties = { margin: "0 0 10px", fontSize: 18 };
function ChipList({ values, color, bg }: { values: string[]; color: string; bg: string }) { return <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{values.map((value) => <span key={value} style={{ color, background: bg, borderRadius: 999, padding: "5px 10px", fontSize: 13, fontWeight: 600 }}>{value}</span>)}</div>; }
