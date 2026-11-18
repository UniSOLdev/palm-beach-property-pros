import { NextResponse } from "next/server";
import { handleInquiry } from "@/lib/site/quote-inquiry";

export const runtime = "nodejs";

/** POST /api/quote/request — private quote request from the public site. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const result = await handleInquiry(body);
  if (result.ok) return NextResponse.json({ ok: true });
  return NextResponse.json(
    { ok: false, error: result.error, fieldErrors: result.fieldErrors },
    { status: result.status },
  );
}
