"use client";

// Shared "FIFA card" for a role: a centered modal overlay (not a page, not a scroll
// section). Reused by Discover (ExploreView) and Career Guide (ExplainView). One
// compareRole() call backs the whole card — readiness ring, owned vs missing skills,
// salary, top companies, and the role's real job postings. Primary CTA hands the
// canonical role id up so the caller can open the full Compare view.

import { useCallback, useEffect, useState } from "react";
import { li } from "../../lib/theme";
import { compareRole } from "../../lib/api";
import type { RoleComparison } from "../../lib/types";

type Status = "loading" | "error" | "ready";

interface Props {
  userId: string;
  roleId: string;
  onClose: () => void;
  onCompare: (roleId: string) => void;
}

export default function RoleFifaCard({ userId, roleId, onClose, onCompare }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<RoleComparison | null>(null);
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(() => {
    setStatus("loading");
    compareRole({ userId, roleId })
      .then((res) => { setData(res); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, [userId, roleId, attempt]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Role details"
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto", background: li.cardBg, borderRadius: 16, boxShadow: "0 24px 60px rgba(0,0,0,0.35)", fontFamily: li.font, padding: 24 }}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          style={{ position: "absolute", top: 12, right: 12, border: "none", background: "transparent", fontSize: 22, lineHeight: 1, cursor: "pointer", color: li.textSecondary }}
        >
          ×
        </button>

        {status === "loading" ? (
          <p style={{ color: li.textSecondary, margin: "32px 0", textAlign: "center" }}>Loading role…</p>
        ) : status === "error" ? (
          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <p style={{ color: li.textPrimary }}>Couldn’t load this role.</p>
            <button onClick={() => setAttempt((a) => a + 1)} style={btn}>Retry</button>
          </div>
        ) : (
          <CardBody data={data!} onCompare={() => onCompare(roleId)} />
        )}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = { background: li.blue, color: "#fff", border: "none", borderRadius: 999, padding: "10px 22px", fontWeight: 700, cursor: "pointer", fontFamily: li.font };
const chip = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 600, display: "inline-block", margin: 2 });

function CardBody({ data, onCompare }: { data: RoleComparison; onCompare: () => void }) {
  const { role, readinessScore, strengths } = data;
  const missing = data.skillGaps.filter((g) => g.status === "missing").map((g) => g.skill);
  const postings = role.postings ?? [];
  const hasSalary = role.salaryRange.min !== null && role.salaryRange.max !== null;
  const ringColor = readinessScore >= 50 ? li.green : readinessScore >= 25 ? li.blue : li.amber;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          aria-label="readiness"
          style={{ flexShrink: 0, width: 84, height: 84, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, background: ringColor }}
        >
          <span style={{ fontSize: 24 }}>{readinessScore}%</span>
          <span style={{ fontSize: 10, fontWeight: 600 }}>READY</span>
        </div>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: 22, color: li.textPrimary }}>{role.name}</h2>
          <p style={{ margin: 0, color: li.textSecondary, fontSize: 14 }}>{role.category}</p>
        </div>
      </div>

      <Section title="You already bring">
        {strengths.length > 0
          ? strengths.map((s) => <span key={s} style={chip(li.greenBg, li.green)}>{s}</span>)
          : <span style={chip(li.pageBg, li.textHint)}>New territory</span>}
      </Section>

      <Section title="Worth building next">
        {missing.length > 0
          ? missing.map((s) => <span key={s} style={chip(li.amberBg, li.amber)}>{s}</span>)
          : <span style={chip(li.pageBg, li.textHint)}>You’re covered</span>}
      </Section>

      <p style={{ margin: "14px 0 4px", fontSize: 13, color: li.textSecondary }}>
        Salary: {hasSalary ? `$${role.salaryRange.min!.toLocaleString()}–$${role.salaryRange.max!.toLocaleString()}` : "demo guidance only"}
      </p>
      {role.companies.length > 0 && (
        <p style={{ margin: "0 0 4px", fontSize: 13, color: li.textSecondary }}>
          Top companies: {role.companies.slice(0, 4).join(" · ")}
        </p>
      )}

      <Section title={`Open roles (${postings.length})`}>
        {postings.length > 0 ? (
          <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }} data-testid="postings-scroll">
            {postings.map((p) => (
              <div key={p.id} style={{ border: `1px solid ${li.cardBorder}`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: li.textPrimary }}>{p.company}</div>
                <div style={{ fontSize: 12, color: li.textSecondary }}>{p.location} · {p.level}{p.easyApply ? " · Easy Apply" : ""}</div>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 13, color: li.textHint }}>No live postings right now.</span>
        )}
      </Section>

      <button onClick={onCompare} style={{ ...btn, marginTop: 16, width: "100%" }}>
        Compare your profile to this role
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: li.textSecondary }}>{title}</p>
      <div>{children}</div>
    </div>
  );
}
