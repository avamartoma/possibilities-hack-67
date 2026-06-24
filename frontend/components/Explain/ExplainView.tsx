"use client";

// Explain (Person B — Muhammed): a chat-style router. You describe what you
// want; it ranks canonical roles (matchCareers, ported from his slice) and
// hands the chosen role to the Comparison step. UI re-skinned to the shared
// LinkedIn theme; logic preserved.

import { useState } from "react";
import { li } from "../../lib/theme";
import { TITLE_TO_ROLE_ID } from "../../lib/explore/taxonomy";
import { matchCareers, type CareerMatch, type MatchProfile } from "../../lib/explain/careerMatcher";

const PROMPTS = [
  "I like AI but do not want to code all day",
  "I want something creative and high paying",
  "I like psychology, design, and tech",
  "I want to work at a startup",
  "I want a technical job that is people-facing",
];

interface Props {
  profile: MatchProfile & { name?: string };
  onPickRole: (roleId: string | null, title: string) => void;
}

const chip = (bg: string, color: string): React.CSSProperties => ({
  background: bg,
  color,
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 13,
  fontWeight: 600,
  display: "inline-block",
  margin: 2,
});

export default function ExplainView({ profile, onPickRole }: Props) {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [thinking, setThinking] = useState(false);
  const [results, setResults] = useState<CareerMatch[]>([]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = message.trim();
    if (!next) return;
    setSubmitted(next);
    setMessage("");
    setThinking(true);
    window.setTimeout(() => {
      setResults(matchCareers(next, profile));
      setThinking(false);
    }, 500);
  }

  const card: React.CSSProperties = {
    background: li.cardBg,
    borderRadius: li.cardRadius,
    boxShadow: li.cardShadow,
    fontFamily: li.font,
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24, alignItems: "start" }}>
      {/* Interests panel */}
      <aside style={{ ...card, padding: 16 }}>
        <p style={{ margin: 0, color: li.textSecondary, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
          Your interests
        </p>
        <h3 style={{ margin: "6px 0 12px", fontSize: 16, color: li.textPrimary }}>
          Start with what pulls you in
        </h3>
        <div>
          {profile.skills.map((s) => (
            <span key={s} style={chip(li.blueLight, li.blue)}>{s}</span>
          ))}
        </div>
        <p style={{ margin: "12px 0 0", color: li.textHint, fontSize: 12 }}>
          Based on the skills already on your profile.
        </p>
      </aside>

      {/* Conversation */}
      <section style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ minHeight: 220 }}>
          {!submitted ? (
            <div>
              <p style={{ color: li.textPrimary, fontWeight: 600, margin: "0 0 6px" }}>Career Guide</p>
              <p style={{ color: li.textSecondary, marginTop: 0 }}>
                What kind of work pulls you in, even if you don’t know the title yet?
              </p>
              <p style={{ color: li.textHint, fontSize: 12, fontWeight: 700, textTransform: "uppercase", margin: "16px 0 8px" }}>
                Start with a thought
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMessage(p)}
                    style={{
                      ...chip(li.pageBg, li.textPrimary),
                      cursor: "pointer",
                      border: `1px solid ${li.cardBorder}`,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ alignSelf: "flex-end", background: li.blue, color: "#fff", borderRadius: 12, padding: "8px 14px", maxWidth: "80%" }}>
                {submitted}
              </div>
              <div>
                <p style={{ color: li.textPrimary, fontWeight: 600, margin: "0 0 4px" }}>Career Guide</p>
                <p style={{ color: li.textSecondary, margin: 0 }}>
                  {thinking
                    ? "Matching skills, paths, and courses…"
                    : "I checked your profile against the role and course patterns in this dataset."}
                </p>
              </div>
              {!thinking && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {results.map((role) => (
                    <RoleCard key={role.title} role={role} onCompare={() => onPickRole(TITLE_TO_ROLE_ID[role.title] ?? null, role.title)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={submit} style={{ borderTop: `1px solid ${li.cardBorder}`, paddingTop: 14 }}>
          <label htmlFor="explain-msg" style={{ display: "block", fontSize: 13, color: li.textSecondary, marginBottom: 6 }}>
            Explain what you’re looking for
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              id="explain-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I want to work with robotics, but I don’t know what role fits me."
              rows={2}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${li.cardBorder}`, fontFamily: li.font, fontSize: 14, resize: "vertical" }}
            />
            <button
              type="submit"
              disabled={!message.trim()}
              style={{
                background: message.trim() ? li.blue : li.cardBorder,
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "8px 20px",
                fontWeight: 600,
                cursor: message.trim() ? "pointer" : "not-allowed",
                fontFamily: li.font,
                whiteSpace: "nowrap",
              }}
            >
              Find my fit
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RoleCard({ role, onCompare }: { role: CareerMatch; onCompare: () => void }) {
  return (
    <article style={{ border: `1px solid ${li.cardBorder}`, borderRadius: li.cardRadius, padding: 16, fontFamily: li.font }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: li.blue }}>{role.title}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: li.textSecondary }}>{role.matchReason}</p>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <strong style={{ fontSize: 20, color: li.textPrimary }}>{role.readiness}%</strong>
          <div style={{ fontSize: 11, color: li.textHint }}>match</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, margin: "10px 0" }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: li.textSecondary }}>You already bring</p>
          {role.currentSkills.length ? role.currentSkills.map((s) => (
            <span key={s} style={chip(li.greenBg, li.green)}>{s}</span>
          )) : <span style={chip(li.pageBg, li.textHint)}>New territory</span>}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: li.textSecondary }}>Worth building next</p>
          {role.missingSkills.length ? role.missingSkills.map((s) => (
            <span key={s} style={chip(li.amberBg, li.amber)}>{s}</span>
          )) : <span style={chip(li.pageBg, li.textHint)}>—</span>}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${li.cardBorder}`, paddingTop: 10 }}>
        <span style={{ fontSize: 12, color: li.textSecondary }}>
          Suggested next step: <strong style={{ color: li.textPrimary }}>{role.course}</strong>
        </span>
        <button
          type="button"
          onClick={onCompare}
          style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "6px 18px", fontWeight: 600, cursor: "pointer", fontFamily: li.font }}
        >
          Compare →
        </button>
      </div>
    </article>
  );
}
