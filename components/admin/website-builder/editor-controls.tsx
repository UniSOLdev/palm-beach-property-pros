"use client";

/** Shared editor controls for Site Studio section panels. */

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs font-medium text-navy">
      <span className="flex justify-between">
        {label}
        <span className="text-charcoal/60">{value}{unit}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-ocean"
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-navy">
      {label}
      <select className="admin-input text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs font-medium text-navy">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-ocean" : "bg-charcoal/20"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

export function IconPicker({
  label,
  value,
  icons,
  onChange,
}: {
  label: string;
  value: string;
  icons: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-navy">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {icons.map((icon) => (
          <button
            key={icon}
            type="button"
            onClick={() => onChange(icon)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${
              value === icon ? "border-ocean bg-sky/50 text-navy" : "border-navy/10 bg-white hover:border-ocean/30"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EnhanceButton({ onClick, label = "✨ Enhance copy" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-ocean/20 bg-sky/30 py-2 text-xs font-semibold text-ocean transition hover:bg-sky/50"
    >
      {label}
    </button>
  );
}
