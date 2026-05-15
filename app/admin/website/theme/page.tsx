export const metadata = { title: "Theme" };

export default function ThemeManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">Theme / branding</h1>
      <p>
        Draft JSON supports <code className="text-zinc-300">logo_url</code>, <code className="text-zinc-300">favicon_url</code>
        , <code className="text-zinc-300">hero_overlay_opacity</code> (20–95), and accent hex fields. Use{" "}
        <code className="text-zinc-300">GET/PUT /api/admin/cms/theme</code> then <code className="text-zinc-300">POST</code>{" "}
        to publish. Logo replaces the default lockup in the public header/footer when set.
      </p>
    </div>
  );
}
