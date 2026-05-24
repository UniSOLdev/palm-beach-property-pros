import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkSiteStudioHealth } from "@/lib/admin/actions/site-studio-health";
import { listWebsitePages, createWebsitePage } from "@/lib/admin/actions/website-builder";
import { createPageSchema, formatSiteStudioError } from "@/lib/cms/website-schemas";

export const dynamic = "force-dynamic";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [health, pages] = await Promise.all([
      checkSiteStudioHealth(),
      listWebsitePages().catch((e: Error) => {
        throw new Error(formatSiteStudioError(e.message));
      }),
    ]);
    return NextResponse.json({ health, pages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load pages";
    return NextResponse.json({ error: message, health: await checkSiteStudioHealth() }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = createPageSchema.parse(await request.json());
    const id = await createWebsitePage(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
