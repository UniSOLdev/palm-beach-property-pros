"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminToast } from "@/components/admin/admin-toast";
import {
  archiveEntityAction,
  duplicateEntityAction,
  restoreEntityAction,
  softDeleteEntityAction,
  unarchiveEntityAction,
} from "@/lib/admin/actions/entity-lifecycle";
import { entityEditPath } from "@/lib/admin/lifecycle/constants";
import type { AdminEntityType } from "@/lib/admin/lifecycle/types";

type Props = {
  entityType: AdminEntityType;
  entityId: string;
  entityLabel: string;
  isArchived?: boolean;
  isDeleted?: boolean;
  editHref?: string | null;
  onComplete?: () => void;
};

type ConfirmKind = "archive" | "delete" | "duplicate";

export function EntityLifecycleMenu({
  entityType,
  entityId,
  entityLabel,
  isArchived = false,
  isDeleted = false,
  editHref,
  onComplete,
}: Props) {
  const router = useRouter();
  const { toast, toastWithUndo } = useAdminToast();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const [busy, startTransition] = useTransition();

  const edit = editHref ?? entityEditPath(entityType, entityId);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  function finish(message: string) {
    toast(message, "success");
    setMenuOpen(false);
    setConfirmKind(null);
    router.refresh();
    onComplete?.();
  }

  function runArchive() {
    startTransition(async () => {
      try {
        await archiveEntityAction(entityType, entityId, `${entityLabel} archived`);
        toastWithUndo("Archived", async () => {
          await unarchiveEntityAction(entityType, entityId);
        });
        setMenuOpen(false);
        setConfirmKind(null);
        router.refresh();
        onComplete?.();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Archive failed", "error");
      }
    });
  }

  function runDelete() {
    startTransition(async () => {
      try {
        await softDeleteEntityAction(entityType, entityId, `${entityLabel} deleted`);
        toastWithUndo("Moved to trash", async () => {
          await restoreEntityAction(entityType, entityId);
        });
        setMenuOpen(false);
        setConfirmKind(null);
        router.refresh();
        onComplete?.();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Delete failed", "error");
      }
    });
  }

  function runRestore() {
    startTransition(async () => {
      try {
        await restoreEntityAction(entityType, entityId);
        finish("Restored from trash");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Restore failed", "error");
      }
    });
  }

  function runUnarchive() {
    startTransition(async () => {
      try {
        await unarchiveEntityAction(entityType, entityId);
        finish("Restored from archive");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Unarchive failed", "error");
      }
    });
  }

  function runDuplicate() {
    startTransition(async () => {
      try {
        const result = await duplicateEntityAction(entityType, entityId);
        finish("Duplicate created");
        const path = entityEditPath(entityType, result.id);
        if (path) router.push(path);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Duplicate failed", "error");
      }
    });
  }

  function onConfirm() {
    if (confirmKind === "archive") runArchive();
    else if (confirmKind === "delete") runDelete();
    else if (confirmKind === "duplicate") runDuplicate();
  }

  const dialogCopy =
    confirmKind === "archive"
      ? {
          title: "Archive this record?",
          description: `${entityLabel} will be hidden from default lists. You can restore it from archived view.`,
          confirmLabel: "Archive",
          destructive: false,
        }
      : confirmKind === "delete"
        ? {
            title: "Move to trash?",
            description: `${entityLabel} will be soft-deleted — not permanently removed. Invoice numbers and PDF history are preserved for accounting integrity.`,
            confirmLabel: "Delete",
            destructive: true,
          }
        : confirmKind === "duplicate"
          ? {
              title: "Duplicate record?",
              description: `Create a copy of ${entityLabel} as a new draft.`,
              confirmLabel: "Duplicate",
              destructive: false,
            }
          : null;

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        className="admin-btn-secondary min-h-[44px] px-4"
        aria-expanded={menuOpen}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
      >
        More ▾
      </button>
      {menuOpen ? (
        <div className="absolute right-0 z-20 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-navy/10 bg-white py-1 shadow-lift">
          {edit ? (
            <Link
              href={edit}
              className="block px-4 py-2.5 text-sm text-navy no-underline hover:bg-sky/30"
              onClick={() => setMenuOpen(false)}
            >
              Edit
            </Link>
          ) : null}
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-sky/30"
            onClick={() => {
              setMenuOpen(false);
              setConfirmKind("duplicate");
            }}
          >
            Duplicate
          </button>
          {isDeleted ? (
            <button
              type="button"
              className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-sky/30"
              onClick={runRestore}
            >
              Restore
            </button>
          ) : isArchived ? (
            <button
              type="button"
              className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-sky/30"
              onClick={runUnarchive}
            >
              Unarchive
            </button>
          ) : (
            <>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-navy hover:bg-sky/30"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmKind("archive");
                }}
              >
                Archive
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmKind("delete");
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ) : null}

      {dialogCopy ? (
        <ConfirmDialog
          open={confirmKind !== null}
          title={dialogCopy.title}
          description={dialogCopy.description}
          confirmLabel={dialogCopy.confirmLabel}
          destructive={dialogCopy.destructive}
          loading={busy}
          onCancel={() => setConfirmKind(null)}
          onConfirm={onConfirm}
        />
      ) : null}
    </div>
  );
}
