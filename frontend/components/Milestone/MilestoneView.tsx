"use client";

// Your Path: turns the v2 backend path (POST /api/path/generate) into a
// LinkedIn-style milestone feed. All milestone content comes from the backend
// PersonalizedPath; checkbox completion is local UI state only.

import { useCallback, useEffect, useState } from "react";
import { generatePath } from "../../lib/api";
import type { PersonalizedPath } from "../../lib/types";
import { li } from "../../lib/theme";

type Milestone = PersonalizedPath["milestones"][number];

export default function MilestoneView({ userId, roleId }: { userId: string; roleId: string }) {
  const [path, setPath] = useState<PersonalizedPath | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setError(false);
    generatePath({ userId, roleId })
      .then((result) => {
        if (active) setPath(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [userId, roleId]);

  useEffect(() => load(), [load]);

  if (error) {
    return (
      <section style={{ background: li.cardBg, borderRadius: li.cardRadius, padding: 28, color: li.textSecondary, fontFamily: li.font }}>
        <p style={{ margin: "0 0 16px" }}>We couldn’t build your path.</p>
        <button
          onClick={load}
          style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 24, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: li.font }}
        >
          Retry
        </button>
      </section>
    );
  }

  if (!path) {
    return <section style={{ background: li.cardBg, borderRadius: li.cardRadius, padding: 28, color: li.textSecondary }}>Building your next steps...</section>;
  }

  function toggle(order: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(order) ? next.delete(order) : next.add(order);
      return next;
    });
  }

  const gapCount = path.skillGaps.filter((g) => g.status === "missing").length;

  return <section style={{ display: "grid", gap: 16, fontFamily: li.font }}>
    <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: 22 }}>
      <p style={{ margin: 0, color: li.green, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Your path</p>
      <h2 style={{ margin: "4px 0", color: li.textPrimary, fontSize: 24 }}>Progress toward {path.role.name}</h2>
      <p style={{ margin: "0 0 12px", color: li.textSecondary }}>{gapCount ? `${gapCount} skill${gapCount === 1 ? "" : "s"} separate you from this role today.` : "Your profile already covers the role's core skill set."}</p>
      <div style={{ height: 9, borderRadius: 8, overflow: "hidden", background: li.cardBorder }}><div style={{ width: `${path.readinessScore}%`, height: "100%", background: li.green }} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, color: li.textHint, fontSize: 12 }}><span>Today</span><span>{path.readinessScore}% ready</span><span>{path.role.name}</span></div>
    </div>
    <div style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: "20px 24px" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 600, color: li.textPrimary }}>Next highest-impact actions</h3>
      {path.milestones.map((milestone, i, arr) => (
        <MilestoneItem
          key={milestone.order}
          milestone={milestone}
          isChecked={checked.has(milestone.order)}
          onToggle={() => toggle(milestone.order)}
          showDivider={i < arr.length - 1}
        />
      ))}
    </div>
    <p style={{ margin: 0, color: li.textHint, fontSize: 12, fontStyle: "italic" }}>{path.disclaimer}</p>
  </section>;
}

const COMPANIES = ["Innovatech", "Stanford University", "Cobalt Labs", "Polaris Systems"];

function MilestoneItem({ milestone, isChecked, onToggle, showDivider }: {
  milestone: Milestone;
  isChecked: boolean;
  onToggle: () => void;
  showDivider: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const company = COMPANIES[(milestone.order - 1) % COMPANIES.length];
  const courseLength = milestone.course?.length;

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
              aria-label={`Mark ${milestone.title} complete`}
              style={{
                position: "absolute", top: -4, right: -4,
                width: 18, height: 18, cursor: "pointer",
                accentColor: li.blue,
              }}
            />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: li.textPrimary }}>Opportunity {milestone.order}</div>
          <div style={{ fontSize: 14, color: li.textPrimary }}>{milestone.title}</div>
          <div style={{ fontSize: 13, color: li.textSecondary }}>{milestone.targetSkill}</div>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: li.textSecondary }}>{milestone.reason}</p>
          {milestone.course && (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: li.textSecondary }}>
              Course: <strong style={{ color: li.textPrimary }}>{milestone.course.name}</strong>
              {courseLength ? ` · ${courseLength.value} ${courseLength.unit}` : ""}
            </p>
          )}
          <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: li.textSecondary, fontSize: 13, lineHeight: 1.55 }}>
            <li>{milestone.project}</li>
            <li>{milestone.networkingAction}</li>
            <li>{milestone.profileCheckpoint}</li>
          </ul>
        </div>
      </div>
      {showDivider && <hr style={{ border: "none", borderTop: `1px solid ${li.cardBorder}`, margin: "16px 0" }} />}
    </div>
  );
}
