"use server";

import { revalidatePath } from "next/cache";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import {
  appendLeadPhotoPaths,
  tryUploadLeadPhotos,
} from "@/lib/site/actions/upload-lead-photos";
import {
  type QuoteRequestResult,
  type QuoteRequestFailure,
  QUOTE_ERRORS,
  quoteSubmitError,
} from "@/lib/site/quote-submit-types";
import {
  checkSupabaseEnv,
  createServerAnonClient,
  tryCreateServiceClient,
} from "@/lib/supabase/service";

export type { QuoteRequestResult } from "@/lib/site/quote-submit-types";

type Payload = ReturnType<typeof parseForm>;
type InsertOk = { leadId: string };
type InsertResult = InsertOk | QuoteRequestResult;

type InsertFailure = QuoteRequestFailure;

function isFailure(result: InsertResult): result is InsertFailure {
  return "ok" in result && result.ok === false;
}

function parseForm(formData: FormData) {
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
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
    preferredDate: preferredDate || null,
    preferredTime: String(formData.get("preferredTime") ?? "").trim() || null,
    referrer: String(formData.get("referrer") ?? "").trim(),
    source: String(formData.get("source") ?? "website").trim() || "website",
  };
}

function rowFromPayload(payload: Payload) {
  return {
    name: payload.name,
    phone: payload.phone,
    email: payload.email || null,
    service_requested: payload.service,
    address: payload.address,
    city: payload.city || null,
    property_type: payload.propertyType || null,
    message: payload.message || null,
    preferred_contact: payload.contact,
    preferred_date: payload.preferredDate,
    preferred_time: payload.preferredTime,
    source: payload.source,
    referrer: payload.referrer || null,
    status: "new" as const,
    photo_urls: [] as string[],
  };
}

function classifyDbError(message: string, code?: string): QuoteRequestResult {
  const lower = message.toLowerCase();
  if (
    lower.includes("quote_requests") &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  ) {
    return quoteSubmitError(QUOTE_ERRORS.schema, message, "SCHEMA_MISSING");
  }
  if (lower.includes("submit_public_quote_request") && lower.includes("does not exist")) {
    return quoteSubmitError(
      QUOTE_ERRORS.schema,
      `RPC missing: ${message}`,
      "SCHEMA_MISSING",
    );
  }
  if (code === "42501" || lower.includes("permission denied") || lower.includes("row-level security")) {
    return quoteSubmitError(QUOTE_ERRORS.insert, `RLS: ${message}`, "INSERT_FAILED");
  }
  return quoteSubmitError(QUOTE_ERRORS.insert, message, "INSERT_FAILED");
}

async function insertViaRpc(payload: Payload): Promise<InsertResult> {
  logPipelineInfo("quote insert attempt: RPC", { step: "insertViaRpc" });
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
    p_preferred_date: payload.preferredDate,
    p_preferred_time: payload.preferredTime,
    p_source: payload.source,
    p_referrer: payload.referrer || null,
  });

  if (error) {
    logPipelineError("RPC insert failed", error, {
      step: "insertViaRpc",
      details: { code: error.code, hint: error.hint, message: error.message },
    });
    return classifyDbError(error.message, error.code);
  }
  if (!data) {
    return quoteSubmitError(QUOTE_ERRORS.insert, "RPC returned null id", "INSERT_FAILED");
  }
  logPipelineInfo("quote insert success: RPC", { step: "insertViaRpc", leadId: String(data) });
  return { leadId: String(data) };
}

async function insertViaServiceRole(payload: Payload): Promise<InsertResult> {
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    logPipelineInfo("service role unavailable, skipping", { step: "insertViaServiceRole" });
    return quoteSubmitError(
      QUOTE_ERRORS.insert,
      "SUPABASE_SERVICE_ROLE_KEY not set",
      "MISSING_ENV",
    );
  }

  logPipelineInfo("quote insert attempt: service role", { step: "insertViaServiceRole" });
  const { data: lead, error } = await supabase
    .from("quote_requests")
    .insert(rowFromPayload(payload))
    .select("id")
    .single();

  if (error || !lead) {
    logPipelineError("service role insert failed", error ?? new Error("No row"), {
      step: "insertViaServiceRole",
      details: { code: error?.code, message: error?.message },
    });
    return classifyDbError(error?.message ?? "No row returned", error?.code);
  }

  logPipelineInfo("quote insert success: service role", {
    step: "insertViaServiceRole",
    leadId: lead.id,
  });
  return { leadId: lead.id };
}

