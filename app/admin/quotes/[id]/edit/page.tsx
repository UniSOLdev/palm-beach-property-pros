import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { QuoteBuilder } from "@/components/admin/quote-builder";
import { QuoteEstimateActions } from "@/components/admin/quote-estimate-actions";
import { getQuoteById } from "@/lib/admin/actions/quotes";
import { mapQuoteItems } from "@/lib/platform/modules/estimates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function QuoteEditPage({ params }: Props) {
  const { id } = await params;

  try {
    const { quote, items, leadId } = await getQuoteById(id);

    return (
      <div className="space-y-4">
        <Link href={`/admin/quotes/${id}`} className="text-sm font-semibold text-ocean no-underline hover:underline">
          ← Quote detail
        </Link>
        <AdminPageHeader title={`Edit ${quote.quote_number}`} subtitle="Estimate builder" />
        <QuoteEstimateActions quoteId={id} leadId={leadId} approvalStatus={quote.approval_status} />
        <QuoteBuilder
          quoteId={id}
          clientId={quote.client_id}
          initial={{
            service_type: quote.service_type,
            job_address: quote.job_address,
            notes: quote.notes,
            internal_notes: quote.internal_notes,
            terms: quote.terms,
            expiration_date: quote.expiration_date,
            deposit_required: quote.deposit_required,
            deposit_amount: quote.deposit_amount,
            discount_type: quote.discount_type,
            discount_value: quote.discount_value,
            tax_rate: quote.tax_rate,
            lines: items.length
              ? mapQuoteItems(items)
              : [{ description: quote.service_type, quantity: 1, unit_price: 0 }],
          }}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
