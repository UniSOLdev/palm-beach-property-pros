"use server";

import { revalidatePath } from "next/cache";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import {
  appendLeadPhotoPaths,
  tryUploadLeadPhotos,
} from "@/lib/site/actions/upload-lead-photos";
import {
  type QuoteRequestResult,
  publicErrorMessage,
} from "@/lib/site/quote-submit-types";
import {
  checkSupabaseEnv,
  createServerAnonClient,
  tryCreateServiceClient,
} from "@/lib/supabase/service";

export type { QuoteRequestResult } from "@/lib/site/quote-submit-types";

function clientTypeFromProperty(propertyType: string): string {
  if (
    propertyType.includes("Commercial") ||
    propertyType.includes("Office") ||
    propertyType.includes("HOA")
  ) {
    return "commercial";
  }
  return "residential";
}

function parseForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    service: String(formData.get("service") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    propertyType: String(formData.get("propertyType") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
    contact: String(formData.get("contact") ?? "Call").trim(),
    preferredDate: String(formData.get("preferredDate") ?? "").trim(),
    preferredTime: String(formData.get("preferredTime") ?? "").trim(),
    referrer: String(formData.get("referrer") ?? "").trim(),
    source: String(formData.get("source") ?? "website").trim() || "website",
  };
}

function classifyInsertError(message: string): QuoteRequestResult {
  if (
    message.includes("quote_requests") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  ) {
    return publicErrorMessage(
      "Quote form is temporarily unavailable. Please call us directly.",
      `Schema: ${message}`,
      "SCHEMA_MISSING",
    );
  }
  if (message.includes("submit_public_quote_request") && message.includes("does not exist")) {
    return publicErrorMessage(
      "Quote form is temporarily unavailable. Please call us directly.",
      `RPC missing — apply migration 20260524140000_quote_request_public_submit_rpc.sql: ${message}`,
      "SCHEMA_MISSING",
    );
  }
  return publicErrorMessage(
    "Unable to submit right now. Please call us directly.",
    message,
    "INSERT_FAILED",
  );
}

async function insertViaServiceRole(
  payload: ReturnType<typeof parseForm>,
): Promise<{ leadId: string } | QuoteRequestResult> {
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return publicErrorMessage(
      "Quote form is temporarily unavailable. Please call us directly.",
      "SUPABASE_SERVICE_ROLE_KEY missing — falling back to RPC",
      "MISSING_ENV",
    );
  }

  logPipelineInfo("quote insert via service role", { step: "insertViaServiceRole" });

  const { data: lead, error } = await supabase
    .from("quote_requests")
    .insert({
      name: payload.name,
      phone: payload.phone,
      email: payload.email || null,
      service_requested: payload.service,
      address: payload.address,
      city: payload.city || null,
      property_type: payload.propertyType || null,
      message: payload.message || null,
      preferred_contact: payload.contact,
      preferred_date: payload.preferredDate || null,
      preferred_time: payload.preferredTime || null,
      source: payload.source,
      referrer: payload.referrer || null,
      status: "new",
      photo_urls: [],
    })
    .select("id")
    .single();

  if (error || !lead) {
    logPipelineError("quote_requests insert failed (service role)", error ?? new Error("No row"), {
      step: "insertViaServiceRole",
      details: { code: error?.code, hint: error?.hint, message: error?.message },
    });
    return classifyInsertError(error?.message ?? "No row returned from insert");
  }

  const { error: activityError } = await supabase.from("quote_request_activity").insert({
    quote_request_id: lead.id,
    activity_type: "system",
    body: "Quote request submitted from website",
    metadata: {
      property_type: payload.propertyType || null,
      client_type: clientTypeFromProperty(payload.propertyType),
      via: "service_role",
    },
  });

  if (activityError) {
    logPipelineError("quote_request_activity insert failed (service role)", activityError, {
      step: "insertViaServiceRole",
      leadId: lead.id,
      details: { code: activityError.code, message: activityError.message },
    });
  }

  return { leadId: lead.id };
}

