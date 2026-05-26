export type MediaUploadErrorCode =
  | "UNAUTHORIZED"
  | "UNSUPPORTED_MIME"
  | "FILE_TOO_LARGE"
  | "STORAGE_REJECTED"
  | "DB_INSERT_FAILED"
  | "CONVERSION_FAILED"
  | "UPLOAD_TIMEOUT"
  | "VALIDATION";

export class MediaUploadError extends Error {
  readonly code: MediaUploadErrorCode;
  readonly status: number;
  readonly userMessage: string;

  constructor(code: MediaUploadErrorCode, userMessage: string, status = 400) {
    super(userMessage);
    this.name = "MediaUploadError";
    this.code = code;
    this.userMessage = userMessage;
    this.status = status;
  }
}

export function toUserMediaMessage(error: unknown): { code: MediaUploadErrorCode | "UNKNOWN"; message: string } {
  if (error instanceof MediaUploadError) {
    return { code: error.code, message: error.userMessage };
  }
  if (error instanceof Error) {
    return { code: "UNKNOWN", message: error.message };
  }
  return { code: "UNKNOWN", message: "Upload failed. Please try again." };
}

export const MEDIA_ERROR_LABELS: Record<MediaUploadErrorCode | "UNKNOWN", string> = {
  UNAUTHORIZED: "Sign in required",
  UNSUPPORTED_MIME: "Unsupported file type",
  FILE_TOO_LARGE: "File too large",
  STORAGE_REJECTED: "Storage rejected upload",
  DB_INSERT_FAILED: "Database save failed",
  CONVERSION_FAILED: "WebP conversion failed — original saved",
  UPLOAD_TIMEOUT: "Upload timed out",
  VALIDATION: "Invalid file",
  UNKNOWN: "Upload failed",
};
