import { NextResponse } from "next/server";
import { submitQuoteRequest } from "@/lib/site/actions/submit-quote-request";
import { QUOTE_ERRORS } from "@/lib/site/quote-submit-types";

export const runtime = "nodejs";

/** POST /api/quote/submit — JSON wrapper for quote form (mirrors server action). */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await submitQuoteRequest(formData);
    const status = result.ok
      ? 200
      : result.code === "VALIDATION_ERROR"
        ? 400
        : result.code === "MISSING_ENV" || result.code === "SCHEMA_MISSING"
          ? 503
          : 500;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("[PBPP Quote API] unhandled error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: QUOTE_ERRORS.unexpected,
        code: "SERVICE_UNAVAILABLE",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
