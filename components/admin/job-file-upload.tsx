"use client";

import { useState } from "react";

type Props = {
  jobId: string;
};

export function JobFileUpload({ jobId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("job_id", jobId);
      form.append("file_type", file.type.startsWith("image/") ? "photo" : "document");
      const res = await fetch("/api/admin/files/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setMessage(`Uploaded ${data.file?.file_name ?? "file"}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Photos & receipts</p>
      <label className="mt-3 flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-black/20 px-4 text-sm font-medium text-sky-200">
        {uploading ? "Uploading…" : "Tap to upload"}
        <input
          type="file"
          accept="image/*,application/pdf"
          capture="environment"
          className="sr-only"
          disabled={uploading}
          onChange={onFileChange}
        />
      </label>
      {message ? <p className="mt-2 text-xs text-zinc-400">{message}</p> : null}
    </div>
  );
}
