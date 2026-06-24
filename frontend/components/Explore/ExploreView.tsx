"use client";

// Discover: a large, searchable catalog of roles (the v3 backend serves the full
// jobs_data.json-derived catalog). Search genuinely filters. Each card shows the
// user's readiness % for that role and jumps straight to Compare on click — no
// intermediate modal. Readiness comes from /api/roles/search (userId) — never
// computed locally.

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { searchRoles } from "../../lib/api";
import type { CareerRole } from "../../lib/types";

const DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 100;
const PAGE = 30;

interface ExploreViewProps {
  userId: string;
  onCompareRole: (roleId: string) => void;
  onOpenGuide: () => void;
  initialQuery?: string;
}

export default function ExploreView({ userId, onCompareRole, onOpenGuide, initialQuery = "" }: ExploreViewProps) {
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState<CareerRole[] | null>(null);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setRoles(null);
      setError(false);
      searchRoles({ query, categories: [], skills: [], limit: SEARCH_LIMIT, userId })
        .then((res) => { setRoles(res.roles); setVisible(PAGE); })
        .catch(() => setError(true));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, attempt, userId]);

  return (
    <div style={{ fontFamily: li.font }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 4px", color: li.textPrimary }}>Discover where you could go</h1>
          <p style={{ color: li.textSecondary, fontSize: 14, margin: "0 0 12px" }}>
            Search hundreds of real roles — click any card to compare your profile.
          </p>
        </div>
        <button
          onClick={onOpenGuide}
          style={{ background: "transparent", color: li.blue, border: `1px solid ${li.blue}`, borderRadius: 999, padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontFamily: li.font, whiteSpace: "nowrap" }}
        >
          Not sure? Open the Career Guide →
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 24px" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 600 }}>
          <input
            type="text"
            aria-label="Search roles"
            placeholder="Tell me what you're looking for..."
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
          <button onClick={() => setAttempt((a) => a + 1)} style={primaryBtn}>Retry</button>
        </div>
      ) : roles === null ? (
        <div style={{ textAlign: "center", padding: 40, color: li.textHint }}>Loading roles…</div>
      ) : roles.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: li.textHint }}>No careers match your search</div>
      ) : (
        <>
          <p style={{ color: li.textSecondary, fontSize: 13, fontWeight: 600, textAlign: "center", margin: "0 0 12px" }}>
            These are the careers you're most suited for currently.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {[...roles]
              .sort((a, b) => (b.readinessScore ?? -1) - (a.readinessScore ?? -1))
              .slice(0, visible)
              .map((role) => (
                <RoleCard key={role.id} role={role} onClick={() => onCompareRole(role.id)} />
              ))}
          </div>
          {visible < roles.length && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={() => setVisible((v) => v + PAGE)} style={primaryBtn}>
                Load more ({roles.length - visible} more)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = { background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "10px 22px", fontWeight: 700, cursor: "pointer", fontFamily: li.font };

function RoleCard({ role, onClick }: { role: CareerRole; onClick: () => void }) {
  const readiness = role.readinessScore;
  const ringColor = readiness === undefined ? li.textHint : readiness >= 50 ? li.green : readiness >= 25 ? li.blue : li.amber;
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
        <div style={{ fontSize: 12, color: li.textSecondary }}>{role.industries[0] || role.category}</div>
        <div style={{ fontSize: 11, color: li.textHint, marginTop: 6 }}>{role.jobCount} open {role.jobCount === 1 ? "role" : "roles"}</div>
      </div>
      {readiness !== undefined && (
        <div
          aria-label={`${readiness}% ready`}
          style={{ flexShrink: 0, width: 52, height: 52, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, background: ringColor }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>{readiness}%</span>
          <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: 0.5 }}>READY</span>
        </div>
      )}
    </div>
  );
}
