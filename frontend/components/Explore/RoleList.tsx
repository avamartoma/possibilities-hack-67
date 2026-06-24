import { useState } from "react";
import { card, chip, formatSalary, ui } from "../../lib/explore/ui";
import type { JobPosition, UserSignals } from "../../lib/explore/types";
import { reachableLevels } from "../../lib/explore/eligibility";
import { roleIdFor } from "../../lib/explore/taxonomy";

function RoleCard({
  position,
  signals,
  onSelect,
}: {
  position: JobPosition;
  signals: UserSignals;
  onSelect: (p: JobPosition) => void;
}) {
  const [hover, setHover] = useState(false);
  const levels = reachableLevels(position, signals);
  const hasFit = roleIdFor(position) !== null;
  const companiesPreview = position.companies.slice(0, 2);
  const extra = position.companies.length - companiesPreview.length;

  return (
    <button
      onClick={() => onSelect(position)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...card,
        textAlign: "left",
        padding: 18,
        cursor: "pointer",
        borderColor: hover ? ui.color.blue : ui.color.border,
        boxShadow: hover ? "0 4px 12px rgba(0,0,0,0.08)" : (card.boxShadow as string),
        fontFamily: ui.font,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: ui.color.blue }}>
          {position.position}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: ui.color.text, whiteSpace: "nowrap" }}>
          {formatSalary(position.salary.from, position.salary.to)}
        </span>
      </div>

      <span style={{ fontSize: 13.5, color: ui.color.textSubtle }}>
        {companiesPreview.join(" · ")}
        {extra > 0 ? ` · +${extra} more` : ""}
      </span>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
        {levels.map((l) => (
          <span key={l} style={chip("neutral")}>{l}</span>
        ))}
        {hasFit ? (
          <span style={chip("blue")}>See your fit →</span>
        ) : (
          <span style={chip("neutral")}>Details</span>
        )}
      </div>
    </button>
  );
}

export default function RoleList({
  positions,
  signals,
  onSelect,
}: {
  positions: JobPosition[];
  signals: UserSignals;
  onSelect: (p: JobPosition) => void;
}) {
  if (positions.length === 0) {
    return (
      <p style={{ color: ui.color.textSubtle, fontFamily: ui.font }}>
        No roles here are open to you yet — try another field.
      </p>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}
    >
      {positions.map((p) => (
        <RoleCard key={p.position} position={p} signals={signals} onSelect={onSelect} />
      ))}
    </div>
  );
}
