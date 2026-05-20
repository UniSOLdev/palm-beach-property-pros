import { InvoiceBuilder } from "@/components/admin/invoice-builder";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Invoice" };

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("archived", false)
    .order("name");

  return (
    <div className="space-y-4">
      <AdminPageHeader title="New invoice" subtitle="Mobile-friendly draft builder" />
      <InvoiceBuilder clients={clients ?? []} />
    </div>
  );
}
