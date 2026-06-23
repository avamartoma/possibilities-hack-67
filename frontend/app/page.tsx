"use client";

// Standalone demo harness for the Comparison Page, wrapped in a LinkedIn shell.
// User + role pickers stand in for the map (Person A); in the integrated app the
// map opens <ComparisonPanel> directly with the clicked user/role.

import { useEffect, useState } from "react";
import type { Role, User } from "../lib/types";
import { getRoles, getUsers } from "../lib/api";
import { li } from "../lib/theme";
import LinkedInNav from "../components/LinkedInNav";
import ComparisonPanel from "../components/ComparisonPanel/ComparisonPanel";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    getUsers().then((u) => {
      setUsers(u);
      setUserId(u.find((x) => x.hero)?.id ?? u[0]?.id ?? "");
    });
    getRoles().then((r) => {
      setRoles(r);
      setRoleId(r[0]?.id ?? "");
    });
  }, []);

  const activeUser = users.find((u) => u.id === userId);

  // Filter roles by name / category / skills as the user types.
  const q = query.trim().toLowerCase();
  const filteredRoles = q
    ? roles.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q) ||
          r.skills.some((s) => s.toLowerCase().includes(q))
      )
    : roles;

  const railCard: React.CSSProperties = {
    background: li.cardBg,
    borderRadius: li.cardRadius,
    boxShadow: li.cardShadow,
    fontFamily: li.font,
    overflow: "hidden",
  };

  return (
    <div style={{ background: li.pageBg, minHeight: "100vh", fontFamily: li.font }}>
      <LinkedInNav userName={activeUser?.name} />

      <main
        style={{
          maxWidth: 1128,
          margin: "0 auto",
          padding: "24px 16px",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left rail: identity + role list (stands in for the map) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Identity card */}
          <div style={railCard}>
            <div style={{ height: 56, background: `linear-gradient(120deg, ${li.blue}, #378fe9)` }} />
            <div style={{ padding: "0 16px 16px", marginTop: -28, textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: li.blue,
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  border: `2px solid ${li.cardBg}`,
                }}
              >
                {(activeUser?.name ?? "Y").charAt(0)}
              </div>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: 10,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: `1px solid ${li.cardBorder}`,
                  fontSize: 14,
                  fontFamily: li.font,
                }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.hero ? " (suggested)" : ""}
                  </option>
                ))}
              </select>
              {activeUser?.tagline && (
                <p style={{ margin: "8px 0 0", color: li.textSecondary, fontSize: 13, fontStyle: "italic" }}>
                  “{activeUser.tagline}”
                </p>
              )}
              {activeUser?.degree && (
                <p style={{ margin: "4px 0 0", color: li.textHint, fontSize: 12 }}>
                  {activeUser.degree}
                </p>
              )}
            </div>
          </div>

          {/* Role search */}
          <div style={{ ...railCard, padding: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: li.textPrimary }}>
              Explore roles
            </h3>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles or skills"
              aria-label="Search roles"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: `1px solid ${li.cardBorder}`,
                background: li.blueLight,
                fontSize: 14,
                fontFamily: li.font,
                marginBottom: 10,
              }}
            />
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {filteredRoles.length === 0 ? (
                <p style={{ color: li.textHint, fontSize: 14, margin: "4px 8px" }}>
                  No roles match “{query}”.
                </p>
              ) : (
                filteredRoles.map((r) => {
                  const active = r.id === roleId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRoleId(r.id)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        marginBottom: 4,
                        borderRadius: 6,
                        border: "none",
                        background: active ? li.blueLight : "transparent",
                        color: active ? li.blue : li.textPrimary,
                        cursor: "pointer",
                        fontWeight: active ? 600 : 500,
                        fontSize: 14,
                        fontFamily: li.font,
                      }}
                    >
                      {r.name}
                      <span style={{ display: "block", color: li.textHint, fontSize: 12 }}>
                        {r.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Main column: the Comparison Page */}
        <div>
          {userId && roleId && <ComparisonPanel userId={userId} roleId={roleId} />}
        </div>
      </main>
    </div>
  );
}
