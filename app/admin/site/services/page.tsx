import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { listAdminServices } from "@/lib/admin/actions/site-services";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  let services: Awaited<ReturnType<typeof listAdminServices>> = [];
  let error = "";

  try {
    services = await listAdminServices();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load services";
  }

  return (
    <div className="space-y-4 pb-8">
      <Link href="/admin/site" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← Website CMS
      </Link>
      <AdminPageHeader title="Services" subtitle="Manage public service pages" />

      {error ? (
        <div className="admin-card text-sm text-red-700">{error}</div>
      ) : (
        <ul className="space-y-3">
          {services.map((service) => (
            <li key={service.id}>
              <Link
                href={`/admin/site/services/${service.id}`}
                className="admin-card flex items-center justify-between gap-3 no-underline"
              >
                <div>
                  <p className="font-semibold text-navy">{service.title}</p>
                  <p className="text-xs text-charcoal/60">/{service.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.is_featured ? (
                    <span className="admin-chip bg-ocean/15 text-ocean">Featured</span>
                  ) : null}
                  <span
                    className={`admin-chip ${service.is_active ? "bg-leaf/20 text-leaf" : "bg-charcoal/10 text-charcoal/70"}`}
                  >
                    {service.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
