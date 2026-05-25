export type ReceiptScanErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "UPLOAD"
  | "IMAGE_PROCESS"
  | "OCR"
  | "TIMEOUT"
  | "CONFIG";

export class ReceiptScanError extends Error {
  readonly code: ReceiptScanErrorCode;
  readonly status: number;
  readonly userMessage: string;

  constructor(code: ReceiptScanErrorCode, userMessage: string, status = 400) {
    super(userMessage);
    this.name = "ReceiptScanError";
    this.code = code;
    this.userMessage = userMessage;
    this.status = status;
  }
}

export function toUserScanMessage(error: unknown): string {
  if (error instanceof ReceiptScanError) return error.userMessage;
  if (error instanceof Error) return error.message;
  return "Receipt scan failed. You can still enter details manually.";
}
