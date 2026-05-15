export const metadata = { title: "SEO manager" };

export default function SeoManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">SEO & metadata</h1>
      <p>
        Map keys like <code className="text-zinc-300">home</code>, <code className="text-zinc-300">services_index</code>
        , and <code className="text-zinc-300">service:window-cleaning</code>. Use{" "}
        <code className="text-zinc-300">GET/PUT /api/admin/cms/seo</code> then <code className="text-zinc-300">POST</code>{" "}
        to publish. Public routes read published entries when present.
      </p>
    </div>
  );
}
