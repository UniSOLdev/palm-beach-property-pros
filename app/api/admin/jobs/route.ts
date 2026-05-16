import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { JOB_DETAIL_SELECT } from "@/lib/job-queries";
import { mapJobDetailPayload, mapJobListItem } from "@/lib/job-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "100") || 100, 250);

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        id,
        job_number,
        title,
        status,
        client_id,
        revenue_cents,
        service_type,
        created_at,
        updated_at,
        clients ( full_name )
      `,
      )
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const jobs = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const c = r.clients;
      const name = Array.isArray(c) ? (c[0] as { full_name?: string })?.full_name : (c as { full_name?: string })?.full_name;
      return mapJobListItem(r, name ? String(name) : null);
    });

    return NextResponse.json({ jobs });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; client_id?: string | null; job_number?: string | null };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const title = (body.title ?? "New job").trim() || "New job";
  const job_number =
    body.job_number?.trim() ||
    `JOB-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        title,
        client_id: body.client_id?.trim() || null,
        job_number,
        status: "scheduled",
        crew_assignments: [],
      })
      .select(JOB_DETAIL_SELECT)
      .single();

    if (error) throw error;
    return NextResponse.json({ job: mapJobDetailPayload(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
