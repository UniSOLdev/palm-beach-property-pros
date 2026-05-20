import Link from "next/link";

export default function JobNotFound() {
  return (
    <div className="admin-card space-y-4 text-center">
      <h1 className="text-xl font-bold text-navy">Job not found</h1>
      <p className="text-sm text-charcoal/70">This job may have been archived or the link is invalid.</p>
      <Link href="/admin/jobs" className="admin-btn inline-flex no-underline">
        Back to jobs
      </Link>
    </div>
  );
}
