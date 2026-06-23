"use client";

// The Comparison Page: opens when a user clicks a role on the map.
// Shows what the role is, who's hiring, the % fit ring, and the skill gap,
// then hands the gap off to the Milestone page via "Build my path".

import { useEffect, useState } from "react";
import type { FitResult } from "../../lib/types";
import { getFit } from "../../lib/api";
import FitRing from "./FitRing";
import SkillColumns from "./SkillColumns";

interface ComparisonPanelProps {
  userId: string;
  roleId: string;
  // Handoff to the Milestone page (Person C). Defaults to a console log so this
  // component runs standalone; the map shell wires the real navigation.
  onBuildPath?: (payload: { roleId: string; missingSkills: string[] }) => void;
}

export default function ComparisonPanel({
  userId,
  roleId,
  onBuildPath,
}: ComparisonPanelProps) {
  const [fit, setFit] = useState<FitResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getFit(userId, roleId)
      .then((f) => active && setFit(f))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId, roleId]);

  if (loading || !fit) {
    return (
      <div style={{ padding: 32, color: "#64748b" }}>Loading role fit…</div>
    );
  }

  const handleBuild = () => {
    const payload = { roleId: fit.role.id, missingSkills: fit.missingSkills };
    if (onBuildPath) onBuildPath(payload);
    else console.log("Build my path →", payload);
  };

  return (
    <div
      style={{
        maxWidth: 760,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        padding: 32,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#0f172a",
      }}
    >
      {/* Role header */}
      <h2 style={{ margin: "0 0 4px", fontSize: 28 }}>{fit.role.name}</h2>
      <p style={{ margin: "0 0 20px", color: "#475569", lineHeight: 1.5 }}>
        {fit.role.description}
      </p>

      {/* Ring + companies */}
      <div
        style={{
          display: "flex",
          gap: 32,
          alignItems: "center",
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        <FitRing percent={fit.percent} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h4 style={{ margin: "0 0 10px", color: "#0f172a" }}>
            Companies hiring
          </h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {fit.role.companies.map((c) => (
              <span
                key={c}
                style={{
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Skill gap */}
      <SkillColumns
        haveSkills={fit.haveSkills}
        missingSkills={fit.missingSkills}
      />

      {/* Handoff to Milestone page */}
      <button
        onClick={handleBuild}
        style={{
          marginTop: 28,
          width: "100%",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          padding: "16px",
          fontSize: 17,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Build my path →
      </button>
    </div>
  );
}
