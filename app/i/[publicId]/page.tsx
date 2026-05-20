import { notFound } from "next/navigation";
import { InvoiceTemplate } from "@/components/invoice/invoice-template";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const supabase = await createClient();
  const { data: inv, error: invError } = await supabase
    .from("invoices")
    .select("*, clients(name, address)")
    .eq("public_id", publicId)
    .eq("archived", false)
    .maybeSingle();
  if (invError) {
    return (
      <main className="min-h-screen bg-cream px-4 py-10">
        <p className="text-center text-sm text-red-700">Unable to load invoice. Please contact Palm Beach Property Pros.</p>
      </main>
    );
  }
  if (!inv) notFound();

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", inv.id)
    .order("sort_order");
  const { data: settings } = await supabase.from("business_settings").select("*").limit(1).maybeSingle();
  const client = inv.clients as { name?: string; address?: string } | null;

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <InvoiceTemplate
        invoiceNumber={inv.invoice_number}
        clientName={client?.name ?? "Client"}
        clientAddress={client?.address}
        dueDate={inv.due_date}
        terms={inv.terms}
        notes={inv.notes}
        discount={Number(inv.discount)}
        depositPaid={Number(inv.deposit_paid)}
        logoUrl={settings?.logo_url}
        businessPhone={settings?.phone}
        businessEmail={settings?.email}
        lines={(items ?? []).map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        }))}
      />
    </main>
  );
}
