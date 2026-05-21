import { NextResponse } from "next/server";
import type { InvoiceLineItem } from "@/lib/db-types";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { mapInvoiceTemplateRow } from "@/lib/invoice-workflow";
import { createServiceSupabase } from "@/lib/supabase/service";

function cleanNullable(value: unknown): string | null {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("invoice_templates")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true })
      .limit(100);
    if (error) throw error;
    return NextResponse.json({ templates: (data ?? []).map((row) => mapInvoiceTemplateRow(row as Record<string, unknown>)) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    service_type?: string | null;
    description?: string | null;
    line_items?: InvoiceLineItem[];
    scope_notes?: string | null;
    default_terms?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Template name is required" }, { status: 400 });

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("invoice_templates")
      .insert({
        name,
        service_type: cleanNullable(body.service_type),
        description: cleanNullable(body.description),
        line_items: Array.isArray(body.line_items) ? body.line_items : [],
        scope_notes: cleanNullable(body.scope_notes),
        default_terms: cleanNullable(body.default_terms),
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ template: mapInvoiceTemplateRow(data as Record<string, unknown>) }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
