import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_gallery_items")
      .select("id, title, caption, before_asset_id, after_asset_id, service_tags, project_id, sort_order, featured, status, created_at")
      .order("sort_order", { ascending: true })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "List failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_gallery_items")
      .insert({
        title: body.title != null ? String(body.title).slice(0, 200) : null,
        caption: body.caption != null ? String(body.caption).slice(0, 2000) : null,
        before_asset_id: body.before_asset_id != null ? String(body.before_asset_id) : null,
        after_asset_id: body.after_asset_id != null ? String(body.after_asset_id) : null,
        service_tags: Array.isArray(body.service_tags) ? body.service_tags.map(String) : [],
        project_id: body.project_id != null ? String(body.project_id) : null,
        sort_order: Number(body.sort_order) || 0,
        featured: Boolean(body.featured),
        status: body.status === "draft" ? "draft" : "published",
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 500 });
  }
}
