import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  buildDefaultHomeSections,
  buildDefaultSeoPublished,
  buildDefaultSiteShellPublished,
} from "@/lib/cms-defaults";
import { createServiceSupabase } from "@/lib/supabase/service";

/** Seeds CMS *draft* content from current marketing defaults (does not publish homepage unless requested). */
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let alsoPublishHomepage = false;
  try {
    const body = (await req.json().catch(() => ({}))) as { publishHomepage?: boolean };
    alsoPublishHomepage = Boolean(body.publishHomepage);
  } catch {
    /* ignore */
  }

  const sections = buildDefaultHomeSections();
  const shell = buildDefaultSiteShellPublished();
  const seo = buildDefaultSeoPublished();

  try {
    const supabase = createServiceSupabase();
    const now = new Date().toISOString();

    const { data: existingHome } = await supabase
      .from("cms_homepage")
      .select("published_sections")
      .eq("id", 1)
      .maybeSingle();

    const { data: existingShell } = await supabase.from("cms_site_shell").select("published").eq("id", 1).maybeSingle();
    const { data: existingSeo } = await supabase.from("cms_seo").select("published").eq("id", 1).maybeSingle();

    const homePayload: Record<string, unknown> = {
      id: 1,
      draft_sections: sections,
      updated_at: now,
    };
    if (alsoPublishHomepage) {
      homePayload.published_sections = sections;
      homePayload.published_at = now;
    } else {
      homePayload.published_sections = existingHome?.published_sections ?? [];
    }

    const h = await supabase.from("cms_homepage").upsert(homePayload, { onConflict: "id" });
    if (h.error) throw h.error;

    const sh = await supabase
      .from("cms_site_shell")
      .upsert(
        {
          id: 1,
          draft: shell,
          published: existingShell?.published ?? {},
          updated_at: now,
        },
        { onConflict: "id" },
      );
    if (sh.error) throw sh.error;

    const se = await supabase
      .from("cms_seo")
      .upsert(
        {
          id: 1,
          draft: seo,
          published: existingSeo?.published ?? {},
          updated_at: now,
        },
        { onConflict: "id" },
      );
    if (se.error) throw se.error;

    return NextResponse.json({
      ok: true,
      homepageDraftSections: sections.length,
      publishedHomepage: alsoPublishHomepage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bootstrap failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
