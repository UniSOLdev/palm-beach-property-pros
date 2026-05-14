"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { nextInvoiceNumber } from "@/lib/admin/numbers";
import type { Invoice } from "@/lib/admin/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { ActionResult } from "./clients";

function requireSb() {
  const sb = createSupabaseAdminClient();
  if (!sb) return { ok: false as const, error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL and keys)." };
  return { ok: true as const, sb };
}

export async function createDraftInvoiceAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/invoices/new?err=${encodeURIComponent(gate.error)}`);

  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) redirect(`/admin/invoices/new?err=${encodeURIComponent("Client is required.")}`);

  const id = randomUUID();
  const publicId = `pub_${randomUUID()}`;
  const invoiceNumber = await nextInvoiceNumber();
  const due =
    String(formData.get("due_date") ?? "").trim() ||
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const row = {
    id,
    public_id: publicId,
    invoice_number: invoiceNumber,
    client_id: clientId,
    job_id: String(formData.get("job_id") ?? "").trim() || null,
    quote_id: String(formData.get("quote_id") ?? "").trim() || null,
    discount: Number(formData.get("discount") ?? 0) || 0,
    deposit_paid: Number(formData.get("deposit_paid") ?? 0) || 0,
    payment_status: "Unpaid",
    payment_method: String(formData.get("payment_method") ?? "").trim() || null,
    paid_date: null as string | null,
    notes: String(formData.get("notes") ?? "").trim(),
    terms: String(formData.get("terms") ?? "").trim(),
    review_request_status: "Not sent",
    due_date: due,
    archived: false,
  };

  const { error } = await gate.sb.from("invoices").insert(row);
  if (error) redirect(`/admin/invoices/new?err=${encodeURIComponent(error.message)}`);

  const { error: liErr } = await gate.sb.from("invoice_items").insert({
    id: randomUUID(),
    invoice_id: id,
    description: String(formData.get("line_description") ?? "Service"),
    quantity: 1,
    unit_price: Number(formData.get("line_unit_price") ?? 0) || 0,
    sort_order: 0,
  });
  if (liErr) redirect(`/admin/invoices/new?err=${encodeURIComponent(liErr.message)}`);

  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  redirect(`/admin/invoices/${id}?saved=1`);
}

export async function saveInvoiceAction(invoice: Invoice): Promise<ActionResult> {
  const gate = requireSb();
  if (!gate.ok) return gate;

  const row = {
    id: invoice.id,
    public_id: invoice.publicId,
    invoice_number: invoice.invoiceNumber,
    client_id: invoice.clientId,
    job_id: invoice.jobId,
    quote_id: invoice.quoteId,
    discount: invoice.discount,
    deposit_paid: invoice.depositPaid,
    payment_status: invoice.paymentStatus,
    payment_method: invoice.paymentMethod,
    paid_date: invoice.paidDate,
    notes: invoice.notes,
    terms: invoice.terms,
    review_request_status: invoice.reviewRequestStatus,
    due_date: invoice.dueDate,
    archived: false,
  };

  const { error } = await gate.sb.from("invoices").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  const { error: delErr } = await gate.sb.from("invoice_items").delete().eq("invoice_id", invoice.id);
  if (delErr) return { ok: false, error: delErr.message };

  const inserts = invoice.lineItems.map((li, idx) => ({
    id: li.id && li.id.length > 10 ? li.id : randomUUID(),
    invoice_id: invoice.id,
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unitPrice,
    sort_order: idx,
  }));
  if (inserts.length) {
    const { error: insErr } = await gate.sb.from("invoice_items").insert(inserts);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${invoice.id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function archiveInvoiceAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/invoices?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/invoices?err=${encodeURIComponent("Missing invoice id.")}`);
  const { error } = await gate.sb.from("invoices").update({ archived: true }).eq("id", id);
  if (error) redirect(`/admin/invoices/${id}?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  redirect("/admin/invoices?archived=1");
}

export async function markInvoiceReviewSentAction(formData: FormData): Promise<ActionResult> {
  const gate = requireSb();
  if (!gate.ok) return gate;
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing invoice id." };
  const { error } = await gate.sb.from("invoices").update({ review_request_status: "Sent" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/invoices/${id}`);
  return { ok: true };
}
