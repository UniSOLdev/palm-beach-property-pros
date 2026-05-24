import Link from "next/link";
import { Suspense } from "react";
import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { TaskWorkflowBar } from "@/components/admin/task-workflow-bar";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { ExpenseManagerClient } from "@/components/admin/expense-manager-client";
import { LoadError } from "@/components/admin/load-error";
import { listJobsForExpenseLink } from "@/lib/admin/actions/expenses";
import { listCrewOptions } from "@/lib/admin/actions/tasks";
import { fromSupabase } from "@/lib/admin/db-query";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Expenses" };

export default async function AdminExpensesPage() {
  const supabase = await createClient();
  const [crew, jobsResult, expensesResult] = await Promise.all([
    listCrewOptions(),
    listJobsForExpenseLink(),
    supabase
      .from("expenses")
      .select("*")
      .eq("archived", false)
      .order("expense_date", { ascending: false }),
  ]);

  const expensesQuery = fromSupabase(expensesResult.data, expensesResult.error, {
    route: "/admin/expenses",
    query: "expenses list",
  });

  if (!expensesQuery.ok) {
    return (
      <div className="space-y-4">
        <AdminPageHeader title="Expenses" subtitle="Receipts, categories, reimbursements" />
        <LoadError title="Could not load expenses" message={expensesQuery.error} retryHref="/admin/expenses" />
      </div>
    );
  }

  const jobs = jobsResult.ok ? jobsResult.data : [];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Expenses"
        subtitle="Receipts, categories, reimbursements"
        actionHref="/admin/tasks"
        actionLabel="All tasks"
      />
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/expenses/scan" className="admin-btn inline-flex no-underline">
          Scan receipt
        </Link>
        <Link href="/admin/expenses/import" className="admin-btn-secondary inline-flex no-underline">
          Import spreadsheet
        </Link>
      </div>
      {!jobsResult.ok ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Job linking unavailable: {jobsResult.error}
        </p>
      ) : null}
      <TaskQuickAdd crew={crew} variant="primary" label="+ Add expense task" className="w-full" defaults={{ category: "Expense/Receipt" }} />
      <TaskWorkflowBar context="expense" defaults={{ category: "Expense/Receipt" }} />
      <Suspense fallback={<p className="text-sm text-charcoal/60">Loading expenses…</p>}>
        <ExpenseManagerClient initial={expensesQuery.data ?? []} crew={crew} jobs={jobs} />
      </Suspense>
    </div>
  );
}
