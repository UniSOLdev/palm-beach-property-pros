"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerRole } from "@/lib/admin/auth";
import { phoneSms } from "@/lib/platform/constants";
import { createClient } from "@/lib/supabase/server";

async function getGoogleReviewUrl() {
  const supabase = await createClient();
  const { data } = await supabase.from("business_settings").select("google_review_url").limit(1).maybeSingle();
  return data?.google_review_url ?? null;
}

export async function sendJobReviewRequest(jobId: string) {
  const { supabase } = await requireOwnerRole();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, client_id, address, clients(name, phone), service_type")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error(error?.message ?? "Job not found");

  const client =
    job.clients && typeof job.clients === "object" && !Array.isArray(job.clients)
      ? (job.clients as { name: string; phone: string | null })
      : null;

  const reviewUrl = await getGoogleReviewUrl();
  if (!reviewUrl) throw new Error("Add your Google review URL in business settings first.");

  const message = `Hi ${client?.name ?? "there"}, thank you for choosing Palm Beach Property Pros for your ${job.service_type} service. If you have a moment, we'd appreciate a Google review: ${reviewUrl}`;

  await supabase
    .from("jobs")
    .update({
      review_requested: true,
      review_request_status: "sent",
      review_requested_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (job.client_id) {
    await supabase.from("client_activity").insert({
      client_id: job.client_id,
      activity_type: "review",
      body: "Google review request prepared",
      metadata: { job_id: jobId },
    });
  }

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath(`/admin/jobs/${jobId}/field`);

  return {
    smsHref: client?.phone ? phoneSms(client.phone, message) : null,
    message,
    reviewUrl,
  };
}

export async function sendJobThankYou(jobId: string) {
  const { supabase } = await requireOwnerRole();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, clients(name, phone), service_type")
    .eq("id", jobId)
    .single();

  if (error || !job) throw new Error(error?.message ?? "Job not found");

  const client =
    job.clients && typeof job.clients === "object" && !Array.isArray(job.clients)
      ? (job.clients as { name: string; phone: string | null })
      : null;

  const message = `Hi ${client?.name ?? "there"}, thank you for trusting Palm Beach Property Pros with your ${job.service_type} project. We appreciate your business!`;

  await supabase
    .from("jobs")
    .update({ thank_you_sent_at: new Date().toISOString() })
    .eq("id", jobId);

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath(`/admin/jobs/${jobId}/field`);

  return { smsHref: client?.phone ? phoneSms(client.phone, message) : null, message };
}

export async function markReviewRequestCompleted(jobId: string) {
  const { supabase } = await requireOwnerRole();
  const { error } = await supabase
    .from("jobs")
    .update({ review_request_status: "completed" })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/jobs/${jobId}`);
}
