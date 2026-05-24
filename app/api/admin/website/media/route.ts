import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listWebsiteMedia, registerWebsiteMedia, deleteWebsiteMedia } from "@/lib/admin/actions/website-media";
import { formatSiteStudioError } from "@/lib/cms/website-schemas";
import { z } from "zod";

export const dynamic = "force-dynamic";

const deleteSchema = z.object({ id: z.string().uuid() });

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function GET(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pageId = new URL(request.url).searchParams.get("pageId") ?? undefined;
  try {
    const media = await listWebsiteMedia(pageId);
    return NextResponse.json({ media });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const pageId = String(form.get("pageId") ?? "") || undefined;
    const sectionId = String(form.get("sectionId") ?? "") || undefined;
    const altText = String(form.get("alt_text") ?? "") || undefined;

    const supabase = await createClient();
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${pageId ?? "general"}/${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from("website-media").upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw new Error(formatSiteStudioError(uploadError.message));

    const { data: urlData } = supabase.storage.from("website-media").getPublicUrl(path);

    const row = await registerWebsiteMedia({
      pageId,
      sectionId,
      storagePath: path,
      publicUrl: urlData.publicUrl,
      mimeType: file.type,
      altText,
      fileSizeBytes: file.size,
    });

    return NextResponse.json({ media: row }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = deleteSchema.parse(await request.json());
    await deleteWebsiteMedia(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? formatSiteStudioError(err.message) : "Delete failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
