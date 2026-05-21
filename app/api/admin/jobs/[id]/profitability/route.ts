import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceSupabase } from "@/lib/supabase/service";

type Ctx = { params: Promise<{ id: string }> };

type ExpenseSummary = {
  id: string;
  category: string | null;
  vendor: string | null;
  amount_cents: number;
  expense_date: string;
};

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = createServiceSupabase();
    const [profitRes, expenseRes] = await Promise.all([
      supabase.from("job_profitability_v").select("*").eq("job_id", id).maybeSingle(),
      supabase
        .from("expenses")
        .select("id, category, vendor, amount_cents, expense_date")
        .eq("job_id", id)
        .is("soft_deleted_at", null)
        .order("expense_date", { ascending: false })
        .limit(200),
    ]);

    if (profitRes.error) throw profitRes.error;
    if (expenseRes.error) throw expenseRes.error;
    if (!profitRes.data) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const expenses = (expenseRes.data ?? []).map((row) => ({
      id: String(row.id),
      category: row.category != null ? String(row.category) : null,
      vendor: row.vendor != null ? String(row.vendor) : null,
      amount_cents: Math.round(Number(row.amount_cents) || 0),
      expense_date: String(row.expense_date ?? ""),
    })) satisfies ExpenseSummary[];

    const categories = expenses.reduce<Record<string, number>>((acc, expense) => {
      const key = expense.category || "Uncategorized";
      acc[key] = (acc[key] ?? 0) + expense.amount_cents;
      return acc;
    }, {});

    return NextResponse.json({
      revenue_cents: Math.round(Number(profitRes.data.revenue_cents) || 0),
      invoice_total_cents: Math.round(Number(profitRes.data.revenue_cents) || 0),
      expense_cents: Math.round(Number(profitRes.data.expense_cents) || 0),
      mileage_cents: Math.round(Number(profitRes.data.mileage_cents) || 0),
      labor_cents: Math.round(Number(profitRes.data.labor_cents) || 0),
      net_profit_cents: Math.round(Number(profitRes.data.net_profit_cents) || 0),
      margin_percent: Number(profitRes.data.margin_percent) || 0,
      expenses,
      categories,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
