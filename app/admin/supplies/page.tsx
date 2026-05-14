import { AdminPageHeader, Card } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import { SUPPLY_CATEGORIES } from "@/lib/admin/constants";
import { createSupplyAction } from "@/lib/admin/actions";
import { listSupplies } from "@/lib/admin/queries";
import { isSupabaseServerConfigured } from "@/lib/supabase/env";

export default async function SuppliesPage() {
  const supplies = await listSupplies();
  const useDb = isSupabaseServerConfigured();

  return (
    <div>
      <AdminPageHeader title="Supplies" subtitle="Inventory with reorder cues — keep vans stocked without guesswork." />

      {useDb ? (
        <Card title="Add supply" className="mb-6">
          <form action={createSupplyAction} className="grid gap-3 md:grid-cols-3 text-sm">
            <label className="md:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Name</span>
              <input name="name" required className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Category</span>
              <select name="category" className="mt-1 w-full rounded-xl border border-navy/15 bg-white px-3 py-2">
                {SUPPLY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Quantity</span>
              <input type="number" name="quantity" min={0} step={1} defaultValue={0} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Unit</span>
              <input name="unit" defaultValue="each" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Storage location</span>
              <input name="storage_location" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Reorder level</span>
              <input type="number" name="reorder_level" min={0} step={1} defaultValue={0} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label>
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Unit cost</span>
              <input type="number" name="cost" min={0} step={0.01} defaultValue={0} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Vendor</span>
              <input name="vendor" className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <label className="md:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Notes</span>
              <textarea name="notes" rows={2} className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2" />
            </label>
            <button type="submit" className="btn-primary md:col-span-3">
              Add supply
            </button>
          </form>
        </Card>
      ) : null}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-xs uppercase tracking-wide text-charcoal/55">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4 text-right">Qty</th>
                <th className="py-2 pr-4">Unit</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4 text-right">Reorder</th>
                <th className="py-2 pr-4 text-right">Cost</th>
                <th className="py-2 pr-0">Vendor</th>
              </tr>
            </thead>
            <tbody>
              {supplies.map((s) => {
                const low = s.quantity <= s.reorderLevel;
                return (
                  <tr key={s.id} className="border-b border-navy/5 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-navy">
                      {s.name}
                      {low ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">Low</span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-charcoal/75">{s.category}</td>
                    <td className="py-3 pr-4 text-right">{s.quantity}</td>
                    <td className="py-3 pr-4 text-charcoal/75">{s.unit}</td>
                    <td className="py-3 pr-4 text-charcoal/75">{s.storageLocation}</td>
                    <td className="py-3 pr-4 text-right">{s.reorderLevel}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-navy">{formatCurrency(s.cost)}</td>
                    <td className="py-3 pr-0 text-charcoal/70">{s.vendor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
