import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data: batch, error: bErr } = await supabase
      .from("expense_import_batches")
      .select("id, reverted_at")
      .eq("id", id)
      .maybeSingle();

    if (bErr) throw bErr;
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if ((batch as { reverted_at: string | null }).reverted_at) {
      return NextResponse.json({ error: "This import was already undone." }, { status: 400 });
    }

    const { error: d1 } = await supabase.from("expenses").delete().eq("batch_id", id);
    if (d1) throw d1;

    const { error: d2 } = await supabase
      .from("expense_import_batches")
      .update({ reverted_at: new Date().toISOString() })
      .eq("id", id);

    if (d2) throw d2;

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Revert failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
