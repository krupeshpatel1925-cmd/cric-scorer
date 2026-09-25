import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#059669",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        cricket: {
          dark: "#0b0f19",
          card: "#131b2e",
          cardLight: "#1c263f",
          gold: "#f59e0b",
          red: "#ef4444",
          blue: "#3b82f6",
          purple: "#8b5cf6",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        neon: "0 0 15px -3px rgba(16, 185, 129, 0.4)",
        goldGlow: "0 0 15px -3px rgba(245, 158, 11, 0.4)",
        cardGlow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};
export default config;
