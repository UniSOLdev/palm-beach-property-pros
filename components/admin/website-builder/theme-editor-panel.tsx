"use client";

import { useState, useTransition } from "react";
import { saveWebsiteTheme } from "@/lib/admin/actions/website-builder";

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
};

export function ThemeEditorPanel({
  initialTokens,
  initialDarkMode,
}: {
  initialTokens: ThemeTokens;
  initialDarkMode: boolean;
}) {
  const [tokens, setTokens] = useState(initialTokens);
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function update(key: keyof ThemeTokens, value: string) {
    setTokens((t) => ({ ...t, [key]: value }));
    setSaved(false);
  }

  return (
    <div className="admin-card space-y-3">
      <h3 className="font-bold text-navy">Theme</h3>
      <label className="flex items-center gap-2 text-sm font-medium text-navy">
        <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
        Dark mode support
      </label>
      <ColorField label="Primary" value={tokens.colorPrimary ?? ""} onChange={(v) => update("colorPrimary", v)} />
      <ColorField label="Accent" value={tokens.colorAccent ?? ""} onChange={(v) => update("colorAccent", v)} />
      <ColorField label="Background" value={tokens.colorBackground ?? ""} onChange={(v) => update("colorBackground", v)} />
      <ColorField label="Surface" value={tokens.colorSurface ?? ""} onChange={(v) => update("colorSurface", v)} />
      <TextThemeField label="Heading font" value={tokens.fontHeading ?? ""} onChange={(v) => update("fontHeading", v)} />
      <TextThemeField label="Body font" value={tokens.fontBody ?? ""} onChange={(v) => update("fontBody", v)} />
      <TextThemeField label="Border radius" value={tokens.radiusLg ?? ""} onChange={(v) => update("radiusLg", v)} />
      <TextThemeField label="Shadow" value={tokens.shadowSoft ?? ""} onChange={(v) => update("shadowSoft", v)} />
      <TextThemeField label="Hero gradient" value={tokens.gradientHero ?? ""} onChange={(v) => update("gradientHero", v)} />
      <button
        type="button"
        disabled={pending}
        className="admin-btn w-full text-sm"
        onClick={() =>
          startTransition(async () => {
            await saveWebsiteTheme(tokens as Record<string, unknown>, darkMode);
            setSaved(true);
          })
        }
      >
        {pending ? "Saving…" : saved ? "Theme saved" : "Save theme"}
      </button>
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
