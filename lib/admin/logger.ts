type AdminLogContext = {
  route?: string;
  query?: string;
  userId?: string | null;
  details?: Record<string, unknown>;
};

/** Server-side admin error logger — surfaces in Vercel/server logs. */
export function logAdminError(message: string, error: unknown, context: AdminLogContext = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload = {
    level: "error",
    area: "admin",
    message,
    error: err.message,
    stack: err.stack,
    ...context,
  };
  console.error("[PBPP Admin]", JSON.stringify(payload));
}

export function logAdminInfo(message: string, context: AdminLogContext = {}) {
  console.info("[PBPP Admin]", JSON.stringify({ level: "info", area: "admin", message, ...context }));
}
