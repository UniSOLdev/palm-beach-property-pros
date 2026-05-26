import Link from "next/link";
import { OperationalProofGrid } from "@/components/media/operational-proof-grid";
import type { OperationalProof } from "@/lib/media/types";

export function DocumentationSuite({ items }: { items: readonly OperationalProof[] }) {
  return (
    <div>
      <OperationalProofGrid items={items} />
      <p className="mt-10 max-w-2xl text-sm leading-relaxed text-charcoal/65">
        Documentation depth scales with asset class—estates, commercial fronts, and turnover programs
        each receive operational records appropriate to how stakeholders review work.
      </p>
      <Link href="/quote" className="link-luxury mt-6 inline-block text-ocean">
        Ask about documentation for your property
      </Link>
    </div>
  );
}
