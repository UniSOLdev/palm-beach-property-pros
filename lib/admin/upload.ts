"use client";

import { createClient } from "@/lib/supabase/client";
import { MediaUploadError } from "@/lib/admin/media-errors";
import { buildMediaStoragePath, validateMediaUpload } from "@/lib/admin/media-pipeline";

export type AdminUploadBucket =
  | "receipts"
  | "receipts-optimized"
  | "job-media"
  | "cms-media"
  | "media-library"
  | "website-media";

export type AdminUploadResult = {
  path: string;
  publicUrl: string;
  mimeType: string;
  fileType: "image" | "video";
};

const UPLOAD_TIMEOUT_MS = 120_000;

export async function uploadAdminFile(
  bucket: AdminUploadBucket,
  file: File,
  pathPrefix: string,
): Promise<AdminUploadResult> {
  const supabase = createClient();

  let mimeType = file.type;
  let fileType: "image" | "video" = file.type.startsWith("video") ? "video" : "image";

  if (bucket === "media-library") {
    const validated = validateMediaUpload(file);
    mimeType = validated.mime;
    fileType = validated.fileType;
  }

  const path =
    bucket === "media-library"
      ? buildMediaStoragePath(pathPrefix, file.name)
      : `${pathPrefix}/${crypto.randomUUID()}.${file.name.split(".").pop() ?? "bin"}`;

  console.info(
    "[PBPP Media Upload]",
    JSON.stringify({
      level: "info",
      step: "upload start",
      bucket,
      path,
      fileName: file.name,
      bytes: file.size,
      mimeType,
    }),
  );

  const uploadPromise = supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: mimeType || file.type || undefined,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new MediaUploadError("UPLOAD_TIMEOUT", "Upload timed out. Check your connection and try again.", 408)),
      UPLOAD_TIMEOUT_MS,
    );
  });

  const { error } = await Promise.race([uploadPromise, timeoutPromise]);

  if (error) {
    console.error(
      "[PBPP Media Upload]",
      JSON.stringify({ level: "error", step: "storage rejected", bucket, path, message: error.message }),
    );
    throw new MediaUploadError("STORAGE_REJECTED", error.message, 400);
  }

  console.info(
    "[PBPP Media Upload]",
    JSON.stringify({ level: "info", step: "upload success", bucket, path, storagePath: path }),
  );

  if (bucket === "job-media" || bucket === "receipts" || bucket === "receipts-optimized") {
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signError) throw new Error(signError.message);
    return { path, publicUrl: signed.signedUrl, mimeType, fileType };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  console.info(
    "[PBPP Media Upload]",
    JSON.stringify({ level: "info", step: "public URL generated", bucket, path, publicUrl: data.publicUrl }),
  );

  return { path, publicUrl: data.publicUrl, mimeType, fileType };
}

export async function refreshSignedUrl(
  bucket: "job-media" | "receipts" | "receipts-optimized",
  path: string,
) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
