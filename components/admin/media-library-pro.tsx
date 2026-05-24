"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadAdminFile } from "@/lib/admin/upload";
import {
  deleteMediaAsset,
  listMediaAssets,
  suggestAltText,
  suggestCaption,
  updateMediaAsset,
  type MediaAssetRow,
} from "@/lib/admin/actions/media-library";
import { createClient } from "@/lib/supabase/client";

type Folder = { id: string; slug: string; name: string };

export function MediaLibraryPro({
  folders,
  initialAssets,
}: {
  folders: Folder[];
  initialAssets: MediaAssetRow[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [folderId, setFolderId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [selected, setSelected] = useState<MediaAssetRow | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    startTransition(async () => {
      try {
        const rows = await listMediaAssets({ folderId: folderId || undefined, search, sort });
        setAssets(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      }
    });
  }, [folderId, search, sort]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setError("");
    startTransition(async () => {
      const supabase = createClient();
      const uploaded: MediaAssetRow[] = [];
      for (const file of list) {
        try {
          const result = await uploadAdminFile("media-library", file, folderId || "general");
          const alt = await suggestAltText(file.name);
          const { data } = await supabase
            .from("media_assets")
            .insert({
              folder_id: folderId || null,
              file_url: result.publicUrl,
              storage_path: result.path,
              file_type: file.type.startsWith("video") ? "video" : "image",
              title: file.name,
              alt_text: alt,
              file_size_bytes: file.size,
            })
            .select("*")
            .single();
          if (data) uploaded.push(data as MediaAssetRow);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed");
        }
      }
      if (uploaded.length) setAssets((prev) => [...uploaded, ...prev]);
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="admin-card flex flex-wrap gap-3">
        <select className="admin-input w-auto min-w-[140px]" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
          <option value="">All folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input
          className="admin-input min-w-[180px] flex-1"
          placeholder="Search title, alt, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="admin-input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name</option>
        </select>
        <label className="admin-btn cursor-pointer text-xs no-underline">
          Bulk upload
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </label>
      </div>

      {/* Drop zone */}
      <div
        className={`admin-card border-2 border-dashed text-center transition ${dragOver ? "border-ocean bg-sky/30" : "border-navy/15"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm text-charcoal/70">Drag & drop images or videos here</p>
        <p className="mt-1 text-xs text-charcoal/50">WebP conversion and CDN optimization applied on publish</p>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      {pending ? <p className="text-xs text-ocean">Working…</p> : null}

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Masonry grid */}
        <ul className="columns-2 gap-3 md:columns-3 xl:columns-4 flex-1">
          {assets.length === 0 ? (
            <li className="admin-card col-span-full break-inside-avoid text-center text-sm text-charcoal/60">
              No media yet. Upload to get started.
            </li>
          ) : (
            assets.map((asset) => (
              <li key={asset.id} className="mb-3 break-inside-avoid">
                <motion.button
                  type="button"
                  layout
                  onClick={() => setSelected(asset)}
                  className={`w-full overflow-hidden rounded-xl border bg-white text-left shadow-card transition hover:shadow-glow ${selected?.id === asset.id ? "ring-2 ring-ocean" : "border-navy/10"}`}
                >
                  {asset.file_type === "video" ? (
                    <video src={asset.webp_url ?? asset.file_url} className="aspect-video w-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.webp_url ?? asset.file_url}
                      alt={asset.alt_text ?? asset.title ?? ""}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-2">
                    <p className="truncate text-xs font-semibold text-navy">{asset.title}</p>
                    {asset.city ? <p className="text-[10px] text-charcoal/60">{asset.city}</p> : null}
                    {asset.tags?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="admin-chip bg-sky/50 text-[10px] text-navy">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </motion.button>
              </li>
            ))
          )}
        </ul>

        {/* Metadata panel */}
        <AnimatePresence>
          {selected ? (
            <motion.aside
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="admin-card w-full shrink-0 space-y-3 lg:w-80"
            >
              <h3 className="font-bold text-navy">Asset details</h3>
              <MetaField label="Title" value={selected.title ?? ""} onSave={(v) => patchAsset(selected.id, { title: v })} />
              <MetaField label="Alt text" value={selected.alt_text ?? ""} onSave={(v) => patchAsset(selected.id, { alt_text: v })} />
              <MetaField label="Caption" value={selected.caption ?? ""} onSave={(v) => patchAsset(selected.id, { caption: v })} multiline />
              <MetaField label="Service category" value={selected.service_category ?? ""} onSave={(v) => patchAsset(selected.id, { service_category: v })} />
              <MetaField label="City" value={selected.city ?? ""} onSave={(v) => patchAsset(selected.id, { city: v })} />
              <MetaField label="Job reference" value={selected.job_reference ?? ""} onSave={(v) => patchAsset(selected.id, { job_reference: v })} />
              <MetaField label="Before/after group ID" value={selected.before_after_group ?? ""} onSave={(v) => patchAsset(selected.id, { before_after_group: v })} />
              <label className="block text-xs font-medium text-navy">
                Before/after role
                <select
                  className="admin-input text-sm"
                  value={selected.before_after_role ?? ""}
                  onChange={(e) => patchAsset(selected.id, { before_after_role: e.target.value || null })}
                >
                  <option value="">None</option>
                  <option value="before">Before</option>
                  <option value="after">After</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="admin-btn-secondary text-xs"
                  onClick={() =>
                    startTransition(async () => {
                      const alt = await suggestAltText(selected.title ?? "", selected.service_category);
                      patchAsset(selected.id, { alt_text: alt });
                    })
                  }
                >
                  AI alt text
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary text-xs"
                  onClick={() =>
                    startTransition(async () => {
                      const cap = await suggestCaption(selected.title ?? "", selected.city);
                      patchAsset(selected.id, { caption: cap });
                    })
                  }
                >
                  AI caption
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary text-xs text-red-700"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteMediaAsset(selected.id);
                      setAssets((a) => a.filter((x) => x.id !== selected.id));
                      setSelected(null);
                    })
                  }
                >
                  Delete
                </button>
              </div>
              <p className="text-[10px] text-charcoal/50 break-all">{selected.file_url}</p>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );

  function patchAsset(id: string, patch: Partial<MediaAssetRow>) {
    setAssets((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (selected?.id === id) setSelected((s) => (s ? { ...s, ...patch } : s));
    startTransition(async () => {
      await updateMediaAsset(id, patch);
    });
  }
}

function MetaField({
  label,
  value,
  onSave,
  multiline,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <label className="block text-xs font-medium text-navy">
      {label}
      {multiline ? (
        <textarea
          className="admin-input min-h-[64px] text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== value && onSave(draft)}
        />
      ) : (
        <input
          className="admin-input text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== value && onSave(draft)}
        />
      )}
    </label>
  );
}