async function insertViaAnonDirect(payload: Payload): Promise<InsertResult> {
  logPipelineInfo("quote insert attempt: anon direct", { step: "insertViaAnonDirect" });
  const supabase = createServerAnonClient();
  const { data: lead, error } = await supabase
    .from("quote_requests")
    .insert(rowFromPayload(payload))
    .select("id")
    .single();

  if (error || !lead) {
    logPipelineError("anon direct insert failed", error ?? new Error("No row"), {
      step: "insertViaAnonDirect",
      details: { code: error?.code, message: error?.message },
    });
    return classifyDbError(error?.message ?? "No row returned", error?.code);
  }

  logPipelineInfo("quote insert success: anon direct", {
    step: "insertViaAnonDirect",
    leadId: lead.id,
  });
  return { leadId: lead.id };
}

async function insertLead(payload: Payload): Promise<InsertOk | QuoteRequestResult> {
  const strategies: Array<{ name: string; fn: () => Promise<InsertResult> }> = [
    { name: "rpc", fn: () => insertViaRpc(payload) },
    { name: "service_role", fn: () => insertViaServiceRole(payload) },
    { name: "anon_direct", fn: () => insertViaAnonDirect(payload) },
  ];

  let lastFailure: InsertFailure | null = null;

  for (const strategy of strategies) {
    try {
      const result = await strategy.fn();
      if (!isFailure(result)) {
        logPipelineInfo("quote insert succeeded", {
          step: "insertLead",
          details: { strategy: strategy.name, leadId: result.leadId },
        });
        return result;
      }
      lastFailure = result;
      logPipelineInfo("quote insert strategy failed, trying next", {
        step: "insertLead",
        details: { strategy: strategy.name, code: result.code },
      });
      if (result.code === "VALIDATION_ERROR") return result;
    } catch (error) {
      logPipelineError(`quote insert strategy threw: ${strategy.name}`, error, {
        step: "insertLead",
      });
      lastFailure = quoteSubmitError(
        QUOTE_ERRORS.unexpected,
        error instanceof Error ? error.message : String(error),
        "SERVICE_UNAVAILABLE",
      );
    }
  }

  return (
    lastFailure ??
    quoteSubmitError(QUOTE_ERRORS.insert, "All insert strategies failed", "INSERT_FAILED")
  );
}

export async function submitQuoteRequest(formData: FormData): Promise<QuoteRequestResult> {
  const payload = parseForm(formData);
  const envStatus = checkSupabaseEnv();

  logPipelineInfo("quote submit started", {
    step: "submitQuoteRequest",
    details: {
      service: payload.service,
      source: payload.source,
      hasPhotos: formData.getAll("photos").some((f) => f instanceof File && f.size > 0),
      env: envStatus,
    },
  });

  if (!payload.name || !payload.phone || !payload.service || !payload.address) {
    return quoteSubmitError(QUOTE_ERRORS.validation, "Missing required field", "VALIDATION_ERROR");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    logPipelineError("missing NEXT_PUBLIC_SUPABASE_URL", new Error("env"), {
      step: "submitQuoteRequest",
    });
    return quoteSubmitError(
      QUOTE_ERRORS.config,
      "NEXT_PUBLIC_SUPABASE_URL is not set",
      "MISSING_ENV",
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    logPipelineError("missing anon key", new Error("env"), { step: "submitQuoteRequest" });
    return quoteSubmitError(
      QUOTE_ERRORS.config,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set",
      "MISSING_ENV",
    );
  }

  try {
    const insertResult = await insertLead(payload);
    if (isFailure(insertResult)) return insertResult;

    const { leadId } = insertResult;
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
        logPipelineError("photo paths append failed (lead saved)", appendError, {
          step: "submitQuoteRequest",
          leadId,
        });
        photoWarnings.push("Some photos could not be linked to your request.");
      }
    }

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${leadId}`);

    return {
      ok: true,
      leadId,
      ...(photoWarnings.length ? { photoWarnings } : {}),
    };
  } catch (error) {
    logPipelineError("quote submit exception", error, { step: "submitQuoteRequest" });
    return quoteSubmitError(
      QUOTE_ERRORS.unexpected,
      error instanceof Error ? error.message : String(error),
      "SERVICE_UNAVAILABLE",
    );
  }
}
