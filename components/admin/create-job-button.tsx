"use client";

export function CreateJobButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          const res = await fetch("/api/admin/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{}",
          });
          const data = await res.json();
          if (res.ok && data.job?.id) {
            window.location.href = `/admin/jobs/${data.job.id as string}`;
            return;
          }
          alert(data.error ?? "Could not create job");
        } catch {
          alert("Network error");
        }
      }}
      className="rounded-xl bg-sky-500/90 px-5 py-2.5 text-sm font-semibold text-sky-950 shadow-lg shadow-sky-900/25 transition hover:bg-sky-400"
    >
      New job
    </button>
  );
}
