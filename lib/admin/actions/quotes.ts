"use server";

import { revalidatePath } from "next/cache";
import { logAdminError } from "@/lib/admin/logger";
import { logPipelineError } from "@/lib/pipeline/logger";
import { SIGNED_DOCUMENTS_BUCKET } from "@/lib/quotes/constants";
import {
  buildQuoteEmailHtml,
  buildQuoteEmailSubject,
  buildQuoteMailtoHref,
  buildQuoteSmsBody,
  buildQuoteSmsHref,
  quotePublicUrl,
} from "@/lib/quotes/quote-share";
import { formatCurrency } from "@/lib/admin/format";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminQuoteRow = {
  id: string;
  public_id: string;
  quote_number: string;
  client_id: string;
  service_type: string;
  job_address: string;
  status: string;
  approval_status: string;
  viewed_at: string | null;
  sent_at: string | null;
  signed_at: string | null;
  signed_name: string | null;
  declined_at: string | null;
  client_signature_url: string | null;
  signed_pdf_url: string | null;
  notes: string | null;
  terms: string | null;
  created_at: string;
  clients?: { name: string; email: string | null; phone: string | null } | null;
};

export type QuoteEventRow = {
  id: string;
  quote_id: string;
  type: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function signedStorageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from(SIGNED_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) {
    logPipelineError("signed doc url failed", error ?? new Error("no url"), { details: { path } });
    return null;
  }
  return data.signedUrl;
}

export async function getQuoteById(id: string): Promise<{
  quote: AdminQuoteRow;
  items: Array<{ id: string; description: string; quantity: number; unit_price: number }>;
  events: QuoteEventRow[];
  signaturePreviewUrl: string | null;
  pdfDownloadUrl: string | null;
  leadId: string | null;
}> {
  const supabase = await createClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*, clients(name, email, phone)")
    .eq("id", id)
    .eq("archived", false)
    .maybeSingle();

  if (error) {
    logAdminError("quote detail failed", error, { route: `/admin/quotes/${id}` });
    throw new Error(error.message);
  }
  if (!quote) throw new Error("Quote not found");

  const [{ data: items }, { data: events }, { data: lead }] = await Promise.all([
    supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order"),
    supabase.from("quote_events").select("*").eq("quote_id", id).order("created_at", { ascending: false }),
    supabase
      .from("quote_requests")
      .select("id")
      .eq("quote_id", id)
      .eq("archived", false)
      .maybeSingle(),
  ]);

  const [signaturePreviewUrl, pdfDownloadUrl] = await Promise.all([
    signedStorageUrl(quote.client_signature_url),
    signedStorageUrl(quote.signed_pdf_url),
  ]);

  return {
    quote: quote as AdminQuoteRow,
    items: items ?? [],
    events: (events ?? []) as QuoteEventRow[],
    signaturePreviewUrl,
    pdfDownloadUrl,
    leadId: lead?.id ?? null,
  };
}

export async function markQuoteSent(quoteId: string) {
  const supabase = await createClient();
  const sentAt = new Date().toISOString();

  const { data: quote, error } = await supabase
    .from("quotes")
    .update({ sent_at: sentAt, status: "sent" })
    .eq("id", quoteId)
    .select("id, public_id, quote_number, service_type, clients(name, email, phone)")
    .single();

  if (error) throw new Error(error.message);

  const admin = createServiceClient();
  await admin.from("quote_events").insert({
    quote_id: quoteId,
    type: "sent",
    note: "Quote link sent to client",
  });

  const clientRaw = quote.clients;
  const client =
    clientRaw && typeof clientRaw === "object" && !Array.isArray(clientRaw)
      ? (clientRaw as { name: string; email: string | null; phone: string | null })
      : null;
  const publicUrl = quotePublicUrl(quote.public_id);
  const subtotalRes = await supabase.from("quote_items").select("quantity, unit_price").eq("quote_id", quoteId);
  const total = (subtotalRes.data ?? []).reduce(
    (s, i) => s + Number(i.quantity) * Number(i.unit_price),
    0,
  );

  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/quotes/${quoteId}`);

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

export async function copyQuotePublicLink(quoteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select("public_id").eq("id", quoteId).single();
  if (error || !data) throw new Error(error?.message ?? "Quote not found");
  return quotePublicUrl(data.public_id);
}
