export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { RelatedTasksPanel } from "@/components/admin/related-tasks-panel";
import { mapQuoteRow } from "@/lib/quote-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export default async function AdminQuoteReadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from("quotes").select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  const q = mapQuoteRow(data as Record<string, unknown>);
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/jobs" className="text-xs font-semibold text-sky-300 no-underline hover:underline">
        ← Jobs
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">Quote {q.reference_code ?? q.id.slice(0, 8)}</h1>
      <p className="mt-1 text-sm capitalize text-zinc-500">Status: {q.status}</p>
      <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-300">
        <p>
          <span className="text-zinc-500">Total</span>{" "}
          <span className="font-semibold text-white">{fmt(q.total_cents)}</span>
        </p>
        <p>
          <span className="text-zinc-500">Service</span> {q.service_type ?? "—"}
        </p>
        <p>
          <span className="text-zinc-500">Address</span> {q.property_address ?? "—"}
        </p>
        <p className="whitespace-pre-wrap text-zinc-400">
          <span className="text-zinc-500">Customer notes</span>
          {"\n"}
          {q.customer_notes ?? "—"}
        </p>
      </div>
      <p className="mt-6 text-xs text-zinc-600">
        Full quote editing lives in the operations console; this view confirms the record attached to a job.
      </p>
      <RelatedTasksPanel quote_id={id} client_id={q.client_id ?? undefined} />
    </div>
  );
}
