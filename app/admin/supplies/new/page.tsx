export const dynamic = "force-dynamic";

import Link from "next/link";

import { InventoryItemForm, type JobOption } from "@/components/admin/inventory-item-form";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "New inventory item",
};

export default async function NewInventoryItemPage() {
  let jobOptions: JobOption[] = [];
  let err: string | null = null;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("jobs")
      .select("id, job_number, title")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    jobOptions = (data ?? []).map((j) => {
      const row = j as Record<string, unknown>;
      const num = row.job_number != null ? String(row.job_number) : "";
      const title = row.title != null ? String(row.title) : "";
      const label = [num, title].filter(Boolean).join(" · ") || String(row.id).slice(0, 8);
      return { id: String(row.id), label };
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load jobs.";
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">Ops inventory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">New depot item</h1>
          <p className="mt-1 text-sm text-zinc-500">Add consumables, chemicals, tools, or reusable equipment to the catalog.</p>
        </div>
        <Link href="/admin/supplies" className="text-sm text-sky-300 no-underline hover:underline">
          ← Back to depot
        </Link>
      </div>
      {err ? <p className="text-sm text-amber-200">{err}</p> : null}
      <InventoryItemForm mode="create" jobOptions={jobOptions} />
    </div>
  );
}
