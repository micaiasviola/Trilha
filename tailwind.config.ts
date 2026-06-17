import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0e14",
          soft: "#0f141d",
          card: "#131a25",
        },
        line: "#1e2733",
        ink: {
          DEFAULT: "#e6edf3",
          muted: "#9aa7b4",
          faint: "#647082",
        },
        accent: {
          DEFAULT: "#34d399",
          cyan: "#22d3ee",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(52,211,153,0.15), 0 8px 40px -12px rgba(34,211,238,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
