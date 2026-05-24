"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { listMediaAssets, type MediaAssetRow } from "@/lib/admin/actions/media-library";

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, asset?: MediaAssetRow) => void;
}) {
  const [assets, setAssets] = useState<MediaAssetRow[]>([]);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const rows = await listMediaAssets({ search, sort: "newest", limit: 48 });
      setAssets(rows.filter((a) => a.file_type === "image" || a.file_type === "video"));
    });
  }, [open, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/50 p-4 sm:items-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-4 py-3">
          <h3 className="font-bold text-navy">Media library</h3>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm text-charcoal/70">
            Close
          </button>
        </div>
        <div className="p-4">
          <input
            className="admin-input"
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <ul className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto px-4 pb-4 sm:grid-cols-4">
          {assets.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                className="w-full overflow-hidden rounded-xl border border-navy/10 hover:ring-2 hover:ring-ocean"
                onClick={() => onSelect(asset.webp_url ?? asset.file_url, asset)}
              >
                {asset.file_type === "video" ? (
                  <video src={asset.file_url} className="aspect-square w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.webp_url ?? asset.file_url} alt={asset.alt_text ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
