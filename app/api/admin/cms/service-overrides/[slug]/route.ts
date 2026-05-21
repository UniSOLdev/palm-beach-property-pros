import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_service_overrides").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Load failed" }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const draft = body.draft;
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return NextResponse.json({ error: "draft object required" }, { status: 400 });
  }
  const now = new Date().toISOString();
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_service_overrides")
      .upsert({ slug, draft, updated_at: now }, { onConflict: "slug" })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Save failed" }, { status: 500 });
  }
}

export async function POST(_req: Request, ctx: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await ctx.params;
  try {
    const supabase = createServiceSupabase();
    const { data: row, error: findErr } = await supabase
      .from("cms_service_overrides")
      .select("draft")
      .eq("slug", slug)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!row) {
      return NextResponse.json({ error: "Save a draft for this service first" }, { status: 404 });
    }
    const draft = row.draft;
    if (!draft || typeof draft !== "object") {
      return NextResponse.json({ error: "No draft to publish" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const { data: updated, error: up } = await supabase
      .from("cms_service_overrides")
      .update({ published: draft, published_at: now, updated_at: now })
      .eq("slug", slug)
      .select("*")
      .maybeSingle();
    if (up) throw up;
    return NextResponse.json({ item: updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Publish failed" }, { status: 500 });
  }
}
