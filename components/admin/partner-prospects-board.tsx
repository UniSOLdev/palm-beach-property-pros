"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  archiveOutreachProspect,
  createOutreachProspect,
  updateOutreachProspect,
} from "@/lib/admin/actions/outreach";
import { formatDate } from "@/lib/admin/format";
import {
  PROSPECT_PITCH_SNIPPET,
  PROSPECT_STATUSES,
  PROSPECT_STATUS_LABELS,
  PROSPECT_TYPES,
  PROSPECT_TYPE_LABELS,
  prospectStatusClass,
  type ProspectStatus,
  type ProspectType,
} from "@/lib/admin/outreach/constants";
import type { OutreachProspectRow } from "@/lib/admin/types-outreach";

function phoneTel(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:+1${digits.replace(/^1/, "")}` : null;
}

function mailto(email: string | null) {
  return email ? `mailto:${email}` : null;
}

export function PartnerProspectsBoard({
  initial,
  initialType,
  initialStatus,
  initialSearch,
}: {
  initial: OutreachProspectRow[];
  initialType: ProspectType | "all";
  initialStatus: ProspectStatus | "all";
  initialSearch: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftFollowUp, setDraftFollowUp] = useState<Record<string, string>>({});
  const [newProspect, setNewProspect] = useState({
    company_name: "",
    prospect_type: "landlord" as ProspectType,
    contact_name: "",
    phone: "",
    email: "",
    pitch_notes: "",
  });

  const dueToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return initial.filter((p) => p.next_follow_up && p.next_follow_up <= today && p.status !== "won" && p.status !== "lost");
  }, [initial]);

  function refresh() {
    router.refresh();
  }

  function markStatus(id: string, status: ProspectStatus) {
    startTransition(async () => {
      try {
        setError("");
        await updateOutreachProspect(id, { status });
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  function saveDetails(row: OutreachProspectRow) {
    startTransition(async () => {
      try {
        setError("");
        await updateOutreachProspect(row.id, {
          internal_notes: draftNotes[row.id] ?? row.internal_notes ?? null,
          next_follow_up: draftFollowUp[row.id] || null,
        });
        setExpandedId(null);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function addProspect() {
    startTransition(async () => {
      try {
        setError("");
        await createOutreachProspect(newProspect);
        setNewProspect({
          company_name: "",
          prospect_type: "landlord",
          contact_name: "",
          phone: "",
          email: "",
          pitch_notes: "",
        });
        setShowAdd(false);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add prospect");
      }
    });
  }

  function archive(id: string) {
    if (!confirm("Archive this prospect?")) return;
    startTransition(async () => {
      try {
        setError("");
        await archiveOutreachProspect(id);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Archive failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="admin-card space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ocean">Pitch snippet</p>
        <p className="text-sm leading-relaxed text-charcoal/80">{PROSPECT_PITCH_SNIPPET}</p>
      </div>

      {dueToday.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">{dueToday.length} follow-up(s) due</p>
          <ul className="mt-1 space-y-0.5">
            {dueToday.slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.company_name}
                {p.next_follow_up ? ` · ${p.next_follow_up}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowAdd((v) => !v)} className="admin-btn">
          + Add prospect
        </button>
        <LinkTabs type={initialType} status={initialStatus} search={initialSearch} />
      </div>

      {showAdd ? (
        <div className="admin-card space-y-3">
          <h2 className="font-bold text-navy">New prospect</h2>
          <label className="block text-sm font-semibold text-navy">
            Company / name *
            <input
              className="admin-input mt-1 w-full"
              value={newProspect.company_name}
              onChange={(e) => setNewProspect((p) => ({ ...p, company_name: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-navy">
            Type
            <select
              className="admin-input mt-1 w-full"
              value={newProspect.prospect_type}
              onChange={(e) =>
                setNewProspect((p) => ({ ...p, prospect_type: e.target.value as ProspectType }))
              }
            >
              {PROSPECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROSPECT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold text-navy">
              Contact
              <input
                className="admin-input mt-1 w-full"
                value={newProspect.contact_name}
                onChange={(e) => setNewProspect((p) => ({ ...p, contact_name: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-semibold text-navy">
              Phone
              <input
                className="admin-input mt-1 w-full"
                value={newProspect.phone}
                onChange={(e) => setNewProspect((p) => ({ ...p, phone: e.target.value }))}
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-navy">
            Email
            <input
              className="admin-input mt-1 w-full"
              type="email"
              value={newProspect.email}
              onChange={(e) => setNewProspect((p) => ({ ...p, email: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold text-navy">
            Notes
            <textarea
              className="admin-input mt-1 min-h-[60px] w-full"
              value={newProspect.pitch_notes}
              onChange={(e) => setNewProspect((p) => ({ ...p, pitch_notes: e.target.value }))}
            />
          </label>
          <button
            type="button"
            disabled={pending || !newProspect.company_name.trim()}
            onClick={addProspect}
            className="admin-btn w-full"
          >
            Save prospect
          </button>
        </div>
      ) : null}

      <ul className="space-y-3">
        {initial.length === 0 ? (
          <li className="admin-card text-sm text-charcoal/70">
            No prospects match. Run the outreach migration on Supabase or add one above.
          </li>
        ) : (
          initial.map((row) => {
            const tel = phoneTel(row.phone);
            const mail = mailto(row.email);
            const expanded = expandedId === row.id;
            return (
              <li key={row.id} className="admin-card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-navy">{row.company_name}</h3>
                      <span className="rounded-full bg-sky/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                        {PROSPECT_TYPE_LABELS[row.prospect_type]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${prospectStatusClass(row.status)}`}
                      >
                        {PROSPECT_STATUS_LABELS[row.status]}
                      </span>
                    </div>
                    {row.contact_name ? (
                      <p className="mt-1 text-sm text-charcoal/70">{row.contact_name}</p>
                    ) : null}
                    {(row.address || row.zip) && (
                      <p className="text-xs text-charcoal/55">
                        {[row.address, row.zip].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {row.pitch_notes ? (
                      <p className="mt-2 text-sm leading-relaxed text-charcoal/75">{row.pitch_notes}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tel ? (
                    <a href={tel} className="admin-btn-secondary px-3 py-2 text-xs no-underline">
                      Call {row.phone}
                    </a>
                  ) : null}
                  {mail ? (
                    <a href={mail} className="admin-btn-secondary px-3 py-2 text-xs no-underline">
                      Email
                    </a>
                  ) : null}
                  {row.website ? (
                    <a
                      href={row.website}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn-secondary px-3 py-2 text-xs no-underline"
                    >
                      Website
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedId(expanded ? null : row.id);
                      setDraftNotes((d) => ({ ...d, [row.id]: row.internal_notes ?? "" }));
                      setDraftFollowUp((d) => ({
                        ...d,
                        [row.id]: row.next_follow_up ?? "",
                      }));
                    }}
                    className="admin-btn-secondary px-3 py-2 text-xs"
                  >
                    {expanded ? "Close" : "Notes"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {PROSPECT_STATUSES.filter((s) => s !== row.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={pending}
                      onClick={() => markStatus(row.id, s)}
                      className="rounded-lg border border-navy/10 px-2 py-1 text-[10px] font-semibold text-navy hover:bg-sky/40"
                    >
                      → {PROSPECT_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>

                {expanded ? (
                  <div className="space-y-3 border-t border-navy/10 pt-3">
                    <label className="block text-sm font-semibold text-navy">
                      Internal notes
                      <textarea
                        className="admin-input mt-1 min-h-[72px] w-full"
                        value={draftNotes[row.id] ?? ""}
                        onChange={(e) =>
                          setDraftNotes((d) => ({ ...d, [row.id]: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block text-sm font-semibold text-navy">
                      Next follow-up
                      <input
                        type="date"
                        className="admin-input mt-1 w-full"
                        value={draftFollowUp[row.id] ?? ""}
                        onChange={(e) =>
                          setDraftFollowUp((d) => ({ ...d, [row.id]: e.target.value }))
                        }
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => saveDetails(row)}
                        className="admin-btn flex-1"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => archive(row.id)}
                        className="admin-btn-secondary flex-1"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ) : null}

                {row.next_follow_up && !expanded ? (
                  <p className="text-xs text-charcoal/55">
                    Follow-up: {formatDate(row.next_follow_up)}
                  </p>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function LinkTabs({
  type,
  status,
  search,
}: {
  type: ProspectType | "all";
  status: ProspectStatus | "all";
  search: string;
}) {
  const base = "/admin/leads/partners";
  const qs = (t: string, s: string) => {
    const p = new URLSearchParams();
    if (t !== "all") p.set("type", t);
    if (s !== "all") p.set("status", s);
    if (search) p.set("q", search);
    const str = p.toString();
    return str ? `${base}?${str}` : base;
  };

  return (
    <div className="flex flex-wrap gap-1">
      <a
        href={qs("property_manager", status)}
        className={`rounded-lg px-2 py-1 text-xs font-semibold no-underline ${type === "property_manager" ? "bg-navy text-white" : "bg-white text-navy border border-navy/10"}`}
      >
        PMs
      </a>
      <a
        href={qs("str_manager", status)}
        className={`rounded-lg px-2 py-1 text-xs font-semibold no-underline ${type === "str_manager" ? "bg-navy text-white" : "bg-white text-navy border border-navy/10"}`}
      >
        Airbnb / STR
      </a>
      <a
        href={qs("landlord", status)}
        className={`rounded-lg px-2 py-1 text-xs font-semibold no-underline ${type === "landlord" ? "bg-navy text-white" : "bg-white text-navy border border-navy/10"}`}
      >
        Landlords
      </a>
      <a
        href={qs("all", status)}
        className={`rounded-lg px-2 py-1 text-xs font-semibold no-underline ${type === "all" ? "bg-navy text-white" : "bg-white text-navy border border-navy/10"}`}
      >
        All
      </a>
    </div>
  );
}
