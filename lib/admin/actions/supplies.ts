"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SaveSupplyInput, SupplyJobUsageRow, SupplyRow } from "@/lib/admin/types-supplies";

function revalidateSupplies() {
  revalidatePath("/admin/supplies");
}

export async function listSupplies(): Promise<SupplyRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("*")
    .eq("archived", false)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as SupplyRow[];
}

export async function listSupplyUsage(supplyId: string): Promise<(SupplyJobUsageRow & { job_label?: string })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("supply_job_usage")
    .select("*, jobs(service_type, address)")
    .eq("supply_id", supplyId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const job = row.jobs as { service_type?: string; address?: string } | null;
    const { jobs: _j, ...usage } = row;
    return {
      ...(usage as SupplyJobUsageRow),
      job_label: job ? `${job.service_type} · ${job.address}` : undefined,
    };
  });
}

export async function listJobsForSupplyUsage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("id, service_type, address")
    .eq("archived", false)
    .order("job_date", { ascending: false })
    .limit(80);
  return (data ?? []).map((j) => ({ id: j.id, label: `${j.service_type} · ${j.address}` }));
}

export async function saveSupply(input: SaveSupplyInput) {
  const supabase = await createClient();
  const row = {
    name: input.name.trim(),
    category: input.category,
    quantity: input.quantity,
    unit: input.unit,
    storage_location: input.storage_location?.trim() || null,
    reorder_level: input.reorder_level,
    cost: input.cost,
    vendor: input.vendor?.trim() || null,
    notes: input.notes?.trim() || null,
    is_reusable: input.is_reusable ?? false,
    expense_id: input.expense_id ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("supplies").update(row).eq("id", input.id);
    if (error) throw new Error(error.message);
    revalidateSupplies();
    return input.id;
  }

  const { data, error } = await supabase.from("supplies").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  revalidateSupplies();
  return data.id as string;
}

export async function archiveSupply(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("supplies")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSupplies();
}

export async function adjustSupplyQuantity(id: string, delta: number) {
  const supabase = await createClient();
  const { data } = await supabase.from("supplies").select("quantity").eq("id", id).single();
  if (!data) throw new Error("Supply not found");
  const next = Math.max(0, Number(data.quantity) + delta);
  const { error } = await supabase
    .from("supplies")
    .update({ quantity: next, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateSupplies();
  return next;
}

export async function logSupplyJobUsage(input: {
  supply_id: string;
  job_id: string;
  quantity_used: number;
  notes?: string | null;
  deduct_inventory?: boolean;
}) {
  const supabase = await createClient();
  const qty = Math.max(0.01, input.quantity_used);

  const { error: usageErr } = await supabase.from("supply_job_usage").insert({
    supply_id: input.supply_id,
    job_id: input.job_id,
    quantity_used: qty,
    notes: input.notes?.trim() || null,
  });
  if (usageErr) throw new Error(usageErr.message);

  if (input.deduct_inventory !== false) {
    const { data: supply } = await supabase.from("supplies").select("quantity, is_reusable").eq("id", input.supply_id).single();
    if (supply && !supply.is_reusable) {
      const next = Math.max(0, Number(supply.quantity) - qty);
      await supabase
        .from("supplies")
        .update({ quantity: next, updated_at: new Date().toISOString() })
        .eq("id", input.supply_id);
    }
  }

  revalidateSupplies();
  revalidatePath(`/admin/jobs/${input.job_id}`);
}
