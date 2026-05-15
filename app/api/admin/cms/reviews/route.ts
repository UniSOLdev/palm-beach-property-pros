import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_reviews").select("*").order("created_at", { ascending: false }).limit(200);
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
  const author_name = String(body.author_name ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
  if (!author_name) return NextResponse.json({ error: "author_name required" }, { status: 400 });
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_reviews")
      .insert({
        author_name,
        rating,
        body: body.body != null ? String(body.body).slice(0, 4000) : null,
        source: body.source != null ? String(body.source).slice(0, 120) : null,
        service_slugs: Array.isArray(body.service_slugs) ? body.service_slugs.map(String) : [],
        featured: Boolean(body.featured),
        show_on_homepage: Boolean(body.show_on_homepage),
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
