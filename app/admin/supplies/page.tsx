import { AdminPageHeader, Card } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/admin/format";
import { adminSeed } from "@/lib/admin/seed";

export default function SuppliesPage() {
  return (
    <div>
      <AdminPageHeader
        title="Supplies"
        subtitle="Inventory with reorder cues — keep vans stocked without guesswork."
      />

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
              {adminSeed.supplies.map((s) => (
                <tr key={s.id} className="border-b border-navy/5 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-navy">{s.name}</td>
                  <td className="py-3 pr-4 text-charcoal/75">{s.category}</td>
                  <td className="py-3 pr-4 text-right">{s.quantity}</td>
                  <td className="py-3 pr-4 text-charcoal/75">{s.unit}</td>
                  <td className="py-3 pr-4 text-charcoal/75">{s.storageLocation}</td>
                  <td className="py-3 pr-4 text-right">{s.reorderLevel}</td>
                  <td className="py-3 pr-4 text-right font-semibold text-navy">{formatCurrency(s.cost)}</td>
                  <td className="py-3 pr-0 text-charcoal/70">{s.vendor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
