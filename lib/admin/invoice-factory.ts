import type { Invoice, InvoiceLineItem, Quote } from "./types";

export function invoiceFromQuote(quote: Quote, jobId: string | null): Invoice {
  const stamp = Date.now();
  const lineItems: InvoiceLineItem[] = quote.lineItems.map((li) => ({
    id: `invli_${li.id}`,
    description: li.description,
    quantity: li.quantity,
    unitPrice: li.unitPrice,
  }));
  return {
    id: `inv_from_${quote.id}`,
    publicId: `pub_inv_${stamp}`,
    invoiceNumber: "PBPP-INV-NEW",
    clientId: quote.clientId,
    jobId,
    quoteId: quote.id,
    lineItems,
    discount: 0,
    depositPaid: quote.depositAmount,
    paymentStatus: "Unpaid",
    paymentMethod: null,
    paidDate: null,
    notes: quote.notes,
    terms: quote.terms,
    reviewRequestStatus: "Not sent",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
}

export function makeBlankInvoice(clientId: string): Invoice {
  const stamp = Date.now();
  return {
    id: `inv_new_${stamp}`,
    publicId: `pub_inv_new_${stamp}`,
    invoiceNumber: "PBPP-INV-NEW",
    clientId,
    jobId: null,
    quoteId: null,
    lineItems: [{ id: `invli_${stamp}`, description: "Service", quantity: 1, unitPrice: 0 }],
    discount: 0,
    depositPaid: 0,
    paymentStatus: "Unpaid",
    paymentMethod: null,
    paidDate: null,
    notes: "",
    terms: "Payment due on receipt.",
    reviewRequestStatus: "Not sent",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
}
