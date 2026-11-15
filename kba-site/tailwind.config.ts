import type { Config } from "tailwindcss";

// Palette tirée du logo n°7 : bleu nuit, bleu électrique, argent.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", md: "2rem" }, screens: { "2xl": "1240px" } },
    extend: {
      colors: {
        navy: { 950: "#06111F", 900: "#0B1F3A", 800: "#122A4C", 700: "#1B3863", 600: "#2A4A7A" },
        blue: { 700: "#1749B5", 600: "#1E5BD8", 500: "#3A73E6", 400: "#5B93FF", 100: "#E6EEFD", 50: "#F2F6FE" },
        silver: { 500: "#8E99A8", 300: "#C5CCD6", 200: "#E3E8EF" },
        paper: "#F6F7F9",
        line: "#E3E7ED",
        ink: "#0E1726",
        muted: "#5B6676",
        ok: "#16834F",
        warn: "#B26B00",
      },
      fontFamily: {
        display: ["Montserrat", "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: { label: "0.14em" },
      keyframes: { ticker: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } } },
      animation: { ticker: "ticker 38s linear infinite" },
    },
  },
  plugins: [],
};
export default config;
