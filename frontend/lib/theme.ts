// LinkedIn-inspired design tokens shared by the Career Map views.
// Sourced from LinkedIn's public design system (colors, radii, type).

export const li = {
  // Brand
  blue: "#0a66c2",
  blueHover: "#004182",
  blueLight: "#edf3f8",

  // Surfaces
  pageBg: "#f4f2ee",
  cardBg: "#ffffff",
  cardBorder: "rgba(0,0,0,0.08)",
  cardRadius: 8,
  cardShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 3px rgba(0,0,0,0.06)",

  // Text
  textPrimary: "rgba(0,0,0,0.9)",
  textSecondary: "rgba(0,0,0,0.6)",
  textHint: "rgba(0,0,0,0.45)",

  // Semantic (kept close to LinkedIn's accents)
  green: "#057642", // "open to work" green
  greenBg: "#ddf5e6",
  amber: "#915907",
  amberBg: "#fef3e0",

  // Type
  font: '-apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
} as const;
