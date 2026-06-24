"use client";

// Discover: a large, searchable catalog of roles (the v3 backend serves the full
// jobs_data.json-derived catalog). Search genuinely filters. Clicking a card opens
// the shared RoleFifaCard modal (no navigation); the modal's CTA jumps to Compare.
// Readiness badges come from /api/roles/recommend — never computed locally.

import { useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { recommendRoles, searchRoles } from "../../lib/api";
import type { CareerRole } from "../../lib/types";
import RoleFifaCard from "../RoleCard/RoleFifaCard";

const DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 100;
const RECOMMEND_LIMIT = 20;
const PAGE = 30;

interface ExploreViewProps {
  userId: string;
  onCompareRole: (roleId: string) => void;
  onOpenGuide: () => void;
}

export default function ExploreView({ userId, onCompareRole, onOpenGuide }: ExploreViewProps) {
  const [query, setQuery] = useState("");
  const [roles, setRoles] = useState<CareerRole[] | null>(null);
  const [error, setError] = useState(false);
  const [readiness, setReadiness] = useState<Record<string, number>>({});
  const [visible, setVisible] = useState(PAGE);
  const [attempt, setAttempt] = useState(0);
  const [openRoleId, setOpenRoleId] = useState<string | null>(null);

  useEffect(() => {
    recommendRoles({ userId, limit: RECOMMEND_LIMIT })
      .then((res) => {
        const lookup: Record<string, number> = {};
        for (const rec of res.recommendations) lookup[rec.role.id] = rec.readinessScore;
        setReadiness(lookup);
      })
      .catch(() => { /* badges are an enhancement; the catalog still renders */ });
  }, [userId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setRoles(null);
      setError(false);
      searchRoles({ query, categories: [], skills: [], limit: SEARCH_LIMIT })
        .then((res) => { setRoles(res.roles); setVisible(PAGE); })
        .catch(() => setError(true));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, attempt]);

  return (
    <div style={{ fontFamily: li.font }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 4px", color: li.textPrimary }}>Discover where you could go</h1>
          <p style={{ color: li.textSecondary, fontSize: 14, margin: "0 0 12px" }}>
            Search hundreds of real roles — click any card for the full breakdown.
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
            placeholder="Search roles, industries, or skills"
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {roles.slice(0, visible).map((role) => (
              <RoleCard key={role.id} role={role} readiness={readiness[role.id]} onClick={() => setOpenRoleId(role.id)} />
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

      {openRoleId && (
        <RoleFifaCard
          userId={userId}
          roleId={openRoleId}
          onClose={() => setOpenRoleId(null)}
          onCompare={(rid) => { setOpenRoleId(null); onCompareRole(rid); }}
        />
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = { background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "10px 22px", fontWeight: 700, cursor: "pointer", fontFamily: li.font };

function RoleCard({ role, readiness, onClick }: { role: CareerRole; readiness?: number; onClick: () => void }) {
  const badgeBg = readiness === undefined ? li.blueLight : readiness >= 50 ? li.greenBg : readiness >= 25 ? li.blueLight : li.amberBg;
  const badgeColor = readiness === undefined ? li.textHint : readiness >= 50 ? li.green : readiness >= 25 ? li.blue : li.amber;
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
        <div style={{ fontSize: 11, color: li.textHint, marginTop: 6 }}>{role.jobCount} open {role.jobCount === 1 ? "role" : "roles"}</div>
      </div>
      <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: badgeBg, color: badgeColor }}>
        {readiness === undefined ? "—" : `${readiness}%`}
      </div>
    </div>
  );
}
