"use client";

// Two-column skill breakdown: what you already bring vs. what to build next.
// Missing skills are framed as "next steps," not deficits (tone matters for GenZ).

interface SkillColumnsProps {
  haveSkills: string[];
  missingSkills: string[];
}

function Chip({ text, kind }: { text: string; kind: "have" | "missing" }) {
  const styles =
    kind === "have"
      ? { bg: "#dcfce7", fg: "#166534", mark: "✓" }
      : { bg: "#f1f5f9", fg: "#475569", mark: "○" };
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: styles.bg,
        color: styles.fg,
        borderRadius: 8,
        padding: "8px 12px",
        marginBottom: 8,
        fontWeight: 500,
      }}
    >
      <span style={{ fontWeight: 700 }}>{styles.mark}</span>
      {text}
    </li>
  );
}

export default function SkillColumns({
  haveSkills,
  missingSkills,
}: SkillColumnsProps) {
  return (
    <div style={{ display: "flex", gap: 24, width: "100%" }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 12px", color: "#166534" }}>
          Skills you have ({haveSkills.length})
        </h4>
        {haveSkills.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
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
        <h4 style={{ margin: "0 0 12px", color: "#475569" }}>
          Skills to build ({missingSkills.length})
        </h4>
        {missingSkills.length === 0 ? (
          <p style={{ color: "#16a34a", fontSize: 14, fontWeight: 600 }}>
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
