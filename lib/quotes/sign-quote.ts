import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { generateSignedQuotePdf } from "@/lib/quotes/generate-signed-pdf";
import { SIGNED_DOCUMENTS_BUCKET } from "@/lib/quotes/constants";
import { getClientIpFromHeaders, getUserAgentFromHeaders } from "@/lib/quotes/request-meta";
import type { PublicQuote, PublicQuoteItem, QuoteDeclineResult, QuoteSignResult } from "@/lib/quotes/types";
import { createServiceClient } from "@/lib/supabase/service";

const signSchema = z.object({
  publicId: z.string().min(8).max(64),
  signedName: z.string().trim().min(2).max(120),
  signatureDataUrl: z.string().min(100).max(500_000),
  authorized: z.literal(true),
});

const declineSchema = z.object({
  publicId: z.string().min(8).max(64),
  reason: z.string().trim().max(2000).optional(),
});

function parseDataUrl(dataUrl: string): Uint8Array {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl);
  if (!match?.[1]) throw new Error("Invalid signature image");
  return Uint8Array.from(Buffer.from(match[1], "base64"));
}

async function fetchQuoteBundle(publicId: string) {
  const supabase = createServiceClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*, clients(name, email, phone, address)")
    .eq("public_id", publicId)
    .eq("archived", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!quote) return null;

  const { data: items, error: itemsError } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("sort_order");

  if (itemsError) throw new Error(itemsError.message);

  return { quote: quote as PublicQuote, items: (items ?? []) as PublicQuoteItem[] };
}

async function logQuoteEvent(
  quoteId: string,
  type: string,
  note?: string,
  metadata?: Record<string, unknown>,
) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("quote_events").insert({
    quote_id: quoteId,
    type,
    note: note ?? null,
    metadata: metadata ?? {},
  });
  if (error) {
    logPipelineError("quote event insert failed", error, { quoteId, step: "logQuoteEvent" });
  }
}

async function updateLinkedLeadOnSign(quoteId: string) {
  const supabase = createServiceClient();
  const { data: lead } = await supabase
    .from("quote_requests")
    .select("id, status")
    .eq("quote_id", quoteId)
    .eq("archived", false)
    .maybeSingle();

  if (!lead) return;

  const nextStatus = lead.status === "quoted" || lead.status === "contacted" ? "scheduled" : lead.status;
  if (nextStatus === lead.status) return;

  await supabase
    .from("quote_requests")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", lead.id);

  await supabase.from("quote_request_activity").insert({
    quote_request_id: lead.id,
    activity_type: "status_change",
    body: "Lead moved to scheduled after client signed estimate",
    metadata: { from: lead.status, to: nextStatus, quote_id: quoteId },
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${lead.id}`);
}

async function updateLinkedLeadOnDecline(quoteId: string) {
  const supabase = createServiceClient();
  const { data: lead } = await supabase
    .from("quote_requests")
    .select("id, status")
    .eq("quote_id", quoteId)
    .eq("archived", false)
    .maybeSingle();

  if (!lead || lead.status === "lost") return;

  await supabase
    .from("quote_requests")
    .update({ status: "lost", updated_at: new Date().toISOString() })
    .eq("id", lead.id);

  await supabase.from("quote_request_activity").insert({
    quote_request_id: lead.id,
    activity_type: "status_change",
    body: "Lead marked lost — client declined estimate",
    metadata: { from: lead.status, to: "lost", quote_id: quoteId },
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${lead.id}`);
}

export async function markQuoteViewed(publicId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("mark_quote_viewed", { p_public_id: publicId });
    if (error) {
      logPipelineError("mark_quote_viewed failed", error, { step: "markQuoteViewed", publicId });
      return false;
    }
    revalidatePath("/admin/quotes");
    return Boolean(data);
  } catch (error) {
    logPipelineError("markQuoteViewed exception", error, { publicId });
    return false;
  }
}

