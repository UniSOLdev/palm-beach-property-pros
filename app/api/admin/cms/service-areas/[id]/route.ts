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
    "city_name",
    "headline",
    "featured",
    "cta_label",
    "cta_href",
    "hero_asset_id",
    "status",
  ] as const) {
    if (k in body) patch[k] = body[k];
  }
  if (body.body && typeof body.body === "object") patch.body = body.body;
  if (body.seo && typeof body.seo === "object") patch.seo = body.seo;
  if (body.featured_service_slugs && Array.isArray(body.featured_service_slugs)) {
    patch.featured_service_slugs = body.featured_service_slugs.map(String);
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_service_areas").update(patch).eq("id", id).select("*").single();
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
    const { error } = await supabase.from("cms_service_areas").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Delete failed" }, { status: 500 });
  }
}
