"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveHomepageSettings, type HomepageInput } from "@/lib/admin/actions/site-homepage";
import type { SiteHomepageSettings } from "@/lib/site-content/types";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  featured_services: "Featured services",
  trust: "Trust statements",
  featured_projects: "Featured projects",
  testimonials: "Testimonials",
  service_area: "Service area",
  closing_cta: "Closing CTA",
};

type Props = { settings: SiteHomepageSettings };

export function SiteHomepageForm({ settings }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<HomepageInput>({
    hero_eyebrow: settings.hero_eyebrow,
    hero_headline: settings.hero_headline,
    hero_subheadline: settings.hero_subheadline,
    hero_primary_cta_label: settings.hero_primary_cta_label,
    hero_secondary_cta_label: settings.hero_secondary_cta_label,
    trust_microcopy: settings.trust_microcopy,
    trust_statements: settings.trust_statements,
    service_area_content: settings.service_area_content,
    closing_cta_headline: settings.closing_cta_headline,
    closing_cta_body: settings.closing_cta_body,
    section_order: settings.section_order,
    section_visibility: settings.section_visibility,
    hero_media_id: settings.hero_media_id,
    featured_service_ids: settings.featured_service_ids,
    featured_project_ids: settings.featured_project_ids,
  });

  function updateField<K extends keyof HomepageInput>(key: K, value: HomepageInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await saveHomepageSettings(form);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-4 pb-24">
      {error ? <div className="admin-card text-sm text-red-700">{error}</div> : null}

      <label className="block text-sm">
        <span className="font-medium text-navy">Hero eyebrow</span>
        <input
          value={form.hero_eyebrow}
          onChange={(e) => updateField("hero_eyebrow", e.target.value)}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Hero headline</span>
        <input
          value={form.hero_headline}
          onChange={(e) => updateField("hero_headline", e.target.value)}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Hero subheadline</span>
        <textarea
          value={form.hero_subheadline}
          onChange={(e) => updateField("hero_subheadline", e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-navy">Primary CTA label</span>
          <input
            value={form.hero_primary_cta_label}
            onChange={(e) => updateField("hero_primary_cta_label", e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy">Secondary CTA label</span>
          <input
            value={form.hero_secondary_cta_label}
            onChange={(e) => updateField("hero_secondary_cta_label", e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-navy">Trust microcopy</span>
        <input
          value={form.trust_microcopy}
          onChange={(e) => updateField("trust_microcopy", e.target.value)}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Trust statements (one per line)</span>
        <textarea
          value={form.trust_statements.join("\n")}
          onChange={(e) =>
            updateField(
              "trust_statements",
              e.target.value
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean),
            )
          }
          rows={4}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Service area content</span>
        <textarea
          value={form.service_area_content}
          onChange={(e) => updateField("service_area_content", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-navy">Section visibility</legend>
        <div className="mt-2 space-y-2">
          {Object.entries(SECTION_LABELS).map(([key, label]) => (
            <label key={key} className="flex min-h-[44px] items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.section_visibility[key] !== false}
                onChange={(e) =>
                  updateField("section_visibility", {
                    ...form.section_visibility,
                    [key]: e.target.checked,
                  })
                }
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-navy/10 bg-cream/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-3xl gap-2">
          <button type="button" disabled={pending} onClick={onSubmit} className="admin-btn min-h-[48px] flex-1">
            {pending ? "Saving…" : "Save homepage"}
          </button>
          <Link href="/admin/site" className="admin-btn-secondary min-h-[48px] px-4 no-underline">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
