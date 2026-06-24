import { useState } from "react";
import { card, ui } from "../../lib/explore/ui";
import type { Bubble } from "../../lib/explore/types";

export interface BubbleWithCount {
  bubble: Bubble;
  count: number; // eligible roles for the current user
}

function BubbleCard({
  item,
  onSelect,
}: {
  item: BubbleWithCount;
  onSelect: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const disabled = item.count === 0;
  return (
    <button
      onClick={() => !disabled && onSelect(item.bubble.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        ...card,
        textAlign: "left",
        padding: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        borderColor: hover && !disabled ? ui.color.blue : ui.color.border,
        boxShadow: hover && !disabled ? "0 4px 12px rgba(0,0,0,0.08)" : (card.boxShadow as string),
        transition: "border-color 120ms, box-shadow 120ms",
        fontFamily: ui.font,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 120,
      }}
    >
      <span style={{ fontSize: 34, lineHeight: 1 }}>{item.bubble.emoji}</span>
      <span style={{ fontSize: 17, fontWeight: 600, color: ui.color.text }}>
        {item.bubble.label}
      </span>
      <span style={{ fontSize: 13.5, color: disabled ? ui.color.textSubtle : ui.color.blue, fontWeight: 600 }}>
        {disabled ? "No roles open to you yet" : `${item.count} roles open to you →`}
      </span>
    </button>
  );
}

export default function BubbleGrid({
  items,
  onSelect,
}: {
  items: BubbleWithCount[];
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16,
      }}
    >
      {items.map((item) => (
        <BubbleCard key={item.bubble.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}
