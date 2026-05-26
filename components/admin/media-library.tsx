"use client";

import { useState, useTransition } from "react";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { createClient } from "@/lib/supabase/client";

type Folder = { id: string; slug: string; name: string };
type Asset = {
  id: string;
  title: string | null;
  file_url: string;
  file_type: string;
  folder_id: string | null;
  is_featured: boolean;
};

export function MediaLibrary({
  folders,
  initialAssets,
}: {
  folders: Folder[];
  initialAssets: Asset[];
}) {
  const [assets, setAssets] = useState(initialAssets);
  const [folderId, setFolderId] = useState(folders[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="admin-card space-y-3">
        <label className="block text-sm font-medium text-navy">
          Folder
          <select className="admin-input" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-navy">
          Upload
          <input
            type="file"
            accept="image/*,video/*"
            capture="environment"
            className="admin-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              startTransition(async () => {
                const uploaded = await uploadAdminFile("media-library", file, folderId || "general");
                const supabase = createClient();
                const { data } = await supabase
                  .from("media_assets")
                  .insert({
                    folder_id: folderId || null,
                    file_url: uploaded.publicUrl,
                    storage_path: uploaded.path,
                    file_type: file.type.startsWith("video") ? "video" : "image",
                    title: file.name,
                  })
                  .select("*")
                  .single();
                if (data) setAssets((a) => [data as Asset, ...a]);
              });
            }}
          />
        </label>
      </div>
      <ul className="grid grid-cols-2 gap-3">
        {assets.length === 0 ? (
          <li className="admin-card col-span-2 text-center text-sm text-charcoal/60">No media yet.</li>
        ) : (
          assets.map((asset) => (
            <li key={asset.id} className="admin-card overflow-hidden p-0">
              {asset.file_type === "video" ? (
                <video src={asset.file_url} className="aspect-square w-full object-cover" controls />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.file_url} alt={asset.title ?? ""} className="aspect-square w-full object-cover" />
              )}
              <p className="p-2 text-xs font-medium text-navy">{asset.title}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
