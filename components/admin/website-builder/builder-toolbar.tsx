"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ViewportMode } from "@/lib/cms/section-registry";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function BuilderToolbar({
  pageTitle,
  pageStatus,
  previewUrl,
  saveStatus,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  viewport,
  pending,
  onUndo,
  onRedo,
  onSave,
  onPublish,
  onViewportChange,
  zoom = 100,
  onZoomChange,
  focusMode = false,
  onToggleFocus,
  sidebarCollapsed = false,
  onToggleSidebar,
  onAddSection,
  onOpenAI,
}: {
  pageTitle: string;
  pageStatus: string;
  previewUrl: string;
  saveStatus: SaveStatus;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  viewport: ViewportMode;
  pending: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onPublish: () => void;
  onViewportChange: (mode: ViewportMode) => void;
  zoom?: number;
  onZoomChange?: (z: number) => void;
  focusMode?: boolean;
  onToggleFocus?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onAddSection?: () => void;
  onOpenAI?: () => void;
}) {
  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="studio-toolbar -mx-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/admin/website/pages" className="admin-btn-secondary shrink-0 px-3 text-xs no-underline">
          ← Pages
        </Link>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy">{pageTitle}</p>
          <SaveIndicator status={saveStatus} hasUnsavedChanges={hasUnsavedChanges} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-xl bg-sky/30 p-1">
          {(["desktop", "tablet", "mobile"] as ViewportMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewportChange(mode)}
              className={`studio-viewport-btn ${viewport === mode ? "studio-viewport-btn-active" : "studio-viewport-btn-idle"}`}
            >
              {mode === "desktop" ? "🖥" : mode === "tablet" ? "📱" : "📲"} {mode}
            </button>
          ))}
        </div>

        {onToggleSidebar ? (
          <button type="button" onClick={onToggleSidebar} className="admin-btn-secondary px-3 text-xs" title="Toggle sidebar">
            {sidebarCollapsed ? "Panel →" : "← Panel"}
          </button>
        ) : null}

        {onZoomChange ? (
          <div className="hidden items-center gap-1 sm:flex">
            <button type="button" className="admin-btn-secondary px-2 text-xs" onClick={() => onZoomChange(Math.max(50, zoom - 10))}>−</button>
            <span className="min-w-[3rem] text-center text-[10px] font-semibold text-navy">{zoom}%</span>
            <button type="button" className="admin-btn-secondary px-2 text-xs" onClick={() => onZoomChange(Math.min(120, zoom + 10))}>+</button>
          </div>
        ) : null}

        {onToggleFocus ? (
          <button type="button" onClick={onToggleFocus} className={`admin-btn-secondary px-3 text-xs ${focusMode ? "ring-2 ring-ocean" : ""}`}>
            Focus
          </button>
        ) : null}

        {onAddSection ? (
          <button type="button" onClick={onAddSection} className="admin-btn-secondary px-3 text-xs">
            + Section
          </button>
        ) : null}

        {onOpenAI ? (
          <button type="button" onClick={onOpenAI} className="admin-btn-secondary px-3 text-xs">
            ✨ AI
          </button>
        ) : null}

        <button type="button" disabled={!canUndo} onClick={onUndo} className="admin-btn-secondary px-3 text-xs" title="Undo">
          ↩
        </button>
        <button type="button" disabled={!canRedo} onClick={onRedo} className="admin-btn-secondary px-3 text-xs" title="Redo">
          ↪
        </button>

        <a href={previewUrl} target="_blank" rel="noreferrer" className="admin-btn-secondary px-3 text-xs no-underline">
          Preview
        </a>

        <button type="button" disabled={pending} onClick={onSave} className="admin-btn-secondary px-4 text-xs">
          Save
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onPublish}
          className="admin-btn bg-gradient-to-r from-navy to-ocean px-5 text-xs shadow-md"
        >
          {pending ? "Publishing…" : "Publish"}
        </button>

        <span className={`admin-chip ${pageStatus === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>
          {pageStatus}
        </span>
      </div>
    </motion.div>
  );
}

function SaveIndicator({ status, hasUnsavedChanges }: { status: SaveStatus; hasUnsavedChanges: boolean }) {
  if (status === "saving") {
    return (
      <span className="studio-save-indicator studio-save-saving">
        <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-ocean" />
        Saving…
      </span>
    );
  }
  if (status === "error") {
    return <span className="studio-save-indicator studio-save-error">Save failed</span>;
  }
  if (hasUnsavedChanges) {
    return (
      <span className="studio-save-indicator studio-save-unsaved">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Unsaved changes
      </span>
    );
  }
  if (status === "saved") {
    return <span className="studio-save-indicator studio-save-saved">All changes saved</span>;
  }
  return null;
}
