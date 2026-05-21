export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = { title: "Invoices" };

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export default async function AdminInvoicesPage() {
  const supabase = createServiceSupabase();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, title, public_token, total_cents, status, created_at, clients(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Invoices</h1>
          <p className="mt-1 text-sm text-zinc-500">Billing history and public share links.</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="min-h-[44px] rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 no-underline"
        >
          New invoice
        </Link>
      </div>

      <ul className="mt-8 space-y-2">
        {(invoices ?? []).map((inv) => {
          const client = inv.clients as { full_name?: string } | null;
          return (
            <li key={inv.id}>
              <Link
                href={`/admin/invoices/${inv.id}`}
                className="flex min-h-[56px] flex-col justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 no-underline transition hover:border-sky-400/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-white">{inv.title ?? "Invoice"}</span>
                <span className="text-sm text-zinc-400">
                  {client?.full_name ?? "No client"} · {fmt(inv.total_cents)} · {inv.status}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
