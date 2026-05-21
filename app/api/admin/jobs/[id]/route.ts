import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { JOB_DETAIL_SELECT } from "@/lib/job-queries";
import { mapJobDetailPayload, parseCrewAssignments } from "@/lib/job-serialization";
import { resolveJobClientAndValidate } from "@/lib/job-relations";
import { logOperationalActivity } from "@/lib/ops/activity";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("jobs").select(JOB_DETAIL_SELECT).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ job: mapJobDetailPayload(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    row_version?: number;
    title?: string;
    status?: string;
    client_id?: string | null;
    service_type?: string | null;
    property_address?: string | null;
    revenue_cents?: number;
    payment_method?: string | null;
    quote_id?: string | null;
    invoice_id?: string | null;
    crew_assignments?: unknown;
    notes?: string | null;
    internal_notes?: string | null;
    referral_source?: string | null;
    review_requested?: boolean;
    completed_at?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const expectedVersion = Number(body.row_version);
  if (!Number.isFinite(expectedVersion)) {
    return NextResponse.json({ error: "row_version is required" }, { status: 400 });
  }

  const crew_assignments = parseCrewAssignments(body.crew_assignments);
  const revenue_cents = Math.max(0, Math.round(Number(body.revenue_cents) || 0));

  let quote_id: string | null = body.quote_id?.trim() || null;
  let invoice_id: string | null = body.invoice_id?.trim() || null;
  if (quote_id === "") quote_id = null;
  if (invoice_id === "") invoice_id = null;

  let client_id: string | null = body.client_id?.trim() || null;
  if (client_id === "") client_id = null;

  try {
    const supabase = createServiceSupabase();

    const { data: current, error: curErr } = await supabase
      .from("jobs")
      .select("row_version")
      .eq("id", id)
      .maybeSingle();

    if (curErr) throw curErr;
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (Number(current.row_version) !== expectedVersion) {
      return NextResponse.json(
        {
          error: "ROW_VERSION_MISMATCH",
          message: "This job was updated elsewhere. Reload to get the latest version.",
          server_row_version: current.row_version,
        },
        { status: 409 },
      );
    }

    const resolved = await resolveJobClientAndValidate(supabase, {
      client_id,
      quote_id,
      invoice_id,
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.message }, { status: 400 });
    }
    client_id = resolved.client_id;

    const title = (body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const status = (body.status ?? "scheduled").trim() || "scheduled";
    const completed_at =
      body.completed_at === null || body.completed_at === undefined || body.completed_at === ""
        ? null
        : String(body.completed_at);

    const { data, error } = await supabase
      .from("jobs")
      .update({
        title,
        status,
        client_id,
        service_type: body.service_type?.trim() || null,
        property_address: body.property_address?.trim() || null,
        revenue_cents,
        payment_method: body.payment_method?.trim() || null,
        quote_id,
        invoice_id,
        crew_assignments,
        notes: body.notes?.trim() || null,
        internal_notes: body.internal_notes?.trim() || null,
        referral_source: body.referral_source?.trim() || null,
        review_requested: Boolean(body.review_requested),
        completed_at,
        updated_at: new Date().toISOString(),
        row_version: expectedVersion + 1,
      })
      .eq("id", id)
      .eq("row_version", expectedVersion)
      .select(JOB_DETAIL_SELECT)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        {
          error: "ROW_VERSION_MISMATCH",
          message: "Concurrent update detected. Reload and try again.",
        },
        { status: 409 },
      );
    }

    const job = mapJobDetailPayload(data as Record<string, unknown>);
    await logOperationalActivity(supabase, {
      event_type: "job.updated",
      title: `Job updated: ${job.title}`,
      body: `Status: ${job.status.replace(/_/g, " ")}`,
      job_id: job.id,
      client_id: job.client_id,
      invoice_id: job.invoice_id,
      href: `/admin/jobs/${job.id}`,
    });

    return NextResponse.json({ job });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
