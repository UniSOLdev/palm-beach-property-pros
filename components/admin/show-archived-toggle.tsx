"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ShowArchivedToggle({ label = "Show archived" }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const show = searchParams.get("archived") === "1";

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-navy/10 bg-white/80 px-3 py-2 text-sm text-charcoal/80 shadow-sm">
      <input
        type="checkbox"
        checked={show}
        className="h-4 w-4 rounded border-navy/20 text-ocean focus:ring-ocean"
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.checked) params.set("archived", "1");
          else params.delete("archived");
          const qs = params.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
      />
      {label}
    </label>
  );
}
