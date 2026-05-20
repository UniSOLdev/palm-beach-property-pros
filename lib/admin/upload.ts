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
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
