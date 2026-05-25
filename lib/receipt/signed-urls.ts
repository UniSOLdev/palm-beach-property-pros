import { createServiceClient } from "@/lib/supabase/service";
import {
  LEGACY_RECEIPT_BUCKETS,
  RECEIPT_BUCKETS,
  resolveOptimizedBucket,
  resolveOriginalBucket,
} from "@/lib/receipt/buckets";

export const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 7;

export async function signReceiptPath(
  bucket: string,
  path: string,
  ttlSec = SIGNED_URL_TTL_SEC,
): Promise<string | null> {
  if (!path?.trim()) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function signReceiptAssets(input: {
  receipt_original_path?: string | null;
  receipt_optimized_path?: string | null;
  receipt_thumbnail_path?: string | null;
  receipt_storage_path?: string | null;
  optimized_storage_path?: string | null;
}): Promise<{
  receipt_url: string | null;
  optimized_image_url: string | null;
  thumbnail_url: string | null;
}> {
  const originalPath = input.receipt_original_path ?? input.receipt_storage_path ?? null;
  const optimizedPath = input.receipt_optimized_path ?? input.optimized_storage_path ?? null;
  const thumbPath = input.receipt_thumbnail_path ?? null;

  const [receipt_url, optimized_image_url, thumbnail_url] = await Promise.all([
    originalPath
      ? signReceiptPath(resolveOriginalBucket(originalPath), originalPath)
      : Promise.resolve(null),
    optimizedPath
      ? signReceiptPath(resolveOptimizedBucket(optimizedPath), optimizedPath)
      : Promise.resolve(null),
    thumbPath
      ? signReceiptPath(RECEIPT_BUCKETS.thumbnail, thumbPath)
      : Promise.resolve(null),
  ]);

  return { receipt_url, optimized_image_url, thumbnail_url };
}

export function legacyOriginalBucketForPath(path: string): string {
  return path.includes("-original.") ? resolveOriginalBucket(path) : LEGACY_RECEIPT_BUCKETS.original;
}
