export const dynamic = "force-dynamic";

import Link from "next/link";

import {
  CrewPayoutCalculator,
  type PayoutJobOption,
  type PayoutMemberOption,
} from "@/components/admin/crew-payout-calculator";
import type { CrewMemberRow } from "@/lib/db-types";
import {
  initialsForName,
  labelForRole,
  labelForStatus,
  marginToneClass,
  statusBadgeClasses,
} from "@/lib/crew-constants";
import {
  crewAvatarUrlFromMeta,
  crewDisplayRolesFromMeta,
  crewShowAssignmentSummary,
  crewSkillsFromMeta,
} from "@/lib/crew-meta";
import { calculateJobPayouts, payoutLineFromMember } from "@/lib/crew-payout";
import { mapCrewMemberRow } from "@/lib/crew-serialization";
import { parseCrewAssignments } from "@/lib/job-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "Crew operations",
};

function fmtMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

type DispatchJob = {
  id: string;
  job_number: string | null;
  title: string;
  status: string;
  service_type: string | null;
  revenue_cents: number;
  expense_cents: number;
  client_name: string | null;
  crew_labels: string[];
  updated_at: string;
  est_labor_cents: number;
  est_margin_pct: number;
};

type ServiceMargin = {
  service_type: string;
  revenue_cents: number;
  expense_cents: number;
  job_count: number;
  margin_pct: number;
};

type PageProps = { searchParams: Promise<{ job?: string }> };

