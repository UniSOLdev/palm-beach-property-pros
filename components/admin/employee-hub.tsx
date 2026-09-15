"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  clockIn,
  clockOut,
  getHubSnapshot,
  recordInventoryCount,
  submitCrewReferral,
  updateReferralStatus,
} from "@/lib/admin/actions/hub";
import { formatCurrency } from "@/lib/admin/format";
import type { HubCrewMember, HubSnapshot } from "@/lib/admin/types-hub";
import { CORE_SERVICES } from "@/lib/marketing/core-services";

const CREW_STORAGE_KEY = "pbpp-hub-crew-id";

type Tab = "clock" | "jobs" | "refer" | "inventory" | "earn";

function formatDuration(clockInIso: string) {
  const ms = Date.now() - new Date(clockInIso).getTime();
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function referralStatusLabel(status: string) {
  switch (status) {
    case "approved":
      return "Approved";
    case "paid":
      return "Paid";
    case "declined":
      return "Declined";
    default:
      return "Pending review";
  }
}

export function EmployeeHub({ crewMembers }: { crewMembers: HubCrewMember[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("clock");
  const [crewId, setCrewId] = useState("");
  const [snapshot, setSnapshot] = useState<HubSnapshot | null>(null);
  const [error, setError] = useState("");
  const [clockNotes, setClockNotes] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [referForm, setReferForm] = useState({
    contact_name: "",
    contact_phone: "",
    service_requested: "",
    description: "",
  });
  const [inventoryFilter, setInventoryFilter] = useState("");
  const [countDrafts, setCountDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem(CREW_STORAGE_KEY);
    if (saved && crewMembers.some((c) => c.id === saved)) setCrewId(saved);
    else if (crewMembers.length === 1) setCrewId(crewMembers[0].id);
  }, [crewMembers]);

  useEffect(() => {
    if (!crewId) {
      setSnapshot(null);
      return;
    }
    localStorage.setItem(CREW_STORAGE_KEY, crewId);
    startTransition(async () => {
      try {
        setError("");
        const data = await getHubSnapshot(crewId);
        setSnapshot(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load hub");
        setSnapshot(null);
      }
    });
  }, [crewId]);

  const filteredSupplies = useMemo(() => {
    if (!snapshot) return [];
    const q = inventoryFilter.trim().toLowerCase();
    if (!q) return snapshot.supplies;
    return snapshot.supplies.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.storage_location ?? "").toLowerCase().includes(q),
    );
  }, [snapshot, inventoryFilter]);

  function refresh() {
    if (!crewId) return;
    startTransition(async () => {
      try {
        setError("");
        setSnapshot(await getHubSnapshot(crewId));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Refresh failed");
      }
    });
  }

  function handleClockIn() {
    if (!crewId) return;
    startTransition(async () => {
      try {
        setError("");
        await clockIn(crewId, selectedJobId || null);
        setSelectedJobId("");
        setSnapshot(await getHubSnapshot(crewId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Clock in failed");
      }
    });
  }

  function handleClockOut() {
    if (!snapshot?.openEntry) return;
    startTransition(async () => {
      try {
        setError("");
        await clockOut(snapshot.openEntry!.id, clockNotes);
        setClockNotes("");
        setSnapshot(await getHubSnapshot(crewId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Clock out failed");
      }
    });
  }

  function handleReferralSubmit() {
    if (!crewId) return;
    startTransition(async () => {
      try {
        setError("");
        await submitCrewReferral({ crew_member_id: crewId, ...referForm });
        setReferForm({
          contact_name: "",
          contact_phone: "",
          service_requested: "",
          description: "",
        });
        setTab("earn");
        setSnapshot(await getHubSnapshot(crewId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Referral failed");
      }
    });
  }

  function handleInventoryCount(supplyId: string) {
    if (!crewId) return;
    const raw = countDrafts[supplyId];
    const counted = Number(raw);
    if (!Number.isFinite(counted) || counted < 0) {
      setError("Enter a valid counted quantity.");
      return;
    }
    startTransition(async () => {
      try {
        setError("");
        await recordInventoryCount({
          crew_member_id: crewId,
          supply_id: supplyId,
          counted_qty: counted,
        });
        setCountDrafts((prev) => {
          const next = { ...prev };
          delete next[supplyId];
          return next;
        });
        setSnapshot(await getHubSnapshot(crewId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Count failed");
      }
    });
  }

  function handleReferralAction(referralId: string, status: "approved" | "paid" | "declined") {
    startTransition(async () => {
      try {
        setError("");
        await updateReferralStatus(referralId, status);
        setSnapshot(await getHubSnapshot(crewId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "clock", label: "Clock", icon: "⏱" },
    { id: "jobs", label: "Jobs", icon: "📋" },
    { id: "refer", label: "Refer", icon: "🤝" },
    { id: "inventory", label: "Stock", icon: "📦" },
    { id: "earn", label: "Earn", icon: "💰" },
  ];

  return (
    <div className="space-y-4 pb-8">
      <div className="admin-card space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">Field crew</p>
          <h1 className="text-xl font-bold text-navy">Employee Hub</h1>
          <p className="text-sm text-charcoal/70">
            Clock in, log referrals, count inventory, and track incentive payouts.
          </p>
        </div>
        <label className="block text-sm font-semibold text-navy">
          Who is on site?
          <select
            className="admin-input mt-2 w-full"
            value={crewId}
            onChange={(e) => setCrewId(e.target.value)}
          >
            <option value="">Select crew member…</option>
            {crewMembers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {snapshot?.crew ? (
          <p className="text-xs text-charcoal/60">
            Referral bonus: {formatCurrency(snapshot.crew.referral_bonus_flat)} per secured job
            {snapshot.crew.referral_bonus_percent > 0
              ? ` · ${snapshot.crew.referral_bonus_percent}% of first invoice`
              : ""}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {!crewId ? (
        <div className="admin-card text-sm text-charcoal/70">
          Add crew members under Admin → More → Crew (Supabase `crew_members`), then select your name
          here.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-1 rounded-2xl border border-navy/10 bg-white p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-[52px] rounded-xl text-[10px] font-semibold transition ${
                  tab === t.id ? "bg-navy text-white shadow-md" : "text-navy hover:bg-sky/40"
                }`}
              >
                <span className="block text-base">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "clock" ? (
            <section className="admin-card space-y-4">
              {snapshot?.openEntry ? (
                <>
                  <div className="rounded-xl bg-leaf/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-leaf">On clock</p>
                    <p className="mt-1 text-2xl font-bold text-navy">
                      {formatDuration(snapshot.openEntry.clock_in)}
                    </p>
                    <p className="text-xs text-charcoal/60">
                      Started {new Date(snapshot.openEntry.clock_in).toLocaleTimeString()}
                    </p>
                  </div>
                  <label className="block text-sm font-semibold text-navy">
                    Shift notes (optional)
                    <textarea
                      className="admin-input mt-2 min-h-[72px] w-full"
                      value={clockNotes}
                      onChange={(e) => setClockNotes(e.target.value)}
                      placeholder="Job site, weather, equipment issues…"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleClockOut}
                    className="admin-btn w-full min-h-[56px] bg-red-700 text-white hover:bg-red-800"
                  >
                    Clock out
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-charcoal/75">
                    Clock in when you arrive on site. Optionally tie the shift to today&apos;s job.
                  </p>
                  {snapshot?.todayJobs.length ? (
                    <label className="block text-sm font-semibold text-navy">
                      Job (optional)
                      <select
                        className="admin-input mt-2 w-full"
                        value={selectedJobId}
                        onChange={(e) => setSelectedJobId(e.target.value)}
                      >
                        <option value="">General / travel / shop</option>
                        {snapshot.todayJobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleClockIn}
                    className="admin-btn w-full min-h-[56px]"
                  >
                    Clock in
                  </button>
                </>
              )}
            </section>
          ) : null}

          {tab === "jobs" ? (
            <section className="space-y-3">
              <div className="admin-card">
                <h2 className="font-bold text-navy">Today&apos;s jobs</h2>
                {!snapshot?.todayJobs.length ? (
                  <p className="mt-2 text-sm text-charcoal/70">No jobs assigned for today.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {snapshot.todayJobs.map((j) => (
                      <li key={j.id}>
                        <Link
                          href={`/admin/jobs/${j.id}`}
                          className="block rounded-xl border border-navy/10 px-4 py-3 text-sm font-semibold text-navy no-underline hover:bg-sky/30"
                        >
                          {j.label}
                          {j.start_time ? (
                            <span className="mt-1 block text-xs font-normal text-charcoal/60">
                              {j.start_time}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="admin-card">
                <h2 className="font-bold text-navy">Open tasks</h2>
                {!snapshot?.todayTasks.length ? (
                  <p className="mt-2 text-sm text-charcoal/70">No open tasks assigned to you.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {snapshot.todayTasks.map((t) => (
                      <li
                        key={t.id}
                        className="rounded-xl border border-navy/10 px-4 py-3 text-sm text-charcoal/85"
                      >
                        <p className="font-semibold text-navy">{t.title}</p>
                        <p className="text-xs text-charcoal/55">
                          {t.status.replace("_", " ")}
                          {t.due_date ? ` · due ${t.due_date}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href="/admin/tasks" className="link-luxury mt-4 inline-block text-sm">
                  Open task board →
                </Link>
              </div>
            </section>
          ) : null}

          {tab === "refer" ? (
            <section className="admin-card space-y-4">
              <div>
                <h2 className="font-bold text-navy">Refer a job</h2>
                <p className="mt-1 text-sm text-charcoal/75">
                  Know someone who needs yard work, cleaning, or detailing? Submit their info — if it
                  books, you earn the referral bonus.
                </p>
              </div>
              <label className="block text-sm font-semibold text-navy">
                Contact name *
                <input
                  className="admin-input mt-2 w-full"
                  value={referForm.contact_name}
                  onChange={(e) => setReferForm((f) => ({ ...f, contact_name: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-semibold text-navy">
                Phone
                <input
                  className="admin-input mt-2 w-full"
                  type="tel"
                  value={referForm.contact_phone}
                  onChange={(e) => setReferForm((f) => ({ ...f, contact_phone: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-semibold text-navy">
                Service
                <select
                  className="admin-input mt-2 w-full"
                  value={referForm.service_requested}
                  onChange={(e) =>
                    setReferForm((f) => ({ ...f, service_requested: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  {CORE_SERVICES.map((s) => (
                    <option key={s.slug} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="Other / not sure">Other / not sure</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-navy">
                Notes
                <textarea
                  className="admin-input mt-2 min-h-[80px] w-full"
                  value={referForm.description}
                  onChange={(e) => setReferForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="How you know them, property details, urgency…"
                />
              </label>
              <button
                type="button"
                disabled={pending || !referForm.contact_name.trim()}
                onClick={handleReferralSubmit}
                className="admin-btn w-full min-h-[48px]"
              >
                Submit referral
              </button>
            </section>
          ) : null}

          {tab === "inventory" ? (
            <section className="space-y-3">
              {snapshot?.lowStock.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">{snapshot.lowStock.length} item(s) at or below reorder level</p>
                </div>
              ) : null}
              <div className="admin-card space-y-3">
                <h2 className="font-bold text-navy">Field inventory count</h2>
                <p className="text-sm text-charcoal/75">
                  Set the on-hand quantity you physically counted. Updates sync to Supplies.
                </p>
                <input
                  className="admin-input w-full"
                  placeholder="Search supplies…"
                  value={inventoryFilter}
                  onChange={(e) => setInventoryFilter(e.target.value)}
                />
                <ul className="max-h-[420px] space-y-2 overflow-y-auto">
                  {filteredSupplies.map((s) => (
                    <li key={s.id} className="rounded-xl border border-navy/10 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-navy">{s.name}</p>
                          <p className="text-xs text-charcoal/60">
                            System: {s.quantity} {s.unit}
                            {s.storage_location ? ` · ${s.storage_location}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          className="admin-input flex-1"
                          type="number"
                          min={0}
                          step="any"
                          placeholder="Counted qty"
                          value={countDrafts[s.id] ?? String(s.quantity)}
                          onChange={(e) =>
                            setCountDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleInventoryCount(s.id)}
                          className="admin-btn-secondary shrink-0 px-4"
                        >
                          Save
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/admin/supplies" className="link-luxury inline-block text-sm">
                  Full supplies manager →
                </Link>
              </div>
            </section>
          ) : null}

          {tab === "earn" ? (
            <section className="admin-card space-y-3">
              <h2 className="font-bold text-navy">Referral incentives</h2>
              {!snapshot?.referrals.length ? (
                <p className="text-sm text-charcoal/70">
                  No referrals yet. Use the Refer tab when you bring in a lead.
                </p>
              ) : (
                <ul className="space-y-3">
                  {snapshot.referrals.map((r) => (
                    <li key={r.id} className="rounded-xl border border-navy/10 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-navy">{r.contact_name}</p>
                          <p className="text-xs text-charcoal/60">
                            {r.service_requested || "Service TBD"} ·{" "}
                            {new Date(r.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="rounded-full bg-sky/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-navy">
                          {referralStatusLabel(r.status)}
                        </span>
                      </div>
                      {r.incentive_amount != null ? (
                        <p className="mt-2 text-sm font-semibold text-ocean">
                          {formatCurrency(r.incentive_amount)}
                        </p>
                      ) : null}
                      {r.lead_id ? (
                        <Link
                          href={`/admin/leads/${r.lead_id}`}
                          className="link-luxury mt-2 inline-block text-xs"
                        >
                          View lead →
                        </Link>
                      ) : null}
                      {r.status === "pending" ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleReferralAction(r.id, "approved")}
                            className="admin-btn-secondary px-3 py-1.5 text-xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleReferralAction(r.id, "paid")}
                            className="admin-btn px-3 py-1.5 text-xs"
                          >
                            Mark paid
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleReferralAction(r.id, "declined")}
                            className="admin-btn-secondary px-3 py-1.5 text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={refresh}
            className="admin-btn-secondary w-full min-h-[44px] text-sm"
          >
            Refresh
          </button>
        </>
      )}
    </div>
  );
}
