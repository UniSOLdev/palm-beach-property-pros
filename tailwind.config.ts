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
        "navy-deep": "#081A2E",
        ocean: "#2A6F97",
        sky: "#E6F3F8",
        sand: "#E8DCC8",
        leaf: "#6A8F6B",
        charcoal: "#1F2933",
        graphite: "#1e2830",
        aqua: "#6AABBC",
        "aqua-muted": "#5A95A8",
        silver: "#B8C4CE",
        cream: "#FAF8F4",
        "cream-warm": "#F5F1EA",
      },
      boxShadow: {
        card: "0 4px 28px rgba(8, 26, 46, 0.07), 0 1px 0 rgba(255,255,255,0.6) inset",
        lift: "0 16px 48px rgba(8, 26, 46, 0.11), 0 2px 8px rgba(8, 26, 46, 0.04)",
        glow: "0 0 48px rgba(106, 171, 188, 0.14)",
        "glow-soft": "0 0 32px rgba(106, 171, 188, 0.08)",
        studio: "0 8px 32px rgba(12, 35, 64, 0.10)",
        luxury: "0 20px 60px rgba(8, 26, 46, 0.18)",
      },
      backgroundImage: {
        "luxury-radial": "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(106, 171, 188, 0.08), transparent 55%)",
        "luxury-vignette": "radial-gradient(ellipse 120% 80% at 50% 100%, rgba(8, 26, 46, 0.5), transparent 70%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-up": "slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
