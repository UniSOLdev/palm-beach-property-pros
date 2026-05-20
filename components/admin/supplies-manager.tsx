"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  adjustSupplyQuantity,
  archiveSupply,
  logSupplyJobUsage,
  saveSupply,
} from "@/lib/admin/actions/supplies";
import { createTasksBulk } from "@/lib/admin/actions/tasks";
import { SUPPLY_CATEGORIES, SUPPLY_UNITS } from "@/lib/admin/supply-constants";
import { formatCurrency, formatDate } from "@/lib/admin/format";
import type { SupplyRow } from "@/lib/admin/types-supplies";

type JobOption = { id: string; label: string };

type SupplyForm = {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  storage_location: string;
  reorder_level: number;
  cost: number;
  vendor: string;
  notes: string;
  is_reusable: boolean;
};

const emptyForm: SupplyForm = {
  name: "",
  category: SUPPLY_CATEGORIES[0],
  quantity: 0,
  unit: SUPPLY_UNITS[0],
  storage_location: "",
  reorder_level: 2,
  cost: 0,
  vendor: "",
  notes: "",
  is_reusable: false,
};

export function SuppliesManager({
  initial,
  jobs,
}: {
  initial: SupplyRow[];
  jobs: JobOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplyForm>(emptyForm);
  const [usageSupplyId, setUsageSupplyId] = useState<string | null>(null);
  const [usageJobId, setUsageJobId] = useState("");
  const [usageQty, setUsageQty] = useState(1);

  const lowStock = useMemo(
    () => initial.filter((s) => Number(s.quantity) <= Number(s.reorder_level)),
    [initial],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return initial;
    return initial.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.storage_location ?? "").toLowerCase().includes(q) ||
        (s.vendor ?? "").toLowerCase().includes(q),
    );
  }, [initial, filter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(row: SupplyRow) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      category: row.category,
      quantity: Number(row.quantity),
      unit: row.unit,
      storage_location: row.storage_location ?? "",
      reorder_level: Number(row.reorder_level),
      cost: Number(row.cost),
      vendor: row.vendor ?? "",
      notes: row.notes ?? "",
      is_reusable: row.is_reusable,
    });
    setShowForm(true);
  }

  return (
    <div className="space-y-4 pb-28">
      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {lowStock.length > 0 ? (
        <section className="admin-card border-amber-200 bg-amber-50/80 space-y-2">
          <h2 className="text-sm font-bold text-navy">Low stock ({lowStock.length})</h2>
          <ul className="space-y-2">
            {lowStock.slice(0, 5).map((s) => (
              <li key={s.id} className="flex justify-between gap-2 text-sm">
                <span className="font-semibold text-navy">{s.name}</span>
                <span className="text-red-700 font-bold">
                  {Number(s.quantity)} {s.unit} · reorder at {Number(s.reorder_level)}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="admin-btn-secondary w-full min-h-[48px] text-xs"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await createTasksBulk(
                  lowStock.map((s) => ({
                    title: `Restock: ${s.name}`,
                    category: "Supply Restock",
                    priority: "high",
                  })),
                  { category: "Supply Restock", priority: "high" },
                );
                router.refresh();
              })
            }
          >
            Create restock tasks
          </button>
        </section>
      ) : null}

      <input
        type="search"
        placeholder="Search supplies…"
        className="admin-input mt-0"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label="Search supplies"
      />

      {showForm ? (
        <form
          className="admin-card space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              setError("");
              try {
                await saveSupply({
                  id: editingId ?? undefined,
                  ...form,
                  storage_location: form.storage_location || null,
                  vendor: form.vendor || null,
                  notes: form.notes || null,
                });
                setShowForm(false);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not save");
              }
            });
          }}
        >
          <h2 className="font-bold text-navy">{editingId ? "Edit supply" : "Add supply"}</h2>
          <input
            required
            className="admin-input mt-0"
            placeholder="Item name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="admin-input mt-0"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {SUPPLY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              step="0.01"
              className="admin-input mt-0"
              placeholder="Qty on hand"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
            <select
              className="admin-input mt-0"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {SUPPLY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              step="0.01"
              className="admin-input mt-0"
              placeholder="Low-stock at"
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              className="admin-input mt-0"
              placeholder="Unit cost"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
            />
          </div>
          <input
            className="admin-input mt-0"
            placeholder="Storage location"
            value={form.storage_location}
            onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
          />
          <input
            className="admin-input mt-0"
            placeholder="Vendor / store"
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />
          <textarea
            className="admin-input mt-0"
            rows={2}
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <label className="flex min-h-[48px] items-center gap-3 text-sm font-medium text-navy">
            <input
              type="checkbox"
              checked={form.is_reusable}
              onChange={(e) => setForm({ ...form, is_reusable: e.target.checked })}
              className="h-5 w-5"
            />
            Reusable (usage does not deduct quantity)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="admin-btn flex-1">
              Save
            </button>
            <button
              type="button"
              className="admin-btn-secondary flex-1"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-3">
        {filtered.length === 0 ? (
          <li className="admin-card text-center text-sm text-charcoal/60">No supplies match.</li>
        ) : (
          filtered.map((row) => {
            const isLow = Number(row.quantity) <= Number(row.reorder_level);
            return (
              <li
                key={row.id}
                className={`admin-card space-y-3 ${isLow ? "ring-2 ring-amber-300/80" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy">{row.name}</p>
                    <p className="text-xs text-charcoal/60">
                      {row.category}
                      {row.storage_location ? ` · ${row.storage_location}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {isLow ? (
                      <span className="admin-chip bg-amber-100 text-amber-900">Low stock</span>
                    ) : null}
                    <span className="admin-chip bg-sky/50 text-navy">
                      {row.is_reusable ? "Reusable" : "Consumable"}
                    </span>
                  </div>
                </div>
                <p className="text-lg font-bold text-navy">
                  {Number(row.quantity)} <span className="text-sm font-normal text-charcoal/70">{row.unit}</span>
                </p>
                <p className="text-xs text-charcoal/60">
                  Reorder at {Number(row.reorder_level)} · {formatCurrency(Number(row.cost))} / unit
                  {row.vendor ? ` · ${row.vendor}` : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="admin-btn-secondary min-h-[48px] min-w-[48px] px-4 text-lg"
                    aria-label="Decrease quantity"
                    onClick={() =>
                      startTransition(async () => {
                        setError("");
                        try {
                          await adjustSupplyQuantity(row.id, -1);
                          router.refresh();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed");
                        }
                      })
                    }
                  >
                    −
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="admin-btn-secondary min-h-[48px] min-w-[48px] px-4 text-lg"
                    aria-label="Increase quantity"
                    onClick={() =>
                      startTransition(async () => {
                        setError("");
                        try {
                          await adjustSupplyQuantity(row.id, 1);
                          router.refresh();
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Failed");
                        }
                      })
                    }
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary min-h-[48px] flex-1 text-xs"
                    onClick={() => openEdit(row)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-btn min-h-[48px] flex-1 text-xs"
                    onClick={() => {
                      setUsageSupplyId(row.id);
                      setUsageJobId(jobs[0]?.id ?? "");
                      setUsageQty(1);
                    }}
                  >
                    Log usage
                  </button>
                </div>
                {usageSupplyId === row.id ? (
                  <div className="rounded-xl border border-navy/10 bg-cream/40 p-3 space-y-2">
                    <p className="text-xs font-semibold text-navy">Log job usage</p>
                    <select
                      className="admin-input mt-0"
                      value={usageJobId}
                      onChange={(e) => setUsageJobId(e.target.value)}
                    >
                      <option value="">Select job</option>
                      {jobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      className="admin-input mt-0"
                      value={usageQty}
                      onChange={(e) => setUsageQty(Number(e.target.value))}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending || !usageJobId}
                        className="admin-btn flex-1 text-xs"
                        onClick={() =>
                          startTransition(async () => {
                            setError("");
                            try {
                              await logSupplyJobUsage({
                                supply_id: row.id,
                                job_id: usageJobId,
                                quantity_used: usageQty,
                                deduct_inventory: !row.is_reusable,
                              });
                              setUsageSupplyId(null);
                              router.refresh();
                            } catch (e) {
                              setError(e instanceof Error ? e.message : "Failed");
                            }
                          })
                        }
                      >
                        Save usage
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary flex-1 text-xs"
                        onClick={() => setUsageSupplyId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-between text-[10px] text-charcoal/50">
                  <span>Updated {formatDate(row.updated_at ?? row.created_at)}</span>
                  <button
                    type="button"
                    className="font-semibold text-red-600 min-h-[44px]"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Archive ${row.name}?`)) return;
                      startTransition(async () => {
                        await archiveSupply(row.id);
                        router.refresh();
                      });
                    }}
                  >
                    Archive
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>

      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-navy/10 bg-cream/95 px-3 py-2 backdrop-blur-md pb-safe">
        <button type="button" onClick={openCreate} className="admin-btn mx-auto block w-full max-w-3xl min-h-[52px]">
          + Add supply item
        </button>
      </div>
    </div>
  );
}
