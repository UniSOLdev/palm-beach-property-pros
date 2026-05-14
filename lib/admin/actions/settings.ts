"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { BusinessSettings } from "@/lib/admin/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { ActionResult } from "./clients";

function requireSb() {
  const sb = createSupabaseAdminClient();
  if (!sb) return { ok: false as const, error: "Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL and keys)." };
  return { ok: true as const, sb };
}

export async function saveBusinessSettingsAction(formData: FormData): Promise<void> {
  const gate = requireSb();
  if (!gate.ok) redirect(`/admin/settings?err=${encodeURIComponent(gate.error)}`);

  const id = String(formData.get("id") ?? "").trim();
  const methodsRaw = String(formData.get("payment_methods_accepted") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const row = {
    id: id || randomUUID(),
    business_name: String(formData.get("business_name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim(),
    google_review_url: String(formData.get("google_review_url") ?? "").trim(),
    default_invoice_terms: String(formData.get("default_invoice_terms") ?? "").trim(),
    default_quote_terms: String(formData.get("default_quote_terms") ?? "").trim(),
    payment_methods_accepted: methodsRaw.length ? methodsRaw : ["Cash", "Zelle", "Card", "Check"],
    brand_primary: String(formData.get("brand_primary") ?? "#0C2340").trim(),
    brand_accent: String(formData.get("brand_accent") ?? "#6A8F6B").trim(),
    updated_at: new Date().toISOString(),
  };

  if (!row.business_name) redirect(`/admin/settings?err=${encodeURIComponent("Business name is required.")}`);

  const { id: _generatedId, ...rest } = row;

  if (id) {
    const { error } = await gate.sb.from("business_settings").update(rest).eq("id", id);
    if (error) redirect(`/admin/settings?err=${encodeURIComponent(error.message)}`);
  } else {
    const { data: existing, error: exErr } = await gate.sb.from("business_settings").select("id").limit(1).maybeSingle();
    if (exErr) redirect(`/admin/settings?err=${encodeURIComponent(exErr.message)}`);
    if (existing?.id) {
      const { error } = await gate.sb.from("business_settings").update(rest).eq("id", String((existing as { id: string }).id));
      if (error) redirect(`/admin/settings?err=${encodeURIComponent(error.message)}`);
    } else {
      const { error } = await gate.sb.from("business_settings").insert({ ...rest, id: randomUUID() });
      if (error) redirect(`/admin/settings?err=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

export async function saveBusinessSettingsFromModel(settings: BusinessSettings & { id?: string }): Promise<ActionResult> {
  const gate = requireSb();
  if (!gate.ok) return gate;

  const row = {
    id: settings.id ?? randomUUID(),
    business_name: settings.businessName,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    logo_url: settings.logoUrl,
    address: settings.address,
    google_review_url: settings.googleReviewUrl,
    default_invoice_terms: settings.defaultInvoiceTerms,
    default_quote_terms: settings.defaultQuoteTerms,
    payment_methods_accepted: settings.paymentMethodsAccepted,
    brand_primary: settings.brandPrimary,
    brand_accent: settings.brandAccent,
    updated_at: new Date().toISOString(),
  };

  const { error } = await gate.sb.from("business_settings").upsert(row, { onConflict: "id" });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}
