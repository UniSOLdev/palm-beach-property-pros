"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteProject,
  saveProject,
  unpublishProject,
  type ProjectInput,
} from "@/lib/admin/actions/site-projects";
import { ProjectMediaEditor, type ProjectMediaInput } from "@/components/admin/project-media-editor";
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS } from "@/lib/site-content/types";

const EMPTY: ProjectInput = {
  title: "",
  slug: "",
  city: "",
  completion_date: null,
  service_categories: [],
  service_ids: [],
  short_summary: "",
  long_description: "",
  cover_image_url: null,
  cover_media_id: null,
  testimonial: "",
  testimonial_author: "",
  is_published: false,
  is_featured: false,
  sort_order: 0,
  media: [],
};

type ServiceOption = { id: string; title: string; slug: string };

type Props = {
  services?: ServiceOption[];
  project?: ProjectInput & {
    id?: string;
    media?: ProjectMediaInput[];
  };
};

export function SiteProjectForm({ project = EMPTY, services = [] }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectInput>({
    ...EMPTY,
    ...project,
    service_ids: project.service_ids ?? [],
  });
  const [mediaItems, setMediaItems] = useState<ProjectMediaInput[]>(project.media ?? []);

  function updateField<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(category: string) {
    setForm((prev) => ({
      ...prev,
      service_categories: prev.service_categories.includes(category)
        ? prev.service_categories.filter((c) => c !== category)
        : [...prev.service_categories, category],
    }));
  }

  function toggleService(serviceId: string) {
    setForm((prev) => ({
      ...prev,
      service_ids: prev.service_ids?.includes(serviceId)
        ? (prev.service_ids ?? []).filter((id) => id !== serviceId)
        : [...(prev.service_ids ?? []), serviceId],
    }));
  }

  function buildPayload(publish?: boolean): ProjectInput {
    return {
      ...(publish !== undefined ? { ...form, is_published: publish } : form),
      media: mediaItems.map(({ media_asset_id, gallery_phase, caption, sort_order }) => ({
        media_asset_id,
        gallery_phase,
        caption,
        sort_order,
      })),
    };
  }

  function validateClient(payload: ProjectInput) {
    if (!payload.title.trim()) return "Title is required.";
    if (!payload.slug.trim()) return "Slug is required.";
    if (payload.is_published && !payload.short_summary.trim()) {
      return "Add a short summary before publishing.";
    }
    return null;
  }

  function onSubmit(publish?: boolean) {
    setError(null);
    const payload = buildPayload(publish);
    const clientError = validateClient(payload);
    if (clientError) {
      setError(clientError);
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveProject(payload, project.id);
        router.push(`/admin/site/projects/${result.id}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function onUnpublish() {
    if (!project.id) return;
    setError(null);
    startTransition(async () => {
      try {
        await unpublishProject(project.id!);
        updateField("is_published", false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unpublish failed");
      }
    });
  }

  function onDelete() {
    if (!project.id) return;
    if (!window.confirm("Delete this project permanently? This cannot be undone.")) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteProject(project.id!);
        router.push("/admin/site/projects");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <div className="space-y-4 pb-28">
      {error ? <div className="admin-card text-sm text-red-700">{error}</div> : null}

      <label className="block text-sm">
        <span className="font-medium text-navy">Title</span>
        <input
          value={form.title}
          required
          onChange={(e) => {
            updateField("title", e.target.value);
            if (!project.id && !form.slug) {
              updateField(
                "slug",
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, ""),
              );
            }
          }}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Slug</span>
        <input
          value={form.slug}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          onChange={(e) => updateField("slug", e.target.value.toLowerCase())}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
        <span className="mt-1 block text-xs text-charcoal/55">Public URL: /projects/{form.slug || "your-slug"}</span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-navy">City</span>
          <input
            value={form.city ?? ""}
            onChange={(e) => updateField("city", e.target.value)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-navy">Completion date</span>
          <input
            type="date"
            value={form.completion_date ?? ""}
            onChange={(e) => updateField("completion_date", e.target.value || null)}
            className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-navy">Service categories</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROJECT_CATEGORIES.map((cat) => (
            <label
              key={cat}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${
                form.service_categories.includes(cat)
                  ? "border-ocean bg-sky/40"
                  : "border-navy/15 bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={form.service_categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
              {PROJECT_CATEGORY_LABELS[cat]}
            </label>
          ))}
        </div>
      </fieldset>

      {services.length ? (
        <fieldset>
          <legend className="text-sm font-medium text-navy">Linked services</legend>
          <p className="mt-1 text-xs text-charcoal/60">
            Connect this project to CMS service pages for cross-linking and future automation.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {services.map((service) => (
              <label
                key={service.id}
                className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${
                  form.service_ids?.includes(service.id)
                    ? "border-ocean bg-sky/40"
                    : "border-navy/15 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.service_ids?.includes(service.id) ?? false}
                  onChange={() => toggleService(service.id)}
                />
                {service.title}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <label className="block text-sm">
        <span className="font-medium text-navy">Short summary</span>
        <textarea
          value={form.short_summary}
          onChange={(e) => updateField("short_summary", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          placeholder="One paragraph for cards and SEO"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Case study</span>
        <textarea
          value={form.long_description}
          onChange={(e) => updateField("long_description", e.target.value)}
          rows={8}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Testimonial</span>
        <textarea
          value={form.testimonial ?? ""}
          onChange={(e) => updateField("testimonial", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
          placeholder="Only add real client-approved quotes"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-navy">Testimonial author</span>
        <input
          value={form.testimonial_author ?? ""}
          onChange={(e) => updateField("testimonial_author", e.target.value)}
          className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5"
        />
      </label>

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
            checked={form.is_published}
            onChange={(e) => updateField("is_published", e.target.checked)}
          />
          Published
        </label>
      </div>

      <ProjectMediaEditor
        media={mediaItems}
        coverMediaId={form.cover_media_id ?? null}
        onChange={setMediaItems}
        onCoverChange={(mediaAssetId, previewUrl) => {
          updateField("cover_media_id", mediaAssetId);
          updateField("cover_image_url", previewUrl ?? null);
        }}
      />

      {project.id ? (
        <section className="admin-card space-y-3 border-red-200/60">
          <h2 className="text-sm font-semibold text-navy">Danger zone</h2>
          <div className="flex flex-wrap gap-2">
            {form.is_published ? (
              <button
                type="button"
                disabled={pending}
                onClick={onUnpublish}
                className="admin-btn-secondary min-h-[44px] px-4 text-sm"
              >
                Unpublish
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={onDelete}
              className="min-h-[44px] rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700"
            >
              Delete project
            </button>
          </div>
        </section>
      ) : null}

      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-navy/10 bg-cream/95 px-4 py-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => onSubmit()} className="admin-btn min-h-[48px] flex-1">
            {pending ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onSubmit(true)}
            className="admin-btn-secondary min-h-[48px] flex-1"
          >
            Save & publish
          </button>
        </div>
      </div>
    </div>
  );
}
