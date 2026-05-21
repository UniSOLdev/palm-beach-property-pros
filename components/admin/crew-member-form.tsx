"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { CrewMemberRow } from "@/lib/db-types";
import { CREW_ROLES, CREW_STATUSES, PAY_TYPES, SKILL_LEVELS } from "@/lib/crew-constants";

function dollarsFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

function centsFromDollars(s: string): number {
  const n = Number.parseFloat(String(s).replace(/[$,]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

type Props =
  | { mode: "create"; initial?: undefined }
  | { mode: "edit"; initial: CrewMemberRow };

export function CrewMemberForm(props: Props) {
  const router = useRouter();
  const initial = props.mode === "edit" ? props.initial : null;

  const [full_name, setFullName] = useState(initial?.full_name ?? "");
  const [role, setRole] = useState(initial?.role ?? "cleaning_tech");
  const [status, setStatus] = useState(initial?.status ?? "available");
  const [skill_level, setSkillLevel] = useState(initial?.skill_level ?? "intermediate");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [certifications, setCertifications] = useState(initial?.certifications ?? "");
  const [availability_notes, setAvailabilityNotes] = useState(initial?.availability_notes ?? "");
  const [default_pay_type, setDefaultPayType] = useState(initial?.default_pay_type ?? "percentage");
  const [defaultPayDollars, setDefaultPayDollars] = useState(dollarsFromCents(initial?.default_pay_rate_cents ?? 0));
  const [default_pay_percent, setDefaultPayPercent] = useState(String(initial?.default_pay_percent ?? 0));
  const [lead_bonus_percent, setLeadBonusPercent] = useState(String(initial?.lead_bonus_percent ?? 10));
  const [trainee_pay_multiplier, setTraineeMultiplier] = useState(String(initial?.trainee_pay_multiplier ?? 0.75));
  const [is_active, setIsActive] = useState(initial?.is_active ?? true);
  const [performance_meta] = useState<Record<string, unknown>>(() =>
    initial?.performance_meta ? { ...initial.performance_meta } : {},
  );
  const [equipment_meta] = useState<Record<string, unknown>>(() =>
    initial?.equipment_meta ? { ...initial.equipment_meta } : {},
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      full_name: full_name.trim(),
      role,
      status,
      skill_level,
      phone: phone.trim() || null,
      email: email.trim() || null,
      notes: notes.trim() || null,
      certifications: certifications.trim() || null,
      availability_notes: availability_notes.trim() || null,
      default_pay_type,
      default_pay_rate_cents: centsFromDollars(defaultPayDollars),
      default_pay_percent: Number.parseFloat(default_pay_percent) || 0,
      lead_bonus_percent: Number.parseFloat(lead_bonus_percent) || 10,
      trainee_pay_multiplier: Number.parseFloat(trainee_pay_multiplier) || 0.75,
      is_active,
      performance_meta,
      equipment_meta,
    }),
    [
      full_name,
      role,
      status,
      skill_level,
      phone,
      email,
      notes,
      certifications,
      availability_notes,
      default_pay_type,
      defaultPayDollars,
      default_pay_percent,
      lead_bonus_percent,
      trainee_pay_multiplier,
      is_active,
      performance_meta,
      equipment_meta,
    ],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const url = props.mode === "create" ? "/api/admin/crew" : `/api/admin/crew/${initial!.id}`;
      const method = props.mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      router.push("/admin/crew");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (props.mode !== "edit" || !initial) return;
    if (!confirm("Remove this crew member from the roster?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/crew/${initial.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed.");
      router.push("/admin/crew");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error ? (
        <Div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</Div>
      ) : null}

      <FormSection title="Profile" subtitle="Who they are on the roster and how to reach them.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" className="md:col-span-2">
            <input
              required
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Role">
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
              {CREW_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {CREW_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Skill level">
            <select value={skill_level} onChange={(e) => setSkillLevel(e.target.value)} className={inputClass}>
              {SKILL_LEVELS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Certifications" className="md:col-span-2">
            <textarea value={certifications} onChange={(e) => setCertifications(e.target.value)} rows={2} className={inputClass} />
          </Field>
          <Field label="Availability notes" className="md:col-span-2">
            <textarea value={availability_notes} onChange={(e) => setAvailabilityNotes(e.target.value)} rows={2} className={inputClass} />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 md:col-span-2">
            <input type="checkbox" checked={is_active} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            Active on roster
          </label>
        </div>
      </FormSection>

      <FormSection title="Default pay structure" subtitle="Feeds the payout calculator and job crew lines.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Pay type">
            <select value={default_pay_type} onChange={(e) => setDefaultPayType(e.target.value)} className={inputClass}>
              {PAY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          {(default_pay_type === "hourly" || default_pay_type === "flat") && (
            <Field label={default_pay_type === "hourly" ? "Default rate ($/hr)" : "Default flat ($)"}>
              <input
                inputMode="decimal"
                value={defaultPayDollars}
                onChange={(e) => setDefaultPayDollars(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          {(default_pay_type === "percentage" || default_pay_type === "split") && (
            <Field label="Default % / split weight">
              <input
                inputMode="decimal"
                value={default_pay_percent}
                onChange={(e) => setDefaultPayPercent(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          <Field label="Lead bonus %">
            <input
              inputMode="decimal"
              value={lead_bonus_percent}
              onChange={(e) => setLeadBonusPercent(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Trainee pay multiplier">
            <input
              inputMode="decimal"
              value={trainee_pay_multiplier}
              onChange={(e) => setTraineeMultiplier(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/20 transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Saving…" : props.mode === "create" ? "Add to roster" : "Save changes"}
          </button>
          <Link href="/admin/crew" className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 no-underline transition hover:bg-white/5">
            Cancel
          </Link>
        </div>
        {props.mode === "edit" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDelete()}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-40"
          >
            Remove
          </button>
        ) : null}
      </div>
    </form>
  );
}

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20";

function FormSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</label>
      {children}
    </div>
  );
}

function Div({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
