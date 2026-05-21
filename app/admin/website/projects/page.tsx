export const metadata = { title: "Projects manager" };

export default function ProjectsManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">Projects / case studies</h1>
      <p>
        API: <code className="text-zinc-300">GET/POST /api/admin/cms/projects</code>,{" "}
        <code className="text-zinc-300">PATCH/DELETE /api/admin/cms/projects/[id]</code>. Each project has slug, SEO
        JSON, optional before/after media references.
      </p>
    </div>
  );
}
