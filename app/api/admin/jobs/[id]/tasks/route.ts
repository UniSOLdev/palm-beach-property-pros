import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { logOperationalActivity } from "@/lib/ops/activity";
import { mapOperationalTaskRow, normalizeTaskPriority } from "@/lib/task-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

function cleanNullable(value: unknown): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("operational_tasks")
      .select("*")
      .eq("job_id", id)
      .order("priority_rank", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ tasks: (data ?? []).map((row) => mapOperationalTaskRow(row as Record<string, unknown>)) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    title?: string;
    client_id?: string | null;
    priority?: string;
    due_at?: string | null;
    recurring_rule?: string | null;
    assigned_crew_name?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Task title is required" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, client_id")
      .eq("id", id)
      .maybeSingle();
    if (jobErr) throw jobErr;
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const { count, error: countErr } = await supabase
      .from("operational_tasks")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    if (countErr) throw countErr;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("operational_tasks")
      .insert({
        job_id: id,
        client_id: cleanNullable(body.client_id) ?? (job.client_id as string | null),
        title,
        priority: normalizeTaskPriority(body.priority),
        priority_rank: (count ?? 0) + 1,
        due_at: cleanNullable(body.due_at),
        recurring_rule: cleanNullable(body.recurring_rule),
        assigned_crew_name: cleanNullable(body.assigned_crew_name),
        activity_log: [{ id: crypto.randomUUID(), type: "created", label: "Task created", created_at: now }],
      })
      .select("*")
      .single();

    if (error) throw error;
    const task = mapOperationalTaskRow(data as Record<string, unknown>);
    await logOperationalActivity(supabase, {
      event_type: "task.created",
      title: `Task created: ${task.title}`,
      body: `Priority: ${task.priority}`,
      job_id: id,
      client_id: task.client_id,
      task_id: task.id,
      href: `/admin/jobs/${id}`,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { ordered_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderedIds = Array.isArray(body.ordered_ids) ? body.ordered_ids.map((v) => String(v)) : [];
  if (orderedIds.length === 0) {
    return NextResponse.json({ error: "ordered_ids is required" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const updates = orderedIds.map((taskId, index) =>
      supabase
        .from("operational_tasks")
        .update({ priority_rank: index + 1, updated_at: new Date().toISOString() })
        .eq("job_id", id)
        .eq("id", taskId),
    );
    const results = await Promise.all(updates);
    const firstError = results.find((result) => result.error)?.error;
    if (firstError) throw firstError;

    const { data, error } = await supabase
      .from("operational_tasks")
      .select("*")
      .eq("job_id", id)
      .order("priority_rank", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    await logOperationalActivity(supabase, {
      event_type: "task.reordered",
      title: "Task priority order updated",
      job_id: id,
      href: `/admin/jobs/${id}`,
      metadata: { count: orderedIds.length },
    });

    return NextResponse.json({ tasks: (data ?? []).map((row) => mapOperationalTaskRow(row as Record<string, unknown>)) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
