"use client";

import { useEffect, useState } from "react";
import { getMilestonePlan } from "../../lib/api";
import type { MilestonePlan } from "../../lib/types";
import { li } from "../../lib/theme";

export default function MilestoneView({ userId, roleId }: { userId: string; roleId: string }) {
  const [plan, setPlan] = useState<MilestonePlan | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    let active = true;
    getMilestonePlan(userId, roleId).then((result) => active && setPlan(result));
    return () => { active = false; };
  }, [userId, roleId]);

  if (!plan) return <section style={{ background: li.cardBg, borderRadius: li.cardRadius, padding: 28, color: li.textSecondary }}>Building your next steps...</section>;

  function toggle(step: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(step) ? next.delete(step) : next.add(step);
      return next;
    });
  }

  return <section style={{ display: "grid", gap: 16, fontFamily: li.font }}>
    <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: 22 }}>
      <p style={{ margin: 0, color: li.green, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Your path</p>
      <h2 style={{ margin: "4px 0", color: li.textPrimary, fontSize: 24 }}>Progress toward {plan.role.name}</h2>
      <p style={{ margin: "0 0 12px", color: li.textSecondary }}>{plan.missingSkills.length ? `${plan.missingSkills.length} skills separate you from this role today.` : "Your profile already covers the role's core skill set."}</p>
      <div style={{ height: 9, borderRadius: 8, overflow: "hidden", background: li.cardBorder }}><div style={{ width: `${plan.readiness}%`, height: "100%", background: li.green }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: li.textHint, fontSize: 12 }}><span>Today</span><span>{plan.readiness}% ready</span><span>{plan.role.name}</span></div>
    </div>
    <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: "20px 24px" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 600, color: li.textPrimary }}>Next highest-impact actions</h3>
      {plan.milestones.map((milestone, i, arr) => (
        <MilestoneItem
          key={milestone.step}
          milestone={milestone}
          isChecked={checked.has(milestone.step)}
          onToggle={() => toggle(milestone.step)}
          showDivider={i < arr.length - 1}
        />
      ))}
    </div>
  </section>;
}

const COMPANIES = ["Innovatech", "Stanford University", "Cobalt Labs", "Polaris Systems"];

function MilestoneItem({ milestone, isChecked, onToggle, showDivider }: {
  milestone: { step: number; skill: string; title: string; course?: string; courseLength?: { value: number; unit: string }; actions: string[] };
  isChecked: boolean;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const company = COMPANIES[(milestone.step - 1) % COMPANIES.length];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 8,
            background: li.blueLight, color: li.blue,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 700,
          }}>
            {company.charAt(0).toUpperCase()}
          </div>
          {(hovered || isChecked) && (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={onToggle}
              style={{
                position: "absolute", top: -4, right: -4,
                width: 18, height: 18, cursor: "pointer",
                accentColor: li.blue,
              }}
            />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>Opportunity {milestone.step}</div>
          <div style={{ fontSize: 14, color: li.textPrimary }}>{company}</div>
          <div style={{ fontSize: 13, color: li.textSecondary }}>{milestone.skill}</div>
          {milestone.course && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: li.textSecondary }}>
              Course: <strong style={{ color: li.textPrimary }}>{milestone.course}</strong>
              {milestone.courseLength ? ` \u00b7 ${milestone.courseLength.value} ${milestone.courseLength.unit}` : ""}
            </p>
          )}
          {milestone.actions.length > 0 && (
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: li.textSecondary, fontSize: 13, lineHeight: 1.55 }}>
              {milestone.actions.map((action) => <li key={action}>{action}</li>)}
            </ul>
          )}
        </div>
      </div>
      {showDivider && <hr style={{ border: "none", borderTop: `1px solid ${li.cardBorder}`, margin: "16px 0" }} />}
    </div>
  );
}
