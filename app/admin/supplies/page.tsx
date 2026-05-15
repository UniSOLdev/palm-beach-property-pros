export const dynamic = "force-dynamic";

import Link from "next/link";

import type { InventoryItemRow } from "@/lib/db-types";
import {
  isLowStock,
  labelForInventoryType,
  labelForOperationalStatus,
  statusBadgeClasses,
  typeBadgeClasses,
} from "@/lib/inventory-constants";
import { mapInventoryItemRow } from "@/lib/inventory-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "Ops inventory",
};

function fmtMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type Light = Pick<
  InventoryItemRow,
  | "quantity"
  | "reorder_level"
  | "operational_status"
  | "assigned_job_id"
  | "is_consumable"
  | "unit_cost_cents"
>;

function computeStats(rows: Light[]) {
  let low_stock = 0;
  let maintenance = 0;
  let assigned = 0;
  let consumables = 0;
  let value_cents = 0;
  for (const r of rows) {
    if (isLowStock(r.quantity, r.reorder_level)) low_stock++;
    if (r.operational_status === "maintenance_needed") maintenance++;
    if (r.assigned_job_id || r.operational_status === "assigned_to_job") assigned++;
    if (r.is_consumable) consumables++;
    value_cents += Math.round(Number(r.quantity) * (r.unit_cost_cents || 0));
  }
  return { low_stock, maintenance, assigned, consumables, value_cents };
}

function sanitizeSearch(q: string) {
  return q.replace(/%/g, "").replace(/_/g, "").replace(/,/g, "").trim().slice(0, 120);
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    category?: string;
    storage?: string;
    filter?: string;
  }>;
};

