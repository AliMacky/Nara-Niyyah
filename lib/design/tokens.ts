/**
 * Nara Design Tokens
 *
 * Typed constants for colors, type scale, and easing curves.
 * Use these in components, Recharts config, framer-motion, and anywhere
 * that needs design values without string literals.
 *
 * These reference the same CSS variables defined in globals.css.
 * For computed (resolved) hex values, use the `resolved` sub-objects.
 */

// ---------------------------------------------------------------------------
// Colors — CSS variable references (respond to theme/dark mode)
// ---------------------------------------------------------------------------

export const colors = {
  paper: {
    50: "var(--paper-50)",
    100: "var(--paper-100)",
    200: "var(--paper-200)",
    300: "var(--paper-300)",
  },
  ink: {
    900: "var(--ink-900)",
    700: "var(--ink-700)",
    500: "var(--ink-500)",
    300: "var(--ink-300)",
  },
  clay: {
    600: "var(--clay-600)",
    500: "var(--clay-500)",
    400: "var(--clay-400)",
    100: "var(--clay-100)",
  },
  sentiment: {
    negStrong: "var(--sentiment-neg-strong)",
    negSoft: "var(--sentiment-neg-soft)",
    neutral: "var(--sentiment-neutral)",
    posSoft: "var(--sentiment-pos-soft)",
    posStrong: "var(--sentiment-pos-strong)",
  },
} as const;

// ---------------------------------------------------------------------------
// Resolved hex values — for contexts that can't use CSS vars (e.g., Recharts
// fills, SVG stops, canvas). Light-mode values; dark mode needs runtime lookup.
// ---------------------------------------------------------------------------

export const resolvedColors = {
  light: {
    paper: { 50: "#FBF8F3", 100: "#F5F0E6", 200: "#E9E1D2", 300: "#CFC4AE" },
    ink: { 900: "#1C1A17", 700: "#3D3832", 500: "#6B6458", 300: "#A39B8B" },
    clay: { 600: "#B54E2C", 500: "#C96846", 400: "#D88765", 100: "#F4DDD1" },
    sentiment: {
      negStrong: "#9B3A52",
      negSoft: "#C88597",
      neutral: "#B8A98E",
      posSoft: "#6B9B9E",
      posStrong: "#1F5E63",
    },
  },
  dark: {
    paper: { 50: "#1B1915", 100: "#252219", 200: "#33302A", 300: "#4A453B" },
    ink: { 900: "#EEE8DC", 700: "#C9C1B3", 500: "#9A9184", 300: "#6B6458" },
    clay: { 600: "#D88765", 500: "#E09A7D", 400: "#E8B49E", 100: "#3A2A22" },
    sentiment: {
      negStrong: "#C46279",
      negSoft: "#D89FAD",
      neutral: "#C4B59F",
      posSoft: "#82B3B6",
      posStrong: "#3A8B90",
    },
  },
} as const;

/**
 * Sentiment spectrum as an ordered array, for gradient construction.
 * Interpolate through neutral in the middle — never skip it.
 */
export const sentimentSpectrum = [
  colors.sentiment.negStrong,
  colors.sentiment.negSoft,
  colors.sentiment.neutral,
  colors.sentiment.posSoft,
  colors.sentiment.posStrong,
] as const;

export const resolvedSentimentSpectrum = {
  light: [
    resolvedColors.light.sentiment.negStrong,
    resolvedColors.light.sentiment.negSoft,
    resolvedColors.light.sentiment.neutral,
    resolvedColors.light.sentiment.posSoft,
    resolvedColors.light.sentiment.posStrong,
  ],
  dark: [
    resolvedColors.dark.sentiment.negStrong,
    resolvedColors.dark.sentiment.negSoft,
    resolvedColors.dark.sentiment.neutral,
    resolvedColors.dark.sentiment.posSoft,
    resolvedColors.dark.sentiment.posStrong,
  ],
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typeScale = {
  "display-xl": {
    fontSize: "4.5rem",
    lineHeight: "4.75rem",
    fontFamily: "var(--font-fraunces)",
    fontWeight: 400,
    fontVariationSettings: '"opsz" 144',
    letterSpacing: "-0.02em",
  },
  "display-lg": {
    fontSize: "3.5rem",
    lineHeight: "3.75rem",
    fontFamily: "var(--font-fraunces)",
    fontWeight: 400,
    fontVariationSettings: '"opsz" 96',
    letterSpacing: "-0.02em",
  },
  "display-md": {
    fontSize: "2.5rem",
    lineHeight: "2.75rem",
    fontFamily: "var(--font-fraunces)",
    fontWeight: 500,
    fontVariationSettings: '"opsz" 48',
    letterSpacing: "-0.02em",
  },
  "display-sm": {
    fontSize: "1.75rem",
    lineHeight: "2rem",
    fontFamily: "var(--font-fraunces)",
    fontWeight: 500,
  },
  "body-lg": {
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    fontFamily: "var(--font-inter-tight)",
    fontWeight: 400,
  },
  body: {
    fontSize: "1rem",
    lineHeight: "1.5rem",
    fontFamily: "var(--font-inter-tight)",
    fontWeight: 400,
  },
  "body-sm": {
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontFamily: "var(--font-inter-tight)",
    fontWeight: 400,
  },
  "body-xs": {
    fontSize: "0.75rem",
    lineHeight: "1rem",
    fontFamily: "var(--font-inter-tight)",
    fontWeight: 500,
  },
  mono: {
    fontSize: "0.8125rem",
    lineHeight: "1.25rem",
    fontFamily: "var(--font-jetbrains-mono)",
    fontWeight: 400,
  },
} as const;

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export const easing = {
  paper: "cubic-bezier(0.32, 0.72, 0, 1)",
  snap: "cubic-bezier(0.22, 1, 0.36, 1)",
  linger: "cubic-bezier(0.65, 0, 0.35, 1)",
} as const;

/** Easing as [number, number, number, number] tuples for framer-motion */
export const easingTuple = {
  paper: [0.32, 0.72, 0, 1] as const,
  snap: [0.22, 1, 0.36, 1] as const,
  linger: [0.65, 0, 0.35, 1] as const,
} as const;

export const duration = {
  micro: 0.14,
  standard: 0.28,
  pageReveal: 0.5,
  stagger: 0.06,
} as const;
