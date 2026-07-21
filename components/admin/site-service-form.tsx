"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveService, type ServiceInput } from "@/lib/admin/actions/site-services";
import type { SiteServiceFaq } from "@/lib/site-content/types";

type Props = {
  service: ServiceInput & { id?: string };
  faqs: SiteServiceFaq[];
};

export function SiteServiceForm({ service, faqs }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceInput>({
    ...service,
    faqs: faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      sort_order: f.sort_order,
    })),
  });

  function updateField<K extends keyof ServiceInput>(key: K, value: ServiceInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateList(key: "included" | "add_ons" | "who_its_for" | "process_steps", text: string) {
    updateField(
      key,
      text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    );
  }

  function onSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        await saveService(form, service.id);
        router.push("/admin/site/services");
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
        <span className="font-medium text-navy">Title</span>
        <input
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Slug</span>
        <input
          value={form.slug}
          onChange={(e) => updateField("slug", e.target.value)}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Headline</span>
        <input
          value={form.headline}
          onChange={(e) => updateField("headline", e.target.value)}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Short description</span>
        <textarea
          value={form.short_description}
          onChange={(e) => updateField("short_description", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Long intro</span>
        <textarea
          value={form.authority_intro}
          onChange={(e) => updateField("authority_intro", e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Included services (one per line)</span>
        <textarea
          value={form.included.join("\n")}
          onChange={(e) => updateList("included", e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Add-ons (one per line)</span>
        <textarea
          value={form.add_ons.join("\n")}
          onChange={(e) => updateList("add_ons", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Water access note (pressure washing)</span>
        <textarea
          value={form.water_access_note ?? ""}
          onChange={(e) => updateField("water_access_note", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-navy">Pricing mode</span>
          <select
            value={form.pricing_mode}
            onChange={(e) =>
              updateField("pricing_mode", e.target.value as ServiceInput["pricing_mode"])
            }
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          >
            <option value="starting_at">Starting at</option>
            <option value="custom_estimate">Custom estimate</option>
            <option value="hidden">Hidden</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy">Pricing label</span>
          <input
            value={form.pricing_label}
            onChange={(e) => updateField("pricing_label", e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex min-h-[44px] items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) => updateField("is_featured", e.target.checked)}
          />
          Featured on homepage
        </label>
        <label className="inline-flex min-h-[44px] items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => updateField("is_active", e.target.checked)}
          />
          Active / public
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-navy">FAQs</p>
        {form.faqs.map((faq, index) => (
          <div key={faq.id ?? index} className="rounded-xl border border-navy/10 p-3">
            <input
              value={faq.question}
              onChange={(e) => {
                const next = [...form.faqs];
                next[index] = { ...next[index], question: e.target.value };
                updateField("faqs", next);
              }}
              placeholder="Question"
              className="mb-2 w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
            />
            <textarea
              value={faq.answer}
              onChange={(e) => {
                const next = [...form.faqs];
                next[index] = { ...next[index], answer: e.target.value };
                updateField("faqs", next);
              }}
              placeholder="Answer"
              rows={3}
              className="w-full rounded-lg border border-navy/15 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          className="admin-btn-secondary min-h-[44px] px-3 text-xs"
          onClick={() =>
            updateField("faqs", [
              ...form.faqs,
              { question: "", answer: "", sort_order: form.faqs.length },
            ])
          }
        >
          Add FAQ
        </button>
      </div>

      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-navy/10 bg-cream/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-3xl gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onSubmit}
            className="admin-btn min-h-[48px] flex-1"
          >
            {pending ? "Saving…" : "Save service"}
          </button>
          <Link href="/admin/site/services" className="admin-btn-secondary min-h-[48px] px-4 no-underline">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
