"use client";

// Standalone demo harness for the Comparison Page.
// Lets you pick a demo user + a role and see the fit panel — no dependency on
// the map (Person A) or the Milestone page (Person C). In the integrated app,
// the map opens <ComparisonPanel> directly with the clicked user/role.

import { useEffect, useState } from "react";
import type { Role, User } from "../lib/types";
import { getRoles, getUsers } from "../lib/api";
import ComparisonPanel from "../components/ComparisonPanel/ComparisonPanel";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [roleId, setRoleId] = useState<string>("");

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

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 32,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 4 }}>Career Map — Role Comparison</h1>
      <p style={{ color: "#64748b", marginTop: 0 }}>
        Pick who you are, then explore how you fit each role.
      </p>

      {/* User picker */}
      <section style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Viewing as:</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, fontSize: 15 }}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.degree} {u.hero ? "⭐" : ""}
            </option>
          ))}
        </select>
        {activeUser?.tagline && (
          <span style={{ marginLeft: 12, color: "#94a3b8", fontStyle: "italic" }}>
            “{activeUser.tagline}”
          </span>
        )}
      </section>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        {/* Role list (stands in for the map) */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <h3 style={{ marginTop: 0 }}>Roles</h3>
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleId(r.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                marginBottom: 6,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: r.id === roleId ? "#2563eb" : "#fff",
                color: r.id === roleId ? "#fff" : "#0f172a",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {r.name}
            </button>
          ))}
        </div>

        {/* The Comparison Page */}
        <div style={{ flex: 1 }}>
          {userId && roleId && (
            <ComparisonPanel userId={userId} roleId={roleId} />
          )}
        </div>
      </div>
    </main>
  );
}
