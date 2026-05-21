"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateJobButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "creating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        disabled={state === "creating"}
        onClick={async () => {
          setState("creating");
          setMessage(null);
          try {
            const res = await fetch("/api/admin/jobs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            const data = await res.json();
            if (res.ok && data.job?.id) {
              router.push(`/admin/jobs/${data.job.id as string}`);
              return;
            }
            setState("error");
            setMessage(data.error ?? "Could not create job");
          } catch {
            setState("error");
            setMessage("Network error creating job");
          }
        }}
        className="min-h-[44px] rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-900/25 transition hover:bg-sky-400 disabled:opacity-60"
      >
        {state === "creating" ? "Creating…" : "New job"}
      </button>
      {message ? (
        <p className="text-xs text-red-300" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
