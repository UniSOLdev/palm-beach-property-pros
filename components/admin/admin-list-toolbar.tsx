import { Suspense, type ReactNode } from "react";
import { ShowArchivedToggle } from "@/components/admin/show-archived-toggle";

export function AdminListToolbar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Suspense fallback={null}>
        <ShowArchivedToggle />
      </Suspense>
      {children}
    </div>
  );
}
