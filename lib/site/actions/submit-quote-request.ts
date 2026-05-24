"use server";

import { revalidatePath } from "next/cache";
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
  const city = String(formData.get("city") ?? "").trim();
  const propertyType = String(formData.get("propertyType") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const contact = String(formData.get("contact") ?? "Call").trim();

  if (!name || !phone || !service || !city || !propertyType) {
    return { ok: false, error: "Please complete all required fields." };
  }

  const detailLines = [
    `Service: ${service}`,
    `City: ${city}`,
    `Property type: ${propertyType}`,
    `Preferred contact: ${contact}`,
  ];
  if (notes) detailLines.push(`Notes: ${notes}`);

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("clients").insert({
      name,
      phone,
      email: email || null,
      address: city,
      client_type: clientTypeFromProperty(propertyType),
      referral_source: "website_quote_form",
      notes: detailLines.join("\n"),
      review_status: "none",
    });

    if (error) {
      return { ok: false, error: "Unable to submit right now. Please call us directly." };
    }

    revalidatePath("/admin/clients");
    return { ok: true };
  } catch {
    return { ok: false, error: "Unable to submit right now. Please call us directly." };
  }
}
