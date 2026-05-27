"use client";

import { useMemo, useState, useTransition } from "react";
import { BeforeAfterCompare } from "@/components/media/before-after-compare";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import {
  deleteTransformationPair,
  listTransformationPairsAction,
  reorderTransformationPairs,
  saveTransformationPair,
  type ProjectRow,
  type ResolvedPair,
} from "@/lib/admin/actions/projects";

export function TransformationPairEditor({
  initialPairs,
  initialProjects,
}: {
  initialPairs: ResolvedPair[];
  initialProjects: ProjectRow[];
}) {
  const [pairs, setPairs] = useState(initialPairs);
  const [projects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(initialPairs[0]?.id ?? null);
  const [picker, setPicker] = useState<{ field: "before" | "during" | "after"; open: boolean }>({
    field: "before",
    open: false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const selected = useMemo(() => pairs.find((p) => p.id === selectedId) ?? null, [pairs, selectedId]);

  function updateSelected(patch: Partial<ResolvedPair>) {
    if (!selected) return;
    setPairs((prev) => prev.map((p) => (p.id === selected.id ? { ...p, ...patch } : p)));
  }

  function saveCurrent() {
    if (!selected) return;
    startTransition(async () => {
      setError("");
      try {
        await saveTransformationPair({
          id: selected.id,
          project_id: selected.project_id,
          transformation_id: selected.transformation_id,
          title: selected.title,
          label: selected.label,
          before_media_id: selected.before_media_id,
          during_media_id: selected.during_media_id,
          after_media_id: selected.after_media_id,
          sort_order: selected.sort_order,
        });
        const refreshed = await listTransformationPairsAction({ projectId: selected.project_id });
        setPairs(refreshed);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  function createPair(projectId: string) {
    startTransition(async () => {
      setError("");
      try {
        await saveTransformationPair({
          project_id: projectId,
          title: "New transformation pair",
          label: "Before / after",
          sort_order: pairs.filter((p) => p.project_id === projectId).length,
        });
        const refreshed = await listTransformationPairsAction();
        setPairs(refreshed);
        setSelectedId(refreshed[refreshed.length - 1]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Create failed");
      }
    });
  }

  function removePair(id: string) {
    startTransition(async () => {
      await deleteTransformationPair(id);
      const refreshed = await listTransformationPairsAction();
      setPairs(refreshed);
      setSelectedId(refreshed[0]?.id ?? null);
    });
  }

  function movePair(id: string, direction: "up" | "down") {
    const idx = pairs.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= pairs.length) return;
    const next = [...pairs];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setPairs(next);
    startTransition(async () => {
      await reorderTransformationPairs(next.map((p) => p.id));
    });
  }

  const compare =
    selected?.before && selected?.after
      ? {
          beforeUrl: selected.before.webp_url ?? selected.before.file_url,
          afterUrl: selected.after.webp_url ?? selected.after.file_url,
          beforeAlt: selected.before.alt_text ?? "Before",
          afterAlt: selected.after.alt_text ?? "After",
          label: selected.label ?? selected.title ?? "Transformation",
        }
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="admin-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-navy">Pairs</h2>
          <select
            className="admin-input text-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) createPair(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">+ New pair…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <ul className="space-y-2">
          {pairs.map((pair, index) => (
            <li key={pair.id}>
              <button
                type="button"
                onClick={() => setSelectedId(pair.id)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  selectedId === pair.id ? "border-ocean bg-sky/30" : "border-navy/10 bg-white"
                }`}
              >
                <p className="font-semibold text-navy">{pair.label ?? pair.title ?? "Untitled pair"}</p>
                <p className="text-[11px] text-charcoal/55">{pair.project?.title ?? "Project"}</p>
              </button>
              <div className="mt-1 flex gap-1">
                <button type="button" className="text-[11px] text-ocean" onClick={() => movePair(pair.id, "up")} disabled={index === 0}>
                  ↑
                </button>
                <button type="button" className="text-[11px] text-ocean" onClick={() => movePair(pair.id, "down")} disabled={index === pairs.length - 1}>
                  ↓
                </button>
                <button type="button" className="text-[11px] text-red-700" onClick={() => removePair(pair.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <div className="space-y-4">
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        {!selected ? (
          <div className="admin-card text-sm text-charcoal/60">Select or create a transformation pair.</div>
        ) : (
          <>
            <div className="admin-card grid gap-3 md:grid-cols-2">
              <label className="block text-sm font-medium text-navy">
                Label
                <input
                  className="admin-input"
                  value={selected.label ?? ""}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                />
              </label>
              <label className="block text-sm font-medium text-navy">
                Title
                <input
                  className="admin-input"
                  value={selected.title ?? ""}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                />
              </label>
            </div>

            <div className="admin-card grid gap-3 md:grid-cols-3">
              {(["before", "during", "after"] as const).map((role) => {
                const media = selected[`${role}_media_id` as const]
                  ? selected[role === "before" ? "before" : role === "during" ? "during" : "after"]
                  : null;
                return (
                  <div key={role} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">{role}</p>
                    <div className="aspect-[4/3] overflow-hidden rounded-xl border border-navy/10 bg-cream/40">
                      {media ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={media.webp_url ?? media.file_url} alt={media.alt_text ?? role} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-charcoal/50">No media assigned</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="admin-btn-secondary w-full text-xs"
                      onClick={() => setPicker({ field: role, open: true })}
                    >
                      Choose {role}
                    </button>
                  </div>
                );
              })}
            </div>

            {compare ? (
              <div className="admin-card">
                <p className="mb-3 text-sm font-semibold text-navy">Compare preview</p>
                <BeforeAfterCompare
                  project={{
                    title: compare.label,
                    isScaffold: false,
                    before: { id: "before", category: "transformation", src: compare.beforeUrl, alt: compare.beforeAlt, source: "authentic" },
                    after: { id: "after", category: "transformation", src: compare.afterUrl, alt: compare.afterAlt, source: "authentic" },
                  }}
                />
              </div>
            ) : null}

            <button type="button" className="admin-btn min-h-[48px]" disabled={pending} onClick={saveCurrent}>
              Save pair
            </button>
          </>
        )}
      </div>

      <MediaPickerModal
        open={picker.open}
        onClose={() => setPicker((p) => ({ ...p, open: false }))}
        onSelect={(_url, asset) => {
          if (!selected || !asset) return;
          const field = `${picker.field}_media_id` as "before_media_id" | "during_media_id" | "after_media_id";
          const mediaKey = picker.field;
          updateSelected({
            [field]: asset.id,
            [mediaKey]: {
              id: asset.id,
              file_url: asset.file_url,
              webp_url: asset.webp_url,
              thumbnail_url: asset.webp_url,
              alt_text: asset.alt_text,
              title: asset.title,
              media_type: asset.file_type,
              media_category: asset.before_after_role,
              width: asset.width,
              height: asset.height,
            },
          });
          setPicker((p) => ({ ...p, open: false }));
        }}
      />
    </div>
  );
}
