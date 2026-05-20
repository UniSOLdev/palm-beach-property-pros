"use client";

import { createClient } from "@/lib/supabase/client";

export async function uploadAdminFile(
  bucket: "receipts" | "job-media" | "cms-media" | "media-library",
  file: File,
  pathPrefix: string,
) {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${pathPrefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  if (bucket === "job-media" || bucket === "receipts") {
    const { data: signed, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signError) throw new Error(signError.message);
    return { path, publicUrl: signed.signedUrl };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function refreshSignedUrl(bucket: "job-media" | "receipts", path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
