import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isLowStock } from "@/lib/inventory-constants";
import { parseInventoryPayload } from "@/lib/inventory-payload";
import { mapInventoryItemRow } from "@/lib/inventory-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

function sanitizeSearch(q: string): string {
  return q.replace(/%/g, "").replace(/_/g, "").replace(/,/g, "").trim().slice(0, 120);
}

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = sanitizeSearch(searchParams.get("q") ?? "");
  const inventory_type = (searchParams.get("type") ?? "").trim();
  const operational_status = (searchParams.get("status") ?? "").trim();
  const category = (searchParams.get("category") ?? "").trim();
  const storage = (searchParams.get("storage") ?? "").trim();
  const filter = (searchParams.get("filter") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? "400") || 400, 500);

  try {
    const supabase = createServiceSupabase();
    let query = supabase.from("inventory_items").select("*").order("priority_rank", { ascending: true }).order("name", { ascending: true }).limit(limit);

    if (inventory_type) query = query.eq("inventory_type", inventory_type);
    if (operational_status) query = query.eq("operational_status", operational_status);
    if (category) query = query.ilike("category", `%${category}%`);
    if (storage) query = query.ilike("storage_location", `%${storage}%`);
    if (q) {
      const p = `%${q}%`;
      query = query.or(`name.ilike.${p},category.ilike.${p},storage_location.ilike.${p},vendor.ilike.${p}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data ?? []).map((row) => mapInventoryItemRow(row as Record<string, unknown>));
    if (filter === "low_stock") {
      rows = rows.filter((r) => isLowStock(r.quantity, r.reorder_level));
    }
    if (filter === "assigned") {
      rows = rows.filter((r) => Boolean(r.assigned_job_id) || r.operational_status === "assigned_to_job");
    }
    if (filter === "maintenance") {
      rows = rows.filter((r) => r.operational_status === "maintenance_needed");
    }

    return NextResponse.json({ items: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
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

  const parsed = parseInventoryPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase.from("inventory_items").insert(parsed.data).select("*").single();
    if (error) throw error;
    return NextResponse.json({ item: mapInventoryItemRow(data as Record<string, unknown>) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
