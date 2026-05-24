import { notFound } from "next/navigation";
import Link from "next/link";
import { InvoiceTemplate } from "@/components/invoice/invoice-template";
import { fetchPublicInvoice } from "@/lib/supabase/public-share";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const result = await fetchPublicInvoice(publicId);

  if (!result.ok) {
    if (result.reason === "not_found") notFound();
    return (
      <main className="min-h-screen bg-cream px-4 py-10">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-800">Unable to load invoice. Please contact Palm Beach Property Pros.</p>
          <Link href="/quote" className="mt-4 inline-block text-sm font-semibold text-ocean no-underline">
            Contact us
          </Link>
        </div>
      </main>
    );
  }

  const { invoice, items, settings } = result;
  const client = invoice.clients as { name?: string; address?: string } | null;

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <InvoiceTemplate
        invoiceNumber={invoice.invoice_number}
        clientName={client?.name ?? "Client"}
        clientAddress={client?.address}
        dueDate={invoice.due_date}
        terms={invoice.terms}
        notes={invoice.notes}
        discount={Number(invoice.discount)}
        depositPaid={Number(invoice.deposit_paid)}
        logoUrl={settings?.logo_url}
        businessPhone={settings?.phone}
        businessEmail={settings?.email}
        lines={items.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
        }))}
      />
    </main>
  );
}
