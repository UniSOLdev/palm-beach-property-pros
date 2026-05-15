import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_service_areas").select("*").order("city_name", { ascending: true }).limit(200);
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
  const city_name = String(body.city_name ?? "").trim();
  if (!slug || !city_name) return NextResponse.json({ error: "slug and city_name required" }, { status: 400 });
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_service_areas")
      .insert({
        slug,
        city_name,
        headline: body.headline != null ? String(body.headline).slice(0, 300) : null,
        body: body.body && typeof body.body === "object" ? body.body : {},
        featured_service_slugs: Array.isArray(body.featured_service_slugs) ? body.featured_service_slugs.map(String) : [],
        featured: Boolean(body.featured),
        cta_label: body.cta_label != null ? String(body.cta_label).slice(0, 120) : null,
        cta_href: body.cta_href != null ? String(body.cta_href).slice(0, 500) : null,
        hero_asset_id: body.hero_asset_id != null ? String(body.hero_asset_id) : null,
        status: body.status === "published" ? "published" : "draft",
        seo: body.seo && typeof body.seo === "object" ? body.seo : {},
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 500 });
  }
}
