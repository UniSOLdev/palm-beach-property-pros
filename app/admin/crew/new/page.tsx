export const dynamic = "force-dynamic";

import Link from "next/link";

import { CrewMemberForm } from "@/components/admin/crew-member-form";

export const metadata = {
  title: "Add crew member",
};

export default function NewCrewMemberPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">Crew operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Add crew member</h1>
          <p className="mt-1 text-sm text-zinc-500">Build your field roster with roles, pay defaults, and availability.</p>
        </div>
        <Link href="/admin/crew" className="text-sm text-sky-300 no-underline hover:underline">
          ← Crew board
        </Link>
      </div>
      <CrewMemberForm mode="create" />
    </div>
  );
}
