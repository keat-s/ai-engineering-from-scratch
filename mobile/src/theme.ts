/**
 * Design tokens mirrored from the project's web site (site/style.css) so the
 * app feels like part of the same product: electric blue accent on a near-black
 * surface, with a monospace display face.
 */
export const colors = {
  bg: "#0b0b0f",
  surface: "#15151c",
  surfaceAlt: "#1d1d27",
  border: "#2a2a36",
  text: "#fafaf5",
  textMuted: "#a0a0b0",
  accent: "#3553ff",
  accentSoft: "#2b2bff22",
  pro: "#f5b333",
  success: "#3ad29f",
  danger: "#ff5470",
  locked: "#6b6b7b",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const font = {
  mono: undefined as string | undefined, // system monospace; swap for a bundled face if desired
};

export const typography = {
  h1: { fontSize: 26, fontWeight: "800" as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  muted: { fontSize: 13, color: colors.textMuted },
  label: { fontSize: 12, color: colors.textMuted, letterSpacing: 0.5 },
};
