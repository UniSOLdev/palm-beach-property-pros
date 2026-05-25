import Link from "next/link";
import { ReceiptMigrationPanel } from "@/components/admin/receipt-migration-panel";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { getReceiptMigrationDashboardAction } from "@/lib/admin/actions/receipt-migration";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipt migration" };

export default async function ExpenseMigrationPage() {
  const dashboard = await getReceiptMigrationDashboardAction();

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Receipt asset migration"
        subtitle="Upgrade legacy uploads to normalized OCR images and thumbnails"
        actionHref="/admin/expenses"
        actionLabel="All expenses"
      />
      <ReceiptMigrationPanel initial={dashboard} />
      <p className="text-center text-sm text-charcoal/60">
        <Link href="/admin/expenses/scan" className="font-semibold text-ocean no-underline">
          Scan new receipts →
        </Link>
      </p>
    </div>
  );
}
