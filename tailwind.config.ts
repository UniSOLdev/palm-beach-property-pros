import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1a2638",
        ocean: "#3d6d7a",
        sky: "#dcecf0",
        sand: "#ddd5c8",
        leaf: "#6a8f6b",
        charcoal: "#1a1d21",
        cream: "#f4f1ea",
        graphite: "#252b33",
        silver: "#b8c0cc",
        aqua: "#6fb8c0",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 28px rgba(10, 14, 20, 0.12)",
        lift: "0 14px 48px rgba(10, 14, 20, 0.18)",
        glow: "0 0 40px -8px rgba(111, 184, 192, 0.35)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.65s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
