import type { Config } from "tailwindcss";

/** Ledger visual system — ink desk, manila paper, dried crimson */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0a0806",
        desk: "#12100E",
        background: "#12100E",
        paper: "#F4EBD8",
        manila: "#E8DCC8",
        surface: {
          DEFAULT: "#1c1814",
          low: "#161310",
          high: "#26201a",
          highest: "#322a22",
          bright: "#3a3128",
        },
        /* Light text on desk (was cool blue-gray; now manila) */
        ink: {
          DEFAULT: "#E8DCC8",
          muted: "#C4B5A0",
          steel: "#9A8B78",
          dark: "#1a1510",
        },
        crimson: {
          DEFAULT: "#8B1E1E",
          glow: "#C45C4A",
          deep: "#4A0F0F",
        },
        outline: {
          DEFAULT: "#9A8B78",
          variant: "#5e3f3b",
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
        spotlight: "0 0 32px rgba(232, 220, 200, 0.08)",
        stamp: "2px 3px 0 rgba(26, 21, 16, 0.25)",
      },
      backgroundImage: {
        vignette:
          "radial-gradient(ellipse at center, transparent 40%, rgba(18, 16, 14, 0.9) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
