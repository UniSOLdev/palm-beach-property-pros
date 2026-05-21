import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  appendTaskActivity,
  appendTaskComment,
  mapOperationalTaskRow,
  normalizeTaskPriority,
  normalizeTaskStatus,
  parseTaskPhotoUrls,
} from "@/lib/task-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string; taskId: string }> };

function cleanNullable(value: unknown): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await params;
  let body: {
    title?: string;
    status?: string;
    priority?: string;
    due_at?: string | null;
    recurring_rule?: string | null;
    assigned_crew_member_id?: string | null;
    assigned_crew_name?: string | null;
    completion_photo_urls?: unknown;
    comment_body?: string | null;
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
    const { data: current, error: curErr } = await supabase
      .from("operational_tasks")
      .select("*")
      .eq("job_id", id)
      .eq("id", taskId)
      .maybeSingle();
    if (curErr) throw curErr;
    if (!current) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const nextStatus = normalizeTaskStatus(body.status);
    const currentStatus = normalizeTaskStatus((current as Record<string, unknown>).status);
    const completedAt = nextStatus === "done"
      ? ((current as Record<string, unknown>).completed_at ?? new Date().toISOString())
      : null;
    let comments = (current as Record<string, unknown>).comments;
    if (body.comment_body) {
      comments = appendTaskComment(comments, body.comment_body);
    }

    let activity = appendTaskActivity((current as Record<string, unknown>).activity_log, "updated", "Task details updated");
    if (nextStatus !== currentStatus) {
      activity = appendTaskActivity(activity, "status", `Status changed to ${nextStatus.replace(/_/g, " ")}`);
    }
    if (body.comment_body) {
      activity = appendTaskActivity(activity, "comment", "Comment added");
    }

    const { data, error } = await supabase
      .from("operational_tasks")
      .update({
        title,
        status: nextStatus,
        priority: normalizeTaskPriority(body.priority),
        due_at: cleanNullable(body.due_at),
        recurring_rule: cleanNullable(body.recurring_rule),
        assigned_crew_member_id: cleanNullable(body.assigned_crew_member_id),
        assigned_crew_name: cleanNullable(body.assigned_crew_name),
        completion_photo_urls: parseTaskPhotoUrls(body.completion_photo_urls),
        comments,
        activity_log: activity,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", id)
      .eq("id", taskId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ task: mapOperationalTaskRow(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await params;

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from("operational_tasks")
      .delete()
      .eq("job_id", id)
      .eq("id", taskId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
