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
        /** PBPP brand — coastal property service */
        navy: "#082A4D",
        ocean: "#004E89",
        coast: "#00AEEF",
        sky: "#7EDCFF",
        ice: "#EEF8FC",
        sand: "#F7F3EA",
        leaf: "#2E8B57",
        gold: "#FFD447",
        charcoal: "#1F2937",
        cream: "#F7F3EA",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px rgba(8, 42, 77, 0.09)",
        lift: "0 12px 40px rgba(8, 42, 77, 0.14)",
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
