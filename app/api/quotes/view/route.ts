import { NextResponse } from "next/server";
import { markQuoteViewed } from "@/lib/quotes/sign-quote";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const publicId = typeof body?.publicId === "string" ? body.publicId.trim() : "";
    if (!publicId) {
      return NextResponse.json({ ok: false, error: "Missing publicId" }, { status: 400 });
    }
    const viewed = await markQuoteViewed(publicId);
    return NextResponse.json({ ok: viewed });
  } catch (error) {
    console.error("[PBPP Quote View API]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
