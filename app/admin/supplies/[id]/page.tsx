export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { InventoryItemForm, type JobOption } from "@/components/admin/inventory-item-form";
import { mapInventoryItemRow } from "@/lib/inventory-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "Edit inventory item",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditInventoryItemPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const supabase = createServiceSupabase();

  const [{ data: row, error }, jobsRes] = await Promise.all([
    supabase.from("inventory_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("jobs").select("id, job_number, title").order("updated_at", { ascending: false }).limit(200),
  ]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{error.message}</p>
      </div>
    );
  }
  if (!row) notFound();

  const item = mapInventoryItemRow(row as Record<string, unknown>);
  let jobOptions: JobOption[] = [];
  if (!jobsRes.error && jobsRes.data) {
    jobOptions = jobsRes.data.map((j) => {
      const r = j as Record<string, unknown>;
      const num = r.job_number != null ? String(r.job_number) : "";
      const title = r.title != null ? String(r.title) : "";
      const label = [num, title].filter(Boolean).join(" · ") || String(r.id).slice(0, 8);
      return { id: String(r.id), label };
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">Ops inventory</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Edit item</h1>
          <p className="mt-1 text-sm text-zinc-500">{item.name}</p>
        </div>
        <Link href="/admin/supplies" className="text-sm text-sky-300 no-underline hover:underline">
          ← Depot overview
        </Link>
      </div>
      <InventoryItemForm mode="edit" initialItem={item} jobOptions={jobOptions} />
    </div>
  );
}
