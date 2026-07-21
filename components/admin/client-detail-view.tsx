"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addClientNote, updateClientProfile } from "@/lib/admin/actions/clients";
import { phoneSms, phoneTel } from "@/lib/platform/constants";
import { formatCurrency, formatDate } from "@/lib/admin/format";

type ClientDetail = Awaited<ReturnType<typeof import("@/lib/admin/actions/clients").getClientDetail>>;

export function ClientDetailView({ data }: { data: ClientDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const { client, jobs, quotes, invoices, leads, activity } = data;

  return (
    <div className="space-y-4 pb-24">
      <div className="admin-card space-y-3">
        <h1 className="text-xl font-bold text-navy">{client.name}</h1>
        <p className="text-sm text-charcoal/70">{client.phone}</p>
        {client.email ? <p className="text-sm text-charcoal/70">{client.email}</p> : null}
        {client.address ? <p className="text-sm text-charcoal/70">{client.address}</p> : null}
        <div className="flex flex-wrap gap-2">
          <a href={phoneTel(client.phone)} className="admin-btn min-h-[48px] px-4 text-sm no-underline">
            Call
          </a>
          <a href={phoneSms(client.phone)} className="admin-btn-secondary min-h-[48px] px-4 text-sm no-underline">
            Text
          </a>
        </div>
      </div>

      <section className="admin-card space-y-2">
        <h2 className="text-sm font-semibold text-navy">Service reminders</h2>
        <textarea
          rows={3}
          defaultValue={client.service_reminder_notes ?? ""}
          className="admin-input mt-0"
          onBlur={(e) =>
            startTransition(async () => {
              await updateClientProfile(client.id, { service_reminder_notes: e.target.value });
              router.refresh();
            })
          }
        />
      </section>

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Jobs ({jobs.length})</h2>
        <ul className="mt-3 space-y-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/admin/jobs/${job.id}/field`} className="block rounded-xl border border-navy/10 p-3 no-underline">
                <p className="font-medium text-navy">{job.service_type}</p>
                <p className="text-xs text-charcoal/60">
                  {formatDate(job.job_date)} · {job.status} · {formatCurrency(Number(job.revenue))}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Estimates ({quotes.length})</h2>
        <ul className="mt-3 space-y-2">
          {quotes.map((quote) => (
            <li key={quote.id}>
              <Link href={`/admin/quotes/${quote.id}/edit`} className="block rounded-xl border border-navy/10 p-3 no-underline">
                <p className="font-medium text-navy">{quote.quote_number}</p>
                <p className="text-xs text-charcoal/60">{quote.service_type} · {quote.approval_status}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">Invoices ({invoices.length})</h2>
        <ul className="mt-3 space-y-2">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link href={`/admin/invoices/${invoice.id}`} className="block rounded-xl border border-navy/10 p-3 no-underline">
                <p className="font-medium text-navy">{invoice.invoice_number}</p>
                <p className="text-xs text-charcoal/60">{invoice.payment_status} · {formatCurrency(Number(invoice.total))}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-card space-y-2">
        <h2 className="text-sm font-semibold text-navy">Add note</h2>
        <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="admin-input mt-0" />
        <button
          type="button"
          disabled={pending || !note.trim()}
          className="admin-btn min-h-[48px] w-full"
          onClick={() =>
            startTransition(async () => {
              await addClientNote(client.id, note);
              setNote("");
              router.refresh();
            })
          }
        >
          Save note
        </button>
      </section>

      <section className="admin-card">
        <h2 className="text-sm font-semibold text-navy">History</h2>
        <ul className="mt-3 space-y-3">
          {[...activity, ...leads.map((l) => ({ id: l.id, created_at: l.created_at, body: `Lead: ${l.service_requested}`, activity_type: "system" }))]
            .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
            .slice(0, 20)
            .map((item) => (
              <li key={item.id} className="border-b border-navy/5 pb-2 text-sm">
                <p className="text-xs text-charcoal/50">{formatDate(item.created_at)}</p>
                <p>{item.body}</p>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
