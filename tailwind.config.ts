import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#060f18",
        background: "#0b141e",
        surface: {
          DEFAULT: "#18202a",
          low: "#131c26",
          high: "#222b35",
          highest: "#2d3540",
          bright: "#313a45",
        },
        ink: {
          DEFAULT: "#dae3f1",
          muted: "#e8bcb6",
          steel: "#8e97a4",
        },
        crimson: {
          DEFAULT: "#e61919",
          glow: "#ffb4aa",
          deep: "#690003",
        },
        outline: {
          DEFAULT: "#ae8782",
          variant: "#5e3f3b",
        },
      },
      fontFamily: {
        display: ["var(--font-montserrat)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(230, 25, 25, 0.45)",
        spotlight: "0 0 32px rgba(218, 227, 241, 0.12)",
      },
      backgroundImage: {
        vignette:
          "radial-gradient(ellipse at center, transparent 40%, rgba(6, 15, 24, 0.85) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
