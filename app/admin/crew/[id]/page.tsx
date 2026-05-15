export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";

import { CrewMemberForm } from "@/components/admin/crew-member-form";
import { mapCrewMemberRow } from "@/lib/crew-serialization";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = {
  title: "Edit crew member",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCrewMemberPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const supabase = createServiceSupabase();
  const { data, error } = await supabase.from("crew_members").select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{error.message}</p>
      </div>
    );
  }
  if (!data) notFound();

  const member = mapCrewMemberRow(data as Record<string, unknown>);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">Crew operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Edit crew member</h1>
          <p className="mt-1 text-sm text-zinc-500">{member.full_name}</p>
        </div>
        <Link href="/admin/crew" className="text-sm text-sky-300 no-underline hover:underline">
          ← Crew board
        </Link>
      </div>
      <CrewMemberForm mode="edit" initial={member} />
    </div>
  );
}
