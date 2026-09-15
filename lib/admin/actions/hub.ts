"use server";

import { revalidatePath } from "next/cache";
import type {
  CrewReferralRow,
  HubSnapshot,
  HubCrewMember,
  TimeEntryRow,
} from "@/lib/admin/types-hub";
import { createClient } from "@/lib/supabase/server";

function revalidateHub() {
  revalidatePath("/admin/hub");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/supplies");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function getCrewMember(supabase: Awaited<ReturnType<typeof createClient>>, crewMemberId: string) {
  const { data, error } = await supabase
    .from("crew_members")
    .select("id, name, referral_bonus_flat, referral_bonus_percent")
    .eq("id", crewMemberId)
    .eq("archived", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Crew member not found");
  return data as HubCrewMember;
}

export async function listHubCrewMembers(): Promise<HubCrewMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crew_members")
    .select("id, name, referral_bonus_flat, referral_bonus_percent")
    .eq("archived", false)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []) as HubCrewMember[];
}

export async function getHubSnapshot(crewMemberId: string): Promise<HubSnapshot> {
  const supabase = await createClient();
  const crew = await getCrewMember(supabase, crewMemberId);
  const today = todayIsoDate();

  const [openEntryRes, tasksRes, jobsRes, referralsRes, suppliesRes] = await Promise.all([
    supabase
      .from("time_entries")
      .select("*")
      .eq("crew_member_id", crewMemberId)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, due_date, job_id, assigned_crew_ids, assigned_crew_member_id")
      .eq("archived", false)
      .in("status", ["open", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(40),
    supabase
      .from("jobs")
      .select("id, service_type, address, job_date, start_time, assigned_crew_ids")
      .eq("archived", false)
      .eq("job_date", today)
      .order("start_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("crew_referrals")
      .select("*")
      .eq("crew_member_id", crewMemberId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("supplies")
      .select("id, name, quantity, unit, reorder_level, storage_location")
      .eq("archived", false)
      .order("name"),
  ]);

  if (tasksRes.error) throw new Error(tasksRes.error.message);
  if (jobsRes.error) throw new Error(jobsRes.error.message);
  if (referralsRes.error) throw new Error(referralsRes.error.message);
  if (suppliesRes.error) throw new Error(suppliesRes.error.message);
  if (openEntryRes.error) throw new Error(openEntryRes.error.message);

  const todayTasks = (tasksRes.data ?? [])
    .filter(
      (t) =>
        t.assigned_crew_member_id === crewMemberId ||
        (t.assigned_crew_ids ?? []).includes(crewMemberId),
    )
    .slice(0, 12)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      due_date: t.due_date,
      job_id: t.job_id,
    }));

  const todayJobs = (jobsRes.data ?? [])
    .filter((j) => (j.assigned_crew_ids ?? []).includes(crewMemberId))
    .map((j) => ({
      id: j.id,
      label: `${j.service_type} · ${j.address}`,
      job_date: j.job_date,
      start_time: j.start_time,
    }));

  const supplies = (suppliesRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    quantity: Number(s.quantity),
    unit: s.unit,
    reorder_level: Number(s.reorder_level),
    storage_location: s.storage_location,
  }));

  return {
    crew,
    openEntry: (openEntryRes.data as TimeEntryRow | null) ?? null,
    todayTasks,
    todayJobs,
    referrals: (referralsRes.data ?? []) as CrewReferralRow[],
    lowStock: supplies.filter((s) => s.quantity <= s.reorder_level),
    supplies,
  };
}

export async function clockIn(crewMemberId: string, jobId?: string | null) {
  const supabase = await createClient();
  await getCrewMember(supabase, crewMemberId);

  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("crew_member_id", crewMemberId)
    .is("clock_out", null)
    .maybeSingle();

  if (open) throw new Error("Already clocked in. Clock out first.");

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      crew_member_id: crewMemberId,
      job_id: jobId || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateHub();
  return data as TimeEntryRow;
}

export async function clockOut(entryId: string, notes?: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .update({
      clock_out: new Date().toISOString(),
      notes: notes?.trim() || null,
    })
    .eq("id", entryId)
    .is("clock_out", null)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Time entry not found or already closed.");
  revalidateHub();
  return data as TimeEntryRow;
}

export async function submitCrewReferral(input: {
  crew_member_id: string;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  service_requested?: string;
  description?: string;
}) {
  const supabase = await createClient();
  const crew = await getCrewMember(supabase, input.crew_member_id);
  const name = input.contact_name.trim();
  if (!name) throw new Error("Contact name is required.");

  const incentiveAmount = Number(crew.referral_bonus_flat) || 0;

  const { data: lead, error: leadErr } = await supabase
    .from("quote_requests")
    .insert({
      name,
      phone: input.contact_phone?.trim() || null,
      email: input.contact_email?.trim() || null,
      service_requested: input.service_requested?.trim() || "Referral — service TBD",
      message: input.description?.trim() || null,
      source: "crew_referral",
      status: "new",
      internal_notes: `Crew referral from ${crew.name}`,
    })
    .select("id")
    .single();

  if (leadErr) throw new Error(leadErr.message);

  const { data: referral, error: refErr } = await supabase
    .from("crew_referrals")
    .insert({
      crew_member_id: input.crew_member_id,
      lead_id: lead.id,
      contact_name: name,
      contact_phone: input.contact_phone?.trim() || null,
      contact_email: input.contact_email?.trim() || null,
      service_requested: input.service_requested?.trim() || null,
      description: input.description?.trim() || null,
      incentive_amount: incentiveAmount,
      status: "pending",
    })
    .select("*")
    .single();

  if (refErr) throw new Error(refErr.message);

  await supabase.from("quote_request_activity").insert({
    quote_request_id: lead.id,
    activity_type: "note",
    body: `Submitted by crew member ${crew.name} via Employee Hub.`,
    metadata: { crew_member_id: input.crew_member_id, referral_id: referral.id },
  });

  revalidateHub();
  return referral as CrewReferralRow;
}

export async function recordInventoryCount(input: {
  crew_member_id: string;
  supply_id: string;
  counted_qty: number;
  notes?: string;
}) {
  const supabase = await createClient();
  await getCrewMember(supabase, input.crew_member_id);

  const { data: supply, error: supplyErr } = await supabase
    .from("supplies")
    .select("quantity")
    .eq("id", input.supply_id)
    .single();

  if (supplyErr || !supply) throw new Error("Supply not found.");

  const previous = Number(supply.quantity);
  const counted = Math.max(0, input.counted_qty);

  const { error: logErr } = await supabase.from("supply_count_logs").insert({
    supply_id: input.supply_id,
    crew_member_id: input.crew_member_id,
    previous_qty: previous,
    counted_qty: counted,
    notes: input.notes?.trim() || null,
  });

  if (logErr) throw new Error(logErr.message);

  const { error: updateErr } = await supabase
    .from("supplies")
    .update({ quantity: counted, updated_at: new Date().toISOString() })
    .eq("id", input.supply_id);

  if (updateErr) throw new Error(updateErr.message);

  revalidateHub();
  return { previous, counted };
}

export async function updateReferralStatus(
  referralId: string,
  status: "approved" | "paid" | "declined",
) {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "paid") patch.paid_at = new Date().toISOString();

  const { error } = await supabase.from("crew_referrals").update(patch).eq("id", referralId);
  if (error) throw new Error(error.message);
  revalidateHub();
}
