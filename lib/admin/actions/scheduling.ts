"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export type ScheduledJob = {
  id: string;
  client_id: string;
  service_type: string;
  address: string;
  status: string;
  job_date: string;
  start_time: string | null;
  end_time: string | null;
  revenue: number;
  clients?: { name: string; phone: string | null } | null;
};

export async function listScheduledJobs(options?: {
  from?: string;
  to?: string;
}): Promise<ScheduledJob[]> {
  const supabase = await createClient();
  let query = supabase
    .from("jobs")
    .select("id, client_id, service_type, address, status, job_date, start_time, end_time, revenue, clients(name, phone)")
    .eq("archived", false)
    .order("job_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (options?.from) query = query.gte("job_date", options.from);
  if (options?.to) query = query.lte("job_date", options.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const clients = row.clients;
    const client =
      clients && typeof clients === "object"
        ? Array.isArray(clients)
          ? (clients[0] as { name: string; phone: string | null } | undefined) ?? null
          : (clients as { name: string; phone: string | null })
        : null;

    return {
      id: row.id,
      client_id: row.client_id,
      service_type: row.service_type,
      address: row.address,
      status: row.status,
      job_date: row.job_date,
      start_time: row.start_time,
      end_time: row.end_time,
      revenue: Number(row.revenue),
      clients: client,
    };
  });
}

export async function rescheduleJob(jobId: string, patch: { job_date: string; start_time?: string | null; status?: string }) {
  const { supabase } = await requireOwnerRole();
  const { error } = await supabase.from("jobs").update(patch).eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/schedule");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
}

export async function updateJobStatus(jobId: string, status: string) {
  const { supabase } = await requireOwnerRole();
  const { error } = await supabase.from("jobs").update({ status }).eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/schedule");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath(`/admin/jobs/${jobId}/field`);
}
