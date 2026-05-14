"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { ActionResult } from "./clients";

function requireSb() {
  const sb = createSupabaseAdminClient();
  if (!sb) return { ok: false as const, error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL and keys)." };
  return { ok: true as const, sb };
}

export async function createCrewMemberAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/crew?err=${encodeURIComponent(gate.error)}`);

  const id = randomUUID();
  const payload = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    default_pay_rate: Number(formData.get("default_pay_rate") ?? 0) || 0,
    pay_rate_unit: String(formData.get("pay_rate_unit") ?? "hour"),
    notes: String(formData.get("notes") ?? "").trim(),
    archived: false,
  };

  if (!payload.name) redirect(`/admin/crew?err=${encodeURIComponent("Name is required.")}`);

  const { error } = await gate.sb.from("crew_members").insert(payload);
  if (error) redirect(`/admin/crew?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/crew");
  revalidatePath("/admin");
  redirect("/admin/crew?saved=1");
}

export async function updateCrewMemberAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/crew?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/crew?err=${encodeURIComponent("Missing crew id.")}`);

  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    default_pay_rate: Number(formData.get("default_pay_rate") ?? 0) || 0,
    pay_rate_unit: String(formData.get("pay_rate_unit") ?? "hour"),
    notes: String(formData.get("notes") ?? "").trim(),
  };

  if (!payload.name) redirect(`/admin/crew?err=${encodeURIComponent("Name is required.")}`);

  const { error } = await gate.sb.from("crew_members").update(payload).eq("id", id);
  if (error) redirect(`/admin/crew?err=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/crew");
  revalidatePath("/admin");
  redirect("/admin/crew?saved=1");
}

export async function archiveCrewMemberAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/crew?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/crew?err=${encodeURIComponent("Missing crew id.")}`);
  const { error } = await gate.sb.from("crew_members").update({ archived: true }).eq("id", id);
  if (error) redirect(`/admin/crew?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/crew");
  revalidatePath("/admin");
  redirect("/admin/crew?archived=1");
}

export async function saveCrewPayoutAction(formData: FormData): Promise<ActionResult> {
  const gate = requireSb();
  if (!gate.ok) return gate;

  const jobId = String(formData.get("job_id") ?? "");
  if (!jobId) return { ok: false, error: "Job is required." };

  const crewIds = formData.getAll("crew_member_id").map(String).filter(Boolean);
  if (!crewIds.length) return { ok: false, error: "Select at least one crew member." };

  const payType = String(formData.get("pay_type") ?? "hourly");
  const hours = formData.get("hours") ? Number(formData.get("hours")) : null;
  const percent = formData.get("percent") ? Number(formData.get("percent")) : null;
  const flatAmount = formData.get("flat_amount") ? Number(formData.get("flat_amount")) : null;
  const calculatedTotal = Number(formData.get("calculated_total") ?? 0) || 0;

  const payload = {
    id: randomUUID(),
    job_id: jobId,
    crew_member_ids: crewIds,
    pay_type: payType,
    hours,
    percent,
    flat_amount: flatAmount,
    calculated_total: calculatedTotal,
  };

  const { error } = await gate.sb.from("crew_payouts").insert(payload);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/crew");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { ok: true };
}
