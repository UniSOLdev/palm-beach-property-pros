import { SuppliesManager } from "@/components/admin/supplies-manager";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { listJobsForSupplyUsage, listSupplies } from "@/lib/admin/actions/supplies";
import type { SupplyRow } from "@/lib/admin/types-supplies";

export const dynamic = "force-dynamic";
export const metadata = { title: "Supplies" };

export default async function SuppliesPage() {
  let supplies: SupplyRow[] = [];
  let jobs: { id: string; label: string }[] = [];
  let loadError = "";

  try {
    [supplies, jobs] = await Promise.all([listSupplies(), listJobsForSupplyUsage()]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load supplies";
    supplies = [];
    jobs = [];
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Supplies" subtitle="Inventory, low-stock alerts, job usage" />
      {loadError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      ) : null}
      <SuppliesManager initial={supplies} jobs={jobs} />
    </div>
  );
}
