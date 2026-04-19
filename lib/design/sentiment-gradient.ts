/**
 * Sentiment color interpolation.
 *
 * Given a sentiment value in [-1, 1], returns the interpolated hex color
 * from the Nara sentiment spectrum:
 *   -1.0  →  neg-strong  (#9B3A52)
 *   -0.5  →  neg-soft    (#C88597)
 *    0.0  →  neutral     (#B8A98E)
 *   +0.5  →  pos-soft    (#6B9B9E)
 *   +1.0  →  pos-strong  (#1F5E63)
 *
 * Always interpolates through neutral — never a direct jump between poles.
 * Used by every chart component for color-at-value logic.
 */

import { resolvedColors } from "./tokens";

interface SpectrumStop {
  value: number;
  hex: string;
}

const LIGHT_STOPS: SpectrumStop[] = [
  { value: -1.0, hex: resolvedColors.light.sentiment.negStrong },
  { value: -0.5, hex: resolvedColors.light.sentiment.negSoft },
  { value: 0.0, hex: resolvedColors.light.sentiment.neutral },
  { value: 0.5, hex: resolvedColors.light.sentiment.posSoft },
  { value: 1.0, hex: resolvedColors.light.sentiment.posStrong },
];

const DARK_STOPS: SpectrumStop[] = [
  { value: -1.0, hex: resolvedColors.dark.sentiment.negStrong },
  { value: -0.5, hex: resolvedColors.dark.sentiment.negSoft },
  { value: 0.0, hex: resolvedColors.dark.sentiment.neutral },
  { value: 0.5, hex: resolvedColors.dark.sentiment.posSoft },
  { value: 1.0, hex: resolvedColors.dark.sentiment.posStrong },
];

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function toHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
  );
}

function interpolateStops(
  stops: SpectrumStop[],
  value: number,
): string {
  const clamped = Math.max(-1, Math.min(1, value));

  // Find bounding stops
  for (let i = 0; i < stops.length - 1; i++) {
    const lo = stops[i];
    const hi = stops[i + 1];
    if (clamped >= lo.value && clamped <= hi.value) {
      const t = (clamped - lo.value) / (hi.value - lo.value);
      const [r1, g1, b1] = parseHex(lo.hex);
      const [r2, g2, b2] = parseHex(hi.hex);
      return toHex(
        lerpChannel(r1, r2, t),
        lerpChannel(g1, g2, t),
        lerpChannel(b1, b2, t),
      );
    }
  }

  // Edge case: exactly at boundary
  return clamped <= -1
    ? stops[0].hex
    : stops[stops.length - 1].hex;
}

/**
 * Returns the interpolated hex color for a sentiment value.
 * @param value - Sentiment in [-1, 1]
 * @param mode - "light" or "dark" theme
 */
export function sentimentColor(
  value: number,
  mode: "light" | "dark" = "light",
): string {
  return interpolateStops(
    mode === "dark" ? DARK_STOPS : LIGHT_STOPS,
    value,
  );
}

/**
 * Returns SVG linearGradient stop definitions for a vertical gradient
 * spanning the full sentiment spectrum. Used in Recharts `<defs>`.
 *
 * Stops are ordered top-to-bottom (pos-strong at offset 0%, neg-strong at 100%)
 * because SVG y-axis is inverted relative to the chart's value axis.
 */
export function sentimentGradientStops(
  mode: "light" | "dark" = "light",
): Array<{ offset: string; color: string }> {
  const stops = mode === "dark" ? DARK_STOPS : LIGHT_STOPS;
  // Reverse: highest value (pos-strong) at top (offset 0%)
  return [...stops].reverse().map((s) => ({
    offset: `${((1 - s.value) / 2) * 100}%`,
    color: s.hex,
  }));
}

/**
 * Sentiment label for a value.
 */
export function sentimentLabel(value: number): string {
  const abs = Math.abs(value);
  if (abs < 0.1) return "neutral";
  if (abs < 0.35) return value > 0 ? "leaning positive" : "leaning negative";
  if (abs < 0.65) return value > 0 ? "positive" : "negative";
  return value > 0 ? "strongly positive" : "strongly negative";
}
