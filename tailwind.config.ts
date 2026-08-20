import type { Config } from "tailwindcss";

/**
 * Two-color Ledger system only:
 * manila  rgb(232 220 200) / #E8DCC8
 * crimson rgb(139 30 30)   / #8B1E1E
 * Hierarchy via opacity — no other hue hexes.
 */
const MANILA = "#E8DCC8";
const CRIMSON = "#8B1E1E";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Overlays / dimmers — crimson so bg-void/70 stays usable */
        void: CRIMSON,
        desk: MANILA,
        background: MANILA,
        paper: MANILA,
        manila: MANILA,
        surface: {
          DEFAULT: MANILA,
          low: MANILA,
          high: MANILA,
          highest: MANILA,
          bright: MANILA,
        },
        /* All text tokens → crimson (opacity in classNames for mute) */
        ink: {
          DEFAULT: CRIMSON,
          muted: CRIMSON,
          steel: CRIMSON,
          dark: CRIMSON,
        },
        crimson: {
          DEFAULT: CRIMSON,
          glow: CRIMSON,
          deep: CRIMSON,
        },
        outline: {
          DEFAULT: CRIMSON,
          variant: CRIMSON,
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        serif: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 30, 30, 0.35)",
        spotlight: "0 0 32px rgba(139, 30, 30, 0.12)",
        stamp: "2px 3px 0 rgba(139, 30, 30, 0.25)",
      },
      backgroundImage: {
        vignette:
          "radial-gradient(ellipse at center, transparent 40%, rgba(139, 30, 30, 0.18) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
