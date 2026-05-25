import { createServiceClient } from "@/lib/supabase/service";

const SIGNED_TTL_SEC = 60 * 60 * 24 * 7;

export async function uploadReceiptBuffers(input: {
  original: { buffer: Buffer; mime: string; ext: string };
  optimized?: { buffer: Buffer; mime: string };
  pathPrefix: string;
}): Promise<{
  receipt_storage_path: string;
  optimized_storage_path: string | null;
  receipt_url: string;
  optimized_image_url: string | null;
}> {
  const supabase = createServiceClient();
  const id = crypto.randomUUID();
  const originalPath = `${input.pathPrefix}/${id}-original.${input.original.ext}`;
  const { error: origErr } = await supabase.storage.from("receipts").upload(originalPath, input.original.buffer, {
    contentType: input.original.mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (origErr) throw new Error(`Receipt upload failed: ${origErr.message}`);

  let optimizedPath: string | null = null;
  if (input.optimized) {
    optimizedPath = `${input.pathPrefix}/${id}-ocr.jpg`;
    const { error: optErr } = await supabase.storage
      .from("receipts-optimized")
      .upload(optimizedPath, input.optimized.buffer, {
        contentType: input.optimized.mime,
        cacheControl: "3600",
        upsert: false,
      });
    if (optErr) throw new Error(`Optimized receipt upload failed: ${optErr.message}`);
  }

  const { data: receiptSigned, error: signErr } = await supabase.storage
    .from("receipts")
    .createSignedUrl(originalPath, SIGNED_TTL_SEC);
  if (signErr) throw new Error(signErr.message);

  let optimized_image_url: string | null = null;
  if (optimizedPath) {
    const { data: optSigned, error: optSignErr } = await supabase.storage
      .from("receipts-optimized")
      .createSignedUrl(optimizedPath, SIGNED_TTL_SEC);
    if (optSignErr) throw new Error(optSignErr.message);
    optimized_image_url = optSigned.signedUrl;
  }

  return {
    receipt_storage_path: originalPath,
    optimized_storage_path: optimizedPath,
    receipt_url: receiptSigned.signedUrl,
    optimized_image_url,
  };
}
