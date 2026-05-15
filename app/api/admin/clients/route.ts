import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const idsRaw = (searchParams.get("ids") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "30") || 30, 60);

  try {
    const supabase = createServiceSupabase();

    if (idsRaw.length > 0) {
      const ids = idsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      if (ids.length === 0) {
        return NextResponse.json({ clients: [] });
      }
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, phone, email, created_at")
        .in("id", ids);
      if (error) throw error;
      return NextResponse.json({ clients: data ?? [] });
    }

    let query = supabase
      .from("clients")
      .select("id, full_name, phone, email, created_at")
      .order("full_name", { ascending: true })
      .limit(limit);

    if (q.length > 0) {
      const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(
        `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ clients: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { full_name?: string; phone?: string | null; email?: string | null; notes?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const full_name = (body.full_name ?? "").trim();
  if (!full_name) {
    return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        full_name,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .select("id, full_name, phone, email, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ client: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
