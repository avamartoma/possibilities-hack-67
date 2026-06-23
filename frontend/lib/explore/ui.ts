// LinkedIn-flavored design tokens for the Explore page, so the UI matches
// LinkedIn's look (blue #0A66C2, warm-gray canvas, white cards, pill buttons).
import type { CSSProperties } from "react";

export const ui = {
  font: '-apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  color: {
    blue: "#0A66C2",
    blueDark: "#004182",
    bg: "#F4F2EE",
    card: "#FFFFFF",
    border: "#E0DFDC",
    text: "rgba(0,0,0,0.9)",
    textSubtle: "rgba(0,0,0,0.6)",
    chipBg: "#EAF1F8",
    chipText: "#0A66C2",
    neutralChipBg: "#F3F2EF",
    neutralChipText: "rgba(0,0,0,0.75)",
    success: "#057642",
  },
  radius: 8,
};

export const card: CSSProperties = {
  background: ui.color.card,
  border: `1px solid ${ui.color.border}`,
  borderRadius: ui.radius,
  boxShadow: "0 0 0 1px rgba(0,0,0,0.02)",
};

export const primaryButton: CSSProperties = {
  background: ui.color.blue,
  color: "#fff",
  border: "none",
  borderRadius: 999,
  padding: "8px 20px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: ui.font,
};

export const ghostButton: CSSProperties = {
  background: "transparent",
  color: ui.color.blue,
  border: `1px solid ${ui.color.blue}`,
  borderRadius: 999,
  padding: "6px 16px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: ui.font,
};

export function chip(kind: "blue" | "neutral" = "neutral"): CSSProperties {
  const blue = kind === "blue";
  return {
    background: blue ? ui.color.chipBg : ui.color.neutralChipBg,
    color: blue ? ui.color.chipText : ui.color.neutralChipText,
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-block",
  };
}

/** "$95k–$210k" from the catalog's string salary range. */
export function formatSalary(from: string, to: string): string {
  const k = (v: string) => `$${Math.round(Number(v) / 1000)}k`;
  return `${k(from)}–${k(to)}`;
}
