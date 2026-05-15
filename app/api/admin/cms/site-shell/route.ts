import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_site_shell").select("draft, published, updated_at, published_at").eq("id", 1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ draft: data?.draft ?? {}, published: data?.published ?? {}, updated_at: data?.updated_at, published_at: data?.published_at });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Load failed" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const draft = (body as { draft?: unknown })?.draft;
  if (!draft || typeof draft !== "object" || Array.isArray(draft)) {
    return NextResponse.json({ error: "draft object required" }, { status: 400 });
  }
  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from("cms_site_shell")
      .upsert({ id: 1, draft, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Save failed" }, { status: 500 });
  }
}

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_site_shell").select("draft").eq("id", 1).maybeSingle();
    if (error) throw error;
    const draft = data?.draft;
    if (!draft || typeof draft !== "object") {
      return NextResponse.json({ error: "Nothing to publish" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const { error: up } = await supabase
      .from("cms_site_shell")
      .update({ published: draft, published_at: now, updated_at: now })
      .eq("id", 1);
    if (up) throw up;
    return NextResponse.json({ ok: true, published_at: now });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Publish failed" }, { status: 500 });
  }
}
