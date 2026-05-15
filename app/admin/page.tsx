export const dynamic = "force-dynamic";

import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "Operations",
};

export default async function AdminDashboardPage() {
  let clients = 0;
  let invoices = 0;
  let err: string | null = null;

  try {
    const supabase = createServiceSupabase();
    const [cRes, iRes] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("id", { count: "exact", head: true }),
    ]);
    if (cRes.error) throw cRes.error;
    if (iRes.error) throw iRes.error;
    clients = cRes.count ?? 0;
    invoices = iRes.count ?? 0;
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not reach Supabase.";
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">PBPP Operations — field snapshot</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 no-underline shadow-lg shadow-sky-900/25 transition hover:bg-sky-400"
        >
          New invoice
        </Link>
      </div>

      {err ? (
        <p className="mt-6 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}
        </p>
      ) : null}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">CRM clients</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{clients}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/[0.06]">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Invoices</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{invoices}</p>
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Workflows</h2>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          <li>
            <Link href="/admin/invoices/new" className="text-sky-300 no-underline hover:underline">
              Create invoice →
            </Link>{" "}
            <span className="text-zinc-600">— attach client for history and public share link.</span>
          </li>
          <li className="text-zinc-600">
            Quote handoff: use{" "}
            <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-zinc-300">
              /admin/invoices/new?client_id=…&amp;from_quote=1
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}