export async function signQuote(
  body: unknown,
  requestHeaders: Headers,
): Promise<QuoteSignResult> {
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Please complete all required fields.", code: "VALIDATION_ERROR" };
  }

  const { publicId, signedName, signatureDataUrl } = parsed.data;
  const clientIp = getClientIpFromHeaders(requestHeaders);
  const userAgent = getUserAgentFromHeaders(requestHeaders);

  try {
    const bundle = await fetchQuoteBundle(publicId);
    if (!bundle) {
      return { ok: false, error: "Quote not found.", code: "NOT_FOUND" };
    }

    const { quote, items } = bundle;
    if (quote.approval_status === "signed") {
      return { ok: false, error: "This estimate has already been signed.", code: "ALREADY_SIGNED" };
    }
    if (quote.approval_status === "declined") {
      return { ok: false, error: "This estimate was declined.", code: "DECLINED" };
    }

    const signatureBytes = parseDataUrl(signatureDataUrl);
    const signedAt = new Date();
    const supabase = createServiceClient();

    const sigPath = `quotes/${quote.id}/signature-${Date.now()}.png`;
    const { error: sigUploadError } = await supabase.storage
      .from(SIGNED_DOCUMENTS_BUCKET)
      .upload(sigPath, signatureBytes, { contentType: "image/png", upsert: false });

    if (sigUploadError) {
      logPipelineError("signature upload failed", sigUploadError, { quoteId: quote.id });
      return { ok: false, error: "Could not save signature. Please try again.", code: "UPLOAD_FAILED" };
    }

    const pdfBytes = await generateSignedQuotePdf({
      quote,
      items,
      signaturePngBytes: signatureBytes,
      signedName,
      signedAt,
    });

    const pdfPath = `quotes/${quote.id}/signed-${Date.now()}.pdf`;
    const { error: pdfUploadError } = await supabase.storage
      .from(SIGNED_DOCUMENTS_BUCKET)
      .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: false });

    if (pdfUploadError) {
      logPipelineError("signed pdf upload failed", pdfUploadError, { quoteId: quote.id });
      return { ok: false, error: "Could not generate signed document.", code: "PDF_FAILED" };
    }

    const signedAtIso = signedAt.toISOString();
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        approval_status: "signed",
        status: "accepted",
        signed_at: signedAtIso,
        signed_name: signedName,
        signed_ip: clientIp,
        client_signature_url: sigPath,
        signed_pdf_url: pdfPath,
      })
      .eq("id", quote.id)
      .in("approval_status", ["pending", "viewed"]);

    if (updateError) {
      logPipelineError("quote sign update failed", updateError, { quoteId: quote.id });
      return { ok: false, error: "Could not finalize signature.", code: "UPDATE_FAILED" };
    }

    await logQuoteEvent(quote.id, "signed", `Signed by ${signedName}`, {
      signed_name: signedName,
      signed_ip: clientIp,
      user_agent: userAgent,
      signature_path: sigPath,
      pdf_path: pdfPath,
    });

    await updateLinkedLeadOnSign(quote.id);

    logPipelineInfo("quote signed", { quoteId: quote.id, publicId, step: "signQuote" });
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${quote.id}`);
    revalidatePath(`/view/quote/${publicId}`);

    return { ok: true, signedAt: signedAtIso, pdfPath };
  } catch (error) {
    logPipelineError("signQuote exception", error, { publicId });
    return { ok: false, error: "Something went wrong. Please try again.", code: "SERVER_ERROR" };
  }
}

export async function declineQuote(
  body: unknown,
  requestHeaders: Headers,
): Promise<QuoteDeclineResult> {
  const parsed = declineSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request.", code: "VALIDATION_ERROR" };
  }

  const { publicId, reason } = parsed.data;
  const clientIp = getClientIpFromHeaders(requestHeaders);

  try {
    const bundle = await fetchQuoteBundle(publicId);
    if (!bundle) {
      return { ok: false, error: "Quote not found.", code: "NOT_FOUND" };
    }

    const { quote } = bundle;
    if (quote.approval_status === "signed") {
      return { ok: false, error: "This estimate is already signed.", code: "ALREADY_SIGNED" };
    }
    if (quote.approval_status === "declined") {
      return { ok: false, error: "This estimate was already declined.", code: "ALREADY_DECLINED" };
    }

    const declinedAt = new Date().toISOString();
    const supabase = createServiceClient();

    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        approval_status: "declined",
        status: "declined",
        declined_at: declinedAt,
        signed_ip: clientIp,
      })
      .eq("id", quote.id)
      .in("approval_status", ["pending", "viewed"]);

    if (updateError) {
      logPipelineError("quote decline update failed", updateError, { quoteId: quote.id });
      return { ok: false, error: "Could not record decline.", code: "UPDATE_FAILED" };
    }

    await logQuoteEvent(quote.id, "declined", reason ?? "Client declined estimate", {
      signed_ip: clientIp,
      reason: reason ?? null,
    });

    await updateLinkedLeadOnDecline(quote.id);

    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${quote.id}`);
    revalidatePath(`/view/quote/${publicId}`);

    return { ok: true, declinedAt };
  } catch (error) {
    logPipelineError("declineQuote exception", error, { publicId });
    return { ok: false, error: "Something went wrong.", code: "SERVER_ERROR" };
  }
}
