import { NextResponse } from "next/server";
import { signQuote } from "@/lib/quotes/sign-quote";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await signQuote(body, request.headers);
    const status = result.ok
      ? 200
      : result.code === "VALIDATION_ERROR"
        ? 400
        : result.code === "NOT_FOUND"
          ? 404
          : result.code === "ALREADY_SIGNED" || result.code === "DECLINED"
            ? 409
            : 500;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("[PBPP Quote Sign API]", error);
    return NextResponse.json(
      { ok: false, error: "Unable to sign estimate.", code: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}
