import type { CSSProperties } from "react";
import type { ThemePreset } from "@/lib/design/tokens";
import { THEME_PRESETS } from "@/lib/design/tokens";

/** Full design token config stored in website_theme.tokens JSON. */
export type ThemeConfig = {
  colorPrimary: string;
  colorAccent: string;
  colorBackground: string;
  colorSurface: string;
  fontHeading: string;
  fontBody: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  spacingScale: "compact" | "comfortable" | "luxury";
  buttonStyle: "solid" | "gradient" | "outline";
  shadowIntensity: "soft" | "medium" | "strong";
  animationIntensity: "none" | "subtle" | "expressive";
  shadowSoft: string;
  gradientHero: string;
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  colorPrimary: "#0C2340",
  colorAccent: "#2A6F97",
  colorBackground: "#F9F6F0",
  colorSurface: "#ffffff",
  fontHeading: "var(--font-sans)",
  fontBody: "var(--font-sans)",
  radiusSm: "0.5rem",
  radiusMd: "0.75rem",
  radiusLg: "1.25rem",
  spacingScale: "comfortable",
  buttonStyle: "gradient",
  shadowIntensity: "soft",
  animationIntensity: "subtle",
  shadowSoft: "0 4px 24px rgba(12, 35, 64, 0.08)",
  gradientHero: "linear-gradient(135deg, #0C2340 0%, #2A6F97 100%)",
};

export function themeConfigToCss(config: Partial<ThemeConfig>): CSSProperties {
  return {
    ["--cms-primary" as string]: config.colorPrimary,
    ["--cms-accent" as string]: config.colorAccent,
    ["--cms-bg" as string]: config.colorBackground,
    ["--cms-surface" as string]: config.colorSurface,
    ["--cms-radius-sm" as string]: config.radiusSm,
    ["--cms-radius-md" as string]: config.radiusMd,
    ["--cms-radius-lg" as string]: config.radiusLg,
    ["--cms-shadow" as string]: config.shadowSoft,
    ["--cms-gradient" as string]: config.gradientHero,
    fontFamily: config.fontBody,
    backgroundColor: config.colorBackground,
  };
}

export function mergeThemeConfig(raw: Record<string, unknown>): ThemeConfig {
  return { ...DEFAULT_THEME_CONFIG, ...raw } as ThemeConfig;
}

export function presetToThemeConfig(preset: ThemePreset): ThemeConfig {
  return mergeThemeConfig({
    ...preset.tokens,
    spacingScale: "comfortable",
    buttonStyle: "gradient",
    shadowIntensity: "soft",
    animationIntensity: "subtle",
    radiusSm: "0.5rem",
    radiusMd: "0.75rem",
  });
}

export function findPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}
