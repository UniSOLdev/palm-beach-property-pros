import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks/constants";
import { listTasks } from "@/lib/tasks/queries";
import type { TaskListFilters } from "@/lib/tasks/types";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filters: TaskListFilters = {
    q: searchParams.get("q")?.trim() || undefined,
    status: searchParams.get("status")?.trim() || undefined,
    priority: searchParams.get("priority")?.trim() || undefined,
    category: searchParams.get("category")?.trim() || undefined,
    assigned_crew_member_id: searchParams.get("crew_id")?.trim() || undefined,
    client_id: searchParams.get("client_id")?.trim() || undefined,
    job_id: searchParams.get("job_id")?.trim() || undefined,
    due: (searchParams.get("due") as TaskListFilters["due"]) || undefined,
    include_archived: searchParams.get("archived") === "1",
  };

  const { tasks, using_fallback } = await listTasks(filters);
  return NextResponse.json({ tasks, using_fallback });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const status = String(body.status ?? "Open");
  const priority = String(body.priority ?? "Normal");
  if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  const category = body.category ? String(body.category) : null;
  if (category && !TASK_CATEGORIES.includes(category as (typeof TASK_CATEGORIES)[number])) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase not configured — tasks cannot be saved in demo mode" },
      { status: 503 },
    );
  }

  try {
    const supabase = createServiceSupabase();
    const completed = status === "Completed";
    const { data, error } = await supabase
      .from("admin_tasks")
      .insert({
        title,
        description: body.description ? String(body.description) : null,
        status,
        priority,
        category,
        due_date: body.due_date ? String(body.due_date) : null,
        due_time: body.due_time ? String(body.due_time) : null,
        assigned_crew_member_id: body.assigned_crew_member_id || null,
        client_id: body.client_id || null,
        job_id: body.job_id || null,
        quote_id: body.quote_id || null,
        invoice_id: body.invoice_id || null,
        internal_notes: body.internal_notes ? String(body.internal_notes) : null,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ task: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
