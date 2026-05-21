import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(new URL(req.url).searchParams.get("limit") ?? "80") || 80, 200);
  try {
    const supabase = createServiceSupabase();
    let query = supabase
      .from("cms_media_assets")
      .select("id, public_url, storage_path, alt_text, title, category, featured, status, mime_type, byte_size, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (q) {
      const esc = q.replace(/%/g, "").replace(/,/g, "");
      const p = `%${esc}%`;
      query = query.or(`title.ilike.${p},alt_text.ilike.${p},storage_path.ilike.${p}`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "List failed" }, { status: 500 });
  }
}
