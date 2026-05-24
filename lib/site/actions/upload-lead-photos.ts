"use server";

import { revalidatePath } from "next/cache";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function uploadLeadPhotos(
  quoteRequestId: string,
  formData: FormData,
): Promise<string[]> {
  const supabase = createServiceClient();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (!files.length) return [];
  if (files.length > MAX_PHOTOS) {
    throw new Error(`Maximum ${MAX_PHOTOS} photos allowed.`);
  }

  const paths: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error("Only JPEG, PNG, and WebP photos are supported.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Each photo must be 5 MB or smaller.");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `quote-requests/${quoteRequestId}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from("lead-media").upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      logPipelineError("lead photo upload failed", error, { step: "uploadLeadPhotos", leadId: quoteRequestId, details: { path } });
      throw new Error(error.message);
    }
    paths.push(path);
  }

  return paths;
}

export async function appendLeadPhotoPaths(quoteRequestId: string, paths: string[]) {
  if (!paths.length) return;

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("quote_requests")
    .select("photo_urls")
    .eq("id", quoteRequestId)
    .single();

  const current = Array.isArray(existing?.photo_urls)
    ? existing.photo_urls.filter((v): v is string => typeof v === "string")
    : [];

  const { error } = await supabase
    .from("quote_requests")
    .update({
      photo_urls: [...current, ...paths],
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteRequestId);

  if (error) {
    logPipelineError("lead photo paths update failed", error, { step: "appendLeadPhotoPaths", leadId: quoteRequestId });
    throw new Error(error.message);
  }
  logPipelineInfo("lead photo paths saved", { step: "appendLeadPhotoPaths", leadId: quoteRequestId, details: { count: paths.length } });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${quoteRequestId}`);
}
