import { NextResponse, type NextRequest } from "next/server";

/**
 * Private referral links: /r/<code> -> /quote tagged as a referral.
 *
 *   /r/club-a                         -> /quote?utm_source=referral&utm_medium=member&utm_campaign=club-a
 *   /r/club-a?service=Holiday%20Lighting  (optional: preselect a service)
 *
 * Codes are neutral labels (never a club, community, or client name). The quote form already
 * records utm_* as the lead source, so every lead from a circle can be counted.
 */
export function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return params.then(({ code }) => {
    const clean = code.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "general";
    const url = new URL("/quote", req.url);
    url.searchParams.set("utm_source", "referral");
    url.searchParams.set("utm_medium", "member");
    url.searchParams.set("utm_campaign", clean);
    const service = req.nextUrl.searchParams.get("service");
    if (service) url.searchParams.set("service", service.slice(0, 80));
    return NextResponse.redirect(url, 307);
  });
}
