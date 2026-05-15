import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { parseCmsHomeSections } from "@/lib/cms-parsers";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const mode = new URL(req.url).searchParams.get("mode") === "published" ? "published" : "draft";

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_homepage")
      .select("draft_sections, published_sections, published_at, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    const sections = mode === "published" ? data?.published_sections : data?.draft_sections;
    return NextResponse.json({
      mode,
      sections: sections ?? [],
      published_at: data?.published_at ?? null,
      updated_at: data?.updated_at ?? null,
    });
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
  const rec = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const raw = rec.draft_sections ?? rec.sections;
  const parsed = parseCmsHomeSections(raw);
  if (!parsed) {
    return NextResponse.json({ error: "draft_sections must be a non-empty array of valid sections" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { error } = await supabase
      .from("cms_homepage")
      .upsert(
        {
          id: 1,
          draft_sections: parsed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
    if (error) throw error;
    return NextResponse.json({ ok: true, draft_sections: parsed });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Save failed" }, { status: 500 });
  }
}
