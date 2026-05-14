"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function requireSb() {
  const sb = createSupabaseAdminClient();
  if (!sb) return { ok: false as const, error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL and keys)." };
  return { ok: true as const, sb };
}

export async function createSupplyAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/supplies?err=${encodeURIComponent(gate.error)}`);

  const id = randomUUID();
  const payload = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "Misc."),
    quantity: Number(formData.get("quantity") ?? 0) || 0,
    unit: String(formData.get("unit") ?? "each"),
    storage_location: String(formData.get("storage_location") ?? "").trim(),
    reorder_level: Number(formData.get("reorder_level") ?? 0) || 0,
    cost: Number(formData.get("cost") ?? 0) || 0,
    vendor: String(formData.get("vendor") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    archived: false,
  };

  if (!payload.name) redirect(`/admin/supplies?err=${encodeURIComponent("Item name is required.")}`);

  const { error } = await gate.sb.from("supplies").insert(payload);
  if (error) redirect(`/admin/supplies?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/supplies");
  revalidatePath("/admin");
  redirect("/admin/supplies?saved=1");
}

export async function updateSupplyAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/supplies?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/supplies?err=${encodeURIComponent("Missing supply id.")}`);

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "Misc."),
    quantity: Number(formData.get("quantity") ?? 0) || 0,
    unit: String(formData.get("unit") ?? "each"),
    storage_location: String(formData.get("storage_location") ?? "").trim(),
    reorder_level: Number(formData.get("reorder_level") ?? 0) || 0,
    cost: Number(formData.get("cost") ?? 0) || 0,
    vendor: String(formData.get("vendor") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  if (!payload.name) redirect(`/admin/supplies?err=${encodeURIComponent("Item name is required.")}`);

  const { error } = await gate.sb.from("supplies").update(payload).eq("id", id);
  if (error) redirect(`/admin/supplies?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/supplies");
  revalidatePath("/admin");
  redirect("/admin/supplies?saved=1");
}

export async function archiveSupplyAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/supplies?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/supplies?err=${encodeURIComponent("Missing supply id.")}`);
  const { error } = await gate.sb.from("supplies").update({ archived: true }).eq("id", id);
  if (error) redirect(`/admin/supplies?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/supplies");
  revalidatePath("/admin");
  redirect("/admin/supplies?archived=1");
}