export default async function AdminCrewPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const initialJobId = sp.job?.trim();

  let err: string | null = null;
  let members: CrewMemberRow[] = [];
  let dispatchJobs: DispatchJob[] = [];
  let equipmentByCrew: { crew_name: string; items: string[] }[] = [];
  let serviceMargins: ServiceMargin[] = [];

  let stats = {
    active_crew: 0,
    dispatch_today: 0,
    est_labor_payouts_cents: 0,
    labor_pct: 0,
    avg_payout_per_job_cents: 0,
    utilization_pct: 0,
    top_performer: "—",
  };

  try {
    const supabase = createServiceSupabase();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [membersRes, jobsRes, expenseJobRes, inventoryRes] = await Promise.all([
      supabase.from("crew_members").select("*").eq("is_active", true).order("full_name", { ascending: true }),
      supabase
        .from("jobs")
        .select(
          `
          id,
          job_number,
          title,
          status,
          service_type,
          revenue_cents,
          crew_assignments,
          updated_at,
          created_at,
          clients ( full_name )
        `,
        )
        .in("status", ["scheduled", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(80),
      supabase.from("expense_job_totals").select("job_id, total_cents"),
      supabase
        .from("inventory_items")
        .select("name, assigned_crew")
        .not("assigned_crew", "is", null)
        .limit(200),
    ]);

    if (membersRes.error) throw membersRes.error;
    if (jobsRes.error) throw jobsRes.error;

    members = (membersRes.data ?? []).map((r) => mapCrewMemberRow(r as Record<string, unknown>));

    const expenseByJob = new Map<string, number>();
    if (!expenseJobRes.error && expenseJobRes.data) {
      for (const row of expenseJobRes.data) {
        const r = row as { job_id: string; total_cents: number };
        expenseByJob.set(String(r.job_id), Number(r.total_cents) || 0);
      }
    }

    const memberById = new Map(members.map((m) => [m.id, m]));
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalLaborEst = 0;
    const serviceMap = new Map<string, { revenue: number; expenses: number; count: number }>();
    const jobCountForAvg = { n: 0, labor: 0 };

    dispatchJobs = (jobsRes.data ?? []).map((raw) => {
      const j = raw as Record<string, unknown>;
      const c = j.clients;
      const client_name = Array.isArray(c)
        ? (c[0] as { full_name?: string })?.full_name
        : (c as { full_name?: string } | null)?.full_name;

      const crew = parseCrewAssignments(j.crew_assignments);
      const crew_labels = crew.map((a) => (a.role ? `${a.name} · ${a.role}` : a.name));
      const revenue_cents = Number(j.revenue_cents) || 0;
      const expense_cents = expenseByJob.get(String(j.id)) ?? 0;

      const lines = crew.length
        ? crew.map((a, i) => {
            const linked = a.crew_member_id ? memberById.get(a.crew_member_id) : null;
            if (linked) return payoutLineFromMember(linked);
            return {
              id: `job-${j.id}-${i}`,
              name: a.name,
              pay_type: "split" as const,
              pay_rate_cents: 0,
              hours: 0,
              split_percent: 0,
              is_lead: false,
              trainee_multiplier: 1,
              flat_bonus_cents: 0,
              lead_bonus_percent: 10,
            };
          })
        : members.slice(0, 2).map((m) => payoutLineFromMember(m));

      const payout = calculateJobPayouts({
        revenue_cents,
        expense_cents,
        labor_pool_cents: null,
        labor_pool_percent: 33,
        lines,
      });

      totalRevenue += revenue_cents;
      totalExpenses += expense_cents;
      totalLaborEst += payout.total_labor_payout_cents;
      jobCountForAvg.n += 1;
      jobCountForAvg.labor += payout.total_labor_payout_cents;

      const svc = j.service_type != null ? String(j.service_type) : "General";
      const cur = serviceMap.get(svc) ?? { revenue: 0, expenses: 0, count: 0 };
      cur.revenue += revenue_cents;
      cur.expenses += expense_cents;
      cur.count += 1;
      serviceMap.set(svc, cur);

      return {
        id: String(j.id),
        job_number: j.job_number != null ? String(j.job_number) : null,
        title: String(j.title ?? "Job"),
        status: String(j.status),
        service_type: j.service_type != null ? String(j.service_type) : null,
        revenue_cents,
        expense_cents,
        client_name: client_name ? String(client_name) : null,
        crew_labels,
        updated_at: String(j.updated_at ?? j.created_at ?? ""),
        est_labor_cents: payout.total_labor_payout_cents,
        est_margin_pct: payout.profit_margin_percent,
      };
    });

    const dispatchToday = dispatchJobs.filter((j) => j.updated_at >= todayIso).length;
    const assignedCount = members.filter((m) => ["assigned", "on_job"].includes(m.status)).length;
    const utilization_pct = members.length ? Math.round((assignedCount / members.length) * 100) : 0;
    const labor_pct = totalRevenue > 0 ? (totalLaborEst / totalRevenue) * 100 : 0;
    const avg_payout_per_job_cents = jobCountForAvg.n > 0 ? Math.round(jobCountForAvg.labor / jobCountForAvg.n) : 0;

    const top = [...members].sort((a, b) => {
      const aj = dispatchJobs.filter((j) => j.crew_labels.some((l) => l.includes(a.full_name))).length;
      const bj = dispatchJobs.filter((j) => j.crew_labels.some((l) => l.includes(b.full_name))).length;
      return bj - aj;
    })[0];

    stats = {
      active_crew: members.length,
      dispatch_today: dispatchToday || dispatchJobs.length,
      est_labor_payouts_cents: totalLaborEst,
      labor_pct,
      avg_payout_per_job_cents,
      utilization_pct,
      top_performer: top?.full_name ?? "—",
    };

    serviceMargins = [...serviceMap.entries()]
      .map(([service_type, v]) => {
        const margin_pct = v.revenue > 0 ? ((v.revenue - v.expenses) / v.revenue) * 100 : 0;
        return {
          service_type,
          revenue_cents: v.revenue,
          expense_cents: v.expenses,
          job_count: v.count,
          margin_pct,
        };
      })
      .sort((a, b) => b.margin_pct - a.margin_pct);

    if (!inventoryRes.error && inventoryRes.data) {
      const map = new Map<string, string[]>();
      for (const row of inventoryRes.data) {
        const r = row as { name: string; assigned_crew: string };
        const key = String(r.assigned_crew).trim();
        if (!key) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(String(r.name));
      }
      equipmentByCrew = [...map.entries()].map(([crew_name, items]) => ({ crew_name, items }));
    }
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load crew operations.";
  }

  const payoutJobs: PayoutJobOption[] = dispatchJobs.map((j) => ({
    id: j.id,
    label: [j.job_number, j.title, j.client_name].filter(Boolean).join(" · "),
    revenue_cents: j.revenue_cents,
    expense_cents: j.expense_cents,
    crew_names: j.crew_labels.map((l) => l.split(" · ")[0]),
  }));

  const payoutMembers: PayoutMemberOption[] = members.map((m) => ({
    id: m.id,
    full_name: m.full_name,
    default_pay_type: m.default_pay_type,
    default_pay_rate_cents: m.default_pay_rate_cents,
    default_pay_percent: m.default_pay_percent,
    lead_bonus_percent: m.lead_bonus_percent,
    trainee_pay_multiplier: m.trainee_pay_multiplier,
    role: m.role,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">Field workforce</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Crew operations</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Roster, dispatch board, payout estimator, and labor profitability — mobile-ready for field use.
          </p>
        </div>
        <Link
          href="/admin/crew/new"
          className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline shadow-lg shadow-sky-900/25 transition hover:brightness-110"
        >
          Add crew member
        </Link>
      </div>

      {err ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {err}{" "}
          <span className="text-amber-200/80">Apply the crew migration if this environment has not run it yet.</span>
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active crew" value={String(stats.active_crew)} sub="On the roster" />
        <StatCard label="Dispatch board" value={String(stats.dispatch_today)} sub="Scheduled / in progress" tone="sky" />
        <StatCard label="Est. labor payouts" value={fmtMoney(stats.est_labor_payouts_cents)} sub={`Labor ${stats.labor_pct.toFixed(0)}% of revenue`} />
        <StatCard label="Crew utilization" value={`${stats.utilization_pct}%`} sub={`Top: ${stats.top_performer}`} />
        <StatCard label="Avg payout / job" value={fmtMoney(stats.avg_payout_per_job_cents)} sub="From active dispatch jobs" />
        <StatCard
          label="Labor margin signal"
          value={`${(100 - stats.labor_pct).toFixed(0)}%`}
          sub="Revenue after est. labor"
          tone="emerald"
        />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Active crew roster" subtitle="Roles, availability, and default pay structures." />
        {members.length === 0 ? (
          <EmptyState href="/admin/crew/new" label="Add your first tech →" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((m) => {
              const showAssignments = crewShowAssignmentSummary(m.performance_meta);
              const assignedJobs = showAssignments
                ? dispatchJobs.filter((j) =>
                    j.crew_labels.some((l) => l.toLowerCase().includes(m.full_name.toLowerCase())),
                  ).length
                : 0;
              const avatarUrl = crewAvatarUrlFromMeta(m.performance_meta);
              const displayRoles = crewDisplayRolesFromMeta(m.performance_meta);
              const roleSubtitle = displayRoles.length
                ? displayRoles.join(" · ")
                : `${labelForRole(m.role)} · ${m.skill_level}`;
              const skillsPreview = crewSkillsFromMeta(m.performance_meta).slice(0, 4).join(" · ");
              return (
                <Link
                  key={m.id}
                  href={`/admin/crew/${m.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 no-underline ring-1 ring-white/[0.05] transition hover:border-sky-400/35 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start gap-3">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin-only URL from trusted operators
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full border border-sky-400/30 object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/15 text-sm font-semibold text-sky-100">
                        {initialsForName(m.full_name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{m.full_name}</p>
                      <p className="text-xs text-zinc-500">{roleSubtitle}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusBadgeClasses(m.status)}`}>
                      {labelForStatus(m.status)}
                    </span>
                    {showAssignments ? (
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-zinc-400">
                        {assignedJobs} active job{assignedJobs === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] text-zinc-500">
                        Assignments hidden
                      </span>
                    )}
                  </div>
                  {skillsPreview ? (
                    <p className="mt-3 text-xs text-zinc-600 line-clamp-2">{skillsPreview}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-zinc-500">
                    {m.phone ?? m.email ?? "No contact on file"}
                  </p>
                  {m.availability_notes ? (
                    <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{m.availability_notes}</p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Job assignments" subtitle="Operational dispatch — crew, revenue, expenses, and estimated payout." />
        {dispatchJobs.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-black/30 px-4 py-8 text-center text-sm text-zinc-500">
            No scheduled or in-progress jobs on the board.{" "}
            <Link href="/admin/jobs" className="text-sky-300 hover:underline">
              Open jobs →
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {dispatchJobs.map((j) => (
              <div
                key={j.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/[0.05] md:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {j.job_number ? `${j.job_number} · ` : ""}
                      {j.title}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {j.client_name ?? "No client"} · {j.service_type ?? "Service"} ·{" "}
                      <span className="capitalize">{j.status.replace(/_/g, " ")}</span>
                    </p>
                  </div>
                  <Link
                    href={`/admin/crew?job=${j.id}`}
                    className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-sky-200 no-underline hover:border-sky-400/30"
                  >
                    Payout calc
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MiniStat label="Revenue" value={fmtMoney(j.revenue_cents)} />
                  <MiniStat label="Expenses" value={fmtMoney(j.expense_cents)} />
                  <MiniStat label="Est. labor" value={fmtMoney(j.est_labor_cents)} />
                  <MiniStat
                    label="Est. margin"
                    value={`${j.est_margin_pct.toFixed(0)}%`}
                    valueClass={marginToneClass(j.est_margin_pct)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {j.crew_labels.length ? (
                    j.crew_labels.map((c) => (
                      <span key={c} className="rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-100">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-600">No crew assigned — assign in job workspace</span>
                  )}
                </div>
                <div className="mt-3 text-right">
                  <Link href={`/admin/jobs/${j.id}`} className="text-xs font-semibold text-sky-300 no-underline hover:underline">
                    Open job →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CrewPayoutCalculator jobs={payoutJobs} members={payoutMembers} initialJobId={initialJobId} />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
          <SectionTitle title="Labor profitability" subtitle="Service mix on the active dispatch board." />
          <div className="mt-5 space-y-4">
            {serviceMargins.length ? (
              serviceMargins.map((s) => (
                <div key={s.service_type}>
                  <div className="flex justify-between gap-2 text-xs">
                    <span className="text-zinc-200">{s.service_type}</span>
                    <span className="tabular-nums text-zinc-500">
                      {fmtMoney(s.revenue_cents - s.expense_cents)} · {s.job_count} jobs
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${Math.max(8, Math.min(100, s.margin_pct))}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-[10px] ${marginToneClass(s.margin_pct)}`}>{s.margin_pct.toFixed(0)}% est. gross margin</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No service margin data yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
          <SectionTitle title="Crew performance" subtitle="Structured for callbacks, QC, reviews — automation coming later." />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Completed jobs", "Callback rate", "QC score", "Review mentions"].map((label) => (
              <div key={label} className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
                <p className="mt-2 text-sm text-zinc-500">Tracked via `performance_meta`</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <SectionTitle
          title="Equipment assignments"
          subtitle="Future-ready — links depot inventory assigned_crew to roster names."
        />
        {equipmentByCrew.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {equipmentByCrew.map((row) => (
              <div key={row.crew_name} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                <p className="text-sm font-semibold text-white">{row.crew_name}</p>
                <p className="mt-2 text-xs text-zinc-500">{row.items.join(", ")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-zinc-500">
            No loadout gear tagged yet. Assign equipment in{" "}
            <Link href="/admin/supplies" className="text-sky-300 hover:underline">
              ops inventory
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "sky" | "emerald";
}) {
  const ring =
    tone === "sky"
      ? "border-sky-400/20 ring-sky-400/10"
      : tone === "emerald"
        ? "border-emerald-400/20 ring-emerald-400/10"
        : "border-white/10 ring-white/[0.06]";
  return (
    <div className={`rounded-2xl border bg-white/[0.04] p-5 ring-1 ${ring}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
    </div>
  );
}

function MiniStat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className={`mt-1 text-sm font-semibold tabular-nums ${valueClass ?? "text-white"}`}>{value}</p>
    </div>
  );
}

function EmptyState({ href, label }: { href: string; label: string }) {
  return (
    <p className="rounded-2xl border border-white/10 bg-black/30 px-4 py-8 text-center text-sm text-zinc-500">
      <Link href={href} className="text-sky-300 hover:underline">
        {label}
      </Link>
    </p>
  );
}
