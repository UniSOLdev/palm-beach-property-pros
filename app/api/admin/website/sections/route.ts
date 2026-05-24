import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  addWebsiteSection,
  deleteWebsiteSection,
  duplicateWebsiteSection,
  saveDraftSections,
} from "@/lib/admin/actions/website-builder";
import { addSectionSchema, saveSectionsSchema, sectionActionSchema, formatSiteStudioError } from "@/lib/cms/website-schemas";
import type { WebsiteSectionType } from "@/lib/cms/section-registry";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = saveSectionsSchema.parse(await request.json());
    await saveDraftSections(
      body.pageId,
      body.sections.map((s) => ({
        ...s,
        section_type: s.section_type as WebsiteSectionType,
      })),
      body.seo,
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Save failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = addSectionSchema.parse(await request.json());
    const section = await addWebsiteSection(body.pageId, body.sectionType as WebsiteSectionType);
    return NextResponse.json({ section }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Add section failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = sectionActionSchema.parse(await request.json());
    await deleteWebsiteSection(body.sectionId, body.pageId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = sectionActionSchema.parse(await request.json());
    const section = await duplicateWebsiteSection(body.sectionId, body.pageId);
    return NextResponse.json({ section });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Duplicate failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
