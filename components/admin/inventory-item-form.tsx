"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { InventoryItemRow } from "@/lib/db-types";
import {
  ALL_SUGGESTED_CATEGORIES,
  CATEGORY_GROUPS,
  CONDITION_OPTIONS,
  INVENTORY_TYPES,
  OPERATIONAL_STATUSES,
  PRIORITY_LEVELS,
  STORAGE_LOCATION_PRESETS,
} from "@/lib/inventory-constants";

export type JobOption = { id: string; label: string };

function dollarsFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

function centsFromDollarsString(s: string): number {
  const n = Number.parseFloat(String(s).replace(/[$,]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

type Props =
  | { mode: "create"; initialItem?: undefined; jobOptions: JobOption[] }
  | { mode: "edit"; initialItem: InventoryItemRow; jobOptions: JobOption[] };

export function InventoryItemForm(props: Props) {
  const router = useRouter();
  const { mode, jobOptions } = props;
  const initial = props.mode === "edit" ? props.initialItem : null;

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "General");
  const [inventory_type, setInventoryType] = useState(initial?.inventory_type ?? "consumable");
  const [operational_status, setOperationalStatus] = useState(initial?.operational_status ?? "ready");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? "0"));
  const [unit, setUnit] = useState(initial?.unit ?? "each");
  const [storage_location, setStorageLocation] = useState(initial?.storage_location ?? "");
  const [reorder_level, setReorderLevel] = useState(String(initial?.reorder_level ?? "0"));
  const [unitCostDollars, setUnitCostDollars] = useState(initial ? dollarsFromCents(initial.unit_cost_cents) : "0.00");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [assigned_crew, setAssignedCrew] = useState(initial?.assigned_crew ?? "");
  const [assigned_job_id, setAssignedJobId] = useState(initial?.assigned_job_id ?? "");
  const [last_restocked, setLastRestocked] = useState(initial?.last_restocked ?? "");
  const [condition, setCondition] = useState(initial?.condition ?? "");
  const [is_consumable, setIsConsumable] = useState(initial?.is_consumable ?? true);
  const [priority_level, setPriorityLevel] = useState(initial?.priority_level ?? "normal");
  const [meta] = useState<Record<string, unknown>>(() => (mode === "edit" && initial ? { ...initial.meta } : {}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(
    () => ({
      name: name.trim(),
      category: category.trim() || "General",
      inventory_type,
      operational_status,
      quantity: Number.parseFloat(quantity) || 0,
      unit: unit.trim() || "each",
      storage_location: storage_location.trim() || null,
      reorder_level: Number.parseFloat(reorder_level) || 0,
      unit_cost_cents: centsFromDollarsString(unitCostDollars),
      vendor: vendor.trim() || null,
      notes: notes.trim() || null,
      assigned_crew: assigned_crew.trim() || null,
      assigned_job_id: assigned_job_id.trim() || null,
      last_restocked: last_restocked.trim() || null,
      condition: condition.trim() || null,
      is_consumable,
      priority_level,
      meta,
    }),
    [
      name,
      category,
      inventory_type,
      operational_status,
      quantity,
      unit,
      storage_location,
      reorder_level,
      unitCostDollars,
      vendor,
      notes,
      assigned_crew,
      assigned_job_id,
      last_restocked,
      condition,
      is_consumable,
      priority_level,
      meta,
    ],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const url = mode === "create" ? "/api/admin/supplies" : `/api/admin/supplies/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      if (mode === "create" && data.item?.id) {
        router.push(`/admin/supplies/${data.item.id}`);
        router.refresh();
      } else {
        router.push("/admin/supplies");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (mode !== "edit" || !initial) return;
    if (!confirm("Delete this inventory item? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/supplies/${initial.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed.");
      router.push("/admin/supplies");
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
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Item</h2>
        <p className="mt-1 text-xs text-zinc-500">What it is called in the depot and how it is grouped.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</label>
            <input
              list="inventory-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
            <datalist id="inventory-categories">
              {ALL_SUGGESTED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <details className="mt-2 text-xs text-zinc-500">
              <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">Suggested groups</summary>
              <ul className="mt-2 space-y-2 text-zinc-500">
                {CATEGORY_GROUPS.map((g) => (
                  <li key={g.group}>
                    <span className="font-semibold text-zinc-400">{g.group}</span>
                    <span className="text-zinc-600"> — </span>
                    {g.items.join(", ")}
                  </li>
                ))}
              </ul>
            </details>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Inventory type</label>
            <select
              value={inventory_type}
              onChange={(e) => setInventoryType(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            >
              {INVENTORY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Depot location</h2>
        <p className="mt-1 text-xs text-zinc-500">Storage unit layout — shelves, racks, vehicle bins.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Storage location</label>
            <input
              list="inventory-storage-presets"
              value={storage_location}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g. Shelf A1 · Chemical rack"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
            <datalist id="inventory-storage-presets">
              {STORAGE_LOCATION_PRESETS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Stock & cost</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quantity</label>
            <input
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Unit</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="each, box, gal, case…"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Reorder level</label>
            <input
              inputMode="decimal"
              value={reorder_level}
              onChange={(e) => setReorderLevel(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Unit cost (USD)</label>
            <input
              inputMode="decimal"
              value={unitCostDollars}
              onChange={(e) => setUnitCostDollars(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Last restocked</label>
            <input
              type="date"
              value={last_restocked}
              onChange={(e) => setLastRestocked(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Vendor</label>
            <input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Operational status</h2>
        <p className="mt-1 text-xs text-zinc-500">Low stock is computed when quantity is at or below reorder level.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</label>
            <select
              value={operational_status}
              onChange={(e) => setOperationalStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            >
              {OPERATIONAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Priority</label>
            <select
              value={priority_level}
              onChange={(e) => setPriorityLevel(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            >
              {PRIORITY_LEVELS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Condition (equipment)</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">—</option>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
              <input type="checkbox" checked={is_consumable} onChange={(e) => setIsConsumable(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black/50" />
              Consumable (one-time / depletes)
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Field deployment</h2>
        <p className="mt-1 text-xs text-zinc-500">Crew loadouts and job-linked gear (foundation for checkout later).</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Assigned crew</label>
            <input
              value={assigned_crew}
              onChange={(e) => setAssignedCrew(e.target.value)}
              placeholder="Crew name or van slot"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Related job</label>
            <select
              value={assigned_job_id}
              onChange={(e) => setAssignedJobId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">— None —</option>
              {jobOptions.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40 focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/20 transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? "Saving…" : mode === "create" ? "Create item" : "Save changes"}
          </button>
          <Link
            href="/admin/supplies"
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 no-underline transition hover:bg-white/5"
          >
            Cancel
          </Link>
        </div>
        {mode === "edit" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onDelete()}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-40"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
