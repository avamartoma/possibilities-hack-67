"use client";

import { useCallback, useEffect, useState } from "react";
import { generatePath } from "../../lib/api";
import { loadProgress, saveProgress } from "../../lib/persistence";
import type { PersonalizedPath } from "../../lib/types";
import { li } from "../../lib/theme";

type Milestone = PersonalizedPath["milestones"][number];
function phaseFor(order: number) { return order === 1 ? "Next 4 weeks" : order <= 3 ? "This quarter" : "Next 6 months"; }
function targetFor(date: string, order: number) { const d = new Date(date); d.setDate(d.getDate() + (order === 1 ? 28 : order <= 3 ? 90 : 180)); return `Target by ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`; }

export default function MilestoneView({ userId, roleId, onCompare }: { userId: string; roleId: string; onCompare?: () => void }) {
  const [path, setPath] = useState<PersonalizedPath | null>(null);
  const [pathError, setPathError] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]); const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const loadPath = useCallback(() => { setPathError(false); generatePath({ userId, roleId }).then(setPath).catch(() => setPathError(true)); }, [userId, roleId]);
  useEffect(() => { const p = loadProgress(userId, roleId); setCompleted(p.completedOrders); setCheckedAt(p.lastCheckedAt); loadPath(); }, [userId, roleId, loadPath]);
  function toggle(order: number) { const next = completed.includes(order) ? completed.filter((v) => v !== order) : [...completed, order]; const now = new Date().toISOString(); setCompleted(next); setCheckedAt(now); saveProgress(userId, roleId, { completedOrders: next, lastCheckedAt: now }); }
  if (pathError) return <Notice text="We couldn’t build your path." onRetry={loadPath} />;
  if (!path) return <section style={panel}>Building your next steps...</section>;
  const active = path.milestones.filter((m) => !completed.includes(m.order)); const done = path.milestones.filter((m) => completed.includes(m.order)); const percent = Math.round((done.length / path.milestones.length) * 100);
  return <section style={{ display: "grid", gap: 16, fontFamily: li.font, width: "min(100%, 760px)", minWidth: 0, overflowX: "hidden" }}>
    <div style={panel}><p style={{ margin: 0, color: li.green, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Your path</p><h1 style={{ margin: "4px 0", color: li.textPrimary, fontSize: 24, overflowWrap: "anywhere" }}>{path.role.name}</h1><p style={{ color: li.textSecondary }}>{path.readinessScore}% readiness · {path.startingStrengths.length} strengths · {path.skillGaps.filter((g) => g.status === "missing").length} gaps · {done.length}/{path.milestones.length} actions complete</p>{onCompare && <button onClick={onCompare} style={{ background: "transparent", border: `1px solid ${li.blue}`, borderRadius: 999, color: li.blue, padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}>Compare profile</button>}<div style={{ height: 10, background: li.cardBorder, borderRadius: 8, overflow: "hidden", marginTop: 12 }}><div style={{ height: "100%", width: `${percent}%`, background: li.green, transition: "width .25s ease" }} /></div><p style={{ marginBottom: 0, fontSize: 12, color: li.textHint }}>{checkedAt ? `Last check-in ${new Date(checkedAt).toLocaleDateString()}` : "Check off actions as you complete them."}</p></div>
    <div style={panel}><h3 style={{ marginTop: 0 }}>Timeline</h3>{["Next 4 weeks", "This quarter", "Next 6 months"].map((phase) => { const items = active.filter((m) => phaseFor(m.order) === phase); return items.length ? <div key={phase}><p style={{ color: li.blue, fontSize: 13, fontWeight: 700, margin: "18px 0 6px" }}>{phase}</p>{items.map((m) => <MilestoneItem key={m.order} milestone={m} checked={false} target={targetFor(path.generatedAt, m.order)} onToggle={() => toggle(m.order)} />)}</div> : null; })}</div>
    {done.length > 0 && <div style={panel}><h3 style={{ marginTop: 0 }}>Completed</h3>{done.map((m) => <MilestoneItem key={m.order} milestone={m} checked target="Completed" onToggle={() => toggle(m.order)} />)}</div>}
    <p style={{ margin: 0, color: li.textHint, fontSize: 12, fontStyle: "italic" }}>{path.disclaimer}</p>
  </section>;
}
const panel: React.CSSProperties = { background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: "20px 24px", minWidth: 0, boxSizing: "border-box" };
function Notice({ text, onRetry }: { text: string; onRetry: () => void }) { return <section style={panel}><p>{text}</p><button onClick={onRetry} style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 20, padding: "8px 16px", cursor: "pointer" }}>Retry</button></section>; }
function MilestoneItem({ milestone, checked, target, onToggle }: { milestone: Milestone; checked: boolean; target: string; onToggle: () => void }) { return <article style={{ borderTop: `1px solid ${li.cardBorder}`, padding: "14px 0", display: "flex", gap: 12, minWidth: 0 }}><input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Mark ${milestone.title} complete`} style={{ marginTop: 4, accentColor: li.blue, flexShrink: 0 }} /><div style={{ minWidth: 0, overflowWrap: "anywhere" }}><strong>{milestone.title}</strong><div style={{ fontSize: 12, color: li.textHint }}>{target} · <span>{milestone.course?.name || milestone.targetSkill}</span></div><p style={{ margin: "5px 0", fontSize: 13, color: li.textSecondary }}>{milestone.reason}</p><details><summary style={{ color: li.blue, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>View actions</summary><ul style={{ margin: "7px 0 0", paddingLeft: 18, fontSize: 13, color: li.textSecondary }}><li>{milestone.project}</li><li>{milestone.networkingAction}</li><li>{milestone.profileCheckpoint}</li></ul></details></div></article>; }
