"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import { formatCurrency } from "@/lib/admin/format";
import { logPipelineInfo } from "@/lib/pipeline/logger";
import {
  calculateEstimateTotals,
  type QuoteEstimateInput,
} from "@/lib/platform/modules/estimates";
import { generateEstimatePdf } from "@/lib/quotes/generate-estimate-pdf";
import {
  buildQuoteEmailHtml,
  buildQuoteEmailSubject,
  buildQuoteMailtoHref,
  buildQuoteSmsBody,
  buildQuoteSmsHref,
  quotePublicUrl,
} from "@/lib/quotes/quote-share";
import { SIGNED_DOCUMENTS_BUCKET } from "@/lib/quotes/constants";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

function newPublicId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function saveQuoteEstimate(quoteId: string, input: QuoteEstimateInput) {
  const { supabase } = await requireOwnerRole();

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      client_id: input.client_id,
      service_type: input.service_type,
      job_address: input.job_address,
      notes: input.notes ?? null,
      internal_notes: input.internal_notes ?? null,
      terms: input.terms ?? null,
      expiration_date: input.expiration_date ?? null,
      deposit_required: input.deposit_required ?? false,
      deposit_amount: input.deposit_amount ?? 0,
      discount_type: input.discount_type ?? null,
      discount_value: input.discount_value ?? 0,
      tax_rate: input.tax_rate ?? 0,
      status: "draft",
    })
    .eq("id", quoteId);

  if (quoteError) throw new Error(quoteError.message);

  await supabase.from("quote_items").delete().eq("quote_id", quoteId);

  if (input.lines.length) {
    const { error: itemsError } = await supabase.from("quote_items").insert(
      input.lines.map((line, index) => ({
        quote_id: quoteId,
        description: line.description.trim(),
        quantity: line.quantity,
        unit_price: line.unit_price,
        sort_order: line.sort_order ?? index,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  const admin = createServiceClient();
  await admin.from("quote_events").insert({
    quote_id: quoteId,
    type: "updated",
    note: "Estimate updated",
  });

  revalidatePath(`/admin/quotes/${quoteId}`);
  revalidatePath(`/admin/quotes/${quoteId}/edit`);
  revalidatePath("/admin/quotes");
}

export async function createQuoteFromLead(leadId: string) {
  const { convertLeadToQuote } = await import("@/lib/admin/actions/leads");
  return convertLeadToQuote(leadId);
}

export async function generateQuotePdfDownload(quoteId: string): Promise<{ base64: string; filename: string }> {
  const { supabase } = await requireOwnerRole();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*, clients(name)")
    .eq("id", quoteId)
    .single();

  if (error || !quote) throw new Error(error?.message ?? "Quote not found");

  const { data: items } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .order("sort_order");

  const client =
    quote.clients && typeof quote.clients === "object" && !Array.isArray(quote.clients)
      ? (quote.clients as { name: string })
      : { name: "Client" };

  const pdfBytes = await generateEstimatePdf({
    quoteNumber: quote.quote_number,
    clientName: client.name,
    serviceType: quote.service_type,
    jobAddress: quote.job_address,
    expirationDate: quote.expiration_date,
    notes: quote.notes,
    terms: quote.terms,
    lines: (items ?? []).map((item, index) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      sort_order: item.sort_order ?? index,
    })),
    discount_type: quote.discount_type as "percent" | "fixed" | null,
    discount_value: Number(quote.discount_value ?? 0),
    tax_rate: Number(quote.tax_rate ?? 0),
  });

  const base64 = Buffer.from(pdfBytes).toString("base64");
  return { base64, filename: `${quote.quote_number}-estimate.pdf` };
}

export async function convertQuoteToJob(quoteId: string, schedule?: { job_date: string; start_time?: string }) {
  const { supabase } = await requireOwnerRole();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*, clients(name, phone, email)")
    .eq("id", quoteId)
    .single();

  if (error || !quote) throw new Error(error?.message ?? "Quote not found");

  const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", quoteId);
  const totals = calculateEstimateTotals(
    (items ?? []).map((item, index) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      sort_order: item.sort_order ?? index,
    })),
    {
      discount_type: quote.discount_type as "percent" | "fixed" | null,
      discount_value: Number(quote.discount_value ?? 0),
      tax_rate: Number(quote.tax_rate ?? 0),
    },
  );

  const jobDate = schedule?.job_date ?? new Date().toISOString().slice(0, 10);

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      client_id: quote.client_id,
      quote_id: quoteId,
      service_type: quote.service_type,
      address: quote.job_address,
      job_date: jobDate,
      start_time: schedule?.start_time ?? null,
      status: "Scheduled",
      revenue: totals.total,
      job_notes: quote.notes,
      internal_notes: quote.internal_notes,
    })
    .select("id")
    .single();

  if (jobError || !job) throw new Error(jobError?.message ?? "Could not create job");

  await supabase
    .from("quote_requests")
    .update({ status: "scheduled", updated_at: new Date().toISOString() })
    .eq("quote_id", quoteId);

  logPipelineInfo("quote converted to job", { step: "convertQuoteToJob", details: { quoteId, jobId: job.id } });

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/schedule");
  revalidatePath(`/admin/quotes/${quoteId}`);
  return { jobId: job.id };
}

export async function getQuoteShareLinks(quoteId: string) {
  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("public_id, quote_number, service_type, clients(name, email, phone)")
    .eq("id", quoteId)
    .single();

  if (!quote) throw new Error("Quote not found");

  const client =
    quote.clients && typeof quote.clients === "object" && !Array.isArray(quote.clients)
      ? (quote.clients as { name: string; email: string | null; phone: string | null })
      : null;

  const { data: items } = await supabase.from("quote_items").select("quantity, unit_price").eq("quote_id", quoteId);
  const total = (items ?? []).reduce((s, i) => s + Number(i.quantity) * Number(i.unit_price), 0);
  const publicUrl = quotePublicUrl(quote.public_id);

  return {
    publicUrl,
    smsHref: client?.phone
      ? buildQuoteSmsHref(client.phone, buildQuoteSmsBody(client.name, publicUrl))
      : null,
    mailtoHref: client?.email
      ? buildQuoteMailtoHref(
          client.email,
          buildQuoteEmailSubject(quote.quote_number),
          buildQuoteEmailHtml({
            clientName: client.name,
            quoteNumber: quote.quote_number,
            serviceType: quote.service_type,
            quoteLink: publicUrl,
            totalFormatted: total ? formatCurrency(total) : undefined,
          }),
        )
      : null,
  };
}

export async function storeQuotePdfInStorage(quoteId: string) {
  const { base64, filename } = await generateQuotePdfDownload(quoteId);
  const supabase = createServiceClient();
  const path = `quotes/${quoteId}/${filename}`;
  const buffer = Buffer.from(base64, "base64");

  const { error } = await supabase.storage.from(SIGNED_DOCUMENTS_BUCKET).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (error) throw new Error(error.message);
  return path;
}
