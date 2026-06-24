"use client";

// Explore: search bar + grid of career cards. Data comes from the v2 backend:
//   - the role catalog and typed search use POST /api/roles/search
//   - personalized readiness/fit comes from POST /api/roles/recommend (no local fit math)
// Clicking a card hands the canonical role id up to AppFlow, which advances to Explain.

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { recommendRoles, searchRoles } from "../../lib/api";
import type { CareerRole } from "../../lib/types";

const DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 20;

interface Readiness {
  readinessScore: number;
  matchedSkills: string[];
}

interface ExploreViewProps {
  userId: string;
  onSelectRole: (roleId: string) => void;
}

export default function ExploreView({ userId, onSelectRole }: ExploreViewProps) {
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState<CareerRole[] | null>(null);
  const [error, setError] = useState(false);
  const [readiness, setReadiness] = useState<Record<string, Readiness>>({});
  const [attempt, setAttempt] = useState(0);

  // Personalized readiness for the selected user (mount-only; survives typed search).
  useEffect(() => {
    recommendRoles({ userId, limit: SEARCH_LIMIT })
      .then((res) => {
        const lookup: Record<string, Readiness> = {};
        for (const rec of res.recommendations) {
          lookup[rec.role.id] = { readinessScore: rec.readinessScore, matchedSkills: rec.matchedSkills };
        }
        setReadiness(lookup);
      })
      .catch(() => { /* readiness is an enhancement; search still works without it */ });
  }, [userId]);

  // Catalog + debounced typed search. Empty query on mount shows the full catalog.
  useEffect(() => {
    const handle = setTimeout(() => {
      setRoles(null);
      setError(false);
      searchRoles({ query, categories: [], skills: [], limit: SEARCH_LIMIT })
        .then((res) => setRoles(res.roles))
        .catch(() => setError(true));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, attempt]);

  return (
    <div style={{ fontFamily: li.font }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 4px", color: li.textPrimary }}>
        Discover where you could go
      </h1>
      <p style={{ color: li.textSecondary, fontSize: 14, margin: "0 0 20px" }}>
        Search roles and see how your skills match — click any card to dive deeper.
      </p>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 600 }}>
          <input
            type="text"
            aria-label="Search roles"
            placeholder="Explain career interests and fields you want to pursue"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 16px 12px 40px", border: `1px solid ${li.cardBorder}`, borderRadius: 999, fontSize: 15, background: li.cardBg, boxShadow: li.cardShadow }}
          />
          <svg width="16" height="16" viewBox="0 0 16 16" fill={li.textHint} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
            <path d="M6.5 1a5.5 5.5 0 014.38 8.82l3.65 3.66a.75.75 0 01-1.06 1.06l-3.66-3.65A5.5 5.5 0 116.5 1zm0 1.5a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        </div>
      </div>

      {error ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: li.textPrimary }}>Something went wrong loading roles.</p>
          <button
            onClick={() => setAttempt((a) => a + 1)}
            style={{ background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "8px 20px", fontWeight: 600, cursor: "pointer", fontFamily: li.font }}
          >
            Retry
          </button>
        </div>
      ) : roles === null ? (
        <div style={{ textAlign: "center", padding: 40, color: li.textHint }}>Loading roles…</div>
      ) : roles.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: li.textHint }}>No careers match your search</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} readiness={readiness[role.id]} onClick={() => onSelectRole(role.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleCard({ role, readiness, onClick }: { role: CareerRole; readiness?: Readiness; onClick: () => void }) {
  const score = readiness?.readinessScore;
  const badgeBg = score === undefined ? li.blueLight : score >= 50 ? li.greenBg : score >= 25 ? li.blueLight : li.amberBg;
  const badgeColor = score === undefined ? li.textHint : score >= 50 ? li.green : score >= 25 ? li.blue : li.amber;
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{ background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow, padding: 20, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, transition: ".15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{role.name}</div>
        <div style={{ fontSize: 12, color: li.textSecondary }}>{role.category}</div>
        <div style={{ fontSize: 11, color: li.textHint, marginTop: 6 }}>{role.companies.slice(0, 3).join(" · ")}</div>
      </div>
      <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: badgeBg, color: badgeColor }}>
        {score === undefined ? "—" : `${score}%`}
      </div>
    </div>
  );
}
