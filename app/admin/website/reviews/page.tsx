export const metadata = { title: "Reviews manager" };

export default function ReviewsManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">Reviews</h1>
      <p>
        API: <code className="text-zinc-300">GET/POST /api/admin/cms/reviews</code>,{" "}
        <code className="text-zinc-300">PATCH/DELETE /api/admin/cms/reviews/[id]</code>. Structured for future Google
        import — store source, service slugs, and homepage visibility flags.
      </p>
    </div>
  );
}
