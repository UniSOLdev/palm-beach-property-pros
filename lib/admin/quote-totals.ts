import type { Quote } from "./types";
import { sumLineItems } from "./format";

export function quoteLineTotal(quote: Quote) {
  return sumLineItems(quote.lineItems);
}

export function quoteAddonsTotal(quote: Quote) {
  return sumLineItems(quote.optionalAddons);
}

export function quoteRemaining(quote: Quote) {
  const total = quoteLineTotal(quote);
  return Math.max(0, total - quote.depositAmount);
}
