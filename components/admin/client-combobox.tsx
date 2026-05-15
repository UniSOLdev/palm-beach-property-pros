"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type ClientSummary = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  created_at?: string;
};

type ActivityState = {
  invoices: { id: string; title: string | null; status: string; total_cents: number; created_at: string }[];
  jobs: { id: string; title: string; status: string; completed_at: string | null; created_at: string }[];
} | null;

type ClientComboboxProps = {
  value: ClientSummary | null;
  onValueChange: (client: ClientSummary | null) => void;
  recentClients: ClientSummary[];
  onOpenNewClient: () => void;
};

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function ClientCombobox({
  value: selected,
  onValueChange,
  recentClients,
  onOpenNewClient,
}: ClientComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchHits, setSearchHits] = useState<ClientSummary[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [activity, setActivity] = useState<ActivityState>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [clientPickerMode, setClientPickerMode] = useState<"locked" | "search">(() =>
    selected ? "locked" : "search",
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => clearTimeout(t);
  }, [query]);

  const selectedId = selected?.id;

  useEffect(() => {
    if (selectedId) setClientPickerMode("locked");
    else setClientPickerMode("search");
  }, [selectedId]);

  useEffect(() => {
    if (!open) return;
    if (!debouncedQuery) {
      setSearchHits([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/clients?q=${encodeURIComponent(debouncedQuery)}&limit=40`,
        );
        const data = await res.json();
        if (!cancelled) {
          setSearchHits((data.clients as ClientSummary[]) ?? []);
        }
      } catch {
        if (!cancelled) setSearchHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const loadActivity = useCallback(async (clientId: string) => {
    setActivityLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/activity`);
      const data = await res.json();
      if (res.ok) {
        setActivity({
          invoices: data.invoices ?? [],
          jobs: data.jobs ?? [],
        });
      } else {
        setActivity({ invoices: [], jobs: [] });
      }
    } catch {
      setActivity({ invoices: [], jobs: [] });
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected?.id) {
      void loadActivity(selected.id);
    } else {
      setActivity(null);
    }
  }, [selected?.id, loadActivity]);

  const quickList = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return recentClients;
    return recentClients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false),
    );
  }, [recentClients, debouncedQuery]);

  const options = useMemo(() => {
    const byId = new Map<string, ClientSummary>();
    for (const c of quickList) byId.set(c.id, c);
    for (const c of searchHits) byId.set(c.id, c);
    return [...byId.values()];
  }, [quickList, searchHits]);

  useEffect(() => {
    setHighlight(0);
  }, [options.length, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(client: ClientSummary) {
    onValueChange(client);
    setQuery("");
    setOpen(false);
    setClientPickerMode("locked");
    inputRef.current?.blur();
  }

  function clearSelection() {
    onValueChange(null);
    setClientPickerMode("search");
    setQuery("");
    queueMicrotask(() => inputRef.current?.focus());
  }

  function beginChangeClient() {
    setClientPickerMode("search");
    setQuery("");
    setOpen(true);
    queueMicrotask(() => inputRef.current?.focus());
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(0, options.length - 1)));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    }
    if (e.key === "Enter" && options[highlight]) {
      e.preventDefault();
      pick(options[highlight]);
    }
  };

  const showSearch = !selected || clientPickerMode === "search";

  return (
    <div ref={rootRef} className="relative space-y-3">
      {showSearch ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="relative min-w-0 flex-1">
            <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Client
            </label>
            <div className="mt-1 flex rounded-xl border border-white/10 bg-white/[0.04] shadow-inner shadow-black/40 ring-1 ring-white/[0.06] transition focus-within:border-sky-400/40 focus-within:ring-sky-400/25">
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                autoComplete="off"
                placeholder="Search name, phone, or email…"
                className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                value={query}
                onChange={(e) => {
                  const v = e.target.value;
                  setQuery(v);
                  setOpen(true);
                  if (selected && v !== selected.full_name) {
                    onValueChange(null);
                  }
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
              />
            </div>

            {open ? (
              <div
                id={listId}
                role="listbox"
                className="absolute left-0 right-0 z-30 mt-2 max-h-[min(22rem,70vh)] overflow-auto rounded-xl border border-white/10 bg-[#0e1218]/95 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/[0.07] backdrop-blur-xl"
              >
                {loading ? (
                  <p className="px-3 py-2 text-xs text-zinc-500">Searching directory…</p>
                ) : null}
                {!debouncedQuery && quickList.length > 0 ? (
                  <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Recent & quick picks
                  </p>
                ) : null}
                {options.length === 0 && !loading ? (
                  <p className="px-3 py-4 text-sm text-zinc-500">
                    No matches. Use{" "}
                    <button
                      type="button"
                      className="font-medium text-sky-300 underline-offset-2 hover:underline"
                      onClick={() => {
                        setOpen(false);
                        onOpenNewClient();
                      }}
                    >
                      + New Client
                    </button>{" "}
                    to add this contact.
                  </p>
                ) : null}
                <ul className="space-y-0.5">
                  {options.map((c, i) => (
                    <li key={c.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === highlight}
                        className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          i === highlight ? "bg-sky-500/15 text-sky-50" : "text-zinc-200 hover:bg-white/5"
                        }`}
                        onMouseEnter={() => setHighlight(i)}
                        onClick={() => pick(c)}
                      >
                        <span className="font-medium">{c.full_name}</span>
                        <span className="mt-0.5 text-xs text-zinc-500">
                          {[c.phone, c.email].filter(Boolean).join(" · ") || "No phone or email on file"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="sm:pt-6">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenNewClient();
              }}
              className="inline-flex w-full items-center justify-center rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100 shadow-[0_0_24px_-8px_rgba(56,189,248,0.5)] transition hover:border-sky-400/60 hover:bg-sky-500/20 sm:w-auto"
            >
              + New Client
            </button>
          </div>
        </div>
      ) : null}

      {selected && clientPickerMode === "locked" ? (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-4 ring-1 ring-white/[0.05]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-300/90">Linked</p>
              <p className="mt-1 text-base font-semibold text-white">{selected.full_name}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {[selected.phone, selected.email].filter(Boolean).join(" · ") || "Add phone/email in CRM later"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={beginChangeClient}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
              >
                Change client
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-white/10"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Recent invoices
              </p>
              {activityLoading ? (
                <p className="mt-2 text-xs text-zinc-500">Loading…</p>
              ) : activity && activity.invoices.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
                  {activity.invoices.map((inv) => (
                    <li key={inv.id} className="flex justify-between gap-2">
                      <span className="truncate">{inv.title || "Invoice"}</span>
                      <span className="shrink-0 text-zinc-500">{formatUsd(inv.total_cents)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-zinc-600">No prior invoices.</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Jobs</p>
              {activityLoading ? (
                <p className="mt-2 text-xs text-zinc-500">Loading…</p>
              ) : activity && activity.jobs.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-xs text-zinc-300">
                  {activity.jobs.map((j) => (
                    <li key={j.id} className="flex justify-between gap-2">
                      <span className="truncate">{j.title}</span>
                      <span className="shrink-0 capitalize text-zinc-500">{j.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-zinc-600">No jobs on file.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
