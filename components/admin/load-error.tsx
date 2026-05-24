"use client";

import Link from "next/link";

export function LoadError({
  title = "Could not load data",
  message,
  retryHref,
}: {
  title?: string;
  message: string;
  retryHref?: string;
}) {
  return (
    <div className="admin-card space-y-3 border border-red-200 bg-red-50/80">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      <p className="text-sm text-red-800">{message}</p>
      <div className="flex flex-wrap gap-2">
        {retryHref ? (
          <Link href={retryHref} className="admin-btn inline-flex no-underline">
            Try again
          </Link>
        ) : (
          <button type="button" className="admin-btn" onClick={() => window.location.reload()}>
            Try again
          </button>
        )}
        <Link href="/admin" className="admin-btn-secondary inline-flex no-underline">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
