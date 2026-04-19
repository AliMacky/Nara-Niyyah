/**
 * Nara Tailwind Configuration
 *
 * In Tailwind v4, the primary theme lives in globals.css via @theme blocks.
 * This file serves as a typed reference for programmatic access (e.g., Recharts
 * styling, framer-motion orchestration) and documents the full token set.
 *
 * To consume in Tailwind, add `@config "./tailwind.config.ts"` to globals.css.
 * Currently the @theme inline block in globals.css is the source of truth.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        nara: {
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
            "neg-strong": "var(--sentiment-neg-strong)",
            "neg-soft": "var(--sentiment-neg-soft)",
            neutral: "var(--sentiment-neutral)",
            "pos-soft": "var(--sentiment-pos-soft)",
            "pos-strong": "var(--sentiment-pos-strong)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter-tight)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
        heading: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      fontSize: {
        "display-xl": ["4.5rem", { lineHeight: "4.75rem", letterSpacing: "-0.02em" }],
        "display-lg": ["3.5rem", { lineHeight: "3.75rem", letterSpacing: "-0.02em" }],
        "display-md": ["2.5rem", { lineHeight: "2.75rem", letterSpacing: "-0.02em" }],
        "display-sm": ["1.75rem", { lineHeight: "2rem" }],
        "body-lg": ["1.125rem", { lineHeight: "1.75rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        "body-sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "body-xs": ["0.75rem", { lineHeight: "1rem" }],
        mono: ["0.8125rem", { lineHeight: "1.25rem" }],
      },
      transitionTimingFunction: {
        paper: "cubic-bezier(0.32, 0.72, 0, 1)",
        snap: "cubic-bezier(0.22, 1, 0.36, 1)",
        linger: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
