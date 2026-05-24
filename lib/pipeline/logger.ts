type PipelineContext = {
  step?: string;
  publicId?: string;
  leadId?: string;
  quoteId?: string;
  details?: Record<string, unknown>;
};

/** Server-side pipeline logger — surfaces in Vercel/server logs. */
export function logPipelineError(message: string, error: unknown, context: PipelineContext = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(
    "[PBPP Pipeline]",
    JSON.stringify({
      level: "error",
      message,
      error: err.message,
      stack: err.stack,
      ...context,
    }),
  );
}

export function logPipelineInfo(message: string, context: PipelineContext = {}) {
  console.info(
    "[PBPP Pipeline]",
    JSON.stringify({
      level: "info",
      message,
      ...context,
    }),
  );
}
