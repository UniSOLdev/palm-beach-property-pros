import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { mapTaskTemplateRow, normalizeTaskPriority } from "@/lib/task-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

function cleanNullable(value: unknown): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const serviceType = searchParams.get("service_type")?.trim();

  try {
    const supabase = createServiceSupabase();
    let query = supabase
      .from("task_templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (serviceType) {
      query = query.or(`service_type.is.null,service_type.ilike.${serviceType.replace(/[%_,]/g, "")}*`);
    }

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return NextResponse.json({ templates: (data ?? []).map((row) => mapTaskTemplateRow(row as Record<string, unknown>)) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    service_type?: string | null;
    title?: string;
    priority?: string;
    recurring_rule?: string | null;
    operational_notes?: string | null;
    attachment_prompt?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  const name = String(body.name ?? title).trim();
  if (!title || !name) {
    return NextResponse.json({ error: "Template name and title are required" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { count, error: countErr } = await supabase
      .from("task_templates")
      .select("id", { count: "exact", head: true });
    if (countErr) throw countErr;

    const { data, error } = await supabase
      .from("task_templates")
      .insert({
        name,
        title,
        service_type: cleanNullable(body.service_type),
        priority: normalizeTaskPriority(body.priority),
        recurring_rule: cleanNullable(body.recurring_rule),
        operational_notes: cleanNullable(body.operational_notes),
        attachment_prompt: cleanNullable(body.attachment_prompt),
        sort_order: (count ?? 0) + 1,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ template: mapTaskTemplateRow(data as Record<string, unknown>) }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
