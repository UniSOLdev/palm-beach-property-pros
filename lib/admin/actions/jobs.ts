"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JobDetailPayload, JobPhoto, JobPhotoCategory } from "@/lib/admin/types-jobs";

function legacyPhotos(job: {
  id: string;
  before_photo_urls: string[] | null;
  after_photo_urls: string[] | null;
}): JobPhoto[] {
  const rows: JobPhoto[] = [];
  for (const url of job.before_photo_urls ?? []) {
    if (!url) continue;
    rows.push({
      id: `legacy-before-${url}`,
      job_id: job.id,
      category: "before",
      storage_path: "",
      file_url: url,
      created_at: "",
      legacy: true,
    });
  }
  for (const url of job.after_photo_urls ?? []) {
    if (!url) continue;
    rows.push({
      id: `legacy-after-${url}`,
      job_id: job.id,
      category: "after",
      storage_path: "",
      file_url: url,
      created_at: "",
      legacy: true,
    });
  }
  return rows;
}

export async function getJobDetail(jobId: string): Promise<JobDetailPayload | null> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*, clients(name, phone, email, address)")
    .eq("id", jobId)
    .eq("archived", false)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!job) return null;

  const [{ data: photos }, { data: expenses }, { data: crewPayouts }] = await Promise.all([
    supabase.from("job_photos").select("*").eq("job_id", jobId).order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, expense_date, category, vendor, description, amount, receipt_url, payment_method")
      .eq("job_id", jobId)
      .eq("archived", false)
      .order("expense_date", { ascending: false }),
    supabase.from("crew_payouts").select("*").eq("job_id", jobId).order("created_at", { ascending: false }),
  ]);

  const crewIds = new Set<string>();
  for (const id of job.assigned_crew_ids ?? []) crewIds.add(id);
  for (const p of crewPayouts ?? []) {
    for (const id of p.crew_member_ids ?? []) crewIds.add(id);
  }

  let crewNames: Record<string, string> = {};
  if (crewIds.size > 0) {
    const { data: crew } = await supabase
      .from("crew_members")
      .select("id, name")
      .in("id", [...crewIds]);
    crewNames = Object.fromEntries((crew ?? []).map((c) => [c.id, c.name]));
  }

  const mergedPhotos = [...(photos ?? []), ...legacyPhotos(job)] as JobPhoto[];

  return {
    job: job as JobDetailPayload["job"],
    photos: mergedPhotos,
    expenses: expenses ?? [],
    crewPayouts: crewPayouts ?? [],
    crewNames,
  };
}

export async function updateJob(
  jobId: string,
  patch: {
    service_type?: string;
    address?: string;
    status?: string;
    job_date?: string;
    start_time?: string | null;
    end_time?: string | null;
    job_notes?: string | null;
    internal_notes?: string | null;
    revenue?: number;
    estimated_labor_cost?: number;
    estimated_materials_cost?: number;
    fuel_cost?: number;
    dump_fee_cost?: number;
    truck_rental_cost?: number;
    equipment_cost?: number;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update(patch).eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/jobs");
}

export async function addJobPhoto(
  jobId: string,
  category: JobPhotoCategory,
  storagePath: string,
  fileUrl: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_photos").insert({
    job_id: jobId,
    category,
    storage_path: storagePath,
    file_url: fileUrl,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function removeJobPhoto(photoId: string, jobId: string, storagePath: string | null) {
  if (photoId.startsWith("legacy-")) {
    throw new Error("Legacy photos must be removed in Supabase dashboard.");
  }
  const supabase = await createClient();
  if (storagePath) {
    await supabase.storage.from("job-media").remove([storagePath]);
  }
  const { error } = await supabase.from("job_photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/jobs/${jobId}`);
}

export async function addJobExpense(
  jobId: string,
  input: {
    expense_date: string;
    category: string;
    vendor: string;
    description: string;
    amount: number;
    payment_method: string;
    receipt_url?: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    ...input,
    job_id: jobId,
    expense_type: "Job",
    reimbursable: false,
    reimbursed: false,
    is_recurring: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/expenses");
}

export async function createInvoiceFromJob(jobId: string) {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, client_id, service_type, revenue, address, invoice_id")
    .eq("id", jobId)
    .single();
  if (!job) throw new Error("Job not found");
  if (job.invoice_id) {
    return { invoiceId: job.invoice_id as string, existing: true };
  }

  const { createInvoiceDraft } = await import("@/lib/admin/actions/invoices");
  const invoiceId = await createInvoiceDraft({
    client_id: job.client_id,
    job_id: jobId,
    lines: [
      {
        description: `${job.service_type} — ${job.address}`,
        quantity: 1,
        unit_price: Number(job.revenue) || 0,
      },
    ],
  });

  await supabase.from("jobs").update({ invoice_id: invoiceId }).eq("id", jobId);
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin/invoices");
  return { invoiceId, existing: false };
}
