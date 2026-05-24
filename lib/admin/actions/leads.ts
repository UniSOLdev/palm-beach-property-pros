"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "@/lib/admin/lead-constants";
import type { QuoteRequestActivityRow, QuoteRequestRow } from "@/lib/admin/types-leads";
import { createClient } from "@/lib/supabase/server";

function parsePhotoUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function mapLead(row: Record<string, unknown>): QuoteRequestRow {
  return {
    ...(row as QuoteRequestRow),
    photo_urls: parsePhotoUrls(row.photo_urls),
  };
}

function newPublicId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function clientTypeFromProperty(propertyType: string | null): string {
  if (!propertyType) return "residential";
  if (
    propertyType.includes("Commercial") ||
    propertyType.includes("Office") ||
    propertyType.includes("HOA")
  ) {
    return "commercial";
  }
  return "residential";
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  quoteRequestId: string,
  activity: {
    activity_type: QuoteRequestActivityRow["activity_type"];
    body?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from("quote_request_activity").insert({
    quote_request_id: quoteRequestId,
    activity_type: activity.activity_type,
    body: activity.body ?? null,
    metadata: activity.metadata ?? null,
    created_by: user?.id ?? null,
  });
}

export async function listLeads(options?: {
  status?: LeadStatus | "all";
  search?: string;
}): Promise<QuoteRequestRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("quote_requests")
    .select("*")
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const leads = (data ?? []).map((row) => mapLead(row as Record<string, unknown>));
  const search = options?.search?.trim().toLowerCase();
  if (!search) return leads;

  return leads.filter((lead) =>
    [
      lead.name,
      lead.phone,
      lead.email ?? "",
      lead.service_requested,
      lead.address,
      lead.city ?? "",
      lead.message ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(search),
  );
}

export async function getLead(id: string): Promise<{
  lead: QuoteRequestRow;
  activity: QuoteRequestActivityRow[];
}> {
  const supabase = await createClient();
  const { data: lead, error } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", id)
    .eq("archived", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!lead) throw new Error("Lead not found");

  const { data: activity, error: activityError } = await supabase
    .from("quote_request_activity")
    .select("*")
    .eq("quote_request_id", id)
    .order("created_at", { ascending: false });

  if (activityError) throw new Error(activityError.message);

  return {
    lead: mapLead(lead as Record<string, unknown>),
    activity: (activity ?? []) as QuoteRequestActivityRow[],
  };
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("quote_requests")
    .select("status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("quote_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logActivity(supabase, id, {
    activity_type: "status_change",
    body: `Status changed to ${status}`,
    metadata: { from: existing?.status, to: status },
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}

export async function addLeadNote(id: string, note: string) {
  const body = note.trim();
  if (!body) throw new Error("Note cannot be empty");

  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_requests")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await logActivity(supabase, id, {
    activity_type: "note",
    body,
  });

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
}

export async function logLeadContact(id: string, method: "call" | "text" | "email") {
  const supabase = await createClient();
  await logActivity(supabase, id, {
    activity_type: "contact",
    body: `Contacted via ${method}`,
    metadata: { method },
  });
  revalidatePath(`/admin/leads/${id}`);
}

async function ensureClientForLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lead: QuoteRequestRow,
): Promise<string> {
  if (lead.client_id) return lead.client_id;

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.city ? `${lead.address}, ${lead.city}` : lead.address,
      client_type: clientTypeFromProperty(lead.property_type),
      referral_source: lead.source,
      notes: lead.message,
      review_status: "none",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("quote_requests")
    .update({ client_id: client.id, updated_at: new Date().toISOString() })
    .eq("id", lead.id);

  return client.id as string;
}

export async function convertLeadToClient(id: string) {
  const supabase = await createClient();
  const { lead } = await getLead(id);
  const clientId = await ensureClientForLead(supabase, lead);

  await logActivity(supabase, id, {
    activity_type: "converted",
    body: "Converted to client",
    metadata: { client_id: clientId },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/leads/${id}`);
  return clientId;
}

export async function convertLeadToQuote(id: string) {
  const supabase = await createClient();
  const { lead } = await getLead(id);
  if (lead.quote_id) return lead.quote_id;

  const clientId = await ensureClientForLead(supabase, lead);
  const { count } = await supabase.from("quotes").select("id", { count: "exact", head: true });
  const quote_number = `Q-${String((count ?? 0) + 1).padStart(4, "0")}`;
  const jobAddress = lead.city ? `${lead.address}, ${lead.city}` : lead.address;

  const { data: settings } = await supabase
    .from("business_settings")
    .select("default_quote_terms")
    .limit(1)
    .maybeSingle();

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      public_id: newPublicId(),
      quote_number,
      client_id: clientId,
      service_type: lead.service_requested,
      job_address: jobAddress,
      status: "draft",
      notes: lead.message,
      terms: settings?.default_quote_terms ?? null,
    })
    .select("id, public_id")
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("quote_requests")
    .update({
      quote_id: quote.id,
      client_id: clientId,
      status: "quoted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await logActivity(supabase, id, {
    activity_type: "converted",
    body: "Converted to quote estimate",
    metadata: { quote_id: quote.id, public_id: quote.public_id },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/quotes");
  revalidatePath(`/admin/leads/${id}`);
  return quote.id as string;
}

export async function convertLeadToInvoice(id: string) {
  const supabase = await createClient();
  const { lead } = await getLead(id);
  if (lead.invoice_id) {
    redirect(`/admin/invoices/${lead.invoice_id}`);
  }

  const clientId = await ensureClientForLead(supabase, lead);
  const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
  const invoice_number = `PBPP-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: settings } = await supabase
    .from("business_settings")
    .select("default_invoice_terms")
    .limit(1)
    .maybeSingle();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      public_id: newPublicId(),
      invoice_number,
      client_id: clientId,
      payment_status: "Unpaid",
      document_status: "draft",
      terms: settings?.default_invoice_terms ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("invoice_items").insert({
    invoice_id: invoice.id,
    description: lead.service_requested,
    quantity: 1,
    unit_price: 0,
    sort_order: 0,
  });

  await supabase
    .from("quote_requests")
    .update({
      invoice_id: invoice.id,
      client_id: clientId,
      status: lead.status === "new" ? "quoted" : lead.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  await logActivity(supabase, id, {
    activity_type: "converted",
    body: "Converted to invoice draft",
    metadata: { invoice_id: invoice.id },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/leads/${id}`);
  redirect(`/admin/invoices/${invoice.id}`);
}

export async function archiveLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quote_requests")
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}

export async function getLeadPhotoUrls(paths: string[]): Promise<{ path: string; url: string }[]> {
  if (!paths.length) return [];
  const supabase = await createClient();
  const results = await Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage.from("lead-media").createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) return null;
      return { path, url: data.signedUrl };
    }),
  );
  return results.filter((r): r is { path: string; url: string } => r !== null);
}
