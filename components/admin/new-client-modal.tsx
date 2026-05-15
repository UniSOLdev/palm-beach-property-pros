"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ClientSummary } from "@/components/admin/client-combobox";

type NewClientModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (client: ClientSummary) => void;
};

export function NewClientModal({ open, onClose, onCreated }: NewClientModalProps) {
  const panelId = useId();
  const firstField = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    queueMicrotask(() => firstField.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFullName("");
      setPhone("");
      setEmail("");
      setNotes("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone || null,
          email: email || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create client");
        return;
      }
      onCreated(data.client as ClientSummary);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={panelId}
        className="relative z-[101] max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-white/10 bg-[#0b0e14]/95 p-6 shadow-2xl ring-1 ring-white/10 sm:rounded-2xl"
      >
        <h2 id={panelId} className="text-lg font-semibold text-white">
          New client
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Creates a CRM record and selects it for this invoice.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Full name *</label>
            <input
              ref={firstField}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-0 focus:border-sky-400/50"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</label>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Internal notes</label>
            <textarea
              className="mt-1 min-h-[4.5rem] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !fullName.trim()}
            onClick={() => void submit()}
            className="rounded-lg bg-sky-500/90 px-4 py-2.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-900/40 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Create & select"}
          </button>
        </div>
      </div>
    </div>
  );
}
