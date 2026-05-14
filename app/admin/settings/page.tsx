import { AdminPageHeader, Card } from "@/components/admin/ui";
import { adminSeed } from "@/lib/admin/seed";

export default function SettingsPage() {
  const s = adminSeed.businessSettings;

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Brand, terms, and payment defaults flow into quotes, invoices, and client pages."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Business profile">
          <dl className="grid gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Business name</dt>
              <dd className="mt-1 font-semibold text-navy">{s.businessName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Phone</dt>
              <dd className="mt-1 text-charcoal">{s.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Email</dt>
              <dd className="mt-1 text-charcoal">{s.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Website</dt>
              <dd className="mt-1 text-charcoal">{s.website}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Address / service area</dt>
              <dd className="mt-1 text-charcoal">{s.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Google review link</dt>
              <dd className="mt-1 break-all text-charcoal">{s.googleReviewUrl}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Logo</dt>
              <dd className="mt-1 text-charcoal">{s.logoUrl ?? "Not set (add in Supabase storage later)"}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Terms & payments">
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Default invoice terms</div>
              <p className="mt-2 leading-relaxed text-charcoal/80">{s.defaultInvoiceTerms}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Default quote terms</div>
              <p className="mt-2 leading-relaxed text-charcoal/80">{s.defaultQuoteTerms}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Payment methods accepted</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {s.paymentMethodsAccepted.map((p) => (
                  <span key={p} className="rounded-full bg-sky px-3 py-1 text-xs font-semibold text-navy">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Brand colors" className="lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-navy/10 p-4">
              <div className="h-12 w-12 rounded-xl shadow-inner" style={{ background: s.brandPrimary }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Primary navy</div>
                <div className="font-mono text-sm text-navy">{s.brandPrimary}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-navy/10 p-4">
              <div className="h-12 w-12 rounded-xl shadow-inner" style={{ background: s.brandAccent }} />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">Accent leaf</div>
                <div className="font-mono text-sm text-navy">{s.brandAccent}</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-charcoal/60">
            These mirror Tailwind tokens <code className="rounded bg-sky/50 px-1">navy</code> and{" "}
            <code className="rounded bg-sky/50 px-1">leaf</code> for a cohesive premium field brand.
          </p>
        </Card>
      </div>
    </div>
  );
}
