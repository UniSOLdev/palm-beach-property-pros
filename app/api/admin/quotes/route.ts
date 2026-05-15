import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { mapQuoteRow } from "@/lib/quote-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "80") || 80, 200);

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("quotes")
      .select(
        "id, client_id, reference_code, status, total_cents, updated_at, created_at, service_type",
      )
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ quotes: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { client_id?: string | null; reference_code?: string | null };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const ref =
    body.reference_code?.trim() ||
    `Q-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("quotes")
      .insert({
        client_id: body.client_id?.trim() || null,
        reference_code: ref,
        status: "draft",
        line_items: [],
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ quote: mapQuoteRow(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
