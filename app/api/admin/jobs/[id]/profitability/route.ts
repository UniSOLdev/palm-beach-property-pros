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
    const [jobRes, expenseRes] = await Promise.all([
      supabase.from("jobs").select("id, revenue_cents, invoice_id, invoices ( total_cents, status )").eq("id", id).maybeSingle(),
      supabase
        .from("expenses")
        .select("id, category, vendor, amount_cents, expense_date")
        .eq("job_id", id)
        .order("expense_date", { ascending: false })
        .limit(200),
    ]);

    if (jobRes.error) throw jobRes.error;
    if (expenseRes.error) throw expenseRes.error;
    if (!jobRes.data) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const expenses = (expenseRes.data ?? []).map((row) => ({
      id: String(row.id),
      category: row.category != null ? String(row.category) : null,
      vendor: row.vendor != null ? String(row.vendor) : null,
      amount_cents: Math.round(Number(row.amount_cents) || 0),
      expense_date: String(row.expense_date ?? ""),
    })) satisfies ExpenseSummary[];

    const expense_cents = expenses.reduce((sum, expense) => sum + expense.amount_cents, 0);
    const invoiceEmbed = (jobRes.data as Record<string, unknown>).invoices;
    const invoice = Array.isArray(invoiceEmbed) ? invoiceEmbed[0] : invoiceEmbed;
    const invoice_total_cents = invoice && typeof invoice === "object"
      ? Math.round(Number((invoice as { total_cents?: number }).total_cents) || 0)
      : 0;
    const revenue_cents = invoice_total_cents || Math.round(Number(jobRes.data.revenue_cents) || 0);
    const net_profit_cents = revenue_cents - expense_cents;
    const margin_percent = revenue_cents > 0 ? Math.round((net_profit_cents / revenue_cents) * 1000) / 10 : 0;

    const categories = expenses.reduce<Record<string, number>>((acc, expense) => {
      const key = expense.category || "Uncategorized";
      acc[key] = (acc[key] ?? 0) + expense.amount_cents;
      return acc;
    }, {});

    return NextResponse.json({
      revenue_cents,
      invoice_total_cents,
      expense_cents,
      net_profit_cents,
      margin_percent,
      expenses,
      categories,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Database error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
