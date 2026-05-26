"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import {
  deleteMediaAsset,
  listMediaAssets,
  registerMediaAsset,
  retryMediaOptimization,
  suggestAltText,
  suggestCaption,
  updateMediaAsset,
  type MediaAssetRow,
} from "@/lib/admin/actions/media-library";
import { MEDIA_ERROR_LABELS, toUserMediaMessage, type MediaUploadErrorCode } from "@/lib/admin/media-errors";

type Folder = { id: string; slug: string; name: string };

type UploadError = {
  fileName: string;
  code: MediaUploadErrorCode | "UNKNOWN";
  message: string;
};

type UploadProgress = {
  fileName: string;
  stage: "uploading" | "saving" | "done" | "failed";
};

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
  const [loadError, setLoadError] = useState("");
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const rows = await listMediaAssets({ folderId: folderId || undefined, search, sort });
        setAssets(rows);
        setLoadError("");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Load failed");
      }
    });
  }, [folderId, search, sort]);

  useEffect(() => {
    const hasPending = assets.some((a) => a.optimization_status === "pending");
    if (!hasPending) return;

    const timer = setInterval(() => {
      startTransition(async () => {
        try {
          const rows = await listMediaAssets({ folderId: folderId || undefined, search, sort });
          setAssets(rows);
          if (selected) {
            const updated = rows.find((r) => r.id === selected.id);
            if (updated) setSelected(updated);
          }
        } catch {
          /* ignore poll errors */
        }
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [assets, folderId, search, sort, selected]);

  function folderPrefix(): string {
    if (!folderId) return "general";
    const folder = folders.find((f) => f.id === folderId);
    return folder?.slug ?? folderId;
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;

    setUploadErrors([]);
    setUploadProgress(list.map((f) => ({ fileName: f.name, stage: "uploading" })));

    const uploaded: MediaAssetRow[] = [];
    const errors: UploadError[] = [];

    for (const file of list) {
      try {
        setUploadProgress((prev) =>
          prev.map((p) => (p.fileName === file.name ? { ...p, stage: "uploading" } : p)),
        );

        const result = await uploadAdminFile("media-library", file, folderPrefix());
        const alt = await suggestAltText(file.name);

        setUploadProgress((prev) =>
          prev.map((p) => (p.fileName === file.name ? { ...p, stage: "saving" } : p)),
        );

        const registered = await registerMediaAsset({
          storagePath: result.path,
          publicUrl: result.publicUrl,
          fileName: file.name,
          mimeType: result.mimeType,
          fileType: result.fileType,
          fileSizeBytes: file.size,
          folderId: folderId || null,
          altText: alt,
        });

        if (!registered.ok) {
          errors.push({
            fileName: file.name,
            code: registered.code as MediaUploadErrorCode,
            message: registered.message,
          });
          setUploadProgress((prev) =>
            prev.map((p) => (p.fileName === file.name ? { ...p, stage: "failed" } : p)),
          );
          continue;
        }

        uploaded.push(registered.asset);
        setUploadProgress((prev) =>
          prev.map((p) => (p.fileName === file.name ? { ...p, stage: "done" } : p)),
        );
      } catch (err) {
        const { code, message } = toUserMediaMessage(err);
        errors.push({ fileName: file.name, code, message });
        setUploadProgress((prev) =>
          prev.map((p) => (p.fileName === file.name ? { ...p, stage: "failed" } : p)),
        );
      }
    }

    if (uploaded.length) setAssets((prev) => [...uploaded, ...prev]);
    if (errors.length) setUploadErrors(errors);

    setTimeout(() => setUploadProgress([]), 4000);
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
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime"
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
        <p className="mt-1 text-xs text-charcoal/50">
          Original saved immediately · WebP optimization runs in background (max 20 MB)
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{loadError}</p>
      ) : null}

      {uploadProgress.length > 0 ? (
        <ul className="space-y-1 rounded-xl bg-sky/20 px-4 py-3 text-xs text-navy">
          {uploadProgress.map((p) => (
            <li key={p.fileName} className="flex justify-between gap-2">
              <span className="truncate">{p.fileName}</span>
              <span className="shrink-0 capitalize text-charcoal/70">{p.stage}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {uploadErrors.length > 0 ? (
        <div className="space-y-2 rounded-xl bg-red-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-800">Upload errors</p>
          <ul className="space-y-1 text-sm text-red-700">
            {uploadErrors.map((e) => (
              <li key={`${e.fileName}-${e.code}`}>
                <span className="font-medium">{e.fileName}</span>
                {" — "}
                <span>{MEDIA_ERROR_LABELS[e.code] ?? e.code}: {e.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
                    {asset.optimization_status === "pending" ? (
                      <p className="text-[10px] text-ocean">Optimizing…</p>
                    ) : null}
                    {asset.optimization_status === "failed" ? (
                      <p className="text-[10px] text-amber-700">Conversion failed — original saved</p>
                    ) : null}
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
              {selected.optimization_status === "failed" ? (
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <p className="font-semibold">WebP conversion failed</p>
                  <p className="mt-1">{selected.optimization_error ?? "Original file is preserved."}</p>
                  <button
                    type="button"
                    className="admin-btn-secondary mt-2 text-xs"
                    onClick={() =>
                      startTransition(async () => {
                        await retryMediaOptimization(selected.id);
                        const rows = await listMediaAssets({ folderId: folderId || undefined, search, sort });
                        setAssets(rows);
                        const updated = rows.find((r) => r.id === selected.id);
                        if (updated) setSelected(updated);
                      })
                    }
                  >
                    Retry optimization
                  </button>
                </div>
              ) : null}
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
              <label className="block text-xs font-medium text-navy">
                Folder
                <select
                  className="admin-input text-sm"
                  value={selected.folder_id ?? ""}
                  onChange={(e) => patchAsset(selected.id, { folder_id: e.target.value || null })}
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
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
              {selected.webp_url ? (
                <p className="text-[10px] text-charcoal/50 break-all">WebP: {selected.webp_url}</p>
              ) : null}
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
