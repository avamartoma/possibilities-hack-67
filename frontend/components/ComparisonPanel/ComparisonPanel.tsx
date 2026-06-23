"use client";

// The Comparison Page: opens when a user clicks a role on the map.
// Styled as a LinkedIn card — header band, role detail, % fit ring, skill gap,
// and a pill "Build my path" button that hands the gap to the Milestone page.

import { useEffect, useState } from "react";
import type { FitResult } from "../../lib/types";
import { getFit } from "../../lib/api";
import { li } from "../../lib/theme";
import FitRing from "./FitRing";
import SkillColumns from "./SkillColumns";

interface ComparisonPanelProps {
  userId: string;
  roleId: string;
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

  const card: React.CSSProperties = {
    background: li.cardBg,
    borderRadius: li.cardRadius,
    boxShadow: li.cardShadow,
    fontFamily: li.font,
    color: li.textPrimary,
    overflow: "hidden",
  };

  if (loading || !fit) {
    return (
      <div style={{ ...card, padding: 32, color: li.textSecondary }}>
        Loading role fit…
      </div>
    );
  }

  const handleBuild = () => {
    const payload = { roleId: fit.role.id, missingSkills: fit.missingSkills };
    if (onBuildPath) onBuildPath(payload);
    else console.log("Build my path →", payload);
  };

  return (
    <div style={card}>
      {/* Header band (LinkedIn profile-cover style) */}
      <div
        style={{
          height: 88,
          background: `linear-gradient(120deg, ${li.blue}, #378fe9)`,
        }}
      />

      <div style={{ padding: "0 24px 24px" }}>
        {/* Role title overlapping the band */}
        <div style={{ marginTop: -24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              background: li.blueLight,
              border: `2px solid ${li.cardBg}`,
              boxShadow: li.cardShadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 700,
              color: li.blue,
            }}
          >
            {fit.role.name.charAt(0)}
          </div>
          <h2 style={{ margin: "12px 0 4px", fontSize: 24, fontWeight: 600 }}>
            {fit.role.name}
          </h2>
          <p style={{ margin: 0, color: li.textSecondary, lineHeight: 1.5, fontSize: 15 }}>
            {fit.role.description}
          </p>
        </div>

        <hr style={{ border: "none", borderTop: `1px solid ${li.cardBorder}`, margin: "20px 0" }} />

        {/* Ring + companies */}
        <div
          style={{
            display: "flex",
            gap: 32,
            alignItems: "center",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <FitRing percent={fit.percent} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 16 }}>
              {fit.percent >= 70 ? "Jobs where you’d be a top applicant" : "Open roles"}
              {fit.role.jobCount != null && (
                <span style={{ color: li.textSecondary, fontWeight: 400 }}>
                  {" "}· {fit.role.jobCount} open
                </span>
              )}
            </h4>
            {/* Real postings from jobs_data.json (company, location, salary,
                level, and the REAL easyApply flag). */}
            <div>
              {(fit.role.postings ?? []).map((p, i, arr) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: i < arr.length - 1 ? `1px solid ${li.cardBorder}` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      background: li.blueLight,
                      color: li.blue,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {p.company.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: li.blue, fontSize: 15 }}>
                      {fit.role.name}
                    </div>
                    <div style={{ color: li.textSecondary, fontSize: 14 }}>
                      {p.company} · {p.location}
                    </div>
                    {fit.percent >= 70 && (
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: 4,
                          background: li.greenBg,
                          color: li.green,
                          borderRadius: 4,
                          padding: "1px 8px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Strong applicant
                      </span>
                    )}
                    <div style={{ color: li.textHint, fontSize: 12, marginTop: 4 }}>
                      {p.level} · ${Math.round(p.salaryFrom / 1000)}K–$
                      {Math.round(p.salaryTo / 1000)}K
                      {p.easyApply && (
                        <>
                          {" · "}
                          <span style={{ color: li.blue, fontWeight: 600 }}>Easy Apply</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: `1px solid ${li.cardBorder}`, margin: "20px 0" }} />

        {/* Skill gap */}
        <SkillColumns
          haveSkills={fit.haveSkills}
          missingSkills={fit.missingSkills}
        />

        {/* Handoff to Milestone page */}
        <button
          onClick={handleBuild}
          style={{
            marginTop: 24,
            background: li.blue,
            color: "#fff",
            border: "none",
            borderRadius: 24,
            padding: "10px 28px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: li.font,
          }}
        >
          Build my path →
        </button>
      </div>
    </div>
  );
}
