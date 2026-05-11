import type { Metadata } from "next";
import { WalkthroughApp } from "./walkthrough-app";

export const metadata: Metadata = {
  title: "PBPP Internal Walkthrough",
  description: "Hidden internal walkthrough and quote builder for Palm Beach Property Pros.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function WalkthroughPage() {
  return <WalkthroughApp />;
}
