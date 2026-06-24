"use client";

// The Comparison Page: opens when a user clicks a role on the map.
// Styled as a LinkedIn card — header band, role detail, % fit ring, skill gap,
// and a pill "Build my path" button that hands the selected user/role to the
// Your Path page. All fit data comes from the v2 backend (POST /api/compare);
// no local skill math lives here.

import { useCallback, useEffect, useState } from "react";
import type { RoleComparison } from "../../lib/types";
import { compareRole } from "../../lib/api";
import { li } from "../../lib/theme";
import FitRing from "./FitRing";
import SkillColumns from "./SkillColumns";

interface ComparisonPanelProps {
  userId: string;
  roleId: string;
  onBuildPath?: (payload: { userId: string; roleId: string; missingSkills: string[] }) => void;
}

export default function ComparisonPanel({
  userId,
  roleId,
  onBuildPath,
}: ComparisonPanelProps) {
  const [comparison, setComparison] = useState<RoleComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(false);
    compareRole({ userId, roleId })
      .then((c) => {
        if (active) setComparison(c);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, roleId]);

  useEffect(() => load(), [load]);

  const card: React.CSSProperties = {
    background: li.cardBg,
    borderRadius: li.cardRadius,
    boxShadow: li.cardShadow,
    fontFamily: li.font,
    color: li.textPrimary,
    overflow: "hidden",
  };

  if (error) {
    return (
      <div style={{ ...card, padding: 32, color: li.textSecondary }}>
        <p style={{ margin: "0 0 16px" }}>We couldn’t load this role comparison.</p>
        <button
          onClick={load}
          style={{
            background: li.blue,
            color: "#fff",
            border: "none",
            borderRadius: 24,
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: li.font,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !comparison) {
    return (
      <div style={{ ...card, padding: 32, color: li.textSecondary }}>
        Loading role fit…
      </div>
    );
  }

  const { role, readinessScore, strengths, skillGaps, aggregateAnalysis } = comparison;
  const missingSkills = skillGaps.filter((g) => g.status === "missing").map((g) => g.skill);
  const postings = role.postings ?? [];

  const handleBuild = () => {
    const payload = { userId, roleId: role.id, missingSkills };
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
            {role.name.charAt(0)}
          </div>
          <h2 style={{ margin: "12px 0 4px", fontSize: 24, fontWeight: 600 }}>
            {role.name}
          </h2>
          <p style={{ margin: 0, color: li.textSecondary, lineHeight: 1.5, fontSize: 15 }}>
            {role.summary}
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
          <FitRing percent={readinessScore} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h4 style={{ margin: "0 0 10px", fontSize: 16 }}>
              {readinessScore >= 70 ? "Jobs where you’d be a top applicant" : "Open roles"}
              {role.jobCount != null && (
                <span style={{ color: li.textSecondary, fontWeight: 400 }}>
                  {" "}· {role.jobCount} open
                </span>
              )}
            </h4>
            {/* Real postings from jobs_data.json (company, location, salary,
                level, and the REAL easyApply flag). */}
            <div>
              {postings.map((p, i, arr) => (
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
                      {role.name}
                    </div>
                    <div style={{ color: li.textSecondary, fontSize: 14 }}>
                      {p.company} · {p.location}
                    </div>
                    {readinessScore >= 70 && (
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

        {/* Skill gap — strengths vs. missing core gaps, both from the backend. */}
        <SkillColumns
          haveSkills={strengths}
          missingSkills={missingSkills}
        />

        <div
          style={{
            marginTop: 20,
            padding: "12px 16px",
            background: li.blueLight,
            borderRadius: li.cardRadius,
            color: li.textPrimary,
            fontSize: 14,
            lineHeight: 1.45,
          }}
        >
          <strong>{aggregateAnalysis.analyzed.toLocaleString()} profiles analyzed.</strong>{" "}
          {aggregateAnalysis.landed.toLocaleString()} people in the dataset have held this role
          {aggregateAnalysis.similar > 0 ? (
            <>; {aggregateAnalysis.similar.toLocaleString()} share at least one skill with you.</>
          ) : (
            "."
          )}
        </div>

        {/* Handoff to Your Path — IDs only; missing skills come from the backend. */}
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
