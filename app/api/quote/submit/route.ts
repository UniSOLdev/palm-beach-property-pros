import { NextResponse } from "next/server";
import { submitQuoteRequest } from "@/lib/site/actions/submit-quote-request";

export const runtime = "nodejs";

/** POST /api/quote/submit — JSON wrapper for quote form (mirrors server action). */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await submitQuoteRequest(formData);
    const status = result.ok ? 200 : result.code === "VALIDATION_ERROR" ? 400 : 503;
    return NextResponse.json(result, { status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to submit right now. Please call us directly.",
        code: "SERVICE_UNAVAILABLE",
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
