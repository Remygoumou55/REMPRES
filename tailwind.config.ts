import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(12px) translateX(-50%)" },
          "100%": { opacity: "1", transform: "translateY(0)    translateX(-50%)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.25s ease forwards",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0E4A8A",
          light: "#2D7CC4",
          dark: "#083666",
        },
        accent: "#3FA9D6",
        graylight: "#F4F6F8",
        darktext: "#1F2937",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
    },
  },
  plugins: [],
};
export default config;
