/** PBPP luxury coastal design system — reusable tokens for admin + marketing. */

export const BRAND_COLORS = {
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
} as const;

export const SHADOWS = {
  card: "0 4px 24px rgba(12, 35, 64, 0.08)",
  lift: "0 12px 40px rgba(12, 35, 64, 0.12)",
  glow: "0 0 40px rgba(94, 200, 220, 0.18)",
  studio: "0 8px 32px rgba(12, 35, 64, 0.10)",
  inner: "inset 0 1px 0 rgba(255,255,255,0.6)",
} as const;

export const RADIUS = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

export const TYPOGRAPHY = {
  display: "2.5rem",
  h1: "2rem",
  h2: "1.5rem",
  h3: "1.25rem",
  body: "1rem",
  sm: "0.875rem",
  xs: "0.75rem",
} as const;

export type ThemePresetId = "luxury-coastal" | "dark-luxury" | "modern-executive" | "clean-contractor";

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  tokens: {
    colorPrimary: string;
    colorAccent: string;
    colorBackground: string;
    colorSurface: string;
    fontHeading: string;
    fontBody: string;
    radiusLg: string;
    shadowSoft: string;
    gradientHero: string;
  };
  darkMode: boolean;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "luxury-coastal",
    label: "Luxury Coastal",
    description: "Palm Beach cream, ocean accents, executive calm",
    tokens: {
      colorPrimary: "#0C2340",
      colorAccent: "#2A6F97",
      colorBackground: "#F9F6F0",
      colorSurface: "#ffffff",
      fontHeading: "var(--font-sans)",
      fontBody: "var(--font-sans)",
      radiusLg: "1.25rem",
      shadowSoft: "0 4px 24px rgba(12, 35, 64, 0.08)",
      gradientHero: "linear-gradient(135deg, #0C2340 0%, #2A6F97 100%)",
    },
    darkMode: false,
  },
  {
    id: "dark-luxury",
    label: "Dark Luxury",
    description: "Graphite depth with aqua highlights",
    tokens: {
      colorPrimary: "#1F2933",
      colorAccent: "#5ec8dc",
      colorBackground: "#252f38",
      colorSurface: "#1a2229",
      fontHeading: "var(--font-sans)",
      fontBody: "var(--font-sans)",
      radiusLg: "1rem",
      shadowSoft: "0 8px 32px rgba(0,0,0,0.35)",
      gradientHero: "linear-gradient(135deg, #1F2933 0%, #2A6F97 50%, #5ec8dc 100%)",
    },
    darkMode: true,
  },
  {
    id: "modern-executive",
    label: "Modern Executive",
    description: "Clean navy, minimal contrast, boardroom polish",
    tokens: {
      colorPrimary: "#0C2340",
      colorAccent: "#1a5f7a",
      colorBackground: "#ffffff",
      colorSurface: "#f8fafc",
      fontHeading: "var(--font-sans)",
      fontBody: "var(--font-sans)",
      radiusLg: "0.75rem",
      shadowSoft: "0 2px 16px rgba(12, 35, 64, 0.06)",
      gradientHero: "linear-gradient(180deg, #0C2340 0%, #1a3a5c 100%)",
    },
    darkMode: false,
  },
  {
    id: "clean-contractor",
    label: "Clean Contractor",
    description: "High-contrast, field-ready, approachable",
    tokens: {
      colorPrimary: "#1F2933",
      colorAccent: "#6A8F6B",
      colorBackground: "#F9F6F0",
      colorSurface: "#ffffff",
      fontHeading: "var(--font-sans)",
      fontBody: "var(--font-sans)",
      radiusLg: "0.5rem",
      shadowSoft: "0 4px 12px rgba(31, 41, 51, 0.10)",
      gradientHero: "linear-gradient(135deg, #1F2933 0%, #6A8F6B 100%)",
    },
    darkMode: false,
  },
];

export const SPACING_SCALE = ["none", "sm", "md", "lg", "xl"] as const;
export type SpacingScale = (typeof SPACING_SCALE)[number];

export const SPACING_VALUES: Record<SpacingScale, string> = {
  none: "0",
  sm: "2rem",
  md: "4rem",
  lg: "6rem",
  xl: "8rem",
};

export const FONT_OPTIONS = [
  { value: "var(--font-sans)", label: "Plus Jakarta Sans" },
  { value: "Georgia, serif", label: "Georgia (Editorial)" },
  { value: "system-ui, sans-serif", label: "System UI" },
] as const;

export const ICON_OPTIONS = ["✦", "◆", "●", "▸", "☀", "◈", "◇", "★"] as const;
