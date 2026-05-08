import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Groupe de routes Next `(app)` : certains résolveurs de glob sont capricieux avec ()
    "./app/(app)/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        card: "16px",
        badge: "999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.10)",
      },
      keyframes: {
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(12px) translateX(-50%)" },
          "100%": { opacity: "1", transform: "translateY(0)    translateX(-50%)" },
        },
        /** Barre de progression indéterminée (écrans de chargement de route) */
        routeLoad: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(350%)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.25s ease forwards",
        "route-load": "routeLoad 1.15s ease-in-out infinite",
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
