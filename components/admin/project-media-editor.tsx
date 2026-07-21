"use client";

import { useState } from "react";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import type { MediaAssetRow } from "@/lib/admin/actions/media-library";
import type { GalleryPhase } from "@/lib/site-content/types";

export type ProjectMediaInput = {
  media_asset_id: string;
  gallery_phase: GalleryPhase;
  caption?: string | null;
  sort_order: number;
  preview_url?: string | null;
  alt_text?: string | null;
};

const PHASES: GalleryPhase[] = ["before", "during", "after", "general"];

export function ProjectMediaEditor({
  media,
  coverMediaId,
  onChange,
  onCoverChange,
}: {
  media: ProjectMediaInput[];
  coverMediaId: string | null;
  onChange: (media: ProjectMediaInput[]) => void;
  onCoverChange: (mediaAssetId: string | null, previewUrl?: string | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function addAsset(asset: MediaAssetRow) {
    if (media.some((item) => item.media_asset_id === asset.id)) return;

    onChange([
      ...media,
      {
        media_asset_id: asset.id,
        gallery_phase: "general",
        caption: asset.caption,
        sort_order: media.length,
        preview_url: asset.webp_url ?? asset.file_url,
        alt_text: asset.alt_text,
      },
    ]);
    if (!coverMediaId) {
      onCoverChange(asset.id, asset.webp_url ?? asset.file_url);
    }
  }

  return (
    <section className="admin-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-navy">Project gallery</h2>
          <p className="mt-1 text-xs text-charcoal/60">
            Attach before/after photos from the media library. Galleries publish from the database.
          </p>
        </div>
        <button type="button" className="admin-btn-secondary min-h-[44px] px-4 text-sm" onClick={() => setPickerOpen(true)}>
          Add media
        </button>
      </div>

      {!media.length ? (
        <div className="rounded-xl border border-dashed border-navy/15 bg-cream/50 p-6 text-center">
          <p className="text-sm font-medium text-navy">No media attached yet</p>
          <p className="mt-1 text-xs text-charcoal/60">
            Add before/after photos from the media library. Set one image as the cover for cards and the homepage.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {media.map((item, index) => (
            <li key={`${item.media_asset_id}-${index}`} className="rounded-xl border border-navy/10 bg-white p-3">
              <div className="flex gap-3">
                {item.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview_url} alt={item.alt_text ?? ""} className="h-20 w-20 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-cream text-xs text-charcoal/50">
                    Media
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <select
                    value={item.gallery_phase}
                    onChange={(e) =>
                      onChange(
                        media.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, gallery_phase: e.target.value as GalleryPhase }
                            : entry,
                        ),
                      )
                    }
                    className="admin-input py-2 text-sm"
                  >
                    {PHASES.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`min-h-[40px] rounded-full px-3 text-xs font-semibold ${
                        coverMediaId === item.media_asset_id ? "bg-navy text-cream" : "bg-sky/40 text-navy"
                      }`}
                      onClick={() => onCoverChange(item.media_asset_id, item.preview_url ?? null)}
                    >
                      {coverMediaId === item.media_asset_id ? "Cover image" : "Set cover"}
                    </button>
                    <button
                      type="button"
                      className="min-h-[40px] rounded-full px-3 text-xs font-semibold text-red-700"
                      onClick={() => {
                        const next = media.filter((_, entryIndex) => entryIndex !== index);
                        onChange(next.map((entry, entryIndex) => ({ ...entry, sort_order: entryIndex })));
                        if (coverMediaId === item.media_asset_id) {
                          onCoverChange(next[0]?.media_asset_id ?? null, next[0]?.preview_url ?? null);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(_, asset) => {
          if (asset) addAsset(asset);
          setPickerOpen(false);
        }}
      />
    </section>
  );
}