export default async function AdminSuppliesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sanitizeSearch(sp.q ?? "");
  const inventory_type = (sp.type ?? "").trim();
  const operational_status = (sp.status ?? "").trim();
  const category = (sp.category ?? "").trim();
  const storage = (sp.storage ?? "").trim();
  const filter = (sp.filter ?? "").trim();

  let err: string | null = null;
  let items: InventoryItemRow[] = [];
  let stats = { low_stock: 0, maintenance: 0, assigned: 0, consumables: 0, value_cents: 0, total_items: 0 };

  try {
    const supabase = createServiceSupabase();

    const [countRes, statsRes] = await Promise.all([
      supabase.from("inventory_items").select("id", { count: "exact", head: true }),
      supabase
        .from("inventory_items")
        .select("quantity, reorder_level, operational_status, assigned_job_id, is_consumable, unit_cost_cents")
        .limit(8000),
    ]);

    if (countRes.error) throw countRes.error;
    if (statsRes.error) throw statsRes.error;

    const partial = computeStats((statsRes.data ?? []) as Light[]);
    stats = { ...partial, total_items: countRes.count ?? 0 };

    let listQuery = supabase
      .from("inventory_items")
      .select("*")
      .order("priority_rank", { ascending: true })
      .order("name", { ascending: true })
      .limit(500);

    if (inventory_type) listQuery = listQuery.eq("inventory_type", inventory_type);
    if (operational_status) listQuery = listQuery.eq("operational_status", operational_status);
    if (category) listQuery = listQuery.ilike("category", `%${category}%`);
    if (storage) listQuery = listQuery.ilike("storage_location", `%${storage}%`);
    if (q) {
      const p = `%${q}%`;
      listQuery = listQuery.or(`name.ilike.${p},category.ilike.${p},storage_location.ilike.${p},vendor.ilike.${p}`);
    }

    const { data, error } = await listQuery;
    if (error) throw error;

    items = (data ?? []).map((row) => mapInventoryItemRow(row as Record<string, unknown>));
    if (filter === "low_stock") {
      items = items.filter((r) => isLowStock(r.quantity, r.reorder_level));
    }
    if (filter === "assigned") {
      items = items.filter((r) => Boolean(r.assigned_job_id) || r.operational_status === "assigned_to_job");
    }
    if (filter === "maintenance") {
      items = items.filter((r) => r.operational_status === "maintenance_needed");
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load inventory.";
  }

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (inventory_type) qs.set("type", inventory_type);
  if (operational_status) qs.set("status", operational_status);
  if (category) qs.set("category", category);
  if (storage) qs.set("storage", storage);

  function withFilter(f: string) {
    const p = new URLSearchParams(qs);
    if (f) p.set("filter", f);
    else p.delete("filter");
    const s = p.toString();
    return s ? `/admin/supplies?${s}` : "/admin/supplies";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">Supply depot</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Ops inventory</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Storage-unit organization, crew loadouts, and field-ready stock. Route{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-400">/admin/supplies</code>{" "}
            unchanged for bookmarks and integrations.
          </p>
        </div>
        <Link
          href="/admin/supplies/new"
          className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline shadow-lg shadow-sky-900/25 transition hover:brightness-110"
        >
          Add item
        </Link>
      </div>

      {err ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}{" "}
          <span className="text-amber-200/80">Apply the inventory migration if this environment has not run it yet.</span>
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total SKUs" value={String(stats.total_items)} sub="Lines in the depot catalog" />
        <StatCard label="Low stock" value={String(stats.low_stock)} sub="At or below reorder level" tone="amber" />
        <StatCard label="Maintenance queue" value={String(stats.maintenance)} sub="Flagged for service" tone="orange" />
        <StatCard label="Assigned / loadout" value={String(stats.assigned)} sub="Job or status linked" tone="sky" />
        <StatCard label="Consumables" value={String(stats.consumables)} sub="Depletable stock" />
        <StatCard label="Est. on-hand value" value={fmtMoney(stats.value_cents)} sub="Qty × unit cost" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/[0.05] md:p-5">
        <form method="get" className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <input type="hidden" name="filter" defaultValue={filter} />
          <div className="min-w-[180px] flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Search</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, category, vendor, bin…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            />
          </div>
          <div className="w-full min-w-[140px] md:w-40">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Type</label>
            <select
              name="type"
              defaultValue={inventory_type}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            >
              <option value="">All types</option>
              <option value="chemical">Chemical</option>
              <option value="consumable">Consumable</option>
              <option value="equipment">Equipment</option>
              <option value="tool">Tool</option>
              <option value="ppe">PPE</option>
              <option value="rental">Rental</option>
              <option value="mobile_ops_gear">Mobile ops gear</option>
            </select>
          </div>
          <div className="w-full min-w-[140px] md:w-40">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status</label>
            <select
              name="status"
              defaultValue={operational_status}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
            >
              <option value="">All statuses</option>
              <option value="ready">Ready</option>
              <option value="needs_refill">Needs refill</option>
              <option value="assigned_to_job">Assigned to job</option>
              <option value="maintenance_needed">Maintenance needed</option>
              <option value="damaged">Damaged</option>
              <option value="missing">Missing</option>
              <option value="out_of_service">Out of service</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-xl border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Apply
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterChip href={withFilter("")} active={!filter}>
            All
          </FilterChip>
          <FilterChip href={withFilter("low_stock")} active={filter === "low_stock"}>
            Low stock
          </FilterChip>
          <FilterChip href={withFilter("assigned")} active={filter === "assigned"}>
            Assigned / loadout
          </FilterChip>
          <FilterChip href={withFilter("maintenance")} active={filter === "maintenance"}>
            Maintenance
          </FilterChip>
        </div>
      </div>

      {items.length === 0 && !err ? (
        <p className="rounded-2xl border border-white/10 bg-black/30 px-4 py-10 text-center text-sm text-zinc-500">
          No items match.{" "}
          <Link href="/admin/supplies/new" className="text-sky-300 hover:underline">
            Add your first depot line →
          </Link>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const low = isLowStock(item.quantity, item.reorder_level);
            return (
              <Link
                key={item.id}
                href={`/admin/supplies/${item.id}`}
                className={[
                  "group block rounded-2xl border bg-white/[0.03] p-5 no-underline ring-1 ring-white/[0.05] transition",
                  "hover:border-sky-400/35 hover:bg-white/[0.05]",
                  low ? "border-amber-400/35 ring-amber-400/15" : "border-white/10",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white group-hover:text-sky-100">{item.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{item.category}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-right text-xs tabular-nums text-zinc-200">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.storage_location ? (
                  <p className="mt-3 text-xs text-zinc-400">
                    <span className="text-zinc-600">Bin · </span>
                    {item.storage_location}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-zinc-600">No storage location set</p>
                )}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${typeBadgeClasses(item.inventory_type)}`}>
                    {labelForInventoryType(item.inventory_type)}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClasses(item.operational_status)}`}>
                    {labelForOperationalStatus(item.operational_status)}
                  </span>
                  {low ? (
                    <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
                      Low stock
                    </span>
                  ) : null}
                  {item.assigned_job_id ? (
                    <span className="rounded-full border border-sky-400/35 bg-sky-500/15 px-2 py-0.5 text-[10px] font-medium text-sky-100">
                      Job loadout
                    </span>
                  ) : null}
                  {!item.is_consumable ? (
                    <span className="rounded-full border border-zinc-600 bg-zinc-800/60 px-2 py-0.5 text-[10px] text-zinc-300">
                      Reusable
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                  <span>{fmtMoney(Math.round(Number(item.quantity) * item.unit_cost_cents))} on hand</span>
                  <span className="text-sky-400/90 opacity-0 transition group-hover:opacity-100">Edit →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "amber" | "orange" | "sky";
}) {
  const ring =
    tone === "amber"
      ? "border-amber-400/20 ring-amber-400/10"
      : tone === "orange"
        ? "border-orange-400/20 ring-orange-400/10"
        : tone === "sky"
          ? "border-sky-400/20 ring-sky-400/10"
          : "border-white/10 ring-white/[0.06]";
  return (
    <div className={`rounded-2xl border bg-white/[0.04] p-5 ring-1 ${ring}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={[
        "rounded-full border px-3 py-1.5 text-xs font-medium no-underline transition",
        active ? "border-sky-400/40 bg-sky-500/15 text-sky-100" : "border-white/10 bg-black/30 text-zinc-400 hover:border-white/20 hover:text-zinc-200",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
