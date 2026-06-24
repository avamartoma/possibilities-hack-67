"use client";

// Milestones page: receives ?role=X&user=Y from the comparison page's
// "Build my path" button. Shows quarterly milestones, opportunities, and leaderboard.

import { useMemo, useState } from "react";
import { li } from "../../lib/theme";
import LinkedInNav from "../../components/LinkedInNav";
import rolesData from "../../data/roleSkills.json";
import usersData from "../../data/flowUsers.json";

function computeFit(userSkills: string[], roleSkills: string[]) {
  const us = new Set(userSkills.map(s => s.toLowerCase()));
  const have = roleSkills.filter(s => us.has(s.toLowerCase()));
  const miss = roleSkills.filter(s => !us.has(s.toLowerCase()));
  return { have, miss, pct: roleSkills.length ? Math.round((have.length / roleSkills.length) * 100) : 0 };
}

export default function MilestonesPage() {
  // Read URL params
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const roleId = params.get("role") || "data_scientist";
  const userId = params.get("user") || "user_5329";

  const roles: Record<string, any> = rolesData;
  const users: any[] = usersData as any[];
  const role = roles[roleId] || roles.data_scientist;
  const user = users.find(u => u.id === userId) || users[0];
  const { have, miss, pct } = computeFit(user.skills || [], role.skills || []);

  const [tab, setTab] = useState<"path" | "opps" | "lb">("path");

  // Milestones
  const quarters = ["Q3 2026 (Now)", "Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027"];
  const themes = ["Build Your Foundation", "Skill Sprint", "Career Clarity", "Experience Builder", "Level Up"];
  const milestones = quarters.map((q, i) => {
    const skill = miss[i] || have[i % Math.max(have.length, 1)] || "Explore";
    const actions = i === 0
      ? [`Update LinkedIn headline to reflect your ${role.name} goal`, `Add current skills: ${have.join(", ")}`, `Connect with 5 people working as ${role.name}`]
      : [`Complete a course focused on ${skill}`, `Apply to 2 programs in ${role.name}`, `Post about your progress`];
    if (role.companies?.[i % role.companies.length]) actions.push(`Research ${role.companies[i % role.companies.length]}`);
    return { quarter: q, theme: themes[i], skill, actions };
  });

  // Opportunities
  const opps = [
    { name: "Coca-Cola Scholars Program", desc: "$20K scholarship for HS juniors with leadership", fit: 85 },
    { name: "LinkedIn Possibilities in Tech", desc: "Scholarship + mentorship for underrepresented CS students", fit: 78 },
    { name: "QuestBridge National College Match", desc: "Full-ride scholarships to top colleges", fit: 72 },
    { name: "Google CSSI", desc: "3-week CS summer intensive for rising freshmen", fit: 68 },
    { name: "Code2040 Fellows", desc: "Internship connecting Black/Latinx talent to tech", fit: 60 },
    { name: "NASA SEES", desc: "STEM Enhancement in Earth Science research", fit: 55 },
  ];

  // Leaderboard — all users scored against this role
  const peers = users.map(u => {
    const s = new Set((u.skills || []).map((x: string) => x.toLowerCase()));
    const matched = (role.skills || []).filter((x: string) => s.has(x.toLowerCase())).length;
    const segs = Math.min(Math.round((matched / (role.skills?.length || 1)) * 5), 5);
    return { name: u.name + (u.id === user.id ? " (You)" : ""), segs, isYou: u.id === user.id };
  }).sort((a, b) => b.segs - a.segs);

  const tabStyle = (t: string): React.CSSProperties => ({
    padding: "12px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    color: tab === t ? li.green : li.textSecondary,
    borderBottom: tab === t ? `2px solid ${li.green}` : "2px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: li.pageBg, fontFamily: li.font }}>
      <LinkedInNav userName={user.name} />
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>
        {/* Streak */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, background: li.cardBg, boxShadow: li.cardShadow, borderRadius: li.cardRadius, padding: "14px 20px" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#E7A33E" }}>1</div>
          <div><div style={{ fontWeight: 600 }}>Week Streak</div><div style={{ fontSize: 12, color: li.textSecondary }}>Update your profile each quarter to keep it going</div></div>
        </div>

        {/* Progress */}
        <div style={{ background: li.cardBg, boxShadow: li.cardShadow, borderRadius: li.cardRadius, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{user.name} → {role.name}</div>
          <p style={{ fontSize: 12, color: li.textSecondary }}>{pct}% fit · {miss.length} skill{miss.length !== 1 ? "s" : ""} to close the gap</p>
          <div style={{ background: li.cardBorder, borderRadius: 9999, height: 8, overflow: "hidden", margin: "6px 0" }}>
            <div style={{ height: "100%", background: li.green, borderRadius: 9999, width: `${pct}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: li.textSecondary }}><span>You (Now)</span><span>{role.name}</span></div>
        </div>

        {/* Tabs */}
        <div style={{ background: li.cardBg, boxShadow: li.cardShadow, borderRadius: li.cardRadius, padding: 24 }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${li.cardBorder}`, marginBottom: 16 }}>
            <div style={tabStyle("path")} onClick={() => setTab("path")}>My Path</div>
            <div style={tabStyle("opps")} onClick={() => setTab("opps")}>Opportunities</div>
            <div style={tabStyle("lb")} onClick={() => setTab("lb")}>Leaderboard</div>
          </div>

          {/* My Path */}
          {tab === "path" && (
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ borderLeft: `2px solid ${i === 0 ? li.blue : li.cardBorder}`, padding: "10px 16px", marginBottom: 10, background: i === 0 ? li.blueLight : undefined, borderRadius: i === 0 ? 4 : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: li.blue, textTransform: "uppercase" as const }}>{m.quarter}{i === 0 && <span style={{ background: li.green, color: "#fff", padding: "1px 6px", borderRadius: 3, fontSize: 10, marginLeft: 6 }}>NOW</span>}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, margin: "4px 0 6px" }}>{m.theme}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: li.textSecondary }}>Action Items</div>
                  <ul style={{ listStyle: "none", fontSize: 13, color: li.textSecondary, padding: 0 }}>{m.actions.map((a, j) => <li key={j} style={{ padding: "2px 0 2px 14px", position: "relative" }}><span style={{ position: "absolute", left: 3 }}>·</span>{a}</li>)}</ul>
                  <span style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 9999, background: li.blueLight, color: li.blue, fontWeight: 600, marginTop: 4 }}>{m.skill}</span>
                </div>
              ))}
              {/* Goal */}
              <div style={{ borderLeft: `2px solid ${li.green}`, padding: "10px 16px", background: li.greenBg, borderRadius: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: li.green, textTransform: "uppercase" as const }}>GOAL</div>
                <div style={{ fontSize: 14, fontWeight: 600, margin: "4px 0" }}>Your Future Profile</div>
                <div style={{ fontSize: 13 }}><strong>{role.name}</strong> · Skills: {[...have, ...miss].join(", ")}</div>
                <div style={{ fontSize: 12, color: li.textSecondary, marginTop: 4 }}>Companies: {(role.companies || []).join(", ")}</div>
              </div>
            </div>
          )}

          {/* Opportunities */}
          {tab === "opps" && (
            <div>
              <p style={{ fontSize: 12, color: li.textSecondary, marginBottom: 14 }}>Programs for <strong>{user.name}</strong> pursuing <strong>{role.name}</strong></p>
              {opps.map((o, i) => (
                <div key={i} style={{ border: `1px solid ${li.cardBorder}`, borderRadius: li.cardRadius, padding: 14, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{o.name}</h3>
                  <p style={{ fontSize: 12, color: li.textSecondary }}>{o.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1, height: 6, background: li.cardBorder, borderRadius: 9999, overflow: "hidden" }}><div style={{ height: "100%", background: li.green, borderRadius: 9999, width: `${o.fit}%` }} /></div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: li.green }}>{o.fit}%</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    {have.slice(0, 2).map(s => <span key={s} style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 9999, background: li.greenBg, color: li.green, fontWeight: 600, margin: 2 }}>{s}</span>)}
                    {miss.slice(0, 1).map(s => <span key={s} style={{ display: "inline-block", fontSize: 12, padding: "3px 10px", borderRadius: 9999, background: "#FFEFEA", color: "#B24020", fontWeight: 600, margin: 2 }}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard — 5 segment bars */}
          {tab === "lb" && (
            <div>
              <div style={{ fontSize: 12, color: li.textSecondary, marginBottom: 14 }}>All users · Progress toward {role.name} (each segment = 20% match)</div>
              {peers.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < peers.length - 1 ? "1px solid #f5f5f5" : "none", ...(p.isYou ? { background: li.blueLight, margin: "0 -24px", padding: "8px 24px", borderRadius: 4 } : {}) }}>
                  <div style={{ width: 18, fontSize: 13, fontWeight: 600, color: li.textHint }}>{i + 1}</div>
                  <div style={{ width: 100, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ flex: 1, display: "flex", gap: 3, height: 10 }}>
                    {[0, 1, 2, 3, 4].map(s => <div key={s} style={{ flex: 1, borderRadius: 3, background: s < p.segs ? (s % 3 === 0 ? li.green : s % 3 === 1 ? li.blue : "#E7A33E") : li.cardBorder }} />)}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: li.textSecondary, width: 32, textAlign: "right" as const }}>{p.segs}/5</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
