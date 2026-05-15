export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = { title: "Media library" };

export default async function CmsMediaPage() {
  let items: { id: string; public_url: string; title: string | null; alt_text: string | null; category: string }[] = [];
  let err: string | null = null;
  try {
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("cms_media_assets")
      .select("id, public_url, title, alt_text, category")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;
    items = (data ?? []) as typeof items;
  } catch (e) {
    err = e instanceof Error ? e.message : "Could not load media.";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Media library</h1>
          <p className="mt-1 text-sm text-zinc-500">Reusable assets for homepage, services, gallery, and city pages.</p>
        </div>
        <Link
          href="/admin/website"
          className="text-xs font-semibold text-sky-300 no-underline hover:underline"
        >
          ← Website dashboard
        </Link>
      </div>
      {err ? <p className="text-sm text-amber-200">{err}</p> : null}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/[0.05]">
        <h2 className="text-sm font-semibold text-white">Upload</h2>
        <p className="mt-1 text-xs text-zinc-500">
          POST multipart to <code className="text-zinc-300">/api/admin/cms/media/upload</code> (field{" "}
          <code className="text-zinc-300">file</code>
          ). Use the REST client or extend this page with a small upload form when ready.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 ring-1 ring-white/[0.04]">
            <div className="relative aspect-video bg-zinc-900">
              <Image src={m.public_url} alt={m.alt_text ?? ""} fill className="object-cover" sizes="400px" unoptimized />
            </div>
            <div className="p-3 text-xs text-zinc-400">
              <p className="truncate font-medium text-zinc-200">{m.title ?? m.category}</p>
              <p className="mt-1 truncate font-mono text-[10px] text-zinc-600">{m.id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
