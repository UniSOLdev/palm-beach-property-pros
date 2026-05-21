import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceSupabase();
    const { data: byCategory, error: e1 } = await supabase
      .from("expense_analytics_by_category")
      .select("category, total_cents, expense_count")
      .order("total_cents", { ascending: false })
      .limit(40);

    if (e1) throw e1;

    const { data: byPayment, error: e2 } = await supabase
      .from("expense_analytics_by_payment")
      .select("payment_method, total_cents, expense_count")
      .order("total_cents", { ascending: false })
      .limit(20);

    if (e2) throw e2;

    const { data: monthly, error: e3 } = await supabase
      .from("expense_monthly_totals")
      .select("month_start, total_cents, expense_count")
      .limit(18);

    if (e3) throw e3;

    const { data: totals, error: e4 } = await supabase.from("expense_totals_v").select("expense_count, total_cents").maybeSingle();

    if (e4) throw e4;

    const total_cents = Number((totals as { total_cents?: number } | null)?.total_cents ?? 0);
    const expense_count = Number((totals as { expense_count?: number } | null)?.expense_count ?? 0);

    return NextResponse.json({
      total_cents,
      expense_count,
      by_category: byCategory ?? [],
      by_payment: byPayment ?? [],
      monthly: monthly ?? [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not load analytics.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
