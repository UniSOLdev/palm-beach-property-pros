import { NextResponse } from "next/server";

/** Validates Vercel Cron or manual trigger with CRON_SECRET. */
export function authorizeCron(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Dev/local: allow when explicitly enabled
    if (process.env.NODE_ENV === "development" && process.env.ALLOW_DEV_CRON === "true") {
      return null;
    }
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return null;

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret === secret) return null;

  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
