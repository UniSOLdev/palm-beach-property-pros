import { permanentRedirect } from "next/navigation";

/** Pricing is private — quotes by phone or request only. */
export default function PricingPage() {
  permanentRedirect("/quote");
}
