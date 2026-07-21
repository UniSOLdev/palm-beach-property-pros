"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveServiceArea, type ServiceAreaInput } from "@/lib/admin/actions/service-areas";

type Area = {
  id: string;
  name: string;
  slug: string;
  area_type: string;
  county: string | null;
  zip_codes: string[];
  seo_title: string | null;
  seo_description: string | null;
  hero_headline: string | null;
  body_content: string;
  is_active: boolean;
  sort_order: number;
};

export function ServiceAreaManager({ initialAreas }: { initialAreas: Area[] }) {
  const router = useRouter();
  const [areas, setAreas] = useState(initialAreas);
  const [selected, setSelected] = useState<Area | null>(areas[0] ?? null);
  const [pending, startTransition] = useTransition();

  function save(form: ServiceAreaInput) {
    startTransition(async () => {
      await saveServiceArea(form, selected?.id);
      router.refresh();
    });
  }

  if (!selected) {
    return <div className="admin-card text-sm text-charcoal/70">No service areas yet. Run migrations to seed defaults.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {areas.map((area) => (
          <button
            key={area.id}
            type="button"
            onClick={() => setSelected(area)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
              selected.id === area.id ? "bg-navy text-cream" : "border border-navy/15 bg-white"
            }`}
          >
            {area.name}
          </button>
        ))}
      </div>

      <div className="admin-card space-y-3">
        <label className="block text-sm">
          City name
          <input
            defaultValue={selected.name}
            onBlur={(e) => setSelected({ ...selected, name: e.target.value })}
            className="admin-input mt-1"
          />
        </label>
        <label className="block text-sm">
          Slug
          <input
            defaultValue={selected.slug}
            onBlur={(e) => setSelected({ ...selected, slug: e.target.value })}
            className="admin-input mt-1"
          />
        </label>
        <label className="block text-sm">
          Hero headline
          <input
            defaultValue={selected.hero_headline ?? ""}
            onBlur={(e) => setSelected({ ...selected, hero_headline: e.target.value })}
            className="admin-input mt-1"
          />
        </label>
        <label className="block text-sm">
          Page content
          <textarea
            rows={6}
            defaultValue={selected.body_content}
            onBlur={(e) => setSelected({ ...selected, body_content: e.target.value })}
            className="admin-input mt-1"
          />
        </label>
        <label className="inline-flex min-h-[44px] items-center gap-2 text-sm">
          <input
            type="checkbox"
            defaultChecked={selected.is_active}
            onChange={(e) => setSelected({ ...selected, is_active: e.target.checked })}
          />
          Active / public
        </label>
        <button
          type="button"
          disabled={pending}
          className="admin-btn min-h-[48px] w-full"
          onClick={() =>
            save({
              name: selected.name,
              slug: selected.slug,
              area_type: selected.area_type as ServiceAreaInput["area_type"],
              county: selected.county,
              zip_codes: selected.zip_codes,
              seo_title: selected.seo_title,
              seo_description: selected.seo_description,
              hero_headline: selected.hero_headline,
              body_content: selected.body_content,
              is_active: selected.is_active,
              sort_order: selected.sort_order,
            })
          }
        >
          {pending ? "Saving…" : "Save service area"}
        </button>
        <a
          href={`/service-area/${selected.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm font-semibold text-ocean"
        >
          Preview public page ↗
        </a>
      </div>
    </div>
  );
}
