import { RECEIPT_BUCKETS } from "@/lib/receipt/buckets";
import { signReceiptAssets } from "@/lib/receipt/signed-urls";
import { createServiceClient } from "@/lib/supabase/service";

export type ReceiptUploadResult = {
  receipt_storage_path: string;
  receipt_original_path: string;
  optimized_storage_path: string | null;
  receipt_optimized_path: string | null;
  receipt_thumbnail_path: string | null;
  receipt_url: string;
  optimized_image_url: string | null;
  thumbnail_url: string | null;
  normalized_paths: string[];
  thumbnail_paths: string[];
};

function buildAssetFolder(pathPrefix: string, assetId: string): string {
  const base = pathPrefix.replace(/\/$/, "") || "expenses";
  return `${base}/pending/${assetId}`;
}

export async function uploadReceiptBuffers(input: {
  original: { buffer: Buffer; mime: string; ext: string };
  optimizedPages?: { buffer: Buffer; thumbnail: Buffer; mime: string; page: number }[];
  pathPrefix: string;
  expenseId?: string | null;
}): Promise<ReceiptUploadResult> {
  const supabase = createServiceClient();
  const assetId = crypto.randomUUID();
  const folder = input.expenseId
    ? `expenses/${input.expenseId}`
    : buildAssetFolder(input.pathPrefix, assetId);

  const originalPath = `${folder}/${assetId}-original.${input.original.ext}`;

  const { error: origErr } = await supabase.storage
    .from(RECEIPT_BUCKETS.original)
    .upload(originalPath, input.original.buffer, {
      contentType: input.original.mime,
      cacheControl: "3600",
      upsert: false,
    });
  if (origErr) throw new Error(`Receipt upload failed: ${origErr.message}`);

  const pages = input.optimizedPages ?? [];
  const normalized_paths: string[] = [];
  const thumbnail_paths: string[] = [];
  let optimizedPath: string | null = null;
  let thumbnailPath: string | null = null;

  for (const page of pages) {
    const suffix = page.page === 1 ? "ocr" : `ocr-p${page.page}`;
    const ocrPath = `${folder}/${assetId}-${suffix}.jpg`;
    const thumbPath = `${folder}/${assetId}-${page.page === 1 ? "thumb" : `thumb-p${page.page}`}.jpg`;

    const { error: optErr } = await supabase.storage
      .from(RECEIPT_BUCKETS.optimized)
      .upload(ocrPath, page.buffer, {
        contentType: page.mime,
        cacheControl: "3600",
        upsert: false,
      });
    if (optErr) throw new Error(`Optimized receipt upload failed: ${optErr.message}`);

    const { error: thumbErr } = await supabase.storage
      .from(RECEIPT_BUCKETS.thumbnail)
      .upload(thumbPath, page.thumbnail, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
    if (thumbErr) throw new Error(`Thumbnail upload failed: ${thumbErr.message}`);

    normalized_paths.push(ocrPath);
    thumbnail_paths.push(thumbPath);
    if (page.page === 1) {
      optimizedPath = ocrPath;
      thumbnailPath = thumbPath;
    }
  }

  const signed = await signReceiptAssets({
    receipt_original_path: originalPath,
    receipt_optimized_path: optimizedPath,
    receipt_thumbnail_path: thumbnailPath,
  });

  return {
    receipt_storage_path: originalPath,
    receipt_original_path: originalPath,
    optimized_storage_path: optimizedPath,
    receipt_optimized_path: optimizedPath,
    receipt_thumbnail_path: thumbnailPath,
    receipt_url: signed.receipt_url ?? "",
    optimized_image_url: signed.optimized_image_url,
    thumbnail_url: signed.thumbnail_url,
    normalized_paths,
    thumbnail_paths,
  };
}

export async function uploadDebugArtifact(input: {
  folder: string;
  name: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string | null> {
  const supabase = createServiceClient();
  const path = `${input.folder}/${input.name}`;
  const { error } = await supabase.storage.from(RECEIPT_BUCKETS.debug).upload(path, input.buffer, {
    contentType: input.contentType,
    upsert: true,
  });
  if (error) return null;
  return path;
}
