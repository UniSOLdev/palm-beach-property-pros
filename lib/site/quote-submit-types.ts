export type QuoteSubmitErrorCode =
  | "VALIDATION_ERROR"
  | "MISSING_ENV"
  | "SCHEMA_MISSING"
  | "INSERT_FAILED"
  | "SERVICE_UNAVAILABLE";

export type QuoteRequestResult =
  | { ok: true; leadId: string; photoWarnings?: string[] }
  | {
      ok: false;
      error: string;
      code: QuoteSubmitErrorCode;
      debug?: string;
    };

export function isDevEnvironment() {
  return process.env.NODE_ENV === "development";
}

export type QuoteRequestFailure = Extract<QuoteRequestResult, { ok: false }>;

export function quoteSubmitError(
  userMessage: string,
  debug: string,
  code: QuoteSubmitErrorCode,
): QuoteRequestFailure {
  return {
    ok: false,
    error: userMessage,
    code,
    ...(isDevEnvironment() ? { debug } : {}),
  };
}

/** User-facing messages — no generic "temporarily unavailable" copy. */
export const QUOTE_ERRORS = {
  validation: "Please complete all required fields (name, phone, service, and address).",
  config:
    "Online quote submission is not configured yet. Please call us and we will help you directly.",
  schema:
    "Our quote system is being set up. Please call us with your property details and we will send a written estimate.",
  insert:
    "We could not save your request. Please try again in a moment, or call us directly.",
  photosSaved:
    "Your request was saved. Some photos could not be uploaded — you can text them to us instead.",
  unexpected: "Something unexpected happened. Please try again or call us.",
} as const;
