"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listMediaAssets as queryMediaAssets } from "@/lib/supabase/queries/media";
import type { MediaAssetRow } from "@/lib/supabase/queries/media";
import { toUserMediaMessage } from "@/lib/admin/media-errors";
import { buildOptimizedStoragePath, MEDIA_LIBRARY_BUCKET } from "@/lib/admin/media-upload";
import {
  convertImageToWebp,
  logMediaUpload,
  logMediaUploadError,
} from "@/lib/admin/media-pipeline.server";

export type { MediaAssetRow };

export type RegisterMediaAssetInput = {
  storagePath: string;
  publicUrl: string;
  fileName: string;
  mimeType: string;
  fileType: "image" | "video";
  fileSizeBytes: number;
  folderId?: string | null;
  title?: string;
  altText?: string;
};

export type RegisterMediaAssetResult =
  | { ok: true; asset: MediaAssetRow }
  | { ok: false; code: string; message: string };

export async function listMediaAssets(options?: {
  folderId?: string;
  search?: string;
  sort?: "newest" | "oldest" | "name";
  limit?: number;
}) {
  const supabase = await createClient();
  const result = await queryMediaAssets(supabase, options);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export async function registerMediaAsset(input: RegisterMediaAssetInput): Promise<RegisterMediaAssetResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "UNAUTHORIZED", message: "Sign in to upload media." };
  }

  logMediaUpload("db insert start", {
    storagePath: input.storagePath,
    folderId: input.folderId ?? null,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });

  const optimizationStatus = input.fileType === "video" ? "skipped" : "pending";

  const { data, error } = await supabase
    .from("media_assets")
    .insert({
      folder_id: input.folderId || null,
      file_url: input.publicUrl,
      storage_path: input.storagePath,
      file_type: input.fileType,
      title: input.title ?? input.fileName,
      alt_text: input.altText ?? null,
      file_size_bytes: input.fileSizeBytes,
      optimization_status: optimizationStatus,
    })
    .select("*")
    .single();

  if (error || !data) {
    logMediaUploadError("db insert failed", error ?? new Error("No row returned"), {
      storagePath: input.storagePath,
    });
    return {
      ok: false,
      code: "DB_INSERT_FAILED",
      message: error?.message ?? "Could not save media record.",
    };
  }

  const asset = data as MediaAssetRow;

  logMediaUpload("db insert success", {
    assetId: asset.id,
    storagePath: input.storagePath,
    publicUrl: input.publicUrl,
  });

  revalidatePath("/admin/website/media");

  if (input.fileType === "image") {
    after(async () => {
      await optimizeMediaAsset(asset.id);
    });
  }

  logMediaUpload("final persisted asset", {
    assetId: asset.id,
    storagePath: asset.storage_path,
    fileUrl: asset.file_url,
    optimizationStatus,
  });

  return { ok: true, asset };
}

/** Async WebP optimization — never deletes the original on failure. */
export async function optimizeMediaAsset(assetId: string): Promise<void> {
  const supabase = await createClient();

  const { data: asset, error: readError } = await supabase
    .from("media_assets")
    .select("id, storage_path, file_type, file_url")
    .eq("id", assetId)
    .maybeSingle();

  if (readError || !asset?.storage_path) {
    logMediaUploadError("optimize read failed", readError ?? new Error("Asset not found"), { assetId });
    return;
  }

  if (asset.file_type !== "image") {
    await supabase
      .from("media_assets")
      .update({ optimization_status: "skipped", optimization_error: null })
      .eq("id", assetId);
    return;
  }

  logMediaUpload("conversion start", { assetId, storagePath: asset.storage_path });

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from(MEDIA_LIBRARY_BUCKET)
      .download(asset.storage_path);

    if (downloadError || !blob) {
      throw downloadError ?? new Error("Download returned empty");
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const ext = asset.storage_path.split(".").pop()?.toLowerCase() ?? "";
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "heic" || ext === "heif"
            ? "image/heic"
            : "image/jpeg";

    const optimized = await convertImageToWebp(buffer, mime, asset.storage_path);

    const { error: uploadError } = await supabase.storage
      .from(MEDIA_LIBRARY_BUCKET)
      .upload(optimized.webpPath, optimized.buffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(MEDIA_LIBRARY_BUCKET).getPublicUrl(optimized.webpPath);

    logMediaUpload("public URL generated", {
      assetId,
      webpPath: optimized.webpPath,
      publicUrl: urlData.publicUrl,
    });

    const { error: updateError } = await supabase
      .from("media_assets")
      .update({
        webp_url: urlData.publicUrl,
        width: optimized.width,
        height: optimized.height,
        optimization_status: "complete",
        optimization_error: null,
      })
      .eq("id", assetId);

    if (updateError) throw updateError;

    logMediaUpload("conversion finish", { assetId, webpUrl: urlData.publicUrl });
    revalidatePath("/admin/website/media");
  } catch (error) {
    const { code, message } = toUserMediaMessage(error);
    logMediaUploadError("conversion failed — original preserved", error, { assetId });

    await supabase
      .from("media_assets")
      .update({
        optimization_status: "failed",
        optimization_error: message,
      })
      .eq("id", assetId);

    revalidatePath("/admin/website/media");

    logMediaUpload("conversion_failed marker set", { assetId, code });
  }
}

export async function updateMediaAsset(
  id: string,
  patch: Partial<
    Pick<
      MediaAssetRow,
      | "title"
      | "alt_text"
      | "caption"
      | "tags"
      | "service_category"
      | "city"
      | "job_reference"
      | "before_after_group"
      | "before_after_role"
      | "is_featured"
      | "collection_id"
      | "folder_id"
    >
  >,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("media_assets").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/media");
}

export async function deleteMediaAsset(id: string) {
  const supabase = await createClient();
  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_path, webp_url")
    .eq("id", id)
    .maybeSingle();

  const pathsToRemove: string[] = [];
  if (asset?.storage_path) {
    pathsToRemove.push(asset.storage_path);
    pathsToRemove.push(buildOptimizedStoragePath(asset.storage_path));
  }

  if (pathsToRemove.length) {
    await supabase.storage.from(MEDIA_LIBRARY_BUCKET).remove(pathsToRemove);
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/website/media");
}

export async function suggestAltText(title: string, serviceCategory?: string | null) {
  const base = title.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
  const category = serviceCategory?.trim();
  if (category && base) return `${category} — ${base} | Palm Beach Property Pros`;
  if (base) return `${base} | Palm Beach Property Pros property service photo`;
  return "Palm Beach Property Pros property service photo";
}

export async function suggestCaption(title: string, city?: string | null) {
  const base = title.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim();
  if (city && base) return `${base} — ${city}, FL`;
  return base || "Project photo";
}

export async function retryMediaOptimization(assetId: string) {
  await optimizeMediaAsset(assetId);
}
