import { card, chip, formatSalary, primaryButton, ui } from "../../lib/explore/ui";
import type { JobPosition, UserSignals } from "../../lib/explore/types";
import { reachableLevels } from "../../lib/explore/eligibility";

/**
 * Shown when we can't render the full Comparison fit panel — either the title
 * isn't in the canonical roleSkills map yet, or the viewer is a synthetic demo
 * user not present in the fit dataset. Still gives a useful role overview.
 */
export default function RoleDetail({
  position,
  signals,
  reason,
}: {
  position: JobPosition;
  signals: UserSignals;
  reason: "no-canonical-role" | "not-fit-capable";
}) {
  const levels = reachableLevels(position, signals);
  const note =
    reason === "not-fit-capable"
      ? "Sign in with your profile to see your % fit and skill gap for this role."
      : "Full fit analysis for this role is coming soon. Here's the overview meanwhile.";

  return (
    <div style={{ ...card, padding: 28, maxWidth: 760, fontFamily: ui.font, color: ui.color.text }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 26 }}>{position.position}</h2>
      <p style={{ margin: "0 0 16px", color: ui.color.textSubtle }}>
        {position.industry} · {formatSalary(position.salary.from, position.salary.to)}
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {levels.map((l) => (
          <span key={l} style={chip("neutral")}>{l}</span>
        ))}
      </div>

      <h4 style={{ margin: "0 0 10px" }}>Companies hiring</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {position.companies.map((c) => (
          <span key={c} style={chip("blue")}>{c}</span>
        ))}
      </div>

      <div
        style={{
          background: ui.color.neutralChipBg,
          borderRadius: ui.radius,
          padding: "14px 16px",
          color: ui.color.textSubtle,
          fontSize: 14,
        }}
      >
        {note}
      </div>

      <button style={{ ...primaryButton, marginTop: 20, opacity: 0.6, cursor: "not-allowed" }} disabled>
        Build my path →
      </button>
    </div>
  );
}
