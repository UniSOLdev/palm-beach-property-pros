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
  for (const k of ["alt_text", "title", "category", "featured", "status"] as const) {
    if (k in body) patch[k] = body[k];
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_media_assets").update(patch).eq("id", id).select("*").single();
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
    const { data: row, error: fErr } = await supabase.from("cms_media_assets").select("storage_path").eq("id", id).maybeSingle();
    if (fErr) throw fErr;
    if (!row?.storage_path) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const { error: rmErr } = await supabase.storage.from("website-media").remove([String(row.storage_path)]);
    if (rmErr) throw rmErr;
    const { error: dErr } = await supabase.from("cms_media_assets").delete().eq("id", id);
    if (dErr) throw dErr;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Delete failed" }, { status: 500 });
  }
}
