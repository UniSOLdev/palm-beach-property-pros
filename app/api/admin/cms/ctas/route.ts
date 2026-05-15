import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("cms_ctas").select("*").order("sort_order", { ascending: true }).limit(200);
    if (error) throw error;
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "List failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const label = String(body.label ?? "").trim();
  const href = String(body.href ?? "").trim();
  if (!label || !href) return NextResponse.json({ error: "label and href required" }, { status: 400 });
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_ctas")
      .insert({
        cta_key: body.cta_key != null ? String(body.cta_key).slice(0, 80) : null,
        label,
        href,
        variant: body.variant != null ? String(body.variant).slice(0, 40) : "primary",
        open_new_tab: Boolean(body.open_new_tab),
        sticky_mobile: Boolean(body.sticky_mobile),
        sort_order: Number(body.sort_order) || 0,
        status: body.status === "draft" ? "draft" : "published",
        meta: body.meta && typeof body.meta === "object" ? body.meta : {},
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed" }, { status: 500 });
  }
}
