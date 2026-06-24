"use client";

import { useCallback, useEffect, useState } from "react";
import { generatePath } from "../../lib/api";
import { loadProgress, saveProgress } from "../../lib/persistence";
import type { PersonalizedPath } from "../../lib/types";
import { li } from "../../lib/theme";

type Milestone = PersonalizedPath["milestones"][number];
function phaseFor(order: number) { return Math.min(Math.floor((order - 1) / 2), 3); }
function phaseLabel(index: number) {
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const start = (now.getMonth() + index * 3) % 12;
  const end = (start + 2) % 12;
  return `Q${index + 1} (${months[start]}–${months[end]})`;
}
export default function MilestoneView({ userId, roleId }: { userId: string; roleId: string }) {
  const [path, setPath] = useState<PersonalizedPath | null>(null);
  const [pathError, setPathError] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]); const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const loadPath = useCallback(() => { setPathError(false); generatePath({ userId, roleId }).then(setPath).catch(() => setPathError(true)); }, [userId, roleId]);
  useEffect(() => { const p = loadProgress(userId, roleId); setCompleted(p.completedOrders); setCheckedAt(p.lastCheckedAt); loadPath(); }, [userId, roleId, loadPath]);
  function toggle(order: number) { const next = completed.includes(order) ? completed.filter((v) => v !== order) : [...completed, order]; const now = new Date().toISOString(); setCompleted(next); setCheckedAt(now); saveProgress(userId, roleId, { completedOrders: next, lastCheckedAt: now }); }
  if (pathError) return <Notice text="We couldn't build your path." onRetry={loadPath} />;
  if (!path) return <section style={panel}>Building your next steps...</section>;
  const active = path.milestones.filter((m) => !completed.includes(m.order)); const done = path.milestones.filter((m) => completed.includes(m.order)); const percent = Math.round((done.length / path.milestones.length) * 100);
  return <section style={{ display: "grid", gap: 16, fontFamily: li.font }}>
    <div style={panel}><p style={{ margin: 0, color: li.green, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Your path</p><h2 style={{ margin: "4px 0", color: li.textPrimary }}>Progress toward {path.role.name}</h2><p style={{ color: li.textSecondary }}>{path.skillGaps.filter((g) => g.status === "missing").length ? `${path.skillGaps.filter((g) => g.status === "missing").length} skill${path.skillGaps.filter((g) => g.status === "missing").length === 1 ? "" : "s"} separate you from this role today.` : "Your profile already covers the role's core skill set."} {done.length} of {path.milestones.length} actions complete · {path.readinessScore}% role readiness</p><div style={{ height: 10, background: li.cardBorder, borderRadius: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${percent}%`, background: li.green, transition: "width .25s ease" }} /></div><p style={{ marginBottom: 0, fontSize: 12, color: li.textHint }}>{checkedAt ? `Last check-in ${new Date(checkedAt).toLocaleDateString()}` : "Check off actions as you complete them."}</p></div>
    <div style={panel}><h3 style={{ marginTop: 0 }}>Suggested timeline</h3>{[0, 1, 2, 3].map((pi) => { const items = active.filter((m) => phaseFor(m.order) === pi); return <div key={pi}><div style={{ padding: "14px 0" }}><div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>{phaseLabel(pi)}</div>{items.length ? items.map((m) => <MilestoneItem key={m.order} milestone={m} checked={false} onToggle={() => toggle(m.order)} />) : <p style={{ margin: "8px 0 0", fontSize: 13, color: li.textHint }}>Goals coming soon</p>}</div>{pi < 3 && <hr style={{ border: "none", borderTop: `1px solid ${li.cardBorder}`, margin: 0 }} />}</div>; })}</div>
    {done.length > 0 && <div style={panel}><h3 style={{ marginTop: 0 }}>Completed</h3>{done.map((m) => <MilestoneItem key={m.order} milestone={m} checked onToggle={() => toggle(m.order)} />)}</div>}
  </section>;
}
const panel: React.CSSProperties = { background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: "20px 24px" };
function Notice({ text, onRetry }: { text: string; onRetry: () => void }) { return <section style={panel}><p>{text}</p><button onClick={onRetry} style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", cursor: "pointer" }}>Retry</button></section>; }
function MilestoneItem({ milestone, checked, onToggle }: { milestone: Milestone; checked: boolean; onToggle: () => void }) { return <article style={{ borderTop: `1px solid ${li.cardBorder}`, padding: "14px 0", display: "flex", gap: 12 }}><input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Mark ${milestone.title} complete`} style={{ marginTop: 4, accentColor: li.blue }} /><div><strong>{milestone.title}</strong><p style={{ margin: "5px 0", fontSize: 13, color: li.textSecondary }}>{milestone.reason}</p><ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: li.textSecondary }}><li>{milestone.targetSkill} program</li></ul></div></article>; }
