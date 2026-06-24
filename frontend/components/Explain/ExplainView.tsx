"use client";

// Career Guide: deterministic, no-LLM guidance backed by the v3 API.
//   - a Top-applicant jobs scroller (POST /api/jobs/top-applicant) — real postings the user fits best
//   - a free-text prompt that ranks roles (POST /api/roles/recommend)
//   - "Explore this role" opens the shared RoleFifaCard modal (centered) — NOT a scroll-down section
// The modal's CTA hands the canonical role id up to AppFlow for Compare.

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { getTopApplicantJobs, recommendRoles } from "../../lib/api";
import type { RoleRecommendation, TopApplicantJob } from "../../lib/types";
import RoleFifaCard from "../RoleCard/RoleFifaCard";

const PROMPTS = [
  "I like AI but do not want to code all day",
  "I want something creative and high paying",
  "I want a technical job that is people-facing",
];

const chip = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 600, display: "inline-block", margin: 2 });

interface Props {
  userId: string;
  onCompare: (roleId: string) => void;
}

export default function ExplainView({ userId, onCompare }: Props) {
  const [prompt, setPrompt] = useState("");
  const [recommending, setRecommending] = useState(false);
  const [recommendations, setRecommendations] = useState<RoleRecommendation[] | null>(null);
  const [recError, setRecError] = useState(false);

  const [topJobs, setTopJobs] = useState<TopApplicantJob[] | null>(null);
  const [topError, setTopError] = useState(false);
  const [topAttempt, setTopAttempt] = useState(0);

  const [openRoleId, setOpenRoleId] = useState<string | null>(null);

  useEffect(() => {
    setTopJobs(null);
    setTopError(false);
    getTopApplicantJobs({ userId, limit: 25 })
      .then((res) => setTopJobs(res.jobs))
      .catch(() => setTopError(true));
  }, [userId, topAttempt]);

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
        <h2 style={{ margin: "0 0 4px", fontSize: 18, color: li.textPrimary }}>Jobs you’d be a top applicant for</h2>
        <p style={{ margin: "0 0 12px", color: li.textSecondary, fontSize: 13 }}>Real postings ranked by how well your profile fits.</p>
        {topError ? (
          <div>
            <p style={{ color: li.amber, margin: "0 0 8px" }}>Couldn’t load jobs.</p>
            <button onClick={() => setTopAttempt((a) => a + 1)} style={btn}>Retry</button>
          </div>
        ) : topJobs === null ? (
          <p style={{ color: li.textSecondary, margin: 0 }}>Finding your best-fit jobs…</p>
        ) : topJobs.length === 0 ? (
          <p style={{ color: li.textHint, margin: 0 }}>No strong matches yet — build a few more skills.</p>
        ) : (
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }} data-testid="top-jobs-scroll">
            {topJobs.map((job) => (
              <article key={job.id} style={{ flex: "0 0 220px", border: `1px solid ${li.cardBorder}`, borderRadius: li.cardRadius, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: li.textPrimary }}>{job.company}</div>
                <div style={{ fontSize: 12, color: li.textSecondary }}>{job.location} · {job.level}</div>
                {job.topApplicant && <span style={{ ...chip(li.greenBg, li.green), marginTop: 8 }}>Top applicant</span>}
                <button type="button" onClick={() => setOpenRoleId(job.roleId)} style={{ ...linkBtn, marginTop: 8 }}>
                  Explore this role →
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

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
            <button type="submit" disabled={!prompt.trim()} style={{ ...btn, background: prompt.trim() ? li.blue : li.cardBorder, cursor: prompt.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}>
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
              <RecommendationCard key={rec.role.id} rec={rec} onExplore={() => setOpenRoleId(rec.role.id)} />
            ))}
          </div>
        )}
      </section>

      {openRoleId && (
        <RoleFifaCard
          userId={userId}
          roleId={openRoleId}
          onClose={() => setOpenRoleId(null)}
          onCompare={(rid) => { setOpenRoleId(null); onCompare(rid); }}
        />
      )}
    </div>
  );
}

const btn: React.CSSProperties = { background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontFamily: li.font };
const linkBtn: React.CSSProperties = { background: "transparent", color: li.blue, border: "none", padding: 0, fontWeight: 600, cursor: "pointer", fontFamily: li.font, fontSize: 13 };

function RecommendationCard({ rec, onExplore }: { rec: RoleRecommendation; onExplore: () => void }) {
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
      <button type="button" onClick={onExplore} style={btn}>Explore this role →</button>
    </article>
  );
}
