"use client";

// Explain: deterministic, no-LLM career guidance backed by the v2 API.
//   - a free-text prompt ranks roles via POST /api/roles/recommend
//   - opening a role (from the prompt results, or carried in from Explore) loads a
//     plain-language explanation via POST /api/roles/explain
// "Compare this role" hands the canonical role id up to AppFlow.

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { explainRole, recommendRoles } from "../../lib/api";
import type { RoleExplanation, RoleRecommendation } from "../../lib/types";

const PROMPTS = [
  "I like AI but do not want to code all day",
  "I want something creative and high paying",
  "I want a technical job that is people-facing",
];

const chip = (bg: string, color: string): React.CSSProperties => ({
  background: bg, color, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 600, display: "inline-block", margin: 2,
});

interface Props {
  userId: string;
  roleId: string | null;
  onCompare: (roleId: string) => void;
}

export default function ExplainView({ userId, roleId, onCompare }: Props) {
  const [prompt, setPrompt] = useState("");
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<RoleRecommendation[] | null>(null);
  const [recError, setRecError] = useState(false);

  const [roleToExplain, setRoleToExplain] = useState<string | null>(roleId);
  const [explanation, setExplanation] = useState<RoleExplanation | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState(false);
  const [explainAttempt, setExplainAttempt] = useState(0);

  useEffect(() => {
    if (!roleToExplain) return;
    setExplaining(true);
    setExplainError(false);
    explainRole({ roleId: roleToExplain, userId })
      .then(setExplanation)
      .catch(() => setExplainError(true))
      .finally(() => setExplaining(false));
  }, [roleToExplain, userId, explainAttempt]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = prompt.trim();
    if (!query) return;
    setRecommending(true);
    setRecError(false);
    recommendRoles({ userId, query, interests: [], limit: 3 })
      .then((res) => setRecommendations(res.recommendations))
      .catch(() => setRecError(true))
      .finally(() => setRecommending(false));
  }

  const card: React.CSSProperties = { background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, fontFamily: li.font };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: li.font }}>
      <section style={{ ...card, padding: 20 }}>
        <p style={{ color: li.textPrimary, fontWeight: 600, margin: "0 0 4px" }}>Career Guide</p>
        <p style={{ color: li.textSecondary, marginTop: 0 }}>
          Describe what pulls you in and I’ll rank roles from this dataset — deterministic demo guidance, no AI guesswork.
        </p>
        <form onSubmit={submit} aria-label="career prompt">
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              aria-label="Career prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="I want to work with robotics, but I don’t know what role fits me."
              rows={2}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${li.cardBorder}`, fontFamily: li.font, fontSize: 14, resize: "vertical" }}
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              style={{ background: prompt.trim() ? li.blue : li.cardBorder, color: "#fff", border: "none", borderRadius: 999, padding: "8px 20px", fontWeight: 600, cursor: prompt.trim() ? "pointer" : "not-allowed", fontFamily: li.font, whiteSpace: "nowrap" }}
            >
              Find my fit
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => setPrompt(p)} style={{ ...chip(li.pageBg, li.textPrimary), cursor: "pointer", border: `1px solid ${li.cardBorder}` }}>
                {p}
              </button>
            ))}
          </div>
        </form>

        {recommending && <p style={{ color: li.textSecondary, marginBottom: 0 }}>Matching skills, paths, and courses…</p>}
        {recError && <p style={{ color: li.amber, marginBottom: 0 }}>Couldn’t fetch recommendations. Try again.</p>}
        {recommendations && recommendations.length === 0 && (
          <p style={{ color: li.textHint, marginBottom: 0 }}>No roles matched that prompt yet — try another phrasing.</p>
        )}
        {recommendations && recommendations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.role.id} rec={rec} onOpen={() => setRoleToExplain(rec.role.id)} />
            ))}
          </div>
        )}
      </section>

      {roleToExplain && (
        <section style={{ ...card, padding: 20 }}>
          {explaining ? (
            <p style={{ color: li.textSecondary, margin: 0 }}>Loading explanation…</p>
          ) : explainError ? (
            <div>
              <p style={{ color: li.textPrimary, margin: "0 0 8px" }}>We couldn’t load this explanation.</p>
              <button onClick={() => setExplainAttempt((a) => a + 1)} style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontFamily: li.font }}>
                Retry
              </button>
            </div>
          ) : explanation ? (
            <Explanation explanation={explanation} onCompare={() => onCompare(roleToExplain)} />
          ) : null}
        </section>
      )}
    </div>
  );
}

function RecommendationCard({ rec, onOpen }: { rec: RoleRecommendation; onOpen: () => void }) {
  return (
    <article style={{ border: `1px solid ${li.cardBorder}`, borderRadius: li.cardRadius, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: li.blue }}>{rec.role.name}</p>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <strong style={{ fontSize: 20, color: li.textPrimary }}>{rec.readinessScore}%</strong>
          <div style={{ fontSize: 11, color: li.textHint }}>readiness</div>
        </div>
      </div>
      <ul style={{ margin: "8px 0", paddingLeft: 18, color: li.textSecondary, fontSize: 13 }}>
        {rec.scoreReasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
      <div style={{ marginBottom: 10 }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, color: li.textSecondary }}>You already bring</p>
        {rec.matchedSkills.length > 0
          ? rec.matchedSkills.map((s) => <span key={s} style={chip(li.greenBg, li.green)}>{s}</span>)
          : <span style={chip(li.pageBg, li.textHint)}>New territory</span>}
      </div>
      <button type="button" onClick={onOpen} style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "6px 18px", fontWeight: 600, cursor: "pointer", fontFamily: li.font }}>
        Explore this role →
      </button>
    </article>
  );
}

function Explanation({ explanation, onCompare }: { explanation: RoleExplanation; onCompare: () => void }) {
  const { role, salaryRange } = explanation;
  const hasSalary = salaryRange.min !== null && salaryRange.max !== null;
  return (
    <div>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, color: li.textPrimary }}>{role.name}</h2>
      <p style={{ margin: "0 0 12px", color: li.textPrimary }}>{explanation.plainLanguageSummary}</p>

      <h3 style={{ margin: "0 0 4px", fontSize: 14, color: li.textSecondary }}>Day to day</h3>
      <ul style={{ margin: "0 0 12px", paddingLeft: 18, color: li.textPrimary, fontSize: 14, lineHeight: 1.6 }}>
        {explanation.dayToDay.map((d) => <li key={d}>{d}</li>)}
      </ul>

      <h3 style={{ margin: "0 0 4px", fontSize: 14, color: li.textSecondary }}>Core skills</h3>
      <div style={{ marginBottom: 12 }}>
        {explanation.coreSkills.map((s) => <span key={s} style={chip(li.blueLight, li.blue)}>{s}</span>)}
      </div>

      {explanation.relatedRoles.length > 0 && (
        <p style={{ margin: "0 0 12px", fontSize: 13, color: li.textSecondary }}>
          Related: {explanation.relatedRoles.map((r) => r.name).join(", ")}
        </p>
      )}

      <p style={{ margin: "0 0 12px", fontSize: 13, color: li.textSecondary }}>
        Salary: {hasSalary ? `$${salaryRange.min!.toLocaleString()}–$${salaryRange.max!.toLocaleString()}` : "demo guidance only"}
      </p>

      <div style={{ background: li.blueLight, borderRadius: 8, padding: 12, marginBottom: 14 }}>
        <strong style={{ color: li.blue }}>Why it may fit:</strong>{" "}
        <span style={{ color: li.textPrimary }}>{explanation.whyItMayFit}</span>
      </div>

      <p style={{ margin: "0 0 12px", fontSize: 12, color: li.textHint }}>{explanation.disclaimer}</p>

      <button type="button" onClick={onCompare} style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 22px", fontWeight: 700, cursor: "pointer", fontFamily: li.font }}>
        Compare your profile to this role
      </button>
    </div>
  );
}
