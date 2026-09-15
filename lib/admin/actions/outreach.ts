"use server";

import { revalidatePath } from "next/cache";
import type { ProspectStatus, ProspectType } from "@/lib/admin/outreach/constants";
import type { OutreachProspectRow } from "@/lib/admin/types-outreach";
import { createClient } from "@/lib/supabase/server";

function revalidateOutreach() {
  revalidatePath("/admin/leads/partners");
}

export async function listOutreachProspects(options?: {
  type?: ProspectType | "all";
  status?: ProspectStatus | "all";
  search?: string;
  showArchived?: boolean;
}): Promise<OutreachProspectRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("outreach_prospects")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("company_name", { ascending: true });

  if (!options?.showArchived) query = query.eq("archived", false);
  if (options?.type && options.type !== "all") query = query.eq("prospect_type", options.type);
  if (options?.status && options.status !== "all") query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as OutreachProspectRow[];
  const q = options?.search?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.company_name.toLowerCase().includes(q) ||
        (r.contact_name ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.pitch_notes ?? "").toLowerCase().includes(q) ||
        (r.zip ?? "").includes(q),
    );
  }
  return rows;
}

export async function updateOutreachProspect(
  id: string,
  patch: {
    status?: ProspectStatus;
    internal_notes?: string | null;
    next_follow_up?: string | null;
    contact_name?: string | null;
    phone?: string | null;
    email?: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("outreach_prospects").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateOutreach();
}

export async function createOutreachProspect(input: {
  company_name: string;
  prospect_type: ProspectType;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  zip?: string;
  pitch_notes?: string;
  internal_notes?: string;
}) {
  const supabase = await createClient();
  const name = input.company_name.trim();
  if (!name) throw new Error("Company name is required.");

  const { data, error } = await supabase
    .from("outreach_prospects")
    .insert({
      company_name: name,
      prospect_type: input.prospect_type,
      contact_name: input.contact_name?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      website: input.website?.trim() || null,
      address: input.address?.trim() || null,
      zip: input.zip?.trim() || null,
      pitch_notes: input.pitch_notes?.trim() || null,
      internal_notes: input.internal_notes?.trim() || null,
      status: "new",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateOutreach();
  return data as OutreachProspectRow;
}

export async function archiveOutreachProspect(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("outreach_prospects").update({ archived: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateOutreach();
}
