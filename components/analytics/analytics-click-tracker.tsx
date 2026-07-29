"use client";

import { useEffect } from "react";
import { trackPhoneClick, trackSmsClick } from "@/lib/analytics";

/** Delegates click tracking for tel: and sms: links across the marketing site. */
export function AnalyticsClickTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target?.href) return;
      const href = target.getAttribute("href") ?? "";
      const location = target.dataset.analyticsLocation ?? "site";

      if (href.startsWith("tel:")) {
        trackPhoneClick(location);
      } else if (href.startsWith("sms:")) {
        trackSmsClick(location);
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
