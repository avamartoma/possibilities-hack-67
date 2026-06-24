import type { CSSProperties } from "react";
import { ui } from "../../lib/explore/ui";

export interface Crumb {
  label: string;
  onClick?: () => void; // omit for the current (non-clickable) crumb
}

const sep: CSSProperties = { color: ui.color.textSubtle, margin: "0 8px" };

export default function Breadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <nav
      style={{
        fontSize: 14,
        marginBottom: 16,
        fontFamily: ui.font,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
      }}
      aria-label="Breadcrumb"
    >
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
            {c.onClick && !last ? (
              <button
                onClick={c.onClick}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: ui.color.blue,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: ui.font,
                }}
              >
                {c.label}
              </button>
            ) : (
              <span style={{ color: last ? ui.color.text : ui.color.textSubtle, fontWeight: last ? 600 : 500 }}>
                {c.label}
              </span>
            )}
            {!last && <span style={sep}>›</span>}
          </span>
        );
      })}
    </nav>
  );
}
