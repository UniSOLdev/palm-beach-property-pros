import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { parseCmsHomeSections } from "@/lib/cms-parsers";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_homepage").select("draft_sections").eq("id", 1).maybeSingle();
    if (error) throw error;
    const parsed = parseCmsHomeSections(data?.draft_sections);
    if (!parsed) {
      return NextResponse.json({ error: "Draft homepage has no valid sections to publish" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("cms_homepage")
      .update({
        published_sections: parsed,
        published_at: now,
        updated_at: now,
      })
      .eq("id", 1);
    if (upErr) throw upErr;
    return NextResponse.json({ ok: true, published_at: now, section_count: parsed.length });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Publish failed" }, { status: 500 });
  }
}
