import { NextResponse } from "next/server";
import { declineQuote } from "@/lib/quotes/sign-quote";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await declineQuote(body, request.headers);
    const status = result.ok
      ? 200
      : result.code === "VALIDATION_ERROR"
        ? 400
        : result.code === "NOT_FOUND"
          ? 404
          : result.code === "ALREADY_SIGNED" || result.code === "ALREADY_DECLINED"
            ? 409
            : 500;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("[PBPP Quote Decline API]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to decline estimate.", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
