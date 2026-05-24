"use server";

import { revalidatePath } from "next/cache";
import { logPipelineError, logPipelineInfo } from "@/lib/pipeline/logger";
import { tryCreateServiceClient } from "@/lib/supabase/service";

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type LeadPhotoUploadResult = {
  paths: string[];
  warnings: string[];
};

function normalizeMime(type: string, fileName: string): string {
  if (ALLOWED_TYPES.has(type)) return type;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return type;
}

/** Best-effort photo upload — never throws; failures become warnings only. */
export async function tryUploadLeadPhotos(
  quoteRequestId: string,
  formData: FormData,
): Promise<LeadPhotoUploadResult> {
  const warnings: string[] = [];
  const paths: string[] = [];

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    logPipelineInfo("photo upload skipped — no service role key", {
      step: "tryUploadLeadPhotos",
      leadId: quoteRequestId,
    });
    return { paths, warnings };
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { paths, warnings };

  if (files.length > MAX_PHOTOS) {
    warnings.push(`Only the first ${MAX_PHOTOS} photos were uploaded.`);
  }

  const batch = files.slice(0, MAX_PHOTOS);
  logPipelineInfo("lead photo upload started", {
    step: "tryUploadLeadPhotos",
    leadId: quoteRequestId,
    details: { fileCount: batch.length },
  });

  for (const file of batch) {
    const mime = normalizeMime(file.type, file.name);
    if (!ALLOWED_TYPES.has(mime) && !mime.startsWith("image/")) {
      warnings.push(`Skipped ${file.name}: use JPG, PNG, or WebP.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      warnings.push(`Skipped ${file.name}: must be 5 MB or smaller.`);
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `quote-requests/${quoteRequestId}/${crypto.randomUUID()}.${ext}`;

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from("lead-media").upload(path, buffer, {
        contentType: mime,
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        logPipelineError("lead photo upload failed (continuing)", error, {
          step: "tryUploadLeadPhotos",
          leadId: quoteRequestId,
          details: { path, fileName: file.name, message: error.message },
        });
        if (error.message.toLowerCase().includes("bucket not found")) {
          warnings.push("Photo storage is not configured yet.");
          break;
        }
        warnings.push(`Could not upload ${file.name}.`);
        continue;
      }

      const { data: publicUrl } = supabase.storage.from("lead-media").getPublicUrl(path);
      paths.push(publicUrl.publicUrl);
    } catch (fileError) {
      logPipelineError("lead photo exception", fileError, {
        step: "tryUploadLeadPhotos",
        leadId: quoteRequestId,
        details: { fileName: file.name },
      });
      warnings.push(`Could not upload ${file.name}.`);
    }
  }

  return { paths, warnings };
}

export async function appendLeadPhotoPaths(quoteRequestId: string, paths: string[]) {
  if (!paths.length) return;

  const supabase = tryCreateServiceClient();
  if (!supabase) return;

  const { data: existing, error: readError } = await supabase
    .from("quote_requests")
    .select("photo_urls")
    .eq("id", quoteRequestId)
    .single();

  if (readError) {
    logPipelineError("photo_urls read failed", readError, {
      step: "appendLeadPhotoPaths",
      leadId: quoteRequestId,
    });
    throw new Error(readError.message);
  }

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
    logPipelineError("photo_urls update failed", error, {
      step: "appendLeadPhotoPaths",
      leadId: quoteRequestId,
    });
    throw new Error(error.message);
  }

  logPipelineInfo("photo_urls saved", {
    step: "appendLeadPhotoPaths",
    leadId: quoteRequestId,
    details: { count: paths.length },
  });
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${quoteRequestId}`);
}
