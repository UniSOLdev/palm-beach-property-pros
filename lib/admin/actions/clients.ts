"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export type ActionResult = { ok: true } | { ok: false; error: string };

function requireSb() {
  const sb = createSupabaseAdminClient();
  if (!sb) return { ok: false as const, error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL and keys)." };
  return { ok: true as const, sb };
}

export async function createClientAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/clients/new?err=${encodeURIComponent(gate.error)}`);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect(`/admin/clients/new?err=${encodeURIComponent("Name is required.")}`);

  const payload = {
    id: randomUUID(),
    name,
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    client_type: String(formData.get("client_type") ?? "Residential"),
    referral_source: String(formData.get("referral_source") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    follow_up_date: String(formData.get("follow_up_date") ?? "").trim() || null,
    review_status: String(formData.get("review_status") ?? "Not sent"),
    archived: false,
  };

  const { error } = await gate.sb.from("clients").insert(payload);
  if (error) redirect(`/admin/clients/new?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  redirect(`/admin/clients/${payload.id}?saved=1`);
}

export async function updateClientAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/clients?err=${encodeURIComponent(gate.error)}`);

  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/clients?err=${encodeURIComponent("Missing client id.")}`);

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    client_type: String(formData.get("client_type") ?? "Residential"),
    referral_source: String(formData.get("referral_source") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
    follow_up_date: String(formData.get("follow_up_date") ?? "").trim() || null,
    review_status: String(formData.get("review_status") ?? "Not sent"),
  };

  if (!payload.name) redirect(`/admin/clients/${id}?err=${encodeURIComponent("Name is required.")}`);

  const { error } = await gate.sb.from("clients").update(payload).eq("id", id);
  if (error) redirect(`/admin/clients/${id}?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/clients/${id}?saved=1`);
}

export async function archiveClientAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/clients?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/clients?err=${encodeURIComponent("Missing client id.")}`);
  const { error } = await gate.sb.from("clients").update({ archived: true }).eq("id", id);
  if (error) redirect(`/admin/clients/${id}?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
  redirect("/admin/clients?archived=1");
}

export async function assertSupabaseForForms(): Promise<ActionResult> {
  if (!isSupabaseServerConfigured()) {
    return { ok: false, error: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and keys to use forms." };
  }
  return { ok: true };
}
