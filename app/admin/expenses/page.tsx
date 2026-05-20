import { ExpenseManager } from "@/components/admin/expense-manager";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expenses" };

export default async function AdminExpensesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("archived", false)
    .order("expense_date", { ascending: false });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Expenses" subtitle="Receipts, categories, reimbursements" />
      <ExpenseManager initial={data ?? []} />
    </div>
  );
}
