import type { Metadata } from "next";
import { OpsDashboard } from "./ops-dashboard";

export const metadata: Metadata = {
  title: "PBPP Operations OS",
  description: "Hidden internal operations backend for Palm Beach Property Pros.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function OpsPage() {
  return <OpsDashboard />;
}
