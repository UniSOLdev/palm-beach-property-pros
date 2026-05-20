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
        navy: "#0C2340",
        ocean: "#2A6F97",
        sky: "#E6F3F8",
        sand: "#E8DCC8",
        leaf: "#6A8F6B",
        charcoal: "#1F2933",
        graphite: "#252f38",
        aqua: "#5ec8dc",
        silver: "#d4dce4",
        cream: "#F9F6F0",
      },
      boxShadow: {
        card: "0 4px 24px rgba(12, 35, 64, 0.08)",
        lift: "0 12px 40px rgba(12, 35, 64, 0.12)",
        glow: "0 0 40px rgba(94, 200, 220, 0.18)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
