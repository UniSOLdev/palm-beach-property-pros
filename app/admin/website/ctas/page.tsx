export const metadata = { title: "CTA manager" };

export default function CtasManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">CTAs</h1>
      <p>
        API: <code className="text-zinc-300">GET/POST /api/admin/cms/ctas</code>,{" "}
        <code className="text-zinc-300">PATCH/DELETE /api/admin/cms/ctas/[id]</code>. Central registry for reusable
        buttons; navigation shell and homepage JSON can reference the same destinations.
      </p>
    </div>
  );
}
