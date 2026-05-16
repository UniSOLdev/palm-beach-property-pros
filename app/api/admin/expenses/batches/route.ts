import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("expense_import_batches")
      .select("id, label, source, row_count, inserted_count, skipped_duplicates, skipped_invalid, reverted_at, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) throw error;

    return NextResponse.json({ batches: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load import history.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
