import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  const prefix = (form.get("prefix") as string | null)?.replace(/[^a-z0-9/_-]/gi, "") || "uploads";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const path = `${prefix}/${Date.now()}-${safeName}`;

  try {
    const supabase = createServiceSupabase();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage.from("website-media").upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("website-media").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { data: row, error: insErr } = await supabase
      .from("cms_media_assets")
      .insert({
        storage_path: path,
        public_url: publicUrl,
        mime_type: file.type || null,
        byte_size: file.size,
        alt_text: (form.get("alt_text") as string | null)?.slice(0, 500) || null,
        title: (form.get("title") as string | null)?.slice(0, 200) || null,
        category: (form.get("category") as string | null)?.slice(0, 80) || "general",
        status: "published",
      })
      .select("id, public_url, storage_path, alt_text, title, category, featured, status, mime_type, byte_size, created_at")
      .single();
    if (insErr) throw insErr;
    return NextResponse.json({ item: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
