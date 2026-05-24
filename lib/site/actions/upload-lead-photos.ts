"use server";

import { revalidatePath } from "next/cache";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { tryCreateServiceClient } from "@/lib/supabase/service";

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type LeadPhotoUploadResult = {
  paths: string[];
  warnings: string[];
};

/** Best-effort photo upload — never throws; failures become warnings. */
export async function tryUploadLeadPhotos(
  quoteRequestId: string,
  formData: FormData,
): Promise<LeadPhotoUploadResult> {
  const warnings: string[] = [];
  const paths: string[] = [];

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    warnings.push("Photo upload unavailable (server configuration). Your request was still saved.");
    logPipelineError("photo upload skipped — no service role", new Error("missing service role"), {
      step: "tryUploadLeadPhotos",
      leadId: quoteRequestId,
    });
    return { paths, warnings };
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { paths, warnings };

  if (files.length > MAX_PHOTOS) {
    warnings.push(`Only the first ${MAX_PHOTOS} photos were processed.`);
  }

  const batch = files.slice(0, MAX_PHOTOS);
  logPipelineInfo("lead photo upload started", {
    step: "tryUploadLeadPhotos",
    leadId: quoteRequestId,
    details: { fileCount: batch.length },
  });

  for (const file of batch) {
    if (!ALLOWED_TYPES.has(file.type)) {
      warnings.push(`Skipped ${file.name}: unsupported file type.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      warnings.push(`Skipped ${file.name}: exceeds 5 MB limit.`);
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `quote-requests/${quoteRequestId}/${crypto.randomUUID()}.${ext}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from("lead-media").upload(path, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        logPipelineError("lead photo upload failed (continuing)", error, {
          step: "tryUploadLeadPhotos",
          leadId: quoteRequestId,
          details: { path, fileName: file.name, message: error.message },
        });
        if (error.message.includes("Bucket not found")) {
          warnings.push("Photo storage is not configured yet. Your request was still saved.");
          break;
        }
        warnings.push(`Could not upload ${file.name}.`);
        continue;
      }

      paths.push(path);
    } catch (fileError) {
      logPipelineError("lead photo read/upload exception", fileError, {
        step: "tryUploadLeadPhotos",
        leadId: quoteRequestId,
        details: { fileName: file.name },
      });
      warnings.push(`Could not upload ${file.name}.`);
    }
  }

  return { paths, warnings };
}

/** @deprecated use tryUploadLeadPhotos */
export async function uploadLeadPhotos(quoteRequestId: string, formData: FormData): Promise<string[]> {
  const result = await tryUploadLeadPhotos(quoteRequestId, formData);
  return result.paths;
}

export async function appendLeadPhotoPaths(quoteRequestId: string, paths: string[]) {
  if (!paths.length) return;

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    logPipelineError("appendLeadPhotoPaths skipped — no service role", new Error("missing service role"), {
      step: "appendLeadPhotoPaths",
      leadId: quoteRequestId,
    });
    return;
  }

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
    logPipelineError("lead photo paths update failed", error, {
      step: "appendLeadPhotoPaths",
      leadId: quoteRequestId,
      details: { message: error.message, code: error.code },
    });
    throw new Error(error.message);
  }

  logPipelineInfo("lead photo paths saved", {
    step: "appendLeadPhotoPaths",
    leadId: quoteRequestId,
    details: { count: paths.length },
  });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${quoteRequestId}`);
}
