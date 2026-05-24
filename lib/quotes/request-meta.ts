import { headers } from "next/headers";

/** Best-effort client IP from Vercel/proxy headers. */
export function getClientIpFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = h.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "unknown";
}

export async function getRequestClientIp(): Promise<string> {
  const h = await headers();
  return getClientIpFromHeaders(h);
}

export function getUserAgentFromHeaders(h: Headers): string {
  return (h.get("user-agent") ?? "unknown").slice(0, 512);
}
