"use server";

import { revalidatePath } from "next/cache";
import { appendLeadPhotoPaths, uploadLeadPhotos } from "@/lib/site/actions/upload-lead-photos";
import { createServiceClient } from "@/lib/supabase/service";

export type QuoteRequestResult =
  | { ok: true }
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
      return { ok: false, error: "Unable to submit right now. Please call us directly." };
    }

    try {
      const photoPaths = await uploadLeadPhotos(lead.id, formData);
      if (photoPaths.length) {
        await appendLeadPhotoPaths(lead.id, photoPaths);
      }
    } catch {
      /* photos optional — lead still saved */
    }

    await supabase.from("quote_request_activity").insert({
      quote_request_id: lead.id,
      activity_type: "system",
      body: "Quote request submitted from website",
      metadata: {
        property_type: propertyType || null,
        client_type: clientTypeFromProperty(propertyType),
      },
    });

    revalidatePath("/admin/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to submit right now. Please call us directly." };
  }
}
