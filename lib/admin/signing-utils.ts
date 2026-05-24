export function signingPublicUrl(token: string) {
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
  return `${origin}/sign/${token}`;
}
