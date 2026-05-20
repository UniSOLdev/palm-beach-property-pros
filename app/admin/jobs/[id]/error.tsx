"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function JobDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="admin-card space-y-4">
      <h1 className="text-xl font-bold text-navy">Something went wrong</h1>
      <p className="text-sm text-charcoal/70">{error.message || "Unable to display this job."}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reset} className="admin-btn min-h-[48px]">
          Try again
        </button>
        <Link href="/admin/jobs" className="admin-btn-secondary inline-flex min-h-[48px] items-center no-underline">
          Back to jobs
        </Link>
      </div>
    </div>
  );
}
