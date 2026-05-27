"use client";

import { FONT_OPTIONS, THEME_PRESETS, type ThemePresetId } from "@/lib/design/tokens";
import { useBuilderStore } from "@/lib/stores/use-builder-store";

type ThemeTokens = {
  fontHeading?: string;
  fontBody?: string;
  colorPrimary?: string;
  colorAccent?: string;
  colorBackground?: string;
  colorSurface?: string;
  radiusLg?: string;
  shadowSoft?: string;
  gradientHero?: string;
  darkMode?: boolean;
};

export function ThemeEditorPanel() {
  const theme = useBuilderStore((s) => s.theme) as ThemeTokens;
  const patchTheme = useBuilderStore((s) => s.patchTheme);
  const darkMode = Boolean(theme.darkMode);

  function update(key: keyof ThemeTokens, value: string) {
    patchTheme({ [key]: value });
  }

  function applyPreset(id: ThemePresetId) {
    const preset = THEME_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    useBuilderStore.getState().setTheme({ ...preset.tokens, darkMode: preset.darkMode });
  }

  return (
    <div className="studio-panel space-y-4">
      <div>
        <h3 className="font-bold text-navy">Theme</h3>
        <p className="mt-1 text-[11px] text-charcoal/55">Changes apply instantly to the canvas preview</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className="rounded-xl border border-navy/10 p-3 text-left transition hover:border-ocean/40 hover:shadow-card"
          >
            <div className="mb-2 h-8 rounded-lg" style={{ background: preset.tokens.gradientHero }} />
            <p className="text-xs font-semibold text-navy">{preset.label}</p>
            <p className="text-[10px] text-charcoal/55">{preset.description}</p>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-navy">
        <input
          type="checkbox"
          checked={darkMode}
          onChange={(e) => patchTheme({ darkMode: e.target.checked })}
        />
        Dark mode support
      </label>

      <ColorField label="Primary" value={theme.colorPrimary ?? ""} onChange={(v) => update("colorPrimary", v)} />
      <ColorField label="Accent" value={theme.colorAccent ?? ""} onChange={(v) => update("colorAccent", v)} />
      <ColorField label="Background" value={theme.colorBackground ?? ""} onChange={(v) => update("colorBackground", v)} />
      <ColorField label="Surface" value={theme.colorSurface ?? ""} onChange={(v) => update("colorSurface", v)} />

      <label className="block text-sm font-medium text-navy">
        Body font
        <select className="admin-input text-sm" value={theme.fontBody ?? ""} onChange={(e) => update("fontBody", e.target.value)}>
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </label>

      <TextThemeField label="Border radius" value={theme.radiusLg ?? ""} onChange={(v) => update("radiusLg", v)} />
      <TextThemeField label="Hero gradient" value={theme.gradientHero ?? ""} onChange={(v) => update("gradientHero", v)} />

      <p className="text-center text-[11px] text-charcoal/50">
        Theme saves automatically with page changes
      </p>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium text-navy">
      <span className="w-24 shrink-0">{label}</span>
      <input type="color" value={value || "#0f2a44"} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-navy/15" />
      <input className="admin-input flex-1 text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextThemeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      <input className="admin-input text-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
