import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  subtitle,
  actionHref,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle ? <p className="text-sm text-charcoal/70">{subtitle}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="admin-btn no-underline">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="admin-card text-center text-sm text-charcoal/60">{children}</div>;
}
