import Link from "next/link";
import { OutreachAutopilotPanel } from "@/components/admin/outreach-autopilot-panel";
import { PartnerProspectsBoard } from "@/components/admin/partner-prospects-board";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { listOutreachProspects } from "@/lib/admin/actions/outreach";
import { getPendingOutreachDraftsAction } from "@/lib/autopilot/actions/outreach-autopilot";
import {
  PROSPECT_STATUSES,
  PROSPECT_TYPES,
  type ProspectStatus,
  type ProspectType,
} from "@/lib/admin/outreach/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Landlord & STR Prospects" };

type Props = {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>;
};

export default async function PartnerProspectsPage({ searchParams }: Props) {
  const { type: typeParam, status: statusParam, q } = await searchParams;
  const type =
    typeParam && PROSPECT_TYPES.includes(typeParam as ProspectType)
      ? (typeParam as ProspectType)
      : "all";
  const status =
    statusParam && PROSPECT_STATUSES.includes(statusParam as ProspectStatus)
      ? (statusParam as ProspectStatus)
      : "all";
  const search = q?.trim() ?? "";

  let prospects: Awaited<ReturnType<typeof listOutreachProspects>> = [];
  let pendingDrafts: Awaited<ReturnType<typeof getPendingOutreachDraftsAction>> = [];
  let loadError = "";

  try {
    [prospects, pendingDrafts] = await Promise.all([
      listOutreachProspects({ type, status, search }),
      getPendingOutreachDraftsAction().catch(() => []),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load prospects";
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/leads" className="text-sm font-semibold text-ocean no-underline">
          ← Website leads
        </Link>
      </div>

      <AdminPageHeader
        title="Landlord & STR call list"
        subtitle="Property managers, Airbnb operators, and landlords — near Riverstone / 33407"
      />

      {loadError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          {" — "}
          Apply migration <code className="text-xs">20260531150000_outreach_prospects.sql</code> on
          Supabase.
        </p>
      ) : null}

      <form method="get" className="flex gap-2">
        {type !== "all" ? <input type="hidden" name="type" value={type} /> : null}
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        <input
          name="q"
          defaultValue={search}
          placeholder="Search company, phone, notes…"
          className="admin-input flex-1"
        />
        <button type="submit" className="admin-btn-secondary px-4">
          Search
        </button>
      </form>

      <OutreachAutopilotPanel initial={pendingDrafts} />

      <PartnerProspectsBoard
        initial={prospects}
        initialType={type}
        initialStatus={status}
        initialSearch={search}
      />
    </div>
  );
}
