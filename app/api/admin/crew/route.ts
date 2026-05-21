import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { parseCrewMemberPayload } from "@/lib/crew-payload";
import { mapCrewMemberRow } from "@/lib/crew-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

function sanitizeSearch(q: string): string {
  return q.replace(/%/g, "").replace(/_/g, "").replace(/,/g, "").trim().slice(0, 120);
}

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = sanitizeSearch(searchParams.get("q") ?? "");
  const status = (searchParams.get("status") ?? "").trim();
  const role = (searchParams.get("role") ?? "").trim();
  const activeOnly = searchParams.get("active") !== "0";
  const limit = Math.min(Number(searchParams.get("limit") ?? "200") || 200, 300);

  try {
    const supabase = createServiceSupabase();
    let query = supabase
      .from("crew_members")
      .select("*")
      .order("full_name", { ascending: true })
      .limit(limit);

    if (activeOnly) query = query.eq("is_active", true);
    if (status) query = query.eq("status", status);
    if (role) query = query.eq("role", role);
    if (q) {
      const p = `%${q}%`;
      query = query.or(`full_name.ilike.${p},phone.ilike.${p},email.ilike.${p},notes.ilike.${p}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ members: (data ?? []).map((row) => mapCrewMemberRow(row as Record<string, unknown>)) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCrewMemberPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("crew_members").insert(parsed.data).select("*").single();
    if (error) throw error;
    return NextResponse.json({ member: mapCrewMemberRow(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
