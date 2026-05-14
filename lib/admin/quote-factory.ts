import type { Quote } from "./types";

export function makeBlankQuote(clientId: string): Quote {
  const stamp = Date.now();
  return {
    id: `quote_new_${stamp}`,
    publicId: `pub_new_${stamp}`,
    quoteNumber: "PBPP-Q-NEW",
    clientId,
    jobAddress: "",
    serviceType: "Move-out Cleaning",
    lineItems: [
      { id: `li_${stamp}_1`, description: "Primary service", quantity: 1, unitPrice: 0 },
    ],
    optionalAddons: [],
    notes: "",
    terms: "Estimate valid 14 days. Scope changes may adjust pricing.",
    expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
    status: "Draft",
    depositRequired: true,
    depositAmount: 0,
    internalNotes: "",
    createdAt: new Date().toISOString(),
  };
}
