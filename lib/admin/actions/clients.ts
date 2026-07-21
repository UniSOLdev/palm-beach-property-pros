"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export type ClientActivityRow = {
  id: string;
  client_id: string;
  activity_type: string;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function getClientDetail(clientId: string) {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("archived", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!client) throw new Error("Client not found");

  const [jobs, quotes, invoices, leads, activity] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, service_type, status, job_date, revenue, address, created_at")
      .eq("client_id", clientId)
      .eq("archived", false)
      .order("job_date", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, quote_number, service_type, approval_status, status, job_address, created_at")
      .eq("client_id", clientId)
      .eq("archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, payment_status, total, due_date, created_at")
      .eq("client_id", clientId)
      .eq("archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("quote_requests")
      .select("id, name, service_requested, status, created_at")
      .eq("client_id", clientId)
      .eq("archived", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_activity")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    client,
    jobs: jobs.data ?? [],
    quotes: quotes.data ?? [],
    invoices: invoices.data ?? [],
    leads: leads.data ?? [],
    activity: (activity.data ?? []) as ClientActivityRow[],
  };
}

export async function updateClientProfile(
  clientId: string,
  patch: {
    name?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    service_reminder_notes?: string | null;
    follow_up_date?: string | null;
    review_status?: string;
  },
) {
  const { supabase } = await requireOwnerRole();
  const { error } = await supabase.from("clients").update(patch).eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

export async function addClientActivity(
  clientId: string,
  activity: { activity_type: ClientActivityRow["activity_type"]; body?: string; metadata?: Record<string, unknown> },
) {
  const { supabase, user } = await requireOwnerRole();
  const { error } = await supabase.from("client_activity").insert({
    client_id: clientId,
    activity_type: activity.activity_type,
    body: activity.body ?? null,
    metadata: activity.metadata ?? null,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function addClientNote(clientId: string, note: string) {
  const body = note.trim();
  if (!body) throw new Error("Note cannot be empty");
  await addClientActivity(clientId, { activity_type: "note", body });
}
