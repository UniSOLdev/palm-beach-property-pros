"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { nextInvoiceNumber, nextQuoteNumber } from "@/lib/admin/numbers";
import type { Quote, QuoteLineItem, QuoteStatus } from "@/lib/admin/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { ActionResult } from "./clients";

function requireSb() {
  const sb = createSupabaseAdminClient();
  if (!sb) return { ok: false as const, error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL and keys)." };
  return { ok: true as const, sb };
}

function flattenQuoteItems(quote: Quote): QuoteLineItem[] {
  return [...quote.lineItems, ...quote.optionalAddons];
}

export async function createDraftQuoteAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/quotes/new?err=${encodeURIComponent(gate.error)}`);

  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) redirect(`/admin/quotes/new?err=${encodeURIComponent("Client is required.")}`);

  const id = randomUUID();
  const publicId = `pub_${randomUUID()}`;
  const quoteNumber = await nextQuoteNumber();
  const exp = String(formData.get("expiration_date") ?? "");
  const expiration = exp || new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10);

  const quoteRow = {
    id,
    public_id: publicId,
    quote_number: quoteNumber,
    client_id: clientId,
    job_address: String(formData.get("job_address") ?? "").trim(),
    service_type: String(formData.get("service_type") ?? "Move-out Cleaning"),
    notes: String(formData.get("notes") ?? "").trim(),
    terms: String(formData.get("terms") ?? "").trim(),
    expiration_date: expiration,
    status: "Draft" as const,
    deposit_required: String(formData.get("deposit_required") ?? "") === "on",
    deposit_amount: Number(formData.get("deposit_amount") ?? 0) || 0,
    internal_notes: String(formData.get("internal_notes") ?? "").trim(),
    invoice_id: null as string | null,
    archived: false,
  };

  if (!quoteRow.job_address) redirect(`/admin/quotes/new?err=${encodeURIComponent("Job address is required.")}`);

  const { error } = await gate.sb.from("quotes").insert(quoteRow);
  if (error) redirect(`/admin/quotes/new?err=${encodeURIComponent(error.message)}`);

  const starter = String(formData.get("starter_line") ?? "").trim();
  const desc = starter || "Primary service";
  const { error: itemErr } = await gate.sb.from("quote_items").insert({
    id: randomUUID(),
    quote_id: id,
    description: desc,
    quantity: 1,
    unit_price: 0,
    is_addon: false,
    sort_order: 0,
  });
  if (itemErr) redirect(`/admin/quotes/new?err=${encodeURIComponent(itemErr.message)}`);

  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
  redirect(`/admin/quotes/${id}?saved=1`);
}

export async function saveQuoteAction(quote: Quote): Promise<ActionResult> {
  const gate = requireSb();
  if (!gate.ok) return gate;

  const row = {
    id: quote.id,
    public_id: quote.publicId,
    quote_number: quote.quoteNumber,
    client_id: quote.clientId,
    job_address: quote.jobAddress,
    service_type: quote.serviceType,
    notes: quote.notes,
    terms: quote.terms,
    expiration_date: quote.expirationDate,
    status: quote.status,
    deposit_required: quote.depositRequired,
    deposit_amount: quote.depositAmount,
    internal_notes: quote.internalNotes,
    invoice_id: quote.invoiceId ?? null,
    archived: false,
  };

  const { error } = await gate.sb.from("quotes").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  const { error: delErr } = await gate.sb.from("quote_items").delete().eq("quote_id", quote.id);
  if (delErr) return { ok: false, error: delErr.message };

  const flat = flattenQuoteItems(quote);
  const inserts = flat.map((li, idx) => ({
    id: li.id && li.id.length > 10 ? li.id : randomUUID(),
    quote_id: quote.id,
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unitPrice,
    is_addon: Boolean(li.isAddon),
    sort_order: idx,
  }));

  if (inserts.length) {
    const { error: insErr } = await gate.sb.from("quote_items").insert(inserts);
    if (insErr) return { ok: false, error: insErr.message };
  }

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quote.id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateQuoteStatusAction(quoteId: string, status: QuoteStatus): Promise<ActionResult> {
  const gate = requireSb();
  if (!gate.ok) return gate;
  const { error } = await gate.sb.from("quotes").update({ status }).eq("id", quoteId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function archiveQuoteAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/quotes?err=${encodeURIComponent(gate.error)}`);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect(`/admin/quotes?err=${encodeURIComponent("Missing quote id.")}`);
  const { error } = await gate.sb.from("quotes").update({ archived: true }).eq("id", id);
  if (error) redirect(`/admin/quotes/${id}?err=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin/quotes");
  revalidatePath("/admin");
  redirect("/admin/quotes?archived=1");
}

export async function convertQuoteToInvoiceAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/quotes?err=${encodeURIComponent(gate.error)}`);
  const quoteId = String(formData.get("quote_id") ?? "");
  if (!quoteId) redirect(`/admin/quotes?err=${encodeURIComponent("Missing quote id.")}`);

  const { data: quoteRow, error: qErr } = await gate.sb.from("quotes").select("*").eq("id", quoteId).maybeSingle();
  if (qErr || !quoteRow) redirect(`/admin/quotes/${quoteId}?err=${encodeURIComponent(qErr?.message ?? "Quote not found.")}`);

  const { data: items, error: iErr } = await gate.sb
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order", { ascending: true });
  if (iErr || !items?.length) {
    redirect(`/admin/quotes/${quoteId}?err=${encodeURIComponent(iErr?.message ?? "Quote has no line items.")}`);
  }

  const invoiceId = randomUUID();
  const publicId = `pub_${randomUUID()}`;
  const invoiceNumber = await nextInvoiceNumber();
  const due =
    String(formData.get("due_date") ?? "").trim() ||
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);

  const inv = {
    id: invoiceId,
    public_id: publicId,
    invoice_number: invoiceNumber,
    client_id: String((quoteRow as { client_id: string }).client_id),
    job_id: String(formData.get("job_id") ?? "").trim() || null,
    quote_id: quoteId,
    discount: 0,
    deposit_paid: Number((quoteRow as { deposit_amount?: number }).deposit_amount ?? 0) || 0,
    payment_status: "Unpaid",
    payment_method: null as string | null,
    paid_date: null as string | null,
    notes: String((quoteRow as { notes?: string }).notes ?? ""),
    terms: String((quoteRow as { terms?: string }).terms ?? ""),
    review_request_status: "Not sent",
    due_date: due,
    archived: false,
  };

  const { error: invErr } = await gate.sb.from("invoices").insert(inv);
  if (invErr) redirect(`/admin/quotes/${quoteId}?err=${encodeURIComponent(invErr.message)}`);

  const invoiceItems = (
    items as { description: string; quantity: number | string; unit_price: number | string; sort_order: number }[]
  ).map((it, idx) => ({
    id: randomUUID(),
    invoice_id: invoiceId,
    description: it.description,
    quantity: Number(it.quantity ?? 1) || 1,
    unit_price: Number(it.unit_price ?? 0) || 0,
    sort_order: idx,
  }));
  const { error: liErr } = await gate.sb.from("invoice_items").insert(invoiceItems);
  if (liErr) redirect(`/admin/quotes/${quoteId}?err=${encodeURIComponent(liErr.message)}`);

  const { error: uqErr } = await gate.sb
    .from("quotes")
    .update({ status: "Converted to Invoice", invoice_id: invoiceId })
    .eq("id", quoteId);
  if (uqErr) redirect(`/admin/quotes/${quoteId}?err=${encodeURIComponent(uqErr.message)}`);

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath("/admin/invoices");
  revalidatePath("/admin");
  redirect(`/admin/invoices/${invoiceId}?converted=1`);
}
