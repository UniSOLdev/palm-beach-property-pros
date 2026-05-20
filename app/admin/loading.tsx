export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-navy/10" />
      <div className="admin-card h-24 animate-pulse bg-navy/5" />
      <div className="admin-card h-32 animate-pulse bg-navy/5" />
    </div>
  );
}
