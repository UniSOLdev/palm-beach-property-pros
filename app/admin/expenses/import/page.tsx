import Link from "next/link";
import { Suspense } from "react";
import { ExpenseImportFlow } from "@/components/admin/expense-import-flow";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { listJobsForExpenseLink } from "@/lib/admin/actions/expenses";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import Expenses" };

export default async function ExpenseImportPage() {
  const jobsResult = await listJobsForExpenseLink();
  const jobs = jobsResult.ok ? jobsResult.data : [];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Import expenses"
        subtitle="CSV / XLSX from banks, Home Depot, or spreadsheets"
        actionHref="/admin/expenses"
        actionLabel="All expenses"
      />
      {!jobsResult.ok ? (
        <LoadError title="Could not load jobs" message={jobsResult.error} retryHref="/admin/expenses/import" />
      ) : null}
      <Suspense fallback={<p className="text-sm text-charcoal/60">Loading import…</p>}>
        <ExpenseImportFlow jobs={jobs} />
      </Suspense>
      <p className="text-center text-sm">
        <Link href="/admin/expenses/scan" className="font-semibold text-ocean no-underline">
          Scan receipt instead →
        </Link>
      </p>
    </div>
  );
}
