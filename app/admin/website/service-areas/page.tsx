export const metadata = { title: "Service areas" };

export default function ServiceAreasManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">Service areas</h1>
      <p>
        API: <code className="text-zinc-300">GET/POST /api/admin/cms/service-areas</code>,{" "}
        <code className="text-zinc-300">PATCH/DELETE /api/admin/cms/service-areas/[id]</code>. Prepares dynamic city
        landing pages (routes can be wired when you publish slugs).
      </p>
    </div>
  );
}
