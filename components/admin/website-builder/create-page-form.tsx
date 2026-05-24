"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createWebsitePage } from "@/lib/admin/actions/website-builder";

const PAGE_TYPES = [
  { value: "homepage", label: "Homepage" },
  { value: "service", label: "Service page" },
  { value: "landing", label: "Landing page" },
  { value: "city_seo", label: "City SEO page" },
  { value: "gallery", label: "Gallery page" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "page", label: "General page" },
];

export function CreatePageForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [pageType, setPageType] = useState("service");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="admin-btn text-sm" onClick={() => setOpen(true)}>
        + New page
      </button>
    );
  }

  return (
    <form
      className="admin-card space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        startTransition(async () => {
          try {
            const id = await createWebsitePage({ slug, title, page_type: pageType });
            router.push(`/admin/website/builder/${id}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Create failed");
          }
        });
      }}
    >
      <h3 className="font-bold text-navy">Create page</h3>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="block text-sm font-medium text-navy">
        Title
        <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="block text-sm font-medium text-navy">
        Slug
        <input className="admin-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="jupiter-pressure-washing" required />
      </label>
      <label className="block text-sm font-medium text-navy">
        Page type
        <select className="admin-input" value={pageType} onChange={(e) => setPageType(e.target.value)}>
          {PAGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="admin-btn flex-1 text-sm">
          Create & open builder
        </button>
        <button type="button" className="admin-btn-secondary text-sm" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
