import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of [
    "title",
    "client_type",
    "service_category",
    "summary",
    "challenge",
    "work_completed",
    "before_asset_id",
    "after_asset_id",
    "testimonial_text",
    "completed_on",
    "featured",
    "status",
  ] as const) {
    if (k in body) patch[k] = body[k];
  }
  if (body.seo && typeof body.seo === "object") patch.seo = body.seo;
  if (body.data && typeof body.data === "object") patch.data = body.data;
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_projects").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase.from("cms_projects").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Delete failed" }, { status: 500 });
  }
}
