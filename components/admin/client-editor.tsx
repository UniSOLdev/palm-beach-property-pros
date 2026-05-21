"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClientRow } from "@/lib/db-types";

type Props = {
  client: ClientRow;
};

export function ClientEditor({ client: initial }: Props) {
  const [client, setClient] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: client.full_name,
          phone: client.phone,
          email: client.email,
          notes: client.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setClient(data.client);
      setMessage("Saved");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl pb-24 md:pb-0">
      <Link href="/admin/clients" className="text-sm text-sky-300 no-underline hover:underline">
        ← Clients
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">{client.full_name}</h1>

      <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Name</span>
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-white"
            value={client.full_name}
            onChange={(e) => setClient({ ...client, full_name: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Phone</span>
          <input
            className="mt-1 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-white"
            value={client.phone ?? ""}
            onChange={(e) => setClient({ ...client, phone: e.target.value || null })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Email</span>
          <input
            type="email"
            className="mt-1 w-full min-h-[44px] rounded-xl border border-white/10 bg-black/30 px-3 text-white"
            value={client.email ?? ""}
            onChange={(e) => setClient({ ...client, email: e.target.value || null })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-300">Notes</span>
          <textarea
            rows={4}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white"
            value={client.notes ?? ""}
            onChange={(e) => setClient({ ...client, notes: e.target.value || null })}
          />
        </label>
      </div>

      <div className="sticky bottom-20 z-10 mt-6 flex gap-3 md:bottom-6 md:static">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="min-h-[48px] flex-1 rounded-xl bg-sky-500/90 px-5 py-3 text-sm font-semibold text-sky-950 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save client"}
        </button>
        <Link
          href={`/admin/invoices/new?client_id=${client.id}`}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-zinc-100 no-underline"
        >
          New invoice
        </Link>
      </div>

      {message ? <p className="mt-3 text-sm text-zinc-400">{message}</p> : null}
    </div>
  );
}
