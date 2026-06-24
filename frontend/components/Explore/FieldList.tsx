import { useState } from "react";
import { card, ui } from "../../lib/explore/ui";
import type { ExploreField } from "../../lib/explore/types";

function FieldRow({
  field,
  onSelect,
}: {
  field: ExploreField;
  onSelect: (industry: string) => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onSelect(field.industry)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...card,
        textAlign: "left",
        padding: "16px 20px",
        cursor: "pointer",
        borderColor: hover ? ui.color.blue : ui.color.border,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: ui.font,
        width: "100%",
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 600, color: ui.color.text }}>
        {field.industry}
      </span>
      <span style={{ fontSize: 14, color: ui.color.blue, fontWeight: 600 }}>
        {field.positions.length} {field.positions.length === 1 ? "role" : "roles"} →
      </span>
    </button>
  );
}

export default function FieldList({
  fields,
  onSelect,
}: {
  fields: ExploreField[];
  onSelect: (industry: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {fields.map((f) => (
        <FieldRow key={f.industry} field={f} onSelect={onSelect} />
      ))}
    </div>
  );
}
