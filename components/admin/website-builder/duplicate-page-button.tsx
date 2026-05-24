"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { duplicateWebsitePage } from "@/lib/admin/actions/website-builder";

export function DuplicatePageButton({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="admin-btn-secondary text-sm"
      onClick={() =>
        startTransition(async () => {
          const newId = await duplicateWebsitePage(pageId);
          router.push(`/admin/website/builder/${newId}`);
        })
      }
    >
      {pending ? "Copying…" : "Duplicate"}
    </button>
  );
}
