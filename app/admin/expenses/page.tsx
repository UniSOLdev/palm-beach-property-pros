import { ExpenseManager } from "@/components/admin/expense-manager";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { TaskWorkflowBar } from "@/components/admin/task-workflow-bar";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expenses" };

export default async function AdminExpensesPage() {
  const crew = await listCrewOptions();
  const supabase = await createClient();
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("archived", false)
    .order("expense_date", { ascending: false });

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Expenses" subtitle="Receipts, categories, reimbursements" actionHref="/admin/tasks" actionLabel="All tasks" />
      <TaskQuickAdd crew={crew} variant="primary" label="+ Add expense task" className="w-full" defaults={{ category: "Expense/Receipt" }} />
      <TaskWorkflowBar context="expense" defaults={{ category: "Expense/Receipt" }} />
      <ExpenseManager initial={data ?? []} crew={crew} />
    </div>
  );
}