async function insertViaRpc(
  payload: ReturnType<typeof parseForm>,
): Promise<{ leadId: string } | QuoteRequestResult> {
  logPipelineInfo("quote insert via RPC fallback", { step: "insertViaRpc" });

  const supabase = createServerAnonClient();
  const { data, error } = await supabase.rpc("submit_public_quote_request", {
    p_name: payload.name,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_service_requested: payload.service,
    p_address: payload.address,
    p_city: payload.city || null,
    p_property_type: payload.propertyType || null,
    p_message: payload.message || null,
    p_preferred_contact: payload.contact,
    p_preferred_date: payload.preferredDate || null,
    p_preferred_time: payload.preferredTime || null,
    p_source: payload.source,
    p_referrer: payload.referrer || null,
  });

  if (error) {
    logPipelineError("submit_public_quote_request RPC failed", error, {
      step: "insertViaRpc",
      details: { code: error.code, hint: error.hint, message: error.message },
    });
    return classifyInsertError(error.message);
  }

  if (!data) {
    return publicErrorMessage(
      "Unable to submit right now. Please call us directly.",
      "RPC returned null id",
      "INSERT_FAILED",
    );
  }

  return { leadId: String(data) };
}

export async function submitQuoteRequest(formData: FormData): Promise<QuoteRequestResult> {
  const payload = parseForm(formData);

  logPipelineInfo("quote submit started", {
    step: "submitQuoteRequest",
    details: {
      service: payload.service,
      source: payload.source,
      hasPhotos: formData.getAll("photos").some((f) => f instanceof File && f.size > 0),
      env: checkSupabaseEnv(),
    },
  });

  if (!payload.name || !payload.phone || !payload.service || !payload.address) {
    return publicErrorMessage(
      "Please complete all required fields.",
      "Missing required field",
      "VALIDATION_ERROR",
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    logPipelineError("missing NEXT_PUBLIC_SUPABASE_URL", new Error("env"), { step: "submitQuoteRequest" });
    return publicErrorMessage(
      "Quote form is temporarily unavailable. Please call us directly.",
      "NEXT_PUBLIC_SUPABASE_URL is not set",
      "MISSING_ENV",
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    logPipelineError("missing anon key", new Error("env"), { step: "submitQuoteRequest" });
    return publicErrorMessage(
      "Quote form is temporarily unavailable. Please call us directly.",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set",
      "MISSING_ENV",
    );
  }

  try {
    let insertResult = await insertViaServiceRole(payload);

    if ("ok" in insertResult && insertResult.ok === false) {
      if (insertResult.code === "MISSING_ENV" || insertResult.code === "INSERT_FAILED") {
        logPipelineInfo("retrying quote insert via RPC", { step: "submitQuoteRequest" });
        insertResult = await insertViaRpc(payload);
      }
    }

    if ("ok" in insertResult && insertResult.ok === false) {
      return insertResult;
    }

    const { leadId } = insertResult as { leadId: string };
    logPipelineInfo("quote request created", { step: "submitQuoteRequest", leadId });

    const photoWarnings: string[] = [];
    const upload = await tryUploadLeadPhotos(leadId, formData);
    photoWarnings.push(...upload.warnings);

    if (upload.paths.length) {
      try {
        await appendLeadPhotoPaths(leadId, upload.paths);
        logPipelineInfo("lead photos attached", {
          step: "submitQuoteRequest",
          leadId,
          details: { count: upload.paths.length },
        });
      } catch (appendError) {
        logPipelineError("lead photo paths append failed (lead saved)", appendError, {
          step: "submitQuoteRequest",
          leadId,
        });
        photoWarnings.push("Photos uploaded but could not be linked to your request.");
      }
    }

    if (photoWarnings.length) {
      logPipelineInfo("quote submit photo warnings", {
        step: "submitQuoteRequest",
        leadId,
        details: { warnings: photoWarnings },
      });
    }

    revalidatePath("/admin/leads");
    return { ok: true, leadId, ...(photoWarnings.length ? { photoWarnings } : {}) };
  } catch (error) {
    logPipelineError("quote request submit exception", error, { step: "submitQuoteRequest" });
    return publicErrorMessage(
      "Unable to submit right now. Please call us directly.",
      error instanceof Error ? error.message : String(error),
      "SERVICE_UNAVAILABLE",
    );
  }
}
