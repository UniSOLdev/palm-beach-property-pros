import type { ReactNode } from "react";
import { aspectClass } from "@/lib/media/resolve";
import type { MediaAspect } from "@/lib/media/types";

export function MediaFrame({
  aspect = "landscape",
  className = "",
  children,
}: {
  aspect?: MediaAspect;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`media-frame relative overflow-hidden ${aspectClass(aspect)} ${className}`}>
      {children}
    </div>
  );
}
