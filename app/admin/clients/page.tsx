export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  const supabase = createServiceSupabase();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, phone, email, created_at")
    .order("full_name")
    .limit(200);

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Clients</h1>
          <p className="mt-1 text-sm text-zinc-500">CRM records linked to jobs, quotes, and invoices.</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="min-h-[44px] rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 no-underline"
        >
          New invoice
        </Link>
      </div>

      <ul className="mt-8 space-y-2">
        {(clients ?? []).map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/clients/${c.id}`}
              className="flex min-h-[56px] flex-col justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 no-underline transition hover:border-sky-400/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-white">{c.full_name}</span>
              <span className="text-sm text-zinc-500">{c.phone ?? c.email ?? "—"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
