import "server-only";

import { headers } from "next/headers";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function checkQuoteRateLimit(): Promise<{ ok: true } | { ok: false; error: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip") || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { ok: false, error: "Too many requests. Please wait a minute and try again." };
  }

  entry.count += 1;
  return { ok: true };
}
