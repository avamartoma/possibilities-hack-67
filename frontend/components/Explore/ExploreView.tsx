"use client";

// Explore: search bar + grid of career cards with fit %.
// Click a card → navigates to comparison for that role.
// Data comes from props/bundled JSON — ready for backend swap.

import { useMemo, useState } from "react";
import { li } from "../../lib/theme";
import LinkedInNav from "../LinkedInNav";

// Bundled data (swap for API later)
import rolesData from "../../data/roleSkills.json";
import usersData from "../../data/flowUsers.json";

interface Role { id: string; name: string; category?: string; skills: string[]; companies: string[]; description?: string }
interface RawUser { id: string; name: string; skills: string[]; hero?: boolean; school_history?: {degree?: string}[]; degree?: string; tagline?: string }
interface User { id: string; name: string; degree: string; skills: string[]; hero?: boolean }

function computeFit(userSkills: string[], roleSkills: string[]): number {
  const us = new Set(userSkills.map(s => s.toLowerCase()));
  const matched = roleSkills.filter(s => us.has(s.toLowerCase())).length;
  return roleSkills.length ? Math.round((matched / roleSkills.length) * 100) : 0;
}

interface ExploreViewProps {
  users?: any[];
  userId?: string;
  onUserChange?: (id: string) => void;
  onPickRole?: (roleId: string, role: { position: string }) => void;
  showHeader?: boolean;
}

export default function ExploreView({ users: propUsers, userId: propUserId, onUserChange, onPickRole, showHeader = true }: ExploreViewProps) {
  const roles: Role[] = useMemo(() =>
    Object.entries(rolesData).map(([id, r]: [string, any]) => ({ id, ...r })),
  []);

  const users: User[] = useMemo(() =>
    ((propUsers || usersData) as RawUser[]).map(u => ({
      id: u.id, name: u.name, skills: u.skills, hero: u.hero,
      degree: u.degree || u.school_history?.[0]?.degree || "",
    })),
  [propUsers]);

  const [localUserId, setLocalUserId] = useState(() => (users.find((u: any) => u.hero) || users[0])?.id || "");
  const userId = propUserId || localUserId;
  const handleUserChange = onUserChange || setLocalUserId;

  const [query, setQuery] = useState("");

  const user = users.find(u => u.id === userId) || users[0];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return roles;
    return roles.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q) ||
      r.skills.some(s => s.toLowerCase().includes(q))
    );
  }, [roles, query]);

  function handleRoleClick(role: Role) {
    if (onPickRole) {
      onPickRole(role.id, { position: role.name });
    } else {
      window.location.href = `/comparison-demo?role=${role.id}&user=${userId}`;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: li.pageBg, fontFamily: li.font }}>
      {showHeader && <LinkedInNav />}
      <div style={{ maxWidth: 1128, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 4px", color: li.textPrimary }}>
          Discover where you could go
        </h1>
        <p style={{ color: li.textSecondary, fontSize: 14, margin: "0 0 20px" }}>
          Search roles and see how your skills match — click any card to dive deeper.
        </p>

        {/* User picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <label style={{ fontWeight: 600, fontSize: 14 }}>Viewing as:</label>
          <select
            value={userId}
            onChange={e => handleUserChange(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: li.cardRadius, border: `1px solid ${li.cardBorder}`, fontSize: 14 }}
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} — {u.degree || ""}{(u as any).hero ? " \u2b50" : ""}</option>
            ))}
          </select>
        </div>

        {/* Search bar — centered, rounded */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", width: "100%", maxWidth: 600 }}>
            <input
              type="text"
              placeholder="Explain career interests and fields you want to pursue"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px 12px 40px",
                border: `1px solid ${li.cardBorder}`, borderRadius: 999,
                fontSize: 15, background: li.cardBg, boxShadow: li.cardShadow,
              }}
            />
            <svg width="16" height="16" viewBox="0 0 16 16" fill={li.textHint} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
              <path d="M6.5 1a5.5 5.5 0 014.38 8.82l3.65 3.66a.75.75 0 01-1.06 1.06l-3.66-3.65A5.5 5.5 0 116.5 1zm0 1.5a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: li.textHint }}>No careers match your search</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {filtered.map(role => {
              const fit = computeFit(user?.skills || [], role.skills);
              const badgeBg = fit >= 50 ? li.greenBg : fit >= 25 ? li.blueLight : li.amberBg;
              const badgeColor = fit >= 50 ? li.green : fit >= 25 ? li.blue : li.amber;
              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleClick(role)}
                  style={{
                    background: li.cardBg, borderRadius: li.cardRadius, boxShadow: li.cardShadow,
                    padding: 20, cursor: "pointer", display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: 12, transition: ".15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 1px 0 rgba(140,140,140,.2),0 4px 12px 0 rgba(0,0,0,.16)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = li.cardShadow; }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{role.name}</div>
                    <div style={{ fontSize: 12, color: li.textSecondary }}>{role.category || ""}</div>
                    <div style={{ fontSize: 11, color: li.textHint, marginTop: 6 }}>{role.companies.slice(0, 3).join(" \u00b7 ")}</div>
                  </div>
                  <div style={{
                    flexShrink: 0, width: 48, height: 48, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, background: badgeBg, color: badgeColor,
                  }}>
                    {fit}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
