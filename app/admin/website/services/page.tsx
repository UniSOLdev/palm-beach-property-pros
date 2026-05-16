import Link from "next/link";
import { SERVICES } from "@/lib/services";

export const metadata = { title: "Services (CMS)" };

export default function WebsiteServicesIndexPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Services manager</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Service routes and defaults stay in code. Publish JSON overrides per slug to adjust copy, FAQs, and pricing
          labels without redeploying.
        </p>
      </div>
      <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/30">
        {SERVICES.map((s) => (
          <li key={s.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium text-white">{s.name}</p>
              <p className="text-xs text-zinc-500">{s.slug}</p>
            </div>
            <Link
              href={`/admin/website/services/${s.slug}`}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-sky-200 no-underline hover:border-sky-400/40"
            >
              Edit CMS overlay
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
