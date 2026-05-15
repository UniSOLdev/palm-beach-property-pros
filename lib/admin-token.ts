/** Deterministic admin session cookie value (Edge-safe SHA-256). */
export async function getAdminSessionTokenValue(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const salt = process.env.ADMIN_COOKIE_SECRET ?? "development-only-change-me";
  const msg = `pbpp|${password}|${salt}`;
  const data = new TextEncoder().encode(msg);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
