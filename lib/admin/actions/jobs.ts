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

function parseAssignedCrew(formData: FormData): string[] {
  const fromBoxes = formData.getAll("assigned_crew").map(String).filter(Boolean);
  if (fromBoxes.length) return fromBoxes;
  const assignedRaw = String(formData.get("assigned_crew_ids") ?? "").trim();
  return assignedRaw
    ? assignedRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

export async function createJobAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/jobs/new?err=${encodeURIComponent(gate.error)}`);

  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) redirect(`/admin/jobs/new?err=${encodeURIComponent("Client is required.")}`);

  const id = randomUUID();
  const assigned = parseAssignedCrew(formData);

  const payload = {
    id,
    client_id: clientId,
    service_type: String(formData.get("service_type") ?? "Other"),
    address: String(formData.get("address") ?? "").trim(),
    job_date: String(formData.get("job_date") ?? new Date().toISOString().slice(0, 10)),
    start_time: String(formData.get("start_time") ?? "").trim(),
    end_time: String(formData.get("end_time") ?? "").trim(),
    status: String(formData.get("status") ?? "Scheduled"),
    assigned_crew_ids: assigned,
    job_notes: String(formData.get("job_notes") ?? "").trim(),
    internal_notes: String(formData.get("internal_notes") ?? "").trim(),
    before_photo_urls: [] as string[],
    after_photo_urls: [] as string[],
    quote_id: String(formData.get("quote_id") ?? "").trim() || null,
    invoice_id: String(formData.get("invoice_id") ?? "").trim() || null,
    revenue: Number(formData.get("revenue") ?? 0) || 0,
    job_expense_total: 0,
    payment_method: String(formData.get("payment_method") ?? "").trim() || null,
    review_requested: String(formData.get("review_requested") ?? "") === "on",
    referral_source: String(formData.get("referral_source") ?? "").trim(),
    archived: false,
  };

  if (!payload.address) redirect(`/admin/jobs/new?err=${encodeURIComponent("Address is required.")}`);

  const { error } = await gate.sb.from("jobs").insert(payload);
  if (error) redirect(`/admin/jobs/new?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
  redirect(`/admin/jobs/${id}?saved=1`);
}

export async function updateJobAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/jobs?err=${encodeURIComponent(gate.error)}`);

  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/jobs?err=${encodeURIComponent("Missing job id.")}`);

  const assigned = parseAssignedCrew(formData);

  const payload = {
    client_id: String(formData.get("client_id") ?? ""),
    service_type: String(formData.get("service_type") ?? "Other"),
    address: String(formData.get("address") ?? "").trim(),
    job_date: String(formData.get("job_date") ?? new Date().toISOString().slice(0, 10)),
    start_time: String(formData.get("start_time") ?? "").trim(),
    end_time: String(formData.get("end_time") ?? "").trim(),
    status: String(formData.get("status") ?? "Scheduled"),
    assigned_crew_ids: assigned,
    job_notes: String(formData.get("job_notes") ?? "").trim(),
    internal_notes: String(formData.get("internal_notes") ?? "").trim(),
    quote_id: String(formData.get("quote_id") ?? "").trim() || null,
    invoice_id: String(formData.get("invoice_id") ?? "").trim() || null,
    revenue: Number(formData.get("revenue") ?? 0) || 0,
    payment_method: String(formData.get("payment_method") ?? "").trim() || null,
    review_requested: String(formData.get("review_requested") ?? "") === "on",
    referral_source: String(formData.get("referral_source") ?? "").trim(),
  };

  if (!payload.client_id) redirect(`/admin/jobs/${id}?err=${encodeURIComponent("Client is required.")}`);
  if (!payload.address) redirect(`/admin/jobs/${id}?err=${encodeURIComponent("Address is required.")}`);

  const { error } = await gate.sb.from("jobs").update(payload).eq("id", id);
  if (error) redirect(`/admin/jobs/${id}?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/jobs/${id}?saved=1`);
}

export async function archiveJobAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/jobs?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/jobs?err=${encodeURIComponent("Missing job id.")}`);
  const { error } = await gate.sb.from("jobs").update({ archived: true }).eq("id", id);
  if (error) redirect(`/admin/jobs/${id}?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/jobs");
  revalidatePath("/admin");
  redirect("/admin/jobs?archived=1");
}
