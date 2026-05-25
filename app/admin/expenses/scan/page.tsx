import Link from "next/link";
import { Suspense } from "react";
import { BulkReceiptScanner } from "@/components/admin/bulk-receipt-scanner";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { LoadError } from "@/components/admin/load-error";
import { listJobsForExpenseLink } from "@/lib/admin/actions/expenses";
import { fromSupabase } from "@/lib/admin/db-query";

export const dynamic = "force-dynamic";
export const metadata = { title: "Scan Receipt" };

export default async function ExpenseScanPage() {
  const jobsResult = await listJobsForExpenseLink();
  const jobs = jobsResult.ok ? jobsResult.data : [];

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Scan receipts"
        subtitle="Upload one or many receipts — review in bulk before saving"
        actionHref="/admin/expenses"
        actionLabel="All expenses"
      />
      {!jobsResult.ok ? (
        <LoadError title="Could not load jobs for linking" message={jobsResult.error} retryHref="/admin/expenses/scan" />
      ) : null}
      <Suspense fallback={<p className="text-sm text-charcoal/60">Loading scanner…</p>}>
        <BulkReceiptScanner jobs={jobs} />
      </Suspense>
      <p className="text-center text-sm">
        <Link href="/admin/expenses?focus=scan" className="font-semibold text-ocean no-underline">
          Single receipt mode →
        </Link>
        {" · "}
        <Link href="/admin/expenses/import" className="font-semibold text-ocean no-underline">
          Import spreadsheet →
        </Link>
        {" · "}
        <Link href="/admin/expenses/migration" className="font-semibold text-ocean no-underline">
          Upgrade legacy receipts →
        </Link>
      </p>
    </div>
  );
}
