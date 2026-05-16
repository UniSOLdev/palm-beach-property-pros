import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks/constants";
import { getTaskById } from "@/lib/tasks/queries";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const { task, using_fallback } = await getTaskById(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ task, using_fallback });
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  if (id.startsWith("demo-")) {
    return NextResponse.json({ error: "Demo tasks are read-only" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.action === "complete") {
    patch.status = "Completed";
    patch.completed_at = new Date().toISOString();
  } else if (body.action === "reopen") {
    patch.status = "Open";
    patch.completed_at = null;
  } else if (body.action === "archive") {
    patch.archived = true;
  } else {
    const fields = [
      "title",
      "description",
      "status",
      "priority",
      "category",
      "due_date",
      "due_time",
      "assigned_crew_member_id",
      "client_id",
      "job_id",
      "quote_id",
      "invoice_id",
      "internal_notes",
    ] as const;
    for (const key of fields) {
      if (key in body) patch[key] = body[key];
    }
    if (body.status === "Completed") {
      patch.completed_at = body.completed_at ?? new Date().toISOString();
    } else if (body.status && body.status !== "Completed") {
      patch.completed_at = null;
    }
  }

  if (patch.status && !TASK_STATUSES.includes(patch.status as (typeof TASK_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (patch.priority && !TASK_PRIORITIES.includes(patch.priority as (typeof TASK_PRIORITIES)[number])) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("admin_tasks").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (id.startsWith("demo-")) {
    return NextResponse.json({ error: "Demo tasks cannot be deleted" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from("admin_tasks")
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
