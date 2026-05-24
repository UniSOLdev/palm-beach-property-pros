import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishWebsitePage, rollbackWebsitePage } from "@/lib/admin/actions/website-builder";
import { publishPageSchema, formatSiteStudioError } from "@/lib/cms/website-schemas";
import { z } from "zod";

export const dynamic = "force-dynamic";

const rollbackSchema = z.object({
  pageId: z.string().uuid(),
  revisionId: z.string().uuid(),
});

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = publishPageSchema.parse(await request.json());
    const result = await publishWebsitePage(body.pageId, body.note);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = rollbackSchema.parse(await request.json());
    const result = await rollbackWebsitePage(body.pageId, body.revisionId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Rollback failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
