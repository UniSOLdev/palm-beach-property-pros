/** Restrict post-login redirects to same-app admin paths only. */
export function safeAdminRedirectPath(next: string | null | undefined): string {
  if (!next || typeof next !== "string") return "/admin";
  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("://")) {
    return "/admin";
  }
  return next;
}
