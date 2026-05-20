export default function JobDetailLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading job">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-sky/50" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-card h-20 animate-pulse bg-cream/80" />
        ))}
      </div>
      <div className="admin-card h-48 animate-pulse bg-cream/80" />
      <div className="admin-card h-64 animate-pulse bg-cream/80" />
    </div>
  );
}
