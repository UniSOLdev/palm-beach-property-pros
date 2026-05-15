import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();

    const [invRes, jobRes] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, title, status, total_cents, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("jobs")
        .select("id, title, status, completed_at, created_at")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (invRes.error) throw invRes.error;
    if (jobRes.error) throw jobRes.error;

    return NextResponse.json({
      invoices: invRes.data ?? [],
      jobs: jobRes.data ?? [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
