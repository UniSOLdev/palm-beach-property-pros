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

async function resolveServiceTypeForExpense(sb: NonNullable<ReturnType<typeof createSupabaseAdminClient>>, jobId: string | null, manual: string | null) {
  if (manual) return manual;
  if (!jobId) return null;
  const { data } = await sb.from("jobs").select("service_type").eq("id", jobId).maybeSingle();
  const st = data && typeof (data as { service_type?: unknown }).service_type === "string" ? String((data as { service_type: string }).service_type).trim() : "";
  return st || null;
}

export async function createExpenseAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/expenses/new?err=${encodeURIComponent(gate.error)}`);

  const id = randomUUID();
  const jobId = String(formData.get("job_id") ?? "").trim() || null;
  const manualService = String(formData.get("service_type") ?? "").trim() || null;
  const serviceType = await resolveServiceTypeForExpense(gate.sb, jobId, manualService);

  const payload = {
    id,
    expense_date: String(formData.get("expense_date") ?? new Date().toISOString().slice(0, 10)),
    category: String(formData.get("category") ?? "Miscellaneous"),
    vendor: String(formData.get("vendor") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    amount: Number(formData.get("amount") ?? 0) || 0,
    payment_method: String(formData.get("payment_method") ?? "Other"),
    job_id: jobId,
    service_type: serviceType,
    receipt_url: String(formData.get("receipt_url") ?? "").trim() || null,
    expense_type: String(formData.get("expense_type") ?? "Overhead"),
    reimbursable: String(formData.get("reimbursable") ?? "") === "on",
    reimbursed: String(formData.get("reimbursed") ?? "") === "on",
    notes: String(formData.get("notes") ?? "").trim(),
    archived: false,
  };

  if (!payload.vendor) redirect(`/admin/expenses/new?err=${encodeURIComponent("Vendor is required.")}`);
  if (!payload.description) redirect(`/admin/expenses/new?err=${encodeURIComponent("Description is required.")}`);

  const { error } = await gate.sb.from("expenses").insert(payload);
  if (error) redirect(`/admin/expenses/new?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  redirect("/admin/expenses?saved=1");
}

export async function updateExpenseAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/expenses?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/expenses?err=${encodeURIComponent("Missing expense id.")}`);

  const jobId = String(formData.get("job_id") ?? "").trim() || null;
  const manualService = String(formData.get("service_type") ?? "").trim() || null;
  const serviceType = await resolveServiceTypeForExpense(gate.sb, jobId, manualService);

  const payload = {
    expense_date: String(formData.get("expense_date") ?? new Date().toISOString().slice(0, 10)),
    category: String(formData.get("category") ?? "Miscellaneous"),
    vendor: String(formData.get("vendor") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    amount: Number(formData.get("amount") ?? 0) || 0,
    payment_method: String(formData.get("payment_method") ?? "Other"),
    job_id: jobId,
    service_type: serviceType,
    receipt_url: String(formData.get("receipt_url") ?? "").trim() || null,
    expense_type: String(formData.get("expense_type") ?? "Overhead"),
    reimbursable: String(formData.get("reimbursable") ?? "") === "on",
    reimbursed: String(formData.get("reimbursed") ?? "") === "on",
    notes: String(formData.get("notes") ?? "").trim(),
  };

  if (!payload.vendor) redirect(`/admin/expenses/${id}?err=${encodeURIComponent("Vendor is required.")}`);
  if (!payload.description) redirect(`/admin/expenses/${id}?err=${encodeURIComponent("Description is required.")}`);

  const { error } = await gate.sb.from("expenses").update(payload).eq("id", id);
  if (error) redirect(`/admin/expenses/${id}?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/expenses");
  revalidatePath(`/admin/expenses/${id}`);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  redirect(`/admin/expenses/${id}?saved=1`);
}

export async function archiveExpenseAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/expenses?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/expenses?err=${encodeURIComponent("Missing expense id.")}`);
  const { error } = await gate.sb.from("expenses").update({ archived: true }).eq("id", id);
  if (error) redirect(`/admin/expenses?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  redirect("/admin/expenses?archived=1");
}
