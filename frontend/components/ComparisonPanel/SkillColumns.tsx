"use client";

// Two-column skill breakdown: what you bring vs. what to build next.
// Styled with LinkedIn's skill-pill / endorsement look.

import { li } from "../../lib/theme";

interface SkillColumnsProps {
  haveSkills: string[];
  missingSkills: string[];
}

function Chip({ text, kind }: { text: string; kind: "have" | "missing" }) {
  const have = kind === "have";
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: have ? li.greenBg : "#f3f2ef",
        color: have ? li.green : li.textPrimary,
        border: `1px solid ${have ? "rgba(5,118,66,0.2)" : li.cardBorder}`,
        borderRadius: 16,
        padding: "6px 12px",
        marginBottom: 8,
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      <span style={{ fontWeight: 700 }}>{have ? "✓" : "+"}</span>
      {text}
    </li>
  );
}

export default function SkillColumns({
  haveSkills,
  missingSkills,
}: SkillColumnsProps) {
  return (
    <div style={{ display: "flex", gap: 24, width: "100%", fontFamily: li.font }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 12px", color: li.textPrimary, fontSize: 16 }}>
          Skills you have <span style={{ color: li.textSecondary }}>({haveSkills.length})</span>
        </h4>
        {haveSkills.length === 0 ? (
          <p style={{ color: li.textHint, fontSize: 14 }}>
            None yet — every one of these is a fresh start.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {haveSkills.map((s) => (
              <Chip key={s} text={s} kind="have" />
            ))}
          </ul>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 12px", color: li.textPrimary, fontSize: 16 }}>
          Skills to build <span style={{ color: li.textSecondary }}>({missingSkills.length})</span>
        </h4>
        {missingSkills.length === 0 ? (
          <p style={{ color: li.green, fontSize: 14, fontWeight: 600 }}>
            You have everything this role needs. 🎉
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {missingSkills.map((s) => (
              <Chip key={s} text={s} kind="missing" />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
