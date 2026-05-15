import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_projects").select("*").order("updated_at", { ascending: false }).limit(200);
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
  const slug = String(body.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  const title = String(body.title ?? "").trim();
  if (!slug || !title) return NextResponse.json({ error: "slug and title required" }, { status: 400 });
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_projects")
      .insert({
        slug,
        title,
        client_type: body.client_type != null ? String(body.client_type).slice(0, 120) : null,
        service_category: body.service_category != null ? String(body.service_category).slice(0, 120) : null,
        summary: body.summary != null ? String(body.summary).slice(0, 4000) : null,
        challenge: body.challenge != null ? String(body.challenge).slice(0, 4000) : null,
        work_completed: body.work_completed != null ? String(body.work_completed).slice(0, 4000) : null,
        before_asset_id: body.before_asset_id != null ? String(body.before_asset_id) : null,
        after_asset_id: body.after_asset_id != null ? String(body.after_asset_id) : null,
        testimonial_text: body.testimonial_text != null ? String(body.testimonial_text).slice(0, 4000) : null,
        completed_on: body.completed_on != null ? String(body.completed_on).slice(0, 32) : null,
        featured: Boolean(body.featured),
        status: body.status === "published" ? "published" : "draft",
        seo: body.seo && typeof body.seo === "object" ? body.seo : {},
        data: body.data && typeof body.data === "object" ? body.data : {},
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 500 });
  }
}
