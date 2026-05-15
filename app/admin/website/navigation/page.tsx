export const metadata = { title: "Navigation & footer" };

export default function NavigationManagerPage() {
  return (
    <div className="max-w-2xl space-y-3 text-sm text-zinc-400">
      <h1 className="text-xl font-semibold text-white">Navigation & footer</h1>
      <p>
        Edit draft shell JSON via <code className="text-zinc-300">GET/PUT /api/admin/cms/site-shell</code> then{" "}
        <code className="text-zinc-300">POST /api/admin/cms/site-shell</code> to publish. Controls header nav, quote
        button, mobile CTAs, footer blurb, hours, and Linkr caption.
      </p>
    </div>
  );
}
