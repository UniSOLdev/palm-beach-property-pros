import { z } from "zod";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  size: z.number().max(MAX_FILE_BYTES, "File must be under 10MB"),
  type: z.string(),
});

export const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const receiptMimeTypes = [...imageMimeTypes, "application/pdf"] as const;

export function validateUploadFile(
  file: File,
  allowed: readonly string[],
): { ok: true } | { ok: false; error: string } {
  const parsed = uploadFileSchema.safeParse({ name: file.name, size: file.size, type: file.type });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file" };
  }
  if (!allowed.includes(file.type)) {
    return { ok: false, error: `File type ${file.type || "unknown"} is not allowed` };
  }
  return { ok: true };
}
