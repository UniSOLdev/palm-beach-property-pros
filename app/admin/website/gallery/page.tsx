export const metadata = { title: "Gallery manager" };

export default function GalleryManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">Gallery</h1>
      <p>
        CRUD API: <code className="text-zinc-300">GET/POST /api/admin/cms/gallery</code> and{" "}
        <code className="text-zinc-300">PATCH/DELETE /api/admin/cms/gallery/[id]</code>. Link before/after rows to media
        asset IDs from the library.
      </p>
    </div>
  );
}
