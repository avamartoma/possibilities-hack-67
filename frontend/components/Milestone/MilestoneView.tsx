"use client";

import { useEffect, useState } from "react";
import { getMilestonePlan } from "../../lib/api";
import type { MilestonePlan } from "../../lib/types";
import { li } from "../../lib/theme";

export default function MilestoneView({ userId, roleId }: { userId: string; roleId: string }) {
  const [plan, setPlan] = useState<MilestonePlan | null>(null);

  useEffect(() => {
    let active = true;
    getMilestonePlan(userId, roleId).then((result) => active && setPlan(result));
    return () => { active = false; };
  }, [userId, roleId]);

  if (!plan) return <section style={{ background: li.cardBg, borderRadius: li.cardRadius, padding: 28, color: li.textSecondary }}>Building your next steps...</section>;

  return <section style={{ display: "grid", gap: 16, fontFamily: li.font }}>
    <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: 22 }}>
      <p style={{ margin: 0, color: li.green, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Your path</p>
      <h2 style={{ margin: "4px 0", color: li.textPrimary, fontSize: 24 }}>Progress toward {plan.role.name}</h2>
      <p style={{ margin: "0 0 12px", color: li.textSecondary }}>{plan.missingSkills.length ? `${plan.missingSkills.length} skills separate you from this role today.` : "Your profile already covers the role's core skill set."}</p>
      <div style={{ height: 9, borderRadius: 8, overflow: "hidden", background: li.cardBorder }}><div style={{ width: `${plan.readiness}%`, height: "100%", background: li.green }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: li.textHint, fontSize: 12 }}><span>Today</span><span>{plan.readiness}% ready</span><span>{plan.role.name}</span></div>
    </div>
    <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: 22 }}>
      <h3 style={{ margin: "0 0 16px", color: li.textPrimary }}>Next highest-impact actions</h3>
      <div style={{ display: "grid", gap: 14 }}>
        {plan.milestones.map((milestone) => <article key={milestone.step} style={{ borderLeft: `3px solid ${milestone.step === 1 ? li.blue : li.cardBorder}`, padding: "2px 0 2px 15px" }}>
          <p style={{ margin: 0, color: li.blue, fontSize: 12, fontWeight: 700 }}>STEP {milestone.step} · {milestone.skill}</p>
          <h4 style={{ margin: "3px 0 6px", color: li.textPrimary, fontSize: 16 }}>{milestone.title}</h4>
          {milestone.course && <p style={{ margin: "0 0 7px", color: li.textSecondary, fontSize: 13 }}>Course: <strong style={{ color: li.textPrimary }}>{milestone.course}</strong>{milestone.courseLength ? ` · ${milestone.courseLength.value} ${milestone.courseLength.unit}` : ""}</p>}
          <ul style={{ margin: 0, paddingLeft: 18, color: li.textSecondary, fontSize: 13, lineHeight: 1.55 }}>{milestone.actions.map((action) => <li key={action}>{action}</li>)}</ul>
        </article>)}
      </div>
    </div>
  </section>;
}
