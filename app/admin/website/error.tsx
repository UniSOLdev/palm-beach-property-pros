"use client";

import { LoadError } from "@/components/admin/load-error";

export default function WebsiteError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <LoadError
      title="Site Studio error"
      message={error.message}
      retryHref="/admin/website"
    />
  );
}
