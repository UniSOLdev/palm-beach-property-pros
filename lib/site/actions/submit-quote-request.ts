"use server";

import { revalidatePath } from "next/cache";
import { appendLeadPhotoPaths, uploadLeadPhotos } from "@/lib/site/actions/upload-lead-photos";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { createServiceClient } from "@/lib/supabase/service";

export type QuoteRequestResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

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

function schemaHint(errorMessage: string): string | null {
  if (errorMessage.includes("quote_requests") && errorMessage.includes("does not exist")) {
    return "Database migration pending — apply supabase/migrations/20260524120000_quote_requests.sql";
  }
  return null;
}

export async function submitQuoteRequest(formData: FormData): Promise<QuoteRequestResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const propertyType = String(formData.get("propertyType") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const contact = String(formData.get("contact") ?? "Call").trim();
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const preferredTime = String(formData.get("preferredTime") ?? "").trim();
  const referrer = String(formData.get("referrer") ?? "").trim();
  const source = String(formData.get("source") ?? "website").trim() || "website";

  if (!name || !phone || !service || !address) {
    return { ok: false, error: "Please complete all required fields." };
  }

  try {
    const supabase = createServiceClient();
    const { data: lead, error } = await supabase
      .from("quote_requests")
      .insert({
        name,
        phone,
        email: email || null,
        service_requested: service,
        address,
        city: city || null,
        property_type: propertyType || null,
        message: message || null,
        preferred_contact: contact,
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
        source,
        referrer: referrer || null,
        status: "new",
        photo_urls: [],
      })
      .select("id")
      .single();

    if (error || !lead) {
      logPipelineError("quote request insert failed", error ?? new Error("No row returned"), {
        step: "submitQuoteRequest",
        details: { service, source },
      });
      const hint = error ? schemaHint(error.message) : null;
      return {
        ok: false,
        error: hint
          ? "Quote form is temporarily unavailable. Please call us directly."
          : "Unable to submit right now. Please call us directly.",
      };
    }

    logPipelineInfo("quote request created", { step: "submitQuoteRequest", leadId: lead.id });

    try {
      const photoPaths = await uploadLeadPhotos(lead.id, formData);
      if (photoPaths.length) {
        await appendLeadPhotoPaths(lead.id, photoPaths);
        logPipelineInfo("lead photos uploaded", {
          step: "submitQuoteRequest",
          leadId: lead.id,
          details: { count: photoPaths.length },
        });
      }
    } catch (photoError) {
      logPipelineError("lead photo upload failed (lead saved)", photoError, {
        step: "submitQuoteRequest",
        leadId: lead.id,
      });
    }

    const { error: activityError } = await supabase.from("quote_request_activity").insert({
      quote_request_id: lead.id,
      activity_type: "system",
      body: "Quote request submitted from website",
      metadata: {
        property_type: propertyType || null,
        client_type: clientTypeFromProperty(propertyType),
      },
    });

    if (activityError) {
      logPipelineError("quote request activity insert failed", activityError, {
        step: "submitQuoteRequest",
        leadId: lead.id,
      });
    }

    revalidatePath("/admin/leads");
    return { ok: true, leadId: lead.id };
  } catch (error) {
    logPipelineError("quote request submit exception", error, { step: "submitQuoteRequest" });
    return { ok: false, error: "Unable to submit right now. Please call us directly." };
  }
}
