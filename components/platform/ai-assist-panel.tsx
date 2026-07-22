"use client";

import { useState, useTransition } from "react";
import type { AIAssistTask } from "@/lib/platform/ai-assistant";

export function AiAssistPanel({
  task,
  label,
  context,
  onApply,
}: {
  task: AIAssistTask;
  label: string;
  context: string;
  onApply?: (text: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-ocean/20 bg-sky/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ocean">Optional AI assist</p>
        <button
          type="button"
          disabled={pending || !context.trim()}
          className="admin-btn-secondary min-h-[40px] px-3 text-xs"
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const response = await fetch("/api/admin/ai-assist", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ task, context }),
                });
                const data = (await response.json()) as { text?: string; error?: string };
                if (!response.ok) throw new Error(data.error ?? "AI assist failed");
                setResult(data.text ?? "");
              } catch (e) {
                setError(e instanceof Error ? e.message : "AI assist failed");
              }
            });
          }}
        >
          {pending ? "Generating…" : label}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      {result ? (
        <div className="mt-2 space-y-2">
          <p className="whitespace-pre-wrap text-sm text-charcoal/90">{result}</p>
          {onApply ? (
            <button type="button" className="admin-btn-secondary min-h-[40px] px-3 text-xs" onClick={() => onApply(result)}>
              Use this text
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
