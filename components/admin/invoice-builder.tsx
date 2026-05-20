"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInvoiceDraft } from "@/lib/admin/actions/invoices";

type Client = { id: string; name: string };

export function InvoiceBuilder({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [lines, setLines] = useState([{ description: "", quantity: 1, unit_price: 0 }]);

  if (clients.length === 0) {
    return (
      <div className="admin-card space-y-3">
        <p className="text-sm text-charcoal/70">Add a client in Supabase before creating invoices.</p>
        <a href="/admin/clients" className="admin-btn-secondary inline-flex no-underline">
          View clients
        </a>
      </div>
    );
  }

  return (
    <form
      className="admin-card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError("");
          try {
            const id = await createInvoiceDraft({
              client_id: String(fd.get("client_id")),
              due_date: String(fd.get("due_date") || "") || undefined,
              terms: String(fd.get("terms") || "") || undefined,
              lines: lines.filter((l) => l.description.trim()),
            });
            router.push(`/admin/invoices/${id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save invoice");
          }
        });
      }}
    >
      <h2 className="text-lg font-bold text-navy">New invoice</h2>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <label className="block text-sm font-medium text-navy">
        Client
        <select name="client_id" required className="admin-input">
          <option value="">Select client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-navy">
        Due date
        <input type="date" name="due_date" className="admin-input" />
      </label>
      <label className="block text-sm font-medium text-navy">
        Terms
        <textarea name="terms" rows={2} className="admin-input" />
      </label>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-navy">Line items</p>
        {lines.map((line, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-navy/10 p-3">
            <input
              className="admin-input mt-0"
              placeholder="Description"
              value={line.description}
              onChange={(e) => {
                const next = [...lines];
                next[i] = { ...next[i], description: e.target.value };
                setLines(next);
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                className="admin-input mt-0"
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], quantity: Number(e.target.value) };
                  setLines(next);
                }}
              />
              <input
                type="number"
                className="admin-input mt-0"
                placeholder="Rate"
                value={line.unit_price}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], unit_price: Number(e.target.value) };
                  setLines(next);
                }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="admin-btn-secondary w-full"
          onClick={() => setLines([...lines, { description: "", quantity: 1, unit_price: 0 }])}
        >
          Add line
        </button>
      </div>
      <button type="submit" disabled={pending} className="admin-btn w-full">
        Save draft
      </button>
    </form>
  );
}
