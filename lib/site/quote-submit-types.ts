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
      /** Included in development and server logs — never expose raw DB errors to users in prod */
      debug?: string;
    };

export function isDevEnvironment() {
  return process.env.NODE_ENV === "development";
}

export function publicErrorMessage(userMessage: string, debug: string, code: QuoteSubmitErrorCode): QuoteRequestResult {
  return {
    ok: false,
    error: userMessage,
    code,
    ...(isDevEnvironment() ? { debug } : {}),
  };
}
